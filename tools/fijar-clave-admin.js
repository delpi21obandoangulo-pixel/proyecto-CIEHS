/* ============================================================================
   CIEHS · Fija la contraseña de la cuenta de administración.

   Usa la API de administración de GoTrue (auth.admin.updateUserById), que es la
   via correcta: aplica la politica de contraseñas, mantiene el registro de
   identidades y deja rastro en la auditoria. Escribir el hash a mano en
   auth.users con SQL "funciona" pero se salta todo eso.

   USO
   ---
   La clave NUNCA va escrita en este archivo ni en la linea de comandos: se pasa
   por variable de entorno para que no quede en el historial del terminal.

     # PowerShell
     $env:SUPABASE_SERVICE_ROLE_KEY="<la service_role de kumxtheybmqbfixatnok>"
     $env:CIEHS_ADMIN_PASSWORD="<la contraseña nueva>"
     node tools/fijar-clave-admin.js

     # bash
     SUPABASE_SERVICE_ROLE_KEY="..." CIEHS_ADMIN_PASSWORD="..." \
       node tools/fijar-clave-admin.js

   Al terminar, cierra el terminal o limpia las variables:
     Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY, Env:CIEHS_ADMIN_PASSWORD

   QUE HACE, EN ORDEN
   ------------------
   1. Comprueba que la cuenta es la esperada ANTES de tocarla.
   2. Fija la contraseña y confirma el correo.
   3. Verifica que la nueva contraseña entra de verdad, iniciando sesion con la
      clave publicable — el mismo camino exacto que recorre el modal.
   4. Comprueba que esa sesion pasa is_admin(), que es la segunda puerta.
   5. Cierra la sesion de prueba.

   Si el paso 3 o el 4 fallan, lo dice: fijar la contraseña sin comprobar que
   sirve para entrar seria dar por hecho justo lo que hay que demostrar.
   ========================================================================== */
'use strict';

const URL_SUPABASE = 'https://kumxtheybmqbfixatnok.supabase.co';
const CLAVE_PUBLICABLE = 'sb_publishable_bUmlZhlNSNuYlGE8QdvVmQ_FJbGWeUO';
const UUID  = 'c653071f-9b80-41dc-8aee-2f4bcf06c002';
const CORREO = 'delpi21obandoangulo@gmail.com';

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NUEVA_CLAVE  = process.env.CIEHS_ADMIN_PASSWORD;

function abortar(msg) { console.error('\n✗ ' + msg + '\n'); process.exit(1); }

if (!SERVICE_ROLE) abortar('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.');
if (!NUEVA_CLAVE)  abortar('Falta CIEHS_ADMIN_PASSWORD en el entorno.');
if (NUEVA_CLAVE.length < 8) abortar('La contraseña es demasiado corta (mínimo 8).');

let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (e) {
  abortar('Falta la dependencia. Instálala aquí mismo con:\n' +
          '    npm install @supabase/supabase-js');
}

// Cliente de administración: sin sesión persistente, que este script no debe
// dejar nada guardado en disco.
const admin = createClient(URL_SUPABASE, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false }
});

(async () => {
  // ---- 1. Confirmar que es la cuenta correcta ANTES de tocar nada ----------
  const { data: antes, error: eLeer } = await admin.auth.admin.getUserById(UUID);
  if (eLeer) abortar('No se pudo leer la cuenta: ' + eLeer.message);
  if (!antes || !antes.user) abortar('No existe ninguna cuenta con ese UUID.');
  if ((antes.user.email || '').toLowerCase() !== CORREO) {
    abortar('El UUID no corresponde a ' + CORREO + ', sino a ' +
            antes.user.email + '. No se toca nada.');
  }
  console.log('· Cuenta encontrada: ' + antes.user.email);

  // ---- 2. Fijar la contraseña por la API de GoTrue -------------------------
  const { error: eUpd } = await admin.auth.admin.updateUserById(UUID, {
    password: NUEVA_CLAVE,
    email_confirm: true
  });
  if (eUpd) abortar('No se pudo fijar la contraseña: ' + eUpd.message);
  console.log('· Contraseña fijada mediante auth.admin.updateUserById');

  // ---- 3. Probar que se puede entrar, por el mismo camino que el modal -----
  const publico = createClient(URL_SUPABASE, CLAVE_PUBLICABLE, {
    db: { schema: 'ciehs' },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: sesion, error: eLogin } =
    await publico.auth.signInWithPassword({ email: CORREO, password: NUEVA_CLAVE });
  if (eLogin) abortar('La contraseña quedó fijada pero el inicio de sesión FALLA: ' + eLogin.message);
  console.log('· Inicio de sesión correcto (signInWithPassword)');

  // ---- 4. La segunda puerta: estar en ciehs.admins -------------------------
  const { data: esAdmin, error: eRpc } = await publico.rpc('is_admin');
  if (eRpc) abortar('La sesión inicia pero is_admin() falla: ' + eRpc.message);
  if (esAdmin !== true) {
    abortar('La sesión inicia pero la cuenta NO figura en ciehs.admins, así que ' +
            'el modal la rechazaría. Falta vincular el UUID en esa tabla.');
  }
  console.log('· is_admin() = true — el modal aceptará esta cuenta');

  // ---- 5. No dejar la sesión de prueba abierta ----------------------------
  await publico.auth.signOut();

  console.log('\n✓ Listo. Entra en https://ciehs.vercel.app → Administración' +
              '\n  Correo: ' + CORREO +
              '\n  (la contraseña es la que pusiste en CIEHS_ADMIN_PASSWORD)\n');
})().catch(e => abortar(e && e.message ? e.message : String(e)));
