import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Meta, GoalPeriodicity, GoalDirection } from '../../types/database';
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
  Target
} from 'lucide-react';

interface GoalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

interface ParsedGoalRow {
  indicador: string;
  meta_valor: number;
  unidade_medida: string;
  tipo_periodo: GoalPeriodicity;
  periodo: string;
  data_inicio?: string;
  data_fim?: string;
  projeto?: string;
  lider?: string;
  direcao_melhor?: GoalDirection;
  descricao?: string;
  isValid: boolean;
  validationError?: string;
}

const LAST_GOAL_IMPORT_KEY = 'cdl_last_goal_import_ids';

export const GoalImportModal: React.FC<GoalImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedGoalRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastImportBatch, setLastImportBatch] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LAST_GOAL_IMPORT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [undoMessage, setUndoMessage] = useState<string>('');

  if (!isOpen) return null;

  // Download Sample XLSX Template for Metas
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Indicador *': 'Cumprimento de SLA de Ordens de Serviço',
        'Meta Valor *': 95,
        'Unidade de Medida (%, R$, un, horas)': '%',
        'Tipo de Período (MENSAL, SEMANAL, DIARIA)': 'MENSAL',
        'Período (Ex: Setembro/2026) *': 'Setembro/2026',
        'Data Início (YYYY-MM-DD)': '2026-09-01',
        'Data Fim (YYYY-MM-DD)': '2026-09-30',
        'Projeto': 'Unidade São Paulo - Matriz Pinheiros',
        'Líder Responsável (E-mail ou Nome)': 'mariana.costa@centraldolider.com.br',
        'Direção Melhor (MAIOR_MELHOR ou MENOR_MELHOR)': 'MAIOR_MELHOR',
        'Descrição': 'Meta de entrega das ordens de serviço dentro do prazo estipulado.',
      },
      {
        'Indicador *': 'Índice de Perdas Operacionais / Avarias',
        'Meta Valor *': 1.5,
        'Unidade de Medida (%, R$, un, horas)': '%',
        'Tipo de Período (MENSAL, SEMANAL, DIARIA)': 'MENSAL',
        'Período (Ex: Setembro/2026) *': 'Setembro/2026',
        'Data Início (YYYY-MM-DD)': '2026-09-01',
        'Data Fim (YYYY-MM-DD)': '2026-09-30',
        'Projeto': 'Unidade Rio de Janeiro - Barra da Tijuca',
        'Líder Responsável (E-mail ou Nome)': 'roberto.almeida@centraldolider.com.br',
        'Direção Melhor (MAIOR_MELHOR ou MENOR_MELHOR)': 'MENOR_MELHOR',
        'Descrição': 'Redução de perdas de estoque e manuseio no turno.',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo_Metas');
    XLSX.writeFile(workbook, 'modelo_importacao_metas_central_lider.xlsx');
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

        const validPeriodTypes: GoalPeriodicity[] = ['DIARIA', 'SEMANAL', 'MENSAL'];

        const parsed: ParsedGoalRow[] = rawJson.map((row: any) => {
          const indicador =
            row['Indicador *'] ||
            row['Indicador'] ||
            row['Nome'] ||
            row['Meta'] ||
            '';

          const meta_valor = parseFloat(row['Meta Valor *'] || row['Meta Valor'] || row['Valor'] || '0');
          const unidade_medida = row['Unidade de Medida (%, R$, un, horas)'] || row['Unidade de Medida'] || '%';

          let tipoPeriodoRaw = (
            row['Tipo de Período (MENSAL, SEMANAL, DIARIA)'] ||
            row['Tipo de Período'] ||
            row['Periodicidade'] ||
            'MENSAL'
          )
            .toString()
            .toUpperCase()
            .trim();

          let tipo_periodo: GoalPeriodicity = 'MENSAL';
          if (validPeriodTypes.includes(tipoPeriodoRaw as GoalPeriodicity)) {
            tipo_periodo = tipoPeriodoRaw as GoalPeriodicity;
          }

          const periodo = row['Período (Ex: Setembro/2026) *'] || row['Período'] || row['Periodo'] || 'Setembro/2026';
          const data_inicio = row['Data Início (YYYY-MM-DD)'] || row['Data Início'] || '';
          const data_fim = row['Data Fim (YYYY-MM-DD)'] || row['Data Fim'] || '';
          const projeto = row['Projeto'] || row['Unidade'] || '';
          const lider = row['Líder Responsável (E-mail ou Nome)'] || row['Líder'] || row['Responsável'] || '';

          const dirRaw = (row['Direção Melhor (MAIOR_MELHOR ou MENOR_MELHOR)'] || row['Direção'] || 'MAIOR_MELHOR')
            .toString()
            .toUpperCase()
            .trim();
          const direcao_melhor: GoalDirection = dirRaw === 'MENOR_MELHOR' ? 'MENOR_MELHOR' : 'MAIOR_MELHOR';

          const descricao = row['Descrição'] || row['Descricao'] || '';

          let isValid = true;
          let validationError = '';

          if (!indicador) {
            isValid = false;
            validationError = 'Nome do indicador é obrigatório.';
          } else if (isNaN(meta_valor)) {
            isValid = false;
            validationError = 'Valor da meta deve ser numérico.';
          }

          return {
            indicador,
            meta_valor,
            unidade_medida,
            tipo_periodo,
            periodo,
            data_inicio,
            data_fim,
            projeto,
            lider,
            direcao_melhor,
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

  // Commit Goals Import
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('Nenhuma meta válida para importar.');
      return;
    }

    const units = dbStore.getUnits();
    const leaders = dbStore.getLeaders();
    const createdIds: string[] = [];

    validRows.forEach((row) => {
      const matchedUnit = units.find(
        (u) =>
          u.nome.toLowerCase().includes((row.projeto || '').toLowerCase()) ||
          (u.codigo && u.codigo.toLowerCase() === (row.projeto || '').toLowerCase())
      ) || units[0];

      const matchedLeader = leaders.find(
        (l) =>
          l.email.toLowerCase() === (row.lider || '').toLowerCase() ||
          l.nome.toLowerCase().includes((row.lider || '').toLowerCase())
      ) || leaders[0];

      const created = dbStore.createGoal({
        indicador: row.indicador,
        meta_valor: row.meta_valor,
        valor_atual: 0, // Admin does NOT set Realizado; initialized at 0
        unidade_medida: row.unidade_medida,
        tipo_periodo: row.tipo_periodo,
        periodo: row.periodo,
        data_inicio: row.data_inicio || undefined,
        data_fim: row.data_fim || undefined,
        unidade_id: matchedUnit?.id || 'unit-sp-01',
        unidade_nome: matchedUnit?.nome || 'Matriz Geral',
        projeto_id: matchedUnit?.id || 'unit-sp-01',
        projeto_nome: matchedUnit?.nome || 'Matriz Geral',
        lider_id: matchedLeader?.usuario_id || 'user-lider-sp',
        lider_nome: matchedLeader?.nome || 'Mariana Costa',
        direcao_melhor: row.direcao_melhor || 'MAIOR_MELHOR',
        descricao: row.descricao || undefined,
        status: 'EM_ANDAMENTO',
      });

      if (created?.id) {
        createdIds.push(created.id);
      }
    });

    localStorage.setItem(LAST_GOAL_IMPORT_KEY, JSON.stringify(createdIds));
    setLastImportBatch(createdIds);

    onImportSuccess(validRows.length);
    onClose();
  };

  // Undo Last Import
  const handleUndoLastImport = () => {
    if (lastImportBatch.length === 0) return;

    if (
      window.confirm(
        `Deseja realmente desfazer a última importação e remover as ${lastImportBatch.length} metas criadas?`
      )
    ) {
      let removedCount = 0;
      lastImportBatch.forEach((goalId) => {
        try {
          dbStore.deleteGoal(goalId);
          removedCount++;
        } catch {}
      });

      localStorage.removeItem(LAST_GOAL_IMPORT_KEY);
      setLastImportBatch([]);
      setUndoMessage(`Importação desfeita com sucesso! ${removedCount} metas foram removidas.`);
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
            <div className="w-10 h-10 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#343A40]">Importar Metas via Excel (.xlsx)</h2>
              <p className="text-xs text-gray-500">
                Cadastro de metas e indicadores em lote com modelo oficial e reversão instantânea
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

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE3DC] flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#343A40]">1. Baixar Planilha Modelo</h4>
                <p className="text-[11px] text-gray-500">
                  Formato compatível com indicadores e periódicos
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
                    ? `${lastImportBatch.length} metas prontas para reversão`
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
                {fileName ? `Arquivo selecionado: ${fileName}` : 'Clique para selecionar ou arraste o arquivo XLSX de Metas'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Formatos suportados: .xlsx, .xls
              </p>
            </div>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#343A40]">Pré-visualização das Metas:</span>
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
                      <th className="py-2.5 px-3">Indicador</th>
                      <th className="py-2.5 px-3">Meta Valor</th>
                      <th className="py-2.5 px-3">Tipo Período</th>
                      <th className="py-2.5 px-3">Período</th>
                      <th className="py-2.5 px-3">Projeto</th>
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
                          {r.indicador || '—'}
                          {r.validationError && (
                            <div className="text-[10px] text-red-600 font-normal">{r.validationError}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#C76B4A]">
                          {r.meta_valor} {r.unidade_medida}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{r.tipo_periodo}</td>
                        <td className="py-2.5 px-3 text-gray-700 font-medium">{r.periodo}</td>
                        <td className="py-2.5 px-3 text-gray-600 truncate max-w-[150px]">
                          {r.projeto || 'Matriz'}
                        </td>
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
                ? 'bg-[#C76B4A] hover:bg-[#b05838] text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Importar {validCount} Metas Válidas
          </button>
        </div>
      </div>
    </div>
  );
};
