// 2026 국민연금 개혁안(보험료율 인상 9%->13% 세대별 차등 및 소득대체율 40%->42%) 시나리오 비교 계산 엔진

export interface NpsReformUserInput {
  birthYear: number;
  currentAge: number;
  monthlyIncomeWon: number; // 기준소득월액 (기본값: 약 3,200,000원, 상한 6,170,000원 / 하한 390,000원)
  existingYears: number; // 기존 가입 기간 (년)
  remainingYears: number; // 향후 납부 예정 기간 (만 59세까지 남은 기간)
  expectedLifeAge: number; // 기대수명 (기본값 85세)
  payoutStartAge: number; // 수령 개시 연령 (기본값 65세)
}

export type GenerationCohort = "50s" | "40s" | "30s" | "20s";

export interface ReformScheduleStep {
  year: number;
  age: number;
  currentRuleRate: number; // 개혁 전 (고정 9.0%)
  reformRuleRate: number; // 개혁안 적용 요율 (9.0% -> 13.0%)
  monthlyPremiumCurrent: number; // 개혁 전 월 보험료 (근로자 4.5% + 회사 4.5% = 총 9%)
  monthlyPremiumReform: number; // 개혁 후 월 보험료
  personalMonthlyPremiumCurrent: number; // 본인 부담 (4.5%)
  personalMonthlyPremiumReform: number; // 본인 부담 (요율의 절반)
  annualExtraPersonalCost: number; // 본인 기준 연간 추가 부담액
}

export interface NpsReformComparisonResult {
  cohort: GenerationCohort;
  cohortLabel: string;
  annualRateIncrement: number; // 연간 인상폭 (%p)
  yearsToReach13: number; // 13% 도달 소요 연수
  full13Year: number; // 13% 도달 연도
  totalRemainingMonths: number;
  
  // 보험료 부담 비교 (총액 및 본인 부담 50% 기준)
  totalPremiumCurrentTotal: number;
  totalPremiumReformTotal: number;
  totalPersonalPremiumCurrent: number;
  totalPersonalPremiumReform: number;
  personalExtraCostTotal: number; // 평생 추가 부담액 (본인 기준)

  // 월 연금 수령액 비교 (현재가치 기준)
  // 개혁 전 (소득대체율 40% 기준)
  monthlyPensionCurrent: number;
  // 개혁 후 (소득대체율 42% 기준)
  monthlyPensionReform: number;
  monthlyPensionIncrease: number; // 월 연금 증액분
  annualPensionIncrease: number; // 연간 연금 증액분

  // 생애 총 수령액 비교 (수령개시 ~ 기대수명)
  payoutYears: number;
  lifetimePensionCurrent: number;
  lifetimePensionReform: number;
  lifetimePensionIncrease: number; // 평생 연금 순증액

  // 실익 지표
  netGainLifetime: number; // 평생 연금 순증액 - 본인 평생 추가 부담액
  recoveryMonths: number; // 손익분기 회수 개월수 (추가부담액 / 월 증액분)
  recoveryYears: number; // 손익분기 회수 연수
  bepAge: number; // 원금 회수(골든크로스) 달성 나이
  costBenefitRatio: number; // 납입 대비 회수 배수 (평생 연금 순증액 / 추가 부담액)

  // 연도별 스케줄
  schedule: ReformScheduleStep[];
}

/**
 * 출생연도에 따른 세대 코호트 판별
 * 50대 (1968~1977년생): 매년 1.0%p 인상 (4년 만에 13% 도달)
 * 40대 (1978~1987년생): 매년 0.75%p 인상 (5.3년 소요)
 * 30대 (1988~1997년생): 매년 0.50%p 인상 (8년 소요)
 * 20대 (1998년 이후): 매년 0.25%p 인상 (16년 소요)
 */
export function getGenerationCohort(birthYear: number): {
  cohort: GenerationCohort;
  cohortLabel: string;
  annualRateIncrement: number;
  yearsToReach13: number;
} {
  if (birthYear <= 1977) {
    return {
      cohort: "50s",
      cohortLabel: "50대 (매년 +1.0%p 빠른 인상)",
      annualRateIncrement: 1.0,
      yearsToReach13: 4,
    };
  } else if (birthYear <= 1987) {
    return {
      cohort: "40s",
      cohortLabel: "40대 (매년 +0.75%p 인상)",
      annualRateIncrement: 0.75,
      yearsToReach13: 5.3,
    };
  } else if (birthYear <= 1997) {
    return {
      cohort: "30s",
      cohortLabel: "30대 (매년 +0.50%p 인상)",
      annualRateIncrement: 0.5,
      yearsToReach13: 8,
    };
  } else {
    return {
      cohort: "20s",
      cohortLabel: "20대 청년층 (매년 +0.25%p 완만한 인상)",
      annualRateIncrement: 0.25,
      yearsToReach13: 16,
    };
  }
}

/**
 * 2026 국민연금 개혁안 비교 시뮬레이션 계산 함수
 */
