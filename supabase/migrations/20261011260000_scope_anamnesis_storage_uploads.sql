-- Restringe upload de arquivos de anamnese a versões do próprio paciente
-- que estejam liberadas e editáveis. Sem isso, a policy de Storage só verificava
-- o primeiro diretório e permitia uploads órfãos em versões bloqueadas.
-- Migration proposta na branch; não aplicada ao Supabase de produção.
ALTER POLICY "documentos_paciente_envia_anamnese"
  ON storage.objects
  TO authenticated
  WITH CHECK (
    bucket_id = 'documentos-pacientes'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM public.patients AS p
      WHERE p.user_id = (SELECT auth.uid())
    )
    AND (storage.foldername(name))[2] = 'anamneses'
    AND EXISTS (
      SELECT 1
      FROM public.anamnesis_versions AS v
      JOIN public.patients AS p ON p.id = v.patient_id
      WHERE p.user_id = (SELECT auth.uid())
        AND p.id::text = (storage.foldername(name))[1]
        AND v.id::text = (storage.foldername(name))[3]
        AND v.released_at IS NOT NULL
        AND (
          v.status = 'draft'
          OR EXISTS (
            SELECT 1
            FROM public.anamnesis_edit_permissions AS ep
            WHERE ep.anamnesis_version_id = v.id
              AND ep.patient_id = p.id
              AND ep.status = 'active'
              AND (ep.expires_at IS NULL OR ep.expires_at > now())
          )
        )
    )
  );
