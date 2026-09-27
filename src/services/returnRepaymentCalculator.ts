import {
  NPS_RULES,
  depositRateForYear,
  replacementConstantForYear,
  bWeightForYear,
  maxRefundInstallments,
} from "@/config/npsRules";
import {
  monthsBetween,
  firstDueYmOf,
  installmentInterestFactor,
  runAdditionalPaymentPlan,
  isVoluntary,
  effectiveBaseIncome,
} from "@/services/additionalPaymentCalculator";
import type {
  AdditionalPaymentState,
  NationalPensionState,
  ReturnRepaymentState,
  SimulationParamsState,
} from "@/store/usePensionStore";

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const yearOf = (ym: string) => Number(ym.slice(0, 4));

// 반납 이자: 반환일시금 지급월부터 반납 신청월 전월까지, 해마다 그 해 이자율로 원금에 가산(연 단위 복리)
export function refundInterestFactor(refundYm: string, applyYm: string): number {
  const months = Math.max(0, monthsBetween(refundYm, applyYm));
  const monthsByYear = new Map<number, number>();
  for (let k = 0; k < months; k++) {
    const y = yearOf(addMonths(refundYm, k));
    monthsByYear.set(y, (monthsByYear.get(y) || 0) + 1);
  }
  let factor = 1;
  monthsByYear.forEach((m, y) => {
    factor *= 1 + (depositRateForYear(y) / 100) * (m / 12);
  });
  return factor;
}

export interface RepaymentCost {
  principal: number; // 반환일시금 원금
  lumpSum: number; // 일시 반납금 (원금 + 반납 이자)
  installmentInterest: number; // 분할 시 추가 이자
  total: number; // 실제 낼 총액
  installments: number; // 적용된 분할 횟수
  source: "NOTICE" | "ESTIMATE"; // 공단 고지액 사용 여부
}

export function calcRepaymentCost(rr: ReturnRepaymentState): RepaymentCost {
  const source = rr.noticeAmount > 0 ? "NOTICE" : "ESTIMATE";
  const lumpSum =
    source === "NOTICE" ? rr.noticeAmount : rr.refundAmount * refundInterestFactor(rr.refundYm, rr.applyYm);
  const installments = Math.min(maxRefundInstallments(rr.restoredMonths), Math.max(1, Math.floor(rr.installments)));
  let installmentInterest = 0;
  if (installments > 1) {
    // 분할납부이자: 1년 만기 정기예금 이자율(신청 연도), 신청월~각 회차 납부월 전월, 1년 단위 복리
    const rate = depositRateForYear(yearOf(rr.applyYm));
    const firstDue = firstDueYmOf(rr.applyYm);
    for (let k = 0; k < installments; k++) {
      const due = addMonths(firstDue, k);
      installmentInterest += (lumpSum / installments) * (installmentInterestFactor(rate, monthsBetween(rr.applyYm, due)) - 1);
    }
  }
  return {
    principal: rr.refundAmount,
    lumpSum,
    installmentInterest,
    total: lumpSum + installmentInterest,
    installments,
    source,
  };
}

// 복원 기간의 가중 비례상수 합: wA = Σ 비례상수, wB = Σ 비례상수 × B가중(1998년 이전 0.75)
export function restoredWeights(rr: ReturnRepaymentState): { wA: number; wB: number } {
  let wA = 0;
  let wB = 0;
  for (let k = 0; k < Math.max(0, rr.restoredMonths); k++) {
    const y = yearOf(addMonths(rr.periodStartYm, k));
    const c = replacementConstantForYear(y);
    wA += c;
    wB += c * bWeightForYear(y);
  }
  return { wA, wB };
}

export interface CombinedPension {
  beforeMonthly: number;
  afterMonthly: number;
  totalMonthsBefore: number;
  totalMonthsAfter: number;
}

