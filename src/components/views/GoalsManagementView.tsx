import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FolderKanban,
  User,
  Calendar,
  X,
  Save,
  Sparkles,
  ArrowUpDown,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { dbStore } from '../../services/dbStore';
import { Meta, GoalPeriodicity, GoalDirection, Projeto, UsuarioPerfil } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { GoalImportModal } from './GoalImportModal';
import { PeriodFilter, PeriodSelection, PeriodFilterValue, isDateInPeriod } from '../common/PeriodFilter';
import { Pagination } from '../common/Pagination';

export const GoalsManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [goals, setGoals] = useState<Meta[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [leaders, setLeaders] = useState<UsuarioPerfil[]>([]);

  // Filter states
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<GoalPeriodicity | 'TODAS'>('TODAS');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('TODOS');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [period, setPeriod] = useState<PeriodFilterValue>({
    mode: 'TODOS',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Meta | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    indicador: '',
    meta_valor: 100,
    unidade_medida: '%',
    tipo_periodo: 'MENSAL' as GoalPeriodicity,
    periodo: 'Setembro / 2026',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    projetos_ids: [] as string[],
    direcao_melhor: 'MAIOR_MELHOR' as GoalDirection,
    descricao: '',
  });

  const loadData = () => {
    if (currentUser) {
      setGoals(dbStore.getGoalsForUser(currentUser.id, currentUser.role, currentUser.unidade_id));
    } else {
      setGoals(dbStore.getGoals());
    }
    setProjects(dbStore.getProjects());
    let allLeaders = dbStore.getUsers().filter((u) => u.role === 'LIDER');
    if (currentUser?.role === 'GERENCIA') {
      const managedLeaderIds = dbStore.getManagedLeaderIds(currentUser.id);
      allLeaders = allLeaders.filter((l) => managedLeaderIds.has(l.id));
    }
    setLeaders(allLeaders);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Automatically calculate leaders based on selected projects
  const autoIdentifiedLeaders = useMemo(() => {
    let allLeaders = dbStore.getLeaders();
    if (currentUser?.role === 'GERENCIA') {
      const managedLeaderIds = dbStore.getManagedLeaderIds(currentUser.id);
      allLeaders = allLeaders.filter((l) => managedLeaderIds.has(l.id) || managedLeaderIds.has(l.usuario_id));
    }
    if (!formData.projetos_ids || formData.projetos_ids.length === 0) {
      return allLeaders;
    }
    return allLeaders.filter((l) => {
      const leaderProjIds = l.projetos_ids && l.projetos_ids.length > 0
        ? l.projetos_ids
        : [l.unidade_id || (l as any).projeto_id].filter(Boolean);
      return leaderProjIds.some((id) => formData.projetos_ids.includes(id as string));
    });
  }, [formData.projetos_ids, currentUser]);

  const handleToggleProject = (projId: string) => {
    setFormData((prev) => {
      const exists = prev.projetos_ids.includes(projId);
      const updated = exists
        ? prev.projetos_ids.filter((id) => id !== projId)
        : [...prev.projetos_ids, projId];
      return { ...prev, projetos_ids: updated };
    });
  };

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    const today = new Date();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    setFormData({
      indicador: '',
      meta_valor: 100,
      unidade_medida: '%',
      tipo_periodo: 'MENSAL',
      periodo: `${monthNames[today.getMonth()]} / ${today.getFullYear()}`,
      data_inicio: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
      data_fim: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0],
      projetos_ids: projects[0]?.id ? [projects[0].id] : [],
      direcao_melhor: 'MAIOR_MELHOR',
      descricao: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: Meta) => {
    setEditingGoal(goal);
    let initialProjectIds = goal.projetos_ids && goal.projetos_ids.length > 0
      ? goal.projetos_ids
      : goal.unidade_id || goal.projeto_id
      ? [goal.unidade_id || goal.projeto_id!]
      : [];

    setFormData({
      indicador: goal.indicador,
      meta_valor: goal.meta_valor,
      unidade_medida: goal.unidade_medida,
      tipo_periodo: goal.tipo_periodo,
      periodo: goal.periodo,
      data_inicio: goal.data_inicio || '',
      data_fim: goal.data_fim || '',
      projetos_ids: initialProjectIds,
      direcao_melhor: goal.direcao_melhor || 'MAIOR_MELHOR',
      descricao: goal.descricao || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteGoal = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a meta "${name}"?`)) {
      dbStore.deleteGoal(id);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.indicador.trim()) {
      alert('Por favor, informe o nome do indicador.');
      return;
    }

    const selectedProjectObjs = projects.filter((u) => formData.projetos_ids.includes(u.id));
    const selectedProjectNames = selectedProjectObjs.map((p) => p.nome);
    const primaryProject = selectedProjectObjs[0];

    const leaderIds = autoIdentifiedLeaders.map((l) => l.usuario_id || l.id);
    const leaderNames = autoIdentifiedLeaders.map((l) => l.nome);
    const primaryLeader = autoIdentifiedLeaders[0];

    const goalPayload = {
      indicador: formData.indicador.trim(),
      meta_valor: Number(formData.meta_valor),
      valor_atual: editingGoal ? editingGoal.valor_atual : 0,
      unidade_medida: formData.unidade_medida,
      tipo_periodo: formData.tipo_periodo,
      periodo: formData.periodo.trim(),
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim,
      unidade_id: primaryProject?.id,
      unidade_nome: primaryProject?.nome,
      projeto_id: primaryProject?.id,
      projeto_nome: primaryProject?.nome,
      projetos_ids: formData.projetos_ids,
      projetos_nomes: selectedProjectNames,
      lider_id: primaryLeader?.usuario_id || primaryLeader?.id,
      lider_nome: primaryLeader?.nome,
      lideres_ids: leaderIds,
      lideres_nomes: leaderNames,
      direcao_melhor: formData.direcao_melhor,
      descricao: formData.descricao.trim(),
    };

    if (editingGoal) {
      dbStore.updateGoal(editingGoal.id, goalPayload);
    } else {
      if (autoIdentifiedLeaders.length > 1) {
        autoIdentifiedLeaders.forEach((leader) => {
          const leaderProjIds = leader.projetos_ids && leader.projetos_ids.length > 0
            ? leader.projetos_ids
            : [leader.unidade_id || (leader as any).projeto_id].filter(Boolean);
          const matchedProj = projects.find((p) => leaderProjIds.includes(p.id)) || primaryProject;

          dbStore.createGoal({
            ...goalPayload,
            unidade_id: matchedProj?.id,
            unidade_nome: matchedProj?.nome,
            projeto_id: matchedProj?.id,
            projeto_nome: matchedProj?.nome,
            projetos_ids: [matchedProj?.id || primaryProject.id],
            projetos_nomes: [matchedProj?.nome || primaryProject.nome],
            lider_id: leader.usuario_id || leader.id,
            lider_nome: leader.nome,
            lideres_ids: [leader.usuario_id || leader.id],
            lideres_nomes: [leader.nome],
          });
        });
      } else {
        dbStore.createGoal(goalPayload);
      }
    }

    setIsModalOpen(false);
  };

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchPeriodicity = selectedPeriodicity === 'TODAS' || goal.tipo_periodo === selectedPeriodicity;
      const matchProject = selectedProjectId === 'TODOS' || goal.unidade_id === selectedProjectId || goal.projeto_id === selectedProjectId;
      const matchLeader = selectedLeaderId === 'TODOS' || goal.lider_id === selectedLeaderId;
      const matchPeriod = isDateInPeriod(goal.data_inicio || goal.data_fim, period);
      const matchSearch =
        searchTerm === '' ||
        goal.indicador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (goal.unidade_nome && goal.unidade_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (goal.lider_nome && goal.lider_nome.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchPeriodicity && matchProject && matchLeader && matchPeriod && matchSearch;
    });
  }, [goals, selectedPeriodicity, selectedProjectId, selectedLeaderId, searchTerm, period]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriodicity, selectedProjectId, selectedLeaderId, searchTerm, period]);

  const paginatedGoals = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredGoals.slice(start, start + 10);
  }, [filteredGoals, currentPage]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = goals.length;
    let reached = 0;
    goals.forEach((g) => {
      if (g.direcao_melhor === 'MENOR_MELHOR') {
        if (g.valor_atual <= g.meta_valor && g.valor_atual > 0) reached++;
      } else {
        if (g.valor_atual >= g.meta_valor) reached++;
      }
    });

    return {
      total,
      reached,
      inProgress: total - reached,
      percentReached: total > 0 ? Math.round((reached / total) * 100) : 0,
    };
  }, [goals]);

  const formatVal = (val: number, unit?: string) => {
    if (unit === 'R$') {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (unit === '%') {
      return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    }
    return `${val.toLocaleString('pt-BR')} ${unit || ''}`.trim();
  };

  return (
    <div id="goals-management-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C76B4A] uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Administração Geral</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Gestão de Metas & Indicadores
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Defina as metas operacionais por período (diárias, semanais e mensais). Os líderes reportam o realizado diretamente na Área do Líder.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar Metas (.xlsx)</span>
          </button>

          <button
            id="btn-create-goal"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total de Metas</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{metrics.total}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Diárias, Semanais e Mensais</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Metas Atingidas</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-2">
            {metrics.reached}
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {metrics.percentReached}%
            </span>
          </div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Realizado dentro do target</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Em Andamento</span>
          <div className="text-2xl font-black text-[#C76B4A] mt-1">{metrics.inProgress}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Aguardando reporte dos líderes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Projetos Cobertos</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{projects.length}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Com indicadores cadastrados</span>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
          <Calendar className="w-4 h-4 text-[#C76B4A]" />
          <span>Filtro de Período Geral:</span>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Periodicity Tabs */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 overflow-x-auto">
            {(
              [
                { id: 'TODAS', label: 'Todas' },
                { id: 'DIARIA', label: 'Diárias' },
                { id: 'SEMANAL', label: 'Semanais' },
                { id: 'MENSAL', label: 'Mensais' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                id={`filter-period-${p.id.toLowerCase()}`}
                onClick={() => setSelectedPeriodicity(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedPeriodicity === p.id
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              id="input-search-admin-goals"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar indicador ou período..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
            />
          </div>
        </div>

        {/* Dropdown filters for Project and Leader */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Filtrar por Projeto</label>
            <select
              id="select-filter-goal-unit"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
            >
              <option value="TODOS">Todos os Projetos</option>
              {projects.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Filtrar por Líder</label>
            <select
              id="select-filter-goal-leader"
              value={selectedLeaderId}
              onChange={(e) => setSelectedLeaderId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
            >
              <option value="TODOS">Todos os Líderes</option>
              {leaders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome} ({l.unidade_nome || 'Sem projeto'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Goals Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Indicador & Periodicidade</th>
                <th className="px-4 py-3.5">Projeto / Líder</th>
                <th className="px-4 py-3.5">Meta Target</th>
                <th className="px-4 py-3.5">Realizado (Líder)</th>
                <th className="px-4 py-3.5">Progresso</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredGoals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                    Nenhuma meta encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedGoals.map((goal) => {
                  const isSmallerBetter = goal.direcao_melhor === 'MENOR_MELHOR';
                  let percent = 0;
                  let isReached = false;
                  if (isSmallerBetter) {
                    isReached = goal.valor_atual <= goal.meta_valor && goal.valor_atual > 0;
                    percent = goal.meta_valor > 0 ? Math.round((goal.meta_valor / Math.max(goal.valor_atual, 0.01)) * 100) : 100;
                  } else {
                    isReached = goal.valor_atual >= goal.meta_valor;
                    percent = goal.meta_valor > 0 ? Math.round((goal.valor_atual / goal.meta_valor) * 100) : 0;
                  }

                  return (
                    <tr key={goal.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                            {goal.tipo_periodo}
                          </span>
                          <strong className="text-stone-900 text-sm">{goal.indicador}</strong>
                        </div>
                        <div className="text-[11px] text-stone-600 mt-0.5">
                          Período: {goal.periodo}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-stone-800 font-medium truncate max-w-[180px]">
                          {goal.unidade_nome || goal.projeto_nome || 'Geral (Todos os Projetos)'}
                        </div>
                        {goal.lider_nome && (
                          <div className="text-[11px] text-stone-600 truncate max-w-[180px]">
                            Líder: {goal.lider_nome}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-stone-900 whitespace-nowrap">
                        {formatVal(goal.meta_valor, goal.unidade_medida)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-[#C76B4A]">
                        {goal.valor_atual > 0 ? (
                          formatVal(goal.valor_atual, goal.unidade_medida)
                        ) : (
                          <span className="text-stone-400 font-normal italic">Não reportado</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="w-24">
                          <div className="flex justify-between text-[11px] font-bold mb-1">
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isReached || percent >= 100
                                  ? 'bg-emerald-500'
                                  : percent >= 80
                                  ? 'bg-[#C76B4A]'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isReached ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Atingida
                          </span>
                        ) : goal.valor_atual > 0 ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Em Andamento
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-stone-100 text-stone-600 border border-stone-200 inline-flex items-center gap-1">
                            Aguardando
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(goal)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Editar Meta"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id, goal.indicador)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir Meta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredGoals.length}
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Create / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-lg font-black text-stone-900">
                {editingGoal ? 'Editar Meta Operacional' : 'Cadastrar Nova Meta Operacional'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Indicador */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Nome do Indicador *
                </label>
                <input
                  type="text"
                  value={formData.indicador}
                  onChange={(e) => setFormData({ ...formData, indicador: e.target.value })}
                  placeholder="Ex: Produção, Atendimento, Absenteísmo, Qualidade..."
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none font-medium"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-stone-400 self-center">Sugestões:</span>
                  {['Produção', 'Atendimento', 'Qualidade', 'Absenteísmo', 'Faturamento', 'SLA de OS'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, indicador: s })}
                      className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Periodicidade & Conditional Period Inputs */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-stone-700 mb-1 block">
                      Periodicidade da Meta *
                    </label>
                    <select
                      value={formData.tipo_periodo}
                      onChange={(e) => setFormData({ ...formData, tipo_periodo: e.target.value as GoalPeriodicity })}
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none font-semibold"
                    >
                      <option value="DIARIA">Diária</option>
                      <option value="SEMANAL">Semanal</option>
                      <option value="MENSAL">Mensal</option>
                    </select>
                  </div>

                  {formData.tipo_periodo === 'DIARIA' && (
                    <>
                      <div>
                        <label className="font-semibold text-stone-700 mb-1 block">
                          Data de Início *
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.data_inicio}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parts = val.split('-');
                            const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : val;
                            setFormData({
                              ...formData,
                              data_inicio: val,
                              data_fim: formData.data_fim && formData.data_fim >= val ? formData.data_fim : val,
                              periodo: formatted,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-700 mb-1 block">
                          Data fim (Validade da Meta) *
                        </label>
                        <input
                          type="date"
                          min={formData.data_inicio || new Date().toISOString().split('T')[0]}
                          value={formData.data_fim || formData.data_inicio}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              data_fim: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                          required
                        />
                      </div>
                    </>
                  )}

                  {formData.tipo_periodo === 'SEMANAL' && (
                    <>
                      <div>
                        <label className="font-semibold text-stone-700 mb-1 block">
                          Semana (Data de Início) *
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.data_inicio}
                          onChange={(e) => {
                            const start = new Date(e.target.value);
                            const end = new Date(start);
                            end.setDate(start.getDate() + 6);
                            const startStr = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`;
                            const endStr = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
                            setFormData({
                              ...formData,
                              data_inicio: e.target.value,
                              data_fim: end.toISOString().split('T')[0],
                              periodo: `Semana (${startStr} a ${endStr})`,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-700 mb-1 block">
                          Semana (Data de Término) *
                        </label>
                        <input
                          type="date"
                          min={formData.data_inicio || new Date().toISOString().split('T')[0]}
                          value={formData.data_fim}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              data_fim: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                          required
                        />
                      </div>
                    </>
                  )}

                  {formData.tipo_periodo === 'MENSAL' && (
                    <>
                      <div>
                        <label className="font-semibold text-stone-700 mb-1 block">
                          Mês de Referência *
                        </label>
                        <select
                          value={formData.periodo}
                          onChange={(e) => {
                            const selectedMonthLabel = e.target.value;
                            const monthNames = [
                              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                            ];
                            const currentYear = new Date().getFullYear();
                            const monthIndex = monthNames.findIndex((m) => selectedMonthLabel.startsWith(m));
                            const yearMatch = selectedMonthLabel.match(/\d{4}/);
                            const year = yearMatch ? parseInt(yearMatch[0], 10) : currentYear;

                            if (monthIndex >= 0) {
                              const firstDay = new Date(year, monthIndex, 1).toISOString().split('T')[0];
                              const lastDay = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];
                              setFormData({
                                ...formData,
                                periodo: selectedMonthLabel,
                                data_inicio: firstDay,
                                data_fim: lastDay,
                              });
                            } else {
                              setFormData({
                                ...formData,
                                periodo: selectedMonthLabel,
                              });
                            }
                          }}
                          className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none font-medium"
                          required
                        >
                          {(() => {
                            const today = new Date();
                            const monthNames = [
                              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                            ];
                            const list: { label: string; value: string }[] = [];
                            for (let offset = -1; offset <= 12; offset++) {
                              const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
                              const mName = monthNames[d.getMonth()];
                              const yr = d.getFullYear();
                              const value = `${mName} / ${yr}`;
                              let tag = '';
                              if (offset === -1) tag = ' (Mês Anterior)';
                              else if (offset === 0) tag = ' (Mês Atual)';
                              list.push({ value, label: `${value}${tag}` });
                            }

                            return list.map((item) => (
                              <option key={item.label} value={item.value}>
                                {item.label}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-stone-700 mb-1 block">
                          Data Limite / Fim da Meta *
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.data_fim}
                          onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="text-[11px] text-stone-500 font-medium">
                  Rótulo gerado: <strong className="text-stone-800">{formData.periodo}</strong> {formData.data_fim && <span>• Término em: <strong className="text-stone-800">{formData.data_fim.split('-').reverse().join('/')}</strong></span>}
                </div>
              </div>

              {/* Meta Valor & Unidade de Medida (NO Realizado here!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Meta Target (Valor a Atingir) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.meta_valor}
                    onChange={(e) => setFormData({ ...formData, meta_valor: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  >
                    <option value="%">% (Percentual)</option>
                    <option value="unidades">unidades</option>
                    <option value="R$">R$ (Reais)</option>
                    <option value="atendimentos">atendimentos</option>
                    <option value="OS">OS</option>
                    <option value="minutos">minutos</option>
                    <option value="pts">pontos (NPS)</option>
                  </select>
                </div>
              </div>

              {/* Critério do Indicador (Maior é melhor vs Menor é melhor) */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Critério de Atingimento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direcao_melhor: 'MAIOR_MELHOR' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 ${
                      formData.direcao_melhor === 'MAIOR_MELHOR'
                        ? 'border-[#C76B4A] bg-[#C76B4A]/10 text-stone-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs">Maior é melhor</div>
                      <div className="text-[10px] text-stone-600 font-normal">Ex: Produção, Vendas, Atendimentos</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direcao_melhor: 'MENOR_MELHOR' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 ${
                      formData.direcao_melhor === 'MENOR_MELHOR'
                        ? 'border-[#C76B4A] bg-[#C76B4A]/10 text-stone-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-rose-600 rotate-180" />
                    <div>
                      <div className="text-xs">Menor é melhor</div>
                      <div className="text-[10px] text-stone-600 font-normal">Ex: Absenteísmo, Quebras, TMA</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Vínculo: Projeto (Multi-seleção) e Líderes Atribuidos Automaticamente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 mb-1 block text-xs">
                    Projeto(s) Vinculado(s) (Multi-seleção)
                  </label>
                  <div className="border border-stone-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-stone-50">
                    {projects.length === 0 ? (
                      <span className="text-xs text-stone-400">Nenhum projeto cadastrado</span>
                    ) : (
                      projects.map((p) => {
                        const isChecked = formData.projetos_ids.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer transition ${
                              isChecked ? 'bg-[#C76B4A]/10 text-[#C76B4A] font-bold' : 'hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProject(p.id)}
                              className="rounded border-stone-300 text-[#C76B4A] focus:ring-0"
                            />
                            <span>{p.nome}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block text-xs">
                    Líder(es) Atribuído(s) Automaticamente
                  </label>
                  <div className="border border-stone-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-emerald-50/50">
                    <p className="text-[10px] text-emerald-800 font-medium mb-1">
                      Identificado(s) com base nos projeto(s) selecionados:
                    </p>
                    {autoIdentifiedLeaders.length === 0 ? (
                      <span className="text-xs text-amber-700 font-semibold block">Nenhum líder vinculado a este(s) projeto(s)</span>
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
              </div>

              {/* Descrição */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Descrição & Orientações da Meta
                </label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Orientações adicionais para a liderança operacional..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  {editingGoal ? 'Salvar Alterações' : 'Cadastrar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Import Modal */}
      <GoalImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => loadData()}
      />
    </div>
  );
};
