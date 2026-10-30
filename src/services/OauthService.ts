import { illumineAuth, illumineFetch } from '../lib/illumine';

// Autorizar o Claude (conector MCP) a ajudar a equipe editorial. O pedido chega pela barra de endereço, vindo do conector;
// quem decide é um admin logado. As chamadas vão direto à API do produto (3-minutes-api), que ainda não passa pelo proxy do gateway.

const PRODUCT_API_URL = (import.meta.env.VITE_PRODUCT_API_URL || 'https://3-minutes-api-production.up.railway.app').replace(/\/$/, '');

export type EditorialAccess = 'read' | 'write';

export interface OauthRequest {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
}

export interface OauthInfo {
  clientName: string;
  redirectHost: string;
}

/** Falhas que a tela explica em português; `code` é o motivo, sem texto do servidor. */
export class OauthError extends Error {
  code: 'forbidden' | 'invalid' | 'unauthenticated' | 'network';
  constructor(code: OauthError['code']) {
    super(code);
    this.code = code;
  }
}

/** Lê o pedido do conector (`response_type=code` com PKCE S256). Devolve `null` se não for um pedido válido. */
export function parseOauthRequest(search: string): OauthRequest | null {
  const q = new URLSearchParams(search);
  const clientId = q.get('client_id') ?? '';
  const redirectUri = q.get('redirect_uri') ?? '';
  const codeChallenge = q.get('code_challenge') ?? '';
  if (q.get('response_type') !== 'code') return null;
  if (!clientId || !redirectUri) return null;
  if (q.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) return null;
  return { clientId, redirectUri, codeChallenge, state: q.get('state') ?? undefined };
}

/** Só segue para endereço https (ou http em localhost); nunca `javascript:` nem outro esquema. */
export function safeRedirect(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:') return u.toString();
    if (u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)) return u.toString();
  } catch {
    /* endereço inválido */
  }
  return null;
}

/** Renova a sessão se o token venceu (o cliente do gateway já trata o 401) e devolve o token atual. */
async function sessionToken(): Promise<string> {
  await illumineAuth.init();
  await illumineFetch('/users/me').catch(() => undefined);
  const token = illumineAuth.getAccessToken();
  if (!token) throw new OauthError('unauthenticated');
  return token;
}

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await sessionToken();
  try {
    return await fetch(`${PRODUCT_API_URL}${path}`, {
      ...init,
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new OauthError('network');
  }
}

function fail(res: Response): never {
  if (res.status === 401) throw new OauthError('unauthenticated');
  if (res.status === 403) throw new OauthError('forbidden');
  throw new OauthError('invalid');
}

export async function oauthInfo(req: OauthRequest): Promise<OauthInfo> {
  const q = new URLSearchParams({ client_id: req.clientId, redirect_uri: req.redirectUri });
  const res = await call(`/oauth/authorize-info?${q}`);
  if (!res.ok) fail(res);
  return (await res.json()) as OauthInfo;
}

/** Devolve o endereço para onde o admin volta (o conector, com o código ou com `access_denied`). */
export async function oauthDecide(req: OauthRequest, decision: 'allow' | 'deny', access: EditorialAccess): Promise<string> {
  const res = await call('/oauth/authorize', {
    method: 'POST',
    body: JSON.stringify({
      clientId: req.clientId,
      redirectUri: req.redirectUri,
      codeChallenge: req.codeChallenge,
      codeChallengeMethod: 'S256',
      ...(req.state ? { state: req.state } : {}),
      scopes: access === 'write' ? ['editorial:read', 'editorial:write'] : ['editorial:read'],
      decision,
    }),
  });
  if (!res.ok) fail(res);
  const { redirectTo } = (await res.json()) as { redirectTo: string };
  const safe = safeRedirect(redirectTo);
  if (!safe) throw new OauthError('invalid');
  return safe;
}
