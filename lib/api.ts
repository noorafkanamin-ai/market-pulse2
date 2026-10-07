import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type Quote = {
  id: string
  value: number
  changePct: number | null // درصد؛ null یعنی از منبع قابل محاسبه نبود
}

export type MarketData = {
  usdIrr: number // تومان
  eurIrr: number // تومان
  gold: number // طلای ۱۸ عیار، هر گرم، تومان
  silver: number
  coin18k: number
  coin24k: number
  bitcoin: number // دلار
  ethereum: number // دلار
  usdt: number
  btcChange: number
  ethChange: number
  usdChange: number | null // درصد، اگر از منبع قابل محاسبه باشد
  goldChange: number | null
  live: { fx: boolean; gold: boolean; crypto: boolean }
  /** قیمت‌های زنده‌ی بخش «ارز، طلا و انرژی». هر آیتمی که پیدا نشود در این map نیست. */
  quotes: Record<string, Quote>
  /** زمان آخرین دریافت موفق از navasan (میلی‌ثانیه)؛ null یعنی هرگز */
  navasanAt: number | null
}

const FALLBACK_DATA: MarketData = {
  usdIrr: 46500,
  eurIrr: 50600,
  gold: 7890000,
  silver: 875000,
  coin18k: 7450000,
  coin24k: 8920000,
  bitcoin: 92440,
  ethereum: 3450,
  usdt: 1,
  btcChange: 2.4,
  ethChange: 1.3,
  usdChange: null,
  goldChange: null,
  live: { fx: false, gold: false, crypto: false },
  quotes: {},
  navasanAt: null,
}

const CRYPTO_API = process.env.NEXT_PUBLIC_API_URL || 'https://api.coingecko.com/api/v3'
const NAVASAN_API = 'https://api.navasan.tech'

const REVALIDATE = 30

// پلن رایگان navasan فقط ۱۲۰ درخواست در ماه دارد؛ پس پاسخ را ۱۲ ساعت نگه می‌داریم
// (حدود ۶۰ درخواست در ماه، با حاشیه‌ی اطمینان برای تست و دیپلوی).
const NAVASAN_TTL_MS = 12 * 60 * 60 * 1000

