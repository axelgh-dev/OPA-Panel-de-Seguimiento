# Guía de despliegue: Supabase y Vercel

Pasos para poner el panel en producción con datos reales. Haz los pasos **en este orden**. Todo cabe en las capas gratuitas.

Los nombres de botones del panel de Supabase y de Vercel cambian de vez en cuando; si algo no se llama igual, busca el equivalente en la misma sección.

Lo que necesitas a la mano: un gestor de contraseñas, el correo de cada una de las 4 cuentas (Axel, Admin OPA, Ejecutivo 1 y Ejecutivo 2) y acceso de administrador al repositorio de GitHub.

## Parte A. Supabase

### A1. Crear el proyecto

1. Entra a https://supabase.com/dashboard e inicia sesión.
2. **New project**. Elige tu organización.
3. Nombre: `opa-panel`. **Database password**: genera una contraseña larga y guárdala en tu gestor (la vas a necesitar en A4 y A9).
4. Región: la más cercana a México que ofrezca el plan gratuito (normalmente **East US (North Virginia)**).
5. Plan: **Free**. **Create new project** y espera a que termine (1 a 2 minutos).
6. Anota el **Reference ID** (Project Settings → General). Es el texto de 20 letras de la URL del proyecto.

### A2. Cerrar el registro y configurar el acceso

En **Authentication**:

1. **Sign In / Providers → Email**: déjalo habilitado. Apaga **Allow new users to sign up** (nadie debe poder registrarse solo). Si ves **Minimum password length**, ponlo en 8.
2. **URL Configuration**:
   - **Site URL**: la dirección de producción del panel (por ejemplo `https://opa-panel.vercel.app`; si todavía no la tienes, déjala y vuelve después del Paso C).
   - **Redirect URLs**: agrega `https://TU-DOMINIO-DE-PRODUCCION/**` y `http://localhost:5173/**`. Sin esto, el correo de recuperar contraseña no te regresa al panel.
3. **Emails → Templates** (opcional pero recomendable): traduce el correo **Reset Password** al español para que el despacho lo entienda.

### A3. Obtener las llaves

En **Project Settings → API Keys** (o **API**) copia dos valores:

- **Project URL** (`https://XXXX.supabase.co`).
- La llave pública: la **publishable key** (`sb_publishable_…`) o, si no aparece, la **anon public**. Es la única que va al frontend.

**Nunca** copies la `service_role` / `secret` a Vercel, a GitHub ni al repositorio.

### A4. Crear las tablas (migraciones)

Desde la carpeta del proyecto en tu computadora:

```bash
npx supabase login                          # abre el navegador para autorizar
npx supabase link --project-ref TU_REFERENCE_ID   # te pide la contraseña de la base (A1)
npx supabase migration list --remote        # muestra qué migraciones faltan en producción
npx supabase db push --remote               # aplica las 7 migraciones en producción
```

**Importante:** usa siempre `--remote`. Con la versión del CLI de este proyecto, `db push` y `migration list` apuntan por defecto a la base local de Docker aunque el proyecto ya esté ligado (verás "Target: local stack"). Sin `--remote`, `db push` responde "Local database is up to date" y producción se queda sin tablas.

Revisa con calma lo que va a aplicar antes de confirmar. Después verifica en el panel:

- **Table Editor**: aparecen `projects`, `milestones`, `tasks`, `deliverables`, `profiles`, etc., todas con **RLS enabled**.
- **Storage**: existe el bucket privado `deliverables`.

Si creaste usuarios en **Authentication** antes de aplicar las migraciones, el trigger que crea los perfiles todavía no existía y esos usuarios no tienen fila en `profiles` (no podrán entrar al panel ni aparecerán en A6). Créalos una sola vez en **SQL Editor**; es seguro repetirlo:

```sql
insert into public.profiles (id, email, full_name)
select id, email, coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), split_part(email, '@', 1))
  from auth.users
 on conflict (id) do nothing;
```

No cargues datos de ejemplo en producción: el seed (`npm run db:seed`) solo funciona contra la base local y se niega a correr en otra.

### A5. Crear los 4 usuarios

En **Authentication → Users → Add user → Create new user**, uno por persona:

- Correo y contraseña inicial (compártela por un canal seguro; cada quien puede cambiarla con "Olvidé mi contraseña").
- Marca **Auto Confirm User**.

### A6. Marcar quién es dev

Cada usuario nuevo nace con rol `opa`. Ejecuta esto en **SQL Editor** cambiando los correos por los reales:

```sql
update public.profiles
   set role = 'dev', full_name = 'Axel', job_title = 'Desarrollador'
 where email = 'CORREO_DE_AXEL';

update public.profiles set full_name = 'Admin OPA',   job_title = 'Gerente del despacho' where email = 'CORREO_ADMIN_OPA';
update public.profiles set full_name = 'Ejecutivo 1', job_title = 'Administración'      where email = 'CORREO_EJECUTIVO_1';
update public.profiles set full_name = 'Ejecutivo 2', job_title = 'Administración'      where email = 'CORREO_EJECUTIVO_2';

select email, role, full_name, is_active from public.profiles order by role, email;
```

Debe quedar exactamente **un** `dev` y tres `opa`. Después, los nombres y cargos también se editan desde **Administración** dentro del panel.

### A7. Correo de las invitaciones y de recuperación

El correo integrado de Supabase sirve para 4 usuarios, pero tiene un límite muy bajo de envíos por hora. Si alguien pide recuperar su contraseña varias veces seguidas, tendrá que esperar. Para quitar el límite hará falta SMTP propio (Resend) cuando exista el dominio (Fase 3).

