import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
  if (req.method === "OPTIONS") return new Response("ok", {headers: cors});
  const out = (body: unknown, status=200) => new Response(JSON.stringify(body), {status, headers:{...cors,"Content-Type":"application/json"}});
  try {
    const authHeader=req.headers.get("Authorization");
    if(!authHeader) return out({error:"Não autenticado."},401);
    const url=Deno.env.get("SUPABASE_URL")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
    const {data:u,error:ue}=await userClient.auth.getUser();
    if(ue||!u?.user) return out({error:"Sessão inválida."},401);
    const {data:p,error:pe}=await userClient.from("profiles").select("role").eq("id",u.user.id).single();
    if(pe||p?.role!=="admin") return out({error:"Apenas administradores podem cadastrar pacientes."},403);
    const b=await req.json();
    const admin=createClient(url,service);

    // ------------------------------------------------------------------
    // modo "cadastro": cria SOMENTE o registro do paciente (sem login).
    // Usado pela conversão Cliente -> Paciente. O acesso é gerado depois,
    // separadamente, com modo "acesso".
    // ------------------------------------------------------------------
    if (b.modo === "cadastro") {
      const full_name=String(b.full_name||"").trim();
      const email=String(b.email||"").trim().toLowerCase();
      const phone=String(b.phone||"").trim();
      const pre_atendimento_id=b.pre_atendimento_id?String(b.pre_atendimento_id):null;
      if(!full_name||!email) return out({error:"Nome e e-mail são obrigatórios."},400);

      const {data:existente}=await admin.from("patients").select("id").eq("email",email).maybeSingle();
      if(existente) return out({error:"Já existe um paciente cadastrado com este e-mail."},409);

      const {data:novo,error:insErro}=await admin.from("patients")
        .insert({full_name,email,phone:phone||null,status:"ativo",acesso_painel:false,pre_atendimento_id})
        .select("id").single();
      if(insErro||!novo) return out({error:insErro?.message||"Não foi possível criar o cadastro do paciente."},500);
      return out({success:true,id:novo.id});
    }

    // ------------------------------------------------------------------
    // modo "acesso": gera o login de um paciente que já existe (criado via
    // modo "cadastro" ou já convertido anteriormente), sem duplicar cadastro.
    // ------------------------------------------------------------------
    if (b.modo === "acesso") {
      const patient_id=String(b.patient_id||"");
      if(!patient_id) return out({error:"Paciente não informado."},400);

      const {data:paciente,error:findErro}=await admin.from("patients").select("id,full_name,email,phone,user_id").eq("id",patient_id).single();
      if(findErro||!paciente) return out({error:"Paciente não encontrado."},404);
      if(paciente.user_id) return out({error:"Este paciente já tem acesso ao painel."},409);
      if(!paciente.email) return out({error:"Este paciente não tem e-mail cadastrado."},400);

      const senha=String(b.senha_temporaria||crypto.randomUUID().replace(/-/g,"").slice(0,10));
      const {data:n,error:ce}=await admin.auth.admin.createUser({email:paciente.email,password:senha,email_confirm:true,user_metadata:{full_name:paciente.full_name}});
      if(ce||!n?.user) return out({error:ce?.message||"Erro ao criar usuário."},400);
      const id=n.user.id;

      // A partir daqui, qualquer falha desfaz o que já foi feito, para não
      // deixar um usuário de auth órfão (sem perfil/vínculo) que travaria
      // uma nova tentativa por causa do e-mail já existir em auth.users.
      const {error:pro}=await admin.from("profiles").insert({id,role:"paciente",full_name:paciente.full_name,phone:paciente.phone||null});
      if(pro) {
        await admin.auth.admin.deleteUser(id).catch(()=>{});
        return out({error:"Não foi possível criar o perfil do paciente. A operação foi desfeita automaticamente — tente novamente."},500);
      }

      const {error:upd}=await admin.from("patients").update({user_id:id,acesso_painel:true}).eq("id",patient_id);
      if(upd) {
        await admin.from("profiles").delete().eq("id",id).catch(()=>{});
        await admin.auth.admin.deleteUser(id).catch(()=>{});
        return out({error:"Não foi possível vincular o acesso ao paciente. A operação foi desfeita automaticamente — tente novamente."},500);
      }

      return out({success:true,id:patient_id,email:paciente.email,senha_temporaria:senha});
    }

    // ------------------------------------------------------------------
    // modo "editar": atualiza dados cadastrais do paciente (nome, e-mail,
    // telefone) e, opcionalmente, redefine a senha do login já existente.
    // Se o e-mail mudar e o paciente já tiver login, o e-mail de acesso
    // (auth.users) é sincronizado junto — não só o campo de contato.
    // ------------------------------------------------------------------
    if (b.modo === "editar") {
      const patient_id=String(b.patient_id||"");
      if(!patient_id) return out({error:"Paciente não informado."},400);

      const {data:paciente,error:findErro}=await admin.from("patients").select("id,email,user_id").eq("id",patient_id).single();
      if(findErro||!paciente) return out({error:"Paciente não encontrado."},404);

      const atualizacoes:Record<string,unknown>={};
      if(typeof b.full_name==="string"){
        const full_name=b.full_name.trim();
        if(!full_name) return out({error:"O nome não pode ficar vazio."},400);
        atualizacoes.full_name=full_name;
      }
      if(typeof b.phone==="string") atualizacoes.phone=b.phone.trim()||null;

      if(typeof b.email==="string"){
        const novoEmail=b.email.trim().toLowerCase();
        if(!novoEmail) return out({error:"O e-mail não pode ficar vazio."},400);
        if(novoEmail!==paciente.email){
          const {data:existente}=await admin.from("patients").select("id").eq("email",novoEmail).neq("id",patient_id).maybeSingle();
          if(existente) return out({error:"Já existe outro paciente cadastrado com este e-mail."},409);
          atualizacoes.email=novoEmail;
        }
      }

      const novaSenha=typeof b.nova_senha==="string"&&b.nova_senha.trim()?b.nova_senha.trim():null;
      if(novaSenha&&!paciente.user_id) return out({error:"Este paciente ainda não tem acesso ao painel gerado — não há login para redefinir a senha."},400);

      if(paciente.user_id&&(atualizacoes.email||novaSenha)){
        const dadosAuth:Record<string,unknown>={};
        if(atualizacoes.email) { dadosAuth.email=atualizacoes.email; dadosAuth.email_confirm=true; }
        if(novaSenha) dadosAuth.password=novaSenha;
        const {error:erroAuth}=await admin.auth.admin.updateUserById(paciente.user_id,dadosAuth);
        if(erroAuth) return out({error:erroAuth.message||"Não foi possível atualizar o login do paciente."},400);
      }

      if(Object.keys(atualizacoes).length){
        const {error:erroUpd}=await admin.from("patients").update(atualizacoes).eq("id",patient_id);
        if(erroUpd) return out({error:erroUpd.message||"Não foi possível salvar as alterações do cadastro."},500);
      }

      return out({success:true});
    }

    // ------------------------------------------------------------------
    // modo "excluir": remove definitivamente o paciente. Apaga primeiro
    // os registros relacionados (agendamentos, financeiro, documentos,
    // fotos, avisos e pré-atendimento vinculado), depois o cadastro do
    // paciente e, se houver login, o perfil e o usuário de autenticação.
    // Cada etapa é "best effort": se uma tabela não existir ou já estiver
    // vazia, o erro é ignorado para não travar a exclusão.
    // ------------------------------------------------------------------
    if (b.modo === "excluir") {
      const patient_id=String(b.patient_id||"");
      if(!patient_id) return out({error:"Paciente não informado."},400);

      const {data:paciente,error:findErro}=await admin.from("patients").select("id,user_id").eq("id",patient_id).single();
      if(findErro||!paciente) return out({error:"Paciente não encontrado."},404);

      const tabelasRelacionadas=[
        "photo_records",
        "support_documents",
        "financial_transactions",
        "appointment_payment_history",
        "appointments",
        "announcements",
      ];
      for(const tabela of tabelasRelacionadas){
        await admin.from(tabela).delete().eq("patient_id",patient_id).catch(()=>{});
      }

      const {error:erroExcluir}=await admin.from("patients").delete().eq("id",patient_id);
      if(erroExcluir) return out({error:erroExcluir.message||"Não foi possível excluir o paciente."},500);

      if(paciente.user_id){
        await admin.from("profiles").delete().eq("id",paciente.user_id).catch(()=>{});
        await admin.auth.admin.deleteUser(paciente.user_id).catch(()=>{});
      }

      return out({success:true});
    }

    // ------------------------------------------------------------------
    // Comportamento padrão (sem "modo"): cadastro completo com login
    // imediato — usado pelo botão "+ Novo paciente". Mantido exatamente
    // como antes, para não quebrar essa funcionalidade já existente.
    // ------------------------------------------------------------------
    const full_name=String(b.full_name||"").trim();
    const email=String(b.email||"").trim().toLowerCase();
    const phone=String(b.phone||"").trim();
    const acesso_painel=b.acesso_painel!==false;
    const pre_atendimento_id=b.pre_atendimento_id?String(b.pre_atendimento_id):null;
    const senha=String(b.senha_temporaria||crypto.randomUUID().replace(/-/g,"").slice(0,10));
    if(!full_name||!email) return out({error:"Nome e e-mail são obrigatórios."},400);
    const {data:n,error:ce}=await admin.auth.admin.createUser({email,password:senha,email_confirm:true,user_metadata:{full_name}});
    if(ce||!n?.user) return out({error:ce?.message||"Erro ao criar usuário."},400);
    const id=n.user.id;
    // A partir daqui, qualquer falha desfaz o usuário criado, para não
    // deixar um cadastro pela metade (usuário sem perfil/paciente).
    const {error:pro}=await admin.from("profiles").insert({id,role:"paciente",full_name,phone:phone||null});
    if(pro) {
      await admin.auth.admin.deleteUser(id).catch(()=>{});
      return out({error:"Não foi possível criar o perfil do paciente. A operação foi desfeita automaticamente — tente novamente."},500);
    }
    const {error:pat}=await admin.from("patients").insert({id,user_id:id,full_name,email,phone:phone||null,status:"ativo",acesso_painel,pre_atendimento_id});
    if(pat) {
      await admin.from("profiles").delete().eq("id",id).catch(()=>{});
      await admin.auth.admin.deleteUser(id).catch(()=>{});
      return out({error:"Não foi possível criar o cadastro do paciente. A operação foi desfeita automaticamente — tente novamente."},500);
    }
    return out({success:true,id,email,acesso_painel,...(acesso_painel?{senha_temporaria:senha}:{})});
  } catch(e) { console.error(e); return out({error:"Erro interno ao criar paciente."},500); }
});
