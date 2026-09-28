import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  ChevronRight,
  ExternalLink,
  X,
  ArrowLeft,
  Sparkles,
  Contact,
} from 'lucide-react';
import { HubSection, NavSection, NavItem } from '../../types/navigation';
import { formatDateBR } from '../../utils/dateUtils';
import { RafluoLogo } from '../common/RafluoLogo';
import { SidebarToggle } from '../common/SidebarToggle';

interface SidebarProps {
  // Hub section vs Event section
  isMasterView?: boolean;
  currentHubSection?: HubSection;
  onSelectHubSection?: (section: HubSection) => void;

  // Event specific
  currentSection?: NavSection;
  onSelectSection?: (section: NavSection) => void;
  eventName?: string;
  rsvpDeadline?: string;
  onExitToMaster?: () => void;
  onOpenPreview?: () => void;
  onCloseMobile?: () => void;

  // Collapse / Expand feature
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Hub Navigation:
// Dashboard | Eventos | Clientes | Relatórios | Usuários | Configurações
const HUB_NAV_ITEMS: { id: HubSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'events',
    label: 'Eventos',
    icon: Calendar,
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: Contact,
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: BarChart3,
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: Users,
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
  },
];

// Operational tabs when inside a specific event
const EVENT_NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'events',
    label: 'Dados do Evento',
    iconName: 'Calendar',
  },
  {
    id: 'guests',
    label: 'Convidados',
    iconName: 'Users',
  },
  {
    id: 'form-builder',
    label: 'Formulários',
    iconName: 'FileText',
  },
  {
    id: 'managers',
    label: 'Responsáveis',
    iconName: 'UserCheck',
  },
  {
    id: 'analytics',
    label: 'Relatórios',
    iconName: 'BarChart3',
  },
  {
    id: 'settings',
    label: 'Configurações',
    iconName: 'Settings',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMasterView = true,
  currentHubSection = 'dashboard',
  onSelectHubSection,
  currentSection = 'overview',
  onSelectSection,
  eventName = 'Casamento Marina & Lucas',
  rsvpDeadline = '10/10/26',
  onExitToMaster,
  onOpenPreview,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const renderEventIcon = (name: NavItem['iconName'], isActive: boolean) => {
    const iconClass = `w-4 h-4 transition-transform duration-200 ${
      isActive ? 'text-[#180D20]' : 'text-[#DFFF5F]'
    }`;

    switch (name) {
      case 'LayoutDashboard':
        return <LayoutDashboard className={iconClass} />;
      case 'Calendar':
        return <Calendar className={iconClass} />;
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'UserCheck':
        return <UserCheck className={iconClass} />;
      case 'BarChart3':
        return <BarChart3 className={iconClass} />;
      case 'Settings':
        return <Settings className={iconClass} />;
      default:
        return <LayoutDashboard className={iconClass} />;
    }
  };

  return (
    <aside
      id="admin-sidebar"
      className={`relative h-full bg-[#24152F] text-[#F7F1E5] flex flex-col justify-between border-r border-[#3F2553]/60 shadow-2xl select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Brand Header */}
      <div className={`border-b border-[#3F2553]/60 transition-all duration-300 ${isCollapsed ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div
            onClick={onExitToMaster}
            className="cursor-pointer group transition-opacity hover:opacity-90 flex items-center justify-center"
            title="Rafluo — Gestão inteligente de confirmações"
          >
            {isCollapsed ? (
              <RafluoLogo variant="dark" size="sm" symbolOnly={true} />
            ) : (
              <RafluoLogo variant="dark" size="md" showDescriptor showOrigin={false} />
            )}
          </div>

          {onCloseMobile && !isCollapsed && (
            <button
              type="button"
              id="btn-close-sidebar-mobile"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#D2C4DC] hover:text-[#F7F1E5] hover:bg-[#2E1B3C] transition-colors cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* When inside an event workspace, show active event card and back button */}
        {!isMasterView && (
          <div className="mt-4 space-y-2">
            {onExitToMaster && (
              isCollapsed ? (
                <button
                  type="button"
                  id="btn-sidebar-exit-to-master-collapsed"
                  onClick={() => {
                    onExitToMaster();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title="Voltar ao Hub Geral"
                  className="w-10 h-10 mx-auto rounded-xl bg-[#180D20] hover:bg-[#2E1B3C] border border-[#3F2553] text-[#DFFF5F] flex items-center justify-center transition-all cursor-pointer relative group shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#180D20] text-[#F7F1E5] text-xs font-semibold rounded-xl shadow-xl border border-[#3F2553] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Voltar ao Hub Geral
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-sidebar-exit-to-master"
                  onClick={() => {
                    onExitToMaster();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#180D20]/90 hover:bg-[#180D20] border border-[#3F2553] text-xs text-[#DFFF5F] font-semibold transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-5 h-5 rounded-md bg-[#DFFF5F]/20 text-[#DFFF5F] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DFFF5F] group-hover:text-[#180D20] transition-colors">
                      <ArrowLeft className="w-3 h-3" />
                    </div>
                    <span className="truncate">Voltar ao Hub Geral</span>
                  </div>
                  <span className="text-[10px] bg-[#DFFF5F]/20 text-[#DFFF5F] px-1.5 py-0.5 rounded-full font-bold">
                    Hub
                  </span>
                </button>
              )
            )}

            {isCollapsed ? (
              <div
                title={`${eventName} (RSVP até: ${formatDateBR(rsvpDeadline)})`}
                className="w-10 h-10 mx-auto rounded-xl bg-[#180D20]/60 border border-[#3F2553]/70 flex items-center justify-center text-[#DFFF5F] relative group cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-3 py-2 bg-[#180D20] text-[#F7F1E5] text-xs rounded-xl shadow-xl border border-[#3F2553] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <p className="font-bold text-[#DFFF5F]">{eventName}</p>
                  <p className="text-[10px] text-[#D2C4DC] mt-0.5">RSVP: {formatDateBR(rsvpDeadline)}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#180D20]/60 border border-[#3F2553]/70">
                <div className="flex items-center justify-between text-[11px] text-[#D2C4DC] mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-[#DFFF5F]" /> Evento Selecionado
                  </span>
                  <span className="text-[10px] text-[#DFFF5F] font-bold px-1.5 py-0.2 rounded bg-[#DFFF5F]/15">
                    Ativo
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#F7F1E5] truncate">{eventName}</p>
                <p className="text-[10px] text-[#D2C4DC]/80 mt-0.5">
                  RSVP até: {formatDateBR(rsvpDeadline)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className={`flex-1 overflow-y-auto space-y-1.5 transition-all duration-300 ${isCollapsed ? 'px-2 py-4' : 'px-3.5 py-4'}`}>
        {!isCollapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#D2C4DC]/50 truncate">
            {isMasterView ? 'Hub Geral' : 'Menu do Evento'}
          </p>
        )}

        {isMasterView ? (
          /* Hub Main Navigation: Exactly Dashboard, Eventos, Relatórios, Usuários */
          <div className="space-y-1.5">
            {HUB_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentHubSection === item.id;

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      id={`hub-nav-${item.id}-collapsed`}
                      onClick={() => {
                        if (onSelectHubSection) onSelectHubSection(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      title={item.label}
                      className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-[#DFFF5F] text-[#180D20] shadow-sm ring-2 ring-[#DFFF5F]/50 font-bold'
                          : 'bg-[#180D20] text-[#D2C4DC] hover:text-[#F7F1E5] hover:bg-[#2E1B3C] border border-[#3F2553]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#180D20]' : 'text-[#DFFF5F]'}`} />
                    </button>

                    {/* Floating Tooltip when collapsed */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#180D20] text-[#F7F1E5] text-xs font-semibold rounded-xl shadow-xl border border-[#3F2553] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {item.label}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`hub-nav-${item.id}`}
                  onClick={() => {
                    if (onSelectHubSection) onSelectHubSection(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full group text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#2E1B3C] text-[#F7F1E5] font-semibold shadow-sm ring-1 ring-[#DFFF5F]/35'
                      : 'text-[#D2C4DC] hover:text-[#F7F1E5] hover:bg-[#2E1B3C]/50'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-[#DFFF5F]" />
                  )}

                  <div className="flex items-center space-x-3 truncate pl-1">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#DFFF5F] text-[#180D20] shadow-sm'
                          : 'bg-[#180D20] text-[#DFFF5F] border border-[#3F2553] group-hover:bg-[#2E1B3C]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>

                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#DFFF5F]" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Specific Event Navigation */
          <div className="space-y-1.5">
            {EVENT_NAV_ITEMS.map((item) => {
              const isActive = currentSection === item.id;

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      id={`nav-item-${item.id}-collapsed`}
                      onClick={() => {
                        if (onSelectSection) onSelectSection(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      title={item.label}
                      className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-[#DFFF5F] text-[#180D20] shadow-sm ring-2 ring-[#DFFF5F]/50 font-bold'
                          : 'bg-[#180D20] text-[#D2C4DC] hover:text-[#F7F1E5] hover:bg-[#2E1B3C] border border-[#3F2553]'
                      }`}
                    >
                      {renderEventIcon(item.iconName, isActive)}
                    </button>

                    {/* Floating Tooltip when collapsed */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#180D20] text-[#F7F1E5] text-xs font-semibold rounded-xl shadow-xl border border-[#3F2553] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {item.label}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    if (onSelectSection) onSelectSection(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full group text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#2E1B3C] text-[#F7F1E5] font-semibold shadow-sm ring-1 ring-[#DFFF5F]/35'
                      : 'text-[#D2C4DC] hover:text-[#F7F1E5] hover:bg-[#2E1B3C]/50'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-[#DFFF5F]" />
                  )}

                  <div className="flex items-center space-x-2.5 truncate pl-1">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#DFFF5F] text-[#180D20] shadow-sm'
                          : 'bg-[#180D20] text-[#DFFF5F] border border-[#3F2553] group-hover:bg-[#2E1B3C]'
                      }`}
                    >
                      {renderEventIcon(item.iconName, isActive)}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#DFFF5F]" />}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom Action & Collapse Button Area */}
      <div className={`border-t border-[#3F2553]/60 bg-[#180D20]/50 space-y-2.5 transition-all duration-300 ${isCollapsed ? 'p-3 flex flex-col items-center' : 'p-4'}`}>
        {/* Preview Guest RSVP button */}
        {isCollapsed ? (
          <div className="relative group">
            <button
              type="button"
              id="btn-preview-rsvp-link-collapsed"
              onClick={() => {
                if (onOpenPreview) onOpenPreview();
              }}
              title="Ver Tela do Convidado"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#180D20] bg-[#DFFF5F] hover:bg-[#CEF04A] transition-all shadow-sm active:scale-95 cursor-pointer group"
            >
              <ExternalLink className="w-4 h-4 text-[#180D20] group-hover:scale-110 transition-transform" />
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#180D20] text-[#F7F1E5] text-xs font-semibold rounded-xl shadow-xl border border-[#3F2553] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Ver Tela do Convidado
            </div>
          </div>
        ) : (
          <button
            type="button"
            id="btn-preview-rsvp-link"
            onClick={() => {
              if (onOpenPreview) onOpenPreview();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-[#180D20] bg-[#DFFF5F] hover:bg-[#CEF04A] transition-all shadow-sm active:scale-98 cursor-pointer group"
            title="Visualizar a tela pública de confirmação"
          >
            <div className="w-4 h-4 rounded-md bg-[#180D20]/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <ExternalLink className="w-3 h-3 text-[#180D20]" />
            </div>
            <span>Ver Tela do Convidado</span>
          </button>
        )}

        {/* 3. Botão circular de recolher/expandir sidebar centralizado na parte inferior */}
        {onToggleCollapse && (
          <div className="pt-2 border-t border-[#3F2553]/40 w-full flex justify-center items-center">
            <SidebarToggle
              isCollapsed={isCollapsed}
              onToggle={onToggleCollapse}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
