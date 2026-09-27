import { NPS_RULES, premiumRateForYear } from "@/config/npsRules";
import type {
  AdditionalPaymentState,
  NationalPensionState,
  SimulationParamsState,
} from "@/store/usePensionStore";

export function monthsBetween(fromYm: string, toYm: string): number {
  const [fy, fm] = fromYm.split("-").map(Number);
  const [ty, tm] = toYm.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const yearOf = (ym: string) => Number(ym.slice(0, 4));

// 첫 납부기한 = 신청 다음 달 말일 (공단: 신청 다음 달 고지, 그 달 말일까지 납부)
export const firstDueYmOf = (applyYm: string) => addMonths(applyYm, 1);

export interface Eligibility {
  eligible: boolean;
  maxMonths: number;
  issues: string[];
}

export function checkEligibility(ap: AdditionalPaymentState): Eligibility {
  const issues: string[] = [];
  let blocked = false;
  if (!ap.firstEnrollYm) {
    issues.push("최초 가입년월을 입력해야 과거 납부 이력(1개월 이상)을 확인할 수 있습니다.");
    blocked = true;
  }
  if (ap.gapReason === "ARREARS") {
    issues.push("체납(미납) 기간은 추납 대상이 아닙니다. 납부예외·적용제외·군복무 기간만 가능합니다.");
    blocked = true;
  }
  if (ap.enrollStatus === "NONE") {
    issues.push("국민연금 자격을 유지하는 동안(소득신고 또는 임의가입 중)에만 신청할 수 있습니다. 임의가입 후 신청하세요.");
    blocked = true;
  }
  if (ap.firstEnrollYm && ap.resumeYm) {
    const span = monthsBetween(ap.firstEnrollYm, ap.resumeYm);
    if (span <= 0) {
      issues.push("지속 가입개시 년월이 최초 가입년월보다 뒤여야 합니다.");
      blocked = true;
    } else if (ap.gapMonths > span) {
      issues.push(`중단 기간(${ap.gapMonths}개월)이 최초 가입~지속 가입개시 사이(${span}개월)보다 깁니다.`);
      blocked = true;
    }
  }
  if (!blocked && ap.gapMonths <= 0) {
    issues.push("중단 기간(개월)을 입력하세요.");
  }
  const maxMonths = blocked ? 0 : Math.min(Math.max(0, ap.gapMonths), NPS_RULES.maxAdditionalMonths);
  return { eligible: maxMonths > 0, maxMonths, issues };
}

// 임의(계속)가입자만 기준소득월액을 스스로 선택할 수 있다
export function isVoluntary(ap: AdditionalPaymentState): boolean {
  return ap.enrollStatus === "VOLUNTARY" || ap.enrollStatus === "VOLUNTARY_CONT";
}

// 임의(계속)가입자는 [지역 중위수, A값], 그 외는 기준소득월액 [하한, 상한] 범위로 제한
export function effectiveBaseIncome(ap: AdditionalPaymentState): number {
  if (isVoluntary(ap)) {
    return Math.min(NPS_RULES.aValue, Math.max(NPS_RULES.voluntaryIncomeFloor, ap.baseIncome));
  }
  return Math.min(NPS_RULES.incomeCap, Math.max(NPS_RULES.incomeFloor, ap.baseIncome));
}

// 분할납부이자: 신청월부터 납부월 전월까지(m개월), 1년 단위로 이자를 원금에 가산하는 복리
// 계수 = (1 + r)^(m/12의 몫) × (1 + r × (m/12의 나머지)/12)
export function installmentInterestFactor(annualRatePct: number, m: number): number {
  const r = annualRatePct / 100;
  return Math.pow(1 + r, Math.floor(m / 12)) * (1 + (r * (m % 12)) / 12);
}

export interface PaymentRow {
  dueYm: string;
  rate: number;
  principal: number;
  interest: number;
}

export interface CostResult {
  total: number;
  principal: number;
  interest: number;
  lumpSumTotal: number;
  rows: PaymentRow[];
}

// 보험료율은 납부기한이 속하는 달 기준 (2025.11.25 공포·시행 국민연금법 개정)
export function calcAdditionalPaymentCost(ap: AdditionalPaymentState, months: number): CostResult {
  const income = effectiveBaseIncome(ap);
  const firstDueYm = firstDueYmOf(ap.applyYm);
  const lumpRate = premiumRateForYear(yearOf(firstDueYm));
  const lumpSumTotal = income * (lumpRate / 100) * months;
  if (ap.paymentMode === "LUMP") {
    return {
      total: lumpSumTotal,
      principal: lumpSumTotal,
      interest: 0,
      lumpSumTotal,
      rows: [{ dueYm: firstDueYm, rate: lumpRate, principal: lumpSumTotal, interest: 0 }],
    };
  }
  const n = Math.min(NPS_RULES.maxInstallments, Math.max(1, Math.floor(ap.installments)));
  const rows: PaymentRow[] = [];
  for (let k = 0; k < n; k++) {
    const dueYm = addMonths(firstDueYm, k);
    const rate = premiumRateForYear(yearOf(dueYm));
    const principal = income * (rate / 100) * (months / n);
    const interest = principal * (installmentInterestFactor(ap.installmentInterestRate, monthsBetween(ap.applyYm, dueYm)) - 1);
    rows.push({ dueYm, rate, principal, interest });
  }
  const principal = rows.reduce((s, r) => s + r.principal, 0);
  const interest = rows.reduce((s, r) => s + r.interest, 0);
  return { total: principal + interest, principal, interest, lumpSumTotal, rows };
}

// 연금보험료 소득공제 환급 추정: 연도별 납부원금을 연소득 한도 내에서 공제 × 한계세율
export function estimateTaxRefund(cost: CostResult, annualIncome: number, marginalTaxRate: number): number {
  const byYear = new Map<number, number>();
  cost.rows.forEach((r) => byYear.set(yearOf(r.dueYm), (byYear.get(yearOf(r.dueYm)) || 0) + r.principal));
  let refund = 0;
  byYear.forEach((paid) => {
    refund += Math.min(paid, annualIncome) * (marginalTaxRate / 100);
  });
  return refund;
}

export interface PensionIncrease {
  beforeMonthly: number;
  afterMonthly: number;
  deltaMonthly: number;
  totalMonthsBefore: number;
  totalMonthsAfter: number;
  becomesEligible: boolean;
}

// 기본연금액(연) ≈ 비례상수 × (A + B) × 가입월수 / 240.
// 기존 기간의 평균 비례상수는 NPS 예상연금액으로 역산하고, 추납 월은 현행 1.29 적용.
export function estimatePensionIncrease(
  national: NationalPensionState,
  months: number,
  baseIncome: number
): PensionIncrease {
  const A = national.aValue || NPS_RULES.aValue;
  const P = national.expectedTotalContributionMonths;
  const bOld = national.bValue || national.currentStandardMonthlyIncome;
  const c = NPS_RULES.replacementConstant;
  const calibrated = national.expectedMonthlyPension > 0 && P >= NPS_RULES.minPensionMonths;
  const alphaOld = calibrated ? (national.expectedMonthlyPension * 12 * 240) / ((A + bOld) * P) : c;
  const monthly = (B: number, weightedMonths: number) => ((A + B) * weightedMonths) / 240 / 12;

  const beforeMonthly =
    P >= NPS_RULES.minPensionMonths
      ? calibrated ? national.expectedMonthlyPension : monthly(bOld, alphaOld * P)
      : 0;
  const totalAfter = P + months;
  const bNew = totalAfter > 0 ? (bOld * P + baseIncome * months) / totalAfter : baseIncome;
  const afterMonthly = totalAfter >= NPS_RULES.minPensionMonths ? monthly(bNew, alphaOld * P + c * months) : 0;
  return {
    beforeMonthly,
    afterMonthly,
    deltaMonthly: afterMonthly - beforeMonthly,
    totalMonthsBefore: P,
    totalMonthsAfter: totalAfter,
    becomesEligible: P < NPS_RULES.minPensionMonths && totalAfter >= NPS_RULES.minPensionMonths,
  };
}

export interface BreakEven {
  breakEvenAge: number | null;
  yearsToBreakEven: number | null;
  lifetimeGain: number;
  cumulative: { age: number; received: number; cost: number }[];
}

// 현재가치 기준: 국민연금은 물가연동이므로 오늘 가치로 매년 Δ월액×12를 받는다
export function calcBreakEven(deltaMonthly: number, netCost: number, params: SimulationParamsState): BreakEven {
  const cumulative: BreakEven["cumulative"] = [];
  let received = 0;
  let breakEvenAge: number | null = null;
  for (let age = params.nationalPensionStartAge; age <= params.expectedLifeExpectancy; age++) {
    received += deltaMonthly * 12;
    cumulative.push({ age, received: Math.round(received), cost: Math.round(netCost) });
    if (breakEvenAge === null && received >= netCost) breakEvenAge = age;
  }
  return {
    breakEvenAge,
    yearsToBreakEven: breakEvenAge === null ? null : breakEvenAge - params.nationalPensionStartAge + 1,
    lifetimeGain: received - netCost,
    cumulative,
  };
}

export interface IncomeOption {
  label: string;
  baseIncome: number;
  cost: number;
  deltaMonthly: number;
  yearsToBreakEven: number | null;
}

// 같은 개월수에서 기준소득월액만 바꿔 비교 ("적은 금액 × 최장 기간" 원칙 확인용, 세전 비용)
export function compareBaseIncomes(
  ap: AdditionalPaymentState,
  national: NationalPensionState,
  params: SimulationParamsState,
  months: number
): IncomeOption[] {
  const options = [
    { label: "최소(지역 중위수)", baseIncome: NPS_RULES.voluntaryIncomeFloor },
    { label: "현재 입력", baseIncome: effectiveBaseIncome(ap) },
    { label: "A값(임의가입 상한)", baseIncome: NPS_RULES.aValue },
  ];
  return options.map((o) => {
    const cost = calcAdditionalPaymentCost({ ...ap, baseIncome: o.baseIncome, enrollStatus: "REGIONAL" }, months).total;
    const deltaMonthly = estimatePensionIncrease(national, months, o.baseIncome).deltaMonthly;
    return { ...o, cost, deltaMonthly, yearsToBreakEven: calcBreakEven(deltaMonthly, cost, params).yearsToBreakEven };
  });
}

export interface PaymentOption {
  label: string;
  installments: number; // 1 = 일시납
  total: number;
  principal: number;
  interest: number;
  monthlyMin: number; // 회차별 납부액 최소 (원금+이자)
  monthlyMax: number; // 회차별 납부액 최대
  lastDueYm: string;
  taxRefund: number;
  netCost: number;
  deltaMonthly: number;
  breakEvenAge: number | null;
  lifetimeGain: number;
}

// 일시납 vs 분납(12·24·60회 + 사용자 선택 횟수) 납부액·수령액 비교
export function compareLumpVsInstallment(
  ap: AdditionalPaymentState,
  national: NationalPensionState,
  params: SimulationParamsState,
  months: number
): PaymentOption[] {
  const counts = [...new Set([12, 24, NPS_RULES.maxInstallments, ap.installments])]
    .filter((n) => n >= 2 && n <= NPS_RULES.maxInstallments)
    .sort((a, b) => a - b);
  // 연금 증가액은 납부 방식과 무관 (같은 개월수·기준소득)
  const deltaMonthly = estimatePensionIncrease(national, months, effectiveBaseIncome(ap)).deltaMonthly;
  const variants = [
    { label: "일시납", installments: 1, ap: { ...ap, paymentMode: "LUMP" as const } },
    ...counts.map((n) => ({
      label: `분납 ${n}회`,
      installments: n,
      ap: { ...ap, paymentMode: "INSTALLMENT" as const, installments: n },
    })),
  ];
  return variants.map((v) => {
    const cost = calcAdditionalPaymentCost(v.ap, months);
    const perRow = cost.rows.map((r) => r.principal + r.interest);
    const taxRefund = estimateTaxRefund(cost, national.currentStandardMonthlyIncome * 12, ap.marginalTaxRate);
    const netCost = cost.total - taxRefund;
    const be = calcBreakEven(deltaMonthly, netCost, params);
    return {
      label: v.label,
      installments: v.installments,
      total: cost.total,
      principal: cost.principal,
      interest: cost.interest,
      monthlyMin: Math.min(...perRow),
      monthlyMax: Math.max(...perRow),
      lastDueYm: cost.rows[cost.rows.length - 1].dueYm,
      taxRefund,
      netCost,
      deltaMonthly,
      breakEvenAge: be.breakEvenAge,
      lifetimeGain: be.lifetimeGain,
    };
  });
}

export interface AdditionalPaymentPlan {
  eligibility: Eligibility;
  months: number;
  cost: CostResult;
  taxRefund: number;
  netCost: number;
  increase: PensionIncrease;
  breakEven: BreakEven;
  comparisons: IncomeOption[];
  paymentOptions: PaymentOption[];
  warnings: string[];
}

export function runAdditionalPaymentPlan(
  ap: AdditionalPaymentState,
  national: NationalPensionState,
  params: SimulationParamsState
): AdditionalPaymentPlan {
  const eligibility = checkEligibility(ap);
  const months = Math.max(0, Math.min(ap.requestedMonths, eligibility.maxMonths));
  // 사업장·지역가입자는 신청일 기준소득월액(현재 소득)을 그대로 쓰고, 임의(계속)가입자만 금액을 선택한다
  const apEff = isVoluntary(ap) ? ap : { ...ap, baseIncome: national.currentStandardMonthlyIncome || ap.baseIncome };
  const cost = calcAdditionalPaymentCost(apEff, months);
  const taxRefund = estimateTaxRefund(cost, national.currentStandardMonthlyIncome * 12, apEff.marginalTaxRate);
  const netCost = cost.total - taxRefund;
  const increase = estimatePensionIncrease(national, months, effectiveBaseIncome(apEff));
  const breakEven = calcBreakEven(increase.deltaMonthly, netCost, params);
  const comparisons = compareBaseIncomes(apEff, national, params, months);
  const paymentOptions = compareLumpVsInstallment(apEff, national, params, months);

  const warnings: string[] = [];
  if (national.expectedTotalContributionMonths < NPS_RULES.minPensionMonths && national.expectedMonthlyPension > 0) {
    warnings.push(
      "예상 연금액은 있는데 총 예상 가입월수가 비어 있거나 120개월 미만이라 연금 증가액을 계산할 수 없습니다. 「NPS 공단고서 상세 입력」 탭의 총 예상 가입월수를 확인하세요."
    );
  }
  if (ap.requestedMonths > eligibility.maxMonths && eligibility.maxMonths > 0) {
    warnings.push(`추납 가능 개월수는 최대 ${eligibility.maxMonths}개월입니다. 초과분은 제외하고 계산했습니다.`);
  }
  if (increase.becomesEligible) {
    warnings.push("추납으로 최소 가입기간 10년(120개월)을 채워 노령연금 수급권이 생깁니다.");
  }
  if (ap.applyYm && yearOf(firstDueYmOf(ap.applyYm)) > yearOf(ap.applyYm)) {
    warnings.push("12월에 신청하면 첫 납부기한이 다음 해 1월이라 인상된 보험료율이 적용됩니다. 11월 이전 신청을 권장합니다.");
  }
  const extra = cost.total - cost.lumpSumTotal;
  if (ap.paymentMode === "INSTALLMENT" && extra > 0) {
    warnings.push(`분납 시 해마다 오르는 보험료율과 분납이자로 일시납보다 약 ${Math.round(extra).toLocaleString()}만원을 더 냅니다.`);
  }
  if (
    increase.beforeMonthly * 12 <= NPS_RULES.dependentIncomeCapAnnual &&
    increase.afterMonthly * 12 > NPS_RULES.dependentIncomeCapAnnual
  ) {
    warnings.push("추납 후 공적연금이 연 2,000만원을 넘어 건강보험 피부양자 자격을 잃을 수 있습니다.");
  }
  return { eligibility, months, cost, taxRefund, netCost, increase, breakEven, comparisons, paymentOptions, warnings };
}

// 대시보드 시뮬레이션 반영용: 추납 후 값으로 바꾼 국민연금 상태 (반영 토글이 꺼져 있으면 원본 그대로)
export function applyAdditionalPayment(
  national: NationalPensionState,
  ap: AdditionalPaymentState,
  params: SimulationParamsState
): NationalPensionState {
  if (!ap.applyToSimulation || !ap.applyYm) return national;
  // 예상 연금액은 있는데 총 예상 가입월수가 비어 있거나 120개월 미만이면 증가액을 계산할 근거가 없다
  if (national.expectedTotalContributionMonths < NPS_RULES.minPensionMonths && national.expectedMonthlyPension > 0) {
    return national;
  }
  const plan = runAdditionalPaymentPlan(ap, national, params);
  if (plan.months <= 0) return national;
  return {
    ...national,
    expectedMonthlyPension: Math.round(plan.increase.afterMonthly * 10) / 10,
    expectedTotalContributionMonths: plan.increase.totalMonthsAfter,
    totalPaidAmount: Math.round(national.totalPaidAmount + plan.cost.total),
    contributionMonths: national.contributionMonths + plan.months,
  };
}
