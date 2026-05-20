// ─── Config ────────────────────────────────────────────────────────
const STORIES_URL = './data/stories.json';

const CATEGORY_LABELS = {
  romance_scam:             'Romance scam',
  investment_fraud:         'Investment fraud',
  crypto_scam:              'Crypto scam',
  phishing:                 'Phishing',
  tech_support_scam:        'Tech support',
  government_impersonation: 'Gov. impersonation',
  identity_theft:           'Identity theft',
  online_shopping_fraud:    'Online shopping',
  lottery_scam:             'Lottery scam',
  other:                    'Other',
};

const PLATFORM_LABELS = {
  youtube: 'YouTube',
  reddit:  'Reddit',
  news:    'News',
  ftc:     'FTC',
  podcast: 'Podcast',
};

// ─── State ─────────────────────────────────────────────────────────
let allStories = [];
let activeFilter = 'all';
let activeSort = 'newest';

// ─── Fetch ─────────────────────────────────────────────────────────
async function loadStories() {
  try {
    const res = await fetch(STORIES_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('Network response not ok');
    allStories = await res.json();
    // Fix duplicate IDs by using YouTube video ID from URL
    allStories = allStories.map((story, index) => {
      const videoId = extractYouTubeId(story.source_url);
      return {
        ...story,
        id: videoId ? `yt-${videoId}` : `story-${index}`
      };
    });
    renderStats();
    renderGrid();
  } catch (err) {
    console.error('Failed to load stories:', err);
    document.getElementById('loading-state').innerHTML =
      '<p style="color:var(--text-dim);font-size:0.9rem">Could not load stories. Check that data/stories.json exists.</p>';
  }
}

// ─── Stats ─────────────────────────────────────────────────────────
function renderStats() {
  document.getElementById('stat-total').textContent = allStories.length.toLocaleString();
  const types = new Set(allStories.map(s => s.fraud_category)).size;
  document.getElementById('stat-types').textContent = types;
  const latest = allStories.map(s => s.date_found).sort().reverse()[0];
  document.getElementById('stat-date').textContent = latest
    ? new Date(latest).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}

// ─── Filter + Sort ─────────────────────────────────────────────────
function getVisible() {
  let list = activeFilter === 'all'
    ? [...allStories]
    : allStories.filter(s => s.fraud_category === activeFilter);

  if (activeSort === 'newest') {
    list.sort((a, b) => b.date_found.localeCompare(a.date_found));
  } else if (activeSort === 'oldest') {
    list.sort((a, b) => a.date_found.localeCompare(b.date_found));
  } else if (activeSort === 'platform') {
    list.sort((a, b) => (a.source_platform || '').localeCompare(b.source_platform || ''));
  }

  return list;
}

// ─── Render grid ───────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('stories-grid');
  const empty = document.getElementById('empty-state');
  const loading = document.getElementById('loading-state');

  if (loading) loading.remove();

  const visible = getVisible();

  if (visible.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = visible.map(story => cardHTML(story)).join('');

  grid.querySelectorAll('.story-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

// ─── Card HTML ─────────────────────────────────────────────────────
function cardHTML(story) {
  const catLabel = CATEGORY_LABELS[story.fraud_category] || 'Other';
  const platform = PLATFORM_LABELS[story.source_platform] || story.source_platform || '';
  const dateStr = story.date_found
    ? new Date(story.date_found).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const mediaHTML = story.thumbnail_url
    ? `<img src="${escHtml(story.thumbnail_url)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'card-media-placeholder\'><span class=\'placeholder-icon\'>${mediaIcon(story.media_type)}</span></div>'">`
    : `<div class="card-media-placeholder"><span class="placeholder-icon">${mediaIcon(story.media_type)}</span></div>`;

  return `
    <article class="story-card" data-id="${escHtml(story.id)}" tabindex="0" role="button" aria-label="${escHtml(story.title)}">
      <div class="card-media">
        ${mediaHTML}
        <span class="media-type-badge ${escHtml(story.media_type)}">${escHtml(story.media_type)}</span>
      </div>
      <div class="card-body">
        <div class="card-category">
          <span class="category-dot dot-${escHtml(story.fraud_category)}"></span>
          <span class="category-label cat-${escHtml(story.fraud_category)}">${escHtml(catLabel)}</span>
        </div>
        <h2 class="card-title">${escHtml(story.title)}</h2>
        ${story.summary ? `<p class="card-summary">${escHtml(story.summary)}</p>` : ''}
        <div class="card-footer">
          <span class="card-platform">${escHtml(platform)}</span>
          <span class="card-date">${escHtml(dateStr)}</span>
        </div>
      </div>
    </article>`;
}

function mediaIcon(type) {
  if (type === 'video') return '▶';
  if (type === 'audio') return '♪';
  return '◈';
}

// ─── Modal ─────────────────────────────────────────────────────────
function openModal(id) {
  const story = allStories.find(s => s.id === id);
  if (!story) return;

  const catLabel = CATEGORY_LABELS[story.fraud_category] || 'Other';
  const platform = PLATFORM_LABELS[story.source_platform] || story.source_platform || '';
  const dateStr = story.date_found
    ? new Date(story.date_found).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  let embedHTML = '';
  if (story.media_type === 'video' && story.source_platform === 'youtube') {
    const videoId = extractYouTubeId(story.source_url);
    if (videoId) {
      // enablejsapi=1 allows us to stop playback via postMessage on close
      embedHTML = `<div class="modal-embed">
        <iframe id="yt-player" src="https://www.youtube.com/embed/${videoId}?enablejsapi=1" allowfullscreen loading="lazy" title="${escHtml(story.title)}"></iframe>
      </div>`;
    }
  } else if (story.media_type === 'audio' && story.source_url) {
    embedHTML = `<div class="modal-embed"><audio id="audio-player" controls src="${escHtml(story.source_url)}"></audio></div>`;
  }

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-category">
      <span class="category-dot dot-${escHtml(story.fraud_category)}" style="display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
      <span class="category-label cat-${escHtml(story.fraud_category)}" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.07em;font-weight:500;">${escHtml(catLabel)}</span>
    </div>
    <h2 class="modal-title">${escHtml(story.title)}</h2>
    ${story.summary ? `<p class="modal-summary">${escHtml(story.summary)}</p>` : ''}
    ${embedHTML}
    <div class="modal-meta">
      <span>Platform <strong>${escHtml(platform)}</strong></span>
      <span>Type <strong>${escHtml(story.media_type)}</strong></span>
      <span>Found <strong>${escHtml(dateStr)}</strong></span>
    </div>
    <a href="${escHtml(story.source_url)}" target="_blank" rel="noopener" class="modal-link">
      View original source ↗
    </a>`;

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  // Stop YouTube video by replacing iframe src with itself (removes the player)
  const iframe = document.getElementById('yt-player');
  if (iframe) {
    iframe.src = iframe.src; // reloads iframe, stops playback instantly
  }

  // Stop audio if playing
  const audio = document.getElementById('audio-player');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = '';
  document.body.style.overflow = '';
}

// ─── Helpers ───────────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Event listeners ───────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderGrid();
  });
});

document.getElementById('sort-select').addEventListener('change', e => {
  activeSort = e.target.value;
  renderGrid();
});

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('stories-grid').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const card = e.target.closest('.story-card');
    if (card) { e.preventDefault(); openModal(card.dataset.id); }
  }
});

// ─── Init ──────────────────────────────────────────────────────────
loadStories();
