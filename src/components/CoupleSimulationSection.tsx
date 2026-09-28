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
} from "recharts";
import type { CoupleSimulationResult, CoupleYear, PersonYear } from "@/services/coupleSimulation";
import { usePensionStore, type SimulationParamsState } from "@/store/usePensionStore";
import { NPS_RULES } from "@/config/npsRules";
import ChartTooltip from "@/components/ChartTooltip";
import { downloadElementAsPdf } from "@/utils/exportPdf";

const fmt = (v: number) => Math.round(v).toLocaleString();
const WHO_LABEL = { SELF: "본인", SPOUSE: "배우자" } as const;

interface Props {
  result: CoupleSimulationResult;
  selfStartAge: number; // 본인 국민연금 개시 나이
  spouseStartAge: number; // 배우자 국민연금 개시 나이 (연기 반영)
  actions?: React.ReactNode; // 제목 오른쪽 버튼 (백업·복원)
}

// x축 눈금: 연도 아래에 본인·배우자 나이 (사망 후에는 -)
function YearAgeTick({ x, y, payload, rowsByYear }: { x?: number; y?: number; payload?: { value: number }; rowsByYear: Map<number, CoupleYear> }) {
  const r = payload ? rowsByYear.get(Number(payload.value)) : undefined;
  const age = (p: PersonYear | null | undefined) => (p && p.alive ? `${p.age}세` : "-");
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="var(--text-muted)" fontSize={11}>
        <tspan x={0} dy={12}>{payload?.value}</tspan>
        {r && <tspan x={0} dy={13}>{age(r.self)}</tspan>}
        {r?.spouse && <tspan x={0} dy={13}>{age(r.spouse)}</tspan>}
      </text>
    </g>
  );
}

