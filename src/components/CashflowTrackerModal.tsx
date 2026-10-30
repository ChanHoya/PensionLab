"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CashflowRecord,
  CashflowIncome,
  CashflowExpense,
  CashflowAnalysisResult,
  loadCashflowRecords,
  saveCashflowRecords,
  analyzeCashflow,
  DEFAULT_CASHFLOW_RECORDS,
} from "../services/cashflowTrackerService";
import { NumberPopIn } from "@/components/motion";
import GlossaryTooltip from "./GlossaryTooltip";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface CashflowTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonthlySpending?: number; // 만원 단위 (대시보드 목표 생활비)
  liquidAssets?: number; // 만원 단위 (비연금 금융자산)
}

export default function CashflowTrackerModal({
  isOpen,
  onClose,
  targetMonthlySpending = 380,
  liquidAssets = 15000,
}: CashflowTrackerModalProps) {
  const [activeTab, setActiveTab] = useState<"DIAGNOSIS" | "INPUT" | "TREND">("DIAGNOSIS");
  const [records, setRecords] = useState<CashflowRecord[]>(DEFAULT_CASHFLOW_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");

  // 신규/수정 입력 폼 상태
  const [yearMonth, setYearMonth] = useState<string>("2026-10");
  const [income, setIncome] = useState<CashflowIncome>({
    nationalPension: 180,
    retirementPension: 120,
    personalPension: 70,
    housingPension: 0,
    dividendIncome: 50,
    otherIncome: 0,
  });
  const [expense, setExpense] = useState<CashflowExpense>({
    fixedLiving: 150,
    variableLiving: 165,
    medicalCare: 35,
    specialEvents: 30,
  });
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const loaded = loadCashflowRecords();
      setRecords(loaded);
      if (loaded.length > 0) {
        const latest = loaded[loaded.length - 1];
        setSelectedRecordId(latest.id);
        setYearMonth(latest.yearMonth);
        setIncome(latest.income);
        setExpense(latest.expense);
        setNote(latest.note || "");
      }
    }
  }, [isOpen]);

  // 현재 선택된 월의 기록
  const activeRecord = useMemo(() => {
    return records.find((r) => r.id === selectedRecordId) || records[records.length - 1] || DEFAULT_CASHFLOW_RECORDS[0];
  }, [records, selectedRecordId]);

  // 분석 결과 산출
  const analysis: CashflowAnalysisResult = useMemo(() => {
    if (!activeRecord) {
      return analyzeCashflow(DEFAULT_CASHFLOW_RECORDS[0], targetMonthlySpending, liquidAssets);
    }
    return analyzeCashflow(activeRecord, targetMonthlySpending, liquidAssets);
  }, [activeRecord, targetMonthlySpending, liquidAssets]);

  // 트렌드 차트 데이터 구성
  const trendData = useMemo(() => {
    return records.map((r) => {
      const res = analyzeCashflow(r, targetMonthlySpending, liquidAssets);
      return {
        month: r.yearMonth.slice(2), // '26-05'
        총수입: res.totalIncome,
        총지출: res.totalExpense,
        순현금흐름: res.netCashflow,
        목표생활비: targetMonthlySpending,
      };
    });
  }, [records, targetMonthlySpending, liquidAssets]);

  if (!isOpen) return null;

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const existingIndex = records.findIndex((r) => r.yearMonth === yearMonth);
    let updated: CashflowRecord[];

    const newRecord: CashflowRecord = {
      id: existingIndex >= 0 ? records[existingIndex].id : `rec-${yearMonth}`,
      yearMonth,
      income,
      expense,
      note,
      createdAt: new Date().toISOString().split("T")[0],
    };

    if (existingIndex >= 0) {
      updated = [...records];
      updated[existingIndex] = newRecord;
    } else {
      updated = [...records, newRecord].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    }

    setRecords(updated);
    saveCashflowRecords(updated);
    setSelectedRecordId(newRecord.id);
    setActiveTab("DIAGNOSIS");
  };

  const handleResetToDefault = () => {
    if (confirm("가계부 데이터를 기본 예시 데이터로 초기화하시겠습니까?")) {
      setRecords(DEFAULT_CASHFLOW_RECORDS);
      saveCashflowRecords(DEFAULT_CASHFLOW_RECORDS);
      const latest = DEFAULT_CASHFLOW_RECORDS[DEFAULT_CASHFLOW_RECORDS.length - 1];
      setSelectedRecordId(latest.id);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="t-modal-spring modal-container"
        style={{
          width: "100%",
          maxWidth: "840px",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={styles.iconBadge}>💳</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={styles.title}>실전 은퇴 가계부 & 연금 인출 트래커</h2>
                <span style={styles.tagBadge}>런웨이 진단</span>
              </div>
              <p style={styles.subtitle}>
                당초 설계한 목표 생활비 및 인출 전략 대비 실제 소비 괴리율과 자산 소진 속도(Runway)를 실시간 모니터링합니다.
              </p>
            </div>
          </div>
          <button className="modal-close-button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabNav}>
          <button
            style={activeTab === "DIAGNOSIS" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("DIAGNOSIS")}
          >
            📊 수지 및 런웨이 진단
          </button>
          <button
            style={activeTab === "INPUT" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("INPUT")}
          >
            ✍️ 당월 가계부 입력 & 기록
          </button>
          <button
            style={activeTab === "TREND" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("TREND")}
          >
            📈 12개월 소비 추이 트렌드
          </button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          {/* TAB 1: DIAGNOSIS */}
          {activeTab === "DIAGNOSIS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Record Selector */}
              <div style={styles.selectorBar}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  📅 분석 대상 월 선택:
                </span>
                <select
                  style={styles.selectInput}
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                >
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.yearMonth} ({r.note || "기본 기록"})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  style={styles.btnMiniEdit}
                  onClick={() => {
                    const r = records.find((x) => x.id === selectedRecordId);
                    if (r) {
                      setYearMonth(r.yearMonth);
                      setIncome(r.income);
                      setExpense(r.expense);
                      setNote(r.note || "");
                      setActiveTab("INPUT");
                    }
                  }}
                >
                  수정하기 ✏️
                </button>
              </div>

              {/* 3대 핵심 KPI 카드 */}
              <div style={styles.kpiGrid}>
                {/* 수지 차액 */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>
                    월 순현금흐름 (수입 - 지출)
                    <GlossaryTooltip termId="CASHFLOW_RUNWAY" iconOnly />
                  </div>
                  <div
                    style={{
                      ...styles.kpiValue,
                      color: analysis.netCashflow >= 0 ? "var(--success, #10b981)" : "var(--danger, #ef4444)",
                    }}
                  >
                    {analysis.netCashflow >= 0 ? "+" : ""}
                    <NumberPopIn value={analysis.netCashflow} /> 만원
                  </div>
                  <div style={styles.kpiSub}>
                    총 수입 {analysis.totalIncome.toLocaleString()}만 vs 총 지출 {analysis.totalExpense.toLocaleString()}만
                  </div>
                </div>

                {/* 목표 대비 괴리율 */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>
                    목표 생활비 대비 괴리율
                  </div>
                  <div
                    style={{
                      ...styles.kpiValue,
                      color: analysis.divergenceRate > 15 ? "var(--danger, #ef4444)" : "var(--text-primary)",
                    }}
                  >
                    {analysis.divergenceRate > 0 ? "+" : ""}
                    <NumberPopIn value={analysis.divergenceRate} />%
                  </div>
                  <div style={styles.kpiSub}>
                    목표 {targetMonthlySpending.toLocaleString()}만 원 대비{" "}
                    {analysis.budgetDifference >= 0 ? `${analysis.budgetDifference.toLocaleString()}만 원 초과` : `${Math.abs(analysis.budgetDifference).toLocaleString()}만 원 절약`}
                  </div>
                </div>

                {/* 런웨이 (Runway) */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>
                    비연금 자산 버팀 기간 (Runway)
                  </div>
                  <div
                    style={{
                      ...styles.kpiValue,
                      color: analysis.runwayMonths === 999 ? "var(--success, #10b981)" : "var(--warning, #f59e0b)",
                    }}
                  >
                    {analysis.runwayMonths === 999 ? "영구 보존 (흑자)" : `${analysis.runwayYears}년 (${analysis.runwayMonths}개월)`}
                  </div>
                  <div style={styles.kpiSub}>
                    비연금 자산 {liquidAssets.toLocaleString()}만 원 기준
                  </div>
                </div>
              </div>

              {/* 지출 구성비 & 건전성 배너 */}
              <div style={styles.healthBanner}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "24px" }}>
                    {analysis.healthStatus === "SAFE" ? "🟢" : analysis.healthStatus === "CAUTION" ? "🟡" : "🔴"}
                  </span>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: analysis.healthColor }}>
                      재무 건전성: {analysis.healthLabel} (평가 점수: {analysis.healthScore}점)
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      고정지출 {analysis.expenseRatios.fixed}% · 변동지출 {analysis.expenseRatios.variable}% · 의료건강 {analysis.expenseRatios.medical}% · 특별경조사 {analysis.expenseRatios.special}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 맞춤 처방 액션 카드 */}
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  💡 실전 은퇴 가계부 맞춤 권장 처방
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {analysis.actionRecommendations.map((act, idx) => (
                    <div key={idx} style={styles.actionCard}>
                      <span style={styles.actionTag}>{act.tag}</span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
                          {act.title}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>
                          {act.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INPUT */}
          {activeTab === "INPUT" && (
            <form onSubmit={handleSaveRecord} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
                  기록 대상 연월:
                </label>
                <input
                  type="month"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                  required
                  style={styles.textInput}
                />
                <input
                  type="text"
                  placeholder="메모 (예: 추석 명절, 여행 지출 등)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ ...styles.textInput, flex: 1 }}
                />
              </div>

              {/* 수입 입력 섹션 */}
              <div style={styles.formSection}>
                <h4 style={styles.formSectionTitle}>💰 월 수입 내역 (만원)</h4>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.formLabel}>국민연금 (본인+배우자)</label>
                    <input
                      type="number"
                      value={income.nationalPension}
                      onChange={(e) => setIncome({ ...income, nationalPension: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>퇴직연금 (IRP/DC)</label>
                    <input
                      type="number"
                      value={income.retirementPension}
                      onChange={(e) => setIncome({ ...income, retirementPension: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>개인연금 (연금저축)</label>
                    <input
                      type="number"
                      value={income.personalPension}
                      onChange={(e) => setIncome({ ...income, personalPension: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>배당 / 이자 금융소득</label>
                    <input
                      type="number"
                      value={income.dividendIncome}
                      onChange={(e) => setIncome({ ...income, dividendIncome: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>주택연금 (역모기지)</label>
                    <input
                      type="number"
                      value={income.housingPension}
                      onChange={(e) => setIncome({ ...income, housingPension: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>기타 재취업 / 임대소득</label>
                    <input
                      type="number"
                      value={income.otherIncome}
                      onChange={(e) => setIncome({ ...income, otherIncome: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                </div>
              </div>

              {/* 지출 입력 섹션 */}
              <div style={styles.formSection}>
                <h4 style={styles.formSectionTitle}>🛒 월 지출 내역 (만원)</h4>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.formLabel}>고정 생활비 (주거/관리/통신)</label>
                    <input
                      type="number"
                      value={expense.fixedLiving}
                      onChange={(e) => setExpense({ ...expense, fixedLiving: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>변동 생활비 (식비/생필품/여가)</label>
                    <input
                      type="number"
                      value={expense.variableLiving}
                      onChange={(e) => setExpense({ ...expense, variableLiving: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>의료 및 간병비 (약값/병원)</label>
                    <input
                      type="number"
                      value={expense.medicalCare}
                      onChange={(e) => setExpense({ ...expense, medicalCare: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>특별 지출 (경조사/여행/선물)</label>
                    <input
                      type="number"
                      value={expense.specialEvents}
                      onChange={(e) => setExpense({ ...expense, specialEvents: Number(e.target.value) })}
                      style={styles.textInput}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <button type="button" onClick={handleResetToDefault} style={styles.btnSecondary}>
                  기본 예시 데이터로 리셋
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  가계부 기록 저장하기 💾
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: TREND */}
          {activeTab === "TREND" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ height: "320px", width: "100%", marginTop: "10px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(255,255,255,0.08))" />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} unit="만" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card-bg, #1e293b)",
                        border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
                        borderRadius: "8px",
                      }}
                      formatter={(val: any) => [`${Number(val).toLocaleString()}만 원`]}
                    />
                    <Legend />
                    <Bar dataKey="총수입" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="총지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="목표생활비" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                    <Line type="monotone" dataKey="순현금흐름" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                💡 초록색 실선(순현금흐름)이 0선 위쪽에 위치할수록 자산이 축적되며, 주황색 점선(목표 생활비) 아래로 지출을 통제하는 것이 안정적입니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: "var(--bg-card, #1e293b)",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "840px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 24px 16px",
    borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
  },
  iconBadge: {
    fontSize: "28px",
    background: "rgba(59, 130, 246, 0.15)",
    padding: "10px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--text-primary, #ffffff)",
    margin: 0,
  },
  tagBadge: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "6px",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    color: "#10b981",
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--text-secondary, #94a3b8)",
    marginTop: "4px",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary, #94a3b8)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px 8px",
  },
  tabNav: {
    display: "flex",
    padding: "12px 24px 0",
    borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
    gap: "8px",
  },
  tab: {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-secondary, #94a3b8)",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
  },
  tabActive: {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--primary, #3b82f6)",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid var(--primary, #3b82f6)",
    cursor: "pointer",
  },
  body: {
    padding: "24px",
    overflowY: "auto",
  },
  selectorBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "10px",
    backgroundColor: "var(--bg-subtle, rgba(255, 255, 255, 0.04))",
  },
  selectInput: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
    backgroundColor: "var(--bg-card, #0f172a)",
    color: "var(--text-primary, #ffffff)",
    fontSize: "14px",
    flex: 1,
  },
  btnMiniEdit: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid var(--primary, #3b82f6)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    color: "var(--primary, #3b82f6)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  kpiCard: {
    padding: "18px",
    borderRadius: "12px",
    backgroundColor: "var(--bg-subtle, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
  },
  kpiLabel: {
    fontSize: "13px",
    color: "var(--text-secondary, #94a3b8)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  kpiValue: {
    fontSize: "24px",
    fontWeight: "800",
    margin: "8px 0 4px",
  },
  kpiSub: {
    fontSize: "12px",
    color: "var(--text-secondary, #94a3b8)",
  },
  healthBanner: {
    padding: "16px 20px",
    borderRadius: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
  },
  actionCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "10px",
    backgroundColor: "var(--bg-subtle, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
  },
  actionTag: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "6px",
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    color: "#60a5fa",
    whiteSpace: "nowrap",
  },
  formSection: {
    padding: "18px",
    borderRadius: "12px",
    backgroundColor: "var(--bg-subtle, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
  },
  formSectionTitle: {
    fontSize: "15px",
    fontWeight: "700",
    margin: "0 0 14px 0",
    color: "var(--text-primary, #ffffff)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
  },
  formLabel: {
    fontSize: "12px",
    color: "var(--text-secondary, #94a3b8)",
    display: "block",
    marginBottom: "6px",
  },
  textInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
    backgroundColor: "var(--bg-card, #0f172a)",
    color: "var(--text-primary, #ffffff)",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  btnPrimary: {
    padding: "12px 24px",
    borderRadius: "8px",
    backgroundColor: "var(--primary, #3b82f6)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 18px",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "var(--text-secondary, #94a3b8)",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
    fontSize: "13px",
    cursor: "pointer",
  },
};
