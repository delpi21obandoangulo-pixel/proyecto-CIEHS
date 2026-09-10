---
title: 3 · Instalar la Vercel GitHub App
tags: [ciehs, pendiente-coordinacion, despliegue, vercel]
depende-de: navegador y cuenta propia · flujo OAuth, el CLI no puede hacerlo
actualizado: 2026-09-10
---

# 3 · Instalar la Vercel GitHub App

Hoy cada despliegue depende de que alguien empuje a `master` **y** de que el
push llegue a Vercel por el enlace que ya existe. Conectar el repositorio deja
el despliegue automático: cada push a `master` publica solo, y cada rama abre
su propia previsualización.

> [!note] Por qué no puede hacerse desde aquí
> Es un flujo **OAuth interactivo** en el navegador, con tu sesión de GitHub y
> la de Vercel. Ninguna herramienta de línea de comandos lo sustituye.

## Los pasos

1. Entrar a **vercel.com** con la cuenta que ya tiene el proyecto.
2. Abrir el proyecto **`ciehs`**.
3. *Settings* → *Git*.
4. *Connect Git Repository* → autorizar la **Vercel GitHub App** cuando GitHub
   lo pida.
5. Elegir el repositorio **`delpi21obandoangulo-pixel/proyecto-CIEHS`**.
6. Confirmar que la **Production Branch** es `master`, no `main`.

## Qué ya está resuelto

- El proyecto Vercel existe y está aislado: no comparte nada con Aura ni con
  Kunturmasha.
- El enlace local (`.vercel/project.json`) apunta al proyecto correcto.
- La rama `master` del repositorio está sincronizada con lo que hay en
  producción.
- `vercel.json` ya lleva las cabeceras de endurecimiento y `.vercelignore`
  excluye la documentación interna.

## Cómo comprobar que quedó

Hacer un cambio mínimo, empujarlo, y ver que en *Deployments* aparece un
despliegue nuevo **sin haber ejecutado nada a mano**. Si aparece, este pendiente
se cierra en [[CIEHS-Portal-Educativo]].

> [!tip] El caché del service worker
> Tras cada despliegue, el portal puede seguir mostrando la versión anterior
> hasta que el service worker (`ciehs-v4-shell`) se actualice. Recargar una
> segunda vez basta. No es un fallo del despliegue.

---

Índice de la carpeta en [[pendientes-coordinacion/LEEME|LEEME]].
