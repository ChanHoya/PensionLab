"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  DefaultLegendContent,
} from "recharts";
import type { CoupleSimulationResult, CoupleYear, PersonYear } from "@/services/coupleSimulation";
import ChartTooltip from "@/components/ChartTooltip";
import { downloadElementAsPdf } from "@/utils/exportPdf";
import { exportCoupleSimulationCsv } from "@/utils/exportCsv";
import type { PaidTotals } from "@/services/paidTotals";
import { PENSION_SERIES, SURVIVOR_FILL, emphasisProps, pensionSeriesValues } from "@/components/pensionSeries";
import { buildSpendingCurve } from "@/services/spendingCurve";
import { usePensionStore } from "@/store/usePensionStore";
import NpsEarlyDeferralModal from "@/components/NpsEarlyDeferralModal";

const fmt = (v: number) => Math.round(v).toLocaleString();
const WHO_LABEL = { SELF: "본인", SPOUSE: "배우자" } as const;

interface Props {
  result: CoupleSimulationResult;
  selfStartAge: number; // 본인 국민연금 개시 나이
  spouseStartAge: number; // 배우자 국민연금 개시 나이 (연기 반영)
  actions?: React.ReactNode; // 툴바 기능 버튼들 (페르소나, BEP, 절세, 건보, 주택, 공백, 유족, ISA)
  backupActions?: React.ReactNode; // 창 제목과 같은 줄 제일 오른쪽 버튼 (백업·복원)
  paid: { self: PaidTotals; spouse: PaidTotals | null }; // 그래프 안 (납부총액/지급총액) 표기용
  onOpenBepModal?: () => void; // 국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 모달 열기 핸들러
  isRealValue?: boolean; // 현재가치(실질 구매력) vs 명목 금액 외부 제어
  onToggleRealValue?: (val: boolean) => void;
}

// x축 눈금: 연도 아래에 본인·배우자 나이 (사망 후에는 -)
// 첫 눈금 왼쪽에는 줄 머리글(본인·배우자)을 붙인다
function YearAgeTick({ x, y, payload, index, rowsByYear }: { x?: number; y?: number; payload?: { value: number }; index?: number; rowsByYear: Map<number, CoupleYear> }) {
  const r = payload ? rowsByYear.get(Number(payload.value)) : undefined;
  const age = (p: PersonYear | null | undefined) => (p && p.alive ? `${p.age}세` : "-");
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="var(--text-muted)" fontSize={11}>
        <tspan x={0} dy={12}>{payload?.value}</tspan>
        {r && <tspan x={0} dy={13}>{age(r.self)}</tspan>}
        {r?.spouse && <tspan x={0} dy={13}>{age(r.spouse)}</tspan>}
      </text>
      {index === 0 && r && (
        <text textAnchor="end" fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
          <tspan x={-26} dy={25}>본인</tspan>
          {r.spouse && <tspan x={-26} dy={13}>배우자</tspan>}
        </text>
      )}
    </g>
  );
}

