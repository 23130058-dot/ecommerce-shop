import { Link } from 'react-router-dom'
import { returnOrders } from '../../data/ownerData'

export default function ReturnOrders() {
    return (
        <main className="min-h-screen bg-[#F7F8FA] px-6 py-7">
            <div className="mx-auto max-w-[1000px]">

                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h1 className="text-[24px] font-bold text-gray-800">
                            Xác nhận trả & Báo lỗi
                        </h1>

                        <p className="mt-1 text-sm text-gray-400">
                            Quản lý và kiểm tra thiết bị đến hạn thu hồi từ người thuê.
                        </p>
                    </div>

                    <div className="w-[230px]">
                        <input
                            placeholder="⌕  Tìm mã đơn, tên khách..."
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F45116]"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-5 flex gap-7 border-b border-gray-200">
                    <Tab label="Tất cả (15)" />
                    <Tab label="Đến hạn hôm nay (3)" active />
                    <Tab label="Quá hạn (1)" danger />
                    <Tab label="Đã hoàn tất (9)" />
                </div>

                {returnOrders.map((order) => (
                    <div
                        key={order.id}
                        className="rounded-xl border border-gray-200 bg-white p-5"
                    >

                        {/* Top */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4">

                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-gray-800">
                                    {order.id}
                                </h2>

                                <span className="rounded-full bg-[#FFF3C4] px-3 py-1 text-xs font-semibold text-[#B78100]">
                  Đến hạn trả: {order.returnTime} Hôm nay
                </span>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-gray-400">
                                    Thời gian thuê:
                                </p>

                                <p className="mt-1 text-xs font-semibold text-gray-700">
                                    {order.startDate} - {order.endDate}
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex items-center justify-between pt-5">

                            <div className="w-[210px]">
                                <p className="text-[10px] font-bold uppercase text-gray-400">
                                    NGƯỜI THUÊ
                                </p>

                                <div className="mt-2 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#151E55] text-sm font-bold text-white">
                                        TB
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-gray-700">
                                            {order.customer}
                                        </p>

                                        <p className="text-xs text-green-500">
                                            ✓ Điểm uy tín: {order.rating}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase text-gray-400">
                                    THIẾT BỊ CẦN THU HỒI
                                </p>

                                <div className="mt-2 space-y-1">
                                    {order.products.map((product) => (
                                        <p
                                            key={product}
                                            className="text-xs font-medium text-gray-600"
                                        >
                                            • {product}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">

                                <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600">
                                    💬 Nhắn tin
                                </button>

                                <Link
                                    to={`/owner/returns/${order.id.replace('#', '')}/damage`}
                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-500"
                                >
                                    ⚠ Báo cáo hư hại
                                </Link>

                                <Link
                                    to={`/owner/returns/${order.id.replace('#', '')}/confirm`}
                                    className="rounded-lg bg-[#F45116] px-4 py-2.5 text-xs font-semibold text-white"
                                >
                                    ✓ Kiểm tra thiết bị
                                </Link>

                            </div>
                        </div>

                    </div>
                ))}

            </div>
        </main>
    )
}

function Tab({ label, active, danger }) {
    return (
        <button
            className={`border-b-2 pb-3 text-sm font-semibold ${
                active
                    ? 'border-[#F45116] text-[#F45116]'
                    : danger
                        ? 'border-transparent text-red-500'
                        : 'border-transparent text-gray-500'
            }`}
        >
            {label}
        </button>
    )
}