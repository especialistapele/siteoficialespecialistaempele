-- Corrige políticas administrativas ainda destinadas a PUBLIC após a revogação
-- de EXECUTE em is_admin() para anon. O papel PUBLIC inclui anon, então uma
-- consulta anônima podia falhar com "permission denied for function is_admin"
-- mesmo quando outra política permitia a leitura pública publicada.
--
-- Mantém políticas públicas específicas (ex.: leitura de conteúdo publicado e
-- INSERT do formulário) inalteradas. Nenhuma política de paciente é removida.
-- A execução em produção exige revisão e teste prévio de todos os fluxos.
DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles @> ARRAY['public']::name[]
      AND policyname = ANY (ARRAY[
        'admin_full_access_announcements',
        'admin_full_access_appointments',
        'admin_gerencia_configuracoes',
        'admin_read_content_ids',
        'admin_full_access_contracts',
        'admin_reads_consents',
        'admin_full_access_financial_transactions',
        'admin_full_access_medical_records',
        'admin_full_access_patients',
        'admin_full_access_photo_records',
        'admin_gerencia_pre_atendimentos',
        'admin_full_access_profiles',
        'admin_insert_publication_requests',
        'admin_read_publication_requests',
        'admin_update_publication_requests',
        'admin_full_access_documents',
        'support_documents_admin_all',
        'admin_full_access_testimonials'
      ]::name[])
      AND (
        coalesce(qual, '') ILIKE '%is_admin()%'
        OR coalesce(with_check, '') ILIKE '%is_admin()%'
      )
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END
$$;

-- Verificação pós-migração sugerida:
-- SELECT tablename, policyname, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname = ANY (ARRAY[
--     'admin_full_access_announcements',
--     'admin_full_access_appointments',
--     'admin_gerencia_configuracoes',
--     'admin_read_content_ids',
--     'admin_full_access_contracts',
--     'admin_reads_consents',
--     'admin_full_access_financial_transactions',
--     'admin_full_access_medical_records',
--     'admin_full_access_patients',
--     'admin_full_access_photo_records',
--     'admin_gerencia_pre_atendimentos',
--     'admin_full_access_profiles',
--     'admin_insert_publication_requests',
--     'admin_read_publication_requests',
--     'admin_update_publication_requests',
--     'admin_full_access_documents',
--     'support_documents_admin_all',
--     'admin_full_access_testimonials'
--   ]::name[])
-- ORDER BY tablename, policyname;
