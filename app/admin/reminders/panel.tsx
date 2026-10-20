"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { ArrowLeft, CalendarDays, Users, BellRing, LogOut, Plus, RefreshCw } from "lucide-react";

type Member = { id: string; full_name: string; phone: string | null; zalo_uid: string | null; consent_to_reminders: boolean; is_active: boolean };
type ClubEvent = { id: string; title: string; starts_at: string; location: string | null; notes: string | null; is_active: boolean };
type ReminderLog = { id: string; event_id: string; member_id: string; reminder_type: string; status: string; created_at: string; sent_at: string | null; error_code: string | null };
const blankMember = { full_name: "", phone: "", zalo_uid: "", consent_to_reminders: false };
const blankEvent = { title: "", starts_at: "", location: "", notes: "" };

export default function RemindersPanel() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [member, setMember] = useState(blankMember);
  const [event, setEvent] = useState(blankEvent);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setEmail(data.session?.user.email ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => { if (email) void reload(); }, [email]);

  async function reload() {
    const [m, e, l] = await Promise.all([
      supabase.from("club_members").select("id,full_name,phone,zalo_uid,consent_to_reminders,is_active").order("full_name"),
      supabase.from("club_events").select("id,title,starts_at,location,notes,is_active").order("starts_at", { ascending: true }),
      supabase.from("reminder_logs").select("id,event_id,member_id,reminder_type,status,created_at,sent_at,error_code").order("created_at", { ascending: false }).limit(30),
    ]);
    if (m.error || e.error || l.error) setMessage("Chưa tải được dữ liệu. Hãy chạy phần SQL cập nhật trong supabase/schema.sql và kiểm tra quyền admin.");
    else { setMembers((m.data ?? []) as Member[]); setEvents((e.data ?? []) as ClubEvent[]); setLogs((l.data ?? []) as ReminderLog[]); }
  }
  async function saveMember(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.from("club_members").insert({ full_name: member.full_name.trim(), phone: member.phone.trim() || null, zalo_uid: member.zalo_uid.trim() || null, consent_to_reminders: member.consent_to_reminders, consent_recorded_at: member.consent_to_reminders ? new Date().toISOString() : null });
    setMessage(error ? `Không lưu được thành viên: ${error.message}` : "Đã thêm thành viên.");
    if (!error) { setMember(blankMember); await reload(); } setBusy(false);
  }
  async function saveEvent(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.from("club_events").insert({ title: event.title.trim(), starts_at: new Date(event.starts_at).toISOString(), location: event.location.trim() || null, notes: event.notes.trim() || null });
    setMessage(error ? `Không lưu được lịch: ${error.message}` : "Đã thêm lịch sinh hoạt.");
    if (!error) { setEvent(blankEvent); await reload(); } setBusy(false);
  }
  async function toggleConsent(m: Member) {
    const { error } = await supabase.from("club_members").update({ consent_to_reminders: !m.consent_to_reminders, consent_recorded_at: !m.consent_to_reminders ? new Date().toISOString() : null }).eq("id", m.id);
    setMessage(error ? "Không cập nhật được lựa chọn nhận nhắc lịch." : `Đã ${m.consent_to_reminders ? "tắt" : "bật"} nhận nhắc lịch cho ${m.full_name}.`); if (!error) await reload();
  }
  async function deactivateMember(m: Member) {
    if (!window.confirm(`Ngừng kích hoạt thành viên ${m.full_name}?`)) return;
    const { error } = await supabase.from("club_members").update({ is_active: false, consent_to_reminders: false }).eq("id", m.id);
    setMessage(error ? "Không cập nhật được thành viên." : "Đã ngừng kích hoạt và tắt nhắc lịch."); if (!error) await reload();
  }
  async function deactivateEvent(ev: ClubEvent) {
    if (!window.confirm(`Ngừng lịch “${ev.title}”?`)) return;
    const { error } = await supabase.from("club_events").update({ is_active: false }).eq("id", ev.id);
    setMessage(error ? "Không cập nhật được lịch." : "Đã ngừng lịch."); if (!error) await reload();
  }
  async function signOut() { await supabase.auth.signOut(); setEmail(null); }

  if (loading) return <div className="admin-screen"><div className="admin-card">Đang tải…</div></div>;
  if (!email) return <div className="admin-screen"><div className="admin-login"><Link href="/admin" className="back-link"><ArrowLeft size={17}/> Đến trang đăng nhập quản trị</Link><h1>Cần đăng nhập quản trị</h1><p className="muted">Hãy đăng nhập tại /admin trước, sau đó mở lại trang này.</p><Link className="button" href="/admin">Mở trang đăng nhập</Link></div></div>;

  return <div className="admin-screen admin-dashboard">
    <header className="admin-top"><Link href="/admin" className="brand"><span className="brand-mark"><CalendarDays size={24}/></span><span><strong>CLB DINH DƯỠNG</strong><small>QUẢN LÝ LỊCH & THÀNH VIÊN</small></span></Link><div className="admin-user"><span>{email}</span><button className="button button-outline button-small" onClick={signOut}><LogOut size={16}/> Đăng xuất</button></div></header>
    <div className="admin-container">
      <div className="admin-title-row"><div><div className="eyebrow">NHẮC LỊCH THAM DỰ</div><h1>Lịch sinh hoạt & thành viên</h1><p className="muted">Tất cả thời gian nhập theo giờ Việt Nam. Tin Zalo tự động chỉ hoạt động sau khi cấu hình OA/API và mẫu tin được duyệt.</p></div><button className="button button-outline" onClick={() => void reload()}><RefreshCw size={16}/> Tải lại</button></div>
      {message && <div className="notice">{message}</div>}
      <div className="notice" style={{ marginBottom: 18 }}><strong><BellRing size={16} style={{display:"inline",verticalAlign:"middle"}}/> Trạng thái tích hợp Zalo: chưa kích hoạt.</strong> Chỉ nhập UID Zalo khi có cơ sở hợp lệ và thành viên đồng ý nhận nhắc lịch. Không nhập token/API key tại trang này.</div>
      <div className="admin-columns">
        <section className="admin-card edit-card"><h2><Plus size={19}/> Thêm lịch sinh hoạt</h2><form className="admin-form" onSubmit={saveEvent}>
          <label>Tên buổi sinh hoạt *<input value={event.title} onChange={e=>setEvent({...event,title:e.target.value})} required maxLength={150} placeholder="Ví dụ: Sinh hoạt CLB tuần này"/></label>
          <label>Ngày giờ bắt đầu *<input type="datetime-local" value={event.starts_at} onChange={e=>setEvent({...event,starts_at:e.target.value})} required/></label>
          <label>Địa điểm<input value={event.location} onChange={e=>setEvent({...event,location:e.target.value})} maxLength={250} placeholder="Địa chỉ CLB"/></label>
          <label>Ghi chú<textarea rows={3} value={event.notes} onChange={e=>setEvent({...event,notes:e.target.value})} maxLength={500} placeholder="Chuẩn bị hoặc nội dung cần lưu ý"/></label>
          <button className="button" disabled={busy}><Plus size={16}/> Lưu lịch sinh hoạt</button>
        </form></section>
        <section className="admin-card edit-card"><h2><Users size={19}/> Thêm thành viên</h2><form className="admin-form" onSubmit={saveMember}>
          <label>Họ tên *<input value={member.full_name} onChange={e=>setMember({...member,full_name:e.target.value})} required maxLength={120}/></label>
          <label>Số điện thoại<input type="tel" value={member.phone} onChange={e=>setMember({...member,phone:e.target.value})} maxLength={20} placeholder="Dùng để liên hệ khi cần"/></label>
          <label>Zalo UID (nếu đã có hợp lệ)<input value={member.zalo_uid} onChange={e=>setMember({...member,zalo_uid:e.target.value})} maxLength={100} placeholder="Không phải số điện thoại"/></label>
          <label className="checkbox-label"><input type="checkbox" checked={member.consent_to_reminders} onChange={e=>setMember({...member,consent_to_reminders:e.target.checked})}/> Thành viên đã đồng ý nhận tin nhắc lịch</label>
          <p className="field-help">Chỉ bật lựa chọn này sau khi đã xin phép thành viên. Tự động gửi vẫn bị khóa nếu thiếu cấu hình Zalo chính thức.</p>
          <button className="button" disabled={busy}><Plus size={16}/> Lưu thành viên</button>
        </form></section>
      </div>
      <section className="admin-card list-card" style={{marginTop:20}}><div className="list-heading"><h2>Lịch sắp tới</h2><span className="count-pill">{events.filter(x=>x.is_active).length} lịch đang hoạt động</span></div>
        {events.length===0 ? <div className="admin-empty">Chưa có lịch sinh hoạt.</div> : <div className="admin-product-list">{events.map(ev=><article className="admin-product" key={ev.id}><div className="admin-product-image"><CalendarDays size={23}/></div><div className="admin-product-info"><strong>{ev.title}</strong><span>{new Date(ev.starts_at).toLocaleString("vi-VN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Ho_Chi_Minh"})} · {ev.location || "Chưa nhập địa điểm"}</span><span className={ev.is_active?"status-active":"status-hidden"}>{ev.is_active?"Đang hoạt động":"Đã ngừng"}</span></div>{ev.is_active&&<button className="button button-outline button-small" onClick={()=>void deactivateEvent(ev)}>Ngừng lịch</button>}</article>)}</div>}
      </section>
      <section className="admin-card list-card" style={{marginTop:20}}><div className="list-heading"><h2>Danh sách thành viên</h2><span className="count-pill">{members.filter(x=>x.is_active).length} thành viên hoạt động</span></div>
        {members.length===0 ? <div className="admin-empty">Chưa có thành viên.</div> : <div className="admin-product-list">{members.map(m=><article className="admin-product" key={m.id}><div className="admin-product-image"><Users size={22}/></div><div className="admin-product-info"><strong>{m.full_name}</strong><span>{m.phone || "Chưa có điện thoại"} · {m.zalo_uid ? "Đã có UID" : "Chưa có UID Zalo"}</span><span className={m.consent_to_reminders&&m.is_active?"status-active":"status-hidden"}>{!m.is_active?"Đã ngừng":m.consent_to_reminders?"Đồng ý nhận nhắc lịch":"Chưa đồng ý nhận tin"}</span></div>{m.is_active&&<div className="admin-product-actions"><button className="button button-outline button-small" onClick={()=>void toggleConsent(m)}>{m.consent_to_reminders?"Tắt nhắc":"Bật nhắc"}</button><button className="button button-outline button-small" onClick={()=>void deactivateMember(m)}>Ngừng</button></div>}</article>)}</div>}
      </section>
      <section className="admin-card list-card" style={{marginTop:20}}><div className="list-heading"><h2>Lịch sử nhắc gần đây</h2><span className="count-pill">Tối đa 30 bản ghi</span></div>
        {logs.length===0 ? <div className="admin-empty">Chưa có bản ghi gửi. Khi tích hợp Zalo được bật, trạng thái gửi sẽ xuất hiện tại đây.</div> : <div className="admin-product-list">{logs.map(log=>{const ev=events.find(x=>x.id===log.event_id); const m=members.find(x=>x.id===log.member_id); return <article className="admin-product" key={log.id}><div className="admin-product-image"><BellRing size={21}/></div><div className="admin-product-info"><strong>{m?.full_name || "Thành viên đã xóa"} · {ev?.title || "Lịch đã xóa"}</strong><span>Nhắc trước {log.reminder_type === "24h" ? "24 giờ" : "2 giờ"} · {new Date(log.created_at).toLocaleString("vi-VN",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Ho_Chi_Minh"})}</span><span className={log.status === "sent" ? "status-active" : "status-hidden"}>{log.status === "sent" ? "Đã gửi" : log.status === "failed" ? `Gửi lỗi (${log.error_code || "không rõ"})` : "Đang xử lý"}{log.sent_at ? ` · lúc ${new Date(log.sent_at).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Ho_Chi_Minh"})}` : ""}</span></div></article>})}</div>}
      </section>
      <p className="admin-footnote">Nhắc lịch dự kiến gửi trước 24 giờ và 2 giờ. Hệ thống chỉ gửi khi thành viên đang hoạt động, đã đồng ý nhận tin, có UID hợp lệ, lịch còn phù hợp và Zalo đã được cấu hình đầy đủ. Mỗi loại nhắc chỉ gửi một lần cho mỗi thành viên/lịch.</p>
    </div>
  </div>;
}
