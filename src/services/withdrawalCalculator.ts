import {
  NationalPensionState,
  BasicPensionState,
  RetirementPensionState,
  PersonalPensionSavingsState,
  PensionInsuranceState,
  SimulationParamsState,
} from "@/store/usePensionStore";

export type SourceTaxType =
  | "PUBLIC_PENSION"        // 국민연금 등 공적연금
  | "DEFERRED_RETIREMENT"   // 이연퇴직소득
  | "TAX_CREDITED"          // 세액공제 받은 납입분 + 운용수익
  | "NON_CREDITED"          // 세액공제 받지 않은 납입원금 (비과세)
  | "OLD_PERSONAL"          // (구)개인연금저축
  | "NON_QUALIFIED";        // 세제비적격 연금보험

export interface SourceBalance {
  taxType: SourceTaxType;
  amount: number; // 원 단위
}

export interface PensionAccountModel {
  id: string;
  name: string;
  category: "RETIREMENT" | "PERSONAL" | "INSURANCE";
  balance: number; // 원 단위
  payoutStartAge: number;
  receivingPeriod: number; // 년 단위
  expectedReturnRate: number; // (%)
  sources: SourceBalance[];
  pensionType?: "DB" | "DC" | "IRP";
  avgSalary?: number;
  yearsOfService?: number;
  salaryGrowthRate?: number;
  monthlyContribution?: number;
  companyMatchRate?: number;
  monthlyAnnualContribution?: number;
  personalTaxCreditRatio?: number;
  monthlyPayment?: number;
  paymentPeriod?: number;
}

export interface SimulationYearFlow {
  age: number;
  year: number;
  
  // 수령액 (세전)
  nationalPreTax: number;
  basicPreTax: number;
  retirementPreTax: number;
  personalPreTax: number;
  insurancePreTax: number;
  totalPreTax: number;

  // 세부 재원별 인출액 (세전)
  drawNonCredited: number;
  drawDeferredRetirement: number;
  drawTaxCredited: number;
  drawNonQualified: number;

  // 세금 및 건보료
  taxOnNational: number;
  taxOnRetirement: number;
  taxOnPersonal: number;
  healthInsurance: number;
  totalTaxAndHI: number;

  // 수령액 (세후)
  totalPostTax: number;

  // 계좌 기말 잔액 합계
  endingBalance: number;

  // 목표 대비 과부족
  deficit: number;
}

export interface StrategySimulationResult {
  strategyId: "S0" | "S1" | "S2" | "S3";
  strategyName: string;
  lifetimeTotalPreTax: number;
  lifetimeTotalPostTax: number;
  lifetimeTotalTaxAndHI: number;
  lifetimeTotalTax: number;
  lifetimeTotalHI: number;
  hasCrevasse: boolean;
  hasDeficit: boolean;
  lostDependencyAge?: number; // 피부양자 탈락 나이
  flows: SimulationYearFlow[];
}

// 2026 대한민국 연금 세제 룰셋 (KR-TAX-2026.1)
export const KR_TAX_2026 = {
  ruleSetId: "KR-TAX-2026.1",
  effectiveFrom: "2026-01-01",
  privatePension: {
    separateTaxThreshold: 15000000, // 연 1,500만원 사적연금 분리과세 한도
    overThresholdFlatRate: 0.165, // 한도 초과 시 16.5% 분리과세 (지방세 포함)
    lowRateByAge: [
      { ageMin: 55, ageMax: 69, rate: 0.055 }, // 5.5% (지방소득세 10% 포함)
      { ageMin: 70, ageMax: 79, rate: 0.044 }, // 4.4%
      { ageMin: 80, ageMax: 200, rate: 0.033 }  // 3.3%
    ],
    withdrawalLimitMultiplier: 1.2,
    otherIncomeRate: 0.165 // 한도 초과 인출 시 기타소득세 16.5%
  },
  retirementIncome: {
    reliefByPayoutYear: [
      { yearMin: 1,  yearMax: 10,  reliefRate: 0.30 }, // 30% 감면
      { yearMin: 11, yearMax: 20,  reliefRate: 0.40 }, // 40% 감면
      { yearMin: 21, yearMax: 999, reliefRate: 0.50 }  // 50% 감면
    ]
  },
  comprehensiveTax: {
    brackets: [
      { upTo: 14000000, rate: 0.06 },
      { upTo: 50000000, rate: 0.15 },
      { upTo: 88000000, rate: 0.24 },
      { upTo: 150000000, rate: 0.35 },
      { upTo: 300000000, rate: 0.38 },
      { upTo: 500000000, rate: 0.40 },
      { upTo: 1000000000, rate: 0.42 },
      { upTo: Infinity, rate: 0.45 }
    ],
    localSurtax: 0.10,
    basicPersonalDeduction: 1500000
  },
  healthInsurance: {
    dependentIncomeCap: 20000000, // 연 2,000만원 초과 시 피부양자 박탈 (국민연금+기타소득)
    financialIncomeCap: 10000000, // 금융소득 1,000만원 초과 시 피부양자 박탈
    premiumRate: 0.08,            // 소득 기반 보험료율
    propertyPremiumRate: 0.012,   // 재산세 과세표준 기반 연 보험료율 근사 (지역가입자 재산점수제 단순화)
    financialExcessRate: 0.0709,  // 금융소득 1,000만원 초과분 보험료율 (2026 기준)
  }
};

/**
 * 종합소득세 계산 (연금소득공제 포함)
 */
export function calculateProgressiveTax(taxableIncome: number, rules = KR_TAX_2026.comprehensiveTax): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let remainingIncome = taxableIncome;
  let prevLimit = 0;

  for (const bracket of rules.brackets) {
    const limit = bracket.upTo;
    const rate = bracket.rate;
    const bracketSize = limit - prevLimit;

    if (remainingIncome > bracketSize) {
      tax += bracketSize * rate;
      remainingIncome -= bracketSize;
      prevLimit = limit;
    } else {
      tax += remainingIncome * rate;
      break;
    }
  }

  // 지방소득세 10% 추가 가산
  return Math.round(tax * (1 + rules.localSurtax));
}

