/**
 * src/utils/exportExcel.js
 * Genera un reporte Excel (.xlsx) estilizado con ExcelJS en armonía visual con el reporte PDF:
 *   • Hoja 1: Confirmaciones (título, métricas, encabezados verde salvia, filas alternas, autofiltro, fila de totales)
 *   • Hoja 2: Resumen Catering (resumen general, desglose por grupo, platos fuertes y contornos con fórmulas =SUM)
 */
import ExcelJS from 'exceljs';
import { labelOf, nombreCompletoDe } from './menu';
import { grupoLabel } from './grupos';

const COLORS = {
    titleText: 'FF416444',
    headerBg: 'FF658F68',
    subHeaderBg: 'FF4B5563',
    zebraBg: 'FFF7FAF7',
    totalBg: 'FFF3F4F6',
    borderLight: 'FFE5E7EB',
    borderPrimary: 'FF658F68',
    mutedText: 'FF6B7280',
    darkText: 'FF1F2937',
    white: 'FFFFFFFF',
};

const THIN_BORDER = {
    top: { style: 'thin', color: { argb: COLORS.borderLight } },
    left: { style: 'thin', color: { argb: COLORS.borderLight } },
    bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
    right: { style: 'thin', color: { argb: COLORS.borderLight } },
};

function styleHeaderRow(row, bgArgb = COLORS.headerBg) {
    row.height = 24;
    row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = THIN_BORDER;
    });
}

function styleTotalRow(row) {
    row.height = 22;
    row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalBg } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.darkText } };
        cell.border = {
            top: { style: 'medium', color: { argb: COLORS.borderPrimary } },
            left: { style: 'thin', color: { argb: COLORS.borderLight } },
            bottom: { style: 'thin', color: { argb: COLORS.borderPrimary } },
            right: { style: 'thin', color: { argb: COLORS.borderLight } },
        };
    });
}

