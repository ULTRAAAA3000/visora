const api = typeof browser !== 'undefined' ? browser : chrome;

const DEFAULTS = {
  appUrl: 'https://visor-a.com',
  apiUrl: 'https://api.visor-a.com',
};

const el = (id) => document.getElementById(id);

let state = {
  apiKey: null,
  appUrl: DEFAULTS.appUrl,
  apiUrl: DEFAULTS.apiUrl,
  templates: [],
  pendingSelection: null,
};

async function getStorage() {
  const stored = await api.storage.local.get(['apiKey', 'appUrl', 'apiUrl', 'pendingSelection']);
  return {
    apiKey: stored.apiKey ?? null,
    appUrl: stored.appUrl || DEFAULTS.appUrl,
    apiUrl: stored.apiUrl || DEFAULTS.apiUrl,
    pendingSelection: stored.pendingSelection ?? null,
  };
}

async function init() {
  state = { ...state, ...(await getStorage()) };

  el('app-url-input').value = state.appUrl;
  el('api-url-input').value = state.apiUrl;
  el('get-key-link').href = `${state.appUrl.replace(/\/$/, '')}/dashboard`;

  el('loading-msg').classList.add('hidden');

  if (!state.apiKey) {
    el('view-connect').classList.remove('hidden');
    return;
  }

  el('view-render').classList.remove('hidden');
  await loadTemplates();

  // Clear the one-shot selection now that it's been consumed, so a
  // future popup open (without a fresh context-menu click) doesn't
  // reuse stale text.
  if (state.pendingSelection) {
    api.storage.local.remove('pendingSelection');
  }
}

async function loadTemplates() {
  try {
    const res = await fetch(`${state.apiUrl.replace(/\/$/, '')}/api/v1/templates`, {
      headers: { Authorization: `Bearer ${state.apiKey}` },
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.error || `HTTP ${res.status}`);

    state.templates = body.data;
    const select = el('template-select');
    select.innerHTML = state.templates
      .map((t) => `<option value="${t.id}">${t.title}${t.is_preset ? '' : ' (yours)'}</option>`)
      .join('');

    renderFields();
  } catch (err) {
    showError(`Couldn't load templates: ${err.message}`);
  }
}

function renderFields() {
  const templateId = el('template-select').value;
  const template = state.templates.find((t) => t.id === templateId);
  const container = el('fields-container');
  container.innerHTML = '';
  if (!template) return;

  const vars = template.default_variables || {};
  const keys = Object.keys(vars);

  keys.forEach((key, index) => {
    const label = document.createElement('label');
    label.textContent = key;
    label.setAttribute('for', `field-${key}`);

    const input = document.createElement('input');
    input.id = `field-${key}`;
    input.dataset.key = key;
    // Prefill the first field with whatever text was selected via the
    // right-click "Render with Visora" context menu, if any.
    input.value = index === 0 && state.pendingSelection ? state.pendingSelection : vars[key] ?? '';

    container.appendChild(label);
    container.appendChild(input);
  });
}

async function handleRender() {
  const templateId = el('template-select').value;
  const format = el('format-select').value;
  const data = {};
  document.querySelectorAll('#fields-container input').forEach((input) => {
    data[input.dataset.key] = input.value;
  });

  const btn = el('render-btn');
  btn.disabled = true;
  btn.textContent = 'Rendering…';
  hideError();
  el('result').classList.add('hidden');

  try {
    const res = await fetch(`${state.apiUrl.replace(/\/$/, '')}/api/v1/render`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${state.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ template_id: templateId, format, cache: true, data }),
    });
    const body = await res.json();
    if (!res.ok || !body.success || !body.data?.url) {
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    el('result-img').src = body.data.url;
    el('open-img-link').href = body.data.url;
    el('result').dataset.url = body.data.url;
    el('result').classList.remove('hidden');
  } catch (err) {
    showError(`Render failed: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Render';
  }
}

function showError(message) {
  const p = el('error-msg');
  p.textContent = message;
  p.classList.remove('hidden');
}
function hideError() {
  el('error-msg').classList.add('hidden');
}

async function handleSaveKey() {
  const value = el('api-key-input').value.trim();
  if (!value) return;

  // Validate before storing — catches typos/paste mistakes immediately
  // instead of failing silently on the first render attempt.
  const btn = el('save-key-btn');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  try {
    const res = await fetch(`${state.apiUrl.replace(/\/$/, '')}/api/v1/whoami`, {
      headers: { Authorization: `Bearer ${value}` },
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.error || 'Invalid API key.');

    await api.storage.local.set({ apiKey: value });
    state.apiKey = value;
    el('view-connect').classList.add('hidden');
    el('view-render').classList.remove('hidden');
    await loadTemplates();
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Connect';
  }
}

async function handleDisconnect() {
  await api.storage.local.remove('apiKey');
  state.apiKey = null;
  el('view-render').classList.add('hidden');
  el('view-connect').classList.remove('hidden');
}

async function handleSaveSettings() {
  const appUrl = el('app-url-input').value.trim() || DEFAULTS.appUrl;
  const apiUrl = el('api-url-input').value.trim() || DEFAULTS.apiUrl;

  // MV3 needs explicit permission for origins outside the manifest's
  // declared host_permissions — matters once someone points this at a
  // custom domain post-migration instead of *.workers.dev/*.pages.dev.
  try {
    const origin = new URL(apiUrl).origin + '/*';
    const granted = await api.permissions.request({ origins: [origin] });
    if (!granted) {
      showError('Permission for that URL was not granted — settings not saved.');
      return;
    }
  } catch {
    showError('That doesn\'t look like a valid URL.');
    return;
  }

  await api.storage.local.set({ appUrl, apiUrl });
  state.appUrl = appUrl;
  state.apiUrl = apiUrl;
  el('get-key-link').href = `${appUrl.replace(/\/$/, '')}/dashboard`;
  if (state.apiKey) await loadTemplates();
}

el('save-key-btn').addEventListener('click', handleSaveKey);
el('disconnect-btn').addEventListener('click', handleDisconnect);
el('template-select').addEventListener('change', renderFields);
el('render-btn').addEventListener('click', handleRender);
el('save-settings-btn').addEventListener('click', handleSaveSettings);
el('copy-url-btn').addEventListener('click', () => {
  const url = el('result').dataset.url;
  if (url) navigator.clipboard.writeText(url);
});

init();
