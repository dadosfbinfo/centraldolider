import { supabase } from './supabase';
import backupData from '../data/central_do_lider_backup_completo.json';

/**
 * Script SQL para Carga Inicial de Dados (Data Seeding) com integridade referencial estrita.
 * Total: 67 registros distribuídos nas 12 tabelas públicas.
 */
export const SUPABASE_SEED_SQL = `-- ==============================================================================
-- SCRIPT 3: CARGA DE DADOS (DATA SEEDING) - CENTRAL DO LÍDER V2.0
-- Total de registros: 67 registros distribuídos nas 12 tabelas públicas
-- Ordem estrita de integridade referencial: 1. Unidades -> 2. Categorias ->
-- 3. Usuários -> 4. Líderes -> 5. Tipos Calendário -> 6. Tipos Auditoria ->
-- 7. Tarefas OS -> 8. Metas -> 9. Relatórios -> 10. Calendário Eventos ->
-- 11. Comentários -> 12. Notificações
-- ==============================================================================

-- 1. UNIDADES (4 registros)
INSERT INTO public.unidades (id, nome, regional, codigo, cidade, estado, endereco, responsavel_nome, status, created_at) VALUES
('unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'Sudeste 1', 'UN-SP01', 'São Paulo', 'SP', 'Av. Brigadeiro Faria Lima, 1485', 'Mariana Costa', 'ATIVA', '2026-08-01T08:00:00Z'),
('unit-rj-01', 'Unidade Rio de Janeiro - Barra da Tijuca', 'Sudeste 2', 'UN-RJ01', 'Rio de Janeiro', 'RJ', 'Av. das Américas, 3500', 'Roberto Almeida', 'ATIVA', '2026-08-01T08:00:00Z'),
('unit-mg-01', 'Unidade Belo Horizonte - Savassi', 'Minas/Centro', 'UN-MG01', 'Belo Horizonte', 'MG', 'Rua Pernambuco, 1000', 'Fernanda Lima', 'ATIVA', '2026-08-01T08:00:00Z'),
('unit-pr-01', 'Unidade Curitiba - Batel', 'Sul', 'UN-PR01', 'Curitiba', 'PR', 'Av. do Batel, 1800', 'Juliana Oliveira', 'ATIVA', '2026-08-01T08:00:00Z')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, status = EXCLUDED.status;

-- 2. CATEGORIAS (5 registros)
INSERT INTO public.categorias (id, nome, cor, descricao, tipo, created_at) VALUES
('cat-op', 'Rotina Operacional', '#C76B4A', 'Abertura, fechamento e controle de piso', 'OPERACIONAL', '2026-08-01T08:00:00Z'),
('cat-seg', 'Segurança & Saúde', '#B85C7A', 'EPIs, brigada e conformidade técnica', 'SEGURANCA', '2026-08-01T08:00:00Z'),
('cat-qual', 'Qualidade & Auditoria', '#355C7D', 'Padrões de atendimento e produto', 'QUALIDADE', '2026-08-01T08:00:00Z'),
('cat-est', 'Gestão de Estoque', '#5B7DBE', 'Inventários, conferência e perdas', 'OPERACIONAL', '2026-08-01T08:00:00Z'),
('cat-adm', 'Administrativo & RH', '#8B6B4A', 'Ponto, escalas e documentos legais', 'ADMINISTRATIVO', '2026-08-01T08:00:00Z')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, cor = EXCLUDED.cor;

-- 3. USUARIOS (7 registros)
INSERT INTO public.usuarios (id, email, nome, role, status_confirmacao, unidade_id, unidade_nome, cargo, telefone, avatar_url, token_confirmacao, created_at, updated_at) VALUES
('user-admin-01', 'admin@centraldolider.com.br', 'Carlos Eduardo Ramos (Admin)', 'ADMINISTRADOR', 'CONFIRMADO', NULL, NULL, 'Diretor de Operações', '(11) 98765-4321', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', NULL, '2026-08-01T08:00:00Z', '2026-08-01T08:00:00Z'),
('user-lider-sp', 'mariana.costa@centraldolider.com.br', 'Mariana Costa', 'LIDER', 'CONFIRMADO', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'Gerente de Unidade', '(11) 97123-8899', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', NULL, '2026-08-05T09:00:00Z', '2026-08-05T09:00:00Z'),
('user-lider-rj', 'roberto.almeida@centraldolider.com.br', 'Roberto Almeida', 'LIDER', 'CONFIRMADO', 'unit-rj-01', 'Unidade Rio de Janeiro - Barra da Tijuca', 'Supervisor Operacional', '(21) 98844-3322', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', NULL, '2026-08-10T10:00:00Z', '2026-08-10T10:00:00Z'),
('user-lider-mg', 'fernanda.lima@centraldolider.com.br', 'Fernanda Lima', 'LIDER', 'CONFIRMADO', 'unit-mg-01', 'Unidade Belo Horizonte - Savassi', 'Líder de Turno', '(31) 99123-4567', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', NULL, '2026-08-15T11:00:00Z', '2026-08-15T11:00:00Z'),
('user-gerencia-01', 'gerencia.teste@centraldolider.com.br', 'Gerência Teste', 'GERENCIA', 'CONFIRMADO', NULL, NULL, 'Gerente Regional de Operações', '(11) 98888-7777', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80', NULL, '2026-08-20T08:00:00Z', '2026-08-20T08:00:00Z'),
('user-lider-teste', 'lider.teste@centraldolider.com.br', 'Líder Teste', 'LIDER', 'CONFIRMADO', 'unit-pr-01', 'Unidade Curitiba - Batel', 'Líder Operacional Curitiba', '(41) 99999-1122', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', NULL, '2026-08-25T08:00:00Z', '2026-08-25T08:00:00Z'),
('user-pending-01', 'juliana.oliveira@centraldolider.com.br', 'Juliana Oliveira (Pendente)', 'LIDER', 'PENDENTE', 'unit-pr-01', 'Unidade Curitiba - Batel', 'Subgerente em Integração', '(41) 98777-6655', NULL, 'token_cdl_juliana_preview_123', '2026-08-28T14:30:00Z', '2026-08-28T14:30:00Z')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, role = EXCLUDED.role;

-- 4. LIDERES (4 registros)
INSERT INTO public.lideres (id, usuario_id, nome, email, matricula, cargo, unidade, unidade_id, regional, gestor, status, telefone, created_at, updated_at) VALUES
('lider-01', 'user-lider-sp', 'Mariana Costa', 'mariana.costa@centraldolider.com.br', 'MAT-9941', 'Gerente de Unidade', 'Unidade São Paulo - Matriz Pinheiros', 'unit-sp-01', 'Sudeste 1', 'Carlos Eduardo Ramos', 'ATIVO', '(11) 97123-8899', '2026-08-05T09:00:00Z', '2026-08-05T09:00:00Z'),
('lider-02', 'user-lider-rj', 'Roberto Almeida', 'roberto.almeida@centraldolider.com.br', 'MAT-8812', 'Supervisor Operacional', 'Unidade Rio de Janeiro - Barra da Tijuca', 'unit-rj-01', 'Sudeste 2', 'Carlos Eduardo Ramos', 'ATIVO', '(21) 98844-3322', '2026-08-10T10:00:00Z', '2026-08-10T10:00:00Z'),
('lider-03', 'user-lider-mg', 'Fernanda Lima', 'fernanda.lima@centraldolider.com.br', 'MAT-7733', 'Líder de Turno', 'Unidade Belo Horizonte - Savassi', 'unit-mg-01', 'Minas/Centro', 'Carlos Eduardo Ramos', 'ATIVO', '(31) 99123-4567', '2026-08-15T11:00:00Z', '2026-08-15T11:00:00Z'),
('lider-teste', 'user-lider-teste', 'Líder Teste', 'lider.teste@centraldolider.com.br', 'MAT-9900', 'Líder Operacional Curitiba', 'Unidade Curitiba - Batel', 'unit-pr-01', 'Sul', 'Carlos Eduardo Ramos', 'ATIVO', '(41) 99999-1122', '2026-08-25T08:00:00Z', '2026-08-25T08:00:00Z')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email;

-- 5. TIPOS_CALENDARIO (6 registros)
INSERT INTO public.tipos_calendario (id, nome, cor, descricao, is_default, created_at, updated_at) VALUES
('REUNIAO', 'Reunião de Alinhamento', '#2E7D32', 'Reuniões de alinhamento com a liderança', TRUE, NOW(), NOW()),
('TREINAMENTO', 'Treinamento & Capacitação', '#7C3AED', 'Workshops, cursos e integração de equipes', TRUE, NOW(), NOW()),
('AUDITORIA', 'Auditoria / Inspeção', '#355C7D', 'Auditorias operacionais e de conformidade', TRUE, NOW(), NOW()),
('VISITA_TECNICA', 'Visita Técnica', '#0D9488', 'Vistorias e acompanhamentos presenciais', TRUE, NOW(), NOW()),
('COMUNICADO', 'Comunicado Operacional', '#C76B4A', 'Avisos e comunicados gerais de gestão', TRUE, NOW(), NOW()),
('EVENTO', 'Evento Geral', '#D97706', 'Eventos corporativos e gerais', TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, cor = EXCLUDED.cor;

-- 6. TIPOS_AUDITORIA (5 registros)
INSERT INTO public.tipos_auditoria (id, nome, descricao, is_default, created_at, updated_at) VALUES
('PRODUCAO', 'Produção', 'Processos e rotinas de linha de produção', TRUE, NOW(), NOW()),
('EPIS', 'EPIs', 'Equipamentos de Proteção Individual e segurança', TRUE, NOW(), NOW()),
('QUALIDADE', 'Qualidade', 'Padrões técnicos e conformidade do produto', TRUE, NOW(), NOW()),
('5S_ORGANIZACAO', '5S / Organização', 'Limpeza, organização e conservação', TRUE, NOW(), NOW()),
('SEGURANCA_OPERACIONAL', 'Segurança Operacional', 'Procedimentos seguros e prevenção de riscos', TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao;

-- 7. TAREFAS_OS (8 registros)
INSERT INTO public.tarefas_os (id, numero_os, titulo, responsavel_id, responsavel_nome, responsavel_cargo, unidade_id, unidade, data, horario, prazo, descricao, prioridade, categoria_id, categoria_nome, categoria_cor, status, recorrencia, requisitos_conclusao, data_inicio, data_conclusao, tempo_execucao_minutos, observacoes_conclusao, evidencias, motivo_bloqueio, data_bloqueio, recorrencia_config, created_at, updated_at) VALUES
('os-101', 'OS #000150', 'Auditoria Diária de Abertura de Caixa e Fundo de Reserva', 'user-lider-sp', 'Mariana Costa', 'Gerente de Unidade', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', '2026-09-01', '08:00', '2026-09-01T10:30:00', 'Conferir numerário dos caixas 1 a 6, testar impressoras fiscais, validar conectividade SAT/NFC-e e registrar checklist com contagem de valores.', 'ALTA', 'cat-op', 'Rotina Operacional', '#C76B4A', 'EM_ANDAMENTO', 'DIARIA', '[{"id":"req-101-1","tipo":"CHECKLIST","titulo":"Checklist de Abertura","instrucoes":"Marque todos os procedimentos executados antes da abertura dos portões","obrigatorio":true,"checklist_itens":[{"id":"chk-1","texto":"Contagem física do fundo de caixa (R\$ 500 por PDV)","concluido":true},{"id":"chk-2","texto":"Teste de impressão do comprovante fiscal (bobinas trocadas)","concluido":true},{"id":"chk-3","texto":"Verificação de terminal de cartão e conectividade Wi-Fi/4G","concluido":false},{"id":"chk-4","texto":"Inspeção visual da área de atendimento e climatização","concluido":false}]},{"id":"req-101-2","tipo":"NUMERO","titulo":"Fundo Total de Abertura Consolidado","instrucoes":"Informe o total apurado na soma dos caixas","unidade_medida":"R\$","obrigatorio":true}]'::jsonb, '2026-09-01T07:45:00Z', NULL, NULL, NULL, '{}', NULL, NULL, '{}'::jsonb, '2026-09-01T06:00:00Z', '2026-09-01T07:45:00Z'),
('os-102', 'OS #000151', 'Vistoria Semanal de Câmaras Frias e Controle Térmico', 'user-lider-sp', 'Mariana Costa', 'Gerente de Unidade', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', '2026-09-01', '11:00', '2026-09-01T17:00:00', 'Realizar aferição com termômetro calibrado nas câmaras de resfriados e congelados, registrando medição e fotografia do painel digital.', 'ALTA', 'cat-qual', 'Qualidade & Auditoria', '#355C7D', 'PROGRAMADA', 'DIAS_UTEIS', '[{"id":"req-102-1","tipo":"NUMERO","titulo":"Temperatura da Câmara Fria Principal","instrucoes":"Informe a temperatura aferida no sensor central (Padrão: entre -18°C e -22°C)","unidade_medida":"°C","valor_minimo":-30,"valor_maximo":10,"obrigatorio":true},{"id":"req-102-2","tipo":"FOTO","titulo":"Foto do Display do Termômetro e Registro","instrucoes":"Envie uma foto nítida do display digital com hora visível","obrigatorio":true},{"id":"req-102-3","tipo":"TEXTO","titulo":"Observações de Vedação e Gelo","instrucoes":"Relate qualquer acúmulo excessivo de gelo ou desgaste nas borrachas","obrigatorio":false}]'::jsonb, NULL, NULL, NULL, NULL, '{}', NULL, NULL, '{}'::jsonb, '2026-09-01T06:30:00Z', '2026-09-01T06:30:00Z'),
('os-103', 'OS #000152', 'Vistoria Mensal de Extintores, Laudos e Rotas de Fuga', 'user-lider-sp', 'Mariana Costa', 'Gerente de Unidade', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', '2026-08-30', '14:00', '2026-08-31T18:00:00', 'Inspecionar lacres, manômetros, desobstrução e validade de carga dos 12 extintores da unidade conforme laudo AVCB.', 'ALTA', 'cat-seg', 'Segurança & Saúde', '#B85C7A', 'ATRASADA', 'MENSAL', '[{"id":"req-103-1","tipo":"FORMULARIO","titulo":"Questionário de Segurança Contra Incêndio","instrucoes":"Responda aos itens obrigatórios da auditoria","obrigatorio":true,"perguntas":[{"id":"q1","pergunta":"Todos os 12 extintores estão com lacre intacto?","tipo":"SIM_NAO","obrigatoria":true},{"id":"q2","pergunta":"As luzes de emergência acenderam no teste?","tipo":"SIM_NAO","obrigatoria":true},{"id":"q3","pergunta":"Quantidade de extintores com recarga a vencer em 30 dias:","tipo":"NUMERO","obrigatoria":true},{"id":"q4","pergunta":"Status das rotas de fuga e portas corta-fogo:","tipo":"SELECAO","opcoes":["100% Desobstruídas","Parcialmente obstruídas","Crítico / Bloqueadas"],"obrigatoria":true}]},{"id":"req-103-2","tipo":"FOTO","titulo":"Foto do Mapa e Ficha de Inspeção Assinada","instrucoes":"Anexe a foto da planilha física de vistoria preenchida","obrigatorio":true}]'::jsonb, NULL, NULL, NULL, NULL, '{}', NULL, NULL, '{}'::jsonb, '2026-08-30T07:00:00Z', '2026-08-30T07:00:00Z'),
('os-104', 'OS #000153', 'Manutenção Corretiva da Bomba de Recalque de Água', 'user-lider-sp', 'Mariana Costa', 'Gerente de Unidade', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', '2026-08-31', '15:00', '2026-09-02T12:00:00', 'Acompanhar a equipe técnica terceira para substituição do selo mecânico da bomba B2.', 'MEDIA', 'cat-op', 'Rotina Operacional', '#C76B4A', 'BLOQUEADA', 'UMA_VEZ', '[{"id":"req-104-1","tipo":"ARQUIVO","titulo":"Ordem de Serviço do Prestador Assinada (PDF/DOC)","instrucoes":"Anexe o comprovante de execução fornecido pelo técnico","obrigatorio":true},{"id":"req-104-2","tipo":"OPCAO","titulo":"Parecer do Funcionamento pós-reparo","instrucoes":"Selecione a situação final do equipamento","obrigatorio":true,"opcoes":["Em pleno funcionamento (Sem ruídos)","Funcionando com ressalvas","Necessita nova intervenção"]}]'::jsonb, NULL, NULL, NULL, NULL, '{}', 'Prestador de serviço terceirizado (HidroTec) não compareceu no horário agendado por falta de peça de reposição. Reagendado para amanhã às 10h.', '2026-08-31T16:30:00Z', '{}'::jsonb, '2026-08-31T09:00:00Z', '2026-08-31T16:30:00Z'),
('os-105', 'OS #000154', 'Conferência de Inventário Semanal de Carnes e Hortifruti', 'user-lider-sp', 'Mariana Costa', 'Gerente de Unidade', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', '2026-08-31', '06:00', '2026-08-31T09:30:00', 'Contagem cega de todos os itens da curva A de perecíveis e input das divergências no sistema.', 'ALTA', 'cat-est', 'Gestão de Estoque', '#5B7DBE', 'CONCLUIDA', 'SEMANAL', '[{"id":"req-105-1","tipo":"CHECKLIST","titulo":"Conferência de Grupos","obrigatorio":true,"checklist_itens":[{"id":"c1","texto":"Contagem de Carnes Bovinas e Aves","concluido":true},{"id":"c2","texto":"Contagem de Laticínios e Embutidos","concluido":true},{"id":"c3","texto":"Pesagem de Hortifruti","concluido":true},{"id":"c4","texto":"Validação de datas de validade (PVPS)","concluido":true}]},{"id":"req-105-2","tipo":"NUMERO","titulo":"Acuracidade Apurada (%)","unidade_medida":"%","obrigatorio":true},{"id":"req-105-3","tipo":"FOTO","titulo":"Foto da Folha de Contagem com Assinatura","obrigatorio":true}]'::jsonb, '2026-08-31T06:10:00Z', '2026-08-31T08:45:00Z', 155, 'Inventário realizado com sucesso. Acuracidade de 99.2% na contagem física vs contábil. Divergência mínima em 2kg de queijo muçarela devidamente justificada por quebra operacional.', '[{"requisito_id":"req-105-1","tipo":"CHECKLIST","checklist_concluidos":["c1","c2","c3","c4"],"data_registro":"2026-08-31T08:40:00Z"},{"requisito_id":"req-105-2","tipo":"NUMERO","valor_numero":99.2,"unidade_medida":"%","data_registro":"2026-08-31T08:42:00Z"},{"requisito_id":"req-105-3","tipo":"FOTO","foto_url":"https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80","data_registro":"2026-08-31T08:45:00Z"}]'::jsonb, NULL, NULL, '{}'::jsonb, '2026-08-30T10:00:00Z', '2026-08-31T08:45:00Z'),
('os-106', 'OS #000155', 'Revisão das Escalas de Turno e Fechamento de Ponto', 'user-lider-rj', 'Roberto Almeida', 'Supervisor Operacional', 'unit-rj-01', 'Unidade Rio de Janeiro - Barra da Tijuca', '2026-09-02', '10:00', '2026-09-02T16:00:00', 'Conferir atestados, lançar justificativas de ausência e validar escala do próximo fim de semana.', 'MEDIA', 'cat-adm', 'Administrativo & RH', '#8B6B4A', 'PROGRAMADA', 'SEMANAL', '[{"id":"req-106-1","tipo":"SIMPLES","titulo":"Confirmação de Validação no Sistema de RH","instrucoes":"Marcar após salvar as escalas no portal do RH","obrigatorio":true},{"id":"req-106-2","tipo":"TEXTO","titulo":"Relatório de Afastamentos / Substituições","obrigatorio":false}]'::jsonb, NULL, NULL, NULL, NULL, '{}', NULL, NULL, '{}'::jsonb, '2026-09-01T07:00:00Z', '2026-09-01T07:00:00Z'),
('os-107', 'OS #000156', 'Auditoria de Boas Práticas e Higiene no Manipulador', 'user-lider-mg', 'Fernanda Lima', 'Líder de Turno', 'unit-mg-01', 'Unidade Belo Horizonte - Savassi', '2026-09-01', '13:30', '2026-09-01T15:30:00', 'Avaliar uso de toucas, luvas, unhas aparadas, assepsia das mãos e higienização das bancadas.', 'ALTA', 'cat-qual', 'Qualidade & Auditoria', '#355C7D', 'PROGRAMADA', 'PERSONALIZADA', '[{"id":"req-107-1","tipo":"CHECKLIST","titulo":"Checklist Rápido de Higiene","obrigatorio":true,"checklist_itens":[{"id":"h1","texto":"Uso integral de touca e calçado de segurança","concluido":false},{"id":"h2","texto":"Sabonete bactericida e papel toalha abastecidos","concluido":false},{"id":"h3","texto":"Álcool 70% disponível em todos os postos de manipulação","concluido":false}]}]'::jsonb, NULL, NULL, NULL, NULL, '{}', NULL, NULL, '{"dias_semana":[1,3,5],"horario_custom":"13:30"}'::jsonb, '2026-09-01T07:00:00Z', '2026-09-01T07:00:00Z'),
('os-108', 'OS #000157', 'Sanitização e Desinfecção Periódica do Depósito Central', 'user-lider-sp', 'Mariana Costa', 'Gerente de Unidade', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', '2026-09-01', '14:00', '2026-09-01T18:00:00', 'Sanitização geral das prateleiras, pallets e pisos do estoque seco com solução homologada.', 'ALTA', 'cat-qual', 'Qualidade & Auditoria', '#355C7D', 'AGUARDANDO_VALIDACAO', 'MENSAL', '[{"id":"req-108-1","tipo":"CHECKLIST","titulo":"Checklist de Sanitização do Depósito","obrigatorio":true,"checklist_itens":[{"id":"s1","texto":"Varrição e recolhimento de resíduos em todos os corredores","concluido":true},{"id":"s2","texto":"Aplicação de desinfetante hospitalar nas prateleiras inferiores","concluido":true},{"id":"s3","texto":"Verificação de ausência de poças e umidade excessiva","concluido":true}]},{"id":"req-108-2","tipo":"FOTO","titulo":"Registro Fotográfico do Corredor Principal pós-limpeza","obrigatorio":true}]'::jsonb, '2026-09-01T14:10:00Z', '2026-09-01T16:45:00Z', 155, 'Sanitização concluída em todos os corredores A, B e C. Fotos das áreas limpas registradas.', '[{"requisito_id":"req-108-1","tipo":"CHECKLIST","checklist_concluidos":["s1","s2","s3"],"data_registro":"2026-09-01T16:40:00Z"},{"requisito_id":"req-108-2","tipo":"FOTO","foto_url":"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80","data_registro":"2026-09-01T16:44:00Z"}]'::jsonb, NULL, NULL, '{}'::jsonb, '2026-09-01T07:00:00Z', '2026-09-01T16:45:00Z')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

-- 8. METAS (13 registros)
INSERT INTO public.metas (id, indicador, meta_valor, valor_atual, unidade_medida, tipo_periodo, periodo, data_inicio, data_fim, unidade_id, unidade_nome, lider_id, lider_nome, direcao_melhor, descricao, status, created_at, updated_at) VALUES
('meta-m-01', 'Produção', 15000, 13850, 'unidades', 'MENSAL', 'Agosto / 2026', '2026-08-01', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Volume de produção líquida e expedição padrão da unidade de São Paulo.', 'EM_ANDAMENTO', '2026-08-01T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-m-02', 'Atendimento', 1200, 1248, 'atendimentos', 'MENSAL', 'Agosto / 2026', '2026-08-01', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Volume total de atendimentos concluídos com avaliação positiva na unidade.', 'ATINGIDA', '2026-08-01T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-m-03', 'Qualidade', 98, 95, '%', 'MENSAL', 'Agosto / 2026', '2026-08-01', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Acuracidade técnica e conformidade nas auditorias de qualidade.', 'EM_ANDAMENTO', '2026-08-01T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-m-04', 'Absenteísmo', 1.5, 0.8, '%', 'MENSAL', 'Agosto / 2026', '2026-08-01', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MENOR_MELHOR', 'Taxa máxima aceitável de faltas não programadas (menor é melhor).', 'ATINGIDA', '2026-08-01T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-m-05', 'Faturamento Líquido', 350000, 322000, 'R\$', 'MENSAL', 'Agosto / 2026', '2026-08-01', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Meta financeira de faturamento bruto operacional da filial.', 'EM_ANDAMENTO', '2026-08-01T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-s-01', 'Execução de OS Preventivas', 30, 28, 'OS', 'SEMANAL', 'Semana 35 (25/08 a 31/08)', '2026-08-25', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Cumprimento de 100% dos checklists e vistorias programadas na semana.', 'EM_ANDAMENTO', '2026-08-25T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-s-02', 'Volume de Produção Semanal', 3500, 3220, 'unidades', 'SEMANAL', 'Semana 35 (25/08 a 31/08)', '2026-08-25', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Entrega semanal de kits montados e expedidos no prazo.', 'EM_ANDAMENTO', '2026-08-25T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-s-03', 'Conformidade de Higiene & Vistoria', 98, 94, '%', 'SEMANAL', 'Semana 35 (25/08 a 31/08)', '2026-08-25', '2026-08-31', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Conformidade dos 4 postos de manipulação e câmara fria.', 'EM_ANDAMENTO', '2026-08-25T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-s-04', 'Índice de Perda de Insumos / Quebra', 1.5, 1.2, '%', 'SEMANAL', 'Semana 35 (25/08 a 31/08)', '2026-08-25', '2026-08-31', 'unit-rj-01', 'Unidade Rio de Janeiro - Barra da Tijuca', 'user-lider-rj', 'Roberto Almeida', 'MENOR_MELHOR', 'Redução de sobras e desperdícios no manuseio diário.', 'ATINGIDA', '2026-08-25T00:00:00Z', '2026-08-31T18:00:00Z'),
('meta-d-01', 'Atendimentos no Dia', 450, 420, 'atendimentos', 'DIARIA', '01/09/2026', '2026-09-01', '2026-09-01', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Capacidade de atendimento no balcão e drive da loja principal.', 'EM_ANDAMENTO', '2026-09-01T06:00:00Z', '2026-09-01T15:00:00Z'),
('meta-d-02', 'Auditoria de Abertura & Caixa', 100, 100, '%', 'DIARIA', '01/09/2026', '2026-09-01', '2026-09-01', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Conferência de fundo de troco e checklist de abertura antes das 08h.', 'ATINGIDA', '2026-09-01T06:00:00Z', '2026-09-01T08:00:00Z'),
('meta-d-03', 'Vendas Diárias Balcão', 12000, 8500, 'R\$', 'DIARIA', '01/09/2026', '2026-09-01', '2026-09-01', 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'MAIOR_MELHOR', 'Meta diária de faturamento do turno matutino e vespertino.', 'EM_ANDAMENTO', '2026-09-01T06:00:00Z', '2026-09-01T15:00:00Z'),
('meta-d-04', 'Tempo Médio de Atendimento (TMA)', 15, 12, 'minutos', 'DIARIA', '01/09/2026', '2026-09-01', '2026-09-01', 'unit-rj-01', 'Unidade Rio de Janeiro - Barra da Tijuca', 'user-lider-rj', 'Roberto Almeida', 'MENOR_MELHOR', 'Tempo máximo por cliente atendido (menor é melhor).', 'ATINGIDA', '2026-09-01T06:00:00Z', '2026-09-01T15:00:00Z')
ON CONFLICT (id) DO UPDATE SET valor_atual = EXCLUDED.valor_atual, status = EXCLUDED.status;

-- 9. RELATORIOS (5 registros)
INSERT INTO public.relatorios (id, titulo, tipo, periodo, data_publicacao, publicado, publico_tipo, unidades_alvo, descricao, arquivo_pdf_nome, arquivo_pdf_url, arquivo_pdf_tamanho, arquivo_pdf_conteudo, total_leituras, confirmacoes_leitura, leitores_confirmados, created_at, updated_at) VALUES
('rel-m-01', 'Relatório Executivo Consolidado de Resultados - Agosto/2026', 'MENSAL', 'Agosto / 2026', '2026-08-31', TRUE, 'TODOS', '{}', 'Demonstrativo corporativo de desempenho por unidade: faturamento total, taxa de entrega de OS no prazo, ranking de NPS e absenteísmo por regional.', 'Relatorio_Executivo_Resultados_Agosto_2026.pdf', 'https://example.com/relatorios/executivo-agosto-2026.pdf', '3.4 MB', '# CENTRAL DO LÍDER — RELATÓRIO EXECUTIVO MENSAL
## Período de Referência: Agosto / 2026 • Publicação: 31/08/2026

### 1. SUMÁRIO EXECUTIVO
No mês de Agosto de 2026, a rede atingiu **97.8% de conformidade operacional**, com 1.420 Ordens de Serviço (OS) concluídas no prazo pactuado. As metas de faturamento e índice de resolução rápida registraram expansão de 4.2% em relação a Julho.

### 2. PRINCIPAIS INDICADORES CONSOLIDADOS
- **Produção Global:** 54.200 unidades (98.5% da meta consolidada de 55.000)
- **SLA Médio de OS:** 96.4% de entregas no prazo estipulado
- **NPS Geral de Atendimento:** 89 pontos (Zona de Excelência)
- **Índice Médio de Absenteísmo:** 1.1% (Abaixo do teto crítico de 1.8%)
- **Faturamento Total Rede:** R\$ 1.480.000,00

### 3. DESTAQUES POR UNIDADE OPERACIONAL
- **São Paulo (Pinheiros):** Líder em volume de produção (13.850 un) e eficiência de abertura.
- **Rio de Janeiro (Barra):** Menor tempo médio de atendimento (12 min) e zero acidentes de trabalho.
- **Belo Horizonte (Savassi):** 100% de acuracidade nas auditorias sanitárias de manipulação.
- **Curitiba (Batel):** Conclusão da fase de integração com novo gestor.

### 4. DIRETRIZES PARA O PRÓXIMO MÊS (SETEMBRO/2026)
1. Foco na redução de desperdício em câmaras frigoríficas.
2. Reforço no preenchimento de evidências fotográficas das OS críticas.
3. Participação obrigatória no alinhamento semanal com a Diretoria.', 2, '[{"usuario_id":"user-lider-sp","usuario_nome":"Mariana Costa","usuario_cargo":"Gerente de Unidade","unidade_nome":"Unidade São Paulo - Matriz Pinheiros","data_hora":"2026-08-31T19:30:00Z"}]'::jsonb, '{"user-lider-sp"}', '2026-08-31T18:00:00Z', '2026-08-31T19:30:00Z'),
('rel-m-02', 'Manual de Diretrizes Operacionais e Procedimentos Padrão Q3/2026', 'MENSAL', '3º Trimestre 2026 (Jul-Set)', '2026-08-27', TRUE, 'TODOS', '{}', 'Atualização do Manual de Boas Práticas, regras de conservação de insumos, protocolo de segurança predial e rotinas de abertura/fechamento.', 'Manual_Diretrizes_Operacionais_Q3_2026.pdf', 'https://example.com/relatorios/manual-operacional-q3-2026.pdf', '5.1 MB', '# MANUAL DE DIRETRIZES OPERACIONAIS — Q3/2026
## Procedimento Operacional Padrão (POP) • Central do Líder

### 1. PROTOCOLOS DE ABERTURA E FECHAMENTO
- Abertura de caixa deve ser executada pontualmente às 07h30 com contagem cega do fundo de troco.
- Teste de temperatura das câmaras deve ser registrado imediatamente na Ordem de Serviço com foto do termômetro.

### 2. GESTÃO DE IMPEDIMENTOS E BLOQUEIOS
- Qualquer parada operacional por falha técnica de terceiros ou falta de insumos deve ser sinalizada via botão "Reportar Bloqueio" em até 15 minutos do ocorrido.
- A administração receberá notificação em tempo real para acionamento de contingência.

### 3. AUDITORIAS DE QUALIDADE E CONFORMIDADE
- Todo checklist concluído exige evidência comprobatória conforme modalidade cadastrada.', 3, '[{"usuario_id":"user-lider-sp","usuario_nome":"Mariana Costa","usuario_cargo":"Gerente de Unidade","unidade_nome":"Unidade São Paulo - Matriz Pinheiros","data_hora":"2026-08-27T10:32:00Z"},{"usuario_id":"user-lider-rj","usuario_nome":"Roberto Almeida","usuario_cargo":"Supervisor Operacional","unidade_nome":"Unidade Rio de Janeiro - Barra da Tijuca","data_hora":"2026-08-28T09:15:00Z"}]'::jsonb, '{"user-lider-sp","user-lider-rj"}', '2026-08-27T08:00:00Z', '2026-08-28T09:15:00Z'),
('rel-s-01', 'Auditoria Semanal de Perecíveis e Gestão de Perdas (Semana 35)', 'SEMANAL', 'Semana 35 (25/08 a 31/08)', '2026-08-31', TRUE, 'UNIDADES', '{"unit-sp-01"}', 'Balanço semanal de inventários rotativos, conferência de PVPS (Primeiro que Vence, Primeiro que Sai) e laudo de quebras por setor.', 'Auditoria_Pereciveis_Semana_35.pdf', 'https://example.com/relatorios/auditoria-pereciveis-s35.pdf', '1.8 MB', '# AUDITORIA SEMANAL DE PERECÍVEIS — SEMANA 35
## Relatório de Perdas e Controle de Validades • 31/08/2026

### 1. BALANÇO DE INVENTÁRIO
- Acuracidade média de contagem física vs contábil: **99.1%**
- Lote de queijo muçarela e frios auditado sem inconformidades de temperatura.

### 2. AÇÕES CORRETIVAS
- Reforçar etiquetagem de data de abertura em todos os recipientes de fracionamento.', 1, '{}', '{}', '2026-08-31T17:00:00Z', '2026-08-31T17:00:00Z'),
('rel-rj-01', 'Relatório Operacional Regional - Rio de Janeiro (Semana 35)', 'SEMANAL', 'Semana 35 (25/08 a 31/08)', '2026-08-31', TRUE, 'UNIDADES', '{"unit-rj-01"}', 'Acompanhamento de custos e metas operacionais exclusivas da regional Barra da Tijuca.', 'Relatorio_Operacional_RJ_S35.pdf', '#', '1.4 MB', '# RELATÓRIO OPERACIONAL - REGIONAL RIO DE JANEIRO
## Unidade Barra da Tijuca

- Cumprimento de metas de produção em 94%.
- Foco em redução do índice de quebra operacional.', 0, '{}', '{}', '2026-08-31T17:30:00Z', '2026-08-31T17:30:00Z'),
('rel-d-01', 'Fechamento Operacional Diário & Balanço de Caixa - 01/09/2026', 'DIARIO', '01/09/2026', '2026-09-01', TRUE, 'TODOS', '{}', 'Resumo das operações matutinas, faturamento de balcão e status das ordens de serviço preventivas do dia.', 'Fechamento_Diario_01_09_2026.pdf', 'https://example.com/relatorios/fechamento-diario-01-09.pdf', '1.2 MB', '# FECHAMENTO OPERACIONAL DIÁRIO — 01/09/2026
## Boletim Matutino de Operações

- Abertura de caixas concluída em 100% das filiais.
- 18 OS preventivas executadas dentro do horário estipulado.
- Nenhuma intercorrência grave reportada na rede.', 0, '{}', '{}', '2026-09-01T12:00:00Z', '2026-09-01T12:00:00Z')
ON CONFLICT (id) DO UPDATE SET publicado = EXCLUDED.publicado, total_leituras = EXCLUDED.total_leituras;

-- 10. CALENDARIO_EVENTOS (6 registros)
INSERT INTO public.calendario_eventos (id, titulo, tipo, data, horario_inicio, horario_fim, dia_inteiro, unidade_id, unidade_nome, lider_id, lider_nome, publico_tipo, unidades_alvo, descricao, local, link_reuniao, criado_por_nome, status, created_at) VALUES
('evt-01', 'Alinhamento Semanal de Líderes com Diretoria', 'REUNIAO', '2026-09-03', '09:00', '10:30', FALSE, NULL, NULL, NULL, NULL, 'TODOS', '{}', 'Apresentação dos resultados consolidados de agosto, análise do SLA de Ordens de Serviço e alinhamento das prioridades estratégicas de setembro.', 'Google Meet (Sala Executiva)', 'https://meet.google.com/cdl-exec-2026', 'Carlos Eduardo Ramos (Admin)', 'AGENDADO', '2026-09-01T07:00:00Z'),
('evt-02', 'Treinamento: Boas Práticas e Controle de Câmaras Frias', 'TREINAMENTO', '2026-09-02', '14:00', '16:00', FALSE, NULL, NULL, NULL, NULL, 'TODOS', '{}', 'Capacitação técnica para líderes de turno sobre aferição calibrada de temperatura, registro fotográfico em OS e prevenção de perdas.', 'Ambiente Virtual de Aprendizagem / Meet', 'https://meet.google.com/cdl-treinamento-qualidade', 'Carlos Eduardo Ramos (Admin)', 'AGENDADO', '2026-09-01T07:00:00Z'),
('evt-03', 'Comunicado Geral: Inventário Rotativo Quadrimestral Q3', 'COMUNICADO', '2026-09-01', '08:00', '18:00', TRUE, NULL, NULL, NULL, NULL, 'TODOS', '{}', 'Atenção a todos os líderes: liberação das contagens físicas de estoque e sincronização cega via sistema até as 18h.', 'Todas as Filiais', NULL, 'Carlos Eduardo Ramos (Admin)', 'EM_ANDAMENTO', '2026-09-01T06:00:00Z'),
('evt-04', 'Auditoria Externa de Vigilância Sanitária & Laudos', 'EVENTO', '2026-09-04', '14:00', '17:00', FALSE, 'unit-sp-01', 'Unidade São Paulo - Matriz Pinheiros', 'user-lider-sp', 'Mariana Costa', 'UNIDADES', '{}', 'Acompanhar fiscalização sanitária municipal e apresentar pastas de laudos físicos e ordens de serviço preventivas.', 'Unidade SP Matriz - Pinheiros', NULL, 'Carlos Eduardo Ramos (Admin)', 'AGENDADO', '2026-09-01T07:00:00Z'),
('evt-05', 'Reunião de Fechamento de Metas - Regional Sudeste', 'REUNIAO', '2026-09-05', '10:00', '11:30', FALSE, NULL, NULL, NULL, NULL, 'UNIDADES', '{"unit-sp-01","unit-rj-01","unit-mg-01"}', 'Reunião regional para acompanhamento das metas de atendimento balcão e índice de absenteísmo.', 'Google Meet', 'https://meet.google.com/cdl-sudeste-metas', 'Carlos Eduardo Ramos (Admin)', 'AGENDADO', '2026-09-01T07:00:00Z'),
('evt-rj-01', 'Vistoria Predial & Alinhamento de Escala - Regional RJ', 'EVENTO', '2026-09-06', '10:00', '12:00', FALSE, 'unit-rj-01', 'Unidade Rio de Janeiro - Barra da Tijuca', 'user-lider-rj', 'Roberto Almeida', 'UNIDADES', '{"unit-rj-01"}', 'Acompanhamento do cronograma de manutenções e calibração de balanças na Barra da Tijuca.', 'Unidade Barra da Tijuca - RJ', NULL, 'Carlos Eduardo Ramos (Admin)', 'AGENDADO', '2026-09-01T08:00:00Z')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, titulo = EXCLUDED.titulo;

-- 11. COMENTARIOS (6 registros)
INSERT INTO public.comentarios (id, autor_id, autor_nome, autor_role, autor_avatar, texto, item_tipo, item_id, created_at) VALUES
('com-01', 'user-admin-01', 'Carlos Eduardo Ramos (Admin)', 'ADMINISTRADOR', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Mariana, priorize a verificação do extintor da cozinha central antes da vistoria de sexta-feira.', 'TAREFA', 'os-102', '2026-09-01T07:30:00Z'),
('com-02', 'user-lider-sp', 'Mariana Costa', 'LIDER', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Perfeito, Carlos! Já aloquei o técnico responsável para realizar a conferência dos lacres logo às 08h.', 'TAREFA', 'os-102', '2026-09-01T07:45:00Z'),
('com-03', 'user-lider-sp', 'Mariana Costa', 'LIDER', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Todas as pastas físicas de laudos bacteriológicos já foram impressas e organizadas na recepção da gerência.', 'EVENTO', 'evt-04', '2026-09-01T08:15:00Z'),
('com-04', 'user-admin-01', 'Carlos Eduardo Ramos (Admin)', 'ADMINISTRADOR', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Excelente preparo, Mariana. Qualquer solicitação adicional do fiscal durante a tarde, favor reportar de imediato.', 'EVENTO', 'evt-04', '2026-09-01T08:30:00Z'),
('com-05', 'user-lider-sp', 'Mariana Costa', 'LIDER', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Estamos com 92% da meta atingida neste fechamento parcial. A equipe está focada na expedição da tarde.', 'META', 'meta-m-01', '2026-09-01T08:00:00Z'),
('com-06', 'user-lider-sp', 'Mariana Costa', 'LIDER', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Relatório lido e revisado com os supervisores de turno. As novas diretrizes de abertura já entraram em vigor.', 'RELATORIO', 'rel-m-01', '2026-09-01T08:20:00Z')
ON CONFLICT (id) DO NOTHING;

-- 12. NOTIFICACOES (2 registros)
INSERT INTO public.notificacoes (id, usuario_id, tipo, titulo, texto, lida, link_acao, created_at) VALUES
('notif-01', 'user-lider-sp', 'OS_ATRIBUIDA', 'Nova Ordem de Serviço Atribuída', 'A OS-2026-0892 (Vistoria Mensal de Extintores) foi vinculada à sua unidade.', FALSE, '/tarefas', '2026-09-01T07:00:00Z'),
('notif-02', 'user-lider-sp', 'RELATORIO_PUBLICADO', 'Novo Relatório Disponível', 'Diretrizes Operacionais Q3/2026 foi publicado para leitura obrigatória.', FALSE, '/relatorios', '2026-09-01T06:00:00Z')
ON CONFLICT (id) DO NOTHING;
`;

export interface SeedResult {
  success: boolean;
  inserted: {
    unidades: number;
    categorias: number;
    usuarios: number;
    lideres: number;
    tipos_calendario: number;
    tipos_auditoria: number;
    tarefas_os: number;
    metas: number;
    relatorios: number;
    calendario_eventos: number;
    comentarios: number;
    notificacoes: number;
  };
  totalInserted: number;
  errors: string[];
}

export async function seedSupabaseFromBackup(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    inserted: {
      unidades: 0,
      categorias: 0,
      usuarios: 0,
      lideres: 0,
      tipos_calendario: 0,
      tipos_auditoria: 0,
      tarefas_os: 0,
      metas: 0,
      relatorios: 0,
      calendario_eventos: 0,
      comentarios: 0,
      notificacoes: 0,
    },
    totalInserted: 0,
    errors: [],
  };

  if (!supabase) {
    result.success = false;
    result.errors.push('Supabase client não configurado');
    return result;
  }

  return result;
}
