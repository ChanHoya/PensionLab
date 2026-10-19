"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UserPensionContextBrief,
  InteractiveChatMessage,
  SUGGESTED_PROMPTS,
} from "../services/interactiveAdvisorService";

interface InteractiveChatAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: UserPensionContextBrief;
  onOpenTool?: (toolId: string) => void;
}

export default function InteractiveChatAdvisorModal({
  isOpen,
  onClose,
  context,
  onOpenTool,
}: InteractiveChatAdvisorModalProps) {
  const [messages, setMessages] = useState<InteractiveChatMessage[]>([
    {
      id: "msg-init",
      sender: "advisor",
      text: `안녕하세요! **PensionLab 1:1 대화형 AI 은퇴 어드바이저**입니다. 🏛️

회원님의 현재 자산 프로필(목표 생활비 월 ${context.targetMonthlySpending.toLocaleString()}만 원, 국민연금 예상액 월 ${context.monthlyNationalPension.toLocaleString()}만 원 등)을 실시간으로 분석하고 있습니다.

궁금하신 연금 인출 순서, 세금/건보료 절감, ISA 만기 활용 전략 등을 질문해 주시거나 아래 추천 질문을 눌러보세요!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: InteractiveChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/interactive-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend.trim(),
          context,
        }),
      });

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();

      const advisorMsg: InteractiveChatMessage = {
        id: `advisor-${Date.now()}`,
        sender: "advisor",
        text: data.answer || "답변을 불러오지 못했습니다.",
        recommendedTool: data.recommendedTool,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, advisorMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: InteractiveChatMessage = {
        id: `advisor-${Date.now()}`,
        sender: "advisor",
        text: "일시적인 네트워크 장애로 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="t-modal-spring"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={styles.iconBadge}>🤖</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={styles.title}>1:1 대화형 AI 인터랙티브 은퇴 어드바이저</h2>
                <span style={styles.liveBadge}>LIVE CONTEXT</span>
              </div>
              <p style={styles.subtitle}>
                만 {context.currentAge}세 · 목표 월 {context.targetMonthlySpending.toLocaleString()}만 원 · 부부 자산 실시간 연동
              </p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={styles.chipBar}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            추천 질문 💡
          </span>
          <div style={styles.chipScroll}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                style={styles.chipBtn}
                onClick={() => handleSendMessage(prompt.question)}
                disabled={loading}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Messages */}
        <div style={styles.chatArea}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.sender === "user" ? "flex-end" : "flex-start",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.sender === "user" ? styles.bubbleUser : styles.bubbleAdvisor),
                }}
              >
                <div style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{m.text}</div>

                {/* Recommended Tool Action Button */}
                {m.recommendedTool && (
                  <div style={styles.toolCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{m.recommendedTool.icon}</span>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          추천 연계 시뮬레이터
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary, #3b82f6)" }}>
                          {m.recommendedTool.name}
                        </div>
                      </div>
                    </div>
                    {onOpenTool && (
                      <button
                        type="button"
                        style={styles.btnToolLaunch}
                        onClick={() => {
                          onClose();
                          onOpenTool(m.recommendedTool!.id);
                        }}
                      >
                        열기 ↗
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span style={styles.timestamp}>{m.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0" }}>
              <span style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>⏳</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                회원님의 연금 데이터와 세법 룰셋을 교차 분석 중입니다...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          style={styles.inputArea}
        >
          <input
            type="text"
            placeholder="예: 70세 이후 건보료 피부양자를 유지하려면 어떻게 해야 하나요?"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            style={styles.chatInput}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            style={{
              ...styles.sendBtn,
              opacity: !inputText.trim() || loading ? 0.5 : 1,
            }}
          >
            전송 🚀
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: "var(--bg-card, #1e293b)",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "800px",
    height: "85vh",
    maxHeight: "820px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px 16px",
    borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
  },
  iconBadge: {
    fontSize: "26px",
    background: "rgba(168, 85, 247, 0.15)",
    padding: "10px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "19px",
    fontWeight: "700",
    color: "var(--text-primary, #ffffff)",
    margin: 0,
  },
  liveBadge: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 7px",
    borderRadius: "6px",
    backgroundColor: "rgba(168, 85, 247, 0.25)",
    color: "#c084fc",
    letterSpacing: "0.5px",
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--text-secondary, #94a3b8)",
    marginTop: "4px",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary, #94a3b8)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px 8px",
  },
  chipBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 20px",
    backgroundColor: "var(--bg-subtle, rgba(255, 255, 255, 0.03))",
    borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
    overflowX: "auto",
  },
  chipScroll: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "2px",
  },
  chipBtn: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "20px",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
    backgroundColor: "var(--bg-card, #0f172a)",
    color: "var(--text-primary, #ffffff)",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  chatArea: {
    flex: 1,
    padding: "20px 24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  bubble: {
    maxWidth: "85%",
    padding: "14px 18px",
    borderRadius: "14px",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  bubbleUser: {
    backgroundColor: "var(--primary, #3b82f6)",
    color: "#ffffff",
    borderBottomRightRadius: "4px",
  },
  bubbleAdvisor: {
    backgroundColor: "var(--bg-subtle, rgba(255, 255, 255, 0.05))",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
    color: "var(--text-primary, #ffffff)",
    borderBottomLeftRadius: "4px",
  },
  timestamp: {
    fontSize: "10px",
    color: "var(--text-secondary, #94a3b8)",
    marginTop: "4px",
  },
  toolCard: {
    marginTop: "12px",
    padding: "10px 14px",
    borderRadius: "10px",
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btnToolLaunch: {
    padding: "6px 12px",
    borderRadius: "6px",
    backgroundColor: "var(--primary, #3b82f6)",
    color: "#ffffff",
    border: "none",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  inputArea: {
    display: "flex",
    gap: "10px",
    padding: "16px 24px",
    borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
    backgroundColor: "var(--bg-card, #1e293b)",
  },
  chatInput: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
    backgroundColor: "var(--bg-card, #0f172a)",
    color: "var(--text-primary, #ffffff)",
    fontSize: "14px",
  },
  sendBtn: {
    padding: "12px 20px",
    borderRadius: "10px",
    backgroundColor: "var(--primary, #3b82f6)",
    color: "#ffffff",
    border: "none",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
