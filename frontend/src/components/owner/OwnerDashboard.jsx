import { Link } from 'react-router-dom'
import { ownerDashboardData } from '../../data/ownerData'

function formatMoney(value) {
    return value.toLocaleString('vi-VN') + 'đ'
}

export default function OwnerDashboard() {
    const data = ownerDashboardData

    const maxRevenue = Math.max(
        ...data.revenueChart.map((item) => item.value)
    )

    return (
        <main className="min-h-screen bg-[#F7F8FA] px-6 py-7">
            <div className="mx-auto max-w-[1180px]">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#1F2937]">
                            Chào buổi sáng, Việt!
                        </h1>

                        <p className="mt-1 text-sm text-gray-400">
                            Dưới đây là tổng hoạt động kinh doanh của bạn hôm nay.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600">
                            🔔 Thông báo
                            <span className="ml-2 rounded-full bg-[#F45116] px-1.5 py-0.5 text-[10px] text-white">
                2
              </span>
                        </button>

                        <button className="rounded-lg bg-[#F45116] px-4 py-2 text-sm font-semibold text-white">
                            Tải báo cáo tháng 6
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4">

                    <StatCard
                        title="TỔNG DOANH THU THÁNG"
                        value={formatMoney(data.totalRevenue)}
                        note="↑ +12.5% so với tháng trước"
                    />

                    <StatCard
                        title="ĐƠN THUÊ HOÀN TẤT"
                        value={data.completedRentals}
                        note="↑ +8% so với tháng trước"
                    />

                    <StatCard
                        title="YÊU CẦU CHỜ DUYỆT"
                        value={data.pendingRequests}
                        note=""
                    />

                    <StatCard
                        title="ĐÁNH GIÁ TRUNG BÌNH"
                        value={`${data.averageRating}/5.0`}
                        note=""
                    />

                </div>

                {/* Chart + Requests */}
                <div className="mt-5 grid grid-cols-[1fr_290px] gap-5">

                    {/* Chart */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5">

                        <div className="mb-5">
                            <h2 className="font-bold text-gray-800">
                                Biểu đồ tăng trưởng doanh thu
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                                Thống kê 6 tháng đầu năm 2024
                            </p>
                        </div>

                        <div className="flex h-[220px] items-end gap-5 border-b border-gray-100 px-3">

                            {data.revenueChart.map((item) => {
                                const height =
                                    (item.value / maxRevenue) * 100

                                return (
                                    <div
                                        key={item.month}
                                        className="flex h-full flex-1 flex-col justify-end"
                                    >
                                        <div className="flex flex-1 items-end justify-center">
                                            <div
                                                className="w-full rounded-t-md bg-[#F45116]/80"
                                                style={{
                                                    height: `${height}%`,
                                                }}
                                            />
                                        </div>

                                        <span className="py-3 text-center text-[11px] text-gray-400">
                      {item.month}
                    </span>
                                    </div>
                                )
                            })}

                        </div>
                    </div>

                    {/* Pending rentals */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5">

                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-800">
                                    Yêu cầu thuê mới
                                </h2>

                                <p className="mt-1 text-xs text-gray-400">
                                    Đang chờ bạn phê duyệt
                                </p>
                            </div>

                            <Link
                                to="/owner/rental-orders"
                                className="text-xs font-semibold text-[#F45116]"
                            >
                                Xem tất cả
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {data.pendingRentals.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg bg-[#FAFAFA] p-3"
                                >
                                    <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      {item.customer}
                    </span>

                                        <span className="rounded bg-[#FFF4ED] px-2 py-1 text-[10px] font-bold text-[#F45116]">
                      {item.id}
                    </span>
                                    </div>

                                    <p className="mt-2 text-xs text-gray-500">
                                        {item.product}
                                    </p>

                                    <div className="mt-2 flex justify-between text-[11px]">
                    <span className="text-gray-400">
                      📅 {item.date}
                    </span>

                                        <strong className="text-gray-700">
                                            {formatMoney(item.price)}
                                        </strong>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Devices + Transactions */}
                <div className="mt-5 grid grid-cols-2 gap-5">

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-800">
                                    Thiết bị đang đăng
                                </h2>

                                <p className="mt-1 text-xs text-gray-400">
                                    Quản lý kho thiết bị của bạn
                                </p>
                            </div>

                            <Link
                                to="/owner/equipment/add"
                                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                            >
                                + Thêm thiết bị
                            </Link>
                        </div>

                        {[
                            ['Sony A7IV Mirrorless Camera', '1,200,000 VNĐ/ngày', 'SẴN SÀNG'],
                            ['RED Komodo 6K Cinema Rig', '4,500,000 VNĐ/ngày', 'ĐANG THUÊ'],
                            ['Canon RF 15-35mm f/2.8L IS USM', '450,000 VNĐ/ngày', 'SẴN SÀNG'],
                        ].map((item) => (
                            <div
                                key={item[0]}
                                className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {item[0]}
                                    </p>

                                    <div className="mt-1 flex gap-3 text-xs">
                    <span className="font-semibold text-[#F45116]">
                      {item[1]}
                    </span>

                                        <span className="text-green-600">
                      {item[2]}
                    </span>
                                    </div>
                                </div>

                                <span className="text-gray-400">
                  ⋮
                </span>
                            </div>
                        ))}

                        <Link
                            to="/owner/equipment"
                            className="mt-3 block text-center text-xs font-semibold text-gray-500"
                        >
                            Xem tất cả 12 thiết bị
                        </Link>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">

                        <div className="mb-4">
                            <h2 className="font-bold text-gray-800">
                                Lịch sử giao dịch
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                                Các hoạt động tài chính gần đây
                            </p>
                        </div>

                        <TransactionRow
                            type="in"
                            title="Tiền thuê: Order #LR-2391"
                            date="Hôm nay, 09:30"
                            amount="+2,400,000đ"
                        />

                        <TransactionRow
                            type="out"
                            title="Rút tiền về ngân hàng"
                            date="Hôm qua, 15:45"
                            amount="-15,000,000đ"
                        />

                        <TransactionRow
                            type="in"
                            title="Tiền thuê: Order #LR-2388"
                            date="12 Th6, 2024"
                            amount="+1,200,000đ"
                        />

                        <TransactionRow
                            type="in"
                            title="Tiền thuê: Order #LR-2385"
                            date="10 Th6, 2024"
                            amount="+800,000đ"
                        />

                        <Link
                            to="/owner/transactions"
                            className="mt-3 block text-center text-xs font-semibold text-gray-500"
                        >
                            Tải lịch sử giao dịch (.csv)
                        </Link>

                    </div>

                </div>

            </div>
        </main>
    )
}

function StatCard({ title, value, note }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-[10px] font-bold tracking-wide text-gray-400">
                {title}
            </p>

            <p className="mt-3 text-2xl font-bold text-gray-800">
                {value}
            </p>

            {note && (
                <p className="mt-2 text-[11px] font-semibold text-green-600">
                    {note}
                </p>
            )}
        </div>
    )
}

function TransactionRow({ type, title, date, amount }) {
    return (
        <div className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-0">

            <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    type === 'in'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                }`}
            >
                {type === 'in' ? '↗' : '▣'}
            </div>

            <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700">
                    {title}
                </p>

                <p className="mt-1 text-[10px] text-gray-400">
                    {date}
                </p>
            </div>

            <span
                className={`text-xs font-bold ${
                    type === 'in'
                        ? 'text-green-600'
                        : 'text-gray-700'
                }`}
            >
        {amount}
      </span>
        </div>
    )
}