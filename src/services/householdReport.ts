import { personParams, runCoupleSimulation, type CoupleSimulationResult, type CoupleYear, type PersonPensions } from "@/services/coupleSimulation";
import { runHouseholdScenarios, type ScenarioKey } from "@/services/householdScenarios";
import { paidTotalsOf } from "@/services/paidTotals";
import { applyNpsOptions } from "@/services/returnRepaymentCalculator";
import { buildSpendingCurve, type SpendingPoint, type SpendingPattern } from "@/services/spendingCurve";
import type { BasicPensionState, NationalPensionState, PersonData, SimulationParamsState } from "@/store/usePensionStore";

// AI 포트폴리오 진단 리포트의 계산부. 대시보드와 같은 경로(추납·반납 반영 → 부부 통합 시뮬레이션 → 가구 인출전략)로
// 가구 기준(배우자가 없으면 본인) 지표와 진단 점수를 만든다. 화면과 AI 서버가 같은 함수를 써서 숫자를 맞춘다.
// 월 금액은 현재가치(물가 반영 할인), 생애 합계는 명목 금액 (만원)

export interface ReportInput {
  simulationParams: SimulationParamsState;
  basicPension: BasicPensionState;
  self: PersonData;
  spouse: PersonData;
}

// 대시보드 인출전략 입력 옵션의 기본값 (그 화면에서 바꾼 값은 저장되지 않으므로 리포트는 기본값 기준)
const WITHDRAWAL_DEFAULTS = { personalTaxCreditRatio: 0.8, retirementLumpSumTaxRate: 0.08, otherIncomeAnnual: 0, publicPensionTaxableRatio: 0.5 };
const SURVIVOR_NEED = 0.7; // 혼자 남은 가구에 필요한 소득 = 부부 가구 소득의 70% 이상이면 만점
const LATE_YEARS = 5; // 말년 소득을 볼 마지막 기간

export type DimensionKey = "sufficiency" | "stability" | "tax" | "diversification" | "longevity";

export interface Dimension {
  key: DimensionKey;
  label: string;
  weight: number; // 종합 점수 가중치 (%)
  score: number; // 0~100
  metric: string; // 점수의 근거 수치
  basis: string; // 산정 기준
}

export interface ScenarioSummary {
  key: ScenarioKey;
  id: string; // S0, S1, S3, S4
  name: string;
  preTax: number; // 생애 세전 수령액 (만원, 명목)
  postTax: number;
  taxHI: number; // 생애 세금 + 건보료
  effectiveRate: number; // taxHI / preTax
  lostDependencyAge?: number;
  finalCoveredCallAsset?: number; // S4 최종 커버드콜 잔액 (만원)
  finalDividendBuffer?: number;   // S4 최종 누적 비상자금 잔고 (만원)
}

export interface S4DividendAnalysis {
  policy: "REINVEST" | "BUFFER" | "PAYOUT";
  policyLabel: string;
  policyDescription: string;
  coveredCallAssetInitial: number; // 초기 투자금 (만원)
  dividendRate: number; // 연 분배율 (%)
  isCoupleDivided: boolean; // 부부 명의 분산
  annualDividendGross: number; // 연간 가구 총 배당금 세전 (만원)
  annualDividendPerPerson: number; // 1인당 배당금 세전 (만원)
  healthInsuranceProtected: boolean; // 건보료 피부양자 안전 (1인당 1,000만원 이하)
  finalCoveredCallAsset: number; // 최종 커버드콜 잔액 (만원)
  finalEmergencyBuffer: number; // 최종 안전 비상자금 잔고 (만원)
  accumulatedReinvested: number; // 누적 재투자 총액 (만원)
  accumulatedBuffered: number; // 누적 안전버퍼 적립 총액 (만원)
  accumulatedSpent: number; // 생활비 충당 총액 (만원)
  policyEvaluation: {
    coreBenefit: string;
    keyRisk: string;
    strategicPrescription: string;
  };
}

export interface Span {
  fromYear: number;
  toYear: number;
  fromAge: number; // 본인 나이 기준
  toAge: number;
}

export interface PersonSplit {
  self: number;
  spouse: number;
}

