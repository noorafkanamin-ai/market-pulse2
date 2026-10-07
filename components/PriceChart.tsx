'use client'

import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Point = { name: string; [key: string]: string | number }

interface PriceChartProps {
  data: Point[]
  keys?: string[]
}

const COLORS = ['#2563eb', '#f59e0b', '#10b981']

const compact = new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 })

/**
 * محور عمودی را روی بازه‌ی واقعی داده می‌بندیم (نه از صفر)، وگرنه تغییرهای
 * چند درصدیِ قیمتی مثل ۹۰ هزار دلار روی محور ۰ تا ۹۰ هزار «خط صاف» دیده می‌شود.
 */
function getDomain(data: Point[], keys: string[]): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const row of data) {
    for (const k of keys) {
      const v = Number(row[k])
      if (Number.isFinite(v)) {
        if (v < min) min = v
        if (v > max) max = v
      }
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  const pad = (max - min) * 0.15 || Math.abs(max) * 0.01 || 1
  return [min - pad, max + pad]
}

export default function PriceChart({ data, keys = ['value'] }: PriceChartProps) {
  const domain = getDomain(data, keys)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.45} />
              <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.04} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#64748b', fontSize: 11 }}
        />
        <YAxis
          domain={domain}
          allowDataOverflow
          width={56}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickFormatter={(v: number) => compact.format(v)}
        />
        <Tooltip
          formatter={(v) => full.format(Number(v))}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#0f172a',
          }}
        />
        {keys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stroke={COLORS[i % COLORS.length]}
            fill={`url(#grad-${k})`}
            strokeWidth={3}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
