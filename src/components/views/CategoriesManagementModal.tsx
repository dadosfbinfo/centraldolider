import React, { useState } from 'react';
import { Categoria } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { Tag, Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';

interface CategoriesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#C76B4A', // Terracotta
  '#343A40', // Charcoal
  '#355C7D', // Deep Blue
  '#5B7DBE', // Info Steel
  '#8B6B4A', // Muted Bronze
  '#B85C7A', // Berry Accent
  '#2E7D32', // Forest Green
  '#D97706', // Warm Amber
];

export const CategoriesManagementModal: React.FC<CategoriesManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [categories, setCategories] = useState<Categoria[]>(() => dbStore.getCategories());
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#C76B4A');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<'OPERACIONAL' | 'ADMINISTRATIVO' | 'SEGURANCA' | 'QUALIDADE'>('OPERACIONAL');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const refreshList = () => {
    setCategories(dbStore.getCategories());
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setNome('');
    setCor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setDescricao('');
    setTipo('OPERACIONAL');
    setErrorMessage('');
  };

  const handleStartEdit = (cat: Categoria) => {
    setEditingCategory(cat);
    setIsCreating(false);
    setNome(cat.nome);
    setCor(cat.cor);
    setDescricao(cat.descricao || '');
    setTipo(cat.tipo || 'OPERACIONAL');
    setErrorMessage('');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setErrorMessage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMessage('O nome da categoria é obrigatório.');
      return;
    }

    try {
      if (isCreating) {
        dbStore.createCategory({
          nome: nome.trim(),
          cor,
          descricao: descricao.trim() || undefined,
          tipo,
        });
      } else if (editingCategory) {
        dbStore.updateCategory(editingCategory.id, {
          nome: nome.trim(),
          cor,
          descricao: descricao.trim() || undefined,
          tipo,
        });
      }
      refreshList();
      handleCancelForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar categoria.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a categoria "${name}"?`)) {
      dbStore.deleteCategory(id);
      refreshList();
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.descricao && c.descricao.toLowerCase().includes(search.toLowerCase())) ||
      (c.tipo && c.tipo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#343A40]/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FCFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C76B4A]/10 flex items-center justify-center text-[#C76B4A]">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#343A40]">Categorias de Tarefas & OS</h2>
              <p className="text-xs text-gray-500">Organize e classifique as ordens de serviço por temas operacionais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
              />
            </div>
            {!isCreating && !editingCategory && (
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
            )}
          </div>

          {/* Form when creating or editing */}
          {(isCreating || editingCategory) && (
            <form onSubmit={handleSave} className="p-5 bg-[#FAF8F5] rounded-xl border border-[#EBE3DC] space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                  {isCreating ? 'Cadastrar Nova Categoria' : `Editando: ${editingCategory?.nome}`}
                </h3>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome da Categoria <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Qualidade & Auditoria"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Operação</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  >
                    <option value="OPERACIONAL">Operacional</option>
                    <option value="ADMINISTRATIVO">Administrativo & RH</option>
                    <option value="SEGURANCA">Segurança & Saúde</option>
                    <option value="QUALIDADE">Qualidade & Auditoria</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Vistorias técnicas, checklists de abertura e manutenção de rotina"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Cor de Identificação Visual (Tema Natural Tones)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-white shadow-xs ${
                          cor === c ? 'ring-2 ring-offset-2 ring-[#343A40] scale-110' : 'hover:scale-105'
                        }`}
                      >
                        {cor === c && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      title="Escolha uma cor personalizada"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Salvar Categoria
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full mt-0.5 shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.cor }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#343A40]">{cat.nome}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                        {cat.tipo || 'Geral'}
                      </span>
                    </div>
                    {cat.descricao && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {cat.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-[#C76B4A] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.nome)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>Total: <strong>{categories.length}</strong> categorias</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
