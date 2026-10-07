import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) return []
  const site = baseUrl.replace(/\/$/, '')
  const now = new Date()
  return [
    { url: site, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${site}/markets`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${site}/compare`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${site}/reports`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${site}/news`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${site}/assets/gold`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${site}/assets/dollar`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${site}/assets/bitcoin`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${site}/assets/ethereum`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
  ]
}
