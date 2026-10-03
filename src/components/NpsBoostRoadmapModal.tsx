"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from "recharts";
import { usePensionStore, pensionsOf } from "@/store/usePensionStore";
import { personParams, statutoryStartAgeOf } from "@/services/coupleSimulation";
import { buildBoostRoadmap, type BoostRoadmap, type BoostStatus, type BoostStepKey } from "@/services/npsBoostRoadmap";
import { NPS_RULES } from "@/config/npsRules";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Who = "SELF" | "SPOUSE";

const STEP_COLOR: Record<BoostStepKey, string> = {
  base: "#64748b",
  repay: "#a78bfa",
  additional: "#6366f1",
  voluntary: "#0ea5e9",
  defer: "#f59e0b",
};
const STATUS_LABEL: Record<BoostStatus, { text: string; color: string }> = {
  available: { text: "적용", color: "#10b981" },
  needsInput: { text: "입력 필요", color: "#f59e0b" },
  notApplicable: { text: "해당 없음", color: "#64748b" },
};
const PAYBACK_YEARS = 1 / NPS_RULES.deferralBonusPerYear; // 연기연금 회수 기간 ≈ 13.9년

const fmt = (v: number) => (Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1)}억` : `${Math.round(v).toLocaleString()}만`);

// 국민연금 증액 로드맵: 반납 → 추납 → 임의계속가입 → 연기연금을 순서대로 쌓은 효과와 비용 (본인·배우자·부부 합산)
export function NpsBoostRoadmapModal({ isOpen, onClose }: Props) {
  const store = usePensionStore();
  const params = store.simulationParams;
  const hasSpouse = params.hasSpouse;

  const [who, setWho] = useState<Who>("SELF");
  const [useVoluntary, setUseVoluntary] = useState(true);
  const [voluntaryIncome, setVoluntaryIncome] = useState<number>(NPS_RULES.voluntaryIncomeFloor);
  const [deferYears, setDeferYears] = useState(5);
  const [deferShare, setDeferShare] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const roadmaps = useMemo(() => {
    const options = { useVoluntary, voluntaryIncome, deferYears, deferShare };
    const build = (w: Who): BoostRoadmap =>
      buildBoostRoadmap(pensionsOf(store, w), personParams(params, w), statutoryStartAgeOf(params, w), options);
    return { SELF: build("SELF"), SPOUSE: hasSpouse ? build("SPOUSE") : null };
  }, [store, params, hasSpouse, useVoluntary, voluntaryIncome, deferYears, deferShare]);

  if (!isOpen) return null;

  const road = (who === "SPOUSE" && roadmaps.SPOUSE) || roadmaps.SELF;
  const chartData = road.steps.map((s, i) => ({
    name: s.label,
    key: s.key,
    base: i === 0 ? 0 : Math.min(road.steps[i - 1].monthly, s.monthly),
    delta: i === 0 ? s.monthly : Math.abs(s.delta),
    total: s.status === "available" || i === 0 ? s.monthly : undefined,
  }));
  const coupleBase = roadmaps.SELF.baseMonthly + (roadmaps.SPOUSE?.baseMonthly ?? 0);
  const coupleFinal = roadmaps.SELF.finalMonthly + (roadmaps.SPOUSE?.finalMonthly ?? 0);
  const deferOn = road.steps[4].status === "available";
  const breakEvenAge = Math.round(road.deferEndAge + PAYBACK_YEARS);

  const card = (label: string, r: BoostRoadmap) => (
    <div style={S.kpi}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiValue}>
        {r.baseMonthly}만 → <span style={{ color: "#f59e0b" }}>{r.finalMonthly}만원</span>
      </div>
      <div style={S.kpiSub}>{r.multiple ? `${r.multiple}배` : "수급권 확인 필요"} · 월 기준(현재가치)</div>
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card" style={S.panel}>
        <div style={S.header}>
          <div>
            <h3 style={S.title}>🪜 국민연금 증액 로드맵</h3>
            <p style={S.subtitle}>
              반납 → 추납 → 임의계속가입 → 연기연금 순서로 종신 국민연금을 키웠을 때 단계별 월 연금과 드는 돈입니다. 국민연금은 물가만큼
              오르므로 금액은 현재가치(만원/월)로 봅니다.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={S.close}>
            ✕
          </button>
        </div>

        <div style={S.kpiRow}>
          {card("본인", roadmaps.SELF)}
          {roadmaps.SPOUSE && card("배우자", roadmaps.SPOUSE)}
          {roadmaps.SPOUSE && (
            <div style={S.kpi}>
              <div style={S.kpiLabel}>부부 합산</div>
              <div style={S.kpiValue}>
                {Math.round(coupleBase)}만 → <span style={{ color: "#f59e0b" }}>{Math.round(coupleFinal)}만원</span>
              </div>
              <div style={S.kpiSub}>평생 받는 가구 국민연금 (월)</div>
            </div>
          )}
        </div>

        {hasSpouse && (
          <div style={S.tabs}>
            {(["SELF", "SPOUSE"] as Who[]).map((w) => (
              <button key={w} type="button" onClick={() => setWho(w)} style={{ ...S.tab, ...(who === w ? S.tabOn : {}) }}>
                {w === "SELF" ? "본인" : "배우자"}
              </button>
            ))}
          </div>
        )}

        <div style={{ height: 260, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.08)" }}
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: "0.78rem" }}
                formatter={(value, name) => (name === "base" ? [null, null] : [`${Number(value ?? 0).toFixed(1)}만원`, "증가분"])}
              />
              <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="delta" stackId="w" isAnimationActive={false} radius={[4, 4, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.key} fill={STEP_COLOR[d.key as BoostStepKey]} />
                ))}
                <LabelList dataKey="total" position="top" fill="#e2e8f0" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>단계</th>
              <th style={{ ...S.th, textAlign: "right" }}>월 연금</th>
              <th style={{ ...S.th, textAlign: "right" }}>증가</th>
              <th style={{ ...S.th, textAlign: "right" }}>드는 돈</th>
              <th style={{ ...S.th, textAlign: "right" }}>회수 기간</th>
              <th style={S.th}>내용</th>
            </tr>
          </thead>
          <tbody>
            {road.steps.map((s) => (
              <tr key={s.key}>
                <td style={S.td}>
                  <span style={{ ...S.dot, background: STEP_COLOR[s.key] }} />
                  {s.label}
                  {s.key !== "base" && (
                    <span style={{ ...S.chip, color: STATUS_LABEL[s.status].color, borderColor: STATUS_LABEL[s.status].color }}>{STATUS_LABEL[s.status].text}</span>
                  )}
                </td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{s.monthly}만원</td>
                <td style={{ ...S.td, textAlign: "right", color: s.delta > 0 ? "#34d399" : "#64748b" }}>{s.delta > 0 ? `+${s.delta}` : "-"}</td>
                <td style={{ ...S.td, textAlign: "right" }}>{s.cost > 0 ? `${fmt(s.cost)}원` : "-"}</td>
                <td style={{ ...S.td, textAlign: "right" }}>{s.paybackYears ? `${s.paybackYears}년` : "-"}</td>
                <td style={{ ...S.td, color: "#94a3b8", fontSize: "0.72rem" }}>{s.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={S.controls}>
          <label style={S.control}>
            <span style={S.controlLabel}>
              <input type="checkbox" checked={useVoluntary} onChange={(e) => setUseVoluntary(e.target.checked)} /> 60세 이후 임의계속가입
              <b style={{ color: "#0ea5e9" }}> · 기준소득 월 {voluntaryIncome}만원</b>
            </span>
            <input
              type="range"
              min={NPS_RULES.voluntaryIncomeFloor}
              max={Math.floor(NPS_RULES.aValue)}
              step={10}
              value={voluntaryIncome}
              disabled={!useVoluntary}
              onChange={(e) => setVoluntaryIncome(Number(e.target.value))}
              style={S.range}
            />
            <span style={S.hint}>낮게 내도 가입기간이 늘어 연금이 오릅니다 (보험료 = 기준소득 × 그해 요율, 전액 본인 부담)</span>
          </label>
          <label style={S.control}>
            <span style={S.controlLabel}>
              연기 기간 <b style={{ color: "#f59e0b" }}>{deferYears}년</b>
            </span>
            <input type="range" min={0} max={NPS_RULES.maxDeferralYears} step={1} value={deferYears} onChange={(e) => setDeferYears(Number(e.target.value))} style={S.range} />
            <span style={S.hint}>
              1년마다 +{(NPS_RULES.deferralBonusPerYear * 100).toFixed(1)}%, 최대 {NPS_RULES.maxDeferralYears}년
            </span>
          </label>
          <label style={S.control}>
            <span style={S.controlLabel}>
              연기 비율 <b style={{ color: "#f59e0b" }}>{Math.round(deferShare * 100)}%</b> {deferShare < 1 && "(부분 연기연금)"}
            </span>
            <input type="range" min={0.5} max={1} step={0.1} value={deferShare} onChange={(e) => setDeferShare(Number(e.target.value))} style={S.range} />
            <span style={S.hint}>50~90%만 연기하면 연기 기간에도 나머지를 받습니다</span>
          </label>
        </div>

        <div style={S.insights}>
          {deferOn && (
            <p style={S.insight}>
              ⏳ 연기 기간에 덜 받은 돈은 늘어난 연금으로 약 {PAYBACK_YEARS.toFixed(1)}년이면 회수됩니다. <b>약 {breakEvenAge}세</b>보다 오래 살면 연기가 유리하고,
              건강이 좋지 않으면 연기하지 않는 편이 낫습니다.
              {deferShare < 1 && ` 연기하는 동안(${road.startAge}~${road.deferEndAge - 1}세)에는 월 ${road.partialMonthly}만원을 받습니다.`}
            </p>
          )}
          {road.overDependentCap && (
            <p style={{ ...S.insight, color: "#fbbf24" }}>
              ⚠️ 최종 국민연금이 연 {NPS_RULES.dependentIncomeCapAnnual.toLocaleString()}만원을 넘어 건강보험 피부양자 자격을 잃을 수 있습니다. 연기 비율을 낮춰(부분
              연기) 세금·건보료와 함께 조절해 보세요.
            </p>
          )}
          <p style={S.insight}>
            💡 국민연금은 소득이 적을수록 낸 돈 대비 더 많이 돌려주는 구조라, 예상 연금이 적은 사람일수록 같은 단계로 늘어나는 배수가 큽니다. 반납은 과거 높은
            소득대체율 기간을 되살려 가성비가 가장 높습니다.
          </p>
          <p style={S.insight}>
            📌 추납 가능 기간(최대 119개월) 축소 등 제도 개편이 논의되고 있으니 대상이면 일찍 검토하세요. 반납·추납 정보는 「정보 재입력 → 국민연금」에서 입력하고, 대시보드에
            반영하려면 각 항목의 「대시보드 반영」과 왼쪽 입력 옵션의 국민연금 연기를 켜세요. 정확한 금액은 국민연금공단(☎1355)에서 확인하세요.
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
    maxWidth: "960px",
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
  kpiSub: { fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 },
  tabs: { display: "flex", gap: 6 },
  tab: { padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#cbd5e1", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" },
  tabOn: { background: "#6366f1", borderColor: "#6366f1", color: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" },
  th: { textAlign: "left", padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: "0.72rem", fontWeight: 700 },
  td: { padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)", verticalAlign: "top" },
  dot: { display: "inline-block", width: 9, height: 9, borderRadius: 2, marginRight: 6 },
  chip: { marginLeft: 6, fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px", borderRadius: 999, border: "1px solid", whiteSpace: "nowrap" },
  controls: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 },
  control: { display: "flex", flexDirection: "column", gap: 6, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" },
  controlLabel: { fontSize: "0.8rem", fontWeight: 600 },
  range: { width: "100%", accentColor: "#6366f1", cursor: "pointer" },
  hint: { fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1.5 },
  insights: { display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" },
  insight: { fontSize: "0.78rem", lineHeight: 1.65, margin: 0, color: "#cbd5e1" },
};
