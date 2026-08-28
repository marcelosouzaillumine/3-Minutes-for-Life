import { illumineFetch, illumineAuth } from '../lib/illumine'

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || '3minutes'

export const authService = {
  async signUp(
    email: string,
    password: string,
    fullName: string,
    _phone?: string,
    _country?: string,
    _state?: string,
    _city?: string,
    _acceptsUpdates = false
  ) {
    const res = await illumineFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: fullName }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'REGISTER_FAILED')
    }
    const data = await res.json()
    await this.signIn(email, password)
    return data
  },

  async signIn(email: string, password: string) {
    const res = await illumineFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, tenantSlug: TENANT_SLUG }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'LOGIN_FAILED')
    }
    const data = await res.json()
    illumineAuth.saveTokens(data.accessToken, data.refreshToken)
    return { session: data, user: data.user }
  },

  async signInWithOAuth(provider: 'google' | 'apple', idToken: string) {
    const res = await illumineFetch('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider, idToken, tenantSlug: TENANT_SLUG }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'OAUTH_FAILED')
    }
    const data = await res.json()
    illumineAuth.saveTokens(data.accessToken, data.refreshToken)
    return { session: data, user: data.user, isNewUser: data.isNewUser }
  },

  async signOut() {
    try {
      await illumineFetch('/auth/logout', { method: 'POST' })
    } catch {}
    illumineAuth.clearTokens()
  },

  async getSession() {
    if (!illumineAuth.isAuthenticated()) return null
    const res = await illumineFetch('/users/me')
    if (!res.ok) return null
    const user = await res.json()
    return { user, accessToken: illumineAuth.getAccessToken() }
  },

  onAuthStateChange(callback: (event: string, session: object | null) => void) {
    this.getSession().then(session => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
    })
    return { unsubscribe: () => {} }
  }
}
