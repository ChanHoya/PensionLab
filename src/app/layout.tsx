import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PensionLab - 대한민국 다층 연금 시뮬레이션 및 설계",
  description: "국민연금, 기초연금, 퇴직연금, 개인연금저축 및 연금보험을 한눈에 파악하고 2026년 연금 개혁을 반영한 실시간 은퇴 설계를 지원하는 플랫폼",
};

// 다크모드 기본값 초기화 — ETF Lens와 동일하게 다크 우선
const darkModeScript = `
(function() {
  try {
    var saved = localStorage.getItem('pensionlab_theme');
    var isDark = saved !== 'light'; // 명시적으로 'light'로 저장한 경우만 라이트모드
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body id="pensionlab-root">
        {children}
      </body>
    </html>
  );
}
