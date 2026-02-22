import * as cheerio from "cheerio";

export interface SeoAnalysisResult {
  url: string;
  meta: {
    title: string | null;
    titleLength: number;
    description: string | null;
    descriptionLength: number;
    canonical: string | null;
    robots: string | null;
    viewport: string | null;
    charset: string | null;
    lang: string | null;
  };
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
    type: string | null;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    list: { src: string; alt: string }[];
  };
  links: {
    total: number;
    internal: number;
    external: number;
    nofollow: number;
  };
  content: {
    wordCount: number;
    keywords: { word: string; count: number; density: number }[];
  };
  technical: {
    https: boolean;
    hasSchemaMarkup: boolean;
    schemaTypes: string[];
  };
}

export interface AuditCheckItem {
  id: string;
  category: string;
  name: string;
  status: "pass" | "warning" | "fail";
  message: string;
  weight: number;
}

export async function fetchAndAnalyze(url: string): Promise<SeoAnalysisResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SEOAnalyzerBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const parsedUrl = new URL(url);

  // Meta tags
  const title = $("title").first().text().trim() || null;
  const description = $('meta[name="description"]').attr("content")?.trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const robots = $('meta[name="robots"]').attr("content") || null;
  const viewport = $('meta[name="viewport"]').attr("content") || null;
  const charset = $("meta[charset]").attr("charset") || $('meta[http-equiv="Content-Type"]').attr("content") || null;
  const lang = $("html").attr("lang") || null;

  // Open Graph
  const og = {
    title: $('meta[property="og:title"]').attr("content") || null,
    description: $('meta[property="og:description"]').attr("content") || null,
    image: $('meta[property="og:image"]').attr("content") || null,
    url: $('meta[property="og:url"]').attr("content") || null,
    type: $('meta[property="og:type"]').attr("content") || null,
  };

  // Headings
  const headings = {
    h1: $("h1").map((_, el) => $(el).text().trim()).get(),
    h2: $("h2").map((_, el) => $(el).text().trim()).get(),
    h3: $("h3").map((_, el) => $(el).text().trim()).get(),
    h4: $("h4").map((_, el) => $(el).text().trim()).get(),
    h5: $("h5").map((_, el) => $(el).text().trim()).get(),
    h6: $("h6").map((_, el) => $(el).text().trim()).get(),
  };

  // Images
  const imageList: { src: string; alt: string }[] = [];
  $("img").each((_, el) => {
    imageList.push({
      src: $(el).attr("src") || "",
      alt: $(el).attr("alt") || "",
    });
  });

  // Links
  let internalLinks = 0;
  let externalLinks = 0;
  let nofollowLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const rel = $(el).attr("rel") || "";
    if (rel.includes("nofollow")) nofollowLinks++;
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === parsedUrl.hostname) internalLinks++;
      else externalLinks++;
    } catch {
      internalLinks++;
    }
  });

  // Content & keyword density
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const words = bodyText.split(/\s+/).filter((w) => w.length > 2);
  const wordCount = words.length;
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(["the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "has", "have", "this", "that", "with", "from", "they", "been", "said", "each", "which", "their", "will", "other", "about", "many", "then", "them", "these", "some", "would", "make", "like", "into", "could", "time", "very", "when", "come", "made", "find", "more", "than"]);
  for (const w of words) {
    const lower = w.toLowerCase().replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, "");
    if (lower.length > 2 && !stopWords.has(lower)) {
      wordFreq[lower] = (wordFreq[lower] || 0) + 1;
    }
  }
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({
      word,
      count,
      density: Math.round((count / Math.max(wordCount, 1)) * 10000) / 100,
    }));

  // Schema markup
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}");
      if (json["@type"]) schemaTypes.push(json["@type"]);
      if (Array.isArray(json["@graph"])) {
        for (const item of json["@graph"]) {
          if (item["@type"]) schemaTypes.push(item["@type"]);
        }
      }
    } catch { /* ignore */ }
  });

  return {
    url,
    meta: {
      title,
      titleLength: title?.length || 0,
      description,
      descriptionLength: description?.length || 0,
      canonical,
      robots,
      viewport,
      charset,
      lang,
    },
    og,
    headings,
    images: {
      total: imageList.length,
      withAlt: imageList.filter((i) => i.alt.length > 0).length,
      withoutAlt: imageList.filter((i) => i.alt.length === 0).length,
      list: imageList.slice(0, 50),
    },
    links: {
      total: internalLinks + externalLinks,
      internal: internalLinks,
      external: externalLinks,
      nofollow: nofollowLinks,
    },
    content: { wordCount, keywords },
    technical: {
      https: parsedUrl.protocol === "https:",
      hasSchemaMarkup: schemaTypes.length > 0,
      schemaTypes,
    },
  };
}