/**
 * 연금소득공제 계산 테이블 (소득세법 제47조의2)
 */
export function getPensionDeduction(payout: number): number {
  if (payout <= 0) return 0;
  let deduction = 0;
  if (payout <= 3500000) {
    deduction = payout;
  } else if (payout <= 7000000) {
    deduction = 3500000 + (payout - 3500000) * 0.40;
  } else if (payout <= 14000000) {
    deduction = 4900000 + (payout - 7000000) * 0.20;
  } else {
    deduction = 6300000 + (payout - 14000000) * 0.10;
  }
  return Math.min(9000000, deduction); // 최대 한도 900만원
}

/**
 * 공적연금 수령 한도액 공식 계산
 */
export function calcWithdrawalLimit(balance: number, payoutYearIndex: number): number {
  if (payoutYearIndex > 10) return Infinity; // 11년차부터는 한도 없음
  const denominator = 11 - payoutYearIndex;
  if (denominator <= 0) return Infinity;
  return (balance / denominator) * KR_TAX_2026.privatePension.withdrawalLimitMultiplier;
}

/**
 * 이연퇴직소득세 계산 (수령 연차에 따른 감면 적용)
 */
export function calcTaxOnDeferredRetirement(
  draw: number,
  lumpSumTaxRate: number,
  payoutYearIndex: number,
  limit: number
): number {
  if (draw <= 0) return 0;

  const drawUnderLimit = Math.min(draw, limit);
  const drawOverLimit = Math.max(0, draw - limit);

  // 감면율 결정
  let reliefRate = 0.30;
  for (const range of KR_TAX_2026.retirementIncome.reliefByPayoutYear) {
    if (payoutYearIndex >= range.yearMin && payoutYearIndex <= range.yearMax) {
      reliefRate = range.reliefRate;
      break;
    }
  }

  // 한도 내 수령분: 퇴직소득세율 * (1 - 감면율)
  const taxUnderLimit = drawUnderLimit * lumpSumTaxRate * (1 - reliefRate);
  // 한도 초과분: 퇴직소득세율 100% 부과
  const taxOverLimit = drawOverLimit * lumpSumTaxRate;

  return Math.round(taxUnderLimit + taxOverLimit);
}

/**
 * 사적연금 세액 계산 (연 1,500만원 분리과세 한도 판단 및 종합과세Marginal Tax 비교)
 */
export function calcTaxOnCredited(
  draw: number,
  age: number,
  limit: number,
  otherTaxableIncome: number,
  publicPensionTaxable: number,
  isComprehensiveChoice = false
): { tax: number; isComprehensive: boolean } {
  if (draw <= 0) return { tax: 0, isComprehensive: false };

  const drawUnderLimit = Math.min(draw, limit);
  const drawOverLimit = Math.max(0, draw - limit);

  // 1. 한도 초과 인출분은 16.5% 기타소득세 부과
  const taxOverLimit = drawOverLimit * KR_TAX_2026.privatePension.otherIncomeRate;

  // 2. 한도 내 인출분의 세율 결정 (나이에 따른 저율과세)
  let lowRate = 0.055;
  for (const rateRange of KR_TAX_2026.privatePension.lowRateByAge) {
    if (age >= rateRange.ageMin && age <= rateRange.ageMax) {
      lowRate = rateRange.rate;
      break;
    }
  }

  // 한도 내 수령액이 1,500만 원 이하인 경우 -> 무조건 분리과세가 유리
  if (drawUnderLimit <= KR_TAX_2026.privatePension.separateTaxThreshold && !isComprehensiveChoice) {
    const taxUnderLimit = drawUnderLimit * lowRate;
    return {
      tax: Math.round(taxUnderLimit + taxOverLimit),
      isComprehensive: false,
    };
  }

  // 1,500만 원 초과 시 -> 16.5% 분리과세 선택 vs 종합과세 비교
  // 1) 16.5% 단일세율 분리과세 적용 시
  const separateTaxUnderLimit = drawUnderLimit * KR_TAX_2026.privatePension.overThresholdFlatRate;
  const totalSeparateTax = separateTaxUnderLimit + taxOverLimit;

  // 2) 종합과세 합산 시
  // 연금소득공제는 공적연금 과세분과 사적연금 적격분을 합산하여 계산
  const totalTaxablePension = publicPensionTaxable + drawUnderLimit;
  const pensionDeduction = getPensionDeduction(totalTaxablePension);
  const netPensionIncome = Math.max(0, totalTaxablePension - pensionDeduction);

  // 타 종합소득과 합산하여 소득세 계산
  const totalIncomeWithPension = netPensionIncome + otherTaxableIncome;
  const basicDeduction = KR_TAX_2026.comprehensiveTax.basicPersonalDeduction;
  const compTaxWithPension = calculateProgressiveTax(Math.max(0, totalIncomeWithPension - basicDeduction));

  // 연금 외 종합소득에 대한 세금 단독 계산 (Marginal 차액 계산용)
  const compTaxWithoutPension = calculateProgressiveTax(Math.max(0, otherTaxableIncome - basicDeduction));
  const marginalCompTax = Math.max(0, compTaxWithPension - compTaxWithoutPension);

  const totalCompTax = marginalCompTax + taxOverLimit;

  if (totalCompTax < totalSeparateTax) {
    return {
      tax: Math.round(totalCompTax),
      isComprehensive: true,
    };
  } else {
    return {
      tax: Math.round(totalSeparateTax),
      isComprehensive: false,
    };
  }
}

/**
 * 공적연금 종합소득세 계산 (단독)
 */
export function calcTaxOnPublicPension(
  annualAmount: number,
  taxableRatio: number,
  otherTaxableIncome: number
): number {
  if (annualAmount <= 0) return 0;
  const taxablePublic = annualAmount * taxableRatio;
  const deduction = getPensionDeduction(taxablePublic);
  const netPensionIncome = Math.max(0, taxablePublic - deduction);

  const totalIncome = netPensionIncome + otherTaxableIncome;
  const basicDeduction = KR_TAX_2026.comprehensiveTax.basicPersonalDeduction;

  const taxWithPension = calculateProgressiveTax(Math.max(0, totalIncome - basicDeduction));
  const taxWithoutPension = calculateProgressiveTax(Math.max(0, otherTaxableIncome - basicDeduction));

  return Math.round(Math.max(0, taxWithPension - taxWithoutPension));
}

