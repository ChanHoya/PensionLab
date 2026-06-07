import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const minimaxApiKey = process.env.MINIMAX_API_KEY;
const minimaxClient = minimaxApiKey
  ? new OpenAI({
      apiKey: minimaxApiKey,
      baseURL: "https://api.minimax.io/v1",
    })
  : null;

export async function POST(request: Request) {
  try {
    if (!minimaxClient) {
      return NextResponse.json(
        { error: "MINIMAX_API_KEY가 서버 환경 변수에 등록되지 않았습니다." },
        { status: 500 }
      );
    }

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

    // 2. Call MiniMax M3 API
    const response = await minimaxClient.chat.completions.create({
      model: "MiniMax-M3",
      messages: [
        {
          role: "system",
          content: "당신은 은퇴 자산 설계 및 3층 연금 구조 분석에 특화된 대한민국 최고의 AI 재무 설계사입니다.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 3000,
    });

    const fullContent = response.choices[0].message.content || "";

    // 3. Parse and extract the <think> reasoning and the final markdown
    let thinking = "";
    let recommendation = fullContent;

    const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      thinking = thinkMatch[1].trim();
      recommendation = fullContent.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    }

    return NextResponse.json({
      thinking,
      recommendation,
    });
  } catch (error: any) {
    console.error("MiniMax AI Advisor API Error:", error);
    return NextResponse.json(
      { error: "AI 진단 결과를 가져오는 중 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
