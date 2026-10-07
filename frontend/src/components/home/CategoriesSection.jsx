import { categories } from '../../data/homeData.js'
import categoryArrowIcon from '../../assets/lensrent/category-arrow.svg'

export default function CategoriesSection() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12" id="categories">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.275px] text-[#ff5500]">Danh mục thiết bị</p>
          <h2 className="text-xl font-bold leading-7 text-[#111827]">Lựa chọn theo nhu cầu</h2>
        </div>
        <a className="hidden items-center gap-1.5 pb-1 text-xs font-medium text-gray-600 hover:text-[#ff5500] sm:flex" href="/categories">
          Xem tất cả danh mục
          <img src={categoryArrowIcon} alt="" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {categories.map((category) => (
          <a
            href={`/categories/${category.slug}`}
            key={category.name}
            className="flex min-h-[129px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center no-underline transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm"
          >
            <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-gray-100">
              <img src={category.icon} alt="" />
            </span>
            <span className="text-sm font-semibold text-gray-900">{category.name}</span>
            <span className="mt-1 text-[11px] text-gray-400">{category.count}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
