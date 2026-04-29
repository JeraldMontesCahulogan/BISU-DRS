import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return new Response("Missing auth", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userId = body?.userId;
    if (!userId) return new Response("Missing userId", { status: 400 });

    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !serviceKey)
      return new Response("Server misconfig", { status: 500 });

    const admin = createClient(url, serviceKey);

    const { data: caller } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    const callerId = caller?.user?.id;
    if (!callerId) return new Response("Bad token", { status: 401 });

    const { data: callerRow, error: callerErr } = await admin
      .from("profiles")
      .select("usertype_id")
      .eq("user_id", callerId)
      .maybeSingle();

    if (callerErr) return new Response(callerErr.message, { status: 400 });
    if (Number(callerRow?.usertype_id) !== 1)
      return new Response("Forbidden", { status: 403 });

    await admin.auth.admin.deleteUser(userId);

    await admin.from("profiles").delete().eq("user_id", userId);
    await admin.from("pending_deletions").delete().eq("user_id", userId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
