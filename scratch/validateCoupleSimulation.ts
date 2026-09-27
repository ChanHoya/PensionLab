import assert from "node:assert/strict";
import { runCoupleSimulation, personParams, type PersonPensions } from "../src/services/coupleSimulation";
import type { BasicPensionState, NationalPensionState, SimulationParamsState } from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 0.01) =>
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
  targetMonthlySpending: 300,
  minMonthlySpending: 200,
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 0,
  propertyTaxBase: 0,
  financialIncome: 0,
  decumulationStrategy: "FLAT",
  coveredCallAsset: 0,
  coveredCallDividendRate: 0,
  isCoupleDivided: false,
  spouseRetirementAge: 60,
  spouseLifeExpectancy: 88,
  spouseNationalPensionStartAge: 65,
} as SimulationParamsState;
const basic = {
  householdType: "COUPLE",
  recognizedIncome: 0,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
  region: "METRO",
  generalProperty: 60000,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  selfEarnedIncome: 0,
  selfOtherIncome: 0,
  selfOccupational: false,
  spouseEarnedIncome: 0,
  spouseOtherIncome: 0,
  spouseOccupational: false,
} as BasicPensionState;
const empty = { retirementPensions: [], personalPensions: [], pensionInsurances: [] };
const husband: PersonPensions = {
  national: nat({ expectedMonthlyPension: 200, expectedTotalContributionMonths: 360, bValue: 500, currentStandardMonthlyIncome: 500 }),
  ...empty,
};
const wife: PersonPensions = {
  national: nat({ expectedMonthlyPension: 56, expectedTotalContributionMonths: 274, bValue: 101.3, currentStandardMonthlyIncome: 101.3 }),
  ...empty,
};

// 배우자 매개변수
const sp = personParams(params, "SPOUSE");
assert.equal(sp.currentAge, 55);
assert.equal(sp.expectedLifeExpectancy, 88);
assert.equal(personParams(params, "SELF"), params);

const r = runCoupleSimulation(husband, wife, params, basic, 2026);
assert.equal(r.rows.length, 34); // 배우자 55세 → 88세
assert.deepEqual(r.firstDeath, { who: "SELF", year: 2047, age: 81 });
const at = (y: number) => r.rows.find((row) => row.year === y)!;

// 2031: 남편 65세, 아내 60세 → 부부가구 심사, 남편만 수급(연계감액 하한 17.485)
near(at(2031).self.national, 200);
near(at(2031).self.basic, 17.485);
assert.equal(at(2031).spouse!.national, 0);
// 2036: 둘 다 수급, 소득인정액(200 + 56 + 155) > 395.2 → 기초연금 없음
near(at(2036).household, 256);
assert.equal(at(2036).self.basic, 0);
// 2047: 남편 사망 → 아내는 유족연금(200 × 60%) 120 vs 본인 56 + 30% 36 → 유족연금 선택
assert.equal(at(2047).self.alive, false);
near(at(2047).spouse!.national, 120);
assert.equal(at(2047).spouse!.survivorChoice, "SURVIVOR");
near(at(2059).household, 120);
near(r.lifetime.household, 65561.1);

// 아내 연금이 더 크면 본인 연금 + 유족연금 30%를 고른다
const r2 = runCoupleSimulation(
  { ...husband, national: nat({ expectedMonthlyPension: 60, expectedTotalContributionMonths: 130, bValue: 200 }) },
  { ...wife, national: nat({ expectedMonthlyPension: 150, expectedTotalContributionMonths: 300, bValue: 300 }) },
  params,
  { ...basic, generalProperty: 200000 },
  2026
);
const y2 = r2.rows.find((row) => row.year === 2047)!;
near(y2.spouse!.national, 150 + 0.3 * 0.5 * 60); // 가입 130개월 → 유족 50%
assert.equal(y2.spouse!.survivorChoice, "OWN_PLUS_30");

// 배우자 없음: 본인 기대수명까지만
const solo = runCoupleSimulation(husband, null, { ...params, hasSpouse: false }, basic, 2026);
assert.equal(solo.rows.length, 21);
assert.equal(solo.firstDeath, null);
assert.equal(solo.rows[0].spouse, null);

console.log("Couple simulation validation success!");
