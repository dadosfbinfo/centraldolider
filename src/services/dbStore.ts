import {
  UsuarioPerfil,
  Lider,
  Unidade,
  Projeto,
  Categoria,
  TarefaOS,
  TaskStatus,
  Meta,
  Relatorio,
  CalendarioEvento,
  TipoEventoConfig,
  Comentario,
  Notificacao,
  SimulatedEmail,
  UserRole,
  ConfirmationStatus,
  EvidenciaSubmetida,
  AprovacaoValidador,
} from '../types/database';

const STORAGE_KEYS = {
  USERS: 'cdl_usuarios_v1',
  LEADERS: 'cdl_lideres_v1',
  UNITS: 'cdl_unidades_v1',
  CATEGORIES: 'cdl_categorias_v1',
  TASKS: 'cdl_tarefas_os_v2', // bumped to v2 for enhanced schema
  GOALS: 'cdl_metas_v3',
  REPORTS: 'cdl_relatorios_v3',
  EVENTS: 'cdl_calendario_eventos_v1',
  CALENDAR_TYPES: 'cdl_calendar_types_v1',
  COMMENTS: 'cdl_comentarios_v1',
  NOTIFICATIONS: 'cdl_notificacoes_v1',
  SIMULATED_EMAILS: 'cdl_simulated_emails_v1',
  PASSWORDS: 'cdl_passwords_v1',
};

