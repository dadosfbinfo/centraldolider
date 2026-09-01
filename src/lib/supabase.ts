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

-- 1. TABELA: UNIDADES
CREATE TABLE IF NOT EXISTS public.unidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    regional VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ATIVA' CHECK (status IN ('ATIVA', 'INATIVA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA: USUARIOS / PERFIS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'LIDER' CHECK (role IN ('ADMINISTRADOR', 'LIDER')),
    status_confirmacao VARCHAR(50) NOT NULL DEFAULT 'PENDENTE' CHECK (status_confirmacao IN ('CONFIRMADO', 'PENDENTE')),
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
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
    matricula VARCHAR(50) UNIQUE NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    unidade VARCHAR(255) NOT NULL,
    regional VARCHAR(100) NOT NULL,
    gestor VARCHAR(255) NOT NULL,
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
    unidade VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    prazo TIMESTAMP WITH TIME ZONE NOT NULL,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    categoria_nome VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA')),
    tipo_conclusao_exigido VARCHAR(50) DEFAULT 'FOTO_EVIDENCIA' CHECK (tipo_conclusao_exigido IN ('FOTO_EVIDENCIA', 'CHECKLIST', 'ASSINATURA', 'TEXTO', 'SIMPLES')),
    recorrencia VARCHAR(30) DEFAULT 'NENHUMA' CHECK (recorrencia IN ('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL')),
    data_conclusao TIMESTAMP WITH TIME ZONE,
    tempo_execucao_minutos INTEGER,
    evidencia_url TEXT,
    observacoes_conclusao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA: METAS
CREATE TABLE IF NOT EXISTS public.metas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicador VARCHAR(255) NOT NULL,
    meta_valor NUMERIC(15,2) NOT NULL,
    valor_atual NUMERIC(15,2) DEFAULT 0.00,
    unidade_medida VARCHAR(20) DEFAULT '%',
    periodo VARCHAR(100) NOT NULL,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    lider_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    lider_nome VARCHAR(255),
    status VARCHAR(30) DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'ATINGIDA', 'NAO_ATINGIDA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA: RELATORIOS
CREATE TABLE IF NOT EXISTS public.relatorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    periodo VARCHAR(100) NOT NULL,
    data_publicacao DATE NOT NULL,
    publico_acesso VARCHAR(30) DEFAULT 'TODOS' CHECK (publico_acesso IN ('TODOS', 'ADMINISTRADOR', 'LIDER')),
    descricao TEXT NOT NULL,
    arquivo_pdf_url TEXT NOT NULL,
    tamanho_arquivo VARCHAR(50),
    total_leituras INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA: CALENDARIO_EVENTOS
CREATE TABLE IF NOT EXISTS public.calendario_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('TAREFA', 'REUNIAO', 'RELATORIO', 'EVENTO', 'PENDENCIA')),
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    unidade_nome VARCHAR(255),
    lider_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    lider_nome VARCHAR(255),
    descricao TEXT,
    local VARCHAR(255),
    status VARCHAR(30) DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA: COMENTARIOS (Polimórfica para tarefas, metas, relatórios, eventos)
CREATE TABLE IF NOT EXISTS public.comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    autor_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    autor_nome VARCHAR(255) NOT NULL,
    autor_role VARCHAR(50) NOT NULL,
    autor_avatar TEXT,
    texto TEXT NOT NULL,
    item_tipo VARCHAR(30) NOT NULL CHECK (item_tipo IN ('TAREFA', 'META', 'RELATORIO', 'EVENTO')),
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

-- RLS: USUARIOS (Admin vê todos e altera tudo; Usuário autenticado vê seu próprio perfil)
CREATE POLICY "Admins podem ver todos usuarios" ON public.usuarios FOR SELECT USING (public.is_admin() OR auth.uid() = id);
CREATE POLICY "Admins podem atualizar todos usuarios" ON public.usuarios FOR UPDATE USING (public.is_admin() OR auth.uid() = id);
CREATE POLICY "Admins podem deletar usuarios" ON public.usuarios FOR DELETE USING (public.is_admin());

-- RLS: TAREFAS_OS (Admin gerencia todas; Líder vê e atualiza as suas)
CREATE POLICY "Tarefas leitura" ON public.tarefas_os FOR SELECT USING (public.is_admin() OR responsavel_id = auth.uid());
CREATE POLICY "Tarefas criacao e edicao admin" ON public.tarefas_os FOR ALL USING (public.is_admin());
CREATE POLICY "Lider atualiza status tarefa" ON public.tarefas_os FOR UPDATE USING (responsavel_id = auth.uid());

-- RLS: NOTIFICACOES
CREATE POLICY "Usuario gerencia suas notificacoes" ON public.notificacoes FOR ALL USING (usuario_id = auth.uid() OR public.is_admin());

-- RLS: COMENTARIOS
CREATE POLICY "Leitura de comentarios" ON public.comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Criacao de comentarios" ON public.comentarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);

-- ==============================================================================
-- STORAGE BUCKETS (SUPABASE STORAGE)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('relatorios_pdf', 'relatorios_pdf', true), ('evidencias_os', 'evidencias_os', true)
ON CONFLICT (id) DO NOTHING;
`;
