import { illumineFetch, illumineAuth } from '../lib/illumine'
import { supabase } from '../lib/supabase'
import { AnalyticsService } from './AnalyticsService'

const ILLUMINE_URL = import.meta.env.VITE_ILLUMINE_URL as string
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || '3minutes'

// Callback registrado por onAuthStateChange — notificado em signIn/signOut
let _authCallback: ((event: string, session: any) => void) | null = null

// Chama L1 sem Bearer (para auth endpoints que não precisam de token)
async function illumineDirect(path: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${ILLUMINE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-slug': TENANT_SLUG,
    },
    body: JSON.stringify(body),
  })
}

// Login no L1 + salva tokens. Em caso de usuário inexistente (401), auto-provisiona via register.
async function loginWithIllumine(
  email: string,
  password: string,
  metadata?: { name?: string; phone?: string; country?: string; state?: string; city?: string }
): Promise<{ accessToken: string; user: any }> {
  // 1. Tenta login direto
  let loginRes = await illumineDirect('/auth/login', { email, password })

  if (loginRes.ok) {
    const d = await loginRes.json()
    if (d.accessToken) {
      await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
      return d
    }
  }

  // 2. 401 = usuário não existe no Illumine ainda → auto-provisiona
  if (loginRes.status === 401) {
    const name = metadata?.name || email.split('@')[0]
    const regRes = await illumineDirect('/auth/register', {
      email,
      password,
      name,
      phone: metadata?.phone ?? null,
      country: metadata?.country ?? null,
      state: metadata?.state ?? null,
      city: metadata?.city ?? null,
      tenantSlug: TENANT_SLUG,
    })

    if (regRes.ok) {
      // L1 register (201) não retorna accessToken — faz login imediatamente
      loginRes = await illumineDirect('/auth/login', { email, password })
      if (loginRes.ok) {
        const d = await loginRes.json()
        if (d.accessToken) {
          await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
          return d
        }
      }
    }

    if (regRes.status === 409) {
      // Conta existe com senha diferente — re-lança como erro de credenciais
      throw new Error('INVALID_CREDENTIALS')
    }
  }

  // Credenciais inválidas ou erro inesperado
  const body = await loginRes.json().catch(() => ({}))
  const code = body?.error || 'INVALID_CREDENTIALS'
  throw new Error(code)
}

