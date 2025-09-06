// Enhanced front-end demo. Do not use in production.
// Features: love theme, preferences (gender + show me), discover deck, likes/matches, messaging.

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const state = {
  masterProfiles: [],     // full set with genders
  profiles: [],           // filtered list
  idx: 0,
  likes: [],
  matches: [],
  currentUser: null,
  guest: false,
  prefs: { gender: 'prefer_not', show: 'everyone' },
  chats: {},              // { contactName: [ {from:'me'|'them', text, ts} ] }
  activeChat: null,       // contactName
};

const storage = {
  USERS: 'vitLoveUsers',
  CURRENT: 'vitLoveCurrent',
  LIKES: 'vitLoveLikes',
  MATCHES: 'vitLoveMatches',
  MSGS: 'vitLoveMsgs',
};

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(storage.USERS)) || [] } catch { return [] }
}
function saveUsers(users) {
  localStorage.setItem(storage.USERS, JSON.stringify(users));
}
function setCurrentUser(emailOrNull) {
  if (emailOrNull) localStorage.setItem(storage.CURRENT, JSON.stringify(emailOrNull));
  else localStorage.removeItem(storage.CURRENT);
}
function getCurrentUserEmail() {
  try { return JSON.parse(localStorage.getItem(storage.CURRENT)) } catch { return null }
}
function saveLikes(email, likes) {
  if (!email) return;
  localStorage.setItem(`${storage.LIKES}:${email}`, JSON.stringify(likes));
}
function loadLikes(email) {
  try { return JSON.parse(localStorage.getItem(`${storage.LIKES}:${email}`)) || [] } catch { return [] }
}
function saveMatches(email, matches) {
  if (!email) return;
  localStorage.setItem(`${storage.MATCHES}:${email}`, JSON.stringify(matches));
}
function loadMatches(email) {
  try { return JSON.parse(localStorage.getItem(`${storage.MATCHES}:${email}`)) || [] } catch { return [] }
}
function saveMsgs(email, chats) {
  const key = `${storage.MSGS}:${email || 'guest'}`;
  localStorage.setItem(key, JSON.stringify(chats));
}
function loadMsgs(email) {
  try {
    const key = `${storage.MSGS}:${email || 'guest'}`;
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch { return {} }
}

function toast(msg, type='info') {
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast glass t-${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
  }, 2200);
  setTimeout(() => el.remove(), 2800);
}
(function styleToasts(){
  const style = document.createElement('style');
  style.textContent = `
  .toasts{ position: fixed; right: 12px; bottom: 12px; display:grid; gap:10px; z-index: 60 }
  .toast{ padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,.5); background: rgba(255,255,255,.9); transition: all .5s ease }
  .t-info{ color:#6d5776 }
  .t-ok{ color:#0b8350 }
  .t-warn{ color:#c06700 }
  .t-err{ color:#c21d4a }
  `;
  document.head.appendChild(style);
})();

