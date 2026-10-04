import { runWithdrawalSimulation, type PersonFlowParts, type SimulationYearFlow, type StrategySimulationResult } from "@/services/withdrawalCalculator";
import { personParams, type CoupleSimulationResult, type PersonPensions } from "@/services/coupleSimulation";
import type { BasicPensionState, SimulationParamsState } from "@/store/usePensionStore";
import { buildSpendingCurve } from "@/services/spendingCurve";

// 화면에 보이는 인출전략 시나리오 (S2 국민연금 5년 연기는 입력의 연기 옵션으로 흡수)
export type ScenarioKey = "s0" | "s1" | "s3" | "s4";
const SCENARIOS: ScenarioKey[] = ["s0", "s1", "s3", "s4"];

export interface WithdrawalInputs {
  personalTaxCreditRatio?: number;
  retirementLumpSumTaxRate?: number;
  otherIncomeAnnual?: number;
  publicPensionTaxableRatio?: number;
  s3CustomStartAges?: Record<string, number>;
  s3CustomPeriods?: Record<string, number>;
}

type PublicByAge = Record<number, { national: number; basic: number }>;
type PrivateByAge = Record<number, { retirement: number; personal: number; insurance: number }>;

// 부부 가구 인출전략 시나리오: 사람별로 인출전략 엔진을 돌려(세금·건보료·사적연금 한도는 사람별) 연도별로 합산한다.
// 국민연금·기초연금(연기·물가연동·유족연금·기초연금 판정)은 부부 통합 시뮬레이션 값을 그대로 넣어 기준을 맞춘다.
// S0는 퇴직·개인연금 인출액도 시뮬레이션 값(입력 옵션의 인출 방식·평탄화·수령 종료 나이)을 그대로 쓴다.
// 재산세 과세표준·금융소득·기타 소득은 본인에게만 둬 중복 계산을 막고, S4 커버드콜은 부부 분산 시 반씩, 아니면 본인 명의.
export function runHouseholdScenarios(
  self: PersonPensions,
  spouse: PersonPensions | null,
  params: SimulationParamsState,
  basic: BasicPensionState,
  couple: CoupleSimulationResult,
  inputs: WithdrawalInputs,
  baseYear: number = new Date().getFullYear()
): Record<ScenarioKey, StrategySimulationResult> {
  const selfPublic: PublicByAge = {};
  const spousePublic: PublicByAge = {};
  const selfPrivate: PrivateByAge = {};
  const spousePrivate: PrivateByAge = {};
  couple.rows.forEach((r) => {
    if (r.self.alive) {
      selfPublic[r.self.age] = { national: r.self.national, basic: r.self.basic };
      selfPrivate[r.self.age] = { retirement: r.self.retirement, personal: r.self.personal, insurance: r.self.insurance };
    }
    if (r.spouse?.alive) {
      spousePublic[r.spouse.age] = { national: r.spouse.national, basic: r.spouse.basic };
      spousePrivate[r.spouse.age] = { retirement: r.spouse.retirement, personal: r.spouse.personal, insurance: r.spouse.insurance };
    }
  });

  const divided = !!spouse && params.isCoupleDivided;
  const asset = params.coveredCallAsset || 0;
  const selfParams: SimulationParamsState = { ...params, coveredCallAsset: divided ? asset / 2 : asset, isCoupleDivided: false };
  const selfRun = runWithdrawalSimulation(self.national, basic, self.retirementPensions, self.personalPensions, self.pensionInsurances, selfParams, {
    ...inputs,
    publicPensionByAge: selfPublic,
    privateDrawByAge: selfPrivate,
  });
  const spouseRun = spouse
    ? runWithdrawalSimulation(
        spouse.national,
        basic,
        spouse.retirementPensions,
        spouse.personalPensions,
        spouse.pensionInsurances,
        { ...personParams(params, "SPOUSE"), propertyTaxBase: 0, financialIncome: 0, coveredCallAsset: divided ? asset / 2 : 0, isCoupleDivided: false },
        { ...inputs, otherIncomeAnnual: 0, publicPensionByAge: spousePublic, privateDrawByAge: spousePrivate }
      )
    : null;

  const selfAge0 = params.currentAge;
  const spouseAge0 = personParams(params, "SPOUSE").currentAge;
  const retireT = params.retirementAge - selfAge0;
  const curve = buildSpendingCurve(params, baseYear, couple.rows.length);

  const rowByYear = new Map(couple.rows.map((r) => [r.year, r]));
  const partsOf = (f?: SimulationYearFlow): PersonFlowParts | undefined =>
    f && { national: f.nationalPreTax, basic: f.basicPreTax, retirement: f.retirementPreTax, personal: f.personalPreTax, insurance: f.insurancePreTax, dividend: f.dividendPreTax };

  const merge = (key: ScenarioKey): StrategySimulationResult => {
    const a = selfRun[key];
    const b = spouseRun?.[key];
    const selfByT = new Map(a.flows.map((f) => [f.age - selfAge0, f]));
    const spouseByT = new Map((b?.flows ?? []).map((f) => [f.age - spouseAge0, f]));
    // 경과 연수(t) 기준으로 합산 — 엔진의 year는 실행 시점 연도라 쓰지 않는다
    const byT = new Map<number, SimulationYearFlow>();
    const add = (f: SimulationYearFlow, t: number) => {
      const cur = byT.get(t);
      if (!cur) {
        byT.set(t, { ...f });
        return;
      }
      (Object.keys(f) as (keyof SimulationYearFlow)[]).forEach((k) => {
        if (k === "age" || k === "year" || k === "spouseAge") return;
        (cur[k] as number) += f[k] as number;
      });
    };
    a.flows.forEach((f) => add(f, f.age - selfAge0));
    b?.flows.forEach((f) => add(f, f.age - spouseAge0));
    const spouseAlive = new Set(b?.flows.map((f) => f.age - spouseAge0) ?? []);

    const flows = [...byT.entries()]
      .sort(([x], [y]) => x - y)
      .map(([t, f]) => {
        const y = baseYear + t;
        const pt = curve.get(y);
        const yearTarget = (pt?.targetReal ?? (params.targetMonthlySpending || 300)) * 12;
        return {
          ...f,
          age: selfAge0 + t,
          year: y,
          spouseAge: spouseAlive.has(t) ? spouseAge0 + t : undefined,
          deficit: Math.max(0, yearTarget - f.totalPostTax), // 연령대별 가구 맞춤 목표 생활비 대비 부족액
          // 그래프용 사람별 내역 (유족연금 몫은 통합 시뮬레이션 값, 월 → 연)
          parts: {
            self: partsOf(selfByT.get(t)),
            spouse: partsOf(spouseByT.get(t)),
            survivorSelf: (rowByYear.get(baseYear + t)?.self.survivorPart ?? 0) * 12,
            survivorSpouse: (rowByYear.get(baseYear + t)?.spouse?.survivorPart ?? 0) * 12,
          },
        };
      });
    const lostSpouse = b?.lostDependencyAge !== undefined ? b.lostDependencyAge - spouseAge0 + selfAge0 : undefined;
    return {
      strategyId: a.strategyId,
      strategyName: a.strategyName,
      lifetimeTotalPreTax: a.lifetimeTotalPreTax + (b?.lifetimeTotalPreTax ?? 0),
      lifetimeTotalPostTax: a.lifetimeTotalPostTax + (b?.lifetimeTotalPostTax ?? 0),
      lifetimeTotalTaxAndHI: a.lifetimeTotalTaxAndHI + (b?.lifetimeTotalTaxAndHI ?? 0),
      lifetimeTotalTax: a.lifetimeTotalTax + (b?.lifetimeTotalTax ?? 0),
      lifetimeTotalHI: a.lifetimeTotalHI + (b?.lifetimeTotalHI ?? 0),
      hasCrevasse: a.hasCrevasse || !!b?.hasCrevasse,
      hasDeficit: flows.some((f) => f.age - selfAge0 >= retireT && f.deficit > 0),
      lostDependencyAge: a.lostDependencyAge ?? lostSpouse,
      finalCoveredCallAsset: (a.finalCoveredCallAsset ?? 0) + (b?.finalCoveredCallAsset ?? 0),
      finalDividendBuffer: (a.finalDividendBuffer ?? 0) + (b?.finalDividendBuffer ?? 0),
      flows,
    };
  };

  return Object.fromEntries(SCENARIOS.map((k) => [k, merge(k)])) as Record<ScenarioKey, StrategySimulationResult>;
}
