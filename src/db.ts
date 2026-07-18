/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filial, Setor, Fornecedor, ChecklistRecord } from './types';

// Initial Seed Data
const INITIAL_FILIAIS: Filial[] = [
  { id: 'filial_172', codigo: '172', nome: 'Cascavel' },
  { id: 'filial_174', codigo: '174', nome: 'Toledo' },
  { id: 'filial_150', codigo: '150', nome: 'Londrina' },
];

const INITIAL_SETORES: Setor[] = [
  { id: 'setor_loja', nome: 'Loja' },
  { id: 'setor_frios', nome: 'Frios' },
];

const INITIAL_FORNECEDORES: Fornecedor[] = [
  // Frios
  { id: 'forn_aurora', nome: 'Aurora', setor_id: 'setor_frios' },
  { id: 'forn_batavo', nome: 'Batavo', setor_id: 'setor_frios' },
  { id: 'forn_brf', nome: 'BRF', setor_id: 'setor_frios' },
  { id: 'forn_cvale', nome: 'C Vale', setor_id: 'setor_frios' },
  { id: 'forn_carolino', nome: 'Carolino', setor_id: 'setor_frios' },
  { id: 'forn_copacol', nome: 'Copacol', setor_id: 'setor_frios' },
  { id: 'forn_danone', nome: 'Danone', setor_id: 'setor_frios' },
  { id: 'forn_frimesa', nome: 'Frimesa', setor_id: 'setor_frios' },
  { id: 'forn_jbs', nome: 'JBS', setor_id: 'setor_frios' },
  { id: 'forn_lar', nome: 'Lar', setor_id: 'setor_frios' },
  { id: 'forn_pamplona', nome: 'Pamplona', setor_id: 'setor_frios' },
  { id: 'forn_seara', nome: 'Seara', setor_id: 'setor_frios' },
  { id: 'forn_yakult', nome: 'Yakult', setor_id: 'setor_frios' },

  // Loja (responsible for other products as requested)
  { id: 'forn_nestle', nome: 'Nestlé', setor_id: 'setor_loja' },
  { id: 'forn_unilever', nome: 'Unilever', setor_id: 'setor_loja' },
  { id: 'forn_mdias', nome: 'M. Dias Branco', setor_id: 'setor_loja' },
  { id: 'forn_camil', nome: 'Camil', setor_id: 'setor_loja' },
  { id: 'forn_bauducco', nome: 'Bauducco', setor_id: 'setor_loja' },
  { id: 'forn_cargill', nome: 'Cargill', setor_id: 'setor_loja' },
  { id: 'forn_ambev', nome: 'Ambev', setor_id: 'setor_loja' },
  { id: 'forn_cocacola', nome: 'Coca-Cola', setor_id: 'setor_loja' },
  { id: 'forn_heineken', nome: 'Heineken', setor_id: 'setor_loja' },
  { id: 'forn_petropolis', nome: 'Grupo Petrópolis', setor_id: 'setor_loja' },
  { id: 'forn_ype', nome: 'Ypê', setor_id: 'setor_loja' },
  { id: 'forn_reckitt', nome: 'Reckitt', setor_id: 'setor_loja' },
  { id: 'forn_colgate', nome: 'Colgate-Palmolive', setor_id: 'setor_loja' },
  { id: 'forn_bombril', nome: 'Bombril', setor_id: 'setor_loja' },
  { id: 'forn_tramontina', nome: 'Tramontina', setor_id: 'setor_loja' },
  { id: 'forn_sanremo', nome: 'Sanremo', setor_id: 'setor_loja' },
  { id: 'forn_plasutil', nome: 'Plasútil', setor_id: 'setor_loja' },
  { id: 'forn_pomar', nome: 'Central do Pomar', setor_id: 'setor_loja' },
  { id: 'forn_trebeschi', nome: 'Trebeschi', setor_id: 'setor_loja' },
  { id: 'forn_fisher', nome: 'Fischer Frutas', setor_id: 'setor_loja' },
];

