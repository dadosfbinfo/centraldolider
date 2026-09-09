import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { TarefaOS, TaskPriority } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
  Check,
  HelpCircle,
  FileText
} from 'lucide-react';

interface TaskImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

interface ParsedTaskRow {
  numero_os?: string;
  titulo: string;
  tipo_operacao?: string;
  prioridade: TaskPriority;
  projeto?: string;
  responsavel?: string;
  validadores?: string;
  data: string;
  horario?: string;
  prazo?: string;
  categoria?: string;
  recorrencia?: string;
  exigencia_conclusao?: string;
  checklist_itens_texto?: string;
  descricao?: string;
  isValid: boolean;
  validationError?: string;
}

const LAST_TASK_IMPORT_KEY = 'cdl_last_task_import_ids';

export const TaskImportModal: React.FC<TaskImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTaskRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastImportBatch, setLastImportBatch] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LAST_TASK_IMPORT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [undoMessage, setUndoMessage] = useState<string>('');

  if (!isOpen) return null;

  // Download Sample XLSX Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Número OS (Opcional)': '',
        'Título da Tarefa *': 'Auditoria de Abertura de Loja e Caixa',
        'Tipo da Operação': 'Rotina Operacional',
        'Prioridade (BAIXA, MEDIA, ALTA, CRITICA)': 'ALTA',
        'Categoria': 'Rotina Operacional',
        'Projeto(s) (Nomes ou Códigos separados por vírgula)': 'Unidade São Paulo - Matriz Pinheiros, Unidade Rio de Janeiro - Barra da Tijuca',
        'Líder(es) Responsável(eis) (E-mails ou Nomes separados por vírgula)': 'mariana.costa@centraldolider.com.br, roberto.almeida@centraldolider.com.br',
        'Validador(es) Gestor(es) (E-mails ou Nomes separados por vírgula)': 'admin@centraldolider.com.br',
        'Data (YYYY-MM-DD) *': new Date().toISOString().split('T')[0],
        'Horário (HH:mm)': '08:00',
        'Prazo (YYYY-MM-DD)': new Date(Date.now() + 86400000).toISOString().split('T')[0],
        'Recorrência (UMA_VEZ, DIARIA, DIAS_UTEIS, SEMANAL, MENSAL)': 'UMA_VEZ',
        'Exigência Conclusão (CHECKLIST, FOTO, TEXTO, NUMERO, ARQUIVO, SIMPLES)': 'CHECKLIST',
        'Itens do Checklist (separados por ponto e vírgula ;)': 'Conferir numerário em caixa; Verificar itens de segurança e alarme; Checar escala de operadores',
        'Descrição': 'Conferir numerário em caixa e itens de segurança antes da abertura oficial das portas.',
      },
      {
        'Número OS (Opcional)': '',
        'Título da Tarefa *': 'Inspeção Semanal de Extintores e Iluminação',
        'Tipo da Operação': 'Preventiva',
        'Prioridade (BAIXA, MEDIA, ALTA, CRITICA)': 'MEDIA',
        'Categoria': 'Segurança & Saúde',
        'Projeto(s) (Nomes ou Códigos separados por vírgula)': 'Unidade Rio de Janeiro - Barra da Tijuca',
        'Líder(es) Responsável(eis) (E-mails ou Nomes separados por vírgula)': 'roberto.almeida@centraldolider.com.br',
        'Validador(es) Gestor(es) (E-mails ou Nomes separados por vírgula)': 'admin@centraldolider.com.br',
        'Data (YYYY-MM-DD) *': new Date().toISOString().split('T')[0],
        'Horário (HH:mm)': '10:30',
        'Prazo (YYYY-MM-DD)': new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        'Recorrência (UMA_VEZ, DIARIA, DIAS_UTEIS, SEMANAL, MENSAL)': 'SEMANAL',
        'Exigência Conclusão (CHECKLIST, FOTO, TEXTO, NUMERO, ARQUIVO, SIMPLES)': 'FOTO',
        'Itens do Checklist (separados por ponto e vírgula ;)': '',
        'Descrição': 'Verificar lacres e manômetros de todos os extintores do piso e fotografar o painel.',
      },
      {
        'Número OS (Opcional)': '',
        'Título da Tarefa *': 'Inventário Físico Rotativo de Estoque',
        'Tipo da Operação': 'Auditoria',
        'Prioridade (BAIXA, MEDIA, ALTA, CRITICA)': 'CRITICA',
        'Categoria': 'Gestão de Estoque',
        'Projeto(s) (Nomes ou Códigos separados por vírgula)': 'Unidade São Paulo - Matriz Pinheiros',
        'Líder(es) Responsável(eis) (E-mails ou Nomes separados por vírgula)': 'mariana.costa@centraldolider.com.br',
        'Validador(es) Gestor(es) (E-mails ou Nomes separados por vírgula)': 'admin@centraldolider.com.br',
        'Data (YYYY-MM-DD) *': new Date().toISOString().split('T')[0],
        'Horário (HH:mm)': '16:00',
        'Prazo (YYYY-MM-DD)': new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        'Recorrência (UMA_VEZ, DIARIA, DIAS_UTEIS, SEMANAL, MENSAL)': 'MENSAL',
        'Exigência Conclusão (CHECKLIST, FOTO, TEXTO, NUMERO, ARQUIVO, SIMPLES)': 'NUMERO',
        'Itens do Checklist (separados por ponto e vírgula ;)': '',
        'Descrição': 'Contagem de SKUs de alto giro na câmara fria e lançamento de divergências.',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo_Tarefas_OS');
    XLSX.writeFile(workbook, 'modelo_importacao_tarefas_central_lider.xlsx');
  };

  // Handle File Upload & Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setErrorMessage('A planilha está vazia ou não contém dados na primeira aba.');
          setIsProcessing(false);
          return;
        }

        const validPriorities: TaskPriority[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

        const formatExcelDate = (val: any) => {
          if (!val) return '';
          if (typeof val === 'number') {
            const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
            return jsDate.toISOString().split('T')[0];
          }
          return String(val).trim();
        };

        const parsed: ParsedTaskRow[] = rawJson.map((row: any) => {
          // Normalize column headers
          const numero_os = (
            row['Número OS (Opcional)'] ||
            row['Número OS'] ||
            row['Numero OS'] ||
            row['Código OS'] ||
            row['Codigo OS'] ||
            row['OS'] ||
            ''
          ).toString().trim();

          const titulo =
            row['Título da Tarefa *'] ||
            row['Título da Tarefa'] ||
            row['Titulo'] ||
            row['Título'] ||
            row['Nome'] ||
            row['Nome da Tarefa'] ||
            '';

          const tipo_operacao =
            row['Tipo da Operação'] ||
            row['Tipo de Operação'] ||
            row['Tipo Operacao'] ||
            row['Operação'] ||
            'Rotina Operacional';

          let prioridadeRaw = (
            row['Prioridade (BAIXA, MEDIA, ALTA, CRITICA)'] ||
            row['Prioridade'] ||
            'MEDIA'
          )
            .toString()
            .toUpperCase()
            .trim();

          let prioridade: TaskPriority = 'MEDIA';
          if (validPriorities.includes(prioridadeRaw as TaskPriority)) {
            prioridade = prioridadeRaw as TaskPriority;
          }

          const projeto =
            row['Projeto(s) (Nomes ou Códigos separados por vírgula)'] ||
            row['Projeto(s)'] ||
            row['Projetos'] ||
            row['Projeto'] ||
            row['Unidade(s)'] ||
            row['Unidades'] ||
            row['Unidade'] ||
            row['Projeto/Unidade'] ||
            '';

          const responsavel =
            row['Líder(es) Responsável(eis) (E-mails ou Nomes separados por vírgula)'] ||
            row['Líder(es) Responsável(eis)'] ||
            row['Líderes Responsáveis'] ||
            row['Líder Responsável (E-mail ou Nome)'] ||
            row['Responsável (E-mail ou Nome)'] ||
            row['Responsável'] ||
            row['Responsáveis'] ||
            row['Líder'] ||
            row['Lider'] ||
            '';

          const validadores =
            row['Validador(es) Gestor(es) (E-mails ou Nomes separados por vírgula)'] ||
            row['Validador(es)'] ||
            row['Validadores'] ||
            row['Gestores Validadores'] ||
            row['Gestor Validador'] ||
            row['Aprovadores'] ||
            '';

          let data = formatExcelDate(
            row['Data (YYYY-MM-DD) *'] ||
            row['Data (YYYY-MM-DD)'] ||
            row['Data'] ||
            new Date().toISOString().split('T')[0]
          );

          const horario = (
            row['Horário (HH:mm)'] ||
            row['Horario'] ||
            row['Horário'] ||
            row['Hora'] ||
            '08:00'
          ).toString().trim();

          const prazo = formatExcelDate(
            row['Prazo (YYYY-MM-DD)'] ||
            row['Prazo Limite'] ||
            row['Prazo'] ||
            ''
          );

          const categoria =
            row['Categoria'] ||
            row['Categoria da OS'] ||
            row['Tipo de Categoria'] ||
            'Rotina Operacional';

          const recorrencia =
            row['Recorrência (UMA_VEZ, DIARIA, DIAS_UTEIS, SEMANAL, MENSAL)'] ||
            row['Recorrência'] ||
            row['Recorrencia'] ||
            'UMA_VEZ';

          const exigencia_conclusao =
            row['Exigência Conclusão (CHECKLIST, FOTO, TEXTO, NUMERO, ARQUIVO, SIMPLES)'] ||
            row['Exigência Conclusão'] ||
            row['Exigência'] ||
            row['Exigencia'] ||
            row['Tipo de Evidência'] ||
            'CHECKLIST';

          const checklist_itens_texto = (
            row['Itens do Checklist (separados por ponto e vírgula ;)'] ||
            row['Itens do Checklist'] ||
            row['Checklist'] ||
            ''
          ).toString().trim();

          const descricao =
            row['Descrição'] ||
            row['Descricao'] ||
            row['Instruções'] ||
            row['Observações'] ||
            '';

          let isValid = true;
          let validationError = '';

          if (!titulo) {
            isValid = false;
            validationError = 'Título da tarefa é obrigatório.';
          } else if (!data || data.length < 8) {
            isValid = false;
            validationError = 'Data inválida.';
          }

          return {
            numero_os: numero_os || undefined,
            titulo,
            tipo_operacao,
            prioridade,
            projeto,
            responsavel,
            validadores,
            data,
            horario,
            prazo,
            categoria,
            recorrencia,
            exigencia_conclusao,
            checklist_itens_texto,
            descricao,
            isValid,
            validationError,
          };
        });

        setParsedRows(parsed);
        setIsProcessing(false);
      } catch (err: any) {
        setErrorMessage('Erro ao ler arquivo Excel: ' + (err.message || 'Formato incompatível.'));
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Erro ao ler arquivo.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Commit Import to Database
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('Nenhuma linha válida para importar.');
      return;
    }

    const units = dbStore.getUnits();
    const categories = dbStore.getCategories();
    const leaders = dbStore.getLeaders();
    const users = dbStore.getUsers();

    const createdIds: string[] = [];

    validRows.forEach((row) => {
      // Resolve projects
      const projTokens = (row.projeto || '')
        .split(/[,;/]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const matchedProjIds: string[] = [];
      const matchedProjNomes: string[] = [];

      projTokens.forEach((tok) => {
        const found = units.find(
          (u) =>
            u.nome.toLowerCase().includes(tok.toLowerCase()) ||
            (u.codigo && u.codigo.toLowerCase() === tok.toLowerCase())
        );
        if (found) {
          if (!matchedProjIds.includes(found.id)) {
            matchedProjIds.push(found.id);
            matchedProjNomes.push(found.nome);
          }
        }
      });

      if (matchedProjIds.length === 0 && units.length > 0) {
        matchedProjIds.push(units[0].id);
        matchedProjNomes.push(units[0].nome);
      }

      // Resolve category
      const matchedCat = categories.find((c) =>
        c.nome.toLowerCase().includes((row.categoria || '').toLowerCase())
      ) || categories[0];

      // Resolve leaders
      const leaderTokens = (row.responsavel || '')
        .split(/[,;/]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const matchedLeaderIds: string[] = [];
      const matchedLeaderNomes: string[] = [];

      leaderTokens.forEach((tok) => {
        const found = leaders.find(
          (l) =>
            l.email.toLowerCase() === tok.toLowerCase() ||
            l.nome.toLowerCase().includes(tok.toLowerCase())
        );
        if (found) {
          const lId = found.usuario_id || found.id;
          if (!matchedLeaderIds.includes(lId)) {
            matchedLeaderIds.push(lId);
            matchedLeaderNomes.push(found.nome);
          }
        }
      });

      if (matchedLeaderIds.length === 0 && leaders.length > 0) {
        const defaultLeader = leaders[0];
        matchedLeaderIds.push(defaultLeader.usuario_id || defaultLeader.id);
        matchedLeaderNomes.push(defaultLeader.nome);
      }

      // Resolve validators
      const validatorTokens = (row.validadores || '')
        .split(/[,;/]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const matchedValIds: string[] = [];
      const matchedValNomes: string[] = [];

      validatorTokens.forEach((tok) => {
        const foundUser = users.find(
          (u) =>
            u.email.toLowerCase() === tok.toLowerCase() ||
            u.nome.toLowerCase().includes(tok.toLowerCase())
        );
        if (foundUser) {
          if (!matchedValIds.includes(foundUser.id)) {
            matchedValIds.push(foundUser.id);
            matchedValNomes.push(foundUser.nome);
          }
        }
      });

      // Requirement type mapping
      const reqTypeUpper = (row.exigencia_conclusao || 'CHECKLIST').toUpperCase().trim();
      let reqType: 'CHECKLIST' | 'FOTO' | 'TEXTO' | 'NUMERO' | 'ARQUIVO' | 'SIMPLES' = 'CHECKLIST';
      if (['FOTO', 'TEXTO', 'NUMERO', 'ARQUIVO', 'SIMPLES', 'CHECKLIST'].includes(reqTypeUpper)) {
        reqType = reqTypeUpper as any;
      }

      const reqId = 'req-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
      let requirementObj: any = {
        id: reqId,
        tipo: reqType,
        titulo:
          reqType === 'FOTO'
            ? 'Registro Fotográfico da Execução'
            : reqType === 'TEXTO'
            ? 'Relatório em Texto'
            : reqType === 'NUMERO'
            ? 'Valor Medido em Campo'
            : reqType === 'ARQUIVO'
            ? 'Anexo de Documento de Evidência'
            : reqType === 'SIMPLES'
            ? 'Confirmação de Conclusão Operacional'
            : 'Conferência Operacional Padrão',
        obrigatorio: true,
      };

      if (reqType === 'CHECKLIST') {
        const customItems = (row.checklist_itens_texto || '')
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);

        if (customItems.length > 0) {
          requirementObj.checklist_itens = customItems.map((itemText, cIdx) => ({
            id: `c-${cIdx + 1}`,
            texto: itemText,
            concluido: false,
          }));
        } else {
          requirementObj.checklist_itens = [
            { id: 'c1', texto: 'Verificação visual dos padrões operacionais', concluido: false },
            { id: 'c2', texto: 'Validação e registro em checklist', concluido: false },
          ];
        }
      }

      // Recurrence mapping
      const recUpper = (row.recorrencia || 'UMA_VEZ').toUpperCase().trim();
      let recorrencia: any = 'UMA_VEZ';
      if (['UMA_VEZ', 'DIARIA', 'DIAS_UTEIS', 'SEMANAL', 'MENSAL'].includes(recUpper)) {
        recorrencia = recUpper;
      }

      const created = dbStore.createTask({
        numero_os: row.numero_os || undefined,
        titulo: row.titulo,
        tipo_operacao: row.tipo_operacao || 'Rotina Operacional',
        prioridade: row.prioridade,
        categoria_id: matchedCat?.id || 'cat-op',
        categoria_nome: matchedCat?.nome || 'Operacional',
        categoria_cor: matchedCat?.cor || '#C76B4A',
        unidade_id: matchedProjIds[0],
        unidade: matchedProjNomes[0],
        projeto_id: matchedProjIds[0],
        projeto: matchedProjNomes[0],
        projetos_ids: matchedProjIds,
        projetos_nomes: matchedProjNomes,
        responsavel_id: matchedLeaderIds[0],
        responsavel_nome: matchedLeaderNomes[0],
        lideres_ids: matchedLeaderIds,
        lideres_nomes: matchedLeaderNomes,
        validadores_ids: matchedValIds,
        validadores_nomes: matchedValNomes,
        responsavel_cargo: 'Líder Operacional',
        data: row.data,
        horario: row.horario || '08:00',
        prazo: row.prazo || undefined,
        descricao: row.descricao || undefined,
        status: 'PROGRAMADA',
        recorrencia: recorrencia,
        requisitos_conclusao: [requirementObj],
      });

      if (created?.id) {
        createdIds.push(created.id);
      }
    });

    // Save batch for Undo
    localStorage.setItem(LAST_TASK_IMPORT_KEY, JSON.stringify(createdIds));
    setLastImportBatch(createdIds);

    onImportSuccess(validRows.length);
    onClose();
  };

  // Undo Last Import
  const handleUndoLastImport = () => {
    if (lastImportBatch.length === 0) return;

    if (
      window.confirm(
        `Deseja realmente desfazer a última importação e remover as ${lastImportBatch.length} tarefas criadas?`
      )
    ) {
      let removedCount = 0;
      lastImportBatch.forEach((taskId) => {
        try {
          dbStore.deleteTask(taskId);
          removedCount++;
        } catch {}
      });

      localStorage.removeItem(LAST_TASK_IMPORT_KEY);
      setLastImportBatch([]);
      setUndoMessage(`Importação desfeita com sucesso! ${removedCount} tarefas foram removidas.`);
      setTimeout(() => setUndoMessage(''), 5000);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-[#FCFAFA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#343A40]">Importar Tarefas / OS via Excel (.xlsx)</h2>
              <p className="text-xs text-gray-500">
                Cadastre ordens de serviço em lote com validação prévia e opção de desfazer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6">
          {undoMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{undoMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Cards: Download Template & Undo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE3DC] flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#343A40]">1. Baixar Planilha Modelo</h4>
                <p className="text-[11px] text-gray-500">
                  Estrutura oficial com colunas e exemplos preenchidos
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-[#C76B4A] border border-[#C76B4A]/30 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition shrink-0"
              >
                <Download className="w-4 h-4" />
                Baixar Modelo (.xlsx)
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#343A40]">Desfazer Última Importação</h4>
                <p className="text-[11px] text-gray-500">
                  {lastImportBatch.length > 0
                    ? `${lastImportBatch.length} tarefas prontas para reversão`
                    : 'Nenhum lote importado recentemente'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUndoLastImport}
                disabled={lastImportBatch.length === 0}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                  lastImportBatch.length > 0
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Desfazer Lote
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-[#C76B4A]/40 hover:border-[#C76B4A] bg-[#FCFAFA] hover:bg-[#FAF8F5] rounded-3xl text-center cursor-pointer transition space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#343A40]">
                {fileName ? `Arquivo selecionado: ${fileName}` : 'Clique para selecionar ou arraste o arquivo XLSX'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Formatos suportados: .xlsx, .xls (Máximo 1.000 linhas)
              </p>
            </div>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#343A40]">Pré-visualização dos Dados:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                    {validCount} Válidas
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200 text-[11px]">
                      {invalidCount} Com Erro
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-[11px]">Total: {parsedRows.length} registros</span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] text-gray-500 font-bold border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">OS / Título da Tarefa</th>
                      <th className="py-2.5 px-3">Tipo Operação</th>
                      <th className="py-2.5 px-3">Prioridade</th>
                      <th className="py-2.5 px-3">Projeto</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Exigência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? 'hover:bg-gray-50' : 'bg-red-50/50'}>
                        <td className="py-2.5 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ok
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px]"
                              title={r.validationError}
                            >
                              <AlertCircle className="w-3.5 h-3.5" /> Erro
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#343A40] max-w-xs truncate">
                          {r.numero_os && (
                            <span className="text-[10px] font-mono font-bold text-[#C76B4A] bg-[#C76B4A]/10 px-1.5 py-0.5 rounded mr-1.5">
                              {r.numero_os}
                            </span>
                          )}
                          {r.titulo || '—'}
                          {r.validationError && (
                            <div className="text-[10px] text-red-600 font-normal">{r.validationError}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{r.tipo_operacao || 'Rotina'}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.prioridade === 'CRITICA'
                                ? 'bg-red-100 text-red-700'
                                : r.prioridade === 'ALTA'
                                ? 'bg-amber-100 text-amber-800'
                                : r.prioridade === 'MEDIA'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {r.prioridade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 truncate max-w-[140px]">{r.projeto || 'Todos'}</td>
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{r.data}</td>
                        <td className="py-2.5 px-3 text-gray-600 text-[10px] font-medium">{r.exigencia_conclusao || 'CHECKLIST'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 font-semibold rounded-xl transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={validCount === 0 || isProcessing}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition ${
              validCount > 0 && !isProcessing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Importar {validCount} Tarefas Válidas
          </button>
        </div>
      </div>
    </div>
  );
};
