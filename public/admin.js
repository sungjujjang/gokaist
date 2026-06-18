const TOKEN_KEY = 'gokaist_admin_token';

let token = localStorage.getItem(TOKEN_KEY);

const loginOverlay = document.getElementById('loginOverlay');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const agentsEl = document.getElementById('agents');
const addForm = document.getElementById('addForm');
const nameInput = document.getElementById('name');
const greatInput = document.getElementById('great');
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');

async function verifyToken() {
  if (!token) return false;
  try {
    const res = await fetch('/api/v1/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: token })
    });
    return res.ok;
  } catch {
    return false;
  }
}

function showAdmin() {
  loginOverlay.style.display = 'none';
  adminContainer.style.display = 'flex';
  loadAgents();
}

function showLogin() {
  token = null;
  localStorage.removeItem(TOKEN_KEY);
  loginOverlay.style.display = 'flex';
  adminContainer.style.display = 'none';
  passwordInput.value = '';
  passwordInput.focus();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = passwordInput.value.trim();
  if (!password) return;

  try {
    const res = await fetch('/api/v1/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      token = password;
      localStorage.setItem(TOKEN_KEY, password);
      loginError.textContent = '';
      showAdmin();
    } else {
      loginError.textContent = '비밀번호가 올바르지 않습니다.';
    }
  } catch {
    loginError.textContent = '서버 연결에 실패했습니다.';
  }
});

logoutBtn.addEventListener('click', showLogin);

async function loadAgents() {
  try {
    const res = await fetch('/api/agents');
    const agents = await res.json();
    agentsEl.innerHTML = agents.map(a => `
      <div class="agent-item">
        <div class="agent-item-content">
          <div class="name">${escapeHtml(a.name)}</div>
          <div class="great">${escapeHtml(a.great)}</div>
        </div>
        <button class="delete-btn" data-name="${escapeHtml(a.name)}">삭제</button>
      </div>
    `).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteAgent(btn.dataset.name));
    });
  } catch {
    agentsEl.innerHTML = '<div class="error">불러오기 실패</div>';
  }
}

async function deleteAgent(name) {
  if (!confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return;

  try {
    const res = await fetch(`/api/v1/admin/ai/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      showMessage('삭제되었습니다.', 'success');
      loadAgents();
    } else if (res.status === 401) {
      showLogin();
    } else {
      showMessage('삭제 실패', 'error');
    }
  } catch {
    showMessage('서버 오류', 'error');
  }
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const great = greatInput.value.trim();
  if (!name || !great) return;

  try {
    const res = await fetch('/api/v1/admin/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, great })
    });

    if (res.ok) {
      showMessage('추가되었습니다.', 'success');
      nameInput.value = '';
      greatInput.value = '';
      loadAgents();
    } else if (res.status === 401) {
      showLogin();
    } else {
      showMessage('추가 실패', 'error');
    }
  } catch {
    showMessage('서버 오류', 'error');
  }
});

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'admin-message ' + type;
  setTimeout(() => { messageEl.textContent = ''; }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

verifyToken().then(valid => {
  if (valid) {
    showAdmin();
  } else {
    showLogin();
  }
});
