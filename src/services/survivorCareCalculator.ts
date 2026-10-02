/**
 * 부부 기대수명 차이에 따른 '홀로 남은 배우자(1인 가구)' 생애 케어 계산 엔진
 * 국민연금법 제56조(중복급여 조정), 주택연금 배우자 종신 승계,
 * 1인 가구 생활비 감소 계수(70%) 및 초고령기 간병비 버퍼 시뮬레이션
 */

export interface SurvivorCareInput {
  selfCurrentAge: number;
  spouseCurrentAge: number;
  selfDeathAge: number; // 본인 기대수명 (예: 83세)
  spouseDeathAge: number; // 배우자 기대수명 (예: 89세)
  coupleMonthlySpendingWon: number; // 부부 동시 생존 시 월 생활비 (원)
  singleExpenseRatio?: number; // 1인 가구 생활비 감소율 (기본 0.7 = 70%)
  selfMonthlyPensionWon: number; // 본인 국민연금 월액 (원)
  spouseMonthlyPensionWon: number; // 배우자 국민연금 월액 (원)
  selfNpsPeriodYears?: number; // 본인 가입기간 (기본 20년)
  spouseNpsPeriodYears?: number; // 배우자 가입기간 (기본 15년)
  hasReverseMortgage?: boolean; // 주택연금 보유 여부
  reverseMortgageMonthlyWon?: number; // 주택연금 월 수령액 (원)
  remainingPrivateAssetsWon?: number; // 사적연금 및 금융자산 잔액 (원)
  monthlyCareExpenseWon?: number; // 만 85세 이후 월 간병비 (원, 기본 100만원)
}

export interface SurvivorCareResult {
  firstDeceased: "SELF" | "SPOUSE";
  survivor: "SELF" | "SPOUSE";
  survivorStartAge: number; // 배우자가 홀로 남는 시작 나이
  survivorEndAge: number; // 생존 배우자의 기대수명
  aloneYears: number; // 홀로 생존 기간 (년)
  aloneTargetMonthlyWon: number; // 1인 가구 월 목표 생활비 (기본 70%)
  
  // 국민연금 유족연금 중복급여 조정 (제56조)
  survivorNpsRate: number; // 유족연금 지급률 (20년 이상 60%, 10~20년 50%, 10년 미만 40%)
  pureSurvivorPensionWon: number; // 사망자의 유족연금 전액 (100%)
  survivorOptionA_Won: number; // [옵션 A] 본인 노령연금 + 유족연금의 30%
  survivorOptionB_Won: number; // [옵션 B] 유족연금의 100%
  chosenOption: "OPTION_A" | "OPTION_B";
  chosenOptionLabel: string;
  finalMonthlyNpsWon: number; // 최종 결정된 국민연금 월액

  // 주택연금 승계
  reverseMortgageMonthlyWon: number; // 배우자 승계 월지급금 (100% 유지)

  // 월간 총 수입 및 수지
  monthlyTotalInflowWon: number; // 국민연금 + 주택연금 + 사적연금 안분
  monthlyNetBalanceWon: number; // 월 생활비 대비 잉여(+) 또는 부족(-)
  monthlyCareExpenseWon: number; // 85세 이후 월 간병비
  carePhaseYears: number; // 85세 이상 초고령 간병기 햇수

  // 총액 밸런스
  totalAloneRequiredWon: number;
  totalAloneProcuredWon: number;
  aloneShortfallWon: number; // 부족액 (0이면 안전)
  coverageRatio: number; // (%)

  safetyStatus: "SAFE" | "CAUTION" | "DANGER";
  safetyStatusLabel: string;
  recommendations: string[];
}

