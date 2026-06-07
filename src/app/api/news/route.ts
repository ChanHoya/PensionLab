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
        
        const lowerTitle = title.toLowerCase();
        
        // Filter out advertisement, product promotion, or non-policy commercial news
        const isCommercial = 
          lowerTitle.includes("캐시백") || 
          lowerTitle.includes("캐쉬백") ||
          lowerTitle.includes("이벤트") ||
          lowerTitle.includes("돌파") ||
          lowerTitle.includes("출시") ||
          lowerTitle.includes("기념") ||
          lowerTitle.includes("1위") ||
          lowerTitle.includes("석권") ||
          lowerTitle.includes("급증") ||
          lowerTitle.includes("사은품") ||
          lowerTitle.includes("특판") ||
          lowerTitle.includes("경품") ||
          lowerTitle.includes("가입 고객") ||
          lowerTitle.includes("고객 감사") ||
          lowerTitle.includes("수수료 면제") ||
          lowerTitle.includes("업무협약") ||
          lowerTitle.includes("mou") ||
          lowerTitle.includes("선정") ||
          lowerTitle.includes("수상") ||
          lowerTitle.includes("세미나") ||
          lowerTitle.includes("개최") ||
          lowerTitle.includes("설명회") ||
          lowerTitle.includes("웹세미나") ||
          lowerTitle.includes("웨비나") ||
          lowerTitle.includes("스타벅스") ||
          lowerTitle.includes("커피") ||
          lowerTitle.includes("기프티콘") ||
          lowerTitle.includes("상품권") ||
          lowerTitle.includes("증정") ||
          lowerTitle.includes("지급") ||
          lowerTitle.includes("선물") ||
          lowerTitle.includes("이관") ||
          lowerTitle.includes("계좌 개설") ||
          lowerTitle.includes("계좌개설") ||
          lowerTitle.includes("공모주") ||
          lowerTitle.includes("우대") ||
          lowerTitle.includes("금리") ||
          lowerTitle.includes("신상품") ||
          lowerTitle.includes("판매 개시") ||
          lowerTitle.includes("선착순") ||
          lowerTitle.includes("모집") ||
          lowerTitle.includes("추첨") ||
          lowerTitle.includes("마케팅") ||
          lowerTitle.includes("선보여") ||
          lowerTitle.includes("독식") ||
          lowerTitle.includes("머니백") ||
          lowerTitle.includes("포인트") ||
          lowerTitle.includes("혜택 제공") ||
          lowerTitle.includes("신규 가입");
          
        // Composite rule: if a financial firm (증권, 운용, 은행, 생명, 화재, 카드) is in the title,
        // and it also contains marketing/promotional terms, filter it out.
        const hasFinancialFirm = 
          lowerTitle.includes("증권") || 
          lowerTitle.includes("운용") || 
          lowerTitle.includes("은행") || 
          lowerTitle.includes("생명") || 
          lowerTitle.includes("화재") || 
          lowerTitle.includes("카드");
          
        const hasPromoTerm = 
          lowerTitle.includes("가입") ||
          lowerTitle.includes("수수료") ||
          lowerTitle.includes("고객") ||
          lowerTitle.includes("유치") ||
          lowerTitle.includes("개설") ||
          lowerTitle.includes("연동") ||
          lowerTitle.includes("전망") ||
          lowerTitle.includes("대상") ||
          lowerTitle.includes("선착순") ||
          lowerTitle.includes("쿠폰") ||
          lowerTitle.includes("상담") ||
          lowerTitle.includes("서비스");

        if (isCommercial || (hasFinancialFirm && hasPromoTerm)) {
          continue; // Skip commercial and advertisement news
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
        
        // Clean description for summary, bypassing first HTML link element in Google News RSS description
        let summaryCleaned = description;
        const lastBrIndex = description.lastIndexOf("<br/>");
        if (lastBrIndex !== -1) {
          summaryCleaned = description.substring(lastBrIndex + 5);
        }
        
        summaryCleaned = summaryCleaned
          .replace(/<[^>]*>?/gm, "") // Strip any HTML tags completely
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
