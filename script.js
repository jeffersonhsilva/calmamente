// ======================== STATE ========================
const state = {
  plan: localStorage.getItem('cm_plan') || 'free',
  theme: localStorage.getItem('cm_theme') || 'light',
  moodEntries: JSON.parse(localStorage.getItem('cm_moods')) || [],
  cbtEntries: JSON.parse(localStorage.getItem('cm_cbt')) || [],
  gratitudeEntries: JSON.parse(localStorage.getItem('cm_grat')) || [],
  habitData: JSON.parse(localStorage.getItem('cm_habits')) || {},
  sleepData: JSON.parse(localStorage.getItem('cm_sleep')) || [],
  videoViews: parseInt(localStorage.getItem('cm_video_views')) || 0,
  breathRunning: false, breathTimer: null, breathPhase: 0, breathCycle: 0,
  pomRunning: false, pomSeconds: 1500, pomTotal: 1500, pomPhase: 'focus', pomCycles: 0, pomTimer: null,
  sosRunning: false, sosStep: 0,
};

const tiers = { free: 0, plus: 1, premium: 2 };

function hasAccess(requiredTier) {
  const userTier = tiers[state.plan] || 0;
  const reqTier = tiers[requiredTier] || 0;
  if (userTier >= reqTier) return true;
  openModal(requiredTier);
  return false;
}

// ======================== PLAN MGMT ========================
function savePlan(plan) {
  state.plan = plan;
  localStorage.setItem('cm_plan', plan);
  const labels = { free: 'Grátis', plus: 'Plus', premium: 'Premium' };
  document.getElementById('planBadge').textContent = labels[plan] || 'Grátis';
  document.getElementById('currentPlanText').textContent = labels[plan] || 'Grátis';
  renderPlans();
  updateAllTieredElements();
  updateDashboard();
}

function updateAllTieredElements() {
  const userTier = tiers[state.plan] || 0;

  // Plus features
  document.querySelectorAll('.tier-plus, .tier-plus-btn').forEach(el => {
    if (userTier >= 1) {
      el.classList.remove('tier-plus', 'tier-plus-btn');
      if (el.tagName === 'BUTTON') el.disabled = false;
    } else {
      el.addEventListener('click', function lockClick(e) {
        if (el.classList.contains('tier-plus') || el.classList.contains('tier-plus-btn')) {
          e.preventDefault();
          openModal('plus');
        }
      });
    }
  });

  // Premium features
  document.querySelectorAll('.tier-premium, .tier-premium-item, .tier-premium-store').forEach(el => {
    if (userTier >= 2) {
      el.classList.remove('tier-premium', 'tier-premium-item', 'tier-premium-store');
      if (el.tagName === 'BUTTON') el.disabled = false;
    } else {
      el.addEventListener('click', function lockClick(e) {
        if (el.classList.contains('tier-premium') || el.classList.contains('tier-premium-item') || el.classList.contains('tier-premium-store')) {
          e.preventDefault();
          openModal('premium');
        }
      });
    }
  });
}

// ======================== MODAL ========================
function openModal(targetPlan) {
  const modal = document.getElementById('upgradeModal');
  const title = document.getElementById('modalTitle');
  const desc = document.getElementById('modalDesc');
  const info = document.getElementById('modalPlanInfo');
  const btn = document.getElementById('confirmUpgrade');

  const planLabels = { plus: 'Plus (R$ 9,90/mês)', premium: 'Premium (R$ 19,90/mês)' };
  const planDescs = { plus: 'Acesse CBT, Gratidão, Sono Avançado e muito mais!', premium: 'Acesso ILIMITADO a TODAS as ferramentas e conteúdo exclusivo!' };

  if (targetPlan === 'plus') {
    title.textContent = 'Assinar Plus';
    desc.textContent = planDescs.plus;
    info.textContent = planLabels.plus;
    btn.dataset.target = 'plus';
  } else {
    title.textContent = 'Assinar Premium';
    desc.textContent = planDescs.premium;
    info.textContent = planLabels.premium;
    btn.dataset.target = 'premium';
  }

  // If already plus and clicking premium, show premium
  if (state.plan === 'plus' && targetPlan === 'premium') {
    title.textContent = 'Fazer Upgrade para Premium';
    desc.textContent = planDescs.premium;
    info.textContent = planLabels.premium;
    btn.dataset.target = 'premium';
  }

  modal.style.display = 'flex';
}

document.getElementById('confirmUpgrade').addEventListener('click', () => {
  const target = document.getElementById('confirmUpgrade').dataset.target || 'premium';
  const planLabel = target === 'plus' ? 'Plus (R$ 9,90/mês)' : 'Premium (R$ 19,90/mês)';
  const price = target === 'plus' ? '9.90' : '19.90';
  document.getElementById('upgradeModal').style.display = 'none';
  openCheckout(planLabel, price);
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('upgradeModal').style.display = 'none';
});

document.getElementById('upgradeModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('upgradeModal').style.display = 'none';
});

// ======================== NAVIGATION ========================
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const pageTitles = {
  dashboard:'Dashboard', sos:'SOS', breathing:'Respiração', mood:'Diário de Humor',
  cbt:'Pensamentos', gratitude:'Gratidão', habits:'Hábitos', sleep:'Sono',
  pomodoro:'Foco', programas:'Programas', testes:'Testes',
  videos:'Vídeos', store:'Recomendações',
  progress:'Progresso', plans:'Planos', settings:'Ajustes'
};

function showPage(id) {
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-'+id);
  if (target) target.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[id] || id;
  navItems.forEach(n => n.classList.toggle('active', n.dataset.page === id));
  document.querySelector('.menu-toggle').textContent = '\u2630';

  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');

  if (id === 'dashboard') { updateDashboard(); renderMiniChart(); renderDailyTip(); }
  if (id === 'mood') renderMoodChart();
  if (id === 'cbt') renderCbtList();
  if (id === 'gratitude') renderGratList();
  if (id === 'habits') renderHabits();
  if (id === 'programas') renderPrograms();
  if (id === 'testes') renderTests();
  if (id === 'videos') renderVideos();
  if (id === 'progress') { updateProgress(); renderProgressChart(); renderAchievements(); }
  if (id === 'plans') renderPlans();
}