// Demo profiles with genders
function seedProfiles(){
  const samples = [
    {
      name: 'Priya Sharma', gender: 'female',
      meta: 'B.Tech CSE, 3rd Year • VIT Vellore',
      bio: 'Coffee lover, late-night coder, and sunset chaser. Let’s trade playlists and chai spots.',
      tags: ['Photography','Anime','Badminton'], compat: 62
    },
    {
      name: 'Arjun Mehta', gender: 'male',
      meta: 'B.Tech ECE, 2nd Year • VIT Vellore',
      bio: 'Gym + guitar + good vibes. If we match, I’ll play you a song under the stars.',
      tags: ['Guitar','Gym','Marvel'], compat: 74
    },
    {
      name: 'Sneha Iyer', gender: 'female',
      meta: 'B.Des, 1st Year • VIT Vellore',
      bio: 'Designing by day, stargazing by night. Matcha > coffee. Teach me your favorite sketch trick!',
      tags: ['Art','UX','Stargazing'], compat: 68
    },
    {
      name: 'Rohit Singh', gender: 'male',
      meta: 'BBA, 3rd Year • VIT Vellore',
      bio: 'Entrepreneur in the making. Street food explorer. Let’s plan a food crawl.',
      tags: ['Startups','Cricket','Street Food'], compat: 59
    },
    {
      name: 'Aisha Khan', gender: 'female',
      meta: 'B.Sc Biotech, 2nd Year • VIT Vellore',
      bio: 'Plants, playlists, and poetry. Can make a killer hot chocolate.',
      tags: ['Poetry','Indie Music','Plants'], compat: 81
    },
    {
      name: 'Kartik Rao', gender: 'male',
      meta: 'M.Tech CSE, 1st Year • VIT Vellore',
      bio: 'Cloud, AI, and cuddly cats. Looking for café study buddy.',
      tags: ['AI','Cats','F1'], compat: 71
    },
    {
      name: 'Nisha Verma', gender: 'female',
      meta: 'BCA, 2nd Year • VIT Vellore',
      bio: 'Baking brownies and bingeing K-dramas. Share your favorite OST?',
      tags: ['Baking', 'K-Drama', 'Dance'], compat: 65
    },
    {
      name: 'Dev Patel', gender: 'male',
      meta: 'B.Tech Mechanical, 4th Year • VIT Vellore',
      bio: 'Bike trips and street photography. Let’s chase sunsets together.',
      tags: ['Bikes', 'Photography', 'Football'], compat: 69
    },
    {
      name: 'Aru Nair', gender: 'nonbinary',
      meta: 'M.Sc Data Science, 1st Year • VIT Vellore',
      bio: 'Neural nets, lo-fi beats, and latte art. Coffee walk?',
      tags: ['Data', 'Lo-fi', 'Coffee'], compat: 77
    },
  ];
  // Duplicate/shuffle lightly for a bigger deck
  const arr = [...samples, ...samples.map(s => ({...s, compat: Math.min(95, Math.max(40, s.compat + (Math.random()*24-12))), clone:true}))];
  return arr.sort(() => Math.random() - 0.5);
}

function initials(name){
  return (name?.match(/\b\w/g) || []).slice(0,2).join('').toUpperCase();
}
function avatarStyle(name){
  // Make a pseudo-random pastel gradient
  let hash = 0;
  for (let i=0;i<name.length;i++) hash = (hash*31 + name.charCodeAt(i))>>>0;
  const h1 = hash % 360;
  const h2 = (h1 + 40 + (hash % 60)) % 360;
  return `background: linear-gradient(135deg, hsl(${h1} 80% 75%), hsl(${h2} 80% 70%));`;
}

function renderProfile(idx){
  const p = state.profiles[idx];
  const card = $('#profile-card');
  if (!p) {
    card.querySelector('#p-name').textContent = 'No more profiles';
    card.querySelector('#p-meta').textContent = 'You’ve reached the end of the deck';
    card.querySelector('#p-bio').textContent = 'Change Preferences or come back later.';
    card.querySelector('#p-tags').innerHTML = '';
    $('#compat-bar').style.width = '0%';
    $('#compat-pct').textContent = '0%';
    $('#p-avatar').style = '';
    $('#p-avatar').textContent = '';
    return;
  }
  $('#p-name').textContent = p.name;
  $('#p-meta').textContent = `${p.meta}`;
  $('#p-bio').textContent = p.bio;
  const tags = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
  $('#p-tags').innerHTML = tags;
  $('#compat-bar').style.width = `${Math.round(p.compat)}%`;
  $('#compat-pct').textContent = `${Math.round(p.compat)}%`;
  const av = $('#p-avatar');
  av.textContent = initials(p.name);
  av.setAttribute('style', `${avatarStyle(p.name)}`);
}

function nextProfile(delta=1){
  const len = state.profiles.length;
  if (!len) return;
  state.idx = Math.max(0, Math.min(len-1, state.idx + delta));
  renderProfile(state.idx);
}

