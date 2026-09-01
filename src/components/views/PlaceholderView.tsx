import React from 'react';
import { 
  CheckSquare, 
  Target, 
  Calendar, 
  FileText, 
  User, 
  Briefcase, 
  ClipboardList, 
  BarChart3, 
  CalendarDays,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
  FileCheck
} from 'lucide-react';
import { NavigationTab, useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';

interface PlaceholderViewProps {
  tab: NavigationTab;
  onOpenDatabaseSchema: () => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ tab, onOpenDatabaseSchema }) => {
  const { currentUser } = useAuth();
  const tasks = dbStore.getTasks();
  const goals = dbStore.getGoals();
  const reports = dbStore.getReports();
  const leaders = dbStore.getLeaders();
  const events = dbStore.getEvents();

  const getModuleInfo = () => {
    switch (tab) {
      case 'minhas-tarefas':
        return {
          title: 'Minhas Tarefas & Ordens de Serviço',
          category: 'Área do Líder',
          tableName: 'tarefas_os',
          icon: <CheckSquare className="w-6 h-6 text-[#C76B4A]" />,
          description: 'Módulo de execução e conferência de OS da unidade (será construído na Etapa 2/5). A estrutura de dados e campos no banco já estão 100% criados.',
          fields: ['numero_os', 'titulo', 'responsavel_id', 'unidade', 'data', 'horario', 'prazo', 'prioridade', 'categoria_id', 'status', 'tipo_conclusao_exigido', 'recorrencia'],
          itemsCount: tasks.length,
          previewType: 'tasks',
        };
      case 'minhas-metas':
        return {
          title: 'Minhas Metas & Indicadores',
          category: 'Área do Líder',
          tableName: 'metas',
          icon: <Target className="w-6 h-6 text-[#355C7D]" />,
          description: 'Acompanhamento de metas operacionais e SLAs da unidade (será construído na Etapa 3/5).',
          fields: ['indicador', 'meta_valor', 'valor_atual', 'unidade_medida', 'periodo', 'unidade_id', 'lider_id', 'status'],
          itemsCount: goals.length,
          previewType: 'goals',
        };
      case 'calendario':
      case 'admin-calendario':
        return {
          title: tab === 'calendario' ? 'Meu Calendário Operacional' : 'Calendário Geral de Unidades',
          category: tab === 'calendario' ? 'Área do Líder' : 'Administração',
          tableName: 'calendario_eventos',
          icon: <Calendar className="w-6 h-6 text-[#5B7DBE]" />,
          description: 'Agendamento de reuniões, vistorias, datas limites de relatórios e rotinas da rede.',
          fields: ['titulo', 'tipo', 'data', 'horario_inicio', 'horario_fim', 'unidade_id', 'lider_id', 'descricao', 'status'],
          itemsCount: events.length,
          previewType: 'events',
        };
      case 'relatorios':
      case 'admin-relatorios':
        return {
          title: tab === 'relatorios' ? 'Relatórios & Manuais Operacionais' : 'Gestão de Relatórios & Publicações',
          category: tab === 'relatorios' ? 'Área do Líder' : 'Administração',
          tableName: 'relatorios',
          icon: <FileText className="w-6 h-6 text-[#8B6B4A]" />,
          description: 'Publicação de manuais, diretrizes e confirmação formal de leitura por líderes.',
          fields: ['titulo', 'tipo', 'periodo', 'data_publicacao', 'publico_acesso', 'descricao', 'arquivo_pdf_url', 'total_leituras'],
          itemsCount: reports.length,
          previewType: 'reports',
        };
      case 'admin-lideres':
        return {
          title: 'Gestão de Líderes de Unidades',
          category: 'Administração',
          tableName: 'lideres',
          icon: <Briefcase className="w-6 h-6 text-[#355C7D]" />,
          description: 'Cadastro detalhado de líderes, matrícula, regional, gestor imediato e status de lotação.',
          fields: ['usuario_id', 'nome', 'matricula', 'cargo', 'unidade', 'regional', 'gestor', 'status', 'telefone'],
          itemsCount: leaders.length,
          previewType: 'leaders',
        };
      case 'admin-tarefas':
        return {
          title: 'Painel Geral de Tarefas & Ordens de Serviço',
          category: 'Administração',
          tableName: 'tarefas_os',
          icon: <ClipboardList className="w-6 h-6 text-[#C76B4A]" />,
          description: 'Criação, distribuição, controle de SLA e aprovação de evidências de OS de toda a rede.',
          fields: ['numero_os', 'titulo', 'responsavel', 'unidade', 'prazo', 'prioridade', 'categoria', 'status', 'tipo_conclusao', 'recorrencia'],
          itemsCount: tasks.length,
          previewType: 'tasks',
        };
      case 'admin-metas':
        return {
          title: 'Gestão Global de Metas da Rede',
          category: 'Administração',
          tableName: 'metas',
          icon: <Target className="w-6 h-6 text-[#355C7D]" />,
          description: 'Definição e acompanhamento de metas por unidade e regional.',
          fields: ['indicador', 'meta_valor', 'valor_atual', 'unidade_medida', 'periodo', 'unidade', 'lider', 'status'],
          itemsCount: goals.length,
          previewType: 'goals',
        };
      case 'meu-perfil':
        return {
          title: 'Meu Perfil & Credenciais',
          category: 'Área do Líder',
          tableName: 'usuarios / lideres',
          icon: <User className="w-6 h-6 text-[#C76B4A]" />,
          description: 'Dados cadastrais, unidade de lotação, telefone e status da conta.',
          fields: ['nome', 'email', 'role', 'status_confirmacao', 'unidade_nome', 'cargo', 'telefone'],
          itemsCount: 1,
          previewType: 'profile',
        };
      default:
        return {
          title: 'Módulo do Sistema',
          category: 'Central do Líder',
          tableName: 'sistema',
          icon: <Layers className="w-6 h-6 text-[#343A40]" />,
          description: 'Módulo integrado à fundação do sistema.',
          fields: ['id', 'created_at', 'updated_at'],
          itemsCount: 0,
          previewType: 'generic',
        };
    }
  };

  const info = getModuleInfo();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 shrink-0">
            {info.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700">
                {info.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#fcf1ec] text-[#C76B4A]">
                Tabela: public.{info.tableName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#343A40]">{info.title}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
              {info.description}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDatabaseSchema}
          className="px-4 py-2.5 rounded-xl bg-[#343A40] text-white text-xs font-semibold hover:bg-[#212529] transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          <Database className="w-4 h-4 text-[#C76B4A]" /> Inspecionar Schema SQL
        </button>
      </div>

      {/* Schema Columns & Foundation Status */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#343A40]">Estrutura de Campos no Banco de Dados</h3>
            <p className="text-xs text-gray-500">Campos já criados e indexados para consumo nas próximas etapas</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tabela Pronta & Ativa ({info.itemsCount} registros de teste)
          </span>
        </div>

        {/* Badges of fields */}
        <div className="flex flex-wrap gap-2 pt-1">
          {info.fields.map((field) => (
            <span
              key={field}
              className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 font-mono text-xs text-[#355C7D] font-medium"
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* Profile specific view if active */}
      {info.previewType === 'profile' && currentUser && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.nome}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#C76B4A]"
            />
            <div>
              <h3 className="text-lg font-bold text-[#343A40]">{currentUser.nome}</h3>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C76B4A] text-white">
                  {currentUser.role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {currentUser.status_confirmacao}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-gray-100">
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 block">Cargo / Função:</span>
              <span className="font-bold text-[#343A40] text-sm mt-0.5 block">{currentUser.cargo || 'Não informado'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 block">Unidade de Lotação:</span>
              <span className="font-bold text-[#343A40] text-sm mt-0.5 block">{currentUser.unidade_nome || 'Geral / Matriz'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 block">Telefone:</span>
              <span className="font-bold text-[#343A40] text-sm mt-0.5 block">{currentUser.telefone || 'Não informado'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 block">Data de Cadastro:</span>
              <span className="font-bold text-[#343A40] text-sm mt-0.5 block">{new Date(currentUser.created_at).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
