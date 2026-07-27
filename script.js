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
  let bulbs = '';
  for(let i=0;i<18;i++){
    const x = 10 + i*54;
    const colors = ['#d9a441','#b23a2f','#f0c869'];
    const c = colors[i % colors.length];
    bulbs += `<circle cx="${x}" cy="18" r="4.2" fill="${c}" opacity="0.9"/>`;
  }
  return `<svg viewBox="0 0 980 34" preserveAspectRatio="none">
    <path d="M0,4 Q245,26 490,4 T980,4" stroke="rgba(217,164,65,0.35)" stroke-width="1.5" fill="none"/>
    ${bulbs}
  </svg>`;
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

function attachRankListener(year, photoId){
  const r = db.ref(`votes/${year}/${photoId}/voters`);
  const cb = (snapshot) => renderRankFromData(year, photoId, snapshot.val() || {});
  r.on('value', cb);
  activeListeners.push({ref:r, cb});
}

function addVote(year, photoId, rawName){
  const name = rawName.trim();
  if(!name) return;
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
    <li class="rank-row" onclick="__voteExisting(${year}, '${photoId}', ${JSON.stringify(name)})">
      <span class="rank-badge ${badgeClass(idx)}">${badgeLabel(idx)}</span>
      <span class="rank-name">${escapeHtml(name)}</span>
      <span class="rank-count">${count} voto${count===1?'':'i'}</span>
    </li>
  `).join('');
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

window.__voteExisting = function(year, photoId, name){
  addVote(year, photoId, name);
};

// Genera la scheda HTML di una foto (usata dalla pagina 3)
function photoCardHtml(year, photoId, label, mediaHtml, caption){
  return `
    <div class="photo-card">
      <div class="photo-id">Scatto ${label} · ${year}</div>
      <div class="polaroid">
        ${mediaHtml}
        ${caption ? `<div class="polaroid-cap">${caption}</div>` : ''}
      </div>
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
