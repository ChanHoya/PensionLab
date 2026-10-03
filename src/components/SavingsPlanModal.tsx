"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { usePensionStore, pensionsOf, type PersonData } from "@/store/usePensionStore";
import { buildHouseholdReport } from "@/services/householdReport";
import { annualTaxCredit, requiredMonthly, runSavingsPlan, PENSION_CREDIT_LIMIT, type SavingsPlanInput } from "@/services/savingsPlan";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SCENARIOS = [
  { label: "보수", rate: 3 },
  { label: "기준", rate: 5 },
  { label: "낙관", rate: 7 },
];
const fmt = (v: number) => (Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1)}억` : `${Math.round(v).toLocaleString()}만`);
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// 연금저축·IRP 직접 납입 월액 (DC 회사 부담금 제외)
const ownContribution = (d: PersonData) =>
  d.personalPensions.reduce((s, p) => s + (p.monthlyAnnualContribution || 0), 0) +
  d.retirementPensions.filter((r) => r.pensionType === "IRP").reduce((s, r) => s + (r.monthlyContribution || 0), 0);

// 부족액 역산 적립 플랜: AI 진단의 목표 대비 부족액을 메우려면 지금부터 월 얼마를 몇 년 넣고 묵혀야 하는지
export function SavingsPlanModal({ isOpen, onClose }: Props) {
  const store = usePensionStore();
  const params = store.simulationParams;
  const age = params.currentAge;
  const payoutStartDefault = Math.max(age + 1, params.retirementAge);
  const contributeDefault = clamp(payoutStartDefault - age, 1, 10);

  const [monthly, setMonthly] = useState(75);
  const [contributeYears, setContributeYears] = useState(contributeDefault);
  const [holdYears, setHoldYears] = useState(Math.max(0, payoutStartDefault - age - contributeDefault));
  const [payoutYears, setPayoutYears] = useState(Math.max(5, params.expectedLifeExpectancy - payoutStartDefault));
  const [returnRate, setReturnRate] = useState(5);
  const [indexed, setIndexed] = useState(true);
  const [lowIncome, setLowIncome] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // 진단 리포트와 같은 계산으로 은퇴 후 평균 월 부족액(현재가치)과 자녀 지원 미충당분을 구한다
  const gap = useMemo(() => {
    if (!isOpen) return null;
    const r = buildHouseholdReport({ simulationParams: params, basicPension: store.basicPension, self: pensionsOf(store, "SELF"), spouse: store.spouse });
    const retiredYears = r.couple.rows.filter((row) => row.year >= r.retireYear).length || 1;
    return { monthly: r.shortfallPV / (retiredYears * 12), lump: r.childSupport.uncovered, total: r.shortfallPV + r.childSupport.uncovered };
  }, [isOpen, store, params]);

  if (!isOpen || !gap) return null;

  const plan: Omit<SavingsPlanInput, "monthly" | "returnRate"> = {
    contributeYears,
    holdYears,
    payoutYears,
    inflationRate: params.inflationRate || 0,
    indexed,
  };
  const result = runSavingsPlan({ ...plan, monthly, returnRate }, age);
  const need = requiredMonthly(gap.monthly, gap.lump, { ...plan, returnRate }, age);
  const coverage = gap.total > 0 ? Math.min(999, Math.round((monthly / need) * 100)) : null;
  const credit = annualTaxCredit(monthly, lowIncome);

  const checks = [
    {
      label: "국민연금 30년(360개월) 이상 가입",
      ok: store.nationalPension.expectedTotalContributionMonths >= 360 && (!params.hasSpouse || store.spouse.nationalPension.expectedTotalContributionMonths >= 360),
      detail: `본인 ${store.nationalPension.expectedTotalContributionMonths}개월${params.hasSpouse ? ` · 배우자 ${store.spouse.nationalPension.expectedTotalContributionMonths}개월` : ""}`,
    },
    {
      label: "연금저축·IRP 월 75만원(연 900만원) 납입",
      ok: ownContribution(pensionsOf(store, "SELF")) >= 75,
      detail: `본인 월 ${Math.round(ownContribution(pensionsOf(store, "SELF")))}만원${params.hasSpouse ? ` · 배우자 월 ${Math.round(ownContribution(store.spouse))}만원` : ""}`,
    },
    {
      label: "퇴직 전 내 집 마련 (주택연금 재원)",
      ok: (params.propertyTaxBase || 0) > 0 || !!params.useReverseMortgage,
      detail: (params.propertyTaxBase || 0) > 0 || params.useReverseMortgage ? "주택 보유로 입력됨" : "재산세 과세표준·주택연금 입력 없음",
    },
  ];

  const num = (value: number, set: (v: number) => void, min: number, max: number, step: number, label: string, unit: string, hint?: string) => (
    <label style={S.control}>
      <span style={S.controlLabel}>
        {label} <b style={{ color: "#38bdf8" }}>{value}{unit}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} style={S.range} />
      {hint && <span style={S.hint}>{hint}</span>}
    </label>
  );

  return (
    <div role="dialog" aria-modal="true" style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card" style={S.panel}>
        <div style={S.header}>
          <div>
            <h3 style={S.title}>🎯 부족액 역산 적립 플랜</h3>
            <p style={S.subtitle}>
              노후 생활비가 모자라는 만큼을 연금저축·IRP 같은 연금계좌로 미리 쌓으려면 매월 얼마를, 몇 년 넣고 몇 년 묵혀야 하는지 계산합니다. 금액은 물가{" "}
              {params.inflationRate || 0}%를 뺀 현재가치(세전)입니다.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={S.close}>
            ✕
          </button>
        </div>

        <div style={S.kpiRow}>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>진단 부족액 (메울 목표)</div>
            <div style={{ ...S.kpiValue, color: gap.total > 0 ? "#f87171" : "#34d399" }}>
              {gap.total > 0 ? `월 ${Math.round(gap.monthly)}만원${gap.lump > 0 ? ` + ${fmt(gap.lump)}원` : ""}` : "부족 없음"}
            </div>
            <div style={S.kpiSub}>{gap.total > 0 ? `은퇴 후 평균 · 누적 ${fmt(gap.total)}원${gap.lump > 0 ? " (자녀 지원 포함)" : ""}` : "여유 자금을 쌓을 때의 효과만 보여 줍니다"}</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>부족액을 메우는 월 납입액 ({returnRate}%)</div>
            <div style={{ ...S.kpiValue, color: "#fbbf24" }}>{gap.total > 0 ? `월 ${Math.ceil(need)}만원` : "-"}</div>
            <div style={S.kpiSub}>{gap.total > 0 ? `지금 계획 월 ${monthly}만원으로 ${coverage}% 충족` : "부족액이 없습니다"}</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>{Math.round(result.payoutStartAge)}세부터 {payoutYears}년간 월 수령</div>
            <div style={{ ...S.kpiValue, color: "#38bdf8" }}>{result.monthlyPayoutReal.toFixed(1)}만원</div>
            <div style={S.kpiSub}>
              적립금 {fmt(result.potReal)}원 (명목 {fmt(result.potNominal)}원) · 낸 돈 {fmt(result.totalPaid)}원
            </div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>연말정산 세액공제 환급</div>
            <div style={{ ...S.kpiValue, color: "#34d399" }}>연 {credit.toFixed(1)}만원</div>
            <div style={S.kpiSub}>연 {PENSION_CREDIT_LIMIT}만원 한도 · {lowIncome ? "16.5%" : "13.2%"}</div>
          </div>
        </div>

        <div style={{ height: 230, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.path} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="age" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}세`} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => fmt(Number(v))} width={52} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: "0.78rem" }}
                labelFormatter={(v) => `${v}세`}
                formatter={(v) => [`${fmt(Number(v ?? 0))}원 (현재가치)`, "적립금 잔액"]}
              />
              {holdYears > 0 && <ReferenceLine x={age + contributeYears} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "적립 끝", position: "top", fill: "#94a3b8", fontSize: 11 }} />}
              <ReferenceLine x={result.payoutStartAge} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "수령 시작", position: "top", fill: "#f59e0b", fontSize: 11 }} />
              <Area type="monotone" dataKey="real" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={S.controls}>
          {num(monthly, setMonthly, 10, 300, 5, "월 납입액", "만원", "연금저축 50 + IRP 25 = 월 75만원이면 세액공제 한도(연 900만원)를 꽉 채웁니다")}
          {num(contributeYears, setContributeYears, 1, 30, 1, "적립 기간", "년")}
          {num(holdYears, setHoldYears, 0, 20, 1, "거치 기간", "년", "다 넣은 뒤 바로 찾지 않고 묵혀 두면 복리 효과가 커집니다")}
          {num(payoutYears, setPayoutYears, 5, 40, 1, "수령 기간", "년")}
          {num(returnRate, setReturnRate, 2, 10, 0.5, "기대 수익률", "%", "예금 2~3%, 주식·채권 혼합 4~6%, 지수 ETF 장기 6~8% 가정 (과거 성과는 미래를 보장하지 않음)")}
          <div style={{ ...S.control, gap: 10 }}>
            <label style={S.controlLabel}>
              <input type="checkbox" checked={indexed} onChange={(e) => setIndexed(e.target.checked)} /> 납입액을 매년 물가만큼 늘리기
            </label>
            <label style={S.controlLabel}>
              <input type="checkbox" checked={lowIncome} onChange={(e) => setLowIncome(e.target.checked)} /> 총급여 5,500만원 이하 (공제율 16.5%)
            </label>
          </div>
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>수익률 시나리오</th>
              <th style={{ ...S.th, textAlign: "right" }}>월 {monthly}만원 넣으면 월 수령</th>
              <th style={{ ...S.th, textAlign: "right" }}>수령 시작 적립금</th>
              <th style={{ ...S.th, textAlign: "right" }}>부족액을 메우는 월 납입액</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => {
              const r = runSavingsPlan({ ...plan, monthly, returnRate: s.rate }, age);
              const n = requiredMonthly(gap.monthly, gap.lump, { ...plan, returnRate: s.rate }, age);
              return (
                <tr key={s.rate} style={s.rate === returnRate ? { background: "rgba(56,189,248,0.08)" } : undefined}>
                  <td style={S.td}>
                    {s.label} (연 {s.rate}%)
                  </td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{r.monthlyPayoutReal.toFixed(1)}만원</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{fmt(r.potReal)}원</td>
                  <td style={{ ...S.td, textAlign: "right", color: "#fbbf24" }}>{gap.total > 0 ? `월 ${Math.ceil(n)}만원` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={S.checks}>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: 6 }}>📋 노후 월 500만원 3원칙 점검</div>
          {checks.map((c) => (
            <div key={c.label} style={S.checkRow}>
              <span style={{ color: c.ok ? "#34d399" : "#f87171", fontWeight: 800 }}>{c.ok ? "✓" : "✗"}</span>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{c.detail}</span>
            </div>
          ))}
          <p style={S.note}>
            직장 30년(국민연금·퇴직연금) + 연금계좌 월 75만원 + 내 집(주택연금)을 갖추면 1인 월 450만원 안팎, 맞벌이는 그 이상도 가능하다는 경험칙입니다. 수령액은 세전이며, 55세
            이후 연금으로 받으면 3.3~5.5% 저율 과세(사적연금 연 1,500만원 초과 시 16.5% 분리과세 선택)됩니다. 젊을 때는 중도 인출이 자유로운 ISA를, 은퇴가 가까울수록 연금계좌를
            우선 채우는 것이 일반적입니다. 특정 상품 권유가 아닌 계산 예시입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(6px)",
    padding: "16px",
  },
  panel: {
    width: "100%",
    maxWidth: "980px",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "var(--card-bg, #1e293b)",
    color: "var(--text-primary, #f8fafc)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 14 },
  title: { fontSize: "1.25rem", fontWeight: 800, margin: 0 },
  subtitle: { fontSize: "0.82rem", color: "var(--text-secondary, #94a3b8)", margin: "6px 0 0", lineHeight: 1.6 },
  close: { background: "none", border: "none", color: "var(--text-secondary, #94a3b8)", fontSize: "1.4rem", cursor: "pointer", padding: 4 },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
  kpi: { padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" },
  kpiLabel: { fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" },
  kpiValue: { fontSize: "1.15rem", fontWeight: 800, marginTop: 4 },
  kpiSub: { fontSize: "0.72rem", color: "#94a3b8", marginTop: 2, lineHeight: 1.5 },
  controls: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  control: { display: "flex", flexDirection: "column", gap: 6, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" },
  controlLabel: { fontSize: "0.8rem", fontWeight: 600 },
  range: { width: "100%", accentColor: "#38bdf8", cursor: "pointer" },
  hint: { fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1.5 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" },
  th: { textAlign: "left", padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: "0.72rem", fontWeight: 700 },
  td: { padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  checks: { padding: 14, borderRadius: 10, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.25)" },
  checkRow: { display: "flex", alignItems: "center", gap: 10, fontSize: "0.8rem", padding: "6px 0", borderBottom: "1px dashed rgba(255,255,255,0.08)" },
  note: { fontSize: "0.74rem", color: "#cbd5e1", lineHeight: 1.65, margin: "10px 0 0" },
};
