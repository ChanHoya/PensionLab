"use client";

import React, { useState, useRef, useEffect } from "react";
import { GLOSSARY_TERMS, GlossaryTerm, getGlossaryTerm } from "@/config/glossary";

interface GlossaryTooltipProps {
  termId: keyof typeof GLOSSARY_TERMS | string;
  children?: React.ReactNode;
  onOpenModal?: (modalId: string) => void;
  showIcon?: boolean;
}

export default function GlossaryTooltip({
  termId,
  children,
  onOpenModal,
  showIcon = true,
}: GlossaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const termData: GlossaryTerm | undefined = getGlossaryTerm(termId);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  if (!termData) {
    return <span>{children}</span>;
  }

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    pension: { bg: "rgba(59, 130, 246, 0.12)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" },
    tax: { bg: "rgba(168, 85, 247, 0.12)", text: "#c084fc", border: "rgba(168, 85, 247, 0.3)" },
    health: { bg: "rgba(239, 68, 68, 0.12)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
    investment: { bg: "rgba(16, 185, 129, 0.12)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" },
    general: { bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
  };

  const catStyle = categoryColors[termData.category] || categoryColors.general;

  return (
    <span
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        cursor: "pointer",
        lineHeight: "inherit",
      }}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        style={{
          borderBottom: "1.5px dashed var(--accent, #6366f1)",
          color: "inherit",
          fontWeight: 600,
          transition: "all 0.15s ease",
          paddingBottom: "1px",
        }}
        title="클릭하여 쉬운 설명 보기"
      >
        {children || termData.term}
      </span>
      {showIcon && (
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--accent, #6366f1)",
            marginLeft: "2px",
            verticalAlign: "super",
            opacity: 0.85,
            fontWeight: 700,
          }}
        >
          ⓘ
        </span>
      )}

      {/* 팝오버 카드 */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className="t-modal-spring"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "320px",
            maxWidth: "88vw",
            backgroundColor: "var(--surface, #1e293b)",
            color: "var(--text-primary, #f8fafc)",
            border: "1px solid var(--border, rgba(255, 255, 255, 0.12))",
            borderRadius: "14px",
            padding: "16px",
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.45), 0 0 1px 1px rgba(255, 255, 255, 0.08)",
            zIndex: 9999,
            fontSize: "0.82rem",
            lineHeight: 1.5,
            textAlign: "left",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            cursor: "default",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더: 카테고리 배지 & 용어명 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                backgroundColor: catStyle.bg,
                color: catStyle.text,
                border: `1px solid ${catStyle.border}`,
                whiteSpace: "nowrap",
              }}
            >
              {termData.categoryLabel}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted, #94a3b8)",
                fontSize: "1rem",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1,
              }}
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary, #f8fafc)", marginBottom: "8px" }}>
            {termData.term}
          </div>

          {/* 1줄 쉬운 비유 (하이라이트 박스) */}
          <div
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              borderLeft: "3px solid #6366f1",
              padding: "8px 10px",
              borderRadius: "0 8px 8px 0",
              marginBottom: "10px",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--text-primary, #e2e8f0)",
            }}
          >
            💡 <span style={{ color: "#a5b4fc" }}>쉬운 비유:</span> {termData.shortDefinition}
          </div>

          {/* 구체적 원리 */}
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #cbd5e1)", marginBottom: "10px" }}>
            {termData.detailExplanation}
          </div>

          {/* 실전 대응 꿀팁 */}
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "8px 10px",
              borderRadius: "8px",
              fontSize: "0.74rem",
              color: "var(--text-primary, #e2e8f0)",
              marginBottom: termData.relatedModal ? "10px" : "0",
            }}
          >
            <span style={{ fontWeight: 700, color: "#34d399" }}>🎯 실전 꿀팁:</span> {termData.actionTip}
          </div>

          {/* 관련 모달 바로가기 버튼 */}
          {termData.relatedModal && onOpenModal && (
            <button
              onClick={() => {
                setIsOpen(false);
                if (termData.relatedModal) onOpenModal(termData.relatedModal);
              }}
              className="premium-button-secondary"
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#6366f1",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                borderColor: "rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                borderRadius: "6px",
              }}
            >
              <span>{termData.relatedToolLabel || "관련 계산기 바로가기 ↗"}</span>
            </button>
          )}

          {/* 말풍선 꼬리표 */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--border, rgba(255, 255, 255, 0.12))",
            }}
          />
        </div>
      )}
    </span>
  );
}
