"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import dynamic from "next/dynamic";

const PdfViewerModal = dynamic(() => import("@/components/PdfViewerModal"), {
  ssr: false,
});

export default function LandingPage() {
  const [pdfConfig, setPdfConfig] = useState({
    isOpen: false,
    url: "/Pension_Blueprint.pdf",
    title: "서비스 소개",
  });
  const [activeMenu, setActiveMenu] = useState<"service-intro" | "pension-reform" | "youtube-tips" | null>(null);

  const getNavStyle = (menuId: "service-intro" | "pension-reform" | "youtube-tips") => {
    return {
      ...styles.navButtonBase,
      ...(activeMenu === menuId ? styles.navButtonActive : styles.navButtonInactive),
    };
  };

  return (
    <>
    <main style={styles.container}>
      {/* Decorative Blur Backgrounds */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Navigation Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link
            href="/"
            onClick={() => setActiveMenu(null)}
            style={{ ...styles.logo, textDecoration: "none" }}
          >
            Pension<span className="gradient-text">Lab</span>
          </Link>
          <nav style={styles.navLinks}>
            <button
              id="btn-service-intro"
              onClick={() => {
                setActiveMenu("service-intro");
                setPdfConfig({ isOpen: true, url: "/Pension_Blueprint.pdf", title: "서비스 소개" });
              }}
              style={getNavStyle("service-intro")}
            >
              서비스 소개
            </button>
            <button
              id="btn-pension-reform"
              onClick={() => {
                setActiveMenu("pension-reform");
                setPdfConfig({ isOpen: true, url: "/2026_Pension_Reform.pdf", title: "2026 연금 개혁안" });
              }}
              style={getNavStyle("pension-reform")}
            >
              연금 개혁안 정보
            </button>
            <button
              id="btn-youtube-tips"
              onClick={() => {
                setActiveMenu("youtube-tips");
                alert("유튜브 전문가 팁은 온보딩 완료 후 대시보드의 'AI 연금 Q&A' 코너에서 관련 동영상과 함께 실시간으로 제공됩니다!\n\n우측 상단의 '시작하기' 버튼을 눌러 연금 설계를 시작해 보세요.");
              }}
              style={getNavStyle("youtube-tips")}
            >
              유튜브 전문가 팁
            </button>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
            <Link href="/onboarding" className="premium-button" style={{ padding: "8px 20px", fontSize: "0.9rem" }} id="btn-header-start">
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection} className="animate-fade-in">
        <h1 style={styles.heroTitle}>
          흩어진 나의 모든 연금 자산,<br />
          <span className="gradient-text">한눈에 설계하고 분석하다</span>
        </h1>
        <p style={styles.heroSubtitle}>
          복잡한 국민연금법 개정안부터 기초연금, 회사 퇴직연금, 그리고 개인연금까지.<br />
          수동 입력만으로 안전하고 정확한 미래 은퇴 소득 시뮬레이션을 무료로 시작해 보세요.
        </p>

      </section>

      {/* 3층 연금 구조 도식화 이미지 영역 */}
      <div style={styles.diagramContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pension_structure.png"
          alt="튼튼한 노후를 짓는 3층 연금 마법 블록 구조"
          style={styles.diagramImage}
        />
      </div>
    </main>

    {/* PDF 서비스 소개 및 연금 개혁안 모달 */}
    <PdfViewerModal
      isOpen={pdfConfig.isOpen}
      onClose={() => {
        setPdfConfig((prev) => ({ ...prev, isOpen: false }));
        setActiveMenu(null);
      }}
      pdfUrl={pdfConfig.url}
      title={pdfConfig.title}
    />
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "var(--background)",
    position: "relative",
    // overflow: hidden 제거 → 스크롤 가능
  },
  bgGlow1: {
    position: "fixed",
    top: "-20%",
    left: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, transparent 75%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    top: "30%",
    right: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, transparent 75%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    position: "sticky",
    top: 0,
    width: "100%",
    padding: "16px 40px",
    zIndex: 100,
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--primary)",
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    gap: "32px",
    alignItems: "center",
  },
  navButtonBase: {
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "all 0.15s ease",
    borderRadius: "6px",
    padding: "6px 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  navButtonActive: {
    color: "#a5b4fc",
    background: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    fontWeight: 600,
  },
  navButtonInactive: {
    color: "var(--text-secondary)",
    background: "transparent",
    border: "1px solid transparent",
    fontWeight: 500,
  },
  heroSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "32px 20px 16px 20px",
    maxWidth: "800px",
    zIndex: 1,
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    lineHeight: 1.3,
    letterSpacing: "-0.5px",
    marginBottom: "16px",
  },
  heroSubtitle: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    marginBottom: "24px",
  },
  diagramContainer: {
    width: "100%",
    maxWidth: "1000px",
    backgroundColor: "#ffffff",
    padding: "16px",
    borderRadius: "20px",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
    margin: "0 auto 40px auto",
    zIndex: 1,
  },
  diagramImage: {
    width: "100%",
    height: "auto",
    borderRadius: "12px",
  },
};
