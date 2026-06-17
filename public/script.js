const messagesEl = document.getElementById('messages');
const searchForm = document.getElementById('searchForm');
const queryInput = document.getElementById('query');
const agentsEl = document.getElementById('agents');

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

function addMessage(text, role, result) {
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
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  addMessage(query, 'user');
  queryInput.value = '';

  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'message assistant';
  loadingMsg.innerHTML = '<div class="avatar">G</div><div class="bubble">생각하는 중...</div>';
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
