import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { AdminHeader } from './AdminHeader';
import { Footer } from './Footer';
import { HubSection, NavSection } from '../../types/navigation';
import { EventData, GuestData } from '../../data/mockData';
import { AdminUser } from '../../types/user';

interface AdminLayoutProps {
  children: React.ReactNode;
  isMasterView?: boolean;
  currentHubSection?: HubSection;
  onSelectHubSection?: (section: HubSection) => void;
  currentSection?: NavSection;
  onSelectSection?: (section: NavSection) => void;
  onOpenPreview?: () => void;
  activeEvent?: EventData;
  events?: EventData[];
  guests?: GuestData[];
  currentUser: AdminUser;
  onSelectEvent?: (event: EventData) => void;
  onExitToMaster?: () => void;
  onCopyEventLink?: () => void;
  hasCopiedLink?: boolean;
  onOpenUserProfile: () => void;
  onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  isMasterView = true,
  currentHubSection = 'dashboard',
  onSelectHubSection,
  currentSection = 'overview',
  onSelectSection,
  onOpenPreview,
  activeEvent,
  events = [],
  guests = [],
  currentUser,
  onSelectEvent,
  onExitToMaster,
  onCopyEventLink,
  hasCopiedLink = false,
  onOpenUserProfile,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('korza_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('korza_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        handleCloseMobileMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, handleCloseMobileMenu]);

  return (
    <div
      id="admin-main-container"
      className="min-h-screen bg-[#FAF6EE] dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] flex overflow-x-hidden font-sans transition-colors duration-200"
    >
      {/* 1. Desktop Persistent Sidebar */}
      <aside
        aria-label="Navegação Lateral Principal"
        className={`hidden lg:block lg:flex-shrink-0 fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        <Sidebar
          isMasterView={isMasterView}
          currentHubSection={currentHubSection}
          onSelectHubSection={onSelectHubSection}
          currentSection={currentSection}
          onSelectSection={onSelectSection}
          onOpenPreview={onOpenPreview}
          eventName={activeEvent?.name}
          rsvpDeadline={activeEvent?.rsvpDeadline}
          onExitToMaster={onExitToMaster}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </aside>

      {/* 2. Mobile Drawer Sidebar (com overlay independente e sem faixa lateral) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de Navegação Móvel"
          >
            {/* Overlay independente cobrindo toda a tela atrás da sidebar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCloseMobileMenu}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer z-40"
              aria-hidden="true"
            />

            {/* Sidebar drawer content: exatamente a mesma largura da sidebar, sem wrapper com bg próprio, sem padding/margin */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl flex flex-col"
            >
              <Sidebar
                isMasterView={isMasterView}
                currentHubSection={currentHubSection}
                onSelectHubSection={(sec) => {
                  if (onSelectHubSection) onSelectHubSection(sec);
                  handleCloseMobileMenu();
                }}
                currentSection={currentSection}
                onSelectSection={(sec) => {
                  if (onSelectSection) onSelectSection(sec);
                  handleCloseMobileMenu();
                }}
                onCloseMobile={handleCloseMobileMenu}
                onOpenPreview={onOpenPreview}
                eventName={activeEvent?.name}
                rsvpDeadline={activeEvent?.rsvpDeadline}
                onExitToMaster={onExitToMaster}
                isCollapsed={false}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Content Workspace */}
      <div
        className={`flex-1 flex flex-col min-w-0 justify-between transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky Top Header */}
          <AdminHeader
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            isMasterView={isMasterView}
            currentHubSection={currentHubSection}
            currentSection={currentSection}
            activeEvent={activeEvent}
            events={events}
            guests={guests}
            currentUser={currentUser}
            onSelectEvent={onSelectEvent}
            onExitToMaster={onExitToMaster}
            onCopyEventLink={onCopyEventLink}
            hasCopiedLink={hasCopiedLink}
            onOpenUserProfile={onOpenUserProfile}
            onLogout={onLogout}
          />

          {/* Dynamic Body Content Container */}
          <main
            id="admin-main-content"
            className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0"
          >
            {children}
          </main>
        </div>

        {/* 16. Discreto rodapé do sistema */}
        <Footer />
      </div>
    </div>
  );
};
