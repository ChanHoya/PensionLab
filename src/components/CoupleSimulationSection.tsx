"use client";

import React, { useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import type { PaidTotals } from "@/services/paidTotals";

const fmt = (v: number) => Math.round(v).toLocaleString();
// 유족연금 층은 선을 본인국민연금과 같은 보라로 이어 그리되, 채우기·범례·툴팁 색은 톤다운된 분홍
const SURVIVOR_FILL = "#9d5c7d";
const WHO_LABEL = { SELF: "본인", SPOUSE: "배우자" } as const;
// 쌓는 순서대로. 같은 종류는 같은 색 계열로 본인 진하게·배우자 연하게
const SERIES = [
  { key: "본인국민연금", color: "#6366f1" },
  { key: "유족연금", color: "#6366f1", fill: SURVIVOR_FILL },
  { key: "배우자국민연금", color: "#ec4899" },
  { key: "본인 기초연금", color: "#d97706" },
  { key: "배우자 기초연금", color: "#fbbf24" },
  { key: "본인 퇴직연금", color: "#059669" },
  { key: "배우자 퇴직연금", color: "#34d399" },
  { key: "본인 개인연금", color: "#0284c7" },
  { key: "배우자 개인연금", color: "#38bdf8" },
];

interface Props {
  result: CoupleSimulationResult;
  selfStartAge: number; // 본인 국민연금 개시 나이
  spouseStartAge: number; // 배우자 국민연금 개시 나이 (연기 반영)
  actions?: React.ReactNode; // 제목 오른쪽 버튼 (백업·복원)
  paid: { self: PaidTotals; spouse: PaidTotals | null }; // 그래프 안 (납부총액/지급총액) 표기용
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

// 부부 통합 연금 시뮬레이션: 본인·배우자 × 국민·기초·퇴직·개인연금 가구 합산 (명목, 만원/월)
export default function CoupleSimulationSection({ result, selfStartAge, spouseStartAge, actions, paid }: Props) {
  const { rows, firstDeath, lifetime, survivorInfo: si } = result;
  const survivorLabel = si ? WHO_LABEL[si.deceased === "SELF" ? "SPOUSE" : "SELF"] : "";
  const cardRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [tableOpen, setTableOpen] = useState(true); // 연도별 요약 표 접기
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

  const chartData: Record<string, number>[] = rows.map((r) => ({
    year: r.year,
    // 사망 후 남은 배우자가 받는 유족연금은 사망자 국민연금에서 온 몫이라 따로 표시 (본인국민연금 층과 이어지게 바로 위에 쌓음)
    본인국민연금: Math.round(r.self.national - r.self.survivorPart),
    유족연금: Math.round(r.self.survivorPart + (r.spouse?.survivorPart ?? 0)),
    배우자국민연금: Math.round((r.spouse?.national ?? 0) - (r.spouse?.survivorPart ?? 0)),
    "본인 기초연금": Math.round(r.self.basic),
    "배우자 기초연금": Math.round(r.spouse?.basic ?? 0),
    "본인 퇴직연금": Math.round(r.self.retirement),
    "배우자 퇴직연금": Math.round(r.spouse?.retirement ?? 0),
    "본인 개인연금": Math.round(r.self.personal + r.self.insurance),
    "배우자 개인연금": Math.round((r.spouse?.personal ?? 0) + (r.spouse?.insurance ?? 0)),
  }));
  // 금액이 있는 계열만 그래프·범례에 표시. 유족연금은 받는 사람 기준 이름 (예: 배우자 유족연금)
  const survivorName = `${survivorLabel || "배우자"} 유족연금`;
  const visibleSeries = SERIES.filter((s) => chartData.some((d) => d[s.key] !== 0));
  const legendColors: Record<string, string> = { [survivorName]: SURVIVOR_FILL };
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

  // 표: 5년 간격 + 사망 전후 해
  const keyRows = rows.filter(
    (r, i) => i % 5 === 0 || i === deathIndex || i === deathIndex - 1 || i === rows.length - 1
  );
  const remark = (r: CoupleYear) => {
    const notes: string[] = [];
    if (!r.self.alive) notes.push("본인 사망");
    if (r.spouse && !r.spouse.alive) notes.push("배우자 사망");
    const choice = r.self.survivorChoice ?? r.spouse?.survivorChoice;
    if (choice === "SURVIVOR") notes.push("유족연금 선택");
    if (choice === "OWN_PLUS_30") notes.push("본인연금+유족 30%");
    return notes.join(", ");
  };

  return (
    <div ref={cardRef} style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{hasSpouse ? "👫 부부 통합 연금 시뮬레이션" : "📈 연금 통합 시뮬레이션"}</h3>
        {/* 버튼은 PDF 캡처에서 제외 */}
        <div data-html2canvas-ignore style={styles.headerActions}>
          <button type="button" onClick={handlePdf} disabled={pdfBusy} className="premium-button-secondary" style={styles.pdfButton}>
            {pdfBusy ? "PDF 생성 중..." : "📄 PDF 다운로드"}
          </button>
          {actions}
        </div>
      </div>
      <div style={styles.subtitle}>
        {hasSpouse
          ? "본인·배우자의 국민연금·기초연금·퇴직연금·개인연금을 연도별로 합산합니다. 먼저 사망한 쪽이 생기면 남은 배우자는 국민연금법 제56조에 따라 유족연금(사망자 연금의 가입기간별 40~60%)과 「본인 연금 + 유족연금 30%」 중 큰 쪽을 받습니다."
          : "국민연금·기초연금·퇴직연금·개인연금을 연도별로 합산합니다."}{" "}
        (명목 금액, 만원/월 · 입력은 왼쪽 「입력 옵션」에서 바꿉니다)
        {survivor && survivor.survivorChoice && firstDeath && (
          <>
            {" "}이 입력에서는 {WHO_LABEL[firstDeath.who]} 사망 후 남은 배우자가{" "}
            <strong>
              {survivor.survivorChoice === "SURVIVOR"
                ? `유족연금(${WHO_LABEL[firstDeath.who === "SELF" ? "SPOUSE" : "SELF"]} 노령연금은 지급정지)`
                : `${WHO_LABEL[firstDeath.who === "SELF" ? "SPOUSE" : "SELF"]} 노령연금 + 유족연금 30%`}
            </strong>
            을 선택해 국민연금 월 <strong>{fmt(survivor.national)}만원</strong>을 받는 것이 유리합니다. 사망자의 퇴직·개인연금 잔액
            상속은 반영하지 않았습니다.
            {si && (
              <details style={styles.details}>
                <summary style={styles.summary}>유족연금 산정 기준과 계산 보기</summary>
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
                  없습니다. 부양가족(19세 미만 자녀·부모 등)이 있으면 부양가족연금액이 더해지지만 여기에는 반영하지 않았습니다. 정확한 금액은
                  국민연금공단(☎1355)에서 확인하세요.
                </p>
              </details>
            )}
          </>
        )}
      </div>

      <div style={styles.kpiGrid}>
        {hasSpouse && (
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>부부 모두 국민연금 수령 시 가구 월 연금</div>
          <div style={styles.kpiValue}>{bothReceiving ? `${fmt(bothReceiving.household)} 만원` : "-"}</div>
          <div style={styles.kpiHint}>{bothReceiving ? `${bothReceiving.year}년 (본인 ${bothReceiving.self.age}세 / 배우자 ${bothReceiving.spouse!.age}세)` : "수령 기간이 겹치지 않음"}</div>
        </div>
        )}
        {hasSpouse && (
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>첫 사망 전 → 후 가구 월 연금</div>
          <div style={styles.kpiValue}>
            {beforeDeath && afterDeath ? `${fmt(beforeDeath.household)} → ${fmt(afterDeath.household)} 만원` : "-"}
          </div>
          <div style={styles.kpiHint}>
            {firstDeath ? `${WHO_LABEL[firstDeath.who]} 기대수명 이후 (${firstDeath.year}년)` : "배우자 정보 없음"}
          </div>
        </div>
        )}
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>생애 누적 {hasSpouse ? "가구 " : ""}수령액</div>
          <div style={styles.kpiValue}>{fmt(lifetime.household)} 만원</div>
          {hasSpouse && <div style={styles.kpiHint}>본인 {fmt(lifetime.self)} · 배우자 {fmt(lifetime.spouse)}</div>}
        </div>
      </div>

      {sm && (
        <div style={styles.infoAlert}>
          {sm.pot > 0 ? (
            <>
              📏 <strong>가구 소득 평탄화</strong>: {sm.startYear}년 가구 월 <strong>{fmt(sm.levelMonthly)}만원</strong>
              (현재가치 {fmt(sm.levelToday)}만원)에서 시작해 {sm.endYear}년까지 총액이{" "}
              {sm.annualGrowth > 0 ? (
                <>매년 <strong>{(sm.annualGrowth * 100).toFixed(1)}%</strong>씩 완만하게 늘어납니다.</>
              ) : (
                <>같은 수준으로 유지됩니다.</>
              )}{" "}
              국민연금이 시작·증가하는 만큼 퇴직·개인연금을 해마다 줄여 {sm.endYear}년까지 모두 쓰므로 국민연금 개시 때 총액이 튀지 않습니다.
              (총액을 물가만큼 늘리면 물가연동인 국민연금과 같은 속도라 사적연금이 줄지 않으므로, 증가율은 국민연금 아래로 내려가지 않는
              가장 완만한 값으로 적립금 크기에 맞춰 정해집니다)
              <br />
              💰 사적연금 적립금({sm.startYear}년 가치): 보유 <strong>{fmt(sm.pot)}만원</strong> · 희망 월 생활비{" "}
              {fmt(sm.targetToday)}만원(현재가치)으로 시작하는 데 필요 <strong>{fmt(sm.requiredPot)}만원</strong> →{" "}
              <strong style={{ color: potGap >= 0 ? "var(--success)" : "var(--danger)" }}>
                {potGap >= 0 ? `여유 ${fmt(potGap)}만원` : `부족 ${fmt(-potGap)}만원`}
              </strong>
            </>
          ) : (
            <>📏 가구 소득 평탄화: 퇴직·개인연금·연금보험 입력이 없어 채울 사적연금이 없습니다.</>
          )}
        </div>
      )}

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                fillOpacity={s.fill ? 0.55 : 0.5}
              />
            ))}
            {firstDeath && (
              <ReferenceLine
                x={firstDeath.year}
                stroke="var(--text-muted)"
                strokeDasharray="6 4"
                label={{ value: `${WHO_LABEL[firstDeath.who]} 사망`, fill: "var(--text-muted)", fontSize: 12 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.header}>
        <span style={styles.tableTitle}>연도별 요약 (5년 간격 + 사망 전후)</span>
        <button
          type="button"
          data-html2canvas-ignore
          onClick={() => setTableOpen((v) => !v)}
          className="premium-button-secondary"
          style={styles.pdfButton}
        >
          {tableOpen ? "▲ 접기" : "▼ 펼치기"}
        </button>
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
            {keyRows.map((r) => (
              <tr key={r.year}>
                <td style={styles.td}>{r.year}</td>
                <td style={styles.td}>{r.self.age}세</td>
                <td style={styles.td}>{r.spouse ? `${r.spouse.age}세` : "-"}</td>
                <td style={styles.td}>{fmt(r.self.total)}</td>
                <td style={styles.td}>{r.spouse ? fmt(r.spouse.total) : "-"}</td>
                <td style={styles.td}><strong>{fmt(r.household)}</strong></td>
                <td style={styles.td}>{remark(r)}</td>
              </tr>
            ))}
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
  pdfButton: { fontSize: "0.75rem", padding: "6px 12px", fontWeight: 700 },
  title: { fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  tableTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" },
  subtitle: { fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  kpi: { border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", backgroundColor: "var(--background)" },
  kpiLabel: { fontSize: "0.78rem", color: "var(--text-muted)" },
  kpiValue: { fontSize: "1.15rem", fontWeight: 700, color: "var(--text-accent)", marginTop: "4px" },
  kpiHint: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" },
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
