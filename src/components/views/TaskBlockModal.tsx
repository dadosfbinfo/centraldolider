import React, { useState } from 'react';
import { TarefaOS } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

interface TaskBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TarefaOS | null;
  onBlocked?: () => void;
}

export const TaskBlockModal: React.FC<TaskBlockModalProps> = ({
  isOpen,
  onClose,
  task,
  onBlocked,
}) => {
  const [motivo, setMotivo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !task) return null;

  const handleConfirmBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setErrorMessage('Por favor, informe a justificativa detalhada do impedimento.');
      return;
    }

    try {
      dbStore.blockTask(task.id, motivo.trim());
      if (onBlocked) onBlocked();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar bloqueio.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#343A40]">Reportar Bloqueio da OS</h2>
              <p className="text-xs text-gray-500 font-mono">{task.numero_os} • {task.titulo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirmBlock} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Atenção:</strong> Esta ação notificará imediatamente a administração da Central e congelará o SLA até o desbloqueio.
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Motivo do Impedimento / Falta de Insumo / Terceiros <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Ex: Fornecedor de manutenção não entregou a peça B-102. Reagendado contato para amanhã às 09:00..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-amber-500 resize-none"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium w-full mb-0.5">Motivos comuns:</span>
            {[
              'Falta de insumos / peças',
              'Prestador terceiro não compareceu',
              'Queda de energia / conexão',
              'Área interditada para manutenção'
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMotivo(preset)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Confirmar Bloqueio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
