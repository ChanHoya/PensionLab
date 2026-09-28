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
  applyToSimulation: true,
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

// 기초연금 「대시보드 반영 안 함」이면 기초연금 0
const noBasic = runCoupleSimulation(husband, wife, params, { ...basic, applyToSimulation: false }, 2026);
assert.ok(noBasic.rows.every((row) => row.self.basic === 0 && (row.spouse?.basic ?? 0) === 0));
near(noBasic.rows.find((row) => row.year === 2031)!.household, 200);

// 사적연금 수령액은 소득인정액에 자동 반영: 월 500만원 연금보험을 받으면 기초연금 없음
const richInsurance = [{ id: "i", insuranceType: "연금보험", totalAccumulated: 100000, monthlyPayment: 0, paymentPeriod: 0, expectedDeclaredRate: 0.5 }];
const rich = runCoupleSimulation({ ...husband, pensionInsurances: richInsurance }, wife, params, basic, 2026);
const rich2031 = rich.rows.find((row) => row.year === 2031)!;
assert.ok(rich2031.self.insurance > 400);
assert.equal(rich2031.self.basic, 0);

// 국민연금 연기: 본인 2년 연기 → 67세부터 200 × (1 + 7.2% × 2) = 228.8
const deferred = runCoupleSimulation(husband, wife, { ...params, nationalPensionDeferYears: 2 }, basic, 2026);
const dAt = (y: number) => deferred.rows.find((row) => row.year === y)!;
assert.equal(dAt(2032).self.national, 0); // 66세
near(dAt(2033).self.national, 228.8, 0.5); // 67세 (엔진이 만원 단위 반올림)
// 유족연금은 연기 가산 전 기본 연금 기준 (200 × 60%)
near(dAt(2047).spouse!.national, 120);
// 배우자 연기는 배우자에게만
const spDeferred = runCoupleSimulation(husband, wife, { ...params, spouseNationalPensionDeferYears: 5 }, basic, 2026);
assert.equal(spDeferred.rows.find((row) => row.year === 2040)!.spouse!.national, 0); // 아내 69세
near(spDeferred.rows.find((row) => row.year === 2041)!.spouse!.national, 56 * 1.36, 0.5); // 70세
near(spDeferred.rows.find((row) => row.year === 2031)!.self.national, 200);

// 사적연금 수령 종료 나이 70세: 60~70세(11년)에 나눠 받고 71세부터 0, 기간이 짧아져 월 수령액은 커진다
const irp = [{ id: "r", pensionType: "IRP" as const, totalAccumulated: 20000, monthlyContribution: 0, companyMatchRate: 0, expectedReturnRate: 3 }];
const base = runCoupleSimulation({ ...husband, retirementPensions: irp }, wife, params, basic, 2026);
const early = runCoupleSimulation({ ...husband, retirementPensions: irp }, wife, { ...params, privatePensionEndAge: 70 }, basic, 2026);
const ret = (res: typeof base, y: number) => res.rows.find((row) => row.year === y)!.self.retirement;
assert.ok(ret(base, 2037) > 0); // 기본(20년 분할): 71세에도 수령
assert.ok(ret(early, 2036) > 0); // 70세까지 수령
assert.equal(ret(early, 2037), 0); // 71세
assert.ok(ret(early, 2026) > ret(base, 2026) * 1.5); // 11년 vs 20년 분할
// 체감형 인출이어도 종료 나이를 정하면 균등 분할: 매년 같은 금액, 총액은 기본 20년 분할보다 크지 않다
const earlyDec = runCoupleSimulation({ ...husband, retirementPensions: irp }, wife, { ...params, decumulationStrategy: "DECREASING", privatePensionEndAge: 70 }, basic, 2026);
assert.equal(ret(earlyDec, 2026), ret(earlyDec, 2036));
const sumRet = (res: typeof base) => res.rows.reduce((a, row) => a + row.self.retirement, 0);
assert.ok(sumRet(earlyDec) <= sumRet(base));

// 체감형 인출(120%→40%)도 적립금 총액 보존: 3% 할인한 현재가치 합이 균등 수령과 같다
const pv = (res: typeof base) => res.rows.reduce((a, row, t) => a + (row.self.retirement * 12) / Math.pow(1.03, t), 0);
const flatRes = runCoupleSimulation({ ...husband, retirementPensions: irp }, wife, params, basic, 2026);
const decRes = runCoupleSimulation({ ...husband, retirementPensions: irp }, wife, { ...params, decumulationStrategy: "DECREASING" }, basic, 2026);
assert.ok(Math.abs(pv(decRes) / pv(flatRes) - 1) < 0.01, `PV ratio ${pv(decRes) / pv(flatRes)}`);
assert.ok(ret(decRes, 2026) > ret(flatRes, 2026)); // 초반에 더 많이

// 완만한 체감: 매년 같은 비율(2%)로 줄어 5년마다 뚝 떨어지는 계단이 없다
for (let y = 2027; y <= 2045; y++) {
  const ratio = ret(decRes, y) / ret(decRes, y - 1);
  assert.ok(Math.abs(ratio - 0.98) < 0.01, `${y} 체감 비율 ${ratio}`);
}

console.log("Couple simulation validation success!");
