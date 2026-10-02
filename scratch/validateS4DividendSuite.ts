import { runWithdrawalSimulation } from "../src/services/withdrawalCalculator";
import type { SimulationParamsState } from "../src/store/usePensionStore";
import { DEFAULT_AGE_BANDS } from "../src/store/usePensionStore";

console.log("=== S4 Dividend Policy (Reinvest / Buffer / Payout) Validation Suite ===");

const baseParams: SimulationParamsState = {
  currentAge: 55,
  retirementAge: 60,
  expectedLifeExpectancy: 85,
  inflationRate: 3.0,
  nationalPensionStartAge: 65,
  hasSpouse: true,
  spouseAge: 55,
  childrenCount: 0,
  childrenAges: "",
  targetMonthlySpending: 80, // 월 80만원 (국민연금 월 100만원으로 이미 충당되어 배당금 잉여 발생)
  minMonthlySpending: 60,
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
  isCoupleDivided: true, // 부부 명의 분산
  dividendPolicy: "REINVEST",
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
  householdType: "COUPLE" as const,
  recognizedIncome: 100,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
};

// 1. REINVEST (스노우볼형)
const resReinvest = runWithdrawalSimulation(
  mockNational as any,
  mockBasic as any,
  [],
  [],
  [],
  { ...baseParams, dividendPolicy: "REINVEST" },
  { personalTaxCreditRatio: 0.8, retirementLumpSumTaxRate: 0.15, otherIncomeAnnual: 0, publicPensionTaxableRatio: 0.8 }
);

const s4Reinvest = resReinvest.s4;
console.log(`[REINVEST] Final Covered Call Asset: ${s4Reinvest.finalCoveredCallAsset} 만원 (초기: 5000만원)`);
console.log(`[REINVEST] Final Dividend Buffer: ${s4Reinvest.finalDividendBuffer} 만원`);
if ((s4Reinvest.finalCoveredCallAsset || 0) <= 5000) {
  throw new Error("REINVEST mode failed: covered call asset should increase via reinvestment!");
}

// 2. BUFFER (비상자금형)
const resBuffer = runWithdrawalSimulation(
  mockNational as any,
  mockBasic as any,
  [],
  [],
  [],
  { ...baseParams, dividendPolicy: "BUFFER" },
  { personalTaxCreditRatio: 0.8, retirementLumpSumTaxRate: 0.15, otherIncomeAnnual: 0, publicPensionTaxableRatio: 0.8 }
);

const s4Buffer = resBuffer.s4;
console.log(`[BUFFER] Final Covered Call Asset: ${s4Buffer.finalCoveredCallAsset} 만원 (초기: 5000만원)`);
console.log(`[BUFFER] Final Dividend Buffer: ${s4Buffer.finalDividendBuffer} 만원`);
if ((s4Buffer.finalDividendBuffer || 0) <= 0) {
  throw new Error("BUFFER mode failed: dividend buffer should accumulate positive cash reserve!");
}

// 3. PAYOUT (전액소비형)
const resPayout = runWithdrawalSimulation(
  mockNational as any,
  mockBasic as any,
  [],
  [],
  [],
  { ...baseParams, dividendPolicy: "PAYOUT" },
  { personalTaxCreditRatio: 0.8, retirementLumpSumTaxRate: 0.15, otherIncomeAnnual: 0, publicPensionTaxableRatio: 0.8 }
);

const s4Payout = resPayout.s4;
console.log(`[PAYOUT] Final Covered Call Asset: ${s4Payout.finalCoveredCallAsset} 만원`);
console.log(`[PAYOUT] Final Dividend Buffer: ${s4Payout.finalDividendBuffer} 만원`);
if ((s4Payout.finalCoveredCallAsset || 0) !== 5000 || (s4Payout.finalDividendBuffer || 0) !== 0) {
  throw new Error("PAYOUT mode failed: covered call asset should stay 5000 and buffer 0!");
}

console.log("✅ All S4 Dividend Policy Validation Tests Passed Successfully!");
