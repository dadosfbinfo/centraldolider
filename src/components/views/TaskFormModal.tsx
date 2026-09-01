import React, { useState, useEffect } from 'react';
import {
  TarefaOS,
  TaskPriority,
  TaskRecurrence,
  TaskEvidenceType,
  RequisitoConclusao,
  ChecklistItem,
  FormularioPergunta,
  Unidade,
  Categoria,
  Lider
} from '../../types/database';
import { dbStore } from '../../services/dbStore';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Building2,
  User,
  Tag,
  AlertTriangle,
  CheckSquare,
  HelpCircle,
  FileCheck,
  Camera,
  FileUp,
  ListFilter,
  Hash,
  Sparkles
} from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TarefaOS | null;
  onSaved?: (task: TarefaOS) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  onSaved,
}) => {
  const [units, setUnits] = useState<Unidade[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [leaders, setLeaders] = useState<Lider[]>([]);

  // Form Basic Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<TaskPriority>('MEDIA');
  const [categoriaId, setCategoriaId] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');

  // Scheduling & Deadlines
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('08:00');
  const [prazo, setPrazo] = useState('');

  // Recurrence
  const [recorrencia, setRecorrencia] = useState<TaskRecurrence>('UMA_VEZ');
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);

  // Evidence Requirements
  const [requisitos, setRequisitos] = useState<RequisitoConclusao[]>([]);

  // Quick state for adding a new requirement item
  const [selectedReqType, setSelectedReqType] = useState<TaskEvidenceType>('CHECKLIST');

  // Error handling
  const [errorMessage, setErrorMessage] = useState('');

  // Load select options
  useEffect(() => {
    if (isOpen) {
      const uList = dbStore.getUnits();
      const cList = dbStore.getCategories();
      const lList = dbStore.getLeaders();

      setUnits(uList);
      setCategories(cList);
      setLeaders(lList);

      if (taskToEdit) {
        setTitulo(taskToEdit.titulo);
        setDescricao(taskToEdit.descricao || '');
        setPrioridade(taskToEdit.prioridade);
        setCategoriaId(taskToEdit.categoria_id || (cList[0]?.id || ''));
        setUnidadeId(taskToEdit.unidade_id || (uList[0]?.id || ''));
        setResponsavelId(taskToEdit.responsavel_id);
        setData(taskToEdit.data);
        setHorario(taskToEdit.horario || '08:00');
        setPrazo(taskToEdit.prazo || '');
        setRecorrencia(taskToEdit.recorrencia || 'UMA_VEZ');
        setDiasSemana(taskToEdit.recorrencia_config?.dias_semana || [1, 2, 3, 4, 5]);
        setRequisitos(taskToEdit.requisitos_conclusao ? [...taskToEdit.requisitos_conclusao] : []);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const defaultDeadline = new Date();
        defaultDeadline.setHours(defaultDeadline.getHours() + 4);

        setTitulo('');
        setDescricao('');
        setPrioridade('ALTA');
        setCategoriaId(cList[0]?.id || '');
        setUnidadeId(uList[0]?.id || '');
        setResponsavelId(lList[0]?.usuario_id || '');
        setData(todayStr);
        setHorario('08:00');
        setPrazo(defaultDeadline.toISOString().slice(0, 16));
        setRecorrencia('UMA_VEZ');
        setDiasSemana([1, 2, 3, 4, 5]);
        // Default requirement
        setRequisitos([
          {
            id: 'req-' + Date.now().toString(36),
            tipo: 'CHECKLIST',
            titulo: 'Checklist de Verificação Operacional',
            instrucoes: 'Conclua todos os passos da rotina antes de finalizar',
            obrigatorio: true,
            checklist_itens: [
              { id: 'c-1', texto: 'Inspeção visual e contagem de itens de segurança', concluido: false },
              { id: 'c-2', texto: 'Validação de conformidade no sistema de controle', concluido: false },
            ]
          }
        ]);
      }
      setErrorMessage('');
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  // Auto-sync leader when unit changes (if leader matches)
  const handleUnitChange = (newUnitId: string) => {
    setUnidadeId(newUnitId);
    const matchingLeader = leaders.find((l) => l.unidade_id === newUnitId);
    if (matchingLeader) {
      setResponsavelId(matchingLeader.usuario_id);
    }
  };

  // Auto-sync unit when leader changes
  const handleLeaderChange = (newLeaderUserId: string) => {
    setResponsavelId(newLeaderUserId);
    const leaderObj = leaders.find((l) => l.usuario_id === newLeaderUserId);
    if (leaderObj?.unidade_id) {
      setUnidadeId(leaderObj.unidade_id);
    }
  };

  // Quick deadline shortcuts
  const applyQuickDeadline = (hoursToAdd: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursToAdd);
    setPrazo(d.toISOString().slice(0, 16));
  };

  const applyEndOfDayDeadline = () => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    setPrazo(d.toISOString().slice(0, 16));
  };

  const applyTomorrowDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    setPrazo(d.toISOString().slice(0, 16));
  };

  // --- REQUIREMENTS BUILDER HELPERS ---
  const handleAddRequirement = () => {
    const newId = 'req-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
    let newReq: RequisitoConclusao;

    switch (selectedReqType) {
      case 'CHECKLIST':
        newReq = {
          id: newId,
          tipo: 'CHECKLIST',
          titulo: 'Lista de Verificação (Checklist)',
          obrigatorio: true,
          checklist_itens: [
            { id: 'item-1', texto: 'Passo 1: Conferência preliminar', concluido: false },
            { id: 'item-2', texto: 'Passo 2: Execução do procedimento', concluido: false },
          ]
        };
        break;
      case 'NUMERO':
        newReq = {
          id: newId,
          tipo: 'NUMERO',
          titulo: 'Medição Numérica / Indicador',
          instrucoes: 'Informe o valor numérico aferido',
          unidade_medida: 'un',
          obrigatorio: true,
        };
        break;
      case 'TEXTO':
        newReq = {
          id: newId,
          tipo: 'TEXTO',
          titulo: 'Parecer Técnico / Relato Escrito',
          instrucoes: 'Descreva observações detalhadas sobre a execução',
          obrigatorio: true,
        };
        break;
      case 'FOTO':
        newReq = {
          id: newId,
          tipo: 'FOTO',
          titulo: 'Evidência Fotográfica Obrigatória',
          instrucoes: 'Anexe uma foto nítida comprovando o resultado',
          obrigatorio: true,
        };
        break;
      case 'ARQUIVO':
        newReq = {
          id: newId,
          tipo: 'ARQUIVO',
          titulo: 'Documento / Laudo Anexo (PDF/DOC)',
          instrucoes: 'Faça upload do comprovante emitido',
          obrigatorio: true,
        };
        break;
      case 'OPCAO':
        newReq = {
          id: newId,
          tipo: 'OPCAO',
          titulo: 'Seleção de Resultado Operacional',
          obrigatorio: true,
          opcoes: ['Aprovado sem ressalvas', 'Aprovado com pendências leves', 'Reprovado / Crítico']
        };
        break;
      case 'FORMULARIO':
        newReq = {
          id: newId,
          tipo: 'FORMULARIO',
          titulo: 'Questionário de Auditoria',
          obrigatorio: true,
          perguntas: [
            { id: 'q1', pergunta: 'O ambiente estava em conformidade?', tipo: 'SIM_NAO', obrigatoria: true },
            { id: 'q2', pergunta: 'Total de não-conformidades encontradas:', tipo: 'NUMERO', obrigatoria: true },
          ]
        };
        break;
      case 'SIMPLES':
      default:
        newReq = {
          id: newId,
          tipo: 'SIMPLES',
          titulo: 'Confirmação de Execução',
          obrigatorio: true,
        };
        break;
    }

    setRequisitos([...requisitos, newReq]);
  };

  const handleRemoveRequirement = (id: string) => {
    setRequisitos(requisitos.filter((r) => r.id !== id));
  };

  const handleUpdateReqTitle = (id: string, newTitle: string) => {
    setRequisitos(requisitos.map((r) => (r.id === id ? { ...r, titulo: newTitle } : r)));
  };

  const handleUpdateReqInstructions = (id: string, newInstructions: string) => {
    setRequisitos(requisitos.map((r) => (r.id === id ? { ...r, instrucoes: newInstructions } : r)));
  };

  const handleToggleReqRequired = (id: string) => {
    setRequisitos(requisitos.map((r) => (r.id === id ? { ...r, obrigatorio: !r.obrigatorio } : r)));
  };

  // Checklist item actions
  const handleAddChecklistItem = (reqId: string) => {
    setRequisitos(
      requisitos.map((r) => {
        if (r.id === reqId) {
          const items = r.checklist_itens || [];
          return {
            ...r,
            checklist_itens: [
              ...items,
              { id: 'item-' + Date.now().toString(36), texto: 'Novo item a conferir', concluido: false },
            ],
          };
        }
        return r;
      })
    );
  };

  const handleUpdateChecklistItem = (reqId: string, itemId: string, text: string) => {
    setRequisitos(
      requisitos.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            checklist_itens: r.checklist_itens?.map((c) => (c.id === itemId ? { ...c, texto: text } : c)),
          };
        }
        return r;
      })
    );
  };

  const handleRemoveChecklistItem = (reqId: string, itemId: string) => {
    setRequisitos(
      requisitos.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            checklist_itens: r.checklist_itens?.filter((c) => c.id !== itemId),
          };
        }
        return r;
      })
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMessage('O título da Ordem de Serviço é obrigatório.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoriaId);
    const selectedUnit = units.find((u) => u.id === unidadeId);
    const selectedLeader = leaders.find((l) => l.usuario_id === responsavelId);

    if (requisitos.length === 0) {
      setErrorMessage('Adicione pelo menos um requisito de conclusão / evidência para a OS.');
      return;
    }

    try {
      let savedTask: TarefaOS;

      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
        categoria_id: categoriaId,
        categoria_nome: selectedCategory?.nome || 'Operacional',
        categoria_cor: selectedCategory?.cor || '#C76B4A',
        unidade_id: unidadeId,
        unidade: selectedUnit?.nome || 'Matriz Geral',
        responsavel_id: responsavelId,
        responsavel_nome: selectedLeader?.nome || 'Mariana Costa',
        responsavel_cargo: selectedLeader?.cargo || 'Gerente de Unidade',
        data,
        horario,
        prazo: prazo || undefined,
        status: taskToEdit ? taskToEdit.status : ('PROGRAMADA' as const),
        recorrencia,
        recorrencia_config: recorrencia === 'PERSONALIZADA' ? { dias_semana: diasSemana, horario_custom: horario } : undefined,
        requisitos_conclusao: requisitos,
      };

      if (taskToEdit) {
        savedTask = dbStore.updateTask(taskToEdit.id, payload);
      } else {
        savedTask = dbStore.createTask(payload);
      }

      if (onSaved) onSaved(savedTask);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar Ordem de Serviço.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-[#FCFAFA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C76B4A]/10 flex items-center justify-center text-[#C76B4A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#343A40]">
                  {taskToEdit ? `Editar OS (${taskToEdit.numero_os})` : 'Nova Ordem de Serviço (OS)'}
                </h2>
                {!taskToEdit && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C76B4A]/10 text-[#C76B4A] border border-[#C76B4A]/20">
                    {dbStore.generateNextOsNumber()}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Configure os parâmetros, prazos, recorrência e critérios dinâmicos de evidência
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="w-2 h-2 rounded-full bg-[#C76B4A]" />
              <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                1. Informações Principais da OS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Título da Tarefa / OS <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Auditoria Diária de Abertura de Caixa e Fundo de Reserva"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A] focus:ring-1 focus:ring-[#C76B4A] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Prioridade Operacional
                </label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                >
                  <option value="BAIXA">🟢 Baixa</option>
                  <option value="MEDIA">🟡 Média</option>
                  <option value="ALTA">🟠 Alta (SLA rigoroso)</option>
                  <option value="CRITICA">🔴 Crítica (Urgência máxima)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Instruções Operacionais e Diretrizes Detalhadas
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva o passo a passo, normas de segurança e procedimentos necessários..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Categoria da OS
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Unidade Operacional
                </label>
                <select
                  value={unidadeId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Líder Responsável Designado
                </label>
                <select
                  value={responsavelId}
                  onChange={(e) => handleLeaderChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                >
                  {leaders.map((l) => (
                    <option key={l.id} value={l.usuario_id}>
                      {l.nome} ({l.cargo || 'Líder'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Scheduling, Deadlines & Recurrence */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="w-2 h-2 rounded-full bg-[#5B7DBE]" />
              <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                2. Agendamento, Prazos (SLA) e Recorrência
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Data de Execução
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Horário de Início Programado
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Prazo Limite / Tolerância (SLA)
                </label>
                <input
                  type="datetime-local"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                />
              </div>

              {/* Quick SLA buttons */}
              <div className="sm:col-span-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-400 font-medium text-[11px]">Atalhos de Prazo:</span>
                <button
                  type="button"
                  onClick={() => applyQuickDeadline(2)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition-colors"
                >
                  +2 Horas
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickDeadline(4)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition-colors"
                >
                  +4 Horas
                </button>
                <button
                  type="button"
                  onClick={applyEndOfDayDeadline}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition-colors"
                >
                  Hoje até 18:00
                </button>
                <button
                  type="button"
                  onClick={applyTomorrowDeadline}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition-colors"
                >
                  Amanhã 12:00
                </button>
              </div>

              {/* Recurrence Selector */}
              <div className="sm:col-span-3 p-4 bg-[#F8F9FA] rounded-xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-[#343A40]">
                    Padrão de Recorrência Automática
                  </label>
                  <span className="text-[11px] text-gray-400">
                    O sistema agenda as próximas ocorrências automaticamente
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'UMA_VEZ', label: 'Uma vez' },
                    { id: 'DIARIA', label: 'Diária' },
                    { id: 'DIAS_UTEIS', label: 'Dias úteis (Seg-Sex)' },
                    { id: 'SEMANAL', label: 'Semanal' },
                    { id: 'MENSAL', label: 'Mensal' },
                    { id: 'PERSONALIZADA', label: 'Personalizada' },
                  ].map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setRecorrencia(rec.id as TaskRecurrence)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                        recorrencia === rec.id
                          ? 'bg-[#C76B4A] text-white border-[#C76B4A] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>

                {recorrencia === 'PERSONALIZADA' && (
                  <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Dias de repetição:</span>
                    {[
                      { day: 1, label: 'Seg' },
                      { day: 2, label: 'Ter' },
                      { day: 3, label: 'Qua' },
                      { day: 4, label: 'Qui' },
                      { day: 5, label: 'Sex' },
                      { day: 6, label: 'Sáb' },
                      { day: 0, label: 'Dom' },
                    ].map((d) => {
                      const isSelected = diasSemana.includes(d.day);
                      return (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setDiasSemana(diasSemana.filter((x) => x !== d.day));
                            } else {
                              setDiasSemana([...diasSemana, d.day]);
                            }
                          }}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-[#355C7D] text-white'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Evidence / Completion Requirements Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B6B4A]" />
                <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                  3. Critérios & Requisitos de Conclusão (Evidências)
                </h3>
              </div>
              <span className="text-[11px] text-[#C76B4A] font-semibold">
                {requisitos.length} {requisitos.length === 1 ? 'requisito configurado' : 'requisitos configurados'}
              </span>
            </div>

            {/* List of configured requirements */}
            <div className="space-y-3">
              {requisitos.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                  Nenhum critério adicionado. Escolha um tipo abaixo para adicionar à OS.
                </div>
              ) : (
                requisitos.map((req, index) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#8B6B4A] border border-[#EBE3DC]">
                          {req.tipo}
                        </span>
                        <input
                          type="text"
                          value={req.titulo}
                          onChange={(e) => handleUpdateReqTitle(req.id, e.target.value)}
                          placeholder="Título do requisito / critério"
                          className="flex-1 px-2.5 py-1 text-xs font-bold text-[#343A40] border-b border-dashed border-gray-300 hover:border-gray-500 focus:outline-hidden focus:border-[#C76B4A]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={req.obrigatorio}
                            onChange={() => handleToggleReqRequired(req.id)}
                            className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                          />
                          <span>Obrigatório</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(req.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover Requisito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={req.instrucoes || ''}
                      onChange={(e) => handleUpdateReqInstructions(req.id, e.target.value)}
                      placeholder="Instruções para o líder (opcional)..."
                      className="w-full px-2.5 py-1 text-xs text-gray-500 bg-[#FAFAFA] rounded-md border border-gray-100 focus:outline-hidden"
                    />

                    {/* Type specific config rendering */}
                    {req.tipo === 'CHECKLIST' && (
                      <div className="pl-6 space-y-2 border-l-2 border-[#C76B4A]/20 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                          <span>Itens do Checklist:</span>
                          <button
                            type="button"
                            onClick={() => handleAddChecklistItem(req.id)}
                            className="text-[#C76B4A] hover:underline flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Plus className="w-3 h-3" /> Adicionar Item
                          </button>
                        </div>
                        {req.checklist_itens?.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <CheckSquare className="w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="text"
                              value={item.texto}
                              onChange={(e) =>
                                handleUpdateChecklistItem(req.id, item.id, e.target.value)
                              }
                              className="flex-1 px-2 py-1 text-xs bg-white rounded-md border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveChecklistItem(req.id, item.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {req.tipo === 'NUMERO' && (
                      <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                        <div>
                          <label className="text-[10px] text-gray-500 font-semibold block">Unidade de Medida</label>
                          <input
                            type="text"
                            placeholder="Ex: °C, R$, kg, %"
                            value={req.unidade_medida || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRequisitos(
                                requisitos.map((r) =>
                                  r.id === req.id ? { ...r, unidade_medida: val } : r
                                )
                              );
                            }}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-semibold block">Valor Mínimo (Alerta)</label>
                          <input
                            type="number"
                            placeholder="-22"
                            value={req.valor_minimo ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              setRequisitos(
                                requisitos.map((r) =>
                                  r.id === req.id ? { ...r, valor_minimo: val } : r
                                )
                              );
                            }}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-semibold block">Valor Máximo (Alerta)</label>
                          <input
                            type="number"
                            placeholder="-18"
                            value={req.valor_maximo ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              setRequisitos(
                                requisitos.map((r) =>
                                  r.id === req.id ? { ...r, valor_maximo: val } : r
                                )
                              );
                            }}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Evidence Selector Bar */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EBE3DC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#343A40]">Adicionar Requisito:</span>
                <select
                  value={selectedReqType}
                  onChange={(e) => setSelectedReqType(e.target.value as TaskEvidenceType)}
                  className="px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-300 font-semibold text-gray-700 focus:outline-hidden"
                >
                  <option value="CHECKLIST">📋 Checklist (Itens de conferência)</option>
                  <option value="NUMERO">🔢 Número (Medição com unidade/faixa)</option>
                  <option value="FOTO">📸 Foto Comprobatória</option>
                  <option value="TEXTO">📝 Parecer / Texto Justificativo</option>
                  <option value="FORMULARIO">📑 Formulário com Perguntas</option>
                  <option value="ARQUIVO">📎 Arquivo Anexo (PDF/DOC)</option>
                  <option value="OPCAO">🔘 Opção / Seleção Única</option>
                  <option value="SIMPLES">✅ Marcação Simples (Executado)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-4 py-1.5 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Critério
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {taskToEdit ? 'Salvar Alterações na OS' : 'Criar Ordem de Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
