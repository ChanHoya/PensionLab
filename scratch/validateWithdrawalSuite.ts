import {
  calculateProgressiveTax,
  getPensionDeduction,
  calcWithdrawalLimit,
  calcTaxOnDeferredRetirement,
  calcTaxOnCredited,
  calcTaxOnPublicPension,
  assessHealthInsurance,
  runWithdrawalSimulation,
  calculateWeightedPMT,
} from "../src/services/withdrawalCalculator";

// Simple test assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertNear(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Assertion failed: ${message}. Expected ${expected} (±${tolerance}), got ${actual}`);
  }
}

console.log("Starting Pension Withdrawal Validation Suite...");

// ==========================================
// 1. Progressive Tax Calculation Tests
// ==========================================
function testProgressiveTax() {
  console.log("Running Progressive Tax Calculation Tests...");

  // Bracket 1: Up to 14M @ 6%
  // 10M income -> tax = 600K -> with local tax (10%) = 660K
  const tax1 = calculateProgressiveTax(10000000);
  assert(tax1 === 660000, `Expected 660,000, got ${tax1}`);

  // Bracket 2: Up to 50M @ 15%
  // 20M income -> first 14M @ 6% = 840K, next 6M @ 15% = 900K -> total base = 1.74M -> with local tax = 1,914,000
  const tax2 = calculateProgressiveTax(20000000);
  assert(tax2 === 1914000, `Expected 1,914,000, got ${tax2}`);

  // Boundary check: exactly 14M
  // 14M * 0.06 = 840K -> with local tax = 924K
  const taxBoundary1 = calculateProgressiveTax(14000000);
  assert(taxBoundary1 === 924000, `Expected 924,000, got ${taxBoundary1}`);

  // Bracket 3: Up to 88M @ 24%
  // 60M income -> 14M @ 6% (840K) + 36M @ 15% (5.4M) + 10M @ 24% (2.4M) = 8.64M -> with local tax = 9,504,000
  const tax3 = calculateProgressiveTax(60000000);
  assert(tax3 === 9504000, `Expected 9,504,000, got ${tax3}`);

  console.log("Progressive Tax Calculation Tests Passed!");
}

// ==========================================
// 2. Pension Income Deduction Tests
// ==========================================
function testPensionDeduction() {
  console.log("Running Pension Income Deduction Tests...");

  // Boundary 1: <= 3.5M (100%)
  assert(getPensionDeduction(3000000) === 3000000, "Should deduct 100% under 3.5M");
  assert(getPensionDeduction(3500000) === 3500000, "Should deduct 3.5M at 3.5M");

  // Boundary 2: <= 7.0M (3.5M + 40% of excess)
  // 5.0M -> 3.5M + 1.5M * 0.4 = 4.1M
  assert(getPensionDeduction(5000000) === 4100000, "Should deduct 4.1M for 5M payout");
  assert(getPensionDeduction(7000000) === 4900000, "Should deduct 4.9M at 7M");

  // Boundary 3: <= 14.0M (4.9M + 20% of excess)
  // 10.0M -> 4.9M + 3.0M * 0.2 = 5.5M
  assert(getPensionDeduction(10000000) === 5500000, "Should deduct 5.5M for 10M payout");
  assert(getPensionDeduction(14000000) === 6300000, "Should deduct 6.3M at 14M");

  // Boundary 4: > 14.0M (6.3M + 10% of excess, capped at 9M)
  // 20.0M -> 6.3M + 6.0M * 0.1 = 6.9M
  assert(getPensionDeduction(20000000) === 6900000, "Should deduct 6.9M for 20M payout");
  
  // Cap check: 100.0M -> 6.3M + 86.0M * 0.1 = 14.9M -> capped at 9.0M
  assert(getPensionDeduction(100000000) === 9000000, "Should cap at 9.0M");

  console.log("Pension Income Deduction Tests Passed!");
}

