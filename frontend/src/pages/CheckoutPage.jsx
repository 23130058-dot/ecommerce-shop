import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getStoredAuth } from '../services/authApi.js'
import { checkoutCart, getCart, updateCartItem } from '../services/shoppingApi.js'

const DRAFT_KEY = 'lensrent.checkout-draft'
const DELIVERY_FEE = 50000

function money(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function localDate(offset = 0) {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function readDraft() {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') || {} } catch { return {} }
}

function Stepper({ active }) {
    const steps = ['Xác nhận giỏ', 'Thanh toán', 'Hoàn tất']
    return <ol className="mx-auto mb-6 flex max-w-xl items-center justify-center">
        {steps.map((step, index) => <li className="flex flex-1 items-center last:flex-none" key={step}>
            <div className="flex items-center gap-2">
                <span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${index < active ? 'bg-emerald-500 text-white' : index === active ? 'bg-[#ff5500] text-white' : 'border border-gray-300 bg-white text-gray-400'}`}>{index < active ? '✓' : index + 1}</span>
                <span className={`hidden text-xs font-bold uppercase sm:inline ${index === active ? 'text-[#ff5500]' : index < active ? 'text-emerald-600' : 'text-gray-400'}`}>{step}</span>
            </div>
            {index < steps.length - 1 && <span className="mx-3 h-px flex-1 bg-gray-200 sm:mx-5" />}
        </li>)}
    </ol>
}

function Panel({ title, children }) {
    return <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] sm:p-5">
        <h2 className="border-l-2 border-[#ff5500] pl-3 text-base font-extrabold text-gray-900">{title}</h2>
        <div className="mt-4">{children}</div>
    </section>
}

function Field({ label, ...props }) {
    return <label className="block min-w-0 text-xs font-semibold text-gray-600">
        {label}
        <input {...props} className={`mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-normal text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#ff5500] focus:bg-white ${props.className || ''}`} />
    </label>
}

function Summary({ cart, deliveryMethod, onContinue, busy, onSubmitPayment, error, isPayment }) {
    const deliveryFee = deliveryMethod === 'HOME' ? DELIVERY_FEE : 0
    const total = Number(cart.rentalTotal || 0) + Number(cart.depositTotal || 0) + Number(cart.serviceFee || 0) + deliveryFee
    return <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] sm:p-5">
        <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Tóm tắt đơn hàng</h2><span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{cart.items.length} thiết bị</span></div>
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
            {cart.items.map((item) => <div className="flex gap-3" key={item.id}>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1"><img alt="" className="max-h-full max-w-full object-contain" src={resolveProductImage(item.imageKey)} /></div>
                <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-bold text-gray-800">{item.name}</p><p className="mt-1 text-xs text-gray-400">{item.quantity} máy · {item.startDate || 'Chưa chọn ngày'} – {item.endDate || 'Chưa chọn ngày'}</p></div>
                <span className="shrink-0 text-xs font-bold text-gray-800">{money(Number(item.price) * Number(item.quantity) * Math.max(1, Math.ceil((new Date(`${item.endDate || localDate(1)}T00:00:00`) - new Date(`${item.startDate || localDate()}T00:00:00`)) / 86400000)))}</span>
            </div>)}
        </div>
        <div className="my-4 border-t border-gray-100" />
        <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3 text-gray-500"><span>Tạm tính tiền thuê</span><b className="text-gray-800">{money(cart.rentalTotal)}</b></div>
            <div className="flex justify-between gap-3 text-gray-500"><span>Tiền cọc thiết bị</span><b className="text-gray-800">{money(cart.depositTotal)}</b></div>
            <div className="flex justify-between gap-3 text-gray-500"><span>Phí dịch vụ (5%)</span><b className="text-gray-800">{money(cart.serviceFee)}</b></div>
            <div className="flex justify-between gap-3 text-gray-500"><span>Phí vận chuyển</span><b className={deliveryFee ? 'text-gray-800' : 'text-emerald-600'}>{deliveryFee ? money(deliveryFee) : 'Miễn phí'}</b></div>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4"><span className="text-sm font-bold">Tổng thanh toán</span><span className="text-xl font-extrabold text-[#ff5500]">{money(total)}</span></div>
        <p className="mt-1 text-right text-xs text-gray-400">Đã bao gồm tiền cọc {money(cart.depositTotal)}</p>
        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}
        {isPayment ? <>
            <button className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff5500] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:bg-gray-300" disabled={busy} onClick={onSubmitPayment} type="button">{busy ? 'Đang ghi nhận thanh toán…' : 'Đồng ý thanh toán →'}</button>
        </> : <button className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff5500] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:bg-gray-300" disabled={busy} onClick={onContinue} type="button">Tiếp tục thanh toán →</button>}
        <Link className="mt-3 block text-center text-xs font-medium text-gray-500 hover:text-[#ff5500]" to="/cart">Quay lại giỏ hàng</Link>
    </aside>
}

export default function CheckoutPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const auth = getStoredAuth()
    const isPayment = location.pathname.endsWith('/payment')
    const [cart, setCart] = useState({ items: [], rentalTotal: 0, depositTotal: 0, serviceFee: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [draft, setDraft] = useState(() => ({
        startDate: localDate(1), endDate: localDate(4), deliveryMethod: 'HOME', deliveryAddress: '', district: '', city: '',
        contactName: auth?.user?.fullName || '', contactPhone: auth?.user?.phone || '', contactEmail: auth?.user?.email || '',
        ...readDraft(),
    }))

    useEffect(() => {
        const controller = new AbortController()
        getCart({ signal: controller.signal })
            .then((loadedCart) => {
                if (controller.signal.aborted) return
                setCart(loadedCart)
                const saved = readDraft()
                const firstItem = loadedCart.items?.[0]
                setDraft((current) => ({
                    ...current,
                    startDate: saved.startDate || firstItem?.startDate || current.startDate,
                    endDate: saved.endDate || firstItem?.endDate || current.endDate,
                }))
            })
            .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [])

    const minEndDate = useMemo(() => {
        const start = draft.startDate ? new Date(`${draft.startDate}T12:00:00`) : new Date()
        start.setDate(start.getDate() + 1)
        return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    }, [draft.startDate])

    if (!auth) return <Navigate to="/login" replace state={{ from: location }} />
    if (isPayment && !readDraft().startDate) return <Navigate to="/checkout" replace />

    const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }))

    const continueToPayment = async (event) => {
        event.preventDefault()
        setError('')
        if (!cart.items.length) { setError('Giỏ hàng đang trống.'); return }
        if (!draft.startDate || !draft.endDate || draft.endDate <= draft.startDate) { setError('Vui lòng chọn ngày kết thúc sau ngày bắt đầu.'); return }
        if (!draft.contactName.trim() || !draft.contactPhone.trim()) { setError('Vui lòng nhập họ tên và số điện thoại người thuê.'); return }
        if (draft.deliveryMethod === 'HOME' && !draft.deliveryAddress.trim()) { setError('Vui lòng nhập địa chỉ giao hàng.'); return }
        setBusy(true)
        try {
            await Promise.all(cart.items.map((item) => updateCartItem(item.id, {
                quantity: item.quantity,
                startDate: draft.startDate,
                endDate: draft.endDate,
            })))
            const updatedCart = await getCart()
            setCart(updatedCart)
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
            navigate('/checkout/payment')
        } catch (actionError) {
            setError(actionError.message)
        } finally {
            setBusy(false)
        }
    }

    const submitPayment = async () => {
        setBusy(true)
        setError('')
        try {
            const result = await checkoutCart({
                deliveryMethod: draft.deliveryMethod,
                deliveryAddress: draft.deliveryMethod === 'HOME' ? draft.deliveryAddress.trim() : null,
                district: draft.deliveryMethod === 'HOME' ? draft.district.trim() : null,
                city: draft.deliveryMethod === 'HOME' ? draft.city.trim() : null,
                contactName: draft.contactName.trim(),
                contactPhone: draft.contactPhone.trim(),
                contactEmail: draft.contactEmail.trim(),
            })
            navigate(`/checkout/complete/${result.rentalId}`, { state: { created: true } })
        } catch (actionError) {
            setError(actionError.message)
        } finally {
            setBusy(false)
        }
    }

    return <div className="min-h-screen bg-[#f7f9fc] text-gray-900">
        <Header />
        <main className="mx-auto min-h-[560px] max-w-[1120px] px-4 py-5 sm:px-6 lg:px-8">
            <Stepper active={isPayment ? 1 : 0} />
            {loading ? <div className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-500">Đang tải giỏ hàng…</div> : error && !cart.items.length ? <div className="rounded-xl border border-red-200 bg-white px-5 py-12 text-center text-sm text-red-700">{error}<p className="mt-4"><Link className="font-bold text-[#ff5500]" to="/cart">Quay lại giỏ hàng</Link></p></div> : isPayment ? (
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.78fr)]">
                    <div>
                        <Link className="mb-3 inline-flex text-sm text-gray-500 hover:text-[#ff5500]" to="/checkout">← Quay lại thông tin thuê</Link>
                        <Panel title="Xác nhận thanh toán">
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                <p className="text-sm font-bold text-emerald-800">Thanh toán mô phỏng</p>
                                <p className="mt-1 text-sm leading-6 text-emerald-700">Khi bạn nhấn đồng ý, hệ thống sẽ ghi nhận đơn là đã thanh toán và gửi yêu cầu thuê đến chủ thiết bị. Chưa cần nhập thông tin thẻ hay chọn phương thức.</p>
                            </div>
                            <div className="mt-5 rounded-lg border border-orange-100 bg-[#fff6ee] p-4 text-sm leading-6 text-orange-900"><b className="text-[#ed4b0a]">Lưu ý về tiền đặt cọc</b><p className="mt-1">Tiền cọc được ghi nhận trong đơn và hoàn lại sau khi thiết bị được bàn giao, kiểm tra.</p></div>
                        </Panel>
                    </div>
                    <Summary cart={cart} deliveryMethod={draft.deliveryMethod} error={error} isPayment onSubmitPayment={submitPayment} busy={busy} />
                </div>
            ) : (
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.78fr)]">
                    <form className="space-y-4" onSubmit={continueToPayment}>
                        <Panel title="Thời gian thuê thiết bị">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Ngày nhận thiết bị" min={localDate()} onChange={(event) => updateDraft('startDate', event.target.value)} required type="date" value={draft.startDate} />
                                <Field label="Ngày trả thiết bị" min={minEndDate} onChange={(event) => updateDraft('endDate', event.target.value)} required type="date" value={draft.endDate} />
                            </div>
                            <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2.5 text-xs leading-5 text-orange-800">Thời gian thuê sẽ được áp dụng cho tất cả thiết bị trong giỏ hàng. Vui lòng kiểm tra ngày trả trước khi tiếp tục.</p>
                        </Panel>

                        <Panel title="Phương thức nhận hàng">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button aria-pressed={draft.deliveryMethod === 'HOME'} className={`rounded-lg border p-4 text-left transition ${draft.deliveryMethod === 'HOME' ? 'border-[#ff5500] bg-orange-50/40' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => updateDraft('deliveryMethod', 'HOME')} type="button"><span className="block text-sm font-bold">♧ &nbsp;Giao hàng tận nơi</span><span className="mt-1 block text-xs leading-5 text-gray-500">Giao hàng nhanh trong 2–4 giờ tại TP. Hồ Chí Minh.</span><span className="mt-2 block text-xs font-bold text-[#ed4b0a]">{money(DELIVERY_FEE)}</span></button>
                                <button aria-pressed={draft.deliveryMethod === 'STORE'} className={`rounded-lg border p-4 text-left transition ${draft.deliveryMethod === 'STORE' ? 'border-[#ff5500] bg-orange-50/40' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => updateDraft('deliveryMethod', 'STORE')} type="button"><span className="block text-sm font-bold">⌂ &nbsp;Nhận tại cửa hàng</span><span className="mt-1 block text-xs leading-5 text-gray-500">Nhận thiết bị tại cửa hàng LensRent, Quận 1.</span><span className="mt-2 block text-xs font-bold text-emerald-600">Miễn phí</span></button>
                            </div>
                            {draft.deliveryMethod === 'HOME' && <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <Field className="sm:col-span-2" label="Địa chỉ giao hàng" onChange={(event) => updateDraft('deliveryAddress', event.target.value)} placeholder="Số nhà, tên đường, phường/xã..." required value={draft.deliveryAddress} />
                                <Field label="Quận / huyện" onChange={(event) => updateDraft('district', event.target.value)} placeholder="Quận 1" value={draft.district} />
                                <Field label="Thành phố" onChange={(event) => updateDraft('city', event.target.value)} placeholder="Hồ Chí Minh" value={draft.city} />
                            </div>}
                        </Panel>

                        <Panel title="Thông tin người thuê">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Họ và tên" onChange={(event) => updateDraft('contactName', event.target.value)} placeholder="Nguyễn Văn A" required value={draft.contactName} />
                                <Field label="Số điện thoại" onChange={(event) => updateDraft('contactPhone', event.target.value)} placeholder="098 123 4567" required type="tel" value={draft.contactPhone} />
                                <Field className="sm:col-span-2" label="Địa chỉ email" onChange={(event) => updateDraft('contactEmail', event.target.value)} placeholder="email@example.com" type="email" value={draft.contactEmail} />
                            </div>
                            <p className="mt-4 rounded-lg border border-orange-100 bg-[#fff6ee] px-3 py-3 text-xs leading-5 text-orange-900"><b className="text-[#ed4b0a]">Xác minh đơn hàng</b><br />Thông tin liên hệ được dùng để xác nhận lịch thuê và thông báo tình trạng thiết bị.</p>
                        </Panel>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm font-bold">↻ &nbsp;Chính sách cọc</p><p className="mt-1 text-xs leading-5 text-gray-500">Tiền đặt cọc sẽ được hoàn lại sau khi thiết bị được trả và kiểm tra.</p></div>
                            <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm font-bold">▣ &nbsp;Thay đổi lịch thuê</p><p className="mt-1 text-xs leading-5 text-gray-500">Liên hệ hỗ trợ để điều chỉnh lịch thuê trước thời điểm nhận máy.</p></div>
                            <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm font-bold">♧ &nbsp;Hỗ trợ kỹ thuật</p><p className="mt-1 text-xs leading-5 text-gray-500">Đội ngũ LensRent hỗ trợ trong suốt thời gian thuê thiết bị.</p></div>
                        </div>
                        <button className="min-h-11 w-full rounded-lg bg-[#ff5500] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 lg:hidden" disabled={busy} type="submit">{busy ? 'Đang lưu thông tin…' : 'Tiếp tục thanh toán →'}</button>
                        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}
                    </form>
                    <div className="lg:sticky lg:top-5"><Summary cart={cart} deliveryMethod={draft.deliveryMethod} error="" isPayment={false} onContinue={continueToPayment} busy={busy} /></div>
                </div>
            )}
        </main>
        <Footer />
    </div>
}