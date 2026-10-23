export default function ConfirmDialog({
  open,
  title = 'Xác nhận thao tác',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Quay lại',
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const confirmStyle = tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300'
    : 'bg-[#ff5500] hover:bg-orange-600 focus-visible:ring-orange-300'

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel?.()}>
    <section aria-labelledby="confirm-dialog-title" aria-modal="true" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6" role="dialog">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-[#ff5500]'}`}>{tone === 'danger' ? '!' : '?'}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-900" id="confirm-dialog-title">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" disabled={busy} onClick={onCancel} type="button">{cancelLabel}</button>
        <button className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-60 ${confirmStyle}`} disabled={busy} onClick={onConfirm} type="button">{busy ? 'Đang xử lý…' : confirmLabel}</button>
      </div>
    </section>
  </div>
}