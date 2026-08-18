import { supabase } from '../lib/supabase';

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface State {
  id: string;
  country_id: string;
  name: string;
  acronym: string;
}

export interface City {
  id: string;
  state_id: string;
  name: string;
}

export const LocationService = {
  async getCountries(): Promise<Country[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getStates(countryId: string): Promise<State[]> {
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .eq('country_id', countryId)
      .order('name');
      
    if (error) throw error;
    return data;
  },

  async getCities(stateId: string): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', stateId)
      .order('name');
      
    if (error) throw error;
    return data;
  }
};
