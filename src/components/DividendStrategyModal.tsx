"use client";

import React, { useState } from "react";

export interface RecommendedETF {
  ticker: string;
  name: string;
  provider: string; // 운용사
  category: "미국배당" | "커버드콜" | "채권혼합" | "채권" | "리츠" | "국내고배당" | "성장주" | "현금·금";
  yieldRate: number; // 연 분배율 (%)
  payoutCycle: "월배당(월중)" | "월배당(월말)" | "월배당(월초)" | "분기배당" | "수익재투자";
  irpEligible: "안전자산 (100% 매수가능)" | "위험자산 (최대 70% 제한)";
  featureNote: string;
  reason: string; // 전문가 추천 사유
}

export interface DividendPortfolio {
  id: string;
  name: string;
  tagline: string;
  targetAudience: string;
  expectedYield: number; // 연 분배율 (%)
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  irpCompatibility: string; // IRP 계좌 적용 적합도 안내
  assets: {
    name: string;
    weight: number; // %
    recommendedETF: string; // 실제 추천 ETF 이름
    ticker: string; // 6자리 종목코드
    irpCategory: "안전자산" | "위험자산";
    payoutCycle: string;
    yieldRate: number; // %
    annual300M: number; // 만원
    annual500M: number;
    annual1000M: number;
  }[];
  features: string;
  caution: string;
  expertTip?: string;
  yield300M: { annual: number; monthly: number };
  yield500M: { annual: number; monthly: number };
  yield1000M: { annual: number; monthly: number };
}

// 🏢 전문가들이 실제 추천하는 대표 실전 ETF 10선
export const EXPERT_RECOMMENDED_ETFS: RecommendedETF[] = [
  {
    ticker: "458730",
    name: "TIGER 미국배당다우존스",
    provider: "미래에셋",
    category: "미국배당",
    yieldRate: 3.5,
    payoutCycle: "월배당(월중)",
    irpEligible: "위험자산 (최대 70% 제한)",
    featureNote: "SCHD와 동일 지수 추종. 국내 상장 미국배당 중 최대 순자산과 풍부한 거래량, 최저 수준의 실부담비용.",
    reason: "연금계좌의 흔들리지 않는 1등 코어 자산. 10년 이상 장기 복리 성장 시 배당금과 주가가 동반 상승.",
  },
  {
    ticker: "446720",
    name: "SOL 미국배당다우존스",
    provider: "신한",
    category: "미국배당",
    yieldRate: 3.5,
    payoutCycle: "월배당(월말)",
    irpEligible: "위험자산 (최대 70% 제한)",
    featureNote: "국내 최초의 월배당 ETF. 매월 말일 분배금을 지급하여 TIGER(월중)와 교차 매수 시 '격주 배당' 실현.",
    reason: "월말 결제/생활비 수급 주기에 최적화된 국내 월배당 ETF의 시초.",
  },
  {
    ticker: "458760",
    name: "TIGER 미국배당+7%프리미엄다우존스",
    provider: "미래에셋",
    category: "커버드콜",
    yieldRate: 10.0,
    payoutCycle: "월배당(월말)",
    irpEligible: "위험자산 (최대 70% 제한)",
    featureNote: "미국배당다우존스에 타겟 콜옵션 40%만 매도하여 연 10% 분배금을 목표로 하면서 주가 상승에도 60% 참여.",
    reason: "전통 커버드콜의 단점(원금 하락 위험)을 방어한 타겟 프리미엄형으로 은퇴자 생활비 즉시 창출에 최고 선호.",
  },
  {
    ticker: "490490",
    name: "SOL 미국배당미국채혼합50",
    provider: "신한",
    category: "채권혼합",
    yieldRate: 3.8,
    payoutCycle: "월배당(월말)",
    irpEligible: "안전자산 (100% 매수가능)",
    featureNote: "미국배당다우존스 50% + 미국 10년 국채 50% 결합. IRP 안전자산 규제에서 '안전자산'으로 분류.",
    reason: "★전문가 강력 추천★ IRP 안전자산 30% 의무 슬롯에 넣으면 계좌 전체의 실질 배당주 비중을 85%까지 확대 가능.",
  },
  {
    ticker: "476830",
    name: "KODEX 한국부동산리츠인프라",
    provider: "삼성",
    category: "리츠",
    yieldRate: 7.2,
    payoutCycle: "월배당(월말)",
    irpEligible: "위험자산 (최대 70% 제한)",
    featureNote: "맥쿼리인프라(비중 25%), SK리츠, ESR켄달스퀘어리츠 등 국내 핵심 우량 인프라/리츠 월배당 ETF.",
    reason: "안정적인 실물 인프라 기반의 높은 배당 수익률(연 7%대)과 금리 인하 시 자본차익 기대.",
  },
  {
    ticker: "466950",
    name: "TIGER 은행고배당플러스TOP10",
    provider: "미래에셋",
    category: "국내고배당",
    yieldRate: 6.5,
    payoutCycle: "월배당(월중)",
    irpEligible: "위험자산 (최대 70% 제한)",
    featureNote: "KB·신한·하나·우리금융지주 등 우량 금융지주와 삼성화재, 기업은행 중심 밸류업 주주환원 수혜.",
    reason: "일반 계좌에서 사면 배당세 15.4%가 붙지만, 연금계좌에서는 100% 비과세 과세이연되어 재투자 효과 극대화.",
  },
  {
    ticker: "453850",
    name: "ACE 미국30년국채액티브(H)",
    provider: "한국투자",
    category: "채권",
    yieldRate: 3.8,
    payoutCycle: "월배당(월초)",
    irpEligible: "안전자산 (100% 매수가능)",
    featureNote: "미국 초장기 30년 국채 현물에 환헤지(H)로 투자. 매월 초 든든한 채권 이자 분배금 지급.",
    reason: "IRP 안전자산 30%를 채우면서 금리 인하 사이클에서 강력한 가격 상승과 월 인컴을 동시 획득.",
  },
  {
    ticker: "360750",
    name: "TIGER 미국S&P500",
    provider: "미래에셋",
    category: "성장주",
    yieldRate: 1.2,
    payoutCycle: "분기배당",
    irpEligible: "위험자산 (최대 70% 제한)",
    featureNote: "미국 대표 500대 기업 분산투자. 배당보다 강력한 주가 상승(자본이득)을 위한 성장 엔진.",
    reason: "배당주만으로 부족한 장기 인플레이션 헤지와 원금 성장 복리효과를 뒷받침.",
  },
  {
    ticker: "411060",
    name: "ACE KRX금현물",
    provider: "한국투자",
    category: "현금·금",
    yieldRate: 0.0,
    payoutCycle: "수익재투자",
    irpEligible: "위험자산 (최대 70% 제한)",
    featureNote: "한국거래소(KRX) 금현물 가격을 추종하는 국내 유일의 퇴직연금·IRP 매수 가능 금 ETF.",
    reason: "인플레이션 및 지정학적 위기 시 달러/주식/채권 동반 하락을 방어하는 궁극의 포트폴리오 안전핀.",
  },
  {
    ticker: "439870",
    name: "TIGER CD금리투자KIS(합성)",
    provider: "미래에셋",
    category: "현금·금",
    yieldRate: 3.2,
    payoutCycle: "수익재투자",
    irpEligible: "안전자산 (100% 매수가능)",
    featureNote: "양도성예금증서(CD) 91일물 금리를 매일 복리로 가산하는 금리형 파킹 ETF. 원금 손실 위험 극소.",
    reason: "IRP 안전자산 30% 의무 슬롯 충족 및 배당금을 재투자하기 전 대기 자금 보관에 최적.",
  },
];

