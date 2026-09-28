import React, { useState, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { GuestData } from '../../data/mockData';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedGuests: GuestData[]) => void;
}

interface CsvRowPreview {
  name: string;
  displayName: string;
  phone: string;
  group: string;
  maxGuests: number;
  isValid: boolean;
  error?: string;
}

const SAMPLE_CSV_ROWS: CsvRowPreview[] = [
  { name: 'Rodrigo Lima Santos', displayName: 'Rodrigo e Família', phone: '(61) 98111-2233', group: 'Amigos', maxGuests: 2, isValid: true },
  { name: 'Juliana Paes de Barros', displayName: 'Juliana Barros', phone: '(11) 99222-3344', group: 'Família Noivo', maxGuests: 1, isValid: true },
  { name: 'Lucas Ferreira Guimarães', displayName: 'Lucas Guimarães', phone: '(61) 98333-4455', group: 'Padrinhos', maxGuests: 1, isValid: true },
  { name: 'Patrícia Rocha Mendes', displayName: 'Patrícia e Convidado', phone: '(21) 99444-5566', group: 'Trabalho', maxGuests: 1, isValid: true },
  { name: 'Felipe Alencar Neto', displayName: 'Felipe Alencar', phone: '(61) 98555-6677', group: 'Amigos', maxGuests: 2, isValid: true },
];

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [rows, setRows] = useState<CsvRowPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  // Reset rows when opening modal
  useEffect(() => {
    if (isOpen) {
      setRows([]);
      setFileName('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setFileName('lista_convidados_rafluo_exemplo.csv');
    setRows(SAMPLE_CSV_ROWS);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

      const parsedRows: CsvRowPreview[] = [];
      const dataLines = lines.length > 1 ? lines.slice(1) : lines;

      dataLines.forEach((line) => {
        const parts = line.split(/[,;]/);
        const name = parts[0]?.trim() || '';
        const phone = parts[1]?.trim() || '';
        const group = parts[2]?.trim() || 'Geral';
        const maxGuests = parseInt(parts[3]?.trim()) || 1;

        if (name) {
          parsedRows.push({
            name,
            displayName: name,
            phone,
            group,
            maxGuests,
            isValid: true,
          });
        }
      });

      setRows(parsedRows.length > 0 ? parsedRows : SAMPLE_CSV_ROWS);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    const newGuests: GuestData[] = rows
      .filter((r) => r.isValid)
      .map((r, idx) => ({
        id: 'g-csv-' + Date.now() + '-' + idx,
        eventId: 'ev-01',
        name: r.name,
        displayName: r.displayName || r.name,
        phone: r.phone,
        email: '',
        group: r.group,
        maxGuests: r.maxGuests,
        rsvpCode: 'RAF-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        notes: 'Importado via CSV',
        status: 'pending',
        respondedAt: null,
        companionCount: 0,
        companionNames: [],
        answers: {},
      }));

    onImport(newGuests);
    onClose();
  };

  return (
    <div
      id="modal-backdrop-import-csv"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24152F]/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-[#24152F]/15 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553] flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-[#180D20]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">Importar Convidados via Planilha CSV</h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">Importação em lote de contatos e acompanhantes</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-import-modal"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5] cursor-pointer transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs text-[#24152F] overflow-y-auto flex-1">
          {/* Instructions Box */}
          <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] text-[11px] text-[#24152F]/80 space-y-1">
            <p className="font-bold text-[#24152F] flex items-center gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#24152F]" /> Estrutura esperada das colunas:
            </p>
            <p className="font-mono bg-white p-1.5 rounded border border-[#24152F]/10 text-[10px]">
              Nome, Telefone, Grupo, Acompanhantes
            </p>
            <p className="text-[#24152F]/60 pt-0.5">
              Exemplo: Carlos Silva, (61) 99999-0000, Amigos, 2
            </p>
          </div>

          {/* Upload Area */}
          <div className="p-6 border-2 border-dashed border-[#24152F]/20 rounded-xl bg-[#FAF6EE]/50 hover:bg-[#FAF6EE] text-center space-y-3 transition-colors">
            <Upload className="w-8 h-8 text-[#24152F]/40 mx-auto" />
            <div>
              <p className="font-bold text-xs text-[#24152F]">
                {fileName ? fileName : 'Selecione ou arraste seu arquivo .CSV'}
              </p>
              <p className="text-[11px] text-[#24152F]/50 mt-0.5">
                Codificação UTF-8 recomendada
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <label className="px-3.5 py-1.5 bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] rounded-xl text-xs font-semibold cursor-pointer shadow-xs border border-[#3F2553]">
                Selecionar Arquivo
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 border border-[#24152F]/20 hover:bg-white rounded-xl text-xs font-semibold text-[#24152F] cursor-pointer"
              >
                Carregar Exemplo
              </button>
            </div>
          </div>

          {/* Table Preview */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#24152F] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {rows.length} convidados identificados para importação:
                </span>
                <span className="text-[10px] text-[#24152F]/50">Códigos únicos serão gerados automaticamente</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#24152F]/10 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#FAF6EE] text-[#24152F]/70 font-semibold sticky top-0 border-b border-[#24152F]/10">
                    <tr>
                      <th className="py-2 px-3">Nome</th>
                      <th className="py-2 px-3">Telefone</th>
                      <th className="py-2 px-3">Grupo</th>
                      <th className="py-2 px-3">Acompanhantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24152F]/5">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-[#FAF6EE]/50">
                        <td className="py-2 px-3 font-semibold text-[#24152F]">{r.name}</td>
                        <td className="py-2 px-3 text-[#24152F]/70">{r.phone || '—'}</td>
                        <td className="py-2 px-3">{r.group}</td>
                        <td className="py-2 px-3 font-bold text-[#24152F]">+{r.maxGuests}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#24152F]/10">
            <button
              type="button"
              id="btn-cancel-import-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#24152F]/20 text-xs font-semibold text-[#24152F] hover:bg-[#F7F1E5] cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-confirm-import-csv"
              disabled={rows.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold shadow-sm disabled:opacity-40 cursor-pointer border border-[#3F2553] text-center"
            >
              <Check className="w-3.5 h-3.5 text-[#DFFF5F]" />
              <span>Importar {rows.length > 0 ? `(${rows.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
