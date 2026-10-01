/**
 * Utilitários para formatação e manipulação de datas no padrão brasileiro DD/MM/AA (dia/mês/ano com 2 dígitos)
 * e data + hora no formato "DD/MM/AA às HH:mm" utilizando o fuso horário America/Sao_Paulo.
 */

/**
 * Converte qualquer data (YYYY-MM-DD, ISO, DD/MM/AAAA, etc.) para o formato DD/MM/AA padronizado
 */
export const formatDateBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // Se já estiver no formato DD/MM/AA (ex: 15/11/26)
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Se estiver no formato DD/MM/AAAA (ex: 15/11/2026)
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const shortYear = year.slice(-2);
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${shortYear}`;
  }

  // Se estiver no formato YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const shortYear = year.slice(-2);
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${shortYear}`;
  }

  // Tentativa com objeto Date para ISO ou formatos padrão
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      return formatter.format(parsed);
    }
  } catch {
    // fallback
  }

  return trimmed;
};

/**
 * Converte qualquer data e hora para o formato padronizado "DD/MM/AA às HH:mm"
 * Exemplo: 21/09/26 às 10:14
 */
export const formatDateTimeBR = (
  dateStr: string | null | undefined,
  timeFallback?: string
): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // Se já tiver "às", apenas normaliza a parte da data
  if (trimmed.includes('às')) {
    const [dPart, tPart] = trimmed.split('às').map((s) => s.trim());
    return `${formatDateBR(dPart)} às ${tPart}`;
  }

  // Se tiver formato ISO com hora ou formato com espaço (YYYY-MM-DD HH:mm:ss ou YYYY-MM-DDTHH:mm:ss)
  if (trimmed.includes('T') || (trimmed.includes(' ') && trimmed.includes(':'))) {
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        });
        const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return `${dateFormatter.format(parsed)} às ${timeFormatter.format(parsed)}`;
      }
    } catch {
      // fallback
    }
  }

  // Se for apenas uma data (ex: 2026-09-21 ou 21/09/26) e temos timeFallback ou precisamos de uma hora padrão
  const formattedDate = formatDateBR(trimmed);
  const time = timeFallback || '10:14';
  return `${formattedDate} às ${time}`;
};

/**
 * Determina a saudação com base no horário do fuso America/Sao_Paulo:
 * - 05:00 até 11:59: Bom dia
 * - 12:00 até 17:59: Boa tarde
 * - 18:00 até 04:59: Boa noite
 */
export const getGreetingForSaoPaulo = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);

    if (hour >= 5 && hour < 12) {
      return 'Bom dia';
    }
    if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    }
    return 'Boa noite';
  } catch {
    const localHour = new Date().getHours();
    if (localHour >= 5 && localHour < 12) return 'Bom dia';
    if (localHour >= 12 && localHour < 18) return 'Boa tarde';
    return 'Boa noite';
  }
};

/**
 * Formata a data atual por extenso no formato solicitado:
 * Exemplo: "Quarta-feira, 23 de Setembro"
 * Gerado dinamicamente com fuso horário America/Sao_Paulo
 */
export const formatCurrentDateLongBR = (): string => {
  try {
    const now = new Date();
    // Ex: "quarta-feira"
    const weekday = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
    }).format(now);

    // Ex: "23"
    const day = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: 'numeric',
    }).format(now);

    // Ex: "setembro"
    const month = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      month: 'long',
    }).format(now);

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return `${capitalize(weekday)}, ${day} de ${capitalize(month)}`;
  } catch {
    return 'Hoje';
  }
};

/**
 * Obtém a data de hoje no formato YYYY-MM-DD no fuso America/Sao_Paulo para comparações
 */
export const getTodaySaoPauloYMD = (): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return parts; // 'YYYY-MM-DD'
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Verifica o status de acesso de um usuário temporário no fuso America/Sao_Paulo
 */
export const checkTemporaryUserAccess = (
  startDate?: string,
  endDate?: string
): { active: boolean; label: string; periodText: string } => {
  if (!startDate || !endDate) {
    return { active: true, label: 'Temporário', periodText: '' };
  }

  const today = getTodaySaoPauloYMD();
  const startYMD = startDate.includes('/') ? convertBRToYMD(startDate) : startDate.slice(0, 10);
  const endYMD = endDate.includes('/') ? convertBRToYMD(endDate) : endDate.slice(0, 10);

  const startFormatted = formatDateBR(startDate);
  const endFormatted = formatDateBR(endDate);
  const periodText = `${startFormatted} → ${endFormatted}`;

  if (today < startYMD) {
    return { active: false, label: 'Acesso Futuro', periodText };
  }
  if (today > endYMD) {
    return { active: false, label: 'Acesso Expirado', periodText };
  }
  return { active: true, label: 'Temporário Ativo', periodText };
};

const convertBRToYMD = (brDate: string): string => {
  const parts = brDate.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return brDate;
};

/**
 * Retorna a contagem de dias restantes até o evento no formato "Faltam X dias".
 * Exemplo: "Faltam 15 dias"
 */
export const getDaysRemainingText = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const trimmed = dateStr.trim();
    let y = 0;
    let m = 0;
    let d = 0;

    const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      y = parseInt(ymd[1], 10);
      m = parseInt(ymd[2], 10) - 1;
      d = parseInt(ymd[3], 10);
    } else {
      const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (dmy) {
        d = parseInt(dmy[1], 10);
        m = parseInt(dmy[2], 10) - 1;
        y = dmy[3].length === 2 ? 2000 + parseInt(dmy[3], 10) : parseInt(dmy[3], 10);
      }
    }

    if (!y) return '';

    const target = new Date(y, m, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Falta 1 dia';
    if (diffDays > 1) return `Faltam ${diffDays} dias`;
    if (diffDays === 0) return 'Faltam 0 dias';
    return 'Encerrado';
  } catch {
    return '';
  }
};
