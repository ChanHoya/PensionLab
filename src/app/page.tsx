"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import dynamic from "next/dynamic";

const PdfViewerModal = dynamic(() => import("@/components/PdfViewerModal"), {
  ssr: false,
});

const LIBRARY_DOCUMENTS = [
  {
    title: "연금 개혁안",
    url: "/2026_Pension_Reform.pdf",
    desc: "2026년부터 단계적으로 인상되는 국민연금 보험료율 및 소득대체율 개혁안 상세 분석 가이드"
  },
  {
    title: "연금 조기/정상/연기 수령 비교",
    url: "/Strategic_Pension_Optimization.pdf",
    desc: "수령 시점에 따른 실수령액 시뮬레이션 및 개인 노후 사정에 맞춘 최적 수령 전략 보고서"
  },
  {
    title: "ISA/연금저축/IRP 마스터플랜",
    url: "/2026_Retirement_Defense_Manual.pdf",
    desc: "세액공제와 비과세 혜택을 극대화하는 장기 노후 자산 관리 핵심 3대 계좌 핵심 운용 매뉴얼"
  },
  {
    title: "장기 생존을 위한 코어-새틀라이트 전략",
    url: "/The_IRP_Master_Recipe.pdf",
    desc: "퇴직연금(IRP)의 장기 안정 자산(코어)과 자산 배분 펀드(새틀라이트) 최적 비율 배분 포트폴리오 레시피"
  }
];

const REFERENCE_SERVICES = [
  {
    title: "낙원계산기",
    url: "https://keep-ones.me",
    desc: "자산 수명과 원하는 은퇴 생활비 달성을 위해 필요한 은퇴 자산을 빠르게 역산해 주는 직관적인 계산기",
    point: "단 한 페이지로 구성된 초간편 UI/UX 및 목표 낙원자산 산출"
  },
  {
    title: "AI 은퇴자금 계산기 (Retir.eez)",
    url: "https://retire.ezinit.com",
    desc: "대화형 AI 인터페이스를 통해 질문에 가볍게 대답하며 노후 생활비를 시나리오별로 점검하는 도구",
    point: "토글 및 시나리오 플레이를 활용한 즉각적인 은퇴 금액 재계산"
  },
  {
    title: "cFIREsim (역사적 데이터 백테스터)",
    url: "https://cfiresim.com",
    desc: "미국 주식 및 채권의 역사적 자산 통계를 기반으로 은퇴 자산이 고갈되지 않는 생존 확률을 검증하는 도구",
    point: "역사적 통계(Historical Data)에 기반한 보수적이고 안전한 인출 성공률(Success Rate) 검증"
  },
  {
    title: "FiCalc (글로벌 은퇴 인출 전략 시뮬레이터)",
    url: "https://ficalc.app",
    desc: "매년 고정액 인출, 물가연동 인출, 자산 비례 인출 등 다양한 인출 규칙을 대입하여 결과를 비교하는 도구",
    point: "커스텀 인출 규칙(Withdrawal Strategies) 수립 및 비교"
  },
  {
    title: "금융감독원 통합연금포털",
    url: "https://100lifeplan.fss.or.kr",
    desc: "대한민국 국민의 3층 연금(국민, 퇴직, 개인) 가입 정보를 일괄 조회하여 포트폴리오를 제공하는 공식 포털",
    point: "65세 노령연금 개시 전 '소득 공백기(브릿지 기간)' 브릿지 설계에 필수 참고"
  }
];

