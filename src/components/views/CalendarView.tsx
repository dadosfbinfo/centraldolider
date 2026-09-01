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
  Building2,
  User,
  Filter,
  CheckCheck
} from 'lucide-react';

export type CalendarViewMode = 'DIA' | 'SEMANA' | 'MES';

export const CalendarView: React.FC = () => {
  const { currentUser } = useAuth();
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
    setManualEvents(dbStore.getEvents());
    setTasks(dbStore.getTasks());
    setReports(dbStore.getReports());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // 1. Build unified event list from all 5 categories
  const allUnifiedItems: UnifiedCalendarItem[] = useMemo(() => {
    const list: UnifiedCalendarItem[] = [];

    // A. Tarefas / OS
    tasks.forEach((t) => {
      // Permission check for Leader
      if (!isAdmin && currentUser) {
        const isMyTask =
          t.responsavel_id === currentUser.id ||
          t.unidade_id === currentUser.unidade_id ||
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
          unidade_nome: t.unidade,
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
          categoriaCor: '#355C7D', // Navy / Blue
          data: t.data,
          horario_inicio: t.horario || '08:00',
          unidade_nome: t.unidade,
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
        if (ev.publico_tipo === 'UNIDADES' && currentUser.unidade_id && ev.unidades_alvo?.includes(currentUser.unidade_id)) hasAccess = true;
        if (ev.publico_tipo === 'UNIDADES' && ev.unidade_id === currentUser.unidade_id) hasAccess = true;
        if (ev.publico_tipo === 'LIDERES' && ev.lideres_alvo?.includes(currentUser.id)) hasAccess = true;
        if (ev.lider_id === currentUser.id) hasAccess = true;

        if (!hasAccess) return;
      }

      let catCor = '#7C3AED'; // Purple for Evento/Treinamento
      if (ev.tipo === 'REUNIAO') catCor = '#2E7D32'; // Emerald for Reunião
      else if (ev.tipo === 'COMUNICADO') catCor = '#7C3AED'; // Violet for Comunicado

      list.push({
        id: `evt-${ev.id}`,
        sourceId: ev.id,
        titulo: ev.titulo,
        tipo: ev.tipo,
        categoriaCor: catCor,
        data: ev.data,
        horario_inicio: ev.horario_inicio,
        horario_fim: ev.horario_fim,
        dia_inteiro: ev.dia_inteiro,
        unidade_nome: ev.unidade_nome,
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
        if (rep.publico_tipo === 'UNIDADES' && currentUser.unidade_id && rep.unidades_alvo?.includes(currentUser.unidade_id)) hasAccess = true;
        if (rep.publico_tipo === 'LIDERES' && rep.lideres_alvo?.includes(currentUser.id)) hasAccess = true;

        if (!hasAccess) return;
      }

      list.push({
        id: `rep-${rep.id}`,
        sourceId: rep.id,
        titulo: `📄 Relatório: ${rep.titulo}`,
        tipo: 'RELATORIO',
        categoriaCor: '#D97706', // Warm Amber
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
        (item.tipo === 'EVENTO' || item.tipo === 'TREINAMENTO' || item.tipo === 'COMUNICADO') &&
        !visibleCategories.EVENTO
      )
        return false;
      if (item.tipo === 'PENDENCIA' && !visibleCategories.PENDENCIA) return false;
      return true;
    });
  }, [allUnifiedItems, visibleCategories]);

  // Toggle category
  const toggleCategory = (catKey: string) => {
    setVisibleCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  // Date Navigation Helpers
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

  // Header range title
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
      // Find start of week (Sunday or Monday)
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const startOfWeek = new Date(currentDate.setDate(diff));
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

  // Format YYYY-MM-DD
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- MONTH VIEW CALCULATIONS ---
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days = [];

    // Starting day of week (0=Dom, 1=Seg, ...)
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false, ymd: formatYMD(d) });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true, ymd: formatYMD(d) });
    }

    // Next month filler days to complete grid (up to 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, ymd: formatYMD(d) });
    }

    return days;
  }, [currentDate]);

  // --- WEEK VIEW DAYS (Seg a Dom) ---
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday start

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.getFullYear(), curr.getMonth(), diff + i);
      days.push({
        date: d,
        ymd: formatYMD(d),
        dayName: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i],
        dayNumber: d.getDate(),
      });
    }
    return days;
  }, [currentDate]);

  // Color & Badge lookup for individual calendar items
  const getItemBadgeStyle = (item: UnifiedCalendarItem) => {
    switch (item.tipo) {
      case 'TAREFA':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
          dot: 'bg-blue-600',
          icon: <CheckSquare className="w-3 h-3 text-blue-600" />,
        };
      case 'REUNIAO':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100',
          dot: 'bg-emerald-600',
          icon: <Video className="w-3 h-3 text-emerald-600" />,
        };
      case 'RELATORIO':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100',
          dot: 'bg-amber-600',
          icon: <FileText className="w-3 h-3 text-amber-600" />,
        };
      case 'TREINAMENTO':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100',
          dot: 'bg-purple-600',
          icon: <BookOpen className="w-3 h-3 text-purple-600" />,
        };
      case 'COMUNICADO':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100',
          dot: 'bg-indigo-600',
          icon: <Info className="w-3 h-3 text-indigo-600" />,
        };
      case 'PENDENCIA':
        return {
          bg: 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100',
          dot: 'bg-red-600',
          icon: <AlertCircle className="w-3 h-3 text-red-600" />,
        };
      default:
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100',
          dot: 'bg-purple-600',
          icon: <CalendarIcon className="w-3 h-3 text-purple-600" />,
        };
    }
  };

  const hoursOfDay = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#343A40] tracking-tight uppercase">
              Calendário de Operações & Gestão
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Agenda alimentada automaticamente com Tarefas/OS, Reuniões, Relatórios, Treinamentos e Pendências.
          </p>
        </div>

        {/* View Mode Switcher + Today Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#343A40] text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            Hoje
          </button>

          {/* Prev / Next Arrows */}
          <div className="flex items-center bg-white border border-gray-300 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-gray-100 text-gray-600 border-l border-gray-200 transition-colors"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Date Range Display */}
          <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-[#343A40] shadow-2xs hidden sm:block">
            {rangeTitle}
          </div>

          {/* View Mode Tabs (Dia / Semana / Mês) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            {(['DIA', 'SEMANA', 'MES'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-white text-[#C76B4A] shadow-xs'
                    : 'text-gray-600 hover:text-[#343A40]'
                }`}
              >
                {mode === 'DIA' ? 'Dia' : mode === 'SEMANA' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Color Legend & Quick Filter */}
      <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5 text-[#C76B4A]" />
          <span>Legenda Interativa:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Tarefas/OS */}
          <button
            onClick={() => toggleCategory('TAREFA')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              visibleCategories.TAREFA
                ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
            <span>Tarefas / OS</span>
          </button>

          {/* Reuniões */}
          <button
            onClick={() => toggleCategory('REUNIAO')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              visibleCategories.REUNIAO
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span>Reuniões</span>
          </button>

          {/* Relatórios */}
          <button
            onClick={() => toggleCategory('RELATORIO')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              visibleCategories.RELATORIO
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0"></span>
            <span>Relatórios</span>
          </button>

          {/* Eventos / Treinamentos */}
          <button
            onClick={() => toggleCategory('EVENTO')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              visibleCategories.EVENTO
                ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
            <span>Eventos & Treinamentos</span>
          </button>

          {/* Pendências */}
          <button
            onClick={() => toggleCategory('PENDENCIA')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              visibleCategories.PENDENCIA
                ? 'bg-red-50 border-red-300 text-red-900 shadow-2xs'
                : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
            <span>Pendências (Atrasadas)</span>
          </button>
        </div>
      </div>

      {/* 3. Main Calendar Body according to ViewMode */}

      {/* --- A. MONTH VIEW (MÊS) --- */}
      {viewMode === 'MES' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-[#FCFAFA] text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider py-2.5">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Month Matrix Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 auto-rows-fr">
            {monthGridDays.map((dayItem, idx) => {
              const dayItems = filteredUnifiedItems.filter((it) => it.data === dayItem.ymd);
              const isToday = dayItem.ymd === '2026-09-01';

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                    dayItem.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50 text-gray-400'
                  } ${isToday ? 'ring-2 ring-inset ring-[#C76B4A]/30 bg-[#C76B4A]/2' : ''}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        isToday
                          ? 'bg-[#C76B4A] text-white shadow-2xs'
                          : dayItem.isCurrentMonth
                          ? 'text-[#343A40]'
                          : 'text-gray-400'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>

                    {dayItems.length > 0 && (
                      <span className="text-[9px] font-bold text-gray-400 font-mono">
                        {dayItems.length} {dayItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </div>

                  {/* Day Events Chips List */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] sm:max-h-[105px] pr-0.5">
                    {dayItems.slice(0, 3).map((item) => {
                      const style = getItemBadgeStyle(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedCalendarItem(item)}
                          className={`w-full text-left px-1.5 py-0.5 rounded border text-[10px] font-semibold flex items-center gap-1 truncate transition-transform hover:scale-[1.02] ${style.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`}></span>
                          <span className="text-[9px] font-mono text-gray-500 shrink-0">
                            {item.dia_inteiro ? 'Dia' : item.horario_inicio}
                          </span>
                          <span className="truncate">{item.titulo}</span>
                        </button>
                      );
                    })}

                    {dayItems.length > 3 && (
                      <button
                        onClick={() => {
                          setCurrentDate(dayItem.date);
                          setViewMode('DIA');
                        }}
                        className="w-full text-center py-0.5 text-[9px] font-bold text-[#C76B4A] hover:underline bg-[#C76B4A]/5 rounded"
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

      {/* --- B. WEEK VIEW (SEMANA) --- */}
      {viewMode === 'SEMANA' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          {/* Week Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-[#FCFAFA] divide-x divide-gray-100">
            {weekDays.map((wd) => {
              const isToday = wd.ymd === '2026-09-01';
              return (
                <div
                  key={wd.ymd}
                  className={`p-3 text-center ${isToday ? 'bg-[#C76B4A]/5' : ''}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    {wd.dayName}
                  </span>
                  <span
                    className={`inline-block text-base font-black px-2 py-0.5 rounded-lg mt-0.5 ${
                      isToday ? 'bg-[#C76B4A] text-white shadow-2xs' : 'text-[#343A40]'
                    }`}
                  >
                    {wd.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Week Columns Grid */}
          <div className="grid grid-cols-7 divide-x divide-gray-100 min-h-[480px]">
            {weekDays.map((wd) => {
              const dayItems = filteredUnifiedItems.filter((it) => it.data === wd.ymd);
              const isToday = wd.ymd === '2026-09-01';

              return (
                <div
                  key={wd.ymd}
                  className={`p-2 space-y-2 flex flex-col ${isToday ? 'bg-[#C76B4A]/2' : 'bg-white'}`}
                >
                  {dayItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-300 text-[10px]">
                      Sem itens
                    </div>
                  ) : (
                    dayItems.map((item) => {
                      const style = getItemBadgeStyle(item);
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCalendarItem(item)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md ${style.bg}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono font-bold text-gray-500">
                              {item.dia_inteiro ? 'Dia Inteiro' : item.horario_inicio}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                          </div>

                          <h4 className="font-bold text-xs line-clamp-2 leading-snug">
                            {item.titulo}
                          </h4>

                          {item.unidade_nome && (
                            <div className="text-[10px] text-gray-500 truncate mt-1 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
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

      {/* --- C. DAY VIEW (DIA) --- */}
      {viewMode === 'DIA' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#C76B4A]"></span>
              <h3 className="font-black text-lg text-[#343A40] capitalize">
                {rangeTitle}
              </h3>
            </div>
            <span className="text-xs text-gray-400 font-mono font-bold">
              {filteredUnifiedItems.filter((it) => it.data === formatYMD(currentDate)).length} compromissos
            </span>
          </div>

          {/* Day Item Cards */}
          <div className="space-y-3">
            {filteredUnifiedItems.filter((it) => it.data === formatYMD(currentDate)).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                <p className="font-bold text-sm">Nenhum compromisso agendado para este dia.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Navegue para os próximos dias ou alterne para a visualização de Mês.
                </p>
              </div>
            ) : (
              filteredUnifiedItems
                .filter((it) => it.data === formatYMD(currentDate))
                .sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))
                .map((item) => {
                  const style = getItemBadgeStyle(item);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCalendarItem(item)}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-md ${style.bg}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white border border-gray-200 shrink-0">
                          {style.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.dia_inteiro
                                ? 'Dia Inteiro'
                                : item.horario_fim
                                ? `${item.horario_inicio} às ${item.horario_fim}`
                                : item.horario_inicio}
                            </span>
                            {item.status && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded bg-white/80 border border-gray-200">
                                {item.status}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-[#343A40]">
                            {item.titulo}
                          </h4>
                          {item.descricao && (
                            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                              {item.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {item.local && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{item.local}</span>
                          </span>
                        )}
                        <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-[#343A40] shadow-2xs hover:bg-gray-50">
                          Ver Detalhes & Chat
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* --- Detail Modal with Integrated Comments --- */}
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

      {/* --- Task Execution Modal when requested from Calendar --- */}
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

      {/* --- Report Viewer Modal when requested from Calendar --- */}
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
