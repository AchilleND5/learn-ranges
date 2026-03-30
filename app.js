const $ = (id) => document.getElementById(id);

let ranges = [];
let currentRange = null;

// --- Init ---

async function init() {
  const res = await fetch('ranges.json');
  ranges = await res.json();

  const params = new URLSearchParams(window.location.search);
  const rangeName = params.get('range');

  if (rangeName) {
    showQuiz(rangeName);
  } else {
    showHome();
  }
}

// --- Screens ---

function showHome() {
  $('home').classList.remove('hidden');
  $('quiz').classList.add('hidden');
  renderStats();
}

function showQuiz(rangeName) {
  currentRange = rangeName;

  $('home').classList.add('hidden');
  $('quiz').classList.remove('hidden');

  $('range-name').textContent = rangeName;
  $('range-image').src = 'ranges/' + encodeURIComponent(rangeName) + '.png';

  // Reset state
  $('btn-reveal').classList.remove('hidden');
  $('range-image-container').classList.add('hidden');
  $('feedback-buttons').classList.add('hidden');
  $('result-msg').classList.add('hidden');
}

function pickRandom() {
  if (ranges.length === 0) return;
  const idx = Math.floor(Math.random() * ranges.length);
  // Clear URL param and show quiz
  window.history.replaceState({}, '', window.location.pathname + '?range=' + encodeURIComponent(ranges[idx]));
  showQuiz(ranges[idx]);
}

// --- Reveal & Feedback ---

function reveal() {
  $('btn-reveal').classList.add('hidden');
  $('range-image-container').classList.remove('hidden');
  $('feedback-buttons').classList.remove('hidden');
  // Un-hide feedback buttons (they use flex)
  $('feedback-buttons').style.display = 'flex';
}

function recordResult(knew) {
  if (!currentRange) return;

  const history = getHistory();
  if (!history[currentRange]) {
    history[currentRange] = { correct: 0, wrong: 0 };
  }
  if (knew) {
    history[currentRange].correct++;
  } else {
    history[currentRange].wrong++;
  }
  saveHistory(history);

  // Show result
  $('feedback-buttons').style.display = 'none';
  const msg = $('result-msg');
  msg.classList.remove('hidden', 'knew', 'didnt');
  if (knew) {
    msg.classList.add('knew');
    msg.textContent = 'Bien joué !';
  } else {
    msg.classList.add('didnt');
    msg.textContent = 'Prends le temps de la revoir.';
  }
}

// --- LocalStorage ---

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('range-history') || '{}');
  } catch {
    return {};
  }
}

function saveHistory(history) {
  localStorage.setItem('range-history', JSON.stringify(history));
}

function renderStats() {
  const history = getHistory();
  const entries = Object.values(history);
  if (entries.length === 0) {
    $('stats-summary').innerHTML = '<span class="stat-label">Aucun quiz effectué pour le moment.</span>';
    return;
  }

  const totalCorrect = entries.reduce((s, e) => s + e.correct, 0);
  const totalWrong = entries.reduce((s, e) => s + e.wrong, 0);
  const total = totalCorrect + totalWrong;
  const pct = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  $('stats-summary').innerHTML =
    `<div><span class="stat-label">Ranges étudiées : </span><span class="stat-value">${entries.length} / ${ranges.length}</span></div>` +
    `<div><span class="stat-label">Quiz total : </span><span class="stat-value">${total}</span></div>` +
    `<div><span class="stat-label">Taux de réussite : </span><span class="stat-value">${pct}%</span></div>`;
}

// --- Events ---

$('btn-random').addEventListener('click', pickRandom);
$('btn-reveal').addEventListener('click', reveal);
$('btn-knew').addEventListener('click', () => recordResult(true));
$('btn-didnt').addEventListener('click', () => recordResult(false));
$('btn-back').addEventListener('click', () => {
  window.history.replaceState({}, '', window.location.pathname);
  showHome();
});

// --- Start ---

init();
