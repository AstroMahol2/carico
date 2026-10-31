// Libreria esercizi di base. kind decide l'incremento di default:
// bilanciere/macchina: 2,5 kg sopra, 5 kg gambe · manubri: 2 kg · corpo libero: 0 (si progredisce in reps)
const GROUPS = [
  { id: 'petto', name: 'Petto' },
  { id: 'schiena', name: 'Schiena' },
  { id: 'spalle', name: 'Spalle' },
  { id: 'bicipiti', name: 'Bicipiti' },
  { id: 'tricipiti', name: 'Tricipiti' },
  { id: 'quadricipiti', name: 'Quadricipiti' },
  { id: 'femorali', name: 'Femorali e glutei' },
  { id: 'polpacci', name: 'Polpacci' },
  { id: 'addome', name: 'Addome' },
];

const LOWER = new Set(['quadricipiti', 'femorali', 'polpacci']);

const BASE_EXERCISES = [
  ['petto', 'Panca piana bilanciere', 'bar'],
  ['petto', 'Panca inclinata bilanciere', 'bar'],
  ['petto', 'Panca piana manubri', 'db'],
  ['petto', 'Panca inclinata manubri', 'db'],
  ['petto', 'Chest press', 'machine'],
  ['petto', 'Pectoral machine', 'machine'],
  ['petto', 'Croci ai cavi', 'cable'],
  ['petto', 'Croci con manubri', 'db'],
  ['petto', 'Dip alle parallele', 'bw'],
  ['petto', 'Piegamenti', 'bw'],

  ['schiena', 'Stacco da terra', 'bar'],
  ['schiena', 'Trazioni alla sbarra', 'bw'],
  ['schiena', 'Lat machine avanti', 'cable'],
  ['schiena', 'Lat machine presa stretta', 'cable'],
  ['schiena', 'Rematore con bilanciere', 'bar'],
  ['schiena', 'Rematore con manubrio', 'db'],
  ['schiena', 'Pulley basso', 'cable'],
  ['schiena', 'T-bar row', 'bar'],
  ['schiena', 'Pullover ai cavi', 'cable'],
  ['schiena', 'Row machine', 'machine'],

  ['spalle', 'Military press bilanciere', 'bar'],
  ['spalle', 'Lento avanti manubri', 'db'],
  ['spalle', 'Shoulder press machine', 'machine'],
  ['spalle', 'Alzate laterali manubri', 'db'],
  ['spalle', 'Alzate laterali ai cavi', 'cable'],
  ['spalle', 'Alzate posteriori', 'db'],
  ['spalle', 'Reverse pec deck', 'machine'],
  ['spalle', 'Face pull', 'cable'],

  ['bicipiti', 'Curl con bilanciere', 'bar'],
  ['bicipiti', 'Curl con manubri', 'db'],
  ['bicipiti', 'Curl a martello', 'db'],
  ['bicipiti', 'Curl panca Scott', 'bar'],
  ['bicipiti', 'Curl su panca inclinata', 'db'],
  ['bicipiti', 'Curl ai cavi', 'cable'],

  ['tricipiti', 'Pushdown ai cavi', 'cable'],
  ['tricipiti', 'Estensioni sopra la testa al cavo', 'cable'],
  ['tricipiti', 'French press', 'bar'],
  ['tricipiti', 'Panca presa stretta', 'bar'],
  ['tricipiti', 'Dip machine', 'machine'],
  ['tricipiti', 'Kickback con manubrio', 'db'],

  ['quadricipiti', 'Squat con bilanciere', 'bar'],
  ['quadricipiti', 'Front squat', 'bar'],
  ['quadricipiti', 'Leg press', 'machine'],
  ['quadricipiti', 'Hack squat', 'machine'],
  ['quadricipiti', 'Leg extension', 'machine'],
  ['quadricipiti', 'Affondi con manubri', 'db'],
  ['quadricipiti', 'Bulgarian split squat', 'db'],
  ['quadricipiti', 'Goblet squat', 'db'],

  ['femorali', 'Stacco rumeno', 'bar'],
  ['femorali', 'Leg curl sdraiato', 'machine'],
  ['femorali', 'Leg curl seduto', 'machine'],
  ['femorali', 'Hip thrust', 'bar'],
  ['femorali', 'Good morning', 'bar'],
  ['femorali', 'Abductor machine', 'machine'],
  ['femorali', 'Glute bridge', 'bw'],

  ['polpacci', 'Calf raise in piedi', 'machine'],
  ['polpacci', 'Calf seduto', 'machine'],
  ['polpacci', 'Calf alla leg press', 'machine'],

  ['addome', 'Crunch ai cavi', 'cable'],
  ['addome', 'Crunch machine', 'machine'],
  ['addome', 'Leg raise alla sbarra', 'bw'],
  ['addome', 'Ab wheel', 'bw'],
];

function defaultIncrement(group, kind) {
  if (kind === 'bw') return 0;
  if (kind === 'db') return 2;
  return LOWER.has(group) ? 5 : 2.5;
}

function slug(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function seedExercises() {
  return BASE_EXERCISES.map(([group, name, kind]) => ({
    id: slug(name), name, group, kind, inc: defaultIncrement(group, kind),
  }));
}
