# Suite Comercial de Invitaciones Digitales — Base de Conocimiento y Reglas Maestras

## 🔔 REGLA OBLIGATORIA DE CONFIRMACIÓN VISUAL AL INICIAR CONVERSACIÓN
En tu **primera respuesta** dentro de cualquier conversación nueva (o siempre que el usuario pregunte si tienes el contexto previo), **DEBES mostrar en la primera línea** este aviso discreto exacto antes del resto de tu respuesta:

> 🟢 **Contexto Suite de Invitaciones cargado** · Motor Supabase Relacional (11 tablas, cero JSONB) · Reglas y Flujo Stitch activos.

*(Muéstralo solo en el primer turno de la conversación para confirmar que heredaste toda la arquitectura, sin repetirlo en todos los turnos siguientes).*

---

## 1. Visión del Producto y Arquitectura Multi-Repositorio
Este proyecto forma parte de una **línea comercial de invitaciones digitales interactivas** para todo tipo de eventos (Navidad y Fin de Año familiar/corporativo, Cumpleaños, Corporativos, Desayunos/Almuerzos/Cenas de Negocios y Networking, Bodas, XV años, Bautizos, Baby Showers, Gender Reveals y Primer Añito).

- **Estrategia de Repositorios:** Cada diseño/modelo comercial vive en su **propio repositorio y workspace independiente** (ej. `/home/gustavogo/Dev/Christmas-card-1`), pero **todos comparten exactamente el mismo esquema de base de datos en Supabase y el mismo motor lógico/administrativo**.
- **Repositorio Base y Kit Google Stitch:** `/home/gustavogo/Dev/tarjeta-emma-simon` (rama `invitacion-v2`), donde reside `stitch-kit/`:
  - `stitch-kit/01-flujo-principal-invitacion.html` (flujo principal 10 secciones en HTML+CSS puro, cero JS).
  - `stitch-kit/02-catalogo-modales-y-estados.html` (catálogo estático de estados y modales, cero JS).
  - `stitch-kit/03-PROMPTS-GOOGLE-STITCH.md` (Prompt Maestro + prompts por cada línea comercial).
- **Historial Completo de Decisiones (Conversación Madre):**
  - ID: `aa7484e4-1b93-4f71-8236-ccec4cb54d2f`
  - Transcript consultable bajo demanda: `/home/gustavogo/.gemini/antigravity/brain/aa7484e4-1b93-4f71-8236-ccec4cb54d2f/.system_generated/logs/transcript.jsonl`

---

## 2. Reglas Inquebrantables de Base de Datos (Supabase PostgreSQL)
1. **100% Relacional Normalizado en Inglés (`snake_case`) y CERO JSONB en tablas:** Prohibido almacenar arreglos u objetos de configuración como columnas JSONB en tablas. Toda entidad repetible vive en su propia tabla relacional con claves foráneas y `CHECK` constraints nativos.
2. **Esquema Maestro Único (`supabase/000_definitive_schema_and_demo_seed.sql`):** Las **11 tablas estándar** que comparten todos los modelos son:
   - `event_settings` (`id = 'default'`, `event_type` en `'wedding'|'birthday'|'gala'|'corporate'|'anniversary'|'graduation'|'casual'|'custom'`, soporta **1 o 2 anfitriones**: `primary_host_*` obligatorio y `secondary_host_*` opcional).
   - `guest_groups` (`1..6` grupos con `color`, `icon_key`, `contact_phone`; FK desde `guests.group_id`).
   - `guests` (`access_token` UUID único para acceso `?ref=UUID`, `first_name`, `last_name`, `phone`, `email`, `group_id`, `extra_passes` `0..15`, `can_upload_photos`, `confirmed_at`).
   - `rsvp_attendees` (`guest_id` FK cascade, `first_name`, `last_name`, `full_name`, `is_primary`, `main_course_id`, `side_ids` `TEXT[]`).
   - `event_locations` (`1..4` sedes: `'main_venue'|'reception'|'livestream'|'videocall'`).
   - `schedule_items` (`0..8` hitos con `icon_name`).
   - `menu_main_courses` (`1..8` platos) y `menu_sides` (`0..10` contornos, `max_sides` `0..6`).
   - `payment_accounts` (`0..6` cuentas `'Pago Móvil'|'Binance Pay'`).
   - `special_mentions` (`0..6` menciones/padrinos/comité).
   - `gallery_photos` (`pending|approved|rejected`, tope `120`, bucket `event-gallery`, soporta rutas de Storage y URLs `https://` de stock en `resolvePhotoPublicUrl`).
