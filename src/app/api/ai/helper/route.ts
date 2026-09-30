import { NextResponse } from "next/server";
import { GoogleGenerativeAI, type Content, type Tool } from "@google/generative-ai";

const MODEL = "gemini-3.8-flash"; // 서비스의 다른 AI 기능과 같은 모델
const MAX_CONTEXT = 12000; // 화면 내용은 앞부분만 (토큰 절약)
const MAX_QUESTION = 1000;

const SYSTEM = `당신은 한국 연금 설계 서비스 PensionLab의 AI 도우미입니다.
- 사용자가 보고 있는 화면 내용([현재 화면])을 먼저 근거로 삼고, 화면에 없는 제도·세법·최신 수치는 Google 검색으로 확인해 답하세요.
- 한국어로, 결론부터 짧게 답하세요. 필요하면 "- " 목록을 쓰되 마크다운 제목·표·굵게(**)는 쓰지 마세요.
- 숫자를 인용할 때는 화면의 값인지, 검색으로 확인한 값인지, 추정인지 구분하세요.
- 확실하지 않으면 그렇다고 말하고 국민연금공단(☎1355)·금융감독원 통합연금포털 등 확인할 곳을 알려 주세요.
- 특정 금융상품 가입 권유나 수익 보장처럼 들리는 말은 하지 마세요.`;

interface HelperMessage {
  role: "user" | "assistant";
  text: string;
}

const KEY_ERROR = "Gemini API 키 인증에 실패했습니다. Google AI Studio에서 발급한 키가 맞는지 확인해 주세요.";
const isKeyError = (err: unknown) => /api[_ ]?key|API_KEY_INVALID|permission|403|401/i.test(String(err));

// 화면 내용과 질문을 받아 검색·추론으로 답한다. 검색 도구가 실패하면 검색 없이 한 번 더 시도
// 사용자 본인의 Gemini API 키(x-gemini-key 헤더)로만 호출한다. 키는 저장하거나 로그에 남기지 않는다
export async function POST(request: Request) {
  const userKey = request.headers.get("x-gemini-key")?.trim();
  if (!userKey) {
    return NextResponse.json({ error: "AI 도우미를 쓰려면 본인의 Gemini API 키를 먼저 인증해 주세요." }, { status: 401 });
  }
  const genAI = new GoogleGenerativeAI(userKey);
  const { question, pageName, pageContext, history, verify } = (await request.json().catch(() => ({}))) as {
    question?: string;
    pageName?: string;
    pageContext?: string;
    history?: HelperMessage[];
    verify?: boolean;
  };

  // 키 인증: 아주 짧은 요청이 통과하면 유효한 키
  if (verify) {
    try {
      await genAI.getGenerativeModel({ model: MODEL }).generateContent("ping");
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: KEY_ERROR }, { status: 401 });
    }
  }
  if (!question || !question.trim()) {
    return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  }

  const contents: Content[] = [
    ...(Array.isArray(history) ? history.slice(-6) : []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.text).slice(0, 2000) }],
    })),
    {
      role: "user",
      parts: [
        {
          text: `[현재 화면: ${pageName || "PensionLab"}]\n${String(pageContext || "").slice(0, MAX_CONTEXT)}\n\n[질문]\n${question.slice(0, MAX_QUESTION)}`,
        },
      ],
    },
  ];

  const ask = async (withSearch: boolean) => {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM,
      // 최신 모델의 검색 도구는 google_search (SDK 타입에는 옛 googleSearchRetrieval만 있어 변환)
      ...(withSearch ? { tools: [{ googleSearch: {} }] as unknown as Tool[] } : {}),
    });
    const result = await model.generateContent({ contents });
    const chunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set<string>();
    const sources = chunks
      .map((c) => c.web)
      .filter((w): w is { uri: string; title?: string } => !!w?.uri)
      .filter((w) => (seen.has(w.uri) ? false : (seen.add(w.uri), true)))
      .slice(0, 5)
      .map((w) => ({ title: w.title || w.uri, uri: w.uri }));
    return { answer: result.response.text().trim(), sources, searched: withSearch };
  };

  try {
    return NextResponse.json(await ask(true));
  } catch (err) {
    if (isKeyError(err)) return NextResponse.json({ error: KEY_ERROR }, { status: 401 });
    console.warn("AI 도우미 검색 응답 실패, 검색 없이 다시 시도");
    try {
      return NextResponse.json(await ask(false));
    } catch (err2) {
      if (isKeyError(err2)) return NextResponse.json({ error: KEY_ERROR }, { status: 401 });
      console.error("AI 도우미 오류");
      return NextResponse.json({ error: "답변을 만드는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
  }
}
