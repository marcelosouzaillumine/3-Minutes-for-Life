const ILLUMINE_URL = import.meta.env.VITE_ILLUMINE_URL as string
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG as string

interface TenantBranding {
  name: string
  logoUrl: string | null
  iconUrl: string | null
  primaryColor: string | null
}

let _branding: TenantBranding | null = null

export async function initBranding(): Promise<void> {
  if (!ILLUMINE_URL || !TENANT_SLUG) return
  try {
    const res = await fetch(`${ILLUMINE_URL}/tenants/by-slug/${TENANT_SLUG}`)
    if (!res.ok) return
    const data: TenantBranding = await res.json()
    _branding = data
    applyBrandingToDOM(data)
  } catch {
    // silently fall back to hardcoded CSS values
  }
}

export function getBranding(): TenantBranding | null {
  return _branding
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
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
