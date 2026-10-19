/**
 * 은퇴 자산 포트폴리오 리밸런싱 주문 가이드 서비스
 * 현재 자산 배분과 목표 비중 간 괴리율을 분석하고 증권사 주문표(Order Slip)를 산출
 */

export interface AssetClassHolding {
  id: string;
  name: string;
  category: "DIVIDEND_GROWTH" | "BOND_MIX" | "REITS_INFRA" | "SAFE_CASH";
  representativeTicker: string;
  unitPriceWon: number; // 1주당 가격 (원)
  currentAmountWon: number; // 현재 보유 평가액 (원)
  targetWeightPercent: number; // 목표 비중 (%)
  isSafeAssetForIrp: boolean; // IRP 30% 안전자산 인정 여부
}

export interface RebalancingOrderInput {
  totalAssetWon: number;
  holdings: AssetClassHolding[];
  accountType?: "IRP" | "PENSION_SAVINGS" | "ISA" | "TAXABLE";
}

export interface OrderItem {
  id: string;
  name: string;
  ticker: string;
  unitPriceWon: number;
  currentAmountWon: number;
  currentWeightPercent: number;
  targetWeightPercent: number;
  targetAmountWon: number;
  driftPercent: number; // 괴리율 (%p)
  action: "BUY" | "SELL" | "HOLD";
  tradeAmountWon: number; // 매수/매도할 금액
  tradeShares: number; // 주문 주수 (정수 단위)
  isSafeAsset: boolean;
}

export interface RebalancingReport {
  totalAssetWon: number;
  accountType: string;
  irpCompliance: {
    safeAssetWeight: number; // 안전자산 비중 (%)
    isCompliant: boolean; // 30% 이상 충족 여부
    shortfallWon: number; // 미달 시 추가 필요 안전자산 금액
  };
  orders: OrderItem[];
  summaryText: string;
  totalBuyWon: number;
  totalSellWon: number;
}

export const DEFAULT_REBALANCING_HOLDINGS: AssetClassHolding[] = [
  {
    id: "us_dividend",
    name: "미국 배당다우존스 / 월배당 커버드콜",
    category: "DIVIDEND_GROWTH",
    representativeTicker: "ACE 미국배당다우존스",
    unitPriceWon: 12500,
    currentAmountWon: 150000000,
    targetWeightPercent: 40,
    isSafeAssetForIrp: false,
  },
  {
    id: "bond_tdf",
    name: "국공채 / 채권혼합 50 / TDF",
    category: "BOND_MIX",
    representativeTicker: "TIGER 24-12 금융채(AA-이상)",
    unitPriceWon: 52000,
    currentAmountWon: 80000000,
    targetWeightPercent: 30,
    isSafeAssetForIrp: true,
  },
  {
    id: "reits_infra",
    name: "글로벌 리츠 & 맥쿼리인프라",
    category: "REITS_INFRA",
    representativeTicker: "맥쿼리인프라",
    unitPriceWon: 12200,
    currentAmountWon: 40000000,
    targetWeightPercent: 15,
    isSafeAssetForIrp: false,
  },
  {
    id: "cash_parking",
    name: "CD금리 액티브 / MMF / 발행어음",
    category: "SAFE_CASH",
    representativeTicker: "KODEX CD금리액티브(합성)",
    unitPriceWon: 1045000,
    currentAmountWon: 30000000,
    targetWeightPercent: 15,
    isSafeAssetForIrp: true,
  },
];

export function calculateRebalancingOrders(input: RebalancingOrderInput): RebalancingReport {
  const { totalAssetWon, holdings, accountType = "IRP" } = input;

  const currentTotal = holdings.reduce((sum, h) => sum + h.currentAmountWon, 0);
  const baseTotal = totalAssetWon > 0 ? totalAssetWon : (currentTotal > 0 ? currentTotal : 300000000);

  let totalBuyWon = 0;
  let totalSellWon = 0;
  let totalTargetSafeWon = 0;

  const orders: OrderItem[] = holdings.map((h) => {
    const currentWeight = Number(((h.currentAmountWon / baseTotal) * 100).toFixed(1));
    const targetAmount = Math.round((baseTotal * h.targetWeightPercent) / 100);
    const diff = targetAmount - h.currentAmountWon;
    const drift = Number((currentWeight - h.targetWeightPercent).toFixed(1));

    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    let tradeAmount = Math.abs(diff);
    let tradeShares = Math.floor(tradeAmount / (h.unitPriceWon || 10000));

    if (diff > 50000) {
      action = "BUY";
      totalBuyWon += tradeAmount;
    } else if (diff < -50000) {
      action = "SELL";
      totalSellWon += tradeAmount;
    } else {
      action = "HOLD";
      tradeAmount = 0;
      tradeShares = 0;
    }

    if (h.isSafeAssetForIrp) {
      totalTargetSafeWon += targetAmount;
    }

    return {
      id: h.id,
      name: h.name,
      ticker: h.representativeTicker,
      unitPriceWon: h.unitPriceWon,
      currentAmountWon: h.currentAmountWon,
      currentWeightPercent: currentWeight,
      targetWeightPercent: h.targetWeightPercent,
      targetAmountWon: targetAmount,
      driftPercent: drift,
      action,
      tradeAmountWon: tradeAmount,
      tradeShares,
      isSafeAsset: h.isSafeAssetForIrp,
    };
  });

  const safeAssetWeight = Number(((totalTargetSafeWon / baseTotal) * 100).toFixed(1));
  const isCompliant = accountType === "IRP" ? safeAssetWeight >= 30.0 : true;
  const shortfallWon = isCompliant ? 0 : Math.round(baseTotal * 0.3) - totalTargetSafeWon;

  // HTS/MTS 복사용 요약 주문표 텍스트 생성
  const dateStr = new Date().toLocaleDateString("ko-KR");
  let slipLines: string[] = [
    `[PensionLab 포트폴리오 리밸런싱 주문표] - ${dateStr}`,
    `계좌 구분: ${accountType} | 총 포트폴리오 자산: ${(baseTotal / 10000).toLocaleString()}만원`,
    accountType === "IRP"
      ? `IRP 안전자산 비중: ${safeAssetWeight}% (${isCompliant ? "✅ 30% 룰 충족" : `⚠️ ${(shortfallWon / 10000).toLocaleString()}만원 추가 필요`})`
      : "",
    "--------------------------------------------------",
  ].filter(Boolean);

  orders.forEach((o) => {
    if (o.action === "BUY") {
      slipLines.push(`[매수 🟢] ${o.ticker} | ${o.tradeShares}주 (약 ${(o.tradeAmountWon / 10000).toLocaleString()}만원)`);
    } else if (o.action === "SELL") {
      slipLines.push(`[매도 🔴] ${o.ticker} | ${o.tradeShares}주 (약 ${(o.tradeAmountWon / 10000).toLocaleString()}만원)`);
    } else {
      slipLines.push(`[유지 ⚪] ${o.ticker} | 비중 유지 (${o.currentWeightPercent}%)`);
    }
  });

  slipLines.push("--------------------------------------------------");
  slipLines.push(`총 매수 예정: ${(totalBuyWon / 10000).toLocaleString()}만원 | 총 매도 예정: ${(totalSellWon / 10000).toLocaleString()}만원`);

  return {
    totalAssetWon: baseTotal,
    accountType,
    irpCompliance: {
      safeAssetWeight,
      isCompliant,
      shortfallWon,
    },
    orders,
    summaryText: slipLines.join("\n"),
    totalBuyWon,
    totalSellWon,
  };
}
