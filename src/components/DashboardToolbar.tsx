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
  | "dbDcTransition"
  | "threeBucket"
  | "pensionTransfer"
  | "retirementRoadmap"
  | "scenarioComparison"
  | "accountTaxMatrix"
  | "cashflowTracker"
  | "interactiveAdvisor"
  | "taxAndHealthStatement"
  | "dividendCalendar"
  | "shareSnapshot"
  | "stressTest"
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

      {/* Sprint 42: 생애 D-Day 로드맵 & 시나리오 비교 & 절세계좌 매트릭스 */}
      <button
        id="btn-retirement-roadmap-actions"
        onClick={() => onOpenModal("retirementRoadmap")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(99, 102, 241, 0.5)",
          color: "#818cf8",
          background: "rgba(99, 102, 241, 0.12)",
        }}
        title="은퇴 생애 D-Day 타임라인 및 연령대별 필수 실행 체크리스트"
      >
        🧭 D-Day 로드맵
      </button>

      <button
        id="btn-scenario-comparison-actions"
        onClick={() => onOpenModal("scenarioComparison")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(168, 85, 247, 0.5)",
          color: "#c084fc",
          background: "rgba(168, 85, 247, 0.12)",
        }}
        title="복수 은퇴 시나리오 비교함 (A안 기준 vs B안 조기 vs C안 연기)"
      >
        📊 시나리오 비교
      </button>

      <button
        id="btn-account-tax-matrix-actions"
        onClick={() => onOpenModal("accountTaxMatrix")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(20, 184, 166, 0.5)",
          color: "#2dd4bf",
          background: "rgba(20, 184, 166, 0.12)",
        }}
        title="2026 절세 계좌 4총사(ISA/연금저축/IRP/일반계좌) 최적 자산배분 매트릭스"
      >
        📑 절세 매트릭스
      </button>

      {/* Sprint 43: 실전 은퇴 가계부 & 1:1 대화형 AI 어드바이저 */}
      <button
        id="btn-cashflow-tracker-actions"
        onClick={() => onOpenModal("cashflowTracker")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(59, 130, 246, 0.5)",
          color: "#60a5fa",
          background: "rgba(59, 130, 246, 0.12)",
        }}
        title="은퇴 후 실제 월별 지출·수입 기록 및 자산 소진 런웨이(Runway) 진단"
      >
        💳 가계부·런웨이
      </button>

      <button
        id="btn-interactive-advisor-actions"
        onClick={() => onOpenModal("interactiveAdvisor")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(168, 85, 247, 0.5)",
          color: "#c084fc",
          background: "rgba(168, 85, 247, 0.12)",
        }}
        title="내 연금 자산 실시간 기반 1:1 대화형 AI 인터랙티브 은퇴 상담"
      >
        🤖 1:1 AI 상담
      </button>

      {/* 3대 신규 킬러 기능 버튼 */}
      <button
        id="btn-db-dc-transition-actions"
        onClick={() => onOpenModal("dbDcTransition")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(245, 158, 11, 0.5)",
          color: "#f59e0b",
          background: "rgba(245, 158, 11, 0.1)",
        }}
        title="퇴직연금 DB vs DC 전환 및 임금피크제 최적 타이밍 시뮬레이터"
      >
        ⚖️ DB/DC 전환
      </button>

      <button
        id="btn-three-bucket-actions"
        onClick={() => onOpenModal("threeBucket")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(6, 182, 212, 0.5)",
          color: "#06b6d4",
          background: "rgba(6, 182, 212, 0.1)",
        }}
        title="은퇴자 맞춤 3-Bucket 현금 버퍼 플래너 (하락장 방패 설계)"
      >
        🪣 3-Bucket 플랜
      </button>

      <button
        id="btn-pension-transfer-actions"
        onClick={() => onOpenModal("pensionTransfer")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(16, 185, 129, 0.5)",
          color: "#10b981",
          background: "rgba(16, 185, 129, 0.1)",
        }}
        title="개인연금(IRP/연금저축) 금융사 갈아타기(계좌이체) 실익 분석기"
      >
        🔄 연금 갈아타기
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

      {/* Sprint 44: 신규 전문 분석 및 공유 도구 4종 */}
      <button
        id="btn-tax-health-statement-actions"
        onClick={() => onOpenModal("taxAndHealthStatement")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(16, 185, 129, 0.4)",
          color: "#10b981",
          background: "rgba(16, 185, 129, 0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="은퇴 세금 & 건강보험료 모의 고지서 통합 A4 명세서 및 인쇄"
      >
        <span>📑 세무·건보 고지서</span>
      </button>

      <button
        id="btn-dividend-calendar-actions"
        onClick={() => onOpenModal("dividendCalendar")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(99, 102, 241, 0.4)",
          color: "#818cf8",
          background: "rgba(99, 102, 241, 0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="월별 배당 인컴 캘린더 & 연금 인출 스케줄러"
      >
        <span>📅 배당 캘린더</span>
      </button>

      <button
        id="btn-stress-test-actions"
        onClick={() => onOpenModal("stressTest")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(239, 68, 68, 0.4)",
          color: "#f87171",
          background: "rgba(239, 68, 68, 0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="고물가 4.5% + 연금개시 68세 + 시장 -30% 폭락 3중 복합 위기 스트레스 테스트"
      >
        <span>⚡ 스트레스 테스트</span>
      </button>

      <button
        id="btn-share-snapshot-actions"
        onClick={() => onOpenModal("shareSnapshot")}
        className="premium-button-secondary"
        style={{
          fontSize: "0.75rem",
          padding: "6px 12px",
          fontWeight: 700,
          borderColor: "rgba(14, 165, 233, 0.4)",
          color: "#38bdf8",
          background: "rgba(14, 165, 233, 0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="은퇴 시뮬레이션 부부·가족 공유 스냅샷 링크 및 요약 문구 생성"
      >
        <span>🔗 가족 공유</span>
      </button>
    </div>
  );
}
