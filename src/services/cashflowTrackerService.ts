/**
 * 실전 은퇴 가계부 & 연금 인출 트래커 계산 엔진 (Cashflow Tracker Service)
 * 당초 설계한 인출전략 대비 실제 소비 괴리율, 월별 잉여/부족액 및 자산 런웨이(Runway) 산출
 */

export interface CashflowIncome {
  nationalPension: number; // 만원 단위 (본인 + 배우자 공적연금)
  retirementPension: number; // 만원 단위 (퇴직연금/IRP)
  personalPension: number; // 만원 단위 (개인연금저축)
  housingPension: number; // 만원 단위 (주택연금)
  dividendIncome: number; // 만원 단위 (배당/이자 등 금융소득)
  otherIncome: number; // 만원 단위 (재취업/사업/임대소득 등)
}

export interface CashflowExpense {
  fixedLiving: number; // 만원 단위 (주거비, 관리비, 공과금, 통신비 등 고정지출)
  variableLiving: number; // 만원 단위 (식비, 생필품, 여가, 취미, 의류 등 변동지출)
  medicalCare: number; // 만원 단위 (정기 병원비, 약값, 간병비 등 의료건강비)
  specialEvents: number; // 만원 단위 (경조사비, 가족 모임, 자녀 지원 등 특별지출)
}

export interface CashflowRecord {
  id: string;
  yearMonth: string; // 'YYYY-MM'
  income: CashflowIncome;
  expense: CashflowExpense;
  note?: string;
  createdAt: string;
}

export interface CashflowAnalysisResult {
  totalIncome: number; // 만원
  totalExpense: number; // 만원
  netCashflow: number; // 만원 (수입 - 지출)
  budgetDifference: number; // 만원 (실제 지출 - 계획 목표 생활비)
  divergenceRate: number; // % ((실제 지출 - 목표 생활비) / 목표 생활비 * 100)
  
  // 건전성 평가
  healthStatus: "SAFE" | "CAUTION" | "DANGER";
  healthScore: number; // 0 ~ 100점
  healthLabel: string;
  healthColor: string;
  
  // 런웨이 (Runway)
  currentLiquidAssets: number; // 만원 (비연금 금융자산)
  monthlyBurnRate: number; // 만원 (적자 시 매월 빠져나가는 금액)
  runwayMonths: number; // 비연금 자산 버틸 수 있는 개월 수 (적자가 없으면 999)
  runwayYears: number; // 년수
  
  // 4대 지출 비중 (%)
  expenseRatios: {
    fixed: number;
    variable: number;
    medical: number;
    special: number;
  };

  // 실전 처방 팁
  actionRecommendations: {
    title: string;
    description: string;
    tag: string;
  }[];
}

const STORAGE_KEY = "pensionlab_cashflow_records_v1";

/**
 * 기본 샘플 데이터 (초기 진입 시 풍부한 시각화를 위해 제공)
 */
