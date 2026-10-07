'use client'

import React, { useEffect, useState, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { marketIndex } from '@/lib/manual'
import InstallButton from './InstallButton'
import { formatChange, formatNumber } from '@/lib/utils'

// هر چند میلی‌ثانیه داده‌ی صفحه خودکار تازه شود (بدون رفرش دستی)
const REFRESH_MS = 30_000

interface AppShellProps {
  children: ReactNode
}

const SEARCH_TARGETS: Array<{ keywords: string[]; href: string }> = [
  { keywords: ['طلا', 'gold'], href: '/assets/gold' },
  { keywords: ['دلار', 'dollar', 'usd'], href: '/assets/dollar' },
  { keywords: ['بیت', 'bitcoin', 'btc'], href: '/assets/bitcoin' },
  { keywords: ['اتریوم', 'ethereum', 'eth'], href: '/assets/ethereum' },
  { keywords: ['خبر', 'news'], href: '/news' },
  { keywords: ['گزارش', 'report'], href: '/reports' },
  { keywords: ['مقایسه', 'compare'], href: '/compare' },
]

export default function AppShell({ children }: AppShellProps) {
  const [search, setSearch] = useState('')
  const router = useRouter()

  // به‌روزرسانی خودکار: فقط وقتی تب دیده می‌شود، و فوراً وقتی کاربر به تب برمی‌گردد
  useEffect(() => {
    let last = Date.now()
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      last = Date.now()
      router.refresh()
    }
    const id = setInterval(refresh, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last > REFRESH_MS) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const q = search.trim().toLowerCase()
    if (!q) return
    const hit = SEARCH_TARGETS.find((t) => t.keywords.some((k) => q === k))
    router.push(hit ? hit.href : `/markets?q=${encodeURIComponent(search.trim())}`)
    setSearch('')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-mark">M</div>
          <div>
            <strong>Market Pulse</strong>
            <small>بازار دیجیتال</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/" className="nav-item">
            <span>🏠</span>
            <span>صفحه اصلی</span>
          </Link>
          <Link href="/compare" className="nav-item">
            <span>📊</span>
            <span>مقایسه</span>
          </Link>
          <Link href="/markets" className="nav-item">
            <span>🌍</span>
            <span>ارز، طلا و انرژی</span>
          </Link>
          <Link href="/markets?tab=crypto" className="nav-item">
            <span>🪙</span>
            <span>رمزارزها</span>
          </Link>
          <Link href="/reports" className="nav-item">
            <span>📈</span>
            <span>گزارش‌ها</span>
          </Link>
          <Link href="/assets/gold" className="nav-item">
            <span>🟡</span>
            <span>طلا</span>
          </Link>
          <Link href="/assets/dollar" className="nav-item">
            <span>💵</span>
            <span>دلار</span>
          </Link>
          <Link href="/assets/bitcoin" className="nav-item">
            <span>₿</span>
            <span>بیت‌کوین</span>
          </Link>
          <Link href="/assets/ethereum" className="nav-item">
            <span>◆</span>
            <span>اتریوم</span>
          </Link>
          <Link href="/news" className="nav-item">
            <span>📰</span>
            <span>اخبار</span>
          </Link>
        </nav>

        <div className="sidebar-card">
          <p>شاخص کل بورس</p>
          <strong>{marketIndex.value !== null ? formatNumber(marketIndex.value) : '—'}</strong>
          {marketIndex.value !== null && marketIndex.changePercent !== null && (
            <span className={marketIndex.changePercent >= 0 ? 'positive' : 'negative'}>
              {formatChange(marketIndex.changePercent)}
            </span>
          )}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              type="text"
              placeholder="جست‌وجوی ارز، رمزارز، طلا..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
            />
          </div>

          <div className="topbar-actions">
            <InstallButton />
            <div className="status-pill">
              <span className="dot"></span>
              آنلاین
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}
