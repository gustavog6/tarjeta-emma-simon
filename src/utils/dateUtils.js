/**
 * src/utils/dateUtils.js
 * Timezone-safe date helpers (prevents UTC midnight shifting dates backward in Americas).
 */

export const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
    return new Date(value);
};

export const formatLongDate = (value) => {
    const d = parseDate(value);
    if (!d || isNaN(d)) return '';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

const pad = (n) => String(n).padStart(2, '0');

export const toDateTimeLocal = (value) => {
    const d = parseDate(value);
    if (!d || isNaN(d)) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromDateTimeLocal = (str) => (str ? new Date(str).toISOString() : '');

export const toDateInput = (value) => {
    const d = parseDate(value);
    if (!d || isNaN(d)) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fromDateInputEndOfDay = (str) => (str ? new Date(`${str}T23:59:59`).toISOString() : '');
