import { illumineFetch, illumineAuth } from '../lib/illumine'
import { supabase } from '../lib/supabase'
import { AnalyticsService } from './AnalyticsService'

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
          illumineAuth.saveTokens(illData.accessToken, illData.refreshToken, illData.user)
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

    // 2. Lazy Migration / JIT Sync com o Illumine OS
    try {
      const illRes = await illumineFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, tenantSlug: TENANT_SLUG }),
      })

      if (illRes.ok) {
        const illData = await illRes.json()
        illumineAuth.saveTokens(illData.accessToken, illData.refreshToken, illData.user)
      } else if (supabaseResult?.user && (illRes.status === 401 || illRes.status === 404)) {
        // Usuário autenticado no Supabase mas ainda não existe no Illumine OS -> Cadastra sob demanda!
        const regRes = await illumineFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            name: supabaseResult.user.user_metadata?.full_name || supabaseResult.user.email?.split('@')[0] || 'User',
            tenantSlug: TENANT_SLUG,
          }),
        })
        if (regRes.ok) {
          const regData = await regRes.json()
          if (regData.accessToken) {
            illumineAuth.saveTokens(regData.accessToken, regData.refreshToken, regData.user)
          }
        }
      }
    } catch (e) {
      console.warn('Illumine OS sync/login warning:', e)
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

      // 2. Sincroniza com Illumine OS
      try {
        const res = await illumineFetch('/auth/oauth', {
          method: 'POST',
          body: JSON.stringify({ provider, idToken: idTokenOrRedirect, tenantSlug: TENANT_SLUG }),
        })
        if (res.ok) {
          const data = await res.json()
          illumineAuth.saveTokens(data.accessToken, data.refreshToken, data.user)
          if (!supabaseUser) {
            supabaseUser = data.user
          }
        }
      } catch (e) {
        console.warn('Illumine OAuth sync warning:', e)
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
    } catch {}
    try {
      await illumineFetch('/auth/logout', { method: 'POST' })
    } catch {}
    illumineAuth.clearTokens()
  },

  async getSession() {
    // 1. Supabase Auth Session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session?.user) {
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
          illumineAuth.saveUser(user)
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
