// سرویس‌ورکر ساده‌ی Market Pulse.
// عمداً قیمت‌ها و داده‌ی صفحه‌ها را کش نمی‌کند (قیمت باید همیشه تازه باشد):
//  - صفحه‌ها: همیشه از شبکه؛ فقط اگر اینترنت نبود صفحه‌ی «آفلاین» نشان داده می‌شود.
//  - فایل‌های ثابت (/_next/static و آیکن‌ها): کش‌شده برای سرعت بیشتر.
const CACHE = 'mp-static-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([OFFLINE_URL, '/icons/icon-192.png']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // ناوبری بین صفحه‌ها
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // فایل‌های ثابت
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          })
      )
    )
  }
  // بقیه‌ی درخواست‌ها (مثلاً به‌روزرسانی خودکار داده‌ی صفحه) دست‌نخورده می‌مانند
})
