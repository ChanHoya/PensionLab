import { statutoryPensionStartAge } from "@/config/npsRules";

export interface NpsEarlyDeferralParams {
  baseMonthlyPension: number; // 정상수령 기준 월 예상액 (만원)
  birthYear: number; // 출생연도
  earlyYears?: number; // 조기 연수 (1~5년, 기본 5)
  deferYears?: number; // 연기 연수 (1~5년, 기본 5)
  inflationRate?: number; // 연간 물가상승률 (%, 기본 3.0)
  isRealValue?: boolean; // 현재가치(실질) 기준 여부 (기본 true)
  expectedLifeExpectancy?: number; // 사용자 기대수명 (예: 85세)
  maxAge?: number; // 시뮬레이션 종료 나이 (기본 95)
}

export interface AgeDataPoint {
  age: number;
  yearOffset: number;
  // 월 수령액 (만원)
  earlyMonthly: number;
  normalMonthly: number;
  deferMonthly: number;
  // 연간 수령액 (만원)
  earlyAnnual: number;
  normalAnnual: number;
  deferAnnual: number;
  // 누적 수령액 (만원)
  earlyCumulative: number;
  normalCumulative: number;
  deferCumulative: number;
}

export interface CrossoverPoint {
  ageExact: number; // 예: 76.7
  ageDisplay: string; // "만 76세 8개월"
  description: string;
}

export interface StrategyDetail {
  type: "EARLY" | "NORMAL" | "DEFER";
  title: string;
  badge: string;
  startAge: number;
  ratePercent: number; // 70%, 100%, 136%
  rateLabel: string; // "-30% 감액", "100% 정규", "+36% 증액"
  monthlyPension: number; // 만원
  annualPension: number; // 만원
  cumulativeAt80: number; // 80세 시점 누적액 (만원)
  cumulativeAt85: number; // 85세 시점 누적액 (만원)
  cumulativeAt90: number; // 90세 시점 누적액 (만원)
  totalAtMaxAge: number; // 최종 나이 시점 누적액 (만원)
  healthInsuranceRisk: boolean; // 연 2,000만원 초과 여부
  healthInsuranceNote: string;
  pros: string[];
  cons: string[];
  recommendTarget: string;
}

export interface NpsEarlyDeferralResult {
  birthYear: number;
  normalStartAge: number;
  earlyStartAge: number;
  deferStartAge: number;
  earlyYears: number;
  deferYears: number;
  baseMonthlyPension: number;
  isRealValue: boolean;
  inflationRate: number;
  expectedLifeExpectancy: number;

  // 손익분기 크로스오버 나이
  crossoverEarlyVsNormal: CrossoverPoint;
  crossoverNormalVsDefer: CrossoverPoint;
  crossoverEarlyVsDefer: CrossoverPoint;

  // 연령별 시계열 데이터 (차트용)
  dataPoints: AgeDataPoint[];

  // 3대 전략별 상세 스펙
  strategies: {
    early: StrategyDetail;
    normal: StrategyDetail;
    defer: StrategyDetail;
  };

  // 사용자 기대수명 기준 최종 추천 전략
  recommendedType: "EARLY" | "NORMAL" | "DEFER";
  recommendedReason: string;
  cfpPrescription: string[];
}

/**
 * 나이 소수점을 만 나이/개월수로 포맷 (예: 76.67 -> "만 76세 8개월")
 */
export function formatAgeWithMonths(exactAge: number): string {
  const years = Math.floor(exactAge);
  const months = Math.round((exactAge - years) * 12);
  if (months === 0) return `만 ${years}세`;
  if (months === 12) return `만 ${years + 1}세`;
  return `만 ${years}세 ${months}개월`;
}

/**
 * 국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 종합 계산 엔진
 */
