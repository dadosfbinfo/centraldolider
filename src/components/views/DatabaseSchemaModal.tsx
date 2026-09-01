import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  X, 
  Table, 
  ShieldCheck, 
  FileCode, 
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
  const [activeSection, setActiveSection] = useState<'tables' | 'sql' | 'rls'>('tables');

  if (!isOpen) return null;

  const tablesList = [
    {
      name: 'public.usuarios',
      desc: 'Perfis de usuários, roles (ADMINISTRADOR/LIDER), status de confirmação e unidade.',
      columns: ['id (UUID PK)', 'email (VARCHAR UNIQUE)', 'nome (VARCHAR)', 'role (VARCHAR)', 'status_confirmacao (VARCHAR)', 'unidade_id (UUID FK)', 'cargo', 'telefone', 'created_at', 'updated_at'],
    },
    {
      name: 'public.lideres',
      desc: 'Cadastro operacional de líderes de unidades com matrícula, cargo, regional e gestor.',
      columns: ['id (UUID PK)', 'usuario_id (UUID FK)', 'nome (VARCHAR)', 'email', 'matricula (VARCHAR UNIQUE)', 'cargo', 'unidade', 'regional', 'gestor', 'status', 'telefone', 'created_at'],
    },
    {
      name: 'public.unidades',
      desc: 'Tabela auxiliar de unidades/filiais operacionais.',
      columns: ['id (UUID PK)', 'nome (VARCHAR)', 'regional (VARCHAR)', 'codigo (VARCHAR UNIQUE)', 'status', 'created_at'],
    },
    {
      name: 'public.categorias',
      desc: 'Tabela auxiliar de categorias para Ordens de Serviço (Operacional, Segurança, etc.).',
      columns: ['id (UUID PK)', 'nome (VARCHAR)', 'cor (VARCHAR)', 'descricao (TEXT)', 'tipo', 'created_at'],
    },
    {
      name: 'public.tarefas_os',
      desc: 'Ordens de Serviço com rastreabilidade completa (quem recebeu, quando, prazo, execução, evidências).',
      columns: ['id (UUID PK)', 'numero_os (VARCHAR UNIQUE)', 'titulo (VARCHAR)', 'responsavel_id (UUID FK)', 'unidade', 'data', 'horario', 'prazo', 'prioridade', 'categoria_id (UUID FK)', 'status', 'tipo_conclusao_exigido', 'recorrencia', 'tempo_execucao_minutos', 'created_at'],
    },
    {
      name: 'public.metas',
      desc: 'Metas operacionais e indicadores por unidade e líder.',
      columns: ['id (UUID PK)', 'indicador (VARCHAR)', 'meta_valor (NUMERIC)', 'valor_atual (NUMERIC)', 'unidade_medida', 'periodo', 'unidade_id (UUID FK)', 'lider_id (UUID FK)', 'status', 'created_at'],
    },
    {
      name: 'public.relatorios',
      desc: 'Relatórios operacionais e manuais com confirmação de leitura por líderes.',
      columns: ['id (UUID PK)', 'titulo (VARCHAR)', 'tipo', 'periodo', 'data_publicacao', 'publico_acesso', 'descricao', 'arquivo_pdf_url', 'total_leituras', 'created_at'],
    },
    {
      name: 'public.calendario_eventos',
      desc: 'Eventos de calendário operacional, vistorias, reuniões e pendências.',
      columns: ['id (UUID PK)', 'titulo (VARCHAR)', 'tipo', 'data', 'horario_inicio', 'horario_fim', 'unidade_id (UUID FK)', 'lider_id (UUID FK)', 'status', 'created_at'],
    },
    {
      name: 'public.comentarios',
      desc: 'Comentários polimórficos vinculados a tarefas, metas, relatórios ou eventos.',
      columns: ['id (UUID PK)', 'autor_id (UUID FK)', 'autor_nome', 'autor_role', 'texto (TEXT)', 'item_tipo', 'item_id (UUID)', 'created_at'],
    },
    {
      name: 'public.notificacoes',
      desc: 'Notificações e avisos de sistema por usuário com rastreio de leitura.',
      columns: ['id (UUID PK)', 'usuario_id (UUID FK)', 'tipo', 'titulo', 'texto', 'lida (BOOLEAN)', 'link_acao', 'created_at'],
    },
  ];

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
                  10 Tabelas Criadas
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Fundação completa com DDL, integridade referencial, triggers de sincronização e RLS
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
        <div className="px-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveSection('tables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === 'tables'
                  ? 'bg-white text-[#C76B4A] shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-[#343A40]'
              }`}
            >
              <Table className="w-4 h-4" /> 10 Tabelas Criadas
            </button>

            <button
              onClick={() => setActiveSection('sql')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === 'sql'
                  ? 'bg-white text-[#C76B4A] shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-[#343A40]'
              }`}
            >
              <FileCode className="w-4 h-4" /> Script SQL Completo (DDL)
            </button>

            <button
              onClick={() => setActiveSection('rls')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === 'rls'
                  ? 'bg-white text-[#C76B4A] shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-[#343A40]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Regras de Segurança (RLS)
            </button>
          </div>

          <button
            onClick={handleCopySql}
            className="px-3 py-1.5 rounded-xl bg-[#C76B4A] hover:bg-[#b55d3d] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <span className="font-bold text-[#C76B4A] text-sm block">👑 Perfil ADMINISTRADOR</span>
                  <ul className="space-y-1.5 text-gray-600 text-xs">
                    <li>• Acesso total a todas as tabelas (SELECT, INSERT, UPDATE, DELETE)</li>
                    <li>• Visualização de todos os usuários (confirmados e pendentes)</li>
                    <li>• Alteração de funções e atribuição de unidades</li>
                    <li>• Criação e auditoria global de OS, metas e relatórios</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <span className="font-bold text-[#5B7DBE] text-sm block">👔 Perfil LÍDER</span>
                  <ul className="space-y-1.5 text-gray-600 text-xs">
                    <li>• Visualização restrita às OS atribuídas a si e sua unidade</li>
                    <li>• Permissão de UPDATE apenas para conclusão/evidências de suas OS</li>
                    <li>• Leitura de metas e confirmação de relatórios públicos</li>
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
