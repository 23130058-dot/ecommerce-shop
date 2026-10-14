import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import avatar from '../assets/lensrent/avatar.png'
import brandMark from '../assets/lensrent/brand-mark.svg'
import Footer from '../components/layout/Footer.jsx'
import { getAdminDashboard } from '../services/adminApi.js'
import { getStoredAuth } from '../services/authApi.js'

const adminLinks = [
  { label: 'Tổng quan', icon: 'grid', active: true, to: '/admin' },
  { label: 'Quản lý người dùng', icon: 'users', to: '/admin/users' },
  { label: 'Duyệt thiết bị', icon: 'camera', to: '/admin/devices' },
  { label: 'Khiếu nại & Tranh chấp', icon: 'message', disabled: true },
]

const systemLinks = [
  { label: 'Bảo mật & Phân quyền', icon: 'shield', disabled: true },
  { label: 'Cấu hình hệ thống', icon: 'settings', disabled: true },
]

function formatMoney(value) {
  if (value === null || value === undefined) return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? `${amount.toLocaleString('vi-VN')}đ` : '—'
}

function formatRelativeTime(value) {
  if (!value) return '—'
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
  if (elapsedMinutes < 1) return 'Vừa xong'
  if (elapsedMinutes < 60) return `${elapsedMinutes} phút trước`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours} giờ trước`
  return `${Math.floor(elapsedHours / 24)} ngày trước`
}

function mapActivity(activity) {
  const description = activity.description || ''
  const isUser = description.startsWith('Người dùng')
  const isDevice = description.startsWith('Thiết bị')
  return {
    icon: isUser ? 'users' : isDevice ? 'camera' : 'calendar',
    tone: isUser ? 'blue' : isDevice ? 'green' : 'purple',
    text: description,
    time: formatRelativeTime(activity.occurredAt),
  }
}

function AdminIcon({ name, className = 'size-4' }) {
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
  }

  return <svg {...common}>{paths[name] || paths.grid}</svg>
}

function StatCard({ title, value, note, icon, color = 'orange' }) {
  const colorClasses = {
    orange: 'bg-orange-50 text-[#f45116]',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    red: 'bg-red-50 text-red-500',
  }

  return (
    <article className="flex min-h-[116px] items-start justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-5">
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.08em] text-gray-500 sm:text-[11px]">{title}</p>
        <p className="mt-2 truncate text-[23px] font-bold tracking-tight text-[#1f2937] sm:text-[26px]">{value}</p>
        <p className="mt-1.5 text-[10px] text-gray-500 sm:text-[11px]">{note}</p>
      </div>
      <span className={`ml-2 flex size-9 shrink-0 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        <AdminIcon name={icon} className="size-[18px]" />
      </span>
    </article>
  )
}

function RevenueLineChart({ rows, metric }) {
  const width = 650
  const height = 236
  const plot = { left: 44, top: 14, right: 16, bottom: 30 }
  const plotWidth = width - plot.left - plot.right
  const plotHeight = height - plot.top - plot.bottom
  const max = Math.ceil(Math.max(...rows.map((row) => row[metric])) / (metric === 'revenue' ? 20 : 250)) * (metric === 'revenue' ? 20 : 250)
  const points = rows.map((row, index) => ({
    x: plot.left + (rows.length === 1 ? plotWidth / 2 : (index / (rows.length - 1)) * plotWidth),
    y: plot.top + plotHeight - (row[metric] / max) * plotHeight,
    row,
  }))
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPath = `${plot.left},${plot.top + plotHeight} ${polyline} ${plot.left + plotWidth},${plot.top + plotHeight}`
  const formatAxis = (value) => metric === 'revenue' ? `${value}tr` : value.toLocaleString('vi-VN')

  return (
    <svg className="h-[225px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={metric === 'revenue' ? 'Biểu đồ doanh thu theo tháng, đơn vị triệu đồng' : 'Biểu đồ lượt thuê theo tháng'}>
      <defs>
        <linearGradient id="revenue-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f45116" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#f45116" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((line) => {
        const y = plot.top + (plotHeight / 3) * line
        return (
          <g key={line}>
            <line x1={plot.left} y1={y} x2={plot.left + plotWidth} y2={y} stroke="#edf0f3" strokeDasharray="3 5" />
            <text x={plot.left - 8} y={y + 3.5} textAnchor="end" fill="#98a2b3" fontSize="10">{formatAxis(Math.round(max - (max / 3) * line))}</text>
          </g>
        )
      })}
      <polygon points={areaPath} fill="url(#revenue-area)" />
      <polyline points={polyline} fill="none" stroke="#f45116" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(({ x, y, row }) => (
        <g key={row.month}>
          <circle cx={x} cy={y} r="4.5" fill="white" stroke="#f45116" strokeWidth="2.5"><title>{`${row.month}: ${metric === 'revenue' ? `${row.revenue} triệu đồng` : `${row.rentals} lượt thuê`}`}</title></circle>
          <text x={x} y={height - 7} textAnchor="middle" fill="#98a2b3" fontSize="10">{row.month}</text>
        </g>
      ))}
    </svg>
  )
}

