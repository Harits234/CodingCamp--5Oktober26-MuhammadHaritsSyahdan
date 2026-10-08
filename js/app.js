'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function pad(n) {
  return String(n).padStart(2, '0');
}

/* ============================================================
   0. THEME TOGGLE  (dark / light)
   ============================================================ */
const THEME_KEY = 'dashboard_theme';
const themeToggleBtn = $('#theme-toggle');
const themeIconEl = themeToggleBtn.querySelector('.theme-icon');

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeIconEl.textContent = '☀️';
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeIconEl.textContent = '🌙';
    themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

initTheme();

/* ============================================================
   1. GREETING & LIVE CLOCK
   ============================================================ */
const greetingEl = $('#greeting');
const clockEl = $('#current-time');
const dateEl = $('#current-date');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;

  clockEl.textContent = `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`;
  greetingEl.textContent = getGreeting(h);
  dateEl.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   2. FOCUS TIMER  (with configurable duration)
   ============================================================ */
const TIMER_DURATION_KEY = 'dashboard_timer_minutes';
const DEFAULT_MINUTES = 25;

function getSavedMinutes() {
  const v = parseInt(localStorage.getItem(TIMER_DURATION_KEY), 10);
  return v >= 1 && v <= 180 ? v : DEFAULT_MINUTES;
}

let workSeconds = getSavedMinutes() * 60; // total session seconds (changes with setting)

const timerDisplayEl = $('#timer-display');
const timerLabelEl = $('#timer-label');
const startBtn = $('#timer-start');
const stopBtn = $('#timer-stop');
const resetBtn = $('#timer-reset');

// Build SVG ring programmatically so the radius math is self-contained
(function buildTimerRing() {
  const card = $('.timer-card');
  const titleEl = card.querySelector('.card-title');

  const wrap = document.createElement('div');
  wrap.className = 'timer-ring-wrap';

  const R = 80;
  const C = 2 * Math.PI * R;
  const cx = 90;

  wrap.innerHTML = `
    <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
      <circle class="timer-ring-bg" cx="${cx}" cy="${cx}" r="${R}" />
      <circle class="timer-ring-progress" id="timer-ring"
              cx="${cx}" cy="${cx}" r="${R}"
              stroke-dasharray="${C}"
              stroke-dashoffset="0" />
    </svg>
    <div class="timer-center-text">
      <span id="timer-display-inner"></span>
    </div>`;

  // Insert ring between title and the original display placeholder
  card.insertBefore(wrap, timerDisplayEl);

  // We'll use the inner span as our display
  const inner = $('#timer-display-inner');
  inner.style.cssText = 'font-size:clamp(2rem,5vw,2.8rem);font-weight:700;font-variant-numeric:tabular-nums;color:var(--text-1);transition:color .3s;';

  // Hide original placeholder (kept for fallback / non-JS reference)
  timerDisplayEl.style.display = 'none';

  window._timerRing = {
    el: $('#timer-ring'),
    inner,
    circumference: C,
  };
})();

let timerInterval = null;
let secondsLeft = workSeconds;
let timerRunning = false;

function formatTime(s) {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

function updateTimerUI() {
  const { el, inner, circumference } = window._timerRing;
  const progress = secondsLeft / workSeconds;
  const offset = circumference * (1 - progress);
  const timeStr = formatTime(secondsLeft);

  inner.textContent = timeStr;
  timerDisplayEl.textContent = timeStr; // keep fallback in sync
  el.style.strokeDashoffset = offset;

  // Colour states
  const isRunning = timerRunning;
  const isDanger = secondsLeft <= 60 && timerRunning;

  inner.style.color = isDanger ? 'var(--danger)' : isRunning ? 'var(--success)' : 'var(--text-1)';

  ['running', 'danger'].forEach((c) => {
    el.classList.remove(c);
  });
  if (isDanger) el.classList.add('danger');
  else if (isRunning) el.classList.add('running');

  // Label
  if (!timerRunning && secondsLeft === workSeconds) {
    timerLabelEl.textContent = 'Ready to focus?';
  } else if (timerRunning && isDanger) {
    timerLabelEl.textContent = 'Almost done!';
  } else if (timerRunning) {
    timerLabelEl.textContent = 'Stay focused';
  } else if (secondsLeft === 0) {
    timerLabelEl.textContent = 'Session complete!';
  } else {
    timerLabelEl.textContent = 'Paused';
  }
}

function timerTick() {
  if (secondsLeft <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    secondsLeft = 0;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateTimerUI();
    return;
  }
  secondsLeft--;
  updateTimerUI();
}

startBtn.addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  timerInterval = setInterval(timerTick, 1000);
  updateTimerUI();
});

