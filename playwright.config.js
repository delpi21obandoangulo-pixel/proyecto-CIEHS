// Pruebas automáticas del portal (fase 5 del rediseño, 2026-09-29).
// Ejecutar: npm test
// Usa el Edge instalado en Windows (channel: 'msedge'), así que no hace falta
// descargar navegadores. Si no hay Edge, cambiar a 'chrome' o quitar channel y
// ejecutar `npx playwright install chromium`.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'msedge',
    trace: 'retain-on-failure',
    // Sin service worker: cada prueba ve los archivos del disco, no una caché.
    serviceWorkers: 'block'
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'], channel: 'msedge' } }
  ],
  webServer: {
    command: 'npx serve -l tcp://127.0.0.1:4173 .',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60000
  }
});
