"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import ThemeToggle from "@/components/ThemeToggle";

interface Video {
  id: string;
  videoId: string;
  channelName: string;
  channelHandle: string;
  title: string;
  summary: string;
  publishDate: string;
  category: string;
}

const SEED_VIDEOS: Video[] = [
  // 연금박사 (@pension500)
  {
    id: "v-yt-1",
    videoId: "1gu6bB4wQh0",
    channelName: "연금박사",
    channelHandle: "@pension500",
    title: "국민연금 13% 개혁안, 나의 연금 수령액은 어떻게 달라지나?",
    summary: "2026년 국민연금 개혁안에 따른 세대별 보험료 차등 인상 스케줄(9% ➔ 13%)과 소득대체율 조정(42%) 분석. 은퇴 자금 계산 시 세대별 인상 속도를 반드시 고려해야 미래 실질 납부액을 예측할 수 있습니다.",
    publishDate: "2026-02-15",
    category: "국민연금"
  },
  {
    id: "v-yt-2",
    videoId: "jW7D-6x0_9o",
    channelName: "연금박사",
    channelHandle: "@pension500",
    title: "퇴직금 1억 받았다면 노후설계 이렇게 하세요! 실전 포트폴리오 가이드",
    summary: "일시금 수령과 연금 수령의 비교, 세금 및 건보료 절세 전략 등을 다룹니다. 퇴직급여를 IRP를 통해 효율적으로 나눠받는 실전 팁을 제공합니다.",
    publishDate: "2026-03-22",
    category: "퇴직연금"
  },
  {
    id: "v-yt-3",
    videoId: "1gu6bB4wQh0",
    channelName: "연금박사",
    channelHandle: "@pension500",
    title: "기초연금 못 받는 진짜 이유 - 국민연금과의 연계 및 감액 제도 완벽 해설",
    summary: "국민연금, 기초연금, 주택연금의 핵심 내용을 통합적으로 설명하며, 기초연금을 받지 못하게 되는 실무 자산 조건과 감액 회피 팁을 공유합니다.",
    publishDate: "2026-04-10",
    category: "공적연금"
  },
  {
    id: "v-yt-4",
    videoId: "jW7D-6x0_9o",
    channelName: "연금박사",
    channelHandle: "@pension500",
    title: "10억 목돈보다 월 500만원 연금이 좋은 10가지 이유",
    summary: "일시금 목돈을 가지고 은퇴하는 것과 종신 평생 연금 흐름을 세팅해 두는 것의 치명적인 차이를 노후 설계 관점에서 쉽게 짚어드립니다.",
    publishDate: "2026-06-01",
    category: "연금저축"
  },

  // 박곰희TV (@gomhee)
  {
    id: "v-yt-5",
    videoId: "W5-V4e3D6d0",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "퇴직연금 DB형과 DC형, 나에게 맞는 유리한 선택 기준",
    summary: "퇴직연금 DB형(확정급여형)과 DC형(확정기여형)의 비교 및 선택 기준. 임금상승률이 높고 안정적인 직장은 DB형이 유리하며, 직접 운용 능력이 있다면 DC형이 유리함.",
    publishDate: "2026-03-10",
    category: "퇴직연금"
  },
  {
    id: "v-yt-6",
    videoId: "Jm3X1x_Tq-w",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "은퇴 후 매달 월 300만원 연금을 수령하기 위한 필수 자금 규모 계산법",
    summary: "소득 크레바스를 넘고 노후 월 300만원의 안정적 인출 구조를 세우기 위해, 3층 연금(국민, 퇴직, 개인)의 최적 포트폴리오 세팅과 준비 자금을 계산해봅니다.",
    publishDate: "2026-05-28",
    category: "자산배분"
  },
  {
    id: "v-yt-7",
    videoId: "W5-V4e3D6d0",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "50대 은퇴자를 위한 최적의 사적연금 리밸런싱 포트폴리오 가이드",
    summary: "은퇴를 코앞에 둔 50대를 위한 최적의 연금저축/IRP 리밸런싱 가이드. 마이너스 수익률 방어와 채권/대체자산 비중을 조절하는 실전 노하우를 공개합니다.",
    publishDate: "2026-04-18",
    category: "리밸런싱"
  },
  {
    id: "v-yt-8",
    videoId: "Jm3X1x_Tq-w",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "절세계좌 3종 세트(ISA, 연금저축, IRP) 100% 활용법 및 인출 순서",
    summary: "투자 금액별로 절세계좌를 어떻게 활용하고 배분할지에 대한 가이드와 연금 개시 시점의 세제 효율 극대화 순서(ISA ➔ 연금저축 ➔ IRP)를 제안합니다.",
    publishDate: "2026-05-05",
    category: "절세"
  },

  // 연금이야기 (@PensionStory)
  {
    id: "v-yt-9",
    videoId: "yqrOMgg_Mxk",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "연금수령방법 총정리 및 절세계좌 최적화 가이드",
    summary: "사적연금 수령액이 연 1,500만 원을 초과할 때 발생하는 분리과세와 종합과세 선택 팁, 그리고 건강보험료 부과 여부를 상세 분석합니다.",
    publishDate: "2026-04-20",
    category: "절세"
  },
  {
    id: "v-yt-10",
    videoId: "nBWne4QAG6I",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "연금상담, 많이 묻는 질문 10가지 현답 리포트",
    summary: "가정주부나 무소득자를 위한 국민연금 임의가입 혜택과, 과거 미납/일시금 반환금을 되돌려주어 노후 기본 연금 수급액을 2배 늘리는 실전 방법을 다룹니다.",
    publishDate: "2026-05-12",
    category: "국민연금"
  },
  {
    id: "v-yt-11",
    videoId: "CGz2T1R-Z0g",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "3040 연금저축, IRP, ISA 절세계좌 스마트 연금 투자 방법",
    summary: "투자 금액별로 절세계좌를 어떻게 활용하고 배분할지에 대한 가이드와 연금 개시 시점의 세제 효율 극대화 순서(ISA ➔ 연금저축 ➔ IRP)를 제안합니다.",
    publishDate: "2026-05-30",
    category: "연금저축"
  },
  {
    id: "v-yt-12",
    videoId: "yqrOMgg_Mxk",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "은퇴 후 건보료 폭탄 피하는 합법적 절세 가이드",
    summary: "퇴직 후 국민연금 수령 전까지 소득 공백기(크레바스) 동안 퇴직연금과 개인연금을 적절히 교차 매칭하여 소득 단절 없이 안정적으로 생활하는 기법을 소개합니다.",
    publishDate: "2026-06-03",
    category: "은퇴설계"
  }
];

