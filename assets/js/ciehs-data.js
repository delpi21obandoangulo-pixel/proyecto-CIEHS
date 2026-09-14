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

  // Código de administración activo en esta pestaña. Mientras esté puesto, cada
  // petición lleva la cabecera X-CIEHS-Code, que is_admin() valida en el servidor
  // para autorizar las escrituras del panel. Se limpia al salir.
  var codigoAdmin = null;
  var fetchBase = (typeof global.fetch === 'function') ? global.fetch.bind(global) : null;

  /* --------------------- caducidad por inactividad ------------------------
     Los equipos del laboratorio son compartidos y los usa quien se sienta. La
     sesion ya moria al cerrar la pestaña (storage: sessionStorage), pero una
     pestaña abierta y desatendida dejaba el codigo activo indefinidamente:
     cualquiera que pasara por delante podia borrar publicaciones.

     Treinta minutos sin tocar nada y el codigo se olvida. No es un control
     fuerte -quien tiene el equipo delante lo tiene delante-, pero cierra el
     caso real de este sitio, que es el aula vacia entre clase y clase. */
  var CADUCA_MS = 30 * 60 * 1000;
  var ultimoUso = 0;

  function codigoVigente() {
    if (!codigoAdmin) return null;
    if (Date.now() - ultimoUso > CADUCA_MS) { codigoAdmin = null; return null; }
    return codigoAdmin;
  }

  ['click', 'keydown'].forEach(function (ev) {
    global.addEventListener(ev, function () { if (codigoAdmin) ultimoUso = Date.now(); }, true);
  });

  // La cabecera solo viaja a la API del propio proyecto. El cliente de Supabase
  // hoy no llama a ningun otro origen, pero adjuntarla a ciegas dejaba el
  // secreto a merced de que manana lo hiciera: un fetch a un tercero se habria
  // llevado el codigo de administracion dentro de una cabecera.
  // fetch() admite cadena, Request y URL. Leer solo .url dejaba fuera el caso
  // URL, y quedarse sin cabecera no falla de forma visible: falla como un 401
  // al guardar, que es el peor sintoma posible porque parece un codigo malo.
  function esNuestraApi(input) {
    var u = '';
    if (typeof input === 'string') u = input;
    else if (input && typeof input.url === 'string') u = input.url;       // Request
    else if (input && typeof input.href === 'string') u = input.href;     // URL
    else if (input) u = String(input);
    return u.indexOf(SUPABASE_URL) === 0;
  }

  function fetchConCodigo(input, init) {
    init = init || {};
    var codigo = codigoVigente();
    if (codigo && esNuestraApi(input)) {
      var h = new Headers(init.headers || {});
      h.set('X-CIEHS-Code', codigo);
      init.headers = h;
    }
    return fetchBase ? fetchBase(input, init) : fetch(input, init);
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
    global: { fetch: fetchConCodigo, headers: { 'x-client-info': 'ciehs-portal' } }
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
  var COLS_CAJA    = 'id, occurred_on, period, concept, kind, amount_pen, note, categoria, published';
  var COLS_EVIDENCIA = 'id, storage_path, title, eyebrow, body, alt, width, height, ' +
                       'consent_ref, position, published';
  var COLS_APORTE_BASE = 'id, kind, title, description, equipo, grado, storage_path, ' +
                         'mime, size_bytes, rol, published, created_at';
  // La autoria llega con db/18. Mientras esa migracion no este aplicada, pedir
  // estas columnas rompe la lectura ENTERA de aportes, asi que hay una lista
  // corta a la que caer: ver autoriaDisponible mas abajo.
  var COLS_APORTE_AUTORIA = COLS_APORTE_BASE + ', autor_nombre, autor_inicial, colaboradores';
  var COLS_APORTE    = COLS_APORTE_AUTORIA;
  var COLS_PRODUCTO  = 'id, nombre, cientifico, descripcion, unidad, precio_pen, estado, ' +
                       'disponible_desde, stock_estimado, foto_path, position, published';
  var COLS_RESULTADO = 'id, investigation_code, tratamiento, medido_en, variable, valor, ' +
                       'unidad, n_muestras, equipo, grado, nota, published, created_at';
  var COLS_REGISTRO  = 'id, module_code, equipo, grado, medido_en, ph, ce, temp_c, ' +
                       'altura_cm, hojas, nota, published, created_at';
  // Los pedidos llevan nombre y contacto de familias: no hay politica de lectura
  // publica sobre esa tabla y estas columnas solo llegan con sesion de admin.
  var COLS_PEDIDO  = 'id, requester_name, contact, crop, qty_kg, notes, status, created_at';

  CIEHSData.cargarPortal = function () {
    return Promise.all([
      cliente.from('site_config').select(COLS_CONFIG).eq('id', 1).maybeSingle(),
      cliente.from('modules').select('*').order('position', { ascending: true }),
      cliente.from('qr_codes').select('*').order('slot', { ascending: true }),
      cliente.from('investigations')
             .select('code, title, question, hypothesis, var_independent, var_dependent, var_control, method, status, tags, position, updated_at, conclusion, hipotesis_estado')
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
             .limit(200),
      cliente.from('evidencias').select(COLS_EVIDENCIA).order('position', { ascending: true }),
      cliente.from('registros_campo').select(COLS_REGISTRO)
             .order('medido_en', { ascending: true }).limit(600),
      // Lista CORTA a proposito: esta consulta va en la tanda principal del
      // portal y, si db/18 no esta aplicada, una columna desconocida tumbaria
      // el portal entero al respaldo estatico. La firma se pinta desde lo que
      // devuelve listarAportes, que si sabe degradarse.
      cliente.from('aportes').select(COLS_APORTE_BASE)
             .order('created_at', { ascending: false }).limit(60),
      cliente.from('resultados').select(COLS_RESULTADO)
             .order('medido_en', { ascending: true }).limit(800),
      cliente.from('productos').select(COLS_PRODUCTO).order('position', { ascending: true })
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
        caja: r[9].data || [],
        evidencias: r[10].data || [],
        registros: r[11].data || [],
        aportes: r[12].data || [],
        resultados: r[13].data || [],
        productos: r[14].data || []
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

  // Entrada por código: se valida en el servidor (verificar_codigo, SECURITY
  // DEFINER). Solo si el servidor confirma, se activa la cabecera que autoriza
  // las escrituras del panel. Nada de correo ni contraseña.
  CIEHSData.entrarConCodigo = function (codigo) {
    codigo = (codigo || '').trim();
    if (!codigo) return Promise.reject(new Error('Escribe el código de acceso.'));
    return cliente.rpc('verificar_codigo', { p_codigo: codigo }).then(function (r) {
      if (r.error) throw r.error;
      if (r.data !== true) throw new Error('Código incorrecto.');
      codigoAdmin = codigo;   // desde aquí, cada petición a la API lleva X-CIEHS-Code
      ultimoUso = Date.now();
      return true;
    });
  };

  CIEHSData.codigoActivo = function () { return !!codigoVigente(); };

  CIEHSData.salir = function () {
    codigoAdmin = null;
    ultimoUso = 0;
    // Por si quedara una sesión autenticada del camino histórico.
    return cliente.auth.signOut().catch(function () {});
  };

  // Comprobación de permisos del lado servidor. Con código activo, cualquier
  // lectura/escritura protegida ya pasa por is_admin(); esta función deja el
  // gancho por compatibilidad con el camino histórico (usuario en ciehs.admins).
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
  /* ---------------- archivos adjuntos de la carpeta de campo -------------
     El formulario solo aceptaba un ENLACE, y eso invitaba al fallo que se
     acabo dando: alguien copio la direccion de una imagen desde WhatsApp Web
     y guardo un `blob:https://web.whatsapp.com/...`. Una URL blob: es una
     referencia en memoria de UNA pestaña concreta: fuera de ella no apunta a
     nada, asi que en el portal el enlace existia y no abria nada.

     Ahora el archivo se sube de verdad, a su propio bucket publico. En
     `media_url` se guarda la RUTA dentro del bucket, y `urlArchivoCarpeta`
     la resuelve; si lo que hay es una URL absoluta —un enlace externo
     legitimo— se respeta tal cual. */
  var BUCKET_CARPETA = 'ciehs-carpeta';

  CIEHSData.urlArchivoCarpeta = function (ruta) {
    if (!ruta) return '';
    // blob: y data: no se resuelven a proposito: no funcionan fuera de la
    // pestaña que las creo, y devolverlas seria pintar un enlace muerto.
    if (/^(blob|data):/i.test(ruta)) return '';
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return cliente.storage.from(BUCKET_CARPETA).getPublicUrl(ruta).data.publicUrl;
  };

  CIEHSData.subirArchivoCarpeta = function (archivo, nombre) {
    var ruta = nombre || archivo.name;
    return cliente.storage.from(BUCKET_CARPETA)
      .upload(ruta, archivo, { upsert: true, contentType: archivo.type, cacheControl: '3600' })
      .then(function (r) { if (r.error) throw r.error; return ruta; });
  };

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

  /* -------- galeria de evidencias: fotografias fuera del repositorio ------
     Las imagenes viven en el bucket 'ciehs-evidencias', NO en git. El motivo
     no es de tamano: el repositorio es publico y su historial es permanente,
     asi que un commit con la fotografia de un menor no se puede deshacer. El
     protocolo promete que la autorizacion es revocable en cualquier momento;
     esto es lo que hace que esa promesa se pueda cumplir de verdad, porque
     borrar el objeto lo borra. */
  var BUCKET_EVIDENCIAS = 'ciehs-evidencias';

  CIEHSData.urlEvidencia = function (ruta) {
    if (!ruta) return '';
    // Ya absoluta: se respeta tal cual (permite alojar alguna pieza aparte).
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return cliente.storage.from(BUCKET_EVIDENCIAS).getPublicUrl(ruta).data.publicUrl;
  };

  CIEHSData.listarEvidencias = function () {
    return listar('evidencias', COLS_EVIDENCIA, 'position');
  };

  CIEHSData.subirEvidencia = function (archivo, nombre) {
    // upsert:true para que reintentar una subida fallida no obligue a inventar
    // otro nombre y deje huerfano el objeto anterior.
    var ruta = nombre || archivo.name;
    return cliente.storage.from(BUCKET_EVIDENCIAS)
      .upload(ruta, archivo, { upsert: true, contentType: archivo.type, cacheControl: '3600' })
      .then(function (r) { if (r.error) throw r.error; return ruta; });
  };

  CIEHSData.guardarEvidencia = function (e) {
    return guardar('evidencias', COLS_EVIDENCIA, {
      id: e.id || undefined,
      storage_path: e.storagePath, title: e.title, eyebrow: vacio(e.eyebrow),
      body: vacio(e.body), alt: e.alt,
      width: e.width ? Number(e.width) : null,
      height: e.height ? Number(e.height) : null,
      consent_ref: vacio(e.consentRef),
      position: Number(e.position || 0), published: !!e.published
    }, 'storage_path');
  };

  // Elimina la fila Y el objeto. Dejar el archivo en el bucket con la fila
  // borrada seria lo peor de los dos mundos: invisible en el portal pero
  // todavia descargable por URL directa, que es justo lo que una revocacion
  // tiene que impedir.
  /* ---------- carpeta de campo digital: registros de estudiantes ----------
     Alta publica, igual que los comentarios: nace sin publicar y el panel la
     valida. Es lo que permite que un estudiante registre su medicion sin
     cuenta, sin que eso convierta la tabla en un tablon abierto. */
  CIEHSData.registrarMedicion = function (m) {
    var fila = {
      module_code: m.moduleCode,
      equipo: vacio(m.equipo), grado: vacio(m.grado),
      medido_en: m.medidoEn,
      ph:        m.ph        === '' || m.ph        == null ? null : Number(m.ph),
      ce:        m.ce        === '' || m.ce        == null ? null : Number(m.ce),
      temp_c:    m.tempC     === '' || m.tempC     == null ? null : Number(m.tempC),
      altura_cm: m.alturaCm  === '' || m.alturaCm  == null ? null : Number(m.alturaCm),
      hojas:     m.hojas     === '' || m.hojas     == null ? null : Number(m.hojas),
      nota: vacio(m.nota)
      // published NO se envia: la politica RLS solo admite el alta como
      // borrador, y mandarlo en true haria fallar la insercion entera.
    };
    // Sin .select(): pedir la fila de vuelta obliga a Postgres a evaluar la
    // politica de LECTURA sobre ella, y una fila recien creada tiene
    // published=false, asi que no es legible. El resultado seria un
    // "new row violates row-level security policy" enganoso, con la fila
    // insertada o no segun el caso. Se devuelve lo que se envio, que es
    // exactamente lo que el formulario necesita para pintar el punto pendiente.
    return cliente.from('registros_campo').insert(fila)
      .then(function (r) {
        if (r.error) throw r.error;
        var copia = {};
        for (var k in fila) if (Object.prototype.hasOwnProperty.call(fila, k)) copia[k] = fila[k];
        copia.published = false;
        return copia;
      });
  };

  // El panel ve tambien los borradores: su politica es FOR ALL e incluye SELECT.
  CIEHSData.listarRegistros = function () {
    return cliente.from('registros_campo').select(COLS_REGISTRO)
      .order('created_at', { ascending: false }).limit(300)
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  };
  CIEHSData.validarRegistro = function (id, publicado) {
    return cliente.from('registros_campo').update({ published: !!publicado }).eq('id', id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  };
  CIEHSData.eliminarRegistro = function (id) { return eliminar('registros_campo', 'id', id); };

  /* ------------------------------- tienda --------------------------------
     El pedido se guarda en dos pasos porque son dos tablas: primero la
     cabecera en orders, y con su id las lineas. No hay transaccion desde el
     navegador, asi que si el segundo paso falla la cabecera queda huerfana; se
     avisa al usuario en vez de fingir que se guardo entero. */
  // El id se genera AQUI, no se pide de vuelta. `orders` no tiene politica de
  // lectura publica a proposito —lleva nombre y contacto de una persona—, asi
  // que un insert().select() dispararia el RETURNING contra una tabla que el
  // visitante no puede leer y fallaria con un "violates row-level security"
  // que parece un problema de escritura sin serlo. Generando el uuid en el
  // cliente no hace falta leer nada, y ademas hace la operacion reintentable.
  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    // Respaldo para navegadores sin randomUUID (Safari anterior a la 15.4).
    var b = new Uint8Array(16);
    (global.crypto || {}).getRandomValues
      ? global.crypto.getRandomValues(b)
      : b.forEach(function (_, i) { b[i] = Math.floor(Math.random() * 256); });
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = [].map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }

  CIEHSData.crearPedido = function (p) {
    var id = uuid();
    return cliente.from('orders')
      .insert({
        id: id,
        requester_name: p.nombre,
        contact: p.contacto,
        notes: vacio(p.nota),
        status: 'pendiente'   // lo exige la politica RLS de orders
        // crop y qty_kg quedan nulos: en un pedido con lineas el detalle vive
        // en pedido_lineas, y duplicarlo aqui solo crearia dos verdades.
      })
      .then(function (r) {
        if (r.error) throw r.error;
        var lineas = p.lineas.map(function (l) {
          return {
            order_id: id, producto_id: l.id || null,
            nombre: l.nombre, unidad: vacio(l.unidad),
            precio_pen: l.precio == null ? null : Number(l.precio),
            cantidad: Number(l.cantidad)
          };
        });
        return cliente.from('pedido_lineas').insert(lineas).then(function (x) {
          if (x.error) throw x.error;
          return id;
        });
      });
  };

  CIEHSData.listarProductos = function () {
    return cliente.from('productos').select(COLS_PRODUCTO).order('position', { ascending: true })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  };
  CIEHSData.guardarProducto = function (p) {
    return guardar('productos', COLS_PRODUCTO, {
      id: p.id || undefined,
      nombre: p.nombre, cientifico: vacio(p.cientifico), descripcion: vacio(p.descripcion),
      unidad: p.unidad || 'unidad',
      precio_pen: p.precio === '' || p.precio == null ? null : Number(p.precio),
      estado: p.estado || 'en_crecimiento',
      disponible_desde: vacio(p.desde),
      stock_estimado: p.stock === '' || p.stock == null ? null : Number(p.stock),
      foto_path: vacio(p.fotoPath),
      position: Number(p.position || 0), published: !!p.published
    });
  };
  CIEHSData.eliminarProducto = function (id) { return eliminar('productos', 'id', id); };

  // Todas las lineas de una tacada, agrupadas por pedido. Una consulta por
  // pedido seria N+1 y con veinte reservas ya se nota en una tablet del
  // laboratorio. Solo con sesion de administrador: el pedido lleva nombre y
  // contacto de una persona.
  CIEHSData.lineasPorPedido = function () {
    return cliente.from('pedido_lineas')
      .select('order_id, nombre, unidad, precio_pen, cantidad')
      .limit(1000)
      .then(function (r) {
        if (r.error) throw r.error;
        var mapa = {};
        (r.data || []).forEach(function (l) {
          (mapa[l.order_id] = mapa[l.order_id] || []).push(l);
        });
        return mapa;
      });
  };

  /* ---------------- resultados de las investigaciones --------------------
     Mismo patron que los registros de campo: alta publica en borrador y el
     panel valida. Sin .select() encadenado, por la misma razon — el RETURNING
     evaluaria la politica de lectura sobre una fila que aun no es legible. */
  CIEHSData.registrarResultado = function (r) {
    var fila = {
      investigation_code: r.code,
      tratamiento: r.tratamiento,
      medido_en: r.medidoEn,
      variable: r.variable,
      valor: Number(r.valor),
      unidad: vacio(r.unidad),
      n_muestras: r.n === '' || r.n == null ? null : Number(r.n),
      equipo: vacio(r.equipo), grado: vacio(r.grado), nota: vacio(r.nota)
    };
    return cliente.from('resultados').insert(fila)
      .then(function (x) { if (x.error) throw x.error; return fila; });
  };

  CIEHSData.listarResultados = function () {
    return cliente.from('resultados').select(COLS_RESULTADO)
      .order('created_at', { ascending: false }).limit(400)
      .then(function (x) { if (x.error) throw x.error; return x.data || []; });
  };
  CIEHSData.validarResultado = function (id, publicado) {
    return cliente.from('resultados').update({ published: !!publicado }).eq('id', id)
      .then(function (x) { if (x.error) throw x.error; return true; });
  };
  CIEHSData.eliminarResultado = function (id) { return eliminar('resultados', 'id', id); };

  // La conclusion y el estado de la hipotesis van en la propia investigacion.
  CIEHSData.guardarConclusion = function (code, conclusion, estado) {
    return cliente.from('investigations')
      .update({ conclusion: vacio(conclusion), hipotesis_estado: vacio(estado) })
      .eq('code', code)
      .then(function (x) { if (x.error) throw x.error; return true; });
  };

  /* ------------------ aportes: fotos, videos, articulos ------------------
     Bucket PRIVADO y en cuarentena. Un anonimo puede depositar un archivo pero
     no leerlo: la politica de lectura de storage.objects exige que exista una
     ficha aprobada apuntando a ese objeto. Eso convierte "retirar la
     aprobacion" en una revocacion real e inmediata, sin tener que acordarse de
     borrar el archivo aparte, y evita que el bucket se convierta en un
     alojamiento gratuito para cualquiera que encuentre la URL. */
  var BUCKET_APORTES = 'ciehs-aportes';
  var LIMITE_APORTE = 25 * 1024 * 1024;

  CIEHSData.limiteAporte = LIMITE_APORTE;

  CIEHSData.subirAporte = function (archivo, ruta) {
    if (archivo.size > LIMITE_APORTE) {
      return Promise.reject(new Error('El archivo pesa más de 25 MB. Comprímelo o súbelo en partes.'));
    }
    return cliente.storage.from(BUCKET_APORTES)
      .upload(ruta, archivo, { upsert: false, contentType: archivo.type || 'application/octet-stream' })
      .then(function (r) { if (r.error) throw r.error; return ruta; });
  };

  CIEHSData.registrarAporte = function (a) {
    var fila = {
      kind: a.kind, title: a.title, description: vacio(a.description),
      equipo: vacio(a.equipo), grado: vacio(a.grado), rol: vacio(a.rol),
      storage_path: a.storagePath, mime: vacio(a.mime),
      size_bytes: a.sizeBytes == null ? null : Number(a.sizeBytes)
      // published no se envia: la RLS solo admite el alta en cuarentena.
    };
    /* La autoria va aparte a proposito. Si db/18 no esta aplicada, PostgREST
       rechaza el INSERT ENTERO por columna desconocida y el aporte se
       perderia: el estudiante habria subido el archivo para nada. Asi que se
       intenta con firma y, solo si el servidor dice que esas columnas no
       existen, se reintenta sin ella. El trabajo se guarda igual; lo unico
       que falta es el credito, y eso es mejor que perder el trabajo. */
    var firma = {
      autor_nombre:  vacio(a.autorNombre),
      autor_inicial: vacio(a.autorInicial),
      colaboradores: Array.isArray(a.colaboradores) ? a.colaboradores : []
    };
    var hayFirma = !!(firma.autor_nombre || firma.colaboradores.length);

    // Sin .select(), por lo mismo que en registros_campo: el RETURNING evalua
    // la politica de lectura sobre una fila que aun no es legible.
    function meter(f) {
      return cliente.from('aportes').insert(f)
        .then(function (r) { if (r.error) throw r.error; return f; });
    }

    if (!hayFirma) return meter(fila);

    return meter(Object.assign({}, fila, firma)).catch(function (e) {
      if (!faltanColumnasDeAutoria(e)) throw e;
      CIEHSData.autoriaDisponible = false;
      return meter(fila);
    });
  };

  // El bucket es privado: no hay URL publica, se firma una temporal. Solo
  // funciona si la ficha esta aprobada (o si quien pregunta es administrador).
  CIEHSData.urlAporte = function (ruta, segundos) {
    return cliente.storage.from(BUCKET_APORTES).createSignedUrl(ruta, segundos || 3600)
      .then(function (r) { if (r.error) throw r.error; return r.data.signedUrl; });
  };

  /* Si db/18 no esta aplicada, la primera lectura falla por columna
     desconocida. En vez de dejar la seccion de aportes rota —que es lo que
     pasaria— se baja la bandera y se reintenta con la lista corta. A partir de
     ahi el portal funciona igual, solo que sin firmas.

     Se corrige sola: al aplicar la migracion y recargar, vuelve a pedirse la
     lista larga porque la bandera nace en true en cada carga. */
  CIEHSData.autoriaDisponible = true;

  function faltanColumnasDeAutoria(e) {
    var m = (e && e.message) || '';
    // Misma cautela que en faltaTablaAutorizaciones: un permiso denegado no
    // es una migracion que falta, y tratarlo como tal lo esconderia.
    if (String((e && e.code) || '') === '42501' || /permission denied/i.test(m)) return false;
    return /autor_nombre|autor_inicial|colaboradores/i.test(m)
        || /PGRST204|PGRST200|column .* does not exist/i.test(m);
  }

  CIEHSData.colsAporte = function () {
    return CIEHSData.autoriaDisponible ? COLS_APORTE_AUTORIA : COLS_APORTE_BASE;
  };

  CIEHSData.listarAportes = function () {
    function pedir(cols) {
      return cliente.from('aportes').select(cols)
        .order('created_at', { ascending: false }).limit(200)
        .then(function (r) { if (r.error) throw r.error; return r.data || []; });
    }
    return pedir(CIEHSData.colsAporte()).catch(function (e) {
      if (!faltanColumnasDeAutoria(e)) throw e;
      CIEHSData.autoriaDisponible = false;
      return pedir(COLS_APORTE_BASE);
    });
  };
  /* ---------------- autorizaciones de imagen (db/19) --------------------

     Esta tabla NO guarda nombres: solo codigos y fechas. El indice
     codigo -> estudiante vive en la hoja local del coordinador y no entra ni
     en el repositorio ni aqui. Ver pendientes-coordinacion/02.

     Todo lo de abajo es de administracion. La RLS ya lo impone en el
     servidor; comprobar la sesion aqui solo evita disparar peticiones
     condenadas al 401. */

  var FORMATO_AUT = /^AUT-\d{4}-\d{3}$/;
  CIEHSData.formatoAutorizacion = function (c) {
    return FORMATO_AUT.test(String(c || '').trim().toUpperCase());
  };

  // Se baja a false si db/19 no esta aplicada, igual que autoriaDisponible.
  CIEHSData.autorizacionesDisponible = true;

  /* Distinguir «la migracion no esta aplicada» de «no tienes permiso» importa
     mas de lo que parece. La primera version de esto daba por migracion
     ausente CUALQUIER error que mencionara la tabla, y «permission denied for
     table autorizaciones» la menciona. Al estrenar db/19 -que se subio sin
     los GRANT- el registro se leia vacio y en silencio, como si la migracion
     no estuviera: el fallo quedaba escondido detras de su propia red de
     seguridad. Una degradacion que tapa un error de permisos es peor que no
     tener degradacion.

     42P01 tabla inexistente · 42703 columna inexistente · PGRST205 no esta en
     el cache del esquema. 42501 es permiso denegado y se deja pasar como
     error de verdad. */
  function faltaTablaAutorizaciones(e) {
    var c = String((e && e.code) || '');
    var m = (e && e.message) || '';
    if (c === '42501' || /permission denied/i.test(m)) return false;
    return c === '42P01' || c === '42703'
        || /PGRST205/i.test(c + ' ' + m)
        || /does not exist/i.test(m);
  }

  CIEHSData.listarAutorizaciones = function () {
    if (!codigoAdmin) return Promise.resolve([]);
    return cliente.from('autorizaciones')
      .select('codigo, anio, vigente, alta, revocada, nota')
      .order('codigo', { ascending: false }).limit(500)
      .then(function (r) {
        if (r.error) {
          if (faltaTablaAutorizaciones(r.error)) { CIEHSData.autorizacionesDisponible = false; return []; }
          throw r.error;
        }
        return r.data || [];
      });
  };

  CIEHSData.crearAutorizacion = function (codigo, nota) {
    codigo = String(codigo || '').trim().toUpperCase();
    if (!FORMATO_AUT.test(codigo)) {
      return Promise.reject(new Error('El código debe tener la forma AUT-2026-014.'));
    }
    // El año sale del propio codigo: si se teclea AUT-2025-003 en 2026 es
    // porque es del curso anterior, y la fila tiene que decir eso.
    var anio = parseInt(codigo.slice(4, 8), 10);
    return cliente.from('autorizaciones')
      .insert({ codigo: codigo, anio: anio, nota: vacio(nota) })
      .then(function (r) { if (r.error) throw r.error; return codigo; });
  };

  /* Revocar NO borra la fila. Una autorizacion retirada sigue teniendo que
     poder responder «esta foto salio con este respaldo, y se retiro tal dia»
     meses despues. Borrarla dejaria sin explicacion a los aportes que la
     citan, y por eso la clave ajena es on delete restrict. */
  CIEHSData.revocarAutorizacion = function (codigo, revocar) {
    var cambio = revocar
      ? { vigente: false, revocada: new Date().toISOString().slice(0, 10) }
      : { vigente: true,  revocada: null };
    return cliente.from('autorizaciones').update(cambio).eq('codigo', codigo)
      .then(function (r) { if (r.error) throw r.error; return true; });
  };

  /* La lista de moderacion necesita ver consent_ref; la publica no.

     Y consent_ref NO entra en COLS_APORTE_BASE a proposito: esa lista la usa
     tambien la consulta de la tanda principal del portal, y una columna que
     todavia no existe -db/19 sin aplicar- tumbaria el portal entero al
     respaldo estatico. Aqui se pide aparte y se cae a la lista de siempre. */
  CIEHSData.listarAportesAdmin = function () {
    if (!codigoAdmin) return CIEHSData.listarAportes();
    return cliente.from('aportes').select(CIEHSData.colsAporte() + ', consent_ref')
      .order('created_at', { ascending: false }).limit(200)
      .then(function (r) { if (r.error) throw r.error; return r.data || []; })
      .catch(function (e) {
        if (!faltaTablaAutorizaciones(e) && !faltanColumnasDeAutoria(e)) throw e;
        CIEHSData.autorizacionesDisponible = false;
        return CIEHSData.listarAportes();
      });
  };

  /* Aprobar un aporte puede llevar el codigo que respalda publicar el nombre
     completo. Va junto con published en la MISMA sentencia: si fueran dos, un
     fallo entre medias dejaria el aporte publicado sin su respaldo, que es
     justo el estado que no debe existir. */
  CIEHSData.aprobarAporte = function (id, publicado, consentRef) {
    var cambio = { published: !!publicado };
    if (consentRef !== undefined) cambio.consent_ref = vacio(consentRef);
    return cliente.from('aportes').update(cambio).eq('id', id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  };
  // Borra el objeto ANTES que la ficha: sin la ficha, la politica de lectura ya
  // no encuentra a que aprobacion agarrarse, pero el archivo seguiria ocupando
  // cuota y siendo alcanzable por un administrador. Se van los dos.
  CIEHSData.eliminarAporte = function (id, ruta) {
    return cliente.storage.from(BUCKET_APORTES).remove([ruta])
      .then(function () { return eliminar('aportes', 'id', id); });
  };

  CIEHSData.eliminarEvidencia = function (ruta) {
    return cliente.storage.from(BUCKET_EVIDENCIAS).remove([ruta])
      .then(function () { return eliminar('evidencias', 'storage_path', ruta); });
  };

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
      categoria: vacio(m.categoria),
      published: !!m.published
    });
  };
  CIEHSData.eliminarMovimiento = function (id) { return eliminar('transparency_entries', 'id', id); };

  /* pedidos de cosecha — el alta la hace ahora la tienda (ver crearPedido,
     mas arriba), que ademas guarda las lineas del carrito. */
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

  /* ==================== CONTENIDO EDITABLE IN-PLACE ======================
     Tres tablas nuevas (db/16_contenido_editable.sql) que sostienen la edicion
     sobre la propia pagina: textos rotulados con data-edit, imagenes de hueco
     fijo y correcciones a los retos de la arena.

     Van en su PROPIA carga y no en cargarPortal(). El motivo es de despliegue:
     si el DDL todavia no se ha aplicado, estas tres consultas fallan, y
     metidas en la tanda principal tumbarian el portal entero al respaldo
     estatico por una tabla que solo le importa al administrador. Aqui el fallo
     se traga y el portal sigue igual: es exactamente la misma mejora
     progresiva que con la red.
     ===================================================================== */

  function tolerante(promesa, cuandoFalle) {
    return promesa.then(function (r) {
      if (r.error) return cuandoFalle;
      return r.data || cuandoFalle;
    }).catch(function () { return cuandoFalle; });
  }

  CIEHSData.cargarEditable = function () {
    return Promise.all([
      tolerante(cliente.from('textos').select('clave, valor').order('clave', { ascending: true }), []),
      tolerante(cliente.from('imagenes').select('clave, storage_path, alt'), []),
      tolerante(cliente.from('arena_preguntas').select('id, payload, oculta'), [])
    ]).then(function (r) {
      var textos = {};
      r[0].forEach(function (t) { textos[t.clave] = t.valor; });
      var imagenes = {};
      r[1].forEach(function (i) { imagenes[i.clave] = i; });
      return { textos: textos, imagenes: imagenes, arena: r[2] };
    });
  };

  // Clave y valor se validan tambien en el servidor (CHECK de forma y de
  // longitud). Repetirlo aqui no es redundancia inutil: ahorra el viaje y da un
  // mensaje en castellano en lugar de un 400 de PostgREST.
  var CLAVE_OK = /^[a-z0-9][a-z0-9._-]{1,80}$/;

  CIEHSData.guardarTexto = function (clave, valor) {
    if (!CLAVE_OK.test(String(clave || ''))) {
      return Promise.reject(new Error('Clave de texto no válida: ' + clave));
    }
    valor = String(valor == null ? '' : valor);
    if (valor.length > 4000) {
      return Promise.reject(new Error('El texto no puede pasar de 4000 caracteres.'));
    }
    return cliente.from('textos')
      .upsert({ clave: clave, valor: valor }, { onConflict: 'clave' })
      .select('clave, valor').maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  };

  // Borrar la fila NO borra el texto de la pagina: lo devuelve al que trae el
  // HTML. Es la forma de deshacer una edicion sin tener que recordar el
  // original.
  CIEHSData.borrarTexto = function (clave) { return eliminar('textos', 'clave', clave); };

  CIEHSData.guardarImagen = function (clave, ruta, alt) {
    if (!CLAVE_OK.test(String(clave || ''))) {
      return Promise.reject(new Error('Clave de imagen no válida: ' + clave));
    }
    // Solo rutas DENTRO del bucket. urlEvidencia() devuelve tal cual lo que
    // parezca una URL absoluta, asi que sin esta comprobacion una escritura en
    // ciehs.imagenes podria apuntar el mural a un servidor ajeno. La CSP lo
    // bloquearia al pintarlo, pero entonces el sintoma seria una imagen rota
    // sin explicacion; mejor rechazarlo donde todavia se entiende.
    var r = String(ruta || '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(r) || r.indexOf('//') === 0) {
      return Promise.reject(new Error('La imagen debe subirse al portal, no enlazarse desde fuera.'));
    }
    return cliente.from('imagenes')
      .upsert({ clave: clave, storage_path: ruta, alt: vacio(alt) }, { onConflict: 'clave' })
      .select('clave, storage_path, alt').maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  };

  /* Borra la fila Y el archivo, como ya hacia eliminarEvidencia. Antes solo
     borraba la fila: el objeto se quedaba en el bucket para siempre, y como
     cada reemplazo sube uno nuevo con marca de tiempo, cambiar el mural tres
     veces dejaba tres archivos abandonados. En un plan gratuito eso es cuota
     que no vuelve.

     La ruta es opcional: quien llama puede no tenerla a mano, y entonces esto
     se comporta como antes en vez de fallar. Si el borrado del objeto falla
     -porque ya no estaba- la fila se borra igual: lo que no puede quedar es
     una fila apuntando a un archivo inexistente. */
  /* Solo el archivo, sin tocar ninguna fila: lo usa el reemplazo para
     retirar la version anterior una vez guardada la nueva.

     Devuelve TRUE solo si el objeto se borro de verdad. storage.remove()
     responde 200 con una lista VACIA tanto cuando la politica no deja borrar
     como cuando el objeto ya no estaba: sin error y sin distinguir los dos
     casos. Mirar la lista es la unica forma de saber que paso.

     Comprobado contra la base real el 2026-09-13: el borrado SI funciona con
     el codigo de administracion puesto. Conviene dejar escrito como se
     comprobo, porque por el camino parecio lo contrario: el objeto seguia
     respondiendo 200 en su URL publica despues de borrarlo. Era la CACHE del
     CDN. Con ?t=<algo> en la URL responde 400, que es lo que hay que mirar. */
  CIEHSData.borrarArchivoEvidencia = function (ruta) {
    if (!ruta) return Promise.resolve(false);
    return cliente.storage.from(BUCKET_EVIDENCIAS).remove([ruta])
      .then(function (r) { return !!(r && r.data && r.data.length); })
      .catch(function () { return false; });
  };

  CIEHSData.borrarImagen = function (clave, ruta) {
    return eliminar('imagenes', 'clave', clave).then(function (r) {
      if (!ruta) return { fila: r, archivo: null };
      return CIEHSData.borrarArchivoEvidencia(ruta)
        .then(function (ok) { return { fila: r, archivo: ok }; });
    });
  };

  CIEHSData.guardarArenaPregunta = function (id, payload, oculta) {
    if (!/^[a-z0-9][a-z0-9._-]{1,60}$/.test(String(id || ''))) {
      return Promise.reject(new Error('Identificador de reto no válido: ' + id));
    }
    return cliente.from('arena_preguntas')
      .upsert({ id: id, payload: payload, oculta: !!oculta }, { onConflict: 'id' })
      .select('id, payload, oculta').maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  };

  CIEHSData.borrarArenaPregunta = function (id) { return eliminar('arena_preguntas', 'id', id); };

  // Distribucion de modulos: se edita contra ciehs.modules, que ya existia. Se
  // identifica por `code` y no por `id` porque el codigo es lo que el
  // administrador ve en pantalla y lo que esta impreso en los QR del
  // laboratorio.
  var COLS_MODULO = 'id, code, name, system, crop, ph_min, ph_max, ce_min, ce_max, ' +
                    'status, position, published';

  CIEHSData.guardarModulo = function (m) {
    var fila = {};
    if (m.crop   !== undefined) fila.crop   = vacio(m.crop);
    if (m.name   !== undefined) fila.name   = vacio(m.name);
    if (m.phMin  !== undefined) fila.ph_min = m.phMin === '' ? null : Number(m.phMin);
    if (m.phMax  !== undefined) fila.ph_max = m.phMax === '' ? null : Number(m.phMax);
    if (m.ceMin  !== undefined) fila.ce_min = m.ceMin === '' ? null : Number(m.ceMin);
    if (m.ceMax  !== undefined) fila.ce_max = m.ceMax === '' ? null : Number(m.ceMax);
    if (m.status !== undefined) fila.status = m.status;
    if (m.published !== undefined) fila.published = !!m.published;
    if (!Object.keys(fila).length) return Promise.resolve(null);
    return cliente.from('modules').update(fila).eq('code', m.code)
      .select(COLS_MODULO).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  };

  CIEHSData.listarModulos = function () { return listar('modules', COLS_MODULO, 'position'); };

  global.CIEHSData = CIEHSData;
})(window);
