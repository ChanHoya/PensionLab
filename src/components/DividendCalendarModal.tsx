"use client";

import React, { useState } from "react";
import { generateDividendCalendar, DividendCalendarOverview } from "@/services/dividendCalendarService";

interface DividendCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  coveredCallAssetManwon?: number;
  annualDividendRate?: number;
  targetMonthlyExpenseWon?: number;
  monthlyNationalPensionWon?: number;
  monthlyPrivatePensionWon?: number;
}

export default function DividendCalendarModal({
  isOpen,
  onClose,
  coveredCallAssetManwon = 5000,
  annualDividendRate = 9.0,
  targetMonthlyExpenseWon = 3500000,
  monthlyNationalPensionWon = 1300000,
  monthlyPrivatePensionWon = 1000000,
}: DividendCalendarModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isBiweekly, setIsBiweekly] = useState<boolean>(true);

  if (!isOpen) return null;

  const overview: DividendCalendarOverview = generateDividendCalendar({
    coveredCallAssetManwon,
    annualDividendRate,
    targetMonthlyExpenseWon,
    monthlyNationalPensionWon,
    monthlyPrivatePensionWon,
    hasBiweeklyAllocation: isBiweekly,
  });

  const currentSchedule = overview.monthlySchedules.find((s) => s.month === selectedMonth) || overview.monthlySchedules[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dividend-calendar-modal-title"
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
          maxWidth: "880px",
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
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>📅</span>
            <div>
              <h2
                id="dividend-calendar-modal-title"
                style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--modal-title, #0f172a)" }}
              >
                월별 배당 인컴 캘린더 & 연금 인출 스케줄러
              </h2>
              <p style={{ fontSize: "12px", color: "var(--color-muted, #64748b)", margin: "2px 0 0" }}>
                1월~12월 배당금 입금일과 생활비 인출 시차를 빈틈없이 맞추는 캐시플로우 타임라인
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* 격주 배당 토글 */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "20px",
                backgroundColor: isBiweekly ? "rgba(99, 102, 241, 0.12)" : "var(--modal-surface, #f1f5f9)",
                color: isBiweekly ? "#4f46e5" : "var(--color-muted, #64748b)",
                border: "1px solid var(--modal-border, #e2e8f0)",
              }}
            >
              <input
                type="checkbox"
                checked={isBiweekly}
                onChange={(e) => setIsBiweekly(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              격주 분배 포트폴리오 (15일/28일)
            </label>
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
        </div>

        {/* 1월~12월 가로 탭 바 */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "6px",
            padding: "10px 24px",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            backgroundColor: "var(--modal-surface, #f8fafc)",
          }}
        >
          {overview.monthlySchedules.map((s) => {
            const isSelected = s.month === selectedMonth;
            const isSurplus = s.netCashflowWon >= 0;
            return (
              <button
                key={s.month}
                onClick={() => setSelectedMonth(s.month)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid #6366f1" : "1px solid var(--modal-border, #e2e8f0)",
                  backgroundColor: isSelected ? "#6366f1" : "var(--modal-surface-card, #ffffff)",
                  color: isSelected ? "#ffffff" : "var(--modal-text, #334155)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "700" }}>{s.monthLabel}</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: isSelected ? "rgba(255, 255, 255, 0.9)" : isSurplus ? "#10b981" : "#ef4444",
                  }}
                >
                  {isSurplus ? "+" : ""}
                  {Math.round(s.netCashflowWon / 10000).toLocaleString()}만
                </span>
              </button>
            );
          })}
        </div>

        {/* 본문 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 상단 3대 KPI 요약 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6366f1", fontWeight: "600" }}>연간 배당금 총액 (세후 15.4%)</div>
              <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px" }}>
                {(overview.annualTotalDividendPostTaxWon / 10000).toLocaleString()}만 원
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                월평균 {(overview.averageMonthlyDividendWon / 10000).toLocaleString()}만 원
              </div>
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "600" }}>{selectedMonth}월 총 수입 합계</div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                {(currentSchedule.totalIncomeWon / 10000).toLocaleString()}만 원
              </div>
              <div style={{ fontSize: "11px", color: "#059669", marginTop: "2px" }}>
                배당금 + 국민연금 + 사적연금
              </div>
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                backgroundColor: currentSchedule.netCashflowWon >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${
                  currentSchedule.netCashflowWon >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"
                }`,
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: currentSchedule.netCashflowWon >= 0 ? "#10b981" : "#ef4444",
                  fontWeight: "600",
                }}
              >
                {selectedMonth}월 월간 수지차 (수입 - 지출)
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  marginTop: "4px",
                  color: currentSchedule.netCashflowWon >= 0 ? "#059669" : "#dc2626",
                }}
              >
                {currentSchedule.netCashflowWon >= 0 ? "+" : ""}
                {(currentSchedule.netCashflowWon / 10000).toLocaleString()}만 원
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                {currentSchedule.netCashflowWon >= 0 ? "🎉 생활비 충당 후 흑자 발생" : "⚠️ 비연금 자산에서 보충 필요"}
              </div>
            </div>
          </div>

          {/* 해당 월 날짜별 타임라인 스케줄러 */}
          <div
            style={{
              border: "1px solid var(--modal-border, #e2e8f0)",
              borderRadius: "12px",
              padding: "18px",
              backgroundColor: "var(--modal-surface-card, #ffffff)",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 16px" }}>
              🗓️ {selectedMonth}월 일자별 캐시플로우 타임라인
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {currentSchedule.events.map((event, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: event.isIncome ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                    borderLeft: `4px solid ${event.isIncome ? "#10b981" : "#ef4444"}`,
                    borderTop: "1px solid var(--modal-border, #e2e8f0)",
                    borderRight: "1px solid var(--modal-border, #e2e8f0)",
                    borderBottom: "1px solid var(--modal-border, #e2e8f0)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "8px",
                        backgroundColor: event.isIncome ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: event.isIncome ? "#059669" : "#dc2626",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                      }}
                    >
                      <span style={{ fontSize: "9px" }}>{selectedMonth}월</span>
                      <span style={{ fontSize: "15px", lineHeight: "1" }}>{event.day}일</span>
                    </div>

                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700" }}>{event.label}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                        {event.notes}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "800",
                        color: event.isIncome ? "#059669" : "#dc2626",
                      }}
                    >
                      {event.isIncome ? "+" : "-"}
                      {(event.amountWon / 10000).toLocaleString()}만 원
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        marginTop: "2px",
                        backgroundColor: event.isIncome ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: event.isIncome ? "#059669" : "#dc2626",
                      }}
                    >
                      {event.isIncome ? "입금" : "출금"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 하단 추천 가이드 */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "rgba(99, 102, 241, 0.05)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#4f46e5", fontWeight: "700" }}>
              💡 은퇴 인컴 스케줄러 운용 가이드
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {overview.recommendations.map((rec, idx) => (
                <div key={idx} style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--modal-text, #334155)" }}>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
