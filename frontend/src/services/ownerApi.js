import { API_BASE_URL, getStoredAuth } from './authApi.js'

async function request(path, { method = 'GET', body, signal } = {}) {
    const auth = getStoredAuth()
    let response

    try {
        response = await fetch(`${API_BASE_URL}/api/owner${path}`, {
            method,
            signal,
            headers: {
                ...(auth?.accessToken
                    ? { Authorization: `Bearer ${auth.accessToken}` }
                    : {}),
                ...(body === undefined
                    ? {}
                    : { 'Content-Type': 'application/json' }),
            },
            ...(body === undefined
                ? {}
                : { body: JSON.stringify(body) }),
        })
    } catch (error) {
        if (error.name === 'AbortError') throw error

        throw new Error(
            'Không kết nối được backend. Hãy kiểm tra backend đang chạy ở cổng 8080.',
            { cause: error }
        )
    }

    if (response.status === 204) return null

    const result = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            result?.error ||
            `Yêu cầu thất bại (${response.status}).`
        )
    }

    return result
}

// Quản lý thiết bị
export const getOwnerProducts = (options) =>
    request('/products', options)

export const getOwnerProductById = (productId, options) =>
    request(`/products/${encodeURIComponent(productId)}`, options)

export const createOwnerProduct = (payload) =>
    request('/products', {
        method: 'POST',
        body: payload,
    })

export const updateOwnerProduct = (productId, payload) =>
    request(`/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        body: payload,
    })

// Lịch sử cho thuê
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

// Doanh thu theo tháng
export const getOwnerRevenue = (year, options) =>
    request(`/revenue?year=${encodeURIComponent(year)}`, options)

// Hồ sơ cá nhân
export const getOwnerProfile = (options) =>
    request('/profile', options)


export const updateOwnerProfile = (payload) =>
    request('/profile', {
        method: 'PUT',
        body: payload,
    })

const API_URL = import.meta.env.VITE_API_URL || ''

// Lấy thiết lập lịch của một thiết bị
export async function getOwnerScheduleSettings(productId, options = {}) {
    const response = await fetch(
        `${API_URL}/api/owner/products/${productId}/schedule`,
        options
    )

    if (!response.ok) {
        throw new Error('Không thể tải thiết lập lịch.')
    }

    return response.json()
}

export const getOwnerScheduleOverview = (month) => {
    return request(
        `/schedule-overview?month=${encodeURIComponent(month)}`
    );
};
export async function saveOwnerScheduleSettings(productId, data) {
    const response = await fetch(
        `${API_URL}/api/owner/products/${productId}/schedule`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }
    )

    if (!response.ok) {
        throw new Error('Không thể lưu thiết lập lịch.')
    }

    return response.json()
}