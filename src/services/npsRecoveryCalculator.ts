// 국민연금 추납(추후납부) 및 반납(반환일시금) 실익 역산과 부부 합산 시너지 분석 계산 엔진
/**
 * 2026년 국민연금 개정 기준소득월액 및 연도별 소득대체율 적용
 */

export interface RecoveryOptionInput {
  currentAge: number;
  npsStartAge: number; // 63~65세
  lifeExpectancy: number; // 85~95세
  currentMonthlyPension: number; // 현재 예상 월 연금액 (원)
  baseIncomeWon: number; // 추납 기준소득월액 (기본값: 2026년 중위/평균 약 300만원)
  additionalMonths: number; // 추납 희망 개월수 (1~119개월)

  // 반납 옵션
  hasReturnRefund: boolean; // 과거 반환일시금 수령 이력 여부
  refundYearPeriod: "PRE_1998" | "1999_2007" | "POST_2008"; // 수령 시기별 소득대체율 (70% / 60% / 50~40%)
  refundPrincipalWon: number; // 과거 수령했던 반환일시금 원금 (원)
  refundYearsPassed: number; // 수령 후 경과 년수 (이자 가산용)
  restoredMonths?: number; // 반납 시 복원 개월수 (기본값: 원금 기반 추정)
  paymentMode?: "LUMP" | "INSTALLMENT";
  installments?: number;
}

export interface PaybackMilestones {
  halfPaybackAge: number; // 원금 50% 반액 회수 나이
  breakEvenAge: number; // 원금 100% 회수 나이 (골든크로스)
  doubleReturnAge: number; // 원금 200% 달성 나이 (순이익 = 납부원금)
  tripleReturnAge: number; // 원금 300% 달성 나이 (순이익 = 납부원금 × 2)
  monthlyPensionWonAfterRecovery: number; // 회수/증액 후 총 월 수령액
}

export interface AgeDistributionItem {
  targetAge: number;
  cumulativeReceivedWon: number; // 누적 총 수령액 (원)
  netProfitWon: number; // 원금 차감 후 순이익 (원)
  recoveryRatioPercent: number; // 원금 대비 회수율 (수령액 / 납부원금 × 100)
  label: string;
}

export interface RecoveryAnalysisResult {
  // 추납 결과
  additionalPayment: {
    months: number;
    monthlyPremiumWon: number; // 매월 보험료 (기준소득 × 9%)
    totalCostWon: number; // 일시납 총비용
    monthlyIncreaseWon: number; // 개시 후 매월 연금 증가액
    annualIncreaseWon: number; // 연간 증가액
    breakEvenYears: number; // 원금 회수 소요 기간 (년)
    breakEvenAge: number; // 골든크로스 나이
    totalLifetimeGainWon: number; // 기대수명까지 총 추가 수령액
    netProfitWon: number; // 순수익 (총 수령액 - 납부원금)
    roiPercent: number; // 수익률 (%)
    annualEquivalentReturn: number; // 연 복리 환산 수익률 (IRR 추정치, %)
  };

  // 반납 결과 (해당 시)
  returnRepayment?: {
    restoredMonths: number;
    applicableReplacementRate: number; // 복원되는 소득대체율 (%)
    totalCostWon: number; // 원금 + 정기예금 이자 가산 총비용
    monthlyIncreaseWon: number; // 개시 후 매월 연금 증가액
    annualIncreaseWon: number; // 연간 증가액
    breakEvenYears: number; // 원금 회수 소요 기간 (년)
    breakEvenAge: number; // 골든크로스 나이
    totalLifetimeGainWon: number; // 기대수명까지 총 추가 수령액
    netProfitWon: number; // 순수익
    roiPercent: number; // 수익률 (%)
    annualEquivalentReturn: number;
  };

  // 결합 시나리오 (추납 + 반납 동시 진행 시)
  combinedScenario?: {
    totalCostWon: number;
    monthlyIncreaseWon: number;
    annualIncreaseWon: number;
    breakEvenYears: number;
    breakEvenAge: number;
    totalLifetimeGainWon: number;
    netProfitWon: number;
    roiPercent: number;
    annualEquivalentReturn: number;
  };

