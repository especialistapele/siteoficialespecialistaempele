// ============================================================
// reconciliar-publicacao
//
// Confirma no Supabase o resultado real de solicitações que já
// foram enviadas ao GitHub, usando o manifesto público como fonte
// do estado efetivamente publicado.
//
// Uso:
//   { "request_id": "..." }  -> reconcilia uma solicitação
//   {}                       -> reconcilia solicitações recentes
// ============================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.117.3";

const MANIFEST_URLS = [
  "https://dannyqueiroz.com.br/publicacao-manifest.json",
  "https://www.especialistaempele.com.br/publicacao-manifest.json",
  "https://raw.githubusercontent.com/especialistapele/siteoficialespecialistaempele/main/publicacao-manifest.json",
];

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const out = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const normalizarPath = (value: unknown) => String(value ?? "").replace(/^\/+/, "").trim();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return out({ ok: false, error: "Não autenticado." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return out({ ok: false, error: "Sessão inválida." }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", userData.user.id).single();
    if (profileError || profile?.role !== "admin") return out({ ok: false, error: "Apenas administradores." }, 403);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch (_) {}
    const requestId = typeof body.request_id === "string" ? body.request_id : null;

    let query = supabase
      .from("publication_requests")
      .select("request_id,path,content_id,publicado,status,requested_at,dispatched_at,confirmed_at,updated_at,error_message")
      .in("status", ["requested", "dispatched", "timeout"])
      .order("requested_at", { ascending: false })
      .limit(requestId ? 1 : 20);
    if (requestId) query = query.eq("request_id", requestId);

    const { data: requests, error: requestsError } = await query;
    if (requestsError) return out({ ok: false, error: requestsError.message });
    if (!requests?.length) return out({ ok: true, reconciled: 0, requests: [] });

    let manifest: any = null;
    let manifestUrl = "";
    const manifestErrors: string[] = [];

    for (const url of MANIFEST_URLS) {
      try {
        const response = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
        if (!response.ok) {
          manifestErrors.push(url + " -> HTTP " + response.status);
          continue;
        }
        const candidate = await response.json();
        if (Array.isArray(candidate?.items)) {
          manifest = candidate;
          manifestUrl = url;
          break;
        }
        manifestErrors.push(url + " -> manifesto sem items");
      } catch (error) {
        manifestErrors.push(url + " -> " + String(error));
      }
    }

    if (!manifest) return out({ ok: false, error: "Não foi possível carregar o manifesto.", manifest_errors: manifestErrors, reconciled: 0 });

    const results = [];
    for (const request of requests) {
      const requestPath = normalizarPath(request.path);
      const item = manifest.items.find((entry: any) => normalizarPath(entry?.path) === requestPath);
      const httpStatus = Number(item?.http_status ?? 200);
      const targetReached = request.publicado === true
        ? Boolean(item && item.status === "published" && httpStatus >= 200 && httpStatus < 400)
        : request.publicado === false ? !item : false;

      if (targetReached) {
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from("publication_requests")
          .update({ status: "confirmed", confirmed_at: request.confirmed_at || now, updated_at: now, error_message: null })
          .eq("request_id", request.request_id);

        results.push({
          request_id: request.request_id,
          previous_status: request.status,
          status: updateError ? request.status : "confirmed",
          reconciled: !updateError,
          error: updateError?.message || null,
          manifest_url: manifestUrl,
        });
      } else {
        results.push({
          request_id: request.request_id,
          previous_status: request.status,
          status: request.status,
          reconciled: false,
          manifest_url: manifestUrl,
          page_found: Boolean(item),
          page_status: item?.status ?? null,
          http_status: item?.http_status ?? null,
        });
      }
    }

    return out({ ok: true, reconciled: results.filter((r) => r.reconciled).length, manifest_url: manifestUrl, requests: results });
  } catch (error) {
    return out({ ok: false, error: String(error) });
  }
});