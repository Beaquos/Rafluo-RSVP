import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { EventData, GuestData } from '../../data/mockData';
import { formatDateBR } from '../../utils/dateUtils';
import { getEventIcon } from '../../utils/eventIconUtils';
import { exportReportToXLSX, exportReportToPDF } from '../../utils/reportExportUtils';
import { ExportDataDropdown } from '../common/ExportDataDropdown';

interface HubReportsViewProps {
  events: EventData[];
  guests: GuestData[];
  onShowToast: (message: string) => void;
  onSelectEvent: (event: EventData) => void;
}

export const HubReportsView: React.FC<HubReportsViewProps> = ({
  events,
  guests,
  onShowToast,
  onSelectEvent,
}) => {
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');

  // Filtered guests based on selected event
  const filteredGuests =
    selectedEventFilter === 'all'
      ? guests
      : guests.filter((g) => g.eventId === selectedEventFilter);

  const currentEvent = events.find((e) => e.id === selectedEventFilter);
  const selectedEventName = currentEvent ? currentEvent.name : undefined;
  const filterLabel = currentEvent ? `Evento: ${currentEvent.name}` : 'Todos os Eventos';

  const totalGuests = filteredGuests.length;
  const confirmed = filteredGuests.filter((g) => g.status === 'confirmed');
  const declined = filteredGuests.filter((g) => g.status === 'declined');
  const pending = filteredGuests.filter((g) => g.status === 'pending');

  const totalCompanionsConfirmed = confirmed.reduce(
    (acc, g) => acc + (g.companionCount || 0),
    0
  );
  const totalPeopleConfirmed = confirmed.length + totalCompanionsConfirmed;

  const confirmationRate =
    totalGuests > 0 ? Math.round((confirmed.length / totalGuests) * 100) : 0;

  // Handle Export XLSX
  const handleExportXLSX = () => {
    try {
      exportReportToXLSX({
        reportTitle: 'Relatorio_Consolidado_Hub_Geral',
        eventName: selectedEventName,
        filterLabel,
        guests: filteredGuests,
        events,
      });
      onShowToast('Relatório Excel (XLSX) exportado com sucesso!');
    } catch (err) {
      console.error(err);
      onShowToast('Erro ao exportar planilha XLSX.');
    }
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    try {
      exportReportToPDF({
        reportTitle: 'Relatório Oficial de Confirmações',
        eventName: selectedEventName,
        filterLabel,
        guests: filteredGuests,
        events,
      });
      onShowToast('Documento PDF oficial gerado com sucesso!');
    } catch (err) {
      console.error(err);
      onShowToast('Erro ao exportar documento PDF.');
    }
  };

  return (
    <div id="hub-reports-view" className="space-y-6 pb-12">
      {/* Header com H1 e descrição contextual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F]">
            Relatórios
          </h1>
          <p className="text-xs sm:text-sm text-[#24152F]/70 font-normal">
            Consolidação e exportação de dados de confirmações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#24152F]/15 text-[#24152F] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#24152F]"
          >
            <option value="all">Todos os eventos</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Botão Unificado Exportar Dados */}
          <ExportDataDropdown
            id="btn-export-hub-data"
            onExportXLSX={handleExportXLSX}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#24152F]/70">Convites Totais</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#24152F] mt-2">{totalGuests}</p>
          <p className="text-[10px] sm:text-[11px] text-[#24152F]/55 mt-0.5">Registrados na base</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#24152F]/70">Confirmadas</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#24152F] mt-2">{totalPeopleConfirmed}</p>
          <p className="text-[10px] sm:text-[11px] text-[#24152F]/55 mt-0.5 truncate" title={`${confirmed.length} titulares + ${totalCompanionsConfirmed} acompanhantes`}>
            {confirmed.length} tit. + {totalCompanionsConfirmed} acomp.
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#24152F]/70">Recusas</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-rose-900 mt-2">{declined.length}</p>
          <p className="text-[10px] sm:text-[11px] text-rose-800/70 mt-0.5">Não comparecerão</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#24152F]/70">Taxa Confirmação</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#24152F] mt-2">{confirmationRate}%</p>
          <p className="text-[10px] sm:text-[11px] text-[#24152F]/55 mt-0.5">Base calculada</p>
        </div>
      </div>

      {/* Breakdown by Event Table */}
      <div className="bg-white rounded-2xl border border-[#24152F]/10 p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#24152F]">Desempenho por Evento</h3>
        <div className="overflow-x-auto rounded-xl border border-[#24152F]/10">
          <table className="w-full text-left text-xs min-w-[620px] whitespace-nowrap">
            <thead className="bg-[#FAF6EE] text-[#24152F]/70 font-semibold border-b border-[#24152F]/10">
              <tr>
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Convites</th>
                <th className="py-3 px-4">Confirmados</th>
                <th className="py-3 px-4">Recusas</th>
                <th className="py-3 px-4">Progresso</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24152F]/5 text-[#24152F]">
              {events.map((ev) => {
                const evGuests = guests.filter((g) => g.eventId === ev.id);
                const evConfirmed = evGuests.filter((g) => g.status === 'confirmed').length;
                const evDeclined = evGuests.filter((g) => g.status === 'declined').length;
                const pct =
                  evGuests.length > 0 ? Math.round((evConfirmed / evGuests.length) * 100) : 0;

                return (
                  <tr key={ev.id} className="hover:bg-[#FAF6EE]/50">
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0">
                          {getEventIcon(ev.type, 'w-3.5 h-3.5')}
                        </div>
                        <span className="truncate max-w-xs">{ev.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#24152F]/70">{formatDateBR(ev.date)}</td>
                    <td className="py-3 px-4 font-medium">{evGuests.length}</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">{evConfirmed}</td>
                    <td className="py-3 px-4 text-rose-700 font-medium">{evDeclined}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-[#24152F]/10 overflow-hidden">
                          <div
                            className="h-full bg-[#180D20] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectEvent(ev)}
                        className="px-2.5 py-1 rounded-lg border border-[#24152F]/20 hover:bg-[#FAF6EE] text-[11px] font-semibold text-[#24152F] cursor-pointer"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
