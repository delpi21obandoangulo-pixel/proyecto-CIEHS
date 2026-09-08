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
      storageKey: 'ciehs-auth',
      // sessionStorage y no localStorage: los equipos del laboratorio son
      // compartidos. Asi la sesion de administracion muere al cerrar la pestaña
      // en lugar de quedar disponible para quien se siente despues.
      storage: (function () {
        try {
          var p = '__ciehs_probe__';
          global.sessionStorage.setItem(p, '1');
          global.sessionStorage.removeItem(p);
          return global.sessionStorage;
        } catch (e) {
          return undefined;   // navegador sin almacenamiento: sesion solo en memoria
        }
      })()
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

  var COLS_NOTA    = 'id, code, title, summary, body, kind, team, author_label, media_url, ' +
                     'published_on, position, published, updated_at';
  var COLS_LOTE    = 'id, lote, crop, scientific, module_code, sown_on, week, ph, ce, phase, ' +
                     'harvest_on, harvest_kg, notes, position, published, updated_at';
  var COLS_RECURSO = 'id, title, description, level, area, kind, file_url, file_kind, duration, ' +
                     'featured, position, published, updated_at';
  var COLS_CAJA    = 'id, occurred_on, period, concept, kind, amount_pen, note, published';
  // Los pedidos llevan nombre y contacto de familias: no hay politica de lectura
  // publica sobre esa tabla y estas columnas solo llegan con sesion de admin.
  var COLS_PEDIDO  = 'id, requester_name, contact, crop, qty_kg, notes, status, created_at';

  CIEHSData.cargarPortal = function () {
    return Promise.all([
      cliente.from('site_config').select(COLS_CONFIG).eq('id', 1).maybeSingle(),
      cliente.from('modules').select('*').order('position', { ascending: true }),
      cliente.from('qr_codes').select('*').order('slot', { ascending: true }),
      cliente.from('investigations')
             .select('code, title, question, hypothesis, var_independent, var_dependent, var_control, method, status, tags, position, updated_at')
             .order('position', { ascending: true }),
      cliente.from('telemetry_readings')
             .select('module_id, measured_at, ph, ce, water_temp_c')
             .order('measured_at', { ascending: false })
             .limit(200),
      // Secciones nuevas de 2026. Van en la misma tanda que el resto para que
      // el portal se pinte de una sola vez y no encadene esperas.
      cliente.from('field_notes').select(COLS_NOTA).order('position', { ascending: true }),
      cliente.from('crop_log').select(COLS_LOTE).order('position', { ascending: true }),
      cliente.from('resources').select(COLS_RECURSO).order('position', { ascending: true }),
      cliente.from('community_comments')
             .select('id, display_name, role, message, reply, created_at')
             .order('created_at', { ascending: false })
             .limit(60),
      cliente.from('transparency_entries')
             .select(COLS_CAJA)
             .order('occurred_on', { ascending: false })
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
        lecturas: r[4].data || [],
        carpeta: r[5].data || [],
        bitacora: r[6].data || [],
        recursos: r[7].data || [],
        comentarios: r[8].data || [],
        caja: r[9].data || []
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
      .select(COLS_CONFIG)
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
        // recorded_by lo pone el servidor con auth.uid(): el cliente no tiene
        // permiso para escribir esa columna y no debe intentarlo.
      })
      .select('id, module_id, measured_at, ph, ce, water_temp_c, notes')
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  };

  /* ------------------------- investigaciones ----------------------------- */

  var COLS_INV = 'id, code, title, question, hypothesis, var_independent, var_dependent, ' +
                 'var_control, method, status, tags, position, published, updated_at';

  // El panel necesita ver TAMBIEN los borradores. No hace falta politica nueva:
  // la de escritura de administradores es FOR ALL, y eso incluye SELECT, asi que
  // se combina con la de lectura publica y un admin ve todas las filas.
  CIEHSData.listarInvestigaciones = function () {
    return cliente.from('investigations')
      .select(COLS_INV)
      .order('position', { ascending: true })
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data || [];
      });
  };

  CIEHSData.guardarInvestigacion = function (inv) {
    var fila = {
      code: inv.code,
      title: inv.title,
      question: inv.question || null,
      hypothesis: inv.hypothesis || null,
      var_independent: inv.varInd || null,
      var_dependent: inv.varDep || null,
      var_control: inv.varCon || null,
      method: inv.method || null,
      status: inv.status || 'en curso',
      tags: inv.tags || [],
      position: inv.position === '' || inv.position == null ? 0 : Number(inv.position),
      published: !!inv.published
    };
    // upsert sobre "code", que es la clave unica visible del proyecto: asi crear
    // y editar recorren el mismo camino y no hay dos rutas que mantener.
    return cliente.from('investigations')
      .upsert(fila, { onConflict: 'code' })
      .select(COLS_INV)
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  };

  CIEHSData.eliminarInvestigacion = function (code) {
    return cliente.from('investigations').delete().eq('code', code)
      .then(function (r) { if (r.error) throw r.error; return true; });
  };

  /* ------------------- secciones administrables 2026 --------------------- */

  // Todas estas colecciones siguen el mismo patron que investigations: el panel
  // ve tambien los borradores porque la politica de escritura de admins es FOR
  // ALL (e incluye SELECT), y el publico solo ve lo publicado.
  function listar(tabla, cols, orden, asc) {
    return cliente.from(tabla).select(cols).order(orden, { ascending: asc !== false })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }
  function guardar(tabla, cols, fila, conflicto) {
    var q = conflicto
      ? cliente.from(tabla).upsert(fila, { onConflict: conflicto })
      : (fila.id ? cliente.from(tabla).update(fila).eq('id', fila.id)
                 : cliente.from(tabla).insert(fila));
    return q.select(cols).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function eliminar(tabla, columna, valor) {
    return cliente.from(tabla).delete().eq(columna, valor)
      .then(function (r) { if (r.error) throw r.error; return true; });
  }

  function vacio(v) { return v === '' || v === undefined ? null : v; }

  /* carpeta de campo */
  CIEHSData.listarNotas = function () { return listar('field_notes', COLS_NOTA, 'position'); };
  CIEHSData.guardarNota = function (n) {
    return guardar('field_notes', COLS_NOTA, {
      code: n.code, title: n.title, summary: vacio(n.summary), body: vacio(n.body),
      kind: n.kind || 'informe', team: vacio(n.team), author_label: vacio(n.authorLabel),
      media_url: vacio(n.mediaUrl), published_on: vacio(n.publishedOn),
      position: Number(n.position || 0), published: !!n.published
    }, 'code');
  };
  CIEHSData.eliminarNota = function (code) { return eliminar('field_notes', 'code', code); };

  /* bitacora agronomica */
  CIEHSData.listarLotes = function () { return listar('crop_log', COLS_LOTE, 'position'); };
  CIEHSData.guardarLote = function (l) {
    return guardar('crop_log', COLS_LOTE, {
      lote: l.lote, crop: l.crop, scientific: vacio(l.scientific), module_code: vacio(l.moduleCode),
      sown_on: vacio(l.sownOn), week: vacio(l.week), ph: vacio(l.ph), ce: vacio(l.ce),
      phase: vacio(l.phase), harvest_on: vacio(l.harvestOn), harvest_kg: vacio(l.harvestKg),
      notes: vacio(l.notes), position: Number(l.position || 0), published: !!l.published
    }, 'lote');
  };
  CIEHSData.eliminarLote = function (lote) { return eliminar('crop_log', 'lote', lote); };

  /* recursos docentes */
  CIEHSData.listarRecursos = function () { return listar('resources', COLS_RECURSO, 'position'); };
  CIEHSData.guardarRecurso = function (r) {
    return guardar('resources', COLS_RECURSO, {
      id: r.id || undefined,
      title: r.title, description: vacio(r.description), level: r.level || 'todos',
      area: vacio(r.area), kind: vacio(r.kind), file_url: vacio(r.fileUrl),
      file_kind: vacio(r.fileKind), duration: vacio(r.duration),
      featured: !!r.featured, position: Number(r.position || 0), published: !!r.published
    });
  };
  CIEHSData.eliminarRecurso = function (id) { return eliminar('resources', 'id', id); };

  /* transparencia */
  CIEHSData.listarCaja = function () {
    return listar('transparency_entries', COLS_CAJA, 'occurred_on', false);
  };
  CIEHSData.guardarMovimiento = function (m) {
    return guardar('transparency_entries', COLS_CAJA, {
      id: m.id || undefined,
      occurred_on: m.occurredOn, period: vacio(m.period), concept: m.concept,
      kind: m.kind, amount_pen: Number(m.amount || 0), note: vacio(m.note),
      published: !!m.published
    });
  };
  CIEHSData.eliminarMovimiento = function (id) { return eliminar('transparency_entries', 'id', id); };

  /* pedidos de cosecha — alta abierta, lectura solo para administracion */
  CIEHSData.crearPedido = function (p) {
    return cliente.from('orders').insert({
      requester_name: p.nombre, contact: p.contacto, crop: vacio(p.cultivo),
      qty_kg: vacio(p.kg), notes: vacio(p.notas), status: 'pendiente'
    }).then(function (r) { if (r.error) throw r.error; return true; });
  };
  CIEHSData.listarPedidos = function () { return listar('orders', COLS_PEDIDO, 'created_at', false); };
  CIEHSData.cambiarEstadoPedido = function (id, estado) {
    return cliente.from('orders').update({ status: estado }).eq('id', id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  };
  CIEHSData.eliminarPedido = function (id) { return eliminar('orders', 'id', id); };

  /* comentarios de la comunidad — nacen sin publicar y los aprueba un admin */
  CIEHSData.crearComentario = function (c) {
    return cliente.from('community_comments').insert({
      display_name: c.nombre, role: vacio(c.rol), message: c.mensaje, published: false
    }).then(function (r) { if (r.error) throw r.error; return true; });
  };
  CIEHSData.listarComentarios = function () {
    return listar('community_comments',
      'id, display_name, role, message, reply, published, created_at', 'created_at', false);
  };
  CIEHSData.moderarComentario = function (id, cambios) {
    return cliente.from('community_comments').update(cambios).eq('id', id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  };
  CIEHSData.eliminarComentario = function (id) { return eliminar('community_comments', 'id', id); };

  global.CIEHSData = CIEHSData;
})(window);
