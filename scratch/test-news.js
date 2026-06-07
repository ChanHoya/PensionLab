async function test() {
  try {
    const url = "https://www.korea.kr/rss/policy.xml";
    console.log("Fetching RSS from:", url);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    console.log("Response status:", response.status);
    const xmlText = await response.text();
    console.log("XML Text length:", xmlText.length);
    console.log("XML head snippet:", xmlText.substring(0, 1000));
    
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    console.log("Found items count:", itemMatches ? itemMatches.length : 0);
    
    if (itemMatches && itemMatches.length > 0) {
      console.log("First item snippet:", itemMatches[0]);
    }
  } catch (error) {
    console.error("Error fetching or parsing:", error);
  }
}

test();
