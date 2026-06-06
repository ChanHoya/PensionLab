import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PensionLab - 대한민국 다층 연금 시뮬레이션 및 설계",
  description: "국민연금, 기초연금, 퇴직연금, 개인연금저축 및 연금보험을 한눈에 파악하고 2026년 연금 개혁을 반영한 실시간 은퇴 설계를 지원하는 플랫폼",
};

// 다크모드 초기화 스크립트 — 페이지 로드 시 깜빡임(FOUC) 방지
const darkModeScript = `
(function() {
  try {
    var saved = localStorage.getItem('pensionlab_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = saved === 'dark' || (!saved && prefersDark);
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body id="pensionlab-root">
        {children}
      </body>
    </html>
  );
}
