import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getStoredAuth } from '../services/authApi.js'
import { addToCart, clearWishlist, getWishlist, removeFromWishlist } from '../services/shoppingApi.js'
import { showToast } from '../services/toast.js'

const categories = [
  { id: 'all', label: 'Tất cả' },
  { id: 'camera', label: 'Máy ảnh' },
  { id: 'lens', label: 'Ống kính' },
  { id: 'studio', label: 'Thiết bị' },
  { id: 'accessory', label: 'Phụ kiện' },
]

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function rentalDates() {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + 3)
  const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { startDate: format(start), endDate: format(end) }
}

export default function WishlistPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recent')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    getWishlist({ signal: controller.signal })
      .then(setItems)
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const filteredItems = useMemo(() => {
    const filtered = category === 'all' ? [...items] : items.filter((item) => item.category === category)
    if (sort === 'price-low') filtered.sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'price-high') filtered.sort((a, b) => Number(b.price) - Number(a.price))
    if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    return filtered
  }, [category, items, sort])

  if (!getStoredAuth()) return <Navigate to="/login" replace state={{ from: location }} />

  const removeItem = async (productId) => {
    setBusyId(productId)
    try {
      await removeFromWishlist(productId)
      setItems((current) => current.filter((item) => item.productId !== productId))
      showToast('Đã bỏ thiết bị khỏi danh sách yêu thích.', 'success')
    } catch (actionError) {
      showToast(actionError.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const removeAll = async () => {
    if (!items.length) return
    setBusyId('all')
    try {
      await clearWishlist()
      setItems([])
      showToast('Đã xóa danh sách yêu thích.', 'success')
    } catch (actionError) {
      showToast(actionError.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const rentNow = async (item) => {
    setBusyId(item.productId)
    try {
      await addToCart(item.productId, { ...rentalDates(), quantity: 1 })
      showToast('Đã thêm thiết bị vào giỏ hàng. LensRent giữ chỗ trong 10 phút.', 'success')
      navigate('/cart')
    } catch (actionError) {
      showToast(actionError.message, 'error')
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-gray-900">
      <Header />
      <main className="mx-auto min-h-[560px] max-w-[1280px] px-4 py-7 sm:px-6 lg:px-6">
        <nav className="mb-3 text-sm text-gray-500"><Link className="hover:text-[#ff5500]" to="/">Trang chủ</Link><span className="mx-2">›</span>Danh sách yêu thích</nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-[28px]">Danh sách yêu thích</h1>
            <p className="mt-1 text-sm text-gray-500">Những thiết bị bạn đã lưu để thuê sau · {items.length} thiết bị</p>
          </div>
          <button className="text-sm font-medium text-gray-500 transition hover:text-red-600 disabled:opacity-40" disabled={!items.length || busyId === 'all'} onClick={removeAll} type="button">Xóa tất cả</button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {categories.map((item) => (
              <button aria-pressed={category === item.id} className={`transition ${category === item.id ? 'font-bold text-[#ff5500]' : 'text-gray-500 hover:text-gray-900'}`} key={item.id} onClick={() => setCategory(item.id)} type="button">{item.label}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <span className="sr-only">Sắp xếp danh sách</span>
            <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#ff5500]" onChange={(event) => setSort(event.target.value)} value={sort}>
              <option value="recent">Mới lưu nhất</option><option value="price-low">Giá thấp đến cao</option><option value="price-high">Giá cao đến thấp</option><option value="name">Tên thiết bị</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">Đang tải thiết bị đã lưu…</div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-white px-5 py-12 text-center"><p className="text-base font-semibold text-red-700">{error}</p><button className="mt-4 rounded-lg bg-[#ff5500] px-4 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()} type="button">Tải lại</button></div>
        ) : filteredItems.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <article className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md" key={item.productId}>
                <Link aria-label={`Xem ${item.name}`} className="block" to={`/products/${item.productId}`}>
                  <div className="relative flex h-48 items-center justify-center bg-[#f2f3f5] p-4">
                    <img alt={item.name} className="max-h-full max-w-full object-contain transition group-hover:scale-[1.03]" src={resolveProductImage(item.imageKey)} />
                    <span className={`absolute left-3 top-3 rounded bg-white px-2 py-1 text-xs font-semibold ${item.availableQuantity > 0 ? 'text-emerald-700' : 'text-gray-500'}`}>{item.availableQuantity > 0 ? 'Sẵn sàng' : 'Đã thuê'}</span>
                  </div>
                  <div className="px-4 pb-2 pt-3">
                    <p className="text-xs font-medium uppercase text-gray-400">{item.categoryName || item.type}</p>
                    <h2 className="mt-1 line-clamp-2 min-h-12 text-sm font-bold leading-5 text-gray-900">{item.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><span className="text-amber-500">★</span><b className="text-gray-700">{Number(item.rating || 0).toFixed(1)}</b> · {item.brand || 'LensRent'}</p>
                    <p className="mt-2 text-sm font-extrabold text-[#ed4b0a]">{money(item.price)} <span className="font-normal text-gray-400">/ ngày</span></p>
                  </div>
                </Link>
                <button aria-label={`Bỏ yêu thích ${item.name}`} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white text-lg text-[#ff5500] shadow-sm transition hover:bg-orange-50 disabled:opacity-50" disabled={busyId === item.productId} onClick={() => removeItem(item.productId)} type="button">♥</button>
                <div className="grid grid-cols-[1fr_1fr] gap-2 border-t border-gray-100 px-3 py-3">
                  <Link className="flex min-h-9 items-center justify-center rounded-md border border-gray-200 px-2 text-xs font-semibold text-gray-700 hover:border-gray-400" to={`/products/${item.productId}`}>Xem chi tiết</Link>
                  <button className="min-h-9 rounded-md bg-[#ff5500] px-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300" disabled={item.availableQuantity < 1 || busyId === item.productId} onClick={() => rentNow(item)} type="button">Thuê ngay</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl bg-[#f0f1f3] px-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-2xl text-[#ff5500]">♡</span>
            <h2 className="mt-3 text-base font-bold">Tìm thêm thiết bị cho dự án của bạn?</h2>
            <p className="mt-1 max-w-lg text-sm text-gray-500">Khám phá máy ảnh, ống kính và phụ kiện chuyên nghiệp để lưu vào danh sách yêu thích.</p>
            <Link className="mt-4 rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600" to="/categories">Khám phá thiết bị</Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