function likeCurrent(ev){
  const p = state.profiles[state.idx];
  if (!p) return;
  // Save like
  const like = { name: p.name, meta: p.meta, ts: Date.now() };
  if (!state.likes.find(x => x.name === like.name && x.meta === like.meta)){
    state.likes.unshift(like);
    if (!state.guest && state.currentUser?.email) saveLikes(state.currentUser.email, state.likes);
    toast(`You liked ${p.name} 💖`, 'ok');
  } else {
    toast(`Already liked ${p.name} 💗`, 'info');
  }

  // Hearts burst on like
  if (window.heartBurst && ev?.currentTarget) {
    const rect = ev.currentTarget.getBoundingClientRect();
    window.heartBurst(rect.left + rect.width/2, rect.top + rect.height/2);
  }

  // Random chance for a "match" demo
  if (Math.random() > 0.55) {
    if (!state.matches.find(x => x.name === p.name)){
      state.matches.unshift({ name: p.name, meta: p.meta, ts: Date.now() });
      if (!state.guest && state.currentUser?.email) saveMatches(state.currentUser.email, state.matches);
      toast(`It's a match with ${p.name}! 💞`, 'ok');
    }
  }

  updateLists();
  nextProfile(1);
}

function skipCurrent(){
  const p = state.profiles[state.idx];
  if (!p) return;
  toast(`Skipped ${p.name}`, 'warn');
  nextProfile(1);
}

function updatePrefSummary(){
  const mapShow = { men: 'Men', women: 'Women', everyone: 'Everyone' };
  const mapGender = { male: 'Man', female:'Woman', nonbinary: 'Non-binary', prefer_not: 'Prefer not to say' };
  $('#pref-summary').textContent = `You are: ${mapGender[state.prefs.gender]} • Showing: ${mapShow[state.prefs.show]}`;
}

function updateLists(){
  // Likes
  const likesUl = $('#likes-list');
  likesUl.innerHTML = '';
  if (!state.likes.length){
    likesUl.innerHTML = `<li class="list-item"><span class="muted">No likes yet</span></li>`;
  } else {
    state.likes.forEach(l => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <div>
          <div><strong>${l.name}</strong></div>
          <div class="tiny">${l.meta}</div>
        </div>
        <span class="pill like">Liked ❤</span>
      `;
      likesUl.appendChild(li);
    });
  }

  // Matches
  const mUl = $('#matches-list');
  mUl.innerHTML = '';
  if (!state.matches.length){
    mUl.innerHTML = `<li class="list-item"><span class="muted">No matches yet</span></li>`;
  } else {
    state.matches.forEach(m => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <div>
          <div><strong>${m.name}</strong></div>
          <div class="tiny">${m.meta}</div>
        </div>
        <div class="actions">
          <button class="btn small soft" data-message="${m.name}">Message</button>
          <span class="pill match">Match 💞</span>
        </div>
      `;
      mUl.appendChild(li);
    });
  }

  renderChatsList();
}

function setLoggedInUI(on){
  $('#hero').classList.toggle('hidden', on);
  $('#dashboard').classList.toggle('hidden', !on);
  $('#open-auth').classList.toggle('hidden', on);
  $('#open-auth-2').classList.toggle('hidden', on);
  $('#logout').classList.toggle('hidden', !on);
  $('#logout-2').classList.toggle('hidden', !on);
  $('#open-prefs').classList.toggle('hidden', !on);
  $('#open-prefs-2').classList.toggle('hidden', !on);
  $('#open-chats').classList.toggle('hidden', !on);
  $('#open-chats-2').classList.toggle('hidden', !on);
}

function applyDiscoverFilter(){
  const show = state.prefs.show || 'everyone';
  let filtered = state.masterProfiles.slice();
  if (show === 'men') filtered = filtered.filter(p => p.gender === 'male');
  if (show === 'women') filtered = filtered.filter(p => p.gender === 'female');
  // everyone => no filter
  state.profiles = filtered;
  state.idx = 0;
  renderProfile(0);
  updatePrefSummary();
}

