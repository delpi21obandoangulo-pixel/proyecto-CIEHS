// Pruebas de humo del portal CIEHS.
//
// REGLA: estas pruebas NUNCA tocan la base de datos real. Todas las peticiones
// a Supabase se cortan, así que el portal funciona con su contenido de
// respaldo del HTML (que es justo lo que ve un visitante sin conexión).
const { test, expect } = require('@playwright/test');

const RUTAS = ['inicio','metodologia','investigaciones','equipos','modulos','trazabilidad','datos',
               'juega','docentes','comunidad','mural','eureka','contacto','privacidad'];

test.beforeEach(async ({ page }) => {
  await page.route(/supabase\.co/, (r) => r.abort());
  await page.route(/panel-webs-six\.vercel\.app/, (r) => r.abort());
    await page.addInitScript(() => {
    try { localStorage.setItem('ciehs.aviso.cerrado', '__todos__'); } catch (e) {}
  });
});

function vigilarErrores(page) {
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Los fallos de red son los que provocamos nosotros al cortar Supabase.
    if (/Failed to load resource|net::ERR|supabase|fetch|CIEHS: no se pudo/i.test(t)) return;
    errores.push(t);
  });
  return errores;
}

test('las 14 rutas cargan sin errores y muestran su sección', async ({ page }) => {
  const errores = vigilarErrores(page);
  await page.goto('/#/inicio');
  await expect(page.locator('html')).toHaveAttribute('data-js', 'listo');
  for (const r of RUTAS) {
    await page.evaluate((x) => { location.hash = '#/' + x; }, r);
    await expect(page.locator('main [data-page="' + r + '"]:not([hidden])').first()).toBeVisible();
  }
  expect(errores).toEqual([]);
});

test('una ruta inventada termina en #/inicio', async ({ page }) => {
  await page.goto('/#/no-existe');
  await expect(page).toHaveURL(/#\/inicio$/);
});

test('no hay scroll horizontal en ninguna ruta', async ({ page }) => {
  await page.goto('/#/inicio');
  for (const r of RUTAS) {
    await page.evaluate((x) => { location.hash = '#/' + x; }, r);
    await page.waitForTimeout(150);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sobra, 'scroll horizontal en #/' + r).toBeLessThanOrEqual(1);
  }
});

test('buscador: Ctrl+K encuentra «ph» y lleva a Datos', async ({ page }) => {
  await page.goto('/#/inicio');
  await expect(page.locator('html')).toHaveAttribute('data-js', 'listo');
  await page.keyboard.press('Control+k');
  const caja = page.locator('.cmdk input');
  await expect(caja).toBeFocused();
  await caja.fill('ph');
  await expect(page.locator('.cmdk-op').first()).toContainText(/pH/i);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/datos/);
});

test('el menú se cierra al cambiar de página por la URL', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'el cajón es el menú del móvil');
  await page.goto('/#/inicio');
  await expect(page.locator('html')).toHaveAttribute('data-js', 'listo');
  await page.locator('#navToggle').click();
  await expect(page.locator('#menuPanel')).toBeVisible();
  await page.evaluate(() => { location.hash = '#/datos'; });
  await expect(page.locator('#menuPanel')).toBeHidden();
});

