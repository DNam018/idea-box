# Idea Box

Web nội bộ thu thập ý tưởng. Người gửi không cần đăng nhập; chỉ quản trị viên đọc được.

- **Next.js 15** (App Router) — cả frontend lẫn API
- **Supabase** — Postgres (qua Drizzle) + Storage cho tệp đính kèm
- **CSS** — lấy nguyên từ canvas design, xem `src/app/globals.css`

## Chạy lần đầu

```bash
npm install
cp .env.example .env.local   # rồi điền các giá trị
npm run hash -- "matkhaucuaban"
npm run dev
```

Chi tiết từng bước lấy khóa Supabase: xem phần hướng dẫn trong cuộc trò chuyện,
hoặc `supabase/migration.sql` để biết schema cần chạy.

## Cấu trúc

```
src/
  app/
    page.tsx              Form gửi ý tưởng (public)
    cam-on/               Màn cảm ơn sau khi gửi
    admin/                Đăng nhập + trang quản trị
    api/
      ideas/              POST tạo ý tưởng
      upload-url/         Cấp signed URL để upload thẳng lên Storage
      auth/               Đăng nhập, đăng xuất
  components/             IdeaForm, icons…
  db/                     Drizzle schema + kết nối
  lib/                    env, domains, session, storage, rate-limit
supabase/migration.sql    Chạy 1 lần trong SQL Editor
```

## Giới hạn

| | |
|---|---|
| Tiêu đề | 100 ký tự |
| Mô tả | 2000 ký tự |
| Tệp | tối đa 5 tệp, mỗi tệp 6 MB |
| Gửi ý tưởng | 5 lần / 10 phút / IP |
