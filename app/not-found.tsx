import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>صفحه پیدا نشد</h1>
        <p style={{ marginBottom: 20, color: 'var(--muted)' }}>آدرسی که وارد کردید وجود ندارد.</p>
        <Link href="/" className="button primary" style={{ display: 'inline-flex' }}>
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  )
}
