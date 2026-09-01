import React, { useState, useEffect } from 'react';
import { Lider, Unidade, TarefaOS, LeaderStatus, UsuarioPerfil } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { UnitsManagementModal } from './UnitsManagementModal';
import {
  Briefcase,
  Building2,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LeadersManagementView: React.FC = () => {
  const { setActiveTab } = useAuth();
  const [leaders, setLeaders] = useState<Lider[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [tasks, setTasks] = useState<TarefaOS[]>([]);
  const [users, setUsers] = useState<UsuarioPerfil[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);

  // Leader Form Modal State
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Lider | null>(null);
  const [formData, setFormData] = useState({
    usuario_id: '',
    nome: '',
    email: '',
    matricula: '',
    cargo: '',
    unidade_id: '',
    regional: '',
    gestor: '',
    status: 'ATIVO' as LeaderStatus,
    telefone: '',
  });

  // Delete Confirmation Modal State
  const [deleteConfirmLeader, setDeleteConfirmLeader] = useState<Lider | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = () => {
    setLeaders(dbStore.getLeaders());
    setUnits(dbStore.getUnits());
    setTasks(dbStore.getTasks());
    setUsers(dbStore.getUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = dbStore.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingLeader(null);
    setFormData({
      usuario_id: '',
      nome: '',
      email: '',
      matricula: 'LID-' + Math.floor(1000 + Math.random() * 9000),
      cargo: 'Líder Operacional de Unidade',
      unidade_id: units[0]?.id || '',
      regional: 'Regional Sudeste',
      gestor: 'Diretoria de Operações',
      status: 'ATIVO',
      telefone: '',
    });
    setLeaderModalOpen(true);
  };

  const handleOpenEditModal = (leader: Lider) => {
    setEditingLeader(leader);
    setFormData({
      usuario_id: leader.usuario_id || '',
      nome: leader.nome,
      email: leader.email,
      matricula: leader.matricula || '',
      cargo: leader.cargo || '',
      unidade_id: leader.unidade_id || '',
      regional: leader.regional || '',
      gestor: leader.gestor || '',
      status: leader.status || 'ATIVO',
      telefone: leader.telefone || '',
    });
    setLeaderModalOpen(true);
  };

  const handleUserSelectChange = (userId: string) => {
    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser) {
      setFormData((prev) => ({
        ...prev,
        usuario_id: selectedUser.id,
        nome: selectedUser.nome,
        email: selectedUser.email,
        telefone: selectedUser.telefone || prev.telefone,
        unidade_id: selectedUser.unidade_id || prev.unidade_id,
        cargo: selectedUser.cargo || prev.cargo,
      }));
    } else {
      setFormData((prev) => ({ ...prev, usuario_id: '' }));
    }
  };

  const handleSaveLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.email.trim()) {
      alert('Por favor, informe o nome e o e-mail do líder.');
      return;
    }

    const unitObj = units.find((u) => u.id === formData.unidade_id);
    const unitName = unitObj ? unitObj.nome : 'Sem unidade fixa';

    if (editingLeader) {
      dbStore.updateLeader(editingLeader.id, {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        matricula: formData.matricula.trim(),
        cargo: formData.cargo.trim(),
        unidade: unitName,
        unidade_id: formData.unidade_id,
        regional: formData.regional.trim(),
        gestor: formData.gestor.trim(),
        status: formData.status,
        telefone: formData.telefone.trim(),
      });
      setActionMessage(`Líder ${formData.nome} atualizado com sucesso.`);
    } else {
      dbStore.createLeader({
        usuario_id: formData.usuario_id || 'usr-' + Date.now().toString(36),
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        matricula: formData.matricula.trim(),
        cargo: formData.cargo.trim(),
        unidade: unitName,
        unidade_id: formData.unidade_id,
        regional: formData.regional.trim(),
        gestor: formData.gestor.trim(),
        status: formData.status,
        telefone: formData.telefone.trim(),
      });
      setActionMessage(`Líder ${formData.nome} cadastrado com sucesso.`);
    }

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
      (l.matricula && l.matricula.toLowerCase().includes(search.toLowerCase())) ||
      (l.cargo && l.cargo.toLowerCase().includes(search.toLowerCase())) ||
      (l.unidade && l.unidade.toLowerCase().includes(search.toLowerCase()));

    const matchesUnit = !selectedUnit || l.unidade_id === selectedUnit;
    const matchesStatus = !selectedStatus || l.status === selectedStatus;
    return matchesSearch && matchesUnit && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#355C7D]/10 text-[#355C7D] text-xs font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Módulo Administrativo
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#343A40] tracking-tight">
            Gestão de Líderes Operacionais & Unidades
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cadastro de gestores de unidades, matrícula, regional, acompanhamento de OS e conformidade
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setUnitsModalOpen(true)}
            className="px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#343A40] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Building2 className="w-4 h-4 text-[#C76B4A]" />
            Unidades ({units.length})
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Novo Líder
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula, cargo, e-mail ou unidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
          />
        </div>

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="w-full sm:w-56 px-3 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
        >
          <option value="">Todas as Unidades</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome} ({u.codigo})
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
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-400 text-xs">
            Nenhum líder encontrado para os filtros selecionados.
          </div>
        ) : (
          filteredLeaders.map((leader) => {
            const leaderTasks = tasks.filter((t) => t.responsavel_id === leader.usuario_id);
            const pending = leaderTasks.filter((t) => t.status !== 'CONCLUIDA');
            const completed = leaderTasks.filter((t) => t.status === 'CONCLUIDA');
            const overdue = leaderTasks.filter((t) => t.status === 'ATRASADA');

            return (
              <div
                key={leader.id}
                className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 transition-all shadow-xs space-y-4 flex flex-col justify-between"
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
                        <span className="text-[10px] text-gray-400 font-mono">Matrícula: {leader.matricula || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
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

                  {/* Unit & Regional Badge */}
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE3DC] space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-gray-800">
                      <Building2 className="w-3.5 h-3.5 text-[#C76B4A] shrink-0" />
                      <span className="truncate">{leader.unidade || 'Sem unidade vinculada'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-[#EBE3DC]/60">
                      <span>Regional: <strong>{leader.regional || 'Geral'}</strong></span>
                      <span>Gestor: <strong>{leader.gestor || 'Operações'}</strong></span>
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
                    {editingLeader ? 'Editar Perfil de Líder' : 'Novo Líder Operacional'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Defina lotação, matrícula, gestor e vínculo de unidade
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
              {/* Optional Link to Existing User */}
              {!editingLeader && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Vincular a Usuário Existente (Opcional)
                  </label>
                  <select
                    value={formData.usuario_id}
                    onChange={(e) => handleUserSelectChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  >
                    <option value="">-- Criar novo perfil independente --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.email}) - {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matrícula</label>
                  <input
                    type="text"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
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

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unidade de Lotação</label>
                  <select
                    value={formData.unidade_id}
                    onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  >
                    <option value="">Sem unidade fixa</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.codigo})
                      </option>
                    ))}
                  </select>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Regional</label>
                  <input
                    type="text"
                    value={formData.regional}
                    onChange={(e) => setFormData({ ...formData, regional: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gestor Imediato</label>
                  <input
                    type="text"
                    value={formData.gestor}
                    onChange={(e) => setFormData({ ...formData, gestor: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
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

      <UnitsManagementModal
        isOpen={unitsModalOpen}
        onClose={() => setUnitsModalOpen(false)}
      />
    </div>
  );
};
