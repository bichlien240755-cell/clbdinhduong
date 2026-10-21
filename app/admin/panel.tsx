"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { ArrowLeft, Eye, EyeOff, Leaf, LogOut, Pencil, Plus, Save, Trash2, CalendarDays } from "lucide-react";

type Product = {
  id: string; name: string; description: string | null; image_url: string | null;
  category: string | null; price: number | null; is_active: boolean; created_at: string;
};
type Draft = { name: string; description: string; image_url: string; category: string; price: string; is_active: boolean };
const blank: Draft = { name: "", description: "", image_url: "", category: "", price: "", is_active: true };

export default function AdminPanel() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => { if (userEmail) loadProducts(); }, [userEmail]);

  async function loadProducts() {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) setMessage("Không tải được sản phẩm. Hãy kiểm tra SQL/RLS và tài khoản admin: " + error.message);
    else setProducts((data ?? []) as Product[]);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage("Đăng nhập chưa thành công: " + error.message);
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail(null); setProducts([]); setMessage("");
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setDraft({ name: p.name, description: p.description ?? "", image_url: p.image_url ?? "", category: p.category ?? "", price: p.price == null ? "" : String(p.price), is_active: p.is_active });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() { setDraft(blank); setEditingId(null); }

  async function saveProduct(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const payload = {
      name: draft.name.trim(), description: draft.description.trim() || null,
      image_url: draft.image_url.trim() || null, category: draft.category.trim() || null,
      price: draft.price.trim() === "" ? null : Number(draft.price),
      is_active: draft.is_active
    };
    if (!payload.name) { setMessage("Vui lòng nhập tên sản phẩm."); setBusy(false); return; }
    if (payload.price !== null && (!Number.isFinite(payload.price) || payload.price < 0)) { setMessage("Giá phải là số không âm hoặc để trống."); setBusy(false); return; }
    const result = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);
    if (result.error) setMessage("Không lưu được: " + result.error.message);
    else { setMessage(editingId ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm."); resetForm(); await loadProducts(); }
    setBusy(false);
  }

  async function toggleProduct(p: Product) {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    setMessage(error ? "Không cập nhật được: " + error.message : `Đã ${p.is_active ? "ẩn" : "hiện"} sản phẩm "${p.name}".`);
    if (!error) await loadProducts();
  }

  async function deleteProduct(p: Product) {
    if (!window.confirm(`Bạn có chắc muốn xóa "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setMessage(error ? "Không xóa được: " + error.message : "Đã xóa sản phẩm.");
    if (!error) await loadProducts();
  }

  if (loading) return <div className="admin-screen"><div className="admin-card">Đang tải trang quản trị…</div></div>;

  if (!userEmail) return <div className="admin-screen">
    <div className="admin-login">
      <Link href="/" className="back-link"><ArrowLeft size={17} /> Về trang chủ</Link>
      <div className="admin-brand"><span className="brand-mark"><Leaf size={28} /></span><div><strong>QUẢN TRỊ WEBSITE</strong><small>CÂU LẠC BỘ DINH DƯỠNG</small></div></div>
      <h1>Đăng nhập quản trị</h1><p className="muted">Dùng email và mật khẩu đã tạo trong Supabase Authentication.</p>
      <form onSubmit={signIn} className="admin-form">
        <label>Email quản trị<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        <button className="button admin-submit" disabled={busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
      </form>
      {message && <div className="notice">{message}</div>}
      <p className="login-hint">Chưa có tài khoản? Tạo user trong Supabase → Authentication → Users, sau đó thêm user ID vào bảng <code>club_admins</code> theo hướng dẫn README.</p>
    </div>
  </div>;

  return <div className="admin-screen admin-dashboard">
    <header className="admin-top"><Link href="/" className="brand"><span className="brand-mark"><Leaf size={24} /></span><span><strong>CLB DINH DƯỠNG</strong><small>QUẢN TRỊ WEBSITE</small></span></Link><div className="admin-user"><span>{userEmail}</span><Link className="button button-outline button-small" href="/admin/reminders"><CalendarDays size={16} /> Lịch & thành viên</Link><button className="button button-outline button-small" onClick={signOut}><LogOut size={16} /> Đăng xuất</button></div></header>
    <div className="admin-container">
      <div className="admin-title-row"><div><div className="eyebrow">QUẢN LÝ DANH MỤC</div><h1>Sản phẩm</h1><p className="muted">Thêm, chỉnh sửa và điều khiển sản phẩm xuất hiện trên trang chủ.</p></div><span className="count-pill">{products.length} sản phẩm</span></div>
      {message && <div className="notice">{message}</div>}
      <div className="admin-columns">
        <section className="admin-card edit-card">
          <h2>{editingId ? <><Pencil size={19} /> Chỉnh sửa sản phẩm</> : <><Plus size={19} /> Thêm sản phẩm mới</>}</h2>
          <form className="admin-form" onSubmit={saveProduct}>
            <label>Tên sản phẩm *<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required maxLength={120} placeholder="Ví dụ: Sản phẩm dinh dưỡng" /></label>
            <label>Giá tham khảo (VNĐ)<input type="number" min="0" step="1000" inputMode="numeric" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} placeholder="Để trống nếu chưa xác định" /></label>
            <p className="field-help">Giá chỉ lưu trong phần quản trị; website công khai vẫn không hiển thị giá.</p>
            <label>Danh mục<input value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} maxLength={60} placeholder="Ví dụ: Dinh dưỡng" /></label>
            <label>URL hình ảnh<input type="url" value={draft.image_url} onChange={e => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." /></label>
            <p className="field-help">Dán đường dẫn ảnh công khai https://. Chưa có chức năng tải ảnh trực tiếp lên.</p>
            <label>Mô tả sản phẩm<textarea rows={4} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} maxLength={700} placeholder="Thông tin ngắn gọn, chính xác theo nhãn sản phẩm." /></label>
            <label className="checkbox-label"><input type="checkbox" checked={draft.is_active} onChange={e => setDraft({ ...draft, is_active: e.target.checked })} /> Hiển thị trên trang chủ</label>
            <div className="form-actions"><button className="button" disabled={busy}><Save size={17} /> {busy ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Thêm sản phẩm"}</button>{editingId && <button type="button" className="button button-outline" onClick={resetForm}>Hủy sửa</button>}</div>
          </form>
        </section>
        <section className="admin-card list-card">
          <div className="list-heading"><h2>Danh sách sản phẩm</h2><button className="icon-button" onClick={loadProducts} title="Tải lại danh sách">↻</button></div>
          {products.length === 0 ? <div className="admin-empty">Chưa có sản phẩm. Hãy thêm sản phẩm ở biểu mẫu bên cạnh.</div> : <div className="admin-product-list">
            {products.map(p => <article className="admin-product" key={p.id}>
              <div className="admin-product-image">{p.image_url ? <img src={p.image_url} alt="" /> : <Leaf size={25} />}</div>
              <div className="admin-product-info"><strong>{p.name}</strong><span>{p.category || "Chưa phân loại"}</span><span>{p.price == null ? "Chưa nhập giá" : `Giá tham khảo: ${new Intl.NumberFormat("vi-VN").format(p.price)} ₫`}</span><span className={p.is_active ? "status-active" : "status-hidden"}>{p.is_active ? "Đang hiển thị" : "Đang ẩn"}</span></div>
              <div className="admin-product-actions"><button className="icon-button" onClick={() => startEdit(p)} title="Chỉnh sửa"><Pencil size={16} /></button><button className="icon-button" onClick={() => toggleProduct(p)} title={p.is_active ? "Ẩn sản phẩm" : "Hiện sản phẩm"}>{p.is_active ? <EyeOff size={16} /> : <Eye size={16} />}</button><button className="icon-button danger" onClick={() => deleteProduct(p)} title="Xóa"><Trash2 size={16} /></button></div>
            </article>)}
          </div>}
        </section>
      </div>
      <p className="admin-footnote">Giá tham khảo được lưu trong khu vực quản trị và không hiển thị công khai trên website. Hãy kiểm tra giá bán thực tế trước khi tư vấn khách hàng.</p>
    </div>
  </div>;
}