navItems.forEach(n => n.addEventListener('click', e => { e.preventDefault(); showPage(n.dataset.page); }));
document.querySelectorAll('[data-page]').forEach(el => {
  if (el.dataset.page && !el.classList.contains('nav-item')) {
    el.addEventListener('click', () => showPage(el.dataset.page));
  }
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.addEventListener('click', e => {
  const s = document.getElementById('sidebar');
  if (!s.contains(e.target) && !e.target.closest('.menu-toggle') && window.innerWidth <= 768) s.classList.remove('open');
});

// ======================== THEME ========================
function applyTheme(t) {
  state.theme = t;
  const palette = state.palette || 'default';
  document.documentElement.setAttribute('data-theme', t);
  if (palette === 'default') {
    document.documentElement.removeAttribute('data-palette');
  } else {
    document.documentElement.setAttribute('data-palette', palette);
  }
  localStorage.setItem('cm_theme', t);
  document.getElementById('themeToggle').textContent = t === 'dark' ? '\u2600' : '\u263E';
  document.getElementById('darkModeToggle').checked = t === 'dark';
  renderMiniChart(); renderMoodChart(); renderProgressChart();
}

function applyPalette(p) {
  state.palette = p;
  localStorage.setItem('cm_palette', p);
  if (p === 'default') {
    document.documentElement.removeAttribute('data-palette');
  } else {
    document.documentElement.setAttribute('data-palette', p);
  }
  const select = document.getElementById('themeSelect');
  if (select) select.value = p;
  renderMiniChart(); renderMoodChart(); renderProgressChart();
}

state.palette = localStorage.getItem('cm_palette') || 'ocean';
applyTheme(state.theme);
applyPalette(state.palette);

document.getElementById('themeToggle').addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
document.getElementById('darkModeToggle').addEventListener('change', function() { applyTheme(this.checked ? 'dark' : 'light'); });

document.getElementById('themeSelect').addEventListener('change', function() {
  applyPalette(this.value);
});

// ======================== AFFIRMATIONS ========================
const affirmations = [
  "Você é mais forte do que imagina.", "Respire. Isso vai passar.",
  "Você não está sozinho(a).", "Seu melhor é o suficiente.",
  "Acalme sua mente. Você está seguro(a).", "Cada passo, por menor que seja, importa.",
  "Você merece paz e autocuidado.", "Não existe progresso sem recomeços.",
  "Confie no seu próprio tempo.", "Você já superou tantas coisas.",
  "O agora é o único momento que importa.", "Seja gentil com você mesmo(a).",
  "Seus sentimentos são válidos.", "Desacelerar também é avançar.",
  "A cura não é linear, e tudo bem.", "Você é digno de amor e respeito.",
  "Pequenas vitórias também contam.", "Hoje é um novo dia.",
  "Permita-se descansar.", "Sua história ainda está sendo escrita.",
];

function setDailyAffirmation() {
  const day = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  document.getElementById('dailyAffirmation').textContent = '\u201C' + affirmations[day % affirmations.length] + '\u201D';
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
document.getElementById('greetingText').textContent = getGreeting() + ', vamos cuidar de você hoje?';
setDailyAffirmation();

// ======================== DASHBOARD ========================
function countConsecutiveDays(entries) {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map(e => new Date(e.date).toDateString()))].sort((a,b) => new Date(b) - new Date(a));
  if (!dates.length) return 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now()-86400000).toDateString();
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i=1; i<dates.length; i++) {
    const diff = (new Date(dates[i-1]) - new Date(dates[i])) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

function updateDashboard() {
  document.getElementById('statStreak').textContent = countConsecutiveDays(state.moodEntries);
  document.getElementById('statMoods').textContent = state.moodEntries.length;
  document.getElementById('statVideos').textContent = state.videoViews;
}

// ======================== MINI CHART ========================
function renderMiniChart() {
  const canvas = document.getElementById('miniChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width - 32;
  canvas.width = w * dpr; canvas.height = 120 * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = '120px';
  ctx.scale(dpr, dpr);

  const moodVals = {otimo:5,bem:4,neutro:3,triste:2,ansioso:1};
  const isDark = state.theme === 'dark';
  const entries = state.moodEntries.slice(0,14).reverse();

  ctx.clearRect(0,0,w,120);
  if (entries.length < 2) {
    ctx.fillStyle = isDark ? '#b0a0c8' : '#7a6a92';
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Registre humores para ver seu gráfico', w/2, 60);
    return;
  }

  const pad = 20, cw = w - pad*2, ch = 80;
  const lineColor = isDark?'#9b7fd4':'#7c5cbf';
  entries.forEach((e,i) => {
    const x = pad + (i/(entries.length-1))*cw;
    const y = pad + ch - ((moodVals[e.mood]||3)/5)*ch;
    ctx.fillStyle = lineColor;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2); ctx.fill();
    if (i > 0) {
      const px = pad + ((i-1)/(entries.length-1))*cw;
      const py = pad + ch - ((moodVals[entries[i-1].mood]||3)/5)*ch;
      ctx.strokeStyle = isDark?'rgba(155,127,212,0.4)':'rgba(124,92,191,0.3)';
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    }
  });
}

// ======================== SOS ========================
const sosSteps = [
  'Veja ao redor: 5 coisas que você pode VER.',
  'Agora 4 coisas que você pode TOCAR.',
  'Escute: 3 sons que você pode OUVIR.',
  'Sinta: 2 cheiros que você pode SENTIR.',
  '1 sabor que você pode SABOREAR.',
  'Você está seguro(a). Respire fundo. Isso vai passar.',
];

document.getElementById('sosButton').addEventListener('click', () => {
  state.sosRunning = true; state.sosStep = 0;
  document.getElementById('sosExercise').style.display = 'block';
  document.getElementById('sosButton').style.display = 'none';
  updateSosStep();
});

document.getElementById('sosNext').addEventListener('click', () => {
  if (!state.sosRunning) return;
  state.sosStep++;
  if (state.sosStep >= sosSteps.length) {
    state.sosRunning = false;
    document.getElementById('sosExercise').style.display = 'none';
    document.getElementById('sosButton').style.display = 'flex';
    return;
  }
  updateSosStep();
});

document.getElementById('sosStop').addEventListener('click', () => {
  state.sosRunning = false;
  document.getElementById('sosExercise').style.display = 'none';
  document.getElementById('sosButton').style.display = 'flex';
});

function updateSosStep() {
  document.getElementById('sosStep').textContent = sosSteps[state.sosStep];
  document.getElementById('sosProgress').style.width = ((state.sosStep+1)/sosSteps.length*100)+'%';
}

document.getElementById('setEmergencyContact').addEventListener('click', () => {
  const name = prompt('Nome do contato de confiança:');
  if (!name) return;
  const phone = prompt('Telefone (com DDD):');
  if (!phone) return;
  localStorage.setItem('cm_emergency_name', name);
  localStorage.setItem('cm_emergency_phone', phone);
  showEmergencyContact();
});

function showEmergencyContact() {
  const name = localStorage.getItem('cm_emergency_name');
  const phone = localStorage.getItem('cm_emergency_phone');
  const el = document.getElementById('emergencyContactDisplay');
  el.textContent = (name && phone) ? 'Seu contato: ' + name + ' - ' + phone : '';
}
showEmergencyContact();

// ======================== BREATHING ========================
const circle = document.getElementById('breathCircle');
const breathText = document.getElementById('breathText');
const breathStartBtn = document.getElementById('startBreath');
const breathCycles = document.getElementById('breathCycles');
const cycleCountEl = document.getElementById('cycleCount');
const totalCyclesEl = document.getElementById('totalCycles');

const breathTypes = {
  square: [{n:'Inspire',d:4000},{n:'Segure',d:4000},{n:'Expire',d:4000},{n:'Segure',d:4000}],
  '478': [{n:'Inspire',d:4000},{n:'Segure',d:7000},{n:'Expire',d:8000}],
  box: [{n:'Inspire',d:4000},{n:'Segure',d:4000},{n:'Expire',d:4000},{n:'Segure',d:4000}],
  relaxamento: [{n:'Inspire',d:5000},{n:'Segure',d:2000},{n:'Expire',d:6000},{n:'Pausa',d:2000}],
};

let currentBreathPattern = 'square';

document.querySelectorAll('.breath-type').forEach(b => {
  b.addEventListener('click', () => {
    if (b.dataset.type === 'relaxamento' && !hasAccess('plus')) return;
    document.querySelectorAll('.breath-type').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    currentBreathPattern = b.dataset.type;
    if (!state.breathRunning) stopBreathing();
  });
});

function runBreath() {
  if (!state.breathRunning) return;
  const pattern = breathTypes[currentBreathPattern];
  if (!pattern) return;
  const phase = pattern[state.breathPhase];
  breathText.textContent = phase.n;
  if (phase.n === 'Pausa') {
    circle.className = 'breathing-circle hold';
  } else {
    circle.className = 'breathing-circle ' + (phase.n === 'Inspire' ? 'inhale' : phase.n === 'Expire' ? 'exhale' : 'hold');
  }

  state.breathTimer = setTimeout(() => {
    state.breathPhase++;
    if (state.breathPhase >= pattern.length) {
      state.breathPhase = 0;
      state.breathCycle++;
      cycleCountEl.textContent = state.breathCycle;
      if (state.breathCycle >= parseInt(breathCycles.value)) {
        stopBreathing();
        breathText.textContent = 'Concluído!';
        circle.className = 'breathing-circle idle';
        return;
      }
    }
    runBreath();
  }, phase.d);
}

function startBreathing() {
  if (state.breathRunning) return;
  state.breathRunning = true; state.breathPhase = 0; state.breathCycle = 0;
  cycleCountEl.textContent = '0'; totalCyclesEl.textContent = breathCycles.value;
  breathStartBtn.textContent = 'Parar'; runBreath();
}

function stopBreathing() {
  state.breathRunning = false; clearTimeout(state.breathTimer);
  breathStartBtn.textContent = 'Iniciar';
  circle.className = 'breathing-circle idle'; breathText.textContent = 'Inspire';
}

breathStartBtn.addEventListener('click', () => state.breathRunning ? stopBreathing() : startBreathing());
circle.className = 'breathing-circle idle';

// ======================== MOOD ========================
const moodVals = {otimo:5,bem:4,neutro:3,triste:2,ansioso:1};
const moodEmojis = {otimo:'\u{1F601}',bem:'\u{1F60A}',neutro:'\u{1F610}',triste:'\u{1F61E}',ansioso:'\u{1F630}'};
const moodLabels = {otimo:'Ótimo',bem:'Bem',neutro:'Neutro',triste:'Triste',ansioso:'Ansioso'};
let selectedMood = null;

document.querySelectorAll('.mood-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected'); selectedMood = b.dataset.mood;
  });
});

document.getElementById('saveMood').addEventListener('click', () => {
  if (!selectedMood) { alert('Selecione como você está.'); return; }
  state.moodEntries.unshift({mood:selectedMood, note:document.getElementById('moodNote').value.trim(), date:new Date().toISOString()});
  localStorage.setItem('cm_moods', JSON.stringify(state.moodEntries));
  renderMoodList(); renderMoodChart(); renderMiniChart(); updateDashboard();
  selectedMood = null;
  document.querySelectorAll('.mood-btn').forEach(x => x.classList.remove('selected'));
  document.getElementById('moodNote').value = '';
});

