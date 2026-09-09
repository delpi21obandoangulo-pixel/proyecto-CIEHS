/* ============================================================================
   CIEHS · Crea o repara la cuenta de administración y la deja lista para entrar.

   Usa la API de administración de GoTrue (auth.admin.*), que es la vía correcta:
   aplica la política de contraseñas, crea la identidad de correo y deja rastro
   en la auditoría. Escribir el hash a mano en auth.users con SQL "funciona"
   pero se salta todo eso y NO crea la identidad de correo — por eso el login
   con la cuenta de Google fallaba pase lo que pase con la contraseña.

   USO
   ---
   Las credenciales NUNCA van escritas aquí ni en la línea de comandos: por
   entorno, para que no queden en el historial del terminal.

     # PowerShell
     $env:SUPABASE_SERVICE_ROLE_KEY="<service_role de kumxtheybmqbfixatnok>"
     $env:CIEHS_ADMIN_EMAIL="administrador@tu-dominio-real.com"
     $env:CIEHS_ADMIN_PASSWORD="<la contraseña>"
     node tools/fijar-clave-admin.js
     Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY, Env:CIEHS_ADMIN_EMAIL, Env:CIEHS_ADMIN_PASSWORD

   QUÉ HACE, EN ORDEN
   ------------------
   1. Valida que el correo tenga forma real (usuario@dominio.tld). Un correo
      como "administradorCIEHS@EMAIL" no pasa: GoTrue lo rechazaría.
   2. Busca la cuenta por correo. Si existe, le fija la contraseña y confirma el
      correo (updateUserById). Si no, la crea (createUser) — con su identidad de
      correo, que es lo que faltaba.
   3. Deja `ciehs.admins` con EXACTAMENTE esta cuenta (borra las demás), acorde
      a "una única cuenta administradora activa".
   4. Inicia sesión con la clave publicable —el mismo camino que el modal— y
      comprueba is_admin(). Si no entra, lo dice: fijar una contraseña sin
      comprobar que abre la puerta es dar por hecho lo que hay que demostrar.
   ============================================================================ */
'use strict';

var URL_SUPABASE  = 'https://kumxtheybmqbfixatnok.supabase.co';
var CLAVE_PUBLICA = 'sb_publishable_bUmlZhlNSNuYlGE8QdvVmQ_FJbGWeUO';

var SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
var EMAIL        = (process.env.CIEHS_ADMIN_EMAIL || '').trim().toLowerCase();
var PASSWORD     = process.env.CIEHS_ADMIN_PASSWORD;

function abortar(m) { console.error('\n✗ ' + m + '\n'); process.exit(1); }

if (!SERVICE_ROLE) abortar('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.');
if (!EMAIL)        abortar('Falta CIEHS_ADMIN_EMAIL en el entorno.');
if (!PASSWORD)     abortar('Falta CIEHS_ADMIN_PASSWORD en el entorno.');
if (PASSWORD.length < 8) abortar('La contraseña es demasiado corta (mínimo 8).');
// Forma de correo real: usuario@dominio.tld. Frena "administradorCIEHS@EMAIL".
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(EMAIL)) {
  abortar('El correo "' + EMAIL + '" no tiene forma válida (usuario@dominio.tld). ' +
          'GoTrue lo rechazaría. Corrígelo y vuelve a ejecutar.');
}

var createClient;
try { ({ createClient } = require('@supabase/supabase-js')); }
catch (e) { abortar('Falta la dependencia. Instálala aquí: npm install @supabase/supabase-js'); }

var admin = createClient(URL_SUPABASE, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'ciehs' }
});

(async () => {
  // ---- 1. ¿Existe ya la cuenta con ese correo? -----------------------------
  // listUsers pagina; se busca el correo entre las cuentas (esta instancia
  // tiene pocas: Aura, Safari y CIEHS).
  var existente = null;
  for (var pagina = 1; pagina <= 20 && !existente; pagina++) {
    var r = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (r.error) abortar('No se pudo listar usuarios: ' + r.error.message);
    existente = (r.data.users || []).find(function (u) {
      return (u.email || '').toLowerCase() === EMAIL;
    });
    if ((r.data.users || []).length < 200) break;
  }

  var uid;
  if (existente) {
    var up = await admin.auth.admin.updateUserById(existente.id, {
      password: PASSWORD, email_confirm: true
    });
    if (up.error) abortar('No se pudo actualizar la cuenta: ' + up.error.message);
    uid = existente.id;
    console.log('· Cuenta existente actualizada: ' + EMAIL);
  } else {
    var cr = await admin.auth.admin.createUser({
      email: EMAIL, password: PASSWORD, email_confirm: true
    });
    if (cr.error) abortar('No se pudo crear la cuenta: ' + cr.error.message);
    uid = cr.data.user.id;
    console.log('· Cuenta creada: ' + EMAIL);
  }
  console.log('· UUID: ' + uid);

  // ---- 2. AÑADIR esta cuenta a ciehs.admins (aún NO se borran las demás) ---
  // Se añade antes de verificar, porque is_admin() consulta esta tabla. Las
  // otras filas se limpian solo DESPUÉS de comprobar que esta entra: así, si
  // algo fallara, no me quedo sin ningún administrador válido.
  var upa = await admin.from('admins').upsert(
    { user_id: uid, email: EMAIL, display_name: 'Coordinación CIEHS' },
    { onConflict: 'user_id' }
  );
  if (upa.error) abortar('No se pudo escribir en ciehs.admins: ' + upa.error.message);

  // ---- 3. Prueba de entrada por el mismo camino que el modal ---------------
  var publico = createClient(URL_SUPABASE, CLAVE_PUBLICA, {
    db: { schema: 'ciehs' }, auth: { persistSession: false, autoRefreshToken: false }
  });
  var login = await publico.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (login.error) abortar('Contraseña fijada pero el inicio de sesión FALLA: ' + login.error.message);
  console.log('· Inicio de sesión correcto');

  var esAdmin = await publico.rpc('is_admin');
  if (esAdmin.error) abortar('Inicia sesión pero is_admin() falla: ' + esAdmin.error.message);
  if (esAdmin.data !== true) abortar('Inicia sesión pero is_admin() es falso: revisa ciehs.admins.');
  console.log('· is_admin() = true — el modal aceptará esta cuenta');
  await publico.auth.signOut();

  // ---- 4. Solo ahora: dejar ciehs.admins con EXACTAMENTE esta cuenta -------
  var del = await admin.from('admins').delete().neq('user_id', uid);
  if (del.error) abortar('Login OK pero no se pudieron quitar admins antiguos: ' + del.error.message);
  console.log('· ciehs.admins deja una sola cuenta: esta');
  console.log('\n✓ Listo. Entra en https://ciehs.vercel.app → Administración con ' + EMAIL + '\n');
})().catch(function (e) { abortar(e && e.message ? e.message : String(e)); });
