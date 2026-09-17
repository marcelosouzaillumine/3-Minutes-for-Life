import { illumineFetch, illumineAuth } from '../lib/illumine'
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

  // ─── OAUTH (Google) — direto no L1, sem Supabase ────────────────────────────

  async signInWithOAuth(provider: 'google' | 'apple', idToken?: string) {
    if (!idToken) throw new Error('OAUTH_FAILED')

    const res = await illumineDirect('/auth/oauth', {
      provider,
      idToken,
      tenantSlug: TENANT_SLUG,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const code = body.error || 'OAUTH_FAILED'
      if (code === 'OAUTH_NOT_CONFIGURED') throw new Error('Login OAuth não configurado no servidor.')
      throw new Error(body.message || code)
    }

    const d = await res.json()
    await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
    const session = { user: d.user, accessToken: d.accessToken }
    _authCallback?.('SIGNED_IN', session)
    AnalyticsService.trackEvent('authentication_succeeded', { method: `${provider}_oauth` })
    return { session, user: d.user }
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

  onAuthStateChange(callback: (event: string, session: any) => void) {
    _authCallback = callback

    // Verifica sessão L1 ao montar (token em storage)
    this.getSession()
      .then(session => {
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
      })
      .catch(() => callback('SIGNED_OUT', null))

    // Retorna objeto compatível com a interface do Supabase (subscription.unsubscribe)
    return { unsubscribe: () => { _authCallback = null } }
  },
}
