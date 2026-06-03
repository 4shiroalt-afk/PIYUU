export function renderLove(container, { navigate }) {
  const messages = [
    'just kidding i love you',
    'didnt i tell you that i love you',
    'i love you cutu',
    'yeshtu sala heli ily',
    'I-L-O-V-V-E-Y-O-U',
    'loveee you',
  ];

  let messageIndex = 0;
  let sequenceComplete = false;

  container.innerHTML = `
    <section class="page love-page">
      <nav class="nav-bar">
        <button type="button" class="btn btn--ghost" id="back-menu">← menu</button>
        <span class="nav-bar__title"></span>
        <span class="nav-bar__spacer"></span>
      </nav>
      <div id="love-buttons-area"></div>
    </section>
  `;

  const lovePage = container.querySelector('section.page.love-page');
  const backBtn = container.querySelector('#back-menu');

  backBtn.addEventListener('click', () => {
    navigate('/menu');
  });

  function spawnLoveButton() {
    let message;
    if (sequenceComplete) {
      message = messages[5]; // Always show "loveee you"
    } else {
      message = messages[messageIndex];
      messageIndex += 1;
      if (messageIndex >= messages.length) {
        sequenceComplete = true;
      }
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'love-button';
    button.textContent = message;
    positionButtonRandomly(button, lovePage);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      button.remove();
      spawnLoveButton();
    });

    lovePage.appendChild(button);
  }

  function positionButtonRandomly(button, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(220, rect.width - 32);
    const height = 56;
    const left = Math.random() * Math.max(1, rect.width - width - 24) + 12;
    const top = Math.random() * Math.max(1, rect.height - height - 120) + 80;
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
  }

  // Spawn the first button
  spawnLoveButton();
}
