import { useLocation, useNavigate } from 'react-router-dom'

function MenuIcon({ type, active = false }) {
    const color = active ? '#F45116' : '#64748B'

    const props = {
        width: 12,
        height: 12,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    }

    switch (type) {
        case 'dashboard':
            return (
                <svg {...props}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            )

        case 'camera':
            return (
                <svg {...props}>
                    <path d="M4 8h4l2-2h4l2 2h4v11H4V8z" />
                    <circle cx="12" cy="13.5" r="3" />
                </svg>
            )

        case 'calendar':
            return (
                <svg {...props}>
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
            )

        case 'document':
            return (
                <svg {...props}>
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
            )

        case 'check':
            return (
                <svg {...props}>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="m8 12 2.5 2.5L16 9" />
                </svg>
            )

        case 'wallet':
            return (
                <svg {...props}>
                    <path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                    <path d="M4 6V4h14a2 2 0 0 1 2 2" />
                    <path d="M16 13h3" />
                </svg>
            )

        case 'chart':
            return (
                <svg {...props}>
                    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                </svg>
            )

        case 'history':
            return (
                <svg {...props}>
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                    <path d="M12 7v5l3 2" />
                </svg>
            )

        case 'star':
            return (
                <svg {...props}>
                    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z" />
                </svg>
            )

        case 'chat':
            return (
                <svg {...props}>
                    <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                </svg>
            )

        case 'bell':
            return (
                <svg {...props}>
                    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                </svg>
            )

        case 'settings':
            return (
                <svg {...props}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.6 1h.1v2.6H21a1.7 1.7 0 0 0-1.6 1.4z" />
                </svg>
            )

        default:
            return null
    }
}

const menuGroups = [
    {
        title: 'QUẢN LÝ CHO THUÊ',
        items: [
            {
                label: 'Tổng quan',
                path: '/owner',
                icon: 'dashboard',
            },
            {
                label: 'Quản lý thiết bị',
                path: '/owner/equipment',
                icon: 'camera',
            },
            {
                label: 'Lịch trình & Giá',
                path: '/owner/schedule',
                icon: 'calendar',
            },
            {
                label: 'Đơn khách đặt',
                path: '/owner/bookings',
                icon: 'document',
            },
            {
                label: 'Xác nhận thiết bị & Báo lỗi',
                path: '/owner/returns',
                icon: 'check',
            },
        ],
    },

    {
        title: 'TÀI CHÍNH & TƯƠNG TÁC',
        items: [
            {
                label: 'Quản lý Ví & Rút tiền',
                path: '/owner/wallet',
                icon: 'wallet',
            },
            {
                label: 'Báo cáo doanh thu',
                path: '/owner/revenue',
                icon: 'chart',
            },
            {
                label: 'Lịch sử giao dịch',
                path: '/owner/transactions',
                icon: 'history',
            },
            {
                label: 'Đánh giá giao dịch',
                path: '/owner/reviews',
                icon: 'star',
            },
            {
                label: 'Lịch sử trò chuyện',
                path: '/owner/messages',
                icon: 'chat',
            },
            {
                label: 'Thông báo',
                path: '/owner/notifications',
                icon: 'bell',
            },
        ],
    },
]

export default function OwnerSidebar() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path) => {
        if (path === '/owner') {
            return location.pathname === '/owner'
        }

        return location.pathname.startsWith(path)
    }

    return (
        <aside className="w-[190px] shrink-0 border-r border-gray-200 bg-white">
            <div className="flex min-h-[calc(100vh-68px)] flex-col">

                {/* MENU */}
                <div className="flex-1 px-4 py-5">

                    {menuGroups.map((group) => (
                        <div
                            key={group.title}
                            className="mb-6"
                        >
                            <h3 className="mb-2 px-2 text-[10px] font-semibold tracking-wide text-gray-400">
                                {group.title}
                            </h3>

                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = isActive(item.path)

                                    return (
                                        <button
                                            key={item.path}
                                            type="button"
                                            onClick={() => navigate(item.path)}
                                            className={`
                                                flex w-full items-center gap-2
                                                rounded-md
                                                px-[10px] py-2
                                                text-left text-[11px]
                                                leading-[15px]
                                                transition-colors
                                                ${
                                                active
                                                    ? 'bg-[#FFF3EC] font-medium text-[#F45116]'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#F45116]'
                                            }
                                            `}
                                        >
                                            <span className="flex w-3 shrink-0 items-center justify-center">
                                                <MenuIcon
                                                    type={item.icon}
                                                    active={active}
                                                />
                                            </span>

                                            <span className="min-w-0">
                                                {item.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                </div>

                {/* SETTINGS */}
                <div className="px-4 pb-5">
                    <button
                        type="button"
                        onClick={() => navigate('/owner/profile')}
                        className="
                            flex w-full items-center gap-2
                            rounded-md
                            border border-[#F45116]
                            px-[10px] py-2
                            text-[11px]
                            leading-[15px]
                            text-[#F45116]
                            transition-colors
                            hover:bg-[#FFF3EC]
                        "
                    >
                        <span className="flex w-3 shrink-0 items-center justify-center">
                            <MenuIcon
                                type="settings"
                                active={true}
                            />
                        </span>

                        <span>Cài đặt tài khoản</span>
                    </button>
                </div>

            </div>
        </aside>
    )
}