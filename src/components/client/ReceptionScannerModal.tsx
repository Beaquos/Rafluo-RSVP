import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ReceptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const ReceptionScannerModal: React.FC<ReceptionScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reception-qr-reader-container';

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.warn('Erro ao parar scanner:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    setIsStarting(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('Nenhuma câmera encontrada no dispositivo.');
        setIsStarting(false);
        return;
      }

      // Escolher a câmera traseira em dispositivos móveis preferencialmente
      const backCamera = cameras.find((c) =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('traseira') ||
        c.label.toLowerCase().includes('environment')
      );
      const cameraId = backCamera ? backCamera.id : cameras[0].id;

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Quando lê com sucesso
          stopScanner();
          onScanSuccess(decodedText);
        },
        () => {
          // falhas de frames silenciosas
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission denied')) {
        setCameraError('Permissão para uso da câmera foi negada. Por favor, autorize nas permissões do seu navegador.');
      } else {
        setCameraError('Não foi possível iniciar a câmera. Use a busca manual por telefone.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopScanner();
    onScanSuccess(manualCode.trim());
  };

  useEffect(() => {
    if (isOpen) {
      setManualCode('');
      // Delay pequeno para montar elemento DOM do contêiner
      const t = setTimeout(() => {
        startScanner();
      }, 200);
      return () => {
        clearTimeout(t);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24152F]/75 dark:bg-black/85 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-5 sm:p-7 max-w-md w-full border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl space-y-4 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#24152F]/10 dark:border-[#3F2553]/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-[#DFFF5F]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">
                Leitor de QR Code
              </h3>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                Aponte a câmera para o QR Code da reserva
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] flex items-center justify-center hover:bg-[#24152F] hover:text-[#F7F1E5] dark:hover:bg-[#DFFF5F] dark:hover:text-[#180D20] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera error state */}
        {cameraError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-2">
            <div className="flex items-start gap-2">
              <CameraOff className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
            <button
              type="button"
              onClick={startScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 text-white font-semibold text-[11px] cursor-pointer hover:bg-rose-800"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

        {/* Video / QR Reader Container */}
        <div className="relative rounded-2xl overflow-hidden bg-black/90 aspect-square flex items-center justify-center border border-[#24152F]/20 dark:border-[#3F2553]">
          <div id={scannerContainerId} className="w-full h-full overflow-hidden" />
          {isStarting && (
            <div className="absolute inset-0 bg-[#24152F]/80 flex flex-col items-center justify-center text-[#F7F1E5] gap-2 text-xs">
              <RefreshCw className="w-6 h-6 text-[#DFFF5F] animate-spin" />
              <span>Iniciando câmera...</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-center text-[#24152F]/60 dark:text-[#D2C4DC]/60 leading-relaxed">
          Posicione o QR Code dentro do enquadramento. A identificação e validação da reserva no sistema são instantâneas.
        </p>

        {/* Digitação manual alternativa */}
        <div className="pt-2 border-t border-[#24152F]/10 dark:border-[#3F2553]/60 space-y-1.5">
          <label className="block text-[11px] font-bold text-[#24152F] dark:text-[#F7F1E5]">
            Ou digite o código da reserva:
          </label>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex: CKIN-EV01-A9F7-K4M2"
              className="flex-1 px-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#2A1738] text-xs uppercase font-mono text-[#24152F] dark:text-[#F7F1E5] placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] text-xs font-bold hover:bg-[#180D20] dark:hover:bg-[#CEF04A] transition-colors cursor-pointer"
            >
              Validar
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => {
            stopScanner();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] text-xs font-semibold text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] transition-colors cursor-pointer text-center"
        >
          Fechar Leitor
        </button>
      </div>
    </div>
  );
};
