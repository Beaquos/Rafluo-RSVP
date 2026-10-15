import QRCode from 'qrcode';

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
 * Constrói e faz download de uma imagem PNG de confirmação em alta resolução,
 * pronta e nítida para o convidado salvar na galeria do celular.
 */
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

    const width = 800;
    const height = 1100;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#FAF6EE');
    bgGradient.addColorStop(1, '#F3ECE0');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative top header bar
    ctx.fillStyle = '#24152F';
    ctx.fillRect(0, 0, width, 180);

    // Neon accent line
    ctx.fillStyle = '#DFFF5F';
    ctx.fillRect(0, 175, width, 5);

    // Rafluo branding
    ctx.fillStyle = '#DFFF5F';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RAFLUO', width / 2, 60);

    ctx.fillStyle = '#F7F1E5';
    ctx.font = '500 15px sans-serif';
    ctx.fillText('CONFIRMAÇÃO & CREDENCIAMENTO DE ENTRADA', width / 2, 90);

    ctx.fillStyle = '#D2C4DC';
    ctx.font = '13px sans-serif';
    ctx.fillText('Apresente este código na recepção do evento', width / 2, 120);

    // Main Card Box (white rounded rectangle)
    const cardX = 40;
    const cardY = 210;
    const cardW = width - 80;
    const cardH = 820;
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

    // Event Name
    ctx.fillStyle = '#24152F';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';

    // Wrap event name if long
    const words = eventName.split(' ');
    let line = '';
    let curY = cardY + 55;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > cardW - 60 && n > 0) {
        ctx.fillText(line.trim(), width / 2, curY);
        line = words[n] + ' ';
        curY += 34;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), width / 2, curY);

    // Event Details (Date, Location)
    curY += 30;
    if (eventDate) {
      ctx.fillStyle = '#24152F';
      ctx.font = '600 16px sans-serif';
      const timeStr = eventTime ? ` às ${eventTime}` : '';
      ctx.fillText(`📅 ${eventDate}${timeStr}`, width / 2, curY);
      curY += 24;
    }
    if (eventLocation) {
      ctx.fillStyle = '#5A4A65';
      ctx.font = '14px sans-serif';
      ctx.fillText(`📍 ${eventLocation}`, width / 2, curY);
      curY += 24;
    }

    // Divider
    curY += 10;
    ctx.strokeStyle = '#ECE5D8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, curY);
    ctx.lineTo(cardX + cardW - 40, curY);
    ctx.stroke();

    // Guest Info Block
    curY += 35;
    ctx.fillStyle = '#5A4A65';
    ctx.font = '13px sans-serif';
    ctx.fillText('TITULAR DA RESERVA', width / 2, curY);

    curY += 30;
    ctx.fillStyle = '#24152F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(guestName, width / 2, curY);

    // Status Badge
    curY += 26;
    ctx.fillStyle = '#DFFF5F';
    const badgeW = 190;
    const badgeH = 32;
    const badgeX = (width - badgeW) / 2;
    const badgeY = curY - 20;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
    ctx.fill();

    ctx.fillStyle = '#180D20';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('✔ PRESENÇA CONFIRMADA', width / 2, curY);

    // Companions indicator
    if (totalCompanions > 0) {
      curY += 26;
      ctx.fillStyle = '#24152F';
      ctx.font = '500 13px sans-serif';
      ctx.fillText(`Reserva válida para ${totalCompanions + 1} pessoa(s) (Titular + ${totalCompanions} acompanhante(s))`, width / 2, curY);

      if (companionNames.length > 0) {
        curY += 20;
        ctx.fillStyle = '#5A4A65';
        ctx.font = '12px sans-serif';
        ctx.fillText(`(${companionNames.join(', ')})`, width / 2, curY);
      }
    }

    // QR Code Container Box
    curY += 35;
    const qrBoxSize = 250;
    const qrX = (width - qrBoxSize) / 2;
    const qrY = curY;

    ctx.fillStyle = '#FAF6EE';
    ctx.strokeStyle = '#24152F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(qrX - 10, qrY - 10, qrBoxSize + 20, qrBoxSize + 20, 16) : ctx.rect(qrX - 10, qrY - 10, qrBoxSize + 20, qrBoxSize + 20);
    ctx.fill();
    ctx.stroke();

    // Draw QR image
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = qrCodeDataUrl;
    });

    ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

    // CheckIn Code String
    curY = qrY + qrBoxSize + 40;
    ctx.fillStyle = '#5A4A65';
    ctx.font = '12px monospace';
    ctx.fillText(`Código: ${checkInCode}`, width / 2, curY);

    // Footer note
    ctx.fillStyle = '#9C8DA8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Rafluo • Gestão Inteligente de Eventos & RSVP', width / 2, height - 30);

    // Trigger download
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
