import { formatNumber, formatChange } from '@/lib/utils'
import type { BoardGroup } from '@/lib/utils'

// جابه‌جایی دستی عدد قیمت و واحد (تومان/دلار) به پیکسل:
// عدد مثبت = به راست، عدد منفی = به چپ، صفر = بدون جابه‌جایی.
const PRICE_SHIFT_PX = 10

// استایل‌ها عمداً داخل خود کامپوننت‌اند تا به globals.css و کش مرورگر وابسته نباشد.
const th: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'right',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--muted)',
  borderBottom: '1px solid var(--line)',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'right',
  fontSize: '0.9rem',
  borderBottom: '1px solid var(--line)',
  verticalAlign: 'middle',
}

const sub: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  color: 'var(--muted)',
  fontWeight: 400,
  marginTop: 2,
}

export default function MarketBoard({ groups }: { groups: BoardGroup[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: 20,
      }}
    >
      {groups.map((group) => (
        <div className="panel" key={group.id} style={{ minWidth: 0 }}>
          <div className="panel-header">
            <div className="panel-title">{group.title}</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>نام</th>
                  <th style={th}>قیمت</th>
                  <th style={th}>تغییر</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ ...td, fontWeight: 800 }}>
                      {row.name}
                      <span style={{ ...sub, direction: 'ltr', textAlign: 'right' }}>{row.code}</span>
                    </td>

                    {row.quote ? (
                      <>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              transform: `translateX(${PRICE_SHIFT_PX}px)`,
                            }}
                          >
                            {formatNumber(row.quote.value)}
                            <span style={sub}>{row.unit}</span>
                          </span>
                        </td>
                        <td
                          style={{
                            ...td,
                            whiteSpace: 'nowrap',
                            color:
                              row.quote.changePct === null
                                ? undefined
                                : row.quote.changePct >= 0
                                  ? 'var(--green)'
                                  : 'var(--red)',
                          }}
                        >
                          {row.quote.changePct === null ? '—' : formatChange(row.quote.changePct)}
                        </td>
                      </>
                    ) : (
                      <td colSpan={2} style={{ ...td, color: 'var(--muted)' }}>
                        ناموجود
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
