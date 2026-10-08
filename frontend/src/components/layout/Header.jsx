import { Link } from 'react-router-dom'

import avatar from '../../assets/lensrent/avatar.png'
import brandMark from '../../assets/lensrent/brand-mark.svg'
import cartIcon from '../../assets/lensrent/cart.svg'
import chevronDownIcon from '../../assets/lensrent/chevron-down.svg'
import searchIcon from '../../assets/lensrent/search.svg'
import wishlistIcon from '../../assets/lensrent/wishlist.svg'

export default function Header({
                                 searchValue = '',
                                 onSearchChange = () => {},
                                 onSearch = () => {},
                               }) {
  return (
      <header className="h-[68px] border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-8 px-6">

          {/* ================= LOGO ================= */}
          <Link
              to="/"
              className="flex shrink-0 items-center gap-2"
              aria-label="LensRent - Trang chủ"
          >
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#ff5500]">
                        <img
                            src={brandMark}
                            alt=""
                            className="size-4"
                        />
                    </span>

            <span className="text-xl font-bold leading-7 text-[#ff5500]">
                        LensRent
                    </span>
          </Link>


          {/* ================= NAVIGATION ================= */}
          <nav
              className="flex shrink-0 items-center gap-6 text-xs font-medium text-gray-600"
              aria-label="Điều hướng chính"
          >
            <Link
                to="/"
                className="transition hover:text-[#ff5500]"
            >
              Trang chủ
            </Link>

            <Link
                to="/#categories"
                className="transition hover:text-[#ff5500]"
            >
              Danh mục
            </Link>

            <Link
                to="/#products"
                className="transition hover:text-[#ff5500]"
            >
              So sánh
            </Link>

            <Link
                to="/#products"
                className="transition hover:text-[#ff5500]"
            >
              Wishlist
            </Link>
          </nav>


          {/* ================= SEARCH ================= */}
          <form
              className="flex h-9 min-w-0 flex-1 items-center gap-3 rounded-full bg-gray-100 px-3.5"
              role="search"
              onSubmit={(event) => {
                event.preventDefault()
                onSearch()
              }}
          >
            <img
                src={searchIcon}
                alt=""
                className="size-4 shrink-0"
            />

            <input
                className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
                type="search"
                placeholder="Tìm kiếm thiết bị..."
                value={searchValue}
                onChange={(event) =>
                    onSearchChange(event.target.value)
                }
                aria-label="Tìm kiếm thiết bị"
            />
          </form>


          {/* ================= RIGHT ACTIONS ================= */}
          <div className="flex shrink-0 items-center gap-5">

            {/* Wishlist */}
            <Link
                className="relative inline-flex"
                to="/#products"
                aria-label="Danh sách yêu thích"
            >
              <img
                  src={wishlistIcon}
                  alt=""
                  className="size-5"
              />

              <span className="absolute -right-2 -top-2 flex size-[15px] items-center justify-center rounded-full bg-[#ff5500] text-[8px] font-bold leading-none text-white">
                            4
                        </span>
            </Link>


            {/* Cart */}
            <Link
                className="relative inline-flex"
                to="/#products"
                aria-label="Giỏ hàng"
            >
              <img
                  src={cartIcon}
                  alt=""
                  className="size-5"
              />

              <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-[#ff5500] text-[9px] font-bold leading-none text-white">
                            1
                        </span>
            </Link>


            {/* Profile */}
            <Link
                className="flex items-center gap-1.5"
                to="/profile"
                aria-label="Tài khoản của tôi"
            >
              <img
                  className="size-7 rounded-full object-cover"
                  src={avatar}
                  alt="Ảnh đại diện tài khoản"
              />

              <img
                  src={chevronDownIcon}
                  alt=""
                  className="size-3"
              />
            </Link>

          </div>

        </div>
      </header>
  )
}