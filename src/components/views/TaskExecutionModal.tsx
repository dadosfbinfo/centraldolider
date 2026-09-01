import React, { useState, useEffect } from 'react';
import {
  TarefaOS,
  EvidenciaSubmetida,
  RequisitoConclusao,
  ChecklistItem
} from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { CommentsThread } from '../comments/CommentsThread';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  User,
  Camera,
  FileUp,
  Upload,
  CheckSquare,
  Square,
  ShieldAlert,
  Play,
  HelpCircle,
  FileCheck2,
  Calendar
} from 'lucide-react';

interface TaskExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TarefaOS | null;
  onCompleted?: () => void;
  onOpenBlockModal?: (task: TarefaOS) => void;
}

export const TaskExecutionModal: React.FC<TaskExecutionModalProps> = ({
  isOpen,
  onClose,
  task,
  onCompleted,
  onOpenBlockModal,
}) => {
  // State for dynamic evidence inputs keyed by requirement id
  const [evidenceMap, setEvidenceMap] = useState<Record<string, any>>({});
  const [observacoes, setObservacoes] = useState('');
  const [tempoMinutos, setTempoMinutos] = useState(30);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize values from task
  useEffect(() => {
    if (task && isOpen) {
      const initialMap: Record<string, any> = {};

      task.requisitos_conclusao?.forEach((req) => {
        // Find existing evidence if already partially saved
        const existing = task.evidencias?.find((e) => e.requisito_id === req.id);

        if (req.tipo === 'CHECKLIST') {
          // Track completed item IDs
          const checkedIds = existing?.checklist_concluidos ||
            req.checklist_itens?.filter((c) => c.concluido).map((c) => c.id) || [];
          initialMap[req.id] = checkedIds;
        } else if (req.tipo === 'NUMERO') {
          initialMap[req.id] = existing?.valor_numero ?? '';
        } else if (req.tipo === 'TEXTO') {
          initialMap[req.id] = existing?.texto_resposta || '';
        } else if (req.tipo === 'FOTO') {
          initialMap[req.id] = existing?.foto_url || '';
        } else if (req.tipo === 'ARQUIVO') {
          initialMap[req.id] = existing?.arquivo_url || existing?.arquivo_nome || '';
        } else if (req.tipo === 'OPCAO') {
          initialMap[req.id] = existing?.opcao_selecionada || '';
        } else if (req.tipo === 'FORMULARIO') {
          initialMap[req.id] = existing?.formulario_respostas || {};
        } else {
          initialMap[req.id] = true;
        }
      });

      setEvidenceMap(initialMap);
      setObservacoes(task.observacoes_conclusao || '');
      setTempoMinutos(task.tempo_execucao_minutos || 30);
      setErrorMessage('');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  // Toggle checklist item
  const handleToggleChecklist = (reqId: string, itemId: string) => {
    const currentList: string[] = evidenceMap[reqId] || [];
    let updated: string[];
    if (currentList.includes(itemId)) {
      updated = currentList.filter((id) => id !== itemId);
    } else {
      updated = [...currentList, itemId];
    }
    setEvidenceMap({ ...evidenceMap, [reqId]: updated });
  };

  // Simulate Photo Upload with preset real sample images
  const handleSimulatePhotoUpload = (reqId: string) => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'
    ];
    const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setEvidenceMap({ ...evidenceMap, [reqId]: randomPhoto });
  };

  // Simulate Document / File Upload
  const handleSimulateFileUpload = (reqId: string) => {
    setEvidenceMap({
      ...evidenceMap,
      [reqId]: `Laudo_Tecnico_Conformidade_${task.numero_os.replace(/\s+/g, '')}.pdf`,
    });
  };

  // Start execution if not started
  const handleStartTask = () => {
    dbStore.startTask(task.id);
    setErrorMessage('');
  };

  // Validate and submit completion
  const handleCompleteTask = () => {
    // Validate mandatory requirements
    const formattedEvidencias: EvidenciaSubmetida[] = [];
    const now = new Date().toISOString();

    for (const req of task.requisitos_conclusao || []) {
      const val = evidenceMap[req.id];

      if (req.obrigatorio) {
        if (req.tipo === 'CHECKLIST') {
          const totalItems = req.checklist_itens?.length || 0;
          const checkedCount = (val as string[])?.length || 0;
          if (checkedCount < totalItems) {
            setErrorMessage(
              `Complete todos os ${totalItems} itens do checklist "${req.titulo}" antes de finalizar.`
            );
            return;
          }
        } else if (req.tipo === 'NUMERO') {
          if (val === '' || val === undefined || isNaN(Number(val))) {
            setErrorMessage(`O valor numérico para "${req.titulo}" é obrigatório.`);
            return;
          }
        } else if (req.tipo === 'TEXTO') {
          if (!val || !val.toString().trim()) {
            setErrorMessage(`Preencha o campo obrigatório "${req.titulo}".`);
            return;
          }
        } else if (req.tipo === 'FOTO') {
          if (!val) {
            setErrorMessage(`A foto comprobatória para "${req.titulo}" é obrigatória.`);
            return;
          }
        } else if (req.tipo === 'ARQUIVO') {
          if (!val) {
            setErrorMessage(`O anexo de documento para "${req.titulo}" é obrigatório.`);
            return;
          }
        } else if (req.tipo === 'OPCAO') {
          if (!val) {
            setErrorMessage(`Selecione uma opção para "${req.titulo}".`);
            return;
          }
        }
      }

      // Build evidence record
      formattedEvidencias.push({
        requisito_id: req.id,
        tipo: req.tipo,
        checklist_concluidos: req.tipo === 'CHECKLIST' ? (val as string[]) : undefined,
        valor_numero: req.tipo === 'NUMERO' ? Number(val) : undefined,
        unidade_medida: req.unidade_medida,
        texto_resposta: req.tipo === 'TEXTO' ? String(val) : undefined,
        foto_url: req.tipo === 'FOTO' ? String(val) : undefined,
        arquivo_nome: req.tipo === 'ARQUIVO' ? String(val) : undefined,
        opcao_selecionada: req.tipo === 'OPCAO' ? String(val) : undefined,
        formulario_respostas: req.tipo === 'FORMULARIO' ? val : undefined,
        data_registro: now,
      });
    }

    try {
      setIsSubmitting(true);
      dbStore.completeTask(task.id, {
        evidencias: formattedEvidencias,
        observacoes_conclusao: observacoes.trim() || undefined,
        tempo_execucao_minutos: tempoMinutos,
      });

      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao concluir tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-[#FCFAFA] shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#C76B4A]/10 text-[#C76B4A] border border-[#C76B4A]/20">
                {task.numero_os}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-2xs"
                style={{ backgroundColor: task.categoria_cor || '#C76B4A' }}
              >
                {task.categoria_nome}
              </span>
              <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {task.unidade}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#343A40] leading-tight">
              {task.titulo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Status & Deadline Banner */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE3DC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">Status Atual:</span>
                <span className="font-bold text-[#C76B4A] uppercase">{task.status}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Prazo Limite: {task.prazo ? task.prazo.replace('T', ' às ') : 'Hoje'}</span>
              </div>
            </div>

            {task.status !== 'EM_ANDAMENTO' && task.status !== 'CONCLUIDA' && (
              <button
                type="button"
                onClick={handleStartTask}
                className="px-4 py-2 bg-[#355C7D] hover:bg-[#2c4c66] text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Execução Agora
              </button>
            )}
          </div>

          {/* Instructions */}
          {task.descricao && (
            <div className="p-4 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 leading-relaxed">
              <span className="font-bold text-[#343A40] block mb-1">Diretrizes & Procedimento:</span>
              <p>{task.descricao}</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dynamic Evidence Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="w-2 h-2 rounded-full bg-[#C76B4A]" />
              <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                Preenchimento dos Critérios de Conclusão & Evidências
              </h3>
            </div>

            {task.requisitos_conclusao?.map((req, idx) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#C76B4A] text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-[#343A40]">{req.titulo}</span>
                  </div>
                  {req.obrigatorio ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      Obrigatório
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium">Opcional</span>
                  )}
                </div>

                {req.instrucoes && (
                  <p className="text-xs text-gray-500 italic">{req.instrucoes}</p>
                )}

                {/* 1. CHECKLIST TYPE */}
                {req.tipo === 'CHECKLIST' && (
                  <div className="space-y-2 pt-1">
                    {req.checklist_itens?.map((item) => {
                      const isChecked = (evidenceMap[req.id] || []).includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleChecklist(req.id, item.id)}
                          className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/70'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span className={`text-xs ${isChecked ? 'font-semibold line-through text-gray-600' : 'font-medium'}`}>
                            {item.texto}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. NUMERIC MEASUREMENT TYPE */}
                {req.tipo === 'NUMERO' && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="relative flex-1 max-w-xs">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={evidenceMap[req.id] ?? ''}
                        onChange={(e) =>
                          setEvidenceMap({ ...evidenceMap, [req.id]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs font-bold text-[#343A40] bg-white rounded-lg border border-gray-300 focus:outline-hidden focus:border-[#C76B4A]"
                      />
                    </div>
                    {req.unidade_medida && (
                      <span className="px-3 py-2 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                        {req.unidade_medida}
                      </span>
                    )}
                    {(req.valor_minimo !== undefined || req.valor_maximo !== undefined) && (
                      <span className="text-[11px] text-gray-500">
                        Faixa ideal: {req.valor_minimo ?? 'min'} a {req.valor_maximo ?? 'max'} {req.unidade_medida}
                      </span>
                    )}
                  </div>
                )}

                {/* 3. PHOTO ATTACHMENT TYPE */}
                {req.tipo === 'FOTO' && (
                  <div className="space-y-3 pt-1">
                    {evidenceMap[req.id] ? (
                      <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 group">
                        <img
                          src={evidenceMap[req.id]}
                          alt="Evidência fotográfica"
                          className="w-full h-44 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleSimulatePhotoUpload(req.id)}
                            className="px-3 py-1.5 bg-white/90 hover:bg-white text-[#343A40] text-xs font-bold rounded-lg shadow-sm"
                          >
                            Trocar Foto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 bg-[#FAFAFA]">
                        <Camera className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-600 font-medium">
                          Nenhuma foto anexada ainda
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleSimulatePhotoUpload(req.id)}
                            className="px-3.5 py-1.5 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Capturar / Anexar Foto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. DOCUMENT / FILE ATTACHMENT TYPE */}
                {req.tipo === 'ARQUIVO' && (
                  <div className="space-y-2 pt-1">
                    {evidenceMap[req.id] ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                          <FileCheck2 className="w-4 h-4 text-blue-600" />
                          <span>{evidenceMap[req.id]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEvidenceMap({ ...evidenceMap, [req.id]: '' })}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSimulateFileUpload(req.id)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors"
                      >
                        <FileUp className="w-4 h-4 text-gray-400" />
                        Clique para anexar documento técnico / laudo em PDF
                      </button>
                    )}
                  </div>
                )}

                {/* 5. TEXT OPINION TYPE */}
                {req.tipo === 'TEXTO' && (
                  <div className="pt-1">
                    <textarea
                      rows={2}
                      placeholder="Escreva as considerações técnicas ou parecer..."
                      value={evidenceMap[req.id] ?? ''}
                      onChange={(e) =>
                        setEvidenceMap({ ...evidenceMap, [req.id]: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A] resize-none"
                    />
                  </div>
                )}

                {/* 6. OPTIONS SELECTION TYPE */}
                {req.tipo === 'OPCAO' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {req.opcoes?.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEvidenceMap({ ...evidenceMap, [req.id]: opt })}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                          evidenceMap[req.id] === opt
                            ? 'bg-[#C76B4A] text-white border-[#C76B4A] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* 7. QUESTIONNAIRE FORM TYPE */}
                {req.tipo === 'FORMULARIO' && (
                  <div className="space-y-3 pt-1 border-t border-gray-100">
                    {req.perguntas?.map((perg) => {
                      const formAnswers = evidenceMap[req.id] || {};
                      const currAnswer = formAnswers[perg.id];

                      return (
                        <div key={perg.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                          <div className="text-xs font-semibold text-gray-800 flex items-center justify-between">
                            <span>{perg.pergunta}</span>
                            {perg.obrigatoria && (
                              <span className="text-[10px] text-red-500">*</span>
                            )}
                          </div>

                          {perg.tipo === 'SIM_NAO' && (
                            <div className="flex items-center gap-2">
                              {['SIM', 'NÃO'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setEvidenceMap({
                                      ...evidenceMap,
                                      [req.id]: { ...formAnswers, [perg.id]: opt },
                                    })
                                  }
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                    currAnswer === opt
                                      ? 'bg-[#355C7D] text-white border-[#355C7D]'
                                      : 'bg-white text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {perg.tipo === 'NUMERO' && (
                            <input
                              type="number"
                              placeholder="0"
                              value={currAnswer || ''}
                              onChange={(e) =>
                                setEvidenceMap({
                                  ...evidenceMap,
                                  [req.id]: { ...formAnswers, [perg.id]: e.target.value },
                                })
                              }
                              className="w-32 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200"
                            />
                          )}

                          {perg.tipo === 'SELECAO' && perg.opcoes && (
                            <select
                              value={currAnswer || ''}
                              onChange={(e) =>
                                setEvidenceMap({
                                  ...evidenceMap,
                                  [req.id]: { ...formAnswers, [perg.id]: e.target.value },
                                })
                              }
                              className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200"
                            >
                              <option value="">Selecione uma opção...</option>
                              {perg.opcoes.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Execution details & Observations */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE3DC] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tempo Efetivo de Execução (Minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={tempoMinutos}
                  onChange={(e) => setTempoMinutos(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Observações de Encerramento & Parecer Final
                </label>
                <textarea
                  rows={2}
                  placeholder="Relate resumo final, observações para auditoria ou justificativas..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Direct Communication & Comments Thread */}
          <CommentsThread
            itemTipo="TAREFA"
            itemId={task.id}
            itemTitulo={task.numero_os}
            compact={true}
            showHeader={true}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onOpenBlockModal && task.status !== 'BLOQUEADA' && (
              <button
                type="button"
                onClick={() => onOpenBlockModal(task)}
                className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Reportar Bloqueio / Falta de Insumo
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleCompleteTask}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Concluir OS com Evidências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
