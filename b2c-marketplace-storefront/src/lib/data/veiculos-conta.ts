'use server';

import { fetchQuery } from '../config';
import { getAuthHeaders } from './cookies';

// ---------------------------------------------------------------------------
// Garagem do comprador (veiculos salvos na conta) — rotas do modulo extras.
// ---------------------------------------------------------------------------

export type VeiculoSalvoConta = {
  id: string;
  ano_modelo_id: string;
  label: string;
  placa: string | null;
};

export async function getVeiculosSalvos(): Promise<VeiculoSalvoConta[]> {
  try {
    const headers = { ...(await getAuthHeaders()) };
    const res = await fetchQuery('/store/veiculos', { method: 'GET', headers });
    return res.ok ? (res.data?.veiculos ?? []) : [];
  } catch {
    return [];
  }
}

export async function salvarVeiculoConta(input: {
  ano_modelo_id: string;
  label: string;
  placa?: string | null;
}): Promise<void> {
  try {
    const headers = { ...(await getAuthHeaders()) };
    await fetchQuery('/store/veiculos', {
      method: 'POST',
      headers,
      body: {
        ano_modelo_id: input.ano_modelo_id,
        label: input.label,
        ...(input.placa ? { placa: input.placa } : {})
      }
    });
  } catch {
    // garagem e' conveniencia — falha nao interrompe o fluxo
  }
}

export async function removerVeiculoConta(id: string): Promise<void> {
  try {
    const headers = { ...(await getAuthHeaders()) };
    await fetchQuery(`/store/veiculos/${id}`, { method: 'DELETE', headers });
  } catch {
    // idem
  }
}
