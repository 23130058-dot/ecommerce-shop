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
