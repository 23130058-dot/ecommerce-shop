import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getStoredAuth } from '../services/authApi.js'
import { clearCart, getCart, removeCartItem, updateCartItem } from '../services/shoppingApi.js'
import { showToast } from '../services/toast.js'

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function nextDate(dateString, offset) {
  const date = dateString ? new Date(`${dateString}T12:00:00`) : new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function daysBetween(start, end) {
  if (!start || !end) return 0
  return Math.max(0, Math.ceil((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000))
}

function CheckoutRow({ label, value, strong = false, accent = false }) {
  return <div className={`flex justify-between gap-4 py-1.5 text-sm ${strong ? 'border-t border-gray-100 pt-3 text-base font-extrabold' : ''}`}><span className={strong ? 'text-gray-900' : 'text-gray-500'}>{label}</span><span className={`${strong || accent ? 'font-bold text-[#ed4b0a]' : 'font-semibold text-gray-800'}`}>{value}</span></div>
}

export default function CartPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [cart, setCart] = useState({ items: [], rentalTotal: 0, depositTotal: 0, serviceFee: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [coupon, setCoupon] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getCart({ signal: controller.signal })
      .then(setCart)
      .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  if (!getStoredAuth()) return <Navigate to="/login" replace state={{ from: location }} />

  const updateItem = async (item, changes) => {
    const startDate = changes.startDate ?? item.startDate ?? ''
    const endDate = changes.endDate ?? item.endDate ?? ''
    setBusyId(item.id)
    try {
      const updated = await updateCartItem(item.id, {
        quantity: changes.quantity ?? item.quantity,
        startDate: startDate || null,
        endDate: endDate || null,
      })
      setCart(updated)
    } catch (actionError) {
      showToast(actionError.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const deleteItem = async (item) => {
    setBusyId(item.id)
    try { setCart(await removeCartItem(item.id)) }
    catch (actionError) { showToast(actionError.message, 'error') }
    finally { setBusyId(null) }
  }

  const deleteAll = async () => {
    setBusyId('all')
    try { setCart(await clearCart()) }
    catch (actionError) { showToast(actionError.message, 'error') }
    finally { setBusyId(null) }
  }

  const itemCount = cart.items.reduce((total, item) => total + Number(item.quantity || 0), 0)

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] text-gray-900">
      <Header />
      <main className="mx-auto min-h-[560px] w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#ed4b0a]" to="/categories"><span aria-hidden="true">‹</span> Tiếp tục tìm kiếm</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-[28px]">Giỏ hàng của bạn</h1>
          <span className="rounded bg-gray-200 px-2 py-1 text-xs font-bold text-gray-700">{itemCount} THIẾT BỊ</span>
        </div>
        {loading ? (
          <div className="mt-5 rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">Đang tải giỏ hàng…</div>
        ) : error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-white px-5 py-12 text-center text-sm text-red-700">{error}</div>
        ) : cart.items.length ? (
          <>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-[#ecfdf5] px-4 py-2.5 text-sm font-medium text-emerald-700"><span className="mr-2">✓</span>LensRent cam kết thiết bị chính hãng & đã được kiểm tra kỹ thuật</div>
            <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]">
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Danh sách thuê</h2>
                  <button className="text-xs text-gray-400 transition hover:text-red-600" disabled={busyId === 'all'} onClick={deleteAll} type="button">Xóa tất cả</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {cart.items.map((item) => {
                    const startDate = item.startDate || ''
                    const endDate = item.endDate || ''
                    const days = daysBetween(startDate, endDate)
                    const dailySubtotal = Number(item.price || 0) * days * Number(item.quantity || 1)
                    return (
                      <article className="relative grid gap-3 px-4 py-4 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5" key={item.id}>
                        <Link className="flex size-[76px] items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-[#f5f6f7] p-2" to={`/products/${item.productId}`}><img alt={item.name} className="max-h-full max-w-full object-contain" src={resolveProductImage(item.imageKey)} /></Link>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#ed4b0a]">{item.categoryName || item.type}</p>
                          <Link className="mt-0.5 block truncate text-sm font-bold text-gray-900 hover:text-[#ed4b0a]" to={`/products/${item.productId}`}>{item.name}</Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <label><span className="sr-only">Ngày bắt đầu thuê {item.name}</span><input className="h-8 w-[132px] rounded border border-gray-200 px-2 text-xs outline-none focus:border-[#ff5500]" onChange={(event) => {
                              const start = event.target.value
                              const end = endDate && endDate > start ? endDate : nextDate(start, 1)
                              updateItem(item, { startDate: start, endDate: end })
                            }} type="date" value={startDate} /></label>
                            <span>–</span>
                            <label><span className="sr-only">Ngày kết thúc thuê {item.name}</span><input className="h-8 w-[132px] rounded border border-gray-200 px-2 text-xs outline-none focus:border-[#ff5500]" onChange={(event) => {
                              const end = event.target.value
                              const start = startDate || nextDate(end, -1)
                              updateItem(item, { startDate: start, endDate: end })
                            }} type="date" value={endDate} /></label>
                            {days > 0 && <span className="rounded bg-[#fff0e9] px-2 py-1 font-semibold text-[#ed4b0a]">{days} ngày</span>}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500">
                            <span>Đơn giá thuê / ngày <b className="text-gray-800">{money(item.price)}</b></span>
                            <span>Tiền cọc thiết bị <b className="text-gray-800">{money(item.depositAmount)}</b></span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between">
                          <button aria-label={`Xóa ${item.name} khỏi giỏ hàng`} className="order-2 text-lg leading-none text-gray-300 transition hover:text-red-500 sm:order-1" disabled={busyId === item.id} onClick={() => deleteItem(item)} type="button">⌫</button>
                          <div className="order-1 flex items-center gap-4 sm:order-2 sm:flex-col sm:items-end">
                            <div className="flex h-8 items-center overflow-hidden rounded-md border border-gray-200">
                              <button aria-label="Giảm số lượng" className="px-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40" disabled={item.quantity <= 1 || busyId === item.id} onClick={() => updateItem(item, { quantity: item.quantity - 1 })} type="button">−</button>
                              <span className="min-w-7 text-center text-sm">{item.quantity}</span>
                              <button aria-label="Tăng số lượng" className="px-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40" disabled={item.quantity >= item.availableQuantity || busyId === item.id} onClick={() => updateItem(item, { quantity: item.quantity + 1 })} type="button">＋</button>
                            </div>
                            <p className="text-right"><span className="block text-[10px] uppercase text-gray-400">Thành tiền thuê</span><b className="text-sm font-extrabold text-[#ed4b0a]">{money(dailySubtotal)}</b></p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>

              <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold">Tóm tắt đơn thuê</h2>
                <div className="mt-4 flex gap-2">
                  <input aria-label="Mã giảm giá" className="h-10 min-w-0 flex-1 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#ff5500]" onChange={(event) => setCoupon(event.target.value)} placeholder="Mã giảm giá (nếu có)" value={coupon} />
                  <button className="rounded-md border border-red-200 px-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-40" disabled={!coupon.trim()} onClick={() => showToast('Hiện chưa có mã giảm giá áp dụng cho giỏ hàng này.', 'info')} type="button">Áp dụng</button>
                </div>
                <div className="mt-4 space-y-1">
                  <CheckoutRow label={`Tổng tiền thuê (${cart.items.length} mục)`} value={money(cart.rentalTotal)} />
                  <CheckoutRow label="Tổng tiền cọc máy" value={money(cart.depositTotal)} />
                  <CheckoutRow label="Phí bảo hiểm thiết bị (5%)" value={money(cart.serviceFee)} />
                  <CheckoutRow accent label="Phí vận chuyển" value="Miễn phí" />
                  <CheckoutRow strong label="Tổng cộng" value={money(cart.total)} />
                  <p className="text-right text-[11px] text-gray-400">Giá đã bao gồm VAT</p>
                </div>
                <div className="mt-4 rounded-lg border border-orange-100 bg-[#fff6ee] p-3 text-xs leading-5 text-orange-900"><b className="uppercase text-[#ed4b0a]">Lưu ý thanh toán</b><p className="mt-1">Tiền cọc sẽ được hoàn trả sau khi thiết bị được bàn giao lại và kiểm tra tình trạng.</p></div>
                <button className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff5500] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300" onClick={() => navigate('/checkout')} type="button">Tiến hành đặt thuê <span aria-hidden="true">→</span></button>
                <p className="mt-2 text-center text-[11px] leading-4 text-gray-400">Bằng cách nhấn nút, bạn đồng ý với Quy định thuê máy của LensRent.</p>
                <div className="mt-4 border-t border-gray-100 pt-4 text-center">
                  <p className="text-[11px] font-semibold uppercase text-gray-400">Cần hỗ trợ kỹ thuật?</p>
                  <a className="mt-2 flex min-h-9 items-center justify-center rounded-md border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-300" href="tel:19006789">Hotline: 1900 6789</a>
                </div>
              </aside>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">▣</span><div><h2 className="text-sm font-bold">Phương thức thanh toán</h2><p className="mt-1 text-xs leading-5 text-gray-500">Chuyển khoản chuyển tiền trực tuyến & ví điện tử (MoMo, ZaloPay).</p></div></div>
              <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ed4b0a]">◷</span><div><h2 className="text-sm font-bold">Thời gian nhận máy</h2><p className="mt-1 text-xs leading-5 text-gray-500">Vui lòng đến nhận máy sớm 30 phút so với giờ ghi trên hệ thống để thuận tiện bàn giao.</p></div></div>
            </div>
          </>
        ) : (
          <section className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-orange-50 text-2xl text-[#ff5500]">▱</span>
            <h2 className="mt-3 text-lg font-bold">Giỏ hàng đang trống</h2>
            <p className="mt-1 text-sm text-gray-500">Thêm máy ảnh, ống kính hoặc phụ kiện để bắt đầu yêu cầu thuê.</p>
            <Link className="mt-4 rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600" to="/categories">Khám phá thiết bị</Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
