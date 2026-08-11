(function () {
  const app         = document.getElementById('app');
  const catWrapper  = document.getElementById('catWrapper');
  const catSvg      = document.getElementById('catSvg');
  const catHead     = document.getElementById('catHead');
  const miauBubble  = document.getElementById('miauBubble');
  const searchWrapper = document.getElementById('searchWrapper');
  const searchForm  = document.getElementById('searchForm');
  const searchReflection = document.getElementById('searchReflection');
  const searchInput = document.getElementById('searchInput');
  const shortcutsRow = document.getElementById('shortcutsRow');

  // ── State Machine ──────────────────────────────────────────
  const ALL_STATES = ['awake','typing','happy','playing','sleeping','surprised','walking','frustrated','hover'];
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
    if (s !== 'playing') app.classList.remove('kick-left', 'kick-right');
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
    clearInterval(walkTimer);
    walkTimer = null;
    catWrapper.style.setProperty('--walk-x', '0px');
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

    // Set --walk-x on catWrapper directly (where the CSS transform reads it)
    catWrapper.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1)`;
    catWrapper.style.setProperty('--walk-x', `${nextX}px`);

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
      gain.gain.linearRampToValueAtTime(0.09, t + 0.04);
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
      stopWalking();
      setState('sleeping');
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
        currentState === 'surprised' || currentState === 'walking' || currentState === 'hover') return;

    let targetX = lastMouseX;
    let targetY = lastMouseY;

    // Track active falling/bouncing physics ball if present
    if (typeof activeBalls !== 'undefined' && activeBalls.length > 0) {
      const active = activeBalls.find(b => !b.settled) || activeBalls[0];
      if (active) {
        targetX = active.x;
        targetY = active.y;
      }
    }

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
    const dx     = targetX - cx;
    const dy     = targetY - cy;

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

  // ── Cat Mouse Hover Emotion & Click ──────────────────────
  const hoverPhrases = ['miau~', 'nya', 'purr..', 'なに？', 'ooh!'];

  catWrapper.addEventListener('mouseenter', () => {
    resetIdle();
    if (currentState === 'typing' || currentState === 'playing' ||
        currentState === 'surprised' || currentState === 'frustrated') return;

    stopWalking();
    setState('hover');
    showBubble(hoverPhrases[Math.floor(Math.random() * hoverPhrases.length)], true);
  });

  catWrapper.addEventListener('mouseleave', () => {
    resetIdle();
    if (currentState === 'hover') {
      setState(getBaseState());
    }
  });

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

    // Pass 1: Domain / Clean URL prefix ("you" → youtube.com, "git" → github.com)
    for (const s of SITE_DATABASE) {
      const clean = s.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const dom   = clean.split('/')[0];
      const hint  = computeGhostHint(raw, clean);
      if (hint) {
        candidates.push({ ghost: clean, hint, url: s.url, len: dom.length });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.len - b.len);
      return candidates[0];
    }

    // Pass 2: Title prefix only ("gem" → Gemini AI, "luc" → Lucide Icons)
    for (const s of SITE_DATABASE) {
      const hintTitle = computeGhostHint(raw, s.title);
      if (hintTitle) {
        candidates.push({ ghost: s.title, hint: hintTitle, url: s.url, len: s.title.length });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.len - b.len);
      return candidates[0];
    }

    // Pass 3: Keyword match ("deploy" → vercel.com, "firebase" → console.firebase.google.com)
    // Exact keyword match scores 0, prefix match scores 1 — exact wins
    const keyMatches = [];
    for (const s of SITE_DATABASE) {
      for (const k of s.keys) {
        const kAlpha = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (kAlpha === alpha) {
          keyMatches.push({ url: s.url, score: 0 });
          break;
        } else if (kAlpha.startsWith(alpha)) {
          keyMatches.push({ url: s.url, score: 1 });
          break;
        }
      }
    }
    if (keyMatches.length > 0) {
      keyMatches.sort((a, b) => a.score - b.score);
      return { ghost: '', hint: '', url: keyMatches[0].url };
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
    if (!raw || !raw.trim()) { clearGhost(); return; }

    // 1. Search history first (most relevant to user)
    const hist = findHistoryMatch(raw);
    if (hist && hist.hint) {
      setGhost(raw, hist.hint, hist.ghost, hist.url);
      return;
    }

    // 2. Site database
    const site = findSiteMatch(raw);
    if (site) {
      setGhost(raw, site.hint || '', site.ghost || '', site.url || '');
      return;
    }

    // 3. Google suggest cache
    const key = raw.toLowerCase();
    if (suggestCache.has(key)) {
      applyGoogleHint(raw, suggestCache.get(key));
      return;
    }

    // 4. Fetch Google suggest via Service Worker (No CORS restrictions!)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'fetchSuggestions', query: raw }, res => {
        if (res && res.success && res.data && res.data[1] && res.data[1][0]) {
          const topMatch = res.data[1][0];
          suggestCache.set(key, topMatch);
          applyGoogleHint(raw, topMatch);
        }
      });
    }
  }

  function applyGoogleHint(raw, suggestion) {
    // Try inline prefix match first ("hel" → "lo world" as ghost)
    const prefixHint = computeGhostHint(raw, suggestion);
    if (prefixHint) {
      setGhost(raw, prefixHint, suggestion,
        `https://google.com/search?q=${encodeURIComponent(suggestion)}`);
      return;
    }
    // Fallback: show the full suggestion as a trailing hint after a space
    // e.g. user typed "js fra", suggest "javascript framework"
    const trailingHint = ' → ' + suggestion;
    setGhost(raw, trailingHint, raw + trailingHint,
      `https://google.com/search?q=${encodeURIComponent(suggestion)}`);
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
    // Only hide bubble when not in a special state that just showed one
    if (currentState !== 'frustrated' && currentState !== 'happy' && currentState !== 'playing') {
      miauBubble.classList.remove('show');
    }

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
      if (settingsModal && settingsModal.classList.contains('open')) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      searchInput.focus();
    }
  });

  // ── Passive Listeners & 3D Parallax ───────────────────────
  ['mousedown', 'touchstart', 'scroll'].forEach(evt =>
    window.addEventListener(evt, resetIdle, { passive: true })
  );

  // ── High-Performance Smooth Lerped 3D Parallax ──────────────
  let targetMouseX = 0, targetMouseY = 0;
  let currentMouseX = 0, currentMouseY = 0;

  window.addEventListener('mousemove', e => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetMouseX = (e.clientX - cx) / cx;
    targetMouseY = (e.clientY - cy) / cy;
  }, { passive: true });

  function updateParallax() {
    currentMouseX += (targetMouseX - currentMouseX) * 0.12;
    currentMouseY += (targetMouseY - currentMouseY) * 0.12;

    if (Math.abs(targetMouseX - currentMouseX) > 0.0005 || Math.abs(targetMouseY - currentMouseY) > 0.0005) {
      if (searchWrapper) {
        searchWrapper.style.transform = `translate(${currentMouseX * 7}px, ${currentMouseY * 4}px)`;
      }
      if (shortcutsRow) {
        shortcutsRow.style.transform = `translate(${currentMouseX * 12}px, ${currentMouseY * 7}px)`;
      }
    }
  }

  // ── Dynamic Shortcuts & Settings Modal Engine ──────────────
  const DEFAULT_SHORTCUTS = [
    { title: 'youtube', url: 'https://youtube.com' },
    { title: 'x',       url: 'https://x.com' },
    { title: 'gmail',   url: 'https://mail.google.com' },
    { title: 'github',  url: 'https://github.com' },
    { title: 'gemini',  url: 'https://gemini.google.com' }
  ];

  const settingsBtn          = document.getElementById('settingsBtn');
  const settingsModal        = document.getElementById('settingsModal');
  const modalCloseBtn        = document.getElementById('modalCloseBtn');
  const addShortcutForm      = document.getElementById('addShortcutForm');
  const newShortcutUrl       = document.getElementById('newShortcutUrl');
  const newShortcutTitle     = document.getElementById('newShortcutTitle');
  const shortcutsManageList  = document.getElementById('shortcutsManageList');
  const modalResetBtn        = document.getElementById('modalResetBtn');

  let currentShortcuts = [];

  function extractDomainTitle(urlStr) {
    try {
      let hostname = new URL(urlStr).hostname.replace(/^www\./, '');
      if (hostname.includes('mail.google.com')) return 'gmail';
      if (hostname.includes('console.firebase')) return 'firebase';
      let name = hostname.split('.')[0];
      return name ? name.toLowerCase() : 'link';
    } catch (e) {
      return 'link';
    }
  }

  function loadShortcuts() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['userShortcuts'], res => {
        currentShortcuts = res.userShortcuts || DEFAULT_SHORTCUTS;
        renderShortcutsRow();
      });
    } else {
      const stored = localStorage.getItem('userShortcuts');
      currentShortcuts = stored ? JSON.parse(stored) : DEFAULT_SHORTCUTS;
      renderShortcutsRow();
    }
  }

  function saveShortcuts(list) {
    currentShortcuts = list;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ userShortcuts: list });
    } else {
      localStorage.setItem('userShortcuts', JSON.stringify(list));
    }
    renderShortcutsRow();
    renderManageList();
  }

  function renderShortcutsRow() {
    if (!shortcutsRow) return;
    shortcutsRow.innerHTML = '';

    currentShortcuts.forEach((sc, idx) => {
      if (idx > 0) {
        const dot = document.createElement('span');
        dot.className = 'shortcut-dot';
        dot.textContent = '•';
        shortcutsRow.appendChild(dot);
      }
      const a = document.createElement('a');
      a.href = sc.url;
      a.className = 'shortcut-link';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = sc.title.toLowerCase();
      shortcutsRow.appendChild(a);
    });
  }

  function renderManageList() {
    if (!shortcutsManageList) return;
    shortcutsManageList.innerHTML = '';

    if (currentShortcuts.length === 0) {
      shortcutsManageList.innerHTML = '<div style="opacity:0.5;font-size:12px;text-align:center;padding:12px;">no shortcut links added yet</div>';
      return;
    }

    currentShortcuts.forEach((sc, idx) => {
      const row = document.createElement('div');
      row.className = 'shortcut-item-row';

      const info = document.createElement('div');
      info.className = 'shortcut-item-info';

      const title = document.createElement('div');
      title.className = 'shortcut-item-title';
      title.textContent = sc.title.toLowerCase();

      const url = document.createElement('div');
      url.className = 'shortcut-item-url';
      url.textContent = sc.url;

      info.appendChild(title);
      info.appendChild(url);

      const delBtn = document.createElement('button');
      delBtn.className = 'shortcut-item-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete';
      delBtn.onclick = () => {
        const updated = currentShortcuts.filter((_, i) => i !== idx);
        saveShortcuts(updated);
      };

      row.appendChild(info);
      row.appendChild(delBtn);
      shortcutsManageList.appendChild(row);
    });
  }

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      renderManageList();
      settingsModal.classList.add('open');
    });

    modalCloseBtn.addEventListener('click', () => {
      settingsModal.classList.remove('open');
    });

    settingsModal.addEventListener('click', e => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('open');
      }
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && settingsModal.classList.contains('open')) {
        settingsModal.classList.remove('open');
      }
    });
  }

  if (addShortcutForm) {
    addShortcutForm.addEventListener('submit', e => {
      e.preventDefault();
      let rawUrl = newShortcutUrl.value.trim();
      if (!rawUrl) return;

      if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
      }

      let title = newShortcutTitle.value.trim().toLowerCase();
      if (!title) {
        title = extractDomainTitle(rawUrl);
      }

      const updated = [...currentShortcuts, { title, url: rawUrl }];
      saveShortcuts(updated);

      newShortcutUrl.value = '';
      newShortcutTitle.value = '';
    });
  }

  if (modalResetBtn) {
    modalResetBtn.addEventListener('click', () => {
      saveShortcuts(DEFAULT_SHORTCUTS);
    });
  }

  loadShortcuts();

  // ── Dynamic Chrome Theme Adaptive Extension Icon ───────────
  function syncThemeIcon(isDark) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'updateIconTheme', isDark });
    }
  }

  const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  syncThemeIcon(themeQuery.matches);
  try {
    themeQuery.addEventListener('change', e => syncThemeIcon(e.matches));
  } catch (e) {
    themeQuery.addListener && themeQuery.addListener(e => syncThemeIcon(e.matches));
  }

  // ── Init ──────────────────────────────────────────────────
  setState('idle');
  resetIdle();
  scheduleCasualWalk();

  // ── Double-Click Physics Balls Engine ──────────────────────
  const activeBalls = [];
  const BALL_COLORS = [
    { bg: 'radial-gradient(circle at 35% 35%, #ff4d4d, #b91c1c)', shadow: 'rgba(255,50,50,0.85)' },
    { bg: 'radial-gradient(circle at 35% 35%, #38bdf8, #0369a1)', shadow: 'rgba(56,189,248,0.85)' },
    { bg: 'radial-gradient(circle at 35% 35%, #c084fc, #6b21a8)', shadow: 'rgba(192,132,252,0.85)' },
    { bg: 'radial-gradient(circle at 35% 35%, #facc15, #a16207)', shadow: 'rgba(250,204,21,0.85)' },
    { bg: 'radial-gradient(circle at 35% 35%, #4ade80, #15803d)', shadow: 'rgba(74,222,128,0.85)' }
  ];
  const ballThoughts = ['ball! 🧶', 'catch! 🐾', 'got it! ⚡', 'nya! ✨', 'ooh! 🎾', 'mine! 🐾', 'かりかり 🦴', 'あそぼ！ 🎾'];
  let catBusyWithBall = false;

  function triggerSquash(b) {
    if (!b || !b.el) return;
    b.rot += (Math.random() - 0.5) * 45;
  }

  function spawnBall(x, y) {
    const theme = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
    const el = document.createElement('div');
    el.className = 'physics-ball';
    el.style.background = theme.bg;
    el.style.boxShadow  = `0 6px 14px ${theme.shadow}, 0 2px 4px rgba(0,0,0,0.2)`;
    el.style.left       = x + 'px';
    el.style.top        = y + 'px';
    document.body.appendChild(el);

    activeBalls.push({
      el,
      x,
      y,
      vx: (Math.random() - 0.5) * 6.5,
      vy: Math.random() * -3.5 - 2.5,
      radius: 11,
      settled: false,
      hitCat: false,
      shadowColor: theme.shadow
    });

    const thought = ballThoughts[Math.floor(Math.random() * ballThoughts.length)];
    showBubble(thought, true);
  }

  let pushTimer = null;

  function processSettledBalls() {
    if (catBusyWithBall || pushTimer) return;
    const settled = activeBalls.filter(b => b.settled);
    if (settled.length === 0) return;

    // Organic random reaction delay before cat decides to push (850ms to 2500ms)
    const randomDelay = 850 + Math.random() * 1650;

    pushTimer = setTimeout(() => {
      pushTimer = null;
      const currentSettled = activeBalls.filter(b => b.settled);
      if (currentSettled.length === 0) return;

      const searchRect = searchWrapper.getBoundingClientRect();
      if (document.activeElement === searchInput) {
        currentSettled.forEach(b => {
          const dir = b.x > (searchRect.left + searchRect.width / 2) ? 1 : -1;
          b.settled = false;
          b.vx = dir * 6.0;
          b.vy = -1.2;
        });
        return;
      }

      // Sort settled balls by distance to cat center
      const catRect = catWrapper.getBoundingClientRect();
      const catCx   = catRect.left + catRect.width / 2;
      currentSettled.sort((a, b) => Math.abs(a.x - catCx) - Math.abs(b.x - catCx));
      const targetBall = currentSettled[0];

      // Cat walks toward ball position so her vertical side makes physical contact
      const pushDir = (targetBall.x >= catCx) ? 1 : -1;
      const targetWalkX = Math.max(-150, Math.min(150, (targetBall.x - (pushDir * 35)) - (searchRect.left + searchRect.width / 2)));

      catBusyWithBall = true;
      resetIdle();

      catWrapper.style.transition = `transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)`;
      catWrapper.style.setProperty('--walk-x', `${targetWalkX}px`);
      setState('walking');

      setTimeout(() => {
        // Cat kicks with matching leg (Left leg for left push, Right leg for right push)
        app.classList.remove('kick-left', 'kick-right');
        app.classList.add(pushDir === -1 ? 'kick-left' : 'kick-right');
        setState('playing');
        const thought = ballThoughts[Math.floor(Math.random() * ballThoughts.length)];
        showBubble(thought, true);

        currentSettled.forEach(b => {
          if (Math.abs(b.x - targetBall.x) < 60 || (pushDir === 1 ? b.x >= targetBall.x : b.x <= targetBall.x)) {
            b.settled = false;
            b.vx = pushDir * (6.5 + Math.random() * 2.5);
            b.vy = -1.5;
          }
        });

        setTimeout(() => {
          app.classList.remove('kick-left', 'kick-right');
          catBusyWithBall = false;
          const remaining = activeBalls.filter(b => b.settled);
          if (remaining.length === 0) {
            setState(getBaseState());
            catWrapper.style.transition = `transform 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)`;
            catWrapper.style.setProperty('--walk-x', '0px');
          } else {
            processSettledBalls();
          }
        }, 450);
      }, 300);
    }, randomDelay);
  }

  function updateBalls() {
    if (activeBalls.length > 0) {
      const searchRect = searchWrapper.getBoundingClientRect();
      const catRect    = catWrapper.getBoundingClientRect();
      const catCx      = catRect.left + catRect.width / 2;

      // ── Cat AABB Collision Box (Strict Outer Boundary & Vertical Side Pushing) ──
      const catBox = {
        left: catCx - 42,
        right: catCx + 42,
        top: searchRect.top - 62,
        bottom: searchRect.top
      };

      // ── 1. Perfect 2D Elastic Ball-to-Ball Vector Collision ──
      for (let i = 0; i < activeBalls.length; i++) {
        for (let j = i + 1; j < activeBalls.length; j++) {
          const b1 = activeBalls[i];
          const b2 = activeBalls[j];
          const bdx = b2.x - b1.x;
          const bdy = b2.y - b1.y;
          const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
          const minDist = b1.radius + b2.radius;

          if (bdist < minDist && bdist > 0) {
            const nx = bdx / bdist;
            const ny = bdy / bdist;
            const tx = -ny;
            const ty = nx;

            // Separate overlapping balls strictly
            const overlap = minDist - bdist;
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            // Tangential components
            const dpTan1 = b1.vx * tx + b1.vy * ty;
            const dpTan2 = b2.vx * tx + b2.vy * ty;

            // Normal components
            const dpNorm1 = b1.vx * nx + b1.vy * ny;
            const dpNorm2 = b2.vx * nx + b2.vy * ny;

            // Swap normal momentum (Conservation of momentum)
            const m1 = dpNorm2 * 0.96;
            const m2 = dpNorm1 * 0.96;

            if (dpNorm1 - dpNorm2 > 0) {
              b1.vx = tx * dpTan1 + nx * m1;
              b1.vy = ty * dpTan1 + ny * m1;
              b2.vx = tx * dpTan2 + nx * m2;
              b2.vy = ty * dpTan2 + ny * m2;

              b1.settled = false;
              b2.settled = false;
            }
          }
        }
      }

      // ── Text Field Surface Reflection (Supports MULTIPLE balls, fades instantly when falling below bar) ──
      if (searchReflection) {
        const activeReflections = [];

        activeBalls.forEach(b => {
          // Check vertical distance ABOVE the search bar top
          const distAbove = searchRect.top - b.y;

          // Ball must be ABOVE or resting on top of the search bar (not fallen below it!)
          if (distAbove >= -b.radius && distAbove <= 130 &&
              b.x >= searchRect.left - 15 && b.x <= searchRect.right + 15) {

            const prox = Math.max(0, Math.min(1, 1 - (Math.abs(distAbove) / 130)));
            if (prox > 0.05) {
              const percentX = Math.max(0, Math.min(100, ((b.x - searchRect.left) / searchRect.width) * 100));
              activeReflections.push({
                percentX: percentX.toFixed(1),
                color: b.shadowColor,
                opacity: prox * 0.55
              });
            }
          }
        });

        if (activeReflections.length > 0) {
          const gradients = activeReflections.map(r =>
            `radial-gradient(ellipse 110px 42px at ${r.percentX}% 0%, ${r.color} 0%, rgba(255,255,255,0) 80%)`
          ).join(', ');

          const maxOpacity = Math.max(...activeReflections.map(r => r.opacity));
          searchReflection.style.background = gradients;
          searchReflection.style.opacity = maxOpacity.toFixed(2);
        } else {
          searchReflection.style.opacity = '0';
        }
      }

      for (let i = activeBalls.length - 1; i >= 0; i--) {
        const b = activeBalls[i];

        // ── Settled Ball on Search Bar ──
        if (b.settled) {
          b.y = searchRect.top - b.radius;
          b.el.style.left = b.x + 'px';
          b.el.style.top  = b.y + 'px';
          b.el.style.transform = 'translate(-50%, -50%)';

          processSettledBalls();
          continue;
        }

        // Gravity & Gentle Rolling Friction (b.vx preserves momentum!)
        b.vy += 0.42;
        b.vx *= 0.985;
        b.x  += b.vx;
        b.y  += b.vy;

        // ── 2. Strict Cat Box Collision & Vertical Side Push (Zero Overlap) ──
        if (b.x + b.radius > catBox.left &&
            b.x - b.radius < catBox.right &&
            b.y + b.radius > catBox.top &&
            b.y - b.radius < catBox.bottom) {

          const overlapLeft  = (b.x + b.radius) - catBox.left;
          const overlapRight = catBox.right - (b.x - b.radius);
          const overlapTop   = (b.y + b.radius) - catBox.top;

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop);

          if (minOverlap === overlapTop && b.vy > 0) {
            // Bounce off top of cat
            b.y = catBox.top - b.radius;
            b.vy = -b.vy * 0.38 - 1.2;
            b.vx += (b.x > catCx) ? 2.5 : -2.5;
          } else if (minOverlap === overlapLeft) {
            // Contact with Left Vertical Side -> PUSH LEFT!
            b.x = catBox.left - b.radius;
            b.vx = -Math.abs(b.vx || 5.0) - 2.5;
            b.settled = false;
          } else if (minOverlap === overlapRight) {
            // Contact with Right Vertical Side -> PUSH RIGHT!
            b.x = catBox.right + b.radius;
            b.vx = Math.abs(b.vx || 5.0) + 2.5;
            b.settled = false;
          }

          if (!b.hitCat) {
            b.hitCat = true;
            resetIdle();
            setState('playing');
            const thought = ballThoughts[Math.floor(Math.random() * ballThoughts.length)];
            showBubble(thought, true);

            setTimeout(() => {
              if (currentState === 'playing') setState(getBaseState());
            }, 700);
          }
        }

        // ── 3. Pill Search Bar Collision & Arc Roll-Off ──
        const barTop = searchRect.top;
        const cornerR = 26; // Pill radius for 52px height
        const cxL = searchRect.left + cornerR;
        const cxR = searchRect.right - cornerR;
        const cyCenter = barTop + cornerR;

        if (b.y + b.radius >= barTop && b.y - b.radius <= barTop + 45) {
          // Flat top middle section
          if (b.x >= cxL && b.x <= cxR) {
            if (b.y + b.radius >= barTop && b.vy > 0) {
              b.y = barTop - b.radius;
              b.vy = -b.vy * 0.16; // Soft realistic bounce

              // Only settle if nearly motionless horizontally and vertically
              if (Math.abs(b.vx) < 0.08 && Math.abs(b.vy) < 0.1) {
                b.vy = 0;
                b.vx = 0;
                b.settled = true;
              }
            }
          }
          // Left pill rounded arc roll-off (Natural gravity slide - NO artificial push force!)
          else if (b.x < cxL) {
            const cdx = b.x - cxL;
            const cdy = b.y - cyCenter;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            const targetDist = cornerR + b.radius;

            if (cdist < targetDist && b.vy > 0) {
              const angle = Math.atan2(cdy, cdx);
              b.x = cxL + targetDist * Math.cos(angle);
              b.y = cyCenter + targetDist * Math.sin(angle);
            }
          }
          // Right pill rounded arc roll-off (Natural gravity slide - NO artificial push force!)
          else if (b.x > cxR) {
            const cdx = b.x - cxR;
            const cdy = b.y - cyCenter;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            const targetDist = cornerR + b.radius;

            if (cdist < targetDist && b.vy > 0) {
              const angle = Math.atan2(cdy, cdx);
              b.x = cxR + targetDist * Math.cos(angle);
              b.y = cyCenter + targetDist * Math.sin(angle);
            }
          }
        }

        // ── 4. Fall Off Screen Bottom ──
        if (b.y > window.innerHeight + 30) {
          b.el.remove();
          activeBalls.splice(i, 1);
          continue;
        }

        b.el.style.left = b.x + 'px';
        b.el.style.top  = b.y + 'px';
        b.el.style.transform = 'translate(-50%, -50%)';
      }
    }

    updateEyeTracking();
    updateParallax();
    requestAnimationFrame(updateBalls);
  }

  window.addEventListener('dblclick', e => {
    if (e.target !== searchInput) {
      spawnBall(e.clientX, e.clientY);
    }
  });

  requestAnimationFrame(updateBalls);
})();