// Initial Seed Data
const INITIAL_UNITS: Unidade[] = [
  { id: 'unit-sp-01', nome: 'Unidade São Paulo - Matriz Pinheiros', regional: 'Sudeste 1', codigo: 'UN-SP01', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Brigadeiro Faria Lima, 1485', responsavel_nome: 'Mariana Costa', status: 'ATIVA', created_at: '2026-08-01T08:00:00Z' },
  { id: 'unit-rj-01', nome: 'Unidade Rio de Janeiro - Barra da Tijuca', regional: 'Sudeste 2', codigo: 'UN-RJ01', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Av. das Américas, 3500', responsavel_nome: 'Roberto Almeida', status: 'ATIVA', created_at: '2026-08-01T08:00:00Z' },
  { id: 'unit-mg-01', nome: 'Unidade Belo Horizonte - Savassi', regional: 'Minas/Centro', codigo: 'UN-MG01', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Rua Pernambuco, 1000', responsavel_nome: 'Fernanda Lima', status: 'ATIVA', created_at: '2026-08-01T08:00:00Z' },
  { id: 'unit-pr-01', nome: 'Unidade Curitiba - Batel', regional: 'Sul', codigo: 'UN-PR01', cidade: 'Curitiba', estado: 'PR', endereco: 'Av. do Batel, 1800', responsavel_nome: 'Juliana Oliveira', status: 'ATIVA', created_at: '2026-08-01T08:00:00Z' },
];

const INITIAL_CATEGORIES: Categoria[] = [
  { id: 'cat-op', nome: 'Rotina Operacional', cor: '#C76B4A', descricao: 'Abertura, fechamento e controle de piso', tipo: 'OPERACIONAL', created_at: '2026-08-01T08:00:00Z' },
  { id: 'cat-seg', nome: 'Segurança & Saúde', cor: '#B85C7A', descricao: 'EPIs, brigada e conformidade técnica', tipo: 'SEGURANCA', created_at: '2026-08-01T08:00:00Z' },
  { id: 'cat-qual', nome: 'Qualidade & Auditoria', cor: '#355C7D', descricao: 'Padrões de atendimento e produto', tipo: 'QUALIDADE', created_at: '2026-08-01T08:00:00Z' },
  { id: 'cat-est', nome: 'Gestão de Estoque', cor: '#5B7DBE', descricao: 'Inventários, conferência e perdas', tipo: 'OPERACIONAL', created_at: '2026-08-01T08:00:00Z' },
  { id: 'cat-adm', nome: 'Administrativo & RH', cor: '#8B6B4A', descricao: 'Ponto, escalas e documentos legais', tipo: 'ADMINISTRATIVO', created_at: '2026-08-01T08:00:00Z' },
];

const INITIAL_USERS: UsuarioPerfil[] = [
  {
    id: 'user-admin-01',
    email: 'admin@centraldolider.com.br',
    nome: 'Carlos Eduardo Ramos (Admin)',
    role: 'ADMINISTRADOR',
    status_confirmacao: 'CONFIRMADO',
    cargo: 'Diretor de Operações',
    telefone: '(11) 98765-4321',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-08-01T08:00:00Z',
    updated_at: '2026-08-01T08:00:00Z',
  },
  {
    id: 'user-lider-sp',
    email: 'mariana.costa@centraldolider.com.br',
    nome: 'Mariana Costa',
    role: 'LIDER',
    status_confirmacao: 'CONFIRMADO',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    cargo: 'Gerente de Unidade',
    telefone: '(11) 97123-8899',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-08-05T09:00:00Z',
    updated_at: '2026-08-05T09:00:00Z',
  },
  {
    id: 'user-lider-rj',
    email: 'roberto.almeida@centraldolider.com.br',
    nome: 'Roberto Almeida',
    role: 'LIDER',
    status_confirmacao: 'CONFIRMADO',
    unidade_id: 'unit-rj-01',
    unidade_nome: 'Unidade Rio de Janeiro - Barra da Tijuca',
    cargo: 'Supervisor Operacional',
    telefone: '(21) 98844-3322',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-08-10T10:00:00Z',
    updated_at: '2026-08-10T10:00:00Z',
  },
  {
    id: 'user-lider-mg',
    email: 'fernanda.lima@centraldolider.com.br',
    nome: 'Fernanda Lima',
    role: 'LIDER',
    status_confirmacao: 'CONFIRMADO',
    unidade_id: 'unit-mg-01',
    unidade_nome: 'Unidade Belo Horizonte - Savassi',
    cargo: 'Líder de Turno',
    telefone: '(31) 99123-4567',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-08-15T11:00:00Z',
    updated_at: '2026-08-15T11:00:00Z',
  },
  {
    id: 'user-gerencia-01',
    email: 'gerencia.teste@centraldolider.com.br',
    nome: 'Gerência Teste',
    role: 'GERENCIA',
    status_confirmacao: 'CONFIRMADO',
    cargo: 'Gerente Regional de Operações',
    telefone: '(11) 98888-7777',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-08-20T08:00:00Z',
    updated_at: '2026-08-20T08:00:00Z',
  },
  {
    id: 'user-lider-teste',
    email: 'lider.teste@centraldolider.com.br',
    nome: 'Líder Teste',
    role: 'LIDER',
    status_confirmacao: 'CONFIRMADO',
    unidade_id: 'unit-pr-01',
    unidade_nome: 'Unidade Curitiba - Batel',
    projeto_id: 'unit-pr-01',
    projeto_nome: 'Unidade Curitiba - Batel',
    cargo: 'Líder Operacional Curitiba',
    telefone: '(41) 99999-1122',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-08-25T08:00:00Z',
    updated_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 'user-pending-01',
    email: 'juliana.oliveira@centraldolider.com.br',
    nome: 'Juliana Oliveira (Pendente)',
    role: 'LIDER',
    status_confirmacao: 'PENDENTE',
    unidade_id: 'unit-pr-01',
    unidade_nome: 'Unidade Curitiba - Batel',
    cargo: 'Subgerente em Integração',
    telefone: '(41) 98777-6655',
    token_confirmacao: 'token_cdl_juliana_preview_123',
    created_at: '2026-08-28T14:30:00Z',
    updated_at: '2026-08-28T14:30:00Z',
  }
];

const INITIAL_PASSWORDS: Record<string, string> = {
  'admin@centraldolider.com.br': 'Admin@123',
  'gerencia.teste@centraldolider.com.br': 'Gerencia@123',
  'mariana.costa@centraldolider.com.br': 'Lider@123',
  'roberto.almeida@centraldolider.com.br': 'Lider@123',
  'fernanda.lima@centraldolider.com.br': 'Lider@123',
  'lider.teste@centraldolider.com.br': 'Lider@123',
  'juliana.oliveira@centraldolider.com.br': 'Lider@123',
};

const INITIAL_LEADERS: Lider[] = [
  {
    id: 'lider-01',
    usuario_id: 'user-lider-sp',
    nome: 'Mariana Costa',
    email: 'mariana.costa@centraldolider.com.br',
    matricula: 'MAT-9941',
    cargo: 'Gerente de Unidade',
    unidade: 'Unidade São Paulo - Matriz Pinheiros',
    unidade_id: 'unit-sp-01',
    projeto: 'Unidade São Paulo - Matriz Pinheiros',
    projeto_id: 'unit-sp-01',
    regional: 'Sudeste 1',
    gestor: 'Carlos Eduardo Ramos',
    status: 'ATIVO',
    telefone: '(11) 97123-8899',
    created_at: '2026-08-05T09:00:00Z',
    updated_at: '2026-08-05T09:00:00Z',
  },
  {
    id: 'lider-02',
    usuario_id: 'user-lider-rj',
    nome: 'Roberto Almeida',
    email: 'roberto.almeida@centraldolider.com.br',
    matricula: 'MAT-8812',
    cargo: 'Supervisor Operacional',
    unidade: 'Unidade Rio de Janeiro - Barra da Tijuca',
    unidade_id: 'unit-rj-01',
    projeto: 'Unidade Rio de Janeiro - Barra da Tijuca',
    projeto_id: 'unit-rj-01',
    regional: 'Sudeste 2',
    gestor: 'Carlos Eduardo Ramos',
    status: 'ATIVO',
    telefone: '(21) 98844-3322',
    created_at: '2026-08-10T10:00:00Z',
    updated_at: '2026-08-10T10:00:00Z',
  },
  {
    id: 'lider-03',
    usuario_id: 'user-lider-mg',
    nome: 'Fernanda Lima',
    email: 'fernanda.lima@centraldolider.com.br',
    matricula: 'MAT-7733',
    cargo: 'Líder de Turno',
    unidade: 'Unidade Belo Horizonte - Savassi',
    unidade_id: 'unit-mg-01',
    projeto: 'Unidade Belo Horizonte - Savassi',
    projeto_id: 'unit-mg-01',
    regional: 'Minas/Centro',
    gestor: 'Carlos Eduardo Ramos',
    status: 'ATIVO',
    telefone: '(31) 99123-4567',
    created_at: '2026-08-15T11:00:00Z',
    updated_at: '2026-08-15T11:00:00Z',
  },
  {
    id: 'lider-teste',
    usuario_id: 'user-lider-teste',
    nome: 'Líder Teste',
    email: 'lider.teste@centraldolider.com.br',
    matricula: 'MAT-9900',
    cargo: 'Líder Operacional Curitiba',
    unidade: 'Unidade Curitiba - Batel',
    unidade_id: 'unit-pr-01',
    projeto: 'Unidade Curitiba - Batel',
    projeto_id: 'unit-pr-01',
    regional: 'Sul',
    gestor: 'Carlos Eduardo Ramos',
    status: 'ATIVO',
    telefone: '(41) 99999-1122',
    created_at: '2026-08-25T08:00:00Z',
    updated_at: '2026-08-25T08:00:00Z',
  }
];

const INITIAL_CALENDAR_TYPES: TipoEventoConfig[] = [
  { id: 'REUNIAO', nome: 'Reunião de Alinhamento', cor: '#2E7D32', descricao: 'Reuniões de alinhamento com a liderança', is_default: true },
  { id: 'TREINAMENTO', nome: 'Treinamento & Capacitação', cor: '#7C3AED', descricao: 'Workshops, cursos e integração de equipes', is_default: true },
  { id: 'AUDITORIA', nome: 'Auditoria / Inspeção', cor: '#355C7D', descricao: 'Auditorias operacionais e de conformidade', is_default: true },
  { id: 'VISITA_TECNICA', nome: 'Visita Técnica', cor: '#0D9488', descricao: 'Vistorias e acompanhamentos presenciais', is_default: true },
  { id: 'COMUNICADO', nome: 'Comunicado Operacional', cor: '#C76B4A', descricao: 'Avisos e comunicados gerais de gestão', is_default: true },
  { id: 'EVENTO', nome: 'Evento Geral', cor: '#D97706', descricao: 'Eventos corporativos e gerais', is_default: true },
];

const INITIAL_TASKS: TarefaOS[] = [
  {
    id: 'os-101',
    numero_os: 'OS #000150',
    titulo: 'Auditoria Diária de Abertura de Caixa e Fundo de Reserva',
    responsavel_id: 'user-lider-sp',
    responsavel_nome: 'Mariana Costa',
    responsavel_cargo: 'Gerente de Unidade',
    unidade_id: 'unit-sp-01',
    unidade: 'Unidade São Paulo - Matriz Pinheiros',
    data: '2026-09-01',
    horario: '08:00',
    prazo: '2026-09-01T10:30:00',
    descricao: 'Conferir numerário dos caixas 1 a 6, testar impressoras fiscais, validar conectividade SAT/NFC-e e registrar checklist com contagem de valores.',
    prioridade: 'ALTA',
    categoria_id: 'cat-op',
    categoria_nome: 'Rotina Operacional',
    categoria_cor: '#C76B4A',
    status: 'EM_ANDAMENTO',
    recorrencia: 'DIARIA',
    requisitos_conclusao: [
      {
        id: 'req-101-1',
        tipo: 'CHECKLIST',
        titulo: 'Checklist de Abertura',
        instrucoes: 'Marque todos os procedimentos executados antes da abertura dos portões',
        obrigatorio: true,
        checklist_itens: [
          { id: 'chk-1', texto: 'Contagem física do fundo de caixa (R$ 500 por PDV)', concluido: true },
          { id: 'chk-2', texto: 'Teste de impressão do comprovante fiscal (bobinas trocadas)', concluido: true },
          { id: 'chk-3', texto: 'Verificação de terminal de cartão e conectividade Wi-Fi/4G', concluido: false },
          { id: 'chk-4', texto: 'Inspeção visual da área de atendimento e climatização', concluido: false },
        ]
      },
      {
        id: 'req-101-2',
        tipo: 'NUMERO',
        titulo: 'Fundo Total de Abertura Consolidado',
        instrucoes: 'Informe o total apurado na soma dos caixas',
        unidade_medida: 'R$',
        obrigatorio: true,
      }
    ],
    data_inicio: '2026-09-01T07:45:00Z',
    created_at: '2026-09-01T06:00:00Z',
    updated_at: '2026-09-01T07:45:00Z',
  },
  {
    id: 'os-102',
    numero_os: 'OS #000151',
    titulo: 'Vistoria Semanal de Câmaras Frias e Controle Térmico',
    responsavel_id: 'user-lider-sp',
    responsavel_nome: 'Mariana Costa',
    responsavel_cargo: 'Gerente de Unidade',
    unidade_id: 'unit-sp-01',
    unidade: 'Unidade São Paulo - Matriz Pinheiros',
    data: '2026-09-01',
    horario: '11:00',
    prazo: '2026-09-01T17:00:00',
    descricao: 'Realizar aferição com termômetro calibrado nas câmaras de resfriados e congelados, registrando medição e fotografia do painel digital.',
    prioridade: 'ALTA',
    categoria_id: 'cat-qual',
    categoria_nome: 'Qualidade & Auditoria',
    categoria_cor: '#355C7D',
    status: 'PROGRAMADA',
    recorrencia: 'DIAS_UTEIS',
    requisitos_conclusao: [
      {
        id: 'req-102-1',
        tipo: 'NUMERO',
        titulo: 'Temperatura da Câmara Fria Principal',
        instrucoes: 'Informe a temperatura aferida no sensor central (Padrão: entre -18°C e -22°C)',
        unidade_medida: '°C',
        valor_minimo: -30,
        valor_maximo: 10,
        obrigatorio: true,
      },
      {
        id: 'req-102-2',
        tipo: 'FOTO',
        titulo: 'Foto do Display do Termômetro e Registro',
        instrucoes: 'Envie uma foto nítida do display digital com hora visível',
        obrigatorio: true,
      },
      {
        id: 'req-102-3',
        tipo: 'TEXTO',
        titulo: 'Observações de Vedação e Gelo',
        instrucoes: 'Relate qualquer acúmulo excessivo de gelo ou desgaste nas borrachas',
        obrigatorio: false,
      }
    ],
    created_at: '2026-09-01T06:30:00Z',
    updated_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 'os-103',
    numero_os: 'OS #000152',
    titulo: 'Vistoria Mensal de Extintores, Laudos e Rotas de Fuga',
    responsavel_id: 'user-lider-sp',
    responsavel_nome: 'Mariana Costa',
    responsavel_cargo: 'Gerente de Unidade',
    unidade_id: 'unit-sp-01',
    unidade: 'Unidade São Paulo - Matriz Pinheiros',
    data: '2026-08-30',
    horario: '14:00',
    prazo: '2026-08-31T18:00:00',
    descricao: 'Inspecionar lacres, manômetros, desobstrução e validade de carga dos 12 extintores da unidade conforme laudo AVCB.',
    prioridade: 'ALTA',
    categoria_id: 'cat-seg',
    categoria_nome: 'Segurança & Saúde',
    categoria_cor: '#B85C7A',
    status: 'ATRASADA',
    recorrencia: 'MENSAL',
    requisitos_conclusao: [
      {
        id: 'req-103-1',
        tipo: 'FORMULARIO',
        titulo: 'Questionário de Segurança Contra Incêndio',
        instrucoes: 'Responda aos itens obrigatórios da auditoria',
        obrigatorio: true,
        perguntas: [
          { id: 'q1', pergunta: 'Todos os 12 extintores estão com lacre intacto?', tipo: 'SIM_NAO', obrigatoria: true },
          { id: 'q2', pergunta: 'As luzes de emergência acenderam no teste?', tipo: 'SIM_NAO', obrigatoria: true },
          { id: 'q3', pergunta: 'Quantidade de extintores com recarga a vencer em 30 dias:', tipo: 'NUMERO', obrigatoria: true },
          { id: 'q4', pergunta: 'Status das rotas de fuga e portas corta-fogo:', tipo: 'SELECAO', opcoes: ['100% Desobstruídas', 'Parcialmente obstruídas', 'Crítico / Bloqueadas'], obrigatoria: true }
        ]
      },
      {
        id: 'req-103-2',
        tipo: 'FOTO',
        titulo: 'Foto do Mapa e Ficha de Inspeção Assinada',
        instrucoes: 'Anexe a foto da planilha física de vistoria preenchida',
        obrigatorio: true
      }
    ],
    created_at: '2026-08-30T07:00:00Z',
    updated_at: '2026-08-30T07:00:00Z',
  },
  {
    id: 'os-104',
    numero_os: 'OS #000153',
    titulo: 'Manutenção Corretiva da Bomba de Recalque de Água',
    responsavel_id: 'user-lider-sp',
    responsavel_nome: 'Mariana Costa',
    responsavel_cargo: 'Gerente de Unidade',
    unidade_id: 'unit-sp-01',
    unidade: 'Unidade São Paulo - Matriz Pinheiros',
    data: '2026-08-31',
    horario: '15:00',
    prazo: '2026-09-02T12:00:00',
    descricao: 'Acompanhar a equipe técnica terceira para substituição do selo mecânico da bomba B2.',
    prioridade: 'MEDIA',
    categoria_id: 'cat-op',
    categoria_nome: 'Rotina Operacional',
    categoria_cor: '#C76B4A',
    status: 'BLOQUEADA',
    recorrencia: 'UMA_VEZ',
    motivo_bloqueio: 'Prestador de serviço terceirizado (HidroTec) não compareceu no horário agendado por falta de peça de reposição. Reagendado para amanhã às 10h.',
    data_bloqueio: '2026-08-31T16:30:00Z',
    requisitos_conclusao: [
      {
        id: 'req-104-1',
        tipo: 'ARQUIVO',
        titulo: 'Ordem de Serviço do Prestador Assinada (PDF/DOC)',
        instrucoes: 'Anexe o comprovante de execução fornecido pelo técnico',
        obrigatorio: true
      },
      {
        id: 'req-104-2',
        tipo: 'OPCAO',
        titulo: 'Parecer do Funcionamento pós-reparo',
        instrucoes: 'Selecione a situação final do equipamento',
        obrigatorio: true,
        opcoes: ['Em pleno funcionamento (Sem ruídos)', 'Funcionando com ressalvas', 'Necessita nova intervenção']
      }
    ],
    created_at: '2026-08-31T09:00:00Z',
    updated_at: '2026-08-31T16:30:00Z',
  },
  {
    id: 'os-105',
    numero_os: 'OS #000154',
    titulo: 'Conferência de Inventário Semanal de Carnes e Hortifruti',
    responsavel_id: 'user-lider-sp',
    responsavel_nome: 'Mariana Costa',
    responsavel_cargo: 'Gerente de Unidade',
    unidade_id: 'unit-sp-01',
    unidade: 'Unidade São Paulo - Matriz Pinheiros',
    data: '2026-08-31',
    horario: '06:00',
    prazo: '2026-08-31T09:30:00',
    descricao: 'Contagem cega de todos os itens da curva A de perecíveis e input das divergências no sistema.',
    prioridade: 'ALTA',
    categoria_id: 'cat-est',
    categoria_nome: 'Gestão de Estoque',
    categoria_cor: '#5B7DBE',
    status: 'CONCLUIDA',
    recorrencia: 'SEMANAL',
    data_inicio: '2026-08-31T06:10:00Z',
    data_conclusao: '2026-08-31T08:45:00Z',
    tempo_execucao_minutos: 155,
    observacoes_conclusao: 'Inventário realizado com sucesso. Acuracidade de 99.2% na contagem física vs contábil. Divergência mínima em 2kg de queijo muçarela devidamente justificada por quebra operacional.',
    requisitos_conclusao: [
      {
        id: 'req-105-1',
        tipo: 'CHECKLIST',
        titulo: 'Conferência de Grupos',
        obrigatorio: true,
        checklist_itens: [
          { id: 'c1', texto: 'Contagem de Carnes Bovinas e Aves', concluido: true },
          { id: 'c2', texto: 'Contagem de Laticínios e Embutidos', concluido: true },
          { id: 'c3', texto: 'Pesagem de Hortifruti', concluido: true },
          { id: 'c4', texto: 'Validação de datas de validade (PVPS)', concluido: true }
        ]
      },
      {
        id: 'req-105-2',
        tipo: 'NUMERO',
        titulo: 'Acuracidade Apurada (%)',
        unidade_medida: '%',
        obrigatorio: true
      },
      {
        id: 'req-105-3',
        tipo: 'FOTO',
        titulo: 'Foto da Folha de Contagem com Assinatura',
        obrigatorio: true
      }
    ],
    evidencias: [
      {
        requisito_id: 'req-105-1',
        tipo: 'CHECKLIST',
        checklist_concluidos: ['c1', 'c2', 'c3', 'c4'],
        data_registro: '2026-08-31T08:40:00Z'
      },
      {
        requisito_id: 'req-105-2',
        tipo: 'NUMERO',
        valor_numero: 99.2,
        unidade_medida: '%',
        data_registro: '2026-08-31T08:42:00Z'
      },
      {
        requisito_id: 'req-105-3',
        tipo: 'FOTO',
        foto_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        data_registro: '2026-08-31T08:45:00Z'
      }
    ],
    created_at: '2026-08-30T10:00:00Z',
    updated_at: '2026-08-31T08:45:00Z',
  },
  {
    id: 'os-106',
    numero_os: 'OS #000155',
    titulo: 'Revisão das Escalas de Turno e Fechamento de Ponto',
    responsavel_id: 'user-lider-rj',
    responsavel_nome: 'Roberto Almeida',
    responsavel_cargo: 'Supervisor Operacional',
    unidade_id: 'unit-rj-01',
    unidade: 'Unidade Rio de Janeiro - Barra da Tijuca',
    data: '2026-09-02',
    horario: '10:00',
    prazo: '2026-09-02T16:00:00',
    descricao: 'Conferir atestados, lançar justificativas de ausência e validar escala do próximo fim de semana.',
    prioridade: 'MEDIA',
    categoria_id: 'cat-adm',
    categoria_nome: 'Administrativo & RH',
    categoria_cor: '#8B6B4A',
    status: 'PROGRAMADA',
    recorrencia: 'SEMANAL',
    requisitos_conclusao: [
      {
        id: 'req-106-1',
        tipo: 'SIMPLES',
        titulo: 'Confirmação de Validação no Sistema de RH',
        instrucoes: 'Marcar após salvar as escalas no portal do RH',
        obrigatorio: true
      },
      {
        id: 'req-106-2',
        tipo: 'TEXTO',
        titulo: 'Relatório de Afastamentos / Substituições',
        obrigatorio: false
      }
    ],
    created_at: '2026-09-01T07:00:00Z',
    updated_at: '2026-09-01T07:00:00Z',
  },
  {
    id: 'os-107',
    numero_os: 'OS #000156',
    titulo: 'Auditoria de Boas Práticas e Higiene no Manipulador',
    responsavel_id: 'user-lider-mg',
    responsavel_nome: 'Fernanda Lima',
    responsavel_cargo: 'Líder de Turno',
    unidade_id: 'unit-mg-01',
    unidade: 'Unidade Belo Horizonte - Savassi',
    data: '2026-09-01',
    horario: '13:30',
    prazo: '2026-09-01T15:30:00',
    descricao: 'Avaliar uso de toucas, luvas, unhas aparadas, assepsia das mãos e higienização das bancadas.',
    prioridade: 'ALTA',
    categoria_id: 'cat-qual',
    categoria_nome: 'Qualidade & Auditoria',
    categoria_cor: '#355C7D',
    status: 'PROGRAMADA',
    recorrencia: 'PERSONALIZADA',
    recorrencia_config: { dias_semana: [1, 3, 5], horario_custom: '13:30' },
    requisitos_conclusao: [
      {
        id: 'req-107-1',
        tipo: 'CHECKLIST',
        titulo: 'Checklist Rápido de Higiene',
        obrigatorio: true,
        checklist_itens: [
          { id: 'h1', texto: 'Uso integral de touca e calçado de segurança', concluido: false },
          { id: 'h2', texto: 'Sabonete bactericida e papel toalha abastecidos', concluido: false },
          { id: 'h3', texto: 'Álcool 70% disponível em todos os postos de manipulação', concluido: false }
        ]
      }
    ],
    created_at: '2026-09-01T07:00:00Z',
    updated_at: '2026-09-01T07:00:00Z',
  },
  {
    id: 'os-108',
    numero_os: 'OS #000157',
    titulo: 'Sanitização e Desinfecção Periódica do Depósito Central',
    responsavel_id: 'user-lider-sp',
    responsavel_nome: 'Mariana Costa',
    responsavel_cargo: 'Gerente de Unidade',
    unidade_id: 'unit-sp-01',
    unidade: 'Unidade São Paulo - Matriz Pinheiros',
    data: '2026-09-01',
    horario: '14:00',
    prazo: '2026-09-01T18:00:00',
    descricao: 'Sanitização geral das prateleiras, pallets e pisos do estoque seco com solução homologada.',
    prioridade: 'ALTA',
    categoria_id: 'cat-qual',
    categoria_nome: 'Qualidade & Auditoria',
    categoria_cor: '#355C7D',
    status: 'AGUARDANDO_VALIDACAO',
    recorrencia: 'MENSAL',
    data_inicio: '2026-09-01T14:10:00Z',
    data_conclusao: '2026-09-01T16:45:00Z',
    tempo_execucao_minutos: 155,
    observacoes_conclusao: 'Sanitização concluída em todos os corredores A, B e C. Fotos das áreas limpas registradas.',
    requisitos_conclusao: [
      {
        id: 'req-108-1',
        tipo: 'CHECKLIST',
        titulo: 'Checklist de Sanitização do Depósito',
        obrigatorio: true,
        checklist_itens: [
          { id: 's1', texto: 'Varrição e recolhimento de resíduos em todos os corredores', concluido: true },
          { id: 's2', texto: 'Aplicação de desinfetante hospitalar nas prateleiras inferiores', concluido: true },
          { id: 's3', texto: 'Verificação de ausência de poças e umidade excessiva', concluido: true }
        ]
      },
      {
        id: 'req-108-2',
        tipo: 'FOTO',
        titulo: 'Registro Fotográfico do Corredor Principal pós-limpeza',
        obrigatorio: true
      }
    ],
    evidencias: [
      {
        requisito_id: 'req-108-1',
        tipo: 'CHECKLIST',
        checklist_concluidos: ['s1', 's2', 's3'],
        data_registro: '2026-09-01T16:40:00Z'
      },
      {
        requisito_id: 'req-108-2',
        tipo: 'FOTO',
        foto_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        data_registro: '2026-09-01T16:44:00Z'
      }
    ],
    created_at: '2026-09-01T07:00:00Z',
    updated_at: '2026-09-01T16:45:00Z'
  }
];

const INITIAL_GOALS: Meta[] = [
  // --- METAS MENSAIS (Agosto / Setembro 2026) ---
  {
    id: 'meta-m-01',
    indicador: 'Produção',
    meta_valor: 15000,
    valor_atual: 13850,
    unidade_medida: 'unidades',
    tipo_periodo: 'MENSAL',
    periodo: 'Agosto / 2026',
    data_inicio: '2026-08-01',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Volume de produção líquida e expedição padrão da unidade de São Paulo.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'meta-m-02',
    indicador: 'Atendimento',
    meta_valor: 1200,
    valor_atual: 1248,
    unidade_medida: 'atendimentos',
    tipo_periodo: 'MENSAL',
    periodo: 'Agosto / 2026',
    data_inicio: '2026-08-01',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Volume total de atendimentos concluídos com avaliação positiva na unidade.',
    status: 'ATINGIDA',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'meta-m-03',
    indicador: 'Qualidade',
    meta_valor: 98.0,
    valor_atual: 95.0,
    unidade_medida: '%',
    tipo_periodo: 'MENSAL',
    periodo: 'Agosto / 2026',
    data_inicio: '2026-08-01',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Acuracidade técnica e conformidade nas auditorias de qualidade.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'meta-m-04',
    indicador: 'Absenteísmo',
    meta_valor: 1.5,
    valor_atual: 0.8,
    unidade_medida: '%',
    tipo_periodo: 'MENSAL',
    periodo: 'Agosto / 2026',
    data_inicio: '2026-08-01',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MENOR_MELHOR',
    descricao: 'Taxa máxima aceitável de faltas não programadas (menor é melhor).',
    status: 'ATINGIDA',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'meta-m-05',
    indicador: 'Faturamento Líquido',
    meta_valor: 350000,
    valor_atual: 322000,
    unidade_medida: 'R$',
    tipo_periodo: 'MENSAL',
    periodo: 'Agosto / 2026',
    data_inicio: '2026-08-01',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Meta financeira de faturamento bruto operacional da filial.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },

  // --- METAS SEMANAIS ---
  {
    id: 'meta-s-01',
    indicador: 'Execução de OS Preventivas',
    meta_valor: 30,
    valor_atual: 28,
    unidade_medida: 'OS',
    tipo_periodo: 'SEMANAL',
    periodo: 'Semana 35 (25/08 a 31/08)',
    data_inicio: '2026-08-25',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Cumprimento de 100% dos checklists e vistorias programadas na semana.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'meta-s-02',
    indicador: 'Volume de Produção Semanal',
    meta_valor: 3500,
    valor_atual: 3220,
    unidade_medida: 'unidades',
    tipo_periodo: 'SEMANAL',
    periodo: 'Semana 35 (25/08 a 31/08)',
    data_inicio: '2026-08-25',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Entrega semanal de kits montados e expedidos no prazo.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'meta-s-03',
    indicador: 'Conformidade de Higiene & Vistoria',
    meta_valor: 98.0,
    valor_atual: 94.0,
    unidade_medida: '%',
    tipo_periodo: 'SEMANAL',
    periodo: 'Semana 35 (25/08 a 31/08)',
    data_inicio: '2026-08-25',
    data_fim: '2026-08-31',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Conformidade dos 4 postos de manipulação e câmara fria.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'meta-s-04',
    indicador: 'Índice de Perda de Insumos / Quebra',
    meta_valor: 1.5,
    valor_atual: 1.2,
    unidade_medida: '%',
    tipo_periodo: 'SEMANAL',
    periodo: 'Semana 35 (25/08 a 31/08)',
    data_inicio: '2026-08-25',
    data_fim: '2026-08-31',
    unidade_id: 'unit-rj-01',
    unidade_nome: 'Unidade Rio de Janeiro - Barra da Tijuca',
    lider_id: 'user-lider-rj',
    lider_nome: 'Roberto Almeida',
    direcao_melhor: 'MENOR_MELHOR',
    descricao: 'Redução de sobras e desperdícios no manuseio diário.',
    status: 'ATINGIDA',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },

  // --- METAS DIÁRIAS ---
  {
    id: 'meta-d-01',
    indicador: 'Atendimentos no Dia',
    meta_valor: 450,
    valor_atual: 420,
    unidade_medida: 'atendimentos',
    tipo_periodo: 'DIARIA',
    periodo: '01/09/2026',
    data_inicio: '2026-09-01',
    data_fim: '2026-09-01',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Capacidade de atendimento no balcão e drive da loja principal.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-09-01T06:00:00Z',
    updated_at: '2026-09-01T15:00:00Z',
  },
  {
    id: 'meta-d-02',
    indicador: 'Auditoria de Abertura & Caixa',
    meta_valor: 100,
    valor_atual: 100,
    unidade_medida: '%',
    tipo_periodo: 'DIARIA',
    periodo: '01/09/2026',
    data_inicio: '2026-09-01',
    data_fim: '2026-09-01',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Conferência de fundo de troco e checklist de abertura antes das 08h.',
    status: 'ATINGIDA',
    created_at: '2026-09-01T06:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'meta-d-03',
    indicador: 'Vendas Diárias Balcão',
    meta_valor: 12000,
    valor_atual: 8500,
    unidade_medida: 'R$',
    tipo_periodo: 'DIARIA',
    periodo: '01/09/2026',
    data_inicio: '2026-09-01',
    data_fim: '2026-09-01',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    direcao_melhor: 'MAIOR_MELHOR',
    descricao: 'Meta diária de faturamento do turno matutino e vespertino.',
    status: 'EM_ANDAMENTO',
    created_at: '2026-09-01T06:00:00Z',
    updated_at: '2026-09-01T15:00:00Z',
  },
  {
    id: 'meta-d-04',
    indicador: 'Tempo Médio de Atendimento (TMA)',
    meta_valor: 15,
    valor_atual: 12,
    unidade_medida: 'minutos',
    tipo_periodo: 'DIARIA',
    periodo: '01/09/2026',
    data_inicio: '2026-09-01',
    data_fim: '2026-09-01',
    unidade_id: 'unit-rj-01',
    unidade_nome: 'Unidade Rio de Janeiro - Barra da Tijuca',
    lider_id: 'user-lider-rj',
    lider_nome: 'Roberto Almeida',
    direcao_melhor: 'MENOR_MELHOR',
    descricao: 'Tempo máximo por cliente atendido (menor é melhor).',
    status: 'ATINGIDA',
    created_at: '2026-09-01T06:00:00Z',
    updated_at: '2026-09-01T15:00:00Z',
  }
];

const INITIAL_REPORTS: Relatorio[] = [
  // 1. Relatório Mensal
  {
    id: 'rel-m-01',
    titulo: 'Relatório Executivo Consolidado de Resultados - Agosto/2026',
    tipo: 'MENSAL',
    periodo: 'Agosto / 2026',
    data_publicacao: '2026-08-31',
    publicado: true,
    publico_tipo: 'TODOS',
    descricao: 'Demonstrativo corporativo de desempenho por unidade: faturamento total, taxa de entrega de OS no prazo, ranking de NPS e absenteísmo por regional.',
    arquivo_pdf_nome: 'Relatorio_Executivo_Resultados_Agosto_2026.pdf',
    arquivo_pdf_url: 'https://example.com/relatorios/executivo-agosto-2026.pdf',
    arquivo_pdf_tamanho: '3.4 MB',
    arquivo_pdf_conteudo: `# CENTRAL DO LÍDER — RELATÓRIO EXECUTIVO MENSAL
## Período de Referência: Agosto / 2026 • Publicação: 31/08/2026

### 1. SUMÁRIO EXECUTIVO
No mês de Agosto de 2026, a rede atingiu **97.8% de conformidade operacional**, com 1.420 Ordens de Serviço (OS) concluídas no prazo pactuado. As metas de faturamento e índice de resolução rápida registraram expansão de 4.2% em relação a Julho.

### 2. PRINCIPAIS INDICADORES CONSOLIDADOS
- **Produção Global:** 54.200 unidades (98.5% da meta consolidada de 55.000)
- **SLA Médio de OS:** 96.4% de entregas no prazo estipulado
- **NPS Geral de Atendimento:** 89 pontos (Zona de Excelência)
- **Índice Médio de Absenteísmo:** 1.1% (Abaixo do teto crítico de 1.8%)
- **Faturamento Total Rede:** R$ 1.480.000,00

### 3. DESTAQUES POR UNIDADE OPERACIONAL
- **São Paulo (Pinheiros):** Líder em volume de produção (13.850 un) e eficiência de abertura.
- **Rio de Janeiro (Barra):** Menor tempo médio de atendimento (12 min) e zero acidentes de trabalho.
- **Belo Horizonte (Savassi):** 100% de acuracidade nas auditorias sanitárias de manipulação.
- **Curitiba (Batel):** Conclusão da fase de integração com novo gestor.

### 4. DIRETRIZES PARA O PRÓXIMO MÊS (SETEMBRO/2026)
1. Foco na redução de desperdício em câmaras frigoríficas.
2. Reforço no preenchimento de evidências fotográficas das OS críticas.
3. Participação obrigatória no alinhamento semanal com a Diretoria.`,
    total_leituras: 2,
    confirmacoes_leitura: [
      {
        usuario_id: 'user-lider-sp',
        usuario_nome: 'Mariana Costa',
        usuario_cargo: 'Gerente de Unidade',
        unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
        data_hora: '2026-08-31T19:30:00Z',
      }
    ],
    leitores_confirmados: ['user-lider-sp'],
    created_at: '2026-08-31T18:00:00Z',
    updated_at: '2026-08-31T19:30:00Z',
  },

  // 2. Manual Operacional Mensal
  {
    id: 'rel-m-02',
    titulo: 'Manual de Diretrizes Operacionais e Procedimentos Padrão Q3/2026',
    tipo: 'MENSAL',
    periodo: '3º Trimestre 2026 (Jul-Set)',
    data_publicacao: '2026-08-27',
    publicado: true,
    publico_tipo: 'TODOS',
    descricao: 'Atualização do Manual de Boas Práticas, regras de conservação de insumos, protocolo de segurança predial e rotinas de abertura/fechamento.',
    arquivo_pdf_nome: 'Manual_Diretrizes_Operacionais_Q3_2026.pdf',
    arquivo_pdf_url: 'https://example.com/relatorios/manual-operacional-q3-2026.pdf',
    arquivo_pdf_tamanho: '5.1 MB',
    arquivo_pdf_conteudo: `# MANUAL DE DIRETRIZES OPERACIONAIS — Q3/2026
## Procedimento Operacional Padrão (POP) • Central do Líder

### 1. PROTOCOLOS DE ABERTURA E FECHAMENTO
- Abertura de caixa deve ser executada pontualmente às 07h30 com contagem cega do fundo de troco.
- Teste de temperatura das câmaras deve ser registrado imediatamente na Ordem de Serviço com foto do termômetro.

### 2. GESTÃO DE IMPEDIMENTOS E BLOQUEIOS
- Qualquer parada operacional por falha técnica de terceiros ou falta de insumos deve ser sinalizada via botão "Reportar Bloqueio" em até 15 minutos do ocorrido.
- A administração receberá notificação em tempo real para acionamento de contingência.

### 3. AUDITORIAS DE QUALIDADE E CONFORMIDADE
- Todo checklist concluído exige evidência comprobatória conforme modalidade cadastrada.`,
    total_leituras: 3,
    confirmacoes_leitura: [
      {
        usuario_id: 'user-lider-sp',
        usuario_nome: 'Mariana Costa',
        usuario_cargo: 'Gerente de Unidade',
        unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
        data_hora: '2026-08-27T10:32:00Z',
      },
      {
        usuario_id: 'user-lider-rj',
        usuario_nome: 'Roberto Almeida',
        usuario_cargo: 'Supervisor Operacional',
        unidade_nome: 'Unidade Rio de Janeiro - Barra da Tijuca',
        data_hora: '2026-08-28T09:15:00Z',
      }
    ],
    leitores_confirmados: ['user-lider-sp', 'user-lider-rj'],
    created_at: '2026-08-27T08:00:00Z',
    updated_at: '2026-08-28T09:15:00Z',
  },

  // 3. Relatório Semanal
  {
    id: 'rel-s-01',
    titulo: 'Auditoria Semanal de Perecíveis e Gestão de Perdas (Semana 35)',
    tipo: 'SEMANAL',
    periodo: 'Semana 35 (25/08 a 31/08)',
    data_publicacao: '2026-08-31',
    publicado: true,
    publico_tipo: 'UNIDADES',
    unidades_alvo: ['unit-sp-01'],
    descricao: 'Balanço semanal de inventários rotativos, conferência de PVPS (Primeiro que Vence, Primeiro que Sai) e laudo de quebras por setor.',
    arquivo_pdf_nome: 'Auditoria_Pereciveis_Semana_35.pdf',
    arquivo_pdf_url: 'https://example.com/relatorios/auditoria-pereciveis-s35.pdf',
    arquivo_pdf_tamanho: '1.8 MB',
    arquivo_pdf_conteudo: `# AUDITORIA SEMANAL DE PERECÍVEIS — SEMANA 35
## Relatório de Perdas e Controle de Validades • 31/08/2026

### 1. BALANÇO DE INVENTÁRIO
- Acuracidade média de contagem física vs contábil: **99.1%**
- Lote de queijo muçarela e frios auditado sem inconformidades de temperatura.

### 2. AÇÕES CORRETIVAS
- Reforçar etiquetagem de data de abertura em todos os recipientes de fracionamento.`,
    total_leituras: 1,
    confirmacoes_leitura: [],
    leitores_confirmados: [],
    created_at: '2026-08-31T17:00:00Z',
    updated_at: '2026-08-31T17:00:00Z',
  },
  {
    id: 'rel-rj-01',
    titulo: 'Relatório Operacional Regional - Rio de Janeiro (Semana 35)',
    tipo: 'SEMANAL',
    periodo: 'Semana 35 (25/08 a 31/08)',
    data_publicacao: '2026-08-31',
    publicado: true,
    publico_tipo: 'UNIDADES',
    unidades_alvo: ['unit-rj-01'],
    descricao: 'Acompanhamento de custos e metas operacionais exclusivas da regional Barra da Tijuca.',
    arquivo_pdf_nome: 'Relatorio_Operacional_RJ_S35.pdf',
    arquivo_pdf_url: '#',
    arquivo_pdf_tamanho: '1.4 MB',
    arquivo_pdf_conteudo: `# RELATÓRIO OPERACIONAL - REGIONAL RIO DE JANEIRO
## Unidade Barra da Tijuca

- Cumprimento de metas de produção em 94%.
- Foco em redução do índice de quebra operacional.`,
    total_leituras: 0,
    confirmacoes_leitura: [],
    leitores_confirmados: [],
    created_at: '2026-08-31T17:30:00Z',
    updated_at: '2026-08-31T17:30:00Z',
  },

  // 4. Relatório Diário
  {
    id: 'rel-d-01',
    titulo: 'Fechamento Operacional Diário & Balanço de Caixa - 01/09/2026',
    tipo: 'DIARIO',
    periodo: '01/09/2026',
    data_publicacao: '2026-09-01',
    publicado: true,
    publico_tipo: 'TODOS',
    descricao: 'Resumo das operações matutinas, faturamento de balcão e status das ordens de serviço preventivas do dia.',
    arquivo_pdf_nome: 'Fechamento_Diario_01_09_2026.pdf',
    arquivo_pdf_url: 'https://example.com/relatorios/fechamento-diario-01-09.pdf',
    arquivo_pdf_tamanho: '1.2 MB',
    arquivo_pdf_conteudo: `# FECHAMENTO OPERACIONAL DIÁRIO — 01/09/2026
## Boletim Matutino de Operações

- Abertura de caixas concluída em 100% das filiais.
- 18 OS preventivas executadas dentro do horário estipulado.
- Nenhuma intercorrência grave reportada na rede.`,
    total_leituras: 0,
    confirmacoes_leitura: [],
    leitores_confirmados: [],
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z',
  },

  // 5. Relatório Rascunho / Despublicado para demonstração do Admin
  {
    id: 'rel-m-03',
    titulo: 'Demonstrativo Preliminar de Metas Orçamentárias Q4/2026 (Rascunho)',
    tipo: 'MENSAL',
    periodo: '4º Trimestre 2026',
    data_publicacao: '2026-09-01',
    publicado: false, // Despublicado / Rascunho
    publico_tipo: 'TODOS',
    descricao: 'Planejamento orçamentário e projeção de metas de expansão para o quarto trimestre.',
    arquivo_pdf_nome: 'Orcamento_Preliminar_Q4_2026.pdf',
    arquivo_pdf_url: 'https://example.com/relatorios/orcamento-q4.pdf',
    arquivo_pdf_tamanho: '2.9 MB',
    arquivo_pdf_conteudo: `# ORÇAMENTO E METAS PRELIMINARES Q4/2026
## Documento em Elaboração • Diretoria de Operações

Documento interno sob análise. Será publicado após aprovação final pelo Conselho.`,
    total_leituras: 0,
    confirmacoes_leitura: [],
    leitores_confirmados: [],
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  }
];

const INITIAL_EVENTS: CalendarioEvento[] = [
  {
    id: 'evt-01',
    titulo: 'Alinhamento Semanal de Líderes com Diretoria',
    tipo: 'REUNIAO',
    data: '2026-09-03',
    horario_inicio: '09:00',
    horario_fim: '10:30',
    publico_tipo: 'TODOS',
    descricao: 'Apresentação dos resultados consolidados de agosto, análise do SLA de Ordens de Serviço e alinhamento das prioridades estratégicas de setembro.',
    local: 'Google Meet (Sala Executiva)',
    link_reuniao: 'https://meet.google.com/cdl-exec-2026',
    criado_por_nome: 'Carlos Eduardo Ramos (Admin)',
    status: 'AGENDADO',
    created_at: '2026-09-01T07:00:00Z',
  },
  {
    id: 'evt-02',
    titulo: 'Treinamento: Boas Práticas e Controle de Câmaras Frias',
    tipo: 'TREINAMENTO',
    data: '2026-09-02',
    horario_inicio: '14:00',
    horario_fim: '16:00',
    publico_tipo: 'TODOS',
    descricao: 'Capacitação técnica para líderes de turno sobre aferição calibrada de temperatura, registro fotográfico em OS e prevenção de perdas.',
    local: 'Ambiente Virtual de Aprendizagem / Meet',
    link_reuniao: 'https://meet.google.com/cdl-treinamento-qualidade',
    criado_por_nome: 'Carlos Eduardo Ramos (Admin)',
    status: 'AGENDADO',
    created_at: '2026-09-01T07:00:00Z',
  },
  {
    id: 'evt-03',
    titulo: 'Comunicado Geral: Inventário Rotativo Quadrimestral Q3',
    tipo: 'COMUNICADO',
    data: '2026-09-01',
    horario_inicio: '08:00',
    horario_fim: '18:00',
    dia_inteiro: true,
    publico_tipo: 'TODOS',
    descricao: 'Atenção a todos os líderes: liberação das contagens físicas de estoque e sincronização cega via sistema até as 18h.',
    local: 'Todas as Filiais',
    criado_por_nome: 'Carlos Eduardo Ramos (Admin)',
    status: 'EM_ANDAMENTO',
    created_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'evt-04',
    titulo: 'Auditoria Externa de Vigilância Sanitária & Laudos',
    tipo: 'EVENTO',
    data: '2026-09-04',
    horario_inicio: '14:00',
    horario_fim: '17:00',
    publico_tipo: 'UNIDADES',
    unidade_id: 'unit-sp-01',
    unidade_nome: 'Unidade São Paulo - Matriz Pinheiros',
    lider_id: 'user-lider-sp',
    lider_nome: 'Mariana Costa',
    descricao: 'Acompanhar fiscalização sanitária municipal e apresentar pastas de laudos físicos e ordens de serviço preventivas.',
    local: 'Unidade SP Matriz - Pinheiros',
    criado_por_nome: 'Carlos Eduardo Ramos (Admin)',
    status: 'AGENDADO',
    created_at: '2026-09-01T07:00:00Z',
  },
  {
    id: 'evt-05',
    titulo: 'Reunião de Fechamento de Metas - Regional Sudeste',
    tipo: 'REUNIAO',
    data: '2026-09-05',
    horario_inicio: '10:00',
    horario_fim: '11:30',
    publico_tipo: 'UNIDADES',
    unidades_alvo: ['unit-sp-01', 'unit-rj-01', 'unit-mg-01'],
    descricao: 'Reunião regional para acompanhamento das metas de atendimento balcão e índice de absenteísmo.',
    local: 'Google Meet',
    link_reuniao: 'https://meet.google.com/cdl-sudeste-metas',
    criado_por_nome: 'Carlos Eduardo Ramos (Admin)',
    status: 'AGENDADO',
    created_at: '2026-09-01T07:00:00Z',
  },
  {
    id: 'evt-rj-01',
    titulo: 'Vistoria Predial & Alinhamento de Escala - Regional RJ',
    tipo: 'EVENTO',
    data: '2026-09-06',
    horario_inicio: '10:00',
    horario_fim: '12:00',
    publico_tipo: 'UNIDADES',
    unidades_alvo: ['unit-rj-01'],
    unidade_id: 'unit-rj-01',
    unidade_nome: 'Unidade Rio de Janeiro - Barra da Tijuca',
    lider_id: 'user-lider-rj',
    lider_nome: 'Roberto Almeida',
    descricao: 'Acompanhamento do cronograma de manutenções e calibração de balanças na Barra da Tijuca.',
    local: 'Unidade Barra da Tijuca - RJ',
    criado_por_nome: 'Carlos Eduardo Ramos (Admin)',
    status: 'AGENDADO',
    created_at: '2026-09-01T08:00:00Z',
  }
];

const INITIAL_COMMENTS: Comentario[] = [
  {
    id: 'com-01',
    autor_id: 'user-admin-01',
    autor_nome: 'Carlos Eduardo Ramos (Admin)',
    autor_role: 'ADMINISTRADOR',
    autor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    texto: 'Mariana, priorize a verificação do extintor da cozinha central antes da vistoria de sexta-feira.',
    item_tipo: 'TAREFA',
    item_id: 'os-102',
    created_at: '2026-09-01T07:30:00Z',
  },
  {
    id: 'com-02',
    autor_id: 'user-lider-sp',
    autor_nome: 'Mariana Costa',
    autor_role: 'LIDER',
    autor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    texto: 'Perfeito, Carlos! Já aloquei o técnico responsável para realizar a conferência dos lacres logo às 08h.',
    item_tipo: 'TAREFA',
    item_id: 'os-102',
    created_at: '2026-09-01T07:45:00Z',
  },
  {
    id: 'com-03',
    autor_id: 'user-lider-sp',
    autor_nome: 'Mariana Costa',
    autor_role: 'LIDER',
    autor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    texto: 'Todas as pastas físicas de laudos bacteriológicos já foram impressas e organizadas na recepção da gerência.',
    item_tipo: 'EVENTO',
    item_id: 'evt-04',
    created_at: '2026-09-01T08:15:00Z',
  },
  {
    id: 'com-04',
    autor_id: 'user-admin-01',
    autor_nome: 'Carlos Eduardo Ramos (Admin)',
    autor_role: 'ADMINISTRADOR',
    autor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    texto: 'Excelente preparo, Mariana. Qualquer solicitação adicional do fiscal durante a tarde, favor reportar de imediato.',
    item_tipo: 'EVENTO',
    item_id: 'evt-04',
    created_at: '2026-09-01T08:30:00Z',
  },
  {
    id: 'com-05',
    autor_id: 'user-lider-sp',
    autor_nome: 'Mariana Costa',
    autor_role: 'LIDER',
    autor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    texto: 'Estamos com 92% da meta atingida neste fechamento parcial. A equipe está focada na expedição da tarde.',
    item_tipo: 'META',
    item_id: 'meta-m-01',
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'com-06',
    autor_id: 'user-lider-sp',
    autor_nome: 'Mariana Costa',
    autor_role: 'LIDER',
    autor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    texto: 'Relatório lido e revisado com os supervisores de turno. As novas diretrizes de abertura já entraram em vigor.',
    item_tipo: 'RELATORIO',
    item_id: 'rel-m-01',
    created_at: '2026-09-01T08:20:00Z',
  }
];

const INITIAL_NOTIFICATIONS: Notificacao[] = [
  {
    id: 'notif-01',
    usuario_id: 'user-lider-sp',
    tipo: 'OS_ATRIBUIDA',
    titulo: 'Nova Ordem de Serviço Atribuída',
    texto: 'A OS-2026-0892 (Vistoria Mensal de Extintores) foi vinculada à sua unidade.',
    lida: false,
    link_acao: '/tarefas',
    created_at: '2026-09-01T07:00:00Z',
  },
  {
    id: 'notif-02',
    usuario_id: 'user-lider-sp',
    tipo: 'RELATORIO_PUBLICADO',
    titulo: 'Novo Relatório Disponível',
    texto: 'Diretrizes Operacionais Q3/2026 foi publicado para leitura obrigatória.',
    lida: false,
    link_acao: '/relatorios',
    created_at: '2026-09-01T06:00:00Z',
  }
];

const INITIAL_SIMULATED_EMAILS: SimulatedEmail[] = [
  {
    id: 'email-sim-01',
    to: 'juliana.oliveira@centraldolider.com.br',
    userName: 'Juliana Oliveira',
    subject: 'Confirmação de Cadastro - Central do Líder',
    token: 'token_cdl_juliana_preview_123',
    activationUrl: '#/confirmar-email?token=token_cdl_juliana_preview_123',
    timestamp: '2026-08-28T14:30:00Z',
    type: 'CONFIRMACAO_CADASTRO',
  }
];

type Listener = () => void;

class DatabaseStore {
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.resetToDefaults();
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.GOALS)) {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(INITIAL_GOALS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
        localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CALENDAR_TYPES)) {
        localStorage.setItem(STORAGE_KEYS.CALENDAR_TYPES, JSON.stringify(INITIAL_CALENDAR_TYPES));
      }

      // Sync test users & passwords if missing
      const currentUsers = this.getUsers();
      let usersChanged = false;
      INITIAL_USERS.forEach((u) => {
        if (!currentUsers.some((eu) => eu.id === u.id || eu.email.toLowerCase() === u.email.toLowerCase())) {
          currentUsers.push(u);
          usersChanged = true;
        }
      });
      if (usersChanged) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentUsers));
      }

      const passwords = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
      let passChanged = false;
      Object.entries(INITIAL_PASSWORDS).forEach(([email, pwd]) => {
        if (!passwords[email]) {
          passwords[email] = pwd;
          passChanged = true;
        }
      });
      if (passChanged) {
        localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
      }

      // Sync os-108 if missing
      const currentTasks = this.getTasks();
      if (!currentTasks.some((t) => t.id === 'os-108')) {
        const init108 = INITIAL_TASKS.find((t) => t.id === 'os-108');
        if (init108) {
          currentTasks.push(init108);
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(currentTasks));
        }
      }
    }
  }

  private emitChange() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(INITIAL_PASSWORDS));
    localStorage.setItem(STORAGE_KEYS.LEADERS, JSON.stringify(INITIAL_LEADERS));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(INITIAL_UNITS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(INITIAL_GOALS));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem(STORAGE_KEYS.CALENDAR_TYPES, JSON.stringify(INITIAL_CALENDAR_TYPES));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify(INITIAL_SIMULATED_EMAILS));
    this.emitChange();
  }

  // --- USERS & AUTH ---
  public getUsers(): UsuarioPerfil[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  public getUserById(id: string): UsuarioPerfil | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UsuarioPerfil | undefined {
    const cleanEmail = email.trim().toLowerCase();
    return this.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  }

  public checkEmailExists(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    return this.getUsers().some((u) => u.email.toLowerCase() === cleanEmail);
  }

  public getStoredPassword(email: string): string | undefined {
    const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
    const passwords = data ? JSON.parse(data) : {};
    return passwords[email.trim().toLowerCase()];
  }

  public registerUser(params: {
    email: string;
    nome: string;
    senha: string;
    role?: UserRole;
    unidade_id?: string;
    cargo?: string;
    telefone?: string;
    matricula?: string;
  }): { user: UsuarioPerfil; simulatedEmail: SimulatedEmail } {
    const cleanEmail = params.email.trim().toLowerCase();
    
    if (this.checkEmailExists(cleanEmail)) {
      throw new Error('Este e-mail já está cadastrado. Tente recuperar sua senha ou entre em contato com o administrador.');
    }

    const userId = 'user-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const token = 'token_act_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = new Date().toISOString();

    const selectedUnit = params.unidade_id 
      ? this.getUnits().find(u => u.id === params.unidade_id)
      : undefined;

    const newUser: UsuarioPerfil = {
      id: userId,
      email: cleanEmail,
      nome: params.nome.trim(),
      role: params.role || 'LIDER',
      status_confirmacao: 'PENDENTE',
      unidade_id: selectedUnit?.id,
      unidade_nome: selectedUnit?.nome,
      cargo: params.cargo?.trim() || (params.role === 'ADMINISTRADOR' ? 'Administrador do Sistema' : 'Líder de Unidade'),
      telefone: params.telefone?.trim(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.nome.trim())}&backgroundColor=c76b4a,355c7d,5b7dbe`,
      token_confirmacao: token,
      created_at: now,
      updated_at: now,
    };

    // Save User
    const users = this.getUsers();
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Save Password
    const passwords = localStorage.getItem(STORAGE_KEYS.PASSWORDS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS)!) : {};
    passwords[cleanEmail] = params.senha;
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));

    // If registered as Leader, also insert into Lideres table
    if (newUser.role === 'LIDER') {
      const leaders = this.getLeaders();
      const newLeader: Lider = {
        id: 'lider-' + Date.now().toString(36),
        usuario_id: userId,
        nome: newUser.nome,
        email: newUser.email,
        matricula: params.matricula?.trim() || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
        cargo: newUser.cargo || 'Líder de Operações',
        unidade: newUser.unidade_nome || 'A definir',
        regional: selectedUnit?.regional || 'Geral',
        gestor: 'Carlos Eduardo Ramos (Admin)',
        status: 'ATIVO',
        telefone: newUser.telefone,
        created_at: now,
        updated_at: now,
      };
      leaders.push(newLeader);
      localStorage.setItem(STORAGE_KEYS.LEADERS, JSON.stringify(leaders));
    }

    // Generate Simulated Activation Email
    const simulatedEmail: SimulatedEmail = {
      id: 'email-' + Date.now().toString(36),
      to: cleanEmail,
      userName: newUser.nome,
      subject: 'Confirmação de Cadastro - Central do Líder',
      token: token,
      activationUrl: `#/confirmar-email?token=${token}`,
      timestamp: now,
      type: 'CONFIRMACAO_CADASTRO',
    };

    const simulatedEmails = this.getSimulatedEmails();
    simulatedEmails.unshift(simulatedEmail);
    localStorage.setItem(STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify(simulatedEmails));

    // Create system notification
    this.addNotification({
      usuario_id: userId,
      tipo: 'SISTEMA',
      titulo: 'Bem-vindo à Central do Líder',
      texto: 'Confirme seu endereço de e-mail através da mensagem enviada para liberar seu acesso completo.',
      lida: false,
    });

    this.emitChange();
    return { user: newUser, simulatedEmail };
  }

  public confirmUserEmail(tokenOrEmail: string): UsuarioPerfil {
    const users = this.getUsers();
    let foundIndex = users.findIndex(
      (u) => u.token_confirmacao === tokenOrEmail || u.email.toLowerCase() === tokenOrEmail.toLowerCase()
    );

    if (foundIndex === -1) {
      throw new Error('Código ou link de confirmação inválido ou expirado.');
    }

    const updatedUser = {
      ...users[foundIndex],
      status_confirmacao: 'CONFIRMADO' as ConfirmationStatus,
      token_confirmacao: undefined,
      updated_at: new Date().toISOString(),
    };

    users[foundIndex] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addNotification({
      usuario_id: updatedUser.id,
      tipo: 'CADASTRO_CONFIRMADO',
      titulo: 'Conta Confirmada com Sucesso!',
      texto: 'Seu cadastro na Central do Líder foi ativado. Agora você tem acesso completo ao sistema.',
      lida: false,
    });

    this.emitChange();
    return updatedUser;
  }

  public resendConfirmationEmail(email: string): SimulatedEmail {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error('E-mail não encontrado no sistema.');
    }

    if (user.status_confirmacao === 'CONFIRMADO') {
      throw new Error('Este cadastro já foi confirmado. Você pode fazer login diretamente.');
    }

    const newToken = 'token_act_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = new Date().toISOString();

    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx].token_confirmacao = newToken;
      users[idx].updated_at = now;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    const simulatedEmail: SimulatedEmail = {
      id: 'email-' + Date.now().toString(36),
      to: user.email,
      userName: user.nome,
      subject: 'Reenvio: Confirmação de Cadastro - Central do Líder',
      token: newToken,
      activationUrl: `#/confirmar-email?token=${newToken}`,
      timestamp: now,
      type: 'CONFIRMACAO_CADASTRO',
    };

    const simulatedEmails = this.getSimulatedEmails();
    simulatedEmails.unshift(simulatedEmail);
    localStorage.setItem(STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify(simulatedEmails));

    this.emitChange();
    return simulatedEmail;
  }

  public requestPasswordReset(email: string): SimulatedEmail {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error('Nenhuma conta encontrada com este e-mail.');
    }

    const resetToken = 'reset_' + Math.random().toString(36).substring(2);
    const now = new Date().toISOString();

    const simulatedEmail: SimulatedEmail = {
      id: 'email-reset-' + Date.now().toString(36),
      to: user.email,
      userName: user.nome,
      subject: 'Recuperação de Senha - Central do Líder',
      token: resetToken,
      activationUrl: `#/recuperar-senha?token=${resetToken}`,
      timestamp: now,
      type: 'RECUPERACAO_SENHA',
    };

    const simulatedEmails = this.getSimulatedEmails();
    simulatedEmails.unshift(simulatedEmail);
    localStorage.setItem(STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify(simulatedEmails));

    this.emitChange();
    return simulatedEmail;
  }

  public updateUserRole(userId: string, newRole: UserRole): UsuarioPerfil {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error('Usuário não encontrado.');
    }

    users[idx].role = newRole;
    users[idx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addNotification({
      usuario_id: userId,
      tipo: 'SISTEMA',
      titulo: 'Função de Acesso Atualizada',
      texto: `Sua função no sistema foi alterada para ${newRole === 'ADMINISTRADOR' ? 'Administrador' : 'Líder'}.`,
      lida: false,
    });

    this.emitChange();
    return users[idx];
  }

  public updateUserProfile(userId: string, data: Partial<UsuarioPerfil>): UsuarioPerfil {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error('Usuário não encontrado.');
    }

    users[idx] = {
      ...users[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.emitChange();
    return users[idx];
  }

  public updateUserPassword(email: string, currentPass: string, newPass: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const passwords = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
    const existing = passwords[cleanEmail] || 'Lider@123';
    
    if (currentPass && existing !== currentPass) {
      throw new Error('A senha atual informada está incorreta.');
    }
    
    if (!newPass || newPass.length < 6) {
      throw new Error('A nova senha deve possuir no mínimo 6 caracteres.');
    }

    passwords[cleanEmail] = newPass;
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
    this.emitChange();
    return true;
  }

  public deleteUser(userId: string): void {
    const users = this.getUsers();
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    // 1. Remove from users
    const remainingUsers = users.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remainingUsers));
    
    // 2. Remove associated leader record without leaving orphans
    const leaders = this.getLeaders().filter(
      (l) => l.usuario_id !== userId && l.email.toLowerCase() !== userToDelete.email.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEYS.LEADERS, JSON.stringify(leaders));

    // 3. Remove password record
    const passwords = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
    delete passwords[userToDelete.email.toLowerCase()];
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));

    // 4. Invalidate session if deleted user was active
    const currentSessionUserId = localStorage.getItem('cdl_auth_session_user_id');
    if (currentSessionUserId === userId) {
      localStorage.removeItem('cdl_auth_session_user_id');
    }

    this.emitChange();
  }

  // --- LEADERS ---
  public getLeaders(): Lider[] {
    const data = localStorage.getItem(STORAGE_KEYS.LEADERS);
    return data ? JSON.parse(data) : [];
  }

  public getLeaderById(id: string): Lider | undefined {
    return this.getLeaders().find((l) => l.id === id || l.usuario_id === id);
  }

  public createLeader(data: Omit<Lider, 'id' | 'created_at' | 'updated_at'>): Lider {
    const leaders = this.getLeaders();
    const now = new Date().toISOString();
    const newLeader: Lider = {
      ...data,
      id: 'lider-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      created_at: now,
      updated_at: now,
    };
    leaders.unshift(newLeader);
    localStorage.setItem(STORAGE_KEYS.LEADERS, JSON.stringify(leaders));

    // Sync with User profile if linked
    if (data.usuario_id) {
      const user = this.getUserById(data.usuario_id);
      if (user) {
        this.updateUserProfile(user.id, {
          nome: data.nome,
          unidade_nome: data.unidade,
          unidade_id: data.unidade_id,
          cargo: data.cargo,
          telefone: data.telefone,
        });
      }
    }

    this.emitChange();
    return newLeader;
  }

  public updateLeader(id: string, data: Partial<Lider>): Lider {
    const leaders = this.getLeaders();
    const idx = leaders.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Líder não encontrado.');

    const updated: Lider = {
      ...leaders[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };

    leaders[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.LEADERS, JSON.stringify(leaders));

    // Sync user profile if linked
    if (updated.usuario_id) {
      this.updateUserProfile(updated.usuario_id, {
        nome: updated.nome,
        unidade_nome: updated.unidade,
        unidade_id: updated.unidade_id,
        cargo: updated.cargo,
        telefone: updated.telefone,
      });
    }

    this.emitChange();
    return updated;
  }

  public deleteLeader(id: string): void {
    const leaders = this.getLeaders().filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEADERS, JSON.stringify(leaders));
    this.emitChange();
  }

  // --- UNITS / PROJECTS ---
  public getUnits(): Unidade[] {
    const data = localStorage.getItem(STORAGE_KEYS.UNITS);
    return data ? JSON.parse(data) : [];
  }

  public getProjects(): Projeto[] {
    return this.getUnits();
  }

  public createUnit(unit: Omit<Unidade, 'id' | 'created_at'>): Unidade {
    const units = this.getUnits();
    const newUnit: Unidade = {
      ...unit,
      id: 'unit-' + Date.now().toString(36),
      created_at: new Date().toISOString(),
    };
    units.push(newUnit);
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    this.emitChange();
    return newUnit;
  }

  public createProject(project: Omit<Projeto, 'id' | 'created_at'>): Projeto {
    return this.createUnit(project as any) as Projeto;
  }

  public updateUnit(id: string, data: Partial<Unidade>): Unidade {
    const units = this.getUnits();
    const idx = units.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Unidade não encontrada.');
    units[idx] = { ...units[idx], ...data };
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    this.emitChange();
    return units[idx];
  }

  public updateProject(id: string, data: Partial<Projeto>): Projeto {
    return this.updateUnit(id, data as any) as Projeto;
  }

  public deleteUnit(id: string): void {
    const units = this.getUnits().filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    this.emitChange();
  }

  public deleteProject(id: string): void {
    this.deleteUnit(id);
  }

  // --- CATEGORIES ---
  public getCategories(): Categoria[] {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  }

  public createCategory(cat: Omit<Categoria, 'id' | 'created_at'>): Categoria {
    const categories = this.getCategories();
    const newCat: Categoria = {
      ...cat,
      id: 'cat-' + Date.now().toString(36),
      created_at: new Date().toISOString(),
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.emitChange();
    return newCat;
  }

  public updateCategory(id: string, data: Partial<Categoria>): Categoria {
    const categories = this.getCategories();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada.');
    categories[idx] = { ...categories[idx], ...data };
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.emitChange();
    return categories[idx];
  }

  public deleteCategory(id: string): void {
    const categories = this.getCategories().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.emitChange();
  }

  // --- TASKS / OS ---
  public getTasks(): TarefaOS[] {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks: TarefaOS[] = data ? JSON.parse(data) : [];
    
    // Auto-evaluate overdue status on query
    const now = new Date();
    let hasChanges = false;
    
    const updatedTasks = tasks.map((t) => {
      if ((t.status === 'PROGRAMADA' || t.status === 'EM_ANDAMENTO') && t.prazo) {
        const deadline = new Date(t.prazo);
        if (now > deadline) {
          hasChanges = true;
          return { ...t, status: 'ATRASADA' as const, updated_at: now.toISOString() };
        }
      }
      return t;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    }

    return updatedTasks;
  }

  // Helper: Get project IDs assigned to a leader user
  public getLeaderProjectIds(userId: string): Set<string> {
    const projectIds = new Set<string>();
    const user = this.getUserById(userId);
    if (user?.unidade_id) projectIds.add(user.unidade_id);
    if (user?.projeto_id) projectIds.add(user.projeto_id);

    const leaders = this.getLeaders();
    const leaderRecord = leaders.find(
      (l) => l.usuario_id === userId || l.id === userId || (user?.email && l.email?.toLowerCase() === user?.email?.toLowerCase())
    );

    if (leaderRecord) {
      if (leaderRecord.unidade_id) projectIds.add(leaderRecord.unidade_id);
      if (leaderRecord.projeto_id) projectIds.add(leaderRecord.projeto_id);
      if (leaderRecord.projetos_ids) {
        leaderRecord.projetos_ids.forEach((p) => {
          if (p) projectIds.add(p);
        });
      }
    }

    const units = this.getUnits();
    units.forEach((u: any) => {
      if (user?.email && u.responsavel_email?.toLowerCase() === user.email.toLowerCase()) {
        projectIds.add(u.id);
      }
      if (leaderRecord?.email && u.responsavel_email?.toLowerCase() === leaderRecord.email.toLowerCase()) {
        projectIds.add(u.id);
      }
    });

    return projectIds;
  }

  // Helper: Get leader IDs managed by a GERÊNCIA user
  public getManagedLeaderIds(gerenciaUserId: string): Set<string> {
    const leaderIds = new Set<string>();
    const leaders = this.getLeaders();
    const managedLeaders = leaders.filter((l) => {
      if (l.gestores_imediatos_ids && l.gestores_imediatos_ids.includes(gerenciaUserId)) {
        return true;
      }
      if ((l as any).gestor_imediato_id && (l as any).gestor_imediato_id === gerenciaUserId) {
        return true;
      }
      return false;
    });

    managedLeaders.forEach((l) => {
      if (l.id) leaderIds.add(l.id);
      if (l.usuario_id) leaderIds.add(l.usuario_id);
    });

    return leaderIds;
  }

  // Helper: Get project IDs of leaders managed by a GERÊNCIA user
  public getManagedProjectIds(gerenciaUserId: string): Set<string> {
    const projectIds = new Set<string>();
    const leaders = this.getLeaders();
    const managedLeaders = leaders.filter((l) => {
      if (l.gestores_imediatos_ids && l.gestores_imediatos_ids.includes(gerenciaUserId)) {
        return true;
      }
      if ((l as any).gestor_imediato_id && (l as any).gestor_imediato_id === gerenciaUserId) {
        return true;
      }
      return false;
    });

    managedLeaders.forEach((l) => {
      if (l.unidade_id) projectIds.add(l.unidade_id);
      if (l.projeto_id) projectIds.add(l.projeto_id);
      if (l.projetos_ids) {
        l.projetos_ids.forEach((p) => {
          if (p) projectIds.add(p);
        });
      }
    });

    return projectIds;
  }

  public getTasksForUser(userId: string, userRole: UserRole, userUnidadeId?: string): TarefaOS[] {
    const all = this.getTasks();
    if (userRole === 'ADMINISTRADOR') return all;

    if (userRole === 'GERENCIA') {
      const managedLeaderIds = this.getManagedLeaderIds(userId);
      if (managedLeaderIds.size === 0) return [];

      return all.filter((t) => {
        // Direct assignee is a managed leader
        if (t.responsavel_id && managedLeaderIds.has(t.responsavel_id)) return true;
        // List of leaders includes a managed leader
        if (t.lideres_ids && t.lideres_ids.some((id) => managedLeaderIds.has(id))) return true;
        return false;
      });
    }

    // LÍDER: only tasks for their assigned projects / themselves
    const leaderProjectIds = this.getLeaderProjectIds(userId);
    if (userUnidadeId) leaderProjectIds.add(userUnidadeId);

    const leaderRecord = this.getLeaders().find(
      (l) => l.usuario_id === userId || l.id === userId
    );
    const leaderIds = new Set([userId, leaderRecord?.id, leaderRecord?.usuario_id].filter(Boolean) as string[]);

    return all.filter((t) => {
      // 1. Direct assignee match
      const hasSpecificLeader = Boolean(t.responsavel_id || (t.lideres_ids && t.lideres_ids.length > 0));
      if (hasSpecificLeader) {
        if (t.responsavel_id && leaderIds.has(t.responsavel_id)) return true;
        if (t.lideres_ids && t.lideres_ids.some((id) => leaderIds.has(id))) return true;
        return false;
      }
      // 2. Project match (only when no specific leader is assigned)
      if (t.unidade_id && leaderProjectIds.has(t.unidade_id)) return true;
      if (t.projeto_id && leaderProjectIds.has(t.projeto_id)) return true;
      if (t.projetos_ids && t.projetos_ids.some((p) => leaderProjectIds.has(p))) return true;
      return false;
    });
  }

  public generateNextOsNumber(): string {
    const tasks = this.getTasks();
    let maxNum = 150;
    tasks.forEach((t) => {
      const match = t.numero_os.match(/OS\s*#?(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const next = maxNum + 1;
    return `OS #${String(next).padStart(6, '0')}`;
  }

  public createTask(data: Omit<TarefaOS, 'id' | 'numero_os' | 'created_at' | 'updated_at'>): TarefaOS {
    const tasks = this.getTasks();
    const now = new Date().toISOString();
    const numero_os = this.generateNextOsNumber();

    const newTask: TarefaOS = {
      ...data,
      id: 'os-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      numero_os,
      created_at: now,
      updated_at: now,
    };

    tasks.unshift(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // Send notification to the responsible leader
    if (newTask.responsavel_id) {
      this.addNotification({
        usuario_id: newTask.responsavel_id,
        tipo: 'OS_ATRIBUIDA',
        titulo: `Nova OS Atribuída: ${newTask.numero_os}`,
        texto: `${newTask.titulo} - Prazo: ${newTask.prazo?.replace('T', ' ')}`,
        lida: false,
        link_acao: '/tarefas',
      });
    }

    this.emitChange();
    return newTask;
  }

  public updateTask(id: string, data: Partial<TarefaOS>): TarefaOS {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Ordem de Serviço não encontrada.');

    const current = tasks[idx];
    const previousAssignee = current.responsavel_id;

    tasks[idx] = {
      ...current,
      ...data,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // If assigned to a new leader, notify
    if (data.responsavel_id && data.responsavel_id !== previousAssignee) {
      this.addNotification({
        usuario_id: data.responsavel_id,
        tipo: 'OS_ATRIBUIDA',
        titulo: `OS Reatribuída: ${tasks[idx].numero_os}`,
        texto: `Você foi designado como responsável por: ${tasks[idx].titulo}`,
        lida: false,
        link_acao: '/tarefas',
      });
    }

    this.emitChange();
    return tasks[idx];
  }

  public duplicateTask(id: string): TarefaOS {
    const tasks = this.getTasks();
    const source = tasks.find((t) => t.id === id);
    if (!source) throw new Error('OS original não encontrada.');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Set deadline for today or +1 day
    const deadline = new Date(now);
    deadline.setHours(deadline.getHours() + 4);

    return this.createTask({
      titulo: `${source.titulo} (Cópia)`,
      responsavel_id: source.responsavel_id,
      responsavel_nome: source.responsavel_nome,
      responsavel_cargo: source.responsavel_cargo,
      unidade_id: source.unidade_id,
      unidade: source.unidade,
      data: todayStr,
      horario: source.horario || '08:00',
      prazo: deadline.toISOString().slice(0, 16),
      descricao: source.descricao,
      prioridade: source.prioridade,
      categoria_id: source.categoria_id,
      categoria_nome: source.categoria_nome,
      categoria_cor: source.categoria_cor,
      status: 'PROGRAMADA',
      recorrencia: 'UMA_VEZ',
      requisitos_conclusao: source.requisitos_conclusao.map((r) => ({
        ...r,
        id: 'req-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        checklist_itens: r.checklist_itens?.map((c) => ({ ...c, concluido: false })),
      })),
    });
  }

  public deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.emitChange();
  }

  public assignTask(id: string, leaderId: string, leaderName: string, leaderCargo?: string): TarefaOS {
    return this.updateTask(id, {
      responsavel_id: leaderId,
      responsavel_nome: leaderName,
      responsavel_cargo: leaderCargo,
    });
  }

  public cancelTask(id: string, motivo?: string): TarefaOS {
    return this.updateTask(id, {
      status: 'CANCELADA',
      observacoes_conclusao: motivo ? `Cancelada pelo Administrador: ${motivo}` : 'Cancelada pelo Administrador',
    });
  }

  public startTask(id: string): TarefaOS {
    return this.updateTask(id, {
      status: 'EM_ANDAMENTO',
      data_inicio: new Date().toISOString(),
    });
  }

  public blockTask(id: string, motivo: string): TarefaOS {
    const task = this.updateTask(id, {
      status: 'BLOQUEADA',
      motivo_bloqueio: motivo,
      data_bloqueio: new Date().toISOString(),
    });

    // Notify administrators about the blocker
    const admins = this.getUsers().filter((u) => u.role === 'ADMINISTRADOR');
    admins.forEach((admin) => {
      this.addNotification({
        usuario_id: admin.id,
        tipo: 'OS_BLOQUEADA',
        titulo: `⚠️ OS Bloqueada: ${task.numero_os}`,
        texto: `${task.responsavel_nome} reportou bloqueio em "${task.titulo}": ${motivo}`,
        lida: false,
        link_acao: '/tarefas',
      });
    });

    return task;
  }

  public unblockTask(id: string): TarefaOS {
    return this.updateTask(id, {
      status: 'EM_ANDAMENTO',
      motivo_bloqueio: undefined,
      data_bloqueio: undefined,
    });
  }

  public completeTask(
    id: string,
    params: {
      evidencias: EvidenciaSubmetida[];
      observacoes_conclusao?: string;
      tempo_execucao_minutos?: number;
    },
    executorRole?: UserRole,
    executorInfo?: { id: string; nome: string }
  ): TarefaOS {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('OS não encontrada.');

    const task = tasks[idx];
    const now = new Date().toISOString();

    const isManagerOrAdmin = executorRole === 'ADMINISTRADOR' || executorRole === 'GERENCIA';
    const newStatus: TaskStatus = isManagerOrAdmin ? 'CONCLUIDA' : 'AGUARDANDO_VALIDACAO';

    const updatedTask: TarefaOS = {
      ...task,
      status: newStatus,
      evidencias: params.evidencias,
      observacoes_conclusao: params.observacoes_conclusao,
      tempo_execucao_minutos: params.tempo_execucao_minutos || 30,
      data_conclusao: now,
      motivo_recusa: undefined,
      recusado_por_id: undefined,
      recusado_por_nome: undefined,
      data_recusa: undefined,
      updated_at: now,
    };

    if (isManagerOrAdmin && executorInfo) {
      updatedTask.validado_por_id = executorInfo.id;
      updatedTask.validado_por_nome = executorInfo.nome;
      updatedTask.validado_por_role = executorRole;
      updatedTask.data_validacao = now;
    }

    tasks[idx] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    if (newStatus === 'AGUARDANDO_VALIDACAO') {
      // Notify GERENCIA and ADMINISTRADOR
      const validators = this.getUsers().filter(
        (u) => u.role === 'ADMINISTRADOR' || u.role === 'GERENCIA'
      );
      validators.forEach((val) => {
        this.addNotification({
          usuario_id: val.id,
          tipo: 'OS_AGUARDANDO_VALIDACAO',
          titulo: `⏳ OS Aguardando Validação: ${updatedTask.numero_os}`,
          texto: `${updatedTask.responsavel_nome} concluiu "${updatedTask.titulo}" (${updatedTask.unidade}) e aguarda sua validação.`,
          lida: false,
          item_tipo: 'TAREFA',
          item_id: updatedTask.id,
          link_acao: 'admin-tarefas',
        });
      });
    } else {
      // Notify admins
      const admins = this.getUsers().filter((u) => u.role === 'ADMINISTRADOR');
      admins.forEach((admin) => {
        this.addNotification({
          usuario_id: admin.id,
          tipo: 'OS_CONCLUIDA',
          titulo: `✅ OS Concluída: ${updatedTask.numero_os}`,
          texto: `${updatedTask.responsavel_nome} concluiu "${updatedTask.titulo}" na ${updatedTask.unidade}.`,
          lida: false,
        });
      });

      // Check if task has recurrence and generate the next occurrence if needed
      if (updatedTask.recorrencia && updatedTask.recorrencia !== 'UMA_VEZ') {
        this.generateNextRecurrentTask(updatedTask);
      }
    }

    this.emitChange();
    return updatedTask;
  }

  public approveTaskValidation(
    taskId: string,
    validator: { id: string; nome: string; role: UserRole }
  ): TarefaOS {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('OS não encontrada.');

    const task = tasks[idx];

    // Check validator selection rule: must be one of the designated validators if specified
    if (task.validadores_ids && task.validadores_ids.length > 0) {
      if (!task.validadores_ids.includes(validator.id)) {
        throw new Error('Apenas os usuários designados como Validadores da OS durante a criação podem realizar esta validação.');
      }
    }

    // Check GERÊNCIA Gestor Imediato rule: GERÊNCIA can only validate OS for leaders they manage
    if (validator.role === 'GERENCIA') {
      const leaders = this.getLeaders();
      const leader = leaders.find((l) => l.usuario_id === task.responsavel_id || l.id === task.responsavel_id);
      if (leader) {
        if (!leader.gestores_imediatos_ids || !leader.gestores_imediatos_ids.includes(validator.id)) {
          throw new Error('Usuários com perfil GERÊNCIA só podem validar OS dos Líderes sob sua gestão direta (Gestor Imediato).');
        }
      }
    }

    const now = new Date().toISOString();
    const currentApprovals: AprovacaoValidador[] = task.validacoes_aprovadas ? [...task.validacoes_aprovadas] : [];

    // Check if this validator has already approved
    if (currentApprovals.some((a) => a.validador_id === validator.id)) {
      throw new Error('Você já registrou a sua aprovação para esta Ordem de Serviço.');
    }

    // Record this validator's approval
    currentApprovals.push({
      validador_id: validator.id,
      validador_nome: validator.nome,
      validador_role: validator.role,
      data_validacao: now,
    });

    // Determine required validators
    const requiredValidatorIds = (task.validadores_ids && task.validadores_ids.length > 0)
      ? task.validadores_ids
      : [validator.id];

    // All designated validators must approve before the OS is fully validated/concluded
    const allApproved = requiredValidatorIds.every((vId) =>
      currentApprovals.some((a) => a.validador_id === vId)
    );

    let updatedTask: TarefaOS;

    if (allApproved) {
      // 100% of validators approved: Mark as CONCLUIDA
      updatedTask = {
        ...task,
        status: 'CONCLUIDA',
        validacoes_aprovadas: currentApprovals,
        validado_por_id: validator.id,
        validado_por_nome: currentApprovals.map((a) => a.validador_nome).join(', '),
        validado_por_role: validator.role,
        data_validacao: now,
        motivo_recusa: undefined,
        recusado_por_id: undefined,
        recusado_por_nome: undefined,
        data_recusa: undefined,
        updated_at: now,
      };

      // Notify the Leader that OS is fully approved and completed
      if (task.responsavel_id) {
        this.addNotification({
          usuario_id: task.responsavel_id,
          tipo: 'OS_APROVADA',
          titulo: `✅ OS Totalmente Concluída e Validada: ${task.numero_os}`,
          texto: `A OS "${task.titulo}" foi aprovada por todos os validadores (${updatedTask.validado_por_nome}).`,
          lida: false,
          item_tipo: 'TAREFA',
          item_id: task.id,
          link_acao: 'minhas-tarefas',
        });
      }

      if (updatedTask.recorrencia && updatedTask.recorrencia !== 'UMA_VEZ') {
        this.generateNextRecurrentTask(updatedTask);
      }
    } else {
      // Partial approval: Remains in AGUARDANDO_VALIDACAO until ALL other validators approve
      const pendingIds = requiredValidatorIds.filter(
        (vId) => !currentApprovals.some((a) => a.validador_id === vId)
      );
      const pendingUsers = this.getUsers().filter((u) => pendingIds.includes(u.id));

      updatedTask = {
        ...task,
        status: 'AGUARDANDO_VALIDACAO',
        validacoes_aprovadas: currentApprovals,
        updated_at: now,
      };

      // Notify remaining pending validators
      pendingUsers.forEach((u) => {
        this.addNotification({
          usuario_id: u.id,
          tipo: 'OS_AGUARDANDO_VALIDACAO',
          titulo: `⏳ Validação Pendente: ${task.numero_os}`,
          texto: `${validator.nome} já aprovou a OS "${task.titulo}". Sua validação ainda é necessária para a conclusão.`,
          lida: false,
          item_tipo: 'TAREFA',
          item_id: task.id,
          link_acao: 'admin-tarefas',
        });
      });
    }

    tasks[idx] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.emitChange();
    return updatedTask;
  }

  public rejectTaskValidation(
    taskId: string,
    validator: { id: string; nome: string; role: UserRole },
    motivo: string
  ): TarefaOS {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('OS não encontrada.');

    const task = tasks[idx];

    // Check validator selection rule
    if (task.validadores_ids && task.validadores_ids.length > 0) {
      if (!task.validadores_ids.includes(validator.id)) {
        throw new Error('Apenas os usuários designados como Validadores da OS durante a criação podem realizar esta validação.');
      }
    }

    // Check GERÊNCIA Gestor Imediato rule: GERÊNCIA can only validate OS for leaders they manage
    if (validator.role === 'GERENCIA') {
      const leaders = this.getLeaders();
      const leader = leaders.find((l) => l.usuario_id === task.responsavel_id || l.id === task.responsavel_id);
      if (leader) {
        if (!leader.gestores_imediatos_ids || !leader.gestores_imediatos_ids.includes(validator.id)) {
          throw new Error('Usuários com perfil GERÊNCIA só podem validar OS dos Líderes sob sua gestão direta (Gestor Imediato).');
        }
      }
    }

    const now = new Date().toISOString();

    const updatedTask: TarefaOS = {
      ...task,
      status: 'EM_ANDAMENTO',
      validacoes_aprovadas: [], // Reset previous approvals since the OS was returned for changes
      motivo_recusa: motivo,
      recusado_por_id: validator.id,
      recusado_por_nome: validator.nome,
      data_recusa: now,
      updated_at: now,
    };

    tasks[idx] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // Notify the Leader
    if (task.responsavel_id) {
      this.addNotification({
        usuario_id: task.responsavel_id,
        tipo: 'OS_RECUSADA',
        titulo: `⚠️ OS Devolvida para Ajuste: ${task.numero_os}`,
        texto: `A OS "${task.titulo}" foi devolvida por ${validator.nome} (${validator.role === 'GERENCIA' ? 'Gerência' : 'Administração'}). Motivo: "${motivo}".`,
        lida: false,
        item_tipo: 'TAREFA',
        item_id: task.id,
        link_acao: 'minhas-tarefas',
      });
    }

    this.emitChange();
    return updatedTask;
  }

  public toggleTaskStatus(taskId: string, userId?: string): TarefaOS {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('OS não encontrada.');

    const current = tasks[idx];
    const isCompleted = current.status === 'CONCLUIDA';
    const now = new Date().toISOString();

    if (isCompleted) {
      tasks[idx] = {
        ...current,
        status: 'EM_ANDAMENTO',
        data_conclusao: undefined,
        evidencias: undefined,
        updated_at: now,
      };
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      this.emitChange();
      return tasks[idx];
    } else {
      return this.completeTask(taskId, {
        evidencias: [
          {
            requisito_id: current.requisitos_conclusao[0]?.id || 'req-simple',
            tipo: 'SIMPLES',
            data_registro: now,
          }
        ],
        observacoes_conclusao: 'Concluída rapidamente via interface.',
        tempo_execucao_minutos: 25,
      });
    }
  }

  public generateNextRecurrentTask(source: TarefaOS): TarefaOS | null {
    if (!source.recorrencia || source.recorrencia === 'UMA_VEZ') return null;

    const baseDate = source.data ? new Date(source.data + 'T00:00:00') : new Date();
    const nextDate = new Date(baseDate);

    switch (source.recorrencia) {
      case 'DIARIA':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'DIAS_UTEIS':
        nextDate.setDate(nextDate.getDate() + 1);
        // If Saturday, jump to Monday
        if (nextDate.getDay() === 6) nextDate.setDate(nextDate.getDate() + 2);
        // If Sunday, jump to Monday
        if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'SEMANAL':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MENSAL':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'PERSONALIZADA':
        if (source.recorrencia_config?.dias_semana?.length) {
          let found = false;
          for (let i = 1; i <= 7; i++) {
            const check = new Date(baseDate);
            check.setDate(check.getDate() + i);
            if (source.recorrencia_config.dias_semana.includes(check.getDay())) {
              nextDate.setTime(check.getTime());
              found = true;
              break;
            }
          }
          if (!found) nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
    }

    const nextDateStr = nextDate.toISOString().split('T')[0];

    // Calculate deadline for next task
    const nextDeadline = new Date(nextDate);
    const [hh, mm] = (source.horario || '10:00').split(':').map(Number);
    nextDeadline.setHours(hh + 4, mm || 0);

    return this.createTask({
      titulo: source.titulo,
      responsavel_id: source.responsavel_id,
      responsavel_nome: source.responsavel_nome,
      responsavel_cargo: source.responsavel_cargo,
      unidade_id: source.unidade_id,
      unidade: source.unidade,
      data: nextDateStr,
      horario: source.horario,
      prazo: nextDeadline.toISOString().slice(0, 16),
      descricao: source.descricao,
      prioridade: source.prioridade,
      categoria_id: source.categoria_id,
      categoria_nome: source.categoria_nome,
      categoria_cor: source.categoria_cor,
      status: 'PROGRAMADA',
      recorrencia: source.recorrencia,
      recorrencia_config: source.recorrencia_config,
      requisitos_conclusao: source.requisitos_conclusao.map((r) => ({
        ...r,
        id: 'req-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        checklist_itens: r.checklist_itens?.map((c) => ({ ...c, concluido: false })),
      })),
      parent_os_id: source.id,
    });
  }

  // --- GOALS (METAS) ---
  public getGoals(): Meta[] {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  }

  public getGoalsForUser(userId: string, userRole: UserRole, userUnitId?: string): Meta[] {
    const goals = this.getGoals();
    if (userRole === 'ADMINISTRADOR') return goals;

    if (userRole === 'GERENCIA') {
      const managedLeaderIds = this.getManagedLeaderIds(userId);
      if (managedLeaderIds.size === 0) return [];

      return goals.filter((g) => {
        if (g.lider_id && managedLeaderIds.has(g.lider_id)) return true;
        if (g.lideres_ids && g.lideres_ids.some((id) => managedLeaderIds.has(id))) return true;
        return false;
      });
    }

    // LÍDER: only goals for their assigned projects / themselves
    const leaderProjectIds = this.getLeaderProjectIds(userId);
    if (userUnitId) leaderProjectIds.add(userUnitId);

    const leaderRecord = this.getLeaders().find(
      (l) => l.usuario_id === userId || l.id === userId
    );
    const leaderIds = new Set([userId, leaderRecord?.id, leaderRecord?.usuario_id].filter(Boolean) as string[]);

    return goals.filter((g) => {
      // 1. Direct leader match
      const hasSpecificLeader = Boolean(g.lider_id || (g.lideres_ids && g.lideres_ids.length > 0));
      if (hasSpecificLeader) {
        if (g.lider_id && leaderIds.has(g.lider_id)) return true;
        if (g.lideres_ids && g.lideres_ids.some((id) => leaderIds.has(id))) return true;
        return false;
      }
      // 2. Project match (only when no specific leader is assigned)
      if (g.unidade_id && leaderProjectIds.has(g.unidade_id)) return true;
      if (g.projeto_id && leaderProjectIds.has(g.projeto_id)) return true;
      if (g.projetos_ids && g.projetos_ids.some((id) => leaderProjectIds.has(id))) return true;
      return false;
    });
  }

  public createGoal(
    data: Omit<Meta, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: Meta['status'] }
  ): Meta {
    const goals = this.getGoals();
    const now = new Date().toISOString();

    // Compute status automatically
    let status: 'EM_ANDAMENTO' | 'ATINGIDA' | 'NAO_ATINGIDA' = data.status || 'EM_ANDAMENTO';
    if (data.meta_valor > 0) {
      if (data.direcao_melhor === 'MENOR_MELHOR') {
        status = data.valor_atual <= data.meta_valor && data.valor_atual > 0 ? 'ATINGIDA' : 'EM_ANDAMENTO';
      } else {
        status = data.valor_atual >= data.meta_valor ? 'ATINGIDA' : 'EM_ANDAMENTO';
      }
    }

    const newGoal: Meta = {
      ...data,
      status,
      id: 'meta-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      created_at: now,
      updated_at: now,
    };

    goals.unshift(newGoal);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));

    // Notify leader if assigned
    if (newGoal.lider_id) {
      this.addNotification({
        usuario_id: newGoal.lider_id,
        tipo: 'SISTEMA',
        titulo: `Nova Meta Atribuída: ${newGoal.indicador}`,
        texto: `Meta de ${newGoal.meta_valor} ${newGoal.unidade_medida} (${newGoal.periodo}).`,
        lida: false,
        link_acao: '/metas',
      });
    }

    this.emitChange();
    return newGoal;
  }

  public updateGoal(id: string, data: Partial<Meta>): Meta {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Meta não encontrada.');

    const updated = {
      ...goals[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };

    // Auto calculate status if values change
    if (updated.meta_valor > 0) {
      if (updated.direcao_melhor === 'MENOR_MELHOR') {
        updated.status = updated.valor_atual <= updated.meta_valor && updated.valor_atual > 0 ? 'ATINGIDA' : 'EM_ANDAMENTO';
      } else {
        updated.status = updated.valor_atual >= updated.meta_valor ? 'ATINGIDA' : 'EM_ANDAMENTO';
      }
    }

    goals[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    this.emitChange();
    return updated;
  }

  public updateGoalRealized(id: string, valor_atual: number): Meta {
    return this.updateGoal(id, { valor_atual });
  }

  public deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    this.emitChange();
  }

  // --- REPORTS (RELATÓRIOS) ---
  public getReports(): Relatorio[] {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  }

  public getReportsForUser(user: UsuarioPerfil | null): Relatorio[] {
    const all = this.getReports();
    if (!user) return [];
    if (user.role === 'ADMINISTRADOR') return all;

    if (user.role === 'GERENCIA') {
      const managedLeaderIds = this.getManagedLeaderIds(user.id);
      if (managedLeaderIds.size === 0) return [];

      return all.filter((r) => {
        if (r.lideres_alvo && r.lideres_alvo.some((targetId) => managedLeaderIds.has(targetId))) {
          return true;
        }
        if ((r as any).lider_id && managedLeaderIds.has((r as any).lider_id)) {
          return true;
        }
        return false;
      });
    }

    // LÍDER
    const leaderProjectIds = this.getLeaderProjectIds(user.id);
    const leaderRecord = this.getLeaders().find(
      (l) => l.usuario_id === user.id || l.id === user.id || (user.email && l.email?.toLowerCase() === user.email?.toLowerCase())
    );
    const leaderIds = new Set([user.id, leaderRecord?.id, leaderRecord?.usuario_id].filter(Boolean) as string[]);

    // Leaders only see published reports that they have access to
    return all.filter((r) => {
      if (!r.publicado) return false;

      // Direct leader check if specific leaders are targeted
      if (r.lideres_alvo && r.lideres_alvo.length > 0) {
        return r.lideres_alvo.some((targetId) => leaderIds.has(targetId));
      }
      if ((r as any).lider_id) {
        return leaderIds.has((r as any).lider_id);
      }

      // Access checks
      if (r.publico_tipo === 'TODOS') return true;
      if (r.publico_tipo === 'UNIDADES' || (r.publico_tipo as string) === 'PROJETOS') {
        if (!r.unidades_alvo || r.unidades_alvo.length === 0) return true;
        return r.unidades_alvo.some((targetId) => leaderProjectIds.has(targetId));
      }
      if (r.publico_tipo === 'LIDERES') {
        if (!r.lideres_alvo || r.lideres_alvo.length === 0) return true;
        return r.lideres_alvo.some((targetId) => leaderIds.has(targetId));
      }
      return false;
    });
  }

  public createReport(
    data: Omit<
      Relatorio,
      'id' | 'created_at' | 'updated_at' | 'confirmacoes_leitura' | 'total_leituras' | 'arquivo_pdf_url'
    > & { arquivo_pdf_url?: string }
  ): Relatorio {
    const reports = this.getReports();
    const now = new Date().toISOString();

    const newReport: Relatorio = {
      ...data,
      arquivo_pdf_url: data.arquivo_pdf_url || '',
      id: 'rel-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      confirmacoes_leitura: [],
      leitores_confirmados: [],
      total_leituras: 0,
      created_at: now,
      updated_at: now,
    };

    reports.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    // Notify eligible leaders if published
    if (newReport.publicado) {
      const leaders = this.getUsers().filter((u) => u.role === 'LIDER');
      leaders.forEach((l) => {
        let hasAccess = false;
        if (newReport.publico_tipo === 'TODOS') hasAccess = true;
        if (newReport.publico_tipo === 'UNIDADES' && l.unidade_id && newReport.unidades_alvo?.includes(l.unidade_id)) hasAccess = true;
        if (newReport.publico_tipo === 'LIDERES' && newReport.lideres_alvo?.includes(l.id)) hasAccess = true;

        if (hasAccess) {
          this.addNotification({
            usuario_id: l.id,
            tipo: 'RELATORIO_PUBLICADO',
            titulo: `Novo Relatório Publicado: ${newReport.titulo}`,
            texto: `Disponível para leitura e confirmação. Período: ${newReport.periodo}.`,
            lida: false,
            link_acao: '/relatorios',
          });
        }
      });
    }

    this.emitChange();
    return newReport;
  }

  public updateReport(id: string, data: Partial<Relatorio>): Relatorio {
    const reports = this.getReports();
    const idx = reports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Relatório não encontrado.');

    const updated = {
      ...reports[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };

    reports[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    this.emitChange();
    return updated;
  }

  public toggleReportPublished(id: string): Relatorio {
    const reports = this.getReports();
    const idx = reports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Relatório não encontrado.');

    const newStatus = !reports[idx].publicado;
    return this.updateReport(id, { publicado: newStatus });
  }

  public deleteReport(id: string): void {
    const reports = this.getReports().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    this.emitChange();
  }

  public confirmReportReading(
    reportId: string,
    user: { id: string; nome: string; cargo?: string; unidade_nome?: string }
  ): Relatorio {
    const reports = this.getReports();
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error('Relatório não encontrado.');

    const report = reports[idx];
    const confirmations = report.confirmacoes_leitura || [];
    const alreadyConfirmed = confirmations.some((c) => c.usuario_id === user.id);

    if (!alreadyConfirmed) {
      const now = new Date().toISOString();
      const newConfirmation = {
        usuario_id: user.id,
        usuario_nome: user.nome,
        usuario_cargo: user.cargo,
        unidade_nome: user.unidade_nome,
        data_hora: now,
      };

      report.confirmacoes_leitura = [...confirmations, newConfirmation];
      report.leitores_confirmados = [...(report.leitores_confirmados || []), user.id];
      report.total_leituras = (report.total_leituras || 0) + 1;
      report.updated_at = now;

      reports[idx] = report;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

      // Notify admin
      const admins = this.getUsers().filter((u) => u.role === 'ADMINISTRADOR');
      admins.forEach((admin) => {
        this.addNotification({
          usuario_id: admin.id,
          tipo: 'SISTEMA',
          titulo: `📖 Confirmação de Leitura: ${report.titulo}`,
          texto: `${user.nome} confirmou a leitura do relatório (${report.periodo}).`,
          lida: false,
        });
      });

      this.emitChange();
    }

    return reports[idx];
  }

  // --- CALENDAR EVENTS ---
  public getEvents(): CalendarioEvento[] {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  }

  public getEventsForUser(userId: string, userRole: UserRole, userUnidadeId?: string): CalendarioEvento[] {
    const all = this.getEvents();
    if (userRole === 'ADMINISTRADOR') return all;

    if (userRole === 'GERENCIA') {
      const managedLeaderIds = this.getManagedLeaderIds(userId);
      if (managedLeaderIds.size === 0) return [];

      return all.filter((e) => {
        if (e.lider_id && managedLeaderIds.has(e.lider_id)) return true;
        if (e.lideres_alvo && e.lideres_alvo.some((id) => managedLeaderIds.has(id))) return true;
        return false;
      });
    }

    // LÍDER
    const leaderProjectIds = this.getLeaderProjectIds(userId);
    if (userUnidadeId) leaderProjectIds.add(userUnidadeId);

    const leaderRecord = this.getLeaders().find(
      (l) => l.usuario_id === userId || l.id === userId
    );
    const leaderIds = new Set([userId, leaderRecord?.id, leaderRecord?.usuario_id].filter(Boolean) as string[]);

    return all.filter((e) => {
      if (!e.publico_tipo || e.publico_tipo === 'TODOS') return true;
      if (e.lider_id && leaderIds.has(e.lider_id)) return true;
      if (e.lideres_alvo && e.lideres_alvo.some((id) => leaderIds.has(id))) return true;
      if (e.unidade_id && leaderProjectIds.has(e.unidade_id)) return true;
      if (e.unidades_alvo && e.unidades_alvo.some((id) => leaderProjectIds.has(id))) return true;
      if (e.projeto_id && leaderProjectIds.has(e.projeto_id)) return true;
      return false;
    });
  }

  public getEventById(id: string): CalendarioEvento | undefined {
    return this.getEvents().find((e) => e.id === id);
  }

  public createEvent(event: Omit<CalendarioEvento, 'id' | 'created_at'>): CalendarioEvento {
    const events = this.getEvents();
    const now = new Date().toISOString();
    const newEvent: CalendarioEvento = {
      ...event,
      id: 'evt-' + Date.now().toString(36),
      created_at: now,
      updated_at: now,
    };
    events.push(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    // Send notifications to eligible leaders
    const leaders = this.getUsers().filter((u) => u.role === 'LIDER');
    leaders.forEach((l) => {
      let notify = false;
      if (!newEvent.publico_tipo || newEvent.publico_tipo === 'TODOS') notify = true;
      if (newEvent.publico_tipo === 'UNIDADES' && l.unidade_id && newEvent.unidades_alvo?.includes(l.unidade_id)) notify = true;
      if (newEvent.publico_tipo === 'UNIDADES' && newEvent.unidade_id === l.unidade_id) notify = true;
      if (newEvent.publico_tipo === 'LIDERES' && newEvent.lideres_alvo?.includes(l.id)) notify = true;
      if (newEvent.lider_id === l.id) notify = true;

      if (notify) {
        const typeLabels: Record<string, string> = {
          REUNIAO: '📅 Nova Reunião Agendada',
          TREINAMENTO: '🎓 Novo Treinamento Agendado',
          COMUNICADO: '📢 Novo Comunicado no Calendário',
          EVENTO: '📌 Novo Evento Operacional',
        };
        this.addNotification({
          usuario_id: l.id,
          tipo: 'SISTEMA',
          titulo: typeLabels[newEvent.tipo] || '📅 Novo Item no Calendário',
          texto: `${newEvent.titulo} em ${new Date(newEvent.data + 'T12:00:00').toLocaleDateString('pt-BR')} às ${newEvent.horario_inicio}.`,
          lida: false,
          link_acao: '/calendario',
        });
      }
    });

    this.emitChange();
    return newEvent;
  }

  public updateEvent(id: string, data: Partial<CalendarioEvento>): CalendarioEvento {
    const events = this.getEvents();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Evento não encontrado.');

    const updated: CalendarioEvento = {
      ...events[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };

    events[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.emitChange();
    return updated;
  }

  public deleteEvent(id: string): void {
    const events = this.getEvents().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.emitChange();
  }

  // --- CALENDAR EVENT TYPES (CONFIGURAÇÃO DE TIPOS) ---
  public getCalendarTypes(): TipoEventoConfig[] {
    const data = localStorage.getItem(STORAGE_KEYS.CALENDAR_TYPES);
    if (data === null) {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_TYPES, JSON.stringify(INITIAL_CALENDAR_TYPES));
      return INITIAL_CALENDAR_TYPES;
    }
    try {
      const types: TipoEventoConfig[] = JSON.parse(data);
      if (Array.isArray(types) && types.length > 0) {
        return types;
      }
      return INITIAL_CALENDAR_TYPES;
    } catch {
      return INITIAL_CALENDAR_TYPES;
    }
  }

  public createCalendarType(data: Omit<TipoEventoConfig, 'id'>): TipoEventoConfig {
    const types = this.getCalendarTypes();
    const id = data.nome
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '_') + '_' + Date.now().toString(36);

    const newType: TipoEventoConfig = {
      ...data,
      id,
      is_default: false,
    };
    types.push(newType);
    localStorage.setItem(STORAGE_KEYS.CALENDAR_TYPES, JSON.stringify(types));
    this.emitChange();
    return newType;
  }

  public updateCalendarType(id: string, data: Partial<TipoEventoConfig>): TipoEventoConfig {
    const types = this.getCalendarTypes();
    const idx = types.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Tipo de evento não encontrado.');

    types[idx] = { ...types[idx], ...data };
    localStorage.setItem(STORAGE_KEYS.CALENDAR_TYPES, JSON.stringify(types));
    this.emitChange();
    return types[idx];
  }

  public deleteCalendarType(id: string): void {
    const currentTypes = this.getCalendarTypes();
    const filtered = currentTypes.filter((t) => t.id !== id);
    
    if (filtered.length === 0) {
      // Ensure at least one active fallback type remains
      const fallback: TipoEventoConfig = {
        id: 'GERAL',
        nome: 'Geral',
        cor: '#355C7D',
        descricao: 'Eventos e compromissos gerais',
        is_default: true,
      };
      localStorage.setItem(STORAGE_KEYS.CALENDAR_TYPES, JSON.stringify([fallback]));
    } else {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_TYPES, JSON.stringify(filtered));
    }

    // Reassign existing events associated with deleted type to remaining fallback type
    const remainingTypes = this.getCalendarTypes();
    const fallbackTypeId = remainingTypes[0]?.id || 'GERAL';
    const events = this.getEvents();
    let updatedEvents = false;
    events.forEach((e) => {
      if (e.tipo === id) {
        e.tipo = fallbackTypeId;
        updatedEvents = true;
      }
    });
    if (updatedEvents) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }

    this.emitChange();
  }

  // --- COMMENTS ---
  public getComments(itemType?: string, itemId?: string): Comentario[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const comments: Comentario[] = data ? JSON.parse(data) : [];
    if (itemType && itemId) {
      return comments.filter((c) => c.item_tipo === itemType && c.item_id === itemId);
    }
    return comments;
  }

  public addComment(comment: Omit<Comentario, 'id' | 'created_at'>): Comentario {
    const comments = this.getComments();
    const newComment: Comentario = {
      ...comment,
      id: 'com-' + Date.now().toString(36),
      created_at: new Date().toISOString(),
    };
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));

    const itemTabMap: Record<string, string> = {
      TAREFA: 'minhas-tarefas',
      META: 'minhas-metas',
      RELATORIO: 'relatorios',
      CALENDARIO: 'calendario',
      EVENTO: 'calendario',
    };

    const targetTab = itemTabMap[comment.item_tipo] || 'inicio';

    // 1. Leader commented -> Notify Administrators
    if (comment.autor_role === 'LIDER') {
      const admins = this.getUsers().filter((u) => u.role === 'ADMINISTRADOR');
      admins.forEach((admin) => {
        this.addNotification({
          usuario_id: admin.id,
          tipo: 'COMENTARIO',
          titulo: `💬 Novo comentário de ${comment.autor_nome}`,
          texto: `Em ${comment.item_tipo.toLowerCase()}: "${comment.texto.substring(0, 70)}${comment.texto.length > 70 ? '...' : ''}"`,
          lida: false,
          item_tipo: comment.item_tipo,
          item_id: comment.item_id,
          link_acao: comment.item_tipo === 'TAREFA' ? 'admin-tarefas' : comment.item_tipo === 'META' ? 'admin-metas' : 'admin-relatorios',
        });
      });
    }

    // 2. Administrator commented -> Notify responsible Leader(s)
    if (comment.autor_role === 'ADMINISTRADOR') {
      if (comment.item_tipo === 'TAREFA') {
        const task = this.getTasks().find((t) => t.id === comment.item_id);
        if (task && task.responsavel_id) {
          this.addNotification({
            usuario_id: task.responsavel_id,
            tipo: 'COMENTARIO',
            titulo: `💬 Resposta da Administração na OS ${task.numero_os}`,
            texto: `${comment.autor_nome}: "${comment.texto.substring(0, 70)}${comment.texto.length > 70 ? '...' : ''}"`,
            lida: false,
            item_tipo: 'TAREFA',
            item_id: task.id,
            link_acao: 'minhas-tarefas',
          });
        }
      } else if (comment.item_tipo === 'META') {
        const goal = this.getGoals().find((g) => g.id === comment.item_id);
        if (goal && goal.lider_id) {
          this.addNotification({
            usuario_id: goal.lider_id,
            tipo: 'COMENTARIO',
            titulo: `💬 Alinhamento de Meta: ${goal.indicador}`,
            texto: `${comment.autor_nome}: "${comment.texto.substring(0, 70)}${comment.texto.length > 70 ? '...' : ''}"`,
            lida: false,
            item_tipo: 'META',
            item_id: goal.id,
            link_acao: 'minhas-metas',
          });
        }
      } else if (comment.item_tipo === 'RELATORIO') {
        const report = this.getReports().find((r) => r.id === comment.item_id);
        if (report) {
          const eligibleLeaders = this.getUsers().filter((u) => u.role === 'LIDER');
          eligibleLeaders.forEach((l) => {
            let hasAccess = report.publico_tipo === 'TODOS';
            if (report.publico_tipo === 'UNIDADES' && l.unidade_id && report.unidades_alvo?.includes(l.unidade_id)) hasAccess = true;
            if (report.publico_tipo === 'LIDERES' && report.lideres_alvo?.includes(l.id)) hasAccess = true;
            if (hasAccess) {
              this.addNotification({
                usuario_id: l.id,
                tipo: 'COMENTARIO',
                titulo: `💬 Observação no Relatório: ${report.titulo}`,
                texto: `${comment.autor_nome}: "${comment.texto.substring(0, 70)}${comment.texto.length > 70 ? '...' : ''}"`,
                lida: false,
                item_tipo: 'RELATORIO',
                item_id: report.id,
                link_acao: 'relatorios',
              });
            }
          });
        }
      }
    }

    this.emitChange();
    return newComment;
  }

  public deleteComment(id: string): void {
    const comments = this.getComments().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    this.emitChange();
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId?: string): Notificacao[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const notifs: Notificacao[] = data ? JSON.parse(data) : [];
    if (userId) {
      return notifs.filter((n) => !n.usuario_id || n.usuario_id === userId || n.usuario_id === 'ALL');
    }
    return notifs;
  }

  public addNotification(notif: Omit<Notificacao, 'id' | 'created_at'>): void {
    const notifs = this.getNotifications();
    const newNotif: Notificacao = {
      ...notif,
      id: 'notif-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
      created_at: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.emitChange();
  }

  public markNotificationRead(notifId: string): void {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex((n) => n.id === notifId);
    if (idx !== -1) {
      notifs[idx].lida = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      this.emitChange();
    }
  }

  public markAllNotificationsRead(userId?: string): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => {
      if (!userId || n.usuario_id === userId || n.usuario_id === 'ALL') {
        n.lida = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.emitChange();
  }

  public checkAndGenerateAutomatedAlerts(user: UsuarioPerfil | null): void {
    if (!user) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const userNotifs = this.getNotifications(user.id);

    if (user.role === 'LIDER') {
      const userTasks = this.getTasksForUser(user.id, user.role);

      // 1. Alert for Overdue Tasks
      const overdueTasks = userTasks.filter((t) => t.status === 'ATRASADA');
      if (overdueTasks.length > 0) {
        const alreadyNotified = userNotifs.some(
          (n) => n.tipo === 'TAREFA_ATRASADA' && n.created_at.startsWith(todayStr)
        );
        if (!alreadyNotified) {
          this.addNotification({
            usuario_id: user.id,
            tipo: 'TAREFA_ATRASADA',
            titulo: `⚠️ Você possui ${overdueTasks.length} OS atrasada(s)`,
            texto: `Atenção: Existem Ordens de Serviço pendentes que ultrapassaram o horário limite. Regularize suas pendências.`,
            lida: false,
            item_tipo: 'TAREFA',
            link_acao: 'minhas-tarefas',
          });
        }
      }

      // 2. Alert for tasks expiring soon (within next 2 hours)
      const upcomingTasks = userTasks.filter((t) => {
        if (t.status !== 'PROGRAMADA' && t.status !== 'EM_ANDAMENTO') return false;
        if (!t.prazo) return false;
        const deadline = new Date(t.prazo);
        const diffMinutes = (deadline.getTime() - now.getTime()) / (1000 * 60);
        return diffMinutes > 0 && diffMinutes <= 120;
      });

      upcomingTasks.forEach((t) => {
        const alreadyNotified = userNotifs.some(
          (n) => n.tipo === 'PRAZO_PROXIMO' && n.item_id === t.id && n.created_at.startsWith(todayStr)
        );
        if (!alreadyNotified) {
          this.addNotification({
            usuario_id: user.id,
            tipo: 'PRAZO_PROXIMO',
            titulo: `⏰ Prazo Próximo: ${t.numero_os}`,
            texto: `${t.titulo} vence em menos de 2 horas (${t.horario || 'hoje'}). Registre as evidências.`,
            lida: false,
            item_tipo: 'TAREFA',
            item_id: t.id,
            link_acao: 'minhas-tarefas',
          });
        }
      });

      // 3. Alert for daily goals pending completion in the afternoon
      const userGoals = this.getGoalsForUser(user.id, user.role, user.unidade_id);
      const pendingDailyGoals = userGoals.filter(
        (g) => g.tipo_periodo === 'DIARIA' && g.status === 'EM_ANDAMENTO'
      );
      if (pendingDailyGoals.length > 0 && now.getHours() >= 14) {
        const alreadyNotified = userNotifs.some(
          (n) => n.tipo === 'META_NAO_ATINGIDA' && n.created_at.startsWith(todayStr)
        );
        if (!alreadyNotified) {
          this.addNotification({
            usuario_id: user.id,
            tipo: 'META_NAO_ATINGIDA',
            titulo: `🎯 Resumo de Metas Diárias: ${pendingDailyGoals.length} pendente(s)`,
            texto: `Faltam poucas horas para o fechamento do turno. Lance as medições do dia na aba de Metas.`,
            lida: false,
            item_tipo: 'META',
            link_acao: 'minhas-metas',
          });
        }
      }
    }
  }

  // --- SIMULATED EMAILS (Outbox viewer) ---
  public getSimulatedEmails(): SimulatedEmail[] {
    const data = localStorage.getItem(STORAGE_KEYS.SIMULATED_EMAILS);
    return data ? JSON.parse(data) : [];
  }

  public deleteSimulatedEmail(id: string): void {
    const emails = this.getSimulatedEmails().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify(emails));
    this.emitChange();
  }

  public clearSimulatedEmails(): void {
    localStorage.setItem(STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify([]));
    this.emitChange();
  }
}

export const dbStore = new DatabaseStore();
