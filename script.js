/**
 * Gallo d'Oro di Petriano — App Logic (Modern)
 * Modular, GSAP-powered, fully backward-compatible
 */

// ==================== FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyAnNbVMn0MEy1N2MT5aWfSgFpHdpCEc1qU",
  authDomain: "gallo-oro-petriano.firebaseapp.com",
  databaseURL: "https://gallo-oro-petriano-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gallo-oro-petriano",
  storageBucket: "gallo-oro-petriano.firebasestorage.app",
  messagingSenderId: "389838416330",
  appId: "1:389838416330:web:c778ed3bbd04262c5c8733",
  measurementId: "G-YFHY6N3BYS"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==================== IDENTITY ====================
function getClientId() {
  try {
    let id = localStorage.getItem('gallo-oro-client-id');
    if (!id) {
      id = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('gallo-oro-client-id', id);
    }
    return id;
  } catch (e) {
    if (!window.__memClientId) {
      window.__memClientId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }
    return window.__memClientId;
  }
}
const CLIENT_ID = getClientId();

// ==================== YEAR MEMORY ====================
function setLastYear(year) {
  try { localStorage.setItem('gallo-oro-last-year', year); }
  catch (e) { window.__memLastYear = year; }
}
function getLastYear() {
  try { return localStorage.getItem('gallo-oro-last-year'); }
  catch (e) { return window.__memLastYear || null; }
}

// ==================== DEMO DATA ====================
const YEAR_START = 1966;
const YEAR_END = 2026;
const YEARS = [];
for (let y = YEAR_END; y >= YEAR_START; y--) YEARS.push(y);

const PHOTO_COUNTS = {};
YEARS.forEach((y, idx) => { PHOTO_COUNTS[y] = (idx % 5 === 0) ? 4 : 2; });
function photoCountFor(year) { return PHOTO_COUNTS[year] || 2; }

async function getVisibleYears() {
  try {
    const snap = await db.ref('meta/activeYears').once('value');
    const val = snap.val();
    if (val && Object.keys(val).length > 0) {
      return YEARS.filter(y => !!val[y]);
    }
  } catch (e) { console.error('Errore lettura anni attivi', e); }
  return null;
}

// ==================== UTILITIES ====================
function escapeHtml(str) {
  const d = document.createElement('div');
  d.innerText = str || '';
  return d.innerHTML;
}
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function cameraIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
}
function lightsSvg() {
  let bulbs = '';
  for (let i = 0; i < 18; i++) {
    const x = 10 + i * 54;
    const colors = ['#d4a03a', '#e85d4e', '#f0c869'];
    const c = colors[i % colors.length];
    const delay = (i * 0.22).toFixed(2);
    const duration = (2 + (i % 4) * 0.35).toFixed(2);
    bulbs += `<circle class="bulb" cx="${x}" cy="18" r="4.2" fill="${c}" style="animation-delay:${delay}s; animation-duration:${duration}s;"/>`;
  }
  return `<svg viewBox="0 0 980 34" preserveAspectRatio="none"><path d="M0,4 Q245,26 490,4 T980,4" stroke="rgba(212,160,58,0.25)" stroke-width="1.5" fill="none"/>${bulbs}</svg>`;
}

// ==================== NAVIGATION ====================
function renderTopNav(active) {
  const lastYear = getLastYear();
  const fotoHref = lastYear ? `pagina3-foto.html?anno=${lastYear}` : null;
  return `
    <div class="nav-wrap">
      <nav class="topnav">
        <a class="brand" href="index.html"><span class="cresta">🐓</span> Gallo d'Oro <span style="color:var(--text-muted);font-weight:500;font-size:0.8rem;">di Petriano</span></a>
        <div class="nav-divider"></div>
        <div class="navlinks">
          <a href="index.html" class="${active === 'storia' ? 'active' : ''}">Storia</a>
          <a href="pagina2-anni.html" class="${active === 'anni' ? 'active' : ''}">Scegli anno</a>
          ${fotoHref
            ? `<a href="${fotoHref}" class="${active === 'foto' ? 'active' : ''}">Foto ${lastYear ? '(' + lastYear + ')' : ''}</a>`
            : `<span class="nav-disabled">Foto</span>`
          }
        </div>
      </nav>
    </div>
    <div class="lights">${lightsSvg()}</div>
  `;
}
function mountNav(active) {
  const el = document.getElementById('nav-slot');
  if (el) el.innerHTML = renderTopNav(active);
  requestAnimationFrame(() => document.body.classList.add('page-ready'));
}

