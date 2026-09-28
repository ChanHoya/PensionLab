import { runPensionSimulation, type CashFlowItem } from "@/services/pensionCalculator";
import { calcBasicPension, type BasicPensionPerson } from "@/services/basicPensionCalculator";
import { NPS_RULES, SURVIVOR_OVERLAP_RATE, survivorRateForMonths } from "@/config/npsRules";
import type {
  BasicPensionState,
  NationalPensionState,
  PensionInsuranceState,
  PersonalPensionSavingsState,
  RetirementPensionState,
  SimulationParamsState,
} from "@/store/usePensionStore";

export interface PersonPensions {
  national: NationalPensionState;
  retirementPensions: RetirementPensionState[];
  personalPensions: PersonalPensionSavingsState[];
  pensionInsurances: PensionInsuranceState[];
}

export type SurvivorChoice = "SURVIVOR" | "OWN_PLUS_30";

export interface PersonYear {
  alive: boolean;
  age: number;
  national: number; // 받는 국민연금 (유족연금 선택 시 유족연금) — 만원/월
  basic: number;
  retirement: number;
  personal: number;
  insurance: number;
  total: number;
  survivorChoice: SurvivorChoice | null; // 배우자 사망 후 중복급여 조정 선택
}

export interface CoupleYear {
  year: number;
  self: PersonYear;
  spouse: PersonYear | null;
  household: number; // 가구 합산 (만원/월)
}

export interface CoupleSimulationResult {
  rows: CoupleYear[];
  firstDeath: { who: "SELF" | "SPOUSE"; year: number; age: number } | null;
  lifetime: { self: number; spouse: number; household: number }; // 생애 누적 수령액 (만원, 명목)
}

const ZERO_BASIC: BasicPensionState = {
  householdType: "SINGLE",
  recognizedIncome: 0,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
  region: "METRO",
  generalProperty: 0,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  selfEarnedIncome: 0,
  selfOtherIncome: 0,
  selfOccupational: false,
  spouseEarnedIncome: 0,
  spouseOtherIncome: 0,
  spouseOccupational: false,
  applyToSimulation: false,
};

interface Track {
  startAge: number;
  lifeExpectancy: number;
  flows: Map<number, CashFlowItem>;
  national: NationalPensionState;
}

// 국민연금 연기 연수 (0~5년)
export function deferYearsOf(params: SimulationParamsState): number {
  return Math.min(NPS_RULES.maxDeferralYears, Math.max(0, Math.floor(params.nationalPensionDeferYears || 0)));
}

function track(p: PersonPensions, params: SimulationParamsState): Track {
  // 연기하면 개시 나이가 늦어지고 1년당 7.2% 가산. 유족연금은 가산 전 기본 연금으로 계산하므로 national은 원래 값을 둔다
  const defer = deferYearsOf(params);
  const deferredNational = { ...p.national, expectedMonthlyPension: p.national.expectedMonthlyPension * (1 + NPS_RULES.deferralBonusPerYear * defer) };
  // 기초연금은 가구 단위로 따로 계산하므로 개인 시뮬레이션에서는 0으로 둔다
  const sim = runPensionSimulation(
    deferredNational,
    ZERO_BASIC,
    p.retirementPensions,
    p.personalPensions,
    p.pensionInsurances,
    { ...params, nationalPensionStartAge: params.nationalPensionStartAge + defer },
    { privatePensionEndAge: params.privatePensionEndAge }
  );
  return {
    startAge: params.nationalPensionStartAge,
    lifeExpectancy: params.expectedLifeExpectancy,
    flows: new Map(sim.cashFlows.map((cf) => [cf.age, cf])),
    national: p.national,
  };
}

// 사망한 배우자가 살아 있었다면 그 해 받았을 국민연금 (개시 후 물가연동)
function wouldBeNational(t: Track, age: number, inflationRate: number): number {
  const base = t.national.expectedMonthlyPension;
  if (base <= 0) return 0;
  return base * Math.pow(1 + inflationRate / 100, Math.max(0, age - t.startAge));
}

const aShareOf = (n: NationalPensionState) => {
  const A = n.aValue || NPS_RULES.aValue;
  const B = n.bValue || n.currentStandardMonthlyIncome || A;
  return A / (A + B);
};

// 배우자 시뮬레이션용 매개변수: 나이·은퇴·기대수명·국민연금 개시만 배우자 값으로 바꾼다
export function personParams(params: SimulationParamsState, who: "SELF" | "SPOUSE"): SimulationParamsState {
  if (who === "SELF") return params;
  return {
    ...params,
    currentAge: params.spouseAge ?? params.currentAge,
    retirementAge: params.spouseRetirementAge,
    expectedLifeExpectancy: params.spouseLifeExpectancy,
    nationalPensionStartAge: params.spouseNationalPensionStartAge,
    nationalPensionDeferYears: params.spouseNationalPensionDeferYears,
    privatePensionEndAge: params.spousePrivatePensionEndAge,
  };
}

// 기초연금 소득인정액에 넣을 사적연금(퇴직·개인연금·연금보험) 월 수령액, 그 나이 기준 현재가치
export function privatePensionAt(p: PersonPensions, params: SimulationParamsState, age: number): number {
  const sim = runPensionSimulation(p.national, ZERO_BASIC, p.retirementPensions, p.personalPensions, p.pensionInsurances, params, {
    privatePensionEndAge: params.privatePensionEndAge,
  });
  const cf = sim.cashFlows.find((c) => c.age === age);
  if (!cf) return 0;
  return (cf.retirement + cf.personal + cf.insurance) / Math.pow(1 + params.inflationRate / 100, Math.max(0, age - sim.currentAge));
}

