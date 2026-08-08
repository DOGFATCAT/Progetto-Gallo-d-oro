# 🐓 Gallo d'Oro di Petriano — Documentazione del progetto

Documento di riepilogo di tutto ciò che è stato costruito finora, per tenere traccia dello stato del sito, delle scelte fatte e di cosa resta da fare.

**Ultimo aggiornamento:** 7 agosto 2026 (redesign completo — glassmorphism, GSAP, design system moderno)
**Repository:** https://github.com/DOGFATCAT/Progetto-Gallo-d-oro
**Sito online:** https://dogfatcat.github.io/Progetto-Gallo-d-oro/index.html

---

## 1. Cos'è il sito

Un archivio fotografico online del Festival "Gallo d'Oro" di Gallo di Petriano (PU), nato nel 1966. Il sito ha tre funzioni principali:

1. Racconta la storia del Festival
2. Permette di sfogliare le foto delle varie edizioni, anno per anno
3. Trasforma la visione delle foto in un piccolo gioco della memoria: chi visita il sito può provare a indovinare chi c'è nelle foto, votando un nome; i voti formano una classifica condivisa e pubblica

C'è anche un'**area riservata** (solo per l'amministratore) per caricare le foto reali, gestire quali anni esistono davvero, disattivare il gioco su foto di gruppo, scrivere didascalie manuali, e vedere le richieste di foto senza filigrana inviate dai visitatori.

---

## 2. Struttura dei file

Tutti i file vivono nella stessa cartella del repository GitHub (necessario per i link relativi tra le pagine):

| File | Cosa fa |
|---|---|
| `index.html` | Pagina 1 — la storia del Festival (home del sito) |
| `pagina2-anni.html` | Pagina 2 — selezione dell'anno, con ricerca |
| `pagina3-foto.html` | Pagina 3 — foto dell'anno scelto, voto, classifica, carrello |
| `style.css` | Tutto lo stile grafico, condiviso da ogni pagina — **completamente ridisegnato** |
| `script.js` | Tutta la logica condivisa: Firebase, dati, voti, navigazione, lightbox, carrello — **modularizzato e modernizzato** |
| `admin.html` | Area riservata (login) per caricare foto e gestire il sito — **completamente ridisegnata** |

**Importante:** i nomi dei file non vanno cambiati, perché sono richiamati tra loro per nome esatto (link, `<script src="...">`, `<link href="...">`).

---

## 3. Come funziona dietro le quinte (Firebase)

Il sito usa **Firebase Realtime Database** (gratuito) come "magazzino dati" condiviso online, e **Firebase Authentication** (email/password) per proteggere l'area admin. Niente Firebase Storage (che richiederebbe il piano a pagamento Blaze) — le foto sono salvate come testo compresso (base64) direttamente nel database.

### Struttura dei dati nel database

```
votes/
  {anno}/
    {idFoto}/
      voters/
        {idVisitatore}: "Nome scritto dal visitatore"

photos/
  {anno}/
    {idFoto}: {
      data: "data:image/jpeg;base64,....." (l'immagine compressa),
      voting: true/false   (il gioco "chi è" è attivo su questa foto?),
      caption: "testo",    (didascalia scritta a mano dall'admin, facoltativa)
      number: "12"         (numero foto assegnato in admin, per ritrovarla facilmente)
    }

meta/
  activeYears/
    {anno}: true   (solo gli anni realmente esistiti, impostati a mano in admin)

requests/
  {idRichiesta}: {
    name, email, note,
    items: [ {year, photoId}, ... ],
    timestamp, status
  }
```

### Regole di sicurezza attuali (Realtime Database → Regole)

```json
{
  "rules": {
    "votes": {
      ".read": true,
      ".write": "auth != null",
      "$year": {
        "$photoId": {
          "voters": {
            "$clientId": {
              ".write": true,
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 40"
            }
          }
        }
      }
    },
    "photos": {
      ".read": true,
      ".write": "auth != null"
    },
    "meta": {
      ".read": true,
      ".write": "auth != null"
    },
    "requests": {
      ".read": "auth != null",
      ".write": true
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

In parole semplici: chiunque può leggere foto/voti/anni attivi e votare o inviare una richiesta, ma solo chi ha fatto login da admin può caricare foto, gestire gli anni attivi, o leggere le richieste ricevute.

---

## 4. Redesign completo — Agosto 2026

### Motivazione
Il sito è stato completamente ridisegnato per passare da un'estetica "festival di paese tradizionale" a un design **moderno, premium e spazioso**, ispirato ai siti dei festival culturali contemporanei. L'obiettivo era rendere l'esperienza più godibile, professionale e memorabile, senza perdere l'identità calda e comunitaria del Gallo d'Oro.

### Design System
- **Glassmorphism** su tutte le card, pannelli e la navigazione: sfondi semi-trasparenti con `backdrop-filter: blur(20px)`, bordi sottili luminosi, ombre profonde
- **Gradiente aurora animato** sullo sfondo: tre radial-gradient (oro, corallo, oro tenue) che si muovono delicatamente con un'animazione CSS di 20s, creando profondità senza mai distrarre
- **Texture noise** sovrapposta a opacità 0.025 per un effetto "carta vellutata" che toglie la sensazione di digitale freddo
- **Design token CSS**: tutti i colori, spaziature, raggi, font e transizioni sono variabili CSS (`:root`), modificabili in un solo punto

### Nuova palette colori
La precedente palette "Blu Adriatico" (`#0f2430`, `#d7a45c`, `#d1614a`) è stata sostituita da una scala più raffinata:
- **Sfondo**: `#060a12` (notte profonda, quasi nero-blu)
- **Oro**: scala da `#f9c94a` a `#d4a03a` con glow `rgba(212,160,58,0.35)`
- **Accento corallo**: `#e85d4e` / `#ff7a6b` con glow proprio
- **Testo**: `#f2ede6` (bianco caldo), con opacità variabile per gerarchia
- **Bordi**: `rgba(255,255,255,0.06)` base, `rgba(212,160,58,0.25)` per elementi dorati

### Nuova tipografia
- **Display**: `Space Grotesk` (titoli, numeri grandi, brand) — moderna, geometrica, con carattere
- **Body**: `Inter` (testo corrente, pulsanti, form) — leggibilissima, ottima a tutte le dimensioni
- **Mono**: `JetBrains Mono` (badge, anni, dettagli tecnici, contatori) — monospace con personalità

### Navigazione
- **Pillola fluttuante** centrata in alto, invece della barra fissa a tutta larghezza. È compatta, elegante, con effetto vetro sfocato e bordo sottile
- Divisore verticale tra brand e link
- Link attivo con sfondo oro gradiente e ombra dorata
- Su mobile si compatta automaticamente senza rompersi

### Pagina Storia (`index.html`)
- **Hero cinematografica**: badge animato con punto pulsante, titolo enorme con gradiente text-fill, sottotitolo centrato, CTA prominente
- **Layout Bento**: la storia è racchiusa in una griglia di card "a mosaico" (2 colonne su desktop, 1 su mobile) con bordi dorati al hover. Ogni card ha un argomento specifico (origini, premi, comunità, archivio)
- Animazione di entrata GSAP sulla hero (badge, titolo, sottotitolo compaiono in sequenza)
- Scroll-triggered reveal su tutte le card

### Pagina Scegli anno (`pagina2-anni.html`)
- **Card anno ridisegnate**: sfondo glass, bordo con gradiente oro/corallo che appare al hover, numero anno con gradiente text-fill, shine che attraversa la card al passaggio del mouse
- **Effetto 3D tilt**: su desktop, le card seguono leggermente il movimento del mouse con `perspective` e `rotateX/Y` (disattivato su touch)
- Ricerca con icona lente e pulsante cancella, stile glass
- Banner demo con bordo tratteggiato dorato

### Pagina Foto (`pagina3-foto.html`)
- **Galleria masonry-like**: card foto con bordi arrotondati, overflow hidden, immagine che scala al hover con transizione lenta
- **Overlay gradiente** in basso che appare al hover, con icona zoom
- **Lightbox cinematico**: sfondo scuro con blur, immagine che entra con scale da 0.95 a 1, pulsante chiudi che ruota al hover. Blocca lo scroll del body
- **Skeleton loading** nel carrello: placeholder animati mentre si caricano le anteprime
- Frecce anno prev/next in stile pillola glass
- Back link stilizzato con freccia

### Area Admin (`admin.html`)
- **Login ridisegnato**: schermo intero centrato, card glass con bordo sottile, brand con glow dorato, input con focus glow dorato, toggle password con occhio
- **Pannelli admin**: stesso stile glass delle card pubbliche, con accent line (gradiente oro-corallo) a sinistra dei titoli
- Griglia foto admin con hover sui bordi
- Drop zone per upload con bordo tratteggiato dorato e stati hover/dragover
- Stati di caricamento e messaggi di errore coerenti con la nuova palette

### Animazioni e micro-interazioni
- **GSAP + ScrollTrigger**: reveal degli elementi con fade + translateY quando entrano nel viewport. Fallback nativo per chi ha JavaScript disabilitato
- **Hero entrance**: sequenza coordinata (badge → titolo → sottotitolo → CTA) con easing `power2.out`
- **Rank list pop**: quando arriva un nuovo voto, la classifica fa un leggero "pump" visivo con GSAP
- **Cart bounce**: quando si aggiunge una foto al carrello, il FAB fa un rimbalzo elastico (`cubic-bezier(0.34,1.56,0.64,1)`)
- **Legal banner**: chiusura animata con GSAP (altezza e opacità a zero) prima della rimozione
- **Luci festival**: sempre presenti, con colori aggiornati alla nuova palette (oro, corallo, oro chiaro)
- **Page ready fade**: il body parte da `opacity: 0` e passa a `1` quando il JS monta la nav
- **Pulsanti**: shine effect che attraversa il pulsante al hover (gradiente bianco semi-trasparente in movimento)

### script.js — Modularizzazione
- Codice riorganizzato in sezioni ben separate: Firebase, Identity, Year Memory, Demo Data, Utilities, Navigation, Scroll Reveal, Votes, Lightbox, Cart, Legal Notice
- Funzioni esportate su `window` solo dove necessario (handler inline)
- Anti-spam, escape HTML/attr, normalizePhotoValue tutto conservato e funzionante
- `initYearCardTilt()` funzione dedicata per l'effetto 3D sulle card anno

### Responsive
- Breakpoint principale a 768px
- Nav: brand più piccolo, link compatti, nessun divider su mobile
- Bento grid: card a larghezza piena su mobile
- Year grid: 2 colonne su schermi stretti, auto-fill su desktop
- Photo grid: singola colonna su <480px, auto-fill sopra
- Admin grid: colonne più strette su mobile
- Lightbox: padding ridotto, pulsante chiudi più piccolo
- Cart panel: max-height 90vh su mobile

### Scrollbar personalizzata
- Track trasparente, thumb bianco a 10% opacità con hover a 18%, bordi arrotondati. Coerente con l'estetica dark.

---

## 5. Tutte le funzionalità costruite finora (funzionali nel redesign)

### Struttura di base
- Sito diviso in 3 pagine reali (non più una singola app con stati JS): storia, scelta anno, foto — collegate da link veri, non da JavaScript

### Pagina Storia
- Bozza di testo storico scritta sulla base di informazioni reali trovate online (fondazione 1966, Pro Loco, premi Gallo d'Oro/Argento/Bronzo) — **da rivedere e correggere con i dettagli che l'amministratore conosce meglio**

### Pagina Scegli anno
- Generazione automatica di tutte le edizioni da mostrare
- Campo di ricerca per filtrare gli anni digitando
- Mostra **solo gli anni impostati come "attivi"** dall'admin (il Festival è saltato alcuni anni); se l'admin non ha ancora impostato nulla, mostra tutti gli anni come demo con un avviso

### Pagina Foto
- Foto mostrate in stile card moderno, con segnaposto quando non ci sono ancora foto reali per un anno
- **Voto e classifica**: si scrive un nome sotto una foto, oppure si tocca un nome già proposto per votarlo; un voto per persona per foto (identificata tramite il browser, non un vero login), sovrascrivibile se si cambia idea
- **Anti-spam**: 4 secondi minimi tra un voto e l'altro (con avviso toast), più una validazione lato database (max 40 caratteri, non vuoto)
- **Lightbox**: click su una foto reale per vederla ingrandita a schermo intero
- **Frecce anno precedente/successivo**: navigano solo tra gli anni realmente attivi (non su anni senza foto)
- **Caricamento a blocchi**: le foto si caricano 12 alla volta con un pulsante "Carica altre foto", pensato per reggere bene anche 100-150+ foto per anno senza rallentare l'apertura della pagina
- **Foto di gruppo**: l'admin può disattivare il gioco "chi è" su singole foto (utile per foto con tante persone insieme)
- **Didascalia manuale**: quando il gioco è disattivato (o anche quando è attivo, come nota), l'admin può scrivere a mano chi si vede nella foto
- **Carrello foto**: pulsante "Aggiungi al carrello" su ogni foto reale; un'iconcina fissa in basso a destra mostra quante foto sono state scelte; si apre un pannello con l'elenco (anche di anni diversi), si inseriscono nome/email/nota e si invia un'unica richiesta

### Area Admin (`admin.html`)
- Login protetto con email e password (Firebase Authentication — nessuna registrazione pubblica, l'utente va creato a mano dalla console Firebase)
- Pannello **Richieste foto ricevute**: elenco delle richieste inviate dal carrello, con nome, email (cliccabile), nota, anteprime delle foto richieste (anno + numero foto sotto ogni miniatura, o l'identificativo automatico se non hai ancora assegnato un numero), e pulsante per segnarle come evase. L'elenco ha un'altezza massima con barra di scorrimento, per restare gestibile anche con molte richieste
- Pannello **Anni presenti**: griglia di checkbox per scegliere quali anni sono realmente esistiti; il sito pubblico (pagina 2 e le frecce di pagina 3) mostra solo questi
- Menu a tendina per scegliere l'anno da modificare, aggiornato automaticamente in base agli anni attivi selezionati
- **Caricamento foto**: trascina o seleziona più immagini insieme; vengono compresse automaticamente (ridimensionate, qualità JPEG ridotta) prima di essere salvate, per restare leggere
- Per ogni foto già caricata: **numero foto assegnato automaticamente** (progressivo per anno) e modificabile a mano — utile per farlo corrispondere a come rinomini i file sul tuo computer; le foto in griglia si riordinano in base al numero; pulsante per **attivare/disattivare il voto**, campo per scrivere/salvare una **didascalia**, pulsante per **eliminarla** (rimuove anche i voti collegati)

### Avviso uso foto (banner)
- Fascia in cima a tutte e 3 le pagine del sito pubblico, con sfondo gradiente corallo-trasparente, che avvisa che le foto sono di proprietà del Festival e non possono essere usate a scopo di lucro né riprodotte senza autorizzazione
- Si può chiudere con la "✕"; una volta chiusa non ricompare più su quel dispositivo/browser (salvato in localStorage), così non è invadente per chi torna spesso sul sito. La chiusura è animata.

---

## 6. Bug corretti nel tempo (per riferimento)

- **"2 votoi" invece di "2 voti"** — errore di pluralizzazione nel testo
- **Click su un nome in classifica non funzionava** — le virgolette annidate nell'HTML si "rompevano" a vicenda; risolto passando a un sistema con `data-attribute` invece di stringhe incollate in un `onclick`
- **Foto bloccate su "Caricamento foto..."** — `ReferenceError` per una variabile (`batchYear`) usata prima di essere dichiarata nel codice; risolto riordinando le dichiarazioni
- **Frecce anno precedente/successivo** portavano anche su anni non attivi — corretto per usare la lista di anni attivi invece di un semplice anno−1/anno+1
- **Layout del form nel carrello disordinato** (etichette ed campi disallineati) — mancava un `width:100%` esplicito sui campi; ogni campo è stato raggruppato in un blocco proprio per un layout più solido
- **Eliminare una foto in admin non aggiornava subito la schermata** — le regole del database non permettevano all'admin di cancellare anche i voti collegati alla foto; l'operazione falliva silenziosamente e bloccava l'aggiornamento della lista. Corrette le regole (aggiunto `.write: auth != null` sul nodo `votes`) e reso il codice più robusto (la lista si aggiorna comunque, anche se la pulizia dei voti fallisse)

---

## 7. Cosa NON è stato ancora fatto (prossimi passi possibili)

- **Filigrana sulle foto pubbliche**: prevista ma non ancora implementata
- **Invio email automatico**: quando verrà scelto l'indirizzo email di destinazione, si può aggiungere un `mailto:` automatico che apre il client email del visitatore con il messaggio già pronto, in aggiunta all'elenco richieste in admin (già funzionante)
- **Sicurezza extra dell'area admin**, discussa ma non completata:
  - Bloccare le regole del database a una email specifica invece che "chiunque sia loggato"
  - Disconnessione automatica dopo inattività
  - Firebase App Check (blocco automatizzato di bot/abusi)
- Eventuali funzionalità aggiuntive suggerite in passato e non ancora richieste: statistiche generali, pagina "Albo d'oro" dei vincitori ufficiali, condivisione diretta su WhatsApp, badge "nome confermato" per foto identificate con certezza

---

## 8. Note pratiche da ricordare

- Dopo ogni modifica ai file, vanno **ricaricati manualmente su GitHub** (nessun collegamento automatico è attivo)
- Le foto sono salvate come testo dentro al database, non come file separati: per volumi molto più grandi (migliaia di foto) andrebbe rivista l'architettura, ma per centinaia di foto per anno il sistema attuale regge bene
- L'identificazione dei visitatori per il voto "una persona, un voto per foto" si basa sul browser (non un vero account): cancellando i dati del browser o cambiando dispositivo, per il sito è "una persona nuova"
- **Il redesign non ha modificato nulla su Firebase**: le regole del database, l'autenticazione e la struttura dati restano identiche. Basta sostituire i file HTML/CSS/JS nel repository e fare push.