// ==========================================
// 3. Deferred Retirement Tax Tests
// ==========================================
function testDeferredRetirementTax() {
  console.log("Running Deferred Retirement Tax Tests...");

  const lumpSumRate = 0.08; // 8%
  const limit = 10000000; // 10M limit

  // Year 1-10: 30% relief
  // Under limit: 8M draw -> 8M * 0.08 * 0.7 = 448K
  const taxY5 = calcTaxOnDeferredRetirement(8000000, lumpSumRate, 5, limit);
  assert(taxY5 === 448000, `Expected 448,000, got ${taxY5}`);

  // Year 11-20: 40% relief
  // Under limit: 8M draw -> 8M * 0.08 * 0.6 = 384K
  const taxY15 = calcTaxOnDeferredRetirement(8000000, lumpSumRate, 15, limit);
  assert(taxY15 === 384000, `Expected 384,000, got ${taxY15}`);

  // Year 21+: 50% relief
  // Under limit: 8M draw -> 8M * 0.08 * 0.5 = 320K
  const taxY25 = calcTaxOnDeferredRetirement(8000000, lumpSumRate, 25, limit);
  assert(taxY25 === 320000, `Expected 320,000, got ${taxY25}`);

  // Excess handling check
  // 12M draw (2M over limit of 10M), year 5 (30% relief)
  // Under limit part: 10M * 0.08 * 0.7 = 560K
  // Over limit part: 2M * 0.08 = 160K
  // Total expected: 720K
  const taxExcess = calcTaxOnDeferredRetirement(12000000, lumpSumRate, 5, limit);
  assert(taxExcess === 720000, `Expected 720,000, got ${taxExcess}`);

  console.log("Deferred Retirement Tax Tests Passed!");
}

// ==========================================
// 4. Credited Personal Pension Tax Tests
// ==========================================
function testCreditedPersonalPensionTax() {
  console.log("Running Credited Personal Pension Tax Tests...");

  // A. Low rate by age (when draw is <= 15M separate tax threshold)
  // Age 55-69: 5.5% (includes local tax)
  const res1 = calcTaxOnCredited(10000000, 60, Infinity, 0, 0, false);
  assert(res1.tax === 550000, `Expected 550,000, got ${res1.tax}`);
  assert(!res1.isComprehensive, "Should not be comprehensive");

  // Age 70-79: 4.4%
  const res2 = calcTaxOnCredited(10000000, 75, Infinity, 0, 0, false);
  assert(res2.tax === 440000, `Expected 440,000, got ${res2.tax}`);

  // Age 80+: 3.3%
  const res3 = calcTaxOnCredited(10000000, 85, Infinity, 0, 0, false);
  assert(res3.tax === 330000, `Expected 330,000, got ${res3.tax}`);

  // B. Over separate tax threshold (15M limit)
  // Draw 20M, age 60 (under 15M limit is 15M, excess 5M)
  // Wait, let's see how calcTaxOnCredited calculates separate tax:
  // For draws > 15M:
  // It compares:
  // 1) 16.5% flat rate on drawUnderLimit (15M) + otherIncomeRate (16.5%) on drawOverLimit (5M)
  //    Wait! In code:
  //    `separateTaxUnderLimit = drawUnderLimit * overThresholdFlatRate` (15M * 0.165 = 2.475M)
  //    `taxOverLimit = drawOverLimit * otherIncomeRate` (5M * 0.165 = 825K)
  //    Total flat tax = 3,300,000
  // Let's verify:
  const resOverLimit = calcTaxOnCredited(20000000, 60, Infinity, 0, 0, false);
  console.log("Draw 20M tax:", resOverLimit);
  // Separate tax is 20,000,000 * 0.165 = 3,300,000.
  // Let's check if comprehensive is selected:
  // If other taxable income is 0 and public pension is 0, let's see what comp tax would be:
  // totalTaxablePension = 20,000,000 (drawUnderLimit).
  // pensionDeduction = getPensionDeduction(20,000,000) = 6.9M.
  // netPensionIncome = 13.1M.
  // totalIncomeWithPension = 13.1M + 0 = 13.1M.
  // compTaxWithPension = calculateProgressiveTax(Math.max(0, 13.1M - 1.5M = 11.6M))
  // 11.6M is in Bracket 1 (up to 14M @ 6%).
  // Base tax = 11.6M * 0.06 = 696,000.
  // With local tax = 696,000 * 1.1 = 765,600.
  // compTaxWithoutPension = 0.
  // marginalCompTax = 765,600.
  // totalCompTax = marginalCompTax + taxOverLimit = 765,600 + (drawOverLimit: 0? No, limit was Infinity!)
  // Wait! In the call, limit was Infinity!
  // If limit is Infinity, drawUnderLimit = 20M, drawOverLimit = 0.
  // Then separate tax = 20M * 0.165 = 3,300,000.
  // Comprehensive tax = 765,600.
  // Since 765,600 < 3,300,000, it should select COMPREHENSIVE!
  assert(resOverLimit.isComprehensive, "Should select comprehensive when other income is 0");
  assert(resOverLimit.tax === 765600, `Expected 765,600, got ${resOverLimit.tax}`);

  // Let's test with a high other taxable income to see if it switches back to separate flat rate.
  // Other taxable income = 100M KRW.
  // At 100M other income, any marginal income will be taxed at 35% or 38% bracket.
  // So comprehensive tax on netPensionIncome of 13.1M will be around 13.1M * 35% * 1.1 = ~5M.
  // Which is much higher than 3.3M separate flat tax (16.5%).
  // So it should select SEPARATE.
  const resHighOther = calcTaxOnCredited(20000000, 60, Infinity, 100000000, 0, false);
  console.log("Draw 20M with 100M other income tax:", resHighOther);
  assert(!resHighOther.isComprehensive, "Should select separate when other income is high");
  assert(resHighOther.tax === 3300000, `Expected 3,300,000, got ${resHighOther.tax}`);

  console.log("Credited Personal Pension Tax Tests Passed!");
}

