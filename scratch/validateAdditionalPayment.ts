import assert from "node:assert/strict";
import {
  monthsBetween,
  firstDueYmOf,
  installmentInterestFactor,
  checkEligibility,
  effectiveBaseIncome,
  calcAdditionalPaymentCost,
  estimateTaxRefund,
  estimatePensionIncrease,
  calcBreakEven,
  compareLumpVsInstallment,
  runAdditionalPaymentPlan,
  applyAdditionalPayment,
} from "../src/services/additionalPaymentCalculator";
import { premiumRateForYear } from "../src/config/npsRules";
import type {
  AdditionalPaymentState,
  NationalPensionState,
  SimulationParamsState,
} from "../src/store/usePensionStore";

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

const national: NationalPensionState = {
  contributionMonths: 240,
  totalPaidAmount: 5400,
  currentStandardMonthlyIncome: 300,
  expectedTotalContributionMonths: 300,
  expectedMonthlyPension: 80,
  totalExpectedPremium: 8100,
  basicPensionAmount: 0,
  aValue: 319.3511,
  bValue: 300,
};
const params = { nationalPensionStartAge: 65, expectedLifeExpectancy: 85 } as SimulationParamsState;

// 연금 증가: NPS 예상액 80만원(300개월)에 84개월(기준소득 100만원) 추납
const inc = estimatePensionIncrease(national, 84, 100);
assert.equal(inc.beforeMonthly, 80);
near(inc.afterMonthly, 96.0059);
near(inc.deltaMonthly, 16.0059);
assert.equal(inc.totalMonthsAfter, 384);
assert.equal(inc.becomesEligible, false);

// 10년 미달자: 60개월 → 144개월, 수급권 획득
const short = estimatePensionIncrease(
  { ...national, expectedTotalContributionMonths: 60, expectedMonthlyPension: 0, bValue: 0, currentStandardMonthlyIncome: 100 },
  84,
  100
);
assert.equal(short.beforeMonthly, 0);
near(short.afterMonthly, 27.0481);
assert.equal(short.becomesEligible, true);

// 손익분기
assert.equal(calcBreakEven(10, 100, params).breakEvenAge, 65);
assert.equal(calcBreakEven(0, 100, params).breakEvenAge, null);

// 종합 플랜: 일시납 798만원 - 환급 131.67만원 = 순비용 666.33만원, 연 192만원 수령 → 4년차(68세)
const plan = runAdditionalPaymentPlan(ap, national, params);
assert.equal(plan.months, 84);
near(plan.netCost, 666.33);
assert.equal(plan.breakEven.breakEvenAge, 68);
assert.equal(plan.breakEven.yearsToBreakEven, 4);
near(plan.breakEven.lifetimeGain, 3367.16);
assert.deepEqual(plan.warnings, []);
assert.equal(plan.comparisons.length, 3);
assert.equal(plan.comparisons[0].yearsToBreakEven, 5); // 최소 기준소득 (세전)
assert.equal(plan.comparisons[2].yearsToBreakEven, 9); // A값 기준은 회수가 더 늦다

// 분납 경고: 일시납보다 약 79만원 더
const instPlan = runAdditionalPaymentPlan({ ...ap, paymentMode: "INSTALLMENT", installments: 24 }, national, params);
assert.ok(instPlan.warnings.some((w) => w.includes("약 79만원")));

// 일시납 vs 분납 비교 (사용자 선택 36회 포함)
const options = compareLumpVsInstallment({ ...ap, installments: 36 }, national, params, 84);
assert.deepEqual(options.map((o) => o.label), ["일시납", "분납 12회", "분납 24회", "분납 36회", "분납 60회"]);
const [lumpOpt, inst12, , , inst60] = options;
near(lumpOpt.total, 798);
near(lumpOpt.netCost, 666.33);
assert.equal(lumpOpt.breakEvenAge, 68);
near(inst12.total, 844.3531);
near(inst12.monthlyMin, 66.6385);
near(inst12.monthlyMax, 71.75);
assert.equal(inst12.lastDueYm, "2027-10");
near(inst60.total, 979.3511);
near(inst60.interest, 62.3511);
assert.equal(inst60.lastDueYm, "2031-10");
assert.equal(inst60.breakEvenAge, 69);
near(inst60.lifetimeGain, 3205.4447);
// 수령액(연금 증가)은 납부 방식과 무관
assert.ok(options.every((o) => Math.abs(o.deltaMonthly - lumpOpt.deltaMonthly) < 1e-9));
// 종합 플랜에도 포함 (기본 12회 → 일시납·12·24·60)
assert.equal(plan.paymentOptions.length, 4);

// 12월 신청 경고
const decPlan = runAdditionalPaymentPlan({ ...ap, applyYm: "2026-12" }, national, params);
assert.ok(decPlan.warnings.some((w) => w.includes("12월")));

// 희망 개월수가 한도 초과 → 잘라서 계산 + 경고
const over = runAdditionalPaymentPlan({ ...ap, requestedMonths: 150 }, national, params);
assert.equal(over.months, 84);
assert.ok(over.warnings[0].includes("최대 84개월"));

// 대시보드 반영
const applied = applyAdditionalPayment(national, ap, params);
assert.equal(applied.expectedMonthlyPension, 96);
assert.equal(applied.expectedTotalContributionMonths, 384);
assert.equal(applied.totalPaidAmount, 6198);
assert.equal(applyAdditionalPayment(national, { ...ap, applyToSimulation: false }, params), national);
assert.equal(applyAdditionalPayment(national, { ...ap, applyYm: "" }, params), national); // 신청 년월 미입력 → 반영 안 함

console.log("Additional payment validation success!");
