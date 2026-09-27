// 국민연금 추후납부(추납) 계산 룰셋
// 출처: 국민연금공단 추납 안내(nps.or.kr/pnsinfo/ntpsklg/getOHAF0047M0.do), 2026-09 확인
// A값·중위수·기준소득월액 상하한은 매년 바뀌므로 공단 고시 후 갱신한다.
export const NPS_RULES = {
  aValue: 319.3511, // 2026년 A값 (만원/월) — 임의가입자 추납 상한, 신청일 기준 A값 적용
  voluntaryIncomeFloor: 100, // 임의가입자 기준소득월액 하한 근사 (지역가입자 중위수, 만원)
  incomeFloor: 41, // 기준소득월액 하한 (2026.7~2027.6, 만원)
  incomeCap: 659, // 기준소득월액 상한 (2026.7~2027.6, 만원)
  maxAdditionalMonths: 119, // 추납 최대 개월수 (10년 미만)
  maxInstallments: 60, // 분할납부 최대 횟수
  minPensionMonths: 120, // 노령연금 최소 가입기간
  replacementConstant: 1.29, // 2026년~ 소득대체율 43%의 비례상수
  dependentIncomeCapAnnual: 2000, // 건보 피부양자 소득기준 (만원/년)
};

// 2025년까지 9%, 2026년부터 매년 0.5%p 인상, 2033년 13%에서 고정
export function premiumRateForYear(year: number): number {
  if (year <= 2025) return 9.0;
  return Math.min(13.0, 9.0 + 0.5 * (year - 2025));
}
