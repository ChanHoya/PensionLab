"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  DefaultLegendContent,
} from "recharts";
import ChartTooltip from "@/components/ChartTooltip";
import { PENSION_SERIES, SURVIVOR_FILL, pensionSeriesValues } from "@/components/pensionSeries";
import type { HouseholdReport } from "@/services/householdReport";
import { TIMINGS, won, type Level, type ReportNarrative } from "@/services/reportNarrative";

// AI 연금 종합 진단 리포트 (컨설팅 보고서 형식). 숫자·차트는 계산 결과, 서술은 AI(없으면 계산 기반 기본 진단)

interface Props {
  report: HouseholdReport;
  narrative: ReportNarrative;
  source: "base" | "ai" | "fallback"; // 기본 진단 / AI 진단 / AI 실패로 기본 진단
  model?: string;
}

const LEVEL_COLOR: Record<Level, string> = { 높음: "#ef4444", 중간: "#f59e0b", 낮음: "#10b981" };
const LEVEL_RANK: Record<Level, number> = { 높음: 2, 중간: 1, 낮음: 0 };
const LAYER = [
  { key: "public", name: "공적연금", color: "#6366f1" },
  { key: "retirement", name: "퇴직연금", color: "#059669" },
  { key: "private", name: "개인연금", color: "#0284c7" },
] as const;
const ALLOCATION = [
  { key: "safe", name: "안전자산", desc: "예금·국채·단기채 — 공백기 생활비와 비상금", color: "#0ea5e9" },
  { key: "income", name: "인컴자산", desc: "배당·리츠·채권형 — 꾸준한 현금흐름과 물가 방어", color: "#10b981" },
  { key: "growth", name: "성장자산", desc: "주식형·TDF — 장수에 대비한 자산 성장", color: "#8b5cf6" },
] as const;

const scoreColor = (s: number) => (s >= 80 ? "#10b981" : s >= 60 ? "#0ea5e9" : s >= 40 ? "#f59e0b" : "#ef4444");
const eok = (v: number) => `${(Number(v) / 10000).toFixed(1)}억`;
const signed = (x: number) => `${x >= 0 ? "+" : ""}${x}`;

function Section({ no, title, sub, children }: { no: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section style={S.section}>
      <header style={S.sectionHead}>
        <span style={S.sectionNo}>{no}</span>
        <div>
          <h3 style={S.sectionTitle}>{title}</h3>
          {sub && <p style={S.sectionSub}>{sub}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Chip({ text, color }: { text: string; color: string }) {
  return <span style={{ ...S.chip, color, backgroundColor: `${color}1a`, borderColor: `${color}55` }}>{text}</span>;
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={{ ...S.kpiValue, color: tone ?? "var(--text-primary)" }}>{value}</div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  );
}

// 반원 게이지 (글자는 HTML로 얹어 PDF 캡처에서도 테마 색이 그대로 보이게)
function ScoreGauge({ score, grade }: { score: number; grade: HouseholdReport["grade"] }) {
  const r = 80;
  const cx = 100;
  const cy = 92;
  const point = (f: number) => {
    const a = Math.PI * (1 - f);
    return `${cx + r * Math.cos(a)} ${cy - r * Math.sin(a)}`;
  };
  const arc = (to: number) => `M ${point(0)} A ${r} ${r} 0 0 1 ${point(to)}`;
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 240, margin: "0 auto" }}>
      <svg viewBox="0 0 200 104" width="100%" style={{ display: "block" }}>
        <path d={arc(1)} stroke="rgba(148,163,184,0.28)" strokeWidth={14} fill="none" strokeLinecap="round" />
        {score > 0 && <path d={arc(Math.min(1, score / 100))} stroke={grade.color} strokeWidth={14} fill="none" strokeLinecap="round" />}
      </svg>
      <div style={S.gaugeText}>
        <div style={S.gaugeScore}>{score}</div>
        <div style={S.gaugeUnit}>/ 100점</div>
      </div>
      <div style={{ textAlign: "center", marginTop: 6 }}>
        <span style={{ ...S.gradeBadge, backgroundColor: grade.color }}>
          {grade.letter} · {grade.label}
        </span>
      </div>
    </div>
  );
}

