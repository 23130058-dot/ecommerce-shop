import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveProductImage } from '../home/productImageMap.js'
import DataTable from '../shared/DataTable.jsx'
import { getOwnerDashboard, getOwnerRevenue } from '../../services/ownerApi.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`
const date = (value) => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—'
const dateTime = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'

function StatCard({ title, value, note, tone = 'orange' }) {
  const accent = tone === 'green' ? 'text-emerald-600 bg-emerald-50' : tone === 'blue' ? 'text-blue-600 bg-blue-50' : tone === 'violet' ? 'text-violet-600 bg-violet-50' : 'text-[#f45116] bg-orange-50'
  return <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] sm:p-5">
    <p className="text-xs font-semibold text-gray-500">{title}</p>
    <p className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">{value}</p>
    <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${accent}`}>{note}</p>
  </article>
}

function SectionHeading({ title, description, to, linkLabel = 'Xem tất cả' }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <div><h2 className="text-base font-bold text-gray-900">{title}</h2><p className="mt-1 text-xs text-gray-500">{description}</p></div>
    {to && <Link className="text-xs font-semibold text-[#f45116] hover:underline" to={to}>{linkLabel} →</Link>}
  </div>
}

export default function OwnerDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [revenueReport, setRevenueReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [error, setError] = useState('')
  const [revenueError, setRevenueError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const today = new Date()
    const fromDate = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    const formatDate = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`

    getOwnerDashboard({ signal: controller.signal })
      .then(setDashboard)
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    getOwnerRevenue({ from: formatDate(fromDate), to: formatDate(today), signal: controller.signal })
      .then(setRevenueReport)
      .catch((requestError) => { if (requestError.name !== 'AbortError') setRevenueError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setRevenueLoading(false) })

    return () => controller.abort()
  }, [])

  const chart = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1)
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      const amount = (revenueReport?.dailyRevenue || []).filter((item) => item.date?.startsWith(key)).reduce((sum, item) => sum + Number(item.amount || 0), 0)
      return { key, label: `Th ${month.getMonth() + 1}`, amount }
    })
  }, [revenueReport])
  const maxRevenue = Math.max(...chart.map((item) => item.amount), 1)
  const fullName = dashboard?.fullName || 'Chủ thiết bị'
  const greetingName = fullName.trim().split(/\s+/).at(-1) || fullName

  const bookingColumns = [
    { key: 'rentalCode', header: 'Mã đơn', className: 'whitespace-nowrap', render: (item) => <><span className="font-bold text-gray-800">{item.rentalCode || `#${item.rentalId}`}</span><span className="mt-1 block text-[10px] text-gray-400">{dateTime(item.createdAt)}</span></> },
    { key: 'renterName', header: 'Khách thuê', render: (item) => <span className="font-semibold text-gray-700">{item.renterName}</span> },
    { key: 'productNames', header: 'Thiết bị', className: 'min-w-[180px]', render: (item) => <span className="line-clamp-2">{item.productNames}</span> },
    { key: 'dates', header: 'Thời gian', searchable: false, sortValue: (item) => item.startDate || '', className: 'whitespace-nowrap', render: (item) => <span>{date(item.startDate)} – {date(item.endDate)}</span> },
    { key: 'rentalAmount', header: 'Tiền thuê', className: 'whitespace-nowrap', render: (item) => <span className="font-bold text-gray-800">{money(item.rentalAmount)}</span> },
    { key: 'status', header: 'Trạng thái', render: (item) => <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.status === 'PENDING' ? 'bg-orange-50 text-orange-700' : item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{item.status === 'PENDING' ? 'Chờ xác nhận' : item.status === 'COMPLETED' ? 'Hoàn tất' : 'Đang thuê'}</span> },
  ]
  const productColumns = [
    { key: 'name', header: 'Thiết bị', render: (item) => <Link className="flex min-w-[180px] items-center gap-3 font-semibold text-gray-800 hover:text-[#f45116]" to={`/owner/product/${item.productId}`}><span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1"><img className="max-h-full max-w-full object-contain" src={resolveProductImage(item.imageKey)} alt="" /></span><span className="line-clamp-2">{item.name}</span></Link> },
    { key: 'dailyPrice', header: 'Giá thuê / ngày', className: 'whitespace-nowrap', render: (item) => money(item.dailyPrice) },
    { key: 'availableQuantity', header: 'Còn', className: 'text-center', render: (item) => item.availableQuantity },
    { key: 'currentlyRentedQuantity', header: 'Đã đặt', className: 'text-center', render: (item) => item.currentlyRentedQuantity },
    { key: 'status', header: 'Trạng thái', render: (item) => item.status === 'ACTIVE' ? <span className="font-semibold text-emerald-700">Đang hiển thị</span> : <span className="font-semibold text-gray-500">Tạm ẩn</span> },
  ]
  const transactionColumns = [
    { key: 'title', header: 'Giao dịch', render: (item) => <><span className="font-semibold text-gray-800">{item.title}</span><span className="mt-1 block text-[10px] text-gray-400">{item.subtitle || ''}</span></> },
    { key: 'type', header: 'Loại', render: (item) => item.type === 'WITHDRAWAL' ? 'Rút tiền' : 'Tiền thuê' },
    { key: 'createdAt', header: 'Thời gian', className: 'whitespace-nowrap', render: (item) => dateTime(item.createdAt) },
    { key: 'amount', header: 'Số tiền', className: 'whitespace-nowrap', render: (item) => <span className={`font-bold ${Number(item.amount) >= 0 ? 'text-emerald-600' : 'text-gray-700'}`}>{money(item.amount)}</span> },
  ]

  return <main className="space-y-5 px-1 py-2 sm:px-2">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#f45116]">LensRent · Owner</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">Chào mừng trở lại, {greetingName}!</h1><p className="mt-1 text-sm text-gray-500">Tình hình cho thuê và hoạt động thiết bị của bạn.</p></div>
      <div className="flex gap-2"><Link to="/owner/notifications" className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:border-orange-200 hover:text-[#f45116]">Thông báo</Link><Link to="/owner/equipment/add" className="rounded-lg bg-[#f45116] px-3.5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">+ Thêm thiết bị</Link></div>
    </div>

    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="DOANH THU THÁNG NÀY" value={loading ? 'Đang tải…' : money(dashboard?.revenueThisMonth)} note="Đơn đã thanh toán" />
      <StatCard title="THIẾT BỊ ĐÃ ĐĂNG" value={loading ? '…' : dashboard?.totalProducts ?? 0} note="Sản phẩm của bạn" tone="blue" />
      <StatCard title="ĐANG CHO THUÊ" value={loading ? '…' : dashboard?.activeRentals ?? 0} note="Đơn đang xử lý" tone="green" />
      <StatCard title="CHỜ XÁC NHẬN" value={loading ? '…' : dashboard?.pendingRequests ?? 0} note="Đã thanh toán" tone="violet" />
      <StatCard title="ĐƠN HOÀN TẤT · ĐÁNH GIÁ" value={loading ? '…' : `${dashboard?.completedRentals ?? 0} · ${Number(dashboard?.averageRating || 0) > 0 ? `${Number(dashboard.averageRating).toFixed(1)}/5` : '—'}`} note="Đơn hoàn tất · điểm trung bình" />
    </div>

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-4"><h2 className="text-base font-bold text-gray-900">Doanh thu 6 tháng gần nhất</h2><p className="mt-1 text-xs text-gray-500">{revenueError || 'Tổng tiền thuê được phân bổ theo sản phẩm của bạn.'}</p></div>
        {revenueLoading && !revenueReport ? <p className="py-12 text-center text-sm text-gray-500">Đang tải doanh thu…</p> : <div className="flex h-56 items-end gap-2 border-b border-gray-100 px-1 sm:gap-4 sm:px-3">
          {chart.map((item) => <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="flex flex-1 items-end justify-center"><div title={money(item.amount)} className="w-full max-w-12 rounded-t-md bg-[#f45116]/85 transition-all" style={{ height: `${item.amount ? Math.max(5, item.amount / maxRevenue * 100) : 0}%` }} /></div><span className="py-3 text-center text-[10px] text-gray-400 sm:text-xs">{item.label}</span></div>)}
        </div>}
        <div className="mt-3 flex justify-between text-xs text-gray-500"><span>Tổng trong kỳ</span><strong className="text-gray-800">{money(revenueReport?.totalRevenue)}</strong></div>
      </section>
      <section>
        <SectionHeading title="Yêu cầu thuê mới" description="Đơn chờ bạn xác nhận" to="/owner/bookings" />
        <DataTable columns={bookingColumns.slice(0, 5)} rows={dashboard?.recentBookings || []} rowKey={(item) => item.rentalId} loading={loading} emptyMessage="Không có yêu cầu thuê mới." pageSize={5} pagination={false} />
      </section>
    </div>

    <section>
      <SectionHeading title="Thiết bị của bạn" description="Tình trạng sản phẩm đang đăng cho thuê" to="/owner/equipment" />
      <DataTable columns={productColumns} rows={dashboard?.recentProducts || []} rowKey={(item) => item.productId} loading={loading} emptyMessage="Bạn chưa đăng thiết bị nào." pageSize={5} pagination={false} />
    </section>

    <section>
      <SectionHeading title="Giao dịch gần đây" description="Thu nhập từ đơn thuê và yêu cầu rút tiền" to="/owner/transactions" />
      <DataTable columns={transactionColumns} rows={dashboard?.recentTransactions || []} rowKey={(item) => `${item.type}-${item.id}`} loading={loading} emptyMessage="Chưa có giao dịch." pageSize={5} pagination={false} />
    </section>
  </main>
}
