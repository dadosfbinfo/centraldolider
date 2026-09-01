import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Upload,
  Calendar,
  Building2,
  X,
  Clock,
  Download,
  BookOpen,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { dbStore } from '../../services/dbStore';
import {
  Relatorio,
  ReportType,
  ReportAudienceType,
  Unidade,
  UsuarioPerfil,
  ConfirmacaoLeituraRelatorio,
} from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { ReportViewerModal } from '../reports/ReportViewerModal';

export const ReportsManagementView: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Relatorio[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [leaders, setLeaders] = useState<UsuarioPerfil[]>([]);

  // Filter states
  const [selectedType, setSelectedType] = useState<ReportType | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<Relatorio | null>(null);
  const [viewingReport, setViewingReport] = useState<Relatorio | null>(null);
  const [confirmationsModalReport, setConfirmationsModalReport] = useState<Relatorio | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'MENSAL' as ReportType,
    periodo: 'Setembro / 2026',
    data_publicacao: new Date().toISOString().split('T')[0],
    publicado: true,
    publico_tipo: 'TODOS' as ReportAudienceType,
    unidades_alvo: [] as string[],
    lideres_alvo: [] as string[],
    descricao: '',
    arquivo_pdf_nome: 'Relatorio_Setembro_2026.pdf',
    arquivo_pdf_tamanho: '2.5 MB',
    arquivo_pdf_conteudo: '',
  });

  const loadData = () => {
    setReports(dbStore.getReports());
    setUnits(dbStore.getUnits());
    setLeaders(dbStore.getUsers().filter((u) => u.role === 'LIDER'));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(() => {
      loadData();
      if (confirmationsModalReport) {
        const fresh = dbStore.getReports().find((r) => r.id === confirmationsModalReport.id);
        if (fresh) setConfirmationsModalReport(fresh);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingReport(null);
    setFormData({
      titulo: '',
      tipo: 'MENSAL',
      periodo: 'Setembro / 2026',
      data_publicacao: new Date().toISOString().split('T')[0],
      publicado: true,
      publico_tipo: 'TODOS',
      unidades_alvo: [],
      lideres_alvo: [],
      descricao: '',
      arquivo_pdf_nome: 'Relatorio_Setembro_2026.pdf',
      arquivo_pdf_tamanho: '2.5 MB',
      arquivo_pdf_conteudo: `# CENTRAL DO LÍDER — RELATÓRIO OPERACIONAL
## Período: Setembro / 2026

### 1. OBJETIVO DO DOCUMENTO
Apresentação das diretrizes e acompanhamento dos indicadores operacionais da rede.

### 2. PRINCIPAIS DESTAQUES
- Cumprimento de ordens de serviço preventivas
- Controle de qualidade e vistorias sanitárias
- Metas de produção e atendimento`,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (report: Relatorio) => {
    setEditingReport(report);
    setFormData({
      titulo: report.titulo,
      tipo: report.tipo,
      periodo: report.periodo,
      data_publicacao: report.data_publicacao,
      publicado: report.publicado,
      publico_tipo: report.publico_tipo,
      unidades_alvo: report.unidades_alvo || [],
      lideres_alvo: report.lideres_alvo || [],
      descricao: report.descricao || '',
      arquivo_pdf_nome: report.arquivo_pdf_nome || 'Relatorio.pdf',
      arquivo_pdf_tamanho: report.arquivo_pdf_tamanho || '2.0 MB',
      arquivo_pdf_conteudo: report.arquivo_pdf_conteudo || '',
    });
    setIsFormModalOpen(true);
  };

  const handleTogglePublish = (id: string) => {
    dbStore.toggleReportPublished(id);
  };

  const handleDeleteReport = (id: string, title: string) => {
    if (window.confirm(`Deseja realmente excluir o relatório "${title}"?`)) {
      dbStore.deleteReport(id);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      alert('Por favor, informe o título do relatório.');
      return;
    }

    const payload = {
      titulo: formData.titulo.trim(),
      tipo: formData.tipo,
      periodo: formData.periodo.trim(),
      data_publicacao: formData.data_publicacao,
      publicado: formData.publicado,
      publico_tipo: formData.publico_tipo,
      unidades_alvo: formData.unidades_alvo,
      lideres_alvo: formData.lideres_alvo,
      descricao: formData.descricao.trim(),
      arquivo_pdf_nome: formData.arquivo_pdf_nome,
      arquivo_pdf_tamanho: formData.arquivo_pdf_tamanho,
      arquivo_pdf_conteudo: formData.arquivo_pdf_conteudo,
    };

    if (editingReport) {
      dbStore.updateReport(editingReport.id, payload);
    } else {
      dbStore.createReport(payload);
    }

    setIsFormModalOpen(false);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchType = selectedType === 'TODOS' || r.tipo === selectedType;
      const matchSearch =
        searchTerm === '' ||
        r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.descricao && r.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchType && matchSearch;
    });
  }, [reports, selectedType, searchTerm]);

  // Overall reading statistics
  const summary = useMemo(() => {
    const total = reports.length;
    const published = reports.filter((r) => r.publicado).length;
    const drafts = total - published;
    let totalConfirmations = 0;
    reports.forEach((r) => {
      totalConfirmations += r.confirmacoes_leitura?.length || 0;
    });

    return {
      total,
      published,
      drafts,
      totalConfirmations,
    };
  }, [reports]);

  // Calculate target audience & pendencies for the confirmations modal
  const getConfirmationAudit = (report: Relatorio) => {
    let eligibleLeaders: UsuarioPerfil[] = [];
    if (report.publico_tipo === 'TODOS') {
      eligibleLeaders = leaders;
    } else if (report.publico_tipo === 'UNIDADES' && report.unidades_alvo) {
      eligibleLeaders = leaders.filter((l) => l.unidade_id && report.unidades_alvo?.includes(l.unidade_id));
    } else if (report.publico_tipo === 'LIDERES' && report.lideres_alvo) {
      eligibleLeaders = leaders.filter((l) => report.lideres_alvo?.includes(l.id));
    }

    const confirmations = report.confirmacoes_leitura || [];
    const confirmedLeaderIds = confirmations.map((c) => c.usuario_id);

    const pendingLeaders = eligibleLeaders.filter((l) => !confirmedLeaderIds.includes(l.id));

    return {
      eligibleLeaders,
      confirmations,
      pendingLeaders,
      confirmationRate:
        eligibleLeaders.length > 0
          ? Math.round((confirmations.length / eligibleLeaders.length) * 100)
          : 0,
    };
  };

  return (
    <div id="reports-management-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C76B4A] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Administração Geral</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Gestão de Relatórios & PDFs
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Cadastre relatórios diários, semanais e mensais, defina o público de acesso, publique arquivos e acompanhe as confirmações de leitura dos líderes.
          </p>
        </div>

        <button
          id="btn-create-report"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar Novo Relatório</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total de Relatórios</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{summary.total}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">No acervo corporativo</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Publicados & Ativos</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{summary.published}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Disponíveis para os líderes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Rascunhos / Ocultos</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{summary.drafts}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Não visíveis para a equipe</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Leituras Confirmadas</span>
          <div className="text-2xl font-black text-[#C76B4A] mt-1">{summary.totalConfirmations}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Registros com carimbo de data</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        {/* Type Tabs */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 overflow-x-auto">
          {(
            [
              { id: 'TODOS', label: 'Todos' },
              { id: 'DIARIO', label: 'Diários' },
              { id: 'SEMANAL', label: 'Semanais' },
              { id: 'MENSAL', label: 'Mensais' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === t.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            id="input-search-admin-reports"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou período..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Relatório & Período</th>
                <th className="px-4 py-3.5">Tipo</th>
                <th className="px-4 py-3.5">Público de Acesso</th>
                <th className="px-4 py-3.5">Status Publicação</th>
                <th className="px-4 py-3.5">Leituras</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    Nenhum relatório cadastrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const audit = getConfirmationAudit(report);
                  return (
                    <tr key={report.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-stone-900 text-sm max-w-sm truncate">
                          {report.titulo}
                        </div>
                        <div className="text-[11px] text-stone-600 mt-0.5 flex items-center gap-2">
                          <span>Ref: {report.periodo}</span>
                          <span>•</span>
                          <span>Pub: {new Date(report.data_publicacao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                          {report.tipo}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-stone-700">
                        {report.publico_tipo === 'TODOS' ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5 text-[#C76B4A]" /> Todos os Líderes
                          </span>
                        ) : report.publico_tipo === 'UNIDADES' ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-stone-500" />
                            {report.unidades_alvo?.length || 0} Unidades
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5 text-stone-500" />
                            {report.lideres_alvo?.length || 0} Líderes
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(report.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                            report.publicado
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                          title="Clique para alternar entre Publicado e Rascunho"
                        >
                          {report.publicado ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Publicado</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>Rascunho</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => setConfirmationsModalReport(report)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-orange-50 text-stone-800 hover:text-orange-950 font-bold rounded-lg border border-stone-200 transition-colors"
                          title="Clique para ver quem leu e quem está pendente"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#C76B4A]" />
                          <span>
                            {audit.confirmations.length} / {audit.eligibleLeaders.length}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingReport(report)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Abrir no Visualizador"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(report)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Editar Informações"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id, report.titulo)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir Relatório"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmations Log Modal */}
      {confirmationsModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Rastreabilidade de Leitura
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {confirmationsModalReport.titulo}
                </p>
              </div>
              <button
                onClick={() => setConfirmationsModalReport(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit content */}
            {(() => {
              const audit = getConfirmationAudit(confirmationsModalReport);
              return (
                <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                  {/* Summary progress */}
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-stone-500 block">Taxa de Adesão</span>
                      <strong className="text-sm font-bold text-stone-900">
                        {audit.confirmations.length} de {audit.eligibleLeaders.length} líderes confirmaram a leitura
                      </strong>
                    </div>
                    <span className="px-3 py-1 bg-orange-50 text-orange-950 font-bold rounded-lg border border-orange-200 text-sm">
                      {audit.confirmationRate}%
                    </span>
                  </div>

                  {/* Confirmed list */}
                  <div>
                    <h4 className="font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Líderes que Confirmaram ({audit.confirmations.length})
                    </h4>
                    {audit.confirmations.length === 0 ? (
                      <p className="text-stone-600 text-xs italic bg-stone-50 p-3 rounded-lg">
                        Nenhuma confirmação registrada até o momento.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {audit.confirmations.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-stone-900 font-semibold">{c.usuario_nome}</strong>
                              <span className="text-stone-600 text-[11px] block">
                                {c.usuario_cargo || 'Líder'} • {c.unidade_nome || 'Unidade Operacional'}
                              </span>
                            </div>
                            <div className="text-right text-[11px] text-emerald-800 font-medium">
                              {new Date(c.data_hora).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(c.data_hora).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending list */}
                  <div>
                    <h4 className="font-bold text-orange-900 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      Líderes com Leitura Pendente ({audit.pendingLeaders.length})
                    </h4>
                    {audit.pendingLeaders.length === 0 ? (
                      <p className="text-emerald-700 text-xs font-semibold bg-emerald-50 p-3 rounded-lg">
                        ✓ Todos os líderes com acesso já confirmaram a leitura!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {audit.pendingLeaders.map((l) => (
                          <div
                            key={l.id}
                            className="p-2.5 bg-orange-50/40 rounded-xl border border-orange-200/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-stone-800 font-medium">{l.nome}</strong>
                              <span className="text-stone-600 text-[11px] block">
                                {l.cargo || 'Líder'} • {l.unidade_nome || 'Sem unidade vinculada'}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-100 text-orange-900 border border-orange-200">
                              Pendente
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-4 border-t border-stone-100 flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setConfirmationsModalReport(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Report Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-lg font-black text-stone-900">
                {editingReport ? 'Editar Relatório' : 'Publicar Novo Relatório'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Título */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Título do Relatório *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Relatório Executivo Consolidado de Resultados - Agosto/2026"
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none font-medium"
                  required
                />
              </div>

              {/* Tipo & Período & Data de Publicação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Tipo de Periodicidade *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value as ReportType })
                    }
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                  >
                    <option value="DIARIO">Diário</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSAL">Mensal</option>
                    <option value="GERAL">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Período de Referência *
                  </label>
                  <input
                    type="text"
                    value={formData.periodo}
                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                    placeholder="Ex: Agosto / 2026, Semana 35"
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Data de Publicação *
                  </label>
                  <input
                    type="date"
                    value={formData.data_publicacao}
                    onChange={(e) => setFormData({ ...formData, data_publicacao: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Público de Acesso */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Público de Acesso *
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, publico_tipo: 'TODOS' })}
                    className={`p-2.5 rounded-xl border text-center font-semibold ${
                      formData.publico_tipo === 'TODOS'
                        ? 'border-[#C76B4A] bg-[#C76B4A]/10 text-[#C76B4A]'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Todos os Líderes
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, publico_tipo: 'UNIDADES' })}
                    className={`p-2.5 rounded-xl border text-center font-semibold ${
                      formData.publico_tipo === 'UNIDADES'
                        ? 'border-[#C76B4A] bg-[#C76B4A]/10 text-[#C76B4A]'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Unidades Específicas
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, publico_tipo: 'LIDERES' })}
                    className={`p-2.5 rounded-xl border text-center font-semibold ${
                      formData.publico_tipo === 'LIDERES'
                        ? 'border-[#C76B4A] bg-[#C76B4A]/10 text-[#C76B4A]'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Líderes Específicos
                  </button>
                </div>

                {/* Sub selector if UNIDADES */}
                {formData.publico_tipo === 'UNIDADES' && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <span className="text-[11px] font-semibold text-stone-600 block">
                      Selecione as unidades que terão acesso:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                      {units.map((u) => {
                        const checked = formData.unidades_alvo.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className="flex items-center gap-2 p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer text-xs text-stone-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...formData.unidades_alvo, u.id]
                                  : formData.unidades_alvo.filter((id) => id !== u.id);
                                setFormData({ ...formData, unidades_alvo: next });
                              }}
                              className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                            />
                            <span className="truncate">{u.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub selector if LIDERES */}
                {formData.publico_tipo === 'LIDERES' && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <span className="text-[11px] font-semibold text-stone-600 block">
                      Selecione os líderes que terão acesso:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                      {leaders.map((l) => {
                        const checked = formData.lideres_alvo.includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className="flex items-center gap-2 p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer text-xs text-stone-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...formData.lideres_alvo, l.id]
                                  : formData.lideres_alvo.filter((id) => id !== l.id);
                                setFormData({ ...formData, lideres_alvo: next });
                              }}
                              className="rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                            />
                            <span className="truncate">
                              {l.nome} ({l.unidade_nome || 'Sem unidade'})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Resumo / Instruções para Leitura
                </label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Instruções para a equipe de líderes..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                />
              </div>

              {/* Upload de PDF & Conteúdo Visualizador */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Arquivo PDF & Conteúdo do Documento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-0.5">Nome do Arquivo</span>
                    <input
                      type="text"
                      value={formData.arquivo_pdf_nome}
                      onChange={(e) => setFormData({ ...formData, arquivo_pdf_nome: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-0.5">Tamanho do Arquivo</span>
                    <input
                      type="text"
                      value={formData.arquivo_pdf_tamanho}
                      onChange={(e) => setFormData({ ...formData, arquivo_pdf_tamanho: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900"
                    />
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={formData.arquivo_pdf_conteudo}
                  onChange={(e) => setFormData({ ...formData, arquivo_pdf_conteudo: e.target.value })}
                  placeholder="Texto ou formatação Markdown exibido no visualizador embutido..."
                  className="w-full font-mono px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Status de Publicação */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.publicado}
                    onChange={(e) => setFormData({ ...formData, publicado: e.target.checked })}
                    className="w-4 h-4 rounded text-[#C76B4A] focus:ring-[#C76B4A]"
                  />
                  <span className="font-semibold text-stone-800 text-xs">
                    Publicar imediatamente para visualização dos líderes
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  {editingReport ? 'Salvar Alterações' : 'Publicar Relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Viewer Modal for Admin Preview */}
      <ReportViewerModal
        report={viewingReport}
        currentUser={user}
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
};
