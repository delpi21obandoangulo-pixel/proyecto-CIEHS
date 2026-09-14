---
title: 8 · Rotar el código de acceso al panel — CERRADO
tags: [ciehs, pendiente-coordinacion, seguridad, credenciales, cerrado]
depende-de: nada — resuelto el 2026-09-13
actualizado: 2026-09-13
estado: cerrado
---

# 8 · Rotar el código de acceso al panel

> [!success] CERRADO el 2026-09-13 — rotado y verificado
> El código nuevo está **activo en la base**: 24 caracteres y 140 bits de
> entropía, generado con `crypto.randomBytes`. Vive sólo en la bóveda local,
> en `.boveda\ciehs-codigo-acceso\valor-codigo.txt`.
>
> Comprobado contra la API real, no supuesto:
>
> | | |
> |---|---|
> | `verificar_codigo()` con el nuevo | `true` |
> | `verificar_codigo()` con el viejo | `false` |
> | Escritura real con el nuevo | **201** |
> | La misma sin cabecera, y con el viejo | **401** |
>
> **El código que quedó publicado en el historial de GitHub ya no abre nada.**
> Sigue ahí —git no olvida— pero es un dato muerto.

> [!note] Por qué costó tres días
> El aviso se escribió el 2026-09-10 y la rotación no se hizo hasta el 13. En
> el primer intento la sentencia no llegó a aplicarse —el código viejo seguía
> validando— y hizo falta comprobarlo para darse cuenta. La lección es la de
> siempre: **una rotación no está hecha hasta que se verifica que la vieja
> credencial dejó de funcionar.** Dar por buena la ejecución habría dejado la
> puerta abierta creyéndola cerrada.

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
