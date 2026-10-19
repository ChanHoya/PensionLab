"use client";

import React, { useState, useMemo } from "react";
import {
  calculateRebalancingOrders,
  DEFAULT_REBALANCING_HOLDINGS,
  AssetClassHolding,
  RebalancingReport,
} from "@/services/rebalancingOrderService";

interface RebalancingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTotalAssetsWon?: number;
}

export default function RebalancingOrderModal({
  isOpen,
  onClose,
  initialTotalAssetsWon = 300000000, // 기본 3억원
}: RebalancingOrderModalProps) {
  const [accountType, setAccountType] = useState<"IRP" | "PENSION_SAVINGS" | "ISA" | "TAXABLE">("IRP");
  const [holdings, setHoldings] = useState<AssetClassHolding[]>(DEFAULT_REBALANCING_HOLDINGS);
  const [copied, setCopied] = useState<boolean>(false);

  // 현재 총 자산 평가액
  const totalAssetWon = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.currentAmountWon, 0);
  }, [holdings]);

  // 목표 비중 합계
  const totalTargetPercent = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.targetWeightPercent, 0);
  }, [holdings]);

  const report: RebalancingReport = useMemo(() => {
    return calculateRebalancingOrders({
      totalAssetWon,
      holdings,
      accountType,
    });
  }, [totalAssetWon, holdings, accountType]);

  if (!isOpen) return null;

  const handleWeightChange = (id: string, newWeight: number) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, targetWeightPercent: newWeight } : h))
    );
  };

  const handleCopySlip = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(report.summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("Failed to copy order slip:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          maxHeight: "90vh",
          backgroundColor: "var(--surface, #1e293b)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>📊</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                은퇴 자산 포트폴리오 리밸런싱 주문 가이드
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "var(--text-accent, #3b82f6)",
                  fontWeight: 600,
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                MTS/HTS 1초 주문표
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              현재 보유 자산의 목표 비중 괴리율을 자동 분석하고, IRP 30% 안전자산 규제를 준수한 실제 매수·매도 주문표를 생성합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
              borderRadius: "8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Controls: Account & Status */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              background: "var(--modal-subbox-bg, var(--surface-2))",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid var(--modal-subbox-border, var(--border))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>계좌 바구니:</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["IRP", "PENSION_SAVINGS", "ISA", "TAXABLE"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAccountType(type)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: accountType === type ? "1px solid #3b82f6" : "1px solid var(--border)",
                      background: accountType === type ? "rgba(59, 130, 246, 0.15)" : "var(--surface)",
                      color: accountType === type ? "var(--text-accent, #3b82f6)" : "var(--text-secondary)",
                    }}
                  >
                    {type === "IRP" ? "개인형 IRP" : type === "PENSION_SAVINGS" ? "연금저축" : type === "ISA" ? "ISA" : "일반위탁"}
                  </button>
                ))}
              </div>
            </div>

            {/* IRP Rule Check */}
            {accountType === "IRP" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: report.irpCompliance.isCompliant ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  border: report.irpCompliance.isCompliant ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                  color: report.irpCompliance.isCompliant ? "#10b981" : "#ef4444",
                  fontWeight: 600,
                }}
              >
                <span>{report.irpCompliance.isCompliant ? "🛡️ IRP 안전자산 30% 룰 충족" : "⚠️ IRP 안전자산 30% 미달"}</span>
                <span>(현재 목표 비중: {report.irpCompliance.safeAssetWeight}%)</span>
              </div>
            )}
          </div>

          {/* Allocation Sliders */}
          <div
            style={{
              background: "var(--modal-subbox-bg, var(--surface-2))",
              border: "1px solid var(--modal-subbox-border, var(--border))",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                🎯 목표 배분 비중 조절 (합계: {totalTargetPercent}%)
              </h3>
              {totalTargetPercent !== 100 && (
                <span style={{ fontSize: "0.75rem", color: "var(--danger, #ef4444)", fontWeight: 600 }}>
                  비중 합계가 100%가 되도록 슬라이더를 맞춰주세요.
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {holdings.map((h) => (
                <div key={h.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: h.isSafeAssetForIrp ? "var(--success, #10b981)" : "var(--text-primary)" }}>
                      {h.name} {h.isSafeAssetForIrp ? "(안전)" : ""}
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--text-accent, #3b82f6)" }}>{h.targetWeightPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={h.targetWeightPercent}
                    onChange={(e) => handleWeightChange(h.id, Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#3b82f6" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rebalancing Order Slip Table */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--modal-table-th, var(--surface-2))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1rem" }}>📝</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>증권사 MTS 즉시 주문표 (Order Slip)</span>
              </div>
              <button
                onClick={handleCopySlip}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: copied ? "#10b981" : "rgba(59, 130, 246, 0.15)",
                  color: copied ? "#fff" : "var(--text-accent, #3b82f6)",
                  border: copied ? "none" : "1px solid rgba(59, 130, 246, 0.3)",
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ 주문표 복사 완료!" : "📋 주문표 텍스트 복사"}
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", background: "var(--modal-table-th, var(--surface-2))" }}>
                    <th style={{ padding: "10px 14px" }}>구분</th>
                    <th style={{ padding: "10px 14px" }}>대표 종목(ETF)</th>
                    <th style={{ padding: "10px 14px" }}>현재 비중</th>
                    <th style={{ padding: "10px 14px" }}>목표 비중</th>
                    <th style={{ padding: "10px 14px" }}>괴리율</th>
                    <th style={{ padding: "10px 14px" }}>주문 액션</th>
                    <th style={{ padding: "10px 14px" }}>추천 주문 수량</th>
                    <th style={{ padding: "10px 14px" }}>거래 예정 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.map((o) => {
                    const isBuy = o.action === "BUY";
                    const isSell = o.action === "SELL";
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{o.name}</td>
                        <td style={{ padding: "10px 14px", color: "var(--text-accent, #3b82f6)", fontWeight: 600 }}>{o.ticker}</td>
                        <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{o.currentWeightPercent}%</td>
                        <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{o.targetWeightPercent}%</td>
                        <td
                          style={{
                            padding: "10px 14px",
                            color: o.driftPercent > 0 ? "var(--danger, #ef4444)" : o.driftPercent < 0 ? "var(--success, #10b981)" : "var(--text-muted)",
                            fontWeight: 700,
                          }}
                        >
                          {o.driftPercent > 0 ? `+${o.driftPercent}%p` : `${o.driftPercent}%p`}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: isBuy
                                ? "rgba(16, 185, 129, 0.15)"
                                : isSell
                                ? "rgba(239, 68, 68, 0.15)"
                                : "var(--surface-2)",
                              color: isBuy ? "#10b981" : isSell ? "#ef4444" : "var(--text-secondary)",
                            }}
                          >
                            {isBuy ? "매수 🟢" : isSell ? "매도 🔴" : "유지 ⚪"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {o.tradeShares > 0 ? `${o.tradeShares.toLocaleString()}주` : "-"}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {o.tradeAmountWon > 0 ? `${(o.tradeAmountWon / 10000).toLocaleString()}만원` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Slip Summary Footnote */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                background: "var(--modal-subbox-bg, var(--surface-2))",
              }}
            >
              <span>
                총 매수 예정: <strong style={{ color: "var(--success, #10b981)" }}>{(report.totalBuyWon / 10000).toLocaleString()}만원</strong>
              </span>
              <span>
                총 매도 예정: <strong style={{ color: "var(--danger, #ef4444)" }}>{(report.totalSellWon / 10000).toLocaleString()}만원</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            background: "var(--modal-header-bg, var(--surface))",
          }}
        >
          <button
            onClick={onClose}
            className="premium-button"
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)",
              color: "#fff",
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
}
