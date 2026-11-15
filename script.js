
(() => {
  'use strict';

  // ==========================================
  // MOBILE NAVIGATION
  // ==========================================

  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.nav');

  if (menuToggle && navigation) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('open');

      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  // ==========================================
  // AUTOMATIC COPYRIGHT YEAR
  // ==========================================

  const yearElement = document.querySelector('#year');

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }


  // ==========================================
  // SCROLL REVEAL ANIMATION
  // ==========================================

  const revealSelector = [
    '.section-tag',
    '.intro-grid',
    '.game-feature',
    '.manifesto-content',
    '.contact-grid'
  ].join(', ');

  let revealObserver = null;

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );
  }

  function observeRevealTargets(root) {
    if (!revealObserver || !root) return;

    root.querySelectorAll(revealSelector).forEach((element) => {
      element.classList.add('reveal');
      revealObserver.observe(element);
    });
  }

  observeRevealTargets(document);


  // ==========================================
  // CREATE GAME CARD
  // ==========================================

  function createGameCard(game) {
    const article = document.createElement('article');

    article.className = `game-feature game-${game.id}`;

    // Artwork
    const artwork = document.createElement('div');

    artwork.className = 'game-art';
    artwork.setAttribute('role', 'img');

    artwork.setAttribute(
      'aria-label',
      `${game.subtitle || game.title || 'Game'} artwork`
    );

    if (game.image) {
      artwork.style.backgroundImage = `url("${game.image}")`;
    }

    artwork.style.backgroundPosition =
      game.imagePosition || 'center';

    artwork.style.filter =
      game.imageFilter || 'grayscale(35%)';


    // Overlay
    const overlay = document.createElement('div');

    overlay.className = 'game-overlay';


    // Game information
    const info = document.createElement('div');

    info.className = 'game-info';


    // Game number and status
    const number = document.createElement('span');

    number.className = 'game-number';

    number.textContent =
      `${game.number || ''} — ${game.status || ''}`;


    // Game title
    const title = document.createElement('h3');

    title.appendChild(
      document.createTextNode(game.title || '')
    );

    title.appendChild(
      document.createElement('br')
    );

    const subtitle = document.createElement('em');

    subtitle.textContent = game.subtitle || '';

    title.appendChild(subtitle);


    // Description
    const description = document.createElement('p');

    description.textContent = game.description || '';


    // Steam button
    const button = document.createElement('a');

    button.className = 'button-line';

    button.textContent =
      game.buttonText || 'DISCOVER THE GAME';

    if (game.detailSlug) {
      button.href = `/games/?game=${encodeURIComponent(game.detailSlug)}`;
      button.setAttribute('aria-label', `View details for ${game.subtitle || game.title || 'game'}`);
    } else if (game.steamUrl) {
      button.href = game.steamUrl;
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
    } else {
      button.href = '#';
    }

    const arrow = document.createElement('span');

    arrow.textContent = '↗';

    button.appendChild(arrow);


    // Side label
    const sideLabel = document.createElement('span');

    sideLabel.className = 'game-side';

    sideLabel.textContent = game.sideLabel || '';


    // Assemble card
    info.append(
      number,
      title,
      description,
      button
    );

    article.append(
      artwork,
      overlay,
      info,
      sideLabel
    );

    return article;
  }


  // ==========================================
  // DISPLAY ERROR MESSAGE
  // ==========================================

  function displayError(gameList, message) {
    gameList.replaceChildren();

    const errorMessage = document.createElement('p');

    errorMessage.className = 'games-message';

    errorMessage.textContent =
      `Unable to load games: ${message}`;

    gameList.appendChild(errorMessage);
  }


  // ==========================================
  // LOAD GAMES FROM JSON
  // ==========================================

  async function loadGames() {
    const gameList = document.querySelector('#game-list');

    if (!gameList) return;

    gameList.replaceChildren();

    const loadingMessage = document.createElement('p');

    loadingMessage.className = 'games-message';

    loadingMessage.textContent = 'LOADING GAMES...';

    gameList.appendChild(loadingMessage);


    try {
      // Resolve JSON URL relative to the current website
      const gamesUrl = new URL(
        gameList.dataset.gamesSrc || 'data/games.json',
        document.baseURI
      );

      console.log(
        'Hwaye Studio: Loading games from:',
        gamesUrl.href
      );


      // Fetch JSON
      const response = await fetch(gamesUrl.href, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}. Check that data/games.json exists.`
        );
      }


      // Parse JSON
      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          `Invalid JSON format: ${jsonError.message}`
        );
      }


      // Validate JSON structure
      if (
        !data ||
        !Array.isArray(data.games)
      ) {
        throw new Error(
          'Invalid JSON structure. Expected an object containing a "games" array.'
        );
      }


      // Generate game cards
      const fragment = document.createDocumentFragment();

      const gameLimit = Number.parseInt(gameList.dataset.limit, 10);
      const gamesToRender = Number.isFinite(gameLimit)
        ? data.games.slice(0, gameLimit)
        : data.games;

      gamesToRender.forEach((game) => {
        if (
          !game ||
          typeof game !== 'object' ||
          typeof game.id !== 'string' ||
          !game.id.trim()
        ) {
          console.warn(
            'Hwaye Studio: Skipping invalid game entry:',
            game
          );

          return;
        }

        const gameCard = createGameCard(game);

        fragment.appendChild(gameCard);
      });


      // Check if there are any valid games
      if (fragment.childElementCount === 0) {
        const emptyMessage = document.createElement('p');

        emptyMessage.className = 'games-message';

        emptyMessage.textContent =
          'NEW STORIES ARE IN DEVELOPMENT.';

        fragment.appendChild(emptyMessage);
      }


      // Render games
      gameList.replaceChildren(fragment);


      // Activate scroll animations for generated cards
      observeRevealTargets(gameList);

      console.log(
        `Hwaye Studio: Successfully loaded ${data.games.length} games.`
      );

    } catch (error) {
      console.error(
        'Hwaye Studio: Failed to load games.',
        error
      );

      displayError(
        gameList,
        error.message || 'Unknown error occurred.'
      );
    }
  }


  // ==========================================
  // INITIALIZE WEBSITE
  // ==========================================

  loadGames();

})();
