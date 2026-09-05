'use strict';

const $ = (id) => document.getElementById(id);
const MAX_FILE = 20 * 1024;
const encoder = new TextEncoder();
let state = null;
let busy = false;
let shownPendingId = null;
let token = '';
try {
  const params = new URLSearchParams(location.hash.slice(1));
  token = params.get('token') || sessionStorage.getItem('domino-token') || '';
  if (params.has('token')) {
    sessionStorage.setItem('domino-token', token);
    history.replaceState(null, '', location.pathname + location.search);
  }
} catch { /* A blocked session store can still use the current fragment token. */ }

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function showError(error, target = 'error-banner') {
  const box = $(target);
  box.textContent = errorMessage(error);
  box.hidden = false;
}

function clearErrors() {
  for (const id of ['error-banner', 'intake-error']) {
    $(id).hidden = true;
    $(id).textContent = '';
  }
}

async function api(path, { method = 'GET', body, raw = false } = {}) {
  if (!token) throw new Error('Open the private workspace link printed by the local server. Its access token is missing from this tab.');
  const headers = { 'X-Domino-Token': token };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'same-origin' });
  } catch { throw new Error('The local workspace is unreachable. Check that its server is running on this Mac, then reload this page.'); }
  if (!response.ok) {
    let reason = `The workspace returned ${response.status}.`;
    try {
      const data = await response.json();
      reason = typeof data.error === 'string' ? data.error : data.error?.message || data.message || reason;
    } catch { /* Never show an untrusted HTML response as markup. */ }
    if (response.status === 401 || response.status === 403) reason += ' Reopen the private workspace link from the server if this tab has an old token.';
    throw new Error(reason);
  }
  return raw ? response : response.json();
}

function setBusy(value, label = '') {
  busy = value;
  $('activity').textContent = value ? label : 'Your conversation stays in this workspace.';
  $('chat-form').setAttribute('aria-busy', String(value));
  for (const id of ['open-intake', 'upload-context', 'clear-chat', 'submit-intake', 'upload-draft', 'refresh-model']) $(id).disabled = value;
  $('send-chat').disabled = value || state?.model?.available === false;
  $('chat-input').disabled = value;
  $('run-preflight').disabled = value || !state?.project;
  $('export-document').disabled = value || !state?.project;
  $('check-source').disabled = value || !$('retrieval-consent').checked || !state?.project;
  $('confirm-pending').disabled = value || !state?.pending || $('confirmation-input').value !== state.pending.confirmation;
  document.querySelectorAll('.doc-delete,.doc-open,[data-prompt]').forEach((node) => { node.disabled = value; });
}

async function action(label, work, errorTarget = 'error-banner') {
  if (busy) return;
  clearErrors();
  setBusy(true, label);
  try { await work(); } catch (error) { showError(error, errorTarget); }
  finally { setBusy(false); }
}

function acceptState(value) {
  state = value.state || value;
  render();
}

function readable(value) {
  if (value === null || value === undefined) return 'Not available';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(readable).join('\n');
  return Object.entries(value).map(([key, item]) => `${humanLabel(key)}: ${key.endsWith('Cents') && Number.isSafeInteger(item) ? usd(item) : readable(item)}`).join('\n');
}

function usd(cents) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100); }

function humanLabel(key) {
  return key.replace(/Cents$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, (char) => char.toUpperCase());
}

function renderMessages() {
  const messages = $('messages');
  const entries = state.messages || [];
  if (!entries.length) {
    messages.querySelectorAll('.message').forEach((node) => node.remove());
    $('welcome').hidden = false;
    return;
  }
  $('welcome').hidden = true;
  messages.querySelectorAll('.message').forEach((node) => node.remove());
  for (const entry of entries) {
    const article = element('article', `message message-${entry.role === 'user' ? 'user' : 'assistant'}`);
    article.append(element('p', 'message-label', entry.role === 'user' ? 'YOU' : 'EVIDENCE DOMINO'));
    article.append(element('div', 'message-content', entry.content || ''));
    if (entry.citations?.length) {
      const citations = element('details', 'citations');
      citations.append(element('summary', '', `${entry.citations.length} supporting ${entry.citations.length === 1 ? 'passage' : 'passages'}`));
      for (const citation of entry.citations) {
        const item = element('div', 'citation');
        item.append(element('strong', '', citation.name || citation.sourceId || 'Reference document'));
        item.append(element('blockquote', '', citation.quote || ''));
        citations.append(item);
      }
      article.append(citations);
    }
    messages.append(article);
  }
  messages.scrollTop = messages.scrollHeight;
}

