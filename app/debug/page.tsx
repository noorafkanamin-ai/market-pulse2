import { notFound } from 'next/navigation'
import { peekNavasanCache } from '@/lib/api'

// فقط برای تشخیص مشکل روی کامپیوتر خودت (در نسخه‌ی منتشرشده ۴۰۴ می‌دهد).
// به‌طور پیش‌فرض هیچ درخواستی از سهمیه‌ی navasan مصرف نمی‌کند و پاسخ ذخیره‌شده را نشان می‌دهد.
// با /debug?fresh=1 یک درخواست زنده می‌زند (۱ از ۱۲۰ درخواست ماهانه).
export const dynamic = 'force-dynamic'

const WANTED = ['usd_sell', 'eur', 'gbp', 'try', 'cny', 'aed', 'sar', 'kwd', 'qar', 'bhd', 'omr', '18ayar', 'sekkeh']
const SAMPLE_KEYS = ['usd_sell', '18ayar', 'sekkeh', 'eur']

export default async function DebugPage({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string }>
}) {
  const { fresh } = await searchParams

  if (process.env.NODE_ENV === 'production') notFound()

  const raw = process.env.NAVASAN_API_KEY
  const checks: Array<[string, string]> = []
  checks.push(['NAVASAN_API_KEY خوانده شد؟', raw ? 'بله' : 'خیر ← فایل .env.local پیدا یا خوانده نشده'])

  let body: unknown = null
  let source = ''

  if (raw) {
    checks.push(['طول کلید (باید ۳۲ باشد)', String(raw.length)])
    if (raw !== raw.trim()) checks.push(['هشدار', 'اول یا آخر کلید فاصله یا خط جدید دارد'])
    if (/^["']|["']$/.test(raw)) checks.push(['هشدار', 'کلید داخل گیومه است؛ گیومه را بردار'])

    if (fresh === '1') {
      try {
        const res = await fetch(
          `https://api.navasan.tech/latest/?api_key=${encodeURIComponent(raw.trim())}`,
          { cache: 'no-store', signal: AbortSignal.timeout(8000) }
        )
        const text = await res.text()
        checks.push(['وضعیت HTTP از navasan', `${res.status} ${res.statusText}`])
        try {
          body = JSON.parse(text)
          source = 'درخواست زنده (یک درخواست از سهمیه مصرف شد)'
        } catch {
          checks.push(['پاسخ (JSON نبود)', text.slice(0, 300)])
        }
      } catch (e) {
        checks.push(['اتصال به navasan', `ناموفق: ${String(e)}`])
      }
    } else {
      const cached = peekNavasanCache()
      if (cached) {
        body = cached.data
        source = `پاسخ ذخیره‌شده، دریافت‌شده در ${new Date(cached.at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })} (بدون مصرف سهمیه)`
      } else {
        checks.push([
          'پاسخ ذخیره‌شده',
          'هنوز چیزی ذخیره نشده. یک بار صفحه‌ی اصلی را باز کن؛ اگر باز هم نبود، /debug?fresh=1 را بزن.',
        ])
      }
    }
  }

  const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const keys = obj ? Object.keys(obj) : []
  if (obj) {
    checks.push(['منبع داده', source])
    checks.push(['تعداد کلیدهای پاسخ', String(keys.length)])
    const missing = WANTED.filter((k) => !(k in obj))
    checks.push(['کلیدهای موردنیاز که در پاسخ نیستند', missing.length ? missing.join(', ') : 'هیچ‌کدام (همه هست)'])
  }

  return (
    <div style={{ maxWidth: 820, margin: '40px auto', padding: 20, lineHeight: 2 }}>
      <h1>تشخیص اتصال navasan</h1>
      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <tbody>
          {checks.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid #8884' }}>
              <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{k}</td>
              <td style={{ padding: 8 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {obj && (
        <>
          <h3 style={{ marginTop: 24 }}>نمونه‌ی خام آیتم‌ها (این بخش را برای من بفرست)</h3>
          <pre dir="ltr" style={{ background: '#8882', padding: 12, overflow: 'auto', fontSize: 13 }}>
            {JSON.stringify(
              Object.fromEntries(SAMPLE_KEYS.map((k) => [k, obj[k] ?? null])),
              null,
              2
            )}
          </pre>
          <h3>همه‌ی کلیدهای موجود در پاسخ</h3>
          <pre dir="ltr" style={{ background: '#8882', padding: 12, overflow: 'auto', fontSize: 13, whiteSpace: 'pre-wrap' }}>
            {keys.join(', ')}
          </pre>
        </>
      )}
    </div>
  )
}
