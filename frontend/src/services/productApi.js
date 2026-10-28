import { API_BASE_URL, getStoredAuth } from './authApi.js'

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

export async function getProductAvailability(productId, { from, to, signal } = {}) {
  const params = new URLSearchParams({ from, to })
  const response = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(productId)}/availability?${params}`, { signal })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || body?.message || `Không kiểm tra được lịch thuê (${response.status}).`)
  return body
}

export async function getStores({ search = '', sort = 'popular', signal } = {}) {
  const params = new URLSearchParams({ search, sort })
  const response = await fetch(`${API_BASE_URL}/api/stores?${params}`, { signal })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || body?.message || `Không tải được gian hàng (${response.status}).`)
  return Array.isArray(body) ? body : []
}

export async function getStore(ownerId, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/api/stores/${encodeURIComponent(ownerId)}`, { signal })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || body?.message || `Không tải được gian hàng (${response.status}).`)
  return body
}

export async function createMarketplaceReport(payload) {
  const auth = getStoredAuth()
  if (!auth?.accessToken) throw new Error('Đăng nhập để gửi báo cáo.')
  const response = await fetch(`${API_BASE_URL}/api/stores/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || body?.message || `Không gửi được báo cáo (${response.status}).`)
  return body
}
