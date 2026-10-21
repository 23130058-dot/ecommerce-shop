import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tenantReview } from '../../data/ownerData'

export default function ReviewTenant() {
    const navigate = useNavigate()

    const [communication, setCommunication] = useState(
        tenantReview.communication
    )

    const [punctuality, setPunctuality] = useState(
        tenantReview.punctuality
    )

    const [care, setCare] = useState(
        tenantReview.care
    )

    const [condition, setCondition] = useState('perfect')
    const [comment, setComment] = useState('')
    const [publicReview, setPublicReview] = useState(true)

    const submitReview = () => {
        alert('Đánh giá người thuê thành công!')
        navigate('/owner/returns')
    }

    return (
        <main className="min-h-screen bg-[#F7F8FA] px-6 py-7">
            <div className="mx-auto max-w-[760px]">

                <Link
                    to="/owner/returns"
                    className="text-xs text-gray-400 hover:text-[#F45116]"
                >
                    ← Trở về Trung tâm đánh giá
                </Link>

                <div className="mb-5 mt-5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[23px] font-bold text-gray-800">
                            Đánh giá Người thuê
                        </h1>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
              Đơn {tenantReview.orderId}
            </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-400">
                        Đánh giá của bạn giúp cộng đồng LensRent xây dựng môi trường cho thuê an toàn và minh bạch.
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

                    {/* Customer */}
                    <div className="flex items-center justify-between border-b border-gray-100 p-5">

                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                                {tenantReview.avatar}
                            </div>

                            <div>
                                <p className="font-bold text-gray-800">
                                    {tenantReview.customer}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Đã thuê: {tenantReview.product}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-gray-400">
                                Thời gian thuê
                            </p>

                            <p className="mt-1 text-xs font-bold text-gray-700">
                                {tenantReview.startDate} - {tenantReview.endDate}
                            </p>
                        </div>

                    </div>

                    {/* Rating */}
                    <div className="p-6">

                        <h2 className="text-base font-bold text-gray-800">
                            <span className="mr-2 text-[#F45116]">♙</span>
                            1. Đánh giá chất lượng người thuê
                        </h2>

                        <div className="mt-5 rounded-xl border border-gray-100 p-4">

                            <RatingRow
                                label="Thái độ & Giao tiếp"
                                value={communication}
                                onChange={setCommunication}
                            />

                            <RatingRow
                                label="Đúng giờ (Nhận & Trả)"
                                value={punctuality}
                                onChange={setPunctuality}
                            />

                            <RatingRow
                                label="Ý thức giữ gìn thiết bị"
                                value={care}
                                onChange={setCare}
                            />

                        </div>

                        {/* Condition */}
                        <h2 className="mt-7 text-base font-bold text-gray-800">
                            <span className="mr-2 text-[#F45116]">▣</span>
                            2. Xác nhận tình trạng thiết bị sau thuê
                        </h2>

                        <div className="mt-4 space-y-2">

                            <ConditionOption
                                value="perfect"
                                selected={condition}
                                setSelected={setCondition}
                                title="Hoàn hảo, không có vấn đề gì"
                                description="Máy được trả lại đúng tình trạng ban đầu, sạch sẽ, đầy đủ phụ kiện."
                            />

                            <ConditionOption
                                value="minor"
                                selected={condition}
                                setSelected={setCondition}
                                title="Có hao mòn/bụi bẩn nhẹ"
                                description="Hao mòn trong mức chấp nhận được, không ảnh hưởng đến chức năng."
                            />

                            <ConditionOption
                                value="damage"
                                selected={condition}
                                setSelected={setCondition}
                                title="Có sự cố / Hư hỏng (Đã báo cáo Admin)"
                                description="Tùy chọn này chỉ mở khi bạn đã tạo Form Báo cáo sự cố lúc nhận máy."
                                disabled
                            />

                        </div>

                        {/* Comment */}
                        <h2 className="mt-7 text-base font-bold text-gray-800">
                            <span className="mr-2 text-[#F45116]">▢</span>
                            3. Nhận xét chi tiết
                        </h2>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder="Chia sẻ trải nghiệm của bạn khi làm việc với khách hàng này (Thái độ, mức độ nhiệt tình, có recommend cho chủ máy khác không?)..."
                            className="mt-4 w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-[#F45116]"
                        />

                        <label className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                            <input
                                type="checkbox"
                                checked={publicReview}
                                onChange={(e) => setPublicReview(e.target.checked)}
                                className="h-4 w-4 accent-blue-500"
                            />

                            Hiển thị công khai đánh giá này trên Hồ sơ của người thuê.
                        </label>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 border-t border-gray-100 bg-[#FAFBFC] px-6 py-4">

                        <button
                            onClick={() => navigate(-1)}
                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600"
                        >
                            Hủy bỏ
                        </button>

                        <button
                            onClick={submitReview}
                            className="rounded-lg bg-[#F45116] px-6 py-2.5 text-sm font-bold text-white"
                        >
                            ✈ Gửi đánh giá
                        </button>

                    </div>

                </div>

            </div>
        </main>
    )
}

function RatingRow({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-600">
        {label}
      </span>

            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onChange(star)}
                        className={`text-xl ${
                            star <= value
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                        }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    )
}

function ConditionOption({
                             value,
                             selected,
                             setSelected,
                             title,
                             description,
                             disabled = false,
                         }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => setSelected(value)}
            className={`w-full rounded-xl border p-4 text-left ${
                disabled
                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                    : selected === value
                        ? 'border-[#F45116] bg-[#FFF8F4]'
                        : 'border-gray-200 bg-white'
            }`}
        >
            <div className="flex gap-3">

        <span
            className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                selected === value
                    ? 'border-blue-500'
                    : 'border-gray-300'
            }`}
        >
          {selected === value && (
              <span className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </span>

                <div>
                    <p
                        className={`text-sm font-bold ${
                            selected === value
                                ? 'text-[#F45116]'
                                : 'text-gray-700'
                        }`}
                    >
                        {title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-400">
                        {description}
                    </p>
                </div>

            </div>
        </button>
    )
}