import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import avatar from '../../assets/lensrent/avatar.png'
import brandMark from '../../assets/lensrent/brand-mark.svg'
import cartIcon from '../../assets/lensrent/cart.svg'
import chevronDownIcon from '../../assets/lensrent/chevron-down.svg'
import searchIcon from '../../assets/lensrent/search.svg'
import wishlistIcon from '../../assets/lensrent/wishlist.svg'

const accountLinks = [
  { to: '/renter', label: 'Trang Renter' },
  { to: '/renter/orders', label: 'Đơn thuê của tôi' },
  { to: '/renter/favorites', label: 'Thiết bị yêu thích' },
  { to: '/renter/profile', label: 'Thông tin cá nhân' },
]

export default function Header({
  searchValue = '',
  onSearchChange = () => {},
  onSearch = () => {},
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)
  const avatarButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!accountMenuOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        avatarButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  useEffect(() => {
    setAccountMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    setAccountMenuOpen(false)
    navigate('/login')
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto grid min-h-16 max-w-[1280px] grid-cols-[1fr_auto] items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6 xl:flex xl:gap-8 xl:px-6 xl:py-0">
        <div className="flex min-w-0 items-center gap-8">
          <Link className="flex shrink-0 items-center gap-2" to="/" aria-label="LensRent - Trang chủ">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#ff5500]">
              <img className="size-4" src={brandMark} alt="" />
            </span>
            <span className="text-xl font-bold leading-7 text-[#ff5500]">LensRent</span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-medium text-gray-600 xl:flex" aria-label="Điều hướng chính">
            <Link className="transition hover:text-[#ff5500]" to="/">Trang chủ</Link>
            <Link className="transition hover:text-[#ff5500]" to="/categories">Danh mục</Link>
            <Link className="transition hover:text-[#ff5500]" to="/#products">So sánh</Link>
            <Link className="transition hover:text-[#ff5500]" to="/#products">Wishlist</Link>
          </nav>
        </div>

        <form
          className="col-span-2 order-3 flex h-9 min-w-0 items-center gap-3 rounded-full bg-gray-100 px-3.5 xl:order-2 xl:col-span-1 xl:flex-1"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch()
          }}
        >
          <img className="size-4 shrink-0" src={searchIcon} alt="" />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
            type="search"
            placeholder="Tìm kiếm thiết bị..."
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Tìm kiếm thiết bị"
          />
        </form>

        <div className="order-2 flex shrink-0 items-center justify-end gap-4 xl:order-3 xl:gap-5">
          <Link className="relative inline-flex" to="/#products" aria-label="Danh sách yêu thích, 4 sản phẩm">
            <img className="size-5" src={wishlistIcon} alt="" />
            <span className="absolute -right-2 -top-2 flex size-[15px] items-center justify-center rounded-full bg-[#ff5500] text-[8px] font-bold leading-none text-white">4</span>
          </Link>
          <Link className="relative inline-flex" to="/#products" aria-label="Giỏ hàng, 1 sản phẩm">
            <img className="size-5" src={cartIcon} alt="" />
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-[#ff5500] text-[9px] font-bold leading-none text-white">1</span>
          </Link>

          <div className="relative" ref={accountMenuRef}>
            <button
              ref={avatarButtonRef}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              aria-label="Mở menu tài khoản"
              className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ff5500] focus-visible:ring-offset-2"
              onClick={() => setAccountMenuOpen((open) => !open)}
              type="button"
            >
              <img className="size-7 rounded-full object-cover" src={avatar} alt="" />
              <img className="size-3" src={chevronDownIcon} alt="" />
            </button>

            {accountMenuOpen && (
              <div
                aria-label="Menu tài khoản"
                className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl"
                role="menu"
              >
                <div className="border-b border-gray-100 px-4 pb-3 pt-2">
                  <p className="text-sm font-semibold text-gray-900">Tài khoản LensRent</p>
                  <p className="mt-0.5 text-xs text-gray-500">Chọn khu vực bạn muốn sử dụng</p>
                </div>

                <div className="py-1">
                  {accountLinks.map((item) => (
                    <Link
                      className="block px-4 py-2.5 text-sm text-gray-700 transition hover:bg-orange-50 hover:text-[#e94b0a]"
                      key={item.to}
                      onClick={() => setAccountMenuOpen(false)}
                      role="menuitem"
                      to={item.to}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-gray-100 py-1">
                  <Link
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-orange-50 hover:text-[#e94b0a]"
                    onClick={() => setAccountMenuOpen(false)}
                    role="menuitem"
                    to="/owner"
                  >
                    Trang Owner · Quản lý thiết bị
                  </Link>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    onClick={handleLogout}
                    role="menuitem"
                    type="button"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}