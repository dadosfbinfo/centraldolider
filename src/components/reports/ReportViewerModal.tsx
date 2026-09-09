import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Eye,
  Building2,
  Clock,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { Relatorio, UsuarioPerfil } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { CommentsThread } from '../comments/CommentsThread';
import { PdfContinuousViewer } from './PdfContinuousViewer';

interface ReportViewerModalProps {
  report: Relatorio | null;
  currentUser: UsuarioPerfil | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReading?: (reportId: string) => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  report,
  currentUser,
  isOpen,
  onClose,
  onConfirmReading,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [justConfirmed, setJustConfirmed] = useState<boolean>(false);

  if (!isOpen || !report) return null;

  const confirmations = report.confirmacoes_leitura || [];
  const userConfirmation = currentUser
    ? confirmations.find((c) => c.usuario_id === currentUser.id)
    : undefined;

  const isConfirmed = !!userConfirmation || justConfirmed;
  const canDownloadPrint = currentUser?.role === 'ADMINISTRADOR' || currentUser?.role === 'GERENCIA';

  const isPdf = !!(
    (report.arquivo_pdf_url && (report.arquivo_pdf_url.startsWith('data:application/pdf') || report.arquivo_pdf_url.startsWith('blob:') || report.arquivo_pdf_url.endsWith('.pdf'))) ||
    (report.arquivo_pdf_conteudo && report.arquivo_pdf_conteudo.startsWith('data:application/pdf'))
  );

