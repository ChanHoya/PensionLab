import assert from "node:assert/strict";
import { buildBoostRoadmap } from "../src/services/npsBoostRoadmap";
import type { AdditionalPaymentState, NationalPensionState, PersonData, ReturnRepaymentState, SimulationParamsState } from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 0.15) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

// 영상 예시와 비슷한 전업주부: 예상 연금 월 20만원, 반환일시금 수령 이력, 납부예외 119개월
const national: NationalPensionState = {
  contributionMonths: 120,
  totalPaidAmount: 1000,
  currentStandardMonthlyIncome: 100,
  expectedTotalContributionMonths: 120,
  expectedMonthlyPension: 20,
  totalExpectedPremium: 1000,
  basicPensionAmount: 0,
  aValue: 319.3511,
  bValue: 100,
};
const ap: AdditionalPaymentState = {
  firstEnrollYm: "1995-01",
  resumeYm: "2015-01",
  gapMonths: 119,
  gapReason: "EXEMPT",
  enrollStatus: "VOLUNTARY",
  receivedLumpSumRefund: true,
  requestedMonths: 0, // 비우면 대상 최대 개월수
  baseIncome: 100,
  paymentMode: "LUMP",
  installments: 1,
  installmentInterestRate: 2.5,
  applyYm: "2026-10",
  marginalTaxRate: 0,
  applyToSimulation: false, // 대시보드 반영과 무관하게 로드맵은 계산
};
const rr: ReturnRepaymentState = {
  refundAmount: 104.4,
  refundYm: "1996-03",
  restoredMonths: 30,
  periodStartYm: "1993-10",
  noticeAmount: 0,
  applyYm: "2026-10",
  installments: 1,
  applyToSimulation: false,
};
const person = { nationalPension: national, additionalPayment: ap, returnRepayment: rr, retirementPensions: [], personalPensions: [], pensionInsurances: [] } as PersonData;
const params = { currentAge: 55, retirementAge: 60, expectedLifeExpectancy: 90, nationalPensionStartAge: 65, inflationRate: 2.5 } as SimulationParamsState;
const full = { useVoluntary: true, voluntaryIncome: 100, deferYears: 5, deferShare: 1 };

const road = buildBoostRoadmap(person, params, 65, full, 2026);
assert.deepEqual(road.steps.map((s) => s.key), ["base", "repay", "additional", "voluntary", "defer"]);
assert.ok(road.steps.every((s) => s.status === "available"), "모든 단계 계산 가능");
for (let i = 1; i < road.steps.length; i++) assert.ok(road.steps[i].monthly > road.steps[i - 1].monthly, `${road.steps[i].label} 증가`);
assert.equal(road.steps[0].monthly, 20);
assert.equal(road.steps[2].note.includes("119개월"), true, "추납 개월수 비우면 대상 최대 119개월");

// 임의계속가입: 60~64세 60개월, 보험료 = 월 100만원 × 연도별 요율 (2031 12.0%, 2032 12.5%, 2033~ 13%)
assert.equal(road.voluntaryMonths, 60);
near(road.steps[3].cost, 100 * (0.12 + 0.125 + 0.13 + 0.13 + 0.13) * 12, 1);

// 연기 5년 전액: 직전 금액 × 1.36, 회수 기간 = 1 ÷ 7.2% ≈ 13.9년 → 70 + 13.9 ≈ 84세 손익분기 (영상과 같음)
const v = road.steps[3].monthly;
near(road.finalMonthly, v * 1.36);
near(road.steps[4].paybackYears!, 13.9, 0.05);
assert.equal(road.deferEndAge, 70);
assert.equal(road.partialMonthly, 0);
assert.ok(road.multiple! >= 3, `저연금자는 배수가 크다: ${road.multiple}`);

// 부분 연기 50%: 연기 기간에도 절반은 정상 수령, 최종은 직전 × 1.18
const half = buildBoostRoadmap(person, params, 65, { ...full, deferShare: 0.5 }, 2026);
near(half.finalMonthly, v * 1.18);
near(half.partialMonthly, v * 0.5);
assert.ok(half.steps[4].label.includes("50%"));

// 해당 없음: 반환일시금·추납 대상 없음, 임의계속·연기 선택 안 함
const none = buildBoostRoadmap(
  { ...person, additionalPayment: { ...ap, receivedLumpSumRefund: false, gapMonths: 0 } },
  params,
  65,
  { ...full, useVoluntary: false, deferYears: 0 },
  2026
);
assert.ok(none.steps.slice(1).every((s) => s.status === "notApplicable" && s.delta === 0));
assert.equal(none.finalMonthly, 20);
assert.equal(none.multiple, 1);

// 근거 부족: 예상 연금은 있는데 총 예상 가입월수가 비어 있으면 증가액 계산 불가
const noBasis = buildBoostRoadmap({ ...person, nationalPension: { ...national, expectedTotalContributionMonths: 0 } }, params, 65, full, 2026);
assert.equal(noBasis.steps[1].status, "needsInput");
assert.equal(noBasis.steps[2].status, "needsInput");
assert.equal(noBasis.steps[3].status, "needsInput");

// 이미 개시 나이를 지난 사람은 임의계속가입 해당 없음
const old = buildBoostRoadmap(person, { ...params, currentAge: 66 } as SimulationParamsState, 65, full, 2026);
assert.equal(old.voluntaryMonths, 0);
assert.equal(old.steps[3].status, "notApplicable");

// 피부양자 기준: 고연금자는 연 2,000만원 초과 경고
const rich = buildBoostRoadmap({ ...person, nationalPension: { ...national, expectedMonthlyPension: 160, expectedTotalContributionMonths: 400, bValue: 500 } }, params, 65, full, 2026);
assert.equal(rich.overDependentCap, true);

console.log(road.steps.map((s) => `${s.label} ${s.monthly}만원(+${s.delta}, 비용 ${s.cost}만원, 회수 ${s.paybackYears ?? "-"}년)`).join(" → "));
console.log("NPS boost roadmap validation success!");
