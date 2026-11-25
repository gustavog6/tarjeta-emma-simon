/**
 * src/utils/exportExcel.js
 * Generates a styled Excel (.xlsx) report with ExcelJS matching the PDF report layout.
 */
import ExcelJS from 'exceljs';
import { getMenuItemLabel, getAttendeeFullName } from './menuUtils';
import { getGroupLabel } from './groupUtils';
import { formatHostsNames, getEventSlug } from '../config/eventPresets';

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

export async function exportRsvpToXlsx(groupedGuests, config, groupFilter = 'all') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Invitación Digital';
    wb.created = new Date();

    const mainCourses = config?.menu?.mainCourses || [];
    const sides = config?.menu?.sides || [];
    const groups = config?.groups || [];
    const hostsTitle = formatHostsNames(config?.hosts);

    const totalPasses = groupedGuests.reduce(
        (acc, g) => acc + 1 + Number(g.guest.extra_passes ?? 0),
        0
    );
    const totalConfirmed = groupedGuests.reduce((acc, g) => acc + g.attendees.length, 0);
    const filterText =
        groupFilter === 'all' ? 'Todos los grupos' : getGroupLabel(groups, groupFilter);

    // ══════════════════════════════════════════════════════════════════
    // SHEET 1: CONFIRMACIONES
    // ══════════════════════════════════════════════════════════════════
    const ws = wb.addWorksheet('Confirmaciones', {
        views: [{ state: 'frozen', ySplit: 4 }],
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    ws.mergeCells('A1:K1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Reporte de Confirmaciones — ${hostsTitle}`;
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: COLORS.titleText } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(1).height = 28;

    ws.mergeCells('A2:K2');
    const metaCell = ws.getCell('A2');
    metaCell.value = `Generado: ${new Date().toLocaleString('es-ES')}  |  Filtro: ${filterText}  |  Invitaciones: ${groupedGuests.length}  |  Pases asignados: ${totalPasses}  |  Confirmados: ${totalConfirmed}`;
    metaCell.font = { name: 'Calibri', size: 9.5, color: { argb: COLORS.mutedText } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(2).height = 18;

    ws.getRow(3).height = 8;

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

    ws.columns = [
        { width: 16 },
        { width: 22 },
        { width: 17 },
        { width: 24 },
        { width: 10 },
        { width: 15 },
        { width: 24 },
        { width: 28 },
        { width: 30 },
        { width: 10 },
        { width: 20 },
    ];

    const mainCourseCounts = {};
    const sideCounts = {};
    const groupCounts = {};
    let rowIdx = 5;
    let zebraToggle = false;

    groupedGuests.forEach(({ guest, attendees, photosCount }) => {
        const extraVal = Number(guest.extra_passes ?? 0);
        const totalCap = 1 + extraVal;
        const groupTxt = getGroupLabel(groups, guest.group_id);
        const primaryName = `${guest.first_name} ${guest.last_name}`.trim();
        zebraToggle = !zebraToggle;

        groupCounts[groupTxt] = (groupCounts[groupTxt] || 0) + attendees.length;

        const list = attendees.length > 0 ? attendees : [null];

        list.forEach((a, idx) => {
            const isFirst = idx === 0;
            const courseTxt = a ? getMenuItemLabel(mainCourses, a.main_course_id) : '—';
            const sidesTxt = a
                ? (a.side_ids || []).map((id) => getMenuItemLabel(sides, id)).join(', ') || '—'
                : '—';

            if (a) {
                mainCourseCounts[courseTxt] = (mainCourseCounts[courseTxt] || 0) + 1;
                (a.side_ids || []).forEach((id) => {
                    const sLabel = getMenuItemLabel(sides, id);
                    sideCounts[sLabel] = (sideCounts[sLabel] || 0) + 1;
                });
            }

            const row = ws.getRow(rowIdx);
            row.values = [
                isFirst ? groupTxt : '',
                isFirst ? primaryName : '',
                isFirst ? guest.phone || '—' : '',
                isFirst ? guest.email || '—' : '',
                isFirst ? `${attendees.length} / ${totalCap}` : '',
                a ? (a.is_primary ? 'Titular' : 'Acompañante') : 'Pendiente',
                a ? (a.is_primary ? getAttendeeFullName(a) : `↳ ${getAttendeeFullName(a)}`) : '(Sin confirmar)',
                courseTxt,
                sidesTxt,
                isFirst ? (photosCount > 0 ? photosCount : guest.can_upload_photos ? 'Sí (0)' : 'No') : '',
                a?.created_at ? new Date(a.created_at).toLocaleString('es-ES') : '',
            ];
            row.height = 20;

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                if (zebraToggle) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebraBg } };
                }
                cell.font = {
                    name: 'Calibri',
                    size: 9.5,
                    bold: (colNumber === 2 && isFirst) || (colNumber === 7 && Boolean(a?.is_primary)),
                    color: { argb: colNumber === 6 && !a?.is_primary ? COLORS.mutedText : COLORS.darkText },
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

    const totalRow = ws.getRow(rowIdx);
    totalRow.values = [
        'TOTAL',
        `${groupedGuests.length} invitación(es)`,
        '',
        '',
        `${totalConfirmed} / ${totalPasses}`,
        '',
        `${totalConfirmed} asistente(s) confirmado(s)`,
        '',
        '',
        '',
        '',
    ];
    styleTotalRow(totalRow);
    totalRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

    ws.autoFilter = { from: 'A4', to: 'K4' };

    // ══════════════════════════════════════════════════════════════════
    // SHEET 2: RESUMEN CATERING
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
    resTitle.value = `Resumen para Catering — ${hostsTitle}`;
    resTitle.font = { name: 'Calibri', size: 15, bold: true, color: { argb: COLORS.titleText } };
    wsRes.getRow(1).height = 28;

    wsRes.mergeCells('A2:C2');
    const resMeta = wsRes.getCell('A2');
    resMeta.value = `Filtro: ${filterText}  |  Generado: ${new Date().toLocaleString('es-ES')}`;
    resMeta.font = { name: 'Calibri', size: 9.5, color: { argb: COLORS.mutedText } };
    wsRes.getRow(2).height = 18;

    let r = 4;

    const hGen = wsRes.getRow(r++);
    hGen.values = ['Resumen General', 'Detalle', 'Cantidad'];
    styleHeaderRow(hGen, COLORS.headerBg);
    hGen.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    const generalRows = [
        ['Invitaciones confirmadas', 'Titulares con al menos 1 asistente', groupedGuests.length],
        ['Pases asignados', 'Capacidad total de las invitaciones listadas', totalPasses],
        ['Personas confirmadas', 'Total asistentes a servir', totalConfirmed],
        ...Object.entries(groupCounts).map(([grp, cnt]) => ['Por grupo', grp, cnt]),
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

    const addMenuBlock = (title, entries) => {
        if (entries.length === 0) return;
        const hRow = wsRes.getRow(r++);
        hRow.values = ['Categoría', title, 'Cantidad'];
        styleHeaderRow(hRow, COLORS.subHeaderBg);
        hRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

        const startRow = r;
        entries.forEach(([name, count], i) => {
            const row = wsRes.getRow(r++);
            row.values = [title, name, count];
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
        tRow.values = ['', `Total ${title}`, { formula: `SUM(C${startRow}:C${endRow})` }];
        styleTotalRow(tRow);
        tRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        r += 1;
    };

    addMenuBlock('Platos Fuertes', Object.entries(mainCourseCounts));
    addMenuBlock('Contornos / Guarniciones', Object.entries(sideCounts));

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = getEventSlug(config?.eventType);
    a.download = `Confirmaciones_${slug}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
