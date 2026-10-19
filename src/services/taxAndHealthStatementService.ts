/**
 * 은퇴 세금 & 건강보험료 모의 고지서 통합 A4 명세서 서비스
 * 소득세법(연금소득세, 종합/분리과세) & 국민건강보험법(지역건보료 점수제, 1억 공제, 임의계속가입)
 */

import { HEALTH_INSURANCE_RATES, calculatePropertyPoints } from "./localHealthInsuranceCalculator";
import { getLowTaxRateByAge } from "./privatePensionTaxOptimizer";

export interface IntegratedTaxAndHealthStatement {
  taxYear: number;
  personalInfo: {
    age: number;
    hasSpouse: boolean;
    spouseAge: number;
    retirementAge: number;
  };
  incomes: {
    annualNationalPensionWon: number;
    annualRetirementPensionWon: number;
    annualPersonalPensionWon: number;
    annualFinancialWon: number;
    totalAnnualIncomeWon: number;
    totalMonthlyIncomeWon: number;
  };
  taxes: {
    // 공적연금 세금 (종합소득 간이세율)
    publicPensionIncomeWon: number;
    publicPensionDeductionWon: number;
    publicTaxBaseWon: number;
    publicEstimatedAnnualTaxWon: number;
    // 사적연금 세금 (저율 분리과세)
    privatePensionIncomeWon: number;
    privatePensionTaxRate: number; // e.g. 5.5%
    privatePensionAnnualTaxWon: number;
    // 배당/금융소득 세금 (15.4%)
    financialAnnualTaxWon: number;
    // 세금 합계
    totalAnnualTaxWon: number;
    totalMonthlyTaxWon: number;
    effectiveTaxRate: number; // (%)
  };
  healthInsurance: {
    propertyTaxBaseWon: number;
    propertyPoints: number;
    monthlyPropertyFeeWon: number;
    annualPublicPensionWon: number;
    monthlyPublicPensionFeeWon: number;
    annualFinancialIncomeWon: number;
    monthlyFinancialFeeWon: number;
    monthlyBaseHealthFeeWon: number;
    monthlyLongTermCareFeeWon: number;
    totalMonthlyHealthFeeWon: number;
    totalAnnualHealthFeeWon: number;
    isEligibleDependent: boolean; // 피부양자 자격 유지 여부 (연 2,000만원 이하 & 재산 요건 충족)
    arbitraryContinuousMonthlyWon: number; // 임의계속가입 시 월 납부액
    arbitrarySavings36MonthsWon: number; // 36개월간 총 절감액
  };
  netIncome: {
    annualGrossWon: number;
    annualTotalTaxAndHealthWon: number;
    annualNetWon: number;
    monthlyGrossWon: number;
    monthlyTotalDeductionWon: number;
    monthlyNetWon: number;
    netIncomeRatio: number; // (%) 실수령 비율
  };
  actionableTips: string[];
}

