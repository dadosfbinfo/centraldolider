import React, { useState, useEffect } from 'react';
import { Projeto } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { FolderKanban, Plus, Edit2, Trash2, Check, Search, Power, Calendar } from 'lucide-react';

export const ProjectsManagementView: React.FC = () => {
  const [projects, setProjects] = useState<Projeto[]>(() => dbStore.getUnits());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');
  const [editingProject, setEditingProject] = useState<Projeto | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states (Only 2 fields as specified: Nome do Projeto & Status)
  const [nome, setNome] = useState('');
  const [status, setStatus] = useState<'ATIVA' | 'INATIVA'>('ATIVA');
  const [errorMessage, setErrorMessage] = useState('');

  const refreshList = () => {
    setProjects(dbStore.getUnits());
  };

  useEffect(() => {
    const unsubscribe = dbStore.subscribe(() => {
      refreshList();
    });
    return () => unsubscribe();
  }, []);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingProject(null);
    setNome('');
    setStatus('ATIVA');
    setErrorMessage('');
  };

  const handleStartEdit = (project: Projeto) => {
    setEditingProject(project);
    setIsCreating(false);
    setNome(project.nome);
    setStatus(project.status);
    setErrorMessage('');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingProject(null);
    setErrorMessage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMessage('O nome do projeto é obrigatório.');
      return;
    }

    try {
      if (isCreating) {
        dbStore.createUnit({
          nome: nome.trim(),
          status,
        });
      } else if (editingProject) {
        dbStore.updateUnit(editingProject.id, {
          nome: nome.trim(),
          status,
        });
      }
      refreshList();
      handleCancelForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar projeto.');
    }
  };

  const handleToggleStatus = (project: Projeto) => {
    const nextStatus = project.status === 'ATIVA' ? 'INATIVA' : 'ATIVA';
    dbStore.updateUnit(project.id, { status: nextStatus });
    refreshList();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o projeto "${name}"?`)) {
      dbStore.deleteUnit(id);
      refreshList();
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#343A40] tracking-tight">
              Gestão de Projetos
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Cadastre e administre os projetos e frentes de operação do sistema
            </p>
          </div>
        </div>

        {!isCreating && !editingProject && (
          <button
            onClick={handleStartCreate}
            className="px-5 py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        )}
      </div>

      {/* Form (Creating or Editing) */}
      {(isCreating || editingProject) && (
        <form
          onSubmit={handleSave}
          className="bg-[#FAF8F5] rounded-3xl p-6 border border-[#EBE3DC] space-y-4 shadow-sm animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C76B4A]"></span>
              <h2 className="text-sm font-bold text-[#343A40] uppercase tracking-wider">
                {isCreating ? 'Cadastrar Novo Projeto' : `Editar Projeto: ${editingProject?.nome}`}
              </h2>
            </div>
            <span className="text-[11px] text-gray-400">Campos essenciais simplificados</span>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                Nome do Projeto <span className="text-[#B85C7A]">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Projeto Operacional São Paulo - Pinheiros"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-xs bg-white rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#C76B4A] focus:ring-2 focus:ring-[#C76B4A]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#343A40] mb-1.5">
                Status do Projeto
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ATIVA' | 'INATIVA')}
                className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-gray-300 text-gray-800 font-semibold focus:outline-hidden focus:border-[#C76B4A]"
              >
                <option value="ATIVA">Ativo</option>
                <option value="INATIVA">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200/80">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <Check className="w-4 h-4" />
              Salvar Projeto
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar projeto por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#C76B4A] focus:ring-1 focus:ring-[#C76B4A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('TODOS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              statusFilter === 'TODOS'
                ? 'bg-[#343A40] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ATIVA')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              statusFilter === 'ATIVA'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Ativos ({projects.filter((p) => p.status === 'ATIVA').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INATIVA')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              statusFilter === 'INATIVA'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Inativos ({projects.filter((p) => p.status === 'INATIVA').length})
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6">Nome do Projeto</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Data de Criação</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <FolderKanban className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>Nenhum projeto encontrado com os filtros atuais.</span>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#343A40] text-sm">{p.nome}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          p.status === 'ATIVA'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'ATIVA' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        ></span>
                        {p.status === 'ATIVA' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {p.created_at
                            ? new Date(p.created_at).toLocaleDateString('pt-BR')
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          title={p.status === 'ATIVA' ? 'Desativar Projeto' : 'Ativar Projeto'}
                          className={`p-1.5 rounded-lg transition ${
                            p.status === 'ATIVA'
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          title="Editar Projeto"
                          className="p-1.5 text-gray-500 hover:text-[#C76B4A] hover:bg-gray-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.nome)}
                          title="Remover Projeto"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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

        {/* Table Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>
            Total: <strong>{projects.length}</strong> projetos cadastrados
          </span>
        </div>
      </div>
    </div>
  );
};
