// 은퇴 자산 포트폴리오 시장 시나리오 백테스팅 및 배당 재투자 복리 연산 엔진
// 실제 10개년(2015~2024) 및 역사적 위기 시나리오(2008 금융위기/2022 급락) 자산군별 연간 수익률 및 배당수익률 모델

export type MarketScenario = "REAL_10Y" | "CRISIS_STRESS" | "SIDEWAYS_INCOME";
export type BacktestDividendPolicy = "REINVEST" | "PAYOUT";

export interface AssetAllocation {
  dividendGrowth: number; // 미국 배당성장(SCHD/미당다 등) %
  coveredCall: number;    // 고배당 커버드콜/인컴 %
  sp500: number;          // S&P 500 시장대표지수 %
  bonds: number;          // 미국/한국 중장기 국채 %
  reits: number;          // 부동산 리츠/인프라 %
}

export interface BacktestParams {
  initialCapital: number; // 초기 투자금 (만원 단위, 예: 40000 = 4억원)
  allocation: AssetAllocation;
  scenario: MarketScenario;
  dividendPolicy: BacktestDividendPolicy;
  years?: number; // 기본 10년
}

export interface YearPerformance {
  year: number;
  yearIndex: number;
  portfolioReturn: number; // 연간 자본 수익률 (%)
  dividendYield: number;   // 연간 배당 수익률 (%)
  startAsset: number;      // 기초 자산 (만원)
  endAsset: number;        // 기말 자산 (만원)
  annualDividend: number;  // 당해 발생 배당금 (만원)
  cumDividend: number;     // 누적 배당금 (만원)
  drawdown: number;        // 전고점 대비 하락률 (%)
}

export interface BacktestResult {
  finalAsset: number;          // 최종 자산 (만원)
  totalDividends: number;      // 총 수령 배당금 (만원)
  cagr: number;                // 연평균 복리 성장률 (%)
  mdd: number;                 // 최대 낙폭 Maximum Drawdown (%)
  totalReturnRate: number;     // 총 수익률 (원금 대비 %)
  yearly: YearPerformance[];   // 연도별 상세 데이터
  reinvestDelta?: {            // 재투자 시 인출 대비 자산 및 배당금 차이
    assetDelta: number;        // 자산 증가분 (만원)
    assetGrowthRatio: number;  // 자산 배수 (예: 1.45배)
  };
}

// 4대 대표 프리셋 포트폴리오 비중
export const PRESET_ALLOCATIONS: Record<string, { label: string; desc: string; alloc: AssetAllocation }> = {
  DIVIDEND_GROWTH: {
    label: "배당성장형 (사과나무 플랜)",
    desc: "10년 이상 장기 보유 복리 배당 극대화 (미당다 50% + S&P500 30% + 국채 20%)",
    alloc: { dividendGrowth: 50, coveredCall: 0, sp500: 30, bonds: 20, reits: 0 },
  },
  HIGH_INCOME: {
    label: "고배당 인컴형 (월급 복제 플랜)",
    desc: "은퇴 즉시 안정적 월 인컴 확보 (미당다 40% + 커버드콜 30% + 리츠 15% + 국채 15%)",
    alloc: { dividendGrowth: 40, coveredCall: 30, sp500: 0, bonds: 15, reits: 15 },
  },
  ALL_WEATHER: {
    label: "올웨더 안정형 (수비형 플랜)",
    desc: "위기 시 낙폭 방어 및 자산 보호 (국채 45% + S&P500 25% + 미당다 20% + 리츠 10%)",
    alloc: { dividendGrowth: 20, coveredCall: 0, sp500: 25, bonds: 45, reits: 10 },
  },
  COVERED_CALL_MAX: {
    label: "커버드콜 극대화형 (현금흐름 집중)",
    desc: "인당 건보료 한도 내 월분배 극대화 (커버드콜 60% + 미당다 20% + 국채 20%)",
    alloc: { dividendGrowth: 20, coveredCall: 60, sp500: 0, bonds: 20, reits: 0 },
  },
};

// 자산군별 과거 10년(2015~2024) 및 가상 위기/횡보 연간 데이터 (자본수익률 / 배당수익률 %)
interface AssetHistory {
  priceReturns: number[]; // 연도별 가격 변동률 (%)
  divYields: number[];    // 연도별 배당/분배율 (%)
}

