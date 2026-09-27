import { NPS_RULES, premiumRateForYear } from "@/config/npsRules";
import type { AdditionalPaymentState } from "@/store/usePensionStore";

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
    if (ap.gapMonths > span) {
      issues.push(`중단 기간(${ap.gapMonths}개월)이 최초 가입~지속 가입개시 사이(${span}개월)보다 깁니다.`);
      blocked = true;
    }
  }
  if (ap.receivedLumpSumRefund) {
    issues.push("반환일시금을 받은 기간은 먼저 반납해야 추납 자격이 생깁니다.");
  }
  const maxMonths = blocked ? 0 : Math.min(ap.gapMonths, NPS_RULES.maxAdditionalMonths);
  return { eligible: maxMonths > 0, maxMonths, issues };
}

// 임의(계속)가입자는 [지역 중위수, A값], 그 외는 기준소득월액 [하한, 상한] 범위로 제한
export function effectiveBaseIncome(ap: AdditionalPaymentState): number {
  if (ap.enrollStatus === "VOLUNTARY" || ap.enrollStatus === "VOLUNTARY_CONT") {
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
  const n = Math.min(NPS_RULES.maxInstallments, Math.max(1, ap.installments));
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
