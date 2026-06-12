import {
  NationalPensionState,
  BasicPensionState,
  RetirementPensionState,
  PersonalPensionSavingsState,
  PensionInsuranceState,
  SimulationParamsState,
} from "@/store/usePensionStore";

export interface CashFlowItem {
  age: number;
  year: number;
  national: number; // Monthly payout (in ten thousand KRW, 만원)
  basic: number;    // Monthly payout
  retirement: number; // Monthly payout
  personal: number; // Monthly payout
  insurance: number; // Monthly payout
  total: number; // Total monthly payout
  cumulativePremiums: number; // Cumulative premiums paid to date
}

export interface SimulationResult {
  currentAge: number;
  yearsToRetire: number;
  totalAccumulatedAtRetirement: number; // Total asset value at retirement (Retirement + Personal + Insurance)
  monthlyAnnuityAtRetirement: number; // Total monthly annuity at retirement age
  nationalPensionPremiumIncreaseTotal: number; // Extra premiums paid due to 2026 reform
  cashFlows: CashFlowItem[];
}

/**
 * Calculates the future value of a single sum
 */
function calculateFV(pv: number, rate: number, nper: number): number {
  return pv * Math.pow(1 + rate / 100, nper);
}

/**
 * Calculates the future value of an annuity (regular monthly deposits)
 */
function calculateFVAnnuity(pmt: number, rate: number, nperMonths: number): number {
  if (rate === 0) return pmt * nperMonths;
  const monthlyRate = rate / 12 / 100;
  return pmt * ((Math.pow(1 + monthlyRate, nperMonths) - 1) / monthlyRate);
}

/**
 * Converts a lump sum into a monthly payout for a fixed period (in years)
 * using a PMT-style calculation with a discount rate.
 */
function calculateAnnuityPayout(lumpSum: number, periodYears: number, expectedReturnRate: number): number {
  if (periodYears <= 0) return 0;
  const nperMonths = periodYears * 12;
  const monthlyRate = expectedReturnRate / 12 / 100;
  
  if (monthlyRate === 0) return lumpSum / nperMonths;
  
  // standard PMT formula: PMT = r * PV / (1 - (1 + r)^-n)
  return (monthlyRate * lumpSum) / (1 - Math.pow(1 + monthlyRate, -nperMonths));
}