/**
 * 건강보험 피부양자 탈락 검사 및 지역보험료 추정
 *
 * 피부양자 탈락 기준 (2022.9 건보료 개편):
 *   국민연금 수령액 총액이 연 2,000만원 초과 시 탈락 (과세비율 미적용, 총액 기준)
 *   사적연금(연금저축·퇴직연금 연금형)은 건보료 소득 산정에서 제외
 *
 * 지역보험료 부과소득:
 *   공적연금 수령액 × 50% + 기타 종합과세 소득 × 100%
 */
export function assessHealthInsurance(
  publicPensionAnnual: number,   // 원/년
  otherTaxableIncome: number,    // 원/년
  propertyTaxBaseWon: number = 0, // 원 (재산세 과세표준)
  financialIncomeWon: number = 0  // 원/년 (금융소득 이자+배당)
): { isDependentLost: boolean; estimatedPremium: number } {
  const hi = KR_TAX_2026.healthInsurance;

  // 피부양자 탈락 조건: ① 국민연금+기타소득 > 2,000만원 OR ② 금융소득 > 1,000만원
  const totalAssessableIncome = publicPensionAnnual + otherTaxableIncome;
  const isDependentLost =
    totalAssessableIncome > hi.dependentIncomeCap ||
    financialIncomeWon > hi.financialIncomeCap;

  let estimatedPremium = 0;
  if (isDependentLost) {
    // ① 소득 기반: 국민연금 50% + 기타소득 100%
    const baseIncome = (publicPensionAnnual * 0.5) + otherTaxableIncome;
    const incomePremium = baseIncome * hi.premiumRate;

    // ② 재산 기반: 재산세 과세표준 × 연 1.2% (지역가입자 재산점수제 단순 근사)
    const propertyPremium = propertyTaxBaseWon * hi.propertyPremiumRate;

    // ③ 금융소득 기반: 1,000만원 초과분 × 7.09%
    const financialExcess = Math.max(0, financialIncomeWon - hi.financialIncomeCap);
    const financialPremium = financialExcess * hi.financialExcessRate;

    estimatedPremium = incomePremium + propertyPremium + financialPremium;
  }

  return {
    isDependentLost,
    estimatedPremium: Math.round(estimatedPremium),
  };
}

/**
 * 단일 계좌 내에서 세법상 순서대로 인출 구성 분해
 * 순서: 1) 비과세 원금 (NON_CREDITED) -> 2) 이연퇴직소득 (DEFERRED_RETIREMENT) -> 3) 세액공제분 + 운용수익 (TAX_CREDITED)
 */
export function resolveDrawComposition(
  sources: SourceBalance[],
  drawAmount: number
): { draws: { [key in SourceTaxType]?: number }; updatedSources: SourceBalance[] } {
  let remainingDraw = drawAmount;
  const draws: { [key in SourceTaxType]?: number } = {};
  const updatedSources = sources.map((s) => ({ ...s }));

  const order: SourceTaxType[] = [
    "NON_CREDITED",
    "OLD_PERSONAL",
    "NON_QUALIFIED",
    "DEFERRED_RETIREMENT",
    "TAX_CREDITED",
    "PUBLIC_PENSION"
  ];

  for (const taxType of order) {
    if (remainingDraw <= 0) break;

    const sourceIdx = updatedSources.findIndex((s) => s.taxType === taxType);
    if (sourceIdx !== -1 && updatedSources[sourceIdx].amount > 0) {
      const available = updatedSources[sourceIdx].amount;
      const taken = Math.min(available, remainingDraw);
      draws[taxType] = (draws[taxType] || 0) + taken;
      updatedSources[sourceIdx].amount -= taken;
      remainingDraw -= taken;
    }
  }

  return { draws, updatedSources };
}

/**
 * Calculates the decumulation multiplier for a given year index k
 */
export function getDecumulationMultiplier(k: number, strategy: string): number {
  if (strategy !== "DECREASING") return 1.0;
  const yearsSinceStart = k - 1;
  if (yearsSinceStart <= 5) return 1.2;
  if (yearsSinceStart <= 10) return 1.0;
  if (yearsSinceStart <= 15) return 0.8;
  if (yearsSinceStart <= 20) return 0.6;
  return 0.4;
}

/**
 * Calculates the base annual payout P for an account using a weighted PMT formula,
 * so that when multiplied by decumulation multipliers, the balance depletes to exactly 0
 * at the end of the receiving period, taking into account annual interest compounding.
 */
export function calculateWeightedPMT(
  initialBalance: number,
  receivingPeriod: number,
  interestRatePercent: number,
  strategy: string
): number {
  if (receivingPeriod <= 0) return 0;
  const r = interestRatePercent / 100;
  
  let denominator = 0;
  for (let t = 1; t <= receivingPeriod; t++) {
    const multiplier = getDecumulationMultiplier(t, strategy);
    denominator += multiplier * Math.pow(1 + r, -(t - 1));
  }
  
  if (denominator <= 0) return 0;
  return initialBalance / denominator;
}

/**
 * 3층 연금 및 개인 자산 데이터 바탕으로 advanced 시뮬레이션 실행
 */
