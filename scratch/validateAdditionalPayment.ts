import assert from "node:assert/strict";
import {
  monthsBetween,
  firstDueYmOf,
  installmentInterestFactor,
  checkEligibility,
  effectiveBaseIncome,
  calcAdditionalPaymentCost,
  estimateTaxRefund,
} from "../src/services/additionalPaymentCalculator";
import { premiumRateForYear } from "../src/config/npsRules";
import type { AdditionalPaymentState } from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 0.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

const ap: AdditionalPaymentState = {
  firstEnrollYm: "1998-03",
  resumeYm: "2008-03",
  gapMonths: 84,
  gapReason: "EXEMPT",
  enrollStatus: "REGIONAL",
  receivedLumpSumRefund: false,
  requestedMonths: 84,
  baseIncome: 100,
  paymentMode: "LUMP",
  installments: 12,
  installmentInterestRate: 2.5,
  applyYm: "2026-10",
  marginalTaxRate: 16.5,
  applyToSimulation: true,
};

// 보험료율 일정
assert.equal(premiumRateForYear(2025), 9.0);
assert.equal(premiumRateForYear(2026), 9.5);
assert.equal(premiumRateForYear(2033), 13.0);
assert.equal(premiumRateForYear(2040), 13.0);

// 년월 계산 — 첫 납부기한은 신청 다음 달
assert.equal(monthsBetween("1998-03", "2008-03"), 120);
assert.equal(firstDueYmOf("2026-10"), "2026-11");
assert.equal(firstDueYmOf("2026-12"), "2027-01");

// 자격 판정
assert.deepEqual(checkEligibility(ap), { eligible: true, maxMonths: 84, issues: [] });
assert.equal(checkEligibility({ ...ap, gapReason: "ARREARS" }).maxMonths, 0);
assert.equal(checkEligibility({ ...ap, enrollStatus: "NONE" }).eligible, false);
assert.equal(checkEligibility({ ...ap, gapMonths: 200, resumeYm: "2020-01" }).maxMonths, 119);
assert.equal(checkEligibility({ ...ap, gapMonths: 130 }).eligible, false); // 중단기간 > 가입~재가입 120개월
const refund = checkEligibility({ ...ap, receivedLumpSumRefund: true });
assert.equal(refund.eligible, true);
assert.equal(refund.issues.length, 1);

// 임의가입자 기준소득월액 범위 [100, A값], 그 외 [41, 659]
near(effectiveBaseIncome({ ...ap, enrollStatus: "VOLUNTARY", baseIncome: 500 }), 319.3511);
assert.equal(effectiveBaseIncome({ ...ap, enrollStatus: "VOLUNTARY", baseIncome: 50 }), 100);
assert.equal(effectiveBaseIncome({ ...ap, baseIncome: 500 }), 500);
assert.equal(effectiveBaseIncome({ ...ap, baseIncome: 800 }), 659);
assert.equal(effectiveBaseIncome({ ...ap, baseIncome: 30 }), 41);

// 일시납: 100만원 × 9.5%(납부기한 2026-11) × 84개월
const lump = calcAdditionalPaymentCost(ap, 84);
near(lump.total, 798);
assert.equal(lump.rows.length, 1);
assert.equal(lump.rows[0].dueYm, "2026-11");

// 12월 신청 → 납부기한 2027-01 → 10% 적용
near(calcAdditionalPaymentCost({ ...ap, applyYm: "2026-12" }, 84).total, 840);

// 분할납부이자 계수: 1년 단위 복리 (연 3%: 12개월 1.03, 24개월 1.0609, 18개월 1.03 × 1.015)
near(installmentInterestFactor(3, 12), 1.03, 1e-9);
near(installmentInterestFactor(3, 24), 1.0609, 1e-9);
near(installmentInterestFactor(3, 18), 1.04545, 1e-9);
near(installmentInterestFactor(3, 1), 1.0025, 1e-9);

// 분납 24회: 납부기한 2026-11~2028-10, 해마다 요율 상승 + 복리 이자
const inst = calcAdditionalPaymentCost({ ...ap, paymentMode: "INSTALLMENT", installments: 24 }, 84);
near(inst.principal, 854);
near(inst.interest, 22.7240);
near(inst.total, 876.7240);
near(inst.lumpSumTotal, 798);
assert.equal(inst.rows[0].dueYm, "2026-11");
assert.equal(inst.rows[0].rate, 9.5);
near(inst.rows[0].interest, 0.0693); // 신청월(10월) 1개월분
assert.equal(inst.rows[2].dueYm, "2027-01");
assert.equal(inst.rows[2].rate, 10.0);
assert.equal(inst.rows[23].dueYm, "2028-10");
assert.equal(inst.rows[23].rate, 10.5);

// 소득공제 환급: 연소득 한도 내 × 한계세율
near(estimateTaxRefund(lump, 3600, 16.5), 131.67);
near(estimateTaxRefund(lump, 50, 16.5), 8.25);

console.log("Task 3 validation success!");
