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
                    ? 'bg-[#005AA9] text-white shadow-md'
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
        
        {/* MOBILE ONLY TOP HEADER */}
        <header className="md:hidden bg-[#005AA9] text-white shadow-md sticky top-0 z-50 px-4 py-3" id="main-header">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-0.5 flex items-center justify-center shadow-xs">
                <img 
                  src={logoImage} 
                  alt="Logo" 
                  className="w-9 h-9 object-contain rounded-md"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-sm font-extrabold uppercase tracking-tight">Checklist Promotor</h1>
                <p className="text-[8px] text-blue-100 uppercase tracking-widest font-semibold">Atacadão Líder</p>
              </div>
            </div>

            {/* Mobile Sync indicators */}
            <div className="flex items-center gap-2">
              {pendingSyncCount > 0 && (
                <span className="bg-[#F58220] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                  {pendingSyncCount}p
                </span>
              )}
              <button
                onClick={triggerCloudSync}
                disabled={isSyncing}
                className="p-1 hover:bg-white/10 rounded transition-colors text-white disabled:opacity-50"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#F58220]' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* DESKTOP ONLY TOP BAR (Professional Polish style) */}
        <header className="hidden md:flex bg-white h-20 border-b border-slate-200 items-center justify-between px-8 shrink-0 shadow-sm" id="desktop-header">
          <div className="flex items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Atual</span>
              <span className="text-sm font-extrabold text-slate-800">{formattedDateString()}</span>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-6"></div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronização</span>
              <span className="text-sm font-bold text-slate-700">
                {lastSyncTime ? `Sincronizado: ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Apenas armazenamento local'}
              </span>
            </div>

            {pendingSyncCount > 0 && (
              <>
                <div className="h-8 w-px bg-slate-200 mx-6"></div>
                <div className="flex items-center gap-1.5 bg-orange-50 text-[#F58220] px-3 py-1 rounded-full border border-orange-100 font-semibold text-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F58220]"></span>
                  <span>{pendingSyncCount} alteração pendente</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ambiente de Operações</span>
              <span className="text-xs font-bold text-slate-700">Atacadão S.A.</span>
            </div>
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
          <div className="bg-[#005AA9] text-white text-xs font-semibold px-4 py-2 text-center transition-all animate-fade shadow-sm" id="sync-toast-indicator">
            {syncStatusMsg}
          </div>
        )}

        {/* MAIN WORKSPACE BODY */}
        <main className="flex-1 p-4 pb-24 md:p-8 max-w-6xl w-full mx-auto" id="app-main-body">
          
          {/* Welcome Dashboard Tab */}
          {activeTab === 'home' && (
            <div className="space-y-6" id="welcome-home-screen">
              
              {/* Elegant Hero Welcome Card */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden relative" id="hero-card">
                {/* Brand blue accent banner */}
                <div className="h-2 bg-[#005AA9]"></div>
                
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-[#F58220]" />
                      <span>{formattedDateString()}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                      Olá, Líder de Loja!
                    </h2>
                    <p className="text-gray-500 text-xs max-w-md font-medium leading-relaxed">
                      Sua filial hoje conta com promotores agendados de diversas agências. Realize a chamada de controle correspondente abaixo.
                    </p>
                  </div>

                  {/* Main Action Call button with transition scale active click */}
                  <button
                    id="hero-btn-start-checklist"
                    onClick={() => setActiveTab('checklist')}
                    className="bg-[#F58220] hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer shrink-0 active:scale-95 text-center"
                  >
                    <ClipboardCheck className="w-4.5 h-4.5" /> Iniciar Checklist Diário
                  </button>
                </div>
              </div>

              {/* Quick Summary Numbers stylized to mirror border indicators from layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="home-brief-stats">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-[#005AA9] shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#005AA9] uppercase tracking-wider">Suas Filiais</h4>
                    <p className="text-gray-500 text-[11px] mt-1">Filiais cadastradas para acompanhamento comercial</p>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-black text-slate-800">{filiais.length}</span>
                    <button 
                      onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('filiais'); }} 
                      className="text-xs text-[#005AA9] font-bold hover:underline cursor-pointer"
                      id="btn-goto-branches"
                    >
                      Gerenciar filiais &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-[#F58220] shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#F58220] uppercase tracking-wider">Lançamentos Realizados</h4>
                    <p className="text-gray-500 text-[11px] mt-1">Registros totais acumulados no dispositivo local</p>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-black text-slate-800">{checklists.length}</span>
                    <button 
                      onClick={() => setActiveTab('relatorios')} 
                      className="text-xs text-[#F58220] font-bold hover:underline cursor-pointer"
                      id="btn-goto-reports"
                    >
                      Visualizar relatórios &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Quick Access Grid */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm" id="quick-actions-pannel">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Acesso Rápido</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('filiais'); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                    id="card-nav-filiais"
                  >
                    <div className="p-2.5 bg-[#005AA9]/10 rounded-lg text-[#005AA9]">
                      <Store className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Filiais</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('setores'); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                    id="card-nav-setores"
                  >
                    <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                      <Tag className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Setores</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('cadastros'); setActiveCadastroSubTab('fornecedores'); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                    id="card-nav-fornecedores"
                  >
                    <div className="p-2.5 bg-orange-50 rounded-lg text-[#F58220]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Agências</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
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
                      ? 'bg-[#005AA9] text-white shadow-sm' 
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
                      ? 'bg-[#005AA9] text-white shadow-sm' 
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
                      ? 'bg-[#005AA9] text-white shadow-sm' 
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
                  isActive ? 'text-[#005AA9] font-black scale-102 bg-blue-50/70' : 'text-gray-400 hover:text-gray-600'
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
