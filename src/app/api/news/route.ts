import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isRefresh = searchParams.get("refresh") === "true";

    const fetchOptions: RequestInit = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      ...(isRefresh
        ? { cache: "no-store", next: { revalidate: 0 } }
        : { next: { revalidate: 1800 } }), // Cache for 30 minutes in normal mode
    };

    // Use specific recent queries (when:14d, when:30d) to ensure fresh 2026-10 latest news
    const queries = [
      "(국민연금 OR 기초연금 OR 공적연금) when:14d",
      "(퇴직연금 OR 개인연금 OR IRP OR 연금저축) when:14d",
      "(연금 세액공제 OR 디폴트옵션 OR 연금소득세 OR 국민연금 개혁) when:14d",
      "국민연금 OR 퇴직연금 OR 개인연금저축 when:30d",
    ];

    const results = await Promise.allSettled(
      queries.map(async (query) => {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
        const res = await fetch(url, fetchOptions);
        if (!res.ok) return "";
        return await res.text();
      })
    );

    const rawItems: any[] = [];
    const seenTitles = new Set<string>();

    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const xmlText = result.value;
      const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
      if (!itemMatches) continue;

      for (const itemXml of itemMatches) {
        const fullTitle = parseXmlField(itemXml, "title");
        const link = parseXmlField(itemXml, "link");
        const rawDescription = parseXmlField(itemXml, "description");
        const pubDateStr = parseXmlField(itemXml, "pubDate");

        if (!fullTitle || !link) continue;

        // Extract real title and author (news source) from "Title - Source" format
        let title = fullTitle;
        let author = "뉴스";
        const lastDashIndex = fullTitle.lastIndexOf(" - ");
        if (lastDashIndex !== -1) {
          title = fullTitle.substring(0, lastDashIndex).trim();
          author = fullTitle.substring(lastDashIndex + 3).trim();
        }

        // Deduplication key
        const normTitle = title.replace(/\s+/g, "");
        if (seenTitles.has(normTitle)) continue;

        // Filter out spam domains or non-Korean blogs (e.g., Calgary Roughnecks, gaming wikis)
        const lowerAuthor = author.toLowerCase();
        if (
          lowerAuthor.includes("calgary") ||
          lowerAuthor.includes("roughnecks") ||
          lowerAuthor.includes("나무위키")
        ) {
          continue;
        }

        const lowerTitle = title.toLowerCase();

        // Filter out pure spam, gaming, or pure marketing promotions
        const isSpam =
          lowerTitle.includes("메이플") ||
          lowerTitle.includes("경매장") ||
          lowerTitle.includes("게임") ||
          lowerTitle.includes("캐시백") ||
          lowerTitle.includes("캐쉬백") ||
          lowerTitle.includes("스타벅스") ||
          lowerTitle.includes("커피 쿠폰") ||
          lowerTitle.includes("기프티콘") ||
          lowerTitle.includes("사은품") ||
          lowerTitle.includes("특판 금리") ||
          lowerTitle.includes("경품") ||
          lowerTitle.includes("추첨");

        if (isSpam) continue;

        const combinedText = (title + " " + rawDescription).toLowerCase();
        let category: "국민·기초연금" | "퇴직·개인연금" | "자산관리" = "자산관리";

        if (
          combinedText.includes("국민연금") ||
          combinedText.includes("기초연금") ||
          combinedText.includes("공적연금") ||
          combinedText.includes("국민 연금") ||
          combinedText.includes("기초 연금")
        ) {
          category = "국민·기초연금";
        } else if (
          combinedText.includes("퇴직연금") ||
          combinedText.includes("개인연금") ||
          combinedText.includes("irp") ||
          combinedText.includes("연금저축") ||
          combinedText.includes("퇴직 연금") ||
          combinedText.includes("개인 연금")
        ) {
          category = "퇴직·개인연금";
        } else {
          category = "자산관리";
        }

        let dateFormatted = new Date().toISOString().split("T")[0];
        let timestamp = Date.now();
        try {
          if (pubDateStr) {
            const date = new Date(pubDateStr);
            if (!isNaN(date.getTime())) {
              dateFormatted = date.toISOString().split("T")[0];
              timestamp = date.getTime();
            }
          }
        } catch (_) {}

        // Clean description for summary: Decode entities FIRST then strip HTML tags completely
        let summaryCleaned = sanitizeHtmlText(rawDescription);

        // If the summary is identical or empty, produce a sensible fallback summary
        if (!summaryCleaned || summaryCleaned === title) {
          summaryCleaned = `${title}에 대한 실시간 연금 정책 보도 및 상세 내용입니다.`;
        }

        const imageEmoji = category === "국민·기초연금" ? "📊" : category === "퇴직·개인연금" ? "💵" : "📈";

        seenTitles.add(normTitle);
        rawItems.push({
          id: `real-${Math.random().toString(36).substr(2, 9)}`,
          category,
          title,
          summary: summaryCleaned.length > 180 ? summaryCleaned.slice(0, 180) + "..." : summaryCleaned,
          date: dateFormatted,
          timestamp,
          author,
          content: `${title}\n\n이 기사는 Google News 및 ${author}에서 실시간 제공하는 연금 정책 관련 보도자료입니다. 자세한 내용은 아래 '정책 원문 보기' 링크를 통해 원문 전문을 확인하실 수 있습니다.`,
          image: imageEmoji,
          link: link,
        });
      }
    }

    // Sort strictly by timestamp desc (newest first)
    rawItems.sort((a, b) => b.timestamp - a.timestamp);

    // Return the freshest 20 articles
    return NextResponse.json(rawItems.slice(0, 20), {
      headers: {
        "Cache-Control": isRefresh
          ? "no-cache, no-store, must-revalidate"
          : "public, s-maxage=1800, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error in Google News Feed API:", error);
    return NextResponse.json([]);
  }
}

function decodeHtmlEntities(str: string): string {
  let result = str;
  // Handle double or single escaped entities
  for (let i = 0; i < 2; i++) {
    result = result
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&");
  }
  return result;
}

function sanitizeHtmlText(html: string): string {
  if (!html) return "";
  // 1. First decode entities so any escaped tags become readable
  const decoded = decodeHtmlEntities(html);
  // 2. Remove all HTML tags
  const stripped = decoded.replace(/<[^>]*>/g, " ");
  // 3. Normalize whitespaces and trim
  return stripped.replace(/\s+/g, " ").trim();
}

function parseXmlField(itemXml: string, fieldName: string): string {
  const cdataReg = new RegExp(`<${fieldName}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${fieldName}>`, "i");
  const cdataMatch = itemXml.match(cdataReg);
  if (cdataMatch) return cdataMatch[1].trim();

  const tagReg = new RegExp(`<${fieldName}>([\\s\\S]*?)</${fieldName}>`, "i");
  const tagMatch = itemXml.match(tagReg);
  if (tagMatch) {
    return tagMatch[1].trim();
  }
  return "";
}
