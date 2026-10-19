-- Enquadramento independente das fotos Antes e Depois dos resultados.
-- Valores em percentual (0-100) para object-position. Registros antigos ficam centralizados.
alter table public.results
  add column if not exists before_image_position_x integer not null default 50
    check (before_image_position_x between 0 and 100),
  add column if not exists before_image_position_y integer not null default 50
    check (before_image_position_y between 0 and 100),
  add column if not exists after_image_position_x integer not null default 50
    check (after_image_position_x between 0 and 100),
  add column if not exists after_image_position_y integer not null default 50
    check (after_image_position_y between 0 and 100);
