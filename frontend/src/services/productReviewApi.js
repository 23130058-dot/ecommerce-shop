import { API_BASE_URL, getStoredAuth } from './authApi.js'

async function request(productId, { method = 'GET', page = 0, size = 10, body, signal } = {}) {
  const auth = getStoredAuth()
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const endpoint = API_BASE_URL + '/api/products/' + encodeURIComponent(productId) + '/reviews'
  const url = method === 'GET' ? endpoint + '?' + params.toString() : endpoint
  let response
  try {
    response = await fetch(url, {
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
    throw new Error('Không kết nối được backend để tải đánh giá sản phẩm.')
  }

  const result = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const message = [result?.detail, result?.message, result?.error]
      .find((value) => typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'forbidden')
    if (response.status === 401) throw new Error('Vui lòng đăng nhập để gửi đánh giá.')
    throw new Error(message || `Yêu cầu thất bại (${response.status}).`)
  }
  return result
}

export const getProductReviews = (productId, options) => request(productId, options)
export const createProductReview = (productId, body) => request(productId, { method: 'POST', body })
