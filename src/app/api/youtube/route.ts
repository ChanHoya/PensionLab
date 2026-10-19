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

// Fallback seed videos (2026 latest actual curated videos) in case of network issue
const FALLBACK_VIDEOS: YoutubeVideoItem[] = [
  {
    id: "v-yt-2026-1",
    videoId: "VfbHDWcmji8",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "미국 ETF를 할까? 국내상장 ETF를 할까? | ETF비교",
    summary: "미국 직투 ETF와 국내 상장 미국 ETF의 양도소득세 22% vs 배당소득세(15.4%/종합과세), 연금저축/IRP/ISA 계좌에서의 절세 실익을 비교 분석합니다.",
    publishDate: "2026-10-18",
    category: "자산배분",
  },
  {
    id: "v-yt-2026-2",
    videoId: "Do7D0F-4L6M",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "자녀에게 세금 없이 적립식 증여하고, 증여세 셀프신고하기 | 증여스케줄 | 유기정기금",
    summary: "미성년 자녀 10년 2천만원 공제 한도를 활용한 유기정기금 적립식 증여 신고 방법과 연금 자산 증식 노하우를 전달합니다.",
    publishDate: "2026-10-16",
    category: "절세",
  },
  {
    id: "v-yt-2026-3",
    videoId: "po9BdLIptUc",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "달러투자 방법 총정리 | 달러RP/달러발행어음/달러ETF/미국단기채 | ver.2026",
    summary: "2026년 환율 변동성에 대응하는 안전자산 달러 투자법과 연금 포트폴리오 내 달러 자산 배분 비중을 정리합니다.",
    publishDate: "2026-10-11",
    category: "자산배분",
  },
  {
    id: "v-yt-2026-4",
    videoId: "9miUBl3tBN4",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "'1억 넣으면 18억된다' 자녀에게 꼭 사줘야할 ETF 1가지",
    summary: "복리 효과를 극대화하는 장기 투자 ETF 선정 기준과 자녀 및 은퇴 준비자를 위한 적립식 연금 배분 전략을 제시합니다.",
    publishDate: "2026-10-10",
    category: "자산배분",
  },
  {
    id: "v-yt-2026-5",
    videoId: "5aLljhJuZE4",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "\"연 17% 배당\" 월 50만원 받던 배당금, 2년 만에 720만원 받게 된 비결",
    summary: "고배당 ETF 및 커버드콜 투자 시 유의할 원금 삭감 리스크와 연금계좌에서 안전하게 배당 현금흐름을 늘리는 방법을 설명합니다.",
    publishDate: "2026-10-09",
    category: "연금저축",
  },
  {
    id: "v-yt-2026-6",
    videoId: "Q9wpeP1eSng",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "배당금이 더 나왔어요! 월배당 포트폴리오 성과 점검",
    summary: "미국 배당성장 ETF와 커버드콜 상품을 조합한 월배당 연금 현금흐름 포트폴리오의 실전 운용 성과를 점검합니다.",
    publishDate: "2026-10-08",
    category: "자산배분",
  },
  {
    id: "v-yt-2026-7",
    videoId: "GBf6sppGNOo",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "2030이 연금 가입하면 손해인 이유 3가지",
    summary: "국민연금 개혁안에 따른 세대별 수령액 격차와 2030세대가 준비해야 할 사적연금(IRP, 개인연금)의 현실적 대안을 분석합니다.",
    publishDate: "2026-10-08",
    category: "국민연금",
  },
  {
    id: "v-yt-2026-8",
    videoId: "lgNU_QVSG2o",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "공무원 자산관리 / 공제회vs연금, ISA계좌 비중, 건보료 대책",
    summary: "공무원 및 직장인을 위한 교직원/행정공제회와 연금저축, IRP, ISA 간의 자산 배분 비율 및 퇴직 후 건강보험료 대비 전략을 제시합니다.",
    publishDate: "2026-10-07",
    category: "퇴직연금",
  },
  {
    id: "v-yt-2026-9",
    videoId: "X1O4PTOK4yo",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "99%가 모르는 연기비율선택제도",
    summary: "국민연금을 전부 연기하지 않고 일부(50~90%)만 연기하여 가산 이율(연 7.2%)을 챙기면서 생활비를 충당하는 핵심 꿀팁을 공개합니다.",
    publishDate: "2026-10-06",
    category: "국민연금",
  },
  {
    id: "v-yt-2026-10",
    videoId: "sz5N9WJS310",
    channelName: "박곰희TV",
    channelHandle: "@gomhee",
    title: "세공? 안세공? 연금수령 1500만원 건강보험료 영향 총정리",
    summary: "세액공제 받은 원금과 안 받은 원금의 인출 우선순위, 사적연금 연 1,500만원 분리과세 기준과 건강보험료 영향을 명쾌하게 정리합니다.",
    publishDate: "2026-10-05",
    category: "절세",
  },
  {
    id: "v-yt-2026-11",
    videoId: "htMolTaKYPA",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "기초연금 부부감액 축소 공무원연금 수급자도 기초연금 받는다",
    summary: "기초연금 40만원 인상 법안 및 부부감액 20% 축소 논의, 직역연금(공무원/군인/사학) 연계 이슈를 심층 해설합니다.",
    publishDate: "2026-10-04",
    category: "국민연금",
  },
  {
    id: "v-yt-2026-12",
    videoId: "KePrOe1mH78",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "국민연금 논란 총 정리 / 조기, 연기연금, 추납, 가입기간 효과",
    summary: "손해연금이라 불리는 조기노령연금과 연기연금의 손익분기점 나이, 추후납부(추납) 및 임의계속가입의 수익비 분석을 총정리합니다.",
    publishDate: "2026-10-01",
    category: "국민연금",
  },
  {
    id: "v-yt-2026-13",
    videoId: "XZ8_bQoywG0",
    channelName: "연금박사 이영주",
    channelHandle: "@pension500",
    title: "[표] 국민/퇴직/개인연금 건강보험료 부과기준",
    summary: "국민연금, 공무원연금 등 공적연금과 퇴직연금(IRP), 개인연금의 건강보험료 부과 차이와 피부양자 탈락 방지 기준을 총정리합니다.",
    publishDate: "2026-09-29",
    category: "건강보험",
  },
  {
    id: "v-yt-2026-14",
    videoId: "xjeTH0NA-KA",
    channelName: "연금이야기",
    channelHandle: "@PensionStory",
    title: "퇴직금 인출 전략 / 공제회, 연금계좌, ISA 비중과 건보료 대비",
    summary: "퇴직연금 일시금 vs 연금 수령의 퇴직소득세 감면(30~40%) 혜택 비교 및 절세계좌 인출 순서를 가이드합니다.",
    publishDate: "2026-09-28",
    category: "퇴직연금",
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
      cache: "no-store",
    };

    // Fetch RSS feeds from 3 expert channels in parallel (with 4s timeout)
    const channelResults = await Promise.allSettled(
      CHANNELS.map(async (channel) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        try {
          const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
          const res = await fetch(feedUrl, {
            ...fetchOptions,
            signal: controller.signal,
          });
          if (!res.ok) {
            throw new Error(`Failed to fetch YouTube RSS for ${channel.name}: ${res.status}`);
          }
          const xml = await res.text();
          if (xml.includes("<title>Error") || !xml.includes("<entry>")) {
            throw new Error(`YouTube RSS returned error page for ${channel.name}`);
          }
          return parseYoutubeRss(xml, channel);
        } finally {
          clearTimeout(timeoutId);
        }
      })
    );

    const liveVideos: YoutubeVideoItem[] = [];
    const missingChannels: ChannelConfig[] = [];

    channelResults.forEach((result, idx) => {
      const channel = CHANNELS[idx];
      if (result.status === "fulfilled" && result.value.length > 0) {
        liveVideos.push(...result.value);
      } else {
        missingChannels.push(channel);
        console.warn(
          `[YouTube API] Channel ${channel.name} live feed unavailable, falling back to curated seed:`,
          result.status === "rejected" ? result.reason : "Empty entries"
        );
      }
    });

    // Supplement missing channels with their curated fallback videos
    const supplementedVideos = [...liveVideos];
    for (const missing of missingChannels) {
      const fallbackForChannel = FALLBACK_VIDEOS.filter(
        (v) => v.channelHandle === missing.handle
      );
      supplementedVideos.push(...fallbackForChannel);
    }

    const finalVideos = supplementedVideos.length > 0 ? supplementedVideos : FALLBACK_VIDEOS;

    // Deduplicate by videoId
    const seen = new Set<string>();
    const deduplicatedVideos: YoutubeVideoItem[] = [];
    for (const v of finalVideos) {
      if (!seen.has(v.videoId)) {
        seen.add(v.videoId);
        deduplicatedVideos.push(v);
      }
    }

    // Always sort strictly by publishDate descending (newest first)
    deduplicatedVideos.sort((a, b) => b.publishDate.localeCompare(a.publishDate));

    return NextResponse.json(deduplicatedVideos.slice(0, 30), {
      headers: {
        "Cache-Control": isRefresh
          ? "no-cache, no-store, must-revalidate"
          : "public, max-age=60, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("Error in YouTube RSS API:", err);
    const sortedFallback = [...FALLBACK_VIDEOS].sort((a, b) =>
      b.publishDate.localeCompare(a.publishDate)
    );
    return NextResponse.json(sortedFallback, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
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
    // Remove links, hashtags, and normalize whitespaces
    let summary = rawDesc
      .replace(/https?:\/\/[^\s]+/g, "")
      .replace(/#[\w가-힣_]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!summary || summary.length < 10) {
      const cleanTitle = title.replace(/#[\w가-힣_]+/g, "").trim();
      summary = `${channel.name}의 최신 영상 '${cleanTitle}'입니다. 핵심 연금 자산관리 팁을 확인해보세요.`;
    } else if (summary.length > 800) {
      summary = summary.slice(0, 800).trim();
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
