import { NextResponse } from "next/server";
import { prisma } from "@/config/db";
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize API Clients
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
let genAI: GoogleGenerativeAI | null = null;

if (geminiApiKey) {
  genAI = new GoogleGenerativeAI(geminiApiKey);
} else if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    if (!question) {
      return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
    }

    let answer = "";
    let sources: { title: string; channelName: string; videoId: string }[] = [];
    let isFallback = false;

    if (genAI || openai) {
      try {
        let queryEmbedding: number[] = [];

        if (genAI) {
          const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
          const result = await model.embedContent(question);
          queryEmbedding = result.embedding.values;

          // Adjust embedding dimensions to match vector(1536) database schema
          if (queryEmbedding.length > 1536) {
            queryEmbedding = queryEmbedding.slice(0, 1536);
          } else if (queryEmbedding.length < 1536) {
            const padded = new Array(1536).fill(0);
            for (let i = 0; i < queryEmbedding.length; i++) {
              padded[i] = queryEmbedding[i];
            }
            queryEmbedding = padded;
          }
        } else if (openai) {
          const embedResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: question,
          });
          queryEmbedding = embedResponse.data[0].embedding;
        }

        const queryEmbeddingString = `[${queryEmbedding.join(",")}]`;

        // 2. Perform vector search using pgvector cosine distance (<=>)
        const matches = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, "channelName", "videoId", "title", "summary", "transcript",
                  (embedding <=> $1::vector) as distance
           FROM "ExpertContent"
           ORDER BY distance ASC
           LIMIT 2;`,
          queryEmbeddingString
        );

        if (matches && matches.length > 0) {
          // Construct RAG context
          const contextText = matches
            .map((m) => `[채널: ${m.channelName}] 제목: ${m.title}\n요약: ${m.summary}\n본문: ${m.transcript}`)
            .join("\n\n");

          sources = matches.map((m) => ({
            title: m.title,
            channelName: m.channelName,
            videoId: m.videoId,
          }));

          // 3. Generate answer grounded in context
          if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `당신은 대한민국 3층 연금 설계 분야의 최고 권위자입니다. 제공된 동영상 자막 자료(참고자료)에 철저히 기반하여 사용자 질문에 정중하게 답변해 주세요. 지침에 없는 내용은 임의로 상상하지 마시고, 인용된 영상 제목과 채널명을 언급해 주세요.\n\n[참고자료]\n${contextText}\n\n[질문]\n${question}`;
            const result = await model.generateContent(prompt);
            answer = result.response.text();
          } else if (openai) {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "당신은 대한민국 3층 연금 설계 분야의 최고 권위자입니다. 제공된 동영상 자막 자료(참고자료)에 철저히 기반하여 사용자 질문에 정중하게 답변해 주세요. 지침에 없는 내용은 임의로 상상하지 마시고, 인용된 영상 제목과 채널명을 언급해 주세요."
                },
                {
                  role: "user",
                  content: `[참고자료]\n${contextText}\n\n[질문]\n${question}`
                }
              ],
              max_tokens: 600,
              temperature: 0.3,
            });
            answer = completion.choices[0].message.content || "";
          }
        } else {
          answer = "죄송합니다. 관련 연금 전문 지식 데이터를 데이터베이스에서 찾을 수 없습니다. 유튜브 자막 크롤링(npm run crawl)을 먼저 실행해 주세요.";
        }
      } catch (aiError) {
        console.error("AI RAG flow failed, falling back to SQL search:", aiError);
        isFallback = true;
      }
    } else {
      isFallback = true;
    }

    if (isFallback) {
      // Fallback: SQL keyword ILIKE search if OpenAI key is not configured or failed
      const cleanQuestion = question.replace(/[^\w\sㄱ-힣]/g, "");
      const keywords = cleanQuestion.split(/\s+/).filter((k: string) => k.length > 1);
      let matches: any[] = [];
      
      if (keywords.length > 0) {
        const queryConditions = keywords
          .map((k: string) => `"title" ILIKE '%${k}%' OR "summary" ILIKE '%${k}%'`)
          .join(" OR ");
        
        matches = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, "channelName", "videoId", "title", "summary", "transcript"
           FROM "ExpertContent"
           WHERE ${queryConditions}
           LIMIT 2;`
        );
      }

      // If no matches found, default to top 2 records
      if (matches.length === 0) {
        matches = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, "channelName", "videoId", "title", "summary", "transcript"
           FROM "ExpertContent"
           LIMIT 2;`
        );
      }

      sources = matches.map((m) => ({
        title: m.title,
        channelName: m.channelName,
        videoId: m.videoId,
      }));

      // Generate a mock response mapping the summaries
      const summaryText = matches
        .map(m => `• **[${m.channelName}]** ${m.title}:\n   ${m.summary}`)
        .join("\n\n");

      answer = `⚠️ **[로컬 테스트 모드 - AI API 연동 실패/미등록 상태]**\n\n질문과 관련된 데이터베이스 매칭 전문가 소견을 안내해 드립니다:\n\n${summaryText}\n\n자세한 상담을 위해 향후 유효한 API 키를 설정하여 실시간 대화형 RAG 기능을 활성화하실 수 있습니다.`;
    }

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("AI Advice API error:", error);
    return NextResponse.json(
      { error: "AI 연금 상담 처리 중 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
