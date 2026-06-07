async function test() {
  try {
    const url = "https://www.korea.kr/rss/policy.xml";
    const response = await fetch(url);
    const xmlText = await response.text();
    
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    let matchedCount = 0;
    
    if (itemMatches) {
      for (const itemXml of itemMatches) {
        const title = parseXmlField(itemXml, "title");
        const description = parseXmlField(itemXml, "description");
        
        const combinedText = (title + " " + description).toLowerCase();
        
        // Check keywords
        const isMatched = 
          combinedText.includes("연금") || 
          combinedText.includes("irp") || 
          combinedText.includes("세액공제") ||
          combinedText.includes("자산") ||
          combinedText.includes("은퇴") ||
          combinedText.includes("노후");
          
        if (isMatched) {
          matchedCount++;
          console.log(`[MATCH ${matchedCount}] Title:`, title);
        }
      }
    }
    console.log("Total matched items:", matchedCount);
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
