"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { downloadElementAsPdf } from "@/utils/exportPdf";
import { exportWithdrawalFlowsCsv } from "@/utils/exportCsv";
import type { StrategySimulationResult } from "@/services/withdrawalCalculator";
import { runHouseholdScenarios } from "@/services/householdScenarios";
import { applyNpsOptions } from "@/services/returnRepaymentCalculator";
import { runCoupleSimulation, personParams, deferYearsOf } from "@/services/coupleSimulation";
import ThemeToggle from "@/components/ThemeToggle";
import FullscreenToggle from "@/components/FullscreenToggle";
import AiHelper from "@/components/AiHelper";
import CoupleSimulationSection from "@/components/CoupleSimulationSection";
import { paidTotalsOf } from "@/services/paidTotals";
import DashboardSidebar from "@/components/DashboardSidebar";
import PersonaPresetModal from "@/components/PersonaPresetModal";
import NpsEarlyDeferralModal from "@/components/NpsEarlyDeferralModal";
import { PrivatePensionTaxModal } from "@/components/PrivatePensionTaxModal";
import { HealthInsuranceBillModal } from "@/components/HealthInsuranceBillModal";
import { ReverseMortgageModal } from "@/components/ReverseMortgageModal";
import { IncomeBridgeModal } from "@/components/IncomeBridgeModal";
import { SurvivorCareModal } from "@/components/SurvivorCareModal";
import { IsaPensionTransferModal } from "@/components/IsaPensionTransferModal";

// Import Recharts components
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Area,
  Line,
  ComposedChart,
  ReferenceLine,
  DefaultLegendContent,
} from "recharts";
import { PENSION_SERIES, SURVIVOR_FILL, emphasisProps } from "@/components/pensionSeries";

// Custom Tooltip component for Recharts ComposedChart
const CustomTooltip = ({ active, payload, label, notes, colors }: any) => {
  if (active && payload && payload.length) {
    const activePayload = payload.filter((entry: any) => (entry.value || 0) > 0);
    if (activePayload.length === 0) return null;
    // 차트 값은 연 금액(만원). 합계는 쌓인 세전 항목만 (세후 선 제외)
    const preTaxTotal = activePayload
      .filter((entry: { dataKey?: string }) => entry.dataKey !== "totalPostTax")
      .reduce((sum: number, entry: { value?: number }) => sum + (entry.value || 0), 0);
    const year = payload[0]?.payload?.year;

    return (
      <div style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
        boxShadow: "var(--shadow-premium)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
      }}>
        <p style={{
          margin: "0 0 8px 0",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
        }}>
          <span>{label}세{year ? ` · ${year}년` : ""}</span>
          <span>세전 합계 {preTaxTotal.toLocaleString()} 만원/년</span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {activePayload.map((entry: any, index: number) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors?.[entry.name] ?? entry.color }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{entry.name}</span>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {entry.value.toLocaleString()} 만원/년
                {notes?.[entry.dataKey] && <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> {notes[entry.dataKey]}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip component for Recharts BarChart
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
        boxShadow: "var(--shadow-premium)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
      }}>
        <p style={{
          margin: "0 0 8px 0",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "6px"
        }}>{label}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: entry.color || entry.fill }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{entry.name}</span>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {entry.value.toLocaleString()} 만원
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// 화면에 보이는 시나리오 (S2 국민연금 5년 연기는 왼쪽 입력의 연기 옵션으로 흡수)
type ScenarioTab = Exclude<StrategySimulationResult["strategyId"], "S2">;
// S31-4: 인출전략 연도별 상세 표 보기 옵션 필터
type FlowFilterMode = "ALL" | "5YEARS" | "EVENTS";

