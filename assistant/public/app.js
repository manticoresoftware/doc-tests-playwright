// --- Configuration ---
const API_BASE = '';
const SESSION_KEY = 'manticore-assistant-session';

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// --- Markdown setup ---
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
});

// --- DOM Elements ---
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const btnRunAll = document.getElementById('btn-run-all');
const btnRefresh = document.getElementById('btn-refresh');
const testList = document.getElementById('test-list');
const gitStatus = document.getElementById('git-status');
const testOutput = document.getElementById('test-output');
const testOutputContent = document.getElementById('test-output-content');
const btnCloseOutput = document.getElementById('btn-close-output');

let isStreaming = false;

// --- Theme ---
const THEME_KEY = 'manticore-assistant-theme';
const btnTheme = document.getElementById('btn-theme');
const hljsThemeLink = document.getElementById('hljs-theme');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  btnTheme.textContent = theme === 'dark' ? '\u263E' : '\u2600';
  hljsThemeLink.href = theme === 'dark'
    ? 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github-dark.min.css'
    : 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github.min.css';
  localStorage.setItem(THEME_KEY, theme);
}

btnTheme.addEventListener('click', () => {
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  loadTests();
  loadGitStatus();
});

// --- Chat ---
btnSend.addEventListener('click', () => sendMessage());

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
});

async function sendMessage(text) {
  const message = text || chatInput.value.trim();
  if (!message || isStreaming) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Add user message
  appendMessage(message, 'user-msg');

  // Create assistant message container
  const msgEl = appendMessage('', 'assistant-msg');
  const contentEl = msgEl.querySelector('.message-content');

  isStreaming = true;
  btnSend.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: getSessionId(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);
          handleSSEEvent(event, contentEl, fullText, (t) => { fullText = t; });
        } catch {
          // skip malformed events
        }
      }
    }

    // Final render with full markdown
    if (fullText) {
      contentEl.innerHTML = marked.parse(fullText);
      highlightAllCode(contentEl);
    }
  } catch (err) {
    contentEl.innerHTML = `<p style="color: var(--error)">Error: ${err.message}</p>`;
  }

  isStreaming = false;
  btnSend.disabled = false;
  scrollToBottom();

  // Refresh sidebar after potential changes
  loadTests();
  loadGitStatus();
}

function handleSSEEvent(event, contentEl, fullText, setFullText) {
  switch (event.type) {
    case 'text_delta':
      fullText += event.content;
      setFullText(fullText);
      // Render incrementally
      contentEl.innerHTML = marked.parse(fullText);
      highlightAllCode(contentEl);
      scrollToBottom();
      break;

    case 'tool_call':
      appendToolIndicator(contentEl, event.name, event.input);
      scrollToBottom();
      break;

    case 'tool_result':
      updateToolIndicator(contentEl, event.name, event.result);
      scrollToBottom();
      break;

    case 'error':
      contentEl.innerHTML += `<p style="color: var(--error)">Error: ${event.message}</p>`;
      break;
  }
}

function appendMessage(text, className) {
  const div = document.createElement('div');
  div.className = `message ${className}`;

  const content = document.createElement('div');
  content.className = 'message-content';

  if (className === 'user-msg') {
    content.textContent = text;
  } else {
    content.innerHTML = text ? marked.parse(text) : '';
  }

  div.appendChild(content);
  chatMessages.appendChild(div);
  scrollToBottom();
  return div;
}