const SCENARIO_DATA: Record<MarketScenario, { name: string; desc: string; years: number[]; data: Record<keyof AssetAllocation, AssetHistory> }> = {
  REAL_10Y: {
    name: "실제 시장 10년 (2015~2024)",
    desc: "미국 및 국내 시장의 실제 호황, 2020 코로나 충격, 2022 긴축 금리 인상, 2023-2024 반등 주기",
    years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    data: {
      dividendGrowth: {
        priceReturns: [-1.5, 13.8, 15.2, -5.6, 22.1, 11.2, 23.4, -6.5, 3.8, 12.5],
        divYields:    [3.1,   3.2,  3.0,  3.3,  3.2,  3.5,  3.4,  3.6,  3.5,  3.4],
      },
      coveredCall: {
        priceReturns: [-4.2, 4.5,  8.2, -9.1, 10.5, -2.1, 11.0, -18.2, 2.5,  6.8],
        divYields:    [7.8,  8.0,  7.6,  8.5,  8.2,  9.5,  8.8,  11.2, 9.4,  8.9],
      },
      sp500: {
        priceReturns: [-0.7, 9.5, 19.4, -6.2, 28.9, 16.3, 26.9, -19.4, 24.2, 23.1],
        divYields:    [1.9,  2.0,  1.8,  1.9,  1.8,  1.6,  1.3,   1.7,  1.5,  1.3],
      },
      bonds: {
        priceReturns: [-1.2, 1.1,  2.4, -1.8,  6.8,  7.5, -4.6, -13.1, 3.2,  2.1],
        divYields:    [2.3,  2.4,  2.5,  2.8,  2.4,  1.8,  1.9,   3.5,  4.1,  3.9],
      },
      reits: {
        priceReturns: [1.2,  5.8,  3.5, -4.8, 21.4, -7.5, 38.2, -26.1, 8.4,  7.2],
        divYields:    [4.2,  4.3,  4.1,  4.5,  3.9,  4.8,  3.6,   5.2,  4.9,  4.5],
      },
    },
  },
  CRISIS_STRESS: {
    name: "복합 위기 스트레스 테스트",
    desc: "2008 금융위기 및 2022 고유가·고금리 긴축 충격이 연속 발생하는 극단적 약세장",
    years: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    data: {
      dividendGrowth: {
        priceReturns: [-18.5, -8.2, 12.0, 8.5, -12.4, 5.2, 14.1, -4.2, 7.5, 9.0],
        divYields:    [4.2,   4.5,  3.8,  3.5,   4.0, 3.6,  3.4,  3.7, 3.5, 3.4],
      },
      coveredCall: {
        priceReturns: [-24.1, -12.5, 4.0, 2.1, -18.2, 1.5,  6.2, -6.5, 3.2, 4.0],
        divYields:    [11.5,  12.0,  9.5, 8.8,  10.8, 9.2,  8.5,  9.8, 8.9, 8.5],
      },
      sp500: {
        priceReturns: [-37.0, -10.5, 23.4, 12.8, -19.4, 8.2, 18.5, -5.2, 12.1, 14.5],
        divYields:    [2.8,    2.9,  2.0,  1.8,   2.1, 1.7,  1.5,  1.8,  1.6,  1.5],
      },
      bonds: {
        priceReturns: [14.2,   8.5,  4.2, -2.1, -12.5, 2.4,  3.8,  4.5,  3.1,  2.5],
        divYields:    [3.8,    3.2,  2.8,  2.5,   4.2, 3.8,  3.5,  3.2,  3.0,  2.8],
      },
      reits: {
        priceReturns: [-38.2, -15.4, 18.5, 6.2, -26.5, 4.1, 12.8, -8.2, 5.4,  6.8],
        divYields:    [6.8,    7.5,  5.2, 4.8,   6.5, 5.4,  4.8,  5.5, 5.0,  4.8],
      },
    },
  },
  SIDEWAYS_INCOME: {
    name: "장기 횡보 인컴장 (일본식 장기 저성장)",
    desc: "주가 지수는 박스권 횡보를 유지하나 지속적인 배당·인컴 현금흐름으로 방어하는 시나리오",
    years: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    data: {
      dividendGrowth: {
        priceReturns: [2.1, -1.5, 3.4, -2.2, 4.1, -1.0, 2.8, 0.5, -1.8, 3.2],
        divYields:    [3.5,  3.6, 3.5,  3.7, 3.6,  3.8, 3.6, 3.7,  3.8, 3.7],
      },
      coveredCall: {
        priceReturns: [-1.2, -2.4, 0.5, -3.1, 1.2, -2.0, 0.8, -1.5, -2.2, 0.4],
        divYields:    [9.5,   9.8, 9.2, 10.1, 9.4,  9.8, 9.5,  9.9, 10.2, 9.6],
      },
      sp500: {
        priceReturns: [3.5, -4.2, 5.8, -3.8, 6.2, -2.5, 4.1, 1.2, -3.5, 4.8],
        divYields:    [2.0,  2.1, 1.9,  2.2, 2.0,  2.1, 2.0, 2.1,  2.2, 2.0],
      },
      bonds: {
        priceReturns: [1.5,  2.0, 1.2,  1.8, 1.4,  1.6, 1.5, 1.7,  1.3, 1.5],
        divYields:    [3.0,  3.1, 3.0,  3.2, 3.1,  3.0, 3.1, 3.2,  3.0, 3.1],
      },
      reits: {
        priceReturns: [0.8, -2.1, 2.4, -1.8, 3.2, -0.9, 1.5, 0.2, -1.4, 2.1],
        divYields:    [5.2,  5.4, 5.1,  5.5, 5.2,  5.3, 5.2, 5.4,  5.5, 5.3],
      },
    },
  },
};

