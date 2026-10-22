import { useEffect, useState } from 'react'
import DataTable from '../components/shared/DataTable.jsx'
import AdminLayout, { AdminIcon } from '../components/admin/AdminLayout.jsx'
import { cancelAdminOrder, getAdminOrder, getAdminOrders } from '../services/adminApi.js'

const money = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')}đ`
const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—'
const statusNames = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', ACTIVE: 'Đang thuê', IN_PROGRESS: 'Đang thuê', RENTING: 'Đang thuê', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy', CANCELED: 'Đã hủy', REJECTED: 'Từ chối' }

function StatusBadge({ status }) {
  const normalized = status?.toUpperCase() || 'UNKNOWN'
  const tone = normalized === 'PENDING' ? 'bg-amber-50 text-amber-700' : ['CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(normalized) ? 'bg-blue-50 text-blue-700' : normalized === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}>{statusNames[normalized] || normalized}</span>
}

function PaymentBadge({ status }) {
  const paid = ['PAID', 'SUCCESS', 'COMPLETED', 'REFUNDED'].includes(status?.toUpperCase())
  const label = status?.toUpperCase() === 'REFUNDED' ? 'Đã hoàn tiền mô phỏng' : paid ? 'Đã thanh toán' : status?.toUpperCase() === 'UNPAID' ? 'Chưa thanh toán' : status || 'Chưa rõ'
  return <span className={`whitespace-nowrap text-[10px] font-semibold ${status?.toUpperCase() === 'REFUNDED' ? 'text-violet-700' : paid ? 'text-emerald-700' : 'text-amber-700'}`}>{label}</span>
}

function OrderDetailModal({ order, loading, error, busy, onClose, onCancel }) {
  if (!order && !loading && !error) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#f45116]">Chi tiết đơn thuê</p><h2 id="order-detail-title" className="mt-1 text-lg font-bold text-gray-900">{order?.rentalCode || 'Đang tải…'}</h2></div><button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><AdminIcon name="close" /></button></div>
      {error && <div role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
      {loading && <p className="py-12 text-center text-sm text-gray-500">Đang tải chi tiết đơn…</p>}
      {!loading && !order && error && <div className="mt-4 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700">Đóng</button></div>}
      {!loading && order && <>
        <div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={order.status} /><PaymentBadge status={order.paymentStatus} /><span className="text-[11px] text-gray-400">Tạo ngày {formatDate(order.createdAt)}</span></div>
        <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 text-xs sm:grid-cols-2"><div><p className="font-semibold text-gray-800">Người thuê</p><p className="mt-1 text-gray-600">{order.contactName || order.renterName || '—'}</p><p className="mt-1 text-gray-500">{order.renterEmail || order.contactEmail || '—'}</p><p className="mt-1 text-gray-500">{order.contactPhone || '—'}</p></div><div><p className="font-semibold text-gray-800">Giao nhận</p><p className="mt-1 text-gray-600">{order.deliveryMethod || '—'}</p><p className="mt-1 text-gray-500">{[order.deliveryAddress, order.district, order.city].filter(Boolean).join(', ') || 'Không có địa chỉ giao hàng'}</p><p className="mt-1 text-gray-500">Thanh toán: {order.paymentMethod || '—'}</p></div></div>
        <div className="mt-4"><DataTable columns={[
          { key: 'productName', header: 'Thiết bị', render: (item) => <><span className="font-medium text-gray-800">{item.productName}</span><span className="mt-1 block text-[10px] text-gray-400">{item.status}</span></> },
          { key: 'ownerName', header: 'Chủ thiết bị', render: (item) => item.ownerName || '—' },
          { key: 'startDate', header: 'Thời gian thuê', className: 'whitespace-nowrap', render: (item) => `${formatDate(item.startDate)} – ${formatDate(item.endDate)}` },
          { key: 'quantity', header: 'SL' },
          { key: 'subtotal', header: 'Thành tiền', className: 'whitespace-nowrap', render: (item) => <span className="font-semibold text-gray-800">{money(item.subtotal)}</span> },
        ]} rows={order.items || []} rowKey={(item) => item.id || `${item.productId}-${item.startDate}-${item.endDate}`} emptyMessage="Đơn không có sản phẩm." pagination={false} /></div>
        <div className="mt-4 ml-auto max-w-xs space-y-2 text-xs"><div className="flex justify-between text-gray-500"><span>Tiền thuê</span><span>{money(order.rentalAmount)}</span></div><div className="flex justify-between text-gray-500"><span>Tiền cọc</span><span>{money(order.depositAmount)}</span></div><div className="flex justify-between text-gray-500"><span>Phí dịch vụ</span><span>{money(order.serviceFee)}</span></div><div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900"><span>Tổng cộng</span><span className="text-[#f45116]">{money(order.totalAmount)}</span></div></div>
        {order.status?.toUpperCase() === 'PENDING' && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800">Hủy đơn đang chờ sẽ hoàn số lượng về kho. Nếu đã thanh toán mô phỏng, trạng thái sẽ chuyển sang hoàn tiền mô phỏng.</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Đóng</button>{order.status?.toUpperCase() === 'PENDING' && <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{busy ? 'Đang hủy…' : 'Hủy đơn chờ'}</button>}</div>
      </>}
    </section>
  </div>
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const size = 10

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      getAdminOrders({ search: query, status, page, size })
        .then((result) => {
          if (current) { setData(result || { items: [], totalElements: 0, totalPages: 0 }); setError('') }
        })
        .catch((requestError) => current && setError(requestError.message))
        .finally(() => current && setLoading(false))
    }, 0)
    return () => { current = false; window.clearTimeout(timer) }
  }, [query, status, page, refresh])

  const changeFilter = (setter, value) => { setter(value); setPage(0) }

  const openOrder = async (id) => {
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    try { setDetail(await getAdminOrder(id)) }
    catch (requestError) { setDetailError(requestError.message) }
    finally { setDetailLoading(false) }
  }

  const cancelOrder = async () => {
    if (!detail || !window.confirm(`Bạn muốn hủy đơn ${detail.rentalCode || `#${detail.id}`}? Số lượng sẽ được trả về kho.`)) return
    setBusy(true)
    setDetailError('')
    try {
      await cancelAdminOrder(detail.id)
      setRefresh((value) => value + 1)
      await openOrder(detail.id)
    } catch (requestError) {
      setDetailError(requestError.message)
    } finally { setBusy(false) }
  }

  const columns = [
    { key: 'code', header: 'Mã đơn', className: 'whitespace-nowrap', render: (order) => <><p className="font-bold text-gray-800">{order.rentalCode || `#${order.id}`}</p><p className="mt-1 text-[10px] text-gray-400">{formatDate(order.createdAt)}</p></> },
    { key: 'renter', header: 'Người thuê', className: 'min-w-[170px]', render: (order) => <><p className="font-semibold text-gray-700">{order.renterName || '—'}</p><p className="mt-1 text-[10px] text-gray-400">{order.renterEmail}</p></> },
    { key: 'products', header: 'Thiết bị', className: 'min-w-[200px]', render: (order) => <><p className="line-clamp-2 text-gray-700">{order.productSummary || '—'}</p><p className="mt-1 text-[10px] text-gray-400">{order.itemCount || 0} dòng hàng · {order.deliveryMethod || 'Chưa chọn giao nhận'}</p></> },
    { key: 'amount', header: 'Tổng tiền', className: 'whitespace-nowrap', render: (order) => <span className="font-bold text-gray-800">{money(order.totalAmount)}</span> },
    { key: 'payment', header: 'Thanh toán', render: (order) => <PaymentBadge status={order.paymentStatus} /> },
    { key: 'status', header: 'Trạng thái', render: (order) => <StatusBadge status={order.status} /> },
    { key: 'actions', header: 'Thao tác', sortable: false, className: 'min-w-[112px] whitespace-nowrap text-right', cellClassName: 'whitespace-nowrap text-right', render: (order) => <button type="button" onClick={() => openOrder(order.id)} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"><AdminIcon name="eye" className="size-3.5" />Chi tiết</button> },
  ]

  return <AdminLayout><main className="min-w-0">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[22px] font-bold tracking-tight text-gray-800 sm:text-2xl">Quản lý đơn thuê</h1><p className="mt-1 text-xs leading-5 text-gray-500">Theo dõi đơn hàng, người thuê, thanh toán và trạng thái xử lý.</p></div><div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500"><AdminIcon name="calendar" className="mr-2 inline size-4" />{data.totalElements || 0} đơn thuê</div></div>
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-400 focus-within:border-orange-400 sm:max-w-[390px]"><AdminIcon name="search" className="size-4 shrink-0" /><input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Tìm mã đơn, tên/email, sản phẩm…" aria-label="Tìm đơn thuê" className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400" /></label><label className="flex items-center gap-2 text-xs text-gray-500">Trạng thái<select value={status} onChange={(event) => changeFilter(setStatus, event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-orange-400"><option value="all">Tất cả</option><option value="PENDING">Chờ xác nhận</option><option value="CONFIRMED">Đã xác nhận</option><option value="ACTIVE">Đang thuê</option><option value="COMPLETED">Hoàn tất</option><option value="CANCELLED">Đã hủy</option></select></label></div>
    <DataTable columns={columns} rows={data.items || []} rowKey={(order) => order.id} loading={loading} error={error} emptyMessage="Không tìm thấy đơn thuê." page={page} pageCount={Math.max(data.totalPages || 0, 1)} totalElements={data.totalElements || 0} size={size} onPageChange={setPage} />
    <p className="mt-4 text-center text-[11px] text-gray-400">Admin chỉ hủy được đơn còn chờ xác nhận; các đơn đã được Owner xử lý phải theo quy trình hiện tại.</p>
  </main><OrderDetailModal order={detail} loading={detailLoading} error={detailError} busy={busy} onClose={() => { setDetail(null); setDetailError('') }} onCancel={cancelOrder} /></AdminLayout>
}
