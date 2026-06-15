/* ===== RPG DA LIBERDADE — APP ===== */

const STORAGE_KEY = 'rpg_liberdade_v2';
const AUTH_KEY    = 'rpg_liberdade_auth';
const AUTH_HASH   = '8af768d438a5f6325fae48892ba253b175f11fea057d15d19e3a266ce6126bc6';

let S = {};
let currentPage = 'home';
let activeMissionTab = 'phases';
let activeMissionPhase = 0;

/* ============================
   STATE
   ============================ */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    S = raw ? JSON.parse(raw) : buildDefaultState();
  } catch(e) {
    S = buildDefaultState();
  }
  // migrate: ensure all keys exist
  if (!S.activeMission) S.activeMission = { main: null, secondary: null };
  if (!S.frozenProgress) {
    S.frozenProgress = {};
    GAME_DATA.frozenMissions.forEach(fm => {
      S.frozenProgress[fm.id] = {};
      fm.checklist.forEach(c => { S.frozenProgress[fm.id][c.id] = false; });
    });
  }
  if (!S.xp) S.xp = 0;
}

function saveState() {
  S.lastSaved = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
}

/* ============================
   GAME CALCULATIONS
   ============================ */

function getXP() { return S.xp || 0; }

function getLevelInfo(xp) {
  const lv = GAME_DATA.xpLevels;
  let cur = lv[0];
  for (let i = lv.length - 1; i >= 0; i--) {
    if (xp >= lv[i].xp) { cur = lv[i]; break; }
  }
  const next = lv.find(l => l.xp > xp);
  const pct = next
    ? Math.round((xp - cur.xp) / (next.xp - cur.xp) * 100)
    : 100;
  return { ...cur, nextXp: next?.xp ?? GAME_DATA.totalXP, xpToNext: next ? next.xp - xp : 0, pct, nextName: next?.name };
}

function getOverallProgress() {
  const xp = getXP();
  const total = GAME_DATA.totalXP;
  return { xp, total, pct: Math.min(100, Math.round(xp / total * 100)) };
}

function countCompletedPhases() {
  return GAME_DATA.phases.filter(p => S.phases[p.id]?.status === 'completed').length;
}

function getPhaseProgress(pid) {
  if (S.phases[pid]?.status === 'completed') return 100;
  const ph = GAME_DATA.phases.find(p => p.id === pid);
  if (!ph) return 0;
  const all = ph.missions;
  const done = all.filter(m => S.missions[m.id]?.completed).length;
  return all.length ? Math.round(done / all.length * 100) : 0;
}

function getMissionById(id) {
  for (const ph of GAME_DATA.phases) {
    const m = ph.missions.find(m => m.id === id);
    if (m) return { mission: m, phase: ph };
  }
  return null;
}

function getDailyMsg() {
  const msgs = GAME_DATA.motivational.daily;
  return msgs[Math.floor(Date.now() / 86400000) % msgs.length];
}