function renderDocuments() {
  const documents = state.documents || [];
  $('document-count').textContent = String(documents.length);
  $('documents').replaceChildren();
  for (const document of documents) {
    const li = element('li');
    const open = element('button', 'doc-open');
    open.type = 'button';
    const text = element('span', '', document.name);
    text.append(element('small', '', `${Math.max(0.1, document.bytes / 1024).toFixed(1)} KB · reference`));
    open.append(element('span', '', '▤'), text);
    open.title = `Read ${document.name}`;
    open.setAttribute('aria-label', `Read ${document.name}`);
    open.addEventListener('click', () => action('Opening reference document…', async () => {
      const result = await api(`/api/document/${encodeURIComponent(document.id)}`);
      $('document-title').textContent = result.name;
      $('document-content').textContent = result.content;
      $('document-dialog').showModal();
    }));
    const remove = element('button', 'doc-delete', '×');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${document.name} from reference context`);
    remove.title = `Remove ${document.name}`;
    remove.addEventListener('click', () => action('Removing reference document…', async () => {
      acceptState(await api(`/api/documents/${encodeURIComponent(document.id)}`, { method: 'DELETE' }));
    }));
    li.append(open, remove);
    $('documents').append(li);
  }
}

function renderPreflight() {
  const preflight = state.preflight;
  const card = $('preflight');
  card.replaceChildren();
  card.append(element('p', 'eyebrow', preflight ? 'CONFIRMED INPUTS · DETERMINISTIC CHECK' : state.project ? 'READY FOR A CHECK' : 'WAITING FOR A PROPOSAL'));
  card.append(element('h3', '', preflight?.headline || (state.project ? 'Your assumptions are saved.' : 'The important numbers, together.')));
  if (!preflight) {
    card.append(element('p', 'muted small', state.project ? 'Run a proposal health check to see your remaining amount, price limit and possible next steps.' : 'After setup, see the remaining amount, your price limit and any shortfall here.'));
    return;
  }
  if (preflight.details?.length) {
    const list = element('ul');
    for (const detail of preflight.details) list.append(element('li', '', readable(detail)));
    card.append(list);
  }
  if (preflight.recovery && Object.keys(preflight.recovery).length) {
    const recovery = element('div', 'recovery-list');
    const options = [['priceCeilingCents', 'Supplier price limit per unit'], ['remainingHeadroomCents', 'Room above the target'], ['requiredQuoteCents', 'Hypothetical quote to retain target']];
    for (const [key, label] of options) {
      const value = preflight.recovery[key];
      if (value === undefined) continue;
      const row = element('div', 'recovery-item');
      row.append(element('strong', '', label), element('span', '', value === null ? 'Target cannot be met even at zero supplier cost' : usd(value)));
      recovery.append(row);
    }
    card.append(recovery);
  }
}

function renderPending() {
  const pending = state.pending;
  $('pending-section').hidden = !pending;
  if (!pending) { shownPendingId = null; $('confirmation-input').value = ''; return; }
  if (pending.id !== shownPendingId) $('confirmation-input').value = '';
  shownPendingId = pending.id;
  $('pending-title').textContent = pending.kind === 'init' ? 'Confirm your starting point' : 'Review the proposed revision';
  $('pending-summary').textContent = pending.summary || '';
  $('confirmation-phrase').textContent = pending.confirmation || '';
  $('confirm-pending').textContent = pending.kind === 'init' ? 'Confirm starting assumptions' : 'Adopt displayed revision';
  $('pending-content').replaceChildren();
  for (const [label, value] of [['Draft', pending.document], ['Tracked sentences', pending.anchors], ['Calculation', pending.calculation]]) {
    if (value === undefined || value === null) continue;
    $('pending-content').append(element('p', '', label), element('pre', '', readable(value)));
  }
  $('pending-detail').hidden = !$('pending-content').childElementCount;
  $('open-report').hidden = !pending.reviewUrl;
}

function render() {
  const project = state.project;
  $('project-badge').textContent = project ? 'Confirmed' : 'Not set up';
  $('project-description').textContent = project ? [project.item || project.project?.item || 'Your approved proposal', project.quantity ? `${project.quantity} ${project.unitBasis || 'units'}` : '', project.baseline?.version || project.baselineVersion ? `Version ${project.baseline?.version || project.baselineVersion}` : '', Number.isSafeInteger(project.baseline?.unitPriceCents) ? `${usd(project.baseline.unitPriceCents)} per unit · approved` : ''].filter(Boolean).join(' · ') : 'Start with a draft and the supplier price it depends on.';
  $('open-intake').hidden = Boolean(project);
  $('export-document').hidden = !project;
  const privacy = state.privacy || {};
  $('privacy-description').textContent = privacy.mode === 'local' ? 'This workspace runs on this Mac for one owner. Proposal text, reference documents and AI processing stay local.' : 'This workspace stores its files on this Mac. Check the configured model and connectors before sharing private material.';
  $('privacy-retrieval').textContent = privacy.publicRetrievalEnabled ? 'Public retrieval is available only when you explicitly allow a source check. That request sends the supplier URL to Tavily.' : 'Public retrieval is disabled. This workspace does not fetch supplier pages.';
  $('model-detail').textContent = `Local model: ${privacy.model || state.model?.name || 'not configured'}`;
  $('model-warning').hidden = state.model?.available !== false;
  $('model-warning').textContent = state.model?.error || 'The local model is unavailable. Start the configured local model to chat or prepare mappings. Saved records and deterministic checks remain available.';
  $('source-check-section').hidden = !privacy.publicRetrievalEnabled;
  const review = project?.latestReview;
  $('latest-review').hidden = !review && !project?.latestObservation;
  $('open-latest-report').hidden = !review;
  $('latest-headline').textContent = review?.headline || 'Source observation needs attention.';
  const dispositions = { approved: 'Adopted', awaiting_applicability_review: 'Awaiting applicability review', informational_or_superseded: 'Informational or superseded' };
  $('review-disposition').textContent = dispositions[review?.currentDisposition] || humanLabel(project?.latestObservation?.disposition || 'Observation recorded');
  $('observation-status').textContent = project?.latestObservation ? `Latest observation: ${humanLabel(project.latestObservation.disposition || 'recorded')}. The saved report is a snapshot when generated.` : 'The saved report is a snapshot when generated.';
  const replay = project?.mode === 'controlled_replay' || project?.mode === 'controlled-replay' || project?.mode === 'replay' || project?.project?.mode === 'controlled_replay';
  $('replay-label').hidden = !replay;
  renderDocuments();
  renderMessages();
  renderPreflight();
  renderPending();
  setBusy(busy, busy ? $('activity').textContent : '');
}

async function readFile(file, extensions) {
  if (!file) throw new Error('Choose a file first.');
  if (!extensions.some((extension) => file.name.toLowerCase().endsWith(extension))) throw new Error(`Use ${extensions.join(', ')} files for this upload.`);
  if (file.size > MAX_FILE) throw new Error('This file is larger than 20 KB. Add a shorter text document.');
  const buffer = await file.arrayBuffer();
  let content;
  try { content = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  catch { throw new Error('This file is not valid UTF-8 text. Save it as UTF-8, then try again.'); }
  if (!content.trim()) throw new Error('This file is empty.');
  return content;
}

$('chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = $('chat-input').value.trim();
  if (!message || busy) return;
  action('Local model is working… this can take a little while.', async () => {
    acceptState(await api('/api/chat', { method: 'POST', body: { message } }));
    $('chat-input').value = '';
    $('chat-input').style.height = '';
  });
});
$('chat-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!$('send-chat').disabled) $('chat-form').requestSubmit();
  }
});
$('chat-input').addEventListener('input', () => {
  $('chat-input').style.height = 'auto';
  $('chat-input').style.height = `${Math.min(160, $('chat-input').scrollHeight)}px`;
});
document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => {
  $('chat-input').value = button.dataset.prompt;
  $('chat-input').focus();
}));
document.querySelectorAll('.close-dialog').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
$('open-intake').addEventListener('click', () => { clearErrors(); $('intake-dialog').showModal(); });
$('upload-context').addEventListener('click', () => $('context-file').click());
$('upload-draft').addEventListener('click', () => $('draft-file').click());
$('context-file').addEventListener('change', (event) => action('Adding reference context…', async () => {
  const file = event.target.files[0];
  if (!file) return;
  const content = await readFile(file, ['.md', '.txt', '.csv']);
  acceptState(await api('/api/documents', { method: 'POST', body: { name: file.name, content } }));
  event.target.value = '';
}));
$('draft-file').addEventListener('change', (event) => action('Reading your draft…', async () => {
  const file = event.target.files[0];
  if (!file) return;
  $('draft-text').value = await readFile(file, ['.md', '.txt']);
  $('draft-file-name').textContent = file.name;
  event.target.value = '';
}, 'intake-error'));
$('intake-form').addEventListener('submit', (event) => {
  event.preventDefault();
  action('Local model is preparing the proposed mappings…', async () => {
    const document = $('draft-text').value;
    if (encoder.encode(document).length > MAX_FILE) throw new Error('The draft must be at most 20 KB.');
    const sourceUrl = $('source-url').value.trim();
    if (new URL(sourceUrl).protocol !== 'https:') throw new Error('The supplier source must use HTTPS.');
    acceptState(await api('/api/intake', { method: 'POST', body: { document, sourceUrl, supportingPassage: $('source-passage').value.trim() } }));
    $('intake-dialog').close();
    $('pending-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 'intake-error');
});
$('confirmation-input').addEventListener('input', () => setBusy(busy));
$('confirm-pending').addEventListener('click', () => action('Validating and saving your confirmation…', async () => {
  const pending = state.pending;
  if (!pending || $('confirmation-input').value !== pending.confirmation) throw new Error('The confirmation must exactly match the displayed phrase.');
  acceptState(await api('/api/confirm', { method: 'POST', body: { id: pending.id, confirmation: $('confirmation-input').value } }));
}));
$('run-preflight').addEventListener('click', () => action('Checking the confirmed proposal inputs…', async () => {
  acceptState(await api('/api/preflight', { method: 'POST', body: {} }));
}));
$('retrieval-consent').addEventListener('change', () => setBusy(busy));
$('check-source').addEventListener('click', () => action('Retrieving the public source, then reviewing the observed price…', async () => {
  if (!$('retrieval-consent').checked) throw new Error('Allow this public source request before continuing.');
  const body = { allowPublicRetrieval: true };
  if (!$('replay-label').hidden) {
    if (!$('replay-version').value.trim()) throw new Error('Choose an explicit controlled replay version.');
    body.replayVersion = $('replay-version').value.trim();
  }
  $('retrieval-consent').checked = false;
  acceptState(await api('/api/check', { method: 'POST', body }));
}));
function openReport(reportUrl) { return action('Opening the evidence report…', async () => {
  const url = new URL(reportUrl, location.origin);
  if (url.origin !== location.origin || !/^\/report\/[A-Za-z0-9_-]+$/.test(url.pathname)) throw new Error('The report must be a local workspace report.');
  const response = await api(url.pathname, { raw: true });
  const content = await response.text();
  // A sandbox without allow-scripts or allow-same-origin prevents report scripts and workspace access.
  // The injected CSP also prevents untrusted report markup from loading external assets.
  $('report-frame').srcdoc = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src \'none\'; form-action \'none\'; base-uri \'none\'">' + content;
  $('report-dialog').showModal();
}); }
$('open-report').addEventListener('click', () => openReport(state.pending.reviewUrl));
$('open-latest-report').addEventListener('click', () => openReport(`/report/${state.project.latestReview.reviewId}`));
$('refresh-model').addEventListener('click', () => action('Checking the configured local model…', async () => acceptState(await api('/api/model'))));
$('report-dialog').addEventListener('close', () => { $('report-frame').srcdoc = ''; });
$('export-document').addEventListener('click', () => action('Preparing the approved draft…', async () => {
  const response = await api('/api/export', { raw: true });
  const blob = new Blob([await response.text()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = element('a');
  link.href = url;
  link.download = 'evidence-domino-approved-proposal.md';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}));
$('clear-chat').addEventListener('click', () => $('clear-dialog').showModal());
$('confirm-clear').addEventListener('click', () => {
  $('clear-dialog').close();
  action('Clearing the saved conversation…', async () => acceptState(await api('/api/clear-chat', { method: 'POST', body: {} })));
});

action('Opening your local workspace…', async () => acceptState(await api('/api/state')));
