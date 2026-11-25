# Kit de Diseño IA para Google Stitch — Catálogo Comercial de Invitaciones Digitales

Este documento contiene la estrategia completa y los **prompts listos para copiar y pegar en Google Stitch** para diseñar cada línea comercial de invitaciones manteniendo **100% de compatibilidad con nuestro motor y base de datos en Supabase** (`000_definitive_schema_and_demo_seed.sql`).

---

## 1. Estrategia de Arquitectura (Por qué esto escala para ventas)

Cada nueva invitación temática vivirá en su **propio repositorio independiente** (ej. `invitacion-cena-navidena`, `invitacion-gala-corporativa`, `invitacion-cumpleanos`, `invitacion-networking`), pero **todos compartirán exactamente el mismo núcleo técnico**:
- **Mismo esquema Supabase 100% relacional** (`event_settings`, `guest_groups`, `guests`, `rsvp_attendees`, `event_locations`, `schedule_items`, `menu_main_courses`, `menu_sides`, `payment_accounts`, `special_mentions`, `gallery_photos`).
- **Mismo Panel Administrativo universal** (`AdminPanel`, `ConfigTab`, exportación estilizada en PDF y Excel, envío WhatsApp, moderación de fotos y RPCs atómicas).
- **Lo único que cambia en cada repositorio es la capa visual pública** (componentes de vista pública + variables CSS + tipografías + ornamentos diseñados con Stitch).

---

## 2. Cómo usar estos archivos en Google Stitch (Paso a Paso)

Tienes dos archivos de referencia en HTML + CSS puro (**cero JavaScript, cero `<script>`**, íconos SVG embebidos, responsive de `360px` a `1440px`):
1. `stitch-kit/01-flujo-principal-invitacion.html` → Portada de Bienvenida + las 9 secciones del scroll principal.
2. `stitch-kit/02-catalogo-modales-y-estados.html` → Pantalla de acceso privado, estados parcial/confirmado del RSVP y los modales (Wizard RSVP de 4 pasos, Datos Bancarios/Regalos, Banner `9:16` para historias, Galería y Lightbox).

### Orden recomendado dentro de Google Stitch por cada temática:
1. **Sesión Paso 1 (Flujo Principal — Modo Mobile primero, luego Web/Desktop):**
   - Abre **Google Stitch** en modo **Mobile** (donde abre el 90%+ de invitados desde WhatsApp).
   - Copia el **BLOQUE MAESTRO (Sección 3)** + el **PROMPT DE LA TEMÁTICA ELEGIDA (Sección 4)** y adjunta/pega como referencia estructural el contenido de `01-flujo-principal-invitacion.html`.
   - Una vez que te encante la propuesta móvil en Stitch, pídele en el mismo hilo: *"Genera ahora la adaptación Desktop/Web (`1440px`) de este exacto diseño manteniendo el mismo sistema visual, tipografías y paleta"*.
2. **Sesión Paso 2 (Modales y Estados):**
   - En ese mismo hilo de Stitch, pega el **PROMPT COMPLEMENTARIO DE MODALES (Sección 5)** junto con `02-catalogo-modales-y-estados.html` para que diseñe el Wizard RSVP, el modal de cuentas/regalos, el banner `9:16` y la galería exactamente con el nuevo lenguaje gráfico.
3. **Paso 3 (Construcción conmigo en código real):**
   - Exporta el HTML/Tailwind e imágenes/capturas desde Stitch, creamos el nuevo repositorio clonando nuestro core base y en una sola sesión transformamos el HTML de Stitch en los componentes React conectados en vivo a Supabase.

---

## 3. BLOQUE MAESTRO DE REGLAS Y CONTRATO DE DATOS (Pegar SIEMPRE primero)

> **Instrucción:** Copia el bloque siguiente y pégalo siempre como primera mitad de tu prompt en Google Stitch, seguido inmediatamente del bloque de la temática que vayas a diseñar.

