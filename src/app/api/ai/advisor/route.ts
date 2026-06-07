import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { runPensionSimulation } from "@/services/pensionCalculator";

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      nationalPension,
      basicPension,
      retirementPensions = [],
      personalPensions = [],
      pensionInsurances = [],
      simulationParams,
    } = payload;

    if (!simulationParams) {
      return NextResponse.json(
        { error: "시뮬레이션 매개변수(simulationParams)가 필요합니다." },
        { status: 400 }
      );
    }

    // Run the engine simulation to calculate accurate total accumulated and monthly annuity values
    const simulation = runPensionSimulation(
      nationalPension || {
        contributionMonths: 0,
        totalPaidAmount: 0,
        currentStandardMonthlyIncome: 0,
        expectedTotalContributionMonths: 0,
        expectedMonthlyPension: 0,
        totalExpectedPremium: 0,
        basicPensionAmount: 0,
        aValue: 0,
        bValue: 0,
      },
      basicPension || {
        householdType: "SINGLE",
        recognizedIncome: 0,
        expectedEligibility: false,
        expectedMonthlyAmount: 0,
      },
      retirementPensions,
      personalPensions,
      pensionInsurances,
      simulationParams
    );

    // 1. Construct prompt using the detailed state data
    const prompt = `
[사용자 프로필 및 연금 시뮬레이션 데이터]
- 현재 나이: ${simulationParams.currentAge}세
- 은퇴 희망 나이: ${simulationParams.retirementAge}세 (은퇴까지 남은 기간: ${Math.max(0, simulationParams.retirementAge - simulationParams.currentAge)}년)
- 기대 수명: ${simulationParams.expectedLifeExpectancy}세
- 목표 생활비: 월 ${simulationParams.targetMonthlySpending}만원
- 최소 생활비: 월 ${simulationParams.minMonthlySpending}만원
- 물가상승률 설정: 연 ${simulationParams.inflationRate}%
- 은퇴 인출 전략: ${simulationParams.decumulationStrategy === "DECREASING" ? "활동기 집중형 (체감식: 은퇴 초반 120% 인출 후 감액)" : "동일 금액형 (정액식)"}
- 비연금 금융자산: ${simulationParams.nonPensionAssets}만원

[1층 국민연금 / 기초연금]
- 국민연금 예상 수령액: 월 ${nationalPension?.expectedMonthlyPension || 0}만원 (개시 연령: ${simulationParams.nationalPensionStartAge}세)
- 국민연금 납부 개월수: ${nationalPension?.contributionMonths || 0}개월 / 예상 총 납부: ${nationalPension?.expectedTotalContributionMonths || 0}개월
- 기초연금 수급 여부: ${basicPension?.expectedEligibility ? "대상자" : "대상 외"} (예상 수령액: 월 ${basicPension?.expectedMonthlyAmount || 0}만원)

[2층 퇴직연금]
${retirementPensions.length === 0 ? "- 등록된 퇴직연금 없음" : retirementPensions.map((p: any, idx: number) => `
- ${idx + 1}. 유형: ${p.pensionType} ${p.pensionType === "DB" ? `(평균급여: ${p.avgSalary || 0}만원, 근속연수: ${p.yearsOfService || 0}년, 임금상승률: ${p.salaryGrowthRate || 0}%)` : `(누적적립금: ${p.totalAccumulated || 0}만원, 월 납입액: ${p.monthlyContribution || 0}만원, 투자수익률: ${p.expectedReturnRate || 0}%)`}`).join("\n")}

[3층 개인연금 / 연금보험]
${personalPensions.length === 0 ? "- 등록된 개인연금 없음" : personalPensions.map((p: any, idx: number) => `
- ${idx + 1}. 개인연금유형: ${p.savingsType} (누적적립금: ${p.totalAccumulated || 0}만원, 월/연 납입액: ${p.monthlyAnnualContribution || 0}만원, 개시 희망나이: ${p.desiredStartAge}세, 수령기간: ${p.receivingPeriod}년)`).join("\n")}
${pensionInsurances.length === 0 ? "- 등록된 연금보험 없음" : pensionInsurances.map((p: any, idx: number) => `
- ${idx + 1}. 연금보험명: ${p.insuranceType} (누적적립금: ${p.totalAccumulated || 0}만원, 월 납입액: ${p.monthlyPayment || 0}만원, 납입기간: ${p.paymentPeriod}년, 공시이율: ${p.expectedDeclaredRate || 0}%)`).join("\n")}

당신은 대한민국 3층 연금 및 은퇴 자산 포트폴리오를 설계하는 최고 수준의 AI 자산 관리사(Financial Planner)입니다.
위 데이터를 바탕으로 사용자를 위한 **은퇴 자산 포트폴리오 진단 및 연금 리밸런싱 처방전**을 정밀하게 분석해 주십시오.

반드시 다음 4가지 핵심 영역에 대해 상세한 의견과 개선 방향을 제시해 주세요:
1. **은퇴 준비도 종합 평가**: 은퇴 시점 예상 총자산과 연금 월 수령액이 목표/최소 생활비 대비 충분한지 분석 (소득 대체율 진단)
2. **소득 크레바스(소득 공백기) 진단 및 인출 순서 최적화**: 은퇴 나이(${simulationParams.retirementAge}세)부터 국민연금 개시 나이(${simulationParams.nationalPensionStartAge}세) 사이의 소득 공백기 대응 방안 및 세금을 최소화하는 최적의 인출 전략 (퇴직연금, 개인연금, 공적연금의 수령 순서 및 시기 배치)
3. **자산군 리밸런싱 및 투자 제안**: 남은 은퇴 준비 기간 및 나이를 고려하여, 위험자산과 안전자산의 비율 제안 및 안정적인 배당 흐름을 창출하는 자산군(TDF, 미국 고배당 커버드콜 ETF, 리츠 등) 추천
4. **인출 전략 맞춤 조언**: 사용자가 선택한 인출 전략(${simulationParams.decumulationStrategy === "DECREASING" ? "활동기 집중형" : "동일 금액형"})에 따른 지출 예산 관리법 및 리스크(장수 리스크, 인플레이션 위험) 방어 가이드

[답변 작성 형식 지침]
- 당신의 깊이 있는 생각 흐름과 대안 검토 과정은 반드시 \`<think>\`와 \`</think>\` 태그 내에 한글로 자유롭게 상세히 작성해 주십시오.
- 태그 밖에는 최종 사용자에게 보여줄 가독성 높은 마크다운 형식의 깔끔하고 premium 한 처방전(보고서 스타일)만 작성해 주십시오. 사용자에게 설명하듯 신뢰성 있고 전문적인 어조로 설명해 주세요.
`;

    let fullContent = "";
    let isAIFlowSuccess = false;
    let geminiApiErrorDetail = "";

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: "당신은 은퇴 자산 설계 및 3층 연금 구조 분석에 특화된 대한민국 최고의 AI 재무 설계사입니다. 사용자의 질문에 대해 분석적이고 전문적인 견해를 제시합니다.",
        });

        const result = await model.generateContent(prompt);
        fullContent = result.response.text();
        isAIFlowSuccess = true;
      } catch (aiError: any) {
        console.error("Gemini API call failed, falling back to local diagnosis generator:", aiError);
        geminiApiErrorDetail = aiError.message || String(aiError);
      }
    } else {
      geminiApiErrorDetail = "GEMINI_API_KEY 환경변수가 정의되지 않았습니다. .env 파일을 다시 확인하시고, 새로 등록하셨다면 개발 서버(npm run dev)를 반드시 재시작해 주십시오.";
    }

    let thinking = "";
    let recommendation = "";

    if (isAIFlowSuccess && fullContent) {
      const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        thinking = thinkMatch[1].trim();
        recommendation = fullContent.replace(/<think>[\s\S]*?<\/think>/, "").trim();
      } else {
        recommendation = fullContent.trim();
      }
    } else {
      // High-fidelity local fallback generator
      const totalAssetStr = simulation.totalAccumulatedAtRetirement >= 10000
        ? `${(simulation.totalAccumulatedAtRetirement / 10000).toFixed(2)}억원`
        : `${simulation.totalAccumulatedAtRetirement.toLocaleString()}만원`;

      const monthlyAnnuityStr = `${simulation.monthlyAnnuityAtRetirement.toLocaleString()}만원`;
      const targetSpending = simulationParams.targetMonthlySpending || 300;
      const minSpending = simulationParams.minMonthlySpending || 200;
      const targetPercent = Math.round((simulation.monthlyAnnuityAtRetirement / targetSpending) * 100);
      const minPercent = Math.round((simulation.monthlyAnnuityAtRetirement / minSpending) * 100);

      const isDecreasing = simulationParams.decumulationStrategy === "DECREASING";
      const crevasseYears = Math.max(0, simulationParams.nationalPensionStartAge - simulationParams.retirementAge);

      let adequacyStatus = "";
      if (targetPercent >= 100) {
        adequacyStatus = "목표 생활비를 상회하는 여유로운 상태입니다. 은퇴 초반 적극적인 여가 생활과 투자 재조정을 고려해 볼 수 있습니다.";
      } else if (minPercent >= 100) {
        adequacyStatus = "최소 생활비는 충당되나 목표 생활비에 다소 미치지 못하는 상태입니다. 사적연금(연금저축/IRP) 추가 적립 또는 연금 펀드 수익률 개선을 권장합니다.";
      } else {
        adequacyStatus = "최소 생활비에도 미치지 못해 노후 자산 고갈 위험이 있는 상태입니다. 국민연금 개시 전까지 소득 공백기를 메울 연금 자산의 추가 납입 또는 주택연금 등의 활용이 요구됩니다.";
      }

      thinking = `[Gemini API 연동 실패/미등록 디버그 정보]
- 원인: ${geminiApiErrorDetail}

1. 사용자 연령 및 은퇴 시점 시각화: 현재 나이 ${simulation.currentAge}세, 은퇴 희망 ${simulationParams.retirementAge}세로 준비 기간은 ${simulation.yearsToRetire}년입니다.
2. 3층 연금 및 비연금 자산 집계: 은퇴 시점 총 연금 자산은 ${totalAssetStr}이며, 예상 월 수령액은 ${monthlyAnnuityStr}입니다.
3. 소득 크레바스(소득 공백기) 분석: 은퇴 나이 ${simulationParams.retirementAge}세부터 국민연금 개시 ${simulationParams.nationalPensionStartAge}세까지 ${crevasseYears}년의 소득 공백이 식별되었습니다.
4. 인출 방식 검토: 사용자가 선택한 전략은 '${isDecreasing ? "활동기 집중형 체감식" : "동일 금액형 정액식"}'입니다.
5. 포트폴리오 리밸런싱 설계: 수익률 향상을 위해 위험자산/인컴자산/안전자산 비율을 20:40:40으로 권장합니다.
6. 구조화된 최종 마크다운 가이드 라인을 생성하여 Fallback 응답으로 바인딩합니다.`;

      let warningHeader = "⚠️ **[로컬 테스트 모드 - Gemini AI API 키 미등록 상태]**";
      if (geminiApiErrorDetail.includes("429") || geminiApiErrorDetail.toLowerCase().includes("quota")) {
        warningHeader = "⚠️ **[구글 Gemini API 무료 할당량(Quota) 초과 상태 - 로컬 Fallback 진단 제공]**\n\n현재 사용 중인 구글 API 키의 무료 호출 제한(429)이 초과되어 실시간 AI 생성이 일시 차단되었습니다. 안정적인 진단을 제공하기 위해 연금 분석 엔진 기반의 로컬 매칭형 처방전을 임시 제공합니다.";
      } else if (geminiApiErrorDetail) {
        warningHeader = `⚠️ **[로컬 테스트 모드 - Gemini AI API 연동 실패 상태]**\n\n(상세 에러: ${geminiApiErrorDetail})`;
      }

      recommendation = `${warningHeader}

회원님의 **3층 연금 구조 및 비연금 금융자산**을 다각도로 분석하여 도출한 리밸런싱 처방전입니다.

---

### 1. 은퇴 준비도 종합 평가 (소득 대체율 진단)
회원님의 은퇴 시점 예상 연금 자산 규모는 **${totalAssetStr}**이며, 은퇴 직후 예상되는 월 수령액은 **${monthlyAnnuityStr}**입니다.
- **목표 생활비(월 ${targetSpending}만원) 대비 달성율**: **${targetPercent}%**
- **최소 생활비(월 ${minSpending}만원) 대비 달성율**: **${minPercent}%**

현재 자산 구조는 **${adequacyStatus}** 은퇴 자금의 안정성을 높이기 위해 아래의 자산 재배치 및 인출 순서 조정을 제안합니다.

---

### 2. 소득 크레바스(소득 공백기) 진단 및 인출 순서 최적화
회원님의 은퇴 희망 나이는 **${simulationParams.retirementAge}세**이며, 국민연금 개시 연령은 **${simulationParams.nationalPensionStartAge}세**로, 총 **${crevasseYears}년의 소득 공백기(은퇴 크레바스)**가 존재합니다.
이 기간 동안 소득 공백을 메우고 세제 혜택을 극대화하기 위한 최적의 인출 순서는 다음과 같습니다:
1. **1단계 (소득 공백기)**: **퇴직연금(IRP)의 퇴직소득세 감면 재원**을 우선 인출하여 생활비의 기초를 다집니다. (연금 수령 시 퇴직소득세 30% 감면 효과 활용)
2. **2단계 (공적연금 개시 이후)**: **국민연금(월 ${nationalPension?.expectedMonthlyPension || 0}만원)**과 **기초연금**을 수급하며, 부족한 금액은 **개인연금저축/연금보험**을 통해 연간 1,500만원 분리과세 한도 내에서 인출합니다.
3. **3단계 (고령기)**: **비연금 자산(${(simulationParams.nonPensionAssets || 0).toLocaleString()}만원)** 중 주택이 있다면 주택연금(종신형)으로 전환하여 건보료 피부양자 자격을 유지하면서 종신 현금 흐름을 확보합니다.

---

### 3. 자산군 리밸런싱 및 투자 제안
현 포트폴리오의 투자 수익률을 개선하고 인플레이션을 방어하기 위해 다음과 같은 포트폴리오 리밸런싱을 제안합니다:
- **안전 자산 (40%)**: 확정금리형 예금 및 단기 채권 ETF (소득 공백기 생활비 인출용 안전 마진 확보)
- **배당/인컴 자산 (40%)**: 미국 배당성장형 ETF(예: SCHD) 및 글로벌 자산배분형 TDF (물가상승 방어 및 꾸준한 분배금 유입)
- **성장 자산 (20%)**: 미국 지수 추종 ETF(S&P 500, NASDAQ) 및 혁신성장주 포트폴리오 (자산 고갈 시점 지연)

---

### 4. 인출 전략 맞춤 조언 (${isDecreasing ? "활동기 집중형 체감식" : "동일 금액형 정액식"})
회원님께서 선택하신 인출 방식은 **${isDecreasing ? "활동기 집중형 (체감식: 은퇴 초반 120% 인출 후 감액)" : "동일 금액형 (정액식)"}**입니다.
- **인출 관리 처방**: ${isDecreasing ? "은퇴 후 첫 5년 동안은 수령액을 120%로 증액하여 활발한 여행 및 문화 활동에 집중하고, 이후 안정기에 접어들면서 점진적으로 줄여 80세 이후에는 40% 수준으로 관리함으로써 노후 자산의 급격한 고갈을 완벽하게 방어할 수 있습니다." : "매년 일정한 금액을 인출하여 안정적이고 예측 가능한 현금흐름을 가져갈 수 있으나, 물가 상승에 따른 구매력 저하를 방어하기 위해 투자형 자산의 비중 조절이 필요합니다."}
- **리스크 관리 방안**: 인출 초기 과도한 시장 하락(시점 위험)에 대비하기 위해 최소 2~3년 치의 생활비는 예금 등 현금성 자산으로 상시 확보할 것을 권장합니다.

*※ 본 보고서는 AI 시뮬레이션 기반 제안서이며, 실제 투자 및 인출 실행 시 전문 세무사/재무 설계사와의 대면 상담을 병행하시길 권장합니다.*`;
    }

    return NextResponse.json({
      thinking,
      recommendation,
    });
  } catch (error: any) {
    console.error("AI Advisor API Error:", error);
    return NextResponse.json(
      { error: "AI 진단 결과를 가져오는 중 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
