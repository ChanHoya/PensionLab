import { runPortfolioBacktest, PRESET_ALLOCATIONS } from "../src/services/portfolioBacktest";

function testEngine() {
  console.log("=== Testing Portfolio Backtest Engine ===");

  // 1. 배당성장형 REAL_10Y REINVEST
  const r1 = runPortfolioBacktest({
    initialCapital: 40000, // 4억원
    allocation: PRESET_ALLOCATIONS.DIVIDEND_GROWTH.alloc,
    scenario: "REAL_10Y",
    dividendPolicy: "REINVEST",
  });

  console.log("1. 배당성장형 REAL_10Y (재투자):");
  console.log(`- 초기: 40,000만원 -> 최종: ${r1.finalAsset.toLocaleString()}만원`);
  console.log(`- 누적 배당금: ${r1.totalDividends.toLocaleString()}만원`);
  console.log(`- CAGR: ${r1.cagr}%, MDD: -${r1.mdd}%`);
  if (r1.reinvestDelta) {
    console.log(`- 인출 대비 자산 증가분: +${r1.reinvestDelta.assetDelta.toLocaleString()}만원 (${r1.reinvestDelta.assetGrowthRatio}배)`);
  }
  if (r1.finalAsset <= 40000) throw new Error("배당성장형 10년 자산이 원금보다 적습니다.");
  if (r1.yearly.length !== 10) throw new Error("10년 데이터 길이가 일치하지 않습니다.");

  // 2. 고배당 인컴형 CRISIS_STRESS PAYOUT
  const r2 = runPortfolioBacktest({
    initialCapital: 40000,
    allocation: PRESET_ALLOCATIONS.HIGH_INCOME.alloc,
    scenario: "CRISIS_STRESS",
    dividendPolicy: "PAYOUT",
  });

  console.log("\n2. 고배당 인컴형 CRISIS_STRESS (인출):");
  console.log(`- 초기: 40,000만원 -> 최종: ${r2.finalAsset.toLocaleString()}만원`);
  console.log(`- 누적 배당 수령액: ${r2.totalDividends.toLocaleString()}만원`);
  console.log(`- CAGR: ${r2.cagr}%, MDD: -${r2.mdd}%`);
  if (r2.mdd <= 0) throw new Error("위기 시나리오에서 MDD가 계산되지 않았습니다.");

  // 3. 올웨더 SIDEWAYS_INCOME
  const r3 = runPortfolioBacktest({
    initialCapital: 40000,
    allocation: PRESET_ALLOCATIONS.ALL_WEATHER.alloc,
    scenario: "SIDEWAYS_INCOME",
    dividendPolicy: "REINVEST",
  });
  console.log("\n3. 올웨더 SIDEWAYS_INCOME (재투자):");
  console.log(`- 최종: ${r3.finalAsset.toLocaleString()}만원, MDD: -${r3.mdd}%`);

  console.log("\n✅ All Portfolio Backtest tests passed successfully!");
}

testEngine();
