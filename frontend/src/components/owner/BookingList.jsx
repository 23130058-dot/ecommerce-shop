import { useEffect, useMemo, useState } from 'react'
import OwnerIcon from './OwnerIcon'
import ConfirmDialog from '../layout/ConfirmDialog.jsx'
import { showToast } from '../../services/toast.js'
import DataTable from '../shared/DataTable.jsx'
import { cancelOwnerBooking, confirmOwnerBooking, confirmOwnerBookingReturn, confirmOwnerCancellationReturn, getOwnerBookings, handoverOwnerBooking } from '../../services/ownerApi.js'
import { createMarketplaceReport } from '../../services/productApi.js'

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ'
const formatDate = (value) => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—'
const statusLabels = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', ACTIVE: 'Đang thuê', IN_PROGRESS: 'Đang thuê', RENTING: 'Đang thuê', RETURN_PENDING: 'Chờ xác nhận trả thiết bị', RETURN_REQUESTED: 'Chờ xác nhận trả thiết bị', AWAITING_RETURN: 'Chờ xác nhận trả thiết bị', DAMAGE_REPORTED: 'Chờ xử lý hoàn trả', CANCEL_REQUESTED: 'Chờ xác nhận nhận lại thiết bị', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy', CANCELED: 'Đã hủy' }

