import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TarefaOS, TaskStatus, TaskPriority, Unidade, Categoria, Lider } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { TaskFormModal } from './TaskFormModal';
import { TaskExecutionModal } from './TaskExecutionModal';
import { TaskBlockModal } from './TaskBlockModal';
import { TaskPrintModal } from './TaskPrintModal';
import { TaskImportModal } from './TaskImportModal';
import { CategoriesManagementModal } from './CategoriesManagementModal';
import { PeriodFilter, PeriodSelection } from '../common/PeriodFilter';
import { Pagination } from '../common/Pagination';
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
  FolderKanban,
  User,
  MoreVertical,
  Play,
  Printer,
  Copy,
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
  FileSpreadsheet,
  FileCheck2
} from 'lucide-react';

interface TasksViewProps {
  initialTab?: 'hoje' | 'em_andamento' | 'atrasadas' | 'em_validacao' | 'concluidas' | 'canceladas' | 'todas';
}

export const TasksView: React.FC<TasksViewProps> = ({ initialTab = 'hoje' }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';
  const canCreateOS = currentUser?.role === 'ADMINISTRADOR' || currentUser?.role === 'GERENCIA';

  // Sub-tabs for Leader / Admin (including Em Validação, Em Andamento and Canceladas)
  const [activeSubTab, setActiveSubTab] = useState<'hoje' | 'em_andamento' | 'atrasadas' | 'em_validacao' | 'concluidas' | 'canceladas' | 'todas'>(
    initialTab || (isAdmin ? 'todas' : 'hoje')
  );

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const [tasks, setTasks] = useState<TarefaOS[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [leaders, setLeaders] = useState<Lider[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTipoOperacao, setFilterTipoOperacao] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [period, setPeriod] = useState<PeriodSelection>({
    mode: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [taskToExecute, setTaskToExecute] = useState<TarefaOS | null>(null);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState<TarefaOS | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [taskToPrint, setTaskToPrint] = useState<TarefaOS | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // Cancellation Modal
  const [taskToCancel, setTaskToCancel] = useState<TarefaOS | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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

  // Filtering based on SubTab and Period
  const getSubTabTasks = () => {
    return tasks.filter((t) => {
      // Subtab check
      if (activeSubTab === 'hoje' && (t.data !== todayStr || t.status === 'CONCLUIDA' || t.status === 'CANCELADA' || t.status === 'AGUARDANDO_VALIDACAO')) {
        return false;
      }
      if (activeSubTab === 'em_andamento' && t.status !== 'EM_ANDAMENTO') {
        return false;
      }
      if (activeSubTab === 'atrasadas' && (t.status !== 'ATRASADA' || t.status === 'CANCELADA' || t.status === 'AGUARDANDO_VALIDACAO')) {
        return false;
      }
      if (activeSubTab === 'em_validacao' && t.status !== 'AGUARDANDO_VALIDACAO') {
        return false;
      }
      if (activeSubTab === 'concluidas' && t.status !== 'CONCLUIDA') {
        return false;
      }
      if (activeSubTab === 'canceladas' && t.status !== 'CANCELADA') {
        return false;
      }

      // Period filter check
      if (activeSubTab === 'todas' || activeSubTab === 'concluidas' || activeSubTab === 'canceladas' || activeSubTab === 'em_validacao') {
        if (period.mode === 'year' && t.data) {
          const taskYear = parseInt(t.data.substring(0, 4), 10);
          if (taskYear !== period.year) return false;
        } else if (period.mode === 'month' && t.data) {
          const taskYear = parseInt(t.data.substring(0, 4), 10);
          const taskMonth = parseInt(t.data.substring(5, 7), 10);
          if (taskYear !== period.year || taskMonth !== period.month) return false;
        } else if (period.mode === 'custom' && t.data) {
          if (period.startDate && t.data < period.startDate) return false;
          if (period.endDate && t.data > period.endDate) return false;
        }
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

    const matchesUnit =
      !filterUnit ||
      t.unidade_id === filterUnit ||
      t.projeto_id === filterUnit ||
      (t.projetos_ids && t.projetos_ids.includes(filterUnit)) ||
      (t.unidade && t.unidade.toLowerCase().includes(filterUnit.toLowerCase()));
    const matchesCategory = !filterCategory || t.categoria_id === filterCategory;
    const matchesPriority = !filterPriority || t.prioridade === filterPriority;
    const matchesTipoOperacao = !filterTipoOperacao || (t.tipo_operacao || 'Rotina Operacional') === filterTipoOperacao;
    const matchesStatus = !filterStatus || t.status === filterStatus;

    return matchesSearch && matchesUnit && matchesCategory && matchesPriority && matchesTipoOperacao && matchesStatus;
  });

  // Reset page when filters or sub-tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab, search, filterUnit, filterCategory, filterPriority, filterTipoOperacao, filterStatus, period]);

  const paginatedTasks = filteredTasks.slice((currentPage - 1) * 10, currentPage * 10);

  // KPI Counters
  const countHoje = tasks.filter((t) => t.data === todayStr && t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA' && t.status !== 'AGUARDANDO_VALIDACAO').length;
  const countEmAndamento = tasks.filter((t) => t.status === 'EM_ANDAMENTO').length;
  const countAtrasadas = tasks.filter((t) => t.status === 'ATRASADA' && t.status !== 'CANCELADA' && t.status !== 'AGUARDANDO_VALIDACAO').length;
  const countEmValidacao = tasks.filter((t) => t.status === 'AGUARDANDO_VALIDACAO').length;
  const countConcluidas = tasks.filter((t) => t.status === 'CONCLUIDA').length;
  const countCanceladas = tasks.filter((t) => t.status === 'CANCELADA').length;
  const countBloqueadas = tasks.filter((t) => t.status === 'BLOQUEADA').length;

  // Actions
  const handleOpenCreate = () => {
    setIsFormModalOpen(true);
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

  const handleDelete = (task: TarefaOS) => {
    if (
      task.status === 'CONCLUIDA' ||
      task.status === 'AGUARDANDO_VALIDACAO' ||
      task.status === 'EM_ANDAMENTO'
    ) {
      alert(
        `Não é possível excluir esta Ordem de Serviço pois seu status atual é "${
          task.status === 'CONCLUIDA'
            ? 'Concluída'
            : task.status === 'AGUARDANDO_VALIDACAO'
            ? 'Em validação'
            : 'Em andamento'
        }". A exclusão é permitida apenas para tarefas que não estejam em andamento, em validação ou concluídas.`
      );
      return;
    }

    const comments = dbStore.getComments('TAREFA', task.id);
    if (comments.length > 0) {
      alert('Não é possível excluir esta Ordem de Serviço pois ela possui comentários e registros de comunicação arquivados.');
      return;
    }

    if (window.confirm(`Deseja realmente excluir permanentemente a ${task.numero_os}? Esta ação não poderá ser desfeita.`)) {
      try {
        dbStore.deleteTask(task.id);
        setOpenMenuTaskId(null);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir a Ordem de Serviço.');
      }
    }
  };

  const handleCancel = (taskId: string) => {
    if (currentUser?.role === 'LIDER') {
      alert('O perfil de Líder não possui permissão para cancelar Ordens de Serviço.');
      return;
    }
    if (window.confirm('Deseja cancelar esta Ordem de Serviço?')) {
      dbStore.cancelTask(taskId, undefined, currentUser?.role);
      setOpenMenuTaskId(null);
      loadData();
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

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Importar Tarefas (.xlsx)
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

          {canCreateOS && (
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

      {/* Period Filter for All/Completed/Cancelled SubTabs */}
      {(activeSubTab === 'todas' || activeSubTab === 'concluidas' || activeSubTab === 'canceladas') && (
        <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#343A40]">
            <Calendar className="w-4 h-4 text-[#C76B4A]" />
            <span>Filtro de Período da Consulta:</span>
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      )}

      {/* Sub-Tabs Nav Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F4EFEA] p-1 rounded-xl">
          {[
            { id: 'hoje', label: 'Hoje', count: countHoje, icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'em_andamento', label: 'Em andamento', count: countEmAndamento, icon: <Play className="w-3.5 h-3.5 text-blue-600" /> },
            {
              id: 'atrasadas',
              label: 'Atrasadas',
              count: countAtrasadas,
              icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
              alert: countAtrasadas > 0
            },
            { id: 'em_validacao', label: 'Em Validação', count: countEmValidacao, icon: <Clock className="w-3.5 h-3.5 text-purple-600" /> },
            { id: 'concluidas', label: 'Concluídas', count: countConcluidas, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
            { id: 'canceladas', label: 'Canceladas', count: countCanceladas, icon: <Ban className="w-3.5 h-3.5 text-stone-500" /> },
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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

          {/* Project Filter */}
          <div>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
            >
              <option value="">Todos os Projetos</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Operation Type Filter */}
          <div>
            <select
              value={filterTipoOperacao}
              onChange={(e) => setFilterTipoOperacao(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
            >
              <option value="">Todos os Tipos de Operação</option>
              <option value="Rotina Operacional">Rotina Operacional</option>
              <option value="Preventiva">Preventiva</option>
              <option value="Corretiva">Corretiva</option>
              <option value="Inspeção">Inspeção</option>
              <option value="Auditoria">Auditoria</option>
              <option value="Treinamento">Treinamento</option>
              <option value="Outros">Outros</option>
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
        {(search || filterUnit || filterCategory || filterPriority || filterTipoOperacao || filterStatus) && (
          <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500">
            <span>Filtros ativos aplicados</span>
            <button
              onClick={() => {
                setSearch('');
                setFilterUnit('');
                setFilterCategory('');
                setFilterPriority('');
                setFilterTipoOperacao('');
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
          paginatedTasks.map((task) => {
            const isCompleted = task.status === 'CONCLUIDA';
            const isBlocked = task.status === 'BLOQUEADA';
            const isOverdue = task.status === 'ATRASADA';
            const isCancelled = task.status === 'CANCELADA';
            const isToday = task.data === todayStr;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white shadow-2xs relative ${
                  isOverdue
                    ? 'border-red-300 ring-1 ring-red-200'
                    : isBlocked
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : isCancelled
                    ? 'border-stone-200 bg-stone-50/50 opacity-80'
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

                      {task.tipo_operacao && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EBE3DC] text-[#8B6B4A]">
                          ⚙️ {task.tipo_operacao}
                        </span>
                      )}

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
                            : isCancelled
                            ? 'bg-stone-100 text-stone-700 border border-stone-300'
                            : task.status === 'AGUARDANDO_VALIDACAO'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : isOverdue
                            ? 'bg-red-500 text-white animate-pulse'
                            : isBlocked
                            ? 'bg-amber-500 text-white'
                            : task.status === 'EM_ANDAMENTO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status === 'AGUARDANDO_VALIDACAO'
                          ? `AGUARDANDO VALIDAÇÃO${
                              task.validadores_ids && task.validadores_ids.length > 1
                                ? ` (${task.validacoes_aprovadas?.length || 0}/${task.validadores_ids.length})`
                                : ''
                            }`
                          : task.status}
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

                    {/* Cancellation Info if cancelled */}
                    {isCancelled && (
                      <div className="p-2 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-stone-500 shrink-0" />
                          <span>
                            Ordem de Serviço Cancelada {task.motivo_bloqueio ? `• Motivo: ${task.motivo_bloqueio}` : ''}
                          </span>
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
                    {isCompleted ? (
                      <button
                        onClick={() => handleOpenExecute(task)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                      >
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        Ver Evidências
                      </button>
                    ) : isCancelled ? (
                      <button
                        onClick={() => handleOpenExecute(task)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                      >
                        <Ban className="w-4 h-4 text-stone-500" />
                        Ver Detalhes
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenExecute(task)}
                        className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all w-full sm:w-auto justify-center"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Executar / Concluir OS
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

                      {/* Cancel OS Button (OM-03) - Only for ADMIN or GERENCIA (Never for LIDER, CONCLUIDA or CANCELADA) */}
                      {currentUser?.role !== 'LIDER' && !isCompleted && !isCancelled && (
                        <button
                          onClick={() => {
                            setTaskToCancel(task);
                            setCancelReason('');
                          }}
                          title="Cancelar Ordem de Serviço"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

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
                        !isCompleted && !isCancelled && (
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
                            onClick={() => handleDelete(task)}
                            title={
                              task.status === 'CONCLUIDA' || task.status === 'AGUARDANDO_VALIDACAO' || task.status === 'EM_ANDAMENTO'
                                ? 'Exclusão bloqueada para tarefas em andamento, em validação ou concluídas'
                                : 'Excluir OS'
                            }
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

      {/* Pagination Controls */}
      <div className="bg-white rounded-2xl border border-[#EBE3DC] overflow-hidden shadow-xs">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTasks.length}
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Global Modals */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        taskToEdit={null}
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

      <TaskImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => loadData()}
      />

      <CategoriesManagementModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />

      {/* Cancel Confirmation Modal in TasksView (OM-03) */}
      {taskToCancel && (
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
                Tem certeza que deseja cancelar a Ordem de Serviço <strong>{taskToCancel.numero_os}</strong>? Ela permanecerá visível na aba <strong>Canceladas</strong> para histórico e auditoria.
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
                  setTaskToCancel(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.role === 'LIDER') {
                    alert('O perfil de Líder não possui permissão para cancelar Ordens de Serviço.');
                    setTaskToCancel(null);
                    setCancelReason('');
                    return;
                  }
                  if (taskToCancel.status !== 'CONCLUIDA') {
                    dbStore.cancelTask(taskToCancel.id, cancelReason.trim() || undefined, currentUser?.role);
                  }
                  setTaskToCancel(null);
                  setCancelReason('');
                  loadData();
                }}
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