// ==================== SCROLL REVEAL (GSAP) ====================
function initScrollReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Fallback: mostra tutto
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
    return;
  }
  gsap.utils.toArray('.reveal:not(.revealed)').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        delay: parseFloat(el.style.transitionDelay || '0') / 1000
      }
    );
    el.classList.add('revealed');
  });
}

// ==================== VOTES ====================
const VOTE_COOLDOWN_MS = 4000;
let activeListeners = [];

function detachListeners() {
  activeListeners.forEach(({ ref, cb }) => ref.off('value', cb));
  activeListeners = [];
}

function getLastVoteTime() {
  try { return parseInt(localStorage.getItem('gallo-oro-last-vote-time') || '0', 10); }
  catch (e) { return window.__memLastVoteTime || 0; }
}
function setLastVoteTime(t) {
  try { localStorage.setItem('gallo-oro-last-vote-time', String(t)); }
  catch (e) { window.__memLastVoteTime = t; }
}

function showToast(msg) {
  let toast = document.getElementById('gallo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gallo-toast';
    toast.className = 'gallo-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function addVote(year, photoId, rawName) {
  const name = rawName.trim();
  if (!name) return;
  const now = Date.now();
  const waited = now - getLastVoteTime();
  if (waited < VOTE_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((VOTE_COOLDOWN_MS - waited) / 1000);
    showToast(`Aspetta ${secondsLeft} secondi prima di votare di nuovo`);
    return;
  }
  setLastVoteTime(now);
  db.ref(`votes/${year}/${photoId}/voters/${CLIENT_ID}`)
    .set(name)
    .catch(err => console.error('Errore voto', err));
}

function renderRankFromData(year, photoId, votersObj) {
  const el = document.getElementById(`rank-${year}-${photoId}`);
  const mineEl = document.getElementById(`mine-${year}-${photoId}`);
  const tally = {};
  Object.values(votersObj || {}).forEach(name => {
    if (typeof name !== 'string') return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const k = trimmed.toLowerCase();
    if (!tally[k]) tally[k] = { name: trimmed, count: 0 };
    tally[k].count++;
  });
  const entries = Object.values(tally).sort((a, b) => b.count - a.count);

  if (mineEl) {
    const myVote = votersObj && votersObj[CLIENT_ID];
    mineEl.innerHTML = myVote
      ? `Il tuo voto: <b>${escapeHtml(myVote)}</b> — scrivi un altro nome o tocca la classifica per cambiarlo.`
      : `Non hai ancora votato per questa foto.`;
  }
  if (!el) return;
  if (entries.length === 0) {
    el.innerHTML = `<li class="rank-empty">Nessun voto ancora. Sii il primo a indovinare!</li>`;
    return;
  }
  const badgeClass = (idx) => idx === 0 ? 'oro' : idx === 1 ? 'argento' : idx === 2 ? 'bronzo' : 'altro';
  const badgeLabel = (idx) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1);
  el.innerHTML = entries.map(({ name, count }, idx) => `
    <li class="rank-row" data-name="${escapeAttr(name)}">
      <span class="rank-badge ${badgeClass(idx)}">${badgeLabel(idx)}</span>
      <span class="rank-name">${escapeHtml(name)}</span>
      <span class="rank-count">${count} ${count === 1 ? 'voto' : 'voti'}</span>
    </li>
  `).join('');

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(el, { scale: 1 }, { scale: 1.01, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut' });
  }
}

function attachRankListener(year, photoId) {
  const r = db.ref(`votes/${year}/${photoId}/voters`);
  const cb = (snapshot) => renderRankFromData(year, photoId, snapshot.val() || {});
  r.on('value', cb);
  activeListeners.push({ ref: r, cb });

  const listEl = document.getElementById(`rank-${year}-${photoId}`);
  if (listEl && !listEl.dataset.delegated) {
    listEl.dataset.delegated = 'true';
    listEl.addEventListener('click', (e) => {
      const row = e.target.closest('.rank-row');
      if (!row) return;
      addVote(year, photoId, row.dataset.name);
    });
  }
}

window.__vote = function (ev, year, photoId) {
  ev.preventDefault();
  const input = ev.target.querySelector('input');
  const name = input.value.trim();
  if (!name) return false;
  addVote(year, photoId, name);
  input.value = '';
  return false;
};

function normalizePhotoValue(val) {
  if (typeof val === 'string') return { data: val, voting: true, caption: '', number: '' };
  if (val && typeof val === 'object') return { data: val.data, voting: val.voting !== false, caption: val.caption || '', number: val.number || '' };
  return { data: null, voting: true, caption: '', number: '' };
}

function photoCardHtml(year, photoId, label, mediaHtml, hintCaption, votingEnabled, manualCaption) {
  if (votingEnabled === undefined) votingEnabled = true;
  manualCaption = (manualCaption || '').trim();
  const isRealPhoto = mediaHtml.includes('<img');
  const media = isRealPhoto
    ? `<div class="pc-media" onclick="openLightbox(this)">${mediaHtml}<div class="pc-zoom">🔍</div></div>`
    : `<div class="pc-media"><div class="photo-placeholder">${cameraIcon()}</div></div>`;
  const cartButtonHtml = isRealPhoto
    ? `<button class="cart-btn" onclick="toggleCartItem(${year}, '${photoId}', this)">${isInCart(year, photoId) ? '✅ Nel carrello' : '🛒 Aggiungi al carrello'}</button>`
    : '';
  const staggerDelay = (Number(label) % 8) * 55;

  if (!votingEnabled) {
    const captionBlock = manualCaption
      ? `<p class="manual-caption"><b>Chi si vede:</b> ${escapeHtml(manualCaption)}</p>`
      : `<p class="mine-note">📷 Foto di gruppo — il gioco "chi è" non è attivo qui.</p>`;
    return `
      <div class="photo-card reveal" style="transition-delay:${staggerDelay}ms;">
        <div class="pc-body">
          <div class="pc-id">Scatto ${label} · ${year}</div>
          ${media}
          ${cartButtonHtml}
          ${captionBlock}
        </div>
      </div>
    `;
  }
  return `
    <div class="photo-card reveal" style="transition-delay:${staggerDelay}ms;">
      <div class="pc-body">
        <div class="pc-id">Scatto ${label} · ${year}</div>
        ${media}
        ${cartButtonHtml}
        ${manualCaption ? `<p class="manual-caption"><b>Nota:</b> ${escapeHtml(manualCaption)}</p>` : ''}
        <form class="vote-form" onsubmit="return __vote(event, ${year}, '${photoId}')">
          <input type="text" placeholder="Chi credi che sia?" maxlength="40" required>
          <button type="submit">Vota</button>
        </form>
        <p class="mine-note" id="mine-${year}-${photoId}">Caricamento…</p>
        <ul class="rank-list" id="rank-${year}-${photoId}">
          <li class="rank-empty">Caricamento classifica…</li>
        </ul>
      </div>
    </div>
  `;
}

// ==================== LIGHTBOX ====================
function openLightbox(wrapperEl) {
  const img = wrapperEl.querySelector('img');
  const overlay = document.getElementById('lightbox-overlay');
  const lbImg = document.getElementById('lightbox-img');
  if (!img || !overlay || !lbImg) return;
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  overlay.classList.add('open');
  document.addEventListener('keydown', __closeLightboxOnEsc);
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  if (overlay) overlay.classList.remove('open');
  document.removeEventListener('keydown', __closeLightboxOnEsc);
  document.body.style.overflow = '';
}
function __closeLightboxOnEsc(e) {
  if (e.key === 'Escape') closeLightbox();
}

// ==================== CART ====================
const CART_KEY = 'gallo-oro-cart';
function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return window.__memCart || []; }
}
function setCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); }
  catch (e) { window.__memCart = items; }
  updateCartBadge();
}
function isInCart(year, photoId) {
  return getCart().some(it => String(it.year) === String(year) && it.photoId === photoId);
}
function cartCount() { return getCart().length; }

