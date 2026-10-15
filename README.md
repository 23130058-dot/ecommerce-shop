# ecommerce-shop

Project web thương mại điện tử LensRent. Backend dùng Java 17, Spring Boot 4.1.1, Maven và PostgreSQL; frontend dùng React, Vite và Tailwind CSS 4.

## Cấu trúc

- src/, pom.xml: backend Spring Boot.
- frontend/: frontend React + Vite + Tailwind CSS.
- compose.yaml: PostgreSQL 17 dùng cho môi trường phát triển.

## Yêu cầu cài đặt

Cài các phần mềm sau trước khi chạy project:

- Git.
- JDK 17.
- Node.js tương thích với Vite 8: Node.js 20.19+ hoặc 22.12+.
- Docker Desktop và bật Docker Engine.
- IntelliJ IDEA (khuyến nghị).

Spring Boot 4.1.1 yêu cầu tối thiểu Java 17. Vite 8 yêu cầu Node.js 20.19+ hoặc 22.12+.

- [Yêu cầu hệ thống Spring Boot](https://docs.spring.io/spring-boot/system-requirements.html)
- [Yêu cầu Node.js của Vite](https://vite.dev/guide/)

## Lấy project về máy

Repository hiện tại: [23130058-dot/ecommerce-shop](https://github.com/23130058-dot/ecommerce-shop)

Nếu repository đang để Private, bạn cần được chủ repository mời cộng tác và chấp nhận lời mời trước khi clone.

Mở Git Bash tại nơi muốn lưu project rồi chạy:

~~~bash
git clone https://github.com/23130058-dot/ecommerce-shop.git
cd ecommerce-shop
~~~

Mở thư mục ecommerce-shop vừa tải về bằng IntelliJ IDEA. Chờ IntelliJ tải và đồng bộ các dependency Maven.

## Chạy PostgreSQL

Đứng ở thư mục gốc ecommerce-shop (cùng cấp với compose.yaml) và chạy:

~~~bash
docker compose up -d db
docker compose ps
~~~

Chờ container ecommerce-db có trạng thái running hoặc Up.

Cấu hình phát triển hiện tại:

- Database: ecommerce
- Username: ecommerce
- Password: ecommerce_dev
- Port: 5432

Thông tin này chỉ dành cho môi trường local để học tập/phát triển. Không thay bằng mật khẩu thật rồi commit lên Git.

Tắt database khi không dùng:

~~~bash
docker compose down
~~~

Lệnh trên giữ lại dữ liệu trong Docker volume. Không thêm -v nếu muốn giữ dữ liệu database.

## Chạy backend

### Cách dùng IntelliJ IDEA

1. Mở project bằng IntelliJ và chờ Maven import hoàn tất.
2. Đặt Project SDK và Maven JDK là JDK 17.
3. Đảm bảo Docker Desktop đang chạy và container PostgreSQL đã được bật.
4. Mở lớp EcommerceShopApplication trong src/main/java.
5. Nhấn nút tam giác xanh cạnh hàm main hoặc nút Run trên thanh công cụ.

Backend Spring Boot mặc định chạy tại http://localhost:8080.

### Cách dùng lệnh

Từ thư mục gốc project:

Windows PowerShell:

~~~powershell
.\mvnw.cmd spring-boot:run
~~~

macOS/Linux/Git Bash:

~~~bash
./mvnw spring-boot:run
~~~

Để chạy backend tests:

Windows PowerShell:

~~~powershell
.\mvnw.cmd test
~~~

macOS/Linux/Git Bash:

~~~bash
./mvnw test
~~~

## Hướng dẫn sử dụng

### Khách thuê (RENTER)

1. Đăng ký tài khoản hoặc đăng nhập. Tài khoản đăng ký mới mặc định có vai trò RENTER.
2. Tìm thiết bị ở trang chủ hoặc danh mục; mở thẻ sản phẩm để xem chi tiết, chọn ngày thuê và thêm vào giỏ.
3. Có thể lưu thiết bị vào Wishlist hoặc thêm vào So sánh. Các mục này được lưu theo tài khoản.
4. Giỏ hàng giữ số lượng thiết bị trong 10 phút. Nếu chưa hoàn tất thanh toán khi hết thời gian, chỗ giữ được trả lại kho; hãy kiểm tra lại giỏ trước khi thanh toán.
5. Trong bước xác nhận giỏ, nhập thời gian thuê, cách nhận thiết bị và thông tin liên hệ. Bước thanh toán hiện là mô phỏng: nhấn xác nhận thanh toán sẽ tạo đơn và ghi nhận trạng thái đã thanh toán, chưa kết nối cổng thanh toán thật.
6. Theo dõi đơn và thiết bị đang thuê trong khu vực Renter. Thông tin cá nhân, ảnh đại diện và mật khẩu có thể quản lý ở phần hồ sơ/cài đặt tài khoản.

Backend từ chối thêm vào giỏ, cập nhật giỏ hoặc thanh toán nếu người đang đăng nhập là chủ sở hữu sản phẩm. Quy tắc này được kiểm tra lại trong backend ở mỗi bước thuê.

### Chủ thiết bị (OWNER)

Tài khoản OWNER có thể đăng thiết bị cho thuê, quản lý sản phẩm của mình, xem yêu cầu thuê và xác nhận hoặc hoàn tất đơn trong khu vực Owner. Đăng ký thông thường không tự cấp vai trò OWNER. Trong môi trường local, sau khi đăng ký tài khoản, có thể cấp vai trò bằng lệnh sau:

~~~powershell
docker compose exec db psql -U ecommerce -d ecommerce -c "UPDATE users SET role = 'OWNER' WHERE LOWER(email) = LOWER('email-cua-ban@example.com');"
~~~

Thay email mẫu bằng email đã đăng ký. Sau đó đăng xuất và đăng nhập lại để nhận JWT có vai trò mới. Các sản phẩm mẫu được chuyển sang `23130058@st.hcmuaf.edu.vn` bởi migration `V9__assign_demo_products_to_existing_owner.sql`; migration này yêu cầu tài khoản email đó đã có trong database khi V9 chạy.

### Quản trị viên (ADMIN)

Migration `V10__bootstrap_admin_account.sql` tạo hoặc cập nhật tài khoản phát triển `123@gmail.com` với mật khẩu `Chidat0805` và vai trò ADMIN. Đây là thông tin đăng nhập dành riêng cho database local dùng trong dự án. Không dùng mật khẩu này trên môi trường thật; đổi mật khẩu trước khi chia sẻ hoặc triển khai ứng dụng. Đăng nhập bằng tài khoản này để mở `/admin`.

Không cho phép đăng ký công khai tự chọn role ADMIN. Backend chỉ cho JWT có role ADMIN truy cập `/api/admin/**`; tài khoản thường không thể mở trang quản trị bằng cách nhập URL trực tiếp.

## Các trang và chức năng hiện có

- Trang chủ, danh mục, tìm kiếm và trang chi tiết sản phẩm lấy dữ liệu thiết bị từ PostgreSQL.
- Wishlist, So sánh và Giỏ hàng lưu theo người dùng đã đăng nhập.
- Checkout tạo đơn thuê, ghi nhận thanh toán mô phỏng và hiển thị trang xác nhận đơn.
- Renter xem hồ sơ, cài đặt tài khoản, lịch sử đơn và thiết bị đang thuê.
- Owner đăng/quản lý thiết bị, xác nhận yêu cầu thuê và theo dõi đơn của sản phẩm mình sở hữu.
- Admin xem tổng quan, tìm kiếm/lọc người dùng và khóa hoặc mở khóa tài khoản.

## API quản trị

- `GET /api/admin/dashboard`: tổng hợp doanh thu, đơn thuê hoàn tất, người dùng mới, thiết bị chờ duyệt, tranh chấp, biểu đồ theo tháng/danh mục và hoạt động gần đây.
- `GET /api/admin/users`: tìm kiếm/lọc/phân trang người dùng bằng `search`, `role`, `status`, `page`, `size`.
- `PATCH /api/admin/users/{id}/status`: khóa hoặc mở khóa tài khoản bằng JSON `{"status":"LOCKED"}` hoặc `{"status":"ACTIVE"}`.

Flyway tự áp dụng các migration khi backend khởi động. Các migration tạo schema, dữ liệu catalog mẫu, giỏ/Wishlist/So sánh, dữ liệu Owner và tài khoản ADMIN phát triển. Với database mới, lưu ý migration V9 yêu cầu tài khoản `23130058@st.hcmuaf.edu.vn` tồn tại trước khi migration chạy. Migration V2 bổ sung giá trị role/trạng thái mặc định và index cho truy vấn quản trị.

## Chạy frontend

Mở một cửa sổ terminal riêng. Từ thư mục gốc project, chạy:

~~~bash
cd frontend
npm ci
npm run dev
~~~

Mở URL Vite in ra, thường là http://localhost:5173.

Frontend là ứng dụng riêng với backend; cần chạy cả PostgreSQL, backend và frontend để phát triển toàn bộ hệ thống. Tailwind CSS 4 đã được kết nối với Vite; dùng class Tailwind trong thuộc tính className của JSX.

Các lệnh frontend khác (chạy trong frontend/):

~~~bash
npm run build
npm run lint
~~~

## Cách làm việc nhóm bằng Git

Mỗi cộng tác viên nên làm tính năng trên một nhánh riêng, không commit trực tiếp lên main.

Cập nhật main trước khi tạo nhánh:

~~~bash
git checkout main
git pull origin main
git checkout -b feature/ten-tinh-nang
~~~

Ví dụ:

~~~bash
git checkout -b feature/login-register
~~~

Sau khi sửa code:

~~~bash
git add .
git commit -m "feat: add login and registration"
git push -u origin feature/login-register
~~~

Sau khi push, mở GitHub và tạo Pull Request từ nhánh tính năng vào main để nhóm review và gộp code.

Quy ước tên nhánh gợi ý:

- feature/ten-tinh-nang: thêm chức năng.
- fix/mo-ta-loi: sửa lỗi.
- docs/mo-ta: cập nhật tài liệu.

Trước khi commit, kiểm tra danh sách file:

~~~bash
git status
~~~

Không commit node_modules/, dist/, target/, file .env, mật khẩu thật hoặc API key. Các thư mục build và dependency cần được bỏ qua bằng .gitignore.

## Khắc phục nhanh

- Docker không chạy: mở Docker Desktop và chờ Docker Engine khởi động xong.
- Không kết nối được PostgreSQL: kiểm tra bằng docker compose ps; đảm bảo port 5432 chưa bị ứng dụng khác chiếm.
- Frontend không chạy: kiểm tra phiên bản bằng node -v, npm -v; cần phiên bản Node đáp ứng yêu cầu Vite ở trên.
- Không clone được repository Private: kiểm tra đã được mời vào repository và đã chấp nhận lời mời GitHub chưa.
- Không chạy được backend: kiểm tra IntelliJ đang dùng JDK 17 và PostgreSQL đã chạy.
