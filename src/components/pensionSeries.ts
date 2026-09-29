// 부부 통합 시뮬레이션·인출전략 그래프가 함께 쓰는 연금 계열 (쌓는 순서대로)
// 같은 종류는 같은 색 계열로 본인 진하게·배우자 연하게
// 유족연금 층은 선을 본인국민연금과 같은 보라로 이어 그리되, 채우기·범례·툴팁 색은 톤다운된 분홍
export const SURVIVOR_FILL = "#9d5c7d";

export const PENSION_SERIES: { key: string; color: string; fill?: string }[] = [
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