export const DEFAULT_CASHFLOW_RECORDS: CashflowRecord[] = [
  {
    id: "rec-2026-05",
    yearMonth: "2026-05",
    income: { nationalPension: 180, retirementPension: 120, personalPension: 70, housingPension: 0, dividendIncome: 45, otherIncome: 0 },
    expense: { fixedLiving: 150, variableLiving: 170, medicalCare: 45, specialEvents: 80 },
    note: "어버이날 및 가족 모임으로 특별 지출 증가",
    createdAt: "2026-05-31",
  },
  {
    id: "rec-2026-06",
    yearMonth: "2026-06",
    income: { nationalPension: 180, retirementPension: 120, personalPension: 70, housingPension: 0, dividendIncome: 50, otherIncome: 0 },
    expense: { fixedLiving: 150, variableLiving: 160, medicalCare: 30, specialEvents: 30 },
    note: "안정적인 소비 유지",
    createdAt: "2026-06-30",
  },
  {
    id: "rec-2026-07",
    yearMonth: "2026-07",
    income: { nationalPension: 180, retirementPension: 120, personalPension: 70, housingPension: 0, dividendIncome: 45, otherIncome: 0 },
    expense: { fixedLiving: 165, variableLiving: 185, medicalCare: 35, specialEvents: 40 },
    note: "여름철 냉방비 및 휴가철 생활비 증가",
    createdAt: "2026-07-31",
  },
  {
    id: "rec-2026-08",
    yearMonth: "2026-08",
    income: { nationalPension: 180, retirementPension: 120, personalPension: 70, housingPension: 0, dividendIncome: 55, otherIncome: 0 },
    expense: { fixedLiving: 160, variableLiving: 165, medicalCare: 40, specialEvents: 25 },
    note: "배당금 수령 증가 및 정기 병원 검진",
    createdAt: "2026-08-31",
  },
  {
    id: "rec-2026-09",
    yearMonth: "2026-09",
    income: { nationalPension: 180, retirementPension: 120, personalPension: 70, housingPension: 0, dividendIncome: 48, otherIncome: 0 },
    expense: { fixedLiving: 150, variableLiving: 190, medicalCare: 30, specialEvents: 90 },
    note: "추석 명절 상차림 및 손자 용돈 지출",
    createdAt: "2026-09-30",
  },
  {
    id: "rec-2026-10",
    yearMonth: "2026-10",
    income: { nationalPension: 180, retirementPension: 120, personalPension: 70, housingPension: 0, dividendIncome: 52, otherIncome: 0 },
    expense: { fixedLiving: 150, variableLiving: 160, medicalCare: 35, specialEvents: 30 },
    note: "가을철 안정적인 균형 재정 달성",
    createdAt: "2026-10-19",
  },
];

/**
 * 로컬스토리지에서 기록 불러오기 (없으면 기본 샘플 반환)
 */
export function loadCashflowRecords(): CashflowRecord[] {
  if (typeof window === "undefined") return DEFAULT_CASHFLOW_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CASHFLOW_RECORDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CASHFLOW_RECORDS;
  } catch (err) {
    console.error("Failed to load cashflow records from localStorage:", err);
    return DEFAULT_CASHFLOW_RECORDS;
  }
}

/**
 * 로컬스토리지에 기록 저장
 */
export function saveCashflowRecords(records: CashflowRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("Failed to save cashflow records to localStorage:", err);
  }
}

/**
 * 단일 월 또는 최신 월의 현금흐름 분석 실행
 */
