import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import ConfirmDialog from '../components/layout/ConfirmDialog.jsx'
import Header from '../components/layout/Header.jsx'
import { getRental, cancelRental, requestRentalReturn, getRentalChats, getRentalChatMessages, sendRentalChatMessage } from '../services/shoppingApi.js'
import { getCatalogProducts } from '../services/productApi.js'
import { showToast } from '../services/toast.js'

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function dateTime(value) {
  if (!value) return 'Vừa xong'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

const paymentLabels = { MANUAL: 'Xác nhận trực tiếp (mô phỏng)', CARD: 'Thẻ tín dụng / ghi nợ', BANK_TRANSFER: 'Chuyển khoản ngân hàng', WALLET: 'Ví điện tử' }
const statusLabels = { PENDING: 'Đang chờ chủ thiết bị xác nhận', CONFIRMED: 'Đã xác nhận', ACTIVE: 'Đang thuê', RENTING: 'Đang thuê', IN_PROGRESS: 'Đang thuê', RETURN_PENDING: 'Chờ Owner xác nhận trả', COMPLETED: 'Đã hoàn tất', CANCELLED: 'Đã hủy', CANCELED: 'Đã hủy' }

export default function OrderConfirmationPage() {
  const { rentalId } = useParams()
  const location = useLocation()
  const isNewOrder = location.pathname.startsWith('/checkout/complete/')
  const [rental, setRental] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [chatOwners, setChatOwners] = useState([])
  const [selectedOwnerId, setSelectedOwnerId] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatBody, setChatBody] = useState('')
  const [chatBusy, setChatBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getRental(rentalId, { signal: controller.signal }), getCatalogProducts({ limit: 8, signal: controller.signal })])
      .then(([order, catalog]) => {
        if (controller.signal.aborted) return
        setRental(order)
        setProducts(catalog.filter((product) => !order.items.some((item) => String(item.productId) === String(product.id))).slice(0, 4))
        if (isNewOrder) sessionStorage.removeItem('lensrent.checkout-draft')
      })
      .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [rentalId, isNewOrder])

  useEffect(() => {
    if (!rental?.rentalId) return
    let active = true
    getRentalChats(rental.rentalId).then((rows) => {
      if (!active) return
      setChatOwners(rows)
      setSelectedOwnerId((current) => rows.some((owner) => String(owner.ownerId) === current)
        ? current
        : String(rows[0]?.ownerId || ''))
    }).catch((chatLoadError) => { if (active) showToast(chatLoadError.message, 'error') })
    return () => { active = false }
  }, [rental?.rentalId])

  useEffect(() => {
    if (!rental?.rentalId || !selectedOwnerId) { setChatMessages([]); return }
    let active = true
    getRentalChatMessages(rental.rentalId, selectedOwnerId)
      .then((rows) => { if (active) setChatMessages(rows) })
      .catch((chatLoadError) => { if (active) showToast(chatLoadError.message, 'error') })
    return () => { active = false }
  }, [rental?.rentalId, selectedOwnerId])

  const currentStatus = String(rental?.status || '').toUpperCase()
  const canCancel = ['PENDING','CONFIRMED'].includes(currentStatus) && rental?.items?.some((item) => item.startDate > new Date().toISOString().slice(0,10))
  const returnStatuses = ['ACTIVE','IN_PROGRESS','RENTING'].includes(currentStatus)
  const hasStartedRentalItem = rental?.items?.some((item) => item.startDate <= new Date().toISOString().slice(0,10))
  const canShowReturnRequest = returnStatuses
  const canRequestReturn = returnStatuses && hasStartedRentalItem
  const runOrderAction = async (action) => {
    setActionBusy(true)
    try {
      if (action === 'cancel') await cancelRental(rentalId)
      else await requestRentalReturn(rentalId)
      setRental(await getRental(rentalId))
      if (action === 'cancel') setShowCancelConfirm(false)
      showToast(action === 'cancel' ? 'Đơn thuê đã được hủy.' : 'Yêu cầu trả thiết bị đã được gửi cho Owner.', 'success')
    } catch (actionError) {
      showToast(actionError.message || 'Không thể cập nhật đơn thuê. Vui lòng thử lại.', 'error')
      if (action === 'return') getRental(rentalId).then(setRental).catch(() => {})
    } finally { setActionBusy(false) }
  }
  const sendMessage = async (event) => {
    event.preventDefault()
    if (!chatBody.trim() || !selectedOwnerId) return
    setChatBusy(true)
    try {
      const message = await sendRentalChatMessage(rental.rentalId, selectedOwnerId, chatBody.trim())
      setChatMessages((current) => [...current, message])
      setChatBody('')
      setChatOwners(await getRentalChats(rental.rentalId))
      showToast('Tin nhắn đã được gửi.', 'success')
    } catch (sendError) { showToast(sendError.message, 'error') } finally { setChatBusy(false) }
  }
  const timeline = [
    { title: 'Đặt đơn thuê thành công', detail: 'Yêu cầu thuê đã được lưu vào tài khoản LensRent.', done: Boolean(rental) },
    { title: 'Xác nhận thanh toán', detail: rental?.paymentStatus === 'PAID' ? 'Thanh toán mô phỏng đã được ghi nhận thành công.' : 'Đang cập nhật trạng thái thanh toán.', done: rental?.paymentStatus === 'PAID', current: rental?.paymentStatus !== 'PAID' },
    { title: 'Chuẩn bị thiết bị', detail: 'Chủ thiết bị sẽ chuẩn bị và kiểm tra thiết bị cho bạn.', done: ['CONFIRMED', 'ACTIVE', 'RENTING', 'IN_PROGRESS', 'COMPLETED'].includes(currentStatus) },
    { title: 'Bàn giao thiết bị', detail: 'Theo dõi lịch nhận thiết bị trong phần đơn thuê.', done: ['ACTIVE', 'RENTING', 'IN_PROGRESS', 'COMPLETED'].includes(currentStatus) },
    { title: 'Đang thuê', detail: 'Thiết bị sẽ xuất hiện trong danh sách đang thuê.', done: ['ACTIVE', 'RENTING', 'IN_PROGRESS'].includes(currentStatus) },
  ]

  return <div className="flex min-h-screen flex-col bg-[#f7f9fc] text-gray-900">
    <Header />
    <main className="mx-auto min-h-[560px] w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
      {loading ? <div className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-500">Đang tải thông tin đơn thuê…</div> : error ? <div className="rounded-xl border border-red-200 bg-white px-5 py-12 text-center"><p className="text-sm font-semibold text-red-700">{error}</p><Link className="mt-4 inline-block text-sm font-bold text-[#ff5500]" to="/renter/orders">Quay về đơn thuê</Link></div> : rental && <>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(350px,0.85fr)]">
          <div className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600" aria-hidden="true">✓</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#ff5500]">{isNewOrder ? 'LensRent · Hoàn tất yêu cầu' : `LensRent · Đơn ${rental.rentalCode}`}</p>
                  <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{isNewOrder ? 'Đơn hàng đã được ghi nhận!' : 'Thông tin đơn thuê'}</h1>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{isNewOrder ? <>Mã đơn <b className="text-[#ff5500]">#{rental.rentalCode}</b> đã được tạo và thanh toán mô phỏng thành công. Chủ thiết bị sẽ cập nhật khi xác nhận đơn.</> : <>Trạng thái hiện tại: <b className="text-gray-800">{statusLabels[currentStatus] || currentStatus}</b>.</>}</p>
                  <div className="mt-4 flex flex-wrap gap-2"><Link className="rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600" to={`/renter/orders/${rental.rentalId}`}>Theo dõi đơn thuê</Link>{canCancel&&<button disabled={actionBusy} onClick={()=>setShowCancelConfirm(true)} className="rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 disabled:opacity-50">Hủy đơn</button>}{canShowReturnRequest&&<button disabled={actionBusy || !canRequestReturn} title={!canRequestReturn ? 'Chỉ có thể yêu cầu trả từ ngày bắt đầu thuê.' : undefined} onClick={()=>runOrderAction('return')} className="rounded-lg border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 disabled:cursor-not-allowed disabled:opacity-50">{actionBusy?'Đang xử lý…':canRequestReturn?'Yêu cầu trả thiết bị':'Chưa đến ngày thuê'}</button>}<button className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50" onClick={() => window.print()} type="button">In hóa đơn</button></div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-extrabold">Trạng thái đơn hàng</h2>
              <ol className="mt-5 space-y-0">
                {timeline.map((step, index) => <li className="relative flex gap-3 pb-5 last:pb-0" key={step.title}>
                  {index < timeline.length - 1 && <span className={`absolute bottom-0 left-[11px] top-6 w-px ${step.done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                  <span className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-emerald-500 text-white' : step.current ? 'border-2 border-[#ff5500] bg-white text-[#ff5500]' : 'bg-gray-100 text-gray-400'}`}>{step.done ? '✓' : index + 1}</span>
                  <div><p className={`text-sm font-bold ${step.current ? 'text-[#ed4b0a]' : step.done ? 'text-gray-800' : 'text-gray-500'}`}>{step.title}</p><p className="mt-1 text-xs leading-5 text-gray-500">{step.detail}</p>{step.current && <p className="mt-1 text-xs font-semibold text-[#ed4b0a]">{dateTime(rental.createdAt)}</p>}</div>
                </li>)}
              </ol>
            </section>
            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-base font-extrabold">Trao đổi với Owner</h2><p className="mt-1 text-xs text-gray-500">Tin nhắn được lưu theo đơn thuê.</p></div>
                {chatOwners.length > 1 && <label className="text-xs font-semibold text-gray-500">Chủ thiết bị<select value={selectedOwnerId} onChange={(event) => setSelectedOwnerId(event.target.value)} className="ml-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800">{chatOwners.map((owner) => <option key={owner.ownerId} value={owner.ownerId}>{owner.ownerName}</option>)}</select></label>}
              </div>
              {!chatOwners.length ? <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Đơn chưa có Owner để trao đổi.</p> : <>
                <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-3" aria-live="polite">
                  {chatMessages.length ? chatMessages.map((message) => <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-xl px-3 py-2 ${message.mine ? 'bg-orange-500 text-white' : 'border border-gray-200 bg-white text-gray-800'}`}><p className="text-[11px] font-bold">{message.mine ? 'Bạn' : message.senderName}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.body}</p><p className={`mt-1 text-right text-[10px] ${message.mine ? 'text-white/75' : 'text-gray-400'}`}>{dateTime(message.createdAt)}</p></div></div>) : <p className="py-8 text-center text-sm text-gray-400">Chưa có tin nhắn. Bạn có thể gửi câu hỏi cho Owner.</p>}
                </div>
                <form onSubmit={sendMessage} className="mt-3 flex gap-2"><input maxLength={2000} value={chatBody} onChange={(event) => setChatBody(event.target.value)} placeholder="Nhập tin nhắn cho Owner…" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"/><button disabled={chatBusy || !chatBody.trim()} className="shrink-0 rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{chatBusy ? 'Đang gửi…' : 'Gửi'}</button></form>
              </>}
            </section>
            <div className="rounded-xl border border-orange-100 bg-[#fff6ee] p-4 text-sm leading-6 text-orange-900"><b className="text-[#ed4b0a]">Bảo mật & bảo hiểm</b><p className="mt-1">Thiết bị được kiểm tra trước khi bàn giao. Tiền cọc được hoàn lại sau khi thiết bị được trả và kiểm tra tình trạng.</p></div>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Chi tiết đơn thuê</h2><span className="rounded bg-orange-50 px-2 py-1 text-xs font-bold text-[#ed4b0a]">{statusLabels[currentStatus] || currentStatus}</span></div>
            <div className="mt-4 divide-y divide-gray-100">
              {rental.items.map((item) => <div className="flex gap-3 py-3 first:pt-0" key={item.productId}>
                <Link className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1.5" to={`/products/${item.productId}`}><img alt={item.name} className="max-h-full max-w-full object-contain" src={resolveProductImage(item.imageKey)} /></Link>
                <div className="min-w-0 flex-1"><Link className="line-clamp-2 text-sm font-bold text-gray-800 hover:text-[#ff5500]" to={`/products/${item.productId}`}>{item.name}</Link><p className="mt-1 text-xs text-gray-500">{item.quantity} thiết bị · {item.startDate} – {item.endDate}</p></div>
                <b className="shrink-0 text-sm text-gray-800">{money(item.subtotal)}</b>
              </div>)}
            </div>
            <div className="my-3 border-t border-gray-100" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 text-gray-500"><span>Thông tin nhận hàng</span><span className="text-right font-semibold text-gray-800">{rental.contactName}</span></div>
              <p className="text-xs leading-5 text-gray-500">{rental.contactPhone} · {rental.contactEmail}</p>
              <p className="text-xs leading-5 text-gray-500">{rental.deliveryMethod === 'STORE' ? 'Nhận tại cửa hàng LensRent' : [rental.deliveryAddress, rental.district, rental.city].filter(Boolean).join(', ')}</p>
              <div className="flex justify-between gap-3 border-t border-gray-100 pt-3 text-gray-500"><span>Hình thức</span><b className="text-right text-gray-800">{paymentLabels[rental.paymentMethod] || rental.paymentMethod || '—'}</b></div>
              <div className="flex justify-between gap-3 text-gray-500"><span>Trạng thái thanh toán</span><b className={rental.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-orange-600'}>{rental.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ xử lý'}</b></div>
              <div className="flex justify-between gap-3 text-gray-500"><span>Tạm tính tiền thuê</span><b className="text-gray-800">{money(rental.rentalAmount)}</b></div>
              <div className="flex justify-between gap-3 text-gray-500"><span>Phí dịch vụ</span><b className="text-gray-800">{money(rental.serviceFee)}</b></div>
              <div className="flex justify-between gap-3 text-gray-500"><span>Tiền cọc thiết bị</span><b className="text-gray-800">{money(rental.depositAmount)}</b></div>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4"><b className="text-sm">Tổng cộng</b><b className="text-xl font-extrabold text-[#ff5500]">{money(rental.totalAmount)}</b></div>
            <p className="mt-1 text-right text-xs text-gray-400">Tạo lúc {dateTime(rental.createdAt)}</p>
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-center"><p className="text-sm font-bold">Bạn cần hỗ trợ?</p><p className="mt-1 text-xs leading-5 text-gray-500">Đội ngũ LensRent sẵn sàng giải đáp về đơn thuê.</p><a className="mt-3 inline-flex rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:border-[#ff5500] hover:text-[#ff5500]" href="tel:19006789">Hotline: 1900 6789</a></div>
          </aside>
        </div>

        {products.length > 0 && <section className="mt-7 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-extrabold">Dành riêng cho project của bạn</h2><p className="mt-1 text-sm text-gray-500">Thiết bị được thuê nhiều cho các dự án gần đây.</p></div><Link className="text-sm font-semibold text-[#ff5500]" to="/categories">Xem tất cả →</Link></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{products.map((product) => <Link className="rounded-xl border border-gray-200 p-3 transition hover:border-orange-200 hover:shadow-sm" key={product.id} to={`/products/${product.id}`}><div className="flex h-32 items-center justify-center rounded-lg bg-gray-50 p-3"><img alt={product.name} className="max-h-full max-w-full object-contain" src={resolveProductImage(product.imageKey)} /></div><p className="mt-3 line-clamp-2 min-h-10 text-sm font-bold text-gray-800">{product.name}</p><p className="mt-1 text-sm font-extrabold text-[#ff5500]">{money(product.price)} <span className="text-xs font-normal text-gray-400">/ ngày</span></p></Link>)}</div>
        </section>}
      </>}
    </main>
    <Footer />
    <ConfirmDialog open={showCancelConfirm} title="Hủy đơn thuê?" message="Bạn có chắc muốn hủy đơn thuê này không?" confirmLabel="Hủy đơn" tone="danger" busy={actionBusy} onCancel={() => setShowCancelConfirm(false)} onConfirm={() => runOrderAction('cancel')} />
  </div>
}