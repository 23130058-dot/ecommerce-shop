import { useEffect, useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import DataTable from '../components/shared/DataTable.jsx'
import { getMarketplaceReports, getRentalDisputes, resolveMarketplaceReport, resolveRentalDispute } from '../services/adminApi.js'
import { showToast } from '../services/toast.js'

const statusText = { OPEN: 'Mới', UNDER_REVIEW: 'Đang xem xét', RESOLVED: 'Đã xử lý', REJECTED: 'Từ chối', APPROVED: 'Chấp thuận' }
const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`
const date = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—'

function ProcessDialog({ tab, item, onClose, onSaved }) {
  const dispute = tab === 'disputes'
  const [status, setStatus] = useState(dispute ? 'UNDER_REVIEW' : 'UNDER_REVIEW')
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('0')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setStatus('UNDER_REVIEW')
    setNote('')
    setAmount('0')
    setError('')
    setBusy(false)
  }, [tab, item?.id])
  if (!item) return null
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (dispute) await resolveRentalDispute(item.id, { status, resolutionNote: note.trim() || (status === 'APPROVED' ? 'Admin đã xác nhận khoản khấu trừ tiền cọc.' : status === 'REJECTED' ? 'Admin từ chối yêu cầu khấu trừ; hoàn lại tiền cọc.' : 'Đang kiểm tra khiếu nại.'), resolvedAmount: Number(amount || 0) })
      else await resolveMarketplaceReport(item.id, { status, resolutionNote: note.trim() || (status === 'RESOLVED' ? 'Đã xử lý báo cáo.' : status === 'REJECTED' ? 'Báo cáo không đủ căn cứ.' : 'Đang xác minh nội dung báo cáo.') })
      showToast('Đã cập nhật kết quả xử lý.', 'success'); onSaved()
    } catch (requestError) { setError(requestError.message); showToast(requestError.message, 'error') }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">{dispute ? 'Khiếu nại tiền cọc' : 'Báo cáo gian hàng / khách hàng'}</p><h2 className="mt-1 text-xl font-extrabold">Xử lý #{item.id}</h2></div><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm">Đóng</button></div>
      {dispute ? <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm"><p><b>Đơn:</b> {item.rentalCode} · {item.productName}</p><p><b>Người thuê:</b> {item.renterName} · <b>Owner:</b> {item.ownerName}</p><p><b>Báo cáo Owner:</b> {item.damageDescription || '—'}</p><p><b>Mức thiệt hại dự kiến:</b> {money(item.estimatedAmount)} · <b>Tiền cọc:</b> {money(item.depositAmount)}</p><p><b>Ý kiến người thuê:</b> {item.reason}</p></div> : <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm"><p><b>Loại:</b> {item.targetType} · <b>Đối tượng:</b> {item.targetName}</p>{item.productName && <p><b>Sản phẩm:</b> {item.productName}</p>}<p><b>Người gửi:</b> {item.reporterName} · {item.category}</p><p><b>Nội dung:</b> {item.description}</p></div>}
      <label className="mt-4 block text-sm font-semibold">Kết quả<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 font-normal">{dispute ? <><option value="UNDER_REVIEW">Đang xem xét</option><option value="APPROVED">Chấp thuận khấu trừ</option><option value="REJECTED">Từ chối, hoàn cọc</option></> : <><option value="UNDER_REVIEW">Đang xem xét</option><option value="RESOLVED">Đã xử lý</option><option value="REJECTED">Từ chối</option></>}</select></label>
      {dispute && status === 'APPROVED' && <label className="mt-3 block text-sm font-semibold">Số tiền khấu trừ (tối đa {money(Math.min(Number(item.estimatedAmount || 0), Number(item.depositAmount || 0)))})<input type="number" min="0" max={Math.min(Number(item.estimatedAmount || 0), Number(item.depositAmount || 0))} step="1000" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 px-3 font-normal" /></label>}
      <label className="mt-3 block text-sm font-semibold">Ghi chú xử lý<textarea required maxLength={2000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 p-3 font-normal" placeholder="Nêu kết quả xử lý để gửi thông báo cho các bên…" /></label>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm">Hủy</button><button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu kết quả'}</button></div>
    </form>
  </div>
}

export default function AdminMarketplacePage() {
  const [tab, setTab] = useState('reports')
  const [filter, setFilter] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true; setLoading(true); setError('')
    const load = tab === 'reports' ? getMarketplaceReports(filter) : getRentalDisputes(filter)
    load.then((data) => { if (active) setRows(Array.isArray(data) ? data : []) }).catch((e) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tab, filter, revision])
  const actionColumn = { key: 'action', header: 'Thao tác', sortable: false, className: 'text-right', cellClassName: 'text-right', render: (row) => {
    const closed = ['RESOLVED', 'REJECTED', 'APPROVED'].includes(String(row.status || '').toUpperCase())
    return <button type="button" disabled={closed} onClick={() => setSelected(row)} className="whitespace-nowrap rounded-lg border border-orange-200 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white">{closed ? 'Đã đóng' : 'Xử lý'}</button>
  } }
  const columns = tab === 'reports' ? [
    { key: 'id', header: 'Mã', className: 'whitespace-nowrap' },
    { key: 'targetType', header: 'Loại', className: 'whitespace-nowrap' },
    { key: 'targetName', header: 'Đối tượng', render: (row) => <span className="font-semibold">{row.targetName}{row.productName ? <small className="block font-normal text-gray-500">{row.productName}</small> : null}</span> },
    { key: 'category', header: 'Nhóm', className: 'whitespace-nowrap' },
    { key: 'reporterName', header: 'Người gửi' },
    { key: 'status', header: 'Trạng thái', render: (row) => <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">{statusText[row.status] || row.status}</span> },
    { key: 'createdAt', header: 'Ngày gửi', render: (row) => date(row.createdAt) }, actionColumn,
  ] : [
    { key: 'rentalCode', header: 'Đơn thuê', className: 'whitespace-nowrap' },
    { key: 'productName', header: 'Thiết bị' },
    { key: 'renterName', header: 'Người thuê' },
    { key: 'estimatedAmount', header: 'Thiệt hại', render: (row) => money(row.estimatedAmount) },
    { key: 'depositAmount', header: 'Tiền cọc', render: (row) => money(row.depositAmount) },
    { key: 'status', header: 'Trạng thái', render: (row) => <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">{statusText[row.status] || row.status}</span> },
    { key: 'createdAt', header: 'Ngày gửi', render: (row) => date(row.createdAt) }, actionColumn,
  ]
  return <AdminLayout><div className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600">An toàn marketplace</p><h1 className="mt-1 text-2xl font-extrabold">Báo cáo & tranh chấp</h1><p className="mt-1 text-sm text-gray-500">Xử lý báo cáo gian hàng, khách hàng và phân xử tiền cọc sau khi trả thiết bị.</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"><div className="flex gap-2"><button onClick={() => { setTab('reports'); setFilter('all') }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'reports' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}>Báo cáo</button><button onClick={() => { setTab('disputes'); setFilter('all') }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'disputes' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}>Tranh chấp tiền cọc</button></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="all">Tất cả trạng thái</option><option value="OPEN">Mới</option><option value="UNDER_REVIEW">Đang xem xét</option>{tab === 'reports' ? <><option value="RESOLVED">Đã xử lý</option><option value="REJECTED">Từ chối</option></> : <><option value="APPROVED">Đã chấp thuận</option><option value="REJECTED">Đã từ chối</option></>}</select></div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} loading={loading} error={error} searchable searchPlaceholder={tab === 'reports' ? 'Tìm đối tượng, người gửi…' : 'Tìm mã đơn, thiết bị, người thuê…'} emptyMessage={tab === 'reports' ? 'Chưa có báo cáo phù hợp.' : 'Chưa có khiếu nại tiền cọc.'} pageSize={10} />
  </div><ProcessDialog tab={tab} item={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setRevision((value) => value + 1) }} /></AdminLayout>
}
