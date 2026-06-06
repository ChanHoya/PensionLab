import { NextResponse } from "next/server";
import { prisma } from "@/config/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nationalPension,
      basicPension,
      retirementPensions,
      personalPensions,
      pensionInsurances,
      simulationParams,
    } = body;

    // Create user and associated pension records inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          onboardingCompleted: true,
        },
      });

      // 2. Create National Pension
      if (nationalPension) {
        await tx.nationalPension.create({
          data: {
            userId: user.id,
            contributionMonths: Number(nationalPension.contributionMonths) || 0,
            totalPaidAmount: Number(nationalPension.totalPaidAmount) || 0,
            currentStandardMonthlyIncome: Number(nationalPension.currentStandardMonthlyIncome) || 0,
            expectedTotalContributionMonths: Number(nationalPension.expectedTotalContributionMonths) || 0,
            expectedMonthlyPension: Number(nationalPension.expectedMonthlyPension) || 0,
            totalExpectedPremium: Number(nationalPension.totalExpectedPremium) || 0,
            basicPensionAmount: Number(nationalPension.basicPensionAmount) || 0,
            aValue: Number(nationalPension.aValue) || 0,
            bValue: Number(nationalPension.bValue) || 0,
          },
        });
      }

      // 3. Create Basic Pension
      if (basicPension) {
        await tx.basicPension.create({
          data: {
            userId: user.id,
            householdType: basicPension.householdType || "SINGLE",
            recognizedIncome: Number(basicPension.recognizedIncome) || 0,
            expectedEligibility: Boolean(basicPension.expectedEligibility),
            expectedMonthlyAmount: Number(basicPension.expectedMonthlyAmount) || 0,
          },
        });
      }

      // 4. Create Retirement Pensions
      if (retirementPensions && Array.isArray(retirementPensions)) {
        for (const rp of retirementPensions) {
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
        }
      }

      // 5. Create Personal Pension Savings
      if (personalPensions && Array.isArray(personalPensions)) {
        for (const pp of personalPensions) {
          await tx.personalPensionSavings.create({
            data: {
              userId: user.id,
              savingsType: pp.savingsType,
              totalAccumulated: Number(pp.totalAccumulated) || 0,
              monthlyAnnualContribution: Number(pp.monthlyAnnualContribution) || 0,
              desiredStartAge: Number(pp.desiredStartAge) || 60,
              receivingPeriod: Number(pp.receivingPeriod) || 20,
            },
          });
        }
      }

      // 6. Create Pension Insurances
      if (pensionInsurances && Array.isArray(pensionInsurances)) {
        for (const pi of pensionInsurances) {
          await tx.pensionInsurance.create({
            data: {
              userId: user.id,
              insuranceType: pi.insuranceType || "일반연금보험",
              totalAccumulated: Number(pi.totalAccumulated) || 0,
              monthlyPayment: Number(pi.monthlyPayment) || 0,
              paymentPeriod: Number(pi.paymentPeriod) || 10,
              expectedDeclaredRate: Number(pi.expectedDeclaredRate) || 0,
            },
          });
        }
      }

      // 7. Create Simulation Scenario
      if (simulationParams) {
        await tx.simulationScenario.create({
          data: {
            userId: user.id,
            scenarioName: "기본 시나리오",
            retirementAge: Number(simulationParams.retirementAge) || 60,
            expectedLifeExpectancy: Number(simulationParams.expectedLifeExpectancy) || 85,
            inflationRate: Number(simulationParams.inflationRate) || 2.0,
            nationalPensionStartAge: Number(simulationParams.nationalPensionStartAge) || 65,
          },
        });
      }

      return user;
    });

    return NextResponse.json({ success: true, userId: result.id });
  } catch (error: any) {
    console.error("Onboarding API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "온보딩 데이터를 저장하는 중에 에러가 발생했습니다.",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
