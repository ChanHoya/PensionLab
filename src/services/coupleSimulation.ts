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
  // national 중 유족연금으로 구분해 그리는 몫. 본인+30% 선택 시 30% 부분, 유족연금 선택 시 「유족연금 − 본인 연금」
  // (유족연금 선택 시 본인 연금은 지급정지되지만, 그래프는 본인 연금 수준을 이어 그리고 늘어나는 만큼을 유족연금으로 표시)
  survivorPart: number;
}

export interface CoupleYear {
  year: number;
  self: PersonYear;
  spouse: PersonYear | null;
  household: number; // 가구 합산 (만원/월)
}

export interface SmoothingSummary {
  startYear: number; // 사적연금 인출 시작 연도
  endYear: number; // 사적연금 소진 연도 (본인 수령 종료 나이, 기본 본인 기대수명)
  annualGrowth: number; // 가구 총액의 연 변화율 (소진 연도에 국민연금 수준 도달)
  levelMonthly: number; // 시작 연도 가구 월 수령액 (명목)
  levelToday: number; // 같은 수준의 현재가치
  pot: number; // 보유 사적연금 적립금 (시작 연도 가치, 만원)
  targetToday: number; // 희망 월 생활비 (현재가치, 만원/월)
  requiredPot: number; // 희망 생활비로 시작하는 데 필요한 적립금 (시작 연도 가치, 만원)
}

export interface CoupleSimulationResult {
  rows: CoupleYear[];
  firstDeath: { who: "SELF" | "SPOUSE"; year: number; age: number } | null;
  lifetime: { self: number; spouse: number; household: number }; // 생애 누적 수령액 (만원, 명목)
  smoothing?: SmoothingSummary; // 가구 소득 평탄화를 켰을 때만
  survivorInfo: SurvivorInfo | null; // 첫 사망 연도의 유족연금 산정 내역 (배우자 없음·사망 없음이면 null)
}

// 유족연금 산정 내역 (국민연금법 제74조 지급률, 제56조 중복급여 조정) — 첫 사망 연도 기준, 명목 만원/월
export interface SurvivorInfo {
  deceased: "SELF" | "SPOUSE";
  year: number;
  months: number; // 사망자 가입기간 (총 예상 가입월수)
  rate: number; // 유족연금 지급률 0.4 / 0.5 / 0.6
  basePension: number; // 사망자 기본연금액 (연기 가산 전, 그해 물가 반영)
  fullSurvivor: number; // ① 유족연금 전액 = 기본연금액 × 지급률
  ownPension: number; // 남은 배우자 본인 노령연금
  ownPlus30: number; // ② 본인 연금 + 유족연금 30%
  choice: SurvivorChoice; // 큰 쪽 자동 선택
}

type PrivateFlow = { retirement: number; personal: number; insurance: number };
type SmoothingOverride = { self: PrivateFlow; spouse: PrivateFlow }[];

const SMOOTHING_RATE = 0.03; // 사적연금 적립금 운용·할인 수익률 (퇴직연금 연금화 가정과 같은 연 3%)
const PRIVATE_KEYS = ["retirement", "personal", "insurance"] as const;

