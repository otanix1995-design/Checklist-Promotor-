/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChecklistRecord, Filial, Setor, Fornecedor } from '../types';
import { Calendar, FileDown, Eye, RefreshCw, Send, Search, CheckCircle, HelpCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportsProps {
  checklists: ChecklistRecord[];
  filiais: Filial[];
  setores: Setor[];
  fornecedores: Fornecedor[];
}

export default function Reports({ checklists, filiais, setores, fornecedores }: ReportsProps) {
  // Query Filters state
  const [startDate, setStartDate] = useState(() => {
    // Current date - 7 days for a rolling view
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [filterFilialId, setFilterFilialId] = useState('all');
  const [filterSetorId, setFilterSetorId] = useState('all');
  const [filterFornecedorId, setFilterFornecedorId] = useState('all');

  const handleResetFilters = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    setStartDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    
    const today = new Date();
    setEndDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    
    setFilterFilialId('all');
    setFilterSetorId('all');
    setFilterFornecedorId('all');
  };

  // Perform filtering
  const matchingRecords = checklists.filter(r => {
    // Time constraint
    if (r.data < startDate || r.data > endDate) return false;
    
    // Other dimensions
    if (filterFilialId !== 'all' && r.filial_id !== filterFilialId) return false;
    if (filterSetorId !== 'all' && r.setor_id !== filterSetorId) return false;
    if (filterFornecedorId !== 'all' && r.fornecedor_id !== filterFornecedorId) return false;
    
    return true;
  });

  // Calculate Metrics based on result query
  const totalPrevistos = matchingRecords.length;
  const qtyPresents = matchingRecords.filter(r => r.status === 'presente').length;
  const qtyAbsents = matchingRecords.filter(r => r.status === 'ausente').length;
  
  // Taxa de Cobertura is standard presence index matching matchingRecords: Presentes / Total
  const coverageRate = totalPrevistos > 0 ? Math.round((qtyPresents / totalPrevistos) * 100) : 0;

  // Status Labels and icons
  const STATUS_LEGENDS: Record<string, { label: string; icon: string; color: string }> = {
    presente: { label: 'Presente', icon: '✅', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    ausente: { label: 'Ausente', icon: '❌', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  };

  // Helper to convert DB objects for readability
  const getFilialLabel = (id: string) => {
    const f = filiais.find(item => item.id === id);
    return f ? `${f.codigo} - ${f.nome}` : 'Filial Excluída';
  };

  const getSetorLabel = (id: string) => {
    const s = setores.find(item => item.id === id);
    return s ? s.nome : 'Setor Excluído';
  };

  const getFornecedorLabel = (id: string) => {
    const p = fornecedores.find(item => item.id === id);
    return p ? p.nome : 'Agência Excluída';
  };

  const exportToPDF = async () => {
    if (matchingRecords.length === 0) {
      alert('Não existem registros para exportar PDF.');
      return;
    }

    // Sort to obtain the latest checklist session
    const sortedRecords = [...matchingRecords].sort((a, b) => {
      const dComp = b.data.localeCompare(a.data);
      if (dComp !== 0) return dComp;
      return b.hora.localeCompare(a.hora);
    });

    const latest = sortedRecords[0];
    if (!latest) {
      alert('Não existem registros para exportar PDF.');
      return;
    }

    // Filter to include only records from that latest date, time, filial, and sector
    const latestSessionRecords = matchingRecords.filter(r => 
      r.data === latest.data && 
      r.hora === latest.hora && 
      r.filial_id === latest.filial_id &&
      r.setor_id === latest.setor_id
    );

    // Initialize document in LANDSCAPE mode
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const docWidth = doc.internal.pageSize.getWidth(); // 297 mm
    const docHeight = doc.internal.pageSize.getHeight(); // 210 mm

    // Drawing the top Orange Banner matching "Bom dia PromotorCheck list"
    doc.setFillColor(245, 130, 32); // Atacadão Orange #F58220
    doc.rect(10, 10, docWidth - 20, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Bom dia PromotorCheck list', 14, 20);

    // Metadata Row underneath the Orange Title Bar
    doc.setTextColor(0, 90, 169); // Atacadão Blue #005AA9
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA:', 12, 34);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const formattedDate = latest.data.split('-').reverse().join('/');
    doc.text(formattedDate, 26, 34);
    
    // Underline style under date value
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.3);
    doc.line(26, 35, 55, 35);

    doc.setTextColor(0, 90, 169); // Atacadão Blue
    doc.setFont('helvetica', 'bold');
    doc.text('FILIAL:', 62, 34);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const filialLabel = getFilialLabel(latest.filial_id);
    doc.text(filialLabel, 78, 34);
    doc.line(78, 35, 175, 35);

    doc.setTextColor(0, 90, 169); // Atacadão Blue
    doc.setFont('helvetica', 'bold');
    doc.text('RESPONSÁVEL:', 182, 34);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const headerResponsavel = latest.responsavel || '-';
    doc.text(headerResponsavel, 214, 34);
    doc.line(214, 35, docWidth - 12, 35);

    // Draw Sector Banner/Header
    doc.setFillColor(245, 130, 32); // Atacadão Orange #F58220
    doc.rect(10, 42, docWidth - 20, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const sectorLabel = getSetorLabel(latest.setor_id).toUpperCase();
    doc.text(sectorLabel, 14, 47.5);

    // Display checklist records in exactly 3 columns horizontally to guarantee single-page fit.
    const startX = 14;
    const startY = 60;
    const colWidth = 86;
    const gapX = 8;
    const rowHeight = 11;
    const numCols = 3;

    latestSessionRecords.forEach((rec, idx) => {
      const colIndex = idx % numCols;
      const rowIndex = Math.floor(idx / numCols);

      const colX = startX + colIndex * (colWidth + gapX);
      const rowY = startY + rowIndex * rowHeight;

      const supplierName = getFornecedorLabel(rec.fornecedor_id).toUpperCase();

      // Checkbox design based on status from checklist screen
      if (rec.status === 'presente') {
        // Checked state: Fill with green and draw checkmark
        doc.setFillColor(16, 185, 129); // Emerald Green
        doc.rect(colX, rowY - 4.5, 5, 5, 'F');
        
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.6);
        doc.line(colX + 1.2, rowY - 2.2, colX + 2.2, rowY - 1.2);
        doc.line(colX + 2.2, rowY - 1.2, colX + 4.0, rowY - 3.5);
      } else {
        // Unchecked (Ausente) state: Empty square checkbox with red border and custom soft red X inside
        doc.setDrawColor(239, 68, 68); // Soft Red for Ausente
        doc.setFillColor(254, 242, 242); // very light red background
        doc.rect(colX, rowY - 4.5, 5, 5, 'FD');

        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.4);
        doc.line(colX + 1.4, rowY - 3.1, colX + 3.6, rowY - 0.9);
        doc.line(colX + 3.6, rowY - 3.1, colX + 1.4, rowY - 0.9);
      }

      // Supplier text label - slightly lifted to fit observation line
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(supplierName, colX + 8, rowY - 1.5);

      // Render optional observation text (e.g. "Hoje não é dia de Atendimento")
      if (rec.observacao) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(rec.observacao, colX + 8, rowY + 1.2);
      }

      // Light underline separator under this supplier element
      doc.setDrawColor(241, 245, 249); // Slate-100 (subtle)
      doc.setLineWidth(0.2);
      doc.line(colX, rowY + 2.0, colX + colWidth - 2, rowY + 2.0);
    });

    // Draw professional single-page Statistics & Legends Bar at the absolute bottom
    const statsY = 175;
    // Slate-50 background for statistics
    doc.setFillColor(248, 250, 252);
    doc.rect(10, statsY, docWidth - 20, 20, 'F');
    // Border around stats
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.4);
    doc.rect(10, statsY, docWidth - 20, 20, 'S');

    // Stats values
    const total = latestSessionRecords.length;
    const presentes = latestSessionRecords.filter(r => r.status === 'presente').length;
    const ausentes = latestSessionRecords.filter(r => r.status === 'ausente').length;
    const tx = total > 0 ? Math.round((presentes / total) * 100) : 0;

    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RESUMO DE PRESENÇA', 16, statsY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`TOTAL PREVISTO: ${total} AGÊNCIAS`, 16, statsY + 14);

    // Presentes box indicator
    doc.setFillColor(16, 185, 129); // Green
    doc.rect(100, statsY + 6, 4, 4, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`PRESENTES: ${presentes}`, 106, statsY + 9.5);

    // Ausentes box indicator
    doc.setFillColor(239, 68, 68); // Red
    doc.rect(100, statsY + 12, 4, 4, 'F');
    doc.text(`AUSENTES: ${ausentes}`, 106, statsY + 15.5);

    // High coverage indicator pill on the right
    doc.setFillColor(0, 90, 169); // Atacadão Blue
    doc.rect(200, statsY + 4, 75, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`ÍNDICE DE PRESENÇA: ${tx}%`, 205, statsY + 11.5);

    // Page footer bottom center
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('GERADO AUTOMATICAMENTE POR PROMOTORCHECK • ATACADÃO S.A.', docWidth / 2, docHeight - 6, { align: 'center' });

    const formattedFileName = `PromotorCheck_UltimoRelatorio_${latest.data.replace(/-/g, '')}.pdf`;
    
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: formattedFileName,
          types: [{
            description: 'Documento PDF (*.pdf)',
            accept: {
              'application/pdf': ['.pdf']
            }
          }]
        });
        const writable = await handle.createWritable();
        const pdfOutput = doc.output('arraybuffer');
        await writable.write(pdfOutput);
        await writable.close();
      } catch (err: any) {
        if (err && err.name !== 'AbortError') {
          console.error('Erro ao salvar PDF via showSaveFilePicker, usando fallback:', err);
          doc.save(formattedFileName);
        }
      }
    } else {
      doc.save(formattedFileName);
    }
  };

  // Excel Export Flow
  const exportToExcel = () => {
    if (matchingRecords.length === 0) {
      alert('Não existem registros para exportar Excel.');
      return;
    }

    // Convert keys to clean dictionary
    const formattedRows = matchingRecords.map(r => ({
      'Data Lançamento': r.data.split('-').reverse().join('/'),
      'Hora Lançamento': r.hora,
      'Filial Atacadão': getFilialLabel(r.filial_id),
      'Setor Loja': getSetorLabel(r.setor_id),
      'Líder Responsável': r.responsavel,
      'Agência': getFornecedorLabel(r.fornecedor_id),
      'Status Presença': r.status.toUpperCase(),
      'Observações': r.observacao || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    
    // Autofilter and size adjustments if needed
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Checklist Registros');
    
    const formattedFileName = `PromotorCheck_Relatorio_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(workbook, formattedFileName);
  };

  // WhatsApp Share Message Formatter
  const shareToWhatsApp = () => {
    if (matchingRecords.length === 0) {
      alert('Não existem registros para compartilhar.');
      return;
    }

    const filialText = filterFilialId === 'all' ? 'Todas as Filiais' : getFilialLabel(filterFilialId);
    const setorText = filterSetorId === 'all' ? 'Todos os Setores' : getSetorLabel(filterSetorId);

    const message = `📊 *PROMOTORCHECK - RELATÓRIO DO CONTROLE DE PRESENÇA*
---------------------------------------
📅 *Período:* ${startDate.split('-').reverse().join('/')} até ${endDate.split('-').reverse().join('/')}
🏪 *Filial:* ${filialText}
🛍️ *Setor:* ${setorText}
---------------------------------------
📋 *RESUMO:*
👥 *Total Agências Previstas:* ${totalPrevistos}
✅ Presentes: ${qtyPresents}
❌ Ausentes: ${qtyAbsents}

📈 *TAXA DE PRESENÇA (COBERTURA):* ${coverageRate}%
---------------------------------------
_Gerado de forma offline pelo aplicativo PromotorCheck do Atacadão._`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" id="reports-and-queries-wrapper">
      
      {/* Search Filter Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" id="reports-filters-card">
        <div className="flex items-center gap-2 text-gray-700 font-bold text-sm mb-4">
          <Search className="w-4 h-4 text-[#005AA9]" />
          <h2>Filtros Avançados</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3" id="filters-controls-grid">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Data Inicial</label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Data Final</label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filial</label>
            <select
              id="report-filter-filial"
              value={filterFilialId}
              onChange={(e) => setFilterFilialId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
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
              id="report-filter-setor"
              value={filterSetorId}
              onChange={(e) => {
                setFilterSetorId(e.target.value);
                setFilterFornecedorId('all'); // Reset supplier on sector change
              }}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
            >
              <option value="all">Todos os Setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Agência</label>
            <select
              id="report-filter-fornecedor"
              value={filterFornecedorId}
              onChange={(e) => setFilterFornecedorId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005AA9]"
            >
              <option value="all">Ver Todos</option>
              {fornecedores
                .filter(f => filterSetorId === 'all' || f.setor_id === filterSetorId)
                .map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex md:justify-end gap-2 mt-4 pt-4 border-t border-gray-50 flex-col sm:flex-row" id="filters-actions-box">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
            id="btn-clear-report-filters"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Limpar Filtros
          </button>
        </div>
      </div>

      {matchingRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center flex flex-col items-center justify-center shadow-xs">
          <AlertCircle className="text-gray-400 w-12 h-12 mb-3" />
          <p className="text-gray-700 font-bold text-base">Nenhum lançamento no período!</p>
          <p className="text-gray-500 text-xs mt-1 max-w-sm">Ajuste os filtros de data superior ou inicie novos checklists para popular esta tabela de histórico.</p>
        </div>
      ) : (
        <>
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="reports-quick-metrics">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Registros Lançados</span>
              <span className="text-xl font-extrabold text-gray-800 mt-1 block">{totalPrevistos}</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Qtd Presenças</span>
              <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{qtyPresents}</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Qtd Ausências</span>
              <span className="text-xl font-extrabold text-rose-700 mt-1 block">{qtyAbsents}</span>
            </div>
            <div className="bg-[#005AA9]/5 rounded-xl p-4 border border-[#005AA9]/10 shadow-xs">
              <span className="text-[10px] font-bold text-[#005AA9] uppercase tracking-wider block">Taxa de Cobertura</span>
              <span className="text-xl font-extrabold text-[#005AA9] mt-1 block">{coverageRate}%</span>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-gray-600 font-bold">
              📂 Pronto para exportar {totalPrevistos} lançamentos consultados:
            </span>
            <div className="flex gap-2 flex-wrap w-full sm:w-auto" id="export-buttons">
              <button
                onClick={exportToPDF}
                className="flex-1 sm:flex-initial bg-[#F58220] hover:bg-orange-600 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                id="btn-export-pdf"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                id="btn-export-excel"
              >
                <FileDown className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={shareToWhatsApp}
                className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                id="btn-export-whatsapp"
              >
                <Send className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" id="reports-table-card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Lançamentos Detalhados</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                Filtrados: {totalPrevistos}
              </span>
            </div>

            <div className="overflow-x-auto" id="table-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100">
                    <th className="p-3.5">Data/Hora</th>
                    <th className="p-3.5">Filial</th>
                    <th className="p-3.5">Setor</th>
                    <th className="p-3.5">Líder</th>
                    <th className="p-3.5">Agência</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {matchingRecords.map((item) => {
                    const leg = STATUS_LEGENDS[item.status] || { label: item.status, icon: '', color: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-bold text-gray-900 block">{item.data.split('-').reverse().join('/')}</span>
                          <span className="font-mono text-[9px] text-gray-400 block mt-0.5">{item.hora}</span>
                        </td>
                        <td className="p-3.5 font-bold text-indigo-950 whitespace-nowrap">{getFilialLabel(item.filial_id)}</td>
                        <td className="p-3.5 text-gray-800 whitespace-nowrap">{getSetorLabel(item.setor_id)}</td>
                        <td className="p-3.5 whitespace-nowrap truncate max-w-[120px]" title={item.responsavel}>{item.responsavel}</td>
                        <td className="p-3.5 font-bold text-gray-900 whitespace-nowrap">{getFornecedorLabel(item.fornecedor_id)}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${leg.color} inline-flex items-center gap-1 shadow-2xs`}>
                            <span className="text-sm select-none">{leg.icon}</span> {leg.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-500 max-w-[160px] truncate" title={item.observacao || '-'}>
                          {item.observacao || <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