### A8. Secretos de GitHub (anti-pausa y respaldo)

En GitHub: repositorio → **Settings → Secrets and variables → Actions → New repository secret**. Crea estos cuatro:

| Secreto | Valor |
|---|---|
| `SUPABASE_URL` | La Project URL (A3) |
| `SUPABASE_ANON_KEY` | La llave pública (A3) |
| `SUPABASE_DB_URL` | En Supabase, botón **Connect** → pestaña **Connection string** → **Session pooler**. Cambia `[YOUR-PASSWORD]` por la contraseña de A1 (si tiene caracteres especiales como `@` o `#`, codifícalos: `@` = `%40`, `#` = `%23`). Se usa el pooler porque GitHub solo tiene IPv4 y la conexión directa del plan gratuito es IPv6. |
| `BACKUP_PASSPHRASE` | Una contraseña larga y aleatoria. Genérala con `openssl rand -base64 32` y **guárdala en tu gestor**: sin ella no se pueden abrir los respaldos. |

El repositorio es público y cualquiera con sesión en GitHub puede descargar los respaldos, por eso van cifrados. Que la passphrase sea larga y aleatoria es lo que los protege.

### A9. Probar los dos automatismos

En GitHub → **Actions**:

1. Elige **Anti-pausa de Supabase** → **Run workflow**. Debe terminar en verde y mostrar la hora que respondió la base.
2. Elige **Respaldo semanal** → **Run workflow**. Al terminar, el resumen de la ejecución muestra el artefacto `respaldo-AAAA-MM-DD` con un archivo `.gpg`.

Para abrir un respaldo (necesitas `gpg` y `psql`):

```bash
gpg --decrypt respaldo-AAAA-MM-DD.sql.gz.gpg | gunzip > respaldo.sql
```

Nota: el respaldo cubre las tablas del negocio. Los **archivos subidos a Storage** y las **contraseñas de los usuarios** no van incluidos: por eso conviene que los entregables grandes se compartan como enlace (Drive, Figma) y que las cuentas se recreen desde el panel si algún día hiciera falta.

## Parte B. Vercel

### B1. Proyecto de producción (el que ya tienes)

En el proyecto actual de Vercel → **Settings → Environment Variables**. Agrega, marcando **Production** y **Preview**:

| Variable | Valor |
|---|---|
| `VITE_DATA_MODE` | `supabase` |
| `VITE_SUPABASE_URL` | La Project URL (A3) |
| `VITE_SUPABASE_ANON_KEY` | La llave pública (A3) |

No agregues `VITE_DEMO_MODE` (o ponla en `false`). Las variables `VITE_*` se incorporan al compilar: el cambio solo se nota en el siguiente despliegue.

Revisa en **Settings → Build & Development**: Framework **Vite**, comando `npm run build`, salida `dist`, Node 22. El archivo `vercel.json` ya redirige todas las rutas al `index.html`.

### B2. Proyecto de demostración (nuevo)

Para que el despacho siga viendo la maqueta con datos de ejemplo:

1. **Add New… → Project** e importa **el mismo repositorio**.
2. Nombre: `opa-panel-demo`.
3. En **Environment Variables** agrega `VITE_DATA_MODE` = `mock` y `VITE_DEMO_MODE` = `true`.
4. **Deploy**. Esta versión muestra el selector "Ver como" y no usa Supabase.

## Parte C. Publicar

1. Con A y B listos, abre el PR en GitHub y espera a que **CI** esté en verde (lint, pruebas, build, verificación de `service_role` y pruebas de RLS).
2. Abre el despliegue de vista previa del PR: debe pedir inicio de sesión, no mostrar "Ver como" y dejarte entrar con tu cuenta de dev.
3. **Merge** a `main`. Vercel despliega producción y la demo.
4. Vuelve a A2 y pon la dirección final de producción en **Site URL** y **Redirect URLs**, si aún no lo habías hecho.

## Parte D. Revisión final (10 minutos)

- Entra como **dev**: ves los proyectos, **Administración** y los botones de captura.
- Entra como **Admin OPA** (y una vez con un Ejecutivo): no ves borradores, ni tareas internas, ni botones de edición, y sí puedes aprobar un entregable en revisión.
- Pide **Olvidé mi contraseña** con una cuenta: llega el correo, el enlace abre el panel y se puede fijar la contraseña nueva.
- Crea tu primer proyecto real desde **Nuevo proyecto**: nace como borrador; publícalo cuando esté listo.
- En Supabase → **Table Editor** confirma que todas las tablas muestran **RLS enabled**.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| `db push` dice "Local database is up to date" y en Supabase no hay tablas | Falta `--remote`: el CLI apuntó a la base local (A4). |
| Un usuario existe en Authentication pero no aparece en `profiles` | Se creó antes de las migraciones: ejecuta el `insert` de A4. |
| El panel muestra "Faltan VITE_SUPABASE_URL…" | Las variables no están en el entorno correcto o no se volvió a desplegar. |
| "Correo o contraseña incorrectos" con datos correctos | El usuario no tiene **Auto Confirm User** o la contraseña se escribió distinto en A5. |
| Entras pero no ves ningún proyecto | Todavía no hay proyectos publicados, o la cuenta quedó con `is_active = false`. |
| Soy dev pero no veo los botones de captura | El rol sigue en `opa`: repite A6. |
| El enlace de recuperar contraseña no abre el panel | Falta la URL en **Redirect URLs** (A2). |
| El respaldo falla con "could not connect" | Usaste la conexión directa y no el **Session pooler** (A8). |
| El respaldo falla con "Faltan los secretos" | Revisa los nombres exactos de los cuatro secretos. |
