import type { Metadata, Viewport } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'
import PwaRegister from '@/components/PwaRegister'

const vazir = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazir',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: 'Market Pulse - بازار دیجیتال ایران',
  description: 'قیمت لحظه‌ای طلا، ارز، بیت‌کوین و اخبار بازار',
  keywords: 'market, price, gold, dollar, bitcoin, ethereum, news',
  manifest: '/manifest.webmanifest',
  applicationName: 'Market Pulse',
  appleWebApp: { capable: true, title: 'Market Pulse', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  openGraph: { type: 'website', locale: 'fa_IR', siteName: 'Market Pulse', title: 'Market Pulse - بازار دیجیتال ایران', description: 'قیمت لحظه‌ای طلا، ارز، بیت‌کوین و اخبار بازار' },
  twitter: { card: 'summary', title: 'Market Pulse - بازار دیجیتال ایران', description: 'قیمت لحظه‌ای طلا، ارز، بیت‌کوین و اخبار بازار' },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazir.variable}>
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}
