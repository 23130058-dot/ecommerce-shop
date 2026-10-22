import { API_BASE_URL, getStoredAuth } from './authApi.js'

async function request(path, { method = 'GET', body, signal } = {}) {
  const auth = getStoredAuth()
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/owner${path}`, {
      method,
      signal,
      headers: {
        ...(auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Không kết nối được backend. Hãy kiểm tra backend đang chạy ở cổng 8080.', { cause: error })
  }
  if (response.status === 204) return null
  const result = await response.json().catch(() => null)
  if (!response.ok) {
    const serverMessage = result?.detail || result?.message || result?.error
    if (response.status === 403) {
      const role = auth?.user?.role?.toUpperCase()
      const message = role === 'OWNER'
        ? 'Phiên đăng nhập chưa nhận quyền Chủ thiết bị. Nếu vai trò Owner vừa được cấp, hãy đăng xuất rồi đăng nhập lại để làm mới quyền.'
        : 'Tài khoản hiện tại chưa có quyền Chủ thiết bị. Hãy đăng nhập bằng tài khoản Owner hoặc nhờ quản trị viên cấp quyền rồi đăng nhập lại.'
      throw new Error(message)
    }
    if (response.status === 401) throw new Error(serverMessage || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    throw new Error(serverMessage || `Yêu cầu thất bại (${response.status}).`)
  }
  return result
}

export const getOwnerProducts = (options) => request('/products', options)
export const getOwnerDashboard = (options) => request('/dashboard', options)
export const createOwnerProduct = (payload) => request('/products', { method: 'POST', body: payload })
export const updateOwnerProduct = (productId, payload) => request(`/products/${encodeURIComponent(productId)}`, { method: 'PUT', body: payload })
export const getOwnerRevenue = ({ from, to, signal } = {}) => {
  const query = new URLSearchParams({ from, to })
  return request(`/revenue?${query.toString()}`, { signal })
}
export const getOwnerBookings = (options) => request('/bookings', options)
export const confirmOwnerBooking = (rentalId) => request(`/bookings/${encodeURIComponent(rentalId)}/confirm`, { method: 'PATCH' })
export const completeOwnerBooking = (rentalId) => request(`/bookings/${encodeURIComponent(rentalId)}/complete`, { method: 'PATCH' })
export const cancelOwnerBooking = (rentalId) => request(`/bookings/${encodeURIComponent(rentalId)}/cancel`, { method: 'PATCH' })
export const getOwnerSchedules = (options) => request('/schedule', options)
export const saveOwnerSchedule = (productId, body) => request(`/schedule/${encodeURIComponent(productId)}`, { method: 'PUT', body })
export const getOwnerReturns = (options) => request('/returns', options)
export const confirmOwnerReturn = (rentalItemId) => request(`/returns/${encodeURIComponent(rentalItemId)}/confirm`, { method: 'PATCH' })
export const reportOwnerDamage = (rentalItemId, body) => request(`/returns/${encodeURIComponent(rentalItemId)}/damage`, { method: 'POST', body })
export const getOwnerWallet = (options) => request('/wallet', options)
export const getOwnerTransactions = (options) => request('/transactions', options)
export const requestOwnerWithdrawal = (amount) => request('/withdrawals', { method: 'POST', body: { amount: Number(amount) } })
export const getOwnerReviews = (options) => request('/reviews', options)
export const submitOwnerReview = (body) => request('/reviews', { method: 'POST', body })
export const getOwnerChats = (options) => request('/chats', options)
export const getOwnerChatMessages = (rentalId, options) => request(`/chats/${encodeURIComponent(rentalId)}/messages`, options)
export const sendOwnerChatMessage = (rentalId, body) => request(`/chats/${encodeURIComponent(rentalId)}/messages`, { method: 'POST', body })
export const getOwnerNotifications = (options) => request('/notifications', options)
export const markOwnerNotificationsRead = () => request('/notifications/read-all', { method: 'PATCH' })
