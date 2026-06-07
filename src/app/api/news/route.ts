import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch South Korea Policy Briefing RSS (대한민국 정책브리핑 정책 뉴스)
    const response = await fetch("https://www.korea.kr/rss/policy.xml", {
      next: { revalidate: 3600 }, // Cache for 1 hour to prevent API rate limits and optimize speed
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS. Status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    const items: any[] = [];
    // Extract <item> blocks from XML
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    
    if (itemMatches) {
      for (const itemXml of itemMatches) {
        const title = parseXmlField(itemXml, "title");
        const link = parseXmlField(itemXml, "link");
        const description = parseXmlField(itemXml, "description");
        const pubDateStr = parseXmlField(itemXml, "pubDate");
        const author = parseXmlField(itemXml, "author") || "정책브리핑";
        
        if (!title || !link) continue;
        
        // Match category based on keyword classification
        let category: "국민·기초연금" | "퇴직·개인연금" | "자산관리" = "자산관리";
        const combinedText = (title + " " + description).toLowerCase();
        
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
        
        // Formatting pubDate to YYYY-MM-DD
        let dateFormatted = new Date().toISOString().split("T")[0];
        try {
          if (pubDateStr) {
            const date = new Date(pubDateStr);
            if (!isNaN(date.getTime())) {
              dateFormatted = date.toISOString().split("T")[0];
            }
          }
        } catch (_) {}
        
        // Strip HTML tags from summary
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
        
        // Reconstruct high-fidelity article object compatible with current UI
        items.push({
          id: `real-${Math.random().toString(36).substr(2, 9)}`,
          category,
          title,
          summary: summaryCleaned.length > 180 ? summaryCleaned.slice(0, 180) + "..." : summaryCleaned,
          date: dateFormatted,
          author,
          content: description.replace(/&nbsp;/g, " ").trim(), // Keep full content for modal view
          image: imageEmoji,
          link: link // Store original portal link
        });
      }
    }
    
    // Sort news by date descending
    items.sort((a, b) => b.date.localeCompare(a.date));
    
    // Return maximum 9 articles to keep UI clean and responsive
    return NextResponse.json(items.slice(0, 9));
  } catch (error: any) {
    console.error("Error in Policy News Feed API:", error);
    // Return empty list, allowing client to switch to static mocks seamlessly
    return NextResponse.json([]);
  }
}

// Robust helper to parse CDATA or raw tags from item XML block
function parseXmlField(itemXml: string, fieldName: string): string {
  // 1. Try CDATA parsing: <tag><![CDATA[...]]></tag>
  const cdataReg = new RegExp(`<${fieldName}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${fieldName}>`, "i");
  const cdataMatch = itemXml.match(cdataReg);
  if (cdataMatch) return cdataMatch[1].trim();
  
  // 2. Try raw tag parsing: <tag>...</tag>
  const tagReg = new RegExp(`<${fieldName}>([\\s\\S]*?)</${fieldName}>`, "i");
  const tagMatch = itemXml.match(tagReg);
  if (tagMatch) {
    // strip simple HTML if any
    return tagMatch[1].replace(/<[^>]*>?/gm, "").trim();
  }
  
  return "";
}
