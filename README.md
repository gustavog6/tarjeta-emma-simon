# Invitación Digital para Bodas (v2) 💍

Plantilla moderna, interactiva y configurable para invitaciones de boda y eventos, construida con **React 19**, **Vite**, **Tailwind CSS**, **Framer Motion** y **Supabase**.

---

## ✨ Características

- 🔒 **Acceso por enlace personalizado (`?ref=UUID`):** Privacidad garantizada mediante RPC segura. Sin token válido no se muestra la invitación.
- 💌 **Overlay de bienvenida con control de música:** Música activada por defecto con botón claro para silenciar antes de entrar, más reproductor flotante.
- 📅 **Save The Date + Cuenta regresiva en vivo:** Descarga de evento a calendario (`.ics`) y generador de **banner 9:16 para historias**.
- 📍 **Ubicaciones y mapas:** Tarjetas interactivas con modales de Google Maps embebidos y enlaces directos.
- ⏳ **Itinerario:** Línea de tiempo visual con íconos configurables desde el panel.
- 🍽️ **RSVP Inteligente y Atómico:**
  - Límite de acompañantes por invitado (`1 + slots_totales`) validado tanto en UI como en base de datos.
  - Nombre, apellido y menú completo (plato fuerte + contornos) por cada asistente.
  - Confirmación atómica mediante función RPC en Supabase + envío por WhatsApp.
- 🎁 **Mesa de regalos:** Pago Móvil y Binance Pay con copiado rápido al portapapeles.
- 📸 **Galería compartida:** Subida de fotos comprimidas en el cliente, moderación manual y visor ampliado con descarga.
- 🛡️ **Panel de administración protegido con Supabase Auth (`?admin=true`):**
  - Confirmaciones en tabla con filas anidadas, agregar acompañantes/titular, reiniciar confirmación sin borrar al invitado, exportación a **Excel (.xlsx)** y **PDF (.pdf)**.
  - Gestión completa de invitados y envío de invitaciones por WhatsApp con vista previa editable.
  - Moderación de fotos y pestaña de **Configuración Global** guardada en Supabase.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
git checkout invitacion-v2
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

Ejecuta en **SQL Editor** en orden estricto:
1. `supabase/001_initial.sql`
2. `supabase/002_storage.sql`
3. `supabase/003_configuracion.sql`
4. `supabase/004_integridad.sql`

Luego crea la cuenta de los novios en **Authentication → Users** y desactiva el registro público (*Allow new users to sign up*). Consulta [supabase/SETUP.md](supabase/SETUP.md) para los pasos detallados.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

---

## 🎨 Personalización del Evento

La configuración por defecto vive en `src/config/evento.js` (respaldo offline), y en producción se administra en vivo desde la pestaña **Configuración** del panel (`?admin=true`), guardándose en la tabla `configuracion` de Supabase.