export interface HouseholdReport {
  hasSpouse: boolean;
  baseYear: number;
  params: SimulationParamsState;
  couple: CoupleSimulationResult;
  inflation: number; // 연 물가상승률 (소수)
  retireYear: number; // 은퇴 연도 (본인 기준)
  targetToday: number; // 시작 목표 생활비 (현재가치, 만원/월)
  minToday: number; // 시작 최소 생활비
  spendingPattern: SpendingPattern; // 지출 곡선 패턴
  activePhaseYears: number; // 초기 활동기 유지 기간 (년)
  annualDeclineRate: number; // 연간 체감률 (%)
  spendingCurve: Map<number, SpendingPoint>; // 연차별 지출 곡선 포인트
  avgTargetReal: number; // 지출 곡선 반영 은퇴 기간 평균 목표 생활비
  realHousehold: number[]; // couple.rows와 같은 순서의 가구 월 연금 (현재가치)
  avgRetiredReal: number; // 은퇴 후 평균 가구 월 연금 (현재가치)
  shortfallPV: number; // 은퇴 후 목표 생활비 곡선 대비 누적 부족액 (현재가치, 만원)
  childSupport: { total: number; uncovered: number }; // 자녀 교육·결혼 지원 예정 총액, 비연금 자산으로 충당하고 남는 금액 (만원)
  medicalMonthly: number; // 생활비 곡선에 더한 노후 의료비 (현재가치, 만원/월)
  belowMinSpans: Span[]; // 최소 생활비 곡선에 못 미치는 구간
  crevasse: { years: number; avgReal: number }; // 은퇴 후 부부 누구의 국민연금도 나오기 전 (소득 공백기)
  firstDeath: { who: "SELF" | "SPOUSE"; year: number; beforeReal: number; afterReal: number } | null;
  lateReal: number; // 마지막 5년 평균 가구 월 연금 (현재가치)
  layers: { public: PersonSplit; retirement: PersonSplit; private: PersonSplit }; // 생애 수령액 (명목, 만원)
  moneyFlow: { label: string; paid: number; received: number }[]; // 낸 돈(원금) vs 받는 돈 (가구, 만원)
  scenarios: ScenarioSummary[];
  best: ScenarioSummary;
  dimensions: Dimension[];
  total: number; // 종합 점수 0~100
  grade: { letter: string; label: string; color: string };
  nps: { selfAdded: number; selfRestored: number; spouseAdded: number; spouseRestored: number }; // 추납·반납 반영 개월
  s4Analysis: S4DividendAnalysis; // S4 하이브리드 배당 운용 정책 정밀 분석
}

