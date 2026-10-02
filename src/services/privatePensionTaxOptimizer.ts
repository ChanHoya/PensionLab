import { KR_TAX_2026, calculateProgressiveTax, getPensionDeduction } from "@/services/withdrawalCalculator";
import type { CoupleYear, PersonPensions } from "@/services/coupleSimulation";
import type { SimulationParamsState } from "@/store/usePensionStore";

/**
 * 소득세법 제20조의3, 제129조의2 (2024년 세법 개정 기준)
 * 사적연금(연금저축 + IRP 추가납입/수익) 연간 1,500만원 초과 절세 분석 엔진
 */

export const PRIVATE_PENSION_TAX_LIMIT = 15000000; // 연 1,500만원 (원 단위)
export const PRIVATE_PENSION_MONTHLY_LIMIT = 1250000; // 월 125만원

export interface YearTaxAnalysis {
  year: number;
  age: number;
  annualPayoutWon: number; // 연간 사적연금 수령액 (원)
  isOverLimit: boolean; // 1,500만원 초과 여부
  excessWon: number; // 1,500만원 초과 금액 (원)
  lowRate: number; // 나이별 저율과세율 (5.5%, 4.4%, 3.3%)
  normalLowTaxWon: number; // 저율과세 시 세금 (원)
  separateTax165Won: number; // 16.5% 분리과세 선택 시 세금 (원)
  comprehensiveTaxWon: number; // 종합과세 선택 시 예상 세금 (원)
  betterOption: "SEPARATE_16_5" | "COMPREHENSIVE";
  appliedTaxWon: number; // 실제 납부할 세금 (초과 시 betterOption, 미초과 시 normalLowTax)
  penaltyTaxWon: number; // 1,500만원 초과로 인한 추가 세부담 (원)
}

export interface PersonTaxSummary {
  personLabel: "본인" | "배우자";
  status: "SAFE" | "WARNING";
  hasPrivatePension: boolean;
  totalExcessYears: number;
  maxAnnualPayoutWon: number;
  totalExcessAmountWon: number;
  totalTaxWithPenaltyWon: number;
  totalNormalTaxWon: number;
  potentialTaxSavingsWon: number; // 1,500만원 이하로 평탄화 시 절세액
  recommendedReceivingPeriod: number; // 1,500만원 이하로 안분하기 위한 권장 수령 연수
  currentReceivingPeriod: number;
  yearDetails: YearTaxAnalysis[];
}

export interface HouseholdTaxAnalysis {
  self: PersonTaxSummary;
  spouse: PersonTaxSummary;
  householdStatus: "SAFE" | "WARNING";
  totalHouseholdExcessYears: number;
  totalHouseholdTaxSavingsWon: number;
}

/**
 * 나이에 따른 사적연금 저율 원천징수세율 (지방소득세 10% 포함)
 */
export function getLowTaxRateByAge(age: number): number {
  if (age < 70) return 0.055; // 만 55~69세: 5.5%
  if (age < 80) return 0.044; // 만 70~79세: 4.4%
  return 0.033; // 만 80세 이상: 3.3%
}

/**
 * 단일 연도의 사적연금 세금 상세 분석
 */
export function analyzeYearTax(
  year: number,
  age: number,
  annualPayoutWon: number,
  otherTaxableIncomeWon = 0
): YearTaxAnalysis {
  const isOverLimit = annualPayoutWon > PRIVATE_PENSION_TAX_LIMIT;
  const excessWon = Math.max(0, annualPayoutWon - PRIVATE_PENSION_TAX_LIMIT);
  const lowRate = getLowTaxRateByAge(age);
  const normalLowTaxWon = Math.round(annualPayoutWon * lowRate);

  // 16.5% 분리과세
  const separateTax165Won = Math.round(annualPayoutWon * KR_TAX_2026.privatePension.overThresholdFlatRate);

  // 종합과세 계산 (연금소득공제 및 인적공제 적용)
  const pensionDeduction = getPensionDeduction(annualPayoutWon);
  const taxablePension = Math.max(0, annualPayoutWon - pensionDeduction);
  const totalTaxable = Math.max(0, taxablePension + otherTaxableIncomeWon - KR_TAX_2026.comprehensiveTax.basicPersonalDeduction);
  const comprehensiveTaxWon = calculateProgressiveTax(totalTaxable);

  const betterOption: "SEPARATE_16_5" | "COMPREHENSIVE" =
    separateTax165Won <= comprehensiveTaxWon ? "SEPARATE_16_5" : "COMPREHENSIVE";

  const appliedTaxWon = isOverLimit ? Math.min(separateTax165Won, comprehensiveTaxWon) : normalLowTaxWon;
  const penaltyTaxWon = Math.max(0, appliedTaxWon - normalLowTaxWon);

  return {
    year,
    age,
    annualPayoutWon,
    isOverLimit,
    excessWon,
    lowRate,
    normalLowTaxWon,
    separateTax165Won,
    comprehensiveTaxWon,
    betterOption,
    appliedTaxWon,
    penaltyTaxWon,
  };
}

