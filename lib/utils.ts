import type { MarketData, Quote } from './api'

export type Trend = 'up' | 'down'

export function formatNumber(value: number | string): string {
  const num = Number(value || 0)
  return new Intl.NumberFormat('fa-IR').format(num)
}

export function formatCurrency(value: number | string, symbol: string = ''): string {
  return `${formatNumber(value)}${symbol}`
}

/** مثلاً 2.43 → "+2.4%" و -1.2 → "-1.2%" */
export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

export function trendOf(value: number): Trend {
  return value >= 0 ? 'up' : 'down'
}

/** زمان و تاریخ به وقت تهران (سرور Vercel به‌صورت پیش‌فرض UTC است) */
export function tehranTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran' })
}

export function tehranDate(date: Date = new Date()): string {
  return date.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' })
}

export type Asset = {
  id: string
  name: string
  unit: string
  type: string
  price: number
  change: string
  trend: Trend
  low: number
  high: number
  category: string
  /** true یعنی عدد زنده نیست و نمونه است */
  demo: boolean
}

export const getAssets = (market: MarketData): Asset[] => [
  {
    id: 'gold',
    name: 'طلا ۱۸ عیار',
    unit: ' تومان ',
    type: 'فلز گرانبها',
    price: market.gold,
    change: market.live.gold
      ? market.goldChange !== null
        ? formatChange(market.goldChange)
        : '—'
      : '+0.8%',
    trend: market.live.gold && market.goldChange !== null ? trendOf(market.goldChange) : 'up',
    low: Math.round(market.gold * 0.99),
    high: Math.round(market.gold * 1.006),
    category: 'طلا',
    demo: !market.live.gold,
  },
  {
    id: 'dollar',
    name: 'دلار آمریکا',
    unit: ' تومان ',
    type: 'ارز',
    price: market.usdIrr,
    change: market.live.fx
      ? market.usdChange !== null
        ? formatChange(market.usdChange)
        : '—'
      : '-0.2%',
    trend: market.live.fx && market.usdChange !== null ? trendOf(market.usdChange) : 'down',
    low: Math.round(market.usdIrr * 0.995),
    high: Math.round(market.usdIrr * 1.008),
    category: 'ارز',
    demo: !market.live.fx,
  },
  {
    id: 'bitcoin',
    name: 'بیت‌کوین',
    unit: ' دلار ',
    type: 'کریپتو',
    price: market.bitcoin,
    change: formatChange(market.btcChange),
    trend: trendOf(market.btcChange),
    low: Math.round(market.bitcoin * 0.97),
    high: Math.round(market.bitcoin * 1.01),
    category: 'کریپتو',
    demo: !market.live.crypto,
  },
  {
    id: 'ethereum',
    name: 'اتریوم',
    unit: ' دلار ',
    type: 'کریپتو',
    price: market.ethereum,
    change: formatChange(market.ethChange),
    trend: trendOf(market.ethChange),
    low: Math.round(market.ethereum * 0.96),
    high: Math.round(market.ethereum * 1.02),
    category: 'کریپتو',
    demo: !market.live.crypto,
  },
]


// ---------- فرمت قیمت (برای مقادیر خیلی کوچک تا خیلی بزرگ) ----------

export function formatPrice(n: number): string {
  if (n >= 1000) return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(n)
  if (n >= 1) return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(n)
  return new Intl.NumberFormat('fa-IR', { maximumSignificantDigits: 4 }).format(n)
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

// ---------- بخش «ارز، طلا و انرژی» ----------

export type BoardRow = {
  id: string
  name: string
  code: string // نماد/کد برای نمایش و جست‌وجو
  unit: string
  quote: Quote | null // null یعنی داده در دسترس نیست
}

export type BoardGroup = { id: string; title: string; rows: BoardRow[] }

const BOARD_DEFS: Array<{
  id: string
  title: string
  items: Array<{ id: string; name: string; code: string; unit: string }>
}> = [
  {
    id: 'fx',
    title: 'ارزهای اصلی',
    items: [
      { id: 'usd', name: 'دلار آمریکا', code: 'USD', unit: 'تومان' },
      { id: 'eur', name: 'یورو', code: 'EUR', unit: 'تومان' },
      { id: 'gbp', name: 'پوند انگلیس', code: 'GBP', unit: 'تومان' },
      { id: 'try', name: 'لیر ترکیه', code: 'TRY', unit: 'تومان' },
      { id: 'cny', name: 'یوآن چین', code: 'CNY', unit: 'تومان' },
    ],
  },
  {
    id: 'gulf',
    title: 'ارزهای حاشیه خلیج فارس',
    items: [
      { id: 'aed', name: 'درهم امارات', code: 'AED', unit: 'تومان' },
      { id: 'sar', name: 'ریال عربستان', code: 'SAR', unit: 'تومان' },
      { id: 'kwd', name: 'دینار کویت', code: 'KWD', unit: 'تومان' },
      { id: 'qar', name: 'ریال قطر', code: 'QAR', unit: 'تومان' },
      { id: 'bhd', name: 'دینار بحرین', code: 'BHD', unit: 'تومان' },
      { id: 'omr', name: 'ریال عمان', code: 'OMR', unit: 'تومان' },
    ],
  },
  {
    id: 'gold',
    title: 'طلا و سکه',
    items: [
      { id: '18ayar', name: 'طلای ۱۸ عیار (هر گرم)', code: 'GOLD 18K', unit: 'تومان' },
      { id: 'mesghal', name: 'مثقال طلا', code: 'MESGHAL', unit: 'تومان' },
      { id: 'sekkeh', name: 'سکه امامی', code: 'COIN', unit: 'تومان' },
      { id: 'ounce', name: 'انس جهانی طلا', code: 'XAU', unit: 'دلار' },
    ],
  },
  {
    id: 'energy',
    title: 'انرژی',
    items: [{ id: 'brent', name: 'نفت برنت (هر بشکه)', code: 'BRENT', unit: 'دلار' }],
  },
]

export function getBoard(market: MarketData): BoardGroup[] {
  return BOARD_DEFS.map((g) => ({
    id: g.id,
    title: g.title,
    rows: g.items.map((i) => ({ ...i, quote: market.quotes[i.id] ?? null })),
  }))
}

/** «۱۲ دقیقه پیش»، «۳ ساعت پیش» و ... */
export function timeAgoFa(ts: number | null): string {
  if (!ts) return ''
  const minutes = Math.floor(Math.max(0, Date.now() - ts) / 60000)
  if (minutes < 1) return 'لحظاتی پیش'
  if (minutes < 60) return `${formatNumber(minutes)} دقیقه پیش`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${formatNumber(hours)} ساعت پیش`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${formatNumber(days)} روز پیش`
  return new Date(ts).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' })
}
