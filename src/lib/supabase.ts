import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or fallback defaults
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const rawSupabaseUrl = (metaEnv.VITE_SUPABASE_URL as string) || '';
const rawSupabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || '';

// Clean and normalize the Supabase Project URL (strip trailing /rest/v1 or trailing slashes if present)
export const supabaseUrl = rawSupabaseUrl
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

export const supabaseAnonKey = rawSupabaseAnonKey.trim();

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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'LIDER' CHECK (role IN ('ADMINISTRADOR', 'GERENCIA', 'LIDER')),
    status_confirmacao VARCHAR(50) NOT NULL DEFAULT 'PENDENTE' CHECK (status_confirmacao IN ('CONFIRMADO', 'PENDENTE')),
    unidade_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    projeto_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    unidade VARCHAR(255) NOT NULL,
    unidade_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto VARCHAR(255),
    projeto_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(20) DEFAULT '#C76B4A',
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'OPERACIONAL' CHECK (tipo IN ('OPERACIONAL', 'SEGURANCA', 'QUALIDADE', 'ADMINISTRATIVO', 'OUTROS')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA: TAREFAS_OS (Ordem de Serviço com rastreabilidade completa)
CREATE TABLE IF NOT EXISTS public.tarefas_os (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    numero_os VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    responsavel_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    responsavel_nome VARCHAR(255) NOT NULL,
    responsavel_email VARCHAR(255),
    responsavel_cargo VARCHAR(100),
    unidade_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade VARCHAR(255) NOT NULL,
    projeto_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
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
    categoria_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
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
    validado_por_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    validado_por_nome VARCHAR(255),
    validado_por_role VARCHAR(50),
    data_validacao TIMESTAMP WITH TIME ZONE,
    motivo_recusa TEXT,
    recusado_por_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    recusado_por_nome VARCHAR(255),
    data_recusa TIMESTAMP WITH TIME ZONE,
    parent_os_id TEXT REFERENCES public.tarefas_os(id) ON DELETE SET NULL,
    anexo_pdf_url TEXT,
    anexo_pdf_nome VARCHAR(255),
    anexo_pdf_tamanho VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA: METAS
CREATE TABLE IF NOT EXISTS public.metas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    indicador VARCHAR(255) NOT NULL,
    meta_valor NUMERIC(15,2) NOT NULL,
    valor_atual NUMERIC(15,2) DEFAULT 0.00,
    unidade_medida VARCHAR(50) DEFAULT '%',
    tipo_periodo VARCHAR(20) DEFAULT 'MENSAL' CHECK (tipo_periodo IN ('DIARIA', 'SEMANAL', 'MENSAL')),
    periodo VARCHAR(100) NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    unidade_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    projeto_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto_nome VARCHAR(255),
    projetos_ids TEXT[] DEFAULT '{}',
    projetos_nomes TEXT[] DEFAULT '{}',
    lider_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    tipo_custom_nome VARCHAR(100),
    cor_custom VARCHAR(20),
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME,
    dia_inteiro BOOLEAN DEFAULT FALSE,
    unidade_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    projeto_id TEXT REFERENCES public.unidades(id) ON DELETE SET NULL,
    projeto_nome VARCHAR(255),
    lider_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    lider_nome VARCHAR(255),
    publico_tipo VARCHAR(30) DEFAULT 'TODOS' CHECK (publico_tipo IN ('TODOS', 'UNIDADES', 'LIDERES')),
    unidades_alvo TEXT[] DEFAULT '{}',
    projetos_alvo TEXT[] DEFAULT '{}',
    lideres_alvo TEXT[] DEFAULT '{}',
    descricao TEXT,
    local VARCHAR(255),
    link_reuniao TEXT,
    criado_por_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_por_nome VARCHAR(255),
    status VARCHAR(30) DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA: COMENTARIOS (Polimórfica para tarefas, metas, relatórios, eventos)
CREATE TABLE IF NOT EXISTS public.comentarios (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    autor_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    autor_nome VARCHAR(255) NOT NULL,
    autor_role VARCHAR(50) NOT NULL,
    autor_avatar TEXT,
    texto TEXT NOT NULL,
    item_tipo VARCHAR(30) NOT NULL CHECK (item_tipo IN ('TAREFA', 'META', 'RELATORIO', 'EVENTO', 'CALENDARIO')),
    item_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABELA: NOTIFICACOES
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    texto TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    item_tipo VARCHAR(50),
    item_id TEXT,
    link_acao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABELA: TIPOS_CALENDARIO (Configurações de tipos de eventos de calendário)
CREATE TABLE IF NOT EXISTS public.tipos_calendario (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(30) NOT NULL,
    descricao TEXT,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. TABELA: TIPOS_AUDITORIA (Configurações de tipos de auditoria para OS)
CREATE TABLE IF NOT EXISTS public.tipos_auditoria (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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

DROP TRIGGER IF EXISTS update_usuarios_modtime ON public.usuarios;
CREATE TRIGGER update_usuarios_modtime BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_lideres_modtime ON public.lideres;
CREATE TRIGGER update_lideres_modtime BEFORE UPDATE ON public.lideres FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_tarefas_os_modtime ON public.tarefas_os;
CREATE TRIGGER update_tarefas_os_modtime BEFORE UPDATE ON public.tarefas_os FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_metas_modtime ON public.metas;
CREATE TRIGGER update_metas_modtime BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_relatorios_modtime ON public.relatorios;
CREATE TRIGGER update_relatorios_modtime BEFORE UPDATE ON public.relatorios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_tipos_calendario_modtime ON public.tipos_calendario;
CREATE TRIGGER update_tipos_calendario_modtime BEFORE UPDATE ON public.tipos_calendario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_tipos_auditoria_modtime ON public.tipos_auditoria;
CREATE TRIGGER update_tipos_auditoria_modtime BEFORE UPDATE ON public.tipos_auditoria FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- Baseadas em perfis e autorização em public.usuarios via auth.uid() / auth.jwt()
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
ALTER TABLE public.tipos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_auditoria ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares de contexto de usuário e papel
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.usuarios 
    WHERE id = auth.uid()::text OR email = auth.jwt()->>'email' 
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() = 'ADMINISTRADOR');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_gerencia()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() IN ('ADMINISTRADOR', 'GERENCIA'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS TEXT AS $$
    SELECT COALESCE(auth.uid()::text, (SELECT id FROM public.usuarios WHERE email = auth.jwt()->>'email' LIMIT 1));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. TABELA: USUARIOS
DROP POLICY IF EXISTS "Acesso total usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete_policy" ON public.usuarios;

CREATE POLICY "usuarios_select_policy" ON public.usuarios 
FOR SELECT USING (public.is_admin_or_gerencia() OR id = public.current_user_id());

CREATE POLICY "usuarios_insert_policy" ON public.usuarios 
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_update_policy" ON public.usuarios 
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_delete_policy" ON public.usuarios 
FOR DELETE USING (public.is_admin());

-- 2. TABELA: LIDERES
DROP POLICY IF EXISTS "Acesso total lideres" ON public.lideres;
DROP POLICY IF EXISTS "lideres_select_policy" ON public.lideres;
DROP POLICY IF EXISTS "lideres_insert_policy" ON public.lideres;
DROP POLICY IF EXISTS "lideres_update_policy" ON public.lideres;
DROP POLICY IF EXISTS "lideres_delete_policy" ON public.lideres;

CREATE POLICY "lideres_select_policy" ON public.lideres 
FOR SELECT USING (public.is_admin_or_gerencia() OR usuario_id = public.current_user_id());

CREATE POLICY "lideres_insert_policy" ON public.lideres 
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "lideres_update_policy" ON public.lideres 
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "lideres_delete_policy" ON public.lideres 
FOR DELETE USING (public.is_admin());

-- 3. TABELA: UNIDADES (Projetos)
DROP POLICY IF EXISTS "Acesso total unidades" ON public.unidades;
DROP POLICY IF EXISTS "unidades_select_policy" ON public.unidades;
DROP POLICY IF EXISTS "unidades_insert_policy" ON public.unidades;
DROP POLICY IF EXISTS "unidades_update_policy" ON public.unidades;
DROP POLICY IF EXISTS "unidades_delete_policy" ON public.unidades;

CREATE POLICY "unidades_select_policy" ON public.unidades 
FOR SELECT USING (auth.role() = 'authenticated' OR public.current_user_id() IS NOT NULL);

CREATE POLICY "unidades_insert_policy" ON public.unidades 
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "unidades_update_policy" ON public.unidades 
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "unidades_delete_policy" ON public.unidades 
FOR DELETE USING (public.is_admin());

-- 4. TABELA: CATEGORIAS
DROP POLICY IF EXISTS "Acesso total categorias" ON public.categorias;
DROP POLICY IF EXISTS "categorias_select_policy" ON public.categorias;
DROP POLICY IF EXISTS "categorias_insert_policy" ON public.categorias;
DROP POLICY IF EXISTS "categorias_update_policy" ON public.categorias;
DROP POLICY IF EXISTS "categorias_delete_policy" ON public.categorias;

CREATE POLICY "categorias_select_policy" ON public.categorias 
FOR SELECT USING (auth.role() = 'authenticated' OR public.current_user_id() IS NOT NULL);

CREATE POLICY "categorias_insert_policy" ON public.categorias 
FOR INSERT WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "categorias_update_policy" ON public.categorias 
FOR UPDATE USING (public.is_admin_or_gerencia()) WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "categorias_delete_policy" ON public.categorias 
FOR DELETE USING (public.is_admin_or_gerencia());

-- 5. TABELA: TAREFAS_OS
DROP POLICY IF EXISTS "Acesso total tarefas_os" ON public.tarefas_os;
DROP POLICY IF EXISTS "tarefas_os_select_policy" ON public.tarefas_os;
DROP POLICY IF EXISTS "tarefas_os_insert_policy" ON public.tarefas_os;
DROP POLICY IF EXISTS "tarefas_os_update_policy" ON public.tarefas_os;
DROP POLICY IF EXISTS "tarefas_os_delete_policy" ON public.tarefas_os;

CREATE POLICY "tarefas_os_select_policy" ON public.tarefas_os 
FOR SELECT USING (
    public.is_admin_or_gerencia() OR 
    responsavel_id = public.current_user_id() OR 
    public.current_user_id() = ANY(lideres_ids) OR 
    public.current_user_id() = ANY(validadores_ids)
);

CREATE POLICY "tarefas_os_insert_policy" ON public.tarefas_os 
FOR INSERT WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "tarefas_os_update_policy" ON public.tarefas_os 
FOR UPDATE USING (
    public.is_admin_or_gerencia() OR 
    responsavel_id = public.current_user_id() OR 
    public.current_user_id() = ANY(lideres_ids)
)
WITH CHECK (
    public.is_admin_or_gerencia() OR 
    (
        (responsavel_id = public.current_user_id() OR public.current_user_id() = ANY(lideres_ids))
        AND (prazo IS NOT DISTINCT FROM (SELECT t.prazo FROM public.tarefas_os t WHERE t.id = public.tarefas_os.id))
    )
);

CREATE POLICY "tarefas_os_delete_policy" ON public.tarefas_os 
FOR DELETE USING (public.is_admin_or_gerencia());

-- 6. TABELA: METAS
DROP POLICY IF EXISTS "Acesso total metas" ON public.metas;
DROP POLICY IF EXISTS "metas_select_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_insert_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_update_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_delete_policy" ON public.metas;

CREATE POLICY "metas_select_policy" ON public.metas 
FOR SELECT USING (
    public.is_admin_or_gerencia() OR 
    lider_id = public.current_user_id() OR 
    public.current_user_id() = ANY(lideres_ids)
);

CREATE POLICY "metas_insert_policy" ON public.metas 
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "metas_update_policy" ON public.metas 
FOR UPDATE USING (
    public.is_admin() OR 
    lider_id = public.current_user_id() OR 
    public.current_user_id() = ANY(lideres_ids)
)
WITH CHECK (
    public.is_admin() OR 
    (
        (lider_id = public.current_user_id() OR public.current_user_id() = ANY(lideres_ids))
        AND indicador = (SELECT m.indicador FROM public.metas m WHERE m.id = public.metas.id)
        AND meta_valor = (SELECT m.meta_valor FROM public.metas m WHERE m.id = public.metas.id)
    )
);

CREATE POLICY "metas_delete_policy" ON public.metas 
FOR DELETE USING (public.is_admin());

-- 7. TABELA: RELATORIOS
DROP POLICY IF EXISTS "Acesso total relatorios" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_select_policy" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_insert_policy" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_update_policy" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_delete_policy" ON public.relatorios;

CREATE POLICY "relatorios_select_policy" ON public.relatorios 
FOR SELECT USING (
    public.is_admin_or_gerencia() OR 
    publico_tipo = 'TODOS' OR 
    public.current_user_id() = ANY(lideres_alvo)
);

CREATE POLICY "relatorios_insert_policy" ON public.relatorios 
FOR INSERT WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "relatorios_update_policy" ON public.relatorios 
FOR UPDATE USING (
    public.is_admin_or_gerencia() OR 
    auth.role() = 'authenticated' OR 
    public.current_user_id() IS NOT NULL
);

CREATE POLICY "relatorios_delete_policy" ON public.relatorios 
FOR DELETE USING (public.is_admin_or_gerencia());

-- 8. TABELA: CALENDARIO_EVENTOS
DROP POLICY IF EXISTS "Acesso total calendario_eventos" ON public.calendario_eventos;
DROP POLICY IF EXISTS "calendario_eventos_select_policy" ON public.calendario_eventos;
DROP POLICY IF EXISTS "calendario_eventos_insert_policy" ON public.calendario_eventos;
DROP POLICY IF EXISTS "calendario_eventos_update_policy" ON public.calendario_eventos;
DROP POLICY IF EXISTS "calendario_eventos_delete_policy" ON public.calendario_eventos;

CREATE POLICY "calendario_eventos_select_policy" ON public.calendario_eventos 
FOR SELECT USING (
    public.is_admin_or_gerencia() OR 
    publico_tipo = 'TODOS' OR 
    public.current_user_id() = ANY(lideres_alvo)
);

CREATE POLICY "calendario_eventos_insert_policy" ON public.calendario_eventos 
FOR INSERT WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "calendario_eventos_update_policy" ON public.calendario_eventos 
FOR UPDATE USING (public.is_admin_or_gerencia()) WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "calendario_eventos_delete_policy" ON public.calendario_eventos 
FOR DELETE USING (public.is_admin_or_gerencia());

-- 9. TABELA: COMENTARIOS
-- REGRA ESTRITA: DELETE É BLOQUEADO PARA TODOS OS ROLES (INCLUSIVE ADMINISTRADOR)
DROP POLICY IF EXISTS "Acesso total comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_select_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_insert_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_update_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_delete_policy" ON public.comentarios;

CREATE POLICY "comentarios_select_policy" ON public.comentarios 
FOR SELECT USING (auth.role() = 'authenticated' OR public.current_user_id() IS NOT NULL);

CREATE POLICY "comentarios_insert_policy" ON public.comentarios 
FOR INSERT WITH CHECK (autor_id = public.current_user_id());

-- Nenhuma política de UPDATE ou DELETE é criada, bloqueando edições e exclusões no nível do banco.

-- 10. TABELA: NOTIFICACOES
DROP POLICY IF EXISTS "Acesso total notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_select_policy" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_insert_policy" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_update_policy" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_delete_policy" ON public.notificacoes;

CREATE POLICY "notificacoes_select_policy" ON public.notificacoes 
FOR SELECT USING (usuario_id = public.current_user_id());

CREATE POLICY "notificacoes_update_policy" ON public.notificacoes 
FOR UPDATE USING (usuario_id = public.current_user_id()) WITH CHECK (usuario_id = public.current_user_id());

CREATE POLICY "notificacoes_insert_policy" ON public.notificacoes 
FOR INSERT WITH CHECK (
    public.is_admin_or_gerencia() OR 
    auth.role() = 'service_role' OR 
    usuario_id = public.current_user_id()
);

-- 11. TABELA: TIPOS_CALENDARIO
DROP POLICY IF EXISTS "Acesso total tipos_calendario" ON public.tipos_calendario;
DROP POLICY IF EXISTS "tipos_calendario_select_policy" ON public.tipos_calendario;
DROP POLICY IF EXISTS "tipos_calendario_insert_policy" ON public.tipos_calendario;
DROP POLICY IF EXISTS "tipos_calendario_update_policy" ON public.tipos_calendario;
DROP POLICY IF EXISTS "tipos_calendario_delete_policy" ON public.tipos_calendario;

CREATE POLICY "tipos_calendario_select_policy" ON public.tipos_calendario 
FOR SELECT USING (auth.role() = 'authenticated' OR public.current_user_id() IS NOT NULL);

CREATE POLICY "tipos_calendario_insert_policy" ON public.tipos_calendario 
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "tipos_calendario_update_policy" ON public.tipos_calendario 
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "tipos_calendario_delete_policy" ON public.tipos_calendario 
FOR DELETE USING (public.is_admin());

-- 12. TABELA: TIPOS_AUDITORIA
DROP POLICY IF EXISTS "Acesso total tipos_auditoria" ON public.tipos_auditoria;
DROP POLICY IF EXISTS "tipos_auditoria_select_policy" ON public.tipos_auditoria;
DROP POLICY IF EXISTS "tipos_auditoria_insert_policy" ON public.tipos_auditoria;
DROP POLICY IF EXISTS "tipos_auditoria_update_policy" ON public.tipos_auditoria;
DROP POLICY IF EXISTS "tipos_auditoria_delete_policy" ON public.tipos_auditoria;

CREATE POLICY "tipos_auditoria_select_policy" ON public.tipos_auditoria 
FOR SELECT USING (auth.role() = 'authenticated' OR public.current_user_id() IS NOT NULL);

CREATE POLICY "tipos_auditoria_insert_policy" ON public.tipos_auditoria 
FOR INSERT WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "tipos_auditoria_update_policy" ON public.tipos_auditoria 
FOR UPDATE USING (public.is_admin_or_gerencia()) WITH CHECK (public.is_admin_or_gerencia());

CREATE POLICY "tipos_auditoria_delete_policy" ON public.tipos_auditoria 
FOR DELETE USING (public.is_admin_or_gerencia());

-- ==============================================================================
-- VIEWS E CONSULTAS ANALÍTICAS PRINCIPAIS DO SISTEMA
-- ==============================================================================

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
`;
