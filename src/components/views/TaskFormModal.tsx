import React, { useState, useEffect, useMemo } from 'react';
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
  Lider,
  UsuarioPerfil
} from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { useAuth } from '../../context/AuthContext';
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
  Sparkles,
  ShieldCheck,
  FileText,
  AlertCircle,
  Paperclip
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
  const { currentUser } = useAuth();
  const [units, setUnits] = useState<Unidade[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [leaders, setLeaders] = useState<Lider[]>([]);
  const [validatorUsers, setValidatorUsers] = useState<UsuarioPerfil[]>([]);

  // Form Basic Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoOperacao, setTipoOperacao] = useState('Rotina Operacional');
  const [prioridade, setPrioridade] = useState<TaskPriority>('MEDIA');
  const [categoriaId, setCategoriaId] = useState('');
  
  // Multi-select projects & validators
  const [projetosIds, setProjetosIds] = useState<string[]>([]);
  const [validadoresIds, setValidadoresIds] = useState<string[]>([]);

  // Scheduling & Deadlines
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('08:00');
  const [prazo, setPrazo] = useState('');

  // Recurrence
  const [recorrencia, setRecorrencia] = useState<TaskRecurrence>('UMA_VEZ');
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);

  // Evidence Requirements
  const [requisitos, setRequisitos] = useState<RequisitoConclusao[]>([]);

  // Optional PDF attachment (OM-05)
  const [anexoPdfNome, setAnexoPdfNome] = useState('');
  const [anexoPdfUrl, setAnexoPdfUrl] = useState('');
  const [anexoPdfTamanho, setAnexoPdfTamanho] = useState('');

  // Quick state for adding a new requirement item
  const [selectedReqType, setSelectedReqType] = useState<TaskEvidenceType>('CHECKLIST');
  const [newChecklistItemTexts, setNewChecklistItemTexts] = useState<Record<string, string>>({});

  // Error handling
  const [errorMessage, setErrorMessage] = useState('');

  // Load select options
  useEffect(() => {
    if (isOpen) {
      let uList = dbStore.getUnits();
      const cList = dbStore.getCategories();
      let lList = dbStore.getLeaders();
      const vList = dbStore.getUsers().filter((u) => u.role === 'ADMINISTRADOR' || u.role === 'GERENCIA');

      if (currentUser?.role === 'GERENCIA') {
        const managedProjectIds = dbStore.getManagedProjectIds(currentUser.id);
        const managedLeaderIds = dbStore.getManagedLeaderIds(currentUser.id);

        uList = uList.filter((u) => managedProjectIds.has(u.id));
        lList = lList.filter(
          (l) => managedLeaderIds.has(l.id) || managedLeaderIds.has(l.usuario_id)
        );
      }

      setUnits(uList);
      setCategories(cList);
      setLeaders(lList);
      setValidatorUsers(vList);

      if (taskToEdit) {
        setTitulo(taskToEdit.titulo);
        setDescricao(taskToEdit.descricao || '');
        setTipoOperacao(taskToEdit.tipo_operacao || 'Rotina Operacional');
        setPrioridade(taskToEdit.prioridade);
        setCategoriaId(taskToEdit.categoria_id || (cList[0]?.id || ''));
        
        const initialProjIds = taskToEdit.projetos_ids && taskToEdit.projetos_ids.length > 0
          ? taskToEdit.projetos_ids
          : taskToEdit.unidade_id || taskToEdit.projeto_id
          ? [taskToEdit.unidade_id || taskToEdit.projeto_id!]
          : uList[0]?.id ? [uList[0].id] : [];
        setProjetosIds(initialProjIds);

        const initialValIds = taskToEdit.validadores_ids && taskToEdit.validadores_ids.length > 0
          ? taskToEdit.validadores_ids
          : vList.map((v) => v.id);
        setValidadoresIds(initialValIds);

        setData(taskToEdit.data);
        setHorario(taskToEdit.horario || '08:00');
        setPrazo(taskToEdit.prazo || '');
        setRecorrencia(taskToEdit.recorrencia || 'UMA_VEZ');
        setDiasSemana(taskToEdit.recorrencia_config?.dias_semana || [1, 2, 3, 4, 5]);
        setRequisitos(taskToEdit.requisitos_conclusao ? [...taskToEdit.requisitos_conclusao] : []);
        setAnexoPdfNome(taskToEdit.anexo_pdf_nome || '');
        setAnexoPdfUrl(taskToEdit.anexo_pdf_url || '');
        setAnexoPdfTamanho(taskToEdit.anexo_pdf_tamanho || '');
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const defaultDeadline = new Date();
        defaultDeadline.setHours(defaultDeadline.getHours() + 4);

        setTitulo('');
        setDescricao('');
        setTipoOperacao('Rotina Operacional');
        setPrioridade('ALTA');
        setCategoriaId(cList[0]?.id || '');
        setProjetosIds(uList[0]?.id ? [uList[0].id] : []);
        setValidadoresIds(vList.map((v) => v.id));
        setData(todayStr);
        setHorario('08:00');
        setPrazo(defaultDeadline.toISOString().slice(0, 16));
        setRecorrencia('UMA_VEZ');
        setDiasSemana([1, 2, 3, 4, 5]);
        setAnexoPdfNome('');
        setAnexoPdfUrl('');
        setAnexoPdfTamanho('');
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
  }, [isOpen, taskToEdit, currentUser]);

  // Calculate automatically identified leaders based on selected projects and user profile
  const autoIdentifiedLeaders = useMemo(() => {
    let matched = leaders;
    if (projetosIds.length > 0) {
      matched = leaders.filter((l) => {
        const leaderProjIds = l.projetos_ids && l.projetos_ids.length > 0
          ? l.projetos_ids
          : [l.unidade_id || (l as any).projeto_id].filter(Boolean);
        return leaderProjIds.some((id) => projetosIds.includes(id as string));
      });
    }

    // GERÊNCIA restriction: can ONLY manage/create OS for leaders managed by this GERENCIA user (Gestor Imediato)
    if (currentUser?.role === 'GERENCIA') {
      matched = matched.filter((l) => {
        if (l.gestores_imediatos_ids && l.gestores_imediatos_ids.length > 0) {
          return l.gestores_imediatos_ids.includes(currentUser.id);
        }
        return false;
      });
    }

    return matched;
  }, [leaders, projetosIds, currentUser]);

  const handleToggleProject = (projId: string) => {
    setProjetosIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const handleToggleValidator = (valUserId: string) => {
    setValidadoresIds((prev) =>
      prev.includes(valUserId) ? prev.filter((id) => id !== valUserId) : [...prev, valUserId]
    );
  };

  if (!isOpen) return null;

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
  const handleAddNewChecklistItem = (reqId: string) => {
    const text = (newChecklistItemTexts[reqId] || '').trim();
    if (!text) return;
    setRequisitos(
      requisitos.map((r) => {
        if (r.id === reqId) {
          const items = r.checklist_itens || [];
          return {
            ...r,
            checklist_itens: [
              ...items,
              { id: 'item-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4), texto: text, concluido: false },
            ],
          };
        }
        return r;
      })
    );
    setNewChecklistItemTexts((prev) => ({ ...prev, [reqId]: '' }));
  };

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

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Apenas arquivos no formato PDF são aceitos como documento de apoio.');
      return;
    }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();
    reader.onload = () => {
      setAnexoPdfNome(file.name);
      setAnexoPdfTamanho(`${sizeMB} MB`);
      setAnexoPdfUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMessage('O título da Ordem de Serviço é obrigatório.');
      return;
    }

    if (projetosIds.length === 0) {
      setErrorMessage('Selecione pelo menos um projeto para vincular a esta OS.');
      return;
    }

    if (currentUser?.role === 'GERENCIA' && autoIdentifiedLeaders.length === 0) {
      setErrorMessage('A criação de OS para o perfil GERÊNCIA é restrita aos Líderes sob sua gestão direta (Gestor Imediato). Nenhum líder sob sua gestão está vinculado a estes projetos.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoriaId);

    if (requisitos.length === 0) {
      setErrorMessage('Adicione pelo menos um requisito de conclusão / evidência para a OS.');
      return;
    }

    const selectedProjObjs = units.filter((u) => projetosIds.includes(u.id));
    const selectedProjNames = selectedProjObjs.map((p) => p.nome);
    const primaryProj = selectedProjObjs[0];

    const leaderIds = autoIdentifiedLeaders.map((l) => l.usuario_id || l.id);
    const leaderNames = autoIdentifiedLeaders.map((l) => l.nome);
    const primaryLeader = autoIdentifiedLeaders[0];

    const selectedValObjs = validatorUsers.filter((v) => validadoresIds.includes(v.id));
    const valNames = selectedValObjs.map((v) => v.nome);

    try {
      if (taskToEdit) {
        const payload = {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          tipo_operacao: tipoOperacao,
          prioridade,
          categoria_id: categoriaId,
          categoria_nome: selectedCategory?.nome || 'Operacional',
          categoria_cor: selectedCategory?.cor || '#C76B4A',
          unidade_id: primaryProj?.id,
          unidade: primaryProj?.nome || 'Projeto Principal',
          projeto_id: primaryProj?.id,
          projeto: primaryProj?.nome || 'Projeto Principal',
          projetos_ids: projetosIds,
          projetos_nomes: selectedProjNames,
          responsavel_id: primaryLeader?.usuario_id || primaryLeader?.id || 'usr-lider',
          responsavel_nome: primaryLeader?.nome || 'Líder Operacional',
          responsavel_cargo: primaryLeader?.cargo || 'Líder Operacional',
          lideres_ids: leaderIds,
          lideres_nomes: leaderNames,
          validadores_ids: validadoresIds,
          validadores_nomes: valNames,
          data,
          horario,
          prazo: taskToEdit.prazo, // OM-03: Imutável após a criação
          status: taskToEdit.status,
          recorrencia,
          recorrencia_config: recorrencia === 'PERSONALIZADA' ? { dias_semana: diasSemana, horario_custom: horario } : undefined,
          requisitos_conclusao: requisitos,
          anexo_pdf_nome: anexoPdfNome || undefined,
          anexo_pdf_url: anexoPdfUrl || undefined,
          anexo_pdf_tamanho: anexoPdfTamanho || undefined,
        };

        const savedTask = dbStore.updateTask(taskToEdit.id, payload);
        if (onSaved) onSaved(savedTask);
      } else {
        const payload = {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          tipo_operacao: tipoOperacao,
          prioridade,
          categoria_id: categoriaId,
          categoria_nome: selectedCategory?.nome || 'Operacional',
          categoria_cor: selectedCategory?.cor || '#C76B4A',
          unidade_id: primaryProj?.id,
          unidade: primaryProj?.nome || 'Projeto Principal',
          projeto_id: primaryProj?.id,
          projeto: primaryProj?.nome || 'Projeto Principal',
          projetos_ids: projetosIds,
          projetos_nomes: selectedProjNames,
          responsavel_id: primaryLeader?.usuario_id || primaryLeader?.id || 'usr-lider',
          responsavel_nome: primaryLeader?.nome || 'Líder Operacional',
          responsavel_cargo: primaryLeader?.cargo || 'Líder Operacional',
          lideres_ids: leaderIds,
          lideres_nomes: leaderNames,
          validadores_ids: validadoresIds,
          validadores_nomes: valNames,
          data,
          horario,
          prazo: prazo || undefined,
          status: 'PROGRAMADA' as const,
          recorrencia,
          recorrencia_config: recorrencia === 'PERSONALIZADA' ? { dias_semana: diasSemana, horario_custom: horario } : undefined,
          requisitos_conclusao: requisitos,
          anexo_pdf_nome: anexoPdfNome || undefined,
          anexo_pdf_url: anexoPdfUrl || undefined,
          anexo_pdf_tamanho: anexoPdfTamanho || undefined,
        };

        if (autoIdentifiedLeaders.length > 1) {
          let firstSaved: TarefaOS | null = null;
          autoIdentifiedLeaders.forEach((leader) => {
            const leaderProjIds = leader.projetos_ids && leader.projetos_ids.length > 0
              ? leader.projetos_ids
              : [leader.unidade_id || (leader as any).projeto_id].filter(Boolean);
            const matchedProj = units.find((u) => leaderProjIds.includes(u.id)) || primaryProj;

            const leaderPayload = {
              ...payload,
              unidade_id: matchedProj?.id,
              unidade: matchedProj?.nome || 'Projeto Principal',
              projeto_id: matchedProj?.id,
              projeto: matchedProj?.nome || 'Projeto Principal',
              projetos_ids: [matchedProj?.id || primaryProj.id],
              projetos_nomes: [matchedProj?.nome || primaryProj.nome],
              responsavel_id: leader.usuario_id || leader.id,
              responsavel_nome: leader.nome,
              responsavel_cargo: leader.cargo || 'Líder Operacional',
              lideres_ids: [leader.usuario_id || leader.id],
              lideres_nomes: [leader.nome],
            };

            const saved = dbStore.createTask(leaderPayload);
            if (!firstSaved) firstSaved = saved;
          });
          if (onSaved && firstSaved) onSaved(firstSaved);
        } else {
          const savedTask = dbStore.createTask(payload);
          if (onSaved) onSaved(savedTask);
        }
      }

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
                  Tipo da Operação
                </label>
                <select
                  value={tipoOperacao}
                  onChange={(e) => setTipoOperacao(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                >
                  <option value="Rotina Operacional">Rotina Operacional</option>
                  <option value="Preventiva">Preventiva</option>
                  <option value="Corretiva">Corretiva</option>
                  <option value="Inspeção">Inspeção</option>
                  <option value="Auditoria">Auditoria</option>
                  <option value="Treinamento">Treinamento</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Prioridade
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
                  className="w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Project & Auto Leader Identification */}
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Projeto(s) Vinculado(s) <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-gray-50">
                    {units.length === 0 ? (
                      <span className="text-xs text-stone-400">Nenhum projeto cadastrado</span>
                    ) : (
                      units.map((u) => {
                        const isChecked = projetosIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer transition ${
                              isChecked ? 'bg-[#C76B4A]/10 text-[#C76B4A] font-bold' : 'hover:bg-gray-100 text-stone-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProject(u.id)}
                              className="rounded border-gray-300 text-[#C76B4A] focus:ring-0"
                            />
                            <span>{u.nome}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Líder(es) Responsável(is) Identificado(s)
                  </label>
                  <div className="border border-gray-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1 bg-emerald-50/50">
                    <p className="text-[10px] text-emerald-800 font-medium mb-1">
                      Atribuído(s) automaticamente com base no(s) projeto(s):
                    </p>
                    {autoIdentifiedLeaders.length === 0 ? (
                      <span className="text-xs text-amber-700 font-semibold block">Nenhum líder associado encontrado</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {autoIdentifiedLeaders.map((l) => (
                          <span key={l.id} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-200">
                            {l.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C76B4A]" />
                    Validadores da OS (ADMINISTRADOR / GERÊNCIA)
                  </label>
                  <div className="border border-gray-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-gray-50">
                    {validatorUsers.length === 0 ? (
                      <span className="text-xs text-stone-400">Nenhum validador cadastrado</span>
                    ) : (
                      validatorUsers.map((v) => {
                        const isChecked = validadoresIds.includes(v.id);
                        return (
                          <label
                            key={v.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer transition ${
                              isChecked ? 'bg-[#C76B4A]/10 text-[#C76B4A] font-bold' : 'hover:bg-gray-100 text-stone-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleValidator(v.id)}
                              className="rounded border-gray-300 text-[#C76B4A] focus:ring-0"
                            />
                            <span>{v.nome} ({v.role})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
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
                    min={new Date().toISOString().split('T')[0]}
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
                  {taskToEdit && (
                    <span className="ml-1 text-[10px] text-amber-700 font-bold">
                      (🔒 Imutável após criação)
                    </span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  disabled={!!taskToEdit}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                    taskToEdit
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-800 border-gray-200 focus:border-[#C76B4A]'
                  }`}
                />
                {taskToEdit && (
                  <p className="text-[10px] text-stone-500 mt-1">
                    O prazo de uma OS não pode ser alterado após sua criação para manter a integridade do histórico operacional.
                  </p>
                )}
              </div>

              {/* Quick SLA buttons (only on task creation) */}
              {!taskToEdit && (
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
              )}

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

          {/* Section 3: Documento de Apoio / PDF Opcional (Material de Referência) */}
          <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C76B4A]" />
                <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                  3. Documento de Apoio / PDF Opcional (Material de Referência)
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Opcional
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Permite anexar um documento em PDF (como POP, manual técnico ou instrução de trabalho) para o Líder consultar durante a execução da OS.
            </p>

            {/* Warning requirement note as strictly specified in OM-05 */}
            <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold block text-amber-900">Aviso sobre Evidências Obrigatórias:</span>
                Este documento PDF anexado é exclusivamente para apoio e consulta do Líder. Ele <strong>NÃO substitui nem dispensa</strong> a comprovação obrigatória das evidências configuradas no Tipo de Conclusão / Critérios da OS (ex: fotos, checklists, medições ou formulários).
              </div>
            </div>

            {anexoPdfNome ? (
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-emerald-300 shadow-2xs">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-stone-800 truncate">{anexoPdfNome}</div>
                    <div className="text-[10px] text-stone-500">{anexoPdfTamanho || 'Documento PDF'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAnexoPdfNome('');
                    setAnexoPdfUrl('');
                    setAnexoPdfTamanho('');
                  }}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover PDF
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-dashed border-stone-300 hover:border-[#C76B4A] rounded-xl text-xs font-semibold text-stone-700 cursor-pointer transition shadow-2xs">
                  <FileUp className="w-4 h-4 text-[#C76B4A]" />
                  <span>Selecionar arquivo PDF do computador...</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAnexoPdfNome('Procedimento_Operacional_Padrao_POP_04.pdf');
                    setAnexoPdfTamanho('1.4 MB');
                    setAnexoPdfUrl('data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...');
                  }}
                  className="px-3.5 py-3 text-xs text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl font-semibold transition"
                >
                  Usar PDF Modelo (POP)
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Dynamic Evidence / Completion Requirements Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B6B4A]" />
                <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                  4. Critérios & Requisitos de Conclusão (Evidências Obrigatórias)
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddChecklistItem(req.id);
                                }
                              }}
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

                        {/* Dedicated input to add new checklist item with Enter without submitting the form */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Digitar item do checklist e pressionar Enter..."
                            value={newChecklistItemTexts[req.id] || ''}
                            onChange={(e) =>
                              setNewChecklistItemTexts((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddNewChecklistItem(req.id);
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-xs bg-white rounded-md border border-dashed border-[#C76B4A]/50 focus:border-[#C76B4A] focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddNewChecklistItem(req.id)}
                            className="px-2.5 py-1 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-[11px] font-bold rounded-md flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                          >
                            <Plus className="w-3 h-3" /> Adicionar
                          </button>
                        </div>
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
