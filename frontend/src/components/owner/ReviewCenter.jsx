import { useNavigate } from 'react-router-dom'
import OwnerIcon from './OwnerIcon'

const reviews = [
    {
        id: '#LR-9950',
        customer: 'Nguyễn Văn A',
        avatar: 'NA',
        product: 'Sony A7IV + Lens 24-70mm',
        date: '15/06 - 18/06/2026',
        rating: 5,
        status: 'Chưa đánh giá',
    },
    {
        id: '#LR-9932',
        customer: 'Trần Minh B',
        avatar: 'TB',
        product: 'DJI Mavic 3 Pro',
        date: '10/06 - 12/06/2026',
        rating: 4,
        status: 'Đã đánh giá',
    },
]

export default function ReviewCenter() {
    const navigate = useNavigate()

    return (
        <div className="min-h-[calc(100vh-68px)] px-6 py-7 lg:px-8">

            <div className="mx-auto max-w-[1000px]">

                <p className="text-[11px] text-gray-400">
                    Tài chính & Tương tác
                </p>

                <h1 className="mt-2 text-[26px] font-bold text-[#172033]">
                    Đánh giá giao dịch
                </h1>

                <p className="mt-1 text-[12px] text-gray-500">
                    Đánh giá người thuê sau khi hoàn tất giao dịch.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-[10px] text-gray-400">
                            Điểm trung bình
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                            4.9
                        </p>

                        <p className="mt-1 text-[10px] text-yellow-500">
                            ★★★★★
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-[10px] text-gray-400">
                            Tổng đánh giá
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                            42
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-[10px] text-gray-400">
                            Chờ đánh giá
                        </p>

                        <p className="mt-2 text-2xl font-bold text-[#F45116]">
                            3
                        </p>
                    </div>

                </div>

                <div className="mt-5 space-y-3">

                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-xl border border-gray-200 bg-white p-5"
                        >

                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="flex size-10 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-[#F45116]">
                                        {review.avatar}
                                    </div>

                                    <div>
                                        <p className="text-[12px] font-semibold text-gray-900">
                                            {review.customer}
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {review.product}
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {review.date}
                                        </p>
                                    </div>

                                </div>

                                <div className="flex items-center gap-4">

                                    <span className="text-yellow-500">
                                        {'★'.repeat(review.rating)}
                                        <span className="text-gray-200">
                                            {'★'.repeat(5 - review.rating)}
                                        </span>
                                    </span>

                                    {review.status === 'Chưa đánh giá' ? (
                                        <button
                                            type="button"
                                            onClick={() => navigate('/owner/review-tenant')}
                                            className="rounded-lg bg-[#F45116] px-4 py-2 text-[10px] font-medium text-white"
                                        >
                                            Đánh giá
                                        </button>
                                    ) : (
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-[9px] text-green-600">
                                            Đã đánh giá
                                        </span>
                                    )}

                                </div>

                            </div>

                        </div>
                    ))}

                </div>

            </div>

        </div>
    )
}