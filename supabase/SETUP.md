# Supabase — Instrucciones de setup

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → New project
2. Elige un nombre (ej. `invitacion-emma-simon`)
3. Guarda la contraseña de la DB (no la necesitarás habitualmente)
4. Espera a que el proyecto se inicialice (~2 min)

## 2. Ejecutar migraciones

Ve a **SQL Editor** en el dashboard de Supabase y ejecuta en orden:

1. Contenido de `supabase/001_initial.sql`
2. Contenido de `supabase/002_storage.sql`

## 3. Configurar variables de entorno

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

## 4. Crear invitados

Desde el **Table Editor** de Supabase, inserta filas en la tabla `invitados`.
El campo `token` se genera automáticamente — ese UUID es el `?ref=` que va en la URL de cada invitado.

Ejemplo de URL:
```
https://mi-invitacion.com/?ref=550e8400-e29b-41d4-a716-446655440000
```

## 5. Evitar pausa por inactividad (Free Tier)

Supabase pausa proyectos free tras 1 semana sin actividad.

Configura un cron gratuito en [cron-job.org](https://cron-job.org):

- **URL:** `https://TU_PROJECT.supabase.co/rest/v1/invitados?limit=1`
- **Método:** GET
- **Headers:**
  - `apikey`: tu anon key
  - `Authorization`: `Bearer TU_ANON_KEY`
- **Frecuencia:** Cada 2 días

## 6. Panel de moderación de fotos (admin)

Accede desde la URL con la clave admin:
```
https://mi-invitacion.com/?admin=TU_CLAVE_SECRETA
```

> La clave se configura en `.env` como `VITE_ADMIN_KEY`.
