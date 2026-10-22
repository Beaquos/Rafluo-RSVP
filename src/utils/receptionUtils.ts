import QRCode from 'qrcode';
import { loadOfficialLogoImage } from './logoUtils';

/**
 * Utilitários para o módulo de Credenciamento e QR Code
 */

/**
 * Gera o identificador oficial e seguro para a confirmação/reserva (Item 6 do Prompt)
 * Formato padronizado oficial: RAF-XXXXX
 */
export const generateCheckInCode = (_eventId?: string): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 legível
  let res = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(5);
    crypto.getRandomValues(array);
    for (let i = 0; i < 5; i++) {
      res += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 5; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `RAF-${res}`;
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
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size * 0.12;
  const boxTop = y + size * 0.18;
  const boxHeight = size * 0.78;

  // Base do calendário com cantos arredondados
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, boxTop, size, boxHeight, r);
  } else {
    ctx.strokeRect(x, boxTop, size, boxHeight);
  }
  ctx.stroke();

  // Linha superior de destaque do cabeçalho
  ctx.beginPath();
  ctx.moveTo(x, boxTop + boxHeight * 0.32);
  ctx.lineTo(x + size, boxTop + boxHeight * 0.32);
  ctx.stroke();

  // Argolas superiores metálicas
  const ringL = size * 0.28;
  const ringR = size * 0.72;
  ctx.beginPath();
  ctx.moveTo(x + ringL, y + size * 0.04);
  ctx.lineTo(x + ringL, boxTop + size * 0.12);
  ctx.moveTo(x + ringR, y + size * 0.04);
  ctx.lineTo(x + ringR, boxTop + size * 0.12);
  ctx.stroke();

  // Grade de marcações de datas (pontos nítidos proporcionais)
  const dotSize = size * 0.12;
  const gridY1 = boxTop + boxHeight * 0.48;
  const gridY2 = boxTop + boxHeight * 0.72;
  ctx.fillRect(x + size * 0.22, gridY1, dotSize, dotSize);
  ctx.fillRect(x + size * 0.44, gridY1, dotSize, dotSize);
  ctx.fillRect(x + size * 0.66, gridY1, dotSize, dotSize);
  ctx.fillRect(x + size * 0.22, gridY2, dotSize, dotSize);
  ctx.fillRect(x + size * 0.44, gridY2, dotSize, dotSize);
  ctx.fillRect(x + size * 0.66, gridY2, dotSize, dotSize);

  ctx.restore();
};

