"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title?: string;
}

export default function PdfViewerModal({
  isOpen,
  onClose,
  pdfUrl = "/Pension_Blueprint.pdf",
  title = "서비스 소개"
}: PdfViewerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1.3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const renderTaskRef = useRef<any>(null);

  // PDF 로드
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const doc = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("PDF 로드 오류:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [isOpen, pdfUrl]);

  // 페이지 렌더링 (일반/전체화면 공통)
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    setIsLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let useScale = scale;

      // 전체화면 모드: 뷰포트에 맞게 스케일 자동 계산
      if (isFullscreen) {
        const baseViewport = page.getViewport({ scale: 1.0 });
        const availW = window.innerWidth - 180;  // 좌우 화살표 공간
        const availH = window.innerHeight - 130; // 상단 바 + 하단 인디케이터
        useScale = Math.min(availW / baseViewport.width, availH / baseViewport.height);
        useScale = Math.max(0.4, useScale);
      }

      const viewport = page.getViewport({ scale: useScale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("페이지 렌더 오류:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pdfDoc, scale, isFullscreen]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setCurrentPage(p => Math.min(totalPages, p + 1));
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, totalPages, isFullscreen, onClose]);

  const prev = () => setCurrentPage(p => Math.max(1, p - 1));
  const next = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  if (!isOpen) return null;

  // ─── 전체화면 렌더 ───────────────────────────────────────
  if (isFullscreen) {
    return (
      <div style={fsOverlay}>
        {/* 상단 바 */}
        <div style={fsTopBar}>
          <span style={badge}>📄 {title}</span>
          <span style={fsPageInfo}>{currentPage} / {totalPages}</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setIsFullscreen(false)}
              style={iconBtn}
              title="전체화면 종료 (Esc)"
            >
              ⊡
            </button>
            <button onClick={onClose} style={closeBtn} title="닫기">✕</button>
          </div>
        </div>

        {/* 중앙 영역: 이전 버튼 | 캔버스 | 다음 버튼 */}
        <div style={fsCenterRow}>
          {/* 이전 버튼 */}
          <button
            onClick={prev}
            disabled={currentPage <= 1}
            style={fsSideBtn(currentPage <= 1)}
            aria-label="이전 페이지"
          >
            ‹
          </button>

          {/* 캔버스 */}
          <div style={fsCanvasArea}>
            {isLoading && (
              <div style={loaderOverlay}>
                <div style={spinner} />
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{ borderRadius: "6px", boxShadow: "0 12px 48px rgba(0,0,0,0.7)", display: "block" }}
            />
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={next}
            disabled={currentPage >= totalPages}
            style={fsSideBtn(currentPage >= totalPages)}
            aria-label="다음 페이지"
          >
            ›
          </button>
        </div>

        {/* 하단 페이지 인디케이터 오버레이 */}
        <div style={fsBottomBar}>
          <div style={dots}>
            {Array.from({ length: Math.min(totalPages, 15) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={dot(p === currentPage)}
                  title={`${p}페이지`}
                />
              );
            })}
            {totalPages > 15 && (
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>
                ...{totalPages}p
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── 일반 모달 렌더 ───────────────────────────────────────
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={header}>
          <div style={headerLeft}>
            <span style={badge}>📄 {title}</span>
            <span style={pageInfo}>
              {totalPages > 0 ? `${currentPage} / ${totalPages}` : "로딩 중..."}
            </span>
          </div>
          <div style={headerRight}>
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
              style={iconBtn}
              title="축소"
            >−</button>
            <span style={scaleLabel}>{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
              style={iconBtn}
              title="확대"
            >+</button>
            <button
              onClick={() => setIsFullscreen(true)}
              style={{ ...iconBtn, marginLeft: "6px", fontSize: "1rem" }}
              title="전체화면"
            >⛶</button>
            <button onClick={onClose} style={closeBtn} title="닫기">✕</button>
          </div>
        </div>

        {/* 캔버스 영역 */}
        <div style={canvasWrapper}>
          {isLoading && (
            <div style={loaderOverlay}>
              <div style={spinner} />
            </div>
          )}
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>

        {/* 하단 네비게이션 */}
        <div style={footer}>
          <button
            onClick={prev}
            disabled={currentPage <= 1}
            style={navBtn(currentPage <= 1)}
            title="이전 페이지 (←)"
          >
            ← 이전
          </button>

          <div style={dots}>
            {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={dot(p === currentPage)}
                  title={`${p}페이지`}
                />
              );
            })}
            {totalPages > 12 && (
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                ...{totalPages}p
              </span>
            )}
          </div>

          <button
            onClick={next}
            disabled={currentPage >= totalPages}
            style={navBtn(currentPage >= totalPages)}
            title="다음 페이지 (→)"
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 스타일 ─────────────────────────────────────────── */

// 일반 모달
const overlay: React.CSSProperties = {
  position: "fixed",
  top: "70px",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(5, 6, 15, 0.88)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  zIndex: 99,
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  padding: "0 40px",
};

const modal: React.CSSProperties = {
  width: "100%",
  maxWidth: "1200px",
  height: "100%",
  backgroundColor: "#161728",
  borderLeft: "1px solid rgba(99, 102, 241, 0.2)",
  borderRight: "1px solid rgba(99, 102, 241, 0.2)",
  borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  borderBottom: "1px solid rgba(99,102,241,0.15)",
  backgroundColor: "rgba(22, 23, 40, 0.95)",
  flexShrink: 0,
};

const headerLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const headerRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  background: "rgba(99,102,241,0.15)",
  border: "1px solid rgba(99,102,241,0.3)",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#a5b4fc",
  letterSpacing: "0.04em",
};

const pageInfo: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "#9497b8",
};

const scaleLabel: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#9497b8",
  minWidth: "38px",
  textAlign: "center",
};

const iconBtn: React.CSSProperties = {
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(99,102,241,0.1)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: "6px",
  color: "#a5b4fc",
  fontSize: "1rem",
  cursor: "pointer",
  lineHeight: 1,
};

const closeBtn: React.CSSProperties = {
  marginLeft: "8px",
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: "8px",
  color: "#f87171",
  fontSize: "0.95rem",
  cursor: "pointer",
};

const canvasWrapper: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  overflowX: "auto",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "24px",
  backgroundColor: "#0d0e1c",
  position: "relative",
  minHeight: "400px",
};

const loaderOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(13,14,28,0.7)",
  zIndex: 10,
};

const spinner: React.CSSProperties = {
  width: "40px",
  height: "40px",
  border: "3px solid rgba(99,102,241,0.2)",
  borderTop: "3px solid #6366f1",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

// 줌 버그 수정: maxWidth 제거 → 캔버스가 스케일대로 실제 크기로 표시됨
const canvasStyle: React.CSSProperties = {
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  borderRadius: "4px",
  display: "block",
};

const footer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 24px",
  borderTop: "1px solid rgba(99,102,241,0.15)",
  backgroundColor: "rgba(22,23,40,0.95)",
  flexShrink: 0,
  gap: "16px",
};

const dots: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center",
};

const dot = (active: boolean): React.CSSProperties => ({
  width: active ? "20px" : "8px",
  height: "8px",
  borderRadius: "999px",
  background: active
    ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
    : "rgba(99,102,241,0.25)",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s ease",
  padding: 0,
  flexShrink: 0,
});

const navBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "9px 20px",
  background: disabled
    ? "rgba(99,102,241,0.05)"
    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
  border: "1px solid",
  borderColor: disabled ? "rgba(99,102,241,0.15)" : "transparent",
  borderRadius: "8px",
  color: disabled ? "#5c6080" : "#ffffff",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  boxShadow: disabled ? "none" : "0 2px 12px rgba(99,102,241,0.35)",
});

// 전체화면 스타일
const fsOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  backgroundColor: "#080910",
  display: "flex",
  flexDirection: "column",
};

const fsTopBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 20px",
  backgroundColor: "rgba(14, 15, 28, 0.95)",
  borderBottom: "1px solid rgba(99,102,241,0.12)",
  flexShrink: 0,
  gap: "12px",
};

const fsPageInfo: React.CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.6)",
  flex: 1,
  textAlign: "center",
};

const fsCenterRow: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0",
  overflow: "hidden",
  position: "relative",
};

const fsCanvasArea: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  position: "relative",
  height: "100%",
};

const fsSideBtn = (disabled: boolean): React.CSSProperties => ({
  flexShrink: 0,
  width: "72px",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: disabled
    ? "transparent"
    : "rgba(99,102,241,0.06)",
  border: "none",
  color: disabled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)",
  fontSize: "4rem",
  fontWeight: 300,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.15s ease",
  lineHeight: 1,
  userSelect: "none",
});

const fsBottomBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 24px 14px 24px",
  backgroundColor: "rgba(14, 15, 28, 0.92)",
  borderTop: "1px solid rgba(99,102,241,0.10)",
  flexShrink: 0,
  backdropFilter: "blur(8px)",
};