export function runPensionSimulation(
  national: NationalPensionState,
  basic: BasicPensionState,
  retirement: RetirementPensionState[],
  personal: PersonalPensionSavingsState[],
  insurance: PensionInsuranceState[],
  params: SimulationParamsState
): SimulationResult {
  const currentYear = new Date().getFullYear();

  // 1. Dynamic current age inference or use store param
  const remainingMonthsToPay = Math.max(0, national.expectedTotalContributionMonths - national.contributionMonths);
  const yearsToRetireInferred = Math.ceil(remainingMonthsToPay / 12);
  const currentAge = params.currentAge || Math.max(20, params.retirementAge - yearsToRetireInferred);
  const yearsToRetire = Math.max(0, params.retirementAge - currentAge);
  const expectedLife = params.expectedLifeExpectancy;

  // 2. Identify Generation (born year) for 2026 Reform Schedule
  const birthYear = currentYear - currentAge;
  
  // Generational premium speed increase schedule
  // 50s (born 1968-1977): +1.0% per year to reach 13%
  // 40s (born 1978-1987): +0.75% per year to reach 13%
  // 30s (born 1988-1997): +0.50% per year to reach 13%
  // 20s (born 1998-later): +0.25% per year to reach 13%
  let annualPremiumIncrement = 0.5; // default 30s
  if (birthYear >= 1998) {
    annualPremiumIncrement = 0.25;
  } else if (birthYear >= 1978 && birthYear <= 1987) {
    annualPremiumIncrement = 0.75;
  } else if (birthYear <= 1977) {
    annualPremiumIncrement = 1.0;
  }

  // 3. Project Retirement Pension (2층)
  let retirementLumpSum = 0;
  retirement.forEach((r) => {
    if (r.pensionType === "DB") {
      const avgSalary = r.avgSalary || 0;
      const serviceYears = (r.yearsOfService || 0) + yearsToRetire;
      const growthRate = r.salaryGrowthRate || 0;
      // final salary at retirement = avgSalary * (1 + growthRate)^yearsToRetire
      const finalSalary = avgSalary * Math.pow(1 + growthRate / 100, yearsToRetire);
      // DB Lump sum = final average salary * service years
      retirementLumpSum += finalSalary * serviceYears;
    } else {
      // DC or IRP — use real return rate (nominal - inflation) to express result in today's purchasing power
      const accumulated = r.totalAccumulated || 0;
      const monthlyContribution = r.monthlyContribution || 0;
      const matchAmt = r.companyMatchRate || 0;
      const totalMonthlyDeposit = monthlyContribution + matchAmt;
      const returnRate = Math.max(0.5, (r.expectedReturnRate || 3.0) - params.inflationRate);

      const fvCurrent = calculateFV(accumulated, returnRate, yearsToRetire);
      const fvDeposits = calculateFVAnnuity(totalMonthlyDeposit, returnRate, yearsToRetire * 12);

      retirementLumpSum += (fvCurrent + fvDeposits);
    }
  });

  // Convert retirement lump sum to a monthly annuity (assume received for 20 years or until expectancy)
  const retirementAnnuityYears = Math.max(10, expectedLife - params.retirementAge);
  const retirementPayoutRate = Math.max(0.5, 3.0 - params.inflationRate);
  const monthlyRetirementPayout = calculateAnnuityPayout(retirementLumpSum, retirementAnnuityYears, retirementPayoutRate);

  // 4. Project Personal Pension Savings (3층 - 연금저축)
  let personalLumpSum = 0;
  personal.forEach((p) => {
    const yearsToStart = Math.max(0, p.desiredStartAge - currentAge);
    const monthsToPay = Math.max(0, Math.min(yearsToStart, params.retirementAge - currentAge) * 12);

    // Real return rate = nominal return rate - inflation rate
    const nominalRate = p.savingsType === "FUND" ? 4.5 : 2.5;
    const returnRate = Math.max(0.5, nominalRate - params.inflationRate);

    const fvCurrent = calculateFV(p.totalAccumulated, returnRate, yearsToStart);
    const fvDeposits = calculateFVAnnuity(p.monthlyAnnualContribution, returnRate, monthsToPay);
    const deferredYears = Math.max(0, p.desiredStartAge - params.retirementAge);
    const fvDepositsCompounded = calculateFV(fvDeposits, returnRate, deferredYears);

    personalLumpSum += (fvCurrent + fvDepositsCompounded);
  });

  // 5. Project Pension Insurance (3층 - 연금보험)
  let insuranceLumpSum = 0;
  insurance.forEach((i) => {
    const paymentYears = Math.min(i.paymentPeriod, yearsToRetire);
    const yearsToStart = yearsToRetire;

    // Real return rate = declared rate - inflation rate
    const realRate = Math.max(0.5, i.expectedDeclaredRate - params.inflationRate);

    const fvCurrent = calculateFV(i.totalAccumulated, realRate, yearsToStart);
    const fvPayments = calculateFVAnnuity(i.monthlyPayment, realRate, paymentYears * 12);
    const deferredYears = Math.max(0, yearsToStart - paymentYears);
    const fvPaymentsCompounded = calculateFV(fvPayments, realRate, deferredYears);

    insuranceLumpSum += (fvCurrent + fvPaymentsCompounded);
  });

  // Total accumulated assets at retirement (lump sums)
  const totalAccumulatedAtRetirement = retirementLumpSum + personalLumpSum + insuranceLumpSum;

  // 6. Generate Cash Flows Year by Year
  const cashFlows: CashFlowItem[] = [];
  let cumulativePremiums = national.totalPaidAmount;
  let reformPremiumTotal = 0;
  let currentPremiumRate = 9.0; // Starting rate

  for (let age = currentAge; age <= expectedLife; age++) {
    const yearOffset = age - currentAge;
    const year = currentYear + yearOffset;
    
    let nationalPayout = 0;
    let basicPayout = 0;
    let retirementPayout = 0;
    let personalPayout = 0;
    let insurancePayout = 0;

    // 6a. Premium Calculations (prior to retirement)
    if (age < params.retirementAge) {
      // Calculate premium rates reflecting 2026 reform schedule (increasing up to 13%)
      // Reform starts in 2026. Let's assume year-by-year step up.
      if (year >= 2026 && currentPremiumRate < 13.0) {
        currentPremiumRate = Math.min(13.0, currentPremiumRate + annualPremiumIncrement);
      }
      
      const standardIncome = national.currentStandardMonthlyIncome;
      // Normal premium at 9%
      const normalPremium = standardIncome * 0.09 * 12;
      // Reform premium (actual paid)
      const reformPremium = standardIncome * (currentPremiumRate / 100) * 12;
      
      cumulativePremiums += reformPremium;
      reformPremiumTotal += (reformPremium - normalPremium);
    }

    // 6b. Payout Calculations (after retirement / start age)
    // National Pension Payout
    if (age >= params.nationalPensionStartAge) {
      // Indexed to inflation in real life (stays constant in real terms, grows in nominal terms)
      // We return values in real terms (today's KRW value)
      nationalPayout = national.expectedMonthlyPension;
    }

    // Basic Pension Payout
    if (age >= 65) {
      basicPayout = basic.expectedMonthlyAmount;
    }

    // 은퇴 후 년수 계산 (체감형 인출 가중치 적용용 - Spending Smile)
    const yearsSinceRetirement = Math.max(0, age - params.retirementAge);
    let decumulationMultiplier = 1.0;
    if (params.decumulationStrategy === "DECREASING" && age >= params.retirementAge) {
      if (yearsSinceRetirement <= 5) {
        decumulationMultiplier = 1.2; // 0~5년차 (활동기: 120%)
      } else if (yearsSinceRetirement <= 10) {
        decumulationMultiplier = 1.0; // 6~10년차 (안정기: 100%)
      } else if (yearsSinceRetirement <= 15) {
        decumulationMultiplier = 0.8; // 11~15년차 (쇠퇴기: 80%)
      } else if (yearsSinceRetirement <= 20) {
        decumulationMultiplier = 0.6; // 16~20년차 (보호기: 60%)
      } else {
        decumulationMultiplier = 0.4; // 21년차 이후 (초고령 실버기: 40%)
      }
    }

    // Retirement Pension Payout
    if (age >= params.retirementAge && age < params.retirementAge + retirementAnnuityYears) {
      retirementPayout = monthlyRetirementPayout * decumulationMultiplier;
    }

    // Personal Pension Savings Payout
    personal.forEach((p) => {
      if (age >= p.desiredStartAge && age < p.desiredStartAge + p.receivingPeriod) {
        const pNominalRate = p.savingsType === "FUND" ? 4.5 : 2.5;
        const pRealRate = Math.max(0.5, pNominalRate - params.inflationRate);
        const pLump = calculateFV(p.totalAccumulated, pRealRate, Math.max(0, p.desiredStartAge - currentAge)) +
          calculateFV(calculateFVAnnuity(p.monthlyAnnualContribution, pRealRate, Math.max(0, Math.min(p.desiredStartAge - currentAge, params.retirementAge - currentAge)) * 12), pRealRate, Math.max(0, p.desiredStartAge - params.retirementAge));

        const payout = calculateAnnuityPayout(pLump, p.receivingPeriod, pRealRate);
        
        // 개인연금 수령 시작 후 나이에 맞춰 체감률 적용
        const yearsSinceStart = Math.max(0, age - p.desiredStartAge);
        let personalMultiplier = 1.0;
        if (params.decumulationStrategy === "DECREASING") {
          if (yearsSinceStart <= 5) personalMultiplier = 1.2;
          else if (yearsSinceStart <= 10) personalMultiplier = 1.0;
          else if (yearsSinceStart <= 15) personalMultiplier = 0.8;
          else if (yearsSinceStart <= 20) personalMultiplier = 0.6;
          else personalMultiplier = 0.4;
        }

        personalPayout += payout * personalMultiplier;
      }
    });

    // Pension Insurance Payout
    insurance.forEach((i) => {
      const payoutYears = Math.max(20, expectedLife - params.retirementAge);
      if (age >= params.retirementAge && age < params.retirementAge + payoutYears) {
        const iRealRate = Math.max(0.5, i.expectedDeclaredRate - params.inflationRate);
        const iLump = calculateFV(i.totalAccumulated, iRealRate, yearsToRetire) +
          calculateFV(calculateFVAnnuity(i.monthlyPayment, iRealRate, Math.min(i.paymentPeriod, yearsToRetire) * 12), iRealRate, Math.max(0, yearsToRetire - Math.min(i.paymentPeriod, yearsToRetire)));

        const payout = calculateAnnuityPayout(iLump, payoutYears, iRealRate);
        insurancePayout += payout * decumulationMultiplier;
      }
    });

    const total = nationalPayout + basicPayout + retirementPayout + personalPayout + insurancePayout;

    cashFlows.push({
      age,
      year,
      national: Math.round(nationalPayout),
      basic: Math.round(basicPayout),
      retirement: Math.round(retirementPayout),
      personal: Math.round(personalPayout),
      insurance: Math.round(insurancePayout),
      total: Math.round(total),
      cumulativePremiums: Math.round(cumulativePremiums),
    });
  }

  // Calculate monthly annuity payout exactly at retirement age
  const retirementCashFlow = cashFlows.find((cf) => cf.age === params.retirementAge);
  const monthlyAnnuityAtRetirement = retirementCashFlow ? retirementCashFlow.total : 0;

  return {
    currentAge,
    yearsToRetire,
    totalAccumulatedAtRetirement: Math.round(totalAccumulatedAtRetirement),
    monthlyAnnuityAtRetirement,
    nationalPensionPremiumIncreaseTotal: Math.round(reformPremiumTotal),
    cashFlows,
  };
}
