/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Setor } from '../types';
import { Plus, Edit2, Check, X, Tag, ArrowLeft } from 'lucide-react';

interface SectorManagerProps {
  setores: Setor[];
  onSave: (updated: Setor[]) => void;
  onBack: () => void;
}

export default function SectorManager({ setores, onSave, onBack }: SectorManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newName.trim()) {
      setError('Por favor, indique o nome do setor.');
      return;
    }

    // Check duplicate name
    if (setores.some(s => s.nome.toLowerCase() === newName.trim().toLowerCase())) {
      setError(`O setor "${newName}" já está cadastrado.`);
      return;
    }

    const newSector: Setor = {
      id: `setor_${Date.now()}`,
      nome: newName.trim(),
    };

    onSave([...setores, newSector]);
    setNewName('');
  };

  const handleStartEdit = (sector: Setor) => {
    setEditingId(sector.id);
    setEditName(sector.nome);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setError('');
  };

  const handleUpdate = (id: string) => {
    setError('');

    if (!editName.trim()) {
      setError('Por favor, indique o nome do setor.');
      return;
    }

    // Check duplicate name (excluding current editing sector)
    if (setores.some(s => s.id !== id && s.nome.toLowerCase() === editName.trim().toLowerCase())) {
      setError(`O setor "${editName}" já está cadastrado.`);
      return;
    }

    const updated = setores.map(s => {
      if (s.id === id) {
        return { ...s, nome: editName.trim() };
      }
      return s;
    });

    onSave(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = setores.filter(s => s.id !== id);
    onSave(updated);
    setDeletingId(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100" id="sector-manager-card">
      <div className="bg-gradient-to-r from-[#EE5900] to-[#D84900] px-6 py-4 flex items-center justify-between" id="sector-manager-header">
        <button
          onClick={onBack}
          className="text-white hover:text-orange-200 transition-colors flex items-center gap-2 p-1 cursor-pointer"
          title="Voltar ao início"
          id="btn-back-sector"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <div className="flex items-center gap-2">
          <Tag className="text-white w-6 h-6" />
          <h2 className="text-white font-bold text-lg">Cadastro de Setores</h2>
        </div>
        <div className="w-10"></div> {/* Balanced spacing */}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium" id="sector-err">
            {error}
          </div>
        )}

        {/* Add Sector Form */}
        <form onSubmit={handleAdd} className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200" id="form-add-sector">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Novo Setor</h3>
          <div className="flex gap-2 max-w-lg">
            <div className="flex-1">
              <input
                id="input-new-sector"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex. Frios, Mercearia, Limpeza..."
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9] focus:border-[#005AA9]"
              />
            </div>
            <button
              id="btn-add-sector-submit"
              type="submit"
              className="bg-[#F58220] hover:bg-orange-600 font-bold text-white px-5 rounded-lg flex items-center gap-2 transition-all cursor-pointer text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </form>

        {/* Sector List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Setores Cadastrados ({setores.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1" id="sector-scrollable">
            {setores.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">Nenhum setor cadastrado.</p>
            ) : (
              setores.map((sector) => (
                <div
                  key={sector.id}
                  className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
                  id={`sector-row-${sector.id}`}
                >
                  {editingId === sector.id ? (
                    <div className="flex-1 mr-3" id={`editing-sector-row-${sector.id}`}>
                      <input
                        id={`edit-sector-name-${sector.id}`}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-800 font-medium text-sm">{sector.nome}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {deletingId === sector.id ? (
                      <div className="flex items-center gap-1.5 animate-fade bg-red-50 p-1 px-2 rounded-lg border border-red-200" id={`sector-delete-confirm-${sector.id}`}>
                        <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Excluir?</span>
                        <button
                          onClick={() => handleDelete(sector.id)}
                          className="p-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
                          title="Confirmar exclusão"
                          id={`sector-btn-confirm-del-${sector.id}`}
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-semibold transition-all cursor-pointer"
                          title="Cancelar"
                          id={`sector-btn-cancel-del-${sector.id}`}
                        >
                          Não
                        </button>
                      </div>
                    ) : editingId === sector.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(sector.id)}
                          className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          title="Salvar alterações"
                          id={`btn-save-sector-${sector.id}`}
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 px-2 bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-gray-100 flex items-center gap-1 text-xs cursor-pointer"
                          title="Cancelar"
                          id={`btn-cancel-sector-${sector.id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setDeletingId(null);
                            handleStartEdit(sector);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Editar setor"
                          id={`btn-edit-sector-${sector.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setDeletingId(sector.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Excluir setor"
                          id={`btn-delete-sector-${sector.id}`}
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
