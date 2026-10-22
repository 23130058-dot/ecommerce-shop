import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getStoredAuth } from '../services/authApi.js'
import { addToCart, clearCompare, getCompareItems, removeFromCompare } from '../services/shoppingApi.js'

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function futureDates() {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + 3)
  const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { startDate: format(start), endDate: format(end) }
}

function GroupHeading({ children, columns }) {
  return <div className="grid bg-[#fff3eb] text-xs font-bold uppercase tracking-wide text-[#ed4b0a]" style={{ gridTemplateColumns: `220px repeat(${columns}, minmax(190px, 1fr))` }}><div className="col-span-full px-4 py-3">{children}</div></div>
}

function CompareRow({ label, values, columns, emphasis = false }) {
  return (
    <div className={`grid border-t border-gray-100 ${emphasis ? 'bg-[#fff8f3]' : 'bg-white'}`} style={{ gridTemplateColumns: `220px repeat(${columns}, minmax(190px, 1fr))` }}>
      <div className="px-4 py-3 text-sm font-medium text-gray-600">{label}</div>
      {values.map((value, index) => <div className={`border-l border-gray-100 px-4 py-3 text-sm ${emphasis ? 'font-bold text-[#ed4b0a]' : 'text-gray-800'}`} key={`${label}-${index}`}>{value || '—'}</div>)}
    </div>
  )
}

