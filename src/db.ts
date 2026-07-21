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
  { id: 'forn_ag_cas', nome: 'Agencia CAS', setor_id: 'setor_loja' },
  { id: 'forn_ag_nk', nome: 'Agencia NK', setor_id: 'setor_loja' },
  { id: 'forn_ag_rks', nome: 'Agencia RKS', setor_id: 'setor_loja' },
  { id: 'forn_ag_segobi', nome: 'Agencia Segobi', setor_id: 'setor_loja' },
  { id: 'forn_ag_wsa', nome: 'Agencia WSA', setor_id: 'setor_loja' },
  { id: 'forn_ajinomoto', nome: 'Ajinomoto', setor_id: 'setor_loja' },
  { id: 'forn_amavita', nome: 'Amavita', setor_id: 'setor_loja' },
  { id: 'forn_ambev', nome: 'Ambev', setor_id: 'setor_loja' },
  { id: 'forn_arcor', nome: 'Arcor', setor_id: 'setor_loja' },
  { id: 'forn_baby_soft', nome: 'Baby Soft', setor_id: 'setor_loja' },
  { id: 'forn_bauducco', nome: 'Bauducco', setor_id: 'setor_loja' },
  { id: 'forn_bunge', nome: 'Bunge', setor_id: 'setor_loja' },
  { id: 'forn_cargio', nome: 'Cargio', setor_id: 'setor_loja' },
  { id: 'forn_casa_km', nome: 'Casa Km', setor_id: 'setor_loja' },
  { id: 'forn_cepera', nome: 'Cepera', setor_id: 'setor_loja' },
  { id: 'forn_coca_cola', nome: 'Coca Cola', setor_id: 'setor_loja' },
  { id: 'forn_colgate', nome: 'Colgate', setor_id: 'setor_loja' },
  { id: 'forn_dafruta', nome: 'Dafruta', setor_id: 'setor_loja' },
  { id: 'forn_dajuda', nome: 'Dajuda', setor_id: 'setor_loja' },
  { id: 'forn_dusul', nome: 'Dusul', setor_id: 'setor_loja' },
  { id: 'forn_ferreiro_br', nome: 'Ferreiro do Brasil', setor_id: 'setor_loja' },
  { id: 'forn_havaianas', nome: 'Havaianas', setor_id: 'setor_loja' },
  { id: 'forn_heineken', nome: 'Heineken', setor_id: 'setor_loja' },
  { id: 'forn_heinz', nome: 'Heinz', setor_id: 'setor_loja' },
  { id: 'forn_johnson_johnson', nome: 'Johnson e Johnson', setor_id: 'setor_loja' },
  { id: 'forn_kellogs', nome: 'Kellogs', setor_id: 'setor_loja' },
  { id: 'forn_loreal', nome: 'Loreal', setor_id: 'setor_loja' },
  { id: 'forn_marata', nome: 'Marata', setor_id: 'setor_loja' },
  { id: 'forn_marilan', nome: 'Marilan', setor_id: 'setor_loja' },
  { id: 'forn_mega_promo', nome: 'Mega Promo', setor_id: 'setor_loja' },
  { id: 'forn_monange', nome: 'Monange', setor_id: 'setor_loja' },
  { id: 'forn_mondelez', nome: 'Mondelez', setor_id: 'setor_loja' },
  { id: 'forn_nadir_figueiredo', nome: 'Nadir Figueiredo', setor_id: 'setor_loja' },
  { id: 'forn_nestle', nome: 'Nestle', setor_id: 'setor_loja' },
  { id: 'forn_nivea', nome: 'Nivea', setor_id: 'setor_loja' },
  { id: 'forn_p_g', nome: 'P&G', setor_id: 'setor_loja' },
  { id: 'forn_penco', nome: 'Penco', setor_id: 'setor_loja' },
  { id: 'forn_pepsico', nome: 'Pepsico', setor_id: 'setor_loja' },
  { id: 'forn_pullman', nome: 'Pullman', setor_id: 'setor_loja' },
  { id: 'forn_qboa', nome: 'QBOA', setor_id: 'setor_loja' },
  { id: 'forn_rh_simoes', nome: 'R.H Simões', setor_id: 'setor_loja' },
  { id: 'forn_reckitt', nome: 'Reckitt', setor_id: 'setor_loja' },
  { id: 'forn_red_bull', nome: 'Red Bull', setor_id: 'setor_loja' },
  { id: 'forn_refrig_regional', nome: 'Refrigerante Regional', setor_id: 'setor_loja' },
  { id: 'forn_selmi', nome: 'Selmi (Macarrão Galo)', setor_id: 'setor_loja' },
  { id: 'forn_skala', nome: 'Skala', setor_id: 'setor_loja' },
  { id: 'forn_sul_brasil', nome: 'Sul Brasil', setor_id: 'setor_loja' },
  { id: 'forn_unilever', nome: 'Unilever', setor_id: 'setor_loja' },
  { id: 'forn_hinomoto', nome: 'Hinomoto', setor_id: 'setor_loja' }
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

const migrateNewDefaultSuppliers = () => {
  try {
    const MIGRATION_KEY = 'promotorcheck_migrated_fornecedores_v3';
    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.setItem('promotorcheck_fornecedores', JSON.stringify(INITIAL_FORNECEDORES));
      localStorage.setItem(MIGRATION_KEY, 'true');
    }
  } catch (err) {
    console.error('Error running supplier v3 migration:', err);
  }
};
migrateNewDefaultSuppliers();

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
