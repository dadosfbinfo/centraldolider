import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Clock, Trash2, ExternalLink, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { dbStore } from '../../services/dbStore';
import { SimulatedEmail } from '../../types/database';
import { useAuth } from '../../context/AuthContext';

interface EmailSimulationInboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailSimulationInbox: React.FC<EmailSimulationInboxProps> = ({ isOpen, onClose }) => {
  const { confirmEmail } = useAuth();
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
  const [activating, setActivating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadEmails = () => {
    const data = dbStore.getSimulatedEmails();
    setEmails(data);
    if (data.length > 0 && !selectedEmail) {
      setSelectedEmail(data[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEmails();
      const unsub = dbStore.subscribe(() => {
        loadEmails();
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActivateAccount = async (emailItem: SimulatedEmail) => {
    setActivating(true);
    setActionSuccess(null);
    try {
      await confirmEmail(emailItem.token);
      setActionSuccess(`Conta de ${emailItem.to} ativada com sucesso! Agora é possível fazer login.`);
      loadEmails();
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar e-mail');
    } finally {
      setActivating(false);
    }
  };

  const handleDelete = (id: string) => {
    dbStore.deleteSimulatedEmail(id);
    const remaining = emails.filter((e) => e.id !== id);
    setEmails(remaining);
    if (selectedEmail?.id === id) {
      setSelectedEmail(remaining.length > 0 ? remaining[0] : null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#343A40]/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#343A40] text-white flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#C76B4A] text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Servidor de E-mails / Caixa de Entrada</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#5B7DBE] text-white">
                  {emails.length} mensagens
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Simulador de envio de e-mails para validação da confirmação de cadastro e recuperação de senha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Split Pane) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Email List Sidebar */}
          <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto max-h-56 md:max-h-none">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white text-xs font-semibold text-gray-500">
              <span>Mensagens Enviadas</span>
              <button
                onClick={() => {
                  dbStore.clearSimulatedEmails();
                  setEmails([]);
                  setSelectedEmail(null);
                }}
                className="text-[#B85C7A] hover:underline"
              >
                Limpar tudo
              </button>
            </div>

            {emails.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center flex-1">
                <Mail className="w-8 h-8 stroke-1 mb-2 text-gray-300" />
                Nenhum e-mail registrado ainda. Realize um cadastro para testar o envio.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {emails.map((e) => {
                  const isSelected = selectedEmail?.id === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEmail(e)}
                      className={`w-full text-left p-3.5 transition flex flex-col gap-1 text-xs ${
                        isSelected ? 'bg-white border-l-4 border-[#C76B4A] shadow-sm' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#343A40] truncate">{e.userName || e.to}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[#355C7D] font-medium truncate">{e.subject}</span>
                      <span className="text-gray-500 truncate text-[11px]">Para: {e.to}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Preview Area */}
          <div className="flex-1 bg-white p-6 overflow-y-auto flex flex-col">
            {selectedEmail ? (
              <div className="space-y-5">
                {actionSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {/* Email Header */}
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-[#343A40]">{selectedEmail.subject}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span><strong>De:</strong> Central do Líder &lt;nao-responda@centraldolider.com.br&gt;</span>
                        <span><strong>Para:</strong> {selectedEmail.to}</span>
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(selectedEmail.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(selectedEmail.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Excluir mensagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Simulated Email Body Card */}
                <div className="bg-[#fcfaf8] border border-[#f2caba]/60 rounded-2xl p-6 shadow-sm">
                  {/* Brand Header */}
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-200">
                    <div className="w-8 h-8 rounded-lg bg-[#C76B4A] flex items-center justify-center text-white font-bold text-sm">
                      CL
                    </div>
                    <div>
                      <span className="font-bold text-[#343A40] text-sm tracking-tight">CENTRAL DO LÍDER</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Gestão e Governança Operacional</span>
                    </div>
                  </div>

                  {selectedEmail.type === 'CONFIRMACAO_CADASTRO' ? (
                    <div className="space-y-4 text-sm text-gray-700">
                      <p className="font-medium text-[#343A40]">
                        Olá, <strong>{selectedEmail.userName || 'Líder'}</strong>!
                      </p>
                      <p>
                        Seu cadastro na plataforma <strong>Central do Líder</strong> foi iniciado com sucesso. 
                        Para garantir a segurança do sistema e liberar seu acesso a ordens de serviço, metas e relatórios, 
                        confirme seu endereço de e-mail clicando no botão abaixo:
                      </p>

                      <div className="py-3 text-center">
                        <button
                          onClick={() => handleActivateAccount(selectedEmail)}
                          disabled={activating}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C76B4A] text-white font-bold text-sm hover:bg-[#b55d3d] transition shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {activating ? 'Ativando...' : 'Confirmar Meu Cadastro'}
                        </button>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-500 space-y-1">
                        <p className="font-semibold text-[#343A40]">Token de Ativação Direto:</p>
                        <code className="block p-1.5 bg-gray-50 rounded border text-[#355C7D] font-mono select-all">
                          {selectedEmail.token}
                        </code>
                      </div>

                      <p className="text-xs text-gray-500 pt-2">
                        Se você não realizou esta solicitação, desconsidere este e-mail. Este link é válido por 24 horas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm text-gray-700">
                      <p className="font-medium text-[#343A40]">
                        Olá, <strong>{selectedEmail.userName}</strong>!
                      </p>
                      <p>
                        Recebemos uma solicitação de redefinição de senha para o seu acesso na <strong>Central do Líder</strong>.
                      </p>
                      <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-500 space-y-1">
                        <p className="font-semibold text-[#343A40]">Token de Recuperação:</p>
                        <code className="block p-1.5 bg-gray-50 rounded border text-[#C76B4A] font-mono select-all">
                          {selectedEmail.token}
                        </code>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                  <span>Simulador de E-mail para validação da Etapa 1/5</span>
                  <button
                    onClick={() => handleActivateAccount(selectedEmail)}
                    className="text-[#C76B4A] font-semibold hover:underline flex items-center gap-1"
                  >
                    Ativar conta agora <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
                <Mail className="w-12 h-12 text-gray-300 stroke-1 mb-2" />
                <p>Selecione um e-mail na lista lateral para visualizar os detalhes</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Serviço de Mensageria Ativo (Local + Webhook)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
