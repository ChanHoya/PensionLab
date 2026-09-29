import assert from "node:assert/strict";
import { runCoupleSimulation, type PersonPensions } from "../src/services/coupleSimulation";
import { runHouseholdScenarios } from "../src/services/householdScenarios";
import type { BasicPensionState, NationalPensionState, SimulationParamsState } from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 1.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

const nat = (o: Partial<NationalPensionState>): NationalPensionState => ({
  contributionMonths: 0,
  totalPaidAmount: 0,
  currentStandardMonthlyIncome: 0,
  expectedTotalContributionMonths: 0,
  expectedMonthlyPension: 0,
  totalExpectedPremium: 0,
  basicPensionAmount: 0,
  aValue: 319.3511,
  bValue: 0,
  ...o,
});
const params = {
  currentAge: 60,
  retirementAge: 60,
  expectedLifeExpectancy: 80,
  inflationRate: 0,
  nationalPensionStartAge: 65,
  hasSpouse: true,
  spouseAge: 55,
  childrenCount: 0,
  childrenAges: "",
  targetMonthlySpending: 400,
  minMonthlySpending: 200,
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 0,
  propertyTaxBase: 0,
  financialIncome: 0,
  decumulationStrategy: "FLAT",
  coveredCallAsset: 50000,
  coveredCallDividendRate: 9,
  isCoupleDivided: false,
  spouseRetirementAge: 60,
  spouseLifeExpectancy: 88,
  spouseNationalPensionStartAge: 65,
  nationalPensionDeferYears: 0,
  spouseNationalPensionDeferYears: 0,
  privatePensionEndAge: 0,
  spousePrivatePensionEndAge: 0,
} as SimulationParamsState;
const basic = { applyToSimulation: false } as BasicPensionState;
const husband: PersonPensions = {
  national: nat({ expectedMonthlyPension: 200, expectedTotalContributionMonths: 360, bValue: 500, currentStandardMonthlyIncome: 500 }),
  retirementPensions: [{ id: "h-irp", pensionType: "IRP", totalAccumulated: 20000, monthlyContribution: 0, companyMatchRate: 0, expectedReturnRate: 3 }],
  personalPensions: [],
  pensionInsurances: [],
};
const wife: PersonPensions = {
  national: nat({ expectedMonthlyPension: 56, expectedTotalContributionMonths: 274, bValue: 101.3, currentStandardMonthlyIncome: 101.3 }),
  retirementPensions: [],
  personalPensions: [{ id: "w-fund", savingsType: "FUND", totalAccumulated: 8000, monthlyAnnualContribution: 0, desiredStartAge: 60, receivingPeriod: 10 }],
  pensionInsurances: [],
};
const inputs = { personalTaxCreditRatio: 0.8, retirementLumpSumTaxRate: 0.08, otherIncomeAnnual: 0, publicPensionTaxableRatio: 0.5 };

// 1) 1인: 국민연금은 시뮬레이션 값을 그대로 쓴다 (연기 2년 → 67세부터 200 × 1.144)
const soloParams = { ...params, hasSpouse: false, nationalPensionDeferYears: 2 };
const soloSim = runCoupleSimulation(husband, null, soloParams, basic, 2026);
const solo = runHouseholdScenarios(husband, null, soloParams, basic, soloSim, inputs, 2026);
const soloAt = (y: number) => solo.s1.flows.find((f) => f.year === y)!;
assert.equal(soloAt(2032).nationalPreTax, 0); // 66세
near(soloAt(2033).nationalPreTax, soloSim.rows.find((r) => r.year === 2033)!.self.national * 12); // 67세
assert.deepEqual(Object.keys(solo).sort(), ["s0", "s1", "s3", "s4"]);

// 2) 부부: 연도별 가구 합산, 배우자 계좌 반영, 본인 사망 후 유족연금은 시뮬레이션 값
const sim = runCoupleSimulation(husband, wife, params, basic, 2026);
const hh = runHouseholdScenarios(husband, wife, params, basic, sim, inputs, 2026);
const at = (y: number) => hh.s1.flows.find((f) => f.year === y)!;
const simAt = (y: number) => sim.rows.find((r) => r.year === y)!;
near(at(2036).nationalPreTax, (simAt(2036).self.national + simAt(2036).spouse!.national) * 12); // 둘 다 수급
assert.equal(at(2036).age, 70);
assert.equal(at(2036).spouseAge, 65);
assert.ok(at(2031).personalPreTax > 0); // 아내 개인연금(60세 개시)이 가구 흐름에 들어감
near(at(2050).nationalPreTax, simAt(2050).spouse!.national * 12); // 남편 사망 후 아내 유족연금
assert.equal(at(2050).retirementPreTax, 0); // 사망한 남편 계좌는 더 이상 없음
// 가구 생애 합계 = 연도별 합
near(hh.s1.lifetimeTotalPostTax, hh.s1.flows.reduce((a, f) => a + f.totalPostTax, 0), hh.s1.flows.length);
// 목표 대비 부족액은 가구 기준 (월 400만원 × 12)
for (const f of hh.s1.flows) near(f.deficit, Math.max(0, 400 * 12 - f.totalPostTax), 1.01);

// 2-1) S0는 통합 시뮬레이션의 퇴직·개인연금 인출액을 그대로 쓴다 (연도별 가구 합)
assert.equal(hh.s0.strategyName, "통합 시뮬레이션 기준 인출");
for (const r of sim.rows) {
  const simPrivate = (r.self.retirement + r.self.personal + r.self.insurance + (r.spouse ? r.spouse.retirement + r.spouse.personal + r.spouse.insurance : 0)) * 12;
  const f = hh.s0.flows.find((x) => x.year === r.year);
  near(f ? f.retirementPreTax + f.personalPreTax + f.insurancePreTax : 0, simPrivate, 2);
}

// 3) S4 커버드콜: 분산 안 함 → 본인 명의 1,000만원 한도, 분산 → 인당 1,000만원 (가구 2,000만원)
const div1 = runHouseholdScenarios(husband, wife, params, basic, sim, inputs, 2026).s4.flows.find((f) => f.year === 2031)!;
const div2 = runHouseholdScenarios(husband, wife, { ...params, isCoupleDivided: true }, basic, sim, inputs, 2026).s4.flows.find((f) => f.year === 2031)!;
near(div1.dividendPreTax, 1000);
near(div2.dividendPreTax, 2000); // 2031: 남편 65세·아내 60세 모두 은퇴 후

console.log("Household scenarios validation success!");
