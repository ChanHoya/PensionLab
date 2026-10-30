// 2026 국민연금 개혁안 비교 시뮬레이터 팝업 모달 컴포넌트

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  calculateNpsReform2026,
  getGenerationCohort,
  NpsReformUserInput,
} from "@/services/npsReform2026Service";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface NpsReform2026ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAge?: number;
  initialIncome?: number;
  hasSpouse?: boolean;
}

export default function NpsReform2026Modal({
  isOpen,
  onClose,
  initialAge = 45,
  initialIncome = 3500000,
  hasSpouse = false,
}: NpsReform2026ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"self" | "spouse">("self");

  // 본인 입력값
  const [selfAge, setSelfAge] = useState<number>(initialAge);
  const [selfIncome, setSelfIncome] = useState<number>(initialIncome);
  const [selfExistingYears, setSelfExistingYears] = useState<number>(15);
  const [selfLifeAge, setSelfLifeAge] = useState<number>(85);
  const [selfStartAge, setSelfStartAge] = useState<number>(65);

  // 배우자 입력값
  const [spouseAge, setSpouseAge] = useState<number>(Math.max(20, initialAge - 2));
  const [spouseIncome, setSpouseIncome] = useState<number>(2500000);
  const [spouseExistingYears, setSpouseExistingYears] = useState<number>(10);
  const [spouseLifeAge, setSpouseLifeAge] = useState<number>(88);
  const [spouseStartAge, setSpouseStartAge] = useState<number>(65);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentAge = activeTab === "self" ? selfAge : spouseAge;
  const currentIncome = activeTab === "self" ? selfIncome : spouseIncome;
  const currentExistingYears = activeTab === "self" ? selfExistingYears : spouseExistingYears;
  const currentLifeAge = activeTab === "self" ? selfLifeAge : spouseLifeAge;
  const currentStartAge = activeTab === "self" ? selfStartAge : spouseStartAge;

  const birthYear = 2026 - currentAge;
  const remainingYears = Math.max(0, 59 - currentAge + 1);

  const result = useMemo(() => {
    const input: NpsReformUserInput = {
      birthYear,
      currentAge,
      monthlyIncomeWon: currentIncome,
      existingYears: currentExistingYears,
      remainingYears,
      expectedLifeAge: currentLifeAge,
      payoutStartAge: currentStartAge,
    };
    return calculateNpsReform2026(input);
  }, [
    birthYear,
    currentAge,
    currentIncome,
    currentExistingYears,
    remainingYears,
    currentLifeAge,
    currentStartAge,
  ]);

  if (!isOpen || !mounted) return null;

  // 차트 데이터 (월 연금 vs 평생 수령액 vs 추가부담)
  const chartData = [
    {
      name: "월 수령액",
      개혁전: Math.round(result.monthlyPensionCurrent / 10000),
      개혁후: Math.round(result.monthlyPensionReform / 10000),
      단위: "만원/월",
    },
    {
      name: "평생 수령총액",
      개혁전: Math.round(result.lifetimePensionCurrent / 100000000 * 10) / 10,
      개혁후: Math.round(result.lifetimePensionReform / 100000000 * 10) / 10,
      단위: "억원",
    },
  ];

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 15, 29, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          backgroundColor: "var(--surface)",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          overflow: "hidden",
        }}
      >
        {/* 헤더 */}
        <div
          className="modal-header"
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--modal-header-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                color: "#3b82f6",
                fontSize: "18px",
              }}
            >
              🏛️
            </span>
            <div>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                2026 국민연금 개혁안 시나리오 비교 시뮬레이터
              </h2>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  margin: "3px 0 0 0",
                }}
              >
                보험료율 인상(9% ➔ 13% 세대별 차등)과 소득대체율 상향(40% ➔ 42%)에 따른 내 연금 실익 분석
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="닫기"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* 탭 네비게이션 (본인 / 배우자) */}
        {hasSpouse && (
          <div
            style={{
              padding: "12px 24px 0 24px",
              display: "flex",
              gap: "8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setActiveTab("self")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px 8px 0 0",
                fontSize: "0.88rem",
                fontWeight: activeTab === "self" ? "600" : "400",
                color: activeTab === "self" ? "var(--accent)" : "var(--text-muted)",
                backgroundColor: activeTab === "self" ? "var(--modal-surface-card)" : "transparent",
                border: "none",
                borderBottom: activeTab === "self" ? "2px solid var(--accent)" : "none",
                cursor: "pointer",
              }}
            >
              👤 본인 기준 분석
            </button>
            <button
              onClick={() => setActiveTab("spouse")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px 8px 0 0",
                fontSize: "0.88rem",
                fontWeight: activeTab === "spouse" ? "600" : "400",
                color: activeTab === "spouse" ? "var(--accent)" : "var(--text-muted)",
                backgroundColor: activeTab === "spouse" ? "var(--modal-surface-card)" : "transparent",
                border: "none",
                borderBottom: activeTab === "spouse" ? "2px solid var(--accent)" : "none",
                cursor: "pointer",
              }}
            >
              👥 배우자 기준 분석
            </button>
          </div>
        )}

        {/* 바디 (스크롤 영역) */}
        <div
          className="modal-body"
          style={{
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* 세대 코호트 뱃지 & 안내 패널 */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "var(--modal-surface-card)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.78rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: "#3b82f6",
                  fontWeight: "600",
                }}
              >
                세대별 차등 적용군
              </span>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  margin: "6px 0 2px 0",
                }}
              >
                {birthYear}년생 ({currentAge}세) ➔ {result.cohortLabel}
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                2026년부터 보험료율이 연 {result.annualRateIncrement}%p씩 인상되어 {result.full13Year}년에 최종 13%에 도달합니다.
              </p>
            </div>
            <div
              style={{
                textAlign: "right",
                padding: "8px 14px",
                backgroundColor: "var(--modal-subbox-bg)",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                만 59세까지 남은 납부 기간
              </span>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {remainingYears}년 ({result.totalRemainingMonths}개월)
              </div>
            </div>
          </div>

          {/* 파라미터 조절 슬라이더 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              padding: "16px",
              backgroundColor: "var(--modal-surface-card)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            {/* 현재 나이 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.84rem",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>현재 연령</span>
                <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {currentAge}세 ({birthYear}년생)
                </strong>
              </div>
              <input
                type="range"
                min="20"
                max="59"
                value={currentAge}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (activeTab === "self") setSelfAge(val);
                  else setSpouseAge(val);
                }}
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>

            {/* 기준소득월액 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.84rem",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>기준소득월액 (월 급여)</span>
                <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {(currentIncome / 10000).toLocaleString()}만원
                </strong>
              </div>
              <input
                type="range"
                min="1000000"
                max="6170000"
                step="100000"
                value={currentIncome}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (activeTab === "self") setSelfIncome(val);
                  else setSpouseIncome(val);
                }}
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>

            {/* 기 가입기간 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.84rem",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>과거 기 납부 기간</span>
                <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {currentExistingYears}년
                </strong>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                value={currentExistingYears}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (activeTab === "self") setSelfExistingYears(val);
                  else setSpouseExistingYears(val);
                }}
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>

            {/* 기대수명 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.84rem",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>기대수명 (수령 만료)</span>
                <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {currentLifeAge}세 ({currentLifeAge - currentStartAge}년 수령)
                </strong>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                value={currentLifeAge}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (activeTab === "self") setSelfLifeAge(val);
                  else setSpouseLifeAge(val);
                }}
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>
          </div>

          {/* 4대 핵심 결과 KPI 카드 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {/* 본인 추가 납부액 */}
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "var(--modal-surface-card)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                향후 본인 추가 납부액
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "#ef4444",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                +{(result.personalExtraCostTotal / 10000).toLocaleString()}만원
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                회사 50% 지원 제외 본인 몫
              </div>
            </div>

            {/* 월 연금액 증액분 */}
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "var(--modal-surface-card)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                은퇴 후 월 수령 증액
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "#10b981",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                +{(result.monthlyPensionIncrease / 10000).toLocaleString()}만원/월
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                소득대체율 40% ➔ 42% 상향
              </div>
            </div>

            {/* 평생 총 수령액 증액 */}
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "var(--modal-surface-card)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                평생 연금 총 증액분
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "#3b82f6",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                +{(result.lifetimePensionIncrease / 10000).toLocaleString()}만원
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {result.payoutYears}년간 총 수령 증가
              </div>
            </div>

            {/* 원금 회수(골든크로스) */}
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "var(--modal-surface-card)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                손익분기 회수 나이 (BEP)
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "#f59e0b",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                만 {result.bepAge}세 ({result.recoveryYears}년)
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                투자 대비 {result.costBenefitRatio}배 회수
              </div>
            </div>
          </div>

          {/* Recharts 개혁 전후 비교 바 차트 */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--modal-surface-card)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "var(--text-primary)",
                margin: "0 0 16px 0",
              }}
            >
              📊 개혁 전(현행) vs 2026 개혁안 비교 (현재가치 기준)
            </h4>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="개혁전" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="개혁후" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 세대별 개혁 영향 요약 가이드 */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--modal-subbox-bg)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              fontSize: "0.82rem",
              lineHeight: "1.6",
              color: "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
              💡 2026 국민연금 개혁 핵심 요약
            </strong>
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              <li>
                <strong>보험료율 인상</strong>: 현행 9%에서 최종 13%까지 단계적으로 인상되며, 은퇴가 임박한 50대는 매년 1%p씩 빠르게 인상되고 청년층(20대)은 매년 0.25%p씩 완만하게 인상됩니다.
              </li>
              <li>
                <strong>소득대체율 상향</strong>: 기존 40% 목표에서 42%로 상향 조정되어, 더 많이 내는 만큼 은퇴 후 매월 수령하는 국민연금 기본연금액도 영구적으로 늘어납니다.
              </li>
              <li>
                <strong>손익분기점</strong>: 본인 추가 납부액은 수령 개시 후 약 {result.recoveryYears}년 뒤인 만 {result.bepAge}세 시점에 골든크로스를 달성하며, 기대수명({currentLifeAge}세)까지 생존 시 추가 납부액 대비 약 <strong>{result.costBenefitRatio}배</strong>의 연금을 더 돌려받게 됩니다.
              </li>
            </ul>
          </div>
        </div>

        {/* 푸터 */}
        <div
          className="modal-footer"
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--modal-header-bg)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              backgroundColor: "var(--accent)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
