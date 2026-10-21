import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ratingStarIcon from '../../assets/lensrent/rating-star.svg'
import { getStoredAuth } from '../../services/authApi.js'
import { addToCompare, addToWishlist } from '../../services/shoppingApi.js'
import { resolveProductImage } from './productImageMap.js'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [busyAction, setBusyAction] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const saveProduct = async (action) => {
    if (!getStoredAuth()) {
      navigate('/login', { state: { from: location } })
      return
    }
    setBusyAction(action)
    setActionMessage('')
    try {
      if (action === 'wishlist') {
        await addToWishlist(product.id)
        setActionMessage('Đã lưu vào Wishlist.')
      } else {
        await addToCompare(product.id)
        setActionMessage('Đã thêm vào danh sách so sánh.')
      }
    } catch (error) {
      setActionMessage(error.message)
    } finally {
      setBusyAction('')
    }
  }

  return (
      <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
        <Link className="block" to={'/products/' + product.id} aria-label={'Xem chi tiết ' + product.name}>
          <div className="relative flex h-[208px] items-center justify-center overflow-hidden bg-[#ebecee] p-4">
            <img className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.03]" src={resolveProductImage(product.imageKey)} alt={product.name} />
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
              {(product.tags || []).map((tag) => (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs leading-tight text-gray-500" key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </Link>
        <div className="border-t border-gray-100 px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#ff5500]">
              {Number(product.price).toLocaleString('vi-VN')}đ <span className="font-normal text-gray-400">/ ngày</span>
            </p>
            <Link className="shrink-0 text-xs font-bold text-[#ff5500] hover:text-orange-700" to={'/products/' + product.id}>CHI TIẾT</Link>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-orange-300 hover:text-[#ed4b0a] disabled:opacity-50" disabled={Boolean(busyAction)} onClick={() => saveProduct('wishlist')} type="button">♡ Lưu</button>
            <button className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-orange-300 hover:text-[#ed4b0a] disabled:opacity-50" disabled={Boolean(busyAction)} onClick={() => saveProduct('compare')} type="button">⇄ So sánh</button>
          </div>
          {actionMessage && <p aria-live="polite" className="mt-1.5 text-xs leading-4 text-gray-500">{actionMessage}</p>}
        </div>
      </article>
  )
}