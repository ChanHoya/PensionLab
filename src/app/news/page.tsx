"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface Article {
  id: string;
  category: "국민·기초연금" | "퇴직·개인연금" | "자산관리";
  title: string;
  summary: string;
  date: string;
  author: string;
  content: string;
  image: string;
}

const mockArticles: Article[] = [
  {
    id: "1",
    category: "국민·기초연금",
    title: "2026 국민연금 개혁안 확정: 보험료율 9% ➔ 13% 단계적 인상",
    summary: "기금 고갈 우려를 해소하기 위해 현행 9%인 보험료율을 세대별로 차등을 두어 단계적으로 13%까지 인상하는 개혁안이 최종 확정되었습니다.",
    date: "2026-05-15",
    author: "보건복지부 연금정책과",
    image: "📊",
    content: `국회와 보건복지부는 국민연금의 지속 가능성을 제고하기 위해 보험료율을 기존 9%에서 13%로 단계적 인상하기로 최종 합의했습니다.

주요 골자는 다음과 같습니다:
1. **세대별 차등 인상**: 은퇴가 가까운 50대(연 1.0%p)부터 순차적으로 올리며, 젊은 세대인 20대(연 0.25%p)는 가장 천천히 인상하여 보험료 부담의 세대 간 형평성을 고려했습니다.
2. **소득대체율 조정**: 현행 40% 수준인 소득대체율을 기금 안정을 유도하는 선에서 최종 미세 조정했습니다.
3. **가입 상한 연령 조정**: 기존 59세인 의무 가입 연령을 수급 개시 연령인 65세에 맞추어 점진적으로 확대하는 방안도 장기 검토 과제로 포함되었습니다.

**내 연금에 미치는 영향:**
보험료 인상에 따라 미래에 지급받을 예상 연금액은 실질 가치 기준으로 보전되나, 매달 급여에서 공제되는 연금 기여금이 상승하므로 자금 흐름 계획을 미리 조정해야 합니다.`
  },
  {
    id: "2",
    category: "국민·기초연금",
    title: "기초연금 월 40만 원 인상 적용 및 수급 대상 가이드",
    summary: "소득하위 70% 어르신에게 지급되는 기초연금이 현행 30만 원대에서 최대 월 40만 원으로 단계적 인상되어 노후 소득 보장이 강화됩니다.",
    date: "2026-05-10",
    author: "국민연금연구원",
    image: "👵",
    content: `소득하위 70% 어르신들의 빈곤율 완화를 위해 기초연금이 최대 월 40만 원까지 인상 적용됩니다.

**주요 확인사항:**
1. **가구 유형별 차등**: 부부 가구의 경우 동시 수급 시 부부 감액(20%)이 적용되어 최대 수령액은 부부 합산 기준 약 64만 원선입니다.
2. **소득인정액 기준**: 단독가구와 부부가구의 소득인정액(근로소득 + 재산의 소득환산액)이 선정기준액 이하인 경우에만 자격이 유지됩니다.
3. **국민연금 연계 감액**: 국민연금 수령액이 기초연금액의 150%를 초과하는 경우 기초연금의 일부가 감액될 수 있어 대시보드 시뮬레이션에서 사전 검증이 필수적입니다.`
  },
  {
    id: "3",
    category: "퇴직·개인연금",
    title: "IRP/연금저축 세액공제 합산 한도 1,000만 원으로 확대",
    summary: "사적 연금 활성화를 촉진하기 위해 개인형 퇴직연금(IRP)과 연금저축의 합산 세액공제 대상 납입 한도가 기존 900만 원에서 1,000만 원으로 확대되었습니다.",
    date: "2026-04-28",
    author: "기획재정부 세제실",
    image: "💵",
    content: `정부는 국민들의 자발적인 사적연금 축적을 장려하기 위해 조세특례제한법을 개정하여 세액공제 혜택을 크게 늘렸습니다.

**세부 개정 내용:**
- **세액공제 한도**: 연금저축 단독 한도는 기존 600만 원으로 유지하되, **IRP를 포함한 합산 한도가 1,000만 원**으로 증액되었습니다.
- **세액공제율**: 종합소득금액에 따라 15%(연소득 4,500만 원 이하 또는 근로소득 5,500만 원 이하 가입자) 또는 12%의 공제율이 그대로 적용됩니다.
  - 최대 1,000만 원 납입 시, 연간 최대 **165만 원**의 세금 환급이 가능합니다.

**AI 관리사의 팁:**
IRP에 연 1,000만 원을 가득 채워 연말정산 혜택을 극대화하고, 납입 자금은 TDF나 배당형 ETF로 운용하여 연금 적립 시너지를 극대화하는 리밸런싱을 제안합니다.`
  },
  {
    id: "4",
    category: "자산관리",
    title: "디폴트옵션(사전지정운용제도) 정착: 고수익 TDF 자금 유입 가속화",
    summary: "퇴직연금 DC형 및 IRP 가입자의 방치된 자금을 굴리기 위한 디폴트옵션 도입 후, 생애주기형 펀드(TDF)의 장기 수익률이 연 5~6%대로 안정세를 유지하고 있습니다.",
    date: "2026-04-12",
    author: "금융감독원 연금감독실",
    image: "📈",
    content: `퇴직연금 디폴트옵션이 완전히 정착되면서 원리금보장형에 묶여있던 퇴직 자산이 타겟데이트펀드(TDF) 및 자산배분형 펀드로 빠르게 이동하고 있습니다.

TDF는 가입자의 은퇴 목표 시점(예: TDF 2045, TDF 2050)에 맞춰 청년기에는 위험자산(주식) 비중을 높이고 은퇴 시점이 다가올수록 안전자산(채권) 비중을 자동으로 조절해주는 생애주기형 펀드입니다.

현재 주요 퇴직연금 사업자들의 디폴트옵션 승인 상품 중 TDF 기반의 성장형 포트폴리오는 연평균 4.8% ~ 6.2%의 높은 장기 안정적 수익률을 보이며 물가상승률을 초과하는 실질 자산 보전에 기여하고 있습니다.`
  },
  {
    id: "5",
    category: "자산관리",
    title: "활동기 집중형 인출 전략 도입: 장수 리스크 방어의 대안",
    summary: "은퇴 초기 소비활동이 왕성한 60~70대 초반에 지출 비율을 높이고 후기에는 지출을 낮추는 체감식 인출전략이 금융권 은퇴 설계의 새로운 트렌드로 급부상했습니다.",
    date: "2026-03-30",
    author: "한국은퇴학회 심포지엄",
    image: "⚖️",
    content: `평생 같은 액수만 뽑아 쓰는 정액식 인출 대신, 은퇴 직후 여행과 여가 활동이 활발한 '활동기'에 많이 쓰고 나이가 들며 지출을 서서히 줄여나가는 '체감식 인출 전략(Spending Smile)'에 대한 학계와 금융권의 관심이 매우 뜨겁습니다.

연구에 따르면, 체감식 인출 방식을 선택할 시:
1. 은퇴 초반 삶의 만족도가 대폭 향상됩니다.
2. 80세 이후 지출이 자율적으로 줄어들어 연금 자산의 고갈 시점을 평균 4.5년 늦추는 방어 효과가 나타납니다.
3. 물가상승 리스크가 심해지는 노년 후기에 전체 인출 절대액을 통제하여 장수 위험을 낮춥니다.`
  }
];

