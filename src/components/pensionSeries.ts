import type { CoupleYear } from "@/services/coupleSimulation";

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
  { key: "주택연금", color: "#f59e0b", fill: "#d97706" },
];

// 통합 시뮬레이션 한 해의 계열별 월 금액. 사망 후 남은 배우자가 받는 유족연금은 사망자 국민연금에서 온 몫이라 따로 표시
// (본인국민연금 층과 이어지게 바로 위에 쌓음). divisor로 나누면 현재가치 등 다른 기준 (기본: 명목)
export function pensionSeriesValues(r: CoupleYear, divisor: number = 1): Record<string, number> {
  const v = (x: number) => Math.round(x / divisor);
  return {
    본인국민연금: v(r.self.national - r.self.survivorPart),
    유족연금: v(r.self.survivorPart + (r.spouse?.survivorPart ?? 0)),
    배우자국민연금: v((r.spouse?.national ?? 0) - (r.spouse?.survivorPart ?? 0)),
    "본인 기초연금": v(r.self.basic),
    "배우자 기초연금": v(r.spouse?.basic ?? 0),
    "본인 퇴직연금": v(r.self.retirement),
    "배우자 퇴직연금": v(r.spouse?.retirement ?? 0),
    "본인 개인연금": v(r.self.personal + r.self.insurance),
    "배우자 개인연금": v((r.spouse?.personal ?? 0) + (r.spouse?.insurance ?? 0)),
    주택연금: v((r.self.housing || 0) + (r.spouse?.housing || 0)), // 본인 사망 후에는 배우자가 승계
  };
}

// 범례 클릭 강조: 고른 계열만 깜빡이고(area-blink) 나머지는 흐리게. highlight가 없으면 원래 투명도
export function emphasisProps(highlight: string | null, key: string, fillOpacity: number) {
  if (!highlight) return { fillOpacity, strokeOpacity: 1 };
  return key === highlight
    ? { fillOpacity, strokeOpacity: 1, className: "area-blink" }
    : { fillOpacity: 0.06, strokeOpacity: 0.2 };
}
