import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { resolveProductImage } from '../components/home/productImageMap.js'
import { createMarketplaceReport, getStore, getStores } from '../services/productApi.js'
import { getStoredAuth } from '../services/authApi.js'
import { showToast } from '../services/toast.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

function StoreCard({ store }) {
  return <Link to={`/stores/${store.ownerId}`} className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
    <div className="flex items-center gap-4">
      {store.avatarUrl ? <img className="size-14 rounded-full object-cover" src={store.avatarUrl} alt="" /> : <span className="flex size-14 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-600">{(store.storeName || 'L').slice(0,1)}</span>}
      <div className="min-w-0"><h2 className="truncate text-lg font-bold text-gray-900 group-hover:text-[#ed4b0a]">{store.storeName}</h2><p className="truncate text-sm text-gray-500">{store.ownerName}{store.city ? ` · ${store.city}` : ''}</p></div>
    </div>
    <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-gray-600">{store.description || 'Gian hàng thiết bị trên LensRent.'}</p>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-sm"><span><b className="text-gray-900">{store.activeProductCount}</b> thiết bị</span><span>★ <b className="text-gray-900">{Number(store.averageRating || 0).toFixed(1)}</b></span><span><b className="text-gray-900">{store.rentalCount}</b> lượt thuê</span></div>
  </Link>
}

function ReportForm({ ownerId, productId, onClose }) {
  const [category, setCategory] = useState('Thông tin không chính xác')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (!getStoredAuth()) { showToast('Đăng nhập để gửi báo cáo.', 'error'); return }
    setBusy(true)
    try {
      await createMarketplaceReport({ targetType: productId ? 'PRODUCT' : 'STORE', targetUserId: ownerId, productId: productId || null, category, description })
      showToast('Đã gửi báo cáo để Admin xem xét.', 'success')
      onClose()
    } catch (error) { showToast(error.message, 'error') } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="mt-3 grid gap-2 rounded-xl border border-orange-100 bg-orange-50 p-3 sm:grid-cols-[190px_1fr_auto]">
    <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option>Thông tin không chính xác</option><option>Nội dung vi phạm</option><option>Gian hàng đáng ngờ</option><option>Sản phẩm giả mạo</option><option>Khác</option></select>
    <input required maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả lý do báo cáo…" className="min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
    <div className="flex gap-2"><button disabled={busy} className="rounded-lg bg-[#ff5500] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang gửi…' : 'Gửi báo cáo'}</button><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">Đóng</button></div>
  </form>
}

