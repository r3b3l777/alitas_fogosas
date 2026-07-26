-- ============================================================================
-- ALITAS FOGOSAS — estado de sucursales ("mucha demanda")
-- ----------------------------------------------------------------------------
-- Pega esto completo en Supabase → SQL Editor → Run.
--
-- Idea: cada sucursal tiene una bandera `high_demand`. Cuando el personal la
-- enciende, el sitio deja de empujar el pedido por WhatsApp para esa sucursal
-- y manda al cliente a Uber Eats.
--
-- Lectura: pública (cualquier visitante necesita ver el estado).
-- Escritura: sólo usuarios autenticados (el personal).
-- ============================================================================

create table if not exists public.branch_status (
  slug        text primary key,
  name        text not null,
  high_demand boolean not null default false,
  note        text,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- Las 3 sucursales. Los `slug` deben coincidir con src/data.js.
insert into public.branch_status (slug, name) values
  ('buenavista', 'Sucursal Buenavista'),
  ('lerma',      'Sucursal Av. Lerma'),
  ('sauces',     'Sucursal Sauces Metepec')
on conflict (slug) do nothing;

-- `updated_at` siempre al día, sin depender del cliente.
create or replace function public.touch_branch_status()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists branch_status_touch on public.branch_status;
create trigger branch_status_touch
  before update on public.branch_status
  for each row execute function public.touch_branch_status();

-- ── Seguridad ───────────────────────────────────────────────────────────────
alter table public.branch_status enable row level security;

drop policy if exists "estado visible para todos" on public.branch_status;
create policy "estado visible para todos"
  on public.branch_status
  for select
  using (true);

-- Sólo el personal con sesión puede cambiar la bandera. Nadie puede crear ni
-- borrar sucursales desde el cliente: eso se hace aquí, en el SQL editor.
drop policy if exists "solo personal actualiza" on public.branch_status;
create policy "solo personal actualiza"
  on public.branch_status
  for update
  to authenticated
  using (true)
  with check (true);

-- ── Tiempo real ─────────────────────────────────────────────────────────────
-- Para que el cambio le aparezca al instante a quien ya tenga el sitio abierto.
alter publication supabase_realtime add table public.branch_status;

-- ============================================================================
-- USUARIOS DEL PERSONAL
-- ----------------------------------------------------------------------------
-- No se crean por SQL. Ve a Authentication → Users → "Add user", crea uno por
-- empleado con correo y contraseña, y desactiva el registro público en
-- Authentication → Providers → Email → "Enable sign ups" = OFF.
-- Así nadie puede crearse una cuenta y encender el modo demanda.
-- ============================================================================
