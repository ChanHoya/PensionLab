"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { runPensionSimulation } from "@/services/pensionCalculator";
import { runWithdrawalSimulation, StrategySimulationResult } from "@/services/withdrawalCalculator";
import ThemeToggle from "@/components/ThemeToggle";

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
  ComposedChart
} from "recharts";

// Custom Tooltip component for Recharts ComposedChart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const activePayload = payload.filter((entry: any) => (entry.value || 0) > 0);
    if (activePayload.length === 0) return null;

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
        }}>{label}세</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {activePayload.map((entry: any, index: number) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: entry.color }} />
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
  const [activeTab, setActiveTab] = useState<"S0" | "S1" | "S2" | "S3">("S1");

  // S3 Custom sliders state
  const [s3StartAges, setS3StartAges] = useState<{ [id: string]: number }>({});
  const [s3Periods, setS3Periods] = useState<{ [id: string]: number }>({});

  // Needs user input wizard state
  const [showWizard, setShowWizard] = useState(true);
  const [wizardStep, setWizardStep] = useState(1);

  // PDF download loading state
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const handleExportData = () => {
    const data = {
      nationalPension: store.nationalPension,
      basicPension: store.basicPension,
      retirementPensions: store.retirementPensions,
      personalPensions: store.personalPensions,
      pensionInsurances: store.pensionInsurances,
      simulationParams: store.simulationParams,
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

      setS3StartAges(defaultStartAges);
      setS3Periods(defaultPeriods);
    }
  }, [isMounted, store.retirementPensions, store.personalPensions, store.pensionInsurances, store.simulationParams.retirementAge]);

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>연금 분석 엔진을 구동하는 중...</p>
      </div>
    );
  }

  // Run the basic pension simulation based on store states
  const simulation = runPensionSimulation(
    store.nationalPension,
    store.basicPension,
    store.retirementPensions,
    store.personalPensions,
    store.pensionInsurances,
    store.simulationParams
  );

  const {
    currentAge,
    yearsToRetire,
    totalAccumulatedAtRetirement,
    monthlyAnnuityAtRetirement,
    nationalPensionPremiumIncreaseTotal,
  } = simulation;

  // Run advanced withdrawal simulation
  const withdrawalSimulation = runWithdrawalSimulation(
    store.nationalPension,
    store.basicPension,
    store.retirementPensions,
    store.personalPensions,
    store.pensionInsurances,
    store.simulationParams,
    {
      personalTaxCreditRatio,
      retirementLumpSumTaxRate,
      otherIncomeAnnual,
      publicPensionTaxableRatio,
      s3CustomStartAges: s3StartAges,
      s3CustomPeriods: s3Periods,
    }
  );

  const activeResult: StrategySimulationResult = withdrawalSimulation[activeTab.toLowerCase() as "s0" | "s1" | "s2" | "s3"];

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

  // Bar Chart Data: S0, S1, S2, S3 Comparison
  const barChartData = [
    {
      name: "As-Is (S0)",
      "세후 수령액": withdrawalSimulation.s0.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s0.lifetimeTotalTaxAndHI,
    },
    {
      name: "절세형 (S1)",
      "세후 수령액": withdrawalSimulation.s1.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s1.lifetimeTotalTaxAndHI,
    },
    {
      name: "연기형 (S2)",
      "세후 수령액": withdrawalSimulation.s2.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s2.lifetimeTotalTaxAndHI,
    },
    {
      name: "커스텀 (S3)",
      "세후 수령액": withdrawalSimulation.s3.lifetimeTotalPostTax,
      "세금 & 건보료": withdrawalSimulation.s3.lifetimeTotalTaxAndHI,
    }
  ];

  const strategies = [withdrawalSimulation.s0, withdrawalSimulation.s1, withdrawalSimulation.s2, withdrawalSimulation.s3];
  const bestStrategy = [...strategies].sort((a, b) => b.lifetimeTotalPostTax - a.lifetimeTotalPostTax)[0];

  // PDF Report Capture
  const handleDownloadPDF = async () => {
    setPdfDownloading(true);
    try {
      const loadLib = () => {
        return new Promise<any>((resolve, reject) => {
          if ((window as any).html2canvas && (window as any).jsPDF) {
            resolve({
              html2canvas: (window as any).html2canvas,
              jsPDF: (window as any).jsPDF,
            });
            return;
          }
          const s1 = document.createElement("script");
          s1.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s1.onload = () => {
            const s2 = document.createElement("script");
            s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            s2.onload = () => {
              resolve({
                html2canvas: (window as any).html2canvas,
                jsPDF: (window as any).jspdf.jsPDF,
              });
            };
            s2.onerror = reject;
            document.body.appendChild(s2);
          };
          s1.onerror = reject;
          document.body.appendChild(s1);
        });
      };

      const { html2canvas, jsPDF } = await loadLib();
      const element = document.getElementById("withdrawal-report-root");
      if (!element) throw new Error("캡처할 영역을 찾을 수 없습니다.");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0e1c",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF("p", "mm", "a4");
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`연금_인출전략_정밀분석_보고서_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setPdfDownloading(false);
    }
  };

  // Helper checking if user has any custom accounts registered
  function accountsListIsEmpty() {
    return (
      store.retirementPensions.length === 0 &&
      store.personalPensions.length === 0 &&
      store.pensionInsurances.length === 0
    );
  }

  // Render a slider group for S3 custom strategy
  function renderCustomSliders(id: string, name: string) {
    const startAge = s3StartAges[id] || 60;
    const period = s3Periods[id] || 10;

    return (
      <div key={id} style={styles.sliderGroupContainer}>
        <span style={styles.sliderGroupTitle}>{name}</span>
        
        <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
          {/* Start Age Slider */}
          <div style={{ flex: 1 }}>
            <div style={styles.sliderLabelRow}>
              <label style={styles.sliderLabel}>인출 개시 연령</label>
              <span style={styles.sliderValue}>{startAge}세</span>
            </div>
            <input
              type="range"
              min="55"
              max="80"
              value={startAge}
              onChange={(e) => {
                setS3StartAges({
                  ...s3StartAges,
                  [id]: Number(e.target.value)
                });
              }}
              style={styles.sliderRange}
            />
          </div>

          {/* Period Slider */}
          <div style={{ flex: 1 }}>
            <div style={styles.sliderLabelRow}>
              <label style={styles.sliderLabel}>수령 기간</label>
              <span style={styles.sliderValue}>{period}년</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={period}
              onChange={(e) => {
                setS3Periods({
                  ...s3Periods,
                  [id]: Number(e.target.value)
                });
              }}
              style={styles.sliderRange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={styles.container}>
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
            <ThemeToggle />
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
          </div>
        </div>
      </header>

      <div style={styles.contentBody}>
        {/* Local Security & Caching Banner */}
        <div style={styles.topSecurityBanner} className="premium-card animate-fade-in">
          <span>🔒 <strong>개인정보 안심 보장</strong>: 회원님의 소중한 은퇴 설계 정보는 서버에 전송/저장되지 않으며, 오직 웹 브라우저(LocalStorage)에만 안전하게 보관되므로 유출 걱정 없이 안심하고 이용해 주세요.</span>
        </div>

        {/* Row 1: KPI Summary (5-column Grid) */}
        <section style={styles.kpiRow} className="animate-fade-in">
          {/* Card 1 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #6366f1" }} className="premium-card">
            <span style={styles.kpiLabel}>은퇴 후 예상 월 연금액</span>
            <h3 style={styles.kpiValue}>
              <span className="gradient-text">{monthlyAnnuityAtRetirement.toLocaleString()}</span> 만원/월
            </h3>
            <p style={styles.kpiSub}>은퇴 나이 {store.simulationParams.retirementAge}세 수령 기준</p>
          </div>

          {/* Card 2 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #8b5cf6" }} className="premium-card">
            <span style={styles.kpiLabel}>은퇴 시 자산 규모</span>
            <h3 style={styles.kpiValue}>
              {totalAccumulatedAtRetirement >= 10000 
                ? `${(totalAccumulatedAtRetirement / 10000).toFixed(2)} 억원`
                : `${totalAccumulatedAtRetirement.toLocaleString()} 만원`
              }
            </h3>
            <p style={styles.kpiSub}>퇴직+개인연금+연금보험 적립금 합산</p>
          </div>

          {/* Card 3 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #ef4444" }} className="premium-card">
            <span style={styles.kpiLabel}>2026 국민연금 개혁 영향</span>
            <h3 style={{ ...styles.kpiValue, color: "var(--danger)" }}>
              + {nationalPensionPremiumIncreaseTotal.toLocaleString()} 만원
            </h3>
            <p style={styles.kpiSub}>개혁안 인상(9%➔13%) 추가 보험료</p>
          </div>

          {/* Card 4 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #f97316" }} className="premium-card">
            <span style={styles.kpiLabel}>시뮬레이션 프로필</span>
            <h3 style={styles.kpiValue}>
              {currentAge} 세
            </h3>
            <p style={styles.kpiSub}>은퇴까지 남은 기간: <strong>{yearsToRetire}년</strong></p>
          </div>

          {/* Card 5: 로컬 데이터 관리 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #10b981", display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px" }} className="premium-card">
            <span style={styles.kpiLabel}>로컬 데이터 관리</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
              <button
                id="btn-export-data"
                onClick={handleExportData}
                className="premium-button"
                style={{ fontSize: "0.7rem", padding: "4px 8px", width: "100%", textAlign: "center", fontWeight: 700 }}
              >
                📤 백업 (JSON 다운)
              </button>
              <button
                id="btn-import-data"
                onClick={() => document.getElementById("input-file-import")?.click()}
                className="premium-button-secondary"
                style={{ fontSize: "0.7rem", padding: "4px 8px", width: "100%", textAlign: "center", fontWeight: 700 }}
              >
                📥 복원 (JSON 업)
              </button>
              <input
                type="file"
                id="input-file-import"
                accept=".json"
                onChange={handleImportData}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </section>

        {/* Row 2: Parameter Sliders (3-column layout) */}
        <section style={styles.slidersCard} className="premium-card">
          <h3 style={styles.chartTitle}>실시간 시뮬레이션 매개변수 조정</h3>
          <p style={styles.chartSubtitle}>조건을 조정하여 연금 그래프의 변화를 실시간으로 확인해 보세요.</p>
          
          <div style={styles.slidersGrid}>
            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>현재 나이</label>
                <span style={styles.sliderValue}>{store.simulationParams.currentAge} 세</span>
              </div>
              <input
                type="range"
                min="20"
                max="70"
                value={store.simulationParams.currentAge}
                onChange={(e) => store.setSimulationParams({ currentAge: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>은퇴 나이</label>
                <span style={styles.sliderValue}>{store.simulationParams.retirementAge} 세</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                value={store.simulationParams.retirementAge}
                onChange={(e) => store.setSimulationParams({ retirementAge: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>국민연금 개시 연령</label>
                <span style={styles.sliderValue}>{store.simulationParams.nationalPensionStartAge} 세</span>
              </div>
              <input
                type="range"
                min="60"
                max="70"
                value={store.simulationParams.nationalPensionStartAge}
                onChange={(e) => store.setSimulationParams({ nationalPensionStartAge: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>예상 기대 수명</label>
                <span style={styles.sliderValue}>{store.simulationParams.expectedLifeExpectancy} 세</span>
              </div>
              <input
                type="range"
                min="75"
                max="100"
                value={store.simulationParams.expectedLifeExpectancy}
                onChange={(e) => store.setSimulationParams({ expectedLifeExpectancy: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>물가상승률</label>
                <span style={styles.sliderValue}>{store.simulationParams.inflationRate} %</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={store.simulationParams.inflationRate}
                onChange={(e) => store.setSimulationParams({ inflationRate: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>은퇴 연금 인출 전략</label>
                <span style={styles.sliderValue}>
                  {store.simulationParams.decumulationStrategy === "DECREASING"
                    ? "활동기 집중형 (체감식)"
                    : "동일 금액형 (정액식)"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px", height: "36px" }}>
                <button
                  type="button"
                  onClick={() => store.setSimulationParams({ decumulationStrategy: "DECREASING" })}
                  style={{
                    flex: 1,
                    padding: "0 12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    border: store.simulationParams.decumulationStrategy === "DECREASING"
                      ? "1px solid #6366f1"
                      : "1px solid var(--border)",
                    backgroundColor: store.simulationParams.decumulationStrategy === "DECREASING"
                      ? "rgba(99, 102, 241, 0.15)"
                      : "transparent",
                    color: store.simulationParams.decumulationStrategy === "DECREASING"
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  🔥 활동기 집중형 (추천)
                </button>
                <button
                  type="button"
                  onClick={() => store.setSimulationParams({ decumulationStrategy: "FLAT" })}
                  style={{
                    flex: 1,
                    padding: "0 12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    border: store.simulationParams.decumulationStrategy === "FLAT"
                      ? "1px solid #6366f1"
                      : "1px solid var(--border)",
                    backgroundColor: store.simulationParams.decumulationStrategy === "FLAT"
                      ? "rgba(99, 102, 241, 0.15)"
                      : "transparent",
                    color: store.simulationParams.decumulationStrategy === "FLAT"
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  ⚖️ 동일 금액형 (정액)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Row 3: Needs User Input Wizard */}
        {showWizard && (
          <section className="premium-card animate-fade-in" style={styles.wizardCard}>
            <div style={styles.wizardHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔍</span>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>세부 재원 분류 진단 위저드 (사용자 확인 필요)</span>
              </div>
              <button onClick={() => setShowWizard(false)} style={styles.closeWizardBtn}>✕ 닫기</button>
            </div>
            
            <div style={styles.wizardBody}>
              {wizardStep === 1 && (
                <div>
                  <p style={styles.wizardQuestion}>1. 개인연금저축/IRP 계좌 적립금 중 <strong>세액공제를 받으신 납입원금의 비중</strong>은 대략 어떻게 되나요?</p>
                  <p style={styles.wizardHelp}>※ 공제받지 않은 납입원금은 나중에 비과세 인출이 가능합니다. (보통 80% 내외)</p>
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    {[0.5, 0.8, 1.0].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => {
                          setPersonalTaxCreditRatio(ratio);
                          setWizardStep(2);
                        }}
                        className={personalTaxCreditRatio === ratio ? "premium-button" : "premium-button-secondary"}
                        style={{ flex: 1, padding: "10px" }}
                      >
                        {ratio * 100}% 정도
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "80px" }}>수동 조정:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={personalTaxCreditRatio}
                      onChange={(e) => setPersonalTaxCreditRatio(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{Math.round(personalTaxCreditRatio * 100)}%</span>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <p style={styles.wizardQuestion}>2. 퇴직 시 예상되는 평균 <strong>퇴직소득세율</strong>은 대략 몇 %인가요?</p>
                  <p style={styles.wizardHelp}>※ 은퇴 시점 일시금 기준 퇴직소득세율입니다. 잘 모르시면 기본값(8%)을 적용합니다.</p>
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    {[0.05, 0.08, 0.12].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setRetirementLumpSumTaxRate(rate);
                          setWizardStep(3);
                        }}
                        className={retirementLumpSumTaxRate === rate ? "premium-button" : "premium-button-secondary"}
                        style={{ flex: 1, padding: "10px" }}
                      >
                        {rate * 100}%
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "80px" }}>수동 조정:</span>
                    <input
                      type="range"
                      min="0.01"
                      max="0.25"
                      step="0.01"
                      value={retirementLumpSumTaxRate}
                      onChange={(e) => setRetirementLumpSumTaxRate(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{Math.round(retirementLumpSumTaxRate * 100)}%</span>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  <p style={styles.wizardQuestion}>3. 은퇴 후 연금 외에 <strong>기타 근로/임대/배당 소득(종합소득)</strong>이 예상되시나요?</p>
                  <p style={styles.wizardHelp}>※ 사적연금 1,500만 원 초과 시 종합과세 비교 계산에 활용됩니다.</p>
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    {[0, 1200, 3000].map((inc) => (
                      <button
                        key={inc}
                        onClick={() => {
                          setOtherIncomeAnnual(inc);
                          setShowWizard(false);
                          setWizardStep(1); // reset
                        }}
                        className={otherIncomeAnnual === inc ? "premium-button" : "premium-button-secondary"}
                        style={{ flex: 1, padding: "10px" }}
                      >
                        {inc === 0 ? "없음" : `연 ${inc.toLocaleString()}만원`}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "80px" }}>수동 조정:</span>
                    <input
                      type="number"
                      value={otherIncomeAnnual || ""}
                      placeholder="0"
                      onChange={(e) => setOtherIncomeAnnual(Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        color: "var(--text-primary)",
                        outline: "none"
                      }}
                    />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>만원/년</span>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.wizardFooter}>
              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: step === wizardStep ? "var(--primary)" : "var(--border)",
                    }}
                  />
                ))}
              </div>
              {wizardStep > 1 && (
                <button onClick={() => setWizardStep(wizardStep - 1)} style={styles.prevBtn}>이전 단계로</button>
              )}
            </div>
          </section>
        )}

        {/* Visual Settings Controls (Quick access) */}
        {!showWizard && (
          <section className="premium-card animate-fade-in" style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={styles.quickLabel}>세액공제 비율</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={personalTaxCreditRatio}
                  onChange={(e) => setPersonalTaxCreditRatio(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={styles.quickVal}>{Math.round(personalTaxCreditRatio * 100)}%</span>
              </div>
            </div>

            <div style={{ flex: "1 1 200px" }}>
              <label style={styles.quickLabel}>퇴직소득세율</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                <input
                  type="range"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  value={retirementLumpSumTaxRate}
                  onChange={(e) => setRetirementLumpSumTaxRate(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={styles.quickVal}>{Math.round(retirementLumpSumTaxRate * 100)}%</span>
              </div>
            </div>

            <div style={{ flex: "1 1 200px" }}>
              <label style={styles.quickLabel}>기타 연 소득</label>
              <input
                type="number"
                value={otherIncomeAnnual || ""}
                onChange={(e) => setOtherIncomeAnnual(Number(e.target.value))}
                style={styles.quickInput}
                placeholder="0"
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "4px" }}>만원/년</span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={() => setShowWizard(true)} className="premium-button-secondary" style={{ padding: "8px 16px" }}>
                ⚙️ 세부 위저드 열기
              </button>
            </div>
          </section>
        )}

        {/* Withdrawal Simulation & Results */}
        <section style={styles.resultContainer} className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "flex-end" }} className="no-print">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfDownloading}
              className="premium-button"
              style={{
                background: "var(--gradient-primary)",
                padding: "12px 24px",
                boxShadow: "var(--shadow-brand)",
                fontWeight: 700,
              }}
            >
              {pdfDownloading ? "🔄 PDF 리포트 생성 중..." : "📥 인출전략 정밀분석 보고서 PDF 다운로드"}
            </button>
          </div>

          <div id="withdrawal-report-root" style={styles.pdfRootContainer}>
            {/* 1. Comparison Summary */}
            <div style={styles.dashboardCard} className="premium-card">
              <div style={styles.dashboardHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={styles.reportSub}>RETIREMENT DECUMULATION REPORT</span>
                  <div style={styles.logoText}>Pension<span className="gradient-text">Lab</span></div>
                </div>
                <h3 style={styles.dashboardTitle}>인출전략 시나리오 비교</h3>
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
                    {bestStrategy.strategyId === "S2" && " 국민연금 5년 연기를 통해 수령액이 연 7.2% 복리 증액(총 +36%)되어 장수 리스크 방어력이 배가됩니다."}
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
                    onClick={() => setActiveTab(strat.strategyId)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={styles.compareId}>{strat.strategyId} 전략</span>
                      {strat.strategyId === bestStrategy.strategyId && (
                        <span style={styles.recommendBadge}>Best</span>
                      )}
                    </div>
                    <h5 style={styles.compareName}>{strat.strategyName}</h5>
                    <div style={{ ...styles.divider, margin: "10px 0" }} />
                    <div style={styles.compareValueRow}>
                      <span style={styles.compareLabel}>생애 총 수령액 (세후)</span>
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

              {/* Recharts Bar Comparison Chart */}
              <div style={{ height: 260, width: "100%", marginTop: "12px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99, 102, 241, 0.1)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Bar dataKey="세후 수령액" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="세금 & 건보료" fill="#f43f5e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Strategy Tabs & Detailed Chart */}
            <div style={styles.dashboardCard} className="premium-card">
              <h3 style={styles.chartTitle}>인출전략 시뮬레이션 및 자산 소모 흐름</h3>
              <p style={styles.chartSubtitle}>선택한 전략의 연령별 3층 구조 인출 흐름 및 세후 가치 변화</p>

              {/* Custom Tab Bar */}
              <div style={styles.tabBar} className="no-print">
                {strategies.map((s) => (
                  <button
                    key={s.strategyId}
                    onClick={() => setActiveTab(s.strategyId)}
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

              {/* S3 Custom Interactive Sliders */}
              {activeTab === "S3" && (
                <div style={styles.customParamsBox} className="premium-card animate-fade-in no-print">
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)" }}>
                    🛠️ S3 커스텀 전략 인출 변수 조절
                  </h4>
                  
                  {accountsListIsEmpty() ? (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>
                      등록된 2/3층 사적연금 자산이 없습니다. 대시보드나 온보딩에서 연금을 추가해 주세요.
                    </p>
                  ) : (
                    <div style={styles.customSlidersGrid}>
                      {store.retirementPensions.map((p) => renderCustomSliders(p.id, `${p.pensionType} 퇴직연금`))}
                      {store.personalPensions.map((p) => renderCustomSliders(p.id, `개인연금저축 (${p.savingsType})`))}
                      {store.pensionInsurances.map((i) => renderCustomSliders(i.id, `연금보험 (${i.insuranceType})`))}
                    </div>
                  )}
                </div>
              )}

              {/* Recharts Area + Line Chart */}
              <div style={{ height: 320, width: "100%", marginTop: "16px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={activeResult.flows} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99, 102, 241, 0.1)" />
                    <XAxis dataKey="age" tickFormatter={(age) => `${age}세`} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} />
                    <YAxis tickFormatter={(val) => `${val}만`} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "0.75rem", marginTop: "10px" }} />
                    <Area type="monotone" dataKey="nationalPreTax" name="국민연금" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} isAnimationActive={false} />
                    <Area type="monotone" dataKey="basicPreTax" name="기초연금" stackId="1" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.4} isAnimationActive={false} />
                    <Area type="monotone" dataKey="retirementPreTax" name="퇴직연금" stackId="1" stroke="#facc15" fill="#facc15" fillOpacity={0.4} isAnimationActive={false} />
                    <Area type="monotone" dataKey="personalPreTax" name="개인연금" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.4} isAnimationActive={false} />
                    <Area type="monotone" dataKey="insurancePreTax" name="연금보험" stackId="1" stroke="#f87171" fill="#f87171" fillOpacity={0.4} isAnimationActive={false} />
                    <Line type="monotone" dataKey="totalPostTax" name="실질 세후 수령액" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Strategy advice box */}
              <div style={{ ...styles.reformImpactBox, marginTop: "20px" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>인출 최적화 처방 조언</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "6px" }}>
                  {activeTab === "S0" && "As-Is 전략은 세법상 사적연금 1,500만 원 한도 및 퇴직소득세 한도를 고려하지 않고 임의 수령하는 계획입니다. 특정 연도에 수령액이 과밀되어 16.5% 분리과세나 높은 종합소득세 누진세율이 적용될 수 있습니다."}
                  {activeTab === "S1" && "절세 평탄화 전략은 사적연금 수령 한도(1,500만 원) 내로 수령액을 균등 분산하여 3.3%~5.5% 수준의 저율과세 혜택을 100% 누리며, 퇴직연금 수령 기간을 11년 이상 확보하여 퇴직소득세를 최대 40% 감면받을 수 있도록 최적화했습니다."}
                  {activeTab === "S2" && "국민연금 5년 연기형은 은퇴 직후 소득 공백기 동안 IRP 퇴직소득세 감면 재원 및 개인연금저축을 집중 활용하여 생활비를 충당하고, 국민연금을 5년 연기함으로써 매년 7.2%씩(총 +36%) 연금 수령 단가를 증액하여 생애 후반의 장수 리스크와 물가 상승 위험을 강력히 방어합니다."}
                  {activeTab === "S3" && "커스텀 전략 조정을 통해 본인만의 최적의 절세 구간을 찾을 수 있습니다. 가능한 사적연금 인출액을 고르게 평탄화하고 수령 기간을 10년 이상 길게 설계하는 것이 절세의 핵심입니다."}
                </p>
              </div>
            </div>

            {/* 3. Detailed Year-by-Year Table */}
            <div style={styles.dashboardCard} className="premium-card">
              <h3 style={styles.chartTitle}>연도별 상세 현금흐름 및 세후 시뮬레이션 표</h3>
              <p style={styles.chartSubtitle}>원 단위 계산식을 만 원 단위로 절사한 상세 연도별 테이블</p>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHeader}>
                      <th style={styles.th}>나이</th>
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
                    {activeResult.flows.map((flow) => (
                      <tr key={flow.age} style={styles.tr}>
                        <td style={styles.td}>{flow.age}세</td>
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
                      <td style={{ padding: "12px 10px", color: "var(--text-primary)", textAlign: "right", fontWeight: 800 }}>합계</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-secondary)", textAlign: "right" }}>-</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-primary)", textAlign: "right", fontWeight: 800 }}>{totalFlows.totalPreTax.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.nationalPreTax.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.retirementPreTax.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.personalPreTax.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-secondary)", textAlign: "right" }}>{totalFlows.insurancePreTax.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--warning)", textAlign: "right" }}>{totalFlows.taxOnRetirement.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--warning)", textAlign: "right" }}>{totalFlows.taxOnPersonal.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--warning)", textAlign: "right" }}>{totalFlows.healthInsurance.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", color: "var(--success)", textAlign: "right", fontWeight: 800 }}>
                        {totalFlows.totalPostTax.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 10px", color: "var(--text-secondary)", textAlign: "right" }}>-</td>
                      <td style={{ padding: "12px 10px", color: totalFlows.deficit > 0 ? "var(--danger)" : "var(--text-secondary)", textAlign: "right" }}>
                        {totalFlows.deficit > 0 ? totalFlows.deficit.toLocaleString() : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
            </div>
          </div>
        </section>
      </div>
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
    padding: "16px 40px",
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
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px 80px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "30px",
    zIndex: 1,
  },
  topSecurityBanner: {
    backgroundColor: "rgba(99, 102, 241, 0.06)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.5)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 18px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "20px",
  },
  kpiCard: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100px",
  },
  kpiLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  kpiValue: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: "12px 0 6px 0",
  },
  kpiSub: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  chartTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  chartSubtitle: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginBottom: "20px",
  },
  slidersCard: {
    padding: "30px",
  },
  slidersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px 40px",
    marginTop: "16px",
  },
  sliderGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  sliderValue: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--primary)",
  },
  sliderRange: {
    width: "100%",
    cursor: "pointer",
    accentColor: "var(--primary)",
  },
  wizardCard: {
    padding: "24px",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    backgroundColor: "var(--surface)",
  },
  wizardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "12px",
  },
  closeWizardBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  wizardBody: {
    padding: "20px 0",
  },
  wizardQuestion: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.6,
  },
  wizardHelp: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginTop: "6px",
  },
  wizardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid var(--border)",
    paddingTop: "12px",
    marginTop: "10px",
  },
  prevBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--primary-400)",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  quickLabel: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
  },
  quickVal: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    width: "45px",
    textAlign: "right",
  },
  quickInput: {
    marginTop: "6px",
    width: "120px",
    padding: "8px 12px",
    backgroundColor: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    outline: "none",
  },
  resultContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
  },
  pdfRootContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  dashboardCard: {
    padding: "36px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  dashboardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  reportSub: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--primary-300)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  logoText: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
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
    gap: "16px",
    padding: "18px 24px",
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    border: "1px solid rgba(16, 185, 129, 0.15)",
    borderRadius: "var(--radius-md)",
  },
  comparisonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  stratCompareCard: {
    padding: "20px",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
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
    gap: "10px",
    flexWrap: "wrap",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "12px",
  },
  tabButton: {
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  customParamsBox: {
    padding: "20px",
    backgroundColor: "var(--surface-2)",
  },
  customSlidersGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sliderGroupContainer: {
    borderBottom: "1px dashed var(--border)",
    paddingBottom: "16px",
  },
  sliderGroupTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--primary-300)",
  },
  reformImpactBox: {
    backgroundColor: "rgba(99, 102, 241, 0.03)",
    border: "1px dashed rgba(99, 102, 241, 0.2)",
    borderRadius: "var(--radius-md)",
    padding: "20px",
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
    padding: "12px 10px",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  tr: {
    borderBottom: "1px solid var(--border)",
    backgroundColor: "transparent",
    transition: "background-color 0.15s ease",
  },
  td: {
    padding: "12px 10px",
    color: "var(--text-secondary)",
  },
  footnoteSection: {
    padding: "24px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    marginTop: "10px",
  },
  footnoteText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    lineHeight: "1.6",
    marginBottom: "8px",
  },
};
