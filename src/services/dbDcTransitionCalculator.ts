/**
 * 퇴직연금 DB vs DC 전환 및 임금피크제 최적 타이밍 시뮬레이션 엔진
 * 
 * - DB형(확정급여형): 퇴직금 = 퇴직 직전 3개월 평균임금 × 근속연수
 * - DC형(확정기여형): 매년 연봉의 1/12을 근로자 계좌에 적립하여 직접 운용 (운용수익률 반영)
 * - 임금피크제: 특정 나이(예: 57세)부터 매년 일정 비율(10~30%) 임금이 삭감되어 DB형 유지 시 치명적 퇴직금 감소 발생
 */

export interface DbDcSimulationInput {
  currentAge: number; // 현재 나이 (예: 45)
  retirementAge: number; // 최종 퇴직 나이 (예: 60)
  currentYearsOfService: number; // 현재 근속연수 (예: 15)
  currentMonthlyWage: number; // 현재 월 급여/평균임금 (만원, 예: 500)
  annualWageGrowthRate: number; // 연간 임금인상률 (%, 기본 3.0)
  dcExpectedReturnRate: number; // DC 전환 후 예상 운용수익률 (%, 기본 5.0)
  usePeakSystem: boolean; // 임금피크제 적용 여부
  peakStartAge: number; // 임금피크제 시작 나이 (예: 57)
  peakReductionRates: number[]; // 피크 연차별 삭감률 (예: [10, 20, 30]%)
}

export interface YearSimulationRow {
  age: number;
  yearsOfService: number;
  monthlyWage: number; // 해당 연도 월 급여 (만원)
  isPeakApplied: boolean;
  reductionRate: number; // 피크 삭감률 (%)
  
  // 누적 자산 가치
  dbLumpSum: number; // DB형 유지 시 퇴직금 가치 (월급여 * 근속연수)
  dcLumpSumImmediate: number; // 지금 즉시 DC 전환 후 운용 시 누적 잔고
  dcLumpSumAtPeak: number; // 피크 직전 DC 전환 시 누적 잔고
}

export interface DbDcSimulationResult {
  timeline: YearSimulationRow[];
  
  // 최종 퇴직 시점(retirementAge) 비교
  finalDbLumpSum: number; // 전략 1: DB형 만기 유지
  finalDcImmediate: number; // 전략 2: 지금 즉시 DC 전환
  finalDcAtPeak: number; // 전략 3: 임금피크제 직전 DC 전환 (권장 골든타임)
  
  // 전략별 우열 및 격차
  peakLossAmount: number; // 임금피크제로 인해 DB에서 깎여나가는 손실액
  goldenRecommendation: "KEEP_DB_UNTIL_PEAK" | "SWITCH_DC_NOW" | "STAY_DB";
  goldenAdviceHeadline: string;
  goldenAdviceDetails: string[];
  optimalSwitchAge: number; // 최적 전환 나이
  switchGainAmount: number; // 최적 전략 선택 시 DB 고수 대비 추가 이익/방어액
}