export function runPortfolioBacktest(params: BacktestParams): BacktestResult {
  const { initialCapital, allocation, scenario, dividendPolicy, years = 10 } = params;
  const sData = SCENARIO_DATA[scenario];
  const keys: (keyof AssetAllocation)[] = ["dividendGrowth", "coveredCall", "sp500", "bonds", "reits"];

  // 비중 정규화 (합계 100% 기준)
  const totalWeight = keys.reduce((sum, k) => sum + allocation[k], 0) || 100;
  const weights: Record<keyof AssetAllocation, number> = {} as Record<keyof AssetAllocation, number>;
  keys.forEach((k) => {
    weights[k] = (allocation[k] || 0) / totalWeight;
  });

  let currentAsset = initialCapital;
  let peakAsset = initialCapital;
  let cumDividends = 0;
  let maxDrawdown = 0;
  const yearly: YearPerformance[] = [];

  const maxYears = Math.min(years, sData.years.length);

  for (let i = 0; i < maxYears; i++) {
    const yr = sData.years[i];

    // 가중 평균 자본수익률 및 배당수익률 계산
    let weightedPriceReturn = 0;
    let weightedDivYield = 0;

    keys.forEach((k) => {
      const assetHist = sData.data[k];
      const pr = assetHist.priceReturns[i] || 0;
      const dy = assetHist.divYields[i] || 0;
      weightedPriceReturn += weights[k] * pr;
      weightedDivYield += weights[k] * dy;
    });

    const startAsset = currentAsset;

    // 배당금 산출 (기초 자산 기준)
    const annualDividend = Math.round(startAsset * (weightedDivYield / 100));
    cumDividends += annualDividend;

    // 기말 자산 계산
    // 1) 자본 가격 변동 반영
    let endAsset = startAsset * (1 + weightedPriceReturn / 100);

    // 2) 배당 정책 반영: 재투자면 자산에 가산, 인출이면 제외
    if (dividendPolicy === "REINVEST") {
      endAsset += annualDividend;
    }

    endAsset = Math.max(0, Math.round(endAsset));
    currentAsset = endAsset;

    // 고점 및 낙폭 (Drawdown) 산정
    if (currentAsset > peakAsset) {
      peakAsset = currentAsset;
    }
    const currentDrawdown = peakAsset > 0 ? ((peakAsset - currentAsset) / peakAsset) * 100 : 0;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    yearly.push({
      year: yr,
      yearIndex: i + 1,
      portfolioReturn: Math.round(weightedPriceReturn * 10) / 10,
      dividendYield: Math.round(weightedDivYield * 10) / 10,
      startAsset: Math.round(startAsset),
      endAsset,
      annualDividend,
      cumDividend: cumDividends,
      drawdown: Math.round(currentDrawdown * 10) / 10,
    });
  }

  // 총 수익률 및 CAGR
  const totalReturnRate = initialCapital > 0 ? ((currentAsset + (dividendPolicy === "PAYOUT" ? cumDividends : 0) - initialCapital) / initialCapital) * 100 : 0;
  const effectiveEndAsset = currentAsset + (dividendPolicy === "PAYOUT" ? cumDividends : 0);
  const cagr = initialCapital > 0 && maxYears > 0 ? (Math.pow(effectiveEndAsset / initialCapital, 1 / maxYears) - 1) * 100 : 0;

  // 재투자 vs 인출 비교 델타 (만약 현재가 REINVEST라면 PAYOUT 대비 효과 산출)
  let reinvestDelta: BacktestResult["reinvestDelta"] = undefined;
  if (dividendPolicy === "REINVEST") {
    // 동일 조건 PAYOUT 실행
    const payoutResult = runPortfolioBacktest({
      ...params,
      dividendPolicy: "PAYOUT",
    });
    const delta = currentAsset - payoutResult.finalAsset;
    const ratio = payoutResult.finalAsset > 0 ? currentAsset / payoutResult.finalAsset : 1;
    reinvestDelta = {
      assetDelta: delta,
      assetGrowthRatio: Math.round(ratio * 100) / 100,
    };
  }

  return {
    finalAsset: currentAsset,
    totalDividends: cumDividends,
    cagr: Math.round(cagr * 10) / 10,
    mdd: Math.round(maxDrawdown * 10) / 10,
    totalReturnRate: Math.round(totalReturnRate * 10) / 10,
    yearly,
    reinvestDelta,
  };
}