function num(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function signedNum(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

async function getJson(
  url: string,
  revalidate: number = REVALIDATE,
  headers?: Record<string, string>
) {
  const res = await fetch(url, {
    headers,
    ...(revalidate === 0 ? { cache: 'no-store' as const } : { next: { revalidate } }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    // عمداً فقط بخش قبل از ? در خطا می‌آید تا کلید API در لاگ‌ها ظاهر نشود
    throw new Error(`HTTP ${res.status} for ${url.split('?')[0]} ${body.slice(0, 200)}`)
  }
  return res.json()
}

// ---------- navasan (دلار، یورو، طلای ۱۸ عیار) ----------

type NavasanItem = { value: number; change: number | null }

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(/[,٬\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

function readItem(raw: any, key: string): NavasanItem | null {
  const item = raw?.[key]
  if (item === null || item === undefined) return null
  const isObj = typeof item === 'object'
  const value = toNum(isObj ? item.value : item)
  if (value === null || value <= 0) return null
  return { value, change: isObj ? toNum(item.change) : null }
}

/** فرض می‌کنیم change تغییر مطلق نسبت به قیمت قبلی است. اگر درصد غیرمنطقی شد، نمایش نمی‌دهیم. */
function changePercent(item: NavasanItem | null): number | null {
  if (!item || item.change === null) return null
  const prev = item.value - item.change
  if (prev <= 0) return null
  const p = (item.change / prev) * 100
  return Math.abs(p) < 30 ? p : null
}

type NavCache = { at: number; data: unknown }

const g = globalThis as unknown as {
  __navasan?: NavCache
  __navasanFailAt?: number
  __navasanInflight?: Promise<NavCache | null>
}

const NAVASAN_FAIL_COOLDOWN_MS = 10 * 60 * 1000
const NAVASAN_CACHE_FILE = join(tmpdir(), 'market-pulse-navasan.json')

function loadNavasanDisk(): NavCache | null {
  try {
    const j = JSON.parse(readFileSync(NAVASAN_CACHE_FILE, 'utf8'))
    if (j && typeof j.at === 'number' && j.data) return j as NavCache
  } catch {
    // فایل وجود ندارد یا خراب است
  }
  return null
}

function saveNavasanDisk(c: NavCache) {
  try {
    writeFileSync(NAVASAN_CACHE_FILE, JSON.stringify(c))
  } catch {
    // محیط فقط‌خواندنی؛ مهم نیست
  }
}

/**
 * سهمیه‌ی رایگان فقط ۱۲۰ درخواست در ماه است، پس:
 *  - پاسخ ۱۲ ساعت در حافظه و روی دیسک نگه داشته می‌شود (ریستارت سرور سهمیه مصرف نمی‌کند)؛
 *  - از کش fetch در Next استفاده نمی‌شود (تا یک پاسخ خراب ۱۲ ساعت نماند)؛
 *  - بعد از شکست ۱۰ دقیقه دوباره تلاش نمی‌کند؛
 *  - اگر درخواست شکست بخورد، آخرین داده‌ی سالم (هرچقدر قدیمی) نمایش داده می‌شود.
 */
async function fetchNavasan(): Promise<NavCache | null> {
  const key = process.env.NAVASAN_API_KEY?.trim()
  if (!key) {
    if (!warnedNoKey) {
      warnedNoKey = true
      console.warn(
        'NAVASAN_API_KEY پیدا نشد. فایل .env.local را در پوشه‌ی اصلی پروژه بساز و سرور را دوباره اجرا کن (راهنما: npm run setup:env).'
      )
    }
    return null
  }

  if (!g.__navasan) g.__navasan = loadNavasanDisk() ?? undefined
  const cached = g.__navasan

  if (cached && Date.now() - cached.at < NAVASAN_TTL_MS) return cached
  if (g.__navasanFailAt && Date.now() - g.__navasanFailAt < NAVASAN_FAIL_COOLDOWN_MS) {
    return cached ?? null
  }

  if (!g.__navasanInflight) {
    g.__navasanInflight = (async () => {
      try {
        const data = await getJson(
          `${NAVASAN_API}/latest/?api_key=${encodeURIComponent(key)}`,
          0 // بدون کش fetch
        )
        if (readItem(data, 'usd_sell')) {
          const fresh: NavCache = { at: Date.now(), data }
          g.__navasan = fresh
          g.__navasanFailAt = undefined
          saveNavasanDisk(fresh)
          return fresh
        }
        console.error('Navasan: پاسخ نامعتبر یا بدون usd_sell:', JSON.stringify(data).slice(0, 300))
      } catch (error) {
        console.error('Navasan fetch failed:', error)
      }
      g.__navasanFailAt = Date.now()
      return g.__navasan ?? null
    })().finally(() => {
      g.__navasanInflight = undefined
    })
  }
  return g.__navasanInflight
}

/** آخرین پاسخ ذخیره‌شده‌ی navasan بدون هیچ درخواست جدیدی (برای صفحه‌ی /debug) */
export function peekNavasanCache(): { at: number; data: unknown } | null {
  return g.__navasan ?? loadNavasanDisk()
}

// آیتم‌های بخش ارز/طلا از navasan. برای هر آیتم چند نام ممکن امتحان می‌شود،
// چون نام دقیق همه‌ی کلیدها در مستندات تأیید نشده بود.
const NAVASAN_QUOTES: Array<{ id: string; keys: string[] }> = [
  { id: 'usd', keys: ['usd_sell'] },
  { id: 'eur', keys: ['eur'] },
  { id: 'gbp', keys: ['gbp'] },
  { id: 'try', keys: ['try', 'try_hav'] },
  { id: 'cny', keys: ['cny'] },
  { id: 'aed', keys: ['aed', 'aed_note'] },
  { id: 'sar', keys: ['sar'] },
  { id: 'kwd', keys: ['kwd'] },
  { id: 'qar', keys: ['qar'] },
  { id: 'bhd', keys: ['bhd'] },
  { id: 'omr', keys: ['omr'] },
  { id: '18ayar', keys: ['18ayar'] },
  { id: 'sekkeh', keys: ['sekkeh'] },
]

let loggedMissing = false

// یک مثقال طلا ۴٫۶۰۸ گرم است
const MESGHAL_GRAMS = 4.608
let warnedNoKey = false

/** نفت برنت از endpoint غیررسمی Yahoo Finance؛ ممکن است گاهی بلاک یا قطع شود. */
async function fetchBrent(): Promise<Quote | null> {
  try {
    const res = await getJson(
      'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d',
      900,
      { 'User-Agent': 'Mozilla/5.0 (compatible; MarketPulse/1.0)' }
    )
    const meta = res?.chart?.result?.[0]?.meta
    const price = toNum(meta?.regularMarketPrice)
    if (price === null || price <= 0) return null
    const prev = toNum(meta?.chartPreviousClose ?? meta?.previousClose)
    let pct: number | null = null
    if (prev !== null && prev > 0) {
      const p = ((price - prev) / prev) * 100
      pct = Math.abs(p) < 20 ? p : null
    }
    return { id: 'brent', value: price, changePct: pct }
  } catch (error) {
    console.error('Brent fetch failed:', error)
    return null
  }
}

export async function fetchMarketData(): Promise<MarketData> {
  const data: MarketData = {
    ...FALLBACK_DATA,
    live: { fx: false, gold: false, crypto: false },
    quotes: {},
    navasanAt: null,
  }

  const [cryptoRes, navRes, brent] = await Promise.all([
    Promise.allSettled([
      getJson(
        `${CRYPTO_API}/simple/price?ids=bitcoin,ethereum,tether,pax-gold&vs_currencies=usd&include_24hr_change=true`
      ),
    ]).then((r) => r[0]),
    fetchNavasan(),
    fetchBrent(),
  ])

  const nav = navRes?.data ?? null
  data.navasanAt = navRes?.at ?? null

  if (cryptoRes.status === 'fulfilled') {
    const res = cryptoRes.value
    data.bitcoin = num(res?.bitcoin?.usd, FALLBACK_DATA.bitcoin)
    data.ethereum = num(res?.ethereum?.usd, FALLBACK_DATA.ethereum)
    data.usdt = num(res?.tether?.usd, FALLBACK_DATA.usdt)
    data.btcChange = signedNum(res?.bitcoin?.usd_24h_change, FALLBACK_DATA.btcChange)
    data.ethChange = signedNum(res?.ethereum?.usd_24h_change, FALLBACK_DATA.ethChange)
    data.live.crypto = true

    // انس جهانی طلا: PAX Gold یک توکن با پشتوانه‌ی یک انس طلاست؛ تقریب خوبی از قیمت جهانی است
    const paxg = Number(res?.['pax-gold']?.usd)
    if (Number.isFinite(paxg) && paxg > 0) {
      const ch = Number(res?.['pax-gold']?.usd_24h_change)
      data.quotes.ounce = { id: 'ounce', value: paxg, changePct: Number.isFinite(ch) ? ch : null }
    }
  } else {
    console.error('Crypto fetch failed:', cryptoRes.reason)
  }

  const usd = readItem(nav, 'usd_sell')
  const eur = readItem(nav, 'eur')
  const gold = readItem(nav, '18ayar')

  if (usd) {
    data.usdIrr = Math.round(usd.value)
    data.usdChange = changePercent(usd)
    data.live.fx = true
  }
  if (eur) data.eurIrr = Math.round(eur.value)
  if (gold) {
    data.gold = Math.round(gold.value)
    data.goldChange = changePercent(gold)
    data.live.gold = true
  }

  const missing: string[] = []
  for (const def of NAVASAN_QUOTES) {
    let item: NavasanItem | null = null
    for (const key of def.keys) {
      item = readItem(nav, key)
      if (item) break
    }
    if (item) {
      data.quotes[def.id] = { id: def.id, value: item.value, changePct: changePercent(item) }
    } else if (nav) {
      missing.push(def.id)
    }
  }
  // مثقال طلا = ۴٫۶۰۸ × قیمت هر گرم طلای ۱۸ عیار (محاسبه‌شده، نه دریافتی)
  const g18 = data.quotes['18ayar']
  if (g18) {
    data.quotes.mesghal = {
      id: 'mesghal',
      value: Math.round(g18.value * MESGHAL_GRAMS),
      changePct: g18.changePct,
    }
  }

  if (missing.length > 0 && !loggedMissing) {
    loggedMissing = true
    console.warn(
      'Navasan: این آیتم‌ها در پاسخ پیدا نشدند:',
      missing.join(', '),
      '| کلیدهای موجود در پاسخ:',
      Object.keys((nav as Record<string, unknown>) ?? {}).join(', ')
    )
  }

  if (brent) data.quotes.brent = brent

  return data
}

// ---------- تاریخچهٔ واقعی کریپتو (CoinGecko) ----------

export type DailyCandle = {
  date: string // YYYY-MM-DD به وقت تهران
  label: string // برچسب کوتاه برای محور نمودار
  fullDate: string // تاریخ کامل شمسی
  open: number
  high: number
  low: number
  close: number
}

const TEHRAN = 'Asia/Tehran'

/**
 * کندل‌های ۴ساعته‌ی CoinGecko را به کندل روزانه (به وقت تهران) تبدیل می‌کند.
 * اگر درخواست شکست بخورد null برمی‌گرداند تا صفحه به داده‌ی نمونه برگردد.
 */
export async function fetchCryptoDaily(
  id: 'bitcoin' | 'ethereum',
  days: number = 7
): Promise<DailyCandle[] | null> {
  try {
    const raw = await getJson(
      `${CRYPTO_API}/coins/${id}/ohlc?vs_currency=usd&days=${days}`,
      600
    )
    if (!Array.isArray(raw) || raw.length === 0) return null

    const byDay = new Map<string, DailyCandle>()
    for (const row of raw as number[][]) {
      const [ts, o, h, l, c] = row
      if (![ts, o, h, l, c].every(Number.isFinite)) continue
      const d = new Date(ts)
      const key = d.toLocaleDateString('en-CA', { timeZone: TEHRAN })
      const existing = byDay.get(key)
      if (!existing) {
        byDay.set(key, {
          date: key,
          label: d.toLocaleDateString('fa-IR', { timeZone: TEHRAN, month: 'numeric', day: 'numeric' }),
          fullDate: d.toLocaleDateString('fa-IR', { timeZone: TEHRAN }),
          open: o,
          high: h,
          low: l,
          close: c,
        })
      } else {
        existing.high = Math.max(existing.high, h)
        existing.low = Math.min(existing.low, l)
        existing.close = c
      }
    }

    const candles = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date))
    return candles.length > 0 ? candles : null
  } catch (error) {
    console.error(`History fetch failed for ${id}:`, error)
    return null
  }
}

// ---------- لیست رمزارزها (CoinGecko) ----------

export type CryptoCoin = {
  id: string
  symbol: string
  name: string
  image: string | null
  price: number // دلار
  change24h: number | null // درصد
  marketCap: number | null
  rank: number | null
}

export async function fetchTopCrypto(limit: number = 200): Promise<CryptoCoin[] | null> {
  try {
    const raw = await getJson(
      `${CRYPTO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
      120
    )
    if (!Array.isArray(raw) || raw.length === 0) return null

    const coins: CryptoCoin[] = []
    for (const c of raw) {
      const price = Number(c?.current_price)
      if (!c?.id || !Number.isFinite(price) || price <= 0) continue
      const change = Number(c?.price_change_percentage_24h)
      const cap = Number(c?.market_cap)
      const rank = Number(c?.market_cap_rank)
      coins.push({
        id: String(c.id),
        symbol: String(c.symbol ?? '').toUpperCase(),
        name: String(c.name ?? c.id),
        image: typeof c.image === 'string' ? c.image : null,
        price,
        change24h: Number.isFinite(change) ? change : null,
        marketCap: Number.isFinite(cap) && cap > 0 ? cap : null,
        rank: Number.isFinite(rank) ? rank : null,
      })
    }
    return coins.length > 0 ? coins : null
  } catch (error) {
    console.error('Top crypto fetch failed:', error)
    return null
  }
}
