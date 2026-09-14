// IBGE API pública — https://servicodados.ibge.gov.br/api/v1/localidades
// Sem autenticação, sem Supabase.

const IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export interface Country {
  id: string
  name: string
  code: string
}

export interface State {
  id: string
  country_id: string
  name: string
  acronym: string
}

export interface City {
  id: string
  state_id: string
  name: string
}

const BRAZIL: Country = { id: 'BR', name: 'Brasil', code: 'BR' }

export const LocationService = {
  async getCountries(): Promise<Country[]> {
    return [BRAZIL]
  },

  async getStates(countryId: string): Promise<State[]> {
    if (countryId !== 'BR') return []
    const res = await fetch(`${IBGE}/estados?orderBy=nome`)
    if (!res.ok) throw new Error('Falha ao carregar estados')
    const data: Array<{ id: number; sigla: string; nome: string }> = await res.json()
    return data.map(s => ({
      id: String(s.id),
      country_id: 'BR',
      name: s.nome,
      acronym: s.sigla,
    }))
  },

  async getCities(stateId: string): Promise<City[]> {
    const res = await fetch(`${IBGE}/estados/${stateId}/municipios?orderBy=nome`)
    if (!res.ok) throw new Error('Falha ao carregar cidades')
    const data: Array<{ id: number; nome: string }> = await res.json()
    return data.map(c => ({
      id: String(c.id),
      state_id: stateId,
      name: c.nome,
    }))
  },
}
