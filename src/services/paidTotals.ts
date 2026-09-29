import type { PersonPensions } from "@/services/coupleSimulation";
import type { SimulationParamsState } from "@/store/usePensionStore";

// 연금 종류별 납부(적립) 총액, 만원. 그래프의 (납부총액/지급총액) 표기용
export interface PaidTotals {
  national: number;
  retirement: number;
  personal: number;
  insurance: number;
}

// 국민연금: 예상 납부보험료 총액(없으면 지금까지 납부한 금액)
// 퇴직 DC/IRP·연금저축·연금보험: 현재 적립금 + 은퇴(연금저축은 개시 나이)까지 낼 납입액 — 운용수익은 빼고 원금 기준
// DB형: 근로자 납입이 없어 퇴직 시 예상 퇴직금(최종 평균임금 × 근속연수)을 적립액으로 본다
// params는 그 사람 기준 (배우자는 personParams(params, "SPOUSE"))
export function paidTotalsOf(p: PersonPensions, params: SimulationParamsState): PaidTotals {
  const yearsToRetire = Math.max(0, params.retirementAge - params.currentAge);

  const retirement = p.retirementPensions.reduce((sum, r) => {
    if (r.pensionType === "DB") {
      const finalSalary = (r.avgSalary || 0) * Math.pow(1 + (r.salaryGrowthRate || 0) / 100, yearsToRetire);
      return sum + finalSalary * ((r.yearsOfService || 0) + yearsToRetire);
    }
    const monthly = (r.monthlyContribution || 0) + (r.companyMatchRate || 0);
    return sum + (r.totalAccumulated || 0) + monthly * 12 * yearsToRetire;
  }, 0);

  const personal = p.personalPensions.reduce((sum, s) => {
    const payYears = Math.max(0, Math.min(s.desiredStartAge - params.currentAge, yearsToRetire));
    return sum + s.totalAccumulated + s.monthlyAnnualContribution * 12 * payYears;
  }, 0);

  const insurance = p.pensionInsurances.reduce(
    (sum, i) => sum + i.totalAccumulated + i.monthlyPayment * 12 * Math.min(i.paymentPeriod, yearsToRetire),
    0
  );

  const n = p.national;
  return { national: n.totalExpectedPremium || n.totalPaidAmount || 0, retirement, personal, insurance };
}
