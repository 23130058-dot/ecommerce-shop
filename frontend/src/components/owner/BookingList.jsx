import { useEffect, useMemo, useState } from 'react'
import OwnerIcon from './OwnerIcon'
import { cancelOwnerBooking, completeOwnerBooking, confirmOwnerBooking, getOwnerBookings } from '../../services/ownerApi.js'

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ'
const formatDate = (value) => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—'
const statusLabels = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', ACTIVE: 'Đang thuê', IN_PROGRESS: 'Đang thuê', RENTING: 'Đang thuê', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy', CANCELED: 'Đã hủy' }

export default function BookingList() {
    const [tab, setTab] = useState('all')
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState(null)

    useEffect(() => {
        const controller = new AbortController()
        getOwnerBookings({ signal: controller.signal })
            .then((items) => setBookings(Array.isArray(items) ? items : []))
            .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [])

    const pendingCount = bookings.filter((booking) => booking.status === 'PENDING').length
    const rentingCount = bookings.filter((booking) => ['CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(booking.status)).length
    const filteredBookings = useMemo(() => bookings.filter((booking) => {
        if (tab === 'pending') return booking.status === 'PENDING'
        if (tab === 'confirmed') return booking.status === 'CONFIRMED'
        if (tab === 'renting') return ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(booking.status)
        return true
    }), [bookings, tab])

    const confirm = async (rentalId) => {
        setBusyId(rentalId)
        setError('')
        try {
            await confirmOwnerBooking(rentalId)
            setBookings((previous) => previous.map((booking) => booking.rentalId === rentalId ? { ...booking, status: 'CONFIRMED' } : booking))
        } catch (actionError) {
            setError(actionError.message)
        } finally {
            setBusyId(null)
        }
    }

    const complete = async (rentalId) => {
        if (!window.confirm('Xác nhận các thiết bị của bạn trong đơn này đã được trả lại? Số lượng sẽ được cộng lại vào kho.')) return
        setBusyId(rentalId)
        setError('')
        try {
            await completeOwnerBooking(rentalId)
            setBookings((previous) => previous.map((booking) => booking.rentalId === rentalId ? { ...booking, status: 'COMPLETED' } : booking))
        } catch (actionError) {
            setError(actionError.message)
        } finally {
            setBusyId(null)
        }
    }

    const cancel = async (rentalId) => {
        if (!window.confirm('Hủy sản phẩm của bạn trong đơn thuê này? Nếu đơn có sản phẩm Owner khác, các sản phẩm đó vẫn được giữ.')) return
        setBusyId(rentalId); setError('')
        try {
            await cancelOwnerBooking(rentalId)
            const items = await getOwnerBookings()
            setBookings(Array.isArray(items) ? items : [])
        } catch (actionError) { setError(actionError.message) } finally { setBusyId(null) }
    }

    const statusClass = (status) => status === 'PENDING' ? 'bg-orange-50 text-orange-600'
        : ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(status) ? 'bg-blue-50 text-blue-600'
            : status === 'CANCELLED' || status === 'CANCELED' ? 'bg-gray-100 text-gray-600'
                : 'bg-green-50 text-green-600'

    return <div className="min-h-[calc(100vh-68px)] px-6 py-7 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-400"><span>Quản lý cho thuê</span><span>/</span><span className="text-gray-600">Đơn khách đặt</span></div>
                    <h1 className="text-[26px] font-bold text-[#172033]">Đơn khách đặt</h1>
                    <p className="mt-1 text-sm text-gray-500">Đơn đã thanh toán sẽ xuất hiện tại đây để bạn xác nhận và chuẩn bị thiết bị.</p>
                </div>
                <OwnerIcon name="booking" size={14} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Tổng đơn</p><p className="mt-2 text-xl font-bold text-gray-900">{bookings.length}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Chờ xác nhận</p><p className="mt-2 text-xl font-bold text-[#F45116]">{pendingCount}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Đã xác nhận / đang thuê</p><p className="mt-2 text-xl font-bold text-blue-600">{rentingCount}</p></div>
            </div>

            <div className="mt-6 border-b border-gray-200"><div className="flex gap-6 overflow-x-auto">
                {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['renting', 'Đang thuê']].map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm ${tab === key ? 'border-[#F45116] font-semibold text-[#F45116]' : 'border-transparent text-gray-500'}`}>{label}</button>)}
            </div></div>

            {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {loading ? <div className="px-5 py-12 text-center text-sm text-gray-500">Đang tải đơn thuê…</div> : <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left">
                        <thead className="border-b border-gray-200 bg-gray-50"><tr className="text-xs font-semibold uppercase text-gray-500">{['Đơn thuê', 'Khách thuê', 'Thiết bị', 'Thời gian', 'Tổng tiền thuê', 'Trạng thái', 'Thanh toán', ''].map((heading) => <th className="px-4 py-3" key={heading}>{heading}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-100">{filteredBookings.map((booking) => <tr key={booking.rentalId} className="text-sm text-gray-700">
                            <td className="px-4 py-4 font-semibold text-gray-900">#{booking.rentalCode}</td>
                            <td className="px-4 py-4"><p className="font-medium text-gray-800">{booking.renterName}</p><p className="mt-1 text-xs text-gray-400">{booking.renterPhone || 'Chưa có số điện thoại'}</p></td>
                            <td className="max-w-[220px] px-4 py-4">{booking.productNames}</td>
                            <td className="whitespace-nowrap px-4 py-4 text-gray-500">{formatDate(booking.startDate)}<br />→ {formatDate(booking.endDate)}</td>
                            <td className="whitespace-nowrap px-4 py-4 font-semibold">{formatMoney(Number(booking.rentalAmount || 0) + Number(booking.depositAmount || 0))}</td>
                            <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(booking.status)}`}>{statusLabels[booking.status] || booking.status}</span></td>
                            <td className="px-4 py-4"><span className={booking.paymentStatus === 'PAID' ? 'font-semibold text-emerald-600' : 'text-gray-500'}>{booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></td>
                            <td className="px-4 py-4"><div className="flex flex-col items-start gap-1.5">{booking.status === 'PENDING' && <button disabled={busyId === booking.rentalId} onClick={() => confirm(booking.rentalId)} type="button" className="whitespace-nowrap rounded-lg bg-[#F45116] px-3 py-2 text-xs font-semibold text-white hover:bg-[#df450f] disabled:opacity-60">{busyId === booking.rentalId ? 'Đang lưu…' : 'Xác nhận đơn'}</button>}{['CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(booking.status) && <button disabled={busyId === booking.rentalId} onClick={() => complete(booking.rentalId)} type="button" className="whitespace-nowrap rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">{busyId === booking.rentalId ? 'Đang lưu…' : 'Đã trả thiết bị'}</button>}{['PENDING','CONFIRMED'].includes(booking.status) && booking.startDate > new Date().toISOString().slice(0,10) && <button disabled={busyId === booking.rentalId} onClick={() => cancel(booking.rentalId)} type="button" className="whitespace-nowrap rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60">Hủy sản phẩm</button>}{!['PENDING','CONFIRMED','ACTIVE','IN_PROGRESS','RENTING'].includes(booking.status) && <span className="text-xs text-gray-400">—</span>}</div></td>
                        </tr>)}</tbody>
                    </table>
                </div>}
                {!loading && !error && filteredBookings.length === 0 && <div className="px-5 py-12 text-center text-sm text-gray-500">{bookings.length ? 'Không có đơn trong trạng thái này.' : 'Các đơn khách thuê thiết bị của bạn sẽ hiển thị tại đây.'}</div>}
            </div>
        </div>
    </div>
}
