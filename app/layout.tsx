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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Market Pulse - بازار دیجیتال ایران',
  description: 'قیمت لحظه‌ای طلا، ارز، بیت‌کوین و اخبار بازار',
  keywords: 'market, price, gold, dollar, bitcoin, ethereum, news',
  manifest: '/manifest.webmanifest',
  applicationName: 'Market Pulse',
  appleWebApp: { capable: true, title: 'Market Pulse', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
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
