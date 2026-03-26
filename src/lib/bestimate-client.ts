import crypto from 'crypto';

export interface BestimateConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export class BestimateClient {
  private config: BestimateConfig;

  constructor(config: BestimateConfig) {
    this.config = config;
  }

  private generateSignature(method: string, path: string, body: string, timestamp: string): string {
    const message = `${method.toUpperCase()}${path}${body}${timestamp}`;
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(message)
      .digest('hex');
  }

  async fetch(path: string, options: RequestInit & { noSignature?: boolean } = {}) {
    const response = await this.fetchRaw(path, options);
    return response.json();
  }

  async fetchRaw(path: string, options: RequestInit & { noSignature?: boolean } = {}) {
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : '';
    const timestamp = Date.now().toString();
    
    // The signature must include the full path from the hostname (e.g. /api/check-planning/...)
    const urlObj = new URL(this.config.baseUrl);
    const basePath = urlObj.pathname.endsWith('/') ? urlObj.pathname.slice(0, -1) : urlObj.pathname;
    const fullPathForSignature = `${basePath}${path}`;
    
    const signature = this.generateSignature(method, fullPathForSignature, body, timestamp);

    const url = `${this.config.baseUrl}${path}`;
    
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.apiKey && !options.noSignature) {
      headers['X-API-KEY'] = this.config.apiKey;
      if (this.config.secretKey) {
        headers['X-Signature'] = signature;
        headers['X-Timestamp'] = timestamp;
      }
    } else if (this.config.apiKey && options.noSignature) {
      headers['X-API-KEY'] = this.config.apiKey;
    }

    const fetchOptions = { ...options };
    delete fetchOptions.noSignature;

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Bestimate API Error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return response;
  }

  async cadastralLookup(lat: number, lng: number, signal?: AbortSignal) {
    return this.fetch('/cadastral/lookup', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
      signal
    });
  }

  async valuationSync(data: any, timeout: number = 300, signal?: AbortSignal) {
    return this.fetch(`/valuation/sync?timeout=${timeout}`, {
      method: 'POST',
      body: JSON.stringify(data),
      signal
    });
  }
}

// Singleton instances for common services
export const bestimateClient = new BestimateClient({
  apiKey: process.env.BESTIMATE_API_KEY || '',
  secretKey: process.env.BESTIMATE_SECRET_KEY || '',
  baseUrl: 'https://viet-valuation.basao.com/api',
});
