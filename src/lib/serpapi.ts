const SERPAPI_BASE = "https://serpapi.com/search.json";

export interface SerpResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
}

export interface SerpApiResponse {
  keyword: string;
  results: SerpResult[];
  targetRank: number | null;
  targetUrl: string | null;
}

export async function checkKeywordRank(
  keyword: string,
  targetDomain: string,
  options?: { gl?: string; hl?: string; num?: number }
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    engine: "google",
    q: keyword,
    gl: options?.gl || "th",
    hl: options?.hl || "th",
    num: String(options?.num || 100),
  });

  const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpAPI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const organicResults: SerpResult[] = (data.organic_results || []).map(
    (r: { position: number; title: string; link: string; snippet: string }) => ({
      position: r.position,
      title: r.title,
      link: r.link,
      snippet: r.snippet || "",
    })
  );

  // Find target domain rank
  let targetRank: number | null = null;
  let targetUrl: string | null = null;
  const normalizedDomain = targetDomain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

  for (const result of organicResults) {
    try {
      const resultDomain = new URL(result.link).hostname.replace(/^www\./, "");
      if (resultDomain.includes(normalizedDomain) || normalizedDomain.includes(resultDomain)) {
        targetRank = result.position;
        targetUrl = result.link;
        break;
      }
    } catch {
      continue;
    }
  }

  return {
    keyword,
    results: organicResults.slice(0, 10),
    targetRank,
    targetUrl,
  };
}
