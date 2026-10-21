-- DỮ LIỆU SẢN PHẨM MẪU cho website Câu lạc bộ Dinh dưỡng Herbalife.
-- Chạy sau schema.sql tại Supabase Dashboard > SQL Editor.
-- Không có giá bán và không sử dụng ảnh giả. image_url để NULL để bạn bổ sung ảnh được phép sử dụng.
-- Tên/dòng sản phẩm có thể khác theo thị trường và thời điểm; hãy kiểm tra nhãn và danh mục chính thức tại Việt Nam trước khi công khai.

insert into public.products (name, description, category, image_url, is_active)
select v.name, v.description, v.category, null, true
from (values
  ('Herbalife Formula 1 - Hỗn hợp dinh dưỡng',
   'Hỗn hợp dinh dưỡng dạng bột dùng để pha chế đồ uống. Cách dùng và khẩu phần: xem nhãn sản phẩm chính thức.',
   'Dinh dưỡng'),
  ('Herbalife Protein Drink Mix - Hỗn hợp đồ uống protein',
   'Sản phẩm dạng bột bổ sung protein, có thể dùng theo hướng dẫn trên nhãn sản phẩm.',
   'Protein'),
  ('Herbalife Herbal Tea Concentrate - Trà thảo mộc cô đặc',
   'Sản phẩm trà cô đặc dùng pha đồ uống. Đọc kỹ thành phần, lượng caffeine và hướng dẫn sử dụng trên nhãn.',
   'Đồ uống'),
  ('Herbalife Aloe Concentrate - Nước cô đặc lô hội',
   'Sản phẩm đồ uống cô đặc hương lô hội. Pha và sử dụng theo hướng dẫn trên nhãn sản phẩm.',
   'Đồ uống'),
  ('Herbalife Formula 2 - Vitamin & khoáng chất',
   'Sản phẩm bổ sung vitamin và khoáng chất. Không thay thế chế độ ăn đa dạng; dùng theo hướng dẫn trên nhãn.',
   'Vitamin & khoáng chất'),
  ('Herbalife Formula 3 - Hỗn hợp bổ sung protein',
   'Sản phẩm bổ sung protein theo danh mục thị trường áp dụng. Vui lòng xác nhận tên gọi và tình trạng phân phối tại Việt Nam trước khi đăng công khai.',
   'Protein'),
  ('Herbalife Liftoff - Đồ uống dạng viên sủi',
   'Sản phẩm dạng viên sủi dùng pha đồ uống; thành phần và hàm lượng caffeine (nếu có) cần được kiểm tra trên nhãn.',
   'Đồ uống'),
  ('Herbalife Snack Defense - Sản phẩm ăn nhẹ',
   'Mục mẫu để giới thiệu sản phẩm ăn nhẹ nếu dòng này có trong danh mục được phân phối tại thị trường của bạn. Xác nhận nhãn và tình trạng lưu hành trước khi sử dụng.',
   'Ăn nhẹ')
) as v(name, description, category)
where not exists (
  select 1 from public.products p where lower(p.name) = lower(v.name)
);
