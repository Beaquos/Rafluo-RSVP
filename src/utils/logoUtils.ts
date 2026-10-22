/**
 * Utilitários para renderização e obtenção do Logo Oficial
 * Utilizado em PDFs, imagens de confirmação, QR Codes e documentos oficiais.
 */
import { getStoredCompanyLogo } from './storageUtils';

/**
 * SVG oficial do símbolo do sistema em base64/Data URL
 * Monograma fluído com curvas elegantes, fundo roxo profundo #24152F,
 * acento interno #3F2553 e ponto neon #DFFF5F.
 */
export const RAFLUO_OFFICIAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#24152F"/>
  <!-- Subtle inner gradient glow -->
  <circle cx="380" cy="130" r="140" fill="#DFFF5F" opacity="0.12" />
  
  <g transform="translate(106, 86) scale(9.375)">
    <!-- Sleek dynamic fluid monogram stem & curve -->
    <path
      d="M9 7C9 5.89543 9.89543 5 11 5H18C21.3137 5 24 7.68629 24 11C24 13.973 21.8398 16.441 19 16.9V17L23.5 25C23.9 25.7 23.4 26.5 22.5 26.5H19.5C18.9 26.5 18.4 26.1 18.1 25.6L14 17.5H12V25.5C12 26.0523 11.5523 26.5 11 26.5C10.4477 26.5 10 26.0523 10 25.5V8"
      stroke="#F7F1E5"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Upper inner bowl accent -->
    <path
      d="M12 13.5H17.5C18.8807 13.5 20 12.3807 20 11C20 9.61929 18.8807 8.5 17.5 8.5H12V13.5Z"
      fill="#3F2553"
    />
    <!-- Neon Lime Confirmation Spark/Dot -->
    <circle cx="21" cy="7.5" r="2.4" fill="#DFFF5F" />
  </g>
  <!-- Accent badge dot at corner -->
  <circle cx="410" cy="410" r="28" fill="#DFFF5F" />
</svg>`;

export const SIMFLUO_OFFICIAL_SVG = RAFLUO_OFFICIAL_SVG;

export const RAFLUO_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(RAFLUO_OFFICIAL_SVG)}`;
export const SIMFLUO_LOGO_DATA_URL = RAFLUO_LOGO_DATA_URL;

/**
 * Converte o SVG oficial ou o logo personalizado em um canvas Image element.
 * Garante disponibilidade e carregamento assíncrono seguro com fallback.
 */
export const loadOfficialLogoImage = async (): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const customLogo = typeof window !== 'undefined' ? getStoredCompanyLogo() : '';
    const src = customLogo && customLogo.trim().length > 0 ? customLogo : RAFLUO_LOGO_DATA_URL;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback para o SVG incorporado se a imagem personalizada falhar
      if (src !== RAFLUO_LOGO_DATA_URL) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = reject;
        fallbackImg.src = RAFLUO_LOGO_DATA_URL;
      } else {
        reject(new Error('Falha ao carregar logo'));
      }
    };
    img.src = src;
  });
};

/**
 * Gera um PNG em Data URL do logo para bibliotecas como jsPDF
 * que requerem PNG/JPEG para inclusão sem depender de parsers de SVG externos.
 */
export const getRafluoLogoPngDataUrl = async (size = 256): Promise<string> => {
  try {
    const img = await loadOfficialLogoImage();
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao converter logo para PNG:', err);
    return '';
  }
};

export const getSimfluoLogoPngDataUrl = getRafluoLogoPngDataUrl;