  // 원금 회수 마일스톤 (추납 또는 결합 기준)
  paybackMilestones: PaybackMilestones;

  // 기대수명 구간별 수령액 및 회수율 분포
  distributionByAge: AgeDistributionItem[];

  // 나이대별(개시 나이 ~ 기대수명) 누적 수령액 차트 데이터
  chartData: {
    age: number;
    withoutRecovery: number; // 미진행 시 누적액 (만원)
    withAdditionalPayment: number; // 추납 진행 시 순누적액 (만원, 납부비용 차감)
    withReturnRepayment?: number; // 반납 진행 시 순누적액 (만원, 납부비용 차감)
    withCombined?: number; // 결합 진행 시 순누적액 (만원, 납부비용 차감)
  }[];

  recommendation: {
    primaryAdvice: string;
    actionChecklist: string[];
  };
}

export interface CoupleRecoveryResult {
  self: RecoveryAnalysisResult;
  spouse: RecoveryAnalysisResult;
  couple: {
    totalCostWon: number;
    monthlyIncreaseWon: number;
    annualIncreaseWon: number;
    breakEvenYearsAvg: number;
    totalLifetimeGainWon: number;
    netProfitWon: number;
    roiPercent: number;
    combinedMonthlyPensionWon: number;
  };
}

export function calculateNpsRecovery(input: RecoveryOptionInput): RecoveryAnalysisResult {
  const {
    npsStartAge = 65,
    lifeExpectancy = 88,
    currentMonthlyPension = 1000000,
    baseIncomeWon = 3000000,
    additionalMonths = 60,
    hasReturnRefund = false,
    refundYearPeriod = "PRE_1998",
    refundPrincipalWon = 5000000,
    refundYearsPassed = 25,
    restoredMonths: customRestoredMonths,
  } = input;

  // 1. 추납 계산
  // 2026년 기준소득월액의 9%가 월 보험료
  const clampedMonths = Math.min(119, Math.max(1, additionalMonths));
  const monthlyPremiumWon = Math.round(baseIncomeWon * 0.09);
  const totalCostWon = monthlyPremiumWon * clampedMonths;

  // 국민연금 산식 간소화 모델: A값(전체 가입자 평균소득 약 300만원)과 B값(본인소득)의 소득재분배
  // 1년(12개월) 추가 가입 시 기본연금액 월 약 2.5만~3.5만원 증가 (A값 300만원, B값 300만원 기준 약 3만원/년)
  const monthlyIncreasePerYear = (baseIncomeWon / 3000000) * 31500;
  const monthlyIncreaseWon = Math.round((monthlyIncreasePerYear / 12) * clampedMonths);
  const annualIncreaseWon = monthlyIncreaseWon * 12;

  const breakEvenYears = annualIncreaseWon > 0 ? Number((totalCostWon / annualIncreaseWon).toFixed(1)) : 999;
  const breakEvenAge = Number((npsStartAge + breakEvenYears).toFixed(1));

  const receivingYears = Math.max(0, lifeExpectancy - npsStartAge);
  const totalLifetimeGainWon = annualIncreaseWon * receivingYears;
  const netProfitWon = totalLifetimeGainWon - totalCostWon;
  const roiPercent = totalCostWon > 0 ? Math.round((netProfitWon / totalCostWon) * 100) : 0;

  // 실효 연수익률 추정 (연금 특성상 10년 회수 시 IRR 약 6~8% 수준)
  const annualEquivalentReturn = breakEvenYears > 0 ? Number((100 / breakEvenYears).toFixed(1)) : 0;

  // 2. 반납 계산 (해당 시)
  let returnRepayment: RecoveryAnalysisResult["returnRepayment"] = undefined;
  let combinedScenario: RecoveryAnalysisResult["combinedScenario"] = undefined;

  if (hasReturnRefund) {
    // 반납 이자율: 과거 수령 이후 1년 만기 정기예금 이자율 복리 누적 (평균 연 약 3.0~3.8%)
    const avgInterestRate = 0.035;
    const interestMultiplier = Math.pow(1 + avgInterestRate, refundYearsPassed);
    const returnTotalCostWon = Math.round(refundPrincipalWon * interestMultiplier);

    // 복원 기간별 소득대체율
    let applicableReplacementRate = 40;
    let bonusMultiplier = 1.0;
    if (refundYearPeriod === "PRE_1998") {
      applicableReplacementRate = 70;
      bonusMultiplier = 1.75; // 70% vs 40%
    } else if (refundYearPeriod === "1999_2007") {
      applicableReplacementRate = 60;
      bonusMultiplier = 1.5; // 60% vs 40%
    } else {
      applicableReplacementRate = 50;
      bonusMultiplier = 1.25;
    }

    // 통상 과거 3~5년(36~60개월) 가입기간 복원 시 초고소득대체율 적용으로 연금액 대폭 상승
    const restoredMonths = customRestoredMonths
      ? Math.min(180, Math.max(1, customRestoredMonths))
      : Math.min(120, Math.max(12, Math.round(refundPrincipalWon / 100000)));

    const baseMonthlyInc = (restoredMonths / 12) * monthlyIncreasePerYear * bonusMultiplier;
    const returnMonthlyIncreaseWon = Math.round(baseMonthlyInc);
    const returnAnnualIncreaseWon = returnMonthlyIncreaseWon * 12;

    const returnBreakEvenYears = returnAnnualIncreaseWon > 0
      ? Number((returnTotalCostWon / returnAnnualIncreaseWon).toFixed(1))
      : 999;
    const returnBreakEvenAge = Number((npsStartAge + returnBreakEvenYears).toFixed(1));
    const returnTotalLifetimeGainWon = returnAnnualIncreaseWon * receivingYears;
    const returnNetProfitWon = returnTotalLifetimeGainWon - returnTotalCostWon;
    const returnRoiPercent = returnTotalCostWon > 0
      ? Math.round((returnNetProfitWon / returnTotalCostWon) * 100)
      : 0;
    const returnAnnualReturn = returnBreakEvenYears > 0 ? Number((100 / returnBreakEvenYears).toFixed(1)) : 0;

    returnRepayment = {
      restoredMonths,
      applicableReplacementRate,
      totalCostWon: returnTotalCostWon,
      monthlyIncreaseWon: returnMonthlyIncreaseWon,
      annualIncreaseWon: returnAnnualIncreaseWon,
      breakEvenYears: returnBreakEvenYears,
      breakEvenAge: returnBreakEvenAge,
      totalLifetimeGainWon: returnTotalLifetimeGainWon,
      netProfitWon: returnNetProfitWon,
      roiPercent: returnRoiPercent,
      annualEquivalentReturn: returnAnnualReturn,
    };

    // 결합 시나리오 (추납 + 반납)
    const combCost = totalCostWon + returnTotalCostWon;
    const combMonthlyInc = monthlyIncreaseWon + returnMonthlyIncreaseWon;
    const combAnnualInc = combMonthlyInc * 12;
    const combBreakEvenYears = combAnnualInc > 0 ? Number((combCost / combAnnualInc).toFixed(1)) : 999;
    const combBreakEvenAge = Number((npsStartAge + combBreakEvenYears).toFixed(1));
    const combLifetimeGain = combAnnualInc * receivingYears;
    const combNetProfit = combLifetimeGain - combCost;
    const combRoi = combCost > 0 ? Math.round((combNetProfit / combCost) * 100) : 0;
    const combIrr = combBreakEvenYears > 0 ? Number((100 / combBreakEvenYears).toFixed(1)) : 0;

    combinedScenario = {
      totalCostWon: combCost,
      monthlyIncreaseWon: combMonthlyInc,
      annualIncreaseWon: combAnnualInc,
      breakEvenYears: combBreakEvenYears,
      breakEvenAge: combBreakEvenAge,
      totalLifetimeGainWon: combLifetimeGain,
      netProfitWon: combNetProfit,
      roiPercent: combRoi,
      annualEquivalentReturn: combIrr,
    };
  }

  // 기준이 되는 주요 시나리오 (반납 활성화 시 결합 시나리오, 아닐 시 추납 시나리오)
  const activeCost = combinedScenario ? combinedScenario.totalCostWon : totalCostWon;
  const activeMonthlyInc = combinedScenario ? combinedScenario.monthlyIncreaseWon : monthlyIncreaseWon;
  const activeAnnualInc = activeMonthlyInc * 12;

  // 3. 회수 마일스톤 산출
  const halfYears = activeAnnualInc > 0 ? Number(((activeCost * 0.5) / activeAnnualInc).toFixed(1)) : 999;
  const breakYears = activeAnnualInc > 0 ? Number((activeCost / activeAnnualInc).toFixed(1)) : 999;
  const doubleYears = activeAnnualInc > 0 ? Number(((activeCost * 2) / activeAnnualInc).toFixed(1)) : 999;
  const tripleYears = activeAnnualInc > 0 ? Number(((activeCost * 3) / activeAnnualInc).toFixed(1)) : 999;

  const paybackMilestones: PaybackMilestones = {
    halfPaybackAge: Number((npsStartAge + halfYears).toFixed(1)),
    breakEvenAge: Number((npsStartAge + breakYears).toFixed(1)),
    doubleReturnAge: Number((npsStartAge + doubleYears).toFixed(1)),
    tripleReturnAge: Number((npsStartAge + tripleYears).toFixed(1)),
    monthlyPensionWonAfterRecovery: currentMonthlyPension + activeMonthlyInc,
  };

  // 4. 나이대별(개시 나이 ~ 기대수명) 차트 데이터 생성
  const chartData: RecoveryAnalysisResult["chartData"] = [];
  let cumWithout = 0;
  let cumAdd = -Math.round(totalCostWon / 10000);
  let cumReturn = returnRepayment ? -Math.round(returnRepayment.totalCostWon / 10000) : 0;
  let cumComb = combinedScenario ? -Math.round(combinedScenario.totalCostWon / 10000) : 0;

  for (let age = npsStartAge; age <= Math.max(lifeExpectancy, 95); age++) {
    const annualBaseManwon = Math.round((currentMonthlyPension * 12) / 10000);
    const annualAddIncManwon = Math.round(annualIncreaseWon / 10000);
    const annualReturnIncManwon = returnRepayment ? Math.round(returnRepayment.annualIncreaseWon / 10000) : 0;
    const annualCombIncManwon = combinedScenario ? Math.round(combinedScenario.annualIncreaseWon / 10000) : 0;

    cumWithout += annualBaseManwon;
    cumAdd += annualBaseManwon + annualAddIncManwon;
    if (returnRepayment) {
      cumReturn += annualBaseManwon + annualReturnIncManwon;
    }
    if (combinedScenario) {
      cumComb += annualBaseManwon + annualCombIncManwon;
    }

    chartData.push({
      age,
      withoutRecovery: cumWithout,
      withAdditionalPayment: cumAdd,
      ...(returnRepayment ? { withReturnRepayment: cumReturn } : {}),
      ...(combinedScenario ? { withCombined: cumComb } : {}),
    });
  }

  // 5. 기대수명 구간별 수령액 및 회수율 분포
  const milestoneTargetAges = [
    { age: 75, label: "75세 (초기 노후)" },
    { age: 80, label: "80세 (평균 수급기)" },
    { age: 85, label: "85세 (기대수명 인접)" },
    { age: 90, label: "90세 (장수 진입기)" },
    { age: 95, label: "95세 (초장수 달성)" },
  ];

  const distributionByAge: AgeDistributionItem[] = milestoneTargetAges.map((item) => {
    const duration = Math.max(0, item.age - npsStartAge);
    const cumulativeReceived = activeAnnualInc * duration;
    const netProfit = cumulativeReceived - activeCost;
    const ratio = activeCost > 0 ? Math.round((cumulativeReceived / activeCost) * 100) : 0;

    return {
      targetAge: item.age,
      cumulativeReceivedWon: cumulativeReceived,
      netProfitWon: netProfit,
      recoveryRatioPercent: ratio,
      label: item.label,
    };
  });

  // 6. 권고안 생성
  const primaryAdvice = breakEvenAge <= 73
    ? `추납 시 원금 회수 나이가 ${breakEvenAge}세(개시 후 ${breakEvenYears}년)로 매우 빠릅니다. 기대수명(${lifeExpectancy}세)까지 순수익이 +${(netProfitWon / 100000000).toFixed(1)}억원(수익률 ${roiPercent}%)에 달하므로 여유 자금 발생 즉시 신청을 강력 권장합니다.`
    : `추납 완료 시 ${breakEvenAge}세에 손익분기에 도달합니다. 납부 여력에 따라 최대 60개월 분할 납부 제도를 활용하여 월 부담을 분산하는 것이 좋습니다.`;

  const actionChecklist = [
    "현재 국민연금 가입 자격(직장가입자·지역가입자 또는 임의가입자) 유지 여부 확인",
    `신청 시점의 기준소득월액(${Math.round(baseIncomeWon / 10000).toLocaleString()}만원) 기준으로 일시납 또는 최대 60회 분납 선택`,
    hasReturnRefund
      ? "1998년 이전 70% 소득대체율 반납 제도는 현재 국민연금 제도상 최고의 수익률 상품이므로 추납보다 반납을 최우선 실행"
      : "과거 실직·사업중단 납부예외 기간 또는 경력단절 전업주부 기간을 공단 전산(1355)으로 조회",
    "공단 지사 방문 또는 국민연금 모바일 앱 '내 곁에 국민연금'에서 원클릭 신청 가능",
  ];

  return {
    additionalPayment: {
      months: clampedMonths,
      monthlyPremiumWon,
      totalCostWon,
      monthlyIncreaseWon,
      annualIncreaseWon,
      breakEvenYears,
      breakEvenAge,
      totalLifetimeGainWon,
      netProfitWon,
      roiPercent,
      annualEquivalentReturn,
    },
    returnRepayment,
    combinedScenario,
    paybackMilestones,
    distributionByAge,
    chartData,
    recommendation: {
      primaryAdvice,
      actionChecklist,
    },
  };
}

