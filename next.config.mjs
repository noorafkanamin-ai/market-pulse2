/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // نکته: هدر Cache-Control سراسری قبلی حذف شد؛ چون revalidate صفحه‌ها (۳۰ ثانیه)
  // را خنثی می‌کرد و قیمت‌ها تا ۱ ساعت قدیمی می‌ماندند.
}

export default nextConfig
