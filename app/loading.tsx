export default function Loading() {
  return (
    <main className="error-state" aria-live="polite" aria-busy="true">
      <section className="state-card">
        <div className="loading-content loading-center"><span className="loading-spinner" aria-hidden="true" /><span>در حال دریافت اطلاعات بازار...</span></div>
        <p>اطلاعات لحظه‌ای در حال بارگذاری است. لطفاً چند لحظه صبر کنید.</p>
      </section>
    </main>
  )
}
