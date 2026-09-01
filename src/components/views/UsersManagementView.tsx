import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  X,
  Lock,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';
import { UsuarioPerfil, UserRole, ConfirmationStatus, Unidade } from '../../types/database';

export const UsersManagementView: React.FC = () => {
  const { currentUser, updateUserRole, allUsers } = useAuth();
  const [users, setUsers] = useState<UsuarioPerfil[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConfirmationStatus>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New User Modal
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    nome: '',
    email: '',
    senha: 'Lider@123',
    role: 'LIDER' as UserRole,
    unidade_id: '',
    cargo: 'Líder Operacional',
    telefone: '',
  });

  // Delete Confirm Modal
  const [userToDelete, setUserToDelete] = useState<UsuarioPerfil | null>(null);

  const loadData = () => {
    setUsers(dbStore.getUsers());
    setUnits(dbStore.getUnits());
  };

  useEffect(() => {
    loadData();
    const unsub = dbStore.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleToggleRole = async (user: UsuarioPerfil) => {
    const newRole: UserRole = user.role === 'ADMINISTRADOR' ? 'LIDER' : 'ADMINISTRADOR';
    try {
      await updateUserRole(user.id, newRole);
      setActionMessage(`Função de ${user.nome} alterada para ${newRole === 'ADMINISTRADOR' ? 'Administrador' : 'Líder'}.`);
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar função');
    }
  };

  const handleManualConfirm = (user: UsuarioPerfil) => {
    try {
      dbStore.confirmUserEmail(user.id);
      setActionMessage(`Cadastro de ${user.nome} ativado manualmente.`);
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar');
    }
  };

  const handleResendActivation = (user: UsuarioPerfil) => {
    try {
      const email = dbStore.resendConfirmationEmail(user.email);
      setActionMessage(`E-mail de ativação reenviado para ${email.to}.`);
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao reenviar');
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
      alert('Você não pode excluir sua própria conta de administrador ativa.');
      setUserToDelete(null);
      return;
    }

    dbStore.deleteUser(userToDelete.id);
    setActionMessage(`Usuário ${userToDelete.nome} excluído com sucesso.`);
    setUserToDelete(null);
    setTimeout(() => setActionMessage(null), 4000);
    loadData();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newUserData.nome.trim() || !newUserData.email.trim()) {
        alert('Preencha nome e e-mail');
        return;
      }

      dbStore.registerUser({
        nome: newUserData.nome.trim(),
        email: newUserData.email.trim().toLowerCase(),
        senha: newUserData.senha,
        role: newUserData.role,
        unidade_id: newUserData.unidade_id || undefined,
        cargo: newUserData.cargo,
        telefone: newUserData.telefone,
      });

      setActionMessage(`Usuário ${newUserData.nome} cadastrado com sucesso.`);
      setCreateUserModalOpen(false);
      setNewUserData({
        nome: '',
        email: '',
        senha: 'Lider@123',
        role: 'LIDER',
        unidade_id: '',
        cargo: 'Líder Operacional',
        telefone: '',
      });
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar usuário');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.unidade_nome && u.unidade_nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status_confirmacao === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalAdmins = users.filter((u) => u.role === 'ADMINISTRADOR').length;
  const totalLeaders = users.filter((u) => u.role === 'LIDER').length;
  const totalPending = users.filter((u) => u.status_confirmacao === 'PENDENTE').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#fcf1ec] text-[#C76B4A] text-xs font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Módulo Administrativo (Exclusivo Administrador)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#343A40]">Gestão de Usuários & Perfis</h2>
          <p className="text-xs text-gray-500 mt-1">
            Controle de acessos, alteração de função (Admin/Líder) e monitoramento de ativação
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-2xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Total</span>
              <span className="text-sm font-extrabold text-[#343A40]">{users.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-[#ebf3f8] border border-[#355C7D]/20 text-center">
              <span className="text-[10px] uppercase font-bold text-[#355C7D] block">Líderes</span>
              <span className="text-sm font-extrabold text-[#355C7D]">{totalLeaders}</span>
            </div>
          </div>

          <button
            onClick={() => setCreateUserModalOpen(true)}
            className="px-4 py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou unidade..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 text-[#343A40] placeholder-gray-400 focus:outline-hidden focus:border-[#C76B4A]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-[#343A40] font-medium outline-hidden focus:border-[#C76B4A]"
            >
              <option value="ALL">Todos os Papéis</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="LIDER">Líder</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-[#343A40] font-medium outline-hidden focus:border-[#C76B4A]"
          >
            <option value="ALL">Todos os Status</option>
            <option value="CONFIRMADO">Confirmados</option>
            <option value="PENDENTE">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-[#fcfaf8] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Papel / Função</th>
                <th className="px-6 py-4">Status de Confirmação</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4">Cadastrado em</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isPending = u.status_confirmacao === 'PENDENTE';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isCurrent ? 'bg-[#fcf1ec]/20' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#355C7D] to-[#C76B4A] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {u.nome
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#343A40]">{u.nome}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#C76B4A] text-white">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border">
                          {u.role === 'ADMINISTRADOR' ? (
                            <span className="bg-[#fcf1ec] text-[#C76B4A] border border-[#f2caba] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Administrador
                            </span>
                          ) : (
                            <span className="bg-[#edf3fc] text-[#5B7DBE] border border-[#dfeaf8] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> Líder Operacional
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Confirmation Status */}
                      <td className="px-6 py-4">
                        {!isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmado
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pendente Ativação
                            </span>
                            <div className="flex items-center gap-2 pt-0.5">
                              <button
                                onClick={() => handleManualConfirm(u)}
                                className="text-[10px] text-[#C76B4A] font-bold hover:underline flex items-center gap-0.5"
                              >
                                Ativar Manual
                              </button>
                              <span className="text-gray-300">•</span>
                              <button
                                onClick={() => handleResendActivation(u)}
                                className="text-[10px] text-gray-500 hover:text-gray-700 font-medium"
                              >
                                Reenviar e-mail
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          {u.unidade_nome ? (
                            <span className="font-semibold text-[#343A40] flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-[#8B6B4A]" />
                              {u.unidade_nome}
                            </span>
                          ) : (
                            <span className="text-gray-400">Geral / Matriz</span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-[11px] text-gray-500">
                        {new Date(u.created_at || Date.now()).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleRole(u)}
                            className="px-2.5 py-1 rounded-xl border border-gray-200 hover:bg-gray-100 text-[#343A40] text-[11px] font-semibold transition"
                            title="Alternar função entre Administrador e Líder"
                          >
                            Trocar para {u.role === 'ADMINISTRADOR' ? 'Líder' : 'Admin'}
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Create User Modal */}
      {createUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#C76B4A]/10 text-[#C76B4A]">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#343A40]">Cadastrar Novo Usuário</h3>
                  <p className="text-xs text-gray-500">
                    Crie credenciais de acesso para administrador ou líder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={newUserData.nome}
                  onChange={(e) => setNewUserData({ ...newUserData, nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="carlos@empresa.com.br"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Papel de Acesso</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  >
                    <option value="LIDER">Líder Operacional</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unidade</label>
                  <select
                    value={newUserData.unidade_id}
                    onChange={(e) => setNewUserData({ ...newUserData, unidade_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  >
                    <option value="">Geral / Sem unidade fixa</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={newUserData.cargo}
                    onChange={(e) => setNewUserData({ ...newUserData, cargo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={newUserData.telefone}
                    onChange={(e) => setNewUserData({ ...newUserData, telefone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Senha Inicial</label>
                <input
                  type="text"
                  value={newUserData.senha}
                  onChange={(e) => setNewUserData({ ...newUserData, senha: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#C76B4A] text-white hover:bg-[#b05838] rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="p-2.5 rounded-2xl bg-red-50">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-[#343A40]">Excluir Acesso do Usuário</h3>
                <p className="text-xs text-gray-500">Essa ação é irreversível</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Tem certeza que deseja remover o usuário <strong>{userToDelete.nome}</strong> ({userToDelete.email})? O login e perfil associados serão excluídos permanentemente.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
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
