const BASE_URL = import.meta.env.VITE_ILLUMINE_URL || 'http://localhost:3000'

let accessToken: string | null = null
let refreshToken: string | null = null
let storedUser: any = null

function getStoredTokens() {
  try {
    accessToken = localStorage.getItem('illumine_access_token')
    refreshToken = localStorage.getItem('illumine_refresh_token')
    const userJson = localStorage.getItem('illumine_user')
    if (userJson) {
      storedUser = JSON.parse(userJson)
    }
  } catch {}
}

function saveTokens(at: string, rt: string, user?: any) {
  accessToken = at
  refreshToken = rt
  try {
    localStorage.setItem('illumine_access_token', at)
    localStorage.setItem('illumine_refresh_token', rt)
    if (user) {
      storedUser = user
      localStorage.setItem('illumine_user', JSON.stringify(user))
    }
  } catch {}
}

function clearTokens() {
  accessToken = null
  refreshToken = null
  storedUser = null
  try {
    localStorage.removeItem('illumine_access_token')
    localStorage.removeItem('illumine_refresh_token')
    localStorage.removeItem('illumine_user')
  } catch {}
}

function saveUser(user: any) {
  storedUser = user
  try {
    if (user) {
      localStorage.setItem('illumine_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('illumine_user')
    }
  } catch {}
}

getStoredTokens()

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) { clearTokens(); return false }
    const data = await res.json()
    saveTokens(data.accessToken, data.refreshToken, data.user)
    return true
  } catch {
    return false
  }
}

export async function illumineFetch(path: string, options: RequestInit = {}): Promise<Response> {
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
  saveTokens,
  saveUser,
  clearTokens,
  getUser: () => storedUser,
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  isAuthenticated: () => !!accessToken,
}
