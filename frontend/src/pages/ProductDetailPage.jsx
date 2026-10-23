import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getCatalogProduct, getCatalogProducts } from '../services/productApi.js'
import { getStoredAuth } from '../services/authApi.js'
import { addToCart, addToCompare, addToWishlist } from '../services/shoppingApi.js'
import { showToast } from '../services/toast.js'
import ProductReviews from '../components/product/ProductReviews.jsx'

const categoryRoutes = {
  camera: 'may-anh',
  lens: 'ong-kinh',
  accessory: 'phu-kien',
  studio: 'studio',
}

const policies = [
  {
    title: 'Chính sách thuê',
    body: 'Ngày nhận và ngày trả được dùng để ước tính chi phí. Chủ thiết bị sẽ xác nhận lịch bàn giao trước khi yêu cầu thuê được hoàn tất.',
  },
  {
    title: 'Thủ tục nhận thiết bị',
    body: 'Bạn sẽ trao đổi với chủ thiết bị để thống nhất thời gian, địa điểm nhận và giấy tờ cần chuẩn bị.',
  },
  {
    title: 'Bảo hiểm & rủi ro',
    body: 'Vui lòng thống nhất tình trạng thiết bị, trách nhiệm bảo quản và phương án xử lý sự cố với chủ thiết bị trước khi nhận.',
  },
]

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ'
}

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

function rentalDays(start, end) {
  if (!start || !end) return 1
  const startTime = new Date(`${start}T00:00:00`).getTime()
  const endTime = new Date(`${end}T00:00:00`).getTime()
  return Math.max(1, Math.ceil((endTime - startTime) / 86400000))
}

function ProductState({ title, message, children }) {
  return (
    <div className="mx-auto my-16 max-w-3xl rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#ff5500]">LensRent · Thiết bị</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-gray-500">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  )
}

function DataRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className={strong ? 'text-right font-bold text-gray-900' : 'text-right font-medium text-gray-700'}>{value}</dd>
    </div>
  )
}

function RelatedCard({ product }) {
  return (
    <Link className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md" to={`/products/${product.id}`}>
      <div className="flex h-40 items-center justify-center bg-white p-4">
        <img className="max-h-full w-full object-contain transition group-hover:scale-[1.03]" src={resolveProductImage(product.imageKey)} alt={product.name} loading="lazy" />
      </div>
      <div className="border-t border-gray-100 px-4 py-3">
        <h3 className="line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-gray-900">{product.name}</h3>
        <p className="mt-1 text-sm font-bold text-[#ed4b0a]">{formatCurrency(product.price)}<span className="font-medium text-gray-500"> / ngày</span></p>
      </div>
    </Link>
  )
}

