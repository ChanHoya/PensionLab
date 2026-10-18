/**
 * 초심자를 위한 30초 퀵 간편 진단 엔진
 * 현재 나이, 희망 은퇴 나이, 현재 월 소득, 배우자 유무 등 3~4개 입력값만으로
 * 통계청 및 국민연금공단 대한민국 평균 통계를 바탕으로 3층 연금 및 은퇴 현금흐름을 즉시 추정합니다.
 */

import type {
  SimulationParamsState,
  NationalPensionState,
  RetirementPensionState,
  PersonalPensionSavingsState,
} from "@/store/usePensionStore";

export interface QuickDiagnosisInput {
  currentAge: number; // 현재 나이 (예: 45)
  retireAge: number; // 희망 은퇴 나이 (예: 60)
  monthlyIncome: number; // 현재 세전 월 소득 (만원, 예: 400)
  hasSpouse: boolean; // 배우자 유무
  spouseAge?: number; // 배우자 나이
}

export interface QuickDiagnosisResult {
  // 요약 지표 (현재가치 기준, 만원/월)
  expectedMonthlyPension: number; // 예상 은퇴 월 총 연금 (국민 + 퇴직 + 개인)
  targetMonthlySpending: number; // 권장 목표 생활비 (통계청 기준 부부 330만, 1인 230만)
  monthlyShortfall: number; // 월 부족액 (0 이상이면 부족, 0 이하면 여유)
  sufficiencyRatio: number; // 준비율 (%)

  // 3층 연금별 예상 월 수령액
  breakdown: {
    nationalMonthly: number; // 국민연금
    retirementMonthly: number; // 퇴직연금
    personalMonthly: number; // 개인연금/기타
  };

  // 핵심 진단 포인트
  readinessGrade: "A" | "B" | "C" | "D" | "E";
  summaryHeadline: string;
  keyInsights: string[];
  goldenTips: string[];
}

/**
 * 30초 퀵 간편 진단 계산 함수
 */
