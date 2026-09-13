import { illumineFetch, illumineAuth } from '../lib/illumine'
import { supabase } from '../lib/supabase'
import { AnalyticsService } from './AnalyticsService'

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || '3minutes'

async function exchangeSupabaseJwt(supabaseToken: string): Promise<boolean> {
  try {
    const res = await illumineFetch('/auth/exchange/supabase', {
      method: 'POST',
      body: JSON.stringify({ supabaseToken, tenantSlug: TENANT_SLUG }),
    })
    if (!res.ok) return false
    const data = await res.json()
    await illumineAuth.saveTokens(data.accessToken, data.refreshToken, data.user)
    return true
  } catch (e) {
    console.warn('[Auth] Supabase JWT exchange warning:', e)
    return false
  }
}

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
    // 1. Cadastra na identidade Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          country: country || null,
          state: state || null,
          city: city || null,
          accepts_updates: acceptsUpdates,
        },
      },
    })

    if (error) throw error

    const activeUser = data.user

    // 2. Registra e obtém token Illumine OS (L1 gerencia o perfil)
    try {
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
      if (res.ok) {
        const illData = await res.json()
        if (illData.accessToken) {
          await illumineAuth.saveTokens(illData.accessToken, illData.refreshToken, illData.user)
        }
      }
    } catch (e) {
      console.warn('[Auth] Illumine register warning:', e)
    }

    return { ...data, user: activeUser }
  },

  async signIn(email: string, password: string) {
    // 1. Autentica no Supabase Auth (provedor de identidade)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) throw error
    if (!data?.user) throw new Error('INVALID_CREDENTIALS')

    // 2. Troca JWT Supabase por token Illumine OS (L1)
    if (data.session?.access_token) {
      await exchangeSupabaseJwt(data.session.access_token)
    }

    return { session: data.session, user: data.user }
  },

  async signInWithOAuth(provider: 'google' | 'apple', idTokenOrRedirect?: string) {
    if (idTokenOrRedirect && provider === 'google') {
      // 1. Autentica com Google via Supabase Auth
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idTokenOrRedirect,
      })

      if (error) throw error
      if (!data?.user) throw new Error('OAUTH_FAILED')

      // 2. Troca JWT Supabase por token Illumine OS (L1)
      if (data.session?.access_token) {
        await exchangeSupabaseJwt(data.session.access_token)
      }

      // 3. Sincroniza metadados do OAuth no Illumine OS
      if (illumineAuth.isAuthenticated()) {
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name
        const avatar = data.user.user_metadata?.avatar_url
        if (name || avatar) {
          illumineFetch('/users/me', {
            method: 'PATCH',
            body: JSON.stringify({ ...(name && { name }), ...(avatar && { avatar }) }),
          }).catch(() => {})
        }
      }

      return { session: data.session, user: data.user }
    }

    // Redirect flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + (idTokenOrRedirect || '/app') },
    })
    if (error) throw error
    return data
  },

  async checkEmail(email: string): Promise<{ exists: boolean; name?: string; avatar?: string; hasPassword?: boolean }> {
    const res = await illumineFetch('/auth/lookup', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    if (res.ok) return await res.json()
    return { exists: false }
  },

  async resetPassword(email: string): Promise<void> {
    // Tenta via Illumine OS primeiro
    try {
      const res = await illumineFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, tenantSlug: TENANT_SLUG }),
      })
      if (res.ok) return
    } catch {}

    // Fallback: Supabase Auth como provedor de identidade
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app`,
    })
    if (error) throw error
  },

  async signOut() {
    // 1. Encerra sessão no Illumine OS (L1)
    try {
      await illumineFetch('/auth/logout', { method: 'POST' })
    } catch {}

    // 2. Limpa tokens locais
    await illumineAuth.clearTokens()

    // 3. Encerra sessão Supabase Auth (provedor de identidade)
    try {
      await supabase.auth.signOut()
    } catch {}
  },

  async getSession() {
    // 1. Tenta sessão Illumine OS ativa (init() é aguardado dentro de illumineFetch)
    try {
      const res = await illumineFetch('/users/me')
      if (res.ok) {
        const user = await res.json()
        await illumineAuth.saveUser(user)
        return { user, accessToken: illumineAuth.getAccessToken() }
      }
    } catch {}

    // 2. Sem token Illumine válido — tenta exchange com sessão Supabase existente
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const exchanged = await exchangeSupabaseJwt(session.access_token)
        if (exchanged) {
          const res = await illumineFetch('/users/me')
          if (res.ok) {
            const user = await res.json()
            return { user, accessToken: illumineAuth.getAccessToken() }
          }
        }
      }
    } catch {}

    return null
  },

  getUser() {
    return illumineAuth.getUser()
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        AnalyticsService.trackEvent('authentication_succeeded', { method: 'session_established', event })
      }

      // Re-exchange sempre que o Supabase renovar o JWT para manter o token Illumine sincronizado
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        await exchangeSupabaseJwt(session.access_token)
      }

      if (session?.user) {
        const formattedSession = {
          session,
          user: {
            ...session.user,
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            avatar: session.user.user_metadata?.avatar_url || '',
            role: session.user.role,
          },
          accessToken: illumineAuth.getAccessToken(),
        }
        callback(event, formattedSession)
      } else {
        const illSession = await this.getSession().catch(() => null)
        callback(illSession ? 'SIGNED_IN' : 'SIGNED_OUT', illSession)
      }
    })

    return data.subscription
  },
}
