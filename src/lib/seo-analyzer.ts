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
    keywords: string | null;
    author: string | null;
    generator: string | null;
    themeColor: string | null;
  };
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
    type: string | null;
    siteName: string | null;
    locale: string | null;
  };
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    site: string | null;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
    totalCount: number;
    hasProperHierarchy: boolean;
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    withTitle: number;
    withLazyLoad: number;
    largeImages: number;
    list: { src: string; alt: string; width?: string; height?: string; loading?: string }[];
  };
  links: {
    total: number;
    internal: number;
    external: number;
    nofollow: number;
    broken: { href: string; text: string }[];
    hasEmptyAnchors: number;
    uniqueInternal: number;
    uniqueExternal: number;
  };
  content: {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgWordsPerSentence: number;
    readingTimeMinutes: number;
    keywords: { word: string; count: number; density: number }[];
    hasIframe: boolean;
    hasForms: boolean;
    hasVideo: boolean;
    hasAudio: boolean;
    textToHtmlRatio: number;
  };
  technical: {
    https: boolean;
    hasSchemaMarkup: boolean;
    schemaTypes: string[];
    hasFavicon: boolean;
    hasAppleTouchIcon: boolean;
    hasManifest: boolean;
    hasSitemap: boolean;
    hasRobotsTxt: boolean;
    hasAmpVersion: boolean;
    hasHreflang: boolean;
    hreflangTags: { lang: string; href: string }[];
    hasPrefetch: boolean;
    hasPreconnect: boolean;
    cssFiles: number;
    jsFiles: number;
    inlineStyles: number;
    inlineScripts: number;
    responseTimeMs: number;
    htmlSize: number;
  };
  security: {
    hasHttps: boolean;
    hasMixedContent: boolean;
    hasContentSecurityPolicy: boolean;
    hasXFrameOptions: boolean;
    hasXContentTypeOptions: boolean;
    hasStrictTransportSecurity: boolean;
  };
  social: {
    hasFacebookPixel: boolean;
    hasGoogleAnalytics: boolean;
    hasGoogleTagManager: boolean;
    hasTwitterPixel: boolean;
    hasTikTokPixel: boolean;
    hasLinkedInPixel: boolean;
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
  const startTime = Date.now();
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SEOAnalyzerBot/2.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const html = await res.text();
  const responseTimeMs = Date.now() - startTime;
  const $ = cheerio.load(html);
  const parsedUrl = new URL(url);

  // === Security Headers ===
  const headers = res.headers;
  const security = {
    hasHttps: parsedUrl.protocol === "https:",
    hasMixedContent: false,
    hasContentSecurityPolicy: !!headers.get("content-security-policy"),
    hasXFrameOptions: !!headers.get("x-frame-options"),
    hasXContentTypeOptions: !!headers.get("x-content-type-options"),
    hasStrictTransportSecurity: !!headers.get("strict-transport-security"),
  };

  // Check mixed content
  if (security.hasHttps) {
    $("[src], [href]").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("href") || "";
      if (src.startsWith("http://") && !src.includes("localhost")) {
        security.hasMixedContent = true;
      }
    });
  }

  // === Meta Tags ===
  const title = $("title").first().text().trim() || null;
  const description = $('meta[name="description"]').attr("content")?.trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const robots = $('meta[name="robots"]').attr("content") || null;
  const viewport = $('meta[name="viewport"]').attr("content") || null;
  const charset = $("meta[charset]").attr("charset") || $('meta[http-equiv="Content-Type"]').attr("content") || null;
  const lang = $("html").attr("lang") || null;
  const metaKeywords = $('meta[name="keywords"]').attr("content") || null;
  const author = $('meta[name="author"]').attr("content") || null;
  const generator = $('meta[name="generator"]').attr("content") || null;
  const themeColor = $('meta[name="theme-color"]').attr("content") || null;

  // === Open Graph ===
  const og = {
    title: $('meta[property="og:title"]').attr("content") || null,
    description: $('meta[property="og:description"]').attr("content") || null,
    image: $('meta[property="og:image"]').attr("content") || null,
    url: $('meta[property="og:url"]').attr("content") || null,
    type: $('meta[property="og:type"]').attr("content") || null,
    siteName: $('meta[property="og:site_name"]').attr("content") || null,
    locale: $('meta[property="og:locale"]').attr("content") || null,
  };

  // === Twitter Card ===
  const twitter = {
    card: $('meta[name="twitter:card"]').attr("content") || null,
    title: $('meta[name="twitter:title"]').attr("content") || null,
    description: $('meta[name="twitter:description"]').attr("content") || null,
    image: $('meta[name="twitter:image"]').attr("content") || null,
    site: $('meta[name="twitter:site"]').attr("content") || null,
  };

  // === Headings ===
  const h1 = $("h1").map((_, el) => $(el).text().trim()).get();
  const h2 = $("h2").map((_, el) => $(el).text().trim()).get();
  const h3 = $("h3").map((_, el) => $(el).text().trim()).get();
  const h4 = $("h4").map((_, el) => $(el).text().trim()).get();
  const h5 = $("h5").map((_, el) => $(el).text().trim()).get();
  const h6 = $("h6").map((_, el) => $(el).text().trim()).get();
  const totalHeadingCount = h1.length + h2.length + h3.length + h4.length + h5.length + h6.length;

  // Check heading hierarchy
  let hasProperHierarchy = true;
  const headingOrder: number[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    headingOrder.push(parseInt(el.tagName.replace("h", "")));
  });
  for (let i = 1; i < headingOrder.length; i++) {
    if (headingOrder[i] > headingOrder[i - 1] + 1) {
      hasProperHierarchy = false;
      break;
    }
  }

  // === Images ===
  const imageList: { src: string; alt: string; width?: string; height?: string; loading?: string }[] = [];
  let withTitle = 0;
  let withLazyLoad = 0;
  let largeImages = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt") || "";
    const loading = $(el).attr("loading") || "";
    if ($(el).attr("title")) withTitle++;
    if (loading === "lazy") withLazyLoad++;
    const w = $(el).attr("width");
    const h = $(el).attr("height");
    if ((w && parseInt(w) > 1200) || (h && parseInt(h) > 1200)) largeImages++;
    imageList.push({
      src: $(el).attr("src") || "",
      alt,
      width: w || undefined,
      height: h || undefined,
      loading: loading || undefined,
    });
  });

  // === Links ===
  let internalLinks = 0;
  let externalLinks = 0;
  let nofollowLinks = 0;
  let hasEmptyAnchors = 0;
  const brokenLinks: { href: string; text: string }[] = [];
  const internalSet = new Set<string>();
  const externalSet = new Set<string>();

  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    const rel = $(el).attr("rel") || "";

    if (!href || href === "#" || href === "javascript:void(0)") {
      hasEmptyAnchors++;
      return;
    }

    if (rel.includes("nofollow")) nofollowLinks++;

    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === parsedUrl.hostname) {
        internalLinks++;
        internalSet.add(linkUrl.pathname);
      } else {
        externalLinks++;
        externalSet.add(linkUrl.hostname);
      }
    } catch {
      if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
        internalLinks++;
      } else {
        brokenLinks.push({ href, text: text.slice(0, 50) });
      }
    }
  });

  // === Content Analysis ===
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const charCount = bodyText.length;
  const words = bodyText.split(/\s+/).filter((w) => w.length > 2);
  const wordCount = words.length;
  const sentences = bodyText.split(/[.!?。！？]+/).filter((s) => s.trim().length > 10);
  const sentenceCount = sentences.length;
  const paragraphCount = $("p").length;
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));
  const textToHtmlRatio = html.length > 0 ? Math.round((charCount / html.length) * 10000) / 100 : 0;

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
    .slice(0, 30)
    .map(([word, count]) => ({
      word,
      count,
      density: Math.round((count / Math.max(wordCount, 1)) * 10000) / 100,
    }));

  // === Schema Markup ===
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

  // === Technical ===
  const hasFavicon = !!$('link[rel="icon"], link[rel="shortcut icon"]').length;
  const hasAppleTouchIcon = !!$('link[rel="apple-touch-icon"]').length;
  const hasManifest = !!$('link[rel="manifest"]').length;
  const hasAmpVersion = !!$('link[rel="amphtml"]').length;
  const hasPrefetch = !!$('link[rel="dns-prefetch"]').length;
  const hasPreconnect = !!$('link[rel="preconnect"]').length;
  const cssFiles = $('link[rel="stylesheet"]').length;
  const jsFiles = $("script[src]").length;
  const inlineStyles = $("style").length;
  const inlineScripts = $("script:not([src])").length;

  // Hreflang
  const hreflangTags: { lang: string; href: string }[] = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    hreflangTags.push({
      lang: $(el).attr("hreflang") || "",
      href: $(el).attr("href") || "",
    });
  });

  // === Sitemap & Robots.txt check ===
  let hasSitemap = false;
  let hasRobotsTxt = false;
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  try {
    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`, { signal: AbortSignal.timeout(5000), method: "HEAD" });
    hasSitemap = sitemapRes.ok;
  } catch { /* ignore */ }
  try {
    const robotsRes = await fetch(`${baseUrl}/robots.txt`, { signal: AbortSignal.timeout(5000), method: "HEAD" });
    hasRobotsTxt = robotsRes.ok;
  } catch { /* ignore */ }

  // === Social / Tracking Pixels ===
  const allScripts = $("script").map((_, el) => $(el).html() || "").get().join(" ");
  const allSrc = $("script[src]").map((_, el) => $(el).attr("src") || "").get().join(" ");
  const social = {
    hasFacebookPixel: allScripts.includes("fbq(") || allSrc.includes("fbevents.js"),
    hasGoogleAnalytics: allScripts.includes("gtag(") || allSrc.includes("google-analytics") || allSrc.includes("googletagmanager") || allScripts.includes("ga("),
    hasGoogleTagManager: allScripts.includes("GTM-") || allSrc.includes("gtm.js"),
    hasTwitterPixel: allScripts.includes("twq(") || allSrc.includes("static.ads-twitter.com"),
    hasTikTokPixel: allScripts.includes("ttq.") || allSrc.includes("analytics.tiktok.com"),
    hasLinkedInPixel: allScripts.includes("_linkedin_partner_id") || allSrc.includes("snap.licdn.com"),
  };

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
      keywords: metaKeywords,
      author,
      generator,
      themeColor,
    },
    og,
    twitter,
    headings: { h1, h2, h3, h4, h5, h6, totalCount: totalHeadingCount, hasProperHierarchy },
    images: {
      total: imageList.length,
      withAlt: imageList.filter((i) => i.alt.length > 0).length,
      withoutAlt: imageList.filter((i) => i.alt.length === 0).length,
      withTitle,
      withLazyLoad,
      largeImages,
      list: imageList.slice(0, 50),
    },
    links: {
      total: internalLinks + externalLinks,
      internal: internalLinks,
      external: externalLinks,
      nofollow: nofollowLinks,
      broken: brokenLinks.slice(0, 20),
      hasEmptyAnchors,
      uniqueInternal: internalSet.size,
      uniqueExternal: externalSet.size,
    },
    content: {
      wordCount,
      charCount,
      sentenceCount,
      paragraphCount,
      avgWordsPerSentence,
      readingTimeMinutes,
      keywords,
      hasIframe: $("iframe").length > 0,
      hasForms: $("form").length > 0,
      hasVideo: $("video").length > 0 || $('iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0,
      hasAudio: $("audio").length > 0,
      textToHtmlRatio,
    },
    technical: {
      https: parsedUrl.protocol === "https:",
      hasSchemaMarkup: schemaTypes.length > 0,
      schemaTypes,
      hasFavicon,
      hasAppleTouchIcon,
      hasManifest,
      hasSitemap,
      hasRobotsTxt,
      hasAmpVersion,
      hasHreflang: hreflangTags.length > 0,
      hreflangTags,
      hasPrefetch,
      hasPreconnect,
      cssFiles,
      jsFiles,
      inlineStyles,
      inlineScripts,
      responseTimeMs,
      htmlSize: html.length,
    },
    security,
    social,
  };
}

export function runAudit(analysis: SeoAnalysisResult): { checks: AuditCheckItem[]; score: number } {
  const checks: AuditCheckItem[] = [];

  const add = (id: string, category: string, name: string, status: AuditCheckItem["status"], message: string, weight: number) => {
    checks.push({ id, category, name, status, message, weight });
  };

  // =============================================
  // === Meta Tags (6 checks) ===
  // =============================================
  const tl = analysis.meta.titleLength;
  if (!analysis.meta.title) add("meta-title", "Meta Tags", "Title Tag", "fail", "ไม่มี title tag — สำคัญมากสำหรับ SEO", 10);
  else if (tl < 30) add("meta-title", "Meta Tags", "Title Tag", "warning", `Title สั้นเกินไป (${tl} ตัวอักษร, แนะนำ 30-60)`, 10);
  else if (tl > 60) add("meta-title", "Meta Tags", "Title Tag", "warning", `Title ยาวเกินไป (${tl} ตัวอักษร, แนะนำ 30-60) อาจถูกตัดใน Google`, 10);
  else add("meta-title", "Meta Tags", "Title Tag", "pass", `Title ดี (${tl} ตัวอักษร)`, 10);

  const dl = analysis.meta.descriptionLength;
  if (!analysis.meta.description) add("meta-desc", "Meta Tags", "Meta Description", "fail", "ไม่มี meta description — Google จะเลือกข้อความเอง", 8);
  else if (dl < 120) add("meta-desc", "Meta Tags", "Meta Description", "warning", `Description สั้นเกินไป (${dl} ตัวอักษร, แนะนำ 120-160)`, 8);
  else if (dl > 160) add("meta-desc", "Meta Tags", "Meta Description", "warning", `Description ยาวเกินไป (${dl} ตัวอักษร, แนะนำ 120-160) จะถูกตัด`, 8);
  else add("meta-desc", "Meta Tags", "Meta Description", "pass", `Description ดี (${dl} ตัวอักษร)`, 8);

  add("meta-canonical", "Meta Tags", "Canonical URL", analysis.meta.canonical ? "pass" : "warning", analysis.meta.canonical ? `Canonical: ${analysis.meta.canonical}` : "ไม่มี canonical URL — อาจเกิด duplicate content", 5);

  add("meta-robots", "Meta Tags", "Robots Meta", analysis.meta.robots !== "noindex" ? "pass" : "fail",
    analysis.meta.robots === "noindex" ? "หน้านี้ถูก noindex — Google จะไม่ index" : analysis.meta.robots ? `robots: ${analysis.meta.robots}` : "ไม่มี robots meta (ค่าเริ่มต้น: index, follow)", 4);

  add("meta-keywords", "Meta Tags", "Meta Keywords", "pass",
    analysis.meta.keywords ? `มี meta keywords: ${analysis.meta.keywords.slice(0, 80)}...` : "ไม่มี meta keywords (Google ไม่ใช้แล้ว แต่ Bing/Baidu ยังใช้)", 1);

  add("meta-author", "Meta Tags", "Author Meta", analysis.meta.author ? "pass" : "warning",
    analysis.meta.author ? `Author: ${analysis.meta.author}` : "ไม่มี meta author", 1);

  // =============================================
  // === Open Graph (6 checks) ===
  // =============================================
  add("og-title", "Open Graph", "OG Title", analysis.og.title ? "pass" : "warning", analysis.og.title ? `og:title = "${analysis.og.title.slice(0, 60)}"` : "ไม่มี og:title — แชร์บน Facebook จะไม่มีหัวข้อ", 4);
  add("og-desc", "Open Graph", "OG Description", analysis.og.description ? "pass" : "warning", analysis.og.description ? "มี og:description" : "ไม่มี og:description", 3);
  add("og-image", "Open Graph", "OG Image", analysis.og.image ? "pass" : "warning", analysis.og.image ? "มี og:image" : "ไม่มี og:image — แชร์บน social media จะไม่มีรูป", 5);
  add("og-url", "Open Graph", "OG URL", analysis.og.url ? "pass" : "warning", analysis.og.url ? "มี og:url" : "ไม่มี og:url", 2);
  add("og-type", "Open Graph", "OG Type", analysis.og.type ? "pass" : "warning", analysis.og.type ? `og:type = "${analysis.og.type}"` : "ไม่มี og:type (แนะนำ website หรือ article)", 2);
  add("og-sitename", "Open Graph", "OG Site Name", analysis.og.siteName ? "pass" : "warning", analysis.og.siteName ? `og:site_name = "${analysis.og.siteName}"` : "ไม่มี og:site_name", 1);

  // =============================================
  // === Twitter Card (3 checks) ===
  // =============================================
  add("tw-card", "Twitter Card", "Twitter Card Type", analysis.twitter.card ? "pass" : "warning",
    analysis.twitter.card ? `twitter:card = "${analysis.twitter.card}"` : "ไม่มี twitter:card — แชร์บน Twitter/X จะไม่มี card preview", 3);
  add("tw-title", "Twitter Card", "Twitter Title", analysis.twitter.title ? "pass" : "warning",
    analysis.twitter.title ? "มี twitter:title" : "ไม่มี twitter:title (จะใช้ og:title แทน)", 2);
  add("tw-image", "Twitter Card", "Twitter Image", analysis.twitter.image ? "pass" : "warning",
    analysis.twitter.image ? "มี twitter:image" : "ไม่มี twitter:image (จะใช้ og:image แทน)", 2);

  // =============================================
  // === Headings (4 checks) ===
  // =============================================
  const h1Count = analysis.headings.h1.length;
  if (h1Count === 0) add("h1-exists", "Headings", "H1 Tag", "fail", "ไม่มี H1 tag — สำคัญมากสำหรับ SEO", 8);
  else if (h1Count === 1) add("h1-exists", "Headings", "H1 Tag", "pass", `H1: "${analysis.headings.h1[0].slice(0, 60)}"`, 8);
  else add("h1-exists", "Headings", "H1 Tag", "warning", `มี H1 tag ${h1Count} ตัว (แนะนำ 1 ตัว)`, 8);

  add("h2-exists", "Headings", "H2 Tags", analysis.headings.h2.length > 0 ? "pass" : "warning",
    analysis.headings.h2.length > 0 ? `มี ${analysis.headings.h2.length} H2 tags` : "ไม่มี H2 tag — ควรมีเพื่อจัดโครงสร้างเนื้อหา", 4);

  add("heading-hierarchy", "Headings", "Heading Hierarchy", analysis.headings.hasProperHierarchy ? "pass" : "warning",
    analysis.headings.hasProperHierarchy ? "โครงสร้าง Heading เรียงลำดับถูกต้อง" : "โครงสร้าง Heading ข้ามลำดับ (เช่น H1 → H3 โดยไม่มี H2)", 4);

  add("heading-count", "Headings", "Total Headings", analysis.headings.totalCount > 3 ? "pass" : analysis.headings.totalCount > 0 ? "warning" : "fail",
    `มี Heading ทั้งหมด ${analysis.headings.totalCount} ตัว (H1:${h1Count} H2:${analysis.headings.h2.length} H3:${analysis.headings.h3.length})`, 3);

  // =============================================
  // === Images (4 checks) ===
  // =============================================
  if (analysis.images.total === 0) {
    add("img-alt", "Images", "Image Alt Text", "warning", "ไม่มีรูปภาพในหน้า — รูปภาพช่วยเพิ่ม engagement", 3);
  } else {
    const pct = Math.round((analysis.images.withAlt / analysis.images.total) * 100);
    if (pct === 100) add("img-alt", "Images", "Image Alt Text", "pass", `รูปภาพทั้งหมด ${analysis.images.total} รูปมี alt text (100%)`, 6);
    else if (pct >= 80) add("img-alt", "Images", "Image Alt Text", "warning", `${analysis.images.withoutAlt} จาก ${analysis.images.total} รูปไม่มี alt text (${pct}% มี)`, 6);
    else add("img-alt", "Images", "Image Alt Text", "fail", `${analysis.images.withoutAlt} จาก ${analysis.images.total} รูปไม่มี alt text (${pct}% มี) — ส่งผลต่อ SEO และ Accessibility`, 6);

    add("img-lazy", "Images", "Lazy Loading", analysis.images.withLazyLoad > 0 ? "pass" : "warning",
      analysis.images.withLazyLoad > 0 ? `${analysis.images.withLazyLoad} จาก ${analysis.images.total} รูปใช้ lazy loading` : "ไม่มีรูปใช้ lazy loading — ช่วยให้โหลดเร็วขึ้น", 3);

    add("img-large", "Images", "Large Images", analysis.images.largeImages === 0 ? "pass" : "warning",
      analysis.images.largeImages === 0 ? "ไม่พบรูปขนาดใหญ่เกินไป" : `พบ ${analysis.images.largeImages} รูปขนาดใหญ่ (>1200px) — ควร optimize`, 3);
  }

  // =============================================
  // === Links (5 checks) ===
  // =============================================
  add("links-internal", "Links", "Internal Links", analysis.links.internal > 3 ? "pass" : analysis.links.internal > 0 ? "warning" : "fail",
    `Internal links: ${analysis.links.internal} (${analysis.links.uniqueInternal} unique pages)`, 4);

  add("links-external", "Links", "External Links", analysis.links.external > 0 ? "pass" : "warning",
    `External links: ${analysis.links.external} (${analysis.links.uniqueExternal} unique domains)`, 2);

  add("links-broken", "Links", "Broken Links", analysis.links.broken.length === 0 ? "pass" : "warning",
    analysis.links.broken.length === 0 ? "ไม่พบลิงก์ที่ผิดรูปแบบ" : `พบ ${analysis.links.broken.length} ลิงก์ที่อาจมีปัญหา`, 4);

  add("links-empty", "Links", "Empty Anchors", analysis.links.hasEmptyAnchors === 0 ? "pass" : "warning",
    analysis.links.hasEmptyAnchors === 0 ? "ไม่มี anchor tag ว่าง" : `พบ ${analysis.links.hasEmptyAnchors} anchor ว่าง (href="#" หรือไม่มี href)`, 2);

  add("links-nofollow", "Links", "Nofollow Links", "pass",
    analysis.links.nofollow > 0 ? `มี ${analysis.links.nofollow} nofollow links` : "ไม่มี nofollow links", 1);

  // =============================================
  // === Content (5 checks) ===
  // =============================================
  const wc = analysis.content.wordCount;
  if (wc < 300) add("content-length", "Content", "Content Length", "fail", `เนื้อหาน้อยเกินไป (${wc} คำ, แนะนำ 300+) — Google ชอบเนื้อหาที่ครบถ้วน`, 7);
  else if (wc < 600) add("content-length", "Content", "Content Length", "warning", `เนื้อหาพอใช้ (${wc} คำ, แนะนำ 600+ สำหรับ ranking ที่ดี)`, 7);
  else if (wc < 1500) add("content-length", "Content", "Content Length", "pass", `เนื้อหาดี (${wc} คำ)`, 7);
  else add("content-length", "Content", "Content Length", "pass", `เนื้อหาละเอียดมาก (${wc} คำ) — เหมาะสำหรับ long-form content`, 7);

  add("content-readability", "Content", "Readability", analysis.content.avgWordsPerSentence <= 25 ? "pass" : "warning",
    `เฉลี่ย ${analysis.content.avgWordsPerSentence} คำ/ประโยค | ${analysis.content.sentenceCount} ประโยค | ${analysis.content.paragraphCount} ย่อหน้า | อ่าน ~${analysis.content.readingTimeMinutes} นาที`, 3);

  add("content-ratio", "Content", "Text-to-HTML Ratio", analysis.content.textToHtmlRatio > 10 ? "pass" : analysis.content.textToHtmlRatio > 5 ? "warning" : "fail",
    `Text-to-HTML ratio: ${analysis.content.textToHtmlRatio}% ${analysis.content.textToHtmlRatio < 10 ? "(แนะนำ >10% — มี code มากกว่าเนื้อหา)" : "(ดี)"}`, 4);

  add("content-media", "Content", "Rich Media", analysis.content.hasVideo || analysis.images.total > 3 ? "pass" : "warning",
    `${analysis.content.hasVideo ? "มีวิดีโอ" : "ไม่มีวิดีโอ"} | ${analysis.images.total} รูปภาพ ${analysis.content.hasIframe ? "| มี iframe" : ""} — Rich media ช่วยเพิ่ม engagement`, 2);

  const topKw = analysis.content.keywords[0];
  add("content-keyword-density", "Content", "Keyword Density", topKw && topKw.density < 5 ? "pass" : topKw && topKw.density < 8 ? "warning" : "pass",
    topKw ? `คำที่ใช้บ่อยสุด: "${topKw.word}" (${topKw.count} ครั้ง, ${topKw.density}%)${topKw.density > 5 ? " — อาจเป็น keyword stuffing" : ""}` : "ไม่พบ keyword หลัก", 3);

  // =============================================
  // === Technical SEO (10 checks) ===
  // =============================================
  add("tech-https", "Technical", "HTTPS", analysis.technical.https ? "pass" : "fail",
    analysis.technical.https ? "ใช้ HTTPS — ปลอดภัย" : "ไม่ได้ใช้ HTTPS — Google ลดอันดับเว็บที่ไม่ปลอดภัย", 8);

  add("tech-viewport", "Technical", "Mobile Viewport", analysis.meta.viewport ? "pass" : "fail",
    analysis.meta.viewport ? "มี viewport meta tag — รองรับ mobile" : "ไม่มี viewport — ไม่ responsive บนมือถือ", 6);

  add("tech-lang", "Technical", "Language Attribute", analysis.meta.lang ? "pass" : "warning",
    analysis.meta.lang ? `lang="${analysis.meta.lang}"` : "ไม่มี lang attribute — ช่วย Google เข้าใจภาษาของเนื้อหา", 3);

  add("tech-charset", "Technical", "Character Encoding", analysis.meta.charset ? "pass" : "warning",
    analysis.meta.charset ? `charset: ${analysis.meta.charset}` : "ไม่มี charset — อาจแสดงผลตัวอักษรผิด", 3);

  add("tech-favicon", "Technical", "Favicon", analysis.technical.hasFavicon ? "pass" : "warning",
    analysis.technical.hasFavicon ? "มี favicon" : "ไม่มี favicon — ทำให้เว็บดูไม่เป็นมืออาชีพ", 2);

  add("tech-sitemap", "Technical", "Sitemap.xml", analysis.technical.hasSitemap ? "pass" : "warning",
    analysis.technical.hasSitemap ? "พบ sitemap.xml" : "ไม่พบ sitemap.xml — ช่วยให้ Google crawl เว็บได้ครบ", 5);

  add("tech-robots", "Technical", "Robots.txt", analysis.technical.hasRobotsTxt ? "pass" : "warning",
    analysis.technical.hasRobotsTxt ? "พบ robots.txt" : "ไม่พบ robots.txt — ควรมีเพื่อควบคุมการ crawl", 4);

  add("tech-schema", "Technical", "Schema Markup (JSON-LD)", analysis.technical.hasSchemaMarkup ? "pass" : "warning",
    analysis.technical.hasSchemaMarkup ? `พบ Schema: ${analysis.technical.schemaTypes.join(", ")}` : "ไม่มี JSON-LD structured data — ช่วยให้ Google แสดง Rich Snippets", 5);

  add("tech-manifest", "Technical", "Web App Manifest", analysis.technical.hasManifest ? "pass" : "warning",
    analysis.technical.hasManifest ? "มี web app manifest (PWA ready)" : "ไม่มี manifest.json", 1);

  const respTime = analysis.technical.responseTimeMs;
  add("tech-speed", "Technical", "Response Time", respTime < 1000 ? "pass" : respTime < 3000 ? "warning" : "fail",
    `Response time: ${respTime}ms ${respTime < 1000 ? "(เร็ว)" : respTime < 3000 ? "(ปานกลาง — แนะนำ <1 วินาที)" : "(ช้ามาก — ส่งผลต่อ ranking)"}`, 5);

  // =============================================
  // === Performance (4 checks) ===
  // =============================================
  const htmlKb = Math.round(analysis.technical.htmlSize / 1024);
  add("perf-html-size", "Performance", "HTML Size", htmlKb < 100 ? "pass" : htmlKb < 300 ? "warning" : "fail",
    `HTML size: ${htmlKb} KB ${htmlKb > 300 ? "(ใหญ่เกินไป — ควร optimize)" : htmlKb > 100 ? "(ค่อนข้างใหญ่)" : "(ดี)"}`, 3);

  add("perf-css", "Performance", "CSS Files", analysis.technical.cssFiles <= 5 ? "pass" : "warning",
    `CSS files: ${analysis.technical.cssFiles} | Inline styles: ${analysis.technical.inlineStyles} ${analysis.technical.cssFiles > 5 ? "— ควรรวมไฟล์ CSS" : ""}`, 2);

  add("perf-js", "Performance", "JavaScript Files", analysis.technical.jsFiles <= 10 ? "pass" : "warning",
    `JS files: ${analysis.technical.jsFiles} | Inline scripts: ${analysis.technical.inlineScripts} ${analysis.technical.jsFiles > 10 ? "— ควรรวมและ minify JS" : ""}`, 2);

  add("perf-preconnect", "Performance", "Resource Hints", analysis.technical.hasPrefetch || analysis.technical.hasPreconnect ? "pass" : "warning",
    `${analysis.technical.hasPreconnect ? "มี preconnect" : "ไม่มี preconnect"} | ${analysis.technical.hasPrefetch ? "มี dns-prefetch" : "ไม่มี dns-prefetch"} — ช่วยโหลดเร็วขึ้น`, 2);

  // =============================================
  // === Security (4 checks) ===
  // =============================================
  add("sec-mixed", "Security", "Mixed Content", !analysis.security.hasMixedContent ? "pass" : "warning",
    !analysis.security.hasMixedContent ? "ไม่มี mixed content" : "พบ mixed content (HTTP resources ใน HTTPS page) — เบราว์เซอร์อาจ block", 4);

  add("sec-hsts", "Security", "HSTS Header", analysis.security.hasStrictTransportSecurity ? "pass" : "warning",
    analysis.security.hasStrictTransportSecurity ? "มี Strict-Transport-Security header" : "ไม่มี HSTS header — ควรบังคับ HTTPS", 3);

  add("sec-xframe", "Security", "X-Frame-Options", analysis.security.hasXFrameOptions ? "pass" : "warning",
    analysis.security.hasXFrameOptions ? "มี X-Frame-Options — ป้องกัน clickjacking" : "ไม่มี X-Frame-Options header", 2);

  add("sec-csp", "Security", "Content Security Policy", analysis.security.hasContentSecurityPolicy ? "pass" : "warning",
    analysis.security.hasContentSecurityPolicy ? "มี Content-Security-Policy header" : "ไม่มี CSP header — ควรมีเพื่อป้องกัน XSS", 2);

  // =============================================
  // === Social & Tracking (3 checks) ===
  // =============================================
  add("social-ga", "Social & Tracking", "Google Analytics", analysis.social.hasGoogleAnalytics || analysis.social.hasGoogleTagManager ? "pass" : "warning",
    `${analysis.social.hasGoogleAnalytics ? "มี Google Analytics" : "ไม่มี GA"} | ${analysis.social.hasGoogleTagManager ? "มี GTM" : "ไม่มี GTM"} — จำเป็นสำหรับวัดผล`, 3);

  const pixels = [
    analysis.social.hasFacebookPixel && "Facebook Pixel",
    analysis.social.hasTwitterPixel && "Twitter Pixel",
    analysis.social.hasTikTokPixel && "TikTok Pixel",
    analysis.social.hasLinkedInPixel && "LinkedIn Pixel",
  ].filter(Boolean);
  add("social-pixels", "Social & Tracking", "Ad Pixels", pixels.length > 0 ? "pass" : "warning",
    pixels.length > 0 ? `พบ: ${pixels.join(", ")}` : "ไม่พบ Ad Pixel — จำเป็นสำหรับ Retargeting และวัดผลโฆษณา", 2);

  // Hreflang for international
  if (analysis.technical.hasHreflang) {
    add("intl-hreflang", "International", "Hreflang Tags", "pass",
      `พบ ${analysis.technical.hreflangTags.length} hreflang tags: ${analysis.technical.hreflangTags.map(t => t.lang).join(", ")}`, 2);
  }

  // =============================================
  // Calculate score
  // =============================================
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