// 가구 소득 평탄화: 국민연금을 바닥에 두고 모자란 만큼만 사적연금으로 채운다.
// 가구 총액 = L × (1+g)^경과연수 (인출 시작~소진 연도). g는 총액이 어느 해에도 국민연금 아래로 내려가지 않는 가장 완만한
// 증가율(≥ 0)이라, 국민연금이 시작·증가하는 만큼 사적연금 지급액이 줄고 총액은 튀지 않는다. 소진 연도 이후에는 국민연금만.
// (총액을 물가만큼 늘리면 물가연동인 국민연금과 같은 속도라 사적연금 몫이 줄지 않으므로, g는 적립금 크기로 정해진다)
// 사적연금 인출액의 현재가치가 기존 사적연금 흐름의 현재가치(적립금)와 같아지도록 L을 찾는다.
export function planHouseholdSmoothing(
  rows: CoupleYear[],
  targetToday: number,
  inflationRate: number,
  endIndex: number
): { override: SmoothingOverride; summary: SmoothingSummary } {
  const privOf = (p: PersonYear | null) => (p ? p.retirement + p.personal + p.insurance : 0);
  const first = rows.findIndex((r) => privOf(r.self) + privOf(r.spouse) > 0);
  const start = Math.max(0, first);
  const end = Math.min(rows.length - 1, Math.max(start, endIndex));
  const disc = (t: number) => 12 * Math.pow(1 + SMOOTHING_RATE, -(t - start)); // 월액 → 연액 현재가치 (시작 연도 기준)

  let pot = 0;
  let potSelf = 0;
  const catPv: PrivateFlow = { retirement: 0, personal: 0, insurance: 0 };
  rows.forEach((r, t) => {
    if (t < start) return;
    pot += (privOf(r.self) + privOf(r.spouse)) * disc(t);
    potSelf += privOf(r.self) * disc(t);
    PRIVATE_KEYS.forEach((k) => (catPv[k] += (r.self[k] + (r.spouse?.[k] ?? 0)) * disc(t)));
  });

  const publicOf = (r: CoupleYear) => r.self.national + (r.spouse?.national ?? 0);
  const pathAt = (L: number, g: number, t: number) => L * Math.pow(1 + g, t - start);
  const drawAt = (L: number, g: number, t: number) => (t < start || t > end ? 0 : Math.max(0, pathAt(L, g, t) - publicOf(rows[t])));
  const need = (L: number, g: number) => rows.reduce((a, _r, t) => a + drawAt(L, g, t) * disc(t), 0);
  // 증가율 g일 때 적립금을 모두 쓰는 시작 수준 L (need는 L에 대해 증가)
  const solveL = (g: number, amount: number) => {
    let lo = 0;
    let hi = 1;
    while (need(hi, g) < amount && hi < 1e7) hi *= 2;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (need(mid, g) < amount) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  // 총액이 국민연금보다 낮아지는 해의 최대 부족분 (0이면 국민연금 개시로 총액이 튀지 않음)
  const maxJump = (L: number, g: number) => {
    let worst = 0;
    for (let t = start; t <= end; t++) worst = Math.max(worst, publicOf(rows[t]) - pathAt(L, g, t));
    return worst;
  };
  // 총액을 줄이지 않고(g ≥ 0) 어느 해에도 국민연금 아래로 내려가지 않는 가장 완만한 증가율을 고른다.
  // 적립금이 너무 작아 불가능하면 국민연금 개시 때 튀는 폭이 가장 작은 증가율.
  let best = { g: 0, L: 0, jump: Infinity };
  if (pot > 0) {
    for (let step = 0; step <= 300; step++) {
      const g = step * 0.0005; // 0% ~ 15%, 0.05%p 간격
      const L = solveL(g, pot);
      const jump = maxJump(L, g);
      if (jump < best.jump - 0.01) best = { g, L, jump };
      if (jump <= 0.5) break;
    }
  }
  const { g, L } = best;

  // 인출액을 사람별(적립금 비율, 사망 후엔 생존자) · 상품별(적립금 비율)로 나눈다
  const wSelf = pot > 0 ? potSelf / pot : 1;
  const split = (amount: number): PrivateFlow => ({
    retirement: pot > 0 ? (amount * catPv.retirement) / pot : 0,
    personal: pot > 0 ? (amount * catPv.personal) / pot : 0,
    insurance: pot > 0 ? (amount * catPv.insurance) / pot : 0,
  });
  const override = rows.map((r, t) => {
    const d = pot > 0 ? drawAt(L, g, t) : 0;
    const selfShare = r.self.alive && r.spouse?.alive ? wSelf : r.self.alive ? 1 : 0;
    return { self: split(d * selfShare), spouse: split(d * (1 - selfShare)) };
  });

  const startIndex = Math.pow(1 + inflationRate / 100, start);
  return {
    override,
    summary: {
      startYear: rows[start]?.year ?? 0,
      endYear: rows[end]?.year ?? 0,
      annualGrowth: g,
      levelMonthly: L,
      levelToday: L / startIndex,
      pot,
      targetToday,
      requiredPot: need(targetToday * startIndex, g),
    },
  };
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
  // 평탄화 모드의 수령 종료 나이는 소진 연도로만 쓰고, 적립금 산정용 기존 흐름은 상품별 기본 기간으로 계산
  const trackParams = params.householdIncomeSmoothing ? { ...params, privatePensionEndAge: 0, spousePrivatePensionEndAge: 0 } : params;
  const selfParams = personParams(trackParams, "SELF");
  const spouseParams = personParams(trackParams, "SPOUSE");
  const st = track(self, selfParams);
  const sp = spouse ? track(spouse, spouseParams) : null;
  const selfAge0 = selfParams.currentAge;
  const spouseAge0 = spouseParams.currentAge;
  const horizon = Math.max(
    st.lifeExpectancy - selfAge0,
    sp ? sp.lifeExpectancy - spouseAge0 : 0
  );
  const infl = params.inflationRate;

  // override: 연도(t)별 사람별 사적연금 수령액을 바꿔 끼운다 (가구 소득 평탄화)
  const build = (override?: SmoothingOverride): CoupleSimulationResult => {
    const rows: CoupleYear[] = [];
    let firstDeath: CoupleSimulationResult["firstDeath"] = null;
    let survivorInfo: SurvivorInfo | null = null;
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
      const so = { ...own(st, sAge, sAlive), ...(override ? override[t].self : {}) };
      const po = sp ? { ...own(sp, pAge, pAlive), ...(override ? override[t].spouse : {}) } : null;

      // 중복급여 조정: 유족연금(사망자 연금 × 가입기간별 40~60%) vs 본인 연금 + 유족연금 30% 중 큰 쪽
      const survivor = (ownNational: number, deceased: Track, deceasedAge: number) => {
        const benefit =
          survivorRateForMonths(deceased.national.expectedTotalContributionMonths) *
          wouldBeNational(deceased, deceasedAge, infl);
        if (benefit <= 0) return { national: ownNational, choice: null as SurvivorChoice | null, part: 0 };
        const withOwn = ownNational + SURVIVOR_OVERLAP_RATE * benefit;
        return benefit > withOwn
          ? { national: benefit, choice: "SURVIVOR" as SurvivorChoice, part: benefit - ownNational }
          : { national: withOwn, choice: "OWN_PLUS_30" as SurvivorChoice, part: SURVIVOR_OVERLAP_RATE * benefit };
      };
      let sNational = so.national;
      let sChoice: SurvivorChoice | null = null;
      let sPart = 0;
      let pNational = po?.national ?? 0;
      let pChoice: SurvivorChoice | null = null;
      let pPart = 0;
      if (sp && sAlive && !pAlive) ({ national: sNational, choice: sChoice, part: sPart } = survivor(so.national, sp, pAge));
      if (sp && pAlive && !sAlive) ({ national: pNational, choice: pChoice, part: pPart } = survivor(po!.national, st, sAge));
      // 첫 사망 연도의 산정 내역을 남긴다 (화면의 「유족연금 산정 기준」 설명용)
      if (!survivorInfo && sp && sAlive !== pAlive) {
        const deceasedSelf = !sAlive;
        const dead = deceasedSelf ? st : sp;
        const months = dead.national.expectedTotalContributionMonths;
        const rate = survivorRateForMonths(months);
        const basePension = wouldBeNational(dead, deceasedSelf ? sAge : pAge, infl);
        const fullSurvivor = rate * basePension;
        const ownPension = deceasedSelf ? po!.national : so.national;
        const choice = deceasedSelf ? pChoice : sChoice;
        if (fullSurvivor > 0 && choice) {
          survivorInfo = {
            deceased: deceasedSelf ? "SELF" : "SPOUSE",
            year,
            months,
            rate,
            basePension,
            fullSurvivor,
            ownPension,
            ownPlus30: ownPension + SURVIVOR_OVERLAP_RATE * fullSurvivor,
            choice,
          };
        }
      }

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

      const mk = (alive: boolean, age: number, national: number, o: ReturnType<typeof own>, basicAmt: number, choice: SurvivorChoice | null, part: number): PersonYear => {
        const total = alive ? national + basicAmt + o.retirement + o.personal + o.insurance : 0;
        return { alive, age, national: alive ? national : 0, basic: alive ? basicAmt : 0, retirement: o.retirement, personal: o.personal, insurance: o.insurance, total, survivorChoice: choice, survivorPart: alive ? part : 0 };
      };
      const selfYear = mk(sAlive, sAge, sNational, so, b.self, sChoice, sPart);
      const spouseYear = sp ? mk(pAlive, pAge, pNational, po!, b.spouse, pChoice, pPart) : null;
      const household = selfYear.total + (spouseYear?.total ?? 0);
      lifetime.self += selfYear.total * 12;
      lifetime.spouse += (spouseYear?.total ?? 0) * 12;
      lifetime.household += household * 12;
      rows.push({ year, self: selfYear, spouse: spouseYear, household });
    }
    return { rows, firstDeath, lifetime, survivorInfo };
  };

  const base = build();
  if (!params.householdIncomeSmoothing) return base;
  // 소진 연도: 본인 수령 종료 나이, 비우면 본인 기대수명
  const endAge = params.privatePensionEndAge > 0 ? params.privatePensionEndAge : st.lifeExpectancy;
  const plan = planHouseholdSmoothing(base.rows, params.targetMonthlySpending, infl, endAge - selfAge0);
  return { ...build(plan.override), smoothing: plan.summary };
}
