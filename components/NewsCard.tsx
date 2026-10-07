import { timeAgoFa } from '@/lib/utils'
import type { NewsItem } from '@/lib/news'

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-card-large">
      <span className="news-tag">{item.source}</span>
      <h3>{item.title}</h3>
      {item.summary && <p>{item.summary}</p>}
      <div className="news-meta-row">
        <span>{timeAgoFa(item.publishedAt)}</span>
        <span>ادامه در سایت منبع ↗</span>
      </div>
    </a>
  )
}
