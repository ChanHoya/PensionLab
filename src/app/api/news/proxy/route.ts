import { NextRequest, NextResponse } from "next/server";

async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    const urlObj = new URL(googleUrl);
    const pathParts = urlObj.pathname.split("/");
    const artId = pathParts[pathParts.length - 1];
    if (!artId || (!googleUrl.includes("articles") && !googleUrl.includes("read"))) {
      return googleUrl;
    }

    const paramsUrl = `https://news.google.com/rss/articles/${artId}?hl=ko&gl=KR&ceid=KR:ko`;
    const res = await fetch(paramsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return googleUrl;
    const text = await res.text();
    const sgMatch = text.match(/data-n-a-sg="([^"]+)"/);
    const tsMatch = text.match(/data-n-a-ts="([^"]+)"/);
    if (!sgMatch || !tsMatch) return googleUrl;

    const ctx = [
      ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
      "X",
      "X",
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ];
    const inner = ["garturlreq", ctx, artId, Number(tsMatch[1]), sgMatch[1]];
    const envelopes = [["Fbv4je", JSON.stringify(inner), null, "0"]];
    const body = "f.req=" + encodeURIComponent(JSON.stringify([envelopes]));

    const batchRes = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body,
    });
    if (!batchRes.ok) return googleUrl;
    const batchText = await batchRes.text();
    const urlMatches = batchText.match(/https?:\/\/[^\s"\\\]]+/g);
    if (urlMatches && urlMatches.length > 0) {
      const directUrl = urlMatches.find((u) => !u.includes("google.com"));
      if (directUrl) return directUrl;
    }
  } catch (err) {
    console.error("Error resolving google news url:", err);
  }
  return googleUrl;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new NextResponse("URL parameter is missing", { status: 400 });
    }

    // If it's a Google News URL, resolve it to the actual publisher's direct link
    let finalUrl = targetUrl;
    if (targetUrl.includes("news.google.com")) {
      finalUrl = await resolveGoogleNewsUrl(targetUrl);
    }

    const response = await fetch(finalUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });

    const contentType = response.headers.get("content-type") || "text/html; charset=utf-8";
    let body = await response.text();

    // If the target is an HTML page, insert a <base> tag so relative assets load properly
    try {
      const parsedUrl = new URL(response.url || finalUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      if (body.includes("<head>")) {
        body = body.replace("<head>", `<head><base href="${baseUrl}">`);
      } else if (body.includes("<head ")) {
        body = body.replace(/<head[^>]*>/, `$&<base href="${baseUrl}">`);
      }

      // Neutralize potential frame-busting scripts
      body = body.replace(/window\.top\.location/g, "window.self.location");
      body = body.replace(/top\.location/g, "self.location");
    } catch (_) {}

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Remove frame restrictions
        "X-Frame-Options": "ALLOWALL",
        "Content-Security-Policy": "frame-ancestors *",
        "X-Resolved-Url": finalUrl,
      },
    });
  } catch (error) {
    console.error("Error in news proxy API:", error);
    return new NextResponse(
      "<html><body style='font-family: sans-serif; padding: 24px;'><h3>기사 페이지를 직접 불러올 수 없습니다.</h3><p>우측 상단의 [새 창에서 원문 열기 ↗]를 이용해 주시기 바랍니다.</p></body></html>",
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
