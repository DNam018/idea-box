# Deploy

## Chọn nơi host

| | Chi phí | Điều khoản thương mại |
|---|---|---|
| Vercel Hobby | 0đ | Chỉ cho mục đích cá nhân phi thương mại |
| Vercel Pro | $20/tháng | Không giới hạn |
| Netlify free | 0đ | Cho phép dự án thương mại |

Code giống hệt nhau ở cả ba, không phải sửa gì.

## Region: phải khớp với database

`vercel.json` đang đặt `fra1` (Frankfurt) vì project Supabase nằm ở
`aws-1-eu-central-1`. Mỗi lần tải trang chạy nhiều truy vấn, nên để function
cạnh database quan trọng hơn là để nó gần người dùng.

**Nếu đổi region Supabase sang Singapore**, nhớ đổi `vercel.json` thành `sin1`.
Trên Netlify, chọn region tương ứng trong Site settings > Functions.

## Biến môi trường cần khai báo

Copy từ `.env.local`, điền vào dashboard của nhà cung cấp:

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
SESSION_SECRET
```

**Dấu `$` trong ADMIN_PASSWORD_HASH**: khi dán vào ô biến môi trường trên
dashboard thì dán bản GỐC, không có dấu `\`. Việc escape chỉ cần cho file
`.env` ở máy, vì dotenv-expand đọc file. Dashboard lưu giá trị nguyên văn.

Nói cách khác:
- `.env.local` → `ADMIN_PASSWORD_HASH=\$2a\$12\$abc...`
- Dashboard    → `ADMIN_PASSWORD_HASH=$2a$12$abc...`

## Trước khi deploy

- [ ] Đổi mật khẩu admin sang một chuỗi mạnh: `npm run hash -- "..."`
- [ ] Tạo `SESSION_SECRET` mới, khác với bản dùng ở máy
- [ ] Kiểm tra `.env.local` không bị commit (đã có trong `.gitignore`)
- [ ] Chạy `npm run build` ở máy để chắc chắn build sạch

## Sau khi deploy

- [ ] Mở `/` gửi thử một ý tưởng có đính kèm
- [ ] Mở `/admin` đăng nhập, kiểm tra tải file về được
- [ ] Đặt cron giữ project Supabase khỏi bị pause sau 1 tuần không hoạt động
