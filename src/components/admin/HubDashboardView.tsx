import React from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { EventData, GuestData } from '../../data/mockData';
import { AdminUser } from '../../types/user';
import { formatDateBR, getGreetingForSaoPaulo, formatCurrentDateLongBR } from '../../utils/dateUtils';
import { getEventIcon } from '../../utils/eventIconUtils';

interface HubDashboardViewProps {
  currentUser: AdminUser;
  events: EventData[];
  guests: GuestData[];
  onSelectEvent: (event: EventData) => void;
  onNavigateToEvents: () => void;
}

export const HubDashboardView: React.FC<HubDashboardViewProps> = ({
  currentUser,
  events,
  guests,
  onSelectEvent,
  onNavigateToEvents,
}) => {
  // 1. Calculations from REAL data
  const totalEvents = events.length;
  const totalGuests = guests.length;
  const totalConfirmed = guests.filter((g) => g.status === 'confirmed').length;

  // 4. Dynamic greeting based on America/Sao_Paulo timezone
  const greeting = getGreetingForSaoPaulo();
  const currentDateLong = formatCurrentDateLongBR();

  return (
    <div id="hub-dashboard-view" className="space-y-6 sm:space-y-7 pb-10">
      {/* 2. Top Greeting no formato original */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#24152F] dark:text-[#F7F1E5]">
          {greeting},{' '}
          <span className="text-[#3F2553] dark:text-[#DFFF5F]">
            {currentUser.name}
          </span>
          !
        </h1>
        <p className="text-xs sm:text-sm font-medium text-[#5C416E] dark:text-[#D2C4DC]">
          {currentDateLong}
        </p>
        <p className="text-xs sm:text-sm md:text-base text-[#24152F]/70 dark:text-[#E2D7EA]/80 font-normal">
          Aqui está um resumo de seus eventos.
        </p>
      </div>

      {/* 3. Exactly 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Card 1: Total de eventos criados */}
        <div
          id="card-total-events"
          className="bg-white p-4 sm:p-6 rounded-2xl border border-[#24152F]/10 shadow-xs hover:border-[#24152F]/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#24152F]/75">
              Total de eventos criados
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-4xl font-extrabold text-[#24152F] tracking-tight">
              {totalEvents}
            </p>
            <p className="text-xs text-[#24152F]/55 mt-0.5 sm:mt-1">
              Eventos cadastrados
            </p>
          </div>
        </div>

        {/* Card 2: Convidados cadastrados */}
        <div
          id="card-total-guests"
          className="bg-white p-4 sm:p-6 rounded-2xl border border-[#24152F]/10 shadow-xs hover:border-[#24152F]/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#24152F]/75">
              Convidados cadastrados
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-4xl font-extrabold text-[#24152F] tracking-tight">
              {totalGuests}
            </p>
            <p className="text-xs text-[#24152F]/55 mt-0.5 sm:mt-1">
              Total em todos os eventos
            </p>
          </div>
        </div>

        {/* Card 3: Confirmações recebidas */}
        <div
          id="card-total-confirmed"
          className="bg-white p-4 sm:p-6 rounded-2xl border border-[#24152F]/10 shadow-xs hover:border-[#24152F]/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#24152F]/75">
              Confirmações recebidas
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs ring-2 ring-[#DFFF5F]/40 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#180D20]" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-4xl font-extrabold text-[#24152F] tracking-tight">
              {totalConfirmed}
            </p>
            <p className="text-xs text-[#24152F]/55 mt-0.5 sm:mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Presenças confirmadas</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Eventos Recentes */}
      <div className="bg-white rounded-2xl border border-[#24152F]/10 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#24152F]/10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#24152F]">
              Eventos recentes
            </h2>
            <p className="text-xs text-[#24152F]/60 mt-0.5">
              Acompanhe o andamento das confirmações de presença
            </p>
          </div>

          <button
            id="btn-view-all-events-dashboard"
            onClick={onNavigateToEvents}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#24152F] hover:text-[#5C416E] hover:underline cursor-pointer self-start sm:self-auto"
          >
            <span>Ver todos os eventos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#24152F]/60">
            Nenhum evento cadastrado no momento.
          </div>
        ) : (
          <div className="divide-y divide-[#24152F]/5">
            {events.map((ev) => {
              // Real calculation of confirmation percentage
              const evGuests = guests.filter((g) => g.eventId === ev.id);
              const evTotalGuests = evGuests.length;
              const evConfirmed = evGuests.filter((g) => g.status === 'confirmed').length;

              // Division by zero safe guard
              const percentage =
                evTotalGuests > 0
                  ? Math.round((evConfirmed / evTotalGuests) * 100)
                  : 0;

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="py-3.5 sm:py-4 px-2 sm:px-3 rounded-xl hover:bg-[#FAF6EE] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  {/* Left: Event Icon + Name + Date in DD/MM/AA */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      {getEventIcon(ev.type, 'w-5 h-5 text-[#DFFF5F]')}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-[#24152F] group-hover:text-[#3F2553] transition-colors truncate">
                        {ev.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#24152F]/60">
                        <span className="font-medium text-[#24152F]/80">
                          {formatDateBR(ev.date)}
                        </span>
                        <span>•</span>
                        <span className="truncate">{ev.type}</span>
                        <span>•</span>
                        <span>{evTotalGuests} convites</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progresso com o mesmo padrão e componente visual de Relatórios */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pl-13 sm:pl-0">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-[#24152F]/10 overflow-hidden">
                        <div
                          className="h-full bg-[#180D20] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#24152F]">{percentage}%</span>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-white border border-[#24152F]/15 text-[#24152F] flex items-center justify-center group-hover:bg-[#24152F] group-hover:text-[#F7F1E5] transition-all shadow-2xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
