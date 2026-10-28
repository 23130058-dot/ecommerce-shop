import heroBackground from '../../assets/lensrent/hero-background.png'
import heroSearchIcon from '../../assets/lensrent/hero-search.svg'
import { categories } from '../../data/homeData.js'

const categoryDescriptions = {
  'Máy ảnh': 'Máy ảnh mirrorless, DSLR và cinema',
  'Ống kính': 'Tiêu cự phù hợp cho từng khung hình',
  'Thiết bị Studio': 'Đèn, phông và thiết bị quay dựng',
}

export default function Hero({ searchValue, onSearchChange, onSearch }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#111827] text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#111827]">
        <img className="h-full w-full object-cover object-center opacity-25" src={heroBackground} alt="" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-[#111827]/85 to-[#111827]/55" />
      </div>
      <div className="mx-auto grid min-h-[460px] max-w-[1280px] items-center gap-10 px-5 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
        <div className="max-w-[620px]">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-300">
            <span className="size-1.5 rounded-full bg-[#ff5500]" /> Dịch vụ thuê thiết bị uy tín
          </p>
          <h1 className="max-w-[600px] text-[34px] font-extrabold leading-[1.12] tracking-tight sm:text-5xl">
            Thiết bị tốt cho <span className="text-[#ff6a1a]">ý tưởng</span> của bạn
          </h1>
          <p className="mt-4 max-w-[540px] text-sm leading-6 text-gray-300 sm:text-base sm:leading-7">
            Thuê máy ảnh, ống kính và thiết bị quay dựng theo nhu cầu. Chọn thiết bị, chọn ngày thuê rồi bắt đầu dự án của bạn.
          </p>
          <form
            className="mt-6 flex w-full max-w-[560px] flex-col gap-2 rounded-xl bg-white p-1.5 shadow-xl shadow-black/20 sm:flex-row"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch()
            }}
          >
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 text-gray-400">
              <img src={heroSearchIcon} alt="" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                type="search"
                placeholder="Bạn đang cần thiết bị nào?"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                aria-label="Tìm tên máy ảnh, máy quay hoặc ống kính"
              />
            </label>
            <button className="h-11 shrink-0 rounded-lg bg-[#ff5500] px-6 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300" type="submit">
              Tìm thiết bị
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-300 sm:text-sm">
            <span className="inline-flex items-center gap-2"><span className="text-emerald-400">✓</span> Thuê linh hoạt theo ngày</span>
            <span className="inline-flex items-center gap-2"><span className="text-emerald-400">✓</span> Chi phí minh bạch</span>
            <span className="inline-flex items-center gap-2"><span className="text-emerald-400">✓</span> Hỗ trợ trong quá trình thuê</span>
          </div>
        </div>

        <aside className="w-full max-w-[500px] justify-self-center rounded-2xl border border-white/15 bg-slate-950/45 p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-5 lg:justify-self-end">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-300">Khám phá thiết bị</p>
              <h2 className="mt-1 text-lg font-bold text-white">Bạn cần thuê gì?</h2>
            </div>
            <a className="pb-0.5 text-xs font-semibold text-gray-300 transition hover:text-white" href="/categories">Xem tất cả →</a>
          </div>
          <div className="grid gap-2.5">
            {categories.filter((category) => categoryDescriptions[category.name]).map((category) => (
              <a
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3 transition hover:border-orange-300/50 hover:bg-white/10"
                href={`/categories/${category.slug}`}
                key={category.name}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <img className="size-6 brightness-0 invert" src={category.icon} alt="" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{category.name}</span>
                  <span className="mt-0.5 block text-xs text-gray-400">{categoryDescriptions[category.name]}</span>
                </span>
                <span className="text-lg text-gray-500 transition group-hover:translate-x-0.5 group-hover:text-orange-300" aria-hidden="true">›</span>
              </a>
            ))}
          </div>
          <p className="mt-4 border-t border-white/10 pt-3 text-xs text-gray-400">Quy trình đơn giản: chọn thiết bị, chọn lịch thuê và gửi yêu cầu.</p>
        </aside>
      </div>
    </section>
  )
}