```text
Actúa como un Director de Arte Digital Senior y Diseñador UI/UX especialista en invitaciones digitales interactivas de alto valor comercial (Mobile-First 360px–430px y Web Responsive hasta 1440px).

Te entrego como referencia base la estructura HTML/CSS actual de nuestra plataforma de invitaciones. Tu misión es REDISEÑAR COMPLETAMENTE la estética, paleta de colores, jerarquía tipográfica, composición editorial, formas de tarjetas, fondos, botones y ornamentos para la nueva temática indicada más abajo, respetando ESTRICTAMENTE el mismo contrato de secciones y límites de datos para que se conecte sin fricción a nuestra base de datos.

### REGLA INQUEBRANTABLE #1: CONSERVAR LAS 10 SECCIONES FUNCIONALES DEL FLUJO PRINCIPAL
Debes diseñar en orden coherente estos mismos bloques funcionales (puedes reinventar su composición visual, tarjetas, bordes, fondos claro/oscuro y disposición, pero NO eliminar ninguno):
0. Portada de Entrada (Welcome Overlay 100dvh): emblema/ornamento temático, nombre de anfitrión(es) u organización, botón principal de apertura y píldora de estado de música ("Música: Activada / Silenciada").
1. Hero Principal + Botón Flotante de Música (FAB esquina inferior derecha): insignia superior (badge), título protagonista con el/los anfitriones y sutil indicador de scroll.
2. Save The Date + Cuenta Regresiva: título de sección, día de la semana, composición destacada de Fecha (día, mes, año y hora), 2 botones de acción secundaria ("Añadir al calendario .ics" y "Banner para Historias") y contador regresivo de 4 bloques (días, horas, min, seg).
3. Ubicaciones del Evento (Event Cards): soporta de 1 a 4 tarjetas tanto presenciales (nombre del lugar, dirección, hora y botón "Ver Mapa") como virtuales (plataforma, código de acceso y botón "Ver Transmisión / Videollamada").
4. Programa / Itinerario (Timeline): línea de tiempo vertical u horizontal-alternada de hasta 8 hitos con hora, título de actividad e ícono representativo.
5. Bloque Triple de Acción e Información:
   - Tarjeta A: Código de Vestimenta (etiqueta de vestimenta + indicadores visuales elegantes acordes a la ocasión).
   - Tarjeta B: Confirmación de Asistencia (RSVP) con llamado a la acción principal ("Confirmar Asistencia").
   - Tarjeta C: Regalos / Aportes / Información Bancaria con botón para abrir el detalle de cuentas.
6. Anfitriones Destacados / Familias / Comité Organizador + Menciones Especiales: hasta 2 tarjetas destacadas superiores (Grupo A y Grupo B) y 1 bloque inferior con grilla de hasta 6 menciones especiales (nombre + rol/cargo).
7. Galería Compartida de Recuerdos: encabezado con botón "Subir mi foto", cuadrícula de 6 fotografías cuadradas (con indicador "+N Ver todas" en la 6ta foto) y botón "Ver todas las fotos".
8. Frase de Cierre / Mensaje Especial: ornamento sutil, cita o dedicatoria y firma de los anfitriones.
9. Footer Institucional / Cierre Final: emblema final, nota o dedicatoria breve y referencia al pie.

### REGLA INQUEBRANTABLE #2: LÍMITES REALES DE INTEGRIDAD VISUAL (MOBILE-FIRST)
El diseño NO debe romperse ni desbordarse horizontalmente en pantallas de 360px de ancho incluso cuando los textos alcancen estos topes máximos:
- Anfitriones: debe lucir espectacular tanto con 1 SOLO anfitrión (ej. " Corporación Atlas" o "Alejandro Morales", hasta 25 caracteres) como con 2 anfitriones ("Nombre Uno & Nombre Dos").
- Badge Hero: hasta 30 caracteres | Botón Portada: hasta 28 caracteres.
- Ubicaciones: 1 a 4 tarjetas; título hasta 40 chars, recinto hasta 60 chars, dirección hasta 120 chars.
- Itinerario: hasta 8 actividades; hora hasta 15 chars, título hasta 55 chars.
- Vestimenta: hasta 40 caracteres.
- Menciones especiales: hasta 6 personas (nombre 50 chars, rol 30 chars).
- Cita de cierre: hasta 220 caracteres | Nota de footer: hasta 320 caracteres.

### REGLA INQUEBRANTABLE #3: ESPECIFICACIÓN TÉCNICA DEL ENTREGABLE
- Entrega HTML5 semántico limpio con Tailwind CSS y Google Fonts reales (cargables desde fonts.googleapis.com).
- Define al inicio variables CSS claras para el sistema de color (`--color-primary`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-surface`).
- Cero JavaScript, cero lógica, íconos en SVG limpio o Lucide/Material equivalentes.
- Contraste tipográfico impecable (WCAG AA), áreas táctiles mínimas de 44px en móvil y estética de producto premium listo para vender como plantilla comercial.
```

---

## 4. PROMPTS ESPECÍFICOS DE LAS 4 PRIORIDADES COMERCIALES (`*`)

Copia el **Bloque Maestro (Sección 3)** y pega justo debajo **uno** de los siguientes bloques según el modelo que vayas a generar en Stitch:

---

### 🎄 PRIORIDAD 1A (`*`) — Fiesta / Cena Navideña y Año Nuevo (Versión Familiar y Amigos)
*(Tu primer producto de lanzamiento inmediato para cenas navideñas familiares, posadas y fiestas de fin de año en casa o salón).*

```text
### TEMÁTICA A DISEÑAR AHORA: CENA Y FIESTA NAVIDEÑA FAMILIAR (WARM LUXURY HOLIDAY)

