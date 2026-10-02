import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { buildHouseholdReport, type ReportInput } from "@/services/householdReport";
import { fallbackNarrative, normalizeNarrative, reportFacts, LEVELS, TIMINGS } from "@/services/reportNarrative";

const MODEL = "gemini-3.8-flash";
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const SYSTEM = `당신은 대한민국 은퇴·연금 전문 재무설계사(CFP)입니다. 제공된 [계산 결과]만 근거로 가구 연금 종합 진단 리포트를 작성합니다.
- 숫자는 계산 결과에 있는 값을 그대로 인용하고, 새로 계산하거나 지어내지 마세요. 월 금액은 현재가치 기준입니다.
- 부부 가구면 반드시 가구 관점으로 분석하세요: 두 사람의 은퇴·연금 개시 시차, 첫 사망 후 혼자 남은 배우자의 소득, 명의 분산에 따른 세금·건보료.
- [S4 하이브리드 배당 운용 정책]이 주어지면 해당 정책(스노우볼 복리 재투자형 / 비상자금 안전버퍼형 / 배당금 전액 소비형)의 특성에 맞춰 강점, 위험, 행동 지침, 세제 팁을 구체적으로 반영하세요:
  1) 스노우볼 재투자형: 잉여 배당금의 원금 재투자 복리 증식 효과 및 원금 시장 변동성 관리
  2) 안전버퍼 적립형: 안전 풀(연 2.5% MMF)에 적립된 비상자금의 초고령기 간병·의료비 안심 방어 기능
  3) 전액 소비형: 공적연금 공백기 즉시 현금흐름 충당 및 건보료 피부양자 허들(1인당 연 1,000만원) 준수 여부
- 제도 설명은 2026년 현행 한국 세법·국민연금·건강보험 기준으로 하되, 확실하지 않은 수치는 쓰지 마세요.
- 특정 금융회사·상품 가입 권유나 수익 보장처럼 들리는 표현은 쓰지 마세요.
- 한국어 존댓말로, 각 항목은 1~2문장으로 간결하게 쓰고 마크다운 기호(**, #)는 쓰지 마세요.`;

const text = (description: string): Schema => ({ type: SchemaType.STRING, description });
const oneOf = (values: string[], description: string): Schema => ({ type: SchemaType.STRING, format: "enum", enum: values, description });
const object = (properties: Record<string, Schema>, description?: string): Schema => ({
  type: SchemaType.OBJECT,
  properties,
  required: Object.keys(properties),
  description,
});
const list = (items: Schema, description: string, maxItems: number): Schema => ({ type: SchemaType.ARRAY, items, description, maxItems });

const SCHEMA = object({
  headline: text("리포트 첫머리의 한 줄 결론 (40자 안팎)"),
  summary: text("종합 소견 3~4문장: 준비 수준, 가장 큰 위험, 핵심 처방"),
  dimensionComments: object(
    {
      sufficiency: text("소득 충분성 점수에 대한 해석 1~2문장"),
      stability: text("소득 안정성(최소 생활비 미달 구간·공백기) 해석"),
      tax: text("세후 효율(세금·건보료, 피부양자) 해석"),
      diversification: text("3층 분산 해석"),
      longevity: text("장수·유족 대비 해석"),
    },
    "진단 점수 5개 영역별 코멘트"
  ),
  strengths: list(text("강점 1문장"), "현재 구조의 강점 2~4개", 4),
  risks: list(
    object({
      title: text("위험 이름 (15자 이내)"),
      detail: text("근거 수치를 포함한 설명 1문장"),
      impact: oneOf(LEVELS, "영향도"),
      likelihood: oneOf(LEVELS, "발생 가능성"),
    }),
    "주요 위험 4~6개",
    6
  ),
  actions: list(
    object({
      title: text("실행 과제 이름 (20자 이내)"),
      detail: text("무엇을 어떻게 할지 1~2문장"),
      timing: oneOf(TIMINGS, "실행 시점"),
      priority: oneOf(LEVELS, "우선순위"),
      effect: text("기대 효과 (짧게, 가능하면 수치)"),
    }),
    "실행 로드맵 5~8개 (시점별로 고르게)",
    8
  ),
  withdrawalOrder: list(
    object({ period: text("나이 구간 (예: 60~64세)"), source: text("주로 꺼내 쓸 재원"), reason: text("그 순서의 이유 (세금·건보료 관점)") }),
    "나이 구간별 인출 순서 3~5단계",
    5
  ),
  taxTips: list(text("세금·건보료 절감 팁 1문장"), "세제 최적화 팁 3~5개", 5),
  allocation: object(
    {
      safe: { type: SchemaType.INTEGER, description: "안전자산(예금·채권) 비중 %" },
      income: { type: SchemaType.INTEGER, description: "인컴자산(배당·리츠 등) 비중 %" },
      growth: { type: SchemaType.INTEGER, description: "성장자산(주식) 비중 %" },
      rationale: text("배분 이유 1~2문장"),
    },
    "연금 적립금·금융자산 권장 배분 (합계 100)"
  ),
});

// 가구(배우자 없으면 본인) 진단: 서버에서 같은 계산을 다시 돌려 AI에 계산 결과를 주고, 정해진 JSON 형식으로 서술을 받는다
// AI 키가 없거나 실패하면 계산 기반 기본 진단을 돌려준다
export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as ReportInput | null;
  if (!input?.simulationParams || !input.basicPension || !input.self || !input.spouse) {
    return NextResponse.json({ error: "진단에 필요한 연금 정보가 없습니다." }, { status: 400 });
  }

  let report;
  try {
    report = buildHouseholdReport(input);
  } catch {
    return NextResponse.json({ error: "입력된 연금 정보를 계산할 수 없습니다. 정보 재입력에서 값을 확인해 주세요." }, { status: 400 });
  }

  if (!genAI) {
    return NextResponse.json({
      narrative: fallbackNarrative(report),
      source: "fallback",
      notice: "AI 서버 키가 설정되지 않아 계산 기반 기본 진단을 표시합니다.",
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM,
      generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.4 },
    });
    const result = await model.generateContent(`[계산 결과]\n${reportFacts(report, input)}`);
    const narrative = normalizeNarrative(JSON.parse(result.response.text()));
    if (!narrative) throw new Error("AI 응답 형식이 맞지 않습니다");
    return NextResponse.json({ narrative, source: "ai", model: MODEL });
  } catch (err) {
    const detail = String(err);
    console.error("AI 진단 생성 실패:", detail.slice(0, 300));
    const busy = /\[429|RESOURCE_EXHAUSTED|quota/i.test(detail);
    return NextResponse.json({
      narrative: fallbackNarrative(report),
      source: "fallback",
      notice: busy
        ? "AI 사용량이 몰려 계산 기반 기본 진단을 표시합니다. 잠시 후 다시 시도해 주세요."
        : "AI 응답을 받지 못해 계산 기반 기본 진단을 표시합니다.",
    });
  }
}
