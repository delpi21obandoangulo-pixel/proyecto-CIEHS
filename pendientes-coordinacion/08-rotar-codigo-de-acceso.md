---
title: 8 · Rotar el código de acceso al panel — URGENTE
tags: [ciehs, pendiente-coordinacion, seguridad, credenciales, urgente]
depende-de: decidir el código nuevo y dónde se guarda
actualizado: 2026-09-10
---

# 8 · Rotar el código de acceso al panel

> [!danger] El código de administración está publicado en internet
> Hasta el 2026-09-10, el archivo `db/10_acceso_codigo.sql` contenía el código
> **en claro**. Ese archivo está en un repositorio **público** de GitHub y se
> descarga sin cuenta.
>
> Cualquiera que lo leyera obtiene **acceso de administración completo** al
> esquema `ciehs`: basta con enviar la cabecera `X-CIEHS-Code` con ese valor en
> cualquier petición a la API. Publicar, despublicar, borrar evidencias,
> cambiar la portada, tocar la caja — todo.

---

## Por qué quitarlo del archivo no basta

Ya se retiró del árbol actual. **No sirve de nada por sí solo:** el historial de
git conserva cada versión anterior de cada archivo, para siempre, y el
repositorio sigue siendo público. El código se recupera con un comando.

**La única corrección real es rotarlo.**

---

## Qué hay que decidir

### 1 · El código nuevo

El anterior eran **ocho dígitos numéricos**. Eso son 10⁸ combinaciones, y hay un
detalle que lo empeora: la función `ciehs.verificar_codigo()` es invocable **sin
autenticarse** desde `/rest/v1/rpc/verificar_codigo`. Es un oráculo: se le
pueden lanzar candidatos y responde sí o no, sin límite de intentos.

Esa función tiene que seguir siendo pública —el propio modal de acceso la llama
antes de que exista sesión—, así que la defensa no puede ser cerrarla: **tiene
que ser un código que no se pueda adivinar**.

Recomendación: **al menos 16 caracteres**, con letras y dígitos, generado al
azar. No una fecha, no un nombre, no el número del colegio.

### 2 · Dónde vive

En la bóveda local (`C:\Users\delpi\.boveda`), con su carpeta propia y su
`FICHA.md`, como manda el procedimiento de credenciales. **Nunca** en el
repositorio, ni en un `.md` del proyecto, ni en un mensaje de chat.

### 3 · Quién lo sabe

Hoy es un código compartido: quien lo tiene **es** administrador, y no queda
rastro de quién hizo qué. Conviene decidir a cuántas personas se les da y
anotarlo en la ficha de la bóveda.

---

## Cómo se ejecuta

Una sola sentencia contra la base, sustituyendo el marcador por el código nuevo:

```sql
insert into ciehs.acceso_config (id, codigo_hash, actualizado)
values (1, encode(extensions.digest('<CÓDIGO NUEVO>','sha256'),'hex'), now())
on conflict (id) do update
  set codigo_hash = excluded.codigo_hash,
      actualizado = now();
```

Solo se guarda el hash: el código en claro no llega a la base.

**Efecto inmediato:** el código anterior deja de funcionar en cuanto se ejecuta.
Quien tuviera el panel abierto tendrá que volver a introducirlo.

Puedo ejecutarlo yo en cuanto me digas el código —o mejor, en cuanto lo dejes en
la bóveda y me digas que está—. También puedo generarlo y dejarlo en la bóveda
sin escribirlo en el chat.

---

## Después de rotar

- [ ] Anotar la rotación en la ficha de la bóveda, con fecha y motivo.
- [ ] Comprobar que el panel abre con el código nuevo.
- [ ] Comprobar que el anterior ya **no** abre.
- [ ] Decidir si se sigue con código compartido o se vuelve a cuentas con sesión
      (`ciehs.admins`), que es el camino que deja rastro de quién hizo qué.

---

## Lo que esto no arregla

Un código compartido, por largo que sea, sigue siendo **un secreto que viaja en
una cabecera** y que varias personas conocen. Es un compromiso deliberado del
proyecto —evita gestionar correos y contraseñas de docentes— y está bien
mientras sea consciente. La alternativa está descrita en
[[CIEHS-Auditoria-Seguridad-Auth]].

---

Índice de la carpeta en [[pendientes-coordinacion/LEEME|LEEME]] ·
detalle técnico en [[CIEHS-Auditoria-Seguridad-Auth]] §9.
