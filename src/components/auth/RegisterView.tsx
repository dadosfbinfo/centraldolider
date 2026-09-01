import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Building2, 
  Briefcase, 
  Phone, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Inbox,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';
import { UserRole, SimulatedEmail } from '../../types/database';
import { EmailSimulationInbox } from './EmailSimulationInbox';
import { EmailConfirmationModal } from './EmailConfirmationModal';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const units = dbStore.getUnits();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [role, setRole] = useState<UserRole>('LIDER');
  const [unidadeId, setUnidadeId] = useState(units[0]?.id || '');
  const [cargo, setCargo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [matricula, setMatricula] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    user: any;
    simulatedEmail: SimulatedEmail;
  } | null>(null);

  const [showInboxModal, setShowInboxModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validations
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (senha.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha,
        role: role,
        unidade_id: role === 'LIDER' ? unidadeId : undefined,
        cargo: cargo.trim() || (role === 'ADMINISTRADOR' ? 'Administrador' : 'Líder de Operações'),
        telefone: telefone.trim(),
        matricula: matricula.trim(),
      });

      setSuccessResult(result);
    } catch (err: any) {
      // 3.2 Duplicate Email error display
      setErrorMessage(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col justify-between py-8 px-4 sm:px-6">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#343A40] to-[#355C7D] p-6 sm:p-8 text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C76B4A]" />
              Novo Cadastro de Usuário
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Crie sua conta na Central do Líder</h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Registro seguro com sincronização automática entre autenticação e perfil
            </p>
          </div>

          <button
            onClick={onSwitchToLogin}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Já tenho conta
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-10">
          {successResult ? (
            /* Success State - Explaining Email Confirmation */
            <div className="space-y-6 text-center max-w-lg mx-auto py-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#fcf1ec] text-[#C76B4A] flex items-center justify-center border border-[#f2caba]">
                <Mail className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                  Status: Pendente de Confirmação
                </span>
                <h3 className="text-xl font-bold text-[#343A40]">Confirme seu E-mail para Acessar</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Enviamos uma mensagem de ativação com o link e token para{' '}
                  <strong className="text-[#355C7D]">{successResult.user.email}</strong>.
                  O login no sistema só será liberado após a confirmação.
                </p>
              </div>

              {/* Token Info Card */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-bold text-[#343A40]">Simulador de Ativação Instantânea:</span>
                  <span className="text-[11px] text-gray-400">Token gerado:</span>
                </div>
                <code className="block p-2.5 bg-white rounded-xl border border-gray-200 font-mono text-xs text-[#C76B4A] break-all select-all font-bold">
                  {successResult.simulatedEmail.token}
                </code>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInboxModal(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#355C7D] text-white font-bold text-xs hover:bg-[#2c4c67] transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Inbox className="w-4 h-4" /> Abrir Caixa de E-mails Simulada
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#C76B4A] text-white font-bold text-xs hover:bg-[#b55d3d] transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" /> Digitar Token / Ativar Agora
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-gray-500 hover:text-[#343A40] font-semibold flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Ir para a tela de login
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-[#fdf0f4] border border-[#B85C7A]/40 text-[#B85C7A] text-xs font-medium flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Atenção ao realizar o cadastro:</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Profile Type (Role) Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-2">
                  Perfil de Acesso Solicitado *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('LIDER')}
                    className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                      role === 'LIDER'
                        ? 'border-[#C76B4A] bg-[#fcf1ec] ring-2 ring-[#C76B4A]/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${role === 'LIDER' ? 'bg-[#C76B4A] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#343A40] text-sm">Líder de Unidade</span>
                        {role === 'LIDER' && <CheckCircle2 className="w-4 h-4 text-[#C76B4A]" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Executa tarefas/OS, visualiza metas, relatórios e calendário da sua unidade.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ADMINISTRADOR')}
                    className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                      role === 'ADMINISTRADOR'
                        ? 'border-[#355C7D] bg-[#ebf3f8] ring-2 ring-[#355C7D]/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${role === 'ADMINISTRADOR' ? 'bg-[#355C7D] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#343A40] text-sm">Administrador</span>
                        {role === 'ADMINISTRADOR' && <CheckCircle2 className="w-4 h-4 text-[#355C7D]" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Acesso total para criar e gerenciar OS, metas, relatórios e usuários do sistema.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* User Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Amanda Nogueira"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                    E-mail Corporativo *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="amanda.nogueira@centraldolider.com.br"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none"
                      required
                    />
                  </div>
                </div>

                {role === 'LIDER' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                        Unidade Vinculada *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                        <select
                          value={unidadeId}
                          onChange={(e) => setUnidadeId(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none bg-white"
                          required
                        >
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nome} ({u.regional})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                        Matrícula / Registro
                      </label>
                      <input
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        placeholder="Ex: MAT-4482"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                    Cargo / Função
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      placeholder={role === 'ADMINISTRADOR' ? 'Ex: Gerente de Operações' : 'Ex: Gerente de Loja'}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                    Telefone de Contato
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  Ao cadastrar, você receberá um link de confirmação no e-mail informado.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#C76B4A] text-white font-bold text-sm hover:bg-[#b55d3d] active:bg-[#a24f31] transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      Concluir Cadastro <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Modals */}
      <EmailSimulationInbox
        isOpen={showInboxModal}
        onClose={() => setShowInboxModal(false)}
      />

      <EmailConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        initialToken={successResult?.simulatedEmail.token}
        initialEmail={email}
        onSuccess={() => {
          setShowConfirmModal(false);
          onSwitchToLogin();
        }}
      />
    </div>
  );
};
