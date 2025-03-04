# Dự án Backend Ứng Dụng Đọc Sách Thông Minh
Đây là dự án backend của hệ thống đọc sách thông minh, được thực hiện bởi nhóm 10, lớp lập trình ứng dụng di động. Ứng dụng sử dụng AI để phân tích sở thích đọc sách của người dùng và gợi ý những cuốn sách phù hợp. Hệ thống hỗ trợ kết nối với cơ sở dữ liệu để lưu trữ thông tin sách, người dùng và lịch sử đọc sách. Dưới đây là các cách triển khai dự án.
## Option 1: Chạy trên localhost
Dành cho môi trường phát triển cục bộ, yêu cầu cấu hình thủ công.
1. Sao chép file `.env.example` thành `.env` và chỉnh sửa các giá trị kết nối với cơ sở dữ liệu.
2. Chay file `ddl.sql` trong database để tạo bảng trong database.
3. Cài đặt các dependencies:  
   `npm i`
4. Chạy dự án:  
   `npm run dev`

## Option 2: Chạy với Docker (Kết nối với Database đã deploy)

Sử dụng Docker khi đã có cơ sở dữ liệu PostgreSQL từ xa (Chi tiết cấu hình database vui lòng liên hệ [Nguyễn Đức](https://www.facebook.com/ngminhduc1603))

Linux / macOS:  
`docker run -dp 3000:3000 --name book_brain_be -v "$(pwd):/app" nguyenduc1603/book_brain:v1.0.0`

Windows:  
`docker run -dp 3000:3000 --name book_brain_be -v "%cd%:/app" nguyenduc1603/book_brain:v1.0.0`

Dừng docker:  
`docker stop book_brain_be`

## Option 3: Chạy với Docker Compose (Không cần cấu hình)
Sử dụng Docker Compose để triển khai nhanh cả backend và PostgreSQL cục bộ.  
Khởi động dịch vụ:  
`docker-compose up -d`  
Dừng dịch vụ:  
`docker-compose down`  
Dừng và xóa toàn bộ container cùng dữ liệu:   
`docker-compose down -v`
 
