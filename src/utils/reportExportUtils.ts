import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EventData, GuestData, normalizeGuestGroup } from '../data/mockData';
import { formatDateBR, formatDateTimeBR } from './dateUtils';
import { getRafluoLogoPngDataUrl } from './logoUtils';

interface ExportReportOptions {
  reportTitle: string;
  eventName?: string;
  filterLabel?: string;
  guests: GuestData[];
  events: EventData[];
}

/**
 * 1. Exporta relatório em formato XLSX (Microsoft Excel)
 */
export const exportReportToXLSX = ({
  reportTitle,
  eventName,
  filterLabel,
  guests,
  events,
}: ExportReportOptions): void => {
  const rows = guests.map((g) => {
    const ev = events.find((e) => e.id === g.eventId);
    const companions = (g.companionNames || []).join('; ');
    const statusLabel =
      g.status === 'confirmed'
        ? 'Confirmado'
        : g.status === 'declined'
        ? 'Ausência'
        : 'Pendente';

    return {
      Evento: ev ? ev.name : eventName || 'Geral',
      Convidado: g.name,
      'Telefone/WhatsApp': g.phone || '—',
      Grupo: normalizeGuestGroup(g.group),
      'Código RSVP': g.rsvpCode,
      Status: statusLabel,
      'Acompanhantes (Qtd)': g.companionCount || 0,
      'Nomes dos Acompanhantes': companions || 'Nenhum',
      'Data da Resposta': g.respondedAt ? formatDateBR(g.respondedAt) : 'Pendente',
      Observações: g.notes || '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  const colWidths = [
    { wch: 28 }, // Evento
    { wch: 28 }, // Convidado
    { wch: 18 }, // Telefone
    { wch: 16 }, // Grupo
    { wch: 14 }, // Código
    { wch: 14 }, // Status
    { wch: 20 }, // Qtd
    { wch: 30 }, // Nomes
    { wch: 18 }, // Data
    { wch: 25 }, // Observações
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

  const fileName = `rafluo_${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * 2. Exporta relatório em PDF Oficial do Sistema Rafluo (Item 8 do Prompt)
 * Estrutura formal com cabeçalho institucional, logo oficial em alta resolução,
 * dados da empresa, filtros, tabela zebrada de alta legibilidade e rodapé de autenticação.
 */
export const exportReportToPDF = async ({
  reportTitle,
  eventName,
  filterLabel,
  guests,
  events,
}: ExportReportOptions): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Cores da Identidade Visual Rafluo
  const purpleDark = [36, 21, 47]; // #24152F
  const purpleDeep = [24, 13, 32]; // #180D20
  const purpleLight = [63, 37, 83]; // #3F2553
  const neonLime = [223, 255, 95]; // #DFFF5F
  const linenBeige = [247, 241, 229]; // #F7F1E5
  const darkGray = [80, 70, 85];
  const lightBg = [250, 246, 238]; // #FAF6EE

  // 1. Cabeçalho Superior Institucional (Barra Deep Purple)
  doc.setFillColor(purpleDark[0], purpleDark[1], purpleDark[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Neon Line
  doc.setFillColor(neonLime[0], neonLime[1], neonLime[2]);
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Logo Oficial do Sistema Rafluo (Item 8 do Prompt)
  try {
    const logoPng = await getRafluoLogoPngDataUrl(128);
    if (logoPng) {
      doc.addImage(logoPng, 'PNG', 14, 4.5, 19, 19);
    }
  } catch (err) {
    console.warn('Erro ao carregar logo oficial no PDF:', err);
  }

  // Nome do Sistema e Descritor posicionados ao lado do logo oficial
  doc.setTextColor(linenBeige[0], linenBeige[1], linenBeige[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RAFLUO', 36, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(neonLime[0], neonLime[1], neonLime[2]);
  doc.text('GESTÃO INTELIGENTE DE CONFIRMAÇÕES', 36, 20);

  // Dados da Empresa / Emissor no canto direito do cabeçalho
  doc.setTextColor(linenBeige[0], linenBeige[1], linenBeige[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO OFICIAL', pageWidth - 14, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(210, 196, 220);
  doc.text('Rafluo Tecnologia e Eventos LTDA', pageWidth - 14, 15, { align: 'right' });
  doc.text('Plataforma Web • rafluo.com', pageWidth - 14, 20, { align: 'right' });

  // 2. Metadados do Relatório (Título, Período, Data e Hora de Geração)
  let currentY = 36;

  doc.setTextColor(purpleDark[0], purpleDark[1], purpleDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(reportTitle.toUpperCase(), 14, currentY);

  // Subtítulo e Filtros
  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  const eventText = eventName ? `Evento: ${eventName}` : 'Visão Geral: Todos os Eventos';
  const filterText = filterLabel ? ` • Filtro: ${filterLabel}` : '';
  doc.text(`${eventText}${filterText}`, 14, currentY);

  // Data e hora de geração à direita
  const now = new Date();
  const generationTimestamp = formatDateTimeBR(now.toISOString());
  doc.text(`Gerado em: ${generationTimestamp} (Horário de Brasília)`, pageWidth - 14, currentY, {
    align: 'right',
  });

  // Linha divisória fina
  currentY += 4;
  doc.setDrawColor(220, 210, 225);
  doc.setLineWidth(0.3);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // 3. Mini Dashboard de Resumo / KPI na barra superior
  currentY += 4;
  const totalCount = guests.length;
  const confirmedCount = guests.filter((g) => g.status === 'confirmed').length;
  const totalCompanions = guests
    .filter((g) => g.status === 'confirmed')
    .reduce((acc, g) => acc + (g.companionCount || 0), 0);
  const totalAttending = confirmedCount + totalCompanions;
  const declinedCount = guests.filter((g) => g.status === 'declined').length;
  const totalConvidados = confirmedCount + totalCompanions + declinedCount;

  // Caixinhas de KPI
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, 'F');
  doc.setDrawColor(220, 210, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(purpleDark[0], purpleDark[1], purpleDark[2]);
  const kpiText = `Total Convidados: ${totalConvidados}   |   Presenças Confirmadas: ${totalAttending} (${confirmedCount} titulares + ${totalCompanions} acomp.)   |   Não Comparecem (Ausências): ${declinedCount}`;
  doc.text(kpiText, 18, currentY + 7);

  currentY += 15;

  // 4. Montagem da Tabela com jspdf-autotable
  const tableData = guests.map((g, idx) => {
    const ev = events.find((e) => e.id === g.eventId);
    const companions = (g.companionNames || []).join(', ');
    const statusLabel =
      g.status === 'confirmed'
        ? 'CONFIRMADO'
        : g.status === 'declined'
        ? 'AUSÊNCIA'
        : 'PENDENTE';

    return [
      String(idx + 1).padStart(2, '0'),
      g.name,
      ev ? ev.name : '—',
      g.phone || '—',
      g.rsvpCode,
      statusLabel,
      String(g.companionCount || 0),
      companions || '—',
      g.respondedAt ? formatDateBR(g.respondedAt) : 'Pendente',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        '#',
        'Nome do Convidado',
        'Evento',
        'Telefone / WhatsApp',
        'Cód. RSVP',
        'Status',
        'Acomp.',
        'Nomes Acompanhantes',
        'Data Resposta',
      ],
    ],
    body: tableData,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [36, 21, 47],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [36, 21, 47],
      textColor: [247, 241, 229],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 246, 238],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // #
      1: { cellWidth: 42, fontStyle: 'bold' }, // Nome
      2: { cellWidth: 38 }, // Evento
      3: { cellWidth: 30 }, // Telefone
      4: { cellWidth: 22, halign: 'center', font: 'courier' }, // Cód RSVP
      5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }, // Status
      6: { cellWidth: 16, halign: 'center' }, // Acomp
      7: { cellWidth: 50 }, // Nomes
      8: { cellWidth: 24, halign: 'center' }, // Data Resposta
    },
    didParseCell: (data) => {
      // Destaque de cor no status
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'CONFIRMADO') {
          data.cell.styles.textColor = [16, 120, 60];
        } else if (data.cell.raw === 'AUSÊNCIA') {
          data.cell.styles.textColor = [180, 30, 45];
        } else {
          data.cell.styles.textColor = [140, 100, 20];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      // Rodapé oficial do sistema
      const totalPages = (doc.internal as any).getNumberOfPages
        ? (doc.internal as any).getNumberOfPages()
        : 1;

      doc.setDrawColor(220, 210, 225);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 95, 120);

      // Lado esquerdo do rodapé
      doc.text(
        'Rafluo Sistema de Confirmações • Documento confidencial destinado exclusivamente ao cerimonial e coordenação do evento.',
        14,
        pageHeight - 7
      );

      // Lado direito do rodapé (Paginação)
      const pageNumber = (doc as any).pageNumber || data.pageNumber || 1;
      doc.text(`Página ${pageNumber}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
    },
  });

  const fileName = `rafluo_${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
};
