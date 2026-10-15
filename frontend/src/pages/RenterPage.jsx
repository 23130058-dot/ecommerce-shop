import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getStoredAuth } from '../services/authApi.js'
import { getCurrentRentalItems, getRenterDashboard } from '../services/shoppingApi.js'

const navigation = [
  { to: '/renter', label: 'Tổng quan', icon: '▦' },
  { to: '/renter/orders', label: 'Đơn thuê của tôi', icon: '▤' },
  { to: '/wishlist', label: 'Danh sách yêu thích', icon: '♡' },
  { to: '/compare', label: 'Quản lý & So sánh', icon: '⇄' },
  { to: '/renter/profile', label: 'Cài đặt tài khoản', icon: '⚙' },
]

const statusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ACTIVE: 'Đang thuê',
  RENTING: 'Đang thuê',
  IN_PROGRESS: 'Đang thuê',
  RETURN_PENDING: 'Chờ trả thiết bị',
  RETURN_REQUESTED: 'Chờ trả thiết bị',
  AWAITING_RETURN: 'Chờ trả thiết bị',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  CANCELED: 'Đã hủy',
  REJECTED: 'Đã từ chối',
}

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function dateLabel(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function rentalStatus(status) {
  const key = String(status || '').toUpperCase()
  return statusLabels[key] || key || 'Đang cập nhật'
}

function Metric({ icon, label, value, note, tone = 'orange' }) {
  const tones = {
    orange: 'bg-orange-50 text-[#ff5500]',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-violet-50 text-violet-600',
  }
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">{value}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-lg ${tones[tone]}`} aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-3 text-xs text-gray-400">{note}</p>
    </article>
  )
}