export default function BookingList() {
    const [tab, setTab] = useState('all')
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState(null)
    const [confirmation, setConfirmation] = useState(null)
    const [detailBooking, setDetailBooking] = useState(null)
    const [reportBooking, setReportBooking] = useState(null)
    const [reportText, setReportText] = useState('')
    const [reportBusy, setReportBusy] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        getOwnerBookings({ signal: controller.signal })
            .then((items) => setBookings(Array.isArray(items) ? items : []))
            .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [])

    const pendingCount = bookings.filter((booking) => booking.status === 'PENDING').length
    const cancelRequestCount = bookings.filter((booking) => booking.status === 'CANCEL_REQUESTED').length
    const rentingCount = bookings.filter((booking) => ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(booking.status)).length
    const filteredBookings = useMemo(() => bookings.filter((booking) => {
        if (tab === 'pending') return booking.status === 'PENDING'
        if (tab === 'confirmed') return booking.status === 'CONFIRMED'
        if (tab === 'renting') return ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(booking.status)
        if (tab === 'cancel') return booking.status === 'CANCEL_REQUESTED'
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
    const confirmCancellationReturn = async (rentalId) => {
        setBusyId(rentalId)
        try {
            await confirmOwnerCancellationReturn(rentalId)
            const items = await getOwnerBookings()
            setBookings(Array.isArray(items) ? items : [])
            setConfirmation(null)
            showToast('Đã xác nhận nhận lại thiết bị và xử lý yêu cầu hủy.', 'success')
        } catch (actionError) {
            setConfirmation(null)
            showToast(actionError.message, 'error')
        } finally { setBusyId(null) }
    }
    const confirmRentalReturn = async (rentalId) => {
        setBusyId(rentalId)
        try {
            await confirmOwnerBookingReturn(rentalId)
            const items = await getOwnerBookings()
            setBookings(Array.isArray(items) ? items : [])
            setConfirmation(null)
            showToast('Đã xác nhận nhận lại thiết bị. Đơn thuê và tiền cọc đã được cập nhật.', 'success')
        } catch (actionError) {
            setConfirmation(null)
            showToast(actionError.message, 'error')
        } finally { setBusyId(null) }
    }
    const reportRenter = async (event) => {
        event.preventDefault()
        if (!reportBooking?.renterId) return
        setReportBusy(true)
        try {
            await createMarketplaceReport({ targetType: 'CUSTOMER', targetUserId: reportBooking.renterId, category: 'Báo cáo khách thuê', description: reportText.trim() })
            setReportBooking(null); setReportText(''); showToast('Đã gửi báo cáo khách thuê để Admin xem xét.', 'success')
        } catch (reportError) { showToast(reportError.message, 'error') }
        finally { setReportBusy(false) }
    }
    const statusClass = (status) => ['PENDING', 'CANCEL_REQUESTED', 'RETURN_PENDING', 'RETURN_REQUESTED', 'AWAITING_RETURN', 'DAMAGE_REPORTED'].includes(status) ? 'bg-orange-50 text-orange-600'
        : ['ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(status) ? 'bg-blue-50 text-blue-600'
            : status === 'CANCELLED' || status === 'CANCELED' ? 'bg-gray-100 text-gray-600'
                : 'bg-green-50 text-green-600'

    const columns = [
        { key: 'rentalCode', header: 'Đơn thuê', className: 'whitespace-nowrap', render: (booking) => <span className="font-semibold text-gray-900">#{booking.rentalCode}</span> },
        { key: 'renterName', header: 'Khách thuê', render: (booking) => <><p className="font-medium text-gray-800">{booking.renterName}</p><p className="mt-1 text-[10px] text-gray-400">{booking.renterPhone || 'Chưa có số điện thoại'}</p></> },
        { key: 'productNames', header: 'Thiết bị', className: 'min-w-[180px]' },
        { key: 'startDate', header: 'Thời gian', className: 'whitespace-nowrap', render: (booking) => <span>{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</span> },
        { key: 'rentalAmount', header: 'Tổng tiền thuê', className: 'whitespace-nowrap', render: (booking) => <span className="font-semibold">{formatMoney(Number(booking.rentalAmount || 0) + Number(booking.depositAmount || 0))}</span> },
        { key: 'status', header: 'Trạng thái', className: 'min-w-[135px]', render: (booking) => <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass(booking.status)}`}>{booking.status === 'CANCEL_REQUESTED' ? 'Chờ xử lý hủy' : statusLabels[booking.status] || booking.status}</span> },
        { key: 'paymentStatus', header: 'Thanh toán', render: (booking) => <span className={booking.paymentStatus === 'PAID' ? 'font-semibold text-emerald-600' : 'text-gray-500'}>{booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span> },
        { key: 'actions', header: 'Thao tác', searchable: false, sortable: false, className: 'min-w-[130px]', render: (booking) => <button type="button" onClick={() => setDetailBooking(booking)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#e94b0a]"><OwnerIcon name="booking" size={13} /> Chi tiết</button> },
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

            <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Tổng đơn</p><p className="mt-2 text-xl font-bold text-gray-900">{bookings.length}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Chờ xác nhận</p><p className="mt-2 text-xl font-bold text-[#F45116]">{pendingCount}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Đang thuê</p><p className="mt-2 text-xl font-bold text-blue-600">{rentingCount}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Yêu cầu hủy</p><p className="mt-2 text-xl font-bold text-rose-600">{cancelRequestCount}</p></div>
            </div>

            <div className="mt-6 border-b border-gray-200"><div className="flex gap-6 overflow-x-auto">
                {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['renting', 'Đang thuê'], ['cancel', `Yêu cầu hủy (${cancelRequestCount})`]].map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm ${tab === key ? 'border-[#F45116] font-semibold text-[#F45116]' : 'border-transparent text-gray-500'}`}>{label}</button>)}
            </div></div>

            <div className="mt-5"><DataTable columns={columns} rows={filteredBookings} rowKey={(booking) => booking.rentalId} loading={loading} error={error} searchable searchPlaceholder="Tìm mã đơn, khách thuê, thiết bị…" emptyMessage={bookings.length ? 'Không có đơn trong trạng thái này.' : 'Các đơn khách thuê thiết bị của bạn sẽ hiển thị tại đây.'} pageSize={10} /></div>
        </div>
        {detailBooking && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailBooking(null) }}>
            <section role="dialog" aria-modal="true" aria-labelledby="booking-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Chi tiết đơn thuê</p><h2 id="booking-detail-title" className="mt-1 text-xl font-bold text-gray-900">#{detailBooking.rentalCode}</h2></div>
                    <button type="button" onClick={() => setDetailBooking(null)} aria-label="Đóng chi tiết" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">✕</button>
                </div>
                <div className="space-y-5 px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4"><div><p className="text-xs text-gray-500">Trạng thái đơn</p><span className={`mt-2 inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(detailBooking.status)}`}>{statusLabels[detailBooking.status] || detailBooking.status}</span></div><div className="text-right"><p className="text-xs text-gray-500">Thanh toán</p><p className={`mt-2 text-sm font-semibold ${detailBooking.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-gray-600'}`}>{detailBooking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p></div></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div><p className="text-xs font-medium text-gray-400">Khách thuê</p><p className="mt-1 text-sm font-semibold text-gray-900">{detailBooking.renterName || '—'}</p><p className="mt-1 text-sm text-gray-500">{detailBooking.renterPhone || 'Chưa có số điện thoại'}</p></div>
                        <div><p className="text-xs font-medium text-gray-400">Thời gian thuê</p><p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(detailBooking.startDate)} – {formatDate(detailBooking.endDate)}</p></div>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-4"><p className="text-xs font-medium text-gray-400">Thiết bị trong đơn</p><p className="mt-2 text-sm font-semibold leading-6 text-gray-800">{detailBooking.productNames || '—'}</p></div>
                    <div className="grid gap-3 rounded-xl border border-gray-100 p-4 sm:grid-cols-3">
                        <div><p className="text-xs text-gray-400">Tiền thuê</p><p className="mt-1 text-sm font-semibold text-gray-800">{formatMoney(detailBooking.rentalAmount)}</p></div>
                        <div><p className="text-xs text-gray-400">Tiền cọc</p><p className="mt-1 text-sm font-semibold text-gray-800">{formatMoney(detailBooking.depositAmount)}</p></div>
                        <div><p className="text-xs text-gray-400">Tổng cộng</p><p className="mt-1 text-sm font-bold text-[#e94b0a]">{formatMoney(Number(detailBooking.rentalAmount || 0) + Number(detailBooking.depositAmount || 0))}</p></div>
                    </div>
                    {detailBooking.status === 'CANCEL_REQUESTED' && <div className="rounded-xl border border-rose-100 bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-800">Khách đang yêu cầu hủy đơn</p><p className="mt-1 text-xs leading-5 text-rose-700">Kiểm tra thiết bị đã được trả về trước khi xác nhận nhận lại và hoàn tất yêu cầu hủy.</p></div>}
                    {['RETURN_PENDING', 'RETURN_REQUESTED', 'AWAITING_RETURN', 'DAMAGE_REPORTED'].includes(String(detailBooking.status).toUpperCase()) && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Người thuê đã yêu cầu trả thiết bị</p><p className="mt-1 text-xs leading-5 text-amber-800">Kiểm tra thiết bị đã thực sự về tay bạn trước khi xác nhận. Hệ thống sẽ cập nhật tồn kho và xử lý tiền cọc theo tình trạng hoàn trả.</p></div>}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
                    <div>{detailBooking.renterId && <button type="button" onClick={() => { setReportBooking(detailBooking); setReportText(''); setDetailBooking(null) }} className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:border-rose-200 hover:text-rose-600">Báo cáo khách thuê</button>}</div>
                    <div className="flex flex-wrap justify-end gap-2">
                        {detailBooking.status === 'PENDING' && <button type="button" disabled={busyId === detailBooking.rentalId} onClick={() => { confirm(detailBooking.rentalId); setDetailBooking(null) }} className="rounded-lg bg-[#F45116] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#df450f] disabled:opacity-60">{busyId === detailBooking.rentalId ? 'Đang lưu…' : 'Xác nhận đơn'}</button>}
                        {detailBooking.status === 'CONFIRMED' && <button type="button" disabled={busyId === detailBooking.rentalId} onClick={() => { setDetailBooking(null); setConfirmation({ rentalId: detailBooking.rentalId, title: 'Xác nhận bàn giao?', message: 'Xác nhận bạn đã bàn giao thiết bị cho người thuê? Đơn sẽ chuyển sang trạng thái Đang thuê.', confirmLabel: 'Đã bàn giao', tone: 'primary', action: () => handover(detailBooking.rentalId) }) }} className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">Xác nhận bàn giao</button>}
                        {['RETURN_PENDING', 'RETURN_REQUESTED', 'AWAITING_RETURN', 'DAMAGE_REPORTED'].includes(String(detailBooking.status).toUpperCase()) && <button type="button" disabled={busyId === detailBooking.rentalId} onClick={() => { setDetailBooking(null); setConfirmation({ rentalId: detailBooking.rentalId, title: 'Xác nhận đã nhận lại thiết bị?', message: 'Chỉ xác nhận sau khi đã kiểm tra và nhận lại thiết bị. Tồn kho sẽ được cập nhật; tiền cọc sẽ được hoàn hoặc giữ chờ xử lý nếu có báo cáo hư hỏng.', confirmLabel: 'Xác nhận đã nhận thiết bị', tone: 'primary', action: () => confirmRentalReturn(detailBooking.rentalId) }) }} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">Xác nhận đã nhận thiết bị</button>}
                        {detailBooking.status === 'CANCEL_REQUESTED' && <button type="button" disabled={busyId === detailBooking.rentalId} onClick={() => { setDetailBooking(null); setConfirmation({ rentalId: detailBooking.rentalId, title: 'Xác nhận đã nhận lại thiết bị?', message: 'Chỉ xác nhận khi thiết bị đã thực sự về tay bạn. Sau khi xác nhận, thiết bị được trả kho và hệ thống hủy đơn, xử lý khoản hoàn tiền cho khách.', confirmLabel: 'Đã nhận lại · xác nhận hủy', tone: 'danger', action: () => confirmCancellationReturn(detailBooking.rentalId) }) }} className="rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60">Xác nhận đã nhận lại</button>}
                        {['PENDING', 'CONFIRMED'].includes(detailBooking.status) && detailBooking.startDate > new Date().toISOString().slice(0, 10) && <button type="button" disabled={busyId === detailBooking.rentalId} onClick={() => { setDetailBooking(null); setConfirmation({ rentalId: detailBooking.rentalId, title: 'Hủy sản phẩm khỏi đơn?', message: 'Hủy sản phẩm của bạn trong đơn thuê này? Nếu đơn có sản phẩm Owner khác, các sản phẩm đó vẫn được giữ.', confirmLabel: 'Hủy sản phẩm', tone: 'danger', action: () => cancel(detailBooking.rentalId) }) }} className="rounded-lg border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Hủy sản phẩm</button>}
                        <button type="button" onClick={() => setDetailBooking(null)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Đóng</button>
                    </div>
                </div>
            </section>
        </div>}
        <ConfirmDialog open={Boolean(confirmation)} title={confirmation?.title} message={confirmation?.message} confirmLabel={confirmation?.confirmLabel} tone={confirmation?.tone} busy={busyId === confirmation?.rentalId} onCancel={() => setConfirmation(null)} onConfirm={() => confirmation?.action?.()} />
        {reportBooking && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={reportRenter} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-lg font-bold">Báo cáo khách thuê</h2><p className="mt-1 text-sm text-gray-500">{reportBooking.renterName} · đơn #{reportBooking.rentalCode}</p><label className="mt-4 block text-sm font-semibold">Mô tả sự việc<textarea required maxLength={2000} rows={4} value={reportText} onChange={(event) => setReportText(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 p-3 font-normal" placeholder="Nêu rõ tình huống, thời gian và thông tin liên quan…" /></label><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setReportBooking(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Đóng</button><button disabled={reportBusy} className="rounded-lg bg-[#F45116] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{reportBusy ? 'Đang gửi…' : 'Gửi báo cáo'}</button></div></form></div>}
    </div>
}
