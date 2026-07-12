/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Fornecedor, Setor } from '../types';
import { Plus, Edit2, Check, X, ShieldAlert, ArrowLeft, Briefcase } from 'lucide-react';

interface SupplierManagerProps {
  fornecedores: Fornecedor[];
  setores: Setor[];
  onSave: (updated: Fornecedor[]) => void;
  onBack: () => void;
}

export default function SupplierManager({ fornecedores, setores, onSave, onBack }: SupplierManagerProps) {
  const [selectedSectorId, setSelectedSectorId] = useState(setores[0]?.id || '');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSectorId, setEditSectorId] = useState('');
  const [error, setError] = useState('');

  const [selectedDays, setSelectedDays] = useState<string[]>(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);
  const [editDays, setEditDays] = useState<string[]>([]);

  const ALL_DAYS = [
    { id: 'segunda', label: 'Seg' },
    { id: 'terca', label: 'Ter' },
    { id: 'quarta', label: 'Qua' },
    { id: 'quinta', label: 'Qui' },
    { id: 'sexta', label: 'Sex' },
    { id: 'sabado', label: 'Sáb' },
  ];

  // Filter for view
  const [filterSectorId, setFilterSectorId] = useState(setores[0]?.id || 'all');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSectorId) {
      setError('Por favor, cadastre primeiro pelo menos um setor.');
      return;
    }

    if (!newName.trim()) {
      setError('Por favor, indique o nome da agência.');
      return;
    }

    if (selectedDays.length === 0) {
      setError('Selecione pelo menos um dia de atendimento para a agência.');
      return;
    }

    // Check duplicate in same sector
    const isDuplicate = fornecedores.some(
      f => f.setor_id === selectedSectorId && f.nome.toLowerCase() === newName.trim().toLowerCase()
    );

    if (isDuplicate) {
      const sectorName = setores.find(s => s.id === selectedSectorId)?.nome || '';
      setError(`A agência "${newName}" já está cadastrada no setor "${sectorName}".`);
      return;
    }

    const newSupplier: Fornecedor = {
      id: `forn_${Date.now()}`,
      nome: newName.trim(),
      setor_id: selectedSectorId,
      dias_atendimento: selectedDays,
    };

    onSave([...fornecedores, newSupplier]);
    setNewName('');
    setSelectedDays(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);

    // Automatically set the list filter to match the newly added supplier's sector
    setFilterSectorId(selectedSectorId);
  };

  const handleStartEdit = (forn: Fornecedor) => {
    setEditingId(forn.id);
    setEditName(forn.nome);
    setEditSectorId(forn.setor_id);
    setEditDays(forn.dias_atendimento || ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditSectorId('');
    setEditDays([]);
    setError('');
  };

  const handleUpdate = (id: string) => {
    setError('');

    if (!editName.trim() || !editSectorId) {
      setError('Preencha todos os campos da agência.');
      return;
    }

    if (editDays.length === 0) {
      setError('Selecione pelo menos um dia de atendimento para a agência.');
      return;
    }

    // Check duplicates exclusion
    const isDuplicate = fornecedores.some(
      f => f.id !== id && f.setor_id === editSectorId && f.nome.toLowerCase() === editName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError(`A agência "${editName}" já existe neste setor.`);
      return;
    }

    const updated = fornecedores.map(f => {
      if (f.id === id) {
        return { 
          ...f, 
          nome: editName.trim(), 
          setor_id: editSectorId,
          dias_atendimento: editDays 
        };
      }
      return f;
    });

    onSave(updated);
    setEditingId(null);
    setEditDays([]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza de que deseja remover esta agência? Ela deixará de aparecer em novos checklists, mas os registros antigos de presença serão preservados.')) {
      const updated = fornecedores.filter(f => f.id !== id);
      onSave(updated);
    }
  };

  // Grouped or filtered suppliers
  const displayedFornecedores = filterSectorId === 'all'
    ? fornecedores
    : fornecedores.filter(f => f.setor_id === filterSectorId);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100" id="supplier-manager-card">
      <div className="bg-[#005AA9] px-6 py-4 flex items-center justify-between" id="supplier-manager-header">
        <button
          onClick={onBack}
          className="text-white hover:text-[#F58220] transition-colors flex items-center gap-2 p-1"
          title="Voltar ao início"
          id="btn-back-supplier"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <div className="flex items-center gap-2">
          <Briefcase className="text-[#F58220] w-6 h-6" />
          <h2 className="text-white font-bold text-lg">Cadastro de Agências</h2>
        </div>
        <div className="w-10"></div> {/* Balanced spacing */}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium" id="supplier-err">
            {error}
          </div>
        )}

        {setores.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-red-100 rounded-xl bg-red-50/50 mb-4 flex flex-col items-center">
            <ShieldAlert className="text-red-500 w-10 h-10 mb-2" />
            <p className="text-gray-700 font-medium text-sm mb-3">Não há setores cadastrados!</p>
            <p className="text-xs text-gray-500 mb-4 max-w-md">Para cadastrar agências, você deve registrar os setores antes (ex: Frios, Mercearia, Bazar...).</p>
          </div>
        ) : (
          <>
            {/* Add Supplier Form */}
            <form onSubmit={handleAdd} className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200" id="form-add-supplier">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Nova Agência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Setor</label>
                  <select
                    id="select-add-supplier-sector"
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9] focus:border-[#005AA9]"
                  >
                    {setores.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome Agência</label>
                  <input
                    id="input-add-supplier-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex. Aurora, Danone, JBS..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9] focus:border-[#005AA9]"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-bold text-[#005AA9]">Dias de Atendimento (Segunda a Sábado)</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {ALL_DAYS.map(day => {
                    const isChecked = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (selectedDays.length > 1) {
                              setSelectedDays(selectedDays.filter(d => d !== day.id));
                            }
                          } else {
                            setSelectedDays([...selectedDays, day.id]);
                          }
                        }}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#005AA9] text-white border-[#005AA9] shadow-sm font-black'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                id="btn-add-supplier-submit"
                type="submit"
                className="w-full bg-[#F58220] hover:bg-orange-600 font-bold text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar Agência
              </button>
            </form>

            {/* Supplier List Filter & List */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Agências Cadastradas</h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 font-medium">Filtrar Setor:</span>
                  <select
                    id="select-filter-supplier-sector"
                    value={filterSectorId}
                    onChange={(e) => setFilterSectorId(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold text-[#005AA9] focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
                  >
                    <option value="all">Ver Todos ({fornecedores.length})</option>
                    {setores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({fornecedores.filter(f => f.setor_id === s.id).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1" id="supplier-scrollable">
                {displayedFornecedores.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm">Nenhuma agência cadastrada neste setor.</p>
                ) : (
                  displayedFornecedores.map((forn) => {
                    const sectorName = setores.find(s => s.id === forn.setor_id)?.nome || 'Sem Setor';
                    return (
                      <div
                        key={forn.id}
                        className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
                        id={`supplier-row-${forn.id}`}
                      >
                        {editingId === forn.id ? (
                          <div className="flex-1 flex flex-col gap-3 mr-3" id={`editing-supplier-${forn.id}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <select
                                id={`edit-supplier-sector-${forn.id}`}
                                value={editSectorId}
                                onChange={(e) => setEditSectorId(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                              >
                                {setores.map(s => (
                                  <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                              </select>
                              <input
                                id={`edit-supplier-name-${forn.id}`}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
                              />
                            </div>
                            
                            <div>
                              <span className="block text-[10px] text-[#005AA9] font-bold uppercase tracking-wider mb-1">Dias de Atendimento:</span>
                              <div className="flex flex-wrap gap-1">
                                {ALL_DAYS.map(day => {
                                  const isChecked = editDays.includes(day.id);
                                  return (
                                    <button
                                      key={day.id}
                                      type="button"
                                      onClick={() => {
                                        if (isChecked) {
                                          if (editDays.length > 1) {
                                            setEditDays(editDays.filter(d => d !== day.id));
                                          }
                                        } else {
                                          setEditDays([...editDays, day.id]);
                                        }
                                      }}
                                      className={`py-1 px-2 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-[#005AA9] text-white border-[#005AA9] font-extrabold'
                                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                      }`}
                                    >
                                      {day.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-[#F58220] bg-orange-50 px-2.5 py-1 rounded text-[10px] uppercase">
                                {sectorName}
                              </span>
                              <span className="text-gray-800 font-bold text-sm">{forn.nome}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Atendimento:</span>
                              <div className="flex gap-1 flex-wrap">
                                {ALL_DAYS.map(day => {
                                  const isScheduled = (forn.dias_atendimento || ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']).includes(day.id);
                                  return (
                                    <span
                                      key={day.id}
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                        isScheduled
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                          : 'bg-gray-50 text-gray-300 border border-gray-100 line-through'
                                      }`}
                                    >
                                      {day.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {editingId === forn.id ? (
                            <>
                              <button
                                onClick={() => handleUpdate(forn.id)}
                                className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                title="Salvar"
                                id={`btn-save-supplier-edit-${forn.id}`}
                              >
                                <Check className="w-3.5 h-3.5" /> Salvar
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 px-2 bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-gray-100 flex items-center gap-1 text-xs cursor-pointer"
                                title="Cancelar"
                                id={`btn-cancel-supplier-edit-${forn.id}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(forn)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Editar agência"
                                id={`btn-edit-supplier-${forn.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(forn.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Remover agência"
                                id={`btn-delete-supplier-${forn.id}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
