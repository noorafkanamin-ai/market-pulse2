import raw from '@/data/manual.json'

// داده‌هایی که منبع خودکار قابل‌اتکا ندارند و دستی در data/manual.json نوشته می‌شوند.

export type Bulletin = {
  date: string
  title: string
  summary?: string
  url?: string
}

type ManualData = {
  marketIndex?: {
    value?: number | null
    changePercent?: number | null
    updatedAt?: string | null
  }
  bulletins?: Bulletin[]
}

const data = raw as unknown as ManualData

const numOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

export const marketIndex = {
  value: numOrNull(data.marketIndex?.value),
  changePercent: numOrNull(data.marketIndex?.changePercent),
  updatedAt:
    typeof data.marketIndex?.updatedAt === 'string' && data.marketIndex.updatedAt.trim()
      ? data.marketIndex.updatedAt.trim()
      : null,
}

export const bulletins: Bulletin[] = (Array.isArray(data.bulletins) ? data.bulletins : [])
  .filter((b) => b && typeof b.title === 'string' && b.title.trim() !== '')
  .slice(0, 10)

/** فقط لینک‌های http/https مجاز است */
export const safeUrl = (u?: string): string | null => (u && /^https?:\/\//i.test(u) ? u : null)
