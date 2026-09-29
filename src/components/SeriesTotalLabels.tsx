"use client";

import React from "react";
import { usePlotArea, useXAxisScale, useYAxisScale } from "recharts";

export interface SeriesTotalLabel {
  key: string; // 차트 dataKey
  text: string; // 예: (41,000만원/70,000만원)
}

interface Props {
  data: Record<string, number>[];
  xKey: string;
  stack: string[]; // 아래부터 쌓는 순서 (그래프에 보이는 계열만)
  labels: SeriesTotalLabel[];
}

// 누적 영역 그래프 안에서 각 연금 층이 가장 두꺼운 해의 가운데에 글자를 적는다 (차트의 자식으로 넣어 쓴다)
// 층이 너무 얇으면 층 바로 위에 적는다
export default function SeriesTotalLabels({ data, xKey, stack, labels }: Props) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;

  return (
    <g pointerEvents="none">
      {labels.map(({ key, text }) => {
        const idx = stack.indexOf(key);
        if (idx < 0) return null;
        // 두께가 최대의 절반 이상인 해들 가운데 한가운데 해 (층이 줄거나 늘어도 시작·끝 경사면에 붙지 않게)
        const max = Math.max(0, ...data.map((d) => d[key] || 0));
        if (max <= 0) return null;
        const thick = data.map((d, i) => ((d[key] || 0) >= max * 0.5 ? i : -1)).filter((i) => i >= 0);
        const best = thick[Math.floor(thick.length / 2)];
        const bestValue = data[best][key] || 0;

        const row = data[best];
        const base = stack.slice(0, idx).reduce((sum, k) => sum + (row[k] || 0), 0);
        const yTop = yScale(base + bestValue);
        const yBottom = yScale(base);
        const xRaw = xScale(row[xKey]);
        if (yTop === undefined || yBottom === undefined || xRaw === undefined) return null;

        // 글자가 그래프 밖으로 나가지 않게 가로 위치를 안쪽으로 당긴다
        const x = Math.min(Math.max(xRaw, plot.x + 75), plot.x + plot.width - 75);
        const y = yBottom - yTop >= 14 ? (yTop + yBottom) / 2 + 4 : yTop - 4;
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="var(--text-primary)"
            stroke="var(--surface)"
            strokeWidth={3}
            paintOrder="stroke"
          >
            {text}
          </text>
        );
      })}
    </g>
  );
}
