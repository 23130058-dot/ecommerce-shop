import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL, clearAuth, getStoredAuth, updateStoredUser } from '../../services/authApi.js'
import { getAccountProfile } from '../../services/accountApi.js'

import avatar from '../../assets/lensrent/avatar.png'
import brandMark from '../../assets/lensrent/brand-mark.svg'
import cartIcon from '../../assets/lensrent/cart.svg'
import chevronDownIcon from '../../assets/lensrent/chevron-down.svg'
import searchIcon from '../../assets/lensrent/search.svg'
import wishlistIcon from '../../assets/lensrent/wishlist.svg'
import { getCart, getWishlist } from '../../services/shoppingApi.js'

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
  const [auth, setAuth] = useState(() => getStoredAuth())
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [shoppingRevision, setShoppingRevision] = useState(0)
  const accountMenuRef = useRef(null)
  const avatarButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const syncAuth = () => {
      const currentAuth = getStoredAuth()
      setAuth(currentAuth)
      if (!currentAuth) {
        setCartCount(0)
        setWishlistCount(0)
      }
    }
    const refreshShopping = () => setShoppingRevision((revision) => revision + 1)
    window.addEventListener('lensrent-auth-changed', syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('lensrent-shopping-changed', refreshShopping)
    return () => {
      window.removeEventListener('lensrent-auth-changed', syncAuth)
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('lensrent-shopping-changed', refreshShopping)
    }
  }, [])
  useEffect(() => {
    if (!auth?.accessToken) return undefined
    let mounted = true
    const accessToken = auth.accessToken
    getAccountProfile()
      .then((profile) => {
        if (!mounted || getStoredAuth()?.accessToken !== accessToken) return
        const profileFields = {
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          avatarUrl: profile.avatarUrl,
        }
        updateStoredUser(profileFields)
        setAuth((current) => current?.accessToken === accessToken
          ? { ...current, user: { ...current.user, ...profileFields } }
          : current)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [auth?.accessToken])
  useEffect(() => {
    if (!auth) return undefined
    const controller = new AbortController()
    Promise.all([getCart({ signal: controller.signal }), getWishlist({ signal: controller.signal })])
      .then(([cart, wishlist]) => {
        if (controller.signal.aborted) return
        setCartCount((cart?.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0))
        setWishlistCount((wishlist || []).length)
      })
      .catch((error) => { if (error.name !== 'AbortError') { setCartCount(0); setWishlistCount(0) } })
    return () => controller.abort()
  }, [auth, shoppingRevision])
  useEffect(() => {
    if (!auth?.expiresAt) return undefined
    const delay = auth.expiresAt - Date.now()
    if (delay <= 0) {
      clearAuth()
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      clearAuth()
    }, delay)
    return () => window.clearTimeout(timeoutId)
  }, [auth?.expiresAt])
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setAccountMenuOpen(false), 0)
    return () => window.clearTimeout(timeoutId)
  }, [location.pathname])
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

  const handleLogout = () => {
    clearAuth()
    setAuth(null)
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
            <Link className="transition hover:text-[#ff5500]" to="/compare">So sánh</Link>
            <Link className="transition hover:text-[#ff5500]" to="/wishlist">Wishlist</Link>
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
          {auth && (
            <>
              <Link className="relative inline-flex" to="/wishlist" aria-label={`Danh sách yêu thích${wishlistCount ? `, ${wishlistCount} thiết bị` : ''}`}>
                <img className="size-5" src={wishlistIcon} alt="" />
                {wishlistCount > 0 && <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[#ff5500] px-1 text-[10px] font-bold leading-4 text-white">{wishlistCount}</span>}
              </Link>
              <Link className="relative inline-flex" to="/cart" aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} thiết bị` : ''}`}>
                <img className="size-5" src={cartIcon} alt="" />
                {cartCount > 0 && <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[#ff5500] px-1 text-[10px] font-bold leading-4 text-white">{cartCount}</span>}
              </Link>
            </>
          )}

          {auth ? (
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
              <img className="size-7 rounded-full object-cover" src={auth?.user?.avatarUrl ? (auth.user.avatarUrl.startsWith('http') ? auth.user.avatarUrl : `${API_BASE_URL}${auth.user.avatarUrl}`) : avatar} alt="" />
              <img className="size-3" src={chevronDownIcon} alt="" />
            </button>

            {accountMenuOpen && (
              <div
                aria-label="Menu tài khoản"
                className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl"
                role="menu"
              >
                <div className="border-b border-gray-100 px-4 pb-3 pt-2">
                  <p className="text-sm font-semibold text-gray-900">{auth?.user?.fullName || 'Tài khoản LensRent'}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{auth?.user?.email || 'Chưa đăng nhập'}</p>
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
                  {auth?.user?.role?.toUpperCase() === 'ADMIN' && (
                    <Link
                      className="block px-4 py-2.5 text-sm font-semibold text-[#e94b0a] transition hover:bg-orange-50"
                      onClick={() => setAccountMenuOpen(false)}
                      role="menuitem"
                      to="/admin"
                    >
                      Trang quản trị Admin
                    </Link>
                  )}
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
          ) : (
            <div className="flex items-center gap-2">
              <Link className="rounded-full px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100" to="/login">Đăng nhập</Link>
              <Link className="rounded-full bg-[#ff5500] px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600" to="/register">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
