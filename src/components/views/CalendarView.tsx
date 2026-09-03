import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarioEvento,
  TarefaOS,
  Relatorio,
  EventType
} from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { useAuth } from '../../context/AuthContext';
import { CalendarItemDetailModal, UnifiedCalendarItem } from '../calendar/CalendarItemDetailModal';
import { TaskExecutionModal } from './TaskExecutionModal';
import { ReportViewerModal } from '../reports/ReportViewerModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  FileText,
  CheckSquare,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  Info,
  CalendarDays,
  Plus,
  MapPin,
  FolderKanban,
  User,
  Filter,
  CheckCheck
} from 'lucide-react';

export type CalendarViewMode = 'DIA' | 'SEMANA' | 'MES';

export const CalendarView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  // Base calendar date (Defaults to 2026-09-01)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('MES');

  // Raw Data from dbStore
  const [manualEvents, setManualEvents] = useState<CalendarioEvento[]>([]);
  const [tasks, setTasks] = useState<TarefaOS[]>([]);
  const [reports, setReports] = useState<Relatorio[]>([]);

  // Legend Visibility Filters
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    TAREFA: true,
    REUNIAO: true,
    RELATORIO: true,
    EVENTO: true,
    PENDENCIA: true,
  });

  // Modals state
  const [selectedCalendarItem, setSelectedCalendarItem] = useState<UnifiedCalendarItem | null>(null);
  const [activeTaskForModal, setActiveTaskForModal] = useState<TarefaOS | null>(null);
  const [activeReportForModal, setActiveReportForModal] = useState<Relatorio | null>(null);

  const loadData = () => {
    if (currentUser) {
      setManualEvents(dbStore.getEventsForUser(currentUser.id, currentUser.role, currentUser.unidade_id));
      setTasks(dbStore.getTasksForUser(currentUser.id, currentUser.role, currentUser.unidade_id));
      setReports(dbStore.getReportsForUser(currentUser));
    } else {
      setManualEvents(dbStore.getEvents());
      setTasks(dbStore.getTasks());
      setReports(dbStore.getReports());
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, [currentUser]);

  // 1. Build unified event list from all categories
  const allUnifiedItems: UnifiedCalendarItem[] = useMemo(() => {
    const list: UnifiedCalendarItem[] = [];

    // A. Tarefas / OS
    tasks.forEach((t) => {
      // Permission check for Leader
      if (!isAdmin && currentUser) {
        const isMyTask =
          t.responsavel_id === currentUser.id ||
          t.unidade_id === currentUser.unidade_id ||
          t.projeto_id === currentUser.unidade_id ||
          t.responsavel_email === currentUser.email;
        if (!isMyTask) return;
      }

      const isPending =
        t.status === 'ATRASADA' ||
        (t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA' && new Date(t.prazo) < new Date('2026-09-01T18:00:00'));

      if (isPending) {
        list.push({
          id: `pend-${t.id}`,
          sourceId: t.id,
          titulo: `⚠️ PENDÊNCIA: ${t.numero_os} - ${t.titulo}`,
          tipo: 'PENDENCIA',
          categoriaCor: '#DC2626', // Red
          data: t.data,
          horario_inicio: t.horario || '08:00',
          unidade_nome: t.unidade || t.projeto,
          lider_nome: t.responsavel_nome,
          descricao: `Tarefa com SLA expirado ou pendência de execução: ${t.descricao}`,
          status: 'ATRASADA',
          sourceType: 'PENDENCIA',
          rawTask: t,
        });
      } else {
        list.push({
          id: `task-${t.id}`,
          sourceId: t.id,
          titulo: `${t.numero_os} • ${t.titulo}`,
          tipo: 'TAREFA',
          categoriaCor: t.categoria_cor || '#355C7D',
          data: t.data,
          horario_inicio: t.horario || '08:00',
          unidade_nome: t.unidade || t.projeto,
          lider_nome: t.responsavel_nome,
          descricao: t.descricao,
          status: t.status,
          sourceType: 'TAREFA',
          rawTask: t,
        });
      }
    });

    // B. Reuniões & Eventos Manuais Cadastrados pelo Admin
    manualEvents.forEach((ev) => {
      // Permission check
      if (!isAdmin && currentUser) {
        let hasAccess = false;
        if (!ev.publico_tipo || ev.publico_tipo === 'TODOS') hasAccess = true;
        if (
          (ev.publico_tipo === 'UNIDADES' || (ev.publico_tipo as any) === 'PROJETOS') &&
          currentUser.unidade_id &&
          (ev.unidades_alvo?.includes(currentUser.unidade_id) || ev.projetos_alvo?.includes(currentUser.unidade_id))
        ) {
          hasAccess = true;
        }
        if (ev.unidade_id === currentUser.unidade_id || ev.projeto_id === currentUser.unidade_id) hasAccess = true;
        if (ev.publico_tipo === 'LIDERES' && ev.lideres_alvo?.includes(currentUser.id)) hasAccess = true;
        if (ev.lider_id === currentUser.id) hasAccess = true;

        if (!hasAccess) return;
      }

      let catCor = ev.cor_custom || '#7C3AED';
      if (!ev.cor_custom) {
        if (ev.tipo === 'REUNIAO') catCor = '#2E7D32';
        else if (ev.tipo === 'COMUNICADO') catCor = '#C76B4A';
        else if (ev.tipo === 'AUDITORIA') catCor = '#355C7D';
      }

      list.push({
        id: `evt-${ev.id}`,
        sourceId: ev.id,
        titulo: ev.titulo,
        tipo: ev.tipo as any,
        categoriaCor: catCor,
        data: ev.data,
        horario_inicio: ev.horario_inicio,
        horario_fim: ev.horario_fim,
        dia_inteiro: ev.dia_inteiro,
        unidade_nome: ev.projeto_nome || ev.unidade_nome,
        lider_nome: ev.lider_nome,
        descricao: ev.descricao,
        local: ev.local,
        link_reuniao: ev.link_reuniao,
        status: ev.status,
        sourceType: 'EVENTO_MANUAL',
        rawEvent: ev,
      });
    });

    // C. Relatórios Publicados
    reports.forEach((rep) => {
      if (!rep.publicado) return;

      // Permission check
      if (!isAdmin && currentUser) {
        let hasAccess = false;
        if (rep.publico_tipo === 'TODOS') hasAccess = true;
        if (
          rep.publico_tipo === 'UNIDADES' &&
          currentUser.unidade_id &&
          (rep.unidades_alvo?.includes(currentUser.unidade_id) || rep.projetos_alvo?.includes(currentUser.unidade_id))
        ) {
          hasAccess = true;
        }
        if (rep.publico_tipo === 'LIDERES' && rep.lideres_alvo?.includes(currentUser.id)) hasAccess = true;

        if (!hasAccess) return;
      }

      list.push({
        id: `rep-${rep.id}`,
        sourceId: rep.id,
        titulo: `📄 Relatório: ${rep.titulo}`,
        tipo: 'RELATORIO',
        categoriaCor: '#D97706',
        data: rep.data_publicacao,
        horario_inicio: '08:00',
        dia_inteiro: true,
        descricao: `Disponibilização de relatório de gestão (${rep.periodo}). ${rep.descricao}`,
        status: 'PUBLICADO',
        sourceType: 'RELATORIO',
        rawReport: rep,
      });
    });

    return list;
  }, [tasks, manualEvents, reports, isAdmin, currentUser]);

  // Filter items by category checkboxes
  const filteredUnifiedItems = useMemo(() => {
    return allUnifiedItems.filter((item) => {
      if (item.tipo === 'TAREFA' && !visibleCategories.TAREFA) return false;
      if (item.tipo === 'REUNIAO' && !visibleCategories.REUNIAO) return false;
      if (item.tipo === 'RELATORIO' && !visibleCategories.RELATORIO) return false;
      if (
        (item.tipo === 'EVENTO' || item.tipo === 'TREINAMENTO' || item.tipo === 'COMUNICADO' || (item.tipo as any) === 'AUDITORIA') &&
        !visibleCategories.EVENTO
      )
        return false;
      if (item.tipo === 'PENDENCIA' && !visibleCategories.PENDENCIA) return false;
      return true;
    });
  }, [allUnifiedItems, visibleCategories]);

  const toggleCategory = (catKey: string) => {
    setVisibleCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const handlePrev = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'DIA') {
      newD.setDate(newD.getDate() - 1);
    } else if (viewMode === 'SEMANA') {
      newD.setDate(newD.getDate() - 7);
    } else {
      newD.setMonth(newD.getMonth() - 1);
    }
    setCurrentDate(newD);
  };

  const handleNext = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'DIA') {
      newD.setDate(newD.getDate() + 1);
    } else if (viewMode === 'SEMANA') {
      newD.setDate(newD.getDate() + 7);
    } else {
      newD.setMonth(newD.getMonth() + 1);
    }
    setCurrentDate(newD);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 1));
  };

  const rangeTitle = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const daysWeek = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    if (viewMode === 'DIA') {
      return `${currentDate.getDate()} de ${months[currentDate.getMonth()]} de ${currentDate.getFullYear()} (${daysWeek[currentDate.getDay()]})`;
    }

    if (viewMode === 'SEMANA') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startMonth = months[startOfWeek.getMonth()];
      const endMonth = months[endOfWeek.getMonth()];

      if (startMonth === endMonth) {
        return `${startOfWeek.getDate()} a ${endOfWeek.getDate()} de ${startMonth} de ${startOfWeek.getFullYear()}`;
      }
      return `${startOfWeek.getDate()} de ${startMonth} a ${endOfWeek.getDate()} de ${endMonth} de ${endOfWeek.getFullYear()}`;
    }

    return `${months[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
  }, [currentDate, viewMode]);

  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        ymd: formatYMD(d),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        ymd: formatYMD(d),
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        ymd: formatYMD(d),
      });
    }

    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(diff);

    const days = [];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        date: d,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        ymd: formatYMD(d),
      });
    }
    return days;
  }, [currentDate]);

  const getItemBadgeStyle = (item: UnifiedCalendarItem) => {
    const color = item.categoriaCor || '#355C7D';
    return {
      bg: 'bg-white border-stone-200 text-stone-900 hover:border-stone-400',
      dot: color,
      icon: item.tipo === 'REUNIAO' ? (
        <Video className="w-3 h-3 text-emerald-600" />
      ) : item.tipo === 'RELATORIO' ? (
        <FileText className="w-3 h-3 text-amber-600" />
      ) : item.tipo === 'PENDENCIA' ? (
        <AlertCircle className="w-3 h-3 text-rose-600" />
      ) : item.tipo === 'TREINAMENTO' ? (
        <BookOpen className="w-3 h-3 text-purple-600" />
      ) : item.tipo === 'TAREFA' ? (
        <CheckSquare className="w-3 h-3 text-[#355C7D]" />
      ) : (
        <CalendarIcon className="w-3 h-3 text-[#C76B4A]" />
      )
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* 1. Header & Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Calendário de Operações & Gestão
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Agenda integrada com Tarefas, Reuniões, Relatórios e Eventos corporativos
          </p>
        </div>

        {/* View Mode Switcher + Today Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToday}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            Hoje
          </button>

          <div className="flex items-center bg-white border border-stone-300 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-stone-100 text-stone-600 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-stone-100 text-stone-600 border-l border-stone-200 transition-colors"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-xs text-stone-800 shadow-2xs hidden sm:block">
            {rangeTitle}
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            {(['MES', 'SEMANA', 'DIA'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {mode === 'MES' ? 'Mês' : mode === 'SEMANA' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Legend / Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
          <Filter className="w-3.5 h-3.5 text-[#C76B4A]" />
          <span>Legenda & Filtro de Categorias:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tarefas */}
          <button
            onClick={() => toggleCategory('TAREFA')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
              visibleCategories.TAREFA
                ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                : 'bg-stone-100 border-stone-200 text-stone-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#355C7D] shrink-0"></span>
            <span>Tarefas / OS</span>
          </button>

          {/* Reuniões */}
          <button
            onClick={() => toggleCategory('REUNIAO')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
              visibleCategories.REUNIAO
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                : 'bg-stone-100 border-stone-200 text-stone-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span>Reuniões</span>
          </button>

          {/* Relatórios */}
          <button
            onClick={() => toggleCategory('RELATORIO')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
              visibleCategories.RELATORIO
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-stone-100 border-stone-200 text-stone-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0"></span>
            <span>Relatórios</span>
          </button>

          {/* Eventos / Treinamentos */}
          <button
            onClick={() => toggleCategory('EVENTO')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
              visibleCategories.EVENTO
                ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                : 'bg-stone-100 border-stone-200 text-stone-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
            <span>Eventos & Treinamentos</span>
          </button>

          {/* Pendências */}
          <button
            onClick={() => toggleCategory('PENDENCIA')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
              visibleCategories.PENDENCIA
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                : 'bg-stone-100 border-stone-200 text-stone-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
            <span>Pendências (Atrasadas)</span>
          </button>
        </div>
      </div>

      {/* 3. Main Calendar Views */}
      {viewMode === 'MES' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-[11px] font-black text-stone-500 uppercase tracking-wider py-3">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Month Matrix Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 auto-rows-fr">
            {monthGridDays.map((dayItem, idx) => {
              const dayItems = filteredUnifiedItems.filter((it) => it.data === dayItem.ymd);
              const isToday = dayItem.ymd === '2026-09-01';

              return (
                <div
                  key={idx}
                  className={`min-h-[115px] sm:min-h-[135px] p-2 flex flex-col justify-between transition-colors ${
                    dayItem.isCurrentMonth ? 'bg-white' : 'bg-stone-50/50 text-stone-400'
                  } ${isToday ? 'ring-2 ring-inset ring-[#C76B4A]/40 bg-[#C76B4A]/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        isToday
                          ? 'bg-[#C76B4A] text-white shadow-2xs'
                          : dayItem.isCurrentMonth
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>

                    {dayItems.length > 0 && (
                      <span className="text-[10px] font-bold text-stone-400 font-mono">
                        {dayItems.length} {dayItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[85px] sm:max-h-[105px] pr-0.5">
                    {dayItems.slice(0, 3).map((item) => {
                      const itemColor = item.categoriaCor || '#355C7D';
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedCalendarItem(item)}
                          style={{
                            borderLeftWidth: '3px',
                            borderLeftColor: itemColor,
                          }}
                          className="w-full text-left px-2 py-1 rounded-md border border-stone-200 bg-stone-50/70 hover:bg-white text-[10px] font-bold flex items-center gap-1.5 truncate transition-all shadow-2xs"
                        >
                          <span
                            style={{ backgroundColor: itemColor }}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                          ></span>
                          <span className="text-[9px] font-mono text-stone-500 shrink-0">
                            {item.dia_inteiro ? 'Dia' : item.horario_inicio}
                          </span>
                          <span className="truncate text-stone-800">{item.titulo}</span>
                        </button>
                      );
                    })}

                    {dayItems.length > 3 && (
                      <button
                        onClick={() => {
                          setCurrentDate(dayItem.date);
                          setViewMode('DIA');
                        }}
                        className="w-full text-center py-0.5 text-[9px] font-bold text-[#C76B4A] hover:underline bg-[#C76B4A]/10 rounded-md"
                      >
                        +{dayItems.length - 3} mais itens
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'SEMANA' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 divide-x divide-stone-200">
            {weekDays.map((wd) => {
              const isToday = wd.ymd === '2026-09-01';
              return (
                <div
                  key={wd.ymd}
                  className={`p-3 text-center ${isToday ? 'bg-[#C76B4A]/10' : ''}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    {wd.dayName}
                  </span>
                  <span
                    className={`inline-block text-base font-black px-2.5 py-0.5 rounded-xl mt-0.5 ${
                      isToday ? 'bg-[#C76B4A] text-white shadow-xs' : 'text-stone-800'
                    }`}
                  >
                    {wd.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-stone-100 min-h-[480px]">
            {weekDays.map((wd) => {
              const dayItems = filteredUnifiedItems.filter((it) => it.data === wd.ymd);
              const isToday = wd.ymd === '2026-09-01';

              return (
                <div
                  key={wd.ymd}
                  className={`p-2 space-y-2 flex flex-col ${isToday ? 'bg-[#C76B4A]/5' : 'bg-white'}`}
                >
                  {dayItems.length === 0 ? (
                    <div className="text-center py-8 text-stone-300 text-[10px]">
                      Sem itens
                    </div>
                  ) : (
                    dayItems.map((item) => {
                      const itemColor = item.categoriaCor || '#355C7D';
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCalendarItem(item)}
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: itemColor,
                          }}
                          className="p-2.5 rounded-2xl border border-stone-200 bg-white text-xs cursor-pointer transition-all hover:shadow-md hover:border-stone-400"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono font-bold text-stone-500">
                              {item.dia_inteiro ? 'Dia Inteiro' : item.horario_inicio}
                            </span>
                            <span
                              style={{ backgroundColor: itemColor }}
                              className="w-2 h-2 rounded-full"
                            ></span>
                          </div>

                          <h4 className="font-bold text-xs line-clamp-2 leading-snug text-stone-900">
                            {item.titulo}
                          </h4>

                          {item.unidade_nome && (
                            <div className="text-[10px] text-stone-500 truncate mt-1.5 flex items-center gap-1">
                              <FolderKanban className="w-2.5 h-2.5 text-[#C76B4A]" />
                              <span>{item.unidade_nome}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'DIA' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs p-6 space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#C76B4A]"></span>
              <h3 className="font-black text-lg text-stone-900 capitalize">
                {rangeTitle}
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-mono font-bold">
              {filteredUnifiedItems.filter((it) => it.data === formatYMD(currentDate)).length} compromissos
            </span>
          </div>

          <div className="space-y-3">
            {filteredUnifiedItems.filter((it) => it.data === formatYMD(currentDate)).length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-stone-300 stroke-1" />
                <p className="font-bold text-sm text-stone-700">Nenhum compromisso agendado para este dia.</p>
                <p className="text-xs text-stone-400 mt-1">
                  Alterne para a visualização de Mês ou navegue pelas datas.
                </p>
              </div>
            ) : (
              filteredUnifiedItems
                .filter((it) => it.data === formatYMD(currentDate))
                .sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))
                .map((item) => {
                  const itemColor = item.categoriaCor || '#355C7D';
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCalendarItem(item)}
                      style={{
                        borderLeftWidth: '5px',
                        borderLeftColor: itemColor,
                      }}
                      className="p-5 rounded-2xl border border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-md hover:border-stone-400"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          style={{ backgroundColor: `${itemColor}15`, color: itemColor }}
                          className="p-3 rounded-2xl border border-black/5 shrink-0"
                        >
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-stone-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              {item.dia_inteiro
                                ? 'Dia Inteiro'
                                : item.horario_fim
                                ? `${item.horario_inicio} às ${item.horario_fim}`
                                : item.horario_inicio}
                            </span>
                            {item.status && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                                {item.status}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-base text-stone-900">
                            {item.titulo}
                          </h4>
                          {item.descricao && (
                            <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                              {item.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {item.local && (
                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            <span>{item.local}</span>
                          </span>
                        )}
                        <span className="px-3.5 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-200">
                          Ver Detalhes
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <CalendarItemDetailModal
        isOpen={Boolean(selectedCalendarItem)}
        onClose={() => setSelectedCalendarItem(null)}
        item={selectedCalendarItem}
        onOpenTask={(task) => {
          setSelectedCalendarItem(null);
          setActiveTaskForModal(task);
        }}
        onOpenReport={(report) => {
          setSelectedCalendarItem(null);
          setActiveReportForModal(report);
        }}
      />

      {/* Task Execution Modal */}
      {activeTaskForModal && (
        <TaskExecutionModal
          isOpen={Boolean(activeTaskForModal)}
          onClose={() => setActiveTaskForModal(null)}
          task={activeTaskForModal}
          onCompleted={() => {
            setActiveTaskForModal(null);
            loadData();
          }}
        />
      )}

      {/* Report Viewer Modal */}
      {activeReportForModal && (
        <ReportViewerModal
          isOpen={Boolean(activeReportForModal)}
          onClose={() => setActiveReportForModal(null)}
          report={activeReportForModal}
          onConfirmed={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