export default function CoupleSimulationSection({
  result,
  selfStartAge,
  spouseStartAge,
  actions,
  backupActions,
  paid,
  onOpenBepModal,
  isRealValue: propIsRealValue,
  onToggleRealValue,
}: Props) {
  const simulationParams = usePensionStore((s) => s.simulationParams);
  const [internalRealValue, setInternalRealValue] = useState(true); // 기본값: 현재가치 (실질 구매력)
  const isRealValue = propIsRealValue !== undefined ? propIsRealValue : internalRealValue;
  const setIsRealValue = onToggleRealValue ?? setInternalRealValue;
  const [localBepOpen, setLocalBepOpen] = useState(false);
  const handleOpenBep = () => {
    if (onOpenBepModal) onOpenBepModal();
    else setLocalBepOpen(true);
  };
  const { rows, firstDeath, lifetime, survivorInfo: si } = result;
  const survivorLabel = si ? WHO_LABEL[si.deceased === "SELF" ? "SPOUSE" : "SELF"] : "";
  const cardRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [tableOpen, setTableOpen] = useState(true); // 연도별 요약 표 접기
  const [highlight, setHighlight] = useState<string | null>(null); // 범례로 고른 계열 (그래프 다른 곳을 누르면 해제)
  const handlePdf = async () => {
    if (!cardRef.current) return;
    setPdfBusy(true);
    try {
      await downloadElementAsPdf(cardRef.current, `부부통합_연금시뮬레이션_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setPdfBusy(false);
    }
  };
  const hasSpouse = rows.some((r) => r.spouse);
  const sm = result.smoothing;
  const potGap = sm ? sm.pot - sm.requiredPot : 0;
  const bothReceiving = rows.find(
    (r) => r.spouse && r.self.alive && r.spouse.alive && r.self.age >= selfStartAge && r.spouse.age >= spouseStartAge
  );
  const deathIndex = firstDeath ? rows.findIndex((r) => r.year === firstDeath.year) : -1;
  const beforeDeath = deathIndex > 0 ? rows[deathIndex - 1] : null;
  const afterDeath = deathIndex >= 0 ? rows[deathIndex] : null;
  const survivor = afterDeath ? (afterDeath.self.alive ? afterDeath.self : afterDeath.spouse) : null;

  const rowsByYear = new Map(rows.map((r) => [r.year, r]));

  const infl = simulationParams.inflationRate || 3;
  const curve = buildSpendingCurve(simulationParams, rows[0]?.year, rows.length);

  const chartData: Record<string, number>[] = rows.map((r, t) => {
    const divisor = isRealValue ? Math.pow(1 + infl / 100, t) : 1;
    const pt = curve.get(r.year);
    const targetReal = pt ? pt.targetReal : (simulationParams.targetMonthlySpending || 300);
    const minReal = pt ? pt.minReal : (simulationParams.minMonthlySpending || 200);
    const targetSpending = isRealValue ? targetReal : Math.round(targetReal * Math.pow(1 + infl / 100, t));
    const minSpending = isRealValue ? minReal : Math.round(minReal * Math.pow(1 + infl / 100, t));
    return {
      year: r.year,
      targetSpending,
      minSpending,
      ...pensionSeriesValues(r, divisor),
    };
  });

  // 금액이 있는 계열만 그래프·범례에 표시. 유족연금은 받는 사람 기준 이름 (예: 배우자 유족연금)
  const survivorName = `${survivorLabel || "배우자"} 유족연금`;
  const visibleSeries = PENSION_SERIES.filter((s) => chartData.some((d) => d[s.key] !== 0));
  const legendColors: Record<string, string> = {
    [survivorName]: SURVIVOR_FILL,
    맞춤지출목표선: "#e11d48",
    최저생활비선: "#d97706",
  };
  // 툴팁의 (납부총액/지급총액): 납부가 없는 유족·기초연금은 「-」, 지급은 그래프 기간 명목 수령 합계
  const paidOf: Record<string, number | null> = {
    본인국민연금: paid.self.national,
    유족연금: null,
    배우자국민연금: paid.spouse?.national ?? null,
    "본인 기초연금": null,
    "배우자 기초연금": null,
    "본인 퇴직연금": paid.self.retirement,
    "배우자 퇴직연금": paid.spouse?.retirement ?? null,
    "본인 개인연금": paid.self.personal + paid.self.insurance,
    "배우자 개인연금": paid.spouse ? paid.spouse.personal + paid.spouse.insurance : null,
  };
  const totalNotes = Object.fromEntries(
    visibleSeries.map((s) => {
      const payout = chartData.reduce((sum, d) => sum + d[s.key] * 12, 0);
      const paidAmount = paidOf[s.key];
      const name = s.key === "유족연금" ? survivorName : s.key;
      return [name, `(${paidAmount ? `${fmt(paidAmount)}만원` : "-"}/${fmt(payout)}만원)`];
    })
  );

  type CriteriaTab = "SURVIVOR" | "NATIONAL" | "RETIREMENT_PRIVATE" | "SMOOTHING";
  const [activeCriteriaTab, setActiveCriteriaTab] = useState<CriteriaTab | null>(null);

  // 표 보기 옵션 필터 (S31-4)
  type TableFilterMode = "5YEARS" | "EVENTS" | "ALL";
  const [tableFilter, setTableFilter] = useState<TableFilterMode>("5YEARS");

  // 주요 이벤트 마일스톤 판별
  const isKeyMilestone = (r: CoupleYear, i: number) => {
    if (i === 0 || i === rows.length - 1) return true;
    if (r.self.age === (simulationParams.retirementAge || 60)) return true;
    if (r.self.age === selfStartAge) return true;
    if (r.spouse && r.spouse.age === spouseStartAge) return true;
    if (r.self.age === 65 || (r.spouse && r.spouse.age === 65)) return true;
    if (r.self.age === 70 || r.self.age === 80) return true;
    if (i === deathIndex || i === deathIndex - 1) return true;
    return false;
  };

  const filteredRows = useMemo(() => {
    if (tableFilter === "ALL") return rows;
    if (tableFilter === "EVENTS") return rows.filter(isKeyMilestone);
    // 5YEARS: 5년 간격 + 사망 전후 해 + 마지막 해
    return rows.filter(
      (r, i) => i % 5 === 0 || i === deathIndex || i === deathIndex - 1 || i === rows.length - 1
    );
  }, [rows, tableFilter, deathIndex, simulationParams, selfStartAge, spouseStartAge]);

  const remark = (r: CoupleYear, i: number) => {
    const notes: string[] = [];
    if (i === 0) notes.push("현재");
    if (r.self.age === (simulationParams.retirementAge || 60)) notes.push("은퇴");
    if (r.self.age === selfStartAge) notes.push("국민연금개시");
    if (r.spouse && r.spouse.age === spouseStartAge) notes.push("배우자국민개시");
    if (r.self.age === 65) notes.push("기초연금개시");
    if (r.self.age === 70) notes.push("70세");
    if (!r.self.alive) notes.push("본인 사망");
    if (r.spouse && !r.spouse.alive) notes.push("배우자 사망");
    const choice = r.self.survivorChoice ?? r.spouse?.survivorChoice;
    if (choice === "SURVIVOR") notes.push("유족연금 선택");
    if (choice === "OWN_PLUS_30") notes.push("본인연금+유족 30%");
    return notes.join(", ");
  };

  const handleExportCsv = () => {
    exportCoupleSimulationCsv(rows, {
      isRealValue,
      inflationRate: infl,
      hasSpouse,
      remarksMap: (r) => remark(r, rows.indexOf(r)),
    });
  };

  // 은퇴 후 평균 월 수령액 및 생애 총 수령액 지표 계산 (현재가치/명목 토글 실시간 반영)
  const retiredRows = rows.filter((r) => r.self.age >= (simulationParams.retirementAge || 60));
  const targetRows = retiredRows.length > 0 ? retiredRows : rows;

  const avgMonthlyPension = Math.round(
    targetRows.reduce((sum, r) => {
      const t = rows.indexOf(r);
      const div = isRealValue ? Math.pow(1 + infl / 100, t) : 1;
      return sum + r.household / div;
    }, 0) / (targetRows.length || 1)
  );

  const totalLifetimePension = Math.round(
    rows.reduce((sum, r, t) => {
      const div = isRealValue ? Math.pow(1 + infl / 100, t) : 1;
      return sum + (r.household / div) * 12;
    }, 0)
  );

  const lifetimeSelf = Math.round(
    rows.reduce((sum, r, t) => {
      const div = isRealValue ? Math.pow(1 + infl / 100, t) : 1;
      return sum + (r.self.total / div) * 12;
    }, 0)
  );

  const lifetimeSpouse = Math.round(
    rows.reduce((sum, r, t) => {
      const div = isRealValue ? Math.pow(1 + infl / 100, t) : 1;
      return sum + ((r.spouse?.total ?? 0) / div) * 12;
    }, 0)
  );

  const bothReceivingMonthly = bothReceiving
    ? Math.round(bothReceiving.household / (isRealValue ? Math.pow(1 + infl / 100, rows.indexOf(bothReceiving)) : 1))
    : 0;

  const beforeDeathHousehold = beforeDeath
    ? Math.round(beforeDeath.household / (isRealValue ? Math.pow(1 + infl / 100, rows.indexOf(beforeDeath)) : 1))
    : 0;

  const afterDeathHousehold = afterDeath
    ? Math.round(afterDeath.household / (isRealValue ? Math.pow(1 + infl / 100, rows.indexOf(afterDeath)) : 1))
    : 0;

  const lateRows = rows.slice(-5);
  const lateMonthlyPension = Math.round(
    lateRows.reduce((sum, r) => {
      const t = rows.indexOf(r);
      const div = isRealValue ? Math.pow(1 + infl / 100, t) : 1;
      return sum + r.household / div;
    }, 0) / (lateRows.length || 1)
  );

  return (
    <div ref={cardRef} style={styles.card}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={styles.title}>{hasSpouse ? "👫 부부 통합 연금 시뮬레이션" : "📈 연금 통합 시뮬레이션"}</h3>
          {/* 현재가치(실질) vs 명목금액 기준 토글 */}
          <div data-html2canvas-ignore style={styles.toggleGroup}>
            <button
              type="button"
              onClick={() => setIsRealValue(true)}
              style={isRealValue ? styles.toggleBtnActive : styles.toggleBtn}
            >
              현재가치(실질 구매력)
            </button>
            <button
              type="button"
              onClick={() => setIsRealValue(false)}
              style={!isRealValue ? styles.toggleBtnActive : styles.toggleBtn}
            >
              명목 금액
            </button>
          </div>
        </div>
        {/* 창 제목과 같은 줄 제일 오른쪽에 배치되는 PDF 다운로드, 백업, 복원 버튼 */}
        <div data-html2canvas-ignore style={styles.headerActions}>
          <button type="button" onClick={handlePdf} disabled={pdfBusy} className="premium-button-secondary" style={styles.pdfButton}>
            {pdfBusy ? "PDF 생성 중..." : "📄 PDF 다운로드"}
          </button>
          {backupActions}
        </div>
      </div>

      {/* 대시보드 퀵 기능 액션 툴바 (페르소나, BEP, 절세, 건보료, 주택연금, 공백기, 유족, ISA) */}
      {actions && (
        <div data-html2canvas-ignore style={{ marginTop: "-2px", marginBottom: "2px" }}>
          {actions}
        </div>
      )}

      {/* 부제목 및 국민연금 조기 vs 정상 vs 연기 손익분기(BEP) 버튼 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "4px",
          marginBottom: "10px",
        }}
      >
        <div style={styles.subtitle}>
          {hasSpouse
            ? "부부의 공적·사적연금을 통합 합산한 생애 현금흐름입니다."
            : "공적·사적연금을 통합 합산한 생애 현금흐름입니다."}{" "}
          ({isRealValue ? "실질 구매력 기준" : "명목 금액 기준"} · 🔴 목표 지출선, 🟡 최저 생활비선)
        </div>
        <button
          type="button"
          onClick={handleOpenBep}
          className="premium-button-secondary"
          style={{
            fontSize: "0.75rem",
            padding: "6px 12px",
            fontWeight: 700,
            borderColor: "rgba(249, 115, 22, 0.4)",
            color: "#f97316",
            background: "rgba(249, 115, 22, 0.08)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          title="국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 인터랙티브 비교기 열기"
        >
          <span>⚖️ 조기 vs 정상 vs 연기 손익분기(BEP)</span>
          <span style={{ fontSize: "0.75rem", color: "#f97316" }}>⚡</span>
        </button>
      </div>

      {/* 01 시뮬레이션 핵심 지표 KPI 카드 */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>은퇴 후 가구 평균 월 연금액</div>
          <div style={styles.kpiValue}>월 {fmt(avgMonthlyPension)}만원</div>
          <div style={styles.kpiHint}>
            {simulationParams.retirementAge || 60}세 은퇴 후 {isRealValue ? "실질 구매력 평균" : "명목 수령 평균"}
          </div>
        </div>

        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>생애 총 수령 연금액 (가구)</div>
          <div style={styles.kpiValue}>
            {fmt(totalLifetimePension)}만원
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginLeft: 6 }}>
              (약 {(totalLifetimePension / 10000).toFixed(1)}억원)
            </span>
          </div>
          <div style={styles.kpiHint}>
            본인 {fmt(lifetimeSelf)}만원{hasSpouse ? ` · 배우자 ${fmt(lifetimeSpouse)}만원` : ""}
          </div>
        </div>

        {hasSpouse && beforeDeath && afterDeath ? (
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>첫 사망 전 → 후 가구 월 연금</div>
            <div style={styles.kpiValue}>
              {fmt(beforeDeathHousehold)} → {fmt(afterDeathHousehold)}만원
            </div>
            <div style={styles.kpiHint}>
              {firstDeath ? `${WHO_LABEL[firstDeath.who]} 기대수명 이후 (${firstDeath.year}년)` : "유족연금 전환"}
            </div>
          </div>
        ) : (
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>말년 5년 평균 월 연금액</div>
            <div style={styles.kpiValue}>월 {fmt(lateMonthlyPension)}만원</div>
            <div style={styles.kpiHint}>생애 마지막 5년 평균 수령액</div>
          </div>
        )}

        {hasSpouse && bothReceiving ? (
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>부부 모두 수령 시 가구 월 연금</div>
            <div style={styles.kpiValue}>월 {fmt(bothReceivingMonthly)}만원</div>
            <div style={styles.kpiHint}>
              {bothReceiving.year}년 (본인 {bothReceiving.self.age}세 / 배우자 {bothReceiving.spouse!.age}세)
            </div>
          </div>
        ) : (
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>국민연금 개시 시 월 연금</div>
            <div style={styles.kpiValue}>
              월 {fmt(rows.find((r) => r.self.national > 0)?.self.national ?? 0)}만원
            </div>
            <div style={styles.kpiHint}>{selfStartAge}세 국민연금 최초 개시</div>
          </div>
        )}
      </div>

      {/* 02 산정기준 4개 가로 배치 탭 바 & 드롭다운 */}
      <div style={styles.criteriaContainer}>
        <div style={styles.criteriaBar}>
          {hasSpouse && si && (
            <button
              type="button"
              onClick={() => setActiveCriteriaTab((cur) => (cur === "SURVIVOR" ? null : "SURVIVOR"))}
              style={activeCriteriaTab === "SURVIVOR" ? styles.criteriaTabBtnActive : styles.criteriaTabBtn}
            >
              <span>유족연금 산정 기준</span>
              <span style={styles.criteriaArrow}>{activeCriteriaTab === "SURVIVOR" ? "▲" : "▼"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveCriteriaTab((cur) => (cur === "NATIONAL" ? null : "NATIONAL"))}
            style={activeCriteriaTab === "NATIONAL" ? styles.criteriaTabBtnActive : styles.criteriaTabBtn}
          >
            <span>국민연금 적립·인상 기준</span>
            <span style={styles.criteriaArrow}>{activeCriteriaTab === "NATIONAL" ? "▲" : "▼"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCriteriaTab((cur) => (cur === "RETIREMENT_PRIVATE" ? null : "RETIREMENT_PRIVATE"))}
            style={activeCriteriaTab === "RETIREMENT_PRIVATE" ? styles.criteriaTabBtnActive : styles.criteriaTabBtn}
          >
            <span>퇴직·개인연금 적립 기준</span>
            <span style={styles.criteriaArrow}>{activeCriteriaTab === "RETIREMENT_PRIVATE" ? "▲" : "▼"}</span>
          </button>

          {sm && (
            <button
              type="button"
              onClick={() => setActiveCriteriaTab((cur) => (cur === "SMOOTHING" ? null : "SMOOTHING"))}
              style={activeCriteriaTab === "SMOOTHING" ? styles.criteriaTabBtnActive : styles.criteriaTabBtn}
            >
              <span>소득 평탄화 & 인출 상세</span>
              <span style={styles.criteriaArrow}>{activeCriteriaTab === "SMOOTHING" ? "▲" : "▼"}</span>
            </button>
          )}
        </div>

        {/* 선택된 기준의 드롭다운 상세 내용 */}
        {activeCriteriaTab && (
          <div style={styles.criteriaDropdownContent}>
            <div style={styles.criteriaDropdownHeader}>
              <span style={styles.criteriaDropdownTitle}>
                {activeCriteriaTab === "SURVIVOR" && "📋 유족연금 산정 기준과 계산"}
                {activeCriteriaTab === "NATIONAL" && "📜 국민연금 적립·인상 산정 기준 (물가연동)"}
                {activeCriteriaTab === "RETIREMENT_PRIVATE" && "💰 퇴직·개인연금 적립금 산정 기준 (운용수익 복리)"}
                {activeCriteriaTab === "SMOOTHING" && "📏 가구 소득 평탄화 & 지출 곡선 인출 상세"}
              </span>
              <button
                type="button"
                onClick={() => setActiveCriteriaTab(null)}
                style={styles.criteriaDropdownClose}
                title="접기"
              >
                ✕ 닫기
              </button>
            </div>

            {activeCriteriaTab === "SURVIVOR" && hasSpouse && si && (
              <div>
                {survivor && survivor.survivorChoice && firstDeath && (
                  <p style={styles.detailHighlight}>
                    💡 이 시뮬레이션에서는 <strong>{WHO_LABEL[firstDeath.who]}</strong> 사망 후 남은 배우자가{" "}
                    <strong>
                      {survivor.survivorChoice === "SURVIVOR"
                        ? `유족연금(${WHO_LABEL[firstDeath.who === "SELF" ? "SPOUSE" : "SELF"]} 노령연금은 지급정지)`
                        : `${WHO_LABEL[firstDeath.who === "SELF" ? "SPOUSE" : "SELF"]} 노령연금 + 유족연금 30%`}
                    </strong>
                    을 선택해 국민연금 월 <strong>{fmt(survivor.national)}만원</strong>을 수령하는 것이 유리합니다. (사망자의 퇴직·개인연금 잔액 상속은 미반영)
                  </p>
                )}
                <table style={{ ...styles.table, marginTop: "8px", maxWidth: "420px" }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>사망자 가입기간</th>
                      <th style={styles.th}>유족연금 (기본연금액 대비)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "10년 미만", rate: 0.4 },
                      { label: "10년 이상 ~ 20년 미만", rate: 0.5 },
                      { label: "20년 이상", rate: 0.6 },
                    ].map((row) => (
                      <tr key={row.label} style={row.rate === si.rate ? styles.bestRow : undefined}>
                        <td style={styles.td}>{row.label}</td>
                        <td style={styles.td}>{row.rate * 100}%{row.rate === si.rate && " ← 적용"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={styles.detailText}>
                  <strong>{WHO_LABEL[si.deceased]}</strong> 가입 {si.months}개월(약 {Math.floor(si.months / 12)}년) → 지급률 {si.rate * 100}%.{" "}
                  {si.year}년 기본연금액 {fmt(si.basePension)}만원 × {si.rate * 100}% = 유족연금 <strong>{fmt(si.fullSurvivor)}만원</strong>
                </p>
                <p style={styles.detailText}>
                  중복급여 조정(국민연금법 제56조) — 둘 중 큰 쪽을 자동 선택:
                  <br />
                  {si.choice === "SURVIVOR" ? "✅" : "▫️"} ① 유족연금 전액 <strong>{fmt(si.fullSurvivor)}만원</strong> ({survivorLabel} 노령연금은 지급정지)
                  <br />
                  {si.choice === "OWN_PLUS_30" ? "✅" : "▫️"} ② {survivorLabel} 노령연금 {fmt(si.ownPension)}만원 + 유족연금 30% {fmt(si.fullSurvivor * 0.3)}만원 ={" "}
                  <strong>{fmt(si.ownPlus30)}만원</strong>
                </p>
                <p style={styles.note}>
                  ※ 기본연금액은 연기 가산(연 7.2%)·조기수령 감액 전 금액입니다. 노령연금 수급자가 사망하면 유족연금은 받던 노령연금액을 넘을 수
                  없습니다. 부양가족연금액은 제외된 추정치이며, 정확한 금액은 국민연금공단(☎1355)에서 확인하세요.
                </p>
              </div>
            )}

            {activeCriteriaTab === "NATIONAL" && (
              <div>
                <p style={styles.detailText}>
                  <strong>📜 법적 근거 (국민연금법 제51조)</strong>: 국민연금은 수급권을 취득한 이후 매년 전년도 전국소비자물가변동률(CPI)에 맞추어 연금액을 인상·조정하도록 법률로 의무화되어 있습니다.
                </p>
                <p style={styles.detailText}>
                  <strong>📈 연복리 3% 물가 연동 인상</strong>: 최근 30년 대한민국 소비자물가 평균 상승률(약 2.7%)을 감안해 기본 가정치인 연 <strong>{infl}%</strong>를 적용하며, 수령 시작 연령부터 매년 <code>(1 + 물가상승률)^t</code>로 연복리 증액됩니다.
                </p>
                <p style={styles.detailText}>
                  <strong>⚖️ 현재가치(실질) vs 명목금액 비교 원리</strong>:
                  <br />
                  • <strong>명목 금액</strong>: 매년 3% 복리로 증액되어 통장에 찍히는 명목 수령액이 점점 늘어납니다.
                  <br />
                  • <strong>현재가치 (실질 구매력)</strong>: 물가상승률로 매년 역으로 할인(<code>÷ (1 + 물가상승률)^t</code>)하므로, 미래에도 <strong>현재 시점과 동일한 구매력(수평선)</strong>으로 표시되어 생활비선과 왜곡 없이 직관적으로 비교할 수 있습니다.
                </p>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleOpenBep}
                    className="premium-button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.82rem",
                      padding: "8px 16px",
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      border: "none",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <span>⚖️ 국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 인터랙티브 비교기 열기</span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>→ 골든 크로스오버 나이 분석</span>
                  </button>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    * 조기(-30%) vs 정상(100%) vs 연기(+36%)의 생애 누적액 역전 시점을 인터랙티브하게 비교합니다.
                  </span>
                </div>
              </div>
            )}

            {activeCriteriaTab === "RETIREMENT_PRIVATE" && (
              <div>
                <p style={styles.detailText}>
                  <strong>💰 인출 후 잔여 적립금의 연복리 운용수익 반영</strong>: 은퇴 후 시기별로 생활비를 인출하고 남은 잔여 적립금(잔액)에 대해 매년 연도 말마다 자산별 기대수익률이 <strong>연복리로 가산 증식</strong>됩니다.
                  <br />
                  • <strong>퇴직연금 (DC/IRP)</strong>: 입력된 기대수익률 (기본 연 3.0%)
                  <br />
                  • <strong>개인연금저축 (펀드)</strong>: 기본 연 4.5% / <strong>신탁·보험</strong>: 기본 연 2.5~3.0%
                </p>
                <p style={styles.detailText}>
                  <strong>📑 세제 재원 동기화 및 절세 혜택</strong>: 잔여 적립금에 가산되는 운용수익은 퇴직연금의 경우 <strong>이연퇴직소득</strong>(10년 초과 수령 시 40% 감면), 개인연금은 <strong>과세대상 연금소득원</strong>(3.3~5.5% 저율과세)으로 자동 분류되어 절세 효과와 건보료 산정이 정밀 연동됩니다.
                </p>
                <p style={styles.detailText}>
                  <strong>🎯 수령 기간 최적 분할 역산</strong>: 부부 가구 평탄화 알고리즘은 실질 할인율 3.0%를 전제하여 잔여 자산이 이자로 불어나는 효과를 반영하고, 90~100세까지 완만하게 소진되도록 최적 인출 경로를 산출합니다.
                </p>
              </div>
            )}

            {activeCriteriaTab === "SMOOTHING" && sm && (
              <div>
                {sm.pot > 0 ? (
                  <>
                    <p style={styles.detailText}>
                      📏 <strong>가구 소득 평탄화 경로</strong>: {sm.startYear}년 가구 월 <strong>{fmt(sm.levelMonthly)}만원</strong>
                      (현재가치 {fmt(sm.levelToday)}만원)에서 시작해 {sm.endYear}년까지 총액이{" "}
                      {sm.annualGrowth > 0 ? (
                        <>매년 <strong>{(sm.annualGrowth * 100).toFixed(1)}%</strong>씩 완만하게 늘어납니다.</>
                      ) : sm.annualGrowth < 0 ? (
                        <>초기 활동기(소비 유지) 이후 매년 <strong>{(-sm.annualGrowth * 100).toFixed(1)}%</strong>씩 완만하게 체감합니다(활동기 집중형).</>
                      ) : (
                        <>균등 정액 수준으로 유지됩니다.</>
                      )}
                    </p>
                    <p style={styles.detailText}>
                      국민연금이 시작·증가하는 만큼 퇴직·개인연금을 해마다 줄여 {sm.endYear}년까지 나눠 쓰므로 국민연금 개시 때 총액이 튀지 않고 상품 만기 때 끊기지 않습니다.
                    </p>
                    <p style={styles.detailText}>
                      💰 <strong>사적연금 적립금({sm.startYear}년 가치)</strong>: 보유 <strong>{fmt(sm.pot)}만원</strong> · 희망 월 생활비{" "}
                      {fmt(sm.targetToday)}만원(현재가치)으로 시작하는 데 필요 <strong>{fmt(sm.requiredPot)}만원</strong> →{" "}
                      <strong style={{ color: potGap >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {potGap >= 0 ? `여유 ${fmt(potGap)}만원` : `부족 ${fmt(-potGap)}만원`}
                      </strong>
                    </p>
                  </>
                ) : (
                  <p style={styles.detailText}>퇴직·개인연금·연금보험 입력이 없어 채울 사적연금이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 360 }} onClick={() => setHighlight(null)}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 24, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" stroke="var(--text-muted)" tick={<YearAgeTick rowsByYear={rowsByYear} />} height={52} />
            <YAxis tickFormatter={(v) => fmt(Number(v))} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip content={<ChartTooltip labelSuffix="년" hideZero showTotal unit="만원/월" colors={legendColors} notes={totalNotes} />} />
            <Legend
              wrapperStyle={{ fontSize: "0.72rem" }}
              iconSize={10}
              itemSorter={null}
              content={(props) => (
                <DefaultLegendContent
                  {...props}
                  payload={props.payload?.map((item) => ({ ...item, color: legendColors[String(item.value)] ?? item.color }))}
                  onClick={(item, _i, e) => {
                    e.stopPropagation();
                    const k = String(item.dataKey);
                    setHighlight((h) => (h === k ? null : k));
                  }}
                />
              )}
            />
            {visibleSeries.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.key === "유족연금" ? survivorName : s.key}
                stackId="1"
                stroke={s.color}
                fill={s.fill ?? s.color}
                {...emphasisProps(highlight, s.key, s.fill ? 0.55 : 0.5)}
              />
            ))}
            <Line
              type="monotone"
              dataKey="targetSpending"
              name={(simulationParams.annualMedicalExpense || 0) > 0 ? "맞춤 지출 목표선(의료비 포함)" : "맞춤 지출 목표선"}
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="minSpending"
              name="최저 생활비선"
              stroke="#d97706"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            {firstDeath && (
              <ReferenceLine
                x={firstDeath.year}
                stroke="var(--text-muted)"
                strokeDasharray="6 4"
                label={{ value: `${WHO_LABEL[firstDeath.who]} 기대수명`, position: "top", fill: "var(--text-muted)", fontSize: 12 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={styles.tableTitle}>
            연도별 연금 요약 표 ({isRealValue ? "현재가치 실질" : "명목금액"})
          </span>
          {/* S31-4: 보기 옵션 필터 세그먼트 */}
          <div style={styles.toggleGroup} data-html2canvas-ignore>
            <button
              type="button"
              onClick={() => setTableFilter("5YEARS")}
              style={tableFilter === "5YEARS" ? styles.toggleBtnActive : styles.toggleBtn}
            >
              5년 간격 요약
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("EVENTS")}
              style={tableFilter === "EVENTS" ? styles.toggleBtnActive : styles.toggleBtn}
            >
              주요 마일스톤
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("ALL")}
              style={tableFilter === "ALL" ? styles.toggleBtnActive : styles.toggleBtn}
            >
              전체 (1년 단위)
            </button>
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            ({filteredRows.length}개 연도)
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }} data-html2canvas-ignore>
          <button
            type="button"
            onClick={handleExportCsv}
            className="premium-button-secondary"
            style={{ fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700 }}
            title="엑셀(Excel)에서 바로 열 수 있는 한글 CSV 파일로 다운로드합니다"
          >
            📥 엑셀(CSV) 다운로드
          </button>
          <button
            type="button"
            onClick={() => setTableOpen((v) => !v)}
            className="premium-button-secondary"
            style={styles.pdfButton}
          >
            {tableOpen ? "▲ 접기" : "▼ 펼치기"}
          </button>
        </div>
      </div>
      {tableOpen && (
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>연도</th>
              <th style={styles.th}>본인 나이</th>
              <th style={styles.th}>배우자 나이</th>
              <th style={styles.th}>본인 합계</th>
              <th style={styles.th}>배우자 합계</th>
              <th style={styles.th}>가구 합계</th>
              <th style={styles.th}>비고</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => {
              const i = rows.indexOf(r);
              const noteText = remark(r, i);
              const isEventRow = isKeyMilestone(r, i);

              return (
                <tr
                  key={r.year}
                  style={
                    isEventRow && tableFilter === "ALL"
                      ? { backgroundColor: "rgba(99, 102, 241, 0.04)" }
                      : undefined
                  }
                >
                  <td style={styles.td}>{r.year}</td>
                  <td style={styles.td}>{r.self.age}세</td>
                  <td style={styles.td}>{r.spouse ? `${r.spouse.age}세` : "-"}</td>
                  <td style={styles.td}>{fmt(r.self.total)}</td>
                  <td style={styles.td}>{r.spouse ? fmt(r.spouse.total) : "-"}</td>
                  <td style={styles.td}><strong>{fmt(r.household)}</strong></td>
                  <td style={styles.td}>
                    {noteText ? (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(99, 102, 241, 0.15)",
                          color: "var(--text-accent)",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        {noteText}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      <p style={styles.note}>
        ※ 각자의 기대수명까지 생존한다고 가정합니다. 기초연금은 해마다 가구 소득인정액으로 다시 판정합니다
        (한 사람만 65세 이상이면 감액 없음, 둘 다 받으면 각 20% 감액, 사망 후 단독가구 기준).
        배우자 유족연금의 50세 미만 지급정지·재혼 등 예외는 반영하지 않았습니다.
      </p>
      <p style={styles.note}>
        ※ 그래프 툴팁의 (납부총액/지급총액): 납부는 국민연금 예상 납부보험료 총액, 퇴직·개인연금은 현재 적립금 + 은퇴까지 낼 납입액(DB형은 예상
        퇴직금)이고, 지급은 그래프 기간의 명목 수령액 합계입니다. 유족·기초연금은 납부가 없어 「-」로 표시합니다.
      </p>
      <p style={styles.note}>※ 추정치입니다. 정확한 금액은 국민연금공단(☎1355)·복지로에서 확인하세요.</p>

      {/* S31-3: 국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 인터랙티브 비교 모달 */}
      <NpsEarlyDeferralModal isOpen={localBepOpen} onClose={() => setLocalBepOpen(false)} />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  headerActions: { display: "flex", gap: "6px", flexWrap: "wrap" },
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
  pdfButton: { fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700 },
  title: { fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }, // 인출전략 시나리오 비교 제목과 같은 크기
  tableTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" },
  subtitle: { fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px", marginTop: "4px" },
  kpi: { border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 6px)", padding: "12px 14px", backgroundColor: "var(--background, rgba(255,255,255,0.02))" },
  kpiLabel: { fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 500 },
  kpiValue: { fontSize: "1.2rem", fontWeight: 800, color: "var(--text-accent, #6366f1)", marginTop: "4px" },
  kpiHint: { fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "3px" },
  criteriaContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "4px",
    marginBottom: "4px",
  },
  criteriaBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "8px",
  },
  criteriaTabBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm, 6px)",
    border: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.02)",
    color: "var(--text-secondary)",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  criteriaTabBtnActive: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm, 6px)",
    border: "1px solid var(--primary, #6366f1)",
    background: "rgba(99, 102, 241, 0.12)",
    color: "var(--text-primary)",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 0 0 1px rgba(99, 102, 241, 0.3)",
  },
  criteriaArrow: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    marginLeft: "4px",
  },
  criteriaDropdownContent: {
    padding: "14px 16px",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm, 6px)",
  },
  criteriaDropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    paddingBottom: "6px",
    borderBottom: "1px solid var(--border)",
  },
  criteriaDropdownTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  criteriaDropdownClose: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "0.78rem",
    cursor: "pointer",
    padding: "2px 6px",
  },
  detailHighlight: {
    fontSize: "0.82rem",
    color: "var(--text-primary)",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    padding: "6px 10px",
    borderRadius: "4px",
    lineHeight: 1.6,
    margin: "4px 0 8px",
  },
  details: { marginTop: "10px" },
  summary: { cursor: "pointer", fontWeight: 600, color: "var(--text-accent)", fontSize: "0.82rem" },
  detailText: { fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "8px 0 0" },
  bestRow: { backgroundColor: "rgba(16, 185, 129, 0.08)", fontWeight: 600 },
  infoAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: "var(--text-secondary)" },
  th: { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" },
  td: { padding: "6px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 },
};
