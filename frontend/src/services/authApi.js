const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const AUTH_STORAGE_KEY = 'lensrent.auth'

async function sendAuthRequest(endpoint, payload) {
  let response
  try {
    response = await fetch(API_BASE_URL + '/api/auth/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Không kết nối được backend. Hãy kiểm tra backend đang chạy ở cổng 8080.')
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.detail || body?.message || body?.error || 'Yêu cầu thất bại (' + response.status + ').')
  }
  return body
}

export function registerUser(payload) {
  return sendAuthRequest('register', payload)
}

export function loginUser(payload) {
  return sendAuthRequest('login', payload)
}

export function saveAuth(auth, remember = false) {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  const expiresIn = Number(auth.expiresIn) || 43200
  const savedAuth = { ...auth, expiresAt: Date.now() + expiresIn * 1000 }
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(savedAuth))
  window.dispatchEvent(new Event('lensrent-auth-changed'))
}

export function getStoredAuth() {
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const auth = JSON.parse(raw)
    if (!auth.accessToken || !auth.expiresAt || Date.now() >= auth.expiresAt) {
      clearAuth()
      return null
    }
    return auth
  } catch {
    clearAuth()
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event('lensrent-auth-changed'))
}