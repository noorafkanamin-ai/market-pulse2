'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import MarketBoard from './MarketBoard'
import { CRYPTO_FA } from '@/lib/cryptoNames'
import { formatNumber, formatChange, formatPrice, formatCompact } from '@/lib/utils'
import type { BoardGroup, BoardRow } from '@/lib/utils'
import type { CryptoCoin } from '@/lib/api'

type Tab = 'fiat' | 'crypto'

interface Props {
  groups: BoardGroup[]
  coins: CryptoCoin[] | null
  tomanRate: number | null // نرخ دلار به تومان؛ null یعنی نرخ زنده نیست و ستون تومان نمایش داده نمی‌شود
  initialTab: Tab | null
  initialQuery: string
}

/** یکسان‌سازی متن: حروف عربی/فارسی، نیم‌فاصله، فاصله و حروف بزرگ و کوچک */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u200c\u200f\s]/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')

const matchRow = (r: BoardRow, q: string) => !q || norm(`${r.name} ${r.code} ${r.id}`).includes(q)

const matchCoin = (c: CryptoCoin, q: string) =>
  !q || norm(`${c.name} ${c.symbol} ${c.id} ${CRYPTO_FA[c.id] ?? ''}`).includes(q)

export default function MarketExplorer({ groups, coins, tomanRate, initialTab, initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [limit, setLimit] = useState(50)
  const q = norm(query)

  const [tab, setTab] = useState<Tab>(() => {
    if (initialTab) return initialTab
    const iq = norm(initialQuery)
    if (iq) {
      const fiat = groups.some((g) => g.rows.some((r) => matchRow(r, iq)))
      const crypto = (coins ?? []).some((c) => matchCoin(c, iq))
      if (!fiat && crypto) return 'crypto'
    }
    return 'fiat'
  })

  const filteredGroups = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, rows: g.rows.filter((r) => matchRow(r, q)) }))
        .filter((g) => g.rows.length > 0),
    [groups, q]
  )
  const fiatCount = filteredGroups.reduce((n, g) => n + g.rows.length, 0)

  const filteredCoins = useMemo(() => (coins ?? []).filter((c) => matchCoin(c, q)), [coins, q])
  const coinCount = filteredCoins.length
  const visibleCoins = q ? filteredCoins.slice(0, 100) : filteredCoins.slice(0, limit)

  const otherTab: Tab = tab === 'fiat' ? 'crypto' : 'fiat'
  const otherCount = tab === 'fiat' ? coinCount : fiatCount
  const currentCount = tab === 'fiat' ? fiatCount : coinCount

  return (
    <div>
      <div className="explorer-search">
        <span>⌕</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جست‌وجو: دلار، یورو، درهم، سکه، بیت‌کوین، اتریوم، BTC، SOL ..."
          aria-label="جست‌وجوی ارز و رمزارز"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن">
            ✕
          </button>
        )}
      </div>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'fiat'}
          className={`tab ${tab === 'fiat' ? 'active' : ''}`}
          onClick={() => setTab('fiat')}
        >
          ارز، طلا و انرژی ({formatNumber(fiatCount)})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'crypto'}
          className={`tab ${tab === 'crypto' ? 'active' : ''}`}
          onClick={() => setTab('crypto')}
        >
          رمزارزها ({formatNumber(coinCount)})
        </button>
      </div>

      {q && currentCount === 0 && (
        <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
          <p>نتیجه‌ای برای «{query}» در این بخش پیدا نشد.</p>
          {otherCount > 0 && (
            <button
              type="button"
              className="mini-btn"
              style={{ marginTop: 10 }}
              onClick={() => setTab(otherTab)}
            >
              {formatNumber(otherCount)} نتیجه در {otherTab === 'fiat' ? 'ارز، طلا و انرژی' : 'رمزارزها'} ببین
            </button>
          )}
        </div>
      )}

      {tab === 'fiat' && fiatCount > 0 && <MarketBoard groups={filteredGroups} />}

      {tab === 'crypto' && coins === null && (
        <div className="panel" style={{ padding: 20 }}>
          قیمت رمزارزها در حال حاضر در دسترس نیست (ممکن است محدودیت درخواست CoinGecko باشد).
          چند دقیقه بعد دوباره امتحان کنید.
        </div>
      )}

      {tab === 'crypto' && coins !== null && coinCount > 0 && (
        <div className="panel">
          <div style={{ overflowX: 'auto' }}>
            <table className="compare-table crypto-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>رمزارز</th>
                  <th>قیمت (دلار)</th>
                  {tomanRate !== null && <th>قیمت (تومان)</th>}
                  <th>۲۴ ساعت</th>
                  <th>ارزش بازار</th>
                </tr>
              </thead>
              <tbody>
                {visibleCoins.map((c) => {
                  const faName = CRYPTO_FA[c.id]
                  const hasPage = c.id === 'bitcoin' || c.id === 'ethereum'
                  const label = (
                    <span className="coin-cell">
                      {c.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt="" width={24} height={24} loading="lazy" />
                      )}
                      <span>
                        <strong>{faName ?? c.name}</strong>
                        <small>
                          {c.symbol}
                          {faName ? ` · ${c.name}` : ''}
                        </small>
                      </span>
                    </span>
                  )
                  return (
                    <tr key={c.id}>
                      <td>{c.rank !== null ? formatNumber(c.rank) : '—'}</td>
                      <td className="compare-name">
                        {hasPage ? <Link href={`/assets/${c.id}`}>{label}</Link> : label}
                      </td>
                      <td>{formatPrice(c.price)}</td>
                      {tomanRate !== null && <td>{formatPrice(c.price * tomanRate)}</td>}
                      <td
                        className={
                          c.change24h === null ? undefined : c.change24h >= 0 ? 'positive' : 'negative'
                        }
                      >
                        {c.change24h === null ? '—' : formatChange(c.change24h)}
                      </td>
                      <td>{c.marketCap !== null ? formatCompact(c.marketCap) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!q && limit < coinCount && (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <button type="button" className="mini-btn" onClick={() => setLimit((l) => l + 50)}>
                نمایش بیشتر ({formatNumber(coinCount - limit)} رمزارز دیگر)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
