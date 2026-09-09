import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  X, 
  Table, 
  ShieldCheck, 
  FileCode, 
  FileSpreadsheet,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, isSupabaseConfigured } from '../../lib/supabase';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'tables' | 'queries' | 'sql' | 'rls'>('tables');
  const [copiedQueryIndex, setCopiedQueryIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const tablesList = [
    {
      name: 'public.usuarios',
      desc: 'Perfis de usuários, roles (ADMINISTRADOR, GERENCIA, LIDER), status de confirmação e vínculo com projeto/unidade.',
      columns: ['id (UUID PK)', 'email (VARCHAR UNIQUE)', 'nome (VARCHAR)', 'role (VARCHAR: ADMIN, GERENCIA, LIDER)', 'status_confirmacao (VARCHAR: CONFIRMADO, PENDENTE)', 'projeto_id (UUID FK)', 'projeto_nome', 'unidade_id (UUID FK)', 'cargo', 'telefone', 'avatar_url', 'created_at', 'updated_at'],
    },
    {
      name: 'public.lideres',
      desc: 'Cadastro operacional de líderes vinculados a múltiplos projetos e gerências diretas (gestores imediatos).',
      columns: ['id (UUID PK)', 'usuario_id (UUID FK)', 'nome', 'email', 'matricula (VARCHAR UNIQUE)', 'cargo', 'regional', 'gestor', 'gestores_imediatos_ids (TEXT[])', 'gestores_imediatos_nomes (TEXT[])', 'projetos_ids (TEXT[])', 'projetos_nomes (TEXT[])', 'status (ATIVO, INATIVO, AFASTADO)', 'telefone', 'created_at', 'updated_at'],
    },
    {
      name: 'public.unidades (projetos)',
      desc: 'Projetos e frentes operacionais ativas com nome, status e dados de localização.',
      columns: ['id (UUID PK)', 'nome (VARCHAR)', 'status (VARCHAR: ATIVA, INATIVA)', 'regional', 'codigo (VARCHAR UNIQUE)', 'cidade', 'estado', 'endereco', 'responsavel_nome', 'created_at'],
    },
    {
      name: 'public.categorias',
      desc: 'Categorias de Ordens de Serviço (Rotina Operacional, Segurança & Saúde, Qualidade & Auditoria, Gestão de Estoque, Administrativo & RH).',
      columns: ['id (UUID PK)', 'nome (VARCHAR)', 'cor (VARCHAR)', 'descricao (TEXT)', 'tipo', 'created_at'],
    },
    {
      name: 'public.tarefas_os',
      desc: 'Ordens de Serviço (OS) com múltiplos projetos/líderes, validadores designados (Gerência/Admin), fluxo de aprovação e evidências.',
      columns: ['id (UUID PK)', 'numero_os (VARCHAR UNIQUE)', 'titulo', 'tipo_operacao', 'responsavel_id (UUID FK)', 'responsavel_nome', 'responsavel_email', 'responsavel_cargo', 'projetos_ids (TEXT[])', 'projetos_nomes (TEXT[])', 'lideres_ids (TEXT[])', 'lideres_nomes (TEXT[])', 'validadores_ids (TEXT[])', 'validadores_nomes (TEXT[])', 'validacoes_aprovadas (JSONB)', 'data (DATE)', 'horario (TIME)', 'prazo (TIMESTAMPTZ)', 'prioridade (BAIXA, MEDIA, ALTA, CRITICA)', 'categoria_id (UUID FK)', 'categoria_nome', 'status (PROGRAMADA, EM_ANDAMENTO, AGUARDANDO_VALIDACAO, CONCLUIDA, ATRASADA, BLOQUEADA, CANCELADA)', 'recorrencia', 'requisitos_conclusao (JSONB)', 'evidencias (JSONB)', 'validado_por_nome', 'data_validacao', 'motivo_recusa', 'data_recusa', 'tempo_execucao_minutos', 'anexo_pdf_url', 'anexo_pdf_nome', 'anexo_pdf_tamanho'],
    },
    {
      name: 'public.metas',
      desc: 'Metas operacionais com múltiplos projetos/líderes, direção de melhoria (MAIOR_MELHOR / MENOR_MELHOR) e histórico de apontamentos.',
      columns: ['id (UUID PK)', 'indicador', 'meta_valor (NUMERIC)', 'valor_atual (NUMERIC)', 'unidade_medida', 'tipo_periodo (DIARIA, SEMANAL, MENSAL)', 'periodo', 'data_inicio (DATE)', 'data_fim (DATE)', 'projetos_ids (TEXT[])', 'projetos_nomes (TEXT[])', 'lideres_ids (TEXT[])', 'lideres_nomes (TEXT[])', 'direcao_melhor (MAIOR_MELHOR, MENOR_MELHOR)', 'descricao', 'status (EM_ANDAMENTO, ATINGIDA, NAO_ATINGIDA)', 'historico_apontamentos (JSONB)', 'data_ultimo_apontamento'],
    },
    {
      name: 'public.relatorios',
      desc: 'Relatórios operacionais com controle de publicação, público-alvo (projetos/líderes) e rastreamento de leitura.',
      columns: ['id (UUID PK)', 'titulo', 'tipo (DIARIO, SEMANAL, MENSAL)', 'periodo', 'data_publicacao (DATE)', 'publicado (BOOLEAN)', 'publico_tipo (TODOS, UNIDADES, LIDERES)', 'projetos_alvo (TEXT[])', 'lideres_alvo (TEXT[])', 'descricao', 'arquivo_pdf_nome', 'arquivo_pdf_url', 'total_leituras', 'confirmacoes_leitura (JSONB)', 'created_at'],
    },
    {
      name: 'public.calendario_eventos',
      desc: 'Eventos e comunicados de calendário operacional com alvos por projeto e líder.',
      columns: ['id (UUID PK)', 'titulo', 'tipo', 'data (DATE)', 'horario_inicio (TIME)', 'horario_fim (TIME)', 'dia_inteiro (BOOLEAN)', 'projeto_id (UUID FK)', 'projeto_nome', 'publico_tipo', 'projetos_alvo (TEXT[])', 'lideres_alvo (TEXT[])', 'descricao', 'status', 'created_at'],
    },
    {
      name: 'public.comentarios',
      desc: 'Comentários com preservação e integridade estrita vinculados a tarefas, metas, relatórios ou eventos.',
      columns: ['id (UUID PK)', 'autor_id (UUID FK)', 'autor_nome', 'autor_role', 'texto (TEXT)', 'item_tipo', 'item_id (UUID)', 'created_at'],
    },
    {
      name: 'public.notificacoes',
      desc: 'Notificações e avisos do sistema por usuário com controle de leitura.',
      columns: ['id (UUID PK)', 'usuario_id (UUID FK)', 'tipo', 'titulo', 'texto', 'lida (BOOLEAN)', 'item_tipo', 'item_id', 'link_acao', 'created_at'],
    },
  ];

  const queriesList = [
    {
      title: '1. Ordens de Serviço (OS) com Projetos, Líderes e Validações',
      desc: 'Consulta completa de tarefas e OS trazendo status operacional, múltiplos projetos, líderes designados, validadores (Gerência/Admin), contagem de aprovações e categoria.',
      sql: `SELECT 
    os.id,
    os.numero_os,
    os.titulo,
    os.tipo_operacao,
    os.prioridade,
    os.status,
    os.data,
    os.horario,
    os.prazo,
    os.responsavel_nome,
    os.responsavel_email,
    os.projetos_nomes,
    os.lideres_nomes,
    os.validadores_nomes,
    COALESCE(jsonb_array_length(os.validacoes_aprovadas), 0) AS total_validacoes_aprovadas,
    os.validado_por_nome,
    os.data_validacao,
    os.motivo_recusa,
    os.data_recusa,
    c.nome AS categoria_nome,
    os.tempo_execucao_minutos
FROM public.tarefas_os os
LEFT JOIN public.categorias c ON c.id = os.categoria_id
ORDER BY os.data DESC, os.horario DESC;`,
      fields: ['id', 'numero_os', 'titulo', 'tipo_operacao', 'prioridade', 'status', 'data', 'horario', 'prazo', 'responsavel_nome', 'projetos_nomes (TEXT[])', 'lideres_nomes (TEXT[])', 'validadores_nomes (TEXT[])', 'total_validacoes_aprovadas', 'validado_por_nome', 'categoria_nome']
    },
    {
      title: '2. Metas Operacionais com Cálculo de Atingimento e Direção',
      desc: 'Consulta de metas com aplicação da regra de direção (MAIOR_MELHOR ou MENOR_MELHOR) para percentual de atingimento, múltiplos projetos/líderes e total de apontamentos.',
      sql: `SELECT 
    m.id,
    m.indicador,
    m.meta_valor,
    m.valor_atual,
    m.unidade_medida,
    m.tipo_periodo,
    m.periodo,
    m.direcao_melhor,
    m.status,
    CASE 
        WHEN m.direcao_melhor = 'MAIOR_MELHOR' THEN 
            ROUND((m.valor_atual / NULLIF(m.meta_valor, 0)) * 100, 2)
        ELSE 
            ROUND((m.meta_valor / NULLIF(m.valor_atual, 0)) * 100, 2)
    END AS percentual_atingimento,
    m.projetos_nomes,
    m.lideres_nomes,
    COALESCE(jsonb_array_length(m.historico_apontamentos), 0) AS total_apontamentos,
    m.data_ultimo_apontamento
FROM public.metas m
ORDER BY m.periodo DESC, m.indicador ASC;`,
      fields: ['id', 'indicador', 'meta_valor', 'valor_atual', 'unidade_medida', 'tipo_periodo', 'periodo', 'direcao_melhor', 'status', 'percentual_atingimento (%)', 'projetos_nomes (TEXT[])', 'lideres_nomes (TEXT[])', 'total_apontamentos', 'data_ultimo_apontamento']
    },
    {
      title: '3. Gestão de Líderes com Múltiplos Projetos e Gestores Imediatos',
      desc: 'Consulta dos líderes operacionais exibindo seus múltiplos projetos vinculados, gerentes/gestores imediatos (role GERENCIA) e dados cadastrais.',
      sql: `SELECT 
    l.id,
    l.nome,
    l.email,
    l.matricula,
    l.cargo,
    l.regional,
    l.gestor,
    l.status,
    l.projetos_nomes,
    l.gestores_imediatos_nomes,
    u.role AS usuario_role,
    u.status_confirmacao,
    l.telefone
FROM public.lideres l
LEFT JOIN public.usuarios u ON u.id = l.usuario_id
ORDER BY l.nome ASC;`,
      fields: ['id', 'nome', 'email', 'matricula', 'cargo', 'regional', 'status', 'projetos_nomes (TEXT[])', 'gestores_imediatos_nomes (TEXT[])', 'usuario_role', 'status_confirmacao', 'telefone']
    },
    {
      title: '4. Relatórios Operacionais e Confirmações de Leitura',
      desc: 'Consulta dos relatórios publicados com público-alvo (projetos/líderes) e totalização das confirmações de leitura gravadas.',
      sql: `SELECT 
    r.id,
    r.titulo,
    r.tipo,
    r.periodo,
    r.data_publicacao,
    r.publicado,
    r.publico_tipo,
    r.projetos_alvo,
    r.lideres_alvo,
    r.total_leituras,
    COALESCE(jsonb_array_length(r.confirmacoes_leitura), 0) AS total_confirmacoes,
    r.created_at
FROM public.relatorios r
WHERE r.publicado = true
ORDER BY r.data_publicacao DESC;`,
      fields: ['id', 'titulo', 'tipo', 'periodo', 'data_publicacao', 'publicado', 'publico_tipo', 'projetos_alvo', 'lideres_alvo', 'total_leituras', 'total_confirmacoes']
    },
    {
      title: '5. Produtividade e Auditoria de Execução de OS por Líder',
      desc: 'Consulta agregada de indicadores de produtividade por líder: total de OS, concluídas, aguardando validação, atrasadas e tempo médio.',
      sql: `SELECT 
    os.responsavel_nome AS lider_nome,
    COUNT(*) AS total_os,
    COUNT(*) FILTER (WHERE os.status = 'CONCLUIDA') AS concluidas,
    COUNT(*) FILTER (WHERE os.status = 'AGUARDANDO_VALIDACAO') AS aguardando_validacao,
    COUNT(*) FILTER (WHERE os.status = 'EM_ANDAMENTO') AS em_andamento,
    COUNT(*) FILTER (WHERE os.status = 'ATRASADA') AS atrasadas,
    COUNT(*) FILTER (WHERE os.status = 'BLOQUEADA') AS bloqueadas,
    ROUND(AVG(os.tempo_execucao_minutos), 1) AS media_minutos
FROM public.tarefas_os os
GROUP BY os.responsavel_nome
ORDER BY total_os DESC;`,
      fields: ['lider_nome', 'total_os', 'concluidas', 'aguardando_validacao', 'em_andamento', 'atrasadas', 'bloqueadas', 'media_minutos']
    }
  ];

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyQuery = (sql: string, index: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedQueryIndex(index);
    setTimeout(() => setCopiedQueryIndex(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#343A40]/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#343A40] to-[#355C7D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C76B4A] text-white">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Estrutura de Banco de Dados (Supabase / PostgreSQL)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
                  10 Tabelas + Consultas Otimizadas
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Fundação completa com DDL, consultas analíticas, integridade referencial e RLS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-gray-200 flex flex-wrap items-center justify-between bg-gray-50 gap-2">
          <div className="flex flex-wrap items-center gap-2 py-2">
            <button
              onClick={() => setActiveSection('tables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === 'tables'
                  ? 'bg-white text-[#C76B4A] shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-[#343A40]'
              }`}
            >
              <Table className="w-4 h-4" /> 10 Tabelas
            </button>

            <button
              onClick={() => setActiveSection('queries')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === 'queries'
                  ? 'bg-white text-[#C76B4A] shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-[#343A40]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Consultas SQL do Sistema
            </button>

            <button
              onClick={() => setActiveSection('sql')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === 'sql'
                  ? 'bg-white text-[#C76B4A] shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-[#343A40]'
              }`}
            >
              <FileCode className="w-4 h-4" /> Script SQL DDL Completo
            </button>

            <button
              onClick={() => setActiveSection('rls')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === 'rls'
                  ? 'bg-white text-[#C76B4A] shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-[#343A40]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Segurança (RLS)
            </button>
          </div>

          <button
            onClick={handleCopySql}
            className="px-3 py-1.5 rounded-xl bg-[#C76B4A] hover:bg-[#b55d3d] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar SQL Supabase
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeSection === 'tables' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tablesList.map((tbl, i) => (
                <div
                  key={tbl.name}
                  className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:border-[#C76B4A]/50 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#355C7D]">{tbl.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      Tabela #{i + 1}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{tbl.desc}</p>
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Colunas Principais:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tbl.columns.map((col) => (
                        <span key={col} className="px-1.5 py-0.5 rounded bg-gray-50 border text-[10px] font-mono text-gray-600">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'queries' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
                <p className="font-bold mb-1">Consultas SQL Otimizadas e Atualizadas</p>
                <p>
                  Estas consultas foram estruturadas de acordo com as tabelas mais recentes do sistema (incluindo perfis GERÊNCIA, múltiplos projetos, validadores de OS e direções de metas). Copie e execute diretamente no SQL Editor do Supabase.
                </p>
              </div>

              <div className="space-y-4">
                {queriesList.map((q, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#343A40] flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[#C76B4A]" />
                          {q.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{q.desc}</p>
                      </div>
                      <button
                        onClick={() => handleCopyQuery(q.sql, idx)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#C76B4A] hover:text-white text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                      >
                        {copiedQueryIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Consulta
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-[#1e2227] text-gray-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-gray-800">
                      {q.sql}
                    </pre>

                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Campos Retornados:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {q.fields.map((f) => (
                          <span key={f} className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-mono text-gray-600">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'sql' && (
            <div className="relative">
              <pre className="p-5 rounded-2xl bg-[#1e2227] text-gray-200 font-mono text-xs overflow-x-auto leading-relaxed border border-gray-800">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeSection === 'rls' && (
            <div className="space-y-4 max-w-3xl">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Políticas Row Level Security (RLS) Configuradas
                </div>
                <p>
                  As regras de segurança garantem que cada perfil acesse estritamente o escopo autorizado no banco Postgres:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <span className="font-bold text-[#C76B4A] text-sm block">👑 ADMINISTRADOR</span>
                  <ul className="space-y-1.5 text-gray-600 text-xs">
                    <li>• Acesso total a todas as tabelas (SELECT, INSERT, UPDATE, DELETE)</li>
                    <li>• Gestão irrestrita de usuários e permissões</li>
                    <li>• Validação e exclusão definitiva de registros operacionais</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <span className="font-bold text-[#355C7D] text-sm block">🛡️ GERÊNCIA</span>
                  <ul className="space-y-1.5 text-gray-600 text-xs">
                    <li>• Validação e auditoria de Ordens de Serviço</li>
                    <li>• Gestão e leitura completa das equipes de liderança vinculadas</li>
                    <li>• Exclusão autorizada apenas sob condições e permissões operacionais</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <span className="font-bold text-[#5B7DBE] text-sm block">👔 LÍDER</span>
                  <ul className="space-y-1.5 text-gray-600 text-xs">
                    <li>• Visualização restrita às OS atribuídas a si e seus projetos</li>
                    <li>• UPDATE restrito para execução e submissão de evidências</li>
                    <li>• Registro de apontamentos de metas diárias/semanais</li>
                    <li>• Inserção de comentários com autor_id próprio</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Pronto para implantação no Supabase SQL Editor</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