function renderMoodList() {
  const list = document.getElementById('moodList');
  if (!state.moodEntries.length) { list.innerHTML = '<p style="color:var(--text-light);font-size:0.9rem">Nenhum registro ainda.</p>'; return; }
  list.innerHTML = state.moodEntries.map((e,i) => `
    <div class="mood-entry">
      <div class="mood-emoji">${moodEmojis[e.mood]||'\u{1F610}'}</div>
      <div class="mood-body"><strong>${moodLabels[e.mood]||e.mood}</strong>${e.note?'<div class="mood-note">'+escHtml(e.note)+'</div>':''}<div class="mood-date">${new Date(e.date).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div></div>
      <button class="delete-mood" data-i="${i}">&times;</button>
    </div>`).join('');
  list.querySelectorAll('.delete-mood').forEach(b => b.addEventListener('click', () => {
    state.moodEntries.splice(parseInt(b.dataset.i),1);
    localStorage.setItem('cm_moods', JSON.stringify(state.moodEntries));
    renderMoodList(); renderMoodChart(); renderMiniChart(); updateDashboard();
  }));
}

function escHtml(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

function renderMoodChart() {
  const canvas = document.getElementById('moodChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio||1;
  const w = canvas.parentElement.clientWidth;
  canvas.width = w*dpr; canvas.height = 200*dpr;
  canvas.style.width = w+'px'; canvas.style.height = '200px';
  ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,200);

  const entries = state.moodEntries;
  if (!entries.length) {
    ctx.fillStyle = state.theme==='dark'?'#b0a0c8':'#7a6a92';
    ctx.font='13px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Registre humores para ver o gráfico',w/2,100);
    return;
  }

  const days = [];
  for (let i=6;i>=0;i--) { const d=new Date(); d.setDate(d.getDate()-i); days.push(d.toDateString()); }
  const avgs = days.map(d => {
    const e = entries.filter(x => new Date(x.date).toDateString() === d);
    return e.length ? e.reduce((s,x)=>s+(moodVals[x.mood]||3),0)/e.length : null;
  });

  const pad=30, cw=w-pad*2, ch=140, isDark=state.theme==='dark';
  const lineColor = isDark?'#9b7fd4':'#7c5cbf';
  const fillColor = isDark?'rgba(155,127,212,0.15)':'rgba(124,92,191,0.1)';
  const textColor = isDark?'#b0a0c8':'#7a6a92';
  const gridColor = isDark?'rgba(155,127,212,0.12)':'rgba(124,92,191,0.1)';

  ctx.strokeStyle = gridColor; ctx.lineWidth=1; ctx.setLineDash([4,4]);
  for (let v=1;v<=5;v++) {
    const y = pad+ch-(v/5)*ch;
    ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke();
    ctx.fillStyle=textColor; ctx.font='9px sans-serif'; ctx.textAlign='right';
    ctx.fillText({1:'Ans',2:'Tri',3:'Neu',4:'Bem',5:'Ót'}[v],pad-4,y+3);
  }
  ctx.setLineDash([]);

  const barGap = cw/7, barW = Math.min(28, barGap-8);
  avgs.forEach((v,i) => {
    if (v===null) return;
    const x = pad+i*barGap+(barGap-barW)/2;
    const h = (v/5)*ch;
    const y = pad+ch-h;
    const grad = ctx.createLinearGradient(x,y,x,pad+ch);
    grad.addColorStop(0,lineColor); grad.addColorStop(1,fillColor);
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.moveTo(x,y+4); ctx.arcTo(x,y,x+4,y,4);
    ctx.lineTo(x+barW-4,y); ctx.arcTo(x+barW,y,x+barW,y+4,4);
    ctx.lineTo(x+barW,pad+ch); ctx.lineTo(x,pad+ch); ctx.closePath(); ctx.fill();
    ctx.fillStyle=lineColor; ctx.beginPath(); ctx.arc(x+barW/2, y, 4, 0, Math.PI*2); ctx.fill();
  });

  const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  days.forEach((d,i) => {
    ctx.fillStyle=textColor; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(weekDays[new Date(d).getDay()], pad+i*barGap+barGap/2, 192);
  });
}

renderMoodList();

// ======================== CBT ========================
document.getElementById('saveCbt').addEventListener('click', () => {
  if (!hasAccess('plus')) return;
  const entry = {
    auto: document.getElementById('cbtAuto').value,
    distortion: document.getElementById('cbtDistortion').value,
    evidence: document.getElementById('cbtEvidence').value,
    counter: document.getElementById('cbtCounter').value,
    alternative: document.getElementById('cbtAlternative').value,
    date: new Date().toISOString(),
  };
  if (!entry.auto.trim()) { alert('Preencha o pensamento automático.'); return; }
  state.cbtEntries.unshift(entry);
  localStorage.setItem('cm_cbt', JSON.stringify(state.cbtEntries));
  ['cbtAuto','cbtEvidence','cbtCounter','cbtAlternative'].forEach(id => document.getElementById(id).value='');
  renderCbtList();
});

function renderCbtList() {
  const list = document.getElementById('cbtList');
  if (!state.cbtEntries.length) { list.innerHTML = '<p style="color:var(--text-light);font-size:0.9rem">Nenhum registro.</p>'; return; }
  list.innerHTML = state.cbtEntries.map(e => `
    <div class="mood-entry">
      <div class="mood-body">
        <strong>${escHtml(e.auto)}</strong>
        <div style="font-size:0.78rem;color:var(--text-light)">Distorção: ${escHtml(e.distortion)}</div>
        ${e.alternative ? '<div class="mood-note">Alternativa: '+escHtml(e.alternative)+'</div>' : ''}
        <div class="mood-date">${new Date(e.date).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    </div>`).join('');
}

// ======================== GRATITUDE ========================
document.getElementById('saveGratitude').addEventListener('click', () => {
  if (!hasAccess('plus')) return;
  const g1=document.getElementById('grat1').value.trim();
  const g2=document.getElementById('grat2').value.trim();
  const g3=document.getElementById('grat3').value.trim();
  if (!g1&&!g2&&!g3) { alert('Escreva pelo menos uma coisa.'); return; }
  state.gratitudeEntries.unshift({items:[g1,g2,g3].filter(Boolean),date:new Date().toISOString()});
  localStorage.setItem('cm_grat', JSON.stringify(state.gratitudeEntries));
  ['grat1','grat2','grat3'].forEach(id => document.getElementById(id).value='');
  renderGratList();
});

function renderGratList() {
  const list = document.getElementById('gratList');
  if (!state.gratitudeEntries.length) { list.innerHTML = '<p style="color:var(--text-light);font-size:0.9rem">Nenhum registro.</p>'; return; }
  list.innerHTML = state.gratitudeEntries.map(e => `
    <div class="mood-entry">
      <div class="mood-body">
        ${e.items.map(i => '<div>&#10024; '+escHtml(i)+'</div>').join('')}
        <div class="mood-date">${new Date(e.date).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
      </div>
    </div>`).join('');
}

// ======================== HABITS ========================
function renderHabits() {
  const today = new Date().toDateString();
  const todayData = state.habitData[today] || {};
  document.querySelectorAll('#habitList input[type="checkbox"]').forEach(cb => {
    cb.checked = todayData[cb.dataset.habit] || false;
    cb.addEventListener('change', function() {
      if (this.closest('.tier-plus') && tiers[state.plan] < 1) { this.checked=false; openModal('plus'); return; }
      if (this.closest('.tier-premium') && tiers[state.plan] < 2) { this.checked=false; openModal('premium'); return; }
      if (!state.habitData[today]) state.habitData[today] = {};
      state.habitData[today][this.dataset.habit] = this.checked;
      localStorage.setItem('cm_habits', JSON.stringify(state.habitData));
      updateHabitStreak();
    });
  });
  updateHabitStreak();
}

function updateHabitStreak() {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toDateString();
    const data = state.habitData[key];
    if (!data) break;
    const vals = Object.values(data);
    if (!vals.length || vals.every(v => !v)) break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  document.getElementById('habitStreak').textContent = streak;
}

// ======================== SLEEP ========================
document.getElementById('saveSleep').addEventListener('click', () => {
  if (!hasAccess('plus')) return;
  const sleepTime = document.getElementById('sleepTime').value;
  const wakeTime = document.getElementById('wakeTime').value;
  const quality = document.getElementById('sleepQuality').value;
  if (!sleepTime || !wakeTime) { alert('Preencha os horários.'); return; }
  state.sleepData.unshift({sleepTime,wakeTime,quality,date:new Date().toISOString()});
  localStorage.setItem('cm_sleep', JSON.stringify(state.sleepData));
  alert('Sono registrado com sucesso!');
});

