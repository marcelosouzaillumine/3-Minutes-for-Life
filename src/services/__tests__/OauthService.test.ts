import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ token: 'jwt-do-admin' as string | null }));
vi.mock('../../lib/illumine', () => ({
  illumineAuth: { init: vi.fn(async () => undefined), getAccessToken: () => auth.token },
  illumineFetch: vi.fn(async () => new Response('{}')),
}));

import { OauthError, oauthDecide, oauthInfo, parseOauthRequest, safeRedirect } from '../OauthService';

const CHALLENGE = 'a'.repeat(43);
const query = (over: Record<string, string | null> = {}) => {
  const q = new URLSearchParams({
    response_type: 'code', client_id: 'c1', redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
    code_challenge: CHALLENGE, code_challenge_method: 'S256', state: 'xyz',
  });
  for (const [k, v] of Object.entries(over)) v === null ? q.delete(k) : q.set(k, v);
  return `?${q}`;
};

describe('parseOauthRequest', () => {
  it('lê um pedido válido do conector', () => {
    expect(parseOauthRequest(query())).toEqual({ clientId: 'c1', redirectUri: 'https://claude.ai/api/mcp/auth_callback', codeChallenge: CHALLENGE, state: 'xyz' });
  });

  it('state é opcional', () => {
    expect(parseOauthRequest(query({ state: null }))?.state).toBeUndefined();
  });

  it('recusa pedido sem PKCE S256, sem cliente, sem retorno ou de outro tipo', () => {
    expect(parseOauthRequest(query({ code_challenge_method: 'plain' }))).toBeNull();
    expect(parseOauthRequest(query({ code_challenge: 'curto' }))).toBeNull();
    expect(parseOauthRequest(query({ code_challenge: null }))).toBeNull();
    expect(parseOauthRequest(query({ client_id: null }))).toBeNull();
    expect(parseOauthRequest(query({ redirect_uri: null }))).toBeNull();
    expect(parseOauthRequest(query({ response_type: 'token' }))).toBeNull();
    expect(parseOauthRequest('')).toBeNull();
  });
});

describe('safeRedirect', () => {
  it('aceita https e http só em localhost', () => {
    expect(safeRedirect('https://claude.ai/cb?code=1')).toBe('https://claude.ai/cb?code=1');
    expect(safeRedirect('http://localhost:3000/cb')).toBe('http://localhost:3000/cb');
  });

  it('recusa javascript:, data:, http remoto e lixo', () => {
    expect(safeRedirect('javascript:alert(1)')).toBeNull();
    expect(safeRedirect('data:text/html,x')).toBeNull();
    expect(safeRedirect('http://evil.example/cb')).toBeNull();
    expect(safeRedirect('não é endereço')).toBeNull();
  });
});

describe('chamadas à API do produto', () => {
  const req = parseOauthRequest(query())!;
  const fetchMock = vi.fn();
  beforeEach(() => {
    auth.token = 'jwt-do-admin';
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  const reply = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));

  it('oauthInfo manda o token do admin e devolve quem pede e para onde volta', async () => {
    reply({ clientName: 'Claude', redirectHost: 'claude.ai' });
    expect(await oauthInfo(req)).toEqual({ clientName: 'Claude', redirectHost: 'claude.ai' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/oauth/authorize-info?client_id=c1&redirect_uri=');
    expect(init.headers.Authorization).toBe('Bearer jwt-do-admin');
  });

  it('oauthDecide: "write" pede os dois escopos e "read" só a leitura', async () => {
    reply({ redirectTo: 'https://claude.ai/cb?code=abc&state=xyz' });
    await oauthDecide(req, 'allow', 'write');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      clientId: 'c1', codeChallenge: CHALLENGE, codeChallengeMethod: 'S256', state: 'xyz', decision: 'allow', scopes: ['editorial:read', 'editorial:write'],
    });
    reply({ redirectTo: 'https://claude.ai/cb?code=abc' });
    await oauthDecide(req, 'allow', 'read');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).scopes).toEqual(['editorial:read']);
  });

  it('oauthDecide devolve o endereço de volta ao conector', async () => {
    reply({ redirectTo: 'https://claude.ai/cb?code=abc&state=xyz' });
    expect(await oauthDecide(req, 'allow', 'read')).toBe('https://claude.ai/cb?code=abc&state=xyz');
  });

  it('não segue um retorno inseguro mesmo que o servidor mande', async () => {
    reply({ redirectTo: 'javascript:alert(1)' });
    await expect(oauthDecide(req, 'allow', 'read')).rejects.toMatchObject({ code: 'invalid' });
  });

  it('traduz as falhas: 403 sem permissão, 401 sessão vencida, 404 pedido inválido', async () => {
    reply({ error: 'FORBIDDEN' }, 403);
    await expect(oauthInfo(req)).rejects.toMatchObject({ code: 'forbidden' });
    reply({ error: 'TOKEN_INVALID' }, 401);
    await expect(oauthInfo(req)).rejects.toMatchObject({ code: 'unauthenticated' });
    reply({ error: 'CLIENT_NOT_FOUND' }, 404);
    await expect(oauthInfo(req)).rejects.toMatchObject({ code: 'invalid' });
  });

  it('sem login não chama a API', async () => {
    auth.token = null;
    await expect(oauthInfo(req)).rejects.toBeInstanceOf(OauthError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falha de rede vira "network"', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(oauthInfo(req)).rejects.toMatchObject({ code: 'network' });
  });
});