export function generateTaxAndHealthStatement(params: {
  age: number;
  hasSpouse: boolean;
  spouseAge?: number;
  retirementAge: number;
  annualNationalPensionWon: number;
  annualRetirementPensionWon: number;
  annualPersonalPensionWon: number;
  annualFinancialWon: number;
  propertyTaxBaseWon: number;
  lastStandardMonthlySalaryWon?: number;
}): IntegratedTaxAndHealthStatement {
  const currentYear = 2026;
  const age = params.age;
  const spouseAge = params.spouseAge ?? (params.hasSpouse ? age - 2 : 0);

  // 1. 소득 합계
  const annualNational = params.annualNationalPensionWon;
  const annualRetirement = params.annualRetirementPensionWon;
  const annualPersonal = params.annualPersonalPensionWon;
  const annualFinancial = params.annualFinancialWon;
  const annualPrivateTotal = annualRetirement + annualPersonal;

  const totalAnnualIncomeWon = annualNational + annualPrivateTotal + annualFinancial;
  const totalMonthlyIncomeWon = Math.round(totalAnnualIncomeWon / 12);

  // 2. 세금 계산
  // A. 공적연금 세금 (연금소득공제 반영)
  let publicPensionDeductionWon = 0;
  if (annualNational <= 3500000) {
    publicPensionDeductionWon = annualNational;
  } else if (annualNational <= 7000000) {
    publicPensionDeductionWon = 3500000 + (annualNational - 3500000) * 0.4;
  } else if (annualNational <= 14000000) {
    publicPensionDeductionWon = 4900000 + (annualNational - 7000000) * 0.2;
  } else {
    publicPensionDeductionWon = Math.min(9000000, 6300000 + (annualNational - 14000000) * 0.1);
  }

  // 기본 인적공제 (본인 150만원 + 배우자 150만원)
  const basicPersonalDeduction = 1500000 + (params.hasSpouse ? 1500000 : 0);
  const publicTaxBaseWon = Math.max(0, annualNational - publicPensionDeductionWon - basicPersonalDeduction);

  // 공적연금 누진세액 (과표 1,400만원 이하 6.6%, 1,400~5,000만원 16.5%)
  let publicEstimatedAnnualTaxWon = 0;
  if (publicTaxBaseWon <= 14000000) {
    publicEstimatedAnnualTaxWon = Math.round(publicTaxBaseWon * 0.066);
  } else if (publicTaxBaseWon <= 50000000) {
    publicEstimatedAnnualTaxWon = Math.round(14000000 * 0.066 + (publicTaxBaseWon - 14000000) * 0.165);
  } else {
    publicEstimatedAnnualTaxWon = Math.round(
      14000000 * 0.066 + 36000000 * 0.165 + (publicTaxBaseWon - 50000000) * 0.264
    );
  }

  // B. 사적연금 세금 (연 1,500만원 이하 시 연령별 저율 분리과세 3.3~5.5%, 초과 시 16.5%)
  const lowRate = getLowTaxRateByAge(age);
  let privatePensionAnnualTaxWon = 0;
  let privatePensionTaxRate = lowRate;

  if (annualPrivateTotal <= 15000000) {
    privatePensionAnnualTaxWon = Math.round(annualPrivateTotal * lowRate);
    privatePensionTaxRate = lowRate;
  } else {
    // 1500만 초과 시 16.5% 분리과세 기준
    privatePensionAnnualTaxWon = Math.round(annualPrivateTotal * 0.165);
    privatePensionTaxRate = 0.165;
  }

  // C. 금융소득 세금 (일반 15.4%)
  const financialAnnualTaxWon = Math.round(annualFinancial * 0.154);

  const totalAnnualTaxWon = publicEstimatedAnnualTaxWon + privatePensionAnnualTaxWon + financialAnnualTaxWon;
  const totalMonthlyTaxWon = Math.round(totalAnnualTaxWon / 12);
  const effectiveTaxRate = totalAnnualIncomeWon > 0 ? Number(((totalAnnualTaxWon / totalAnnualIncomeWon) * 100).toFixed(1)) : 0;

  // 3. 지역건강보험료 산출
  const propertyPoints = calculatePropertyPoints(params.propertyTaxBaseWon);
  const monthlyPropertyFeeWon = Math.round(propertyPoints * HEALTH_INSURANCE_RATES.propertyPointValue);

  // 공적연금: 50% 반영 후 7.09% 부과 (월 기준)
  const monthlyPublicPensionFeeWon = Math.round(
    ((annualNational * HEALTH_INSURANCE_RATES.publicPensionReflectRatio) / 12) * HEALTH_INSURANCE_RATES.healthRate
  );

  // 금융소득: 연 1,000만원 초과 시 전액 부과
  const isFinancialOverLimit = annualFinancial > HEALTH_INSURANCE_RATES.financialIncomeThresholdWon;
  const monthlyFinancialFeeWon = isFinancialOverLimit
    ? Math.round((annualFinancial / 12) * HEALTH_INSURANCE_RATES.healthRate)
    : 0;

  const monthlyBaseHealthFeeWon = monthlyPropertyFeeWon + monthlyPublicPensionFeeWon + monthlyFinancialFeeWon;
  const monthlyLongTermCareFeeWon = Math.round(monthlyBaseHealthFeeWon * HEALTH_INSURANCE_RATES.longTermCareRate);
  const totalMonthlyHealthFeeWon = monthlyBaseHealthFeeWon + monthlyLongTermCareFeeWon;
  const totalAnnualHealthFeeWon = totalMonthlyHealthFeeWon * 12;

  // 피부양자 자격 판단: 합산 소득 연 2,000만원 이하 & 재산과표 5.4억 이하 (또는 재산과표 9억 이하이면서 소득 1,000만원 이하)
  const isIncomeUnder20M = (annualNational + annualFinancial) <= 20000000;
  const propertyManwon = params.propertyTaxBaseWon / 10000;
  const isPropertyUnder5_4 = propertyManwon <= 54000;
  const isEligibleDependent = isIncomeUnder20M && (isPropertyUnder5_4 || (propertyManwon <= 90000 && (annualNational + annualFinancial) <= 10000000));

  // 임의계속가입 (종전 직장 기준소득월액 기반)
  const lastSalaryWon = params.lastStandardMonthlySalaryWon || 4500000;
  const arbitraryBaseMonthlyWon = Math.round(lastSalaryWon * HEALTH_INSURANCE_RATES.workplaceEmployeeRate);
  const arbitraryLongCareMonthlyWon = Math.round(arbitraryBaseMonthlyWon * HEALTH_INSURANCE_RATES.longTermCareRate);
  const arbitraryContinuousMonthlyWon = arbitraryBaseMonthlyWon + arbitraryLongCareMonthlyWon;

  const monthlyDiff = totalMonthlyHealthFeeWon - arbitraryContinuousMonthlyWon;
  const arbitrarySavings36MonthsWon = monthlyDiff > 0 ? monthlyDiff * 36 : 0;

  // 4. 실수령액 (Net Income)
  const annualTotalTaxAndHealthWon = totalAnnualTaxWon + totalAnnualHealthFeeWon;
  const annualNetWon = Math.max(0, totalAnnualIncomeWon - annualTotalTaxAndHealthWon);
  const monthlyGrossWon = totalMonthlyIncomeWon;
  const monthlyTotalDeductionWon = Math.round(annualTotalTaxAndHealthWon / 12);
  const monthlyNetWon = Math.max(0, monthlyGrossWon - monthlyTotalDeductionWon);
  const netIncomeRatio = totalAnnualIncomeWon > 0 ? Number(((annualNetWon / totalAnnualIncomeWon) * 100).toFixed(1)) : 100;

  // 5. 실행 권장 팁
  const actionableTips: string[] = [];
  if (annualPrivateTotal > 15000000) {
    actionableTips.push(`⚠️ 사적연금 수령액이 연 ${Math.round(annualPrivateTotal / 10000).toLocaleString()}만 원으로 1,500만 원 한도를 초과하여 16.5% 분리과세가 적용 중입니다. 수령 기간을 연장하면 연 3.3~5.5% 저율과세로 절세 가능합니다.`);
  } else {
    actionableTips.push(`✅ 사적연금 수령액이 연 1,500만 원 이하로 유지되어 저율 연금소득세(${Number((privatePensionTaxRate * 100).toFixed(1))}%) 혜택을 온전히 누리고 있습니다.`);
  }

  if (isEligibleDependent) {
    actionableTips.push("🎉 연간 합산소득 2,000만 원 및 재산 요건을 충족하여 건강보험 피부양자 자격 유지가 가능합니다 (지역건보료 0원 세이브 기회).");
  } else {
    actionableTips.push(`💡 연간 소득 또는 재산 과표로 인해 피부양자 탈락 대상입니다. 은퇴 직후 36개월간 '임의계속가입' 제도를 신청하면 월 약 ${Math.max(0, Math.round(monthlyDiff / 10000)).toLocaleString()}만 원, 3년간 총 ${(Math.round(arbitrarySavings36MonthsWon / 10000)).toLocaleString()}만 원의 건보료를 절감할 수 있습니다.`);
  }

  if (annualFinancial > 10000000) {
    actionableTips.push("⚠️ 금융소득(배당/이자)이 연 1,000만 원을 초과하여 전액 건강보험료 산정 소득에 합산되고 있습니다. 연금계좌(IRP/연금저축/ISA)를 활용해 비과세/과세이연으로 분산하세요.");
  }

  return {
    taxYear: currentYear,
    personalInfo: {
      age,
      hasSpouse: params.hasSpouse,
      spouseAge,
      retirementAge: params.retirementAge,
    },
    incomes: {
      annualNationalPensionWon: annualNational,
      annualRetirementPensionWon: annualRetirement,
      annualPersonalPensionWon: annualPersonal,
      annualFinancialWon: annualFinancial,
      totalAnnualIncomeWon,
      totalMonthlyIncomeWon,
    },
    taxes: {
      publicPensionIncomeWon: annualNational,
      publicPensionDeductionWon,
      publicTaxBaseWon,
      publicEstimatedAnnualTaxWon,
      privatePensionIncomeWon: annualPrivateTotal,
      privatePensionTaxRate,
      privatePensionAnnualTaxWon,
      financialAnnualTaxWon,
      totalAnnualTaxWon,
      totalMonthlyTaxWon,
      effectiveTaxRate,
    },
    healthInsurance: {
      propertyTaxBaseWon: params.propertyTaxBaseWon,
      propertyPoints,
      monthlyPropertyFeeWon,
      annualPublicPensionWon: annualNational,
      monthlyPublicPensionFeeWon,
      annualFinancialIncomeWon: annualFinancial,
      monthlyFinancialFeeWon,
      monthlyBaseHealthFeeWon,
      monthlyLongTermCareFeeWon,
      totalMonthlyHealthFeeWon,
      totalAnnualHealthFeeWon,
      isEligibleDependent,
      arbitraryContinuousMonthlyWon,
      arbitrarySavings36MonthsWon,
    },
    netIncome: {
      annualGrossWon: totalAnnualIncomeWon,
      annualTotalTaxAndHealthWon,
      annualNetWon,
      monthlyGrossWon,
      monthlyTotalDeductionWon,
      monthlyNetWon,
      netIncomeRatio,
    },
    actionableTips,
  };
}
