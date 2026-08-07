# 🐓 Gallo d'Oro di Petriano — Documentazione del progetto

Documento di riepilogo di tutto ciò che è stato costruito finora, per tenere traccia dello stato del sito, delle scelte fatte e di cosa resta da fare.

**Ultimo aggiornamento:** 30 luglio 2026 (filigrana, torna su, sicurezza inattività, anteprima social)
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
| `style.css` | Tutto lo stile grafico, condiviso da ogni pagina |
| `script.js` | Tutta la logica condivisa: Firebase, dati, voti, navigazione, lightbox, carrello |
| `admin.html` | Area riservata (login) per caricare foto e gestire il sito |

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

## 4. Tutte le funzionalità costruite finora

### Struttura di base
- Sito diviso in 3 pagine reali (non più una singola app con stati JS): storia, scelta anno, foto — collegate da link veri, non da JavaScript
- Design a tema festival di paese: sfondo notturno, oro/cremisi, luci a festone, biglietti "ticket" per gli anni, foto in stile polaroid

### Pagina Storia
- Bozza di testo storico scritta sulla base di informazioni reali trovate online (fondazione 1966, Pro Loco, premi Gallo d'Oro/Argento/Bronzo) — **da rivedere e correggere con i dettagli che l'amministratore conosce meglio**

### Pagina Scegli anno
- Generazione automatica di tutte le edizioni da mostrare
- Campo di ricerca per filtrare gli anni digitando
- Mostra **solo gli anni impostati come "attivi"** dall'admin (il Festival è saltato alcuni anni); se l'admin non ha ancora impostato nulla, mostra tutti gli anni come demo con un avviso

### Pagina Foto
- Foto mostrate in stile polaroid, con segnaposto quando non ci sono ancora foto reali per un anno
- **Voto e classifica**: si scrive un nome sotto una foto, oppure si tocca un nome già proposto per votarlo; un voto per persona per foto (identificata tramite il browser, non un vero login), sovrascrivibile se si cambia idea
- **Anti-spam**: 4 secondi minimi tra un voto e l'altro (con avviso), più una validazione lato database (max 40 caratteri, non vuoto)
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

### Filigrana, torna su, sicurezza e anteprima social
- **Filigrana sulle foto**: applicata automaticamente alle nuove foto caricate (testo diagonale semi-trasparente ripetuto "Gallo d'Oro di Petriano"), disattivabile con un checkbox in admin se serve caricare qualche foto senza. Le foto già caricate in precedenza non vengono modificate retroattivamente
- **Pulsante "torna su"**: compare in basso a sinistra dopo aver scorso un po' la pagina, riporta in cima con un click
- **Disconnessione automatica admin**: se non c'è nessuna interazione per 15 minuti mentre sei loggato, esci automaticamente per sicurezza
- **Anteprima social**: generata un'immagine di copertina (`og-image.png`) e aggiunti i meta tag Open Graph/Twitter a tutte e 3 le pagine, così condividendo il link su WhatsApp/Facebook compare un'anteprima curata invece di un link nudo
- **Ancora da fare**: bloccare le regole del database a una sola email admin, e collegare l'invio email automatico delle richieste del carrello — in attesa che l'admin comunichi l'indirizzo email da usare

### Palette colori e login admin
- Applicata la palette **"Blu Adriatico"**: blu petrolio profondo (`#0f2430`) con accenti oro sabbia (`#d7a45c`) e corallo/terracotta (`#d1614a`), al posto della precedente palette navy/cremisi. Cambiata una sola volta nelle variabili condivise di colore, si è propagata automaticamente a tutto il sito (nav, pulsanti, biglietti, foto, badge classifica, banner) grazie all'uso coerente delle variabili CSS
- Erano state proposte anche altre 4 palette a tema (vinaccia/teatro, terracotta/tramonto, verde colline marchigiane, oltre alla precedente) prima di scegliere questa
- **Pagina di login admin** ridisegnata: ora a schermo intero e centrata, con intestazione dedicata (🐓 Gallo d'Oro), occhio per mostrare/nascondere la password, stato "Accesso in corso…" durante il login, messaggio di errore più chiaro, e possibilità di premere Invio per accedere

### Rifinitura grafica generale
- Sfondo con più profondità (vignettatura + texture leggerissima), invece di un colore piatto
- Barra di navigazione fissa in alto con effetto vetro sfocato mentre si scorre
- Ombre più ricche e stratificate su card, biglietti anno, foto e polaroid; pulsanti con gradiente invece di colore piatto
- Titoli di sezione con un piccolo accento decorativo dorato/cremisi
- Rifiniture responsive dedicate per schermi piccoli (nav, biglietti, foto, carrello, lightbox)
- Pagina admin allineata visivamente al sito pubblico (stesso sfondo, stessi accenti sui pannelli)

### Animazioni e dinamismo (aggiunte per rendere il sito più vivo)
- **Comparsa graduale degli elementi** mentre si scorre la pagina (testo della storia, biglietti anno, schede foto), con un leggero effetto a cascata invece che tutto insieme
- **Luci del festival che brillano** a turno (twinkle), invece di stare ferme
- **Luccichio al passaggio del mouse** sui biglietti degli anni (un lampo di luce li attraversa in diagonale)
- **Piumette dorate 🪶** che cadono lentamente nella parte alta della pagina Storia, a tema con il gallo
- **"Pop" sulla classifica** quando arriva un nuovo voto, per far notare che è cambiata
- **Rimbalzo del carrello** 🛒 quando si aggiunge una foto
- **Comparsa morbida della pagina** all'apertura (dissolvenza), invece di un flash secco di caricamento
- **Nota:** le animazioni vengono mostrate sempre a tutti, per scelta esplicita — inizialmente si disattivavano per chi ha "riduci movimento" attivo nel proprio dispositivo (buona pratica di accessibilità), ma su richiesta sono state rese sempre attive indipendentemente da quella preferenza

### Avviso uso foto (banner)
- Fascia rossa in cima a tutte e 3 le pagine del sito pubblico, che avvisa che le foto sono di proprietà del Festival e non possono essere usate a scopo di lucro né riprodotte senza autorizzazione
- Si può chiudere con la "✕"; una volta chiusa non ricompare più su quel dispositivo/browser (salvato in localStorage), così non è invadente per chi torna spesso sul sito

---

## 5. Bug corretti nel tempo (per riferimento)

- **"2 votoi" invece di "2 voti"** — errore di pluralizzazione nel testo
- **Click su un nome in classifica non funzionava** — le virgolette annidate nell'HTML si "rompevano" a vicenda; risolto passando a un sistema con `data-attribute` invece di stringhe incollate in un `onclick`
- **Foto bloccate su "Caricamento foto..."** — `ReferenceError` per una variabile (`batchYear`) usata prima di essere dichiarata nel codice; risolto riordinando le dichiarazioni
- **Frecce anno precedente/successivo** portavano anche su anni non attivi — corretto per usare la lista di anni attivi invece di un semplice anno−1/anno+1
- **Layout del form nel carrello disordinato** (etichette ed campi disallineati) — mancava un `width:100%` esplicito sui campi; ogni campo è stato raggruppato in un blocco proprio per un layout più solido
- **Eliminare una foto in admin non aggiornava subito la schermata** — le regole del database non permettevano all'admin di cancellare anche i voti collegati alla foto; l'operazione falliva silenziosamente e bloccava l'aggiornamento della lista. Corrette le regole (aggiunto `.write: auth != null` sul nodo `votes`) e reso il codice più robusto (la lista si aggiorna comunque, anche se la pulizia dei voti fallisse)

---

## 6. Cosa NON è stato ancora fatto (prossimi passi possibili)

- ~~Filigrana sulle foto pubbliche~~ — fatto (vedi sezione sopra)
- **Invio email automatico**: quando verrà scelto l'indirizzo email di destinazione, si può aggiungere un `mailto:` automatico che apre il client email del visitatore con il messaggio già pronto, in aggiunta all'elenco richieste in admin (già funzionante)
- **Sicurezza extra dell'area admin**, discussa ma non completata:
  - Bloccare le regole del database a una email specifica invece che "chiunque sia loggato"
  - Disconnessione automatica dopo inattività
  - Firebase App Check (blocco automatizzato di bot/abusi)
- Eventuali funzionalità aggiuntive suggerite in passato e non ancora richieste: statistiche generali, pagina "Albo d'oro" dei vincitori ufficiali, condivisione diretta su WhatsApp, badge "nome confermato" per foto identificate con certezza

---

## 7. Note pratiche da ricordare

- Dopo ogni modifica ai file, vanno **ricaricati manualmente su GitHub** (nessun collegamento automatico è attivo)
- Le foto sono salvate come testo dentro al database, non come file separati: per volumi molto più grandi (migliaia di foto) andrebbe rivista l'architettura, ma per centinaia di foto per anno il sistema attuale regge bene
- L'identificazione dei visitatori per il voto "una persona, un voto per foto" si basa sul browser (non un vero account): cancellando i dati del browser o cambiando dispositivo, per il sito è "una persona nuova"
