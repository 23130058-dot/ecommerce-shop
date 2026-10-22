let toastId = 0

export function showToast(message, type = 'success') {
  if (!message || typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent('lensrent-toast', {
    detail: {
      id: ++toastId,
      message: String(message),
      type: ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info',
    },
  }))
}
