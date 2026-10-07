import { fetchMarketData, fetchCryptoDaily, fetchTopCrypto } from '@/lib/api'
import { fetchNews } from '@/lib/news'
import NewsCard from '@/components/NewsCard'
import { CRYPTO_FA } from '@/lib/cryptoNames'
import { marketIndex } from '@/lib/manual'
import { formatNumber, formatChange, formatPrice, getAssets, getBoard, tehranTime } from '@/lib/utils'
import AppShell from '@/components/AppShell'
import PriceChart from '@/components/PriceChart'
import DemoBadge from '@/components/DemoBadge'
import MarketBoard from '@/components/MarketBoard'
import Link from 'next/link'

export const revalidate = 30

export default async function HomePage() {
  const market = await fetchMarketData()
  const assets = getAssets(market)
  const board = getBoard(market)

  const [btcDaily, coins, latestNews] = await Promise.all([
    fetchCryptoDaily('bitcoin'),
    fetchTopCrypto(200),
    fetchNews(3),
  ])
  const realChart = btcDaily !== null && btcDaily.length > 1
  const chartChange = realChart
    ? ((btcDaily![btcDaily!.length - 1].close - btcDaily![0].open) / btcDaily![0].open) * 100
    : null

  const chartData = realChart
    ? btcDaily!.map((c) => ({ name: c.label, value: Math.round(c.close) }))
    : []

  // ---- نوار بالا ----
  // چهار مورد اصلی (دلار، یورو، طلا، بیت‌کوین) همیشه نمایش داده می‌شوند؛ اگر داده نباشد «—» می‌آید.
  // بقیه فقط وقتی نمایش داده می‌شوند که داده‌ی زنده داشته باشند.
  type TickerItem = { name: string; value: number | null; pct: number | null; always: boolean }
  const q = market.quotes

  const fromQuote = (id: string, name: string, always = false): TickerItem => ({
    name,
    value: q[id]?.value ?? null,
    pct: q[id]?.changePct ?? null,
    always,
  })

  const coinItem = (id: string, name: string, always = false): TickerItem => {
    const c = coins?.find((x) => x.id === id)
    if (c) return { name, value: c.price, pct: c.change24h, always }
    if (id === 'bitcoin' && market.live.crypto) {
      return { name, value: market.bitcoin, pct: market.btcChange, always }
    }
    if (id === 'ethereum' && market.live.crypto) {
      return { name, value: market.ethereum, pct: market.ethChange, always }
    }
    return { name, value: null, pct: null, always }
  }

  const tickerItems: TickerItem[] = [
    fromQuote('usd', 'دلار', true),
    fromQuote('eur', 'یورو', true),
    fromQuote('gbp', 'پوند'),
    fromQuote('try', 'لیر ترکیه'),
    fromQuote('cny', 'یوآن چین'),
    fromQuote('aed', 'درهم امارات'),
    fromQuote('sar', 'ریال عربستان'),
    fromQuote('kwd', 'دینار کویت'),
    fromQuote('qar', 'ریال قطر'),
    fromQuote('bhd', 'دینار بحرین'),
    fromQuote('omr', 'ریال عمان'),
    fromQuote('18ayar', 'طلا ۱۸ عیار', true),
    fromQuote('mesghal', 'مثقال طلا'),
    fromQuote('sekkeh', 'سکه امامی'),
    fromQuote('ounce', 'انس جهانی (دلار)'),
    fromQuote('brent', 'نفت برنت (دلار)'),
    coinItem('bitcoin', 'بیت‌کوین', true),
    ...['ethereum', 'tether', 'ripple', 'binancecoin', 'solana', 'dogecoin', 'tron', 'cardano', 'litecoin'].map(
      (id) => coinItem(id, CRYPTO_FA[id] ?? id)
    ),
  ].filter((i) => i.always || i.value !== null)

  return (
    <AppShell>
      <div className="page-content">
        <div className="top-bar">
          <div className="topbar-inner">
            <div className="ticker-wrap">
              <div
                className="ticker-track"
                style={{ animationDuration: `${Math.max(40, tickerItems.length * 5)}s` }}
              >
                {[0, 1].map((copy) => (
                  <div className="ticker-set" key={copy} aria-hidden={copy === 1}>
                    {tickerItems.map((item) => (
                      <div className="ticker" key={`${copy}-${item.name}`}>
                        <span>{item.name}</span>
                        {item.value !== null ? (
                          <strong>{formatPrice(item.value)}</strong>
                        ) : (
                          <strong className="na">—</strong>
                        )}
                        {item.pct !== null && (
                          <span className={item.pct >= 0 ? 'up' : 'down'}>
                            {item.pct >= 0 ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="hero">
          <div className="hero-inner">
            <div className="hero-grid">
              <div className="hero-copy">
                <h1>قیمت لحظه‌ای بازار، از یک نگاه</h1>
                <p>
                  تحلیل سریع، نرخ روز، جدول قیمت‌های بازار و اخبار اقتصادی در یک
                  صفحه برای تصمیم‌گیری بهتر.
                </p>

                <div className="hero-actions">
                  <a href="#markets" className="button primary">
                    مشاهده بازار
                  </a>
                  <Link href="/compare" className="button ghost">
                    نمودارهای تاریخی
                  </Link>
                </div>
              </div>

              <div className="mini-metric">
                <div className="mini-label">
                  <span>شاخص کل بورس تهران</span>
                  {marketIndex.changePercent !== null && (
                    <span className={marketIndex.changePercent >= 0 ? 'positive' : 'negative'}>
                      {formatChange(marketIndex.changePercent)}
                    </span>
                  )}
                </div>
                <div className="mini-value">
                  {marketIndex.value !== null ? formatNumber(marketIndex.value) : '—'}
                </div>
                <div className="mini-trend">
                  {marketIndex.value === null
                    ? 'هنوز ثبت نشده'
                    : marketIndex.updatedAt
                      ? `آخرین به‌روزرسانی: ${marketIndex.updatedAt}`
                      : ''}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section stats-section" aria-label="شاخص‌های اصلی بازار">
          {assets.map((item) => (
            <Link key={item.id} href={`/assets/${item.id}`} className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">{item.name}</div>
                <span className={item.demo ? 'market-badge sample' : 'market-badge live'}>{item.demo ? 'نمونه' : 'زنده'}</span>
              </div>
              <div className="stat-value">{formatNumber(item.price)}</div>
              <div className="stat-meta">
                <span className={item.trend === 'up' ? 'positive' : 'negative'}><span aria-hidden="true">{item.trend === 'up' ? '▲' : '▼'}</span> {item.change}</span>
                <span className="stat-status">{item.trend === 'up' ? 'روند صعودی' : 'روند نزولی'}</span>
              </div>
            </Link>
          ))}
        </section>

        <section className="main-grid" id="markets">
          <div className="panel market-table-panel">
            <div className="panel-header"><div className="panel-title">نرخ لحظه‌ای</div><div className="panel-filter">بروزرسانی: {tehranTime()}</div></div>
            <div className="markets-table-wrap"><table className="markets-table"><thead><tr><th>دارایی</th><th>قیمت</th><th>تغییر</th><th>وضعیت</th></tr></thead><tbody>
              {assets.map((item) => { const isUp = item.trend === 'up'; return (
                <tr key={item.id} className={isUp ? 'market-row-up' : 'market-row-down'}>
                  <td><Link href={`/assets/${item.id}`} className="asset-row-btn"><span className="asset-row-icon" aria-hidden="true">{isUp ? '↗' : '↘'}</span><span className="asset-row-name"><strong>{item.name}</strong>{item.demo && <DemoBadge />}</span></Link></td>
                  <td className="market-price">{formatNumber(item.price)}</td>
                  <td><span className={isUp ? 'change-pill positive' : 'change-pill negative'}>{isUp ? '▲' : '▼'} {item.change}</span></td>
                  <td><span className={isUp ? 'status-pill-table positive' : 'status-pill-table negative'}><span className="status-dot" aria-hidden="true" />{isUp ? 'افزایش' : 'کاهش'}</span></td>
                </tr>)})}
            </tbody></table></div>
          </div>
          <div className="side-stack">
            <div className="panel chart-panel">
              <div className="panel-header chart-panel-header"><div><div className="panel-title">نمودار بیت‌کوین</div><div className="chart-subtitle">روند قیمت در ۷ روز گذشته</div></div>{chartChange !== null && <div className={`chart-change ${chartChange >= 0 ? 'positive' : 'negative'}`}><span aria-hidden="true">{chartChange >= 0 ? '↗' : '↘'}</span>{formatChange(chartChange)}</div>}</div>
              <div className="chart-summary"><div><span>قیمت فعلی</span><strong>{market.bitcoin ? formatPrice(market.bitcoin) : '—'}</strong><small>دلار</small></div><div><span>بازه</span><strong>۷ روز</strong><small>روند کوتاه‌مدت</small></div><div><span>داده</span><strong>{realChart ? 'زنده' : '—'}</strong><small>{realChart ? 'آخرین داده موجود' : 'در دسترس نیست'}</small></div></div>
              <div className="chart-wrap">{realChart ? <PriceChart data={chartData} /> : <p className="chart-empty">نمودار در حال حاضر در دسترس نیست. کمی بعد دوباره امتحان کنید.</p>}</div>
            </div>
            <div className="mini-card market-insight-card"><div className="insight-heading"><div><span className="insight-kicker">MARKET PULSE</span><h3>چک‌لیست بازار</h3></div><span className="insight-icon" aria-hidden="true">◈</span></div><div className="insight-list"><div><span>روند کلی</span><strong>مثبت</strong></div><div><span>تمرکز بازار</span><strong>طلا و دارایی دیجیتال</strong></div><div><span>ریسک کوتاه‌مدت</span><strong>نوسانی</strong></div></div></div>
          </div>
        </section>
        <section className="dashboard-section market-board-section">
          <div className="section-heading">
            <div className="panel-title">ارز، طلا و انرژی</div>
            <Link href="/markets" className="panel-filter">
              صفحه‌ی کامل
            </Link>
          </div>
          <MarketBoard groups={board} />
        </section>

        <section className="panel dashboard-section news-section">
          <div className="panel-header"><div className="panel-title">اخبار و تحلیل‌ها</div><div className="panel-filter">آخرین اخبار</div></div>
          <div className="news-grid">
            {latestNews.length === 0 ? <p className="news-empty">در حال حاضر خبری دریافت نشد.</p> : latestNews.map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