export default function DiagnosisReport({ report: r, narrative: n, source, model }: Props) {
  const p = r.params;
  const rows = r.couple.rows;
  const who = r.hasSpouse ? "부부 가구" : "본인";
  const deceased = r.firstDeath?.who === "SPOUSE" ? "배우자" : "본인";
  const now = new Date();
  const dateText = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  const sourceLabel = source === "ai" ? `AI 맞춤 진단 · ${model ?? "Gemini"}` : source === "fallback" ? "기본 진단 (AI 응답 실패)" : "기본 진단 (계산 기반)";

  // 03 가구 현금흐름 (현재가치)
  const flowData: Record<string, number>[] = rows.map((row, t) => ({ year: row.year, ...pensionSeriesValues(row, Math.pow(1 + r.inflation, t)) }));
  const visibleSeries = PENSION_SERIES.filter((s) => flowData.some((d) => d[s.key] !== 0));
  const survivorName = `${r.firstDeath?.who === "SPOUSE" ? "본인" : "배우자"} 유족연금`;
  const legendColors: Record<string, string> = { [survivorName]: SURVIVOR_FILL };

  // 04 연금 구조
  const layerTotals = LAYER.map((l) => ({ ...l, value: r.layers[l.key].self + r.layers[l.key].spouse })).filter((l) => l.value > 0);
  const layerSum = layerTotals.reduce((a, l) => a + l.value, 0) || 1;
  const personLayers = [
    { who: "본인", ...Object.fromEntries(LAYER.map((l) => [l.name, r.layers[l.key].self])) },
    ...(r.hasSpouse ? [{ who: "배우자", ...Object.fromEntries(LAYER.map((l) => [l.name, r.layers[l.key].spouse])) }] : []),
  ];

  // 05 인출전략
  const s0 = r.scenarios.find((s) => s.key === "s0") ?? r.best;
  const strategyData = r.scenarios.map((s) => ({ id: s.id, 세후수령액: s.postTax, "세금·건보료": s.taxHI }));

  // 06 리스크 (영향도 × 가능성 순으로 번호)
  const risks = [...n.risks].sort((a, b) => LEVEL_RANK[b.impact] + LEVEL_RANK[b.likelihood] - (LEVEL_RANK[a.impact] + LEVEL_RANK[a.likelihood]));
  const topActions = [...n.actions].sort((a, b) => LEVEL_RANK[b.priority] - LEVEL_RANK[a.priority]).slice(0, 3);

  const allocationData = ALLOCATION.map((a) => ({ ...a, value: n.allocation[a.key] })).filter((a) => a.value > 0);
  const survivorChange = r.firstDeath && r.firstDeath.beforeReal > 0 ? Math.round((r.firstDeath.afterReal / r.firstDeath.beforeReal - 1) * 100) : null;
  const ratio = r.avgRetiredReal / r.targetToday;

  return (
    <div style={S.root}>
      {/* 표지 */}
      <section style={S.cover}>
        <div style={S.coverTop}>
          <span style={S.coverKicker}>PENSIONLAB · RETIREMENT DIAGNOSIS REPORT</span>
          <span style={S.coverDate}>{dateText}</span>
        </div>
        <h2 style={S.coverTitle}>{r.hasSpouse ? "부부 가구 연금 종합 진단 리포트" : "연금 종합 진단 리포트"}</h2>
        <p style={S.coverMeta}>
          {r.hasSpouse
            ? `본인 ${p.currentAge}세(은퇴 ${p.retirementAge}세·기대수명 ${p.expectedLifeExpectancy}세) · 배우자 ${p.spouseAge ?? p.currentAge}세(은퇴 ${p.spouseRetirementAge}세·기대수명 ${p.spouseLifeExpectancy}세)`
            : `본인 ${p.currentAge}세 · 은퇴 ${p.retirementAge}세 · 기대수명 ${p.expectedLifeExpectancy}세`}
          {" · "}목표 생활비 월 {r.targetToday}만원 · 최소 {r.minToday}만원 · 금액은 현재가치(연 물가 {p.inflationRate}%)
        </p>

        <div className="rpt-cover" style={{ marginTop: 20 }}>
          <ScoreGauge score={r.total} grade={r.grade} />
          <div>
            <div style={{ marginBottom: 8 }}>
              <Chip text={sourceLabel} color={source === "ai" ? "#6366f1" : "#64748b"} />
            </div>
            <p style={S.headline}>{n.headline}</p>
            <p style={S.summary}>{n.summary}</p>
          </div>
        </div>

        <div className="rpt-grid-3" style={{ marginTop: 20 }}>
          <Kpi
            label="은퇴 후 평균 가구 월 연금"
            value={`${r.avgRetiredReal.toLocaleString()}만원`}
            sub={`목표 ${r.targetToday}만원의 ${Math.round(ratio * 100)}%`}
            tone={scoreColor(Math.min(100, ratio * 100))}
          />
          <Kpi
            label="목표 대비 누적 부족액"
            value={r.shortfallPV > 0 ? won(r.shortfallPV) : "부족 없음"}
            sub="은퇴 기간 합계 · 현재가치"
            tone={r.shortfallPV > 0 ? "#ef4444" : "#10b981"}
          />
          <Kpi
            label="소득 공백기 (국민연금 개시 전)"
            value={r.crevasse.years > 0 ? `${r.crevasse.years}년` : "없음"}
            sub={r.crevasse.years > 0 ? `이 기간 월 ${r.crevasse.avgReal}만원` : "은퇴 시점부터 공적연금 수령"}
            tone={r.crevasse.years > 0 && r.crevasse.avgReal < r.minToday ? "#ef4444" : undefined}
          />
          {r.firstDeath && survivorChange !== null ? (
            <Kpi
              label={`${deceased} 기대수명 이후 가구 월 연금`}
              value={`${r.firstDeath.beforeReal} → ${r.firstDeath.afterReal}만원`}
              sub={`${signed(survivorChange)}% (전후 3년 평균)`}
              tone={survivorChange < -30 ? "#ef4444" : undefined}
            />
          ) : (
            <Kpi label="말년 월 연금 (마지막 5년)" value={`${r.lateReal}만원`} sub={`최소 생활비의 ${Math.round((r.lateReal / r.minToday) * 100)}%`} />
          )}
          <Kpi label={`생애 ${r.hasSpouse ? "가구 " : ""}연금 수령액`} value={won(r.couple.lifetime.household)} sub="명목 · 세전" />
          <Kpi label="추천 인출전략" value={r.best.id} sub={`${r.best.name} · 생애 세후 ${won(r.best.postTax)}`} tone="#6366f1" />
        </div>
      </section>

      {/* 01 핵심 요약 */}
      <Section no="01" title="핵심 진단 요약" sub="강점·핵심 위험·우선 실행 과제를 한눈에">
        <div className="rpt-grid-3">
          <div style={{ ...S.panel, borderTop: "3px solid #10b981" }}>
            <div style={S.panelTitle}>✅ 강점</div>
            {n.strengths.map((s, i) => (
              <p key={i} style={S.panelItem}>
                {s}
              </p>
            ))}
          </div>
          <div style={{ ...S.panel, borderTop: "3px solid #ef4444" }}>
            <div style={S.panelTitle}>⚠️ 핵심 위험</div>
            {risks.slice(0, 3).map((x, i) => (
              <p key={i} style={S.panelItem}>
                <strong style={{ color: "var(--text-primary)" }}>{x.title}</strong> — {x.detail}
              </p>
            ))}
          </div>
          <div style={{ ...S.panel, borderTop: "3px solid #6366f1" }}>
            <div style={S.panelTitle}>🎯 우선 실행 과제</div>
            {topActions.map((a, i) => (
              <p key={i} style={S.panelItem}>
                <strong style={{ color: "var(--text-primary)" }}>{a.title}</strong> ({a.timing}) — {a.effect}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* 02 스코어카드 */}
      <Section no="02" title="진단 스코어카드" sub={`5개 영역 가중 평균 = 종합 ${r.total}점 · 점선은 양호 기준(70점)`}>
        <div className="rpt-grid-2" style={{ alignItems: "center" }}>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={r.dimensions.map((d) => ({ dim: d.label, score: d.score, bench: 70 }))} outerRadius="70%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="bench" stroke="#94a3b8" strokeDasharray="4 4" fill="none" isAnimationActive={false} />
                <Radar dataKey="score" stroke={r.grade.color} fill={r.grade.color} fillOpacity={0.3} isAnimationActive={false} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {r.dimensions.map((d) => (
              <div key={d.key}>
                <div style={S.dimHead}>
                  <span style={S.dimLabel}>
                    {d.label} <span style={S.dimWeight}>가중치 {d.weight}%</span>
                  </span>
                  <span style={{ ...S.dimScore, color: scoreColor(d.score) }}>{d.score}</span>
                </div>
                <div style={S.bar}>
                  <div style={{ ...S.barFill, width: `${d.score}%`, background: scoreColor(d.score) }} />
                </div>
                <div style={S.dimMetric}>{d.metric}</div>
                {n.dimensionComments[d.key] && <div style={S.dimComment}>{n.dimensionComments[d.key]}</div>}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 03 현금흐름 */}
      <Section
        no="03"
        title={`${r.hasSpouse ? "가구 " : ""}연금 현금흐름`}
        sub={`연도별 월 연금 (현재가치, 만원/월)${r.hasSpouse ? " · 사람별·연금별로 쌓아 표시" : ""} · 빨간 점선 목표 생활비, 주황 점선 최소 생활비`}
      >
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={flowData} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<ChartTooltip labelSuffix="년" hideZero showTotal unit="만원/월" colors={legendColors} />} />
              <Legend
                wrapperStyle={{ fontSize: "0.72rem" }}
                iconSize={10}
                content={(props) => (
                  <DefaultLegendContent {...props} payload={props.payload?.map((item) => ({ ...item, color: legendColors[String(item.value)] ?? item.color }))} />
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
                  fillOpacity={s.fill ? 0.55 : 0.5}
                  isAnimationActive={false}
                />
              ))}
              <ReferenceLine y={r.targetToday} stroke="#ef4444" strokeDasharray="6 4" label={{ value: `목표 ${r.targetToday}`, position: "insideTopRight", fill: "#ef4444", fontSize: 11 }} />
              <ReferenceLine y={r.minToday} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `최소 ${r.minToday}`, position: "insideBottomRight", fill: "#f59e0b", fontSize: 11 }} />
              <ReferenceLine x={r.retireYear} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: "은퇴", position: "top", fill: "var(--text-muted)", fontSize: 11 }} />
              {r.firstDeath && (
                <ReferenceLine
                  x={r.firstDeath.year}
                  stroke="var(--text-muted)"
                  strokeDasharray="6 4"
                  label={{ value: `${deceased} 기대수명`, position: "top", fill: "var(--text-muted)", fontSize: 11 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rpt-grid-3" style={{ marginTop: 12 }}>
          <div style={S.note}>
            <div style={S.noteTitle}>소득 공백기</div>
            {r.crevasse.years > 0
              ? `은퇴 후 국민연금 개시 전 ${r.crevasse.years}년, 월 ${r.crevasse.avgReal}만원`
              : "은퇴 시점부터 공적연금이 나와 공백이 없습니다"}
          </div>
          <div style={S.note}>
            <div style={S.noteTitle}>최소 생활비 미달 구간</div>
            {r.belowMinSpans.length > 0
              ? r.belowMinSpans.map((s) => `${s.fromYear}~${s.toYear}년 (본인 ${s.fromAge}~${s.toAge}세)`).join(", ")
              : "없음 — 은퇴 기간 내내 최소 생활비 이상"}
          </div>
          <div style={S.note}>
            <div style={S.noteTitle}>{r.firstDeath ? `${deceased} 기대수명 전후` : "말년 소득"}</div>
            {r.firstDeath && survivorChange !== null
              ? `가구 월 ${r.firstDeath.beforeReal}만원 → ${r.firstDeath.afterReal}만원 (${signed(survivorChange)}%)`
              : `마지막 5년 평균 월 ${r.lateReal}만원`}
          </div>
        </div>
      </Section>

      {/* 04 연금 구조 */}
      <Section no="04" title="연금 구조 분석" sub="생애 수령액 기준 3층 구성 · 사람별 비중 · 낸 돈 대비 받는 돈 (명목, 세전)">
        <div className="rpt-grid-3">
          <div style={S.panel}>
            <div style={S.panelTitle}>3층 비중 ({r.hasSpouse ? "가구" : "본인"})</div>
            <div style={{ position: "relative", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={layerTotals} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={2} isAnimationActive={false}>
                    {layerTotals.map((l) => (
                      <Cell key={l.key} fill={l.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip unit="만원" />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={S.donutCenter}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>생애 합계</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>{eok(layerSum)}원</div>
              </div>
            </div>
            {layerTotals.map((l) => (
              <div key={l.key} style={S.legendRow}>
                <span style={{ ...S.dot, backgroundColor: l.color }} />
                <span style={{ flex: 1 }}>{l.name}</span>
                <strong>{Math.round((l.value / layerSum) * 100)}%</strong>
                <span style={{ minWidth: 64, textAlign: "right" }}>{won(l.value)}</span>
              </div>
            ))}
          </div>

          <div style={S.panel}>
            <div style={S.panelTitle}>{r.hasSpouse ? "사람별 3층 수령액" : "3층별 수령액"}</div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personLayers} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={eok} stroke="var(--text-muted)" fontSize={10} />
                  <YAxis type="category" dataKey="who" stroke="var(--text-muted)" fontSize={11} width={44} />
                  <Tooltip content={<ChartTooltip unit="만원" showTotal hideZero />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                  <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={9} />
                  {LAYER.map((l) => (
                    <Bar key={l.key} dataKey={l.name} stackId="a" fill={l.color} isAnimationActive={false} barSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={S.panel}>
            <div style={S.panelTitle}>낸 돈(원금) vs 받는 돈</div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={r.moneyFlow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis tickFormatter={eok} stroke="var(--text-muted)" fontSize={10} width={44} />
                  <Tooltip content={<ChartTooltip unit="만원" />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                  <Bar dataKey="paid" name="낸 돈" fill="#94a3b8" isAnimationActive={false} />
                  <Bar dataKey="received" name="받는 돈" fill="#6366f1" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {r.moneyFlow.map((m) => (
              <div key={m.label} style={S.legendRow}>
                <span style={{ flex: 1 }}>{m.label}</span>
                <span>
                  {won(m.paid)} → {won(m.received)}
                </span>
                <strong style={{ minWidth: 48, textAlign: "right", color: "#6366f1" }}>{m.paid > 0 ? `×${(m.received / m.paid).toFixed(1)}` : "-"}</strong>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 05 인출전략 */}
      <Section no="05" title="인출전략 비교" sub="같은 연금을 어떤 순서·속도로 꺼내느냐에 따른 생애 세후 수령액 (가구 합계, 명목)">
        <div className="rpt-grid-2" style={{ alignItems: "center" }}>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={eok} stroke="var(--text-muted)" fontSize={10} />
                <YAxis type="category" dataKey="id" stroke="var(--text-muted)" fontSize={12} width={36} />
                <Tooltip content={<ChartTooltip unit="만원" showTotal />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={9} />
                <Bar dataKey="세후수령액" stackId="s" fill="#6366f1" isAnimationActive={false} barSize={24}>
                  {strategyData.map((d) => (
                    <Cell key={d.id} fill={d.id === r.best.id ? "#6366f1" : "#a5b4fc"} />
                  ))}
                </Bar>
                <Bar dataKey="세금·건보료" stackId="s" fill="#fca5a5" isAnimationActive={false} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>전략</th>
                <th style={{ ...S.th, textAlign: "right" }}>생애 세후</th>
                <th style={{ ...S.th, textAlign: "right" }}>세금·건보료</th>
                <th style={{ ...S.th, textAlign: "right" }}>S0 대비</th>
              </tr>
            </thead>
            <tbody>
              {r.scenarios.map((s) => (
                <tr key={s.id} style={s.id === r.best.id ? { backgroundColor: "rgba(99,102,241,0.08)" } : undefined}>
                  <td style={S.td}>
                    <strong>{s.id}</strong> {s.name}
                    {s.id === r.best.id && <Chip text="추천" color="#6366f1" />}
                    {s.lostDependencyAge && <div style={S.tdSub}>{s.lostDependencyAge}세 피부양자 탈락</div>}
                  </td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{won(s.postTax)}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>
                    {won(s.taxHI)}
                    <div style={S.tdSub}>{(s.effectiveRate * 100).toFixed(1)}%</div>
                  </td>
                  <td style={{ ...S.td, textAlign: "right", color: s.postTax - s0.postTax >= 0 ? "#10b981" : "#ef4444" }}>
                    {s.key === "s0" ? "기준" : `${s.postTax - s0.postTax >= 0 ? "+" : "−"}${won(Math.abs(s.postTax - s0.postTax))}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 06 리스크 매트릭스 */}
      <Section no="06" title="리스크 매트릭스" sub="영향도 × 발생 가능성 — 오른쪽 위로 갈수록 먼저 대비할 위험">
        <div className="rpt-grid-2">
          <div>
            <div style={S.matrix}>
              {(["높음", "중간", "낮음"] as Level[]).map((impact) => (
                <React.Fragment key={impact}>
                  <div style={S.matrixAxis}>{impact}</div>
                  {(["낮음", "중간", "높음"] as Level[]).map((likelihood) => {
                    const sev = LEVEL_RANK[impact] + LEVEL_RANK[likelihood];
                    const tint = sev >= 3 ? "rgba(239,68,68,0.16)" : sev === 2 ? "rgba(245,158,11,0.16)" : "rgba(16,185,129,0.12)";
                    return (
                      <div key={likelihood} style={{ ...S.matrixCell, backgroundColor: tint }}>
                        {risks.map((x, i) =>
                          x.impact === impact && x.likelihood === likelihood ? (
                            <span key={i} style={{ ...S.matrixDot, backgroundColor: LEVEL_COLOR[sev >= 3 ? "높음" : sev === 2 ? "중간" : "낮음"] }}>
                              {i + 1}
                            </span>
                          ) : null
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              <div />
              {["낮음", "중간", "높음"].map((l) => (
                <div key={l} style={{ ...S.matrixAxis, writingMode: "horizontal-tb" }}>
                  {l}
                </div>
              ))}
            </div>
            <div style={S.matrixLegend}>↑ 영향도 · → 발생 가능성</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {risks.map((x, i) => (
              <div key={i} style={S.riskRow}>
                <span style={{ ...S.matrixDot, backgroundColor: "var(--text-secondary)", flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.86rem", color: "var(--text-primary)" }}>{x.title}</strong>
                    <Chip text={`영향 ${x.impact}`} color={LEVEL_COLOR[x.impact]} />
                    <Chip text={`가능성 ${x.likelihood}`} color={LEVEL_COLOR[x.likelihood]} />
                  </div>
                  <div style={S.riskDetail}>{x.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 07 실행 로드맵 */}
      <Section no="07" title="실행 로드맵" sub="시점별 실행 과제 · 우선순위와 기대 효과">
        <div className="rpt-roadmap">
          {TIMINGS.map((t, i) => {
            const items = n.actions.filter((a) => a.timing === t);
            return (
              <div key={t} style={S.phase}>
                <div style={S.phaseHead}>
                  <span style={S.phaseNo}>{i + 1}</span>
                  {t}
                </div>
                {items.length === 0 && <div style={S.phaseEmpty}>해당 과제 없음</div>}
                {items.map((a, k) => (
                  <div key={k} style={{ ...S.action, borderLeftColor: LEVEL_COLOR[a.priority] }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
                      <strong style={{ fontSize: "0.84rem", color: "var(--text-primary)" }}>{a.title}</strong>
                      <Chip text={a.priority} color={LEVEL_COLOR[a.priority]} />
                    </div>
                    <div style={S.actionDetail}>{a.detail}</div>
                    {a.effect && <div style={S.actionEffect}>→ {a.effect}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Section>

      {/* 08 인출 순서·세제 */}
      <Section no="08" title="인출 순서 · 세제 최적화" sub="나이 구간별로 어떤 재원을 먼저 쓰는지와 세금·건보료를 줄이는 방법">
        <div className="rpt-grid-2">
          <div>
            {n.withdrawalOrder.map((w, i) => (
              <div key={i} style={S.step}>
                <div style={S.stepRail}>
                  <span style={S.stepNo}>{i + 1}</span>
                  {i < n.withdrawalOrder.length - 1 && <span style={S.stepLine} />}
                </div>
                <div style={{ paddingBottom: 14 }}>
                  <div style={S.stepPeriod}>{w.period}</div>
                  <div style={S.stepSource}>{w.source}</div>
                  <div style={S.stepReason}>{w.reason}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.panel}>
            <div style={S.panelTitle}>💡 세금·건보료 절감 포인트</div>
            {n.taxTips.map((tip, i) => (
              <p key={i} style={S.panelItem}>
                {tip}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* 09 자산 배분 */}
      <Section no="09" title="자산 배분 제안" sub="연금 적립금·금융자산의 역할별 권장 비중 (일반적 예시이며 투자 권유가 아닙니다)">
        <div className="rpt-grid-2" style={{ alignItems: "center" }}>
          <div style={{ position: "relative", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={2} isAnimationActive={false}>
                  {allocationData.map((a) => (
                    <Cell key={a.key} fill={a.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip unit="%" />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={S.donutCenter}>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>권장 배분</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {n.allocation.safe}:{n.allocation.income}:{n.allocation.growth}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ALLOCATION.map((a) => (
              <div key={a.key}>
                <div style={S.dimHead}>
                  <span style={S.dimLabel}>
                    <span style={{ ...S.dot, backgroundColor: a.color, marginRight: 6 }} />
                    {a.name}
                  </span>
                  <span style={{ ...S.dimScore, color: a.color }}>{n.allocation[a.key]}%</span>
                </div>
                <div style={S.bar}>
                  <div style={{ ...S.barFill, width: `${n.allocation[a.key]}%`, background: a.color }} />
                </div>
                <div style={S.dimMetric}>{a.desc}</div>
              </div>
            ))}
            {n.allocation.rationale && <div style={S.dimComment}>{n.allocation.rationale}</div>}
          </div>
        </div>
      </Section>

      {/* 부록: 진단 기준과 가정 */}
      <section style={{ ...S.section, background: "transparent", boxShadow: "none" }}>
        <h4 style={S.appendixTitle}>진단 기준과 가정</h4>
        <table style={{ ...S.table, marginBottom: 12 }}>
          <tbody>
            {r.dimensions.map((d) => (
              <tr key={d.key}>
                <td style={{ ...S.td, width: 140, fontWeight: 700 }}>
                  {d.label} ({d.weight}%)
                </td>
                <td style={S.td}>{d.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul style={S.assumptions}>
          <li>
            {who} 기준 통합 시뮬레이션 결과입니다. 국민연금은 물가연동·연기 가산·유족연금(중복급여 조정)을 반영하고, 퇴직·개인연금은 인출 시작 나이부터
            가구 소득 평탄화로 나눠 받는다고 가정했습니다 (적립금 운용·할인 수익률 연 3%).
          </li>
          <li>월 금액은 연 {p.inflationRate}% 물가로 할인한 현재가치, 생애 합계는 명목 금액입니다. 등급: A 85점 이상 · B 70 · C 55 · D 40 · E 40 미만.</li>
          <li>
            인출전략 비교는 대시보드 기본 세제 가정(연금저축 세액공제분 80%, 퇴직소득세 실효 8%, 공적연금 건보료 반영 50%, 기타 소득 없음)으로 계산했습니다.
          </li>
          <li>세법·국민연금·건강보험 제도는 바뀔 수 있으며, 본 리포트는 정보 제공용입니다. 실제 실행 전 국민연금공단(☎1355)·세무 전문가와 확인하세요.</li>
        </ul>
      </section>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 18, width: "100%" },
  cover: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderTop: "4px solid #6366f1",
    borderRadius: "var(--radius-lg)",
    padding: "24px 26px",
    boxShadow: "var(--shadow-sm)",
  },
  coverTop: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  coverKicker: { fontSize: "0.7rem", fontWeight: 800, letterSpacing: "1.5px", color: "var(--text-accent)" },
  coverDate: { fontSize: "0.75rem", color: "var(--text-muted)" },
  coverTitle: { fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: "8px 0 6px" },
  coverMeta: { fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 },
  headline: { fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.45, marginBottom: 8 },
  summary: { fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75 },
  gaugeText: { position: "absolute", left: 0, right: 0, top: "34%", textAlign: "center" },
  gaugeScore: { fontSize: "2.4rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 },
  gaugeUnit: { fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 },
  gradeBadge: { display: "inline-block", padding: "4px 14px", borderRadius: "var(--radius-full)", color: "#fff", fontWeight: 800, fontSize: "0.85rem" },
  kpi: { border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", background: "rgba(99,102,241,0.04)" },
  kpiLabel: { fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 },
  kpiValue: { fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.3 },
  kpiSub: { fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 2 },
  section: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 22px",
    boxShadow: "var(--shadow-sm)",
  },
  sectionHead: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 },
  sectionNo: {
    fontSize: "0.85rem",
    fontWeight: 800,
    color: "#fff",
    background: "var(--gradient-brand)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 8px",
    lineHeight: 1.2,
    flexShrink: 0,
  },
  sectionTitle: { fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" },
  sectionSub: { fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 2 },
  panel: { border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 16px", background: "rgba(99,102,241,0.03)" },
  panelTitle: { fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 },
  panelItem: { fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 6 },
  chip: {
    display: "inline-block",
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    border: "1px solid",
    marginLeft: 4,
    whiteSpace: "nowrap",
  },
  dimHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  dimLabel: { fontSize: "0.86rem", fontWeight: 700, color: "var(--text-primary)", display: "inline-flex", alignItems: "center" },
  dimWeight: { fontSize: "0.68rem", fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 },
  dimScore: { fontSize: "1.05rem", fontWeight: 800 },
  bar: { height: 8, background: "rgba(148,163,184,0.2)", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  dimMetric: { fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 4 },
  dimComment: { fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 4 },
  note: { fontSize: "0.78rem", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px" },
  noteTitle: { fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 },
  donutCenter: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  legendRow: { display: "flex", alignItems: "center", gap: 8, fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: 6 },
  dot: { display: "inline-block", width: 9, height: 9, borderRadius: 2, flexShrink: 0 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" },
  th: { textAlign: "left", padding: "8px 8px", borderBottom: "2px solid var(--border)", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.72rem" },
  td: { padding: "8px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", verticalAlign: "top" },
  tdSub: { fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 },
  matrix: { display: "grid", gridTemplateColumns: "40px repeat(3, 1fr)", gridAutoRows: "minmax(64px, auto)", gap: 4 },
  matrixAxis: { display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, minHeight: 24 },
  matrixCell: { borderRadius: "var(--radius-sm)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", justifyContent: "center", padding: 6 },
  matrixDot: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: "50%",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 800,
  },
  matrixLegend: { fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "right", marginTop: 6 },
  riskRow: { display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px dashed var(--border)", paddingBottom: 8 },
  riskDetail: { fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, marginTop: 3 },
  phase: { background: "rgba(99,102,241,0.03)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12 },
  phaseHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "0.88rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    paddingBottom: 8,
    marginBottom: 10,
    borderBottom: "2px solid #6366f1",
  },
  phaseNo: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#6366f1",
    color: "#fff",
    fontSize: "0.72rem",
  },
  phaseEmpty: { fontSize: "0.75rem", color: "var(--text-muted)" },
  action: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "4px solid",
    borderRadius: "var(--radius-sm)",
    padding: "10px 10px",
    marginBottom: 8,
  },
  actionDetail: { fontSize: "0.76rem", color: "var(--text-secondary)", lineHeight: 1.55, marginTop: 4 },
  actionEffect: { fontSize: "0.74rem", color: "var(--text-accent)", fontWeight: 700, marginTop: 4 },
  step: { display: "flex", gap: 12 },
  stepRail: { display: "flex", flexDirection: "column", alignItems: "center" },
  stepNo: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "var(--gradient-brand)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  stepLine: { flex: 1, width: 2, background: "var(--border)", marginTop: 4 },
  stepPeriod: { fontSize: "0.74rem", fontWeight: 700, color: "var(--text-accent)" },
  stepSource: { fontSize: "0.92rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 2 },
  stepReason: { fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, marginTop: 2 },
  appendixTitle: { fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 },
  assumptions: { fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.7, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 },
};
