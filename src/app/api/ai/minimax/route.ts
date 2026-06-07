import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// 1. .env에서 불러온 API Key로 OpenAI 클라이언트 초기화 (MiniMax 전용)
const minimaxApiKey = process.env.MINIMAX_API_KEY;
const minimaxClient = minimaxApiKey
    ? new OpenAI({
        apiKey: minimaxApiKey,
        baseURL: "https://api.minimax.io/v1", // MiniMax API 글로벌 엔드포인트
    })
    : null;

export async function POST(request: Request) {
    try {
        // API 키 설정 확인
        if (!minimaxClient) {
            return NextResponse.json(
                { error: "MINIMAX_API_KEY가 환경 변수에 설정되지 않았습니다." },
                { status: 500 }
            );
        }

        const { prompt } = await request.json();
        if (!prompt) {
            return NextResponse.json(
                { error: "prompt 입력을 제공해야 합니다." },
                { status: 400 }
            );
        }

        // 2. Chat Completions 호출
        const response = await minimaxClient.chat.completions.create({
            model: "MiniMax-M3", // MiniMax M3 모델 지정
            messages: [
                { role: "system", content: "당신은 연금 및 은퇴 설계를 돕는 금융 상담 AI 비서입니다." },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const answer = response.choices[0].message.content || "";

        return NextResponse.json({ answer });
    } catch (error: any) {
        console.error("MiniMax API 에러:", error);
        return NextResponse.json(
            { error: "MiniMax API 호출 중 에러가 발생했습니다." },
            { status: 500 }
        );
    }
}
