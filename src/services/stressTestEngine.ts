/**
 * 3중 복합 위기 스트레스 테스트 매트릭스 2.0 엔진
 * ① 고인플레이션(4.5%) + ② 국민연금 68세 개시 상향 + ③ 자산 -30% 시장 폭락 복합 충격 시뮬레이션
 */

export interface StressScenarioResult {
  id: "BASE" | "INFLATION" | "NPS_DELAY" | "MARKET_CRASH" | "TRIPLE_COMBO";
  title: string;
  badge: string;
  description: string;
  inflationRate: number; // (%)
  npsStartAge: number; // 나이
  assetLossRate: number; // (%)
  dividendLossRate: number; // (%)
  depletionAge: number; // 자산 고갈 예상 나이
  runwayYears: number; // 은퇴 후 버틸 수 있는 햇수
  lifetimeShortfallWon: number; // 생애 총 부족액 (원)
  survivalGrade: "A" | "B" | "C" | "D"; // 내구성 등급
  defenseStrategies: string[];
}

export interface StressTestSuite {
  basePlan: StressScenarioResult;
  inflationShock: StressScenarioResult;
  npsDelayShock: StressScenarioResult;
  marketCrashShock: StressScenarioResult;
  tripleShock: StressScenarioResult;
  overallAssessment: {
    fragilityFactor: string; // 가장 취약한 고리
    recommendation: string;
  };
}

