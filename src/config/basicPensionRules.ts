// 기초연금 2026년 기준 룰셋 — 출처: 복지로·보건복지부 기초연금 안내, 국민연금공단 연계감액 안내 (2026-09 확인)
// 기준연금액·선정기준액은 매년 1월 고시되므로 갱신한다. 금액 단위: 만원
export type Region = "METRO" | "CITY" | "RURAL";

export const BASIC_PENSION_RULES = {
  eligibleAge: 65, // 수급 연령
  baseAmount: 34.97, // 기준연금액 (월, 단독 기준)
  thresholdSingle: 247, // 선정기준액 단독가구 (월)
  thresholdCouple: 395.2, // 선정기준액 부부가구 (월)
  coupleReduction: 0.2, // 부부 모두 수급 시 각각 20% 감액
  earnedIncomeDeduction: 116, // 상시근로소득 1인당 기본공제 (월)
  earnedIncomeRatio: 0.7, // 공제 후 반영 비율
  propertyDeduction: { METRO: 13500, CITY: 8500, RURAL: 7250 } as Record<Region, number>, // 지역별 기본재산 공제
  financialDeduction: 2000, // 금융재산 공제 (가구당)
  propertyConversionRate: 0.04, // 재산 소득환산율 (연)
  linkageTriggerRatio: 1.5, // 국민연금이 기준연금액의 150% 초과 시 연계감액
  linkageAltRatio: 2.5, // 연계감액 대안 산식: 기준연금액 × 250% − 국민연금
  additionalRatio: 0.5, // 부가연금액 = 기준연금액 × 50% (연계감액 하한)
  minPaymentRatio: 0.1, // 소득역전방지 감액 후 최저 지급액 = 기준연금액 × 10%
};
