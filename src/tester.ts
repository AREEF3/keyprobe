import type { ProbeResult, ProviderId, UIState } from './types';
import { detectProvider, getProvider, PROVIDERS } from './providers';
import {
  els,
  setLoading,
  showMsg,
  renderResult,
  hideResult,
  appendHistory,
  showDetectedBadge,
  updateKeyMeta,
  activateProviderTab,
  toggleVisibility,
  copyResult,
  clearMsg,
} from './ui';

// ── App state ────────────────────────────────────────────────────────────────
const state: UIState = {
  provider: 'auto',
  testing: false,
  lastResult: null,
};

// ── Key input handler ────────────────────────────────────────────────────────
function onKeyInput(): void {
  const val = els.keyInput.value.trim();
  updateKeyMeta(val);

  if (state.provider !== 'auto') {
    showDetectedBadge(null);
    return;
  }

  const detected = detectProvider(val);
  showDetectedBadge(detected ? `Detected — ${detected.label}` : null);
}

// ── Provider tab click ───────────────────────────────────────────────────────
function onProviderTab(e: Event): void {
  const btn = e.currentTarget as HTMLButtonElement;
  const p = btn.dataset['p'] as ProviderId | 'auto';
  state.provider = p;
  activateProviderTab(p);
  onKeyInput(); // refresh badge
}

// ── Main probe ───────────────────────────────────────────────────────────────
async function runProbe(): Promise<void> {
  if (state.testing) return;

  const key = els.keyInput.value.trim();
  if (!key) {
    showMsg('Paste an API key to begin.', 'error');
    return;
  }

  // Resolve provider
  let resolvedId: ProviderId | null = null;

  if (state.provider === 'auto') {
    const detected = detectProvider(key);
    if (!detected) {
      showMsg('Provider could not be detected from the key prefix. Select one manually.', 'error');
      return;
    }
    resolvedId = detected.id;
  } else if (state.provider === 'custom') {
    resolvedId = 'custom';
  } else {
    resolvedId = state.provider;
  }

  state.testing = true;
  setLoading(true);
  hideResult();
  showMsg('Sending probe request — this takes a moment.', 'loading');

  let result: ProbeResult;

  try {
    if (resolvedId === 'custom') {
      result = await probeCustom(key);
    } else {
      const provider = getProvider(resolvedId);
      if (!provider) throw new Error('Unknown provider');
      result = await provider.test(key);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    result = {
      ok: false,
      status: 0,
      latency: 0,
      provider: resolvedId ?? 'unknown',
      providerLabel: resolvedId ?? 'Unknown',
      detail: msg,
    };
  }

  state.lastResult = result;
  state.testing = false;
  setLoading(false);

  showMsg(
    result.ok
      ? `Key verified successfully — ${result.providerLabel} responded with HTTP ${result.status}.`
      : `Verification failed — ${result.detail}`,
    result.ok ? 'success' : 'error',
  );

  renderResult(result);
  appendHistory(result, maskKey(key));
}

// ── Custom endpoint probe ────────────────────────────────────────────────────
async function probeCustom(key: string): Promise<ProbeResult> {
  const endpoint = els.customEndpoint.value.trim();
  const headerName = els.customHeader.value.trim() || 'Authorization';

  if (!endpoint) {
    return {
      ok: false,
      status: 0,
      latency: 0,
      provider: 'custom',
      providerLabel: 'Custom',
      detail: 'No endpoint URL provided.',
    };
  }

  const t0 = performance.now();
  try {
    const res = await fetch(endpoint, {
      headers: { [headerName]: `Bearer ${key}` },
    });
    const latency = Math.round(performance.now() - t0);
    return {
      ok: res.ok,
      status: res.status,
      latency,
      provider: 'custom',
      providerLabel: 'Custom',
      detail: res.ok ? 'Endpoint responded successfully.' : `HTTP ${res.status}`,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - t0);
    return {
      ok: false,
      status: 0,
      latency,
      provider: 'custom',
      providerLabel: 'Custom',
      detail: err instanceof Error ? err.message : 'Network error',
    };
  }
}

// ── Mask key for history display ─────────────────────────────────────────────
function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 6) + '••••••••' + key.slice(-4);
}

// ── Clear ────────────────────────────────────────────────────────────────────
function clearAll(): void {
  els.keyInput.value = '';
  els.keyInput.type = 'password';
  updateKeyMeta('');
  showDetectedBadge(null);
  hideResult();
  clearMsg();
  state.lastResult = null;
  state.provider = 'auto';
  activateProviderTab('auto');
}

// ── Copy result ──────────────────────────────────────────────────────────────
function onCopy(): void {
  if (state.lastResult) copyResult(state.lastResult);
}

// ── Keyboard shortcut ────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    runProbe();
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
export function init(): void {
  els.keyInput.addEventListener('input', onKeyInput);
  els.eyeBtn.addEventListener('click', toggleVisibility);
  els.submitBtn.addEventListener('click', runProbe);
  els.clearBtn.addEventListener('click', clearAll);
  els.copyBtn.addEventListener('click', onCopy);
  document.addEventListener('keydown', onKeydown);

  els.providerTabs.forEach((tab) => tab.addEventListener('click', onProviderTab));

  // Populate provider tabs dynamically
  const tabsContainer = document.querySelector<HTMLElement>('.provider-tabs');
  if (tabsContainer) {
    PROVIDERS.forEach((p) => {
      if (!tabsContainer.querySelector(`[data-p="${p.id}"]`)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ptab';
        btn.dataset['p'] = p.id;
        btn.textContent = p.label;
        btn.addEventListener('click', onProviderTab);
        tabsContainer.appendChild(btn);
      }
    });
  }
}