stopBtn.addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  updateTimerUI();
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  secondsLeft = workSeconds;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  updateTimerUI();
});

updateTimerUI();

/* ---- Preset & custom duration controls ---- */
const presetBtns = $$('.btn-preset');
const timerCustomInput = $('#timer-custom-input');
const timerCustomSet = $('#timer-custom-set');

function setTimerDuration(minutes) {
  if (timerRunning) return; // don't change while running
  const mins = Math.max(1, Math.min(180, minutes));
  workSeconds = mins * 60;
  secondsLeft = workSeconds;
  localStorage.setItem(TIMER_DURATION_KEY, mins);

  // sync active state on preset buttons
  presetBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.minutes) === mins));
  startBtn.disabled = false;
  stopBtn.disabled = true;
  updateTimerUI();
}

function syncPresetHighlight() {
  const saved = getSavedMinutes();
  presetBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.minutes) === saved));
}

presetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    setTimerDuration(Number(btn.dataset.minutes));
    timerCustomInput.value = '';
  });
});

timerCustomSet.addEventListener('click', () => {
  const val = parseInt(timerCustomInput.value, 10);
  if (!val || val < 1 || val > 180) {
    timerCustomInput.focus();
    timerCustomInput.classList.add('input-error');
    setTimeout(() => timerCustomInput.classList.remove('input-error'), 1200);
    return;
  }
  setTimerDuration(val);
  timerCustomInput.value = '';
});

timerCustomInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') timerCustomSet.click();
});

syncPresetHighlight();

/* ============================================================
   3. TO-DO LIST
   ============================================================ */
const todoInput = $('#todo-input');
const todoAddBtn = $('#todo-add');
const todoListEl = $('#todo-list');
const todoErrorEl = $('#todo-error');

const TODOS_KEY = 'dashboard_todos';

let todoErrorTimer = null;

function showTodoError(msg) {
  todoErrorEl.textContent = '⚠️ ' + msg;
  todoErrorEl.classList.add('visible');
  todoInput.classList.add('input-error');
  clearTimeout(todoErrorTimer);
  todoErrorTimer = setTimeout(() => {
    todoErrorEl.classList.remove('visible');
    todoInput.classList.remove('input-error');
  }, 2500);
}

