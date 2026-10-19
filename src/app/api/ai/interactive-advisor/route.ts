import { NextRequest, NextResponse } from "next/server";
import { UserPensionContextBrief } from "@/services/interactiveAdvisorService";

interface RequestPayload {
  question: string;
  context: UserPensionContextBrief;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestPayload = await req.json();
    const { question, context } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `당신은 대한민국 최고 수준의 공인재무설계사(CFP)이자 연금 세제 전문가 'PensionLab AI 어드바이저'입니다.
다음 사용자의 실제 연금 자산 정보와 질문을 바탕으로, 정확하고 실천 가능한 3단계 맞춤 조언을 제공하세요.

[사용자 프로필]
- 현재 나이: 만 ${context.currentAge}세 (은퇴 예정: 만 ${context.retirementAge}세)
- 목표 월 생활비: ${context.targetMonthlySpending}만 원 (최소: ${context.minMonthlySpending}만 원)
- 국민연금 예상액: 월 ${context.monthlyNationalPension}만 원
- 퇴직연금 적립금: ${context.retirementPensionSavings}만 원, 개인연금: ${context.personalPensionSavings}만 원
- 비연금 금융자산: ${context.liquidAssets}만 원, 부동산 자산: ${context.realEstateAssets}만 원
- 배우자: ${context.hasSpouse ? "있음" : "없음"}

[사용자 질문]
"${question}"

[답변 가이드라인]
1. 친절하고 신뢰감 있는 톤으로 질문에 대한 명쾌한 1줄 결론을 제시하세요.
2. 2026년 개정 세법(사적연금 1,500만원 분리과세 한도, 건강보험료 연 2,000만원 기준, ISA 만기 전환 세액공제 10% 등)을 적용하여 구체적 계산 근거와 장단점을 서술하세요.
3. 2~3개의 구체적인 실행 행동 지침(Action Item)으로 마무리하세요.
4. 마크다운 스타일(소제목, 글머리기호, 볼드체)을 활용하여 가독성을 극대화하세요.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const answerText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answerText) {
            const toolMatch = mapQuestionToTool(question);
            return NextResponse.json({
              answer: answerText,
              recommendedTool: toolMatch,
              source: "gemini",
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, falling back to rule-based advisor:", geminiErr);
      }
    }

    // Fallback: 정교한 규칙 기반 스마트 어드바이저 응답
    const fallbackAnswer = generateRuleBasedAnswer(question, context);
    const recommendedTool = mapQuestionToTool(question);

    return NextResponse.json({
      answer: fallbackAnswer,
      recommendedTool,
      source: "rule-engine",
    });
  } catch (err: any) {
    console.error("Interactive advisor error:", err);
    return NextResponse.json(
      { error: "Failed to generate advisor response", details: err?.message },
      { status: 500 }
    );
  }
}

function mapQuestionToTool(question: string) {
  const q = question.toLowerCase();
  if (q.includes("isa") || q.includes("전환") || q.includes("만기")) {
    return { id: "ISA_TRANSFER", name: "ISA 연금계좌 전환 플래너", icon: "💎" };
  }
  if (q.includes("조기") || q.includes("연기") || q.includes("국민연금")) {
    return { id: "NPS_BEP", name: "국민연금 조기 vs 연기 손익분기점 비교기", icon: "🪜" };
  }
  if (q.includes("건보료") || q.includes("피부양자") || q.includes("건강보험")) {
    return { id: "HEALTH_INSURANCE", name: "은퇴 후 건강보험료 모의 고지서", icon: "🛡️" };
  }
  if (q.includes("db") || q.includes("dc") || q.includes("임금피크")) {
    return { id: "DB_DC_TRANSITION", name: "DB/DC 퇴직연금 전환 시뮬레이터", icon: "🏢" };
  }
  if (q.includes("버킷") || q.includes("버퍼") || q.includes("비상금") || q.includes("하락장")) {
    return { id: "THREE_BUCKET", name: "3-버킷 현금 버퍼 플래너", icon: "🪣" };
  }
  if (q.includes("로드맵") || q.includes("체크리스트") || q.includes("d-day")) {
    return { id: "RETIREMENT_ROADMAP", name: "은퇴 생애 D-Day 로드맵", icon: "🧭" };
  }
  return { id: "SAVINGS_PLAN", name: "노후 부족액 역산 플래너", icon: "🎯" };
}

function generateRuleBasedAnswer(question: string, ctx: UserPensionContextBrief): string {
  const q = question.toLowerCase();

  if (q.includes("isa")) {
    return `### 💎 ISA 만기 자금의 연금계좌 이전 전략

**결론부터 말씀드리면, 회원님의 자산 현황에서 ISA 만기 자금 연금 이전은 최고의 절세 수단입니다.**

1. **추가 세액공제 혜택 (최대 300만 원)**:
   - ISA 만기 자금을 연금저축/IRP로 전환하면 전환 금액의 10%(최대 300만 원 한도)까지 추가 세액공제를 받을 수 있습니다.
   - 기존 연금계좌 납입 한도(연 900만 원)와 별도로 적용되므로, 한 해 최대 **1,200만 원의 세액공제**가 가능합니다.

2. **비과세 및 과세이연 효과**:
   - ISA에서 발생한 이자·배당 비과세(일반형 200만 원, 서민형 400만 원)를 온전히 챙긴 후, 남은 원리금을 연금계좌에 넣으면 은퇴 시점까지 운용 수익에 대한 세금이 이연(과세이연)됩니다.
   - 나중에 연금으로 수령할 때 3.3~5.5%의 저율 연금소득세만 부담하게 되므로 복리 효과가 극대화됩니다.

**📌 권장 액션:**
- ISA 3년 만기 도래 시 즉시 연금계좌로 전환 신청하세요.
- 상단의 **[ISA 연금계좌 전환 플래너]** 도구를 실행하시면 정확한 환급액 계산을 확인하실 수 있습니다.`;
  }

  if (q.includes("조기") || q.includes("연기") || q.includes("국민연금")) {
    const monthlyNp = ctx.monthlyNationalPension || 150;
    return `### 🪜 국민연금 조기 vs 정상 vs 연기 수령 최적화

**회원님의 예상 국민연금 월 ${monthlyNp.toLocaleString()}만 원을 기준으로 한 분석 결과입니다.**

1. **조기노령연금 (1~5년 일찍 수령)**:
   - 1년 당 6%씩 영구 감액(최대 -30%)됩니다.
   - 소득 공백기(크레바스)에 당장 생활비가 부족하다면 대안이 될 수 있으나, **약 72~77세 이전에 사망하지 않는 한 평생 누적 수령액에서 손해**를 보게 됩니다.

2. **연기연금 (1~5년 늦춰 수령)**:
   - 1년 당 7.2%씩 영구 가산(최대 +36%)됩니다.
   - 평균 수명(남성 83세, 여성 86세) 이상 장수할 경우 가장 유리한 선택이 됩니다.
   - **단, 주의할 점:** 연금액이 급증하여 연간 2,000만 원을 초과할 경우, 건강보험 피부양자 자격에서 탈락할 수 있으므로 **부분 연기(50~90%)**를 고려하시는 것이 현명합니다.

**📌 권장 액션:**
- 비연금 금융자산(${ctx.liquidAssets.toLocaleString()}만 원)이 충분하다면 조기 수령은 피하시고, 최소 정상 수령(만 65세) 이상을 권장합니다.
- 상단의 **[국민연금 손익분기점(BEP) 비교기]**에서 골든 크로스 나이를 시뮬레이션해보세요.`;
  }

  if (q.includes("건보료") || q.includes("피부양자")) {
    return `### 🛡️ 퇴직 후 건강보험 피부양자 탈락 방어 가이드

**공적연금 및 배당소득으로 인한 건보료 리스크를 점검해 드립니다.**

1. **피부양자 탈락 핵심 기준**:
   - **연간 소득 2,000만 원 초과 시 무조건 탈락**: 국민연금 수령액의 50%와 금융소득(이자·배당) 1,000만 원 초과분이 합산됩니다.
   - **재산세 과표 5.4억~9억 사이**: 연 소득이 1,000만 원만 넘어도 피부양자 자격을 상실합니다.

2. **실전 방어 전략**:
   - **사적연금 활용**: IRP 및 개인연금저축에서 발생하는 인출액은 현행법상 건강보험료 부과 대상 소득에서 완전 제외됩니다!
   - **임의계속가입 제도**: 퇴직 후 직장 건보료 수준으로 최대 36개월 동안 납부할 수 있는 권리를 반드시 신청하세요.
   - **부부 분산**: 배당 및 금융자산을 부부 명의로 5:5 분산하여 1인당 연 1,000만 원 이하로 통제하세요.

**📌 권장 액션:**
- 상단의 **[은퇴 후 건강보험료 모의 고지서]** 모달에서 예상 월 건보료를 바로 조회해보세요.`;
  }

  return `### 💡 맞춤 은퇴 자산관리 종합 처방

**회원님의 현재 자산 포트폴리오를 기반으로 진단한 핵심 요약입니다.**

1. **목표 생활비 달성률 점검**:
   - 목표 생활비(월 ${ctx.targetMonthlySpending.toLocaleString()}만 원) 대비 공적연금(월 ${ctx.monthlyNationalPension.toLocaleString()}만 원)을 제외한 부족분은 월 ${(ctx.targetMonthlySpending - ctx.monthlyNationalPension).toLocaleString()}만 원입니다.
   - 퇴직연금(${ctx.retirementPensionSavings.toLocaleString()}만 원)과 개인연금(${ctx.personalPensionSavings.toLocaleString()}만 원)의 적립 자산으로 60~85세 수령 플랜을 정밀하게 설계해야 합니다.

2. **인출 순서 황금률**:
   - 1순위: 세액공제를 받지 않은 일반 원금 (비과세)
   - 2순위: 퇴직연금(IRP) 퇴직소득세 30~40% 감면 수령
   - 3순위: 연금저축 및 운용수익 (연 1,500만 원 한도 내 3.3~5.5% 분리과세)

상단 툴바의 **[D-Day 로드맵]**과 **[시나리오 비교함]**을 활용하시면 현재 자산으로 85세 이상까지 안정적인 현금흐름을 확보할 수 있습니다.`;
}
