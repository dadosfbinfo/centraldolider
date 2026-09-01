import React, { useState } from 'react';
import { Unidade } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { Building2, Plus, Edit2, Trash2, X, Check, MapPin, Search } from 'lucide-react';

interface UnitsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnitsManagementModal: React.FC<UnitsManagementModalProps> = ({ isOpen, onClose }) => {
  const [units, setUnits] = useState<Unidade[]>(() => dbStore.getUnits());
  const [search, setSearch] = useState('');
  const [editingUnit, setEditingUnit] = useState<Unidade | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [regional, setRegional] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [endereco, setEndereco] = useState('');
  const [responsavelNome, setResponsavelNome] = useState('');
  const [status, setStatus] = useState<'ATIVA' | 'INATIVA'>('ATIVA');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const refreshList = () => {
    setUnits(dbStore.getUnits());
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingUnit(null);
    setNome('');
    setCodigo(`UN-${Math.floor(100 + Math.random() * 900)}`);
    setRegional('Sudeste 1');
    setCidade('');
    setEstado('SP');
    setEndereco('');
    setResponsavelNome('');
    setStatus('ATIVA');
    setErrorMessage('');
  };

  const handleStartEdit = (unit: Unidade) => {
    setEditingUnit(unit);
    setIsCreating(false);
    setNome(unit.nome);
    setCodigo(unit.codigo || '');
    setRegional(unit.regional || '');
    setCidade(unit.cidade || '');
    setEstado(unit.estado || 'SP');
    setEndereco(unit.endereco || '');
    setResponsavelNome(unit.responsavel_nome || '');
    setStatus(unit.status);
    setErrorMessage('');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingUnit(null);
    setErrorMessage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMessage('O nome da unidade é obrigatório.');
      return;
    }

    try {
      if (isCreating) {
        dbStore.createUnit({
          nome: nome.trim(),
          codigo: codigo.trim() || undefined,
          regional: regional.trim() || undefined,
          cidade: cidade.trim() || undefined,
          estado: estado.trim() || undefined,
          endereco: endereco.trim() || undefined,
          responsavel_nome: responsavelNome.trim() || undefined,
          status,
        });
      } else if (editingUnit) {
        dbStore.updateUnit(editingUnit.id, {
          nome: nome.trim(),
          codigo: codigo.trim() || undefined,
          regional: regional.trim() || undefined,
          cidade: cidade.trim() || undefined,
          estado: estado.trim() || undefined,
          endereco: endereco.trim() || undefined,
          responsavel_nome: responsavelNome.trim() || undefined,
          status,
        });
      }
      refreshList();
      handleCancelForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar unidade.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a unidade "${name}"?`)) {
      dbStore.deleteUnit(id);
      refreshList();
    }
  };

  const filteredUnits = units.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      (u.codigo && u.codigo.toLowerCase().includes(search.toLowerCase())) ||
      (u.regional && u.regional.toLowerCase().includes(search.toLowerCase())) ||
      (u.cidade && u.cidade.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#343A40]/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FCFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C76B4A]/10 flex items-center justify-center text-[#C76B4A]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#343A40]">Gerenciamento de Unidades Operacionais</h2>
              <p className="text-xs text-gray-500">Cadastre e estruture as unidades e filiais da rede</p>
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
                placeholder="Buscar por nome, código, regional ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A] focus:ring-1 focus:ring-[#C76B4A]"
              />
            </div>
            {!isCreating && !editingUnit && (
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 bg-[#C76B4A] hover:bg-[#b05c3d] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Unidade
              </button>
            )}
          </div>

          {/* Form when creating or editing */}
          {(isCreating || editingUnit) && (
            <form onSubmit={handleSave} className="p-5 bg-[#FAF8F5] rounded-xl border border-[#EBE3DC] space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                  {isCreating ? 'Cadastrar Nova Unidade' : `Editando: ${editingUnit?.nome}`}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Preencha os dados da unidade</span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome da Unidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Unidade São Paulo - Matriz Pinheiros"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Código / Sigla</label>
                  <input
                    type="text"
                    placeholder="Ex: UN-SP01"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Regional / Divisão</label>
                  <input
                    type="text"
                    placeholder="Ex: Sudeste 1"
                    value={regional}
                    onChange={(e) => setRegional(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Brigadeiro Faria Lima, 1485"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Líder / Responsável Atual</label>
                  <input
                    type="text"
                    placeholder="Ex: Mariana Costa"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status da Unidade</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ATIVA' | 'INATIVA')}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#C76B4A]"
                  >
                    <option value="ATIVA">Ativa</option>
                    <option value="INATIVA">Inativa / Em Implantação</option>
                  </select>
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
                  Salvar Unidade
                </button>
              </div>
            </form>
          )}

          {/* Units Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Unidade / Regional</th>
                    <th className="py-3 px-4">Localização</th>
                    <th className="py-3 px-4">Líder Designado</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Nenhuma unidade encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#C76B4A]">
                          {u.codigo || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#343A40]">{u.nome}</div>
                          {u.regional && (
                            <div className="text-[11px] text-gray-400">Regional: {u.regional}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {u.cidade ? `${u.cidade} - ${u.estado}` : 'Não informado'}
                            </span>
                          </div>
                          {u.endereco && (
                            <div className="text-[11px] text-gray-400 truncate max-w-xs">
                              {u.endereco}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-700">
                          {u.responsavel_nome ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[#8B6B4A] border border-amber-200/60 font-semibold text-[11px]">
                              {u.responsavel_nome}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pendente</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ATIVA'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(u)}
                              title="Editar Unidade"
                              className="p-1.5 text-gray-500 hover:text-[#C76B4A] hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.nome)}
                              title="Remover Unidade"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>Total: <strong>{units.length}</strong> unidades cadastradas</span>
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