export function runWithdrawalSimulation(
  national: NationalPensionState,
  basic: BasicPensionState,
  retirementPensions: RetirementPensionState[],
  personalPensions: PersonalPensionSavingsState[],
  pensionInsurances: PensionInsuranceState[],
  simulationParams: SimulationParamsState,
  customInputs: {
    personalTaxCreditRatio?: number; // 개인연금 세액공제 비율 (0.0~1.0, 기본 0.8)
    retirementLumpSumTaxRate?: number; // 퇴직소득세율 (0.0~0.20, 기본 0.08)
    otherIncomeAnnual?: number; // 타 종합과세 대상 소득 (만원/년, 기본 0)
    publicPensionTaxableRatio?: number; // 국민연금 과세비율 (0.0~1.0, 기본 0.5)
    s3CustomStartAges?: { [accountId: string]: number }; // S3 계좌별 인출 개시 나이
    s3CustomPeriods?: { [accountId: string]: number }; // S3 계좌별 인출 기간
  } = {}
): {
  s0: StrategySimulationResult;
  s1: StrategySimulationResult;
  s2: StrategySimulationResult;
  s3: StrategySimulationResult;
} {
  const currentAge = simulationParams.currentAge || 35;
  const expectedLife = simulationParams.expectedLifeExpectancy || 85;
  const inflationRate = simulationParams.inflationRate / 100;
  const currentYear = new Date().getFullYear();

  // 사용자 정의 입력값 및 기본값 매핑
  const personalTaxCreditRatio = customInputs.personalTaxCreditRatio ?? 0.8;
  const retirementLumpSumTaxRate = customInputs.retirementLumpSumTaxRate ?? 0.08;
  const otherIncomeAnnual = (customInputs.otherIncomeAnnual ?? 0) * 10000; // 만원 -> 원
  const publicPensionTaxableRatio = customInputs.publicPensionTaxableRatio ?? 0.5;

  // 1. 계좌 리스트 및 세부 재원 통합 초기 모델 생성 함수
  const createUnifiedAccounts = (strategyId: "S0" | "S1" | "S2" | "S3"): PensionAccountModel[] => {
    const accounts: PensionAccountModel[] = [];

    // 퇴직연금 (2층)
    retirementPensions.forEach((p, idx) => {
      // 전략별 인출 개시 나이 및 기간 결정
      let payoutStartAge = simulationParams.retirementAge;
      let receivingPeriod = Math.max(10, expectedLife - simulationParams.retirementAge);

      if (strategyId === "S1" || strategyId === "S2") {
        // 절세 평탄화 전략: 퇴직연금은 소득공백기(크레바스) 브릿지 자금으로 우선 배치하되 감면 극대화를 위해 수령기간 11년 이상 유지
        payoutStartAge = simulationParams.retirementAge;
        receivingPeriod = Math.max(11, Math.min(20, expectedLife - payoutStartAge));
      } else if (strategyId === "S3" && customInputs.s3CustomStartAges?.[p.id]) {
        payoutStartAge = customInputs.s3CustomStartAges[p.id];
        receivingPeriod = customInputs.s3CustomPeriods?.[p.id] || 10;
      }

      // 초기 적립금 (현재 시점 금액)
      const currentBalance = (p.totalAccumulated || 0) * 10000;

      accounts.push({
        id: p.id,
        name: `${p.pensionType} 퇴직연금`,
        category: "RETIREMENT",
        balance: Math.round(currentBalance),
        payoutStartAge,
        receivingPeriod,
        expectedReturnRate: p.expectedReturnRate || 3.0,
        sources: [
          { taxType: "DEFERRED_RETIREMENT", amount: Math.round(currentBalance) }
        ],
        pensionType: p.pensionType,
        avgSalary: p.avgSalary,
        yearsOfService: p.yearsOfService,
        salaryGrowthRate: p.salaryGrowthRate,
        monthlyContribution: p.monthlyContribution,
        companyMatchRate: p.companyMatchRate
      });
    });

    // 개인연금저축 (3층)
    personalPensions.forEach((p) => {
      // 전략별 수령 개시 연령 설정
      let payoutStartAge = p.desiredStartAge;
      let receivingPeriod = p.receivingPeriod || 10;

      // S1/S2의 경우 인출 시작 연령 및 평탄화 기간 동적 설정
      if (strategyId === "S1" || strategyId === "S2") {
        if (strategyId === "S1") {
          // S1 절세 평탄화: 개인연금을 은퇴 시점부터 인출 개시하여
          // 소득공백기(크레바스)를 메우고 전 기간 세금을 평탄화함
          payoutStartAge = simulationParams.retirementAge;
          receivingPeriod = Math.max(10, expectedLife - payoutStartAge);
        } else {
          // S2(국민연금 5년 연기)의 경우:
          // 1. 퇴직연금 연간 수령액이 목표 생활비를 충당하는지 검사
          const totalRetirementBalance = retirementPensions.reduce((sum, rp) => sum + (rp.totalAccumulated || 0) * 10000, 0);
          const estRetirementAnnual = totalRetirementBalance / 11;
          const targetAnnualSpending = (simulationParams.targetMonthlySpending || 300) * 12 * 10000;

          if (estRetirementAnnual >= targetAnnualSpending) {
            // 퇴직연금만으로 목표 생활비 충당 가능 -> 개인연금은 조기 인출하지 않고 원래 희망수급연령(desiredStartAge)부터 개시하여 거치 증식 극대화
            payoutStartAge = p.desiredStartAge;
          } else {
            // 퇴직연금만으로 부족한 경우 -> 소득 공백기(크레바스)를 메우기 위해 개인연금을 은퇴 연령부터 조기 인출하여 브릿지 재원으로 활용
            payoutStartAge = Math.max(55, simulationParams.retirementAge);
          }
        }
        
        // 평탄화 수령 한도를 위한 임시 FV 계산 (수령 기간 산정을 위해)
        const yearsToStart = Math.max(0, payoutStartAge - currentAge);
        const yearsToRetire = Math.max(0, simulationParams.retirementAge - currentAge);
        const monthsToPay = Math.max(0, Math.min(yearsToStart, yearsToRetire) * 12);
        const returnRate = (p.savingsType === "FUND" ? 4.5 : 2.5) / 100;
        const fvCurrent = (p.totalAccumulated * 10000) * Math.pow(1 + returnRate, yearsToStart);
        let fvDeposits = 0;
        const monthlyContribution = p.monthlyAnnualContribution * 10000;
        if (returnRate > 0) {
          const monthlyRate = returnRate / 12;
          fvDeposits = monthlyContribution * ((Math.pow(1 + monthlyRate, monthsToPay) - 1) / monthlyRate);
        } else {
          fvDeposits = monthlyContribution * monthsToPay;
        }
        const deferredYears = Math.max(0, payoutStartAge - simulationParams.retirementAge);
        const fvDepositsCompounded = fvDeposits * Math.pow(1 + returnRate, deferredYears);
        const estTotalBalanceAtStart = fvCurrent + fvDepositsCompounded;

        const annualNeeded = estTotalBalanceAtStart / receivingPeriod;
        if (annualNeeded > 15000000) {
          receivingPeriod = Math.min(25, Math.ceil(estTotalBalanceAtStart / 15000000));
        }
      } else if (strategyId === "S3" && customInputs.s3CustomStartAges?.[p.id]) {
        payoutStartAge = customInputs.s3CustomStartAges[p.id];
        receivingPeriod = customInputs.s3CustomPeriods?.[p.id] || 10;
      }

      const currentBalance = p.totalAccumulated * 10000;
      const creditedAmount = currentBalance * personalTaxCreditRatio;
      const nonCreditedAmount = currentBalance * (1 - personalTaxCreditRatio);

      accounts.push({
        id: p.id,
        name: `개인연금저축 (${p.savingsType === "FUND" ? "펀드" : "보험"})`,
        category: "PERSONAL",
        balance: Math.round(currentBalance),
        payoutStartAge,
        receivingPeriod,
        expectedReturnRate: p.savingsType === "FUND" ? 4.5 : 2.5,
        sources: [
          { taxType: "TAX_CREDITED", amount: Math.round(creditedAmount) },
          { taxType: "NON_CREDITED", amount: Math.round(nonCreditedAmount) }
        ],
        monthlyAnnualContribution: p.monthlyAnnualContribution,
        personalTaxCreditRatio
      });
    });

    // 세제비적격 연금보험 (3층)
    pensionInsurances.forEach((i) => {
      let payoutStartAge = simulationParams.retirementAge;
      let receivingPeriod = Math.max(20, expectedLife - simulationParams.retirementAge);

      if (strategyId === "S3" && customInputs.s3CustomStartAges?.[i.id]) {
        payoutStartAge = customInputs.s3CustomStartAges[i.id];
        receivingPeriod = customInputs.s3CustomPeriods?.[i.id] || 20;
      }

      const currentBalance = i.totalAccumulated * 10000;

      accounts.push({
        id: i.id,
        name: `비적격 연금보험 (${i.insuranceType})`,
        category: "INSURANCE",
        balance: Math.round(currentBalance),
        payoutStartAge,
        receivingPeriod,
        expectedReturnRate: i.expectedDeclaredRate,
        sources: [
          { taxType: "NON_QUALIFIED", amount: Math.round(currentBalance) }
        ],
        monthlyPayment: i.monthlyPayment,
        paymentPeriod: i.paymentPeriod
      });
    });

    return accounts;
  };

  // 2. 단일 시나리오 시뮬레이션 계산 실행기
  const simulateStrategy = (
    strategyId: "S0" | "S1" | "S2" | "S3",
    strategyName: string
  ): StrategySimulationResult => {
    const accounts = createUnifiedAccounts(strategyId);
    const flows: SimulationYearFlow[] = [];

    // 수령 계좌별 수령 연차(1-indexed) 트래킹
    const accountPayoutYears: { [accountId: string]: number } = {};
    accounts.forEach((a) => {
      accountPayoutYears[a.id] = 0;
    });

    // === 포트폴리오 레벨 PMT 계산 ===
    // 계좌별 독립 PMT 대신 포트폴리오 합산 단일 PMT를 사용.
    // 매년 단조감소하는 "목표 총 수령액"을 정의하고, 모든 계좌·공적연금이
    // 이 목표를 함께 채우도록 하여 계좌/연금 개시 시점과 무관하게 은퇴 첫 해부터
    // 완전한 계단식(우하향) 곡선을 보장. (모든 전략 공통)
    const deferYearsPort = strategyId === "S2" ? 5 : 0;
    const effectiveNatStartPort = simulationParams.nationalPensionStartAge + deferYearsPort;
    const deferMultPort = 1 + deferYearsPort * 0.072;

    // 인출(감소) 시작 기준 연령: 은퇴나이. (계좌가 더 일찍 개시되면 그 시점)
    const minPayoutAge = accounts.length > 0
      ? Math.min(...accounts.map(a => a.payoutStartAge))
      : simulationParams.retirementAge;
    const decumStartAge = Math.min(simulationParams.retirementAge, minPayoutAge);
    // 자산 소진 목표 종료 연령: 가장 늦게 끝나는 계좌의 수령 종료 시점
    const horizonEndAge = accounts.length > 0
      ? Math.max(...accounts.map(a => a.payoutStartAge + a.receivingPeriod - 1))
      : simulationParams.retirementAge + 30;

    const totalInitialBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const weightedR = totalInitialBalance > 0
      ? accounts.reduce((s, a) => s + a.balance * (a.expectedReturnRate / 100), 0) / totalInitialBalance
      : 0.04;

    // 인출 시작~종료 전 구간에 대해 PV 가중 분모 및 미래 공적연금 유입 PV 합산
    let pvPublicPension = 0;
    let portfolioDenominator = 0;
    for (let portAge = decumStartAge; portAge <= horizonEndAge; portAge++) {
      const t = portAge - decumStartAge;
      const df = Math.pow(1 + weightedR, -t);
      const mult = getDecumulationMultiplier(t + 1, simulationParams.decumulationStrategy);
      let natP = 0, basP = 0;
      // 공적연금 물가연동 증액분을 PV 합산에 반영
      if (portAge >= effectiveNatStartPort) {
        natP = (national.expectedMonthlyPension * 12) * deferMultPort * Math.pow(1 + inflationRate, portAge - effectiveNatStartPort) * 10000;
      }
      if (portAge >= 65 && basic.expectedEligibility) {
        basP = (basic.expectedMonthlyAmount * 12) * Math.pow(1 + inflationRate, portAge - 65) * 10000;
      }
      pvPublicPension += (natP + basP) * df;
      portfolioDenominator += mult * df;
    }

    // 목표 총 수령액 기준선: (총 자산 + 미래 공적연금 PV) / 가중분모
    const portfolioBaseDraw = portfolioDenominator > 0
      ? (totalInitialBalance + pvPublicPension) / portfolioDenominator
      : 0;
    // === 포트폴리오 PMT 계산 끝 ===

    let lifetimeTotalPreTax = 0;
    let lifetimeTotalPostTax = 0;
    let lifetimeTotalTaxAndHI = 0;
    let lifetimeTotalTax = 0;
    let lifetimeTotalHI = 0;
    let hasCrevasse = false;
    let hasDeficit = false;
    let lostDependencyAge: number | undefined;

    // 기대수명까지 연도별 계산
    for (let age = currentAge; age <= expectedLife; age++) {
      const yearOffset = age - currentAge;
      const year = currentYear + yearOffset;

      let nationalPreTax = 0;
      let basicPreTax = 0;
      let retirementPreTax = 0;
      let personalPreTax = 0;
      let insurancePreTax = 0;

      // 연간 세부 재원 인출액 합계용 변수
      let drawNonCredited = 0;
      let drawDeferredRetirement = 0;
      let drawTaxCredited = 0;
      let drawNonQualified = 0;

      let taxOnRetirement = 0;
      let taxOnPersonal = 0;

      // 2.1 공적 연금 수령액 (국민연금, 기초연금) 결정
      // 국민연금 개시 연령 설정 (S2는 5년 연기)
      const nationalPensionStartAge =
        strategyId === "S2"
          ? simulationParams.nationalPensionStartAge + 5
          : simulationParams.nationalPensionStartAge;

      if (age >= nationalPensionStartAge) {
        // 국민연금 연기 시 매년 +7.2% 증액 효과 반영
        const deferYears = Math.max(0, nationalPensionStartAge - simulationParams.nationalPensionStartAge);
        const deferMultiplier = 1 + deferYears * 0.072;
        // 국민연금은 매년 전년도 소비자물가변동률만큼 증액(물가연동) → 연령 증가에 따라 수령액 증가
        const indexation = Math.pow(1 + inflationRate, age - nationalPensionStartAge);
        // 국민연금 연액 계산 (만 원 -> 원)
        nationalPreTax = (national.expectedMonthlyPension * 12) * deferMultiplier * indexation * 10000;
      }

      if (age >= 65 && basic.expectedEligibility) {
        // 기초연금도 매년 물가상승률만큼 증액
        const basicIndexation = Math.pow(1 + inflationRate, age - 65);
        basicPreTax = (basic.expectedMonthlyAmount * 12) * basicIndexation * 10000;
      }

      // 은퇴 크레바스(소득 공백기) 판별: 은퇴 나이 이상인데 공적연금 수령액이 0원인 기간
      if (age >= simulationParams.retirementAge && nationalPreTax === 0) {
        hasCrevasse = true;
      }

      // 2.2 통합 인출 패스: 단조감소 목표를 공적연금 + 사적연금이 함께 충족
      // 목표 총 수령액(targetTotal)은 portfolioBaseDraw × multiplier(t)로 계단식 우하향.
      // 공적연금으로 부족한 부분(remaining)을 잔고 보유 계좌에서 잔액 비례로 인출하여
      // 계좌/공적연금 개시 시점과 무관하게 총 수령액이 매년 단조감소하도록 보장.
      if (age >= decumStartAge) {
        const portT = age - decumStartAge;
        const multiplier = getDecumulationMultiplier(portT + 1, simulationParams.decumulationStrategy);
        const targetTotal = portfolioBaseDraw * multiplier;
        const remaining = Math.max(0, targetTotal - nationalPreTax - basicPreTax);

        // 인출 가능 계좌: 잔고 보유 + (개시 연령 도달 OR 은퇴 후 브릿지 인출 가능)
        // DB 연금은 연금화 상품이므로 개시 전 조기 인출 불가.
        const drawable = accounts.filter((a) => {
          if (a.balance <= 0) return false;
          if (age >= a.payoutStartAge) return true;
          if (a.pensionType === "DB") return false;
          return age >= simulationParams.retirementAge;
        });

        const totalDrawableBal = drawable.reduce((s, a) => s + a.balance, 0);
        // 목표 대비 인출 비율 (자산이 목표보다 적으면 전액 인출 = 1.0)
        const fillRatio = totalDrawableBal > 0 ? Math.min(1, remaining / totalDrawableBal) : 0;

        drawable.forEach((acc) => {
          const drawAmount = Math.min(acc.balance, acc.balance * fillRatio);
          if (drawAmount <= 0) return;

          accountPayoutYears[acc.id]++;
          const k = accountPayoutYears[acc.id]; // 수령 연차

          const { draws, updatedSources } = resolveDrawComposition(acc.sources, drawAmount);
          acc.sources = updatedSources;
          acc.balance -= drawAmount;

          drawNonCredited += draws["NON_CREDITED"] || 0;
          drawDeferredRetirement += draws["DEFERRED_RETIREMENT"] || 0;
          drawTaxCredited += draws["TAX_CREDITED"] || 0;
          drawNonQualified += draws["NON_QUALIFIED"] || 0;

          if (acc.category === "RETIREMENT") {
            retirementPreTax += drawAmount;
          } else if (acc.category === "PERSONAL") {
            personalPreTax += drawAmount;
          } else if (acc.category === "INSURANCE") {
            insurancePreTax += drawAmount;
          }

          // 수령한도 검사 및 이연퇴직소득세 계산
          const limit = calcWithdrawalLimit(acc.balance + drawAmount, k);
          if (draws["DEFERRED_RETIREMENT"]) {
            taxOnRetirement += calcTaxOnDeferredRetirement(
              draws["DEFERRED_RETIREMENT"],
              retirementLumpSumTaxRate,
              k,
              limit
            );
          }
        });
      }

      // 2.3 연도 말 계좌 잔액 갱신 (운용수익 복리 + 은퇴 전 적립)
      accounts.forEach((acc) => {
        // 연도 말 계좌 잔액의 자산 운용 수익률 반영 복리 증가, 기여금 추가 및 세제 재원 동기화
        const returnRate = acc.expectedReturnRate / 100;

        // A. 수령 개시 전인 경우 (age < acc.payoutStartAge)
        if (age < acc.payoutStartAge) {
          if (acc.pensionType === "DB") {
            // DB형 퇴직연금: 은퇴 전까지는 급여인상률 반영된 퇴직금 적립
            if (age < simulationParams.retirementAge) {
              const yearsToRetireOffset = age - currentAge + 1; // 1년 경과 반영
              const avgSalary = (acc.avgSalary || 0) * 10000;
              const serviceYears = (acc.yearsOfService || 0) + yearsToRetireOffset;
              const growthRate = (acc.salaryGrowthRate || 0) / 100;
              const salaryAtAge = avgSalary * Math.pow(1 + growthRate, yearsToRetireOffset);
              
              acc.balance = Math.round(salaryAtAge * serviceYears);
              acc.sources = [{ taxType: "DEFERRED_RETIREMENT", amount: acc.balance }];
            } else {
              // 은퇴 이후 인출 개시 전까지는 퇴직소득세 이연된 채로 복리 운용
              const interest = acc.balance * returnRate;
              const roundedInterest = Math.round(interest);
              acc.balance += roundedInterest;
              
              // 은퇴 이후 복리 수익은 이연퇴직소득(퇴직소득세 감면 대상)으로 유지
              const sourceIdx = acc.sources.findIndex((s) => s.taxType === "DEFERRED_RETIREMENT");
              if (sourceIdx !== -1) {
                acc.sources[sourceIdx].amount += roundedInterest;
              } else {
                acc.sources.push({ taxType: "DEFERRED_RETIREMENT", amount: roundedInterest });
              }
            }
          } else {
            // DC형, 개인연금, 연금보험의 축적/거치 시기
            let contributionCompounded = 0;
            
            if (age < simulationParams.retirementAge) {
              // 은퇴 전 납입 시기
              if (acc.category === "RETIREMENT" && (acc.pensionType === "DC" || acc.pensionType === "IRP")) {
                const totalMonthlyDeposit = ((acc.monthlyContribution || 0) + (acc.companyMatchRate || 0)) * 10000;
                const monthlyRate = returnRate / 12;
                contributionCompounded = returnRate > 0
                  ? totalMonthlyDeposit * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate)
                  : totalMonthlyDeposit * 12;
                  
                // DC 기여금은 DEFERRED_RETIREMENT 재원으로 누적
                const sourceIdx = acc.sources.findIndex((s) => s.taxType === "DEFERRED_RETIREMENT");
                if (sourceIdx !== -1) {
                  acc.sources[sourceIdx].amount += Math.round(contributionCompounded);
                } else {
                  acc.sources.push({ taxType: "DEFERRED_RETIREMENT", amount: Math.round(contributionCompounded) });
                }
              } else if (acc.category === "PERSONAL") {
                const totalMonthlyDeposit = (acc.monthlyAnnualContribution || 0) * 10000;
                const monthlyRate = returnRate / 12;
                contributionCompounded = returnRate > 0
                  ? totalMonthlyDeposit * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate)
                  : totalMonthlyDeposit * 12;
                  
                // 개인연금 기여금은 세액공제 비율에 맞춰 분배 누적
                const ratio = acc.personalTaxCreditRatio ?? 0.8;
                const creditedContribution = contributionCompounded * ratio;
                const nonCreditedContribution = contributionCompounded * (1 - ratio);
                
                const idxCredited = acc.sources.findIndex((s) => s.taxType === "TAX_CREDITED");
                if (idxCredited !== -1) {
                  acc.sources[idxCredited].amount += Math.round(creditedContribution);
                } else {
                  acc.sources.push({ taxType: "TAX_CREDITED", amount: Math.round(creditedContribution) });
                }
                
                const idxNonCredited = acc.sources.findIndex((s) => s.taxType === "NON_CREDITED");
                if (idxNonCredited !== -1) {
                  acc.sources[idxNonCredited].amount += Math.round(nonCreditedContribution);
                } else {
                  acc.sources.push({ taxType: "NON_CREDITED", amount: Math.round(nonCreditedContribution) });
                }
              } else if (acc.category === "INSURANCE") {
                const yearsPassed = age - currentAge;
                if (yearsPassed < (acc.paymentPeriod || 0)) {
                  const totalMonthlyDeposit = (acc.monthlyPayment || 0) * 10000;
                  const monthlyRate = returnRate / 12;
                  contributionCompounded = returnRate > 0
                    ? totalMonthlyDeposit * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate)
                    : totalMonthlyDeposit * 12;
                    
                  const sourceIdx = acc.sources.findIndex((s) => s.taxType === "NON_QUALIFIED");
                  if (sourceIdx !== -1) {
                    acc.sources[sourceIdx].amount += Math.round(contributionCompounded);
                  } else {
                    acc.sources.push({ taxType: "NON_QUALIFIED", amount: Math.round(contributionCompounded) });
                  }
                }
              }
            }
            
            // 기존 평가금의 복리 증액
            const interest = acc.balance * returnRate;
            const roundedInterest = Math.round(interest);

            acc.balance = acc.balance + roundedInterest + Math.round(contributionCompounded);

            // 복리 증액분에 대한 세제원 가산
            // 퇴직연금 운용수익은 이연퇴직소득으로 유지 (퇴직소득세 감면 적용 대상)
            const targetTaxType: SourceTaxType =
              acc.category === "INSURANCE" ? "NON_QUALIFIED"
              : acc.category === "RETIREMENT" ? "DEFERRED_RETIREMENT"
              : "TAX_CREDITED";

            const sourceIdx = acc.sources.findIndex((s) => s.taxType === targetTaxType);
            if (sourceIdx !== -1) {
              acc.sources[sourceIdx].amount += roundedInterest;
            } else {
              acc.sources.push({ taxType: targetTaxType, amount: roundedInterest });
            }
          }
        }
        // B. 수령 개시 이후인 경우 (age >= acc.payoutStartAge)
        else if (acc.balance > 0) {
          const interest = acc.balance * returnRate;
          const roundedInterest = Math.round(interest);
          acc.balance += roundedInterest;

          // 퇴직연금 운용수익은 이연퇴직소득으로 유지 (퇴직소득세 감면 적용 대상)
          const targetTaxType: SourceTaxType =
            acc.category === "INSURANCE" ? "NON_QUALIFIED"
            : acc.category === "RETIREMENT" ? "DEFERRED_RETIREMENT"
            : "TAX_CREDITED";

          const sourceIdx = acc.sources.findIndex((s) => s.taxType === targetTaxType);
          if (sourceIdx !== -1) {
            acc.sources[sourceIdx].amount += roundedInterest;
          } else {
            acc.sources.push({ taxType: targetTaxType, amount: roundedInterest });
          }
        }
      });

      // 2.4 세액공제분 및 공적연금 종합 과세 계산
      let taxOnPersonalYear = 0;
      let taxOnNationalYear = 0;

      if (drawTaxCredited > 0) {
        // 공적연금 중 과세대상 소득
        const publicPensionTaxable = nationalPreTax * publicPensionTaxableRatio;
        const lowLimit = drawTaxCredited; // 각 계좌별로 분할되어 들어왔을 것이나, 연간 단위로 합산하여 한도 관리
        
        const { tax } = calcTaxOnCredited(
          drawTaxCredited,
          age,
          Infinity, // 한도 초과 평가는 M3-1의 수령한도를 별도 계좌별로 이미 계산했으므로 무제한 설정
          otherIncomeAnnual, // 연 단위 종합소득 직접 전달
          publicPensionTaxable,
          false // 종합과세 선택 자동 검사 활성화
        );
        taxOnPersonalYear = tax;
      }

      // 공적 국민연금 소득세 계산
      if (nationalPreTax > 0) {
        taxOnNationalYear = calcTaxOnPublicPension(
          nationalPreTax,
          publicPensionTaxableRatio,
          otherIncomeAnnual
        );
      }

      // 2.5 건강보험료 추정 (재산·금융소득 기준 포함)
      const { isDependentLost, estimatedPremium } = assessHealthInsurance(
        nationalPreTax,
        otherIncomeAnnual,
        (simulationParams.propertyTaxBase || 0) * 10000,
        (simulationParams.financialIncome || 0) * 10000
      );
      if (isDependentLost && !lostDependencyAge) {
        lostDependencyAge = age;
      }

      const totalPreTax =
        nationalPreTax +
        basicPreTax +
        retirementPreTax +
        personalPreTax +
        insurancePreTax;

      const totalTax = taxOnRetirement + taxOnPersonalYear + taxOnNationalYear;
      const totalTaxAndHI = totalTax + estimatedPremium;
      const totalPostTax = Math.max(0, totalPreTax - totalTaxAndHI);

      const endingBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

      // 목표 생활비 대비 부족액 검사 (월 단위 생활비 -> 연 단위 환산)
      const targetAnnualSpending = (simulationParams.targetMonthlySpending || 300) * 12 * 10000;
      const deficit = Math.max(0, targetAnnualSpending - totalPostTax);
      if (deficit > 0 && age >= simulationParams.retirementAge) {
        hasDeficit = true;
      }

      lifetimeTotalPreTax += totalPreTax;
      lifetimeTotalPostTax += totalPostTax;
      lifetimeTotalTaxAndHI += totalTaxAndHI;
      lifetimeTotalTax += totalTax;
      lifetimeTotalHI += estimatedPremium;

      flows.push({
        age,
        year,
        nationalPreTax: Math.round(nationalPreTax / 10000), // 화면 표시용 만원 단위 변환
        basicPreTax: Math.round(basicPreTax / 10000),
        retirementPreTax: Math.round(retirementPreTax / 10000),
        personalPreTax: Math.round(personalPreTax / 10000),
        insurancePreTax: Math.round(insurancePreTax / 10000),
        totalPreTax: Math.round(totalPreTax / 10000),
        drawNonCredited: Math.round(drawNonCredited / 10000),
        drawDeferredRetirement: Math.round(drawDeferredRetirement / 10000),
        drawTaxCredited: Math.round(drawTaxCredited / 10000),
        drawNonQualified: Math.round(drawNonQualified / 10000),
        taxOnNational: Math.round(taxOnNationalYear / 10000),
        taxOnRetirement: Math.round(taxOnRetirement / 10000),
        taxOnPersonal: Math.round(taxOnPersonalYear / 10000),
        healthInsurance: Math.round(estimatedPremium / 10000),
        totalTaxAndHI: Math.round(totalTaxAndHI / 10000),
        totalPostTax: Math.round(totalPostTax / 10000),
        endingBalance: Math.round(endingBalance / 10000),
        deficit: Math.round(deficit / 10000),
      });
    }

    return {
      strategyId,
      strategyName,
      lifetimeTotalPreTax: Math.round(lifetimeTotalPreTax / 10000),
      lifetimeTotalPostTax: Math.round(lifetimeTotalPostTax / 10000),
      lifetimeTotalTaxAndHI: Math.round(lifetimeTotalTaxAndHI / 10000),
      lifetimeTotalTax: Math.round(lifetimeTotalTax / 10000),
      lifetimeTotalHI: Math.round(lifetimeTotalHI / 10000),
      hasCrevasse,
      hasDeficit,
      lostDependencyAge,
      flows,
    };
  };

  const s0 = simulateStrategy("S0", "현재 계약대로 수령 (균등인출)");
  const s1 = simulateStrategy("S1", "절세 평탄화 인출전략");
  const s2 = simulateStrategy("S2", "절세형 + 국민연금 5년 연기");
  const s3 = simulateStrategy("S3", "사용자 정의 커스텀 전략");

  return { s0, s1, s2, s3 };
}
