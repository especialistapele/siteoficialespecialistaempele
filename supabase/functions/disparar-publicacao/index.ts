// ============================================================
// disparar-publicacao
//
// Registra a solicitação no Supabase e dispara o workflow do GitHub.
// O painel usa o request_id retornado para acompanhar a publicação.
//
// Secrets necessários:
//   GH_DISPATCH_TOKEN
//   GH_REPO
// Opcionais:
//   GH_WORKFLOW (padrão atualizar-sitemap.yml)
//   GH_REF (padrão main)
// ============================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const out = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return out({ ok: false, error: "Não autenticado." }, 401);

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u, error: ue } = await userClient.auth.getUser();
    if (ue || !u?.user) return out({ ok: false, error: "Sessão inválida." }, 401);

    const { data: p, error: pe } = await userClient.from("profiles").select("role").eq("id", u.user.id).single();
    if (pe || p?.role !== "admin") return out({ ok: false, error: "Apenas administradores." }, 403);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch (_) {}

    const path = typeof body.path === "string" ? body.path : null;
    const contentId = typeof body.content_id === "string" ? body.content_id : null;
    const publicado = typeof body.publicado === "boolean" ? body.publicado : null;
    const requestedAt = new Date().toISOString();

    const { data: requestRow, error: requestError } = await userClient
      .from("publication_requests")
      .insert({
        requested_by: u.user.id,
        path,
        content_id: contentId,
        publicado,
        status: "requested",
        requested_at: requestedAt,
      })
      .select("request_id")
      .single();

    if (requestError || !requestRow?.request_id) {
      return out({ ok: false, error: "Não foi possível registrar a solicitação de publicação." }, 200);
    }

    const requestId = requestRow.request_id;
    const token = Deno.env.get("GH_DISPATCH_TOKEN");
    const repo = Deno.env.get("GH_REPO");

    if (!token || !repo) {
      await userClient.from("publication_requests").update({
        status: "error",
        error_message: "GH_DISPATCH_TOKEN/GH_REPO não configurados.",
        updated_at: new Date().toISOString(),
      }).eq("request_id", requestId);
      return out({ ok: false, error: "GH_DISPATCH_TOKEN/GH_REPO não configurados.", request_id: requestId }, 200);
    }

    const workflow = Deno.env.get("GH_WORKFLOW") || "atualizar-sitemap.yml";
    const ref = Deno.env.get("GH_REF") || "main";
    const resp = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "especialista-em-pele-painel",
      },
      body: JSON.stringify({
        ref,
        inputs: {
          request_id: requestId,
          requested_at: requestedAt,
          path: path || "",
          content_id: contentId || "",
          publicado: publicado === null ? "" : String(publicado),
        },
      }),
    });

    if (resp.status !== 204) {
      await userClient.from("publication_requests").update({
        status: "error",
        error_message: `GitHub respondeu ${resp.status}`,
        updated_at: new Date().toISOString(),
      }).eq("request_id", requestId);
      return out({ ok: false, error: `GitHub respondeu ${resp.status}`, request_id: requestId }, 200);
    }

    await userClient.from("publication_requests").update({
      status: "dispatched",
      dispatched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("request_id", requestId);

    return out({ ok: true, request_id: requestId });
  } catch (e) {
    return out({ ok: false, error: String(e) }, 200);
  }
});
