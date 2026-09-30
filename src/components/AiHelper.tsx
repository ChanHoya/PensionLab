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

const KEY_STORAGE = "pensionlab_gemini_key"; // 사용자 본인의 Gemini API 키 (이 브라우저에만 저장)

const readKey = () => {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
};

// 상단 메뉴의 AI 도우미 버튼 + 팝업. 질문 시점의 화면 글자를 함께 보내 화면 내용·검색·추론으로 답을 받는다
// 본인의 Gemini API 키가 있어야 쓸 수 있다: 처음 열면 키를 입력·인증받아 이 브라우저에 저장하고 이후 계속 사용
export default function AiHelper({ pageName, contextSelector = "main", examples = [], buttonClassName, buttonStyle }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [keyChecking, setKeyChecking] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const openHelper = () => {
    setApiKey(readKey());
    setOpen(true);
  };

  const verifyKey = async () => {
    const key = keyInput.trim();
    if (!key || keyChecking) return;
    setKeyChecking(true);
    setKeyError("");
    try {
      const res = await fetch("/api/ai/helper", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-gemini-key": key },
        body: JSON.stringify({ verify: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "API 키 인증에 실패했습니다.");
      try {
        localStorage.setItem(KEY_STORAGE, key);
      } catch {
        // 저장이 막힌 브라우저(사생활 보호 모드 등)에서는 이번 창에서만 사용
      }
      setApiKey(key);
      setKeyInput("");
      setEditingKey(false);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "API 키 인증에 실패했습니다.");
    } finally {
      setKeyChecking(false);
    }
  };

  const removeKey = () => {
    try {
      localStorage.removeItem(KEY_STORAGE);
    } catch {
      // 무시
    }
    setApiKey("");
    setEditingKey(false);
  };

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
    if (!question || loading || !apiKey) return;
    const history = messages.map(({ role, text: t }) => ({ role, text: t }));
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const pageContext = (document.querySelector(contextSelector) as HTMLElement | null)?.innerText ?? "";
      const res = await fetch("/api/ai/helper", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-gemini-key": apiKey },
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
        {!apiKey || editingKey ? (
          <div style={styles.keyBox}>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>🔑 Gemini API 키 입력</strong>
            <p style={styles.notice}>
              AI 도우미는 본인의 Google Gemini API 키로 동작합니다(사용 요금은 키 주인에게 청구). Google AI Studio{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
                aistudio.google.com/apikey
              </a>
              에서 발급받아 넣어 주세요. 인증되면 이 브라우저에만 저장되고, 질문할 때만 구글로 전달되며 서버에는 저장하지 않습니다.
            </p>
            <form
              style={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                verifyKey();
              }}
            >
              <input
                type="password"
                className="premium-input"
                style={{ flex: 1, fontSize: "0.85rem" }}
                placeholder="AIza... 로 시작하는 API 키"
                autoComplete="off"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <button type="submit" className="premium-button" disabled={keyChecking || !keyInput.trim()} style={{ padding: "8px 16px" }}>
                {keyChecking ? "확인 중..." : "인증"}
              </button>
              {editingKey && (
                <button type="button" className="premium-button-secondary" onClick={() => setEditingKey(false)} style={{ padding: "8px 12px" }}>
                  취소
                </button>
              )}
            </form>
            {keyError && <span style={{ fontSize: "0.8rem", color: "var(--danger)" }}>⚠️ {keyError}</span>}
          </div>
        ) : (
          <div style={styles.keyLine}>
            <span>🔑 API 키 인증됨 (이 브라우저에 저장)</span>
            <span style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={() => setEditingKey(true)} style={styles.linkBtn}>
                변경
              </button>
              <button type="button" onClick={removeKey} style={styles.linkBtn}>
                삭제
              </button>
            </span>
          </div>
        )}
        <p style={styles.notice}>
          지금 화면의 내용을 바탕으로, 필요하면 웹 검색까지 더해 답합니다. 질문과 현재 화면 내용이 AI 답변을 위해 전송되며, 대화는 저장되지
          않습니다. 답변은 참고용이니 중요한 결정은 국민연금공단(☎1355) 등에서 확인하세요.
        </p>

        <div ref={listRef} style={styles.list}>
          {apiKey && messages.length === 0 && examples.length > 0 && (
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
            placeholder={apiKey ? "궁금한 점을 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)" : "먼저 위에서 API 키를 인증해 주세요"}
            disabled={!apiKey}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <button type="submit" className="premium-button" disabled={loading || !input.trim() || !apiKey} style={{ padding: "8px 16px" }}>
            보내기
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={openHelper} className={buttonClassName} style={buttonStyle}>
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
  keyBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(99, 102, 241, 0.35)",
    backgroundColor: "rgba(99, 102, 241, 0.06)",
  },
  keyLine: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--text-muted)" },
  linkBtn: { border: "none", background: "none", padding: 0, color: "var(--primary-light)", textDecoration: "underline", fontSize: "0.78rem", cursor: "pointer" },
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