const GRADES = [
  { min: 85, letter: "A", label: "매우 안정", color: "#16a34a" },
  { min: 70, letter: "B", label: "안정", color: "#0ea5e9" },
  { min: 55, letter: "C", label: "보완 필요", color: "#f59e0b" },
  { min: 40, letter: "D", label: "주의", color: "#f97316" },
  { min: 0, letter: "E", label: "위험", color: "#ef4444" },
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const pct = (x: number) => Math.round(x * 100);

function toPensions(d: PersonData, national: NationalPensionState): PersonPensions {
  return { national, retirementPensions: d.retirementPensions, personalPensions: d.personalPensions, pensionInsurances: d.pensionInsurances };
}

export function buildHouseholdReport(input: ReportInput, baseYear: number = new Date().getFullYear()): HouseholdReport {
  const params = input.simulationParams;
  const hasSpouse = params.hasSpouse;
  const spouseParams = personParams(params, "SPOUSE");
  const selfNps = applyNpsOptions(input.self.nationalPension, input.self.additionalPayment, input.self.returnRepayment, params);
  const spouseNps = applyNpsOptions(input.spouse.nationalPension, input.spouse.additionalPayment, input.spouse.returnRepayment, spouseParams);
  const self = toPensions(input.self, selfNps.national);
  const spouse = hasSpouse ? toPensions(input.spouse, spouseNps.national) : null;

  const couple = runCoupleSimulation(self, spouse, params, input.basicPension, baseYear);
  const runs = runHouseholdScenarios(self, spouse, params, input.basicPension, couple, WITHDRAWAL_DEFAULTS, baseYear);
  const rows = couple.rows;

  const inflation = (params.inflationRate || 0) / 100;
  const targetToday = params.targetMonthlySpending || 300;
  const minToday = params.minMonthlySpending || 200;
  const realHousehold = rows.map((r, t) => r.household / Math.pow(1 + inflation, t));
  const avg = (ts: number[]) => (ts.length ? ts.reduce((a, t) => a + realHousehold[t], 0) / ts.length : 0);

  const spendingCurve = buildSpendingCurve(params, baseYear, rows.length);
  const spendingPattern: SpendingPattern = params.spendingPattern || (params.decumulationStrategy === "FLAT" ? "FLAT" : "AGE_BANDS");
  const activePhaseYears = params.activePhaseYears ?? 5;
  const annualDeclineRate = params.annualDeclineRate ?? 2.0;

  const retireT = Math.max(0, params.retirementAge - params.currentAge);
  const retired = rows.map((_, t) => t).filter((t) => t >= retireT);
  const avgRetiredReal = avg(retired);

  // 연차별 지출 곡선(활동기 집중형 등)과 대비하여 누적 부족액 및 최소 생활비 미달 여부 산출
  const shortfallPV = retired.reduce((a, t) => {
    const y = rows[t].year;
    const pt = spendingCurve.get(y);
    const targetAt = pt?.targetReal ?? targetToday;
    return a + Math.max(0, targetAt - realHousehold[t]) * 12;
  }, 0);

  // 자녀 교육·결혼 지원비(총액, 현재가치)는 비연금 자산에서 먼저 쓰고, 모자란 만큼은 노후 자금에서 나간다고 본다
  const childSupportTotal = Math.max(0, params.childSupportExpense || 0);

  const coveredYears = retired.filter((t) => {
    const y = rows[t].year;
    const pt = spendingCurve.get(y);
    const minAt = pt?.minReal ?? minToday;
    return realHousehold[t] >= minAt;
  }).length;

  const belowMinSpans: Span[] = [];
  retired
    .filter((t) => {
      const y = rows[t].year;
      const pt = spendingCurve.get(y);
      const minAt = pt?.minReal ?? minToday;
      return realHousehold[t] < minAt;
    })
    .forEach((t) => {
      const { year, self: s } = rows[t];
      const last = belowMinSpans[belowMinSpans.length - 1];
      if (last && last.toYear === year - 1) {
        last.toYear = year;
        last.toAge = s.age;
      } else belowMinSpans.push({ fromYear: year, toYear: year, fromAge: s.age, toAge: s.age });
    });

  const avgTargetReal = retired.length
    ? retired.reduce((a, t) => a + (spendingCurve.get(rows[t].year)?.targetReal ?? targetToday), 0) / retired.length
    : targetToday;
  const coverageRatio = avgTargetReal > 0 ? avgRetiredReal / avgTargetReal : 1;

  const publicStartT = rows.findIndex((r) => r.self.national + (r.spouse?.national ?? 0) > 0);
  const crevasseTs = publicStartT < 0 ? [] : retired.filter((t) => t < publicStartT);

  // 첫 사망 전후 3년 평균 (사망 연도부터 혼자 남은 가구)
  const fd = couple.firstDeath;
  let firstDeath: HouseholdReport["firstDeath"] = null;
  if (fd) {
    const dt = fd.year - baseYear;
    const before = [dt - 3, dt - 2, dt - 1].filter((t) => t >= 0);
    const after = [dt, dt + 1, dt + 2].filter((t) => t < rows.length);
    firstDeath = { who: fd.who, year: fd.year, beforeReal: Math.round(avg(before)), afterReal: Math.round(avg(after)) };
  }
  const lateReal = avg(rows.map((_, t) => t).slice(-LATE_YEARS));

  const sum = (f: (r: CoupleYear) => number) => Math.round(rows.reduce((a, r) => a + f(r) * 12, 0));
  const layers = {
    public: { self: sum((r) => r.self.national + r.self.basic), spouse: sum((r) => (r.spouse?.national ?? 0) + (r.spouse?.basic ?? 0)) },
    retirement: { self: sum((r) => r.self.retirement), spouse: sum((r) => r.spouse?.retirement ?? 0) },
    private: { self: sum((r) => r.self.personal + r.self.insurance), spouse: sum((r) => (r.spouse?.personal ?? 0) + (r.spouse?.insurance ?? 0)) },
  };

  const paidSelf = paidTotalsOf(self, params);
  const paidSpouse = spouse ? paidTotalsOf(spouse, spouseParams) : null;
  const moneyFlow = [
    {
      label: "국민연금",
      paid: Math.round(paidSelf.national + (paidSpouse?.national ?? 0)),
      received: sum((r) => r.self.national + (r.spouse?.national ?? 0)),
    },
    { label: "퇴직연금", paid: Math.round(paidSelf.retirement + (paidSpouse?.retirement ?? 0)), received: layers.retirement.self + layers.retirement.spouse },
    {
      label: "개인연금",
      paid: Math.round(paidSelf.personal + paidSelf.insurance + (paidSpouse ? paidSpouse.personal + paidSpouse.insurance : 0)),
      received: layers.private.self + layers.private.spouse,
    },
  ].filter((m) => m.paid > 0 || m.received > 0);

  const s4Run = runs.s4;
  const s4Policy = params.dividendPolicy || "PAYOUT";
  const s4AssetInitial = params.coveredCallAsset || 0;
  const s4DivRate = params.coveredCallDividendRate ?? 9.0;
  const annualDividendGross = Math.round(s4AssetInitial * (s4DivRate / 100));
  const isDivided = hasSpouse && params.isCoupleDivided;
  const annualDividendPerPerson = isDivided ? Math.round(annualDividendGross / 2) : annualDividendGross;
  const healthInsuranceProtected = annualDividendPerPerson <= 1000;

  let accumulatedSpent = 0;
  let accumulatedReinvested = 0;
  let accumulatedBuffered = 0;
  s4Run.flows.forEach((f) => {
    if (f.dividendSpent) accumulatedSpent += f.dividendSpent / 10000;
    if (f.dividendReinvested) accumulatedReinvested += f.dividendReinvested / 10000;
    if (f.dividendBuffered) accumulatedBuffered += f.dividendBuffered / 10000;
  });

  const finalCoveredCallAsset = Math.round((s4Run.finalCoveredCallAsset ?? 0) / 10000);
  const finalEmergencyBuffer = Math.round((s4Run.finalDividendBuffer ?? 0) / 10000);

  const policyLabels: Record<string, { label: string; desc: string; benefit: string; risk: string; prescription: string }> = {
    REINVEST: {
      label: "스노우볼 복리 재투자형",
      desc: "생활비 부족분 충당 후 잉여 배당금을 전액 커버드콜 원금에 재투자하여 은퇴 자산을 복리로 증식합니다.",
      benefit: `잉여 배당금 누적 ${Math.round(accumulatedReinvested).toLocaleString()}만원 재투자로 최종 커버드콜 자산이 ${finalCoveredCallAsset.toLocaleString()}만원으로 증대됩니다.`,
      risk: "고배당 커버드콜 ETF 원금(기초자산) 변동성에 지속 노출되므로 시장 급락기 평가손실 위험에 유의해야 합니다.",
      prescription: "은퇴 초기 활동기(60대)에는 스노우볼 재투자로 자산을 키우고, 70대 진입 시 안전버퍼(BUFFER) 적립으로 전환하여 원금을 보호하세요.",
    },
    BUFFER: {
      label: "비상자금 안전버퍼 적립형",
      desc: "잉여 배당금을 안전자산(연 2.5% MMF/단기채 복리)에 분리 적립하여 초고령기 긴급 의료·간병비 버퍼를 확보합니다.",
      benefit: `별도 안전 풀에 최종 ${finalEmergencyBuffer.toLocaleString()}만원의 비상자금이 적립되어 80대 이후 간병·의료비 리스크를 철저히 방어합니다.`,
      risk: "초기 원금 증식 속도는 재투자형 대비 완만하나, 원금 보존성과 심리적 안전판 효과가 가장 우수합니다.",
      prescription: "적립된 비상자금 풀은 주식 시장과 상관관계가 없는 파킹형/단기국채로 엄격히 분리 관리하여 초고령기 긴급 의료비 전용 통장으로 유지하세요.",
    },
    PAYOUT: {
      label: "배당금 전액 소비형",
      desc: "매월 발생하는 배당금을 즉시 인출하여 생활비로 전액 활용함으로써 공적연금 수령 전 소득 공백기를 방어합니다.",
      benefit: `연간 ${annualDividendGross.toLocaleString()}만원(월 약 ${Math.round(annualDividendGross / 12).toLocaleString()}만원)의 즉시 가용 현금흐름으로 생활비를 강력히 보당합니다.`,
      risk: "배당금 전액 소비 시 원금 재투자나 안전버퍼가 남지 않으므로, 향후 물가 상승에 따른 실질 구매력 저하를 사적연금과 병행 방어해야 합니다.",
      prescription: `1인당 연 배당소득 ${annualDividendPerPerson.toLocaleString()}만원을 1,000만원 이하로 유지${healthInsuranceProtected ? "(현재 안전)" : "(현재 초과 주의)"}하여 건보료 피부양자 자격을 방어하세요.`,
    },
  };

  const policyMeta = policyLabels[s4Policy] || policyLabels.REINVEST;
  const s4Analysis: S4DividendAnalysis = {
    policy: s4Policy,
    policyLabel: policyMeta.label,
    policyDescription: policyMeta.desc,
    coveredCallAssetInitial: s4AssetInitial,
    dividendRate: s4DivRate,
    isCoupleDivided: isDivided,
    annualDividendGross,
    annualDividendPerPerson,
    healthInsuranceProtected,
    finalCoveredCallAsset,
    finalEmergencyBuffer,
    accumulatedReinvested: Math.round(accumulatedReinvested),
    accumulatedBuffered: Math.round(accumulatedBuffered),
    accumulatedSpent: Math.round(accumulatedSpent),
    policyEvaluation: {
      coreBenefit: policyMeta.benefit,
      keyRisk: policyMeta.risk,
      strategicPrescription: policyMeta.prescription,
    },
  };

  const scenarios: ScenarioSummary[] = (Object.keys(runs) as ScenarioKey[]).map((key) => {
    const r = runs[key];
    return {
      key,
      id: r.strategyId,
      name: r.strategyName,
      preTax: r.lifetimeTotalPreTax,
      postTax: r.lifetimeTotalPostTax,
      taxHI: r.lifetimeTotalTaxAndHI,
      effectiveRate: r.lifetimeTotalPreTax > 0 ? r.lifetimeTotalTaxAndHI / r.lifetimeTotalPreTax : 0,
      lostDependencyAge: r.lostDependencyAge,
      finalCoveredCallAsset: r.finalCoveredCallAsset !== undefined ? Math.round(r.finalCoveredCallAsset / 10000) : undefined,
      finalDividendBuffer: r.finalDividendBuffer !== undefined ? Math.round(r.finalDividendBuffer / 10000) : undefined,
    };
  });
  const best = scenarios.reduce((b, s) => (s.postTax > b.postTax ? s : b));

  // 진단 점수 (0~100)
  const pub = layers.public.self + layers.public.spouse;
  const ret = layers.retirement.self + layers.retirement.spouse;
  const pri = layers.private.self + layers.private.spouse;
  const layerTotal = pub + ret + pri;
  const shares = layerTotal > 0 ? [pub, ret, pri].map((v) => v / layerTotal) : [0, 0, 0];
  const entropy = -shares.filter((p) => p > 0).reduce((a, p) => a + p * Math.log(p), 0) / Math.log(3);
  const survivorRatio = firstDeath && firstDeath.beforeReal > 0 ? firstDeath.afterReal / firstDeath.beforeReal : null;
  const lateCoverage = lateReal / minToday;
  const longevityScore =
    survivorRatio !== null ? 50 * clamp01(survivorRatio / SURVIVOR_NEED) + 50 * clamp01(lateCoverage) : 100 * clamp01(lateCoverage);

  const dimensions: Dimension[] = [
    {
      key: "sufficiency",
      label: "소득 충분성",
      weight: 30,
      score: Math.round(100 * clamp01(coverageRatio)),
      metric: `은퇴 후 평균 월 ${Math.round(avgRetiredReal).toLocaleString()}만원 / 지출곡선 평균 ${Math.round(avgTargetReal).toLocaleString()}만원 (${pct(coverageRatio)}%)`,
      basis: "은퇴 후 가구 월 연금 평균(현재가치) ÷ 지출 곡선 목표 생활비 평균 (초기 고지출 유지 후 완만 체감)",
    },
    {
      key: "stability",
      label: "소득 안정성",
      weight: 25,
      score: retired.length ? Math.round((100 * coveredYears) / retired.length) : 0,
      metric: `은퇴 후 ${retired.length}년 중 ${coveredYears}년 최저 생활비 이상 (${Math.round((100 * coveredYears) / (retired.length || 1))}% 충족)`,
      basis: "은퇴 후 가구 월 연금(현재가치)이 연차별 최저 생활비 이상인 해의 비율",
    },
    {
      key: "tax",
      label: "세후 효율",
      weight: 15,
      score: Math.round(100 * clamp01(1 - best.effectiveRate * 4)),
      metric: `추천 전략(${best.id}) 세금·건보료 부담률 ${(best.effectiveRate * 100).toFixed(1)}%`,
      basis: "추천 인출전략의 생애 세금·건보료 ÷ 세전 수령액 (0%면 100점, 25% 이상이면 0점)",
    },
    {
      key: "diversification",
      label: "3층 분산",
      weight: 10,
      score: Math.round(100 * entropy),
      metric: `공적 ${pct(shares[0])}% · 퇴직 ${pct(shares[1])}% · 개인 ${pct(shares[2])}%`,
      basis: "생애 수령액이 공적·퇴직·개인연금 3층에 고르게 나뉜 정도 (한 층에 몰리면 낮음)",
    },
    {
      key: "longevity",
      label: survivorRatio !== null ? "장수·유족 대비" : "장수 대비",
      weight: 20,
      score: Math.round(longevityScore),
      metric:
        survivorRatio !== null
          ? `첫 사망 후 가구 소득 ${pct(survivorRatio)}% 유지 · 말년 최소 생활비 충족 ${pct(Math.min(1, lateCoverage))}%${finalEmergencyBuffer > 0 ? ` (비상버퍼 ${finalEmergencyBuffer.toLocaleString()}만원)` : ""}`
          : `말년(마지막 ${LATE_YEARS}년) 최소 생활비 충족 ${pct(Math.min(1, lateCoverage))}%${finalEmergencyBuffer > 0 ? ` (비상버퍼 ${finalEmergencyBuffer.toLocaleString()}만원)` : ""}`,
      basis:
        survivorRatio !== null
          ? `첫 사망 후 3년 가구 소득이 이전의 70% 이상(50점) + 마지막 5년 최소 생활비 충족(50점)${finalEmergencyBuffer > 0 ? " (S4 비상 안전버퍼 추가 방어)" : ""}`
          : `마지막 5년 평균 월 연금(현재가치)의 최소 생활비 충족 정도${finalEmergencyBuffer > 0 ? " (S4 비상 안전버퍼 추가 방어)" : ""}`,
    },
  ];
  const total = Math.round(dimensions.reduce((a, d) => a + d.score * d.weight, 0) / 100);
  const g = GRADES.find((x) => total >= x.min) ?? GRADES[GRADES.length - 1];

  return {
    hasSpouse: !!spouse,
    baseYear,
    params,
    couple,
    inflation,
    retireYear: baseYear + retireT,
    targetToday,
    minToday,
    spendingPattern,
    activePhaseYears,
    annualDeclineRate,
    spendingCurve,
    avgTargetReal: Math.round(avgTargetReal),
    realHousehold,
    avgRetiredReal: Math.round(avgRetiredReal),
    shortfallPV: Math.round(shortfallPV),
    childSupport: { total: childSupportTotal, uncovered: Math.max(0, childSupportTotal - Math.max(0, params.nonPensionAssets || 0)) },
    medicalMonthly: Math.round((params.annualMedicalExpense || 0) / 12),
    belowMinSpans,
    crevasse: { years: crevasseTs.length, avgReal: Math.round(avg(crevasseTs)) },
    firstDeath,
    lateReal: Math.round(lateReal),
    layers,
    moneyFlow,
    scenarios,
    best,
    dimensions,
    total,
    grade: { letter: g.letter, label: g.label, color: g.color },
    nps: {
      selfAdded: selfNps.addedMonths,
      selfRestored: selfNps.restoredMonths,
      spouseAdded: spouse ? spouseNps.addedMonths : 0,
      spouseRestored: spouse ? spouseNps.restoredMonths : 0,
    },
    s4Analysis,
  };
}
