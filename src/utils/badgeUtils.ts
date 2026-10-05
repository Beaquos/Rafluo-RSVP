/**
 * Shared badge color helper for Event Types / Invitation Types
 * Ensures 100% visual consistency between Clientes and Eventos
 */
export const getTypeBadgeColor = (type: string): string => {
  switch (type) {
    case 'Aniversário Infantil':
      return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    case 'Aniversário Adulto':
      return 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'Chá de Bebê':
    case 'Chá de Fraldas':
    case 'Chá de Bebê ou Fraldas':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    default:
      return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700';
  }
};
