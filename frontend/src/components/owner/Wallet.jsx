import { useState } from 'react'

const formatMoney = (value) =>
    new Intl.NumberFormat('vi-VN').format(value) + ' đ'

export default function Wallet() {
    const [amount, setAmount] = useState('')

    return (
        <div className="min-h-[calc(100vh-68px)] px-6 py-7 lg:px-8">

            <div className="mx-auto max-w-[1180px]">

                <p className="text-[11px] text-gray-400">
                    Tài chính & Tương tác
                </p>

                <h1 className="mt-2 text-[26px] font-bold text-[#172033]">
                    Quản lý Ví & Rút tiền
                </h1>

                <p className="mt-1 text-[12px] text-gray-500">
                    Theo dõi số dư và thực hiện rút tiền về tài khoản ngân hàng.
                </p>

                {/* Balance */}
                <div className="mt-6 grid gap-4 lg:grid-cols-3">

                    <div className="rounded-xl bg-[#F45116] p-5 text-white lg:col-span-2">
                        <p className="text-[11px] opacity-80">
                            Số dư khả dụng
                        </p>

                        <p className="mt-3 text-3xl font-bold">
                            {formatMoney(28450000)}
                        </p>

                        <p className="mt-2 text-[10px] opacity-80">
                            Có thể rút ngay về tài khoản ngân hàng
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-[11px] text-gray-400">
                            Đang chờ xử lý
                        </p>

                        <p className="mt-3 text-2xl font-bold text-gray-900">
                            0 đ
                        </p>

                        <p className="mt-2 text-[10px] text-gray-400">
                            Không có giao dịch chờ xử lý
                        </p>
                    </div>

                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">

                    {/* Bank */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5">

                        <h2 className="text-sm font-bold text-gray-900">
                            Tài khoản nhận tiền
                        </h2>

                        <div className="mt-4 rounded-lg border border-gray-200 p-4">

                            <p className="text-[10px] text-gray-400">
                                Ngân hàng
                            </p>

                            <p className="mt-1 text-[12px] font-semibold">
                                MBBank
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-4">

                                <div>
                                    <p className="text-[10px] text-gray-400">
                                        Chủ tài khoản
                                    </p>

                                    <p className="mt-1 text-[11px] font-medium">
                                        OWNER LENSRENT
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] text-gray-400">
                                        Số tài khoản
                                    </p>

                                    <p className="mt-1 text-[11px] font-medium">
                                        **** 8888
                                    </p>
                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Withdraw */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5">

                        <h2 className="text-sm font-bold text-gray-900">
                            Rút tiền
                        </h2>

                        <p className="mt-1 text-[10px] text-gray-400">
                            Nhập số tiền muốn rút.
                        </p>

                        <div className="mt-5">

                            <label className="text-[10px] font-medium text-gray-600">
                                Số tiền
                            </label>

                            <div className="mt-2 flex items-center rounded-lg border border-gray-200 px-3">

                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="min-w-0 flex-1 py-3 text-sm outline-none"
                                />

                                <span className="text-[11px] text-gray-400">
                                    VNĐ
                                </span>

                            </div>

                        </div>

                        <button
                            type="button"
                            className="mt-4 w-full rounded-lg bg-[#F45116] py-3 text-[11px] font-semibold text-white hover:bg-[#df450f]"
                        >
                            Xác nhận rút tiền
                        </button>

                        <p className="mt-3 text-[9px] leading-4 text-gray-400">
                            Tiền sẽ được chuyển về tài khoản ngân hàng đã xác minh.
                        </p>

                    </div>

                </div>

            </div>

        </div>
    )
}