test('mega-menú de escritorio abre y lleva a la sección', async ({ page, isMobile }) => {
  test.skip(isMobile, 'solo escritorio');
  await page.goto('/#/inicio');
  await expect(page.locator('html')).toHaveAttribute('data-js', 'listo');
  await page.locator('.nav-fam', { hasText: 'Investigación' }).click();
  await expect(page.locator('.mega')).toHaveClass(/is-abierto/);
  await page.locator('.mega-panel.is-activo .mega-item', { hasText: 'Módulos' }).click();
  await expect(page).toHaveURL(/#\/modulos/);
});

test('investigaciones: lista, detalle con pestañas y vuelta', async ({ page }) => {
  await page.goto('/#/investigaciones');
  const tarjetas = page.locator('#invGrid .inv-proy');
  await expect(tarjetas.first()).toBeVisible();
  await tarjetas.first().locator('.inv-abrir').click();
  await expect(page).toHaveURL(/\?inv=INV-2026-01/i);
  const abierta = page.locator('.inv-proy.is-abierta');
  await abierta.locator('[data-tab="diseno"]').click();
  await expect(abierta.locator('[data-pane="diseno"]')).toBeVisible();
  await expect(abierta.locator('[data-pane="resumen"]')).toBeHidden();
  await abierta.locator('.inv-volver').click();
  await expect(page).toHaveURL(/#\/investigaciones$/);
  await expect(page.locator('.inv-proy.is-abierta')).toHaveCount(0);
});

test('asistente Aportar: foto ligada a una investigación (envío simulado)', async ({ page }) => {
  await page.goto('/#/investigaciones');
  await expect(page.locator('html')).toHaveAttribute('data-js', 'listo');
  // Sustituye la subida real: nada sale del navegador.
  await page.evaluate(() => {
    const D = window.CIEHSData;
    D.listo = true;
    window.__registro = null;
    D.subirAporte = () => Promise.resolve();
    D.registrarAporte = (x) => { window.__registro = x; return Promise.resolve(); };
  });
  await page.locator('.inv-aportar').click();
  await page.locator('.apt-tipo[data-tipo="informe"]').click();
  await page.locator('.apt-inv').first().click();
  await expect(page.locator('.apt #aporteForm')).toBeVisible();
  await page.setInputFiles('#aporteArchivo', { name: 'informe.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba') });
  await page.fill('#aporteTitulo', 'Informe de prueba');
  await page.fill('#aporteDesc', 'Resumen corto.');
  await page.locator('#aporteEnviar').click();
  await expect(page.locator('.apt-ok')).toBeVisible();
  const desc = await page.evaluate(() => window.__registro && window.__registro.description);
  expect(desc).toMatch(/^\[INV-2026-01\] Resumen corto\.$/);
  await page.locator('.apt:not(.vr) .apt-cerrar').click();
  // El formulario vuelve a su sitio y el envío queda en «Tus envíos».
  await expect(page.locator('#aportes #aporteForm')).toHaveCount(1);
  await expect(page.locator('.inv-envio')).toContainText('Informe de prueba');
});

test('plano del invernadero: elegir un módulo cambia la ficha', async ({ page }) => {
  await page.goto('/#/modulos');
  const mods = page.locator('.plano-mod');
  await expect(mods).toHaveCount(15);
  await mods.nth(9).click();
  await expect(page.locator('.plano-ficha .pf-code')).toHaveText('MOD-DWC-10');
});

test('el saneador de HTML no deja ejecutar nada', async ({ page }) => {
  await page.goto('/tools/prueba-saneador.html');
  await page.waitForTimeout(1500);
  await expect(page.locator('#cuenta')).toHaveText('0');
});

test('reserva rápida de lechuga (guardado simulado, con reintento por el freno)', async ({ page }) => {
  await page.goto('/#/inicio');
  await expect(page.locator('html')).toHaveAttribute('data-js', 'listo');
  // Sin base (cortamos Supabase): se simulan dos productos y el guardado.
  await page.evaluate(() => {
    const D = window.CIEHSData; D.listo = true;
    const s = window.CIEHS.snapshot() || {};
    s.productos = [
      { id: 'p1', nombre: 'Lechuga crespa', estado: 'disponible', precio_pen: 3, unidad: 'unidad', published: true },
      { id: 'p2', nombre: 'Lechuga americana', estado: 'disponible', precio_pen: 2.5, unidad: 'unidad', published: true }
    ];
    window.CIEHS.snapshot = () => s;
    let n = 0; window.__ped = null;
    D.crearPedido = (p) => { n++; if (n === 1) return Promise.reject(new Error('Demasiadas solicitudes en poco tiempo.')); window.__ped = p; return Promise.resolve('abcdef12-0000-4000-8000-000000000000'); };
  });
  await page.locator('.hm-cta[data-reservar]').click();
  const pasos = page.locator('.vr-paso');
  await pasos.nth(0).locator('button').last().click();
  await pasos.nth(0).locator('button').last().click();
  await page.locator('.vr-rol', { hasText: 'Estudiante' }).click();
  await page.fill('.vr-form [name="nombre"]', 'Ana Prueba');
  await page.fill('.vr-form [name="contacto"]', '987654321');
  await page.fill('.vr-form [name="grado"]', '2.° C');
  await expect(page.locator('.vr-enviar .btn')).toHaveText('Reservar 2 unidades · S/ 6.00');
  await page.locator('.vr-enviar .btn').click();
  await expect(page.locator('.vr-estado')).toContainText('Reintentamos solos');
  await expect(page.locator('.vr-codigo b')).toHaveText('ABCDEF', { timeout: 20000 });
  const ped = await page.evaluate(() => window.__ped);
  expect(ped.nota).toBe('[Venta] Rol: Estudiante · Grado: 2.° C');
  expect(ped.lineas).toEqual([{ id: 'p1', nombre: 'Lechuga crespa', unidad: 'unidad', precio: 3, cantidad: 2 }]);
});
