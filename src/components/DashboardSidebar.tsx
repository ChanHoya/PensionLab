// 대시보드 왼쪽 입력 옵션 및 4단계 전문 에이전트(Agent 1~4) 대응 도구 분류 사이드바
"use client";

import React, { useEffect } from "react";
import { usePensionStore, type SimulationParamsState, DEFAULT_AGE_BANDS } from "@/store/usePensionStore";
import { NPS_RULES } from "@/config/npsRules";
import { statutoryStartAgeOf } from "@/services/coupleSimulation";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  personalTaxCreditRatio: number;
  setPersonalTaxCreditRatio: (v: number) => void;
  retirementLumpSumTaxRate: number;
  setRetirementLumpSumTaxRate: (v: number) => void;
  otherIncomeAnnual: number;
  setOtherIncomeAnnual: (v: number) => void;
  s3StartAges: Record<string, number>;
  setS3StartAges: (v: Record<string, number>) => void;
  s3Periods: Record<string, number>;
  setS3Periods: (v: Record<string, number>) => void;
  onOpenQuickDiagnosisModal?: () => void;
  onOpenPersonaModal?: () => void;
  onOpenBepModal?: () => void;
  onOpenTax15Modal?: () => void;
  onOpenHealthBillModal?: () => void;
  onOpenReverseMortgageModal?: () => void;
  onOpenIncomeBridgeModal?: () => void;
  onOpenNpsBoostModal?: () => void;
  onOpenSavingsPlanModal?: () => void;
  onOpenSurvivorCareModal?: () => void;
  onOpenIsaTransferModal?: () => void;
  onOpenDividendStrategyModal?: () => void;
  onOpenPortfolioBacktestModal?: () => void;
  onOpenDbDcModal?: () => void;
  onOpenThreeBucketModal?: () => void;
  onOpenPensionTransferModal?: () => void;
  onOpenRetirementRoadmapModal?: () => void;
  onOpenScenarioComparisonModal?: () => void;
  onOpenAccountTaxMatrixModal?: () => void;
  onOpenCashflowTrackerModal?: () => void;
  onOpenInteractiveAdvisorModal?: () => void;
  onOpenTaxAndHealthStatementModal?: () => void;
  onOpenDividendCalendarModal?: () => void;
  onOpenStressTestModal?: () => void;
  onOpenShareSnapshotModal?: () => void;
  onOpenNpsRecoveryModal?: () => void;
  onOpenRebalancingOrderModal?: () => void;
  onOpenNpsReformModal?: () => void;
}

