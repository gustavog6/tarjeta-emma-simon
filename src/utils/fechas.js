/**
 * Utilidades de fecha con manejo correcto de zona horaria.
 *
 * Problema que resuelven: new Date('2026-01-26') se interpreta como UTC y,
 * en Venezuela (UTC-4), se muestra como 25 de enero. Aquí una fecha sin hora
 * se interpreta SIEMPRE como fecha local.
 */

export const parseFecha = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00`);
    return new Date(v);
};

export const formatFechaLarga = (v) => {
    const d = parseFecha(v);
    if (!d || isNaN(d)) return '';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

const pad = (n) => String(n).padStart(2, '0');

/** ISO / Date → 'YYYY-MM-DDTHH:mm' en hora local (para <input type="datetime-local">) */
export const toDateTimeLocal = (v) => {
    const d = parseFecha(v);
    if (!d || isNaN(d)) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 'YYYY-MM-DDTHH:mm' local → ISO UTC */
export const fromDateTimeLocal = (s) => (s ? new Date(s).toISOString() : '');

/** ISO / Date → 'YYYY-MM-DD' en hora local (para <input type="date">) */
export const toDateInput = (v) => {
    const d = parseFecha(v);
    if (!d || isNaN(d)) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** 'YYYY-MM-DD' local → ISO UTC al final de ese día (23:59:59 local) */
export const fromDateInputEndOfDay = (s) => (s ? new Date(`${s}T23:59:59`).toISOString() : '');
