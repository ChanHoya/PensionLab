import { runWithdrawalSimulation } from "../src/services/withdrawalCalculator";
import type { SimulationParamsState } from "../src/store/usePensionStore";
import { DEFAULT_AGE_BANDS } from "../src/store/usePensionStore";

console.log("=== S4 Covered Call Capital/Price Return & NAV Erosion Validation Suite ===");

const baseParams: SimulationParamsState = {
  currentAge: 55,
  retirementAge: 60,
  expectedLifeExpectancy: 80,
  inflationRate: 3.0,
  nationalPensionStartAge: 65,
  hasSpouse: false,
  childrenCount: 0,
  childrenAges: "",
  targetMonthlySpending: 300,
  minMonthlySpending: 200,
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 0,
  propertyTaxBase: 0,
  financialIncome: 0,
  decumulationStrategy: "DECREASING",
  spendingPattern: "AGE_BANDS",
  activePhaseYears: 5,
  annualDeclineRate: 2.0,
  ageBands: DEFAULT_AGE_BANDS,
  coveredCallAsset: 5000, // 5천만원
  coveredCallDividendRate: 9.0, // 연 9% 분배율
  coveredCallPriceReturnRate: 0.0, // 중립 (0%)
  isCoupleDivided: false,
  dividendPolicy: "PAYOUT",
  spouseRetirementAge: 60,
  spouseLifeExpectancy: 85,
  spouseNationalPensionStartAge: 65,
  nationalPensionDeferYears: 0,
  spouseNationalPensionDeferYears: 0,
  privateDrawStartAge: 0,
  privatePensionEndAge: 0,
  spousePrivatePensionEndAge: 0,
};

const mockNational = {
  contributionMonths: 240,
  totalPaidAmount: 5400,
  currentStandardMonthlyIncome: 450,
  expectedTotalContributionMonths: 360,
  expectedMonthlyPension: 100,
  totalExpectedPremium: 8100,
  basicPensionAmount: 0,
  aValue: 0,
  bValue: 0,
};

const mockBasic = {
  householdType: "SINGLE" as const,
  recognizedIncome: 100,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
};

// 1. 중립 시나리오 (가격 변동률 0%)
const runNeutral = runWithdrawalSimulation(mockNational, mockBasic, [], [], [], {
  ...baseParams,
  coveredCallPriceReturnRate: 0.0,
});
const neutralS4 = runNeutral.s4;
const finalNeutralAsset = neutralS4.finalCoveredCallAsset ?? 0;
console.log(`[Neutral 0%] Final Covered Call Asset: ${finalNeutralAsset}만원 (Initial 5000만원)`);
if (finalNeutralAsset !== 5000) {
  console.error("FAIL: Neutral asset should remain 5000만원");
  process.exit(1);
}

// 2. 보수 시나리오 (가격 변동률 -5%, NAV 침식)
const runConservative = runWithdrawalSimulation(mockNational, mockBasic, [], [], [], {
  ...baseParams,
  coveredCallPriceReturnRate: -5.0,
});
const conservativeS4 = runConservative.s4;
const finalConservativeWon = conservativeS4.finalCoveredCallAsset ?? 0;
console.log(`[Conservative -5%] Final Covered Call Asset: ${finalConservativeWon}만원`);
if (finalConservativeWon >= 5000) {
  console.error("FAIL: Conservative asset must decrease due to NAV erosion!");
  process.exit(1);
}
// 은퇴 60세부터 80세까지 20년간 연 -5% 복리 하락: 5000 * (0.95^20) ≈ 1792만원
if (finalConservativeWon < 1500 || finalConservativeWon > 2000) {
  console.error(`FAIL: Expected around 1700~1900만원, got ${finalConservativeWon}만원`);
  process.exit(1);
}

// 3. 낙관 시나리오 (가격 변동률 +2%)
const runOptimistic = runWithdrawalSimulation(mockNational, mockBasic, [], [], [], {
  ...baseParams,
  coveredCallPriceReturnRate: 2.0,
});
const optimisticS4 = runOptimistic.s4;
const finalOptimisticWon = optimisticS4.finalCoveredCallAsset ?? 0;
console.log(`[Optimistic +2%] Final Covered Call Asset: ${finalOptimisticWon}만원`);
if (finalOptimisticWon <= 5000) {
  console.error("FAIL: Optimistic asset must grow with positive return!");
  process.exit(1);
}

// 4. 배당금 규모 비교 (NAV 침식에 따라 배당금도 줄어드는지)
const flowNeutralLast = neutralS4.flows[neutralS4.flows.length - 1];
const flowConsLast = conservativeS4.flows[conservativeS4.flows.length - 1];
console.log(`Final year gross dividend - Neutral: ${flowNeutralLast.dividendPreTax}만원 vs Conservative: ${flowConsLast.dividendPreTax}만원`);
if (flowConsLast.dividendPreTax >= flowNeutralLast.dividendPreTax) {
  console.error("FAIL: Dividend in conservative scenario should be smaller than neutral scenario!");
  process.exit(1);
}

console.log("✅ All S4 Covered Call price return & NAV erosion tests PASSED!");
