import assert from "node:assert/strict";
import { buildHouseholdReport, type ReportInput } from "../src/services/householdReport";
import { fallbackNarrative, reportFacts, normalizeNarrative } from "../src/services/reportNarrative";

const sampleInput: ReportInput = {
  simulationParams: {
    currentAge: 55,
    retirementAge: 60,
    expectedLifeExpectancy: 85,
    inflationRate: 3.0,
    nationalPensionStartAge: 65,
    hasSpouse: true,
    spouseAge: 53,
    childrenCount: 0,
    childrenAges: "",
    targetMonthlySpending: 350,
    minMonthlySpending: 220,
    childSupportExpense: 0,
    annualMedicalExpense: 0,
    nonPensionAssets: 5000,
    propertyTaxBase: 30000,
    financialIncome: 500,
    decumulationStrategy: "DECREASING",
    coveredCallAsset: 5000,
    coveredCallDividendRate: 9.0,
    isCoupleDivided: false,
    spouseRetirementAge: 60,
    spouseLifeExpectancy: 88,
    spouseNationalPensionStartAge: 65,
    nationalPensionDeferYears: 0,
    spouseNationalPensionDeferYears: 0,
    privateDrawStartAge: 0,
    privatePensionEndAge: 0,
    spousePrivatePensionEndAge: 0,
  },
  basicPension: {
    householdType: "COUPLE",
    recognizedIncome: 0,
    expectedEligibility: false,
    expectedMonthlyAmount: 0,
    region: "METRO",
    generalProperty: 30000,
    financialAssets: 5000,
    debts: 0,
    luxuryAssets: 0,
    selfEarnedIncome: 0,
    selfOtherIncome: 0,
    selfOccupational: false,
    spouseEarnedIncome: 0,
    spouseOtherIncome: 0,
    spouseOccupational: false,
    applyToSimulation: false,
  },
  self: {
    nationalPension: {
      contributionMonths: 240,
      totalPaidAmount: 5000,
      currentStandardMonthlyIncome: 350,
      expectedTotalContributionMonths: 300,
      expectedMonthlyPension: 120,
      totalExpectedPremium: 8000,
      basicPensionAmount: 0,
      aValue: 319.3511,
      bValue: 350,
    },
    additionalPayment: {
      firstEnrollYm: "",
      resumeYm: "",
      gapMonths: 0,
      gapReason: "EXEMPT",
      enrollStatus: "REGIONAL",
      receivedLumpSumRefund: false,
      requestedMonths: 0,
      baseIncome: 100,
      paymentMode: "LUMP",
      installments: 12,
      installmentInterestRate: 2.5,
      applyYm: "",
      marginalTaxRate: 15,
      applyToSimulation: false,
    },
    returnRepayment: {
      refundAmount: 0,
      refundYm: "",
      restoredMonths: 0,
      periodStartYm: "",
      noticeAmount: 0,
      applyYm: "",
      installments: 1,
      applyToSimulation: false,
    },
    retirementPensions: [
      {
        id: "ret-1",
        pensionType: "DC",
        totalAccumulated: 8000,
        monthlyContribution: 30,
        expectedReturnRate: 4.0,
      },
    ],
    personalPensions: [
      {
        id: "pers-1",
        savingsType: "FUND",
        totalAccumulated: 4000,
        monthlyAnnualContribution: 30,
        desiredStartAge: 60,
        receivingPeriod: 20,
      },
    ],
    pensionInsurances: [],
  },
  spouse: {
    nationalPension: {
      contributionMonths: 180,
      totalPaidAmount: 3000,
      currentStandardMonthlyIncome: 250,
      expectedTotalContributionMonths: 240,
      expectedMonthlyPension: 70,
      totalExpectedPremium: 5000,
      basicPensionAmount: 0,
      aValue: 319.3511,
      bValue: 250,
    },
    additionalPayment: {
      firstEnrollYm: "",
      resumeYm: "",
      gapMonths: 0,
      gapReason: "EXEMPT",
      enrollStatus: "REGIONAL",
      receivedLumpSumRefund: false,
      requestedMonths: 0,
      baseIncome: 100,
      paymentMode: "LUMP",
      installments: 12,
      installmentInterestRate: 2.5,
      applyYm: "",
      marginalTaxRate: 15,
      applyToSimulation: false,
    },
    returnRepayment: {
      refundAmount: 0,
      refundYm: "",
      restoredMonths: 0,
      periodStartYm: "",
      noticeAmount: 0,
      applyYm: "",
      installments: 1,
      applyToSimulation: false,
    },
    retirementPensions: [],
    personalPensions: [],
    pensionInsurances: [],
  },
};

console.log("1. Testing buildHouseholdReport...");
const report = buildHouseholdReport(sampleInput);
assert.ok(report, "report should be generated");
assert.equal(report.hasSpouse, true);
assert.ok(report.total >= 0 && report.total <= 100, "total score should be 0..100");
assert.ok(report.dimensions.length === 5, "should have 5 dimensions");
assert.ok(report.scenarios.length >= 4, "should have S0, S1, S3, S4 scenarios");
assert.ok(report.best, "should identify best scenario");
console.log(`- Total Score: ${report.total} (${report.grade.letter} ${report.grade.label})`);
console.log(`- Best Scenario: ${report.best.id} ${report.best.name}`);

console.log("2. Testing fallbackNarrative...");
const narrative = fallbackNarrative(report);
assert.ok(narrative.headline, "should have headline");
assert.ok(narrative.summary, "should have summary");
assert.ok(narrative.strengths.length > 0, "should have strengths");
assert.ok(narrative.risks.length > 0, "should have risks");
assert.ok(narrative.actions.length > 0, "should have actions");
assert.ok(narrative.allocation.safe + narrative.allocation.income + narrative.allocation.growth === 100, "allocation should sum to 100");
console.log(`- Headline: ${narrative.headline}`);

console.log("3. Testing reportFacts...");
const facts = reportFacts(report, sampleInput);
assert.ok(facts.includes("[진단 대상]"), "facts should include 진단 대상");
assert.ok(facts.includes("[진단 지표"), "facts should include 진단 지표");

console.log("4. Testing normalizeNarrative...");
const normalized = normalizeNarrative(narrative);
assert.ok(normalized, "normalized should match valid narrative");

console.log("5. Testing child support & medical expense...");
const costInput: ReportInput = {
  ...sampleInput,
  simulationParams: { ...sampleInput.simulationParams, childSupportExpense: 20000, annualMedicalExpense: 360 },
};
const withCosts = buildHouseholdReport(costInput);
assert.deepEqual(withCosts.childSupport, { total: 20000, uncovered: 15000 }, "비연금 자산 5,000만원으로 먼저 충당");
assert.equal(withCosts.medicalMonthly, 30);
assert.ok(withCosts.avgTargetReal > report.avgTargetReal, "의료비만큼 지출 곡선 목표가 올라야 함");
assert.ok(withCosts.shortfallPV >= report.shortfallPV);
assert.ok(fallbackNarrative(withCosts).risks.some((x) => x.title === "자녀 지원비 부담"));
assert.ok(reportFacts(withCosts, costInput).includes("자녀 교육·결혼 지원 예정 총액"));
assert.deepEqual(report.childSupport, { total: 0, uncovered: 0 });

console.log("All HouseholdReport tests passed!");
