export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'cohere' | 'mistral' | 'custom';

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  prefix: string[];
  docsUrl: string;
  test: (key: string, customEndpoint?: string) => Promise<ProbeResult>;
}

export interface ProbeResult {
  ok: boolean;
  status: number;
  latency: number;
  provider: ProviderId | 'unknown';
  providerLabel: string;
  detail: string;
  scopes?: string[];
}

export interface UIState {
  provider: ProviderId | 'auto';
  testing: boolean;
  lastResult: ProbeResult | null;
}