function initSession(){
  const users = loadUsers();
  const email = getCurrentUserEmail();

  if (email){
    const user = users.find(u => u.email === email);
    if (user){
      state.currentUser = user;
      state.guest = false;
      $('#welcome-name').textContent = user.name.split(' ')[0] || 'VITian';
      state.likes = loadLikes(user.email);
      state.matches = loadMatches(user.email);
      state.chats = loadMsgs(user.email);
      // default prefs if missing
      state.prefs.gender = user.gender || 'prefer_not';
      state.prefs.show = user.show || 'everyone';
      setLoggedInUI(true);
      applyDiscoverFilter();
      updateLists();
      return;
    }
  }
  // default not logged in
  state.currentUser = null;
  state.guest = false;
  state.prefs = { gender: 'prefer_not', show: 'everyone' };
  $('#welcome-name').textContent = 'VITian';
  setLoggedInUI(false);
  updatePrefSummary();
}

function doLogin(email, password){
  const users = loadUsers();
  const u = users.find(x => x.email === email);
  if (!u) throw new Error('No account found for this email.');
  if ((u.password || '') !== password) throw new Error('Incorrect password.');
  state.currentUser = u;
  state.guest = false;
  setCurrentUser(u.email);
  $('#welcome-name').textContent = u.name.split(' ')[0] || 'VITian';
  state.likes = loadLikes(u.email);
  state.matches = loadMatches(u.email);
  state.chats = loadMsgs(u.email);
  state.prefs.gender = u.gender || 'prefer_not';
  state.prefs.show = u.show || 'everyone';
  setLoggedInUI(true);
  applyDiscoverFilter();
  updateLists();
}

function doSignup(name, email, password, gender, show){
  const users = loadUsers();
  if (users.some(u => u.email === email)){
    throw new Error('Email already registered. Try logging in.');
  }
  const user = { name, email, password, gender, show }; // For demo only.
  users.push(user);
  saveUsers(users);
  state.currentUser = user;
  state.guest = false;
  setCurrentUser(user.email);
  $('#welcome-name').textContent = user.name.split(' ')[0] || 'VITian';
  state.likes = [];
  state.matches = [];
  state.chats = {};
  state.prefs.gender = user.gender || 'prefer_not';
  state.prefs.show = user.show || 'everyone';
  if (!state.guest && state.currentUser?.email){
    saveLikes(state.currentUser.email, state.likes);
    saveMatches(state.currentUser.email, state.matches);
    saveMsgs(state.currentUser.email, state.chats);
  }
  setLoggedInUI(true);
  applyDiscoverFilter();
  updateLists();
}

function logout(){
  setCurrentUser(null);
  state.currentUser = null;
  state.guest = false;
  setLoggedInUI(false);
  toast('Logged out', 'info');
}

function continueAsGuest(){
  state.currentUser = { name: 'Guest', email: null, gender: 'prefer_not', show: 'everyone' };
  state.prefs = { gender: 'prefer_not', show: 'everyone' };
  state.guest = true;
  $('#welcome-name').textContent = 'Guest';
  state.likes = [];
  state.matches = [];
  state.chats = {};
  setLoggedInUI(true);
  applyDiscoverFilter();
  updateLists();
  toast('Continuing as Guest (data won’t persist)', 'info');
  openPrefs(); // prompt to set preferences
}

/* Hearts background + sparkles */
function spawnHeart() {
  const layer = $('#hearts-layer');
  const span = document.createElement('span');
  span.className = 'heart';
  span.textContent = Math.random() > 0.2 ? '❤' : (Math.random() > 0.5 ? '💖' : '💕');
  const left = Math.random() * 100; // vw%
  const size = 12 + Math.random() * 22; // px
  const duration = 7 + Math.random() * 9; // s
  const delay = Math.random() * 2;
  const rot = (Math.random() * 36 - 18).toFixed(2);

  span.style.left = `${left}vw`;
  span.style.bottom = `-40px`;
  span.style.fontSize = `${size}px`;
  span.style.setProperty('--scale', (0.8 + Math.random()*0.8).toFixed(2));
  span.style.animationDuration = `${duration}s`;
  span.style.animationDelay = `${delay}s`;
  span.style.filter = `drop-shadow(0 3px 6px rgba(255,77,136,0.18)) hue-rotate(${rot}deg)`;
  layer.appendChild(span);

  const ttl = (duration + delay) * 1000 + 100;
  setTimeout(() => span.remove(), ttl);
}