1. Concepto y Atmósfera Visual:
   - Estética "Warm Luxury Christmas": cálida, acogedora, mágica y sofisticada (aléjate por completo de caricaturas infantiles o colores neón saturados; debe verse como papelería fina de alta gama digna de venderse como invitación exclusiva).
   - Paleta sugerida: Verde Pino Profundo (`#1B3B2B` o `#1E4631`) combinado con Borgoña/Vino Especiado (`#7A1F2B`), acentos en Dorado Champán Cálido (`#C8A45D`), sobre fondos Crema Marfil Cálido (`#FAF6F0`) y superficies blanco hueso (`#FFFFFF`) con bordes sutiles dorados. (Puedes proponer bloques alternados en verde pino profundo con texto marfil/dorado para dar dramatismo navideño en Hero, Portada y Footer).
   - Tipografía Google Fonts sugerida: Títulos editoriales elegantes con `Playfair Display` o `Cormorant Garamond` (itálicas expresivas y pesos semi-bold, mucho más legibles y navideñas que una caligrafía nupcial) + cuerpo en `Plus Jakarta Sans` o `Lato`.
   - Ornamentos y detalles gráficos: ramas minimalistas en línea fina de pino/acebo, estrellas polares de 4 u 8 puntas en trazo dorado, destellos sutiles, marcos con esquinas biseladas tipo tarjeta impresa en foil dorado.

2. Textos Demo Neutros de Venta (NO uses nombres propios reales):
   - Portada y Hero: Badge `"CENA DE NAVIDAD"` | Anfitrión principal: `"Familia Anfitriona"` (muestra qué tan bien luce un título familiar único o `"Anfitrión Uno & Anfitrión Dos"`) | Botón: `"Abrir invitación"`.
   - Save The Date: Título `"Celebremos Juntos"` | Día `"Miércoles · Nochebuena"` | Fecha `"24 Diciembre · 08:30 PM"`.
   - Ubicaciones: 1) `"Recepción y Brindis"` en `"Residencia Familiar — Salón y Terraza"` y 2) `"Saludo Virtual de Medianoche"` (videollamada para familiares en el exterior).
   - Itinerario (5 hitos): `08:30 PM` Bienvenida y Ponche Navideño · `09:30 PM` Cena Tradicional de Nochebuena · `11:00 PM` Intercambio de Obsequios · `12:00 AM` Brindis de Navidad · `12:30 AM` Música y Compartir.
   - Bloque Triple:
     • Vestimenta: `"Elegante Festivo (Toque Rojo, Verde o Dorado)"`.
     • RSVP: `"Confirmar Asistencia y Menú"` (para elegir plato navideño y contornos).
     • Regalos / Aportes: `"Intercambio y Aportes"` (para datos de aporte compartido o regalo familiar).
   - Menciones Especiales: Título `"Organizan con cariño"` → `"Abuelos de la Familia"`, `"Tíos Anfitriones"` y menciones a encargados del brindis/música.
   - Frase de cierre: `"La mejor decoración de esta Navidad es la sonrisa de quienes amamos alrededor de la misma mesa."` — Firma: `"Con todo nuestro cariño, Familia Anfitriona"`.
