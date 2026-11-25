/**
 * src/utils/exportPdf.js
 * Generates a print-ready PDF report (confirmed attendees + catering summary).
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMenuItemLabel, getAttendeeFullName } from './menuUtils';
import { getGroupLabel } from './groupUtils';
import { formatHostsNames, getEventSlug } from '../config/eventPresets';

export function exportRsvpToPdf(groupedGuests, config, groupFilter = 'all') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const mainCourses = config?.menu?.mainCourses || [];
    const sides = config?.menu?.sides || [];
    const groups = config?.groups || [];
    const hostsTitle = formatHostsNames(config?.hosts);

    const totalPasses = groupedGuests.reduce(
        (acc, g) => acc + 1 + Number(g.guest.extra_passes ?? 0),
        0
    );
    const totalConfirmed = groupedGuests.reduce((acc, g) => acc + g.attendees.length, 0);

    doc.setFontSize(16);
    doc.setTextColor(65, 100, 68);
    doc.text(`Reporte de Confirmaciones — ${hostsTitle}`, 40, 40);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const filterText =
        groupFilter === 'all' ? 'Todos los grupos' : getGroupLabel(groups, groupFilter);
    doc.text(
        `Generado: ${new Date().toLocaleString('es-ES')}  |  Filtro: ${filterText}  |  Invitaciones: ${groupedGuests.length}  |  Pases asignados: ${totalPasses}  |  Confirmados: ${totalConfirmed}`,
        40,
        56
    );

    const body = [];
    const mainCourseCounts = {};
    const sideCounts = {};

    groupedGuests.forEach(({ guest, attendees }) => {
        const groupTxt = getGroupLabel(groups, guest.group_id);
        const primaryName = `${guest.first_name} ${guest.last_name}`.trim();
        const totalCap = 1 + Number(guest.extra_passes ?? 0);

        if (attendees.length === 0) {
            body.push([
                groupTxt,
                primaryName,
                guest.phone || '—',
                `0 / ${totalCap}`,
                'Pendiente',
                '(Sin confirmar)',
                '—',
                '—',
            ]);
        } else {
            attendees.forEach((a, idx) => {
                const courseLabel = getMenuItemLabel(mainCourses, a.main_course_id);
                const sidesLabel =
                    (a.side_ids || []).map((id) => getMenuItemLabel(sides, id)).join(', ') || '—';

                mainCourseCounts[courseLabel] = (mainCourseCounts[courseLabel] || 0) + 1;
                (a.side_ids || []).forEach((id) => {
                    const sLabel = getMenuItemLabel(sides, id);
                    sideCounts[sLabel] = (sideCounts[sLabel] || 0) + 1;
                });

                body.push([
                    idx === 0 ? groupTxt : '',
                    idx === 0 ? primaryName : '',
                    idx === 0 ? guest.phone || '—' : '',
                    idx === 0 ? `${attendees.length} / ${totalCap}` : '',
                    a.is_primary ? 'Titular' : 'Acompañante',
                    getAttendeeFullName(a),
                    courseLabel,
                    sidesLabel,
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

    const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 24 : 70;
    const summaryBody = [
        ...Object.entries(mainCourseCounts).map(([k, v]) => ['Plato Fuerte', k, String(v)]),
        ...Object.entries(sideCounts).map(([k, v]) => ['Contorno', k, String(v)]),
    ];

    if (summaryBody.length > 0) {
        autoTable(doc, {
            startY: finalY,
            head: [['Categoría', 'Opción de Menú', 'Cantidad']],
            body: summaryBody,
            tableWidth: 360,
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [75, 85, 99], textColor: 255, fontStyle: 'bold' },
        });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const slug = getEventSlug(config?.eventType);
    doc.save(`Confirmaciones_${slug}_${dateStr}.pdf`);
}
