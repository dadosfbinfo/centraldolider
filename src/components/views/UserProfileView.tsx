import React, { useState } from 'react';
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Save,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';

export const UserProfileView: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Profile edit states
  const [nome, setNome] = useState(currentUser?.nome || '');
  const [telefone, setTelefone] = useState(currentUser?.telefone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-gray-500">
        Nenhum usuário conectado.
      </div>
    );
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      if (!nome.trim()) {
        throw new Error('O nome não pode ficar em branco.');
      }

      dbStore.updateUserProfile(currentUser.id, {
        nome: nome.trim(),
        telefone: telefone.trim(),
      });

      // Also sync leader table if exists
      const leader = dbStore.getLeaderById(currentUser.id);
      if (leader) {
        dbStore.updateLeader(leader.id, {
          nome: nome.trim(),
          telefone: telefone.trim(),
        });
      }

      setProfileMsg({ type: 'success', text: 'Dados de contato atualizados com sucesso!' });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Erro ao atualizar dados.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordMsg(null);

    try {
      if (!currentPassword) {
        throw new Error('Informe sua senha atual.');
      }
      if (newPassword.length < 6) {
        throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('A confirmação da nova senha não confere.');
      }

      dbStore.updateUserPassword(currentUser.email, currentPassword, newPassword);

      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Erro ao alterar a senha.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#355C7D] to-[#C76B4A] text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-md">
            {currentUser.nome
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#343A40]">{currentUser.nome}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                currentUser.role === 'ADMINISTRADOR'
                  ? 'bg-[#fcf1ec] text-[#C76B4A] border border-[#f2caba]'
                  : 'bg-[#edf3fc] text-[#5B7DBE] border border-[#dfeaf8]'
              }`}>
                {currentUser.role === 'ADMINISTRADOR' ? 'Administrador' : 'Líder Operacional'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              {currentUser.email}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 font-medium">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#C76B4A]" />
                {currentUser.unidade_nome || 'Sem unidade fixa'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#8B6B4A]" />
                {currentUser.cargo || 'Gestão'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5 self-stretch sm:self-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            E-mail Confirmado
          </span>
          <span className="text-[11px] text-gray-400">
            Membro desde {new Date(currentUser.created_at || Date.now()).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Personal and Contact Details */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#C76B4A]/10 text-[#C76B4A]">
                <User className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-[#343A40]">Dados Cadastrais</h2>
            </div>
          </div>

          {profileMsg && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#343A40] focus:outline-hidden focus:border-[#C76B4A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-mail Corporativo</label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                O e-mail é utilizado para login e identificação formal no sistema.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="(11) 98888-7777"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#343A40] focus:outline-hidden focus:border-[#C76B4A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Unidade Operacional</label>
                <input
                  type="text"
                  value={currentUser.unidade_nome || 'Todas / Matriz'}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={currentUser.cargo || 'Gestão'}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-4 h-4" />
              {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Right Column: Security and Password */}
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#355C7D]/10 text-[#355C7D]">
                  <KeyRound className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-[#343A40]">Alteração de Senha</h2>
              </div>
            </div>

            {passwordMsg && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Senha Atual</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#343A40] focus:outline-hidden focus:border-[#355C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#343A40] focus:outline-hidden focus:border-[#355C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#343A40] focus:outline-hidden focus:border-[#355C7D]"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full py-2.5 bg-[#355C7D] hover:bg-[#2a4a66] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-4"
              >
                <Lock className="w-4 h-4" />
                {isSavingPassword ? 'Atualizando...' : 'Atualizar Senha de Acesso'}
              </button>
            </form>
          </div>

          {/* Access Role Notice */}
          <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#EBE3DC] text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2 text-[#8B6B4A] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Nível de Acesso e Permissões</span>
            </div>
            <p className="leading-relaxed text-gray-500">
              Sua conta está configurada como <strong>{currentUser.role === 'ADMINISTRADOR' ? 'Administrador' : 'Líder Operacional'}</strong>. Alterações de permissões e atribuições estruturais de unidades são gerenciadas pela administração do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
