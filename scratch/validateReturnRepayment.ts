import assert from "node:assert/strict";
import {
  depositRateForYear,
  replacementConstantForYear,
  bWeightForYear,
  survivorRateForMonths,
  maxRefundInstallments,
} from "../src/config/npsRules";
import {
  refundInterestFactor,
  calcRepaymentCost,
  restoredWeights,
  estimateCombinedPension,
  compareRefundScenarios,
  applyNpsOptions,
} from "../src/services/returnRepaymentCalculator";
import { estimatePensionIncrease, applyAdditionalPayment } from "../src/services/additionalPaymentCalculator";
import type {
  AdditionalPaymentState,
  NationalPensionState,
  ReturnRepaymentState,
  SimulationParamsState,
} from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 0.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

// 룰셋
assert.equal(depositRateForYear(1996), 9.4);
assert.equal(depositRateForYear(1980), 10); // 표 이전 → 1988년 값
assert.equal(depositRateForYear(2030), 2.2); // 표 이후 → 2026년 값
assert.equal(replacementConstantForYear(1995), 2.4);
assert.equal(replacementConstantForYear(2003), 1.8);
near(replacementConstantForYear(2025), 1.245, 1e-9);
assert.equal(replacementConstantForYear(2026), 1.29);
assert.equal(bWeightForYear(1998), 0.75);
assert.equal(bWeightForYear(1999), 1);
assert.equal(survivorRateForMonths(119), 0.4);
assert.equal(survivorRateForMonths(125), 0.5);
assert.equal(survivorRateForMonths(240), 0.6);
assert.equal(maxRefundInstallments(11), 3);
assert.equal(maxRefundInstallments(30), 12);
assert.equal(maxRefundInstallments(60), 24);

// 참고 사례: 1996-03 반환일시금 104.4만원, 1993-10부터 30개월 복원, 2026-10 반납 신청
const rr: ReturnRepaymentState = {
  refundAmount: 104.4,
  refundYm: "1996-03",
  restoredMonths: 30,
  periodStartYm: "1993-10",
  noticeAmount: 0,
  applyYm: "2026-10",
  installments: 1,
  applyToSimulation: true,
};
near(refundInterestFactor("1996-03", "2026-10"), 2.9793, 1e-3);
const lump = calcRepaymentCost(rr);
near(lump.lumpSum, 311.04);
assert.equal(lump.source, "ESTIMATE");
assert.equal(lump.installments, 1);
const inst = calcRepaymentCost({ ...rr, installments: 12 });
near(inst.installmentInterest, 3.71);
near(inst.total, 314.74);
assert.equal(calcRepaymentCost({ ...rr, installments: 24 }).installments, 12); // 30개월 복원 → 최대 12회
const notice = calcRepaymentCost({ ...rr, noticeAmount: 350 });
assert.equal(notice.lumpSum, 350);
assert.equal(notice.source, "NOTICE");
// 1993-10~1996-03 (30개월) 모두 비례상수 2.4, B 가중 0.75
near(restoredWeights(rr).wA, 72, 1e-6);
near(restoredWeights(rr).wB, 54, 1e-6);

const national: NationalPensionState = {
  contributionMonths: 71,
  totalPaidAmount: 643.6,
  currentStandardMonthlyIncome: 101.3,
  expectedTotalContributionMonths: 125,
  expectedMonthlyPension: 23.648,
  totalExpectedPremium: 1229.129,
  basicPensionAmount: 0,
  aValue: 319.3511,
  bValue: 101.3,
};
const ap: AdditionalPaymentState = {
  firstEnrollYm: "1993-10",
  resumeYm: "2020-10",
  gapMonths: 180,
  gapReason: "EXCLUDED",
  enrollStatus: "VOLUNTARY",
  receivedLumpSumRefund: false,
  requestedMonths: 119,
  baseIncome: 101.3,
  paymentMode: "LUMP",
  installments: 12,
  installmentInterestRate: 2.5,
  applyYm: "2026-10",
  marginalTaxRate: 0,
  applyToSimulation: true,
};
const params = { nationalPensionStartAge: 65, expectedLifeExpectancy: 88 } as SimulationParamsState;

// 복원 없는 결합 계산 = 기존 추납 계산
near(
  estimateCombinedPension(national, { months: 0, wA: 0, wB: 0 }, { months: 119, income: 101.3 }).afterMonthly,
  estimatePensionIncrease(national, 119, 101.3).afterMonthly,
  1e-9
);

const [D, B, C, A] = compareRefundScenarios(national, rr, ap, params);
assert.deepEqual([D.id, B.id, C.id, A.id], ["D", "B", "C", "A"]);
near(D.monthly, 23.648);
assert.equal(D.recoverAgeTotal, 69.3);
near(D.gainAtLifeExpectancy, 5581.5);
near(B.monthly, 33.53);
near(B.extraCost, 311.04);
assert.equal(B.totalMonths, 155);
assert.equal(B.recoverAgeTotal, 68.8);
assert.equal(B.recoverAgeExtra, 67.6);
near(C.monthly, 46.07);
near(C.extraCost, 1145.20);
assert.equal(C.totalMonths, 244);
near(A.monthly, 55.95);
assert.equal(A.totalMonths, 274);
near(A.extraCost, 1456.23);
assert.equal(A.recoverAgeTotal, 69);
near(A.gainAtLifeExpectancy, 13429.02);

// 대시보드 반영
const both = applyNpsOptions(national, ap, rr, params);
near(both.national.expectedMonthlyPension, 56.0, 1e-9);
assert.equal(both.national.expectedTotalContributionMonths, 274);
assert.equal(both.restoredMonths, 30);
assert.equal(both.addedMonths, 119);
assert.equal(both.national.totalExpectedPremium, 2685);
const off = applyNpsOptions(national, { ...ap, applyToSimulation: false }, { ...rr, applyToSimulation: false }, params);
assert.equal(off.national, national);
// 반납 끄면 기존 추납 반영과 같다
const addOnly = applyNpsOptions(national, ap, { ...rr, applyToSimulation: false }, params);
const legacy = applyAdditionalPayment(national, ap, params);
assert.equal(addOnly.national.expectedMonthlyPension, legacy.expectedMonthlyPension);
assert.equal(addOnly.national.expectedTotalContributionMonths, legacy.expectedTotalContributionMonths);
// 가입월수 누락 + 예상연금 있음 → 반영 안 함
assert.equal(applyNpsOptions({ ...national, expectedTotalContributionMonths: 0 }, ap, rr, params).national.expectedMonthlyPension, 23.648);

console.log("Return repayment validation success!");
