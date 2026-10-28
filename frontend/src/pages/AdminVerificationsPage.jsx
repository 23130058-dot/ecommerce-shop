import { useEffect, useMemo, useState } from 'react'
import AdminDataTable from '../components/admin/AdminDataTable.jsx'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import { getAdminVerificationDocument, getAdminVerifications, reviewAdminVerification } from '../services/adminApi.js'
import { showToast } from '../services/toast.js'

const statusMeta = {
  NOT_SUBMITTED: { label: 'Chưa gửi', className: 'bg-slate-100 text-slate-600' },
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Đã xác minh', className: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Từ chối', className: 'bg-rose-50 text-rose-700' },
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.NOT_SUBMITTED
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>{meta.label}</span>
}

function EvidencePreview({ userId, type }) {
  const [source, setSource] = useState('')
  const [contentType, setContentType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let objectUrl = ''
    setLoading(true)
    setError('')
    setSource('')
    getAdminVerificationDocument(userId, type)
      .then(({ blob, contentType: responseType }) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setSource(objectUrl)
        setContentType(responseType)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [userId, type])

  if (loading) return <div className="mt-3 flex min-h-40 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">Đang tải giấy tờ…</div>
  if (error) return <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
  if (contentType === 'application/pdf') return <iframe title="Giấy tờ xác minh" src={source} className="mt-3 h-[min(65vh,620px)] w-full rounded-lg border border-slate-200 bg-slate-50" />
  return <div className="mt-3 flex max-h-[65vh] min-h-40 items-center justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2"><img alt="Giấy tờ xác minh riêng tư" src={source} className="max-h-[60vh] max-w-full object-contain" /></div>
}

function VerificationDialog({ user, onClose, onReviewed }) {
  const [previewType, setPreviewType] = useState('')
  const [note, setNote] = useState('')
  const [busyType, setBusyType] = useState('')
  const [error, setError] = useState('')
  if (!user) return null

  const documentItems = [
    { type: 'student-card', title: 'Thẻ sinh viên', status: user.studentCardStatus, note: user.studentCardReviewNote, submittedAt: user.studentCardSubmittedAt },
    { type: 'identity', title: 'Căn cước công dân', status: user.identityStatus, note: user.identityReviewNote, submittedAt: user.identitySubmittedAt },
  ]
  const submitReview = async (item, status) => {
    if (status === 'REJECTED' && !note.trim()) {
      setError('Hãy ghi lý do từ chối để người dùng biết cách gửi lại giấy tờ.')
      return
    }
    setBusyType(item.type)
    setError('')
    try {
      await reviewAdminVerification(user.userId, item.type, { status, note: note.trim() || null })
      showToast(status === 'APPROVED' ? `Đã duyệt ${item.title.toLowerCase()}.` : `Đã từ chối ${item.title.toLowerCase()}.`, 'success')
      onReviewed()
    } catch (requestError) {
      setError(requestError.message)
      showToast(requestError.message, 'error')
    } finally { setBusyType('') }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section aria-labelledby="verification-dialog-title" aria-modal="true" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">Hồ sơ xác minh</p><h2 id="verification-dialog-title" className="mt-1 truncate text-lg font-bold text-slate-900">{user.fullName || 'Người dùng'}</h2><p className="mt-1 break-all text-xs text-slate-500">{user.email} · {user.phone || 'Chưa có số điện thoại'}</p></div>
          <button aria-label="Đóng" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">×</button>
        </header>
        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          {documentItems.map((item) => <article className="rounded-xl border border-slate-200 p-4" key={item.type}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs text-slate-500">Gửi: {item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : '—'}</p></div><StatusBadge status={item.status} /></div>
            {item.note && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Ghi chú xử lý trước: {item.note}</p>}
            {item.status !== 'NOT_SUBMITTED' && <button className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setPreviewType(previewType === item.type ? '' : item.type)} type="button">{previewType === item.type ? 'Ẩn giấy tờ' : 'Xem giấy tờ riêng tư'}</button>}
            {previewType === item.type && <EvidencePreview key={`${user.userId}-${item.type}`} userId={user.userId} type={item.type} />}
            {item.status === 'PENDING' && <div className="mt-4 border-t border-slate-100 pt-4"><label className="block text-xs font-semibold text-slate-700">Ghi chú duyệt / lý do từ chối<textarea className="mt-1.5 min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-orange-400" maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú sẽ hiển thị cho người dùng nếu bị từ chối…" value={note} /></label><div className="mt-3 flex flex-wrap justify-end gap-2"><button className="rounded-lg border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50" disabled={Boolean(busyType)} onClick={() => submitReview(item, 'REJECTED')} type="button">{busyType === item.type ? 'Đang lưu…' : 'Từ chối'}</button><button className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50" disabled={Boolean(busyType)} onClick={() => submitReview(item, 'APPROVED')} type="button">{busyType === item.type ? 'Đang lưu…' : 'Duyệt giấy tờ'}</button></div></div>}
          </article>)}
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Giấy tờ định danh là dữ liệu nhạy cảm. Chỉ xem để xác minh, không tải xuống hoặc chia sẻ bên ngoài dự án.</p>
        </div>
        <footer className="flex justify-end border-t border-slate-100 px-5 py-3 sm:px-6"><button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onClose} type="button">Đóng</button></footer>
      </section>
    </div>
  )
}