function appendToolIndicator(containerEl, toolName, input) {
  const indicator = document.createElement('div');
  indicator.className = 'tool-indicator';
  indicator.dataset.toolName = toolName;

  const inputPreview = typeof input === 'object'
    ? Object.entries(input).map(([k, v]) => {
        const val = typeof v === 'string' && v.length > 60 ? v.substring(0, 60) + '...' : v;
        return `${k}: ${val}`;
      }).join(', ')
    : '';

  indicator.innerHTML = `
    <div class="tool-indicator-header" onclick="this.nextElementSibling.classList.toggle('open')">
      <span class="tool-icon">&#9881;</span>
      <span class="tool-name">${toolName}</span>
      <span class="tool-status running"><span class="spinner"></span></span>
    </div>
    <div class="tool-detail">${inputPreview ? 'Input: ' + escapeHtml(inputPreview) + '\n\nRunning...' : 'Running...'}</div>
  `;

  containerEl.appendChild(indicator);
}

function updateToolIndicator(containerEl, toolName, result) {
  const indicators = containerEl.querySelectorAll(`.tool-indicator[data-tool-name="${toolName}"]`);
  const indicator = indicators[indicators.length - 1];
  if (!indicator) return;

  const status = indicator.querySelector('.tool-status');
  status.className = 'tool-status done';
  status.textContent = 'done';

  const detail = indicator.querySelector('.tool-detail');
  detail.textContent = result;
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function highlightAllCode(el) {
  el.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
    hljs.highlightElement(block);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Sidebar: Tests ---
async function loadTests() {
  try {
    const res = await fetch(`${API_BASE}/api/tests`);
    const tests = await res.json();
    renderTestList(tests);
  } catch {
    testList.textContent = 'Failed to load';
  }
}

function renderTestList(tests) {
  testList.innerHTML = '';
  for (const group of tests) {
    const fileEl = document.createElement('div');
    fileEl.className = 'test-file';

    const fileName = group.file.replace('tests/', '');
    const testCount = group.tests.length;

    fileEl.innerHTML = `
      <div class="test-file-name" onclick="toggleTests(this)">
        <span class="arrow">&#9654;</span>
        ${escapeHtml(fileName)} <span style="color: var(--text-muted)">(${testCount})</span>
      </div>
      <div class="test-names">
        ${group.tests.map((t) => `<div class="test-name" title="${escapeHtml(t)}">${escapeHtml(t)}</div>`).join('')}
      </div>
    `;

    testList.appendChild(fileEl);
  }
}

function toggleTests(el) {
  const arrow = el.querySelector('.arrow');
  const names = el.nextElementSibling;
  arrow.classList.toggle('open');
  names.classList.toggle('open');
}

// --- Sidebar: Git ---
async function loadGitStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/git/status`);
    const data = await res.json();
    const lines = data.output.split('\n');
    const branch = lines[0]?.replace('Branch: ', '') || 'unknown';
    const status = lines.slice(2).join('\n') || '(clean)';
    gitStatus.innerHTML = `<span class="branch">${escapeHtml(branch)}</span>\n${escapeHtml(status)}`;
  } catch {
    gitStatus.textContent = 'Failed to load';
  }
}

// --- Sidebar: Run All ---
btnRunAll.addEventListener('click', () => {
  runTestsInPanel();
});

btnRefresh.addEventListener('click', () => {
  loadTests();
  loadGitStatus();
});

btnCloseOutput.addEventListener('click', () => {
  testOutput.classList.add('hidden');
});

async function runTestsInPanel(file, grep) {
  testOutput.classList.remove('hidden');
  testOutputContent.textContent = 'Starting tests...\n';

  try {
    const res = await fetch(`${API_BASE}/api/tests/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, grep }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'output') {
            testOutputContent.textContent += event.content;
          } else if (event.type === 'done') {
            testOutputContent.textContent += `\n--- Exit code: ${event.code} ---`;
          }
          testOutputContent.scrollTop = testOutputContent.scrollHeight;
        } catch {
          // skip
        }
      }
    }
  } catch (err) {
    testOutputContent.textContent += `\nError: ${err.message}`;
  }

  loadTests();
}

// --- Quick Actions ---
document.querySelectorAll('.quick-action').forEach((btn) => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (prompt) sendMessage(prompt);
  });
});

// Make toggleTests globally accessible
window.toggleTests = toggleTests;
