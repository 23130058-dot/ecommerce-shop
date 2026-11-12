import { API_BASE_URL, getStoredAuth } from './authApi.js'

async function request(path, { method = 'GET', body, isMultipart = false } = {}) {
  const auth = getStoredAuth()
  if (!auth?.accessToken) throw new Error('Vui lòng đăng nhập để cập nhật tài khoản.')

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/account${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        ...(body === undefined || isMultipart ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: isMultipart ? body : JSON.stringify(body) }),
    })
  } catch (error) {
    throw new Error('Không kết nối được backend. Hãy kiểm tra backend đang chạy ở cổng 8080.', { cause: error })
  }

  const result = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(result?.detail || result?.message || result?.error || `Yêu cầu thất bại (${response.status}).`)
  }
  return result
}

export const getAccountProfile = () => request('/profile')
export const updateAccountProfile = (profile) => request('/profile', { method: 'PUT', body: profile })
export const changeAccountPassword = ({ currentPassword, newPassword }) => request('/password', {
  method: 'PUT',
  body: { currentPassword, newPassword },
})

export const getNotificationPreferences = () => request('/notification-preferences')
export const updateNotificationPreferences = (preferences) => request('/notification-preferences', {
  method: 'PUT',
  body: preferences,
})

export const getAccountWallet = () => request('/wallet')
export const withdrawFromWallet = ({ amount }) => request('/wallet/withdrawals', {
  method: 'POST',
  body: { amount: Number(amount) },
})
export const topUpAccountWallet = ({ amount }) => request('/wallet/top-ups/zalopay', {
  method: 'POST',
  body: { amount },
})
export const getZaloPayWalletTopUpStatus = (appTransId) => request(`/wallet/top-ups/zalopay/${encodeURIComponent(appTransId)}`)
export const confirmZaloPayWalletTopUp = (redirect) => request('/wallet/top-ups/zalopay/redirect', {
  method: 'POST',
  body: redirect,
})
export const getAccountVerification = () => request('/verification')
export const requestPhoneVerificationCode = (phone) => request('/verification/phone-code', {
  method: 'POST',
  body: { phone },
})
export const confirmPhoneVerificationCode = ({ phone, code }) => request('/verification/phone-confirm', {
  method: 'POST',
  body: { phone, code },
})
export function uploadAccountVerificationDocument(type, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request(`/verification/documents/${encodeURIComponent(type)}`, { method: 'POST', body: formData, isMultipart: true })
}

export function uploadAccountAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request('/avatar', { method: 'POST', body: formData, isMultipart: true })
}
