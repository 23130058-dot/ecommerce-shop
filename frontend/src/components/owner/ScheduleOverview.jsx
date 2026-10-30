
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOwnerScheduleOverview } from '../../services/ownerApi'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const formatCurrency = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value || 0))

const formatShortCurrency = (value) => {
    const amount = Number(value || 0)

    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toLocaleString('vi-VN', {
            maximumFractionDigits: 1,
        })}M`
    }

    return formatCurrency(amount)
}

const toDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const parseDate = (value) => {
    if (!value) return null
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value) => {
    const date = parseDate(value)
    return date
        ? date.toLocaleDateString('vi-VN')
        : 'Chưa xác định'
}

const getMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const getMonday = (date) => {
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    const weekday = (result.getDay() + 6) % 7
    result.setDate(result.getDate() - weekday)
    return result
}

const getStatusInfo = (status) => {
    const normalized = String(status || '').toUpperCase()

    if (['ACTIVE', 'RENTING'].includes(normalized)) {
        return {
            label: 'ĐANG THUÊ',
            className: 'bg-green-50 text-green-600',
            color: 'bg-emerald-400',
        }
    }

    if (['PENDING'].includes(normalized)) {
        return {
            label: 'CHỜ GIAO',
            className: 'bg-amber-50 text-amber-600',
            color: 'bg-amber-400',
        }
    }

    if (['CONFIRMED'].includes(normalized)) {
        return {
            label: 'ĐÃ XÁC NHẬN',
            className: 'bg-blue-50 text-blue-600',
            color: 'bg-emerald-400',
        }
    }

    if (['MAINTENANCE'].includes(normalized)) {
        return {
            label: 'BẢO TRÌ',
            className: 'bg-blue-50 text-blue-600',
            color: 'bg-blue-500',
        }
    }

    return {
        label: normalized || 'KHÔNG XÁC ĐỊNH',
        className: 'bg-gray-100 text-gray-500',
        color: 'bg-gray-300',
    }
}

export default function ScheduleOverview() {
    const navigate = useNavigate()

    const [currentDate, setCurrentDate] = useState(() => new Date())
    const [viewMode, setViewMode] = useState('month')
    const [selectedDate, setSelectedDate] = useState(() => new Date())
    const [data, setData] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const monthKey = getMonthKey(currentDate)

    const loadData = useCallback(async () => {
        setError('')

        try {
            const result = await getOwnerScheduleOverview(monthKey)
            setData(result)
        } catch (err) {
            setError(err.message || 'Không thể tải dữ liệu lịch tổng quan.')
        } finally {
            setLoading(false)
        }
    }, [monthKey])

    useEffect(() => {
        let cancelled = false

        const fetchData = async () => {
            try {
                const result = await getOwnerScheduleOverview(monthKey)

                if (!cancelled) {
                    setData(result)
                    setError('')
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || 'Không thể tải dữ liệu lịch tổng quan.'
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchData()

        return () => {
            cancelled = true
        }
    }, [monthKey])

    const events = data?.calendarEvents || []
    const orders = data?.recentOrders || []
    const stats = data?.stats || {}

    const filteredOrders = useMemo(() => {
        const keyword = searchTerm.trim().toLocaleLowerCase('vi-VN')
        if (!keyword) return orders

        return orders.filter((order) =>
            [
                order.customer,
                order.code,
                order.device,
                order.status,
            ].some((value) =>
                String(value || '')
                    .toLocaleLowerCase('vi-VN')
                    .includes(keyword)
            )
        )
    }, [orders, searchTerm])

    const calendarDays = useMemo(() => {
        if (viewMode === 'day') {
            return [new Date(selectedDate)]
        }

        if (viewMode === 'week') {
            const start = getMonday(selectedDate)

            return Array.from({ length: 7 }, (_, index) => {
                const date = new Date(start)
                date.setDate(start.getDate() + index)
                return date
            })
        }

        const firstDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        )
        const start = getMonday(firstDay)

        // Luôn hiển thị 6 hàng để lịch không nhảy kích thước giữa các tháng.
        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(start)
            date.setDate(start.getDate() + index)
            return date
        })
    }, [currentDate, selectedDate, viewMode])

    const monthLabel = currentDate.toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric',
    })

    const changeMonth = (offset) => {
        setCurrentDate((previous) =>
            new Date(
                previous.getFullYear(),
                previous.getMonth() + offset,
                1
            )
        )
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentDate(today)
        setSelectedDate(today)
    }

    const maintenanceEvents = data?.maintenanceEvents || []
    const nextMaintenance = maintenanceEvents[0]

    return (
        <div className="min-h-screen bg-[#F8F9FB] px-6 py-6">
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                <span>Lịch trình &amp; Giá</span>
                <span>/</span>
                <span className="text-gray-700">Lịch tổng quan</span>
            </div>

            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Lịch tổng quan
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Theo dõi và quản lý lịch thiết bị của bạn tập trung.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/owner/schedule-settings')}
                    className="shrink-0 rounded-lg bg-[#F45116] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#d9400d]"
                >
                    + Thiết lập lịch
                </button>
            </div>

            {error && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={loadData}
                        className="font-medium underline"
                    >
                        Thử tải lại
                    </button>
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="TỔNG ĐƠN TRONG THÁNG"
                    value={stats.ordersThisMonth ?? '—'}
                    description="Đơn có thời gian thuê trong tháng đang xem"
                    icon="▣"
                />

                <StatCard
                    title="THIẾT BỊ ĐANG CHO THUÊ"
                    value={stats.activeProducts ?? '—'}
                    description={`Trong tổng số ${stats.totalProducts ?? '—'} thiết bị`}
                    icon="▰"
                />

                <StatCard
                    title="DOANH THU DỰ KIẾN"
                    value={
                        stats.expectedRevenue == null
                            ? '—'
                            : formatShortCurrency(stats.expectedRevenue)
                    }
                    description="Tổng giá trị thuê của đơn chưa hủy trong tháng"
                    icon="₫"
                />

                <StatCard
                    title="TỈ LỆ LẤY MÁY ĐÚNG HẸN"
                    value={
                        stats.onTimeRate == null
                            ? '—'
                            : `${Number(stats.onTimeRate).toLocaleString('vi-VN')}%`
                    }
                    description={
                        stats.onTimeRate == null
                            ? 'Chưa có dữ liệu bàn giao thực tế'
                            : 'Theo dữ liệu bàn giao đã ghi nhận'
                    }
                    icon="✓"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <CalendarSection
                    currentDate={currentDate}
                    monthLabel={monthLabel}
                    viewMode={viewMode}
                    selectedDate={selectedDate}
                    calendarDays={calendarDays}
                    events={events}
                    loading={loading}
                    onPrevious={() => changeMonth(-1)}
                    onNext={() => changeMonth(1)}
                    onToday={goToToday}
                    onViewChange={setViewMode}
                    onSelectDate={setSelectedDate}
                    onMonthChange={(value) => {
                        const [year, month] = value.split('-').map(Number)
                        setCurrentDate(new Date(year, month - 1, 1))
                    }}
                />

                <div className="space-y-5">
                    <RecentOrders
                        orders={filteredOrders}
                        searchTerm={searchTerm}
                        onSearch={setSearchTerm}
                        loading={loading}
                        onViewAll={() => navigate('/owner/bookings')}
                    />

                    <MaintenanceReminder
                        event={nextMaintenance}
                        onOpen={() => navigate('/owner/schedule-settings')}
                    />
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, description, icon }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-800">
                        {value}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                        {description}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF1EB] text-sm font-semibold text-[#F45116]">
                    {icon}
                </div>
            </div>
        </div>
    )
}

function CalendarSection({
                             currentDate,
                             monthLabel,
                             viewMode,
                             selectedDate,
                             calendarDays,
                             events,
                             loading,
                             onPrevious,
                             onNext,
                             onToday,
                             onViewChange,
                             onSelectDate,
                             onMonthChange,
                         }) {
    const visibleEvents = (date) => {
        const key = toDateKey(date)

        return events.filter((event) => {
            return event.startDate <= key && event.endDate >= key
        })
    }

    const sameMonth = (date) =>
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()

    const todayKey = toDateKey(new Date())
    const selectedKey = toDateKey(selectedDate)

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        aria-label="Thời gian trước"
                        onClick={onPrevious}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                    </button>

                    <h2 className="min-w-[130px] text-center text-sm font-semibold capitalize text-gray-800">
                        {monthLabel}
                    </h2>

                    <button
                        type="button"
                        aria-label="Thời gian tiếp theo"
                        onClick={onNext}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                        ›
                    </button>

                    <button
                        type="button"
                        onClick={onToday}
                        className="ml-2 rounded-lg bg-gray-50 px-3 py-2 text-[10px] font-medium text-gray-600 hover:bg-gray-100"
                    >
                        HÔM NAY
                    </button>

                    <input
                        aria-label="Chọn tháng"
                        type="month"
                        value={`${currentDate.getFullYear()}-${String(
                            currentDate.getMonth() + 1
                        ).padStart(2, '0')}`}
                        onChange={(event) => onMonthChange(event.target.value)}
                        className="max-w-[145px] rounded-lg border border-gray-200 px-2 py-1.5 text-[10px] text-gray-600"
                    />
                </div>

                <div className="flex rounded-lg bg-gray-100 p-1">
                    {[
                        ['month', 'Tháng'],
                        ['week', 'Tuần'],
                        ['day', 'Ngày'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onViewChange(value)}
                            className={`rounded-md px-4 py-1.5 text-[10px] font-medium ${
                                viewMode === value
                                    ? 'bg-white text-gray-700 shadow-sm'
                                    : 'text-gray-500'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <p className="mb-3 text-xs text-gray-400">
                    Đang tải dữ liệu lịch...
                </p>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="grid grid-cols-7 bg-gray-50">
                    {WEEKDAYS.map((day) => (
                        <div
                            key={day}
                            className="border-r border-gray-200 py-3 text-center text-[10px] font-semibold text-gray-500 last:border-r-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {calendarDays.map((date) => {
                        const key = toDateKey(date)
                        const dayEvents = visibleEvents(date)
                        const isOutsideMonth =
                            viewMode === 'month' && !sameMonth(date)
                        const isSelected = key === selectedKey
                        const isToday = key === todayKey

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onSelectDate(date)}
                                aria-label={`Chọn ngày ${formatDate(key)}`}
                                className={`min-h-[82px] min-w-0 border-r border-t border-gray-200 p-2 text-left transition hover:bg-gray-50 ${
                                    isOutsideMonth
                                        ? 'bg-gray-50/60'
                                        : 'bg-white'
                                } ${isSelected ? 'ring-2 ring-inset ring-[#F45116]' : ''}`}
                            >
                                <span
                                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] ${
                                        isToday
                                            ? 'bg-[#F45116] font-semibold text-white'
                                            : isOutsideMonth
                                                ? 'text-gray-300'
                                                : 'text-gray-500'
                                    }`}
                                >
                                    {date.getDate()}
                                </span>

                                <div className="mt-1 space-y-1">
                                    {dayEvents.slice(0, 2).map((event) => {
                                        const status = getStatusInfo(event.status)

                                        return (
                                            <div
                                                key={`${event.id}-${key}`}
                                                title={`${event.code || ''} ${event.productName || ''}`}
                                                className={`truncate rounded px-1 py-1 text-[8px] font-medium text-white ${status.color}`}
                                            >
                                                {event.productName || event.title}
                                            </div>
                                        )
                                    })}

                                    {dayEvents.length > 2 && (
                                        <p className="text-[8px] text-gray-400">
                                            +{dayEvents.length - 2} lịch khác
                                        </p>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <Legend color="bg-emerald-400" label="Đang cho thuê / Đã xác nhận" />
                <Legend color="bg-amber-400" label="Chờ xử lý" />
                <Legend color="bg-blue-500" label="Bảo trì / Lịch bận" />
                <Legend color="bg-gray-300" label="Ngày thường" />
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 px-3 py-3">
                <p className="text-xs font-semibold text-gray-700">
                    Lịch ngày {formatDate(selectedKey)}
                </p>
                {visibleEvents(selectedDate).length === 0 ? (
                    <p className="mt-1 text-[11px] text-gray-400">
                        Không có đơn thuê hoặc lịch bảo trì trong ngày này.
                    </p>
                ) : (
                    <div className="mt-2 space-y-2">
                        {visibleEvents(selectedDate).map((event) => (
                            <div
                                key={event.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
                            >
                                <span className="text-gray-700">
                                    {event.code ? `${event.code} · ` : ''}
                                    {event.productName || event.title}
                                </span>
                                <span className="text-gray-400">
                                    {formatDate(event.startDate)} – {formatDate(event.endDate)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function Legend({ color, label }) {
    return (
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span>{label}</span>
        </div>
    )
}

function RecentOrders({ orders, searchTerm, onSearch, loading, onViewAll }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-800">
                    Đơn đặt gần đây
                </h2>

                <span className="rounded-full bg-[#FFF1EB] px-2.5 py-1 text-[9px] font-medium text-[#F45116]">
                    {orders.length} ĐƠN
                </span>
            </div>

            <div className="mb-3 flex h-9 items-center rounded-lg bg-gray-50 px-3">
                <span className="mr-2 text-gray-400">⌕</span>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => onSearch(event.target.value)}
                    placeholder="Tìm kiếm khách hàng, mã đơn..."
                    className="w-full bg-transparent text-[10px] text-gray-600 outline-none placeholder:text-gray-400"
                />
            </div>

            {loading ? (
                <p className="py-4 text-center text-[10px] text-gray-400">
                    Đang tải đơn đặt...
                </p>
            ) : orders.length === 0 ? (
                <p className="py-4 text-center text-[10px] text-gray-400">
                    Không tìm thấy đơn đặt phù hợp.
                </p>
            ) : (
                <div className="space-y-2">
                    {orders.map((order) => {
                        const status = getStatusInfo(order.status)

                        return (
                            <div
                                key={order.id}
                                className="rounded-lg border border-gray-100 p-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold text-gray-700">
                                            {order.customer || 'Khách thuê'}
                                        </p>
                                        <p className="mt-1 truncate text-[9px] text-gray-400">
                                            {order.device || 'Thiết bị'}
                                        </p>
                                        <p className="mt-1 text-[9px] text-gray-400">
                                            {order.code || ''}
                                            {order.startDate
                                                ? ` · ${formatDate(order.startDate)}`
                                                : ''}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-medium ${status.className}`}
                                    >
                                        {status.label}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <button
                type="button"
                onClick={onViewAll}
                className="mt-4 w-full text-center text-[10px] font-medium text-[#F45116] hover:underline"
            >
                XEM TẤT CẢ ĐƠN ĐẶT
            </button>
        </div>
    )
}

function MaintenanceReminder({ event, onOpen }) {
    return (
        <div className="rounded-xl border border-orange-200 bg-[#FFF9F5] p-5">
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[#F45116]">
                    !
                </span>

                <h3 className="text-sm font-semibold text-[#C2410C]">
                    Nhắc nhở bảo trì
                </h3>
            </div>

            {event ? (
                <>
                    <p className="mt-3 text-[10px] leading-5 text-gray-500">
                        {event.productName || 'Thiết bị'}
                        {' — '}
                        {event.title || 'Lịch bảo trì'}
                        {event.startDate
                            ? `, ngày ${formatDate(event.startDate)}`
                            : ''}
                    </p>
                </>
            ) : (
                <p className="mt-3 text-[10px] leading-5 text-gray-500">
                    Chưa có lịch bảo trì sắp tới được ghi nhận trong hệ thống.
                </p>
            )}

            <button
                type="button"
                onClick={onOpen}
                className="mt-4 w-full rounded-lg bg-[#F45116] py-2.5 text-[10px] font-medium text-white transition hover:bg-[#d9400d]"
            >
                ĐẶT LỊCH BẢO TRÌ
            </button>
        </div>
    )
}
