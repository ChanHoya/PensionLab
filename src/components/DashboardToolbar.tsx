"use client";

import React from "react";

export type DashboardModalType =
  | "quickDiagnosis"
  | "persona"
  | "bep"
  | "tax15"
  | "healthBill"
  | "reverseMortgage"
  | "incomeBridge"
  | "npsBoost"
  | "savingsPlan"
  | "survivorCare"
  | "isaTransfer"
  | "dividendStrategy"
  | "portfolioBacktest"
  | null;

interface DashboardToolbarProps {
  onOpenModal: (modal: DashboardModalType) => void;
}

export default function DashboardToolbar({ onOpenModal }: DashboardToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {/* 30초 퀵 간편 진단 (초심자 진입용) */}
      <button
        id="btn-quick-diagnosis-actions"
        onClick={() => onOpenModal("quickDiagnosis")}
        className="premium-button"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 800,
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          color: "#ffffff",
          boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
        }}
        title="초보자를 위한 30초 퀵 간편 진단 (Easy Mode)"
      >
        ⚡ 30초 퀵 진단
      </button>

      <button
        id="btn-nps-boost-actions"
        onClick={() => onOpenModal("npsBoost")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(14, 165, 233, 0.45)",
          color: "#0ea5e9",
          background: "rgba(14, 165, 233, 0.08)",
        }}
        title="국민연금 반납·추납·임의계속가입·연기 단계별 증액 로드맵 및 회수 기간"
      >
        🪜 연금 증액
      </button>

      <button
        id="btn-tax15-actions"
        onClick={() => onOpenModal("tax15")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(234, 179, 8, 0.4)",
          color: "#eab308",
          background: "rgba(234, 179, 8, 0.08)",
        }}
        title="사적연금 연 1,500만원 절세 한도 최적화기"
      >
        💰 절세한도
      </button>

      <button
        id="btn-health-bill-actions"
        onClick={() => onOpenModal("healthBill")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(239, 68, 68, 0.4)",
          color: "#ef4444",
          background: "rgba(239, 68, 68, 0.08)",
        }}
        title="은퇴 후 지역건강보험료 모의 고지서 및 임의계속가입(36개월) 절감 계산기"
      >
        🧾 건보료
      </button>

      <button
        id="btn-reverse-mortgage-actions"
        onClick={() => onOpenModal("reverseMortgage")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(16, 185, 129, 0.4)",
          color: "var(--success-light, #10b981)",
          background: "rgba(16, 185, 129, 0.08)",
        }}
        title="한국주택금융공사(HF) 주택연금(역모기지) 결합 시뮬레이션"
      >
        🏠 주택연금
      </button>

      <button
        id="btn-income-bridge-actions"
        onClick={() => onOpenModal("incomeBridge")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(56, 189, 248, 0.4)",
          color: "#38bdf8",
          background: "rgba(56, 189, 248, 0.08)",
        }}
        title="은퇴 소득 공백기(소득 크레바스) 브릿지 집중 플래너"
      >
        🌉 소득공백기
      </button>

      <button
        id="btn-survivor-care-actions"
        onClick={() => onOpenModal("survivorCare")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(244, 63, 94, 0.4)",
          color: "#fb7185",
          background: "rgba(244, 63, 94, 0.08)",
        }}
        title="홀로 남은 배우자(1인 가구) 생애 케어 시뮬레이터"
      >
        🕊️ 유족케어
      </button>

      <button
        id="btn-isa-transfer-actions"
        onClick={() => onOpenModal("isaTransfer")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(168, 85, 247, 0.4)",
          color: "#c084fc",
          background: "rgba(168, 85, 247, 0.08)",
        }}
        title="ISA 만기 자금 연금계좌 전환 및 3년 풍차돌리기 절세 플래너"
      >
        💎 ISA전환
      </button>

      <button
        id="btn-nps-bep-toolbar"
        onClick={() => onOpenModal("bep")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(249, 115, 22, 0.4)",
          color: "#f97316",
          background: "rgba(249, 115, 22, 0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="국민연금 조기 vs 정상 vs 연기 손익분기점(BEP) 인터랙티브 비교기"
      >
        <span>⚖️ 조기 vs 정상 vs 연기 손익분기(BEP)</span>
        <span style={{ fontSize: "0.75rem", color: "#f97316" }}>⚡</span>
      </button>

      <button
        id="btn-dividend-strategy-actions"
        onClick={() => onOpenModal("dividendStrategy")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(99, 102, 241, 0.4)",
          color: "#a5b4fc",
          background: "rgba(99, 102, 241, 0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="대표적인 연금 배당 투자 포트폴리오 4선 추천 및 분배율 원클릭 적용"
      >
        <span>💡 배당금 투자 전략</span>
      </button>

      <button
        id="btn-portfolio-backtest-actions"
        onClick={() => onOpenModal("portfolioBacktest")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(16, 185, 129, 0.4)",
          color: "var(--success-light, #10b981)",
          background: "rgba(16, 185, 129, 0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="은퇴 자산 포트폴리오 10년 시장 시나리오 백테스트 및 배당 복리 검증"
      >
        <span>📊 포트폴리오 백테스트</span>
      </button>
    </div>
  );
}
