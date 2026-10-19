import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PensionLab - 대한민국 다층 연금 통합 시뮬레이터",
    short_name: "PensionLab",
    description: "국민연금, 퇴직연금, 개인연금 통합 인출 전략 및 2026 개정 세법 기반 맞춤 은퇴 자산관리 플랫폼",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0f172a",
    theme_color: "#3b82f6",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