function clearTodoError() {
  clearTimeout(todoErrorTimer);
  todoErrorEl.classList.remove('visible');
  todoInput.classList.remove('input-error');
}

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(TODOS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

function renderTodos() {
  const todos = loadTodos();
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    todoListEl.innerHTML = '<li class="todo-empty">No tasks yet. Add one above!</li>';
    return;
  }

  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.idx = idx;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" aria-label="Mark done" ${todo.done ? 'checked' : ''} />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn btn-icon btn-ghost" data-action="edit"   aria-label="Edit task">✏️</button>
        <button class="btn btn-icon btn-danger" data-action="delete" aria-label="Delete task">🗑️</button>
      </div>`;

    todoListEl.appendChild(li);
  });
}

function addTodo(text) {
  const t = text.trim();
  if (!t) return false;

  const todos = loadTodos();

  // Duplicate check — case-insensitive comparison
  const isDuplicate = todos.some((todo) => todo.text.toLowerCase() === t.toLowerCase());

  if (isDuplicate) {
    showTodoError('Task already exists!');
    todoInput.focus();
    return false;
  }

  clearTodoError();
  todos.push({ text: t, done: false });
  saveTodos(todos);
  renderTodos();
  return true;
}

function toggleTodo(idx) {
  const todos = loadTodos();
  if (!todos[idx]) return;
  todos[idx].done = !todos[idx].done;
  saveTodos(todos);
  renderTodos();
}

function deleteTodo(idx) {
  const todos = loadTodos();
  todos.splice(idx, 1);
  saveTodos(todos);
  renderTodos();
}

function editTodo(idx) {
  const todos = loadTodos();
  if (!todos[idx]) return;
  openEditModal(todos[idx].text, (newText) => {
    const t = newText.trim();
    // Duplicate check — ignore if the text hasn't changed
    const isDuplicate = todos.some((todo, i) => i !== idx && todo.text.toLowerCase() === t.toLowerCase());
    if (isDuplicate) {
      showTodoError('A task with that name already exists!');
      return;
    }
    todos[idx].text = t;
    saveTodos(todos);
    renderTodos();
  });
}

// Add button / Enter key
todoAddBtn.addEventListener('click', () => {
  const ok = addTodo(todoInput.value);
  if (ok) {
    todoInput.value = '';
    todoInput.focus();
  }
});

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const ok = addTodo(todoInput.value);
    if (ok) todoInput.value = '';
  }
});

// Clear error as soon as the user starts typing again
todoInput.addEventListener('input', () => {
  if (todoErrorEl.classList.contains('visible')) clearTodoError();
});

// Delegated events on the list
todoListEl.addEventListener('click', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  const idx = Number(item.dataset.idx);

  if (e.target.classList.contains('todo-checkbox')) {
    toggleTodo(idx);
    return;
  }

  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'edit') editTodo(idx);
  if (action === 'delete') deleteTodo(idx);
});

renderTodos();

/* ============================================================
   4. QUICK LINKS
   ============================================================ */
const linkNameInput = $('#link-name-input');
const linkUrlInput = $('#link-url-input');
const linkAddBtn = $('#link-add');
const linksGridEl = $('#links-grid');

const LINKS_KEY = 'dashboard_links';

function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem(LINKS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLinks(links) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

function normaliseUrl(url) {
  const u = url.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return 'https://' + u;
}

function getFaviconUrl(href) {
  try {
    const url = new URL(href);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
  } catch {
    return '';
  }
}

function renderLinks() {
  const links = loadLinks();
  linksGridEl.innerHTML = '';

  if (links.length === 0) {
    linksGridEl.innerHTML = '<p class="links-empty">No links saved yet.</p>';
    return;
  }

  links.forEach((link, idx) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';
    chip.dataset.idx = idx;

    const favicon = getFaviconUrl(link.url);
    chip.innerHTML = `
      ${favicon ? `<img class="favicon" src="${escapeHtml(favicon)}" alt="" aria-hidden="true" onerror="this.style.display='none'" />` : ''}
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name)}</a>
      <button class="link-remove" data-idx="${idx}" aria-label="Remove link ${escapeHtml(link.name)}">✕</button>`;

    linksGridEl.appendChild(chip);
  });
}

function addLink(name, url) {
  const n = name.trim();
  const u = normaliseUrl(url);
  if (!n || !u) return false;

  // Basic URL validation
  try {
    new URL(u);
  } catch {
    return false;
  }

  const links = loadLinks();
  links.push({ name: n, url: u });
  saveLinks(links);
  renderLinks();
  return true;
}

function removeLink(idx) {
  const links = loadLinks();
  links.splice(idx, 1);
  saveLinks(links);
  renderLinks();
}

linkAddBtn.addEventListener('click', () => {
  const ok = addLink(linkNameInput.value, linkUrlInput.value);
  if (ok) {
    linkNameInput.value = '';
    linkUrlInput.value = '';
    linkNameInput.focus();
  } else {
    linkUrlInput.focus();
    linkUrlInput.classList.add('error-shake');
    linkUrlInput.addEventListener('animationend', () => linkUrlInput.classList.remove('error-shake'), { once: true });
  }
});

linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') linkAddBtn.click();
});

linksGridEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.link-remove');
  if (!btn) return;
  removeLink(Number(btn.dataset.idx));
});

renderLinks();

/* ============================================================
   5. EDIT MODAL
   ============================================================ */
const editModal = $('#edit-modal');
const editInput = $('#edit-input');
const modalSaveBtn = $('#modal-save');
const modalCancelBtn = $('#modal-cancel');

let _onModalSave = null;

function openEditModal(currentText, onSave) {
  editInput.value = currentText;
  _onModalSave = onSave;
  editModal.classList.add('open');
  setTimeout(() => editInput.focus(), 50);
}

function closeEditModal() {
  editModal.classList.remove('open');
  _onModalSave = null;
}

modalSaveBtn.addEventListener('click', () => {
  const val = editInput.value.trim();
  if (!val) return;
  if (_onModalSave) _onModalSave(val);
  closeEditModal();
});

modalCancelBtn.addEventListener('click', closeEditModal);

editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') modalSaveBtn.click();
  if (e.key === 'Escape') closeEditModal();
});

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

/* ============================================================
   HELPERS
   ============================================================ */
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