// 부부 통합 연금 시뮬레이션: 본인·배우자 × 국민·기초·퇴직·개인연금 가구 합산 (명목, 만원/월)
export default function CoupleSimulationSection({ result, selfStartAge, spouseStartAge, actions }: Props) {
  const { rows, firstDeath, lifetime } = result;
  const store = usePensionStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
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
  const params = store.simulationParams;
  const setParam = (data: Partial<SimulationParamsState>) => store.setSimulationParams(data);
  const deferSelect = (value: number, baseAge: number, key: "nationalPensionDeferYears" | "spouseNationalPensionDeferYears") => (
    <select className="premium-input" value={value} onChange={(e) => setParam({ [key]: Number(e.target.value) })}>
      {Array.from({ length: NPS_RULES.maxDeferralYears + 1 }, (_, y) => (
        <option key={y} value={y}>
          {y === 0 ? `연기 안 함 (${baseAge}세부터)` : `${y}년 연기 · ${baseAge + y}세부터 (+${(NPS_RULES.deferralBonusPerYear * y * 100).toFixed(1)}%)`}
        </option>
      ))}
    </select>
  );
  // 가구 소득 평탄화: 본인 수령 종료 나이 = 부부 사적연금 소진 나이(비우면 본인 기대수명), 배우자 칸은 쓰지 않음
  const smoothing = params.householdIncomeSmoothing;
  const endAgeInput = (value: number, key: "privatePensionEndAge" | "spousePrivatePensionEndAge") => {
    const unused = smoothing && key === "spousePrivatePensionEndAge";
    const placeholder = unused
      ? "평탄화 중에는 본인 칸 기준"
      : smoothing
        ? `소진 나이 · 비우면 ${params.expectedLifeExpectancy}세(기대수명)`
        : "비우면 상품별 기본 기간";
    return (
      <input type="number" min={0} className="premium-input" disabled={unused} placeholder={placeholder} value={value || ""}
        onChange={(e) => setParam({ [key]: Number(e.target.value) })} />
    );
  };
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

  const chartData = rows.map((r) => ({
    year: r.year,
    본인국민연금: Math.round(r.self.national),
    배우자국민연금: Math.round(r.spouse?.national ?? 0),
    기초연금: Math.round(r.self.basic + (r.spouse?.basic ?? 0)),
    퇴직연금: Math.round(r.self.retirement + (r.spouse?.retirement ?? 0)),
    개인연금보험: Math.round(r.self.personal + r.self.insurance + (r.spouse?.personal ?? 0) + (r.spouse?.insurance ?? 0)),
  }));

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
        <h3 style={styles.title}>👫 부부 통합 연금 시뮬레이션</h3>
        {/* 버튼은 PDF 캡처에서 제외 */}
        <div data-html2canvas-ignore style={styles.headerActions}>
          <button type="button" onClick={handlePdf} disabled={pdfBusy} className="premium-button-secondary" style={styles.pdfButton}>
            {pdfBusy ? "PDF 생성 중..." : "📄 PDF 다운로드"}
          </button>
          {actions}
        </div>
      </div>
      <p style={styles.subtitle}>
        본인·배우자의 국민연금·기초연금·퇴직연금·개인연금을 연도별로 합산합니다. 먼저 사망한 쪽이 생기면 남은 배우자는
        국민연금법 제56조에 따라 유족연금(사망자 연금의 가입기간별 40~60%)과 「본인 연금 + 유족연금 30%」 중 큰 쪽을 받습니다. (명목 금액, 만원/월)
      </p>

      <div style={styles.optionGrid}>
        <div style={styles.optionField}>
          <label style={styles.optionLabel}>본인 국민연금 수령 시작</label>
          {deferSelect(params.nationalPensionDeferYears, params.nationalPensionStartAge, "nationalPensionDeferYears")}
        </div>
        <div style={styles.optionField}>
          <label style={styles.optionLabel}>배우자 국민연금 수령 시작</label>
          {deferSelect(params.spouseNationalPensionDeferYears, params.spouseNationalPensionStartAge, "spouseNationalPensionDeferYears")}
        </div>
        <div style={styles.optionField}>
          <label style={styles.optionLabel}>본인 퇴직·개인연금 수령 종료 나이</label>
          {endAgeInput(params.privatePensionEndAge, "privatePensionEndAge")}
        </div>
        <div style={styles.optionField}>
          <label style={styles.optionLabel}>배우자 퇴직·개인연금 수령 종료 나이</label>
          {endAgeInput(params.spousePrivatePensionEndAge, "spousePrivatePensionEndAge")}
        </div>
        <div style={styles.optionField}>
          <label style={styles.optionLabel}>퇴직·개인연금 인출 방식</label>
          <select className="premium-input" value={smoothing ? "SMOOTH" : params.decumulationStrategy}
            onChange={(e) =>
              setParam(
                e.target.value === "SMOOTH"
                  ? { householdIncomeSmoothing: true, decumulationStrategy: "FLAT" }
                  : { householdIncomeSmoothing: false, decumulationStrategy: e.target.value as SimulationParamsState["decumulationStrategy"] }
              )
            }>
            <option value="DECREASING">완만한 체감 (초기에 조금 많이, 매년 2%씩 감소)</option>
            <option value="FLAT">균등 수령 (매년 같은 금액)</option>
            <option value="SMOOTH">가구 소득 평탄화 (국민연금 위에 부족분만 채움)</option>
          </select>
        </div>
      </div>
      <p style={styles.note}>
        ※ 국민연금은 최대 {NPS_RULES.maxDeferralYears}년 연기할 수 있고 1년마다 {(NPS_RULES.deferralBonusPerYear * 100).toFixed(1)}%(월 0.6%) 늘어납니다.
        유족연금은 연기 가산 전 금액 기준입니다. 수령 종료 나이를 정하면 퇴직연금·개인연금·연금보험을 그 나이까지 나눠 먼저 받습니다
        (기간이 짧아지는 만큼 월 수령액이 커짐). 인출 방식은 적립금 총액이 같도록 맞춘 배분 방식이며 인출전략(S0~S4)에도 같이 적용됩니다.
        퇴직·개인연금 수령액은 기초연금 소득인정액에도 자동 반영됩니다.
      </p>

      <div style={styles.kpiGrid}>
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>부부 모두 국민연금 수령 시 가구 월 연금</div>
          <div style={styles.kpiValue}>{bothReceiving ? `${fmt(bothReceiving.household)} 만원` : "-"}</div>
          <div style={styles.kpiHint}>{bothReceiving ? `${bothReceiving.year}년 (본인 ${bothReceiving.self.age}세 / 배우자 ${bothReceiving.spouse!.age}세)` : "수령 기간이 겹치지 않음"}</div>
        </div>
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>첫 사망 전 → 후 가구 월 연금</div>
          <div style={styles.kpiValue}>
            {beforeDeath && afterDeath ? `${fmt(beforeDeath.household)} → ${fmt(afterDeath.household)} 만원` : "-"}
          </div>
          <div style={styles.kpiHint}>
            {firstDeath ? `${WHO_LABEL[firstDeath.who]} 기대수명 이후 (${firstDeath.year}년)` : "배우자 정보 없음"}
          </div>
        </div>
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>생애 누적 가구 수령액</div>
          <div style={styles.kpiValue}>{fmt(lifetime.household)} 만원</div>
          <div style={styles.kpiHint}>본인 {fmt(lifetime.self)} · 배우자 {fmt(lifetime.spouse)}</div>
        </div>
      </div>

      {sm && (
        <div style={styles.infoAlert}>
          {sm.pot > 0 ? (
            <>
              📏 <strong>가구 소득 평탄화</strong>: {sm.startYear}년 가구 월 <strong>{fmt(sm.levelMonthly)}만원</strong>
              (현재가치 {fmt(sm.levelToday)}만원)에서 시작해 {sm.endYear}년까지 매년 물가만큼 늘어나는 총액을 유지하고,
              그해까지 퇴직·개인연금을 모두 소진한 뒤에는 국민연금만 받습니다. 국민연금이 시작·증가하는 만큼 사적연금을 줄여
              채우므로 총액이 튀지 않고, 국민연금 개시 전에 사적연금을 더 많이 씁니다.
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

      {survivor && survivor.survivorChoice && (
        <div style={styles.infoAlert}>
          🕊 {firstDeath && WHO_LABEL[firstDeath.who]} 사망 후 남은 배우자는{" "}
          <strong>{survivor.survivorChoice === "SURVIVOR" ? "유족연금" : "본인 노령연금 + 유족연금 30%"}</strong>을 선택해
          국민연금 월 <strong>{fmt(survivor.national)}만원</strong>을 받는 것이 유리합니다. 사망자의 퇴직·개인연금 잔액 상속은 반영하지 않았습니다.
        </div>
      )}

      <p style={{ ...styles.note, textAlign: "right" }}>가로축: 연도 / 본인 나이 / 배우자 나이 (사망 후 -)</p>
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" stroke="var(--text-muted)" tick={<YearAgeTick rowsByYear={rowsByYear} />} height={52} />
            <YAxis tickFormatter={(v) => fmt(Number(v))} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip content={<ChartTooltip labelSuffix="년" hideZero />} />
            <Legend />
            <Area type="monotone" dataKey="본인국민연금" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
            <Area type="monotone" dataKey="배우자국민연금" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
            <Area type="monotone" dataKey="기초연금" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
            <Area type="monotone" dataKey="퇴직연금" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
            <Area type="monotone" dataKey="개인연금보험" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
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
      <p style={styles.note}>
        ※ 각자의 기대수명까지 생존한다고 가정합니다. 기초연금은 해마다 가구 소득인정액으로 다시 판정합니다
        (한 사람만 65세 이상이면 감액 없음, 둘 다 받으면 각 20% 감액, 사망 후 단독가구 기준).
        배우자 유족연금의 50세 미만 지급정지·재혼 등 예외는 반영하지 않았습니다.
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
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  optionField: { display: "flex", flexDirection: "column", gap: "6px" },
  optionLabel: { fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" },
  subtitle: { fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  kpi: { border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", backgroundColor: "var(--background)" },
  kpiLabel: { fontSize: "0.78rem", color: "var(--text-muted)" },
  kpiValue: { fontSize: "1.15rem", fontWeight: 700, color: "var(--text-accent)", marginTop: "4px" },
  kpiHint: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" },
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
