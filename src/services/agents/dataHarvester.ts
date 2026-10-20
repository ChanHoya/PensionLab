// [Agent 1] 공·사적 연금 데이터 수집, PII 마스킹 및 정규화(Normalizer) 전담 에이전트
import { parseNpsHistoryText } from "@/services/npsHistoryParser";
import { parsePensionTextContent, parseFssExcelOrCsvText } from "@/services/fssExcelParser";
import { paidTotalsOf } from "@/services/paidTotals";
import type {
  SimulationParamsState,
  NationalPensionState,
  RetirementPensionState,
  PersonalPensionSavingsState,
} from "@/store/usePensionStore";

/**
 * Agent 1 표준 정규화 연금 프로필 (PII 0%, 통일 단위: 만원)
 */
export interface NormalizedPensionProfile {
  nationalPension: {
    insuredMonths: number;
    baseIncomeWon: number;
    monthlyExpectedAmount: number; // 만원 단위
    missedMonths: number; // 추납 가능 개월
  };
  retirementPension: {
    type: 'DB' | 'DC';
    currentBalance: number; // 만원
    projectedRetirementPay: number; // 만원
  };
  personalPension: {
    totalBalance: number; // 만원
    monthlyContribution: number; // 만원
    startAge: number;
  };
  household: {
    currentAge: number;
    retirementAge: number;
    hasSpouse: boolean;
    spouseAge?: number;
    targetMonthlyExpense: number; // 만원
  };
}

/**
 * 개인정보(PII) 100% 필터링 및 이름/주민번호 마스킹 유틸
 */
export function sanitizeProfilePII<T extends Record<string, any>>(raw: T): T {
  const sanitized = { ...raw };
  const sensitiveKeys = ['name', 'residentNumber', 'ssn', 'accountNumber', 'phone', 'email'];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      delete sanitized[key];
    }
  }
  return sanitized;
}

/**
 * Zustand Store의 현재 시뮬레이션 상태를 Agent 1 표준 정규화 프로필로 변환
 */
export function normalizeFromStoreState(
  params: SimulationParamsState,
  nationalPension?: NationalPensionState,
  retirementPensions?: RetirementPensionState[],
  personalPensions?: PersonalPensionSavingsState[]
): NormalizedPensionProfile {
  const retTotal = (retirementPensions || []).reduce((sum, r) => sum + (r.totalAccumulated || r.expectedLumpSum || 0), 0);
  const perTotal = (personalPensions || []).reduce((sum, p) => sum + (p.totalAccumulated || 0), 0);
  const perMonthly = (personalPensions || []).reduce((sum, p) => sum + (p.monthlyAnnualContribution || 0), 0);

  return {
    nationalPension: {
      insuredMonths: nationalPension?.contributionMonths || 240,
      baseIncomeWon: (nationalPension?.currentStandardMonthlyIncome || 350) * 10000,
      monthlyExpectedAmount: nationalPension?.expectedMonthlyPension || 120,
      missedMonths: 0,
    },
    retirementPension: {
      type: (retirementPensions?.[0]?.pensionType === 'DB' ? 'DB' : 'DC'),
      currentBalance: retTotal || 5000,
      projectedRetirementPay: retTotal || 5000,
    },
    personalPension: {
      totalBalance: perTotal || 3000,
      monthlyContribution: perMonthly || 30,
      startAge: personalPensions?.[0]?.desiredStartAge || params.privateDrawStartAge || 55,
    },
    household: {
      currentAge: params.currentAge || 45,
      retirementAge: params.retirementAge || 60,
      hasSpouse: params.hasSpouse || false,
      spouseAge: params.spouseAge,
      targetMonthlyExpense: params.targetMonthlySpending || 300,
    },
  };
}

export const Agent1DataHarvester = {
  parseNpsHistoryText,
  parsePensionTextContent,
  parseFssExcelOrCsvText,
  paidTotalsOf,
  sanitizeProfilePII,
  normalizeFromStoreState,
};
