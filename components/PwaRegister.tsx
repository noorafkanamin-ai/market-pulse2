'use client'

import { useEffect } from 'react'

/** ثبت سرویس‌ورکر؛ فقط در نسخه‌ی منتشرشده (نه در npm run dev) */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch((e) => console.error('SW register failed:', e))
  }, [])
  return null
}
