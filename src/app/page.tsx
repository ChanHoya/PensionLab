"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <main style={styles.container}>
      {/* Decorative Blur Backgrounds */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Navigation Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            Pension<span style={{ color: "var(--secondary)" }}>Lab</span>
          </div>
          <nav style={styles.navLinks}>
            <span style={styles.navItem}>서비스 소개</span>
            <span style={styles.navItem}>연금 개혁안 정보</span>
            <span style={styles.navItem}>유튜브 전문가 팁</span>
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
        <span style={styles.badge}>🚀 2026년 국민연금 개혁안 공식 반영</span>
        <h1 style={styles.heroTitle}>
          흩어진 나의 모든 연금 자산,<br />
          <span className="gradient-text">한눈에 설계하고 분석하다</span>
        </h1>
        <p style={styles.heroSubtitle}>
          복잡한 국민연금법 개정안부터 기초연금, 회사 퇴직연금, 그리고 개인연금까지.<br />
          수동 입력만으로 안전하고 정확한 미래 은퇴 소득 시뮬레이션을 무료로 시작해 보세요.
        </p>

        <div style={styles.ctaGroup}>
          <Link href="/onboarding" className="premium-button" style={styles.mainCta} id="btn-hero-start">
            무료로 3층 연금 설계하기 ➔
          </Link>
          <span style={styles.ctaSubtext}>⏱️ 소요 시간 단 3분 · 회원가입 없음</span>
        </div>
      </section>

      {/* Stats Row */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>3<span style={{ color: "var(--accent)" }}>층</span></span>
            <span style={styles.statLabel}>연금 통합 분석</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statNumber}>2026<span style={{ color: "var(--secondary)", fontSize: "1.2rem" }}>년</span></span>
            <span style={styles.statLabel}>개혁안 완벽 반영</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statNumber}>100<span style={{ color: "var(--accent)" }}>%</span></span>
            <span style={styles.statLabel}>로컬 저장 · 개인정보 안심</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statNumber}>무<span style={{ color: "var(--secondary)" }}>료</span></span>
            <span style={styles.statLabel}>회원가입 없이 시작</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>PensionLab의 핵심 은퇴 설계 기능</h2>
        <div style={styles.featuresGrid}>
          {/* Card 1 */}
          <div style={styles.featureCard} className="premium-card">
            <div style={{ ...styles.iconContainer, backgroundColor: "var(--primary-50)", color: "var(--primary)" }}>
              📊
            </div>
            <h3 style={styles.cardTitle}>3층 연금 통합 대시보드</h3>
            <p style={styles.cardDesc}>
              국민연금(1층), 퇴직연금(2층), 개인연금(3층)을 시각화하여 은퇴 후 매달 받게 될 실질 수령액 합계를 한눈에 보여줍니다.
            </p>
          </div>

          {/* Card 2 */}
          <div style={styles.featureCard} className="premium-card">
            <div style={{ ...styles.iconContainer, backgroundColor: "var(--primary-50)", color: "var(--primary)" }}>
              ⚙️
            </div>
            <h3 style={styles.cardTitle}>2026 개혁안 시뮬레이터</h3>
            <p style={styles.cardDesc}>
              세대별 보험료율 차등 인상 스케줄(9% ➔ 13%) 및 소득대체율 변화를 완벽히 반영하여 연령에 맞는 예상 연금액을 산출합니다.
            </p>
          </div>

          {/* Card 3 */}
          <div style={styles.featureCard} className="premium-card">
            <div style={{ ...styles.iconContainer, backgroundColor: "rgba(249, 115, 22, 0.1)", color: "var(--accent)" }}>
              🤖
            </div>
            <h3 style={styles.cardTitle}>유튜브 전문가 RAG 상담</h3>
            <p style={styles.cardDesc}>
              연금박사, 박곰희TV 등 신뢰도 높은 전문가들의 핵심 유튜브 자막을 AI RAG 모델로 학습하여 질문에 명쾌한 답변을 드립니다.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy / Trust Section */}
      <section style={styles.trustSection}>
        <div style={styles.trustCard}>
          <div style={styles.trustIcon}>🔒</div>
          <div>
            <h3 style={styles.trustTitle}>개인정보 안심 보장</h3>
            <p style={styles.trustDesc}>
              입력하신 모든 연금 정보는 서버에 저장되지 않으며, 오직 현재 기기의 브라우저(LocalStorage)에만 안전하게 보관됩니다.
              다른 기기로 이전할 때는 JSON 백업 기능을 이용해 주세요.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 PensionLab. All rights reserved.</p>
        <p style={{ fontSize: "0.8rem", marginTop: "4px", color: "var(--text-muted)" }}>
          본 서비스는 법적 효력을 갖는 은퇴 자문이 아니며, 사용자의 수동 입력 수치 및 공시 정보를 바탕으로 한 모의 시뮬레이션 결과만 제공합니다.
        </p>
      </footer>
    </main>
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
  },
  navItem: {
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "color var(--transition-fast)",
  },
  heroSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "120px 20px 80px 20px",
    maxWidth: "850px",
    zIndex: 1,
  },
  badge: {
    display: "inline-block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--primary-700)",
    backgroundColor: "var(--primary-50)",
    padding: "6px 16px",
    borderRadius: "var(--radius-full)",
    marginBottom: "24px",
    border: "1px solid var(--primary-200)",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    lineHeight: 1.25,
    letterSpacing: "-1px",
    marginBottom: "24px",
  },
  heroSubtitle: {
    fontSize: "1.15rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    marginBottom: "40px",
  },
  ctaGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  mainCta: {
    fontSize: "1.15rem",
    padding: "16px 40px",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
  },
  ctaSubtext: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
  },
  statsSection: {
    width: "100%",
    maxWidth: "1200px",
    padding: "0 20px 60px 20px",
    zIndex: 1,
  },
  statsGrid: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--surface)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-md)",
    padding: "32px 0",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },
  statNumber: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--primary)",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  statDivider: {
    width: "1px",
    height: "60px",
    backgroundColor: "var(--border)",
  },
  featuresSection: {
    width: "100%",
    maxWidth: "1200px",
    padding: "0 20px 80px 20px",
    zIndex: 1,
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: "2rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "48px",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "30px",
  },
  featureCard: {
    padding: "40px 30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "12px",
  },
  cardDesc: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  trustSection: {
    width: "100%",
    maxWidth: "1200px",
    padding: "0 20px 80px 20px",
    zIndex: 1,
  },
  trustCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "24px",
    backgroundColor: "var(--primary-50)",
    border: "1px solid var(--primary-100)",
    borderRadius: "var(--radius-md)",
    padding: "32px 40px",
  },
  trustIcon: {
    fontSize: "2.5rem",
    flexShrink: 0,
  },
  trustTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  trustDesc: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  footer: {
    width: "100%",
    borderTop: "1px solid var(--border)",
    padding: "40px 20px",
    textAlign: "center",
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    backgroundColor: "var(--surface)",
    zIndex: 1,
  },
};
