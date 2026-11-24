/**
 * src/utils/exportExcel.js
 * Exporta confirmaciones a Excel (.xlsx real con SheetJS) con hoja de detalle y hoja de resumen para catering.
 */
import * as XLSX from 'xlsx';
import { labelOf, nombreCompletoDe } from './menu';
import { grupoLabel } from './grupos';

export function buildConfirmacionesRows(titularesAgrupados, config) {
    const platos = config?.menu?.platosFuertes || [];
    const contornos = config?.menu?.contornos || [];
    const grupos = config?.grupos || [];

    const rows = [];

    titularesAgrupados.forEach(({ titular, asistentes, fotosCount }) => {
        const slotsVal = Number(titular.slots_totales ?? titular.slots ?? 0);
        const totalPases = 1 + slotsVal;
        const grupoTxt = grupoLabel(grupos, titular.grupo);
        const titularNombre = `${titular.nombre} ${titular.apellido}`.trim();

        if (asistentes.length === 0) {
            rows.push({
                Grupo: grupoTxt,
                Titular: titularNombre,
                Teléfono: titular.telefono || '',
                Email: titular.email || '',
                'Acompañantes (+N)': slotsVal,
                'Capacidad Total': totalPases,
                'Fotos Permitidas': titular.puede_subir_fotos ? 'Sí' : 'No',
                'Fotos Subidas': fotosCount || 0,
                Rol: 'Pendiente',
                Asistente: '(Sin confirmar)',
                'Plato Fuerte': '—',
                Contornos: '—',
                'Fecha Confirmación': '',
            });
        } else {
            asistentes.forEach((asistente) => {
                rows.push({
                    Grupo: grupoTxt,
                    Titular: titularNombre,
                    Teléfono: titular.telefono || '',
                    Email: titular.email || '',
                    'Acompañantes (+N)': slotsVal,
                    'Capacidad Total': totalPases,
                    'Fotos Permitidas': titular.puede_subir_fotos ? 'Sí' : 'No',
                    'Fotos Subidas': fotosCount || 0,
                    Rol: asistente.es_titular ? 'Titular' : `Acomp. de ${titular.nombre}`,
                    Asistente: nombreCompletoDe(asistente),
                    'Plato Fuerte': labelOf(platos, asistente.plato_fuerte),
                    Contornos: (asistente.contornos || []).map((id) => labelOf(contornos, id)).join(' + ') || '—',
                    'Fecha Confirmación': asistente.created_at
                        ? new Date(asistente.created_at).toLocaleString('es-ES')
                        : '',
                });
            });
        }
    });

    return rows;
}

export function exportConfirmacionesToXLSX(titularesAgrupados, config) {
    const rows = buildConfirmacionesRows(titularesAgrupados, config);
    const platos = config?.menu?.platosFuertes || [];
    const contornos = config?.menu?.contornos || [];

    // Hoja 1: Detalle
    const wsDetalle = XLSX.utils.json_to_sheet(rows);
    wsDetalle['!cols'] = [
        { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 24 },
        { wch: 16 }, { wch: 14 }, { wch: 15 }, { wch: 13 },
        { wch: 18 }, { wch: 24 }, { wch: 30 }, { wch: 32 }, { wch: 20 },
    ];

    // Hoja 2: Resumen de Catering (conteo por plato y por contorno)
    const conteoPlatos = {};
    const conteoContornos = {};
    let totalConfirmados = 0;

    titularesAgrupados.forEach(({ asistentes }) => {
        asistentes.forEach((a) => {
            totalConfirmados++;
            const p = labelOf(platos, a.plato_fuerte);
            conteoPlatos[p] = (conteoPlatos[p] || 0) + 1;
            (a.contornos || []).forEach((id) => {
                const c = labelOf(contornos, id);
                conteoContornos[c] = (conteoContornos[c] || 0) + 1;
            });
        });
    });

    const resumenRows = [
        { Categoría: 'RESUMEN GENERAL', Ítem: 'Total familias (filtro)', Cantidad: titularesAgrupados.length },
        {
            Categoría: 'RESUMEN GENERAL',
            Ítem: 'Total pases potenciales',
            Cantidad: titularesAgrupados.reduce((acc, g) => acc + 1 + Number(g.titular.slots_totales ?? g.titular.slots ?? 0), 0),
        },
        { Categoría: 'RESUMEN GENERAL', Ítem: 'Total personas confirmadas', Cantidad: totalConfirmados },
        ...Object.entries(conteoPlatos).map(([k, v]) => ({ Categoría: 'Plato Fuerte', Ítem: k, Cantidad: v })),
        ...Object.entries(conteoContornos).map(([k, v]) => ({ Categoría: 'Contorno', Ítem: k, Cantidad: v })),
    ];

    const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
    wsResumen['!cols'] = [{ wch: 20 }, { wch: 36 }, { wch: 12 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Confirmaciones');
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Catering');

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Confirmaciones_Boda_${fecha}.xlsx`);
}
