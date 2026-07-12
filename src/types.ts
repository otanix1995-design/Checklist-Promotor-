/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Filial {
  id: string;
  codigo: string;
  nome: string;
}

export interface Setor {
  id: string;
  nome: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  setor_id: string;
  dias_atendimento?: string[]; // list of days: e.g. ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
}

export type ChecklistStatus = 'presente' | 'ausente';

export interface ChecklistRecord {
  id: string;
  data: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:MM'
  filial_id: string;
  setor_id: string;
  responsavel: string;
  fornecedor_id: string;
  status: ChecklistStatus;
  observacao?: string;
}

export interface AttendanceStats {
  total: number;
  presentes: number;
  ausentes: number;
  taxaPresenca: number; // percentage
}