// ==========================================
// 5. Public Pension Tax Tests
// ==========================================
function testPublicPensionTax() {
  console.log("Running Public Pension Tax Tests...");

  // 12M public pension, 50% taxable ratio -> 6M taxable.
  // 6M taxable -> deduction = 3.5M + 2.5M * 0.4 = 4.5M.
  // net pension income = 1.5M.
  // with other income = 0.
  // total income = 1.5M. basic deduction = 1.5M.
  // taxable income = 0. Tax = 0.
  const taxPublic1 = calcTaxOnPublicPension(12000000, 0.5, 0);
  assert(taxPublic1 === 0, `Expected 0, got ${taxPublic1}`);

  // 30M public pension, 50% taxable ratio -> 15M taxable.
  // 15M taxable -> deduction = 6.3M + 1M * 0.1 = 6.4M.
  // net pension income = 8.6M.
  // other income = 20M.
  // basic deduction = 1.5M.
  // tax without pension: other income (20M) - 1.5M = 18.5M taxable.
  // 14M @ 6% = 840K, 4.5M @ 15% = 675K. Base tax = 1,515,000. With local = 1,666,500.
  // tax with pension: other income (20M) + net pension (8.6M) - 1.5M = 27.1M taxable.
  // 14M @ 6% = 840K, 13.1M @ 15% = 1,965,000. Base tax = 2,805,000. With local = 3,085,500.
  // marginal tax = 3,085,500 - 1,666,500 = 1,419,000.
  const taxPublic2 = calcTaxOnPublicPension(30000000, 0.5, 20000000);
  assert(taxPublic2 === 1419000, `Expected 1,419,000, got ${taxPublic2}`);

  console.log("Public Pension Tax Tests Passed!");
}

// ==========================================
// 6. Health Insurance Assessment Tests
// ==========================================
function testHealthInsurance() {
  console.log("Running Health Insurance Assessment Tests...");

  // Below threshold: 18M public pension, 0 other -> 18M total <= 20M limit
  const hi1 = assessHealthInsurance(18000000, 0);
  assert(!hi1.isDependentLost, "Should retain dependent status");
  assert(hi1.estimatedPremium === 0, "Premium should be 0");

  // Above threshold: 24M public pension, 0 other -> 24M total > 20M limit
  // Premium base = 24M * 0.5 + 0 = 12M.
  // Premium = 12M * 0.08 = 960,000.
  const hi2 = assessHealthInsurance(24000000, 0);
  assert(hi2.isDependentLost, "Should lose dependent status");
  assert(hi2.estimatedPremium === 960000, `Expected 960,000, got ${hi2.estimatedPremium}`);

  // Mixed: 15M public pension, 10M other -> 25M total > 20M limit
  // Premium base = 15M * 0.5 + 10M = 17.5M.
  // Premium = 17.5M * 0.08 = 1,400,000.
  const hi3 = assessHealthInsurance(15000000, 10000000);
  assert(hi3.isDependentLost, "Should lose dependent status");
  assert(hi3.estimatedPremium === 17500000 * 0.08, `Expected ${17500000 * 0.08}, got ${hi3.estimatedPremium}`);

  console.log("Health Insurance Assessment Tests Passed!");
}