export const authService = {

  // ─── CADASTRO ────────────────────────────────────────────────────────────────

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
    const regRes = await illumineDirect('/auth/register', {
      email,
      password,
      name: fullName,
      phone: phone || null,
      country: country || null,
      state: state || null,
      city: city || null,
      acceptsUpdates,
      tenantSlug: TENANT_SLUG,
    })

    if (!regRes.ok && regRes.status !== 409) {
      const body = await regRes.json().catch(() => ({}))
      throw new Error(body?.error || body?.message || 'Não foi possível criar a conta.')
    }

    // Obtém token (register não retorna accessToken)
    const loginRes = await illumineDirect('/auth/login', { email, password })
    if (!loginRes.ok) {
      const body = await loginRes.json().catch(() => ({}))
      throw new Error(body?.error || 'Conta criada mas login falhou.')
    }
    const d = await loginRes.json()
    await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)

    const session = { user: d.user, accessToken: d.accessToken }
    _authCallback?.('SIGNED_IN', session)
    AnalyticsService.trackEvent('authentication_succeeded', { method: 'signup' })

    return { user: d.user, session }
  },

  // ─── LOGIN EMAIL/SENHA ────────────────────────────────────────────────────────

  async signIn(email: string, password: string) {
    const d = await loginWithIllumine(email, password)
    const session = { user: d.user, accessToken: d.accessToken }
    _authCallback?.('SIGNED_IN', session)
    AnalyticsService.trackEvent('authentication_succeeded', { method: 'email_password' })
    return { user: d.user, session }
  },

  // ─── OAUTH (Google / Apple) — ainda usa Supabase como bridge ─────────────────

  async signInWithOAuth(provider: 'google' | 'apple', idTokenOrRedirect?: string) {
    if (idTokenOrRedirect && provider === 'google') {
      // Autentica com Google via Supabase para obter email/id do usuário
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idTokenOrRedirect,
      })
      if (error) throw error
      if (!data?.user) throw new Error('OAUTH_FAILED')

      if (!illumineAuth.isAuthenticated()) {
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
        const avatar = data.user.user_metadata?.avatar_url || ''
        const provisionalPass = `google:${data.user.id}`

        // Tenta registrar no Illumine com "senha" provisória baseada no id Google
        const regRes = await illumineDirect('/auth/register', {
          email: data.user.email!,
          password: provisionalPass,
          name,
          tenantSlug: TENANT_SLUG,
          provider: 'google',
        })

        if (regRes.ok || regRes.status === 409) {
          // register OK (201) ou conta já existe (409) → faz login
          const loginRes = await illumineDirect('/auth/login', {
            email: data.user.email!,
            password: provisionalPass,
          })
          if (loginRes.ok) {
            const d = await loginRes.json()
            if (d.accessToken) {
              await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
            }
          }
        }

        if (illumineAuth.isAuthenticated() && (name || avatar)) {
          illumineFetch('/users/me', {
            method: 'PATCH',
            body: JSON.stringify({ ...(name && { name }), ...(avatar && { avatar }) }),
          }).catch(() => {})
        }
      }

      const illUser = illumineAuth.getUser() ?? data.user
      const session = { user: illUser, accessToken: illumineAuth.getAccessToken() }
      _authCallback?.('SIGNED_IN', session)
      AnalyticsService.trackEvent('authentication_succeeded', { method: 'google_oauth' })
      return { session, user: illUser }
    }

    // Redirect flow (OAuth sem idToken)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + (idTokenOrRedirect || '/app') },
    })
    if (error) throw error
    return data
  },

  // ─── VERIFICAÇÃO DE E-MAIL ───────────────────────────────────────────────────

  async checkEmail(email: string): Promise<{ exists: boolean; name?: string; avatar?: string; hasPassword?: boolean }> {
    const res = await illumineDirect('/auth/lookup', { email })
    if (res.ok) return await res.json()
    return { exists: false }
  },

  // ─── RECUPERAÇÃO DE SENHA ────────────────────────────────────────────────────

  async resetPassword(email: string): Promise<void> {
    const redirectUrl = `${window.location.origin}/reset-password`
    const res = await illumineDirect('/auth/reset-password', { email, tenantSlug: TENANT_SLUG, redirectUrl })
    if (res.ok) return
    throw new Error('RESET_FAILED')
  },

  // ─── LOGOUT ──────────────────────────────────────────────────────────────────

  async signOut() {
    try { await illumineFetch('/auth/logout', { method: 'POST' }) } catch {}
    await illumineAuth.clearTokens()
    try { await supabase.auth.signOut() } catch {}
    _authCallback?.('SIGNED_OUT', null)
  },

  // ─── SESSÃO ──────────────────────────────────────────────────────────────────

  async getSession() {
    await illumineAuth.init()
    const token = illumineAuth.getAccessToken()
    if (!token) return null

    // Usa dados em cache primeiro (evita logout em refresh quando L1 tem NO_TENANT)
    const cached = illumineAuth.getUser()
    if (cached) return { user: cached, accessToken: token }

    // Sem cache: tenta L1 para obter perfil
    try {
      const res = await illumineFetch('/users/me')
      if (res.ok) {
        const user = await res.json()
        await illumineAuth.saveUser(user)
        return { user, accessToken: token }
      }
    } catch {}
    return null
  },

  getUser() {
    return illumineAuth.getUser()
  },

  // ─── LISTENER DE AUTH ────────────────────────────────────────────────────────
  // Iluminado-first: verifica token armazenado no mount; Supabase só para OAuth redirect.

  onAuthStateChange(callback: (event: string, session: any) => void) {
    _authCallback = callback

    // Verifica sessão Illumine ao montar (token em storage)
    this.getSession()
      .then(session => {
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
      })
      .catch(() => callback('SIGNED_OUT', null))

    // Mantém listener Supabase APENAS para OAuth redirect (Google/Apple)
    const { data } = supabase.auth.onAuthStateChange(async (event, supaSession) => {
      if (event === 'SIGNED_IN' && supaSession?.user && !illumineAuth.isAuthenticated()) {
        // Chegou de um redirect OAuth — ponte para Illumine
        const email = supaSession.user.email
        const id = supaSession.user.id
        const name = supaSession.user.user_metadata?.full_name || ''
        const provisionalPass = `oauth:${id}`

        const regRes = await illumineDirect('/auth/register', {
          email: email!,
          password: provisionalPass,
          name,
          tenantSlug: TENANT_SLUG,
          provider: supaSession.user.app_metadata?.provider || 'oauth',
        })
        if (regRes.ok || regRes.status === 409) {
          const loginRes = await illumineDirect('/auth/login', {
            email: email!,
            password: provisionalPass,
          })
          if (loginRes.ok) {
            const d = await loginRes.json()
            if (d.accessToken) {
              await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
              const session = { user: d.user, accessToken: d.accessToken }
              callback('SIGNED_IN', session)
              AnalyticsService.trackEvent('authentication_succeeded', { method: 'oauth_redirect' })
            }
          }
        }
      }
    })

    return data.subscription
  },
}
