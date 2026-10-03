/**
 * 은퇴 소득 공백기(소득 크레바스, Income Bridge) 계산 엔진
 * 주직장 퇴직(55~60세)부터 국민연금 법정 개시(63~65세) 사이의
 * 소득 절벽 구간을 메우기 위한 4대 브릿지 자금 플래닝 엔진
 */

export interface IncomeBridgeInput {
  retirementAge: number; // 은퇴 나이 (예: 58세)
  npsStartAge: number; // 국민연금 법정 개시 나이 (예: 64세)
  targetMonthlyExpenseWon: number; // 공백기 월 목표 생활비 (기본 300만원)
  severancePayWon: number; // 퇴직금/퇴직연금 평가액
  personalPensionWon: number; // 개인연금저축/IRP 평가액
  currentSavingsWon?: number; // 일반 금융자산/예적금
  includeUnemploymentBenefit?: boolean; // 실업급여(구직급여) 반영 여부 (기본 true)
  unemploymentMonths?: number; // 실업급여 수급 개월수 (50세 이상 10년 이상 기준 최대 9개월, 270일)
  includeReverseMortgage?: boolean; // 주택연금 조기 브릿지 활용 여부 (만 55세 이상)
  reverseMortgageMonthlyWon?: number; // 주택연금 월 수령액
  includeVoluntaryHealthInsurance?: boolean; // 건보료 임의계속가입(36개월) 절감 반영 여부
  monthlyHealthInsuranceSavingsWon?: number; // 임의계속가입 월 절감액
}

export interface IncomeBridgeYearDetail {
  yearIndex: number; // 공백기 N년차 (1부터 시작)
  age: number; // 해당 연도 나이
  annualTargetWon: number; // 연간 필요 생활비
  unemploymentWon: number; // 실업급여 수령액
  severanceWithdrawalWon: number; // 퇴직연금 인출액
  personalPensionWithdrawalWon: number; // 개인연금 인출액
  savingsWithdrawalWon: number; // 예적금 인출액
  reverseMortgageWon: number; // 주택연금 수령액
  healthInsuranceSavingsWon: number; // 건보료 절감 효과 (가처분소득 증가)
  totalIncomeWon: number; // 총 조달 자금
  netSurplusWon: number; // 잉여(+) 또는 부족(-)
  monthlyAverageIncomeWon: number; // 실질 월평균 조달액
}

export interface IncomeBridgeResult {
  gapYears: number; // 공백 기간 (연)
  gapMonths: number; // 공백 기간 (개월)
  totalRequiredFundsWon: number; // 공백기 총 필요 자금
  totalProcuredFundsWon: number; // 조달 가능한 총 자금
  shortfallWon: number; // 최종 부족 자금 (0 이상이면 부족, 0이면 충족)
  coverageRatio: number; // 준비율 (%)
  safetyGrade: "SAFE" | "CAUTION" | "DANGER";
  safetyGradeLabel: string;
  safetySummary: string;
  unemploymentTotalWon: number; // 실업급여 총 수령액
  healthSavingsTotalWon: number; // 임의계속가입 총 절감액
  reverseMortgageTotalWon: number; // 주택연금 총액
  privatePensionAnnualAvailableWon: number; // 사적연금 연간 적정 인출 배분액
  yearlyDetails: IncomeBridgeYearDetail[];
  cfRecommendations: string[];
}

// 고용보험법 구직급여 일액 상한선: 2026.1.1 이후 이직자 1일 68,100원 (월 30일 기준 2,043,000원). 매년 상한 고시를 확인해 갱신
export const UNEMPLOYMENT_MONTHLY_MAX_WON = 2043000;

