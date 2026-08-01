-- ============================================================================
-- ALITAS FOGOSAS — PEDIDOS AL PANEL DE EMPLEADOS
-- ----------------------------------------------------------------------------
-- Pega esto completo en Supabase → SQL Editor → Run (después de schema.sql).
--
-- Antes el pedido sólo viajaba por WhatsApp. Ahora, además, cae en el panel
-- (#empleados) para que en cocina lo vean sin depender del celular de nadie.
--
-- Tres reglas de negocio viven aquí, no en el navegador, porque el cliente es
-- código que cualquiera puede editar desde la consola:
--
--   1. Máximo 300 pedidos al día (día natural de la Ciudad de México).
--   2. El pedido atendido se BORRA. El panel es una comanda, no un archivo.
--   3. Lo que nadie borró a mano se purga solo a las 12 horas.
--
-- El contador vive en su propia tabla (`order_counter`) justo porque los
-- pedidos se borran: contar renglones de `orders` haría que vaciar el panel
-- reiniciara el tope del día.
-- ============================================================================

-- ── Pedidos ─────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  day          date not null,
  daily_no     integer not null,          -- consecutivo del día (1…300)
  branch_slug  text not null,
  customer     text,
  mode         text not null default 'recoger',   -- 'recoger' | 'domicilio'
  payment      text,
  notes        text,
  items        jsonb not null default '[]'::jsonb,
  total        numeric(10,2) not null default 0,
  open_price   boolean not null default false,    -- total "desde"
  seen         boolean not null default false,
  seen_by      text,
  seen_at      timestamptz
);

create index if not exists orders_created_idx on public.orders (created_at desc);

-- ── Contador diario (sobrevive al borrado de pedidos) ───────────────────────
create table if not exists public.order_counter (
  day    date primary key,
  count  integer not null default 0
);

-- Tope diario en un solo lugar: cámbialo aquí y aplica a todo.
create or replace function public.orders_daily_limit()
returns integer language sql immutable as $$ select 300 $$;

/** Día natural en la zona del negocio (no en UTC: a las 6 pm de CDMX el UTC
    ya cambió de día y el corte caería a media tarde). */
create or replace function public.orders_today()
returns date language sql stable as $$
  select (now() at time zone 'America/Mexico_City')::date
$$;

-- ── Purga automática ────────────────────────────────────────────────────────
-- El panel es una comanda viva. Lo que nadie marcó como atendido se va solo a
-- las 12 h, para que nadie llegue en la mañana a una lista de ayer.
create or replace function public.purge_old_orders()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.orders where created_at < now() - interval '12 hours';
$$;

-- ── Alta de pedido ──────────────────────────────────────────────────────────
-- `security definer`: el visitante NO tiene permiso de insertar en `orders`.
-- Sólo puede pasar por aquí, y aquí se valida y se cuenta. Así el tope de 300
-- no se puede saltar desde la consola del navegador.
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Todas las variables van con prefijo `v_`. Sin él, `slug` choca con la
  -- columna `slug` de `branch_status` y Postgres tira
  -- "column reference is ambiguous" (42702) en CADA pedido.
  v_day    date := public.orders_today();
  v_limit  integer := public.orders_daily_limit();
  v_n      integer;
  v_items  jsonb;
  v_slug   text;
  v_id     uuid;
