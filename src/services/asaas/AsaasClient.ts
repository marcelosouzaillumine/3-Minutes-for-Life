export interface AsaasClientConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

export class AsaasApiError extends Error {
  status: number;
  payload: any;
  constructor(status: number, payload: any, message: string) {
    super(message);
    this.status = status;
    this.payload = payload;
    this.name = 'AsaasApiError';
  }
}

export class AsaasClient {
  private baseUrl: string;
  private config: AsaasClientConfig;

  constructor(config: AsaasClientConfig) {
    this.config = config;
    if (!config.apiKey) {
      throw new Error('AsaasClient requires an apiKey');
    }
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'access_token': this.config.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': '3MinutesForLife-Mission-Integration'
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error: any) {
      throw new Error(`Asaas Network Error: ${error.message}`);
    }

    if (!response.ok) {
      let errorPayload;
      try {
        errorPayload = await response.json();
      } catch (e) {
        errorPayload = { error: response.statusText };
      }
      throw new AsaasApiError(
        response.status, 
        errorPayload, 
        `Asaas API Error ${response.status} on ${method} ${endpoint}`
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }
}