```

---

### 🥂 PRIORIDAD 1B (`*`) — Gala / Cena Navideña y Brindis de Fin de Año (Versión Corporativa)
*(Segundo ángulo inmediato de ventas en temporada decembrina: empresas, firmas, clínicas, agencias y cámaras empresariales).*

```text
### TEMÁTICA A DISEÑAR AHORA: CENA NAVIDEÑA Y GALA DE FIN DE AÑO CORPORATIVA (EXECUTIVE HOLIDAY GALA)

1. Concepto y Atmósfera Visual:
   - Estética "Midnight & Gold Executive Gala": nocturna, distinguida, sobria, celebratoria y corporativa de alto nivel.
   - Paleta sugerida: Azul Medianoche Profundo (`#0F172A`) o Carbón Noche (`#141820`) combinado con Verde Esmeralda Oscuro (`#12352B`), Dorado Metálico Suave (`#D4AF37` / `#C5A059`) y secciones de lectura limpia en Marfil Piedra (`#F8F7F4`) o tarjetas oscuras translúcidas tipo cristal esmerilado (`backdrop-blur`) con altísimo contraste de lectura.
   - Tipografía Google Fonts sugerida: Títulos en `Cinzel` o `Cormorant Garamond` (porte institucional y de gala) combinados con `Inter` o `DM Sans` para máxima nitidez ejecutiva en horarios, direcciones y formularios. CERO tipografías manuscritas románticas.
   - Ornamentos: geometría Art Déco sutil, líneas finas doradas, destellos minimalistas de brindis de fin de año.

2. Textos Demo Neutros de Venta (enfocado en 1 Anfitrión = Empresa):
   - Portada y Hero: Badge `"GALA DE FIN DE AÑO"` | Anfitrión único: `"Nombre de la Empresa"` | Botón: `"Ver Invitación Oficial"`.
   - Save The Date: Título `"Reserva la Fecha"` | Día `"Viernes · Cena Anual"` | Fecha `"18 Diciembre · 07:30 PM"`.
   - Ubicaciones: 1) `"Cóctel y Cena de Gala"` en `"Gran Salón Empresarial — Hotel Sede"` y 2) `"Transmisión Brindis Nacional"` (para sucursales remotas).
   - Itinerario: `07:30 PM` Registro y Cóctel de Bienvenida · `08:30 PM` Palabras de Directiva y Reconocimientos · `09:15 PM` Cena de Fin de Año · `10:45 PM` Brindis Corporativo y Sorteos · `11:15 PM` Música en Vivo y Celebración.
   - Bloque Triple:
     • Vestimenta: `"Ejecutivo Cocktail / Gala de Noche"`.
     • RSVP: `"Confirmar Pase y Menú"` (colaborador titular + acompañante autorizado).
     • Aportes / Información: `"Información de Estacionamiento / Registro"` o `" Fondo Solidario Navideño"`.
   - Menciones Especiales: Título `"Comité Anfitrión e Invitados Especiales"` → `"Dirección General"`, `"Gerencia de Talento Humano"`, `"Oradores Invitados"`.
   - Cierre: `"Gracias por un año de compromiso, logros compartidos y excelencia. Celebremos juntos lo que construimos."` — Firma: `"Junta Directiva · Nombre de la Empresa"`.
