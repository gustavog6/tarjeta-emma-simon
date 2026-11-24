/**
 * src/config/evento.js
 * ─────────────────────────────────────────────────────────────
 * Estructura base neutra (sin datos de ninguna boda específica).
 * Toda la información real del evento vive en Supabase y se edita
 * desde el Panel de Administración (?admin=true → Configuración).
 *
 * Únicos ajustes locales: archivo de audio y flag de galería.
 */

export const evento = {
    urlPublica: '',
    plantillaWhatsapp:
        '¡Hola {nombre}! Estamos muy felices de compartir nuestro día contigo. Esta invitación es válida para {personas}. Confírmanos tu asistencia y menú antes del {fecha_limite}. Nos vemos pronto. Con amor, {novios} ✨\n\n{enlace}',

    novios: {
        novia: { nombre: '', apellido: '', whatsapp: '' },
        novio: { nombre: '', apellido: '', whatsapp: '' },
    },

    grupos: [],
    fecha: '',
    fechaLimiteRsvp: '',
    venues: [],
    itinerario: [],
    vestimenta: { tipo: '' },

    menu: {
        platosFuertes: [],
        contornos: [],
        maxContornos: 2,
    },

    datosBancarios: [],

    padres: {
        novia: { padre: '', madre: '' },
        novio: { padre: '', madre: '' },
    },

    padrinos: [],

    textos: {
        hero: { badge: '' },
        saveTheDate: { titulo: 'Save the Date', diaSemana: '' },
        eventCards: { titulo: 'Acompáñanos', subtitulo: '' },
        itinerario: { titulo: 'Itinerario' },
        rsvp: { titulo: 'Confirmar Asistencia', subtitulo: '' },
        regalos: { titulo: 'Mesa de Regalos', subtitulo: '' },
        quote: { texto: '', firma: '' },
        footer: { versiculo: '', referencia: '' },
        overlay: { boton: 'Abrir invitación' },
    },

    // Ajustes locales (assets estáticos)
    musica: {
        src: '/audio/wedding-music.mp3',
        autoplay: false,
    },

    galeria: {
        habilitada: true,
        moderacionManual: true,
    },
};
