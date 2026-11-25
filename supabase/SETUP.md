# Supabase — Instrucciones de Setup

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Elige un nombre para tu evento (ej. `event-invitations`)
3. Guarda la contraseña de la base de datos
4. Espera a que el proyecto se inicialice (~2 min)

## 2. Inicializar la base de datos

Ve a **SQL Editor** en el dashboard de Supabase:

### Opción A — Proyecto nuevo / Plantilla comercial lista para vender (Recomendado)
Ejecuta **únicamente** este archivo maestro:
- `supabase/000_definitive_schema_and_demo_seed.sql` *(crea de cero la arquitectura relacional definitiva 100% en inglés, bucket `event-gallery`, triggers, RPCs, políticas RLS y carga datos demo neutros con 7 fotos de stock y 3 casos de invitados listos para demostración).*

### Opción B — Proyecto existente con datos previos (Migración progresiva)
Si vienes de una base de datos anterior, ejecuta **en orden estricto**:

1. `supabase/001_initial.sql`
2. `supabase/002_storage.sql`
3. `supabase/003_configuracion.sql`
4. `supabase/004_integridad.sql`
5. `supabase/005_grupos_dinamicos.sql`
6. `supabase/006_confirmacion_parcial.sql`
7. `supabase/007_limites_integridad.sql`
8. `supabase/008_normalizacion_relacional.sql`
9. `supabase/009_agnostic_event_schema.sql` *(esquema 100% agnóstico en inglés, relacional sin JSONB, presets por tipo de evento, bucket `event-gallery` y políticas RLS estrictas)*

> **Utilidades adicionales de prueba:**
> - `supabase/010_backup_current_data.sql` — Guarda una copia íntegra en el esquema privado `event_backup`.
> - `supabase/011_stress_test_max_limits_seed.sql` — Limpia y carga el escenario de estrés llevando todos los límites visuales al máximo.
> - `supabase/012_restore_backed_up_data.sql` — Restaura los datos guardados en `010`.

> **Nota sobre RLS:** Si el editor SQL de Supabase muestra la advertencia preventiva sobre Row Level Security, elige **Run and enable RLS**. Todas las tablas incluyen políticas explícitas para lectura pública controlada y administración autenticada.

## 3. Crear usuario administrador y cerrar el registro público

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Ingresa el correo y la contraseña de administración y marca **Auto Confirm User**.
3. Ve a **Authentication → Sign In / Providers → User Signups** y **desactiva** *"Allow new users to sign up"* para impedir registros externos.

## 4. Configurar variables de entorno

Copia `.env.example` como `.env`:

```bash
cp .env.example .env
```

Rellena los valores desde **Supabase Dashboard → Settings → API Keys**:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
# Usa la Publishable key de tu proyecto (empieza con sb_publishable_...)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

## 5. Acceder al Panel Administrativo

Abre en el navegador:

```
https://tu-dominio.com/?admin=true
```

Inicia sesión con el correo y contraseña creados en el paso 3. Desde ahí podrás:
- Elegir el **tipo de evento** (`wedding`, `birthday`, `gala`, `corporate`, `anniversary`, `graduation`, `casual`, `custom`) y aplicar presets de tono cálido, elegante o corporativo.
- Configurar 1 o 2 anfitriones, grupos de invitados, ubicaciones físicas o virtuales, itinerario, código de vestimenta, menú, cuentas bancarias y textos.
- Gestionar invitados, cupos (`1 + extra_passes`), copiar enlaces únicos (`?ref=UUID`) y enviar invitaciones por WhatsApp con vista previa editable.
- Gestionar confirmaciones en árbol, reiniciar respuestas sin borrar invitados y exportar reportes estilizados en **Excel (.xlsx)** y **PDF (.pdf)**.
- Moderar las fotos subidas por los invitados a la galería compartida.

## 6. Evitar pausa por inactividad (Free Tier)

Supabase pausa proyectos gratuitos tras 1 semana sin actividad.

Configura un cron gratuito en [cron-job.org](https://cron-job.org):

- **URL:** `https://TU_PROJECT.supabase.co/rest/v1/event_settings?select=id&limit=1`
- **Método:** GET
- **Headers:**
  - `apikey`: tu `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Frecuencia:** Cada 2 días
