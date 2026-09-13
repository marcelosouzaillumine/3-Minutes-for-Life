import { illumineFetch, illumineAuth } from '../lib/illumine'
import { supabase } from '../lib/supabase'
import { AnalyticsService } from './AnalyticsService'

const ILLUMINE_URL = import.meta.env.VITE_ILLUMINE_URL as string
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || '3minutes'

// Previne forced-logout enquanto o signIn está obtendo o token Illumine.
// Supabase dispara onAuthStateChange imediatamente ao criar a sessão,
// antes de ensureIllumineSession() salvar o token — sem esta flag, o check
// !illumineAuth.isAuthenticated() faria logout durante o próprio login.
let _signingIn = false

// Chama diretamente (sem Bearer) para não depender de token existente
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

// Obtém/renova sessão Illumine OS usando email+senha.
// Se o usuário não existe no Illumine ainda (usuário legado do Supabase), cria a conta.
async function ensureIllumineSession(
  email: string,
  password: string,
  metadata?: { name?: string; phone?: string; country?: string; state?: string; city?: string }
): Promise<boolean> {
  // 1. Tenta login direto no Illumine OS
  const loginRes = await illumineDirect('/auth/login', { email, password })

  if (loginRes.ok) {
    const d = await loginRes.json()
    if (d.accessToken) {
      await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
      return true
    }
  }

  // 2. 401 → usuário pode não ter conta no Illumine (conta criada antes da migração)
  //    Tenta criar automaticamente com as mesmas credenciais
  if (loginRes.status === 401) {
    const name = metadata?.name || email.split('@')[0]
    const regRes = await illumineDirect('/auth/register', {
      email,
      password,
      name,
      phone: metadata?.phone,
      country: metadata?.country,
      state: metadata?.state,
      city: metadata?.city,
      tenantSlug: TENANT_SLUG,
    })

    // L1 /auth/register retorna 201 mas sem accessToken — busca o token via login
    if (regRes.ok) {
      const loginAfterReg = await illumineDirect('/auth/login', { email, password })
      if (loginAfterReg.ok) {
        const d = await loginAfterReg.json()
        if (d.accessToken) {
          await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
          return true
        }
      }
    }

    // 409 Conflict = já existe no Illumine com senha diferente (mudança de senha não sincronizada)
    // Não há o que fazer sem o exchange endpoint no L1
    if (regRes.status === 409) {
      console.warn('[Auth] Usuário existe no Illumine com senha diferente — sessão L1 não obtida')
    }
  }

  return false
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
    // 1. Cadastra no Illumine OS (L1 é a fonte de verdade)
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

    if (regRes.ok) {
      // L1 /auth/register não retorna accessToken — busca via login imediatamente
      const loginAfterReg = await illumineDirect('/auth/login', { email, password })
      if (loginAfterReg.ok) {
        const d = await loginAfterReg.json()
        if (d.accessToken) await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
      }
    } else if (regRes.status !== 409) {
      // 409 = já existe, segue adiante; outros erros são fatais
      const body = await regRes.json().catch(() => ({}))
      throw new Error(body?.error || body?.message || 'Não foi possível criar a conta.')
    }

    // 2. Também registra no Supabase Auth (para OAuth e recuperação de senha por e-mail)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone || null, country, state, city, accepts_updates: acceptsUpdates },
      },
    })
    if (error && !error.message?.includes('already registered')) throw error

    const activeUser = data?.user || illumineAuth.getUser()
    return { ...data, user: activeUser }
  },

  async signIn(email: string, password: string) {
    _signingIn = true
    try {
      // 1. Valida credenciais no Supabase Auth (fonte de verdade para senhas)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // 2. Com credenciais validadas, obtém token Illumine OS
      //    Auto-provisiona a conta Illumine caso ainda não exista (usuário legado do Supabase)
      const name = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name
      await ensureIllumineSession(email, password, { name })

      return { session: data.session, user: data.user }
    } finally {
      _signingIn = false
    }
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

      // 2. Para OAuth não temos a senha — tenta criar conta Illumine com token Google como identificador
      // Se já existe, o login subsequente vai precisar de recuperação de senha ou exchange
      if (!illumineAuth.isAuthenticated()) {
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
        const avatar = data.user.user_metadata?.avatar_url || ''

        // Tenta registrar no Illumine OS com token Google como "password" provisória
        const regRes = await illumineDirect('/auth/register', {
          email: data.user.email!,
          // Usa o sub do Google como senha provisória — usuário nunca precisará dela
          password: `google:${data.user.id}`,
          name,
          tenantSlug: TENANT_SLUG,
          provider: 'google',
        })
        // L1 /auth/register não retorna accessToken — busca via login após registro
        const provisionalPass = `google:${data.user.id}`
        if (regRes.ok || regRes.status === 409) {
          const loginRes = await illumineDirect('/auth/login', {
            email: data.user.email!,
            password: provisionalPass,
          })
          if (loginRes.ok) {
            const d = await loginRes.json()
            if (d.accessToken) await illumineAuth.saveTokens(d.accessToken, d.refreshToken, d.user)
          }
        }

        // Sincroniza metadados do OAuth no Illumine OS
        if (illumineAuth.isAuthenticated() && (name || avatar)) {
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
    const res = await illumineDirect('/auth/lookup', { email })
    if (res.ok) return await res.json()
    return { exists: false }
  },

  async resetPassword(email: string): Promise<void> {
    // Tenta via Illumine OS primeiro
    try {
      const res = await illumineDirect('/auth/reset-password', { email, tenantSlug: TENANT_SLUG })
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

    // 3. Encerra sessão Supabase Auth
    try {
      await supabase.auth.signOut()
    } catch {}
  },

  async getSession() {
    // 1. Sessão Illumine ativa (init() é aguardado dentro de illumineFetch)
    try {
      const res = await illumineFetch('/users/me')
      if (res.ok) {
        const user = await res.json()
        await illumineAuth.saveUser(user)
        return { user, accessToken: illumineAuth.getAccessToken() }
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

      if (session?.user) {
        // Sem token Illumine armazenado = usuário logou antes do L1 existir.
        // Força re-login para que ensureIllumineSession() provisione a conta.
        // _signingIn suprime este check durante o signIn (race condition: Supabase
        // dispara onAuthStateChange antes de ensureIllumineSession salvar o token).
        if (!illumineAuth.isAuthenticated() && !_signingIn) {
          console.warn('[Auth] Sessão Supabase sem token Illumine OS — forçando re-login')
          try { await supabase.auth.signOut() } catch {}
          callback('SIGNED_OUT', null)
          return
        }

        const illSession = await this.getSession().catch(() => null)
        const formattedSession = {
          session,
          user: {
            ...session.user,
            id: session.user.id,
            email: session.user.email || '',
            name: illSession?.user?.name || session.user.user_metadata?.full_name || '',
            avatar: illSession?.user?.avatar || session.user.user_metadata?.avatar_url || '',
            role: illSession?.user?.role || session.user.role,
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
