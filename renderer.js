const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const resultsEl = document.getElementById('results');
const playerBar = document.getElementById('player-bar');
const playerFrame = document.getElementById('player-frame');
const nowThumb = document.getElementById('now-thumb');
const nowTitle = document.getElementById('now-title');
const nowAuthor = document.getElementById('now-author');
const tabSearch = document.getElementById('tab-search');
const tabFavorites = document.getElementById('tab-favorites');
const heartTemplate = document.getElementById('heart-icon-template');

const FAVORITES_KEY = 'favorites';
let currentTab = 'search';
let lastSearchResults = [];

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function isFavorite(id) {
  return getFavorites().some((v) => v.id === id);
}

function toggleFavorite(video) {
  const favorites = getFavorites();
  const idx = favorites.findIndex((v) => v.id === video.id);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.unshift(video);
  }
  saveFavorites(favorites);
}

function heartSvg() {
  return heartTemplate.content.firstElementChild.cloneNode(true);
}

function renderResults(videos) {
  resultsEl.innerHTML = '';

  if (!videos.length) {
    const message =
      currentTab === 'favorites'
        ? 'Aún no tienes favoritos. Toca el corazón en una canción para guardarla.'
        : 'No se encontraron resultados.';
    resultsEl.innerHTML = `<p class="empty-state">${message}</p>`;
    return;
  }

  for (const video of videos) {
    const card = document.createElement('div');
    card.className = 'result-card';

    const img = document.createElement('img');
    img.src = video.thumbnail;
    img.alt = video.title;
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'result-info';
    const titleEl = document.createElement('div');
    titleEl.className = 'result-title';
    titleEl.textContent = video.title;
    const metaEl = document.createElement('div');
    metaEl.className = 'result-meta';
    const authorEl = document.createElement('span');
    authorEl.textContent = video.author;
    const durationEl = document.createElement('span');
    durationEl.textContent = video.duration;
    metaEl.append(authorEl, durationEl);
    info.append(titleEl, metaEl);
    card.append(img, info);

    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn' + (isFavorite(video.id) ? ' active' : '');
    favBtn.type = 'button';
    favBtn.title = 'Guardar en favoritos';
    favBtn.appendChild(heartSvg());
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(video);
      favBtn.classList.toggle('active');
      if (currentTab === 'favorites') renderResults(getFavorites());
    });
    card.appendChild(favBtn);

    card.addEventListener('click', () => playVideo(video));
    resultsEl.appendChild(card);
  }
}

function playVideo(video) {
  playerFrame.src = `https://www.youtube.com/embed/${video.id}?autoplay=1`;
  nowThumb.src = video.thumbnail;
  nowTitle.textContent = video.title;
  nowAuthor.textContent = video.author;
  playerBar.hidden = false;
}

async function doSearch(query) {
  resultsEl.innerHTML = '<p class="loading-state">Buscando...</p>';
  try {
    const videos = await window.api.searchMusic(query);
    lastSearchResults = videos;
    renderResults(videos);
  } catch (err) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = `Error al buscar: ${err.message}`;
    resultsEl.replaceChildren(p);
  }
}

function setTab(tab) {
  currentTab = tab;
  tabSearch.classList.toggle('active', tab === 'search');
  tabFavorites.classList.toggle('active', tab === 'favorites');
  form.hidden = tab === 'favorites';
  if (tab === 'favorites') {
    renderResults(getFavorites());
  } else {
    renderResults(lastSearchResults);
  }
}

tabSearch.addEventListener('click', () => setTab('search'));
tabFavorites.addEventListener('click', () => setTab('favorites'));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (query) doSearch(query);
});

doSearch('musica popular 2026');