// 기본연금액(연) ≈ Σ 비례상수 × (A + 가중B) × 월수 / 240.
// 기존 기간 비례상수는 NPS 예상연금액으로 역산, 복원 기간은 당시 비례상수, 추납 기간은 현행 1.29.
// 복원 기간의 소득은 본인 평균소득(B)과 같다고 가정한다.
export function estimateCombinedPension(
  national: NationalPensionState,
  restored: { months: number; wA: number; wB: number },
  added: { months: number; income: number }
): CombinedPension {
  const A = national.aValue || NPS_RULES.aValue;
  const P = national.expectedTotalContributionMonths;
  const bOld = national.bValue || national.currentStandardMonthlyIncome;
  const c = NPS_RULES.replacementConstant;
  const calibrated = national.expectedMonthlyPension > 0 && P >= NPS_RULES.minPensionMonths;
  const alphaOld = calibrated ? (national.expectedMonthlyPension * 12 * 240) / ((A + bOld) * P) : c;
  const beforeMonthly =
    P >= NPS_RULES.minPensionMonths
      ? calibrated ? national.expectedMonthlyPension : ((A + bOld) * alphaOld * P) / 240 / 12
      : 0;
  const totalAfter = P + restored.months + added.months;
  const bNew = totalAfter > 0 ? (bOld * (P + restored.months) + added.income * added.months) / totalAfter : bOld;
  const annual = (A + bNew) * alphaOld * P + A * restored.wA + bNew * restored.wB + (A + bNew) * c * added.months;
  const afterMonthly = totalAfter >= NPS_RULES.minPensionMonths ? annual / 240 / 12 : 0;
  return { beforeMonthly, afterMonthly, totalMonthsBefore: P, totalMonthsAfter: totalAfter };
}

// 반납 계산에 필요한 입력이 다 있는지 (원금·복원 개월수·수령년월·복원 시작년월·신청년월)
export function isRepaymentReady(rr: ReturnRepaymentState): boolean {
  return rr.refundAmount > 0 && rr.restoredMonths > 0 && !!rr.refundYm && !!rr.periodStartYm && !!rr.applyYm;
}

export type ScenarioId = "D" | "B" | "C" | "A";

export interface RefundScenario {
  id: ScenarioId;
  label: string;
  addedMonths: number; // 복원 + 추납 개월수
  totalMonths: number;
  extraCost: number; // 새로 낼 금액 (반납금 + 추납보험료)
  lifetimePremium: number; // 생애 총 납부보험료 = 기존 총 예상 납부보험료 + extraCost
  monthly: number; // 예상 연금 월액
  delta: number; // 현행 대비 증가 월액
  recoverAgeTotal: number | null; // 생애 총 납부보험료를 다 돌려받는 나이
  recoverAgeExtra: number | null; // 새로 낸 금액만 돌려받는 나이
  recoverAgeCombined: number | null; // 현행(D) 총원금 회수 기간 + 추가 납부액을 증가분으로 회수하는 기간
  gainAtLifeExpectancy: number; // 기대수명까지 총 수령액 − 생애 총 납부보험료
  annualReturn: number | null; // 총 납부보험료를 개시~기대수명 동안 연복리로 굴려 총 수령액이 되는 이자율(%)
}

// 현재가치 기준 원금 회수 나이 = 개시 나이 + 원금 ÷ 월액 ÷ 12 (소수 첫째 자리)
function recoverAge(startAge: number, cost: number, monthly: number): number | null {
  if (monthly <= 0) return null;
  return Math.round((startAge + cost / monthly / 12) * 10) / 10;
}

