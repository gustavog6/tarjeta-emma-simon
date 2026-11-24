/**
 * src/config/invitationLimits.js
 * ─────────────────────────────────────────────────────────────
 * Fuente única de verdad en el frontend para límites visuales
 * (calibrados mobile-first 360px–430px) en sincronía exacta
 * con supabase/007_limites_integridad.sql.
 */

export const INVITATION_LIMITS = {
    novios: {
        nombreMax: 25,
        apellidoMax: 30,
    },
    hero: {
        badgeMax: 30,
        overlayBotonMax: 28,
    },
    saveTheDate: {
        tituloMax: 30,
        diaSemanaMax: 20,
    },
    venues: {
        min: 1,
        max: 4,
        tituloMax: 40,
        lugarMax: 60,
        direccionMax: 120,
        horaMax: 25,
        sectionTituloMax: 35,
        sectionSubtituloMax: 160,
    },
    itinerario: {
        min: 0,
        max: 8,
        tituloSectionMax: 35,
        horaMax: 15,
        tituloMax: 55,
    },
    vestimenta: {
        min: 0,
        max: 1,
        tipoMax: 40,
    },
    menu: {
        platosMin: 1,
        platosMax: 8,
        platoNombreMax: 55,
        contornosMin: 0,
        contornosMax: 10,
        contornoNombreMax: 40,
        maxContornosLimit: 6,
    },
    grupos: {
        min: 1,
        max: 6,
        nombreMax: 30,
    },
    datosBancarios: {
        min: 0,
        max: 6,
        bancoMax: 35,
        titularMax: 50,
        campoMax: 35,
        sectionTituloMax: 35,
        sectionSubtituloMax: 180,
    },
    padres: {
        nombreMax: 50,
    },
    padrinos: {
        min: 0,
        max: 6,
        nombreMax: 50,
        rolMax: 30,
    },
    galeria: {
        min: 0,
        previewMax: 6,
        totalVisibleMax: 60,
        dbMax: 120,
    },
    quote: {
        textoMax: 220,
        firmaMax: 60,
    },
    footer: {
        versiculoMax: 320,
        referenciaMax: 50,
    },
    rsvp: {
        tituloMax: 35,
        subtituloMax: 180,
        slotsMax: 15,
        nombreMax: 40,
        apellidoMax: 40,
        telefonoMax: 25,
        emailMax: 100,
    },
};

/** Recorta una lista al máximo permitido de forma segura */
export const limitList = (arr, max) => (Array.isArray(arr) ? arr.slice(0, max) : []);

/** Recorta un string si excede el máximo (renderizado defensivo ante edición directa en BD) */
export const clampText = (value, max) => {
    if (value == null) return '';
    const str = String(value).trim();
    if (!max || str.length <= max) return str;
    return `${str.slice(0, max - 1).trimEnd()}…`;
};
