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
  // 연금박사 이영주 (@pension500) — 실제 채널에서 수집한 유효 영상 ID
  {
    id: "v-yt-1",
    videoId: "4YCIkuKDE3E",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "내 연금 금융소득종합과세 될 수 있습니다 — 지금 확인해보세요",
    summary: "사적연금 수령액이 연 1,500만 원을 초과할 때 발생하는 분리과세와 종합과세 선택 팁, 그리고 건강보험료 부과 여부를 상세 분석합니다.",
    publishDate: "2025-12-15",
    category: "절세"
  },
  {
    id: "v-yt-2",
    videoId: "nNSMLrJOdVQ",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "연금 가입자만 건강보험료 이중부과되는 불편한 진실",
    summary: "퇴직 후 국민연금 수령 시 건강보험료가 이중으로 부과되는 구조적 문제를 분석하고, 합법적으로 건보료 부담을 줄이는 실전 절세 전략을 공유합니다.",
    publishDate: "2025-11-22",
    category: "건강보험"
  },
  {
    id: "v-yt-3",
    videoId: "ESO-lkX6vi8",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "은퇴가 코앞인데 연금이 없다고요? 5년만 내고 10년 뒤 바로 받는 연금 2가지",
    summary: "늦은 나이에 연금을 준비하는 분들을 위한 국민연금 임의가입 및 주택연금 활용법. 최소 납입 기간으로 최대 수급을 끌어내는 전략을 안내합니다.",
    publishDate: "2025-10-10",
    category: "국민연금"
  },
  {
    id: "v-yt-4",
    videoId: "s3en3zxbY5k",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "연금 받다 사망해도 100% 다 받는 연금이 있다?",
    summary: "종신형 연금 vs 확정 기간형 연금의 차이점을 분석하고, 유족에게 100% 상속 가능한 연금 상품의 구조를 쉽게 설명합니다.",
    publishDate: "2025-09-05",
    category: "연금저축"
  },

  // 박곰희TV (@gomhee) — 실제 채널에서 수집한 유효 영상 ID
  {
    id: "v-yt-5",
    videoId: "91GRhqMQRdE",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "과연 국민연금만으로 충분할까? — 박곰희 연금부자수업",
    summary: "국민연금 예상 수령액과 실제 은퇴 후 필요 생활비를 비교 분석하여, 부족분을 채우기 위한 사적연금 설계 방법을 제안합니다.",
    publishDate: "2026-03-10",
    category: "국민연금"
  },
  {
    id: "v-yt-6",
    videoId: "WJYWW_XXbSM",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "초보투자자의 목돈 1억 투자하기 — 한방에 할까요, 적립식으로 할까요?",
    summary: "퇴직금 등 목돈을 일시에 투자할지, 분할 매수로 나눌지의 판단 기준과 연금저축/IRP 내에서 효율적으로 배분하는 실전 포트폴리오 가이드.",
    publishDate: "2025-11-28",
    category: "자산배분"
  },
  {
    id: "v-yt-7",
    videoId: "sYybI-K5o0o",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "일 안해도 월급만큼 받고 싶어요! 현실적인 FIRE 하는 방법",
    summary: "경제적 자유(FIRE)를 달성하기 위한 현실적인 자산 규모 계산법과 연금·배당·임대소득 등 월 현금흐름 구축 전략을 공유합니다.",
    publishDate: "2026-01-15",
    category: "은퇴설계"
  },
  {
    id: "v-yt-8",
    videoId: "Gk3-ZC9W3vw",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "ISA에서 미국배당주 사면 손해인가요? 그럼에도 ISA를 해야 하는 이유",
    summary: "ISA 계좌에서 해외 ETF/배당주 투자 시 외국납부세액공제 이슈와 절세 효율을 분석하고, 연금저축/IRP 조합의 최적 운용 전략을 제시합니다.",
    publishDate: "2026-04-18",
    category: "절세"
  },

  // 연금이야기 (@PensionStory) — 실제 채널에서 수집한 유효 영상 ID
  {
    id: "v-yt-9",
    videoId: "AvLkWZKp8Fs",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "퇴직금, 개인연금 언제, 어떤 것부터 얼마나 인출하지? 인출 순서",
    summary: "퇴직연금(IRP)과 개인연금(연금저축) 중 어떤 것을 먼저 인출해야 세금을 최소화할 수 있는지, 연금 개시 시점의 세제 효율 극대화 순서를 제안합니다.",
    publishDate: "2025-08-20",
    category: "퇴직연금"
  },
  {
    id: "v-yt-10",
    videoId: "owgSmNbhyqE",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "연금저축·IRP vs 노란우산·공제회 — 나에게 어떤 게 유리?",
    summary: "자영업자·프리랜서를 위한 절세 수단 비교: 연금저축/IRP와 노란우산공제, 공제회 상품의 세액공제 한도, 수령 조건, 중도 해지 시 불이익을 비교 분석합니다.",
    publishDate: "2025-07-12",
    category: "절세"
  },
  {
    id: "v-yt-11",
    videoId: "oJZddfxuIgg",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "5060 초보, 연금저축·IRP·ISA 지금 시작해도 되나요?",
    summary: "50~60대 은퇴 임박자를 위한 절세계좌 3종(ISA, 연금저축, IRP) 입문 가이드. 늦게 시작해도 효과적인 납입 전략과 세금 혜택 활용법을 안내합니다.",
    publishDate: "2025-05-30",
    category: "연금저축"
  },
  {
    id: "v-yt-12",
    videoId: "pVwzL_19qk8",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "ISA 한도 3억, 소득·세액공제 + 5.5% 분리과세 (법개정 발의안)",
    summary: "ISA 계좌의 납입 한도 확대 및 세제 혜택 변경 법안을 분석하고, 연금계좌로의 이전 시 추가 세액공제를 받는 절세 전략을 설명합니다.",
    publishDate: "2025-06-03",
    category: "절세"
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

          {/* External YouTube Search Link Banner */}
          <div style={styles.externalSearchBanner}>
            <span style={{ fontSize: "1.1rem", cursor: "default" }}>💡</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                더 많은 동영상을 찾으시나요?
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                선택하신 연금 전문가 채널에서 검색어로 전체 동영상을 바로 찾아보실 수 있습니다. (새 창으로 유튜브 열기)
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {(selectedChannel === "ALL" || selectedChannel === "@pension500") && (
                  <a
                    href={searchQuery.trim() 
                      ? `https://www.youtube.com/@pension500/search?query=${encodeURIComponent(searchQuery)}`
                      : "https://www.youtube.com/@pension500/videos"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-button-secondary"
                    style={{ fontSize: "0.75rem", padding: "6px 12px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                  >
                    연금박사 이영주 채널 검색 ↗
                  </a>
                )}
                {(selectedChannel === "ALL" || selectedChannel === "@gomhee") && (
                  <a
                    href={searchQuery.trim() 
                      ? `https://www.youtube.com/@gomhee/search?query=${encodeURIComponent(searchQuery)}`
                      : "https://www.youtube.com/@gomhee/videos"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-button-secondary"
                    style={{ fontSize: "0.75rem", padding: "6px 12px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                  >
                    박곰희TV 채널 검색 ↗
                  </a>
                )}
                {(selectedChannel === "ALL" || selectedChannel === "@PensionStory") && (
                  <a
                    href={searchQuery.trim() 
                      ? `https://www.youtube.com/@PensionStory/search?query=${encodeURIComponent(searchQuery)}`
                      : "https://www.youtube.com/@PensionStory/videos"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-button-secondary"
                    style={{ fontSize: "0.75rem", padding: "6px 12px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                  >
                    연금이야기 채널 검색 ↗
                  </a>
                )}
              </div>
            </div>
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
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                      >
                        유튜브에서 보기 ↗
                      </a>
                      <span style={styles.watchLinkText}>재생 ➔</span>
                    </div>
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
                              <div key={sIdx} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", margin: "2px 0" }}>
                                <a
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
                                <a
                                  href={`https://www.youtube.com/watch?v=${src.videoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--primary-300)",
                                    textDecoration: "underline",
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                >
                                  (유튜브에서 열기 ↗)
                                </a>
                              </div>
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
  },
  externalSearchBanner: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
    border: "1px dashed rgba(99, 102, 241, 0.25)",
    borderRadius: "var(--radius-sm)",
    padding: "16px 20px",
    marginTop: "16px",
  }
};