export function calculateNpsReform2026(input: NpsReformUserInput): NpsReformComparisonResult {
  const currentYear = 2026;
  const { cohort, cohortLabel, annualRateIncrement, yearsToReach13 } = getGenerationCohort(input.birthYear);
  const full13Year = Math.ceil(currentYear + (13 - 9) / annualRateIncrement);

  // 기준소득월액 상한(6,170,000원) 및 하한(390,000원) 클램프
  const income = Math.min(6170000, Math.max(390000, input.monthlyIncomeWon));

  // 가입 기간 한도 (만 59세까지 납부 가능)
  const maxContributeAge = 59;
  const payableYears = Math.max(0, Math.min(input.remainingYears, maxContributeAge - input.currentAge + 1));
  const totalRemainingMonths = payableYears * 12;

  const schedule: ReformScheduleStep[] = [];
  let currentRate = 9.0;
  let totalPersonalCurrent = 0;
  let totalPersonalReform = 0;

  for (let i = 0; i < payableYears; i++) {
    const yr = currentYear + i;
    const age = input.currentAge + i;

    // 요율 인상
    if (yr > 2026) {
      currentRate = Math.min(13.0, currentRate + annualRateIncrement);
    }

    const monthlyCurrent = Math.round(income * 0.09);
    const monthlyReform = Math.round(income * (currentRate / 100));

    const personalMonthlyCurrent = Math.round(monthlyCurrent / 2);
    const personalMonthlyReform = Math.round(monthlyReform / 2);

    const annualExtra = (personalMonthlyReform - personalMonthlyCurrent) * 12;

    totalPersonalCurrent += personalMonthlyCurrent * 12;
    totalPersonalReform += personalMonthlyReform * 12;

    schedule.push({
      year: yr,
      age,
      currentRuleRate: 9.0,
      reformRuleRate: Math.round(currentRate * 100) / 100,
      monthlyPremiumCurrent: monthlyCurrent,
      monthlyPremiumReform: monthlyReform,
      personalMonthlyPremiumCurrent: personalMonthlyCurrent,
      personalMonthlyPremiumReform: personalMonthlyReform,
      annualExtraPersonalCost: annualExtra,
    });
  }

  const personalExtraCostTotal = Math.max(0, totalPersonalReform - totalPersonalCurrent);
  const totalPremiumCurrentTotal = totalPersonalCurrent * 2;
  const totalPremiumReformTotal = totalPersonalReform * 2;

  // 국민연금 급여 계산 공식 (간소화 수리 모델)
  // 기본연금액 = 1.2 * (A + B) * (1 + 0.05 * n / 12)
  // A값: 전체가입자 평균소득월액 (2026년 약 3,200,000원)
  // B값: 본인 가입기간 평균소득월액
  // 소득대체율 40% (개혁 전 2028년 최종 목표치) vs 42% (2026 개혁안 상향치)
  const avgA = 3200000;
  const avgB = income;
  const totalYears = input.existingYears + payableYears;

  // 40년 가입 기준 소득대체율 대비 실 가입연수 비례
  // 월 연금액 = (소득대체율 / 40) * totalYears * (A + B) / 2
  const factorCurrent = (0.40 / 40) * totalYears;
  const factorReform = (0.42 / 40) * totalYears;

  const averageBase = (avgA + avgB) / 2;
  const monthlyPensionCurrent = Math.round(averageBase * factorCurrent);
  const monthlyPensionReform = Math.round(averageBase * factorReform);

  const monthlyPensionIncrease = Math.max(0, monthlyPensionReform - monthlyPensionCurrent);
  const annualPensionIncrease = monthlyPensionIncrease * 12;

  // 생애 총 수령액 (수령 시작연령 ~ 기대수명)
  const payoutYears = Math.max(1, input.expectedLifeAge - input.payoutStartAge);
  const lifetimePensionCurrent = monthlyPensionCurrent * 12 * payoutYears;
  const lifetimePensionReform = monthlyPensionReform * 12 * payoutYears;
  const lifetimePensionIncrease = lifetimePensionReform - lifetimePensionCurrent;

  // 손익분기 분석
  const netGainLifetime = lifetimePensionIncrease - personalExtraCostTotal;
  const recoveryMonths = monthlyPensionIncrease > 0 ? Math.round(personalExtraCostTotal / monthlyPensionIncrease) : 0;
  const recoveryYears = Math.round((recoveryMonths / 12) * 10) / 10;
  const bepAge = Math.round((input.payoutStartAge + recoveryYears) * 10) / 10;
  const costBenefitRatio = personalExtraCostTotal > 0
    ? Math.round((lifetimePensionIncrease / personalExtraCostTotal) * 100) / 100
    : 1.0;

  return {
    cohort,
    cohortLabel,
    annualRateIncrement,
    yearsToReach13,
    full13Year,
    totalRemainingMonths,
    totalPremiumCurrentTotal,
    totalPremiumReformTotal,
    totalPersonalPremiumCurrent: totalPersonalCurrent,
    totalPersonalPremiumReform: totalPersonalReform,
    personalExtraCostTotal,
    monthlyPensionCurrent,
    monthlyPensionReform,
    monthlyPensionIncrease,
    annualPensionIncrease,
    payoutYears,
    lifetimePensionCurrent,
    lifetimePensionReform,
    lifetimePensionIncrease,
    netGainLifetime,
    recoveryMonths,
    recoveryYears,
    bepAge,
    costBenefitRatio,
    schedule,
  };
}
