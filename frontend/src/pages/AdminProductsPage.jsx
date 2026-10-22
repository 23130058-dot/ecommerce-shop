import { useEffect, useState } from 'react'
import AdminDataTable from '../components/admin/AdminDataTable.jsx'
import AdminLayout, { AdminIcon } from '../components/admin/AdminLayout.jsx'
import { resolveProductImage } from '../components/home/productImageMap.js'
import { getAdminProducts, updateAdminProductStatus } from '../services/adminApi.js'

const money = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')}đ`
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—'

function ProductStatus({ status }) {
  const normalized = status?.toUpperCase()
  const tone = normalized === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : normalized === 'INACTIVE' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'
  const label = normalized === 'ACTIVE' ? 'Đang hiển thị' : normalized === 'INACTIVE' ? 'Đang ẩn' : normalized || 'Chưa rõ'
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}>{label}</span>
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
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
      getAdminProducts({ search: query, status, page, size })
        .then((result) => {
          if (current) {
            setData(result || { items: [], totalElements: 0, totalPages: 0 })
            setError('')
          }
        })
        .catch((requestError) => current && setError(requestError.message))
        .finally(() => current && setLoading(false))
    }, 0)
    return () => { current = false; window.clearTimeout(timer) }
  }, [query, status, page, refresh])

  const changeFilter = (setter, value) => {
    setter(value)
    setPage(0)
  }

  const toggleStatus = async (product) => {
    setSavingId(product.id)
    setError('')
    try {
      await updateAdminProductStatus(product.id, product.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
      setRefresh((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingId(null)
    }
  }

  const columns = [
    { key: 'product', header: 'Sản phẩm', className: 'min-w-[260px]', render: (product) => <div className="flex items-center gap-3"><div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1"><img src={resolveProductImage(product.imageKey)} alt="" className="max-h-full max-w-full object-contain" /></div><div className="min-w-0"><p className="line-clamp-2 font-semibold text-gray-800">{product.name}</p><p className="mt-1 text-[10px] text-gray-400">#{product.id} · {product.brandName || product.categoryName || 'Thiết bị'}</p></div></div> },
    { key: 'owner', header: 'Chủ sản phẩm', className: 'min-w-[190px]', render: (product) => <><p className="font-medium text-gray-700">{product.ownerName || '—'}</p><p className="mt-1 text-[10px] text-gray-400">{product.ownerEmail || ''}</p></> },
    { key: 'price', header: 'Giá thuê/ngày', className: 'whitespace-nowrap', render: (product) => <span className="font-semibold text-gray-800">{money(product.dailyPrice)}</span> },
    { key: 'stock', header: 'Kho', render: (product) => <span>{product.stock ?? 0}</span> },
    { key: 'createdAt', header: 'Ngày đăng', render: (product) => date(product.createdAt) },
    { key: 'status', header: 'Trạng thái', render: (product) => <ProductStatus status={product.status} /> },
    { key: 'actions', header: 'Thao tác', className: 'text-right', cellClassName: 'text-right', render: (product) => <button type="button" disabled={savingId === product.id} onClick={() => toggleStatus(product)} className={`whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[10px] font-semibold disabled:cursor-wait disabled:opacity-40 ${product.status?.toUpperCase() === 'ACTIVE' ? 'border-rose-100 text-rose-600 hover:bg-rose-50' : 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'}`}>{savingId === product.id ? 'Đang lưu…' : product.status?.toUpperCase() === 'ACTIVE' ? 'Ẩn sản phẩm' : 'Kích hoạt'}</button> },
  ]

  return <AdminLayout><main className="min-w-0">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[22px] font-bold tracking-tight text-gray-800 sm:text-2xl">Quản lý sản phẩm</h1><p className="mt-1 text-xs leading-5 text-gray-500">Tra cứu sản phẩm của Owner và kiểm soát trạng thái hiển thị trên cửa hàng.</p></div><div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500"><AdminIcon name="camera" className="mr-2 inline size-4" />{data.totalElements ?? 0} sản phẩm</div></div>
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-400 focus-within:border-orange-400 sm:max-w-[390px]"><AdminIcon name="search" className="size-4 shrink-0" /><input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Tìm tên, mã sản phẩm, Owner…" aria-label="Tìm sản phẩm" className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400" /></label><label className="flex items-center gap-2 text-xs text-gray-500">Trạng thái<select value={status} onChange={(event) => changeFilter(setStatus, event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-orange-400"><option value="all">Tất cả</option><option value="ACTIVE">Đang hiển thị</option><option value="INACTIVE">Đang ẩn</option><option value="PENDING">Chờ duyệt</option></select></label></div>
    <AdminDataTable columns={columns} rows={data.items || []} rowKey={(product) => product.id} loading={loading} error={error} emptyMessage="Không tìm thấy sản phẩm." page={page} pageCount={Math.max(data.totalPages || 0, 1)} totalElements={data.totalElements || 0} size={size} onPageChange={setPage} />
    <p className="mt-4 text-center text-[11px] text-gray-400">Thay đổi trạng thái sẽ cập nhật ngay dữ liệu sản phẩm trong PostgreSQL.</p>
  </main></AdminLayout>
}
