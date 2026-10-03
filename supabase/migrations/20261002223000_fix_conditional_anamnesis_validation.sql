-- Fix conditional required validation for anamneses.
-- Hidden conditional questions are not required unless their condition is satisfied.

create or replace function public.submit_anamnesis(
  p_version_id uuid,
  p_responses jsonb,
  p_signature_path text,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid:=auth.uid(); v_patient_id uuid; v_type_id uuid; v_status text;
  v_edit_id uuid; v_target_version_id uuid:=p_version_id; v_version integer;
  v_missing integer; v_invalid integer;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if p_version_id is null or jsonb_typeof(coalesce(p_responses,'[]'::jsonb)) <> 'array' then raise exception 'Dados da anamnese inválidos'; end if;

  select av.patient_id,av.anamnesis_type_id,av.status into v_patient_id,v_type_id,v_status
  from anamnesis_versions av join patients p on p.id=av.patient_id
  where av.id=p_version_id and p.user_id=v_uid;

  if v_patient_id is null then raise exception 'Ficha não encontrada'; end if;
  if v_status not in ('draft','submitted','locked') then raise exception 'Esta ficha não pode ser enviada neste estado'; end if;

  if v_status <> 'draft' then
    select id into v_edit_id from anamnesis_edit_permissions
    where anamnesis_version_id=p_version_id and patient_id=v_patient_id and status='active'
      and (expires_at is null or expires_at>now()) order by granted_at desc limit 1;
    if v_edit_id is null then raise exception 'Esta ficha está bloqueada para edição'; end if;

    select coalesce(max(version_number),0)+1 into v_version from anamnesis_versions
    where patient_id=v_patient_id and anamnesis_type_id=v_type_id;

    insert into anamnesis_versions(patient_id,anamnesis_type_id,version_number,status,released_at)
    values(v_patient_id,v_type_id,v_version,'draft',now()) returning id into v_target_version_id;
  end if;

  select count(*) into v_invalid
  from jsonb_array_elements(p_responses) r
  left join question_definitions qd on qd.id=(r->>'question_definition_id')::uuid
  left join anamnesis_questions aq on aq.question_definition_id=qd.id and aq.anamnesis_type_id=v_type_id and aq.active
  where qd.id is null or aq.id is null;
  if v_invalid>0 then raise exception 'A ficha contém respostas inválidas'; end if;

  select count(*) into v_missing
  from anamnesis_questions aq join question_definitions qd on qd.id=aq.question_definition_id
  where aq.anamnesis_type_id=v_type_id and aq.active and aq.required
    and (
      aq.conditional_rule is null
      or exists (
        select 1 from jsonb_array_elements(p_responses) dep
        where (dep->>'question_definition_id')::uuid = (aq.conditional_rule->>'question_definition_id')::uuid
          and case aq.conditional_rule->>'operator'
            when 'contains' then coalesce(dep->'value','[]'::jsonb) @> jsonb_build_array(aq.conditional_rule->>'value')
            else dep->>'value' = aq.conditional_rule->>'value'
          end
      )
    )
    and not exists (
      select 1 from jsonb_array_elements(p_responses) r
      where (r->>'question_definition_id')::uuid=qd.id
        and r->'value' is not null and r->'value' <> '""'::jsonb and r->'value' <> '[]'::jsonb
    );

  if v_missing>0 then raise exception 'Existem campos obrigatórios não preenchidos'; end if;

  insert into anamnesis_responses(anamnesis_version_id,question_definition_id,clinical_concept_id,value,source)
  select v_target_version_id,(r->>'question_definition_id')::uuid,nullif(r->>'clinical_concept_id','')::uuid,
         r->'value',coalesce(r->>'source','anamnese')
  from jsonb_array_elements(p_responses) r;

  update patient_clinical_data pcd set is_current=false,valid_to=now()
  where pcd.patient_id=v_patient_id and pcd.is_current=true
    and pcd.clinical_concept_id in (
      select distinct (r->>'clinical_concept_id')::uuid from jsonb_array_elements(p_responses) r
      where nullif(r->>'clinical_concept_id','') is not null
    );

  insert into patient_clinical_data(patient_id,clinical_concept_id,value,source_anamnesis_response_id,valid_from,is_current)
  select v_patient_id,rp.clinical_concept_id,rp.value,rp.id,now(),true
  from anamnesis_responses rp where rp.anamnesis_version_id=v_target_version_id and rp.clinical_concept_id is not null;

  if p_signature_path is null or length(trim(p_signature_path))<3 then raise exception 'Assinatura obrigatória'; end if;

  insert into anamnesis_signatures(anamnesis_version_id,patient_id,signature_image_path,signed_at,signed_user_agent)
  values(v_target_version_id,v_patient_id,p_signature_path,now(),p_user_agent);

  update anamnesis_versions set status='locked',submitted_at=now(),locked_at=now() where id=v_target_version_id;
  if v_edit_id is not null then update anamnesis_edit_permissions set status='used',used_at=now() where id=v_edit_id; end if;

  return jsonb_build_object('success',true,'version_id',v_target_version_id,'previous_version_id',p_version_id,'status','locked');
end;
$$;
