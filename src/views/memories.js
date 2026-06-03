import { loadMemories } from '../storage.js';
import { showToast } from '../utils/toast.js';
import { UPLOAD_ENABLED } from '../config.js';

export function renderMemories(container, { navigate }) {
  let currentIndex = 0;
  let lastDirection = 0;
  let isAnimating = false;
  let items = [];
  let loading = true;

  async function refreshData() {
    items = await loadMemories();
  }

  async function init() {
    loading = true;
    renderShell();
    try {
      await refreshData();
    } catch {
      showToast('Could not load memories');
    }
    loading = false;
    renderShell();
    bindEvents();
  }

  function renderShell() {
    container.innerHTML = `
      <section class="page page--scroll memories">
        <div class="shell">
          <nav class="nav-bar">
            <button type="button" class="btn btn--ghost" id="back-menu">← menu</button>
            <span class="nav-bar__title">memories</span>
            <span class="nav-bar__spacer"></span>
          </nav>

          <div id="stack-area">
            ${loading ? '<p class="loading-msg">loading memories…</p>' : ''}
          </div>

          ${UPLOAD_ENABLED ? uploadPanelHtml() : ''}
        </div>
      </section>
    `;

    if (!loading) renderStack();
  }

  function uploadPanelHtml() {
    return `
      <section class="editor" aria-label="Add memories">
        <h4 class="editor__title">✎ add photos, videos & captions</h4>
        <form id="upload-form">
          <div class="editor__row">
            <label for="upload-media">Photo or video from device</label>
            <input type="file" id="upload-media" accept="image/*,video/*" required />
          </div>
          <div class="editor__row">
            <label for="upload-caption">Caption</label>
            <input type="text" id="upload-caption" placeholder="What happened in this moment?" />
          </div>
          <div class="editor__actions">
            <button type="submit" class="btn btn--small" id="upload-btn">add memory</button>
          </div>
        </form>
        <div class="memory-list" id="memory-list"></div>
      </section>
    `;
  }

  function bindEvents() {
    container.querySelector('#back-menu')?.addEventListener('click', () => {
      navigate('/menu');
    });
  }

  function renderStack() {
    const area = container.querySelector('#stack-area');
    if (!area) return;

    if (!items.length) {
      area.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🌸</div>
          <p>No memories yet.</p>
        </div>
      `;
      return;
    }

    const len = items.length;
    const idx = ((currentIndex % len) + len) % len;
    const front = items[idx];
    const back1 = items[(idx + 1) % len];
    const back2 = items[(idx + 2) % len];

    area.innerHTML = `
      <p class="stack-hint">swipe right or tap for next · swipe left for previous ♡</p>
      <div
        class="stack-wrap"
        id="stack"
        tabindex="0"
        role="group"
        aria-label="Memory gallery"
      >
        ${len > 2 ? cardHtml(back2, 'back-2', false) : ''}
        ${len > 1 ? cardHtml(back1, 'back-1', false) : ''}
        ${cardHtml(front, 'front', true, {
          caption: front.caption,
          index: idx + 1,
          total: len,
        })}
      </div>
    `;

    setupFrontMedia(area);
    animateStackEntrance(area, lastDirection);
    lastDirection = 0;
    bindStackNavigation(area, len);
  }

  function bindStackNavigation(area, len) {
    const stack = area.querySelector('#stack');
    if (!stack) return;

    const SWIPE_THRESHOLD = 48;
    let touchStartX = 0;
    let touchStartY = 0;
    let pointerStartX = null;
    let didSwipe = false;

    function goNext() {
      if (len <= 1) return;
      lastDirection = 1;
      navigateMemory(area, stack, 1, 'stack-card--exiting');
    }

    function goPrev() {
      if (len <= 1) return;
      lastDirection = -1;
      navigateMemory(area, stack, -1, 'stack-card--exiting-left');
    }

    area.addEventListener('touchstart', (e) => {
      if (e.target.closest('video')) return;
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
      didSwipe = false;
    }, { passive: true });

    area.addEventListener('touchend', (e) => {
      if (e.target.closest('video')) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      didSwipe = true;
      if (dx > 0) goNext();
      else goPrev();
    }, { passive: true });

    stack.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.target.closest('video')) return;
      pointerStartX = e.clientX;
      didSwipe = false;
    });

    stack.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch' || pointerStartX === null || e.target.closest('video')) return;
      const dx = e.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      didSwipe = true;
      if (dx > 0) goNext();
      else goPrev();
    });

    stack.addEventListener('click', (e) => {
      if (len <= 1) return;
      if (didSwipe) {
        didSwipe = false;
        return;
      }
      if (e.target.closest('video')) return;
      goNext();
    });

    stack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    });
  }

  function navigateMemory(area, stack, direction, exitClass) {
    const len = items.length;
    if (isAnimating || len <= 1) return;

    pauseAllVideos(area);
    isAnimating = true;
    const frontEl = stack.querySelector('.stack-card--front');
    frontEl.classList.add(exitClass);

    setTimeout(() => {
      currentIndex = (currentIndex + direction + len) % len;
      isAnimating = false;
      renderStack();
    }, 420);
  }

  function setupFrontMedia(area) {
    pauseAllVideos(area);
    const video = area.querySelector('.stack-card--front video');
    if (video) {
      video.muted = true;
      video.controls = true;
      video.play().catch(() => {});
    }
  }

  function animateStackEntrance(area, direction) {
    if (!direction) return;
    const frontEl = area.querySelector('.stack-card--front');
    if (!frontEl) return;
    const enterClass = direction > 0
      ? 'stack-card--entering-right'
      : 'stack-card--entering-left';
    frontEl.classList.add(enterClass);
    requestAnimationFrame(() => {
      frontEl.classList.remove(enterClass);
    });
  }

  function pauseAllVideos(root) {
    root.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
  }

  function cardHtml(item, role, isFront, meta) {
    const roleClass =
      role === 'front'
        ? 'stack-card--front'
        : role === 'back-1'
          ? 'stack-card--back-1'
          : 'stack-card--back-2';
    const media = mediaHtml(item, isFront);
    const caption =
      isFront && meta
        ? `
        <div class="stack-card__caption">
          <p class="stack-card__caption-text">${escapeHtml(meta.caption)}</p>
          <p class="stack-card__counter">${meta.index} / ${meta.total}</p>
        </div>`
        : '';
    const badge =
      item.type === 'video' ? '<span class="stack-card__badge">▶</span>' : '';
    return `
      <div class="stack-card ${roleClass}" data-id="${item.id}">
        <div class="stack-card__frame">
          ${media}
          ${caption}
          ${badge}
        </div>
      </div>
    `;
  }

  function mediaHtml(item, isFront) {
    if (item.type === 'video') {
      return `<video
        class="stack-media"
        src="${item.src}"
        playsinline
        preload="metadata"
        ${isFront ? '' : 'muted'}
        loop
      ></video>`;
    }
    return `<img class="stack-media stack-media--image" src="${item.src}" alt="Memory" loading="lazy" decoding="async" />`;
  }

  init();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