export default function ProductDetailPage() {
  const { productId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const [openPolicies, setOpenPolicies] = useState({})
  const [shoppingBusy, setShoppingBusy] = useState('')
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(getStoredAuth()))
  const [startDate, setStartDate] = useState(() => addDays(localDateString(new Date()), 1))
  const [endDate, setEndDate] = useState(() => addDays(localDateString(new Date()), 3))

  useEffect(() => {
    const syncAuth = () => setIsSignedIn(Boolean(getStoredAuth()))
    window.addEventListener('lensrent-auth-changed', syncAuth)
    return () => window.removeEventListener('lensrent-auth-changed', syncAuth)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setProduct(null)
    setRelatedProducts([])
    setLoadError('')
    setIsLoading(true)
    setSelectedImage(0)

    getCatalogProduct(productId, { signal: controller.signal })
      .then(setProduct)
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [productId, retryToken])

  useEffect(() => {
    if (!product?.category) return undefined
    const controller = new AbortController()
    getCatalogProducts({ category: product.category, sort: 'popular', limit: 8, signal: controller.signal })
      .then((items) => setRelatedProducts(items.filter((item) => String(item.id) !== String(product.id)).slice(0, 4)))
      .catch((error) => {
        if (error.name !== 'AbortError') setRelatedProducts([])
      })
    return () => controller.abort()
  }, [product?.category, product?.id])

  const categoryPath = product?.category && categoryRoutes[product.category]
    ? '/categories/' + categoryRoutes[product.category]
    : '/categories'
  const images = useMemo(() => {
    const list = (product?.images || []).filter(Boolean)
    if (list.length) return list
    return product?.imageKey ? [product.imageKey] : []
  }, [product?.images, product?.imageKey])
  const dayCount = rentalDays(startDate, endDate)
  const rentalAmount = Number(product?.price || 0) * dayCount
  const depositAmount = Number(product?.depositAmount || 0)
  const totalAmount = rentalAmount + depositAmount
  const syncProductRating = useCallback((rating) => {
    setProduct((current) => current ? { ...current, rating } : current)
  }, [])

  const moveGallery = (direction) => {
    setSelectedImage((index) => (index + direction + images.length) % images.length)
  }

  const ensureSignedIn = () => {
    if (getStoredAuth()) return true
    navigate('/login', { state: { from: location } })
    return false
  }

  const saveToList = async (list) => {
    if (!ensureSignedIn()) return
    setShoppingBusy(list)
    try {
      if (list === 'wishlist') {
        await addToWishlist(product.id)
        showToast('Đã lưu thiết bị vào danh sách yêu thích.', 'success')
      } else {
        await addToCompare(product.id)
        showToast('Đã thêm thiết bị vào danh sách so sánh.', 'success')
      }
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setShoppingBusy('')
    }
  }

  const rentFromCart = async () => {
    if (!ensureSignedIn()) return
    setShoppingBusy('cart')
    try {
      await addToCart(product.id, { quantity: 1, startDate, endDate })
      showToast('Đã thêm thiết bị vào giỏ hàng. LensRent giữ chỗ trong 10 phút.', 'success')
      navigate('/cart')
    } catch (error) {
      showToast(error.message, 'error')
      setShoppingBusy('')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] font-sans text-[#111827]">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        {product && (
          <nav aria-label="Đường dẫn" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link className="transition hover:text-[#ff5500]" to="/">Trang chủ</Link>
            <span aria-hidden="true">›</span>
            <Link className="transition hover:text-[#ff5500]" to={categoryPath}>{product.categoryName || 'Danh mục'}</Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-gray-800">{product.name}</span>
          </nav>
        )}

        {isLoading ? (
          <ProductState title="Đang tải thiết bị" message="Đang lấy thông tin mới nhất từ kho LensRent." />
        ) : loadError ? (
          <ProductState title={loadError.includes('Không tìm thấy') ? 'Không tìm thấy thiết bị' : 'Chưa tải được thiết bị'} message={loadError}>
            <button className="rounded-lg bg-[#ff5500] px-5 py-3 text-base font-semibold text-white transition hover:bg-orange-600" onClick={() => setRetryToken((value) => value + 1)} type="button">Thử lại</button>
            <Link className="rounded-lg border border-gray-200 px-5 py-3 text-base font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50" to="/categories">Xem danh mục</Link>
          </ProductState>
        ) : product ? (
          <>
            <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(390px,0.9fr)] xl:gap-7">
              <div className="min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                  <div className="group relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-lg bg-[#f1f3f5] p-6 sm:min-h-[430px] sm:p-10">
                    {images.length > 0 ? (
                      <img className="max-h-[420px] w-full object-contain" src={resolveProductImage(images[selectedImage] || images[0])} alt={product.name} />
                    ) : (
                      <div className="px-6 text-center text-base text-gray-500">Chủ thiết bị chưa thêm ảnh cho sản phẩm này.</div>
                    )}
                    {images.length > 1 && (
                      <>
                        <button aria-label="Ảnh trước" className="absolute left-3 flex size-10 items-center justify-center rounded-full bg-white/95 text-2xl text-gray-600 shadow-sm transition hover:text-[#ff5500]" onClick={() => moveGallery(-1)} type="button">‹</button>
                        <button aria-label="Ảnh tiếp theo" className="absolute right-3 flex size-10 items-center justify-center rounded-full bg-white/95 text-2xl text-gray-600 shadow-sm transition hover:text-[#ff5500]" onClick={() => moveGallery(1)} type="button">›</button>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Ảnh sản phẩm">
                      {images.map((image, index) => (
                        <button aria-label={`Xem ảnh ${index + 1}`} aria-pressed={selectedImage === index} className={`flex size-[68px] items-center justify-center overflow-hidden rounded-md border bg-white p-1.5 transition ${selectedImage === index ? 'border-[#ff5500] ring-2 ring-orange-100' : 'border-gray-200 hover:border-orange-300'}`} key={`${image}-${index}`} onClick={() => setSelectedImage(index)} type="button">
                          <img className="max-h-full max-w-full object-contain" src={resolveProductImage(image)} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 px-1 pt-3 text-sm text-gray-500">
                    <span>Mã thiết bị LR-{String(product.id).padStart(4, '0')}</span>
                    <span>{product.availableQuantity > 0 ? `Còn ${product.availableQuantity} thiết bị` : 'Hiện đã được thuê'}</span>
                  </div>
                </div>

                <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-gray-900">Mô tả sản phẩm</h2>
                  <p className="mt-3 text-base leading-7 text-gray-600">{product.description || 'Chủ thiết bị chưa thêm mô tả cho sản phẩm này.'}</p>

                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <h2 className="text-lg font-bold text-gray-900">Thông số kỹ thuật</h2>
                    {(product.tags || []).length > 0 ? (
                      <dl className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
                        {product.tags.map((tag, index) => (
                          <div className="grid grid-cols-[minmax(100px,0.7fr)_1.3fr] gap-4 py-3 text-sm sm:text-base" key={tag}>
                            <dt className="text-gray-500">Đặc điểm {index + 1}</dt>
                            <dd className="text-right font-medium text-gray-800">{tag}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="mt-3 text-base text-gray-500">Thông số sẽ được cập nhật từ chủ thiết bị.</p>
                    )}
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <h2 className="mb-1 text-lg font-bold text-gray-900">Chính sách & hướng dẫn</h2>
                    {policies.map((policy, index) => {
                      const expanded = Boolean(openPolicies[index])
                      return (
                        <div className="border-b border-gray-100" key={policy.title}>
                          <button aria-expanded={expanded} className="flex w-full items-center justify-between gap-4 py-3 text-left text-base font-semibold text-gray-800 hover:text-[#ed4b0a]" onClick={() => setOpenPolicies((current) => ({ ...current, [index]: !current[index] }))} type="button">
                            {policy.title}<span aria-hidden="true" className="text-lg text-gray-400">{expanded ? '−' : '+'}</span>
                          </button>
                          {expanded && <p className="pb-4 text-sm leading-6 text-gray-600 sm:text-base">{policy.body}</p>}
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-5">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-flex rounded bg-[#fff0e9] px-2 py-1 text-xs font-semibold text-[#e94b0a]">{product.type || product.categoryName || 'Thiết bị'}</span>
                      <h1 className="mt-2 text-2xl font-bold leading-tight text-gray-950 sm:text-[28px]">{product.name}</h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
                        {product.brand && <span>{product.brand}</span>}
                        {product.brand && <span aria-hidden="true">·</span>}
                        <span className="text-amber-500">★</span><span className="font-semibold text-gray-800">{Number(product.rating || 0).toFixed(1)} / 5</span>
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-xl font-extrabold text-[#f04b0b] sm:text-2xl">{formatCurrency(product.price)}<span className="block text-xs font-medium text-gray-500">mỗi ngày</span></p>
                  </div>

                  <div className="mt-5 rounded-lg border border-gray-200 p-4" id="rental">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800"><span aria-hidden="true">▣</span> Chọn thời gian thuê</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500">Ngày bắt đầu</span>
                        <input aria-label="Ngày bắt đầu thuê" className="h-11 w-full rounded-md border border-gray-200 px-2 text-sm text-gray-800 outline-none focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100" min={localDateString(new Date())} onChange={(event) => {
                          const value = event.target.value
                          setStartDate(value)
                          if (endDate <= value) setEndDate(addDays(value, 1))
                        }} type="date" value={startDate} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500">Ngày kết thúc</span>
                        <input aria-label="Ngày kết thúc thuê" className="h-11 w-full rounded-md border border-gray-200 px-2 text-sm text-gray-800 outline-none focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100" min={addDays(startDate, 1)} onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
                      </label>
                    </div>
                    <dl className="mt-3 divide-y divide-gray-100 border-t border-gray-100 pt-2">
                      <DataRow label="Thời gian thuê" value={`${dayCount} ngày`} />
                      <DataRow label="Tiền thuê tạm tính" value={formatCurrency(rentalAmount)} />
                      {depositAmount > 0 && <DataRow label="Tiền cọc (hoàn trả)" value={formatCurrency(depositAmount)} />}
                      <DataRow label="Tổng tạm tính" value={formatCurrency(totalAmount)} strong />
                    </dl>
                    <p className="mt-2 text-xs leading-5 text-gray-500">Chưa bao gồm phí giao nhận (nếu có). Chủ thiết bị xác nhận chi phí cuối cùng.</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-[#ed4b0a] disabled:opacity-50" disabled={Boolean(shoppingBusy)} onClick={() => saveToList('wishlist')} type="button">♡ Thêm vào Wishlist</button>
                    <button className="min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-[#ed4b0a] disabled:opacity-50" disabled={Boolean(shoppingBusy)} onClick={() => saveToList('compare')} type="button">⇄ So sánh</button>
                  </div>
                  {product.availableQuantity > 0 ? (
                    <button className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#ff5500] px-4 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5500] disabled:opacity-60" disabled={shoppingBusy === 'cart'} onClick={rentFromCart} type="button">
                      <span aria-hidden="true">↗</span> {shoppingBusy === 'cart' ? 'ĐANG THÊM VÀO GIỎ…' : 'THUÊ NGAY'}
                    </button>
                  ) : (
                    <button className="mt-4 flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-300 px-4 py-3 text-base font-bold text-gray-600" disabled type="button">Hiện không có sẵn</button>
                  )}
                  <a className="mt-2 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-orange-300 hover:text-[#ed4b0a]" href="#owner">XEM CHỦ SỞ HỮU</a>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
                    <div className="flex items-start gap-2"><span className="text-emerald-600">✓</span><div><p className="font-semibold text-gray-800">Thiết bị có sẵn</p><p className="mt-0.5 text-xs text-gray-500">{product.availableQuantity} sản phẩm</p></div></div>
                    <div className="flex items-start gap-2"><span className="text-blue-600">◉</span><div><p className="font-semibold text-gray-800">Thông tin minh bạch</p><p className="mt-0.5 text-xs text-gray-500">Giá lấy từ LensRent</p></div></div>
                  </div>
                  <a className="mt-4 flex min-h-10 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-[#ed4b0a]" href="#reviews">XEM ĐÁNH GIÁ SẢN PHẨM</a>
                </section>

                <section className="scroll-mt-5 rounded-xl border border-orange-200 bg-[#fff3eb] p-5 sm:p-6" id="owner">
                  <p className="text-sm font-bold uppercase tracking-wide text-[#ed4b0a]">Thông tin chủ sở hữu</p>
                  <h2 className="mt-3 text-lg font-bold text-gray-900">{product.ownerName || 'Chủ thiết bị LensRent'}</h2>
                  <p className="mt-1 text-sm text-gray-600">Chủ thiết bị trên LensRent</p>
                  {isSignedIn ? (
                    <>
                      <p className="mt-2 text-sm leading-6 text-gray-600">Bạn đã đăng nhập. Chọn thời gian thuê và thêm thiết bị vào giỏ để tiếp tục đặt thuê.</p>
                      <a className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-[#ed4b0a]" href="#rental">Chọn thời gian thuê</a>
                    </>
                  ) : (
                    <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-[#ed4b0a]" state={{ from: { pathname: location.pathname } }} to="/login">Đăng nhập để đặt thuê</Link>
                  )}
                </section>

                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  <span className="font-bold">Lưu ý:</span> Hãy xác nhận tình trạng thiết bị, lịch thuê và các khoản phí với chủ sở hữu trước khi nhận máy.
                </div>
              </aside>
            </section>

            <ProductReviews
              productId={product.id}
              isSignedIn={isSignedIn}
              onNeedSignIn={() => navigate('/login', { state: { from: location } })}
              onRatingChange={syncProductRating}
            />

            {relatedProducts.length > 0 && (
              <section className="mt-8 rounded-xl bg-[#f1f3f5] p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div><h2 className="text-lg font-bold text-gray-900">Thiết bị liên quan</h2><p className="mt-1 text-sm text-gray-500">Sản phẩm cùng danh mục từ kho LensRent.</p></div>
                  <Link className="text-sm font-semibold text-gray-600 transition hover:text-[#ed4b0a]" to={categoryPath}>Xem tất cả ›</Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedProducts.map((item) => <RelatedCard key={item.id} product={item} />)}
                </div>
              </section>
            )}
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
