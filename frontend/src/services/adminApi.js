import { API_BASE_URL, getStoredAuth } from './authApi.js'

async function requestAdminApi(path, options = {}) {
  const auth = getStoredAuth()
  if (!auth?.accessToken) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản ADMIN.')

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Không kết nối được backend. Hãy kiểm tra Spring Boot đang chạy ở cổng 8080.')
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    if (response.status === 403) throw new Error('Tài khoản hiện tại không có quyền ADMIN để sử dụng chức năng này.')
    throw new Error(body?.detail || body?.message || body?.error || `Yêu cầu thất bại (${response.status}).`)
  }
  return body
}

export function getAdminDashboard() {
  return requestAdminApi('/api/admin/dashboard')
}

export function getAdminRevenueTrend({ from, to } = {}) {
  const params = new URLSearchParams({ from, to })
  return requestAdminApi(`/api/admin/dashboard/revenue?${params}`)
}

export function getAdminUsers({ search = '', role = 'all', status = 'all', page = 0, size = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (search.trim()) params.set('search', search.trim())
  if (role !== 'all') params.set('role', role)
  if (status !== 'all') params.set('status', status)
  return requestAdminApi(`/api/admin/users?${params}`)
}

export function updateAdminUserStatus(userId, status) {
  return requestAdminApi(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function updateAdminUserRole(userId, role) {
  return requestAdminApi(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

function buildPageQuery({ search = '', status = 'all', page = 0, size = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (search.trim()) params.set('search', search.trim())
  if (status !== 'all') params.set('status', status)
  return params
}

export function getAdminProducts(options = {}) {
  return requestAdminApi(`/api/admin/products?${buildPageQuery(options)}`)
}

export function updateAdminProductStatus(productId, status) {
  return requestAdminApi(`/api/admin/products/${productId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function updateAdminProduct(productId, product) {
  return requestAdminApi(`/api/admin/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

export function getAdminOrders(options = {}) {
  return requestAdminApi(`/api/admin/orders?${buildPageQuery(options)}`)
}

export function getAdminOrder(orderId) {
  return requestAdminApi(`/api/admin/orders/${orderId}`)
}

export function cancelAdminOrder(orderId) {
  return requestAdminApi(`/api/admin/orders/${orderId}/cancel`, { method: 'PATCH' })
}

export const getMarketplaceReports = (status = 'all') => requestAdminApi(`/api/admin/marketplace/reports${status === 'all' ? '' : `?status=${encodeURIComponent(status)}`}`)
export const resolveMarketplaceReport = (id, body) => requestAdminApi(`/api/admin/marketplace/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const getRentalDisputes = (status = 'all') => requestAdminApi(`/api/admin/marketplace/disputes${status === 'all' ? '' : `?status=${encodeURIComponent(status)}`}`)
export const resolveRentalDispute = (id, body) => requestAdminApi(`/api/admin/marketplace/disputes/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

export const getAdminVerifications = (status = 'all') => requestAdminApi(`/api/admin/verifications${status === 'all' ? '' : `?status=${encodeURIComponent(status)}`}`)
export const reviewAdminVerification = (userId, type, body) => requestAdminApi(`/api/admin/verifications/${userId}/${encodeURIComponent(type)}`, {
  method: 'PATCH',
  body: JSON.stringify(body),
})

export async function getAdminVerificationDocument(userId, type) {
  const auth = getStoredAuth()
  if (!auth?.accessToken) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản ADMIN.')
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/admin/verifications/${userId}/documents/${encodeURIComponent(type)}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
  } catch {
    throw new Error('Không kết nối được backend. Hãy kiểm tra Spring Boot đang chạy ở cổng 8080.')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    if (response.status === 403) throw new Error('Chỉ tài khoản ADMIN mới được xem giấy tờ xác minh.')
    throw new Error(body?.detail || body?.message || body?.error || `Không tải được giấy tờ (${response.status}).`)
  }
  return { blob: await response.blob(), contentType: response.headers.get('Content-Type') || '' }
}