// ======================== POMODORO ========================
const pomTimer = document.getElementById('pomodoroTimer');
function formatTime(s) { return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
function updatePom() { pomTimer.textContent = formatTime(state.pomSeconds); document.getElementById('pomodoroPhase').textContent = state.pomPhase === 'focus' ? 'Foco' : 'Pausa'; }

function tickPom() {
  state.pomSeconds--; updatePom();
  if (state.pomSeconds <= 0) {
    if (state.pomPhase === 'focus') {
      state.pomPhase = 'break'; state.pomSeconds = parseInt(document.getElementById('breakTime').value)*60; state.pomTotal = state.pomSeconds; state.pomCycles++;
      document.getElementById('pomodoroCycles').textContent = state.pomCycles;
    } else {
      state.pomPhase = 'focus'; state.pomSeconds = parseInt(document.getElementById('focusTime').value)*60; state.pomTotal = state.pomSeconds;
    }
    updatePom();
  }
}

document.getElementById('startPomodoro').addEventListener('click', function() {
  if (state.pomRunning) { state.pomRunning=false; clearInterval(state.pomTimer); this.textContent='Continuar'; }
  else {
    state.pomRunning=true; this.textContent='Pausar';
    document.getElementById('focusTime').disabled=true; document.getElementById('breakTime').disabled=true;
    state.pomTimer = setInterval(tickPom, 1000);
  }
});

document.getElementById('resetPomodoro').addEventListener('click', () => {
  state.pomRunning=false; clearInterval(state.pomTimer);
  state.pomPhase='focus'; state.pomCycles=0;
  state.pomSeconds = parseInt(document.getElementById('focusTime').value)*60; state.pomTotal=state.pomSeconds;
  document.getElementById('focusTime').disabled=false; document.getElementById('breakTime').disabled=false;
  document.getElementById('startPomodoro').textContent='Iniciar';
  document.getElementById('pomodoroCycles').textContent='0'; updatePom();
});

document.getElementById('focusTime').addEventListener('change', function() { if(!state.pomRunning){state.pomSeconds=parseInt(this.value)*60;state.pomTotal=state.pomSeconds;updatePom()} });
document.getElementById('breakTime').addEventListener('change', () => { if(!state.pomRunning) updatePom() });

// ======================== VIDEOS ========================
const videoLibrary = [
  // Free
  { id:1, title:'Sons da Natureza para Relaxar', cat:'relaxar', tier:'free', src:'https://www.youtube.com/embed/BN6kLEqE17s', desc:'Sons de floresta e pássaros' },
  { id:2, title:'Música Calma para Ansiedade', cat:'relaxar', tier:'free', src:'https://www.youtube.com/embed/7NOSDKb0HlU', desc:'Música instrumental suave' },
  { id:3, title:'Meditação Guiada 5 min', cat:'meditar', tier:'free', src:'https://www.youtube.com/embed/inpok4MKVLM', desc:'Meditação rápida para iniciantes' },
  { id:4, title:'Motivação para o Dia', cat:'motivar', tier:'free', src:'https://www.youtube.com/embed/3qHkcs3BMFY', desc:'Mensagens inspiradoras' },
  // Plus
  { id:5, title:'Ondas do Mar Relaxantes', cat:'relaxar', tier:'plus', src:'https://www.youtube.com/embed/BN6kLEqE17s', desc:'Som do mar para dormir' },
  { id:6, title:'Body Scan - Meditação', cat:'meditar', tier:'plus', src:'https://www.youtube.com/embed/inpok4MKVLM', desc:'Escaneamento corporal completo' },
  { id:7, title:'Superação - Histórias Reais', cat:'motivar', tier:'plus', src:'https://www.youtube.com/embed/3qHkcs3BMFY', desc:'Histórias inspiradoras de superação' },
  // Premium
  { id:8, title:'Sessão Completa de Relaxamento', cat:'exclusivo', tier:'premium', src:'https://www.youtube.com/embed/7NOSDKb0HlU', desc:'Programa completo de 30 min' },
  { id:9, title:'Curso de Mindfulness', cat:'exclusivo', tier:'premium', src:'https://www.youtube.com/embed/inpok4MKVLM', desc:'Aula completa de mindfulness' },
  { id:10, title:'Palestra Exclusiva', cat:'exclusivo', tier:'premium', src:'https://www.youtube.com/embed/3qHkcs3BMFY', desc:'Palestra sobre saúde mental' },
];

function renderVideos(filter) {
  const grid = document.getElementById('videoGrid');
  if (!grid) return;
  const cat = filter || 'todos';

  let videos = videoLibrary;
  if (cat !== 'todos') videos = videos.filter(v => v.cat === cat);

  const userTier = tiers[state.plan] || 0;
  const tierLabels = { free: 'Grátis', plus: 'Plus', premium: 'Premium' };
  const tierColors = { free: 'free', plus: 'plus', premium: 'premium' };

  grid.innerHTML = videos.map(v => {
    const videoTier = tiers[v.tier] || 0;
    const isLocked = videoTier > userTier;

    return `
      <div class="video-card ${isLocked ? 'video-locked' : ''}" style="position:relative">
        ${isLocked ? '<div class="video-lock-overlay" onclick="openModal(\''+v.tier+'\')"><span>🔒 '+tierLabels[v.tier]+'</span></div>' : ''}
        <div class="video-embed">
          <iframe src="${isLocked ? '' : v.src}" allowfullscreen loading="lazy"></iframe>
        </div>
        <div class="video-card-body">
          <h4>${escHtml(v.title)}</h4>
          <p>${escHtml(v.desc)}</p>
          <span class="video-badge ${tierColors[v.tier]}">${tierLabels[v.tier]}</span>
        </div>
      </div>
    `;
  }).join('');

  if (!isLockedAccess()) {
    grid.innerHTML += `
      <div class="video-card" style="background:transparent;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;padding:40px;text-align:center">
        <div>
          <p style="font-size:1rem;font-weight:600;color:var(--text-light);margin-bottom:8px">&#128274; Vídeos Exclusivos</p>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">Assine Plus ou Premium para acessar todos os vídeos</p>
          <button class="btn btn-primary" onclick="showPage('plans')">Ver Planos</button>
        </div>
      </div>`;
  }
}

function isLockedAccess() {
  // If there's any locked video, show the upgrade prompt
  return tiers[state.plan] >= 1;
}

// Video category filter
document.querySelectorAll('.video-cat').forEach(c => {
  c.addEventListener('click', () => {
    if (c.classList.contains('tier-premium') && tiers[state.plan] < 2) { openModal('premium'); return; }
    document.querySelectorAll('.video-cat').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    renderVideos(c.dataset.cat);
  });
});

// ======================== PROGRESS ========================
function updateProgress() {
  const avg = state.moodEntries.length ? (state.moodEntries.reduce((s,e)=>s+(moodVals[e.mood]||3),0)/state.moodEntries.length).toFixed(1) : '-';
  document.getElementById('avgMood').textContent = avg;
  document.getElementById('totalMoods').textContent = state.moodEntries.length;

  if (tiers[state.plan] >= 1) {
    document.getElementById('longestStreak').textContent = countConsecutiveDays(state.moodEntries);
    document.getElementById('totalGratitudes').textContent = state.gratitudeEntries.length;
  } else {
    document.getElementById('longestStreak').textContent = '🔒';
    document.getElementById('totalGratitudes').textContent = '🔒';
  }

  // Daily insight
  const insightEl = document.getElementById('dailyInsight');
  if (tiers[state.plan] >= 2 && state.moodEntries.length >= 3) {
    const recent = state.moodEntries.slice(0,7);
    const avgMood = recent.reduce((s,e)=>s+(moodVals[e.mood]||3),0)/recent.length;
    if (avgMood < 2.5) insightEl.textContent = 'Sua média de humor está baixa esta semana. Que tal tentar o exercício de respiração ou entrar no SOS?';
    else if (avgMood < 3.5) insightEl.textContent = 'Sua média está estável. Continue cuidando de você!';
    else insightEl.textContent = 'Sua média de humor está boa! Ótimo trabalho cuidando de si mesmo(a)!';
  } else if (tiers[state.plan] >= 1) {
    insightEl.textContent = 'Registre mais humores e assine Premium para receber insights personalizados diários.';
  } else {
    insightEl.textContent = 'Registre humores e faça upgrade para Plus ou Premium para desbloquear insights.';
  }
}

function renderProgressChart() {
  const canvas = document.getElementById('progressChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio||1;
  const w = canvas.parentElement.clientWidth;
  canvas.width = w*dpr; canvas.height = 200*dpr;
  canvas.style.width = w+'px'; canvas.style.height='200px';
  ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,200);

  const entries = state.moodEntries;
  if (!entries.length) {
    ctx.fillStyle = state.theme==='dark'?'#b0a0c8':'#7a6a92';
    ctx.font='13px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Dados insuficientes', w/2, 100);
    return;
  }

  const displayed = entries.slice(0,30).reverse();
  if (displayed.length < 2) {
    ctx.fillStyle = state.theme==='dark'?'#b0a0c8':'#7a6a92';
    ctx.font='13px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Registre mais humores', w/2, 100);
    return;
  }

  const pad=30, cw=w-pad*2, ch=140, isDark=state.theme==='dark';
  const lineColor = isDark?'#9b7fd4':'#7c5cbf';

  displayed.forEach((e,i) => {
    const x = pad + (i/(displayed.length-1))*cw;
    const y = pad + ch - ((moodVals[e.mood]||3)/5)*ch;
    ctx.fillStyle = lineColor;
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
    if (i>0) {
      const px = pad + ((i-1)/(displayed.length-1))*cw;
      const py = pad + ch - ((moodVals[displayed[i-1].mood]||3)/5)*ch;
      ctx.strokeStyle = isDark?'rgba(155,127,212,0.4)':'rgba(124,92,191,0.3)';
      ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(x,y); ctx.stroke();
    }
  });
}

