export function renderMenu(container, { navigate }) {
  container.innerHTML = `
    <section class="page menu">
      <div class="shell shell--center">
        <p class="landing__hearts" aria-hidden="true">♡</p>
        <h2 class="menu__title">choose your path</h2>
        <div class="menu__grid">
          <button type="button" class="menu__card" data-route="/memories">
            <div class="menu__card-icon">📸</div>
            <div class="menu__card-label">memories</div>
          </button>
          <button type="button" class="menu__card" data-route="/letter">
            <div class="menu__card-icon">💌</div>
            <div class="menu__card-label">happy 23rd</div>
          </button>
          <button type="button" class="menu__card" data-route="/love">
            <div class="menu__card-icon">💢</div>
            <div class="menu__card-label">hate you</div>
          </button>
        </div>
        <button type="button" class="btn btn--ghost menu__back" id="back-home">
          ← back
        </button>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.route));
  });

  container.querySelector('#back-home').addEventListener('click', () => {
    navigate('/');
  });
}
