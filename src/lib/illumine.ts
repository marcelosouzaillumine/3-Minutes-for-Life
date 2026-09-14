import { storage } from './storage';

const BASE_URL = import.meta.env.VITE_ILLUMINE_URL || 'http://localhost:3000'
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || '3minutes'

let accessToken: string | null = null
let refreshToken: string | null = null
let storedUser: any = null
let _initPromise: Promise<void> | null = null

async function init(): Promise<void> {
  if (_initPromise) return _initPromise
  _initPromise = (async () => {
    try {
      accessToken = await storage.get('illumine_access_token')
      refreshToken = await storage.get('illumine_refresh_token')
      const userJson = await storage.get('illumine_user')
      if (userJson) storedUser = JSON.parse(userJson)
    } catch (e) {
      console.warn('[Illumine] Could not read tokens from storage:', e)
    }
  })()
  return _initPromise
}

async function saveTokens(at: string, rt: string, user?: any): Promise<void> {
  accessToken = at
  refreshToken = rt
  try {
    await storage.set('illumine_access_token', at)
    await storage.set('illumine_refresh_token', rt)
    if (user) {
      storedUser = user
      await storage.set('illumine_user', JSON.stringify(user))
    }
  } catch (e) {
    console.warn('[Illumine] Could not persist tokens to storage:', e)
  }
}

async function clearTokens(): Promise<void> {
  accessToken = null
  refreshToken = null
  storedUser = null
  try {
    await storage.remove('illumine_access_token')
    await storage.remove('illumine_refresh_token')
    await storage.remove('illumine_user')
  } catch (e) {
    console.warn('[Illumine] Could not clear tokens from storage:', e)
  }
}

async function saveUser(user: any): Promise<void> {
  storedUser = user
  try {
    if (user) {
      await storage.set('illumine_user', JSON.stringify(user))
    } else {
      await storage.remove('illumine_user')
    }
  } catch (e) {
    console.warn('[Illumine] Could not save user to storage:', e)
  }
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    // Só destrói os tokens se o servidor rejeitou explicitamente (credenciais inválidas)
    if (res.status === 401 || res.status === 403) {
      await clearTokens()
      return false
    }
    // Erros de rede ou servidor temporários não destroem a sessão
    if (!res.ok) return false
    const data = await res.json()
    await saveTokens(data.accessToken, data.refreshToken, data.user)
    return true
  } catch {
    // Falha de rede — mantém tokens para tentar novamente
    return false
  }
}

export async function illumineFetch(path: string, options: RequestInit = {}): Promise<Response> {
  await init()

  const hasBody = options.body !== undefined && options.body !== null
  const makeRequest = (token: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        'x-tenant-slug': TENANT_SLUG,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

  let res = await makeRequest(accessToken)

  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefresh()
    if (refreshed) res = await makeRequest(accessToken)
  }

  return res
}

export const illumineAuth = {
  init,
  saveTokens,
  saveUser,
  clearTokens,
  getUser: () => storedUser,
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  isAuthenticated: () => !!accessToken,
}