export default function YoutubeHubPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const store = usePensionStore();

  // AI Chat States
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string; sources?: any[] }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // YouTube Modal States
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>동영상 채널을 준비하는 중...</p>
      </div>
    );
  }

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || aiLoading) return;

    const userMsg = question.trim();
    setQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다." },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter videos based on selected channel tab and search query
  const filteredVideos = SEED_VIDEOS.filter((video) => {
    const matchesChannel =
      selectedChannel === "ALL" || video.channelHandle === selectedChannel;
      
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesChannel && matchesSearch;
  });

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
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>추천 영상</span>
            <Link href="/dashboard/ai-advisor" style={styles.navItem}>AI 포트폴리오 처방</Link>
            <Link href="/simulator" style={styles.navItem}>시뮬레이터</Link>
            <Link href="/news" style={styles.navItem}>정책 뉴스</Link>
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
          <span style={styles.badge}>EXPERT YOUTUBE CURATION</span>
          <h2 style={styles.pageTitle}>연금 전문가 추천 영상 허브</h2>
          <p style={styles.pageSubtitle}>
            대한민국 대표 연금/은퇴 자산관리 전문가들의 핵심 노하우 영상을 채널별로 모아 제공합니다. 
            원하는 주제를 검색하거나 채널 탭을 눌러 원하는 강의를 바로 시청해보세요.
          </p>
        </section>

        {/* Filter and Search Controls */}
        <section style={styles.controlSection} className="animate-fade-in">
          {/* Channel Tabs */}
          <div style={styles.tabRow}>
            {[
              { label: "전체 영상", handle: "ALL" },
              { label: "연금박사 이영주", handle: "@pension500" },
              { label: "박곰희TV", handle: "@gomhee" },
              { label: "연금이야기", handle: "@PensionStory" }
            ].map((tab) => (
              <button
                key={tab.handle}
                onClick={() => setSelectedChannel(tab.handle)}
                className={selectedChannel === tab.handle ? "nav-tab active" : "nav-tab"}
                style={{
                  fontSize: "0.85rem",
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontWeight: selectedChannel === tab.handle ? 700 : 500,
                  color: selectedChannel === tab.handle ? "#ffffff" : "var(--text-secondary)",
                  transition: "all var(--transition-fast)"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="검색할 영상 제목, 요약 키워드나 태그를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={styles.clearButton}
                title="검색어 지우기"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* Videos Grid */}
        <section style={styles.gridSection} className="animate-fade-in">
          {filteredVideos.length === 0 ? (
            <div style={styles.emptyContainer}>
              <span style={{ fontSize: "2.5rem" }}>📭</span>
              <p style={{ marginTop: 12, fontWeight: 600 }}>검색 결과와 일치하는 전문가 추천 영상이 없습니다.</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>다른 키워드로 검색해 보세요.</p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => {
                  setActiveVideoId(video.videoId);
                  setActiveVideoTitle(`[${video.channelName}] ${video.title}`);
                }}
                style={{ ...styles.videoCard, cursor: "pointer" }}
                className="premium-card"
              >
                {/* Thumbnail Wrapper */}
                <div style={styles.thumbnailWrapper}>
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt={video.title}
                    className="thumbnail-img-custom"
                    style={styles.thumbnailImg}
                  />
                  <div className="play-overlay-custom" style={styles.playOverlay}>
                    <span style={styles.playIcon}>▶</span>
                  </div>
                  <span style={styles.categoryBadge}>{video.category}</span>
                </div>

                {/* Video Info */}
                <div style={styles.videoInfo}>
                  <div style={styles.channelRow}>
                    <span style={styles.channelAvatar}>📺</span>
                    <span style={styles.channelNameText}>
                      {video.channelName} <span style={styles.channelHandleText}>{video.channelHandle}</span>
                    </span>
                  </div>
                  <h3 style={styles.videoTitle}>{video.title}</h3>
                  <p style={styles.videoSummary}>{video.summary}</p>
                  <div style={styles.videoFooter}>
                    <span style={styles.publishDateText}>{video.publishDate}</span>
                    <span style={styles.watchLinkText}>영상 보러가기 ➔</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* AI RAG Q&A Chat Section - Relocated here */}
        <section style={{ ...styles.aiCard, marginTop: "60px" }} className="premium-card">
          <span style={styles.aiBadge}>AI 실시간 연금 상담실</span>
          <h3 style={styles.aiTitle}>유튜브 연금 전문가 기반 RAG Q&A</h3>
          <p style={styles.aiDesc}>
            연금박사, 박곰희TV 등 신뢰할 수 있는 전문가들의 동영상 자막 데이터를 벡터 데이터베이스(pgvector)에서 분석하여 정확하고 명쾌한 조언을 해드립니다.
          </p>

          {/* Chat Window */}
          <div style={styles.chatWindow}>
            {chatHistory.length === 0 ? (
              <div style={styles.chatPlaceholder}>
                💬 질문을 입력하시면 은퇴 설계 RAG 상담을 시작합니다.<br />
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 8, display: "inline-block" }}>
                  (추천 질문: &quot;국민연금 13% 개편안이 나에게 미치는 영향은?&quot;, &quot;퇴직연금 DB형과 DC형 중 무엇이 유리해?&quot;)
                </span>
              </div>
            ) : (
              <div style={styles.chatMessages}>
                {chatHistory.map((chat, idx) => (
                  <div key={idx} style={chat.role === "user" ? styles.userMessageRow : styles.assistantMessageRow}>
                    <div style={chat.role === "user" ? styles.userMessageBubble : styles.assistantMessageBubble}>
                      <div style={{ whiteSpace: "pre-line" }}>{chat.content}</div>
                      
                      {chat.sources && chat.sources.length > 0 && (
                        <div style={styles.sourcesBox}>
                          <div style={styles.sourcesLabel}>🔗 참고한 전문가 영상 출처 (클릭 시 재생):</div>
                          <div style={styles.sourcesList}>
                            {chat.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={`https://www.youtube.com/watch?v=${src.videoId}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveVideoId(src.videoId);
                                  setActiveVideoTitle(`[${src.channelName}] ${src.title}`);
                                }}
                                style={{
                                  ...styles.sourceLink,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                id={`link-video-${src.videoId}`}
                              >
                                🎥 [{src.channelName}] {src.title} ➔
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={styles.assistantMessageRow}>
                    <div style={{ ...styles.assistantMessageBubble, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={styles.miniSpinner} />
                      <span>전문가 조언을 분석 중입니다...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleAskAI} style={styles.chatForm}>
              <input
                id="input-ai-question"
                type="text"
                className="premium-input"
                placeholder="연금 개혁, 퇴직연금, 개인연금저축에 대해 질문해 보세요..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={aiLoading}
                style={{ flexGrow: 1 }}
              />
              <button
                id="btn-ai-send"
                type="submit"
                disabled={aiLoading || !question.trim()}
                className="premium-button"
                style={{
                  padding: "10px 20px",
                  opacity: aiLoading || !question.trim() ? 0.6 : 1,
                  cursor: aiLoading || !question.trim() ? "not-allowed" : "pointer"
                }}
              >
                질문하기
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* YouTube Video Player Modal */}
      {activeVideoId && (
        <div style={styles.modalOverlay} onClick={() => setActiveVideoId(null)} className="animate-fade-in">
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="glass">
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>{activeVideoTitle}</h4>
              <button
                id="btn-close-video"
                onClick={() => setActiveVideoId(null)}
                style={styles.modalCloseButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                ✕
              </button>
            </div>
            <div style={styles.videoWrapper}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                title={activeVideoTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ borderRadius: "var(--radius-sm)", border: "none", position: "absolute", top: 0, left: 0 }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: "var(--background)",
    color: "var(--text-primary)",
    position: "relative",
    overflowX: "hidden",
  },
  bgGlow1: {
    position: "fixed",
    top: "-20%",
    left: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    bottom: "-20%",
    right: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.09) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "var(--glass-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border)",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },
  navItem: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    textDecoration: "none",
    transition: "color var(--transition-fast)",
    cursor: "pointer",
  },
  contentBody: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 24px 80px 24px",
    position: "relative",
    zIndex: 1,
  },
  titleSection: {
    textAlign: "center",
    marginBottom: "40px",
  },
  badge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--primary-300)",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    padding: "4px 12px",
    borderRadius: "100px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    display: "inline-block",
    marginBottom: "16px",
  },
  pageTitle: {
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    marginTop: "12px",
    maxWidth: "700px",
    margin: "12px auto 0 auto",
    lineHeight: 1.6,
  },
  controlSection: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "36px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "20px",
  },
  tabRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    paddingBottom: "16px",
  },
  searchContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    color: "var(--text-muted)",
    fontSize: "1rem",
  },
  searchInput: {
    width: "100%",
    padding: "14px 44px 14px 44px",
    fontSize: "0.95rem",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    outline: "none",
    transition: "all var(--transition-fast)",
  },
  clearButton: {
    position: "absolute",
    right: "16px",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "4px",
  },
  gridSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "28px",
  },
  videoCard: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    display: "flex",
    flexDirection: "column",
    transition: "all var(--transition-normal)",
  },
  thumbnailWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "16/9",
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform var(--transition-normal)",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(13, 14, 28, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
    transition: "opacity var(--transition-fast)",
  },
  playIcon: {
    fontSize: "2.5rem",
    color: "#ffffff",
    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))",
  },
  categoryBadge: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    backgroundColor: "rgba(13, 14, 28, 0.8)",
    backdropFilter: "blur(4px)",
    color: "var(--primary-300)",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
  },
  videoInfo: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  channelRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  channelAvatar: {
    fontSize: "1rem",
  },
  channelNameText: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
  },
  channelHandleText: {
    color: "var(--text-muted)",
    fontWeight: 400,
    marginLeft: "4px",
  },
  videoTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.4,
    marginBottom: "10px",
    // 2줄 말줄임 처리
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    height: "2.9rem",
  },
  videoSummary: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    marginBottom: "18px",
    flexGrow: 1,
    // 3줄 말줄임 처리
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    height: "3.8rem",
  },
  videoFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    paddingTop: "12px",
    marginTop: "auto",
  },
  publishDateText: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
  },
  watchLinkText: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "var(--primary-300)",
  },
  emptyContainer: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "var(--surface)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
  },
  loadingContainer: {
    minHeight: "100vh",
    backgroundColor: "var(--background)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(99, 102, 241, 0.1)",
    borderTop: "4px solid var(--primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  aiCard: {
    padding: "30px 40px",
    background: "var(--surface)",
    borderColor: "var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  aiBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#a5b4fc",
    backgroundColor: "rgba(99,102,241,0.15)",
    padding: "4px 8px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
  },
  aiTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginTop: "4px",
  },
  aiDesc: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  chatWindow: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--surface)",
    overflow: "hidden",
    marginTop: "16px",
    boxShadow: "var(--shadow-sm)",
  },
  chatPlaceholder: {
    padding: "40px 20px",
    textAlign: "center",
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
  },
  chatMessages: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "20px",
    maxHeight: "350px",
    overflowY: "auto",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--background)",
  },
  userMessageRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  assistantMessageRow: {
    display: "flex",
    justifyContent: "flex-start",
  },
  userMessageBubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: "16px 16px 4px 16px",
    backgroundColor: "var(--primary)",
    color: "#ffffff",
    fontSize: "0.95rem",
    lineHeight: 1.5,
    boxShadow: "var(--shadow-sm)",
  },
  assistantMessageBubble: {
    maxWidth: "85%",
    padding: "16px 20px",
    borderRadius: "16px 16px 16px 4px",
    backgroundColor: "var(--surface-2)",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-sm)",
  },
  miniSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid var(--border)",
    borderTop: "2px solid var(--primary)",
    borderRadius: "50%",
    animation: "pulse-subtle 1s infinite linear",
  },
  chatForm: {
    display: "flex",
    gap: "12px",
    padding: "16px 20px",
    backgroundColor: "var(--surface)",
  },
  sourcesBox: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px dashed var(--border)",
  },
  sourcesLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "6px",
  },
  sourcesList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sourceLink: {
    fontSize: "0.8rem",
    color: "var(--primary-light)",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color var(--transition-fast)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-premium)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  modalTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: "16px",
    margin: 0,
  },
  modalCloseButton: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "var(--radius-sm)",
    transition: "all var(--transition-fast)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  videoWrapper: {
    position: "relative",
    paddingBottom: "56.25%", /* 16:9 Aspect Ratio */
    height: 0,
    overflow: "hidden",
    backgroundColor: "#000000",
  }
};
