import './style.css';
import { init } from './tester';
import { initTheme } from './theme';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  init();
});