begin
  -- La sucursal tiene que existir de verdad.
  v_slug := nullif(trim(payload->>'branch_slug'), '');
  if v_slug is null or not exists (select 1 from public.branch_status b where b.slug = v_slug) then
    return jsonb_build_object('ok', false, 'reason', 'sucursal');
  end if;

  -- Un pedido sin renglones no es un pedido. El tope de 60 es el mismo del
  -- carrito del sitio; más que eso sólo puede venir manipulado.
  v_items := coalesce(payload->'items', '[]'::jsonb);
  if jsonb_typeof(v_items) <> 'array'
     or jsonb_array_length(v_items) = 0
     or jsonb_array_length(v_items) > 60 then
    return jsonb_build_object('ok', false, 'reason', 'items');
  end if;

  -- Cuenta y tope en una sola operación atómica: el `on conflict … do update`
  -- toma el candado del renglón del día, así que dos pedidos simultáneos no
  -- pueden llevarse el mismo folio ni colarse los dos en el lugar 300.
  insert into public.order_counter (day, count)
    values (v_day, 1)
  on conflict (day) do update
    set count = public.order_counter.count + 1
    where public.order_counter.count < v_limit
  returning public.order_counter.count into v_n;

  -- Sin renglón devuelto = el `where` no pasó = el día ya está lleno.
  if v_n is null then
    return jsonb_build_object('ok', false, 'reason', 'lleno', 'limit', v_limit);
  end if;

  insert into public.orders (
    day, daily_no, branch_slug, customer, mode, payment, notes, items, total, open_price
  ) values (
    v_day,
    v_n,
    v_slug,
    left(nullif(trim(payload->>'customer'), ''), 60),
    case when payload->>'mode' = 'domicilio' then 'domicilio' else 'recoger' end,
    left(nullif(trim(payload->>'payment'), ''), 40),
    left(nullif(trim(payload->>'notes'), ''), 400),
    v_items,
    least(greatest(coalesce((payload->>'total')::numeric, 0), 0), 99999),
    coalesce((payload->>'open_price')::boolean, false)
  )
  returning id into v_id;

  -- Barrido oportunista: sin cron de por medio, el propio flujo de pedidos
  -- mantiene la tabla corta.
  perform public.purge_old_orders();

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'daily_no', v_n,
    'remaining', v_limit - v_n,
    'limit', v_limit
  );
end;
$$;

-- Cuántos van hoy: lo consulta el sitio para avisar antes de que el cliente
-- arme un pedido que ya no se puede recibir.
create or replace function public.orders_today_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'used',      coalesce((select c.count from public.order_counter c where c.day = public.orders_today()), 0),
    'limit',     public.orders_daily_limit(),
    'remaining', greatest(public.orders_daily_limit()
                 - coalesce((select c.count from public.order_counter c where c.day = public.orders_today()), 0), 0)
  )
$$;

-- ── Seguridad ───────────────────────────────────────────────────────────────
alter table public.orders        enable row level security;
alter table public.order_counter enable row level security;

-- `orders` no tiene política para anónimos: ni leer ni insertar directo. Los
-- datos del cliente (nombre, dirección en las notas) sólo los ve el personal.
drop policy if exists "personal lee pedidos" on public.orders;
create policy "personal lee pedidos"
  on public.orders for select to authenticated using (true);

drop policy if exists "personal actualiza pedidos" on public.orders;
create policy "personal actualiza pedidos"
  on public.orders for update to authenticated using (true) with check (true);

-- Atendido = borrado. Es la regla del panel.
drop policy if exists "personal borra pedidos" on public.orders;
create policy "personal borra pedidos"
  on public.orders for delete to authenticated using (true);

-- El contador es un número sin datos personales: se puede leer, nunca escribir
-- (sólo lo mueve `place_order`, que corre como dueño).
drop policy if exists "contador visible" on public.order_counter;
create policy "contador visible"
  on public.order_counter for select using (true);

revoke all on function public.place_order(jsonb)   from public;
revoke all on function public.purge_old_orders()   from public;
grant execute on function public.place_order(jsonb)      to anon, authenticated;
grant execute on function public.orders_today_status()   to anon, authenticated;
grant execute on function public.purge_old_orders()      to authenticated;

-- ── Tiempo real ─────────────────────────────────────────────────────────────
-- Para que el pedido aparezca en el panel sin recargar, y desaparezca de las
-- demás pantallas cuando alguien lo marca como atendido.
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.order_counter;
exception when duplicate_object then null;
end $$;

-- El DELETE de realtime sólo trae la llave primaria si la réplica es completa.
alter table public.orders replica identity full;
