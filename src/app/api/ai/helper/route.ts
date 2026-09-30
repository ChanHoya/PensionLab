import { NextResponse } from "next/server";
import { GoogleGenerativeAI, type Content, type Tool } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

type Provider = "gemini" | "openai" | "anthropic";
interface HelperMessage {
  role: "user" | "assistant";
  text: string;
}
interface Source {
  title: string;
  uri: string;
}
interface Answer {
  answer: string;
  sources: Source[];
}

// 키가 없으면 서비스의 Gemini 키(무료 등급)로 가벼운 모델, 본인 키를 등록하면 그 회사의 상위 모델
const FREE_MODEL = "gemini-3.5-flash-lite";
const MODELS: Record<Provider, string> = {
  gemini: "gemini-3.8-flash",
  openai: "gpt-5.6",
  anthropic: "claude-opus-5-5",
};
const serverGeminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;

const MAX_CONTEXT = 12000; // 화면 내용은 앞부분만 (토큰 절약)
const MAX_QUESTION = 1000;

const SYSTEM = `당신은 한국 연금 설계 서비스 PensionLab의 AI 도우미입니다.
- 사용자가 보고 있는 화면 내용([현재 화면])을 먼저 근거로 삼고, 화면에 없는 제도·세법·최신 수치는 웹 검색으로 확인해 답하세요.
- 한국어로, 결론부터 짧게 답하세요. 필요하면 "- " 목록을 쓰되 마크다운 제목·표·굵게(**)는 쓰지 마세요.
- 숫자를 인용할 때는 화면의 값인지, 검색으로 확인한 값인지, 추정인지 구분하세요.
- 확실하지 않으면 그렇다고 말하고 국민연금공단(☎1355)·금융감독원 통합연금포털 등 확인할 곳을 알려 주세요.
- 특정 금융상품 가입 권유나 수익 보장처럼 들리는 말은 하지 마세요.`;

const KEY_ERROR = "API 키 인증에 실패했습니다. 발급받은 키가 맞는지, 선택한 AI 회사가 맞는지 확인해 주세요.";
const FREE_BUSY = "무료 기본 모델 사용량이 몰려 지금은 답할 수 없습니다. 잠시 후 다시 시도하거나 본인 API 키를 등록해 주세요.";

class KeyError extends Error {}
class BusyError extends Error {}

const dedupe = (list: Source[]) => {
  const seen = new Set<string>();
  return list.filter((s) => (seen.has(s.uri) ? false : (seen.add(s.uri), true))).slice(0, 5);
};

// Gemini: 검색 도구가 실패하면 검색 없이 한 번 더 시도
async function askGemini(key: string, model: string, history: HelperMessage[], prompt: string): Promise<Answer> {
  const genAI = new GoogleGenerativeAI(key);
  const contents: Content[] = [
    ...history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: prompt }] },
  ];
  const run = async (withSearch: boolean) => {
    const m = genAI.getGenerativeModel({
      model,
      systemInstruction: SYSTEM,
      // 최신 모델의 검색 도구는 google_search (SDK 타입에는 옛 googleSearchRetrieval만 있어 변환)
      ...(withSearch ? { tools: [{ googleSearch: {} }] as unknown as Tool[] } : {}),
    });
    const result = await m.generateContent({ contents });
    const chunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = chunks.flatMap((c) => (c.web?.uri ? [{ title: c.web.title || c.web.uri, uri: c.web.uri }] : []));
    return { answer: result.response.text().trim(), sources: dedupe(sources) };
  };
  const classify = (err: unknown) => {
    const text = String(err);
    if (/api[_ ]?key|API_KEY_INVALID|PERMISSION_DENIED|\[40[13]/i.test(text)) return new KeyError(text);
    if (/\[429|RESOURCE_EXHAUSTED|quota/i.test(text)) return new BusyError(text);
    return null;
  };
  try {
    return await run(true);
  } catch (err) {
    const known = classify(err);
    if (known) throw known;
    try {
      return await run(false);
    } catch (err2) {
      throw classify(err2) ?? err2;
    }
  }
}

// ChatGPT: Responses API + 웹 검색, 출처는 url_citation 주석
async function askOpenAI(key: string, history: HelperMessage[], prompt: string): Promise<Answer> {
  const client = new OpenAI({ apiKey: key });
  try {
    const res = await client.responses.create({
      model: MODELS.openai,
      instructions: SYSTEM,
      tools: [{ type: "web_search" }],
      input: [...history.map((m) => ({ role: m.role, content: m.text })), { role: "user" as const, content: prompt }],
    });
    const sources: Source[] = [];
    for (const item of res.output) {
      if (item.type !== "message") continue;
      for (const part of item.content) {
        if (part.type !== "output_text") continue;
        for (const a of part.annotations) if (a.type === "url_citation") sources.push({ title: a.title || a.url, uri: a.url });
      }
    }
    return { answer: res.output_text.trim(), sources: dedupe(sources) };
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) throw new KeyError(err.message);
    throw err;
  }
}

