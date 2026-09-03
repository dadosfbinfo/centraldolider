import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X, ChevronDown } from 'lucide-react';

export type PeriodFilterMode = 'TODOS' | 'MES' | 'ANO' | 'PERSONALIZADO';

export interface PeriodFilterValue {
  mode: PeriodFilterMode;
  year: number;
  month: number; // 1-12 or 0 for all
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export type PeriodSelection = PeriodFilterValue;

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (val: PeriodFilterValue) => void;
  className?: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const PeriodFilter: React.FC<PeriodFilterProps> = ({ value, onChange, className = '' }) => {
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1];

  const handleModeChange = (mode: PeriodFilterMode) => {
    if (mode === 'TODOS') {
      onChange({ mode: 'TODOS', year: currentYear, month: 0, startDate: undefined, endDate: undefined });
    } else if (mode === 'MES') {
      onChange({ mode: 'MES', year: value.year || currentYear, month: value.month || (new Date().getMonth() + 1) });
    } else if (mode === 'ANO') {
      onChange({ mode: 'ANO', year: value.year || currentYear, month: 0 });
    } else if (mode === 'PERSONALIZADO') {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      onChange({
        mode: 'PERSONALIZADO',
        year: currentYear,
        month: 0,
        startDate: value.startDate || thirtyDaysAgo,
        endDate: value.endDate || today
      });
    }
  };

  const isFiltered = value.mode !== 'TODOS';

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs bg-white p-2 rounded-2xl border border-gray-200/90 shadow-2xs ${className}`}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-gray-500 font-bold uppercase tracking-wider text-[10px] shrink-0">
        <Filter className="w-3.5 h-3.5 text-[#C76B4A]" />
        <span>Período:</span>
      </div>

      {/* Mode Buttons */}
      <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl shrink-0">
        <button
          type="button"
          onClick={() => handleModeChange('TODOS')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            value.mode === 'TODOS'
              ? 'bg-white text-[#343A40] shadow-2xs font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Geral
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('MES')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            value.mode === 'MES'
              ? 'bg-[#C76B4A] text-white shadow-2xs font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Mês
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('ANO')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            value.mode === 'ANO'
              ? 'bg-[#355C7D] text-white shadow-2xs font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Ano
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('PERSONALIZADO')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            value.mode === 'PERSONALIZADO'
              ? 'bg-[#5B7DBE] text-white shadow-2xs font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Personalizado
        </button>
      </div>

      {/* Dynamic Controls based on selected mode */}
      {value.mode === 'MES' && (
        <div className="flex items-center gap-1.5 shrink-0 animate-fade-in">
          <select
            value={value.month}
            onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
            className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold focus:outline-hidden focus:border-[#C76B4A]"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={value.year}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
            className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold focus:outline-hidden focus:border-[#C76B4A]"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {value.mode === 'ANO' && (
        <div className="flex items-center gap-1.5 shrink-0 animate-fade-in">
          <select
            value={value.year}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
            className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold focus:outline-hidden focus:border-[#C76B4A]"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Ano {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {value.mode === 'PERSONALIZADO' && (
        <div className="flex items-center gap-1.5 shrink-0 animate-fade-in flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[11px]">De:</span>
            <input
              type="date"
              value={value.startDate || ''}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              className="px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs focus:outline-hidden focus:border-[#5B7DBE]"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[11px]">Até:</span>
            <input
              type="date"
              value={value.endDate || ''}
              onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              className="px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs focus:outline-hidden focus:border-[#5B7DBE]"
            />
          </div>
        </div>
      )}

      {isFiltered && (
        <button
          type="button"
          onClick={() => handleModeChange('TODOS')}
          className="ml-auto flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition text-[11px]"
          title="Limpar filtro de período"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">Limpar</span>
        </button>
      )}
    </div>
  );
};

/**
 * Helper function to test if a date string matches the current PeriodFilterValue
 */
export function isDateInPeriod(dateStr?: string | null, filter?: PeriodFilterValue): boolean {
  if (!filter || filter.mode === 'TODOS' || !dateStr) return true;

  // Extract YYYY-MM-DD
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  const parts = cleanDate.split('-');
  if (parts.length < 3) return true;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (filter.mode === 'ANO') {
    return year === filter.year;
  }

  if (filter.mode === 'MES') {
    return year === filter.year && month === filter.month;
  }

  if (filter.mode === 'PERSONALIZADO') {
    if (filter.startDate && cleanDate < filter.startDate) return false;
    if (filter.endDate && cleanDate > filter.endDate) return false;
    return true;
  }

  return true;
}
