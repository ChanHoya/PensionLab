import { BASIC_PENSION_RULES as R, type Region } from "@/config/basicPensionRules";

export interface BasicPensionPerson {
  alive: boolean;
  age: number;
  earnedIncome: number; // 상시근로소득 (만원/월)
  otherIncome: number; // 사업·임대·이자·배당·사적연금 등 (만원/월, 100% 반영)
  nationalPension: number; // 그 해 받는 국민연금(유족연금 포함, 만원/월)
  aShare: number; // 국민연금 중 A급여(소득재분배) 비율 ≈ A / (A + B)
  occupational: boolean; // 공무원·사학·군인·별정우체국연금 수급권자
}

export interface BasicPensionHousehold {
  region: Region;
  generalProperty: number; // 일반재산(주택 공시가격 등, 만원)
  financialAssets: number; // 금융재산 (만원)
  debts: number; // 부채 (만원)
  luxuryAssets: number; // 고급 차량·회원권 가액 (만원, 전액 월 소득 반영)
}

export interface BasicPensionResult {
  recognizedIncome: number; // 소득인정액 (월)
  threshold: number; // 선정기준액 (월)
  eligible: boolean;
  self: number; // 본인 기초연금 (월)
  spouse: number; // 배우자 기초연금 (월)
  notes: string[];
}

// 모든 금액 기준은 2026년 값 × index (물가 지수, 2026년 = 1)
export function calcBasicPension(
  self: BasicPensionPerson,
  spouse: BasicPensionPerson | null,
  hh: BasicPensionHousehold,
  index = 1
): BasicPensionResult {
  const notes: string[] = [];
  const people = [self, spouse].filter((p): p is BasicPensionPerson => !!p && p.alive);
  const couple = people.length === 2;
  const threshold = (couple ? R.thresholdCouple : R.thresholdSingle) * index;
  const base = R.baseAmount * index;

  const incomeEval = people.reduce(
    (sum, p) =>
      sum +
      Math.max(0, p.earnedIncome - R.earnedIncomeDeduction * index) * R.earnedIncomeRatio +
      p.otherIncome +
      p.nationalPension,
    0
  );
  const netProperty =
    Math.max(0, hh.generalProperty - R.propertyDeduction[hh.region] * index) +
    Math.max(0, hh.financialAssets - R.financialDeduction * index) -
    hh.debts;
  const propertyIncome = (Math.max(0, netProperty) * R.propertyConversionRate) / 12 + hh.luxuryAssets;
  const recognizedIncome = incomeEval + propertyIncome;

  const empty = { recognizedIncome, threshold, eligible: false, self: 0, spouse: 0, notes };
  if (people.some((p) => p.occupational)) {
    notes.push("직역연금(공무원·사학·군인·별정우체국) 수급권자와 그 배우자는 기초연금 대상에서 제외됩니다.");
    return empty;
  }
  if (recognizedIncome > threshold) {
    notes.push(`소득인정액(월 ${recognizedIncome.toFixed(1)}만원)이 선정기준액(월 ${threshold.toFixed(1)}만원)을 넘습니다.`);
    return empty;
  }

  // 1) 국민연금 연계감액: 국민연금 > 기준연금액 150%이면
  //    max((기준연금액 − ⅔ × A급여) + 부가연금액, 기준연금액 × 250% − 국민연금), [부가연금액, 기준연금액] 범위
  const amountFor = (p: BasicPensionPerson | null): number => {
    if (!p || !p.alive || p.age < R.eligibleAge) return 0;
    if (p.nationalPension <= base * R.linkageTriggerRatio) return base;
    const aBenefit = p.nationalPension * p.aShare;
    const byA = base - (2 / 3) * aBenefit + base * R.additionalRatio;
    const byTotal = base * R.linkageAltRatio - p.nationalPension;
    return Math.min(base, Math.max(base * R.additionalRatio, Math.max(byA, byTotal)));
  };
  let s = amountFor(self);
  let sp = amountFor(spouse);

  // 2) 부부 모두 수급하면 각각 20% 감액
  if (s > 0 && sp > 0) {
    s *= 1 - R.coupleReduction;
    sp *= 1 - R.coupleReduction;
    notes.push("부부가 모두 받으므로 각각 20% 감액했습니다.");
  }

  // 3) 소득역전방지: 소득인정액 + 기초연금이 선정기준액을 넘으면 넘는 만큼 감액 (최저 기준연금액의 10%)
  const total = s + sp;
  if (total > 0 && recognizedIncome + total > threshold) {
    const allowed = Math.max(0, threshold - recognizedIncome);
    const ratio = allowed / total;
    s = s > 0 ? Math.max(base * R.minPaymentRatio, s * ratio) : 0;
    sp = sp > 0 ? Math.max(base * R.minPaymentRatio, sp * ratio) : 0;
    notes.push("소득인정액과 기초연금 합계가 선정기준액을 넘어 소득역전방지 감액을 적용했습니다.");
  }
  return { recognizedIncome, threshold, eligible: s + sp > 0, self: s, spouse: sp, notes };
}
