import React, { useState, useEffect } from 'react';
import {
  CalendarioEvento,
  EventType,
  Projeto,
  UsuarioPerfil,
  TipoEventoConfig
} from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { useAuth } from '../../context/AuthContext';
import { CalendarItemDetailModal, UnifiedCalendarItem } from '../calendar/CalendarItemDetailModal';
import { PeriodFilter, PeriodFilterValue, isDateInPeriod } from '../common/PeriodFilter';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Video,
  BookOpen,
  Info,
  Calendar,
  FolderKanban,
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
  X,
  Palette,
  Sparkles,
  Settings,
  Layers
} from 'lucide-react';

const PRESET_COLORS = [
  { hex: '#2E7D32', label: 'Verde Esmeralda' },
  { hex: '#355C7D', label: 'Azul Petróleo' },
  { hex: '#7C3AED', label: 'Roxo Nobre' },
  { hex: '#C76B4A', label: 'Terracota' },
  { hex: '#4F46E5', label: 'Índigo' },
  { hex: '#E11D48', label: 'Rubi / Rosa' },
  { hex: '#D97706', label: 'Âmbar Dourado' },
  { hex: '#0D9488', label: 'Teal Ciano' },
  { hex: '#334155', label: 'Grafite Escuro' },
];

export const CalendarManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarioEvento[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [leaders, setLeaders] = useState<UsuarioPerfil[]>([]);
  const [calendarTypes, setCalendarTypes] = useState<TipoEventoConfig[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('TODOS');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    mode: 'TODOS',
    year: new Date().getFullYear(),
    month: 0,
  });

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarioEvento | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<UnifiedCalendarItem | null>(null);

  // Type management modal state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#2E7D32');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [typeModalError, setTypeModalError] = useState('');
  const [typeToDelete, setTypeToDelete] = useState<{ id: string; nome: string } | null>(null);

  // Form state
  const [formTitulo, setFormTitulo] = useState('');
  const [formTipo, setFormTipo] = useState<string>('REUNIAO');
  const [formCorCustom, setFormCorCustom] = useState('#2E7D32');
  const [formData, setFormData] = useState('');
  const [formHorarioInicio, setFormHorarioInicio] = useState('09:00');
  const [formHorarioFim, setFormHorarioFim] = useState('10:00');
  const [formDiaInteiro, setFormDiaInteiro] = useState(false);
  const [formPublicoTipo, setFormPublicoTipo] = useState<'TODOS' | 'UNIDADES' | 'LIDERES'>('TODOS');
  const [formProjetosAlvo, setFormProjetosAlvo] = useState<string[]>([]);
  const [formLideresAlvo, setFormLideresAlvo] = useState<string[]>([]);
  const [formLocal, setFormLocal] = useState('');
  const [formLinkReuniao, setFormLinkReuniao] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');

  const loadData = () => {
    if (currentUser) {
      setEvents(dbStore.getEventsForUser(currentUser.id, currentUser.role, currentUser.unidade_id));
    } else {
      setEvents(dbStore.getEvents());
    }
    setProjects(dbStore.getUnits());
    let allLeaders = dbStore.getUsers().filter((u) => u.role === 'LIDER');
    if (currentUser?.role === 'GERENCIA') {
      const managedLeaderIds = dbStore.getManagedLeaderIds(currentUser.id);
      allLeaders = allLeaders.filter((l) => managedLeaderIds.has(l.id));
    }
    setLeaders(allLeaders);
    setCalendarTypes(dbStore.getCalendarTypes());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, [currentUser]);

  const openCreateModal = () => {
    const types = dbStore.getCalendarTypes();
    const defaultType = types[0]?.id || 'REUNIAO';
    const defaultColor = types[0]?.cor || '#2E7D32';

    setEditingEvent(null);
    setFormTitulo('');
    setFormTipo(defaultType);
    setFormCorCustom(defaultColor);
    setFormData(new Date().toISOString().split('T')[0]);
    setFormHorarioInicio('09:00');
    setFormHorarioFim('10:00');
    setFormDiaInteiro(false);
    setFormPublicoTipo('TODOS');
    setFormProjetosAlvo([]);
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
    setFormCorCustom(event.cor_custom || '#2E7D32');
    setFormData(event.data);
    setFormHorarioInicio(event.horario_inicio);
    setFormHorarioFim(event.horario_fim || '');
    setFormDiaInteiro(event.dia_inteiro || false);
    setFormPublicoTipo(event.publico_tipo || (event.unidade_id || event.projeto_id ? 'UNIDADES' : event.lider_id ? 'LIDERES' : 'TODOS'));
    setFormProjetosAlvo(event.projetos_alvo || event.unidades_alvo || (event.projeto_id || event.unidade_id ? [event.projeto_id || event.unidade_id!] : []));
    setFormLideresAlvo(event.lideres_alvo || (event.lider_id ? [event.lider_id] : []));
    setFormLocal(event.local || '');
    setFormLinkReuniao(event.link_reuniao || '');
    setFormDescricao(event.descricao || '');
    setFormErrorMessage('');
    setIsFormModalOpen(true);
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      setTypeModalError('Informe o nome do novo tipo de evento.');
      return;
    }
    try {
      dbStore.createCalendarType({
        nome: newTypeName.trim(),
        cor: newTypeColor,
        descricao: newTypeDesc.trim() || undefined,
      });
      setNewTypeName('');
      setNewTypeDesc('');
      setTypeModalError('');
      loadData();
    } catch (err: any) {
      setTypeModalError(err.message || 'Erro ao criar tipo de evento.');
    }
  };

  const handleDeleteType = (id: string, nome: string) => {
    setTypeModalError('');
    if (calendarTypes.length <= 1) {
      setTypeModalError('Não é possível excluir o único tipo de evento cadastrado. É necessário ter ao menos um tipo de evento ativo no sistema.');
      return;
    }
    setTypeToDelete({ id, nome });
  };

  const handleConfirmDeleteType = () => {
    if (!typeToDelete) return;
    try {
      dbStore.deleteCalendarType(typeToDelete.id);
      setTypeToDelete(null);
      setTypeModalError('');
      loadData();
    } catch (err: any) {
      setTypeModalError(err.message || 'Erro ao excluir tipo de evento.');
    }
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
    if (formPublicoTipo === 'UNIDADES' && formProjetosAlvo.length === 0) {
      setFormErrorMessage('Selecione ao menos um projeto participante.');
      return;
    }
    if (formPublicoTipo === 'LIDERES' && formLideresAlvo.length === 0) {
      setFormErrorMessage('Selecione ao menos um líder convocado.');
      return;
    }

    try {
      let displayProjectName: string | undefined = undefined;
      if (formPublicoTipo === 'UNIDADES') {
        const p = projects.find((pr) => pr.id === formProjetosAlvo[0]);
        displayProjectName = formProjetosAlvo.length > 1 ? `${p?.nome || 'Projetos'} +${formProjetosAlvo.length - 1}` : p?.nome;
      }

      let displayLeaderName: string | undefined = undefined;
      if (formPublicoTipo === 'LIDERES') {
        const l = leaders.find((ld) => ld.id === formLideresAlvo[0]);
        displayLeaderName = formLideresAlvo.length > 1 ? `${l?.nome || 'Líderes'} +${formLideresAlvo.length - 1}` : l?.nome;
      }

      const selectedTypeConfig = calendarTypes.find((t) => t.id === formTipo);

      const eventPayload: Partial<CalendarioEvento> = {
        titulo: formTitulo.trim(),
        tipo: formTipo,
        tipo_custom_nome: selectedTypeConfig ? selectedTypeConfig.nome : undefined,
        cor_custom: formCorCustom || selectedTypeConfig?.cor || '#2E7D32',
        data: formData,
        horario_inicio: formDiaInteiro ? '08:00' : formHorarioInicio,
        horario_fim: formDiaInteiro ? '18:00' : formHorarioFim || undefined,
        dia_inteiro: formDiaInteiro,
        publico_tipo: formPublicoTipo,
        unidades_alvo: formPublicoTipo === 'UNIDADES' ? formProjetosAlvo : undefined,
        projetos_alvo: formPublicoTipo === 'UNIDADES' ? formProjetosAlvo : undefined,
        unidade_id: formPublicoTipo === 'UNIDADES' ? formProjetosAlvo[0] : undefined,
        projeto_id: formPublicoTipo === 'UNIDADES' ? formProjetosAlvo[0] : undefined,
        unidade_nome: displayProjectName,
        projeto_nome: displayProjectName,
        lideres_alvo: formPublicoTipo === 'LIDERES' ? formLideresAlvo : undefined,
        lider_id: formPublicoTipo === 'LIDERES' ? formLideresAlvo[0] : undefined,
        lider_nome: displayLeaderName,
        local: formLocal.trim() || undefined,
        link_reuniao: formLinkReuniao.trim() || undefined,
        descricao: formDescricao.trim() || undefined,
      };

      if (editingEvent) {
        dbStore.updateEvent(editingEvent.id, eventPayload);
      } else {
        dbStore.createEvent({
          ...eventPayload,
          titulo: formTitulo.trim(),
          tipo: formTipo,
          data: formData,
          horario_inicio: formDiaInteiro ? '08:00' : formHorarioInicio,
          status: 'AGENDADO',
          criado_por_id: currentUser?.id,
          criado_por_nome: currentUser?.nome,
        } as any);
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

  const openItemDetail = (event: CalendarioEvento) => {
    const typeConfig = calendarTypes.find((t) => t.id === event.tipo);
    const unified: UnifiedCalendarItem = {
      id: event.id,
      sourceId: event.id,
      titulo: event.titulo,
      tipo: event.tipo as any,
      categoriaCor: event.cor_custom || typeConfig?.cor || '#2E7D32',
      data: event.data,
      horario_inicio: event.horario_inicio,
      horario_fim: event.horario_fim,
      dia_inteiro: event.dia_inteiro,
      unidade_nome: event.unidade_nome || event.projeto_nome,
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

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.descricao && e.descricao.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.local && e.local.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedTypeFilter === 'TODOS' || e.tipo === selectedTypeFilter;

    let matchesProject = true;
    if (selectedProjectFilter !== 'TODAS') {
      matchesProject =
        e.publico_tipo === 'TODOS' ||
        (e.unidades_alvo && e.unidades_alvo.includes(selectedProjectFilter)) ||
        (e.projetos_alvo && e.projetos_alvo.includes(selectedProjectFilter)) ||
        e.unidade_id === selectedProjectFilter ||
        e.projeto_id === selectedProjectFilter;
    }

    const matchesPeriod = isDateInPeriod(e.data, periodFilter);

    return matchesSearch && matchesType && matchesProject && matchesPeriod;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Gestão de Calendário & Eventos
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Agende reuniões, treinamentos, auditorias e comunicados com categorias e cores personalizadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsTypesModalOpen(true)}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition inline-flex items-center gap-2 shrink-0 border border-stone-200"
          >
            <Settings className="w-4 h-4 text-[#C76B4A]" />
            Tipos de Eventos ({calendarTypes.length})
          </button>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Evento no Calendário
          </button>
        </div>
      </div>

      {/* Period Filter (Item 4 & Item 5) */}
      <PeriodFilter
        value={periodFilter}
        onChange={setPeriodFilter}
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, pauta ou local..."
            className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
          >
            <option value="TODOS">Todos os Tipos</option>
            {calendarTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>

          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
          >
            <option value="TODAS">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Card List */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-stone-300 stroke-1" />
            <p className="text-sm font-bold text-stone-700">Nenhum evento encontrado.</p>
            <p className="text-xs text-stone-400 mt-1">
              Clique em "+ Novo Evento no Calendário" para agendar uma atividade.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredEvents.map((event) => {
              const typeConfig = calendarTypes.find((t) => t.id === event.tipo);
              const eventColor = event.cor_custom || typeConfig?.cor || '#2E7D32';
              const typeName = event.tipo_custom_nome || typeConfig?.nome || event.tipo;

              return (
                <div
                  key={event.id}
                  className="p-5 sm:p-6 hover:bg-stone-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      style={{ backgroundColor: `${eventColor}15`, color: eventColor, borderColor: `${eventColor}30` }}
                      className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold border shrink-0"
                    >
                      <span className="text-[10px] uppercase font-bold">
                        {new Date(event.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="text-base font-black leading-none">
                        {event.data.split('-')[2]}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          style={{ backgroundColor: `${eventColor}15`, color: eventColor, borderColor: `${eventColor}30` }}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                        >
                          {typeName}
                        </span>
                        <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                          {event.titulo}
                        </h3>
                      </div>

                      {event.descricao && (
                        <p className="text-xs text-stone-600 line-clamp-1">
                          {event.descricao}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {event.dia_inteiro ? 'Dia Inteiro' : `${event.horario_inicio} ${event.horario_fim ? `às ${event.horario_fim}` : ''}`}
                        </span>

                        {event.local && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            {event.local}
                          </span>
                        )}

                        {event.link_reuniao && (
                          <a
                            href={event.link_reuniao}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[#C76B4A] hover:underline font-semibold"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Link da Reunião
                          </a>
                        )}

                        <span className="flex items-center gap-1 text-stone-500 font-medium">
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                          {event.publico_tipo === 'TODOS'
                            ? 'Todos os Líderes'
                            : event.publico_tipo === 'UNIDADES'
                            ? event.unidade_nome || 'Projetos Vinculados'
                            : event.lider_nome || 'Líder Designado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => openItemDetail(event)}
                      className="p-2 rounded-xl text-stone-500 hover:text-[#C76B4A] hover:bg-stone-100 transition"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                      title="Editar evento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id, event.titulo)}
                      className="p-2 rounded-xl text-stone-500 hover:text-red-600 hover:bg-red-50 transition"
                      title="Excluir evento"
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

      {/* Types Configuration Modal (Item 9) */}
      {isTypesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    Configuração de Tipos de Eventos
                  </h3>
                  <p className="text-xs text-stone-500">
                    Gerencie os tipos e categorias de eventos disponíveis no calendário corporativo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTypesModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Form to Add New Type */}
              <form onSubmit={handleSaveType} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#C76B4A]" />
                  Cadastrar Novo Tipo de Evento
                </h4>

                {typeModalError && (
                  <div className="p-2 bg-red-50 text-red-700 text-xs rounded-xl font-semibold">
                    {typeModalError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Nome do Tipo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: DDS, Workshop, Visita Técnica"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Cor de Destaque
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-mono font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Descrição / Finalidade (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Reuniões diárias de segurança e alinhamento operacional"
                      value={newTypeDesc}
                      onChange={(e) => setNewTypeDesc(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Tipo
                  </button>
                </div>
              </form>

              {/* Delete Confirmation Box */}
              {typeToDelete && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-red-900 dark:text-red-300">
                        Confirmar exclusão do tipo "{typeToDelete.nome}"?
                      </h4>
                      <p className="text-[11px] text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                        Caso existam eventos agendados com este tipo, eles serão mantidos no calendário e reclassificados para a categoria geral/padrão.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTypeToDelete(null)}
                      className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl hover:bg-stone-100 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteType}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      Sim, Excluir Tipo
                    </button>
                  </div>
                </div>
              )}

              {/* Current Types List */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wider">
                  Tipos Configurados Ativos
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {calendarTypes.map((t) => (
                    <div key={t.id} className="p-3 flex items-center justify-between gap-3 hover:bg-stone-50 transition">
                      <div className="flex items-center gap-3">
                        <span
                          style={{ backgroundColor: t.cor }}
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-xs text-stone-900">{t.nome}</p>
                          {t.descricao && (
                            <p className="text-[11px] text-stone-500">{t.descricao}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {t.is_default && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                            Padrão
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteType(t.id, t.nome)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Excluir tipo de evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 flex justify-end bg-stone-50/50">
              <button
                type="button"
                onClick={() => setIsTypesModalOpen(false)}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    {editingEvent ? 'Editar Evento do Calendário' : 'Novo Evento no Calendário'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Cadastre reuniões, auditorias, treinamentos e eventos com cores personalizadas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-semibold">
                  {formErrorMessage}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Alinhamento Semanal de Resultados"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  required
                />
              </div>

              {/* Category Type Selection */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Tipo de Evento *
                </label>
                <select
                  value={formTipo}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFormTipo(selected);
                    const cfg = calendarTypes.find((t) => t.id === selected);
                    if (cfg) setFormCorCustom(cfg.cor);
                  }}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                >
                  {calendarTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Customization */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#C76B4A]" />
                    Cor do Evento no Calendário
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: formCorCustom }}
                      className="w-4 h-4 rounded-full border border-black/10"
                    ></span>
                    <input
                      type="color"
                      value={formCorCustom}
                      onChange={(e) => setFormCorCustom(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {PRESET_COLORS.map((clr) => (
                    <button
                      key={clr.hex}
                      type="button"
                      onClick={() => setFormCorCustom(clr.hex)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1.5 ${
                        formCorCustom.toLowerCase() === clr.hex.toLowerCase()
                          ? 'border-stone-900 bg-white shadow-xs scale-105'
                          : 'border-transparent bg-stone-200/60 hover:bg-stone-200'
                      }`}
                    >
                      <span style={{ backgroundColor: clr.hex }} className="w-2.5 h-2.5 rounded-full"></span>
                      <span className="text-stone-800">{clr.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Times (Item 7: Block past dates) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Data de Realização *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    disabled={formDiaInteiro}
                    value={formHorarioInicio}
                    onChange={(e) => setFormHorarioInicio(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 disabled:opacity-40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Horário de Término
                  </label>
                  <input
                    type="time"
                    disabled={formDiaInteiro}
                    value={formHorarioFim}
                    onChange={(e) => setFormHorarioFim(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 disabled:opacity-40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
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
                <label htmlFor="chkDiaInteiro" className="font-bold text-stone-700">
                  Evento de dia inteiro (sem horário fixo)
                </label>
              </div>

              {/* Target Audience */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Público-Alvo (Quem terá este evento na agenda?) *
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { id: 'TODOS', label: 'Todos os Líderes' },
                    { id: 'UNIDADES', label: 'Projetos Específicos' },
                    { id: 'LIDERES', label: 'Líderes Específicos' },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setFormPublicoTipo(aud.id as any)}
                      className={`p-2 rounded-xl border text-center font-bold text-xs ${
                        formPublicoTipo === aud.id
                          ? 'border-[#C76B4A] bg-orange-50 text-[#C76B4A]'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>

                {formPublicoTipo === 'UNIDADES' && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 max-h-32 overflow-y-auto">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">
                      Selecione os projetos participantes:
                    </span>
                    {projects.map((p) => {
                      const isChecked = formProjetosAlvo.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer text-stone-800">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormProjetosAlvo([...formProjetosAlvo, p.id]);
                              } else {
                                setFormProjetosAlvo(formProjetosAlvo.filter((id) => id !== p.id));
                              }
                            }}
                            className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                          />
                          <span>{p.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {formPublicoTipo === 'LIDERES' && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 max-h-32 overflow-y-auto">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">
                      Selecione os líderes convocados:
                    </span>
                    {leaders.map((l) => {
                      const isChecked = formLideresAlvo.includes(l.id);
                      return (
                        <label key={l.id} className="flex items-center gap-2 cursor-pointer text-stone-800">
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
                          <span>{l.nome} ({l.unidade_nome || 'Líder'})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Location & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Local / Sala Presencial
                  </label>
                  <input
                    type="text"
                    value={formLocal}
                    onChange={(e) => setFormLocal(e.target.value)}
                    placeholder="Ex: Sala de Reunião Matriz"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Link de Videoconferência
                  </label>
                  <input
                    type="url"
                    value={formLinkReuniao}
                    onChange={(e) => setFormLinkReuniao(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  />
                </div>
              </div>

              {/* Description / Agenda */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Pauta / Descrição do Evento
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  rows={3}
                  placeholder="Descreva a pauta, objetivos ou orientações aos participantes..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingEvent ? 'Atualizar Evento' : 'Publicar no Calendário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <CalendarItemDetailModal
        isOpen={Boolean(detailModalItem)}
        onClose={() => setDetailModalItem(null)}
        item={detailModalItem}
      />
    </div>
  );
};