// 대안 D 현행 유지 / B 반환일시금 반납 / C 추납 / A 반납 + 추납
export function compareRefundScenarios(
  national: NationalPensionState,
  rr: ReturnRepaymentState,
  ap: AdditionalPaymentState,
  params: SimulationParamsState
): RefundScenario[] {
  // 반환일시금 「받은 적 없음」이면 반납 입력이 남아 있어도 반납 대안을 계산하지 않는다
  const hasRefund = ap.receivedLumpSumRefund && isRepaymentReady(rr);
  const refundCost = hasRefund ? calcRepaymentCost(rr).total : 0;
  const weights = hasRefund ? restoredWeights(rr) : { wA: 0, wB: 0 };
  const restored = { months: hasRefund ? rr.restoredMonths : 0, ...weights };
  const plan = ap.applyYm ? runAdditionalPaymentPlan(ap, national, params) : null;
  const addMonthsCount = plan ? plan.months : 0;
  const addCost = plan ? plan.cost.total : 0;
  // 추납 기준소득월액: 임의(계속)가입자는 선택 금액, 그 외는 현재 기준소득월액 (runAdditionalPaymentPlan과 동일)
  const addIncome = effectiveBaseIncome(
    isVoluntary(ap) ? ap : { ...ap, baseIncome: national.currentStandardMonthlyIncome || ap.baseIncome }
  );
  const none = { months: 0, wA: 0, wB: 0 };
  const noAdd = { months: 0, income: 0 };
  const add = { months: addMonthsCount, income: addIncome };
  const variants: { id: ScenarioId; label: string; r: typeof restored; a: typeof add; cost: number }[] = [
    { id: "D", label: "현행 유지", r: none, a: noAdd, cost: 0 },
    { id: "B", label: "반환일시금 반납", r: restored, a: noAdd, cost: refundCost },
    { id: "C", label: "추납", r: none, a: add, cost: addCost },
    { id: "A", label: "반납 + 추납", r: restored, a: add, cost: refundCost + addCost },
  ];
  const start = params.nationalPensionStartAge;
  const years = Math.max(0, params.expectedLifeExpectancy - start + 1);
  const base = estimateCombinedPension(national, none, noAdd);
  const baseYears = base.afterMonthly > 0 ? national.totalExpectedPremium / base.afterMonthly / 12 : null;
  return variants.map((v) => {
    const p = estimateCombinedPension(national, v.r, v.a);
    const lifetimePremium = national.totalExpectedPremium + v.cost;
    const delta = p.afterMonthly - base.afterMonthly;
    const received = p.afterMonthly * 12 * years;
    return {
      id: v.id,
      label: v.label,
      addedMonths: v.r.months + v.a.months,
      totalMonths: p.totalMonthsAfter,
      extraCost: v.cost,
      lifetimePremium,
      monthly: p.afterMonthly,
      delta,
      recoverAgeTotal: recoverAge(start, lifetimePremium, p.afterMonthly),
      recoverAgeExtra: v.cost > 0 ? recoverAge(start, v.cost, delta) : null,
      recoverAgeCombined:
        v.cost > 0 && delta > 0 && baseYears !== null
          ? Math.round((start + baseYears + v.cost / delta / 12) * 10) / 10
          : null,
      gainAtLifeExpectancy: received - lifetimePremium,
      annualReturn:
        lifetimePremium > 0 && years > 0 ? (Math.pow(received / lifetimePremium, 1 / years) - 1) * 100 : null,
    };
  });
}

export interface AppliedNps {
  national: NationalPensionState; // 반영 토글이 모두 꺼져 있으면 입력 객체 그대로
  restoredMonths: number; // 반영된 반납 복원 개월수
  addedMonths: number; // 반영된 추납 개월수
}

// 대시보드·부부 시뮬레이션 반영용: 반영 토글이 켜진 반납·추납만 적용한 국민연금 상태
export function applyNpsOptions(
  national: NationalPensionState,
  ap: AdditionalPaymentState,
  rr: ReturnRepaymentState,
  params: SimulationParamsState
): AppliedNps {
  const unchanged = { national, restoredMonths: 0, addedMonths: 0 };
  // 예상 연금액은 있는데 총 예상 가입월수가 비어 있거나 120개월 미만이면 증가액을 계산할 근거가 없다
  if (national.expectedTotalContributionMonths < NPS_RULES.minPensionMonths && national.expectedMonthlyPension > 0) {
    return unchanged;
  }
  const useRefund = ap.receivedLumpSumRefund && rr.applyToSimulation && isRepaymentReady(rr);
  const plan = ap.applyToSimulation && ap.applyYm ? runAdditionalPaymentPlan(ap, national, params) : null;
  const useAdd = !!plan && plan.months > 0;
  if (!useRefund && !useAdd) return unchanged;

  const restored = useRefund ? { months: rr.restoredMonths, ...restoredWeights(rr) } : { months: 0, wA: 0, wB: 0 };
  const addIncome = effectiveBaseIncome(
    isVoluntary(ap) ? ap : { ...ap, baseIncome: national.currentStandardMonthlyIncome || ap.baseIncome }
  );
  const added = useAdd ? { months: plan!.months, income: addIncome } : { months: 0, income: 0 };
  const cost = (useRefund ? calcRepaymentCost(rr).total : 0) + (useAdd ? plan!.cost.total : 0);
  const combined = estimateCombinedPension(national, restored, added);
  return {
    national: {
      ...national,
      expectedMonthlyPension: Math.round(combined.afterMonthly * 10) / 10,
      expectedTotalContributionMonths: combined.totalMonthsAfter,
      contributionMonths: national.contributionMonths + restored.months + added.months,
      totalPaidAmount: Math.round(national.totalPaidAmount + cost),
      totalExpectedPremium: Math.round(national.totalExpectedPremium + cost),
    },
    restoredMonths: restored.months,
    addedMonths: added.months,
  };
}