```

---

### 🎂 PRIORIDAD 2 (`*`) — Cumpleaños (Celebración Especial / 30, 40, 50 Años / Fiesta Privada)

```text
### TEMÁTICA A DISEÑAR AHORA: CUMPLEAÑOS ADULTO / CELEBRACIÓN ESPECIAL (MODERN FESTIVE EDITORIAL)

1. Concepto y Atmósfera Visual:
   - Estética "Editorial Celebration & Lounge": moderna, vibrante pero sofisticada, fotogénica e ideal para vender en cumpleaños importantes (25, 30, 40, 50, 60 años o fiestas privadas exclusivas).
   - Paleta sugerida: Fondo Crema Arena Cálido (`#FAF7F2`) contrastado con bloques Negro Caviar / Grafito (`#1C1917`), acento principal en Terracota Champán / Ámbar Dorado (`#B87D4B` o `#C68B59`) y secundario Bronce Suave (`#8C5E35`).
   - Tipografía Google Fonts sugerida: `Fraunces` o `Playfair Display` (con números grandes esculturales en fecha y cuenta regresiva) + `Plus Jakarta Sans` para textos e interfaz.
   - Detalles gráficos: arcos editoriales modernos, badges tipo pase VIP numerado, íconos limpios de brindis/música/celebración.

2. Textos Demo Neutros de Venta (1 Anfitrión protagonista):
   - Portada y Hero: Badge `"CELEBREMOS MI CUMPLEAÑOS"` | Anfitrión: `"Nombre Homenajeado"` | Botón: `"Entrar a la celebración"`.
   - Save The Date: `"Reserva esta noche"` | `"Sábado"` | Contador regresivo con gran protagonismo visual.
   - Ubicaciones: `"Terraza & Lounge Central"` (con mapa).
   - Itinerario: Bienvenida y Tragos de Autor · Cena / Estaciones Gastronómicas · Brindis y Pastel · DJ Set y Fiesta.
   - Bloque Triple: Código de Vestimenta (`"Cocktail Moderno / Casual Chic"`), Confirmar Asistencia y Menú, y Detalle / Lluvia de Sobres Digital (Datos Bancarios).
   - Menciones: `"Anfitriones y Cómplices de esta Noche"` (`"Familia del Homenajeado"`, `"Amigos Organizadores"`).
```

---

### 🏛️ PRIORIDAD 3 (`*`) — Evento Corporativo Institucional (Lanzamientos, Aniversarios, Convenciones)

```text
### TEMÁTICA A DISEÑAR AHORA: EVENTO CORPORATIVO INSTITUCIONAL (SWISS ARCHITECTURAL ENTERPRISE)

1. Concepto y Atmósfera Visual:
   - Estética "Modern Architectural Summit": pulcra, ejecutiva, contemporánea, inspirada en eventos de marcas tecnológicas, firmas financieras, lanzamientos de producto y aniversarios institucionales.
   - Paleta sugerida: Blanco Puro / Gris Niebla (`#F8FAFC`) como superficie limpia, Azul Acero Profundo (`#0F2942`) como `--color-primary`, Pizarra Ejecutiva (`#1E3A5F`) como `--color-secondary` y detalle Cian/Plata sutil. Bordes definidos (`1px`), sombras suaves de precisión, esquinas moderadas (`12px–16px`), cero adornos florales o manuscritos.
   - Tipografía Google Fonts sugerida: `Plus Jakarta Sans` o `Space Grotesk` para titulares firmes y modernos + `Inter` para cuerpo de texto y datos tabulares.

2. Textos Demo Neutros de Venta:
   - Portada y Hero: Badge `"INVITACIÓN OFICIAL"` | Anfitrión: `"Organización Anfitriona"` | Botón: `"Acceder a la Acreditación"`.
   - Save The Date: `"Agenda del Encuentro"` + botón `.ics` destacado para calendario corporativo Outlook/Google.
   - Ubicaciones: Sede Presencial (`"Centro de Convenciones — Auditorio Principal"`) + Acceso Streaming (`"Transmisión Oficial en Vivo"`).
   - Itinerario: Acreditación y Café de Bienvenida · Keynote de Apertura · Presentación Central · Almuerzo / Cóctel Ejecutivo · Clausura.
   - Bloque Triple: Código de Vestimenta (`"Business Formal / Ejecutivo"`), Confirmación de Acreditación y Menú (`RSVP`), y Datos Oficiales de Registro/Patrocinio.
   - Menciones Especiales: `"Directiva, Ponentes e Invitados de Honor"` (nombre del vocero + cargo institucional).