// ======================== PLANS ========================
function renderPlans() {
  const container = document.getElementById('plansContainer');
  const userTier = tiers[state.plan] || 0;

  const plans = [
    {
      name:'Grátis', price:'R$ 0', period:'sempre grátis', badge:'free-badge', badgeText:'Grátis',
      features:[
        {text:'Respiração Guiada', ok:true},
        {text:'Diário de Humor', ok:true},
        {text:'SOS Crise', ok:true},
        {text:'Pomodoro Foco', ok:true},
        {text:'Hábitos Básicos', ok:true},
        {text:'CBT - Pensamentos', plus:true},
        {text:'Diário de Gratidão', plus:true},
        {text:'Sono Avançado', plus:true},
        {text:'Vídeos Plus', plus:true},
        {text:'Vídeos Premium', premium:true},
        {text:'Insights Diários', premium:true},
        {text:'Temas Exclusivos', premium:true},
      ],
      isCurrent: userTier === 0,
      btnText: userTier === 0 ? 'Seu Plano' : (userTier > 0 ? 'Downgrade' : 'Grátis'),
      btnDisabled: userTier === 0,
      action: 'free',
    },
    {
      name:'Plus', price:'R$ 9,90', period:'por mês', badge:'plus-badge', badgeText:'Plus',
      features:[
        {text:'Tudo do Grátis', ok:true},
        {text:'CBT - Pensamentos', ok:true},
        {text:'Diário de Gratidão', ok:true},
        {text:'Sono Avançado', ok:true},
        {text:'Hábitos Plus', ok:true},
        {text:'Vídeos Plus', ok:true},
        {text:'Dados Ilimitados', ok:true},
        {text:'Vídeos Premium', premium:true},
        {text:'Insights Diários', premium:true},
        {text:'Temas Exclusivos', premium:true},
      ],
      isCurrent: userTier === 1,
      btnText: userTier === 1 ? 'Seu Plano' : (userTier > 1 ? 'Downgrade' : 'Assinar'),
      btnDisabled: userTier === 1,
      action: 'plus',
    },
    {
      name:'Premium', price:'R$ 19,90', period:'por mês', badge:'premium-badge', badgeText:'Premium', featured:true,
      features:[
        {text:'Tudo do Plus', ok:true},
        {text:'Vídeos Premium', ok:true},
        {text:'Insights Diários', ok:true},
        {text:'Conteúdo Exclusivo', ok:true},
        {text:'Temas Exclusivos', ok:true},
        {text:'Suporte Prioritário', ok:true},
        {text:'Sem Anúncios', ok:true},
        {text:'Programa de Afiliados', ok:true},
      ],
      isCurrent: userTier === 2,
      btnText: userTier === 2 ? 'Seu Plano' : 'Assinar',
      btnDisabled: userTier === 2,
      action: 'premium',
    },
  ];

  container.innerHTML = plans.map(p => `
    <div class="plan-card ${p.featured ? 'featured' : ''}">
      <div class="plan-badge ${p.badge}">${p.badgeText}</div>
      <h3>${p.name}</h3>
      <div class="plan-price">${p.price} <span>${p.period}</span></div>
      <ul class="plan-features">
        ${p.features.map(f => {
          if (f.ok) return '<li><span class="check">&#9989;</span> '+f.text+'</li>';
          if (f.plus) return '<li><span class="plus-mark">+P</span> '+f.text+'</li>';
          if (f.premium) return '<li><span class="premium-mark">&#127775;P</span> '+f.text+'</li>';
          return '<li><span class="no-check">&#10060;</span> '+f.text+'</li>';
        }).join('')}
      </ul>
      <button class="btn ${p.isCurrent ? 'btn-secondary' : 'btn-primary'}" ${p.btnDisabled ? 'disabled' : ''} data-plan="${p.action}">
        ${p.btnText}
      </button>
    </div>
  `).join('');

  container.querySelectorAll('button[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.plan;
      if (target === 'free') { if (confirm('Voltar para o plano Grátis?')) savePlan('free'); }
      else { openModal(target); }
    });
  });
}

// ======================== SETTINGS ========================
document.getElementById('exportData').addEventListener('click', () => {
  const data = {
    moods: state.moodEntries, cbt: state.cbtEntries,
    gratitude: state.gratitudeEntries, habits: state.habitData,
    sleep: state.sleepData, plan: state.plan,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'calmamente_dados_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
});

document.getElementById('clearData').addEventListener('click', () => {
  if (!confirm('Tem certeza? Todos os dados serão apagados.')) return;
  if (!confirm('Realmente apagar tudo?')) return;
  state.moodEntries=[]; state.cbtEntries=[]; state.gratitudeEntries=[];
  state.habitData={}; state.sleepData=[]; state.videoViews=0;
  ['cm_moods','cm_cbt','cm_grat','cm_habits','cm_sleep','cm_video_views'].forEach(k => localStorage.removeItem(k));
  renderMoodList(); renderMoodChart(); renderMiniChart();
  updateDashboard(); updateProgress();
  alert('Dados limpos com sucesso.');
});

// Affiliate program
document.getElementById('affiliateBtn').addEventListener('click', () => {
  if (!hasAccess('premium')) return;
  alert('Programa de Afiliados CalmaMente\n\nGanhe 30% de comissão indicando o app!\nSeu link exclusivo:\nhttps://calmamente.app/ref/' + state.moodEntries.length);
});

// ======================== SIDEBAR ========================
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ======================== REMINDER ========================
document.getElementById('reminderToggle').addEventListener('change', function() {
  if (this.checked) {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    localStorage.setItem('cm_reminder', 'true');
  } else {
    localStorage.setItem('cm_reminder', 'false');
  }
});

if (localStorage.getItem('cm_reminder') === 'true') {
  document.getElementById('reminderToggle').checked = true;
}

// ======================== INIT ========================
updateDashboard();
updateProgress();
renderPlans();
updateAllTieredElements();

// Apply plan on load
const labels = { free: 'Grátis', plus: 'Plus', premium: 'Premium' };
document.getElementById('planBadge').textContent = labels[state.plan] || 'Grátis';
document.getElementById('currentPlanText').textContent = labels[state.plan] || 'Grátis';

// ======================== GIFT SYSTEM ========================
document.getElementById('giftBtn').addEventListener('click', () => {
  document.getElementById('giftModal').style.display = 'flex';
});

document.getElementById('giftPurchase').addEventListener('click', () => {
  const email = document.getElementById('giftEmail').value.trim();
  if (!email) { alert('Informe o email de quem vai receber o presente.'); return; }
  const plan = document.querySelector('input[name="giftPlan"]:checked');
  const planName = plan ? plan.value : 'premium';
  const planLabel = planName === 'plus' ? 'Plus (R$ 9,90/mês)' : 'Premium (R$ 19,90/mês)';

  alert(`Pedido de presente gerado!\n\nPlano: ${planLabel}\nPresenteado: ${email}\n\nEnviaremos as instruções de pagamento para seu email cadastrado.\n\nChave Pix: contato@calmamente.app`);

  document.getElementById('giftModal').style.display = 'none';
  document.getElementById('giftEmail').value = '';
});

document.getElementById('giftModal').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = 'none';
});

// ======================== PIX DONATION ========================
document.getElementById('pixBtn')?.addEventListener('click', () => {
  const pixKey = 'contato@calmamente.app';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(pixKey).then(() => {
      alert('Chave Pix copiada!\n\ncontato@calmamente.app\n\nValor sugerido: R$ 5,00 a R$ 50,00\nObrigado por apoiar! 💜');
    });
  } else {
    alert('Chave Pix: contato@calmamente.app\n\nValor sugerido: R$ 5,00 a R$ 50,00\nObrigado por apoiar! 💜');
  }
});

// ======================== CHECKOUT ========================
function openCheckout(productName, price) {
  document.getElementById('checkoutProduct').textContent = productName;
  document.getElementById('checkoutPrice').textContent = 'R$ ' + price.replace('.', ',');
  document.getElementById('checkoutModal').style.display = 'flex';
  showPaymentMethod('pix');
}

function showPaymentMethod(method) {
  document.querySelectorAll('.payment-option').forEach(el => {
    const m = el.dataset.method;
    if (m === method) {
      el.style.borderColor = 'var(--primary)';
      el.style.borderWidth = '2px';
      el.querySelector('input[type="radio"]').checked = true;
      const details = el.querySelector('div[id$="Details"]');
      if (details) details.style.display = 'block';
    } else {
      el.style.borderColor = 'var(--border)';
      el.style.borderWidth = '1px';
      const details = el.querySelector('div[id$="Details"]');
      if (details) details.style.display = 'none';
    }
  });
}