// Claude: 웹 검색 서버 도구, 검색이 길어지면(pause_turn) 이어서 요청, 답을 거절하면 다른 모델로 자동 대체(fallbacks)
async function askAnthropic(key: string, history: HelperMessage[], prompt: string): Promise<Answer> {
  const client = new Anthropic({ apiKey: key });
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.text })),
    { role: "user", content: prompt },
  ];
  try {
    const texts: string[] = [];
    const sources: Source[] = [];
    for (let turn = 0; turn < 3; turn++) {
      const res = await client.beta.messages.create({
        model: MODELS.anthropic,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        system: SYSTEM,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
        messages,
      });
      for (const block of res.content) {
        if (block.type === "text") texts.push(block.text);
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) sources.push({ title: r.title || r.url, uri: r.url });
        }
      }
      if (res.stop_reason === "refusal") {
        return { answer: "이 질문에는 답변할 수 없습니다. 질문을 바꿔 다시 물어봐 주세요.", sources: [] };
      }
      if (res.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: res.content });
    }
    return { answer: texts.join("").trim(), sources: dedupe(sources) };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) throw new KeyError(err.message);
    throw err;
  }
}

// 키 인증: Gemini는 짧은 요청, ChatGPT·Claude는 모델 조회(토큰 비용 없음)
async function verifyKey(provider: Provider, key: string) {
  try {
    if (provider === "gemini") await new GoogleGenerativeAI(key).getGenerativeModel({ model: MODELS.gemini }).generateContent("ping");
    else if (provider === "openai") await new OpenAI({ apiKey: key }).models.retrieve(MODELS.openai);
    else await new Anthropic({ apiKey: key }).models.retrieve(MODELS.anthropic);
  } catch {
    throw new KeyError("verify");
  }
}

// 화면 내용과 질문을 받아 검색·추론으로 답한다
// 본인 키(x-ai-provider + x-ai-key 헤더)가 있으면 그 회사 모델, 없으면 서비스의 무료 기본 모델. 키는 저장·로그하지 않는다
export async function POST(request: Request) {
  const legacyGeminiKey = request.headers.get("x-gemini-key")?.trim(); // 예전 버전에서 저장한 Gemini 키
  const userKey = request.headers.get("x-ai-key")?.trim() || legacyGeminiKey;
  const headerProvider = request.headers.get("x-ai-provider") as Provider | null;
  const provider: Provider | null = userKey ? (headerProvider && headerProvider in MODELS ? headerProvider : "gemini") : null;

  const { question, pageName, pageContext, history, verify } = (await request.json().catch(() => ({}))) as {
    question?: string;
    pageName?: string;
    pageContext?: string;
    history?: HelperMessage[];
    verify?: boolean;
  };

  try {
    if (verify) {
      if (!provider || !userKey) return NextResponse.json({ error: "API 키를 입력해 주세요." }, { status: 400 });
      await verifyKey(provider, userKey);
      return NextResponse.json({ ok: true, model: MODELS[provider] });
    }
    if (!question || !question.trim()) {
      return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
    }

    const recent = (Array.isArray(history) ? history.slice(-6) : []).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      text: String(m.text).slice(0, 2000),
    }));
    const prompt = `[현재 화면: ${pageName || "PensionLab"}]\n${String(pageContext || "").slice(0, MAX_CONTEXT)}\n\n[질문]\n${question.slice(0, MAX_QUESTION)}`;

    let result: Answer;
    let model: string;
    if (!provider || !userKey) {
      if (!serverGeminiKey) return NextResponse.json({ error: "무료 기본 모델이 설정되지 않았습니다. 본인 API 키를 등록해 주세요." }, { status: 503 });
      model = FREE_MODEL;
      result = await askGemini(serverGeminiKey, FREE_MODEL, recent, prompt);
    } else {
      model = MODELS[provider];
      result =
        provider === "gemini"
          ? await askGemini(userKey, model, recent, prompt)
          : provider === "openai"
            ? await askOpenAI(userKey, recent, prompt)
            : await askAnthropic(userKey, recent, prompt);
    }
    return NextResponse.json({ ...result, model });
  } catch (err) {
    if (err instanceof KeyError) return NextResponse.json({ error: KEY_ERROR }, { status: 401 });
    if (err instanceof BusyError) return NextResponse.json({ error: provider ? "요청이 많아 잠시 답할 수 없습니다. 잠시 후 다시 시도해 주세요." : FREE_BUSY }, { status: 429 });
    console.error("AI 도우미 오류:", provider ?? "free");
    return NextResponse.json({ error: "답변을 만드는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
