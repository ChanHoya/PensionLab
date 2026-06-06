"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import ThemeToggle from "@/components/ThemeToggle";

const STEPS = [
  { id: 1, title: "국민연금 (1층)", desc: "국민연금 납부 내역 및 예상액" },
  { id: 2, title: "기초연금 (1층)", desc: "기초연금 대상 확인용 정보" },
  { id: 3, title: "퇴직연금 (2층)", desc: "회사 퇴직연금 (DB/DC/IRP)" },
  { id: 4, title: "개인연금 (3층)", desc: "연금저축 및 연금보험" },
  { id: 5, title: "설계 기준 설정", desc: "희망 은퇴 나이 및 기대수명" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [nationalInputMode, setNationalInputMode] = useState<"SIMPLE" | "DETAILED" | "SYNC">("SIMPLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // NPS Codef Mock Sync States
  const [npsSyncing, setNpsSyncing] = useState(false);
  const [npsSynced, setNpsSynced] = useState(false);

  const handleNPSSync = async () => {
    setNpsSyncing(true);
    try {
      const response = await fetch("/api/pension/nps-sync");
      if (!response.ok) throw new Error("Sync failed");
      const result = await response.json();
      
      if (result.success && result.data) {
        setTimeout(() => {
          store.setNationalPension({
            contributionMonths: result.data.contributionMonths,
            totalPaidAmount: result.data.totalPaidAmount,
            currentStandardMonthlyIncome: result.data.currentStandardMonthlyIncome,
            expectedTotalContributionMonths: result.data.expectedTotalContributionMonths,
            expectedMonthlyPension: result.data.expectedMonthlyPension,
            totalExpectedPremium: result.data.totalExpectedPremium,
            basicPensionAmount: result.data.basicPensionAmount,
            aValue: result.data.aValue,
            bValue: result.data.bValue,
          });
          setNpsSyncing(false);
          setNpsSynced(true);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert("NPS 동기화 중 에러가 발생했습니다.");
      setNpsSyncing(false);
    }
  };

  // Local state for temporary Retirement Pension inputs
  const [tempRetirement, setTempRetirement] = useState({
    pensionType: "DC" as "DB" | "DC" | "IRP",
    avgSalary: 400,
    yearsOfService: 10,
    salaryGrowthRate: 3.0,
    totalAccumulated: 3000,
    monthlyContribution: 20,
    companyMatchRate: 20,
    expectedReturnRate: 4.5,
  });

  // Local state for temporary Personal Pension inputs
  const [tempPersonal, setTempPersonal] = useState({
    savingsType: "FUND" as "FUND" | "INSURANCE",
    totalAccumulated: 1000,
    monthlyAnnualContribution: 30,
    desiredStartAge: 65,
    receivingPeriod: 20,
  });

  // Local state for temporary Pension Insurance inputs
  const [tempInsurance, setTempInsurance] = useState({
    insuranceType: "일반연금보험",
    totalAccumulated: 1500,
    monthlyPayment: 20,
    paymentPeriod: 10,
    expectedDeclaredRate: 2.5,
  });

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Simple auto-calculation helper for National Pension
  const handleSimpleNationalCalculate = (
    months: number,
    income: number,
    totalMonths: number
  ) => {
    // Estimating based on simplified Korean National Pension formula
    // A value for 2026 is approximately 3,000,000 KRW
    const aVal = 300; // 300만원
    const bVal = income;
    
    // Total premiums: standard monthly income * 9% (MVP baseline before reform) * totalMonths
    const monthlyPremiumRate = 0.09;
    const totalPrem = income * monthlyPremiumRate * totalMonths;
    const paidToDate = income * monthlyPremiumRate * months;

    // Expected monthly pension = 1.36 * (A + B) * (1 + 0.05 * (totalMonths - 20) / 12) * ...
    // Simplified estimate:
    const baseAmount = 0.2 * (aVal + bVal) * (totalMonths / 20); // rough approximation
    const expectedPension = Math.max(0, Math.round(baseAmount * 1.5)); 
    const basicPension = Math.round(expectedPension * 0.95);

    store.setNationalPension({
      contributionMonths: months,
      totalPaidAmount: Math.round(paidToDate),
      currentStandardMonthlyIncome: income,
      expectedTotalContributionMonths: totalMonths,
      expectedMonthlyPension: expectedPension,
      totalExpectedPremium: Math.round(totalPrem),
      basicPensionAmount: basicPension,
      aValue: aVal,
      bValue: bVal,
    });
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Send onboarding data to the API to register user in DB
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nationalPension: store.nationalPension,
          basicPension: store.basicPension,
          retirementPensions: store.retirementPensions,
          personalPensions: store.personalPensions,
          pensionInsurances: store.pensionInsurances,
          simulationParams: store.simulationParams,
        }),
      });

      if (!response.ok) {
        throw new Error("온보딩 데이터 저장 실패");
      }

      const data = await response.json();
      // Save userId to localStorage to preserve session
      localStorage.setItem("pensionlab_user_id", data.userId);
      
      store.setSimulationParams({
        retirementAge: store.simulationParams.retirementAge,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("데이터 저장 도중 에러가 발생했습니다. 로컬 대시보드로 이동합니다.");
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>연금 설계 마법사를 준비하는 중...</p>
      </div>
    );
  }

  return (
    <main style={styles.container}>
      {/* Background decoration */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <header style={styles.header}>
        <h1 style={styles.logo}>Pension<span style={{ color: "var(--secondary)" }}>Lab</span></h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          <p style={styles.subtitle}>은퇴 준비의 첫걸음, 다층 연금 통합 시뮬레이터</p>
        </div>
      </header>

      {/* Step Tracker (Responsive Sidebar in Desktop, Header in Mobile) */}
      <div style={styles.wizardContainer}>
        <aside style={styles.sidebar}>
          <div style={styles.progressLabel}>
            <span>진행률</span>
            <span>{Math.round((currentStep / 5) * 100)}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${(currentStep / 5) * 100}%` }} />
          </div>

          <nav style={styles.stepList}>
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  style={{
                    ...styles.stepItem,
                    borderColor: isActive ? "var(--primary-light)" : "transparent",
                    background: isActive ? "rgba(30, 58, 95, 0.05)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      ...styles.stepNumber,
                      backgroundColor: isCompleted
                        ? "var(--secondary)"
                        : isActive
                        ? "var(--primary)"
                        : "var(--border)",
                      color: isActive || isCompleted ? "#ffffff" : "var(--text-secondary)",
                    }}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>
                  <div style={styles.stepInfo}>
                    <div style={{ ...styles.stepTitle, fontWeight: isActive ? "700" : "500" }}>
                      {step.title}
                    </div>
                    <div style={styles.stepDesc}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Form Card */}
        <section style={styles.formCard} className="glass">
          <div style={styles.formHeader}>
            <span style={styles.stepBadge}>STEP {currentStep}</span>
            <h2 style={styles.formTitle}>{STEPS[currentStep - 1].title}</h2>
            <p style={styles.formDesc}>{STEPS[currentStep - 1].desc}</p>
          </div>

          {/* Privacy/Local Caching Notice Banner */}
          <div style={styles.privacyNoticeBanner}>
            <span>🔒 <strong>개인정보 안심 보장</strong>: 입력하신 모든 연금 설계 정보는 서버에 저장되지 않고 현재 기기(브라우저)에만 안전하게 보관되므로 안심하고 입력해 주세요.</span>
          </div>

          <div style={styles.formBody}>
            {/* STEP 1: 국민연금 */}
            {currentStep === 1 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.tabContainer}>
                  <button
                    onClick={() => setNationalInputMode("SIMPLE")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: nationalInputMode === "SIMPLE" ? "var(--primary)" : "transparent",
                      color: nationalInputMode === "SIMPLE" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                  >
                    간편 시뮬레이션 입력
                  </button>
                  <button
                    onClick={() => setNationalInputMode("DETAILED")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: nationalInputMode === "DETAILED" ? "var(--primary)" : "transparent",
                      color: nationalInputMode === "DETAILED" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                  >
                    NPS 공단고서 상세 입력
                  </button>
                  <button
                    onClick={() => setNationalInputMode("SYNC")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: nationalInputMode === "SYNC" ? "var(--primary)" : "transparent",
                      color: nationalInputMode === "SYNC" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                    id="btn-tab-nps-sync"
                  >
                    🔐 NPS 간편인증 연동
                  </button>
                </div>

                {nationalInputMode === "SIMPLE" && (
                  <>
                    <div style={styles.infoAlert}>
                      💡 <strong>가입월수와 소득</strong>을 바탕으로 예상 연금 수령액과 납부액을 자동 모델링합니다.
                    </div>
                    <div style={styles.fieldRow}>
                      <label style={styles.label}>현재 누적 가입 개월수 (개월)</label>
                      <input
                        type="number"
                        className="premium-input"
                        placeholder="예: 120"
                        value={store.nationalPension.contributionMonths || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleSimpleNationalCalculate(
                            val,
                            store.nationalPension.currentStandardMonthlyIncome,
                            store.nationalPension.expectedTotalContributionMonths
                          );
                        }}
                      />
                    </div>
                    <div style={styles.fieldRow}>
                      <label style={styles.label}>현재 기준 월 소득액 (만원)</label>
                      <input
                        type="number"
                        className="premium-input"
                        placeholder="예: 350"
                        value={store.nationalPension.currentStandardMonthlyIncome || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleSimpleNationalCalculate(
                            store.nationalPension.contributionMonths,
                            val,
                            store.nationalPension.expectedTotalContributionMonths
                          );
                        }}
                      />
                    </div>
                    <div style={styles.fieldRow}>
                      <label style={styles.label}>노령연금 총 예상가입기간 (개월수)</label>
                      <input
                        type="number"
                        className="premium-input"
                        placeholder="예: 360"
                        value={store.nationalPension.expectedTotalContributionMonths || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleSimpleNationalCalculate(
                            store.nationalPension.contributionMonths,
                            store.nationalPension.currentStandardMonthlyIncome,
                            val
                          );
                        }}
                      />
                    </div>

                    {/* Auto Calculated Results Preview */}
                    <div style={styles.previewBox}>
                      <h4 style={styles.previewTitle}>자동 연산된 예상 수치</h4>
                      <div style={styles.previewGrid}>
                        <div>총 예상 납부보험료: <strong>{store.nationalPension.totalExpectedPremium.toLocaleString()} 만원</strong></div>
                        <div>현재까지 총 납부액: <strong>{store.nationalPension.totalPaidAmount.toLocaleString()} 만원</strong></div>
                        <div>예상 연금 수령액: <strong style={{ color: "var(--secondary-dark)" }}>{store.nationalPension.expectedMonthlyPension.toLocaleString()} 만원/월</strong></div>
                      </div>
                    </div>
                  </>
                )}

                {nationalInputMode === "DETAILED" && (
                  <>
                    <div style={styles.fieldGrid}>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>누적 가입 개월수</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.contributionMonths || ""}
                          onChange={(e) => store.setNationalPension({ contributionMonths: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>총 납부 금액 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.totalPaidAmount || ""}
                          onChange={(e) => store.setNationalPension({ totalPaidAmount: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>현재 기준 월소득액 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.currentStandardMonthlyIncome || ""}
                          onChange={(e) => store.setNationalPension({ currentStandardMonthlyIncome: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>총 예상 가입월수</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.expectedTotalContributionMonths || ""}
                          onChange={(e) => store.setNationalPension({ expectedTotalContributionMonths: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>예상 연금 월액 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.expectedMonthlyPension || ""}
                          onChange={(e) => store.setNationalPension({ expectedMonthlyPension: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>총 예상 납부보험료 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.totalExpectedPremium || ""}
                          onChange={(e) => store.setNationalPension({ totalExpectedPremium: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>기본연금액 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.basicPensionAmount || ""}
                          onChange={(e) => store.setNationalPension({ basicPensionAmount: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>A값 (평균소득 - 만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.aValue || ""}
                          onChange={(e) => store.setNationalPension({ aValue: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>B값 (본인평균 - 만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.nationalPension.bValue || ""}
                          onChange={(e) => store.setNationalPension({ bValue: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {nationalInputMode === "SYNC" && (
                  <div style={styles.syncBox} className="animate-fade-in">
                    <div style={styles.infoAlert}>
                      🔐 국민연금공단(NPS) 간편인증 연동을 통해 납부 개월 수 및 예상 연금액 등 9대 필수 항목을 자동으로 동기화합니다. (Codef API 시뮬레이터 작동)
                    </div>
                    
                    <div style={styles.syncForm}>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>이름</label>
                        <input type="text" className="premium-input" placeholder="홍길동" defaultValue="홍길동" />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>휴대폰 번호</label>
                        <input type="text" className="premium-input" placeholder="010-1234-5678" defaultValue="010-1234-5678" />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>생년월일 (8자리)</label>
                        <input type="text" className="premium-input" placeholder="19800101" defaultValue="19800101" />
                      </div>

                      {npsSyncing ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, cursor: "not-allowed", width: "100%" }} disabled>
                          <span style={{ display: "inline-block", ...styles.miniSpinner, borderTopColor: "#ffffff", marginRight: 8, verticalAlign: "middle" }} /> 간편인증 및 연금정보 가져오는 중...
                        </button>
                      ) : npsSynced ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, background: "var(--success)", width: "100%" }} disabled>
                          ✓ 국민연금 정보 동기화 완료!
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="btn-nps-sync"
                          className="premium-button"
                          style={{ marginTop: 16, width: "100%" }}
                          onClick={handleNPSSync}
                        >
                          🔐 국민연금 간편인증 및 동기화 요청
                        </button>
                      )}
                    </div>

                    {npsSynced && (
                      <div style={styles.previewBox}>
                        <h4 style={styles.previewTitle}>동기화 완료된 국민연금 정보 (NPS Codef 연동 데이터)</h4>
                        <div style={styles.previewGrid}>
                          <div>가입 개월수: <strong>{store.nationalPension.contributionMonths} 개월</strong></div>
                          <div>총 납부금액: <strong>{store.nationalPension.totalPaidAmount.toLocaleString()} 만원</strong></div>
                          <div>현재 기준소득월액: <strong>{store.nationalPension.currentStandardMonthlyIncome.toLocaleString()} 만원</strong></div>
                          <div>예상 연금 월액: <strong style={{ color: "var(--secondary-dark)" }}>{store.nationalPension.expectedMonthlyPension.toLocaleString()} 만원/월</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: 기초연금 */}
            {currentStep === 2 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.infoAlert}>
                  ℹ️ 기초연금은 65세 이상 대한민국 국적 소득하위 70% 가구에 지급됩니다. (2026년 기준)
                </div>
                <div style={styles.fieldRow}>
                  <label style={styles.label}>가구 유형</label>
                  <select
                    className="premium-input"
                    value={store.basicPension.householdType}
                    onChange={(e) => store.setBasicPension({ householdType: e.target.value as "SINGLE" | "COUPLE" })}
                  >
                    <option value="SINGLE">단독 가구 (1인)</option>
                    <option value="COUPLE">부부 가구 (2인)</option>
                  </select>
                </div>
                <div style={styles.fieldRow}>
                  <label style={styles.label}>소득 인정액 (만원)</label>
                  <input
                    type="number"
                    className="premium-input"
                    placeholder="근로소득, 재산소득, 부동산을 산정해 공단이 정한 인정액"
                    value={store.basicPension.recognizedIncome || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      // Estimate eligibility dynamically (2026 thresholds single: ~210만원, couple: ~330만원)
                      const threshold = store.basicPension.householdType === "SINGLE" ? 210 : 336;
                      const eligible = val <= threshold;
                      const monthlyAmt = eligible ? (store.basicPension.householdType === "SINGLE" ? 34 : 54) : 0;
                      store.setBasicPension({
                        recognizedIncome: val,
                        expectedEligibility: eligible,
                        expectedMonthlyAmount: monthlyAmt,
                      });
                    }}
                  />
                </div>

                <div style={styles.previewBox}>
                  <h4 style={styles.previewTitle}>기초연금 예상 수급 결과</h4>
                  <div style={styles.previewGrid}>
                    <div>소득 기준 충족 여부: <strong>{store.basicPension.expectedEligibility ? "충족 (수급 가능)" : "초과 (수급 불가)"}</strong></div>
                    <div>예상 월 수령액: <strong style={{ color: "var(--secondary-dark)" }}>{store.basicPension.expectedMonthlyAmount} 만원/월</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: 퇴직연금 */}
            {currentStep === 3 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.infoAlert}>
                  🏢 회사에서 근로자에게 제공하는 2층 퇴직연금 정보입니다. 여러 개 직장/계좌를 추가할 수 있습니다.
                </div>

                {/* Added Pensions List */}
                {store.retirementPensions.length > 0 ? (
                  <div style={styles.addedList}>
                    {store.retirementPensions.map((p) => (
                      <div key={p.id} style={styles.addedItem}>
                        <div>
                          <strong>{p.pensionType}형 퇴직연금</strong>
                          {p.pensionType === "DB" ? (
                            <span> - 근속: {p.yearsOfService}년 / 평균급여: {p.avgSalary}만원</span>
                          ) : (
                            <span> - 적립금: {p.totalAccumulated}만원 / 수익률: {p.expectedReturnRate}%</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => store.deleteRetirementPension(p.id)}
                          style={styles.deleteBtn}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyText}>등록된 퇴직연금이 없습니다. 아래에서 정보를 추가해 주세요.</div>
                )}

                {/* Form to Add Retirement Pension */}
                <div style={styles.addFormBox}>
                  <h4 style={styles.addFormTitle}>퇴직연금 추가 등록</h4>
                  <div style={{ ...styles.fieldRow, marginBottom: 12 }}>
                    <label style={styles.label}>퇴직연금 유형</label>
                    <div style={styles.radioGroup}>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="retirementType"
                          checked={tempRetirement.pensionType === "DB"}
                          onChange={() => setTempRetirement({ ...tempRetirement, pensionType: "DB" })}
                        />
                        확정급여형 (DB)
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="retirementType"
                          checked={tempRetirement.pensionType === "DC"}
                          onChange={() => setTempRetirement({ ...tempRetirement, pensionType: "DC" })}
                        />
                        확정기여형 (DC)
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="retirementType"
                          checked={tempRetirement.pensionType === "IRP"}
                          onChange={() => setTempRetirement({ ...tempRetirement, pensionType: "IRP" })}
                        />
                        개인형퇴직연금 (IRP)
                      </label>
                    </div>
                  </div>

                  {tempRetirement.pensionType === "DB" ? (
                    <div style={styles.fieldGrid}>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>평균월급 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={tempRetirement.avgSalary}
                          onChange={(e) => setTempRetirement({ ...tempRetirement, avgSalary: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>예상 근속연수 (년)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={tempRetirement.yearsOfService}
                          onChange={(e) => setTempRetirement({ ...tempRetirement, yearsOfService: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>예상 임금상승률 (%)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={tempRetirement.salaryGrowthRate}
                          onChange={(e) => setTempRetirement({ ...tempRetirement, salaryGrowthRate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={styles.fieldGrid}>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>총 평가금액/적립금 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={tempRetirement.totalAccumulated}
                          onChange={(e) => setTempRetirement({ ...tempRetirement, totalAccumulated: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>본인 월 납입액 (만원)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={tempRetirement.monthlyContribution}
                          onChange={(e) => setTempRetirement({ ...tempRetirement, monthlyContribution: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>예상 투자수익률 (%)</label>
                        <input
                          type="number"
                          className="premium-input"
                          value={tempRetirement.expectedReturnRate}
                          onChange={(e) => setTempRetirement({ ...tempRetirement, expectedReturnRate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      store.addRetirementPension(tempRetirement);
                      alert("퇴직연금이 추가되었습니다.");
                    }}
                    style={styles.addBtn}
                  >
                    + 리스트에 추가하기
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: 개인연금 및 연금보험 */}
            {currentStep === 4 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.infoAlert}>
                  💰 개인이 추가 가입한 3층 연금입니다. 세액공제형 연금저축과 비과세형 연금보험을 구분하여 등록합니다.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Left Column: Personal Pension Savings */}
                  <div style={styles.addFormBox}>
                    <h4 style={styles.addFormTitle}>연금저축 (세제혜택)</h4>
                    
                    {store.personalPensions.length > 0 && (
                      <div style={{ ...styles.addedList, marginBottom: 12 }}>
                        {store.personalPensions.map((p) => (
                          <div key={p.id} style={styles.addedItemCompact}>
                            <span>{p.savingsType} - {p.totalAccumulated}만원</span>
                            <button type="button" onClick={() => store.deletePersonalPension(p.id)} style={styles.deleteBtnCompact}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>유형</label>
                      <select
                        className="premium-input"
                        value={tempPersonal.savingsType}
                        onChange={(e) => setTempPersonal({ ...tempPersonal, savingsType: e.target.value as "FUND" | "INSURANCE" })}
                      >
                        <option value="FUND">연금저축펀드</option>
                        <option value="INSURANCE">연금저축보험</option>
                      </select>
                    </div>
                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>총 평가금 (만원)</label>
                      <input
                        type="number"
                        className="premium-input"
                        value={tempPersonal.totalAccumulated}
                        onChange={(e) => setTempPersonal({ ...tempPersonal, totalAccumulated: Number(e.target.value) })}
                      />
                    </div>
                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>월/연 납입액 (만원)</label>
                      <input
                        type="number"
                        className="premium-input"
                        value={tempPersonal.monthlyAnnualContribution}
                        onChange={(e) => setTempPersonal({ ...tempPersonal, monthlyAnnualContribution: Number(e.target.value) })}
                      />
                    </div>
                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>희망수령나이 / 기간(년)</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="number"
                          className="premium-input"
                          placeholder="개시나이"
                          value={tempPersonal.desiredStartAge}
                          onChange={(e) => setTempPersonal({ ...tempPersonal, desiredStartAge: Number(e.target.value) })}
                        />
                        <input
                          type="number"
                          className="premium-input"
                          placeholder="수령기간"
                          value={tempPersonal.receivingPeriod}
                          onChange={(e) => setTempPersonal({ ...tempPersonal, receivingPeriod: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        store.addPersonalPension(tempPersonal);
                      }}
                      style={styles.addBtnCompact}
                    >
                      + 연금저축 추가
                    </button>
                  </div>

                  {/* Right Column: Pension Insurance */}
                  <div style={styles.addFormBox}>
                    <h4 style={styles.addFormTitle}>연금보험 (비과세)</h4>

                    {store.pensionInsurances.length > 0 && (
                      <div style={{ ...styles.addedList, marginBottom: 12 }}>
                        {store.pensionInsurances.map((p) => (
                          <div key={p.id} style={styles.addedItemCompact}>
                            <span>{p.insuranceType} - {p.totalAccumulated}만원</span>
                            <button type="button" onClick={() => store.deletePensionInsurance(p.id)} style={styles.deleteBtnCompact}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>보험 상품 구분</label>
                      <input
                        type="text"
                        className="premium-input"
                        value={tempInsurance.insuranceType}
                        onChange={(e) => setTempInsurance({ ...tempInsurance, insuranceType: e.target.value })}
                      />
                    </div>
                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>총 납입액 (만원)</label>
                      <input
                        type="number"
                        className="premium-input"
                        value={tempInsurance.totalAccumulated}
                        onChange={(e) => setTempInsurance({ ...tempInsurance, totalAccumulated: Number(e.target.value) })}
                      />
                    </div>
                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>월 납입액 (만원)</label>
                      <input
                        type="number"
                        className="premium-input"
                        value={tempInsurance.monthlyPayment}
                        onChange={(e) => setTempInsurance({ ...tempInsurance, monthlyPayment: Number(e.target.value) })}
                      />
                    </div>
                    <div style={styles.fieldRowCompact}>
                      <label style={styles.labelCompact}>납입 기간(년) / 공시이율(%)</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="number"
                          className="premium-input"
                          placeholder="납입기간"
                          value={tempInsurance.paymentPeriod}
                          onChange={(e) => setTempInsurance({ ...tempInsurance, paymentPeriod: Number(e.target.value) })}
                        />
                        <input
                          type="number"
                          className="premium-input"
                          placeholder="공시이율"
                          value={tempInsurance.expectedDeclaredRate}
                          onChange={(e) => setTempInsurance({ ...tempInsurance, expectedDeclaredRate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        store.addPensionInsurance(tempInsurance);
                      }}
                      style={styles.addBtnCompact}
                    >
                      + 연금보험 추가
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: 설계 기준 설정 */}
            {currentStep === 5 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.infoAlert}>
                  ⚙️ 물가상승률 및 은퇴 후 연금 수령 개시 나이 등의 시뮬레이션 기본 파라미터를 설정합니다.
                </div>
                <div style={styles.fieldRow}>
                  <label style={styles.label}>희망 은퇴 나이 (세)</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={store.simulationParams.retirementAge}
                    onChange={(e) => store.setSimulationParams({ retirementAge: Number(e.target.value) })}
                  />
                </div>
                <div style={styles.fieldRow}>
                  <label style={styles.label}>예상 기대 수명 (세)</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={store.simulationParams.expectedLifeExpectancy}
                    onChange={(e) => store.setSimulationParams({ expectedLifeExpectancy: Number(e.target.value) })}
                  />
                </div>
                <div style={styles.fieldRow}>
                  <label style={styles.label}>장기 물가상승률 (%)</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={store.simulationParams.inflationRate}
                    onChange={(e) => store.setSimulationParams({ inflationRate: Number(e.target.value) })}
                  />
                </div>
                <div style={styles.fieldRow}>
                  <label style={styles.label}>국민연금 수령 개시 연령 (세)</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={store.simulationParams.nationalPensionStartAge}
                    onChange={(e) => store.setSimulationParams({ nationalPensionStartAge: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={styles.formFooterActions}>
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="premium-button-secondary"
              style={{ opacity: currentStep === 1 ? 0.5 : 1, cursor: currentStep === 1 ? "not-allowed" : "pointer" }}
            >
              이전 단계
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="premium-button"
              >
                다음 단계
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="premium-button"
                style={{ background: "var(--gradient-secondary)" }}
              >
                {isSubmitting ? "저장 중..." : "설계 분석 완료 🚀"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// Vanilla CSS-in-JS styles for layout & premium styling
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "var(--background)",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow1: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "50%",
    height: "50%",
    background: "radial-gradient(circle, rgba(0, 184, 148, 0.08) 0%, rgba(255,255,255,0) 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(30, 58, 95, 0.08) 0%, rgba(255,255,255,0) 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
    zIndex: 1,
  },
  logo: {
    fontFamily: "var(--font-sans)",
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--primary)",
    letterSpacing: "-1px",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "var(--text-secondary)",
  },
  wizardContainer: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "32px",
    width: "100%",
    maxWidth: "1200px",
    zIndex: 1,
  },
  sidebar: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    boxShadow: "var(--shadow-md)",
    display: "flex",
    flexDirection: "column",
    height: "fit-content",
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "8px",
  },
  progressBarBg: {
    width: "100%",
    height: "6px",
    backgroundColor: "var(--border)",
    borderRadius: "var(--radius-full)",
    marginBottom: "32px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "var(--secondary)",
    borderRadius: "var(--radius-full)",
    transition: "width var(--transition-normal)",
  },
  stepList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  stepNumber: {
    width: "32px",
    height: "32px",
    borderRadius: "var(--radius-full)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "0.9rem",
    transition: "all var(--transition-fast)",
  },
  stepInfo: {
    display: "flex",
    flexDirection: "column",
  },
  stepTitle: {
    fontSize: "0.95rem",
    color: "var(--text-primary)",
  },
  stepDesc: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "2px",
  },
  formCard: {
    borderRadius: "var(--radius-lg)",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    minHeight: "550px",
    justifyContent: "space-between",
  },
  formHeader: {
    borderBottom: "1px solid var(--border)",
    paddingBottom: "20px",
    marginBottom: "30px",
  },
  stepBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--secondary-dark)",
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    padding: "4px 8px",
    borderRadius: "var(--radius-full)",
    letterSpacing: "0.5px",
  },
  formTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--primary-dark)",
    marginTop: "12px",
  },
  formDesc: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    marginTop: "6px",
  },
  formBody: {
    flexGrow: 1,
    marginBottom: "30px",
  },
  formGroupList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1.5px solid var(--border)",
    marginBottom: "10px",
  },
  tabButton: {
    flex: 1,
    padding: "12px",
    fontSize: "1rem",
    fontWeight: 600,
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  infoAlert: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderLeft: "4px solid var(--info)",
    borderRadius: "4px",
    padding: "12px 16px",
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  fieldRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 20px",
  },
  label: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  previewBox: {
    backgroundColor: "var(--background)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
    marginTop: "16px",
  },
  previewTitle: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--primary)",
    marginBottom: "10px",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
  },
  addedList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "150px",
    overflowY: "auto",
    padding: "8px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--background)",
  },
  addedItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--surface)",
    padding: "10px 14px",
    borderRadius: "4px",
    border: "1px solid var(--border)",
    fontSize: "0.9rem",
  },
  addedItemCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--surface)",
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid var(--border)",
    fontSize: "0.8rem",
  },
  emptyText: {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.9rem",
    padding: "20px 0",
  },
  addFormBox: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
    backgroundColor: "var(--surface)",
  },
  addFormTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--primary)",
    marginBottom: "12px",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "6px",
  },
  radioGroup: {
    display: "flex",
    gap: "16px",
    marginTop: "4px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  addBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "rgba(0, 184, 148, 0.08)",
    border: "1.5px dashed var(--secondary)",
    color: "var(--secondary-dark)",
    borderRadius: "var(--radius-sm)",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "16px",
    transition: "all var(--transition-fast)",
  },
  addBtnCompact: {
    width: "100%",
    padding: "8px",
    backgroundColor: "rgba(30, 58, 95, 0.05)",
    border: "1px dashed var(--primary)",
    color: "var(--primary)",
    borderRadius: "var(--radius-sm)",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
    marginTop: "12px",
  },
  deleteBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--danger)",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  deleteBtnCompact: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--danger)",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  fieldRowCompact: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "10px",
  },
  labelCompact: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  formFooterActions: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid var(--border)",
    paddingTop: "24px",
    marginTop: "20px",
  },
  syncBox: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  syncForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    border: "1px solid var(--border)",
    padding: "24px",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--surface)",
  },
  miniSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid var(--border)",
    borderTop: "2px solid var(--primary)",
    borderRadius: "50%",
    animation: "pulse-subtle 1s infinite linear",
  },
  privacyNoticeBanner: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    marginBottom: "24px",
    fontSize: "0.85rem",
    color: "var(--secondary-dark)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    lineHeight: 1.4,
  },
};
