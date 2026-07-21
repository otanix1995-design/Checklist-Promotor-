/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Filial, Setor, Fornecedor, ChecklistRecord } from './types';
import { OfflineDB } from './db';
import logoImage from './assets/images/app_logo_1783879634849.jpg';
import BranchManager from './components/BranchManager';
import SectorManager from './components/SectorManager';
import SupplierManager from './components/SupplierManager';
import ChecklistExecution from './components/ChecklistExecution';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import AtacadaoLogo from './components/AtacadaoLogo';

// Icons
import { 
  Home, 
  ClipboardCheck, 
  Database, 
  FileSpreadsheet, 
  Wifi, 
  WifiOff, 
  RefreshCcw, 
  Store, 
  Tag, 
  Briefcase,
  Grid,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function App() {
  // Database States
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);

  // Navigation (Tabs)
  // 'home' | 'checklist' | 'cadastros' | 'relatorios' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'home' | 'checklist' | 'cadastros' | 'relatorios' | 'dashboard'>('home');
  // Cadastros sub-tabs
  const [activeCadastroSubTab, setActiveCadastroSubTab] = useState<'filiais' | 'setores' | 'fornecedores'>('filiais');

  // Network and Sync
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Initial Database Load
  useEffect(() => {
    // Read from persistent local DB
    setFiliais(OfflineDB.getFiliais());
    setSetores(OfflineDB.getSetores());
    setFornecedores(OfflineDB.getFornecedores());
    setChecklists(OfflineDB.getChecklists());
    
    setPendingSyncCount(OfflineDB.getPendingSyncCount());
    setLastSyncTime(OfflineDB.getLastSyncTime());
  }, []);

  // Listen to Network Changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when returning online
      triggerCloudSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Routine
  const triggerCloudSync = async () => {
    const pending = OfflineDB.getPendingSyncCount();
    if (pending === 0) {
      setSyncStatusMsg('Tudo atualizado!');
      setTimeout(() => setSyncStatusMsg(''), 2000);
      return;
    }

    if (!navigator.onLine) {
      setSyncStatusMsg('Sem conexão com a internet.');
      setTimeout(() => setSyncStatusMsg(''), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Sincronizando com a nuvem...');

    try {
      const res = await OfflineDB.performSync();
      if (res.success) {
        setPendingSyncCount(0);
        setLastSyncTime(new Date().toISOString());
        setSyncStatusMsg(`Sincronizado! ${res.syncedCount} registros salvos no banco de dados.`);
      }
    } catch (error) {
      setSyncStatusMsg('Erro ao sincronizar. Tentando mais tarde.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  // State Save Handlers (Cascades from child pages to OfflineDB)
  const handleSaveFiliais = (updated: Filial[]) => {
    setFiliais(updated);
    OfflineDB.saveFiliais(updated);
  };

  const handleSaveSetores = (updated: Setor[]) => {
    setSetores(updated);
    OfflineDB.saveSetores(updated);
  };

  const handleSaveFornecedores = (updated: Fornecedor[]) => {
    setFornecedores(updated);
    OfflineDB.saveFornecedores(updated);
  };

  const handleSaveChecklistRecords = (newRecords: ChecklistRecord[]) => {
    // Commit new audit records
    OfflineDB.addChecklistRecords(newRecords);
    
    // Refresh local lists
    setChecklists(OfflineDB.getChecklists());
    setPendingSyncCount(OfflineDB.getPendingSyncCount());

    // Try background sync automatically if online
    if (navigator.onLine) {
      triggerCloudSync();
    }
  };

  const handleClearChecklistHistory = () => {
    OfflineDB.clearChecklistHistory();
    setChecklists([]);
    setPendingSyncCount(0);
  };

  const formattedDateString = () => {
    const today = new Date();
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    return `${days[today.getDay()]}, ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans" id="promotorcheck-root">
      
      {/* 1. SIDEBAR FOR DESKTOP (Professional Polish theme) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-screen shrink-0 sticky top-0 shadow-lg z-40 transition-all font-sans" id="desktop-sidebar">
        <div className="p-4 flex flex-col items-center border-b border-slate-100 bg-white">
          <img 
            src={logoImage} 
            alt="Checklist Promotor Logo" 
            className="w-44 h-auto rounded-xl object-contain hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5" id="sidebar-nav">
          {[
            { id: 'home', label: 'Dashboard', icon: Home },
            { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
            { id: 'cadastros', label: 'Cadastros', icon: Database },
            { id: 'dashboard', label: 'Painel Gráfico', icon: TrendingUp },
            { id: 'relatorios', label: 'Histórico', icon: FileSpreadsheet }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs tracking-wide cursor-pointer active:scale-98 ${
                  isActive
                    ? 'bg-[#006B3F] text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <IconComponent className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Sync Widget & Connection Badge */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <div className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider border transition-all ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            {isOnline ? 'Dispositivo Online' : 'Dispositivo Offline'}
          </div>
          
          <button
            onClick={triggerCloudSync}
            disabled={isSyncing}
            className="w-full flex items-center justify-center space-x-2 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all disabled:opacity-50 cursor-pointer active:scale-95 bg-white shadow-xs"
            title="Sincronizar com a nuvem"
          >
            <RefreshCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#F58220]' : ''}`} />
            <span>{isSyncing ? 'Sincronizando' : 'Sincronizar'}</span>
          </button>
          
          {pendingSyncCount > 0 && (
            <div className="text-[9px] text-center font-bold text-[#F58220] animate-pulse">
              ⚠️ {pendingSyncCount} checklist pendente
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN HUB (RESPONSIVE WRAPPER) */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden min-w-0">
        
        {/* Top Header Banner */}
        <header className="bg-gradient-to-r from-[#F96302] via-[#EE5900] to-[#D84900] text-white shadow-lg z-30 px-4 md:px-8 py-2.5 flex items-center justify-between border-b-2 border-[#C73E00]" id="top-banner">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center p-1 shadow-md border border-orange-200 shrink-0">
              {/* Green striped A icon */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M 50 10 L 85 85 L 65 85 L 50 52 L 35 85 L 15 85 Z" fill="#EE5900" />
                <path d="M 50 28 L 59 48 L 41 48 Z" fill="#FFFFFF" />
                <rect x="5" y="32" width="90" height="4" fill="#006B3F" rx="2" />
                <rect x="5" y="44" width="90" height="4" fill="#006B3F" rx="2" />
                <rect x="5" y="56" width="90" height="4" fill="#006B3F" rx="2" />
                <rect x="5" y="68" width="90" height="4" fill="#006B3F" rx="2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-xl font-black tracking-tight text-white font-sans uppercase">CHECKLIST PROMOTOR</span>
              <span className="text-[10px] md:text-xs text-orange-100 font-bold tracking-wider">Atacadão S.A.</span>
            </div>
          </div>

          {/* Right User & System Info Pill (Exact SAVEweb format) */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end text-[10px] md:text-xs text-white font-mono bg-white/10 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/20 shadow-xs">
              <div className="font-bold tracking-tight text-white/95">
                DB172 - Ver.1.40.24.1239
              </div>
              <div className="text-[9px] md:text-[10px] text-orange-100 flex items-center gap-1 font-semibold">
                <span>PROMOTOR : ATACADÃO - {new Date().toLocaleDateString('pt-BR')}</span>
                <span className="text-[8px]">▼</span>
              </div>
            </div>

            {/* Sync Action Button */}
            <button
              onClick={triggerCloudSync}
              disabled={isSyncing}
              className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors text-white text-xs flex items-center gap-1 border border-white/20 cursor-pointer active:scale-95"
              title="Sincronizar dados"
            >
              <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-white' : ''}`} />
              {pendingSyncCount > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingSyncCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* CONNECTIVITY ALERT NOTIFICATION */}
        {!isOnline && (
          <div className="bg-amber-500 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-inner" id="alert-offline">
            <WifiOff className="w-4 h-4 text-white" /> 
            <span>Você está temporariamente sem internet. O PromotorCheck salvará localmente e sincronizará automaticamente ao se reconectar.</span>
          </div>
        )}

        {syncStatusMsg && (
          <div className="bg-[#006B3F] text-white text-xs font-semibold px-4 py-2 text-center transition-all animate-fade shadow-sm" id="sync-toast-indicator">
            {syncStatusMsg}
          </div>
        )}

        {/* MAIN WORKSPACE BODY WITH SAVEweb ORANGE FRAME WINDOW */}
        <div className="flex-1 p-2 sm:p-4 md:p-6 bg-slate-100 flex flex-col items-center">
          <main className="w-full max-w-6xl bg-white border-4 md:border-8 border-[#EE5900] rounded-2xl md:rounded-3xl shadow-xl flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative min-h-[75vh]" id="app-main-body">
          
          {/* Welcome Dashboard Tab */}
          {activeTab === 'home' && (
            <div className="space-y-6" id="welcome-home-screen">
              
              {/* Atacadão Center Watermark Logo with Reflection (Identical to SAVEweb image) */}
              <div className="py-6 flex flex-col items-center justify-center border-b border-orange-100 bg-gradient-to-b from-orange-50/50 to-transparent rounded-2xl">
                <AtacadaoLogo className="h-16 md:h-20" showReflection={true} />
              </div>

              {/* Elegant Hero Welcome Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden relative" id="hero-card">
                {/* Brand orange accent banner */}
                <div className="h-2 bg-gradient-to-r from-[#F96302] via-[#EE5900] to-[#006B3F]"></div>
                
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-[#EE5900]" />
                      <span>{formattedDateString()}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                      Olá, Líder de Loja!
                    </h2>
                    <p className="text-slate-500 text-xs max-w-md font-medium leading-relaxed">
                      Sua filial conta com promotores agendados das agências parceiras. Realize a chamada de controle correspondente abaixo.
                    </p>
                  </div>

                  {/* Main Action Call button with transition scale active click */}
                  <button
                    id="hero-btn-start-checklist"
                    onClick={() => setActiveTab('checklist')}
                    className="bg-gradient-to-r from-[#EE5900] to-[#D84900] hover:from-[#D84900] hover:to-[#C73E00] text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer shrink-0 active:scale-95 text-center"
                  >
                    <ClipboardCheck className="w-4.5 h-4.5" /> Iniciar Checklist Diário
                  </button>
                </div>
              </div>

              {/* Quick Summary Numbers stylized to mirror border indicators from layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="home-brief-stats">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-[#006B3F] shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#006B3F] uppercase tracking-wider">Suas Filiais</h4>
                    <p className="text-gray-500 text-[11px] mt-1">Filiais cadastradas para acompanhamento comercial</p>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-black text-slate-800">{filiais.length}</span>
                    <button 
                      onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('filiais'); }} 
                      className="text-xs text-[#006B3F] font-bold hover:underline cursor-pointer"
                      id="btn-goto-branches"
                    >
                      Gerenciar filiais &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-[#EE5900] shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#EE5900] uppercase tracking-wider">Lançamentos Realizados</h4>
                    <p className="text-gray-500 text-[11px] mt-1">Registros totais acumulados no dispositivo local</p>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-black text-slate-800">{checklists.length}</span>
                    <button 
                      onClick={() => setActiveTab('relatorios')} 
                      className="text-xs text-[#EE5900] font-bold hover:underline cursor-pointer"
                      id="btn-goto-reports"
                    >
                      Visualizar relatórios &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Quick Access Grid */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs" id="quick-actions-pannel">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Acesso Rápido</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('filiais'); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50/50 hover:bg-orange-50/30 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                    id="card-nav-filiais"
                  >
                    <div className="p-2.5 bg-[#006B3F]/10 rounded-lg text-[#006B3F]">
                      <Store className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Filiais</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('setores'); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50/50 hover:bg-orange-50/30 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                    id="card-nav-setores"
                  >
                    <div className="p-2.5 bg-emerald-50 rounded-lg text-[#006B3F]">
                      <Tag className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Setores</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('fornecedores'); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50/50 hover:bg-orange-50/30 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                    id="card-nav-fornecedores"
                  >
                    <div className="p-2.5 bg-orange-50 rounded-lg text-[#EE5900]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Agências</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50/50 hover:bg-orange-50/30 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                    id="card-nav-dashboard"
                  >
                    <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Painel Gráfico</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'checklist' && (
            <ChecklistExecution
              filiais={filiais}
              setores={setores}
              fornecedores={fornecedores}
              onSave={handleSaveChecklistRecords}
              onBackToMenu={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'cadastros' && (
            <div className="space-y-6" id="crud-cadastros-container">
              {/* Quick switcher for registration fields */}
              <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm max-w-sm mx-auto flex" id="crud-switcher">
                <button
                  onClick={() => setActiveCadastroSubTab('filiais')}
                  className={`flex-1 py-2 rounded-lg font-bold text-[11px] uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                    activeCadastroSubTab === 'filiais' 
                      ? 'bg-[#006B3F] text-white shadow-xs' 
                      : 'text-gray-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  id="tab-cad-filiais"
                >
                  <Store className="w-3.5 h-3.5" /> Filiais
                </button>
                <button
                  onClick={() => setActiveCadastroSubTab('setores')}
                  className={`flex-1 py-2 rounded-lg font-bold text-[11px] uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                    activeCadastroSubTab === 'setores' 
                      ? 'bg-[#006B3F] text-white shadow-xs' 
                      : 'text-gray-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  id="tab-cad-setores"
                >
                  <Tag className="w-3.5 h-3.5" /> Setores
                </button>
                <button
                  onClick={() => setActiveCadastroSubTab('fornecedores')}
                  className={`flex-1 py-2 rounded-lg font-bold text-[11px] uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                    activeCadastroSubTab === 'fornecedores' 
                      ? 'bg-[#006B3F] text-white shadow-xs' 
                      : 'text-gray-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  id="tab-cad-fornecedores"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Agências
                </button>
              </div>

              {/* Displaying selected configuration panel */}
              <div className="transition-all animate-fade">
                {activeCadastroSubTab === 'filiais' && (
                  <BranchManager
                    filiais={filiais}
                    onSave={handleSaveFiliais}
                    onBack={() => setActiveTab('home')}
                  />
                )}
                {activeCadastroSubTab === 'setores' && (
                  <SectorManager
                    setores={setores}
                    onSave={handleSaveSetores}
                    onBack={() => setActiveTab('home')}
                  />
                )}
                {activeCadastroSubTab === 'fornecedores' && (
                  <SupplierManager
                    fornecedores={fornecedores}
                    setores={setores}
                    onSave={handleSaveFornecedores}
                    onBack={() => setActiveTab('home')}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'relatorios' && (
            <Reports
              checklists={checklists}
              filiais={filiais}
              setores={setores}
              fornecedores={fornecedores}
              onClearHistory={handleClearChecklistHistory}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              checklists={checklists}
              filiais={filiais}
              setores={setores}
            />
          )}

        </main>
        </div>

        {/* MOBILE ONLY NAVIGATION FOOTER (Refined Mobile Custom PWA touch target layout) */}
        <nav 
          className="md:hidden fixed bottom-1 left-3 right-3 bg-white border border-slate-200 shadow-xl px-2 py-1.5 flex items-center justify-around z-40 rounded-2xl"
          id="bottom-tab-navigation"
        >
          {[
            { id: 'home', label: 'Início', icon: Home },
            { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
            { id: 'cadastros', label: 'Cadastros', icon: Database },
            { id: 'dashboard', label: 'Painel', icon: TrendingUp },
            { id: 'relatorios', label: 'Histórico', icon: FileSpreadsheet }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center gap-1.5 py-1 px-2.5 rounded-xl font-bold transition-all text-[9px] uppercase tracking-wide cursor-pointer active:scale-95 ${
                  isActive ? 'text-[#006B3F] font-black scale-102 bg-emerald-50/70' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* DESKTOP FOOTER */}
        <footer className="hidden md:block py-4 bg-white border-t border-slate-200 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest" id="main-footer">
          <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
            <span>&copy; 2026 PromotorCheck • Todos os direitos reservados • Atacadão S.A.</span>
            <span className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
              Dispositivo: {isOnline ? 'Online 🟢' : 'Offline 🔴'}
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