// 📊 전문가 4대 실전 추천 포트폴리오
export const DIVIDEND_PORTFOLIOS: DividendPortfolio[] = [
  {
    id: "GROWTH",
    name: "① 배당성장형 (사과나무 플랜)",
    tagline: "지금보다 10년 뒤의 배당금을 복리로 키우는 포트폴리오",
    targetAudience: "은퇴까지 10년 이상 남은 30~40대 직장인 및 자영업자",
    expectedYield: 2.81,
    badgeColor: "#38bdf8",
    borderColor: "rgba(56, 189, 248, 0.4)",
    bgColor: "rgba(56, 189, 248, 0.08)",
    irpCompatibility: "연금저축 100% 가능 / IRP에서는 채권 20%를 안전자산 30%로 10%p 보강(채권혼합 권장)",
    yield300M: { annual: 843, monthly: 70 },
    yield500M: { annual: 1405, monthly: 117 },
    yield1000M: { annual: 2810, monthly: 234 },
    features: "초기 배당률은 연 2.8% 수준으로 시작하지만, 배당금이 매년 7~10%씩 성장하여 은퇴 시점에는 투자원금 대비 연 7~10% 이상의 고배당으로 진화합니다. 사과나무를 심어 열매를 기다리는 전략입니다.",
    caution: "수령하는 배당금은 계좌 밖으로 인출하지 않고 미국배당 ETF에 100% 재투자하여 복리 효과를 극대화해야 합니다.",
    expertTip: "IRP 계좌에서 운용할 경우 채권 슬롯에 'ACE 미국30년국채액티브(H)'나 'SOL 미국배당미국채혼합50'을 30% 채우면 IRP 안전자산 규정을 완벽하게 클리어할 수 있습니다.",
    assets: [
      {
        name: "미국 배당성장주 코어",
        weight: 50,
        recommendedETF: "TIGER 미국배당다우존스",
        ticker: "458730",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (15일)",
        yieldRate: 3.5,
        annual300M: 525,
        annual500M: 875,
        annual1000M: 1750,
      },
      {
        name: "미국 대형주 자본성장",
        weight: 30,
        recommendedETF: "TIGER 미국S&P500",
        ticker: "360750",
        irpCategory: "위험자산",
        payoutCycle: "분기배당",
        yieldRate: 1.2,
        annual300M: 108,
        annual500M: 180,
        annual1000M: 360,
      },
      {
        name: "미국 장기 국채 완충",
        weight: 20,
        recommendedETF: "ACE 미국30년국채액티브(H)",
        ticker: "453850",
        irpCategory: "안전자산",
        payoutCycle: "월배당 (초순)",
        yieldRate: 3.5,
        annual300M: 210,
        annual500M: 350,
        annual1000M: 700,
      },
    ],
  },
  {
    id: "HIGH_INCOME",
    name: "② 고배당 인컴형 (월급 복제 플랜)",
    tagline: "은퇴 즉시 매달 통장에 안정적인 생활비가 꽂히는 포트폴리오",
    targetAudience: "은퇴 직전(50대 후반) 또는 이미 은퇴하여 매월 생활비 수령이 필요한 분",
    expectedYield: 5.90,
    badgeColor: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.4)",
    bgColor: "rgba(245, 158, 11, 0.08)",
    irpCompatibility: "IRP 계좌는 안전자산 30% 규정에 따라 채권 15% 외에 리츠 일부를 채권혼합으로 전환 권장",
    yield300M: { annual: 1770, monthly: 148 },
    yield500M: { annual: 2950, monthly: 246 },
    yield1000M: { annual: 5900, monthly: 492 },
    features: "월배당 ETF 4종을 묶어 연 5.9% 수준의 풍부한 현금흐름을 만듭니다. 5억원 투자 시 매월 약 246만원의 세전 현금이 연금처럼 입금됩니다.",
    caution: "커버드콜은 시장 급상승기에 상승 이익이 제한되고 원금 훼손 가능성이 있으므로 포트폴리오의 30% 이내로 엄격히 통제해야 안전합니다.",
    expertTip: "TIGER(15일 지급)와 SOL/KODEX(말일 지급)를 조합하면 매월 15일과 30일에 나누어 입금되는 '격주 월급 시스템'을 구축할 수 있습니다.",
    assets: [
      {
        name: "미국 배당 코어",
        weight: 40,
        recommendedETF: "TIGER 미국배당다우존스",
        ticker: "458730",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (15일)",
        yieldRate: 3.5,
        annual300M: 420,
        annual500M: 700,
        annual1000M: 1400,
      },
      {
        name: "타겟 커버드콜 인컴 부스터",
        weight: 30,
        recommendedETF: "TIGER 미국배당+7%프리미엄다우존스",
        ticker: "458760",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (말일)",
        yieldRate: 10.0,
        annual300M: 900,
        annual500M: 1500,
        annual1000M: 3000,
      },
      {
        name: "인프라·부동산 리츠",
        weight: 15,
        recommendedETF: "KODEX 한국부동산리츠인프라",
        ticker: "476830",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (말일)",
        yieldRate: 6.5,
        annual300M: 293,
        annual500M: 488,
        annual1000M: 975,
      },
      {
        name: "미국 장기채 안전자산",
        weight: 15,
        recommendedETF: "ACE 미국30년국채액티브(H)",
        ticker: "453850",
        irpCategory: "안전자산",
        payoutCycle: "월배당 (초순)",
        yieldRate: 3.5,
        annual300M: 158,
        annual500M: 263,
        annual1000M: 525,
      },
    ],
  },
  {
    id: "BALANCED",
    name: "③ 올웨더 안정 혼합형 (IRP 100% 규정 충족)",
    tagline: "시장 폭락장에도 흔들림 없이 IRP 안전자산 30%를 완벽 준수하는 포트폴리오",
    targetAudience: "주가 변동성이 극도로 불안한 분, IRP 계좌 안전자산 30% 규정을 가장 스마트하게 채우고 싶은 분",
    expectedYield: 3.88,
    badgeColor: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.4)",
    bgColor: "rgba(16, 185, 129, 0.08)",
    irpCompatibility: "★IRP 100% 매수 적격★ SOL 채권혼합(40%)과 종합채권(40%)이 안전자산으로 80%를 차지하여 완벽 적합",
    yield300M: { annual: 1163, monthly: 97 },
    yield500M: { annual: 1938, monthly: 161 },
    yield1000M: { annual: 3875, monthly: 323 },
    features: "주식·채권·리츠·금 4대 자산이 상호 완충 작용을 하여 경제 위기 시에도 계좌 낙폭(MDD)이 매우 작으며, 연 3.9% 수준의 안정된 배당을 제공합니다.",
    caution: "주식 강세장에서는 S&P500 등 순수 주식형 포트폴리오 대비 수익률이 다소 완만할 수 있습니다.",
    expertTip: "전문가 비결: IRP 안전자산 슬롯에 'SOL 미국배당미국채혼합50(안전자산 인정)'을 채우면, 법정 30% 규제를 지키면서도 배당주 실질 비중을 60% 이상으로 유지할 수 있습니다.",
    assets: [
      {
        name: "IRP 안전자산 적격 배당채권혼합",
        weight: 40,
        recommendedETF: "SOL 미국배당미국채혼합50",
        ticker: "490490",
        irpCategory: "안전자산",
        payoutCycle: "월배당 (말일)",
        yieldRate: 4.25,
        annual300M: 510,
        annual500M: 850,
        annual1000M: 1700,
      },
      {
        name: "국내 우량 종합채권",
        weight: 40,
        recommendedETF: "KODEX 종합채권(AA-이상)액티브",
        ticker: "273130",
        irpCategory: "안전자산",
        payoutCycle: "월배당 (초순)",
        yieldRate: 3.5,
        annual300M: 420,
        annual500M: 700,
        annual1000M: 1400,
      },
      {
        name: "부동산·인프라 리츠",
        weight: 10,
        recommendedETF: "TIGER 리츠부동산인프라",
        ticker: "329200",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (말일)",
        yieldRate: 6.5,
        annual300M: 195,
        annual500M: 325,
        annual1000M: 650,
      },
      {
        name: "실물 금현물 방어 자산",
        weight: 10,
        recommendedETF: "ACE KRX금현물",
        ticker: "411060",
        irpCategory: "위험자산",
        payoutCycle: "무배당 (수익재투자)",
        yieldRate: 1.25,
        annual300M: 38,
        annual500M: 63,
        annual1000M: 125,
      },
    ],
  },
  {
    id: "GLOBAL_DIVIDEND",
    name: "④ 한·미 통화분산 밸류업형 (달러-원화 듀얼 엔진)",
    tagline: "달러 환율 위험을 분산하고 국내 기업 밸류업 주주환원 수혜를 동시에 담는 포트폴리오",
    targetAudience: "원/달러 환율 급변동이 걱정되는 분, 국내 금융지주 밸류업 고배당(연 6~7%)의 절세 혜택을 누리고 싶은 분",
    expectedYield: 4.33,
    badgeColor: "#a855f7",
    borderColor: "rgba(168, 85, 247, 0.4)",
    bgColor: "rgba(168, 85, 247, 0.08)",
    irpCompatibility: "국채 25% 외에 안전자산 5%를 채권혼합 또는 CD금리형 ETF로 보강하면 IRP 100% 매수 가능",
    yield300M: { annual: 1298, monthly: 108 },
    yield500M: { annual: 2163, monthly: 180 },
    yield1000M: { annual: 4325, monthly: 360 },
    features: "미국 달러 자산(35%)과 한국 원화 밸류업 고배당(25%), 국내 인프라(15%)를 결합하여 환율이 오를 때는 달러 자산이, 환율이 내릴 때는 국내 배당주가 방어해 주는 듀얼 통화 포트폴리오입니다.",
    caution: "한국 고배당주는 금융지주(은행·지주사) 비중이 높으므로 경기 침체 시 분배금 변동성을 확인해야 합니다.",
    expertTip: "국내 고배당 ETF는 일반 계좌에서 매수하면 15.4% 세금이 즉시 원천징수되지만, 연금저축/IRP에서 매수하면 비과세로 100% 재투자되어 절세 효율이 가장 뛰어납니다.",
    assets: [
      {
        name: "미국 달러 배당 코어 (환노출)",
        weight: 35,
        recommendedETF: "TIGER 미국배당다우존스",
        ticker: "458730",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (15일)",
        yieldRate: 3.5,
        annual300M: 368,
        annual500M: 613,
        annual1000M: 1225,
      },
      {
        name: "한국 밸류업 금융 고배당",
        weight: 25,
        recommendedETF: "TIGER 은행고배당플러스TOP10",
        ticker: "466950",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (15일)",
        yieldRate: 5.0,
        annual300M: 375,
        annual500M: 625,
        annual1000M: 1250,
      },
      {
        name: "한국 부동산·인프라 리츠",
        weight: 15,
        recommendedETF: "KODEX 한국부동산리츠인프라",
        ticker: "476830",
        irpCategory: "위험자산",
        payoutCycle: "월배당 (말일)",
        yieldRate: 6.5,
        annual300M: 293,
        annual500M: 488,
        annual1000M: 975,
      },
      {
        name: "대한민국 국고채 안전자산",
        weight: 25,
        recommendedETF: "KOSEF 국고채10년",
        ticker: "148070",
        irpCategory: "안전자산",
        payoutCycle: "반기배당 (채권이자)",
        yieldRate: 3.5,
        annual300M: 263,
        annual500M: 438,
        annual1000M: 875,
      },
    ],
  },
];

