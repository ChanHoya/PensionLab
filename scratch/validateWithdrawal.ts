import { runWithdrawalSimulation } from "../src/services/withdrawalCalculator";

const mockNational = {
  contributionMonths: 240,
  totalPaidAmount: 5400,
  currentStandardMonthlyIncome: 450,
  expectedTotalContributionMonths: 360,
  expectedMonthlyPension: 120, // 120만원/월
  totalExpectedPremium: 8100,
  basicPensionAmount: 0,
  aValue: 0,
  bValue: 0,
};

const mockBasic = {
  householdType: "SINGLE" as const,
  recognizedIncome: 100,
  expectedEligibility: true,
  expectedMonthlyAmount: 33, // 33만원/월
};

const mockRetirement = [
  {
    id: "ret-1",
    pensionType: "DC" as const,
    totalAccumulated: 20000, // 2억원
    monthlyContribution: 50,
    companyMatchRate: 50,
    expectedReturnRate: 3.5,
  }
];

const mockPersonal = [
  {
    id: "per-1",
    savingsType: "FUND" as const,
    totalAccumulated: 8000, // 8000만원
    monthlyAnnualContribution: 30,
    desiredStartAge: 60,
    receivingPeriod: 10,
  }
];

const mockInsurance = [
  {
    id: "ins-1",
    insuranceType: "GENERAL",
    totalAccumulated: 5000, // 5000만원
    monthlyPayment: 20,
    paymentPeriod: 10,
    expectedDeclaredRate: 2.5,
  }
];

const mockParams = {
  currentAge: 55,
  retirementAge: 60,
  expectedLifeExpectancy: 85,
  inflationRate: 2.0,
  nationalPensionStartAge: 65,
  hasSpouse: false,
  spouseAge: 55,
  childrenCount: 0,
  childrenAges: "",
  targetMonthlySpending: 300, // 300만원/월
  minMonthlySpending: 200,
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 10000,
  decumulationStrategy: "DECREASING" as const,
};

const result = runWithdrawalSimulation(
  mockNational,
  mockBasic,
  mockRetirement,
  mockPersonal,
  mockInsurance,
  mockParams,
  {
    personalTaxCreditRatio: 0.8,
    retirementLumpSumTaxRate: 0.08,
    otherIncomeAnnual: 0,
    publicPensionTaxableRatio: 0.5,
  }
);

console.log("=== S0 (현재 계약형) ===");
console.log(`생애 총 세전 수령액: ${result.s0.lifetimeTotalPreTax.toLocaleString()} 만원`);
console.log(`생애 총 세후 수령액: ${result.s0.lifetimeTotalPostTax.toLocaleString()} 만원`);
console.log(`생애 총 세금 & 건보료: ${result.s0.lifetimeTotalTaxAndHI.toLocaleString()} 만원`);
console.log(`피부양자 박탈 시기: ${result.s0.lostDependencyAge ? result.s0.lostDependencyAge + "세" : "없음"}`);

console.log("\n=== S1 (절세 평탄화) ===");
console.log(`생애 총 세전 수령액: ${result.s1.lifetimeTotalPreTax.toLocaleString()} 만원`);
console.log(`생애 총 세후 수령액: ${result.s1.lifetimeTotalPostTax.toLocaleString()} 만원`);
console.log(`생애 총 세금 & 건보료: ${result.s1.lifetimeTotalTaxAndHI.toLocaleString()} 만원`);
console.log(`피부양자 박탈 시기: ${result.s1.lostDependencyAge ? result.s1.lostDependencyAge + "세" : "없음"}`);

console.log("\n=== S2 (절세형 + 국민연금 5년 연기) ===");
console.log(`생애 총 세전 수령액: ${result.s2.lifetimeTotalPreTax.toLocaleString()} 만원`);
console.log(`생애 총 세후 수령액: ${result.s2.lifetimeTotalPostTax.toLocaleString()} 만원`);
console.log(`생애 총 세금 & 건보료: ${result.s2.lifetimeTotalTaxAndHI.toLocaleString()} 만원`);
console.log(`피부양자 박탈 시기: ${result.s2.lostDependencyAge ? result.s2.lostDependencyAge + "세" : "없음"}`);

console.log("\nValidation success!");
