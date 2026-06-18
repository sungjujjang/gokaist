const messagesEl = document.getElementById('messages');
const searchForm = document.getElementById('searchForm');
const queryInput = document.getElementById('query');
const agentsEl = document.getElementById('agents');
const resetBtn = document.getElementById('resetChat');

const STORAGE_KEY = 'searchai_chat_history';

function saveHistory() {
  const items = [];
  messagesEl.querySelectorAll('.message').forEach(el => {
    const role = el.classList.contains('user') ? 'user' : 'assistant';
    const bubble = el.querySelector('.bubble');
    const resultCard = bubble?.querySelector('.result-card');
    if (resultCard) {
      const name = resultCard.querySelector('h3')?.textContent || '';
      const reason = resultCard.querySelectorAll('p')[0]?.textContent.replace('추천 이유', '') || '';
      const tip = resultCard.querySelectorAll('p')[1]?.textContent.replace('사용 팁', '') || '';
      items.push({ text: '', role, result: { name, reason, tip } });
    } else {
      items.push({ text: bubble?.textContent || '', role, result: null });
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function restoreHistory() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const items = JSON.parse(saved);
    items.forEach(item => {
      if (item.result) {
        addMessage('', item.role, item.result, false);
      } else {
        addMessage(item.text, item.role, null, false);
      }
    });
  } catch {}
}

async function loadAgents() {
  try {
    const res = await fetch('/api/agents');
    const agents = await res.json();
    agentsEl.innerHTML = agents.map(a => `
      <div class="agent-item">
        <div class="name">${escapeHtml(a.name)}</div>
        <div class="great">${escapeHtml(a.great)}</div>
      </div>
    `).join('');
  } catch {
    agentsEl.innerHTML = '<div class="error">불러오기 실패</div>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addMessage(text, role, result, save = true) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'assistant' ? 'G' : 'U';
  div.appendChild(avatar);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (result) {
    bubble.innerHTML = `
      <div class="result-card">
        <h3>${escapeHtml(result.name)}</h3>
        <p><span class="label">추천 이유</span><br>${escapeHtml(result.reason)}</p>
        <p><span class="label">사용 팁</span><br>${escapeHtml(result.tip)}</p>
      </div>
    `;
  } else {
    bubble.textContent = text;
  }

  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  if (save) saveHistory();
}

resetBtn.addEventListener('click', () => {
  if (!confirm('채팅 내역을 초기화하시겠습니까?')) return;
  messagesEl.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);
});

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  addMessage(query, 'user');
  queryInput.value = '';

  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'message assistant loading';
  loadingMsg.innerHTML = '<div class="avatar">G</div><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  messagesEl.appendChild(loadingMsg);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const res = await fetch('/api/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) throw new Error('API error');

    const result = await res.json();
    loadingMsg.remove();
    addMessage('', 'assistant', result);
  } catch {
    loadingMsg.remove();
    addMessage('죄송합니다. 요청을 처리할 수 없습니다. 다시 시도해주세요.', 'assistant');
  }
});

loadAgents();
restoreHistory();