function daysSince(d) { return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null; }
function daysUntil(d) { return d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null; }
function fmtMoney(n) { return (n||0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
function fmtDate(s) { if (!s) return ''; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; }

/* ============================
   ACTIONS
   ============================ */

function addXP(amt) {
  const before = getLevelInfo(getXP());
  S.xp = (S.xp || 0) + amt;
  const after = getLevelInfo(getXP());
  saveState();
  if (after.level > before.level) {
    setTimeout(() => toast('Subiu de Nivel!', `Nivel ${after.level} — ${after.name} desbloqueado.`), 400);
  }
}

function completeMission(id) {
  if (S.missions[id]?.completed) return;
  S.missions[id] = { completed: true, completedDate: new Date().toISOString().split('T')[0] };
  const found = getMissionById(id);
  if (found) {
    const xpPer = Math.round(found.phase.xp / found.phase.missions.length);
    addXP(xpPer);
    const allDone = found.phase.missions.every(m => S.missions[m.id]?.completed);
    if (allDone && S.phases[found.phase.id]?.status !== 'completed') {
      completePhase(found.phase.id);
      return;
    }
  }
  saveState();
  toast('Missao Concluida', 'XP ganho. Continue avancando.');
  refreshCurrentPage();
}

function uncompleteM(id) {
  if (!S.missions[id]?.completed) return;
  const found = getMissionById(id);
  if (found) S.xp = Math.max(0, getXP() - Math.round(found.phase.xp / found.phase.missions.length));
  S.missions[id] = { completed: false, completedDate: null };
  saveState();
  refreshCurrentPage();
}

function completePhase(pid) {
  S.phases[pid].status = 'completed';
  S.phases[pid].completionDate = new Date().toISOString().split('T')[0];
  const achievMap = { 0:'fase_0_completa', 1:'fase_1_completa', 2:'fase_2_completa' };
  if (achievMap[pid]) unlockAchievement(achievMap[pid]);
  saveState();
  toast('Fase Concluida!', GAME_DATA.motivational.completed[0]);
  refreshCurrentPage();
}

function unlockAchievement(id) {
  if (S.achievements[id]?.unlocked) return;
  S.achievements[id] = { unlocked: true, unlockedDate: new Date().toISOString().split('T')[0] };
  saveState();
  const a = GAME_DATA.achievements.find(x => x.id === id);
  if (a) toast('Conquista Desbloqueada', a.name);
}

function setActiveMission(id, slot) {
  if (slot === 'main') {
    S.activeMission.main = S.activeMission.main === id ? null : id;
  } else {
    S.activeMission.secondary = S.activeMission.secondary === id ? null : id;
  }
  saveState();
  toast(slot === 'main' ? 'Missao Principal definida' : 'Missao Secundaria definida', 'Visivel na Central.');
  refreshCurrentPage();
}

function toggleFrozen(fmId, itemId) {
  if (!S.frozenProgress[fmId]) S.frozenProgress[fmId] = {};
  S.frozenProgress[fmId][itemId] = !S.frozenProgress[fmId][itemId];
  saveState();
  refreshCurrentPage();
}

function updateFinance(id, amount, target, notes) {
  S.finances[id] = { amount: parseFloat(amount) || 0, target: target ? parseFloat(target) : null, notes: notes || '' };
  saveState();
  if (id === 'renda_mensal') {
    const a = parseFloat(amount) || 0;
    if (a >= 500)  unlockAchievement('primeiros_500');
    if (a >= 1000) unlockAchievement('primeiros_1000');
  }
  if (id === 'reserva') {
    const a = parseFloat(amount) || 0;
    if (a >= 5000)  unlockAchievement('primeiros_5k_guardados');
    if (a >= 10000) unlockAchievement('primeiros_10k');
    if (a >= 15000) unlockAchievement('reserva_completa');
  }
}

function setSkillLevel(branch, skill, lvl) {
  if (!S.skills[branch]) S.skills[branch] = {};
  S.skills[branch][skill] = lvl;
  saveState();
}

function setPhaseDate(pid, field, value) {
  S.phases[pid][field] = value || null;
  saveState();
}

/* ============================
   NAVIGATION
   ============================ */

function go(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const app = document.getElementById('app');
  app.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'page active';
  div.id = `page-${page}`;
  app.appendChild(div);
  ({ home: renderHome, mapa: renderMapa, missoes: renderMissoes, habilidades: renderHabilidades, financas: renderFinancas, conquistas: renderConquistas }[page] || renderHome)(div);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshCurrentPage() { go(currentPage); }

function renderNav() {
  document.getElementById('main-nav').innerHTML = `
    <div class="nav-logo" onclick="go('home')">
      <div class="nav-emblem">${svgSword()}</div>
      <span class="nav-title">RPG DA LIBERDADE</span>
    </div>
    <ul class="nav-links">
      ${[['home','Central'],['mapa','Mapa'],['missoes','Missoes'],['habilidades','Habilidades'],['financas','Financas'],['conquistas','Conquistas']]
        .map(([p,l]) => `<li><a class="nav-link${currentPage===p?' active':''}" data-page="${p}" onclick="go('${p}')">${l}</a></li>`).join('')}
      <li><button class="nav-link nav-logout" onclick="doLogout()">Sair</button></li>
    </ul>`;
}

/* ============================
   SVG ICONS
   ============================ */

function svgSword() {
  return `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 19L11 11M11 11L19 3M11 11L8 14M11 11L14 8" stroke="#c4a03a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 6L18 4" stroke="#c4a03a" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="4.5" cy="17.5" r="1.5" fill="#c4a03a"/>
  </svg>`;
}

function svgStar() {
  return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z" fill="#ac8a28"/></svg>`;
}

function svgCheck() { return `<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }

function svgMapIcon() {
  return `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M8 3L3 5v14l5-2 6 2 5-2V5l-5 2-6-2z" stroke="#c4a03a" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M8 3v14M14 5v14" stroke="#c4a03a" stroke-width="1.5"/>
  </svg>`;
}

function svgFinanceIcon() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="#c4a03a" stroke-width="1.5"/>
    <path d="M10 6v8M7 8.5c0-1.1.9-2 2-2h2a2 2 0 110 4H9a2 2 0 100 4h2a2 2 0 002-2" stroke="#c4a03a" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

/* ============================
   ANIMATE PROGRESS BARS
   ============================ */

function animateBars(el) {
  setTimeout(() => {
    el.querySelectorAll('[data-w]').forEach(bar => {
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 80);
    });
  }, 60);
}

/* ============================
   HOME PAGE
   ============================ */

function renderHome(el) {
  const lvl = getLevelInfo(getXP());
  const overall = getOverallProgress();
  const mainId = S.activeMission.main;
  const secId = S.activeMission.secondary;
  const daysSinceStart = daysSince(S.phases[0]?.startDate);
  const unlockedAch = GAME_DATA.achievements.filter(a => S.achievements[a.id]?.unlocked);

  el.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">RPG DA LIBERDADE</h1>
      <p class="page-subtitle">Construindo uma vida com mais escolhas, autonomia e liberdade.</p>
    </div>

    <!-- HERO -->
    <div class="hero" style="margin-bottom:var(--sp-5)">
      <div class="hero-inner">
        <div style="text-align:center">
          <div class="lvl-badge">
            <span class="lvl-num">${lvl.level}</span>
            <span class="lvl-lbl">Nivel</span>
          </div>
          <div class="lvl-class">${lvl.name}</div>
        </div>

        <div>
          <div class="hero-class-label">Classe &mdash; Exploradora Digital</div>
          <div class="hero-name">Victoria</div>
          <div class="hero-mission">${mainId ? `Missao principal: ${getMissionById(mainId)?.mission.title || ''}` : 'Nenhuma missao principal definida'}</div>
        </div>

        <div style="min-width:240px">
          <div class="pb-label"><span>XP &mdash; Proximo Nivel</span><span>${getXP().toLocaleString('pt-BR')} / ${lvl.nextXp.toLocaleString('pt-BR')}</span></div>
          <div class="pb-track"><div class="pb-fill xp" data-w="${lvl.pct}" style="width:0%"></div></div>
          <div style="font-family:var(--f-title);font-size:0.62rem;color:var(--tx-dim);text-align:right;margin-top:3px">
            ${lvl.xpToNext > 0 ? `Faltam ${lvl.xpToNext.toLocaleString('pt-BR')} XP para ${lvl.nextName}` : 'Nivel maximo'}
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN QUEST -->
    <div class="mq-card">
      <div class="mq-header">
        <div class="mq-icon">${svgMapIcon()}</div>
        <div>
          <div class="mq-label">Missao da Jornada</div>
          <div class="mq-name">Independencia Financeira e Liberdade de Escolha</div>
        </div>
        <div class="mq-pct-label">${overall.pct}%</div>
      </div>
      <div class="mq-track">
        <div class="mq-fill" data-w="${overall.pct}" style="width:0%"></div>
        <div class="mq-pct">${overall.xp.toLocaleString('pt-BR')} / ${overall.total.toLocaleString('pt-BR')} XP</div>
      </div>
    </div>

    <!-- STATS -->
    <div class="g-4" style="margin-bottom:var(--sp-5)">
      <div class="stat-chip card-dk"><div class="stat-val">${lvl.level}</div><div class="stat-lbl">Nivel Atual</div></div>
      <div class="stat-chip card-dk"><div class="stat-val">${overall.pct}%</div><div class="stat-lbl">Jornada Total</div></div>
      <div class="stat-chip card-dk"><div class="stat-val">${unlockedAch.length}</div><div class="stat-lbl">Conquistas</div></div>
      <div class="stat-chip card-dk"><div class="stat-val">${daysSinceStart ?? 0}</div><div class="stat-lbl">Dias em Jornada</div></div>
    </div>

    <!-- ACTIVE MISSIONS -->
    <div class="divider">
      <div class="divider-line"></div>
      <span class="divider-title">Missoes Ativas</span>
      <div class="divider-line"></div>
    </div>

    <div class="g-2" style="margin-bottom:var(--sp-6)">
      ${renderActiveMissionCard(mainId, 'main')}
      ${renderActiveMissionCard(secId, 'secondary')}
    </div>

    <!-- MOTIVACIONAL -->
    <div class="motiv-card" style="margin-bottom:var(--sp-6)">${getDailyMsg()}</div>

    <!-- FASE ATUAL -->
    <div class="divider">
      <div class="divider-line"></div>
      <span class="divider-title">Fases da Jornada</span>
      <div class="divider-line"></div>
    </div>
    <div class="g-4">
      ${GAME_DATA.phases.map(p => renderPhaseCard(p)).join('')}
    </div>

    ${unlockedAch.length > 0 ? `
    <div class="divider"><div class="divider-line"></div><span class="divider-title">Conquistas Recentes</span><div class="divider-line"></div></div>
    <div class="ach-grid">
      ${unlockedAch.slice(-6).map(a => renderAchBadge(a, true)).join('')}
    </div>` : ''}
  `;
  animateBars(el);
}

function renderActiveMissionCard(id, slot) {
  const label = slot === 'main' ? 'Missao Principal' : 'Missao Secundaria';
  const tagClass = slot === 'main' ? 'tag-main' : 'tag-secondary';
  const cardClass = slot === 'main' ? 'main-mission' : 'secondary-mission';

  if (!id) {
    return `<div class="active-mission ${cardClass}">
      <span class="mission-type-tag ${tagClass}">${label}</span>
      <div class="am-no-mission">
        <div class="no-mission-label">Nenhuma missao definida</div>
        <div class="no-mission-sub">Va ate Missoes para escolher sua missao ${slot === 'main' ? 'principal' : 'secundaria'}.</div>
        <div style="margin-top:var(--sp-4)"><button class="btn-sm" onclick="go('missoes')">Escolher missao &rarr;</button></div>
      </div>
    </div>`;
  }

  const found = getMissionById(id);
  if (!found) return '';
  const { mission, phase } = found;
  const done = S.missions[id]?.completed;
  const phProgress = getPhaseProgress(phase.id);

  return `<div class="active-mission ${cardClass}${done?' m-done':''}">
    <span class="mission-type-tag ${tagClass}">${label}</span>
    <div class="am-phase">Fase ${phase.id} &mdash; ${phase.name}</div>
    <div class="am-title">${mission.title}</div>
    <div class="am-desc">${mission.desc}</div>
    <div class="pb-wrap">
      <div class="pb-label"><span>Progresso da fase</span><span>${phProgress}%</span></div>
      <div class="pb-track"><div class="pb-fill${phProgress>=100?' ok':''}" data-w="${phProgress}" style="width:0%"></div></div>
    </div>
    <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-4);flex-wrap:wrap">
      <button class="btn-sm" onclick="${done?`uncompleteM('${id}')`:`completeMission('${id}')`}">
        ${done ? 'Desmarcar' : 'Concluir missao'}
      </button>
      <button class="btn-sm" onclick="go('missoes')">Ver missoes &rarr;</button>
      <button class="btn-sm" onclick="setActiveMission('${id}','${slot}')">Trocar missao</button>
    </div>
  </div>`;
}

function renderPhaseCard(phase) {
  const st = S.phases[phase.id]?.status || 'available';
  const pct = getPhaseProgress(phase.id);
  const completedMissions = phase.missions.filter(m => S.missions[m.id]?.completed).length;

  const statusText = { completed: 'Concluida', active: 'Ativa', available: `${completedMissions}/${phase.missions.length}` }[st] || '';

  return `<div class="phase-card st-${st}" onclick="go('missoes');activeMissionPhase=${phase.id};activeMissionTab='phases';renderMissoes()">
    <div class="phase-status-icon">${st === 'completed' ? '&#10003;' : st === 'active' ? '&#9670;' : ''}</div>
    <div class="phase-num">Fase ${phase.id}</div>
    <div class="phase-name">${phase.name}</div>
    <div class="phase-desc">${phase.description}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2)">
      <span class="phase-xp">${svgStar()} ${phase.xp.toLocaleString('pt-BR')} XP</span>
      <span style="font-family:var(--f-title);font-size:0.68rem;color:var(--tx-dim)">${statusText}</span>
    </div>
    ${pct > 0 ? `<div class="pb-track" style="margin-top:var(--sp-3);height:5px"><div class="pb-fill${pct>=100?' ok':''}" style="width:${pct}%"></div></div>` : ''}
  </div>`;
}

/* ============================
   MAP PAGE — SVG FANTASY
   ============================ */

function renderMapa(el) {
  el.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Mapa da Jornada</h1>
      <p class="page-subtitle">Cada fase e uma regiao do seu mundo. Clique em um local para ver detalhes.</p>
    </div>
    <div class="map-page-wrap">
      <div class="map-svg-container" id="map-svg-wrap"></div>
      <div class="map-sidebar">
        ${renderMapLegend()}
        ${renderMapPhaseList()}
      </div>
    </div>`;

  buildMapSVG(document.getElementById('map-svg-wrap'));
}

function renderMapLegend() {
  return `<div class="map-legend card-dk">
    <div class="card-dk-title" style="margin-bottom:var(--sp-4)">Legenda</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--ok-bright)"></div> Fase concluida</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--gold-warm)"></div> Fase atual / ativa</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--tx-dim)"></div> Fase futura</div>
    <div style="margin-top:var(--sp-4);padding-top:var(--sp-4);border-top:1px solid rgba(172,138,40,0.1)">
      <div style="font-family:var(--f-title);font-size:0.65rem;color:var(--tx-gold);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:var(--sp-3)">Progresso total</div>
      ${(() => { const p = getOverallProgress(); return `<div class="pb-label"><span></span><span>${p.pct}%</span></div><div class="pb-track"><div class="pb-fill main" data-w="${p.pct}" style="width:0%"></div></div>`; })()}
    </div>
  </div>`;
}

function renderMapPhaseList() {
  return `<div class="card-dk" style="margin-top:var(--sp-4)">
    <div class="card-dk-title">Regioes</div>
    ${GAME_DATA.phases.map(p => {
      const st = S.phases[p.id]?.status || 'available';
      const pct = getPhaseProgress(p.id);
      return `<div style="padding:var(--sp-3) 0;border-bottom:1px solid rgba(172,138,40,0.08);cursor:pointer" onclick="go('missoes');activeMissionPhase=${p.id}">
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <div style="width:8px;height:8px;border-radius:50%;background:${st==='completed'?'var(--ok-bright)':st==='active'?'var(--gold-warm)':'var(--tx-dim)'};flex-shrink:0"></div>
          <div>
            <div style="font-family:var(--f-title);font-size:0.75rem;font-weight:700;color:${st==='completed'?'var(--ok-bright)':st==='active'?'var(--tx-gold)':'var(--tx-dim)'}">${p.location}</div>
            <div style="font-size:0.72rem;color:var(--tx-dim);margin-top:1px">Fase ${p.id} &mdash; ${pct}% concluido</div>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function buildMapSVG(wrap) {
  // Location positions (winding path)
  const W = 760, H = 1680;
  const locs = [
    { id: 0, x: 170, y: 240, side: 'left',  name: 'Floresta da\nOrganizacao',       roman: 'I' },
    { id: 1, x: 590, y: 440, side: 'right', name: 'Vila da\nPrimeira Venda',         roman: 'II' },
    { id: 2, x: 170, y: 640, side: 'left',  name: 'Montanha da\nRenda Recorrente',   roman: 'III' },
    { id: 3, x: 590, y: 840, side: 'right', name: 'Forja das\nFerramentas',           roman: 'IV' },
    { id: 4, x: 170, y: 1040, side: 'left', name: 'Torre\ndos Sites',                 roman: 'V' },
    { id: 5, x: 590, y: 1240, side: 'right',name: 'Fortaleza\nda Reserva',            roman: 'VI' },
    { id: 6, x: 170, y: 1440, side: 'left', name: 'Planejamento\nda Independencia',   roman: 'VII' },
    { id: 7, x: 590, y: 1640, side: 'right',name: 'Cidade da\nIndependencia',         roman: 'VIII' },
  ];

  // Path segments between locations
  const pathSegments = [];
  for (let i = 0; i < locs.length - 1; i++) {
    const a = locs[i], b = locs[i+1];
    const cx = 380;
    pathSegments.push({ from: i, to: i+1, d: `M${a.x},${a.y} C${cx},${a.y} ${cx},${b.y} ${b.x},${b.y}` });
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'map-svg');
  svg.style.background = 'transparent';

  svg.innerHTML = `
    <defs>
      <filter id="parchment-tex" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" seed="8" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="saturate" values="0.15" in="noise" result="dsatNoise"/>
        <feBlend in="SourceGraphic" in2="dsatNoise" mode="multiply" result="blended"/>
        <feComposite in="blended" in2="SourceGraphic" operator="in"/>
      </filter>
      <filter id="fog-filter">
        <feGaussianBlur stdDeviation="5"/>
        <feColorMatrix type="matrix" values="0.5 0 0 0 0  0 0.5 0 0 0  0 0 0.5 0 0  0 0 0 0.3 0"/>
      </filter>
      <filter id="active-glow">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feFlood flood-color="#d8b850" flood-opacity="0.6" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="done-glow">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feFlood flood-color="#52904a" flood-opacity="0.5" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="pg-bg" cx="50%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#e8d4a0"/>
        <stop offset="60%" stop-color="#d4b87a"/>
        <stop offset="100%" stop-color="#b8985a"/>
      </radialGradient>
      <pattern id="map-grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="transparent"/>
        <circle cx="1" cy="1" r="0.4" fill="#8a6a30" opacity="0.12"/>
        <circle cx="3" cy="3" r="0.3" fill="#6a5020" opacity="0.08"/>
      </pattern>
    </defs>

    <!-- Parchment background -->
    <rect width="${W}" height="${H}" fill="url(#pg-bg)"/>
    <rect width="${W}" height="${H}" fill="url(#map-grain)" opacity="0.6"/>

    <!-- Aged edges (vignette) -->
    <rect width="${W}" height="${H}" fill="none" opacity="0.4"
      style="filter:drop-shadow(0 0 80px #6a4a10) inset"/>

    <!-- Double border -->
    <rect x="16" y="16" width="${W-32}" height="${H-32}" fill="none" stroke="#9a7828" stroke-width="2.5" rx="4"/>
    <rect x="24" y="24" width="${W-48}" height="${H-48}" fill="none" stroke="#9a7828" stroke-width="1" rx="2" stroke-dasharray="6 4"/>

    <!-- Corner ornaments -->
    ${cornerOrnament(30,30)} ${cornerOrnament(W-30,30,true)} ${cornerOrnament(30,H-30,false,true)} ${cornerOrnament(W-30,H-30,true,true)}

    <!-- Compass rose -->
    ${compassRose(W-68, 68)}

    <!-- Map title -->
    <text x="${W/2}" y="68" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="22" font-weight="700" fill="#5a3a10" opacity="0.7" letter-spacing="4">MAPA DA JORNADA</text>
    <line x1="${W/2-100}" y1="80" x2="${W/2+100}" y2="80" stroke="#9a7828" stroke-width="1" opacity="0.4"/>

    <!-- PATH LAYER -->
    ${pathSegments.map((seg, i) => {
      const fromStatus = S.phases[locs[i].id]?.status || 'available';
      const done = fromStatus === 'completed';
      return `<path d="${seg.d}" fill="none"
        stroke="${done ? '#4a7840' : '#8a6220'}"
        stroke-width="${done ? 4 : 3}"
        stroke-linecap="round"
        stroke-dasharray="${done ? '0' : '10 7'}"
        opacity="${done ? 0.8 : 0.5}"
        ${done ? '' : 'class="map-path-main"'}/>`;
    }).join('')}

    <!-- LOCATIONS -->
    ${locs.map(loc => renderMapLocation(loc)).join('')}
  `;

  // Animate path segments for completed sections
  setTimeout(() => {
    svg.querySelectorAll('.map-path-animate').forEach(path => {
      const len = path.getTotalLength?.() || 300;
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.style.transition = 'stroke-dashoffset 1.5s ease';
      setTimeout(() => { path.style.strokeDashoffset = '0'; }, 200);
    });
  }, 100);

  wrap.appendChild(svg);
  // Animate the active location
  setTimeout(() => {
    const active = wrap.querySelector('.loc-active');
    if (active) active.classList.add('map-loc-active');
  }, 300);
}

function renderMapLocation(loc) {
  const st = S.phases[loc.id]?.status || 'available';
  const pct = getPhaseProgress(loc.id);
  const isLeft = loc.side === 'left';
  const nameLines = loc.name.split('\n');

  const colors = {
    completed: { circle: '#4a7840', ring: '#6aaa5a', text: '#2a4a20', filter: 'done-glow' },
    active:    { circle: '#9a7820', ring: '#d8b850', text: '#3a2008', filter: 'active-glow' },
    available: { circle: '#6a5020', ring: '#9a7828', text: '#4a3010', filter: null },
  };
  const c = colors[st] || colors.available;

  const r = 36;
  const textX = isLeft ? loc.x + r + 18 : loc.x - r - 18;
  const textAnchor = isLeft ? 'start' : 'end';

  const terrainSVG = getTerrainSVG(loc.id, loc.x, loc.y, st);

  return `<g class="map-location-group${st==='active'?' loc-active':''}" style="cursor:pointer" onclick="go('missoes');activeMissionPhase=${loc.id}">
    <!-- Terrain illustration -->
    ${terrainSVG}

    <!-- Connector dot (path origin) -->
    <circle cx="${loc.x}" cy="${loc.y}" r="${r+6}" fill="${c.ring}" opacity="0.12"/>

    <!-- Main circle -->
    <circle cx="${loc.x}" cy="${loc.y}" r="${r}"
      fill="${c.circle}"
      stroke="${c.ring}"
      stroke-width="${st==='active'?3:1.5}"
      ${c.filter ? `filter="url(#${c.filter})"` : ''}
      opacity="${st==='available'?0.65:1}"/>

    <!-- Inner ring -->
    <circle cx="${loc.x}" cy="${loc.y}" r="${r-6}" fill="none" stroke="${c.ring}" stroke-width="0.8" opacity="0.4"/>

    <!-- Roman numeral -->
    <text x="${loc.x}" y="${loc.y+5}" text-anchor="middle"
      font-family="Cinzel, Georgia, serif" font-size="15" font-weight="700"
      fill="${st==='available'?'#c4a870':'#f0e4c4'}" opacity="${st==='available'?0.6:1}">
      ${loc.roman}
    </text>

    <!-- Completed check -->
    ${st === 'completed' ? `<text x="${loc.x}" y="${loc.y+5}" text-anchor="middle" font-size="18" fill="#c8f0c0" font-weight="900">&#10003;</text>` : ''}

    <!-- Active indicator (pulse ring) -->
    ${st === 'active' ? `<circle cx="${loc.x}" cy="${loc.y}" r="${r+10}" fill="none" stroke="#d8b850" stroke-width="1.5" opacity="0.4">
      <animate attributeName="r" values="${r+8};${r+16};${r+8}" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2.5s" repeatCount="indefinite"/>
    </circle>` : ''}

    <!-- Location name -->
    ${nameLines.map((line, i) =>
      `<text x="${textX}" y="${loc.y - 6 + i*20}" text-anchor="${textAnchor}"
        font-family="Cinzel, Georgia, serif" font-size="13" font-weight="${i===0?'700':'400'}"
        fill="${c.text}" opacity="${st==='available'?0.55:1}">${line}</text>`
    ).join('')}

    <!-- Progress text -->
    ${st !== 'available' ? `<text x="${textX}" y="${loc.y + (nameLines.length*20) + 2}" text-anchor="${textAnchor}"
      font-family="Cinzel, Georgia, serif" font-size="11" fill="${c.ring}" opacity="0.8">${pct}% concluido</text>` : ''}

    <!-- Invisible click target -->
    <rect x="${Math.min(loc.x-r-6, textX-120)}" y="${loc.y-r-6}" width="200" height="${r*2+12+40}" fill="transparent"/>
  </g>`;
}

function getTerrainSVG(phaseId, cx, cy, status) {
  const col = status === 'completed' ? '#3a5a30' : status === 'active' ? '#5a4020' : '#5a4a28';
  const alpha = status === 'available' ? '0.35' : '0.55';

  const terrains = {
    0: `<!-- Forest: trees -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <polygon points="-55,-55 -43,-78 -31,-55" fill="${col}" opacity="0.7"/>
        <polygon points="-68,-48 -55,-72 -42,-48" fill="${col}" opacity="0.5"/>
        <polygon points="-40,-50 -28,-74 -16,-50" fill="${col}" opacity="0.6"/>
        <rect x="-52" y="-55" width="5" height="12" fill="#5a3a18" opacity="0.5"/>
        <rect x="-36" y="-50" width="5" height="10" fill="#5a3a18" opacity="0.5"/>
      </g>`,
    1: `<!-- Village: houses -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <rect x="30" y="-62" width="40" height="28" fill="${col}" opacity="0.7" rx="1"/>
        <polygon points="28,-62 50,-82 72,-62" fill="${col}" opacity="0.6"/>
        <rect x="56" y="-56" width="14" height="22" fill="${col}" opacity="0.5" rx="1"/>
        <polygon points="54,-56 63,-70 72,-56" fill="${col}" opacity="0.4"/>
      </g>`,
    2: `<!-- Mountains -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <polygon points="-55,-42 -72,-70 -38,-42" fill="${col}" opacity="0.5"/>
        <polygon points="-45,-38 -65,-78 -25,-38" fill="${col}" opacity="0.7"/>
        <polygon points="-64,-70 -55,-58 -46,-70" fill="#e8e4d8" opacity="0.4"/>
      </g>`,
    3: `<!-- Forge -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <rect x="32" y="-70" width="44" height="34" fill="${col}" opacity="0.6" rx="2"/>
        <rect x="52" y="-90" width="12" height="22" fill="${col}" opacity="0.5" rx="1"/>
        <path d="M54,-90 Q58,-100 62,-90" stroke="#c04010" fill="none" stroke-width="2" opacity="0.6"/>
        <rect x="36" y="-50" width="36" height="10" fill="${col}" opacity="0.7" rx="1"/>
      </g>`,
    4: `<!-- Tower -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <rect x="-66" y="-90" width="26" height="54" fill="${col}" opacity="0.7" rx="1"/>
        <rect x="-68" y="-98" width="8" height="12" fill="${col}" opacity="0.6"/>
        <rect x="-60" y="-98" width="8" height="12" fill="${col}" opacity="0.6"/>
        <rect x="-52" y="-98" width="8" height="12" fill="${col}" opacity="0.6"/>
        <rect x="-62" y="-72" width="10" height="14" fill="#1a1208" opacity="0.4" rx="5"/>
      </g>`,
    5: `<!-- Fortress -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <rect x="22" y="-58" width="66" height="22" fill="${col}" opacity="0.6" rx="1"/>
        <rect x="20" y="-76" width="20" height="40" fill="${col}" opacity="0.7" rx="1"/>
        <rect x="70" y="-76" width="20" height="40" fill="${col}" opacity="0.7" rx="1"/>
        <rect x="20" y="-84" width="6" height="10" fill="${col}" opacity="0.6"/>
        <rect x="28" y="-84" width="6" height="10" fill="${col}" opacity="0.6"/>
        <rect x="70" y="-84" width="6" height="10" fill="${col}" opacity="0.6"/>
        <rect x="78" y="-84" width="6" height="10" fill="${col}" opacity="0.6"/>
      </g>`,
    6: `<!-- House with key -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <rect x="-70" y="-62" width="38" height="28" fill="${col}" opacity="0.7" rx="1"/>
        <polygon points="-72,-62 -51,-84 -30,-62" fill="${col}" opacity="0.6"/>
        <rect x="-58" y="-50" width="14" height="16" fill="#1a1208" opacity="0.35" rx="7"/>
        <circle cx="-22" cy="-76" r="8" fill="none" stroke="#9a7828" stroke-width="2" opacity="0.7"/>
        <line x1="-22" y1="-68" x2="-22" y2="-55" stroke="#9a7828" stroke-width="2" opacity="0.7"/>
        <line x1="-26" y1="-60" x2="-22" y2="-60" stroke="#9a7828" stroke-width="2" opacity="0.7"/>
      </g>`,
    7: `<!-- City: multiple buildings -->
      <g opacity="${alpha}" transform="translate(${cx},${cy})">
        <rect x="24" y="-50" width="20" height="26" fill="${col}" opacity="0.6" rx="1"/>
        <rect x="46" y="-72" width="24" height="48" fill="${col}" opacity="0.75" rx="1"/>
        <rect x="72" y="-58" width="18" height="34" fill="${col}" opacity="0.65" rx="1"/>
        <rect x="92" y="-44" width="14" height="20" fill="${col}" opacity="0.55" rx="1"/>
        <circle cx="58" cy="-84" r="5" fill="#c4a030" opacity="0.7"/>
        <line x1="58" y1="-89" x2="58" y2="-96" stroke="#c4a030" stroke-width="1.5" opacity="0.7"/>
      </g>`,
  };
  return terrains[phaseId] || '';
}

function cornerOrnament(x, y, flipX=false, flipY=false) {
  const sx = flipX ? -1 : 1, sy = flipY ? -1 : 1;
  return `<g transform="translate(${x},${y}) scale(${sx},${sy})">
    <path d="M0,0 L18,0 M0,0 L0,18" stroke="#9a7828" stroke-width="1.5" opacity="0.6"/>
    <circle cx="0" cy="0" r="3" fill="#9a7828" opacity="0.5"/>
    <path d="M6,0 Q6,6 0,6" fill="none" stroke="#9a7828" stroke-width="0.8" opacity="0.4"/>
  </g>`;
}

function compassRose(cx, cy) {
  return `<g transform="translate(${cx},${cy})" opacity="0.6">
    <circle cx="0" cy="0" r="26" fill="none" stroke="#9a7828" stroke-width="1"/>
    <circle cx="0" cy="0" r="4" fill="#9a7828"/>
    <path d="M0,-26 L4,-8 L0,-14 L-4,-8 Z" fill="#9a7828"/>
    <path d="M0,26 L4,8 L0,14 L-4,8 Z" fill="#9a7828" opacity="0.5"/>
    <path d="M-26,0 L-8,4 L-14,0 L-8,-4 Z" fill="#9a7828" opacity="0.5"/>
    <path d="M26,0 L8,4 L14,0 L8,-4 Z" fill="#9a7828" opacity="0.5"/>
    <text x="0" y="-30" text-anchor="middle" font-family="Cinzel,serif" font-size="9" fill="#7a5818" font-weight="700">N</text>
  </g>`;
}

/* ============================
   MISSIONS PAGE
   ============================ */

function renderMissoes(el) {
  const container = el || document.getElementById(`page-${currentPage}`);
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Missoes</h1>
      <p class="page-subtitle">Defina sua missao principal e secundaria. O restante fica em espera.</p>
    </div>

    <div class="phase-tabs">
      ${GAME_DATA.phases.map(p => {
        const st = S.phases[p.id]?.status || 'available';
        const isActive = activeMissionTab === 'phases' && activeMissionPhase === p.id;
        return `<button class="phase-tab${isActive?' active':''} ${st==='completed'?'is-done':''}"
          onclick="activeMissionTab='phases';activeMissionPhase=${p.id};renderMissoes()">
          Fase ${p.id} &mdash; ${p.name}
        </button>`;
      }).join('')}
      <button class="phase-tab${activeMissionTab==='frozen'?' active':''} is-frozen"
        onclick="activeMissionTab='frozen';renderMissoes()">
        Missoes Congeladas
      </button>
    </div>

    <div id="missions-content">${activeMissionTab === 'frozen' ? renderFrozenMissions() : renderPhaseMissions()}</div>
  `;
  animateBars(container);
}

function renderPhaseMissions() {
  const phase = GAME_DATA.phases.find(p => p.id === activeMissionPhase);
  if (!phase) return '';
  const phState = S.phases[phase.id];
  const pct = getPhaseProgress(phase.id);
  const dLeft = daysUntil(phState.targetDate);
  const mainMissions = phase.missions.filter(m => m.type === 'main');
  const secMissions = phase.missions.filter(m => m.type === 'secondary');

  return `
    <div class="card-dk" style="margin-bottom:var(--sp-5)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap">
        <div>
          <div style="font-family:var(--f-title);font-size:0.65rem;color:var(--tx-gold);letter-spacing:0.2em;text-transform:uppercase;opacity:0.7;margin-bottom:3px">
            Fase ${phase.id} &mdash; ${phState.status === 'completed' ? 'Concluida' : 'Em andamento'}
          </div>
          <div style="font-family:var(--f-title);font-size:1.2rem;font-weight:700;color:var(--tx-primary)">${phase.name}</div>
          <div style="font-size:0.85rem;color:var(--tx-secondary);margin-top:var(--sp-1);opacity:0.8">${phase.description}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:var(--f-title);font-size:1.5rem;font-weight:900;color:var(--gold-warm)">${pct}%</div>
          <div style="font-family:var(--f-title);font-size:0.65rem;color:var(--xp-light);opacity:0.8">${svgStar()} ${phase.xp.toLocaleString('pt-BR')} XP</div>
        </div>
      </div>
      <div class="pb-track" style="margin:var(--sp-4) 0;height:12px">
        <div class="pb-fill${pct>=100?' ok':''}" data-w="${pct}" style="width:0%"></div>
      </div>
      <div style="display:flex;gap:var(--sp-5);flex-wrap:wrap;font-family:var(--f-title);font-size:0.65rem;color:var(--tx-dim);margin-bottom:var(--sp-4)">
        ${phState.startDate ? `<span>Inicio: ${fmtDate(phState.startDate)}</span>` : ''}
        ${phState.targetDate ? `<span style="color:${dLeft!==null&&dLeft<=14?'var(--warn)':'var(--tx-dim)'}">Prazo: ${fmtDate(phState.targetDate)}${dLeft!==null?` (${dLeft>=0?dLeft+' dias':'ATRASADA'})`:''}</span>` : ''}
        ${phState.completionDate ? `<span style="color:var(--ok-bright)">Concluida: ${fmtDate(phState.completionDate)}</span>` : ''}
      </div>
      <button class="btn-sm" onclick="openPhaseEdit(${phase.id})">Editar datas &rarr;</button>
    </div>

    <div class="divider"><div class="divider-line"></div><span class="divider-title">Missao Principal</span><div class="divider-line"></div></div>
    <div style="margin-bottom:var(--sp-6)">
      ${mainMissions.map(m => renderMissionCard(m, phase)).join('')}
    </div>

    <div class="divider"><div class="divider-line"></div><span class="divider-title">Missoes Secundarias</span><div class="divider-line"></div></div>
    <div>
      ${secMissions.map(m => renderMissionCard(m, phase)).join('')}
    </div>

    ${pct === 100 && phState.status !== 'completed' ? `
    <div style="margin-top:var(--sp-6);text-align:center">
      <button class="btn btn-ok" onclick="completePhase(${phase.id})">Concluir Fase ${phase.id} &rarr;</button>
    </div>` : ''}
  `;
}

function renderMissionCard(m, phase) {
  const done = S.missions[m.id]?.completed;
  const isMainActive = S.activeMission.main === m.id;
  const isSecActive = S.activeMission.secondary === m.id;

  return `<div class="mission-card m-${m.type}${done?' m-done':''}">
    <div class="m-inner">
      <div style="flex:1">
        <span class="mission-type-tag tag-${done?'ok':m.type}">${done ? '&#10003; Concluida' : m.type === 'main' ? 'Principal' : 'Secundaria'}</span>
        <div class="m-title">${m.title}</div>
        <div class="m-desc">${m.desc}</div>
        ${done && S.missions[m.id]?.completedDate ? `<div class="m-date">Concluida em ${fmtDate(S.missions[m.id].completedDate)}</div>` : ''}
        ${!done ? `<div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-top:var(--sp-3)">
          <button class="btn-set-active${isMainActive?' is-active-m':''}" onclick="setActiveMission('${m.id}','main')">
            ${isMainActive ? '&#10003; Missao Principal' : 'Definir como Principal'}
          </button>
          <button class="btn-set-active${isSecActive?' is-active-s':''}" onclick="setActiveMission('${m.id}','secondary')">
            ${isSecActive ? '&#10003; Missao Secundaria' : 'Definir como Secundaria'}
          </button>
        </div>` : ''}
      </div>
      <button class="m-check${done?' is-checked':''}"
        onclick="${done?`uncompleteM('${m.id}')`:`completeMission('${m.id}')`}"
        title="${done?'Desmarcar':'Marcar como concluida'}">
        ${done ? svgCheck() : ''}
      </button>
    </div>
  </div>`;
}

function renderFrozenMissions() {
  return `
    <div class="card-dk" style="margin-bottom:var(--sp-5)">
      <div class="card-dk-title">Missoes Congeladas</div>
      <p style="font-size:0.88rem;color:var(--tx-secondary);line-height:1.6;opacity:0.8">
        Esses objetivos nao sao prioridade agora &mdash; mas continuam visiveis.
        Voce pode avancar neles quando quiser, antes mesmo da fase correspondente chegar.
        O progresso e salvo automaticamente.
      </p>
    </div>
    <div>
      ${GAME_DATA.frozenMissions.map(fm => renderFrozenCard(fm)).join('')}
    </div>`;
}

function renderFrozenCard(fm) {
  const progress = S.frozenProgress[fm.id] || {};
  const total = fm.checklist.length;
  const done = fm.checklist.filter(c => progress[c.id]).length;
  const pct = Math.round(done / total * 100);

  return `<div class="frozen-card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2)">
      <div class="frozen-name">${fm.name}</div>
      <span class="mission-type-tag tag-frozen" style="font-size:0.58rem">${done}/${total}</span>
    </div>
    <div class="frozen-desc">${fm.desc}</div>
    <div class="pb-wrap" style="margin-bottom:var(--sp-4)">
      <div class="pb-track"><div class="pb-fill" style="background:linear-gradient(90deg,var(--xp),var(--xp-light));width:${pct}%"></div></div>
    </div>
    <div class="frozen-checklist">
      ${fm.checklist.map(c => {
        const isDone = progress[c.id] || false;
        return `<div class="frozen-item${isDone?' done':''}" onclick="toggleFrozen('${fm.id}','${c.id}')">
          <button class="frozen-cb${isDone?' done':''}">${isDone?svgCheck():''}</button>
          <span class="frozen-item-text">${c.task}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ============================
   HABILIDADES
   ============================ */

function renderHabilidades(el) {
  el = el || document.getElementById(`page-${currentPage}`);
  const totalPts = GAME_DATA.skills.reduce((acc, b) =>
    acc + b.skills.reduce((a, s) => a + (S.skills[b.id]?.[s.id] || 0), 0), 0);
  const maxPts = GAME_DATA.skills.reduce((acc, b) => acc + b.skills.length * 5, 0);
  const pct = Math.round(totalPts / maxPts * 100);

  el.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Arvore de Habilidades</h1>
      <p class="page-subtitle">Clique nos pontos para atualizar seu nivel em cada habilidade.</p>
    </div>

    <div class="card-dk" style="margin-bottom:var(--sp-6);text-align:center;padding:var(--sp-6)">
      <div class="card-dk-title">Dominio Geral &mdash; Marketing Digital</div>
      <div style="font-family:var(--f-title);font-size:2.5rem;font-weight:900;color:var(--gold-warm);margin:var(--sp-3) 0">${pct}%</div>
      <div class="pb-track" style="height:14px;max-width:480px;margin:0 auto var(--sp-3)">
        <div class="pb-fill" data-w="${pct}" style="width:0%"></div>
      </div>
      <div style="font-family:var(--f-title);font-size:0.65rem;color:var(--tx-dim)">${totalPts} / ${maxPts} pontos de habilidade</div>
    </div>

    <div style="text-align:center;margin-bottom:var(--sp-6)">
      <div class="trunk-node">Marketing Digital</div>
    </div>

    <div class="g-3">
      ${GAME_DATA.skills.map(b => renderBranch(b)).join('')}
    </div>
  `;
  animateBars(el);
}

function renderBranch(branch) {
  const bs = S.skills[branch.id] || {};
  const pts = branch.skills.reduce((a, s) => a + (bs[s.id] || 0), 0);
  const max = branch.skills.length * 5;
  const pct = Math.round(pts / max * 100);

  return `<div class="branch-card">
    <div class="branch-hd">
      <div>
        <div class="branch-hd-name">${branch.name}</div>
        <div class="branch-hd-sub">${pts}/${max} pontos &mdash; ${pct}%</div>
      </div>
    </div>
    <div class="pb-track" style="height:5px;margin-bottom:var(--sp-4)">
      <div class="pb-fill" data-w="${pct}" style="width:0%"></div>
    </div>
    <div>
      ${branch.skills.map(skill => {
        const lvl = bs[skill.id] || 0;
        return `<div class="skill-row" title="${skill.name} — Nivel ${lvl}/5">
          <span class="skill-name">${skill.name}</span>
          <div class="skill-dots">
            ${[1,2,3,4,5].map(i =>
              `<div class="sdot${lvl >= i ? ' filled' : ''}"
                onclick="setSkillLevel('${branch.id}','${skill.id}',${lvl===i?i-1:i});renderHabilidades()"
                title="Nivel ${i}"></div>`
            ).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ============================
   FINANCAS
   ============================ */

function renderFinancas(el) {
  el = el || document.getElementById(`page-${currentPage}`);
  const renda = S.finances['renda_mensal'] || { amount: 0, target: 500 };
  const rendaPct = renda.target ? Math.min(100, Math.round(renda.amount / renda.target * 100)) : 0;

  el.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Financas</h1>
      <p class="page-subtitle">Cada caixa e independente. Clareza financeira e o primeiro passo para a liberdade.</p>
    </div>

    <div class="mq-card" style="margin-bottom:var(--sp-6)">
      <div class="mq-header">
        <div class="mq-icon">${svgFinanceIcon()}</div>
        <div>
          <div class="mq-label">Meta Principal</div>
          <div class="mq-name">Renda Mensal Propria</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--f-title);font-size:1.6rem;font-weight:900;color:var(--pg-lightest)">
            <span style="color:var(--gold-warm);font-size:0.9rem">R$</span>${fmtMoney(renda.amount)}
          </div>
          <div style="font-family:var(--f-title);font-size:0.65rem;color:var(--tx-dim)">meta R$${fmtMoney(renda.target)}</div>
        </div>
      </div>
      <div class="mq-track">
        <div class="mq-fill" data-w="${rendaPct}" style="width:0%"></div>
        <div class="mq-pct">${rendaPct}%</div>
      </div>
      <div style="margin-top:var(--sp-4);text-align:right">
        <button class="btn-sm" onclick="openFinanceEdit('renda_mensal')">Atualizar &rarr;</button>
      </div>
    </div>

    <div class="divider"><div class="divider-line"></div><span class="divider-title">Caixas Financeiros</span><div class="divider-line"></div></div>
    <div class="g-3" style="margin-bottom:var(--sp-6)">
      ${GAME_DATA.finances.filter(f => f.id !== 'renda_mensal').map(f => renderFinanceCard(f)).join('')}
    </div>

    <div class="card-dk">
      <div class="card-dk-title">Resumo</div>
      <div class="g-3">
        ${renderFinanceSummary()}
      </div>
    </div>
  `;
  animateBars(el);
}

function renderFinanceCard(fd) {
  const fi = S.finances[fd.id] || { amount: 0, target: fd.defaultTarget };
  const pct = fi.target ? Math.min(100, Math.round(fi.amount / fi.target * 100)) : null;

  return `<div class="finance-card">
    <div class="fi-icon">${svgFinanceIcon()}</div>
    <div class="fi-label">${fd.label}</div>
    <div class="fi-amount"><span class="fi-cur">R$</span>${fmtMoney(fi.amount)}</div>
    <div class="fi-target">${fi.target ? `Meta: R$${fmtMoney(fi.target)}` : 'Sem meta definida'}</div>
    ${pct !== null ? `<div class="pb-track" style="margin-bottom:var(--sp-4)">
      <div class="pb-fill${pct>=100?' ok':''}" data-w="${pct}" style="width:0%"></div>
    </div>` : '<div style="height:var(--sp-4)"></div>'}
    <button class="btn-sm" onclick="openFinanceEdit('${fd.id}')">Atualizar &rarr;</button>
  </div>`;
}

function renderFinanceSummary() {
  const total = Object.values(S.finances).reduce((a, f) => a + (f.amount || 0), 0);
  const reserva = S.finances['reserva']?.amount || 0;
  const invest = S.finances['investimentos']?.amount || 0;
  return [
    ['Patrimonio Total', total],
    ['Reserva Atual', reserva],
    ['Investimentos', invest],
  ].map(([label, val]) => `<div style="text-align:center;padding:var(--sp-4)">
    <div style="font-family:var(--f-title);font-size:0.62rem;color:var(--tx-gold);letter-spacing:0.15em;text-transform:uppercase;opacity:0.7;margin-bottom:var(--sp-2)">${label}</div>
    <div style="font-family:var(--f-title);font-size:1.35rem;font-weight:900;color:var(--tx-primary)"><span style="color:var(--gold-warm);font-size:0.85rem">R$</span>${fmtMoney(val)}</div>
  </div>`).join('');
}

/* ============================
   CONQUISTAS
   ============================ */

function renderConquistas(el) {
  el = el || document.getElementById(`page-${currentPage}`);
  const unlocked = GAME_DATA.achievements.filter(a => S.achievements[a.id]?.unlocked);
  const total = GAME_DATA.achievements.length;
  const pct = Math.round(unlocked.length / total * 100);

  el.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Conquistas</h1>
      <p class="page-subtitle">Cada conquista e a prova de que voce estava aqui e foi alem.</p>
    </div>

    <div class="card-dk" style="text-align:center;padding:var(--sp-7);margin-bottom:var(--sp-6)">
      <div class="card-dk-title">Sala dos Trofeus</div>
      <div style="font-family:var(--f-title);font-size:2.8rem;font-weight:900;color:var(--gold-warm);margin:var(--sp-3) 0">${unlocked.length} <span style="font-size:1.2rem;opacity:0.4">/ ${total}</span></div>
      <div class="pb-track" style="max-width:360px;margin:0 auto;height:10px">
        <div class="pb-fill" data-w="${pct}" style="width:0%"></div>
      </div>
    </div>

    ${unlocked.length > 0 ? `
    <div class="divider"><div class="divider-line"></div><span class="divider-title">Desbloqueadas</span><div class="divider-line"></div></div>
    <div class="ach-grid" style="margin-bottom:var(--sp-7)">
      ${unlocked.map(a => renderAchBadge(a, true)).join('')}
    </div>` : ''}

    <div class="divider"><div class="divider-line"></div><span class="divider-title">Bloqueadas</span><div class="divider-line"></div></div>
    <div class="ach-grid" style="margin-bottom:var(--sp-6)">
      ${GAME_DATA.achievements.filter(a => !S.achievements[a.id]?.unlocked).map(a => renderAchBadge(a, false)).join('')}
    </div>

    <div class="divider"><div class="divider-line"></div><span class="divider-title">Desbloquear Manualmente</span><div class="divider-line"></div></div>
    <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
      ${GAME_DATA.achievements.filter(a => !S.achievements[a.id]?.unlocked).map(a =>
        `<button class="btn-sm" onclick="unlockAchievement('${a.id}');renderConquistas()">${a.name}</button>`
      ).join('')}
    </div>
  `;
  animateBars(el);
}

function renderAchBadge(a, unlocked) {
  const st = S.achievements[a.id];
  const initials = a.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  return `<div class="ach-badge is-${unlocked?'unlocked':'locked'}" title="${a.desc}">
    <div class="ach-icon">${initials}</div>
    <div class="ach-name">${a.name}</div>
    ${unlocked && st?.unlockedDate ? `<div class="ach-date">${fmtDate(st.unlockedDate)}</div>` : ''}
  </div>`;
}

/* ============================
   MODALS
   ============================ */

function openPhaseEdit(pid) {
  const ph = GAME_DATA.phases.find(p => p.id === pid);
  const st = S.phases[pid];
  showModal(`
    <div class="modal-title">${ph.name} &mdash; Datas</div>
    <div class="form-group">
      <label class="form-label">Data de Inicio</label>
      <input type="date" class="form-input" id="ph-start" value="${st.startDate||''}">
    </div>
    <div class="form-group">
      <label class="form-label">Prazo Desejado (opcional)</label>
      <input type="date" class="form-input" id="ph-target" value="${st.targetDate||''}">
    </div>
    ${st.status === 'completed' ? `<div class="form-group">
      <label class="form-label">Data de Conclusao</label>
      <input type="date" class="form-input" id="ph-done" value="${st.completionDate||''}">
    </div>` : ''}
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-gold" onclick="savePhaseEdit(${pid})">Salvar</button>
    </div>`);
}

function savePhaseEdit(pid) {
  const s = document.getElementById('ph-start')?.value;
  const t = document.getElementById('ph-target')?.value;
  const d = document.getElementById('ph-done')?.value;
  if (s) S.phases[pid].startDate = s;
  S.phases[pid].targetDate = t || null;
  if (d) S.phases[pid].completionDate = d;
  saveState(); closeModal();
  toast('Fase atualizada', 'As datas foram salvas.');
  refreshCurrentPage();
}

function openFinanceEdit(id) {
  const fd = GAME_DATA.finances.find(f => f.id === id);
  const fi = S.finances[id] || { amount: 0, target: fd?.defaultTarget, notes: '' };
  showModal(`
    <div class="modal-title">${fd.label}</div>
    <div class="form-group">
      <label class="form-label">Valor Atual (R$)</label>
      <input type="number" class="form-input" id="fi-amount" value="${fi.amount||0}" min="0" step="0.01">
    </div>
    <div class="form-group">
      <label class="form-label">Meta (R$) &mdash; Deixe vazio para sem meta</label>
      <input type="number" class="form-input" id="fi-target" value="${fi.target||''}" min="0" step="0.01">
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <input type="text" class="form-input" id="fi-notes" value="${fi.notes||''}" placeholder="Observacoes...">
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-gold" onclick="saveFinanceEdit('${id}')">Salvar</button>
    </div>`);
}

function saveFinanceEdit(id) {
  updateFinance(
    id,
    document.getElementById('fi-amount')?.value,
    document.getElementById('fi-target')?.value,
    document.getElementById('fi-notes')?.value
  );
  closeModal();
  toast('Financas atualizadas', 'Valores salvos.');
  refreshCurrentPage();
}

function showModal(content) {
  document.getElementById('modal-container').innerHTML = `
    <div class="modal-overlay" onclick="closeModalIfBg(event)">
      <div class="modal">
        <button class="modal-close" onclick="closeModal()">&#10005;</button>
        ${content}
      </div>
    </div>`;
}

function closeModalIfBg(e) { if (e.target.classList.contains('modal-overlay')) closeModal(); }
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

/* ============================
   TOAST
   ============================ */

function toast(title, msg, ms = 4200) {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}`;
  c.appendChild(el);
  setTimeout(() => { el.classList.add('exit'); setTimeout(() => el.remove(), 320); }, ms);
}

/* ============================
   BOOT
   ============================ */

/* ============================
   AUTH
   ============================ */

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'granted';
}

async function attemptLogin() {
  const val = (document.getElementById('login-input')?.value || '').trim();
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  if (hash === AUTH_HASH) {
    localStorage.setItem(AUTH_KEY, 'granted');
    initApp();
  } else {
    const err = document.getElementById('login-err');
    if (err) err.style.display = 'block';
    const inp = document.getElementById('login-input');
    if (inp) { inp.value = ''; inp.focus(); }
  }
}

function doLogout() {
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}

function showLoginScreen() {
  document.getElementById('main-nav').style.display = 'none';
  const app = document.getElementById('app');
  app.style.cssText = 'padding-top:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;';
  app.innerHTML = `
    <div style="
      background:linear-gradient(150deg,#f7ecd4 0%,#f0e0bc 100%);
      border:1.5px solid #d4b888;border-radius:20px;
      padding:2.8rem 2.2rem;max-width:360px;width:100%;
      text-align:center;position:relative;overflow:hidden;
      box-shadow:0 8px 40px rgba(26,10,0,0.65),0 0 50px rgba(196,148,32,0.18);">

      <div style="position:absolute;top:0;left:0;right:0;height:3px;
        background:linear-gradient(90deg,#8a6010,#d8a830,#f0cc68,#d8a830,#8a6010)"></div>
      <div style="position:absolute;inset:8px;border:1px solid rgba(184,142,80,0.16);
        border-radius:14px;pointer-events:none"></div>

      <div style="width:74px;height:74px;margin:0 auto 1.5rem;border-radius:50%;
        background:linear-gradient(135deg,#5a3c08,#c49420,#d8a830);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 28px rgba(196,148,32,0.5),0 4px 14px rgba(26,10,0,0.4);">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
          <polygon points="16,2 13,25 16,29 19,25" fill="#f0e8c8"/>
          <line x1="16" y1="3" x2="16" y2="25" stroke="rgba(255,240,128,0.45)" stroke-width="2"/>
          <rect x="5" y="25" width="22" height="5" rx="2.5" fill="#f0e8c8"/>
          <rect x="14" y="30" width="4" height="8" rx="2" fill="#c4a060"/>
          <ellipse cx="16" cy="40" rx="5" ry="3.5" fill="#f0e8c8"/>
          <circle cx="16" cy="3.5" r="2" fill="rgba(255,248,160,0.9)"/>
        </svg>
      </div>

      <h1 style="font-family:'Cinzel','Georgia',serif;font-size:1.2rem;font-weight:900;
        color:#2a1608;letter-spacing:0.14em;margin-bottom:0.4rem;line-height:1.2">
        RPG DA LIBERDADE
      </h1>
      <p style="font-size:0.8rem;color:#6a4020;font-style:italic;margin-bottom:1.8rem;opacity:0.75">
        Sua jornada. Seu espaco.
      </p>

      <div id="login-err" style="display:none;
        background:rgba(138,48,40,0.07);border:1px solid rgba(138,48,40,0.22);
        border-radius:8px;color:#7a2a20;font-size:0.78rem;
        padding:8px 12px;margin-bottom:1rem;
        font-family:'Lora','Georgia',serif">
        Senha incorreta. Tente novamente.
      </div>

      <input type="password" id="login-input"
        placeholder="Senha" autocomplete="current-password"
        autocorrect="off" autocapitalize="off" spellcheck="false"
        style="width:100%;padding:12px 16px;
          background:rgba(42,22,8,0.05);
          border:1.5px solid rgba(42,22,8,0.16);
          border-radius:8px;color:#2a1608;
          font-family:'Lora','Georgia',serif;font-size:1rem;
          margin-bottom:1rem;text-align:center;
          outline:none;box-sizing:border-box;"
        onfocus="this.style.borderColor='#d8a830';this.style.background='rgba(42,22,8,0.03)'"
        onblur="this.style.borderColor='rgba(42,22,8,0.16)'"
        onkeydown="if(event.key==='Enter')attemptLogin()">

      <button onclick="attemptLogin()"
        style="width:100%;padding:12px;
          background:linear-gradient(135deg,#8a6010,#d8a830);
          border:1.5px solid #d8a830;border-radius:8px;
          color:#1e1208;font-family:'Cinzel','Georgia',serif;
          font-size:0.76rem;font-weight:700;letter-spacing:0.14em;
          text-transform:uppercase;cursor:pointer;
          box-shadow:0 0 20px rgba(196,148,32,0.3)">
        Entrar na Jornada
      </button>
    </div>`;

  setTimeout(() => document.getElementById('login-input')?.focus(), 150);
}

/* ============================
   BOOT
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated()) { showLoginScreen(); return; }
  initApp();
});

function initApp() {
  document.getElementById('main-nav').removeAttribute('style');
  const app = document.getElementById('app');
  app.removeAttribute('style');
  loadState();
  renderNav();
  const activePhase = GAME_DATA.phases.find(p => S.phases[p.id]?.status === 'active');
  if (activePhase) activeMissionPhase = activePhase.id;
  go('home');
}