export default function LandingPage() {
  const [pdfConfig, setPdfConfig] = useState({
    isOpen: false,
    url: "/Pension_Blueprint.pdf",
    title: "서비스 소개",
  });
  const [activeMenu, setActiveMenu] = useState<"service-intro" | "pension-library" | "reference-services" | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const getNavStyle = (menuId: "service-intro" | "pension-library" | "reference-services") => {
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
              id="btn-pension-library"
              onClick={() => {
                setActiveMenu("pension-library");
                setIsLibraryOpen(true);
              }}
              style={getNavStyle("pension-library")}
            >
              연금 정보창고
            </button>
            <button
              id="btn-reference-services"
              onClick={() => {
                setActiveMenu("reference-services");
                setIsReferenceOpen(true);
              }}
              style={getNavStyle("reference-services")}
            >
              참고 서비스
            </button>
            <Link 
              href="/onboarding" 
              className="premium-button" 
              style={{ padding: "8px 20px", fontSize: "0.9rem", textDecoration: "none" }} 
              id="btn-header-start"
            >
              진단 시작하기
            </Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Subtitle */}
      <section style={styles.heroSection} className="animate-fade-in">
        <p style={styles.heroSubtitle}>
          복잡한 국민연금법 개정안부터 기초연금, 회사 퇴직연금, 그리고 개인연금까지.&nbsp;
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

    {/* 참고 서비스 모달 */}
    {isReferenceOpen && (
      <div style={styles.libOverlay} onClick={() => { setIsReferenceOpen(false); setActiveMenu(null); }}>
        <div style={{ ...styles.libModal, maxWidth: "760px" }} onClick={(e) => e.stopPropagation()}>
          <div style={styles.libHeader}>
            <span style={styles.libTitle}>🔗 벤치마킹 참고 서비스</span>
            <button 
              onClick={() => { setIsReferenceOpen(false); setActiveMenu(null); }}
              style={styles.libCloseBtn}
            >
              ✕
            </button>
          </div>
          <div style={styles.libBody}>
            <p style={styles.libSubtitle}>Hoya Pension Lab의 은퇴 연산 엔진 설계에 영감을 준 국내외 대표적인 은퇴/인출 시뮬레이션 서비스 목록입니다.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {REFERENCE_SERVICES.map((srv, idx) => (
                <a 
                  key={idx} 
                  href={srv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...styles.libCard, textDecoration: "none", display: "flex", gap: "14px", alignItems: "flex-start", width: "100%" }}
                  className="premium-card animate-fade-in"
                >
                  <div style={{ ...styles.libCardIcon, fontSize: "1.4rem" }}>🔗</div>
                  <div style={{ ...styles.libCardContent, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                      <h4 style={{ ...styles.libCardTitle, color: "#a5b4fc" }}>{srv.title}</h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--primary-light)", textDecoration: "underline" }}>공식 사이트 바로가기 ↗</span>
                    </div>
                    <p style={{ ...styles.libCardDesc, marginTop: "4px" }}>{srv.desc}</p>
                    <div style={{ fontSize: "0.75rem", color: "var(--success-light)", marginTop: "6px", backgroundColor: "rgba(16, 185, 129, 0.08)", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                      💡 <strong>벤치마킹 포인트:</strong> {srv.point}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 연금 정보창고 모달 */}
    {isLibraryOpen && (
      <div style={styles.libOverlay} onClick={() => { setIsLibraryOpen(false); setActiveMenu(null); }}>
        <div style={styles.libModal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.libHeader}>
            <span style={styles.libTitle}>📚 연금 정보창고</span>
            <button 
              onClick={() => { setIsLibraryOpen(false); setActiveMenu(null); }}
              style={styles.libCloseBtn}
            >
              ✕
            </button>
          </div>
          <div style={styles.libBody}>
            <p style={styles.libSubtitle}> 은퇴 자산 설계를 돕는 연금 개혁안 및 자산 배분 전략 마스터 보고서 목록입니다.</p>
            <div style={styles.libGrid}>
              {LIBRARY_DOCUMENTS.map((doc, idx) => (
                <div 
                  key={idx} 
                  style={styles.libCard}
                  className="premium-card animate-fade-in"
                  onClick={() => {
                    setIsLibraryOpen(false);
                    setPdfConfig({ isOpen: true, url: doc.url, title: doc.title });
                  }}
                >
                  <div style={styles.libCardIcon}>📄</div>
                  <div style={styles.libCardContent}>
                    <h4 style={styles.libCardTitle}>{doc.title}</h4>
                    <p style={styles.libCardDesc}>{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* PDF 서비스 소개 및 연금 개혁안 모달 */}
    <PdfViewerModal
      isOpen={pdfConfig.isOpen}
      onClose={() => {
        setPdfConfig((prev) => ({ ...prev, isOpen: false }));
        if (activeMenu === "pension-library") {
          setIsLibraryOpen(true);
        } else {
          setActiveMenu(null);
        }
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
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "var(--background)",
    position: "relative",
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
    padding: "14px 20px 10px 20px",
    width: "100%",
    maxWidth: "900px",
    zIndex: 1,
    flexShrink: 0,
  },
  heroSubtitle: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    margin: 0,
  },
  diagramContainer: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: "1000px",
    backgroundColor: "#ffffff",
    padding: "12px",
    borderRadius: "20px",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
    margin: "0 auto 12px auto",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  diagramImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "12px",
    display: "block",
  },
  libOverlay: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(5, 6, 15, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  libModal: {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: "#161728",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    borderRadius: "16px",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  libHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
    backgroundColor: "rgba(22, 23, 40, 0.95)",
  },
  libTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#a5b4fc",
  },
  libCloseBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
  libBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  libSubtitle: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    marginBottom: "8px",
  },
  libGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  libCard: {
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--surface)",
    cursor: "pointer",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    transition: "all var(--transition-fast)",
  },
  libCardIcon: {
    fontSize: "1.5rem",
    marginTop: "2px",
  },
  libCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  libCardTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  libCardDesc: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    lineHeight: 1.4,
  },
};
