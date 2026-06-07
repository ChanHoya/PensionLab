import { NextResponse } from "next/server";

export async function GET() {
  try {
    const query = "국민연금 OR 퇴직연금 OR 개인연금저축 OR 연금 세액공제 OR IRP 리밸런싱";
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google News RSS. Status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    const items: any[] = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    
    if (itemMatches) {
      for (const itemXml of itemMatches) {
        const fullTitle = parseXmlField(itemXml, "title");
        const link = parseXmlField(itemXml, "link");
        const description = parseXmlField(itemXml, "description");
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
        
        const combinedText = (title + " " + description).toLowerCase();
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
        try {
          if (pubDateStr) {
            const date = new Date(pubDateStr);
            if (!isNaN(date.getTime())) {
              dateFormatted = date.toISOString().split("T")[0];
            }
          }
        } catch (_) {}
        
        // Clean description for summary
        const summaryCleaned = description
          .replace(/<[^>]*>?/gm, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();
          
        const imageEmoji = category === "국민·기초연금" ? "📊" : category === "퇴직·개인연금" ? "💵" : "📈";
        
        items.push({
          id: `real-${Math.random().toString(36).substr(2, 9)}`,
          category,
          title,
          summary: summaryCleaned.length > 180 ? summaryCleaned.slice(0, 180) + "..." : summaryCleaned,
          date: dateFormatted,
          author,
          content: `${title}\n\n이 기사는 Google News 및 ${author}에서 실시간 제공하는 연금 정책 관련 보도자료입니다. 자세한 내용은 아래 '정책 원문 보기' 링크를 통해 원문 전문을 확인하실 수 있습니다.`,
          image: imageEmoji,
          link: link
        });
      }
    }
    
    // Sort by date desc
    items.sort((a, b) => b.date.localeCompare(a.date));
    
    return NextResponse.json(items.slice(0, 12));
  } catch (error) {
    console.error("Error in Google News Feed API:", error);
    return NextResponse.json([]);
  }
}

function parseXmlField(itemXml: string, fieldName: string): string {
  const cdataReg = new RegExp(`<${fieldName}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${fieldName}>`, "i");
  const cdataMatch = itemXml.match(cdataReg);
  if (cdataMatch) return cdataMatch[1].trim();
  
  const tagReg = new RegExp(`<${fieldName}>([\\s\\S]*?)</${fieldName}>`, "i");
  const tagMatch = itemXml.match(tagReg);
  if (tagMatch) {
    return tagMatch[1].replace(/<[^>]*>?/gm, "").trim();
  }
  return "";
}
