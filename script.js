// =========================================================================
// Gallo d'Oro di Petriano — logica condivisa tra le 3 pagine del sito.
// Include questo file con <script src="script.js"></script> in ogni pagina,
// PRIMA dello script specifico di quella pagina.
// =========================================================================

// ---------------- FIREBASE ----------------
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

// ---------------- IDENTITA' DEL VISITATORE ----------------
// Serve solo per limitare "una persona, un voto per foto" — non è un login,
// solo un id casuale salvato nel browser di chi visita il sito.
function getClientId(){
  try{
    let id = localStorage.getItem('gallo-oro-client-id');
    if(!id){
      id = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
      localStorage.setItem('gallo-oro-client-id', id);
    }
    return id;
  }catch(e){
    if(!window.__memClientId){
      window.__memClientId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
    }
    return window.__memClientId;
  }
}
const CLIENT_ID = getClientId();

// ---------------- MEMORIA DELL'ULTIMO ANNO VISTO ----------------
// Serve solo per far funzionare il link "Foto" nel menu quando si è su
// un'altra pagina: ricorda l'ultimo anno aperto in pagina3-foto.html.
function setLastYear(year){
  try{ localStorage.setItem('gallo-oro-last-year', year); }
  catch(e){ window.__memLastYear = year; }
}
function getLastYear(){
  try{ return localStorage.getItem('gallo-oro-last-year'); }
  catch(e){ return window.__memLastYear || null; }
}

// ---------------- DATI DEMO (da sostituire con i contenuti reali) ----------------
// Genera quasi tutte le edizioni dal 1966 (nascita del Festival) al 2026.
// Rimuovi pure gli anni senza foto quando avrai l'archivio reale.
const YEAR_START = 1966;
const YEAR_END = 2026;
const YEARS = [];
for(let y = YEAR_END; y >= YEAR_START; y--) YEARS.push(y);

// Numero di foto segnaposto per ciascun anno (demo), usato SOLO per gli anni
// che non hanno ancora foto reali caricate dalla pagina admin.
const PHOTO_COUNTS = {};
YEARS.forEach((y, idx) => {
  PHOTO_COUNTS[y] = (idx % 5 === 0) ? 4 : 2;
});
function photoCountFor(year){ return PHOTO_COUNTS[year] || 2; }

// ---------------- ANNI ATTIVI (impostati a mano dalla pagina admin) ----------------
// Ritorna un array di anni (numeri) da mostrare nella pagina 2, oppure null
// se l'admin non ha ancora impostato nulla — in quel caso il chiamante può
// decidere di mostrare tutti gli YEARS come demo di fallback.
async function getVisibleYears(){
  try{
    const snap = await db.ref('meta/activeYears').once('value');
    const val = snap.val();
    if(val && Object.keys(val).length > 0){
      return YEARS.filter(y => !!val[y]);
    }
  }catch(e){
    console.error('Errore lettura anni attivi', e);
  }
  return null;
}

// ---------------- HELPER GENERICI ----------------
function escapeHtml(str){
  const d = document.createElement('div');
  d.innerText = str;
  return d.innerHTML;
}

function cameraIcon(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
}

function lightsSvg(){
  const item = `<span class="ticker-item">🐓 GALLO D'ORO DI PETRIANO</span><span class="ticker-sep">✦</span>`;
  const set = item.repeat(8);
  // Il contenuto è duplicato due volte: con translateX(-50%) il loop risulta perfettamente continuo
  return `<div class="ticker-track">${set}${set}</div>`;
}