function RentalRow({ rental }) {
  const status = String(rental.status || '').toUpperCase()
  const statusTone = ['COMPLETED'].includes(status)
    ? 'bg-emerald-50 text-emerald-700'
    : ['ACTIVE', 'RENTING', 'IN_PROGRESS', 'CONFIRMED'].includes(status)
      ? 'bg-blue-50 text-blue-700'
      : ['CANCELLED', 'CANCELED', 'REJECTED'].includes(status)
        ? 'bg-gray-100 text-gray-600'
        : 'bg-orange-50 text-orange-700'
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 sm:gap-4">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 p-1.5 sm:size-16">
        {rental.firstImageKey ? <img className="max-h-full max-w-full object-contain" src={resolveProductImage(rental.firstImageKey)} alt="" /> : <span aria-hidden="true">📷</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-1 text-xs font-bold ${statusTone}`}>{rentalStatus(status)}</span>
          <span className="text-xs text-gray-400">#{rental.rentalCode}</span>
        </div>
        <p className="mt-1 truncate text-sm font-bold text-gray-900">{rental.firstProductName || `${rental.itemCount || 0} thiết bị thuê`}</p>
        <p className="mt-1 text-xs text-gray-500">{rental.itemCount || 0} thiết bị · Đặt ngày {dateLabel(rental.createdAt)}</p>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs text-gray-400">Tổng đơn</p>
        <p className="mt-1 text-sm font-extrabold text-gray-900">{money(rental.totalAmount)}</p>
      </div>
      <Link className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#ff5500] hover:text-[#ff5500]" to={`/renter/orders/${rental.rentalId}`}>Chi tiết</Link>
    </article>
  )
}

function EmptyOrders() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-5 py-9 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-orange-50 text-xl text-[#ff5500]" aria-hidden="true">▱</span>
      <h3 className="mt-3 text-base font-bold text-gray-900">Chưa có đơn thuê nào</h3>
      <p className="mt-1 text-sm text-gray-500">Khi bạn đặt thuê thiết bị, đơn và lịch thuê sẽ được hiển thị tại đây.</p>
      <Link className="mt-4 inline-flex rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600" to="/categories">Khám phá thiết bị</Link>
    </div>
  )
}

export default function RenterPage() {
  const location = useLocation()
  const auth = getStoredAuth()
  const activeSection = location.pathname.split('/')[2] || 'renter'
  const [dashboard, setDashboard] = useState(null)
  const [currentRentalItems, setCurrentRentalItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getRenterDashboard({ signal: controller.signal }), getCurrentRentalItems({ signal: controller.signal })])
      .then(([overview, items]) => {
        setDashboard(overview)
        setCurrentRentalItems(Array.isArray(items) ? items : [])
      })
      .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  if (!auth) return <Navigate to="/login" replace state={{ from: location }} />

  const rentals = dashboard?.rentalHistory || []
  const recent = dashboard?.recentRentals || []
  const isOrders = activeSection === 'orders'

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-sans text-gray-900">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-6">
          <aside className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-[#ed4b0a]">{(dashboard?.fullName || auth.user?.fullName || 'LR').slice(0, 1).toLocaleUpperCase('vi')}</div>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{dashboard?.fullName || auth.user?.fullName || 'Khách thuê'}</p><p className="mt-0.5 text-xs text-gray-400">Người thuê LensRent</p></div>
            </div>
            <nav aria-label="Workspace renter" className="rounded-xl border border-gray-200 bg-white p-2">
              <p className="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-wider text-gray-400">Workspace</p>
              {navigation.map((item) => (
                <NavLink className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-orange-50 text-[#e94b0a]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`} end={item.to === '/renter'} key={item.to} to={item.to}>
                  <span className="w-5 text-center text-base" aria-hidden="true">{item.icon}</span>{item.label}
                </NavLink>
              ))}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Hỗ trợ</p>
                <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50" href="tel:19006789"><span className="w-5 text-center">◷</span>Lịch sử giao dịch</a>
                <Link className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50" to="/renter/profile"><span className="w-5 text-center">♧</span>Thông báo & tài khoản</Link>
              </div>
            </nav>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Cần giúp đỡ?</p>
              <p className="mt-2 text-xs leading-5 text-gray-500">Liên hệ đội ngũ hỗ trợ nếu bạn cần trợ giúp về đơn thuê hoặc thiết bị.</p>
              <a className="mt-3 inline-flex rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-[#ff5500] hover:text-[#ff5500]" href="tel:19006789">Hỗ trợ ngay</a>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff5500]">LensRent · Workspace</p>
                <h1 className="mt-1.5 text-2xl font-extrabold sm:text-3xl">{isOrders ? 'Đơn thuê của tôi' : `Chào mừng trở lại, ${(dashboard?.fullName || auth.user?.fullName || 'bạn').split(' ')[0]}!`}</h1>
                <p className="mt-1.5 text-sm text-gray-500">{isOrders ? 'Theo dõi trạng thái, lịch thuê và chi phí các đơn của bạn.' : 'Quản lý thiết bị đang thuê và theo dõi các đơn gần đây.'}</p>
              </div>
              <Link className="rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600" to="/categories">+ Thuê thêm thiết bị</Link>
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {loading ? <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">Đang tải tổng quan...</div> : (
              <>
                {!isOrders && <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric icon="▣" label="Thiết bị đang thuê" value={dashboard?.rentingDevices || 0} note="Đơn đã được xác nhận" />
                  <Metric icon="◷" label="Sắp tới hạn trả" value={dashboard?.pendingReturns || 0} note="Theo dõi để trả đúng lịch" tone="purple" />
                  <Metric icon="◇" label="Tổng tiền cọc" value={money(dashboard?.totalDeposit)} note="Cọc đang giữ ở các đơn mở" tone="blue" />
                  <Metric icon="✦" label="Điểm tín nhiệm" value={dashboard?.trustScore ?? 980} note="Hạng bạc · lịch sử thuê tốt" tone="green" />
                </div>}

                {!isOrders && <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div><h2 className="text-base font-bold">Thiết bị đang thuê</h2><p className="mt-1 text-sm text-gray-500">Các đơn đã được chủ thiết bị xác nhận sẽ hiển thị ở đây.</p></div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#ed4b0a]">{currentRentalItems.length} thiết bị</span>
                  </div>
                  {currentRentalItems.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{currentRentalItems.map((item) => <article className="flex min-w-0 gap-3 rounded-xl border border-gray-100 p-3" key={`${item.rentalId}-${item.productId}`}>
                    <Link className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1.5" to={`/products/${item.productId}`}><img alt={item.name} className="max-h-full max-w-full object-contain" src={resolveProductImage(item.imageKey)} /></Link>
                    <div className="min-w-0 flex-1"><Link className="line-clamp-2 text-sm font-bold text-gray-800 hover:text-[#ff5500]" to={`/products/${item.productId}`}>{item.name}</Link><p className="mt-1 text-xs text-gray-500">Số lượng: {item.quantity} · {dateLabel(item.startDate)} – {dateLabel(item.endDate)}</p><Link className="mt-1 inline-block text-xs font-semibold text-[#ff5500] hover:underline" to={`/renter/orders/${item.rentalId}`}>Đơn #{item.rentalCode}</Link></div>
                  </article>)}</div> : <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">Chưa có thiết bị được xác nhận cho thuê. Đơn mới thanh toán sẽ xuất hiện sau khi chủ thiết bị xác nhận.</p>}
                </section>}

                {isOrders ? (
                  rentals.length ? <div className="space-y-3">{rentals.map((rental) => <RentalRow key={rental.rentalId} rental={rental} />)}</div> : <EmptyOrders />
                ) : (
                  <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
                    <div className="space-y-4">
                      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h2 className="text-base font-bold">Đơn thuê gần đây</h2>
                          <Link className="text-xs font-semibold text-[#ff5500] hover:underline" to="/renter/orders">Xem tất cả →</Link>
                        </div>
                        {recent.length ? <div className="space-y-3">{recent.map((rental) => <RentalRow key={rental.rentalId} rental={rental} />)}</div> : <EmptyOrders />}
                      </section>
                      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
                          <h2 className="text-base font-bold">Lịch sử thuê thiết bị gần đây</h2>
                          <Link className="text-xs font-semibold text-gray-500 hover:text-[#ff5500]" to="/renter/orders">Xem toàn bộ</Link>
                        </div>
                        {rentals.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
                          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-3">Mã đơn</th><th className="px-4 py-3">Thiết bị</th><th className="px-4 py-3">Ngày đặt</th><th className="px-4 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Chi phí</th></tr></thead>
                          <tbody className="divide-y divide-gray-100">{rentals.slice(0, 6).map((rental) => <tr className="hover:bg-gray-50/70" key={rental.rentalId}><td className="px-5 py-3.5 font-semibold text-gray-700">#{rental.rentalCode}</td><td className="px-4 py-3.5 font-medium text-gray-800">{rental.firstProductName || `${rental.itemCount} thiết bị`}</td><td className="px-4 py-3.5 text-gray-500">{dateLabel(rental.createdAt)}</td><td className="px-4 py-3.5"><span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{rentalStatus(rental.status)}</span></td><td className="px-5 py-3.5 text-right font-bold text-gray-800">{money(rental.totalAmount)}</td></tr>)}</tbody>
                        </table></div> : <p className="px-5 py-8 text-center text-sm text-gray-500">Lịch sử đơn thuê sẽ hiển thị tại đây.</p>}
                      </section>
                    </div>

                    <div className="space-y-4">
                      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between"><h2 className="text-base font-bold">Trạng thái hoàn cọc</h2><span className="text-gray-400" aria-hidden="true">ⓘ</span></div>
                        <p className="mt-1 text-xs text-gray-500">Theo dõi tiền cọc trong các đơn thuê của bạn.</p>
                        <div className="mt-5 space-y-4">
                          {recent.filter((rental) => Number(rental.depositAmount) > 0).slice(0, 2).map((rental, index) => <div key={rental.rentalId}>
                            <div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate font-semibold">{rental.firstProductName || rental.rentalCode}</span><span className="shrink-0 font-bold">{['COMPLETED', 'CANCELLED', 'CANCELED'].includes(String(rental.status).toUpperCase()) ? '100%' : '85%'}</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${index ? 'bg-emerald-500' : 'bg-[#ff5500]'}`} style={{ width: ['COMPLETED', 'CANCELLED', 'CANCELED'].includes(String(rental.status).toUpperCase()) ? '100%' : '85%' }} /></div>
                            <p className="mt-1 text-[11px] text-gray-400">{rentalStatus(rental.status)} · cọc {money(rental.depositAmount)}</p>
                          </div>)}
                          {!recent.some((rental) => Number(rental.depositAmount) > 0) && <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">Trạng thái cọc sẽ cập nhật sau khi bạn có đơn thuê.</p>}
                        </div>
                        <Link className="mt-4 block border-t border-gray-100 pt-3 text-center text-xs font-semibold text-gray-500 hover:text-[#ff5500]" to="/renter/orders">Xem chi tiết đơn thuê</Link>
                      </section>
                      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between"><h2 className="text-base font-bold">Thông báo mới</h2><span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">{recent.length}</span></div>
                        {recent.length ? <div className="mt-3 divide-y divide-gray-100">{recent.slice(0, 3).map((rental) => <Link className="flex gap-3 py-3 first:pt-1 last:pb-0" key={rental.rentalId} to={`/renter/orders/${rental.rentalId}`}><span className="mt-0.5 text-[#ff5500]" aria-hidden="true">●</span><span className="min-w-0"><span className="block text-sm font-semibold text-gray-800">Đơn {rental.rentalCode}: {rentalStatus(rental.status)}</span><span className="mt-1 block text-xs leading-5 text-gray-500">{rental.firstProductName || `${rental.itemCount} thiết bị`} · {dateLabel(rental.createdAt)}</span></span></Link>)}</div> : <p className="py-7 text-center text-sm text-gray-500">Chưa có thông báo mới.</p>}
                      </section>
                      <Link className="block rounded-xl bg-[#ff5500] p-5 text-white transition hover:bg-orange-600" to="/categories"><p className="text-lg font-extrabold">Bảo hiểm thiết bị chuyên nghiệp</p><p className="mt-1 text-sm text-orange-50">Thêm an tâm cho chuyến thuê kế tiếp với chính sách bảo vệ thiết bị.</p><span className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#ed4b0a]">Tìm hiểu thêm →</span></Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
