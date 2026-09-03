import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Target,
  Users,
  ShieldCheck,
  Calendar,
  Building2,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Play,
  CheckSquare,
  ShieldAlert,
  Printer,
  Plus,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';
import { TarefaOS, Meta, Relatorio, CalendarioEvento } from '../../types/database';
import { TaskExecutionModal } from './TaskExecutionModal';
import { TaskBlockModal } from './TaskBlockModal';
import { TaskPrintModal } from './TaskPrintModal';
import { TaskFormModal } from './TaskFormModal';
import { PeriodFilter, PeriodFilterValue, isDateInPeriod } from '../common/PeriodFilter';

export const DashboardHome: React.FC = () => {
  const { currentUser, setActiveTab } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  const [tasks, setTasks] = useState<TarefaOS[]>([]);
  const [goals, setGoals] = useState<Meta[]>([]);
  const [reports, setReports] = useState<Relatorio[]>([]);
  const [events, setEvents] = useState<CalendarioEvento[]>([]);

  // Period Filter State
  const [period, setPeriod] = useState<PeriodFilterValue>({
    mode: 'TODOS',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Modals state
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [taskToExecute, setTaskToExecute] = useState<TarefaOS | null>(null);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState<TarefaOS | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [taskToPrint, setTaskToPrint] = useState<TarefaOS | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const loadData = () => {
    if (currentUser) {
      setTasks(dbStore.getTasksForUser(currentUser.id, currentUser.role, currentUser.unidade_id));
      setGoals(dbStore.getGoalsForUser(currentUser.id, currentUser.role, currentUser.unidade_id));
      setReports(dbStore.getReportsForUser(currentUser));
      setEvents(dbStore.getEventsForUser(currentUser.id, currentUser.role, currentUser.unidade_id));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [currentUser]);

  // Greeting helper based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Full date formatted in Portuguese
  const getFormattedDate = () => {
    const date = new Date();
    const formatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Period filtered tasks
  const periodTasks = period.mode === 'TODOS'
    ? tasks
    : tasks.filter((t) => isDateInPeriod(t.data, period));

  // Counters for the active period/view
  const todayTasks = period.mode === 'TODOS'
    ? tasks.filter((t) => t.data === todayStr)
    : periodTasks;

  const todayPending = todayTasks.filter((t) => t.status !== 'CONCLUIDA');
  const todayCompleted = todayTasks.filter((t) => t.status === 'CONCLUIDA');
  const overdueTasks = periodTasks.filter((t) => t.status === 'ATRASADA');
  const blockedTasks = periodTasks.filter((t) => t.status === 'BLOQUEADA');

  // SLA calculation
  const totalCompleted = periodTasks.filter((t) => t.status === 'CONCLUIDA').length;
  const totalFinishedOrOverdue = totalCompleted + overdueTasks.length;
  const slaRate = totalFinishedOrOverdue > 0 ? Math.round((totalCompleted / totalFinishedOrOverdue) * 100) : 94;

  const handleOpenExecute = (task: TarefaOS) => {
    setTaskToExecute(task);
    setIsExecModalOpen(true);
  };

  const handleOpenBlock = (task: TarefaOS) => {
    setTaskToBlock(task);
    setIsBlockModalOpen(true);
  };

  const handleOpenPrint = (task: TarefaOS) => {
    setTaskToPrint(task);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Personalized Welcome Banner Cockpit */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#343A40] via-[#355C7D] to-[#C76B4A] rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
              <Calendar className="w-3.5 h-3.5 text-[#C76B4A]" />
              {getFormattedDate()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {currentUser?.nome.split(' ')[0]}!
            </h2>
            <p className="text-sm text-gray-200 max-w-2xl leading-relaxed">
              {isAdmin
                ? 'Painel de controle geral. Centralize ordens de serviço, auditorias operacionais e rastreabilidade de todas as unidades.'
                : `Cockpit operacional da ${currentUser?.unidade_nome || 'sua unidade'}. Você tem ${todayPending.length} tarefa(s) programada(s) para o período.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isAdmin ? (
              <button
                onClick={() => setIsFormModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-[#C76B4A] hover:bg-[#b05c3d] text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nova Ordem de Serviço
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('minhas-tarefas')}
                className="px-5 py-3 rounded-2xl bg-[#C76B4A] hover:bg-[#b05c3d] text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-4 h-4" /> Ver Minhas Tarefas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
          <Calendar className="w-4 h-4 text-[#C76B4A]" />
          <span>Filtro de Período do Cockpit:</span>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* "Seus Números" - Quick Metrics Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C76B4A]" />
            {period.mode === 'TODOS' ? 'Seus Números e Indicadores de Hoje' : 'Indicadores do Período Selecionado'}
          </h3>
          <span className="text-[11px] text-gray-400 font-medium">Atualizado em tempo real</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1: Tarefas de Hoje */}
          <div
            onClick={() => setActiveTab(isAdmin ? 'admin-tarefas' : 'minhas-tarefas')}
            className="stat-card bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#C76B4A] transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Tarefas Hoje
              </span>
              <div className="p-2 rounded-xl bg-[#FAF0E6] text-[#C76B4A]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#343A40]">{todayTasks.length}</span>
              <span className="text-[11px] text-gray-500 ml-1.5 font-medium">OS</span>
            </div>
            <div className="mt-1 text-[11px] text-[#C76B4A] font-semibold">
              {todayPending.length} pendente(s)
            </div>
          </div>

          {/* 2: Concluídas */}
          <div
            onClick={() => setActiveTab(isAdmin ? 'admin-tarefas' : 'minhas-tarefas')}
            className="stat-card bg-white rounded-2xl p-4 border border-gray-200 hover:border-emerald-500 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Concluídas
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-700">{todayCompleted.length}</span>
              <span className="text-[11px] text-gray-500 ml-1.5 font-medium">hoje</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>{totalCompleted} no histórico</span>
            </div>
          </div>

          {/* 3: Atrasadas */}
          <div
            onClick={() => setActiveTab(isAdmin ? 'admin-tarefas' : 'minhas-tarefas')}
            className={`stat-card bg-white rounded-2xl p-4 border transition cursor-pointer shadow-2xs ${
              overdueTasks.length > 0
                ? 'border-red-300 ring-1 ring-red-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Atrasadas
              </span>
              <div className={`p-2 rounded-xl ${overdueTasks.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-black ${overdueTasks.length > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                {overdueTasks.length}
              </span>
              <span className="text-[11px] text-gray-500 ml-1.5 font-medium">fora do prazo</span>
            </div>
            <div className={`mt-1 text-[11px] font-semibold ${overdueTasks.length > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
              {overdueTasks.length > 0 ? 'Atenção requerida!' : 'Tudo em dia'}
            </div>
          </div>

          {/* 4: Bloqueadas */}
          <div
            onClick={() => setActiveTab(isAdmin ? 'admin-tarefas' : 'minhas-tarefas')}
            className="stat-card bg-white rounded-2xl p-4 border border-gray-200 hover:border-amber-400 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Bloqueadas
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-800">{blockedTasks.length}</span>
              <span className="text-[11px] text-gray-500 ml-1.5 font-medium">com entrave</span>
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-semibold">
              {blockedTasks.length > 0 ? 'Aguardando ação' : 'Nenhum bloqueio'}
            </div>
          </div>

          {/* 5: SLA no Prazo */}
          <div className="stat-card bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#355C7D] transition shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                SLA / No Prazo
              </span>
              <div className="p-2 rounded-xl bg-[#ebf3f8] text-[#355C7D]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#355C7D]">{slaRate}%</span>
            </div>
            <div className="mt-1 text-[11px] text-[#355C7D] font-semibold">
              Conformidade total
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Tasks + Operational Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Tarefas Prioritárias */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-[#343A40]">
                {isAdmin ? 'Ordens de Serviço Prioritárias' : 'Suas Tarefas Prioritárias de Hoje'}
              </h3>
              <p className="text-xs text-gray-500">
                Ordens com prazo imediato requerendo validação e envio de evidências
              </p>
            </div>
            <button
              onClick={() => setActiveTab(isAdmin ? 'admin-tarefas' : 'minhas-tarefas')}
              className="text-xs font-bold text-[#C76B4A] hover:underline flex items-center gap-1"
            >
              Ver todas ({tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Nenhuma tarefa cadastrada no momento.
              </div>
            ) : (
              tasks.slice(0, 4).map((task) => {
                const isDone = task.status === 'CONCLUIDA';
                const isOverdue = task.status === 'ATRASADA';
                const isBlocked = task.status === 'BLOQUEADA';

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-gray-50/80 border-gray-200 opacity-80'
                        : isOverdue
                        ? 'bg-red-50/30 border-red-200'
                        : 'bg-white border-gray-200 hover:border-[#C76B4A]/50 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#355C7D] bg-gray-100 px-2 py-0.5 rounded-md">
                          {task.numero_os}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: task.categoria_cor || '#C76B4A' }}
                        >
                          {task.categoria_nome}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            task.prioridade === 'CRITICA'
                              ? 'bg-red-100 text-red-700'
                              : task.prioridade === 'ALTA'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.prioridade}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-red-500 text-white'
                              : isBlocked
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-gray-500' : 'text-[#343A40]'}`}>
                        {task.titulo}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                        <span>🏢 {task.unidade}</span>
                        <span>👤 {task.responsavel_nome}</span>
                        {task.prazo && (
                          <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                            ⏱️ Prazo: {task.prazo.replace('T', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => handleOpenPrint(task)}
                        title="Imprimir / PDF"
                        className="p-2 text-gray-400 hover:text-[#C76B4A] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenExecute(task)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                          isDone
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-[#C76B4A] hover:bg-[#b05c3d] text-white shadow-xs'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Ver Evidências
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            Executar OS
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 4 Cols: Operational Overview & Quick Access */}
        <div className="lg:col-span-4 space-y-4">
          {/* Rastreabilidade Card */}
          <div className="bg-gradient-to-br from-[#355C7D] to-[#343A40] rounded-3xl p-6 text-white shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 text-[#C76B4A]">
                <Activity className="w-5 h-5 text-[#C76B4A]" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Rastreabilidade Operacional</h4>
                <p className="text-[11px] text-gray-300">Auditoria ponta a ponta</p>
              </div>
            </div>

            <p className="text-xs text-gray-200 leading-relaxed">
              O sistema registra auditoria completa de cada ciclo de tarefa:
            </p>

            <ul className="space-y-2.5 text-xs text-gray-200">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C76B4A] mt-1.5 shrink-0"></span>
                <span><strong>Quem recebeu:</strong> Vinculação por usuário e unidade</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B7DBE] mt-1.5 shrink-0"></span>
                <span><strong>Quem executou:</strong> Assinatura de conclusão</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B6B4A] mt-1.5 shrink-0"></span>
                <span><strong>Tempo levado:</strong> SLA em minutos e tolerância</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B85C7A] mt-1.5 shrink-0"></span>
                <span><strong>Evidências:</strong> Fotos, medições e checklists</span>
              </li>
            </ul>
          </div>

          {/* Metas Preview Box */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#343A40] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#C76B4A]" />
                Metas em Destaque
              </h4>
              <button
                onClick={() => setActiveTab(isAdmin ? 'admin-metas' : 'minhas-metas')}
                className="text-[11px] font-bold text-[#C76B4A] hover:underline flex items-center gap-0.5"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-2 text-center italic">
                  Nenhuma meta vinculada para sua unidade.
                </p>
              ) : (
                goals.slice(0, 3).map((g) => {
                  const isSmaller = g.direcao_melhor === 'MENOR_MELHOR';
                  const isReached = isSmaller ? g.valor_atual <= g.meta_valor : g.valor_atual >= g.meta_valor;
                  const percent = isSmaller
                    ? Math.round((g.meta_valor / Math.max(g.valor_atual, 0.01)) * 100)
                    : Math.round((g.valor_atual / Math.max(g.meta_valor, 1)) * 100);

                  return (
                    <div key={g.id} className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                      <div className="flex items-center justify-between font-bold text-stone-800">
                        <span className="truncate max-w-[170px]">{g.indicador}</span>
                        <span className={isReached ? 'text-emerald-600' : 'text-[#C76B4A]'}>
                          {g.valor_atual} / {g.meta_valor} {g.unidade_medida}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${
                            isReached ? 'bg-emerald-500' : percent >= 80 ? 'bg-[#C76B4A]' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Reports Preview Box */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#343A40] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#5B7DBE]" />
                Relatórios Recentes
              </h4>
              <button
                onClick={() => setActiveTab(isAdmin ? 'admin-relatorios' : 'relatorios')}
                className="text-[11px] font-bold text-[#5B7DBE] hover:underline flex items-center gap-0.5"
              >
                Biblioteca <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {reports.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-2 text-center italic">
                  Nenhum relatório disponível para sua unidade.
                </p>
              ) : (
                reports.slice(0, 2).map((rep) => {
                  const isConfirmed = currentUser
                    ? rep.confirmacoes_leitura?.some((c) => c.usuario_id === currentUser.id)
                    : false;

                  return (
                    <div
                      key={rep.id}
                      onClick={() => setActiveTab(isAdmin ? 'admin-relatorios' : 'relatorios')}
                      className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-100 text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 truncate max-w-[190px]">
                          {rep.titulo}
                        </span>
                        {isConfirmed ? (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Lido
                          </span>
                        ) : (
                          <span className="text-[10px] text-orange-800 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            Pendente
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                        <span>{rep.periodo}</span>
                        <span>{rep.arquivo_pdf_tamanho}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Next Events Box */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#343A40] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#5B7DBE]" />
                Próximos Compromissos
              </h4>
              <button
                onClick={() => setActiveTab('calendario')}
                className="text-[11px] font-bold text-[#5B7DBE] hover:underline"
              >
                Ver calendário
              </button>
            </div>

            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-2 text-center italic">
                  Nenhum compromisso agendado para sua unidade.
                </p>
              ) : (
                events.slice(0, 2).map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <span className="font-bold text-[#343A40] block">{evt.titulo}</span>
                    <div className="flex items-center gap-2 text-gray-500 mt-1 text-[11px]">
                      <span>📅 {new Date(evt.data).toLocaleDateString('pt-BR')}</span>
                      <span>⏰ {evt.horario_inicio}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals on Dashboard */}
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

      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
      />
    </div>
  );
};
