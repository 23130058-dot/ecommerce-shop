import { useNavigate } from 'react-router-dom'
import OwnerIcon from './OwnerIcon'

const orders = [
    {
        id: '#LR-9982',
        customer: 'Trần Thị B',
        phone: '0901 234 567',
        products: [
            '1x Máy ảnh Sony A7IV',
            '1x Ống kính Sony FE 24-70mm GM II',
        ],
        startDate: '15/06/2026',
        endDate: '18/06/2026',
        status: 'Đến hạn hôm nay',
    },
]

export default function ConfirmationCenter() {
    const navigate = useNavigate()

    return (
        <div className="min-h-[calc(100vh-68px)] px-6 py-7 lg:px-8">

            <div className="mx-auto max-w-[1180px]">

                <div>
                    <p className="text-[11px] text-gray-400">
                        Quản lý cho thuê
                    </p>

                    <h1 className="mt-2 text-[26px] font-bold text-[#172033]">
                        Xác nhận trả & Báo lỗi
                    </h1>

                    <p className="mt-1 text-[12px] text-gray-500">
                        Quản lý và kiểm tra thiết bị đến hạn thu hồi từ người thuê.
                    </p>
                </div>

                {/* Tabs */}
                <div className="mt-6 flex gap-6 border-b border-gray-200">

                    <button
                        className="border-b-2 border-[#F45116] px-1 py-3 text-[11px] font-medium text-[#F45116]"
                    >
                        Tất cả (15)
                    </button>

                    <button className="px-1 py-3 text-[11px] text-gray-500">
                        Đến hạn hôm nay (3)
                    </button>

                    <button className="px-1 py-3 text-[11px] text-gray-500">
                        Quá hạn (1)
                    </button>

                    <button className="px-1 py-3 text-[11px] text-gray-500">
                        Đã hoàn tất (9)
                    </button>

                </div>

                {/* Order */}
                <div className="mt-5 rounded-xl border border-gray-200 bg-white">

                    {orders.map((order) => (
                        <div key={order.id} className="p-5">

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                <div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            {order.id}
                                        </span>

                                        <span className="rounded-full bg-yellow-50 px-2 py-1 text-[9px] font-medium text-yellow-600">
                                            {order.status}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-[10px] text-gray-400">
                                        Thời gian thuê: {order.startDate} - {order.endDate}
                                    </p>

                                </div>

                                <div className="flex gap-2">

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/owner/returns/${order.id.replace('#LR-', '')}/damage`)}
                                        className="rounded-lg border border-red-200 px-3 py-2 text-[10px] text-red-500 hover:bg-red-50"
                                    >
                                        Báo cáo hư hại
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/owner/returns/${order.id.replace('#LR-', '')}/confirm`)}
                                        className="rounded-lg bg-[#F45116] px-3 py-2 text-[10px] font-medium text-white hover:bg-[#df450f]"
                                    >
                                        Kiểm tra thiết bị
                                    </button>

                                </div>

                            </div>

                            <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 lg:grid-cols-[180px_1fr_220px]">

                                <div>
                                    <p className="text-[9px] uppercase text-gray-400">
                                        Người thuê
                                    </p>

                                    <p className="mt-1 text-[11px] font-semibold">
                                        {order.customer}
                                    </p>

                                    <p className="text-[10px] text-gray-400">
                                        {order.phone}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[9px] uppercase text-gray-400">
                                        Thiết bị cần thu hồi
                                    </p>

                                    <div className="mt-1 space-y-1">
                                        {order.products.map((product) => (
                                            <p
                                                key={product}
                                                className="text-[10px] text-gray-700"
                                            >
                                                • {product}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/owner/returns')}
                                        className="text-[10px] font-medium text-[#F45116] hover:underline"
                                    >
                                        Xem danh sách thu hồi →
                                    </button>
                                </div>

                            </div>

                        </div>
                    ))}

                </div>

            </div>

        </div>
    )
}