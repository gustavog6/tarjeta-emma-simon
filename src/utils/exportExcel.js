/**
 * src/utils/exportExcel.js
 * Genera y descarga un archivo CSV compatible con Excel con BOM UTF-8
 */
export function exportConfirmacionesToCSV(titularesAgrupados) {
    const headers = [
        'Grupo',
        'Titular',
        'Teléfono',
        'Email',
        'Acompañantes Extras (+N)',
        'Capacidad Total Personas',
        'Fotos Permitidas',
        'Fotos Subidas',
        'Tipo Asistente',
        'Nombre Asistente',
        'Plato Fuerte',
        'Contornos',
        'Regalo',
        'Fecha Confirmación'
    ];

    const rows = [];

    titularesAgrupados.forEach(grupo => {
        const { titular, asistentes, fotosCount } = grupo;
        const slotsVal = Number(titular.slots_totales ?? titular.slots ?? 0);
        const totalPases = 1 + slotsVal;

        if (asistentes.length === 0) {
            // Si el titular no ha confirmado asistentes aún, listar fila base
            rows.push([
                `"${titular.grupo === 'novia' ? 'Novia' : 'Novio'}"`,
                `"${titular.nombre} ${titular.apellido}"`,
                `"${titular.telefono || ''}"`,
                `"${titular.email || ''}"`,
                slotsVal,
                totalPases,
                titular.puede_subir_fotos ? 'Sí' : 'No',
                fotosCount || 0,
                '"Pendiente"',
                '"(Sin confirmar)"',
                '"—"',
                '"—"',
                '"—"',
                '""'
            ]);
        } else {
            asistentes.forEach(asistente => {
                rows.push([
                    `"${titular.grupo === 'novia' ? 'Novia' : 'Novio'}"`,
                    `"${titular.nombre} ${titular.apellido}"`,
                    `"${titular.telefono || ''}"`,
                    `"${titular.email || ''}"`,
                    slotsVal,
                    totalPases,
                    titular.puede_subir_fotos ? 'Sí' : 'No',
                    fotosCount || 0,
                    asistente.es_titular ? '"Titular"' : '"Acompañante"',
                    `"${asistente.nombre_completo}"`,
                    `"${asistente.plato_fuerte || 'No especificado'}"`,
                    `"${(asistente.contornos || []).join(' + ')}"`,
                    `"${asistente.regalo_id || ''}"`,
                    `"${asistente.created_at ? new Date(asistente.created_at).toLocaleString() : ''}"`
                ]);
            });
        }
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Confirmaciones_Boda_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
