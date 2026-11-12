import { useCallback, useEffect, useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import { deleteAdminReview, getAdminReviews, updateAdminReviewSentiment, updateAdminReviewVisibility } from '../services/adminApi.js'

const labels = { POSITIVE: 'Tích cực', NEUTRAL: 'Trung tính', NEGATIVE: 'Tiêu cực' }
const badgeTone = { POSITIVE: 'bg-emerald-50 text-emerald-700', NEUTRAL: 'bg-amber-50 text-amber-700', NEGATIVE: 'bg-rose-50 text-rose-700' }

export default function AdminReviewsPage() {
  const [data, setData] = useState({ items: [], page: 0, totalPages: 0, totalElements: 0 })
  const [filters, setFilters] = useState({ search: '', sentiment: 'all', status: 'all' })
  const [applied, setApplied] = useState(filters)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async (page = 0) => {
    try {
      const result = await getAdminReviews({ ...applied, page, size: 20 })
      setData(result)
      setError('')
    } catch (loadError) { setError(loadError.message) }
  }, [applied])

  useEffect(() => { load(0) }, [load])

  const act = async (review, action, value) => {
    setBusyId(review.id)
    try {
      if (action === 'sentiment') await updateAdminReviewSentiment(review.id, value)
      if (action === 'visibility') await updateAdminReviewVisibility(review.id, value)
      if (action === 'delete') {
        if (!window.confirm('Xóa vĩnh viễn bình luận này? Điểm đánh giá sản phẩm sẽ được tính lại.')) return
        await deleteAdminReview(review.id)
      }
      await load(data.page)
    } catch (actionError) { setError(actionError.message) }
    finally { setBusyId(null) }
  }

  const applyFilters = (event) => { event.preventDefault(); setApplied({ ...filters }) }

  return <AdminLayout>
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Kiểm duyệt & phân tích</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Bình luận và cảm xúc</h1><p className="mt-1 text-sm text-slate-500">Xem dự đoán sentiment, chỉnh nhãn, ẩn hoặc xóa bình luận. Nhãn do admin chỉnh sẽ được giữ riêng với dự đoán mô hình.</p></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <form onSubmit={applyFilters} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
        <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tìm comment, sản phẩm, người dùng…" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
        <select value={filters.sentiment} onChange={(event) => setFilters({ ...filters, sentiment: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="all">Mọi cảm xúc</option><option value="POSITIVE">Tích cực</option><option value="NEUTRAL">Trung tính</option><option value="NEGATIVE">Tiêu cực</option></select>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="all">Mọi trạng thái</option><option value="VISIBLE">Đang hiển thị</option><option value="HIDDEN">Đã ẩn</option></select>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Lọc</button>
      </form>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-bold text-slate-800">{data.totalElements} bình luận</h2><span className="text-xs text-slate-500">Trang {data.totalPages ? data.page + 1 : 0}/{data.totalPages}</span></div>
        <div className="divide-y divide-slate-100">
          {data.items.map((review) => <article key={review.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-900">{review.productName} <span className="font-normal text-slate-400">· #{review.productId}</span></p><p className="mt-1 text-xs text-slate-500">{review.reviewerName} · {review.reviewerEmail} · {'★'.repeat(review.rating)} · {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : ''}{review.sample && ' · mẫu'}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeTone[review.sentiment] || 'bg-slate-100 text-slate-600'}`}>{labels[review.sentiment] || 'Chưa phân tích'}</span><span className="text-[11px] text-slate-500">{review.sentimentSource === 'ADMIN' ? 'Nhãn admin' : `Mô hình ${review.sentimentConfidence == null ? '—' : `${Math.round(review.sentimentConfidence * 100)}%`}`}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${review.moderationStatus === 'HIDDEN' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{review.moderationStatus === 'HIDDEN' ? 'Đã ẩn' : 'Hiển thị'}</span></div></div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{review.comment}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2"><label className="text-xs font-semibold text-slate-500">Chỉnh sentiment<select disabled={busyId === review.id} value={review.sentiment || ''} onChange={(event) => act(review, 'sentiment', event.target.value)} className="ml-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="" disabled>Chọn nhãn</option><option value="POSITIVE">Tích cực</option><option value="NEUTRAL">Trung tính</option><option value="NEGATIVE">Tiêu cực</option></select></label><button disabled={busyId === review.id} onClick={() => act(review, 'visibility', review.moderationStatus === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN')} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50">{review.moderationStatus === 'HIDDEN' ? 'Hiện lại' : 'Ẩn comment'}</button><button disabled={busyId === review.id} onClick={() => act(review, 'delete')} className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">Xóa</button></div>
          </article>)}
          {!data.items.length && <p className="p-10 text-center text-sm text-slate-500">Không tìm thấy bình luận phù hợp.</p>}
        </div>
        {data.totalPages > 1 && <div className="flex justify-center gap-2 border-t border-slate-100 p-3"><button disabled={data.page <= 0} onClick={() => load(data.page - 1)} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-40">Trước</button><button disabled={data.page + 1 >= data.totalPages} onClick={() => load(data.page + 1)} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-40">Sau</button></div>}
      </section>
      <p className="mt-3 text-xs leading-5 text-slate-500">Mô hình baseline dùng corpus UIT-ViSFD lọc theo review có nhãn khía cạnh camera/phụ kiện. Mỗi lần admin chỉnh nhãn, mô hình được huấn luyện lại từ corpus gốc cộng các nhãn đã được admin xác nhận.</p>
    </main>
  </AdminLayout>
}