export default function DashboardPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [isMounted, setIsMounted] = useState(false);

  // Advanced interactive settings for withdrawal simulator
  const [personalTaxCreditRatio, setPersonalTaxCreditRatio] = useState(0.8);
  const [retirementLumpSumTaxRate, setRetirementLumpSumTaxRate] = useState(0.08);
  const [otherIncomeAnnual, setOtherIncomeAnnual] = useState(0);
  const [publicPensionTaxableRatio, setPublicPensionTaxableRatio] = useState(0.5);

  // Tab Selection for withdrawal simulator
  const [selectedTab, setActiveTab] = useState<ScenarioTab | null>(null); // 고르기 전에는 추천(Best) 전략
  const [scenarioHighlight, setScenarioHighlight] = useState<string | null>(null); // 인출전략 그래프 범례로 고른 계열

  // S3 Custom sliders state
  const [s3StartAges, setS3StartAges] = useState<{ [id: string]: number }>({});
  const [s3Periods, setS3Periods] = useState<{ [id: string]: number }>({});

  // PDF download loading state
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [detailTableOpen, setDetailTableOpen] = useState(true); // 연도별 상세 표 접기
  const [flowFilter, setFlowFilter] = useState<FlowFilterMode>("ALL"); // S31-4: 인출전략 연도별 표 필터

  // 왼쪽 입력 열 접기
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 대표 가구 페르소나 모달 열림 상태
  const [personaModalOpen, setPersonaModalOpen] = useState(false);

  // 국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 모달 열림 상태
  const [bepModalOpen, setBepModalOpen] = useState(false);

  // 사적연금 1,500만원 절세 한도 최적화 모달 열림 상태
  const [tax15ModalOpen, setTax15ModalOpen] = useState(false);

  // 은퇴 후 지역건강보험료 모의 고지서 모달 열림 상태
  const [healthBillModalOpen, setHealthBillModalOpen] = useState(false);

  // 주택연금(역모기지) 결합 모달 열림 상태
  const [reverseMortgageModalOpen, setReverseMortgageModalOpen] = useState(false);

  // 소득 공백기(크레바스) 브릿지 플래너 모달 열림 상태
  const [incomeBridgeModalOpen, setIncomeBridgeModalOpen] = useState(false);

  // 홀로 남은 배우자(1인 가구) 생애 케어 모달 열림 상태
  const [survivorCareModalOpen, setSurvivorCareModalOpen] = useState(false);

  // ISA 만기 자금 연금계좌 전환 모달 열림 상태
  const [isaTransferModalOpen, setIsaTransferModalOpen] = useState(false);

  const handleExportData = () => {
    const data = {
      nationalPension: store.nationalPension,
      basicPension: store.basicPension,
      retirementPensions: store.retirementPensions,
      personalPensions: store.personalPensions,
      pensionInsurances: store.pensionInsurances,
      simulationParams: store.simulationParams,
      additionalPayment: store.additionalPayment,
      returnRepayment: store.returnRepayment,
      spouse: store.spouse,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `pensionlab_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (
            parsedData.nationalPension &&
            parsedData.basicPension &&
            parsedData.simulationParams
          ) {
            store.importStoreData(parsedData);
            alert("성공적으로 은퇴 설계 데이터를 복원했습니다!");
          } else {
            alert("올바르지 않은 백업 파일 형식입니다.");
          }
        } catch (err) {
          console.error(err);
          alert("파일 읽기 도중 오류가 발생했습니다.");
        }
      };
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedUserId = localStorage.getItem("pensionlab_user_id");
    if (!savedUserId && store.nationalPension.contributionMonths === 0) {
      router.push("/onboarding");
    }
  }, [router, store.nationalPension.contributionMonths]);

  // Sync S3 defaults on initial mount
  useEffect(() => {
    if (isMounted) {
      const defaultStartAges: { [id: string]: number } = {};
      const defaultPeriods: { [id: string]: number } = {};
      
      store.retirementPensions.forEach(p => {
        defaultStartAges[p.id] = store.simulationParams.retirementAge;
        defaultPeriods[p.id] = 10;
      });
      store.personalPensions.forEach(p => {
        defaultStartAges[p.id] = p.desiredStartAge;
        defaultPeriods[p.id] = p.receivingPeriod;
      });
      store.pensionInsurances.forEach(i => {
        defaultStartAges[i.id] = store.simulationParams.retirementAge;
        defaultPeriods[i.id] = 20;
      });
      // 배우자 계좌 (가구 기준 시나리오)
      store.spouse.retirementPensions.forEach(p => {
        defaultStartAges[p.id] = store.simulationParams.spouseRetirementAge;
        defaultPeriods[p.id] = 10;
      });
      store.spouse.personalPensions.forEach(p => {
        defaultStartAges[p.id] = p.desiredStartAge;
        defaultPeriods[p.id] = p.receivingPeriod;
      });
      store.spouse.pensionInsurances.forEach(i => {
        defaultStartAges[i.id] = store.simulationParams.spouseRetirementAge;
        defaultPeriods[i.id] = 20;
      });

      setS3StartAges(defaultStartAges);
      setS3Periods(defaultPeriods);
    }
  }, [isMounted, store.retirementPensions, store.personalPensions, store.pensionInsurances, store.spouse, store.simulationParams.retirementAge, store.simulationParams.spouseRetirementAge]);

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>연금 분석 엔진을 구동하는 중...</p>
      </div>
    );
  }

  // 백업·복원·페르소나 버튼: 부부 시뮬레이션 제목 오른쪽 (배우자 없음이면 같은 자리 오른쪽 정렬)
  const dataActions = (
    <div className="data-actions-bar" style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
      <button
        id="btn-persona-preset"
        onClick={() => setPersonaModalOpen(true)}
        className="premium-button"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          color: "#ffffff",
          border: "none",
        }}
        title="대한민국 대표 가구 페르소나 데이터 1초 만에 불러오기"
      >
        👫 대표 페르소나 체험
      </button>
      <button
        id="btn-nps-bep-actions"
        onClick={() => setBepModalOpen(true)}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(249, 115, 22, 0.4)",
          color: "#f97316",
          background: "rgba(249, 115, 22, 0.08)",
        }}
        title="국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 분석기"
      >
        ⚖️ 손익분기(BEP)
      </button>
      <button
        id="btn-tax15-actions"
        onClick={() => setTax15ModalOpen(true)}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(56, 189, 248, 0.4)",
          color: "#38bdf8",
          background: "rgba(56, 189, 248, 0.08)",
        }}
        title="사적연금 1,500만원 절세 한도 최적화기"
      >
        ⚖️ 절세(1,500만)
      </button>
      <button
        id="btn-health-bill-actions"
        onClick={() => setHealthBillModalOpen(true)}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(16, 185, 129, 0.4)",
          color: "#34d399",
          background: "rgba(16, 185, 129, 0.08)",
        }}
        title="은퇴 후 지역건강보험료 모의 고지서 및 임의계속가입(36개월) 계산기"
      >
        🏥 지역건보료
      </button>
      <button
        id="btn-reverse-mortgage-actions"
        onClick={() => setReverseMortgageModalOpen(true)}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(251, 191, 36, 0.4)",
          color: "#fbbf24",
          background: "rgba(251, 191, 36, 0.08)",
        }}
        title="한국주택금융공사 주택연금(역모기지) 결합 시뮬레이터"
      >
        🏠 주택연금
      </button>
      <button
        id="btn-income-bridge-actions"
        onClick={() => setIncomeBridgeModalOpen(true)}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(56, 189, 248, 0.4)",
          color: "#38bdf8",
          background: "rgba(56, 189, 248, 0.08)",
        }}
        title="은퇴 소득 공백기(소득 크레바스) 브릿지 집중 플래너"
      >
        🌉 소득공백기
      </button>
      <button
        id="btn-survivor-care-actions"
        onClick={() => setSurvivorCareModalOpen(true)}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(244, 63, 94, 0.4)",
          color: "#fb7185",
          background: "rgba(244, 63, 94, 0.08)",
        }}
        title="홀로 남은 배우자(1인 가구) 생애 케어 시뮬레이터"
      >
        🕊️ 유족케어
      </button>
      <button
        id="btn-isa-transfer-actions"
        onClick={() => setIsaTransferModalOpen(true)}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(168, 85, 247, 0.4)",
          color: "#c084fc",
          background: "rgba(168, 85, 247, 0.08)",
        }}
        title="ISA 만기 자금 연금계좌 전환 및 3년 풍차돌리기 절세 플래너"
      >
        💎 ISA전환
      </button>
      <button
        id="btn-export-data"
        onClick={handleExportData}
        className="premium-button"
        style={{ fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700 }}
      >
        📤 백업 (JSON 다운)
      </button>
      <button
        id="btn-import-data"
        onClick={() => document.getElementById("input-file-import")?.click()}
        className="premium-button-secondary"
        style={{ fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700 }}
      >
        📥 복원 (JSON 업)
      </button>
      <input type="file" id="input-file-import" accept=".json" onChange={handleImportData} style={{ display: "none" }} />
    </div>
  );

  // 반납·추납 「대시보드 반영」이 켜진 것만 적용한 국민연금 (본인·배우자)
  const selfApplied = applyNpsOptions(store.nationalPension, store.additionalPayment, store.returnRepayment, store.simulationParams);
  const nationalForSim = selfApplied.national;
  const hasSpouse = store.simulationParams.hasSpouse;
  const spouseApplied = applyNpsOptions(
    store.spouse.nationalPension,
    store.spouse.additionalPayment,
    store.spouse.returnRepayment,
    personParams(store.simulationParams, "SPOUSE")
  );
  const selfPensions = {
    national: nationalForSim,
    retirementPensions: store.retirementPensions,
    personalPensions: store.personalPensions,
    pensionInsurances: store.pensionInsurances,
  };
  const spousePensions = hasSpouse
    ? {
        national: spouseApplied.national,
        retirementPensions: store.spouse.retirementPensions,
        personalPensions: store.spouse.personalPensions,
        pensionInsurances: store.spouse.pensionInsurances,
      }
    : null;
  const coupleResult = runCoupleSimulation(selfPensions, spousePensions, store.simulationParams, store.basicPension);
  const selfPaid = paidTotalsOf(selfPensions, store.simulationParams);
  const spousePaid = spousePensions ? paidTotalsOf(spousePensions, personParams(store.simulationParams, "SPOUSE")) : null;

  // 인출전략 시나리오: 부부 가구 기준. 국민연금·기초연금(연기·유족연금 포함)은 위 시뮬레이션 값을 그대로 쓰고
  // 세금·건보료·사적연금 한도는 사람별로 계산해 합산한다
  const withdrawalSimulation = runHouseholdScenarios(selfPensions, spousePensions, store.simulationParams, store.basicPension, coupleResult, {
    personalTaxCreditRatio,
    retirementLumpSumTaxRate,
    otherIncomeAnnual,
    publicPensionTaxableRatio,
    s3CustomStartAges: s3StartAges,
    s3CustomPeriods: s3Periods,
  });

  // 선택 전에는 생애 세후 수령액이 가장 많은 추천(Best) 전략을 보여 주고 강조한다
  const resultOf = (k: ScenarioTab) => withdrawalSimulation[k.toLowerCase() as Lowercase<ScenarioTab>];
  const bestTab = (["S0", "S1", "S3", "S4"] as ScenarioTab[]).reduce((b, k) =>
    resultOf(k).lifetimeTotalPostTax > resultOf(b).lifetimeTotalPostTax ? k : b
  );
  const activeTab: ScenarioTab = selectedTab ?? bestTab;
  const activeResult: StrategySimulationResult = resultOf(activeTab);

  // 인출전략 그래프: 부부 통합 시뮬레이션과 같은 계열(사람별·유족연금)과 색. 값은 연 세전 금액(만원)
  const survivorName = `${coupleResult.survivorInfo?.deceased === "SPOUSE" ? "본인" : "배우자"} 유족연금`;
  const scenarioChartData: Record<string, number>[] = activeResult.flows.map((f) => {
    // 사람별 내역이 있으면 사망 후 없는 쪽은 0 (가구 합으로 채우면 유족연금이 본인 몫으로 한 번 더 쌓인다)
    const zero = { national: 0, basic: 0, retirement: 0, personal: 0, insurance: 0, dividend: 0 };
    const s = f.parts
      ? (f.parts.self ?? zero)
      : { national: f.nationalPreTax, basic: f.basicPreTax, retirement: f.retirementPreTax, personal: f.personalPreTax, insurance: f.insurancePreTax, dividend: f.dividendPreTax };
    const p = f.parts?.spouse ?? zero;
    const svSelf = f.parts?.survivorSelf ?? 0;
    const svSpouse = f.parts?.survivorSpouse ?? 0;
    // 만원 단위로 반올림: 월액×12 환산에서 남는 소수(예: 유족연금만 받는 해의 0.5만원)가 계열로 보이지 않게
    const r = (v: number) => Math.max(0, Math.round(v));
    return {
      age: f.age,
      year: f.year,
      본인국민연금: r(s.national - svSelf),
      유족연금: r(svSelf + svSpouse),
      배우자국민연금: r(p.national - svSpouse),
      "본인 기초연금": r(s.basic),
      "배우자 기초연금": r(p.basic),
      "본인 퇴직연금": r(s.retirement),
      "배우자 퇴직연금": r(p.retirement),
      "본인 개인연금": r(s.personal + s.insurance),
      "배우자 개인연금": r(p.personal + p.insurance),
      "커버드콜 배당": r(f.dividendPreTax),
      totalPostTax: f.totalPostTax,
    };
  });
  // 금액이 있는 계열만 (기초연금처럼 입력이 없으면 빠진다)
  const scenarioSeries = [...PENSION_SERIES, { key: "커버드콜 배당", color: "#a78bfa" }].filter((s) =>
    scenarioChartData.some((d) => d[s.key] > 0)
  );
  const scenarioColors: Record<string, string> = { [survivorName]: SURVIVOR_FILL };
  // 탭을 바꿔 고른 계열이 없어지면 강조를 풀어 둔다
  const activeHighlight =
    scenarioHighlight && (scenarioHighlight === "totalPostTax" || scenarioSeries.some((s) => s.key === scenarioHighlight)) ? scenarioHighlight : null;
  // 툴팁의 (납부총액/지급총액): 지급은 그래프 기간 세전 수령 합계
  const scenarioPaid: Record<string, number | null> = {
    본인국민연금: selfPaid.national,
    배우자국민연금: spousePaid?.national ?? null,
    "본인 퇴직연금": selfPaid.retirement,
    "배우자 퇴직연금": spousePaid?.retirement ?? null,
    "본인 개인연금": selfPaid.personal + selfPaid.insurance,
    "배우자 개인연금": spousePaid ? spousePaid.personal + spousePaid.insurance : null,
  };
  const scenarioNotes = Object.fromEntries(
    scenarioSeries.map(({ key }) => {
      const payout = scenarioChartData.reduce((sum, d) => sum + d[key], 0);
      const paidAmount = scenarioPaid[key];
      return [key, `(${paidAmount ? `${Math.round(paidAmount).toLocaleString()}만원` : "-"}/${Math.round(payout).toLocaleString()}만원)`];
    })
  );
  const firstDeath = coupleResult.firstDeath;
  const firstDeathAge = firstDeath ? activeResult.flows.find((f) => f.year === firstDeath.year)?.age : undefined;

  const totalFlows = activeResult.flows.reduce((acc, flow) => {
    return {
      totalPreTax: acc.totalPreTax + flow.totalPreTax,
      nationalPreTax: acc.nationalPreTax + flow.nationalPreTax,
      retirementPreTax: acc.retirementPreTax + flow.retirementPreTax,
      personalPreTax: acc.personalPreTax + flow.personalPreTax,
      insurancePreTax: acc.insurancePreTax + flow.insurancePreTax,
      taxOnRetirement: acc.taxOnRetirement + flow.taxOnRetirement,
      taxOnPersonal: acc.taxOnPersonal + flow.taxOnPersonal,
      healthInsurance: acc.healthInsurance + flow.healthInsurance,
      totalPostTax: acc.totalPostTax + flow.totalPostTax,
      deficit: acc.deficit + flow.deficit,
    };
  }, {
    totalPreTax: 0,
    nationalPreTax: 0,
    retirementPreTax: 0,
    personalPreTax: 0,
    insurancePreTax: 0,
    taxOnRetirement: 0,
    taxOnPersonal: 0,
    healthInsurance: 0,
    totalPostTax: 0,
    deficit: 0,
  });

  // S31-4: 인출전략 연도별 상세 표 필터링 계산
  const filteredFlows = (() => {
    const flows = activeResult.flows;
    if (flowFilter === "ALL") return flows;
    if (flowFilter === "5YEARS") {
      return flows.filter((f, i) => i % 5 === 0 || i === flows.length - 1);
    }
    // EVENTS: 주요 이벤트 마일스톤
    return flows.filter((f, i) => {
      if (i === 0 || i === flows.length - 1) return true;
      if (f.nationalPreTax > 0 && (i === 0 || flows[i - 1].nationalPreTax === 0)) return true;
      if (f.age === 65 || f.age === 70 || f.age === 80) return true;
      if (i > 0 && flows[i - 1].retirementPreTax > 0 && f.retirementPreTax === 0) return true;
      if (i > 0 && flows[i - 1].personalPreTax > 0 && f.personalPreTax === 0) return true;
      if (f.deficit > 0 && (i === 0 || flows[i - 1].deficit === 0)) return true;
      if (activeResult.lostDependencyAge && f.age === activeResult.lostDependencyAge) return true;
      if (firstDeathAge && f.age === firstDeathAge) return true;
      return false;
    });
  })();

  const handleExportFlowsCsv = () => {
    exportWithdrawalFlowsCsv(activeResult.flows, {
      strategyId: activeResult.strategyId,
      strategyName: activeResult.strategyName,
      hasSpouse,
    });
  };

  const barChartData = [
    {
      name: "시뮬레이션 기준 (S0)",
      "세후 수령액": withdrawalSimulation.s0.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s0.lifetimeTotalTaxAndHI,
    },
    {
      name: "절세형 (S1)",
      "세후 수령액": withdrawalSimulation.s1.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s1.lifetimeTotalTaxAndHI,
    },
    {
      name: "커스텀 (S3)",
      "세후 수령액": withdrawalSimulation.s3.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s3.lifetimeTotalTaxAndHI,
    },
    {
      name: "하이브리드 (S4)",
      "세후 수령액": withdrawalSimulation.s4.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s4.lifetimeTotalTaxAndHI,
    }
  ];

  // S2(국민연금 5년 연기)는 왼쪽 입력의 국민연금 연기 옵션으로 흡수
  const strategies = [withdrawalSimulation.s0, withdrawalSimulation.s1, withdrawalSimulation.s3, withdrawalSimulation.s4];
  const bestStrategy = [...strategies].sort((a, b) => b.lifetimeTotalPostTax - a.lifetimeTotalPostTax)[0];

  // PDF Report Capture
  const handleDownloadPDF = async () => {
    setPdfDownloading(true);
    try {
      const element = document.getElementById("withdrawal-report-root");
      if (!element) throw new Error("캡처할 영역을 찾을 수 없습니다.");
      // 부부 시뮬레이션 PDF와 같은 공용 함수: 테마 배경 유지, JPEG로 용량 축소, 길면 여러 쪽
      await downloadElementAsPdf(element, `연금_인출전략_정밀분석_보고서_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <main style={styles.container} className="dash-page">
      {/* Background decoration */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.logo}>
            Pension<span className="gradient-text">Lab</span>
          </Link>
          <nav style={styles.navLinks}>
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>자산관리</span>
            <Link href="/dashboard/ai-advisor" style={styles.navItem}>AI포트폴리오 진단</Link>
            <Link href="/news" style={styles.navItem}>관련 뉴스</Link>
            <Link href="/youtube" style={styles.navItem}>추천영상</Link>
          </nav>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <AiHelper
              pageName="대시보드(결과 화면: 부부 통합 연금 시뮬레이션·인출전략 시나리오 비교)"
              examples={[
                "지금 화면의 추천 전략이 왜 가장 유리한가요?",
                "본인 기대수명 이후 가구 월 연금이 줄어드는 이유는?",
                "유족연금과 「본인 연금 + 유족연금 30%」 중 무엇이 유리한가요?",
              ]}
              buttonClassName="premium-button-secondary"
              buttonStyle={{ padding: "8px 16px" }}
            />
            <button
              onClick={() => setPersonaModalOpen(true)}
              className="premium-button"
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
                border: "none",
              }}
              id="btn-header-persona"
              title="대표 가구 페르소나 데이터 불러오기"
            >
              <span>👫</span>
              <span>페르소나 체험</span>
            </button>
            <button
              onClick={() => setBepModalOpen(true)}
              className="premium-button-secondary"
              style={{
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
                borderColor: "rgba(249, 115, 22, 0.4)",
                color: "#f97316",
                background: "rgba(249, 115, 22, 0.08)",
              }}
              id="btn-header-nps-bep"
              title="국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 분석기"
            >
              <span>⚖️</span>
              <span>손익분기(BEP)</span>
            </button>
            <Link href="/onboarding" className="premium-button-secondary" style={{ padding: "8px 16px" }} id="btn-re-onboard">
              정보 재입력
            </Link>
            <button
              onClick={() => {
                store.resetStore();
                localStorage.removeItem("pensionlab_user_id");
                router.push("/onboarding");
              }}
              className="premium-button"
              style={{ padding: "8px 16px", background: "var(--danger)" }}
              id="btn-reset-data"
            >
              초기화
            </button>
            <FullscreenToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div style={styles.contentBody} className="dash-body">
        {/* 왼쪽 입력 열(접기 가능) : 오른쪽 결과 = 1 : 4 */}
        <div className={`dash-layout${sidebarCollapsed ? " collapsed" : ""}`}>
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            personalTaxCreditRatio={personalTaxCreditRatio}
            setPersonalTaxCreditRatio={setPersonalTaxCreditRatio}
            retirementLumpSumTaxRate={retirementLumpSumTaxRate}
            setRetirementLumpSumTaxRate={setRetirementLumpSumTaxRate}
            otherIncomeAnnual={otherIncomeAnnual}
            setOtherIncomeAnnual={setOtherIncomeAnnual}
            s3StartAges={s3StartAges}
            setS3StartAges={setS3StartAges}
            s3Periods={s3Periods}
            setS3Periods={setS3Periods}
            onOpenTax15Modal={() => setTax15ModalOpen(true)}
            onOpenHealthBillModal={() => setHealthBillModalOpen(true)}
            onOpenReverseMortgageModal={() => setReverseMortgageModalOpen(true)}
            onOpenIncomeBridgeModal={() => setIncomeBridgeModalOpen(true)}
            onOpenSurvivorCareModal={() => setSurvivorCareModalOpen(true)}
            onOpenIsaTransferModal={() => setIsaTransferModalOpen(true)}
          />
          {/* 결과 칸만 스크롤 (제목줄·입력 열은 고정) */}
          <div style={styles.results} className="dash-results">
        {/* Local Security & Caching Banner */}
        <div style={styles.topSecurityBanner} className="premium-card animate-fade-in">
          <span>🔒 <strong>개인정보 안심 보장</strong>: 회원님의 소중한 은퇴 설계 정보는 서버에 전송/저장되지 않으며, 오직 웹 브라우저(LocalStorage)에만 안전하게 보관되므로 유출 걱정 없이 안심하고 이용해 주세요.</span>
        </div>

        {/* 추납 반영 배지: 추가납부 탭에서 대시보드 반영을 켠 경우에만 표시 */}
        {nationalForSim !== store.nationalPension && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            width: "fit-content",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            color: "var(--text-accent)",
            fontSize: "0.8rem",
            fontWeight: 600,
          }} className="animate-fade-in">
            🔁 {[selfApplied.addedMonths > 0 && `추납 ${selfApplied.addedMonths}개월`, selfApplied.restoredMonths > 0 && `반납 ${selfApplied.restoredMonths}개월`].filter(Boolean).join(" · ")} 반영 (추정치 · 정확한 금액은 국민연금공단 1355 확인)
          </div>
        )}

        {/* ① 부부 통합 연금 시뮬레이션 (배우자 있을 때만). 없으면 백업·복원 버튼만 따로 둔다 */}
        {hasSpouse ? (
          <CoupleSimulationSection
            result={coupleResult}
            selfStartAge={store.simulationParams.nationalPensionStartAge + deferYearsOf(store.simulationParams)}
            spouseStartAge={store.simulationParams.spouseNationalPensionStartAge + deferYearsOf(personParams(store.simulationParams, "SPOUSE"))}
            actions={dataActions}
            paid={{ self: selfPaid, spouse: spousePaid }}
            onOpenBepModal={() => setBepModalOpen(true)}
          />
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>{dataActions}</div>
        )}

        {/* ② 인출전략 시나리오 비교 (세후) */}
        <section style={styles.resultContainer} className="animate-fade-in">
          <div id="withdrawal-report-root" style={styles.pdfRootContainer}>
            {/* 1. Comparison Summary */}
            <div style={styles.dashboardCard} className="premium-card">
              <div style={styles.dashboardHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", width: "100%" }}>
                  <h3 style={{ ...styles.dashboardTitle, marginTop: 0 }}>인출전략 시나리오 비교 (세후)</h3>
                  {/* 버튼은 PDF 캡처에서 제외 */}
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={pdfDownloading}
                    data-html2canvas-ignore
                    className="premium-button-secondary no-print"
                    style={{ fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700 }}
                  >
                    {pdfDownloading ? "PDF 생성 중..." : "📄 인출전략 정밀분석 보고서 PDF 다운로드"}
                  </button>
                </div>
                <p style={styles.chartSubtitle}>
                  {hasSpouse ? "부부 가구 기준입니다. 국민연금·기초연금(연기·유족연금 포함)은 위 부부 통합 시뮬레이션 값을 그대로 쓰고," : "국민연금·기초연금(연기 포함)은 통합 시뮬레이션 값을 그대로 쓰고,"}
                  S0는 퇴직·개인연금도 통합 시뮬레이션의 인출 방식(왼쪽 입력 옵션) 그대로, 나머지는 인출 방식만 시나리오별로 달리해 세금·건보료를 {hasSpouse ? "사람별로 계산한 뒤 합산" : "계산"}합니다.
                  재산·금융소득·기타 소득과 S4 배당(부부 분산을 끄면)은 본인 명의로 봅니다.
                </p>
              </div>

              <div style={styles.divider} />

              {/* Best Strategy Recommendation Card */}
              <div style={styles.bestStrategyCard}>
                <div style={{ fontSize: "1.75rem" }}>💡</div>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                    추천 절세 전략: <span className="gradient-text">{bestStrategy.strategyName}</span>
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
                    이 시나리오 적용 시 생애 총 세후 수령액은 약 <strong>{bestStrategy.lifetimeTotalPostTax.toLocaleString()}만원</strong>으로, 
                    기존 계획 대비 세후 소득을 극대화할 수 있습니다. 
                  </p>
                </div>
              </div>

              {/* Side-by-Side Comparison grid */}
              <div style={styles.comparisonGrid}>
                {strategies.map((strat) => (
                  <div
                    key={strat.strategyId}
                    style={{
                      ...styles.stratCompareCard,
                      border: strat.strategyId === activeTab ? "2px solid var(--primary)" : "1px solid var(--border)",
                      backgroundColor: strat.strategyId === activeTab ? "rgba(99, 102, 241, 0.03)" : "var(--surface)"
                    }}
                    onClick={() => setActiveTab(strat.strategyId as ScenarioTab)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={styles.compareId}>{strat.strategyId} 전략</span>
                      {strat.strategyId === bestStrategy.strategyId && (
                        <span style={styles.recommendBadge}>Best</span>
                      )}
                    </div>
                    <h5 style={styles.compareName}>{strat.strategyName}</h5>
                    <div style={{ ...styles.divider, margin: "6px 0" }} />
                    <div style={styles.compareValueRow}>
                      <span style={styles.compareLabel}>{hasSpouse ? "가구 " : ""}생애 총 수령액 (세후)</span>
                      <span style={styles.compareVal}>{strat.lifetimeTotalPostTax.toLocaleString()} 만원</span>
                    </div>
                    <div style={styles.compareValueRow}>
                      <span style={styles.compareLabel}>총 납부 세금 & 건보</span>
                      <span style={{ ...styles.compareVal, color: "var(--warning)" }}>
                        {strat.lifetimeTotalTaxAndHI.toLocaleString()} 만원
                      </span>
                    </div>
                    <div style={styles.compareValueRow}>
                      <span style={styles.compareLabel}>건보 피부양자 박탈</span>
                      <span style={styles.compareVal}>
                        {strat.lostDependencyAge ? `${strat.lostDependencyAge}세 이후` : "없음"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* S4 하이브리드: 피부양자 유지 상태 및 배당 운용 현황 */}
              {activeTab === "S4" && (
                <div className="animate-fade-in" style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* 피부양자 유지 상태 안내 */}
                  {(() => {
                    const s4Result = withdrawalSimulation.s4;
                    const perPersonDividend = store.simulationParams.isCoupleDivided
                      ? ((store.simulationParams.coveredCallAsset || 5000) * 10000 * (store.simulationParams.coveredCallDividendRate || 9) / 100) / 2
                      : (store.simulationParams.coveredCallAsset || 5000) * 10000 * (store.simulationParams.coveredCallDividendRate || 9) / 100;
                    const isWithinCap = perPersonDividend <= 10000000;
                    const policy = store.simulationParams.dividendPolicy || "REINVEST";
                    const policyLabel =
                      policy === "REINVEST" ? "🔄 잉여 배당 재투자 (스노우볼형)"
                      : policy === "BUFFER" ? "🛡️ 배당 비상자금 풀 (안전적립형)"
                      : "💸 전액 현금화 소비 (소진형)";

                    return (
                      <>
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: isWithinCap ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
                          border: `1px solid ${isWithinCap ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
                          fontSize: "0.8rem",
                          lineHeight: 1.6,
                        }}>
                          <strong style={{ color: isWithinCap ? "#10b981" : "#f43f5e" }}>
                            {isWithinCap ? "✅ 피부양자 유지 가능" : "⚠️ 피부양자 탈락 위험"}
                          </strong>
                          <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>
                            1인당 예상 연 배당소득: {Math.round(perPersonDividend / 10000).toLocaleString()}만원
                            {isWithinCap ? " (한도 1,000만원 이하)" : ` (한도 1,000만원 초과 → 건보료 부과)`}
                          </span>
                          {s4Result.lostDependencyAge && (
                            <span style={{ display: "block", marginTop: "4px", color: "var(--warning)" }}>
                              피부양자 탈락 예상 시점: {s4Result.lostDependencyAge}세 | 생애 건보료 총액: {s4Result.lifetimeTotalHI.toLocaleString()}만원
                            </span>
                          )}
                        </div>

                        {/* 배당금 운용 및 누적 자산 현황 카드 */}
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(99, 102, 241, 0.06)",
                          border: "1px solid rgba(99, 102, 241, 0.25)",
                          fontSize: "0.8rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}>
                          <div>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>적용된 배당 정책: </span>
                            <strong style={{ color: "var(--primary)" }}>{policyLabel}</strong>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.74rem", marginTop: "2px" }}>
                              {policy === "REINVEST" && "생활비 부족분만 인출하고 남는 배당금은 원금에 재투자하여 배당 원금을 복리 증식합니다."}
                              {policy === "BUFFER" && "생활비 부족분 충당 후 남는 배당금을 안전자산(연 2.5%)에 차곡차곡 쌓아 초고령기 비상자금으로 보관합니다."}
                              {policy === "PAYOUT" && "매년 발생하는 배당금을 전액 생활비로 소비(현금화)합니다."}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "16px" }}>
                            <div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>최종 커버드콜 원금</div>
                              <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                                {s4Result.finalCoveredCallAsset ? `${s4Result.finalCoveredCallAsset.toLocaleString()}만원` : `${(store.simulationParams.coveredCallAsset || 5000).toLocaleString()}만원`}
                              </div>
                            </div>
                            {policy === "BUFFER" && (
                              <div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>누적 비상자금 잔고</div>
                                <div style={{ fontWeight: 800, color: "var(--success)", fontSize: "0.95rem" }}>
                                  {s4Result.finalDividendBuffer ? `${s4Result.finalDividendBuffer.toLocaleString()}만원` : "0만원"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}


              {/* 그래프 ① 세금 & 건보료 비교 Bar Chart */}
              <div style={{ marginTop: "14px" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  전략별 생애 세금 & 건보료 vs 세후 수령액 비교
                </p>
                <div style={{ height: 200, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 6, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99, 102, 241, 0.1)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(99, 102, 241, 0.07)", stroke: "rgba(99, 102, 241, 0.35)", strokeWidth: 1 }}
                        content={<BarTooltip />}
                      />
                      <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                      <Bar dataKey="세후 수령액" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="세금 & 건보료" fill="#f43f5e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 그래프 ② 인출흐름 & 자산변화 Area+Line Chart */}
              <div style={{ marginTop: "14px" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {strategies.find(s => s.strategyId === activeTab)?.strategyName} — 연령별 인출흐름 & 자산변화
                </p>
                <div style={{ height: 250, width: "100%" }} onClick={() => setScenarioHighlight(null)}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={scenarioChartData} margin={{ top: 22, right: 10, left: 15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99, 102, 241, 0.1)" />
                      <XAxis dataKey="age" tickFormatter={(age) => `${age}세`} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} />
                      <YAxis tickFormatter={(val) => `${val}만`} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} />
                      <Tooltip content={<CustomTooltip notes={scenarioNotes} colors={scenarioColors} />} />
                      <Legend
                        wrapperStyle={{ fontSize: "0.72rem", marginTop: "10px" }}
                        iconSize={10}
                        itemSorter={null}
                        content={(props) => (
                          <DefaultLegendContent
                            {...props}
                            payload={props.payload?.map((item) => ({ ...item, color: scenarioColors[String(item.value)] ?? item.color }))}
                            onClick={(item, _i, e) => {
                              e.stopPropagation();
                              const k = String(item.dataKey);
                              setScenarioHighlight((h) => (h === k ? null : k));
                            }}
                          />
                        )}
                      />
                      {scenarioSeries.map((s) => (
                        <Area
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={s.key === "유족연금" ? survivorName : s.key}
                          stackId="1"
                          stroke={s.color}
                          fill={s.fill ?? s.color}
                          {...emphasisProps(activeHighlight, s.key, s.fill ? 0.55 : 0.5)}
                          isAnimationActive={false}
                        />
                      ))}
                      <Line
                        type="monotone"
                        dataKey="totalPostTax"
                        name="실질 세후 수령액"
                        stroke="#10b981"
                        strokeWidth={3}
                        strokeOpacity={activeHighlight && activeHighlight !== "totalPostTax" ? 0.2 : 1}
                        dot={false}
                        isAnimationActive={false}
                      />
                      {firstDeath && firstDeathAge !== undefined && (
                        <ReferenceLine
                          x={firstDeathAge}
                          stroke="var(--text-muted)"
                          strokeDasharray="6 4"
                          label={{ value: `${firstDeath.who === "SELF" ? "본인" : "배우자"} 기대수명`, position: "top", fill: "var(--text-muted)", fontSize: 11 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 2. 인출 최적화 처방 조언 + 탭 선택 */}
            <div style={styles.dashboardCard} className="premium-card">
              {/* 탭 버튼 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ ...styles.chartTitle, marginBottom: 0 }}>인출 최적화 처방 조언</h3>
                <div style={{ ...styles.tabBar, borderBottom: "none", paddingBottom: 0, flexShrink: 0 }} className="no-print">
                  {strategies.map((s) => (
                    <button
                      key={s.strategyId}
                      onClick={() => setActiveTab(s.strategyId as ScenarioTab)}
                      style={{
                        ...styles.tabButton,
                        backgroundColor: activeTab === s.strategyId ? "var(--primary)" : "transparent",
                        color: activeTab === s.strategyId ? "#fff" : "var(--text-secondary)",
                        border: activeTab === s.strategyId ? "1px solid var(--primary)" : "1px solid var(--border)"
                      }}
                    >
                      {s.strategyName}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "10px" }}>
                {activeTab === "S0" && "통합 시뮬레이션 기준(S0)은 왼쪽 입력 옵션의 인출 방식(평탄화·체감·수령 종료 나이)대로 퇴직·개인연금을 받을 때의 세금·건보료를 계산합니다. 세법상 사적연금 수령 한도(연 1,500만원)를 넘는 해에는 16.5% 분리과세나 종합과세가 적용될 수 있어, 절세형(S1)과 비교해 보세요."}
                {activeTab === "S1" && "절세 평탄화 전략은 사적연금 수령 한도(1,500만 원) 내로 수령액을 균등 분산하여 3.3%~5.5% 수준의 저율과세 혜택을 100% 누리며, 퇴직연금 수령 기간을 11년 이상 확보하여 퇴직소득세를 최대 40% 감면받을 수 있도록 최적화했습니다."}
                {activeTab === "S3" && "커스텀 전략 조정을 통해 본인만의 최적의 절세 구간을 찾을 수 있습니다. 가능한 사적연금 인출액을 고르게 평탄화하고 수령 기간을 10년 이상 길게 설계하는 것이 절세의 핵심입니다."}
                {activeTab === "S4" && "하이브리드 전략은 커버드콜 ETF 등 월 분배형 상품의 배당소득을 인당 연 1,000만원 이하로 통제하여 건보료 피부양자 자격을 방어하고, 부족한 생활비는 건보료가 비과세인 사적연금(연 1,500만원 한도)/퇴직연금에서 우선 인출하여 세금과 건강보험료를 동시에 최소화합니다."}
              </p>
            </div>

            {/* 3. Detailed Year-by-Year Table */}
            <div style={styles.dashboardCard} className="premium-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h3 style={styles.chartTitle}>연도별 상세 현금흐름 및 세후 시뮬레이션 표</h3>
                  {/* S31-4: 보기 옵션 필터 세그먼트 */}
                  <div style={styles.toggleGroup} data-html2canvas-ignore>
                    <button
                      type="button"
                      onClick={() => setFlowFilter("ALL")}
                      style={flowFilter === "ALL" ? styles.toggleBtnActive : styles.toggleBtn}
                    >
                      전체 (1년 단위)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowFilter("5YEARS")}
                      style={flowFilter === "5YEARS" ? styles.toggleBtnActive : styles.toggleBtn}
                    >
                      5년 간격 요약
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowFilter("EVENTS")}
                      style={flowFilter === "EVENTS" ? styles.toggleBtnActive : styles.toggleBtn}
                    >
                      주요 마일스톤
                    </button>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    ({filteredFlows.length}개 연도)
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }} data-html2canvas-ignore>
                  <button
                    type="button"
                    onClick={handleExportFlowsCsv}
                    className="premium-button-secondary"
                    style={{ fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700, whiteSpace: "nowrap" }}
                    title="선택된 인출전략의 연도별 세전/세후 현금흐름을 엑셀(CSV) 파일로 저장합니다"
                  >
                    📥 엑셀(CSV) 다운로드
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTableOpen((v) => !v)}
                    className="premium-button-secondary"
                    style={{ fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700, whiteSpace: "nowrap" }}
                  >
                    {detailTableOpen ? "▲ 접기" : "▼ 펼치기"}
                  </button>
                </div>
              </div>
              <p style={styles.chartSubtitle}>
                {activeResult.strategyName} 기준 · 원 단위 계산식을 만 원 단위로 절사한 상세 연도별 테이블
              </p>

              {detailTableOpen && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHeader}>
                      <th style={styles.th}>{hasSpouse ? "본인 나이" : "나이"}</th>
                      {hasSpouse && <th style={styles.th}>배우자 나이</th>}
                      <th style={styles.th}>연도</th>
                      <th style={styles.th}>세전 합계</th>
                      <th style={styles.th}>국민연금</th>
                      <th style={styles.th}>퇴직연금</th>
                      <th style={styles.th}>개인연금</th>
                      <th style={styles.th}>연금보험</th>
                      <th style={styles.th}>퇴직소득세</th>
                      <th style={styles.th}>사적연금세</th>
                      <th style={styles.th}>건보료</th>
                      <th style={{ ...styles.th, color: "var(--success)" }}>세후 수령액</th>
                      <th style={styles.th}>기말 자산</th>
                      <th style={{ ...styles.th, color: "var(--danger)" }}>목표대비 부족액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlows.map((flow) => (
                      <tr key={flow.age} style={styles.tr}>
                        <td style={styles.td}>{flow.age}세</td>
                        {hasSpouse && <td style={styles.td}>{flow.spouseAge ? `${flow.spouseAge}세` : "-"}</td>}
                        <td style={styles.td}>{flow.year}년</td>
                        <td style={{ ...styles.td, fontWeight: 700 }}>{flow.totalPreTax.toLocaleString()}</td>
                        <td style={styles.td}>{flow.nationalPreTax.toLocaleString()}</td>
                        <td style={styles.td}>{flow.retirementPreTax.toLocaleString()}</td>
                        <td style={styles.td}>{flow.personalPreTax.toLocaleString()}</td>
                        <td style={styles.td}>{flow.insurancePreTax.toLocaleString()}</td>
                        <td style={{ ...styles.td, color: "var(--warning)" }}>{flow.taxOnRetirement.toLocaleString()}</td>
                        <td style={{ ...styles.td, color: "var(--warning)" }}>{flow.taxOnPersonal.toLocaleString()}</td>
                        <td style={{ ...styles.td, color: "var(--warning)" }}>{flow.healthInsurance.toLocaleString()}</td>
                        <td style={{ ...styles.td, fontWeight: 800, color: "var(--success)" }}>
                          {flow.totalPostTax.toLocaleString()}
                        </td>
                        <td style={styles.td}>{flow.endingBalance.toLocaleString()}</td>
                        <td style={{ ...styles.td, color: flow.deficit > 0 ? "var(--danger)" : "var(--text-secondary)" }}>
                          {flow.deficit > 0 ? `${flow.deficit.toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* 합계 행 (Total row) */}
                    <tr style={{
                      fontWeight: 700,
                      backgroundColor: "rgba(99, 102, 241, 0.05)",
                      borderTop: "2px solid var(--border)",
                      borderBottom: "2px solid var(--border)",
                    }}>
                      <td style={{ padding: "7px 8px", color: "var(--text-primary)", textAlign: "right", fontWeight: 800 }}>합계</td>
                      {hasSpouse && <td style={{ padding: "7px 8px", color: "var(--text-secondary)", textAlign: "right" }}>-</td>}
                      <td style={{ padding: "7px 8px", color: "var(--text-secondary)", textAlign: "right" }}>-</td>
                      <td style={{ padding: "7px 8px", color: "var(--text-primary)", textAlign: "right", fontWeight: 800 }}>{totalFlows.totalPreTax.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.nationalPreTax.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.retirementPreTax.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.personalPreTax.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.insurancePreTax.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--warning)", textAlign: "right" }}>{totalFlows.taxOnRetirement.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--warning)", textAlign: "right" }}>{totalFlows.taxOnPersonal.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--warning)", textAlign: "right" }}>{totalFlows.healthInsurance.toLocaleString()}</td>
                      <td style={{ padding: "7px 8px", color: "var(--success)", textAlign: "right", fontWeight: 800 }}>
                        {totalFlows.totalPostTax.toLocaleString()}
                      </td>
                      <td style={{ padding: "7px 8px", color: "var(--text-secondary)", textAlign: "right" }}>-</td>
                      <td style={{ padding: "7px 8px", color: totalFlows.deficit > 0 ? "var(--danger)" : "var(--text-secondary)", textAlign: "right" }}>
                        {totalFlows.deficit > 0 ? totalFlows.deficit.toLocaleString() : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {/* 4. Compliance Footnotes */}
            <div style={styles.footnoteSection}>
              <p style={styles.footnoteText}>
                ⚠️ **[필수 법적 고지사항 및 안내]**
              </p>
              <p style={styles.footnoteText}>
                - 본 인출전략 시뮬레이션 결과는 사용자가 입력한 자산과 연도별 추정 기대수익률, 물가상승률 등의 변수를 기초로 세법 및 건강보험법 기준을 적용하여 산출한 **예시 계산**입니다. 실제 금융기관 수령액 및 관할 세무서 최종 결정 세액과는 다를 수 있습니다.
              </p>
              <p style={styles.footnoteText}>
                - 사적연금 연간 1,500만 원 분리과세 기준, 이연퇴직소득세 수령연차별 감면율(1~10년차 30%, 11~20년차 40%) 및 국민연금 개혁 세율안은 국세청 및 보건복지부의 법령을 참고하여 제작하였으며, 향후 법 개정에 따라 세율 구조가 변동될 수 있습니다.
              </p>
              <p style={styles.footnoteText}>
                - 본 리포트는 투자 자문 및 세무 자문이 아니며, 인출 계획 실행 전 반드시 세무사나 재무 설계 전문가의 대면 컨설팅을 받으시길 권장합니다.
              </p>
              <p style={styles.footnoteText}>
                - 건보료 산정 시 재산세 과세표준 기반 재산 건보료(연 1.2% 근사) 및 금융소득 1,000만원 초과분(7.09%)이 추가 반영됩니다. 기준 수치는 왼쪽 입력 열의 「세금·건보료」에서 수정할 수 있습니다.
              </p>
            </div>

          </div>

        </section>
          </div>
        </div>
      </div>
      <PersonaPresetModal
        isOpen={personaModalOpen}
        onClose={() => setPersonaModalOpen(false)}
      />
      <NpsEarlyDeferralModal
        isOpen={bepModalOpen}
        onClose={() => setBepModalOpen(false)}
      />
      <PrivatePensionTaxModal
        isOpen={tax15ModalOpen}
        onClose={() => setTax15ModalOpen(false)}
      />
      <HealthInsuranceBillModal
        isOpen={healthBillModalOpen}
        onClose={() => setHealthBillModalOpen(false)}
      />
      <ReverseMortgageModal
        isOpen={reverseMortgageModalOpen}
        onClose={() => setReverseMortgageModalOpen(false)}
      />
      <IncomeBridgeModal
        isOpen={incomeBridgeModalOpen}
        onClose={() => setIncomeBridgeModalOpen(false)}
      />
      <SurvivorCareModal
        isOpen={survivorCareModalOpen}
        onClose={() => setSurvivorCareModalOpen(false)}
      />
      <IsaPensionTransferModal
        isOpen={isaTransferModalOpen}
        onClose={() => setIsaTransferModalOpen(false)}
      />
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "var(--background)",
    position: "relative",
    overflow: "hidden",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--background)",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid var(--border)",
    borderTop: "5px solid var(--primary)",
    borderRadius: "50%",
    animation: "pulse-subtle 1.5s infinite linear",
  },
  bgGlow1: {
    position: "fixed",
    top: "-20%",
    left: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    bottom: "-20%",
    right: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    width: "100%",
    padding: "10px 40px",
    zIndex: 10,
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--glass-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    textDecoration: "none",
  },
  navLinks: {
    display: "flex",
    gap: "32px",
  },
  navItem: {
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color var(--transition-fast)",
  },
  contentBody: {
    width: "100%",
    maxWidth: "1680px",
    margin: "0 auto",
    padding: "16px 20px 40px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    zIndex: 1,
  },
  results: { display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 },
  topSecurityBanner: {
    backgroundColor: "rgba(99, 102, 241, 0.06)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.5)",
    borderRadius: "var(--radius-sm)",
    padding: "7px 14px",
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  },
  chartTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  chartSubtitle: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginBottom: "8px",
  },
  resultContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "100%",
  },
  pdfRootContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  dashboardCard: {
    padding: "18px 20px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  dashboardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  dashboardTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    marginTop: "4px",
  },
  divider: {
    height: "1px",
    backgroundColor: "var(--border)",
    width: "100%",
  },
  bestStrategyCard: {
    display: "flex",
    gap: "12px",
    padding: "10px 14px",
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    border: "1px solid rgba(16, 185, 129, 0.15)",
    borderRadius: "var(--radius-md)",
  },
  comparisonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
  },
  stratCompareCard: {
    padding: "10px 12px",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  compareId: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
  },
  compareName: {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "var(--text-primary)",
  },
  compareValueRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
  },
  compareLabel: {
    color: "var(--text-muted)",
  },
  compareVal: {
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  recommendBadge: {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#fff",
    backgroundColor: "var(--success)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  tabBar: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "8px",
  },
  tabButton: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  sliderGroupContainer: {
    borderBottom: "1px dashed var(--border)",
    paddingBottom: "10px",
  },
  sliderGroupTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--text-accent)",
  },
  reformImpactBox: {
    backgroundColor: "rgba(99, 102, 241, 0.03)",
    border: "1px dashed rgba(99, 102, 241, 0.2)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginTop: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
    textAlign: "right",
  },
  trHeader: {
    borderBottom: "2px solid var(--border)",
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  th: {
    padding: "7px 8px",
    fontWeight: 700,
    color: "var(--text-primary)",
    textAlign: "right" as const,
  },
  tr: {
    borderBottom: "1px solid var(--border)",
    backgroundColor: "transparent",
    transition: "background-color 0.15s ease",
  },
  td: {
    padding: "7px 8px",
    color: "var(--text-secondary)",
    textAlign: "right" as const,
    fontVariantNumeric: "tabular-nums" as const,
    fontFeatureSettings: '"tnum"',
    fontFamily: "'Roboto Mono', 'SF Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
    fontSize: "0.82rem",
  },
  footnoteSection: {
    padding: "12px 16px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    marginTop: "4px",
  },
  footnoteText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    lineHeight: "1.6",
    marginBottom: "8px",
  },
  toggleGroup: {
    display: "inline-flex",
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "2px",
    gap: "2px",
  },
  toggleBtn: {
    padding: "4px 10px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  toggleBtnActive: {
    padding: "4px 10px",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "var(--primary, #6366f1)",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
};
