import { fetchMarketData, fetchTopCrypto } from '@/lib/api'
import { getBoard, tehranDate, tehranTime } from '@/lib/utils'
import AppShell from '@/components/AppShell'
import MarketExplorer from '@/components/MarketExplorer'
import Link from 'next/link'

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const [market, coins] = await Promise.all([fetchMarketData(), fetchTopCrypto(200)])
  const board = getBoard(market)

  const initialTab =
    resolvedSearchParams.tab === 'crypto'
      ? 'crypto'
      : resolvedSearchParams.tab === 'fiat'
      ? 'fiat'
      : null

  return (
    <AppShell>
      <div className="compare-page">
        <div className="container">
          <header className="compare-header">
            <div>
              <h1>ارز، طلا و رمزارزها</h1>
              <p>نرخ ارزهای ریالی، ارزهای حاشیه خلیج فارس، طلا، نفت و صدها رمزارز در یک جا</p>
            </div>
            <Link href="/" className="back-btn">
              بازگشت
            </Link>
          </header>

          <MarketExplorer
            groups={board}
            coins={coins}
            tomanRate={market.live.fx ? market.usdIrr : null}
            initialTab={initialTab}
            initialQuery={(resolvedSearchParams.q ?? '').slice(0, 60)}
          />

          <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--muted)' }}>
            {market.navasanAt
              ? `آخرین دریافت نرخ ارز و طلا: ${tehranDate(new Date(market.navasanAt))} ساعت ${tehranTime(new Date(market.navasanAt))}`
              : 'نرخ ارز و طلا هنوز از navasan دریافت نشده است. پیام خطا در ترمینال (npm run dev) چاپ شده.'}
          </p>

          <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.9 }}>
            نرخ ارز، طلای ۱۸ عیار و سکه از navasan.tech گرفته می‌شود و حدود ۱۲ ساعت یک‌بار
            به‌روز می‌شود. قیمت رمزارزها از CoinGecko است؛ قیمت تومانی آن‌ها حاصل‌ضرب قیمت
            دلاری در نرخ دلار بالاست و قیمت واقعی صرافی‌های داخلی ممکن است کمی فرق کند. انس
            جهانی طلا بر پایه‌ی PAX Gold و تقریبی است. نفت برنت از منبعی غیررسمی می‌آید و
            ممکن است گاهی در دسترس نباشد.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
