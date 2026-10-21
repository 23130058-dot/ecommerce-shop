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
    if (!response.ok) throw new Error(result?.detail || result?.message || result?.error || `Yêu cầu thất bại (${response.status}).`)
    return result
}

export const getOwnerProducts = (options) => request('/products', options)
export const createOwnerProduct = (payload) => request('/products', { method: 'POST', body: payload })
export const getOwnerBookings = (options) => request('/bookings', options)
export const confirmOwnerBooking = (rentalId) => request(`/bookings/${encodeURIComponent(rentalId)}/confirm`, { method: 'PATCH' })
export const completeOwnerBooking = (rentalId) => request(`/bookings/${encodeURIComponent(rentalId)}/complete`, { method: 'PATCH' })
export const getOwnerProductById = (productId, options) =>
    request(`/products/${encodeURIComponent(productId)}`, options)

export const updateOwnerProduct = (productId, payload) =>
    request(`/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        body: payload,
    })


export const getOwnerBookings = (options) =>
    request('/bookings', options)

export const confirmOwnerBooking = (rentalId) =>
    request(`/bookings/${encodeURIComponent(rentalId)}/confirm`, {
        method: 'PATCH',
    })

export const completeOwnerBooking = (rentalId) =>
    request(`/bookings/${encodeURIComponent(rentalId)}/complete`, {
        method: 'PATCH',
    })

export const getOwnerRevenue = (year, options) =>
    request(`/revenue?year=${encodeURIComponent(year)}`, options)
