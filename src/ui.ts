import type { ProbeResult, UIState } from './types';
import { PROVIDERS } from './providers';

// ── Selectors ────────────────────────────────────────────────────────────────
const $ = <T extends HTMLElement>(sel: string): T =>
  document.querySelector<T>(sel)!;

export const els = {
  keyInput:        $<HTMLInputElement>('#key-input'),
  eyeBtn:          $<HTMLButtonElement>('#eye-btn'),
  eyePath:         document.querySelector<SVGPathElement>('#eye-path')!,
  detectedBadge:   $<HTMLElement>('#detected-badge'),
  detectedLabel:   $<HTMLElement>('#detected-label'),
  providerTabs:    document.querySelectorAll<HTMLButtonElement>('.ptab'),
  customWrap:      $<HTMLElement>('#custom-wrap'),
  customEndpoint:  $<HTMLInputElement>('#custom-endpoint'),
  customHeader:    $<HTMLInputElement>('#custom-header'),
  submitBtn:       $<HTMLButtonElement>('#submit-btn'),
  clearBtn:        $<HTMLButtonElement>('#clear-btn'),
  msgBox:          $<HTMLElement>('#msg-box'),
  resultCard:      $<HTMLElement>('#result-card'),
  rcProvider:      $<HTMLElement>('#rc-provider'),
  rcStatus:        $<HTMLElement>('#rc-status'),
  rcCode:          $<HTMLElement>('#rc-code'),
  rcLatency:       $<HTMLElement>('#rc-latency'),
  rcDocs:          $<HTMLAnchorElement>('#rc-docs'),
  keyLengthBadge:  $<HTMLElement>('#key-length'),
  historyList:     $<HTMLElement>('#history-list'),
  historySection:  $<HTMLElement>('#history-section'),
  copyBtn:         $<HTMLButtonElement>('#copy-result-btn'),
};

const EYE_OPEN =
  'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z';
const EYE_SHUT =
  'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22';

// ── Toggle password visibility ───────────────────────────────────────────────
export function toggleVisibility(): void {
  const isHidden = els.keyInput.type === 'password';
  els.keyInput.type = isHidden ? 'text' : 'password';
  els.eyePath.setAttribute('d', isHidden ? EYE_SHUT : EYE_OPEN);
}

// ── Provider tab selection ───────────────────────────────────────────────────
export function activateProviderTab(id: string): void {
  els.providerTabs.forEach((t) => t.classList.toggle('active', t.dataset['p'] === id));
  const isCustom = id === 'custom';
  els.customWrap.style.display = isCustom ? 'flex' : 'none';
}

// ── Live key length badge ────────────────────────────────────────────────────
export function updateKeyMeta(val: string): void {
  if (val.length > 0) {
    els.keyLengthBadge.textContent = `${val.length} chars`;
    els.keyLengthBadge.style.display = 'block';
  } else {
    els.keyLengthBadge.style.display = 'none';
  }
}

// ── Detected provider badge ──────────────────────────────────────────────────
export function showDetectedBadge(label: string | null): void {
  if (label) {
    els.detectedLabel.textContent = label;
    els.detectedBadge.style.display = 'flex';
  } else {
    els.detectedBadge.style.display = 'none';
  }
}

// ── Message box ──────────────────────────────────────────────────────────────
export function showMsg(text: string, type: 'success' | 'error' | 'loading' | ''): void {
  els.msgBox.textContent = text;
  els.msgBox.className = 'msg-box' + (type ? ` ${type}` : '');
}

export function clearMsg(): void {
  els.msgBox.textContent = '';
  els.msgBox.className = 'msg-box';
}

// ── Loading state ────────────────────────────────────────────────────────────
let _origBtnHTML = '';

export function setLoading(on: boolean): void {
  if (on) {
    _origBtnHTML = els.submitBtn.innerHTML;
    els.submitBtn.innerHTML = '<span>Probing</span><span class="cta-line"></span>';
    els.submitBtn.classList.add('loading');
  } else {
    els.submitBtn.innerHTML = _origBtnHTML;
    els.submitBtn.classList.remove('loading');
  }
}

// ── Result card ──────────────────────────────────────────────────────────────
export function renderResult(result: ProbeResult): void {
  const provider = PROVIDERS.find((p) => p.id === result.provider);

  els.rcProvider.textContent = result.providerLabel;
  els.rcProvider.className = 'result-value';

  els.rcStatus.textContent = result.ok ? 'Valid — Active' : `Invalid — ${result.detail}`;
  els.rcStatus.className = `result-value ${result.ok ? 'ok' : 'fail'}`;

  els.rcCode.textContent = result.status === 0 ? 'N/A' : String(result.status);
  els.rcCode.className = `result-value ${result.ok ? 'ok' : 'fail'}`;

  els.rcLatency.textContent = `${result.latency} ms`;

  if (provider?.docsUrl) {
    els.rcDocs.href = provider.docsUrl;
    els.rcDocs.style.display = 'inline-flex';
  } else {
    els.rcDocs.style.display = 'none';
  }

  els.resultCard.style.display = '';
  els.resultCard.classList.remove('animate-in');
  void els.resultCard.offsetWidth; // reflow
  els.resultCard.classList.add('animate-in');

  els.copyBtn.style.display = 'inline-flex';
}

export function hideResult(): void {
  els.resultCard.style.display = 'none';
  els.copyBtn.style.display = 'none';
}

// ── History ──────────────────────────────────────────────────────────────────
export function appendHistory(result: ProbeResult, maskedKey: string): void {
  els.historySection.style.display = '';

  const item = document.createElement('div');
  item.className = `history-item ${result.ok ? 'ok' : 'fail'}`;
  item.innerHTML = `
    <span class="hi-provider">${result.providerLabel}</span>
    <span class="hi-key">${maskedKey}</span>
    <span class="hi-status ${result.ok ? 'ok' : 'fail'}">${result.ok ? 'Valid' : 'Invalid'}</span>
    <span class="hi-latency">${result.latency}ms</span>
  `;

  els.historyList.prepend(item);

  // Keep max 5 entries
  const items = els.historyList.querySelectorAll('.history-item');
  if (items.length > 5) items[items.length - 1]?.remove();
}

// ── Copy result to clipboard ─────────────────────────────────────────────────
export function copyResult(result: ProbeResult): void {
  const text = [
    `Provider : ${result.providerLabel}`,
    `Status   : ${result.ok ? 'Valid' : 'Invalid'}`,
    `HTTP     : ${result.status || 'N/A'}`,
    `Latency  : ${result.latency} ms`,
    `Detail   : ${result.detail}`,
  ].join('\n');

  navigator.clipboard.writeText(text).then(() => {
    const orig = els.copyBtn.textContent;
    els.copyBtn.textContent = 'Copied';
    setTimeout(() => { els.copyBtn.textContent = orig; }, 1800);
  });
}

// ── State → UI sync ──────────────────────────────────────────────────────────
export function syncState(state: UIState): void {
  activateProviderTab(state.provider);
}