// ---------------- BARRA DI NAVIGAZIONE (uguale su tutte le pagine) ----------------
// `active` è una di: 'storia' | 'anni' | 'foto'
function renderTopNav(active){
  const lastYear = getLastYear();
  const fotoHref = lastYear ? `pagina3-foto.html?anno=${lastYear}` : null;
  return `
    <div class="topnav">
      <a class="brand" href="index.html"><span class="cresta">🐓</span> Gallo d'Oro <span style="color:var(--cream-dim); font-weight:600; font-size:0.85rem;">di Petriano</span></a>
      <div class="navlinks">
        <a href="index.html" class="${active==='storia'?'active':''}">Storia</a>
        <a href="pagina2-anni.html" class="${active==='anni'?'active':''}">Scegli anno</a>
        ${fotoHref
          ? `<a href="${fotoHref}" class="${active==='foto'?'active':''}">Foto ${lastYear ? '('+lastYear+')' : ''}</a>`
          : `<span class="nav-disabled">Foto</span>`
        }
      </div>
    </div>
    <div class="lights">${lightsSvg()}</div>
  `;
}

// Inserisce la nav + luci nel contenitore #nav-slot presente in ogni pagina
function mountNav(active){
  const el = document.getElementById('nav-slot');
  if(el) el.innerHTML = renderTopNav(active);
  // Comparsa morbida della pagina, invece di un flash secco al caricamento
  requestAnimationFrame(() => document.body.classList.add('page-ready'));
}

