-- Cho phép khách truy cập xem lịch sinh hoạt đang hoạt động trên trang chủ.
-- Chỉ công khai các trường sự kiện; không mở quyền đọc thành viên hoặc lịch sử nhắc.
alter table public.club_events enable row level security;
drop policy if exists "Public can view active club events" on public.club_events;
create policy "Public can view active club events"
on public.club_events for select
to anon, authenticated
using (is_active = true);
grant select on public.club_events to anon, authenticated;