```

---

### 🍽️ PRIORIDAD 4 (`*`) — Desayunos, Almuerzos o Cenas de Negocios & Networking Ejecutivo

```text
### TEMÁTICA A DISEÑAR AHORA: DESAYUNO, ALMUERZO O CENA DE NEGOCIOS Y NETWORKING (PRIVATE HOSPITALITY CLUB)

1. Concepto y Atmósfera Visual:
   - Estética "Private Members Club & Fine Dining": sobria, cálida, gastronómica y exclusiva, pensada para mesas redondas ejecutivas, desayunos de inversión, almuerzos de negocios, cenas maridaje y encuentros privados de networking.
   - Paleta sugerida: Lino Piedra Cálido (`#F6F4EF`), Verde Oliva Oscuro / Bosque Ejecutivo (`#28362C`) o Espresso Tostado (`#2C221E`) como `--color-primary`, Latón/Cobre Satinado (`#A47551`) como acento, y tarjetas limpias estilo menú de restaurante de autor.
   - Tipografía Google Fonts sugerida: `Newsreader` o `Instrument Serif` (aire editorial de revista económica / gastronomía de alta gama) + `DM Sans`.

2. Textos Demo Neutros de Venta:
   - Portada y Hero: Badge `"ENCUENTRO EJECUTIVO"` | Anfitrión: `"Firma o Anfitrión Convocante"` | Botón: `"Ver Invitación Privada"`.
   - Save The Date: `"Reserva en tu Agenda"` (con foco en puntualidad y descarga inmediata a calendario `.ics`).
   - Ubicaciones: `"Salón Privado — Restaurante Sede"` (con dirección exacta, valet parking y mapa) + opción de conexión remota breve si aplica.
   - Programa: Recepción y Café/Aperitivo de Networking · Bienvenida del Moderador · Conversatorio / Presentación Central · Servicio Gastronómico Principal · Espacio Abierto de Relacionamiento.
   - Bloque Triple: Vestimenta (`"Business Casual / Smart Casual"`), Confirmación de Cupo y Selección de Menú (clave en desayunos/almuerzos/cenas ejecutivas), y Datos de Reservación / Cuota de Participación.
   - Menciones Especiales: `"Moderadores e Invitados Especiales"` (ej. `"Moderador Uno — Socio Director"`, `"Invitado Especial — Ponente"`).
```

---

## 5. PROMPT COMPLEMENTARIO PARA DISEÑAR LOS MODALES (Paso 2 en cada hilo de Stitch)

> **Instrucción:** Una vez que Stitch te entregue el diseño aprobado de la página principal (`01`), pega este prompt en el **mismo chat de Stitch** adjuntando `02-catalogo-modales-y-estados.html`:

```text
Excelente. Manteniendo EXACTAMENTE el mismo sistema visual, paleta de colores, tipografías, estilo de botones y bordes que acabas de diseñar para la invitación principal, rediseña ahora el Catálogo de Estados y Ventanas Modales que te adjunto en HTML (`02-catalogo-modales-y-estados.html`).

