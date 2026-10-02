/**
 * 국민건강보험법 시행규칙 제42조, 국민건강보험법 제69조, 제72조, 제110조
 * 2024~2026년 기준 은퇴 후 지역건강보험료 모의 고지서 및 임의계속가입(36개월) 계산 엔진
 */

export const HEALTH_INSURANCE_RATES = {
  healthRate: 0.0709, // 7.09% (2024~2026년 건강보험료율)
  workplaceEmployeeRate: 0.03545, // 3.545% (직장가입자 근로자 본인 부담률 = 7.09% / 2)
  longTermCareRate: 0.1295, // 12.95% (건강보험료 대비 장기요양보험료율)
  propertyPointValue: 208.4, // 2024~2026년 재산 점수당 208.4원
  propertyBasicDeductionWon: 100000000, // 2024년 2월 개편: 재산 과표 1억원 기본 공제
  financialIncomeThresholdWon: 10000000, // 금융소득 1,000만원 초과 시 전액 부과
  publicPensionReflectRatio: 0.50, // 공적연금 소득 인정 비율 50%
  privatePensionReflectRatio: 0.0, // 사적연금(연금저축/IRP/퇴직연금)은 현행 완전 비과세 (0%)
};

/**
 * 재산세 과세표준(원) 기반 지역건보료 재산 점수 계산
 * (2024년 2월 개정: 1억원 공제 후 1~60등급 산정)
 */
export function calculatePropertyPoints(propertyTaxBaseWon: number): number {
  // 1억원 기본 공제 적용
  const taxableProperty = Math.max(0, propertyTaxBaseWon - HEALTH_INSURANCE_RATES.propertyBasicDeductionWon);
  if (taxableProperty <= 0) return 0;

  const manwon = taxableProperty / 10000;

  // 등급 구간별 점수표 (근사 회귀식: 보건복지부 고시 재산등급표 기준)
  if (manwon <= 450) return 22;
  if (manwon <= 1000) return 56;
  if (manwon <= 3000) return 137;
  if (manwon <= 5000) return 201;
  if (manwon <= 10000) return 335;
  if (manwon <= 15000) return 440;
  if (manwon <= 20000) return 515;
  if (manwon <= 30000) return 625;
  if (manwon <= 40000) return 705;
  if (manwon <= 50000) return 775;
  if (manwon <= 70000) return 890;
  if (manwon <= 100000) return 1025;
  if (manwon <= 150000) return 1205;
  if (manwon <= 200000) return 1350;
  if (manwon <= 300000) return 1575;
  if (manwon <= 500000) return 1930;
  return 2340; // 50억원 초과 최고 60등급
}

export interface LocalHealthInsuranceBill {
  // 입력 요약
  propertyTaxBaseWon: number;
  annualPublicPensionWon: number;
  annualFinancialIncomeWon: number;
  lastStandardMonthlySalaryWon: number; // 종전 직장 기준소득월액

  // 모의 고지서 세부 항목 (월 기준, 원 단위)
  propertyPoints: number;
  propertyFeeMonthlyWon: number; // 월 재산 보험료
  publicPensionFeeMonthlyWon: number; // 월 공적연금 보험료 (50% 반영)
  financialFeeMonthlyWon: number; // 월 금융소득 보험료 (1,000만원 초과 시)
  privatePensionFeeMonthlyWon: number; // 사적연금은 0원 (비과세)

  healthInsuranceMonthlyWon: number; // 순수 건강보험료 합계
  longTermCareMonthlyWon: number; // 장기요양보험료 (건보료 * 12.95%)
  totalLocalBillMonthlyWon: number; // 최종 고지 월 지역보험료

  // 종전 직장보험료 비교
  workplaceHealthFeeMonthlyWon: number;
  workplaceLongTermCareMonthlyWon: number;
  totalWorkplaceBillMonthlyWon: number;

  // 임의계속가입 (국민건강보험법 제110조, 36개월)
  voluntaryContinuation: {
    isAdvantageous: boolean; // 임의계속가입이 유리한지 여부
    monthlySavingsWon: number; // 월 절감액
    total36MonthsSavingsWon: number; // 36개월간 총 절감액
    recommendation: string; // 행동 가이드
    deadlineNotice: string; // 신청 기한 안내
  };

  // 피부양자 자격 분석
  dependentStatus: {
    isEligible: boolean;
    reason: string;
  };
}

