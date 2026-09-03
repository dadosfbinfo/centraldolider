import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  Mail,
  FolderKanban,
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
import { UsuarioPerfil, UserRole, ConfirmationStatus, Projeto } from '../../types/database';

export const UsersManagementView: React.FC = () => {
  const { user: currentUser, updateUserRole } = useAuth();
  const [users, setUsers] = useState<UsuarioPerfil[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
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
    projeto_id: '',
    cargo: 'Líder Operacional',
    telefone: '',
  });

  // Delete Confirm Modal
  const [userToDelete, setUserToDelete] = useState<UsuarioPerfil | null>(null);

  const loadData = () => {
    setUsers(dbStore.getUsers());
    setProjects(dbStore.getUnits());
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
        unidade_id: newUserData.projeto_id || undefined,
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
        projeto_id: '',
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Gestão de Usuários
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Administre os acessos, permissões e status de ativação de administradores e líderes
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateUserModalOpen(true)}
          className="px-5 py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou projeto..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
            >
              <option value="ALL">Todos os Papéis</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="GERENCIA">Gerência</option>
              <option value="LIDER">Líder</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
          >
            <option value="ALL">Todos os Status</option>
            <option value="CONFIRMADO">Confirmados</option>
            <option value="PENDENTE">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-black text-stone-500 uppercase tracking-wider">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Papel / Função</th>
                <th className="px-6 py-4">Status de Confirmação</th>
                <th className="px-6 py-4">Projeto</th>
                <th className="px-6 py-4">Cadastrado em</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
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
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isCurrent ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-stone-800 to-[#C76B4A] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {u.nome
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900">{u.nome}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-[#C76B4A] text-white">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-stone-400" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold">
                          {u.role === 'ADMINISTRADOR' ? (
                            <span className="bg-orange-50 text-[#C76B4A] border border-orange-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Administrador
                            </span>
                          ) : u.role === 'GERENCIA' ? (
                            <span className="bg-blue-50 text-[#355C7D] border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Gerência
                            </span>
                          ) : (
                            <span className="bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
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
                              <span className="text-stone-300">•</span>
                              <button
                                onClick={() => handleResendActivation(u)}
                                className="text-[10px] text-stone-500 hover:text-stone-700 font-medium"
                              >
                                Reenviar e-mail
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Project */}
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          {u.unidade_nome ? (
                            <span className="font-semibold text-stone-800 flex items-center gap-1">
                              <FolderKanban className="w-3.5 h-3.5 text-[#C76B4A]" />
                              {u.unidade_nome}
                            </span>
                          ) : (
                            <span className="text-stone-400">Geral / Matriz</span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-[11px] text-stone-500">
                        {new Date(u.created_at || Date.now()).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={u.role}
                            onChange={async (e) => {
                              const newRole = e.target.value as UserRole;
                              try {
                                await updateUserRole(u.id, newRole);
                                const roleLabel =
                                  newRole === 'ADMINISTRADOR'
                                    ? 'Administrador'
                                    : newRole === 'GERENCIA'
                                    ? 'Gerência'
                                    : 'Líder Operacional';
                                setActionMessage(`Função de ${u.nome} alterada para ${roleLabel}.`);
                                setTimeout(() => setActionMessage(null), 4000);
                                loadData();
                              } catch (err: any) {
                                alert(err.message || 'Erro ao alterar função');
                              }
                            }}
                            className="px-2.5 py-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-[11px] font-bold transition focus:outline-hidden focus:ring-2 focus:ring-[#C76B4A]"
                            title="Alterar função do usuário"
                          >
                            <option value="LIDER">Líder</option>
                            <option value="GERENCIA">Gerência</option>
                            <option value="ADMINISTRADOR">Admin</option>
                          </select>

                          {!isCurrent && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#C76B4A]/10 text-[#C76B4A]">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-stone-900">Cadastrar Novo Usuário</h3>
                  <p className="text-xs text-stone-500">
                    Crie credenciais de acesso para administrador ou líder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={newUserData.nome}
                  onChange={(e) => setNewUserData({ ...newUserData, nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="carlos@empresa.com.br"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Papel de Acesso</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  >
                    <option value="LIDER">Líder Operacional</option>
                    <option value="GERENCIA">Gerência</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Projeto</label>
                  <select
                    value={newUserData.projeto_id}
                    onChange={(e) => setNewUserData({ ...newUserData, projeto_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  >
                    <option value="">Geral / Sem projeto fixo</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={newUserData.cargo}
                    onChange={(e) => setNewUserData({ ...newUserData, cargo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={newUserData.telefone}
                    onChange={(e) => setNewUserData({ ...newUserData, telefone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Senha Inicial</label>
                <input
                  type="text"
                  value={newUserData.senha}
                  onChange={(e) => setNewUserData({ ...newUserData, senha: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#C76B4A] hover:bg-[#b05838] text-white rounded-xl shadow-xs"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Excluir Usuário</h3>
              <p className="text-xs text-stone-500">
                Tem certeza que deseja excluir o usuário <strong>{userToDelete.nome}</strong> ({userToDelete.email})? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-stone-100 mt-5">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