export function calculateSurvivorCare(input: SurvivorCareInput): SurvivorCareResult {
  const {
    selfCurrentAge,
    spouseCurrentAge,
    selfDeathAge,
    spouseDeathAge,
    coupleMonthlySpendingWon,
    singleExpenseRatio = 0.7,
    selfMonthlyPensionWon,
    spouseMonthlyPensionWon,
    selfNpsPeriodYears = 20,
    spouseNpsPeriodYears = 15,
    hasReverseMortgage = false,
    reverseMortgageMonthlyWon = 0,
    remainingPrivateAssetsWon = 0,
    monthlyCareExpenseWon = 1000000,
  } = input;

  // 본인과 배우자의 사망 연도 추정
  const currentYear = new Date().getFullYear();
  const selfDeathYear = currentYear + Math.max(0, selfDeathAge - selfCurrentAge);
  const spouseDeathYear = currentYear + Math.max(0, spouseDeathAge - spouseCurrentAge);

  let firstDeceased: "SELF" | "SPOUSE" = "SELF";
  let survivor: "SELF" | "SPOUSE" = "SPOUSE";
  let survivorStartAge = spouseCurrentAge + (selfDeathYear - currentYear);
  let survivorEndAge = spouseDeathAge;

  if (selfDeathYear > spouseDeathYear) {
    firstDeceased = "SPOUSE";
    survivor = "SELF";
    survivorStartAge = selfCurrentAge + (spouseDeathYear - currentYear);
    survivorEndAge = selfDeathAge;
  }

  const aloneYears = Math.max(0, survivorEndAge - survivorStartAge);
  const aloneMonths = aloneYears * 12;

  // 1인 가구 생활비 (기본 70%)
  const aloneTargetMonthlyWon = Math.round(coupleMonthlySpendingWon * singleExpenseRatio);

  // 국민연금 유족연금 계산
  // 사망자의 가입기간에 따른 지급률: 20년 이상 60%, 10~20년 50%, 10년 미만 40%
  const deceasedPeriod = firstDeceased === "SELF" ? selfNpsPeriodYears : spouseNpsPeriodYears;
  const deceasedBasePension = firstDeceased === "SELF" ? selfMonthlyPensionWon : spouseMonthlyPensionWon;
  const survivorOwnPension = survivor === "SELF" ? selfMonthlyPensionWon : spouseMonthlyPensionWon;

  let survivorNpsRate = 0.6;
  if (deceasedPeriod < 10) survivorNpsRate = 0.4;
  else if (deceasedPeriod < 20) survivorNpsRate = 0.5;

  const pureSurvivorPensionWon = Math.round(deceasedBasePension * survivorNpsRate);

  // 제56조 중복급여 조정:
  // 옵션 A: 본인 노령연금 + 유족연금 30%
  // 옵션 B: 유족연금 100%
  const survivorOptionA_Won = Math.round(survivorOwnPension + pureSurvivorPensionWon * 0.3);
  const survivorOptionB_Won = pureSurvivorPensionWon;

  let chosenOption: "OPTION_A" | "OPTION_B" = "OPTION_A";
  let chosenOptionLabel = "본인 노령연금 + 유족연금 30%";
  let finalMonthlyNpsWon = survivorOptionA_Won;

  if (survivorOptionB_Won > survivorOptionA_Won) {
    chosenOption = "OPTION_B";
    chosenOptionLabel = "유족연금 100% 선택 (본인연금 포기)";
    finalMonthlyNpsWon = survivorOptionB_Won;
  }

  // 주택연금 승계 (배우자가 100% 종신 수령)
  const rmMonthlyWon = hasReverseMortgage ? reverseMortgageMonthlyWon : 0;

  // 사적자산 홀로 생존 기간 월 안분
  const privateAssetMonthlyWon = aloneMonths > 0 ? Math.round(remainingPrivateAssetsWon / aloneMonths) : 0;

  // 기본 월 총 유입액
  const monthlyTotalInflowWon = finalMonthlyNpsWon + rmMonthlyWon + privateAssetMonthlyWon;

  // 85세 이후 간병기 햇수
  const carePhaseYears = Math.max(0, survivorEndAge - Math.max(85, survivorStartAge));
  const carePhaseMonths = carePhaseYears * 12;

  // 총 필요 생활비 (기본생활비 + 85세 이후 간병비)
  const totalBaseRequiredWon = aloneTargetMonthlyWon * aloneMonths;
  const totalCareRequiredWon = monthlyCareExpenseWon * carePhaseMonths;
  const totalAloneRequiredWon = totalBaseRequiredWon + totalCareRequiredWon;

  // 총 조달액
  const totalAloneProcuredWon = monthlyTotalInflowWon * aloneMonths;
  const aloneShortfallWon = Math.max(0, totalAloneRequiredWon - totalAloneProcuredWon);
  const coverageRatio =
    totalAloneRequiredWon > 0
      ? Math.min(100, Math.round((totalAloneProcuredWon / totalAloneRequiredWon) * 100))
      : 100;

  const monthlyNetBalanceWon = monthlyTotalInflowWon - aloneTargetMonthlyWon;

  let safetyStatus: "SAFE" | "CAUTION" | "DANGER" = "SAFE";
  let safetyStatusLabel = "안전 (생활비 충족)";

  if (coverageRatio < 70) {
    safetyStatus = "DANGER";
    safetyStatusLabel = "위험 (초고령 결손 심각)";
  } else if (coverageRatio < 95) {
    safetyStatus = "CAUTION";
    safetyStatusLabel = "주의 (간병비 대비 필요)";
  }

  // 전문가 추천 조언
  const recommendations: string[] = [];

  recommendations.push(
    `배우자 사망 시 국민연금법 제56조에 따라 [${chosenOptionLabel}]을 적용받아 매월 ${(finalMonthlyNpsWon / 10000).toFixed(0)}만원을 평생 수급하게 됩니다.`
  );

  if (hasReverseMortgage) {
    recommendations.push(
      "주택연금은 주가입자가 사망하더라도 배우자가 채무인수를 완료하면 기존 월지급금(월 " +
        (reverseMortgageMonthlyWon / 10000).toFixed(0) +
        "만원)이 100% 감액 없이 평생 유지되므로 홀로 남은 노후의 든든한 버팀목이 됩니다."
    );
  } else {
    recommendations.push(
      "주택을 소유 중이라면 배우자 1인 홀로 생존 기간의 생활비 및 간병비 방어를 위해 'HF 주택연금(역모기지)'을 결합하여 종신 소득을 확보하는 것이 매우 유리합니다."
    );
  }

  if (carePhaseYears > 0) {
    recommendations.push(
      `만 85세부터 ${survivorEndAge}세까지 약 ${carePhaseYears}년간 월 100만원 수준의 간병비(총 ${(totalCareRequiredWon / 100000000).toFixed(1)}억원)가 추가 발생하므로 비상 의료비 파킹통장을 사전에 분리 적립해 두어야 합니다.`
    );
  }

  if (monthlyNetBalanceWon < 0) {
    recommendations.push(
      `홀로 생존 기간 월 약 ${Math.abs(Math.round(monthlyNetBalanceWon / 10000))}만원의 생활비 부족이 예상되므로, 은퇴 전 사적연금(IRP/연금저축)의 종신연금형 선택 또는 상속세·재산세 감면 대책을 점검하세요.`
    );
  }

  return {
    firstDeceased,
    survivor,
    survivorStartAge,
    survivorEndAge,
    aloneYears,
    aloneTargetMonthlyWon,
    survivorNpsRate,
    pureSurvivorPensionWon,
    survivorOptionA_Won,
    survivorOptionB_Won,
    chosenOption,
    chosenOptionLabel,
    finalMonthlyNpsWon,
    reverseMortgageMonthlyWon: rmMonthlyWon,
    monthlyTotalInflowWon,
    monthlyNetBalanceWon,
    monthlyCareExpenseWon,
    carePhaseYears,
    totalAloneRequiredWon,
    totalAloneProcuredWon,
    aloneShortfallWon,
    coverageRatio,
    safetyStatus,
    safetyStatusLabel,
    recommendations,
  };
}
