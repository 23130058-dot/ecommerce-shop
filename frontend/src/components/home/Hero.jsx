import heroBackground from '../../assets/lensrent/hero-background.png'
import heroSearchIcon from '../../assets/lensrent/hero-search.svg'

export default function Hero({ searchValue, onSearchChange, onSearch }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#111827] text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#111827]">
        <img className="h-full w-full object-cover object-center opacity-[0.35]" src={heroBackground} alt="" />
      </div>
      <div className="mx-auto flex min-h-[460px] max-w-[1280px] flex-col px-6 py-14 sm:py-16">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.55px] text-[#ff5500]">Dịch vụ thuê thiết bị uy tín</p>
        <h1 className="max-w-[576px] text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl">
          Nâng Tầm Tác Phẩm<br />Với Thiết Bị Đỉnh Cao
        </h1>
        <p className="mt-3 max-w-[510px] text-sm leading-6 text-gray-300">
          LensRent mang tới cho bạn cơ hội sở hữu những bộ máy ảnh, ống kính và thiết bị điện ảnh chuyên nghiệp nhất. Quy trình đơn giản, cọc linh hoạt, giao nhận tận nơi.
        </p>
        <form
          className="mt-5 flex w-full max-w-[448px] flex-col gap-2 sm:flex-row"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch()
          }}
        >
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-white px-3.5 text-gray-400">
            <img src={heroSearchIcon} alt="" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
              type="search"
              placeholder="Tìm tên máy ảnh, máy quay, ống kính..."
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              aria-label="Tìm tên máy ảnh, máy quay hoặc ống kính"
            />
          </label>
          <button className="h-9 shrink-0 rounded-lg bg-[#ff5500] px-6 text-xs font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300" type="submit">
            Tìm Kế Tiếp
          </button>
        </form>

        <div className="mt-auto flex max-w-[780px] gap-7 border-t border-white/15 pt-5 sm:gap-10">
          <div>
            <p className="text-xl font-bold leading-7">5,000+</p>
            <p className="text-[11px] text-gray-300">Thiết bị có sẵn</p>
          </div>
          <div>
            <p className="text-xl font-bold leading-7">12,000+</p>
            <p className="text-[11px] text-gray-300">Khách hàng hài lòng</p>
          </div>
          <div>
            <p className="text-xl font-bold leading-7">24/7</p>
            <p className="text-[11px] text-gray-300">Hỗ trợ kỹ thuật</p>
          </div>
        </div>
      </div>
    </section>
  )
}
