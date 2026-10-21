import { useState } from 'react'
import OwnerIcon from './OwnerIcon'

const notifications = [
    {
        id: 1,
        type: 'booking',
        title: 'Có đơn thuê mới',
        message: 'Nguyễn Văn A vừa gửi yêu cầu thuê Sony A7IV.',
        time: '5 phút trước',
        unread: true,
    },
    {
        id: 2,
        type: 'return',
        title: 'Thiết bị sắp được trả',
        message: 'Đơn #LR-9982 sẽ đến hạn trả lúc 14:00 hôm nay.',
        time: '1 giờ trước',
        unread: true,
    },
    {
        id: 3,
        type: 'payment',
        title: 'Thanh toán thành công',
        message: 'Bạn đã nhận 2.400.000 đ từ đơn #LR-9982.',
        time: 'Hôm qua',
        unread: false,
    },
    {
        id: 4,
        type: 'review',
        title: 'Có đánh giá mới',
        message: 'Nguyễn Văn A đã hoàn tất đánh giá giao dịch.',
        time: '18/09/2026',
        unread: false,
    },
]

export default function Notifications() {
    const [items, setItems] = useState(notifications)

    const markAllRead = () => {
        setItems(
            items.map((item) => ({
                ...item,
                unread: false,
            }))
        )
    }

    const getIcon = (type) => {
        if (type === 'booking') return 'booking'
        if (type === 'return') return 'check'
        if (type === 'payment') return 'wallet'
        return 'star'
    }

    return (
        <div className="min-h-[calc(100vh-68px)] px-6 py-7 lg:px-8">

            <div className="mx-auto max-w-[900px]">

                <div className="flex items-end justify-between">

                    <div>
                        <p className="text-[11px] text-gray-400">
                            Tài chính & Tương tác
                        </p>

                        <h1 className="mt-2 text-[26px] font-bold text-[#172033]">
                            Thông báo
                        </h1>

                        <p className="mt-1 text-[12px] text-gray-500">
                            Cập nhật mới nhất về đơn thuê và hoạt động tài khoản.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] font-medium text-[#F45116] hover:underline"
                    >
                        Đánh dấu tất cả đã đọc
                    </button>

                </div>

                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">

                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`
                                flex gap-4 border-b border-gray-100
                                px-5 py-4 last:border-0
                                ${
                                item.unread
                                    ? 'bg-[#FFFCFA]'
                                    : 'bg-white'
                            }
                            `}
                        >

                            <div
                                className={`
                                    flex size-9 shrink-0 items-center justify-center rounded-full
                                    ${
                                    item.unread
                                        ? 'bg-[#FFF1E9] text-[#F45116]'
                                        : 'bg-gray-100 text-gray-400'
                                }
                                `}
                            >
                                <OwnerIcon
                                    name={getIcon(item.type)}
                                    size={14}
                                />
                            </div>

                            <div className="min-w-0 flex-1">

                                <div className="flex items-start justify-between gap-4">

                                    <div>
                                        <p className="text-[11px] font-semibold text-gray-900">
                                            {item.title}
                                        </p>

                                        <p className="mt-1 text-[10px] leading-4 text-gray-500">
                                            {item.message}
                                        </p>
                                    </div>

                                    {item.unread && (
                                        <span className="mt-1 size-2 shrink-0 rounded-full bg-[#F45116]" />
                                    )}

                                </div>

                                <p className="mt-2 text-[9px] text-gray-400">
                                    {item.time}
                                </p>

                            </div>

                        </div>
                    ))}

                </div>

            </div>

        </div>
    )
}