// ---------------- COMPARSA GRADUALE DEGLI ELEMENTI (scroll reveal) ----------------
// Applica la classe "reveal" a un elemento per farlo comparire con una
// leggera dissolvenza + salita quando entra nello schermo. Richiamare
// initScrollReveal() dopo aver inserito nuovi elementi ".reveal" nel DOM.
function initScrollReveal(){
  const els = document.querySelectorAll('.reveal:not(.revealed)');
  if(els.length === 0) return;
  if(!('IntersectionObserver' in window)){
    els.forEach(el => el.classList.add('revealed'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// =========================================================================
// VOTI (Firebase Realtime Database) — usato dalla pagina 3 (foto)
// Struttura: votes/{anno}/{photoId}/voters/{clientId} = "Nome scritto"
// Un solo nodo per visitatore per foto -> un solo voto a testa, sovrascrivibile.
// =========================================================================
let activeListeners = []; // { ref, cb } — ascolti attivi

function detachListeners(){
  activeListeners.forEach(({ref, cb}) => ref.off('value', cb));
  activeListeners = [];
}

// Escapa un valore per l'uso sicuro dentro un attributo HTML tra doppi apici
function escapeAttr(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function attachRankListener(year, photoId){
  const r = db.ref(`votes/${year}/${photoId}/voters`);
  const cb = (snapshot) => renderRankFromData(year, photoId, snapshot.val() || {});
  r.on('value', cb);
  activeListeners.push({ref:r, cb});

  // Delega il click sulle righe della classifica una sola volta per lista,
  // leggendo il nome da un data-attribute invece che da un onclick inline
  // (più sicuro con apostrofi/virgolette nei nomi, e più affidabile in generale).
  const listEl = document.getElementById(`rank-${year}-${photoId}`);
  if(listEl && !listEl.dataset.delegated){
    listEl.dataset.delegated = 'true';
    listEl.addEventListener('click', (e) => {
      const row = e.target.closest('.rank-row');
      if(!row) return;
      addVote(year, photoId, row.dataset.name);
    });
  }
}

// ---------------- ANTI-SPAM: tempo minimo tra un voto e l'altro ----------------
const VOTE_COOLDOWN_MS = 4000; // 4 secondi

function getLastVoteTime(){
  try{ return parseInt(localStorage.getItem('gallo-oro-last-vote-time') || '0', 10); }
  catch(e){ return window.__memLastVoteTime || 0; }
}
function setLastVoteTime(t){
  try{ localStorage.setItem('gallo-oro-last-vote-time', String(t)); }
  catch(e){ window.__memLastVoteTime = t; }
}

// Piccolo avviso temporaneo in basso, usato per i messaggi anti-spam
function showToast(msg){
  let toast = document.getElementById('gallo-toast');
  if(!toast){
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

function addVote(year, photoId, rawName){
  const name = rawName.trim();
  if(!name) return;

  const now = Date.now();
  const waited = now - getLastVoteTime();
  if(waited < VOTE_COOLDOWN_MS){
    const secondsLeft = Math.ceil((VOTE_COOLDOWN_MS - waited) / 1000);
    showToast(`Aspetta ${secondsLeft} secondi prima di votare di nuovo`);
    return;
  }
  setLastVoteTime(now);

  db.ref(`votes/${year}/${photoId}/voters/${CLIENT_ID}`)
    .set(name)
    .catch(err => console.error('Errore voto', err));
}

function renderRankFromData(year, photoId, votersObj){
  const el = document.getElementById(`rank-${year}-${photoId}`);
  const mineEl = document.getElementById(`mine-${year}-${photoId}`);

  // Conta i voti per nome (case-insensitive), a partire dai voti dei singoli visitatori
  const tally = {}; // chiave lowercase -> { name, count }
  Object.values(votersObj || {}).forEach(name => {
    if(typeof name !== 'string') return;
    const trimmed = name.trim();
    if(!trimmed) return;
    const k = trimmed.toLowerCase();
    if(!tally[k]) tally[k] = { name: trimmed, count: 0 };
    tally[k].count++;
  });
  const entries = Object.values(tally).sort((a,b) => b.count - a.count);

  if(mineEl){
    const myVote = votersObj && votersObj[CLIENT_ID];
    mineEl.innerHTML = myVote
      ? `Il tuo voto: <b>${escapeHtml(myVote)}</b> — scrivi un altro nome o tocca la classifica per cambiarlo.`
      : `Non hai ancora votato per questa foto.`;
  }

  if(!el) return;
  if(entries.length === 0){
    el.innerHTML = `<li class="rank-empty">Nessun voto ancora. Sii il primo a indovinare!</li>`;
    return;
  }
  const badgeClass = (idx)=> idx===0?'oro':idx===1?'argento':idx===2?'bronzo':'altro';
  const badgeLabel = (idx)=> idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':(idx+1);
  el.innerHTML = entries.map(({name,count},idx)=>`
    <li class="rank-row" data-name="${escapeAttr(name)}">
      <span class="rank-badge ${badgeClass(idx)}">${badgeLabel(idx)}</span>
      <span class="rank-name">${escapeHtml(name)}</span>
      <span class="rank-count">${count} ${count===1?'voto':'voti'}</span>
    </li>
  `).join('');

  // Piccolo "pop" visivo per far notare che la classifica è appena cambiata
  el.classList.remove('pop');
  void el.offsetWidth; // forza il riavvio dell'animazione CSS
  el.classList.add('pop');
}

// Handler globali usati dagli attributi onsubmit/onclick generati nell'HTML
window.__vote = function(ev, year, photoId){
  ev.preventDefault();
  const input = ev.target.querySelector('input');
  const name = input.value.trim();
  if(!name) return false;
  addVote(year, photoId, name);
  input.value = '';
  return false;
};

// Genera la scheda HTML di una foto (usata dalla pagina 3)
// Legge il valore salvato per una foto, che può essere:
// - una stringa (formato vecchio: solo l'immagine, voto sempre attivo)
// - un oggetto { data, voting, caption } (formato nuovo)
function normalizePhotoValue(val){
  if(typeof val === 'string') return { data: val, voting: true, caption: '', number: '' };
  if(val && typeof val === 'object') return { data: val.data, voting: val.voting !== false, caption: val.caption || '', number: val.number || '' };
  return { data: null, voting: true, caption: '', number: '' };
}

function photoCardHtml(year, photoId, label, mediaHtml, hintCaption, votingEnabled, manualCaption){
  if(votingEnabled === undefined) votingEnabled = true; // retrocompatibilità
  manualCaption = (manualCaption || '').trim();
  const isRealPhoto = mediaHtml.includes('<img');

  // Se la scheda contiene una foto vera (non un segnaposto), la rendo
  // cliccabile per aprirla ingrandita nel lightbox.
  const media = isRealPhoto
    ? `<div class="polaroid-img-wrap" onclick="openLightbox(this)">${mediaHtml}</div>`
    : mediaHtml;

  // Pulsante carrello — solo sulle foto vere, non sui segnaposto demo
  const cartButtonHtml = isRealPhoto
    ? `<button class="cart-btn" onclick="toggleCartItem(${year}, '${photoId}', this)">${isInCart(year, photoId) ? '✅ Nel carrello' : '🛒 Aggiungi al carrello'}</button>`
    : '';

  const staggerDelay = (Number(label) % 8) * 55;

  if(!votingEnabled){
    const captionBlock = manualCaption
      ? `<p class="manual-caption"><b>Chi si vede:</b> ${escapeHtml(manualCaption)}</p>`
      : `<p class="mine-note">Didascalia non disponibile.</p>`;
    return `
      <div class="photo-card reveal" style="transition-delay:${staggerDelay}ms;">
        <div class="photo-id">Scatto ${label} · ${year}</div>
        <div class="polaroid">
          ${media}
          ${hintCaption ? `<div class="polaroid-cap">${hintCaption}</div>` : ''}
        </div>
        ${cartButtonHtml}
        ${captionBlock}
      </div>
    `;
  }

  return `
    <div class="photo-card reveal" style="transition-delay:${staggerDelay}ms;">
      <div class="photo-id">Scatto ${label} · ${year}</div>
      <div class="polaroid">
        ${media}
        ${hintCaption ? `<div class="polaroid-cap">${hintCaption}</div>` : ''}
      </div>
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
  `;
}

// ---------------- LIGHTBOX (ingrandimento foto) ----------------
// Richiede nella pagina un overlay con id="lightbox-overlay" e
// un'immagine con id="lightbox-img" (presenti in pagina3-foto.html).
function openLightbox(wrapperEl){
  const img = wrapperEl.querySelector('img');
  const overlay = document.getElementById('lightbox-overlay');
  const lbImg = document.getElementById('lightbox-img');
  if(!img || !overlay || !lbImg) return;
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  overlay.classList.add('open');
  document.addEventListener('keydown', __closeLightboxOnEsc);
}

function closeLightbox(){
  const overlay = document.getElementById('lightbox-overlay');
  if(overlay) overlay.classList.remove('open');
  document.removeEventListener('keydown', __closeLightboxOnEsc);
}

function __closeLightboxOnEsc(e){
  if(e.key === 'Escape') closeLightbox();
}

// =========================================================================
// CARRELLO RICHIESTE FOTO — la persona sceglie più foto da più anni,
// poi invia un'unica richiesta con nome/email/nota. Salvata in
// requests/{id} = { name, email, note, items:[{year,photoId},...], timestamp }
// =========================================================================
const CART_KEY = 'gallo-oro-cart';

function getCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return window.__memCart || [];
  }
}

function setCart(items){
  try{ localStorage.setItem(CART_KEY, JSON.stringify(items)); }
  catch(e){ window.__memCart = items; }
  updateCartBadge();
}

function isInCart(year, photoId){
  return getCart().some(it => String(it.year) === String(year) && it.photoId === photoId);
}

function cartCount(){ return getCart().length; }

window.toggleCartItem = function(year, photoId, btn){
  const cart = getCart();
  const idx = cart.findIndex(it => String(it.year) === String(year) && it.photoId === photoId);
  let added = false;
  if(idx >= 0){
    cart.splice(idx, 1);
    if(btn) btn.textContent = '🛒 Aggiungi al carrello';
  } else {
    cart.push({ year: Number(year), photoId });
    if(btn) btn.textContent = '✅ Nel carrello';
    added = true;
  }
  setCart(cart);
  if(added){
    const fab = document.getElementById('cart-fab');
    if(fab){
      fab.classList.remove('bounce');
      void fab.offsetWidth; // forza il riavvio dell'animazione CSS
      fab.classList.add('bounce');
    }
  }
};

function updateCartBadge(){
  const badge = document.getElementById('cart-count');
  if(badge) badge.textContent = cartCount();
  const fab = document.getElementById('cart-fab');
  if(fab) fab.classList.toggle('has-items', cartCount() > 0);
}

// Monta il pulsante flottante del carrello + la finestra modale.
// Da chiamare una volta in ogni pagina (dopo mountNav).
// ---------------- AVVISO USO FOTO (banner) ----------------
// Mostra un avviso in cima al sito che ricorda che le foto non possono
// essere usate a scopo di lucro. Si può chiudere con la "X"; una volta
// chiuso non ricompare più su quel dispositivo (salvato in localStorage).
const LEGAL_NOTICE_KEY = 'gallo-oro-legal-dismissed';

function isLegalNoticeDismissed(){
  try{ return localStorage.getItem(LEGAL_NOTICE_KEY) === '1'; }
  catch(e){ return window.__memLegalDismissed || false; }
}
function dismissLegalNotice(){
  try{ localStorage.setItem(LEGAL_NOTICE_KEY, '1'); }
  catch(e){ window.__memLegalDismissed = true; }
  const el = document.getElementById('legal-notice');
  if(el) el.remove();
}
window.dismissLegalNotice = dismissLegalNotice;

function mountLegalNotice(){
  if(isLegalNoticeDismissed()) return;
  if(document.getElementById('legal-notice')) return;
  const banner = document.createElement('div');
  banner.id = 'legal-notice';
  banner.className = 'legal-notice';
  banner.innerHTML = `
    <span>⚠️ Le foto pubblicate su questo sito sono di proprietà del Festival Gallo d'Oro di Petriano e vengono condivise a solo scopo di ricordo e community. <b>Non possono essere utilizzate a scopo di lucro</b> né riprodotte senza autorizzazione.</span>
    <button onclick="dismissLegalNotice()" aria-label="Chiudi avviso">✕</button>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
}

// ---------------- POPUP AVVISO SULLA PAGINA FOTO ----------------
// A differenza del banner in cima (che una volta chiuso non ricompare più),
// questo popup appare ad OGNI visita della pagina foto — richiamare solo da
// pagina3-foto.html.
function showPhotoWarningPopup(){
  if(document.getElementById('photo-warning-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'photo-warning-overlay';
  overlay.className = 'photo-warning-overlay';
  overlay.onclick = () => closePhotoWarningPopup();
  overlay.innerHTML = `
    <div class="photo-warning-card" onclick="event.stopPropagation()">
      <span class="icon">⚠️</span>
      <h3>Un promemoria prima di continuare</h3>
      <p>Le foto di questa pagina sono di proprietà del Festival Gallo d'Oro di Petriano e vengono condivise a solo scopo di ricordo e community. <b>Non possono essere utilizzate a scopo di lucro</b> né riprodotte senza autorizzazione.</p>
      <button class="btn btn-primary" onclick="closePhotoWarningPopup()">Ho capito</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', __closePhotoWarningOnEsc);
}
window.closePhotoWarningPopup = function(){
  const overlay = document.getElementById('photo-warning-overlay');
  if(!overlay) return;
  overlay.classList.remove('open');
  document.removeEventListener('keydown', __closePhotoWarningOnEsc);
  setTimeout(() => overlay.remove(), 200);
};
function __closePhotoWarningOnEsc(e){
  if(e.key === 'Escape') window.closePhotoWarningPopup();
}

// ---------------- PULSANTE "TORNA SU" ----------------
function mountBackToTop(){
  if(document.getElementById('back-to-top')) return;
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Torna in cima alla pagina');
  btn.innerHTML = '↑';
  btn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if(window.scrollY > 500) btn.classList.add('show');
    else btn.classList.remove('show');
  }, { passive:true });
}

function mountCartWidget(){
  if(document.getElementById('cart-fab')) return;

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

window.openCartModal = async function(){
  const overlay = document.getElementById('cart-overlay');
  if(!overlay) return;
  overlay.classList.add('open');
  await renderCartItems();
};

window.closeCartModal = function(){
  const overlay = document.getElementById('cart-overlay');
  if(overlay) overlay.classList.remove('open');
};

async function renderCartItems(){
  const container = document.getElementById('cart-items');
  const formWrap = document.getElementById('cart-form-wrap');
  const cart = getCart();

  if(cart.length === 0){
    container.innerHTML = `<p class="rank-empty">Il carrello è vuoto. Vai su una foto e tocca "Aggiungi al carrello".</p>`;
    formWrap.style.display = 'none';
    return;
  }

  formWrap.style.display = 'block';
  container.innerHTML = cart.map((it,i) => `<div class="cart-item" id="cart-item-${i}">Caricamento…</div>`).join('');

  for(let i=0;i<cart.length;i++){
    const it = cart[i];
    const el = document.getElementById(`cart-item-${i}`);
    try{
      const snap = await db.ref(`photos/${it.year}/${it.photoId}`).once('value');
      const { data, number } = normalizePhotoValue(snap.val());
      cart[i].number = number || ''; // riuso questo dato quando preparo l'email
      if(el && data){
        el.innerHTML = `
          <img src="${data}" alt="Foto ${it.year}">
          <span>Anno ${it.year}${number ? ' · foto #' + escapeHtml(number) : ''}</span>
          <button class="cart-remove" onclick="removeCartItem(${i})" aria-label="Rimuovi">✕</button>
        `;
      } else if(el){
        el.innerHTML = `<span>Foto non più disponibile</span><button class="cart-remove" onclick="removeCartItem(${i})">✕</button>`;
      }
    }catch(e){
      if(el) el.innerHTML = `<span>Errore caricamento</span><button class="cart-remove" onclick="removeCartItem(${i})">✕</button>`;
    }
  }
  lastRenderedCartDetails = cart;
}

window.removeCartItem = function(index){
  const cart = getCart();
  cart.splice(index, 1);
  setCart(cart);
  renderCartItems();
};

// Email a cui arrivano le richieste (usata anche per il mailto automatico)
const REQUEST_DESTINATION_EMAIL = 'fotogallodoro@gmail.com';
let lastRenderedCartDetails = [];

window.submitCartRequest = async function(){
  const name = document.getElementById('cart-name').value.trim();
  const email = document.getElementById('cart-email').value.trim();
  const note = document.getElementById('cart-note').value.trim();
  const statusEl = document.getElementById('cart-status');
  const cart = getCart();

  if(cart.length === 0){ statusEl.textContent = 'Il carrello è vuoto.'; return; }
  if(!email){ statusEl.textContent = 'Inserisci la tua email.'; return; }

  statusEl.textContent = 'Invio in corso…';
  try{
    const newRef = db.ref('requests').push();
    await newRef.set({
      name: name || '(non indicato)',
      email,
      note,
      items: cart,
      timestamp: Date.now(),
      status: 'pending'
    });

    // Apro anche il client email del visitatore, con un messaggio già pronto
    // verso l'admin — in aggiunta al salvataggio (che resta comunque visibile
    // nel pannello "Richieste" anche se l'email non dovesse partire).
    try{
      const detailsSource = (lastRenderedCartDetails.length === cart.length) ? lastRenderedCartDetails : cart;
      const elenco = detailsSource.map(it => `- Anno ${it.year}${it.number ? ' · foto #' + it.number : ' (id: ' + it.photoId + ')'}`).join('\n');
      const subject = `Richiesta foto Gallo d'Oro — ${name || email}`;
      const body =
        `Nome: ${name || '(non indicato)'}\n` +
        `Email: ${email}\n` +
        (note ? `Nota: ${note}\n` : '') +
        `\nFoto richieste:\n${elenco}`;
      const mailtoUrl = `mailto:${REQUEST_DESTINATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
    }catch(e){
      console.error('Errore apertura client email', e);
      // Non blocco il flusso: la richiesta è comunque salvata correttamente
    }

    setCart([]);
    statusEl.textContent = '✅ Richiesta salvata! Si sta aprendo il tuo programma di posta per inviarcela anche via email.';
    document.getElementById('cart-items').innerHTML = '';
    document.getElementById('cart-name').value = '';
    document.getElementById('cart-email').value = '';
    document.getElementById('cart-note').value = '';
    setTimeout(() => window.closeCartModal(), 3200);
  }catch(e){
    console.error('Errore invio richiesta', e);
    statusEl.textContent = 'Errore durante l\'invio, riprova.';
  }
};
