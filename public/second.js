const STORAGE_KEY = 'searchai_card_history';
const PERSONA_KEY = 'searchai_persona';
let currentIndex = -1;

const searchForm = document.getElementById('searchForm');
const queryInput = document.getElementById('query');
const cardDisplay = document.getElementById('cardDisplay');
const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');
const clearBtn = document.getElementById('clearBtn');
const personaToggle = document.getElementById('personaToggle');
const personaPanel = document.getElementById('personaPanel');
const personaJob = document.getElementById('personaJob');
const personaAge = document.getElementById('personaAge');
const personaInterest = document.getElementById('personaInterest');

function savePersona() {
  const data = {
    job: personaJob.value.trim(),
    age: personaAge.value.trim(),
    interest: personaInterest.value.trim()
  };
  localStorage.setItem(PERSONA_KEY, JSON.stringify(data));
}

function loadPersona() {
  try {
    const raw = localStorage.getItem(PERSONA_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.job) personaJob.value = data.job;
    if (data.age) personaAge.value = data.age;
    if (data.interest) personaInterest.value = data.interest;
  } catch {}
}

personaJob.addEventListener('input', savePersona);
personaAge.addEventListener('input', savePersona);
personaInterest.addEventListener('input', savePersona);

personaToggle.addEventListener('click', () => {
  const open = personaPanel.classList.toggle('is-visible');
  personaToggle.classList.toggle('is-open');
  if (open) setTimeout(() => personaJob.focus(), 100);
});

function getPersona() {
  const parts = [];
  const job = personaJob.value.trim();
  const age = personaAge.value.trim();
  const interest = personaInterest.value.trim();
  if (job) parts.push(`직업: ${job}`);
  if (age) parts.push(`나이: ${age}`);
  if (interest) parts.push(`관심 분야: ${interest}`);
  return parts.join(', ');
}

function formatPersona(job, age, interest) {
  const parts = [];
  if (job) parts.push(`직업: ${job}`);
  if (age) parts.push(`나이: ${age}`);
  if (interest) parts.push(`관심: ${interest}`);
  return parts.join(' | ');
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function addHistory(query, name, reason, tip, job, age, interest) {
  const items = getHistory();
  items.unshift({
    query, name, reason, tip,
    job: job || '', age: age || '', interest: interest || '',
    time: new Date().toISOString()
  });
  saveHistory(items);
renderAll();
loadPersona();
  showCard(0);
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderHistory() {
  const items = getHistory();
  if (items.length === 0) {
    historyList.innerHTML = '';
    emptyHistory.style.display = 'flex';
    return;
  }
  emptyHistory.style.display = 'none';
  historyList.innerHTML = items.map((item, i) => `
    <div class="sidebar-item${i === currentIndex ? ' is-active' : ''}" data-index="${i}">
      <div class="sidebar-item-name">${escapeHtml(item.name)}</div>
      ${item.query ? `<div class="sidebar-item-query">${escapeHtml(item.query)}</div>` : ''}
      <div class="sidebar-item-time">${formatTime(item.time)}</div>
    </div>
  `).join('');

  historyList.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', () => showCard(parseInt(el.dataset.index)));
  });
}

function showCard(index) {
  const items = getHistory();
  if (!items[index]) return;

  currentIndex = index;
  const item = items[index];

  let html = `<div class="card">
    <div class="card-header">
      <div class="card-icon">${escapeHtml(item.name[0] || '?')}</div>
      <div class="card-meta">
        <div class="card-name">${escapeHtml(item.name)}</div>
        ${item.query ? `<div class="card-query">${escapeHtml(item.query)}</div>` : ''}
        ${item.job || item.age || item.interest ? `<div class="card-persona">${escapeHtml(formatPersona(item.job, item.age, item.interest))}</div>` : ''}
      </div>
    </div>
    <div class="card-body">
      <div class="card-section">
        <span class="label">추천 이유</span>
        <p>${escapeHtml(item.reason)}</p>
      </div>
      <div class="card-section">
        <span class="label">사용 팁</span>
        <p>${escapeHtml(item.tip)}</p>
      </div>
    </div>
  </div>`;

  cardDisplay.innerHTML = html;
  renderHistory();
}

clearBtn.addEventListener('click', () => {
  if (!confirm('모든 기록을 지우시겠습니까?')) return;
  localStorage.removeItem(STORAGE_KEY);
  currentIndex = -1;
  cardDisplay.innerHTML = `
    <div class="empty-well">
      <div class="empty-mark">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <h3>도구를 찾아보세요</h3>
      <p>검색어를 입력하면 추천 결과를 카드로 보여드려요</p>
    </div>
  `;
  renderHistory();
});

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  const q = query;
  const job = personaJob.value.trim();
  const age = personaAge.value.trim();
  const interest = personaInterest.value.trim();
  const persona = getPersona();
  queryInput.value = '';

  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);

  try {
    const body = { query };
    if (persona) body.persona = persona;

    const res = await fetch('/api/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('API error');

    const result = await res.json();
    addHistory(q, result.name, result.reason, result.tip, job, age, interest);
  } catch {
    alert('검색 중 오류가 발생했습니다.');
  } finally {
    overlay.remove();
  }
});

function renderAll() {
  renderHistory();
}

renderAll();