document.querySelectorAll('.payment-option').forEach(el => {
  el.addEventListener('click', () => {
    showPaymentMethod(el.dataset.method);
  });
});

document.getElementById('copyPixBtn').addEventListener('click', () => {
  const key = 'contato@calmamente.app';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(key).then(() => {
      const btn = document.getElementById('copyPixBtn');
      btn.textContent = '✓ Copiado!';
      setTimeout(() => { btn.textContent = '📋 Copiar Chave'; }, 2000);
    });
  } else {
    alert('Chave Pix: ' + key);
  }
});

document.getElementById('checkoutModal').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = 'none';
});

// ======================== DAILY TIPS ========================
const dailyTips = [
  'Respire fundo 3 vezes antes de reagir a algo estressante.',
  'Anote 3 coisas boas que aconteceram hoje, por menores que sejam.',
  'Se afaste das telas por 10 minutos e sinta o ambiente ao seu redor.',
  'Lembre-se: sentimentos são temporários. Isso também vai passar.',
  'Hoje, tente fazer uma coisa de cada vez. Foco total em uma tarefa.',
  'Beba um copo de água agora. A desidratação pode aumentar a ansiedade.',
  'Estique os braços acima da cabeça e respire profundamente por 5 segundos.',
  'Você não precisa ser produtivo o tempo todo. Descansar é necessário.',
  'Coloque uma música calma e feche os olhos por 2 minutos.',
  'Sorria por 10 segundos. O simples ato de sorrir libera endorfinas.',
  'Toque em 5 objetos ao seu redor e sinta suas texturas. Isso te traz ao presente.',
  'Escreva um pensamento que está te incomodando e depois o risque. Ele não te define.',
  'Hoje, foque no que você pode controlar e solte o resto.',
  'Se sentir vontade de chorar, chore. As lágrimas liberam hormônios do estresse.',
  'Lembre-se: você já superou tudo o que a vida te jogou até agora.',
];

function renderDailyTip() {
  const day = new Date().getDate();
  document.getElementById('dailyTipContent').textContent = dailyTips[day % dailyTips.length];
}

// ======================== PROGRAMS ========================
const programs = [
  { id:1, name:'30 Dias Anti-Ansiedade', desc:'Um programa completo de 30 dias com exercícios diários para reduzir a ansiedade', days:30, tier:'premium', icon:'&#9752;' },
  { id:2, name:'7 Dias de Mindfulness', desc:'Introdução à atenção plena com meditações guiadas curtas', days:7, tier:'free', icon:'&#129504;' },
  { id:3, name:'Desafio da Gratidão', desc:'21 dias cultivando o hábito da gratidão para transformar sua perspectiva', days:21, tier:'plus', icon:'&#10024;' },
  { id:4, name:'Reestruturação Cognitiva', desc:'Aprenda a identificar e desafiar pensamentos negativos automáticos', days:14, tier:'plus', icon:'&#128161;' },
  { id:5, name:'Sono Reparador', desc:'Rotina noturna de 14 dias para melhorar a qualidade do sono', days:14, tier:'free', icon:'&#127770;' },
  { id:6, name:'Autocompaixão', desc:'30 dias para desenvolver uma relação mais gentil consigo mesmo', days:30, tier:'premium', icon:'&#10084;&#65039;' },
];

let programProgress = JSON.parse(localStorage.getItem('cm_program_progress')) || {};

const dailyChallenges = [
  { name:'Escreva 3 qualidades suas', desc:'Reconheça seu valor' },
  { name:'Ligue para alguém que você ama', desc:'Conexão social é cura' },
  { name:'Faça uma caminhada de 10 min', desc:'Movimento libera estresse' },
  { name:'Desligue o celular por 1h', desc:'Desintoxicação digital' },
  { name:'Pratique 5 min de respiração', desc:'Acalme seu sistema nervoso' },
  { name:'Escreva uma carta para seu eu do futuro', desc:'Visualize seu crescimento' },
  { name:'Faça algo que você amava na infância', desc:'Reconecte com sua essência' },
  { name:'Organize um espaço da sua casa', desc:'Ordem externa traz ordem interna' },
  { name:'Cozinhe algo diferente e saudável', desc:'Autocuidado também é nutrição' },
  { name:'Medite por 5 minutos', desc:'Silêncio é remédio' },
];

