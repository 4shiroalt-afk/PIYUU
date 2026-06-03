import { loadLetter } from '../storage.js';
import { showToast } from '../utils/toast.js';

export function renderLetter(container, { navigate }) {
  container.innerHTML = `
    <section class="page page--scroll letter-page">
      <div class="shell">
        <nav class="nav-bar">
          <button type="button" class="btn btn--ghost" id="back-menu">← menu</button>
          <span class="nav-bar__title">happy 23rd</span>
          <span class="nav-bar__spacer"></span>
        </nav>

        <div class="letter-scene">
          <div class="envelope" id="envelope" role="button" tabindex="0" aria-label="Open envelope">
            <div class="envelope__base"></div>
            <div class="envelope__letter-preview"></div>
            <div class="envelope__flap"></div>
            <div class="envelope__pocket"></div>
            <p class="envelope__tap">tap to open ♡</p>
          </div>

          <article class="letter-paper" id="letter-paper" aria-hidden="true">
            <div class="letter-paper__inner">
              <div class="letter-paper__content" id="letter-display">loading…</div>
              <p class="letter-paper__seal">♡</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  `;

  const display = container.querySelector('#letter-display');

  loadLetter()
    .then((text) => {
      display.textContent = text;
    })
    .catch(() => {
      display.textContent = 'Could not load letter.';
      showToast('Could not load letter');
    });

  const envelope = container.querySelector('#envelope');
  const paper = container.querySelector('#letter-paper');
  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    envelope.classList.add('envelope--open');
    paper.classList.add('letter-paper--visible');
    paper.setAttribute('aria-hidden', 'false');
  }

  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  container.querySelector('#back-menu').addEventListener('click', () => {
    navigate('/menu');
  });
}
