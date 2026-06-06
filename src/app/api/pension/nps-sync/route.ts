import { NextResponse } from "next/server";

export async function GET() {
  // Simulating Codef API response for NPS National Pension
  // Returns highly realistic pre-calculated data representing the 9 required fields
  const mockNpsData = {
    contributionMonths: 184, // 15년 4개월 납부
    totalPaidAmount: 4140, // 4,140만원 납부함
    currentStandardMonthlyIncome: 450, // 기준 소득 월액 450만원
    expectedTotalContributionMonths: 360, // 총 30년 예상 가입
    expectedMonthlyPension: 98, // 월 98만원 수령 예상
    totalExpectedPremium: 8100, // 총 예상 납부 보험료 8,100만원
    basicPensionAmount: 93, // 기본 연금액 93만원
    aValue: 300, // A값 (전체 평균 소득) 300만원
    bValue: 430, // B값 (본인 평균 소득) 430만원
  };

  return NextResponse.json({
    success: true,
    data: mockNpsData,
  });
}
