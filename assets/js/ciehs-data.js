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
  var COLS_CAJA    = 'id, occurred_on, period, concept, kind, amount_pen, note, categoria, published';
  var COLS_EVIDENCIA = 'id, storage_path, title, eyebrow, body, alt, width, height, ' +
                       'consent_ref, position, published';
  var COLS_APORTE    = 'id, kind, title, description, equipo, grado, storage_path, ' +
                       'mime, size_bytes, rol, published, created_at';
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
      cliente.from('aportes').select(COLS_APORTE)
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
    // Sin .select(), por lo mismo que en registros_campo: el RETURNING evalua
    // la politica de lectura sobre una fila que aun no es legible.
    return cliente.from('aportes').insert(fila)
      .then(function (r) { if (r.error) throw r.error; return fila; });
  };

  // El bucket es privado: no hay URL publica, se firma una temporal. Solo
  // funciona si la ficha esta aprobada (o si quien pregunta es administrador).
  CIEHSData.urlAporte = function (ruta, segundos) {
    return cliente.storage.from(BUCKET_APORTES).createSignedUrl(ruta, segundos || 3600)
      .then(function (r) { if (r.error) throw r.error; return r.data.signedUrl; });
  };

  CIEHSData.listarAportes = function () {
    return cliente.from('aportes').select(COLS_APORTE)
      .order('created_at', { ascending: false }).limit(200)
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  };
  CIEHSData.aprobarAporte = function (id, publicado) {
    return cliente.from('aportes').update({ published: !!publicado }).eq('id', id)
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

  global.CIEHSData = CIEHSData;
})(window);
