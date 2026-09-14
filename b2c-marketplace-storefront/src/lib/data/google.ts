'use server';

import { revalidateTag } from 'next/cache';

import { fetchQuery, sdk } from '../config';
import { getCacheTag, setAuthToken } from './cookies';
import { transferCart } from './customer';

// ---------------------------------------------------------------------------
// Login/criacao de conta com o Google (auth provider google do Medusa).
// Fluxo: iniciar -> redirect pro Google -> callback troca o code por token;
// identidade nova cria o customer com o e-mail/nome do perfil Google.
// ---------------------------------------------------------------------------

export async function iniciarLoginGoogle(): Promise<{ url?: string; error?: string }> {
  try {
    const res = await sdk.auth.login('customer', 'google', {});
    if (typeof res === 'object' && res?.location) {
      return { url: res.location };
    }
    return { error: 'Login com Google não está configurado' };
  } catch (e) {
    console.error('[google] falha ao iniciar login:', e);
    return { error: 'Login com Google não está disponível agora' };
  }
}

function payloadDoToken(token: string): { actor_id?: string } {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

export async function concluirLoginGoogle(
  params: Record<string, string>
): Promise<{ success?: boolean; error?: string }> {
  try {
    let token = (await sdk.auth.callback('customer', 'google', params)) as string;
    if (!token) return { error: 'Não foi possível concluir o login com o Google' };

    // Identidade nova (sem actor): cria o customer com os dados do perfil
    if (!payloadDoToken(token).actor_id) {
      const perfil = await fetchQuery('/store/auth-perfil', {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` }
      });
      const email = perfil.data?.email;
      if (!perfil.ok || !email) {
        return { error: 'Sua conta Google não compartilhou o e-mail' };
      }
      await sdk.store.customer.create(
        {
          email,
          first_name: perfil.data?.first_name ?? undefined,
          last_name: perfil.data?.last_name ?? undefined
        },
        {},
        { authorization: `Bearer ${token}` }
      );
      token = (await sdk.auth.refresh()) as string;
    }

    await setAuthToken(token);
    const cacheTag = await getCacheTag('customers');
    revalidateTag(cacheTag);
    await transferCart().catch(() => {});
    return { success: true };
  } catch (e) {
    console.error('[google] falha no callback:', e);
    return { error: 'Não foi possível concluir o login com o Google' };
  }
}
