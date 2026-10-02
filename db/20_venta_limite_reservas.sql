-- ============================================================================
-- CIEHS · Más margen para las reservas el día de la venta (2026-10-02)
--
-- Aplicar de forma AISLADA en el SQL Editor de Supabase (proyecto
-- kumxtheybmqbfixatnok). NO usar `supabase db push` ni `apply_migration`: el
-- historial de migraciones es global en esta instancia compartida con Aura y
-- Safari (Sección 1.4 de las directrices). Solo toca el esquema `ciehs`.
-- Idempotente: se puede ejecutar dos veces sin problema.
--
-- POR QUÉ
-- db/09 puso un freno anti-inundación de 12 altas por minuto POR TABLA y
-- contando a TODO el mundo a la vez. Para comentarios va bien; para la venta
-- de lechuga no: si el enlace se comparte en el grupo de padres y 13 familias
-- reservan en el mismo minuto, la 13.ª recibe un error. La web ya reintenta
-- sola (assets/js/ciehs-venta.js), pero con un pico grande la espera se alarga.
--
-- QUÉ CAMBIA
-- Solo el umbral de `orders`: 60 por minuto. El resto de tablas sigue en 12.
-- El freno sigue existiendo (un robot no puede meter miles de pedidos) y la
-- administración sigue exenta.
-- ============================================================================

create or replace function ciehs.frenar_alta_masiva()
returns trigger
language plpgsql
security definer
set search_path = ciehs, pg_temp
as $$
declare
  max_por_minuto int := case when tg_table_name = 'orders' then 60 else 12 end;
  recientes int;
begin
  if ciehs.is_admin() then
    return new;
  end if;

  execute format(
    'select count(*) from ciehs.%I where created_at > now() - interval ''1 minute''',
    tg_table_name
  ) into recientes;

  if recientes >= max_por_minuto then
    raise exception 'Demasiadas solicitudes en poco tiempo. Espera un minuto y vuelve a intentarlo.';
  end if;

  return new;
end $$;

comment on function ciehs.frenar_alta_masiva is
  'Contramedida anti-inundacion (pentest 2026-09, A17). 12 altas/min por tabla en alta anonima; 60/min en orders desde 2026-10-02 (venta de lechuga); admin exento.';

-- Comprobación (debe mostrar «60 … orders» en el cuerpo de la función):
-- select prosrc from pg_proc where proname = 'frenar_alta_masiva' and pronamespace = 'ciehs'::regnamespace;
