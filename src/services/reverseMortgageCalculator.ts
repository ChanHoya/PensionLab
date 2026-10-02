/**
 * 한국주택금융공사(HF) 주택연금(역모기지) 월지급금 산정 엔진
 * 공시 기준 연령별 주택가격 1억원당 월지급금 계수 (종신지급방식 · 정액형)
 */

export interface ReverseMortgageCoefficient {
  age: number;
  monthlyPer100M: number; // 주택가격 1억원당 월지급금 (원)
}

export const HF_COEFFICIENTS: ReverseMortgageCoefficient[] = [
  { age: 55, monthlyPer100M: 160000 },
  { age: 60, monthlyPer100M: 214000 },
  { age: 65, monthlyPer100M: 268000 },
  { age: 70, monthlyPer100M: 325000 },
  { age: 75, monthlyPer100M: 397000 },
  { age: 80, monthlyPer100M: 504000 },
  { age: 85, monthlyPer100M: 680000 },
  { age: 90, monthlyPer100M: 890000 },
];

export const HF_MAX_PROPERTY_PRICE_WON = 1200000000; // 공시가격 12억원 상한

/**
 * 나이에 따른 1억원당 월지급금 선형 보간 (Linear Interpolation)
 */
export function getMonthlyPer100M(age: number): number {
  if (age < 55) return 0; // 가입 불가
  if (age <= 55) return HF_COEFFICIENTS[0].monthlyPer100M;
  if (age >= 90) return HF_COEFFICIENTS[HF_COEFFICIENTS.length - 1].monthlyPer100M;

  for (let i = 0; i < HF_COEFFICIENTS.length - 1; i++) {
    const cur = HF_COEFFICIENTS[i];
    const next = HF_COEFFICIENTS[i + 1];
    if (age >= cur.age && age <= next.age) {
      const ratio = (age - cur.age) / (next.age - cur.age);
      return Math.round(cur.monthlyPer100M + ratio * (next.monthlyPer100M - cur.monthlyPer100M));
    }
  }

  return HF_COEFFICIENTS[HF_COEFFICIENTS.length - 1].monthlyPer100M;
}

export interface ReverseMortgageEstimate {
  houseValueWon: number; // 적용 주택가격 (원)
  effectiveHouseValueWon: number; // 상한(12억) 적용 주택가격
  age: number; // 가입 나이 (부부 중 연소자 기준 또는 본인 나이)
  isEligible: boolean; // 만 55세 이상 여부
  monthlyPer100M: number; // 1억원당 월지급금
  monthlyPayoutWon: number; // 월지급금 (원)
  monthlyPayoutManwon: number; // 월지급금 (만원)
  annualPayoutWon: number; // 연간 지급금 (원)
  cumulative80Won: number; // 80세까지 누적 수령액
  cumulative85Won: number; // 85세까지 누적 수령액
  cumulative90Won: number; // 90세까지 누적 수령액
  benefits: {
    lifetimeResidence: boolean; // 평생 거주 보장
    nonRecourse: boolean; // 비소구 대출 (부족분 미청구, 잉여금 상속인 반환)
    propertyTaxRelief: string; // 재산세 25% 감면 (5억원 이하 주택)
    interestDeduction: string; // 대출이자비용 연 200만원 한도 소득공제
  };
}

/**
 * 주택가격(원) 및 가입 나이 기준 주택연금 월지급금 산출
 */
export function calculateReverseMortgage(houseValueWon: number, age: number): ReverseMortgageEstimate {
  const isEligible = age >= 55;
  const effectiveHouseValueWon = Math.min(houseValueWon, HF_MAX_PROPERTY_PRICE_WON);
  const monthlyPer100M = getMonthlyPer100M(age);

  // 월지급금 = (적용주택가격 / 1억원) * 1억원당 월지급금
  const monthlyPayoutWon = isEligible ? Math.round((effectiveHouseValueWon / 100000000) * monthlyPer100M) : 0;
  const monthlyPayoutManwon = Math.round(monthlyPayoutWon / 10000);
  const annualPayoutWon = monthlyPayoutWon * 12;

  // 누적 수령액
  const yearsTo80 = Math.max(0, 80 - age);
  const yearsTo85 = Math.max(0, 85 - age);
  const yearsTo90 = Math.max(0, 90 - age);

  return {
    houseValueWon,
    effectiveHouseValueWon,
    age,
    isEligible,
    monthlyPer100M,
    monthlyPayoutWon,
    monthlyPayoutManwon,
    annualPayoutWon,
    cumulative80Won: annualPayoutWon * yearsTo80,
    cumulative85Won: annualPayoutWon * yearsTo85,
    cumulative90Won: annualPayoutWon * yearsTo90,
    benefits: {
      lifetimeResidence: true,
      nonRecourse: true,
      propertyTaxRelief: houseValueWon <= 500000000 ? "재산세 25% 감면 혜택 적용" : "일반 재산세 부과",
      interestDeduction: "연금 대출이자 연 200만원 한도 소득공제",
    },
  };
}
