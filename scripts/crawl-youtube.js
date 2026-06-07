const { PrismaClient } = require("../src/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");
require("dotenv").config();

// Create Prisma Client with driver adapter for Prisma 7
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Initialize API Clients
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

let openai = null;
let genAI = null;

if (geminiApiKey) {
  genAI = new GoogleGenerativeAI(geminiApiKey);
  console.log("Using Google Gemini API...");
} else if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
  console.log("Using OpenAI API...");
}

// Predefined realistic expert contents for fallback seeding or demonstration
const PREDEFINED_VIDEOS = [
  {
    channelName: "연금박사",
    videoId: "yP9_V2bE5b8",
    title: "국민연금 13% 개혁안, 나의 연금 수령액은 어떻게 달라지나?",
    publishDate: new Date("2026-02-15"),
    transcript: "국민연금 보험료가 기존 9%에서 13%로 인상됩니다. 이는 1998년 이후 27년 만의 조정입니다. 세대별로 보험료 인상 속도가 다릅니다. 50대는 매년 1.0%p씩 올라 4년 만에 13%가 되고, 20대는 매년 0.25%p씩 올라 16년에 걸쳐 서서히 인상됩니다. 소득대체율은 기존 40%에서 42%로 소폭 상향 조정되는 방향으로 조율 중입니다. 은퇴 설계를 하실 때 이 세대별 인상 속도를 반드시 고려해야 미래 실질 납부액을 예측할 수 있습니다.",
    summary: "2026년 국민연금 개혁안에 따른 세대별 보험료 차등 인상 스케줄(9% ➔ 13%)과 소득대체율 조정(42%) 분석. 50대는 4년, 20대는 16년에 걸쳐 인상되며 이를 은퇴 자금 계산 시 반드시 반영해야 함."
  },
  {
    channelName: "박곰희TV",
    videoId: "tgB1k5kE7c9",
    title: "퇴직연금 DB형과 DC형, 나에게 맞는 유리한 선택 기준",
    publishDate: new Date("2026-03-10"),
    transcript: "퇴직연금은 크게 DB형과 DC형으로 나뉩니다. DB형은 회사가 자금을 운용하고 근로자는 퇴직 직전 3개월 평균 월급에 근속연수를 곱한 금액을 받습니다. 따라서 임금 상승률이 높고 장기 근속이 유리한 대기업이나 공기업 근로자에게 적합합니다. 반면 DC형은 개인이 운용하며, 회사는 매년 연봉의 1/12을 적립해 줍니다. 임금 상승률이 낮고 이직이 잦거나, 재테크에 관심이 많아 직접 투자로 높은 수익률을 낼 수 있는 분들에게 유리합니다.",
    summary: "퇴직연금 DB형(확정급여형)과 DC형(확정기여형)의 비교 및 선택 기준. 임금상승률이 높고 안정적인 직장은 DB형이 유리하며, 임금상승률이 낮거나 직접 운용 능력이 있다면 DC형이 유리함."
  },
  {
    channelName: "연금박사",
    videoId: "abC1d2e3f4g",
    title: "연금저축펀드와 연금저축보험의 치명적인 차이점",
    publishDate: new Date("2026-04-05"),
    transcript: "연금저축은 연간 600만원(IRP 합산 900만원) 한도로 세액공제를 받을 수 있는 대표적인 3층 연금 상품입니다. 하지만 연금저축보험과 연금저축펀드는 운용 방식과 사업비 구조가 완전히 다릅니다. 보험은 공시이율에 따라 원금이 보장되지만 초기 사업비 공제가 큽니다. 반면 펀드는 원금 보장은 안 되지만 주식형/채권형 ETF 등으로 자유롭게 굴릴 수 있고 사업비가 적습니다. 장기 투자 관점에서는 펀드가 훨씬 유리할 수 있습니다.",
    summary: "세액공제 혜택이 있는 개인연금저축 중 연금저축보험(안정성, 높은 초기 사업비)과 연금저축펀드(투자형, 낮은 사업비)의 차이 분석. 장기 자산 증식에는 펀드 형태가 복리 효과를 내기에 적합함."
  }
];

