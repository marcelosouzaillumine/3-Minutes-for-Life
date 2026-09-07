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
    // 1. Cadastra no Supabase Auth
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

    if (error) {
      throw error
    }

    const activeUser = data.user

    // 2. Sincronização Transparente com Illumine OS
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
      console.warn('Illumine OS registration sync warning:', e)
    }

    // 3. Garante perfil na tabela profiles do Supabase
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
    let supabaseResult: any = null
    let supabaseError: any = null

    // 1. Autentica no Supabase Auth primeiro (onde estão todas as contas existentes e admin master)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (!error && data?.user) {
        supabaseResult = data
      } else {
        supabaseError = error
      }
    } catch (err) {
      supabaseError = err
      console.warn('Supabase sign-in warning:', err)
    }

    // 2. Trocar JWT Supabase por token Illumine OS (sem enviar senha)
    if (supabaseResult?.session?.access_token) {
      await exchangeSupabaseJwt(supabaseResult.session.access_token)
    }

    // Se o login no Supabase teve sucesso
    if (supabaseResult?.user) {
      return { session: supabaseResult.session, user: supabaseResult.user }
    }

    // Se o usuário foi criado exclusivamente no Illumine OS
    if (illumineAuth.isAuthenticated()) {
      const user = illumineAuth.getUser()
      return { session: { accessToken: illumineAuth.getAccessToken(), user }, user }
    }

    // Se falhou em ambos
    throw supabaseError || new Error('INVALID_CREDENTIALS')
  },

  async signInWithOAuth(provider: 'google' | 'apple', idTokenOrRedirect?: string) {
    if (idTokenOrRedirect && provider === 'google') {
      let supabaseUser: any = null
      let supabaseSession: any = null

      // 1. Supabase OAuth com Google ID Token
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idTokenOrRedirect,
        })
        if (!error && data?.user) {
          supabaseUser = data.user
          supabaseSession = data.session
        }
      } catch (e) {
        console.warn('Supabase signInWithIdToken warning:', e)
      }

      // 2. Trocar JWT Supabase por token Illumine OS
      if (supabaseSession?.access_token) {
        await exchangeSupabaseJwt(supabaseSession.access_token)
      }

      if (supabaseUser?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || (supabaseUser as any).name || null,
          }, { onConflict: 'id' })
        } catch (e) {
          console.warn('Could not sync oauth profile to supabase:', e)
        }

        if (illumineAuth.isAuthenticated()) {
          const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name
          const avatar = supabaseUser.user_metadata?.avatar_url
          if (name || avatar) {
            illumineFetch('/users/me', {
              method: 'PATCH',
              body: JSON.stringify({ ...(name && { name }), ...(avatar && { avatar }) }),
            }).catch(() => {})
          }
        }
      }

      if (supabaseUser) {
        return { session: supabaseSession, user: supabaseUser }
      }
      throw new Error('OAUTH_FAILED')
    }

    // Redirect flow fallback
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + (idTokenOrRedirect || '/app'),
      },
    })
    if (error) throw error
    return data
  },

  async signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('[Auth] Supabase signOut warning:', e)
    }
    try {
      await illumineFetch('/auth/logout', { method: 'POST' })
    } catch (e) {
      console.warn('[Auth] Illumine logout warning:', e)
    }
    await illumineAuth.clearTokens()
  },

  async getSession() {
    // 1. Supabase Auth Session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session?.user) {
        // Se ainda não temos token Illumine, troca agora (lazy exchange)
        if (!illumineAuth.isAuthenticated() && session.access_token) {
          await exchangeSupabaseJwt(session.access_token)
        }
        return {
          session,
          user: {
            ...session.user,
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            avatar: session.user.user_metadata?.avatar_url || '',
            role: session.user.role,
          },
          accessToken: session.access_token,
        }
      }
    } catch (e) {
      console.warn('Supabase getSession warning:', e)
    }

    // 2. Illumine Fallback
    if (illumineAuth.isAuthenticated()) {
      const cachedUser = illumineAuth.getUser()
      try {
        const res = await illumineFetch('/users/me')
        if (res.ok) {
          const user = await res.json()
          await illumineAuth.saveUser(user)
          return { user, accessToken: illumineAuth.getAccessToken() }
        }
      } catch (e) {
        console.warn('Could not fetch user /me:', e)
      }
      if (cachedUser) {
        return { user: cachedUser, accessToken: illumineAuth.getAccessToken() }
      }
    }
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
          accessToken: session.access_token,
        }
        callback(event, formattedSession)
      } else {
        // Fallback Illumine session
        const illSession = await this.getSession().catch(() => null)
        callback(illSession ? 'SIGNED_IN' : 'SIGNED_OUT', illSession)
      }
    })

    return data.subscription
  },
}
