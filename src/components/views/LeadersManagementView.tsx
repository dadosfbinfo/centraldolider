import React, { useState, useEffect } from 'react';
import { Lider, Projeto, TarefaOS, LeaderStatus, UsuarioPerfil } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import {
  Briefcase,
  FolderKanban,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PeriodFilter, PeriodFilterValue, isDateInPeriod } from '../common/PeriodFilter';
import { Pagination } from '../common/Pagination';

export const LeadersManagementView: React.FC = () => {
  const { setActiveTab } = useAuth();
  const [leaders, setLeaders] = useState<Lider[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [tasks, setTasks] = useState<TarefaOS[]>([]);
  const [users, setUsers] = useState<UsuarioPerfil[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Period Filter State
  const [period, setPeriod] = useState<PeriodFilterValue>({
    mode: 'TODOS',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Leader Form Modal State
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Lider | null>(null);
  const [formData, setFormData] = useState({
    usuario_id: '',
    nome: '',
    email: '',
    cargo: '',
    projetos_ids: [] as string[],
    gestores_imediatos_ids: [] as string[],
    status: 'ATIVO' as LeaderStatus,
    telefone: '',
  });

  // Delete Confirmation Modal State
  const [deleteConfirmLeader, setDeleteConfirmLeader] = useState<Lider | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = () => {
    setLeaders(dbStore.getLeaders());
    setProjects(dbStore.getUnits());
    setTasks(dbStore.getTasks());
    setUsers(dbStore.getUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = dbStore.subscribe(loadData);
    return () => unsub();
  }, []);

  const gerenciaUsers = users.filter((u) => u.role === 'GERENCIA');

  const handleOpenEditModal = (leader: Lider) => {
    setEditingLeader(leader);
    
    // Fallback logic for projects
    let initialProjectIds = leader.projetos_ids && leader.projetos_ids.length > 0
      ? leader.projetos_ids
      : leader.unidade_id
      ? [leader.unidade_id]
      : (leader as any).projeto_id
      ? [(leader as any).projeto_id]
      : [];

    // Fallback logic for gestores
    let initialGestorIds = leader.gestores_imediatos_ids && leader.gestores_imediatos_ids.length > 0
      ? leader.gestores_imediatos_ids
      : [];

    setFormData({
      usuario_id: leader.usuario_id || '',
      nome: leader.nome,
      email: leader.email,
      cargo: leader.cargo || '',
      projetos_ids: initialProjectIds,
      gestores_imediatos_ids: initialGestorIds,
      status: leader.status || 'ATIVO',
      telefone: leader.telefone || '',
    });
    setLeaderModalOpen(true);
  };

  const handleToggleProject = (projId: string) => {
    setFormData((prev) => {
      const exists = prev.projetos_ids.includes(projId);
      const updated = exists
        ? prev.projetos_ids.filter((id) => id !== projId)
        : [...prev.projetos_ids, projId];
      return { ...prev, projetos_ids: updated };
    });
  };

  const handleToggleGestor = (gestorUserId: string) => {
    setFormData((prev) => {
      const exists = prev.gestores_imediatos_ids.includes(gestorUserId);
      const updated = exists
        ? prev.gestores_imediatos_ids.filter((id) => id !== gestorUserId)
        : [...prev.gestores_imediatos_ids, gestorUserId];
      return { ...prev, gestores_imediatos_ids: updated };
    });
  };

  const handleSaveLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.email.trim()) {
      alert('Por favor, informe o nome e o e-mail do líder.');
      return;
    }

    if (!editingLeader) {
      alert('Para cadastrar novos líderes, utilize a aba de Usuários.');
      setLeaderModalOpen(false);
      return;
    }

    const selectedProjectsObjs = projects.filter((p) => formData.projetos_ids.includes(p.id));
    const selectedProjectsNames = selectedProjectsObjs.map((p) => p.nome);
    const primaryProjectObj = selectedProjectsObjs[0];
    const primaryProjectName = primaryProjectObj ? primaryProjectObj.nome : 'Sem projeto vinculado';
    const primaryProjectId = primaryProjectObj ? primaryProjectObj.id : undefined;

    const selectedGestoresObjs = gerenciaUsers.filter((u) => formData.gestores_imediatos_ids.includes(u.id));
    const selectedGestoresNames = selectedGestoresObjs.map((u) => u.nome);
    const gestoresString = selectedGestoresNames.length > 0 ? selectedGestoresNames.join(', ') : 'Diretoria de Operações';

    const leaderPayload = {
      nome: formData.nome.trim(),
      email: formData.email.trim().toLowerCase(),
      cargo: formData.cargo.trim(),
      unidade: primaryProjectName,
      unidade_id: primaryProjectId,
      projeto: primaryProjectName,
      projeto_id: primaryProjectId,
      projetos_ids: formData.projetos_ids,
      projetos_nomes: selectedProjectsNames,
      gestor: gestoresString,
      gestores_imediatos_ids: formData.gestores_imediatos_ids,
      gestores_imediatos_nomes: selectedGestoresNames,
      status: formData.status,
      telefone: formData.telefone.trim(),
    };

    dbStore.updateLeader(editingLeader.id, leaderPayload);
    if (editingLeader.usuario_id) {
      dbStore.updateUserProfile(editingLeader.usuario_id, {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        cargo: formData.cargo.trim(),
        unidade_id: primaryProjectId,
        unidade_nome: primaryProjectName,
      });
    }
    setActionMessage(`Líder ${formData.nome} atualizado com sucesso.`);

    setLeaderModalOpen(false);
    setTimeout(() => setActionMessage(null), 4000);
    loadData();
  };

  const handleDeleteLeader = () => {
    if (!deleteConfirmLeader) return;
    dbStore.deleteLeader(deleteConfirmLeader.id);
    setActionMessage(`Líder ${deleteConfirmLeader.nome} removido.`);
    setDeleteConfirmLeader(null);
    setTimeout(() => setActionMessage(null), 4000);
    loadData();
  };

  const filteredLeaders = leaders.filter((l) => {
    const matchesSearch =
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.cargo && l.cargo.toLowerCase().includes(search.toLowerCase())) ||
      (l.unidade && l.unidade.toLowerCase().includes(search.toLowerCase()));

    const matchesProject = !selectedProject || l.unidade_id === selectedProject || (l as any).projeto_id === selectedProject;
    const matchesStatus = !selectedStatus || l.status === selectedStatus;
    return matchesSearch && matchesProject && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedProject, selectedStatus]);

  const paginatedLeaders = filteredLeaders.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#355C7D]/10 text-[#355C7D] text-xs font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Módulo Administrativo
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#343A40] tracking-tight">
            Gestão de Líderes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Cadastro de gestores operacionais, vínculo de projeto, acompanhamento de OS e execução
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('admin-projetos')}
            className="px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#343A40] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-[#C76B4A]" />
            Projetos ({projects.length})
          </button>

          <button
            onClick={() => setActiveTab('admin-usuarios')}
            className="px-3.5 py-2.5 bg-[#C76B4A]/10 hover:bg-[#C76B4A]/20 text-[#C76B4A] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-[#C76B4A]/20"
            title="O cadastro de novos líderes é realizado centralizadamente no módulo de Usuários"
          >
            <UserPlus className="w-4 h-4" />
            Novo Líder em Usuários
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Period Filter Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
          <Calendar className="w-4 h-4 text-[#C76B4A]" />
          <span>Filtro de Período das Atividades dos Líderes:</span>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar líder por nome, cargo, e-mail ou projeto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
          />
        </div>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full sm:w-56 px-3 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
        >
          <option value="">Todos os Projetos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full sm:w-40 px-3 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
        >
          <option value="">Todos os Status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
          <option value="AFASTADO">Afastados</option>
        </select>
      </div>

      {/* Leaders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLeaders.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-gray-200 text-gray-400 text-xs">
            Nenhum líder encontrado para os filtros selecionados.
          </div>
        ) : (
          paginatedLeaders.map((leader) => {
            const leaderTasks = tasks
              .filter((t) => t.responsavel_id === leader.usuario_id || (leader.email && t.responsavel_email?.toLowerCase() === leader.email.toLowerCase()))
              .filter((t) => isDateInPeriod(t.data, period));
            const pending = leaderTasks.filter((t) => t.status !== 'CONCLUIDA');
            const completed = leaderTasks.filter((t) => t.status === 'CONCLUIDA');
            const overdue = leaderTasks.filter((t) => t.status === 'ATRASADA');

            return (
              <div
                key={leader.id}
                className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 transition-all shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Leader Top info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#355C7D] to-[#C76B4A] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {leader.nome
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#343A40] truncate">{leader.nome}</h3>
                        <p className="text-xs text-[#8B6B4A] font-semibold truncate">{leader.cargo || 'Líder Operacional'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                          leader.status === 'ATIVO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : leader.status === 'AFASTADO'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        {leader.status || 'ATIVO'}
                      </span>
                    </div>
                  </div>

                  {/* Project & Manager Badge */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE3DC] space-y-2 text-xs">
                    <div className="flex items-start gap-2 font-semibold text-gray-800">
                      <FolderKanban className="w-4 h-4 text-[#C76B4A] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Projetos:</span>
                        <span className="truncate block font-bold text-stone-800">
                          {leader.projetos_nomes && leader.projetos_nomes.length > 0
                            ? leader.projetos_nomes.join(', ')
                            : leader.unidade || (leader as any).projeto || 'Sem projeto vinculado'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between text-[11px] text-gray-600 pt-1.5 border-t border-[#EBE3DC]/60">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Gestor(es) Imediato(s):</span>
                        <span className="font-semibold text-stone-800">
                          {leader.gestores_imediatos_nomes && leader.gestores_imediatos_nomes.length > 0
                            ? leader.gestores_imediatos_nomes.join(', ')
                            : leader.gestor || 'Operações'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{leader.email}</span>
                    </div>
                    {leader.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{leader.telefone}</span>
                      </div>
                    )}
                  </div>

                  {/* OS Activity Metrics */}
                  <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Pendentes</span>
                      <span className="font-bold text-[#343A40] text-sm">{pending.length}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-600 text-[10px] uppercase font-bold block">Concluídas</span>
                      <span className="font-bold text-emerald-700 text-sm">{completed.length}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${overdue.length > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                      <span className="text-[10px] uppercase font-bold block text-gray-400">Atrasadas</span>
                      <span className={`font-bold text-sm ${overdue.length > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {overdue.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenEditModal(leader)}
                      className="py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-gray-200"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirmLeader(leader)}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab('admin-tarefas')}
                    className="w-full py-2 bg-gray-100 hover:bg-[#C76B4A] hover:text-white text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    Ver Ordens de Serviço do Líder
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredLeaders.length}
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Leader Create / Edit Modal */}
      {leaderModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#355C7D]/10 text-[#355C7D]">
                  <Briefcase className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#343A40]">
                    Editar Perfil de Líder
                  </h3>
                  <p className="text-xs text-gray-500">
                    Defina projetos vinculados, gestor imediato (Gerência) e dados operacionais
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLeaderModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeader} className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Projetos Vinculados (Multi-seleção)
                  </label>
                  <div className="border border-gray-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-gray-50/50">
                    {projects.length === 0 ? (
                      <span className="text-xs text-gray-400">Nenhum projeto cadastrado</span>
                    ) : (
                      projects.map((p) => {
                        const isChecked = formData.projetos_ids.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer transition ${
                              isChecked ? 'bg-[#355C7D]/10 text-[#355C7D] font-semibold' : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProject(p.id)}
                              className="rounded border-gray-300 text-[#355C7D] focus:ring-0"
                            />
                            <span>{p.nome}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Gestor(es) Imediato(s) (Multi-seleção - Apenas perfil GERÊNCIA)
                </label>
                <div className="border border-gray-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-gray-50/50">
                  {gerenciaUsers.length === 0 ? (
                    <span className="text-xs text-amber-600 font-medium">Nenhum usuário com perfil GERÊNCIA cadastrado.</span>
                  ) : (
                    gerenciaUsers.map((u) => {
                      const isChecked = formData.gestores_imediatos_ids.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer transition ${
                            isChecked ? 'bg-[#C76B4A]/10 text-[#C76B4A] font-semibold' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleGestor(u.id)}
                            className="rounded border-gray-300 text-[#C76B4A] focus:ring-0"
                          />
                          <span>{u.nome} ({u.email})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone (Opcional)</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status do Líder</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LeaderStatus })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="AFASTADO">Afastado (Férias/Licença)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setLeaderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#C76B4A] text-white hover:bg-[#b05838] rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Salvar Líder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmLeader && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="p-2.5 rounded-2xl bg-red-50">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-[#343A40]">Excluir Perfil de Líder</h3>
                <p className="text-xs text-gray-500">Confirmação de segurança</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Tem certeza que deseja remover o cadastro do líder <strong>{deleteConfirmLeader.nome}</strong>? O histórico de OS atribuídas permanecerá registrado no sistema.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmLeader(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteLeader}
                className="px-4 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
