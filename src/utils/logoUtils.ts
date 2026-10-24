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
export const SIMFLUO_OFFICIAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="292 284.5 340 340" width="340" height="340">
  <rect x="292" y="284.5" width="340" height="340" rx="76" fill="#24152F"/>
  <path d="M456.25,598.84C435.21,597.74 418.58,593.47 398.81,584.11C391.93,580.85 388.04,578.34 388.40,577.39C388.56,576.98 390.23,576.00 390.76,576.00C390.91,576.00 392.26,575.43 393.76,574.73C395.26,574.04 397.42,573.24 398.56,572.97C399.69,572.70 402.99,571.71 405.88,570.76C414.86,567.83 422.79,565.31 439.00,560.26C456.72,554.73 484.41,545.14 495.12,540.82C522.96,529.60 539.63,516.29 548.61,498.12C566.52,461.92 545.76,429.92 497.86,419.88C471.88,414.44 456.82,416.76 453.75,426.67C451.42,434.23 456.41,439.07 471.79,444.14C502.18,454.17 510.46,459.66 513.26,471.65C517.21,488.60 504.25,502.25 461.12,526.55C459.06,527.71 455.01,530.01 452.12,531.66C444.59,535.97 435.49,541.10 431.00,543.55C428.87,544.72 424.20,547.30 420.62,549.29C410.47,554.94 406.26,557.24 401.00,560.00C398.32,561.41 395.26,563.05 394.20,563.65C393.14,564.25 390.44,565.68 388.20,566.83C385.96,567.97 383.19,569.45 382.06,570.10C378.57,572.12 378.27,572.06 373.37,568.47C345.50,548.02 325.79,516.98 318.16,481.50C309.23,439.96 323.14,391.28 353.38,358.24C399.93,307.39 473.31,295.41 533.50,328.82C541.07,333.02 541.22,333.51 535.61,335.65C531.11,337.38 519.50,341.32 512.25,343.58C509.84,344.34 504.44,346.04 500.25,347.38C496.06,348.71 490.26,350.53 487.38,351.42C445.23,364.39 418.97,374.07 405.54,381.59C373.52,399.52 358.50,428.47 367.53,454.84C374.93,476.46 398.60,490.67 435.09,495.39C454.67,497.92 465.88,493.91 465.88,484.37C465.88,476.97 462.24,474.39 442.62,467.88C430.24,463.77 427.75,462.83 422.76,460.35C408.96,453.48 402.80,443.66 405.51,432.84C409.20,418.09 421.34,408.37 469.12,381.88C474.76,378.76 480.84,375.38 482.62,374.38C486.84,372.02 492.73,368.81 499.75,365.06C504.92,362.30 508.61,360.31 517.38,355.57C523.73,352.13 529.94,348.87 534.73,346.44C537.40,345.09 540.49,343.43 541.61,342.76C548.37,338.68 548.75,338.68 553.88,342.76C582.09,365.18 602.31,400.34 606.62,434.45C606.82,436.06 607.10,438.22 607.24,439.25C608.24,446.74 608.07,463.05 606.87,472.50C601.24,517.20 572.27,559.23 532.12,580.94C508.05,593.97 481.74,600.17 456.25,598.84Z" fill="#DFFF5F" fill-rule="evenodd"/>
</svg>`;

export const RAFLUO_OFFICIAL_SVG = SIMFLUO_OFFICIAL_SVG;

export const SIMFLUO_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(SIMFLUO_OFFICIAL_SVG)}`;
export const RAFLUO_LOGO_DATA_URL = SIMFLUO_LOGO_DATA_URL;

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
