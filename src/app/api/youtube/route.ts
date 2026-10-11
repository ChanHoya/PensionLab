import { NextRequest, NextResponse } from "next/server";

export interface YoutubeVideoItem {
  id: string;
  videoId: string;
  channelName: string;
  channelHandle: string;
  title: string;
  summary: string;
  publishDate: string;
  category: string;
}

interface ChannelConfig {
  name: string;
  handle: string;
  channelId: string;
  defaultCategory: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    name: "박곰희TV",
    handle: "@gomhee",
    channelId: "UCr7XsrSrvAn_WcU4kF99bbQ",
    defaultCategory: "은퇴설계",
  },
  {
    name: "연금박사 이영주",
    handle: "@pension500",
    channelId: "UCD9mxN8o9qLei1MbzroeP_A",
    defaultCategory: "국민연금",
  },
  {
    name: "연금이야기",
    handle: "@PensionStory",
    channelId: "UCXRlkKtaSUSAiZXQrpOFwaA",
    defaultCategory: "퇴직연금",
  },
];

// Fallback seed videos in case of network issue
const FALLBACK_VIDEOS: YoutubeVideoItem[] = [
  {
    id: "v-yt-1",
    videoId: "4YCIkuKDE3E",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "내 연금 금융소득종합과세 될 수 있습니다 — 지금 확인해보세요",
    summary: "사적연금 수령액이 연 1,500만 원을 초과할 때 발생하는 분리과세와 종합과세 선택 팁, 그리고 건강보험료 부과 여부를 상세 분석합니다.",
    publishDate: "2025-12-15",
    category: "절세",
  },
  {
    id: "v-yt-2",
    videoId: "nNSMLrJOdVQ",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "연금 가입자만 건강보험료 이중부과되는 불편한 진실",
    summary: "퇴직 후 국민연금 수령 시 건강보험료가 이중으로 부과되는 구조적 문제를 분석하고, 합법적으로 건보료 부담을 줄이는 실전 절세 전략을 공유합니다.",
    publishDate: "2025-11-22",
    category: "건강보험",
  },
  {
    id: "v-yt-5",
    videoId: "91GRhqMQRdE",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "과연 국민연금만으로 충분할까? — 박곰희 연금부자수업",
    summary: "국민연금 예상 수령액과 실제 은퇴 후 필요 생활비를 비교 분석하여, 부족분을 채우기 위한 사적연금 설계 방법을 제안합니다.",
    publishDate: "2026-03-10",
    category: "국민연금",
  },
  {
    id: "v-yt-8",
    videoId: "Gk3-ZC9W3vw",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "ISA에서 미국배당주 사면 손해인가요? 그럼에도 ISA를 해야 하는 이유",
    summary: "ISA 계좌에서 해외 ETF/배당주 투자 시 외국납부세액공제 이슈와 절세 효율을 분석하고, 연금저축/IRP 조합의 최적 운용 전략을 제시합니다.",
    publishDate: "2026-04-18",
    category: "절세",
  },
  {
    id: "v-yt-9",
    videoId: "AvLkWZKp8Fs",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "퇴직금, 개인연금 언제, 어떤 것부터 얼마나 인출하지? 인출 순서",
    summary: "퇴직연금(IRP)과 개인연금(연금저축) 중 어떤 것을 먼저 인출해야 세금을 최소화할 수 있는지, 연금 개시 시점의 세제 효율 극대화 순서를 제안합니다.",
    publishDate: "2025-08-20",
    category: "퇴직연금",
  },
  {
    id: "v-yt-12",
    videoId: "pVwzL_19qk8",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "ISA 한도 3억, 소득·세액공제 + 5.5% 분리과세 (법개정 발의안)",
    summary: "ISA 계좌의 납입 한도 확대 및 세제 혜택 변경 법안을 분석하고, 연금계좌로의 이전 시 추가 세액공제를 받는 절세 전략을 설명합니다.",
    publishDate: "2025-06-03",
    category: "절세",
  },
];

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

    // Fetch RSS feeds from 3 expert channels in parallel
    const channelResults = await Promise.allSettled(
      CHANNELS.map(async (channel) => {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
        const res = await fetch(feedUrl, fetchOptions);
        if (!res.ok) {
          throw new Error(`Failed to fetch YouTube RSS for ${channel.name}: ${res.status}`);
        }
        const xml = await res.text();
        return parseYoutubeRss(xml, channel);
      })
    );

    const liveVideos: YoutubeVideoItem[] = [];
    channelResults.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value.length > 0) {
        liveVideos.push(...result.value);
      } else {
        console.warn(`[YouTube API] Channel ${CHANNELS[idx].name} feed failed or empty:`, 
          result.status === "rejected" ? result.reason : "Empty");
      }
    });

    // If we gathered live videos, sort by publishDate desc
    if (liveVideos.length > 0) {
      liveVideos.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
      return NextResponse.json(liveVideos.slice(0, 24), {
        headers: {
          "Cache-Control": isRefresh
            ? "no-cache, no-store, must-revalidate"
            : "public, s-maxage=1800, stale-while-revalidate=300",
        },
      });
    }

    // Otherwise, return fallback seed videos
    return NextResponse.json(FALLBACK_VIDEOS);
  } catch (err) {
    console.error("Error in YouTube RSS API:", err);
    return NextResponse.json(FALLBACK_VIDEOS);
  }
}

