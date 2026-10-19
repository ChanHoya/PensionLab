"use client";

import React, { useState, useMemo } from "react";
import {
  DbDcSimulationInput,
  calculateDbDcTransition,
} from "@/services/dbDcTransitionCalculator";
import { NumberPopIn } from "@/components/motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface DbDcTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAge?: number;
  defaultRetireAge?: number;
}

export default function DbDcTransitionModal({
  isOpen,
  onClose,
  defaultAge = 45,
  defaultRetireAge = 60,
}: DbDcTransitionModalProps) {
  const [currentAge, setCurrentAge] = useState<number>(defaultAge);
  const [retirementAge, setRetirementAge] = useState<number>(defaultRetireAge);
  const [currentYearsOfService, setCurrentYearsOfService] = useState<number>(15);
  const [currentMonthlyWage, setCurrentMonthlyWage] = useState<number>(500);
  const [annualWageGrowthRate, setAnnualWageGrowthRate] = useState<number>(3.0);
  const [dcExpectedReturnRate, setDcExpectedReturnRate] = useState<number>(5.5);
  const [usePeakSystem, setUsePeakSystem] = useState<boolean>(true);
  const [peakStartAge, setPeakStartAge] = useState<number>(57);
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "CHART" | "TABLE">("SUMMARY");

  const input: DbDcSimulationInput = useMemo(
    () => ({
      currentAge,
      retirementAge,
      currentYearsOfService,
      currentMonthlyWage,
      annualWageGrowthRate,
      dcExpectedReturnRate,
      usePeakSystem,
      peakStartAge,
      peakReductionRates: [10, 20, 30, 30],
    }),
    [
      currentAge,
      retirementAge,
      currentYearsOfService,
      currentMonthlyWage,
      annualWageGrowthRate,
      dcExpectedReturnRate,
      usePeakSystem,
      peakStartAge,
    ]
  );

  const result = useMemo(() => calculateDbDcTransition(input), [input]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="t-modal-spring"
        style={{
          width: "100%",
          maxWidth: "920px",
          maxHeight: "92vh",
          overflowY: "auto",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.6rem" }}>⚖️</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                  퇴직연금 DB vs DC 전환 & 임금피크제 시뮬레이터
                </h2>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    color: "#60a5fa",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                  }}
                >
                  골든타임 진단
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                임금피크제로 인한 퇴직금 삭감 방어 및 내 수익률 기반 최적의 DC 전환 시점을 도출합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 탭 바 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px 24px 0 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setActiveTab("SUMMARY")}
            style={{
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: "transparent",
              color: activeTab === "SUMMARY" ? "var(--accent, #3b82f6)" : "var(--text-muted)",
              borderBottom: activeTab === "SUMMARY" ? "2px solid var(--accent, #3b82f6)" : "2px solid transparent",
            }}
          >
            📋 종합 진단 & 전략 비교
          </button>
          <button
            onClick={() => setActiveTab("CHART")}
            style={{
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: "transparent",
              color: activeTab === "CHART" ? "var(--accent, #3b82f6)" : "var(--text-muted)",
              borderBottom: activeTab === "CHART" ? "2px solid var(--accent, #3b82f6)" : "2px solid transparent",
            }}
          >
            📈 연도별 자산 성장 곡선
          </button>
          <button
            onClick={() => setActiveTab("TABLE")}
            style={{
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: "transparent",
              color: activeTab === "TABLE" ? "var(--accent, #3b82f6)" : "var(--text-muted)",
              borderBottom: activeTab === "TABLE" ? "2px solid var(--accent, #3b82f6)" : "2px solid transparent",
            }}
          >
            📑 연도별 상세 테이블
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 상단 컨트롤러 (입력 파라미터) */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {/* 현재 나이 & 퇴직 나이 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>
                <span>현재 나이 / 정년</span>
                <span style={{ color: "#60a5fa" }}>만 {currentAge}세 → 만 {retirementAge}세</span>
              </div>
              <input
                type="range"
                min={25}
                max={60}
                value={currentAge}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentAge(val);
                  if (val >= retirementAge) setRetirementAge(val + 1);
                }}
                style={{ width: "100%", accentColor: "#3b82f6" }}
              />
            </div>

            {/* 현재 근속연수 & 월 급여 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>
                <span>근속연수 / 월 급여</span>
                <span style={{ color: "#34d399" }}>{currentYearsOfService}년 / 월 {currentMonthlyWage}만원</span>
              </div>
              <input
                type="range"
                min={200}
                max={1500}
                step={50}
                value={currentMonthlyWage}
                onChange={(e) => setCurrentMonthlyWage(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#10b981" }}
              />
            </div>

            {/* 임금인상률 vs DC 운용수익률 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>
                <span>임금인상률 / DC수익률</span>
                <span>
                  <span style={{ color: "#fbbf24" }}>연 {annualWageGrowthRate}%</span> vs{" "}
                  <span style={{ color: "#a855f7" }}>연 {dcExpectedReturnRate}%</span>
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={10.0}
                step={0.5}
                value={dcExpectedReturnRate}
                onChange={(e) => setDcExpectedReturnRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#a855f7" }}
              />
            </div>

            {/* 임금피크제 설정 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>임금피크제 적용</span>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.75rem" }}>
                  <input
                    type="checkbox"
                    checked={usePeakSystem}
                    onChange={(e) => setUsePeakSystem(e.target.checked)}
                    style={{ accentColor: "#ef4444" }}
                  />
                  <span>{usePeakSystem ? `만 ${peakStartAge}세 시작` : "미적용"}</span>
                </label>
              </div>
              {usePeakSystem && (
                <input
                  type="range"
                  min={55}
                  max={Math.min(62, retirementAge - 1)}
                  value={peakStartAge}
                  onChange={(e) => setPeakStartAge(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#ef4444" }}
                />
              )}
            </div>
          </div>

          {/* 탭 1: 종합 진단 & 전략 비교 */}
          {activeTab === "SUMMARY" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* 골든타임 헤드라인 배너 */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.1) 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "1.8rem", marginTop: "2px" }}>🏆</span>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
                    {result.goldenAdviceHeadline}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {result.goldenAdviceDetails.map((detail, idx) => (
                      <div key={idx}>• {detail}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3대 전략 비교 카드 그리드 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* 전략 1: DB 끝까지 유지 */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.03))",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>전략 A</span>
                    <span style={{ fontSize: "0.72rem", color: "#f87171" }}>
                      {usePeakSystem ? `피크 감액 -${result.peakLossAmount.toLocaleString()}만` : "안정형"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>DB형 만기 유지</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#60a5fa" }}>
                    <NumberPopIn value={result.finalDbLumpSum} formatter={(n) => `${Number(n).toLocaleString()}만원`} />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    퇴직 직전 최종 급여 기준으로 수령. 임금피크제가 있으면 기존 적립금까지 깎여나가는 피해 발생.
                  </p>
                </div>

                {/* 전략 2: 임금피크 직전 DC 전환 (골든타임) */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(16, 185, 129, 0.06)",
                    border: "2px solid rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#34d399" }}>
                      전략 B · 권장 골든타임 ⭐
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#34d399" }}>
                      만 {result.optimalSwitchAge}세 전환
                    </span>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>임금피크 직전 DC 전환</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399" }}>
                    <NumberPopIn value={result.finalDcAtPeak} formatter={(n) => `${Number(n).toLocaleString()}만원`} />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    최고 임금 시점에 퇴직금을 DC로 확정 이전하여 삭감을 100% 방어하고, 남은 기간 연 {dcExpectedReturnRate}% 복리 증식.
                  </p>
                </div>

                {/* 전략 3: 지금 즉시 DC 전환 */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.03))",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>전략 C</span>
                    <span style={{ fontSize: "0.72rem", color: "#c084fc" }}>적극 투자형</span>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>지금 즉시 DC 전환</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#a855f7" }}>
                    <NumberPopIn value={result.finalDcImmediate} formatter={(n) => `${Number(n).toLocaleString()}만원`} />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    현재 평가액을 즉시 DC 계좌로 받아 {retirementAge - currentAge}년간 연 {dcExpectedReturnRate}% 장기 복리 운용.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 탭 2: 연도별 자산 성장 곡선 */}
          {activeTab === "CHART" && (
            <div style={{ height: "340px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.timeline} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="age" unit="세" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis
                    unit="만"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickFormatter={(v) => Math.round(v).toLocaleString()}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${Number(val).toLocaleString()}만원`, name]}
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
                  {usePeakSystem && (
                    <ReferenceLine
                      x={peakStartAge}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `임금피크 시작 (${peakStartAge}세)`, fill: "#ef4444", fontSize: 11 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="dbLumpSum"
                    name="전략 A: DB 유지"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="dcLumpSumAtPeak"
                    name="전략 B: 피크직전 DC전환"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dcLumpSumImmediate"
                    name="전략 C: 지금 즉시 DC전환"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 탭 3: 연도별 상세 테이블 */}
          {activeTab === "TABLE" && (
            <div style={{ maxHeight: "340px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", textAlign: "right" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "8px", textAlign: "center" }}>나이</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>근속</th>
                    <th style={{ padding: "8px" }}>월 급여</th>
                    <th style={{ padding: "8px" }}>피크 삭감</th>
                    <th style={{ padding: "8px", color: "#60a5fa" }}>DB 퇴직금</th>
                    <th style={{ padding: "8px", color: "#10b981" }}>피크직전 DC</th>
                    <th style={{ padding: "8px", color: "#a855f7" }}>즉시 DC</th>
                  </tr>
                </thead>
                <tbody>
                  {result.timeline.map((row) => (
                    <tr
                      key={row.age}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        backgroundColor: row.age === peakStartAge ? "rgba(239, 68, 68, 0.08)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700 }}>{row.age}세</td>
                      <td style={{ padding: "6px 8px", textAlign: "center", color: "var(--text-muted)" }}>{row.yearsOfService}년</td>
                      <td style={{ padding: "6px 8px" }}>{row.monthlyWage.toLocaleString()}만</td>
                      <td style={{ padding: "6px 8px", color: row.reductionRate > 0 ? "#f87171" : "var(--text-muted)" }}>
                        {row.reductionRate > 0 ? `-${row.reductionRate}%` : "-"}
                      </td>
                      <td style={{ padding: "6px 8px", fontWeight: 700, color: "#60a5fa" }}>
                        {row.dbLumpSum.toLocaleString()}만
                      </td>
                      <td style={{ padding: "6px 8px", fontWeight: 700, color: "#10b981" }}>
                        {row.dcLumpSumAtPeak.toLocaleString()}만
                      </td>
                      <td style={{ padding: "6px 8px", fontWeight: 700, color: "#a855f7" }}>
                        {row.dcLumpSumImmediate.toLocaleString()}만
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 하단 세제 팁 박스 */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(99, 102, 241, 0.06)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "10px",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            💡 <strong style={{ color: "#818cf8" }}>세무사 & 노무사 실전 꿀팁:</strong> DB에서 DC로 전환할 때는 근로자대표 동의 및 퇴직급여법상 중간정산 사유(무주택자 주택구입, 임금피크제 적용 등)를 갖추어야 합니다. 퇴직 시 일시금 대신 **IRP 계좌로 이전하여 10년 이상 연금 분할 수령** 시 퇴직소득세가 최대 **30~40% 감면**됩니다.
          </div>
        </div>

        {/* 풋터 */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="premium-button"
            style={{ padding: "8px 20px", fontSize: "0.85rem", fontWeight: 700 }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
