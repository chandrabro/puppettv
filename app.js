/*
 * Almost Television — a self-running puppet show.
 *
 * What is in this file (top to bottom):
 *   1. The cast (three puppets drawn as SVG) and the allowed actions/sounds
 *   2. Helpers + settings (saved in your browser)
 *   3. Sound effects (made with the Web Audio API, no audio files needed)
 *   4. Voices (the browser's built-in speech synthesis)
 *   5. The player: reads an episode line by line and moves the puppets
 *   6. Episode list, AI writing, paste/download, and the buttons
 */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 1. Cast                                                             */
  /* ------------------------------------------------------------------ */

  const CAST = {
    bloop: {
      name: 'Bloop', color: '#ff9a7e', pitch: 1.5, rate: 1.08,
      svg: `
<svg viewBox="0 0 200 260" role="img" aria-label="Bloop, an orange blob puppet">
  <g class="arm l"><ellipse cx="22" cy="168" rx="13" ry="32" fill="#e5603f" transform="rotate(12 22 168)"/></g>
  <g class="arm r"><ellipse cx="178" cy="168" rx="13" ry="32" fill="#e5603f" transform="rotate(-12 178 168)"/></g>
  <path d="M100 68 q-8 -26 12 -38" fill="none" stroke="#c9472b" stroke-width="6" stroke-linecap="round"/>
  <circle cx="114" cy="26" r="9" fill="#ffd166"/>
  <ellipse cx="100" cy="152" rx="82" ry="88" fill="#ff7a59"/>
  <ellipse cx="100" cy="176" rx="52" ry="54" fill="#ff9a7e" opacity=".55"/>
  <circle cx="46" cy="162" r="11" fill="#ff5e83" opacity=".5"/>
  <circle cx="154" cy="162" r="11" fill="#ff5e83" opacity=".5"/>
  <g class="eyes">
    <circle cx="70" cy="122" r="23" fill="#fff"/><circle cx="130" cy="122" r="23" fill="#fff"/>
    <circle cx="75" cy="125" r="10" fill="#1d1230"/><circle cx="125" cy="125" r="10" fill="#1d1230"/>
    <circle cx="78" cy="121" r="3.5" fill="#fff"/><circle cx="128" cy="121" r="3.5" fill="#fff"/>
  </g>
  <g class="mouth"><ellipse cx="100" cy="184" rx="30" ry="17" fill="#5a1a12"/><ellipse cx="100" cy="194" rx="15" ry="7" fill="#ff8f9c"/></g>
</svg>`
    },
    gus: {
      name: 'Gus', color: '#6fe0cf', pitch: 0.55, rate: 0.9,
      svg: `
<svg viewBox="0 0 200 260" role="img" aria-label="Gus, a tall grumpy teal puppet in a top hat">
  <g class="arm l"><ellipse cx="34" cy="150" rx="13" ry="38" fill="#2f9a8c"/></g>
  <g class="arm r"><ellipse cx="166" cy="150" rx="13" ry="38" fill="#2f9a8c"/></g>
  <rect x="48" y="30" width="104" height="225" rx="20" fill="#3fb8a8"/>
  <rect x="62" y="0" width="76" height="40" rx="5" fill="#241c33"/>
  <rect x="50" y="34" width="100" height="9" rx="4" fill="#241c33"/>
  <rect x="62" y="25" width="76" height="8" fill="#ff7a59"/>
  <g class="eyes">
    <circle cx="78" cy="94" r="15" fill="#fff"/><circle cx="122" cy="94" r="15" fill="#fff"/>
    <circle cx="78" cy="98" r="6" fill="#1d1230"/><circle cx="122" cy="98" r="6" fill="#1d1230"/>
  </g>
  <rect x="60" y="66" width="80" height="10" rx="5" fill="#1d3b38" transform="rotate(-3 100 71)"/>
  <rect x="94" y="106" width="12" height="26" rx="6" fill="#2f9a8c"/>
  <g class="mouth"><ellipse cx="100" cy="160" rx="30" ry="13" fill="#173330"/></g>
  <circle cx="100" cy="198" r="7" fill="#2a8478"/><circle cx="100" cy="220" r="7" fill="#2a8478"/><circle cx="100" cy="242" r="7" fill="#2a8478"/>
</svg>`
    },
    nimbus: {
      name: 'Nimbus', color: '#b9ccff', pitch: 1.1, rate: 0.82,
      svg: `
<svg viewBox="0 0 200 260" role="img" aria-label="Nimbus, a sleepy cloud puppet">
  <g class="arm l"><ellipse cx="22" cy="176" rx="12" ry="26" fill="#cddcf8"/></g>
  <g class="arm r"><ellipse cx="178" cy="176" rx="12" ry="26" fill="#cddcf8"/></g>
  <g fill="#eaf1ff">
    <circle cx="62" cy="130" r="46"/><circle cx="104" cy="96" r="54"/><circle cx="148" cy="132" r="46"/>
    <ellipse cx="100" cy="170" rx="82" ry="56"/>
  </g>
  <ellipse cx="100" cy="192" rx="60" ry="34" fill="#d6e3fb" opacity=".6"/>
  <circle cx="58" cy="154" r="10" fill="#ffb3c7" opacity=".7"/><circle cx="142" cy="154" r="10" fill="#ffb3c7" opacity=".7"/>
  <g class="eyes">
    <ellipse cx="76" cy="132" rx="10" ry="12" fill="#32406b"/><ellipse cx="124" cy="132" rx="10" ry="12" fill="#32406b"/>
    <circle cx="79" cy="128" r="3" fill="#fff"/><circle cx="127" cy="128" r="3" fill="#fff"/>
  </g>
  <rect x="64" y="116" width="24" height="15" fill="#eaf1ff"/><rect x="112" y="116" width="24" height="15" fill="#eaf1ff"/>
  <g class="mouth"><ellipse cx="100" cy="160" rx="15" ry="10" fill="#32406b"/></g>
</svg>`
    }
  };

  const CAST_IDS = Object.keys(CAST);
  const ACTIONS = ['none', 'bounce', 'shake', 'spin', 'grow', 'duck', 'wave'];
  const SFX_NAMES = ['none', 'boing', 'ding', 'whoosh', 'rimshot', 'trombone', 'applause'];
  const SFX_AFTER = new Set(['rimshot', 'trombone', 'applause']); // play after the line, not before
  const LANGS = { en: 'English', ne: 'Nepali', hi: 'Hindi' };

  const TOPICS = [
    'a banana who runs for mayor', 'the day the clocks went on strike', 'a cloud that is afraid of heights',
    'a very polite earthquake', 'the secret life of socks', 'a staircase with stage fright',
    'the world\'s slowest race', 'a pillow that wants to be a hero', 'a tea cup that tells fortunes',
    'a mountain that wants to travel', 'a serious cooking show for rocks', 'the election of the next moon',
    'an umbrella who hates rain', 'a robot learning to whistle', 'the great noodle migration',
    'a lighthouse that tells bad jokes', 'a bus that dreams of being a boat', 'a museum of forgotten umbrellas',
    'a momo that wants to be famous', 'a very tired yak who gives life advice'
  ];

  /* ------------------------------------------------------------------ */
  /* 2. Helpers + settings                                               */
  /* ------------------------------------------------------------------ */

  const $ = (sel) => document.querySelector(sel);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hasSpeech = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

  const SETTINGS_KEY = 'almost-tv.settings.v1';
  const SAVED_KEY = 'almost-tv.episodes.v1';
  const DEFAULTS = {
    voice: true, sfx: true, captions: true, vertical: false,
    autonext: true, endless: false, speed: 1, lang: 'en', voices: {}
  };

  function readStore(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeStore(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode etc. */ }
  }

  const settings = Object.assign({}, DEFAULTS, readStore(SETTINGS_KEY, {}));
  if (!settings.voices || typeof settings.voices !== 'object') settings.voices = {};
  const saveSettings = () => writeStore(SETTINGS_KEY, settings);

  let toastTimer = null;
  function toast(msg, ms = 3800) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }
  const setStatus = (msg) => { $('#status').textContent = msg || ''; };

  /** Turn untrusted data (AI output, pasted text, saved data) into a safe episode. */
  function cleanEpisode(raw, defaults = {}) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('The script must be a JSON object with a "lines" list.');
    const lines = (Array.isArray(raw.lines) ? raw.lines : []).map((l) => {
      const who = String((l && l.who) || '').toLowerCase().trim();
      const action = String((l && l.action) || 'none').toLowerCase();
      const sfx = String((l && l.sfx) || 'none').toLowerCase();
      return {
        who: CAST[who] ? who : '',
        text: String((l && l.text) || '').replace(/\s+/g, ' ').trim().slice(0, 240),
        action: ACTIONS.includes(action) ? action : 'none',
        sfx: SFX_NAMES.includes(sfx) ? sfx : 'none'
      };
    }).filter((l) => l.who && l.text).slice(0, 24);

    if (lines.length < 2) throw new Error('The script needs at least 2 lines, each with "who" (bloop, gus or nimbus) and "text".');

    let lang = typeof raw.lang === 'string' ? raw.lang.toLowerCase().slice(0, 2) : (defaults.lang || '');
    if (!LANGS[lang]) lang = /[ऀ-ॿ]/.test(lines.map((l) => l.text).join('')) ? 'ne' : 'en';

    const id = typeof raw.id === 'string' && /^[\w-]{1,48}$/.test(raw.id)
      ? raw.id
      : 'ep-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    return {
      id,
      title: String(raw.title || 'Untitled episode').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Untitled episode',
      lang,
      by: defaults.by || raw.by || 'you',
      lines
    };
  }

  /* ------------------------------------------------------------------ */
  /* 3. Sound effects (Web Audio)                                        */
  /* ------------------------------------------------------------------ */

  let audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { audioCtx = new AC(); } catch (e) { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone({ type = 'sine', f0 = 440, f1 = null, dur = 0.3, vol = 0.2, t0 = 0 }) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(); const g = a.createGain();
    const t = a.currentTime + t0;
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function noise({ dur = 0.3, vol = 0.15, t0 = 0, type = 'lowpass', f0 = 2000, f1 = null, q = 0.8 }) {
    const a = ctx(); if (!a) return;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const filter = a.createBiquadFilter(); filter.type = type; filter.Q.value = q;
    const gain = a.createGain();
    const t = a.currentTime + t0;
    filter.frequency.setValueAtTime(f0, t);
    if (f1) filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter); filter.connect(gain); gain.connect(a.destination);
    src.start(t); src.stop(t + dur + 0.03);
  }

  const SFX = {
    boing() { tone({ f0: 160, f1: 720, dur: 0.22 }); tone({ f0: 720, f1: 200, dur: 0.32, t0: 0.22 }); },
    ding() { tone({ f0: 1318, dur: 0.9, vol: 0.16 }); tone({ f0: 1976, dur: 0.7, vol: 0.06 }); },
    whoosh() { noise({ dur: 0.7, vol: 0.22, type: 'bandpass', f0: 300, f1: 3200, q: 1.2 }); },
    rimshot() {
      noise({ dur: 0.12, vol: 0.25, type: 'highpass', f0: 1800 }); tone({ f0: 120, f1: 60, dur: 0.18, vol: 0.3 });
      noise({ dur: 0.12, vol: 0.25, type: 'highpass', f0: 1800, t0: 0.16 }); tone({ f0: 120, f1: 60, dur: 0.18, vol: 0.3, t0: 0.16 });
      noise({ dur: 0.5, vol: 0.22, type: 'highpass', f0: 3000, t0: 0.34 });
    },
    trombone() {
      [[392, 0], [370, 0.3], [349, 0.6]].forEach(([f, t]) => tone({ type: 'sawtooth', f0: f, f1: f * 0.97, dur: 0.3, t0: t, vol: 0.09 }));
      tone({ type: 'sawtooth', f0: 330, f1: 220, dur: 0.9, t0: 0.9, vol: 0.09 });
    },
    applause() {
      for (let i = 0; i < 24; i++) {
        noise({ dur: 0.07 + Math.random() * 0.08, vol: 0.1, type: 'bandpass', f0: 1500 + Math.random() * 3000, t0: Math.random() * 1.5, q: 0.6 });
      }
      noise({ dur: 1.6, vol: 0.05, type: 'highpass', f0: 1200 });
    },
    static() { noise({ dur: 0.6, vol: 0.09, type: 'highpass', f0: 800 }); }
  };

  function playSfx(name) {
    if (!settings.sfx || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* audio is a bonus, never break the show */ }
  }

  /* ------------------------------------------------------------------ */
  /* 4. Voices                                                           */
  /* ------------------------------------------------------------------ */

  const state = {
    episodes: [], currentId: null, lineIndex: 0,
    playing: false, powered: false, token: 0,
    voices: [], mouthTimer: null, warned: new Set()
  };

  function loadVoices() {
    if (!hasSpeech) return;
    state.voices = window.speechSynthesis.getVoices().slice()
      .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
    renderVoiceSelects();
  }

  const langOf = (v) => v.lang.toLowerCase().replace('_', '-').split('-')[0];
  const poolFor = (lang) => state.voices.filter((v) => langOf(v) === lang);

  function warnOnce(key, msg) {
    if (state.warned.has(key)) return;
    state.warned.add(key);
    toast(msg, 6000);
  }

  function voiceFor(id, lang) {
    const chosen = settings.voices[id];
    if (chosen) {
      const v = state.voices.find((x) => x.voiceURI === chosen);
      if (v) return v;
    }
    let pool = poolFor(lang);
    if (!pool.length && lang === 'ne') {
      pool = poolFor('hi');
      if (pool.length) warnOnce('ne-hi', 'No Nepali voice found on this device, so a Hindi voice is reading it. Pronunciation may be off.');
    }
    if (!pool.length && lang === 'en') pool = state.voices;
    if (!pool.length) return null;
    // Spread the three puppets across the available voices so they sound different.
    return pool[Math.floor((CAST_IDS.indexOf(id) * pool.length) / CAST_IDS.length)];
  }

  function stopSpeech() {
    if (hasSpeech) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  }

  /** Speak one line. Resolves when finished (or when it was cancelled). */
  function speak(text, id, lang) {
    const speed = settings.speed;
    const silentMs = Math.max(1400, text.length * 65) / speed;
    if (!hasSpeech || !settings.voice) return sleep(silentMs);

    const voice = voiceFor(id, lang);
    if (!voice) {
      warnOnce('novoice', `No ${LANGS[lang] || 'matching'} voice on this device, so this episode is captions only. Install one in your phone or computer's text-to-speech settings.`);
      return sleep(silentMs);
    }

    return new Promise((resolve) => {
      const u = new window.SpeechSynthesisUtterance(text);
      u.voice = voice; u.lang = voice.lang;
      u.pitch = CAST[id].pitch;
      u.rate = clamp(CAST[id].rate * speed, 0.5, 2);
      let done = false;
      let guard = null;
      const finish = () => { if (done) return; done = true; clearTimeout(guard); resolve(); };
      u.onend = finish; u.onerror = finish;
      // Safety net: some browsers occasionally never fire "end".
      guard = setTimeout(finish, Math.max(8000, (text.length * 180) / u.rate));
      window.speechSynthesis.speak(u);
    });
  }

  function previewVoice(id) {
    if (!hasSpeech) return;
    stop();
    const v = voiceFor(id, 'en');
    const u = new window.SpeechSynthesisUtterance(`Hi, I am ${CAST[id].name}.`);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.pitch = CAST[id].pitch; u.rate = CAST[id].rate;
    window.speechSynthesis.speak(u);
  }

  function renderVoiceSelects() {
    const box = $('#voiceSelects');
    box.textContent = '';
    if (!state.voices.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = hasSpeech ? 'No voices found yet. They may still be loading.' : 'This browser has no speech voices, so the show runs with captions only.';
      box.append(p);
      return;
    }
    CAST_IDS.forEach((id) => {
      const label = document.createElement('label');
      label.textContent = CAST[id].name;
      const sel = document.createElement('select');
      sel.add(new Option('Auto', ''));
      state.voices.forEach((v) => sel.add(new Option(`${v.name} (${v.lang})`, v.voiceURI)));
      sel.value = settings.voices[id] || '';
      sel.addEventListener('change', () => {
        settings.voices[id] = sel.value;
        saveSettings();
        previewVoice(id);
      });
      label.append(sel);
      box.append(label);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. The player                                                       */
  /* ------------------------------------------------------------------ */

  const puppetEl = (id) => document.querySelector(`.puppet[data-id="${id}"]`);

  function buildStage() {
    $('#puppets').innerHTML = CAST_IDS.map((id, i) =>
      `<div class="puppet" data-id="${id}" style="--blink-delay:${(i * 1.7).toFixed(1)}s"><div class="mover">${CAST[id].svg}</div></div>`
    ).join('');
    const ledge = $('#ledge');
    ledge.textContent = '';
    CAST_IDS.forEach((id) => {
      const s = document.createElement('span');
      s.textContent = CAST[id].name;
      ledge.append(s);
    });
  }

  function setSpeaker(id) {
    document.querySelectorAll('.puppet').forEach((p) => p.classList.toggle('speaking', p.dataset.id === id));
  }

  function startMouth(id) {
    stopMouth();
    const el = puppetEl(id);
    if (!el) return;
    state.mouthTimer = setInterval(() => el.classList.toggle('open', Math.random() < 0.65), 130);
  }
  function stopMouth() {
    clearInterval(state.mouthTimer);
    state.mouthTimer = null;
    document.querySelectorAll('.puppet.open').forEach((p) => p.classList.remove('open'));
  }

  function act(id, action) {
    if (!action || action === 'none') return;
    const mover = document.querySelector(`.puppet[data-id="${id}"] .mover`);
    if (!mover) return;
    ACTIONS.forEach((a) => mover.classList.remove('a-' + a));
    void mover.offsetWidth; // restart the CSS animation
    mover.classList.add('a-' + action);
    setTimeout(() => mover.classList.remove('a-' + action), 1400);
  }

  function showCaption(id, text) {
    const cap = $('#caption');
    cap.textContent = '';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.setProperty('--who', CAST[id].color);
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = CAST[id].name;
    bubble.append(who, document.createTextNode(text));
    cap.append(bubble);
  }
  const clearCaption = () => { $('#caption').textContent = ''; };

  /* TV static */
  const noiseCanvas = $('#static');
  const noiseCtx = noiseCanvas.getContext ? noiseCanvas.getContext('2d') : null;
  const noiseImg = noiseCtx ? noiseCtx.createImageData(160, 90) : null;
  let noiseOn = false;

  function noiseFrame() {
    if (!noiseOn) return;
    const d = noiseImg.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    noiseCtx.putImageData(noiseImg, 0, 0);
    requestAnimationFrame(noiseFrame);
  }
  function staticOn(on) {
    if (!noiseCtx || on === noiseOn) return;
    noiseOn = on;
    noiseCanvas.classList.toggle('on', on);
    if (on) noiseFrame();
  }
  async function staticBurst(ms) {
    if (reduceMotion) { await sleep(150); return; }
    playSfx('static');
    staticOn(true);
    await sleep(ms);
    staticOn(false);
  }

  async function showTitle(token, small, main, ms) {
    $('#titleSmall').textContent = small;
    $('#titleMain').textContent = main;
    const card = $('#titleCard');
    card.classList.add('show');
    await sleep(ms / settings.speed);
    if (token === state.token) card.classList.remove('show');
    await sleep(350);
  }

  const currentEpisode = () => state.episodes.find((e) => e.id === state.currentId) || null;

  function updatePlayButton() {
    $('#playBtn').textContent = state.playing ? '⏸ Pause' : '▶ Play';
  }

  /** Stop everything that is running right now (used by pause, next, generate...). */
  function stop() {
    state.token++;
    state.playing = false;
    stopSpeech();
    stopMouth();
    setSpeaker(null);
    $('#titleCard').classList.remove('show');
    updatePlayButton();
  }

  async function performLine(ep, line, token) {
    const id = line.who;
    setSpeaker(id);
    showCaption(id, line.text);
    act(id, line.action);
    if (line.sfx !== 'none' && !SFX_AFTER.has(line.sfx)) playSfx(line.sfx);
    startMouth(id);
    await speak(line.text, id, ep.lang);
    if (token !== state.token) return;
    stopMouth();
    if (line.sfx !== 'none' && SFX_AFTER.has(line.sfx)) {
      playSfx(line.sfx);
      await sleep(750 / settings.speed);
    }
  }

  async function runEpisode(ep, startAt = 0, intro = true) {
    const token = ++state.token;
    stopSpeech();
    state.playing = true;
    state.warned = new Set();
    updatePlayButton();
    renderChannels();
    const num = String(state.episodes.indexOf(ep) + 1).padStart(2, '0');
    setStatus(`Channel ${num}: ${ep.title}`);

    if (intro && startAt === 0) {
      clearCaption();
      await staticBurst(700);
      if (token !== state.token) return;
      await showTitle(token, `Channel ${num}`, ep.title, 2200);
      if (token !== state.token) return;
    }

    for (let i = startAt; i < ep.lines.length; i++) {
      state.lineIndex = i;
      await performLine(ep, ep.lines[i], token);
      if (token !== state.token) return;
      await sleep(350 / settings.speed);
      if (token !== state.token) return;
    }

    // Episode finished
    await sleep(900);
    if (token !== state.token) return;
    state.lineIndex = 0;
    state.playing = false;
    setSpeaker(null);
    clearCaption();
    updatePlayButton();
    await showTitle(token, 'Almost Television', 'The End', 1800);
    if (token !== state.token) return;

    if (settings.endless || settings.autonext) void nextChannel(true);
    else setStatus('The end. Press Play to watch again.');
  }

  function playEpisodeById(id) {
    const ep = state.episodes.find((e) => e.id === id);
    if (!ep) return Promise.resolve();
    state.currentId = id;
    state.lineIndex = 0;
    return runEpisode(ep, 0, true);
  }

  async function nextChannel(auto = false) {
    if (!state.powered) powerOn();
    if (auto && settings.endless) {
      const ok = await generateAndPlay(randomTopic(), settings.lang, { persist: false, live: true, quiet: true });
      if (ok) return;
      toast('The AI writer is not available, so here is a built-in episode instead.');
    }
    const list = state.episodes;
    if (!list.length) return;
    const i = list.findIndex((e) => e.id === state.currentId);
    const next = list[(i + 1) % list.length];
    void playEpisodeById(next.id);
  }

  function pause() {
    stop();
    setStatus('Paused.');
  }

  function togglePlay() {
    if (!state.powered) { powerOn(); void playEpisodeById(state.currentId); return; }
    if (state.playing) { pause(); return; }
    const ep = currentEpisode();
    if (!ep) return;
    void runEpisode(ep, state.lineIndex, state.lineIndex === 0);
  }

  function powerOn() {
    if (state.powered) return;
    state.powered = true;
    $('#powerBtn').classList.add('hidden');
    ctx(); // unlock audio inside the user's click
    if (hasSpeech) {
      try { // unlock speech on iPhone/Safari
        const u = new window.SpeechSynthesisUtterance(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 6. Episodes, AI writing, paste/download, buttons                    */
  /* ------------------------------------------------------------------ */

  const randomTopic = () => TOPICS[Math.floor(Math.random() * TOPICS.length)];

  function persistEpisodes() {
    writeStore(SAVED_KEY, state.episodes.filter((e) => e.saved).slice(-20));
  }

  function addEpisode(ep, { persist = true } = {}) {
    if (persist) ep.saved = true; else ep.live = true;
    state.episodes.push(ep);
    // Keep only the 4 most recent endless-mode episodes in memory.
    const live = state.episodes.filter((e) => e.live && e.id !== state.currentId);
    while (state.episodes.filter((e) => e.live).length > 4 && live.length) {
      const old = live.shift();
      state.episodes = state.episodes.filter((e) => e !== old);
    }
    if (persist) persistEpisodes();
    renderChannels();
  }

  function deleteEpisode(id) {
    const wasCurrent = id === state.currentId;
    if (wasCurrent) stop();
    state.episodes = state.episodes.filter((e) => e.id !== id);
    persistEpisodes();
    if (wasCurrent) { state.currentId = state.episodes[0] ? state.episodes[0].id : null; state.lineIndex = 0; }
    renderChannels();
  }

  function renderChannels() {
    const ul = $('#channels');
    ul.textContent = '';
    state.episodes.forEach((ep, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'channel' + (ep.id === state.currentId ? ' active' : '');
      const num = document.createElement('span'); num.className = 'num'; num.textContent = String(i + 1).padStart(2, '0');
      const t = document.createElement('span'); t.className = 't'; t.textContent = ep.title; t.title = ep.title;
      btn.append(num, t);
      const badgeText = ep.live ? 'live AI' : ep.by === 'ai' ? 'AI' : ep.by === 'you' ? 'yours' : '';
      if (badgeText) { const b = document.createElement('span'); b.className = 'badge'; b.textContent = badgeText; btn.append(b); }
      btn.addEventListener('click', () => { powerOn(); void playEpisodeById(ep.id); });
      li.append(btn);
      if (ep.saved) {
        const del = document.createElement('button');
        del.type = 'button'; del.className = 'del'; del.textContent = '✕';
        del.setAttribute('aria-label', `Delete ${ep.title}`);
        del.addEventListener('click', () => deleteEpisode(ep.id));
        li.append(del);
      }
      ul.append(li);
    });
  }

  /** Ask the server function (api/generate.js) to write an episode. */
  async function requestEpisode(topic, lang) {
    let res;
    try {
      res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, lang })
      });
    } catch (e) {
      throw new Error('Could not reach the AI writer. It works once the site is deployed on Vercel (or run "vercel dev").');
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* not JSON */ }
    if (!res.ok || !data || !data.episode) {
      if (res.status === 404 || res.status === 501) throw new Error('The AI writer is not set up on this site yet. See the README.');
      throw new Error((data && data.error) || 'The AI writer is not available right now. Try again in a minute.');
    }
    return cleanEpisode(data.episode, { by: 'ai', lang });
  }

  /** Returns true if an episode was written and started. */
  async function generateAndPlay(topic, lang, { persist = true, live = false, quiet = false } = {}) {
    stop();
    const token = state.token;
    staticOn(true);
    setStatus('Writing a new episode...');
    if (!quiet) toast('The puppets are writing your episode...', 2500);
    try {
      const ep = await requestEpisode(topic, lang);
      if (token !== state.token) { staticOn(false); return true; } // user did something else meanwhile
      staticOn(false);
      addEpisode(ep, { persist });
      if (live) ep.live = true;
      void playEpisodeById(ep.id);
      return true;
    } catch (e) {
      staticOn(false);
      if (!quiet) toast(e.message, 6000);
      setStatus('');
      return false;
    }
  }

  function extractJson(text) {
    const t = String(text).replace(/```(?:json)?/gi, '').trim();
    const a = t.indexOf('{'); const b = t.lastIndexOf('}');
    return a >= 0 && b > a ? t.slice(a, b + 1) : t;
  }

  function handlePaste() {
    const text = $('#pasteBox').value.trim();
    if (!text) { toast('Paste a script first.'); return; }
    let raw;
    try { raw = JSON.parse(extractJson(text)); } catch (e) { toast('That does not look like valid JSON. Copy the whole block and try again.', 5000); return; }
    try {
      const ep = cleanEpisode(raw, { by: 'you' });
      powerOn();
      addEpisode(ep);
      $('#pasteBox').value = '';
      void playEpisodeById(ep.id);
    } catch (e) { toast(e.message, 6000); }
  }

  function downloadCurrent() {
    const ep = currentEpisode();
    if (!ep) return;
    const out = { title: ep.title, lang: ep.lang, lines: ep.lines };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (ep.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'episode') + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function chatPrompt(topic) {
    const subject = topic || 'anything surreal and funny';
    const langName = LANGS[settings.lang] || 'English';
    return `You write scripts for "Almost Television", a surreal puppet show with three puppets:
- bloop: an excitable, cheerful orange blob who loves big announcements.
- gus: a grumpy, deadpan tall puppet in a top hat who treats absurd things as boring facts.
- nimbus: a dreamy, sleepy cloud who says calm, poetic, slightly nonsensical things.

Write ONE episode about: "${subject}".
Language: ${langName}.

Rules:
- 10 to 14 lines. Every line is spoken by bloop, gus or nimbus.
- Each line is 1 or 2 short sentences (max 25 words), easy to read aloud.
- Humor is surreal, absurd and gentle. Family-friendly. No real people.
- Give the episode a funny title (max 6 words) and end with a funny sign-off.
- Optional per line: "action" is one of ${ACTIONS.filter((a) => a !== 'none').join(', ')}; "sfx" is one of ${SFX_NAMES.filter((a) => a !== 'none').join(', ')}. Use them on about every 2nd or 3rd line.

Return ONLY valid JSON, with no extra text, in exactly this shape:
{"title": "...", "lang": "${settings.lang}", "lines": [{"who": "bloop", "text": "...", "action": "bounce", "sfx": "ding"}]}`;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  function toggleFullscreen() {
    const el = $('#screen');
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Fullscreen is not available here.'));
    else toast('Fullscreen is not available in this browser. Try Chrome or Edge.');
  }

  function applySettings() {
    $('#app').classList.toggle('vertical', !!settings.vertical);
    $('#app').classList.toggle('no-captions', !settings.captions);
  }

  function bindUI() {
    $('#powerBtn').addEventListener('click', () => { powerOn(); void playEpisodeById(state.currentId); });
    $('#playBtn').addEventListener('click', togglePlay);
    $('#restartBtn').addEventListener('click', () => {
      powerOn();
      const ep = currentEpisode();
      if (ep) void playEpisodeById(ep.id);
    });
    $('#nextBtn').addEventListener('click', () => { void nextChannel(false); });
    $('#fsBtn').addEventListener('click', toggleFullscreen);

    const checks = { optVoice: 'voice', optSfx: 'sfx', optCaptions: 'captions', optVertical: 'vertical', optAuto: 'autonext', optEndless: 'endless' };
    Object.entries(checks).forEach(([elId, key]) => {
      const el = $('#' + elId);
      el.checked = !!settings[key];
      el.addEventListener('change', () => {
        settings[key] = el.checked;
        saveSettings();
        applySettings();
        if (key === 'voice' && !el.checked) stopSpeech();
      });
    });

    const speed = $('#speed');
    speed.value = String(settings.speed);
    $('#speedOut').textContent = Number(settings.speed).toFixed(1) + 'x';
    speed.addEventListener('input', () => {
      settings.speed = clamp(parseFloat(speed.value) || 1, 0.7, 1.4);
      $('#speedOut').textContent = settings.speed.toFixed(1) + 'x';
      saveSettings();
    });

    const langSel = $('#genLang');
    langSel.value = LANGS[settings.lang] ? settings.lang : 'en';
    langSel.addEventListener('change', () => { settings.lang = langSel.value; saveSettings(); });

    $('#genForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const btn = $('#genBtn');
      const topic = $('#topic').value.replace(/\s+/g, ' ').trim() || randomTopic();
      powerOn();
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = 'Writing...';
      try { await generateAndPlay(topic, settings.lang); } finally { btn.disabled = false; btn.textContent = label; }
    });

    $('#pasteBtn').addEventListener('click', handlePaste);
    $('#downloadBtn').addEventListener('click', downloadCurrent);
    $('#copyPromptBtn').addEventListener('click', async () => {
      const ok = await copyText(chatPrompt($('#topic').value.trim()));
      toast(ok ? 'Prompt copied! Paste it into Claude or any chatbot, then paste the answer here.' : 'Could not copy automatically. Please try again.', 4500);
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes(tag)) return;
      if (ev.code === 'Space') { ev.preventDefault(); togglePlay(); }
      else if (ev.key === 'n' || ev.key === 'N') void nextChannel(false);
      else if (ev.key === 'f' || ev.key === 'F') toggleFullscreen();
    });

    if (hasSpeech) {
      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    } else {
      renderVoiceSelects();
    }
  }

  function init() {
    buildStage();

    const builtIn = (window.BUILT_IN_EPISODES || []).map((e) => {
      try { return cleanEpisode(e, { by: 'built-in' }); } catch (err) { return null; }
    }).filter(Boolean);

    const saved = (readStore(SAVED_KEY, []) || []).map((e) => {
      try { const ep = cleanEpisode(e, { by: e && e.by }); ep.saved = true; return ep; } catch (err) { return null; }
    }).filter(Boolean);

    state.episodes = builtIn.concat(saved);
    state.currentId = state.episodes[0] ? state.episodes[0].id : null;

    applySettings();
    bindUI();
    renderChannels();
    updatePlayButton();
    setStatus('Press "Turn on TV" to start the show.');
  }

  // Small hook so tests can reach the internals.
  window.__almostTV = { cleanEpisode, state, settings, CAST_IDS };

  init();
})();
