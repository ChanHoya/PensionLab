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
  const renderTaskRef = useRef<any>(null);

  // PDF 로드
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        // 로컬 서빙 pdfjs-dist worker 설정
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

  // 페이지 렌더링
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    // 이전 렌더 작업 취소
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

      const viewport = page.getViewport({ scale });
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
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentPage, totalPages]);

  const prev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const next = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  if (!isOpen) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
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
              onClick={() => setScale((s) => Math.max(0.7, s - 0.2))}
              style={iconBtn}
              title="축소"
            >−</button>
            <span style={scaleLabel}>{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
              style={iconBtn}
              title="확대"
            >+</button>
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

          {/* 페이지 점 인디케이터 (최대 10개 표시) */}
          <div style={dots}>
            {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => {
              const page = i + 1;
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={dot(isActive)}
                  title={`${page}페이지`}
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
  maxHeight: "none",
  backgroundColor: "#161728",
  borderLeft: "1px solid rgba(99, 102, 241, 0.2)",
  borderRight: "1px solid rgba(99, 102, 241, 0.2)",
  borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
  borderRadius: "0px",
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

const canvasStyle: React.CSSProperties = {
  maxWidth: "100%",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  borderRadius: "4px",
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