  const pdfSource =
    report.arquivo_pdf_url && (report.arquivo_pdf_url.startsWith('data:application/pdf') || report.arquivo_pdf_url.startsWith('blob:'))
      ? report.arquivo_pdf_url
      : report.arquivo_pdf_conteudo?.startsWith('data:application/pdf')
      ? report.arquivo_pdf_conteudo
      : report.arquivo_pdf_url || '';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && currentUser && !isConfirmed) {
      setIsConfirming(true);
      try {
        dbStore.confirmReportReading(report.id, {
          id: currentUser.id,
          nome: currentUser.nome,
          cargo: currentUser.cargo || (currentUser.role === 'ADMINISTRADOR' ? 'Administrador' : currentUser.role === 'GERENCIA' ? 'Gerência' : 'Líder Operacional'),
          unidade_nome: currentUser.unidade_nome,
          role: currentUser.role,
        });
        setJustConfirmed(true);
        if (onConfirmReading) {
          onConfirmReading(report.id);
        }
      } catch (err) {
        console.error('Erro ao confirmar leitura:', err);
      } finally {
        setIsConfirming(false);
      }
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 1000);
  };

  const handleDownload = () => {
    if (isPdf && pdfSource) {
      const a = document.createElement('a');
      a.href = pdfSource;
      a.download = report.arquivo_pdf_nome || `${report.titulo.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Generate downloadable text/PDF-compatible blob
    const content = report.arquivo_pdf_conteudo || report.descricao || report.titulo;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.arquivo_pdf_nome || `${report.titulo.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formattedConfirmDate = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div
      id="report-viewer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    >
      <div
        id="report-viewer-modal-container"
        className="relative w-full max-w-5xl max-h-[94vh] bg-stone-900 text-stone-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-800"
      >
        {/* Header Toolbar */}
        <div
          id="report-viewer-header"
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-stone-950 border-b border-stone-800"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#C76B4A]/20 flex items-center justify-center text-[#C76B4A] shrink-0 border border-[#C76B4A]/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-stone-800 text-stone-300 border border-stone-700">
                  {report.tipo}
                </span>
                <span className="text-xs text-stone-400">
                  Ref: {report.periodo}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 truncate mt-0.5">
                {report.titulo}
              </h2>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-stone-900 border border-stone-800 rounded-lg p-1 mr-2">
              <button
                id="btn-zoom-out"
                onClick={() => setZoomLevel((prev) => Math.max(75, prev - 15))}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono text-stone-300 min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              <button
                id="btn-zoom-in"
                onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {canDownloadPrint && (
              <>
                <button
                  id="btn-print-report"
                  onClick={handlePrint}
                  className="p-2 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border border-stone-700"
                  title="Imprimir Relatório"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>

                <button
                  id="btn-download-report"
                  onClick={handleDownload}
                  className="p-2 text-white bg-[#C76B4A] hover:bg-[#b55e3e] rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm"
                  title="Baixar PDF / Arquivo"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo</span>
                </button>
              </>
            )}

            <button
              id="btn-close-viewer"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors ml-1"
              title="Fechar Visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Reader Canvas Area */}
        <div
          id="report-viewer-body"
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-950/80 flex flex-col items-center"
        >
          {/* Print-Only Document Cover Header */}
          <div className="hidden print:block w-full mb-6 pb-4 border-b-2 border-[#C76B4A] text-stone-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C76B4A] text-white flex items-center justify-center font-bold text-xs">
                  CDL
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#C76B4A]">
                  Central do Líder • Gestão Operacional
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">
                Emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 mt-3">{report.titulo}</h1>
            {report.descricao && (
              <p className="text-xs text-stone-600 mt-1">{report.descricao}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-stone-600 mt-2">
              <span><strong>Tipo:</strong> {report.tipo}</span>
              <span><strong>Período:</strong> {report.periodo}</span>
              <span><strong>Publicação:</strong> {new Date(report.data_publicacao).toLocaleDateString('pt-BR')}</span>
              <span><strong>Leituras Confirmadas:</strong> {confirmations.length}</span>
            </div>
          </div>

          {isPdf ? (
            /* High-Fidelity Continuous Multi-Page PDF Viewer (Adapts to Portrait/Landscape and Continuous Flow) */
            <div className="w-full max-w-5xl flex flex-col gap-6">
              {/* PDF Header Info Bar */}
              <div className="w-full bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold text-xs border border-[#C76B4A]/20">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-sm truncate max-w-xs sm:max-w-md">
                      {report.arquivo_pdf_nome || `${report.titulo}.pdf`}
                    </div>
                    <div className="text-stone-500 text-[11px] flex items-center gap-2 mt-0.5">
                      <span>Ref: <strong>{report.periodo}</strong></span>
                      <span>•</span>
                      <span>{report.tipo}</span>
                      {report.arquivo_pdf_tamanho && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-stone-400">{report.arquivo_pdf_tamanho}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-stone-500">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Publicação Oficial
                  </span>
                  <div className="text-[10px] text-stone-400 mt-1">
                    {new Date(report.data_publicacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Continuous Multi-Page PDF Canvas Viewer */}
              <PdfContinuousViewer
                pdfSource={pdfSource}
                zoomLevel={zoomLevel}
                reportTitle={report.titulo}
                onDownload={canDownloadPrint ? handleDownload : undefined}
              />

              {/* Confirmed Readings Section (Included in View and Print) */}
              <div
                id="report-confirmations-section"
                className="w-full bg-white text-stone-900 shadow-xl rounded-2xl p-6 sm:p-8 border border-stone-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">
                        Leituras Confirmadas ({confirmations.length})
                      </h4>
                      <p className="text-xs text-stone-500">
                        Registro oficial de cientes e confirmações de leitura deste documento
                      </p>
                    </div>
                  </div>
                </div>

                {confirmations.length === 0 ? (
                  <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-400 italic">
                    Nenhuma confirmação de leitura registrada para este relatório ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {confirmations.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-stone-900 block">{c.usuario_nome}</strong>
                          <span className="text-[11px] text-stone-600">
                            {c.usuario_cargo || 'Líder'} {c.unidade_nome ? `• ${c.unidade_nome}` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold block">
                            Confirmado
                          </span>
                          <span className="text-[10px] text-stone-500 mt-0.5 block">
                            {formattedConfirmDate(c.data_hora || (c as any).data_confirmacao)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Thread for Report - Positioned strictly at the end of the PDF in the natural scroll flow */}
              <div
                id="report-comments-section"
                className="w-full bg-white text-stone-900 shadow-xl rounded-2xl p-6 sm:p-8 border border-stone-200"
              >
                <CommentsThread
                  itemTipo="RELATORIO"
                  itemId={report.id}
                  itemTitulo={report.titulo}
                  compact={false}
                  showHeader={true}
                />
              </div>
            </div>
          ) : (
            /* Simulated High-Fidelity PDF Document Sheet (for markdown/text reports) */
            <div
              id="pdf-sheet"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-3xl bg-white text-stone-900 shadow-2xl rounded-lg p-8 sm:p-12 transition-transform duration-150 min-h-[680px] border border-stone-200"
            >
              {/* Document Header */}
              <div className="border-b-2 border-[#C76B4A] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#C76B4A] text-white flex items-center justify-center font-bold text-xs">
                      CDL
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C76B4A]">
                      Central do Líder • Gestão Operacional
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                    {report.titulo}
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    {report.descricao}
                  </p>
                </div>

                <div className="text-right shrink-0 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
                  <div className="text-stone-400 uppercase font-semibold text-[10px]">
                    Publicação Oficial
                  </div>
                  <div className="font-bold text-stone-800 mt-0.5">
                    {new Date(report.data_publicacao).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    {report.arquivo_pdf_tamanho || 'Documento Oficial'}
                  </div>
                </div>
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-stone-100 rounded-xl mb-8 border border-stone-200/80 text-xs">
                <div>
                  <span className="text-stone-500 block text-[11px]">Tipo de Relatório</span>
                  <strong className="text-stone-800 font-semibold">{report.tipo}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Período de Referência</span>
                  <strong className="text-stone-800 font-semibold">{report.periodo}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Público Alvo</span>
                  <strong className="text-stone-800 font-semibold">
                    {report.publico_tipo === 'TODOS'
                      ? 'Todos os Líderes'
                      : report.publico_tipo === 'UNIDADES'
                      ? 'Unidades Específicas'
                      : 'Líderes Específicos'}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Status</span>
                  <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Publicado
                  </strong>
                </div>
              </div>

              {/* Structured Report Content */}
              <div className="prose prose-stone max-w-none text-sm text-stone-800 leading-relaxed space-y-4">
                {report.arquivo_pdf_conteudo ? (
                  <div className="whitespace-pre-wrap font-sans text-stone-800 leading-relaxed">
                    {report.arquivo_pdf_conteudo}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>
                      Este relatório formal consolida os indicadores, metas atingidas e planos de ação
                      referentes ao período de <strong>{report.periodo}</strong> para acompanhamento
                      estratégico da administração e execução dos líderes operacionais.
                    </p>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                      <strong>Atenção aos Líderes:</strong> A leitura deste documento é obrigatória para
                      alinhamento das rotinas de abertura, auditorias sanitárias e procedimentos de fechamento.
                    </div>
                    <p>
                      Para dúvidas ou orientações adicionais, utilize a aba de comentários ou solicite suporte
                      direto junto à Diretoria de Operações.
                    </p>
                  </div>
                )}
              </div>

              {/* Document Signature & Official Stamp */}
              <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C76B4A]" />
                  <span>Documento autêntico gerado pela Central do Líder • Id: {report.id}</span>
                </div>
                <div className="text-right">
                  Página 1 de 1 • Registro Central
                </div>
              </div>

              {/* Confirmed Readings Section for Text/Markdown Reports */}
              <div
                id="report-confirmations-section-text"
                className="mt-8 pt-6 border-t border-stone-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">
                        Leituras Confirmadas ({confirmations.length})
                      </h4>
                      <p className="text-xs text-stone-500">
                        Registro oficial de cientes e confirmações de leitura deste documento
                      </p>
                    </div>
                  </div>
                </div>

                {confirmations.length === 0 ? (
                  <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-400 italic">
                    Nenhuma confirmação de leitura registrada para este relatório ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {confirmations.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-stone-900 block">{c.usuario_nome}</strong>
                          <span className="text-[11px] text-stone-600">
                            {c.usuario_cargo || 'Líder'} {c.unidade_nome ? `• ${c.unidade_nome}` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold block">
                            Confirmado
                          </span>
                          <span className="text-[10px] text-stone-500 mt-0.5 block">
                            {formattedConfirmDate(c.data_hora || (c as any).data_confirmacao)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Thread for Report */}
              <div className="mt-8 pt-6 border-t border-stone-200">
                <CommentsThread
                  itemTipo="RELATORIO"
                  itemId={report.id}
                  itemTitulo={report.titulo}
                  compact={false}
                  showHeader={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar with "Confirmo que li este relatório" Checkbox (Universal for all roles) */}
        <div
          id="report-viewer-footer"
          className="p-4 sm:p-5 bg-stone-900 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {currentUser ? (
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950/80 p-3.5 rounded-xl border border-stone-800">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="checkbox-confirm-read"
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="checkbox-confirm-read"
                    checked={isConfirmed}
                    onChange={handleCheckboxChange}
                    disabled={isConfirmed || isConfirming}
                    className="w-5 h-5 rounded border-stone-700 text-[#C76B4A] focus:ring-[#C76B4A] bg-stone-800 disabled:opacity-80 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                      Confirmo que li este relatório
                      {currentUser.role !== 'LIDER' && (
                        <span className="text-xs text-stone-400 font-normal">
                          ({currentUser.role === 'ADMINISTRADOR' ? 'Administração' : 'Gerência'} • Leitura Opcional)
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Confirmado
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-stone-400 block">
                      {isConfirmed
                        ? `Leitura registrada por ${userConfirmation?.usuario_nome || currentUser.nome} em ${formattedConfirmDate(userConfirmation?.data_hora || (userConfirmation as any)?.data_confirmacao || new Date().toISOString())}`
                        : currentUser.role === 'LIDER'
                        ? 'Marque a caixa acima para registrar seu ciente oficial à Administração.'
                        : 'Marque a caixa acima para registrar sua confirmação de leitura deste documento.'}
                    </span>
                  </div>
                </label>
              </div>

              {isConfirmed ? (
                <div className="text-xs text-emerald-400 font-medium shrink-0 flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ciente registrado no sistema</span>
                </div>
              ) : (
                <div className="text-xs text-stone-400 flex items-center gap-1.5 shrink-0">
                  <Eye className="w-4 h-4 text-[#C76B4A]" />
                  <span>{confirmations.length} confirmação(ões) total</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C76B4A]" />
                <span>
                  <strong>{report.total_leituras || confirmations.length}</strong> confirmações de leitura registradas
                </span>
              </div>
              <div className="text-stone-400">
                Visualização de Documento
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
