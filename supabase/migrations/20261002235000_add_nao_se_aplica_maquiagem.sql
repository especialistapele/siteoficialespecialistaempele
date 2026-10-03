-- Add a neutral option for patients for whom makeup removal is not applicable.
update public.question_definitions
set options = '["Sim","Não","Às vezes","Não se aplica"]'::jsonb
where code = 'FACIAL_RETIRA_MAQUIAGEM'
  and label = 'Sempre retira a maquiagem antes de dormir?'
  and field_type = 'radio'
  and options = '["Sim","Não","Às vezes"]'::jsonb;
