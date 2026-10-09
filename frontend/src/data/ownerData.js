export const ownerDashboardData = {
    totalRevenue: 28450000,
    completedRentals: 42,
    pendingRequests: 3,
    averageRating: 4.9,

    revenueChart: [
        { month: 'Tháng 1', value: 4300000 },
        { month: 'Tháng 2', value: 4500000 },
        { month: 'Tháng 3', value: 4400000 },
        { month: 'Tháng 4', value: 5900000 },
        { month: 'Tháng 5', value: 5700000 },
        { month: 'Tháng 6', value: 7800000 },
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