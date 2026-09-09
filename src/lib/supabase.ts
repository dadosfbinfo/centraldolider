import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or fallback defaults
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const supabaseUrl = (metaEnv.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Singleton Supabase client instance (or null if unconfigured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Script SQL DDL Completo com todas as 10 tabelas, RLS e Triggers para Supabase
 */
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- CENTRAL DO LÍDER - ESQUEMA COMPLETO DE BANCO DE DADOS (POSTGRESQL / SUPABASE)
-- Fundações, Autenticação, Perfis, Tabelas Operacionais e Regras de Segurança (RLS)
-- ==============================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA: UNIDADES / PROJETOS
CREATE TABLE IF NOT EXISTS public.unidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    regional VARCHAR(100),
    codigo VARCHAR(50) UNIQUE,
    cidade VARCHAR(100),
    estado VARCHAR(50),
    endereco TEXT,
    responsavel_nome VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ATIVA' CHECK (status IN ('ATIVA', 'INATIVA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA: USUARIOS / PERFIS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'LIDER' CHECK (role IN ('ADMINISTRADOR', 'GERENCIA', 'LIDER')),
    status_confirmacao VARCHAR(50) NOT NULL DEFAULT 'PENDENTE' CHECK (status_confirmacao IN ('CONFIRMADO', 'PENDENTE')),
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    projeto_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto_nome VARCHAR(255),
    cargo VARCHAR(100),
    telefone VARCHAR(50),
    avatar_url TEXT,
    token_confirmacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA: LIDERES
CREATE TABLE IF NOT EXISTS public.lideres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    unidade VARCHAR(255) NOT NULL,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto VARCHAR(255),
    projeto_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    regional VARCHAR(100),
    gestor VARCHAR(255) NOT NULL,
    gestores_imediatos_ids TEXT[] DEFAULT '{}',
    gestores_imediatos_nomes TEXT[] DEFAULT '{}',
    projetos_ids TEXT[] DEFAULT '{}',
    projetos_nomes TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'AFASTADO')),
    telefone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA: CATEGORIAS (para Tarefas/OS)
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(20) DEFAULT '#C76B4A',
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'OPERACIONAL' CHECK (tipo IN ('OPERACIONAL', 'SEGURANCA', 'QUALIDADE', 'ADMINISTRATIVO', 'OUTROS')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA: TAREFAS_OS (Ordem de Serviço com rastreabilidade completa)
CREATE TABLE IF NOT EXISTS public.tarefas_os (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_os VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    responsavel_nome VARCHAR(255) NOT NULL,
    responsavel_email VARCHAR(255),
    responsavel_cargo VARCHAR(100),
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade VARCHAR(255) NOT NULL,
    projeto_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto VARCHAR(255),
    projetos_ids TEXT[] DEFAULT '{}',
    projetos_nomes TEXT[] DEFAULT '{}',
    lideres_ids TEXT[] DEFAULT '{}',
    lideres_nomes TEXT[] DEFAULT '{}',
    validadores_ids TEXT[] DEFAULT '{}',
    validadores_nomes TEXT[] DEFAULT '{}',
    validacoes_aprovadas JSONB DEFAULT '[]'::jsonb,
    tipo_operacao VARCHAR(100) DEFAULT 'Rotina Operacional',
    data DATE NOT NULL,
    horario TIME NOT NULL,
    prazo TIMESTAMP WITH TIME ZONE,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    categoria_nome VARCHAR(100),
    categoria_cor VARCHAR(20),
    status VARCHAR(30) DEFAULT 'PROGRAMADA' CHECK (status IN ('PROGRAMADA', 'EM_ANDAMENTO', 'AGUARDANDO_VALIDACAO', 'CONCLUIDA', 'ATRASADA', 'BLOQUEADA', 'CANCELADA')),
    recorrencia VARCHAR(30) DEFAULT 'UMA_VEZ' CHECK (recorrencia IN ('UMA_VEZ', 'DIARIA', 'DIAS_UTEIS', 'SEMANAL', 'MENSAL', 'PERSONALIZADA')),
    recorrencia_config JSONB,
    requisitos_conclusao JSONB DEFAULT '[]'::jsonb,
    evidencias JSONB DEFAULT '[]'::jsonb,
    motivo_bloqueio TEXT,
    data_bloqueio TIMESTAMP WITH TIME ZONE,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    tempo_execucao_minutos INTEGER,
    observacoes_conclusao TEXT,
    validado_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    validado_por_nome VARCHAR(255),
    validado_por_role VARCHAR(50),
    data_validacao TIMESTAMP WITH TIME ZONE,
    motivo_recusa TEXT,
    recusado_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    recusado_por_nome VARCHAR(255),
    data_recusa TIMESTAMP WITH TIME ZONE,
    parent_os_id UUID REFERENCES public.tarefas_os(id) ON DELETE SET NULL,
    anexo_pdf_url TEXT,
    anexo_pdf_nome VARCHAR(255),
    anexo_pdf_tamanho VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA: METAS
CREATE TABLE IF NOT EXISTS public.metas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicador VARCHAR(255) NOT NULL,
    meta_valor NUMERIC(15,2) NOT NULL,
    valor_atual NUMERIC(15,2) DEFAULT 0.00,
    unidade_medida VARCHAR(50) DEFAULT '%',
    tipo_periodo VARCHAR(20) DEFAULT 'MENSAL' CHECK (tipo_periodo IN ('DIARIA', 'SEMANAL', 'MENSAL')),
    periodo VARCHAR(100) NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    projeto_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto_nome VARCHAR(255),
    projetos_ids TEXT[] DEFAULT '{}',
    projetos_nomes TEXT[] DEFAULT '{}',
    lider_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    lider_nome VARCHAR(255),
    lideres_ids TEXT[] DEFAULT '{}',
    lideres_nomes TEXT[] DEFAULT '{}',
    direcao_melhor VARCHAR(30) DEFAULT 'MAIOR_MELHOR' CHECK (direcao_melhor IN ('MAIOR_MELHOR', 'MENOR_MELHOR')),
    descricao TEXT,
    status VARCHAR(30) DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'ATINGIDA', 'NAO_ATINGIDA')),
    historico_apontamentos JSONB DEFAULT '[]'::jsonb,
    data_ultimo_apontamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA: RELATORIOS
