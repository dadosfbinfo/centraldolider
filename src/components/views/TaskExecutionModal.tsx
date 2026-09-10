import React, { useState, useEffect, useMemo } from 'react';
import {
  TarefaOS,
  EvidenciaSubmetida,
  RequisitoConclusao,
  ChecklistItem
} from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { CommentsThread } from '../comments/CommentsThread';
import { useAuth } from '../../context/AuthContext';
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
  Calendar,
  ShieldCheck,
  RotateCcw,
  Ban,
  FileText,
  FileDown
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
  const { currentUser } = useAuth();
  const isManager = currentUser?.role === 'ADMINISTRADOR' || currentUser?.role === 'GERENCIA';
  const isReadOnly = task?.status === 'CONCLUIDA' || task?.status === 'AGUARDANDO_VALIDACAO';

  // Validation permissions check
  const isSelectedValidator = !task?.validadores_ids || task.validadores_ids.length === 0 || (currentUser ? task.validadores_ids.includes(currentUser.id) : false);

  const isManagedLeader = useMemo(() => {
    if (!currentUser || !task) return true;
    if (currentUser.role !== 'GERENCIA') return true;
    const leaders = dbStore.getLeaders();
    const leader = leaders.find((l) => l.usuario_id === task.responsavel_id || l.id === task.responsavel_id);
    if (leader) {
      if (leader.gestores_imediatos_ids && leader.gestores_imediatos_ids.length > 0) {
        return leader.gestores_imediatos_ids.includes(currentUser.id);
      }
      return false;
    }
    return false;
  }, [currentUser, task]);

  const hasAlreadyApproved = useMemo(() => {
    if (!currentUser || !task?.validacoes_aprovadas) return false;
    return task.validacoes_aprovadas.some((a) => a.validador_id === currentUser.id);
  }, [currentUser, task]);

  const validatorsList = useMemo(() => {
    if (!task) return [];
    const allUsers = dbStore.getUsers();
    const vIds = (task.validadores_ids && task.validadores_ids.length > 0)
      ? task.validadores_ids
      : (task.validado_por_id ? [task.validado_por_id] : []);

    return vIds.map((vId) => {
      const u = allUsers.find((user) => user.id === vId);
      const approval = task.validacoes_aprovadas?.find((a) => a.validador_id === vId);
      return {
        id: vId,
        nome: u?.nome || approval?.validador_nome || 'Validador',
        role: u?.role || approval?.validador_role || 'GERENCIA',
        approved: !!approval,
        approvalData: approval?.data_validacao,
      };
    });
  }, [task]);

  const canValidateOS = isManager && isSelectedValidator && isManagedLeader && !hasAlreadyApproved;

  // State for dynamic evidence inputs keyed by requirement id
  const [evidenceMap, setEvidenceMap] = useState<Record<string, any>>({});
  const [observacoes, setObservacoes] = useState('');
  const [tempoMinutos, setTempoMinutos] = useState(30);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Status and Confirmation Modals (OM-01, OM-02, OM-03)
  const [currentStatus, setCurrentStatus] = useState<string>(task?.status || 'PROGRAMADA');
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isValidationSubmitModalOpen, setIsValidationSubmitModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Initialize values from task
  useEffect(() => {
    if (task && isOpen) {
      setCurrentStatus(task.status);
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
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    setEvidenceMap({
      ...evidenceMap,
      [reqId]: `Laudo_Tecnico_Conformidade_${task.numero_os.replace(/\s+/g, '')}.pdf`,
    });
  };

  // Start execution directly and persist in database (OM-01)
  const handleStartTaskClick = () => {
    try {
      const updated = dbStore.startTask(task.id);
      task.status = 'EM_ANDAMENTO';
      task.data_inicio = updated.data_inicio;
      setCurrentStatus('EM_ANDAMENTO');
      setErrorMessage('');
      if (onCompleted) onCompleted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao iniciar execução da tarefa.');
    }
  };

  const handleConfirmStartTask = () => {
    handleStartTaskClick();
    setIsStartModalOpen(false);
  };

  // Cancellation handler (OM-03)
  const handleConfirmCancelTask = () => {
    if (!task) return;
    if (currentUser?.role === 'LIDER') {
      setErrorMessage('O perfil de Líder não possui permissão para cancelar Ordens de Serviço.');
      setIsCancelModalOpen(false);
      return;
    }
    if (task.status === 'CONCLUIDA' || currentStatus === 'CONCLUIDA') {
      setErrorMessage('Não é possível cancelar uma Ordem de Serviço concluída.');
      return;
    }
    try {
      dbStore.cancelTask(task.id, cancelReason.trim() || undefined, currentUser?.role);
      setCurrentStatus('CANCELADA');
      task.status = 'CANCELADA';
      setIsCancelModalOpen(false);
      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cancelar a Ordem de Serviço.');
    }
  };

  // Validate mandatory requirements helper
  const validateRequirements = (): string | null => {
    for (const req of task.requisitos_conclusao || []) {
      const val = evidenceMap[req.id];

      if (req.obrigatorio) {
        if (req.tipo === 'CHECKLIST') {
          const totalItems = req.checklist_itens?.length || 0;
          const checkedCount = (val as string[])?.length || 0;
          if (checkedCount < totalItems) {
            return `Complete todos os ${totalItems} itens do checklist "${req.titulo}" antes de submeter.`;
          }
        } else if (req.tipo === 'NUMERO') {
          if (val === '' || val === undefined || isNaN(Number(val))) {
            return `O valor numérico para "${req.titulo}" é obrigatório.`;
          }
        } else if (req.tipo === 'TEXTO') {
          if (!val || !val.toString().trim()) {
            return `Preencha o campo obrigatório "${req.titulo}".`;
          }
        } else if (req.tipo === 'FOTO') {
          if (!val) {
            return `A foto comprobatória para "${req.titulo}" é obrigatória.`;
          }
        } else if (req.tipo === 'ARQUIVO') {
          if (!val) {
            return `O anexo de documento para "${req.titulo}" é obrigatório.`;
          }
        } else if (req.tipo === 'OPCAO') {
          if (!val) {
            return `Selecione uma opção para "${req.titulo}".`;
          }
        }
      }
    }
    return null;
  };

  // Approve Validation (Administrador or Gerência)
  const handleApproveValidation = () => {
    if (!currentUser || !task) return;
    setIsSubmitting(true);
    try {
      dbStore.approveTaskValidation(task.id, {
        id: currentUser.id,
        nome: currentUser.nome,
        role: currentUser.role,
      });
      setCurrentStatus('CONCLUIDA');
      task.status = 'CONCLUIDA';
      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao aprovar validação da OS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject / Return Validation for adjustments
  const handleRejectValidation = () => {
    if (!currentUser || !task) return;
    if (!rejectionReason.trim()) {
      setErrorMessage('Por favor, informe o motivo da devolução da OS para que o Líder possa corrigir.');
      return;
    }
    setIsSubmitting(true);
    try {
      dbStore.rejectTaskValidation(
        task.id,
        {
          id: currentUser.id,
          nome: currentUser.nome,
          role: currentUser.role,
        },
        rejectionReason.trim()
      );
      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao devolver tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Button click before submission - triggers explanatory modal for leaders (OM-02)
  const handleSubmitEvidenceClick = () => {
    const error = validateRequirements();
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage('');

    // If submitted by leader, it goes to validation -> show OM-02 explanatory popup
    if (!isManager) {
      setIsValidationSubmitModalOpen(true);
    } else {
      executeCompleteTask();
    }
  };

  // Validate and submit completion
  const executeCompleteTask = () => {
    // Validate mandatory requirements
    const formattedEvidencias: EvidenciaSubmetida[] = [];
    const now = new Date().toISOString();

    for (const req of task.requisitos_conclusao || []) {
      const val = evidenceMap[req.id];

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
      const updated = dbStore.completeTask(
        task.id,
        {
          evidencias: formattedEvidencias,
          observacoes_conclusao: observacoes.trim() || undefined,
          tempo_execucao_minutos: tempoMinutos,
        },
        currentUser?.role,
        currentUser ? { id: currentUser.id, nome: currentUser.nome } : undefined
      );

      if (updated) {
        setCurrentStatus(updated.status);
        task.status = updated.status;
      }

      setIsValidationSubmitModalOpen(false);
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
          {/* Status & Deadline Banner (OM-01) */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE3DC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">Status Atual:</span>
                <span
                  className={`font-bold uppercase ${
                    currentStatus === 'AGUARDANDO_VALIDACAO'
                      ? 'text-purple-700'
                      : currentStatus === 'CONCLUIDA'
                      ? 'text-emerald-700'
                      : currentStatus === 'EM_ANDAMENTO'
                      ? 'text-blue-700'
                      : currentStatus === 'CANCELADA'
                      ? 'text-stone-600'
                      : 'text-[#C76B4A]'
                  }`}
                >
                  {currentStatus === 'AGUARDANDO_VALIDACAO'
                    ? 'Em validação'
                    : currentStatus === 'EM_ANDAMENTO'
                    ? 'Em andamento'
                    : currentStatus === 'CONCLUIDA'
                    ? 'Concluída'
                    : currentStatus === 'CANCELADA'
                    ? 'Cancelada'
                    : currentStatus === 'ATRASADA'
                    ? 'Atrasada'
                    : currentStatus === 'BLOQUEADA'
                    ? 'Bloqueada'
                    : 'Programada'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Prazo Limite: {task.prazo ? task.prazo.replace('T', ' às ') : 'Hoje'}</span>
              </div>
            </div>

            {/* Visual indicator / Action replacing Iniciar Execução button (OM-01) */}
            {currentStatus === 'EM_ANDAMENTO' ? (
              <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span>Em andamento</span>
              </div>
            ) : currentStatus === 'AGUARDANDO_VALIDACAO' ? (
              <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 text-purple-800 font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Em validação</span>
              </div>
            ) : currentStatus === 'CONCLUIDA' ? (
              <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Concluída</span>
              </div>
            ) : currentStatus === 'CANCELADA' ? (
              <div className="px-3.5 py-2 bg-stone-100 border border-stone-300 text-stone-700 font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-2xs">
                <Ban className="w-3.5 h-3.5 text-stone-500" />
                <span>Cancelada</span>
              </div>
            ) : !isManager ? (
              <button
                type="button"
                onClick={handleStartTaskClick}
                className="px-4 py-2 bg-[#355C7D] hover:bg-[#2c4c66] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Execução
              </button>
            ) : null}
          </div>

          {/* Validation Notice Banner */}
          {task.status === 'AGUARDANDO_VALIDACAO' && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-col gap-3 text-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-purple-900 uppercase tracking-wide">
                      Aguardando Validação
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800">
                    Ordem de serviço finalizada e submetida pelo Líder{task.responsavel_nome ? ` (${task.responsavel_nome})` : ''} em {task.data_conclusao ? new Date(task.data_conclusao).toLocaleString('pt-BR') : 'recente'}.
                  </p>
                </div>
                {isManager && (
                  <span className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 self-start sm:self-center shrink-0 ${
                    hasAlreadyApproved
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : canValidateOS
                      ? 'bg-purple-200/80 text-purple-900'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {hasAlreadyApproved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sua validação foi registrada
                      </>
                    ) : canValidateOS ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-700" /> Requer sua aprovação
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-gray-500" /> Validação restrita
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Multi-validator status cards */}
              {validatorsList.length > 0 && (
                <div className="pt-2 border-t border-purple-200/70 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-purple-950">
                    <span>Validadores Designados (Aprovação obrigatória de todos):</span>
                    <span className="text-[10px] bg-purple-200/70 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      {validatorsList.filter((v) => v.approved).length} de {validatorsList.length} aprovado(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {validatorsList.map((val) => (
                      <div
                        key={val.id}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                          val.approved
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white/80 border-purple-200 text-purple-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {val.approved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          )}
                          <span className="font-semibold truncate">{val.nome}</span>
                          <span className="text-[10px] opacity-70">({val.role === 'GERENCIA' ? 'Gerência' : 'Admin'})</span>
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 ${val.approved ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {val.approved ? 'Aprovado' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rejection / Returned Alert */}
          {task.motivo_recusa && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>OS Devolvida para Ajuste por {task.recusado_por_nome || 'Gerência'}:</span>
              </div>
              <p className="text-[11px] pl-5 text-amber-800 font-medium">"{task.motivo_recusa}"</p>
            </div>
          )}

          {/* Approval Confirmation Info */}
          {task.status === 'CONCLUIDA' && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  Ordem de Serviço 100% Validada e Concluída
                </span>
              </div>
              {task.validacoes_aprovadas && task.validacoes_aprovadas.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1 pl-6">
                  {task.validacoes_aprovadas.map((aprov) => (
                    <span
                      key={aprov.validador_id}
                      className="px-2 py-1 bg-white rounded-md border border-emerald-300 text-[11px] text-emerald-900 font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <strong>{aprov.validador_nome}</strong> ({aprov.validador_role === 'GERENCIA' ? 'Gerência' : 'Admin'}) em {new Date(aprov.data_validacao).toLocaleDateString('pt-BR')}
                    </span>
                  ))}
                </div>
              ) : task.validado_por_nome ? (
                <p className="text-[11px] pl-6 text-emerald-800">
                  Validada por <strong>{task.validado_por_nome}</strong> ({task.validado_por_role === 'GERENCIA' ? 'Gerência' : 'Admin'}) {task.data_validacao ? `em ${new Date(task.data_validacao).toLocaleString('pt-BR')}` : ''}
                </p>
              ) : null}
            </div>
          )}

          {/* Instructions */}
          {task.descricao && (
            <div className="p-4 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 leading-relaxed">
              <span className="font-bold text-[#343A40] block mb-1">Diretrizes & Procedimento:</span>
              <p>{task.descricao}</p>
            </div>
          )}

          {/* Documento de Apoio / PDF Opcional (OM-05) */}
          {(task.anexo_pdf_nome || task.anexo_pdf_url) && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#C76B4A]" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span>Documento de Apoio / Procedimento:</span>
                    <span className="font-mono text-[11px] text-stone-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      {task.anexo_pdf_nome || 'Documento_Referencia.pdf'}
                    </span>
                    {task.anexo_pdf_tamanho && (
                      <span className="text-[10px] font-medium text-stone-600">({task.anexo_pdf_tamanho})</span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1">
                    Documento de referência anexado para consulta do Líder. <em>(Nota: Este documento não substitui a comprovação das evidências obrigatórias abaixo).</em>
                  </p>
                </div>
              </div>
              <a
                href={task.anexo_pdf_url || '#'}
                download={task.anexo_pdf_nome || `${task.numero_os}_Documento_Apoio.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!task.anexo_pdf_url || task.anexo_pdf_url.startsWith('data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr')) {
                    e.preventDefault();
                    const sampleText = `CENTRAL DO LÍDER - DOCUMENTO DE APOIO OPERACIONAL\n\nOrdem de Serviço: ${task.numero_os}\nTítulo: ${task.titulo}\nUnidade/Projeto: ${task.unidade}\n\nDiretrizes Operacionais:\n${task.descricao || 'Consulte os requisitos e procedimentos definidos para esta tarefa.'}\n\nData de Emissão: ${new Date().toLocaleDateString('pt-BR')}`;
                    const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = task.anexo_pdf_nome || `${task.numero_os}_Documento_Apoio.txt`;
                    a.click();
                  }
                }}
                className="px-3.5 py-2 bg-[#355C7D] hover:bg-[#2c4c66] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                Baixar / Consultar PDF
              </a>
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
                  disabled={isReadOnly}
                  value={tempoMinutos}
                  onChange={(e) => setTempoMinutos(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Observações de Encerramento & Parecer Final
                </label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  placeholder="Relate resumo final, observações para auditoria ou justificativas..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 resize-none disabled:bg-gray-100 disabled:text-gray-500"
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
          <div className="flex flex-wrap items-center gap-2">
            {onOpenBlockModal &&
              currentStatus !== 'BLOQUEADA' &&
              currentStatus !== 'CONCLUIDA' &&
              currentStatus !== 'CANCELADA' &&
              currentStatus !== 'AGUARDANDO_VALIDACAO' && (
                <button
                  type="button"
                  onClick={() => onOpenBlockModal(task)}
                  className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Reportar Bloqueio / Falta de Insumo
                </button>
              )}

            {/* Cancel Button (OM-03) - Only for ADMIN or GERENCIA (Never visible for LIDER, CONCLUIDA or CANCELADA) */}
            {currentUser?.role !== 'LIDER' && currentStatus !== 'CONCLUIDA' && currentStatus !== 'CANCELADA' && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancelar OS
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Fechar
            </button>

            {currentStatus === 'AGUARDANDO_VALIDACAO' ? (
              canValidateOS ? (
                isRejecting ? (
                  <div className="w-full flex flex-col gap-2 pt-2 border-t border-red-200 mt-2">
                    <label className="text-xs font-bold text-red-900">
                      Motivo da Devolução para Ajuste:
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Descreva o que o Líder precisa corrigir..."
                      className="w-full p-2 text-xs bg-white rounded-lg border border-red-300 focus:outline-hidden"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRejecting(false);
                          setRejectionReason('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectValidation}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Confirmar Devolução
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      Devolver para Ajuste
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveValidation}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Aprovar e Concluir OS
                    </button>
                  </>
                )
              ) : hasAlreadyApproved ? (
                <div className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sua validação foi registrada. Aguardando validação dos demais validadores designados.</span>
                </div>
              ) : isManager ? (
                <div className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {!isSelectedValidator
                      ? 'Você não foi selecionado como Validador desta OS durante a criação.'
                      : 'Esta OS pertence a um Líder fora da sua gestão direta (Gestor Imediato).'}
                  </span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Aguardando Validação da Gerência / Admin
                </div>
              )
            ) : currentStatus !== 'CONCLUIDA' && currentStatus !== 'CANCELADA' ? (
              <button
                type="button"
                onClick={handleSubmitEvidenceClick}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isManager ? 'Concluir OS com Evidências' : 'Submeter para Validação'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Início de Execução (OM-01) */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-gray-900">
                Iniciar Execução da Tarefa
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                A execução da Ordem de Serviço foi iniciada com sucesso. O status da tarefa agora é <strong>"Em andamento"</strong>. Prossiga com o preenchimento das etapas e envio das evidências necessárias.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleConfirmStartTask}
                className="w-full py-2.5 px-4 bg-[#355C7D] hover:bg-[#2c4c66] text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Continuar Execução
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Submissão para Validação (OM-02) */}
      {isValidationSubmitModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-gray-900">
                Submeter para Validação
              </h3>
              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950 font-semibold leading-relaxed text-left">
                A Tarefa será validada pelo(s) devido(s) responsável(s), e só depois, será marcada como Concluída.
              </div>
              <p className="text-[11px] text-gray-500 text-left leading-relaxed">
                Uma notificação interna automática foi enviada ao seu perfil e aos validadores responsáveis designados.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsValidationSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Revisar Evidências
              </button>
              <button
                type="button"
                onClick={executeCompleteTask}
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Envio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento de OS (OM-03) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-gray-900">
                Cancelar Ordem de Serviço
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed text-left">
                Tem certeza que deseja cancelar a Ordem de Serviço <strong>{task.numero_os}</strong>? Ela permanecerá visível no sistema e na aba <strong>Canceladas</strong> para controle do histórico.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-gray-700">
                Motivo do cancelamento (opcional):
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Operação suspensa pelo cliente, escopo alterado..."
                className="w-full p-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelTask}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
