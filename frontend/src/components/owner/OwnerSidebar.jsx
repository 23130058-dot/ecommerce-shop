import { useNavigate, useLocation } from "react-router-dom";

const OwnerSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuGroups = [
        {
            title: "QUẢN LÝ CHO THUÊ",
            items: [
                {
                    label: "Tổng quan",
                    path: "/owner",
                    icon: "dashboard",
                },
                {
                    label: "Quản lý thiết bị",
                    path: "/owner/equipment",
                    icon: "camera",
                },
                {
                    label: "Lịch trình & Giá",
                    path: "/owner/schedule",
                    icon: "calendar",
                },
                {
                    label: "Đơn khách đặt",
                    path: "/owner/bookings",
                    icon: "document",
                },
                {
                    label: "Xác nhận thiết bị & Báo lỗi",
                    path: "/owner/confirmation",
                    icon: "check",
                },
            ],
        },

        {
            title: "TÀI CHÍNH & TƯƠNG TÁC",
            items: [
                {
                    label: "Quản lý Ví & Rút tiền",
                    path: "/owner/wallet",
                    icon: "wallet",
                },
                {
                    label: "Báo cáo doanh thu",
                    path: "/owner/revenue",
                    icon: "chart",
                },
                {
                    label: "Lịch sử giao dịch",
                    path: "/owner/transactions",
                    icon: "history",
                },
                {
                    label: "Đánh giá giao dịch",
                    path: "/owner/reviews",
                    icon: "star",
                },
                {
                    label: "Lịch sử trò chuyện",
                    path: "/owner/messages",
                    icon: "chat",
                },
                {
                    label: "Thông báo",
                    path: "/owner/notifications",
                    icon: "bell",
                },
            ],
        },
    ];

    const isActive = (path) => {
        if (path === "/owner") {
            return location.pathname === "/owner";
        }

        return location.pathname.startsWith(path);
    };

    const getIcon = (type) => {
        const icons = {
            dashboard: "▦",
            camera: "▣",
            calendar: "▤",
            document: "▢",
            check: "☑",
            wallet: "▣",
            chart: "▥",
            history: "↶",
            star: "☆",
            chat: "◯",
            bell: "♧",
        };

        return icons[type] || "•";
    };

    return (
        <aside className="w-[215px] bg-white border-r border-gray-200 min-h-[calc(100vh-68px)] flex flex-col">

            <div className="px-5 py-5 flex-1">

                {menuGroups.map((group) => (
                    <div key={group.title} className="mb-7">

                        <h3 className="text-[10px] font-semibold text-gray-400 mb-3 px-2">
                            {group.title}
                        </h3>

                        <div className="space-y-1">

                            {group.items.map((item) => {
                                const active = isActive(item.path);

                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={`
                      w-full flex items-center gap-3
                      px-3 py-2.5 rounded-lg
                      text-left text-[12px]
                      transition-all
                      ${
                                            active
                                                ? "bg-[#FFF5EF] text-[#F45116] font-medium"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-[#F45116]"
                                        }
                    `}
                                    >

                    <span
                        className={`
                        w-4 text-center text-[14px]
                        ${active ? "text-[#F45116]" : "text-gray-500"}
                      `}
                    >
                      {getIcon(item.icon)}
                    </span>

                                        <span>{item.label}</span>

                                    </button>
                                );
                            })}

                        </div>
                    </div>
                ))}

            </div>

            {/* Settings */}
            <div className="px-5 pb-6">

                <button
                    onClick={() => navigate("/owner/profile")}
                    className={`
            w-full
            flex items-center gap-3
            px-3 py-2.5
            rounded-lg
            border
            text-[12px]
            ${
                        location.pathname.startsWith("/owner/profile")
                            ? "border-[#F45116] text-[#F45116]"
                            : "border-[#F45116] text-[#F45116] hover:bg-[#FFF5EF]"
                    }
          `}
                >
                    <span>⚙</span>
                    <span>Cài đặt tài khoản</span>
                </button>

            </div>

        </aside>
    );
};

export default OwnerSidebar;