# Invitación Digital para Bodas (v2) 💍

Plantilla moderna, interactiva y genérica para invitaciones de boda y eventos, construida con **React 19**, **Vite**, **Tailwind CSS**, **Framer Motion** y **Supabase**.

---

## ✨ Características

- 🔒 **Acceso por enlace personalizado (`?ref=UUID`):** Privacidad garantizada. Solo quienes tengan su enlace pueden acceder.
- 💌 **Overlay de bienvenida:** Entrada interactiva con botón para abrir la invitación.
- 🎵 **Ambientación musical sin autoplay molesto:** Botón flotante siempre visible para reproducir/pausar a elección del usuario.
- 📅 **Save The Date + Cuenta regresiva en vivo:** Integrado en una sola sección con botón de **descarga de evento a calendario (`.ics`)**.
- 📍 **Ubicaciones y mapas:** Tarjetas interactivas con modales de Google Maps embebidos y enlaces directos a Google Maps.
- ⏳ **Itinerario:** Línea de tiempo visual y estilizada con iconos representativos.
- 🍽️ **RSVP Inteligente (Confirmación de asistencia):**
  - Identificación automática de invitado y grupo (Novia / Novio).
  - Límite de acompañantes según cupos asignados (`slots`).
  - Selección de plato fuerte y contornos para cada invitado.
  - Guarda en base de datos **Supabase** y genera mensaje directo a **WhatsApp**.
  - Reconoce si el invitado ya confirmó (`confirmed_at`) mostrando su estado en lugar de volver a pedir datos.
- 🎁 **Mesa de regalos:** Soporte para Pago Móvil, transferencias y Binance Pay con botón de copiado rápido al portapapeles.
- 📸 **Galería compartida:** Los invitados pueden subir fotos de la boda comprimidas en el navegador antes de enviarse. Las fotos pasan por moderación.
- 🛡️ **Panel de administración:** Accesible mediante `?admin=true` para aprobar/rechazar fotos y auditar confirmaciones.
- ⚙️ **Configuración centralizada:** Toda la información del evento vive en un solo archivo: `src/config/evento.js`.

---

## 🚀 Inicio Rápido

### 1. Clonar e instalar dependencias


### 2. Variables de entorno
```bash
git checkout invitacion-v2
npm install
```

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Configura tus credenciales de Supabase en `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Base de datos (Supabase)

1. En tu proyecto de Supabase, entra a **SQL Editor**.
2. Ejecuta el script `supabase/001_initial.sql` (crea tablas `invitados`, `confirmaciones`, `fotos` y sus políticas RLS).
3. Ejecuta el script `supabase/002_storage.sql` (crea el bucket `galeria` y sus permisos).

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

---

## 🔗 Cómo invitar personas

Inserta los invitados en la tabla `invitados` de Supabase (o mediante script/dashboard).
El campo `token` se genera automáticamente como UUID.

El enlace para cada invitado tendrá este formato:

```
https://tu-dominio.com/?ref=UUID-DEL-INVITADO
```

- Si entras **sin token**: verás una pantalla elegante indicando que la invitación requiere enlace personal.
- Si entras **con token**: se carga el nombre del invitado y su límite de acompañantes.
- Si entras con `?admin=true`: verás el panel de moderación de fotos y lista de confirmados.

---

## 🎨 Personalización del Evento

Para usar esta plantilla para otra boda o evento, solo modifica:

```
src/config/evento.js
```

Ahí puedes cambiar:
- Nombres de los novios y teléfonos de WhatsApp
- Fecha y hora del evento
- Ubicaciones y enlaces a mapas
- Itinerario
- Código de vestimenta
- Opciones de menú (platos fuertes y contornos)
- Cuentas bancarias para regalos
- Citas, textos emotivos y versículos

---

## 🛠️ Tecnologías

- **React 19**
- **Vite 5**
- **Tailwind CSS 3**
- **Framer Motion 12**
- **Supabase JS Client**
- **browser-image-compression**
- **Lucide React**
