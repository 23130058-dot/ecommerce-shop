import { useEffect, useMemo, useState } from 'react'
import OwnerIcon from './OwnerIcon'
import ConfirmDialog from '../layout/ConfirmDialog.jsx'
import { showToast } from '../../services/toast.js'
import DataTable from '../shared/DataTable.jsx'
import { cancelOwnerBooking, confirmOwnerBooking, getOwnerBookings, handoverOwnerBooking } from '../../services/ownerApi.js'

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ'
const formatDate = (value) => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—'
const statusLabels = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', ACTIVE: 'Đang thuê', IN_PROGRESS: 'Đang thuê', RENTING: 'Đang thuê', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy', CANCELED: 'Đã hủy' }

export default function BookingList() {
    const [tab, setTab] = useState('all')
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState(null)
    const [confirmation, setConfirmation] = useState(null)

    useEffect(() => {
        const controller = new AbortController()
        getOwnerBookings({ signal: controller.signal })
            .then((items) => setBookings(Array.isArray(items) ? items : []))
            .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [])

    const pendingCount = bookings.filter((booking) => booking.status === 'PENDING').length
    const rentingCount = bookings.filter((booking) => ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(booking.status)).length
    const filteredBookings = useMemo(() => bookings.filter((booking) => {
        if (tab === 'pending') return booking.status === 'PENDING'
        if (tab === 'confirmed') return booking.status === 'CONFIRMED'
        if (tab === 'renting') return ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(booking.status)
        return true
    }), [bookings, tab])

    const confirm = async (rentalId) => {
        setBusyId(rentalId)
        try {
            await confirmOwnerBooking(rentalId)
            setBookings((previous) => previous.map((booking) => booking.rentalId === rentalId ? { ...booking, status: 'CONFIRMED' } : booking))
            showToast('Đã xác nhận đơn thuê.', 'success')
        } catch (actionError) {
            showToast(actionError.message, 'error')
        } finally {
            setBusyId(null)
        }
    }

    const handover = async (rentalId) => {
        setBusyId(rentalId)
        try {
            await handoverOwnerBooking(rentalId)
            setBookings((previous) => previous.map((booking) => booking.rentalId === rentalId ? { ...booking, status: 'ACTIVE' } : booking))
            setConfirmation(null)
            showToast('Đã xác nhận bàn giao. Đơn đang ở trạng thái Đang thuê.', 'success')
        } catch (actionError) {
            setConfirmation(null)
            showToast(actionError.message, 'error')
        } finally {
            setBusyId(null)
        }
    }

    const cancel = async (rentalId) => {
        setBusyId(rentalId)
        try {
            await cancelOwnerBooking(rentalId)
            const items = await getOwnerBookings()
            setBookings(Array.isArray(items) ? items : [])
            setConfirmation(null)
            showToast('Đã hủy sản phẩm khỏi đơn thuê.', 'success')
        } catch (actionError) {
            setConfirmation(null)
            showToast(actionError.message, 'error')
        } finally {
            setBusyId(null)
        }
    }
    const statusClass = (status) => status === 'PENDING' ? 'bg-orange-50 text-orange-600'
        : ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(status) ? 'bg-blue-50 text-blue-600'
            : status === 'CANCELLED' || status === 'CANCELED' ? 'bg-gray-100 text-gray-600'
                : 'bg-green-50 text-green-600'

    const columns = [
        { key: 'rentalCode', header: 'Đơn thuê', className: 'whitespace-nowrap', render: (booking) => <span className="font-semibold text-gray-900">#{booking.rentalCode}</span> },
        { key: 'renterName', header: 'Khách thuê', render: (booking) => <><p className="font-medium text-gray-800">{booking.renterName}</p><p className="mt-1 text-[10px] text-gray-400">{booking.renterPhone || 'Chưa có số điện thoại'}</p></> },
        { key: 'productNames', header: 'Thiết bị', className: 'min-w-[180px]' },
        { key: 'startDate', header: 'Thời gian', className: 'whitespace-nowrap', render: (booking) => <span>{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</span> },
        { key: 'rentalAmount', header: 'Tổng tiền thuê', className: 'whitespace-nowrap', render: (booking) => <span className="font-semibold">{formatMoney(Number(booking.rentalAmount || 0) + Number(booking.depositAmount || 0))}</span> },
        { key: 'status', header: 'Trạng thái', render: (booking) => <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass(booking.status)}`}>{statusLabels[booking.status] || booking.status}</span> },
        { key: 'paymentStatus', header: 'Thanh toán', render: (booking) => <span className={booking.paymentStatus === 'PAID' ? 'font-semibold text-emerald-600' : 'text-gray-500'}>{booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span> },
        { key: 'actions', header: 'Thao tác', searchable: false, sortable: false, className: 'min-w-[150px]', render: (booking) => <div className="flex flex-col items-start gap-1.5">
            {booking.status === 'PENDING' && <button disabled={busyId === booking.rentalId} onClick={() => confirm(booking.rentalId)} type="button" className="whitespace-nowrap rounded-lg bg-[#F45116] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#df450f] disabled:opacity-60">{busyId === booking.rentalId ? 'Đang lưu…' : 'Xác nhận đơn'}</button>}
            {booking.status === 'CONFIRMED' && <button disabled={busyId === booking.rentalId} onClick={() => setConfirmation({ rentalId: booking.rentalId, title: 'Xác nhận bàn giao?', message: 'Xác nhận bạn đã bàn giao thiết bị cho người thuê? Đơn sẽ chuyển sang trạng thái Đang thuê.', confirmLabel: 'Đã bàn giao', tone: 'primary', action: () => handover(booking.rentalId) })} type="button" className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busyId === booking.rentalId ? 'Đang lưu…' : 'Xác nhận bàn giao'}</button>}
            {['PENDING','CONFIRMED'].includes(booking.status) && booking.startDate > new Date().toISOString().slice(0,10) && <button disabled={busyId === booking.rentalId} onClick={() => setConfirmation({ rentalId: booking.rentalId, title: 'Hủy sản phẩm khỏi đơn?', message: 'Hủy sản phẩm của bạn trong đơn thuê này? Nếu đơn có sản phẩm Owner khác, các sản phẩm đó vẫn được giữ.', confirmLabel: 'Hủy sản phẩm', tone: 'danger', action: () => cancel(booking.rentalId) })} type="button" className="whitespace-nowrap rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60">Hủy sản phẩm</button>}
            {!['PENDING','CONFIRMED'].includes(booking.status) && <span className="text-xs text-gray-400">—</span>}
        </div> },
    ]

    return <div className="px-6 py-7 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-400"><span>Quản lý cho thuê</span><span>/</span><span className="text-gray-600">Đơn khách đặt</span></div>
                    <h1 className="text-[26px] font-bold text-[#172033]">Đơn khách đặt</h1>
                    <p className="mt-1 text-sm text-gray-500">Xác nhận đơn khi đồng ý cho thuê, sau đó chọn “Xác nhận bàn giao” khi đã giao thiết bị để chuyển sang trạng thái Đang thuê.</p>
                </div>
                <OwnerIcon name="booking" size={14} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Tổng đơn</p><p className="mt-2 text-xl font-bold text-gray-900">{bookings.length}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Chờ xác nhận</p><p className="mt-2 text-xl font-bold text-[#F45116]">{pendingCount}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Đang thuê</p><p className="mt-2 text-xl font-bold text-blue-600">{rentingCount}</p></div>
            </div>

            <div className="mt-6 border-b border-gray-200"><div className="flex gap-6 overflow-x-auto">
                {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['renting', 'Đang thuê']].map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm ${tab === key ? 'border-[#F45116] font-semibold text-[#F45116]' : 'border-transparent text-gray-500'}`}>{label}</button>)}
            </div></div>

            <div className="mt-5"><DataTable columns={columns} rows={filteredBookings} rowKey={(booking) => booking.rentalId} loading={loading} error={error} searchable searchPlaceholder="Tìm mã đơn, khách thuê, thiết bị…" emptyMessage={bookings.length ? 'Không có đơn trong trạng thái này.' : 'Các đơn khách thuê thiết bị của bạn sẽ hiển thị tại đây.'} pageSize={10} /></div>
        </div>
        <ConfirmDialog open={Boolean(confirmation)} title={confirmation?.title} message={confirmation?.message} confirmLabel={confirmation?.confirmLabel} tone={confirmation?.tone} busy={busyId === confirmation?.rentalId} onCancel={() => setConfirmation(null)} onConfirm={() => confirmation?.action?.()} />
    </div>
}
