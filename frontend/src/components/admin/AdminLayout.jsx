import { Link, useLocation } from 'react-router-dom'
import avatar from '../../assets/lensrent/avatar.png'
import brandMark from '../../assets/lensrent/brand-mark.svg'
import Footer from '../layout/Footer.jsx'
import { getStoredAuth } from '../../services/authApi.js'

export function AdminIcon({ name, className = 'size-4' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="7" r="3.5" /><path d="M16 4.2a3.5 3.5 0 0 1 0 6.6M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" /></>,
    camera: <><path d="M4 7.5h3l1.4-2h7.2l1.4 2h3A1.5 1.5 0 0 1 21.5 9v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" /><circle cx="12" cy="13.5" r="3.2" /></>,
    message: <><path d="M20.5 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3.5 2v-7.5a7.5 7.5 0 1 1 18  -2Z" /><path d="M8 11.5h8M8 14.5h5" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9L6.7 12l1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.9Z" transform="translate(-1.7 -1.5)" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    chat: <><path d="M20.5 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3.5 2v-7.5a7.5 7.5 0 1 1 18 -2Z" /><path d="M8 11.5h8M8 14.5h5" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    alert: <><path d="m10.3 3.7-8 14A1.5 1.5 0 0 0 3.6 20h16.8a1.5 1.5 0 0 0 1.3-2.3l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.5h.01" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    download: <><path d="M12 3v11m0 0 4-4m-4 4-4-4" /><path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    filter: <><path d="M4 5h16M7 12h10m-7 7h4" /><circle cx="8" cy="5" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
    eye: <><path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    box: <><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21" /></>,
  }
  return <svg {...common}>{paths[name] || paths.grid}</svg>
}

const primaryLinks = [
  { label: 'Tổng quan', icon: 'grid', to: '/admin' },
  { label: 'Quản lý người dùng', icon: 'users', to: '/admin/users' },
  { label: 'Duyệt thiết bị', icon: 'camera', to: '/admin/devices' },
  { label: 'Khiếu nại & Tranh chấp', icon: 'message', to: '/admin/disputes', disabled: true },
]

const systemLinks = [
  { label: 'Bảo mật & Phân quyền', icon: 'shield', to: '/admin/security', disabled: true },
  { label: 'Cấu hình hệ thống', icon: 'settings', to: '/admin/settings', disabled: true },
]

function NavigationItem({ item, pathname }) {
  const active = item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to)
  const className = `flex min-h-9 items-center gap-3 rounded-lg px-3 text-[12px] transition ${active ? 'bg-orange-50 font-semibold text-[#e94b0a]' : item.disabled ? 'cursor-default text-gray-400' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
  const contents = <><AdminIcon name={item.icon} className="size-4 shrink-0" /><span className="truncate">{item.label}</span></>

  if (item.disabled) return <span key={item.label} className={className} title="Mục này sẽ được triển khai sau">{contents}</span>
  return <Link key={item.label} to={item.to} aria-current={active ? 'page' : undefined} className={className}>{contents}</Link>
}

export default function AdminLayout({ children }) {
  const { pathname } = useLocation()
  const admin = getStoredAuth()?.user
  const adminName = admin?.fullName || admin?.email || 'Quản trị viên'
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1f2937]">
      <header className="sticky top-0 z-20 h-[62px] border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2" aria-label="LensRent trang chủ">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#f45116]"><img className="size-[18px]" src={brandMark} alt="" /></span>
              <span className="text-[17px] font-bold tracking-tight text-[#f45116]">LensRent</span>
            </Link>
            <span className="hidden h-5 w-px bg-gray-200 sm:block" />
            <span className="hidden text-[11px] font-semibold tracking-wide text-gray-500 sm:block">TRUNG TÂM QUẢN TRỊ</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/" className="hidden items-center gap-1.5 text-[11px] font-medium text-gray-500 transition hover:text-[#f45116] sm:inline-flex"><AdminIcon name="external" className="size-3.5" /> Xem trang web</Link>
            <button type="button" className="relative flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100" aria-label="Thông báo">
              <span className="text-lg leading-none">♧</span><span className="absolute right-1 top-1 size-2 rounded-full border border-white bg-[#f45116]" />
            </button>
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3">
              <img src={avatar} className="size-8 rounded-full object-cover" alt="Ảnh đại diện quản trị viên" />
              <div className="hidden sm:block"><p className="max-w-40 truncate text-[11px] font-semibold text-gray-800">{adminName}</p><p className="text-[10px] text-gray-400">Admin Hệ Thống</p></div>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px] items-start gap-6 px-4 py-5 sm:px-6 lg:gap-8 lg:px-8">
        <aside className="sticky top-[82px] hidden w-[205px] shrink-0 rounded-xl border border-gray-200 bg-white p-3 lg:block" aria-label="Menu quản trị">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-2 pb-4 pt-1">
            <img src={avatar} className="size-9 rounded-full object-cover" alt="" />
            <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-gray-800">{adminName}</p><p className="truncate text-[10px] text-gray-400">Admin Hệ Thống</p></div>
            <span className="ml-auto text-xs text-gray-400">⌄</span>
          </div>
          <nav className="space-y-1 pt-4">{primaryLinks.map((item) => <NavigationItem key={item.label} item={item} pathname={pathname} />)}</nav>
          <div className="mt-6 px-3 text-[9px] font-bold tracking-[0.1em] text-gray-400">HỆ THỐNG</div>
          <nav className="mt-2 space-y-1">{systemLinks.map((item) => <NavigationItem key={item.label} item={item} pathname={pathname} />)}</nav>
          <div className="mt-6 rounded-lg border border-gray-100 p-3">
            <p className="text-[9px] font-bold tracking-[0.08em] text-gray-400">HỆ THỐNG TRẠNG THÁI</p>
            <div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-gray-500">Uptime (30 ngày)</span><strong className="text-emerald-600">99.98%</strong></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full w-[99%] rounded-full bg-emerald-500" /></div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Menu quản trị">
            {primaryLinks.filter((item) => !item.disabled).map((item) => {
              const active = item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to)
              return <Link key={item.label} to={item.to} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium ${active ? 'border-orange-200 bg-orange-50 text-[#e94b0a]' : 'border-gray-200 bg-white text-gray-600'}`}><AdminIcon name={item.icon} className="size-3.5" />{item.label}</Link>
            })}
          </nav>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  )
}
