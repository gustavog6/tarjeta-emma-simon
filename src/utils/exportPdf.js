/**
 * src/utils/exportPdf.js
 * Genera un reporte PDF listo para imprimir (lista de confirmaciones + resumen de catering).
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { labelOf, nombreCompletoDe } from './menu';

export function exportConfirmacionesToPDF(titularesAgrupados, config, grupoFilter = 'todos') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const platos = config?.menu?.platosFuertes || [];
    const contornos = config?.menu?.contornos || [];
    const nombreNovia = config?.novios?.novia?.nombre || 'Novia';
    const nombreNovio = config?.novios?.novio?.nombre || 'Novio';

    const totalPases = titularesAgrupados.reduce(
        (acc, g) => acc + 1 + Number(g.titular.slots_totales ?? g.titular.slots ?? 0),
        0
    );
    const totalConfirmados = titularesAgrupados.reduce((acc, g) => acc + g.asistentes.length, 0);

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(65, 100, 68);
    doc.text(`Reporte de Confirmaciones — ${nombreNovio} & ${nombreNovia}`, 40, 40);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const filtroTexto =
        grupoFilter === 'todos' ? 'Todos los grupos' : grupoFilter === 'novia' ? nombreNovia : nombreNovio;
    doc.text(
        `Generado: ${new Date().toLocaleString('es-ES')}  |  Filtro: ${filtroTexto}  |  Familias: ${titularesAgrupados.length}  |  Pases totales: ${totalPases}  |  Confirmados: ${totalConfirmados}`,
        40,
        56
    );

    const body = [];
    const conteoPlatos = {};
    const conteoContornos = {};

    titularesAgrupados.forEach(({ titular, asistentes }) => {
        const grupoLabel = titular.grupo === 'novia' ? nombreNovia : nombreNovio;
        const titularNombre = `${titular.nombre} ${titular.apellido}`.trim();
        const totalCap = 1 + Number(titular.slots_totales ?? titular.slots ?? 0);

        if (asistentes.length === 0) {
            body.push([
                grupoLabel,
                titularNombre,
                titular.telefono || '—',
                `0 / ${totalCap}`,
                'Pendiente',
                '(Sin confirmar)',
                '—',
                '—',
            ]);
        } else {
            asistentes.forEach((a, idx) => {
                const platoLabel = labelOf(platos, a.plato_fuerte);
                const contornosLabel =
                    (a.contornos || []).map((id) => labelOf(contornos, id)).join(', ') || '—';

                conteoPlatos[platoLabel] = (conteoPlatos[platoLabel] || 0) + 1;
                (a.contornos || []).forEach((id) => {
                    const cLabel = labelOf(contornos, id);
                    conteoContornos[cLabel] = (conteoContornos[cLabel] || 0) + 1;
                });

                body.push([
                    idx === 0 ? grupoLabel : '',
                    idx === 0 ? titularNombre : '',
                    idx === 0 ? titular.telefono || '—' : '',
                    idx === 0 ? `${asistentes.length} / ${totalCap}` : '',
                    a.es_titular ? 'Titular' : 'Acompañante',
                    nombreCompletoDe(a),
                    platoLabel,
                    contornosLabel,
                ]);
            });
        }
    });

    autoTable(doc, {
        startY: 70,
        head: [['Grupo', 'Titular', 'Teléfono', 'Cupo', 'Rol', 'Asistente', 'Plato Fuerte', 'Contornos']],
        body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [101, 143, 104], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [247, 250, 247] },
    });

    // Tabla de resumen para catering al final
    const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 24 : 70;
    const resumenBody = [
        ...Object.entries(conteoPlatos).map(([k, v]) => ['Plato Fuerte', k, String(v)]),
        ...Object.entries(conteoContornos).map(([k, v]) => ['Contorno', k, String(v)]),
    ];

    if (resumenBody.length > 0) {
        autoTable(doc, {
            startY: finalY,
            head: [['Categoría', 'Opción de Menú', 'Cantidad']],
            body: resumenBody,
            tableWidth: 360,
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [75, 85, 99], textColor: 255, fontStyle: 'bold' },
        });
    }

    const fecha = new Date().toISOString().slice(0, 10);
    doc.save(`Confirmaciones_Boda_${fecha}.pdf`);
}
