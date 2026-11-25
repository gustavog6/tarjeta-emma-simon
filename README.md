# Plantilla de Invitación Digital y Gestión de Eventos ✨

Plantilla web reutilizable, interactiva y **100% agnóstica al tipo de evento** (bodas, cumpleaños, fiestas de gala, almuerzos corporativos, aniversarios, graduaciones o fiestas privadas), con control de acceso por pases, confirmación de asistencia (RSVP) y panel administrativo en tiempo real.

Construida con **React 19**, **Vite**, **Tailwind CSS**, **Framer Motion**, **ExcelJS**, **jsPDF** y **Supabase**.

---

## ✨ Características Principales

- 🎭 **Presets por Tipo de Evento + Personalización Total:** Adapta automáticamente el tono de los textos, WhatsApp, calendario `.ics` y banner 9:16 (*Boda*, *Cumpleaños*, *Gala*, *Corporativo*, *Aniversario*, *Graduación*, *Casual* o *Personalizado*), admitiendo **1 o 2 anfitriones**.
- 🔒 **Control de Acceso por Token (`?ref=UUID`):** Validación segura vía RPC en Supabase (`get_guest_by_token`). Sin enlace válido no se expone la información privada del evento.
- 💌 **Bienvenida Interactiva + Música Ambiental:** Portada de ingreso con control inmediato de audio y reproductor flotante.
- 📅 **Save The Date + Cuenta Regresiva:** Descarga de recordatorio `.ics` para calendario y generador en canvas de **banner vertical 9:16** listo para compartir en historias.
- 📍 **Ubicaciones Físicas y Virtuales:** Tarjetas con Google Maps embebido para sedes presenciales y soporte para transmisiones en vivo o videollamadas.
- ⏳ **Programa / Itinerario:** Línea de tiempo dinámica con selector de íconos desde el panel.
- 🍽️ **RSVP Atómico con Control de Cupos:**
  - Capacidad estricta por invitación (`1 + extra_passes`) validada en UI y mediante triggers/RPC (`submit_rsvp`) en PostgreSQL.
  - Si existe un único grupo de invitados configurado, el asistente omite automáticamente el paso de selección de grupo.
  - Selección individual de plato principal y acompañamientos por asistente + confirmación vía WhatsApp.
- 🎁 ** Regalos / Aportes:** Cuentas bancarias, Pago Móvil o transferencias digitales con copiado rápido al portapapeles.
- 📸 **Galería Colaborativa Moderada:** Compresión en cliente antes de subir al bucket `event-gallery`, moderación de estado (`pending`, `approved`, `rejected`) y visor a pantalla completa.
- 🛡️ **Panel Administrativo con Supabase Auth (`?admin=true`):**
  - Esquema **100% relacional normalizado en inglés** (cero columnas JSONB en tablas, claves foráneas reales y políticas RLS estrictas).
  - Tabla de confirmaciones con filas anidadas, edición individual, reinicio seguro (`reset_guest_rsvp`) y exportación con diseño unificado a **Excel (.xlsx)** y **PDF (.pdf)**.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Configura tus credenciales desde **Supabase Dashboard → Settings → API Keys**:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu_clave_aqui
```

### 3. Base de datos y seguridad (Supabase)

Ejecuta las migraciones de `supabase/` en orden estricto hasta `supabase/009_agnostic_event_schema.sql`, crea el usuario administrador en **Authentication → Users** y desactiva el registro público. Revisa la guía paso a paso en [supabase/SETUP.md](supabase/SETUP.md).

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

---

## 🗄️ Arquitectura de Datos (Supabase)

Toda la configuración y operación del evento reside en tablas relacionales normalizadas en inglés:
- `event_settings` — Ajustes generales, anfitriones, fechas, tipo de evento y plantillas dinámicas.
- `guest_groups` — Grupos/categorías de invitados con color, ícono y teléfono de contacto.
- `guests` — Lista de invitados titulares, `access_token`, `group_id` y `extra_passes`.
- `rsvp_attendees` — Asistentes confirmados vinculados a `guests`, `menu_main_courses` y `menu_sides`.
- `event_locations`, `schedule_items`, `menu_main_courses`, `menu_sides`, `payment_accounts`, `special_mentions`, `gallery_photos`.
