import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  Layers,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginViewProps {
  onOpenDatabaseSchema?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenDatabaseSchema }) => {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err.message || 'Erro ao efetuar login.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login rápido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C76B4A] flex items-center justify-center text-white shadow-sm font-bold text-lg">
            CL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#343A40] text-lg tracking-tight">Central do Líder</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#355C7D]/10 text-[#355C7D] uppercase">
                Sistema de Gestão
              </span>
            </div>
            <span className="text-xs text-gray-500 hidden sm:block">Gestão Operacional de Projetos & Governança</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenDatabaseSchema && (
            <button
              onClick={onOpenDatabaseSchema}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f7f2ed] text-[#8B6B4A] hover:bg-[#ede3d8] transition border border-[#8B6B4A]/20"
              title="Inspecionar DDL SQL e tabelas do banco Supabase"
            >
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Estrutura de Banco</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Hero & Feature Context Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#343A40] via-[#355C7D] to-[#212529] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C76B4A]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5B7DBE]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Controle operacional completo para líderes e gestão.
                </h1>
                <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                  Ordens de Serviço, metas em tempo real, relatórios com confirmação de leitura e rastreabilidade total de cada execução.
                </p>
              </div>

              {/* Security highlights */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#C76B4A] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Acesso Corporativo Seguro</p>
                    <p className="text-gray-300 mt-0.5">Cadastros e permissões gerenciados centralmente pela administração.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <Layers className="w-5 h-5 text-[#5B7DBE] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Controle de Perfis (RBAC)</p>
                    <p className="text-gray-300 mt-0.5">Visão segmentada para <strong>Administrador</strong> e <strong>Líder de Projeto</strong>.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Quick Switch for Evaluator */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/15">
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2.5">
                Acesso Rápido com 1 Clique (Demonstração):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('admin@centraldolider.com.br', 'Admin@123')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition border border-white/10 text-gray-200 hover:text-white disabled:opacity-50"
                >
                  <span className="font-bold text-white block">👑 Administrador Geral</span>
                  <span className="text-[10px] text-gray-300 truncate block">Acesso total e gestão</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('gerencia.teste@centraldolider.com.br', 'Gerencia@123')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition border border-white/10 text-gray-200 hover:text-white disabled:opacity-50"
                >
                  <span className="font-bold text-white block">🛡️ Gerência Regional</span>
                  <span className="text-[10px] text-gray-300 truncate block">Validação & auditoria OS</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('mariana.costa@centraldolider.com.br', 'Lider@123')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition border border-white/10 text-gray-200 hover:text-white disabled:opacity-50"
                >
                  <span className="font-bold text-white block">👔 Líder (SP Pinheiros)</span>
                  <span className="text-[10px] text-gray-300 truncate block">Execução de OS & Metas</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('lider.teste@centraldolider.com.br', 'Lider@123')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition border border-white/10 text-gray-200 hover:text-white disabled:opacity-50"
                >
                  <span className="font-bold text-white block">👔 Líder (Curitiba)</span>
                  <span className="text-[10px] text-gray-300 truncate block">Operação e rotinas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Login Form Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-lg flex flex-col justify-between">
            <div>
              <div className="border-b border-gray-100 pb-5 mb-6">
                <h2 className="text-2xl font-bold text-[#343A40]">Acessar o Sistema</h2>
                <p className="text-xs text-gray-500 mt-1">Informe suas credenciais para entrar na sua área</p>
              </div>

              {/* Alert message if any */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-[#fdf0f4] border border-[#B85C7A]/40 text-[#B85C7A] text-xs font-medium space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@centraldolider.com.br"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm text-[#343A40] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40]">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-semibold text-[#5B7DBE] hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm text-[#343A40] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#C76B4A] text-white text-sm font-bold hover:bg-[#b55d3d] active:bg-[#a24f31] transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      Entrar no Sistema
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 px-6 py-3.5 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Central do Líder • Gestão Operacional & Governança</span>
        <div className="flex items-center gap-4 text-gray-400">
          <span>Role-Based Access Control (RBAC)</span>
        </div>
      </footer>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={email}
      />
    </div>
  );
};
