import { useMemo, useState } from 'react'
import { products } from '../../data/products'

export default function Revenue() {
    const [period, setPeriod] = useState('6months')

    const revenueData = useMemo(() => {
        if (period === '6months') {
            return [
                { month: 'T5', revenue: 18500000 },
                { month: 'T6', revenue: 22300000 },
                { month: 'T7', revenue: 19800000 },
                { month: 'T8', revenue: 27600000 },
                { month: 'T9', revenue: 31200000 },
                { month: 'T10', revenue: 35800000 },
            ]
        }

        if (period === '3months') {
            return [
                { month: 'T8', revenue: 27600000 },
                { month: 'T9', revenue: 31200000 },
                { month: 'T10', revenue: 35800000 },
            ]
        }

        return [
            { month: 'T10', revenue: 35800000 },
        ]
    }, [period])

    const totalRevenue = revenueData.reduce(
        (sum, item) => sum + item.revenue,
        0
    )

    const maxRevenue = Math.max(
        ...revenueData.map((item) => item.revenue)
    )

    const formatMoney = (value) => {
        return value.toLocaleString('vi-VN') + 'đ'
    }

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

                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F45116]"
                    >
                        <option value="1month">Tháng hiện tại</option>
                        <option value="3months">3 tháng gần nhất</option>
                        <option value="6months">6 tháng gần nhất</option>
                    </select>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">
                            Tổng doanh thu
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {formatMoney(totalRevenue)}
                        </p>

                        <p className="mt-2 text-xs text-green-600">
                            ↑ 12.5% so với kỳ trước
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">
                            Số thiết bị
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {products.length}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                            Thiết bị đang quản lý
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">
                            Doanh thu trung bình
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {formatMoney(
                                Math.round(totalRevenue / revenueData.length)
                            )}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                            Trung bình mỗi tháng
                        </p>
                    </div>
                </div>

                {/* Chart */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900">
                            Doanh thu theo tháng
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Biểu đồ tổng doanh thu từ hoạt động cho thuê.
                        </p>
                    </div>

                    <div className="flex h-[350px] items-end gap-4 border-b border-l border-gray-200 px-4 pb-0 pt-5">

                        {revenueData.map((item) => {
                            const height =
                                maxRevenue > 0
                                    ? (item.revenue / maxRevenue) * 100
                                    : 0

                            return (
                                <div
                                    key={item.month}
                                    className="flex h-full flex-1 flex-col justify-end"
                                >
                                    <div className="group relative flex flex-1 items-end justify-center">

                                        <div
                                            className="w-full max-w-[70px] rounded-t-lg bg-[#F45116] transition-all hover:bg-[#d9440d]"
                                            style={{
                                                height: `${height}%`,
                                            }}
                                        >
                                            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white group-hover:block">
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

                {/* Product revenue */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white">

                    <div className="border-b border-gray-100 px-6 py-5">
                        <h2 className="text-lg font-bold text-gray-900">
                            Thiết bị đang quản lý
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-100">

                        {products.map((product, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                            >

                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-gray-50">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="max-h-14 max-w-[75px] object-contain"
                                        />
                                    </div>

                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {product.name}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {product.type}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left md:text-right">
                                    <p className="text-xs text-gray-500">
                                        Giá thuê / ngày
                                    </p>

                                    <p className="mt-1 font-bold text-[#F45116]">
                                        {formatMoney(product.price)}
                                    </p>
                                </div>

                            </div>
                        ))}

                    </div>
                </div>

            </main>
        </div>
    )
}