export default function PolicyNewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setArticles(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load real-time news, using mock data:", err);
      }
      setArticles([]);
      setLoading(false);
    }
    
    fetchNews();
  }, []);

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>뉴스 피드를 준비하는 중...</p>
      </div>
    );
  }

  // Combine real-time API news with original mock guide articles (avoiding duplicate titles)
  const uniqueMockArticles = mockArticles.filter(
    (mockArt) => !articles.some((realArt) => realArt.title.replace(/\s/g, "") === mockArt.title.replace(/\s/g, ""))
  );

  const allArticles = [...articles, ...uniqueMockArticles];

  const filteredArticles = selectedCategory === "ALL"
    ? allArticles
    : allArticles.filter((art) => art.category === selectedCategory);

  const handleArticleClick = (art: Article) => {
    setSelectedArticle(art);
  };

  return (
    <main style={styles.container}>
      {/* Background decoration */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/dashboard" style={styles.logo}>
            Pension<span className="gradient-text">Lab</span>
          </Link>
          <nav style={styles.navLinks}>
            <Link href="/dashboard" style={styles.navItem}>자산관리</Link>
            <Link href="/youtube" style={styles.navItem}>추천 영상</Link>
            <Link href="/dashboard/ai-advisor" style={styles.navItem}>AI 포트폴리오 처방</Link>
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>정책 뉴스</span>
          </nav>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle />
            <Link href="/onboarding" className="premium-button-secondary" style={{ padding: "8px 16px" }} id="btn-re-onboard">
              정보 재입력
            </Link>
          </div>
        </div>
      </header>

      <div style={styles.contentBody}>
        {/* Title and Intro */}
        <section style={styles.titleSection} className="animate-fade-in">
          <span style={styles.badge}>Pension Reform & Policy News</span>
          <h2 style={styles.pageTitle}>실시간 연금 정책 뉴스 & 해설</h2>
          <p style={styles.pageSubtitle}>
            2026 국민연금 대개편 소식부터 세제 혜택 극대화를 위한 금융 법안 변경안까지, 핵심 연금 정책 트렌드를 알기 쉽게 해설해 드립니다.
          </p>
        </section>

        {/* Category Filters */}
        <div style={styles.filterRow} className="animate-fade-in">
          {["ALL", "국민·기초연금", "퇴직·개인연금", "자산관리"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "nav-tab active" : "nav-tab"}
              style={{
                fontSize: "0.85rem",
                padding: "8px 16px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontWeight: selectedCategory === cat ? 700 : 500,
                color: selectedCategory === cat ? "#ffffff" : "var(--text-secondary)",
                transition: "all var(--transition-fast)"
              }}
            >
              {cat === "ALL" ? "전체 뉴스" : cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <section style={styles.gridSection} className="animate-fade-in">
          {loading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <div style={{ ...styles.spinner, margin: "0 auto 16px auto", width: 40, height: 40 }} />
              <p>실시간 연금 정책 뉴스를 불러오는 중입니다...</p>
            </div>
          ) : (
            filteredArticles.map((art) => {
              return (
                <div
                  key={art.id}
                  onClick={() => handleArticleClick(art)}
                  style={{
                    ...styles.newsCard,
                    border: art.id.startsWith("real-")
                      ? "1px solid rgba(99, 102, 241, 0.4)"
                      : "1px solid var(--border)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  className="premium-card"
                >
                  {art.id.startsWith("real-") && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderBottomLeftRadius: "var(--radius-sm)"
                    }}>
                      실시간 정책
                    </div>
                  )}
                  <div style={styles.cardHeader}>
                    <span style={styles.cardImage}>{art.image}</span>
                    <span style={{
                      ...styles.cardBadge,
                      color: art.id.startsWith("real-") ? "#a5b4fc" : "var(--primary-light)",
                      backgroundColor: art.id.startsWith("real-") ? "rgba(99, 102, 241, 0.08)" : "rgba(99,102,241,0.08)",
                      borderColor: art.id.startsWith("real-") ? "rgba(99, 102, 241, 0.2)" : "rgba(99,102,241,0.15)"
                    }}>{art.category}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{art.title}</h3>
                  <p style={styles.cardSummary}>{art.summary}</p>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardAuthor}>{art.author}</span>
                    <span style={styles.cardDate}>{art.date}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Article Detail Modal */}
        {selectedArticle && (
          <div style={styles.modalOverlay} onClick={() => setSelectedArticle(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="premium-card">
              <div style={styles.modalHeader}>
                <span style={styles.modalBadge}>{selectedArticle.category}</span>
                <button style={styles.closeButton} onClick={() => setSelectedArticle(null)}>✕</button>
              </div>
              <h2 style={styles.modalTitle}>{selectedArticle.title}</h2>
              <div style={styles.modalMeta}>
                <span>작성: {selectedArticle.author}</span>
                <span>•</span>
                <span>등록일: {selectedArticle.date}</span>
              </div>
              <div style={styles.modalBody}>
                {selectedArticle.content.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx} style={styles.modalParagraph}>{para}</p>
                ))}
              </div>
              <div style={styles.modalFooter}>
                {(selectedArticle.id.startsWith("real-") || (selectedArticle as any).link) && (
                  <a
                    href={(selectedArticle as any).link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-button-secondary"
                    style={{
                      padding: "8px 16px",
                      textDecoration: "none",
                      marginRight: "10px",
                      fontSize: "0.85rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    📰 정책 원문 보기 ➔
                  </a>
                )}
                <button
                  className="premium-button"
                  onClick={() => setSelectedArticle(null)}
                  style={{ padding: "8px 24px" }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "var(--background)",
    position: "relative",
    overflow: "hidden",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--background)",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid var(--border)",
    borderTop: "5px solid var(--primary)",
    borderRadius: "50%",
    animation: "pulse-subtle 1.5s infinite linear",
  },
  bgGlow1: {
    position: "fixed",
    top: "-20%",
    left: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    bottom: "-20%",
    right: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    width: "100%",
    padding: "16px 40px",
    zIndex: 10,
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--glass-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
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
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    textDecoration: "none",
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
    textDecoration: "none",
    transition: "color var(--transition-fast)",
  },
  contentBody: {
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 20px 80px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "30px",
    zIndex: 1,
  },
  titleSection: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  badge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#a5b4fc",
    backgroundColor: "rgba(99,102,241,0.15)",
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  pageTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    maxWidth: "600px",
    lineHeight: 1.5,
  },
  filterRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    borderBottom: "1.5px solid var(--border)",
    paddingBottom: "16px",
  },
  gridSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
    width: "100%",
  },
  newsCard: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardImage: {
    fontSize: "1.5rem",
  },
  cardBadge: {
    fontSize: "0.7rem",
    color: "var(--primary-light)",
    fontWeight: 700,
    backgroundColor: "rgba(99,102,241,0.08)",
    padding: "2px 8px",
    borderRadius: "var(--radius-xs)",
    border: "1px solid rgba(99,102,241,0.15)",
  },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.4,
    minHeight: "44px",
  },
  cardSummary: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    flexGrow: 1,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    borderTop: "1px solid var(--border)",
    paddingTop: "10px",
    marginTop: "8px",
  },
  cardAuthor: {
    fontWeight: 600,
  },
  cardDate: {},
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(13,14,28,0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "var(--surface)",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "var(--shadow-premium)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBadge: {
    fontSize: "0.75rem",
    color: "var(--primary-light)",
    fontWeight: 700,
    backgroundColor: "rgba(99,102,241,0.08)",
    padding: "4px 10px",
    borderRadius: "var(--radius-xs)",
    border: "1px solid rgba(99,102,241,0.15)",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "4px",
  },
  modalTitle: {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    lineHeight: 1.4,
  },
  modalMeta: {
    display: "flex",
    gap: "10px",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "12px",
  },
  modalBody: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "8px",
  },
  modalParagraph: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    whiteSpace: "pre-line",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    borderTop: "1px solid var(--border)",
    paddingTop: "16px",
    marginTop: "12px",
  },
};
