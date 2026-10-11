-- Impede que um paciente associe ao próprio contrato/anamnese a assinatura
-- armazenada na pasta de outro paciente. A validação no cliente não é suficiente:
-- as RPCs SECURITY DEFINER aceitam o caminho enviado pelo navegador.
--
-- Antes de criar os constraints, a auditoria read-only encontrou 7 assinaturas
-- em contracts e 2 em anamnesis_signatures; todas já seguem o formato esperado.
-- Esta migration é proposta e NÃO foi aplicada ao Supabase de produção.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contracts_signature_path_own_patient_check'
      AND conrelid = 'public.contracts'::regclass
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_signature_path_own_patient_check
      CHECK (
        signature_image_path IS NULL
        OR signature_image_path ~ (
          '^' || patient_id::text || '/assinaturas/[A-Za-z0-9_-]+[.]png$'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'anamnesis_signatures_signature_path_own_patient_check'
      AND conrelid = 'public.anamnesis_signatures'::regclass
  ) THEN
    ALTER TABLE public.anamnesis_signatures
      ADD CONSTRAINT anamnesis_signatures_signature_path_own_patient_check
      CHECK (
        signature_image_path IS NULL
        OR signature_image_path ~ (
          '^' || patient_id::text || '/assinaturas/[A-Za-z0-9_-]+[.]png$'
        )
      );
  END IF;
END
$$;

-- Snapshot HTML é enviado pelo navegador ao assinar; limite no banco impede
-- payloads arbitrariamente grandes mesmo quando o cliente é contornado.
-- A auditoria encontrou 8 contratos; snapshot máximo atual: 7.400 caracteres.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contracts_signed_content_html_size_check'
      AND conrelid = 'public.contracts'::regclass
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_signed_content_html_size_check
      CHECK (signed_content_html IS NULL OR length(signed_content_html) <= 100000);
  END IF;
END
$$;
