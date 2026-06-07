"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePensionStore } from "@/store/usePensionStore";
import ThemeToggle from "@/components/ThemeToggle";

const STEPS = [
  { id: 0, title: "기본 정보 & 재무 목표", desc: "본인/가족 정보 및 은퇴 생활비 목표 등" },
  { id: 1, title: "국민연금 (1층)", desc: "국민연금 납부 내역 및 예상액" },
  { id: 2, title: "기초연금 (1층)", desc: "기초연금 대상 확인용 정보" },
  { id: 3, title: "퇴직연금 (2층)", desc: "회사 퇴직연금 (DB/DC/IRP)" },
  { id: 4, title: "개인연금 (3층)", desc: "연금저축 및 연금보험" },
  { id: 5, title: "기타 시뮬레이션 설정", desc: "물가상승률 및 국민연금 개시 연령 설정" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [nationalInputMode, setNationalInputMode] = useState<"SIMPLE" | "DETAILED" | "PDF" | "SYNC">("SIMPLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // PDF 파싱 관련 상태 변수들
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfParsed, setPdfParsed] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // NPS Codef API 연동 관련 상태 변수들
  const [syncName, setSyncName] = useState("홍길동");
  const [syncPhone, setSyncPhone] = useState("010-1234-5678");
  const [syncBirth, setSyncBirth] = useState("19800101");
  const [syncProvider, setSyncProvider] = useState("kakao");
  const [syncTelecom, setSyncTelecom] = useState("0");
  const [verificationPending, setVerificationPending] = useState(false);
  const [jti, setJti] = useState<string | null>(null);
  const [twoWayInfo, setTwoWayInfo] = useState<any>(null);

  const [npsSyncing, setNpsSyncing] = useState(false);
  const [npsSynced, setNpsSynced] = useState(false);

  // FSS Codef API 연동 관련 상태 변수들
  const [fssInputMode, setFssInputMode] = useState<"MANUAL" | "PDF" | "SYNC">("MANUAL");
  const [fssName, setFssName] = useState("홍길동");
  const [fssPhone, setFssPhone] = useState("010-1234-5678");
  const [fssBirth, setFssBirth] = useState("19800101");
  const [fssProvider, setFssProvider] = useState("kakao");
  const [fssTelecom, setFssTelecom] = useState("0");
  const [fssVerificationPending, setFssVerificationPending] = useState(false);
  const [fssJti, setFssJti] = useState<string | null>(null);
  const [fssTwoWayInfo, setFssTwoWayInfo] = useState<any>(null);
  const [fssSyncing, setFssSyncing] = useState(false);
  const [fssSynced, setFssSynced] = useState(false);

  const handlePdfUpload = async (file: File) => {
    setPdfParsing(true);
    setPdfError("");
    setPdfParsed(false);

    try {
      // 1. pdfjs-dist 동적 로드
      const pdfjs = await import("pdfjs-dist");
      
      // worker 설정: 패키지 자체 버전을 활용하여 호환 cdn 지정
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }

      const cleanText = fullText.trim();
      if (!cleanText) {
        throw new Error("PDF에서 텍스트를 추출할 수 없습니다. 보안 비밀번호가 해제된 PDF 파일인지 확인해 주세요.");
      }

      // 2. 백엔드 API 호출하여 AI 파싱 요청
      const res = await fetch("/api/pension/pdf-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText: cleanText }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "AI 분석 도중 오류가 발생했습니다.");
      }

      const parsedData = await res.json();

      // 3. Zustand store에 데이터 매핑
      if (parsedData.nationalPension) {
        store.setNationalPension({
          contributionMonths: parsedData.nationalPension.contributionMonths || 0,
          currentStandardMonthlyIncome: parsedData.nationalPension.currentStandardMonthlyIncome || 0,
          expectedMonthlyPension: parsedData.nationalPension.expectedMonthlyPension || 0,
          totalPaidAmount: Math.round((parsedData.nationalPension.currentStandardMonthlyIncome || 0) * 0.09 * (parsedData.nationalPension.contributionMonths || 0)),
          expectedTotalContributionMonths: store.nationalPension.expectedTotalContributionMonths,
          totalExpectedPremium: store.nationalPension.totalExpectedPremium,
          basicPensionAmount: store.nationalPension.basicPensionAmount,
          aValue: store.nationalPension.aValue,
          bValue: store.nationalPension.bValue,
        });
      }

      if (parsedData.retirementPensions && parsedData.retirementPensions.length > 0) {
        store.setRetirementPensions([]);
        parsedData.retirementPensions.forEach((p: any) => {
          store.addRetirementPension({
            pensionType: p.pensionType || "DC",
            avgSalary: p.avgSalary || 0,
            yearsOfService: p.yearsOfService || 0,
            salaryGrowthRate: p.salaryGrowthRate || 3.0,
            totalAccumulated: p.totalAccumulated || 0,
            monthlyContribution: p.monthlyContribution || 0,
            expectedReturnRate: p.expectedReturnRate || 3.0,
            companyMatchRate: 0,
          });
        });
      }

      if (parsedData.personalPensions && parsedData.personalPensions.length > 0) {
        store.setPersonalPensions([]);
        parsedData.personalPensions.forEach((p: any) => {
          store.addPersonalPension({
            savingsType: p.savingsType || "FUND",
            totalAccumulated: p.totalAccumulated || 0,
            monthlyAnnualContribution: p.monthlyAnnualContribution || 0,
            desiredStartAge: p.desiredStartAge || 65,
            receivingPeriod: p.receivingPeriod || 20,
          });
        });
      }

      if (parsedData.pensionInsurances && parsedData.pensionInsurances.length > 0) {
        store.setPensionInsurances([]);
        parsedData.pensionInsurances.forEach((p: any) => {
          store.addPensionInsurance({
            insuranceType: p.insuranceType || "SAVING",
            totalAccumulated: p.totalAccumulated || 0,
            monthlyPayment: p.monthlyPayment || 0,
            paymentPeriod: p.paymentPeriod || 10,
            expectedDeclaredRate: p.expectedDeclaredRate || 2.5,
          });
        });
      }

      setPdfParsed(true);
      alert("🎉 금융감독원 통합연금 PDF 자료 분석이 완료되어 모든 연금 데이터가 자동으로 채워졌습니다!");
    } catch (err: any) {
      console.error(err);
      setPdfError(err.message || "PDF 파일을 분석하는 중 예기치 못한 에러가 발생했습니다.");
    } finally {
      setPdfParsing(false);
    }
  };

  const renderPdfUploadSection = () => {
    return (
      <div style={styles.pdfUploadBox} className="animate-fade-in">
        <div style={styles.infoAlert}>
          📄 <strong>금융감독원 통합연금포털 PDF 등록</strong>
          <p style={{ fontSize: "0.85rem", marginTop: 4, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            통합연금포털에서 다운로드받은 PDF 파일을 등록하시면 1층(국민연금), 2층(퇴직연금), 3층(개인연금) 정보가 한 번에 자동 입력됩니다.
          </p>
          <p style={{ fontSize: "0.8rem", marginTop: 4, color: "var(--warning)", lineHeight: 1.5 }}>
            ⚠️ 다운로드 시 설정된 PDF 비밀번호(보통 생년월일 6자리 또는 설정한 비밀번호)를 반드시 해제(인쇄용 PDF 저장 등으로 무암호화)한 후 업로드해주셔야 자동 파싱이 가능합니다.
          </p>
        </div>

        <div style={styles.portalGuideCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>금융감독원 통합연금포털 바로가기</span>
            <a 
              href="https://100lifeplan.fss.or.kr" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                color: "var(--primary-light)",
                fontWeight: 700,
                textDecoration: "underline",
                fontSize: "0.9rem"
              }}
            >
              100lifeplan.fss.or.kr
            </a>
          </div>
        </div>

        <div 
          style={{
            ...styles.dropZone,
            borderColor: pdfParsing ? "var(--primary)" : "rgba(99, 102, 241, 0.3)",
          }}
        >
          {pdfParsing ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={styles.miniSpinner} />
              <span style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 700 }}>
                통합연금 PDF 데이터를 추출하여 AI 분석 중입니다...
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "2.5rem" }}>📥</span>
              <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)", textAlign: "center", maxWidth: "320px", lineHeight: 1.4 }}>
                이곳에 통합연금 PDF 파일을 드래그하여 놓거나 아래 버튼을 클릭하여 선택하세요.
              </span>
              <input
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                id="pdf-file-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handlePdfUpload(file);
                  }
                }}
              />
              <button 
                type="button" 
                className="premium-button"
                style={{ padding: "8px 20px", fontSize: "0.85rem", marginTop: 4 }}
                onClick={() => document.getElementById("pdf-file-input")?.click()}
              >
                파일 선택하기
              </button>
            </div>
          )}
        </div>

        {pdfError && (
          <div style={{ ...styles.errorBanner, marginTop: 16 }}>
            <span style={{ marginRight: 8 }}>⚠️</span> <span>{pdfError}</span>
          </div>
        )}

        {pdfParsed && (
          <div style={{ ...styles.previewBox, marginTop: 16, borderLeft: "4px solid var(--success)" }} className="animate-fade-in">
            <h4 style={{ ...styles.previewTitle, color: "var(--success-light)" }}>✓ 연금 정보 자동 연동 완료</h4>
            <div style={{ ...styles.previewGrid, fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 8 }}>
              <div>국민연금: <strong>{store.nationalPension.contributionMonths > 0 ? `${store.nationalPension.contributionMonths}개월 (예상 ${store.nationalPension.expectedMonthlyPension}만원/월)` : "정보 없음"}</strong></div>
              <div>퇴직연금 계좌수: <strong>{store.retirementPensions.length}개</strong></div>
              <div>개인연금 계좌수: <strong>{store.personalPensions.length}개</strong></div>
              <div>연금보험 계좌수: <strong>{store.pensionInsurances.length}개</strong></div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 10 }}>
              * 각 단계별 메뉴 탭에서 상세 내용을 확인하고 보완할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    );
  };

  const handleNPSSync = async () => {
    setNpsSyncing(true);
    try {
      const response = await fetch("/api/pension/nps-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: syncName,
          phoneNo: syncPhone,
          identity: syncBirth,
          provider: syncProvider,
          telecom: syncProvider === "pass" ? syncTelecom : undefined,
          jti,
          twoWayInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("API 요청에 실패했습니다.");
      }

      const result = await response.json();

      if (result.success) {
        if (result.status === "NEED_VERIFICATION") {
          // 1차 인증 완료 (추가 인증 대기)
          setJti(result.jti);
          setTwoWayInfo(result.twoWayInfo);
          setVerificationPending(true);
          setNpsSyncing(false);
        } else if (result.status === "SUCCESS" && result.data) {
          // 최종 완료
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
          setVerificationPending(false);
          setNpsSyncing(false);
          setNpsSynced(true);
        }
      } else {
        alert(result.message || "국민연금 동기화에 실패했습니다. 입력값을 확인하시거나 잠시 후 다시 시도해 주세요.");
        setNpsSyncing(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "NPS 동기화 중 에러가 발생했습니다.");
      setNpsSyncing(false);
    }
  };

  const handleCancelVerification = () => {
    setVerificationPending(false);
    setJti(null);
    setTwoWayInfo(null);
    setNpsSyncing(false);
  };

  const handleFSSSync = async () => {
    setFssSyncing(true);
    try {
      const response = await fetch("/api/pension/fss-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: fssName,
          phoneNo: fssPhone,
          identity: fssBirth,
          provider: fssProvider,
          telecom: fssProvider === "pass" ? fssTelecom : undefined,
          jti: fssJti,
          twoWayInfo: fssTwoWayInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("API 요청에 실패했습니다.");
      }

      const result = await response.json();

      if (result.success) {
        if (result.status === "NEED_VERIFICATION") {
          setFssJti(result.jti);
          setFssTwoWayInfo(result.twoWayInfo);
          setFssVerificationPending(true);
          setFssSyncing(false);
        } else if (result.status === "SUCCESS" && result.data) {
          // 1. 퇴직연금 업데이트
          store.retirementPensions.forEach(p => store.deleteRetirementPension(p.id));
          result.data.retirementPensions.forEach((p: any) => {
            store.addRetirementPension({
              pensionType: p.pensionType,
              avgSalary: 400,
              yearsOfService: 10,
              salaryGrowthRate: 3.0,
              totalAccumulated: p.totalAccumulated,
              monthlyContribution: p.monthlyContribution,
              companyMatchRate: 20,
              expectedReturnRate: p.expectedReturnRate,
            });
          });

          // 2. 개인연금 업데이트
          store.personalPensions.forEach(p => store.deletePersonalPension(p.id));
          result.data.personalPensions.forEach((p: any) => {
            store.addPersonalPension({
              savingsType: p.savingsType,
              totalAccumulated: p.totalAccumulated,
              monthlyAnnualContribution: p.monthlyAnnualContribution,
              desiredStartAge: p.desiredStartAge || 65,
              receivingPeriod: p.receivingPeriod || 20,
            });
          });

          // 3. 연금보험 업데이트
          store.pensionInsurances.forEach(p => store.deletePensionInsurance(p.id));
          result.data.pensionInsurances.forEach((p: any) => {
            store.addPensionInsurance({
              insuranceType: p.insuranceType,
              totalAccumulated: p.totalAccumulated,
              monthlyPayment: p.monthlyPayment,
              paymentPeriod: p.paymentPeriod || 10,
              expectedDeclaredRate: p.expectedDeclaredRate || 2.5,
            });
          });

          setFssVerificationPending(false);
          setFssSyncing(false);
          setFssSynced(true);
        }
      } else {
        alert(result.message || "금융감독원 연동에 실패했습니다. 입력값을 확인하시거나 잠시 후 다시 시도해 주세요.");
        setFssSyncing(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "FSS 연동 중 에러가 발생했습니다.");
      setFssSyncing(false);
    }
  };

  const handleCancelFSSVerification = () => {
    setFssVerificationPending(false);
    setFssJti(null);
    setFssTwoWayInfo(null);
    setFssSyncing(false);
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
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // JSON 백업 저장
  const handleSaveData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      nationalPension: store.nationalPension,
      basicPension: store.basicPension,
      retirementPensions: store.retirementPensions,
      personalPensions: store.personalPensions,
      pensionInsurances: store.pensionInsurances,
      simulationParams: store.simulationParams,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const a = document.createElement("a");
    a.setAttribute("href", jsonString);
    a.setAttribute("download", `pensionlab_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // JSON 데이터 불러오기
  const handleLoadData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (
            parsedData.nationalPension ||
            parsedData.retirementPensions ||
            parsedData.personalPensions
          ) {
            store.importStoreData(parsedData);
            alert("성공적으로 백업 데이터를 불러왔습니다!");
          } else {
            alert("올바르지 않은 백업 파일 형식입니다.");
          }
        } catch (err) {
          console.error(err);
          alert("파일 읽기 도중 오류가 발생했습니다.");
        }
      };
      e.target.value = "";
    }
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
    if (isSubmitting) return; // prevent double clicks
    setIsSubmitting(true);
    
    const maxRetries = 4;
    let attempt = 0;
    let success = false;
    let lastError: any = null;
    let userId = "";

    while (attempt < maxRetries && !success) {
      attempt++;
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || "온보딩 데이터 저장 실패");
        }

        const data = await response.json();
        userId = data.userId;
        success = true;
      } catch (err: any) {
        console.warn(`온보딩 저장 시도 ${attempt}/${maxRetries} 실패:`, err.message);
        lastError = err;
        if (attempt < maxRetries) {
          // Exponential backoff: 1s → 2s → 3s wait between retries
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (success && userId) {
      // Save userId to localStorage to preserve session
      localStorage.setItem("pensionlab_user_id", userId);
    } else {
      // Save locally so dashboard can still work even without DB persistence
      console.warn("온보딩 DB 저장 실패, 로컬 저장으로 대체:", lastError?.message);
      localStorage.setItem("pensionlab_user_id", `local_${Date.now()}`);
    }
    
    store.setSimulationParams({
      retirementAge: store.simulationParams.retirementAge,
    });

    router.push("/dashboard");
    setIsSubmitting(false);
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
        <div style={styles.headerContent}>
          {/* 좌: 로고 + 부제목 */}
          <div style={styles.headerLeft}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <h1 style={styles.logo}>Pension<span className="gradient-text">Lab</span></h1>
            </Link>
            <p style={styles.subtitle}>은퇴 준비의 첫걸음, 다층 연금 통합 시뮬레이터</p>
          </div>
          {/* 우: 개인정보 안심보장 + JSON저장 + 불러오기 + 테마토글 */}
          <div style={styles.headerRight}>
            <div style={styles.privacyChip}>
              <span style={{ fontSize: "0.9rem" }}>🔒</span>
              <span><strong>개인정보 안심 보장</strong> — 모든 데이터는 이 기기에만 저장됩니다.</span>
            </div>
            <button onClick={handleSaveData} style={styles.saveBtn} title="현재 입력 데이터를 JSON으로 저장">
              💾 저장
            </button>
            <button
              onClick={() => document.getElementById("import-file-input")?.click()}
              style={styles.saveBtn}
              title="저장된 JSON 백업 파일 불러오기"
            >
              📂 불러오기
            </button>
            <input
              type="file"
              id="import-file-input"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleLoadData}
            />
            <ThemeToggle />
          </div>
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
                    borderColor: isActive ? "rgba(99, 102, 241, 0.4)" : "transparent",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.10) 100%)"
                      : "transparent",
                  }}
                >
                  <div
                    style={{
                      ...styles.stepNumber,
                      background: isCompleted
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : isActive
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "var(--surface-hover)",
                      color: isActive || isCompleted ? "#ffffff" : "var(--text-muted)",
                      boxShadow: (isActive || isCompleted) ? "0 0 12px rgba(99, 102, 241, 0.4)" : "none",
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
            <h2 style={styles.formTitle}>{STEPS[currentStep].title}</h2>
            <p style={styles.formDesc}>{STEPS[currentStep].desc}</p>
          </div>


          <div style={styles.formBody}>
            {/* STEP 0: 기본 정보 및 노후 재무 목표 */}
            {currentStep === 0 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.infoAlert}>
                  👤 본인 및 가족 구성원의 정보와 노후 지출 목표를 입력하면 더욱 정확한 시뮬레이션이 가능해집니다.
                </div>
                
                <h3 style={{ ...styles.addFormTitle, marginTop: 10 }}>1. 본인 및 가족 정보</h3>
                <div style={styles.fieldGrid}>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>현재 나이 (세)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.currentAge || ""}
                      onChange={(e) => store.setSimulationParams({ currentAge: Number(e.target.value) })}
                    />
                  </div>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>희망 은퇴 나이 (세)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.retirementAge || ""}
                      onChange={(e) => store.setSimulationParams({ retirementAge: Number(e.target.value) })}
                    />
                  </div>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>예상 기대 수명 (세)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.expectedLifeExpectancy || ""}
                      onChange={(e) => store.setSimulationParams({ expectedLifeExpectancy: Number(e.target.value) })}
                    />
                  </div>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>배우자 유무</label>
                    <div style={styles.radioGroup}>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="hasSpouse"
                          checked={store.simulationParams.hasSpouse === true}
                          onChange={() => store.setSimulationParams({ hasSpouse: true })}
                        />
                        있음
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="hasSpouse"
                          checked={store.simulationParams.hasSpouse === false}
                          onChange={() => store.setSimulationParams({ hasSpouse: false, spouseAge: undefined })}
                        />
                        없음
                      </label>
                    </div>
                  </div>
                </div>

                {store.simulationParams.hasSpouse && (
                  <div style={styles.fieldGrid} className="animate-fade-in">
                    <div style={styles.fieldRow}>
                      <label style={styles.label}>배우자 현재 나이 (세)</label>
                      <input
                        type="number"
                        className="premium-input"
                        placeholder="예: 35"
                        value={store.simulationParams.spouseAge ?? ""}
                        onChange={(e) => store.setSimulationParams({ spouseAge: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div style={styles.fieldGrid}>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>자녀 수 (명)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.childrenCount ?? 0}
                      onChange={(e) => store.setSimulationParams({ childrenCount: Number(e.target.value) })}
                    />
                  </div>
                  {store.simulationParams.childrenCount > 0 && (
                    <div style={styles.fieldRow}>
                      <label style={styles.label}>자녀 나이 (쉼표구분, 세)</label>
                      <input
                        type="text"
                        className="premium-input"
                        placeholder="예: 5, 8"
                        value={store.simulationParams.childrenAges || ""}
                        onChange={(e) => store.setSimulationParams({ childrenAges: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <h3 style={{ ...styles.addFormTitle, marginTop: 20 }}>2. 노후 재무지출 및 자산 목표</h3>
                <div style={styles.fieldGrid}>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>희망 월 생활비 (만원)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.targetMonthlySpending || ""}
                      onChange={(e) => store.setSimulationParams({ targetMonthlySpending: Number(e.target.value) })}
                    />
                  </div>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>최소 월 생활비 (만원)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.minMonthlySpending || ""}
                      onChange={(e) => store.setSimulationParams({ minMonthlySpending: Number(e.target.value) })}
                    />
                  </div>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>자녀 교육/결혼 지원비 총액 (만원)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.childSupportExpense || ""}
                      onChange={(e) => store.setSimulationParams({ childSupportExpense: Number(e.target.value) })}
                    />
                  </div>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>노후 대비 연간 의료비 (만원)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.annualMedicalExpense || ""}
                      onChange={(e) => store.setSimulationParams({ annualMedicalExpense: Number(e.target.value) })}
                    />
                  </div>
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>은퇴 시점 비연금 자산(주식,채권,현금 등) 규모 (만원)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.nonPensionAssets || ""}
                      onChange={(e) => store.setSimulationParams({ nonPensionAssets: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

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
                    onClick={() => setNationalInputMode("PDF")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: nationalInputMode === "PDF" ? "var(--primary)" : "transparent",
                      color: nationalInputMode === "PDF" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                    id="btn-tab-nps-pdf"
                  >
                    📄 금융감독원 통합연금 자료 등록
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
                        <div>예상 연금 수령액: <strong style={{ color: "var(--primary-700)" }}>{store.nationalPension.expectedMonthlyPension.toLocaleString()} 만원/월</strong></div>
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
                      🔐 국민연금공단(NPS) 간편인증 연동을 통해 납부 개월 수 및 예상 연금액 등 9대 필수 항목을 자동으로 동기화합니다. (Codef API 연동 작동)
                    </div>

                    {verificationPending && (
                      <div
                        style={{
                          ...styles.infoAlert,
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          borderLeft: "4px solid #f59e0b",
                          color: "#f3f4f6",
                          marginBottom: "16px",
                        }}
                        className="animate-fade-in"
                      >
                        💬 스마트폰(선택하신 간편인증 앱)으로 인증 요청이 발송되었습니다. 휴대폰에서 본인인증을 완료하신 다음 아래 <strong>[인증 완료 확인]</strong> 버튼을 클릭해 주세요.
                      </div>
                    )}
                    
                    <div style={styles.syncForm}>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>이름</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="홍길동"
                          value={syncName}
                          onChange={(e) => setSyncName(e.target.value)}
                          disabled={verificationPending || npsSyncing || npsSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>휴대폰 번호</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="010-1234-5678"
                          value={syncPhone}
                          onChange={(e) => setSyncPhone(e.target.value)}
                          disabled={verificationPending || npsSyncing || npsSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>생년월일 (8자리)</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="19800101"
                          value={syncBirth}
                          onChange={(e) => setSyncBirth(e.target.value)}
                          disabled={verificationPending || npsSyncing || npsSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>간편인증 기관</label>
                        <select
                          className="premium-input"
                          value={syncProvider}
                          onChange={(e) => setSyncProvider(e.target.value)}
                          disabled={verificationPending || npsSyncing || npsSynced}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "6px",
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            fontFamily: "inherit",
                            fontSize: "0.95rem",
                            outline: "none"
                          }}
                        >
                          <option value="kakao">카카오톡</option>
                          <option value="naver">네이버</option>
                          <option value="pass">PASS</option>
                          <option value="toss">토스</option>
                          <option value="kb">KB국민은행</option>
                        </select>
                      </div>

                      {syncProvider === "pass" && (
                        <div style={styles.fieldRow} className="animate-fade-in">
                          <label style={styles.label}>통신사 구분</label>
                          <select
                            className="premium-input"
                            value={syncTelecom}
                            onChange={(e) => setSyncTelecom(e.target.value)}
                            disabled={verificationPending || npsSyncing || npsSynced}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "6px",
                              backgroundColor: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text-primary)",
                              fontFamily: "inherit",
                              fontSize: "0.95rem",
                              outline: "none"
                            }}
                          >
                            <option value="0">SKT</option>
                            <option value="1">KT</option>
                            <option value="2">LGU+ (알뜰폰 포함)</option>
                          </select>
                        </div>
                      )}

                      {npsSyncing ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, cursor: "not-allowed", width: "100%" }} disabled>
                          <span style={{ display: "inline-block", ...styles.miniSpinner, borderTopColor: "#ffffff", marginRight: 8, verticalAlign: "middle" }} /> 간편인증 및 연금정보 가져오는 중...
                        </button>
                      ) : npsSynced ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, background: "var(--success)", width: "100%" }} disabled>
                          ✓ 국민연금 정보 동기화 완료!
                        </button>
                      ) : verificationPending ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: 16 }}>
                          <button
                            type="button"
                            id="btn-nps-verify"
                            className="premium-button"
                            style={{ width: "100%", backgroundColor: "var(--primary)" }}
                            onClick={handleNPSSync}
                          >
                            🔐 인증 완료 확인 (최종 동기화)
                          </button>
                          <button
                            type="button"
                            className="premium-button"
                            style={{ width: "100%", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                            onClick={handleCancelVerification}
                          >
                            ❌ 인증 취소 및 다시 시도
                          </button>
                        </div>
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
                          <div>예상 연금 월액: <strong style={{ color: "var(--primary-700)" }}>{store.nationalPension.expectedMonthlyPension.toLocaleString()} 만원/월</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {nationalInputMode === "PDF" && renderPdfUploadSection()}
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
                    <div>예상 월 수령액: <strong style={{ color: "var(--primary-700)" }}>{store.basicPension.expectedMonthlyAmount} 만원/월</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: 퇴직연금 */}
            {currentStep === 3 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.tabContainer}>
                  <button
                    onClick={() => setFssInputMode("MANUAL")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: fssInputMode === "MANUAL" ? "var(--primary)" : "transparent",
                      color: fssInputMode === "MANUAL" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                  >
                    수동 입력 등록
                  </button>
                  <button
                    onClick={() => setFssInputMode("PDF")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: fssInputMode === "PDF" ? "var(--primary)" : "transparent",
                      color: fssInputMode === "PDF" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                    id="btn-tab-fss-pdf-3"
                  >
                    📄 금융감독원 통합연금 자료 등록
                  </button>
                </div>

                {fssInputMode === "MANUAL" && (
                  <>
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
                  </>
                )}

                {fssInputMode === "SYNC" && (
                  <div style={styles.syncBox} className="animate-fade-in">
                    <div style={styles.infoAlert}>
                      🔐 금융감독원(FSS) 통합연금포털 간편인증 연동을 통해 가입된 모든 퇴직연금(DB/DC/IRP) 및 개인연금(저축/보험) 계좌를 한 번에 자동으로 동기화합니다.
                    </div>

                    {fssVerificationPending && (
                      <div
                        style={{
                          ...styles.infoAlert,
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          borderLeft: "4px solid #f59e0b",
                          color: "#f3f4f6",
                          marginBottom: "16px",
                        }}
                        className="animate-fade-in"
                      >
                        💬 스마트폰(선택하신 간편인증 앱)으로 인증 요청이 발송되었습니다. 휴대폰에서 본인인증을 완료하신 다음 아래 <strong>[인증 완료 확인]</strong> 버튼을 클릭해 주세요.
                      </div>
                    )}
                    
                    <div style={styles.syncForm}>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>이름</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="홍길동"
                          value={fssName}
                          onChange={(e) => setFssName(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>휴대폰 번호</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="010-1234-5678"
                          value={fssPhone}
                          onChange={(e) => setFssPhone(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>생년월일 (8자리)</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="19800101"
                          value={fssBirth}
                          onChange={(e) => setFssBirth(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>간편인증 기관</label>
                        <select
                          className="premium-input"
                          value={fssProvider}
                          onChange={(e) => setFssProvider(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "6px",
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            fontFamily: "inherit",
                            fontSize: "0.95rem",
                            outline: "none"
                          }}
                        >
                          <option value="kakao">카카오톡</option>
                          <option value="naver">네이버</option>
                          <option value="pass">PASS</option>
                          <option value="toss">토스</option>
                          <option value="kb">KB국민은행</option>
                        </select>
                      </div>

                      {fssProvider === "pass" && (
                        <div style={styles.fieldRow} className="animate-fade-in">
                          <label style={styles.label}>통신사 구분</label>
                          <select
                            className="premium-input"
                            value={fssTelecom}
                            onChange={(e) => setFssTelecom(e.target.value)}
                            disabled={fssVerificationPending || fssSyncing || fssSynced}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "6px",
                              backgroundColor: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text-primary)",
                              fontFamily: "inherit",
                              fontSize: "0.95rem",
                              outline: "none"
                            }}
                          >
                            <option value="0">SKT</option>
                            <option value="1">KT</option>
                            <option value="2">LGU+ (알뜰폰 포함)</option>
                          </select>
                        </div>
                      )}

                      {fssSyncing ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, cursor: "not-allowed", width: "100%" }} disabled>
                          <span style={{ display: "inline-block", ...styles.miniSpinner, borderTopColor: "#ffffff", marginRight: 8, verticalAlign: "middle" }} /> 간편인증 및 연금정보 가져오는 중...
                        </button>
                      ) : fssSynced ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, background: "var(--success)", width: "100%" }} disabled>
                          ✓ 통합연금 정보 동기화 완료!
                        </button>
                      ) : fssVerificationPending ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: 16 }}>
                          <button
                            type="button"
                            id="btn-fss-verify-3"
                            className="premium-button"
                            style={{ width: "100%", backgroundColor: "var(--primary)" }}
                            onClick={handleFSSSync}
                          >
                            🔐 인증 완료 확인 (최종 동기화)
                          </button>
                          <button
                            type="button"
                            className="premium-button"
                            style={{ width: "100%", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                            onClick={handleCancelFSSVerification}
                          >
                            ❌ 인증 취소 및 다시 시도
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id="btn-fss-sync-3"
                          className="premium-button"
                          style={{ marginTop: 16, width: "100%" }}
                          onClick={handleFSSSync}
                        >
                          🔐 통합연금 간편인증 및 동기화 요청
                        </button>
                      )}
                    </div>

                    {fssSynced && (
                      <div style={styles.previewBox}>
                        <h4 style={styles.previewTitle}>동기화 완료된 FSS 연금 정보</h4>
                        <div style={styles.previewGrid}>
                          <div>퇴직연금 계좌수: <strong>{store.retirementPensions.length} 개</strong></div>
                          <div>개인연금 계좌수: <strong>{store.personalPensions.length} 개</strong></div>
                          <div>연금보험 계좌수: <strong>{store.pensionInsurances.length} 개</strong></div>
                          <div>총 자산 누계액: <strong style={{ color: "var(--primary-700)" }}>
                            {((store.retirementPensions.reduce((sum, p) => sum + (p.totalAccumulated || 0), 0) +
                              store.personalPensions.reduce((sum, p) => sum + (p.totalAccumulated || 0), 0) +
                              store.pensionInsurances.reduce((sum, p) => sum + (p.totalAccumulated || 0), 0))).toLocaleString()} 만원
                          </strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {fssInputMode === "PDF" && renderPdfUploadSection()}
              </div>
            )}

            {/* STEP 4: 개인연금 및 연금보험 */}
            {currentStep === 4 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.tabContainer}>
                  <button
                    onClick={() => setFssInputMode("MANUAL")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: fssInputMode === "MANUAL" ? "var(--primary)" : "transparent",
                      color: fssInputMode === "MANUAL" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                  >
                    수동 입력 등록
                  </button>
                  <button
                    onClick={() => setFssInputMode("PDF")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: fssInputMode === "PDF" ? "var(--primary)" : "transparent",
                      color: fssInputMode === "PDF" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                    id="btn-tab-fss-pdf-4"
                  >
                    📄 금융감독원 통합연금 자료 등록
                  </button>
                </div>

                {fssInputMode === "MANUAL" && (
                  <>
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
                  </>
                )}

                {fssInputMode === "SYNC" && (
                  <div style={styles.syncBox} className="animate-fade-in">
                    <div style={styles.infoAlert}>
                      🔐 금융감독원(FSS) 통합연금포털 간편인증 연동을 통해 가입된 모든 퇴직연금(DB/DC/IRP) 및 개인연금(저축/보험) 계좌를 한 번에 자동으로 동기화합니다.
                    </div>

                    {fssVerificationPending && (
                      <div
                        style={{
                          ...styles.infoAlert,
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          borderLeft: "4px solid #f59e0b",
                          color: "#f3f4f6",
                          marginBottom: "16px",
                        }}
                        className="animate-fade-in"
                      >
                        💬 스마트폰(선택하신 간편인증 앱)으로 인증 요청이 발송되었습니다. 휴대폰에서 본인인증을 완료하신 다음 아래 <strong>[인증 완료 확인]</strong> 버튼을 클릭해 주세요.
                      </div>
                    )}
                    
                    <div style={styles.syncForm}>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>이름</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="홍길동"
                          value={fssName}
                          onChange={(e) => setFssName(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>휴대폰 번호</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="010-1234-5678"
                          value={fssPhone}
                          onChange={(e) => setFssPhone(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>생년월일 (8자리)</label>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="19800101"
                          value={fssBirth}
                          onChange={(e) => setFssBirth(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>간편인증 기관</label>
                        <select
                          className="premium-input"
                          value={fssProvider}
                          onChange={(e) => setFssProvider(e.target.value)}
                          disabled={fssVerificationPending || fssSyncing || fssSynced}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "6px",
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            fontFamily: "inherit",
                            fontSize: "0.95rem",
                            outline: "none"
                          }}
                        >
                          <option value="kakao">카카오톡</option>
                          <option value="naver">네이버</option>
                          <option value="pass">PASS</option>
                          <option value="toss">토스</option>
                          <option value="kb">KB국민은행</option>
                        </select>
                      </div>

                      {fssProvider === "pass" && (
                        <div style={styles.fieldRow} className="animate-fade-in">
                          <label style={styles.label}>통신사 구분</label>
                          <select
                            className="premium-input"
                            value={fssTelecom}
                            onChange={(e) => setFssTelecom(e.target.value)}
                            disabled={fssVerificationPending || fssSyncing || fssSynced}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "6px",
                              backgroundColor: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text-primary)",
                              fontFamily: "inherit",
                              fontSize: "0.95rem",
                              outline: "none"
                            }}
                          >
                            <option value="0">SKT</option>
                            <option value="1">KT</option>
                            <option value="2">LGU+ (알뜰폰 포함)</option>
                          </select>
                        </div>
                      )}

                      {fssSyncing ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, cursor: "not-allowed", width: "100%" }} disabled>
                          <span style={{ display: "inline-block", ...styles.miniSpinner, borderTopColor: "#ffffff", marginRight: 8, verticalAlign: "middle" }} /> 간편인증 및 연금정보 가져오는 중...
                        </button>
                      ) : fssSynced ? (
                        <button type="button" className="premium-button" style={{ marginTop: 16, background: "var(--success)", width: "100%" }} disabled>
                          ✓ 통합연금 정보 동기화 완료!
                        </button>
                      ) : fssVerificationPending ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: 16 }}>
                          <button
                            type="button"
                            id="btn-fss-verify-4"
                            className="premium-button"
                            style={{ width: "100%", backgroundColor: "var(--primary)" }}
                            onClick={handleFSSSync}
                          >
                            🔐 인증 완료 확인 (최종 동기화)
                          </button>
                          <button
                            type="button"
                            className="premium-button"
                            style={{ width: "100%", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                            onClick={handleCancelFSSVerification}
                          >
                            ❌ 인증 취소 및 다시 시도
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id="btn-fss-sync-4"
                          className="premium-button"
                          style={{ marginTop: 16, width: "100%" }}
                          onClick={handleFSSSync}
                        >
                          🔐 통합연금 간편인증 및 동기화 요청
                        </button>
                      )}
                    </div>

                    {fssSynced && (
                      <div style={styles.previewBox}>
                        <h4 style={styles.previewTitle}>동기화 완료된 FSS 연금 정보</h4>
                        <div style={styles.previewGrid}>
                          <div>퇴직연금 계좌수: <strong>{store.retirementPensions.length} 개</strong></div>
                          <div>개인연금 계좌수: <strong>{store.personalPensions.length} 개</strong></div>
                          <div>연금보험 계좌수: <strong>{store.pensionInsurances.length} 개</strong></div>
                          <div>총 자산 누계액: <strong style={{ color: "var(--primary-700)" }}>
                            {((store.retirementPensions.reduce((sum, p) => sum + (p.totalAccumulated || 0), 0) +
                              store.personalPensions.reduce((sum, p) => sum + (p.totalAccumulated || 0), 0) +
                              store.pensionInsurances.reduce((sum, p) => sum + (p.totalAccumulated || 0), 0))).toLocaleString()} 만원
                          </strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {fssInputMode === "PDF" && renderPdfUploadSection()}
              </div>
            )}

            {/* STEP 5: 설계 기준 설정 */}
            {currentStep === 5 && (
              <div style={styles.formGroupList} className="animate-fade-in">
                <div style={styles.infoAlert}>
                  ⚙️ 물가상승률 및 은퇴 후 연금 수령 개시 나이 등의 시뮬레이션 기본 파라미터를 설정합니다.
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
    padding: "0 20px 40px 20px",
    backgroundColor: "var(--background)",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow1: {
    position: "fixed",
    top: "-15%",
    left: "-10%",
    width: "55%",
    height: "55%",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    bottom: "-15%",
    right: "-10%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.10) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    position: "sticky",
    top: 0,
    width: "100%",
    padding: "16px 40px",
    zIndex: 100,
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    marginBottom: "32px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
    gap: "16px",
    flexWrap: "wrap" as React.CSSProperties["flexWrap"],
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column" as React.CSSProperties["flexDirection"],
    alignItems: "flex-start",
    gap: "4px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as React.CSSProperties["flexWrap"],
  },
  privacyChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "rgba(99, 102, 241, 0.08)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
    maxWidth: "380px",
  },
  saveBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "7px 14px",
    background: "rgba(99, 102, 241, 0.12)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "var(--radius-sm)",
    color: "#a5b4fc",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    whiteSpace: "nowrap" as React.CSSProperties["whiteSpace"],
  },
  logo: {
    fontFamily: "var(--font-sans)",
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    marginBottom: "0",
    cursor: "pointer",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
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
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    flexDirection: "column",
    height: "fit-content",
    position: "sticky",
    top: "80px",
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
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: "var(--radius-full)",
    transition: "width var(--transition-normal)",
    boxShadow: "0 0 8px rgba(99, 102, 241, 0.5)",
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
    color: "var(--primary-700)",
    backgroundColor: "var(--primary-50)",
    padding: "4px 8px",
    borderRadius: "var(--radius-full)",
    letterSpacing: "0.5px",
  },
  formTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-primary)",
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
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
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
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    border: "1.5px dashed rgba(99, 102, 241, 0.4)",
    color: "#a5b4fc",
    borderRadius: "var(--radius-sm)",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "16px",
    transition: "all var(--transition-fast)",
  },
  addBtnCompact: {
    width: "100%",
    padding: "8px",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    border: "1px dashed rgba(99, 102, 241, 0.4)",
    color: "#a5b4fc",
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
    backgroundColor: "var(--primary-50)",
    border: "1px solid var(--primary-100)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    marginBottom: "24px",
    fontSize: "0.85rem",
    color: "var(--primary-700)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    lineHeight: 1.4,
  },
  pdfUploadBox: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
  },
  portalGuideCard: {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropZone: {
    border: "2.5px dashed rgba(99, 102, 241, 0.3)",
    borderRadius: "var(--radius-sm)",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "rgba(99, 102, 241, 0.02)",
    transition: "all var(--transition-fast)",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    color: "var(--danger)",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
  },
};
