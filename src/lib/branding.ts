const ILLUMINE_URL = import.meta.env.VITE_ILLUMINE_URL as string
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG as string

interface TenantBranding {
  name: string
  logoUrl: string | null
  iconUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  website: string | null
  contactEmail: string | null
  razaoSocial: string | null
  cnpj: string | null
  addressCity: string | null
  addressState: string | null
  authorName: string | null
  authorRole: string | null
}

let _branding: TenantBranding | null = null
let _brandingPromise: Promise<void> | null = null

export function initBranding(): Promise<void> {
  if (_brandingPromise) return _brandingPromise
  _brandingPromise = (async () => {
    if (!ILLUMINE_URL || !TENANT_SLUG) return
    try {
      const res = await fetch(`${ILLUMINE_URL}/tenants/by-slug/${TENANT_SLUG}`)
      if (!res.ok) return
      const data: TenantBranding = await res.json()
      _branding = data
      applyBrandingToDOM(data)
    } catch {
      // silently fall back to hardcoded CSS/assets
    }
  })()
  return _brandingPromise
}

export function getBranding(): TenantBranding | null {
  return _branding
}

// Para componentes que precisam saber quando o branding do tenant já
// carregou (ou falhou/não existe) antes de decidir o que renderizar.
export function onBrandingReady(): Promise<void> {
  return initBranding()
}

function applyBrandingToDOM(b: TenantBranding): void {
  const root = document.documentElement
  if (b.primaryColor) {
    // Override accent/gold variables with the partner's primary color
    root.style.setProperty('--brand-gold', b.primaryColor)
    root.style.setProperty('--accent-on-dark', b.primaryColor)
    // Darker shade for text links and strong accents
    root.style.setProperty('--accent-strong', shadeColor(b.primaryColor, -25))
    root.style.setProperty('--accent-hover', shadeColor(b.primaryColor, -35))
  }
  if (b.secondaryColor) {
    // Cor de acento usada em telas de admin/formulários (var(--color-accent,
    // #c46d53) — o hex é só o valor padrão do 3MFL, sobrescrito aqui quando
    // o tenant configura uma cor própria).
    root.style.setProperty('--color-accent', b.secondaryColor)
  }
  if (b.iconUrl) {
    // A aba do navegador só lê os <link rel="icon"> do próprio index.html —
    // trocar isso aqui é o único jeito de refletir o ícone do tenant sem
    // rebuild. O ícone do PWA instalado (manifest.webmanifest) é gerado em
    // build time e não é afetado por esta troca em runtime.
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]')
      .forEach(link => { link.href = b.iconUrl! })
  }
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
