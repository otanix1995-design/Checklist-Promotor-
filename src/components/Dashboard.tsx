/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChecklistRecord, Filial, Setor } from '../types';
import { ChartPie, Users, Calendar, Filter, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardProps {
  checklists: ChecklistRecord[];
  filiais: Filial[];
  setores: Setor[];
}

export default function Dashboard({ checklists, filiais, setores }: DashboardProps) {
  // Filters state
  const [filterFilialId, setFilterFilialId] = useState('all');
  const [filterSetorId, setFilterSetorId] = useState('all');
  const [filterDate, setFilterDate] = useState(() => {
    // Default to last recorded date, or today
    if (checklists.length > 0) {
      // Find latest date in checklist records
      const dates = checklists.map(c => c.data);
      return dates.sort((a,b) => b.localeCompare(a))[0];
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Reset filters
  const handleResetFilters = () => {
    setFilterFilialId('all');
    setFilterSetorId('all');
    if (checklists.length > 0) {
      const dates = checklists.map(c => c.data);
      setFilterDate(dates.sort((a,b) => b.localeCompare(a))[0]);
    } else {
      const today = new Date();
      setFilterDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    }
  };

  // Filter checklists
  const filteredRecords = checklists.filter(r => {
    if (filterFilialId !== 'all' && r.filial_id !== filterFilialId) return false;
    if (filterSetorId !== 'all' && r.setor_id !== filterSetorId) return false;
    if (filterDate && r.data !== filterDate) return false;
    return true;
  });

  // Calculate metrics
  const total = filteredRecords.length;
  const presentes = filteredRecords.filter(r => r.status === 'presente').length;
  const ausentes = filteredRecords.filter(r => r.status === 'ausente').length;
  
  // Presence rate: Presents / Total or standard presents / total.
  // Calculated as presents / total * 100
  const taxaPresenca = total > 0 ? Math.round((presentes / total) * 100) : 0;

  // SVG Gauge Calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (taxaPresenca / 100) * circumference;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" id="dashboard-wrapper">
      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4" id="dashboard-filters-card">
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
            <Filter className="w-4 h-4 text-[#005AA9]" />
            <h3>Filtros do Painel</h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            id="btn-reset-dash-filters"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filial</label>
            <select
              id="dash-filter-filial"
              value={filterFilialId}
              onChange={(e) => setFilterFilialId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9] focus:bg-white"
            >
              <option value="all">Todas as Filiais</option>
              {filiais.map(f => (
                <option key={f.id} value={f.id}>{f.codigo} - {f.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Setor</label>
            <select
              id="dash-filter-setor"
              value={filterSetorId}
              onChange={(e) => setFilterSetorId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9] focus:bg-white"
            >
              <option value="all">Todos os Setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Data de Referência</label>
            <input
              id="dash-filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center flex flex-col items-center justify-center shadow-xs">
          <AlertTriangle className="text-amber-500 w-12 h-12 mb-3 animate-pulse" />
          <p className="text-gray-700 font-bold text-base">Sem registros encontrados!</p>
          <p className="text-gray-500 text-xs mt-1 max-w-md">Não há lançamentos de presença de agências neste setor ou data. Lembre-se de iniciar e salvar um Checklist Diário.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-displays-grid">
          {/* Main Presence Circle Chart Container */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Taxa de Presença</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-gray-100"
                  strokeWidth="11"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-[#005AA9] transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Value inside path */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-gray-800">{taxaPresenca}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Cobertura</span>
              </div>
            </div>

            <div className="mt-4 text-xs font-medium text-gray-600 px-4">
              <span className="font-extrabold text-[#005AA9]">{presentes}</span> de <span className="font-bold text-gray-800">{total}</span> promotores previstos estão presentes na data selecionada.
            </div>
          </div>

          {/* Indicators Bento Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4" id="dashboard-metricas-grid">
            {/* Total scheduled */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Previstos</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{total}</span>
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-3 border-t border-gray-50 pt-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" /> Promotores agendados
              </div>
            </div>

            {/* Presente */}
            <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Presentes</span>
                <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{presentes}</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-3 border-t border-emerald-100/60 pt-2 flex items-center gap-1.5">
                <span className="text-base select-none">✅</span> {total > 0 ? Math.round((presentes/total)*100) : 0}% de presença
              </div>
            </div>

            {/* Ausente */}
            <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Ausências</span>
                <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{ausentes}</span>
              </div>
              <div className="text-[10px] text-rose-600 font-semibold mt-3 border-t border-rose-100/60 pt-2 flex items-center gap-1.5">
                <span className="text-base select-none">❌</span> {total > 0 ? Math.round((ausentes/total)*100) : 0}% faltas
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
