import Link from "next/link";
import { ArrowRight, HeartPulse, Leaf, MessageCircle, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase-server";

type ClubEvent = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  notes: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
};

const PHONE = "0902666859";
const ZALO = "https://zalo.me/0902666859";

export const revalidate = 0;

export default async function Home() {
  let products: Product[] = [];
  let events: ClubEvent[] = [];
  let dbReady = true;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description,image_url,category")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    products = data ?? [];
    const { data: eventData, error: eventError } = await supabase
      .from("club_events")
      .select("id,title,starts_at,location,notes")
      .eq("is_active", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6);
    // Events are optional for the public homepage. Keep product listings visible
    // even if the public event-read policy has not been applied yet.
    if (!eventError) events = eventData ?? [];
  } catch {
    dbReady = false;
  }

  return (
    <main>
      <div className="topbar">
        <div className="container topbar-inner">
          <span>Nuôi dưỡng thói quen sống khỏe mỗi ngày</span>
          <a href={`tel:${PHONE}`}><Phone size={14} /> {PHONE}</a>
        </div>
      </div>
      <header className="site-header">
        <div className="container nav">
          <Link href="/" className="brand">
            <span className="brand-mark"><Leaf size={27} /></span>
            <span><strong>CÂU LẠC BỘ DINH DƯỠNG</strong><small>HERBALIFE NUTRITION</small></span>
          </Link>
          <nav>
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#san-pham">Sản phẩm</a>
            <a href="#lich-sinh-hoat">Lịch sinh hoạt</a>
            <a href="#lien-he">Liên hệ</a>
          </nav>
          <a className="button button-small" href={ZALO} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Tư vấn qua Zalo</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> DINH DƯỠNG • VẬN ĐỘNG • KẾT NỐI</div>
            <h1>Sống khỏe hơn,<br /><em>mỗi ngày một chút.</em></h1>
            <p className="hero-lead">Chào mừng bạn đến với Câu lạc bộ Dinh dưỡng Herbalife — nơi cùng nhau tìm hiểu dinh dưỡng, xây dựng thói quen tích cực và hướng đến lối sống năng động.</p>
            <div className="hero-actions">
              <a className="button" href="#san-pham">Khám phá sản phẩm <ArrowRight size={18} /></a>
              <a className="button button-outline" href={ZALO} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Nhắn Zalo</a>
            </div>
            <div className="hero-note"><ShieldCheck size={17} /> Tư vấn thông tin sản phẩm rõ ràng, theo nhãn và hướng dẫn sử dụng.</div>
          </div>
          <div className="hero-visual">
            <div className="image-frame">
              <img src="https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1100&q=85" alt="Bữa ăn cân bằng với rau củ và thực phẩm tươi" />
            </div>
            <div className="floating-card"><span className="floating-icon"><HeartPulse size={23} /></span><span><strong>Thói quen tích cực</strong><small>Bắt đầu từ những điều nhỏ</small></span></div>
            <div className="decor-leaf"><Leaf size={72} /></div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="container benefit-grid">
          <div className="benefit"><span><Leaf /></span><div><strong>Tìm hiểu dinh dưỡng</strong><p>Thông tin sản phẩm dễ tiếp cận</p></div></div>
          <div className="benefit"><span><HeartPulse /></span><div><strong>Thói quen lành mạnh</strong><p>Khuyến khích vận động phù hợp</p></div></div>
          <div className="benefit"><span><MessageCircle /></span><div><strong>Kết nối dễ dàng</strong><p>Liên hệ trực tiếp qua điện thoại/Zalo</p></div></div>
        </div>
      </section>

      <section className="section" id="gioi-thieu">
        <div className="container intro-grid">
          <div className="intro-art">
            <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85" alt="Thực phẩm đa dạng cho bữa ăn cân bằng" />
            <div className="art-caption"><Leaf size={20} /><span>Khỏe mạnh bắt đầu từ lựa chọn mỗi ngày</span></div>
          </div>
          <div className="intro-copy">
            <div className="eyebrow">VỀ CÂU LẠC BỘ</div>
            <h2>Cùng nhau xây dựng<br /><em>lối sống năng động</em></h2>
            <p>Câu lạc bộ là nơi để bạn tìm hiểu thông tin về các sản phẩm dinh dưỡng, đặt câu hỏi và khám phá những thói quen tích cực phù hợp với cuộc sống của mình.</p>
            <ul className="check-list">
              <li><span>✓</span> Thông tin sản phẩm và cách sử dụng theo nhãn</li>
              <li><span>✓</span> Trao đổi trực tiếp với người tư vấn</li>
              <li><span>✓</span> Liên hệ nhanh, không cần tạo tài khoản khách hàng</li>
            </ul>
            <a className="text-link" href={ZALO} target="_blank" rel="noreferrer">Kết nối với câu lạc bộ <ArrowRight size={17} /></a>
          </div>
        </div>
      </section>

      <section className="section schedule-section" id="lich-sinh-hoat">
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">KẾT NỐI CÙNG CÂU LẠC BỘ</div><h2>Lịch sinh hoạt<br /><em>sắp diễn ra</em></h2></div>
            <p>Cập nhật các buổi sinh hoạt để bạn chủ động sắp xếp thời gian tham dự.</p>
          </div>
          {events.length === 0 ? (
            <div className="empty-state schedule-empty"><Leaf size={30} /><h3>Lịch sinh hoạt đang được cập nhật</h3><p>Các buổi sinh hoạt sắp tới sẽ hiển thị tại đây khi câu lạc bộ đăng lịch.</p><a className="button" href={`${ZALO}?text=${encodeURIComponent("Xin chào, cho tôi hỏi lịch sinh hoạt sắp tới của Câu lạc bộ Dinh dưỡng Herbalife.")}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Hỏi lịch qua Zalo</a></div>
          ) : (
            <div className="schedule-grid">
              {events.map((event) => {
                const date = new Date(event.starts_at);
                const day = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
                const month = new Intl.DateTimeFormat("vi-VN", { month: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
                const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
                const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(date);
                const fullDate = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
                return <article className="schedule-card" key={event.id}>
                  <div className="schedule-date"><strong>{day}</strong><span>{month}</span></div>
                  <div className="schedule-details"><span className="schedule-weekday">{weekday}</span><h3>{event.title}</h3><p className="schedule-meta"><span>◷ {time} · {fullDate}</span>{event.location && <span>⌖ {event.location}</span>}</p>{event.notes && <p className="schedule-notes">{event.notes}</p>}</div>
                  <a className="schedule-ask" href={`${ZALO}?text=${encodeURIComponent(`Xin chào, tôi muốn tìm hiểu và đăng ký tham dự buổi ${event.title} ngày ${fullDate} lúc ${time}.`)}`} target="_blank" rel="noreferrer">Hỏi tham dự <ArrowRight size={15} /></a>
                </article>;
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section products-section" id="san-pham">
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">DANH MỤC SẢN PHẨM</div><h2>Tìm hiểu sản phẩm<br /><em>phù hợp với bạn</em></h2></div>
            <p>Liên hệ để nhận thông tin về giá bán, tình trạng hàng và hướng dẫn sử dụng từ nhãn sản phẩm.</p>
          </div>
          {!dbReady ? (
            <div className="empty-state"><Leaf size={30} /><h3>Danh mục sản phẩm đang được thiết lập</h3><p>Vui lòng quay lại sau hoặc liên hệ trực tiếp để được hỗ trợ.</p></div>
          ) : products.length === 0 ? (
            <div className="empty-state"><Leaf size={30} /><h3>Sản phẩm sẽ được cập nhật tại đây</h3><p>Danh mục sẽ hiển thị khi quản trị viên thêm và bật trạng thái sản phẩm.</p><a className="button" href={ZALO} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Hỏi sản phẩm qua Zalo</a></div>
          ) : (
            <div className="product-grid">
              {products.map((p) => <article className="product-card" key={p.id}>
                <div className="product-image">
                  {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="image-placeholder"><Leaf size={42} /></div>}
                  {p.category && <span className="category-tag">{p.category}</span>}
                </div>
                <div className="product-content"><h3>{p.name}</h3><p>{p.description || "Liên hệ để tìm hiểu thông tin chi tiết về sản phẩm."}</p><a href={`${ZALO}?text=${encodeURIComponent(`Xin chào, tôi muốn hỏi thông tin sản phẩm ${p.name}.`)}`} target="_blank" rel="noreferrer" className="product-cta">Liên hệ hỏi giá <ArrowRight size={16} /></a></div>
              </article>)}
            </div>
          )}
          <p className="price-note">Giá sản phẩm được cung cấp khi liên hệ trực tiếp. Website không hiển thị giá công khai.</p>
        </div>
      </section>

      <section className="contact-band" id="lien-he">
        <div className="container contact-inner">
          <div><div className="eyebrow eyebrow-light">CHÚNG TÔI SẴN SÀNG HỖ TRỢ</div><h2>Bạn cần tìm hiểu thêm?</h2><p>Gọi điện hoặc nhắn Zalo để hỏi thông tin sản phẩm và cách đặt mua.</p></div>
          <div className="contact-actions"><a className="button button-white" href={`tel:${PHONE}`}><Phone size={18} /> Gọi {PHONE}</a><a className="button button-zalo" href={ZALO} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Nhắn Zalo</a></div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-main">
          <Link href="/" className="brand brand-footer"><span className="brand-mark"><Leaf size={25} /></span><span><strong>CÂU LẠC BỘ DINH DƯỠNG</strong><small>HERBALIFE NUTRITION</small></span></Link>
          <p>Thông tin liên hệ<br /><a href={`tel:${PHONE}`}>{PHONE}</a> · <a href={ZALO} target="_blank" rel="noreferrer">Zalo</a></p>
          <Link href="/admin" className="admin-link">Quản trị viên</Link>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} Câu lạc bộ Dinh dưỡng Herbalife.</span><span>Website giới thiệu độc lập, không phải website chính thức của Herbalife.</span></div>
        <p className="disclaimer">Thông tin trên website chỉ nhằm giới thiệu sản phẩm và không thay thế tư vấn y tế. Sản phẩm không được giới thiệu như thuốc điều trị bệnh.</p>
      </footer>
      <a className="floating-zalo" href={ZALO} target="_blank" rel="noreferrer" aria-label="Liên hệ Zalo"><MessageCircle size={25} /><span>Zalo</span></a>
    </main>
  );
}
