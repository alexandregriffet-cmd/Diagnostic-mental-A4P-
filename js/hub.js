function getHubStore() {
  try {
    return JSON.parse(localStorage.getItem(window.A4P_CONFIG.hubStorageKey)) || {};
  } catch (e) {
    return {};
  }
}

function resetHubStore() {
  localStorage.removeItem(window.A4P_CONFIG.hubStorageKey);
  renderHub();
}

function safeScore(v) {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

function computeGlobalMentalScore(data) {
  const scores = [safeScore(data?.CMP?.score_global), safeScore(data?.PMP?.score_global), safeScore(data?.EQU?.score_global)].filter(v => v !== null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
}

function moduleStatus(data, key) {
  return Boolean(data && data[key]);
}

function renderModuleCard(rootId, options) {
  const root = document.getElementById(rootId);
  if (!root) return;
  const data = getHubStore();
  const result = data[options.key];
  const ready = Boolean(result);
  const score = safeScore(result?.score_global);
  const summary = result?.summary || result?.resume_court || options.emptyText;
  const profile = result?.profil_nom || result?.profil || 'Aucun résultat';
  root.innerHTML = `
    <div class="module-tag">${options.moduleLabel}</div>
    <h3>${options.title}</h3>
    <p class="module-desc">${options.description}</p>
    <div class="status ${ready ? 'ready' : 'pending'}">${ready ? 'Synchronisé' : 'En attente'}</div>
    <div class="module-meta">
      <div><strong>Profil :</strong> ${profile}</div>
      <div><strong>Score :</strong> ${score !== null ? score + '/100' : '—'}</div>
    </div>
    <p class="summary">${summary}</p>
    <div class="card-actions">
      <a class="btn" href="${options.launchUrl}">${options.launchLabel}</a>
      ${options.resultsUrl ? `<a class="btn secondary" href="${options.resultsUrl}">Voir la synthèse</a>` : ''}
    </div>
  `;
}

function drawRadar(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssSize = Math.min(canvas.parentElement.clientWidth, 420);
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  ctx.scale(dpr, dpr);
  const size = cssSize;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const labels = ['Confiance','Régulation','Engagement','Stabilité'];
  const values = [
    safeScore(data?.CMP?.dimensions?.confiance),
    safeScore(data?.CMP?.dimensions?.regulation),
    safeScore(data?.CMP?.dimensions?.engagement),
    safeScore(data?.CMP?.dimensions?.stabilite)
  ].map(v => v === null ? 0 : v);
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = '#d6e0ee';
  ctx.lineWidth = 1;
  for (let level = 1; level <= 5; level++) {
    const rr = r * level / 5;
    ctx.beginPath();
    for (let i=0;i<4;i++) {
      const angle = -Math.PI/2 + i * (Math.PI*2/4);
      const x = cx + Math.cos(angle) * rr;
      const y = cy + Math.sin(angle) * rr;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  for (let i=0;i<4;i++) {
    const angle = -Math.PI/2 + i * (Math.PI*2/4);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
    const lx = cx + Math.cos(angle) * (r + 28);
    const ly = cy + Math.sin(angle) * (r + 28);
    ctx.fillStyle = '#1e3a5f';
    ctx.font = '600 13px Arial';
    ctx.textAlign = i === 1 ? 'left' : i === 3 ? 'right' : 'center';
    ctx.textBaseline = i === 0 ? 'bottom' : i === 2 ? 'top' : 'middle';
    ctx.fillText(labels[i], lx, ly);
  }
  ctx.beginPath();
  values.forEach((v, i) => {
    const angle = -Math.PI/2 + i * (Math.PI*2/4);
    const rr = r * (v/100);
    const x = cx + Math.cos(angle) * rr;
    const y = cy + Math.sin(angle) * rr;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(59, 102, 194, 0.18)';
  ctx.strokeStyle = '#294d7a';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  values.forEach((v, i) => {
    const angle = -Math.PI/2 + i * (Math.PI*2/4);
    const rr = r * (v/100);
    const x = cx + Math.cos(angle) * rr;
    const y = cy + Math.sin(angle) * rr;
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle='#1e3a5f'; ctx.fill();
  });
}

function renderOverview() {
  const data = getHubStore();
  const score = computeGlobalMentalScore(data);
  const root = document.getElementById('global-mental-score');
  if (root) root.textContent = score !== null ? `${score}/100` : '—';
  const status = document.getElementById('global-status');
  if (status) {
    const completed = ['CMP','PMP','EQU'].filter(k => moduleStatus(data, k)).length;
    status.textContent = `${completed}/3 modules synchronisés`;
  }
  const jsonRoot = document.getElementById('hub-json');
  if (jsonRoot) jsonRoot.textContent = JSON.stringify(data, null, 2);
  drawRadar('hub-radar', data);
}

function renderHub() {
  renderOverview();
  renderModuleCard('cmp-card', {
    key: 'CMP',
    moduleLabel: 'Module 2',
    title: 'Compétences Mentales (CMP)',
    description: 'Questionnaire dynamique, profil automatique, radar et synthèse professionnelle.',
    emptyText: 'Aucun résultat CMP synchronisé pour le moment.',
    launchUrl: window.A4P_CONFIG.cmpApp,
    launchLabel: 'Ouvrir le module CMP',
    resultsUrl: window.A4P_CONFIG.cmpResults
  });
  renderModuleCard('pmp-card', {
    key: 'PMP',
    moduleLabel: 'Module 1',
    title: 'Profil Mental (PMP)',
    description: 'Emplacement stabilisé pour le futur module PMP connecté au hub.',
    emptyText: 'Le module PMP n’est pas encore connecté.',
    launchUrl: window.A4P_CONFIG.pmpApp,
    launchLabel: 'Préparer le module PMP',
    resultsUrl: ''
  });
  renderModuleCard('equ-card', {
    key: 'EQU',
    moduleLabel: 'Module 3',
    title: 'Équilibre Psycho-Émotionnel',
    description: 'Emplacement stabilisé pour le futur module Équilibre connecté au hub.',
    emptyText: 'Le module Équilibre n’est pas encore connecté.',
    launchUrl: window.A4P_CONFIG.psychoApp,
    launchLabel: 'Préparer le module Équilibre',
    resultsUrl: ''
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderHub();
  document.getElementById('btn-refresh')?.addEventListener('click', renderHub);
  document.getElementById('btn-reset')?.addEventListener('click', resetHubStore);
  window.addEventListener('storage', renderHub);
});
