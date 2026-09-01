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
  Building2,
  User,
  Calendar,
  X,
  Save,
  Sparkles,
  ArrowUpDown,
  Clock,
} from 'lucide-react';
import { dbStore } from '../../services/dbStore';
import { Meta, GoalPeriodicity, GoalDirection, Unidade, UsuarioPerfil } from '../../types/database';

export const GoalsManagementView: React.FC = () => {
  const [goals, setGoals] = useState<Meta[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [leaders, setLeaders] = useState<UsuarioPerfil[]>([]);

  // Filter states
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<GoalPeriodicity | 'TODAS'>('TODAS');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('TODAS');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Meta | null>(null);

  // Quick inline update modal
  const [quickUpdateGoal, setQuickUpdateGoal] = useState<Meta | null>(null);
  const [quickRealizedVal, setQuickRealizedVal] = useState<number>(0);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    indicador: '',
    meta_valor: 100,
    valor_atual: 0,
    unidade_medida: '%',
    tipo_periodo: 'MENSAL' as GoalPeriodicity,
    periodo: 'Setembro / 2026',
    data_inicio: '2026-09-01',
    data_fim: '2026-09-30',
    unidade_id: '',
    lider_id: '',
    direcao_melhor: 'MAIOR_MELHOR' as GoalDirection,
    descricao: '',
  });

  const loadData = () => {
    setGoals(dbStore.getGoals());
    setUnits(dbStore.getUnits());
    setLeaders(dbStore.getUsers().filter((u) => u.role === 'LIDER'));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setFormData({
      indicador: '',
      meta_valor: 100,
      valor_atual: 0,
      unidade_medida: '%',
      tipo_periodo: 'MENSAL',
      periodo: 'Setembro / 2026',
      data_inicio: '2026-09-01',
      data_fim: '2026-09-30',
      unidade_id: '',
      lider_id: '',
      direcao_melhor: 'MAIOR_MELHOR',
      descricao: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: Meta) => {
    setEditingGoal(goal);
    setFormData({
      indicador: goal.indicador,
      meta_valor: goal.meta_valor,
      valor_atual: goal.valor_atual,
      unidade_medida: goal.unidade_medida,
      tipo_periodo: goal.tipo_periodo,
      periodo: goal.periodo,
      data_inicio: goal.data_inicio || '',
      data_fim: goal.data_fim || '',
      unidade_id: goal.unidade_id || '',
      lider_id: goal.lider_id || '',
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

    const selectedUnit = units.find((u) => u.id === formData.unidade_id);
    const selectedLeader = leaders.find((l) => l.id === formData.lider_id);

    const goalPayload = {
      indicador: formData.indicador.trim(),
      meta_valor: Number(formData.meta_valor),
      valor_atual: Number(formData.valor_atual),
      unidade_medida: formData.unidade_medida,
      tipo_periodo: formData.tipo_periodo,
      periodo: formData.periodo.trim(),
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim,
      unidade_id: formData.unidade_id || undefined,
      unidade_nome: selectedUnit?.nome || undefined,
      lider_id: formData.lider_id || undefined,
      lider_nome: selectedLeader?.nome || undefined,
      direcao_melhor: formData.direcao_melhor,
      descricao: formData.descricao.trim(),
    };

    if (editingGoal) {
      dbStore.updateGoal(editingGoal.id, goalPayload);
    } else {
      dbStore.createGoal(goalPayload);
    }

    setIsModalOpen(false);
  };

  const handleSaveQuickRealized = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUpdateGoal) return;
    dbStore.updateGoalRealized(quickUpdateGoal.id, Number(quickRealizedVal));
    setQuickUpdateGoal(null);
  };

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchPeriod = selectedPeriodicity === 'TODAS' || goal.tipo_periodo === selectedPeriodicity;
      const matchUnit = selectedUnitId === 'TODAS' || goal.unidade_id === selectedUnitId;
      const matchLeader = selectedLeaderId === 'TODOS' || goal.lider_id === selectedLeaderId;
      const matchSearch =
        searchTerm === '' ||
        goal.indicador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (goal.unidade_nome && goal.unidade_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (goal.lider_nome && goal.lider_nome.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchPeriod && matchUnit && matchLeader && matchSearch;
    });
  }, [goals, selectedPeriodicity, selectedUnitId, selectedLeaderId, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = goals.length;
    let reached = 0;
    goals.forEach((g) => {
      if (g.direcao_melhor === 'MENOR_MELHOR') {
        if (g.valor_atual <= g.meta_valor) reached++;
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
            Cadastre metas por período (diárias, semanais e mensais), vincule a unidades ou líderes e atualize valores realizados.
          </p>
        </div>

        <button
          id="btn-create-goal"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Meta</span>
        </button>
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
          <span className="text-[11px] text-stone-600 mt-0.5 block">Dentro ou acima do target</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Em Andamento</span>
          <div className="text-2xl font-black text-[#C76B4A] mt-1">{metrics.inProgress}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Aguardando entrega</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Unidades Cobertas</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{units.length}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Com metas ativas vinculadas</span>
        </div>
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
                    ? 'bg-white text-stone-900 shadow-xs'
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

        {/* Dropdown filters for Unit and Leader */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Filtrar por Unidade</label>
            <select
              id="select-filter-goal-unit"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
            >
              <option value="TODAS">Todas as Unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.codigo})
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
                  {l.nome} ({l.unidade_nome || 'Sem unidade'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Goals Table / List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Indicador & Periodicidade</th>
                <th className="px-4 py-3.5">Vínculo (Unidade/Líder)</th>
                <th className="px-4 py-3.5">Meta</th>
                <th className="px-4 py-3.5">Realizado</th>
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
                filteredGoals.map((goal) => {
                  const isSmallerBetter = goal.direcao_melhor === 'MENOR_MELHOR';
                  let percent = 0;
                  let isReached = false;
                  if (isSmallerBetter) {
                    isReached = goal.valor_atual <= goal.meta_valor;
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
                          {goal.unidade_nome || 'Geral (Toda a Rede)'}
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

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setQuickUpdateGoal(goal);
                            setQuickRealizedVal(goal.valor_atual);
                          }}
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-orange-50 text-stone-900 hover:text-orange-950 font-bold rounded-lg border border-stone-200 hover:border-orange-300 transition-colors"
                          title="Clique para atualizar o valor realizado rapidamente"
                        >
                          <span>{formatVal(goal.valor_atual, goal.unidade_medida)}</span>
                          <Edit2 className="w-3 h-3 text-stone-400 group-hover:text-orange-800" />
                        </button>
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
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Em Andamento
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(goal)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Editar Meta Completa"
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
      </div>

      {/* Quick Realized Value Update Modal */}
      {quickUpdateGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Atualizar Realizado
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Meta: <strong>{quickUpdateGoal.indicador}</strong> ({quickUpdateGoal.periodo})
            </p>

            <form onSubmit={handleSaveQuickRealized} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 mb-1 block">
                  Novo Valor Realizado ({quickUpdateGoal.unidade_medida})
                </label>
                <input
                  type="number"
                  step="any"
                  value={quickRealizedVal}
                  onChange={(e) => setQuickRealizedVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  autoFocus
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Meta estabelecida: {formatVal(quickUpdateGoal.meta_valor, quickUpdateGoal.unidade_medida)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickUpdateGoal(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Salvar Realizado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-lg font-black text-stone-900">
                {editingGoal ? 'Editar Meta' : 'Cadastrar Nova Meta'}
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
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
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

              {/* Periodicidade & Período */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Periodicidade *
                  </label>
                  <select
                    value={formData.tipo_periodo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_periodo: e.target.value as GoalPeriodicity })
                    }
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  >
                    <option value="DIARIA">Diária</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSAL">Mensal</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Rótulo do Período de Validade *
                  </label>
                  <input
                    type="text"
                    value={formData.periodo}
                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                    placeholder="Ex: Agosto / 2026, Semana 35, 01/09/2026"
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Meta & Realizado & Unidade de Medida */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Meta (Valor) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.meta_valor}
                    onChange={(e) => setFormData({ ...formData, meta_valor: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Realizado Inicial
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.valor_atual}
                    onChange={(e) => setFormData({ ...formData, valor_atual: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
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

              {/* Vínculo: Unidade e Líder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Vincular a uma Unidade (Opcional)
                  </label>
                  <select
                    value={formData.unidade_id}
                    onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  >
                    <option value="">Geral (Toda a Rede / Sem unidade fixa)</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Vincular a um Líder Específico (Opcional)
                  </label>
                  <select
                    value={formData.lider_id}
                    onChange={(e) => setFormData({ ...formData, lider_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  >
                    <option value="">Geral (Todos os Líderes da Unidade)</option>
                    {leaders.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome} ({l.unidade_nome || 'Sem unidade'})
                      </option>
                    ))}
                  </select>
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
    </div>
  );
};
