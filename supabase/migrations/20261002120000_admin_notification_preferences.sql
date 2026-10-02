-- Preferências dos alertas do painel administrativo.
-- Os quatro alertas começam ativos e podem ser desabilitados individualmente.

alter table public.configuracoes
  add column if not exists notificacoes_leads boolean not null default true,
  add column if not exists notificacoes_agenda boolean not null default true,
  add column if not exists notificacoes_artigos boolean not null default true,
  add column if not exists notificacoes_resultados boolean not null default true,
  add column if not exists notificacoes_conteudo_horario text not null default '09:00';

comment on column public.configuracoes.notificacoes_leads is 'Alerta no painel quando houver novo pré-atendimento.';
comment on column public.configuracoes.notificacoes_agenda is 'Alerta no painel para o próximo atendimento agendado.';
comment on column public.configuracoes.notificacoes_artigos is 'Lembrete semanal para publicação de artigo.';
comment on column public.configuracoes.notificacoes_resultados is 'Lembrete semanal para publicação de resultado.';
