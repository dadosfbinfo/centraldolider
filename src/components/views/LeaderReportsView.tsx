import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Calendar,
  Search,
  Building2,
  ShieldCheck,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';
import { Relatorio, ReportType } from '../../types/database';
import { ReportViewerModal } from '../reports/ReportViewerModal';

export const LeaderReportsView: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Relatorio[]>([]);
  const [selectedTab, setSelectedTab] = useState<ReportType | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [readingReport, setReadingReport] = useState<Relatorio | null>(null);

  const loadReports = () => {
    if (!user) return;
    const userReports = dbStore.getReportsForUser(user);
    setReports(userReports);
  };

  useEffect(() => {
    loadReports();
    const unsubscribe = dbStore.subscribe(() => {
      loadReports();
      // If reading modal is open, keep report state updated
      if (readingReport) {
        const fresh = dbStore.getReports().find((r) => r.id === readingReport.id);
        if (fresh) setReadingReport(fresh);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchTab = selectedTab === 'TODOS' || r.tipo === selectedTab;
      const matchSearch =
        searchTerm === '' ||
        r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.descricao && r.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchTab && matchSearch;
    });
  }, [reports, selectedTab, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    if (!user) return { total: 0, confirmed: 0, pending: 0 };
    const total = reports.length;
    const confirmed = reports.filter((r) =>
      r.confirmacoes_leitura?.some((c) => c.usuario_id === user.id)
    ).length;
    return {
      total,
      confirmed,
      pending: total - confirmed,
    };
  }, [reports, user]);

  const handleOpenViewer = (report: Relatorio) => {
    setReadingReport(report);
  };

  const handleDownloadDirect = (e: React.MouseEvent, report: Relatorio) => {
    e.stopPropagation();
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

  const formatDateTime = (isoDate?: string) => {
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
    <div id="leader-reports-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C76B4A] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Biblioteca Operacional</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Relatórios & Diretrizes
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Consulte os relatórios diários, semanais e mensais da administração, visualize em tela cheia e registre sua confirmação de leitura.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>{stats.confirmed}</strong> Lidos
            </span>
          </div>
          {stats.pending > 0 && (
            <div className="px-3 py-2 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-800 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>
                <strong>{stats.pending}</strong> Pendentes de Leitura
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Periodicity Sub-tabs */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 overflow-x-auto">
          {(
            [
              { id: 'TODOS', label: 'Todos os Relatórios' },
              { id: 'DIARIO', label: 'Diários' },
              { id: 'SEMANAL', label: 'Semanais' },
              { id: 'MENSAL', label: 'Mensais' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              id={`tab-report-${tab.id.toLowerCase()}`}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 text-stone-700">
                {tab.id === 'TODOS'
                  ? reports.length
                  : reports.filter((r) => r.tipo === tab.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            id="input-search-leader-reports"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou período..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C76B4A] shadow-xs"
          />
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">Nenhum relatório encontrado</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente buscar com outros termos ou selecione outra categoria.'
              : 'Não há relatórios publicados para o seu perfil nesta periodicidade.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const userConfirmation = user
              ? report.confirmacoes_leitura?.find((c) => c.usuario_id === user.id)
              : undefined;
            const isConfirmed = !!userConfirmation;

            return (
              <div
                key={report.id}
                id={`card-report-${report.id}`}
                onClick={() => handleOpenViewer(report)}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs cursor-pointer flex flex-col justify-between group hover:shadow-md ${
                  isConfirmed
                    ? 'border-stone-200 hover:border-emerald-300'
                    : 'border-orange-300/80 bg-orange-50/20 hover:border-orange-400'
                }`}
              >
                <div>
                  {/* Top tags & status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                        {report.tipo}
                      </span>
                      <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.periodo}
                      </span>
                    </div>

                    {isConfirmed ? (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lido
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-900 border border-orange-300 shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Leitura Pendente
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-[#C76B4A] transition-colors leading-snug mb-1.5">
                    {report.titulo}
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-2 mb-4 leading-relaxed">
                    {report.descricao}
                  </p>
                </div>

                {/* Footer bar */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-stone-400">
                    {isConfirmed ? (
                      <span className="text-emerald-700 font-medium">
                        Confirmado em {formatDateTime(userConfirmation.data_hora)}
                      </span>
                    ) : (
                      <span className="text-orange-800 font-medium">
                        Clique para ler e confirmar no sistema
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadDirect(e, report)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Baixar Arquivo"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <span className="inline-flex items-center gap-1 text-[#C76B4A] font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded In-System PDF Viewer Modal */}
      <ReportViewerModal
        report={readingReport}
        currentUser={user}
        isOpen={!!readingReport}
        onClose={() => setReadingReport(null)}
        onConfirmReading={(reportId) => {
          loadReports();
        }}
      />
    </div>
  );
};
