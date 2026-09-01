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
  Building2,
  Info,
  ChevronRight,
  MessageSquare,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';
import { Meta, GoalPeriodicity } from '../../types/database';
import { CommentsThread } from '../comments/CommentsThread';

export const LeaderGoalsView: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Meta[]>([]);
  const [selectedTab, setSelectedTab] = useState<GoalPeriodicity | 'TODAS'>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGoalForComments, setActiveGoalForComments] = useState<Meta | null>(null);

  const loadGoals = () => {
    if (!user) return;
    const userGoals = dbStore.getGoalsForUser(user.id, user.role, user.unidade_id);
    setGoals(userGoals);
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
      return matchTab && matchSearch;
    });
  }, [goals, selectedTab, searchTerm]);

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
        isReached = g.valor_atual <= g.meta_valor;
        // For smaller is better: if current <= meta, it's 100% or better
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
      isReached = goal.valor_atual <= goal.meta_valor;
      remaining = Math.max(0, goal.valor_atual - goal.meta_valor);
      percent = goal.meta_valor > 0 ? Math.round((goal.meta_valor / Math.max(goal.valor_atual, 0.01)) * 100) : 100;
    } else {
      isReached = goal.valor_atual >= goal.meta_valor;
      remaining = Math.max(0, goal.meta_valor - goal.valor_atual);
      percent = goal.meta_valor > 0 ? Math.round((goal.valor_atual / goal.meta_valor) * 100) : 0;
    }

    // Color logic according to instructions:
    // Verde (atingida), Amarelo/Laranja (próxima >= 80%), Vermelho/Rosa (distante < 80%)
    if (isReached || percent >= 100) {
      return {
        badgeText: 'Meta Atingida',
        statusTier: 'ATINGIDA' as const,
        percent: Math.min(percent, 100),
        rawPercent: percent,
        remainingText: 'Meta superada!',
        remainingVal: 0,
        barColor: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cardBorder: 'border-emerald-200 hover:border-emerald-300',
        textColor: 'text-emerald-700',
      };
    } else if (percent >= 80) {
      return {
        badgeText: 'Próxima da Meta',
        statusTier: 'PROXIMA' as const,
        percent,
        rawPercent: percent,
        remainingText: `Faltam ${formatVal(remaining, goal.unidade_medida)}`,
        remainingVal: remaining,
        barColor: 'bg-[#C76B4A]',
        badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
        cardBorder: 'border-orange-200 hover:border-orange-300',
        textColor: 'text-orange-800',
      };
    } else {
      return {
        badgeText: 'Distante da Meta',
        statusTier: 'DISTANTE' as const,
        percent,
        rawPercent: percent,
        remainingText: `Faltam ${formatVal(remaining, goal.unidade_medida)}`,
        remainingVal: remaining,
        barColor: 'bg-rose-500',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        cardBorder: 'border-rose-200 hover:border-rose-300',
        textColor: 'text-rose-700',
      };
    }
  };

  return (
    <div id="leader-goals-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div id="goals-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C76B4A] uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Desempenho & Metas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Minhas Metas
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Acompanhe o ritmo de entrega das metas da sua unidade, o quanto já realizou e o que falta alcançar.
          </p>
        </div>

        {user?.unidade_nome && (
          <div className="flex items-center gap-2 px-3 py-2 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-700 self-start sm:self-auto">
            <Building2 className="w-4 h-4 text-[#C76B4A]" />
            <span className="font-semibold">{user.unidade_nome}</span>
          </div>
        )}
      </div>

      {/* Visão Consolidada Mensal (Consolidated Monthly Overview at Top) */}
      {monthlyStats && (
        <div
          id="consolidated-monthly-card"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs relative overflow-hidden"
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
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C76B4A] font-bold text-sm">
                {monthlyStats.averageProgress}%
              </div>
            </div>
          </div>

          {/* Quick Indicator Chips as illustrated in specification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {monthlyStats.items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-stone-800 truncate block">
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
                          ? 'bg-orange-100 text-orange-900 border-orange-300'
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
                  ? 'bg-white text-stone-900 shadow-xs'
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

        {/* Search */}
        <div className="relative min-w-[220px]">
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

      {/* Goals Progress Cards Grid */}
      {filteredGoals.length === 0 ? (
        <div
          id="goals-empty-state"
          className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">Nenhuma meta encontrada</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente ajustar sua busca por outros termos.'
              : 'Não há metas cadastradas para esta periodicidade no momento.'}
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
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs relative flex flex-col justify-between ${statusInfo.cardBorder}`}
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

                  {/* Progress Numbers (Onde estou, Quanto falta, Meta) */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200/80 mb-4 text-xs">
                    <div>
                      <span className="text-[11px] text-stone-600 block">Onde estou (Realizado)</span>
                      <strong className="text-sm font-bold text-stone-900">
                        {formatVal(goal.valor_atual, goal.unidade_medida)}
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
                      <span className="text-[11px] text-stone-600 block">Meta Pactuada</span>
                      <strong className="text-sm font-bold text-stone-900">
                        {formatVal(goal.meta_valor, goal.unidade_medida)}
                      </strong>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-600">Progresso</span>
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

                {/* Footer notes & Comments Button */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600 gap-2">
                  <span>
                    {goal.direcao_melhor === 'MENOR_MELHOR'
                      ? 'Critério: Menor índice é melhor'
                      : 'Critério: Maior volume é melhor'}
                  </span>

                  <button
                    onClick={() => setActiveGoalForComments(goal)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition-colors shrink-0 text-xs"
                    title="Alinhamento e Comentários da Meta"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C76B4A]" />
                    <span>Chat & Observações ({dbStore.getComments('META', goal.id).length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Comments Modal */}
      {activeGoalForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#FCFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
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
