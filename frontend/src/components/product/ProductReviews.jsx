import { useCallback, useEffect, useState } from 'react'
import { getAvatarSource } from '../../services/avatarUrl.js'
import { createProductReview, getProductReviews } from '../../services/productReviewApi.js'
import { showToast } from '../../services/toast.js'

function initials(name) {
  return String(name || 'LensRent').trim().split(/\s+/).slice(-2).map((part) => part[0] || '').join('').toUpperCase()
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export default function ProductReviews({ productId, isSignedIn, onNeedSignIn, onRatingChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [page, setPage] = useState(0)

  const load = useCallback(async (nextPage = 0, signal) => {
    setLoading(true)
    setError('')
    try {
      const result = await getProductReviews(productId, { page: nextPage, size: 5, signal })
      setData(result)
      setPage(result.page || 0)
      if (Number(result.reviewCount) > 0) onRatingChange?.(Number(result.averageRating))
    } catch (loadError) {
      if (loadError.name !== 'AbortError') setError(loadError.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [productId, onRatingChange])

  useEffect(() => {
    const controller = new AbortController()
    load(0, controller.signal)
    return () => controller.abort()
  }, [load, isSignedIn])

  const submit = async (event) => {
    event.preventDefault()
    if (!isSignedIn) {
      onNeedSignIn?.()
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createProductReview(productId, { rating, comment: comment.trim() })
      setComment('')
      setRating(5)
      showToast('Đánh giá của bạn đã được gửi.', 'success')
      await load(0)
    } catch (submitError) {
      setError(submitError.message)
      showToast(submitError.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const count = Number(data?.reviewCount || 0)
  const distribution = data?.ratingDistribution || {}

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6" id="reviews">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Đánh giá sản phẩm</h2>
          <p className="mt-1 text-sm text-gray-500">Chỉ người thuê đã hoàn tất đơn mới có thể gửi đánh giá.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900"><span className="text-amber-500">★</span> {count ? Number(data?.averageRating || 0).toFixed(1) : '—'} <span className="text-sm font-medium text-gray-500">/ 5</span></p>
          <p className="mt-1 text-xs text-gray-500">{count} đánh giá</p>
        </div>
      </div>

      {count > 0 && (
        <div className="mt-4 grid gap-1.5 sm:max-w-lg">
          {[5, 4, 3, 2, 1].map((value) => {
            const amount = Number(distribution[value] || 0)
            const percent = count ? Math.round((amount / count) * 100) : 0
            return (
              <div className="grid grid-cols-[36px_1fr_34px] items-center gap-2 text-xs text-gray-500" key={value}>
                <span>{value} ★</span>
                <span className="h-2 overflow-hidden rounded-full bg-gray-100"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} /></span>
                <span className="text-right">{amount}</span>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}

      {isSignedIn && data?.canReview && (
        <form className="mt-5 rounded-xl bg-gray-50 p-4 sm:p-5" onSubmit={submit}>
          <p className="text-sm font-semibold text-gray-800">Chia sẻ trải nghiệm thuê thiết bị</p>
          <div aria-label="Chọn số sao" className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button aria-label={`${value} sao`} aria-pressed={rating === value} className={`text-3xl leading-none transition ${value <= rating ? 'text-amber-400' : 'text-gray-300'}`} key={value} onClick={() => setRating(value)} type="button">★</button>
            ))}
            <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Nội dung đánh giá</span>
            <textarea className="min-h-24 w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="Thiết bị, tình trạng và trải nghiệm thuê của bạn thế nào?" required value={comment} />
          </label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-400">{comment.length}/2000 ký tự</span>
            <button className="rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting || !comment.trim()} type="submit">{submitting ? 'Đang gửi…' : 'Gửi đánh giá'}</button>
          </div>
        </form>
      )}

      {isSignedIn && data?.hasReviewed && <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Tài khoản của bạn đã gửi đánh giá cho thiết bị này.</p>}
      {isSignedIn && data && !data.canReview && !data.hasReviewed && <p className="mt-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Bạn có thể đánh giá sau khi hoàn tất đơn thuê thiết bị này.</p>}
      {!isSignedIn && <button className="mt-5 rounded-lg border border-orange-200 px-4 py-2.5 text-sm font-semibold text-[#ed4b0a] transition hover:bg-orange-50" onClick={onNeedSignIn} type="button">Đăng nhập để đánh giá</button>}

      <div aria-live="polite" className="mt-5 space-y-3">
        {loading ? <p className="rounded-lg border border-gray-100 p-5 text-center text-sm text-gray-500">Đang tải đánh giá…</p> : data?.reviews?.length ? data.reviews.map((review) => (
          <article className="rounded-xl border border-gray-100 p-4" key={review.id}>
            <div className="flex items-start gap-3">
              {review.avatarUrl ? <img alt="" className="size-10 rounded-full object-cover" src={getAvatarSource(review.avatarUrl)} /> : <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{initials(review.reviewerName)}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-800">{review.reviewerName}</span>
                  {review.verifiedRenter && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Đã thuê</span>}
                  {review.sample && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">Dữ liệu mẫu</span>}
                  <time className="ml-auto text-xs text-gray-400" dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                </div>
                <p aria-label={`${review.rating} trên 5 sao`} className="mt-1 text-sm tracking-wide text-amber-500">{'★'.repeat(Number(review.rating) || 0)}<span className="text-gray-200">{'★'.repeat(5 - (Number(review.rating) || 0))}</span></p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{review.comment}</p>
              </div>
            </div>
          </article>
        )) : !error ? <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">Chưa có bình luận cho thiết bị này. Hãy là người đầu tiên chia sẻ trải nghiệm.</p> : null}
      </div>

      {!loading && data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button className="rounded-lg border px-3 py-2 text-sm text-gray-700 disabled:opacity-40" disabled={page <= 0} onClick={() => load(page - 1)} type="button">‹ Trước</button>
          <span className="text-sm text-gray-500">Trang {page + 1}/{data.totalPages}</span>
          <button className="rounded-lg border px-3 py-2 text-sm text-gray-700 disabled:opacity-40" disabled={page + 1 >= data.totalPages} onClick={() => load(page + 1)} type="button">Sau ›</button>
        </div>
      )}
    </section>
  )
}
