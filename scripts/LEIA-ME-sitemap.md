# Sitemap automático — como ativar

O sitemap (`sitemap.xml`) agora é gerado automaticamente pelo GitHub Actions,
todos os dias às 6h (horário de Brasília), buscando direto no Supabase quais
artigos e tratamentos estão publicados. Também roda manualmente quando você
quiser, e sempre que você fizer um push para a branch `main`.

## Passo único de configuração (leva 2 minutos)

1. No seu repositório do GitHub, vá em **Settings → Secrets and variables →
   Actions**.
2. Clique em **New repository secret** e crie duas secrets:
   - `SUPABASE_URL` → `https://clwaotfbqwvxpykruwed.supabase.co`
   - `SUPABASE_ANON_KEY` → a mesma chave anon pública que já está em
     `assets/js/supabase-client.js` (é segura para expor — é protegida por
     Row Level Security e já fica visível no código do site mesmo).
3. Pronto. Na aba **Actions** do repositório, você verá o workflow
   "Atualizar sitemap.xml" — pode clicar em **Run workflow** pra testar
   agora mesmo, sem esperar o horário agendado.

## O que ele faz

- Busca em `articles` e `treatments` só os itens com `published = true`.
- Gera as URLs de cada um (`/blog/artigos/?slug=...` e
  `/tratamentos/detalhe.html?slug=...`), junto com as páginas fixas do site.
- Se algo mudou desde a última vez, commita o `sitemap.xml` atualizado
  direto no repositório. Se nada mudou, não faz commit nenhum (não gera
  histórico de commits vazios).

## Se quiser rodar na sua máquina para testar

```bash
SUPABASE_URL=https://clwaotfbqwvxpykruwed.supabase.co \
SUPABASE_ANON_KEY=<a chave anon> \
node scripts/gerar-sitemap.mjs
```
