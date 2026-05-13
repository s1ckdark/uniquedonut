export const defaultEbsDocumentaryQuery = "EBS 다큐멘터리";

export const suggestedEbsQueries = [
  "EBS 다큐프라임",
  "EBS 명의",
  "EBS 세계테마기행",
  "EBS 지식채널e",
] as const;

export interface EbsDocumentary {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  description: string;
  summary: string;
  thumbnailUrl: string;
  watchUrl: string;
}

export type EbsDocumentarySearchResult =
  | {
      status: "success";
      query: string;
      items: EbsDocumentary[];
    }
  | {
      status: "missing-key";
      query: string;
      items: [];
    }
  | {
      status: "error";
      query: string;
      message: string;
      items: [];
    };

const youtubeSearchEndpoint = "https://www.googleapis.com/youtube/v3/search";
const maxResults = "12";

export async function searchEbsDocumentaries(
  rawQuery: string,
): Promise<EbsDocumentarySearchResult> {
  const query = normalizeEbsQuery(rawQuery);
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return { status: "missing-key", query, items: [] };
  }

  const url = new URL(youtubeSearchEndpoint);
  url.search = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    type: "video",
    q: query,
    maxResults,
    order: "relevance",
    safeSearch: "moderate",
    regionCode: "KR",
    relevanceLanguage: "ko",
    fields:
      "items(id/videoId,snippet(title,description,thumbnails,channelTitle,publishedAt))",
  }).toString();

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 } });
    const payload = await readJson(response);

    if (!response.ok) {
      return {
        status: "error",
        query,
        message: getApiErrorMessage(payload) ?? `YouTube API request failed with ${response.status}.`,
        items: [],
      };
    }

    if (!isRecord(payload) || !Array.isArray(payload.items)) {
      return {
        status: "error",
        query,
        message: "YouTube API returned an unexpected response shape.",
        items: [],
      };
    }

    return {
      status: "success",
      query,
      items: payload.items.flatMap((item) => {
        const documentary = toDocumentary(item);
        return documentary ? [documentary] : [];
      }),
    };
  } catch (error) {
    return {
      status: "error",
      query,
      message: error instanceof Error ? error.message : "YouTube search failed unexpectedly.",
      items: [],
    };
  }
}

export function normalizeEbsQuery(rawQuery: string): string {
  const query = cleanText(rawQuery) || defaultEbsDocumentaryQuery;
  return /\bebs\b/i.test(query) ? query : `EBS ${query}`;
}

function toDocumentary(item: unknown): EbsDocumentary | null {
  if (!isRecord(item) || !isRecord(item.id) || !isRecord(item.snippet)) {
    return null;
  }

  const videoId = readString(item.id.videoId);
  const title = readString(item.snippet.title);
  const channelTitle = readString(item.snippet.channelTitle);
  const publishedAt = readString(item.snippet.publishedAt);
  const description = cleanText(readString(item.snippet.description));
  const thumbnailUrl = readThumbnailUrl(item.snippet.thumbnails);

  if (!videoId || !title || !thumbnailUrl) {
    return null;
  }

  return {
    videoId,
    title: cleanText(title),
    channelTitle: channelTitle || "YouTube",
    publishedAt,
    description,
    summary: summarizeDescription(description),
    thumbnailUrl,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

function summarizeDescription(description: string): string {
  const withoutLinks = description.replace(/https?:\/\/\S+/g, "").trim();

  if (!withoutLinks) {
    return "YouTube 설명이 없어 제목과 채널 정보를 기준으로 확인하세요.";
  }

  return truncateText(withoutLinks, 190);
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function readThumbnailUrl(value: unknown): string {
  if (!isRecord(value)) {
    return "";
  }

  const preferred = ["maxres", "standard", "high", "medium", "default"];

  for (const key of preferred) {
    const thumbnail = value[key];
    if (!isRecord(thumbnail)) {
      continue;
    }

    const url = readString(thumbnail.url);
    if (url) {
      return url;
    }
  }

  return "";
}

function getApiErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }

  return readString(payload.error.message) || null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Unable to parse YouTube response.",
      },
    };
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