Debes incluir de forma clara y ordenada estas vistas estáticas sin omitir ninguna:
1. Pantallas de Control de Acceso: estado "Cargando..." y estado "Invitación personal con acceso restringido por enlace".
2. Variantes de la tarjeta RSVP en la página principal: estado "Confirmación parcial (2 de 3 pases, 1 disponible)" y estado "¡Asistencia 100% confirmada!" con lista de nombres confirmados.
3. Modal Wizard de Confirmación RSVP (sus 4 pasos completos):
   - Paso 1/4: Selección de grupo/categoría con tarjetas seleccionables.
   - Paso 2/4: Lista de asistentes (Titular + botón "+ Agregar acompañante" con campos Nombre y Apellido separados).
   - Paso 3/4: Selección gastronómica por asistente (indicador numérico de persona 1..N, selección de Plato Principal y cuadrícula de Contornos/Acompañamientos con contador de seleccionados).
   - Paso 4/4: Resumen final de los asistentes con su menú elegido y botón destacado para confirmar y enviar por WhatsApp.
4. Modal de Datos Bancarios / Regalos / Aportes: tarjetas de cuenta (ej. Pago Móvil / Transferencia / Binance Pay) con datos en fuente monoespaciada clara y botón "Copiar".
5. Modal de Banner 9:16 para Historias: vista previa vertical proporción 9:16 coherente con la temática + botón "Descargar para compartir".
6. Modales de Galería: modal para "Subir foto" (área punteada de carga) y modal "Lightbox Visor Ampliado" (autor, contador 1/7, flechas anterior/siguiente y botón descargar).

Recuerda: entrega HTML + CSS/Tailwind limpio, cero JavaScript, cuidando contraste perfecto y usabilidad móvil (360px–430px) y web.
```

---

## 6. Guía Rápida de Estilo para la Fase 2 del Catálogo

Cuando termines las 4 prioridades (`*`), usa el mismo **Bloque Maestro (Sección 3)** cambiando solo la ficha estética por cualquiera de estas:

| Línea Comercial | Paleta Recomendada | Tipografías Google Fonts | Tono y Detalles Visuales |
| :--- | :--- | :--- | :--- |
| **XV Años** | Rosa Cuarzo Empolvado / Lavanda Noche o Azul Real + Plata/Champán | `Cormorant Garamond` + `Montserrat` | Editorial juvenil de gala, destellos finos, corona/estrellas minimalistas en línea continua |
| **Bautizo** | Blanco Lino, Azul Cielo Suave o Verde Salvia Pastel + Dorado Arena | `EB Garamond` + `Lato` | Luminoso, sereno, espiritual, rama de olivo o paloma minimalista en trazo fino |
| **Baby Shower** | Crema Vainilla, Terracota Suave / Verde Eucalipto / Beige Cálido | `Fraunces` (soft) + `Nunito Sans` | Tierno y moderno estilo boutique nórdica (sin dibujos saturados) |
| **Gender Reveal** | Base Neutro Marfil + Dúo Pastel Sofisticado (Rosa Arcilla & Azul Bruma) | `Playfair Display` + `Plus Jakarta Sans` | Juego visual equilibrado "¿Team Niña o Team Niño?" en el Paso 1 de grupos del RSVP |
| **Primer Añito** | Crema Cálido, Mostaza Suave / Salvia / Azul Polvo | `Recoleta`/`Fraunces` + `DM Sans` | Alegre, limpio, tarjetas redondeadas suaves, ideal para fotos del primer año en la galería |
| **Boda (Nuevas colecciones)** | Terracota Boho, Negro & Blanco Editorial Vogue, o Azul Mediterráneo | `Bodoni Moda` o `Cormorant` + `Lato` | Permite ofrecer 3–4 estilos distintos de boda sobre exactamente la misma base de datos |

---

## 7. Checklist de Retorno (Cuando me pases los diseños de Stitch para programarlos)

Por cada temática que apruebes en Stitch, solo necesitarás compartir conmigo:
1. El **HTML/CSS exportado por Stitch** (flujo principal + modales) y, si quieres, una captura de referencia.
2. El **nombre del nuevo repositorio** que quieres crear (ej. `invitacion-cena-navidena`).

Con eso crearemos el proyecto independiente, conectaremos el `.env` al mismo esquema `000_definitive_schema_and_demo_seed.sql`, dejaremos el `AdminPanel` + reportes PDF/Excel + validaciones funcionando al 100%, y reemplazaremos únicamente los componentes públicos con el nuevo diseño responsivo.
