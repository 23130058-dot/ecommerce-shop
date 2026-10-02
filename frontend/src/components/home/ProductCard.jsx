import ratingStarIcon from '../../assets/lensrent/rating-star.svg'

export default function ProductCard({ product }) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative flex h-[208px] items-center justify-center overflow-hidden bg-[#ebecee] p-4">
        <img className="max-h-full max-w-full object-contain" src={product.image} alt={product.name} />
        <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium ${product.status === 'Đã thuê' ? 'bg-white/90 text-gray-500' : 'bg-white/90 text-gray-600'}`}>
          {product.status}
        </span>
      </div>
      <div className="min-h-[100px] px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-medium tracking-wide text-gray-400">{product.type}</p>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-gray-600">
            <img src={ratingStarIcon} alt="" />{product.rating}
          </span>
        </div>
        <h3 className="mt-2 truncate text-sm font-bold text-gray-900">{product.name}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <span className="rounded bg-gray-100 px-2 py-1 text-[10px] leading-none text-gray-500" key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex h-[50px] items-center justify-between border-t border-gray-100 px-4">
        <p className="text-xs font-bold text-[#ff5500]">
          {product.price.toLocaleString('vi-VN')}đ <span className="font-normal text-gray-400">/ ngày</span>
        </p>
        <a className="text-[10px] font-bold text-[#ff5500] hover:text-orange-700" href="#rental-inquiry">CHI TIẾT</a>
      </div>
    </article>
  )
}
