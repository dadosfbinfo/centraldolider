import React, { useState } from 'react';
import { TarefaOS } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import {
  Printer,
  X,
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  MessageSquare,
  User,
  Shield
} from 'lucide-react';

interface TaskPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TarefaOS | null;
}

export const TaskPrintModal: React.FC<TaskPrintModalProps> = ({ isOpen, onClose, task }) => {
  const [includeComments, setIncludeComments] = useState(true);

  if (!isOpen || !task) return null;

  const comments = dbStore.getComments('TAREFA', task.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden my-auto">
        {/* Action Header (hidden on print) */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFAFA] print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C76B4A]" />
            <span className="font-bold text-sm text-[#343A40]">
              Visualização de Impressão / Exportação PDF
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-gray-300">
              <input
                type="checkbox"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
                className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
              />
              <span className="font-semibold">Incluir Comentários ({comments.length})</span>
            </label>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar como PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-[#343A40] space-y-6 font-sans">
          {/* Corporate Header */}
          <div className="border-b-2 border-[#343A40] pb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#C76B4A] flex items-center justify-center text-white font-bold text-xl">
                CL
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider text-[#343A40]">
                  CENTRAL DO LÍDER
                </h1>
                <p className="text-xs text-gray-500 font-semibold">
                  DOCUMENTO OPERACIONAL DE ORDEM DE SERVIÇO & CONFORMIDADE
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black font-mono text-[#C76B4A]">
                {task.numero_os}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] font-mono text-gray-400">
                HASH: {task.id.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Section 1: OS Identification Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 uppercase tracking-wider text-gray-700">
              1. Dados Cadastrais da Ordem de Serviço
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-200">
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Unidade / Operação</span>
                <span className="font-semibold">{task.unidade}</span>
              </div>
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Responsável Designado</span>
                <span className="font-semibold">{task.responsavel_nome}</span>
                {task.responsavel_cargo && (
                  <span className="text-[10px] text-gray-500 block">({task.responsavel_cargo})</span>
                )}
              </div>
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Categoria</span>
                <span className="font-semibold">{task.categoria_nome}</span>
              </div>
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Prioridade & Recorrência</span>
                <span className="font-bold">{task.prioridade} • {task.recorrencia}</span>
              </div>
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Data Programada</span>
                <span className="font-semibold">{task.data} {task.horario ? `às ${task.horario}` : ''}</span>
              </div>
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Prazo Limite (SLA)</span>
                <span className="font-bold text-red-700">{task.prazo ? task.prazo.replace('T', ' ') : 'Mesmo dia'}</span>
              </div>
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Status da Execução</span>
                <span className="font-black uppercase">{task.status}</span>
              </div>
              <div className="p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Tempo de Execução</span>
                <span className="font-semibold">{task.tempo_execucao_minutos ? `${task.tempo_execucao_minutos} min` : 'Não finalizada'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Instructions & Description */}
          <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 uppercase tracking-wider text-gray-700">
              2. Procedimento & Instruções de Trabalho
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-bold text-sm text-[#343A40]">{task.titulo}</h3>
              <p className="text-gray-700 leading-relaxed">
                {task.descricao || 'Executar conforme padrões operacionais vigentes da rede.'}
              </p>
            </div>
          </div>

          {/* Section 3: Evidence Requirements & Submissions */}
          <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 uppercase tracking-wider text-gray-700">
              3. Checklist de Auditoria & Registro de Evidências
            </div>
            <div className="p-4 space-y-4">
              {task.requisitos_conclusao?.map((req, idx) => {
                const submetido = task.evidencias?.find((e) => e.requisito_id === req.id) ||
                  task.evidencias_submetidas?.find((e) => e.requisito_id === req.id);

                return (
                  <div key={req.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between font-bold text-gray-800">
                      <span>{idx + 1}. {req.titulo} ({req.tipo})</span>
                      <span className="text-[10px] font-semibold text-gray-500">
                        {req.obrigatorio ? 'OBRIGATÓRIO' : 'OPCIONAL'}
                      </span>
                    </div>

                    {req.tipo === 'CHECKLIST' && (
                      <div className="space-y-1.5 pl-4">
                        {req.checklist_itens?.map((item) => {
                          const isDone = submetido?.checklist_concluidos?.includes(item.id) || item.concluido;
                          return (
                            <div key={item.id} className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                                isDone ? 'bg-emerald-700 text-white border-emerald-700' : 'border-gray-400'
                              }`}>
                                {isDone ? '✓' : ''}
                              </span>
                              <span className={isDone ? 'font-medium text-gray-800' : 'text-gray-500'}>
                                {item.texto}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {req.tipo === 'NUMERO' && (
                      <div className="p-2 bg-gray-50 rounded text-gray-700">
                        <strong>Valor Apurado:</strong>{' '}
                        {submetido?.valor_numero !== undefined
                          ? `${submetido.valor_numero} ${req.unidade_medida || ''}`
                          : 'Aguardando medição'}
                      </div>
                    )}

                    {req.tipo === 'FOTO' && (() => {
                      const photos = submetido?.fotos && submetido.fotos.length > 0
                        ? submetido.fotos
                        : submetido?.foto_url ? [submetido.foto_url] : [];

                      return (
                        <div className="p-2 bg-gray-50 rounded text-gray-700 space-y-2">
                          {photos.length > 0 ? (
                            <>
                              <div className="flex flex-wrap gap-2">
                                {photos.map((p, pI) => (
                                  <img
                                    key={pI}
                                    src={p}
                                    alt={`Foto ${pI + 1}`}
                                    className="w-24 h-18 object-cover rounded border border-gray-300"
                                    referrerPolicy="no-referrer"
                                  />
                                ))}
                              </div>
                              <span className="text-emerald-700 font-semibold text-xs block">
                                ✓ {photos.length} foto(s) anexada(s) e validada(s) no sistema
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Nenhum registro fotográfico anexado</span>
                          )}
                        </div>
                      );
                    })()}

                    {req.tipo === 'ARQUIVO' && (() => {
                      const files = submetido?.arquivos && submetido.arquivos.length > 0
                        ? submetido.arquivos
                        : submetido?.arquivo_url ? [{ id: '1', nome: submetido.arquivo_url, url: submetido.arquivo_url }] : [];

                      return (
                        <div className="p-2 bg-gray-50 rounded text-gray-700 space-y-1">
                          {files.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1">
                              {files.map((f, fI) => (
                                <li key={fI} className="text-xs">
                                  <strong>{f.nome}</strong> {f.tamanho ? `(${f.tamanho})` : ''}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic">Nenhum documento ou laudo anexado</span>
                          )}
                        </div>
                      );
                    })()}

                    {req.tipo === 'FORMULARIO' && (() => {
                      const auditorias = submetido?.auditorias || [];
                      return (
                        <div className="p-2 bg-gray-50 rounded text-gray-700 space-y-2">
                          {auditorias.length > 0 ? (
                            <div className="space-y-1.5">
                              {auditorias.map((a, aI) => {
                                const tot = a.total_auditado || 0;
                                const nc = a.total_nao_conformidades || 0;
                                const conf = tot > 0 ? Math.max(0, Math.round(((tot - nc) / tot) * 100)) : 100;
                                return (
                                  <div key={aI} className="flex items-center justify-between text-xs border-b border-gray-200 pb-1">
                                    <span><strong>{a.nome_auditoria || a.tipo_id}:</strong> Auditados: {tot} | Não Conf.: {nc}</span>
                                    <span className="font-bold text-emerald-700">{conf}% Conforme</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                          {submetido?.relatorio_auditoria && (
                            <div className="text-xs italic bg-white p-2 rounded border border-gray-200">
                              <strong>Relatório / Parecer:</strong> "{submetido.relatorio_auditoria}"
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {req.tipo === 'SIMPLES' && (
                      <div className="p-2 bg-gray-50 rounded text-gray-700 text-xs">
                        <strong>Confirmação de Execução:</strong>{' '}
                        <span className="font-bold">{submetido?.confirmacao_execucao || submetido?.texto_resposta || 'Não informado'}</span>
                        {submetido?.confirmacao_detalhe && (
                          <div className="mt-1 italic">"{submetido.confirmacao_detalhe}"</div>
                        )}
                      </div>
                    )}

                    {req.tipo === 'TEXTO' && (
                      <div className="p-2 bg-gray-50 rounded text-gray-700 italic">
                        "{submetido?.texto_resposta || 'Sem observações textuais registradas.'}"
                      </div>
                    )}

                    {req.tipo === 'OPCAO' && (
                      <div className="p-2 bg-gray-50 rounded text-gray-700">
                        <strong>Seleção:</strong> {submetido?.opcao_selecionada || 'Pendente'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Communication & Comments Thread */}
          {includeComments && comments.length > 0 && (
            <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
              <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 uppercase tracking-wider text-gray-700 flex items-center justify-between">
                <span>4. Histórico de Comunicação & Observações ({comments.length})</span>
                <span className="text-[10px] font-normal text-gray-500">Canal Líder ↔ Administração</span>
              </div>
              <div className="p-4 space-y-3 divide-y divide-gray-100">
                {comments.map((c) => (
                  <div key={c.id} className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-gray-800">
                        {c.autor_nome} ({c.autor_role === 'ADMINISTRADOR' ? 'Administração' : 'Líder'})
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        {new Date(c.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-xs bg-gray-50 p-2 rounded border border-gray-200">
                      {c.texto}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Final Closure & Observations */}
          {task.observacoes_conclusao && (
            <div className="border border-gray-300 rounded-lg p-4 text-xs bg-gray-50">
              <span className="font-bold block uppercase text-gray-600 mb-1">Parecer de Fechamento:</span>
              <p className="text-gray-800 italic">{task.observacoes_conclusao}</p>
            </div>
          )}

          {/* Section 6: Signatures & Compliance Guarantee */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b border-gray-400 h-10 mb-2"></div>
              <div className="font-bold text-[#343A40]">{task.responsavel_nome}</div>
              <div className="text-[11px] text-gray-500">Líder Executor • {task.unidade}</div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-gray-400 h-10 mb-2"></div>
              <div className="font-bold text-[#343A40]">Supervisão / Administração Central</div>
              <div className="text-[11px] text-gray-500">Validação e Auditoria da Conformidade</div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 text-center pt-4">
            Central do Líder • Plataforma de Gestão e Auditoria Operacional Integrada • Emitido via Sistema Web
          </div>
        </div>
      </div>
    </div>
  );
};
