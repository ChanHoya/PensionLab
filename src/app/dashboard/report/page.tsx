"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { runPensionSimulation } from "@/services/pensionCalculator";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = usePensionStore();
  const [isMounted, setIsMounted] = useState(false);

  // Get payment query params (optional now)
  const orderId = searchParams.get("orderId") || "PL-FREE-" + Math.floor(100000 + Math.random() * 900000);
  const paymentKey = searchParams.get("paymentKey") || "free_access";
  const amount = searchParams.get("amount") || "0";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>보고서 엔진을 준비하는 중...</p>
      </div>
    );
  }

  // Run the simulation based on store states
  const simulation = runPensionSimulation(
    store.nationalPension,
    store.basicPension,
    store.retirementPensions,
    store.personalPensions,
    store.pensionInsurances,
    store.simulationParams
  );

  const {
    currentAge,
    yearsToRetire,
    totalAccumulatedAtRetirement,
    monthlyAnnuityAtRetirement,
    nationalPensionPremiumIncreaseTotal,
    cashFlows,
  } = simulation;

  const hasNational = cashFlows.some((cf) => (cf.national || 0) > 0);
  const hasBasic = cashFlows.some((cf) => (cf.basic || 0) > 0);
  const hasRetirement = cashFlows.some((cf) => (cf.retirement || 0) > 0);
  const hasPersonal = cashFlows.some((cf) => (cf.personal || 0) > 0);
  const hasInsurance = cashFlows.some((cf) => (cf.insurance || 0) > 0);

  // Pie Chart Data: 은퇴 자산 구성 비율
  const dbLump = store.retirementPensions
    .filter(r => r.pensionType === "DB")
    .reduce((sum, r) => sum + (r.avgSalary || 0) * ((r.yearsOfService || 0) + yearsToRetire), 0);
  const dcLump = store.retirementPensions
    .filter(r => r.pensionType !== "DB")
    .reduce((sum, r) => sum + (r.totalAccumulated || 0), 0);
  const personalLump = store.personalPensions.reduce((sum, p) => sum + p.totalAccumulated, 0);
  const insuranceLump = store.pensionInsurances.reduce((sum, i) => sum + i.totalAccumulated, 0);

  const pieData = [
    { name: "퇴직연금 (DB)", value: Math.round(dbLump), color: "#1e3a5f" },
    { name: "퇴직연금 (DC/IRP)", value: Math.round(dcLump), color: "#2c5282" },
    { name: "개인연금저축", value: Math.round(personalLump), color: "#00b894" },
    { name: "연금보험", value: Math.round(insuranceLump), color: "#f39c12" },
  ].filter(item => item.value > 0);

  const hasAssets = pieData.length > 0;

  // Living cost assessment (assume standard middle class retirement cost: 2.5 million KRW / month)
  const targetAnnuity = 250; // 250만원
  const deficit = targetAnnuity - monthlyAnnuityAtRetirement;
  
  let grade = "준비 필요";
  let gradeColor = "var(--warning)";
  let gradeText = "은퇴 후 기본적인 생활비(250만원) 마련에 추가 보완책이 필요합니다.";
  
  if (monthlyAnnuityAtRetirement >= targetAnnuity) {
    grade = "안정";
    gradeColor = "var(--secondary)";
    gradeText = "목표 연금액(월 250만원)을 달성하여 노후 준비 수준이 훌륭합니다.";
  } else if (monthlyAnnuityAtRetirement < 120) {
    grade = "보완 시급";
    gradeColor = "var(--danger)";
    gradeText = "월 연금 수령액이 기초 생활비에 미치지 못하므로 즉각적인 납입액 확대가 시급합니다.";
  }

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={styles.pageContainer}>
      {/* Top Banner (Hidden on Print) */}
      <div style={styles.actionBanner} className="no-print">
        <div style={styles.bannerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={styles.tossBadge}>무료 분석 보고서</span>
            <span style={styles.bannerInfo}>
              보고서 번호: <strong>{orderId}</strong>
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="premium-button"
              style={{ background: "var(--gradient-secondary)", padding: "10px 20px" }}
            >
              🖨️ PDF 저장 및 인쇄
            </button>
            <Link
              href="/dashboard"
              className="premium-button-secondary"
              style={{ padding: "10px 20px", textDecoration: "none" }}
            >
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>

      {/* Main Report Container */}
      <div style={styles.reportSheet}>
        {/* Page 1: Cover & Overview */}
        <div style={styles.reportPage} className="print-page">
          <div style={styles.reportHeader}>
            <div style={styles.logo}>Pension<span style={{ color: "var(--secondary)" }}>Lab</span></div>
            <div style={styles.docId}>Report ID: PL-2026-{orderId?.substring(6, 12)}</div>
          </div>

          <div style={styles.coverTitleBox}>
            <span style={styles.reportSub}>AI PRESCRIBED RETIREMENT REPORT</span>
            <h1 style={styles.reportTitle}>은퇴 자산 종합 진단<br />및 AI 정밀 처방 보고서</h1>
            <div style={styles.divider} />
          </div>

          <div style={styles.profileBox}>
            <div style={styles.profileRow}>
              <span style={styles.profileLabel}>진단 대상자</span>
              <span style={styles.profileValue}>PensionLab 회원님</span>
            </div>
            <div style={styles.profileRow}>
              <span style={styles.profileLabel}>현재 나이 / 은퇴 나이</span>
              <span style={styles.profileValue}>{currentAge}세 / {store.simulationParams.retirementAge}세 (준비 기간 {yearsToRetire}년)</span>
            </div>
            <div style={styles.profileRow}>
              <span style={styles.profileLabel}>진단 기준일</span>
              <span style={styles.profileValue}>{todayStr}</span>
            </div>
          </div>

          <div style={styles.gradeSection}>
            <div style={styles.gradeTitle}>종합 노후 대비 등급</div>
            <div style={{ ...styles.gradeBadge, backgroundColor: gradeColor }}>{grade}</div>
            <p style={styles.gradeDesc}>{gradeText}</p>
          </div>

          <div style={styles.summaryTable}>
            <div style={styles.tableRowHeader}>
              <div style={styles.tableCell}>분석 항목</div>
              <div style={styles.tableCell}>진단 및 시뮬레이션 결과</div>
            </div>
            <div style={styles.tableRow}>
              <div style={styles.tableCellLabel}>은퇴 후 예상 월 수령액</div>
              <div style={styles.tableCellVal}>
                <strong>{monthlyAnnuityAtRetirement.toLocaleString()}</strong> 만원 / 월
              </div>
            </div>
            <div style={styles.tableRow}>
              <div style={styles.tableCellLabel}>목표 대비 과부족액 (기준 250만)</div>
              <div style={{ ...styles.tableCellVal, color: deficit > 0 ? "var(--danger)" : "var(--success)" }}>
                {deficit > 0 ? `${deficit.toLocaleString()} 만원 부족` : "은퇴 자금 충족"}
              </div>
            </div>
            <div style={styles.tableRow}>
              <div style={styles.tableCellLabel}>은퇴 시 적립 자산 규모</div>
              <div style={styles.tableCellVal}>
                {totalAccumulatedAtRetirement >= 10000 
                  ? `${(totalAccumulatedAtRetirement / 10000).toFixed(2)} 억원`
                  : `${totalAccumulatedAtRetirement.toLocaleString()} 만원`
                }
              </div>
            </div>
          </div>
          
          <div style={styles.footerNote}>PensionLab AI Advisory Group</div>
        </div>

        {/* Page 2: Charts & Details */}
        <div style={styles.reportPage} className="print-page">
          <h2 style={styles.sectionTitle}>1. 은퇴 자산 분산도 및 수령 흐름 시뮬레이션</h2>
          <div style={styles.miniDivider} />

          <div style={styles.reportChartsGrid}>
            <div style={styles.reportChartCard}>
              <h4 style={styles.reportChartTitle}>사적연금 은퇴 시점 적립 비율</h4>
              <div style={{ height: 200, width: "100%" }}>
                {hasAssets ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={24} iconSize={8} style={{ fontSize: "0.75rem" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={styles.emptyChart}>사적연금 적립 데이터 없음</div>
                )}
              </div>
            </div>

            <div style={styles.reportChartCard}>
              <h4 style={styles.reportChartTitle}>연령별 예상 월 연금 수령액 (3층 구조)</h4>
              <div style={{ height: 210, width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart
                    data={cashFlows.filter((cf) => cf.age >= store.simulationParams.retirementAge - 1)}
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="age" tickLine={false} style={{ fontSize: "0.75rem" }} />
                    <YAxis tickLine={false} style={{ fontSize: "0.75rem" }} />
                    {hasNational && <Area type="monotone" dataKey="national" name="국민" stackId="1" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.6} isAnimationActive={false} />}
                    {hasBasic && <Area type="monotone" dataKey="basic" name="기초" stackId="1" stroke="var(--info)" fill="var(--info)" fillOpacity={0.6} isAnimationActive={false} />}
                    {hasRetirement && <Area type="monotone" dataKey="retirement" name="퇴직" stackId="1" stroke="#2c5282" fill="#2c5282" fillOpacity={0.6} isAnimationActive={false} />}
                    {hasPersonal && <Area type="monotone" dataKey="personal" name="개인" stackId="1" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.6} isAnimationActive={false} />}
                    {hasInsurance && <Area type="monotone" dataKey="insurance" name="보험" stackId="1" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.6} isAnimationActive={false} />}
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* 리포트용 1층 -> 2층 -> 3층 정렬 범례 */}
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.7rem", marginTop: "8px" }}>
                  {hasNational && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, backgroundColor: "var(--primary)", borderRadius: "50%" }} />국민</span>}
                  {hasBasic && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, backgroundColor: "var(--info)", borderRadius: "50%" }} />기초</span>}
                  {hasRetirement && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, backgroundColor: "#2c5282", borderRadius: "50%" }} />퇴직</span>}
                  {hasPersonal && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, backgroundColor: "var(--secondary)", borderRadius: "50%" }} />개인</span>}
                  {hasInsurance && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, backgroundColor: "var(--accent)", borderRadius: "50%" }} />보험</span>}
                </div>
              </div>
            </div>
          </div>

          <h2 style={{ ...styles.sectionTitle, marginTop: 40 }}>2. 2026년 국민연금 개혁안 영향도 분석</h2>
          <div style={styles.miniDivider} />
          
          <div style={styles.reformImpactBox}>
            <p style={{ lineHeight: 1.6, color: "var(--text-primary)" }}>
              2026년부터 실행되는 연금 개혁안에 따라 국민연금 보험료율이 기존 <strong>9.0%</strong>에서 <strong>13.0%</strong>로 인상됩니다.
            </p>
            <div style={styles.impactCardRow}>
              <div style={styles.impactCard}>
                <span style={styles.impactLabel}>인상 가중 보험료율</span>
                <span style={styles.impactVal}>+ 4.0%p</span>
              </div>
              <div style={styles.impactCard}>
                <span style={styles.impactLabel}>은퇴 시까지 추가 보험료</span>
                <span style={{ ...styles.impactVal, color: "var(--danger)" }}>
                  {nationalPensionPremiumIncreaseTotal.toLocaleString()} 만원
                </span>
              </div>
            </div>
            <p style={styles.impactSubText}>
              ※ 회원님의 소득과 나이를 고려한 동적 누적 인상 시뮬레이션 결과입니다. 
              세대별 차등 속도가 적용되어 회원님의 나이에 따른 연차별 인상율을 가중 반영하여 설계되었습니다.
            </p>
          </div>

          <div style={styles.footerNote}>PensionLab AI Advisory Group</div>
        </div>

        {/* Page 3: Action Plan / Prescription */}
        <div style={styles.reportPage} className="print-page">
          <h2 style={styles.sectionTitle}>3. AI 전문가 연금 진단 처방전</h2>
          <div style={styles.miniDivider} />

          <div style={styles.prescriptionContainer}>
            <div style={styles.prescriptionItem}>
              <h4 style={styles.prescTitle}>💊 [1층 국민연금 감액 방지 및 납입 강화 처방]</h4>
              <p style={styles.prescBody}>
                국민연금 가입개월수가 {store.nationalPension.contributionMonths}개월인 상태입니다. 
                가입기간 20년을 채우는 것이 연금 수령의 기본 효율을 높이는 가장 확실한 길입니다. 
                향후 소득 활동이 없더라도 &apos;임의가입&apos; 제도를 이용해 가입기간을 {Math.max(240, store.nationalPension.contributionMonths + 60)}개월 이상으로 늘리는 것을 권장합니다.
              </p>
            </div>

            <div style={styles.prescriptionItem}>
              <h4 style={styles.prescTitle}>💊 [2층 퇴직연금 운용 최적화 처방]</h4>
              {store.retirementPensions.some(r => r.pensionType === "DB") ? (
                <p style={styles.prescBody}>
                  회원님은 확정급여형(DB) 퇴직연금을 유지 중이십니다. 임금상승률이 연 3% 이상일 경우 대기업 장기근속 시 DB형 유지가 유리합니다. 
                  다만, 임금상승률이 둔화되는 피크 시점 직전이나 투자 시장에서 꾸준히 4% 이상의 수익률을 낼 수 있다면, 
                  확정기여형(DC)으로 전환하여 디폴트옵션(사전지정운용제도)의 타겟데이트펀드(TDF) 투자를 적용할 것을 제안합니다.
                </p>
              ) : (
                <p style={styles.prescBody}>
                  회원님은 확정기여형(DC/IRP) 퇴직연금을 운용 중이십니다. 
                  연금 시뮬레이션 계산 시 투자 수익률이 중요한 변수입니다. 
                  원리금 보장형 예금에만 묶어두는 경우 장기 복리 효과를 보기 어렵습니다. 
                  글로벌 자산배분 TDF 펀드나 미국 지수 추종 ETF 비중을 40% 이상 유지하여 기대 수익률을 연 4.5% 수준으로 설계하는 처방을 드립니다.
                </p>
              )}
            </div>

            <div style={styles.prescriptionItem}>
              <h4 style={styles.prescTitle}>💊 [3층 사적연금 세제 혜택 극대화 처방]</h4>
              <p style={styles.prescBody}>
                연금저축과 IRP 계좌를 합산해 매년 최대 900만원까지 연령/소득에 따라 13.2% ~ 16.5%의 세액공제(최대 148.5만원 환급) 혜택을 챙기셔야 합니다.
                {deficit > 0 ? (
                  ` 현재 부족한 노후 연금액 월 ${deficit.toLocaleString()}만원을 채우기 위해, 연금저축펀드 계좌 개설 후 매달 추가로 30~50만원의 적립식 납입을 적극 권장드립니다.`
                ) : (
                  " 자산 분산 측면에서 연금저축을 단순 보험 형태(원금 보장 위주)에서 ETF 거래가 가능한 펀드 형태로 포트폴리오를 전환하여 복리 혜택을 높이시는 것을 추천합니다."
                )}
              </p>
            </div>

            <div style={styles.prescriptionItem}>
              <h4 style={styles.prescTitle}>💊 [개인 맞춤형 노후 연금 인출 & 절세 컨설팅 처방]</h4>
              <p style={styles.prescBody}>
                회원님의 기초 프로필(현재 {currentAge}세, 은퇴 {store.simulationParams.retirementAge}세 목표)과 지출 목표를 분석한 결과, 다음의 인출 순서 및 절세 전략을 처방합니다.
              </p>
              <ul style={{ ...styles.prescBody, listStyleType: "disc", paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li style={{ marginBottom: "6px" }}>
                  <strong>인출 패턴 설계 ({store.simulationParams.decumulationStrategy === "DECREASING" ? "활동기 집중형 체감식" : "동일 금액형 정액식"})</strong>: 
                  {store.simulationParams.decumulationStrategy === "DECREASING" ? (
                    "소비 활동이 왕성한 은퇴 초반 5년 동안 수령 비중을 120%로 높게 설정하고, 나이가 듦에 따라 100% ➔ 80% ➔ 60% ➔ 40%로 점차 인출액을 축소하는 '활동기 집중형 체감식 인출전략'이 설정되었습니다. 은퇴 초반 적극적인 소비 욕구를 반영하고 고령 시기 자연스러운 소비 감소에 맞춰 노후 자산을 보호하는 가장 합리적인 소비 패턴(Spending Smile)입니다."
                  ) : (
                    "매년 동일한 금액을 일정하게 인출하는 '동일 금액형 정액식 인출전략'이 설정되었습니다. 물가상승이나 건강 상태 변화에 따른 지출 변동이 적고 일정한 현금 흐름을 선호하는 고전적인 은퇴 인출 설계 방식입니다."
                  )}
                </li>
                <li style={{ marginBottom: "6px" }}>
                  <strong>은퇴 크레바스(소득 공백기) 극복</strong>: {store.simulationParams.retirementAge}세 은퇴 시점부터 국민연금이 개시되는 {store.simulationParams.nationalPensionStartAge}세까지의 
                  소득 공백기에는 <strong>퇴직연금(IRP)의 퇴직금 재원</strong>을 우선적으로 연금 수령(퇴직소득세 30% 감면)하여 생활비를 충당하고, 사적연금 인출은 최대한 이연할 것을 권장합니다.
                </li>
                <li style={{ marginBottom: "6px" }}>
                  <strong>사적연금 연 1,500만원 분리과세 한도 관리</strong>: 연금저축펀드 및 IRP 추가납입금에서 수령하는 사적연금은 <strong>연간 총 1,500만원 이하</strong>로 수령 기간을 조율하여 신청하십시오. 
                  연 1,500만원을 초과하면 종합소득세율 합산 또는 16.5% 분리과세가 적용되나, 한도 내에서는 3.3% ~ 5.5%의 저율 연금소득세만 부과되므로 매년 약 100만~150만원 상당의 세금을 아낄 수 있습니다.
                </li>
                {store.simulationParams.hasSpouse && (
                  <li style={{ marginBottom: "6px" }}>
                    <strong>배우자 공동 연금 설계</strong>: {store.simulationParams.spouseAge ? `배우자(현재 ${store.simulationParams.spouseAge}세)와의 나이 차이를 활용하여` : "배우자와 함께"} 
                    연금 수령 한도를 각각 인당 연 1,500만원씩 분산하여 인출 한도를 설정하면, 부부 합산 연 3,000만원까지 저율 과세 혜택을 2배로 확장할 수 있습니다.
                  </li>
                )}
                {store.simulationParams.childrenCount > 0 && (
                  <li style={{ marginBottom: "6px" }}>
                    <strong>자녀 지원비({(store.simulationParams.childSupportExpense || 0).toLocaleString()}만원) 및 비연금 자산 활용</strong>: 
                    자녀 지원 예정액에 대비하기 위해, 은퇴 시점 비연금 자산({(store.simulationParams.nonPensionAssets || 0).toLocaleString()}만원) 중 주택 자산이 있다면 <strong>주택연금(종신형)</strong> 활용을 적극 고려하십시오. 
                    연금 수령액은 건보료나 소득세 부과 대상에서 제외되므로 건보료 피부양자 자격 유지(연 소득 2,000만원 이하)에 매우 유리합니다.
                  </li>
                )}
                <li style={{ marginBottom: "6px" }}>
                  <strong>의료비 리스크 관리</strong>: 노후 대비 의료비({(store.simulationParams.annualMedicalExpense || 0).toLocaleString()}만원/년) 목적으로는 IRP 계좌의 &apos;의료비 인출&apos; 제도를 활용하십시오. 
                  본인 부담 의료비가 일정 금액을 초과하는 경우, 연금 수령 한도와 무관하게 연금외수령이 아닌 연금소득(3.3~5.5%)으로 취급되어 중도인출 페널티(16.5%) 없이 세금을 대폭 아낄 수 있습니다.
                </li>
              </ul>
            </div>
          </div>

          <div style={styles.signatureSection}>
            <div style={styles.sigDate}>{todayStr}</div>
            <div style={styles.sigTitle}>PensionLab 은퇴 자산 포트폴리오 분석 연구소</div>
            <div style={styles.sigStamp}>[ 직인생략 ]</div>
          </div>

          <div style={styles.footerNote}>PensionLab AI Advisory Group</div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>보고서 엔진을 준비하는 중...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--background)",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid var(--border)",
    borderTop: "5px solid var(--primary)",
    borderRadius: "50%",
    animation: "pulse-subtle 1.5s infinite linear",
  },
  actionBanner: {
    position: "sticky",
    top: 0,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border)",
    zIndex: 100,
    padding: "16px 20px",
    display: "flex",
    justifyContent: "center",
  },
  bannerContent: {
    maxWidth: "1000px",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tossBadge: {
    backgroundColor: "#e8f0fe",
    color: "#0050ff",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
  },
  bannerInfo: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
  },
  reportSheet: {
    width: "100%",
    maxWidth: "840px",
    display: "flex",
    flexDirection: "column",
    gap: "30px",
    padding: "40px 20px 80px 20px",
  },
  reportPage: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
    padding: "60px 50px",
    minHeight: "1100px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1.5px solid var(--primary)",
    paddingBottom: "16px",
    marginBottom: "40px",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "var(--primary)",
    letterSpacing: "-0.5px",
  },
  docId: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    fontFamily: "monospace",
  },
  coverTitleBox: {
    marginTop: "80px",
    marginBottom: "50px",
  },
  reportSub: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--secondary)",
    letterSpacing: "2px",
  },
  reportTitle: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--primary-dark)",
    lineHeight: 1.3,
    marginTop: "12px",
  },
  divider: {
    height: "4px",
    width: "80px",
    backgroundColor: "var(--secondary)",
    marginTop: "30px",
  },
  profileBox: {
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "24px 30px",
    backgroundColor: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "50px",
  },
  profileRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.95rem",
  },
  profileLabel: {
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  profileValue: {
    color: "var(--text-primary)",
    fontWeight: 700,
  },
  gradeSection: {
    textAlign: "center",
    marginBottom: "50px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  gradeTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
    marginBottom: "12px",
  },
  gradeBadge: {
    color: "#ffffff",
    fontSize: "1.5rem",
    fontWeight: 800,
    padding: "10px 30px",
    borderRadius: "var(--radius-full)",
    display: "inline-block",
    boxShadow: "var(--shadow-sm)",
  },
  gradeDesc: {
    marginTop: "16px",
    fontSize: "0.95rem",
    color: "var(--text-primary)",
    maxWidth: "400px",
    lineHeight: 1.5,
  },
  summaryTable: {
    marginTop: "auto",
    border: "1.5px solid var(--primary)",
    borderRadius: "var(--radius-sm)",
    overflow: "hidden",
  },
  tableRowHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    backgroundColor: "var(--primary)",
    color: "#ffffff",
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: "0.9rem",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderBottom: "1px solid var(--border)",
    padding: "14px 20px",
    fontSize: "0.95rem",
  },
  tableCell: {
    textAlign: "left",
  },
  tableCellLabel: {
    color: "var(--text-secondary)",
    fontWeight: 600,
  },
  tableCellVal: {
    color: "var(--text-primary)",
    fontWeight: 700,
    textAlign: "right",
  },
  footerNote: {
    position: "absolute",
    bottom: "40px",
    left: "50px",
    right: "50px",
    borderTop: "1px solid var(--border)",
    paddingTop: "12px",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--primary-dark)",
  },
  miniDivider: {
    height: "2px",
    width: "40px",
    backgroundColor: "var(--primary)",
    margin: "12px 0 24px 0",
  },
  reportChartsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: "24px",
  },
  reportChartCard: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "20px",
    backgroundColor: "#ffffff",
  },
  reportChartTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
    marginBottom: "16px",
  },
  emptyChart: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
  },
  reformImpactBox: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "24px",
    backgroundColor: "#fff5f5",
  },
  impactCardRow: {
    display: "flex",
    gap: "16px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  impactCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    border: "1px solid #feb2b2",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  impactLabel: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
    marginBottom: "6px",
  },
  impactVal: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  impactSubText: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  },
  prescriptionContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  prescriptionItem: {
    borderLeft: "4px solid var(--secondary)",
    paddingLeft: "20px",
  },
  prescTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--primary-dark)",
    marginBottom: "8px",
  },
  prescBody: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  signatureSection: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "40px",
  },
  sigDate: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    marginBottom: "12px",
  },
  sigTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--primary-dark)",
  },
  sigStamp: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "8px",
    letterSpacing: "4px",
  },
};
