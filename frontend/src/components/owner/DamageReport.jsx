import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

export default function DamageReport() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [damageType, setDamageType] = useState('partial')
    const [description, setDescription] = useState('')
    const [damageValue, setDamageValue] = useState('')
    const [files, setFiles] = useState([])

    const handleFiles = (e) => {
        setFiles(Array.from(e.target.files))
    }

    const submitReport = () => {
        if (!description || !damageValue) {
            alert('Vui lòng nhập mô tả và giá trị thiệt hại.')
            return
        }

        alert('Đã gửi báo cáo cho Admin xử lý.')
        navigate('/owner/returns')
    }

    return (
        <main className="min-h-screen bg-[#F7F8FA] px-6 py-7">
            <div className="mx-auto max-w-[1000px]">

                <Link
                    to="/owner/returns"
                    className="text-xs text-gray-400 hover:text-[#F45116]"
                >
                    ← Trở về danh sách thu hồi
                </Link>

                <div className="mt-5 mb-5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[23px] font-bold text-gray-800">
                            Báo cáo sự cố & Yêu cầu bồi thường
                        </h1>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-500">
              Đơn #{id || 'LR-9982'}
            </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-400">
                        Cung cấp thông tin thiết hại để Admin LensRent làm căn cứ trừ cọc hoặc yêu cầu người thuê đền bù.
                    </p>
                </div>

                <div className="grid grid-cols-[1fr_270px] gap-5">

                    {/* Left */}
                    <div className="space-y-5">

                        {/* Damage level */}
                        <section className="rounded-xl border border-gray-200 bg-white p-5">

                            <h2 className="font-bold text-gray-800">
                                1. Phân loại mức độ thiệt hại
                            </h2>

                            <div className="my-4 border-t border-gray-100" />

                            <div className="grid grid-cols-2 gap-3">

                                <label
                                    className={`cursor-pointer rounded-lg border p-4 ${
                                        damageType === 'partial'
                                            ? 'border-[#F45116] bg-[#FFF8F4]'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="damage"
                                        value="partial"
                                        checked={damageType === 'partial'}
                                        onChange={(e) => setDamageType(e.target.value)}
                                        className="mr-2 accent-[#F45116]"
                                    />

                                    <span className="text-sm font-bold text-gray-700">
                    Hư hỏng một phần
                  </span>

                                    <p className="mt-2 ml-5 text-xs text-gray-400">
                                        Trầy xước, móp méo, đứt cáp, mất phụ kiện đi kèm...
                                    </p>
                                </label>

                                <label
                                    className={`cursor-pointer rounded-lg border p-4 ${
                                        damageType === 'total'
                                            ? 'border-red-400 bg-red-50'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="damage"
                                        value="total"
                                        checked={damageType === 'total'}
                                        onChange={(e) => setDamageType(e.target.value)}
                                        className="mr-2 accent-red-500"
                                    />

                                    <span className="text-sm font-bold text-red-500">
                    Mất máy / Hỏng toàn bộ
                  </span>

                                    <p className="mt-2 ml-5 text-xs text-gray-400">
                                        Thiết bị không thể sửa chữa, mất cắp, không hoàn trả.
                                    </p>
                                </label>

                            </div>

                            <label className="mt-5 block text-sm font-semibold text-gray-700">
                                Mô tả chi tiết tình trạng
                                <span className="text-red-500"> *</span>
                            </label>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Vui lòng mô tả rõ thiết bị bị hỏng ở vị trí nào, chức năng nào không hoạt động..."
                                className="mt-2 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#F45116]"
                            />

                        </section>

                        {/* Upload */}
                        <section className="rounded-xl border border-gray-200 bg-white p-5">

                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-gray-800">
                                    2. Hình ảnh & Video bằng chứng
                                </h2>

                                <span className="rounded bg-red-50 px-2 py-1 text-[10px] font-bold text-red-400">
                  Bắt buộc
                </span>
                            </div>

                            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-10 hover:border-[#F45116]">

                                <div className="text-3xl text-gray-300">
                                    ☁
                                </div>

                                <p className="mt-3 text-sm font-semibold text-gray-600">
                                    Kéo thả file bằng chứng vào đây
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Chấp nhận JPG, PNG, MP4. Tối đa 5 file
                                </p>

                                <span className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600">
                  Chọn file từ máy tính
                </span>

                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/mp4"
                                    onChange={handleFiles}
                                    className="hidden"
                                />
                            </label>

                            {files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {files.map((file) => (
                                        <div
                                            key={file.name}
                                            className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"
                                        >
                                            📎 {file.name}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </section>

                    </div>

                    {/* Right */}
                    <div className="space-y-4">

                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                                THÔNG TIN ĐƠN THUÊ
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17203E] text-xs font-bold text-white">
                                    TB
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-gray-700">
                                        Trần Thị B (Người thuê)
                                    </p>

                                    <p className="text-xs text-gray-400">
                                        0901 234 567
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3 text-xs">
                                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Thiết bị:
                  </span>

                                    <strong className="text-gray-700">
                                        Sony A7IV + Lens 24-70mm
                                    </strong>
                                </div>

                                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Giá trị máy ban đầu:
                  </span>

                                    <strong className="text-gray-700">
                                        65,000,000 đ
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border-2 border-[#F45116] bg-white p-4">

                            <h2 className="font-bold text-gray-800">
                                🧾 Yêu cầu bồi thường
                            </h2>

                            <div className="mt-4 rounded-lg bg-[#FFF6ED] p-3">
                                <p className="text-xs text-gray-500">
                                    Tiền cọc Web đang giữ:
                                </p>

                                <p className="mt-1 text-lg font-bold text-[#F45116]">
                                    5,000,000 đ
                                </p>
                            </div>

                            <label className="mt-5 block text-xs font-bold text-gray-700">
                                Giá trị thiệt hại ước tính
                                <span className="text-red-500"> *</span>
                            </label>

                            <input
                                value={damageValue}
                                onChange={(e) => setDamageValue(e.target.value)}
                                placeholder="Nhập số tiền... VND"
                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 text-right text-sm outline-none focus:border-[#F45116]"
                            />

                            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-600">
                                ⓘ Lưu ý: Nếu số tiền thiệt hại nhập vào lớn hơn 5,000,000đ
                                (Tiền cọc), Web sẽ giữ lại toàn bộ cọc và tạo Yêu cầu đóng
                                thêm tiền gửi đến Người thuê.
                            </div>

                            <button
                                onClick={submitReport}
                                className="mt-4 w-full rounded-lg bg-[#F45116] py-3 text-xs font-bold text-white"
                            >
                                ✈ Gửi cho Admin phân xử
                            </button>

                            <Link
                                to="/owner/returns"
                                className="mt-2 block w-full rounded-lg border border-gray-300 py-3 text-center text-xs font-semibold text-gray-600"
                            >
                                Hủy báo cáo
                            </Link>

                        </div>

                    </div>

                </div>
            </div>
        </main>
    )
}