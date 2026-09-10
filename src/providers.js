const HTTP_LABELS = {
    200: 'OK',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Rate Limit Exceeded',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
};
function httpLabel(code) {
    return HTTP_LABELS[code] ?? `HTTP ${code}`;
}
async function probe(url, headers, providerId, providerLabel) {
    const t0 = performance.now();
    try {
        const res = await fetch(url, { headers });
        const latency = Math.round(performance.now() - t0);
        const ok = res.status === 200;
        return {
            ok,
            status: res.status,
            latency,
            provider: providerId,
            providerLabel,
            detail: ok ? 'Key is valid and active.' : httpLabel(res.status),
        };
    }
    catch (err) {
        const latency = Math.round(performance.now() - t0);
        const msg = err instanceof Error ? err.message : 'Network error';
        return {
            ok: false,
            status: 0,
            latency,
            provider: providerId,
            providerLabel,
            detail: `Connection failed — ${msg}`,
        };
    }
}
export const PROVIDERS = [
    {
        id: 'openai',
        label: 'OpenAI',
        prefix: ['sk-proj-', 'sk-'],
        docsUrl: 'https://platform.openai.com/api-keys',
        test: (key) => probe('https://api.openai.com/v1/models', { Authorization: `Bearer ${key}` }, 'openai', 'OpenAI'),
    },
    {
        id: 'anthropic',
        label: 'Anthropic',
        prefix: ['sk-ant-'],
        docsUrl: 'https://console.anthropic.com/settings/keys',
        test: (key) => probe('https://api.anthropic.com/v1/models', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, 'anthropic', 'Anthropic'),
    },
    {
        id: 'gemini',
        label: 'Google Gemini',
        prefix: ['AIza'],
        docsUrl: 'https://aistudio.google.com/app/apikey',
        test: (key) => probe(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {}, 'gemini', 'Google Gemini'),
    },
    {
        id: 'cohere',
        label: 'Cohere',
        prefix: [],
        docsUrl: 'https://dashboard.cohere.com/api-keys',
        test: (key) => probe('https://api.cohere.ai/v1/models', { Authorization: `Bearer ${key}` }, 'cohere', 'Cohere'),
    },
    {
        id: 'mistral',
        label: 'Mistral',
        prefix: [],
        docsUrl: 'https://console.mistral.ai/api-keys',
        test: (key) => probe('https://api.mistral.ai/v1/models', { Authorization: `Bearer ${key}` }, 'mistral', 'Mistral'),
    },
];
export function detectProvider(key) {
    // Longest prefix wins — anthropic (sk-ant-) before openai (sk-)
    const sorted = [...PROVIDERS].sort((a, b) => Math.max(...b.prefix.map((p) => p.length)) - Math.max(...a.prefix.map((p) => p.length)));
    for (const p of sorted) {
        if (p.prefix.some((pfx) => key.startsWith(pfx)))
            return p;
    }
    return null;
}
export function getProvider(id) {
    return PROVIDERS.find((p) => p.id === id);
}