CREATE TABLE IF NOT EXISTS public.relatorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('DIARIO', 'SEMANAL', 'MENSAL')),
    periodo VARCHAR(100) NOT NULL,
    data_publicacao DATE NOT NULL,
    publicado BOOLEAN DEFAULT TRUE,
    publico_tipo VARCHAR(30) DEFAULT 'TODOS' CHECK (publico_tipo IN ('TODOS', 'UNIDADES', 'LIDERES')),
    unidades_alvo TEXT[] DEFAULT '{}',
    projetos_alvo TEXT[] DEFAULT '{}',
    lideres_alvo TEXT[] DEFAULT '{}',
    descricao TEXT NOT NULL,
    arquivo_pdf_nome VARCHAR(255),
    arquivo_pdf_url TEXT NOT NULL,
    arquivo_pdf_tamanho VARCHAR(50),
    arquivo_pdf_conteudo TEXT,
    total_leituras INTEGER DEFAULT 0,
    confirmacoes_leitura JSONB DEFAULT '[]'::jsonb,
    leitores_confirmados TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA: CALENDARIO_EVENTOS
CREATE TABLE IF NOT EXISTS public.calendario_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    tipo_custom_nome VARCHAR(100),
    cor_custom VARCHAR(20),
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME,
    dia_inteiro BOOLEAN DEFAULT FALSE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    projeto_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto_nome VARCHAR(255),
    lider_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    lider_nome VARCHAR(255),
    publico_tipo VARCHAR(30) DEFAULT 'TODOS' CHECK (publico_tipo IN ('TODOS', 'UNIDADES', 'LIDERES')),
    unidades_alvo TEXT[] DEFAULT '{}',
    projetos_alvo TEXT[] DEFAULT '{}',
    lideres_alvo TEXT[] DEFAULT '{}',
    descricao TEXT,
    local VARCHAR(255),
    link_reuniao TEXT,
    criado_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_por_nome VARCHAR(255),
    status VARCHAR(30) DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA: COMENTARIOS (Polimórfica para tarefas, metas, relatórios, eventos)
CREATE TABLE IF NOT EXISTS public.comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    autor_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    autor_nome VARCHAR(255) NOT NULL,
    autor_role VARCHAR(50) NOT NULL,
    autor_avatar TEXT,
    texto TEXT NOT NULL,
    item_tipo VARCHAR(30) NOT NULL CHECK (item_tipo IN ('TAREFA', 'META', 'RELATORIO', 'EVENTO', 'CALENDARIO')),
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABELA: NOTIFICACOES
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    texto TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    item_tipo VARCHAR(50),
    item_id UUID,
    link_acao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TRIGGER PARA ATUALIZAR COLUNA updated_at AUTOMATICAMENTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_modtime BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_lideres_modtime BEFORE UPDATE ON public.lideres FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_tarefas_os_modtime BEFORE UPDATE ON public.tarefas_os FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_metas_modtime BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_relatorios_modtime BEFORE UPDATE ON public.relatorios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- SINCRONIZAÇÃO AUTOMÁTICA DE AUTH COM TABELA USUARIOS (PUBLIC.USUARIOS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nome, role, status_confirmacao, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'LIDER'),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'CONFIRMADO' ELSE 'PENDENTE' END,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        status_confirmacao = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'CONFIRMADO' ELSE public.usuarios.status_confirmacao END,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado quando um novo usuário se registra no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se o usuário autenticado é ADMINISTRADOR
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND role = 'ADMINISTRADOR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se é ADMINISTRADOR ou GERENCIA
CREATE OR REPLACE FUNCTION public.is_admin_or_gerencia()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND role IN ('ADMINISTRADOR', 'GERENCIA')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: USUARIOS (Admin/Gerência veem usuários; Líder vê seu perfil)
CREATE POLICY "Leitura de usuarios" ON public.usuarios FOR SELECT USING (public.is_admin_or_gerencia() OR auth.uid() = id);
CREATE POLICY "Atualizacao de usuarios" ON public.usuarios FOR UPDATE USING (public.is_admin() OR auth.uid() = id);
CREATE POLICY "Admins podem deletar usuarios" ON public.usuarios FOR DELETE USING (public.is_admin());

