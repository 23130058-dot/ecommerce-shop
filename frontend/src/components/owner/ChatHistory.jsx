import { useState } from 'react'

const conversations = [
    {
        id: 1,
        name: 'Trần Thị B',
        avatar: 'TB',
        message: 'Anh/chị cho em hỏi thiết bị đã sẵn sàng chưa ạ?',
        time: '09:42',
        unread: 2,
        online: true,
    },
    {
        id: 2,
        name: 'Nguyễn Văn A',
        avatar: 'NA',
        message: 'Em sẽ trả thiết bị lúc 14h hôm nay.',
        time: 'Hôm qua',
        unread: 0,
        online: false,
    },
    {
        id: 3,
        name: 'Lê Minh C',
        avatar: 'LC',
        message: 'Cảm ơn anh/chị.',
        time: '18/09',
        unread: 0,
        online: false,
    },
]

export default function ChatHistory() {
    const [selected, setSelected] = useState(conversations[0])

    return (
        <div className="min-h-[calc(100vh-68px)] px-6 py-7 lg:px-8">

            <div className="mx-auto max-w-[1100px]">

                <p className="text-[11px] text-gray-400">
                    Tài chính & Tương tác
                </p>

                <h1 className="mt-2 text-[26px] font-bold text-[#172033]">
                    Lịch sử trò chuyện
                </h1>

                <p className="mt-1 text-[12px] text-gray-500">
                    Tra cứu các cuộc trò chuyện giữa Owner và người thuê.
                </p>

                <div className="mt-6 grid min-h-[500px] overflow-hidden rounded-xl border border-gray-200 bg-white lg:grid-cols-[300px_1fr]">

                    {/* Conversations */}
                    <div className="border-r border-gray-200">

                        <div className="border-b border-gray-100 p-4">
                            <input
                                type="search"
                                placeholder="Tìm cuộc trò chuyện..."
                                className="w-full rounded-lg bg-gray-50 px-3 py-2 text-[10px] outline-none"
                            />
                        </div>

                        <div>

                            {conversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    type="button"
                                    onClick={() => setSelected(conversation)}
                                    className={`
                                        flex w-full items-center gap-3
                                        border-b border-gray-100
                                        px-4 py-4 text-left
                                        ${
                                        selected.id === conversation.id
                                            ? 'bg-[#FFF5EF]'
                                            : 'hover:bg-gray-50'
                                    }
                                    `}
                                >

                                    <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-600">
                                        {conversation.avatar}

                                        {conversation.online && (
                                            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-green-500" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-gray-800">
                                                {conversation.name}
                                            </span>

                                            <span className="text-[9px] text-gray-400">
                                                {conversation.time}
                                            </span>
                                        </div>

                                        <div className="mt-1 flex items-center justify-between gap-2">

                                            <p className="truncate text-[10px] text-gray-400">
                                                {conversation.message}
                                            </p>

                                            {conversation.unread > 0 && (
                                                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#F45116] text-[8px] text-white">
                                                    {conversation.unread}
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                </button>
                            ))}

                        </div>

                    </div>

                    {/* Conversation */}
                    <div className="flex flex-col">

                        <div className="border-b border-gray-200 p-4">

                            <div className="flex items-center gap-3">

                                <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-600">
                                    {selected.avatar}
                                </div>

                                <div>
                                    <p className="text-[12px] font-semibold text-gray-900">
                                        {selected.name}
                                    </p>

                                    <p className="text-[9px] text-green-500">
                                        Đang hoạt động
                                    </p>
                                </div>

                            </div>

                        </div>

                        <div className="flex-1 bg-[#F8F9FB] p-5">

                            <div className="flex justify-start">
                                <div className="max-w-[70%] rounded-xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                                    <p className="text-[10px] text-gray-600">
                                        Xin chào! Anh/chị cần hỗ trợ gì về đơn thuê?
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <div className="max-w-[70%] rounded-xl rounded-tr-sm bg-[#F45116] px-4 py-3 text-white">
                                    <p className="text-[10px]">
                                        Em muốn hỏi tình trạng thiết bị ạ.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-start">
                                <div className="max-w-[70%] rounded-xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                                    <p className="text-[10px] text-gray-600">
                                        Thiết bị đã được chuẩn bị đầy đủ. Bạn có thể nhận theo lịch đã đặt.
                                    </p>
                                </div>
                            </div>

                        </div>

                        <div className="border-t border-gray-200 p-3">

                            <div className="flex gap-2">

                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-[10px] outline-none"
                                />

                                <button
                                    type="button"
                                    className="rounded-lg bg-[#F45116] px-4 text-[10px] font-medium text-white"
                                >
                                    Gửi
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    )
}