export function calculateNpsEarlyDeferralBep(params: NpsEarlyDeferralParams): NpsEarlyDeferralResult {
  const {
    baseMonthlyPension,
    birthYear,
    earlyYears = 5,
    deferYears = 5,
    inflationRate = 3.0,
    isRealValue = true,
    expectedLifeExpectancy = 85,
    maxAge = 95,
  } = params;

  // 1. 법정 정상수령 나이 판정
  const normalStartAge = statutoryPensionStartAge(birthYear);
  const validEarlyYears = Math.min(5, Math.max(1, earlyYears));
  const validDeferYears = Math.min(5, Math.max(1, deferYears));

  const earlyStartAge = normalStartAge - validEarlyYears;
  const deferStartAge = normalStartAge + validDeferYears;

  // 2. 수령률 산정
  // 조기: 연 6% (월 0.5%) 감액
  const earlyRate = 1 - 0.06 * validEarlyYears;
  // 정상: 100%
  const normalRate = 1.0;
  // 연기: 연 7.2% (월 0.6%) 가산
  const deferRate = 1 + 0.072 * validDeferYears;

  // 기준 월 수령액 (현재가치)
  const earlyBaseMonthly = Math.round(baseMonthlyPension * earlyRate * 10) / 10;
  const normalBaseMonthly = baseMonthlyPension;
  const deferBaseMonthly = Math.round(baseMonthlyPension * deferRate * 10) / 10;

  // 3. 연령별 시계열 데이터 생성 (earlyStartAge ~ maxAge)
  const dataPoints: AgeDataPoint[] = [];
  let earlyCum = 0;
  let normalCum = 0;
  let deferCum = 0;

  for (let age = earlyStartAge; age <= maxAge; age++) {
    const yearOffset = age - earlyStartAge;
    const inflMultiplier = isRealValue ? 1 : Math.pow(1 + inflationRate / 100, yearOffset);

    // 조기수령
    const isEarlyReceiving = age >= earlyStartAge;
    const earlyMonthly = isEarlyReceiving ? Math.round(earlyBaseMonthly * inflMultiplier) : 0;
    const earlyAnnual = isEarlyReceiving ? earlyMonthly * 12 : 0;
    earlyCum += earlyAnnual;

    // 정상수령
    const isNormalReceiving = age >= normalStartAge;
    const normalMonthly = isNormalReceiving ? Math.round(normalBaseMonthly * inflMultiplier) : 0;
    const normalAnnual = isNormalReceiving ? normalMonthly * 12 : 0;
    normalCum += normalAnnual;

    // 연기수령
    const isDeferReceiving = age >= deferStartAge;
    const deferMonthly = isDeferReceiving ? Math.round(deferBaseMonthly * inflMultiplier) : 0;
    const deferAnnual = isDeferReceiving ? deferMonthly * 12 : 0;
    deferCum += deferAnnual;

    dataPoints.push({
      age,
      yearOffset,
      earlyMonthly,
      normalMonthly,
      deferMonthly,
      earlyAnnual,
      normalAnnual,
      deferAnnual,
      earlyCumulative: earlyCum,
      normalCumulative: normalCum,
      deferCumulative: deferCum,
    });
  }

  // 4. 손익분기점(크로스오버 나이) 산출
  // 현재가치 기준 이론적 수학 공식
  // ① 조기 vs 정상:
  // 정상 시작 전(earlyStartAge ~ normalStartAge-1) 동안 조기가 먼저 받은 누적액:
  // earlyYears * (1 - 0.06 * earlyYears) * M * 12
  // 매년 정상 수령자가 더 받는 금액: 0.06 * earlyYears * M * 12
  // 추격 소요 연수 = (earlyYears * (1 - 0.06 * earlyYears)) / (0.06 * earlyYears) = (1 - 0.06 * earlyYears) / 0.06
  const yearsToCatchUpEarly = (1 - 0.06 * validEarlyYears) / 0.06;
  const earlyVsNormalExact = normalStartAge + yearsToCatchUpEarly;

  // ② 정상 vs 연기:
  // 연기 시작 전(normalStartAge ~ deferStartAge-1) 동안 정상이 먼저 받은 누적액:
  // deferYears * 1.0 * M * 12
  // 매년 연기 수령자가 더 받는 금액: 0.072 * deferYears * M * 12
  // 추격 소요 연수 = deferYears / (0.072 * deferYears) = 1 / 0.072 = 13.8888...
  const yearsToCatchUpDefer = 1 / 0.072;
  const normalVsDeferExact = deferStartAge + yearsToCatchUpDefer;

  // ③ 조기 vs 연기:
  // 70세 시점 누적액 격차: (deferStartAge - earlyStartAge) * (1 - 0.06 * earlyYears)
  // 이후 연간 격차: (1 + 0.072 * deferYears) - (1 - 0.06 * earlyYears) = 0.072*deferYears + 0.06*earlyYears
  const earlyTotalAtDefer = (deferStartAge - earlyStartAge) * earlyRate;
  const annualGapEarlyVsDefer = deferRate - earlyRate;
  const yearsToCatchUpEarlyVsDefer = annualGapEarlyVsDefer > 0 ? earlyTotalAtDefer / annualGapEarlyVsDefer : 0;
  const earlyVsDeferExact = deferStartAge + yearsToCatchUpEarlyVsDefer;

  // 5. 나이별 마일스톤 누적액 찾기
  const findCum = (targetAge: number) => {
    const pt = dataPoints.find((d) => d.age === targetAge) || dataPoints[dataPoints.length - 1];
    return {
      early: pt ? pt.earlyCumulative : 0,
      normal: pt ? pt.normalCumulative : 0,
      defer: pt ? pt.deferCumulative : 0,
    };
  };

  const cum80 = findCum(80);
  const cum85 = findCum(85);
  const cum90 = findCum(90);
  const cumMax = dataPoints[dataPoints.length - 1];

  // 6. 건보료 피부양자 자격 판정 (연 2,000만원 / 월 166.7만원 초과 시 지역가입자 전환)
  const healthCapAnnual = 2000;
  const earlyAnnualCap = earlyBaseMonthly * 12;
  const normalAnnualCap = normalBaseMonthly * 12;
  const deferAnnualCap = deferBaseMonthly * 12;

  // 7. 전략별 상세 정보 생성
  const earlyStrategy: StrategyDetail = {
    type: "EARLY",
    title: "조기노령연금",
    badge: `⚡ ${validEarlyYears}년 조기 수령`,
    startAge: earlyStartAge,
    ratePercent: Math.round(earlyRate * 100),
    rateLabel: `-${Math.round((1 - earlyRate) * 100)}% 감액 (연 6%)`,
    monthlyPension: earlyBaseMonthly,
    annualPension: earlyAnnualCap,
    cumulativeAt80: cum80.early,
    cumulativeAt85: cum85.early,
    cumulativeAt90: cum90.early,
    totalAtMaxAge: cumMax.earlyCumulative,
    healthInsuranceRisk: earlyAnnualCap > healthCapAnnual,
    healthInsuranceNote: earlyAnnualCap > healthCapAnnual
      ? `연 ${earlyAnnualCap.toLocaleString()}만원으로 피부양자 한도(2,000만원)를 초과합니다.`
      : `감액으로 연 ${earlyAnnualCap.toLocaleString()}만원이 되어 건보료 피부양자 자격 방어에 유리합니다.`,
    pros: [
      `${earlyStartAge}세부터 즉시 수령하여 은퇴 직후 소득 크레바스(소득 공백기) 완벽 해소`,
      `조기 사망 시(만 ${formatAgeWithMonths(earlyVsNormalExact)} 이전) 정상수령 대비 총 수령액 우위`,
      `월 수령액이 낮아져 건강보험료 피부양자 자격(연 2,000만원 이하) 방어에 유리`,
    ],
    cons: [
      `평생 ${Math.round((1 - earlyRate) * 100)}% 감액된 연금액을 받게 됨`,
      `만 ${formatAgeWithMonths(earlyVsNormalExact)} 이후 장수할수록 정상수령 대비 누적 손실 확대`,
      `A값(월 319만원) 초과 근로·사업소득 발생 시 연금 지급이 일시 정지되거나 감액될 수 있음`,
    ],
    recommendTarget: "은퇴 직후 재취업이 어렵고 긴급 생활비가 절실하거나, 건강 상태상 단명 가능성이 우려되는 경우",
  };

  const normalStrategy: StrategyDetail = {
    type: "NORMAL",
    title: "정상노령연금",
    badge: `🎯 ${normalStartAge}세 법정 정상수령`,
    startAge: normalStartAge,
    ratePercent: 100,
    rateLabel: "100% 정규 수령",
    monthlyPension: normalBaseMonthly,
    annualPension: normalAnnualCap,
    cumulativeAt80: cum80.normal,
    cumulativeAt85: cum85.normal,
    cumulativeAt90: cum90.normal,
    totalAtMaxAge: cumMax.normalCumulative,
    healthInsuranceRisk: normalAnnualCap > healthCapAnnual,
    healthInsuranceNote: normalAnnualCap > healthCapAnnual
      ? `연 ${normalAnnualCap.toLocaleString()}만원으로 피부양자 한도(2,000만원)를 초과하여 지역건보료 부과 대상이 될 수 있습니다.`
      : `연 ${normalAnnualCap.toLocaleString()}만원으로 피부양자 소득 한도(2,000만원) 이내를 안전하게 유지합니다.`,
    pros: [
      "국민연금 감액이나 연기 손실 위험이 없는 가장 표준적이고 안정적인 수령 모델",
      `대한민국 평균 기대수명(${expectedLifeExpectancy}세 전후)에서 위험 대비 수익비가 가장 균형적`,
      "정상 수령 시점까지 퇴직연금·개인연금(브릿지 연금)을 활용해 세제 혜택 극대화 가능",
    ],
    cons: [
      `${normalStartAge}세 개시 전까지 55~${normalStartAge}세 구간의 소득 공백기 생활비 대책 필요`,
      `만 ${formatAgeWithMonths(normalVsDeferExact)} 이상 초장수 시 연기연금 대비 최대 수령액 기회비용 발생`,
    ],
    recommendTarget: "사적연금이나 금융자산으로 은퇴 후 정상개시 나이까지 생활비 조달이 가능하고, 평균적인 건강 상태를 가진 가구",
  };

  const deferStrategy: StrategyDetail = {
    type: "DEFER",
    title: "연기연금",
    badge: `🏆 ${validDeferYears}년 연기 수령`,
    startAge: deferStartAge,
    ratePercent: Math.round(deferRate * 100),
    rateLabel: `+${Math.round((deferRate - 1) * 100)}% 가산 (연 7.2%)`,
    monthlyPension: deferBaseMonthly,
    annualPension: deferAnnualCap,
    cumulativeAt80: cum80.defer,
    cumulativeAt85: cum85.defer,
    cumulativeAt90: cum90.defer,
    totalAtMaxAge: cumMax.deferCumulative,
    healthInsuranceRisk: deferAnnualCap > healthCapAnnual,
    healthInsuranceNote: deferAnnualCap > healthCapAnnual
      ? `연 ${deferAnnualCap.toLocaleString()}만원으로 피부양자 한도(2,000만원)를 초과합니다. 건보료 지역가입자 전환 시 월 10~20만원대 건보료가 부과될 수 있습니다.`
      : `증액 후에도 연 ${deferAnnualCap.toLocaleString()}만원으로 피부양자 기준(2,000만원) 이하를 유지합니다.`,
    pros: [
      `연 7.2%(월 0.6%)의 확정 가산율로 최대 +${Math.round((deferRate - 1) * 100)}% 증액된 연금을 평생 수령`,
      `만 ${formatAgeWithMonths(normalVsDeferExact)} 이상 생존 시 모든 옵션 중 생애 총 수령액이 압도적 1위`,
      "초고령기(85세 이후) 물가상승 및 의료비 지출에 가장 강력한 구매력 방어 효과 제공",
    ],
    cons: [
      `${normalStartAge}~${deferStartAge}세 5년간 국민연금을 1원도 받지 못하므로 든든한 타 소득원 필수`,
      `만 ${formatAgeWithMonths(normalVsDeferExact)} 이전 사망 시 정상수령 대비 막대한 누적액 손실 발생`,
      `연간 연금 수령액이 2,000만원을 초과할 경우 건강보험 피부양자 자격 박탈 및 종합과세 부담 가중`,
    ],
    recommendTarget: "장수 유전력이 있거나 70세까지 탄탄한 근로·사업·배당 소득이 있어 생활비 걱정이 없고 장수 리스크를 완벽히 헷지하고자 하는 가구",
  };

  // 8. 사용자 기대수명 기준 최종 추천 전략 판정
  let recommendedType: "EARLY" | "NORMAL" | "DEFER";
  let recommendedReason: string;

  if (expectedLifeExpectancy < earlyVsNormalExact) {
    recommendedType = "EARLY";
    recommendedReason = `회원님의 기대수명(${expectedLifeExpectancy}세)이 조기 vs 정상 손익분기점(${formatAgeWithMonths(earlyVsNormalExact)})보다 낮아, 조기에 수령을 시작하여 생애 총 수령액을 조기 확보하는 것이 수학적으로 유리합니다.`;
  } else if (expectedLifeExpectancy < normalVsDeferExact) {
    recommendedType = "NORMAL";
    recommendedReason = `회원님의 기대수명(${expectedLifeExpectancy}세)이 조기-정상 분기(${formatAgeWithMonths(earlyVsNormalExact)})를 넘고 정상-연기 분기(${formatAgeWithMonths(normalVsDeferExact)}) 이내에 위치하므로, 불필요한 감액 손실이나 연기 기간 무소득 리스크가 없는 '정상노령연금'이 최적의 선택입니다.`;
  } else {
    // 84세 이상 장수형
    if (deferAnnualCap > healthCapAnnual && normalAnnualCap <= healthCapAnnual) {
      // 건보료 덫(Trap): 연기하면 건보료 피부양자가 탈락하여 실수령액이 깎이는 경우
      recommendedType = "NORMAL";
      recommendedReason = `기대수명(${expectedLifeExpectancy}세) 관점에서는 연기가 유리하나, 연기 시 연금액이 연 ${deferAnnualCap.toLocaleString()}만원이 되어 건강보험 피부양자 자격(연 2,000만원 한도)이 박탈됩니다. 건보료 납부액을 감안하면 정상수령이 실질 세후 소득면에서 더 유리할 수 있습니다.`;
    } else {
      recommendedType = "DEFER";
      recommendedReason = `회원님의 기대수명(${expectedLifeExpectancy}세)이 연기 손익분기점(${formatAgeWithMonths(normalVsDeferExact)})을 상회하므로, ${deferStartAge}세까지 연기하여 월 ${deferBaseMonthly}만원(+${Math.round((deferRate - 1) * 100)}%)의 강력한 평생 평생 인플레이션 방어막을 구축하는 것을 강력 추천합니다.`;
    }
  }

  const cfpPrescription: string[] = [
    `⚡ 조기 vs 정상 손익분기 나이는 법정 단순 비율 기준 【${formatAgeWithMonths(earlyVsNormalExact)}】입니다. 이 나이 이전에 사망 시 조기가 유리하며, 이후 생존 시 정상수령이 유리합니다.`,
    `🏆 정상 vs 연기 손익분기 나이는 법정 단순 비율 기준 【${formatAgeWithMonths(normalVsDeferExact)}】입니다. 만 ${Math.ceil(normalVsDeferExact)}세 이상 장수할 자신이 있다면 연기연금이 생애 최대 누적 연금액을 보장합니다.`,
    `💡 [전문가 인사이트: 예상안내문의 함정과 A·B값 재평가] 60세 시점에 조기를 신청하면 당시 A·B값으로 묶이지만, 65세 정상수령까지 기다리면 5년간 전체 가입자 평균소득(A값)과 과거소득 재평가율(B값)이 매년 상승(약 4~5%)하여 65세 정상 시작액이 약 26.7% 더 크게 시작합니다. 이 A·B값 재평가 효과를 반영한 실제 체감 손익분기점은 【조기 vs 정상 약 72세】, 【정상 vs 연기 약 81세】로 약 3~5년 더 앞당겨집니다.`,
    `💼 소득 있는 업무 종사 시 감액 주의 & 연기연금 치트키: 조기노령연금은 근로·사업소득이 A값(2026년 기준 월 약 320만원) 초과 시 전액 지급정지됩니다. 반면 65~69세에 A값 초과 소득이 있는 분은 정상연금 수령 시 최대 50%까지 깎이므로, 이때 '연기연금'을 신청하면 감액을 100% 피하고 연 7.2% 가산까지 챙길 수 있어 압도적으로 유리합니다.`,
    `🛡️ 건강보험료 주의: 공적연금소득이 연 2,000만원(월 166.7만원)을 단 1원이라도 초과하면 직장가입자 자녀의 피부양자 자격이 상실되어 매월 10~25만원의 지역건보료가 부과됩니다. ${deferAnnualCap > 2000 ? "연기 시 연금액 확대로 피부양자 탈락 위험이 있으므로 주의가 필요합니다." : "현재 연금 규모는 건보료 한도 내에서 안전합니다."}`,
    `🧩 부분 연기(50~90%) 활용: 건보료 피부양자 한도(연 2,000만원)를 아슬아슬하게 넘길 우려가 있다면, 전액 연기 대신 50~90% 부분 연기 제도를 활용해 연금 수령액을 절세 구간으로 정밀하게 컨트롤할 수 있습니다.`,
  ];

  return {
    birthYear,
    normalStartAge,
    earlyStartAge,
    deferStartAge,
    earlyYears: validEarlyYears,
    deferYears: validDeferYears,
    baseMonthlyPension,
    isRealValue,
    inflationRate,
    expectedLifeExpectancy,
    crossoverEarlyVsNormal: {
      ageExact: Math.round(earlyVsNormalExact * 10) / 10,
      ageDisplay: formatAgeWithMonths(earlyVsNormalExact),
      description: `만 ${formatAgeWithMonths(earlyVsNormalExact)} 이전 사망 시 조기 유리, 이후 생존 시 정상수령 유리`,
    },
    crossoverNormalVsDefer: {
      ageExact: Math.round(normalVsDeferExact * 10) / 10,
      ageDisplay: formatAgeWithMonths(normalVsDeferExact),
      description: `만 ${formatAgeWithMonths(normalVsDeferExact)} 이상 장수 시 연기연금 누적 수령액 역전 극대화`,
    },
    crossoverEarlyVsDefer: {
      ageExact: Math.round(earlyVsDeferExact * 10) / 10,
      ageDisplay: formatAgeWithMonths(earlyVsDeferExact),
      description: `조기와 연기간 누적액 교차 시점`,
    },
    dataPoints,
    strategies: {
      early: earlyStrategy,
      normal: normalStrategy,
      defer: deferStrategy,
    },
    recommendedType,
    recommendedReason,
    cfpPrescription,
  };
}