export function calculateQuickDiagnosis(input: QuickDiagnosisInput): QuickDiagnosisResult {
  const currentAge = Math.max(20, Math.min(75, input.currentAge || 45));
  const retireAge = Math.max(currentAge + 1, Math.min(80, input.retireAge || 60));
  const monthlyIncome = Math.max(100, input.monthlyIncome || 400);
  const hasSpouse = input.hasSpouse ?? true;

  // 1. 목표 생활비 (통계청 2024 노후적정생활비 기준)
  // 부부: 약 330만원, 1인: 약 230만원
  const targetMonthlySpending = hasSpouse ? 330 : 230;

  // 2. 국민연금 추정
  // 예상 총 가입기간: (은퇴나이 - 27세) 기준 클램핑 (최대 35년, 최소 10년)
  const estCareerYears = Math.min(35, Math.max(10, retireAge - 27));
  // 국민연금 소득대체율 모델 (2026년 기준 40년 가입 시 약 40%)
  // A값(2026년 가입자 평균소득 약 320만원), B값(본인 소득)
  const A = 320;
  const B = Math.min(617, monthlyIncome); // 국민연금 기준소득월액 상한(약 617만원)
  // 기본연금액 = 1.2 * (A + B) / 2 * (1 + 0.05 * (가입년수 - 20) / 1)
  const baseRate = 1.2 * ((A + B) / 2) * (estCareerYears / 40) * 0.45;
  const nationalMonthlySelf = Math.round(Math.min(220, Math.max(60, baseRate)));
  // 배우자 국민연금 (맞벌이 40% 가정, 주부 60% 가정)
  const nationalMonthlySpouse = hasSpouse ? Math.round(nationalMonthlySelf * 0.45) : 0;
  const totalNationalMonthly = nationalMonthlySelf + nationalMonthlySpouse;

  // 3. 퇴직연금 추정
  // 잔여 근속기간 + 과거 근속기간 기반 퇴직금 적립 (월소득 * 총근속년수)
  // 60세 시점 예상 퇴직 일시금
  const estRetirementLumpSum = monthlyIncome * Math.min(30, Math.max(5, retireAge - 28)) * 0.75;
  // 15년(180개월) 분할 인출 + 보수적 운용(연 3%)
  const retirementMonthly = Math.round((estRetirementLumpSum * 1.15) / 180);

  // 4. 개인연금/기타 금융자산 추정 (소득의 약 5~8% 저축 가정)
  const remainingYears = Math.max(1, retireAge - currentAge);
  const estPersonalSavings = monthlyIncome * 0.07 * 12 * remainingYears * 1.2;
  // 20년(240개월) 분할 인출
  const personalMonthly = Math.round(estPersonalSavings / 240);

  // 총 예상 월 연금
  const expectedMonthlyPension = totalNationalMonthly + retirementMonthly + personalMonthly;
  const monthlyShortfall = Math.max(0, targetMonthlySpending - expectedMonthlyPension);
  const sufficiencyRatio = Math.min(150, Math.round((expectedMonthlyPension / targetMonthlySpending) * 100));

  // 등급 및 헤드라인
  let readinessGrade: "A" | "B" | "C" | "D" | "E" = "C";
  let summaryHeadline = "";
  if (sufficiencyRatio >= 100) {
    readinessGrade = "A";
    summaryHeadline = "안정적 노후 준비! 목표 생활비를 100% 충족하는 골든 플랜입니다.";
  } else if (sufficiencyRatio >= 80) {
    readinessGrade = "B";
    summaryHeadline = "양호한 수준입니다. 약간의 절세 및 배당 보완으로 100% 달성이 가능합니다.";
  } else if (sufficiencyRatio >= 60) {
    readinessGrade = "C";
    summaryHeadline = "기본 골격은 갖추었으나, 은퇴 후 월 " + monthlyShortfall + "만원의 생활비 공백이 우려됩니다.";
  } else if (sufficiencyRatio >= 40) {
    readinessGrade = "D";
    summaryHeadline = "국민연금 외 사적연금 보강이 시급합니다. 적극적인 준비가 필요합니다.";
  } else {
    readinessGrade = "E";
    summaryHeadline = "노후 소득 공백 위험 구간입니다. 3층 연금 안전망을 즉시 점검하세요.";
  }

  const keyInsights = [
    `은퇴 후 예상 월 연금은 약 ${expectedMonthlyPension.toLocaleString()}만원 (목표 생활비 ${targetMonthlySpending}만원 대비 ${sufficiencyRatio}%)`,
    `국민연금으로 월 ${totalNationalMonthly.toLocaleString()}만원의 평생 기초 생활비 확보 예상`,
    monthlyShortfall > 0
      ? `은퇴 후 매월 약 ${monthlyShortfall.toLocaleString()}만원의 생활비 부족분 발생 예상`
      : `목표 생활비를 초과하는 월 ${(expectedMonthlyPension - targetMonthlySpending).toLocaleString()}만원의 여유 자금 확보`,
  ];

  const goldenTips = [
    monthlyShortfall > 0
      ? `연금저축/IRP에 월 ${Math.min(100, Math.round(monthlyShortfall * 0.4))}만원을 추가 납입하면 연말정산 최대 148만원 환급과 노후 공백을 동시에 해결합니다.`
      : "보유 자산의 세금과 건보료 피부양자(연 2,000만원) 탈락 방어에 집중하세요.",
    hasSpouse
      ? "국민연금 반납·추납 및 배우자 임의가입으로 부부 합산 평생 월 200만원+ 연금 파이프라인을 구축하세요."
      : "국민연금 가입 기간을 최소 20년 이상 확보하여 기본연금액을 극대화하세요.",
    "만 55세부터 연금 인출 시 1,500만원 분리과세 한도를 활용하여 세금 누수를 차단하세요.",
  ];

  return {
    expectedMonthlyPension,
    targetMonthlySpending,
    monthlyShortfall,
    sufficiencyRatio,
    breakdown: {
      nationalMonthly: totalNationalMonthly,
      retirementMonthly,
      personalMonthly,
    },
    readinessGrade,
    summaryHeadline,
    keyInsights,
    goldenTips,
  };
}

