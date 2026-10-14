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

  const body = await response.json().catch(() => null)
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
