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
    // 시뮬레이션 기반 요약 수치 계산
    const crevasseYears = Math.max(0, (simulationParams.nationalPensionStartAge || 65) - (simulationParams.retirementAge || 60));
    const grandTotalAssets = simulation.totalAccumulatedAtRetirement + (simulationParams.nonPensionAssets || 0);
    const retirementCF = simulation.cashFlows.find((cf: any) => cf.age === simulationParams.retirementAge);
    const natStartCF = simulation.cashFlows.find((cf: any) => cf.age === simulationParams.nationalPensionStartAge);
    const monthlyAtRetirement = retirementCF ? retirementCF.total : 0;
    const monthlyAtNatStart = natStartCF ? natStartCF.total : 0;

    const prompt = `
[사용자 종합 자산 현황]
- 현재 나이: ${simulationParams.currentAge}세 / 은퇴 희망: ${simulationParams.retirementAge}세 (${Math.max(0, simulationParams.retirementAge - simulationParams.currentAge)}년 후)
- 기대 수명: ${simulationParams.expectedLifeExpectancy}세 / 국민연금 개시: ${simulationParams.nationalPensionStartAge}세
- 소득 크레바스(공백기): ${crevasseYears}년 (은퇴 후 국민연금 개시 전)

[자산 현황 - 전체 포트폴리오]
- 연금 자산 합계 (은퇴 시점 추정): ${simulation.totalAccumulatedAtRetirement.toLocaleString()}만원
- 비연금 금융자산 (주식·채권·현금 등): ${simulationParams.nonPensionAssets || 0}만원
- 재산세 과세표준 (건보료 재산 기준): ${simulationParams.propertyTaxBase || 0}만원
- 연간 금융소득 (이자+배당): ${simulationParams.financialIncome || 0}만원/년
- ★ 전체 보유 자산 합계: ${grandTotalAssets.toLocaleString()}만원 (${grandTotalAssets >= 10000 ? `${(grandTotalAssets / 10000).toFixed(2)}억원` : `${grandTotalAssets.toLocaleString()}만원`})

[소득 흐름 시뮬레이션]
- 은퇴 직후 (${simulationParams.retirementAge}세) 월 수령액: ${monthlyAtRetirement.toLocaleString()}만원/월
- 국민연금 개시 후 (${simulationParams.nationalPensionStartAge}세) 월 수령액: ${monthlyAtNatStart.toLocaleString()}만원/월
- 생애 평균 월 수령액: ${simulation.monthlyAnnuityAtRetirement.toLocaleString()}만원/월
- 목표 생활비: 월 ${simulationParams.targetMonthlySpending}만원 / 최소 생활비: 월 ${simulationParams.minMonthlySpending}만원
- 목표 달성 여부: ${simulation.monthlyAnnuityAtRetirement >= simulationParams.targetMonthlySpending ? "✅ 목표 달성" : `⚠ 월 ${simulationParams.targetMonthlySpending - simulation.monthlyAnnuityAtRetirement}만원 부족`}
- 물가상승률: 연 ${simulationParams.inflationRate}% / 인출 전략: ${simulationParams.decumulationStrategy === "DECREASING" ? "활동기 집중형 (체감식)" : "동일 금액형 (정액식)"}

[1층 공적연금]
- 국민연금 예상 수령액: 월 ${nationalPension?.expectedMonthlyPension || 0}만원 (개시 ${simulationParams.nationalPensionStartAge}세)
- 국민연금 납부: ${nationalPension?.contributionMonths || 0}개월 / 예상 총 ${nationalPension?.expectedTotalContributionMonths || 0}개월
- 기초연금: ${basicPension?.expectedEligibility ? `수급 대상 (월 ${basicPension?.expectedMonthlyAmount || 0}만원)` : "비해당"}

[2층 퇴직연금]
${retirementPensions.length === 0 ? "- 등록된 퇴직연금 없음" : retirementPensions.map((p: any, idx: number) => `- ${idx + 1}. ${p.pensionType}: ${p.pensionType === "DB" ? `평균급여 ${p.avgSalary || 0}만원 × 근속 ${p.yearsOfService || 0}년 (임금상승률 ${p.salaryGrowthRate || 0}%)` : `적립금 ${p.totalAccumulated || 0}만원, 월납 ${p.monthlyContribution || 0}만원, 수익률 ${p.expectedReturnRate || 0}%`}`).join("\n")}

[3층 개인연금 / 연금보험]
${personalPensions.length === 0 ? "- 등록된 개인연금 없음" : personalPensions.map((p: any, idx: number) => `- ${idx + 1}. 개인연금(${p.savingsType}): 적립금 ${p.totalAccumulated || 0}만원, 납입 ${p.monthlyAnnualContribution || 0}만원, ${p.desiredStartAge}세 개시 ${p.receivingPeriod}년 수령`).join("\n")}
${pensionInsurances.length === 0 ? "- 등록된 연금보험 없음" : pensionInsurances.map((p: any, idx: number) => `- ${idx + 1}. 연금보험(${p.insuranceType}): 적립금 ${p.totalAccumulated || 0}만원, 월납 ${p.monthlyPayment || 0}만원, 납입 ${p.paymentPeriod}년, 공시이율 ${p.expectedDeclaredRate || 0}%`).join("\n")}

당신은 대한민국 3층 연금 및 은퇴 자산 포트폴리오를 설계하는 최고 수준의 AI 자산 관리사(Financial Planner)입니다.
위의 **전체 자산(연금 자산 + 비연금 자산)** 데이터를 종합하여 사용자를 위한 **은퇴 자산 종합 진단 및 리밸런싱 처방전**을 작성해 주십시오.

반드시 다음 5가지 핵심 영역에 대해 구체적인 수치와 함께 상세히 분석해 주세요:
1. **사용자 현황 및 종합 자산 평가**: 연금 자산 + 비연금 자산을 포함한 전체 보유 자산 총평. 은퇴 시점 총 자산 규모(${grandTotalAssets.toLocaleString()}만원)와 월 수령 구조(공백기 ${monthlyAtRetirement}만원 → 국민연금 개시 후 ${monthlyAtNatStart}만원)를 기반으로 현재 노후 준비 수준을 종합 평가해 주세요.
2. **은퇴 준비도 종합평가 및 필요자금 산출**: 다음 3단계로 나누어 각 단계별 필요 자금과 국민연금 차감 후 실질 부족액을 계산해 주세요:
   1) 은퇴 후 적극 활동기 (${simulationParams.retirementAge}세 ~ 75세, ${Math.max(0, 75 - simulationParams.retirementAge)}년): 목표 생활비의 120% = 월 ${Math.round(simulationParams.targetMonthlySpending * 1.2)}만원 기준
   2) 은퇴 후 안정 활동기 (75세 ~ 85세, 10년): 목표 생활비의 80% = 월 ${Math.round(simulationParams.targetMonthlySpending * 0.8)}만원 기준
   3) 은퇴 후 비활동기 (85세 ~ ${simulationParams.expectedLifeExpectancy}세, ${Math.max(0, simulationParams.expectedLifeExpectancy - 85)}년): 최소 생활비 = 월 ${simulationParams.minMonthlySpending}만원 기준
3. **소득 크레바스 진단 및 최적 인출 순서**: 소득 공백기(${crevasseYears}년: ${simulationParams.retirementAge}세~${simulationParams.nationalPensionStartAge}세) 대응 방안과 세금·건보료를 최소화하는 퇴직연금·개인연금·공적연금 수령 순서 최적화 처방
4. **자산군 리밸런싱 및 투자 제안**: 비연금 자산(${simulationParams.nonPensionAssets || 0}만원) 포함 전체 포트폴리오 관점에서의 위험자산/안전자산 비율 제안과 배당·인컴 창출 자산군(TDF, 고배당 ETF, 리츠, 채권 등) 추천
5. **인출 전략 맞춤 조언**: ${simulationParams.decumulationStrategy === "DECREASING" ? "활동기 집중형 체감식" : "동일 금액형 정액식"} 전략 기준 지출 예산 관리법과 장수 리스크·인플레이션 방어 가이드

[답변 작성 형식 지침]
- 당신의 깊이 있는 생각 흐름과 대안 검토 과정은 반드시 \`<think>\`와 \`</think>\` 태그 내에 한글로 상세히 작성해 주십시오.
- 인사말, 소개 글, 또는 서론 문장을 완전히 배제하고, \`</think>\` 태그가 닫힌 직후 바로 **"### 1. 사용자 현황 및 종합 자산 평가"**로 본문 보고서를 시작해 주십시오.
- 보고서 내에 빈 항목이나 내용이 없는 불릿 포인트는 절대 포함하지 마십시오.
- 최종 사용자에게 보여줄 가독성 높은 마크다운 형식의 전문적인 처방전(보고서 스타일)만 작성해 주십시오.
`;

    let fullContent = "";
    let isAIFlowSuccess = false;
    let geminiApiErrorDetail = "";

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.5-flash",
          systemInstruction: "당신은 은퇴 자산 설계 및 3층 연금 구조 분석에 특화된 대한민국 최고의 AI 재무 설계사입니다. 인사말 없이 '### 1. 사용자 현황 및 미래자산 평가'로 본문을 즉시 시작하며, 빈 불릿 포인트나 공백 항목을 생성하지 마십시오. 필요자금 분석 및 실질 필요자금 산출은 반드시 은퇴나이~75세(적극활동기), 75~85세(안정활동기), 85세~기대수명(비활동기)의 3단계로 나누어 설명해 주십시오.",
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
      // thinking 모델(gemini-3.5-flash 등)은 전체 응답을 <think>...</think>로 감싸거나,
      // 또는 <think>추론부</think> 이후에 본문을 출력하는 두 가지 패턴을 가짐
      const thinkTagRegex = /<think>([\s\S]*?)<\/think>/i;
      const thinkMatch = fullContent.match(thinkTagRegex);
      if (thinkMatch) {
        thinking = thinkMatch[1].trim();
        // think 태그 이후 본문 추출
        const afterThink = fullContent.replace(thinkTagRegex, "").trim();
        if (afterThink) {
          // 정상적: think 태그 뒤에 본문이 있는 경우
          recommendation = afterThink;
        } else {
          // Thinking 모델이 think 태그 안에 전체 응답을 넣은 경우 → think 내용을 본문으로 사용
          recommendation = thinking;
          thinking = "";
        }
      } else if (fullContent.includes("<think")) {
        // 닫히지 않은 think 태그 처리
        const openIdx = fullContent.indexOf("<think");
        const closeIdx = fullContent.indexOf("</think>", openIdx);
        if (closeIdx !== -1) {
          thinking = fullContent.substring(fullContent.indexOf(">", openIdx) + 1, closeIdx).trim();
          recommendation = (fullContent.substring(0, openIdx) + fullContent.substring(closeIdx + 8)).trim();
        } else {
          // think 열기만 있고 닫기 없음 → think 이전 내용 + think 이후를 본문으로
          recommendation = fullContent.substring(0, openIdx).trim() || fullContent.substring(openIdx).trim();
        }
      } else {
        recommendation = fullContent.trim();
      }
      // 최종 안전망: recommendation이 비어있으면 fullContent 전체를 사용
      if (!recommendation) {
        recommendation = fullContent.replace(/<\/?think[^>]*>/gi, "").trim();
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

      // Fallback calculations for the 3 stages
      const retAge = simulationParams.retirementAge || 60;
      const lifeExp = simulationParams.expectedLifeExpectancy || 100;
      const natPension = nationalPension?.expectedMonthlyPension || 0;
      const natStartAge = simulationParams.nationalPensionStartAge || 65;

      const formatAsset = (val: number) => {
        return val >= 10000 ? `${(val / 10000).toFixed(2)}억원` : `${val.toLocaleString()}만원`;
      };

      // 1. 은퇴후 적극 활동기 (은퇴나이 ~ 75세)
      const stage1Years = Math.max(0, 75 - retAge);
      const stage1MonthlyNeed = Math.round(targetSpending * 1.2);
      const stage1PreStartYears = Math.max(0, Math.min(75, natStartAge) - retAge);
      const stage1PostStartYears = Math.max(0, 75 - Math.max(retAge, natStartAge));
      const stage1PreStartTotal = stage1PreStartYears * stage1MonthlyNeed * 12;
      const stage1PostStartTotal = stage1PostStartYears * Math.max(0, stage1MonthlyNeed - natPension) * 12;
      const stage1TotalNetNeed = stage1PreStartTotal + stage1PostStartTotal;

      // 2. 은퇴후 안정 활동기 (75세 ~ 85세)
      const stage2Years = Math.max(0, Math.min(lifeExp, 85) - Math.min(lifeExp, 75));
      const stage2MonthlyNeed = Math.round(targetSpending * 0.8);
      const stage2TotalNetNeed = stage2Years * Math.max(0, stage2MonthlyNeed - natPension) * 12;

      // 3. 은퇴후 비활동기 (85세 ~ 기대수명)
      const stage3Years = Math.max(0, lifeExp - Math.max(retAge, 85));
      const stage3MonthlyNeed = minSpending;
      const stage3TotalNetNeed = stage3Years * Math.max(0, stage3MonthlyNeed - natPension) * 12;

      const totalNetNeed = stage1TotalNetNeed + stage2TotalNetNeed + stage3TotalNetNeed;

      thinking = `[Gemini API 연동 실패/미등록 디버그 정보]
- 원인: ${geminiApiErrorDetail}

1. 사용자 연령 및 은퇴 시점 시각화: 현재 나이 ${simulation.currentAge}세, 은퇴 희망 ${simulationParams.retirementAge}세로 준비 기간은 ${simulation.yearsToRetire}년입니다.
2. 3층 연금 및 비연금 자산 집계: 은퇴 시점 총연금 자산은 ${totalAssetStr}이며, 예상 월 수령액은 ${monthlyAnnuityStr}입니다.
3. 소득 크레바스(소득 공백기) 분석: 은퇴 나이 ${simulationParams.retirementAge}세부터 국민연금 개시 ${simulationParams.nationalPensionStartAge}세까지 ${crevasseYears}년의 소득 공백이 식별되었습니다.
4. 인출 방식 검토: 사용자가 선택한 전략은 '${isDecreasing ? "활동기 집중형 체감식" : "동일 금액형 정액식"}'입니다.`;

      let warningHeader = "⚠️ **[로컬 테스트 모드 - Gemini AI API 키 미등록 상태]**";
      if (geminiApiErrorDetail.includes("429") || geminiApiErrorDetail.toLowerCase().includes("quota")) {
        warningHeader = "⚠️ **[구글 Gemini API 무료 할당량(Quota) 초과 상태 - 로컬 Fallback 진단 제공]**\n\n현재 사용 중인 구글 API 키의 무료 호출 제한(429)이 초과되어 실시간 AI 생성이 일시 차단되었습니다. 안정적인 진단을 제공하기 위해 연금 분석 엔진 기반의 로컬 매칭형 처방전을 임시 제공합니다.";
      } else if (geminiApiErrorDetail) {
        warningHeader = `⚠️ **[로컬 테스트 모드 - Gemini AI API 연동 실패 상태]**\n\n(상세 에러: ${geminiApiErrorDetail})`;
      }

      recommendation = `${warningHeader}

### 1. 사용자 현황 및 미래자산 평가
회원님의 은퇴 시점 예상 연금 자산 규모는 **${totalAssetStr}**이며, 은퇴 직후 예상되는 월 수령액은 **${monthlyAnnuityStr}**입니다.
- **목표 생활비(월 ${targetSpending}만원) 대비 달성율**: **${targetPercent}%**
- **최소 생활비(월 ${minSpending}만원) 대비 달성율**: **${minPercent}%**

현재 자산 구조는 **${adequacyStatus}** 은퇴 자금의 안정성을 높이기 위해 아래의 자산 재배치 및 인출 순서 조정을 제안합니다.

---

### 2. 은퇴 준비도 종합평가

#### 필요 자금 산출 (총 ${lifeExp - retAge}년):
- **은퇴후 적극 활동기 (은퇴나이 ~ 75세, ${stage1Years}년간)**: 목표 생활비의 120% 적용 ➔ **월 ${stage1MonthlyNeed}만원** (연 ${(stage1MonthlyNeed * 12).toLocaleString()}만원)
- **은퇴후 안정 활동기 (75세 ~ 85세, ${stage2Years}년간)**: 목표 생활비의 80% 적용 ➔ **월 ${stage2MonthlyNeed}만원** (연 ${(stage2MonthlyNeed * 12).toLocaleString()}만원)
- **은퇴후 비활동기 (85세 ~ 기대수명 ${lifeExp}세, ${stage3Years}년간)**: 최소 생활비 수준 적용 ➔ **월 ${stage3MonthlyNeed}만원** (연 ${(stage3MonthlyNeed * 12).toLocaleString()}만원)

#### 국민연금 차감 후 실질 필요액 (국민연금 월 ${natPension}만원 수령 가정):
- **은퇴후 적극 활동기 (적극적 여가 소비기, ${stage1Years}년간)**:
  - 국민연금 개시 전 (${stage1PreStartYears}년간): 월 필요액 **${stage1MonthlyNeed}만원** (연 ${(stage1MonthlyNeed * 12).toLocaleString()}만원) ➔ 총 **${formatAsset(stage1PreStartTotal)}** 필요
  - 국민연금 개시 후 (${stage1PostStartYears}년간): 월 필요액 **${Math.max(0, stage1MonthlyNeed - natPension)}만원** (연 ${(Math.max(0, stage1MonthlyNeed - natPension) * 12).toLocaleString()}만원) ➔ 총 **${formatAsset(stage1PostStartTotal)}** 필요
  - 적극 활동기 총 실질 필요액 ➔ **${formatAsset(stage1TotalNetNeed)}**
- **은퇴후 안정 활동기 (소비 안정화기, ${stage2Years}년간)**:
  - 월 필요액 **${Math.max(0, stage2MonthlyNeed - natPension)}만원** (연 ${(Math.max(0, stage2MonthlyNeed - natPension) * 12).toLocaleString()}만원) ➔ 총 **${formatAsset(stage2TotalNetNeed)}** 필요
- **은퇴후 비활동기 (간병/의료비 집중기, ${stage3Years}년간)**:
  - 월 필요액 **${Math.max(0, stage3MonthlyNeed - natPension)}만원** (연 ${(Math.max(0, stage3MonthlyNeed - natPension) * 12).toLocaleString()}만원) ➔ 총 **${formatAsset(stage3TotalNetNeed)}** 필요
- **은퇴 생활 전체 총 실질 필요 은퇴자금**: **${formatAsset(totalNetNeed)}**

---

### 3. 소득 크레바스(소득 공백기) 진단 및 인출 순서 최적화
회원님의 은퇴 희망 나이는 **${retAge}세**이며, 국민연금 개시 연령은 **${natStartAge}세**로, 총 **${crevasseYears}년의 소득 공백기(은퇴 크레바스)**가 존재합니다.
이 기간 동안 소득 공백을 메우고 세제 혜택을 극대화하기 위한 최적의 인출 순서는 다음과 같습니다:
1. **1단계 (소득 공백기)**: **퇴직연금(IRP)의 퇴직소득세 감면 재원**을 우선 인출하여 생활비의 기초를 다집니다. (연금 수령 시 퇴직소득세 30% 감면 효과 활용)
2. **2단계 (공적연금 개시 이후)**: **국민연금(월 ${natPension}만원)**과 **기초연금**을 수급하며, 부족한 금액은 **개인연금저축/연금보험**을 통해 연간 1,500만원 분리과세 한도 내에서 인출합니다.
3. **3단계 (고령기)**: **비연금 자산** 중 주택이 있다면 주택연금(종신형)으로 전환하여 건보료 피부양자 자격을 유지하면서 종신 현금 흐름을 확보합니다.

---

### 4. 자산군 리밸런싱 및 투자 제안
현 포트폴리오의 투자 수익률을 개선하고 인플레이션을 방어하기 위해 다음과 같은 포트폴리오 리밸런싱을 제안합니다:
- **안전 자산 (40%)**: 확정금리형 예금 및 단기 채권 ETF (소득 공백기 생활비 인출용 안전 마진 확보)
- **배당/인컴 자산 (40%)**: 미국 배당성장형 ETF(예: SCHD) 및 글로벌 자산배분형 TDF (물가상승 방어 및 꾸준한 분배금 유입)
- **성장 자산 (20%)**: 미국 지수 추종 ETF(S&P 500, NASDAQ) 및 혁신성장주 포트폴리오 (자산 고갈 시점 지연)

---

### 5. 인출 전략 맞춤 조언 (${isDecreasing ? "활동기 집중형 체감식" : "동일 금액형 정액식"})
회원님께서 선택하신 인출 방식은 **${isDecreasing ? "활동기 집중형 (체감식: 은퇴 초반 120% 인출 후 감액)" : "동일 금액형 (정액식)"}**입니다.
- **인출 관리 처방**: ${isDecreasing ? "은퇴 후 적극 활동기 동안은 수령액을 120%로 증액하여 활발한 여행 및 문화 활동에 집중하고, 이후 안정기에 접어들면서 점진적으로 줄여 85세 이후 비활동기에는 40% 수준으로 관리함으로써 노후 자산의 급격한 고갈을 완벽하게 방어할 수 있습니다." : "매년 일정한 금액을 인출하여 안정적이고 예측 가능한 현금흐름을 가져갈 수 있으나, 물가 상승에 따른 구매력 저하를 방어하기 위해 투자형 자산의 비중 조절이 필요합니다."}
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