function parseYoutubeRss(xml: string, channel: ChannelConfig): YoutubeVideoItem[] {
  const items: YoutubeVideoItem[] = [];
  const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g);
  if (!entryMatches) return items;

  for (const entryXml of entryMatches) {
    const videoIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
    const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/i);
    const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/i);
    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/i);

    const videoId = videoIdMatch ? videoIdMatch[1].trim() : null;
    let title = titleMatch ? titleMatch[1].trim() : "";
    if (!videoId || !title) continue;

    // Decode HTML entities and sanitize text in title
    title = sanitizeText(title);

    let publishDate = new Date().toISOString().split("T")[0];
    if (publishedMatch) {
      try {
        const d = new Date(publishedMatch[1].trim());
        if (!isNaN(d.getTime())) {
          publishDate = d.toISOString().split("T")[0];
        }
      } catch (_) {}
    }

    let rawDesc = descMatch ? descMatch[1].trim() : "";
    rawDesc = sanitizeText(rawDesc);
    // Remove links and normalize whitespaces
    let summary = rawDesc.replace(/https?:\/\/[^\s]+/g, "").replace(/\s+/g, " ").trim();
    if (!summary || summary.length < 10) {
      summary = `${channel.name}의 최신 영상 '${title}'입니다. 핵심 연금 자산관리 팁을 확인해보세요.`;
    } else if (summary.length > 150) {
      summary = summary.slice(0, 150) + "...";
    }

    const category = categorizeVideo(title + " " + summary, channel.defaultCategory);

    items.push({
      id: `live-yt-${videoId}`,
      videoId,
      channelName: channel.name,
      channelHandle: channel.handle,
      title,
      summary,
      publishDate,
      category,
    });
  }

  return items;
}

function categorizeVideo(text: string, defaultCat: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("절세") || lower.includes("세금") || lower.includes("세액공제") || lower.includes("과세") || lower.includes("환급")) {
    return "절세";
  }
  if (lower.includes("건보료") || lower.includes("건강보험") || lower.includes("피부양자")) {
    return "건강보험";
  }
  if (lower.includes("국민연금") || lower.includes("기초연금") || lower.includes("노령연금") || lower.includes("공적연금")) {
    return "국민연금";
  }
  if (lower.includes("퇴직연금") || lower.includes("irp") || lower.includes("퇴직금") || lower.includes("디폴트옵션")) {
    return "퇴직연금";
  }
  if (lower.includes("연금저축") || lower.includes("isa") || lower.includes("개인연금")) {
    return "연금저축";
  }
  if (lower.includes("배당") || lower.includes("etf") || lower.includes("포트폴리오") || lower.includes("자산배분") || lower.includes("리밸런싱")) {
    return "자산배분";
  }
  return defaultCat;
}

function sanitizeText(str: string): string {
  if (!str) return "";
  let clean = decodeEntities(str);
  if (typeof clean.toWellFormed === "function") {
    clean = clean.toWellFormed();
  }
  // Ensure valid UTF-16 surrogates: remove lone high/low surrogates
  clean = clean.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
  // Remove ASCII control characters except standard whitespace
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return clean.trim();
}

function decodeEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
