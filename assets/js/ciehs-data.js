/* ============================================================================
   CIEHS · capa de datos (Supabase)

   Aislamiento estricto: el cliente queda forzado al esquema dedicado "ciehs".
   Ninguna consulta de este portal puede alcanzar public, safary_kids ni ningun
   otro esquema de la instancia compartida.

   La clave publicable va en el codigo a proposito: es la clave anonima, esta
   pensada para viajar en el navegador y por si sola no da acceso a nada. Quien
   protege los datos es RLS: lectura solo de lo publicado y escritura solo para
   usuarios registrados en ciehs.admins.

   Mejora progresiva: si la base no responde, el portal sigue mostrando el
   contenido que ya trae el HTML. En un laboratorio escolar la conexion falla a
   menudo y la pagina nunca debe quedarse en blanco por eso.
   ========================================================================== */
(function (global) {
  'use strict';

  var SUPABASE_URL = 'https://kumxtheybmqbfixatnok.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bUmlZhlNSNuYlGE8QdvVmQ_FJbGWeUO';
  var SCHEMA = 'ciehs';

  var CIEHSData = {
    listo: false,
    conectado: false,
    motivo: null,
    cliente: null
  };

  if (!global.supabase || typeof global.supabase.createClient !== 'function') {
    CIEHSData.motivo = 'No se cargó el cliente de Supabase.';
    global.CIEHSData = CIEHSData;
    return;
  }

  var cliente = global.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    db: { schema: SCHEMA },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'ciehs-auth'
    },
    global: { headers: { 'x-client-info': 'ciehs-portal' } }
  });

  CIEHSData.cliente = cliente;
  CIEHSData.listo = true;

  /* --------------------------- lectura publica --------------------------- */

  function fallo(e) {
    // PGRST106 = el esquema no esta expuesto en la API. Es el unico error que
    // conviene distinguir, porque se resuelve con un ajuste de la plataforma y
    // no tocando ni el codigo ni la base.
    var msg = (e && (e.message || e.error_description)) || String(e);
    if (msg.indexOf('PGRST106') > -1 || msg.indexOf('Invalid schema') > -1) {
      return 'El esquema "' + SCHEMA + '" todavía no está expuesto en la API de Supabase.';
    }
    return msg;
  }

  // Columnas explicitas y nunca "*": los identificadores de auth de quien
  // edita o registra (site_config.updated_by, telemetry_readings.recorded_by)
  // estan vetados al rol anonimo, y pedir "*" haria fallar la consulta entera.
  var COLS_CONFIG = 'id, hero_title, hero_subtitle, kpi_cosecha_kg, kpi_ahorro_pct, aviso, aviso_active, updated_at';

  CIEHSData.cargarPortal = function () {
    return Promise.all([
      cliente.from('site_config').select(COLS_CONFIG).eq('id', 1).maybeSingle(),
      cliente.from('modules').select('*').order('position', { ascending: true }),
      cliente.from('qr_codes').select('*').order('slot', { ascending: true }),
      cliente.from('investigations').select('*').order('position', { ascending: true }),
      cliente.from('telemetry_readings')
             .select('module_id, measured_at, ph, ce, water_temp_c')
             .order('measured_at', { ascending: false })
             .limit(200)
    ]).then(function (r) {
      var err = r.find(function (x) { return x.error; });
      if (err) {
        CIEHSData.conectado = false;
        CIEHSData.motivo = fallo(err.error);
        return null;
      }
      CIEHSData.conectado = true;
      CIEHSData.motivo = null;
      return {
        config: r[0].data,
        modulos: r[1].data || [],
        qr: r[2].data || [],
        investigaciones: r[3].data || [],
        lecturas: r[4].data || []
      };
    }).catch(function (e) {
      CIEHSData.conectado = false;
      CIEHSData.motivo = fallo(e);
      return null;
    });
  };

  // Ultima lectura por modulo, a partir del historico ya ordenado por fecha.
  CIEHSData.ultimaLecturaPorModulo = function (lecturas) {
    var mapa = {};
    (lecturas || []).forEach(function (l) {
      if (!mapa[l.module_id]) mapa[l.module_id] = l;
    });
    return mapa;
  };

  CIEHSData.ultimaSincronizacion = function (datos) {
    if (!datos) return null;
    var fechas = [];
    if (datos.config && datos.config.updated_at) fechas.push(datos.config.updated_at);
    (datos.lecturas || []).forEach(function (l) { fechas.push(l.measured_at); });
    if (!fechas.length) return null;
    return fechas.map(function (f) { return new Date(f); })
                 .filter(function (d) { return !isNaN(d.getTime()); })
                 .sort(function (a, b) { return b - a; })[0] || null;
  };

  /* ------------------------------ sesion --------------------------------- */

  CIEHSData.sesion = function () {
    return cliente.auth.getSession().then(function (r) {
      return (r.data && r.data.session) || null;
    });
  };

  CIEHSData.entrar = function (email, password) {
    return cliente.auth.signInWithPassword({ email: email, password: password })
      .then(function (r) {
        if (r.error) throw r.error;
        // Tener sesion no basta: hay que estar registrado como admin del CIEHS.
        return CIEHSData.esAdmin().then(function (ok) {
          if (!ok) {
            return cliente.auth.signOut().then(function () {
              throw new Error('Esta cuenta no tiene permisos de administración del CIEHS.');
            });
          }
          return r.data.session;
        });
      });
  };

  CIEHSData.salir = function () { return cliente.auth.signOut(); };

  CIEHSData.esAdmin = function () {
    return cliente.rpc('is_admin').then(function (r) {
      if (r.error) return false;
      return r.data === true;
    }).catch(function () { return false; });
  };

  /* ------------------------------ escritura ------------------------------ */

  CIEHSData.guardarConfig = function (valores) {
    return cliente.from('site_config')
      .update({
        hero_title: valores.heroTitle || null,
        hero_subtitle: valores.heroSub || null,
        kpi_cosecha_kg: valores.kpiCosechaKg === '' ? null : valores.kpiCosechaKg,
        kpi_ahorro_pct: valores.kpiAhorroPct === '' ? null : valores.kpiAhorroPct,
        aviso: valores.aviso || null,
        aviso_active: !!valores.avisoActive
      })
      .eq('id', 1)
      .select()
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  };

  CIEHSData.registrarLectura = function (lectura) {
    return cliente.from('telemetry_readings')
      .insert({
        module_id: lectura.moduleId,
        measured_at: lectura.measuredAt || new Date().toISOString(),
        ph: lectura.ph === '' ? null : lectura.ph,
        ce: lectura.ce === '' ? null : lectura.ce,
        notes: lectura.notes || null
      })
      .select()
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  };

  global.CIEHSData = CIEHSData;
})(window);
