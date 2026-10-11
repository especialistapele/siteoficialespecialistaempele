-- Evita anexar arquivos diretamente a versões bloqueadas/submetidas sem
-- permissão ativa de edição e restaura o INSERT administrativo que o painel usa.
-- Migration proposta na branch; não aplicada em produção.
DROP POLICY IF EXISTS "anamnesis_attachments_patient_insert" ON public.anamnesis_attachments;
DROP POLICY IF EXISTS "patient uploads own attachments" ON public.anamnesis_attachments;

CREATE POLICY "patient uploads attachments to editable version"
  ON public.anamnesis_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.anamnesis_versions AS v
      JOIN public.patients AS pt ON pt.id = v.patient_id
      WHERE v.id = anamnesis_attachments.anamnesis_version_id
        AND v.patient_id = anamnesis_attachments.patient_id
        AND pt.user_id = (SELECT auth.uid())
        AND (
          v.status = 'draft'
          OR EXISTS (
            SELECT 1
            FROM public.anamnesis_edit_permissions AS ep
            WHERE ep.anamnesis_version_id = v.id
              AND ep.patient_id = pt.id
              AND ep.status = 'active'
              AND (ep.expires_at IS NULL OR ep.expires_at > now())
          )
        )
    )
  );

CREATE POLICY "admin uploads anamnesis attachments"
  ON public.anamnesis_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.anamnesis_versions AS v
      WHERE v.id = anamnesis_attachments.anamnesis_version_id
        AND v.patient_id = anamnesis_attachments.patient_id
    )
  );