export function runAudit(analysis: SeoAnalysisResult): { checks: AuditCheckItem[]; score: number } {
  const checks: AuditCheckItem[] = [];

  const add = (id: string, category: string, name: string, status: AuditCheckItem["status"], message: string, weight: number) => {
    checks.push({ id, category, name, status, message, weight });
  };

  // === Meta Tags ===
  const tl = analysis.meta.titleLength;
  if (!analysis.meta.title) add("meta-title", "Meta Tags", "Title Tag", "fail", "ไม่มี title tag", 10);
  else if (tl < 30) add("meta-title", "Meta Tags", "Title Tag", "warning", `Title สั้นเกินไป (${tl} ตัวอักษร, แนะนำ 30-60)`, 10);
  else if (tl > 60) add("meta-title", "Meta Tags", "Title Tag", "warning", `Title ยาวเกินไป (${tl} ตัวอักษร, แนะนำ 30-60)`, 10);
  else add("meta-title", "Meta Tags", "Title Tag", "pass", `Title ดี (${tl} ตัวอักษร)`, 10);

  const dl = analysis.meta.descriptionLength;
  if (!analysis.meta.description) add("meta-desc", "Meta Tags", "Meta Description", "fail", "ไม่มี meta description", 8);
  else if (dl < 120) add("meta-desc", "Meta Tags", "Meta Description", "warning", `Description สั้นเกินไป (${dl} ตัวอักษร, แนะนำ 120-160)`, 8);
  else if (dl > 160) add("meta-desc", "Meta Tags", "Meta Description", "warning", `Description ยาวเกินไป (${dl} ตัวอักษร, แนะนำ 120-160)`, 8);
  else add("meta-desc", "Meta Tags", "Meta Description", "pass", `Description ดี (${dl} ตัวอักษร)`, 8);

  add("meta-canonical", "Meta Tags", "Canonical URL", analysis.meta.canonical ? "pass" : "warning", analysis.meta.canonical ? "มี canonical URL" : "ไม่มี canonical URL", 5);
  add("meta-robots", "Meta Tags", "Robots Meta", analysis.meta.robots !== "noindex" ? "pass" : "warning", analysis.meta.robots ? `robots: ${analysis.meta.robots}` : "ไม่มี robots meta (ค่าเริ่มต้น: index, follow)", 3);

  // === Open Graph ===
  add("og-title", "Open Graph", "OG Title", analysis.og.title ? "pass" : "warning", analysis.og.title ? "มี og:title" : "ไม่มี og:title", 4);
  add("og-desc", "Open Graph", "OG Description", analysis.og.description ? "pass" : "warning", analysis.og.description ? "มี og:description" : "ไม่มี og:description", 4);
  add("og-image", "Open Graph", "OG Image", analysis.og.image ? "pass" : "warning", analysis.og.image ? "มี og:image" : "ไม่มี og:image — แชร์บน social media จะไม่มีรูป", 5);
  add("og-url", "Open Graph", "OG URL", analysis.og.url ? "pass" : "warning", analysis.og.url ? "มี og:url" : "ไม่มี og:url", 2);

  // === Headings ===
  const h1Count = analysis.headings.h1.length;
  if (h1Count === 0) add("h1-exists", "Headings", "H1 Tag", "fail", "ไม่มี H1 tag", 8);
  else if (h1Count === 1) add("h1-exists", "Headings", "H1 Tag", "pass", "มี H1 tag 1 ตัว (ดี)", 8);
  else add("h1-exists", "Headings", "H1 Tag", "warning", `มี H1 tag ${h1Count} ตัว (แนะนำ 1 ตัว)`, 8);

  const hasH2 = analysis.headings.h2.length > 0;
  add("h2-exists", "Headings", "H2 Tags", hasH2 ? "pass" : "warning", hasH2 ? `มี ${analysis.headings.h2.length} H2 tags` : "ไม่มี H2 tag — ควรมีเพื่อจัดโครงสร้างเนื้อหา", 4);

  // === Images ===
  if (analysis.images.total === 0) {
    add("img-alt", "Images", "Image Alt Text", "warning", "ไม่มีรูปภาพในหน้า", 3);
  } else {
    const pct = Math.round((analysis.images.withAlt / analysis.images.total) * 100);
    if (pct === 100) add("img-alt", "Images", "Image Alt Text", "pass", `รูปภาพทั้งหมด ${analysis.images.total} รูปมี alt text`, 6);
    else if (pct >= 80) add("img-alt", "Images", "Image Alt Text", "warning", `${analysis.images.withoutAlt} จาก ${analysis.images.total} รูปไม่มี alt text`, 6);
    else add("img-alt", "Images", "Image Alt Text", "fail", `${analysis.images.withoutAlt} จาก ${analysis.images.total} รูปไม่มี alt text`, 6);
  }

  // === Links ===
  add("links-internal", "Links", "Internal Links", analysis.links.internal > 0 ? "pass" : "warning", `Internal links: ${analysis.links.internal}`, 4);
  add("links-external", "Links", "External Links", analysis.links.external > 0 ? "pass" : "warning", `External links: ${analysis.links.external}`, 2);

  // === Content ===
  const wc = analysis.content.wordCount;
  if (wc < 300) add("content-length", "Content", "Content Length", "fail", `เนื้อหาน้อยเกินไป (${wc} คำ, แนะนำ 300+)`, 7);
  else if (wc < 600) add("content-length", "Content", "Content Length", "warning", `เนื้อหาพอใช้ (${wc} คำ, แนะนำ 600+)`, 7);
  else add("content-length", "Content", "Content Length", "pass", `เนื้อหาดี (${wc} คำ)`, 7);

  // === Technical ===
  add("tech-https", "Technical", "HTTPS", analysis.technical.https ? "pass" : "fail", analysis.technical.https ? "ใช้ HTTPS" : "ไม่ได้ใช้ HTTPS — ไม่ปลอดภัย", 8);
  add("tech-viewport", "Technical", "Mobile Viewport", analysis.meta.viewport ? "pass" : "fail", analysis.meta.viewport ? "มี viewport meta tag" : "ไม่มี viewport — ไม่ responsive", 6);
  add("tech-lang", "Technical", "Language Attribute", analysis.meta.lang ? "pass" : "warning", analysis.meta.lang ? `lang="${analysis.meta.lang}"` : "ไม่มี lang attribute บน <html>", 3);
  add("tech-charset", "Technical", "Character Encoding", analysis.meta.charset ? "pass" : "warning", analysis.meta.charset ? `charset: ${analysis.meta.charset}` : "ไม่มี charset declaration", 3);

  // === Schema ===
  add("schema-ld", "Technical", "Schema Markup (JSON-LD)", analysis.technical.hasSchemaMarkup ? "pass" : "warning",
    analysis.technical.hasSchemaMarkup ? `พบ Schema: ${analysis.technical.schemaTypes.join(", ")}` : "ไม่มี JSON-LD structured data", 5);

  // Calculate score
  let totalWeight = 0;
  let earnedWeight = 0;
  for (const c of checks) {
    totalWeight += c.weight;
    if (c.status === "pass") earnedWeight += c.weight;
    else if (c.status === "warning") earnedWeight += c.weight * 0.5;
  }
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return { checks, score };
}
