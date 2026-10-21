-- Chạy một lần trong Supabase SQL Editor để bổ sung giá cho bảng products hiện có.
alter table public.products add column if not exists price numeric(12,2);
alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check check (price is null or price >= 0);
