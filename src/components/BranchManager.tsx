/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Filial } from '../types';
import { Plus, Edit2, Check, X, Store, ArrowLeft } from 'lucide-react';

interface BranchManagerProps {
  filiais: Filial[];
  onSave: (updated: Filial[]) => void;
  onBack: () => void;
}

export default function BranchManager({ filiais, onSave, onBack }: BranchManagerProps) {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newCode.trim() || !newName.trim()) {
      setError('Por favor, preencha o código e o nome da filial.');
      return;
    }

    // Check duplicate code
    if (filiais.some(f => f.codigo === newCode.trim())) {
      setError(`A filial com código ${newCode} já está cadastrada.`);
      return;
    }

    const newBranch: Filial = {
      id: `filial_${Date.now()}`,
      codigo: newCode.trim(),
      nome: newName.trim(),
    };

    onSave([...filiais, newBranch]);
    setNewCode('');
    setNewName('');
  };

  const handleStartEdit = (branch: Filial) => {
    setEditingId(branch.id);
    setEditCode(branch.codigo);
    setEditName(branch.nome);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCode('');
    setEditName('');
    setError('');
  };

  const handleUpdate = (id: string) => {
    setError('');

    if (!editCode.trim() || !editName.trim()) {
      setError('Por favor, preencha o código e o nome da filial.');
      return;
    }

    // Check duplicate code (excluding current editing branch)
    if (filiais.some(f => f.id !== id && f.codigo === editCode.trim())) {
      setError(`A filial com código ${editCode} já está cadastrada.`);
      return;
    }

    const updated = filiais.map(f => {
      if (f.id === id) {
        return { ...f, codigo: editCode.trim(), nome: editName.trim() };
      }
      return f;
    });

    onSave(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = filiais.filter(f => f.id !== id);
    onSave(updated);
    setDeletingId(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100" id="branch-manager-card">
      <div className="bg-gradient-to-r from-[#EE5900] to-[#D84900] px-6 py-4 flex items-center justify-between" id="branch-manager-header">
        <button
          onClick={onBack}
          className="text-white hover:text-orange-200 transition-colors flex items-center gap-2 p-1 cursor-pointer"
          title="Voltar ao início"
          id="btn-back-branch"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <div className="flex items-center gap-2">
          <Store className="text-white w-6 h-6" />
          <h2 className="text-white font-bold text-lg">Cadastro de Filiais</h2>
        </div>
        <div className="w-10"></div> {/* Balanced spacing */}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium" id="branch-err">
            {error}
          </div>
        )}

        {/* Add Branch Form */}
        <form onSubmit={handleAdd} className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200" id="form-add-branch">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Nova Filial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Código</label>
              <input
                id="input-new-code"
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Ex. 172"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9] focus:border-[#005AA9]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome/Cidade</label>
              <input
                id="input-new-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex. Cascavel"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9] focus:border-[#005AA9]"
              />
            </div>
          </div>
          <button
            id="btn-add-branch-submit"
            type="submit"
            className="w-full bg-[#F58220] hover:bg-orange-600 font-bold text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Filial
          </button>
        </form>

        {/* Branch List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filiais Cadastradas ({filiais.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1" id="branch-scrollable">
            {filiais.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">Nenhuma filial cadastrada.</p>
            ) : (
              filiais.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
                  id={`branch-row-${branch.codigo}`}
                >
                  {editingId === branch.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 mr-3" id={`editing-row-${branch.id}`}>
                      <input
                        id={`edit-code-${branch.id}`}
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
                      />
                      <input
                        id={`edit-name-${branch.id}`}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#005AA9] bg-blue-50 px-2 py-1 rounded text-xs">
                        Código: {branch.codigo}
                      </span>
                      <span className="text-gray-800 font-medium text-sm">{branch.nome}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {deletingId === branch.id ? (
                      <div className="flex items-center gap-1.5 animate-fade bg-red-50 p-1 px-2 rounded-lg border border-red-200" id={`delete-confirm-${branch.id}`}>
                        <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Excluir?</span>
                        <button
                          onClick={() => handleDelete(branch.id)}
                          className="p-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
                          title="Confirmar exclusão"
                          id={`btn-confirm-del-${branch.id}`}
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-semibold transition-all cursor-pointer"
                          title="Cancelar"
                          id={`btn-cancel-del-${branch.id}`}
                        >
                          Não
                        </button>
                      </div>
                    ) : editingId === branch.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(branch.id)}
                          className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          title="Salvar alterações"
                          id={`btn-save-edit-${branch.id}`}
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 px-2 bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-gray-100 flex items-center gap-1 text-xs cursor-pointer"
                          title="Cancelar"
                          id={`btn-cancel-edit-${branch.id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setDeletingId(null);
                            handleStartEdit(branch);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Editar filial"
                          id={`btn-edit-${branch.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setDeletingId(branch.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Excluir filial"
                          id={`btn-delete-${branch.id}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
