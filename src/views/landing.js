export function renderLanding(container, { navigate }) {
  container.innerHTML = `
    <section class="page landing">
      <div class="shell shell--center">
        <p class="landing__hearts" aria-hidden="true">♡ ♡ ♡</p>
        <h1 class="landing__title">HAPPY BIRTHDAYYY <span>PIYUUU</span></h1>
        <p class="landing__subtitle">by your cutu batutu</p>
        <button type="button" class="btn btn--primary" id="proceed-btn">
          click here for surprise →
        </button>
      </div>
    </section>
  `;

  container.querySelector('#proceed-btn').addEventListener('click', () => {
    navigate('/menu');
  });
}
