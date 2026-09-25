const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { XMLParser, XMLValidator } = require("fast-xml-parser");
const { atomicWrite } = require("./storage.cjs");
const sources = [
  {
    id: "qbitai",
    name: "量子位",
    category: "AI",
    url: "https://www.qbitai.com/feed",
  },
  {
    id: "openai",
    name: "OpenAI 官方",
    category: "AI",
    url: "https://openai.com/news/rss.xml",
  },
  {
    id: "quanta-math",
    name: "Quanta 数学",
    category: "数学",
    url: "https://www.quantamagazine.org/tag/mathematics/feed/",
  },
  {
    id: "tao",
    name: "陶哲轩博客",
    category: "数学",
    url: "https://terrytao.wordpress.com/feed/",
  },
  {
    id: "fed",
    name: "美联储公告",
    category: "金融",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
  },
];
const decode = (text) =>
  String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
function safeArticleURL(value) {
  try {
    const u = new URL(value);
    if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
      return null;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.includes(":") ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      !host.includes(".")
    )
      return null;
    return u.href;
  } catch {
    return null;
  }
}
function parseFeed(xml, source) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("订阅格式不受支持");
  if (XMLValidator.validate(xml) !== true)
    throw new Error("订阅内容不是有效 XML");
  const doc = new XMLParser({
    ignoreAttributes: false,
    processEntities: true,
  }).parse(xml);
  const raw = doc.rss?.channel?.item || doc.feed?.entry || [];
  const entries = Array.isArray(raw) ? raw : [raw];
  const result = [];
  for (const item of entries.slice(0, 100)) {
    const title = decode(
      typeof item.title === "object" ? item.title["#text"] : item.title,
    ).slice(0, 300);
    const link =
      typeof item.link === "string"
        ? item.link
        : Array.isArray(item.link)
          ? item.link.find((x) => x["@_rel"] === "alternate")?.["@_href"]
          : item.link?.["@_href"];
    const url = safeArticleURL(link);
    if (!title || !url) continue;
    const published = Date.parse(
      item.pubDate || item.published || item.updated || item["dc:date"] || "",
    );
    result.push({
      id: crypto.createHash("sha256").update(url).digest("hex").slice(0, 24),
      title,
      url,
      source: source.id,
      sourceName: source.name,
      category: source.category,
      published: Number.isFinite(published)
        ? new Date(published).toISOString()
        : null,
      summary: decode(item.description || item.summary || "").slice(0, 180),
    });
  }
  if (!result.length) throw new Error("此来源暂时没有可读条目");
  return result;
}
class News {
  constructor(root, fetchImpl = fetch) {
    this.file = path.join(root, "news-cache.json");
    this.fetch = fetchImpl;
    this.cache = { items: [], statuses: [], updated: null };
    this.inflight = null;
  }
  async init() {
    try {
      const value = JSON.parse(await fs.readFile(this.file, "utf8"));
      if (Array.isArray(value.items)) {
        const valid = new Set(sources.map((s) => s.id));
        this.cache = {
          items: value.items.filter((i) => valid.has(i.source)),
          statuses: (value.statuses || []).filter((i) => valid.has(i.id)),
          updated: value.items.some((i) => !valid.has(i.source))
            ? null
            : value.updated,
        };
      }
    } catch {}
    return this;
  }
  get() {
    return { ...this.cache, sources };
  }
  refresh() {
    if (this.inflight) return this.inflight;
    this.inflight = this.run().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }
  async run() {
    const statuses = [];
    const results = await Promise.all(
      sources.map(async (source) => {
        try {
          const response = await this.fetch(source.url, {
            signal: AbortSignal.timeout(18000),
            headers: {
              Accept: "application/rss+xml, application/xml, text/xml",
              "User-Agent": "yeN/0.4 RSS reader",
            },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          let text = "";
          const reader = response.body.getReader(),
            decoder = new TextDecoder();
          let total = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.length;
            if (total > 4 * 1024 * 1024) {
              await reader.cancel();
              throw new Error("订阅内容过大");
            }
            text += decoder.decode(value, { stream: true });
          }
          text += decoder.decode();
          const items = parseFeed(text, source);
          statuses.push({
            id: source.id,
            ok: true,
            checked: new Date().toISOString(),
            count: items.length,
          });
          return items;
        } catch (e) {
          statuses.push({
            id: source.id,
            ok: false,
            checked: new Date().toISOString(),
            message: e.name === "TimeoutError" ? "连接超时" : e.message,
          });
          return this.cache.items.filter((x) => x.source === source.id);
        }
      }),
    );
    const items = [...new Map(results.flat().map((x) => [x.url, x])).values()]
      .sort(
        (a, b) =>
          (Date.parse(b.published) || 0) - (Date.parse(a.published) || 0),
      )
      .slice(0, 300);
    this.cache = { items, statuses, updated: new Date().toISOString() };
    await atomicWrite(this.file, JSON.stringify(this.cache));
    return this.get();
  }
  hasURL(url) {
    return this.cache.items.some((x) => x.url === url) && safeArticleURL(url);
  }
}
module.exports = { News, parseFeed, safeArticleURL, sources };