function startHearts(){
  for (let i=0;i<20;i++) setTimeout(spawnHeart, i*120);
  setInterval(() => { for (let i=0;i<3;i++) spawnHeart(); }, 1200);
}

// Click sparkles hearts
function initSparkles(){
  const canvas = $('#sparkle-canvas');
  const ctx = canvas.getContext('2d');
  let scaled = false;
  function resize(){
    const ratio = window.devicePixelRatio || 1;
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(ratio, ratio);
    scaled = true;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  function burst(x, y){
    const n = 16;
    for (let i=0;i<n;i++){
      particles.push({
        x, y,
        vx: (Math.random()*2-1)*2.2,
        vy: (Math.random()*2-1)*2.2 - 1.2,
        life: 1,
        size: 9 + Math.random()*6,
        rot: Math.random()*Math.PI*2,
        hue: 330 + Math.random()*40,
      });
    }
  }
  // expose global for like button burst
  window.heartBurst = burst;

  window.addEventListener('pointerdown', (e) => burst(e.clientX, e.clientY));

  function drawHeart(x, y, size, rot, color){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    const s = size/15;
    for (let t=0; t<Math.PI*2; t+=0.2){
      const px = 16 * Math.pow(Math.sin(t),3);
      const py = 13 * Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);
      if (t===0) ctx.moveTo(px*s, -py*s);
      else ctx.lineTo(px*s, -py*s);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Already scaled to CSS pixels via ctx.scale in resize
    for (let i=particles.length-1; i>=0; i--){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04; // gravity
      p.life -= 0.016;
      p.rot += 0.05;
      if (p.life <= 0) { particles.splice(i,1); continue; }
      ctx.globalAlpha = Math.max(0, p.life);
      drawHeart(p.x, p.y, p.size, p.rot, `hsl(${p.hue} 80% 60%)`);
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(loop);
  }
  loop();
}

/* Preferences Modal */
function openPrefs(){
  // set current values
  $('#pref-gender').value = state.prefs.gender || 'prefer_not';
  $('#pref-show').value = state.prefs.show || 'everyone';
  $('#prefs-modal').classList.remove('hidden');
}
function closePrefs(){ $('#prefs-modal').classList.add('hidden') }

/* Chats modals */
function openChatsList(){
  renderChatsList();
  $('#chats-modal').classList.remove('hidden');
}
function closeChatsList(){ $('#chats-modal').classList.add('hidden') }

function renderChatsList(){
  const ul = $('#chats-list');
  ul.innerHTML = '';
  const contacts = new Set();
  // add all matches
  state.matches.forEach(m => contacts.add(m.name));
  // add anyone you have an existing chat with
  Object.keys(state.chats || {}).forEach(n => contacts.add(n));
  const names = Array.from(contacts);
  if (names.length === 0){
    ul.innerHTML = `<li class="list-item"><span class="muted">No chats yet. Like and match to start a chat!</span></li>`;
    return;
  }
  names.forEach(name => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px">
        <div class="avatar sm" style="${avatarStyle(name)}">${initials(name)}</div>
        <div><strong>${name}</strong><div class="tiny muted">Tap to open chat</div></div>
      </div>
      <button class="btn small soft" data-open-chat="${name}">Open</button>
    `;
    ul.appendChild(li);
  });
}

/* Single Chat Modal */
function openChat(contact){
  state.activeChat = contact;
  $('#chat-title').textContent = contact;
  $('#chat-avatar').setAttribute('style', avatarStyle(contact));
  $('#chat-avatar').textContent = initials(contact);
  renderChatThread();
  $('#chat-modal').classList.remove('hidden');
  setTimeout(() => $('#chat-text').focus(), 60);
}
function closeChat(){
  state.activeChat = null;
  $('#chat-modal').classList.add('hidden');
}

function getChat(contact){
  if (!state.chats[contact]) state.chats[contact] = [];
  return state.chats[contact];
}
function renderChatThread(){
  const contact = state.activeChat;
  const thread = $('#chat-thread');
  thread.innerHTML = '';
  const msgs = getChat(contact);
  msgs.sort((a,b) => a.ts - b.ts);
  msgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `bubble ${m.from}`;
    div.textContent = m.text;
    thread.appendChild(div);
  });
  thread.scrollTop = thread.scrollHeight;
}
function persistChats(){
  if (!state.guest && state.currentUser?.email) {
    saveMsgs(state.currentUser.email, state.chats);
  } else {
    saveMsgs(null, state.chats); // guest
  }
}
function sendMessage(text){
  const contact = state.activeChat;
  if (!contact || !text.trim()) return;
  const msg = { from:'me', text: text.trim(), ts: Date.now() };
  getChat(contact).push(msg);
  persistChats();
  renderChatThread();

  // Simulated cute auto-reply
  setTimeout(() => {
    const replies = [
      "Aww that’s cute! 💕",
      "Haha, I like that! 😊",
      "Tell me more! ✨",
      "Coffee this weekend? ☕",
      "That made me smile! 💗"
    ];
    const reply = { from:'them', text: replies[Math.floor(Math.random()*replies.length)], ts: Date.now() };
    getChat(contact).push(reply);
    persistChats();
    renderChatThread();
  }, 700 + Math.random()*1200);
}

/* Validation helpers */
function setError(id, msg){
  const el = document.getElementById(id);
  if (el) el.textContent = msg || '';
}

/* Event wiring */
function attachEvents(){
  // Auth open/close
  $('#open-auth').addEventListener('click', () => $('#auth-modal').classList.remove('hidden'));
  $('#open-auth-2').addEventListener('click', () => $('#auth-modal').classList.remove('hidden'));
  $('[data-close-modal]').addEventListener('click', () => $('#auth-modal').classList.add('hidden'));
  $('.modal-backdrop').addEventListener('click', (e) => {
    if (e.target.closest('#auth-modal')) $('#auth-modal').classList.add('hidden');
  });
  $('#hero-cta').addEventListener('click', () => $('#auth-modal').classList.remove('hidden'));

  // Tabs
  $('#tab-login').addEventListener('click', () => switchTab('login'));
  $('#tab-signup').addEventListener('click', () => switchTab('signup'));

  // Guest buttons
  $('#hero-guest').addEventListener('click', () => { continueAsGuest(); $('#auth-modal').classList.add('hidden'); });
  $('#login-guest').addEventListener('click', () => { continueAsGuest(); $('#auth-modal').classList.add('hidden'); });

  // Logout
  $('#logout').addEventListener('click', logout);
  $('#logout-2').addEventListener('click', logout);

  // Discover buttons
  $('#btn-like').addEventListener('click', likeCurrent);
  // Pass event to likeCurrent for heart burst
  $('#btn-like').addEventListener('click', (ev) => likeCurrent(ev));
  $('#btn-skip').addEventListener('click', skipCurrent);
  $('#next-profile').addEventListener('click', () => nextProfile(1));
  $('#prev-profile').addEventListener('click', () => nextProfile(-1));

  // Login submit
  $('#form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim().toLowerCase();
    const password = $('#login-password').value;
    setError('login-email-err', '');
    setError('login-password-err', '');
    try{
      if (!email) return setError('login-email-err', 'Email is required');
      if (!password) return setError('login-password-err', 'Password is required');
      doLogin(email, password);
      toast('Logged in successfully 💘', 'ok');
      $('#auth-modal').classList.add('hidden');
    }catch(err){
      toast(err.message || 'Login failed', 'err');
      if ((err.message || '').toLowerCase().includes('password')) setError('login-password-err', err.message);
      else setError('login-email-err', err.message);
    }
  });

  // Signup submit with prefs
  $('#form-signup').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#su-name').value.trim();
    const email = $('#su-email').value.trim().toLowerCase();
    const password = $('#su-password').value;
    const gender = $('#su-gender').value;
    const show = $('#su-show').value;
    setError('su-name-err',''); setError('su-email-err',''); setError('su-password-err','');
    try{
      if (!name) return setError('su-name-err','Name is required');
      if (!email) return setError('su-email-err','Email is required');
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return setError('su-email-err','Enter a valid email');
      if (password.length < 6) return setError('su-password-err','Minimum 6 characters');
      doSignup(name, email, password, gender, show);
      toast('Account created! 💖', 'ok');
      $('#auth-modal').classList.add('hidden');
    }catch(err){
      toast(err.message || 'Signup failed', 'err');
      setError('su-email-err', err.message);
    }
  });

  // Preferences open/close
  $('#open-prefs').addEventListener('click', openPrefs);
  $('#open-prefs-2').addEventListener('click', openPrefs);
  $('[data-close-prefs]').addEventListener('click', closePrefs);
  $('#prefs-modal .modal-backdrop').addEventListener('click', closePrefs);
  $('#form-prefs').addEventListener('submit', (e) => {
    e.preventDefault();
    state.prefs.gender = $('#pref-gender').value;
    state.prefs.show = $('#pref-show').value;
    // persist to user
    if (state.currentUser) {
      state.currentUser.gender = state.prefs.gender;
      state.currentUser.show = state.prefs.show;
      const users = loadUsers();
      const idx = users.findIndex(u => u.email === state.currentUser.email);
      if (idx >= 0) {
        users[idx] = {...users[idx], gender: state.prefs.gender, show: state.prefs.show};
        saveUsers(users);
      }
    }
    applyDiscoverFilter();
    closePrefs();
    toast('Preferences updated 💗', 'ok');
  });

  // Chats list open/close
  $('#open-chats').addEventListener('click', openChatsList);
  $('#open-chats-2').addEventListener('click', openChatsList);
  $('[data-close-chats]').addEventListener('click', closeChatsList);
  $('#chats-modal .modal-backdrop').addEventListener('click', closeChatsList);
  // open chat from chats list
  $('#chats-list').addEventListener('click', (e) => {
    const name = e.target?.getAttribute?.('data-open-chat');
    if (name){
      closeChatsList();
      openChat(name);
    }
  });

  // Open chat from matches list
  $('#matches-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-message]');
    if (btn){
      openChat(btn.getAttribute('data-message'));
    }
  });

  // Chat modal open/close
  $('[data-close-chat]').addEventListener('click', closeChat);
  $('#chat-modal .modal-backdrop').addEventListener('click', closeChat);
  // Chat send
  $('#chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#chat-text').value;
    if (!text.trim()) return;
    sendMessage(text);
    $('#chat-text').value = '';
  });
}

function switchTab(tab){
  $('#tab-login').classList.toggle('active', tab==='login');
  $('#tab-signup').classList.toggle('active', tab==='signup');
  $('#form-login').classList.toggle('active', tab==='login');
  $('#form-signup').classList.toggle('active', tab==='signup');
}

function attachKeyboard(){
  // Arrow keys to navigate
  window.addEventListener('keydown', (e) => {
    if ($('#dashboard').classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') nextProfile(1);
    if (e.key === 'ArrowLeft') nextProfile(-1);
    if (e.key.toLowerCase() === 'l') likeCurrent();
    if (e.key.toLowerCase() === 's') skipCurrent();
  });
}

function init(){
  state.masterProfiles = seedProfiles();
  state.prefs = { gender: 'prefer_not', show: 'everyone' };
  applyDiscoverFilter(); // initializes profiles and renders
  initSession();
  attachEvents();
  attachKeyboard();
  startHearts();
  initSparkles();
}

document.addEventListener('DOMContentLoaded', init);