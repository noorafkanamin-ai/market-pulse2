import { fetchMarketData, fetchCryptoDaily } from '@/lib/api'
import { formatNumber, getAssets } from '@/lib/utils'
import AppShell from '@/components/AppShell'
import PriceChart from '@/components/PriceChart'
import DemoBadge from '@/components/DemoBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 30

export default async function AssetPage({ params }: { params: { id: string } }) {
  const market = await fetchMarketData()
  const assets = getAssets(market)
  const asset = assets.find((a) => a.id === params.id)

  if (!asset) notFound()

  const daily =
    asset.id === 'bitcoin' || asset.id === 'ethereum'
      ? await fetchCryptoDaily(asset.id)
      : null
  const realHistory = daily !== null && daily.length > 0

  const chartData = realHistory
    ? daily!.map((c) => ({ name: c.label, value: Math.round(c.close) }))
    : []

  const historyRows = realHistory
    ? daily!
        .slice(-5)
        .reverse()
        .map((c) => ({
          date: c.fullDate,
          open: Math.round(c.open),
          close: Math.round(c.close),
          high: Math.round(c.high),
          low: Math.round(c.low),
        }))
    : []

  return (
    <AppShell>
      <div className="asset-page">
        <header className="asset-header">
          <Link href="/" className="back-btn">
            بازگشت
          </Link>
          <div className="asset-breadcrumb">خانه / {asset.type}</div>
        </header>

        <section className="panel asset-hero">
          <div className="asset-hero-top">
            <div className="asset-name-group">
              <div className={`asset-symbol ${asset.trend}`}>{asset.name.slice(0, 2)}</div>
              <div>
                <h1>{asset.name}</h1>
                <span>{asset.type}</span>
              </div>
            </div>

            <div className={`price-badge ${asset.trend}`}>{asset.change}</div>
          </div>

          <div className="asset-main-row">
            <div>
              <div className="asset-price-label">
                قیمت لحظه‌ای {asset.demo && <DemoBadge />}
              </div>
              <div className="asset-price">
                {formatNumber(asset.price)}
                <small>{asset.unit}</small>
              </div>
            </div>

            <div className="asset-meta-box">
              <div className="meta-item">
                <span>کمترین</span>
                <strong>{formatNumber(asset.low)}</strong>
              </div>
              <div className="meta-item">
                <span>بیشترین</span>
                <strong>{formatNumber(asset.high)}</strong>
              </div>
            </div>
          </div>

          {realHistory ? (
            <>
              <div className="asset-price-label" style={{ marginTop: 16 }}>
                نمودار ۷ روز اخیر
              </div>
              <div className="chart-wrap">
                <PriceChart data={chartData} />
              </div>
            </>
          ) : (
            <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: '0.85rem' }}>
              نمودار و نرخ تاریخی این دارایی هنوز به منبع داده‌ی واقعی وصل نشده است.
            </p>
          )}
        </section>

        <section className="info-grid">
          <div className="panel small-panel">
            <div className="panel-header">
              <div className="panel-title">خلاصه بازار</div>
            </div>
            <div className="mini-stats">
              <div className="mini-stat">
                <span>قیمت</span>
                <strong>{formatNumber(asset.price)}</strong>
              </div>
              <div className="mini-stat">
                <span>تغییر</span>
                <strong className={asset.trend === 'up' ? 'positive' : 'negative'}>
                  {asset.change}
                </strong>
              </div>
              <div className="mini-stat">
                <span>بازه روز</span>
                <strong>
                  {formatNumber(asset.low)} - {formatNumber(asset.high)}
                </strong>
              </div>
            </div>
          </div>

          <div className="panel small-panel">
            <div className="panel-header">
              <div className="panel-title">تحلیل کوتاه</div>
            </div>
            <p className="analysis-text">
              قیمت در بازه‌ی امروز با تمرکز روی تقاضا و عرضه، در وضعیت{' '}
              {asset.trend === 'up' ? 'مثبت' : 'منفی'} قرار دارد. نوسان‌ها
              عمدتاً به‌دلیل تغییرات لحظه‌ای در بازار و حجم معاملات رخ می‌دهد.
            </p>
          </div>
        </section>

        {realHistory && (
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              نرخ تاریخی
            </div>
            <div className="panel-filter">آخرین {formatNumber(historyRows.length)} روز</div>
          </div>

          <table className="history-table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>باز</th>
                <th>بسته</th>
                <th>بیشترین</th>
                <th>کمترین</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{formatNumber(row.open)}</td>
                  <td>{formatNumber(row.close)}</td>
                  <td>{formatNumber(row.high)}</td>
                  <td>{formatNumber(row.low)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        )}

        <section className="panel related-panel">
          <div className="panel-header">
            <div className="panel-title">دارایی‌های مرتبط</div>
          </div>

          <div className="related-grid">
            {assets.map((item) => (
              <Link
                key={item.id}
                href={`/assets/${item.id}`}
                className={`related-card ${asset.id === item.id ? 'active' : ''}`}
              >
                <div className="related-top">
                  <span>{item.name}</span>
                  <span className={item.trend === 'up' ? 'positive' : 'negative'}>
                    {item.change}
                  </span>
                </div>
                <strong>{formatNumber(item.price)}</strong>
                <small>{item.type}</small>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
