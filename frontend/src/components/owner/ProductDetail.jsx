import { Link, useParams } from 'react-router-dom'
import { products } from '../../data/products'

export default function ProductDetail() {
    const { id } = useParams()

    const productIndex = Number(id) - 1
    const product = products[productIndex]

    if (!product) {
        return (
            <div className="min-h-screen bg-[#f7f7f8] p-8">
                <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-10 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Không tìm thấy sản phẩm
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Sản phẩm bạn đang tìm kiếm không tồn tại.
                    </p>

                    <Link
                        to="/owner/equipment"
                        className="mt-6 inline-block rounded-lg bg-[#F45116] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d9440d]"
                    >
                        Quay lại quản lý thiết bị
                    </Link>
                </div>
            </div>
        )
    }

    const getCategoryName = (category) => {
        if (category.includes('camera')) return 'Máy ảnh'
        if (category.includes('lens')) return 'Ống kính'
        if (category.includes('accessory')) return 'Phụ kiện'
        if (category.includes('drone')) return 'Thiết bị Studio'
        return 'Khác'
    }

    const categoryName = getCategoryName(product.category)

    return (
        <div className="min-h-screen bg-[#f7f7f8]">
            {/* Main content - Header/Footer đã có ở layout chung */}

            <main className="mx-auto max-w-7xl px-6 py-8">

                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Link
                        to="/owner/equipment"
                        className="hover:text-[#F45116]"
                    >
                        Quản lý thiết bị
                    </Link>

                    <span>/</span>

                    <span className="text-gray-800">
            Chi tiết sản phẩm
          </span>
                </div>

                {/* Header */}
                <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Chi tiết sản phẩm
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Xem thông tin thiết bị và thông tin chủ sở hữu.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            to="/owner/equipment"
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            ← Quay lại
                        </Link>

                        <Link
                            to={`/owner/equipment/${id}/edit`}
                            className="rounded-lg bg-[#F45116] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d9440d]"
                        >
                            Chỉnh sửa
                        </Link>
                    </div>
                </div>

                {/* Product information */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Image */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <div className="flex h-[360px] items-center justify-center rounded-lg bg-gray-50">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="max-h-[320px] max-w-full object-contain"
                            />
                        </div>

                        {/* Status */}
                        <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Trạng thái
              </span>

                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    product.status === 'Sẵn sàng'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                }`}
                            >
                {product.status}
              </span>
                        </div>
                    </div>

                    {/* Basic information */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
                        <div className="border-b border-gray-100 pb-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#F45116]">
                                {product.type}
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-gray-900">
                                {product.name}
                            </h2>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  {categoryName}
                </span>

                                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <span className="text-yellow-500">★</span>
                  <strong className="text-gray-800">
                    {product.rating}
                  </strong>
                  / 5
                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="border-b border-gray-100 py-6">
                            <p className="text-sm text-gray-500">
                                Giá thuê / ngày
                            </p>

                            <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl font-bold text-[#F45116]">
                  {product.price.toLocaleString('vi-VN')}đ
                </span>

                                <span className="mb-1 text-sm text-gray-500">
                  / ngày
                </span>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="border-b border-gray-100 py-6">
                            <p className="mb-3 text-sm font-semibold text-gray-800">
                                Đặc điểm nổi bật
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {product.tags?.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                                    >
                    {tag}
                  </span>
                                ))}
                            </div>
                        </div>

                        {/* Product ID */}
                        <div className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-gray-400">
                                    Mã thiết bị
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    LR-{String(id).padStart(4, '0')}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400">
                                    Danh mục
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {categoryName}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Owner information */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-5 border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Thông tin chủ sở hữu
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Thông tin người đang quản lý thiết bị này.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0eb] text-xl font-bold text-[#F45116]">
                                O
                            </div>

                            <div>
                                <p className="text-xs text-gray-400">
                                    Chủ sở hữu
                                </p>

                                <p className="mt-1 font-semibold text-gray-800">
                                    Owner LensRent
                                </p>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <p className="text-xs text-gray-400">
                                Email
                            </p>

                            <p className="mt-1 font-medium text-gray-800">
                                owner@lensrent.vn
                            </p>
                        </div>

                        {/* Phone */}
                        <div>
                            <p className="text-xs text-gray-400">
                                Số điện thoại
                            </p>

                            <p className="mt-1 font-medium text-gray-800">
                                0901 234 567
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rental actions */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h3 className="font-semibold text-gray-900">
                            Quản lý lịch thuê
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Xem các đơn thuê và trạng thái thuê của thiết bị này.
                        </p>

                        <Link
                            to="/owner/rental-history"
                            className="mt-4 inline-flex items-center text-sm font-semibold text-[#F45116] hover:underline"
                        >
                            Xem lịch sử thuê →
                        </Link>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h3 className="font-semibold text-gray-900">
                            Thiết lập lịch & giá
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Điều chỉnh giá thuê, thời gian hoạt động và ngày không nhận thuê.
                        </p>

                        <Link
                            to="/owner/schedule-settings"
                            className="mt-4 inline-flex items-center text-sm font-semibold text-[#F45116] hover:underline"
                        >
                            Thiết lập ngay →
                        </Link>
                    </div>

                </div>
            </main>
        </div>
    )
}