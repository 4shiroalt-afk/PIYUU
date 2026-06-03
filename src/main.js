import { initStorage } from './storage.js';
import { renderLanding } from './views/landing.js';
import { renderMenu } from './views/menu.js';
import { renderMemories } from './views/memories.js';
import { renderLetter } from './views/letter.js';
import { renderLove } from './views/love.js';

const app = document.getElementById('app');

const routes = {
  '/': renderLanding,
  '/menu': renderMenu,
  '/memories': renderMemories,
  '/letter': renderLetter,
  '/love': renderLove,
};

function getPath() {
  const hash = location.hash.slice(1) || '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

function navigate(path) {
  location.hash = path;
}

function render() {
  const path = getPath();
  const view = routes[path] ?? routes['/'];
  app.innerHTML = '';
  view(app, { navigate });
}

async function boot() {
  app.innerHTML = '<p class="boot-msg">loading ♡</p>';
  await initStorage();
  window.addEventListener('hashchange', render);
  render();
}

boot();

export { navigate };
