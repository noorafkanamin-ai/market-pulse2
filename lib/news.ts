import { XMLParser } from 'fast-xml-parser'
import feedsRaw from '@/data/news-feeds.json'

export type NewsFeed = { id: string; name: string; url: string; category?: string }

export type NewsItem = {
  id: string
  title: string
  summary: string
  url: string
  source: string
  category: string
  publishedAt: number | null
}

export const NEWS_FEEDS: NewsFeed[] = (Array.isArray(feedsRaw) ? (feedsRaw as NewsFeed[]) : []).filter(
  (f) => f && typeof f.url === 'string' && /^https?:\/\//i.test(f.url) && f.name
)

const REVALIDATE_SECONDS = 15 * 60 // هر ۱۵ دقیقه
const MAX_SUMMARY = 180 // خلاصه‌ی کوتاه؛ متن کامل خبر کپی نمی‌شود

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true })

const asArray = <T>(v: T | T[] | undefined | null): T[] =>
  v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]

function text(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    return text(o['#text'] ?? '')
  }
  return ''
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

const plain = (s: string) => decode(decode(s)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

function linkOf(entry: Record<string, unknown>): string {
  const l = entry.link
  if (typeof l === 'string') return l.trim()
  // Atom: <link href="..."/>
  for (const x of asArray(l as unknown)) {
    if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>
      const href = o['@_href']
      if (typeof href === 'string' && (!o['@_rel'] || o['@_rel'] === 'alternate')) return href.trim()
      if (typeof o['#text'] === 'string') return (o['#text'] as string).trim()
    }
  }
  return text(entry.guid).trim()
}

function parseFeed(xml: string, feed: NewsFeed): NewsItem[] {
  const doc = parser.parse(xml) as Record<string, any>
  const rawItems: Record<string, unknown>[] = [
    ...asArray(doc?.rss?.channel?.item),
    ...asArray(doc?.feed?.entry), // Atom
    ...asArray(doc?.['rdf:RDF']?.item), // RSS 1.0
  ]

  const items: NewsItem[] = []
  for (const it of rawItems) {
    const title = plain(text(it.title))
    const url = linkOf(it)
    if (!title || !/^https?:\/\//i.test(url)) continue

    const dateStr = text(it.pubDate ?? it['dc:date'] ?? it.published ?? it.updated)
    const ts = dateStr ? Date.parse(dateStr) : NaN

    const summaryRaw = text(it.description ?? it.summary ?? it['content:encoded'] ?? '')
    items.push({
      id: `${feed.id}:${url}`,
      title,
      summary: truncate(plain(summaryRaw), MAX_SUMMARY),
      url,
      source: feed.name,
      category: feed.category ?? feed.name,
      publishedAt: Number.isFinite(ts) ? ts : null,
    })
  }
  return items
}

async function fetchFeed(feed: NewsFeed): Promise<NewsItem[]> {
  const res = await fetch(feed.url, {
    headers: {
      'User-Agent': 'MarketPulse/1.0 RSS reader',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseFeed(await res.text(), feed)
}

/** آخرین خبرهای همه‌ی فیدها؛ فیدی که خراب باشد نادیده گرفته می‌شود و بقیه نمایش داده می‌شوند. */
export async function fetchNews(limit: number = 30): Promise<NewsItem[]> {
  const results = await Promise.allSettled(NEWS_FEEDS.map(fetchFeed))

  const all: NewsItem[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') all.push(...r.value)
    else console.error(`News feed failed (${NEWS_FEEDS[i].id}):`, r.reason)
  })

  const seen = new Set<string>()
  return all
    .filter((n) => (seen.has(n.url) ? false : (seen.add(n.url), true)))
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .slice(0, limit)
}