window.toggleCartItem = function (year, photoId, btn) {
  const cart = getCart();
  const idx = cart.findIndex(it => String(it.year) === String(year) && it.photoId === photoId);
  let added = false;
  if (idx >= 0) {
    cart.splice(idx, 1);
    if (btn) btn.textContent = '🛒 Aggiungi al carrello';
  } else {
    cart.push({ year: Number(year), photoId });
    if (btn) btn.textContent = '✅ Nel carrello';
    added = true;
  }
  setCart(cart);
  if (added) {
    const fab = document.getElementById('cart-fab');
    if (fab) {
      fab.classList.remove('bounce');
      void fab.offsetWidth;
      fab.classList.add('bounce');
    }
  }
};

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = cartCount();
  const fab = document.getElementById('cart-fab');
  if (fab) fab.classList.toggle('has-items', cartCount() > 0);
}

function mountCartWidget() {
  if (document.getElementById('cart-fab')) return;
  const fab = document.createElement('button');
  fab.id = 'cart-fab';
  fab.className = 'cart-fab';
  fab.setAttribute('aria-label', 'Apri il carrello foto richieste');
  fab.onclick = window.openCartModal;
  fab.innerHTML = `🛒 <span id="cart-count">${cartCount()}</span>`;
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.id = 'cart-overlay';
  overlay.className = 'cart-overlay';
  overlay.onclick = () => window.closeCartModal();
  overlay.innerHTML = `
    <div class="cart-panel" onclick="event.stopPropagation()">
      <div class="cart-header">
        <h3>Le foto che vuoi ricevere</h3>
        <button class="cart-close" onclick="closeCartModal()" aria-label="Chiudi">✕</button>
      </div>
      <div class="cart-items" id="cart-items">Il carrello è vuoto.</div>
      <div class="cart-form" id="cart-form-wrap" style="display:none;">
        <div class="cart-field">
          <label for="cart-name">Il tuo nome</label>
          <input type="text" id="cart-name" maxlength="60" placeholder="Nome e cognome">
        </div>
        <div class="cart-field">
          <label for="cart-email">La tua email</label>
          <input type="email" id="cart-email" maxlength="100" placeholder="nome@esempio.it" required>
        </div>
        <div class="cart-field">
          <label for="cart-note">Nota (facoltativa)</label>
          <textarea id="cart-note" maxlength="300" placeholder="Es. quali foto in particolare, o altre informazioni"></textarea>
        </div>
        <button class="btn btn-primary" onclick="submitCartRequest()">Invia richiesta</button>
        <p class="cart-status" id="cart-status"></p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  updateCartBadge();
}

window.openCartModal = async function () {
  const overlay = document.getElementById('cart-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  await renderCartItems();
};
window.closeCartModal = function () {
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
};

async function renderCartItems() {
  const container = document.getElementById('cart-items');
  const formWrap = document.getElementById('cart-form-wrap');
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `<p class="rank-empty">Il carrello è vuoto. Vai su una foto e tocca "Aggiungi al carrello".</p>`;
    formWrap.style.display = 'none';
    return;
  }
  formWrap.style.display = 'block';
  container.innerHTML = cart.map((it, i) => `
    <div class="cart-item" id="cart-item-${i}">
      <div class="skeleton" style="width:56px;height:56px;flex-shrink:0;"></div>
      <span style="flex:1;"><span class="skeleton" style="width:80%;height:14px;display:block;"></span></span>
    </div>
  `).join('');

  for (let i = 0; i < cart.length; i++) {
    const it = cart[i];
    const el = document.getElementById(`cart-item-${i}`);
    try {
      const snap = await db.ref(`photos/${it.year}/${it.photoId}`).once('value');
      const { data } = normalizePhotoValue(snap.val());
      if (el && data) {
        el.innerHTML = `
          <img src="${data}" alt="Foto ${it.year}">
          <span>Anno ${it.year}</span>
          <button class="cart-remove" onclick="removeCartItem(${i})" aria-label="Rimuovi">✕</button>
        `;
      } else if (el) {
        el.innerHTML = `<span>Foto non più disponibile</span><button class="cart-remove" onclick="removeCartItem(${i})">✕</button>`;
      }
    } catch (e) {
      if (el) el.innerHTML = `<span>Errore caricamento</span><button class="cart-remove" onclick="removeCartItem(${i})">✕</button>`;
    }
  }
}

window.removeCartItem = function (index) {
  const cart = getCart();
  cart.splice(index, 1);
  setCart(cart);
  renderCartItems();
};

window.submitCartRequest = async function () {
  const name = document.getElementById('cart-name').value.trim();
  const email = document.getElementById('cart-email').value.trim();
  const note = document.getElementById('cart-note').value.trim();
  const statusEl = document.getElementById('cart-status');
  const cart = getCart();
  if (cart.length === 0) { statusEl.textContent = 'Il carrello è vuoto.'; return; }
  if (!email) { statusEl.textContent = 'Inserisci la tua email.'; return; }
  statusEl.textContent = 'Invio in corso…';
  try {
    const newRef = db.ref('requests').push();
    await newRef.set({
      name: name || '(non indicato)',
      email,
      note,
      items: cart,
      timestamp: Date.now(),
      status: 'pending'
    });
    setCart([]);
    statusEl.textContent = '✅ Richiesta inviata! Ti risponderemo via email appena possibile.';
    document.getElementById('cart-items').innerHTML = '';
    document.getElementById('cart-name').value = '';
    document.getElementById('cart-email').value = '';
    document.getElementById('cart-note').value = '';
    setTimeout(() => window.closeCartModal(), 2400);
  } catch (e) {
    console.error('Errore invio richiesta', e);
    statusEl.textContent = 'Errore durante l\'invio, riprova.';
  }
};

// ==================== LEGAL NOTICE ====================
const LEGAL_NOTICE_KEY = 'gallo-oro-legal-dismissed';
function isLegalNoticeDismissed() {
  try { return localStorage.getItem(LEGAL_NOTICE_KEY) === '1'; }
  catch (e) { return window.__memLegalDismissed || false; }
}
function dismissLegalNotice() {
  try { localStorage.setItem(LEGAL_NOTICE_KEY, '1'); }
  catch (e) { window.__memLegalDismissed = true; }
  const el = document.getElementById('legal-notice');
  if (el) {
    if (typeof gsap !== 'undefined') {
      gsap.to(el, { height: 0, opacity: 0, padding: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => el.remove() });
    } else {
      el.remove();
    }
  }
}
window.dismissLegalNotice = dismissLegalNotice;

function mountLegalNotice() {
  if (isLegalNoticeDismissed()) return;
  if (document.getElementById('legal-notice')) return;
  const banner = document.createElement('div');
  banner.id = 'legal-notice';
  banner.className = 'legal-notice';
  banner.innerHTML = `
    <span>⚠️ Le foto pubblicate su questo sito sono di proprietà del Festival Gallo d'Oro di Petriano e vengono condivise a solo scopo di ricordo e community. <b>Non possono essere utilizzate a scopo di lucro</b> né riprodotte senza autorizzazione.</span>
    <button onclick="dismissLegalNotice()" aria-label="Chiudi avviso">✕</button>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
}

// ==================== 3D TILT FOR YEAR CARDS ====================
function initYearCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch
  document.querySelectorAll('.year-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      card.style.transform = `perspective(800px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
