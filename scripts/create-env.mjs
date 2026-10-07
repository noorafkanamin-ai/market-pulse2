// استفاده:  npm run setup:env -- کلید_navasan
// فایل .env.local را با اسم درست و بدون هیچ مشکلی در پوشه‌ی اصلی پروژه می‌سازد.
import { writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const key = (process.argv[2] || '').trim().replace(/^["']|["']$/g, '')

if (!key) {
  console.error('کلید را وارد کن. مثال:\n  npm run setup:env -- YOUR_KEY')
  process.exit(1)
}

const file = resolve(process.cwd(), '.env.local')
if (existsSync(file)) console.log('فایل .env.local از قبل بود و بازنویسی شد.')

writeFileSync(file, `NAVASAN_API_KEY=${key}\n`, 'utf8')
console.log(`ساخته شد: ${file}`)
console.log('حالا سرور را ببند (Ctrl+C) و دوباره npm run dev بزن.')
