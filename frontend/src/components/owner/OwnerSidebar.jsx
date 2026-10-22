import { useLocation, useNavigate } from 'react-router-dom'
import { getStoredAuth } from '../../services/authApi.js'

function MenuIcon({ type, active = false }) {
    const color = active ? '#F45116' : '#64748B'

    const props = {
        width: 18,
        height: 18,
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
    const auth = getStoredAuth()
    const ownerName = auth?.user?.fullName || 'Chủ thiết bị LensRent'

    const isActive = (path) => {
        if (path === '/owner') {
            return location.pathname === '/owner'
        }

        return location.pathname.startsWith(path)
    }

    return (
        <aside className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-[#ed4b0a]">
                    {ownerName.slice(0, 1).toLocaleUpperCase('vi')}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{ownerName}</p>
                    <p className="mt-0.5 text-xs text-gray-400">Chủ thiết bị LensRent</p>
                </div>
            </div>

            <nav aria-label="Workspace owner" className="rounded-xl border border-gray-200 bg-white p-2">
                {menuGroups.map((group) => (
                    <div key={group.title} className="mb-3 last:mb-0">
                        <h2 className="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                            {group.title}
                        </h2>
                        <div>
                            {group.items.map((item) => {
                                const active = isActive(item.path)
                                return (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onClick={() => navigate(item.path)}
                                        aria-current={active ? 'page' : undefined}
                                        className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${active ? 'bg-orange-50 text-[#e94b0a]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        <span className="flex w-5 shrink-0 items-center justify-center" aria-hidden="true">
                                            <MenuIcon type={item.icon} active={active} />
                                        </span>
                                        <span className="min-w-0">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Cần hỗ trợ?</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">Liên hệ đội ngũ LensRent để được trợ giúp về lịch thuê hoặc thiết bị.</p>
                <a className="mt-3 inline-flex rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-[#ff5500] hover:text-[#ff5500]" href="tel:19006789">Hỗ trợ ngay</a>
            </div>
        </aside>
    )
}
