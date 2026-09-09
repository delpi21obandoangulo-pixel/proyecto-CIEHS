-- ============================================================================
-- CIEHS · Tienda: catalogo y pedidos con lineas (2026-09-09)
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`.
--
-- Se apoya en la tabla `orders` que ya existia (vacia) en vez de crear un
-- segundo sistema de pedidos en paralelo. orders queda como cabecera; crop y
-- qty_kg siguen ahi por compatibilidad y se dejan nulos en los pedidos con
-- lineas, porque duplicar el detalle crearia dos verdades que pueden discrepar.
-- ============================================================================

create table if not exists ciehs.productos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  cientifico    text,
  descripcion   text,
  unidad        text not null default 'unidad',
  precio_pen    numeric(8,2),
  -- Estado real del cultivo, no un "hay/no hay": lo que hace util la tienda de
  -- un huerto escolar es decir CUANDO habra, porque la lechuga no se fabrica.
  estado        text not null default 'en_crecimiento',
  disponible_desde date,
  stock_estimado smallint,
  foto_path     text,
  position      smallint not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),

  constraint prod_estado_valido check (estado in ('disponible','en_crecimiento','agotado')),
  constraint prod_nombre_corto  check (char_length(nombre) between 2 and 80),
  constraint prod_desc_corta    check (descripcion is null or char_length(descripcion) <= 400),
  constraint prod_precio_pos    check (precio_pen is null or (precio_pen >= 0 and precio_pen <= 999)),
  constraint prod_stock_pos     check (stock_estimado is null or (stock_estimado >= 0 and stock_estimado <= 9999))
);

comment on table ciehs.productos is
  'Catalogo de lo que cultiva el CIEHS. estado y disponible_desde importan mas que el stock: en un huerto escolar la pregunta del vecino no es "hay?" sino "cuando habra?".';

create index if not exists productos_orden on ciehs.productos (position, nombre);

alter table ciehs.productos enable row level security;
drop policy if exists "productos_lectura_publica" on ciehs.productos;
create policy "productos_lectura_publica" on ciehs.productos for select using (published);
drop policy if exists "productos_admin_todo" on ciehs.productos;
create policy "productos_admin_todo" on ciehs.productos for all to authenticated
  using (ciehs.is_admin()) with check (ciehs.is_admin());
grant select on ciehs.productos to anon, authenticated;
grant insert, update, delete on ciehs.productos to authenticated;

create table if not exists ciehs.pedido_lineas (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references ciehs.orders(id) on delete cascade,
  producto_id  uuid references ciehs.productos(id) on delete set null,
  -- Nombre y precio COPIADOS, no referenciados: si manana sube el precio o se
  -- renombra el producto, el pedido ya hecho debe seguir diciendo lo que la
  -- familia acepto.
  nombre       text not null,
  unidad       text,
  precio_pen   numeric(8,2),
  cantidad     smallint not null,
  created_at   timestamptz not null default now(),

  constraint linea_cantidad_pos check (cantidad > 0 and cantidad <= 999),
  constraint linea_precio_pos   check (precio_pen is null or precio_pen >= 0)
);

create index if not exists pedido_lineas_pedido on ciehs.pedido_lineas (order_id);

alter table ciehs.pedido_lineas enable row level security;

-- Alta publica: la familia reserva sin cuenta. NO hay politica de lectura
-- publica — un pedido lleva nombre y contacto de una persona, y dejarlo legible
-- convertiria la tienda en un listado de datos personales.
drop policy if exists "lineas_alta_publica" on ciehs.pedido_lineas;
create policy "lineas_alta_publica" on ciehs.pedido_lineas for insert to anon, authenticated
  with check (true);
drop policy if exists "lineas_admin_todo" on ciehs.pedido_lineas;
create policy "lineas_admin_todo" on ciehs.pedido_lineas for all to authenticated
  using (ciehs.is_admin()) with check (ciehs.is_admin());
grant insert on ciehs.pedido_lineas to anon, authenticated;
grant select, update, delete on ciehs.pedido_lineas to authenticated;

-- ----------------------------------------------------------------------------
-- DOS TRAMPAS COMPROBADAS EN VIVO, anotadas porque volveran a morder:
--
-- 1. La politica de alta de `orders` exige status = 'pendiente'. Cualquier otro
--    valor hace fallar la insercion entera con un mensaje de RLS.
--
-- 2. NO encadenar .select() al insert de `orders`. Esa tabla no tiene politica
--    de lectura publica a proposito, asi que el RETURNING falla con
--    "new row violates row-level security policy", que parece un problema de
--    escritura sin serlo. El cliente genera el uuid del pedido y no pide nada
--    de vuelta; ademas eso hace la operacion reintentable.
-- ----------------------------------------------------------------------------
