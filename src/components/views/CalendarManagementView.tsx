import React, { useState, useEffect } from 'react';
import {
  CalendarioEvento,
  EventType,
  Unidade,
  UsuarioPerfil
} from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { useAuth } from '../../context/AuthContext';
import { CalendarItemDetailModal, UnifiedCalendarItem } from '../calendar/CalendarItemDetailModal';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Video,
  BookOpen,
  Info,
  Calendar,
  Building2,
  Users,
  Clock,
  MapPin,
  MessageSquare,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Shield,
  Eye,
  X
} from 'lucide-react';

export const CalendarManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarioEvento[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [leaders, setLeaders] = useState<UsuarioPerfil[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('TODOS');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarioEvento | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<UnifiedCalendarItem | null>(null);

  // Form state
  const [formTitulo, setFormTitulo] = useState('');
  const [formTipo, setFormTipo] = useState<EventType>('REUNIAO');
  const [formData, setFormData] = useState('');
  const [formHorarioInicio, setFormHorarioInicio] = useState('09:00');
  const [formHorarioFim, setFormHorarioFim] = useState('10:00');
  const [formDiaInteiro, setFormDiaInteiro] = useState(false);
  const [formPublicoTipo, setFormPublicoTipo] = useState<'TODOS' | 'UNIDADES' | 'LIDERES'>('TODOS');
  const [formUnidadesAlvo, setFormUnidadesAlvo] = useState<string[]>([]);
  const [formLideresAlvo, setFormLideresAlvo] = useState<string[]>([]);
  const [formLocal, setFormLocal] = useState('');
  const [formLinkReuniao, setFormLinkReuniao] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');

  const loadData = () => {
    setEvents(dbStore.getEvents());
    setUnits(dbStore.getUnits());
    setLeaders(dbStore.getUsers().filter((u) => u.role === 'LIDER'));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormTitulo('');
    setFormTipo('REUNIAO');
    setFormData(new Date().toISOString().split('T')[0]);
    setFormHorarioInicio('09:00');
    setFormHorarioFim('10:00');
    setFormDiaInteiro(false);
    setFormPublicoTipo('TODOS');
    setFormUnidadesAlvo([]);
    setFormLideresAlvo([]);
    setFormLocal('Google Meet');
    setFormLinkReuniao('https://meet.google.com/cdl-reuniao');
    setFormDescricao('');
    setFormErrorMessage('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (event: CalendarioEvento) => {
    setEditingEvent(event);
    setFormTitulo(event.titulo);
    setFormTipo(event.tipo);
    setFormData(event.data);
    setFormHorarioInicio(event.horario_inicio);
    setFormHorarioFim(event.horario_fim || '');
    setFormDiaInteiro(event.dia_inteiro || false);
    setFormPublicoTipo(event.publico_tipo || (event.unidade_id ? 'UNIDADES' : event.lider_id ? 'LIDERES' : 'TODOS'));
    setFormUnidadesAlvo(event.unidades_alvo || (event.unidade_id ? [event.unidade_id] : []));
    setFormLideresAlvo(event.lideres_alvo || (event.lider_id ? [event.lider_id] : []));
    setFormLocal(event.local || '');
    setFormLinkReuniao(event.link_reuniao || '');
    setFormDescricao(event.descricao || '');
    setFormErrorMessage('');
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      setFormErrorMessage('Informe o título do evento.');
      return;
    }
    if (!formData) {
      setFormErrorMessage('Selecione a data de realização.');
      return;
    }
    if (!formDiaInteiro && !formHorarioInicio) {
      setFormErrorMessage('Informe o horário de início.');
      return;
    }
    if (formPublicoTipo === 'UNIDADES' && formUnidadesAlvo.length === 0) {
      setFormErrorMessage('Selecione ao menos uma unidade-alvo.');
      return;
    }
    if (formPublicoTipo === 'LIDERES' && formLideresAlvo.length === 0) {
      setFormErrorMessage('Selecione ao menos um líder-alvo.');
      return;
    }

    try {
      // Find unit names or leader names for display
      let displayUnitName: string | undefined = undefined;
      if (formPublicoTipo === 'UNIDADES') {
        const u = units.find((un) => un.id === formUnidadesAlvo[0]);
        displayUnitName = formUnidadesAlvo.length > 1 ? `${u?.nome || 'Unidades'} +${formUnidadesAlvo.length - 1}` : u?.nome;
      }

      let displayLeaderName: string | undefined = undefined;
      if (formPublicoTipo === 'LIDERES') {
        const l = leaders.find((ld) => ld.id === formLideresAlvo[0]);
        displayLeaderName = formLideresAlvo.length > 1 ? `${l?.nome || 'Líderes'} +${formLideresAlvo.length - 1}` : l?.nome;
      }

      if (editingEvent) {
        dbStore.updateEvent(editingEvent.id, {
          titulo: formTitulo.trim(),
          tipo: formTipo,
          data: formData,
          horario_inicio: formDiaInteiro ? '08:00' : formHorarioInicio,
          horario_fim: formDiaInteiro ? '18:00' : formHorarioFim || undefined,
          dia_inteiro: formDiaInteiro,
          publico_tipo: formPublicoTipo,
          unidades_alvo: formPublicoTipo === 'UNIDADES' ? formUnidadesAlvo : undefined,
          unidade_id: formPublicoTipo === 'UNIDADES' ? formUnidadesAlvo[0] : undefined,
          unidade_nome: displayUnitName,
          lideres_alvo: formPublicoTipo === 'LIDERES' ? formLideresAlvo : undefined,
          lider_id: formPublicoTipo === 'LIDERES' ? formLideresAlvo[0] : undefined,
          lider_nome: displayLeaderName,
          local: formLocal.trim() || undefined,
          link_reuniao: formLinkReuniao.trim() || undefined,
          descricao: formDescricao.trim() || undefined,
        });
      } else {
        dbStore.createEvent({
          titulo: formTitulo.trim(),
          tipo: formTipo,
          data: formData,
          horario_inicio: formDiaInteiro ? '08:00' : formHorarioInicio,
          horario_fim: formDiaInteiro ? '18:00' : formHorarioFim || undefined,
          dia_inteiro: formDiaInteiro,
          publico_tipo: formPublicoTipo,
          unidades_alvo: formPublicoTipo === 'UNIDADES' ? formUnidadesAlvo : undefined,
          unidade_id: formPublicoTipo === 'UNIDADES' ? formUnidadesAlvo[0] : undefined,
          unidade_nome: displayUnitName,
          lideres_alvo: formPublicoTipo === 'LIDERES' ? formLideresAlvo : undefined,
          lider_id: formPublicoTipo === 'LIDERES' ? formLideresAlvo[0] : undefined,
          lider_nome: displayLeaderName,
          local: formLocal.trim() || undefined,
          link_reuniao: formLinkReuniao.trim() || undefined,
          descricao: formDescricao.trim() || undefined,
          criado_por_id: currentUser?.id,
          criado_por_nome: currentUser?.nome,
          status: 'AGENDADO',
        });
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      setFormErrorMessage(err.message || 'Erro ao salvar evento.');
    }
  };

  const handleDelete = (id: string, titulo: string) => {
    if (window.confirm(`Deseja realmente excluir "${titulo}" do calendário corporativo?`)) {
      dbStore.deleteEvent(id);
    }
  };

  // Convert to UnifiedCalendarItem for viewing details
  const openItemDetail = (event: CalendarioEvento) => {
    const unified: UnifiedCalendarItem = {
      id: event.id,
      sourceId: event.id,
      titulo: event.titulo,
      tipo: event.tipo,
      categoriaCor:
        event.tipo === 'REUNIAO'
          ? '#2E7D32'
          : event.tipo === 'TREINAMENTO'
          ? '#7C3AED'
          : event.tipo === 'COMUNICADO'
          ? '#C76B4A'
          : '#355C7D',
      data: event.data,
      horario_inicio: event.horario_inicio,
      horario_fim: event.horario_fim,
      dia_inteiro: event.dia_inteiro,
      unidade_nome: event.unidade_nome,
      lider_nome: event.lider_nome,
      descricao: event.descricao,
      local: event.local,
      link_reuniao: event.link_reuniao,
      status: event.status,
      sourceType: 'EVENTO_MANUAL',
      rawEvent: event,
    };
    setDetailModalItem(unified);
  };

  // Filter list
  const filteredEvents = events.filter((ev) => {
    if (selectedTypeFilter !== 'TODOS' && ev.tipo !== selectedTypeFilter) return false;
    if (selectedUnitFilter !== 'TODAS') {
      const matchUnit =
        ev.publico_tipo === 'TODOS' ||
        ev.unidade_id === selectedUnitFilter ||
        ev.unidades_alvo?.includes(selectedUnitFilter);
      if (!matchUnit) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.titulo.toLowerCase().includes(q);
      const matchDesc = (ev.descricao || '').toLowerCase().includes(q);
      const matchLoc = (ev.local || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  // Calculate statistics
  const totalEvents = events.length;
  const countReunioes = events.filter((e) => e.tipo === 'REUNIAO').length;
  const countTreinamentos = events.filter((e) => e.tipo === 'TREINAMENTO').length;
  const countComunicados = events.filter((e) => e.tipo === 'COMUNICADO').length;

  const getTypeStyle = (tipo: EventType) => {
    switch (tipo) {
      case 'REUNIAO':
        return {
          label: 'Reunião',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
          icon: <Video className="w-3.5 h-3.5" />,
        };
      case 'TREINAMENTO':
        return {
          label: 'Treinamento',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-600',
          icon: <BookOpen className="w-3.5 h-3.5" />,
        };
      case 'COMUNICADO':
        return {
          label: 'Comunicado',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-600',
          icon: <Info className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: 'Evento',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
          icon: <Calendar className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#343A40] tracking-tight uppercase">
              Gestão de Calendário Corporativo
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Cadastro centralizado de Reuniões, Treinamentos, Comunicados e Eventos da rede.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Item na Agenda</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Total de Itens Cadastrados
          </span>
          <div className="text-2xl font-black text-[#343A40] mt-1">{totalEvents}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Eventos administrados</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            🟩 Reuniões Agendadas
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{countReunioes}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Alinhamentos e diretorias</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">
            🟪 Treinamentos
          </span>
          <div className="text-2xl font-black text-purple-700 mt-1">{countTreinamentos}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Capacitações de equipe</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
            🟪 Comunicados Ativos
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{countComunicados}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Avisos e inventários</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, local ou descrição..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#343A40] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#343A40] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="REUNIAO">🟩 Reuniões</option>
              <option value="TREINAMENTO">🟪 Treinamentos</option>
              <option value="COMUNICADO">🟪 Comunicados</option>
              <option value="EVENTO">📌 Eventos</option>
            </select>

            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#343A40] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
            >
              <option value="TODAS">Todas as Unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events Table / Card List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300 stroke-1" />
            <p className="text-sm font-semibold">Nenhum evento encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">
              Clique em "+ Novo Item na Agenda" para cadastrar uma reunião ou treinamento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEvents.map((event) => {
              const typeStyle = getTypeStyle(event.tipo);
              const commentsCount = dbStore.getComments('EVENTO', event.id).length;

              return (
                <div
                  key={event.id}
                  className="p-4 sm:p-5 hover:bg-gray-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Type, Title, Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeStyle.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`}></span>
                        {typeStyle.icon}
                        <span>{typeStyle.label}</span>
                      </span>

                      <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>
                          {new Date(event.data + 'T12:00:00').toLocaleDateString('pt-BR')} •{' '}
                          {event.dia_inteiro
                            ? 'Dia Inteiro'
                            : event.horario_fim
                            ? `${event.horario_inicio} - ${event.horario_fim}`
                            : event.horario_inicio}
                        </span>
                      </span>

                      {event.publico_tipo === 'TODOS' ? (
                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Público Geral
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" />
                          {event.unidade_nome || event.lider_nome || 'Segmentado'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-[#343A40] truncate">
                      {event.titulo}
                    </h3>

                    {event.descricao && (
                      <p className="text-xs text-gray-500 line-clamp-1">{event.descricao}</p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-0.5">
                      {event.local && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{event.local}</span>
                        </span>
                      )}
                      {event.link_reuniao && (
                        <a
                          href={event.link_reuniao}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2E7D32] hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <Video className="w-3 h-3" />
                          <span>Link Ativo</span>
                        </a>
                      )}
                      <span className="flex items-center gap-1 text-gray-500 font-medium">
                        <MessageSquare className="w-3 h-3 text-gray-400" />
                        <span>{commentsCount} comentários</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => openItemDetail(event)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#343A40] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Ver Detalhes e Comentários"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes & Chat</span>
                    </button>

                    <button
                      onClick={() => openEditModal(event)}
                      className="p-1.5 text-gray-500 hover:text-[#C76B4A] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar Evento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(event.id, event.titulo)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir Evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Event Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FCFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#343A40]">
                    {editingEvent ? 'Editar Item do Calendário' : 'Novo Item na Agenda Corporativa'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Cadastre eventos, reuniões ou treinamentos para os líderes da rede.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                  {formErrorMessage}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                  Título do Item / Convocação *
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Alinhamento Semanal de Resultados com Diretoria"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A]"
                  required
                />
              </div>

              {/* Category / Type */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'REUNIAO', label: '🟩 Reunião', desc: 'Diretoria & Alinhamento' },
                  { id: 'TREINAMENTO', label: '🟪 Treinamento', desc: 'Capacitação Técnica' },
                  { id: 'COMUNICADO', label: '🟪 Comunicado', desc: 'Aviso & Inventário' },
                  { id: 'EVENTO', label: '📌 Evento Geral', desc: 'Auditorias & Outros' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormTipo(t.id as EventType)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formTipo === t.id
                        ? 'border-[#C76B4A] bg-[#C76B4A]/5 ring-2 ring-[#C76B4A]/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-bold text-xs text-[#343A40] block">{t.label}</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>

              {/* Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Data de Realização *
                  </label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    disabled={formDiaInteiro}
                    value={formHorarioInicio}
                    onChange={(e) => setFormHorarioInicio(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] disabled:opacity-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Horário de Término
                  </label>
                  <input
                    type="time"
                    disabled={formDiaInteiro}
                    value={formHorarioFim}
                    onChange={(e) => setFormHorarioFim(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] disabled:opacity-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkDiaInteiro"
                  checked={formDiaInteiro}
                  onChange={(e) => setFormDiaInteiro(e.target.checked)}
                  className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                />
                <label htmlFor="chkDiaInteiro" className="font-semibold text-gray-700">
                  Evento de dia inteiro (sem horário fixo de início/término)
                </label>
              </div>

              {/* Target Audience */}
              <div>
                <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                  Público-Alvo (Em quais agendas este item deve aparecer?) *
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { id: 'TODOS', label: 'Todos os Líderes' },
                    { id: 'UNIDADES', label: 'Unidades Específicas' },
                    { id: 'LIDERES', label: 'Líderes Específicos' },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setFormPublicoTipo(aud.id as any)}
                      className={`p-2 rounded-lg border text-center font-bold text-[11px] ${
                        formPublicoTipo === aud.id
                          ? 'border-[#355C7D] bg-[#355C7D]/10 text-[#355C7D]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>

                {formPublicoTipo === 'UNIDADES' && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 max-h-32 overflow-y-auto">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">
                      Selecione as unidades participantes:
                    </span>
                    {units.map((u) => {
                      const isChecked = formUnidadesAlvo.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormUnidadesAlvo([...formUnidadesAlvo, u.id]);
                              } else {
                                setFormUnidadesAlvo(formUnidadesAlvo.filter((id) => id !== u.id));
                              }
                            }}
                            className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                          />
                          <span className="text-gray-700">{u.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {formPublicoTipo === 'LIDERES' && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 max-h-32 overflow-y-auto">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">
                      Selecione os líderes convocados:
                    </span>
                    {leaders.map((l) => {
                      const isChecked = formLideresAlvo.includes(l.id);
                      return (
                        <label key={l.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormLideresAlvo([...formLideresAlvo, l.id]);
                              } else {
                                setFormLideresAlvo(formLideresAlvo.filter((id) => id !== l.id));
                              }
                            }}
                            className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                          />
                          <span className="text-gray-700">
                            {l.nome} ({l.unidade_nome || 'Sem Unidade'})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Location & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Local / Sala Presencial
                  </label>
                  <input
                    type="text"
                    value={formLocal}
                    onChange={(e) => setFormLocal(e.target.value)}
                    placeholder="Ex: Sala de Reunião Matriz ou Presencial"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Link da Reunião (Meet / Zoom)
                  </label>
                  <input
                    type="url"
                    value={formLinkReuniao}
                    onChange={(e) => setFormLinkReuniao(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold uppercase tracking-wider text-gray-600 block mb-1">
                  Descrição & Instruções Operacionais
                </label>
                <textarea
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Orientações aos líderes participantes, pauta da reunião ou materiais necessários..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  {editingEvent ? 'Atualizar Evento' : 'Salvar e Publicar na Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail & Comments Modal */}
      <CalendarItemDetailModal
        isOpen={Boolean(detailModalItem)}
        onClose={() => setDetailModalItem(null)}
        item={detailModalItem}
      />
    </div>
  );
};