export default function AdminVerificationsPage() {
  const [filter, setFilter] = useState('PENDING')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getAdminVerifications(filter)
      .then((data) => { if (active) setRows(Array.isArray(data) ? data : []) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filter, revision])

  const columns = useMemo(() => [
    { key: 'fullName', header: 'Người dùng', render: (row) => <div className="min-w-40"><p className="font-semibold text-slate-800">{row.fullName || 'Chưa cập nhật tên'}</p><p className="mt-0.5 break-all text-[11px] text-slate-500">{row.email}</p></div> },
    { key: 'phone', header: 'Điện thoại', render: (row) => row.phone || '—' },
    { key: 'studentCardStatus', header: 'Thẻ sinh viên', render: (row) => <StatusBadge status={row.studentCardStatus} /> },
    { key: 'identityStatus', header: 'Căn cước', render: (row) => <StatusBadge status={row.identityStatus} /> },
    { key: 'studentCardSubmittedAt', header: 'Ngày gửi gần nhất', render: (row) => {
      const latest = [row.studentCardSubmittedAt, row.identitySubmittedAt].filter(Boolean).sort().at(-1)
      return latest ? new Date(latest).toLocaleString('vi-VN') : '—'
    } },
    { key: 'actions', header: 'Thao tác', sortable: false, className: 'text-right', cellClassName: 'text-right', render: (row) => <button className="whitespace-nowrap rounded-lg border border-orange-200 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50" onClick={() => setSelected(row)} type="button">Mở hồ sơ</button> },
  ], [])

  const pendingCount = rows.reduce((count, row) => count + Number(row.studentCardStatus === 'PENDING') + Number(row.identityStatus === 'PENDING'), 0)
  return <AdminLayout>
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600">Quản lý danh tính</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Xác minh tài khoản</h1><p className="mt-1 text-sm text-slate-500">Xem trạng thái số điện thoại, thẻ sinh viên và căn cước do người dùng gửi.</p></div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Hồ sơ đang lọc</p><p className="mt-1 text-xl font-extrabold tabular-nums text-amber-900">{loading ? '—' : pendingCount}</p><p className="text-[11px] text-amber-800">giấy tờ chờ duyệt</p></div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"><p className="px-1 text-xs text-slate-500">Giấy tờ được lấy qua API riêng có phân quyền Admin.</p><select aria-label="Lọc trạng thái xác minh" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilter(event.target.value)} value={filter}><option value="PENDING">Chờ duyệt</option><option value="ALL">Tất cả hồ sơ</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Bị từ chối</option></select></div>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <AdminDataTable columns={columns} rows={rows} rowKey={(row) => row.userId} loading={loading} error={error} searchable searchPlaceholder="Tìm tên, email hoặc số điện thoại…" emptyMessage="Không có hồ sơ xác minh phù hợp." pageSize={10} />
    </div>
    <VerificationDialog user={selected} onClose={() => setSelected(null)} onReviewed={() => { setSelected(null); setRevision((value) => value + 1) }} />
  </AdminLayout>
}
