import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

export default function ReturnConfirm() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [checked, setChecked] = useState([true, true, true])
    const [note, setNote] = useState('')

    const accessories = [
        'Thân máy Sony A7IV (Serial: SN-3829102)',
        'Ống kính FE 24-70mm f/2.8 GM II',
        '2x Pin Sony FZ100 + Sạc đôi',
    ]

    const toggleItem = (index) => {
        setChecked((current) =>
            current.map((value, i) =>
                i === index ? !value : value
            )
        )
    }

    const confirmReturn = () => {
        alert('Đã xác nhận thiết bị nguyên vẹn!')
        navigate('/owner/returns')
    }

    return (
        <main className="min-h-screen bg-[#F7F8FA] px-6 py-7">
            <div className="mx-auto max-w-[900px]">

                <Link
                    to="/owner/returns"
                    className="text-xs font-medium text-gray-400 hover:text-[#F45116]"
                >
                    ← Trở về danh sách đơn nhận
                </Link>

                <div className="mt-5 grid grid-cols-[1fr_280px] gap-5">

                    {/* Left */}
                    <div>

                        <div className="mb-5">
                            <div className="flex items-center gap-3">
                                <h1 className="text-[23px] font-bold text-gray-800">
                                    Xác nhận nhận lại thiết bị
                                </h1>

                                <span className="rounded bg-[#FFF1E9] px-2 py-1 text-xs font-bold text-[#F45116]">
                  Đơn #{id || 'LR-9982'}
                </span>
                            </div>

                            <p className="mt-1 text-sm text-gray-400">
                                Vui lòng đối soát kỹ tình trạng thiết bị và phụ kiện trước khi bấm xác nhận hoàn tiền cọc.
                            </p>
                        </div>

                        {/* Accessories */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5">

                            <h2 className="font-bold text-gray-800">
                                1. Danh mục phụ kiện bàn giao
                            </h2>

                            <div className="my-4 border-t border-gray-100" />

                            <div className="space-y-2">
                                {accessories.map((item, index) => (
                                    <button
                                        key={item}
                                        onClick={() => toggleItem(index)}
                                        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-[#FAFBFC] px-3 py-3 text-left"
                                    >
                                        <div className="flex items-center gap-3">

                      <span
                          className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                              checked[index]
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300 bg-white'
                          }`}
                      >
                        {checked[index] && (
                            <span className="text-[10px] text-white">
                            ✓
                          </span>
                        )}
                      </span>

                                            <span className="text-xs font-semibold text-gray-600">
                        {item}
                      </span>
                                        </div>

                                        <span className="rounded bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                      Đủ
                    </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Note */}
                        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">

                            <h2 className="font-bold text-gray-800">
                                2. Ghi chú kiểm tra tình trạng
                            </h2>

                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                                placeholder="Nhập ghi chú nếu thiết bị bình thường hoặc trầy xước nhẹ không đáng kể..."
                                className="mt-4 w-full resize-none rounded-lg border border-gray-200 bg-[#FAFBFC] p-3 text-sm outline-none focus:border-[#F45116]"
                            />

                        </div>

                    </div>

                    {/* Right */}
                    <div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                            <h2 className="font-bold text-gray-800">
                                Thông tin người thuê
                            </h2>

                            <div className="my-4 border-t border-gray-100" />

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17203E] text-xs font-bold text-white">
                                    TB
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-gray-700">
                                        Trần Thị B
                                    </p>

                                    <p className="text-xs text-gray-400">
                                        0901 234 567
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-between">
                <span className="text-xs text-gray-400">
                  Tiền cọc Web giữ:
                </span>

                                <strong className="text-sm text-[#F45116]">
                                    5,000,000 đ
                                </strong>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">

                            <button
                                onClick={confirmReturn}
                                className="w-full rounded-lg bg-[#009E72] py-3 text-xs font-bold text-white"
                            >
                                Xác Nhận Thiết Bị Nguyên Vẹn
                            </button>

                            <p className="mt-3 text-center text-[10px] leading-5 text-gray-400">
                                Hệ thống sẽ tự động giải ngân tiền cọc cho người thuê.
                            </p>

                            <Link
                                to={`/owner/returns/${id || 'LR-9982'}/damage`}
                                className="mt-4 block w-full rounded-lg border border-red-200 bg-red-50 py-3 text-center text-xs font-bold text-red-500"
                            >
                                Thiết Bị Hỏng / Báo Cáo Sự Cố
                            </Link>

                        </div>

                    </div>

                </div>
            </div>
        </main>
    )
}