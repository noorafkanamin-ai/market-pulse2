import { fetchNews, NEWS_FEEDS } from '@/lib/news'
import AppShell from '@/components/AppShell'
import NewsCard from '@/components/NewsCard'
import Link from 'next/link'

export const metadata = { title: 'اخبار اقتصادی | Market Pulse', description: 'آخرین تیترها و خلاصه خبرهای اقتصادی از منابع منتخب.' } as const

export const revalidate = 900

export default async function NewsPage() {
  const items = await fetchNews(40)

  return (
    <AppShell>
      <div className="news-page">
        <div className="container">
          <header className="news-page-header">
            <div>
              <h1>اخبار اقتصادی</h1>
              <p>تیتر و خلاصه‌ی آخرین خبرها از منابع زیر؛ برای متن کامل به سایت منبع بروید</p>
            </div>
            <Link href="/" className="back-btn">
              بازگشت
            </Link>
          </header>

          {items.length === 0 ? (
            <div className="panel news-empty-panel">
              در حال حاضر خبری دریافت نشد. چند دقیقه بعد دوباره امتحان کنید.
            </div>
          ) : (
            <div className="news-list-grid">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <p className="news-source-note">
            منابع: {NEWS_FEEDS.map((f) => f.name).join('، ') || '—'}. حق نشر خبرها متعلق به منابع
            آن‌هاست و Market Pulse فقط تیتر و خلاصه‌ی کوتاه را همراه لینک نمایش می‌دهد.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
