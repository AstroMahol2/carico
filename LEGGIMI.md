# Beast Track — installare l'app sull'iPhone via cavo

Da Windows non si può compilare un'app iOS, quindi l'.ipa lo compila un Mac gratuito di GitHub. Poi lo firmi e lo installi tu con Sideloadly.

## 1. Compilare l'.ipa (una volta, e poi solo quando cambi il codice)

1. Il codice è nel repository privato https://github.com/AstroMahol2/carico. Con il piano gratuito hai circa 200 minuti di Mac al mese, e una compilazione ne usa circa 5–8.
2. Dopo una modifica, dalla cartella `GYM LOG`:
   ```bash
   git add .
   git commit -m "modifica"
   git push
   ```
3. Su GitHub apri **Actions → Build IPA**: parte da solo a ogni push, oppure puoi avviarlo a mano con *Run workflow*.
4. Quando è verde, in fondo alla pagina scarica **BeastTrack-ipa** (è uno zip) ed estrai `BeastTrack.ipa`.

## 2. Installare con il cavo (Sideloadly)

1. Installa **Sideloadly** (sideloadly.io) e **iTunes** scaricato dal sito Apple, non quello del Microsoft Store.
2. Collega l'iPhone con il cavo, sblocca il telefono e tocca *Autorizza*.
3. In Sideloadly trascina `BeastTrack.ipa`, inserisci il tuo Apple ID e premi **Start**.
4. Sull'iPhone:
   - *Impostazioni → Generali → VPN e gestione dispositivi* → tocca il tuo Apple ID e scegli *Autorizza*.
   - Su iOS 16 e successivi: *Impostazioni → Privacy e sicurezza → Modalità sviluppatore* → attivala e riavvia il telefono.

## 3. Ogni 7 giorni

Con un Apple ID gratuito la firma scade dopo 7 giorni. **Non cancellare l'app.** Ripeti il passo 2 con lo stesso `BeastTrack.ipa`: l'app viene installata sopra quella vecchia e **i dati restano**. Se preferisci, Sideloadly può rinnovarla da solo via Wi‑Fi quando il PC è acceso.

Per sicurezza, ogni tanto vai su **Storico → icona condividi → Esporta backup** e salva il file in File o iCloud. Se reinstalli l'app da zero, ripristini i dati con *Importa backup*.

## Dove stanno i dati

Sono salvati nella memoria dell'iPhone, nella sandbox dell'app (UserDefaults, tramite Capacitor Preferences). Non passa niente da internet.

## Come funziona il suggerimento di peso (doppia progressione)

Per ogni esercizio della scheda scegli un range di ripetizioni, per esempio 8–12.

| La volta scorsa | Oggi l'app suggerisce |
|---|---|
| Tutte le serie al massimo del range con lo stesso carico (es. 3×12 a 50 kg) | **+ incremento** (es. 52,5 kg) e si riparte dal minimo (8) |
| Dentro il range | **Stesso carico**, +1 ripetizione per serie |
| Due sedute di fila sotto il minimo con lo stesso carico | **Scarico di circa il 10%** e si risale |

Incrementi di default, modificabili in ogni esercizio: 2,5 kg bilanciere e macchine per la parte superiore, 5 kg gambe, 2 kg manubri, 0 a corpo libero (lì si progredisce in ripetizioni).

Fonti:
- ACSM Position Stand 2009, *Progression Models in Resistance Training for Healthy Adults*: aumentare il carico del 2–10% quando si fanno 1–2 ripetizioni oltre il target — https://sfu.ca/~ryand/kin343/ACSMresistance.pdf
- Regola NSCA "2-for-2": incrementi di circa 1–2,5 kg per la parte superiore e 2,5–5 kg per le gambe — https://app.achievable.me/study/cscs/learn/program-design-for-resistance-training-training-frequency-exercise-order-and-training-load-and-repetitions
- Plotkin et al. 2022, PeerJ: aumentare le ripetizioni o il carico porta a risultati simili in 8 settimane — https://peerj.com/articles/14142

## Provarla sul PC

```bash
npm run serve
```
Poi apri http://localhost:5174 (i dati di prova restano solo nel browser).