3. **Seguridad RLS y RPCs:**
   - `ENABLE ROW LEVEL SECURITY` explícito en las 11 tablas.
   - Los invitados públicos nunca consultan ni escriben `guests` o `rsvp_attendees` directamente; todo pasa por RPCs `SECURITY DEFINER` (`get_guest_by_token`, `get_guest_attendees`, `submit_rsvp`, `reset_guest_rsvp`, `get_approved_photos`, `can_guest_upload_photos`).
   - **Integridad de invitados:** Reiniciar una confirmación (`reset_guest_rsvp`) **JAMÁS borra al invitado de `guests`**; únicamente elimina sus filas en `rsvp_attendees` y limpia `confirmed_at = NULL`.
   - En `EventConfigContext.saveConfig`, `syncRelationalTable` siempre ejecuta `UPSERT` antes de `DELETE` para no disparar en falso los triggers `min_limit_reached`.
4. **Estándar para Semillas Comerciales de Venta (`000_definitive_schema_and_demo_seed.sql`):**
   - **Cero nombres propios reales de personas:** usar placeholders de rol (`Empresa Anfitriona`, `Nombre Novio` / `Nombre Novia`, `Padre Novio`, `Padrino Uno`, `Nombre Invitado Uno..Tres`, `Nombre Acompañante Uno..Dos`).
   - Incluir **7 fotos de stock aprobadas** (llenan la cuadrícula preview de 6 y activan el botón *"Ver todas"*).
   - Incluir los **3 casos de demostración** con tokens fijos:
     - `00000000-0000-4000-8000-000000000001`: Invitado solo pendiente (`0 / 1`).
     - `00000000-0000-4000-8000-000000000002`: Con 1 acompañante confirmado (`2 / 2`).
     - `00000000-0000-4000-8000-000000000003`: Con 2 acompañantes permitidos y 1 pendiente (`2 / 3`, confirmación parcial).

---

## 3. Reglas de Código, Integridad Visual (`EVENT_LIMITS`) y Panel Admin
- **Código fuente en inglés limpio** (tablas, columnas, componentes, hooks y utilidades); textos visibles de interfaz en español cálido/profesional adaptable según `eventPresets.js`.
- **Mobile-First real (`360px–430px`) + Desktop (`1440px`):** usar `min-h-dvh-safe` (`100vh`/`100svh`/`100dvh`), `env(safe-area-inset-*)`, `overflow-x: clip`, `break-anywhere` y respetar estrictamente `src/config/eventLimits.js`.
- **UX de Grupos y Anfitriones:**
  - `formatHostsNames(hosts)` soporta **1 anfitrión** (`"Empresa Anfitriona"`) o **2 anfitriones** (`"Anfitrión A & Anfitrión B"`).
  - En `RsvpModal`, si solo existe **1 grupo** configurado (`groups.length <= 1`) o ya confirmó el titular, se salta automáticamente el Paso 1 de selección de grupo.
- **Panel Administrativo (`/?admin=true`):**
  - Mantiene siempre fuente sans-serif legible (`.admin-panel h1..h6`), protegido con Supabase Auth.
  - Pestaña Confirmaciones: muestra **solo confirmados**; invitados individuales (`extra_passes === 0` y `<= 1` asistente) se muestran inline con `•` sin tabla anidada.
  - Exportación homologada en **PDF (`exportPdf.js`)** y **Excel estilizado con `ExcelJS` (`exportExcel.js`)**.

---

## 4. Flujo para Crear Nuevos Modelos desde Google Stitch
1. El usuario diseña en Google Stitch usando `01-flujo-principal-invitacion.html`, `02-catalogo-modales-y-estados.html` y `03-PROMPTS-GOOGLE-STITCH.md`.
2. Al recibir los HTML exportados por Stitch, se crea un **nuevo repositorio independiente** en `/home/gustavogo/Dev/<Nombre-Modelo>`, reutilizando intacto el core (`context/`, `hooks/`, `lib/`, `config/`, `utils/`, `AdminPanel.jsx`, `AdminLogin.jsx`, `ConfigTab.jsx`, `supabase/`) y adaptando **únicamente** los componentes públicos (`WelcomeOverlay`, `Hero`, `SaveTheDate`, `StoryBannerModal`, `EventCards`, `MapModal`, `Timeline`, `DressCode`, `RsvpSection`, `RsvpModal`, `ContributionsModal`, `SpecialMentionsSection`, `Gallery`, `PhotoUploadModal`, `PhotoViewerModal`, `QuoteSection`, `Acknowledgements`, `MusicPlayer`, `AccessGate`), `index.css`, `tailwind.config.js` y la semilla demo en `000_definitive_schema_and_demo_seed.sql`.
