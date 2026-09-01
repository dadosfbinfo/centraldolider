/**
 * Central do Líder - Definições de Tipos e Estruturas de Banco de Dados
 * Compatível com Supabase / PostgreSQL e Store Local Reativo
 */

export type UserRole = 'ADMINISTRADOR' | 'LIDER';
export type ConfirmationStatus = 'CONFIRMADO' | 'PENDENTE';

export type TaskPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TaskStatus = 'PROGRAMADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ATRASADA' | 'BLOQUEADA' | 'CANCELADA';
export type TaskRecurrence = 'UMA_VEZ' | 'DIARIA' | 'DIAS_UTEIS' | 'SEMANAL' | 'MENSAL' | 'PERSONALIZADA';

export type TaskEvidenceType = 
  | 'SIMPLES' 
  | 'NUMERO' 
  | 'TEXTO' 
  | 'ARQUIVO' 
  | 'FOTO' 
  | 'FORMULARIO' 
  | 'OPCAO' 
  | 'CHECKLIST';

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido?: boolean;
}

export interface FormularioPergunta {
  id: string;
  pergunta: string;
  tipo: 'TEXTO' | 'NUMERO' | 'SIM_NAO' | 'SELECAO';
  opcoes?: string[];
  obrigatoria: boolean;
}

export interface RequisitoConclusao {
  id: string;
  tipo: TaskEvidenceType;
  titulo?: string;
  instrucoes?: string;
  obrigatorio: boolean;
  unidade_medida?: string; // Para tipo NUMERO (ex: °C, KG, %, R$, Minutos, Unidades)
  valor_minimo?: number;
  valor_maximo?: number;
  opcoes?: string[]; // Para tipo OPCAO
  perguntas?: FormularioPergunta[]; // Para tipo FORMULARIO
  checklist_itens?: ChecklistItem[]; // Para tipo CHECKLIST
}

export interface EvidenciaSubmetida {
  requisito_id: string;
  tipo: TaskEvidenceType;
  valor_numero?: number;
  unidade_medida?: string;
  valor_texto?: string;
  texto_resposta?: string;
  arquivo_nome?: string;
  arquivo_url?: string;
  foto_url?: string;
  respostas_formulario?: Record<string, string | number | boolean>;
  formulario_respostas?: Record<string, string | number | boolean>;
  opcao_selecionada?: string;
  checklist_concluidos?: string[]; // IDs dos itens marcados como feitos
  data_registro: string;
}

export type EventType = 
  | 'TAREFA' 
  | 'REUNIAO' 
  | 'RELATORIO' 
  | 'EVENTO' 
  | 'PENDENCIA' 
  | 'TREINAMENTO' 
  | 'COMUNICADO';

export type CommentTargetType = 'TAREFA' | 'META' | 'RELATORIO' | 'EVENTO' | 'CALENDARIO';
export type ReportAudience = 'TODOS' | 'ADMINISTRADOR' | 'LIDER';
export type LeaderStatus = 'ATIVO' | 'INATIVO' | 'AFASTADO';

export type NotificationType = 
  | 'OS_ATRIBUIDA' 
  | 'PRAZO_PROXIMO' 
  | 'TAREFA_ATRASADA'
  | 'META_ATUALIZADA' 
  | 'META_NAO_ATINGIDA'
  | 'RELATORIO_PUBLICADO' 
  | 'COMUNICADO_CALENDARIO'
  | 'COMENTARIO' 
  | 'CADASTRO_CONFIRMADO' 
  | 'OS_BLOQUEADA'
  | 'OS_CONCLUIDA'
  | 'SISTEMA';

// 1. Tabela: usuarios / perfis
export interface UsuarioPerfil {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  status_confirmacao: ConfirmationStatus;
  unidade_id?: string;
  unidade_nome?: string;
  cargo?: string;
  telefone?: string;
  avatar_url?: string;
  token_confirmacao?: string;
  created_at: string;
  updated_at: string;
}

// 2. Tabela: lideres
export interface Lider {
  id: string;
  usuario_id: string;
  nome: string;
  email: string;
  matricula: string;
  cargo: string;
  unidade: string;
  unidade_id?: string;
  regional: string;
  gestor: string;
  status: LeaderStatus;
  telefone?: string;
  created_at: string;
  updated_at: string;
}

// 3. Tabela: unidades
export interface Unidade {
  id: string;
  nome: string;
  regional: string;
  codigo: string;
  status: 'ATIVA' | 'INATIVA';
  cidade?: string;
  estado?: string;
  endereco?: string;
  responsavel_nome?: string;
  created_at: string;
}

// 4. Tabela: categorias
export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  descricao?: string;
  tipo: 'OPERACIONAL' | 'SEGURANCA' | 'QUALIDADE' | 'ADMINISTRATIVO' | 'OUTROS';
  created_at: string;
}

