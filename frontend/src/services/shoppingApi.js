import { API_BASE_URL, getStoredAuth } from './authApi.js'

async function request(path, { method = 'GET', body, signal } = {}) {
  const auth = getStoredAuth()
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/shopping${path}`, {
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

  if (response.status === 204) {
    if (method !== 'GET') window.dispatchEvent(new Event('lensrent-shopping-changed'))
    return null
  }
  const result = await response.json().catch(() => null)
  if (!response.ok) {
    const serverMessage = [result?.detail, result?.message]
      .find((message) => typeof message === 'string' && message.trim() && message.trim().toLowerCase() !== 'forbidden')
    const errorMessage = typeof result?.error === 'string' ? result.error.trim() : ''
    if (response.status === 403) {
      throw new Error(serverMessage || 'Bạn không thể thuê sản phẩm do chính mình đăng.')
    }
    if (response.status === 409) {
      const message = serverMessage || errorMessage
      const isGenericConflict = !message || ['conflict', '409', 'http 409'].includes(message.toLowerCase())
      if (path.includes('/return') && isGenericConflict) {
        throw new Error('Chưa thể gửi yêu cầu trả. Thiết bị cần đến ngày bắt đầu thuê và đang ở trạng thái Đang thuê.')
      }
      throw new Error(message || 'Trạng thái đơn vừa thay đổi. Hãy tải lại trang rồi thử lại.')
    }
    throw new Error(serverMessage || errorMessage || `Yêu cầu thất bại (${response.status}).`)
  }
  if (method !== 'GET') window.dispatchEvent(new Event('lensrent-shopping-changed'))
  return result
}

export const getWishlist = (options) => request('/wishlist', options)
export const addToWishlist = (productId) => request('/wishlist', { method: 'POST', body: { productId } })
export const removeFromWishlist = (productId) => request(`/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE' })
export const clearWishlist = () => request('/wishlist', { method: 'DELETE' })

export const getCompareItems = (options) => request('/compare', options)
export const addToCompare = (productId) => request('/compare', { method: 'POST', body: { productId } })
export const removeFromCompare = (productId) => request(`/compare/${encodeURIComponent(productId)}`, { method: 'DELETE' })
export const clearCompare = () => request('/compare', { method: 'DELETE' })

export const getCart = (options) => request('/cart', options)
export const addToCart = (productId, { quantity = 1, startDate, endDate } = {}) => request('/cart', {
  method: 'POST',
  body: { productId, quantity, startDate, endDate },
})
export const updateCartItem = (itemId, payload) => request(`/cart/${encodeURIComponent(itemId)}`, {
  method: 'PUT',
  body: payload,
})
export const removeCartItem = (itemId) => request(`/cart/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
export const clearCart = () => request('/cart', { method: 'DELETE' })
export const checkoutCart = (payload) => request('/cart/checkout', { method: 'POST', body: payload })
export const getRenterDashboard = (options) => request('/renter/dashboard', options)
export const getCurrentRentalItems = (options) => request('/renter/current-rentals', options)
export const getRentals = (options) => request('/rentals', options)
export const getRental = (rentalId, options) => request(`/rentals/${encodeURIComponent(rentalId)}`, options)
export const cancelRental = (rentalId) => request(`/rentals/${encodeURIComponent(rentalId)}/cancel`, { method: 'PATCH' })
export const requestRentalReturn = (rentalId) => request(`/rentals/${encodeURIComponent(rentalId)}/return`, { method: 'POST' })
export const getRentalChats = (rentalId, options) => request(`/rentals/${encodeURIComponent(rentalId)}/chats`, options)
export const getRentalChatMessages = (rentalId, ownerId, options) => request(`/rentals/${encodeURIComponent(rentalId)}/chats/${encodeURIComponent(ownerId)}/messages`, options)
export const sendRentalChatMessage = (rentalId, ownerId, body) => request(`/rentals/${encodeURIComponent(rentalId)}/chats/${encodeURIComponent(ownerId)}/messages`, {
  method: 'POST', body: { body },
})
