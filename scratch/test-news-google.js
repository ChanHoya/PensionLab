async function test() {
  try {
    const query = "국민연금 OR 퇴직연금 OR 개인연금저축 OR 연금 세액공제";
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    console.log("Fetching Google News RSS from:", url);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    console.log("Response status:", response.status);
    const xmlText = await response.text();
    console.log("XML Text length:", xmlText.length);
    
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    console.log("Found items count:", itemMatches ? itemMatches.length : 0);
    
    if (itemMatches) {
      for (let i = 0; i < Math.min(5, itemMatches.length); i++) {
        const itemXml = itemMatches[i];
        const title = parseXmlField(itemXml, "title");
        const link = parseXmlField(itemXml, "link");
        const pubDate = parseXmlField(itemXml, "pubDate");
        const source = parseXmlField(itemXml, "source") || "뉴스";
        
        console.log(`\n--- Item ${i + 1} ---`);
        console.log("Title:", title);
        console.log("Link:", link);
        console.log("PubDate:", pubDate);
        console.log("Source:", source);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function parseXmlField(itemXml, fieldName) {
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

test();
