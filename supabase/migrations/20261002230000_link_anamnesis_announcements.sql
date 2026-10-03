-- Link each anamnesis announcement to the exact released version.
alter table public.announcements add column if not exists anamnesis_version_id uuid references public.anamnesis_versions(id) on delete set null;
create index if not exists idx_announcements_anamnesis_version on public.announcements(anamnesis_version_id);

create or replace function public.release_anamnesis(p_patient_id uuid,p_anamnesis_type_id uuid,p_expires_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_version integer; v_version_id uuid;
begin
 if v_uid is null or not public.is_admin() then raise exception 'Apenas administradores podem liberar anamneses'; end if;
 if p_patient_id is null or p_anamnesis_type_id is null then raise exception 'Paciente e tipo são obrigatórios'; end if;
 select coalesce(max(version_number),0)+1 into v_version from anamnesis_versions where patient_id=p_patient_id and anamnesis_type_id=p_anamnesis_type_id;
 insert into anamnesis_versions(patient_id,anamnesis_type_id,version_number,status,released_at)
 values(p_patient_id,p_anamnesis_type_id,v_version,'draft',now()) returning id into v_version_id;
 insert into anamnesis_releases(patient_id,anamnesis_type_id,target_version,released_by,expires_at,status)
 values(p_patient_id,p_anamnesis_type_id,v_version,v_uid,p_expires_at,'released');
 insert into announcements(patient_id,title,message,anamnesis_version_id)
 values(p_patient_id,'Nova anamnese disponível','Uma nova ficha de anamnese foi liberada para você. Acesse seu painel para preencher.',v_version_id);
 return jsonb_build_object('success',true,'version_id',v_version_id,'version_number',v_version);
end; $$;