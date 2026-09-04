import { storage } from './storage';

const BASE_URL = import.meta.env.VITE_ILLUMINE_URL || 'http://localhost:3000'

let accessToken: string | null = null
let refreshToken: string | null = null
let storedUser: any = null
let _initialized = false

// Call once at app startup (before any illumineFetch). Safe to call multiple times.
async function init(): Promise<void> {
  if (_initialized) return
  _initialized = true
  try {
    accessToken = await storage.get('illumine_access_token')
    refreshToken = await storage.get('illumine_refresh_token')
    const userJson = await storage.get('illumine_user')
    if (userJson) storedUser = JSON.parse(userJson)
  } catch (e) {
    console.warn('[Illumine] Could not read tokens from storage:', e)
  }
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
    if (!res.ok) { await clearTokens(); return false }
    const data = await res.json()
    await saveTokens(data.accessToken, data.refreshToken, data.user)
    return true
  } catch {
    return false
  }
}

export async function illumineFetch(path: string, options: RequestInit = {}): Promise<Response> {
  await init()

  const makeRequest = (token: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

  let res = await makeRequest(accessToken)

  // Token expirado — tenta renovar e repetir
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
