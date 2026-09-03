import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  FolderKanban,
  Info,
  ChevronRight,
  MessageSquare,
  X,
  Edit2,
  Save,
  Check,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';
import { Meta, GoalPeriodicity, ApontamentoMeta, Projeto } from '../../types/database';
import { CommentsThread } from '../comments/CommentsThread';
import { PeriodFilter, PeriodFilterValue, isDateInPeriod } from '../common/PeriodFilter';

// Helper utilities for Business Days and Date Formatting
const getTodayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getLastBusinessDayDate = (refDate: Date = new Date()) => {
  const d = new Date(refDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
};

const formatDateIso = (d: Date) => d.toISOString().split('T')[0];
const formatDatePtBr = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

export const LeaderGoalsView: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Meta[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('TODOS');
  const [selectedTab, setSelectedTab] = useState<GoalPeriodicity | 'TODAS'>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGoalForComments, setActiveGoalForComments] = useState<Meta | null>(null);
  const [activeGoalForUpdate, setActiveGoalForUpdate] = useState<Meta | null>(null);
  const [selectedApontamentoDate, setSelectedApontamentoDate] = useState<'HOJE' | 'DIA_UTIL_ANTERIOR'>('HOJE');
  const [newRealizedValue, setNewRealizedValue] = useState<number>(0);
  const [realizedNotes, setRealizedNotes] = useState<string>('');

  const todayDate = useMemo(() => getTodayDate(), []);
  const lastBusinessDayDate = useMemo(() => getLastBusinessDayDate(todayDate), [todayDate]);
  const todayIso = useMemo(() => formatDateIso(todayDate), [todayDate]);
  const lastBusinessDayIso = useMemo(() => formatDateIso(lastBusinessDayDate), [lastBusinessDayDate]);

  const [period, setPeriod] = useState<PeriodFilterValue>({
    mode: 'TODOS',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const loadGoals = () => {
    if (!user) return;
    const userGoals = dbStore.getGoalsForUser(user.id, user.role, user.unidade_id || (user as any).projeto_id);
    setGoals(userGoals);
    setProjects(dbStore.getUnits());
  };

  useEffect(() => {
    loadGoals();
    const unsubscribe = dbStore.subscribe(() => {
      loadGoals();
    });
    return () => unsubscribe();
  }, [user]);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchTab = selectedTab === 'TODAS' || goal.tipo_periodo === selectedTab;
      const matchSearch =
        searchTerm === '' ||
        goal.indicador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (goal.descricao && goal.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchPeriod = isDateInPeriod(goal.data_inicio || goal.data_fim, period);

      const matchProject =
        selectedProjectId === 'TODOS' ||
        goal.unidade_id === selectedProjectId ||
        goal.projeto_id === selectedProjectId ||
        (goal.projetos_ids && goal.projetos_ids.includes(selectedProjectId));

      // Daily goals rule: show only if within validity period or if active
      if (goal.tipo_periodo === 'DIARIA' && goal.data_inicio && goal.data_fim) {
        if (todayIso < goal.data_inicio || todayIso > goal.data_fim) {
          // If strictly outside date range and not searching specifically, hide
          if (!searchTerm && period.mode !== 'TODOS') return false;
        }
      }

      return matchTab && matchSearch && matchPeriod && matchProject;
    });
  }, [goals, selectedTab, selectedProjectId, searchTerm, period, todayIso]);

  // Consolidated monthly calculation
  const monthlyGoals = useMemo(() => {
    return goals.filter((g) => g.tipo_periodo === 'MENSAL');
  }, [goals]);

  const monthlyStats = useMemo(() => {
    if (monthlyGoals.length === 0) return null;

    let reachedCount = 0;
    const items = monthlyGoals.map((g) => {
      const isSmallerBetter = g.direcao_melhor === 'MENOR_MELHOR';
      let progressPercent = 0;
      let isReached = false;

      if (isSmallerBetter) {
        isReached = g.valor_atual <= g.meta_valor && g.valor_atual > 0;
        progressPercent = g.meta_valor > 0 ? Math.round((g.meta_valor / Math.max(g.valor_atual, 0.01)) * 100) : 100;
      } else {
        isReached = g.valor_atual >= g.meta_valor;
        progressPercent = g.meta_valor > 0 ? Math.round((g.valor_atual / g.meta_valor) * 100) : 0;
      }

      if (isReached) reachedCount++;

      return {
        id: g.id,
        indicador: g.indicador,
        progressPercent,
        isReached,
        isSmallerBetter,
        meta_valor: g.meta_valor,
        valor_atual: g.valor_atual,
        unidade_medida: g.unidade_medida,
      };
    });

    const averageProgress = Math.round(
      items.reduce((acc, curr) => acc + Math.min(curr.progressPercent, 100), 0) / items.length
    );

    return {
      periodo: monthlyGoals[0]?.periodo || 'Mês Atual',
      items,
      reachedCount,
      totalCount: monthlyGoals.length,
      averageProgress,
    };
  }, [monthlyGoals]);

  // Helper to format values
  const formatVal = (val: number, unit?: string) => {
    if (unit === 'R$') {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (unit === '%') {
      return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    }
    return `${val.toLocaleString('pt-BR')} ${unit || ''}`.trim();
  };

  // Helper to calculate progress info
  const getGoalStatusInfo = (goal: Meta) => {
    const isSmallerBetter = goal.direcao_melhor === 'MENOR_MELHOR';
    let percent = 0;
    let isReached = false;
    let remaining = 0;

    if (isSmallerBetter) {
      isReached = goal.valor_atual <= goal.meta_valor && goal.valor_atual > 0;
      remaining = Math.max(0, goal.valor_atual - goal.meta_valor);
      percent = goal.meta_valor > 0 ? Math.round((goal.meta_valor / Math.max(goal.valor_atual, 0.01)) * 100) : 100;
    } else {
      isReached = goal.valor_atual >= goal.meta_valor;
      remaining = Math.max(0, goal.meta_valor - goal.valor_atual);
      percent = goal.meta_valor > 0 ? Math.round((goal.valor_atual / goal.meta_valor) * 100) : 0;
    }

    if (isReached || percent >= 100) {
      return {
        isReached: true,
        percent: 100,
        rawPercent: percent,
        statusTier: 'ATINGIDA',
        badgeText: 'Atingida',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        textColor: 'text-emerald-600',
        barColor: 'bg-emerald-500',
        cardBorder: 'border-emerald-200 shadow-emerald-50/50',
        remainingVal: 0,
      };
    }

    if (percent >= 80) {
      return {
        isReached: false,
        percent,
        rawPercent: percent,
        statusTier: 'PROXIMA',
        badgeText: 'Próxima da Meta',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        textColor: 'text-amber-600',
        barColor: 'bg-[#C76B4A]',
        cardBorder: 'border-amber-200',
        remainingVal: remaining,
      };
    }

    return {
      isReached: false,
      percent,
      rawPercent: percent,
      statusTier: 'DISTANTE',
      badgeText: goal.valor_atual > 0 ? 'Em Andamento' : 'Aguardando Reporte',
      badgeBg: 'bg-stone-100 text-stone-700 border-stone-300',
      textColor: 'text-rose-600',
      barColor: 'bg-rose-500',
      cardBorder: 'border-stone-200',
      remainingVal: remaining,
    };
  };

  const handleOpenUpdateModal = (goal: Meta, defaultRefDate: 'HOJE' | 'DIA_UTIL_ANTERIOR' = 'HOJE') => {
    setActiveGoalForUpdate(goal);
    setSelectedApontamentoDate(defaultRefDate);

    const targetIso = defaultRefDate === 'HOJE' ? todayIso : lastBusinessDayIso;
    const existing = goal.historico_apontamentos?.find((a) => a.data_efetiva === targetIso);

    if (existing) {
      setNewRealizedValue(existing.valor);
      setRealizedNotes(existing.observacao || '');
    } else {
      let dailyTarget = 0;
      if (goal.tipo_periodo === 'SEMANAL') {
        dailyTarget = Math.round((goal.meta_valor / 5) * 100) / 100;
      } else if (goal.tipo_periodo === 'MENSAL') {
        dailyTarget = Math.round((goal.meta_valor / 22) * 100) / 100;
      } else {
        dailyTarget = goal.meta_valor;
      }
      setNewRealizedValue(dailyTarget);
      setRealizedNotes('');
    }
  };

  const handleSwitchRefDate = (refDate: 'HOJE' | 'DIA_UTIL_ANTERIOR') => {
    setSelectedApontamentoDate(refDate);
    if (!activeGoalForUpdate) return;

    const targetIso = refDate === 'HOJE' ? todayIso : lastBusinessDayIso;
    const existing = activeGoalForUpdate.historico_apontamentos?.find((a) => a.data_efetiva === targetIso);

    if (existing) {
      setNewRealizedValue(existing.valor);
      setRealizedNotes(existing.observacao || '');
    } else {
      let dailyTarget = 0;
      if (activeGoalForUpdate.tipo_periodo === 'SEMANAL') {
        dailyTarget = Math.round((activeGoalForUpdate.meta_valor / 5) * 100) / 100;
      } else if (activeGoalForUpdate.tipo_periodo === 'MENSAL') {
        dailyTarget = Math.round((activeGoalForUpdate.meta_valor / 22) * 100) / 100;
      } else {
        dailyTarget = activeGoalForUpdate.meta_valor;
      }
      setNewRealizedValue(dailyTarget);
      setRealizedNotes('');
    }
  };

  const handleSaveRealized = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForUpdate || !user) return;

    const targetIso = selectedApontamentoDate === 'HOJE' ? todayIso : lastBusinessDayIso;
    const currentHistory = activeGoalForUpdate.historico_apontamentos || [];

    const newApontamento: ApontamentoMeta = {
      id: `apt-${Date.now()}`,
      meta_id: activeGoalForUpdate.id,
      valor: Number(newRealizedValue),
      data_referencia: selectedApontamentoDate,
      data_efetiva: targetIso,
      data_registro: new Date().toISOString(),
      autor_id: user.id,
      autor_nome: user.nome,
      observacao: realizedNotes.trim() || undefined,
    };

    const updatedHistory = currentHistory.filter((a) => a.data_efetiva !== targetIso);
    updatedHistory.push(newApontamento);

    // Sum all daily entries
    const accumulatedTotal = updatedHistory.reduce((acc, curr) => acc + Number(curr.valor), 0);

    dbStore.updateGoal(activeGoalForUpdate.id, {
      valor_atual: accumulatedTotal,
      historico_apontamentos: updatedHistory,
      data_ultimo_apontamento: targetIso,
    });

    if (realizedNotes.trim()) {
      dbStore.addComment({
        item_tipo: 'META',
        item_id: activeGoalForUpdate.id,
        autor_id: user.id,
        autor_nome: user.nome,
        autor_role: user.role,
        texto: `[Apontamento Diário - ${selectedApontamentoDate === 'HOJE' ? 'Hoje' : 'Último Dia Útil'} (${targetIso})]: ${newRealizedValue} ${activeGoalForUpdate.unidade_medida}\n${realizedNotes.trim()}`,
      });
    }

    setActiveGoalForUpdate(null);
  };

  return (
    <div id="leader-goals-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C76B4A] uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Área do Líder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Minhas Metas & Indicadores
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Acompanhe o atingimento das metas pactuadas e reporte o valor realizado das suas operações.
          </p>
        </div>

        {user?.unidade_nome && (
          <div className="px-3.5 py-2 bg-stone-100 rounded-xl border border-stone-200 text-stone-700 text-xs flex items-center gap-2 self-start sm:self-center">
            <FolderKanban className="w-4 h-4 text-[#C76B4A]" />
            <span className="font-semibold">{user.unidade_nome}</span>
          </div>
        )}
      </div>

      {/* Visão Consolidada Mensal */}
      {monthlyStats && (
        <div
          id="consolidated-monthly-card"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                Consolidado do Mês
              </span>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2 mt-0.5">
                <Calendar className="w-5 h-5 text-[#C76B4A]" />
                {monthlyStats.periodo.toUpperCase()}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-stone-600 block">Metas Atingidas</span>
                <strong className="text-base font-bold text-stone-900">
                  {monthlyStats.reachedCount} de {monthlyStats.totalCount}
                </strong>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#C76B4A] font-black text-sm shadow-xs">
                {monthlyStats.averageProgress}%
              </div>
            </div>
          </div>

          {/* Quick Indicator Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {monthlyStats.items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-stone-800 truncate block">
                    {item.indicador}
                  </span>
                  <span className="text-[11px] text-stone-600">
                    Realizado: {formatVal(item.valor_atual, item.unidade_medida)}
                  </span>
                </div>
                <div>
                  {item.isReached ? (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Atingida
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full border shrink-0 ${
                        item.progressPercent >= 80
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {item.progressPercent}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period Filter Bar */}
      <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
          <Calendar className="w-4 h-4 text-[#C76B4A]" />
          <span>Filtro de Período:</span>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Sub-tabs and Search Bar */}
      <div id="goals-controls" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Sub-tabs: Diárias, Semanais, Mensais, Todas */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 overflow-x-auto">
          {(
            [
              { id: 'TODAS', label: 'Todas as Metas' },
              { id: 'DIARIA', label: 'Diárias' },
              { id: 'SEMANAL', label: 'Semanais' },
              { id: 'MENSAL', label: 'Mensais' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              id={`tab-goal-${tab.id.toLowerCase()}`}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 text-stone-700">
                {tab.id === 'TODAS'
                  ? goals.length
                  : goals.filter((g) => g.tipo_periodo === tab.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            id="select-filter-leader-goal-project"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white rounded-xl border border-stone-200 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#C76B4A] shadow-xs"
          >
            <option value="TODOS">Todos os Projetos</option>
            {projects.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              id="input-search-goals"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por indicador..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C76B4A] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Goals Progress Cards Grid */}
      {filteredGoals.length === 0 ? (
        <div
          id="goals-empty-state"
          className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">Nenhuma meta encontrada</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente ajustar sua busca por outros termos.'
              : 'Não há metas cadastradas para o período ou periodicidade selecionados.'}
          </p>
        </div>
      ) : (
        <div id="goals-cards-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const statusInfo = getGoalStatusInfo(goal);
            return (
              <div
                key={goal.id}
                id={`card-goal-${goal.id}`}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs relative flex flex-col justify-between ${statusInfo.cardBorder}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                          {goal.tipo_periodo}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          {goal.periodo}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 leading-snug">
                        {goal.indicador}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full border shrink-0 flex items-center gap-1.5 ${statusInfo.badgeBg}`}
                    >
                      {statusInfo.statusTier === 'ATINGIDA' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : statusInfo.statusTier === 'PROXIMA' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {statusInfo.badgeText}
                    </span>
                  </div>

                  {goal.descricao && (
                    <p className="text-xs text-stone-500 mb-4 line-clamp-2">
                      {goal.descricao}
                    </p>
                  )}

                  {/* Progress Numbers */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 mb-4 text-xs">
                    <div>
                      <span className="text-[11px] text-stone-600 block">Realizado (Líder)</span>
                      <strong className="text-sm font-bold text-[#C76B4A]">
                        {goal.valor_atual > 0 ? (
                          formatVal(goal.valor_atual, goal.unidade_medida)
                        ) : (
                          <span className="text-stone-400 font-normal italic">0.00</span>
                        )}
                      </strong>
                    </div>

                    <div className="text-center border-x border-stone-200/80 px-1">
                      <span className="text-[11px] text-stone-600 block">Faltam</span>
                      <strong className={`text-sm font-bold ${statusInfo.textColor}`}>
                        {statusInfo.remainingVal > 0
                          ? formatVal(statusInfo.remainingVal, goal.unidade_medida)
                          : '0 (Atingida)'}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-stone-600 block">Meta Target</span>
                      <strong className="text-sm font-bold text-stone-900">
                        {formatVal(goal.meta_valor, goal.unidade_medida)}
                      </strong>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-600">Progresso Atual</span>
                      <span className={statusInfo.textColor}>
                        {statusInfo.rawPercent}% da meta
                      </span>
                    </div>
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200/80">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusInfo.barColor}`}
                        style={{ width: `${Math.min(statusInfo.percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Daily Reporting Quick Buttons */}
                <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-[#C76B4A]" />
                      Reporte Diário por Período
                    </span>
                    {goal.tipo_periodo !== 'DIARIA' && (
                      <span className="text-stone-600 font-medium">
                        Meta Diária Prop.: {formatVal(
                          Math.round((goal.meta_valor / (goal.tipo_periodo === 'SEMANAL' ? 5 : 22)) * 100) / 100,
                          goal.unidade_medida
                        )}/dia
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Today Button */}
                    {(() => {
                      const todayApt = goal.historico_apontamentos?.find((a) => a.data_efetiva === todayIso);
                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenUpdateModal(goal, 'HOJE')}
                          className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            todayApt
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                              : 'bg-white border-stone-200 text-stone-800 hover:border-[#C76B4A] hover:bg-orange-50/50'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-stone-500 uppercase block">
                            Hoje ({formatDatePtBr(todayDate)})
                          </span>
                          <strong className="text-xs font-bold mt-0.5 block truncate">
                            {todayApt ? (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3" /> {formatVal(todayApt.valor, goal.unidade_medida)}
                              </span>
                            ) : (
                              <span className="text-[#C76B4A]">Lançar Hoje</span>
                            )}
                          </strong>
                        </button>
                      );
                    })()}

                    {/* Last Business Day Button */}
                    {(() => {
                      const prevApt = goal.historico_apontamentos?.find((a) => a.data_efetiva === lastBusinessDayIso);
                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenUpdateModal(goal, 'DIA_UTIL_ANTERIOR')}
                          className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            prevApt
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                              : 'bg-white border-stone-200 text-stone-800 hover:border-[#C76B4A] hover:bg-orange-50/50'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-stone-500 uppercase block">
                            Dia Útil Ant. ({formatDatePtBr(lastBusinessDayDate)})
                          </span>
                          <strong className="text-xs font-bold mt-0.5 block truncate">
                            {prevApt ? (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3" /> {formatVal(prevApt.valor, goal.unidade_medida)}
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold">Lançar Dia Útil</span>
                            )}
                          </strong>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenUpdateModal(goal, 'HOJE')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C76B4A] hover:bg-[#b55e3e] text-white font-bold rounded-xl transition shadow-xs text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Apontar Produção</span>
                  </button>

                  <button
                    onClick={() => setActiveGoalForComments(goal)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition text-xs"
                    title="Alinhamento e Comentários da Meta"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C76B4A]" />
                    <span>Chat ({dbStore.getComments('META', goal.id).length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Realized Value Input Modal */}
      {activeGoalForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Apontamento Diário de Realizado
                </h3>
                <p className="text-xs text-stone-500">
                  Indicador: <strong>{activeGoalForUpdate.indicador}</strong> ({activeGoalForUpdate.periodo})
                </p>
              </div>
              <button
                onClick={() => setActiveGoalForUpdate(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRealized} className="space-y-4">
              {/* Reference Date Selector (Hoje vs Último Dia Útil) */}
              <div>
                <label className="text-xs font-bold text-stone-800 mb-1.5 block">
                  Selecione a Data de Referência do Apontamento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchRefDate('HOJE')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedApontamentoDate === 'HOJE'
                        ? 'bg-[#C76B4A] text-white border-[#C76B4A] shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-80 block">Hoje</span>
                    <strong className="text-xs font-bold block">{formatDatePtBr(todayDate)} ({todayIso})</strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRefDate('DIA_UTIL_ANTERIOR')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedApontamentoDate === 'DIA_UTIL_ANTERIOR'
                        ? 'bg-[#C76B4A] text-white border-[#C76B4A] shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-80 block">Último Dia Útil</span>
                    <strong className="text-xs font-bold block">{formatDatePtBr(lastBusinessDayDate)} ({lastBusinessDayIso})</strong>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[11px]">Meta Total:</span>
                  <strong className="text-stone-900 font-bold">
                    {formatVal(activeGoalForUpdate.meta_valor, activeGoalForUpdate.unidade_medida)}
                  </strong>
                </div>
                {activeGoalForUpdate.tipo_periodo !== 'DIARIA' && (
                  <div>
                    <span className="text-stone-500 block text-[11px]">Proporcional Diário:</span>
                    <strong className="text-[#C76B4A] font-bold">
                      {formatVal(
                        Math.round((activeGoalForUpdate.meta_valor / (activeGoalForUpdate.tipo_periodo === 'SEMANAL' ? 5 : 22)) * 100) / 100,
                        activeGoalForUpdate.unidade_medida
                      )} / dia
                    </strong>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Valor Realizado no Dia ({activeGoalForUpdate.unidade_medida}) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={newRealizedValue}
                  onChange={(e) => setNewRealizedValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-stone-300 font-black text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Este valor será somado aos demais dias para compor o total acumulado do período.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 mb-1 block">
                  Observações / Justificativa Operacional (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={realizedNotes}
                  onChange={(e) => setRealizedNotes(e.target.value)}
                  placeholder="Ex: Turno extra realizado, manutenção preventiva concluída..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveGoalForUpdate(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Salvar Apontamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Comments Modal */}
      {activeGoalForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#FCFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#343A40]">
                    {activeGoalForComments.indicador} ({activeGoalForComments.periodo})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Comunicação e alinhamento operacional sobre o atingimento desta meta.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveGoalForComments(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <CommentsThread
                itemTipo="META"
                itemId={activeGoalForComments.id}
                itemTitulo={activeGoalForComments.indicador}
                compact={false}
                showHeader={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
