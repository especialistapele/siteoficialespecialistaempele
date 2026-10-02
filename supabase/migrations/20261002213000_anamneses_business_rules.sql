-- Regras de negócio e storage das anamneses
-- 2026-10-02

create or replace function public.release_anamnesis(
  p_patient_id uuid,
  p_anamnesis_type_id uuid,
  p_expires_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_uid uuid := auth.uid();
  v_version integer;
  v_version_id uuid;
begin
  if v_uid is null or not public.is_admin() then raise exception 'Apenas administradores podem liberar anamneses'; end if;
  if p_patient_id is null or p_anamnesis_type_id is null then raise exception 'Paciente e tipo são obrigatórios'; end if;
  select coalesce(max(version_number),0)+1 into v_version
  from anamnesis_versions where patient_id=p_patient_id and anamnesis_type_id=p_anamnesis_type_id;
  insert into anamnesis_versions(patient_id,anamnesis_type_id,version_number,status,released_at)
  values(p_patient_id,p_anamnesis_type_id,v_version,'draft',now()) returning id into v_version_id;
  insert into anamnesis_releases(patient_id,anamnesis_type_id,target_version,released_by,expires_at,status)
  values(p_patient_id,p_anamnesis_type_id,v_version,v_uid,p_expires_at,'released');
  insert into announcements(patient_id,title,message)
  values(p_patient_id,'Nova anamnese disponível','Uma nova ficha de anamnese foi liberada para você. Acesse seu painel para preencher.');
  return jsonb_build_object('success',true,'version_id',v_version_id,'version_number',v_version);
end; $$;

revoke all on function public.release_anamnesis(uuid,uuid,timestamptz) from public;
grant execute on function public.release_anamnesis(uuid,uuid,timestamptz) to authenticated;

create or replace function public.grant_anamnesis_edit(p_version_id uuid,p_expires_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_uid uuid := auth.uid();
  v_patient_id uuid;
  v_id uuid;
begin
  if v_uid is null or not public.is_admin() then raise exception 'Apenas administradores podem autorizar edição'; end if;
  select patient_id into v_patient_id from anamnesis_versions where id=p_version_id;
  if v_patient_id is null then raise exception 'Ficha não encontrada'; end if;
  update anamnesis_edit_permissions set status='used',used_at=now()
  where anamnesis_version_id=p_version_id and status='active';
  insert into anamnesis_edit_permissions(anamnesis_version_id,patient_id,granted_by,expires_at,status)
  values(p_version_id,v_patient_id,v_uid,p_expires_at,'active') returning id into v_id;
  return jsonb_build_object('success',true,'permission_id',v_id);
end; $$;

revoke all on function public.grant_anamnesis_edit(uuid,timestamptz) from public;
grant execute on function public.grant_anamnesis_edit(uuid,timestamptz) to authenticated;

create or replace function public.submit_anamnesis(
  p_version_id uuid,
  p_responses jsonb,
  p_signature_path text,
  p_user_agent text default null
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_uid uuid := auth.uid();
  v_patient_id uuid;
  v_type_id uuid;
  v_status text;
  v_edit_id uuid;
  v_missing integer;
  v_invalid integer;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if p_version_id is null or jsonb_typeof(coalesce(p_responses,'[]'::jsonb)) <> 'array'
    then raise exception 'Dados da anamnese inválidos'; end if;

  select av.patient_id,av.anamnesis_type_id,av.status
    into v_patient_id,v_type_id,v_status
  from anamnesis_versions av
  join patients p on p.id=av.patient_id
  where av.id=p_version_id and p.user_id=v_uid;

  if v_patient_id is null then raise exception 'Ficha não encontrada'; end if;
  if v_status not in ('draft','submitted','locked')
    then raise exception 'Esta ficha não pode ser enviada neste estado'; end if;

  if v_status <> 'draft' then
    select id into v_edit_id
    from anamnesis_edit_permissions
    where anamnesis_version_id=p_version_id
      and patient_id=v_patient_id
      and status='active'
      and (expires_at is null or expires_at>now())
    order by granted_at desc limit 1;
    if v_edit_id is null then raise exception 'Esta ficha está bloqueada para edição'; end if;
  end if;

  select count(*) into v_invalid
  from jsonb_array_elements(p_responses) r
  left join question_definitions qd on qd.id=(r->>'question_definition_id')::uuid
  left join anamnesis_questions aq
    on aq.question_definition_id=qd.id
   and aq.anamnesis_type_id=v_type_id
   and aq.active
  where qd.id is null or aq.id is null;
  if v_invalid>0 then raise exception 'A ficha contém respostas inválidas'; end if;

  select count(*) into v_missing
  from anamnesis_questions aq
  join question_definitions qd on qd.id=aq.question_definition_id
  where aq.anamnesis_type_id=v_type_id
    and aq.active and aq.required
    and not exists (
      select 1 from jsonb_array_elements(p_responses) r
      where (r->>'question_definition_id')::uuid=qd.id
        and r->'value' is not null
        and r->'value' <> '""'::jsonb
        and r->'value' <> '[]'::jsonb
    );
  if v_missing>0 then raise exception 'Existem campos obrigatórios não preenchidos'; end if;

  insert into anamnesis_responses(
    anamnesis_version_id,question_definition_id,clinical_concept_id,value,source
  )
  select p_version_id,(r->>'question_definition_id')::uuid,
         nullif(r->>'clinical_concept_id','')::uuid,r->'value',
         coalesce(r->>'source','anamnese')
  from jsonb_array_elements(p_responses) r;

  update patient_clinical_data pcd
     set is_current=false,valid_to=now()
   where pcd.patient_id=v_patient_id
     and pcd.is_current=true
     and pcd.clinical_concept_id in (
       select distinct (r->>'clinical_concept_id')::uuid
       from jsonb_array_elements(p_responses) r
       where nullif(r->>'clinical_concept_id','') is not null
     );

  insert into patient_clinical_data(
    patient_id,clinical_concept_id,value,source_anamnesis_response_id,valid_from,is_current
  )
  select v_patient_id,rp.clinical_concept_id,rp.value,rp.id,now(),true
  from anamnesis_responses rp
  where rp.anamnesis_version_id=p_version_id
    and rp.clinical_concept_id is not null;

  if p_signature_path is null or length(trim(p_signature_path))<3
    then raise exception 'Assinatura obrigatória'; end if;

  insert into anamnesis_signatures(
    anamnesis_version_id,patient_id,signature_image_path,signed_at,signed_user_agent
  )
  values(p_version_id,v_patient_id,p_signature_path,now(),p_user_agent);

  update anamnesis_versions
     set status='locked',
         submitted_at=coalesce(submitted_at,now()),
         locked_at=now()
   where id=p_version_id;

  if v_edit_id is not null then
    update anamnesis_edit_permissions
       set status='used',used_at=now()
     where id=v_edit_id;
  end if;

  return jsonb_build_object('success',true,'version_id',p_version_id,'status','locked');
end; $$;

revoke all on function public.submit_anamnesis(uuid,jsonb,text,text) from public;
grant execute on function public.submit_anamnesis(uuid,jsonb,text,text) to authenticated;

drop policy if exists documentos_paciente_envia_anamnese on storage.objects;
create policy documentos_paciente_envia_anamnese on storage.objects
for insert to public
with check (
  bucket_id='documentos-pacientes'
  and (storage.foldername(name))[1] in (
    select patients.id::text from public.patients where patients.user_id=auth.uid()
  )
  and (storage.foldername(name))[2]='anamneses'
);

drop policy if exists documentos_paciente_le_anamnese on storage.objects;
create policy documentos_paciente_le_anamnese on storage.objects
for select to public
using (
  bucket_id='documentos-pacientes'
  and (
    (storage.foldername(name))[1] in (
      select patients.id::text from public.patients where patients.user_id=auth.uid()
    )
    or public.is_admin()
  )
);

create index if not exists idx_anamnesis_questions_type_active_position
  on public.anamnesis_questions(anamnesis_type_id,active,position);
create index if not exists idx_anamnesis_responses_question
  on public.anamnesis_responses(question_definition_id);
create index if not exists idx_patient_clinical_data_patient_current
  on public.patient_clinical_data(patient_id,is_current);
create index if not exists idx_edit_permissions_version_status
  on public.anamnesis_edit_permissions(anamnesis_version_id,status);
create index if not exists idx_releases_patient_type
  on public.anamnesis_releases(patient_id,anamnesis_type_id,status);
create index if not exists idx_attachments_version
  on public.anamnesis_attachments(anamnesis_version_id);
