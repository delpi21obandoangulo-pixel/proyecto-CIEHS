-- ============================================================================
-- CIEHS · Índices de cobertura para claves foráneas (2026-09-10)
--
-- Sale de la pasada de `get_advisors` (performance) del 2026-09-10. Postgres no
-- indexa automáticamente el lado hijo de una clave foránea: sin índice, cada
-- borrado o actualización de la fila padre obliga a un recorrido secuencial de
-- la tabla hija para comprobar la integridad referencial.
--
-- Hoy las tablas son pequeñas y no se nota. Se añaden ahora porque el coste de
-- crearlos es cero y el de descubrirlo con datos reales, no.
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`: el historial
-- supabase_migrations.schema_migrations es global en esta instancia compartida
-- y escribirlo contaminaria a Aura y a Safari. Se aplica de forma aislada.
--
-- AISLAMIENTO: todo vive en el esquema `ciehs`. No toca public ni safary_kids.
-- ============================================================================

-- Línea de pedido → producto. Es la que más importa de las tres: se recorre al
-- listar el detalle de un pedido y al retirar un producto del catálogo.
create index if not exists pedido_lineas_producto_idx
  on ciehs.pedido_lineas (producto_id);

-- Autoría de la portada y de las lecturas de telemetría. Apuntan a auth.users,
-- se consultan poco, y el índice es igualmente barato.
create index if not exists site_config_updated_by_idx
  on ciehs.site_config (updated_by);

create index if not exists telemetry_readings_recorded_by_idx
  on ciehs.telemetry_readings (recorded_by);

-- ----------------------------------------------------------------------------
-- Lo que los advisors marcan y NO se toca, con el motivo:
--
--  · `orders_estado_idx`, `registros_campo_modulo_fecha` y `aportes_kind_fecha`
--    aparecen como "unused index". Lo son porque todavía no hay datos, no
--    porque sobren. Borrarlos sería optimizar contra una tabla vacía.
--
--  · "multiple permissive policies" en casi todas las tablas: cada una tiene
--    una política de administración (ALL, vía is_admin()) y otra de lectura o
--    alta pública. Fundirlas en una sola exigiría reescribir las diecisiete y
--    el beneficio, a esta escala, es indistinguible de cero.
-- ----------------------------------------------------------------------------