// 5. Tabela: tarefas_os (Ordem de Serviço)
export interface TarefaOS {
  id: string;
  numero_os: string; // ex: "OS #000152"
  titulo: string;
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_email?: string;
  responsavel_cargo?: string;
  unidade_id?: string;
  unidade: string; // Nome da unidade
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  prazo: string; // YYYY-MM-DDTHH:mm ou ISO
  descricao: string;
  prioridade: TaskPriority;
  categoria_id: string;
  categoria_nome: string;
  categoria_cor?: string;
  status: TaskStatus;
  recorrencia: TaskRecurrence;
  recorrencia_config?: {
    dias_semana?: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    horario_custom?: string;
    intervalo_dias?: number;
  };
  requisitos_conclusao: RequisitoConclusao[];
  evidencias?: EvidenciaSubmetida[];
  motivo_bloqueio?: string;
  data_bloqueio?: string;
  data_inicio?: string;
  data_conclusao?: string;
  tempo_execucao_minutos?: number;
  observacoes_conclusao?: string;
  parent_os_id?: string;
  created_at: string;
  updated_at: string;
}

// 6. Tabela: metas
export type GoalPeriodicity = 'DIARIA' | 'SEMANAL' | 'MENSAL';
export type GoalDirection = 'MAIOR_MELHOR' | 'MENOR_MELHOR'; // Ex: Absenteísmo e Perdas = MENOR_MELHOR; Produção e Atendimento = MAIOR_MELHOR

export interface Meta {
  id: string;
  indicador: string; // Ex: Produção, Atendimento, Absenteísmo, Qualidade, Faturamento, SLA de OS
  meta_valor: number;
  valor_atual: number;
  unidade_medida: string; // '%', 'R$', 'unidades', 'horas', 'pts', 'atendimentos'
  tipo_periodo: GoalPeriodicity; // DIARIA, SEMANAL, MENSAL
  periodo: string; // Ex: 'Agosto/2026', 'Semana 35 (25/08 a 31/08)', '01/09/2026'
  data_inicio?: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
  unidade_id?: string;
  unidade_nome?: string;
  lider_id?: string;
  lider_nome?: string;
  direcao_melhor?: GoalDirection; // Padrão: MAIOR_MELHOR
  descricao?: string;
  status: 'EM_ANDAMENTO' | 'ATINGIDA' | 'NAO_ATINGIDA';
  created_at: string;
  updated_at: string;
}

// 7. Tabela: relatorios
export type ReportType = 'DIARIO' | 'SEMANAL' | 'MENSAL';
export type ReportAudienceType = 'TODOS' | 'UNIDADES' | 'LIDERES';

export interface ConfirmacaoLeituraRelatorio {
  usuario_id: string;
  usuario_nome: string;
  usuario_cargo?: string;
  unidade_nome?: string;
  data_hora: string; // Formato ISO, ex: "2026-08-27T10:32:00Z"
}

export interface Relatorio {
  id: string;
  titulo: string;
  tipo: ReportType; // DIARIO, SEMANAL, MENSAL
  periodo: string; // Período de referência, ex: '27/08/2026', 'Semana 34 - Ago/2026', 'Agosto/2026'
  data_publicacao: string; // YYYY-MM-DD
  publicado: boolean; // Administrador pode publicar ou retirar publicação sem excluir
  publico_tipo: ReportAudienceType; // TODOS, UNIDADES, LIDERES
  unidades_alvo?: string[]; // IDs das unidades com acesso (se publico_tipo === 'UNIDADES' ou múltiplos)
  lideres_alvo?: string[]; // IDs dos líderes com acesso (se publico_tipo === 'LIDERES' ou múltiplos)
  descricao: string;
  arquivo_pdf_nome: string;
  arquivo_pdf_url: string; // URL ou base64
  arquivo_pdf_tamanho?: string;
  arquivo_pdf_conteudo?: string; // Conteúdo estruturado para visualização no leitor embutido
  total_leituras: number;
  confirmacoes_leitura: ConfirmacaoLeituraRelatorio[];
  leitores_confirmados?: string[]; // IDs dos líderes para compatibilidade rápida
  created_at: string;
  updated_at: string;
}

// 8. Tabela: calendario_eventos
export interface CalendarioEvento {
  id: string;
  titulo: string;
  tipo: EventType;
  data: string; // YYYY-MM-DD
  horario_inicio: string; // HH:mm
  horario_fim?: string; // HH:mm
  dia_inteiro?: boolean;
  unidade_id?: string;
  unidade_nome?: string;
  lider_id?: string;
  lider_nome?: string;
  publico_tipo?: 'TODOS' | 'UNIDADES' | 'LIDERES';
  unidades_alvo?: string[];
  lideres_alvo?: string[];
  descricao?: string;
  local?: string;
  link_reuniao?: string;
  criado_por_id?: string;
  criado_por_nome?: string;
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  created_at: string;
  updated_at?: string;
}

// 9. Tabela: comentarios
export interface Comentario {
  id: string;
  autor_id: string;
  autor_nome: string;
  autor_role: UserRole;
  autor_avatar?: string;
  texto: string;
  item_tipo: CommentTargetType;
  item_id: string;
  created_at: string;
}

// 10. Tabela: notificacoes
export interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: NotificationType;
  titulo: string;
  texto: string;
  lida: boolean;
  item_tipo?: 'TAREFA' | 'META' | 'RELATORIO' | 'CALENDARIO' | 'EVENTO' | 'USUARIO' | 'LIDER';
  item_id?: string;
  link_acao?: string;
  created_at: string;
}

// Registro de envio de email para simulação do fluxo de confirmação
export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  token: string;
  activationUrl: string;
  userName: string;
  timestamp: string;
  type: 'CONFIRMACAO_CADASTRO' | 'RECUPERACAO_SENHA';
}
