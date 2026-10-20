import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { getZaloAccessToken } from "@/lib/zalo-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClubEvent = { id: string; title: string; starts_at: string; location: string | null; is_active: boolean };
type ClubMember = { id: string; full_name: string; zalo_uid: string | null; consent_to_reminders: boolean; is_active: boolean };

function localDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")}`;
}
function localTime(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = process.env.ZALO_TEMPLATE_ID;
  if (!templateId || !process.env.ZALO_APP_ID || !process.env.ZALO_APP_SECRET || !process.env.ZALO_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.json({
      ok: true,
      sending: false,
      reason: "Zalo integration is disabled until an official OA credentials and approved template ID are configured.",
    });
  }

  let supabase;
  try { supabase = createServiceClient(); }
  catch { return NextResponse.json({ error: "Server configuration is incomplete" }, { status: 500 }); }

  let accessToken: string;
  try { accessToken = await getZaloAccessToken(); }
  catch { return NextResponse.json({ error: "Zalo authentication is not configured or token refresh failed; no messages were sent" }, { status: 503 }); }

  const now = Date.now();
  const windows = [
    { kind: "24h", start: new Date(now + 24 * 60 * 60 * 1000), end: new Date(now + 24 * 60 * 60 * 1000 + 15 * 60 * 1000) },
    { kind: "2h", start: new Date(now + 2 * 60 * 60 * 1000), end: new Date(now + 2 * 60 * 60 * 1000 + 15 * 60 * 1000) },
  ];
  let considered = 0, sent = 0, failed = 0, skipped = 0;

  for (const window of windows) {
    const { data: events, error: eventsError } = await supabase.from("club_events")
      .select("id,title,starts_at,location,is_active")
      .eq("is_active", true).gte("starts_at", window.start.toISOString()).lt("starts_at", window.end.toISOString());
    if (eventsError) return NextResponse.json({ error: "Could not load event schedule" }, { status: 500 });

    for (const event of (events ?? []) as ClubEvent[]) {
      const { data: members, error: membersError } = await supabase.from("club_members")
        .select("id,full_name,zalo_uid,consent_to_reminders,is_active")
        .eq("is_active", true).eq("consent_to_reminders", true).not("zalo_uid", "is", null);
      if (membersError) return NextResponse.json({ error: "Could not load eligible members" }, { status: 500 });

      for (const member of (members ?? []) as ClubMember[]) {
        if (!member.zalo_uid?.trim()) { skipped++; continue; }
        considered++;
        // Unique (event, member, reminder_type) prevents duplicate sends across cron retries.
        const { data: log, error: insertError } = await supabase.from("reminder_logs").insert({
          event_id: event.id, member_id: member.id, reminder_type: window.kind, status: "processing",
        }).select("id").maybeSingle();
        if (insertError?.code === "23505") { skipped++; continue; }
        if (insertError || !log) { failed++; continue; }

        const starts = new Date(event.starts_at);
        // These keys must exactly match the fields in the template approved in Zalo's console.
        const templateData = {
          event_name: event.title,
          event_date: localDateParts(starts),
          event_time: localTime(starts),
          event_location: event.location || "Vui lòng liên hệ câu lạc bộ để biết địa điểm",
        };
        try {
          const response = await fetch("https://openapi.zalo.me/v3.0/oa/message/template", {
            method: "POST",
            headers: { "Content-Type": "application/json", access_token: accessToken },
            body: JSON.stringify({ user_id: member.zalo_uid, template_id: templateId, template_data: templateData }),
            cache: "no-store",
          });
          const payload = await response.json().catch(() => ({})) as { error?: number; message?: string; data?: { message_id?: string } };
          if (response.ok && payload.error === 0) {
            await supabase.from("reminder_logs").update({ status: "sent", provider_message_id: payload.data?.message_id ?? null, sent_at: new Date().toISOString(), error_code: null }).eq("id", log.id);
            sent++;
          } else {
            // Avoid storing the full provider response, which could contain personal information.
            await supabase.from("reminder_logs").update({ status: "failed", error_code: String(payload.error ?? response.status).slice(0, 80) }).eq("id", log.id);
            failed++;
          }
        } catch {
          await supabase.from("reminder_logs").update({ status: "failed", error_code: "NETWORK_ERROR" }).eq("id", log.id);
          failed++;
        }
      }
    }
  }
  return NextResponse.json({ ok: true, sending: true, considered, sent, failed, skipped });
}
