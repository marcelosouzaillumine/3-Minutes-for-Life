import { illumineFetch, illumineAuth } from '../lib/illumine'
import { supabase } from '../lib/supabase'

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || '3minutes'

export const authService = {
  async signUp(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    country?: string,
    state?: string,
    city?: string,
    acceptsUpdates = false
  ) {
    const res = await illumineFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name: fullName,
        phone,
        country,
        state,
        city,
        acceptsUpdates,
        tenantSlug: TENANT_SLUG,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || err.message || 'REGISTER_FAILED')
    }
    const data = await res.json()
    const loginResult = await this.signIn(email, password)
    const activeUser = loginResult?.user || data?.user

    // Sincroniza o perfil no Supabase para garantir integridade relacional
    if (activeUser?.id) {
      try {
        await supabase.from('profiles').upsert({
          id: activeUser.id,
          email,
          full_name: fullName,
          phone: phone || null,
          country: country || null,
          state: state || null,
          city: city || null,
          accepts_updates: acceptsUpdates,
        }, { onConflict: 'id' })
      } catch (e) {
        console.warn('Could not sync profile to supabase table:', e)
      }
    }

    return { ...data, user: activeUser }
  },

  async signIn(email: string, password: string) {
    const res = await illumineFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, tenantSlug: TENANT_SLUG }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || err.message || 'LOGIN_FAILED')
    }
    const data = await res.json()
    illumineAuth.saveTokens(data.accessToken, data.refreshToken, data.user)
    return { session: data, user: data.user }
  },

  async signInWithOAuth(provider: 'google' | 'apple', idToken: string) {
    const res = await illumineFetch('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider, idToken, tenantSlug: TENANT_SLUG }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || err.message || 'OAUTH_FAILED')
    }
    const data = await res.json()
    illumineAuth.saveTokens(data.accessToken, data.refreshToken, data.user)

    if (data?.user?.id) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.name || null,
        }, { onConflict: 'id' })
      } catch (e) {
        console.warn('Could not sync oauth profile to supabase:', e)
      }
    }

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
    const cachedUser = illumineAuth.getUser()
    try {
      const res = await illumineFetch('/users/me')
      if (res.ok) {
        const user = await res.json()
        illumineAuth.saveUser(user)
        return { user, accessToken: illumineAuth.getAccessToken() }
      }
    } catch (e) {
      console.warn('Could not fetch user /me:', e)
    }
    if (cachedUser) {
      return { user: cachedUser, accessToken: illumineAuth.getAccessToken() }
    }
    return null
  },

  getUser() {
    return illumineAuth.getUser()
  },

  onAuthStateChange(callback: (event: string, session: object | null) => void) {
    this.getSession().then(session => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
    })
    return { unsubscribe: () => {} }
  }
}
