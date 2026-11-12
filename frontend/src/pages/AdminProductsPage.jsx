import { useEffect, useState } from 'react'
import AdminDataTable from '../components/admin/AdminDataTable.jsx'
import AdminLayout, { AdminIcon } from '../components/admin/AdminLayout.jsx'
import { resolveProductImage } from '../components/home/productImageMap.js'
import { createAdminProduct, getAdminProducts, getAdminUsers, reviewAdminProduct, updateAdminProduct, updateAdminProductStatus } from '../services/adminApi.js'

const categories = ['Máy ảnh', 'Ống kính', 'Phụ kiện', 'Thiết bị Studio']
const money = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')}đ`
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—'
const isPending = (status) => ['PENDING', 'PENDING_APPROVAL', 'WAITING_APPROVAL'].includes(String(status || '').toUpperCase())

function ProductForm({ product, owners, busy, error, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ownerId: product?.ownerId || owners[0]?.id || '', name: product?.name || '',
    categoryName: product?.categoryName || categories[0], brandName: product?.brandName || '',
    description: product?.description || '', dailyPrice: product?.dailyPrice ?? '',
    depositAmount: product?.depositAmount ?? 0, stock: product?.stock ?? 1,
    imageKey: product?.imageKey || '', status: product?.status || 'ACTIVE',
  }))
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form role="dialog" aria-modal="true" onSubmit={(event) => { event.preventDefault(); onSave({ ...form, ownerId: Number(form.ownerId), dailyPrice: Number(form.dailyPrice), depositAmount: Number(form.depositAmount), stock: Number(form.stock) }) }} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
    <div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-gray-800">{product ? `Sửa sản phẩm #${product.id}` : 'Thêm sản phẩm'}</h2><p className="mt-1 text-xs text-gray-500">{product ? 'Cập nhật thông tin sản phẩm.' : 'Sản phẩm mới do Admin tạo sẽ được hiển thị ngay.'}</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="rounded p-1 text-xl text-gray-400">×</button></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{!product && <label className="text-xs font-semibold text-gray-600 sm:col-span-2">Owner<select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="">Chọn Owner</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.fullName || owner.email} · {owner.email}</option>)}</select></label>}
      {[
        ['name', 'Tên sản phẩm', 'text'], ['brandName', 'Thương hiệu', 'text'],
        ['dailyPrice', 'Giá thuê/ngày', 'number'], ['depositAmount', 'Tiền đặt cọc', 'number'], ['stock', 'Số lượng kho', 'number'],
      ].map(([key, label, type]) => <label key={key} className="text-xs font-semibold text-gray-600">{label}<input required={key === 'name' || key === 'dailyPrice'} min={type === 'number' ? (key === 'dailyPrice' ? '1' : '0') : undefined} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal" /></label>)}
      <label className="text-xs font-semibold text-gray-600">Danh mục<select value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="text-xs font-semibold text-gray-600 sm:col-span-2">Ảnh (URL hoặc đường dẫn)<input value={form.imageKey} onChange={(e) => setForm({ ...form, imageKey: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal" /></label>
      <label className="text-xs font-semibold text-gray-600 sm:col-span-2">Mô tả<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal" /></label>
    </div>{error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-gray-600">Hủy</button><button disabled={busy || (!product && owners.length === 0)} className="rounded-lg bg-[#f45116] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button></div>
  </form></div>
}

function RejectModal({ product, busy, error, onClose, onReject }) {
  const [reason, setReason] = useState('')
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"><form role="dialog" aria-modal="true" onSubmit={(event) => { event.preventDefault(); onReject(reason) }} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-lg font-bold text-gray-800">Từ chối sản phẩm</h2><p className="mt-1 text-sm text-gray-500">{product.name}</p><label className="mt-4 block text-xs font-semibold text-gray-600">Lý do gửi cho Owner<textarea required minLength={3} maxLength={2000} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 p-3 text-sm font-normal" placeholder="Nêu nội dung cần chỉnh sửa…" /></label>{error && <p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-xs font-semibold text-gray-600">Hủy</button><button disabled={busy} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Đang gửi…' : 'Từ chối và gửi lý do'}</button></div></form></div>
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], totalElements: 0, totalPages: 0 })
  const [pendingCount, setPendingCount] = useState(0)
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [editor, setEditor] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const size = 10

  useEffect(() => { const timer = window.setTimeout(() => setQuery(search.trim()), 250); return () => window.clearTimeout(timer) }, [search])
  useEffect(() => { getAdminUsers({ status: 'ACTIVE', page: 0, size: 100 }).then((result) => setOwners(result?.users || [])).catch(() => setOwners([])) }, [])
  useEffect(() => {
    let current = true
    getAdminProducts({ search: query, status, page, size }).then((result) => current && (setData(result || { items: [], totalElements: 0, totalPages: 0 }), setError(''))).catch((e) => current && setError(e.message)).finally(() => current && setLoading(false))
    return () => { current = false }
  }, [query, status, page, refresh])
  useEffect(() => { let current = true; getAdminProducts({ status: 'PENDING', page: 0, size: 1 }).then((r) => current && setPendingCount(r?.totalElements || 0)).catch(() => {}); return () => { current = false } }, [refresh])

  const saveProduct = async (form) => {
    setSaving(true); setFormError('')
    try {
      if (editor?.id) await updateAdminProduct(editor.id, { ...form, status: editor.status })
      else await createAdminProduct(form)
      setEditor(undefined); setRefresh((v) => v + 1)
    } catch (e) { setFormError(e.message) } finally { setSaving(false) }
  }
  const decide = async (product, decision, reason = '') => {
    setReviewBusy(true); setReviewError('')
    try { await reviewAdminProduct(product.id, decision, reason); setRejectTarget(null); setRefresh((v) => v + 1) }
    catch (e) { setReviewError(e.message) } finally { setReviewBusy(false) }
  }
  const toggleVisibility = async (product) => {
    try { await updateAdminProductStatus(product.id, product.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); setRefresh((v) => v + 1) }
    catch (e) { setError(e.message) }
  }
  const columns = [
    { key: 'product', header: 'Sản phẩm', className: 'min-w-[250px]', render: (p) => <div className="flex items-center gap-3"><div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1"><img src={resolveProductImage(p.imageKey)} alt="" className="max-h-full max-w-full object-contain" /></div><div className="min-w-0"><p className="line-clamp-2 font-semibold text-gray-800">{p.name}</p><p className="mt-1 text-[10px] text-gray-400">#{p.id} · {p.brandName || p.categoryName || 'Thiết bị'}</p>{p.reviewReason && <p className="mt-1 line-clamp-2 text-[10px] text-rose-700">Lý do: {p.reviewReason}</p>}</div></div> },
    { key: 'owner', header: 'Chủ sản phẩm', className: 'min-w-[180px]', render: (p) => <><p className="font-medium text-gray-700">{p.ownerName || '—'}</p><p className="mt-1 text-[10px] text-gray-400">{p.ownerEmail}</p></> },
    { key: 'price', header: 'Giá thuê/ngày', className: 'whitespace-nowrap', render: (p) => money(p.dailyPrice) },
    { key: 'stock', header: 'Kho', render: (p) => p.stock ?? 0 },
    { key: 'createdAt', header: 'Ngày đăng', render: (p) => date(p.createdAt) },
    { key: 'status', header: 'Trạng thái', render: (p) => <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : p.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : p.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>{p.status === 'ACTIVE' ? 'Đang hiển thị' : p.status === 'REJECTED' ? 'Bị từ chối' : p.status === 'INACTIVE' ? 'Đang ẩn' : isPending(p.status) ? 'Chờ duyệt' : p.status}</span> },
    { key: 'actions', header: 'Thao tác', sortable: false, className: 'min-w-[205px] whitespace-nowrap text-right', cellClassName: 'whitespace-nowrap text-right', render: (p) => <div className="flex flex-wrap justify-end gap-1.5"><button type="button" onClick={() => { setEditor(p); setFormError('') }} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-700">Sửa</button>{isPending(p.status) ? <><button type="button" disabled={reviewBusy} onClick={() => decide(p, 'APPROVE')} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-50">Duyệt</button><button type="button" disabled={reviewBusy} onClick={() => { setRejectTarget(p); setReviewError('') }} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-[10px] font-semibold text-rose-700">Từ chối</button></> : !['REJECTED', 'SUSPENDED'].includes(String(p.status).toUpperCase()) && <button type="button" onClick={() => toggleVisibility(p)} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-700">{p.status === 'ACTIVE' ? 'Ẩn' : 'Kích hoạt'}</button>}</div> },
  ]

  return <AdminLayout><main className="min-w-0">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[22px] font-bold tracking-tight text-gray-800 sm:text-2xl">Quản lý sản phẩm</h1><p className="mt-1 text-xs leading-5 text-gray-500">Tạo sản phẩm, sửa thông tin và xét duyệt nội dung Owner gửi lên.</p></div><button type="button" onClick={() => { setEditor(null); setFormError('') }} className="rounded-lg bg-[#f45116] px-3.5 py-2.5 text-xs font-semibold text-white">+ Thêm sản phẩm</button></div>
    <section className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-amber-900">Duyệt sản phẩm Owner</p><p className="mt-1 text-xs text-amber-800">{pendingCount} sản phẩm đang chờ quyết định. Nếu từ chối, lý do sẽ được gửi cho Owner.</p></div><button type="button" onClick={() => { setStatus('PENDING'); setPage(0) }} className="rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-bold text-white">Chờ duyệt · {pendingCount}</button></section>
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-400 sm:max-w-[390px]"><AdminIcon name="search" className="size-4" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Tìm tên, mã sản phẩm, Owner…" className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none" /></label><label className="flex items-center gap-2 text-xs text-gray-500">Trạng thái<select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"><option value="all">Tất cả</option><option value="ACTIVE">Đang hiển thị</option><option value="INACTIVE">Đang ẩn</option><option value="PENDING">Chờ duyệt</option><option value="REJECTED">Bị từ chối</option></select></label></div>
    <AdminDataTable columns={columns} rows={data.items || []} rowKey={(p) => p.id} loading={loading} error={error} emptyMessage="Không tìm thấy sản phẩm." page={page} pageCount={Math.max(data.totalPages || 0, 1)} totalElements={data.totalElements || 0} size={size} onPageChange={setPage} />
    <p className="mt-4 text-center text-[11px] text-gray-400">Sản phẩm Owner đăng được duyệt hoặc từ chối; lý do từ chối được lưu và gửi trong thông báo.</p>
  </main>
    {editor !== undefined && <ProductForm key={editor?.id || 'create'} product={editor} owners={owners} busy={saving} error={formError} onClose={() => setEditor(undefined)} onSave={saveProduct} />}
    {rejectTarget && <RejectModal product={rejectTarget} busy={reviewBusy} error={reviewError} onClose={() => setRejectTarget(null)} onReject={(reason) => decide(rejectTarget, 'REJECT', reason)} />}
  </AdminLayout>
}
