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
  titulo: string;
  tipo_operacao?: string;
  prioridade: TaskPriority;
  projeto?: string;
  responsavel?: string;
  data: string;
  horario?: string;
  prazo?: string;
  categoria?: string;
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
        'Título da Tarefa *': 'Auditoria de Abertura de Loja e Caixa',
        'Tipo da Operação': 'Rotina Operacional',
        'Prioridade (BAIXA, MEDIA, ALTA, CRITICA)': 'ALTA',
        'Projeto': 'Unidade São Paulo - Matriz Pinheiros',
        'Responsável (E-mail ou Nome)': 'mariana.costa@centraldolider.com.br',
        'Data (YYYY-MM-DD) *': new Date().toISOString().split('T')[0],
        'Horário (HH:mm)': '08:00',
        'Prazo (YYYY-MM-DD)': new Date(Date.now() + 86400000).toISOString().split('T')[0],
        'Categoria': 'Rotina Operacional',
        'Descrição': 'Conferir numerário em caixa e itens de segurança antes da abertura.',
      },
      {
        'Título da Tarefa *': 'Inspeção Semanal de Extintores e Iluminação',
        'Tipo da Operação': 'Preventiva',
        'Prioridade (BAIXA, MEDIA, ALTA, CRITICA)': 'MEDIA',
        'Projeto': 'Unidade Rio de Janeiro - Barra da Tijuca',
        'Responsável (E-mail ou Nome)': 'roberto.almeida@centraldolider.com.br',
        'Data (YYYY-MM-DD) *': new Date().toISOString().split('T')[0],
        'Horário (HH:mm)': '10:30',
        'Prazo (YYYY-MM-DD)': new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        'Categoria': 'Segurança & Saúde',
        'Descrição': 'Verificar lacres e manômetros de todos os extintores do piso.',
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

        const parsed: ParsedTaskRow[] = rawJson.map((row: any, idx: number) => {
          // Normalize column headers
          const titulo =
            row['Título da Tarefa *'] ||
            row['Título da Tarefa'] ||
            row['Titulo'] ||
            row['Título'] ||
            row['Nome'] ||
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
            row['Projeto'] ||
            row['Unidade'] ||
            row['Projeto/Unidade'] ||
            '';

          const responsavel =
            row['Responsável (E-mail ou Nome)'] ||
            row['Responsável'] ||
            row['Líder'] ||
            '';

          let data =
            row['Data (YYYY-MM-DD) *'] ||
            row['Data (YYYY-MM-DD)'] ||
            row['Data'] ||
            new Date().toISOString().split('T')[0];

          if (typeof data === 'number') {
            // Excel serial date to YYYY-MM-DD
            const jsDate = new Date(Math.round((data - 25569) * 86400 * 1000));
            data = jsDate.toISOString().split('T')[0];
          } else {
            data = data.toString().trim();
          }

          const horario = row['Horário (HH:mm)'] || row['Horario'] || row['Horário'] || '08:00';
          const prazo = row['Prazo (YYYY-MM-DD)'] || row['Prazo'] || '';
          const categoria = row['Categoria'] || 'Rotina Operacional';
          const descricao = row['Descrição'] || row['Descricao'] || '';

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
            titulo,
            tipo_operacao,
            prioridade,
            projeto,
            responsavel,
            data,
            horario,
            prazo,
            categoria,
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
      // Resolve project
      const matchedUnit = units.find(
        (u) =>
          u.nome.toLowerCase().includes((row.projeto || '').toLowerCase()) ||
          (u.codigo && u.codigo.toLowerCase() === (row.projeto || '').toLowerCase())
      ) || units[0];

      // Resolve category
      const matchedCat = categories.find((c) =>
        c.nome.toLowerCase().includes((row.categoria || '').toLowerCase())
      ) || categories[0];

      // Resolve leader
      const matchedLeader = leaders.find(
        (l) =>
          l.email.toLowerCase() === (row.responsavel || '').toLowerCase() ||
          l.nome.toLowerCase().includes((row.responsavel || '').toLowerCase())
      ) || leaders[0];

      const created = dbStore.createTask({
        titulo: row.titulo,
        tipo_operacao: row.tipo_operacao || 'Rotina Operacional',
        prioridade: row.prioridade,
        categoria_id: matchedCat?.id || 'cat-op',
        categoria_nome: matchedCat?.nome || 'Operacional',
        categoria_cor: matchedCat?.cor || '#C76B4A',
        unidade_id: matchedUnit?.id || 'unit-sp-01',
        unidade: matchedUnit?.nome || 'Matriz Geral',
        projeto_id: matchedUnit?.id || 'unit-sp-01',
        projeto: matchedUnit?.nome || 'Matriz Geral',
        responsavel_id: matchedLeader?.usuario_id || 'user-lider-sp',
        responsavel_nome: matchedLeader?.nome || 'Mariana Costa',
        responsavel_cargo: matchedLeader?.cargo || 'Líder Operacional',
        data: row.data,
        horario: row.horario || '08:00',
        prazo: row.prazo || undefined,
        descricao: row.descricao || undefined,
        status: 'PROGRAMADA',
        recorrencia: 'UMA_VEZ',
        requisitos_conclusao: [
          {
            id: 'req-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
            tipo: 'CHECKLIST',
            titulo: 'Conferência Operacional Padrão',
            obrigatorio: true,
            checklist_itens: [
              { id: 'c1', texto: 'Verificação visual dos padrões', concluido: false },
              { id: 'c2', texto: 'Registro fotográfico ou validação em checklist', concluido: false },
            ],
          },
        ],
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
                      <th className="py-2.5 px-3">Título da Tarefa</th>
                      <th className="py-2.5 px-3">Tipo Operação</th>
                      <th className="py-2.5 px-3">Prioridade</th>
                      <th className="py-2.5 px-3">Projeto</th>
                      <th className="py-2.5 px-3">Data</th>
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
                          {r.titulo || '—'}
                          {r.validationError && (
                            <div className="text-[10px] text-red-600 font-normal">{r.validationError}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{r.tipo_operacao || 'Rotina'}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] font-bold">{r.prioridade}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 truncate max-w-[150px]">
                          {r.projeto || 'Matriz'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">{r.data}</td>
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
