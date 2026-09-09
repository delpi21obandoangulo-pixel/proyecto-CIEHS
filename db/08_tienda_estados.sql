-- ============================================================================
-- CIEHS · Tienda: estado "proximo a cosecha" y destino canonico (2026-09-09)
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`.
-- Complementa a 07_tienda.sql.
-- ============================================================================

-- 1) Estado nuevo. "Proximo a cosecha" es el mas util de los cuatro para una
--    familia: no dice si hay, dice CUANDO habra, que es la pregunta real.
alter table ciehs.productos drop constraint if exists prod_estado_valido;
alter table ciehs.productos add constraint prod_estado_valido
  check (estado in ('disponible','proximo_a_cosecha','en_crecimiento','agotado'));

comment on column ciehs.productos.estado is
  'disponible | proximo_a_cosecha | en_crecimiento | agotado. Se conserva "agotado" aunque no estuviera en la lista pedida: en un huerto escolar el lote SE ACABA, y sin ese estado habria que borrar el producto y volver a crearlo cada temporada.';

-- 2) Destino canonico del gasto. La transparencia agrupaba por `concept`, que
--    es texto libre: "solucion nutritiva", "Solucion Nutritiva" y "nutrientes"
--    producian tres porciones distintas del mismo gasto. Con una categoria
--    cerrada el reparto publicado significa siempre lo mismo.
alter table ciehs.transparency_entries add column if not exists categoria text;
do $$ begin
  alter table ciehs.transparency_entries add constraint caja_categoria_valida
    check (categoria is null or categoria in ('nutrientes','semillas','modulos','investigacion','otros'));
exception when duplicate_object then null; end $$;

comment on column ciehs.transparency_entries.categoria is
  'A donde va el dinero: nutrientes | semillas | modulos (mantenimiento DWC) | investigacion (materiales de los equipos) | otros. Los egresos anteriores a esta columna quedan sin clasificar y se agrupan como "Otros destinos".';

-- Nota sobre los PRECIOS: quedan a null a proposito. Los que habia eran
-- inventados durante el desarrollo, y publicar un precio inventado en un sitio
-- donde una familia va a pagar es peor que no publicar ninguno. Los fija el
-- coordinador desde el panel; mientras tanto el carrito suma unidades y el
-- equipo de Ventas confirma el importe al confirmar la entrega.