/**
 * Ícone vetorial de Localização (Pin) desenhado diretamente no Canvas
 * Geometria precisa e proporções perfeitas sem deformações (Requisito 2).
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
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = x + size / 2;
  const r = size * 0.34;
  const cy = y + r + size * 0.04;
  const tipY = y + size * 0.96;

  // Tangentes geométricas perfeitas da ponta ao círculo superior
  const d = tipY - cy;
  const angle = Math.asin(Math.min(0.99, r / d));
  const startAngle = Math.PI / 2 + angle;
  const endAngle = Math.PI / 2 - angle;

  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle, false);
  ctx.lineTo(cx, tipY);
  ctx.closePath();
  ctx.stroke();

  // Orifício central do marcador
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
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
 * Constrói e faz download de uma imagem PNG de confirmação em alta resolução (1080 x 1920, 9:16 vertical).
 * Atende com precisão aos itens 1 e 2 do Prompt:
 * - Largura: 1080 pixels
 * - Altura: 1920 pixels
 * - Proporção: 9:16 vertical
 * - Ícones vetoriais de data e local proporcionais e sem distorção
 * - Resolução nítida para leitura do QR Code
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

    // Processamento dos acompanhantes
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

    // Dimensões estritas 1080 x 1920 px (9:16 Vertical)
    const width = 1080;
    const height = 1920;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Background gradient suave de alta qualidade
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#FAF6EE');
    bgGradient.addColorStop(1, '#F3ECE0');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Barra de cabeçalho Deep Purple
    const headerHeight = 250;
    ctx.fillStyle = '#24152F';
    ctx.fillRect(0, 0, width, headerHeight);

    // Linha de destaque Neon (#DFFF5F)
    ctx.fillStyle = '#DFFF5F';
    ctx.fillRect(0, headerHeight - 6, width, 6);

    // Logo Oficial do Sistema Rafluo no cabeçalho
    try {
      const logoImg = await loadOfficialLogoImage();
      const logoSize = 58;
      const logoX = width / 2 - 130;
      const logoY = 38;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Erro ao carregar logo na imagem de confirmação:', e);
    }

    // Marca Rafluo ao lado do logo
    ctx.fillStyle = '#F7F1E5';
    ctx.font = 'bold 38px Montserrat, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RAFLUO', width / 2 - 58, 80);

    // Ponto neon da marca
    ctx.fillStyle = '#DFFF5F';
    ctx.beginPath();
    ctx.arc(width / 2 + 104, 78, 5, 0, Math.PI * 2);
    ctx.fill();

    // Subtítulo do cabeçalho
    ctx.textAlign = 'center';
    ctx.fillStyle = '#DFFF5F';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('CONFIRMAÇÃO & CREDENCIAMENTO DE ENTRADA', width / 2, 140);

    ctx.fillStyle = '#D2C4DC';
    ctx.font = '16px sans-serif';
    ctx.fillText('Apresente este código na recepção do evento', width / 2, 178);

    // Cartão Principal centralizado
    const cardX = 60;
    const cardY = 275;
    const cardW = width - 120; // 960px
    const cardH = 1530;
    const radius = 32;

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(36, 21, 47, 0.12)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.fill();
    ctx.restore();

    // Início da renderização dos elementos internos do cartão
    ctx.textAlign = 'center';
    let curY = cardY + 75;

    // Nome do Evento (quebra automática de linhas com margens seguras)
    ctx.fillStyle = '#24152F';
    ctx.font = 'bold 36px Montserrat, sans-serif';

    const words = eventName.split(' ');
    let line = '';
    const maxTextWidth = cardW - 120;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        ctx.fillText(line.trim(), width / 2, curY);
        line = words[n] + ' ';
        curY += 46;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), width / 2, curY);

    // Detalhes do Evento (Data e Local) com ícones vetoriais proporcionalmente formatados
    curY += 42;
    const iconSize = 24;
    const iconGap = 12;

    if (eventDate) {
      ctx.font = '600 20px sans-serif';
      const timeStr = eventTime ? ` às ${eventTime}` : '';
      const dateText = `${eventDate}${timeStr}`;
      const textMetrics = ctx.measureText(dateText);
      const totalWidth = iconSize + iconGap + textMetrics.width;
      const startX = (width - totalWidth) / 2;

      drawCalendarIcon(ctx, startX, curY - 18, iconSize, '#24152F');

      ctx.fillStyle = '#24152F';
      ctx.textAlign = 'left';
      ctx.fillText(dateText, startX + iconSize + iconGap, curY);
      curY += 38;
    }

    if (eventLocation) {
      ctx.font = '19px sans-serif';
      const maxLocWidth = cardW - 140;
      let locDisplay = eventLocation;
      if (ctx.measureText(locDisplay).width > maxLocWidth) {
        // Encurtar com elipse se exceder a largura máxima do cartão
        while (locDisplay.length > 10 && ctx.measureText(locDisplay + '...').width > maxLocWidth) {
          locDisplay = locDisplay.slice(0, -1);
        }
        locDisplay += '...';
      }

      const textMetrics = ctx.measureText(locDisplay);
      const totalWidth = iconSize + iconGap + textMetrics.width;
      const startX = (width - totalWidth) / 2;

      drawLocationIcon(ctx, startX, curY - 18, iconSize, '#5A4A65');

      ctx.fillStyle = '#5A4A65';
      ctx.textAlign = 'left';
      ctx.fillText(locDisplay, startX + iconSize + iconGap, curY);
      curY += 36;
    }

    // Linha divisória suave
    curY += 12;
    ctx.strokeStyle = '#ECE5D8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, curY);
    ctx.lineTo(cardX + cardW - 60, curY);
    ctx.stroke();

    // Estrutura dinâmica de reserva e acompanhantes
    curY += 48;
    ctx.textAlign = 'center';

    // 1. Total de pessoas
    ctx.fillStyle = '#24152F';
    ctx.font = 'bold 24px Montserrat, sans-serif';
    const reservationHeader =
      totalPersons === 1
        ? 'Reserva válida para 1 pessoa'
        : `Reserva válida para ${totalPersons} pessoas`;
    ctx.fillText(reservationHeader, width / 2, curY);

    // 2. Titular da reserva
    curY += 36;
    ctx.font = '600 21px sans-serif';
    ctx.fillStyle = '#24152F';
    ctx.fillText(`Titular: ${guestName}`, width / 2, curY);

    // 3. Acompanhantes
    if (companionsToRender.length === 1) {
      curY += 32;
      ctx.font = '500 19px sans-serif';
      ctx.fillStyle = '#5A4A65';
      ctx.fillText(`Acompanhante: ${companionsToRender[0]}`, width / 2, curY);
    } else if (companionsToRender.length > 1) {
      curY += 32;
      ctx.font = 'bold 19px sans-serif';
      ctx.fillStyle = '#24152F';
      ctx.fillText('Acompanhantes:', width / 2, curY);

      ctx.font = '500 18px sans-serif';
      ctx.fillStyle = '#5A4A65';
      const maxShown = Math.min(companionsToRender.length, 5);
      for (let i = 0; i < maxShown; i++) {
        curY += 28;
        ctx.fillText(companionsToRender[i], width / 2, curY);
      }
      if (companionsToRender.length > 5) {
        curY += 28;
        ctx.fillText(`+ ${companionsToRender.length - 5} acompanhante(s)`, width / 2, curY);
      }
    }

    // Badge de status confirmado em destaque
    curY += 46;
    ctx.fillStyle = '#DFFF5F';
    const badgeW = 280;
    const badgeH = 44;
    const badgeX = (width - badgeW) / 2;
    const badgeY = curY - 28;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();

    ctx.fillStyle = '#180D20';
    ctx.font = 'bold 16px Montserrat, sans-serif';
    ctx.fillText('✔ PRESENÇA CONFIRMADA', width / 2, curY);

    // Caixa do QR Code em alta resolução (dimensão generosa e nítida)
    curY += 46;
    const qrBoxSize = 360;
    const qrX = (width - qrBoxSize) / 2;
    const qrY = curY;

    ctx.fillStyle = '#FAF6EE';
    ctx.strokeStyle = '#24152F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(qrX - 16, qrY - 16, qrBoxSize + 32, qrBoxSize + 32, 24);
    } else {
      ctx.rect(qrX - 16, qrY - 16, qrBoxSize + 32, qrBoxSize + 32);
    }
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

    // String do código de check-in / reserva unificado
    curY = qrY + qrBoxSize + 50;
    ctx.fillStyle = '#24152F';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Código: ${checkInCode}`, width / 2, curY);

    curY += 28;
    ctx.fillStyle = '#7A6A85';
    ctx.font = '15px sans-serif';
    ctx.fillText('Código exclusivo e intransferível • Válido para entrada única', width / 2, curY);

    // Rodapé do Canvas (fora do cartão)
    ctx.fillStyle = '#9C8DA8';
    ctx.font = '15px Montserrat, sans-serif';
    ctx.fillText('Rafluo • Gestão Inteligente de Eventos & RSVP', width / 2, height - 45);

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
