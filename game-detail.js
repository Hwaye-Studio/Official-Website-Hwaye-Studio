(() => {
  'use strict';

  const catalogPage = document.querySelector('[data-game-page]');
  const detailView = document.querySelector('[data-game-view]');
  if (!catalogPage || !detailView) return;

  const slug = new URLSearchParams(window.location.search).get('game');
  if (!slug) return;

  const catalogSection = document.querySelector('#games-catalog');
  if (catalogSection) catalogSection.hidden = true;
  detailView.hidden = false;

  async function loadGame() {
    try {
      const catalogResponse = await fetch(catalogPage.dataset.catalogSrc, { cache: 'no-cache' });
      if (!catalogResponse.ok) throw new Error(`Game catalog request failed: HTTP ${catalogResponse.status}`);

      const catalogData = await catalogResponse.json();
      const game = catalogData.games && catalogData.games.find(
        (entry) => entry.detailSlug === slug
      );
      if (!game) throw new Error('Game details were not found.');

      document.title = `${game.title} ${game.subtitle} | Hwaye Studio`;
      const gameLogo = detailView.querySelector('[data-game-logo]');
      if (gameLogo) {
        gameLogo.src = game.logo || game.image || '';
        gameLogo.alt = `${game.title || ''} ${game.subtitle || ''} logo`;
      }
      detailView.querySelector('[data-game-about]').textContent = game.description || '';

      const section = detailView.querySelector('.detail-overview');
      if (section && game.image) {
        section.style.backgroundImage = `url("${game.image}")`;
      }

      const trailerSection = detailView.querySelector('[data-game-trailer]');
      if (trailerSection && game.trailerUrl) {
        const trailerUrl = new URL(game.trailerUrl);
        const videoId = trailerUrl.hostname === 'youtu.be'
          ? trailerUrl.pathname.slice(1)
          : trailerUrl.searchParams.get('v') || trailerUrl.pathname.split('/').filter(Boolean).pop();

        if (videoId) {
          const frame = document.createElement('iframe');
          frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
          frame.title = `${game.title} ${game.subtitle} trailer`;
          frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          frame.allowFullscreen = true;
          frame.loading = 'lazy';
          trailerSection.replaceChildren(frame);
        }
      }

      const storeButton = detailView.querySelector('[data-game-store]');
      if (game.steamUrl) {
        storeButton.href = game.steamUrl;
      } else {
        storeButton.removeAttribute('href');
        storeButton.setAttribute('aria-disabled', 'true');
        storeButton.textContent = 'Coming soon';
      }

      const screenshots = Array.isArray(game.screenshots) && game.screenshots.length
        ? game.screenshots
        : game.image ? [game.image] : [];
      const gallery = detailView.querySelector('[data-game-screenshots]');
      const dialog = document.querySelector('[data-screenshot-dialog]');
      const dialogImage = dialog && dialog.querySelector('[data-screenshot-large]');

      if (gallery) {
        const screenshotButtons = screenshots.map((source, index) => {
          const button = document.createElement('button');
          button.className = 'detail-screenshot';
          button.type = 'button';
          button.setAttribute('aria-label', `Open screenshot ${index + 1} for ${game.subtitle}`);

          const image = document.createElement('img');
          image.src = source;
          image.alt = `${game.subtitle} screenshot ${index + 1}`;
          image.loading = 'lazy';
          button.appendChild(image);
          return button;
        });
        gallery.replaceChildren(...screenshotButtons);
      }

      if (gallery && dialog && dialogImage) {
        gallery.addEventListener('click', (event) => {
          const button = event.target.closest('.detail-screenshot');
          if (!button) return;
          const image = button.querySelector('img');
          dialogImage.src = image.src;
          dialogImage.alt = image.alt;
          dialog.showModal();
        });

        dialog.querySelector('[data-screenshot-close]').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (event) => {
          if (event.target === dialog) dialog.close();
        });
      }
    } catch (error) {
      const message = detailView.querySelector('[data-detail-error]');
      if (message) {
        message.hidden = false;
        message.textContent = 'Game details could not be loaded. Please return to the games catalog.';
      }
      console.error('Hwaye Studio: Failed to load game details.', error);
    }
  }

  loadGame();
})();
