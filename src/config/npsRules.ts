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
  deferralBonusPerYear: 0.072, // 연기연금 가산율 (월 0.6% × 12)
  maxDeferralYears: 5, // 연기 최대 5년
};

// 기본연금액(월, 만원) 근사: 비례상수 × (A + B) × 가입월수 / 240 ÷ 12
// 현행 비례상수(1.29) 기준이라 가입 시기별 소득대체율 차이는 반영하지 않는다 (표시용, 계산에는 예상연금월액을 쓴다)
export function estimateBasicPensionAmount(months: number, aValue: number, bValue: number): number {
  return (NPS_RULES.replacementConstant * (aValue + bValue) * months) / 240 / 12;
}

// 출생연도별 노령연금 법정 개시 나이 (1952년생 이전 60세, 4년마다 1세씩 늦춰져 1969년생 이후 65세)
export function statutoryPensionStartAge(birthYear: number): number {
  if (birthYear <= 1952) return 60;
  if (birthYear >= 1969) return 65;
  return 61 + Math.floor((birthYear - 1953) / 4);
}

export const EXCLUDED_ADDITIONAL_FROM_YM = "1999-04"; // 적용제외 기간 추납은 1999-04 이후만

// 2025년까지 9%, 2026년부터 매년 0.5%p 인상, 2033년 13%에서 고정
export function premiumRateForYear(year: number): number {
  if (year <= 2025) return 9.0;
  return Math.min(13.0, 9.0 + 0.5 * (year - 2025));
}

// 반환일시금 반납금·반납 분할이자에 쓰는 공단 고시 연도별 1년 만기 정기예금 이자율 (%)
// 출처: 국민연금공단 반환일시금 반납 안내(nps.or.kr/pnsinfo/ntpsklg/getOHAF0046M0.do), 2026-09 확인
export const DEPOSIT_RATE_BY_YEAR: Record<number, number> = {
  1988: 10, 1989: 10, 1990: 10, 1991: 10, 1992: 10, 1993: 10, 1994: 8.5, 1995: 9.1, 1996: 9.4, 1997: 9.4,
  1998: 9.3, 1999: 8.2, 2000: 7.0, 2001: 6.8, 2002: 4.3, 2003: 4.3, 2004: 3.6, 2005: 3.0, 2006: 3.2, 2007: 3.6,
  2008: 3.8, 2009: 3.7, 2010: 2.8, 2011: 2.7, 2012: 2.8, 2013: 2.6, 2014: 2.2, 2015: 1.8, 2016: 1.3, 2017: 1.0,
  2018: 1.4, 2019: 1.6, 2020: 1.1, 2021: 0.7, 2022: 1.2, 2023: 3.5, 2024: 3.0, 2025: 2.6, 2026: 2.2,
};

// 표에 없는 해는 가장 가까운 해의 이자율을 쓴다 (1988년 이전 → 1988년, 2026년 이후 → 2026년)
export function depositRateForYear(year: number): number {
  const clamped = Math.min(2026, Math.max(1988, year));
  return DEPOSIT_RATE_BY_YEAR[clamped];
}

// 가입 시기별 비례상수: 1988~1998 소득대체율 70%(2.4), 1999~2007 60%(1.8), 2008 50%(1.5),
// 2009~2025 매년 0.5%p 인하(1.5 − 0.015/년), 2026~ 43%(1.29)
export function replacementConstantForYear(year: number): number {
  if (year <= 1998) return 2.4;
  if (year <= 2007) return 1.8;
  if (year <= 2025) return 1.5 - 0.015 * (year - 2008);
  return NPS_RULES.replacementConstant;
}

// 1998년 이전 가입기간은 기본연금액을 (A + 0.75B)로 산정한다
export function bWeightForYear(year: number): number {
  return year <= 1998 ? 0.75 : 1;
}

// 유족연금 지급률: 사망자 가입기간 10년 미만 40%, 10~20년 50%, 20년 이상 60%
export function survivorRateForMonths(months: number): number {
  if (months < 120) return 0.4;
  if (months < 240) return 0.5;
  return 0.6;
}

// 중복급여 조정: 본인 노령연금을 고르면 유족연금의 30%를 더 받는다 (2016.11.30 이후)
export const SURVIVOR_OVERLAP_RATE = 0.3;

// 반환일시금 반납 분할 횟수: 종전 가입기간 1년 미만 3회, 1년 이상 5년 미만 12회, 5년 이상 24회
export function maxRefundInstallments(restoredMonths: number): number {
  if (restoredMonths < 12) return 3;
  if (restoredMonths < 60) return 12;
  return 24;
}
