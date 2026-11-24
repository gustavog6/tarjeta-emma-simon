/**
 * src/config/evento.js
 * ─────────────────────────────────────────────
 * Archivo de configuración central del evento.
 * Todos los componentes leen datos desde aquí.
 * Para reutilizar la plantilla en otro evento,
 * solo se modifica este archivo.
 */

export const evento = {
    // ─── Meta / SEO ───────────────────────────
    meta: {
        titulo: 'Emma & Simón — 31 de Enero 2026',
        descripcion: 'Estamos muy emocionados de compartir este día contigo.',
        ogImage: '/og-image-green.png',
        url: 'https://emmaysimon.netlify.app',
    },

    // URL pública usada para generar los enlaces de invitación en WhatsApp
    urlPublica: 'https://emmaysimon.netlify.app',
    plantillaWhatsapp:
        '¡Hola {nombre}! Estamos muy felices de compartir nuestro día contigo. Esta invitación es válida para {personas}. Confírmanos tu asistencia y menú antes del {fecha_limite}. Nos vemos pronto. Con amor, {novios} ✨\n\n{enlace}',

    // ─── Novios ───────────────────────────────
    novios: {
        novia: {
            nombre: 'Emma',
            apellido: 'González',
            whatsapp: '+584249743171',
        },
        novio: {
            nombre: 'Simón',
            apellido: 'España',
            whatsapp: '+584140110568',
        },
    },

    // ─── Grupos de invitados (dinámicos) ──────
    grupos: [
        { id: 'novia', nombre: 'Emma (Novia)', color: 'pink', whatsapp: '+584249743171' },
        { id: 'novio', nombre: 'Simón (Novio)', color: 'blue', whatsapp: '+584140110568' },
    ],

    // ─── Fecha y límite de RSVP ───────────────
    // Formato ISO 8601
    fecha: '2026-01-31T11:30:00',
    fechaLimiteRsvp: '2026-01-26',

    // ─── Venues ───────────────────────────────
    // tipo: 'ceremony' | 'reception' | 'live' | 'videocall'
    venues: [
        {
            id: 'ceremonia',
            tipo: 'ceremony',
            titulo: 'Ceremonia y Recepción',
            lugar: 'La Llovizna Hotel & Casino',
            direccion: 'Av. Guayana, Puerto Ordaz, Bolívar',
            hora: '11:30 AM',
            mapUrl: 'https://www.google.com/maps?q=La+Llovizna+Hotel+%26+Casino+Puerto+Ordaz&output=embed',
            externalLink: 'https://www.google.com/maps/search/?api=1&query=La+Llovizna+Hotel+%26+Casino+Puerto+Ordaz',
        },
    ],

    // ─── Itinerario ───────────────────────────
    // icono: nombre exacto del componente de lucide-react
    itinerario: [
        { hora: '11:30 AM', titulo: 'Llegada',                    icono: 'MapPin'   },
        { hora: '12:00 M',  titulo: 'Ceremonia Religiosa',         icono: 'Church'   },
        { hora: '12:45 M',  titulo: 'Brindis & Sesión de Fotos',   icono: 'Wine'     },
        { hora: '01:45 PM', titulo: 'Almuerzo & Celebración',      icono: 'Utensils' },
    ],

    // ─── Código de vestimenta ─────────────────
    // tipo: 'Formal' | 'Elegante / Casual' | 'Gala' | 'Informal'
    vestimenta: {
        tipo: 'Elegante / Casual',
    },

    // ─── Menú ─────────────────────────────────
    menu: {
        platosFuertes: [
            { id: 'pollo-grill',      nombre: 'Pechuga de pollo al grill'      },
            { id: 'pollo-limon',      nombre: 'Pechuga de pollo al limón'      },
            { id: 'pollo-parmesana',  nombre: 'Pechuga de pollo a la parmesana'},
            { id: 'asado-negro',      nombre: 'Asado Negro'                    },
            { id: 'pescado-ajillo',   nombre: 'Pescado al ajillo'              },
        ],
        contornos: [
            { id: 'vegetales',   nombre: 'Vegetales salteados' },
            { id: 'ensalada',    nombre: 'Ensalada verde'       },
            { id: 'papas-vapor', nombre: 'Papas al vapor'       },
            { id: 'papas-fritas',nombre: 'Papas fritas'         },
            { id: 'pure',        nombre: 'Puré de papas'        },
            { id: 'arroz',       nombre: 'Arroz'                },
        ],
        maxContornos: 2,
    },

    // ─── Datos bancarios (mesa de regalos) ────
    datosBancarios: [
        {
            banco: 'Banesco',
            tipo: 'Pago Móvil',
            titular: 'Emma González',
            telefono: '0424-9743171',
            cedula: '26.513.313',
        },
        {
            banco: 'Banesco',
            tipo: 'Pago Móvil',
            titular: 'Simón España',
            telefono: '0414-0110568',
            cedula: '17.047.573',
        },
        {
            banco: 'Binance',
            tipo: 'Binance Pay',
            titular: 'Emma González',
            id: '197734304',
        },
        {
            banco: 'Binance',
            tipo: 'Binance Pay',
            titular: 'Simón España',
            id: '1081211093',
        },
    ],

    // ─── Música ───────────────────────────────
    musica: {
        // Archivo en public/audio/ para evitar procesamiento de Vite
        src: '/audio/wedding-music.mp3',
        autoplay: false, // El usuario decide con el botón flotante
    },

    // ─── Textos / Copies ──────────────────────
    textos: {
        hero: {
            badge: 'Nos casamos',
        },
        saveTheDate: {
            titulo: 'Save the Date',
            diaSemana: 'Sábado',
        },
        eventCards: {
            titulo: 'Acompáñanos',
            subtitulo: 'Será un honor para nosotros contar con tu presencia en este día tan especial.',
        },
        itinerario: {
            titulo: 'Itinerario',
        },
        rsvp: {
            titulo: 'Confirmar Asistencia',
            subtitulo: 'Esperamos contar contigo. Por favor confirma tu asistencia antes del 26 de enero.',
        },
        regalos: {
            titulo: 'Mesa de Regalos',
            subtitulo: 'Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros:',
        },
        quote: {
            texto: '"Estamos muy emocionados de compartir este día contigo."',
            firma: 'Con amor, Simón & Emma',
        },
        footer: {
            versiculo: '"¡Graba mi nombre en tu corazón! ¡Graba mi imagen en tu brazo! ¡Tan fuerte es el amor como la muerte! ¡Tan cierta es la pasión como la tumba! ¡El fuego del amor es una llama que Dios mismo ha encendido!"',
            referencia: 'Cantares 8:6-7 TLA',
        },
        overlay: {
            boton: 'Abrir invitación',
        },
    },

    // ─── Padres ───────────────────────────────
    padres: {
        novia: {
            padre: 'Sr. Carlos González',
            madre: 'Sra. Elena de González',
        },
        novio: {
            padre: 'Sr. Simón España',
            madre: 'Sra. Carmen de España',
        },
    },

    // ─── Padrinos ─────────────────────────────
    padrinos: [
        { nombre: 'Sr. Roberto Méndez', rol: 'Padrino' },
        { nombre: 'Sra. María Valentina Rossi', rol: 'Madrina' },
    ],

    // ─── Galería compartida ───────────────────
    galeria: {
        habilitada: true,
        moderacionManual: true, // fotos deben aprobarse antes de aparecer
    },
};
