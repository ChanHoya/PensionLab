"use client";

import React, { useState } from "react";
import {
  ShareableSnapshotData,
  generateShareUrl,
  generateShareMessage,
} from "@/services/shareSnapshotService";

interface ShareSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshotData: ShareableSnapshotData;
}

export default function ShareSnapshotModal({
  isOpen,
  onClose,
  snapshotData,
}: ShareSnapshotModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen) return null;

  const shareUrl = generateShareUrl(snapshotData);
  const shareMessage = generateShareMessage(snapshotData, shareUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-snapshot-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="t-modal-spring"
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "92vh",
          backgroundColor: "var(--modal-bg, #ffffff)",
          color: "var(--modal-text, #0f172a)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--modal-border, #e2e8f0)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🔗</span>
            <div>
              <h2
                id="share-snapshot-modal-title"
                style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--modal-title, #0f172a)" }}
              >
                은퇴 시뮬레이션 부부·가족 공유 스냅샷
              </h2>
              <p style={{ fontSize: "12px", color: "var(--color-muted, #64748b)", margin: "2px 0 0" }}>
                설정한 은퇴 나이와 연금 자산 시뮬레이션을 링크 하나로 배우자에게 전달
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid var(--modal-border, #e2e8f0)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-muted, #64748b)",
            }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 요약 카드 */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "var(--modal-surface, #f8fafc)",
              border: "1px solid var(--modal-border, #e2e8f0)",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>현재/은퇴 나이</span>
              <div style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px" }}>
                만 {snapshotData.ca}세 ➔ 만 {snapshotData.ra}세
              </div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>목표 생활비</span>
              <div style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px" }}>
                월 {snapshotData.ms.toLocaleString()}만 원
              </div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>예상 국민연금</span>
              <div style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px" }}>
                월 {snapshotData.np.toLocaleString()}만 원
              </div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>사적/퇴직연금 자산</span>
              <div style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px" }}>
                {(snapshotData.rp + snapshotData.pp).toLocaleString()}만 원
              </div>
            </div>
          </div>

          {/* 공유 링크 복사 박스 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700" }}>🌐 공유 전용 스냅샷 링크</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--modal-border, #cbd5e1)",
                  backgroundColor: "var(--modal-surface-sub, #f1f5f9)",
                  fontSize: "12px",
                  color: "var(--modal-text, #334155)",
                  outline: "none",
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  backgroundColor: copiedLink ? "#10b981" : "#2563eb",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {copiedLink ? "✓ 복사됨" : "링크 복사"}
              </button>
            </div>
          </div>

          {/* 카카오톡 / 문자 메시지 복사 박스 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "13px", fontWeight: "700" }}>💬 카카오톡/문자 전송용 요약 메시지</label>
              <button
                onClick={handleCopyMessage}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  backgroundColor: copiedMessage ? "rgba(16, 185, 129, 0.15)" : "var(--modal-surface, #e2e8f0)",
                  color: copiedMessage ? "#059669" : "var(--modal-text, #334155)",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {copiedMessage ? "✓ 문구 복사완료" : "문구 복사"}
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={shareMessage}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--modal-border, #cbd5e1)",
                backgroundColor: "var(--modal-surface-sub, #f8fafc)",
                fontSize: "12px",
                lineHeight: "1.6",
                color: "var(--modal-text, #334155)",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* 개인정보 보안 안내 */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#065f46",
            }}
          >
            🔒 <strong>개인정보 안심 보장</strong>: 이름, 주민등록번호, 계좌번호 등 개인식별정보(PII)는 일절 포함되지
            않으며, 서버 저장 없이 순수 시뮬레이션 계산 변수만 암호화 인코딩되어 브라우저 간에 안전하게 전달됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
