"use client";

import React from "react";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface Props {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  labelSuffix?: string; // 제목 뒤에 붙일 단위 (예: "세")
  hideZero?: boolean; // 값이 0인 항목 숨김
  colors?: Record<string, string>; // 항목 이름별 점 색 (선 색과 다르게 보일 때)
}

// Recharts 툴팁: 테마 색상 변수(라이트·다크 모두)와 작은 글씨, 항목별 색 점 (대시보드 인출전략 차트와 같은 모양)
export default function ChartTooltip({ active, payload, label, labelSuffix = "", hideZero = false, colors }: Props) {
  if (!active || !payload?.length) return null;
  const rows = hideZero ? payload.filter((e) => Number(e.value) !== 0) : payload;
  if (rows.length === 0) return null;

  return (
    <div style={styles.box}>
      <p style={styles.title}>{label}{labelSuffix}</p>
      <div style={styles.list}>
        {rows.map((e) => (
          <div key={String(e.name)} style={styles.row}>
            <div style={styles.nameWrap}>
              <span style={{ ...styles.dot, backgroundColor: colors?.[String(e.name)] ?? e.color }} />
              <span style={styles.name}>{e.name}</span>
            </div>
            <span style={styles.value}>{Math.round(Number(e.value) || 0).toLocaleString()} 만원</span>
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
};
