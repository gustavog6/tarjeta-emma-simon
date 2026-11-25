/**
 * src/config/defaultEventSettings.js
 * ─────────────────────────────────────────────────────────────
 * Neutral baseline structure. All live data is loaded from Supabase
 * (`event_settings` + relational tables) via EventConfigContext.
 */

export const defaultEventSettings = {
    eventType: 'wedding',
    publicUrl: '',
    whatsappTemplate:
        '¡Hola {guest_name}! Estamos muy felices de compartir este día contigo. Esta invitación es válida para {passes}. Confírmanos tu asistencia y menú antes del {rsvp_deadline}. Nos vemos pronto. Con cariño, {hosts} ✨\n\n{link}',

    hosts: {
        primary: { firstName: '', lastName: '', phone: '' },
        secondary: { firstName: '', lastName: '', phone: '' },
    },

    groups: [],
    eventDate: '',
    rsvpDeadline: '',
    locations: [],
    schedule: [],
    dressCode: { label: '' },

    menu: {
        mainCourses: [],
        sides: [],
        maxSides: 2,
    },

    paymentAccounts: [],

    featuredGroups: {
        sectionTitle: 'Menciones Especiales',
        groupA: { label: '', member1: '', member2: '' },
        groupB: { label: '', member1: '', member2: '' },
    },

    specialMentions: {
        title: 'Invitados de Honor',
        items: [],
    },

    copy: {
        hero: { badge: '' },
        dateSection: { title: 'Save the Date', weekdayLabel: '' },
        locations: { title: 'Acompáñanos', subtitle: '' },
        schedule: { title: 'Itinerario' },
        rsvp: {
            title: 'Confirmar Asistencia',
            subtitle: '',
            groupPrompt: '¿Con cuál grupo nos acompañas?',
            whatsappIntro: '¡Hola! Confirmo asistencia a la invitación de {hosts} ✨',
        },
        contributions: { title: 'Mesa de Regalos', subtitle: '' },
        closing: { quote: '', signature: '' },
        footer: { note: '', reference: '' },
        welcome: { buttonLabel: 'Abrir invitación' },
        sharing: {
            calendarTitleTemplate: 'Evento — {hosts}',
            calendarDescriptionTemplate: 'Te esperamos en {venue}.',
            storyBadge: '¡ESTÁS INVITADO!',
            storyFooter: '"Acompáñanos en este día especial"',
        },
    },

    audio: {
        src: '/audio/ambient-music.mp3',
        autoplay: false,
    },

    gallery: {
        enabled: true,
        manualModeration: true,
    },
};
