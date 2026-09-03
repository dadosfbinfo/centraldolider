import React, { useState, useRef } from 'react';
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
  Lock,
  Camera,
  Upload,
  Trash2,
  FolderKanban
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';

export const UserProfileView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Profile edit states
  const [nome, setNome] = useState(currentUser?.nome || '');
  const [telefone, setTelefone] = useState(currentUser?.telefone || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser?.avatar_url || '');
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
      <div className="p-8 text-center text-stone-500">
        Nenhum usuário conectado.
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem não pode ultrapassar 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        avatar_url: avatarUrl,
      });

      // Also sync leader table if exists
      const leader = dbStore.getLeaderById(currentUser.id);
      if (leader) {
        dbStore.updateLeader(leader.id, {
          nome: nome.trim(),
          telefone: telefone.trim(),
        });
      }

      setProfileMsg({ type: 'success', text: 'Dados e foto de perfil atualizados com sucesso!' });
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

  const initials = currentUser.nome
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with Upload button */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={currentUser.nome}
                className="w-20 h-20 rounded-3xl object-cover border-2 border-[#C76B4A] shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-stone-800 to-[#C76B4A] text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {initials}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 bg-[#C76B4A] hover:bg-[#b55e3e] text-white rounded-xl shadow-md transition-transform hover:scale-105"
              title="Alterar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900">{currentUser.nome}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentUser.role === 'ADMINISTRADOR'
                    ? 'bg-orange-50 text-[#C76B4A] border border-orange-200'
                    : 'bg-stone-100 text-stone-800 border border-stone-300'
                }`}
              >
                {currentUser.role === 'ADMINISTRADOR' ? 'Administrador' : 'Líder Operacional'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              {currentUser.email}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-stone-600 font-medium">
              <span className="flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-[#C76B4A]" />
                {currentUser.unidade_nome || currentUser.projeto_nome || 'Sem projeto fixo'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#C76B4A]" />
                {currentUser.cargo || 'Líder'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Data & Photo Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#C76B4A]" />
              <h2 className="text-base font-bold text-stone-900">
                Informações de Perfil & Contato
              </h2>
            </div>
          </div>

          {profileMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            {/* Photo Selection Box */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto Preview"
                    className="w-14 h-14 rounded-2xl object-cover border border-[#C76B4A]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-stone-200 text-stone-500 font-bold flex items-center justify-center text-xs">
                    Sem Foto
                  </div>
                )}
                <div>
                  <span className="font-bold text-stone-900 block">Foto de Perfil (Opcional)</span>
                  <span className="text-[11px] text-stone-500">
                    PNG, JPG ou WebP até 5MB
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#C76B4A] hover:bg-[#b55e3e] text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarUrl ? 'Substituir Foto' : 'Enviar Foto'}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Remover foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 mb-1 block">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-300 text-stone-900 font-semibold focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 mb-1 block">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 mb-1 block">E-mail (Login)</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-stone-100 rounded-xl border border-stone-200 text-stone-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  O e-mail é gerenciado pelo Administrador do sistema.
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-700 mb-1 block">Projeto Vinculado</label>
                <input
                  type="text"
                  value={currentUser.unidade_nome || currentUser.projeto_nome || 'Central Operacional'}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-stone-100 rounded-xl border border-stone-200 text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-[#C76B4A] hover:bg-[#b55e3e] text-white font-bold rounded-xl transition shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Salvando...' : 'Salvar Informações'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Change Password */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#C76B4A]" />
              <h2 className="text-base font-bold text-stone-900">
                Segurança & Senha
              </h2>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 mb-1 block">Senha Atual *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 mb-1 block">Nova Senha *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 mb-1 block">Confirmar Nova Senha *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSavingPassword ? 'Alterando...' : 'Alterar Senha'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
