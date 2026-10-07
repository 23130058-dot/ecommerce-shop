const ScheduleOverview = () => {
    return (
        <div className="min-h-screen bg-[#F8F9FB] px-6 py-6">
            {/* Breadcrumb */}
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                <span>Lịch trình & Giá</span>
                <span>/</span>
                <span className="text-gray-700">Lịch tổng quan</span>
            </div>

            {/* Page header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Lịch tổng quan
                    </h1>

                    <p className="mt-1 text-sm text-gray-400">
                        Theo dõi và quản lý lịch thiết bị của bạn tập trung.
                    </p>
                </div>

                <button
                    className="rounded-lg bg-[#F45116] px-4 py-2.5 text-sm font-medium text-white
                     transition hover:bg-[#d9400d]"
                >
                    + Thiết lập lịch
                </button>
            </div>

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="TỔNG ĐƠN TRONG THÁNG"
                    value="42"
                    description="+12.4% so với tháng trước"
                    icon="▣"
                    positive
                />

                <StatCard
                    title="THIẾT BỊ ĐANG CHO THUÊ"
                    value="18"
                    description="Trong tổng số 24 thiết bị"
                    icon="▰"
                />

                <StatCard
                    title="DOANH THU DỰ KIẾN"
                    value="125.4M"
                    description="Dựa trên các đơn đã xác nhận"
                    icon="₫"
                />

                <StatCard
                    title="TỈ LỆ LẤY MÁY ĐÚNG HẸN"
                    value="98.5%"
                    description="Chỉ số tin cậy của chủ sở hữu"
                    icon="✓"
                />
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                {/* Calendar */}
                <CalendarSection />

                {/* Right column */}
                <div className="space-y-5">
                    <RecentOrders />
                    <MaintenanceReminder />
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
                      title,
                      value,
                      description,
                      icon,
                      positive = false,
                  }) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-gray-800">
                        {value}
                    </p>

                    <p
                        className={`mt-1 text-[11px] ${
                            positive ? "text-green-500" : "text-gray-400"
                        }`}
                    >
                        {description}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF1EB] text-sm font-semibold text-[#F45116]">
                    {icon}
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   CALENDAR
========================================================= */

const CalendarSection = () => {
    const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    const days = Array.from({ length: 35 }, (_, index) => {
        const day = index - 5;

        if (day <= 0 || day > 31) {
            return null;
        }

        return day;
    });

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            {/* Calendar header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg
                       border border-gray-200 text-gray-500
                       hover:bg-gray-50"
                    >
                        ‹
                    </button>

                    <h2 className="min-w-[130px] text-center text-sm font-semibold text-gray-800">
                        Tháng 10, 2023
                    </h2>

                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg
                       border border-gray-200 text-gray-500
                       hover:bg-gray-50"
                    >
                        ›
                    </button>

                    <button
                        className="ml-2 rounded-lg bg-gray-50 px-3 py-2 text-[10px]
                       font-medium text-gray-600 hover:bg-gray-100"
                    >
                        HÔM NAY
                    </button>
                </div>

                {/* View mode */}
                <div className="flex rounded-lg bg-gray-100 p-1">
                    <button className="rounded-md bg-white px-4 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm">
                        Tháng
                    </button>

                    <button className="px-4 py-1.5 text-[10px] text-gray-500">
                        Tuần
                    </button>

                    <button className="px-4 py-1.5 text-[10px] text-gray-500">
                        Ngày
                    </button>
                </div>
            </div>

            {/* Calendar */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
                {/* Weekdays */}
                <div className="grid grid-cols-7 bg-gray-50">
                    {weekdays.map((day) => (
                        <div
                            key={day}
                            className="border-r border-gray-200 py-3 text-center
                         text-[10px] font-semibold text-gray-500 last:border-r-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7">
                    {days.map((day, index) => (
                        <CalendarDay key={index} day={day} />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <Legend
                    color="bg-emerald-400"
                    label="Đang cho thuê"
                />

                <Legend
                    color="bg-amber-400"
                    label="Chờ bàn giao"
                />

                <Legend
                    color="bg-blue-500"
                    label="Bảo trì / Lịch bận"
                />

                <Legend
                    color="bg-gray-300"
                    label="Ngày thường"
                />
            </div>
        </div>
    );
};

/* =========================================================
   CALENDAR DAY
========================================================= */

const CalendarDay = ({ day }) => {
    if (!day) {
        return (
            <div className="min-h-[82px] border-r border-t border-gray-200 bg-gray-50/40" />
        );
    }

    const showMaintenance = day === 15;
    const showRental = day === 24;
    const showPending = day === 27;

    return (
        <div
            className="min-h-[82px] border-r border-t border-gray-200
                 bg-white p-2 transition hover:bg-gray-50"
        >
      <span className="text-[10px] text-gray-500">
        {day}
      </span>

            {showMaintenance && (
                <div className="mt-2 rounded bg-blue-500 px-1.5 py-1 text-[8px] font-medium text-white">
                    Bảo trì định kỳ
                </div>
            )}

            {showRental && (
                <div className="mt-2 space-y-1">
                    <div className="truncate rounded bg-emerald-400 px-1.5 py-1 text-[8px] font-medium text-white">
                        Đơn thuê IL-01
                    </div>

                    <div className="truncate rounded bg-amber-400 px-1.5 py-1 text-[8px] font-medium text-white">
                        RED Komodo 6K
                    </div>
                </div>
            )}

            {showPending && (
                <div className="mt-2 rounded bg-amber-400 px-1.5 py-1 text-[8px] font-medium text-white">
                    Chờ bàn giao
                </div>
            )}
        </div>
    );
};

/* =========================================================
   LEGEND
========================================================= */

const Legend = ({ color, label }) => {
    return (
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span>{label}</span>
        </div>
    );
};

/* =========================================================
   RECENT ORDERS
========================================================= */

const RecentOrders = () => {
    const orders = [
        {
            customer: "Nguyễn Minh Tuấn",
            device: "Sony Alpha 7 IV Mirrorless Camera",
            status: "ĐANG THUÊ",
            statusClass: "bg-green-50 text-green-600",
        },
        {
            customer: "Trần Hoàng Nam",
            device: "RED Komodo 6K Cinema Rig",
            status: "CHỜ GIAO",
            statusClass: "bg-amber-50 text-amber-600",
        },
        {
            customer: "Lê Thị Hồng",
            device: "DJI Ronin RS3 Pro Gimbal",
            status: "ĐÃ TRẢ",
            statusClass: "bg-gray-100 text-gray-500",
        },
        {
            customer: "Phạm Văn Đức",
            device: "Sony Alpha 7 IV Mirrorless Camera",
            status: "CHỜ GIAO",
            statusClass: "bg-amber-50 text-amber-600",
        },
    ];

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">
                    Đơn đặt gần đây
                </h2>

                <span className="rounded-full bg-[#FFF1EB] px-2.5 py-1 text-[9px] font-medium text-[#F45116]">
          4 ĐANG XỬ LÝ
        </span>
            </div>

            {/* Search */}
            <div className="mb-3 flex h-9 items-center rounded-lg bg-gray-50 px-3">
                <span className="mr-2 text-gray-400">⌕</span>

                <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng, mã đơn..."
                    className="w-full bg-transparent text-[10px] text-gray-600 outline-none placeholder:text-gray-400"
                />
            </div>

            {/* Orders */}
            <div className="space-y-2">
                {orders.map((order, index) => (
                    <div
                        key={index}
                        className="rounded-lg border border-gray-100 p-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-gray-700">
                                    {order.customer}
                                </p>

                                <p className="mt-1 truncate text-[9px] text-gray-400">
                                    {order.device}
                                </p>
                            </div>

                            <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-medium ${order.statusClass}`}
                            >
                {order.status}
              </span>
                        </div>
                    </div>
                ))}
            </div>

            <button className="mt-4 w-full text-center text-[10px] font-medium text-[#F45116] hover:underline">
                XEM TẤT CẢ ĐƠN ĐẶT
            </button>
        </div>
    );
};

/* =========================================================
   MAINTENANCE
========================================================= */

const MaintenanceReminder = () => {
    return (
        <div className="rounded-xl border border-orange-200 bg-[#FFF9F5] p-5">
            <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[#F45116]">
          !
        </span>

                <h3 className="text-sm font-semibold text-[#C2410C]">
                    Nhắc nhở bảo trì
                </h3>
            </div>

            <p className="mt-3 text-[10px] leading-5 text-gray-500">
                Thiết bị Sony A7IV (CAM-01) đã hoàn thành 15 đơn thuê liên tiếp.
                Hệ thống khuyến nghị kiểm tra cảm biến và vệ sinh lens trước khi
                tiếp tục cho thuê.
            </p>

            <button
                className="mt-4 w-full rounded-lg bg-[#F45116] py-2.5 text-[10px]
                   font-medium text-white transition hover:bg-[#d9400d]"
            >
                ĐẶT LỊCH BẢO TRÌ
            </button>
        </div>
    );
};

export default ScheduleOverview;