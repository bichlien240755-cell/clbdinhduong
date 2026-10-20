# Câu lạc bộ Dinh dưỡng Herbalife — Next.js + Supabase + Vercel

Website tiếng Việt, responsive, không công khai giá. Khách hàng có thể gọi điện/Zalo theo số `0902666859`. Trang quản trị tại `/admin` cho phép đăng nhập, thêm/sửa/xóa sản phẩm và bật/tắt hiển thị.

## Chức năng

- Trang chủ giới thiệu câu lạc bộ, thông tin liên hệ, sản phẩm đang hiển thị.
- Nút gọi điện `tel:0902666859` và Zalo `https://zalo.me/0902666859`.
- Không có trường giá sản phẩm.
- Trang `/admin` đăng nhập bằng Supabase Auth.
- Quản trị sản phẩm: thêm, sửa, ẩn/hiện, xóa.
- Supabase Row Level Security (RLS) bảo vệ dữ liệu. Chỉ user có mặt trong bảng `club_admins` mới được sửa dữ liệu.
- Sản phẩm được lưu trong database, không mất khi deploy lại.
- Quản lý lịch sinh hoạt và thành viên tại `/admin/reminders`.
- Có bộ lập lịch nhắc trước 24 giờ và 2 giờ, lưu lịch sử gửi, chống gửi trùng theo từng thành viên/lịch.
- Tích hợp Zalo OA OpenAPI chỉ kích hoạt khi đã cấu hình đủ credentials server-side và template được Zalo duyệt.

## 1. Tạo Supabase

1. Mở https://supabase.com/ và tạo project.
2. Vào **SQL Editor** → **New query**.
3. Mở `supabase/schema.sql`, sao chép toàn bộ SQL (có thể chạy các dòng chú thích hướng dẫn sau riêng) và bấm **Run**.
4. Vào **Project Settings → API** (hoặc **Data API** tùy giao diện) và lấy:
   - Project URL
   - `anon` / publishable key
   Không đưa `service_role` key vào website hoặc mã nguồn.
5. Vào **Authentication → Providers → Email**, bật Email provider. Nên tắt đăng ký công khai nếu chỉ quản trị viên dùng trang admin.

## 2. Tạo tài khoản quản trị

1. Supabase → **Authentication → Users** → **Add user**.
2. Nhập email quản trị, đặt mật khẩu mạnh; xác nhận user nếu được yêu cầu.
3. Sao chép UUID/ID của user.
4. Vào **SQL Editor**, chạy câu lệnh (thay UUID bằng đúng giá trị của bạn):

```sql
insert into public.club_admins (user_id)
values ('YOUR_AUTH_USER_UUID');
```

Chỉ thêm tài khoản đáng tin cậy vào `club_admins`. Nếu không có trong bảng này, user đăng nhập sẽ không thể thêm/sửa sản phẩm.

## 3. Chạy website trên máy tính

