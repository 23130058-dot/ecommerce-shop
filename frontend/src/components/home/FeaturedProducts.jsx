import { sortOptions } from '../../data/homeData.js'
import ProductCard from './ProductCard.jsx'

export default function FeaturedProducts({
  products,
  activeFilter,
  onSelectFilter,
  searchValue,
  isLoading,
  loadError,
  onRetry,
}) {
  return (
    <section className="bg-[#f3f4f6] py-14 sm:py-16" id="products">
      <div className="mx-auto max-w-[1152px] px-4">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.6px] text-[#ff5500]">Sản phẩm tiêu biểu</p>
            <h2 className="text-2xl font-extrabold leading-9 text-[#111827] sm:text-[30px]">Thiết bị đang được quan tâm</h2>
          </div>
          <div className="flex items-center gap-1 rounded-lg text-sm" aria-label="Sắp xếp sản phẩm">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                className={'rounded-lg px-3 py-2 transition ' + (activeFilter === option.key ? 'bg-white font-semibold text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
                type="button"
                onClick={() => onSelectFilter(option.key)}
                aria-pressed={activeFilter === option.key}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-white px-6 py-10 text-center text-sm text-red-700" role="alert">
            <p>{loadError}</p>
            <button className="mt-4 rounded-lg bg-[#ff5500] px-5 py-2 font-semibold text-white" onClick={onRetry} type="button">
              Thử tải lại
            </button>
          </div>
        ) : isLoading && products.length === 0 ? (
          <div className="rounded-xl bg-white px-6 py-12 text-center text-sm text-gray-500" role="status">
            Đang tải sản phẩm...
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
            Không tìm thấy thiết bị phù hợp với “{searchValue}”. Thử tìm “camera” hoặc “lens” nhé.
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <a className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#ff5500] hover:text-[#ff5500]" href="/categories">
            Khám phá kho thiết bị
          </a>
        </div>
      </div>
    </section>
  )
}