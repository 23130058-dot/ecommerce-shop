import ratingStarIcon from '../../assets/lensrent/rating-star.svg'
import { resolveProductImage } from './productImageMap.js'

export default function ProductCard({ product }) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative flex h-[208px] items-center justify-center overflow-hidden bg-[#ebecee] p-4">
        <img className="max-h-full max-w-full object-contain" src={resolveProductImage(product.imageKey)} alt={product.name} />
        <span className={'absolute left-3 top-3 rounded-full px-2 py-1 text-xs font-medium ' + (product.status === 'Đã thuê' ? 'bg-white/90 text-gray-500' : 'bg-white/90 text-gray-600')}>
          {product.status}
        </span>
      </div>
      <div className="min-h-[100px] px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium tracking-wide text-gray-400">{product.type}</p>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-600">
            <img src={ratingStarIcon} alt="" />{Number(product.rating).toFixed(1)}
          </span>
        </div>
        <h3 className="mt-2 truncate text-base font-bold text-gray-900">{product.name}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <span className="rounded bg-gray-100 px-2 py-1 text-xs leading-tight text-gray-500" key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex min-h-[50px] items-center justify-between gap-2 border-t border-gray-100 px-4 py-2">
        <p className="text-sm font-bold text-[#ff5500]">
          {Number(product.price).toLocaleString('vi-VN')}đ <span className="font-normal text-gray-400">/ ngày</span>
        </p>
        <a className="shrink-0 text-xs font-bold text-[#ff5500] hover:text-orange-700" href="#rental-inquiry">CHI TIẾT</a>
      </div>
    </article>
  )
}