export default function DashboardSidebar(props: Props) {
  const store = usePensionStore();
  const params = store.simulationParams;
  const hasSpouse = params.hasSpouse;
  const setParam = (data: Partial<SimulationParamsState>) => store.setSimulationParams(data);

  // 국민연금 개시 나이는 출생연도별 법정 나이로 고정
  const selfStatutory = statutoryStartAgeOf(params, "SELF");
  const spouseStatutory = statutoryStartAgeOf(params, "SPOUSE");
  const thisYear = new Date().getFullYear();
  const selfBirth = params.birthYear || thisYear - params.currentAge;
  const spouseBirth = params.spouseBirthYear || thisYear - (params.spouseAge ?? params.currentAge);
  const setSimulationParams = store.setSimulationParams;

  useEffect(() => {
    const fix: Partial<SimulationParamsState> = {};
    if (params.nationalPensionStartAge !== selfStatutory) fix.nationalPensionStartAge = selfStatutory;
    if (hasSpouse && params.spouseNationalPensionStartAge !== spouseStatutory) fix.spouseNationalPensionStartAge = spouseStatutory;
    if (Object.keys(fix).length > 0) setSimulationParams(fix);
  }, [params.nationalPensionStartAge, params.spouseNationalPensionStartAge, selfStatutory, spouseStatutory, hasSpouse, setSimulationParams]);

  if (props.collapsed) {
    return (
      <aside style={styles.rail} className="dash-sidebar">
        <button type="button" onClick={props.onToggle} style={styles.railButton} title="입력 옵션 펼치기">
          ▶<span style={styles.railText}>입력 옵션</span>
        </button>
      </aside>
    );
  }

  const slider = (label: string, value: number, unit: string, min: number, max: number, step: number, onChange: (v: number) => void) => (
    <div style={styles.field}>
      <div style={styles.labelRow}>
        <label style={styles.label}>{label}</label>
        <span style={styles.value}>
          {value}
          {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={styles.range} />
    </div>
  );

  const number = (label: string, value: number, onChange: (v: number) => void, hint?: string, placeholder?: string) => (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {hint && <span style={styles.hint}>{hint}</span>}
      </label>
      <input
        type="number"
        min={0}
        className="premium-input"
        style={styles.input}
        placeholder={placeholder ?? "0"}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );

  const deferSelect = (label: string, value: number, baseAge: number, key: "nationalPensionDeferYears" | "spouseNationalPensionDeferYears") => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <select className="premium-input" style={styles.input} value={value} onChange={(e) => setParam({ [key]: Number(e.target.value) })}>
        {Array.from({ length: NPS_RULES.maxDeferralYears + 1 }, (_, y) => (
          <option key={y} value={y}>
            {y === 0 ? `연기 안 함 (${baseAge}세)` : `${y}년 연기 · ${baseAge + y}세 (+${(NPS_RULES.deferralBonusPerYear * y * 100).toFixed(1)}%)`}
          </option>
        ))}
      </select>
    </div>
  );

  const accounts = [
    ...store.retirementPensions.map((p) => ({ id: p.id, name: `${p.pensionType} 퇴직연금` })),
    ...store.personalPensions.map((p) => ({ id: p.id, name: `개인연금저축 (${p.savingsType})` })),
    ...store.pensionInsurances.map((i) => ({ id: i.id, name: `연금보험 (${i.insuranceType})` })),
    ...(hasSpouse
      ? [
          ...store.spouse.retirementPensions.map((p) => ({ id: p.id, name: `배우자 ${p.pensionType} 퇴직연금` })),
          ...store.spouse.personalPensions.map((p) => ({ id: p.id, name: `배우자 개인연금저축 (${p.savingsType})` })),
          ...store.spouse.pensionInsurances.map((i) => ({ id: i.id, name: `배우자 연금보험 (${i.insuranceType})` })),
        ]
      : []),
  ];

  const coveredCallAsset = params.coveredCallAsset || 5000;
  const coveredCallRate = params.coveredCallDividendRate || 9.0;
  const coveredCallPriceReturn = params.coveredCallPriceReturnRate ?? 0.0;

  // ─────────────────────────────────────────────────────────────
  // 분류별 팁 버튼 톤 팔레트 (옅은색 → 점점 짙은색 단계별 스케일)
  // ─────────────────────────────────────────────────────────────
  interface ToolTone {
    text: string;
    bg: string;
    border: string;
    fontWeight?: number;
  }

  // 1. 공·사적 연금 최적화: 골드/앰버/오렌지 계열 (5단계: 옅은 레몬골드 → 짙은 딥오렌지)
  const PENSION_TOOL_TONES: ToolTone[] = [
    { text: "#fde047", bg: "rgba(253, 224, 71, 0.05)", border: "rgba(253, 224, 71, 0.22)", fontWeight: 600 },
    { text: "#fbbf24", bg: "rgba(251, 191, 36, 0.09)", border: "rgba(251, 191, 36, 0.35)", fontWeight: 600 },
    { text: "#f59e0b", bg: "rgba(245, 158, 11, 0.13)", border: "rgba(245, 158, 11, 0.48)", fontWeight: 650 },
    { text: "#f97316", bg: "rgba(249, 115, 22, 0.18)", border: "rgba(249, 115, 22, 0.62)", fontWeight: 700 },
    { text: "#ea580c", bg: "rgba(234, 88, 12, 0.24)", border: "rgba(234, 88, 12, 0.78)", fontWeight: 750 },
  ];

  // 2. 절세 & 건강보험료 수비: 민트/에메랄드/그린 계열 (5단계: 옅은 파스텔민트 → 짙은 포레스트에메랄드)
  const TAX_TOOL_TONES: ToolTone[] = [
    { text: "#a7f3d0", bg: "rgba(167, 243, 208, 0.05)", border: "rgba(167, 243, 208, 0.22)", fontWeight: 600 },
    { text: "#6ee7b7", bg: "rgba(110, 231, 183, 0.09)", border: "rgba(110, 231, 183, 0.35)", fontWeight: 600 },
    { text: "#34d399", bg: "rgba(52, 211, 153, 0.13)", border: "rgba(52, 211, 153, 0.48)", fontWeight: 650 },
    { text: "#10b981", bg: "rgba(16, 185, 129, 0.18)", border: "rgba(16, 185, 129, 0.62)", fontWeight: 700 },
    { text: "#059669", bg: "rgba(5, 150, 105, 0.24)", border: "rgba(5, 150, 105, 0.78)", fontWeight: 750 },
  ];

  // 3-A. 인출 전략 & 자산 런웨이 방어: 스카이/사이언/블루 계열 (핵심 3종: 옅은 스카이 → 짙은 로열블루)
  const RUNWAY_CORE_TONES: ToolTone[] = [
    { text: "#bae6fd", bg: "rgba(186, 230, 253, 0.06)", border: "rgba(186, 230, 253, 0.25)", fontWeight: 600 },
    { text: "#38bdf8", bg: "rgba(56, 189, 248, 0.13)", border: "rgba(56, 189, 248, 0.48)", fontWeight: 650 },
    { text: "#0284c7", bg: "rgba(14, 165, 233, 0.22)", border: "rgba(14, 165, 233, 0.75)", fontWeight: 750 },
  ];

  // 3-B. 심화 런웨이 분석 도구 (8종) 펼치기: 블루 계열 8단계 점진 스케일
  const RUNWAY_DEEP_TONES: ToolTone[] = [
    { text: "#e0f2fe", bg: "rgba(224, 242, 254, 0.05)", border: "rgba(224, 242, 254, 0.20)", fontWeight: 600 },
    { text: "#bae6fd", bg: "rgba(186, 230, 253, 0.07)", border: "rgba(186, 230, 253, 0.26)", fontWeight: 600 },
    { text: "#7dd3fc", bg: "rgba(125, 211, 252, 0.09)", border: "rgba(125, 211, 252, 0.33)", fontWeight: 600 },
    { text: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.41)", fontWeight: 650 },
    { text: "#0ea5e9", bg: "rgba(14, 165, 233, 0.15)", border: "rgba(14, 165, 233, 0.50)", fontWeight: 650 },
    { text: "#0284c7", bg: "rgba(2, 132, 199, 0.18)", border: "rgba(2, 132, 199, 0.60)", fontWeight: 700 },
    { text: "#2563eb", bg: "rgba(37, 99, 235, 0.22)", border: "rgba(37, 99, 235, 0.70)", fontWeight: 700 },
    { text: "#1d4ed8", bg: "rgba(29, 78, 216, 0.26)", border: "rgba(29, 78, 216, 0.80)", fontWeight: 750 },
  ];

  // 4. 시나리오 비교 & 종합 진단: 라벤더/바이올렛/퍼플 계열 (3단계: 옅은 라벤더 → 짙은 로열퍼플)
  const SCENARIO_TOOL_TONES: ToolTone[] = [
    { text: "#e9d5ff", bg: "rgba(233, 213, 255, 0.06)", border: "rgba(233, 213, 255, 0.25)", fontWeight: 600 },
    { text: "#c084fc", bg: "rgba(192, 132, 252, 0.13)", border: "rgba(192, 132, 252, 0.48)", fontWeight: 650 },
    { text: "#a855f7", bg: "rgba(168, 85, 247, 0.22)", border: "rgba(168, 85, 247, 0.75)", fontWeight: 750 },
  ];

  // 공통 툴 버튼 렌더러
  const renderToolButton = (
    onClick: (() => void) | undefined,
    icon: string,
    title: string,
    toneOrAccent: ToolTone | string,
    id?: string,
    tooltip?: string
  ) => {
    if (!onClick) return null;
    const tone: ToolTone =
      typeof toneOrAccent === "string"
        ? {
            text: `rgb(${toneOrAccent})`,
            bg: `rgba(${toneOrAccent}, 0.06)`,
            border: `rgba(${toneOrAccent}, 0.35)`,
            fontWeight: 600,
          }
        : toneOrAccent;

    return (
      <button
        type="button"
        id={id}
        onClick={onClick}
        className="premium-button-secondary tool-action-btn"
        style={{
          width: "100%",
          padding: "8px 10px",
          minHeight: "36px",
          fontSize: "0.78rem",
          fontWeight: tone.fontWeight ?? 600,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderColor: tone.border,
          color: tone.text,
          background: tone.bg,
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "4px",
          transition: "all var(--transition-fast, 0.15s ease)",
        }}
        title={tooltip || title}
      >
        <span style={{ fontSize: "0.88rem" }}>{icon}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      </button>
    );
  };

  return (
    <aside style={styles.sidebar} className="dash-sidebar">
      {/* 헤더 */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>⚙️ 설정 & 분석 툴킷</span>
        <button type="button" onClick={props.onToggle} style={styles.collapseButton} title="입력 옵션 접기">
          ◀ 접기
        </button>
      </div>

      {/* 🚀 빠른 실행: 퀵 진단 & 페르소나 & 스냅샷 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "4px" }}>
        {props.onOpenQuickDiagnosisModal && (
          <button
            type="button"
            id="sidebar-btn-quick-diagnosis"
            onClick={props.onOpenQuickDiagnosisModal}
            className="premium-button"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "0.8rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
              border: "none",
              borderRadius: "var(--radius-sm, 8px)",
              cursor: "pointer",
            }}
            title="초보자를 위한 30초 퀵 간편 진단 (Easy Mode)"
          >
            <span>⚡</span>
            <span>30초 퀵 간편 진단</span>
          </button>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {props.onOpenPersonaModal && (
            <button
              type="button"
              id="sidebar-btn-persona"
              onClick={props.onOpenPersonaModal}
              className="premium-button-secondary"
              style={{
                padding: "6px 8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                background: "rgba(139, 92, 246, 0.08)",
                color: "#8b5cf6",
                borderColor: "rgba(139, 92, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                borderRadius: "var(--radius-sm, 6px)",
                cursor: "pointer",
              }}
              title="대표 가구 페르소나 데이터 불러오기"
            >
              <span>👥</span>
              <span>페르소나 체험</span>
            </button>
          )}

          {props.onOpenShareSnapshotModal && (
            <button
              type="button"
              onClick={props.onOpenShareSnapshotModal}
              className="premium-button-secondary"
              style={{
                padding: "6px 8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                background: "rgba(14, 165, 233, 0.08)",
                color: "#0284c7",
                borderColor: "rgba(14, 165, 233, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                borderRadius: "var(--radius-sm, 6px)",
                cursor: "pointer",
              }}
              title="은퇴 시뮬레이션 설정 링크 공유"
            >
              <span>🔗</span>
              <span>가족 공유 링크</span>
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. 기본 설정 & 생애 지출 곡선 (기초 시뮬레이션 파라미터) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <details open style={styles.group}>
        <summary style={styles.summary}>
          <span>📋</span> 기본 설정 & 생애 지출 곡선
        </summary>
        
        {slider("본인 기대수명", params.expectedLifeExpectancy, "세", 75, 105, 1, (v) => setParam({ expectedLifeExpectancy: v }))}
        {hasSpouse && slider("배우자 기대수명", params.spouseLifeExpectancy, "세", 75, 105, 1, (v) => setParam({ spouseLifeExpectancy: v }))}
        {slider("물가상승률", params.inflationRate, "%", 0.5, 6, 0.1, (v) => setParam({ inflationRate: v }))}

        <div style={styles.field}>
          <label style={styles.label}>{hasSpouse ? "인출 시작 나이 (본인 기준)" : "인출 시작 나이"}</label>
          <input
            type="number"
            min={55}
            className="premium-input"
            style={styles.input}
            value={params.privateDrawStartAge || ""}
            placeholder={params.currentAge < 55 ? "비우면 55세 (법정 최소 55세)" : `비우면 ${params.currentAge + 1}세(내년)`}
            onChange={(e) => setParam({ privateDrawStartAge: Number(e.target.value) })}
            onBlur={(e) => {
              const val = Number(e.target.value);
              if (val > 0 && val < 55) {
                setParam({ privateDrawStartAge: 55 });
              }
            }}
          />
          <p style={{ ...styles.note, marginTop: 4 }}>
            * 퇴직·개인연금은 소득세법상 만 55세부터 인출 가능합니다. (최소 만 55세)
          </p>
        </div>

        <div style={styles.field}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={styles.label}>지출 패턴 (인출 설계)</label>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                className="premium-button-secondary"
                style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                onClick={() => {
                  setParam({
                    spendingPattern: "AGE_BANDS",
                    decumulationStrategy: "DECREASING",
                    ageBands: DEFAULT_AGE_BANDS,
                    targetMonthlySpending: DEFAULT_AGE_BANDS.age60s.target,
                    minMonthlySpending: DEFAULT_AGE_BANDS.age60s.min,
                  });
                }}
              >
                권장 체감형
              </button>
              <button
                type="button"
                className="premium-button-secondary"
                style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                onClick={() => {
                  const cur = params.targetMonthlySpending || 300;
                  const curMin = params.minMonthlySpending || 200;
                  setParam({
                    spendingPattern: "FLAT",
                    decumulationStrategy: "FLAT",
                    ageBands: {
                      age60s: { target: cur, min: curMin },
                      age70s: { target: cur, min: curMin },
                      age80s: { target: cur, min: curMin },
                      age90s: { target: cur, min: curMin },
                    },
                  });
                }}
              >
                균등형
              </button>
            </div>
          </div>
          <select
            className="premium-input"
            style={styles.input}
            value={params.spendingPattern || "AGE_BANDS"}
            onChange={(e) => {
              const pattern = e.target.value as SimulationParamsState["spendingPattern"];
              setParam({
                spendingPattern: pattern,
                decumulationStrategy: pattern === "FLAT" ? "FLAT" : "DECREASING",
              });
            }}
          >
            <option value="AGE_BANDS">연령대별 맞춤형 (60대/70대/80대/90대+)</option>
            <option value="ACTIVE_FOCUSED">활동기 집중형 (초기 유지 후 연 2% 체감)</option>
            <option value="SMILING_3STAGE">3단계 생애주기형 (100%→75%→55%)</option>
            <option value="FLAT">고정 균등형 (생애 전 기간 동일)</option>
          </select>
        </div>

        {/* 연령대별 맞춤형 생활비 슬라이더 */}
        {params.spendingPattern === "AGE_BANDS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "6px 0 10px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-accent)", fontWeight: 700 }}>
              📅 연령대별 월 생활비 (현재가치 기준, 만원/월)
            </span>
            {[
              { key: "age60s" as const, label: "60대 (활동기)" },
              { key: "age70s" as const, label: "70대 (안정기)" },
              { key: "age80s" as const, label: "80대 (감소기)" },
              { key: "age90s" as const, label: "90대+ (간병기)" },
            ].map(({ key, label }) => {
              const curBand = params.ageBands?.[key] || DEFAULT_AGE_BANDS[key];
              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: "rgba(99, 102, 241, 0.04)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      목표 <strong>{curBand.target}</strong>만 / 최소 <strong>{curBand.min}</strong>만
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>목표 생활비</span>
                      <input
                        type="number"
                        min={50}
                        step={10}
                        className="premium-input"
                        style={{ ...styles.input, padding: "4px 8px", fontSize: "0.8rem", marginTop: 2 }}
                        value={curBand.target}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const updated = {
                            ...(params.ageBands || DEFAULT_AGE_BANDS),
                            [key]: { ...curBand, target: val },
                          };
                          setParam({
                            ageBands: updated,
                            ...(key === "age60s" ? { targetMonthlySpending: val } : {}),
                          });
                        }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>최소 생활비</span>
                      <input
                        type="number"
                        min={50}
                        step={10}
                        className="premium-input"
                        style={{ ...styles.input, padding: "4px 8px", fontSize: "0.8rem", marginTop: 2 }}
                        value={curBand.min}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const updated = {
                            ...(params.ageBands || DEFAULT_AGE_BANDS),
                            [key]: { ...curBand, min: val },
                          };
                          setParam({
                            ageBands: updated,
                            ...(key === "age60s" ? { minMonthlySpending: val } : {}),
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>{hasSpouse ? "사적연금 수령 종료 나이 (본인 기준)" : "사적연금 수령 종료 나이"}</label>
          <input
            type="number"
            min={0}
            className="premium-input"
            style={styles.input}
            value={params.privatePensionEndAge || ""}
            placeholder={`비우면 ${params.expectedLifeExpectancy}세(기대수명)`}
            onChange={(e) => setParam({ privatePensionEndAge: Number(e.target.value) })}
          />
        </div>
      </details>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. 공·사적 연금 자산 최적화 (Agent 1 연계 도구) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <details open style={styles.group}>
        <summary style={styles.summary}>
          <span>🏛️</span> 공·사적 연금 최적화
        </summary>
        
        {deferSelect(`본인 국민연금 수령 (${selfBirth}년생 · 법정 ${selfStatutory}세)`, params.nationalPensionDeferYears, selfStatutory, "nationalPensionDeferYears")}
        {hasSpouse &&
          deferSelect(
            `배우자 국민연금 수령 (${spouseBirth}년생 · 법정 ${spouseStatutory}세)`,
            params.spouseNationalPensionDeferYears,
            spouseStatutory,
            "spouseNationalPensionDeferYears"
          )}
        <p style={styles.note}>
          출생연도별 법정 개시 연령 기준 최대 {NPS_RULES.maxDeferralYears}년 연기(+{(NPS_RULES.deferralBonusPerYear * 100).toFixed(1)}%/년) 반영.
        </p>

        {/* 관련 특화 분석 툴킷 (공·사적 연금: 옅은 레몬골드 → 짙은 딥오렌지) */}
        <div style={{ marginTop: "6px" }}>
          {renderToolButton(props.onOpenNpsReformModal, "🏛️", "2026 국민연금 개혁 비교 시뮬레이터", PENSION_TOOL_TONES[0])}
          {renderToolButton(props.onOpenNpsBoostModal, "🪜", "국민연금 증액 로드맵 (반납·추납·임의계속)", PENSION_TOOL_TONES[0])}
          {renderToolButton(props.onOpenNpsRecoveryModal, "⚖️", "국민연금 추납 vs 반납 실익 역산기", PENSION_TOOL_TONES[1])}
          {renderToolButton(props.onOpenBepModal, "⚖️", "조기 vs 정상 vs 연기 손익분기(BEP)", PENSION_TOOL_TONES[2], "sidebar-btn-nps-bep")}
          {renderToolButton(props.onOpenDbDcModal, "💼", "퇴직연금 DB/DC 전환·임금피크 타이밍", PENSION_TOOL_TONES[3])}
          {renderToolButton(props.onOpenPensionTransferModal, "🔄", "개인연금(IRP) 금융사 갈아타기 실익", PENSION_TOOL_TONES[4])}
        </div>
      </details>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. 절세 & 건강보험료 수비 (Agent 2 연계 도구) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <details open style={styles.group}>
        <summary style={styles.summary}>
          <span>🛡️</span> 절세 & 건강보험료 수비
        </summary>

        {slider("연금저축 세액공제 비율", Math.round(props.personalTaxCreditRatio * 100), "%", 0, 100, 5, (v) => props.setPersonalTaxCreditRatio(v / 100))}
        {slider("퇴직소득세율", Math.round(props.retirementLumpSumTaxRate * 100), "%", 1, 25, 1, (v) => props.setRetirementLumpSumTaxRate(v / 100))}
        {number("기타 연 소득", props.otherIncomeAnnual, props.setOtherIncomeAnnual, "(만원/년)")}
        {number("재산세 과세표준", params.propertyTaxBase, (v) => setParam({ propertyTaxBase: v }), "(만원 · 연 1.2% 근사)")}
        {number("금융소득 이자+배당", params.financialIncome, (v) => setParam({ financialIncome: v }), "(만원/년 · 1,000만원 초과분 7.09%)")}

        {/* 관련 특화 분석 툴킷 (절세 & 건강보험료: 옅은 파스텔민트 → 짙은 포레스트에메랄드) */}
        <div style={{ marginTop: "6px" }}>
          {renderToolButton(props.onOpenTaxAndHealthStatementModal, "📑", "은퇴 세무·건보 통합 A4 명세서", TAX_TOOL_TONES[0])}
          {renderToolButton(props.onOpenTax15Modal, "⚖️", "사적연금 1,500만 절세 한도 최적화", TAX_TOOL_TONES[1])}
          {renderToolButton(props.onOpenHealthBillModal, "🏥", "은퇴 후 지역건보료 모의 고지서", TAX_TOOL_TONES[2])}
          {renderToolButton(props.onOpenIsaTransferModal, "💎", "ISA 만기 연금 전환 절세 플래너", TAX_TOOL_TONES[3])}
          {renderToolButton(props.onOpenAccountTaxMatrixModal, "📑", "2026 절세 계좌 4총사 자산배분 매트릭스", TAX_TOOL_TONES[4])}
        </div>
      </details>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. 인출 전략 & 자산 런웨이 방어 (Agent 3 연계 도구) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <details open style={styles.group}>
        <summary style={styles.summary}>
          <span>📈</span> 인출 전략 & 자산 런웨이 방어
        </summary>

        {/* S4 하이브리드 배당 파라미터 */}
        <div style={{ backgroundColor: "rgba(99, 102, 241, 0.04)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-accent)", display: "block", marginBottom: "6px" }}>
            S4 하이브리드 배당 설정
          </span>
          {slider("커버드콜 투자금", coveredCallAsset, "만원", 0, 50000, 500, (v) => setParam({ coveredCallAsset: v }))}
          {slider("예상 연 분배율", coveredCallRate, "%", 2, 15, 0.5, (v) => setParam({ coveredCallDividendRate: v }))}
          {slider("예상 가격수익률(NAV)", coveredCallPriceReturn, "%", -10, 5, 0.5, (v) => setParam({ coveredCallPriceReturnRate: v }))}
          
          <div style={{ display: "flex", gap: "4px", margin: "6px 0 8px" }}>
            {[
              { label: "보수 (-5%)", val: -5.0 },
              { label: "중립 (0%)", val: 0.0 },
              { label: "낙관 (+2%)", val: 2.0 },
            ].map((sc) => (
              <button
                key={sc.label}
                type="button"
                onClick={() => setParam({ coveredCallPriceReturnRate: sc.val })}
                style={{
                  flex: 1,
                  padding: "3px 4px",
                  fontSize: "0.68rem",
                  borderRadius: "4px",
                  border: `1px solid ${coveredCallPriceReturn === sc.val ? "var(--primary)" : "var(--border)"}`,
                  background: coveredCallPriceReturn === sc.val ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: coveredCallPriceReturn === sc.val ? "var(--text-accent)" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <label style={{ ...styles.checkbox, margin: "6px 0" }}>
            <input type="checkbox" checked={params.isCoupleDivided || false} onChange={(e) => setParam({ isCoupleDivided: e.target.checked })} />
            부부 명의 분산 (인당 1,000만원 한도 방어)
          </label>
        </div>

        {/* S3 커스텀 계좌별 인출 (접이식) */}
        <details style={{ marginBottom: "8px", border: "1px dashed var(--border)", borderRadius: "6px", padding: "6px" }}>
          <summary style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
            ⚙️ S3 계좌별 인출 시점 세부 설정 ({accounts.length}개 계좌)
          </summary>
          <div style={{ marginTop: "6px" }}>
            {accounts.length === 0 ? (
              <p style={styles.note}>등록된 퇴직·개인연금이 없습니다.</p>
            ) : (
              accounts.map((a) => {
                const start = props.s3StartAges[a.id] || 60;
                const period = props.s3Periods[a.id] || 10;
                return (
                  <div key={a.id} style={styles.account}>
                    <span style={styles.accountName}>{a.name}</span>
                    {slider("개시", start, "세", 55, 80, 1, (v) => props.setS3StartAges({ ...props.s3StartAges, [a.id]: v }))}
                    {slider("기간", period, "년", 5, 30, 1, (v) => props.setS3Periods({ ...props.s3Periods, [a.id]: v }))}
                  </div>
                );
              })
            )}
          </div>
        </details>

        {/* 자산 런웨이 방어 & 포트폴리오 툴킷: 핵심 도구 3종 우선 노출 + 심화 도구 접이식 계층화 */}
        <div style={{ marginTop: "6px" }}>
          {renderToolButton(props.onOpenThreeBucketModal, "🪣", "3-Bucket 현금 버퍼 플래너", RUNWAY_CORE_TONES[0])}
          {renderToolButton(props.onOpenDividendStrategyModal, "💡", "배당금 투자 전략 & 실전 ETF 추천", RUNWAY_CORE_TONES[1])}
          {renderToolButton(props.onOpenIncomeBridgeModal, "🌉", "소득 공백기(크레바스) 브릿지 플래너", RUNWAY_CORE_TONES[2])}

          {/* 추가 심화 분석 툴킷 (접이식 - 옅은 스카이 → 짙은 블루 8단계) */}
          <details style={{ marginTop: "6px", border: "1px dashed var(--border)", borderRadius: "6px", padding: "6px 8px" }}>
            <summary style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer", padding: "2px 0" }}>
              🛠️ 심화 런웨이 분석 도구 (8종) 펼치기
            </summary>
            <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
              {renderToolButton(props.onOpenDividendCalendarModal, "📅", "월별 배당 캘린더 & 인출 스케줄러", RUNWAY_DEEP_TONES[0])}
              {renderToolButton(props.onOpenPortfolioBacktestModal, "📊", "은퇴 포트폴리오 10년 백테스트", RUNWAY_DEEP_TONES[1])}
              {renderToolButton(props.onOpenRebalancingOrderModal, "📋", "은퇴 자산 리밸런싱 주문 가이드", RUNWAY_DEEP_TONES[2])}
              {renderToolButton(props.onOpenSurvivorCareModal, "🕊️", "홀로 남은 배우자 생애 케어", RUNWAY_DEEP_TONES[3])}
              {renderToolButton(props.onOpenReverseMortgageModal, "🏠", "주택연금(역모기지) 결합 시뮬레이션", RUNWAY_DEEP_TONES[4])}
              {renderToolButton(props.onOpenStressTestModal, "⚡", "3중 복합 위기 스트레스 테스트", RUNWAY_DEEP_TONES[5])}
              {renderToolButton(props.onOpenCashflowTrackerModal, "💳", "실전 은퇴 가계부 & 런웨이 트래커", RUNWAY_DEEP_TONES[6])}
              {renderToolButton(props.onOpenSavingsPlanModal, "🎯", "부족액 역산 적립 플랜", RUNWAY_DEEP_TONES[7])}
            </div>
          </details>
        </div>
      </details>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. 시나리오 비교 & 종합 진단 (Agent 4 연계 도구) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <details open style={styles.group}>
        <summary style={styles.summary}>
          <span>🎯</span> 시나리오 비교 & 종합 진단
        </summary>
        <div style={{ marginTop: "6px" }}>
          {renderToolButton(props.onOpenScenarioComparisonModal, "📊", "복수 은퇴 시나리오 비교함 (A vs B vs C)", SCENARIO_TOOL_TONES[0])}
          {renderToolButton(props.onOpenRetirementRoadmapModal, "🧭", "은퇴 생애 D-Day 로드맵 & 체크리스트", SCENARIO_TOOL_TONES[1])}
          {renderToolButton(props.onOpenInteractiveAdvisorModal, "🤖", "1:1 대화형 AI 인터랙티브 은퇴 상담", SCENARIO_TOOL_TONES[2])}
        </div>
      </details>
    </aside>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  rail: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "8px 4px",
  },
  railButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "var(--text-accent)",
    cursor: "pointer",
    fontWeight: 700,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  railText: { writingMode: "vertical-rl", fontSize: "0.8rem", letterSpacing: "0.1em" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  headerTitle: { fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" },
  collapseButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    fontSize: "0.72rem",
    padding: "3px 6px",
    cursor: "pointer",
  },
  group: { borderTop: "1px solid var(--border)", paddingTop: "8px" },
  summary: {
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.82rem",
    color: "var(--text-accent)",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  field: { display: "flex", flexDirection: "column", gap: "3px", marginBottom: "8px" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "0.76rem", fontWeight: 600, color: "var(--text-primary)" },
  hint: { fontSize: "0.68rem", fontWeight: 400, color: "var(--text-muted)" },
  value: { fontSize: "0.76rem", fontWeight: 700, color: "var(--primary)" },
  range: { width: "100%", cursor: "pointer", accentColor: "var(--primary)" },
  input: { fontSize: "0.78rem", padding: "5px 8px" },
  note: { fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.45, margin: "0 0 4px" },
  account: { borderBottom: "1px dashed var(--border)", paddingBottom: "6px", marginBottom: "6px" },
  accountName: { fontSize: "0.74rem", fontWeight: 600, color: "var(--text-secondary)" },
  checkbox: { display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "var(--text-secondary)", cursor: "pointer" },
};
