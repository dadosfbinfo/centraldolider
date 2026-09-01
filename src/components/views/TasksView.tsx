import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TarefaOS, TaskStatus, TaskPriority, Unidade, Categoria, Lider } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { TaskFormModal } from './TaskFormModal';
import { TaskExecutionModal } from './TaskExecutionModal';
import { TaskBlockModal } from './TaskBlockModal';
import { TaskPrintModal } from './TaskPrintModal';
import { UnitsManagementModal } from './UnitsManagementModal';
import { CategoriesManagementModal } from './CategoriesManagementModal';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Plus,
  Building2,
  User,
  MoreVertical,
  Play,
  Printer,
  Copy,
  Edit2,
  Trash2,
  ShieldAlert,
  Unlock,
  Camera,
  FileText,
  Tag,
  ArrowUpDown,
  Sparkles,
  Ban,
  FileDown,
  FileCheck2
} from 'lucide-react';

interface TasksViewProps {
  initialTab?: 'hoje' | 'proximas' | 'atrasadas' | 'concluidas' | 'todas';
}

export const TasksView: React.FC<TasksViewProps> = ({ initialTab = 'hoje' }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  // Sub-tabs for Leader / Admin
  const [activeSubTab, setActiveSubTab] = useState<'hoje' | 'proximas' | 'atrasadas' | 'concluidas' | 'todas'>(
    isAdmin ? 'todas' : initialTab
  );

  const [tasks, setTasks] = useState<TarefaOS[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [leaders, setLeaders] = useState<Lider[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TarefaOS | null>(null);

  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [taskToExecute, setTaskToExecute] = useState<TarefaOS | null>(null);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState<TarefaOS | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [taskToPrint, setTaskToPrint] = useState<TarefaOS | null>(null);

  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // Quick Action Menu Popover per task
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);

  // Load and subscribe to dbStore
  const loadData = () => {
    if (!currentUser) return;
    const allTasks = dbStore.getTasksForUser(currentUser.id, currentUser.role);
    setTasks(allTasks);
    setUnits(dbStore.getUnits());
    setCategories(dbStore.getCategories());
    setLeaders(dbStore.getLeaders());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, [currentUser]);

  // Date helpers
  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering based on SubTab
  const getSubTabTasks = () => {
    return tasks.filter((t) => {
      if (activeSubTab === 'hoje') {
        return t.data === todayStr && t.status !== 'CONCLUIDA';
      }
      if (activeSubTab === 'proximas') {
        return t.data > todayStr && t.status !== 'CONCLUIDA';
      }
      if (activeSubTab === 'atrasadas') {
        return t.status === 'ATRASADA';
      }
      if (activeSubTab === 'concluidas') {
        return t.status === 'CONCLUIDA';
      }
      return true;
    });
  };

  // Apply search and dropdown filters
  const filteredTasks = getSubTabTasks().filter((t) => {
    const matchesSearch =
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.numero_os.toLowerCase().includes(search.toLowerCase()) ||
      (t.descricao && t.descricao.toLowerCase().includes(search.toLowerCase())) ||
      (t.responsavel_nome && t.responsavel_nome.toLowerCase().includes(search.toLowerCase())) ||
      (t.unidade && t.unidade.toLowerCase().includes(search.toLowerCase()));

    const matchesUnit = !filterUnit || t.unidade_id === filterUnit || t.unidade.includes(filterUnit);
    const matchesCategory = !filterCategory || t.categoria_id === filterCategory;
    const matchesPriority = !filterPriority || t.prioridade === filterPriority;
    const matchesStatus = !filterStatus || t.status === filterStatus;

    return matchesSearch && matchesUnit && matchesCategory && matchesPriority && matchesStatus;
  });

  // KPI Counters
  const countHoje = tasks.filter((t) => t.data === todayStr && t.status !== 'CONCLUIDA').length;
  const countProximas = tasks.filter((t) => t.data > todayStr && t.status !== 'CONCLUIDA').length;
  const countAtrasadas = tasks.filter((t) => t.status === 'ATRASADA').length;
  const countConcluidas = tasks.filter((t) => t.status === 'CONCLUIDA').length;
  const countBloqueadas = tasks.filter((t) => t.status === 'BLOQUEADA').length;

  // Actions
  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (task: TarefaOS) => {
    setTaskToEdit(task);
    setIsFormModalOpen(true);
    setOpenMenuTaskId(null);
  };

  const handleOpenExecute = (task: TarefaOS) => {
    setTaskToExecute(task);
    setIsExecModalOpen(true);
  };

  const handleOpenBlock = (task: TarefaOS) => {
    setTaskToBlock(task);
    setIsBlockModalOpen(true);
    setOpenMenuTaskId(null);
  };

  const handleUnblock = (taskId: string) => {
    dbStore.unblockTask(taskId);
    setOpenMenuTaskId(null);
  };

  const handleDuplicate = (taskId: string) => {
    dbStore.duplicateTask(taskId);
    setOpenMenuTaskId(null);
  };

  const handleDelete = (taskId: string, osNumber: string) => {
    if (window.confirm(`Deseja realmente excluir permanentemente a ${osNumber}?`)) {
      dbStore.deleteTask(taskId);
      setOpenMenuTaskId(null);
    }
  };

  const handleCancel = (taskId: string) => {
    if (window.confirm('Deseja cancelar esta Ordem de Serviço?')) {
      dbStore.cancelTask(taskId);
      setOpenMenuTaskId(null);
    }
  };

  const handleOpenPrint = (task: TarefaOS) => {
    setTaskToPrint(task);
    setIsPrintModalOpen(true);
    setOpenMenuTaskId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#C76B4A]/10 text-[#C76B4A]">
              <CheckSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#343A40] tracking-tight">
              {isAdmin ? 'Central de Tarefas & Ordens de Serviço (OS)' : 'Minhas Tarefas & Ordens de Serviço'}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Controle e acompanhamento de todas as rotinas, SLAs e evidências das unidades'
              : 'Gerencie e execute suas ordens de serviço diárias com registro de evidências'}
          </p>
        </div>

        {/* Top Admin Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsUnitsModalOpen(true)}
                className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-[#C76B4A]" />
                Unidades ({units.length})
              </button>

              <button
                onClick={() => setIsCategoriesModalOpen(true)}
                className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-[#355C7D]" />
                Categorias ({categories.length})
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Ordem de Serviço
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Nav Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F4EFEA] p-1 rounded-xl">
          {[
            { id: 'hoje', label: 'Hoje', count: countHoje, icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'proximas', label: 'Próximas', count: countProximas, icon: <Calendar className="w-3.5 h-3.5" /> },
            {
              id: 'atrasadas',
              label: 'Atrasadas',
              count: countAtrasadas,
              icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
              alert: countAtrasadas > 0
            },
            { id: 'concluidas', label: 'Concluídas', count: countConcluidas, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
            { id: 'todas', label: 'Todas as OS', count: tasks.length, icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === tab.id
                  ? 'bg-white text-[#C76B4A] shadow-xs'
                  : 'text-gray-600 hover:text-[#343A40] hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  tab.alert
                    ? 'bg-red-500 text-white font-black animate-pulse'
                    : activeSubTab === tab.id
                    ? 'bg-[#C76B4A]/10 text-[#C76B4A]'
                    : 'bg-gray-200/80 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {countBloqueadas > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>{countBloqueadas} OS Bloqueada(s) por impedimento</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por OS #, título, descrição ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
            />
          </div>

          {/* Unit Filter */}
          <div>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
            >
              <option value="">Todas as Unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
            >
              <option value="">Todas as Prioridades</option>
              <option value="BAIXA">🟢 Baixa</option>
              <option value="MEDIA">🟡 Média</option>
              <option value="ALTA">🟠 Alta</option>
              <option value="CRITICA">🔴 Crítica</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Shortcut */}
        {(search || filterUnit || filterCategory || filterPriority || filterStatus) && (
          <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500">
            <span>Filtros ativos aplicados</span>
            <button
              onClick={() => {
                setSearch('');
                setFilterUnit('');
                setFilterCategory('');
                setFilterPriority('');
                setFilterStatus('');
              }}
              className="text-[#C76B4A] hover:underline font-bold"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Task Cards Grid / List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF0E6] text-[#C76B4A] mx-auto flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#343A40]">Nenhuma Ordem de Serviço encontrada</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Não há tarefas correspondentes aos filtros selecionados nesta aba ({activeSubTab}).
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" /> Criar Primeira OS
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'CONCLUIDA';
            const isBlocked = task.status === 'BLOQUEADA';
            const isOverdue = task.status === 'ATRASADA';
            const isToday = task.data === todayStr;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white shadow-2xs relative ${
                  isOverdue
                    ? 'border-red-300 ring-1 ring-red-200'
                    : isBlocked
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : isCompleted
                    ? 'border-gray-200 opacity-90'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Badges Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#F4EFEA] text-[#8B6B4A] border border-[#E8DFD8]">
                        {task.numero_os}
                      </span>

                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-md text-white shadow-2xs"
                        style={{ backgroundColor: task.categoria_cor || '#C76B4A' }}
                      >
                        {task.categoria_nome}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          task.prioridade === 'CRITICA'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : task.prioridade === 'ALTA'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.prioridade}
                      </span>

                      {task.recorrencia && task.recorrencia !== 'UMA_VEZ' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          🔄 {task.recorrencia}
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-red-500 text-white animate-pulse'
                            : isBlocked
                            ? 'bg-amber-500 text-white'
                            : task.status === 'EM_ANDAMENTO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#343A40] leading-snug">
                        {task.titulo}
                      </h3>
                      {task.descricao && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {task.descricao}
                        </p>
                      )}
                    </div>

                    {/* Meta info: Unit, Assignee, Scheduled & Deadline */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                      <div className="flex items-center gap-1 font-medium text-gray-700">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate max-w-xs">{task.unidade}</span>
                      </div>

                      <div className="flex items-center gap-1 font-medium text-gray-700">
                        <User className="w-3.5 h-3.5 text-[#8B6B4A] shrink-0" />
                        <span>{task.responsavel_nome}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className={isToday ? 'font-bold text-[#C76B4A]' : ''}>
                          {isToday ? 'Hoje' : task.data} {task.horario ? `(${task.horario})` : ''}
                        </span>
                      </div>

                      {task.prazo && (
                        <div className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Prazo: {task.prazo.replace('T', ' ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Requirement Badges Summary */}
                    {task.requisitos_conclusao && task.requisitos_conclusao.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-gray-400 font-medium">Requisitos:</span>
                        {task.requisitos_conclusao.map((req) => (
                          <span
                            key={req.id}
                            className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EBE3DC] text-[10px] font-semibold text-[#8B6B4A]"
                          >
                            {req.tipo === 'CHECKLIST' && `📋 Checklist (${req.checklist_itens?.length || 0})`}
                            {req.tipo === 'NUMERO' && `🔢 Medição (${req.unidade_medida || 'num'})`}
                            {req.tipo === 'FOTO' && '📸 Foto'}
                            {req.tipo === 'ARQUIVO' && '📎 Documento'}
                            {req.tipo === 'TEXTO' && '📝 Parecer'}
                            {req.tipo === 'OPCAO' && '🔘 Opção'}
                            {req.tipo === 'FORMULARIO' && '📑 Questionário'}
                            {req.tipo === 'SIMPLES' && '✅ Marcação'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Block Reason alert if blocked */}
                    {isBlocked && task.motivo_bloqueio && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Motivo do Bloqueio:</strong> {task.motivo_bloqueio}
                        </div>
                      </div>
                    )}

                    {/* Completion Info if completed */}
                    {isCompleted && (
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Concluída em {task.data_conclusao ? new Date(task.data_conclusao).toLocaleString('pt-BR') : 'Hoje'} • Duração: <strong>{task.tempo_execucao_minutos || 30} min</strong>
                          </span>
                        </div>
                        {task.evidencias && (
                          <span className="text-[11px] font-bold text-emerald-800">
                            {task.evidencias.length} evidência(s) arquivada(s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 shrink-0">
                    {/* Primary Button */}
                    {!isCompleted ? (
                      <button
                        onClick={() => handleOpenExecute(task)}
                        className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all w-full sm:w-auto justify-center"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Executar / Concluir OS
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenExecute(task)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                      >
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        Ver Evidências
                      </button>
                    )}

                    {/* Secondary Actions Bar */}
                    <div className="flex items-center gap-1">
                      {/* PDF Print Button */}
                      <button
                        onClick={() => handleOpenPrint(task)}
                        title="Imprimir / Exportar PDF da OS"
                        className="p-2 text-gray-500 hover:text-[#C76B4A] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Block / Unblock Toggle */}
                      {isBlocked ? (
                        <button
                          onClick={() => handleUnblock(task.id)}
                          title="Desbloquear OS"
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      ) : (
                        !isCompleted && (
                          <button
                            onClick={() => handleOpenBlock(task)}
                            title="Reportar Bloqueio"
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )
                      )}

                      {/* Admin Extra Actions */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleDuplicate(task.id)}
                            title="Duplicar OS"
                            className="p-2 text-gray-500 hover:text-[#355C7D] hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(task)}
                            title="Editar OS"
                            className="p-2 text-gray-500 hover:text-[#C76B4A] hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(task.id, task.numero_os)}
                            title="Excluir OS"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Modals */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      <TaskExecutionModal
        isOpen={isExecModalOpen}
        onClose={() => setIsExecModalOpen(false)}
        task={taskToExecute}
        onOpenBlockModal={(t) => {
          setIsExecModalOpen(false);
          handleOpenBlock(t);
        }}
      />

      <TaskBlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        task={taskToBlock}
      />

      <TaskPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        task={taskToPrint}
      />

      <UnitsManagementModal
        isOpen={isUnitsModalOpen}
        onClose={() => setIsUnitsModalOpen(false)}
      />

      <CategoriesManagementModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </div>
  );
};
