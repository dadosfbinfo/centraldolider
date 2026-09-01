import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  initialEmail?: string;
  onSuccess?: () => void;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  initialToken = '',
  initialEmail = '',
  onSuccess,
}) => {
  const { confirmEmail, resendConfirmation } = useAuth();
  const [tokenOrEmail, setTokenOrEmail] = useState(initialToken || initialEmail);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenOrEmail.trim()) {
      setError('Por favor, informe o token ou e-mail de confirmação.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await confirmEmail(tokenOrEmail.trim());
      setSuccess(`Cadastro de ${user.nome} (${user.email}) confirmado com sucesso!`);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Código de confirmação inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!tokenOrEmail.includes('@')) {
      setError('Para reenviar o e-mail, informe o seu endereço de e-mail no campo acima.');
      return;
    }

    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await resendConfirmation(tokenOrEmail.trim());
      setSuccess(`Novo e-mail de confirmação enviado para ${res.to}!`);
    } catch (err: any) {
      setError(err.message || 'Não foi possível reenviar a confirmação.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#343A40]/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#343A40] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C76B4A] text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Confirmação de Cadastro</h3>
              <p className="text-xs text-gray-300">Validação de e-mail e segurança de acesso</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-[#343A40] text-base">Ativação Concluída!</h4>
                <p className="text-sm text-gray-600 mt-1">{success}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C76B4A] text-white text-sm font-semibold hover:bg-[#b55d3d] transition shadow-sm"
              >
                Fazer Login Agora
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Insira o token de ativação recebido no seu e-mail (ou o seu e-mail cadastrado) para ativar sua conta na plataforma.
              </p>

              {error && (
                <div className="p-3.5 rounded-xl bg-[#fdf0f4] border border-[#B85C7A]/30 text-[#B85C7A] text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                  Token ou E-mail de Ativação
                </label>
                <input
                  type="text"
                  value={tokenOrEmail}
                  onChange={(e) => setTokenOrEmail(e.target.value)}
                  placeholder="Ex: token_act_... ou seu e-mail"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#343A40] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/40 focus:border-[#C76B4A] transition font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C76B4A] text-white text-sm font-semibold hover:bg-[#b55d3d] transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar e Ativar Conta
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs text-[#355C7D] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> Reenviar e-mail de ativação
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Fechar
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