export function calculateDbDcTransition(input: DbDcSimulationInput): DbDcSimulationResult {
  const currentAge = Math.max(25, Math.min(65, input.currentAge || 45));
  const retirementAge = Math.max(currentAge + 1, Math.min(70, input.retirementAge || 60));
  const currentYearsOfService = Math.max(1, Math.min(40, input.currentYearsOfService || 10));
  const currentMonthlyWage = Math.max(150, input.currentMonthlyWage || 500);
  const wageGrowth = (input.annualWageGrowthRate ?? 3.0) / 100;
  const dcReturn = (input.dcExpectedReturnRate ?? 5.0) / 100;
  
  const usePeak = input.usePeakSystem ?? true;
  const peakStartAge = input.peakStartAge || 57;
  const peakRates = input.peakReductionRates && input.peakReductionRates.length > 0
    ? input.peakReductionRates
    : [10, 20, 30, 30]; // 기본 1년차 -10%, 2년차 -20%, 3년차+ -30%

  const timeline: YearSimulationRow[] = [];
  
  // 1. 초기 자산 세팅
  // 현재 시점 DB 평가액 = 현재 월급 * 근속연수
  const initialDbValue = currentMonthlyWage * currentYearsOfService;
  
  let dcBalanceNow = initialDbValue; // 지금 즉시 DC 전환 계좌
  let dcBalancePeak = 0; // 피크 직전 전환 계좌
  let hasSwitchedAtPeak = false;

  let currentWage = currentMonthlyWage;

  for (let age = currentAge; age <= retirementAge; age++) {
    const years = currentYearsOfService + (age - currentAge);
    const isPeak = usePeak && age >= peakStartAge;
    let reductionRate = 0;

    if (age > currentAge) {
      if (isPeak) {
        const peakYearIndex = Math.min(peakRates.length - 1, age - peakStartAge);
        reductionRate = peakRates[peakYearIndex] || 0;
        // 피크제 적용 시 피크 직전 기본급에서 삭감율 적용
        const prePeakWage = currentMonthlyWage * Math.pow(1 + wageGrowth, Math.max(0, peakStartAge - currentAge));
        currentWage = Math.round(prePeakWage * (1 - reductionRate / 100));
      } else {
        currentWage = Math.round(currentWage * (1 + wageGrowth));
      }
    }

    // DB 퇴직금 = 해당 연도 월급 * 근속연수
    const dbLumpSum = Math.round(currentWage * years);

    // 지금 즉시 DC 전환 시: 연 복리 + 당해 연도 부담금(월급 1개월분)
    if (age > currentAge) {
      dcBalanceNow = Math.round(dcBalanceNow * (1 + dcReturn) + currentWage);
    }

    // 피크 직전 전환 시:
    if (usePeak && age >= peakStartAge) {
      if (!hasSwitchedAtPeak) {
        // 피크 직전 해(peakStartAge - 1) 또는 당해 연도 시작 시점의 DB 퇴직금을 DC로 이체
        // 피크 직전 해 월급 * 피크 직전 근속연수
        const prevYears = years - 1;
        const prePeakWage = currentMonthlyWage * Math.pow(1 + wageGrowth, Math.max(0, peakStartAge - 1 - currentAge));
        dcBalancePeak = Math.round(prePeakWage * prevYears);
        hasSwitchedAtPeak = true;
      }
      // 피크 이후 DC 운용수익 + 삭감된 당해 연도 부담금
      dcBalancePeak = Math.round(dcBalancePeak * (1 + dcReturn) + currentWage);
    } else {
      dcBalancePeak = dbLumpSum; // 피크 전까지는 DB 유지 상태
    }

    timeline.push({
      age,
      yearsOfService: years,
      monthlyWage: currentWage,
      isPeakApplied: isPeak,
      reductionRate,
      dbLumpSum,
      dcLumpSumImmediate: dcBalanceNow,
      dcLumpSumAtPeak: dcBalancePeak,
    });
  }

  const lastRow = timeline[timeline.length - 1];
  const finalDbLumpSum = lastRow.dbLumpSum;
  const finalDcImmediate = lastRow.dcLumpSumImmediate;
  const finalDcAtPeak = lastRow.dcLumpSumAtPeak;

  // 임금피크제가 없었을 때의 가상 DB 퇴직금
  const noPeakFinalWage = currentMonthlyWage * Math.pow(1 + wageGrowth, retirementAge - currentAge);
  const hypotheticalDbWithoutPeak = Math.round(noPeakFinalWage * (currentYearsOfService + (retirementAge - currentAge)));
  const peakLossAmount = Math.max(0, hypotheticalDbWithoutPeak - finalDbLumpSum);

  // 최적 전략 판정
  let goldenRecommendation: "KEEP_DB_UNTIL_PEAK" | "SWITCH_DC_NOW" | "STAY_DB" = "KEEP_DB_UNTIL_PEAK";
  let optimalSwitchAge = peakStartAge - 1;
  let switchGainAmount = 0;

  if (usePeak) {
    if (finalDcImmediate > finalDcAtPeak && finalDcImmediate > finalDbLumpSum) {
      goldenRecommendation = "SWITCH_DC_NOW";
      optimalSwitchAge = currentAge;
      switchGainAmount = finalDcImmediate - finalDbLumpSum;
    } else {
      goldenRecommendation = "KEEP_DB_UNTIL_PEAK";
      optimalSwitchAge = Math.max(currentAge, peakStartAge - 1);
      switchGainAmount = Math.max(finalDcAtPeak, finalDcImmediate) - finalDbLumpSum;
    }
  } else {
    if (finalDcImmediate > finalDbLumpSum) {
      goldenRecommendation = "SWITCH_DC_NOW";
      optimalSwitchAge = currentAge;
      switchGainAmount = finalDcImmediate - finalDbLumpSum;
    } else {
      goldenRecommendation = "STAY_DB";
      optimalSwitchAge = retirementAge;
      switchGainAmount = 0;
    }
  }

  // 조언 헤드라인 및 세부 조언
  let goldenAdviceHeadline = "";
  const goldenAdviceDetails: string[] = [];

  if (goldenRecommendation === "KEEP_DB_UNTIL_PEAK") {
    goldenAdviceHeadline = `만 ${optimalSwitchAge}세(임금피크 직전)에 DC형으로 전환하여 약 ${Math.round(switchGainAmount).toLocaleString()}만원의 퇴직금 삭감을 방어하세요!`;
    goldenAdviceDetails.push(
      `현재는 임금인상률(${input.annualWageGrowthRate}%)을 누리며 DB형을 유지하는 것이 유리합니다.`,
      `만 ${peakStartAge}세 임금피크제가 적용되면 직전 3개월 평균임금이 깎이면서 과거 ${currentYearsOfService}년 넘게 쌓아온 퇴직금 전체가 동반 삭감(약 -${Math.round(peakLossAmount).toLocaleString()}만원 피해)됩니다.`,
      `따라서 만 ${optimalSwitchAge}세 말에 최고 임금 기준의 퇴직금을 DC 계좌로 이전하고, 퇴직 시까지 연 ${input.dcExpectedReturnRate}% 안정적 채권/배당 ETF로 굴리는 것이 최선입니다.`
    );
  } else if (goldenRecommendation === "SWITCH_DC_NOW") {
    goldenAdviceHeadline = `지금 즉시 DC형으로 전환하여 직접 운용하는 것이 DB 유지 대비 약 ${Math.round(switchGainAmount).toLocaleString()}만원 더 유리합니다!`;
    goldenAdviceDetails.push(
      `기대 운용수익률(${input.dcExpectedReturnRate}%)이 회사의 연간 임금인상률(${input.annualWageGrowthRate}%)보다 높아 복리 효과가 훨씬 큽니다.`,
      `퇴직 시점까지 남은 기간 동안 미국배당다우존스, 타깃데이트펀드(TDF), 우량 채권형 ETF 등으로 자산을 불려 나가세요.`,
      `임금피크제 진입 여부와 무관하게 조기 복리 투자가 우세한 시나리오입니다.`
    );
  } else {
    goldenAdviceHeadline = `은퇴 시까지 DB형(확정급여형)을 그대로 유지하는 것이 가장 안전하고 유리합니다.`;
    goldenAdviceDetails.push(
      `회사의 임금인상률(${input.annualWageGrowthRate}%)이 예상 운용수익률(${input.dcExpectedReturnRate}%)을 상회하므로 회사가 원리금을 보장하는 DB형이 최선입니다.`,
      `임금피크제가 없거나 삭감 폭이 크지 않아 안정성이 최우선입니다.`
    );
  }

  return {
    timeline,
    finalDbLumpSum,
    finalDcImmediate,
    finalDcAtPeak,
    peakLossAmount,
    goldenRecommendation,
    goldenAdviceHeadline,
    goldenAdviceDetails,
    optimalSwitchAge,
    switchGainAmount: Math.max(0, Math.round(switchGainAmount)),
  };
}