export default function StoresPage() {
  const { ownerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sort, setSort] = useState('popular')
  const [stores, setStores] = useState([])
  const [store, setStore] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reportTarget, setReportTarget] = useState(null)

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    const task = ownerId ? getStore(ownerId, { signal: controller.signal }).then(setStore) : getStores({ search, sort, signal: controller.signal }).then((items) => { setStores(items); setSearchParams((current) => { const next = new URLSearchParams(current); search.trim() ? next.set('search', search.trim()) : next.delete('search'); return next }, { replace: true }) })
    task.catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [ownerId, search, sort])

  return <div className="flex min-h-screen flex-col bg-[#f7f9fc] text-gray-900"><Header />
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {ownerId ? <>
        <Link to="/stores" className="text-sm font-semibold text-gray-500 hover:text-[#ff5500]">← Tất cả gian hàng</Link>
        {loading ? <div className="mt-5 rounded-xl bg-white p-12 text-center text-gray-500">Đang tải gian hàng…</div> : error ? <div className="mt-5 rounded-xl border border-red-200 bg-white p-8 text-red-700">{error}</div> : store && <>
          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4">{store.avatarUrl ? <img className="size-16 rounded-full object-cover" src={store.avatarUrl} alt="" /> : <span className="flex size-16 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-600">{store.storeName.slice(0,1)}</span>}<div><p className="text-xs font-bold uppercase tracking-wider text-[#ff5500]">Gian hàng LensRent</p><h1 className="mt-1 text-2xl font-extrabold">{store.storeName}</h1><p className="mt-1 text-sm text-gray-500">{store.ownerName}{store.city ? ` · ${store.city}` : ''}</p></div></div><button onClick={() => setReportTarget(reportTarget === 'store' ? null : 'store')} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-orange-200 hover:text-[#ff5500]">Báo cáo gian hàng</button></div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-gray-600">{store.description || 'Gian hàng thiết bị trên LensRent.'}</p><div className="mt-5 flex gap-6 text-sm"><span><b>{store.products?.length || 0}</b> thiết bị đang đăng</span><span>★ <b>{Number(store.averageRating || 0).toFixed(1)}</b></span><span><b>{store.rentalCount || 0}</b> lượt thuê thành công</span></div>
            {reportTarget === 'store' && <ReportForm ownerId={store.ownerId} onClose={() => setReportTarget(null)} />}
          </section>
          <div className="mt-7 flex items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold">Thiết bị đang cho thuê</h2><p className="mt-1 text-sm text-gray-500">Dữ liệu và giá thuê được lấy từ danh sách sản phẩm đang hiển thị.</p></div><span className="text-sm text-gray-500">{store.products?.length || 0} thiết bị</span></div>
          {store.products?.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{store.products.map((product) => <article className="overflow-hidden rounded-xl border border-gray-200 bg-white" key={product.id}><Link to={`/products/${product.id}`} className="flex h-52 items-center justify-center bg-gray-50 p-4"><img className="max-h-full max-w-full object-contain" src={resolveProductImage(product.imageKey)} alt={product.name} /></Link><div className="p-4"><p className="text-xs font-semibold uppercase text-gray-400">{product.category || product.type}</p><Link className="mt-1 block font-bold hover:text-[#ff5500]" to={`/products/${product.id}`}>{product.name}</Link><p className="mt-2 text-xs text-gray-500">★ {Number(product.rating || 0).toFixed(1)} · {product.availableQuantity} sẵn sàng · {product.rentalCount} lượt thuê</p><div className="mt-3 flex items-center justify-between"><b className="text-[#ff5500]">{money(product.price)} <small className="font-normal text-gray-400">/ ngày</small></b><div className="flex gap-2"><Link to={`/products/${product.id}`} className="rounded-lg bg-[#ff5500] px-3 py-2 text-xs font-bold text-white">Chi tiết</Link><button onClick={() => setReportTarget(reportTarget === product.id ? null : product.id)} className="rounded-lg border border-gray-200 px-2.5 py-2 text-xs">Báo cáo</button></div></div>{reportTarget === product.id && <ReportForm ownerId={store.ownerId} productId={product.id} onClose={() => setReportTarget(null)} />}</div></article>)}</div> : <div className="mt-4 rounded-xl border border-dashed bg-white p-10 text-center text-sm text-gray-500">Gian hàng chưa có thiết bị đang hiển thị.</div>}
        </>}
      </> : <>
        <p className="text-xs font-bold uppercase tracking-wider text-[#ff5500]">LensRent Marketplace</p><h1 className="mt-2 text-3xl font-extrabold">Khám phá gian hàng</h1><p className="mt-2 text-gray-500">Tìm chủ thiết bị và xem các sản phẩm họ đang cho thuê.</p>
        <div className="mt-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_220px]"><input aria-label="Tìm kiếm gian hàng" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm gian hàng, chủ thiết bị, thành phố hoặc sản phẩm…" className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"/><select aria-label="Sắp xếp gian hàng" value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="popular">Phổ biến</option><option value="rating">Đánh giá cao</option><option value="newest">Mới nhất</option><option value="name">Tên A–Z</option></select></div>
        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-white p-8 text-red-700">{error}</div> : loading ? <div className="mt-5 rounded-xl bg-white p-12 text-center text-gray-500">Đang tải gian hàng…</div> : stores.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{stores.map((item) => <StoreCard key={item.ownerId} store={item} />)}</div> : <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center"><h2 className="font-bold">Chưa tìm thấy gian hàng phù hợp</h2><p className="mt-2 text-sm text-gray-500">Thử tên chủ thiết bị, thành phố hoặc sản phẩm khác.</p></div>}
      </>}
    </main><Footer /></div>
}
