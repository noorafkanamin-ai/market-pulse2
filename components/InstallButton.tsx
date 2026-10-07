'use client'

import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * دکمه‌ی «نصب برنامه».
 * - اندروید/کروم: نصب با یک لمس (رویداد beforeinstallprompt)
 * - آیفون/سافاری: نصب خودکار ممکن نیست؛ راهنمای «افزودن به صفحه اصلی» نشان داده می‌شود
 * - اگر برنامه قبلاً نصب شده باشد، دکمه نمایش داده نمی‌شود
 */
export default function InstallButton() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [help, setHelp] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsIos(/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1))

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setInstalled(standalone)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as InstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || (!deferred && !isIos)) return null

  async function onClick() {
    if (deferred) {
      await deferred.prompt()
      await deferred.userChoice
      setDeferred(null)
    } else {
      setHelp((v) => !v)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" className="mini-btn" onClick={onClick}>
        📲 نصب برنامه
      </button>

      {help && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            insetInlineEnd: 0,
            width: 270,
            zIndex: 50,
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: 14,
            boxShadow: 'var(--shadow)',
            fontSize: '0.85rem',
            lineHeight: 1.9,
          }}
        >
          <strong>نصب روی آیفون</strong>
          <ol style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
            <li>سایت را در <b>Safari</b> باز کنید.</li>
            <li>دکمهٔ اشتراک‌گذاری (مربع با فلش رو به بالا) را بزنید.</li>
            <li>گزینهٔ <b>Add to Home Screen</b> (افزودن به صفحه اصلی) را انتخاب کنید.</li>
          </ol>
        </div>
      )}
    </div>
  )
}
