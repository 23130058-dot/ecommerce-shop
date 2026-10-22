import { useCallback, useEffect, useState } from 'react'

const tones = {
  success: { icon: '✓', label: 'Thành công', color: 'bg-emerald-500', ring: 'ring-emerald-100' },
  error: { icon: '!', label: 'Có lỗi xảy ra', color: 'bg-rose-500', ring: 'ring-rose-100' },
  warning: { icon: '!', label: 'Lưu ý', color: 'bg-amber-500', ring: 'ring-amber-100' },
  info: { icon: 'i', label: 'Thông báo', color: 'bg-blue-500', ring: 'ring-blue-100' },
}

function ToastItem({ toast, onDismiss }) {
  const tone = tones[toast.type] || tones.info

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 4200)
    return () => window.clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-4 ring-white/70"
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${tone.color} ${tone.ring}`} aria-hidden="true">
        {tone.icon}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-bold text-slate-900">{tone.label}</p>
        <p className="mt-0.5 break-words text-sm leading-5 text-slate-600">{toast.message}</p>
      </div>
      <button
        aria-label="Đóng thông báo"
        className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        onClick={() => onDismiss(toast.id)}
        type="button"
      >
        ×
      </button>
    </div>
  )
}

export default function ToastViewport() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const receiveToast = (event) => {
      const toast = event.detail
      if (!toast?.id || !toast.message) return
      setToasts((current) => [...current.slice(-2), toast])
    }
    window.addEventListener('lensrent-toast', receiveToast)
    return () => window.removeEventListener('lensrent-toast', receiveToast)
  }, [])

  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])

  return (
    <div aria-label="Thông báo" className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3 sm:bottom-6 sm:right-6" role="region">
      {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />)}
    </div>
  )
}
