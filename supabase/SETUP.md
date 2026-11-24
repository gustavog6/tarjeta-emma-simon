# Supabase — Instrucciones de setup

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → New project
2. Elige un nombre (ej. `invitacion-emma-simon`)
3. Guarda la contraseña de la DB (no la necesitarás habitualmente)
4. Espera a que el proyecto se inicialice (~2 min)

## 2. Ejecutar migraciones en orden

Ve a **SQL Editor** en el dashboard de Supabase y ejecuta **en orden estricto**:

1. `supabase/001_initial.sql` (tablas base)
2. `supabase/002_storage.sql` (bucket `galeria`)
3. `supabase/003_configuracion.sql` (renombra `slots` → `slots_totales` y crea la tabla `configuracion`)
4. `supabase/004_integridad.sql` (triggers de integridad, funciones RPC seguras y RLS restrictiva)
5. `supabase/005_grupos_dinamicos.sql` (grupos de invitados 100% dinámicos en `configuracion`)
6. `supabase/006_confirmacion_parcial.sql` (confirmaciones parciales hasta agotar pases)

## 3. Crear usuario administrador (los novios) y cerrar el registro público

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Ingresa el correo y la contraseña de los novios y marca **Auto Confirm User**.
3. Ve a **Authentication → Sign In / Providers → User Signups** y **desactiva** *"Allow new users to sign up"* para que nadie externo pueda crearse una cuenta de administrador.

## 4. Configurar variables de entorno

Copia `.env.example` como `.env`:

```bash
cp .env.example .env
```

Rellena los valores desde **Supabase Dashboard → Settings → API Keys**:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
# Usa la Publishable key que aparece en tu dashboard (empieza con sb_publishable_...)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

## 5. Acceder al Panel Administrativo

Abre en el navegador:

```
https://emmaysimon.netlify.app/?admin=true
```

Inicia sesión con el correo y contraseña creados en el paso 3. Desde ahí podrás:
- Crear, editar y eliminar invitados (y copiar enlaces o enviar invitaciones por WhatsApp con vista previa).
- Ver confirmaciones en árbol, agregar acompañantes faltantes, reiniciar confirmaciones sin borrar invitados y exportar en **Excel (.xlsx)** o **PDF (.pdf)**.
- Moderar fotos subidas por los invitados.
- Editar toda la configuración del evento en la pestaña **Configuración** sin tocar código.

## 6. Evitar pausa por inactividad (Free Tier)

Supabase pausa proyectos free tras 1 semana sin actividad.

Configura un cron gratuito en [cron-job.org](https://cron-job.org):

- **URL:** `https://TU_PROJECT.supabase.co/rest/v1/configuracion?select=id&limit=1`
- **Método:** GET
- **Headers:**
  - `apikey`: tu `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Frecuencia:** Cada 2 días