/**
 * 가구 전체 시뮬레이션 흐름(CoupleYear[])을 기반으로 부부 각각의 1,500만원 한도 절세 분석
 */
export function analyzePrivatePensionTax(
  rows: CoupleYear[],
  selfPensions: PersonPensions,
  spousePensions: PersonPensions,
  params: SimulationParamsState
): HouseholdTaxAnalysis {
  // 타 소득 추정 (금융소득 2,000만원 초과분 종합과세 대상)
  const otherIncomeWon = Math.max(0, (params.financialIncome || 0) * 10000 - 20000000);

  // 본인 연도별 분석
  const selfYears: YearTaxAnalysis[] = [];
  let selfTotalPots = 0;
  selfPensions.personalPensions.forEach((p) => {
    selfTotalPots += (p.totalAccumulated || 0) * 10000;
  });

  const selfCurrentPeriod = selfPensions.personalPensions[0]?.receivingPeriod || 10;

  rows.forEach((row) => {
    if (!row.self.alive) return;
    // 사적연금(개인연금) 월 수령액 (만원) -> 원 단위 환산
    const monthlyManwon = row.self.personal || 0;
    const annualWon = monthlyManwon * 12 * 10000;
    if (annualWon > 0) {
      selfYears.push(analyzeYearTax(row.year, row.self.age, annualWon, otherIncomeWon));
    }
  });

  // 배우자 연도별 분석
  const spouseYears: YearTaxAnalysis[] = [];
  let spouseTotalPots = 0;
  spousePensions.personalPensions.forEach((p) => {
    spouseTotalPots += (p.totalAccumulated || 0) * 10000;
  });
  const spouseCurrentPeriod = spousePensions.personalPensions[0]?.receivingPeriod || 10;

  rows.forEach((row) => {
    if (!row.spouse?.alive) return;
    const monthlyManwon = row.spouse.personal || 0;
    const annualWon = monthlyManwon * 12 * 10000;
    if (annualWon > 0) {
      spouseYears.push(analyzeYearTax(row.year, row.spouse.age, annualWon, otherIncomeWon));
    }
  });

  function buildPersonSummary(
    personLabel: "본인" | "배우자",
    yearDetails: YearTaxAnalysis[],
    totalPots: number,
    currentReceivingPeriod: number
  ): PersonTaxSummary {
    const hasPrivatePension = yearDetails.length > 0;
    const excessList = yearDetails.filter((y) => y.isOverLimit);
    const totalExcessYears = excessList.length;
    const maxAnnualPayoutWon = yearDetails.reduce((max, y) => Math.max(max, y.annualPayoutWon), 0);
    const totalExcessAmountWon = excessList.reduce((sum, y) => sum + y.excessWon, 0);
    const totalTaxWithPenaltyWon = yearDetails.reduce((sum, y) => sum + y.appliedTaxWon, 0);
    const totalNormalTaxWon = yearDetails.reduce((sum, y) => sum + y.normalLowTaxWon, 0);
    const potentialTaxSavingsWon = Math.max(0, totalTaxWithPenaltyWon - totalNormalTaxWon);

    // 1,500만원 이하로 안분하기 위한 권장 수령 연수 산출
    let recommendedReceivingPeriod = currentReceivingPeriod;
    if (totalExcessYears > 0 && maxAnnualPayoutWon > PRIVATE_PENSION_TAX_LIMIT) {
      const neededYears = Math.ceil((maxAnnualPayoutWon * currentReceivingPeriod) / PRIVATE_PENSION_TAX_LIMIT);
      recommendedReceivingPeriod = Math.min(30, Math.max(currentReceivingPeriod + 1, neededYears));
    }

    return {
      personLabel,
      status: totalExcessYears > 0 ? "WARNING" : "SAFE",
      hasPrivatePension,
      totalExcessYears,
      maxAnnualPayoutWon,
      totalExcessAmountWon,
      totalTaxWithPenaltyWon,
      totalNormalTaxWon,
      potentialTaxSavingsWon,
      recommendedReceivingPeriod,
      currentReceivingPeriod,
      yearDetails,
    };
  }

  const selfSummary = buildPersonSummary("본인", selfYears, selfTotalPots, selfCurrentPeriod);
  const spouseSummary = buildPersonSummary("배우자", spouseYears, spouseTotalPots, spouseCurrentPeriod);

  const householdStatus = selfSummary.status === "WARNING" || spouseSummary.status === "WARNING" ? "WARNING" : "SAFE";
  const totalHouseholdExcessYears = selfSummary.totalExcessYears + spouseSummary.totalExcessYears;
  const totalHouseholdTaxSavingsWon = selfSummary.potentialTaxSavingsWon + spouseSummary.potentialTaxSavingsWon;

  return {
    self: selfSummary,
    spouse: spouseSummary,
    householdStatus,
    totalHouseholdExcessYears,
    totalHouseholdTaxSavingsWon,
  };
}
