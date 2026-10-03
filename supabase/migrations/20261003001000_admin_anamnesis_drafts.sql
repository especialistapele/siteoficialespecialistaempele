create or replace function public.protect_anamnesis_history()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_version_status text;
begin
  if tg_table_name = 'anamnesis_responses' and auth.uid() is not null and public.is_admin() then
    select status into v_version_status
    from public.anamnesis_versions
    where id = coalesce(old.anamnesis_version_id, new.anamnesis_version_id);
    if v_version_status = 'draft' then
      return coalesce(new, old);
    end if;
  end if;
  raise exception 'Registro histórico imutável: %', tg_table_name;
end;
$function$;

create or replace function public.save_anamnesis_draft(
  p_version_id uuid,
  p_responses jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := auth.uid();
  v_patient_id uuid;
  v_type_id uuid;
  v_item jsonb;
begin
  if v_uid is null or not public.is_admin() then
    raise exception 'Apenas administradores podem salvar rascunhos de anamneses';
  end if;

  select patient_id, anamnesis_type_id
    into v_patient_id, v_type_id
  from public.anamnesis_versions
  where id = p_version_id and status = 'draft';

  if v_patient_id is null then
    raise exception 'Apenas versões em rascunho podem ser preenchidas pelo administrador';
  end if;

  if jsonb_typeof(coalesce(p_responses, '[]'::jsonb)) <> 'array' then
    raise exception 'As respostas devem ser um array JSON';
  end if;

  delete from public.anamnesis_responses
  where anamnesis_version_id = p_version_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_responses, '[]'::jsonb))
  loop
    if nullif(v_item->>'question_definition_id','') is null then
      raise exception 'Resposta sem question_definition_id';
    end if;

    if not exists (
      select 1
      from public.anamnesis_questions aq
      where aq.anamnesis_type_id = v_type_id
        and aq.question_definition_id = (v_item->>'question_definition_id')::uuid
        and aq.active = true
    ) then
      raise exception 'Pergunta inválida para este tipo de anamnese';
    end if;

    insert into public.anamnesis_responses(
      anamnesis_version_id,
      question_definition_id,
      clinical_concept_id,
      value,
      source
    )
    values (
      p_version_id,
      (v_item->>'question_definition_id')::uuid,
      nullif(v_item->>'clinical_concept_id','')::uuid,
      coalesce(v_item->'value','null'::jsonb),
      'admin_preenchimento'
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'version_id', p_version_id,
    'patient_id', v_patient_id,
    'saved_at', now()
  );
end;
$function$;

revoke execute on function public.save_anamnesis_draft(uuid,jsonb) from public, anon;
grant execute on function public.save_anamnesis_draft(uuid,jsonb) to authenticated;