function CategoryPieChart({ items, total }) {
  const radius = 58
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-9">
      <div className="relative size-[170px] shrink-0" role="img" aria-label="Biểu đồ tròn doanh thu theo danh mục thiết bị">
        <svg className="size-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f3f5" strokeWidth="20" />
          {items.map((item) => {
            const segment = circumference * (item.value / 100)
            const segmentOffset = offset
            offset += segment
            return (
              <circle
                key={item.name}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={`${segment} ${circumference - segment}`}
                strokeDashoffset={-segmentOffset}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-gray-500">Doanh thu</span>
          <strong className="mt-1 text-[15px] text-gray-900">{Number.isFinite(Number(total)) ? `${(Number(total) / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr` : '—'}</strong>
          <span className="mt-0.5 text-[10px] text-gray-400">Tháng này</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-x-5 gap-y-4 sm:w-auto sm:grid-cols-1 sm:gap-y-3">
        {items.map((item) => (
          <div key={item.name} className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="truncate text-[11px] font-medium text-gray-600">{item.name}</span>
              <strong className="ml-auto text-[11px] text-gray-800">{item.value}%</strong>
            </div>
            <p className="pl-[18px] pt-0.5 text-[10px] text-gray-400">{formatMoney(item.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityItem({ activity }) {
  const tone = {
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-100 text-gray-500',
  }

  return (
    <li className="flex gap-3 py-3.5 first:pt-4 last:pb-0">
      <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${tone[activity.tone]}`}>
        <AdminIcon name={activity.icon} className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-[1.55] text-gray-700">{activity.text}</p>
        <p className="mt-1 text-[10px] text-gray-400">{activity.time}</p>
      </div>
    </li>
  )
}

function exportDashboardCsv(categoryRevenue) {
  const rows = [
    ['Danh mục', 'Tỷ trọng doanh thu', 'Doanh thu'],
    ...categoryRevenue.map((item) => [item.name, `${item.value}%`, item.amount]),
  ]
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'lensrent-admin-doanh-thu.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

function SidebarLink({ item }) {
  const className = `flex min-h-9 items-center gap-3 rounded-lg px-3 text-[12px] transition ${item.active ? 'bg-orange-50 font-semibold text-[#e94b0a]' : item.disabled ? 'cursor-default text-gray-400' : 'text-gray-600 hover:bg-gray-50'}`
  const contents = <><AdminIcon name={item.icon} className="size-4 shrink-0" /><span className="truncate">{item.label}</span></>
  if (item.disabled) return <span className={className} title="Mục này sẽ được triển khai sau">{contents}</span>
  return <Link to={item.to} aria-current={item.active ? 'page' : undefined} className={className}>{contents}</Link>
}

export default function AdminDashboardPage() {
  const admin = getStoredAuth()?.user
  const adminName = admin?.fullName || admin?.email || 'Quản trị viên'
  const [metric, setMetric] = useState('revenue')
  const [monthCount, setMonthCount] = useState(6)
  const [dashboard, setDashboard] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardLoading, setDashboardLoading] = useState(true)

  useEffect(() => {
    let current = true
    getAdminDashboard()
      .then((response) => {
        if (current) {
          setDashboard(response)
          setDashboardError('')
        }
      })
      .catch((error) => {
        if (current) setDashboardError(error.message)
      })
      .finally(() => {
        if (current) setDashboardLoading(false)
      })
    return () => { current = false }
  }, [])

  const chartRows = useMemo(() => (dashboard?.monthlyRevenue || []).slice(-monthCount).map((item) => ({
    month: `T${item.month}`,
    revenue: Number(item.amount) / 1_000_000,
    rentals: Number(item.completedRentals) || 0,
  })), [dashboard, monthCount])
  const pieItems = useMemo(() => (dashboard?.revenueByCategory || []).map((item, index) => ({
    name: item.name,
    value: Number(item.percentage) || 0,
    amount: Number(item.amount) || 0,
    color: ['#f45116', '#243b53', '#f8a24b', '#86a5a3', '#8b7cf6', '#cf6d8f'][index % 6],
  })), [dashboard])
  const recentActivities = (dashboard?.recentActivities || []).map(mapActivity)

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
            <Link to="/" className="hidden items-center gap-1.5 text-[11px] font-medium text-gray-500 transition hover:text-[#f45116] sm:inline-flex">
              <AdminIcon name="external" className="size-3.5" /> Xem trang web
            </Link>
            <button type="button" className="relative flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100" aria-label="Thông báo">
              <span className="text-lg leading-none">♧</span>
              <span className="absolute right-1 top-1 size-2 rounded-full border border-white bg-[#f45116]" />
            </button>
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3">
              <img src={avatar} className="size-8 rounded-full object-cover" alt="Ảnh đại diện quản trị viên" />
              <div className="hidden sm:block">
                <p className="max-w-40 truncate text-[11px] font-semibold text-gray-800">{adminName}</p>
                <p className="text-[10px] text-gray-400">Admin Hệ Thống</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] items-start gap-6 px-4 py-5 sm:px-6 lg:gap-8 lg:px-8">
        <aside className="sticky top-[82px] hidden w-[205px] shrink-0 rounded-xl border border-gray-200 bg-white p-3 lg:block" aria-label="Menu quản trị">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-2 pb-4 pt-1">
            <img src={avatar} className="size-9 rounded-full object-cover" alt="" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-gray-800">{adminName}</p>
              <p className="truncate text-[10px] text-gray-400">Admin Hệ Thống</p>
            </div>
            <span className="ml-auto text-xs text-gray-400">⌄</span>
          </div>
          <nav className="space-y-1 pt-4">
            {adminLinks.map((item) => <SidebarLink key={item.label} item={item} />)}
          </nav>
          <div className="mt-6 px-3 text-[9px] font-bold tracking-[0.1em] text-gray-400">HỆ THỐNG</div>
          <nav className="mt-2 space-y-1">
            {systemLinks.map((item) => <SidebarLink key={item.label} item={item} />)}
          </nav>
          <div className="mt-6 rounded-lg border border-gray-100 p-3">
            <p className="text-[9px] font-bold tracking-[0.08em] text-gray-400">HỆ THỐNG TRẠNG THÁI</p>
            <div className="mt-3 flex items-center justify-between text-[10px]">
              <span className="text-gray-500">Uptime (30 ngày)</span>
              <strong className="text-emerald-600">99.98%</strong>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full w-[99%] rounded-full bg-emerald-500" /></div>
          </div>
        </aside>

        <main id="overview" className="min-w-0 flex-1">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold tracking-tight text-[#1f2937] sm:text-[24px]">Trang Quản Trị Hệ Thống</h1>
                {dashboardLoading && <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-semibold text-gray-500">ĐANG TẢI</span>}
              </div>
              <p className="mt-1 text-[11px] leading-5 text-gray-500 sm:text-xs">Giám sát hoạt động nền tảng, xử lý tranh chấp và quản lý cấu hình LensRent.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-[11px] text-gray-600 focus-within:border-orange-400">
                <AdminIcon name="calendar" className="size-3.5 text-gray-500" />
                <select aria-label="Khoảng thời gian biểu đồ" value={monthCount} onChange={(event) => setMonthCount(Number(event.target.value))} className="max-w-[125px] bg-transparent outline-none">
                  <option value={3}>3 tháng gần nhất</option>
                  <option value={6}>6 tháng gần nhất</option>
                  <option value={12}>12 tháng gần nhất</option>
                </select>
              </label>
              <button onClick={() => exportDashboardCsv(pieItems)} disabled={dashboardLoading || pieItems.length === 0} type="button" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#f45116] px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#df4610] disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5">
                <AdminIcon name="download" className="size-3.5" /> <span>Xuất báo cáo</span>
              </button>
            </div>
          </div>

          {dashboardError && <div role="alert" className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] text-rose-700">{dashboardError}</div>}

          <section aria-label="Thống kê tổng quan" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
            <StatCard title="TỔNG DOANH THU (THÁNG)" value={formatMoney(dashboard?.revenueThisMonth)} note="Thanh toán thành công trong tháng" icon="grid" color="orange" />
            <StatCard title="LƯỢT THUÊ HOÀN TẤT" value={dashboard?.completedRentals?.toLocaleString('vi-VN') ?? '—'} note="Tổng đơn thuê đã hoàn tất" icon="calendar" color="blue" />
            <StatCard title="NGƯỜI DÙNG MỚI" value={dashboard?.newUsersThisMonth?.toLocaleString('vi-VN') ?? '—'} note="Đăng ký trong tháng hiện tại" icon="users" color="violet" />
            <StatCard title="TRANH CHẤP ĐANG XỬ LÝ" value={dashboard?.openDisputes?.toLocaleString('vi-VN') ?? '—'} note="Đơn đang chờ xử lý tranh chấp" icon="message" color="red" />
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.85fr)_minmax(285px,0.9fr)]" aria-label="Phân tích và hoạt động mới">
            <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13px] font-bold text-gray-800">Biểu Đồ Doanh Thu & Tăng Trưởng</h2>
                  <p className="mt-1 text-[10px] text-gray-400">Dữ liệu tổng hợp theo tháng trong 12 tháng gần nhất</p>
                </div>
                <div className="flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Chọn dữ liệu biểu đồ">
                  <button type="button" onClick={() => setMetric('revenue')} aria-pressed={metric === 'revenue'} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold transition ${metric === 'revenue' ? 'bg-white text-[#e94b0a] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Tiền</button>
                  <button type="button" onClick={() => setMetric('rentals')} aria-pressed={metric === 'rentals'} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold transition ${metric === 'rentals' ? 'bg-white text-[#e94b0a] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Lượt</button>
                </div>
              </div>
              {chartRows.length > 0 ? <RevenueLineChart rows={chartRows} metric={metric} /> : <div className="flex h-[225px] items-center justify-center text-[11px] text-gray-400">{dashboardLoading ? 'Đang tải biểu đồ…' : 'Chưa có dữ liệu thanh toán/đơn thuê để vẽ biểu đồ.'}</div>}
              <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                <span className="h-0.5 w-4 rounded-full bg-[#f45116]" />
                {metric === 'revenue' ? 'Doanh thu (triệu đồng)' : 'Lượt thuê hoàn tất'}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-gray-800">Hoạt động mới nhất</h2>
                  <p className="mt-1 text-[10px] text-gray-400">Hoạt động gần đây trong hệ thống</p>
                </div>
                <button type="button" className="rounded-md px-2 py-1 text-[10px] font-semibold text-[#e94b0a] hover:bg-orange-50">Xem tất cả</button>
              </div>
              <ul className="mt-1 divide-y divide-gray-100">
                {recentActivities.map((activity, index) => <ActivityItem key={`${activity.text}-${activity.time}-${index}`} activity={activity} />)}
                {!dashboardLoading && recentActivities.length === 0 && <li className="py-8 text-center text-[11px] text-gray-400">Chưa có hoạt động để hiển thị.</li>}
              </ul>
            </article>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]" aria-label="Doanh thu theo danh mục thiết bị">
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13px] font-bold text-gray-800">Doanh thu theo danh mục thiết bị</h2>
                  <p className="mt-1 text-[10px] text-gray-400">Tỷ trọng doanh thu tháng hiện tại</p>
                </div>
                <span className="rounded-md bg-gray-50 px-2 py-1 text-[10px] text-gray-500">Tháng này⌄</span>
              </div>
              {pieItems.length > 0 ? <CategoryPieChart items={pieItems} total={dashboard?.revenueThisMonth} /> : <div className="flex min-h-[170px] items-center justify-center text-center text-[11px] text-gray-400">{dashboardLoading ? 'Đang tải biểu đồ…' : 'Chưa có dữ liệu thanh toán theo danh mục.'}</div>}
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13px] font-bold text-gray-800">Sức khỏe nền tảng</h2>
                  <p className="mt-1 text-[10px] text-gray-400">Tình trạng hệ thống trong 30 ngày</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" /> Hoạt động</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-500">Uptime</p>
                  <p className="mt-1 text-lg font-bold text-gray-800">—</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-500">Thời gian phản hồi</p>
                  <p className="mt-1 text-lg font-bold text-gray-800">— <span className="text-xs font-medium text-gray-400">ms</span></p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[10px]">
                <span className="text-gray-500">Database PostgreSQL</span>
                <span className="font-semibold text-emerald-600">Đang hoạt động</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <span className="text-gray-500">API Backend</span>
                <span className="font-semibold text-emerald-600">Đang hoạt động</span>
              </div>
            </article>
          </section>

          <p className="mb-2 mt-5 text-center text-[10px] text-gray-400">Thống kê doanh thu và người dùng được truy vấn trực tiếp từ PostgreSQL.</p>
        </main>
      </div>
      <Footer />
    </div>
  )
}
