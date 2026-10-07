import { fetchMarketData, fetchCryptoDaily } from '@/lib/api'
import { formatNumber, getAssets } from '@/lib/utils'
import AppShell from '@/components/AppShell'
import PriceChart from '@/components/PriceChart'
import DemoBadge from '@/components/DemoBadge'
import Link from 'next/link'

export const revalidate = 30

export default async function ComparePage() {
  const market = await fetchMarketData()
  const assets = getAssets(market)

  const [btc, eth] = await Promise.all([
    fetchCryptoDaily('bitcoin'),
    fetchCryptoDaily('ethereum'),
  ])

  // رشد هر دارایی نسبت به ابتدای بازه (شروع = ۱۰۰)
  let compareChartData: Array<{ name: string; bitcoin: number; ethereum: number }> = []
  if (btc && eth) {
    const ethByDate = new Map(eth.map((c) => [c.date, c]))
    const common = btc.filter((c) => ethByDate.has(c.date))
    if (common.length > 1) {
      const btcBase = common[0].open
      const ethBase = ethByDate.get(common[0].date)!.open
      compareChartData = common.map((c) => ({
        name: c.label,
        bitcoin: Number(((c.close / btcBase) * 100).toFixed(2)),
        ethereum: Number(((ethByDate.get(c.date)!.close / ethBase) * 100).toFixed(2)),
      }))
    }
  }

  return (
    <AppShell>
      <div className="compare-page">
        <div className="container">
          <header className="compare-header">
            <div>
              <h1>مقایسه دارایی‌ها</h1>
              <p>قیمت، رشد و وضعیت هر دارایی در یک نگاه</p>
            </div>
            <Link href="/" className="back-btn">
              بازگشت
            </Link>
          </header>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">مقایسه رشد بیت‌کوین و اتریوم</div>
              <div className="panel-filter">۷ روز اخیر (شروع = ۱۰۰)</div>
            </div>
            <div className="chart-wrap" style={{ height: 300 }}>
              {compareChartData.length > 1 ? (
                <PriceChart data={compareChartData} keys={['bitcoin', 'ethereum']} />
              ) : (
                <p style={{ padding: 24, color: 'var(--muted)' }}>
                  داده‌ی نمودار در حال حاضر در دسترس نیست. کمی بعد دوباره امتحان کنید.
                </p>
              )}
            </div>
          </div>

          <div className="compare-table-wrap panel" style={{ marginTop: 20 }}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>دارایی</th>
                  <th>قیمت</th>
                  <th>تغییر</th>
                  <th>کمترین</th>
                  <th>بیشترین</th>
                  <th>دسته</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="compare-name">
                      {asset.name}
                      {asset.demo && <DemoBadge />}
                    </td>
                    <td>{formatNumber(asset.price)}</td>
                    <td className={asset.trend === 'up' ? 'positive' : 'negative'}>
                      {asset.change}
                    </td>
                    <td>{formatNumber(asset.low)}</td>
                    <td>{formatNumber(asset.high)}</td>
                    <td>{asset.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
