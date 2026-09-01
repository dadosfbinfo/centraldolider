import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SimulatedEmail } from '../../types/database';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onOpenInbox?: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onOpenInbox,
}) => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState<SimulatedEmail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, informe seu endereço de e-mail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await requestPasswordReset(email.trim());
      setSentResult(res);
    } catch (err: any) {
      setError(err.message || 'Não foi possível processar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#343A40]/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#343A40] to-[#355C7D] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#C76B4A] bg-[#FFFFFF]/90">
              <Mail className="w-5 h-5 text-[#C76B4A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Recuperar Senha</h3>
              <p className="text-xs text-gray-200">Enviaremos instruções de redefinição para o seu e-mail</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {sentResult ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-semibold text-[#343A40] text-base">E-mail de Recuperação Enviado</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Enviamos as instruções para <strong className="text-[#355C7D]">{sentResult.to}</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-left text-gray-600 space-y-1">
                <p className="font-medium text-[#343A40]">Token gerado para teste:</p>
                <code className="block p-2 bg-white rounded border font-mono text-[#C76B4A] break-all text-[11px]">
                  {sentResult.token}
                </code>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {onOpenInbox && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInbox();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#355C7D] text-white text-sm font-semibold hover:bg-[#2c4c67] transition shadow-sm"
                  >
                    Ver Caixa de E-mails Simulada
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Voltar ao Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-[#fdf0f4] border border-[#B85C7A]/30 text-[#B85C7A] text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                  E-mail cadastrado
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@centraldolider.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/40 focus:border-[#C76B4A] transition"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#C76B4A] text-white text-sm font-semibold hover:bg-[#b55d3d] transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar Instruções
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
