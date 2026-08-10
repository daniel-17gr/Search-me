(function () {
  const app         = document.getElementById('app');
  const catWrapper  = document.getElementById('catWrapper');
  const catSvg      = document.getElementById('catSvg');
  const catHead     = document.getElementById('catHead');
  const miauBubble  = document.getElementById('miauBubble');
  const searchWrapper = document.getElementById('searchWrapper');
  const searchForm  = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');

  // ── State Machine ──────────────────────────────────────────
  const ALL_STATES = ['awake','typing','happy','playing','sleeping','surprised','walking','frustrated'];
  let currentState  = 'idle';
  let idleTimer     = null;
  let returnTimer   = null;
  let bubbleTimer   = null;
  let walkTimer     = null;
  let stopWalkTimer = null;
  let currentWalkX  = 0;
  let lastValLength = 0;
  let deleteCount   = 0;
  let suggestDebounce = null;

  function setState(s) {
    if (currentState === s) return;
    ALL_STATES.forEach(x => app.classList.remove('state-' + x));
    if (s !== 'idle') app.classList.add('state-' + s);
    currentState = s;
  }

  function getBaseState() {
    if (document.activeElement === searchInput) {
      return searchInput.value.length > 0 ? 'typing' : 'awake';
    }
    return 'idle';
  }

  // ── Casual Walking Routine ─────────────────────────────────
  function stopWalking() {
    clearTimeout(stopWalkTimer);
    app.style.setProperty('--walk-x', '0px');
    app.style.setProperty('--walk-scale', '1');
    currentWalkX = 0;
  }

  function triggerCasualWalk() {
    if (document.activeElement === searchInput) return;
    if (currentState === 'sleeping' || currentState === 'happy' || currentState === 'playing') return;

    const positions = [-130, -80, 0, 80, 130];
    let nextX = positions[Math.floor(Math.random() * positions.length)];
    if (Math.abs(nextX - currentWalkX) < 40) {
      nextX = currentWalkX > 0 ? -90 : 90;
    }

    const distance = Math.abs(nextX - currentWalkX);
    const duration = Math.max(1.1, distance / 85);

    catWrapper.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1)`;
    app.style.setProperty('--walk-x', `${nextX}px`);
    app.style.setProperty('--walk-scale', '1'); // No flip rotation

    currentWalkX = nextX;
    setState('walking');

    clearTimeout(stopWalkTimer);
    stopWalkTimer = setTimeout(() => {
      if (currentState === 'walking') {
        setState(getBaseState());
      }
    }, duration * 1000);
  }

  function scheduleCasualWalk() {
    clearInterval(walkTimer);
    walkTimer = setInterval(() => {
      if ((currentState === 'idle' || currentState === 'awake') && document.activeElement !== searchInput) {
        triggerCasualWalk();
      }
    }, 3800);
  }

  // ── Meow Audio & Simple Cute Phrases ─────────────────────
  const meowPhrases = ['miau~', 'nya~', 'purr..', 'ニャー！', 'miau ♡', 'ゴロゴロ~', 'なに？', 'ooh!'];

  function playMeow() {
    const src = Math.random() > 0.5 ? 'meow.ogg' : 'meow2.ogg';
    try {
      const a = new Audio(src);
      a.volume = 0.12;
      a.play().catch(synthMeow);
    } catch (_) { synthMeow(); }
  }

  function synthMeow() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(860, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(500, t + 0.27);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.02, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.27);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch (_) {}
  }

  const miauBubbleText = document.getElementById('miauBubbleText');

  function showBubble(txt, skipSound) {
    const text = txt || meowPhrases[Math.floor(Math.random() * meowPhrases.length)];
    if (miauBubbleText) {
      miauBubbleText.textContent = text;
    } else {
      miauBubble.textContent = text;
    }
    miauBubble.classList.add('show');
    if (!skipSound) playMeow();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => miauBubble.classList.remove('show'), 2200);
  }

  // ── Simple & Cute Thoughts ────────────────────────────────
  function isUrl(str) {
    const s = str.trim();
    return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i.test(s) ||
           /\.(com|org|net|io|dev|app|edu|gov|co|uk)(\/|$)/i.test(s);
  }

  const frustratedPhrases = [
    'wait! 😾',
    'hey! 🐾',
    'stop! 😼',
    'huh? 🤯',
    'ダメ！ 😾',
    'ヤバい！ 🙀',
    'ちょっと！ 😾'
  ];

  const lowIqThoughts = [
    'miau~ 🐾',
    'nya! ✨',
    'huh? 😳',
    'ooh! 💭',
    'salmon? 🐟',
    'なに？ 🐾',
    'food? 🍗',
    'ニャー！ 😸',
    'ねむい... 💤',
    'すごい！ ✨',
    'かりかり 🦴',
    'ちゅ〜る 🐟',
    'ヤバい！ 🙀',
    'loafing 🍞',
    'purr~ 💖',
    'ek-ek! 😹',
    'greebles? 👻',
    'zoomies! ⚡',
    'head empty 🧠',
    'まぐろ！ 🍣',
    'あそぼ！ 🎾',
    'おなかへった 🍱',
    'ご飯ちょうだい 🐟'
  ];

  function handleTypingThoughts(val) {
    const query = val.trim();
    if (!query) {
      miauBubble.classList.remove('show');
      return;
    }

    if (isUrl(query)) {
      showBubble('open link! 🚀', true);
      return;
    }

    // Natural simple cat thought
    const thought = lowIqThoughts[Math.floor(Math.random() * lowIqThoughts.length)];
    showBubble(thought, true);
  }

  // ── Idle Timer ────────────────────────────────────────────
  function resetIdle() {
    if (currentState === 'sleeping') {
      stopWalking();
      setState(getBaseState());
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (document.activeElement !== searchInput) {
        stopWalking();
        setState('sleeping');
      }
    }, 9000);
  }

  // ── Cursor / Eye Tracking ─────────────────────────────────
  let lastMouseX = window.innerWidth / 2;
  let lastMouseY = window.innerHeight / 2;

  window.addEventListener('mousemove', e => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    resetIdle();
    updateEyeTracking();
  });

  function updateEyeTracking() {
    if (currentState === 'sleeping' || currentState === 'happy' ||
        currentState === 'surprised' || currentState === 'walking') return;

    if (currentState === 'typing' && searchInput.value.length > 0) {
      const shift = Math.min(searchInput.value.length * 1.0, 9);
      app.style.setProperty('--eye-x', shift + 'px');
      app.style.setProperty('--eye-y', '0px');
      app.style.setProperty('--head-tilt', '0deg');
      return;
    }

    const rect   = catSvg.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = lastMouseX - cx;
    const dy     = lastMouseY - cy;

    const eyeX   = Math.max(-5,   Math.min(5,   dx / 38));
    const eyeY   = Math.max(-3.5, Math.min(3.5, dy / 52));
    const tilt   = Math.max(-4.5, Math.min(4.5, dx / 88));

    app.style.setProperty('--eye-x',    eyeX + 'px');
    app.style.setProperty('--eye-y',    eyeY + 'px');
    app.style.setProperty('--head-tilt', tilt + 'deg');
  }

  function clearEyeTracking() {
    app.style.setProperty('--eye-x',    '0px');
    app.style.setProperty('--eye-y',    '0px');
    app.style.setProperty('--head-tilt','0deg');
  }

  // ── Cat Click / Touch ──────────────────────────────────────
  catWrapper.addEventListener('click', e => {
    e.stopPropagation();
    resetIdle();
    clearTimeout(returnTimer);

    if (currentState === 'sleeping') {
      setState('surprised');
      showBubble('miau!');
      returnTimer = setTimeout(() => setState(getBaseState()), 700);
      return;
    }

    const roll = Math.random();
    if (roll < 0.5) {
      setState('happy');
      showBubble();
      returnTimer = setTimeout(() => setState(getBaseState()), 750);
    } else {
      setState('playing');
      showBubble('nya~');
      returnTimer = setTimeout(() => setState(getBaseState()), 780);
    }
  });

  // ── 52 Web Destinations Database ─────────────────────────────
  const SITE_DATABASE = [
    { title: 'Firebase Console', url: 'https://console.firebase.google.com', badge: 'Console', keys: ['firebase', 'console', 'database', 'firestore', 'auth'] },
    { title: 'Gemini AI', url: 'https://gemini.google.com', badge: 'AI', keys: ['gemini', 'ai', 'google ai', 'chat', 'llm'] },
    { title: 'Lucide Icons', url: 'https://lucide.dev', badge: 'Icons', keys: ['lucide', 'icons', 'svg', 'feather', 'ui'] },
    { title: 'GitHub', url: 'https://github.com', badge: 'Code', keys: ['github', 'git', 'repo', 'code', 'commit'] },
    { title: 'Search Me GitHub', url: 'https://github.com/daniel-17gr/Search-me', badge: 'Repo', keys: ['searchme', 'search me', 'daniel', 'daniel-17gr', 'github repo'] },
    { title: 'GitHub Settings', url: 'https://github.com/settings', badge: 'Settings', keys: ['github settings', 'keys', 'tokens', 'account'] },
    { title: 'YouTube', url: 'https://youtube.com', badge: 'Video', keys: ['youtube', 'yt', 'video', 'music', 'watch'] },
    { title: 'ChatGPT', url: 'https://chatgpt.com', badge: 'AI', keys: ['chatgpt', 'openai', 'gpt', 'ai'] },
    { title: 'Claude AI', url: 'https://claude.ai', badge: 'AI', keys: ['claude', 'anthropic', 'ai'] },
    { title: 'Vercel', url: 'https://vercel.com', badge: 'Deploy', keys: ['vercel', 'deploy', 'nextjs', 'hosting'] },
    { title: 'Netlify', url: 'https://netlify.com', badge: 'Deploy', keys: ['netlify', 'deploy', 'jamstack'] },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com', badge: 'Dev', keys: ['stackoverflow', 'stack', 'debug', 'error'] },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', badge: 'Docs', keys: ['mdn', 'mozilla', 'js docs', 'html', 'css'] },
    { title: 'Tailwind CSS', url: 'https://tailwindcss.com', badge: 'CSS', keys: ['tailwind', 'css', 'styles', 'utility'] },
    { title: 'Figma', url: 'https://figma.com', badge: 'Design', keys: ['figma', 'design', 'ui', 'ux', 'vector'] },
    { title: 'NPM Registry', url: 'https://npmjs.com', badge: 'Packages', keys: ['npm', 'package', 'node', 'javascript'] },
    { title: 'Google Search', url: 'https://google.com', badge: 'Search', keys: ['google', 'search', 'find'] },
    { title: 'Google Cloud Console', url: 'https://console.cloud.google.com', badge: 'Cloud', keys: ['gcp', 'cloud', 'console'] },
    { title: 'Reddit', url: 'https://reddit.com', badge: 'Community', keys: ['reddit', 'sub', 'forum'] },
    { title: 'Twitter / X', url: 'https://x.com', badge: 'Social', keys: ['twitter', 'x', 'tweet'] },
    { title: 'Replit', url: 'https://replit.com', badge: 'IDE', keys: ['replit', 'ide', 'code'] },
    { title: 'CodePen', url: 'https://codepen.io', badge: 'IDE', keys: ['codepen', 'pen', 'demo'] },
    { title: 'StackBlitz', url: 'https://stackblitz.com', badge: 'IDE', keys: ['stackblitz', 'vite', 'ide'] },
    { title: 'Dev.to', url: 'https://dev.to', badge: 'Community', keys: ['devto', 'blog', 'article'] },
    { title: 'Product Hunt', url: 'https://producthunt.com', badge: 'Tech', keys: ['producthunt', 'launch', 'startup'] },
    { title: 'Notion', url: 'https://notion.so', badge: 'Notes', keys: ['notion', 'docs', 'wiki', 'notes'] },
    { title: 'Canva', url: 'https://canva.com', badge: 'Design', keys: ['canva', 'graphics', 'design'] },
    { title: 'Dribbble', url: 'https://dribbble.com', badge: 'Design', keys: ['dribbble', 'shots', 'design'] },
    { title: 'Behance', url: 'https://behance.net', badge: 'Design', keys: ['behance', 'portfolio', 'adobe'] },
    { title: 'Unsplash', url: 'https://unsplash.com', badge: 'Photos', keys: ['unsplash', 'stock', 'photo'] },
    { title: 'Pinterest', url: 'https://pinterest.com', badge: 'Ideas', keys: ['pinterest', 'pins', 'board'] },
    { title: 'LinkedIn', url: 'https://linkedin.com', badge: 'Network', keys: ['linkedin', 'job', 'work'] },
    { title: 'Twitch', url: 'https://twitch.tv', badge: 'Live', keys: ['twitch', 'stream', 'gaming'] },
    { title: 'Spotify', url: 'https://open.spotify.com', badge: 'Music', keys: ['spotify', 'music', 'playlist'] },
    { title: 'Discord', url: 'https://discord.com/app', badge: 'Chat', keys: ['discord', 'chat', 'community'] },
    { title: 'Slack', url: 'https://app.slack.com', badge: 'Chat', keys: ['slack', 'team', 'chat'] },
    { title: 'Gmail', url: 'https://mail.google.com', badge: 'Mail', keys: ['gmail', 'email', 'inbox'] },
    { title: 'Google Drive', url: 'https://drive.google.com', badge: 'Drive', keys: ['drive', 'google drive', 'files'] },
    { title: 'Google Docs', url: 'https://docs.google.com', badge: 'Docs', keys: ['docs', 'google docs', 'word'] },
    { title: 'Google Maps', url: 'https://maps.google.com', badge: 'Maps', keys: ['maps', 'navigation', 'location'] },
    { title: 'Google Translate', url: 'https://translate.google.com', badge: 'Tools', keys: ['translate', 'languages', 'dict'] },
    { title: 'Wikipedia', url: 'https://wikipedia.org', badge: 'Wiki', keys: ['wikipedia', 'wiki', 'encyclopedia'] },
    { title: 'Medium', url: 'https://medium.com', badge: 'Articles', keys: ['medium', 'blog', 'read'] },
    { title: 'Hacker News', url: 'https://news.ycombinator.com', badge: 'News', keys: ['hackernews', 'hn', 'ycombinator'] },
    { title: 'Icons8', url: 'https://icons8.com', badge: 'Icons', keys: ['icons8', 'icons', 'illustrations'] },
    { title: 'FontAwesome', url: 'https://fontawesome.com', badge: 'Icons', keys: ['fontawesome', 'fa', 'icons'] },
    { title: 'Bundlephobia', url: 'https://bundlephobia.com', badge: 'Tools', keys: ['bundlephobia', 'size', 'package'] },
    { title: 'RegExr', url: 'https://regexr.com', badge: 'Tools', keys: ['regexr', 'regex', 'pattern'] },
    { title: 'JSONLint', url: 'https://jsonlint.com', badge: 'Tools', keys: ['jsonlint', 'json', 'validator'] },
    { title: 'W3Schools', url: 'https://w3schools.com', badge: 'Docs', keys: ['w3schools', 'tutorial', 'html'] },
    { title: 'CSS-Tricks', url: 'https://css-tricks.com', badge: 'CSS', keys: ['csstricks', 'css', 'tricks'] },
    { title: 'Svelte', url: 'https://svelte.dev', badge: 'Framework', keys: ['svelte', 'sveltekit', 'framework'] },
    { title: 'ReactJS', url: 'https://react.dev', badge: 'Framework', keys: ['react', 'reactjs', 'jsx'] }
  ];

  // ── Search History (last 50, persisted in localStorage) ────
  const HISTORY_KEY = 'searchme_history';
  const MAX_HISTORY = 50;

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { return []; }
  }

  function saveToHistory(query, url) {
    const hist = getHistory();
    // Remove duplicate if exists
    const idx = hist.findIndex(h => h.query === query || h.url === url);
    if (idx !== -1) hist.splice(idx, 1);
    // Add to front
    hist.unshift({ query, url, time: Date.now() });
    // Cap at 50
    if (hist.length > MAX_HISTORY) hist.length = MAX_HISTORY;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(hist)); } catch {}
  }

  function computeGhostHint(raw, targetText) {
    const alpha = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!alpha) return '';

    let alphaCount = 0;
    let targetIdx = 0;
    const targetLower = targetText.toLowerCase();

    while (targetIdx < targetText.length && alphaCount < alpha.length) {
      const ch = targetLower[targetIdx];
      if (/[a-z0-9]/.test(ch)) {
        if (ch === alpha[alphaCount]) {
          alphaCount++;
        } else {
          return ''; // Mismatch
        }
      }
      targetIdx++;
    }

    if (alphaCount === alpha.length) {
      return targetText.slice(targetIdx);
    }
    return '';
  }

  function findHistoryMatch(raw) {
    const alpha = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!alpha) return null;
    const hist = getHistory();
    const candidates = [];

    for (const h of hist) {
      // 1. Check query match
      const hintQuery = computeGhostHint(raw, h.query);
      if (hintQuery) {
        candidates.push({ ghost: h.query, hint: hintQuery, url: h.url, len: h.query.length });
      }
      // 2. Check URL match
      const cleanUrl = h.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const hintUrl = computeGhostHint(raw, cleanUrl);
      if (hintUrl) {
        candidates.push({ ghost: cleanUrl, hint: hintUrl, url: h.url, len: cleanUrl.length });
      }
    }

    if (candidates.length === 0) return null;
    // Sort candidate matches: shortest string first (e.g. "hello" before "hello matt")
    candidates.sort((a, b) => a.len - b.len);
    return candidates[0];
  }

  // ── Inline Autocomplete Engine ──────────────────────────────
  const ghostTyped = document.getElementById('ghostTyped');
  const ghostHint  = document.getElementById('ghostHint');
  let currentGhostCompletion = '';
  let currentGhostUrl = '';
  let suggestCache = new Map();

  function findSiteMatch(raw) {
    const alpha = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!alpha) return null;
    const candidates = [];

    // Pass 1: Domain prefix ("you" → youtube.com)
    for (const s of SITE_DATABASE) {
      const clean = s.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const dom = clean.split('/')[0];
      const hint = computeGhostHint(raw, clean);
      if (hint) {
        candidates.push({ ghost: clean, hint, url: s.url, len: dom.length, priority: 1 });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.len - b.len);
      return candidates[0];
    }

    // Pass 2: Title prefix ("Fire" → console.firebase.google.com)
    for (const s of SITE_DATABASE) {
      const hint = computeGhostHint(raw, s.title);
      if (hint) {
        const clean = s.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        candidates.push({ ghost: clean, hint, url: s.url, len: s.title.length, priority: 2 });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.len - b.len);
      return candidates[0];
    }

    // Pass 3: Keyword ("deploy" → vercel.com)
    for (const s of SITE_DATABASE) {
      if (s.keys.some(k => k.replace(/[^a-z0-9]/g, '').startsWith(alpha))) {
        const clean = s.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return { url: s.url, ghost: clean, hint: clean };
      }
    }
    return null;
  }

  function setGhost(typed, hint, fullGhost, url) {
    if (!ghostTyped || !ghostHint) return;
    ghostTyped.textContent = typed;
    ghostHint.textContent  = hint;
    currentGhostCompletion = fullGhost;
    currentGhostUrl        = url;
  }

  function clearGhost() {
    if (ghostTyped) ghostTyped.textContent = '';
    if (ghostHint)  ghostHint.textContent  = '';
    currentGhostCompletion = '';
    currentGhostUrl        = '';
  }

  function ensureUrl(str) {
    if (/^https?:\/\//i.test(str)) return str;
    return 'https://' + str;
  }

  function runAutocomplete(raw) {
    if (!raw) { clearGhost(); return; }

    // 1. Search history first (most relevant to user)
    const hist = findHistoryMatch(raw);
    if (hist && hist.hint) {
      setGhost(raw, hist.hint, hist.ghost, hist.url);
      return;
    }

    // 2. Site database
    const site = findSiteMatch(raw);
    if (site && site.hint) {
      setGhost(raw, site.hint, site.ghost, site.url);
      return;
    }

    // 3. Google suggest cache
    const key = raw.toLowerCase();
    if (suggestCache.has(key)) {
      applyGoogleHint(raw, suggestCache.get(key));
      return;
    }

    // 4. Fetch Google suggest
    fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(raw)}`)
      .then(r => r.json())
      .then(d => {
        if (d && d[1] && d[1][0]) {
          suggestCache.set(key, d[1][0]);
          if (searchInput.value === raw) applyGoogleHint(raw, d[1][0]);
        }
      }).catch(() => {});
  }

  function applyGoogleHint(raw, suggestion) {
    const hint = computeGhostHint(raw, suggestion);
    if (hint) {
      setGhost(raw, hint, suggestion,
        `https://google.com/search?q=${encodeURIComponent(suggestion)}`);
    }
  }

  function navigateTo(query, url) {
    saveToHistory(query, url);
    window.location.href = url;
  }


  // ── Input Listeners ────────────────────────────────────────
  searchInput.addEventListener('focus', () => {
    resetIdle();
    stopWalking();
    runAutocomplete(searchInput.value);
    if (currentState !== 'happy' && currentState !== 'playing') setState('awake');
  });

  searchInput.addEventListener('input', () => {
    resetIdle();
    stopWalking();
    updateEyeTracking();
    runAutocomplete(searchInput.value);

    const curLen = searchInput.value.length;
    if (curLen < lastValLength) { deleteCount++; } else { deleteCount = 0; }
    lastValLength = curLen;

    if (deleteCount >= 2) {
      setState('frustrated');
      showBubble(frustratedPhrases[Math.floor(Math.random() * frustratedPhrases.length)], true);
      clearTimeout(returnTimer);
      returnTimer = setTimeout(() => { deleteCount = 0; setState(getBaseState()); }, 1300);
      return;
    }

    if (currentState !== 'happy' && currentState !== 'playing' && currentState !== 'frustrated') {
      setState(curLen > 0 ? 'typing' : 'awake');
    }
    if (currentState !== 'frustrated') miauBubble.classList.remove('show');

    clearTimeout(suggestDebounce);
    suggestDebounce = setTimeout(() => {
      if (isUrl(searchInput.value) || Math.random() < 0.35) handleTypingThoughts(searchInput.value);
    }, 1100);
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Tab' && currentGhostUrl) {
      e.preventDefault();
      const q = searchInput.value.trim();
      navigateTo(q || currentGhostCompletion, currentGhostUrl);
      return;
    }

    if (e.key === 'ArrowRight' && currentGhostCompletion
        && searchInput.selectionStart === searchInput.value.length) {
      e.preventDefault();
      searchInput.value = currentGhostCompletion;
      runAutocomplete(searchInput.value);
      return;
    }

    if (e.key === 'Escape') clearGhost();
  });

  searchInput.addEventListener('blur', () => {
    clearGhost();
    if (currentState === 'typing' || currentState === 'awake' || currentState === 'frustrated') setState('idle');
    clearEyeTracking();
    resetIdle();
  });

  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (!q) return;
    stopWalking();
    clearGhost();
    searchWrapper.classList.add('submitting');
    showBubble('miau!', true);
    setTimeout(() => {
      if (isUrl(q)) {
        const url = ensureUrl(q);
        navigateTo(q, url);
      } else {
        navigateTo(q, `https://google.com/search?q=${encodeURIComponent(q)}`);
      }
    }, 120);
  });

  // ── Keyboard Shortcut ─────────────────────────────────────
  window.addEventListener('keydown', e => {
    resetIdle();
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // ── Passive Listeners ─────────────────────────────────────
  ['mousedown', 'touchstart', 'scroll'].forEach(evt =>
    window.addEventListener(evt, resetIdle, { passive: true })
  );

  // ── Init ──────────────────────────────────────────────────
  setState('idle');
  resetIdle();
  scheduleCasualWalk();
})();
