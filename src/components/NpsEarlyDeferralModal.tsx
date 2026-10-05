"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { usePensionStore } from "@/store/usePensionStore";
import {
  calculateNpsEarlyDeferralBep,
  type NpsEarlyDeferralResult,
} from "@/services/npsEarlyDeferralBep";

interface NpsEarlyDeferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWho?: "SELF" | "SPOUSE";
}

const fmt = (n: number) => Math.round(n).toLocaleString();

export default function NpsEarlyDeferralModal({
  isOpen,
  onClose,
  initialWho = "SELF",
}: NpsEarlyDeferralModalProps) {
  const store = usePensionStore();
  const { simulationParams, nationalPension, spouse } = store;

  // 가구원 선택 (본인 / 배우자)
  const hasSpouse = simulationParams.hasSpouse && (spouse?.nationalPension?.expectedMonthlyPension ?? 0) > 0;
  const [who, setWho] = useState<"SELF" | "SPOUSE">(initialWho);

  // 대상자별 기본값 추출
  const defaultBirthYear = useMemo(() => {
    if (who === "SELF") {
      return simulationParams.birthYear || 2026 - (simulationParams.currentAge || 50);
    }
    return (
      simulationParams.spouseBirthYear ||
      2026 - (simulationParams.spouseAge || simulationParams.currentAge || 50)
    );
  }, [who, simulationParams]);

  const defaultMonthlyPension = useMemo(() => {
    if (who === "SELF") {
      return nationalPension.expectedMonthlyPension || 120;
    }
    return spouse?.nationalPension?.expectedMonthlyPension || 80;
  }, [who, nationalPension, spouse]);

  // 대화형 파라미터 상태
  const [birthYear, setBirthYear] = useState<number>(defaultBirthYear);
  const [monthlyPension, setMonthlyPension] = useState<number>(defaultMonthlyPension);
  const [earlyYears, setEarlyYears] = useState<number>(5);
  const [deferYears, setDeferYears] = useState<number>(5);
  const [isRealValue, setIsRealValue] = useState<boolean>(true); // 기본값: 현재가치 (실질 구매력)

  // 대상자 변경 시 값 동기화
  useEffect(() => {
    setBirthYear(defaultBirthYear);
    setMonthlyPension(defaultMonthlyPension);
  }, [who, defaultBirthYear, defaultMonthlyPension]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 손익분기 계산 결과
  const bepResult: NpsEarlyDeferralResult = useMemo(() => {
    return calculateNpsEarlyDeferralBep({
      baseMonthlyPension: monthlyPension,
      birthYear,
      earlyYears,
      deferYears,
      inflationRate: simulationParams.inflationRate || 3.0,
      isRealValue,
      expectedLifeExpectancy: simulationParams.expectedLifeExpectancy || 85,
      maxAge: 95,
    });
  }, [monthlyPension, birthYear, earlyYears, deferYears, isRealValue, simulationParams]);

  if (!isOpen) return null;

  const {
    normalStartAge,
    earlyStartAge,
    deferStartAge,
    crossoverEarlyVsNormal,
    crossoverNormalVsDefer,
    dataPoints,
    strategies,
    recommendedType,
    recommendedReason,
    cfpPrescription,
    expectedLifeExpectancy,
  } = bepResult;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 모달 상단 헤더 */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <span>⚖️ 국민연금 최적 수령 시기 분석기</span>
              <span style={styles.badgeSub}>국민연금법 제61조·제61조의2·제62조</span>
            </div>
            <h2 style={styles.title}>
              조기노령 vs 정상 vs 연기연금 <span className="gradient-text">손익분기점(BEP) 비교</span>
            </h2>
            <p style={styles.subtitle}>
              출생연도({birthYear}년생, 법정 {normalStartAge}세 개시)에 따른 감액(-30%)과 증액(+36%)을 반영하여
              생애 총 수령액이 교차하는 골든 크로스오버 나이를 분석합니다.
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="닫기">
            ✕
          </button>
        </div>

        {/* 모달 본문 (스크롤) */}
        <div style={styles.content}>
          {/* 1. 상단 컨트롤 패널 */}
          <div style={styles.controlPanel} className="premium-card">
            {/* 가구원 선택 (배우자가 있을 경우) */}
            {hasSpouse && (
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>분석 대상 선택</label>
                <div style={styles.toggleRow}>
                  <button
                    type="button"
                    onClick={() => setWho("SELF")}
                    style={who === "SELF" ? styles.tabBtnActive : styles.tabBtn}
                  >
                    본인 ({nationalPension.expectedMonthlyPension}만원/월)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWho("SPOUSE")}
                    style={who === "SPOUSE" ? styles.tabBtnActive : styles.tabBtn}
                  >
                    배우자 ({spouse?.nationalPension?.expectedMonthlyPension || 0}만원/월)
                  </button>
                </div>
              </div>
            )}

            {/* 입력 폼 3열 그리드 */}
            <div style={styles.grid3}>
              {/* 정상 기준 월 예상연금액 */}
              <div style={styles.controlItem}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={styles.controlLabel}>정상 개시 시 예상 월 연금액</label>
                  <span style={styles.paramValueHighlight}>{monthlyPension}만원/월</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={5}
                  value={monthlyPension}
                  onChange={(e) => setMonthlyPension(Number(e.target.value))}
                  style={styles.slider}
                />
                <div style={styles.sliderRange}>
                  <span>30만원</span>
                  <span>150만원</span>
                  <span>300만원</span>
                </div>
              </div>

              {/* 조기 수령 연수 선택 */}
              <div style={styles.controlItem}>
                <label style={styles.controlLabel}>조기 개시 기간 (연 6% 감액)</label>
                <div style={styles.buttonGroup}>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <button
                      key={`early-${y}`}
                      type="button"
                      onClick={() => setEarlyYears(y)}
                      style={earlyYears === y ? styles.choiceBtnActiveOrange : styles.choiceBtn}
                    >
                      {y}년 ({(y * 6)}%↓)
                    </button>
                  ))}
                </div>
                <div style={styles.paramSubHint}>
                  {normalStartAge - earlyYears}세 개시 · 월 {strategies.early.monthlyPension}만원 (-{(earlyYears * 6)}%)
                </div>
              </div>

              {/* 연기 수령 연수 선택 */}
              <div style={styles.controlItem}>
                <label style={styles.controlLabel}>연기 개시 기간 (연 7.2% 증액)</label>
                <div style={styles.buttonGroup}>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <button
                      key={`defer-${y}`}
                      type="button"
                      onClick={() => setDeferYears(y)}
                      style={deferYears === y ? styles.choiceBtnActiveGreen : styles.choiceBtn}
                    >
                      {y}년 (+{(y * 7.2).toFixed(1)}%)
                    </button>
                  ))}
                </div>
                <div style={styles.paramSubHint}>
                  {normalStartAge + deferYears}세 개시 · 월 {strategies.defer.monthlyPension}만원 (+{(deferYears * 7.2).toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* 화폐 가치 토글 바 */}
            <div style={styles.valueToggleRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  화폐 가치 기준:
                </span>
                <div style={styles.segmentToggle}>
                  <button
                    type="button"
                    onClick={() => setIsRealValue(true)}
                    style={isRealValue ? styles.segmentBtnActive : styles.segmentBtn}
                  >
                    현재가치 (실질 구매력)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRealValue(false)}
                    style={!isRealValue ? styles.segmentBtnActive : styles.segmentBtn}
                  >
                    명목 금액 (물가 연 3% 반영)
                  </button>
                </div>
              </div>
              <div style={styles.valueToggleNote}>
                {isRealValue
                  ? "💡 국민연금은 매년 소비자물가상승률만큼 100% 인상되므로, 현재가치 기준 분석이 가장 직관적입니다."
                  : "💡 물가상승률(연 3%)을 복리 반영하여 미래 시점에 통장에 찍히는 명목 수령액을 보여줍니다."}
              </div>
            </div>
          </div>

          {/* 2. 골든 크로스오버 핵심 손익분기 요약 배너 (3개 카드) */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCardOrange}>
              <div style={styles.kpiIcon}>⚡</div>
              <div>
                <div style={styles.kpiLabelOrange}>조기 vs 정상 손익분기 나이</div>
                <div style={styles.kpiValueOrange}>{crossoverEarlyVsNormal.ageDisplay}</div>
                <div style={styles.kpiDesc}>
                  이 나이 이전 사망 시 <strong>조기수령 유리</strong>, 이후 생존 시 <strong>정상수령 유리</strong>
                </div>
              </div>
            </div>

            <div style={styles.kpiCardGreen}>
              <div style={styles.kpiIcon}>🏆</div>
              <div>
                <div style={styles.kpiLabelGreen}>정상 vs 연기 손익분기 나이</div>
                <div style={styles.kpiValueGreen}>{crossoverNormalVsDefer.ageDisplay}</div>
                <div style={styles.kpiDesc}>
                  만 {Math.ceil(crossoverNormalVsDefer.ageExact)}세 이상 장수 시 <strong>연기연금 총액 압도적 유리</strong>
                </div>
              </div>
            </div>

            <div style={styles.kpiCardAccent}>
              <div style={styles.kpiIcon}>🎯</div>
              <div>
                <div style={styles.kpiLabelAccent}>
                  내 기대수명({expectedLifeExpectancy}세) 기준 맞춤 추천
                </div>
                <div style={styles.kpiValueAccent}>
                  {recommendedType === "EARLY" && "조기노령연금 추천"}
                  {recommendedType === "NORMAL" && "정상노령연금 추천"}
                  {recommendedType === "DEFER" && "연기연금 추천"}
                </div>
                <div style={styles.kpiDesc}>{recommendedReason}</div>
              </div>
            </div>
          </div>

          {/* 2.5 유튜브 영상 심층 비교 및 A·B값 재평가 인사이트 카드 */}
          <div
            style={{
              marginBottom: 20,
              padding: "18px 20px",
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              borderRadius: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.25rem" }}>💡</span>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.01em" }}>
                  유튜브 영상 심층 비교: 예상안내문의 함정 & A·B값 재평가 반영 BEP
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "rgba(99, 102, 241, 0.2)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    fontWeight: 600,
                  }}
                >
                  전문가 분석 반영
                </span>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                출처: 유튜브 분석 영상 & 국민연금법 시행령 정밀 대조
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {/* 포인트 1: 손익분기점 차이 원인 */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(15, 23, 42, 0.6)",
                  borderRadius: 10,
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>
                  ⚖️ 손익분기점(BEP) 왜 영상과 차이 날까?
                </div>
                <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                  <strong style={{ color: "#f1f5f9" }}>• 법정 단순비율 기준 (시스템 기본):</strong> 조기-정상 <strong>77세</strong> / 정상-연기 <strong>84세</strong><br />
                  <strong style={{ color: "#f1f5f9" }}>• A·B값 재평가 반영 시 (영상 기준):</strong> 조기-정상 약 <strong style={{ color: "#fb923c" }}>72세</strong> / 정상-연기 약 <strong style={{ color: "#4ade80" }}>81세</strong> (약 3~5년 단축)<br />
                  <span style={{ color: "#94a3b8", fontSize: "0.74rem" }}>
                    ※ 60세 조기신청 시 과거소득이 고정되나, 65세 정상수령까지 대기 시 5년간 A값·B값 재평가율 상승(연 4~5%)으로 시작 연금액이 약 26.7% 더 커져 추격이 빨라집니다.
                  </span>
                </div>
              </div>

              {/* 포인트 2: 소득감액 회피 치트키 */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(15, 23, 42, 0.6)",
                  borderRadius: 10,
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>
                  💼 근로·사업 소득자 필수 체크 (연기연금 치트키)
                </div>
                <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                  <strong style={{ color: "#f1f5f9" }}>• 조기수령 중 A값(월 320만원) 초과 소득:</strong> 즉시 <strong style={{ color: "#ef4444" }}>연금 전액 지급정지</strong><br />
                  <strong style={{ color: "#f1f5f9" }}>• 65~69세 소득 발생 시 연기연금 활용:</strong> 정상 수령 시 최대 50% 감액되나, <strong style={{ color: "#10b981" }}>연기연금 신청 시 감액 100% 회피 + 연 7.2% 가산</strong> 혜택을 온전히 보존할 수 있습니다.
                </div>
              </div>

              {/* 포인트 3: 건보료 피부양자 & 부분 연기 */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(15, 23, 42, 0.6)",
                  borderRadius: 10,
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f43f5e", marginBottom: 4 }}>
                  🛡️ 건보료 피부양자 탈락 & 부분 연기(50~90%)
                </div>
                <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                  <strong style={{ color: "#f1f5f9" }}>• 건보료 덫(Trap):</strong> 공적연금 연 2,000만원(월 166.7만) 초과 시 피부양자 박탈(월 10~25만원 건보료 부과)<br />
                  <strong style={{ color: "#f1f5f9" }}>• 절세 묘수:</strong> 연기 시 2,000만원을 살짝 넘길 위험이 있다면, <strong style={{ color: "#a5b4fc" }}>부분연기(50~90%)</strong>를 통해 연금 수령액을 안전선 아래로 미세조정 가능합니다.
                </div>
              </div>
            </div>
          </div>

          {/* 3. 인터랙티브 누적 수령액 곡선 차트 */}
          <div style={styles.chartCard} className="premium-card">
            <div style={styles.chartHeader}>
              <div>
                <h3 style={styles.chartTitle}>연령별 누적 수령액 곡선 & 크로스오버 분석</h3>
                <p style={styles.chartSubtitle}>
                  가장 높은 곡선에 위치하는 옵션이 해당 나이 시점에서 누적 총 수령액이 가장 많은 최적 전략입니다.
                </p>
              </div>
              <div style={styles.chartLegendCustom}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#f97316" }}>
                  <span style={{ width: 12, height: 4, background: "#f97316", borderRadius: 2 }} />
                  조기수령 ({earlyStartAge}세)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#3b82f6" }}>
                  <span style={{ width: 12, height: 4, background: "#3b82f6", borderRadius: 2 }} />
                  정상수령 ({normalStartAge}세)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#10b981" }}>
                  <span style={{ width: 12, height: 4, background: "#10b981", borderRadius: 2 }} />
                  연기수령 ({deferStartAge}세)
                </span>
              </div>
            </div>

            <div style={{ width: "100%", height: 380, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPoints} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis
                    dataKey="age"
                    unit="세"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    stroke="rgba(255,255,255,0.15)"
                  />
                  <YAxis
                    tickFormatter={(val) => `${fmt(val / 10000)}억`}
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    stroke="rgba(255,255,255,0.15)"
                    width={55}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      const age = d.age;
                      const eCum = d.earlyCumulative;
                      const nCum = d.normalCumulative;
                      const dCum = d.deferCumulative;
                      const maxCum = Math.max(eCum, nCum, dCum);
                      const leader =
                        maxCum === eCum ? "조기수령 1위" : maxCum === nCum ? "정상수령 1위" : "연기수령 1위";

                      return (
                        <div style={styles.tooltipBox}>
                          <div style={styles.tooltipHeader}>
                            <span>만 {age}세 시점</span>
                            <span style={styles.tooltipLeaderBadge}>{leader}</span>
                          </div>
                          <div style={styles.tooltipRow}>
                            <span style={{ color: "#f97316" }}>● 조기수령 누적:</span>
                            <strong>{fmt(eCum)}만원</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              (월 {d.earlyMonthly}만원)
                            </span>
                          </div>
                          <div style={styles.tooltipRow}>
                            <span style={{ color: "#3b82f6" }}>● 정상수령 누적:</span>
                            <strong>{fmt(nCum)}만원</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              (월 {d.normalMonthly}만원)
                            </span>
                          </div>
                          <div style={styles.tooltipRow}>
                            <span style={{ color: "#10b981" }}>● 연기수령 누적:</span>
                            <strong>{fmt(dCum)}만원</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              (월 {d.deferMonthly}만원)
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* 크로스오버 기준선 1: 조기 vs 정상 */}
                  <ReferenceLine
                    x={Math.round(crossoverEarlyVsNormal.ageExact)}
                    stroke="#f97316"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `조기-정상 분기 (${crossoverEarlyVsNormal.ageDisplay})`,
                      position: "top",
                      fill: "#f97316",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  {/* 크로스오버 기준선 2: 정상 vs 연기 */}
                  <ReferenceLine
                    x={Math.round(crossoverNormalVsDefer.ageExact)}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `정상-연기 분기 (${crossoverNormalVsDefer.ageDisplay})`,
                      position: "top",
                      fill: "#10b981",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  {/* 사용자 기대수명 기준선 */}
                  <ReferenceLine
                    x={expectedLifeExpectancy}
                    stroke="#ec4899"
                    strokeDasharray="3 3"
                    strokeWidth={1.8}
                    label={{
                      value: `기대수명 (${expectedLifeExpectancy}세)`,
                      position: "bottom",
                      fill: "#ec4899",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="earlyCumulative"
                    name="조기수령"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "#f97316" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="normalCumulative"
                    name="정상수령"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deferCumulative"
                    name="연기수령"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. 3대 전략 상세 비교 카드 (3열) */}
          <div style={styles.grid3}>
            {/* 조기노령연금 */}
            <div style={styles.strategyCard}>
              <div style={styles.strategyHeader}>
                <div style={styles.strategyBadgeOrange}>{strategies.early.badge}</div>
                <h4 style={styles.strategyTitle}>{strategies.early.title}</h4>
              </div>
              <div style={styles.strategyMonthlyBox}>
                <span style={styles.strategyMonthlyLabel}>월 수령액</span>
                <span style={styles.strategyMonthlyValOrange}>월 {strategies.early.monthlyPension}만원</span>
                <span style={styles.strategyRateBadge}>{strategies.early.rateLabel}</span>
              </div>

              <div style={styles.milestoneGrid}>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>80세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.early.cumulativeAt80)}만원</div>
                </div>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>85세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.early.cumulativeAt85)}만원</div>
                </div>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>90세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.early.cumulativeAt90)}만원</div>
                </div>
              </div>

              {/* 건보료 피부양자 상태 */}
              <div style={strategies.early.healthInsuranceRisk ? styles.warnBox : styles.safeBox}>
                <span style={{ fontSize: "0.85rem" }}>
                  {strategies.early.healthInsuranceRisk ? "⚠️ " : "✅ "}
                  {strategies.early.healthInsuranceNote}
                </span>
              </div>

              <div style={styles.prosConsBlock}>
                <div style={styles.prosTitle}>장점</div>
                <ul style={styles.list}>
                  {strategies.early.pros.map((p, i) => (
                    <li key={`early-pro-${i}`} style={styles.listItem}>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={styles.consTitle}>단점 및 주의사항</div>
                <ul style={styles.list}>
                  {strategies.early.cons.map((c, i) => (
                    <li key={`early-con-${i}`} style={styles.listItem}>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.targetBox}>
                <strong>권장 대상:</strong> {strategies.early.recommendTarget}
              </div>
            </div>

            {/* 정상노령연금 */}
            <div style={styles.strategyCardActive}>
              <div style={styles.strategyHeader}>
                <div style={styles.strategyBadgeBlue}>{strategies.normal.badge}</div>
                <h4 style={styles.strategyTitle}>{strategies.normal.title}</h4>
              </div>
              <div style={styles.strategyMonthlyBox}>
                <span style={styles.strategyMonthlyLabel}>월 수령액</span>
                <span style={styles.strategyMonthlyValBlue}>월 {strategies.normal.monthlyPension}만원</span>
                <span style={styles.strategyRateBadge}>{strategies.normal.rateLabel}</span>
              </div>

              <div style={styles.milestoneGrid}>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>80세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.normal.cumulativeAt80)}만원</div>
                </div>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>85세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.normal.cumulativeAt85)}만원</div>
                </div>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>90세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.normal.cumulativeAt90)}만원</div>
                </div>
              </div>

              {/* 건보료 피부양자 상태 */}
              <div style={strategies.normal.healthInsuranceRisk ? styles.warnBox : styles.safeBox}>
                <span style={{ fontSize: "0.85rem" }}>
                  {strategies.normal.healthInsuranceRisk ? "⚠️ " : "✅ "}
                  {strategies.normal.healthInsuranceNote}
                </span>
              </div>

              <div style={styles.prosConsBlock}>
                <div style={styles.prosTitle}>장점</div>
                <ul style={styles.list}>
                  {strategies.normal.pros.map((p, i) => (
                    <li key={`normal-pro-${i}`} style={styles.listItem}>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={styles.consTitle}>단점 및 주의사항</div>
                <ul style={styles.list}>
                  {strategies.normal.cons.map((c, i) => (
                    <li key={`normal-con-${i}`} style={styles.listItem}>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.targetBox}>
                <strong>권장 대상:</strong> {strategies.normal.recommendTarget}
              </div>
            </div>

            {/* 연기연금 */}
            <div style={styles.strategyCard}>
              <div style={styles.strategyHeader}>
                <div style={styles.strategyBadgeGreen}>{strategies.defer.badge}</div>
                <h4 style={styles.strategyTitle}>{strategies.defer.title}</h4>
              </div>
              <div style={styles.strategyMonthlyBox}>
                <span style={styles.strategyMonthlyLabel}>월 수령액</span>
                <span style={styles.strategyMonthlyValGreen}>월 {strategies.defer.monthlyPension}만원</span>
                <span style={styles.strategyRateBadge}>{strategies.defer.rateLabel}</span>
              </div>

              <div style={styles.milestoneGrid}>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>80세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.defer.cumulativeAt80)}만원</div>
                </div>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>85세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.defer.cumulativeAt85)}만원</div>
                </div>
                <div style={styles.milestoneItem}>
                  <div style={styles.milestoneLabel}>90세 누적</div>
                  <div style={styles.milestoneVal}>{fmt(strategies.defer.cumulativeAt90)}만원</div>
                </div>
              </div>

              {/* 건보료 피부양자 상태 */}
              <div style={strategies.defer.healthInsuranceRisk ? styles.warnBox : styles.safeBox}>
                <span style={{ fontSize: "0.85rem" }}>
                  {strategies.defer.healthInsuranceRisk ? "⚠️ " : "✅ "}
                  {strategies.defer.healthInsuranceNote}
                </span>
              </div>

              <div style={styles.prosConsBlock}>
                <div style={styles.prosTitle}>장점</div>
                <ul style={styles.list}>
                  {strategies.defer.pros.map((p, i) => (
                    <li key={`defer-pro-${i}`} style={styles.listItem}>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={styles.consTitle}>단점 및 주의사항</div>
                <ul style={styles.list}>
                  {strategies.defer.cons.map((c, i) => (
                    <li key={`defer-con-${i}`} style={styles.listItem}>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.targetBox}>
                <strong>권장 대상:</strong> {strategies.defer.recommendTarget}
              </div>
            </div>
          </div>

          {/* 5. CFP 종합 진단 및 실전 의사결정 체크리스트 */}
          <div style={styles.prescriptionBox} className="premium-card">
            <div style={styles.prescriptionHeader}>
              <span style={{ fontSize: "1.2rem" }}>📋</span>
              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-accent)" }}>
                국제공인재무설계사(CFP) 실전 의사결정 처방 가이드
              </h4>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {cfpPrescription.map((text, idx) => (
                <div key={`presc-${idx}`} style={styles.prescItem}>
                  <div style={{ flex: 1, fontSize: "0.88rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div style={styles.footer}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            * 본 시뮬레이션은 국민연금법 감액률(-6%/년) 및 가산율(+7.2%/년)을 준용하여 산출된 참고용 추정치입니다.
          </div>
          <button type="button" onClick={onClose} className="premium-button" style={{ padding: "8px 24px" }}>
            확인 및 닫기
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
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 15, 29, 0.75)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    backgroundColor: "var(--bg-card, #111827)",
    borderRadius: "18px",
    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    width: "100%",
    maxWidth: "1140px",
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "24px 30px 18px",
    borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 12px",
    borderRadius: "var(--radius-full, 9999px)",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    color: "var(--text-accent, #818cf8)",
    fontSize: "0.8rem",
    fontWeight: 700,
    marginBottom: "8px",
  },
  badgeSub: {
    fontSize: "0.72rem",
    opacity: 0.8,
    fontWeight: 500,
    borderLeft: "1px solid rgba(255,255,255,0.2)",
    paddingLeft: "6px",
  },
  title: {
    fontSize: "1.45rem",
    fontWeight: 800,
    margin: "0 0 6px 0",
    color: "var(--text-primary, #f9fafb)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "0.86rem",
    color: "var(--text-muted, #9ca3af)",
    margin: 0,
    lineHeight: 1.5,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted, #9ca3af)",
    fontSize: "1.4rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    lineHeight: 1,
  },
  content: {
    padding: "24px 30px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  controlPanel: {
    padding: "18px 22px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  controlGroup: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  controlLabel: {
    fontSize: "0.84rem",
    fontWeight: 700,
    color: "var(--text-secondary, #d1d5db)",
  },
  toggleRow: {
    display: "flex",
    gap: "8px",
  },
  tabBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 600,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "var(--text-muted, #9ca3af)",
    cursor: "pointer",
  },
  tabBtnActive: {
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 700,
    background: "var(--text-accent, #6366f1)",
    border: "1px solid var(--text-accent, #6366f1)",
    color: "#ffffff",
    cursor: "pointer",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  controlItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  paramValueHighlight: {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "var(--text-accent, #818cf8)",
  },
  slider: {
    width: "100%",
    accentColor: "var(--text-accent, #6366f1)",
    cursor: "pointer",
  },
  sliderRange: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.72rem",
    color: "var(--text-muted, #9ca3af)",
  },
  buttonGroup: {
    display: "flex",
    gap: "6px",
  },
  choiceBtn: {
    flex: 1,
    padding: "6px 0",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 600,
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "var(--text-muted, #9ca3af)",
    cursor: "pointer",
    textAlign: "center",
  },
  choiceBtnActiveOrange: {
    flex: 1,
    padding: "6px 0",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 700,
    background: "rgba(249, 115, 22, 0.2)",
    border: "1px solid #f97316",
    color: "#f97316",
    cursor: "pointer",
    textAlign: "center",
  },
  choiceBtnActiveGreen: {
    flex: 1,
    padding: "6px 0",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 700,
    background: "rgba(16, 185, 129, 0.2)",
    border: "1px solid #10b981",
    color: "#10b981",
    cursor: "pointer",
    textAlign: "center",
  },
  paramSubHint: {
    fontSize: "0.76rem",
    color: "var(--text-muted, #9ca3af)",
  },
  valueToggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  segmentToggle: {
    display: "flex",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: "3px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  segmentBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted, #9ca3af)",
    padding: "5px 12px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "6px",
  },
  segmentBtnActive: {
    backgroundColor: "var(--text-accent, #6366f1)",
    border: "none",
    color: "#ffffff",
    padding: "5px 12px",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  valueToggleNote: {
    fontSize: "0.78rem",
    color: "var(--text-muted, #9ca3af)",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "14px",
  },
  kpiCardOrange: {
    padding: "16px 20px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(17, 24, 39, 0.7) 100%)",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  kpiCardGreen: {
    padding: "16px 20px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(17, 24, 39, 0.7) 100%)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  kpiCardAccent: {
    padding: "16px 20px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(17, 24, 39, 0.7) 100%)",
    border: "1px solid rgba(99, 102, 241, 0.35)",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  kpiIcon: {
    fontSize: "1.8rem",
    lineHeight: 1,
    paddingTop: "2px",
  },
  kpiLabelOrange: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#f97316",
    marginBottom: "4px",
  },
  kpiValueOrange: {
    fontSize: "1.45rem",
    fontWeight: 800,
    color: "#ffedd5",
    letterSpacing: "-0.02em",
    marginBottom: "4px",
  },
  kpiLabelGreen: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#10b981",
    marginBottom: "4px",
  },
  kpiValueGreen: {
    fontSize: "1.45rem",
    fontWeight: 800,
    color: "#d1fae5",
    letterSpacing: "-0.02em",
    marginBottom: "4px",
  },
  kpiLabelAccent: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "var(--text-accent, #818cf8)",
    marginBottom: "4px",
  },
  kpiValueAccent: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#e0e7ff",
    letterSpacing: "-0.02em",
    marginBottom: "4px",
  },
  kpiDesc: {
    fontSize: "0.78rem",
    color: "var(--text-muted, #9ca3af)",
    lineHeight: 1.4,
  },
  chartCard: {
    padding: "20px 24px",
    borderRadius: "14px",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
  },
  chartTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--text-primary, #f9fafb)",
    margin: "0 0 4px 0",
  },
  chartSubtitle: {
    fontSize: "0.82rem",
    color: "var(--text-muted, #9ca3af)",
    margin: 0,
  },
  chartLegendCustom: {
    display: "flex",
    gap: "16px",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  tooltipBox: {
    backgroundColor: "rgba(17, 24, 39, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    padding: "12px 16px",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "220px",
  },
  tooltipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "0.88rem",
    color: "var(--text-primary, #f9fafb)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "6px",
    marginBottom: "4px",
  },
  tooltipLeaderBadge: {
    fontSize: "0.72rem",
    padding: "2px 8px",
    borderRadius: "4px",
    backgroundColor: "rgba(99, 102, 241, 0.25)",
    color: "var(--text-accent, #818cf8)",
  },
  tooltipRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.82rem",
    gap: "8px",
  },
  strategyCard: {
    padding: "18px 20px",
    borderRadius: "14px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  strategyCardActive: {
    padding: "18px 20px",
    borderRadius: "14px",
    backgroundColor: "rgba(59, 130, 246, 0.03)",
    border: "1px solid rgba(59, 130, 246, 0.35)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  strategyHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  strategyBadgeOrange: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#f97316",
    background: "rgba(249, 115, 22, 0.15)",
    padding: "3px 8px",
    borderRadius: "4px",
    width: "fit-content",
  },
  strategyBadgeBlue: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#3b82f6",
    background: "rgba(59, 130, 246, 0.15)",
    padding: "3px 8px",
    borderRadius: "4px",
    width: "fit-content",
  },
  strategyBadgeGreen: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.15)",
    padding: "3px 8px",
    borderRadius: "4px",
    width: "fit-content",
  },
  strategyTitle: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "var(--text-primary, #f9fafb)",
    margin: 0,
  },
  strategyMonthlyBox: {
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "rgba(0,0,0,0.25)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strategyMonthlyLabel: {
    fontSize: "0.82rem",
    color: "var(--text-muted, #9ca3af)",
    fontWeight: 600,
  },
  strategyMonthlyValOrange: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#f97316",
  },
  strategyMonthlyValBlue: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#60a5fa",
  },
  strategyMonthlyValGreen: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#34d399",
  },
  strategyRateBadge: {
    fontSize: "0.72rem",
    color: "var(--text-muted, #9ca3af)",
  },
  milestoneGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "6px",
    padding: "10px 12px",
    borderRadius: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    textAlign: "center",
  },
  milestoneItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  milestoneLabel: {
    fontSize: "0.7rem",
    color: "var(--text-muted, #9ca3af)",
  },
  milestoneVal: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--text-primary, #f9fafb)",
  },
  warnBox: {
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#fca5a5",
    fontSize: "0.78rem",
    lineHeight: 1.4,
  },
  safeBox: {
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    color: "#a7f3d0",
    fontSize: "0.78rem",
    lineHeight: 1.4,
  },
  prosConsBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "0.8rem",
  },
  prosTitle: {
    fontWeight: 700,
    color: "#34d399",
    fontSize: "0.82rem",
  },
  consTitle: {
    fontWeight: 700,
    color: "#f87171",
    fontSize: "0.82rem",
  },
  list: {
    margin: "0 0 4px 0",
    paddingLeft: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  listItem: {
    color: "var(--text-secondary, #d1d5db)",
    lineHeight: 1.4,
  },
  targetBox: {
    fontSize: "0.78rem",
    color: "var(--text-muted, #9ca3af)",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "10px 12px",
    borderRadius: "8px",
    lineHeight: 1.4,
  },
  prescriptionBox: {
    padding: "18px 22px",
    borderRadius: "14px",
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
  },
  prescriptionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  prescItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  footer: {
    padding: "16px 30px",
    borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    flexWrap: "wrap",
    gap: "12px",
  },
};
