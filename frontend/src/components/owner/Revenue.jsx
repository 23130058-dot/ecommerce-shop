
import { useEffect, useState, useMemo } from 'react'
import {getOwnerRevenue, getOwnerProducts,} from '../../api/ownerApi'
import { ownerDashboardData } from '../../data/ownerData'
const API_URL = import.meta.env.VITE_API_URL || ''

const MONTHS = [
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
    'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
]

export default function Revenue() {
    const [period, setPeriod] = useState('12months')
    const [year, setYear] = useState(new Date().getFullYear())
    const [revenueData, setRevenueData] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')


    useEffect(() => {
        const controller = new AbortController()

        async function fetchRevenue() {
            setLoading(true)
            setError('')

            try {
                const response = await fetch(
                    `${API_URL}/api/owner/revenue?year=${year}`,
                    {
                        method: 'GET',
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    }
                )

                if (!response.ok) {
                    throw new Error('Không thể tải dữ liệu doanh thu.')
                }

                const data = await response.json()
                const source = Array.isArray(data.monthlyRevenue)
                    ? data.monthlyRevenue
                    : []

                setRevenueData(
                    MONTHS.map((month, index) => {
                        const monthNumber = index + 1
                        const found = source.find(
                            item => Number(item.month) === monthNumber
                        )

                        return {
                            month,
                            monthNumber,
                            revenue: Number(found?.revenue ?? 0),
                        }
                    })
                )

                setProducts(Array.isArray(data.products) ? data.products : [])
            } catch (err) {
                if (err.name === 'AbortError') return

                const yearData = ownerDashboardData.revenueChart.find(
                    item => Number(item.year) === Number(year)
                )

                const source = yearData?.monthlyRevenue || []

                setRevenueData(
                    MONTHS.map((month, index) => {
                        const monthNumber = index + 1
                        const found = source.find(
                            item => Number(item.month) === monthNumber
                        )

                        return {
                            month,
                            monthNumber,
                            revenue: Number(found?.revenue ?? 0),
                        }
                    })
                )

                setProducts([])
                setError('Đang hiển thị dữ liệu mẫu vì chưa kết nối được API.')
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        fetchRevenue()

        return () => controller.abort()
    }, [year])

    // Khoảng thời gian dùng để tính các thẻ thống kê.
    // Biểu đồ vẫn luôn hiển thị đủ 12 tháng.
    const selectedMonths = useMemo(() => {
        const currentMonth = new Date().getMonth() + 1

        if (year < new Date().getFullYear()) {
            if (period === '1month') return [12]
            if (period === '3months') return [10, 11, 12]
            return MONTHS.map((_, index) => index + 1)
        }

        if (period === '1month') return [currentMonth]

        if (period === '3months') {
            return Array.from({ length: 3 }, (_, index) => {
                return ((currentMonth - 3 + index + 12) % 12) + 1
            }).filter((month) => month <= currentMonth)
        }

        return Array.from({ length: currentMonth }, (_, index) => index + 1)
    }, [period, year])

    const filteredRevenue = useMemo(
        () =>
            revenueData.filter((item) =>
                selectedMonths.includes(item.monthNumber),
            ),
        [revenueData, selectedMonths],
    )

    const totalRevenue = filteredRevenue.reduce(
        (sum, item) => sum + item.revenue,
        0,
    )

    const maxRevenue = Math.max(
        1,
        ...revenueData.map((item) => item.revenue),
    )

    const averageRevenue = filteredRevenue.length
        ? Math.round(totalRevenue / filteredRevenue.length)
        : 0

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString('vi-VN') + 'đ'

    return (
        <div className="min-h-screen bg-[#f7f7f8]">
            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Header */}
                <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm text-gray-500">
                            Báo cáo / Doanh thu
                        </p>

                        <h1 className="mt-1 text-3xl font-bold text-gray-900">
                            Báo cáo doanh thu
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Theo dõi doanh thu từ các thiết bị cho thuê.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F45116]"
                            aria-label="Chọn năm"
                        >
                            {Array.from(
                                { length: 5 },
                                (_, index) => new Date().getFullYear() - index,
                            ).map((itemYear) => (
                                <option key={itemYear} value={itemYear}>
                                    Năm {itemYear}
                                </option>
                            ))}
                        </select>

                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F45116]"
                            aria-label="Chọn khoảng thời gian"
                        >
                            <option value="1month">Tháng hiện tại</option>
                            <option value="3months">3 tháng gần nhất</option>
                            <option value="12months">Cả năm (12 tháng)</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                        <p className="mt-1">
                            Kiểm tra backend và API GET /api/owner/revenue.
                        </p>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">Tổng doanh thu</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {loading ? 'Đang tải...' : formatMoney(totalRevenue)}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            Theo khoảng thời gian đã chọn
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">Số thiết bị</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {loading ? 'Đang tải...' : products.length}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            Thiết bị được trả về từ database
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">Doanh thu trung bình</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {loading ? 'Đang tải...' : formatMoney(averageRevenue)}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            Trung bình mỗi tháng trong khoảng đã chọn
                        </p>
                    </div>
                </div>

                {/* Chart: always 12 months */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900">
                            Doanh thu theo tháng
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Dữ liệu năm {year}. Biểu đồ luôn hiển thị đủ 12 tháng.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="flex h-[350px] min-w-[650px] items-end gap-3 border-b border-l border-gray-200 px-4 pt-5">
                            {revenueData.map((item) => {
                                const height =
                                    item.revenue > 0
                                        ? Math.max((item.revenue / maxRevenue) * 100, 2)
                                        : 0

                                const isSelected = selectedMonths.includes(
                                    item.monthNumber,
                                )

                                return (
                                    <div
                                        key={item.monthNumber}
                                        className="flex h-full min-w-0 flex-1 flex-col justify-end"
                                    >
                                        <div className="group relative flex flex-1 items-end justify-center">
                                            <div
                                                title={`${item.month}: ${formatMoney(item.revenue)}`}
                                                className={`relative w-full max-w-[70px] rounded-t-lg transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#F45116] hover:bg-[#d9440d]'
                                                        : 'bg-gray-300 hover:bg-gray-400'
                                                }`}
                                                style={{ height: `${height}%` }}
                                            >
                                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white group-hover:block">
                                                    {formatMoney(item.revenue)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-10 pt-3 text-center text-sm font-medium text-gray-500">
                                            {item.month}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#F45116]" />
              Tháng thuộc khoảng đang chọn
            </span>
                        <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-gray-300" />
              Tháng ngoài khoảng đang chọn
            </span>
                    </div>
                </div>

                {/* Products from database */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-6 py-5">
                        <h2 className="text-lg font-bold text-gray-900">
                            Thiết bị đang quản lý
                        </h2>
                    </div>

                    {loading ? (
                        <p className="px-6 py-8 text-sm text-gray-500">
                            Đang tải danh sách thiết bị...
                        </p>
                    ) : products.length === 0 ? (
                        <p className="px-6 py-8 text-sm text-gray-500">
                            Chưa có dữ liệu thiết bị từ backend.
                        </p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {products.map((product, index) => (
                                <div
                                    key={product.id ?? index}
                                    className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                                            {product.imageUrl || product.image ? (
                                                <img
                                                    src={product.imageUrl || product.image}
                                                    alt={product.name}
                                                    className="max-h-14 max-w-[75px] object-contain"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400">
                          Thiết bị
                        </span>
                                            )}
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {product.name}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {product.type || product.category || 'Thiết bị cho thuê'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-xs text-gray-500">
                                            Giá thuê / ngày
                                        </p>
                                        <p className="mt-1 font-bold text-[#F45116]">
                                            {formatMoney(product.pricePerDay ?? product.price)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