interface DividendStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInvestmentManwon?: number; // 사용자의 현재 커버드콜/배당 투자금 (만원 단위)
  currentDividendRate?: number;     // 현재 설정된 분배율 (%)
  onApplyRate?: (rate: number) => void;
}

export function DividendStrategyModal({
  isOpen,
  onClose,
  currentInvestmentManwon = 40000,
  currentDividendRate = 9.0,
  onApplyRate,
}: DividendStrategyModalProps) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("HIGH_INCOME");
  const [activeTab, setActiveTab] = useState<"PORTFOLIOS" | "EXPERT_ETFS" | "TABLES" | "CHECKPOINTS">("PORTFOLIOS");
  const [copiedTicker, setCopiedTicker] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentInvestmentOk = currentInvestmentManwon / 10000; // 억 단위
  const selectedPortfolio = DIVIDEND_PORTFOLIOS.find((p) => p.id === selectedPortfolioId) || DIVIDEND_PORTFOLIOS[1];

  const handleCopyTicker = (ticker: string) => {
    navigator.clipboard.writeText(ticker);
    setCopiedTicker(ticker);
    setTimeout(() => setCopiedTicker(null), 2000);
  };

  // 사용자의 현재 투자금 기준 예상 배당금 계산
  const calcCustomYield = (yieldRate: number) => {
    const annualWon = Math.round((currentInvestmentManwon * (yieldRate / 100)));
    const monthlyWon = Math.round(annualWon / 12);
    return { annual: annualWon, monthly: monthlyWon };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(3, 7, 18, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          maxHeight: "92vh",
          backgroundColor: "#0b1329",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#e2e8f0",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.4rem" }}>💡</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc" }}>
                연금저축 & IRP 실전 배당 포트폴리오 가이드
              </h2>
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  fontWeight: 600,
                }}
              >
                전문가 추천 실전 ETF 10선 매핑
              </span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.45 }}>
              국내 금융투자 전문가(자산운용사·연금 전문가)들이 실제 추천하는 포트폴리오 4선과 실전 매수 가능 국내 상장 ETF(티커/종목코드)를 확인하고, 내 은퇴 자금에 즉시 적용하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              lineHeight: 1,
            }}
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Legal Disclaimer & Pension Account Notice */}
        <div
          style={{
            padding: "10px 24px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.76rem",
            color: "#fbbf24",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚠️</span>
            <span>
              <b>연금 계좌 실전 유의사항:</b> 연금저축/IRP에서는 미국 직투 ETF(SCHD 등)를 직접 살 수 없으므로, 동일 지수를 추종하는 <b>국내 상장 ETF(TIGER, SOL, ACE, KODEX 등)</b>로 담아야 합니다. IRP는 위험자산 70% 제한이 적용됩니다.
            </span>
          </div>
          {copiedTicker && (
            <span style={{ color: "#34d399", fontWeight: 700, backgroundColor: "rgba(52, 211, 153, 0.15)", padding: "2px 8px", borderRadius: "4px" }}>
              종목코드 [{copiedTicker}] 복사 완료!
            </span>
          )}
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px 24px 0 24px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            backgroundColor: "rgba(15, 23, 42, 0.5)",
          }}
        >
          {[
            { id: "PORTFOLIOS", label: "📊 전문가 4대 실전 포트폴리오" },
            { id: "EXPERT_ETFS", label: "🏢 추천 실전 ETF 10선 (티커·IRP적격)" },
            { id: "TABLES", label: "💰 투자금별 배당금 & 자산 분배율 표" },
            { id: "CHECKPOINTS", label: "📌 연금 운용 핵심 꿀팁 (격주배당 & IRP30%)" },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                  fontWeight: isTabActive ? 700 : 500,
                  color: isTabActive ? "#38bdf8" : "#94a3b8",
                  backgroundColor: isTabActive ? "rgba(56, 189, 248, 0.12)" : "transparent",
                  border: "none",
                  borderBottom: `2px solid ${isTabActive ? "#38bdf8" : "transparent"}`,
                  cursor: "pointer",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* TAB 1: 4 PORTFOLIOS */}
          {activeTab === "PORTFOLIOS" && (
            <>
              {/* 4 Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
                {DIVIDEND_PORTFOLIOS.map((p) => {
                  const isSelected = selectedPortfolioId === p.id;
                  const custom = calcCustomYield(p.expectedYield);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPortfolioId(p.id)}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor: isSelected ? p.bgColor : "rgba(15, 23, 42, 0.6)",
                        border: `1.5px solid ${isSelected ? p.badgeColor : "rgba(148, 163, 184, 0.15)"}`,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        position: "relative",
                      }}
                    >
                      {/* Top Row: Title + Yield Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>{p.name}</div>
                          <div style={{ fontSize: "0.75rem", color: p.badgeColor, marginTop: "2px", fontWeight: 600 }}>
                            {p.tagline}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            backgroundColor: p.bgColor,
                            border: `1px solid ${p.borderColor}`,
                            color: p.badgeColor,
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            textAlign: "right",
                          }}
                        >
                          연 {p.expectedYield}%
                        </div>
                      </div>

                      {/* Target Audience & IRP Note */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div
                          style={{
                            fontSize: "0.74rem",
                            backgroundColor: "rgba(0, 0, 0, 0.25)",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            color: "#cbd5e1",
                          }}
                        >
                          <b style={{ color: "#94a3b8" }}>추천 대상: </b> {p.targetAudience}
                        </div>
                        <div
                          style={{
                            fontSize: "0.71rem",
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            color: "#a5b4fc",
                            border: "1px dashed rgba(99, 102, 241, 0.3)",
                          }}
                        >
                          <b>🛡️ IRP 적합도: </b> {p.irpCompatibility}
                        </div>
                      </div>

                      {/* Asset Allocations Table with Real ETF Names & Tickers */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "2px 0" }}>
                        {p.assets.map((a, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.74rem",
                              padding: "4px 6px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(15, 23, 42, 0.4)",
                              borderBottom: i < p.assets.length - 1 ? "1px dashed rgba(148, 163, 184, 0.1)" : "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  backgroundColor: a.irpCategory === "안전자산" ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.15)",
                                  color: a.irpCategory === "안전자산" ? "#34d399" : "#fda4af",
                                  fontWeight: 600,
                                }}
                              >
                                {a.irpCategory}
                              </span>
                              <span style={{ color: "#f8fafc", fontWeight: 600 }}>{a.recommendedETF}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyTicker(a.ticker);
                                }}
                                style={{
                                  fontSize: "0.68rem",
                                  color: "#38bdf8",
                                  background: "rgba(56, 189, 248, 0.1)",
                                  border: "1px solid rgba(56, 189, 248, 0.3)",
                                  borderRadius: "3px",
                                  padding: "1px 4px",
                                  cursor: "pointer",
                                }}
                                title="종목코드 복사"
                              >
                                {a.ticker} 📋
                              </button>
                            </div>
                            <span style={{ fontWeight: 700, color: p.badgeColor }}>{a.weight}%</span>
                          </div>
                        ))}
                      </div>

                      {/* Expected Payout for User's Asset */}
                      <div
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.35)",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(148, 163, 184, 0.1)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                            현재 설정액({currentInvestmentOk > 0 ? `${currentInvestmentOk.toFixed(1)}억` : "4.0억"}) 기준 예상
                          </div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#34d399", marginTop: "2px" }}>
                            월 {custom.monthly.toLocaleString()}만원
                            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#94a3b8", marginLeft: "4px" }}>
                              (연 {custom.annual.toLocaleString()}만)
                            </span>
                          </div>
                        </div>

                        {/* Apply Button */}
                        {onApplyRate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApplyRate(p.expectedYield);
                              onClose();
                            }}
                            className="premium-button-secondary"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              borderColor: p.borderColor,
                              color: p.badgeColor,
                              backgroundColor: p.bgColor,
                              cursor: "pointer",
                              borderRadius: "6px",
                            }}
                            title={`S4 시뮬레이터 연 분배율을 ${p.expectedYield}%로 즉시 설정합니다.`}
                          >
                            ✓ 이 분배율 적용
                          </button>
                        )}
                      </div>

                      {/* Caution / Features Snippet */}
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.4 }}>
                        <span style={{ color: "#f87171" }}>⚠️ </span> {p.caution}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail View of Selected Portfolio */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  border: `1px solid ${selectedPortfolio.borderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.1rem" }}>🔍</span>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: selectedPortfolio.badgeColor }}>
                      {selectedPortfolio.name} 전문가 실전 운용 해설
                    </h3>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    가정 연 분배율: <b style={{ color: "#34d399" }}>{selectedPortfolio.expectedYield}%</b>
                  </span>
                </div>

                <div style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                  <b>포트폴리오 특징: </b> {selectedPortfolio.features}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#fca5a5", lineHeight: 1.5 }}>
                  <b>주의 및 리스크 관리: </b> {selectedPortfolio.caution}
                </div>
                {selectedPortfolio.expertTip && (
                  <div style={{ fontSize: "0.82rem", color: "#93c5fd", lineHeight: 1.5 }}>
                    <b>💡 전문가 실전 팁: </b> {selectedPortfolio.expertTip}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: 10 RECOMMENDED ETFS WITH TICKERS */}
          {activeTab === "EXPERT_ETFS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                    🏢 연금저축 & IRP 전문가 추천 실전 ETF 10선
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.76rem", color: "#94a3b8" }}>
                    국내 대형 운용사(미래에셋·삼성·한국투자·신한)의 연금 전용 월배당·인컴 핵심 상품 리스트입니다. 종목코드를 클릭하면 바로 복사할 수 있습니다.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#cbd5e1" }}>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>종목코드</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>ETF 종목명</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>운용사</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>추정 분배율</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>분배 주기</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>IRP 계좌 분류</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>전문가 추천 사유 및 핵심 특징</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXPERT_RECOMMENDED_ETFS.map((etf, idx) => (
                      <tr
                        key={etf.ticker}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.3)",
                          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                        }}
                      >
                        <td style={{ padding: "8px 10px" }}>
                          <button
                            type="button"
                            onClick={() => handleCopyTicker(etf.ticker)}
                            style={{
                              backgroundColor: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                            title="종목코드 클립보드 복사"
                          >
                            {etf.ticker} 📋
                          </button>
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: "#f8fafc" }}>{etf.name}</td>
                        <td style={{ padding: "8px 10px", color: "#cbd5e1" }}>{etf.provider}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: "#34d399" }}>
                          {etf.yieldRate > 0 ? `연 ${etf.yieldRate}%` : "성장위주"}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#a5b4fc", fontWeight: 600 }}>{etf.payoutCycle}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              backgroundColor: etf.irpEligible.includes("안전자산")
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(244, 63, 94, 0.15)",
                              color: etf.irpEligible.includes("안전자산") ? "#34d399" : "#fda4af",
                            }}
                          >
                            {etf.irpEligible}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: "0.73rem", lineHeight: 1.4 }}>
                          <b>{etf.reason}</b> <br />
                          <span style={{ color: "#64748b" }}>{etf.featureNote}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TABLES */}
          {activeTab === "TABLES" && (
            <>
              {/* Table 1: Payout By Investment Scale */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                    📊 한눈에 보기: 포트폴리오별 예상 배당금 (세전)
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    내 현재 설정 투자금: <b style={{ color: "#38bdf8" }}>{currentInvestmentOk > 0 ? `${currentInvestmentOk.toFixed(1)}억` : "4.0억"} ({currentInvestmentManwon.toLocaleString()}만원)</b>
                  </span>
                </div>

                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#cbd5e1" }}>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>포트폴리오</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>가정 수익률</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>3억 연간 (월)</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>5억 연간 (월)</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>10억 연간 (월)</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)", backgroundColor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
                          내 투자금({currentInvestmentOk > 0 ? `${currentInvestmentOk.toFixed(1)}억` : "4억"}) 연간 (월)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {DIVIDEND_PORTFOLIOS.map((p, idx) => {
                        const custom = calcCustomYield(p.expectedYield);
                        return (
                          <tr
                            key={p.id}
                            style={{
                              backgroundColor: idx % 2 === 0 ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.3)",
                              borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                            }}
                          >
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: p.badgeColor }}>{p.name}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.expectedYield}%</td>
                            <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>
                              {p.yield300M.annual.toLocaleString()}만 <span style={{ color: "#94a3b8" }}>(월 {p.yield300M.monthly}만)</span>
                            </td>
                            <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>
                              {p.yield500M.annual.toLocaleString()}만 <span style={{ color: "#94a3b8" }}>(월 {p.yield500M.monthly}만)</span>
                            </td>
                            <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>
                              {p.yield1000M.annual.toLocaleString()}만 <span style={{ color: "#94a3b8" }}>(월 {p.yield1000M.monthly}만)</span>
                            </td>
                            <td style={{ padding: "10px 12px", backgroundColor: "rgba(56, 189, 248, 0.06)", fontWeight: 700, color: "#34d399" }}>
                              {custom.annual.toLocaleString()}만 <span style={{ color: "#38bdf8", fontWeight: 600 }}>(월 {custom.monthly}만)</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Benchmark Yield by Asset Class */}
              <div style={{ marginTop: "12px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                  📋 계산에 쓴 자산별 연간 분배율 (세전, 최근 시장 기준 가정치)
                </h3>
                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#cbd5e1" }}>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>자산군</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>가정 분배율</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>대표 추천 ETF</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>비고 및 특징</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { asset: "미국배당다우존스", rate: "3.5%", etf: "TIGER/SOL 미국배당다우존스", desc: "SCHD와 동일 지수를 추종하는 국내 상장 ETF" },
                        { asset: "S&P500", rate: "1.2%", etf: "TIGER 미국S&P500", desc: "배당보다 주가 상승 위주 (성장형 엔진)" },
                        { asset: "커버드콜 (미국배당 계열)", rate: "10.0%", etf: "TIGER 미국배당+7%프리미엄다우존스", desc: "옵션 프리미엄을 수취하는 고배당 상품 (상품별 7~12% 편차)" },
                        { asset: "리츠 (부동산)", rate: "6.5%", etf: "KODEX 한국부동산리츠인프라", desc: "국내외 우량 부동산 및 인프라 월/분기 배당" },
                        { asset: "한국 고배당주", rate: "5.0%", etf: "TIGER 은행고배당플러스TOP10", desc: "은행·금융지주, 통신 등 밸류업 및 높은 배당성향" },
                        { asset: "채권", rate: "3.5%", etf: "ACE 미국30년국채액티브(H) / KODEX 종합채권", desc: "미국 국채, 국내 국고채 등 (선물형 ETF는 분배금 없음)" },
                        { asset: "금 / 현금성 (반반)", rate: "1.25%", etf: "ACE KRX금현물 / TIGER CD금리", desc: "금 0%, CD금리형/MMF 2.5%의 가중평균" },
                        { asset: "3번 포트폴리오의 배당주 (미국·한국 반반)", rate: "4.25%", etf: "SOL 미국배당미국채혼합50", desc: "미국배당(3.5%)과 한국고배당(5.0%)의 가중평균" },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.3)",
                            borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                          }}
                        >
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: "#f8fafc" }}>{item.asset}</td>
                          <td style={{ padding: "8px 12px", color: "#38bdf8", fontWeight: 700 }}>{item.rate}</td>
                          <td style={{ padding: "8px 12px", color: "#34d399", fontWeight: 600 }}>{item.etf}</td>
                          <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{item.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: CHECKPOINTS & EXPERT TIPS */}
          {activeTab === "CHECKPOINTS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Special Tip Card: Biweekly Dividend System */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ fontSize: "1.6rem" }}>📅</div>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#a5b4fc", marginBottom: "4px" }}>
                    전문가 실전 꿀팁 ①: 한 달에 두 번 월급 받는 '격주 배당 캘린더'
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                    국내 월배당 ETF는 운용사별로 분배금 지급일이 다릅니다. <br />
                    • <b>월중(매월 15일경) 지급:</b> TIGER 미국배당다우존스, TIGER 은행고배당플러스TOP10, ACE 미국배당다우존스 <br />
                    • <b>월말(매월 28~31일경) 지급:</b> SOL 미국배당다우존스, KODEX 한국부동산리츠인프라, TIGER 미국배당+7%프리미엄 <br />
                    두 계열을 50:50으로 나누어 담으면 매월 15일과 말일에 두 번 배당이 입금되는 <b>격주 월급 시스템</b>을 구축할 수 있습니다.
                  </div>
                </div>
              </div>

              {/* Special Tip Card: IRP 30% Rule Hack */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ fontSize: "1.6rem" }}>🛡️</div>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#34d399", marginBottom: "4px" }}>
                    전문가 실전 꿀팁 ②: IRP 안전자산 30%를 배당주로 채우는 법
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                    IRP 계좌는 법적으로 위험자산(주식형 ETF)을 70%까지만 담을 수 있습니다. 이때 나머지 30%를 단순 예금에 묵혀두지 않고,
                    <b>'SOL 미국배당미국채혼합50 (490490)'</b> 또는 <b>'ACE 미국배당다우존스채권혼합50 (494340)'</b> 같은 <b>채권혼합형 ETF</b>를 매수하면
                    해당 상품 자체가 법정 안전자산으로 인정됩니다. 이렇게 하면 계좌 전체의 실질 배당주 비중을 <b>최대 85%까지</b> 끌어올려 복리 수익률을 극대화할 수 있습니다.
                  </div>
                </div>
              </div>

              {[
                {
                  no: "1",
                  title: "연금계좌의 세제 혜택을 100% 활용하세요",
                  desc: "일반 계좌에서는 배당을 받을 때마다 15.4%의 배당소득세가 즉시 원천징수되고, 연 2,000만원 초과 시 금융소득 종합과세 및 건보료 부과 대상이 됩니다. 반면 연금저축·IRP에서는 배당에 대한 세금이 인출 시점까지 이연되며(과세이연), 55세 이후 연금으로 수령할 때 3.3~5.5%의 아주 낮은 세율이 적용됩니다.",
                  color: "#38bdf8",
                },
                {
                  no: "2",
                  title: "나이와 라이프사이클에 따라 비중을 점진적으로 이동하세요",
                  desc: "은퇴까지 시간이 많이 남은 30~40대에는 ①번 배당성장형으로 자산의 크기를 키우고, 은퇴가 다가올수록 ④번(한·미 분산)이나 ②번(고배당 인컴), ③번(안정 혼합) 쪽으로 서서히 무게중심을 옮겨가는 것이 정석적인 생애주기 자산배분입니다.",
                  color: "#10b981",
                },
                {
                  no: "3",
                  title: "1년에 한 번 정기 리밸런싱을 실천하세요",
                  desc: "시간이 지나면 많이 오른 자산의 비중이 커지고 덜 오른 자산의 비중이 작아집니다. 1년에 한 번 특정 일자를 정해 목표 비중으로 되돌리는 리밸런싱(비싼 자산 일부 매도, 싼 자산 추가 매수)을 진행하면 변동성을 낮추고 장기 복리 효과를 극대화할 수 있습니다.",
                  color: "#f59e0b",
                },
                {
                  no: "4",
                  title: "단순 분배율만 보지 말고 '총수익률(배당+원금)'을 확인하세요",
                  desc: "배당률이 연 10~12%로 높아 보여도, 주가가 지속적으로 하락하여 원금이 깎여 나간다면 실질 수익은 마이너스가 될 수 있습니다. 특히 커버드콜 상품은 주가 상승에 제약이 있으므로, 배당금과 원금의 주가 변동을 합친 '토탈 리턴(Total Return)'을 반드시 검토해야 합니다.",
                  color: "#f87171",
                },
                {
                  no: "5",
                  title: "연 1,500만원 사적연금 절세 한도와 건강보험료 기준을 점검하세요",
                  desc: "연금저축·IRP(세액공제 납입분 및 운용수익)에서 1년에 1,500만원을 초과하여 인출하면 3.3~5.5% 저율과세 대신 16.5% 분리과세 또는 종합과세를 선택해야 합니다. 또한 은퇴 후 피부양자 자격을 유지하려면 배당 등 금융소득을 연 1,000만원(부부 분산 시 2,000만원) 이하로 관리하는 전략이 중요합니다.",
                  color: "#a855f7",
                },
              ].map((cp) => (
                <div
                  key={cp.no}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.15)",
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: cp.color,
                      color: "#0f172a",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                  >
                    {cp.no}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>
                      {cp.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.55 }}>
                      {cp.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(15, 23, 42, 0.7)",
          }}
        >
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.5, maxWidth: "75%" }}>
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>⚠️ 금융당국 핵심 유의사항:</span> 분배율은 확정 수익이 아니며 기초자산 하락 시 원금(NAV) 손실이 발생할 수 있습니다. 옵션 매도로 상승이 제한되며, 장기 트랙레코드가 짧으므로 보수적 자본손익 시나리오를 함께 점검하세요. (종목코드 복사 📋 지원)
          </div>
          <button
            onClick={onClose}
            className="premium-button"
            style={{
              padding: "8px 20px",
              fontSize: "0.82rem",
              fontWeight: 700,
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