function renderPrograms() {
  const container = document.getElementById('programContent');
  const activeTab = document.querySelector('.program-tab.active');
  const tab = activeTab ? activeTab.dataset.ptab : 'treinos';

  if (tab === 'dicas') {
    const day = new Date().getDate();
    const tips = [
      'Respire fundo 3 vezes antes de reagir.',
      'Anote 3 coisas boas do dia.',
      'Fique 10 min longe das telas.',
      'Beba água. Desidratação aumenta ansiedade.',
      'Estique o corpo e respire fundo.',
      'Sorria por 10 segundos. Libera endorfina.',
      'Toque em 5 objetos ao redor.',
      'Você já superou tudo até aqui.',
      'Não precisa ser produtivo o tempo todo.',
      'Feche os olhos e ouça os sons ao redor.',
    ];
    container.innerHTML = '<h3 style="margin-bottom:16px;font-size:1.1rem">&#128161; Dicas Rápidas para o Dia a Dia</h3>' +
      tips.map((t,i) => `<div class="dica-card"><span class="dica-num">${i+1}</span><p style="font-size:0.9rem;color:var(--text);margin:0">${t}</p></div>`).join('');
    return;
  }

  if (tab === 'desafios') {
    const today = new Date().toDateString();
    const challengeIdx = new Date().getDate() % dailyChallenges.length;
    const challenge = dailyChallenges[challengeIdx];
    const done = localStorage.getItem('cm_challenge_' + today);

    container.innerHTML = `
      <div style="text-align:center;margin-bottom:24px">
        <h3 style="font-size:1.2rem;margin-bottom:8px">&#127942; Desafio de Hoje</h3>
        <div class="program-card" style="text-align:center">
          <div style="font-size:2.5rem;margin-bottom:8px">&#127919;</div>
          <h3>${challenge.name}</h3>
          <p>${challenge.desc}</p>
          ${!done ? `<button class="btn btn-primary" onclick="completeChallenge()">&#9989; Concluir Desafio</button>`
          : `<span style="display:inline-block;padding:8px 20px;background:var(--border);border-radius:8px;font-weight:600">&#9989; Concluído hoje!</span>`}
        </div>
      </div>
      <h3 style="font-size:1rem;margin-bottom:12px">Desafios Anteriores</h3>
      ${dailyChallenges.slice(0,7).map((c,i) => `<div class="dica-card"><span class="dica-num">${i+1}</span><div><strong>${c.name}</strong><p style="font-size:0.8rem;color:var(--text-light);margin:2px 0 0">${c.desc}</p></div></div>`).join('')}
    `;
    return;
  }

  // Treinos
  const userTier = tiers[state.plan] || 0;
  container.innerHTML = '<h3 style="margin-bottom:16px;font-size:1.1rem">&#127919; Programas de Treinamento</h3>' +
    programs.map(p => {
      const progTier = tiers[p.tier] || 0;
      const locked = progTier > userTier;
      const progress = programProgress[p.id] || 0;
      const pct = Math.round((progress / p.days) * 100);
      return `
        <div class="program-card" style="${locked ? 'opacity:0.6' : ''}">
          ${locked ? '<div style="position:absolute;top:12px;right:12px;font-size:0.7rem;background:var(--primary);color:#fff;padding:2px 10px;border-radius:8px">🔒 '+p.tier+'</div>' : ''}
          <div style="font-size:2rem;margin-bottom:8px">${p.icon}</div>
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div class="program-meta">
            <span>&#128197; ${p.days} dias</span>
            <span>&#9889; ${pct}% completo</span>
          </div>
          <div class="program-progress-bar"><div class="program-progress-fill" style="width:${pct}%"></div></div>
          ${!locked ? `<button class="btn btn-primary" onclick="startProgram(${p.id}, ${p.days})" style="font-size:0.82rem;padding:8px 20px">${progress > 0 ? 'Continuar' : 'Começar'}</button>` : `<button class="btn btn-secondary" onclick="openModal('${p.tier}')" style="font-size:0.82rem;padding:8px 20px">Desbloquear</button>`}
        </div>
      `;
    }).join('');
}

function startProgram(id, days) {
  if (!programProgress[id]) programProgress[id] = 1;
  else programProgress[id] = Math.min(programProgress[id] + 1, days);
  localStorage.setItem('cm_program_progress', JSON.stringify(programProgress));
  const prog = programs.find(p => p.id === id);
  alert('&#127919; Dia ' + programProgress[id] + ' de ' + days + ' concluído!\n\n' + (programProgress[id] >= days ? '🎉 Programa completo! Parabéns!' : 'Continue assim!'));
  renderPrograms();
}

function completeChallenge() {
  const today = new Date().toDateString();
  localStorage.setItem('cm_challenge_' + today, 'done');
  renderPrograms();
}

// Program tabs
document.querySelectorAll('.program-tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.program-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    renderPrograms();
  });
});

// ======================== TESTS ========================
const tests = {
  gad7: {
    name:'GAD-7 - Ansiedade Generalizada',
    questions:[
      'Sentir-se nervoso, ansioso ou muito tenso',
      'Não conseguir parar de se preocupar',
      'Preocupar-se demais com coisas diferentes',
      'Dificuldade para relaxar',
      'Ficar tão agitado que é difícil ficar parado',
      'Ficar facilmente irritado ou chateado',
      'Sentir medo como se algo ruim fosse acontecer',
    ],
    options:[
      {text:'Nenhuma vez', val:0},
      {text:'Vários dias', val:1},
      {text:'Mais da metade dos dias', val:2},
      {text:'Quase todos os dias', val:3},
    ],
    interpret: function(s) {
      if (s < 5) return {level:'Mínimo', desc:'Sua ansiedade está em níveis baixos. Continue cuidando de você.', color:'var(--accent-green, #4caf50)'};
      if (s < 10) return {level:'Leve', desc:'Você pode estar com sintomas leves de ansiedade. Praticar as ferramentas do app pode ajudar.', color:'var(--plus)'};
      if (s < 15) return {level:'Moderado', desc:'Sintomas moderados. Considere buscar acompanhamento profissional.', color:'#f0a030'};
      return {level:'Grave', desc:'Sintomas graves. Recomendamos fortemente buscar ajuda profissional. Ligue 188 se necessário.', color:'#e74c3c'};
    }
  },
  phq9: {
    name:'PHQ-9 - Depressão',
    questions:[
      'Pouco interesse ou prazer em fazer as coisas',
      'Sentir-se para baixo, deprimido ou sem esperança',
      'Dificuldade para pegar no sono ou dormir demais',
      'Sentir-se cansado ou com pouca energia',
      'Falta de apetite ou comendo demais',
      'Sentir-se mal consigo mesmo ou que decepcionou sua família',
      'Dificuldade de concentração nas atividades',
      'Falar ou se mover tão devagar que outras pessoas notaram',
      'Pensamentos de que seria melhor estar morto ou de se machucar',
    ],
    options:[
      {text:'Nenhuma vez', val:0},
      {text:'Vários dias', val:1},
      {text:'Mais da metade dos dias', val:2},
      {text:'Quase todos os dias', val:3},
    ],
    interpret: function(s) {
      if (s < 5) return {level:'Mínimo', desc:'Sintomas mínimos de depressão. Continue suas práticas de autocuidado.', color:'var(--accent-green, #4caf50)'};
      if (s < 10) return {level:'Leve', desc:'Depressão leve. As ferramentas do app podem ajudar, mas considere acompanhamento.', color:'var(--plus)'};
      if (s < 15) return {level:'Moderado', desc:'Depressão moderada. Busque apoio profissional.', color:'#f0a030'};
      if (s < 20) return {level:'Moderadamente Grave', desc:'Sintomas significativos. Procure um psicólogo ou psiquiatra.', color:'#e67e22'};
      return {level:'Grave', desc:'Depressão grave. Procure ajuda profissional imediatamente. Ligue 188 se necessário.', color:'#e74c3c'};
    }
  },
  burnout: {
    name:'Escala de Burnout (Simplificada)',
    questions:[
      'Sinto-me esgotado emocionalmente pelo meu trabalho',
      'Sinto-me cansado no final do dia de trabalho',
      'Acordo cansado e sem energia para começar a trabalhar',
      'Tenho me tornado mais insensível com as pessoas desde que comecei este trabalho',
      'Sinto que estou tratando algumas pessoas como se fossem objetos',
      'Trabalhar o dia inteiro é um esforço para mim',
      'Sinto que não estou realizando coisas importantes neste trabalho',
      'Perdi o interesse pelo meu trabalho',
      'Não tenho mais entusiasmo pelo meu trabalho',
    ],
    options:[
      {text:'Nunca', val:0},
      {text:'Algumas vezes ao ano', val:1},
      {text:'Uma vez ao mês', val:2},
      {text:'Algumas vezes ao mês', val:3},
      {text:'Uma vez por semana', val:4},
      {text:'Algumas vezes por semana', val:5},
      {text:'Diariamente', val:6},
    ],
    interpret: function(s) {
      if (s < 15) return {level:'Baixo', desc:'Níveis baixos de burnout. Continue mantendo o equilíbrio.', color:'var(--accent-green, #4caf50)'};
      if (s < 25) return {level:'Moderado', desc:'Sinais de burnout começando. Reveja sua rotina e priorize o descanso.', color:'#f0a030'};
      if (s < 35) return {level:'Alto', desc:'Risco alto de burnout. Considere mudanças na rotina e ajuda profissional.', color:'#e67e22'};
      return {level:'Muito Alto', desc:'Burnout severo. Procure ajuda profissional e considere afastamento.', color:'#e74c3c'};
    }
  }
};

let currentTest = null;
let currentQuestion = 0;
let currentAnswers = [];

function renderTests() {
  document.getElementById('testGrid').style.display = 'grid';
  document.getElementById('testRunning').style.display = 'none';
  document.getElementById('testResult').style.display = 'none';
}

function startTest(testId) {
  if (testId === 'phq9' && tiers[state.plan] < 1) { openModal('plus'); return; }
  if (testId === 'burnout' && tiers[state.plan] < 2) { openModal('premium'); return; }
  currentTest = testId;
  currentQuestion = 0;
  currentAnswers = [];
  document.getElementById('testGrid').style.display = 'none';
  document.getElementById('testRunning').style.display = 'block';
  document.getElementById('testResult').style.display = 'none';
  renderQuestion();
}

function renderQuestion() {
  const test = tests[currentTest];
  const quiz = document.getElementById('testQuiz');
  if (currentQuestion >= test.questions.length) {
    showTestResult();
    return;
  }
  quiz.innerHTML = `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-light);margin-bottom:8px">
        <span>${test.name}</span>
        <span>${currentQuestion+1}/${test.questions.length}</span>
      </div>
      <div class="program-progress-bar"><div class="program-progress-fill" style="width:${((currentQuestion)/test.questions.length)*100}%"></div></div>
    </div>
    <div class="quiz-question">
      <p>${test.questions[currentQuestion]}</p>
      ${test.options.map((o,i) => `<label class="quiz-option" onclick="selectAnswer(${i})">${o.text}</label>`).join('')}
    </div>
  `;
}

function selectAnswer(idx) {
  const test = tests[currentTest];
  currentAnswers.push(test.options[idx].val);
  currentQuestion++;
  renderQuestion();
}

function showTestResult() {
  const test = tests[currentTest];
  const score = currentAnswers.reduce((a,b) => a+b, 0);
  const result = test.interpret(score);
  const quiz = document.getElementById('testQuiz');
  quiz.innerHTML = '';
  document.getElementById('testRunning').style.display = 'none';
  document.getElementById('testResult').style.display = 'block';
  const content = document.getElementById('testResultContent');
  content.innerHTML = `
    <div class="test-result-box">
      <h3>${test.name}</h3>
      <div class="test-result-score" style="color:${result.color}">${score}</div>
      <div class="test-result-level" style="color:${result.color}"><strong>${result.level}</strong></div>
      <div class="test-result-desc">${result.desc}</div>
    </div>
    <div style="text-align:center;font-size:0.8rem;color:var(--text-light);padding:12px;background:var(--card-bg);border-radius:var(--radius-sm)">&#128161; Este teste não substitui diagnóstico profissional. Consulte um psicólogo ou psiquiatra para uma avaliação completa.</div>
  `;
  // Save result
  const results = JSON.parse(localStorage.getItem('cm_test_results') || '[]');
  results.unshift({test:currentTest, score, level:result.level, date:new Date().toISOString()});
  localStorage.setItem('cm_test_results', JSON.stringify(results));
}

function resetTests() {
  currentTest = null;
  currentQuestion = 0;
  currentAnswers = [];
  renderTests();
}

// ======================== SOUNDS ========================
const soundList = [
  { id:'chuva', name:'Chuva Suave', icon:'&#127783;', desc:'Som de chuva caindo', freq:'noise', tier:'free' },
  { id:'oceano', name:'Ondas do Mar', icon:'&#127754;', desc:'Ondas quebrando na praia', freq:'noise', tier:'free' },
  { id:'floresta', name:'Floresta', icon:'&#127795;', desc:'Pássaros e vento', freq:'noise', tier:'free' },
  { id:'ventilador', name:'Ventilador', icon:'&#127745;', desc:'Ruído branco suave', freq:'noise', tier:'free' },
  { id:'frequencia', name:'Frequência 432Hz', icon:'&#128266;', desc:'Ondas cerebrais relaxantes', freq:'tone', tier:'plus' },
  { id:'binaural', name:'Ondas Theta', icon:'&#129504;', desc:'Binaural para meditação', freq:'tone', tier:'premium' },
  { id:'nervoso', name:'Ruído Rosa', icon:'&#127925;', desc:'Som profundo e aveludado', freq:'noise', tier:'plus' },
  { id:'campainhas', name:'Taças Tibetanas', icon:'&#128719;', desc:'Sons medicinais', freq:'tone', tier:'premium' },
];

let audioContext = null;
let audioNode = null;
let currentSound = null;

function renderSounds() {
  const grid = document.getElementById('soundsGrid');
  const userTier = tiers[state.plan] || 0;
  grid.innerHTML = soundList.map(s => {
    const sTier = tiers[s.tier] || 0;
    const locked = sTier > userTier;
    return `
      <div class="sound-card ${currentSound === s.id ? 'playing' : ''}" onclick="${locked ? `openModal('${s.tier}')` : `playSound('${s.id}')`}">
        <div class="sound-icon">${s.icon}</div>
        <h4>${s.name}</h4>
        <p>${s.desc}</p>
        ${locked ? '<div style="font-size:0.65rem;margin-top:4px;color:var(--primary)">🔒 '+s.tier+'</div>' : ''}
      </div>
    `;
  }).join('');
}

function playSound(id) {
  const sound = soundList.find(s => s.id === id);
  if (!sound) return;

  if (currentSound === id) {
    stopSound();
    return;
  }

  stopSound();

  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();

    if (sound.freq === 'tone') {
      const freq = id === 'frequencia' ? 432 : id === 'binaural' ? 200 : id === 'campainhas' ? 528 : 300;
      audioNode = audioContext.createOscillator();
      audioNode.type = 'sine';
      audioNode.frequency.setValueAtTime(freq, audioContext.currentTime);

      if (id === 'binaural') {
        // Add binaural beat effect
        const secondOsc = audioContext.createOscillator();
        secondOsc.type = 'sine';
        secondOsc.frequency.setValueAtTime(freq + 6, audioContext.currentTime);
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        secondOsc.connect(gain);
        gain.connect(audioContext.destination);
        secondOsc.start();
        audioNode._secondOsc = secondOsc;
        audioNode._secondGain = gain;
      }

      if (id === 'campainhas') {
        audioNode.type = 'triangle';
      }
    } else {
      // Noise generator
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      if (id === 'chuva') {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 2);
        }
      } else if (id === 'oceano') {
        for (let i = 0; i < bufferSize; i++) {
          const t = i / audioContext.sampleRate;
          data[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(t * 0.3));
        }
      } else if (id === 'nervoso') {
        for (let i = 0; i < bufferSize; i++) {
          const t = i / audioContext.sampleRate;
          data[i] = (Math.random() * 2 - 1) * Math.max(0.1, Math.min(1, 1 / Math.pow(t * 10 + 1, 0.5)));
        }
      } else {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      audioNode = audioContext.createBufferSource();
      audioNode.buffer = buffer;
      audioNode.loop = true;
    }

    const gainNode = audioContext.createGain();
    const volume = parseInt(document.getElementById('soundVolume').value) / 100;
    gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);

    audioNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    audioNode.start();

    currentSound = id;
    document.getElementById('currentSoundName').textContent = sound.name + ' tocando';
    document.getElementById('soundPlayer').style.display = 'flex';
    renderSounds();
  } catch(e) {
    alert('Não foi possível iniciar o som. Clique em "Parar" e tente novamente.');
  }
}

function stopSound() {
  if (audioNode) {
    try { audioNode.stop(); } catch(e) {}
    if (audioNode._secondOsc) { try { audioNode._secondOsc.stop(); } catch(e) {} }
    audioNode = null;
  }
  currentSound = null;
  document.getElementById('soundPlayer').style.display = 'none';
  renderSounds();
}

document.getElementById('stopSoundBtn').addEventListener('click', stopSound);
document.getElementById('soundVolume').addEventListener('input', function() {
  // Volume is set on next play
});

// Video/Sound tabs
document.querySelectorAll('.vs-tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.vs-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const show = t.dataset.vstab;
    document.getElementById('vsVideos').style.display = show === 'videos' ? 'block' : 'none';
    document.getElementById('vsSons').style.display = show === 'sons' ? 'block' : 'none';
    if (show === 'sons') renderSounds();
  });
});

// ======================== ACHIEVEMENTS ========================
const achievementList = [
  { id:'first_mood', name:'Primeiro Humor', icon:'&#9782;', desc:'Registre seu primeiro humor', check:() => state.moodEntries.length >= 1 },
  { id:'week_streak', name:'Uma Semana', icon:'&#128197;', desc:'Mantenha 7 dias de streak', check:() => countConsecutiveDays(state.moodEntries) >= 7 },
  { id:'month_streak', name:'Mês Dedicado', icon:'&#127775;', desc:'Mantenha 30 dias de streak', check:() => countConsecutiveDays(state.moodEntries) >= 30 },
  { id:'ten_moods', name:'Explorador', icon:'&#128202;', desc:'Registre 10 humores', check:() => state.moodEntries.length >= 10 },
  { id:'fifty_moods', name:'Autoconhecimento', icon:'&#129504;', desc:'Registre 50 humores', check:() => state.moodEntries.length >= 50 },
  { id:'first_cbt', name:'Mente Aberta', icon:'&#128161;', desc:'Complete um registro de TCC', check:() => state.cbtEntries.length >= 1 },
  { id:'first_grat', name:'Gratidão', icon:'&#10024;', desc:'Escreva sua primeira gratidão', check:() => state.gratitudeEntries.length >= 1 },
  { id:'ten_grat', name:'Grato', icon:'&#127775;', desc:'Escreva 10 gratidões', check:() => state.gratitudeEntries.length >= 10 },
  { id:'sos_used', name:'Resiliente', icon:'&#9888;', desc:'Use o SOS uma vez', check:() => parseInt(localStorage.getItem('cm_sos_count') || '0') >= 1 },
  { id:'program_done', name:'Graduado', icon:'&#127891;', desc:'Complete um programa inteiro', check:() => { const pp = Object.values(programProgress); return pp.some(v => v >= 30) || pp.some((v,i) => v >= [7,21,14,14,30][i]); } },
];

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  const userTier = tiers[state.plan] || 0;
  const isPremium = userTier >= 2;
  grid.innerHTML = achievementList.map(a => {
    const unlocked = a.check();
    if (!isPremium && (a.id === 'week_streak' || a.id === 'month_streak' || a.id === 'fifty_moods')) {
      return `<div class="achievement-badge locked" style="cursor:pointer" onclick="openModal('premium')"><span class="ach-icon">🔒</span><span class="ach-name">Premium</span></div>`;
    }
    return `<div class="achievement-badge ${unlocked ? 'unlocked' : 'locked'}">
      <span class="ach-icon">${unlocked ? a.icon : '🔒'}</span>
      <span class="ach-name">${unlocked ? a.name : '???'}</span>
    </div>`;
  }).join('');
}

// Count SOS uses
document.getElementById('sosButton').addEventListener('click', function() {
  let count = parseInt(localStorage.getItem('cm_sos_count') || '0');
  localStorage.setItem('cm_sos_count', String(count + 1));
});

// ======================== CRISIS PLAN ========================
document.getElementById('saveCrisisPlan').addEventListener('click', () => {
  if (!hasAccess('premium')) return;
  const calm = document.getElementById('crisisCalm').value.trim();
  const call = document.getElementById('crisisCall').value.trim();
  const remind = document.getElementById('crisisRemind').value.trim();
  if (!calm && !call && !remind) { alert('Preencha pelo menos um campo.'); return; }
  const plan = { calm, call, remind };
  localStorage.setItem('cm_crisis_plan', JSON.stringify(plan));
  showCrisisPlan(plan);
  alert('Plano de crise salvo!');
});

function showCrisisPlan(plan) {
  const display = document.getElementById('crisisPlanDisplay');
  if (!plan) {
    const saved = localStorage.getItem('cm_crisis_plan');
    if (!saved) return;
    plan = JSON.parse(saved);
  }
  display.style.display = 'block';
  display.innerHTML = `
    <h4 style="margin-bottom:8px">&#128221; Meu Plano de Crise</h4>
    ${plan.calm ? `<p><strong>O que me acalma:</strong> ${plan.calm}</p>` : ''}
    ${plan.call ? `<p><strong>Quem ligar:</strong> ${plan.call}</p>` : ''}
    ${plan.remind ? `<p><strong>Lembrar:</strong> ${plan.remind}</p>` : ''}
    <button class="btn btn-secondary" style="margin-top:8px;font-size:0.82rem;padding:6px 16px" onclick="document.getElementById('crisisPlanDisplay').style.display='none';document.querySelector('.crisis-plan-form').style.display='block'">Editar</button>
  `;
  document.querySelector('.crisis-plan-form').style.display = 'none';
}
showCrisisPlan(null);

// ======================== INIT ========================
document.addEventListener('DOMContentLoaded', () => {
  showPage('dashboard');
});