export async function exportConfirmacionesToXLSX(titularesAgrupados, config, grupoFilter = 'todos') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Invitación Digital';
    wb.created = new Date();

    const platos = config?.menu?.platosFuertes || [];
    const contornos = config?.menu?.contornos || [];
    const grupos = config?.grupos || [];
    const nombreNovia = config?.novios?.novia?.nombre || 'Novia';
    const nombreNovio = config?.novios?.novio?.nombre || 'Novio';
    const pareja = `${nombreNovio} & ${nombreNovia}`;

    const totalPases = titularesAgrupados.reduce(
        (acc, g) => acc + 1 + Number(g.titular.slots_totales ?? g.titular.slots ?? 0),
        0
    );
    const totalConfirmados = titularesAgrupados.reduce((acc, g) => acc + g.asistentes.length, 0);
    const filtroTexto =
        grupoFilter === 'todos' ? 'Todos los grupos' : grupoLabel(grupos, grupoFilter);

    // ══════════════════════════════════════════════════════════════════
    // HOJA 1: CONFIRMACIONES
    // ══════════════════════════════════════════════════════════════════
    const ws = wb.addWorksheet('Confirmaciones', {
        views: [{ state: 'frozen', ySplit: 4 }],
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // Título (Fila 1)
    ws.mergeCells('A1:K1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Reporte de Confirmaciones — ${pareja}`;
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: COLORS.titleText } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(1).height = 28;

    // Metadatos (Fila 2)
    ws.mergeCells('A2:K2');
    const metaCell = ws.getCell('A2');
    metaCell.value = `Generado: ${new Date().toLocaleString('es-ES')}  |  Filtro: ${filtroTexto}  |  Familias: ${titularesAgrupados.length}  |  Pases asignados: ${totalPases}  |  Confirmados: ${totalConfirmados}`;
    metaCell.font = { name: 'Calibri', size: 9.5, color: { argb: COLORS.mutedText } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(2).height = 18;

    ws.getRow(3).height = 8;

    // Encabezados (Fila 4)
    const headers = [
        'Grupo',
        'Titular',
        'Teléfono',
        'Email',
        'Cupo',
        'Rol',
        'Asistente',
        'Plato Fuerte',
        'Contornos',
        'Fotos',
        'Fecha Confirmación',
    ];
    const headerRow = ws.getRow(4);
    headerRow.values = headers;
    styleHeaderRow(headerRow, COLORS.headerBg);
    headerRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };

    // Anchos de columna
    ws.columns = [
        { width: 16 }, // Grupo
        { width: 22 }, // Titular
        { width: 17 }, // Teléfono
        { width: 24 }, // Email
        { width: 10 }, // Cupo
        { width: 15 }, // Rol
        { width: 24 }, // Asistente
        { width: 28 }, // Plato Fuerte
        { width: 30 }, // Contornos
        { width: 10 }, // Fotos
        { width: 20 }, // Fecha
    ];

    const conteoPlatos = {};
    const conteoContornos = {};
    const conteoGrupos = {};
    let rowIdx = 5;
    let familyToggle = false;

    titularesAgrupados.forEach(({ titular, asistentes, fotosCount }) => {
        const slotsVal = Number(titular.slots_totales ?? titular.slots ?? 0);
        const totalCap = 1 + slotsVal;
        const grupoTxt = grupoLabel(grupos, titular.grupo);
        const titularNombre = `${titular.nombre} ${titular.apellido}`.trim();
        familyToggle = !familyToggle;

        conteoGrupos[grupoTxt] = (conteoGrupos[grupoTxt] || 0) + asistentes.length;

        const lista = asistentes.length > 0 ? asistentes : [null];

        lista.forEach((a, idx) => {
            const isFirst = idx === 0;
            const platoTxt = a ? labelOf(platos, a.plato_fuerte) : '—';
            const contornosTxt = a
                ? (a.contornos || []).map((id) => labelOf(contornos, id)).join(', ') || '—'
                : '—';

            if (a) {
                conteoPlatos[platoTxt] = (conteoPlatos[platoTxt] || 0) + 1;
                (a.contornos || []).forEach((id) => {
                    const cLabel = labelOf(contornos, id);
                    conteoContornos[cLabel] = (conteoContornos[cLabel] || 0) + 1;
                });
            }

            const row = ws.getRow(rowIdx);
            row.values = [
                isFirst ? grupoTxt : '',
                isFirst ? titularNombre : '',
                isFirst ? titular.telefono || '—' : '',
                isFirst ? titular.email || '—' : '',
                isFirst ? `${asistentes.length} / ${totalCap}` : '',
                a ? (a.es_titular ? 'Titular' : 'Acompañante') : 'Pendiente',
                a ? (a.es_titular ? nombreCompletoDe(a) : `↳ ${nombreCompletoDe(a)}`) : '(Sin confirmar)',
                platoTxt,
                contornosTxt,
                isFirst ? (fotosCount > 0 ? fotosCount : titular.puede_subir_fotos ? 'Sí (0)' : 'No') : '',
                a?.created_at ? new Date(a.created_at).toLocaleString('es-ES') : '',
            ];
            row.height = 20;

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                if (familyToggle) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebraBg } };
                }
                cell.font = {
                    name: 'Calibri',
                    size: 9.5,
                    bold: (colNumber === 2 && isFirst) || (colNumber === 7 && Boolean(a?.es_titular)),
                    color: { argb: colNumber === 6 && !a?.es_titular ? COLORS.mutedText : COLORS.darkText },
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: colNumber === 5 || colNumber === 10 ? 'center' : 'left',
                    wrapText: colNumber === 8 || colNumber === 9,
                };
                cell.border = THIN_BORDER;
            });

            rowIdx++;
        });
    });

    // Fila de totales al final
    const totalRow = ws.getRow(rowIdx);
    totalRow.values = [
        'TOTAL',
        `${titularesAgrupados.length} familia(s)`,
        '',
        '',
        `${totalConfirmados} / ${totalPases}`,
        '',
        `${totalConfirmados} asistente(s) confirmado(s)`,
        '',
        '',
        '',
        '',
    ];
    styleTotalRow(totalRow);
    totalRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

    ws.autoFilter = { from: 'A4', to: 'K4' };

    // ══════════════════════════════════════════════════════════════════
    // HOJA 2: RESUMEN CATERING
    // ══════════════════════════════════════════════════════════════════
    const wsRes = wb.addWorksheet('Resumen Catering', {
        pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    wsRes.columns = [
        { width: 24 },
        { width: 38 },
        { width: 14 },
    ];

    wsRes.mergeCells('A1:C1');
    const resTitle = wsRes.getCell('A1');
    resTitle.value = `Resumen para Catering — ${pareja}`;
    resTitle.font = { name: 'Calibri', size: 15, bold: true, color: { argb: COLORS.titleText } };
    wsRes.getRow(1).height = 28;

    wsRes.mergeCells('A2:C2');
    const resMeta = wsRes.getCell('A2');
    resMeta.value = `Filtro: ${filtroTexto}  |  Generado: ${new Date().toLocaleString('es-ES')}`;
    resMeta.font = { name: 'Calibri', size: 9.5, color: { argb: COLORS.mutedText } };
    wsRes.getRow(2).height = 18;

    let r = 4;

    // Bloque 1: Resumen General + Desglose por Grupo
    const hGen = wsRes.getRow(r++);
    hGen.values = ['Resumen General', 'Detalle', 'Cantidad'];
    styleHeaderRow(hGen, COLORS.headerBg);
    hGen.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    const generalRows = [
        ['Familias confirmadas', 'Titulares con al menos 1 asistente', titularesAgrupados.length],
        ['Pases asignados', 'Capacidad total de las familias listadas', totalPases],
        ['Personas confirmadas', 'Total asistentes a servir', totalConfirmados],
        ...Object.entries(conteoGrupos).map(([grp, cnt]) => ['Por grupo', grp, cnt]),
    ];

    generalRows.forEach((vals, i) => {
        const row = wsRes.getRow(r++);
        row.values = vals;
        row.height = 20;
        row.eachCell((cell, col) => {
            if (i % 2 === 1) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebraBg } };
            }
            cell.font = { name: 'Calibri', size: 10, bold: col === 3 };
            cell.alignment = { vertical: 'middle', horizontal: col === 3 ? 'center' : 'left' };
            cell.border = THIN_BORDER;
        });
    });

    r += 1;

    // Helper para bloques de Platos y Contornos con fórmula =SUM
    const addMenuBlock = (titulo, entradas) => {
        if (entradas.length === 0) return;
        const hRow = wsRes.getRow(r++);
        hRow.values = ['Categoría', titulo, 'Cantidad'];
        styleHeaderRow(hRow, COLORS.subHeaderBg);
        hRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

        const startRow = r;
        entradas.forEach(([nombre, cantidad], i) => {
            const row = wsRes.getRow(r++);
            row.values = [titulo, nombre, cantidad];
            row.height = 20;
            row.eachCell((cell, col) => {
                if (i % 2 === 1) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebraBg } };
                }
                cell.font = { name: 'Calibri', size: 10, bold: col === 3 };
                cell.alignment = { vertical: 'middle', horizontal: col === 3 ? 'center' : 'left' };
                cell.border = THIN_BORDER;
            });
        });
        const endRow = r - 1;

        const tRow = wsRes.getRow(r++);
        tRow.values = ['', `Total ${titulo}`, { formula: `SUM(C${startRow}:C${endRow})` }];
        styleTotalRow(tRow);
        tRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        r += 1;
    };

    addMenuBlock('Platos Fuertes', Object.entries(conteoPlatos));
    addMenuBlock('Contornos / Guarniciones', Object.entries(conteoContornos));

    // Descargar archivo .xlsx
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Confirmaciones_Boda_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
