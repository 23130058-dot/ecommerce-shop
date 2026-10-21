import { API_BASE_URL } from './authApi.js'

export async function getCatalogProducts({ search = '', category = '', sort = 'popular', limit = 24, signal } = {}) {
  const params = new URLSearchParams({ search, sort, limit: String(limit) })
  if (category) params.set('category', category)
  let response

  try {
    response = await fetch(API_BASE_URL + '/api/products?' + params.toString(), { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Không kết nối được backend để tải sản phẩm. Hãy kiểm tra backend đang chạy ở cổng 8080.')
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.detail || body?.message || body?.error || 'Không tải được sản phẩm (' + response.status + ').')
  }
  return Array.isArray(body) ? body : []
}

export async function getCatalogProduct(productId, { signal } = {}) {
  let response

  try {
    response = await fetch(API_BASE_URL + '/api/products/' + encodeURIComponent(productId), { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Không kết nối được backend để tải chi tiết thiết bị. Hãy kiểm tra backend đang chạy ở cổng 8080.')
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.detail || body?.message || body?.error || (response.status === 404
        ? 'Không tìm thấy thiết bị này.'
        : 'Không tải được chi tiết thiết bị (' + response.status + ').'))
  }
  return body
}