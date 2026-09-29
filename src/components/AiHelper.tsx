"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: { title: string; uri: string }[];
}

interface Props {
  pageName: string; // 예: "대시보드(결과 화면)"
  contextSelector?: string; // 질문할 때 읽을 화면 영역 (기본: main)
  examples?: string[]; // 대화가 없을 때 보여 줄 예시 질문
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

// 상단 메뉴의 AI 도우미 버튼 + 팝업. 질문 시점의 화면 글자를 함께 보내 화면 내용·검색·추론으로 답을 받는다
export default function AiHelper({ pageName, contextSelector = "main", examples = [], buttonClassName, buttonStyle }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const history = messages.map(({ role, text: t }) => ({ role, text: t }));
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const pageContext = (document.querySelector(contextSelector) as HTMLElement | null)?.innerText ?? "";
      const res = await fetch("/api/ai/helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, pageName, pageContext, history }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "답변을 받지 못했습니다.");
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer, sources: data.sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ ${err instanceof Error ? err.message : "답변을 받지 못했습니다."}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <div style={styles.overlay} onClick={() => setOpen(false)}>
      <div style={styles.panel} role="dialog" aria-modal="true" aria-label="AI 도우미" onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <strong style={{ fontSize: "1rem", color: "var(--text-primary)" }}>🤖 AI 도우미</strong>
          <button type="button" onClick={() => setOpen(false)} style={styles.close} aria-label="닫기">
            ✕
          </button>
        </div>
        <p style={styles.notice}>
          지금 화면의 내용을 바탕으로, 필요하면 웹 검색까지 더해 답합니다. 질문과 현재 화면 내용이 AI 답변을 위해 전송되며, 대화는 저장되지
          않습니다. 답변은 참고용이니 중요한 결정은 국민연금공단(☎1355) 등에서 확인하세요.
        </p>

        <div ref={listRef} style={styles.list}>
          {messages.length === 0 && examples.length > 0 && (
            <div style={styles.examples}>
              {examples.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} style={styles.example}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={m.role === "user" ? styles.userMsg : styles.botMsg}>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div style={styles.sources}>
                  <span style={{ fontWeight: 700 }}>참고한 자료</span>
                  {m.sources.map((s) => (
                    <a key={s.uri} href={s.uri} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div style={styles.botMsg}>화면 내용을 확인하고 답변을 작성하는 중입니다...</div>}
        </div>

        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            className="premium-input"
            style={styles.input}
            rows={2}
            placeholder="궁금한 점을 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <button type="submit" className="premium-button" disabled={loading || !input.trim()} style={{ padding: "8px 16px" }}>
            보내기
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName} style={buttonStyle}>
        🤖 AI 도우미
      </button>
      {open && createPortal(panel, document.body)}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 1000,
  },
  panel: {
    width: "min(620px, 100%)",
    height: "min(720px, 90vh)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "16px",
    boxShadow: "var(--shadow-premium)",
  },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  close: { border: "none", background: "none", color: "var(--text-muted)", fontSize: "1rem", cursor: "pointer" },
  notice: { margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 },
  list: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "4px 2px",
  },
  examples: { display: "flex", flexDirection: "column", gap: "6px" },
  example: {
    textAlign: "left",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px dashed rgba(99, 102, 241, 0.4)",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  userMsg: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    padding: "8px 12px",
    borderRadius: "12px 12px 2px 12px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#ffffff",
    fontSize: "0.88rem",
    lineHeight: 1.6,
  },
  botMsg: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    padding: "10px 12px",
    borderRadius: "12px 12px 12px 2px",
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    fontSize: "0.88rem",
    lineHeight: 1.7,
  },
  sources: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginTop: "8px",
    paddingTop: "6px",
    borderTop: "1px dashed var(--border)",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  sourceLink: { color: "var(--primary-light)", textDecoration: "underline", wordBreak: "break-all" },
  form: { display: "flex", gap: "8px", alignItems: "flex-end" },
  input: { flex: 1, resize: "none", fontSize: "0.88rem" },
};