-- RLS: TAREFAS_OS (Admin/Gerência gerenciam; Líder vê e executa as suas)
CREATE POLICY "Tarefas leitura" ON public.tarefas_os FOR SELECT USING (public.is_admin_or_gerencia() OR responsavel_id = auth.uid() OR auth.uid()::text = ANY(lideres_ids));
CREATE POLICY "Tarefas criacao e edicao gestao" ON public.tarefas_os FOR ALL USING (public.is_admin_or_gerencia());
CREATE POLICY "Lider atualiza status e evidencias tarefa" ON public.tarefas_os FOR UPDATE USING (responsavel_id = auth.uid() OR auth.uid()::text = ANY(lideres_ids)) WITH CHECK (status IS DISTINCT FROM 'CANCELADA' OR public.is_admin_or_gerencia());

-- RLS: NOTIFICACOES
CREATE POLICY "Usuario gerencia suas notificacoes" ON public.notificacoes FOR ALL USING (usuario_id = auth.uid() OR public.is_admin());

-- RLS: COMENTARIOS
CREATE POLICY "Leitura de comentarios" ON public.comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Criacao de comentarios" ON public.comentarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);

-- ==============================================================================
-- VIEWS E CONSULTAS ANALÍTICAS PRINCIPAIS DO SISTEMA
-- ==============================================================================

-- 1. VIEW: Ordens de Serviço (OS) Detalhadas com Categorias e Validações
CREATE OR REPLACE VIEW public.vw_tarefas_os_detalhadas AS
SELECT 
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
    COALESCE(jsonb_array_length(os.validacoes_aprovadas), 0) AS total_aprovacoes,
    os.validado_por_nome,
    os.validado_por_role,
    os.data_validacao,
    os.motivo_recusa,
    os.data_recusa,
    c.nome AS categoria_nome,
    c.cor AS categoria_cor,
    os.tempo_execucao_minutos,
    os.created_at,
    os.updated_at
FROM public.tarefas_os os
LEFT JOIN public.categorias c ON c.id = os.categoria_id;

-- 2. VIEW: Metas com Cálculo de Atingimento e Direção de Melhoria
CREATE OR REPLACE VIEW public.vw_metas_progresso AS
SELECT 
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
    m.data_ultimo_apontamento,
    m.created_at,
    m.updated_at
FROM public.metas m;

-- 3. VIEW: Líderes com Gestores Imediatos e Múltiplos Projetos
CREATE OR REPLACE VIEW public.vw_lideres_gestao AS
SELECT 
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
    l.telefone,
    l.created_at,
    l.updated_at
FROM public.lideres l
LEFT JOIN public.usuarios u ON u.id = l.usuario_id;

-- 4. VIEW: Desempenho e Produtividade Operacional por Líder
CREATE OR REPLACE VIEW public.vw_produtividade_lideres AS
SELECT 
    os.responsavel_nome AS lider_nome,
    COUNT(*) AS total_os,
    COUNT(*) FILTER (WHERE os.status = 'CONCLUIDA') AS concluidas,
    COUNT(*) FILTER (WHERE os.status = 'AGUARDANDO_VALIDACAO') AS aguardando_validacao,
    COUNT(*) FILTER (WHERE os.status = 'EM_ANDAMENTO') AS em_andamento,
    COUNT(*) FILTER (WHERE os.status = 'ATRASADA') AS atrasadas,
    COUNT(*) FILTER (WHERE os.status = 'BLOQUEADA') AS bloqueadas,
    ROUND(AVG(os.tempo_execucao_minutos), 1) AS tempo_medio_minutos
FROM public.tarefas_os os
GROUP BY os.responsavel_nome;

-- ==============================================================================
-- STORAGE BUCKETS (SUPABASE STORAGE)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('relatorios_pdf', 'relatorios_pdf', true), ('evidencias_os', 'evidencias_os', true)
ON CONFLICT (id) DO NOTHING;
`;