// Auto-migration to ensure only LOJA and FRIOS sectors exist in local storage
const migrateSectorsAndSuppliers = () => {
  try {
    const setoresItem = localStorage.getItem('promotorcheck_setores');
    const fornecedoresItem = localStorage.getItem('promotorcheck_fornecedores');
    
    if (setoresItem) {
      const currentSetores: Setor[] = JSON.parse(setoresItem);
      const hasOldSectors = currentSetores.some(s => s.id !== 'setor_loja' && s.id !== 'setor_frios');
      if (hasOldSectors) {
        // Run migration!
        // 1. Force sectors to be exactly Loja and Frios
        const migratedSetores: Setor[] = [
          { id: 'setor_loja', nome: 'Loja' },
          { id: 'setor_frios', nome: 'Frios' },
        ];
        localStorage.setItem('promotorcheck_setores', JSON.stringify(migratedSetores));
        
        // 2. Migrate existing fornecedores' sector IDs.
        // If they were in 'setor_frios', keep it. If in anything else, change to 'setor_loja'.
        if (fornecedoresItem) {
          const currentFornecedores: Fornecedor[] = JSON.parse(fornecedoresItem);
          const migratedFornecedores = currentFornecedores.map(f => {
            if (f.setor_id === 'setor_frios') {
              return f;
            } else {
              return { ...f, setor_id: 'setor_loja' };
            }
          });
          localStorage.setItem('promotorcheck_fornecedores', JSON.stringify(migratedFornecedores));
        }

        // 3. Migrate existing checklist records as well!
        const checklistsItem = localStorage.getItem('promotorcheck_checklists');
        if (checklistsItem) {
          const currentChecklists: ChecklistRecord[] = JSON.parse(checklistsItem);
          const migratedChecklists = currentChecklists.map(r => {
            if (r.setor_id === 'setor_frios') {
              return r;
            } else {
              return { ...r, setor_id: 'setor_loja' };
            }
          });
          localStorage.setItem('promotorcheck_checklists', JSON.stringify(migratedChecklists));
        }
      }
    }
  } catch (err) {
    console.error('Error running sector migration:', err);
  }
};

// Run the migration immediately
migrateSectorsAndSuppliers();

// LocalStorage Keys
const KEYS = {
  FILIAIS: 'promotorcheck_filiais',
  SETORES: 'promotorcheck_setores',
  FORNECEDORES: 'promotorcheck_fornecedores',
  CHECKLISTS: 'promotorcheck_checklists',
  PENDING_SYNC: 'promotorcheck_pending_sync',
  LAST_SYNC: 'promotorcheck_last_sync',
};

// Helper to safely load JSON from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage`, error);
    return defaultValue;
  }
}

// Helper to safely save JSON to localStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving key ${key} to localStorage`, error);
  }
}

export class OfflineDB {
  static getFiliais(): Filial[] {
    return loadFromStorage<Filial[]>(KEYS.FILIAIS, INITIAL_FILIAIS);
  }

  static saveFiliais(filiais: Filial[]): void {
    saveToStorage(KEYS.FILIAIS, filiais);
  }

  static getSetores(): Setor[] {
    return loadFromStorage<Setor[]>(KEYS.SETORES, INITIAL_SETORES);
  }

  static saveSetores(setores: Setor[]): void {
    saveToStorage(KEYS.SETORES, setores);
  }

  static getFornecedores(): Fornecedor[] {
    return loadFromStorage<Fornecedor[]>(KEYS.FORNECEDORES, INITIAL_FORNECEDORES);
  }

  static saveFornecedores(fornecedores: Fornecedor[]): void {
    saveToStorage(KEYS.FORNECEDORES, fornecedores);
  }

  static getChecklists(): ChecklistRecord[] {
    return loadFromStorage<ChecklistRecord[]>(KEYS.CHECKLISTS, []);
  }

  static saveChecklists(records: ChecklistRecord[]): void {
    saveToStorage(KEYS.CHECKLISTS, records);
  }

  static addChecklistRecords(newRecords: ChecklistRecord[]): void {
    const current = this.getChecklists();
    const updated = [...current, ...newRecords];
    this.saveChecklists(updated);

    // Track records that need cloud sync
    const pending = loadFromStorage<string[]>(KEYS.PENDING_SYNC, []);
    const newIds = newRecords.map(r => r.id);
    saveToStorage(KEYS.PENDING_SYNC, [...pending, ...newIds]);
  }

  static getPendingSyncCount(): number {
    return loadFromStorage<string[]>(KEYS.PENDING_SYNC, []).length;
  }

  static getLastSyncTime(): string | null {
    return localStorage.getItem(KEYS.LAST_SYNC);
  }

  static performSync(): Promise<{ success: boolean; syncedCount: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pending = loadFromStorage<string[]>(KEYS.PENDING_SYNC, []);
        const count = pending.length;
        
        // Simutate syncing to firebase / cloud storage
        saveToStorage(KEYS.PENDING_SYNC, []);
        localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());

        resolve({
          success: true,
          syncedCount: count,
        });
      }, 1200); // Realistic network delay
    });
  }

  // Resets local storage back to initial seed data
  static resetToSeed(): void {
    localStorage.removeItem(KEYS.FILIAIS);
    localStorage.removeItem(KEYS.SETORES);
    localStorage.removeItem(KEYS.FORNECEDORES);
    localStorage.removeItem(KEYS.CHECKLISTS);
    localStorage.removeItem(KEYS.PENDING_SYNC);
    localStorage.removeItem(KEYS.LAST_SYNC);
  }

  // Clears checklist history only
  static clearChecklistHistory(): void {
    localStorage.removeItem(KEYS.CHECKLISTS);
    localStorage.removeItem(KEYS.PENDING_SYNC);
  }
}