export function analyzeCashflow(
  record: CashflowRecord,
  targetMonthlySpending: number = 380, // 만원 (당초 계획 목표 생활비)
  liquidAssets: number = 15000 // 만원 (비연금 금융자산 기본 1.5억)
): CashflowAnalysisResult {
  const inc = record.income;
  const exp = record.expense;

  const totalIncome =
    (inc.nationalPension || 0) +
    (inc.retirementPension || 0) +
    (inc.personalPension || 0) +
    (inc.housingPension || 0) +
    (inc.dividendIncome || 0) +
    (inc.otherIncome || 0);

  const totalExpense =
    (exp.fixedLiving || 0) +
    (exp.variableLiving || 0) +
    (exp.medicalCare || 0) +
    (exp.specialEvents || 0);

  const netCashflow = totalIncome - totalExpense;
  const budgetDifference = totalExpense - targetMonthlySpending;
  const divergenceRate =
    targetMonthlySpending > 0
      ? Math.round(((totalExpense - targetMonthlySpending) / targetMonthlySpending) * 100 * 10) / 10
      : 0;

  // 비중 계산
  const safeTotalExp = totalExpense > 0 ? totalExpense : 1;
  const expenseRatios = {
    fixed: Math.round(((exp.fixedLiving || 0) / safeTotalExp) * 100),
    variable: Math.round(((exp.variableLiving || 0) / safeTotalExp) * 100),
    medical: Math.round(((exp.medicalCare || 0) / safeTotalExp) * 100),
    special: Math.round(((exp.specialEvents || 0) / safeTotalExp) * 100),
  };

  // 런웨이(Runway) 계산: 매월 적자(netCashflow < 0)일 때 비연금 자산이 버티는 기간
  let monthlyBurnRate = 0;
  let runwayMonths = 999;
  let runwayYears = 99;

  if (netCashflow < 0) {
    monthlyBurnRate = Math.abs(netCashflow);
    if (monthlyBurnRate > 0) {
      runwayMonths = Math.floor(liquidAssets / monthlyBurnRate);
      runwayYears = Math.round((runwayMonths / 12) * 10) / 10;
    }
  }

  // 건강 상태 평가 점수 산출
  let healthScore = 80;
  if (netCashflow >= 0) {
    healthScore += Math.min(20, Math.round(netCashflow / 5));
  } else {
    healthScore -= Math.min(40, Math.round(Math.abs(netCashflow) / 2));
  }

  if (divergenceRate > 25) {
    healthScore -= 15;
  } else if (divergenceRate < 0) {
    healthScore += 5;
  }

  healthScore = Math.max(10, Math.min(100, healthScore));

  let healthStatus: "SAFE" | "CAUTION" | "DANGER" = "SAFE";
  let healthLabel = "양호 (재정 흑자 달성)";
  let healthColor = "var(--success, #10b981)";

  if (healthScore < 50 || (netCashflow < -50 && runwayYears < 5)) {
    healthStatus = "DANGER";
    healthLabel = "위험 (자산 소진 가속 주의)";
    healthColor = "var(--danger, #ef4444)";
  } else if (healthScore < 75 || netCashflow < 0) {
    healthStatus = "CAUTION";
    healthLabel = "주의 (월 수지 적자 지속)";
    healthColor = "var(--warning, #f59e0b)";
  }

  // 처방 액션 제안
  const actionRecommendations: CashflowAnalysisResult["actionRecommendations"] = [];

  if (netCashflow >= 0) {
    actionRecommendations.push({
      title: "월 잉여금 안전자산 재투자",
      description: `이번 달 ${netCashflow.toLocaleString()}만 원의 흑자가 발생했습니다. ISA 또는 단기 채권 ETF에 예치하여 향후 특별 지출 버퍼로 적립하세요.`,
      tag: "자산증식",
    });
  } else {
    actionRecommendations.push({
      title: "변동 지출 및 특별 지출 15% 슬림화",
      description: `현재 월 ${Math.abs(netCashflow).toLocaleString()}만 원의 결손이 발생하고 있습니다. 식비/문화 및 경조사 지출을 점검하여 누수를 막으세요.`,
      tag: "지출방어",
    });
  }

  if (expenseRatios.special > 20) {
    actionRecommendations.push({
      title: "연간 특별 지출(경조사/여행) 별도 예산 계좌 분리",
      description: "특별 지출 비중이 20%를 초과했습니다. 평월 생활비와 섞지 말고 연초에 비상금 버킷에서 정액을 떼어 별도 관리하세요.",
      tag: "예산분리",
    });
  }

  if (divergenceRate > 15) {
    actionRecommendations.push({
      title: "인출 전략(S0~S4) 목표 생활비 현실화 재조정",
      description: `당초 설계한 월 ${targetMonthlySpending.toLocaleString()}만 원보다 실제 소비가 ${divergenceRate}% 높습니다. 대시보드에서 생활비 목표치를 현실에 맞게 보정하세요.`,
      tag: "플랜조정",
    });
  }

  return {
    totalIncome,
    totalExpense,
    netCashflow,
    budgetDifference,
    divergenceRate,
    healthStatus,
    healthScore,
    healthLabel,
    healthColor,
    currentLiquidAssets: liquidAssets,
    monthlyBurnRate,
    runwayMonths,
    runwayYears,
    expenseRatios,
    actionRecommendations,
  };
}