export function calculateIncomeBridge(input: IncomeBridgeInput): IncomeBridgeResult {
  const {
    retirementAge,
    npsStartAge,
    targetMonthlyExpenseWon,
    severancePayWon,
    personalPensionWon,
    currentSavingsWon = 0,
    includeUnemploymentBenefit = true,
    unemploymentMonths = 9,
    includeReverseMortgage = false,
    reverseMortgageMonthlyWon = 0,
    includeVoluntaryHealthInsurance = true,
    monthlyHealthInsuranceSavingsWon = 150000,
  } = input;

  const gapYears = Math.max(0, npsStartAge - retirementAge);
  const gapMonths = gapYears * 12;

  // 공백이 없는 경우
  if (gapYears <= 0) {
    return {
      gapYears: 0,
      gapMonths: 0,
      totalRequiredFundsWon: 0,
      totalProcuredFundsWon: 0,
      shortfallWon: 0,
      coverageRatio: 100,
      safetyGrade: "SAFE",
      safetyGradeLabel: "소득 공백 없음",
      safetySummary: "퇴직 시점과 국민연금 수령 개시 시점이 일치하여 소득 공백기가 발생하지 않습니다.",
      unemploymentTotalWon: 0,
      healthSavingsTotalWon: 0,
      reverseMortgageTotalWon: 0,
      privatePensionAnnualAvailableWon: 0,
      yearlyDetails: [],
      cfRecommendations: [
        "소득 공백이 없으므로 퇴직 즉시 국민연금과 사적연금의 수령 균형을 맞추는 데 집중하세요.",
      ],
    };
  }

  const totalRequiredFundsWon = targetMonthlyExpenseWon * gapMonths;

  // 1. 실업급여 총액 (은퇴 1년차에 집중 지급, 최대 지급월수 반영)
  const actualUnempMonths = includeUnemploymentBenefit ? Math.min(unemploymentMonths, 9) : 0;
  const unemploymentTotalWon = actualUnempMonths * UNEMPLOYMENT_MONTHLY_MAX_WON;

  // 2. 건보료 임의계속가입(36개월 = 최대 3년) 총 절감액
  const healthMonths = includeVoluntaryHealthInsurance ? Math.min(gapMonths, 36) : 0;
  const healthSavingsTotalWon = healthMonths * monthlyHealthInsuranceSavingsWon;

  // 3. 주택연금 공백기 총액
  const reverseMortgageTotalWon = includeReverseMortgage
    ? reverseMortgageMonthlyWon * gapMonths
    : 0;

  // 4. 사적연금(퇴직연금 + 개인연금) 및 일반 예적금 총 자산
  const totalPrivateLiquidWon = severancePayWon + personalPensionWon + currentSavingsWon;

  // 사적자산의 공백기 균등 연간 가용액 (소득공백기 동안 분할 인출)
  const privatePensionAnnualAvailableWon = Math.round(totalPrivateLiquidWon / gapYears);

  // 연도별 시뮬레이션
  let remainingSeverance = severancePayWon;
  let remainingPersonal = personalPensionWon;
  let remainingSavings = currentSavingsWon;

  const yearlyDetails: IncomeBridgeYearDetail[] = [];
  let totalProcuredFundsWon = 0;

  for (let y = 1; y <= gapYears; y++) {
    const age = retirementAge + y - 1;
    const annualTargetWon = targetMonthlyExpenseWon * 12;

    // 실업급여는 은퇴 1년차에 전액 수령
    const yearUnempWon = y === 1 ? unemploymentTotalWon : 0;

    // 건보료 임의계속가입은 1~3년차까지만 적용 (최대 36개월)
    const yearHealthSavingsWon =
      includeVoluntaryHealthInsurance && y <= 3
        ? monthlyHealthInsuranceSavingsWon * 12
        : 0;

    // 주택연금 연간 수령액
    const yearReverseMortgageWon = includeReverseMortgage
      ? reverseMortgageMonthlyWon * 12
      : 0;

    // 비근로성 수비 소득 합산
    const passiveInflow = yearUnempWon + yearHealthSavingsWon + yearReverseMortgageWon;
    const neededFromAssets = Math.max(0, annualTargetWon - passiveInflow);

    // 사적연금 인출 (퇴직연금 우선, 다음 개인연금, 마지막 예적금)
    let sevWithdraw = 0;
    let persWithdraw = 0;
    let savWithdraw = 0;

    if (remainingSeverance >= neededFromAssets) {
      sevWithdraw = neededFromAssets;
      remainingSeverance -= neededFromAssets;
    } else {
      sevWithdraw = remainingSeverance;
      const need2 = neededFromAssets - remainingSeverance;
      remainingSeverance = 0;

      if (remainingPersonal >= need2) {
        persWithdraw = need2;
        remainingPersonal -= need2;
      } else {
        persWithdraw = remainingPersonal;
        const need3 = need2 - remainingPersonal;
        remainingPersonal = 0;

        if (remainingSavings >= need3) {
          savWithdraw = need3;
          remainingSavings -= need3;
        } else {
          savWithdraw = remainingSavings;
          remainingSavings = 0;
        }
      }
    }

    const totalIncomeWon =
      yearUnempWon +
      yearHealthSavingsWon +
      yearReverseMortgageWon +
      sevWithdraw +
      persWithdraw +
      savWithdraw;

    const netSurplusWon = totalIncomeWon - annualTargetWon;
    totalProcuredFundsWon += totalIncomeWon;

    yearlyDetails.push({
      yearIndex: y,
      age,
      annualTargetWon,
      unemploymentWon: yearUnempWon,
      severanceWithdrawalWon: Math.round(sevWithdraw),
      personalPensionWithdrawalWon: Math.round(persWithdraw),
      savingsWithdrawalWon: Math.round(savWithdraw),
      reverseMortgageWon: yearReverseMortgageWon,
      healthInsuranceSavingsWon: yearHealthSavingsWon,
      totalIncomeWon: Math.round(totalIncomeWon),
      netSurplusWon: Math.round(netSurplusWon),
      monthlyAverageIncomeWon: Math.round(totalIncomeWon / 12),
    });
  }

  const shortfallWon = Math.max(0, totalRequiredFundsWon - totalProcuredFundsWon);
  const coverageRatio =
    totalRequiredFundsWon > 0
      ? Math.min(100, Math.round((totalProcuredFundsWon / totalRequiredFundsWon) * 100))
      : 100;

  let safetyGrade: "SAFE" | "CAUTION" | "DANGER" = "SAFE";
  let safetyGradeLabel = "안전 (자금 충족)";
  let safetySummary = "공백기 동안 필요한 생활비를 실업급여, 사적연금, 건보료 절감으로 100% 방어할 수 있습니다.";

  if (coverageRatio < 70) {
    safetyGrade = "DANGER";
    safetyGradeLabel = "위험 (생활비 결손 심각)";
    safetySummary = `공백기 필요 생활비 대비 ${coverageRatio}%만 조달 가능하여 약 ${(shortfallWon / 10000).toLocaleString()}만원의 자금 적자가 예상됩니다.`;
  } else if (coverageRatio < 95) {
    safetyGrade = "CAUTION";
    safetyGradeLabel = "주의 (추가 조달 필요)";
    safetySummary = `공백기 필요 생활비 대비 ${coverageRatio}%가 준비되어 일부 생활비 축소 또는 주택연금 등 대체 수단이 필요합니다.`;
  }

  // CFP 전문가 추천 가이드 구성
  const cfRecommendations: string[] = [];

  if (includeUnemploymentBenefit && gapYears >= 1) {
    cfRecommendations.push(
      "퇴직 직후 즉시 워크넷 구직등록 및 고용센터 방문을 통해 구직급여(최대 9개월, 월 최대 약 204만원)를 수급하여 은퇴 1년차 현금흐름 충격을 최소화하세요."
    );
  }

  if (includeVoluntaryHealthInsurance && gapYears >= 1) {
    cfRecommendations.push(
      "퇴직 후 최초 지역건보료 고지서를 받은 날로부터 2개월 이내에 건강보험공단에 '임의계속가입(36개월)'을 신청하여 매월 15~20만원의 건강보험료 지출을 방어하세요."
    );
  }

  if (shortfallWon > 0 && !includeReverseMortgage && retirementAge >= 55) {
    cfRecommendations.push(
      "사적연금만으로 부족한 소득 크레바스 구간(연간 수백만원 적자)은 만 55세부터 가입 가능한 'HF 주택연금'을 조기 개시하여 안정적인 브릿지 현금흐름을 확보하는 방안을 적극 검토하세요."
    );
  } else if (shortfallWon > 0) {
    cfRecommendations.push(
      "소득 공백기 동안 월 목표 생활비를 10~20% 일시 축소하거나, 파트타임/시간제 근로를 병행하여 국민연금 개시 전까지 사적연금 원금의 급격한 소진을 방어해야 합니다."
    );
  } else {
    cfRecommendations.push(
      "사적연금(퇴직/개인연금) 인출 시 연간 1,500만원(월 125만원) 이하로 안분 인출하면 3.3~5.5% 저율 분리과세 혜택을 온전히 누리며 세금 누수를 막을 수 있습니다."
    );
  }

  return {
    gapYears,
    gapMonths,
    totalRequiredFundsWon,
    totalProcuredFundsWon,
    shortfallWon,
    coverageRatio,
    safetyGrade,
    safetyGradeLabel,
    safetySummary,
    unemploymentTotalWon,
    healthSavingsTotalWon,
    reverseMortgageTotalWon,
    privatePensionAnnualAvailableWon,
    yearlyDetails,
    cfRecommendations,
  };
}
