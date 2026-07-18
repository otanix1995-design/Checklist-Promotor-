/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChecklistRecord, Filial, Setor, Fornecedor } from '../types';
import { Calendar, FileDown, Eye, RefreshCw, Send, Search, CheckCircle, HelpCircle, AlertCircle, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportsProps {
  checklists: ChecklistRecord[];
  filiais: Filial[];
  setores: Setor[];
  fornecedores: Fornecedor[];
  onClearHistory: () => void;
}

export default function Reports({ checklists, filiais, setores, fornecedores, onClearHistory }: ReportsProps) {
  // Clear Confirmation Modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

    const totalItems = latestSessionRecords.length;

    // Define compact properties dynamically based on the total items to guarantee a perfect 1-page fit:
    let numCols = 3;
    let colWidth = 86;
    let gapX = 8;
    let startX = 14;
    let startY = 58;
    let rowHeight = 9.5;
    let fontSize = 9.5;
    let obsFontSize = 7.5;
    let checkboxSize = 5.0;

    if (totalItems <= 27) {
      // 3 columns, very spacious
      numCols = 3;
      colWidth = 86;
      gapX = 8;
      startX = 14;
      startY = 60;
      rowHeight = 10.5;
      fontSize = 9.5;
      obsFontSize = 7.5;
      checkboxSize = 5.0;
    } else if (totalItems <= 36) {
      // 3 columns, normal
      numCols = 3;
      colWidth = 86;
      gapX = 8;
      startX = 14;
      startY = 59;
      rowHeight = 8.5;
      fontSize = 9.0;
      obsFontSize = 7.0;
      checkboxSize = 4.5;
    } else if (totalItems <= 48) {
      // 4 columns, compact
      numCols = 4;
      colWidth = 63;
      gapX = 6;
      startX = 12;
      startY = 58;
      rowHeight = 8.0;
      fontSize = 8.0;
      obsFontSize = 6.5;
      checkboxSize = 4.0;
    } else if (totalItems <= 65) {
      // 5 columns, compact
      numCols = 5;
      colWidth = 51;
      gapX = 5;
      startX = 10;
      startY = 58;
      rowHeight = 7.5;
      fontSize = 7.5;
      obsFontSize = 6.0;
      checkboxSize = 3.6;
    } else if (totalItems <= 90) {
      // 5 columns, extra compact
      numCols = 5;
      colWidth = 51;
      gapX = 5;
      startX = 10;
      startY = 58;
      rowHeight = 6.2;
      fontSize = 7.0;
      obsFontSize = 5.5;
      checkboxSize = 3.2;
    } else {
      // 6 columns, super compact for extreme cases (90+ up to 120 or more)
      numCols = 6;
      colWidth = 43;
      gapX = 4;
      startX = 8;
      startY = 58;
      rowHeight = 5.2;
      fontSize = 6.5;
      obsFontSize = 5.0;
      checkboxSize = 2.8;
    }

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
        doc.rect(colX, rowY - checkboxSize + 0.5, checkboxSize, checkboxSize, 'F');
        
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.6);
        doc.line(colX + checkboxSize * 0.24, rowY - checkboxSize * 0.44, colX + checkboxSize * 0.44, rowY - checkboxSize * 0.24);
        doc.line(colX + checkboxSize * 0.44, rowY - checkboxSize * 0.24, colX + checkboxSize * 0.8, rowY - checkboxSize * 0.7);
      } else {
        // Unchecked (Ausente) state: Empty square checkbox with red border and custom soft red X inside
        doc.setDrawColor(239, 68, 68); // Soft Red for Ausente
        doc.setFillColor(254, 242, 242); // very light red background
        doc.rect(colX, rowY - checkboxSize + 0.5, checkboxSize, checkboxSize, 'FD');

        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.4);
        doc.line(colX + checkboxSize * 0.28, rowY - checkboxSize * 0.62, colX + checkboxSize * 0.72, rowY - checkboxSize * 0.18);
        doc.line(colX + checkboxSize * 0.72, rowY - checkboxSize * 0.62, colX + checkboxSize * 0.28, rowY - checkboxSize * 0.18);
      }

      // Supplier text label - slightly lifted to fit observation line
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      
      // Truncate name safely so it never overlaps or wraps awkwardly
      const truncatedName = doc.splitTextToSize(supplierName, colWidth - (checkboxSize + 5))[0];
      doc.text(truncatedName, colX + checkboxSize + 3, rowY - 1.5);

      // Render optional observation text (e.g. "Hoje não é dia de Atendimento")
      if (rec.observacao) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(obsFontSize);
        doc.setTextColor(100, 116, 139); // Slate-500
        const truncatedObs = doc.splitTextToSize(rec.observacao, colWidth - (checkboxSize + 5))[0];
        doc.text(truncatedObs, colX + checkboxSize + 3, rowY + 1.2);
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

    // Stats values matching all session records
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
    doc.text('PÁGINA 1 DE 1', docWidth - 15, docHeight - 6, { align: 'right' });

    const formattedFileName = `PromotorCheck_UltimoRelatorio_${latest.data.replace(/-/g, '')}.pdf`;
    
    // 1. Try native mobile sharing (best for Android WebView / APK Wrappers)
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], formattedFileName, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: 'Relatório PDF',
          text: 'Relatório do Checklist de Promotores Atacadão'
        });
        return; // Success! Sharing/Saving handled by native sheet
      } catch (err: any) {
        if (err && err.name === 'AbortError') {
          return; // User cancelled, do nothing
        }
        console.error('Erro ao compartilhar PDF, usando fallback:', err);
      }
    }

    // 2. Try showSaveFilePicker if supported (mostly desktop Chrome)
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
  const exportToExcel = async () => {
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
    
    // Check if we can share the Excel file (best for APK / WebView)
    try {
      const excelOutput = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelOutput], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const excelFile = new File([excelBlob], formattedFileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      if (navigator.canShare && navigator.canShare({ files: [excelFile] })) {
        try {
          await navigator.share({
            files: [excelFile],
            title: 'Relatório Excel',
            text: 'Relatório do Checklist de Promotores Atacadão (Excel)'
          });
          return; // Success! Native sharing sheet handled it
        } catch (shareErr: any) {
          if (shareErr && shareErr.name === 'AbortError') {
            return; // User cancelled, do nothing
          }
          console.error('Erro ao compartilhar Excel:', shareErr);
        }
      }
    } catch (e) {
      console.error('Falha ao preparar arquivo Excel para compartilhamento:', e);
    }

    // Standard download fallback
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
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md active:scale-95"
            id="btn-clear-history-database"
            title="Excluir de forma definitiva todo o histórico de lançamentos"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar Histórico
          </button>

          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
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
          {(() => {
            const isCompactTable = totalPrevistos > 20;
            const tableCellPadding = isCompactTable ? (totalPrevistos > 50 ? "p-1.5" : "p-2.5") : "p-3.5";
            const tableFontSize = isCompactTable ? (totalPrevistos > 50 ? "text-[10.5px]" : "text-[11.5px]") : "text-xs";

            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" id="reports-table-card">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700">Lançamentos Detalhados</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                    Filtrados: {totalPrevistos}
                  </span>
                </div>

                <div className="overflow-x-auto" id="table-scroll">
                  <table className={`w-full text-left ${tableFontSize} border-collapse`}>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100">
                        <th className={tableCellPadding}>Data/Hora</th>
                        <th className={tableCellPadding}>Filial</th>
                        <th className={tableCellPadding}>Setor</th>
                        <th className={tableCellPadding}>Líder</th>
                        <th className={tableCellPadding}>Agência</th>
                        <th className={tableCellPadding}>Status</th>
                        <th className={tableCellPadding}>Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                      {matchingRecords.map((item) => {
                        const leg = STATUS_LEGENDS[item.status] || { label: item.status, icon: '', color: 'bg-gray-100 text-gray-600' };
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className={`${tableCellPadding} whitespace-nowrap`}>
                              <span className="font-bold text-gray-900 block">{item.data.split('-').reverse().join('/')}</span>
                              <span className="font-mono text-[9px] text-gray-400 block mt-0.5">{item.hora}</span>
                            </td>
                            <td className={`${tableCellPadding} font-bold text-indigo-950 whitespace-nowrap`}>{getFilialLabel(item.filial_id)}</td>
                            <td className={`${tableCellPadding} text-gray-800 whitespace-nowrap`}>{getSetorLabel(item.setor_id)}</td>
                            <td className={`${tableCellPadding} whitespace-nowrap truncate max-w-[120px]`} title={item.responsavel}>{item.responsavel}</td>
                            <td className={`${tableCellPadding} font-bold text-gray-900 whitespace-nowrap`}>{getFornecedorLabel(item.fornecedor_id)}</td>
                            <td className={`${tableCellPadding} whitespace-nowrap`}>
                              <span className={`px-2 py-0.5 text-[9.5px] font-extrabold rounded-full border ${leg.color} inline-flex items-center gap-1 shadow-2xs`}>
                                <span className="text-xs select-none">{leg.icon}</span> {leg.label}
                              </span>
                            </td>
                            <td className={`${tableCellPadding} text-gray-500 max-w-[160px] truncate`} title={item.observacao || '-'}>
                              {item.observacao || <span className="text-gray-300">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Confirmation Modal overlay */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="clear-confirm-modal-overlay">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-fade animate-duration-200" id="clear-confirm-modal-box">
            <div className={checklists.length === 0 ? "h-1.5 bg-[#005AA9]" : "h-1.5 bg-rose-500"}></div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${checklists.length === 0 ? 'bg-blue-50 text-[#005AA9]' : 'bg-rose-50 text-rose-600'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-gray-900">
                    {checklists.length === 0 ? "Histórico Vazio" : "Limpar todo o Histórico?"}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {checklists.length === 0 ? (
                      "Não há nenhum lançamento salvo no histórico para limpar atualmente neste dispositivo."
                    ) : (
                      <>
                        Esta ação é definitiva e apagará todos os <strong>{checklists.length} lançamentos</strong> salvos neste dispositivo. 
                        Se houver pendências de sincronização offline, elas também serão perdidas de forma permanente.
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                {checklists.length === 0 ? (
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-[#005AA9] hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-all shadow-sm active:scale-95"
                    id="btn-ok-clear-history"
                  >
                    Entendido
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs cursor-pointer transition-all"
                      id="btn-cancel-clear-history"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        onClearHistory();
                        setShowClearConfirm(false);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      id="btn-confirm-clear-history"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Confirmar e Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
