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
  FolderKanban,
  X,
  Clock,
  Download,
  BookOpen,
  ShieldCheck,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';
import { dbStore } from '../../services/dbStore';
import {
  Relatorio,
  ReportType,
  ReportAudienceType,
  Projeto,
  UsuarioPerfil,
  ConfirmacaoLeituraRelatorio,
} from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { ReportViewerModal } from '../reports/ReportViewerModal';
import { PeriodFilter, PeriodSelection, PeriodFilterValue, isDateInPeriod } from '../common/PeriodFilter';

export const ReportsManagementView: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Relatorio[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [leaders, setLeaders] = useState<UsuarioPerfil[]>([]);

  // Filter states
  const [selectedType, setSelectedType] = useState<ReportType | 'TODOS'>('TODOS');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [period, setPeriod] = useState<PeriodFilterValue>({
    mode: 'TODOS',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<Relatorio | null>(null);
  const [viewingReport, setViewingReport] = useState<Relatorio | null>(null);
  const [confirmationsModalReport, setConfirmationsModalReport] = useState<Relatorio | null>(null);

  // Form states (PDF ONLY)
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
    arquivo_pdf_nome: 'Relatorio_Operacional_Setembro_2026.pdf',
    arquivo_pdf_tamanho: '2.4 MB',
    arquivo_pdf_url: '',
    arquivo_pdf_conteudo: 'Documento Operacional PDF',
  });

  const loadData = () => {
    setReports(dbStore.getReportsForUser(user));
    setProjects(dbStore.getProjects());
    let allLeaders = dbStore.getUsers().filter((u) => u.role === 'LIDER');
    if (user?.role === 'GERENCIA') {
      const managedLeaderIds = dbStore.getManagedLeaderIds(user.id);
      allLeaders = allLeaders.filter((l) => managedLeaderIds.has(l.id));
    }
    setLeaders(allLeaders);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(() => {
      loadData();
      if (confirmationsModalReport) {
        const fresh = dbStore.getReportsForUser(user).find((r) => r.id === confirmationsModalReport.id);
        if (fresh) setConfirmationsModalReport(fresh);
      }
    });
    return () => unsubscribe();
  }, [user]);

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
      arquivo_pdf_nome: '',
      arquivo_pdf_tamanho: '',
      arquivo_pdf_url: '',
      arquivo_pdf_conteudo: '',
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
      arquivo_pdf_url: report.arquivo_pdf_url || '',
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

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione exclusivamente um arquivo no formato PDF (.pdf).');
      return;
    }

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setFormData((prev) => ({
        ...prev,
        arquivo_pdf_nome: file.name,
        arquivo_pdf_tamanho: sizeStr,
        arquivo_pdf_url: content,
        arquivo_pdf_conteudo: content,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      alert('Por favor, informe o título do relatório.');
      return;
    }

    if (!formData.arquivo_pdf_nome) {
      alert('Por favor, faça o upload do arquivo PDF do relatório.');
      return;
    }

    const reportPayload = {
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
      arquivo_pdf_url: formData.arquivo_pdf_url,
      arquivo_pdf_conteudo: formData.arquivo_pdf_conteudo,
    };

    if (editingReport) {
      dbStore.updateReport(editingReport.id, reportPayload);
    } else {
      if (formData.publico_tipo === 'LIDERES' && formData.lideres_alvo && formData.lideres_alvo.length > 1) {
        formData.lideres_alvo.forEach((liderId) => {
          dbStore.createReport({
            ...reportPayload,
            lideres_alvo: [liderId],
          });
        });
      } else {
        dbStore.createReport(reportPayload);
      }
    }

    setIsFormModalOpen(false);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchType = selectedType === 'TODOS' || report.tipo === selectedType;
      const matchSearch =
        searchTerm === '' ||
        report.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.descricao && report.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPeriod = isDateInPeriod(report.data_publicacao, period);

      const matchProject =
        selectedProjectId === 'TODOS' ||
        (report.unidades_alvo && report.unidades_alvo.includes(selectedProjectId)) ||
        (report as any).unidade_id === selectedProjectId ||
        (report as any).projeto_id === selectedProjectId;

      return matchType && matchSearch && matchPeriod && matchProject;
    });
  }, [reports, selectedType, selectedProjectId, searchTerm, period]);

  // Overall metrics
  const metrics = useMemo(() => {
    const total = reports.length;
    const published = reports.filter((r) => r.publicado).length;
    const totalConfirmations = reports.reduce((acc, r) => acc + (r.total_leituras || 0), 0);
    return {
      total,
      published,
      drafts: total - published,
      totalConfirmations,
    };
  }, [reports]);

  return (
    <div id="reports-management-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C76B4A] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Administração Geral</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Gestão de Relatórios Operacionais
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Faça upload exclusivo de relatórios em PDF, publique para líderes e projetos e acompanhe as confirmações de leitura com carimbo de data e hora.
          </p>
        </div>

        <button
          id="btn-create-report"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C76B4A] hover:bg-[#b55e3e] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Relatório (Upload PDF)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total de Relatórios</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{metrics.total}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Documentos cadastrados</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Publicados</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-2">
            {metrics.published}
          </div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Visíveis para líderes</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Rascunhos</span>
          <div className="text-2xl font-black text-stone-500 mt-1">{metrics.drafts}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Aguardando publicação</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Confirmações de Leitura</span>
          <div className="text-2xl font-black text-[#C76B4A] mt-1">{metrics.totalConfirmations}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">Assinaturas registradas</span>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
          <Calendar className="w-4 h-4 text-[#C76B4A]" />
          <span>Filtro de Período da Publicação:</span>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Type Tabs */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 overflow-x-auto">
            {(
              [
                { id: 'TODOS', label: 'Todos' },
                { id: 'MENSAL', label: 'Mensais' },
                { id: 'SEMANAL', label: 'Semanais' },
                { id: 'TRIMESTRAL', label: 'Trimestrais' },
                { id: 'EVENTUAL', label: 'Eventuais' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                id={`filter-report-${t.id.toLowerCase()}`}
                onClick={() => setSelectedType(t.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedType === t.id
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              id="input-search-reports"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título ou período..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]"
            />
          </div>
        </div>

        {/* Project Filter Dropdown */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-600 whitespace-nowrap">Filtrar por Projeto:</label>
          <select
            id="select-filter-report-project"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C76B4A]"
          >
            <option value="TODOS">Todos os Projetos</option>
            {projects.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Título & Período</th>
                <th className="px-4 py-3.5">Público-Alvo</th>
                <th className="px-4 py-3.5">Arquivo PDF</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Leituras Confirmadas</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    Nenhum relatório encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const confirmations = report.confirmacoes_leitura || [];
                  return (
                    <tr key={report.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                            {report.tipo}
                          </span>
                          <strong className="text-stone-900 text-sm">{report.titulo}</strong>
                        </div>
                        <div className="text-[11px] text-stone-600 mt-0.5 flex items-center gap-2">
                          <span>Ref: {report.periodo}</span>
                          <span>•</span>
                          <span>Pub: {report.data_publicacao}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-stone-100 text-stone-700 border border-stone-200 inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#C76B4A]" />
                          {report.publico_tipo === 'TODOS'
                            ? 'Todos os Líderes'
                            : report.publico_tipo === 'UNIDADES'
                            ? `${report.unidades_alvo?.length || 0} Projeto(s)`
                            : `${report.lideres_alvo?.length || 0} Líder(es)`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-stone-800">
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                            PDF
                          </span>
                          <span className="truncate max-w-[140px]" title={report.arquivo_pdf_nome}>
                            {report.arquivo_pdf_nome || 'Arquivo.pdf'}
                          </span>
                          <span className="text-[10px] text-stone-600 font-normal">
                            ({report.arquivo_pdf_tamanho || '1.2 MB'})
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(report.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border inline-flex items-center gap-1 transition ${
                            report.publicado
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                        >
                          {report.publicado ? (
                            <>
                              <Eye className="w-3 h-3" /> Publicado
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Rascunho
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => setConfirmationsModalReport(report)}
                          className="group inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-orange-50 text-stone-900 hover:text-orange-950 font-bold rounded-xl border border-stone-200 hover:border-orange-300 transition"
                          title="Clique para ver lista de quem confirmou leitura"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{confirmations.length} confirmação(ões)</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingReport(report)}
                            className="p-1.5 text-[#C76B4A] hover:text-[#b55e3e] hover:bg-orange-50 rounded-lg transition"
                            title="Visualizar Relatório PDF"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(report)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                            title="Editar Dados do Relatório"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id, report.titulo)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
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

      {/* Form Modal (Create / Edit Report with PDF Upload ONLY) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#C76B4A]/10 text-[#C76B4A]">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-stone-900">
                  {editingReport ? 'Editar Relatório PDF' : 'Publicar Novo Relatório (Upload PDF)'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Titulo */}
              <div>
                <label className="font-bold text-stone-700 mb-1 block">
                  Título do Relatório *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Relatório Mensal de Operações - Setembro / 2026"
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none font-semibold"
                  required
                />
              </div>

              {/* Tipo, Período & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Frequência / Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ReportType })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none font-semibold"
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="EVENTUAL">Eventual</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 mb-1 block">
                    Período de Referência *
                  </label>
                  {formData.tipo === 'MENSAL' ? (
                    <select
                      value={formData.periodo}
                      onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#C76B4A] focus:outline-none font-medium"
                      required
                    >
                      {(() => {
                        const today = new Date();
                        const monthNames = [
                          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                        ];
                        const list: { label: string; value: string }[] = [];
                        for (let offset = -1; offset <= 12; offset++) {
                          const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
                          const mName = monthNames[d.getMonth()];
                          const yr = d.getFullYear();
                          const value = `${mName} / ${yr}`;
                          let tag = '';
                          if (offset === -1) tag = ' (Mês Anterior)';
                          else if (offset === 0) tag = ' (Mês Atual)';
                          list.push({ value, label: `${value}${tag}` });
                        }

                        return list.map((item) => (
                          <option key={item.label} value={item.value}>
                            {item.label}
                          </option>
                        ));
                      })()}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.periodo}
                      onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                      placeholder="Ex: Semana 36 / 2026, 3º Trimestre 2026..."
                      className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                      required
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-stone-700 block">
                      Data de Publicação
                    </label>
                    <span className="text-[10px] text-stone-400 font-bold bg-stone-100 px-1.5 py-0.5 rounded">
                      Hoje (Automática)
                    </span>
                  </div>
                  <input
                    type="date"
                    readOnly
                    disabled
                    value={formData.data_publicacao}
                    className="w-full px-3 py-2 text-xs bg-stone-100 rounded-xl border border-stone-200 text-stone-600 font-semibold cursor-not-allowed select-none"
                    title="A data de publicação é fixada na data atual de cadastro."
                  />
                </div>
              </div>

              {/* PDF File Upload Zone (Exclusive) */}
              <div className="p-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 space-y-2">
                <label className="font-bold text-stone-800 block text-xs flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#C76B4A]" />
                  Arquivo do Relatório em PDF (.pdf) *
                </label>
                <p className="text-[11px] text-stone-500">
                  Faça o upload do documento oficial em PDF diagramado para disponibilização aos líderes.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#C76B4A] file:text-white hover:file:bg-[#b55e3e] cursor-pointer"
                  />
                </div>

                {formData.arquivo_pdf_nome && (
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">
                        PDF
                      </span>
                      <span className="font-semibold text-stone-800">{formData.arquivo_pdf_nome}</span>
                      <span className="text-[10px] text-stone-600">({formData.arquivo_pdf_tamanho})</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                )}
              </div>

              {/* Público-Alvo */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-700 block">
                  Definição do Público-Alvo (Quem pode visualizar)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TODOS', label: 'Todos os Líderes' },
                    { id: 'UNIDADES', label: 'Projetos Específicos' },
                    { id: 'LIDERES', label: 'Líderes Específicos' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, publico_tipo: p.id as any })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                        formData.publico_tipo === p.id
                          ? 'border-[#C76B4A] bg-[#C76B4A]/10 text-stone-900'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {formData.publico_tipo === 'UNIDADES' && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 mt-2">
                    <span className="text-[11px] font-semibold text-stone-700 block">
                      Selecione os Projetos autorizados:
                    </span>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {projects.map((proj) => {
                        const isChecked = formData.unidades_alvo.includes(proj.id);
                        return (
                          <label key={proj.id} className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, unidades_alvo: [...formData.unidades_alvo, proj.id] });
                                } else {
                                  setFormData({
                                    ...formData,
                                    unidades_alvo: formData.unidades_alvo.filter((id) => id !== proj.id),
                                  });
                                }
                              }}
                              className="rounded border-stone-300 text-[#C76B4A] focus:ring-[#C76B4A]"
                            />
                            <span className="truncate">{proj.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.publico_tipo === 'LIDERES' && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 mt-2">
                    <span className="text-[11px] font-semibold text-stone-700 block">
                      Selecione os Líderes autorizados:
                    </span>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {leaders.map((ldr) => {
                        const isChecked = formData.lideres_alvo.includes(ldr.id);
                        return (
                          <label key={ldr.id} className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, lideres_alvo: [...formData.lideres_alvo, ldr.id] });
                                } else {
                                  setFormData({
                                    ...formData,
                                    lideres_alvo: formData.lideres_alvo.filter((id) => id !== ldr.id),
                                  });
                                }
                              }}
                              className="rounded border-stone-300 text-[#C76B4A] focus:ring-[#C76B4A]"
                            />
                            <span className="truncate">{ldr.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição / Resumo */}
              <div>
                <label className="font-semibold text-stone-700 mb-1 block">
                  Resumo Executivo / Descrição
                </label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Orientações e destaques do relatório..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#C76B4A] focus:outline-none"
                />
              </div>

              {/* Publicado Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="checkbox-published"
                  checked={formData.publicado}
                  onChange={(e) => setFormData({ ...formData, publicado: e.target.checked })}
                  className="rounded border-stone-300 text-[#C76B4A] focus:ring-[#C76B4A]"
                />
                <label htmlFor="checkbox-published" className="font-bold text-stone-800 cursor-pointer text-xs">
                  Publicar imediatamente (ficará visível para os líderes designados)
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
                  {editingReport ? 'Salvar Alterações' : 'Salvar e Publicar Relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation List Modal */}
      {confirmationsModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    Confirmações de Leitura
                  </h3>
                  <p className="text-xs text-stone-500">
                    Relatório: <strong>{confirmationsModalReport.titulo}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmationsModalReport(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(confirmationsModalReport.confirmacoes_leitura || []).length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">
                  Nenhum líder confirmou a leitura deste relatório ainda.
                </div>
              ) : (
                (confirmationsModalReport.confirmacoes_leitura || []).map((c, i) => (
                  <div
                    key={i}
                    className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <strong className="text-stone-900 block">{c.usuario_nome}</strong>
                      <span className="text-[11px] text-stone-600">
                        {c.usuario_cargo || 'Líder'} {c.unidade_nome ? `• ${c.unidade_nome}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 block">
                        Confirmado em
                      </span>
                      <span className="text-[10px] text-stone-600 mt-0.5 block">
                        {new Date(c.data_confirmacao).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 mt-3 border-t border-stone-100">
              <button
                onClick={() => setConfirmationsModalReport(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <ReportViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        currentUser={user}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
};