export function calculateCoupleRecovery(
  selfInput: RecoveryOptionInput,
  spouseInput: RecoveryOptionInput
): CoupleRecoveryResult {
  const self = calculateNpsRecovery(selfInput);
  const spouse = calculateNpsRecovery(spouseInput);

  const selfActiveCost = self.combinedScenario ? self.combinedScenario.totalCostWon : self.additionalPayment.totalCostWon;
  const selfActiveMonthly = self.combinedScenario ? self.combinedScenario.monthlyIncreaseWon : self.additionalPayment.monthlyIncreaseWon;
  const selfActiveLifetime = self.combinedScenario ? self.combinedScenario.totalLifetimeGainWon : self.additionalPayment.totalLifetimeGainWon;

  const spouseActiveCost = spouse.combinedScenario ? spouse.combinedScenario.totalCostWon : spouse.additionalPayment.totalCostWon;
  const spouseActiveMonthly = spouse.combinedScenario ? spouse.combinedScenario.monthlyIncreaseWon : spouse.additionalPayment.monthlyIncreaseWon;
  const spouseActiveLifetime = spouse.combinedScenario ? spouse.combinedScenario.totalLifetimeGainWon : spouse.additionalPayment.totalLifetimeGainWon;

  const totalCostWon = selfActiveCost + spouseActiveCost;
  const monthlyIncreaseWon = selfActiveMonthly + spouseActiveMonthly;
  const annualIncreaseWon = monthlyIncreaseWon * 12;
  const totalLifetimeGainWon = selfActiveLifetime + spouseActiveLifetime;
  const netProfitWon = totalLifetimeGainWon - totalCostWon;
  const roiPercent = totalCostWon > 0 ? Math.round((netProfitWon / totalCostWon) * 100) : 0;
  const breakEvenYearsAvg = annualIncreaseWon > 0 ? Number((totalCostWon / annualIncreaseWon).toFixed(1)) : 999;
  const combinedMonthlyPensionWon = self.paybackMilestones.monthlyPensionWonAfterRecovery + spouse.paybackMilestones.monthlyPensionWonAfterRecovery;

  return {
    self,
    spouse,
    couple: {
      totalCostWon,
      monthlyIncreaseWon,
      annualIncreaseWon,
      breakEvenYearsAvg,
      totalLifetimeGainWon,
      netProfitWon,
      roiPercent,
      combinedMonthlyPensionWon,
    },
  };
}
