"use client";

import React from "react";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: any;
}

interface Props {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  labelSuffix?: string; // 제목 뒤에 붙일 단위 (예: "세")
  hideZero?: boolean; // 값이 0인 항목 숨김
  colors?: Record<string, string>; // 항목 이름별 점 색 (선 색과 다르게 보일 때)
  showTotal?: boolean; // 제목 오른쪽에 항목 합계 표시 (누적 차트용)
  totalLabel?: string; // 합계 라벨 (기본값 "합계", 예: "월 연금 합계")
  excludeFromTotal?: (string | number)[]; // 합계 계산에서 제외할 dataKey 또는 name
  unit?: string; // 금액 단위 (예: "만원/월")
  notes?: Record<string, string>; // 항목 이름별 보조 문구 (예: 납부총액/지급총액)
}

const DEFAULT_EXCLUDED_KEYS = new Set([
  "targetSpending",
  "minSpending",
  "totalPostTax",
  "맞춤 지출 목표선",
  "맞춤지출목표선",
  "맞춤 지출 목표선(의료비 포함)",
  "최저 생활비선",
  "최저생활비선",
  "실질 세후 수령액",
  "명목 세후 수령액",
]);

// Recharts 툴팁: 테마 색상 변수(라이트·다크 모두)와 작은 글씨, 항목별 색 점 (대시보드 인출전략 차트와 같은 모양)
export default function ChartTooltip({
  active,
  payload,
  label,
  labelSuffix = "",
  hideZero = false,
  colors,
  showTotal = false,
  totalLabel = "합계",
  excludeFromTotal,
  unit = "만원",
  notes,
}: Props) {
  if (!active || !payload?.length) return null;
  const rows = hideZero ? payload.filter((e) => Number(e.value) !== 0) : payload;
  if (rows.length === 0) return null;

  const excluded = new Set([
    ...Array.from(DEFAULT_EXCLUDED_KEYS),
    ...(excludeFromTotal ? excludeFromTotal.map(String) : []),
  ]);

  const total = rows
    .filter((e) => {
      const dataKey = e.dataKey !== undefined ? String(e.dataKey) : "";
      const name = e.name !== undefined ? String(e.name) : "";
      return !excluded.has(dataKey) && !excluded.has(name);
    })
    .reduce((sum, e) => sum + (Number(e.value) || 0), 0);

  return (
    <div style={styles.box}>
      <p style={styles.title}>
        <span>{label}{labelSuffix}</span>
        {showTotal && <span>{totalLabel} {Math.round(total).toLocaleString()} {unit}</span>}
      </p>
      <div style={styles.list}>
        {rows.map((e) => (
          <div key={String(e.name)} style={styles.row}>
            <div style={styles.nameWrap}>
              <span style={{ ...styles.dot, backgroundColor: colors?.[String(e.name)] ?? e.color }} />
              <span style={styles.name}>{e.name}</span>
            </div>
            <span style={styles.value}>
              {Math.round(Number(e.value) || 0).toLocaleString()} {unit}
              {notes?.[String(e.name)] && <span style={styles.note}> {notes[String(e.name)]}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  box: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    boxShadow: "var(--shadow-premium)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  title: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    margin: "0 0 6px 0",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "6px",
  },
  list: { display: "flex", flexDirection: "column", gap: "5px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" },
  nameWrap: { display: "flex", alignItems: "center", gap: "6px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%" },
  name: { fontSize: "0.72rem", color: "var(--text-secondary)" },
  value: { fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" },
  note: { fontWeight: 500, color: "var(--text-muted)" },
};
