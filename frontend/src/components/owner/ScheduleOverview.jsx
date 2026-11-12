import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOwnerScheduleOverview } from '../../services/ownerApi.js'

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const money = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')}đ`
const monthLabel = (value) => new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T00:00:00`))

export default function ScheduleOverview() {
  const [month, setMonth] = useState(() => dateKey(new Date()).slice(0, 7))
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState('')

  useEffect(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const from = dateKey(new Date(year, monthNumber - 1, 1))
    const to = dateKey(new Date(year, monthNumber, 0))
    const controller = new AbortController()
    setLoading(true)
    getOwnerScheduleOverview({ from, to, signal: controller.signal })
      .then((result) => { setOverview(result); setError('') })
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [month])

  const days = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const first = new Date(year, monthNumber - 1, 1)
    const offset = (first.getDay() + 6) % 7
    const count = new Date(year, monthNumber, 0).getDate()
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => dateKey(new Date(year, monthNumber - 1, index + 1)))]
  }, [month])
  const eventsOnDay = (day) => (overview?.events || []).filter((event) => event.startDate <= day && event.endDate > day)
  const blockedOnDay = (day) => (overview?.products || []).filter((product) => product.blockedDates?.includes(day))
  const moveMonth = (offset) => {
    const [year, monthNumber] = month.split('-').map(Number)
    const next = new Date(year, monthNumber - 1 + offset, 1)
    setMonth(dateKey(next).slice(0, 7))
    setSelectedDay('')
  }
  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : []

  return <main className="min-h-[60vh] bg-[#F8F9FB] px-4 py-6 sm:px-6">
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-xs text-gray-400">Lịch trình & Giá / Lịch tổng quan</p><h1 className="text-2xl font-bold text-gray-800">Lịch tổng quan</h1><p className="mt-1 text-sm text-gray-500">Lịch thuê, ngày chặn và giá thiết bị được tải từ hệ thống.</p></div>
        <Link to="/owner/schedule-settings" className="rounded-lg bg-[#F45116] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d9400d]">Thiết lập lịch & giá</Link>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Đơn có lịch trong tháng', overview?.totalRentals ?? '—'],
          ['Thiết bị đang được thuê', overview?.activeDevices ?? '—'],
          ['Doanh thu thuê dự kiến', overview ? money(overview.projectedRevenue) : '—'],
          ['Thiết bị đã đăng', overview?.products?.length ?? '—'],
        ].map(([label, value]) => <article key={label} className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-2 text-xl font-bold text-gray-800">{loading ? '…' : value}</p></article>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold capitalize text-gray-800">{monthLabel(month)}</h2><div className="flex gap-2"><button type="button" onClick={() => moveMonth(-1)} aria-label="Tháng trước" className="size-9 rounded-lg border border-gray-200 text-lg hover:bg-gray-50">‹</button><button type="button" onClick={() => moveMonth(1)} aria-label="Tháng sau" className="size-9 rounded-lg border border-gray-200 text-lg hover:bg-gray-50">›</button></div></div>
          <div className="grid grid-cols-7 border-b border-gray-100 pb-2 text-center text-xs font-semibold text-gray-400">{['T2','T3','T4','T5','T6','T7','CN'].map((day) => <span key={day}>{day}</span>)}</div>
          {loading ? <p className="py-16 text-center text-sm text-gray-500">Đang tải lịch thuê…</p> : <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-gray-100 bg-gray-50/50 sm:min-h-28" />
              const events = eventsOnDay(day)
              const blocked = blockedOnDay(day)
              const today = day === dateKey(new Date())
              return <button type="button" key={day} onClick={() => setSelectedDay(day)} className={`min-h-24 overflow-hidden border-b border-r border-gray-100 p-1.5 text-left transition hover:bg-orange-50/60 sm:min-h-28 sm:p-2 ${selectedDay === day ? 'bg-orange-50 ring-1 ring-inset ring-orange-300' : ''}`}>
                <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${today ? 'bg-[#F45116] font-bold text-white' : 'text-gray-700'}`}>{Number(day.slice(-2))}</span>
                {blocked.slice(0, 1).map((product) => <span key={`b-${product.productId}`} className="mt-1 block truncate rounded bg-gray-100 px-1 py-0.5 text-[9px] text-gray-500">Chặn · {product.productName}</span>)}
                {events.slice(0, 2).map((event) => <span key={event.rentalItemId} title={`${event.productName} · ${event.renterName}`} className={`mt-1 block truncate rounded px-1 py-0.5 text-[9px] font-medium ${['ACTIVE','IN_PROGRESS','RENTING'].includes(String(event.status).toUpperCase()) ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{event.productName}</span>)}
                {events.length > 2 && <span className="block px-1 text-[9px] text-gray-400">+{events.length - 2} đơn</span>}
              </button>
            })}
          </div>}
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-500"><span><i className="mr-1 inline-block size-2 rounded-sm bg-orange-300"/>Chờ thuê / đã xác nhận</span><span><i className="mr-1 inline-block size-2 rounded-sm bg-blue-400"/>Đang thuê</span><span><i className="mr-1 inline-block size-2 rounded-sm bg-gray-300"/>Ngày Owner chặn</span></div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white p-4"><h2 className="font-bold text-gray-800">{selectedDay ? `Lịch ngày ${new Intl.DateTimeFormat('vi-VN').format(new Date(`${selectedDay}T00:00:00`))}` : 'Đơn thuê trong tháng'}</h2>
            {selectedDay ? selectedEvents.length ? <div className="mt-3 space-y-3">{selectedEvents.map((event) => <article key={event.rentalItemId} className="rounded-lg bg-blue-50 p-3"><p className="text-sm font-semibold text-gray-800">{event.productName} × {event.quantity}</p><p className="mt-1 text-xs text-gray-600">{event.renterName} · #{event.rentalCode}</p><p className="mt-1 text-xs text-gray-500">{event.startDate} – {event.endDate} · {money(event.subtotal)}</p></article>)}</div> : <p className="mt-3 text-sm text-gray-500">Không có đơn thuê vào ngày này.</p>
              : overview?.events?.length ? <div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto">{overview.events.map((event) => <article key={event.rentalItemId} className="rounded-lg border border-gray-100 p-3"><p className="text-sm font-semibold text-gray-800">{event.productName} × {event.quantity}</p><p className="mt-1 text-xs text-gray-500">{event.renterName} · #{event.rentalCode}</p><p className="mt-1 text-xs text-gray-400">{event.startDate} – {event.endDate} · {money(event.subtotal)}</p></article>)}</div> : <p className="mt-3 text-sm text-gray-500">Chưa có lịch thuê trong tháng.</p>}
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center justify-between"><h2 className="font-bold text-gray-800">Giá thiết bị</h2><Link to="/owner/schedule-settings" className="text-xs font-semibold text-orange-600">Chỉnh sửa</Link></div>
            {overview?.products?.length ? <div className="mt-3 divide-y divide-gray-100">{overview.products.map((product) => <div key={product.productId} className="py-3 first:pt-0 last:pb-0"><p className="text-sm font-semibold text-gray-800">{product.productName}</p><p className="mt-1 text-xs text-gray-500">Ngày thường {money(product.dailyPrice)} · Cuối tuần {money(product.weekendPrice)} / ngày</p><p className="mt-1 text-xs text-gray-400">Cọc {money(product.depositAmount)} · {product.available ? 'Đang nhận lịch' : 'Tạm ngừng nhận lịch'}</p></div>)}</div> : <p className="mt-3 text-sm text-gray-500">Chưa có thiết bị để hiển thị giá.</p>}
          </section>
        </aside>
      </div>
    </div>
  </main>
}
