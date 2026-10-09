import { Link, NavLink, useLocation } from 'react-router-dom'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'

const sections = [
  { path: '/renter', label: 'Tổng quan' },
  { path: '/renter/orders', label: 'Đơn thuê của tôi' },
  { path: '/renter/favorites', label: 'Thiết bị yêu thích' },
  { path: '/renter/profile', label: 'Thông tin cá nhân' },
]

const sectionContent = {
  renter: {
    title: 'Không gian Renter',
    description: 'Theo dõi đơn thuê, thiết bị yêu thích và thông tin tài khoản của bạn.',
  },
  orders: {
    title: 'Đơn thuê của tôi',
    description: 'Các đơn thuê thiết bị sẽ xuất hiện tại đây.',
  },
  favorites: {
    title: 'Thiết bị yêu thích',
    description: 'Lưu thiết bị bạn quan tâm để xem lại sau.',
  },
  profile: {
    title: 'Thông tin cá nhân',
    description: 'Quản lý thông tin tài khoản LensRent của bạn.',
  },
}

function EmptyState({ title, description, actionLabel = 'Khám phá thiết bị' }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-orange-50 text-xl text-[#ff5500]" aria-hidden="true">
        ◇
      </div>
      <h2 className="mt-4 text-base font-bold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">{description}</p>
      <Link className="mt-5 inline-flex rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600" to="/categories">
        {actionLabel}
      </Link>
    </div>
  )
}

export default function RenterPage() {
  const location = useLocation()
  const activeSection = location.pathname.split('/')[2] || 'renter'
  const content = sectionContent[activeSection] || sectionContent.renter

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#ff5500]">LensRent · Khu vực khách thuê</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{content.title}</h1>
          <p className="mt-2 text-sm text-gray-500">{content.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Điều hướng khu vực Renter" className="h-fit rounded-xl border border-gray-200 bg-white p-2">
            {sections.map((section) => (
              <NavLink
                className={({ isActive }) => `mb-1 block rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-orange-50 text-[#e94b0a]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                end={section.path === '/renter'}
                key={section.path}
                to={section.path}
              >
                {section.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900" to="/owner">
                Chuyển sang Owner
              </Link>
            </div>
          </nav>

          <section className="min-w-0">
            {activeSection === 'renter' ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Link className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm" to="/renter/orders">
                  <p className="text-sm font-semibold text-gray-900">Đơn thuê của tôi</p>
                  <p className="mt-2 text-sm text-gray-500">Theo dõi đơn thuê và lịch nhận thiết bị.</p>
                  <span className="mt-5 inline-block text-sm font-semibold text-[#ff5500]">Xem đơn thuê →</span>
                </Link>
                <Link className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm" to="/renter/favorites">
                  <p className="text-sm font-semibold text-gray-900">Thiết bị yêu thích</p>
                  <p className="mt-2 text-sm text-gray-500">Mở lại danh sách thiết bị bạn đã lưu.</p>
                  <span className="mt-5 inline-block text-sm font-semibold text-[#ff5500]">Xem danh sách →</span>
                </Link>
                <Link className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm sm:col-span-2 xl:col-span-1" to="/renter/profile">
                  <p className="text-sm font-semibold text-gray-900">Thông tin cá nhân</p>
                  <p className="mt-2 text-sm text-gray-500">Xem và cập nhật thông tin tài khoản.</p>
                  <span className="mt-5 inline-block text-sm font-semibold text-[#ff5500]">Mở hồ sơ →</span>
                </Link>
              </div>
            ) : activeSection === 'profile' ? (
              <EmptyState title="Hồ sơ tài khoản" description="Phần hồ sơ sẽ hiển thị thông tin sau khi chức năng đăng nhập được kết nối với backend." actionLabel="Đăng nhập" />
            ) : activeSection === 'orders' ? (
              <EmptyState title="Bạn chưa có đơn thuê nào" description="Khi bạn đặt thuê thiết bị, trạng thái và lịch thuê sẽ được cập nhật tại đây." />
            ) : (
              <EmptyState title="Danh sách yêu thích đang trống" description="Bạn có thể xem danh mục và lưu thiết bị muốn thuê để quay lại sau." />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}