// ==========================================
// 7. Simulation Engine & Pre-Compounding Bug Check
// ==========================================
function testSimulationEngine() {
  console.log("Running Simulation Engine & Pre-Compounding Bug Check...");

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

  const mockRetirement = [
    {
      id: "ret-1",
      pensionType: "DC" as const,
      totalAccumulated: 10000, // 1억원
      monthlyContribution: 0,
      companyMatchRate: 0,
      expectedReturnRate: 5.0, // 5%
    }
  ];

  const mockPersonal = [
    {
      id: "per-1",
      savingsType: "FUND" as const,
      totalAccumulated: 10000, // 1억원
      monthlyAnnualContribution: 0,
      desiredStartAge: 60,
      receivingPeriod: 10,
    }
  ];

  const mockInsurance: any[] = [];

  const mockParams = {
    currentAge: 55,
    retirementAge: 60,
    expectedLifeExpectancy: 75,
    inflationRate: 0.0,
    nationalPensionStartAge: 65,
    hasSpouse: false,
    targetMonthlySpending: 0,
    minMonthlySpending: 0,
    childSupportExpense: 0,
    annualMedicalExpense: 0,
    nonPensionAssets: 0,
    decumulationStrategy: "FLAT" as const,
  };

  const result = runWithdrawalSimulation(
    mockNational,
    mockBasic,
    mockRetirement,
    mockPersonal,
    mockInsurance,
    mockParams,
    {
      personalTaxCreditRatio: 1.0,
      retirementLumpSumTaxRate: 0.0,
      otherIncomeAnnual: 0,
      publicPensionTaxableRatio: 0.0,
    }
  );

  const s0Flow = result.s0.flows;
  const s1Flow = result.s1.flows;

  // Fixed: S0 and S1 should have identical ending balances at 55 because
  // both compound year-by-year from currentAge 55 without discounting mismatches.
  // 100M DC @ 5% + 100M Personal @ 4.5% -> 105M + 104.5M = 209.5M (20950 만원)
  const s0_55 = s0Flow[0].endingBalance;
  const s1_55 = s1Flow[0].endingBalance;
  console.log(`[Bug Check] S0 Ending Balance at 55: ${s0_55} 만원`);
  console.log(`[Bug Check] S1 Ending Balance at 55: ${s1_55} 만원 (Expected: 20950, Actual: ${s1_55})`);
  
  assert(s0_55 === 20950, `S0 Ending Balance at 55 should be 20950, got ${s0_55}`);
  assert(s1_55 === 20950, `S1 Ending Balance at 55 should be 20950, got ${s1_55}`);

  // Fixed: Payout amount reflects 10 years of compounding for S1 (starts at 65)
  // vs 5 years of compounding for S0 (starts at 60).
  // S0: 100M * 1.045^5 / 8.2688 = 1507 만원
  // S1: 100M * 1.045^10 / 8.913 = 1742 만원 (receivingPeriod extended to 11 years to stay under 15M limit)
  const s0PayoutAt60 = s0Flow[5].personalPreTax; 
  const s1PayoutAt65 = s1Flow[10].personalPreTax; 
  console.log(`[Bug Check] S0 (Age 60 start) Personal Payout: ${s0PayoutAt60} 만원`);
  console.log(`[Bug Check] S1 (Age 65 start) Personal Payout: ${s1PayoutAt65} 만원 (Expected: 1742, Actual: ${s1PayoutAt65})`);
  
  assert(s0PayoutAt60 === 1507, `S0 Personal Payout should be 1507, got ${s0PayoutAt60}`);
  assert(s1PayoutAt65 === 1742, `S1 Personal Payout should be 1742, got ${s1PayoutAt65}`);

  // Bug 3: Double Compounding fixed.
  // When currentAge = 60, desiredStartAge = 65, but custom start is 60,
  // the balance starts at 100M (no pre-compounding to 65).
  // S3 payout starts immediately at 60 -> 100M / 8.2688 = 1209 만원.
  const customParams = {
    ...mockParams,
    currentAge: 60,
    retirementAge: 60,
  };
  const customPersonal = [
    {
      id: "per-1",
      savingsType: "FUND" as const,
      totalAccumulated: 10000, 
      monthlyAnnualContribution: 0,
      desiredStartAge: 65, 
      receivingPeriod: 10,
    }
  ];

  const resultCustom = runWithdrawalSimulation(
    mockNational,
    mockBasic,
    mockRetirement,
    customPersonal,
    mockInsurance,
    customParams,
    {
      personalTaxCreditRatio: 1.0,
      retirementLumpSumTaxRate: 0.0,
      otherIncomeAnnual: 0,
      publicPensionTaxableRatio: 0.0,
      s3CustomStartAges: {
        "per-1": 60, 
      },
      s3CustomPeriods: {
        "per-1": 10,
      }
    }
  );

  const s3Flow = resultCustom.s3.flows;
  const s3PayoutAt60 = s3Flow[0].personalPreTax; 
  console.log(`[Bug Check] S3 (Age 60 start, desired 65) Personal Payout: ${s3PayoutAt60} 만원 (Expected: 1209, Actual: ${s3PayoutAt60})`);
  assert(s3PayoutAt60 === 1209, `S3 Personal Payout should be 1209, got ${s3PayoutAt60}`);

  console.log("Simulation Engine Tests Completed.");
}

testProgressiveTax();
testPensionDeduction();
testDeferredRetirementTax();
testCreditedPersonalPensionTax();
testPublicPensionTax();
testHealthInsurance();
testSimulationEngine();
