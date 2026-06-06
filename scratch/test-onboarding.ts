import { prisma } from "../src/config/db";

const testData = {
  nationalPension: {
    contributionMonths: 375,
    totalPaidAmount: 13060,
    currentStandardMonthlyIncome: 637,
    expectedTotalContributionMonths: 405,
    expectedMonthlyPension: 213,
    totalExpectedPremium: 14977,
    basicPensionAmount: 2556,
    aValue: 319,
    bValue: 656
  },
  basicPension: {
    householdType: "SINGLE",
    recognizedIncome: 0,
    expectedEligibility: false,
    expectedMonthlyAmount: 0
  },
  retirementPensions: [
    {
      pensionType: "DC",
      avgSalary: 400,
      yearsOfService: 10,
      salaryGrowthRate: 3,
      totalAccumulated: 4000,
      monthlyContribution: 0,
      companyMatchRate: 20,
      expectedReturnRate: 4.5,
      id: "f2bb4bba-343c-452b-97fe-157aa9f284d9"
    },
    {
      pensionType: "IRP",
      avgSalary: 400,
      yearsOfService: 10,
      salaryGrowthRate: 3,
      totalAccumulated: 60000,
      monthlyContribution: 0,
      companyMatchRate: 20,
      expectedReturnRate: 4.5,
      id: "1bf0936f-f2ec-45c9-8df7-cde41d76a6bb"
    }
  ],
  personalPensions: [],
  pensionInsurances: [],
  simulationParams: {
    retirementAge: 65,
    expectedLifeExpectancy: 100,
    inflationRate: 2.4,
    nationalPensionStartAge: 65
  }
};

async function main() {
  console.log("Starting onboarding DB save test...");
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          onboardingCompleted: true,
        },
      });
      console.log("User created:", user.id);

      // 2. Create National Pension
      if (testData.nationalPension) {
        await tx.nationalPension.create({
          data: {
            userId: user.id,
            contributionMonths: Number(testData.nationalPension.contributionMonths) || 0,
            totalPaidAmount: Number(testData.nationalPension.totalPaidAmount) || 0,
            currentStandardMonthlyIncome: Number(testData.nationalPension.currentStandardMonthlyIncome) || 0,
            expectedTotalContributionMonths: Number(testData.nationalPension.expectedTotalContributionMonths) || 0,
            expectedMonthlyPension: Number(testData.nationalPension.expectedMonthlyPension) || 0,
            totalExpectedPremium: Number(testData.nationalPension.totalExpectedPremium) || 0,
            basicPensionAmount: Number(testData.nationalPension.basicPensionAmount) || 0,
            aValue: Number(testData.nationalPension.aValue) || 0,
            bValue: Number(testData.nationalPension.bValue) || 0,
          },
        });
        console.log("National Pension created.");
      }

      // 3. Create Basic Pension
      if (testData.basicPension) {
        await tx.basicPension.create({
          data: {
            userId: user.id,
            householdType: testData.basicPension.householdType || "SINGLE",
            recognizedIncome: Number(testData.basicPension.recognizedIncome) || 0,
            expectedEligibility: Boolean(testData.basicPension.expectedEligibility),
            expectedMonthlyAmount: Number(testData.basicPension.expectedMonthlyAmount) || 0,
          },
        });
        console.log("Basic Pension created.");
      }

      // 4. Create Retirement Pensions
      if (testData.retirementPensions && Array.isArray(testData.retirementPensions)) {
        for (const rp of testData.retirementPensions) {
          await tx.retirementPension.create({
            data: {
              userId: user.id,
              pensionType: rp.pensionType,
              avgSalary: rp.avgSalary ? Number(rp.avgSalary) : null,
              yearsOfService: rp.yearsOfService ? Number(rp.yearsOfService) : null,
              salaryGrowthRate: rp.salaryGrowthRate ? Number(rp.salaryGrowthRate) : null,
              totalAccumulated: rp.totalAccumulated ? Number(rp.totalAccumulated) : null,
              monthlyContribution: rp.monthlyContribution ? Number(rp.monthlyContribution) : null,
              companyMatchRate: rp.companyMatchRate ? Number(rp.companyMatchRate) : null,
              expectedReturnRate: rp.expectedReturnRate ? Number(rp.expectedReturnRate) : null,
            },
          });
          console.log(`Retirement Pension created: ${rp.pensionType}`);
        }
      }

      // 5. Create Personal Pension Savings
      if (testData.personalPensions && Array.isArray(testData.personalPensions)) {
        for (const pp of testData.personalPensions) {
          await tx.personalPensionSavings.create({
            data: {
              userId: user.id,
              savingsType: (pp as any).savingsType,
              totalAccumulated: Number((pp as any).totalAccumulated) || 0,
              monthlyAnnualContribution: Number((pp as any).monthlyAnnualContribution) || 0,
              desiredStartAge: Number((pp as any).desiredStartAge) || 60,
              receivingPeriod: Number((pp as any).receivingPeriod) || 20,
            },
          });
        }
      }

      // 6. Create Pension Insurances
      if (testData.pensionInsurances && Array.isArray(testData.pensionInsurances)) {
        for (const pi of testData.pensionInsurances) {
          await tx.pensionInsurance.create({
            data: {
              userId: user.id,
              insuranceType: (pi as any).insuranceType || "일반연금보험",
              totalAccumulated: Number((pi as any).totalAccumulated) || 0,
              monthlyPayment: Number((pi as any).monthlyPayment) || 0,
              paymentPeriod: Number((pi as any).paymentPeriod) || 10,
              expectedDeclaredRate: Number((pi as any).expectedDeclaredRate) || 0,
            },
          });
        }
      }

      // 7. Create Simulation Scenario
      if (testData.simulationParams) {
        await tx.simulationScenario.create({
          data: {
            userId: user.id,
            scenarioName: "기본 시나리오",
            retirementAge: Number(testData.simulationParams.retirementAge) || 60,
            expectedLifeExpectancy: Number(testData.simulationParams.expectedLifeExpectancy) || 85,
            inflationRate: Number(testData.simulationParams.inflationRate) || 2.0,
            nationalPensionStartAge: Number(testData.simulationParams.nationalPensionStartAge) || 65,
          },
        });
        console.log("Simulation Scenario created.");
      }

      return user;
    });

    console.log("Transaction successfully completed. User ID:", result.id);
  } catch (error) {
    console.error("Transaction failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
