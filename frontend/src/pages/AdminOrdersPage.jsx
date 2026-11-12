import { useEffect, useState } from 'react'
import DataTable from '../components/shared/DataTable.jsx'
import AdminLayout, { AdminIcon } from '../components/admin/AdminLayout.jsx'
import ConfirmDialog from '../components/layout/ConfirmDialog.jsx'
import { showToast } from '../services/toast.js'
import { createAdminOrder, deleteAdminOrder, getAdminOrder, getAdminOrders, getAdminProducts, getAdminUsers, updateAdminOrder } from '../services/adminApi.js'

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

function RentalFormModal({ order, renters, products, busy, error, onClose, onSave }) {
  const tomorrow = (offset) => { const value = new Date(); value.setDate(value.getDate() + offset); return value.toISOString().slice(0, 10) }
  const [form, setForm] = useState(() => ({
    renterId: renters[0]?.id || '', productId: products[0]?.id || '', quantity: 1,
    startDate: tomorrow(1), endDate: tomorrow(2), deliveryMethod: order?.deliveryMethod || 'STORE',
    deliveryAddress: order?.deliveryAddress || '', district: order?.district || '', city: order?.city || '',
    contactName: order?.contactName || '', contactPhone: order?.contactPhone || '', contactEmail: order?.contactEmail || '',
  }))
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/40 p-4" role="presentation"><form role="dialog" aria-modal="true" onSubmit={(event) => { event.preventDefault(); onSave(order ? form : { ...form, renterId: Number(form.renterId), productId: Number(form.productId), quantity: Number(form.quantity) }) }} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-gray-900">{order ? `Sửa thông tin đơn ${order.rentalCode}` : 'Thêm đơn thuê'}</h2><p className="mt-1 text-xs text-gray-500">{order ? 'Chỉ sửa giao nhận của đơn đang chờ.' : 'Đơn tạo thủ công bắt đầu ở trạng thái chờ và chưa thanh toán.'}</p></div><button type="button" onClick={onClose} className="rounded p-1 text-xl text-gray-400">×</button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{!order && <><label className="text-xs font-semibold text-gray-600 sm:col-span-2">Người thuê<select required value={form.renterId} onChange={(e) => setForm({ ...form, renterId: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="">Chọn người thuê</option>{renters.map((renter) => <option key={renter.id} value={renter.id}>{renter.fullName} · {renter.email}</option>)}</select></label><label className="text-xs font-semibold text-gray-600 sm:col-span-2">Sản phẩm<select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="">Chọn sản phẩm</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · kho {product.stock} · {money(product.dailyPrice)}/ngày</option>)}</select></label><label className="text-xs font-semibold text-gray-600">Số lượng<input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600">Nhận thiết bị<select value={form.deliveryMethod} onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })} className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-normal"><option value="STORE">Nhận tại cửa hàng</option><option value="HOME">Giao tận nơi</option></select></label><label className="text-xs font-semibold text-gray-600">Ngày bắt đầu<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600">Ngày kết thúc<input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label></>}
      <label className="text-xs font-semibold text-gray-600">Tên liên hệ<input required maxLength={160} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600">Số điện thoại<input required maxLength={40} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600">Email liên hệ<input type="email" maxLength={254} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600">Quận/huyện<input maxLength={120} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600">Tỉnh/thành phố<input maxLength={120} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600 sm:col-span-2">Địa chỉ giao hàng<textarea rows={2} maxLength={500} value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} className="mt-1.5 w-full rounded-lg border p-3 text-sm font-normal" /></label>
    </div>{error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 text-xs font-semibold text-gray-600">Hủy</button><button disabled={busy || (!order && (!renters.length || !products.length))} className="rounded-lg bg-[#f45116] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : order ? 'Lưu thay đổi' : 'Tạo đơn'}</button></div></form></div>
}

function OrderDetailModal({ order, loading, error, busy, onClose, onEdit, onDelete }) {
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
        {order.status?.toUpperCase() === 'PENDING' && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800">Xóa đơn chờ sẽ trả số lượng về kho và giữ bản ghi trong lịch sử với trạng thái Đã hủy.</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Đóng</button>{order.status?.toUpperCase() === 'PENDING' && <><button type="button" disabled={busy} onClick={onEdit} className="rounded-lg border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-700">Sửa thông tin</button><button type="button" disabled={busy} onClick={onDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">Xóa đơn</button></>}</div>
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [renters, setRenters] = useState([])
  const [products, setProducts] = useState([])
  const [editor, setEditor] = useState(undefined)
  const [editorBusy, setEditorBusy] = useState(false)
  const [editorError, setEditorError] = useState('')
  const size = 10

  useEffect(() => {
    getAdminUsers({ role: 'user', status: 'ACTIVE', page: 0, size: 100 }).then((result) => setRenters(result?.users || [])).catch(() => setRenters([]))
    getAdminProducts({ status: 'ACTIVE', page: 0, size: 100 }).then((result) => setProducts(result?.items || [])).catch(() => setProducts([]))
  }, [])

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
    if (!detail) return
    setBusy(true)
    try {
      await deleteAdminOrder(detail.id)
      setShowCancelConfirm(false)
      showToast('Đơn đã được hủy và giữ lại trong lịch sử.', 'success')
      setRefresh((value) => value + 1)
      await openOrder(detail.id)
    } catch (requestError) {
      showToast(requestError.message, 'error')
    } finally { setBusy(false) }
  }

  const saveOrder = async (form) => {
    setEditorBusy(true); setEditorError('')
    try {
      if (editor?.id) await updateAdminOrder(editor.id, {
        deliveryMethod: form.deliveryMethod, deliveryAddress: form.deliveryAddress,
        district: form.district, city: form.city, contactName: form.contactName,
        contactPhone: form.contactPhone, contactEmail: form.contactEmail,
      })
      else await createAdminOrder(form)
      setEditor(undefined)
      setRefresh((value) => value + 1)
      if (detail?.id && editor?.id === detail.id) await openOrder(detail.id)
    } catch (requestError) { setEditorError(requestError.message) }
    finally { setEditorBusy(false) }
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
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[22px] font-bold tracking-tight text-gray-800 sm:text-2xl">Quản lý đơn thuê</h1><p className="mt-1 text-xs leading-5 text-gray-500">Theo dõi đơn hàng, người thuê, thanh toán và trạng thái xử lý.</p></div><div className="flex items-center gap-2"><div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500"><AdminIcon name="calendar" className="mr-2 inline size-4" />{data.totalElements || 0} đơn thuê</div><button type="button" onClick={() => { setEditor(null); setEditorError('') }} className="rounded-lg bg-[#f45116] px-3.5 py-2.5 text-xs font-semibold text-white">+ Thêm đơn thuê</button></div></div>
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-400 focus-within:border-orange-400 sm:max-w-[390px]"><AdminIcon name="search" className="size-4 shrink-0" /><input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Tìm mã đơn, tên/email, sản phẩm…" aria-label="Tìm đơn thuê" className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400" /></label><label className="flex items-center gap-2 text-xs text-gray-500">Trạng thái<select value={status} onChange={(event) => changeFilter(setStatus, event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-orange-400"><option value="all">Tất cả</option><option value="PENDING">Chờ xác nhận</option><option value="CONFIRMED">Đã xác nhận</option><option value="ACTIVE">Đang thuê</option><option value="COMPLETED">Hoàn tất</option><option value="CANCELLED">Đã hủy</option></select></label></div>
    <DataTable columns={columns} rows={data.items || []} rowKey={(order) => order.id} loading={loading} error={error} emptyMessage="Không tìm thấy đơn thuê." page={page} pageCount={Math.max(data.totalPages || 0, 1)} totalElements={data.totalElements || 0} size={size} onPageChange={setPage} />
    <p className="mt-4 text-center text-[11px] text-gray-400">Đơn đã xử lý hoặc thanh toán được giữ để bảo toàn lịch sử. Đơn chờ có thể sửa giao nhận hoặc xóa mềm.</p>
  </main><OrderDetailModal order={detail} loading={detailLoading} error={detailError} busy={busy} onClose={() => { setDetail(null); setDetailError('') }} onEdit={() => { const current = detail; setDetail(null); setEditor(current); setEditorError('') }} onDelete={() => setShowCancelConfirm(true)} /><ConfirmDialog open={showCancelConfirm} title="Xóa đơn thuê?" message={"Đơn " + (detail?.rentalCode || "#" + detail?.id) + " sẽ được đánh dấu Đã hủy, số lượng trả về kho và bản ghi vẫn nằm trong lịch sử."} confirmLabel="Xóa đơn" tone="danger" busy={busy} onCancel={() => setShowCancelConfirm(false)} onConfirm={cancelOrder} />{editor !== undefined && <RentalFormModal key={editor?.id || 'create'} order={editor} renters={renters} products={products} busy={editorBusy} error={editorError} onClose={() => setEditor(undefined)} onSave={saveOrder} />}</AdminLayout>
}