/**
 * 퀵 진단 입력값을 정식 Zustand 스토어 데이터 구조로 매핑하는 헬퍼
 */
export function generateStoreFromQuickDiagnosis(input: QuickDiagnosisInput) {
  const currentAge = input.currentAge || 45;
  const retireAge = input.retireAge || 60;
  const monthlyIncome = input.monthlyIncome || 400;
  const hasSpouse = input.hasSpouse ?? true;
  const spouseAge = input.spouseAge || currentAge - 2;

  const result = calculateQuickDiagnosis(input);

  // 국민연금 추정
  const nationalPension: Partial<NationalPensionState> = {
    contributionMonths: Math.max(60, (currentAge - 27) * 12),
    expectedTotalContributionMonths: Math.max(120, (retireAge - 27) * 12),
    expectedMonthlyPension: Math.round(result.breakdown.nationalMonthly * (hasSpouse ? 0.65 : 1.0)),
    totalPaidAmount: Math.round(monthlyIncome * 0.09 * (currentAge - 27) * 12),
    currentStandardMonthlyIncome: monthlyIncome,
    basicPensionAmount: Math.round(result.breakdown.nationalMonthly * (hasSpouse ? 0.65 : 1.0)),
  };

  // 퇴직연금 (DC/IRP)
  const retirementPensions: RetirementPensionState[] = [
    {
      id: "quick_retire_1",
      pensionType: "DC",
      totalAccumulated: Math.round(monthlyIncome * Math.max(2, currentAge - 30) * 0.8),
      monthlyContribution: Math.round(monthlyIncome * 0.083),
      expectedReturnRate: 4.0,
      provider: "재직회사 퇴직연금(DC)",
      productName: "퇴직연금 DC형 포트폴리오",
    },
  ];

  // 개인연금 (연금저축/IRP)
  const personalPensions: PersonalPensionSavingsState[] = [
    {
      id: "quick_personal_1",
      savingsType: "FUND",
      totalAccumulated: Math.round(monthlyIncome * 3),
      monthlyAnnualContribution: 34, // 연 400만원 한도 기준
      desiredStartAge: Math.max(55, retireAge),
      receivingPeriod: 20,
      provider: "증권사 연금저축펀드",
      productName: "연금저축 글로벌 자산배분",
    },
  ];

  // 배우자 국민연금
  const spouseNationalPension: Partial<NationalPensionState> | null = hasSpouse
    ? {
        contributionMonths: Math.max(36, (spouseAge - 28) * 6),
        expectedTotalContributionMonths: Math.max(120, (retireAge - 28) * 12),
        expectedMonthlyPension: Math.round(result.breakdown.nationalMonthly * 0.35),
        totalPaidAmount: Math.round(150 * 0.09 * (spouseAge - 28) * 6),
        currentStandardMonthlyIncome: 150,
        basicPensionAmount: Math.round(result.breakdown.nationalMonthly * 0.35),
      }
    : null;

  // 시뮬레이션 파라미터 (Partial<SimulationParamsState>)
  const simulationParams: Partial<SimulationParamsState> = {
    currentAge,
    retirementAge: retireAge,
    expectedLifeExpectancy: 88,
    inflationRate: 2.5,
    targetMonthlySpending: result.targetMonthlySpending,
    minMonthlySpending: Math.round(result.targetMonthlySpending * 0.7),
    hasSpouse,
    spouseAge,
    spouseLifeExpectancy: 90,
  };

  return {
    nationalPension,
    retirementPensions,
    personalPensions,
    spouseNationalPension,
    simulationParams,
  };
}