export function runRetirementStressTest(params: {
  currentAge: number;
  retirementAge: number;
  expectedLifeExpectancy: number;
  targetMonthlySpendingWon: number;
  monthlyNationalPensionWon: number;
  totalLiquidAssetsWon: number; // 비연금+사적연금 가용 유동자산
  baseInflationRate?: number;
  baseNpsStartAge?: number;
}): StressTestSuite {
  const currentAge = params.currentAge;
  const retirementAge = params.retirementAge;
  const lifeExpectancy = params.expectedLifeExpectancy;
  const targetSpendingWon = params.targetMonthlySpendingWon;
  const nationalPensionWon = params.monthlyNationalPensionWon;
  const baseAssets = params.totalLiquidAssetsWon;
  const baseInfl = params.baseInflationRate ?? 2.5;
  const baseNpsAge = params.baseNpsStartAge ?? 65;

  const totalYears = Math.max(1, lifeExpectancy - retirementAge);

  // 시나리오별 계산 헬퍼
  const evaluateScenario = (
    id: StressScenarioResult["id"],
    title: string,
    badge: string,
    desc: string,
    infl: number,
    npsAge: number,
    assetLoss: number,
    dividendLoss: number,
    defenses: string[]
  ): StressScenarioResult => {
    let currentAssets = Math.round(baseAssets * (1 - assetLoss / 100));
    let depletionAge = lifeExpectancy;
    let lifetimeShortfallWon = 0;
    let depleted = false;

    for (let y = 0; y < totalYears; y++) {
      const age = retirementAge + y;
      // 물가상승 반영 연간 생활비
      const annualSpending = (targetSpendingWon * 12) * Math.pow(1 + infl / 100, y);
      // 국민연금 수급 여부
      const annualNps = age >= npsAge ? (nationalPensionWon * 12) * Math.pow(1 + infl / 100, Math.max(0, age - npsAge)) : 0;
      const annualDeficit = Math.max(0, annualSpending - annualNps);

      if (currentAssets >= annualDeficit) {
        currentAssets -= annualDeficit;
        // 잔여 자산 연 3% 보수 수익 (폭락 시나리오에서는 1.5%)
        const returnRate = assetLoss > 0 ? 0.015 : 0.03;
        currentAssets = Math.round(currentAssets * (1 + returnRate));
      } else {
        if (!depleted) {
          depletionAge = age;
          depleted = true;
        }
        lifetimeShortfallWon += (annualDeficit - Math.max(0, currentAssets));
        currentAssets = 0;
      }
    }

    const runwayYears = depletionAge - retirementAge;

    let survivalGrade: "A" | "B" | "C" | "D" = "A";
    if (depletionAge >= lifeExpectancy) survivalGrade = "A";
    else if (depletionAge >= 85) survivalGrade = "B";
    else if (depletionAge >= 75) survivalGrade = "C";
    else survivalGrade = "D";

    return {
      id,
      title,
      badge,
      description: desc,
      inflationRate: infl,
      npsStartAge: npsAge,
      assetLossRate: assetLoss,
      dividendLossRate: dividendLoss,
      depletionAge,
      runwayYears,
      lifetimeShortfallWon,
      survivalGrade,
      defenseStrategies: defenses,
    };
  };

  const basePlan = evaluateScenario(
    "BASE",
    "평상시 기준 플랜 (Base)",
    "기본 계획",
    `물가상승률 ${baseInfl}%, 국민연금 ${baseNpsAge}세 정상 개시 기준`,
    baseInfl,
    baseNpsAge,
    0,
    0,
    ["현재 수립된 3층 연금 및 인출 전략을 계획대로 실행"]
  );

  const inflationShock = evaluateScenario(
    "INFLATION",
    "고인플레이션 충격 (+2.0%p)",
    "물가 급등",
    "물가상승률 4.5% 장기 지속으로 은퇴 실질 구매력 급격 침식",
    4.5,
    baseNpsAge,
    0,
    0,
    [
      "물가 연동(CPI 100% 반영) 국민연금 조기 수령 지양 및 정상/연기 수령 유지",
      "실물 자산 기반 리츠/배당 성장 ETF 비중 확대로 구매력 방어",
      "선택적 여가비 10~15% 긴급 다이어트 실행",
    ]
  );

  const npsDelayShock = evaluateScenario(
    "NPS_DELAY",
    "국민연금 개시 연령 상향 (만 68세)",
    "소득 공백기 확대",
    "연금개혁안 추진으로 국민연금 개시 나이가 만 68세로 3년 추가 순연",
    baseInfl,
    68,
    0,
    0,
    [
      "소득 크레바스(60~68세) 8년간 실업급여 및 사적연금 가속 분할 인출",
      "한국주택금융공사 주택연금 조기 결합으로 월 100~150만원 현금흐름 보강",
      "파트타임/브릿지 일자리 월 100만원 소득 3~5년 유지",
    ]
  );

  const marketCrashShock = evaluateScenario(
    "MARKET_CRASH",
    "금융시장 폭락 (-30%) & 배당 삭감",
    "자산 가치 폭락",
    "글로벌 경기 침체로 유동 투자자산 -30% 손실 및 배당 분배율 -25% 삭감",
    baseInfl,
    baseNpsAge,
    30,
    25,
    [
      "3-Bucket 현금 버퍼(1~2년치 현금)로 하락장 중 강제 자산 매도 방어",
      "고배당 커버드콜 원금 회복기까지 배당금 전액 재투자(스노우볼) 전환",
      "안전자산 30% IRP 채권 및 예금 리밸런싱",
    ]
  );

  const tripleShock = evaluateScenario(
    "TRIPLE_COMBO",
    "3중 복합 위기 (Triple Shock)",
    "최악의 시나리오",
    "고물가 4.5% + 국민연금 68세 순연 + 시장 -30% 폭락 동시 발발",
    4.5,
    68,
    30,
    25,
    [
      "🚨 비상 계획 즉각 발동: 생활비 20% 일괄 긴급 축소",
      "주택연금 100% 종신형 즉시 가입으로 평생 방패 현금흐름 확보",
      "비연금 부동산 자산 다운사이징(축소 이전)을 통한 유동자산 긴급 수혈",
    ]
  );

  let fragilityFactor = "인플레이션(물가상승)";
  if (tripleShock.depletionAge - basePlan.depletionAge > 10) {
    fragilityFactor = "소득 공백기(국민연금 개시 지연)와 시장 폭락 복합 결손";
  }

  return {
    basePlan,
    inflationShock,
    npsDelayShock,
    marketCrashShock,
    tripleShock,
    overallAssessment: {
      fragilityFactor,
      recommendation:
        "위기 발생 시 가장 효과적인 방패는 '주택연금 결합'과 '3-Bucket 2년치 현금 버퍼'입니다. 최악의 3중 복합 위기에서도 주택연금과 비상 버퍼가 마련되어 있으면 자산 고갈을 10년 이상 늦출 수 있습니다.",
    },
  };
}
