import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Link as LinkIcon,
  MoreHorizontal,
  X,
  FileText,
  UserCheck,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { HubSection, NavSection } from '../../types/navigation';
import { EventData } from '../../data/mockData';

interface MobileBottomNavProps {
  isMasterView: boolean;
  currentHubSection: HubSection;
  onSelectHubSection: (section: HubSection) => void;
  currentEventSection: NavSection;
  onSelectEventSection: (section: NavSection) => void;
  activeEvent?: EventData;
  onExitToMaster?: () => void;
  onOpenPreview?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isMasterView,
  currentHubSection,
  onSelectHubSection,
  currentEventSection,
  onSelectEventSection,
  activeEvent,
  onExitToMaster,
  onOpenPreview,
}) => {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // 2.1 Sistema Geral (Admin) Navigation Items
  const hubItems: { id: HubSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Eventos', icon: Calendar },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  // 2.2 Gestão do Evento - 4 Fixed Tabs
  const eventFixedTabs: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'guests', label: 'Convidados', icon: Users },
    { id: 'guest-link', label: 'Confirmação', icon: LinkIcon },
    { id: 'analytics', label: 'Relatórios', icon: BarChart3 },
  ];

  // More sheet items for event management
  const moreSheetItems = [
    { id: 'events' as NavSection, label: 'Dados do Evento', icon: Calendar, desc: 'Data, horário, local e capacidade' },
    { id: 'form-builder' as NavSection, label: 'Formulários', icon: FileText, desc: 'Perguntas extras de confirmação' },
    { id: 'managers' as NavSection, label: 'Responsáveis', icon: UserCheck, desc: 'Acessos e permissões do cliente' },
    { id: 'settings' as NavSection, label: 'Configurações', icon: Settings, desc: 'Preferências do evento' },
  ];

  return (
    <>
      {/* Bottom Nav Bar (Mobile only: max-w-full, fixed at bottom) */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#180D20]/95 backdrop-blur-md border-t border-[#3F2553] shadow-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-around h-15 px-1 max-w-md mx-auto">
          {isMasterView ? (
            // Admin Hub Navigation
            hubItems.map((item) => {
              const isActive = currentHubSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`mobile-tab-${item.id}`}
                  onClick={() => onSelectHubSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors relative ${
                    isActive ? 'text-[#DFFF5F]' : 'text-[#D2C4DC]/70 hover:text-[#F7F1E5]'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#DFFF5F]" />
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 truncate max-w-[62px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })
          ) : (
            // Active Event Management Navigation
            <>
              {eventFixedTabs.map((item) => {
                const isActive = currentEventSection === item.id && !isMoreSheetOpen;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`mobile-event-tab-${item.id}`}
                    onClick={() => {
                      setIsMoreSheetOpen(false);
                      onSelectEventSection(item.id);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors relative ${
                      isActive ? 'text-[#DFFF5F]' : 'text-[#D2C4DC]/70 hover:text-[#F7F1E5]'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#DFFF5F]" />
                      )}
                    </div>
                    <span className={`text-[10px] mt-0.5 truncate max-w-[62px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}

              {/* "Mais" Button */}
              <button
                type="button"
                id="mobile-event-tab-more"
                onClick={() => setIsMoreSheetOpen(true)}
                aria-expanded={isMoreSheetOpen}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors relative ${
                  isMoreSheetOpen || (!eventFixedTabs.some((t) => t.id === currentEventSection) && !isMasterView)
                    ? 'text-[#DFFF5F]'
                    : 'text-[#D2C4DC]/70 hover:text-[#F7F1E5]'
                }`}
              >
                <div className="relative">
                  <MoreHorizontal className="w-5 h-5" />
                  {isMoreSheetOpen && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#DFFF5F]" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-medium">Mais</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Bottom Sheet "Mais" Menu for Event Context */}
      {isMoreSheetOpen && !isMasterView && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMoreSheetOpen(false);
          }}
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-[#24152F]/80 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[#180D20] text-[#F7F1E5] rounded-t-3xl border-t border-[#3F2553] shadow-2xl p-5 space-y-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-[#3F2553] rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-[#3F2553] pb-3">
              <div className="min-w-0 pr-2">
                <h3 className="font-bold text-sm text-[#F7F1E5] truncate">
                  {activeEvent?.name || 'Gestão do Evento'}
                </h3>
                <p className="text-[11px] text-[#D2C4DC]">Opções adicionais de configuração</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5]/70 hover:text-[#F7F1E5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {moreSheetItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentEventSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsMoreSheetOpen(false);
                      onSelectEventSection(item.id);
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-[#2E1B3C] border-[#DFFF5F]/40 text-[#F7F1E5]'
                        : 'border-[#3F2553] hover:bg-[#2E1B3C]/50 text-[#D2C4DC]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isActive
                            ? 'bg-[#DFFF5F] text-[#180D20]'
                            : 'bg-[#24152F] text-[#DFFF5F] border border-[#3F2553]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold block text-xs text-[#F7F1E5] truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-[#D2C4DC]/60 block truncate">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D2C4DC]/50 flex-shrink-0" />
                  </button>
                );
              })}

              {/* Action: Ver Tela do Convidado */}
              {onOpenPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    onOpenPreview();
                  }}
                  className="w-full p-3 rounded-2xl bg-[#DFFF5F] text-[#180D20] font-bold flex items-center justify-between transition-transform active:scale-98 cursor-pointer shadow-md mt-2"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4" />
                    <span>Ver Tela do Convidado (RSVP)</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Exit to Master Hub */}
              {onExitToMaster && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    onExitToMaster();
                  }}
                  className="w-full p-3 rounded-2xl border border-rose-500/20 text-rose-300 hover:bg-rose-500/10 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer justify-center mt-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar aos Eventos (Geral)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
