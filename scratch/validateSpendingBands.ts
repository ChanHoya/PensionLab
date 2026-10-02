import assert from "node:assert/strict";
import { buildSpendingCurve, getSpendingMultiplier } from "@/services/spendingCurve";
import { DEFAULT_AGE_BANDS, SimulationParamsState } from "@/store/usePensionStore";

const mockParams: SimulationParamsState = {
  currentAge: 57,
  retirementAge: 60,
  expectedLifeExpectancy: 90,
  hasSpouse: true,
  spouseAge: 55,
  spouseLifeExpectancy: 100,
  inflationRate: 3.0,
  nationalPensionStartAge: 65,
  spouseNationalPensionStartAge: 65,
  targetMonthlySpending: 450,
  minMonthlySpending: 300,
  spendingPattern: "AGE_BANDS",
  ageBands: DEFAULT_AGE_BANDS,
  decumulationStrategy: "DECREASING",
  activePhaseYears: 5,
  annualDeclineRate: 2.0,
  coveredCallAsset: 0,
  coveredCallDividendRate: 0,
  isCoupleDivided: false,
  spouseRetirementAge: 60,
  nationalPensionDeferYears: 0,
  spouseNationalPensionDeferYears: 0,
  privateDrawStartAge: 60,
  privatePensionEndAge: 90,
  spousePrivatePensionEndAge: 0,
  childrenCount: 0,
  childrenAges: "",
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 0,
  propertyTaxBase: 0,
  financialIncome: 0,
};

console.log("Testing buildSpendingCurve with AGE_BANDS and horizon extension...");
const curve = buildSpendingCurve(mockParams, 2026, 45); // 2026 ~ 2071 (100세 이상)

// 1. 60대 확인 (2029년 = 60세)
const p60 = curve.get(2029)!;
assert.ok(p60, "2029 must exist");
assert.equal(p60.targetReal, 450, "60대 목표 생활비는 450이어야 함");
assert.equal(p60.minReal, 300, "60대 최소 생활비는 300이어야 함");

// 2. 70대 확인 (2041년 = 72세)
const p70 = curve.get(2041)!;
assert.ok(p70, "2041 must exist");
assert.equal(p70.targetReal, 320, "70대 목표 생활비는 320이어야 함");
assert.equal(p70.minReal, 220, "70대 최소 생활비는 220이어야 함");

// 3. 80대 확인 (2051년 = 82세)
const p80 = curve.get(2051)!;
assert.ok(p80, "2051 must exist");
assert.equal(p80.targetReal, 230, "80대 목표 생활비는 230이어야 함");
assert.equal(p80.minReal, 170, "80대 최소 생활비는 170이어야 함");

// 4. 90대 및 100세 확인 (2069년 = 100세)
// 이전에는 2069년 이후 결측치로 600으로 치솟았음!
const p90 = curve.get(2061)!; // 92세
assert.ok(p90, "2061 must exist");
assert.equal(p90.targetReal, 180, "90대 목표 생활비는 180이어야 함");
assert.equal(p90.minReal, 150, "90대 최소 생활비는 150이어야 함");

const p100 = curve.get(2069)!; // 100세
assert.ok(p100, "2069 (100세) must exist in curve");
assert.equal(p100.targetReal, 180, "100세 시점에도 목표 생활비가 180이어야 하며 절대 600으로 치솟지 않아야 함!");
assert.equal(p100.minReal, 150, "100세 시점 최소 생활비는 150이어야 함");

const p102 = curve.get(2071)!; // 102세
assert.ok(p102, "2071 (102세) must exist in curve");
assert.equal(p102.targetReal, 180, "배우자 100세 시점(본인 102세)에도 180으로 안정 유지");

// 5. 스무딩(Smoothing) 검증: 69세, 70세 전환
const p69 = curve.get(2038)!; // 69세
const p70_trans = curve.get(2039)!; // 70세
assert.ok(p60.targetReal > p69.targetReal && p69.targetReal > p70_trans.targetReal && p70_trans.targetReal > p70.targetReal,
  "60대에서 70대로 완만하게 스무딩되어야 함");

console.log("All spending curve age bands and horizon tests passed successfully!");
