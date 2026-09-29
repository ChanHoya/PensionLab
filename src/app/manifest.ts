import type { MetadataRoute } from "next";

// 「홈 화면에 추가」로 연 앱은 브라우저 탭·주소창 없이 보이게 한다 (아이폰은 전체화면 API 대신 이 방식)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PensionLab - 다층 연금 통합 시뮬레이터",
    short_name: "PensionLab",
    start_url: "/",
    display: "standalone",
    background_color: "#0f111a",
    theme_color: "#0f111a",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
