# Market Pulse

## توسعه محلی

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # بررسی build معمولی Next.js
```

## Deploy روی Cloudflare Workers

این پروژه برای Cloudflare Workers با OpenNext آماده شده است. OpenNext یک پروژه Next.js موجود را به Worker قابل اجرا روی Cloudflare تبدیل می‌کند.

### Cloudflare Workers Builds

اگر ریپو را از داخل Cloudflare به GitHub وصل می‌کنی، در Build Settings این مقادیر را بگذار:

- **Build command:** `npx @opennextjs/cloudflare build`
- **Deploy command:** `npx @opennextjs/cloudflare deploy`

این مقادیر مطابق راهنمای فعلی OpenNext برای Workers Builds هستند.

### اجرای محلی با runtime کلودفلر

```bash
npm run preview
```

### متغیر محیطی

کلید API ناواسان را هرگز داخل Git commit نکن.

برای اجرای محلی:

```bash
npm run setup:env -- YOUR_NAVASAN_API_KEY
```

برای production، مقدار `NAVASAN_API_KEY` را در Cloudflare Workers به‌صورت Secret/Environment Variable تنظیم کن.

### Deploy از ترمینال

بعد از ورود به Cloudflare:

```bash
npm run deploy
```

OpenNext در زمان deploy از Wrangler برای انتشار Worker استفاده می‌کند.

### فایل‌های Cloudflare

- `open-next.config.ts` تنظیمات OpenNext را مشخص می‌کند.
- `wrangler.jsonc` ورودی Worker و assetهای خروجی را مشخص می‌کند.
- `.open-next/` خروجی build است و نباید commit شود.
- `public/_headers` assetهای استاتیک Next.js را cache می‌کند.

> اگر Cloudflare هنوز تنظیمات قدیمی پروژه را cache کرده، یک Deploy جدید با Build/Deploy Commandهای بالا اجرا کن.

اعدادی که برچسب «نمونه» دارند هنوز به منبع داده‌ی زنده وصل نیستند.