// Helper to generate a deterministic pseudo-random unit vector of size 1536
function generatePseudoEmbedding(seedText) {
  const hash = crypto.createHash("sha256").update(seedText).digest();
  const vector = [];
  let norm = 0;
  for (let i = 0; i < 1536; i++) {
    // Generate pseudo-random float between -1 and 1
    const offset = (i * 7 + hash[i % 32]) % 256;
    const val = (offset / 128.0) - 1.0;
    vector.push(val);
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  // Normalize vector to have length 1
  return vector.map(v => v / norm);
}

async function getEmbedding(text) {
  if (!genAI && !openai) {
    // Return pseudo-random fallback embedding
    return generatePseudoEmbedding(text);
  }
  
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      const result = await model.embedContent(text);
      const embedding = result.embedding.values;

      // Adjust embedding dimensions to match vector(1536) database schema
      if (embedding.length > 1536) {
        return embedding.slice(0, 1536);
      } else if (embedding.length < 1536) {
        const padded = new Array(1536).fill(0);
        for (let i = 0; i < embedding.length; i++) {
          padded[i] = embedding[i];
        }
        return padded;
      }
      return embedding;
    } catch (error) {
      console.error("Gemini Embedding generation failed, falling back to pseudo-random:", error.message);
      return generatePseudoEmbedding(text);
    }
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("OpenAI Embedding generation failed, falling back to pseudo-random:", error.message);
    return generatePseudoEmbedding(text);
  }
}

async function getSummary(title, transcript) {
  if (!genAI && !openai) {
    // Return mock summary
    return `[요약] ${title}에 대한 자막 데이터 분석 요약본입니다.`;
  }
  
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      const prompt = `당신은 은퇴 설계 및 다층 연금 전문가입니다. 제공되는 유튜브 자막 내용을 분석하여 2~3문장의 핵심 요약(핵심 제안 포함)을 작성해 주세요.\n\n제목: ${title}\n자막: ${transcript}`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("Gemini Summary generation failed, returning fallback:", error.message);
      return `[요약] ${title}의 자막 요약입니다.`;
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 은퇴 설계 및 다층 연금 전문가입니다. 제공되는 유튜브 자막 내용을 분석하여 2~3문장의 핵심 요약(핵심 제안 포함)을 작성해 주세요."
        },
        {
          role: "user",
          content: `제목: ${title}\n자막: ${transcript}`
        }
      ],
      max_tokens: 200,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Summary generation failed, returning fallback:", error.message);
    return `[요약] ${title}의 자막 요약입니다.`;
  }
}

async function main() {
  console.log("Starting YouTube Expert Content Seeder / Crawler...");

  // Parse command arguments
  const args = process.argv.slice(2);
  const limitArgIdx = args.indexOf("--limit");
  const limit = limitArgIdx !== -1 ? parseInt(args[limitArgIdx + 1], 10) : 5;

  console.log(`Processing limit: ${limit} videos...`);

  // In Phase 1 MVP, we seed the database with predefined expert videos
  // If OpenAI API key is present, we will regenerate summaries and embeddings using OpenAI.
  for (let i = 0; i < Math.min(PREDEFINED_VIDEOS.length, limit); i++) {
    const video = PREDEFINED_VIDEOS[i];
    console.log(`\nProcessing Video [${i + 1}]: "${video.title}" (${video.channelName})`);

    const id = crypto.randomUUID();
    const finalSummary = (genAI || openai) ? await getSummary(video.title, video.transcript) : video.summary;
    const embedding = await getEmbedding(video.transcript);
    const embeddingString = `[${embedding.join(",")}]`;

    console.log("Saving to Database via raw SQL for pgvector support...");
    
    // We execute a raw insert because Prisma doesn't natively support the Unsupported 'vector' column directly in input objects
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ExpertContent" (id, "channelName", "videoId", "title", "publishDate", "transcript", "summary", "embedding", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, NOW())
       ON CONFLICT ("videoId") DO UPDATE
       SET "title" = $4, "transcript" = $6, "summary" = $7, "embedding" = $8::vector, "updatedAt" = NOW();`,
      id,
      video.channelName,
      video.videoId,
      video.title,
      video.publishDate,
      video.transcript,
      finalSummary,
      embeddingString
    );

    console.log(`✓ Video "${video.title}" successfully saved!`);
  }

  console.log("\nYouTube expert content seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeder script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