// 부부 통합 시뮬레이션: 사람별 국민·퇴직·개인연금 흐름 + 가구 기초연금 + 먼저 사망 시 중복급여 조정(국민연금법 제56조)
export function runCoupleSimulation(
  self: PersonPensions,
  spouse: PersonPensions | null,
  params: SimulationParamsState,
  basic: BasicPensionState,
  baseYear: number = new Date().getFullYear()
): CoupleSimulationResult {
  const selfParams = personParams(params, "SELF");
  const spouseParams = personParams(params, "SPOUSE");
  const st = track(self, selfParams);
  const sp = spouse ? track(spouse, spouseParams) : null;
  const selfAge0 = selfParams.currentAge;
  const spouseAge0 = spouseParams.currentAge;
  const horizon = Math.max(
    st.lifeExpectancy - selfAge0,
    sp ? sp.lifeExpectancy - spouseAge0 : 0
  );
  const infl = params.inflationRate;

  const rows: CoupleYear[] = [];
  let firstDeath: CoupleSimulationResult["firstDeath"] = null;
  const lifetime = { self: 0, spouse: 0, household: 0 };

  for (let t = 0; t <= horizon; t++) {
    const year = baseYear + t;
    const index = Math.pow(1 + infl / 100, t);
    const sAge = selfAge0 + t;
    const pAge = spouseAge0 + t;
    const sAlive = sAge <= st.lifeExpectancy;
    const pAlive = !!sp && pAge <= sp.lifeExpectancy;
    if (!firstDeath && sp) {
      if (!sAlive) firstDeath = { who: "SELF", year, age: sAge };
      else if (!pAlive) firstDeath = { who: "SPOUSE", year, age: pAge };
    }

    const own = (tr: Track, age: number, alive: boolean) => {
      const cf = alive ? tr.flows.get(age) : undefined;
      return {
        national: cf?.national ?? 0,
        retirement: cf?.retirement ?? 0,
        personal: cf?.personal ?? 0,
        insurance: cf?.insurance ?? 0,
      };
    };
    const so = own(st, sAge, sAlive);
    const po = sp ? own(sp, pAge, pAlive) : null;

    // 중복급여 조정: 유족연금(사망자 연금 × 가입기간별 40~60%) vs 본인 연금 + 유족연금 30% 중 큰 쪽
    const survivor = (ownNational: number, deceased: Track, deceasedAge: number) => {
      const benefit =
        survivorRateForMonths(deceased.national.expectedTotalContributionMonths) *
        wouldBeNational(deceased, deceasedAge, infl);
      if (benefit <= 0) return { national: ownNational, choice: null as SurvivorChoice | null };
      const withOwn = ownNational + SURVIVOR_OVERLAP_RATE * benefit;
      return benefit > withOwn
        ? { national: benefit, choice: "SURVIVOR" as SurvivorChoice }
        : { national: withOwn, choice: "OWN_PLUS_30" as SurvivorChoice };
    };
    let sNational = so.national;
    let sChoice: SurvivorChoice | null = null;
    let pNational = po?.national ?? 0;
    let pChoice: SurvivorChoice | null = null;
    if (sp && sAlive && !pAlive) ({ national: sNational, choice: sChoice } = survivor(so.national, sp, pAge));
    if (sp && pAlive && !sAlive) ({ national: pNational, choice: pChoice } = survivor(po!.national, st, sAge));

    // 사적연금 수령액은 소득인정액(연금소득)에 자동 반영
    const person = (alive: boolean, age: number, national: number, earned: number, other: number, occ: boolean, n: NationalPensionState, o: ReturnType<typeof own>): BasicPensionPerson => ({
      alive,
      age,
      earnedIncome: earned * index,
      otherIncome: other * index + o.retirement + o.personal + o.insurance,
      nationalPension: national,
      aShare: aShareOf(n),
      occupational: occ,
    });
    // 「대시보드 반영 안 함」이면 기초연금을 계산하지 않는다
    const b = !basic.applyToSimulation ? { self: 0, spouse: 0 } : calcBasicPension(
      person(sAlive, sAge, sNational, basic.selfEarnedIncome, basic.selfOtherIncome, basic.selfOccupational, self.national, so),
      sp ? person(pAlive, pAge, pNational, basic.spouseEarnedIncome, basic.spouseOtherIncome, basic.spouseOccupational, spouse!.national, po!) : null,
      {
        region: basic.region,
        generalProperty: basic.generalProperty * index,
        financialAssets: basic.financialAssets * index,
        debts: basic.debts * index,
        luxuryAssets: basic.luxuryAssets * index,
      },
      index
    );

    const mk = (alive: boolean, age: number, national: number, o: ReturnType<typeof own>, basicAmt: number, choice: SurvivorChoice | null): PersonYear => {
      const total = alive ? national + basicAmt + o.retirement + o.personal + o.insurance : 0;
      return { alive, age, national: alive ? national : 0, basic: alive ? basicAmt : 0, retirement: o.retirement, personal: o.personal, insurance: o.insurance, total, survivorChoice: choice };
    };
    const selfYear = mk(sAlive, sAge, sNational, so, b.self, sChoice);
    const spouseYear = sp ? mk(pAlive, pAge, pNational, po!, b.spouse, pChoice) : null;
    const household = selfYear.total + (spouseYear?.total ?? 0);
    lifetime.self += selfYear.total * 12;
    lifetime.spouse += (spouseYear?.total ?? 0) * 12;
    lifetime.household += household * 12;
    rows.push({ year, self: selfYear, spouse: spouseYear, household });
  }
  return { rows, firstDeath, lifetime };
}
