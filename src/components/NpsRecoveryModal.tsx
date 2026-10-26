// 국민연금 본인/배우자 추납 및 반납 선택적 시뮬레이션과 부부 합산 실익을 분석하는 모달 컴포넌트
"use client";

import React, { useState, useMemo } from "react";
import {
  calculateCoupleRecovery,
  RecoveryOptionInput,
  RecoveryAnalysisResult,
  CoupleRecoveryResult,
} from "@/services/npsRecoveryCalculator";
import { usePensionStore } from "@/store/usePensionStore";
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

interface NpsRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAge?: number;
  npsStartAge?: number;
  expectedLifeExpectancy?: number;
  currentMonthlyPensionWon?: number;
  spouseAge?: number;
  spouseNpsStartAge?: number;
  spouseLifeExpectancy?: number;
  spouseMonthlyPensionWon?: number;
}

type TabKey = "SELF" | "SPOUSE" | "COUPLE";

export default function NpsRecoveryModal({
  isOpen,
  onClose,
  currentAge: propCurrentAge,
  npsStartAge: propNpsStartAge,
  expectedLifeExpectancy: propExpectedLifeExpectancy,
  currentMonthlyPensionWon: propCurrentMonthlyPensionWon,
  spouseAge: propSpouseAge,
  spouseNpsStartAge: propSpouseNpsStartAge,
  spouseLifeExpectancy: propSpouseLifeExpectancy,
  spouseMonthlyPensionWon: propSpouseMonthlyPensionWon,
}: NpsRecoveryModalProps) {
  const store = usePensionStore();

  // 활성 탭 (본인 / 배우자 / 부부 합산 시너지)
  const [activeTab, setActiveTab] = useState<TabKey>("SELF");

  // 본인 기본 인구통계 파라미터
  const selfAge = propCurrentAge || store.simulationParams.currentAge || 55;
  const selfNpsStartAge = propNpsStartAge || store.simulationParams.nationalPensionStartAge || 65;
  const selfLifeExpectancy = propExpectedLifeExpectancy || store.simulationParams.expectedLifeExpectancy || 88;
  const selfMonthlyPension =
    propCurrentMonthlyPensionWon ||
    (store.nationalPension.expectedMonthlyPension ? store.nationalPension.expectedMonthlyPension * 10000 : 1200000);

  // 배우자 기본 인구통계 파라미터
  const hasSpouse = store.simulationParams.hasSpouse;
  const spouseAge = propSpouseAge || store.simulationParams.spouseAge || Math.max(20, selfAge - 2);
  const spouseNpsStartAge = propSpouseNpsStartAge || store.simulationParams.spouseNationalPensionStartAge || 65;
  const spouseLifeExpectancy = propSpouseLifeExpectancy || store.simulationParams.spouseLifeExpectancy || 90;
  const spouseMonthlyPension =
    propSpouseMonthlyPensionWon ||
    (store.spouse.nationalPension.expectedMonthlyPension ? store.spouse.nationalPension.expectedMonthlyPension * 10000 : 800000);

  // 반환원금에 따른 복원 가입기간 산출 헬퍼 (약 12.5만원당 1개월 복원)
  const calcRestoredMonths = (won: number) => Math.min(144, Math.max(6, Math.round(won / 125000)));

  // 본인(Self) 추납 및 반납 선택 토글 상태 (기본정보에서 시뮬레이션 반영 여부에 따라 디폴트 선택 연동)
  const [selfHasAdditionalPayment, setSelfHasAdditionalPayment] = useState<boolean>(() =>
    Boolean(store.additionalPayment.applyToSimulation)
  );
  const [selfHasReturnRefund, setSelfHasReturnRefund] = useState<boolean>(() =>
    Boolean(store.returnRepayment.applyToSimulation)
  );
  const [selfAdditionalMonths, setSelfAdditionalMonths] = useState<number>(
    store.additionalPayment.requestedMonths || 60
  );
  // 등록된 기준소득월액 최우선 연동
  const initialSelfBaseIncome =
    store.nationalPension.currentStandardMonthlyIncome && store.nationalPension.currentStandardMonthlyIncome > 0
      ? store.nationalPension.currentStandardMonthlyIncome * 10000
      : store.additionalPayment.baseIncome && store.additionalPayment.baseIncome > 0
      ? store.additionalPayment.baseIncome * 10000
      : 3000000;
  const [selfBaseIncomeWon, setSelfBaseIncomeWon] = useState<number>(initialSelfBaseIncome);
  const [selfAdditionalPaymentMode, setSelfAdditionalPaymentMode] = useState<"LUMP" | "INSTALLMENT">(
    store.additionalPayment.paymentMode || "LUMP"
  );
  const [selfAdditionalInstallments, setSelfAdditionalInstallments] = useState<number>(
    store.additionalPayment.installments || 12
  );

  const [selfRefundYearPeriod, setSelfRefundYearPeriod] = useState<"PRE_1998" | "1999_2007" | "POST_2008">("PRE_1998");
  const initialSelfPrincipal = store.returnRepayment.refundAmount ? store.returnRepayment.refundAmount * 10000 : 5000000;
  const [selfRefundPrincipalWon, setSelfRefundPrincipalWon] = useState<number>(initialSelfPrincipal);
  const [selfRefundYearsPassed, setSelfRefundYearsPassed] = useState<number>(
    store.returnRepayment.refundYm
      ? Math.max(1, 2026 - Number(store.returnRepayment.refundYm.slice(0, 4)))
      : 25
  );
  const [selfRestoredMonths, setSelfRestoredMonths] = useState<number>(
    store.returnRepayment.restoredMonths || calcRestoredMonths(initialSelfPrincipal)
  );
  const [selfRefundNoticeAmountWon, setSelfRefundNoticeAmountWon] = useState<number>(
    store.returnRepayment.noticeAmount > 0 ? store.returnRepayment.noticeAmount * 10000 : 0
  );
  const [selfRefundPaymentMode, setSelfRefundPaymentMode] = useState<"LUMP" | "INSTALLMENT">(
    store.returnRepayment.installments > 1 ? "INSTALLMENT" : "LUMP"
  );
  const [selfRefundInstallments, setSelfRefundInstallments] = useState<number>(
    store.returnRepayment.installments || 1
  );

  // 배우자(Spouse) 추납 및 반납 선택 토글 상태 (기본정보에서 시뮬레이션 반영 여부에 따라 디폴트 선택 연동)
  const [spouseHasAdditionalPayment, setSpouseHasAdditionalPayment] = useState<boolean>(() =>
    Boolean(store.spouse.additionalPayment.applyToSimulation)
  );
  const [spouseHasReturnRefund, setSpouseHasReturnRefund] = useState<boolean>(() =>
    Boolean(store.spouse.returnRepayment.applyToSimulation)
  );
  const [spouseAdditionalMonths, setSpouseAdditionalMonths] = useState<number>(
    store.spouse.additionalPayment.requestedMonths || 60
  );
  // 배우자 등록된 기준소득월액 최우선 연동
  const initialSpouseBaseIncome =
    store.spouse.nationalPension.currentStandardMonthlyIncome && store.spouse.nationalPension.currentStandardMonthlyIncome > 0
      ? store.spouse.nationalPension.currentStandardMonthlyIncome * 10000
      : store.spouse.additionalPayment.baseIncome && store.spouse.additionalPayment.baseIncome > 0
      ? store.spouse.additionalPayment.baseIncome * 10000
      : 2500000;
  const [spouseBaseIncomeWon, setSpouseBaseIncomeWon] = useState<number>(initialSpouseBaseIncome);
  const [spouseAdditionalPaymentMode, setSpouseAdditionalPaymentMode] = useState<"LUMP" | "INSTALLMENT">(
    store.spouse.additionalPayment.paymentMode || "LUMP"
  );
  const [spouseAdditionalInstallments, setSpouseAdditionalInstallments] = useState<number>(
    store.spouse.additionalPayment.installments || 12
  );

  const [spouseRefundYearPeriod, setSpouseRefundYearPeriod] = useState<"PRE_1998" | "1999_2007" | "POST_2008">("PRE_1998");
  // 배우자 반납금 실데이터 (1994년 반환일시금 원금 1,318,312원, 공단 고지액 3,418,930원, 12회 분납, 30개월 복원)
  const initialSpousePrincipal = store.spouse.returnRepayment.refundAmount
    ? store.spouse.returnRepayment.refundAmount * 10000
    : 1318312;
  const [spouseRefundPrincipalWon, setSpouseRefundPrincipalWon] = useState<number>(initialSpousePrincipal);
  const [spouseRefundYearsPassed, setSpouseRefundYearsPassed] = useState<number>(
    store.spouse.returnRepayment.refundYm
      ? Math.max(1, 2026 - Number(store.spouse.returnRepayment.refundYm.slice(0, 4)))
      : 28
  );
  const [spouseRestoredMonths, setSpouseRestoredMonths] = useState<number>(
    store.spouse.returnRepayment.restoredMonths || 30
  );
  const initialSpouseNoticeAmount = store.spouse.returnRepayment.noticeAmount > 0
    ? store.spouse.returnRepayment.noticeAmount * 10000
    : 3418930;
  const [spouseRefundNoticeAmountWon, setSpouseRefundNoticeAmountWon] = useState<number>(initialSpouseNoticeAmount);
  const [spouseRefundPaymentMode, setSpouseRefundPaymentMode] = useState<"LUMP" | "INSTALLMENT">(
    store.spouse.returnRepayment.installments > 1 || initialSpouseNoticeAmount > 0 ? "INSTALLMENT" : "LUMP"
  );
  const [spouseRefundInstallments, setSpouseRefundInstallments] = useState<number>(
    store.spouse.returnRepayment.installments || 12
  );

  // 본인 입력 객체
  const selfInput: RecoveryOptionInput = useMemo(
    () => ({
      currentAge: selfAge,
      npsStartAge: selfNpsStartAge,
      lifeExpectancy: selfLifeExpectancy,
      currentMonthlyPension: selfMonthlyPension,
      hasAdditionalPayment: selfHasAdditionalPayment,
      baseIncomeWon: selfBaseIncomeWon,
      additionalMonths: selfAdditionalMonths,
      additionalPaymentMode: selfAdditionalPaymentMode,
      additionalInstallments: selfAdditionalInstallments,
      hasReturnRefund: selfHasReturnRefund,
      refundYearPeriod: selfRefundYearPeriod,
      refundPrincipalWon: selfRefundPrincipalWon,
      refundYearsPassed: selfRefundYearsPassed,
      restoredMonths: selfRestoredMonths,
      noticeAmountWon: selfRefundNoticeAmountWon,
      refundPaymentMode: selfRefundPaymentMode,
      refundInstallments: selfRefundInstallments,
    }),
    [
      selfAge,
      selfNpsStartAge,
      selfLifeExpectancy,
      selfMonthlyPension,
      selfHasAdditionalPayment,
      selfBaseIncomeWon,
      selfAdditionalMonths,
      selfAdditionalPaymentMode,
      selfAdditionalInstallments,
      selfHasReturnRefund,
      selfRefundYearPeriod,
      selfRefundPrincipalWon,
      selfRefundYearsPassed,
      selfRestoredMonths,
      selfRefundNoticeAmountWon,
      selfRefundPaymentMode,
      selfRefundInstallments,
    ]
  );

  // 배우자 입력 객체
  const spouseInput: RecoveryOptionInput = useMemo(
    () => ({
      currentAge: spouseAge,
      npsStartAge: spouseNpsStartAge,
      lifeExpectancy: spouseLifeExpectancy,
      currentMonthlyPension: spouseMonthlyPension,
      hasAdditionalPayment: spouseHasAdditionalPayment,
      baseIncomeWon: spouseBaseIncomeWon,
      additionalMonths: spouseAdditionalMonths,
      additionalPaymentMode: spouseAdditionalPaymentMode,
      additionalInstallments: spouseAdditionalInstallments,
      hasReturnRefund: spouseHasReturnRefund,
      refundYearPeriod: spouseRefundYearPeriod,
      refundPrincipalWon: spouseRefundPrincipalWon,
      refundYearsPassed: spouseRefundYearsPassed,
      restoredMonths: spouseRestoredMonths,
      noticeAmountWon: spouseRefundNoticeAmountWon,
      refundPaymentMode: spouseRefundPaymentMode,
      refundInstallments: spouseRefundInstallments,
    }),
    [
      spouseAge,
      spouseNpsStartAge,
      spouseLifeExpectancy,
      spouseMonthlyPension,
      spouseHasAdditionalPayment,
      spouseBaseIncomeWon,
      spouseAdditionalMonths,
      spouseAdditionalPaymentMode,
      spouseAdditionalInstallments,
      spouseHasReturnRefund,
      spouseRefundYearPeriod,
      spouseRefundPrincipalWon,
      spouseRefundYearsPassed,
      spouseRestoredMonths,
      spouseRefundNoticeAmountWon,
      spouseRefundPaymentMode,
      spouseRefundInstallments,
    ]
  );

  // 통합 시뮬레이션 결과 연산
  const coupleResult: CoupleRecoveryResult = useMemo(
    () => calculateCoupleRecovery(selfInput, spouseInput),
    [selfInput, spouseInput]
  );

  if (!isOpen) return null;

  const activeResult: RecoveryAnalysisResult =
    activeTab === "SPOUSE" ? coupleResult.spouse : coupleResult.self;
  const isSpouseTab = activeTab === "SPOUSE";
  const isCoupleTab = activeTab === "COUPLE";

  // 실데이터 여부 판별 (기본정보에서 대시보드 시뮬레이션에 반영 체크되었고 실제 데이터가 존재하는 경우에만 실데이터로 표기)
  const hasRealSelfAdditional = Boolean(
    store.additionalPayment.applyToSimulation &&
    (store.additionalPayment.requestedMonths > 0 ||
      store.additionalPayment.gapMonths > 0 ||
      Boolean(store.additionalPayment.firstEnrollYm))
  );
  const hasRealSelfReturn = Boolean(
    store.returnRepayment.applyToSimulation &&
    (store.returnRepayment.refundAmount > 0 ||
      store.returnRepayment.restoredMonths > 0)
  );
  const hasRealSpouseAdditional = Boolean(
    store.spouse.additionalPayment.applyToSimulation &&
    (store.spouse.additionalPayment.requestedMonths > 0 ||
      store.spouse.additionalPayment.gapMonths > 0 ||
      Boolean(store.spouse.additionalPayment.firstEnrollYm))
  );
  const hasRealSpouseReturn = Boolean(
    store.spouse.returnRepayment.applyToSimulation &&
    (store.spouse.returnRepayment.refundAmount > 0 ||
      store.spouse.returnRepayment.restoredMonths > 0)
  );

  const isCurrentAdditionalReal = isSpouseTab ? hasRealSpouseAdditional : hasRealSelfAdditional;
  const isCurrentReturnReal = isSpouseTab ? hasRealSpouseReturn : hasRealSelfReturn;

  // 활성 탭 파라미터 접근자
  const currentHasAdditionalPayment = isSpouseTab ? spouseHasAdditionalPayment : selfHasAdditionalPayment;
  const setCurrentHasAdditionalPayment = isSpouseTab ? setSpouseHasAdditionalPayment : setSelfHasAdditionalPayment;

  const currentHasReturnRefund = isSpouseTab ? spouseHasReturnRefund : selfHasReturnRefund;
  const setCurrentHasReturnRefund = isSpouseTab ? setSpouseHasReturnRefund : setSelfHasReturnRefund;

  const currentAdditionalMonths = isSpouseTab ? spouseAdditionalMonths : selfAdditionalMonths;
  const setCurrentAdditionalMonths = isSpouseTab ? setSpouseAdditionalMonths : setSelfAdditionalMonths;

  const currentBaseIncomeWon = isSpouseTab ? spouseBaseIncomeWon : selfBaseIncomeWon;
  const setCurrentBaseIncomeWon = isSpouseTab ? setSpouseBaseIncomeWon : setSelfBaseIncomeWon;

  const currentRefundYearPeriod = isSpouseTab ? spouseRefundYearPeriod : selfRefundYearPeriod;
  const setCurrentRefundYearPeriod = isSpouseTab ? setSpouseRefundYearPeriod : setSelfRefundYearPeriod;

  const currentRefundPrincipalWon = isSpouseTab ? spouseRefundPrincipalWon : selfRefundPrincipalWon;
  const setCurrentRefundPrincipalWon = isSpouseTab ? setSpouseRefundPrincipalWon : setSelfRefundPrincipalWon;

  const handleRefundPrincipalChange = (val: number) => {
    if (isSpouseTab) {
      setSpouseRefundPrincipalWon(val);
      setSpouseRestoredMonths(calcRestoredMonths(val));
    } else {
      setSelfRefundPrincipalWon(val);
      setSelfRestoredMonths(calcRestoredMonths(val));
    }
  };

  const currentRefundYearsPassed = isSpouseTab ? spouseRefundYearsPassed : selfRefundYearsPassed;
  const setCurrentRefundYearsPassed = isSpouseTab ? setSpouseRefundYearsPassed : setSelfRefundYearsPassed;

  const currentAdditionalPaymentMode = isSpouseTab ? spouseAdditionalPaymentMode : selfAdditionalPaymentMode;
  const setCurrentAdditionalPaymentMode = isSpouseTab ? setSpouseAdditionalPaymentMode : setSelfAdditionalPaymentMode;

  const currentAdditionalInstallments = isSpouseTab ? spouseAdditionalInstallments : selfAdditionalInstallments;
  const setCurrentAdditionalInstallments = isSpouseTab ? setSpouseAdditionalInstallments : setSelfAdditionalInstallments;

  const currentRefundPaymentMode = isSpouseTab ? spouseRefundPaymentMode : selfRefundPaymentMode;
  const setCurrentRefundPaymentMode = isSpouseTab ? setSpouseRefundPaymentMode : setSelfRefundPaymentMode;

  const currentRefundInstallments = isSpouseTab ? spouseRefundInstallments : selfRefundInstallments;
  const setCurrentRefundInstallments = isSpouseTab ? setSpouseRefundInstallments : setSelfRefundInstallments;

  const currentRefundNoticeAmountWon = isSpouseTab ? spouseRefundNoticeAmountWon : selfRefundNoticeAmountWon;
  const setCurrentRefundNoticeAmountWon = isSpouseTab ? setSpouseRefundNoticeAmountWon : setSelfRefundNoticeAmountWon;

  const activeAge = isSpouseTab ? spouseAge : selfAge;
  const activeNpsStartAge = isSpouseTab ? spouseNpsStartAge : selfNpsStartAge;
  const activeLifeExpectancy = isSpouseTab ? spouseLifeExpectancy : selfLifeExpectancy;

  const {
    additionalPayment,
    returnRepayment,
    combinedScenario,
    activeScenarioType,
    paybackMilestones,
    distributionByAge,
    chartData,
    recommendation,
  } = activeResult;

  // 주요 표시 대상 (결합, 추납 단독, 반납 단독, 미선택)
  let displayCostWon = 0;
  let displayMonthlyIncreaseWon = 0;
  let displayBreakEvenAge = activeNpsStartAge;
  let displayBreakEvenYears = 0;
  let displayNetProfitWon = 0;
  let displayRoiPercent = 0;
  let displayIrr = 0;
  let displayTitle = "추납 및 반납 미적용 (기존 상태 유지)";

  if (activeScenarioType === "BOTH" && combinedScenario) {
    displayCostWon = combinedScenario.totalCostWon;
    displayMonthlyIncreaseWon = combinedScenario.monthlyIncreaseWon;
    displayBreakEvenAge = combinedScenario.breakEvenAge;
    displayBreakEvenYears = combinedScenario.breakEvenYears;
    displayNetProfitWon = combinedScenario.netProfitWon;
    displayRoiPercent = combinedScenario.roiPercent;
    displayIrr = combinedScenario.annualEquivalentReturn;
    displayTitle = "추납 + 반납 동시 적용 (최대 시너지)";
  } else if (activeScenarioType === "ADDITIONAL_ONLY") {
    displayCostWon = additionalPayment.totalCostWon;
    displayMonthlyIncreaseWon = additionalPayment.monthlyIncreaseWon;
    displayBreakEvenAge = additionalPayment.breakEvenAge;
    displayBreakEvenYears = additionalPayment.breakEvenYears;
    displayNetProfitWon = additionalPayment.netProfitWon;
    displayRoiPercent = additionalPayment.roiPercent;
    displayIrr = additionalPayment.annualEquivalentReturn;
    displayTitle = "추납 단독 적용";
  } else if (activeScenarioType === "RETURN_ONLY" && returnRepayment) {
    displayCostWon = returnRepayment.totalCostWon;
    displayMonthlyIncreaseWon = returnRepayment.monthlyIncreaseWon;
    displayBreakEvenAge = returnRepayment.breakEvenAge;
    displayBreakEvenYears = returnRepayment.breakEvenYears;
    displayNetProfitWon = returnRepayment.netProfitWon;
    displayRoiPercent = returnRepayment.roiPercent;
    displayIrr = returnRepayment.annualEquivalentReturn;
    displayTitle = "과거 반납 복원 단독 적용";
  }

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
          maxWidth: "1120px",
          maxHeight: "92vh",
          backgroundColor: "var(--surface, #111827)",
          borderRadius: "16px",
          border: "1px solid var(--border, rgba(255, 255, 255, 0.12))",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--text-primary, #f9fafb)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Tabs */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.05) 100%)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.35rem" }}>⚖️</span>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                국민연금 추납(추후납부) vs 반납 실익 역산기
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "var(--text-accent, #818cf8)",
                  fontWeight: 600,
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                2026 연금개혁 산식
              </span>
              {!hasSpouse && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(148, 163, 184, 0.15)",
                    color: "var(--text-secondary, #94a3b8)",
                  }}
                >
                  단독가구(배우자 모의체험 가능)
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{
                background: "none",
                border: "none",
                fontSize: "1.4rem",
                cursor: "pointer",
                color: "var(--text-muted, #94a3b8)",
                padding: "4px 8px",
                borderRadius: "8px",
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary, #94a3b8)" }}>
            추납과 반납을 각각 선택적으로 켜고 끄며 둘 중 하나 또는 둘 다 적용했을 때의 실익과 골든크로스를 정밀 비교합니다.
          </p>

          {/* Tab Buttons (본인 / 배우자 / 부부 합산 시너지) */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              background: "var(--surface-2, rgba(255, 255, 255, 0.04))",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
              width: "fit-content",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("SELF")}
              style={{
                padding: "8px 18px",
                fontSize: "0.85rem",
                fontWeight: activeTab === "SELF" ? 700 : 500,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background:
                  activeTab === "SELF"
                    ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                    : "transparent",
                color: activeTab === "SELF" ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                boxShadow: activeTab === "SELF" ? "0 2px 8px rgba(99, 102, 241, 0.35)" : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>👤</span> 본인 분석
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  background: activeTab === "SELF" ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.15)",
                }}
              >
                {selfAge}세
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SPOUSE")}
              style={{
                padding: "8px 18px",
                fontSize: "0.85rem",
                fontWeight: activeTab === "SPOUSE" ? 700 : 500,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background:
                  activeTab === "SPOUSE"
                    ? "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                    : "transparent",
                color: activeTab === "SPOUSE" ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                boxShadow: activeTab === "SPOUSE" ? "0 2px 8px rgba(236, 72, 153, 0.35)" : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>👥</span> 배우자 분석
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  background: activeTab === "SPOUSE" ? "rgba(255,255,255,0.2)" : "rgba(236,72,153,0.15)",
                }}
              >
                {spouseAge}세
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("COUPLE")}
              style={{
                padding: "8px 18px",
                fontSize: "0.85rem",
                fontWeight: activeTab === "COUPLE" ? 700 : 500,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background:
                  activeTab === "COUPLE"
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "transparent",
                color: activeTab === "COUPLE" ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                boxShadow: activeTab === "COUPLE" ? "0 2px 8px rgba(16, 185, 129, 0.35)" : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📊</span> 부부 합산 시너지
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* TAB 1 & 2: 본인 또는 배우자 개별 분석 뷰 */}
          {!isCoupleTab && (
            <>
              {/* Option Selector Toggle Bar (추납 ON/OFF & 반납 ON/OFF) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                {/* 1. 추납 적용 토글 카드 */}
                <div
                  onClick={() => setCurrentHasAdditionalPayment(!currentHasAdditionalPayment)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    border: currentHasAdditionalPayment
                      ? `2px solid ${isSpouseTab ? "#ec4899" : "#6366f1"}`
                      : "1px solid var(--border, rgba(255, 255, 255, 0.1))",
                    background: currentHasAdditionalPayment
                      ? isSpouseTab
                        ? "rgba(236, 72, 153, 0.08)"
                        : "rgba(99, 102, 241, 0.08)"
                      : "var(--surface-2, rgba(255, 255, 255, 0.02))",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={currentHasAdditionalPayment}
                      onChange={(e) => setCurrentHasAdditionalPayment(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: isSpouseTab ? "#ec4899" : "#6366f1",
                        cursor: "pointer",
                      }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                          {isSpouseTab ? "배우자" : "본인"} 국민연금 추납(추후납부)
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontWeight: 700,
                            background: isCurrentAdditionalReal ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                            border: isCurrentAdditionalReal ? "1px solid #10b981" : "1px solid rgba(148, 163, 184, 0.35)",
                            color: isCurrentAdditionalReal ? "#10b981" : "#94a3b8",
                          }}
                        >
                          {isCurrentAdditionalReal ? "추납(실데이터) 적용" : "추납(예시)"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
                        과거 미납·납부예외·경력단절 기간 가입기간 추가 납부
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      background: currentHasAdditionalPayment
                        ? isSpouseTab
                          ? "#ec4899"
                          : "#6366f1"
                        : "rgba(148, 163, 184, 0.2)",
                      color: "#ffffff",
                    }}
                  >
                    {currentHasAdditionalPayment ? "적용 중 ON" : "미적용 OFF"}
                  </span>
                </div>

                {/* 2. 반납 적용 토글 카드 */}
                <div
                  onClick={() => setCurrentHasReturnRefund(!currentHasReturnRefund)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    border: currentHasReturnRefund
                      ? "2px solid #10b981"
                      : "1px solid var(--border, rgba(255, 255, 255, 0.1))",
                    background: currentHasReturnRefund
                      ? "rgba(16, 185, 129, 0.08)"
                      : "var(--surface-2, rgba(255, 255, 255, 0.02))",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={currentHasReturnRefund}
                      onChange={(e) => setCurrentHasReturnRefund(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: "18px", height: "18px", accentColor: "#10b981", cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                          과거 반환일시금 반납(복원)
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontWeight: 700,
                            background: isCurrentReturnReal ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                            border: isCurrentReturnReal ? "1px solid #10b981" : "1px solid rgba(148, 163, 184, 0.35)",
                            color: isCurrentReturnReal ? "#10b981" : "#94a3b8",
                          }}
                        >
                          {isCurrentReturnReal ? "반납(실데이터) 적용" : "반납(예시)"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
                        1998년 이전 70% 등 과거 초고소득대체율 원상 복원
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      background: currentHasReturnRefund ? "#10b981" : "rgba(148, 163, 184, 0.2)",
                      color: "#ffffff",
                    }}
                  >
                    {currentHasReturnRefund ? "적용 중 ON" : "미적용 OFF"}
                  </span>
                </div>
              </div>

              {/* Detailed Parameter Sliders Grid (좌: 추납 2슬라이더, 우: 반납 2슬라이더+선택) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* 좌측 카드: 추납 파라미터 */}
                <div
                  style={{
                    background: "var(--modal-subbox-bg, var(--surface-2, rgba(255, 255, 255, 0.03)))",
                    padding: "16px 18px",
                    borderRadius: "12px",
                    border: "1px solid var(--modal-subbox-border, var(--border, rgba(255, 255, 255, 0.08)))",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    opacity: currentHasAdditionalPayment ? 1 : 0.45,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {/* 추납 희망 개월수 */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", whiteSpace: "nowrap", gap: "8px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                        추납 희망 기간 (최대 119개월)
                      </label>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: isSpouseTab ? "#f472b6" : "#818cf8",
                          fontWeight: 700,
                        }}
                      >
                        {currentAdditionalMonths}개월 ({(currentAdditionalMonths / 12).toFixed(1)}년)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={119}
                      disabled={!currentHasAdditionalPayment}
                      value={currentAdditionalMonths}
                      onChange={(e) => setCurrentAdditionalMonths(Number(e.target.value))}
                      style={{
                        width: "100%",
                        accentColor: isSpouseTab ? "#ec4899" : "#6366f1",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary, #94a3b8)",
                        marginTop: "2px",
                      }}
                    >
                      <span>1개월</span>
                      <span>60개월(5년)</span>
                      <span>119개월(최대)</span>
                    </div>
                  </div>

                  {/* 추납 기준소득월액 */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", whiteSpace: "nowrap", gap: "8px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                        신청 시 기준소득월액
                      </label>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: isSpouseTab ? "#f472b6" : "#a855f7",
                          fontWeight: 700,
                        }}
                      >
                        {Math.round(currentBaseIncomeWon / 10000).toLocaleString()}만원/월{" "}
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#94a3b8" }}>
                          (보험료: {Math.round((currentBaseIncomeWon * 0.09) / 10000)}만원)
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1000000}
                      max={6170000}
                      step={100000}
                      disabled={!currentHasAdditionalPayment}
                      value={currentBaseIncomeWon}
                      onChange={(e) => setCurrentBaseIncomeWon(Number(e.target.value))}
                      style={{
                        width: "100%",
                        accentColor: isSpouseTab ? "#db2777" : "#a855f7",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary, #94a3b8)",
                        marginTop: "2px",
                      }}
                    >
                      <span>100만원</span>
                      <span>300만원(평균 A값)</span>
                      <span>617만원(상한)</span>
                    </div>

                    {/* 추납 납부 방식 선택 (일시납 또는 분할납부) */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-primary, #ffffff)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        납부 방식
                      </label>
                      <select
                        disabled={!currentHasAdditionalPayment}
                        value={currentAdditionalPaymentMode === "LUMP" ? "LUMP" : `INST_${currentAdditionalInstallments}`}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "LUMP") {
                            setCurrentAdditionalPaymentMode("LUMP");
                          } else {
                            setCurrentAdditionalPaymentMode("INSTALLMENT");
                            const n = Number(v.replace("INST_", ""));
                            setCurrentAdditionalInstallments(n);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          background: "var(--surface, #1f2937)",
                          color: "var(--text-primary, #ffffff)",
                          border: "1px solid var(--border, rgba(255, 255, 255, 0.2))",
                        }}
                      >
                        <option value="LUMP">일시납 (이자 가산 없음)</option>
                        <option value="INST_12">12개월 분할납부 (1년 정기예금 이자 가산)</option>
                        <option value="INST_24">24개월 분할납부</option>
                        <option value="INST_60">60개월 분할납부 (최대 5년)</option>
                      </select>
                    </div>
                    {currentAdditionalPaymentMode === "INSTALLMENT" && additionalPayment && additionalPayment.installments > 1 && (
                      <div style={{ fontSize: "0.74rem", color: isSpouseTab ? "#f472b6" : "#818cf8", background: "rgba(99,102,241,0.08)", padding: "6px 10px", borderRadius: "6px", marginTop: "6px" }}>
                        월 <strong>{Math.round(additionalPayment.monthlyInstallmentWon / 10000).toLocaleString()}만원</strong>씩 {additionalPayment.installments}회 분납 (분납이자 +{Math.round(additionalPayment.interestCostWon / 10000)}만원 포함)
                      </div>
                    )}
                  </div>
                </div>

                {/* 우측 카드: 반납 파라미터 */}
                <div
                  style={{
                    background: "var(--modal-subbox-bg, var(--surface-2, rgba(255, 255, 255, 0.03)))",
                    padding: "16px 18px",
                    borderRadius: "12px",
                    border: "1px solid var(--modal-subbox-border, var(--border, rgba(255, 255, 255, 0.08)))",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    opacity: currentHasReturnRefund ? 1 : 0.45,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {/* 반납 시기 선택 */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-primary, #ffffff)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      반납 시기
                    </label>
                    <select
                      disabled={!currentHasReturnRefund}
                      value={currentRefundYearPeriod}
                      onChange={(e) => setCurrentRefundYearPeriod(e.target.value as any)}
                      style={{
                        flex: 1,
                        padding: "5px 8px",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        background: "var(--surface, #1f2937)",
                        color: "var(--text-primary, #ffffff)",
                        border: "1px solid var(--border, rgba(255, 255, 255, 0.2))",
                      }}
                    >
                      <option value="PRE_1998">1998년 이전 (소득대체율 70% 복원)</option>
                      <option value="1999_2007">1999~2007년 (소득대체율 60% 복원)</option>
                      <option value="POST_2008">2008년 이후 (소득대체율 50~40%)</option>
                    </select>
                  </div>

                  {/* 반환 원금 */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", whiteSpace: "nowrap", gap: "8px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                        반환 원금
                      </label>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#34d399" }}>
                        {Math.round(currentRefundPrincipalWon / 10000).toLocaleString()}만원{" "}
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#94a3b8" }}>
                          (약 {calcRestoredMonths(currentRefundPrincipalWon)}개월 복원)
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1000000}
                      max={20000000}
                      step={100000}
                      disabled={!currentHasReturnRefund}
                      value={currentRefundPrincipalWon}
                      onChange={(e) => handleRefundPrincipalChange(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#10b981", display: "block" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary, #94a3b8)",
                        marginTop: "2px",
                      }}
                    >
                      <span>100만원</span>
                      <span>1,000만원</span>
                      <span>2,000만원</span>
                    </div>
                  </div>

                  {/* 경과 년수 */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", whiteSpace: "nowrap", gap: "8px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                        반납 후 경과 년수
                      </label>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#34d399" }}>
                        {currentRefundYearsPassed}년 경과
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={35}
                      disabled={!currentHasReturnRefund}
                      value={currentRefundYearsPassed}
                      onChange={(e) => setCurrentRefundYearsPassed(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#10b981", display: "block" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary, #94a3b8)",
                        marginTop: "2px",
                      }}
                    >
                      <span>5년</span>
                      <span>20년</span>
                      <span>35년</span>
                    </div>
                  </div>

                  {/* 반납 납부 방식 선택 (일시납 또는 분할납부) */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "2px" }}>
                    <label style={{ fontSize: "0.82rem", color: "var(--text-primary, #ffffff)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      납부 방식
                    </label>
                    <select
                      disabled={!currentHasReturnRefund}
                      value={currentRefundPaymentMode === "LUMP" ? "LUMP" : `INST_${currentRefundInstallments}`}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "LUMP") {
                          setCurrentRefundPaymentMode("LUMP");
                        } else {
                          setCurrentRefundPaymentMode("INSTALLMENT");
                          const n = Number(v.replace("INST_", ""));
                          setCurrentRefundInstallments(n);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: "5px 8px",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        background: "var(--surface, #1f2937)",
                        color: "var(--text-primary, #ffffff)",
                        border: "1px solid var(--border, rgba(255, 255, 255, 0.2))",
                      }}
                    >
                      <option value="LUMP">일시납 (반납이자만 가산)</option>
                      <option value="INST_3">3회 분할납부</option>
                      <option value="INST_12">12회 분할납부 (실고지서 분납)</option>
                      <option value="INST_24">24회 분할납부</option>
                    </select>
                  </div>

                  {/* 공단 고지액 직접지정 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" }}>
                      공단 고지액 직접지정
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="number"
                        placeholder="미입력 시 자동계산"
                        value={currentRefundNoticeAmountWon || ""}
                        onChange={(e) => setCurrentRefundNoticeAmountWon(Number(e.target.value))}
                        style={{
                          width: "120px",
                          padding: "3px 6px",
                          fontSize: "0.76rem",
                          borderRadius: "4px",
                          border: "1px solid var(--border, rgba(255, 255, 255, 0.2))",
                          background: "var(--surface, #1f2937)",
                          color: "#ffffff",
                          textAlign: "right",
                        }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>원</span>
                    </div>
                  </div>

                  {/* 이자 및 분납 결과 요약 박스 */}
                  {returnRepayment && (
                    <div style={{ fontSize: "0.73rem", color: "#34d399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "7px 10px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div>
                        {currentRefundNoticeAmountWon > 0 ? "📋 공단 고지액 반영: " : "📋 공단 정기예금 복리이자 산출: "}
                        총 <strong>{Math.round(returnRepayment.totalCostWon / 10000).toLocaleString()}만원</strong>
                        {returnRepayment.installments > 1 && ` (월 약 ${Math.round(returnRepayment.monthlyInstallmentWon / 10000).toLocaleString()}만원 × ${returnRepayment.installments}회)`}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        반환원금 {Math.round(returnRepayment.principalCostWon / 10000).toLocaleString()}만 + 반납이자 {Math.round(returnRepayment.interestCostWon / 10000).toLocaleString()}만원
                      </div>
                    </div>
                  )}

                  {/* 배우자 탭 1994년 104.4만원 vs 1,318,312원 설명 안내문 */}
                  {isSpouseTab && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.2)", padding: "8px 10px", borderRadius: "6px", lineHeight: 1.45 }}>
                      ℹ️ <strong>1994년 104.4만원 vs 1,318,312원 차이 안내</strong><br />
                      1994년 납부하셨던 기여금 원금은 104.4만원이었으나, 공단에서 반환일시금을 지급할 당시 법정이자가 가산되어 실제 수령액이 <strong>1,318,312원</strong>이었습니다.
                      공단 반납 고지서의 원금은 이 1,318,312원이며, 여기에 1년 만기 정기예금 연복리 이자(2,100,618원)가 가산되어 총 3,418,930원(12회 분납)으로 고지된 것입니다.
                    </div>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background:
                    activeScenarioType === "BOTH"
                      ? "rgba(168, 85, 247, 0.12)"
                      : activeScenarioType === "ADDITIONAL_ONLY"
                      ? "rgba(99, 102, 241, 0.12)"
                      : activeScenarioType === "RETURN_ONLY"
                      ? "rgba(16, 185, 129, 0.12)"
                      : "rgba(148, 163, 184, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  선택 시나리오:{" "}
                  <strong
                    style={{
                      color:
                        activeScenarioType === "BOTH"
                          ? "#c084fc"
                          : activeScenarioType === "ADDITIONAL_ONLY"
                          ? "#818cf8"
                          : activeScenarioType === "RETURN_ONLY"
                          ? "#34d399"
                          : "#94a3b8",
                    }}
                  >
                    {displayTitle}
                  </strong>
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" }}>
                  {activeScenarioType === "NONE"
                    ? "상단 체크박스를 선택하여 시뮬레이션을 시작하세요"
                    : `총 투자 원금 ${Math.round(displayCostWon / 10000).toLocaleString()}만원 대비 평생 실익 분석`}
                </span>
              </div>

              {/* 4 Key KPI Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* 1. 납부 총비용 */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.02) 100%)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>총 투자(납부) 비용</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#818cf8", marginTop: "4px" }}>
                    {Math.round(displayCostWon / 10000).toLocaleString()}만원
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    {activeScenarioType === "BOTH"
                      ? `추납 ${Math.round(additionalPayment.totalCostWon / 10000)}만 + 반납 ${Math.round((returnRepayment?.totalCostWon || 0) / 10000)}만`
                      : activeScenarioType === "ADDITIONAL_ONLY"
                      ? additionalPayment.installments > 1
                        ? `월 ${Math.round(additionalPayment.monthlyInstallmentWon / 10000)}만 × ${additionalPayment.installments}회 (원금 ${Math.round(additionalPayment.principalCostWon / 10000)}만 + 이자)`
                        : `월 ${Math.round(additionalPayment.monthlyPremiumWon / 10000)}만원 × ${additionalPayment.months}개월 (일시납)`
                      : activeScenarioType === "RETURN_ONLY"
                      ? returnRepayment && returnRepayment.installments > 1
                        ? `월 ${Math.round(returnRepayment.monthlyInstallmentWon / 10000)}만 × ${returnRepayment.installments}회 (원금 ${Math.round(returnRepayment.principalCostWon / 10000)}만 + 반납이자)`
                        : `원금 ${Math.round((returnRepayment?.principalCostWon || currentRefundPrincipalWon) / 10000)}만 + 반납이자 ${Math.round((returnRepayment?.interestCostWon || 0) / 10000)}만`
                      : "선택된 납부 옵션 없음"}
                  </div>
                </div>

                {/* 2. 평생 월 수령 증가액 */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>평생 월 수령 증가액</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#34d399", marginTop: "4px" }}>
                    +{(displayMonthlyIncreaseWon / 10000).toFixed(1)}만원/월
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    연간 +{Math.round((displayMonthlyIncreaseWon * 12) / 10000).toLocaleString()}만원 평생 증액
                  </div>
                </div>

                {/* 3. 원금 회수 나이 (골든크로스) */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>원금 회수 나이 (골든크로스)</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fbbf24", marginTop: "4px" }}>
                    {displayBreakEvenAge > 0 ? `${displayBreakEvenAge}세` : "-"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    {displayBreakEvenYears > 0 ? `개시 후 ${displayBreakEvenYears}년 만에 완벽 원금 회수` : "수급 옵션 미적용"}
                  </div>
                </div>

                {/* 4. 기대수명 순수익 & 회수배수 */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.02) 100%)",
                    border: "1px solid rgba(236, 72, 153, 0.25)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    기대수명({activeLifeExpectancy}세) 순수익
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f472b6", marginTop: "4px" }}>
                    {displayNetProfitWon >= 0 ? "+" : ""}{(displayNetProfitWon / 10000).toLocaleString()}만원
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    순수익률 {displayRoiPercent >= 0 ? "+" : ""}{displayRoiPercent}% (실효 IRR 연 {displayIrr}%)
                  </div>
                </div>
              </div>

              {/* Payback Milestones Timeline Progress Bar */}
              <div
                style={{
                  background: "var(--surface-2, rgba(255, 255, 255, 0.03))",
                  border: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                    ⏳ 납부 원금 회수 마일스톤 (누적 수령액 달성 시점)
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" }}>
                    증액 후 총 예상 월 연금액:{" "}
                    <strong style={{ color: "#34d399" }}>
                      {Math.round(paybackMilestones.monthlyPensionWonAfterRecovery / 10000).toLocaleString()}만원/월
                    </strong>
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 6px",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>50% 반액 회수</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#818cf8", marginTop: "2px" }}>
                      {paybackMilestones.halfPaybackAge > 0 ? `${paybackMilestones.halfPaybackAge}세` : "-"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                      {displayBreakEvenYears > 0 ? `개시 후 약 ${(paybackMilestones.halfPaybackAge - activeNpsStartAge).toFixed(1)}년` : "-"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      borderRadius: "8px",
                      padding: "10px 6px",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#fbbf24", fontWeight: 600 }}>100% 원금 전액 회수</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#f59e0b", marginTop: "2px" }}>
                      {paybackMilestones.breakEvenAge > 0 ? `${paybackMilestones.breakEvenAge}세 🌟` : "-"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#d97706" }}>골든크로스 달성</div>
                  </div>

                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 6px",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>200% 더블 달성</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#34d399", marginTop: "2px" }}>
                      {paybackMilestones.doubleReturnAge > 0 ? `${paybackMilestones.doubleReturnAge}세` : "-"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>순이익 = 원금의 100%</div>
                  </div>

                  <div
                    style={{
                      background: "rgba(236, 72, 153, 0.08)",
                      border: "1px solid rgba(236, 72, 153, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 6px",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>300% 트리플 달성</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f472b6", marginTop: "2px" }}>
                      {paybackMilestones.tripleReturnAge > 0 ? `${paybackMilestones.tripleReturnAge}세` : "-"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>원금의 3배 누적 수령</div>
                  </div>
                </div>
              </div>

              {/* Golden Crossover Chart */}
              <div
                style={{
                  background: "var(--surface-2, rgba(255, 255, 255, 0.02))",
                  border: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>
                    📈 {isSpouseTab ? "배우자" : "본인"} 나이별 실질 순누적 수령액 비교 곡선 (원금 차감 후 순이익)
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>단위: 만원</span>
                </div>
                <div style={{ height: "260px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="age"
                        stroke="#94a3b8"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickFormatter={(v) => `${v}세`}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        formatter={(val: any) => [`${Math.round(Number(val)).toLocaleString()}만원`, ""]}
                        labelFormatter={(label) => `${label}세`}
                      />
                      <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "6px" }} />
                      {displayBreakEvenAge > 0 && displayBreakEvenAge > activeNpsStartAge && (
                        <ReferenceLine
                          x={Math.round(displayBreakEvenAge)}
                          stroke="#fbbf24"
                          strokeDasharray="4 4"
                          label={{ value: `골든크로스 ${displayBreakEvenAge}세`, fill: "#fbbf24", fontSize: 11 }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="withoutRecovery"
                        name="현재 유지 (미적용)"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={false}
                      />
                      {currentHasAdditionalPayment && (
                        <Line
                          type="monotone"
                          dataKey="withAdditionalPayment"
                          name="추납 진행 (순이익)"
                          stroke={isSpouseTab ? "#ec4899" : "#6366f1"}
                          strokeWidth={3}
                          dot={false}
                        />
                      )}
                      {currentHasReturnRefund && (
                        <Line
                          type="monotone"
                          dataKey="withReturnRepayment"
                          name="과거 반납 복원 (초고수익)"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      )}
                      {currentHasAdditionalPayment && currentHasReturnRefund && (
                        <Line
                          type="monotone"
                          dataKey="withCombined"
                          name="추납+반납 동시 진행 (최대수혜)"
                          stroke="#a855f7"
                          strokeWidth={3}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Age Distribution Table & Advice */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* Expected Age Distribution Matrix */}
                <div
                  style={{
                    background: "var(--surface, #1e293b)",
                    border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                    📊 기대수명 구간별 납부금액 대비 수령 분포
                  </h4>
                  <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
                          textAlign: "left",
                          color: "var(--text-secondary, #94a3b8)",
                        }}
                      >
                        <th style={{ padding: "8px 4px" }}>목표 연령</th>
                        <th style={{ padding: "8px 4px", textAlign: "right" }}>누적 추가수령</th>
                        <th style={{ padding: "8px 4px", textAlign: "right" }}>원금 차감 순이익</th>
                        <th style={{ padding: "8px 4px", textAlign: "right" }}>원금 회수율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributionByAge.map((item, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.06))",
                          }}
                        >
                          <td style={{ padding: "8px 4px", color: "var(--text-primary, #ffffff)" }}>
                            {item.label}
                          </td>
                          <td style={{ padding: "8px 4px", textAlign: "right", color: "#818cf8", fontWeight: 600 }}>
                            {Math.round(item.cumulativeReceivedWon / 10000).toLocaleString()}만원
                          </td>
                          <td
                            style={{
                              padding: "8px 4px",
                              textAlign: "right",
                              color: item.netProfitWon >= 0 ? "#34d399" : "#f87171",
                              fontWeight: 700,
                            }}
                          >
                            {item.netProfitWon >= 0 ? "+" : ""}
                            {Math.round(item.netProfitWon / 10000).toLocaleString()}만원
                          </td>
                          <td
                            style={{
                              padding: "8px 4px",
                              textAlign: "right",
                              color: item.recoveryRatioPercent >= 100 ? "#fbbf24" : "#94a3b8",
                              fontWeight: 700,
                            }}
                          >
                            {item.recoveryRatioPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ margin: "8px 0 0 0", fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)" }}>
                    * 수령 도중 조기 사망하더라도 배우자 또는 유족에게 60% 유족연금이 종신 승계되므로 가구 손실이 방어됩니다.
                  </p>
                </div>

                {/* Action Checklist & Strategy Note */}
                <div
                  style={{
                    background: "var(--modal-subbox-bg, var(--surface-2, rgba(255, 255, 255, 0.03)))",
                    border: "1px solid var(--modal-subbox-border, var(--border, rgba(255, 255, 255, 0.08)))",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: isSpouseTab ? "#f472b6" : "var(--text-accent, #818cf8)",
                    }}
                  >
                    💡 {isSpouseTab ? "배우자 맞춤 가이드 & 전략 소견" : "본인 공단 실행 가이드 & 전략 소견"}
                  </h4>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "0.8rem",
                      color: "var(--text-primary, #ffffff)",
                      lineHeight: 1.5,
                    }}
                  >
                    {recommendation.primaryAdvice}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {recommendation.actionChecklist.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "6px",
                          fontSize: "0.75rem",
                          color: "var(--text-secondary, #94a3b8)",
                        }}
                      >
                        <span style={{ color: isSpouseTab ? "#ec4899" : "#6366f1", fontWeight: 700 }}>✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                    {isSpouseTab && (
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          fontSize: "0.75rem",
                          color: "#fbbf24",
                          marginTop: "4px",
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>★</span>
                        <span>
                          전업주부 경력단절 배우자는 임의가입 후 과거 경단 기간 추납 시 10년 수급 자격(월 약 40~60만원 종신 연금)을 바로 완성할 수 있습니다.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: 부부 합산 시너지 뷰 */}
          {isCoupleTab && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Couple 4 Options Selection Control Panel */}
              <div
                style={{
                  background: "var(--surface-2, rgba(255, 255, 255, 0.04))",
                  border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                      ⚙️ 부부 가구 추납·반납 적용 옵션 선택기
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
                      본인과 배우자 각각의 추납 및 반납을 자유롭게 켜고 끄며 가구 최적의 수령 조합을 비교하세요.
                    </p>
                  </div>
                  {/* Preset Quick Buttons */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfHasAdditionalPayment(true);
                        setSelfHasReturnRefund(true);
                        setSpouseHasAdditionalPayment(true);
                        setSpouseHasReturnRefund(true);
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      모두 적용 (기본)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfHasAdditionalPayment(true);
                        setSelfHasReturnRefund(false);
                        setSpouseHasAdditionalPayment(true);
                        setSpouseHasReturnRefund(false);
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#818cf8",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      추납만 모두 적용
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfHasAdditionalPayment(false);
                        setSelfHasReturnRefund(true);
                        setSpouseHasAdditionalPayment(false);
                        setSpouseHasReturnRefund(true);
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#10b981",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      반납만 모두 적용
                    </button>
                  </div>
                </div>

                {/* 4 Interactive Toggle Checkboxes in 2 Columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Column 1: 본인 옵션 */}
                  <div
                    style={{
                      background: "rgba(99, 102, 241, 0.05)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      borderRadius: "10px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#818cf8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>👤</span> 본인 옵션 ({selfAge}세)
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", flexWrap: "wrap" }}>
                      <input
                        type="checkbox"
                        checked={selfHasAdditionalPayment}
                        onChange={(e) => setSelfHasAdditionalPayment(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#6366f1" }}
                      />
                      <span style={{ fontWeight: 600 }}>본인 추납 적용</span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          background: hasRealSelfAdditional ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                          border: hasRealSelfAdditional ? "1px solid #10b981" : "1px solid rgba(148, 163, 184, 0.35)",
                          color: hasRealSelfAdditional ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {hasRealSelfAdditional ? "추납(실데이터) 적용" : "추납(예시)"}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        ({selfAdditionalMonths}개월 / 월 {Math.round((selfBaseIncomeWon * 0.09) / 10000)}만원)
                      </span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", flexWrap: "wrap" }}>
                      <input
                        type="checkbox"
                        checked={selfHasReturnRefund}
                        onChange={(e) => setSelfHasReturnRefund(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#10b981" }}
                      />
                      <span style={{ fontWeight: 600 }}>본인 반납 적용</span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          background: hasRealSelfReturn ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                          border: hasRealSelfReturn ? "1px solid #10b981" : "1px solid rgba(148, 163, 184, 0.35)",
                          color: hasRealSelfReturn ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {hasRealSelfReturn ? "반납(실데이터) 적용" : "반납(예시)"}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        (원금 {Math.round(selfRefundPrincipalWon / 10000)}만원 / {selfRefundYearPeriod === "PRE_1998" ? "70%" : "60%"} 복원)
                      </span>
                    </label>
                  </div>

                  {/* Column 2: 배우자 옵션 */}
                  <div
                    style={{
                      background: "rgba(236, 72, 153, 0.05)",
                      border: "1px solid rgba(236, 72, 153, 0.2)",
                      borderRadius: "10px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f472b6", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>👥</span> 배우자 옵션 ({spouseAge}세)
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", flexWrap: "wrap" }}>
                      <input
                        type="checkbox"
                        checked={spouseHasAdditionalPayment}
                        onChange={(e) => setSpouseHasAdditionalPayment(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#ec4899" }}
                      />
                      <span style={{ fontWeight: 600 }}>배우자 추납 적용</span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          background: hasRealSpouseAdditional ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                          border: hasRealSpouseAdditional ? "1px solid #10b981" : "1px solid rgba(148, 163, 184, 0.35)",
                          color: hasRealSpouseAdditional ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {hasRealSpouseAdditional ? "추납(실데이터) 적용" : "추납(예시)"}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        ({spouseAdditionalMonths}개월 / 월 {Math.round((spouseBaseIncomeWon * 0.09) / 10000)}만원)
                      </span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", flexWrap: "wrap" }}>
                      <input
                        type="checkbox"
                        checked={spouseHasReturnRefund}
                        onChange={(e) => setSpouseHasReturnRefund(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#10b981" }}
                      />
                      <span style={{ fontWeight: 600 }}>배우자 반납 적용</span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          background: hasRealSpouseReturn ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                          border: hasRealSpouseReturn ? "1px solid #10b981" : "1px solid rgba(148, 163, 184, 0.35)",
                          color: hasRealSpouseReturn ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {hasRealSpouseReturn ? "반납(실데이터) 적용" : "반납(예시)"}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        (원금 {Math.round(spouseRefundPrincipalWon / 10000)}만원 / {spouseRefundYearPeriod === "PRE_1998" ? "70%" : "60%"} 복원)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Couple Header Summary Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.02) 100%)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>부부 합산 총 납부비용</div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#818cf8", marginTop: "4px" }}>
                    {Math.round(coupleResult.couple.totalCostWon / 10000).toLocaleString()}만원
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    선택된 옵션 기준 총 투자액
                  </div>
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.02) 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>부부 합산 평생 월 증액</div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#34d399", marginTop: "4px" }}>
                    +{(coupleResult.couple.monthlyIncreaseWon / 10000).toFixed(1)}만원/월
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    가구 연간 +{Math.round(coupleResult.couple.annualIncreaseWon / 10000).toLocaleString()}만원 평생 증액
                  </div>
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.02) 100%)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>부부 가구 손익분기 (골든크로스)</div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fbbf24", marginTop: "4px" }}>
                    {coupleResult.couple.breakEvenYearsAvg > 0 ? `개시 후 ${coupleResult.couple.breakEvenYearsAvg}년` : "-"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    가구 납부 원금 100% 회수 시점
                  </div>
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.02) 100%)",
                    border: "1px solid rgba(236, 72, 153, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>가구 생애 총 순이익</div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f472b6", marginTop: "4px" }}>
                    {coupleResult.couple.netProfitWon >= 0 ? "+" : ""}{(coupleResult.couple.netProfitWon / 10000).toLocaleString()}만원
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    가구 합산 투자 수익률 {coupleResult.couple.roiPercent >= 0 ? "+" : ""}{coupleResult.couple.roiPercent}%
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison: Self vs Spouse */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* 본인 요약 카드 */}
                <div
                  style={{
                    background: "var(--surface, #1e293b)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#818cf8" }}>
                      👤 본인 추납·반납 실익
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {selfHasAdditionalPayment && selfHasReturnRefund
                        ? "추납+반납 둘 다 적용"
                        : selfHasAdditionalPayment
                        ? "추납만 적용"
                        : selfHasReturnRefund
                        ? "반납만 적용"
                        : "미적용"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>납부 총비용</span>
                      <span style={{ fontWeight: 600, color: "#818cf8" }}>
                        {Math.round(
                          (coupleResult.self.activeScenarioType === "BOTH" && coupleResult.self.combinedScenario
                            ? coupleResult.self.combinedScenario.totalCostWon
                            : coupleResult.self.activeScenarioType === "ADDITIONAL_ONLY"
                            ? coupleResult.self.additionalPayment.totalCostWon
                            : coupleResult.self.returnRepayment
                            ? coupleResult.self.returnRepayment.totalCostWon
                            : 0) / 10000
                        ).toLocaleString()}
                        만원
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>월 연금 증액</span>
                      <span style={{ fontWeight: 700, color: "#34d399" }}>
                        +{
                          (
                            (coupleResult.self.activeScenarioType === "BOTH" && coupleResult.self.combinedScenario
                              ? coupleResult.self.combinedScenario.monthlyIncreaseWon
                              : coupleResult.self.activeScenarioType === "ADDITIONAL_ONLY"
                              ? coupleResult.self.additionalPayment.monthlyIncreaseWon
                              : coupleResult.self.returnRepayment
                              ? coupleResult.self.returnRepayment.monthlyIncreaseWon
                              : 0) / 10000
                          ).toFixed(1)
                        }
                        만원/월
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>원금 회수 나이</span>
                      <span style={{ fontWeight: 700, color: "#fbbf24" }}>
                        {coupleResult.self.paybackMilestones.breakEvenAge > 0
                          ? `${coupleResult.self.paybackMilestones.breakEvenAge}세`
                          : "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>기대수명 순수익</span>
                      <span style={{ fontWeight: 700, color: "#f472b6" }}>
                        +{
                          Math.round(
                            (coupleResult.self.activeScenarioType === "BOTH" && coupleResult.self.combinedScenario
                              ? coupleResult.self.combinedScenario.netProfitWon
                              : coupleResult.self.activeScenarioType === "ADDITIONAL_ONLY"
                              ? coupleResult.self.additionalPayment.netProfitWon
                              : coupleResult.self.returnRepayment
                              ? coupleResult.self.returnRepayment.netProfitWon
                              : 0) / 10000
                          ).toLocaleString()
                        }
                        만원
                      </span>
                    </div>
                  </div>
                </div>

                {/* 배우자 요약 카드 */}
                <div
                  style={{
                    background: "var(--surface, #1e293b)",
                    border: "1px solid rgba(236, 72, 153, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#f472b6" }}>
                      👥 배우자 추납·반납 실익
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {spouseHasAdditionalPayment && spouseHasReturnRefund
                        ? "추납+반납 둘 다 적용"
                        : spouseHasAdditionalPayment
                        ? "추납만 적용"
                        : spouseHasReturnRefund
                        ? "반납만 적용"
                        : "미적용"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>납부 총비용</span>
                      <span style={{ fontWeight: 600, color: "#f472b6" }}>
                        {Math.round(
                          (coupleResult.spouse.activeScenarioType === "BOTH" && coupleResult.spouse.combinedScenario
                            ? coupleResult.spouse.combinedScenario.totalCostWon
                            : coupleResult.spouse.activeScenarioType === "ADDITIONAL_ONLY"
                            ? coupleResult.spouse.additionalPayment.totalCostWon
                            : coupleResult.spouse.returnRepayment
                            ? coupleResult.spouse.returnRepayment.totalCostWon
                            : 0) / 10000
                        ).toLocaleString()}
                        만원
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>월 연금 증액</span>
                      <span style={{ fontWeight: 700, color: "#34d399" }}>
                        +{
                          (
                            (coupleResult.spouse.activeScenarioType === "BOTH" && coupleResult.spouse.combinedScenario
                              ? coupleResult.spouse.combinedScenario.monthlyIncreaseWon
                              : coupleResult.spouse.activeScenarioType === "ADDITIONAL_ONLY"
                              ? coupleResult.spouse.additionalPayment.monthlyIncreaseWon
                              : coupleResult.spouse.returnRepayment
                              ? coupleResult.spouse.returnRepayment.monthlyIncreaseWon
                              : 0) / 10000
                          ).toFixed(1)
                        }
                        만원/월
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>원금 회수 나이</span>
                      <span style={{ fontWeight: 700, color: "#fbbf24" }}>
                        {coupleResult.spouse.paybackMilestones.breakEvenAge > 0
                          ? `${coupleResult.spouse.paybackMilestones.breakEvenAge}세`
                          : "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94a3b8" }}>기대수명 순수익</span>
                      <span style={{ fontWeight: 700, color: "#f472b6" }}>
                        +{
                          Math.round(
                            (coupleResult.spouse.activeScenarioType === "BOTH" && coupleResult.spouse.combinedScenario
                              ? coupleResult.spouse.combinedScenario.netProfitWon
                              : coupleResult.spouse.activeScenarioType === "ADDITIONAL_ONLY"
                              ? coupleResult.spouse.additionalPayment.netProfitWon
                              : coupleResult.spouse.returnRepayment
                              ? coupleResult.spouse.returnRepayment.netProfitWon
                              : 0) / 10000
                          ).toLocaleString()
                        }
                        만원
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Couple Health Insurance & Tax Synergy Banner */}
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#34d399" }}>
                  🛡️ 부부 명의 분산 및 건강보험료 피부양자(연 2,000만원) 안전지대 진단
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.5 }}>
                  한 사람에게 연금을 과도하게 집중시키면 연 2,000만원(월 166.7만원) 초과 시 건강보험 피부양자 자격이 박탈되어 매월 15~30만원의 건보료가 새로 부과될 수 있습니다.
                  본인과 배우자가 각각 추납과 반납을 분산 실행하여 <strong>부부 각각 월 100~150만원대(연 2,000만원 이하)의 평생 종신 연금</strong>을 형성하면 피부양자 탈락을 방어하면서 가구 합산 월 {Math.round(coupleResult.couple.combinedMonthlyPensionWon / 10000).toLocaleString()}만원의 최고 효율 비과세/절세 연금 수령이 완성됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--modal-header-bg, var(--surface, #111827))",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
            * 본 역산기는 2026 연금개혁 산식 및 공단 표준 재평가율을 반영한 정밀 추정치입니다.
          </span>
          <button
            onClick={onClose}
            className="premium-button"
            style={{
              padding: "8px 22px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
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
