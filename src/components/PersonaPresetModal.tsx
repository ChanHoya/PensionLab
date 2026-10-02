"use client";

import React, { useState } from "react";
import { PERSONA_PRESETS, type PersonaPreset } from "@/config/personas";
import { usePensionStore } from "@/store/usePensionStore";

interface PersonaPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuccess?: (persona: PersonaPreset) => void;
}

export default function PersonaPresetModal({
  isOpen,
  onClose,
  onSelectSuccess,
}: PersonaPresetModalProps) {
  const loadPersonaPreset = usePensionStore((s) => s.loadPersonaPreset);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: PersonaPreset) => {
    setLoadingId(preset.id);
    setSelectedId(preset.id);

    try {
      const success = loadPersonaPreset(preset.id);
      if (success) {
        setToastMessage(`'${preset.title}' 데이터를 성공적으로 불러왔습니다!`);
        setTimeout(() => {
          setLoadingId(null);
          onSelectSuccess?.(preset);
          onClose();
        }, 500);
      } else {
        alert("페르소나 데이터를 불러오지 못했습니다.");
        setLoadingId(null);
      }
    } catch (err) {
      console.error("페르소나 로드 실패:", err);
      alert("페르소나 적용 중 오류가 발생했습니다.");
      setLoadingId(null);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <span style={{ fontSize: "1rem" }}>✨</span>
              <span>원클릭 시뮬레이션 샘플 로더</span>
            </div>
            <h2 style={styles.title}>
              대한민국 대표 가구 <span className="gradient-text">페르소나 3종</span> 체험
            </h2>
            <p style={styles.subtitle}>
              복잡한 수치 입력 없이 나와 가장 유사한 라이프스타일을 선택하세요. 1·2·3층 연금 포트폴리오와 맞춤 지출 곡선이 즉시 적용됩니다.
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="닫기" aria-label="닫기">
            ✕
          </button>
        </div>

        {/* 안내 알림 토스트 (적용 시 표시) */}
        {toastMessage && (
          <div style={styles.toast}>
            <span>🎉 {toastMessage}</span>
          </div>
        )}

        {/* 본문: 페르소나 카드 3종 그리드 */}
        <div style={styles.body}>
          <div style={styles.grid}>
            {PERSONA_PRESETS.map((preset) => {
              const isSelected = selectedId === preset.id;
              const isLoading = loadingId === preset.id;

              return (
                <div
                  key={preset.id}
                  style={{
                    ...styles.card,
                    borderColor: isSelected ? preset.tagColor : "rgba(99, 102, 241, 0.2)",
                    boxShadow: isSelected
                      ? `0 12px 30px ${preset.tagColor}33`
                      : "0 4px 20px rgba(0,0,0,0.25)",
                  }}
                >
                  {/* 카드 상단 배지 & 아이콘 */}
                  <div style={styles.cardHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={styles.cardIcon}>{preset.icon}</span>
                      <span
                        style={{
                          ...styles.tagBadge,
                          backgroundColor: `${preset.tagColor}22`,
                          color: preset.tagColor,
                          borderColor: `${preset.tagColor}44`,
                        }}
                      >
                        {preset.tag}
                      </span>
                    </div>
                  </div>

                  {/* 제목 & 서브타이틀 */}
                  <h3 style={styles.cardTitle}>{preset.title}</h3>
                  <p style={styles.cardSubtitle}>{preset.subtitle}</p>

                  {/* 대상 사용자 설명 */}
                  <div style={styles.targetDescBox}>
                    <p style={styles.targetDescText}>{preset.targetUserDesc}</p>
                  </div>

                  {/* 주요 특징 체크리스트 */}
                  <div style={styles.featureList}>
                    {preset.keyFeatures.map((feat, idx) => (
                      <div key={idx} style={styles.featureItem}>
                        <span style={{ color: preset.tagColor, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* 핵심 지표 박스 (2x2) */}
                  <div style={styles.metricGrid}>
                    <div style={styles.metricItem}>
                      <span style={styles.metricLabel}>🎯 목표 연금 수령액</span>
                      <strong style={styles.metricValue}>{preset.summaryMetrics.monthlyPensionTarget}</strong>
                    </div>
                    <div style={styles.metricItem}>
                      <span style={styles.metricLabel}>💰 총 연금 적립 자산</span>
                      <strong style={styles.metricValue}>{preset.summaryMetrics.totalAccumulatedAssets}</strong>
                    </div>
                    <div style={styles.metricItem}>
                      <span style={styles.metricLabel}>🏛 연금 구조 유형</span>
                      <strong style={styles.metricValue}>{preset.summaryMetrics.structureType}</strong>
                    </div>
                    <div style={styles.metricItem}>
                      <span style={styles.metricLabel}>💡 핵심 전략 포인트</span>
                      <strong style={{ ...styles.metricValue, color: "var(--accent-cyan)" }}>
                        {preset.summaryMetrics.strategyTip}
                      </strong>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    disabled={isLoading}
                    style={{
                      ...styles.actionBtn,
                      background: `linear-gradient(135deg, ${preset.tagColor} 0%, #4338ca 100%)`,
                    }}
                  >
                    {isLoading ? "데이터 로딩 중..." : "이 페르소나 데이터로 즉시 체험하기 →"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div style={styles.footer}>
          <div style={styles.footerNotice}>
            <span style={{ fontSize: "1rem" }}>🔒</span>
            <span>
              페르소나 데이터를 불러와도 브라우저 메모리에만 즉시 반영되며, 상단의 <strong>백업/복원</strong> 기능을 통해 언제든 본인의 원래 데이터로 되돌릴 수 있습니다.
            </span>
          </div>
          <button onClick={onClose} className="premium-button-secondary" style={styles.closeFooterBtn}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(5, 6, 15, 0.82)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modal: {
    width: "100%",
    maxWidth: "1280px",
    maxHeight: "92vh",
    backgroundColor: "var(--card-bg, #0f172a)",
    borderRadius: "20px",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 28px 18px",
    borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    flexShrink: 0,
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "var(--accent-cyan, #06b6d4)",
    backgroundColor: "rgba(6, 182, 212, 0.12)",
    border: "1px solid rgba(6, 182, 212, 0.25)",
    padding: "3px 10px",
    borderRadius: "20px",
    marginBottom: "8px",
  },
  title: {
    fontSize: "1.45rem",
    fontWeight: 800,
    color: "var(--text-primary, #f8fafc)",
    margin: "0 0 6px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "0.88rem",
    color: "var(--text-secondary, #94a3b8)",
    margin: 0,
    lineHeight: 1.5,
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "var(--text-secondary, #94a3b8)",
    borderRadius: "10px",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  toast: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderBottom: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#10b981",
    padding: "10px 24px",
    fontSize: "0.88rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: "24px 28px",
    overflowY: "auto",
    flex: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.45)",
    borderRadius: "16px",
    border: "1px solid",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.25s ease",
    backdropFilter: "blur(10px)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  cardIcon: {
    fontSize: "1.6rem",
  },
  tagBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "8px",
    border: "1px solid",
  },
  cardTitle: {
    fontSize: "1.18rem",
    fontWeight: 800,
    color: "var(--text-primary, #f8fafc)",
    margin: "0 0 4px 0",
    letterSpacing: "-0.01em",
  },
  cardSubtitle: {
    fontSize: "0.82rem",
    color: "var(--accent-purple, #a855f7)",
    fontWeight: 600,
    margin: "0 0 14px 0",
  },
  targetDescBox: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "16px",
  },
  targetDescText: {
    fontSize: "0.82rem",
    color: "var(--text-secondary, #cbd5e1)",
    margin: 0,
    lineHeight: 1.5,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "18px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "0.82rem",
    color: "var(--text-secondary, #94a3b8)",
    lineHeight: 1.45,
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    marginBottom: "20px",
    marginTop: "auto",
  },
  metricItem: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  metricLabel: {
    fontSize: "0.72rem",
    color: "var(--text-muted, #64748b)",
  },
  metricValue: {
    fontSize: "0.84rem",
    fontWeight: 700,
    color: "var(--text-primary, #f8fafc)",
    lineHeight: 1.35,
  },
  actionBtn: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "0.88rem",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
    transition: "all 0.2s ease",
  },
  footer: {
    padding: "16px 28px",
    borderTop: "1px solid rgba(99, 102, 241, 0.15)",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  footerNotice: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.8rem",
    color: "var(--text-muted, #94a3b8)",
    flex: 1,
    minWidth: "260px",
  },
  closeFooterBtn: {
    fontSize: "0.85rem",
    padding: "8px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
