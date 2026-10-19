-- Preferências de enquadramento para as capas dos tratamentos.
-- Valores percentuais compatíveis com CSS object-position (0 a 100).
-- Migração aditiva: preserva as imagens e os registros existentes.
alter table public.treatments
  add column if not exists cover_position_x numeric(5,2) not null default 50
  check (cover_position_x >= 0 and cover_position_x <= 100);

alter table public.treatments
  add column if not exists cover_position_y numeric(5,2) not null default 50
  check (cover_position_y >= 0 and cover_position_y <= 100);
