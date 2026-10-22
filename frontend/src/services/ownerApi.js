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
export const createOwnerProduct = (payload) => request('/products', { method: 'POST', body: payload })
export const getOwnerBookings = (options) => request('/bookings', options)
export const confirmOwnerBooking = (rentalId) => request(`/bookings/${encodeURIComponent(rentalId)}/confirm`, { method: 'PATCH' })
export const completeOwnerBooking = (rentalId) => request(`/bookings/${encodeURIComponent(rentalId)}/complete`, { method: 'PATCH' })
