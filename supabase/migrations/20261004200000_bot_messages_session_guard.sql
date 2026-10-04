-- Vincula cada mensagem à mesma sessão que abriu a conversa.
-- Migration incremental para instalações onde as tabelas já existem.

alter table public.bot_messages
  add column if not exists session_id uuid;

update public.bot_messages m
set session_id = c.session_id
from public.bot_conversations c
where c.id = m.conversation_id
  and m.session_id is null;

alter table public.bot_messages
  alter column session_id set not null;

drop policy if exists "Bot can create messages" on public.bot_messages;
create policy "Bot can create messages" on public.bot_messages
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.bot_conversations c
    where c.id = conversation_id
      and c.session_id = bot_messages.session_id
  )
);
