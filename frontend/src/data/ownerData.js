export const ownerDashboardData = {
    totalRevenue: 28450000,
    completedRentals: 42,
    pendingRequests: 3,
    averageRating: 4.9,

    revenueNote: "Doanh thu từ các đơn thuê",
    completedRentalsNote: "Tổng số đơn đã hoàn tất",
    pendingRequestsNote: "Đơn đang chờ xác nhận",
    ratingNote: "Đánh giá trung bình từ khách hàng",

    revenueChart: [
        {
            year: 2026,
            monthlyRevenue: [
                { month: 1, revenue: 1200000 },
                { month: 2, revenue: 0 },
                { month: 3, revenue: 3500000 },
                { month: 4, revenue: 0 },
                { month: 5, revenue: 0 },
                { month: 6, revenue: 0 },
                { month: 7, revenue: 0 },
                { month: 8, revenue: 0 },
                { month: 9, revenue: 0 },
                { month: 10, revenue: 0 },
                { month: 11, revenue: 0 },
                { month: 12, revenue: 0 }
            ],
        }
    ],

    pendingRentals: [
        {
            id: 'RFO-881',
            customer: 'Nguyễn Văn A',
            product: 'Sony A7IV + FE 24-70mm f/2.8 GM II',
            date: '15/06 - 18/06',
            price: 3600000,
        },
        {
            id: 'RFO-882',
            customer: 'Trần Thị B',
            product: 'DJI Mavic 3 Pro Cine Premium Combo',
            date: '20/06 - 22/06',
            price: 5000000,
        },
    ],
}

export const returnOrders = [
    {
        id: '#LR-9982',
        customer: 'Trần Thị B',
        phone: '0901 234 567',
        rating: 985,
        startDate: '15/06/2026',
        endDate: '18/06/2026',
        returnTime: '14:00',
        status: 'due',

        products: [
            '1x Máy ảnh Sony A7IV',
            '1x Ống kính Sony FE 24-70mm GM II',
        ],
    },
]

export const transactions = [
    {
        id: '#LR-9982',
        title: 'Thanh toán đơn #LR-9982',
        sub: 'Người thuê: Trần Thị B',
        date: '20/09/2026 09:30',
        type: 'Tiền thuê',
        amount: 2400000,
        status: 'Thành công',
    },

    {
        id: '#WD-10293',
        title: 'Rút tiền về ngân hàng (MBBank ****8888)',
        sub: 'Mã lệnh: #WD-10293',
        date: '18/09/2026 14:15',
        type: 'Rút tiền',
        amount: -15000000,
        status: 'Thành công',
    },
]

export const tenantReview = {
    orderId: '#LR-9950',
    customer: 'Nguyễn Văn A',
    avatar: 'NA',
    product: 'Sony A7IV + Lens 24-70mm',
    startDate: '15/06/2026',
    endDate: '18/06/2026',
    communication: 5,
    punctuality: 4,
    care: 5,
}

export const tenantRentalHistory = [];

export const ownerRentalHistory = [];

export const ownerProducts = [];

export const ownerProfile = {
    id: null,
    fullName: '',
    email: '',
    phone: '',
    address: '',
    avatarUrl: '',
};


export const createMonthlyRevenue = (year, revenueRows = []) => {
    const revenueMap = new Map(
        revenueRows.map((item) => [
            Number(item.month),
            Number(item.revenue) || 0,
        ])
    );

    return {
        year: Number(year),
        monthlyRevenue: Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            revenue: revenueMap.get(index + 1) ?? 0,
        })),
    };
};


export const emptyOwnerRevenue = (year = new Date().getFullYear()) =>
    createMonthlyRevenue(year);


export const normalizeOwnerProduct = (product) => ({
    ...product,
    id: product.id,
    name: product.name ?? '',
    brand: product.brand ?? '',
    categoryName: product.categoryName ?? product.category ?? '',
    dailyPrice: Number(product.dailyPrice ?? 0),
    depositAmount: Number(product.depositAmount ?? 0),
    availableQuantity: Number(product.availableQuantity ?? product.quantity ?? 0),
    currentlyRentedQuantity: Number(product.currentlyRentedQuantity ?? 0),
    imageUrl: product.imageUrl ?? '',
    status: product.status ?? 'ACTIVE',
});

const API_URL = import.meta.env.VITE_API_URL || ''

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