export default function ComparePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    getCompareItems({ signal: controller.signal })
      .then(setItems)
      .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  if (!getStoredAuth()) return <Navigate to="/login" replace state={{ from: location }} />

  const removeItem = async (item) => {
    setBusyId(item.productId)
    setNotice('')
    try {
      await removeFromCompare(item.productId)
      setItems((current) => current.filter((saved) => saved.productId !== item.productId))
    } catch (actionError) {
      setNotice(actionError.message)
    } finally {
      setBusyId(null)
    }
  }

  const removeAll = async () => {
    setBusyId('all')
    setNotice('')
    try {
      await clearCompare()
      setItems([])
    } catch (actionError) {
      setNotice(actionError.message)
    } finally {
      setBusyId(null)
    }
  }

  const rentNow = async (item) => {
    setBusyId(item.productId)
    setNotice('')
    try {
      await addToCart(item.productId, { ...futureDates(), quantity: 1 })
      navigate('/cart')
    } catch (actionError) {
      setNotice(actionError.message)
      setBusyId(null)
    }
  }

  const columns = Math.max(items.length, 1)

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-gray-900">
      <Header />
      <main className="mx-auto min-h-[560px] max-w-[1280px] px-4 py-7 sm:px-6 lg:px-6">
        <nav className="mb-3 text-sm text-gray-500"><Link className="hover:text-[#ff5500]" to="/">Trang chủ</Link><span className="mx-2">›</span>So sánh thiết bị</nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-[28px]">So sánh thiết bị</h1>
            <p className="mt-1 text-sm text-gray-500">Phân tích các thông số, giá thuê và tình trạng trước khi lựa chọn thiết bị.</p>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-[#ed4b0a]" to="/categories">＋ Thêm thiết bị</Link>
            <button className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 transition hover:text-red-600 disabled:opacity-40" disabled={!items.length || busyId === 'all'} onClick={removeAll} type="button">Xóa tất cả</button>
          </div>
        </div>

        {notice && <p aria-live="polite" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{notice}</p>}
        {loading ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">Đang tải thiết bị so sánh…</div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-white px-5 py-12 text-center text-sm text-red-700">{error}</div>
        ) : items.length ? (
          <>
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="min-w-max">
                <div className="grid bg-white" style={{ gridTemplateColumns: `220px repeat(${columns}, minmax(190px, 1fr))` }}>
                  <div className="flex flex-col justify-end p-4">
                    <span className="inline-flex w-fit rounded bg-[#fff0e9] px-2 py-1 text-xs font-bold text-[#e94b0a]">Bảng so sánh chi tiết</span>
                    <p className="mt-2 text-sm font-semibold">Thông số kỹ thuật & chi phí</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">Đang so sánh {items.length}/4 thiết bị.</p>
                  </div>
                  {items.map((item) => (
                    <article className="relative border-l border-gray-100 px-4 pb-4 pt-5 text-center" key={item.productId}>
                      <button aria-label={`Bỏ ${item.name} khỏi so sánh`} className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40" disabled={busyId === item.productId} onClick={() => removeItem(item)} type="button">×</button>
                      <Link className="mx-auto flex h-28 items-center justify-center" to={`/products/${item.productId}`}><img alt={item.name} className="max-h-full max-w-full object-contain" src={resolveProductImage(item.imageKey)} /></Link>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{item.brand || item.type}</p>
                      <Link className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-gray-900 hover:text-[#ed4b0a]" to={`/products/${item.productId}`}>{item.name}</Link>
                      <p className="mt-1 text-base font-extrabold text-[#ed4b0a]">{money(item.price)}<span className="text-xs font-medium text-gray-500"> / ngày</span></p>
                      <button className="mt-3 w-full rounded-md bg-[#ff5500] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300" disabled={item.availableQuantity < 1 || busyId === item.productId} onClick={() => rentNow(item)} type="button">Thuê ngay</button>
                      <p className={`mt-2 text-xs font-semibold ${item.availableQuantity > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{item.availableQuantity > 0 ? `Còn ${item.availableQuantity} thiết bị` : 'Hiện đã được thuê'}</p>
                    </article>
                  ))}
                </div>

                <GroupHeading columns={columns}>Thông tin thiết bị</GroupHeading>
                <CompareRow columns={columns} label="Danh mục" values={items.map((item) => item.categoryName || item.category)} />
                <CompareRow columns={columns} label="Hãng sản xuất" values={items.map((item) => item.brand)} />
                <CompareRow columns={columns} label="Loại thiết bị" values={items.map((item) => item.type)} />
                <CompareRow columns={columns} label="Đánh giá" values={items.map((item) => `★ ${Number(item.rating || 0).toFixed(1)} / 5`)} />

                <GroupHeading columns={columns}>Thông số kỹ thuật</GroupHeading>
                <CompareRow columns={columns} label="Đặc điểm nổi bật" values={items.map((item) => (item.tags || []).length ? item.tags.join(' · ') : 'Chưa cập nhật')} />

                <GroupHeading columns={columns}>Giá thuê & tình trạng</GroupHeading>
                <CompareRow columns={columns} label="Tiền cọc hoàn trả" values={items.map((item) => money(item.depositAmount))} />
                <CompareRow columns={columns} emphasis label="Giá thuê (1 ngày)" values={items.map((item) => money(item.price))} />
                <CompareRow columns={columns} label="Tình trạng" values={items.map((item) => item.availableQuantity > 0 ? `Sẵn sàng · còn ${item.availableQuantity}` : 'Đã thuê hết')} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ['◇', 'Cần hỗ trợ tư vấn?', 'Chuyên gia LensRent có thể giúp bạn chọn thiết bị phù hợp.', 'Nhận tư vấn ngay'],
                ['＋', 'Thuê theo combo', 'Kết hợp thân máy và phụ kiện để sẵn sàng cho buổi chụp.', 'Xem thêm thiết bị'],
                ['▣', 'Chính sách bảo hiểm', 'Tìm hiểu quy định bảo hiểm và hỗ trợ khi thuê thiết bị.', 'Tìm hiểu thêm'],
              ].map(([icon, title, text, link]) => <div className="rounded-xl border border-gray-200 bg-white p-4" key={title}><span className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-[#ed4b0a]">{icon}</span><h2 className="mt-2 text-sm font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-gray-500">{text}</p><Link className="mt-2 inline-block text-xs font-bold text-[#ed4b0a]" to="/categories">{link} →</Link></div>)}
            </div>
          </>
        ) : (
          <section className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-2xl text-[#ff5500]">⇄</span>
            <h2 className="mt-3 text-base font-bold">Chưa có thiết bị để so sánh</h2>
            <p className="mt-1 text-sm text-gray-500">Mở danh mục và chọn “So sánh” ở những thiết bị bạn đang cân nhắc.</p>
            <Link className="mt-4 rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600" to="/categories">Khám phá thiết bị</Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
