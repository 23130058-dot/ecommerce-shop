
import { API_BASE_URL, getStoredAuth } from './authApi.js'

// ==========================================
// HÀM REQUEST DÙNG CHUNG
// ==========================================

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
        const serverMessage =
            result?.detail || result?.message || result?.error

        if (response.status === 403) {
            throw new Error(
                'Tài khoản hiện tại chưa được phép sử dụng workspace Owner. Hãy đăng nhập lại sau khi cập nhật ứng dụng hoặc liên hệ quản trị viên.'
            )
        }

        if (response.status === 401) {
            throw new Error(
                serverMessage ||
                'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            )
        }

        throw new Error(
            serverMessage || `Yêu cầu thất bại (${response.status}).`
        )
    }

    return result
}

// ==========================================
// QUẢN LÝ THIẾT BỊ
// ==========================================

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

export const deleteOwnerProduct = (productId) =>
    request(`/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
    })

// ==========================================
// DASHBOARD
// ==========================================

export const getOwnerDashboard = (options) =>
    request('/dashboard', options)

// ==========================================
// LỊCH SỬ CHO THUÊ / ĐƠN ĐẶT
// ==========================================

export const getOwnerBookings = (options) =>
    request('/bookings', options)

export const confirmOwnerBooking = (rentalId) =>
    request(`/bookings/${encodeURIComponent(rentalId)}/confirm`, {
        method: 'PATCH',
    })

export const handoverOwnerBooking = (rentalId) =>
    request(`/bookings/${encodeURIComponent(rentalId)}/handover`, {
        method: 'PATCH',
    })

export const completeOwnerBooking = (rentalId) =>
    request(`/bookings/${encodeURIComponent(rentalId)}/complete`, {
        method: 'PATCH',
    })

export const cancelOwnerBooking = (rentalId) =>
    request(`/bookings/${encodeURIComponent(rentalId)}/cancel`, {
        method: 'PATCH',
    })

// ==========================================
// LỊCH THIẾT BỊ
// ==========================================

// Lấy danh sách lịch
export const getOwnerSchedules = (options) =>
    request('/schedule', options)

// Lưu lịch của thiết bị
export const saveOwnerSchedule = (productId, body) =>
    request(`/schedule/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        body,
    })

// Lấy thiết lập lịch của một thiết bị
export const getOwnerScheduleSettings = (productId, options) =>
    request(
        `/products/${encodeURIComponent(productId)}/schedule`,
        options
    )

// Lưu thiết lập lịch của một thiết bị
export const saveOwnerScheduleSettings = (productId, data) =>
    request(`/products/${encodeURIComponent(productId)}/schedule`, {
        method: 'PUT',
        body: data,
    })

// Lấy dữ liệu tổng quan lịch theo tháng
// Backend: GET /api/owner/schedule-overview?month=YYYY-MM
export const getOwnerScheduleOverview = (month, options) =>
    request(
        `/schedule-overview?month=${encodeURIComponent(month)}`,
        options
    )

// ==========================================
// QUẢN LÝ TRẢ THIẾT BỊ
// ==========================================

export const getOwnerReturns = (options) =>
    request('/returns', options)

export const confirmOwnerReturn = (rentalItemId) =>
    request(`/returns/${encodeURIComponent(rentalItemId)}/confirm`, {
        method: 'PATCH',
    })

export const reportOwnerDamage = (rentalItemId, body) =>
    request(`/returns/${encodeURIComponent(rentalItemId)}/damage`, {
        method: 'POST',
        body,
    })

// ==========================================
// DOANH THU
// ==========================================

// Lấy doanh thu theo khoảng thời gian
export const getOwnerRevenue = ({ from, to, signal } = {}) => {
    const query = new URLSearchParams()

    if (from) query.set('from', from)
    if (to) query.set('to', to)

    return request(`/revenue?${query.toString()}`, { signal })
}

// ==========================================
// VÍ VÀ GIAO DỊCH
// ==========================================

export const getOwnerWallet = (options) =>
    request('/wallet', options)

export const getOwnerTransactions = (options) =>
    request('/transactions', options)

export const requestOwnerWithdrawal = (amount) =>
    request('/withdrawals', {
        method: 'POST',
        body: {
            amount: Number(amount),
        },
    })

// ==========================================
// ĐÁNH GIÁ
// ==========================================

export const getOwnerReviews = (options) =>
    request('/reviews', options)

export const submitOwnerReview = (body) =>
    request('/reviews', {
        method: 'POST',
        body,
    })

// ==========================================
// CHAT
// ==========================================

export const getOwnerChats = (options) =>
    request('/chats', options)

export const getOwnerChatMessages = (rentalId, options) =>
    request(
        `/chats/${encodeURIComponent(rentalId)}/messages`,
        options
    )

export const sendOwnerChatMessage = (rentalId, body) =>
    request(
        `/chats/${encodeURIComponent(rentalId)}/messages`,
        {
            method: 'POST',
            body,
        }
    )

// ==========================================
// THÔNG BÁO
// ==========================================

export const getOwnerNotifications = (options) =>
    request('/notifications', options)

export const markOwnerNotificationsRead = () =>
    request('/notifications/read-all', {
        method: 'PATCH',
    })

// ==========================================
// HỒ SƠ CÁ NHÂN
// ==========================================

export const getOwnerProfile = (options) =>
    request('/profile', options)

export const updateOwnerProfile = (payload) =>
    request('/profile', {
        method: 'PUT',
        body: payload,
    })

// ==========================================
// GIAN HÀNG OWNER
// ==========================================

export async function getOwnerStorefront(options = {}) {
    return request('/storefront', {
        signal: options.signal,
    })
}

export async function saveOwnerStorefront(body) {
    return request('/storefront', {
        method: 'PUT',
        body,
    })
}

// Upload ảnh sử dụng FormData nên không đặt Content-Type: application/json
export async function uploadOwnerStorefrontImage(file, kind) {
    const auth = getStoredAuth()
    const formData = new FormData()

    formData.append('file', file)
    formData.append('kind', kind)

    let response

    try {
        response = await fetch(
            `${API_BASE_URL}/api/owner/storefront/images`,
            {
                method: 'POST',
                headers: {
                    ...(auth?.accessToken
                        ? { Authorization: `Bearer ${auth.accessToken}` }
                        : {}),
                },
                body: formData,
            }
        )
    } catch (error) {
        if (error.name === 'AbortError') throw error

        throw new Error(
            'Không kết nối được backend để tải ảnh gian hàng.',
            { cause: error }
        )
    }

    const result = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            `Không tải được ảnh gian hàng (${response.status}).`
        )
    }

    return result
}
