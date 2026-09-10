const STORAGE_KEY = 'keyprobe-theme';
const LIGHT_CLASS = 'light';
function applyTheme(isLight) {
    document.documentElement.classList.toggle(LIGHT_CLASS, isLight);
    const label = document.querySelector('.theme-label');
    if (label)
        label.textContent = isLight ? 'Dark' : 'Light';
}
function toggle() {
    const nowLight = !document.documentElement.classList.contains(LIGHT_CLASS);
    applyTheme(nowLight);
    localStorage.setItem(STORAGE_KEY, nowLight ? 'light' : 'dark');
}
export function initTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isLight = stored ? stored === 'light' : !prefersDark;
    applyTheme(isLight);
    // Both desktop and mobile toggles share the same handler
    document.getElementById('theme-toggle')?.addEventListener('click', toggle);
    document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggle);
}
