import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { FormQuestionData } from '../../data/mockData';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newQuestion: FormQuestionData) => void;
  existingQuestions: FormQuestionData[];
  question?: FormQuestionData | null;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingQuestions,
  question,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<FormQuestionData['type']>('short_text');
  const [required, setRequired] = useState(true);
  const [optionsText, setOptionsText] = useState('Opção 1\nOpção 2\nOpção 3');
  const [hasCondition, setHasCondition] = useState(false);
  const [conditionTarget, setConditionTarget] = useState(existingQuestions[0]?.id || '');
  const [conditionValue, setConditionValue] = useState('sim');

  // Reset or load fields when opening
  useEffect(() => {
    if (isOpen) {
      if (question) {
        setTitle(question.title);
        setDescription(question.description || '');
        setType(question.type);
        setRequired(question.required);
        setOptionsText(question.options?.join('\n') || 'Opção 1\nOpção 2\nOpção 3');
        setHasCondition(!!question.condition);
        setConditionTarget(question.condition?.targetQuestionId || existingQuestions[0]?.id || '');
        setConditionValue(question.condition?.value || 'sim');
      } else {
        setTitle('');
        setDescription('');
        setType('short_text');
        setRequired(true);
        setOptionsText('Opção 1\nOpção 2\nOpção 3');
        setHasCondition(false);
        setConditionTarget(existingQuestions[0]?.id || '');
        setConditionValue('sim');
      }
    }
  }, [isOpen, existingQuestions, question]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options = ['single_choice', 'multiple_choice', 'dropdown'].includes(type)
      ? optionsText.split('\n').map((o) => o.trim()).filter(Boolean)
      : undefined;

    const savedQ: FormQuestionData = {
      id: question ? question.id : 'q_' + Date.now(),
      eventId: question ? question.eventId : 'ev-01',
      title,
      description,
      type,
      required,
      options,
      order: question ? question.order : existingQuestions.length + 1,
      condition: hasCondition
        ? {
            targetQuestionId: conditionTarget,
            operator: 'equals',
            value: conditionValue,
          }
        : undefined,
    };

    onSave(savedQ);
    onClose();
  };

  return (
    <div
      id="modal-backdrop-question"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24152F]/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#24152F]/15 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553] flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0">
              {question ? <Check className="w-4 h-4 text-[#180D20]" /> : <Plus className="w-4 h-4 text-[#180D20]" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">
                {question ? 'Editar Pergunta' : 'Nova Pergunta RSVP'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">Personalize perguntas e regras condicionais</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-question-modal"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5] cursor-pointer transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-[#24152F]">
          <div>
            <label className="block font-semibold mb-1 text-[#24152F]">Título da Pergunta *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              placeholder="Ex: Precisa de transporte para a cerimônia?"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F]">Descrição / Instrução (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              placeholder="Ex: Haverá vans saindo do hotel conveniado"
            />
          </div>

          {/* Item 12: Remover da tela a informação/seção Tipo de Resposta mantendo a edição do formulário */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[#24152F]">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 accent-[#24152F]"
              />
              <span className="font-semibold">Resposta Obrigatória</span>
            </label>
          </div>

          {['single_choice', 'multiple_choice', 'dropdown'].includes(type) && (
            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">
                Opções (uma por linha) *
              </label>
              <textarea
                rows={3}
                required
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] font-sans focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              />
            </div>
          )}

          {/* Conditional Logic Config */}
          <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#24152F]">Exibição Condicional</span>
              <input
                type="checkbox"
                checked={hasCondition}
                onChange={(e) => setHasCondition(e.target.checked)}
                className="w-4 h-4 accent-[#24152F]"
              />
            </div>
            <p className="text-[10px] text-[#24152F]/60">
              Exibir esta pergunta apenas se o convidado responder determinado valor na pergunta anterior.
            </p>

            {hasCondition && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="block font-medium text-[#24152F] mb-1">Depende de:</label>
                  <select
                    value={conditionTarget}
                    onChange={(e) => setConditionTarget(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-[#24152F]/20 bg-white"
                  >
                    {existingQuestions.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#24152F] mb-1">Quando resposta for igual a:</label>
                  <input
                    type="text"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-[#24152F]/20 bg-white"
                    placeholder="Ex: sim"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#24152F]/10">
            <button
              type="button"
              id="btn-cancel-question-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#24152F]/20 text-xs font-semibold text-[#24152F] hover:bg-[#F7F1E5] cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-question-modal"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold shadow-sm cursor-pointer border border-[#3F2553] text-center"
            >
              <Check className="w-3.5 h-3.5 text-[#DFFF5F]" /> Criar Pergunta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