export function calculateLocalHealthInsuranceBill(params: {
  propertyTaxBaseWon: number; // 재산세 과세표준 (원)
  annualPublicPensionWon: number; // 연간 공적연금(국민연금) 수령액 (원)
  annualFinancialIncomeWon: number; // 연간 금융소득(이자/배당) (원)
  lastStandardMonthlySalaryWon?: number; // 종전 직장 기준소득월액 (원)
}): LocalHealthInsuranceBill {
  const {
    propertyTaxBaseWon,
    annualPublicPensionWon,
    annualFinancialIncomeWon,
    lastStandardMonthlySalaryWon = 4500000, // 기본 450만원
  } = params;

  // 1. 재산 보험료 계산
  const propertyPoints = calculatePropertyPoints(propertyTaxBaseWon);
  const propertyFeeMonthlyWon = Math.round(propertyPoints * HEALTH_INSURANCE_RATES.propertyPointValue);

  // 2. 소득 보험료 계산
  // 공적연금: 50% 인정 후 7.09% 부과 -> 월 환산
  const recognizedPublicPensionAnnual = annualPublicPensionWon * HEALTH_INSURANCE_RATES.publicPensionReflectRatio;
  const publicPensionFeeMonthlyWon = Math.round((recognizedPublicPensionAnnual * HEALTH_INSURANCE_RATES.healthRate) / 12);

  // 금융소득: 1,000만원 초과 시 전액에 대해 7.09% 부과 -> 월 환산
  let financialFeeMonthlyWon = 0;
  if (annualFinancialIncomeWon > HEALTH_INSURANCE_RATES.financialIncomeThresholdWon) {
    financialFeeMonthlyWon = Math.round((annualFinancialIncomeWon * HEALTH_INSURANCE_RATES.healthRate) / 12);
  }

  // 사적연금은 현재 건강보험료 완전 비과세 (0원)
  const privatePensionFeeMonthlyWon = 0;

  // 순수 건강보험료 합계
  const healthInsuranceMonthlyWon = propertyFeeMonthlyWon + publicPensionFeeMonthlyWon + financialFeeMonthlyWon;

  // 장기요양보험료 (건보료의 12.95%)
  const longTermCareMonthlyWon = Math.round(healthInsuranceMonthlyWon * HEALTH_INSURANCE_RATES.longTermCareRate);

  // 최종 고지 월 지역보험료
  const totalLocalBillMonthlyWon = healthInsuranceMonthlyWon + longTermCareMonthlyWon;

  // 3. 종전 직장보험료 계산 (기준소득월액 기반 본인부담금 3.545% + 장기요양 12.95%)
  const workplaceHealthFeeMonthlyWon = Math.round(lastStandardMonthlySalaryWon * HEALTH_INSURANCE_RATES.workplaceEmployeeRate);
  const workplaceLongTermCareMonthlyWon = Math.round(workplaceHealthFeeMonthlyWon * HEALTH_INSURANCE_RATES.longTermCareRate);
  const totalWorkplaceBillMonthlyWon = workplaceHealthFeeMonthlyWon + workplaceLongTermCareMonthlyWon;

  // 4. 임의계속가입(36개월) 절감 분석
  const isAdvantageous = totalLocalBillMonthlyWon > totalWorkplaceBillMonthlyWon;
  const monthlySavingsWon = isAdvantageous ? totalLocalBillMonthlyWon - totalWorkplaceBillMonthlyWon : 0;
  const total36MonthsSavingsWon = monthlySavingsWon * 36;

  let recommendation = "";
  if (isAdvantageous) {
    recommendation = `임의계속가입을 신청하면 매월 ${Math.round(monthlySavingsWon / 10000).toLocaleString()}만원, 36개월간 총 ${Math.round(total36MonthsSavingsWon / 10000).toLocaleString()}만원의 건보료를 절약할 수 있습니다.`;
  } else {
    recommendation = "지역건강보험료가 종전 직장보험료보다 저렴하므로 임의계속가입을 신청하지 않고 지역보험료를 납부하는 것이 유리합니다.";
  }

  const deadlineNotice = "퇴직 후 최초 지역보험료 고지서를 받은 날의 납부기한으로부터 2개월 이내에 건강보험공단 지사에 신청해야 합니다.";

  // 5. 피부양자 자격 판정 (연 소득 2,000만원 이하 & 재산세 과표 5.4억원 이하 또는 5.4~9억원은 연소득 1,000만원 이하)
  const totalAnnualIncome = annualPublicPensionWon + annualFinancialIncomeWon;
  let isEligible = true;
  let reason = "피부양자 자격 유지 요건을 충족합니다.";

  if (totalAnnualIncome > 20000000) {
    isEligible = false;
    reason = `연간 합산소득(공적연금+금융소득)이 2,000만원을 초과(${Math.round(totalAnnualIncome / 10000).toLocaleString()}만원)하여 피부양자에서 탈락하고 지역가입자로 전환됩니다.`;
  } else if (annualFinancialIncomeWon > 10000000) {
    isEligible = false;
    reason = `금융소득(배당/이자)이 연 1,000만원을 초과(${Math.round(annualFinancialIncomeWon / 10000).toLocaleString()}만원)하여 피부양자에서 제외됩니다.`;
  } else if (propertyTaxBaseWon > 900000000) {
    isEligible = false;
    reason = `재산세 과세표준이 9억원을 초과(${Math.round(propertyTaxBaseWon / 100000000).toFixed(1)}억원)하여 소득과 무관하게 피부양자에서 탈락합니다.`;
  } else if (propertyTaxBaseWon > 540000000 && totalAnnualIncome > 10000000) {
    isEligible = false;
    reason = `재산세 과표 5.4억원 초과 구간에서 연간 소득이 1,000만원을 초과하여 피부양자에서 제외됩니다.`;
  }

  return {
    propertyTaxBaseWon,
    annualPublicPensionWon,
    annualFinancialIncomeWon,
    lastStandardMonthlySalaryWon,
    propertyPoints,
    propertyFeeMonthlyWon,
    publicPensionFeeMonthlyWon,
    financialFeeMonthlyWon,
    privatePensionFeeMonthlyWon,
    healthInsuranceMonthlyWon,
    longTermCareMonthlyWon,
    totalLocalBillMonthlyWon,
    workplaceHealthFeeMonthlyWon,
    workplaceLongTermCareMonthlyWon,
    totalWorkplaceBillMonthlyWon,
    voluntaryContinuation: {
      isAdvantageous,
      monthlySavingsWon,
      total36MonthsSavingsWon,
      recommendation,
      deadlineNotice,
    },
    dependentStatus: {
      isEligible,
      reason,
    },
  };
}
