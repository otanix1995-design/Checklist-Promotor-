/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Filial, Setor, Fornecedor, ChecklistRecord, ChecklistStatus } from '../types';
import { Check, X, ClipboardCheck, ArrowRight, Save, User, ShoppingBag, MapPin, Calendar, HelpCircle, FileText } from 'lucide-react';

interface ChecklistExecutionProps {
  filiais: Filial[];
  setores: Setor[];
  fornecedores: Fornecedor[];
  onSave: (records: ChecklistRecord[]) => void;
  onBackToMenu: () => void;
}

export default function ChecklistExecution({
  filiais,
  setores,
  fornecedores,
  onSave,
  onBackToMenu,
}: ChecklistExecutionProps) {
  // Checklist Session Init
  const [currentStep, setCurrentStep] = useState<'init' | 'audit'>('init');
  const [selectedFilialId, setSelectedFilialId] = useState('');
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [responsavelName, setResponsavelName] = useState('');
  const [checklistDate, setChecklistDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // State inside audit step
  const [currentDayName, setCurrentDayName] = useState('segunda');
  const [filteredSuppliers, setFilteredSuppliers] = useState<Fornecedor[]>([]);
  // Map of supplier ID -> selected status
  const [statuses, setStatuses] = useState<Record<string, ChecklistStatus>>({});
  // Map of supplier ID -> observation string
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-init selectors
  useEffect(() => {
    if (filiais.length > 0 && !selectedFilialId) {
      setSelectedFilialId(filiais[0].id);
    }
  }, [filiais, selectedFilialId]);

  useEffect(() => {
    if (setores.length > 0 && !selectedSetorId) {
      setSelectedSetorId(setores[0].id);
    }
  }, [setores, selectedSetorId]);

  // Load suppliers on step transition
  const handleStartChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFilialId) {
      setErrorMsg('Escolha uma Filial para continuar.');
      return;
    }
    if (!selectedSetorId) {
      setErrorMsg('Escolha um Setor para continuar.');
      return;
    }
    if (!responsavelName.trim()) {
      setErrorMsg('Por favor, informe o Nome do Responsável.');
      return;
    }

    // Determine day of the week from selected date safely to avoid timezone shifts
    const parts = checklistDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const DAYS_MAP = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const calculatedDayName = DAYS_MAP[dayOfWeek] || 'segunda';
    setCurrentDayName(calculatedDayName);

    // Filter by sector first
    const sectorSuppliers = fornecedores.filter(f => f.setor_id === selectedSetorId);
    if (sectorSuppliers.length === 0) {
      const sectorName = setores.find(s => s.id === selectedSetorId)?.nome || '';
      setErrorMsg(`Não existem agências cadastradas para o setor "${sectorName}". Adicione-as na aba de Cadastros primeiro.`);
      return;
    }

    setFilteredSuppliers(sectorSuppliers);

    // Default statuses initialized:
    // If they do not serve on the given day, they default to "ausente" with observation "Hoje não é dia de Atendimento"
    const defaultStatuses: Record<string, ChecklistStatus> = {};
    const defaultObservations: Record<string, string> = {};
    sectorSuppliers.forEach(item => {
      const scheduledDays = item.dias_atendimento || ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const isScheduledToday = scheduledDays.includes(calculatedDayName);
      if (!isScheduledToday) {
        defaultStatuses[item.id] = 'ausente';
        defaultObservations[item.id] = 'Hoje não é dia de Atendimento';
      } else {
        defaultObservations[item.id] = '';
      }
    });
    setStatuses(defaultStatuses);
    setObservations(defaultObservations);

    setCurrentStep('audit');
  };

  // Bulk action to mark all as Presente
  const handleMarkAllPresent = () => {
    const updated: Record<string, ChecklistStatus> = {};
    filteredSuppliers.forEach(item => {
      updated[item.id] = 'presente';
    });
    setStatuses(updated);
  };

  const handleStatusChange = (supplierId: string, status: ChecklistStatus) => {
    setStatuses(prev => ({
      ...prev,
      [supplierId]: status,
    }));
  };

  const handleObservationChange = (supplierId: string, obs: string) => {
    setObservations(prev => ({
      ...prev,
      [supplierId]: obs,
    }));
  };

  const handleSubmitAudit = () => {
    setErrorMsg('');
    
    // Check if any supplier has no status configured
    const missing = filteredSuppliers.filter(item => !statuses[item.id]);
    if (missing.length > 0) {
      setErrorMsg(`Por favor, defina o status de todos os promotores. Pendentes: ${missing.map(m => m.nome).join(', ')}`);
      return;
    }

    // Capture precise saving time
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${hh}:${mm}`;

    // Map to ChecklistRecord list
    const finalRecords: ChecklistRecord[] = filteredSuppliers.map(item => ({
      id: `record_${Date.now()}_${item.id}`,
      data: checklistDate,
      hora: currentTimeString,
      filial_id: selectedFilialId,
      setor_id: selectedSetorId,
      responsavel: responsavelName.trim(),
      fornecedor_id: item.id,
      status: statuses[item.id],
      observacao: observations[item.id]?.trim() || undefined,
    }));

    onSave(finalRecords);
    setSuccessMsg('Checklist salvo com sucesso!');
    
    setTimeout(() => {
      setSuccessMsg('');
      onBackToMenu();
    }, 1500);
  };

  const selectedFilialObj = filiais.find(f => f.id === selectedFilialId);
  const selectedSetorObj = setores.find(s => s.id === selectedSetorId);

  // Constants for Status Colors & badges
  const STATUS_CONFIGS: Record<ChecklistStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
    presente: { label: 'Presente', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', icon: '✅' },
    ausente: { label: 'Ausente', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', icon: '❌' },
  };

  return (
    <div className="w-full max-w-2xl mx-auto" id="checklist-conferer-wrapper">
      {currentStep === 'init' ? (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100" id="step-init-card">
          <div className="bg-[#005AA9] p-6 text-center text-white relative" id="init-card-header">
            <ClipboardCheck className="w-12 h-12 mx-auto text-[#F58220] mb-2 drop-shadow-md" />
            <h2 className="text-xl font-extrabold tracking-tight">Iniciar Conferência Diária</h2>
            <p className="text-blue-100 text-xs mt-1">Controle rápido de presença de promotores de agências</p>
          </div>

          <form onSubmit={handleStartChecklist} className="p-6 space-y-4" id="form-init-conferencia">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 font-semibold" id="init-error">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#005AA9]" /> Data da Conferência
              </label>
              <input
                id="conf-date"
                type="date"
                required
                value={checklistDate}
                onChange={(e) => setChecklistDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#005AA9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#005AA9]" /> Filial do Atacadão
              </label>
              {filiais.length === 0 ? (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs p-3 rounded-lg leading-relaxed">
                  Não há filiais cadastradas. Por favor, cadastre uma filial na guia superior de cadastros para iniciar.
                </div>
              ) : (
                <select
                  id="conf-filial"
                  value={selectedFilialId}
                  onChange={(e) => setSelectedFilialId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9]"
                >
                  {filiais.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.codigo} - {f.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#005AA9]" /> Setor
                </label>
                {setores.length === 0 ? (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs p-3 rounded-lg leading-relaxed">
                    Não há setores cadastrados.
                  </div>
                ) : (
                  <select
                    id="conf-setor"
                    value={selectedSetorId}
                    onChange={(e) => setSelectedSetorId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9]"
                  >
                    {setores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#005AA9]" /> Líder Responsável
                </label>
                <input
                  id="conf-responsavel"
                  type="text"
                  required
                  placeholder="Ex. João Silva (Líder)"
                  value={responsavelName}
                  onChange={(e) => setResponsavelName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005AA9]"
                />
              </div>
            </div>

            <button
              id="btn-start-checklist-workflow"
              type="submit"
              disabled={filiais.length === 0 || setores.length === 0}
              className="w-full bg-[#F58220] hover:bg-orange-600 font-bold text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed mt-4"
            >
              Iniciar Checklist <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl shadow-md overflow-hidden border border-gray-100" id="step-audit-card">
          {/* Audit Header */}
          <div className="bg-[#005AA9] p-4 text-white" id="audit-header">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs bg-orange-500 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider text-white">
                Checklist em andamento
              </span>
              <button
                onClick={() => {
                  if (confirm('Deseja cancelar o checklist atual? Suas alterações serão perdidas.')) {
                    setCurrentStep('init');
                  }
                }}
                className="text-xs text-blue-200 hover:text-[#F58220] hover:underline font-bold p-1 transition-colors"
                id="btn-cancel-audit-session"
              >
                Voltar/Cancelar
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border-t border-blue-800/60 pt-3 mt-1 font-medium">
              <div>
                <span className="text-blue-200 block font-light">Data:</span>
                <span className="font-semibold text-gray-100">{checklistDate.split('-').reverse().join('/')}</span>
              </div>
              <div>
                <span className="text-blue-200 block font-light">Filial:</span>
                <span className="font-semibold text-gray-100">{selectedFilialObj ? `${selectedFilialObj.codigo} - ${selectedFilialObj.nome}` : ''}</span>
              </div>
              <div>
                <span className="text-blue-200 block font-light">Setor:</span>
                <span className="font-semibold text-[#F58220]">{selectedSetorObj?.nome}</span>
              </div>
              <div>
                <span className="text-blue-200 block font-light">Líder:</span>
                <span className="font-semibold text-gray-100 truncate block">{responsavelName}</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white space-y-4" id="audit-content">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 font-semibold" id="audit-error">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-600 text-sm p-4 rounded-xl border border-emerald-100 font-bold text-center flex items-center justify-center gap-2" id="audit-success">
                <Check className="w-5 h-5 animate-bounce" /> {successMsg}
              </div>
            )}

            {/* Time Saving Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-blue-50 border border-blue-100 rounded-xl gap-3">
              <div>
                <h4 className="text-xs font-extrabold text-[#005AA9] uppercase tracking-wide">Dica de Produtividade</h4>
                <p className="text-xs text-gray-600 mt-0.5">Se a maioria dos promotores estiver presente hoje, use o atalho:</p>
              </div>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="bg-[#005AA9] hover:bg-blue-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap self-end sm:self-center"
                id="btn-mark-all-present"
              >
                👍 Marcar Todos como Presentes
              </button>
            </div>

            {/* Agências Checklist Container */}
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Promotores de Agências para auditar ({filteredSuppliers.length})</h3>

            <div className="space-y-4 divide-y divide-gray-100" id="promoters-audit-list">
              {filteredSuppliers.map((supplier) => {
                const currentStatus = statuses[supplier.id];
                const scheduledDays = supplier.dias_atendimento || ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
                const isScheduledToday = scheduledDays.includes(currentDayName);
                
                return (
                  <div
                    key={supplier.id}
                    className="pt-4 first:pt-0 flex flex-col gap-3"
                    id={`audit-block-${supplier.id}`}
                  >
                    {/* Header line for each promoter */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isScheduledToday ? 'bg-[#F58220]' : 'bg-gray-300'}`}></span>
                          <h4 className="text-sm font-bold text-gray-800">{supplier.nome}</h4>
                        </div>
                        {!isScheduledToday && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/50 px-1.5 py-0.5 rounded font-extrabold uppercase w-fit">
                            Fora de Escala hoje
                          </span>
                        )}
                      </div>
                      {/* Highlight current indicator if selected */}
                      {currentStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_CONFIGS[currentStatus].bg} ${STATUS_CONFIGS[currentStatus].color} ${STATUS_CONFIGS[currentStatus].border}`} id={`badge-current-status-${supplier.id}`}>
                          {STATUS_CONFIGS[currentStatus].icon} {STATUS_CONFIGS[currentStatus].label}
                        </span>
                      )}
                    </div>

                    {/* Status Options - Tap selectors configured specially for mobile touch targets */}
                    <div className="grid grid-cols-2 gap-3 text-center" id={`status-buttons-${supplier.id}`}>
                      {(['presente', 'ausente'] as ChecklistStatus[]).map((st) => {
                        const isSelected = currentStatus === st;
                        const cfg = STATUS_CONFIGS[st];
                        
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(supplier.id, st)}
                            className={`py-3 px-2 text-xs rounded-xl flex flex-col items-center justify-center border font-bold gap-1 transition-all cursor-pointer active:scale-95 ${
                              isSelected
                                ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-[#005AA9] scale-102 font-extrabold shadow-sm`
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50/80 hover:border-gray-300'
                            }`}
                            id={`btn-status-${supplier.id}-${st}`}
                          >
                            <span className="text-lg sm:text-xl select-none">{cfg.icon}</span>
                            <span className="truncate w-full block">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Optional Observation input */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1 border border-gray-200/60" id={`obs-container-${supplier.id}`}>
                      <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input
                        id={`obs-val-${supplier.id}`}
                        type="text"
                        placeholder="Observação (Ex. Chegou atrasado, atestado até terça)"
                        value={observations[supplier.id] || ''}
                        onChange={(e) => handleObservationChange(supplier.id, e.target.value)}
                        className="w-full text-xs font-medium text-gray-600 bg-transparent py-1 border-none focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Buttons */}
            <div className="pt-6 border-t border-gray-100 flex gap-3" id="actions-save-section">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente voltar? O progresso deste checklist será perdido.')) {
                    setCurrentStep('init');
                  }
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-center text-sm transition-all cursor-pointer"
                id="btn-return-init"
              >
                Voltar
              </button>
              <button
                id="btn-save-conclude-checklist"
                type="button"
                onClick={handleSubmitAudit}
                className="flex-1 bg-[#F58220] hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" /> Concluir e Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
