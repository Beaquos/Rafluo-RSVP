import QRCode from 'qrcode';
import { loadOfficialLogoImage } from './logoUtils';

/**
 * Utilitários para o módulo de Credenciamento e QR Code
 */

/**
 * Gera um identificador seguro, opaco e não previsível para o QR Code de check-in.
 * Exemplo: CKIN-EV01-A9F7-K4M2
 */
export const generateCheckInCode = (eventId: string): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 legível sem 0, O, 1, I
  const randomSegment = (len: number) => {
    let res = '';
    const array = new Uint8Array(len);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      for (let i = 0; i < len; i++) {
        res += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < len; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return res;
  };

  const cleanEvent = eventId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `CKIN-${cleanEvent || 'EV'}-${randomSegment(4)}-${randomSegment(4)}`;
};

/**
 * Cria ou recupera o identificador de check-in para o convidado confirmado.
 */
export const ensureCheckInCode = (eventId: string, existingCode?: string | null): string => {
  if (existingCode && existingCode.trim().length > 0) {
    return existingCode.trim();
  }
  return generateCheckInCode(eventId);
};

/**
 * Gera um Data URL (imagem base64 PNG) do QR Code
 */
export const generateQrCodeDataUrl = async (content: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(content, {
      width: 400,
      margin: 2,
      color: {
        dark: '#24152F', // Roxo profundo da identidade Rafluo
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Erro ao gerar QRCode:', err);
    return '';
  }
};

/**
 * Ícone vetorial de Calendário desenhado diretamente no Canvas (Item 9 do Prompt)
 * Sem dependência de emojis ou fontes externas.
 */
const drawCalendarIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Base do calendário
  const r = 3;
  ctx.beginPath();
  ctx.roundRect
    ? ctx.roundRect(x, y, size, size, r)
    : ctx.strokeRect(x, y, size, size);
  ctx.stroke();

  // Linha superior de destaque
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.32);
  ctx.lineTo(x + size, y + size * 0.32);
  ctx.stroke();

  // Argolas superiores
  ctx.beginPath();
  ctx.moveTo(x + size * 0.28, y - 2);
  ctx.lineTo(x + size * 0.28, y + 3);
  ctx.moveTo(x + size * 0.72, y - 2);
  ctx.lineTo(x + size * 0.72, y + 3);
  ctx.stroke();

  // Pontos de marcação de data
  const dotS = size * 0.14;
  ctx.fillRect(x + size * 0.26, y + size * 0.5, dotS, dotS);
  ctx.fillRect(x + size * 0.58, y + size * 0.5, dotS, dotS);
  ctx.fillRect(x + size * 0.26, y + size * 0.72, dotS, dotS);
  ctx.fillRect(x + size * 0.58, y + size * 0.72, dotS, dotS);

  ctx.restore();
};

/**
 * Ícone vetorial de Localização (Pin) desenhado diretamente no Canvas (Item 9 do Prompt)
 * Sem dependência de emojis ou fontes externas.
 */
const drawLocationIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = x + size / 2;
  const topY = y + size * 0.38;
  const radius = size * 0.36;

  // Contorno do marcador de mapa
  ctx.beginPath();
  ctx.arc(cx, topY, radius, Math.PI, 0, false);
  ctx.quadraticCurveTo(x + size, y + size * 0.65, cx, y + size);
  ctx.quadraticCurveTo(x, y + size * 0.65, x, topY);
  ctx.closePath();
  ctx.stroke();

  // Ponto central
  ctx.beginPath();
  ctx.arc(cx, topY, radius * 0.38, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export interface GenerateConfirmationImageOptions {
  eventName: string;
  guestName: string;
  qrCodeDataUrl: string;
  checkInCode: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  totalCompanions?: number;
  companionNames?: string[];
}

/**
 * Constrói e faz download de uma imagem PNG de confirmação em alta resolução,
 * pronta e nítida para o convidado salvar na galeria do celular.
 * Atende aos itens 8 (Logo oficial), 9 (Ícones gráficos de data/local) e 10 (Estrutura dinâmica).
 */
export const downloadConfirmationPng = async (
  options: GenerateConfirmationImageOptions
): Promise<boolean> => {
  try {
    const {
      eventName,
      guestName,
      qrCodeDataUrl,
      checkInCode,
      eventDate,
      eventTime,
      eventLocation,
      totalCompanions = 0,
      companionNames = [],
    } = options;

    // Processamento dinâmico dos acompanhantes reais (Item 10)
    const validCompanionNames = (companionNames || [])
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const companionsToRender: string[] =
      validCompanionNames.length > 0
        ? validCompanionNames
        : totalCompanions > 0
        ? Array.from({ length: totalCompanions }, (_, i) => `Acompanhante ${i + 1}`)
        : [];

    const totalPersons = 1 + companionsToRender.length;

    // Cálculo de altura dinâmica para garantir que nomes de acompanhantes não sejam cortados
    const extraHeight = Math.max(0, companionsToRender.length * 28);
    const width = 800;
    const height = 1140 + extraHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Background gradient suave
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#FAF6EE');
    bgGradient.addColorStop(1, '#F3ECE0');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Barra de cabeçalho decorativa Deep Purple
    ctx.fillStyle = '#24152F';
    ctx.fillRect(0, 0, width, 185);

    // Linha de destaque Neon
    ctx.fillStyle = '#DFFF5F';
    ctx.fillRect(0, 180, width, 5);

    // Logo Oficial do Sistema Rafluo no cabeçalho (Item 8 do Prompt)
    try {
      const logoImg = await loadOfficialLogoImage();
      const logoSize = 46;
      const logoX = width / 2 - 110;
      const logoY = 26;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Erro ao carregar logo na imagem de confirmação:', e);
    }

    // Marca Rafluo ao lado do logo
    ctx.fillStyle = '#F7F1E5';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RAFLUO', width / 2 - 50, 58);

    // Ponto neon da marca
    ctx.fillStyle = '#DFFF5F';
    ctx.beginPath();
    ctx.arc(width / 2 + 76, 56, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#DFFF5F';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CONFIRMAÇÃO & CREDENCIAMENTO DE ENTRADA', width / 2, 98);

    ctx.fillStyle = '#D2C4DC';
    ctx.font = '13px sans-serif';
    ctx.fillText('Apresente este código na recepção do evento', width / 2, 126);

    // Cartão Principal centralizado (retângulo arredondado branco)
    const cardX = 40;
    const cardY = 210;
    const cardW = width - 80;
    const cardH = height - 260;
    const radius = 24;

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(36, 21, 47, 0.08)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    ctx.moveTo(cardX + radius, cardY);
    ctx.lineTo(cardX + cardW - radius, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
    ctx.lineTo(cardX + cardW, cardY + cardH - radius);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
    ctx.lineTo(cardX + radius, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
    ctx.lineTo(cardX, cardY + radius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Nome do Evento (quebra em várias linhas se necessário)
    ctx.fillStyle = '#24152F';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';

    const words = eventName.split(' ');
    let line = '';
    let curY = cardY + 52;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > cardW - 60 && n > 0) {
        ctx.fillText(line.trim(), width / 2, curY);
        line = words[n] + ' ';
        curY += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), width / 2, curY);

    // Detalhes do Evento (Data e Local) com ícones vetoriais sem emojis (Item 9)
    curY += 26;
    const iconSize = 18;
    const iconGap = 10;

    if (eventDate) {
      ctx.font = '600 15px sans-serif';
      const timeStr = eventTime ? ` às ${eventTime}` : '';
      const dateText = `${eventDate}${timeStr}`;
      const textMetrics = ctx.measureText(dateText);
      const totalWidth = iconSize + iconGap + textMetrics.width;
      const startX = (width - totalWidth) / 2;

      drawCalendarIcon(ctx, startX, curY - 14, iconSize, '#24152F');

      ctx.fillStyle = '#24152F';
      ctx.textAlign = 'left';
      ctx.fillText(dateText, startX + iconSize + iconGap, curY);
      curY += 26;
    }

    if (eventLocation) {
      ctx.font = '14px sans-serif';
      const textMetrics = ctx.measureText(eventLocation);
      const totalWidth = iconSize + iconGap + textMetrics.width;
      const startX = (width - totalWidth) / 2;

      drawLocationIcon(ctx, startX, curY - 14, iconSize, '#5A4A65');

      ctx.fillStyle = '#5A4A65';
      ctx.textAlign = 'left';
      ctx.fillText(eventLocation, startX + iconSize + iconGap, curY);
      curY += 24;
    }

    // Linha divisória
    curY += 8;
    ctx.strokeStyle = '#ECE5D8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, curY);
    ctx.lineTo(cardX + cardW - 40, curY);
    ctx.stroke();

    // Estrutura dinâmica de reserva e acompanhantes (Item 10 do Prompt)
    curY += 32;
    ctx.textAlign = 'center';

    // 1. Total de pessoas com pluralização correta: "Reserva válida para 1 pessoa" / "... para X pessoas"
    ctx.fillStyle = '#24152F';
    ctx.font = 'bold 18px sans-serif';
    const reservationHeader =
      totalPersons === 1
        ? 'Reserva válida para 1 pessoa'
        : `Reserva válida para ${totalPersons} pessoas`;
    ctx.fillText(reservationHeader, width / 2, curY);

    // 2. Titular da reserva
    curY += 26;
    ctx.font = '600 15px sans-serif';
    ctx.fillStyle = '#24152F';
    ctx.fillText(`Titular: ${guestName}`, width / 2, curY);

    // 3. Acompanhantes (conforme exemplos do Item 10)
    if (companionsToRender.length === 1) {
      curY += 24;
      ctx.font = '500 14px sans-serif';
      ctx.fillStyle = '#5A4A65';
      ctx.fillText(`Acompanhante: ${companionsToRender[0]}`, width / 2, curY);
    } else if (companionsToRender.length > 1) {
      curY += 24;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#24152F';
      ctx.fillText('Acompanhantes:', width / 2, curY);

      ctx.font = '500 14px sans-serif';
      ctx.fillStyle = '#5A4A65';
      for (const compName of companionsToRender) {
        curY += 22;
        ctx.fillText(compName, width / 2, curY);
      }
    }

    // Badge de status confirmado
    curY += 28;
    ctx.fillStyle = '#DFFF5F';
    const badgeW = 200;
    const badgeH = 32;
    const badgeX = (width - badgeW) / 2;
    const badgeY = curY - 20;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16)
      : ctx.rect(badgeX, badgeY, badgeW, badgeH);
    ctx.fill();

    ctx.fillStyle = '#180D20';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('✔ PRESENÇA CONFIRMADA', width / 2, curY);

    // Caixa do QR Code
    curY += 34;
    const qrBoxSize = 250;
    const qrX = (width - qrBoxSize) / 2;
    const qrY = curY;

    ctx.fillStyle = '#FAF6EE';
    ctx.strokeStyle = '#24152F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(qrX - 10, qrY - 10, qrBoxSize + 20, qrBoxSize + 20, 16)
      : ctx.rect(qrX - 10, qrY - 10, qrBoxSize + 20, qrBoxSize + 20);
    ctx.fill();
    ctx.stroke();

    // Desenhar imagem do QR Code
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = qrCodeDataUrl;
    });

    ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

    // String do código de check-in
    curY = qrY + qrBoxSize + 36;
    ctx.fillStyle = '#5A4A65';
    ctx.font = '12px monospace';
    ctx.fillText(`Código: ${checkInCode}`, width / 2, curY);

    // Rodapé de autenticação
    ctx.fillStyle = '#9C8DA8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Rafluo • Gestão Inteligente de Eventos & RSVP', width / 2, height - 25);

    // Download do arquivo gerado
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const cleanGuest = guestName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `confirmacao_${cleanGuest}_rafluo.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Erro ao salvar imagem de confirmação:', err);
    return false;
  }
};
