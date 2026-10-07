import { fetchMarketData } from '@/lib/api'
import { formatNumber, formatChange, getAssets, tehranDate } from '@/lib/utils'
import AppShell from '@/components/AppShell'
import DemoBadge from '@/components/DemoBadge'
import { marketIndex, bulletins, safeUrl } from '@/lib/manual'
import Link from 'next/link'

export const revalidate = 30

export default async function ReportsPage() {
  const market = await fetchMarketData()
  const byId = Object.fromEntries(getAssets(market).map((a) => [a.id, a]))

  return (
    <AppShell>
      <div className="reports-page">
        <div className="container">
          <header className="reports-header">
            <div>
              <h1>گزارش‌های روزانه</h1>
              <p>تحلیل روزانه بازار، طلا، ارز و کریپتو</p>
            </div>
            <Link href="/" className="back-btn">
              بازگشت
            </Link>
          </header>

          <div className="reports-grid">
            <div className="panel report-card">
              <div className="report-header">
                <h3>گزارش بازار امروز</h3>
                <span>{tehranDate()}</span>
              </div>

              <div className="report-stats">
                <div className="stat">
                  <strong>شاخص کل بورس</strong>
                  <span>{marketIndex.value !== null ? formatNumber(marketIndex.value) : '—'}</span>
                  {marketIndex.changePercent !== null && (
                    <small className={marketIndex.changePercent >= 0 ? 'positive' : 'negative'}>
                      {formatChange(marketIndex.changePercent)}
                    </small>
                  )}
                </div>

                <div className="stat">
                  <strong>
                    دلار {byId.dollar.demo && <DemoBadge />}
                  </strong>
                  <span>{formatNumber(market.usdIrr)}</span>
                  <small className={byId.dollar.trend === 'up' ? 'positive' : 'negative'}>
                    {byId.dollar.change}
                  </small>
                </div>

                <div className="stat">
                  <strong>
                    طلا ۱۸ عیار {byId.gold.demo && <DemoBadge />}
                  </strong>
                  <span>{formatNumber(market.gold)}</span>
                  <small className={byId.gold.trend === 'up' ? 'positive' : 'negative'}>
                    {byId.gold.change}
                  </small>
                </div>

                <div className="stat">
                  <strong>بیت‌کوین</strong>
                  <span>{formatNumber(market.bitcoin)}</span>
                  <small className={market.btcChange >= 0 ? 'positive' : 'negative'}>
                    {formatChange(market.btcChange)}
                  </small>
                </div>
              </div>

              <p className="report-content">
                بازار در وضعیت نسبتاً مطلوبی قرار دارد. رشد طلا و ارزهای دیجیتال
                نشان‌دهنده‌ی تقاضای خوب در بازار است. کارشناسان پیش‌بینی می‌کنند که
                این روند در هفته‌های آتی ادامه پیدا خواهد کرد.
              </p>
            </div>

            <div className="panel report-card">
              <div className="report-header">
                <h3>بخشنامه‌ها و اخبار رسمی</h3>
                <span>{bulletins.length > 0 ? 'آخرین موارد' : ''}</span>
              </div>

              <div className="report-list">
                {bulletins.length === 0 && (
                  <p style={{ color: 'var(--muted)' }}>در حال حاضر بخشنامه‌ای ثبت نشده است.</p>
                )}
                {bulletins.map((b, i) => {
                  const url = safeUrl(b.url)
                  return (
                    <div className="report-item" key={`${b.date}-${i}`}>
                      <strong>
                        {b.date ? `${b.date} - ` : ''}
                        {b.title}
                      </strong>
                      {b.summary && <p>{b.summary}</p>}
                      {url && (
                        <p>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            مشاهده منبع
                          </a>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
