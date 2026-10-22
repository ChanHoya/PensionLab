// 검색 엔진 크롤러 대상 접근 규칙 및 사이트맵 위치 명세 (robots.txt)
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://pensionlabor.vercel.app/sitemap.xml",
  };
}
