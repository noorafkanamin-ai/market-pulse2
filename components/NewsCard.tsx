import { timeAgoFa } from '@/lib/utils'
import type { NewsItem } from '@/lib/news'

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-card-large">
      <div className="news-card-top"><span className="news-tag">{item.source}</span><span className="news-arrow" aria-hidden="true">↗</span></div>
      <div className="news-card-content"><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}</div>
      <div className="news-meta-row"><span className="news-time"><span className="news-time-dot" aria-hidden="true" />{timeAgoFa(item.publishedAt)}</span><span className="news-source-link">مشاهده منبع</span></div>
    </a>
  )
}