Cần cài Node.js LTS (https://nodejs.org/) và Git nếu muốn triển khai qua GitHub.

1. Giải nén ZIP.
2. Mở terminal tại thư mục dự án.
3. Cài package:

```bash
npm install
```

4. Tạo file `.env.local` tại thư mục gốc với nội dung:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

5. Thay giá trị mẫu bằng thông tin dự án Supabase.
6. Chạy:

```bash
npm run dev
```

Mở http://localhost:3000. Trang quản trị: http://localhost:3000/admin.

## 4. Deploy lên Vercel

### Cách khuyến nghị: GitHub → Vercel

1. Tạo repository mới trên GitHub.
2. Upload toàn bộ nội dung trong thư mục dự án lên repository (không upload `.env.local`, `node_modules`, `.next`).
3. Mở https://vercel.com/ → **Add New → Project** → import repository.
4. Trong **Environment Variables**, thêm:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/publishable key
5. Deploy. Nếu build thành công, Vercel cung cấp URL website.
6. Mỗi lần push commit mới lên GitHub, Vercel tự triển khai lại.

### Nếu đã có website trên Vercel

Tạo project/repository mới cho website này, trừ khi bạn chủ động muốn thay thế dự án hiện tại. Không ghi đè nhầm website khác.

## 5. Quản lý sản phẩm

1. Mở `https://TEN-MIEN-CUA-BAN/admin`.
2. Đăng nhập bằng email/mật khẩu Supabase đã tạo và thêm vào `club_admins`.
3. Nhập tên, danh mục, mô tả và URL ảnh công khai.
4. Chọn “Hiển thị trên trang chủ” để công khai hoặc bỏ chọn để ẩn.
5. Bấm **Thêm sản phẩm** hoặc **Lưu thay đổi**.

Ảnh: phiên bản này nhận URL ảnh công khai HTTPS, chưa tích hợp nút tải file trực tiếp lên Supabase Storage. Dùng ảnh sản phẩm bạn có quyền sử dụng và bảo đảm đúng sản phẩm thực tế.

## 6. Lịch sinh hoạt và nhắc lịch Zalo

1. Chạy **toàn bộ** `supabase/schema.sql` trong Supabase SQL Editor (có thể chạy lại để tạo các bảng bổ sung). Bảng `club_members`, `club_events`, `reminder_logs` sẽ được tạo; dữ liệu thành viên/lịch chỉ quản trị viên đọc/sửa được qua RLS.
2. Deploy phiên bản source mới lên Vercel. Trang quản lý nằm tại `/admin/reminders`; đăng nhập bằng tài khoản admin đã có ở `/admin`.
3. Tạo lịch sinh hoạt và thêm thành viên. Chỉ bật “đồng ý nhận tin nhắc lịch” sau khi thành viên chủ động đồng ý. `zalo_uid` phải là UID lấy hợp lệ qua luồng/tương tác Zalo OA, không phải số điện thoại. Không tự suy ra UID từ số điện thoại.
4. Trước khi có Zalo OA, để trống toàn bộ biến `ZALO_*`: cron sẽ không gửi tin. Tính năng quản lý lịch/thành viên vẫn hoạt động.
5. Khi đủ điều kiện Zalo, thêm các biến server-only trong Vercel → Settings → Environment Variables:
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (chỉ phía server).
   - `CRON_SECRET`: chuỗi bí mật ngẫu nhiên dài; Vercel Cron gửi giá trị này trong header `Authorization: Bearer ...` theo cấu hình bảo vệ cron của dự án. Nếu nền tảng không tự gửi header, cần cấu hình cron gọi URL kèm cơ chế xác thực an toàn, không bỏ xác thực endpoint.
   - `ZALO_APP_ID`, `ZALO_APP_SECRET`: thông tin ứng dụng Zalo for Developers.
   - `ZALO_REFRESH_TOKEN`: refresh token ban đầu lấy sau khi OA cấp quyền cho ứng dụng. Sau lần dùng đầu, token mới sẽ được mã hóa và lưu trong bảng server-only `zalo_token_state`; cần đặt RLS và giữ khóa mã hóa bí mật.
   - `ZALO_TOKEN_ENCRYPTION_KEY`: khóa AES-256 dạng Base64, đúng 32 byte sau khi giải mã. Có thể tạo bằng `openssl rand -base64 32`.
   - `ZALO_TEMPLATE_ID`: ID mẫu ZBS Template Message đã được duyệt và phù hợp mục đích nhắc lịch.
6. Trong mẫu tin được duyệt, các trường hiện được code gửi là `event_name`, `event_date`, `event_time`, `event_location`. **Tên trường phải khớp chính xác** với schema của template đã duyệt. Nếu Zalo duyệt template với tên trường khác, cần cập nhật `templateData` trong `app/api/cron/zalo-reminders/route.ts` cho đúng; không tự gửi một template giả định.
7. `vercel.json` chạy cron mỗi 15 phút. Khi một lịch nằm trong cửa sổ 15 phút trước mốc 24 giờ hoặc 2 giờ, hệ thống tìm thành viên đang hoạt động, đã đồng ý và có UID rồi gọi endpoint ZBS Template chính thức. Bảng `reminder_logs` ngăn gửi trùng; kiểm tra log trong Supabase nếu tin bị từ chối.
8. Sau khi thêm/cập nhật Environment Variables, redeploy Vercel. Thử nghiệm với OA và người nhận được phép trước khi bật cho thành viên thật. Theo dõi thời hạn refresh token (3 tháng) và lỗi quyền/template.

### Điều kiện Zalo cần hoàn thành trước khi bật gửi tự động

- Tạo và thiết lập **Zalo Official Account (OA)** phù hợp với tổ chức/câu lạc bộ; hoàn tất xác thực/thông tin theo yêu cầu Zalo.
- Tạo ứng dụng trên Zalo for Developers, liên kết OA và cấp đúng quyền OA OpenAPI để gửi tin nhắn. Tài liệu Zalo cho biết OA OpenAPI là tính năng có thể yêu cầu gói dịch vụ phù hợp.
- Hoàn tất luồng OAuth chính thức, lấy `app_id`, `secret_key`, refresh token và bảo quản bí mật phía server. Access token có thời hạn; refresh token dùng một lần và được thay mới khi refresh, nên mã nguồn lưu refresh token mới đã mã hóa trong Supabase.
- Đăng ký và được duyệt ZBS Template Message phù hợp. Zalo quyết định loại tin nào được phép dùng cho mục đích này; không mặc định mọi lời mời sinh hoạt đều được duyệt thành tin giao dịch/hậu mãi. Xác nhận loại template, điều kiện nhận tin, quota và phí trước khi triển khai thực tế.
- Có cơ sở hợp lệ để gắn người nhận với UID Zalo, thông báo rõ mục đích và ghi nhận sự đồng ý nhận nhắc lịch; tôn trọng việc rút lại đồng ý.
- Không dùng API cá nhân không chính thức, tự động hóa giao diện Zalo cá nhân, hoặc dịch vụ giả lập API.

Tài liệu chính thức: [Tổng quan loại tin OA](https://oa.zalo.me/home/documents/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511), [OAuth/ủy quyền OA](https://stc-developers.zdn.vn/docs/v2/official-account/bat-dau/xac-thuc-va-uy-quyen-cho-ung-dung-new), [API gửi ZBS Template qua UID](https://docs.zaloplatforms.com/docs/ZBS/gui-tin-template-qua-uid/api-gui-tin-qua-uid), [chính sách tương tác OA](https://oa.zalo.me/home/documents/vie/policy/tuong-tac-cua-oa-voi-nguoi-dung).

## 7. Kiểm tra sau khi triển khai

- Trang chủ mở được trên điện thoại.
- Nút gọi mở ứng dụng điện thoại.
- Nút Zalo mở đúng tài khoản/số liên hệ.
- Sản phẩm ẩn không xuất hiện ở trang chủ.
- Người chưa được thêm vào `club_admins` không thể sửa database.
- Không có giá công khai.

## Lưu ý

- Đây là website giới thiệu độc lập, không phải website chính thức của Herbalife.
- Chỉ sử dụng hình ảnh, logo và nội dung thương hiệu theo quyền sử dụng và chính sách áp dụng.
- Không mô tả sản phẩm như thuốc điều trị bệnh; thông tin sức khỏe cần phù hợp nhãn sản phẩm và quy định hiện hành.
- Không đưa Supabase `service_role` key, mật khẩu hoặc token bí mật vào mã nguồn công khai.
- Trang admin dùng Supabase Auth. Bảo vệ tài khoản bằng mật khẩu mạnh và chỉ cấp quyền cho người quản trị tin cậy.
- `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `ZALO_APP_SECRET`, `ZALO_REFRESH_TOKEN`, `ZALO_TOKEN_ENCRYPTION_KEY` chỉ được đặt trong Environment Variables phía server ở Vercel, không commit vào GitHub và không gửi qua chat.
- Lịch gửi tự động có thể bị trì hoãn theo lịch chạy cron; đây không phải hệ thống gửi tin tức thời hoặc cam kết tin chắc chắn đến người nhận.
