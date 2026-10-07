/* GTA 67 v12 (en son yüklenir)
   1) Oyuna girince yatay (tam ekran + yön kilidi), menüye dönünce eski yöne dön
   2) Çevrimdışı: YENİ DÜNYA / DEVAM ET (otomatik kayıt)
   3) MODLAR: her dünyadan önce "Mod ister misiniz?". Modlar Web Worker içinde, kum havuzunda çalışır:
      oyuna/hesaba/tarayıcı verisine erişemez, sonsuz döngü ya da hata oyunu çökertmez. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const tryF = (f, d) => { try { return f(); } catch (e) { return d; } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const fin = v => (typeof v === 'number' && isFinite(v)) ? v : 0;

  /* ===================== 1) YATAY / DİKEY ===================== */
  let origOri = null, lastLockTry = 0;
  function lockLandscape() {
    document.body.classList.add('land');
    tryF(() => { if (origOri === null && screen.orientation) origOri = screen.orientation.type || ''; });
    lastLockTry = Date.now();
    const doLock = () => tryF(() => { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => { }); });
    try {
      const d = document.documentElement;
      if (!document.fullscreenElement && d.requestFullscreen) {
        const r = d.requestFullscreen({ navigationUI: 'hide' });
        (r && r.then ? r : Promise.resolve()).then(doLock).catch(doLock);
      } else doLock();
    } catch (e) { doLock(); }
  }
  function unlockLandscape() {
    document.body.classList.remove('land');
    const so = tryF(() => screen.orientation), was = origOri; origOri = null;
    const done = () => { tryF(() => so && so.unlock && so.unlock()); tryF(() => { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); }); };
    try {
      // telefon önceden dikeydiyse dikeye döndür, sonra kilidi tamamen bırak (otomatik döndürme eskisi gibi)
      if (so && so.lock && was && was.indexOf('portrait') === 0) so.lock('portrait').then(() => setTimeout(done, 450)).catch(done);
      else done();
    } catch (e) { done(); }
  }
  // kilit tutmadıysa (ilk dokunuşta izin gerekir) oyunda ilk dokunuşta tekrar dene
  addEventListener('pointerdown', () => {
    if (!document.body.classList.contains('land') || Date.now() - lastLockTry < 2500) return;
    const t = tryF(() => screen.orientation.type, 'landscape');
    if (t.indexOf('landscape') !== 0) lockLandscape();
  }, true);

  /* ===================== 2) ÇEVRİMDIŞI KAYIT ===================== */
  const SAVEK = 'g67w_off';
  let worldKey = '', lastOut = null;
  const worldActive = () => worldKey !== '';
  const readSave = () => tryF(() => { const d = JSON.parse(localStorage.getItem(SAVEK) || 'null'); return d && d.v === 1 ? d : null; }, null);
  function buildSave() {
    if (worldKey !== 'off' || typeof P === 'undefined' || mode === 'dead') return null;
    if (!INT) lastOut = { x: P.x, z: P.z, a: P.a };
    if (!lastOut) return null;
    const core = (!USR && window.__sv) ? tryF(() => window.__sv.snap(), null) : null;
    return { v: 1, ts: Date.now(), core, x: lastOut.x, z: lastOut.z, a: lastOut.a, hp: Math.round(P.hp), hour: tryF(() => hour, 12), wep: P.wep | 0 };
  }
  let noSave = false;
  function saveNow() { if (noSave) return; const d = buildSave(); if (d) tryF(() => localStorage.setItem(SAVEK, JSON.stringify(d))); }
  function applySaveW(d) {
    if (!d) return;
    tryF(() => { if (d.core && window.__sv) window.__sv.applySave(d.core, true); });
    tryF(() => {
      P.x = d.x; P.z = d.z; P.a = d.a; yaw = d.a; P.hp = clampN(d.hp || 100, 40, 100); P.wep = d.wep | 0;
      if (typeof d.hour === 'number') hour = d.hour;
    });
  }
  setInterval(() => { if (worldKey === 'off' && mode !== 'menu') saveNow(); }, 8000);
  addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  addEventListener('pagehide', saveNow);

  /* ===================== 3) MOD SİSTEMİ ===================== */
  const MKEY = 'g67mods', LIM = { mods: 40, code: 60000, data: 20000 };
  const MODS = {
    all: [],
    load() { this.all = tryF(() => { const a = JSON.parse(localStorage.getItem(MKEY) || '[]'); return Array.isArray(a) ? a.filter(m => m && m.id && typeof m.code === 'string') : []; }, []); },
    save() { return tryF(() => { localStorage.setItem(MKEY, JSON.stringify(this.all)); return true; }, false); },
    get(id) { return this.all.find(m => m.id === id); }
  };
  MODS.load();
  const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function parseMeta(code) {
    const m = { name: '', author: '', ver: '1.0', desc: '', online: 0 };
    const blk = /\/\/\s*==Mod==([\s\S]*?)\/\/\s*==\/Mod==/.exec(code);
    if (blk) for (const ln of blk[1].split('\n')) {
      const r = /^\s*\/\/\s*(name|author|version|desc|online)\s*:\s*(.*)$/i.exec(ln); if (!r) continue;
      const k = r[1].toLowerCase(), v = r[2].trim().slice(0, 80);
      if (k === 'version') m.ver = v || '1.0'; else if (k === 'online') m.online = /^(1|evet|true|yes)$/i.test(v) ? 1 : 0; else m[k] = v;
    }
    return m;
  }
  function checkSyntax(code) {
    if (typeof code !== 'string' || !code.trim()) return 'Kod boş';
    if (code.length > LIM.code) return 'Kod çok uzun (en fazla ' + LIM.code + ' karakter)';
    try { new Function('GTA', '"use strict";\n' + code); return ''; } catch (e) { return 'Sözdizimi hatası: ' + e.message; }
  }
  function addMod(code, fallbackName) {
    const err = checkSyntax(code); if (err) return { err };
    if (MODS.all.length >= LIM.mods) return { err: 'En fazla ' + LIM.mods + ' mod eklenebilir' };
    const meta = parseMeta(code);
    const m = { id: uid(), name: meta.name || fallbackName || 'Adsız mod', author: meta.author, ver: meta.ver, desc: meta.desc, online: meta.online, code, on: 1, ts: Date.now() };
    MODS.all.push(m); if (!MODS.save()) { MODS.all.pop(); return { err: 'Kaydedilemedi (depolama dolu olabilir)' }; }
    return { mod: m };
  }

  /* ---- worker içi kod: oyun nesnelerine erişimi yok, ağ/depolama kapalı ---- */
  const WORKER_SRC = '(' + function () {
    'use strict';
    const kill = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'SharedWorker', 'Worker', 'WebTransport', 'RTCPeerConnection', 'Request', 'Response'];
    const post = self.postMessage.bind(self), oPost = post;
    for (const k of kill) { try { Object.defineProperty(self, k, { value: undefined, configurable: false, writable: false }); } catch (e) { try { self[k] = undefined; } catch (e2) { } } }
    try { if (self.navigator) Object.defineProperty(self.navigator, 'sendBeacon', { value: undefined }); } catch (e) { }
    const H = Object.create(null), CMD = Object.create(null); let ST = {}, DATA = {}, ONLINE = 0;
    const s = (v, n) => String(v == null ? '' : v).slice(0, n || 120), nn = v => { v = +v; return isFinite(v) ? v : 0; };
    const send = (t, a) => oPost({ t, a });
    const GTA = Object.freeze({
      on(ev, fn) { if (typeof fn !== 'function' || typeof ev !== 'string') return; (H[ev] || (H[ev] = [])).push(fn); },
      get state() { return ST; },
      get online() { return !!ONLINE; },
      toast: m => send('toast', [s(m)]),
      say: m => send('say', [s(m, 200)]),
      log: (...a) => send('log', [a.map(x => { try { return typeof x === 'object' ? JSON.stringify(x) : String(x); } catch (e) { return '?'; } }).join(' ').slice(0, 300)]),
      hud: (id, text) => send('hud', [s(id, 24), s(text, 80)]),
      hudRemove: id => send('hudRm', [s(id, 24)]),
      command: (name, fn, help) => { name = s(name, 20).toLowerCase().replace(/[^a-z0-9_çğıöşü]/g, ''); if (!name || typeof fn !== 'function') return; CMD[name] = fn; send('cmdReg', [name, s(help, 80)]); },
      addMoney: n => send('addMoney', [nn(n)]),
      setMoney: n => send('setMoney', [nn(n)]),
      heal: () => send('heal', []),
      giveWeapon: i => send('giveWeapon', [nn(i) | 0]),
      spawnCar: (name, color) => send('spawnCar', [s(name, 20), s(color, 9)]),
      teleport: (x, z) => send('teleport', [nn(x), nn(z)]),
      setHour: h => send('setHour', [nn(h)]),
      setWeather: w => send('setWeather', [s(w, 8)]),
      setWanted: n => send('setWanted', [nn(n)]),
      save(k, v) { try { DATA[s(k, 30)] = JSON.parse(JSON.stringify(v)); send('data', [DATA]); } catch (e) { } },
      load(k, d) { const v = DATA[s(k, 30)]; return v === undefined ? d : v; }
    });
    self.onmessage = ev => {
      const m = ev.data || {};
      try {
        if (m.t === 'init') {
          DATA = m.data || {}; ONLINE = m.online ? 1 : 0;
          try { (new Function('GTA', '"use strict";\n' + m.code))(GTA); } catch (e) { send('err', ['Yükleme hatası: ' + (e && e.message)]); }
          send('ready', []);
        } else if (m.t === 'start') {
          ONLINE = m.online ? 1 : 0; ST = m.st || ST;
          for (const f of (H.start || [])) { try { f(ST); } catch (e) { send('err', ['start: ' + (e && e.message)]); } }
        } else if (m.t === 'tick') {
          ST = m.st || ST; ONLINE = m.online ? 1 : 0;
          for (const f of (H.tick || [])) { try { f(ST, m.dt || .2); } catch (e) { send('err', ['tick: ' + (e && e.message)]); } }
          send('hb', []);
        } else if (m.t === 'cmd') {
          if (m.st) ST = m.st; const f = CMD[m.name]; if (f) { try { f(m.args || [], ST); } catch (e) { send('err', ['/' + m.name + ': ' + (e && e.message)]); } }
        } else if (m.t === 'stop') {
          for (const f of (H.stop || [])) { try { f(); } catch (e) { } }
        }
      } catch (e) { send('err', [String(e && e.message)]); }
    };
  } + ')()';
  let WURL = null;
  const workerUrl = () => WURL || (WURL = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })));

  /* ---- ana taraf: köprü ---- */
  const RUN = new Map();          // id -> çalışan mod
  const SPAWN_OK = new Set(['car', 'good-glb-car', 'police-car', 'bus', 'truck', 'alfa', 'mito', 'sport', 'moskvich', 'clio', 'volvo', 'bajaj', 'berrari', 'cmw', 'kercedes', 'f1', 'heli', 'plane']);
  const SAFE_ONLINE = new Set(['toast', 'say', 'log', 'hud', 'hudRm', 'cmdReg', 'data', 'hb', 'ready', 'err']);
  let hudBox = null;
  const getHud = () => hudBox || (hudBox = (() => { const d = document.createElement('div'); d.id = 'modhud'; document.body.appendChild(d); return d; })());
  const isOnline = () => tryF(() => !!ONL, false);
  const snapState = () => tryF(() => ({
    x: +P.x.toFixed(1), z: +P.z.toFixed(1), a: +P.a.toFixed(2), hp: Math.round(P.hp), money: P.money | 0, wanted: Math.round((P.heat || 0) / 30),
    hour: +(+hour).toFixed(2), rain: tryF(() => (rainOn ? 1 : 0), 0), inCar: P.car ? 1 : 0, speed: P.car ? Math.round(Math.abs(P.car.v || 0) * 3.6) : 0,
    wep: P.wep | 0, mode, online: isOnline() ? 1 : 0
  }), {});

  function modLog(r, kind, msg) {
    r.logs.push({ k: kind, m: String(msg).slice(0, 300), t: Date.now() }); if (r.logs.length > 40) r.logs.shift();
    if (kind === 'err') { r.errs.push(Date.now()); r.errs = r.errs.filter(t => Date.now() - t < 10000); if (r.errs.length >= 6) stopMod(r.id, 'Çok fazla hata: mod durduruldu'); }
    if (r.onLog) r.onLog();
  }
  function cleanupMod(r) {
    for (const el of r.huds.values()) el.remove(); r.huds.clear();
    for (const c of r.cars) { if (typeof P !== 'undefined' && P.car === c) continue; tryF(() => { scene.remove(c.m); const i = cars.indexOf(c); if (i >= 0) cars.splice(i, 1); }); }
    r.cars.length = 0;
  }
  function stopMod(id, why) {
    const r = RUN.get(id); if (!r) return;
    clearInterval(r.timer); tryF(() => r.w.postMessage({ t: 'stop' })); setTimeout(() => tryF(() => r.w.terminate()), 60);
    cleanupMod(r); RUN.delete(id); r.stopped = why || 'durdu';
    if (why) { const m = MODS.get(id); if (m) { m.lastErr = why; MODS.save(); } tryF(() => toast('Mod durdu: ' + (m ? m.name : id) + ' — ' + why)); }
    if (r.onLog) r.onLog();
  }
  function stopAllMods() { for (const id of [...RUN.keys()]) stopMod(id); }

  function act(r, t, a, dry) {
    a = Array.isArray(a) ? a : [];
    const now = Date.now(); if (now - r.rt > 1000) { r.rt = now; r.rn = 0; } if (++r.rn > 80) return;
    if (dry) { modLog(r, 'info', '→ ' + t + '(' + a.map(x => JSON.stringify(x)).join(', ') + ')'); return; }
    if (isOnline() && !SAFE_ONLINE.has(t)) { if (!r.warnOn) { r.warnOn = 1; modLog(r, 'warn', 'Çevrimiçi dünyada "' + t + '" kapalı (adil oyun için)'); } return; }
    const str = (v, n) => String(v == null ? '' : v).slice(0, n);
    switch (t) {
      case 'toast': tryF(() => toast(str(a[0], 120))); break;
      case 'say': tryF(() => say(str(a[0], 200))); break;
      case 'log': modLog(r, 'info', a[0]); break;
      case 'err': modLog(r, 'err', a[0]); break;
      case 'hb': r.waiting = 0; r.lastHb = now; break;
      case 'ready': r.ready = 1; break;
      case 'data': { const j = tryF(() => JSON.stringify(a[0] || {}), ''); if (j && j.length <= LIM.data) tryF(() => localStorage.setItem('g67md_' + r.id, j)); break; }
      case 'hud': {
        const id = str(a[0], 24).replace(/[^\w\-çğıöşüÇĞİÖŞÜ ]/g, ''); if (!id) break;
        let el = r.huds.get(id);
        if (!el) { if (r.huds.size >= 8) break; el = document.createElement('div'); el.className = 'mh'; getHud().appendChild(el); r.huds.set(id, el); }
        el.textContent = str(a[1], 80); break;
      }
      case 'hudRm': { const el = r.huds.get(str(a[0], 24)); if (el) { el.remove(); r.huds.delete(str(a[0], 24)); } break; }
      case 'cmdReg': r.cmds.set(str(a[0], 20), str(a[1], 80)); break;
      case 'addMoney': P.money = clampN((P.money | 0) + clampN(fin(a[0]), -1e7, 1e7), 0, 1e9) | 0; break;
      case 'setMoney': P.money = clampN(fin(a[0]), 0, 1e9) | 0; break;
      case 'heal': P.hp = 100; break;
      case 'giveWeapon': { const i = a[0] | 0; if (i >= 0 && i < P.own.length) P.own[i] = 1; break; }
      case 'teleport': {
        const x = clampN(fin(a[0]), -3000, 3000), z = clampN(fin(a[1]), -3000, 3000);
        tryF(() => { if (INT) exitInt(); P.x = x; P.z = z; if (P.car) { P.car.x = x; P.car.z = z; } }); break;
      }
      case 'setHour': hour = ((fin(a[0]) % 24) + 24) % 24; break;
      case 'setWeather': tryF(() => { S.rain = a[0] === 'rain' ? 2 : a[0] === 'clear' ? 0 : 1; lbl(); }); break;
      case 'setWanted': P.heat = clampN(fin(a[0]), 0, 5) * 30; break;
      case 'spawnCar': {
        const nm = str(a[0], 20).toLowerCase(); if (!SPAWN_OK.has(nm)) { modLog(r, 'warn', 'spawnCar: bilinmeyen araç "' + nm + '"'); break; }
        const n0 = cars.length;
        tryF(() => runCmd('/spawn ' + nm));
        if (cars.length > n0) { const c = cars[cars.length - 1]; r.cars.push(c); if (r.cars.length > 12) { const o = r.cars.shift(); tryF(() => { if (P.car !== o) { scene.remove(o.m); const i = cars.indexOf(o); if (i >= 0) cars.splice(i, 1); } }); } }
        break;
      }
    }
  }

  function makeRunner(m, dry) {
    const r = { id: m.id, w: null, logs: [], errs: [], huds: new Map(), cars: [], cmds: new Map(), rt: 0, rn: 0, waiting: 0, lastHb: Date.now(), ready: 0, timer: 0 };
    r.w = new Worker(workerUrl());
    r.w.onmessage = ev => { const d = ev.data || {}; act(r, d.t, d.a, dry); };
    r.w.onerror = ev => { if (ev && ev.preventDefault) ev.preventDefault(); modLog(r, 'err', 'Worker hatası: ' + (ev && ev.message)); };
    const data = tryF(() => JSON.parse(localStorage.getItem('g67md_' + m.id) || '{}'), {});
    r.w.postMessage({ t: 'init', code: m.code, data, online: isOnline() ? 1 : 0 });
    return r;
  }
  function startMod(m) {
    if (RUN.has(m.id)) return;
    let r; try { r = makeRunner(m, false); } catch (e) { tryF(() => toast('Mod başlatılamadı: ' + m.name)); return; }
    RUN.set(m.id, r);
    r.w.postMessage({ t: 'start', st: snapState(), online: isOnline() ? 1 : 0 });
    r.timer = setInterval(() => {
      if (typeof mode === 'undefined' || mode === 'menu') return;
      const now = Date.now();
      if (r.waiting && now - r.lastHb > 4000) { stopMod(r.id, 'Yanıt vermedi (sonsuz döngü?), durduruldu'); return; }
      if (r.waiting) return;
      r.waiting = 1; r.lastHb = r.lastHb || now;
      r.w.postMessage({ t: 'tick', st: snapState(), dt: .2, online: isOnline() ? 1 : 0 });
    }, 200);
    r.lastHb = Date.now();
  }
  function startEnabledMods() { stopAllMods(); for (const m of MODS.all) if (m.on) startMod(m); }

  // /komut yönlendirme ve /help
  const _rc = window.runCmd;
  if (typeof _rc === 'function') {
    window.runCmd = function (v) {
      const a = String(v || '').replace(/^\//, '').trim().split(/\s+/), nm = (a[0] || '').toLowerCase();
      for (const r of RUN.values()) if (r.cmds.has(nm)) { r.w.postMessage({ t: 'cmd', name: nm, args: a.slice(1), st: snapState() }); return; }
      const out = _rc.apply(this, arguments);
      if (nm === 'help' && RUN.size) {
        const l = []; for (const r of RUN.values()) for (const [k, h] of r.cmds) l.push('/' + k + (h ? ' (' + h + ')' : ''));
        if (l.length) tryF(() => say('Mod komutları: ' + l.join('  ')));
      }
      return out;
    };
  }

  /* ---- örnek modlar ---- */
  const SAMPLES = [
    ['Hız ve saat göstergesi', `// ==Mod==
// name: Hız ve Saat
// author: GTA67
// version: 1.0
// desc: Ekranda hız, saat ve para gösterir
// ==/Mod==
GTA.on('tick', s => {
  GTA.hud('hiz', s.inCar ? 'Hız: ' + s.speed + ' km/s' : 'Yaya');
  const h = Math.floor(s.hour), m = Math.floor((s.hour - h) * 60);
  GTA.hud('saat', 'Saat ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
});`],
    ['/para komutu', `// ==Mod==
// name: Para Komutu
// author: GTA67
// version: 1.0
// desc: /bonus yazınca 1000$ verir, /zipla bulunduğun yerin 30 birim ilerisine ışınlar
// ==/Mod==
GTA.command('bonus', () => { GTA.addMoney(1000); GTA.toast('+1000$ bonus'); }, '1000$ ver');
GTA.command('ilerle', (args, s) => {
  const d = Math.min(200, Number(args[0]) || 30);
  GTA.teleport(s.x + Math.sin(s.a) * d, s.z + Math.cos(s.a) * d);
}, 'ileri ışınlan [metre]');`],
    ['Para yağmuru', `// ==Mod==
// name: Para Yağmuru
// author: GTA67
// version: 1.0
// desc: Her 30 saniyede 200$ verir, toplamı kaydeder
// ==/Mod==
let t = 0, toplam = GTA.load('toplam', 0);
GTA.on('start', () => GTA.toast('Para yağmuru modu aktif'));
GTA.on('tick', (s, dt) => {
  t += dt;
  if (t >= 30) { t = 0; toplam += 200; GTA.addMoney(200); GTA.save('toplam', toplam); GTA.toast('+200$ (toplam ' + toplam + '$)'); }
});`]
  ];
  const TEMPLATE = `// ==Mod==
// name: Yeni Mod
// author: Ben
// version: 1.0
// desc: Ne yaptığını yaz
// online: hayır
// ==/Mod==
GTA.on('start', () => GTA.toast('Modum çalışıyor!'));
GTA.on('tick', (s, dt) => {
  // s.x s.z s.hp s.money s.hour s.speed s.inCar ... her 0.2 sn
});
GTA.command('merhaba', () => GTA.toast('Merhaba!'), 'selam verir');`;
  const API_HELP = `GTA.on('start'|'tick'|'stop', fn)
GTA.state -> {x,z,a,hp,money,wanted,hour,rain,inCar,speed,wep,online}
GTA.toast(m)  GTA.say(m)  GTA.log(...)
GTA.hud(id,metin)  GTA.hudRemove(id)
GTA.command('ad',(args,s)=>{}, 'yardım')
GTA.addMoney(n) setMoney(n) heal() giveWeapon(0-3)
GTA.spawnCar('alfa'|'bus'|'heli'...) teleport(x,z)
GTA.setHour(0-24) setWeather('rain'|'clear') setWanted(0-5)
GTA.save(k,v)  GTA.load(k,varsayilan)
Çevrimiçi dünyada sadece toast/say/hud/command/save çalışır.`;

  /* ===================== ARAYÜZ ===================== */
  const mk = (id, html) => { const d = document.createElement('div'); d.id = id; d.className = 'ov hid'; d.innerHTML = html; document.body.appendChild(d); return d; };
  const wch = mk('wch', '<h2>ÇEVRİMDIŞI</h2><div class="wcw"><button class="mb" id="wCont"></button><button class="mb" id="wNew">YENİ DÜNYA</button><button class="mb" id="wBack">GERİ</button></div><p id="wInfo"></p>');
  const mpr = mk('mpr', '<h2>MOD İSTER MİSİNİZ?</h2><p id="mpInfo"></p><div class="wcw"><button class="mb" id="mpYes">EVET</button><button class="mb" id="mpNo">HAYIR</button></div>');
  const mmg = mk('mmg', '<h2>MODLAR</h2><div id="mlist"></div><p id="mmsg"></p><div class="wcw"><button class="mb" id="mNew">YENİ MOD YAP</button><button class="mb" id="mFile">DOSYA EKLE</button><button class="mb" id="mSmp">ÖRNEK EKLE</button><button class="mb" id="mGo">BAŞLA</button><button class="mb" id="mBack">GERİ</button></div><input type="file" id="mPick" accept=".js,.txt,text/javascript,text/plain" hidden>');
  const med = mk('med', '<h2 id="meT">MOD YAZ</h2><textarea id="meCode" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"></textarea><pre id="meLog"></pre><div class="wcw"><button class="mb" id="meSave">KAYDET</button><button class="mb" id="meTest">TEST ET</button><button class="mb" id="meApi">REHBER</button><button class="mb" id="meBack">İPTAL</button></div>');
  const modBtn = $('bMod');

  const hideAll = () => { for (const e of [wch, mpr, mmg, med]) e.classList.add('hid'); };
  const showOv = e => { hideAll(); e.classList.remove('hid'); };
  let flowDone = null, fromMenu = false, editingId = null, startAfter = null;

  function setPlayLabel() { const b = $('bPlay'); if (b) b.textContent = (isOnline() && worldActive()) ? 'DEVAM' : 'ÇEVRİMDIŞI BAŞLA'; }
  setPlayLabel();

  /* --- mod yöneticisi --- */
  function renderList() {
    const box = $('mlist');
    if (!MODS.all.length) { box.innerHTML = '<p class="mnone">Henüz mod yok. YENİ MOD YAP, DOSYA EKLE veya ÖRNEK EKLE.</p>'; return; }
    box.innerHTML = MODS.all.map(m => {
      const r = RUN.get(m.id), last = r && r.logs.slice(-1)[0];
      return '<div class="mrow" data-id="' + esc(m.id) + '"><label class="msw"><input type="checkbox" ' + (m.on ? 'checked' : '') + '><i></i></label>' +
        '<div class="mmeta"><b>' + esc(m.name) + '</b> <small>v' + esc(m.ver) + (m.author ? ' · ' + esc(m.author) : '') + (m.online ? ' · çevrimiçi uyumlu' : '') + '</small>' +
        (m.desc ? '<br><small>' + esc(m.desc) + '</small>' : '') + (m.lastErr ? '<br><small class="merr">⚠ ' + esc(m.lastErr) + '</small>' : '') + (last && last.k === 'err' ? '<br><small class="merr">⚠ ' + esc(last.m) + '</small>' : '') + '</div>' +
        '<button class="mi" data-a="edit" aria-label="Düzenle">✎</button><button class="mi" data-a="del" aria-label="Sil">✕</button></div>';
    }).join('');
  }
  $('mlist').addEventListener('change', e => {
    const row = e.target.closest('.mrow'); if (!row) return; const m = MODS.get(row.dataset.id); if (!m) return;
    m.on = e.target.checked ? 1 : 0; if (m.on) delete m.lastErr; MODS.save();
  });
  $('mlist').addEventListener('click', e => {
    const b = e.target.closest('button.mi'); if (!b) return; const row = b.closest('.mrow'), m = MODS.get(row.dataset.id); if (!m) return;
    if (b.dataset.a === 'edit') openEditor(m);
    else if (b.dataset.a === 'del') {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'SİL?'; b.classList.add('sure'); setTimeout(() => { b.dataset.sure = ''; b.textContent = '✕'; b.classList.remove('sure'); }, 2500); return; }
      stopMod(m.id); MODS.all = MODS.all.filter(x => x.id !== m.id); MODS.save(); tryF(() => localStorage.removeItem('g67md_' + m.id)); renderList();
    }
  });
  const msg = t => { $('mmsg').textContent = t || ''; };
  function openManager(fm, goCb) {
    fromMenu = fm; startAfter = goCb || null; msg(''); renderList();
    $('mGo').style.display = goCb ? '' : 'none'; $('mBack').textContent = goCb ? 'MODSUZ BAŞLA' : 'GERİ';
    showOv(mmg);
  }
  $('mSmp').onclick = () => {
    let n = 0; for (const [nm, code] of SAMPLES) { if (MODS.all.some(m => m.code === code)) continue; const r = addMod(code, nm); if (r.err) { msg(r.err); break; } n++; }
    msg(n ? n + ' örnek mod eklendi' : 'Örnekler zaten ekli'); renderList();
  };
  $('mFile').onclick = () => $('mPick').click();
  $('mPick').onchange = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > LIM.code * 2) return msg('Dosya çok büyük');
    const code = await f.text().catch(() => ''); const r = addMod(code, f.name.replace(/\.[a-z]+$/i, ''));
    msg(r.err ? r.err : '"' + r.mod.name + '" eklendi'); renderList();
  };
  $('mNew').onclick = () => openEditor(null);
  $('mGo').onclick = () => { const cb = startAfter; startAfter = null; startEnabledMods(); if (cb) cb(); };
  $('mBack').onclick = () => {
    if (startAfter) { const cb = startAfter; startAfter = null; stopAllMods(); cb(); }     // modsuz başla
    else { hideAll(); show('menu'); }
  };
  modBtn.onclick = () => { $('menu').classList.add('hid'); openManager(true, null); };

  /* --- editör --- */
  function logEd(t) { const p = $('meLog'); p.textContent = t; p.scrollTop = p.scrollHeight; }
  let testRun = null, testT = 0;
  function stopTest() { clearTimeout(testT); if (testRun) { tryF(() => testRun.w.terminate()); cleanupMod(testRun); testRun = null; } }
  function openEditor(m) {
    editingId = m ? m.id : null; $('meT').textContent = m ? 'MODU DÜZENLE' : 'YENİ MOD'; $('meCode').value = m ? m.code : TEMPLATE; logEd(''); showOv(med);
  }
  $('meBack').onclick = () => { stopTest(); showOv(mmg); renderList(); };
  $('meApi').onclick = () => logEd(API_HELP);
  $('meSave').onclick = () => {
    stopTest(); const code = $('meCode').value, err = checkSyntax(code); if (err) return logEd('✗ ' + err);
    const meta = parseMeta(code);
    if (editingId) { const m = MODS.get(editingId); if (m) { stopMod(m.id); Object.assign(m, { name: meta.name || m.name, author: meta.author, ver: meta.ver, desc: meta.desc, online: meta.online, code }); delete m.lastErr; if (!MODS.save()) return logEd('✗ Kaydedilemedi'); } }
    else { const r = addMod(code, 'Adsız mod'); if (r.err) return logEd('✗ ' + r.err); }
    showOv(mmg); msg('Kaydedildi'); renderList();
  };
  $('meTest').onclick = () => {
    stopTest(); const code = $('meCode').value, err = checkSyntax(code); if (err) return logEd('✗ ' + err);
    if (typeof Worker === 'undefined') return logEd('✗ Bu cihaz Worker desteklemiyor');
    const fake = { id: 'test', code }; let lines = ['▶ Test başladı (3 sn, oyun etkilenmez)'];
    try { testRun = makeRunner(fake, true); } catch (e) { return logEd('✗ ' + e.message); }
    const r = testRun; r.onLog = () => { logEd(lines.concat(r.logs.map(l => (l.k === 'err' ? '✗ ' : l.k === 'warn' ? '! ' : '  ') + l.m)).join('\n')); };
    r.w.postMessage({ t: 'start', st: snapState(), online: 0 }); let n = 0;
    r.timer = setInterval(() => { if (r.waiting) return; r.waiting = 1; r.w.postMessage({ t: 'tick', st: snapState(), dt: .2, online: 0 }); if (++n > 14) clearInterval(r.timer); }, 200);
    testT = setTimeout(() => { const w = r.waiting && Date.now() - r.lastHb > 2500 ? ' ✗ yanıt vermiyor (sonsuz döngü?)' : ''; clearInterval(r.timer); r.logs.push({ k: 'info', m: '■ Test bitti' + w, t: 0 }); r.onLog(); tryF(() => r.w.terminate()); testRun = null; }, 3200);
    r.onLog();
  };

  /* --- "Mod ister misiniz?" --- */
  function askMods(cb) {
    const n = MODS.all.filter(m => m.on).length;
    $('mpInfo').textContent = MODS.all.length ? (n + ' mod açık · toplam ' + MODS.all.length + (isOnline() ? '. Çevrimiçinde modlar sadece sende çalışır, dünyayı etkileyemez.' : '')) : 'Kendi modunu yapabilir, dosyadan ekleyebilir ya da örnek modları deneyebilirsin.';
    showOv(mpr);
    $('mpYes').onclick = () => openManager(false, cb);
    $('mpNo').onclick = () => { stopAllMods(); hideAll(); cb(); };
  }

  /* ===================== DÜNYAYA GİRİŞ AKIŞI ===================== */
  const origPlay = $('bPlay').onclick;
  const enterNow = key => {          // orijinal oyun başlatma
    hideAll(); worldKey = key; lockLandscape();
    origPlay.call($('bPlay'));
    setPlayLabel();
  };
  const afterReload = () => tryF(() => sessionStorage.getItem('g67auto'));

  function offlineFlow() {
    lockLandscape();
    const sv = readSave(), active = worldKey === 'off';
    $('wCont').textContent = active ? 'DEVAM ET' : (sv ? 'DEVAM ET' : 'KAYIT YOK');
    $('wCont').disabled = !active && !sv; $('wCont').classList.toggle('dis', !active && !sv);
    $('wInfo').textContent = active ? 'Açık dünyana dön' : (sv ? ('Son kayıt: ' + new Date(sv.ts).toLocaleString('tr-TR') + (sv.core ? ' · $' + (sv.core.money | 0) : '')) : 'Henüz kayıtlı dünya yok. Oyun otomatik kaydeder.');
    $('wNew').textContent = 'YENİ DÜNYA'; $('wNew').dataset.sure = '';
    $('menu').classList.add('hid'); showOv(wch);
    $('wBack').onclick = () => { hideAll(); show('menu'); unlockLandscape(); };
    $('wCont').onclick = () => {
      if ($('wCont').disabled) return;
      if (active) { hideAll(); enterNow('off'); return; }                       // aynı dünyaya dön (mod sorulmaz)
      if (isOnline()) tryF(() => onlLeave());
      if (typeof started !== 'undefined' && started) { tryF(() => sessionStorage.setItem('g67auto', 'cont')); noSave = true; location.reload(); return; }
      askMods(() => { enterNow('off'); setTimeout(() => applySaveW(readSave()), 150); });
    };
    $('wNew').onclick = () => {
      const b = $('wNew');
      if (sv && b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'KAYIT SİLİNECEK, EMİN MİSİN?'; setTimeout(() => { b.dataset.sure = ''; b.textContent = 'YENİ DÜNYA'; }, 3500); return; }
      tryF(() => localStorage.removeItem(SAVEK));
      if (isOnline()) tryF(() => onlLeave());
      if (typeof started !== 'undefined' && started) { tryF(() => sessionStorage.setItem('g67auto', 'new')); noSave = true; location.reload(); return; }
      askMods(() => enterNow('off'));
    };
  }

  $('bPlay').onclick = function () {
    // çevrimiçi yoldan geliyorsa (oda kuruldu/girildi)
    if (isOnline()) {
      const key = 'on:' + (tryF(() => ONL_CODE, '') || 'x');
      if (worldKey === key) { enterNow(key); return; }                           // duraklatılan odaya dönüş
      stopAllMods(); lockLandscape();
      askMods(() => enterNow(key));
      return;
    }
    offlineFlow();
  };
  // çevrimiçi akışta oda ekranları yatayda kullanılır; hesap/oda ekranlarında kilit yok.

  // MENÜ düğmesi: dikey/eski yöne dön
  $('pz').addEventListener('click', () => { unlockLandscape(); setTimeout(setPlayLabel, 0); });

  // sayfa yenilenmiş otomatik başlangıç: "DOKUN VE BAŞLA"
  const auto = afterReload();
  if (auto) {
    tryF(() => sessionStorage.removeItem('g67auto'));
    const sp = mk('spl', '<h2>' + (auto === 'new' ? 'YENİ DÜNYA' : 'DEVAM ET') + '</h2><button class="mb" id="splGo">DOKUN VE BAŞLA</button>');
    $('menu').classList.add('hid'); sp.classList.remove('hid');
    $('splGo').onclick = () => {
      sp.remove(); lockLandscape();
      startEnabledMods(); enterNow('off'); if (auto === 'cont') setTimeout(() => applySaveW(readSave()), 150);
    };
  }

  window.__g67mods = { MODS, RUN, addMod, checkSyntax, parseMeta, startMod, stopMod, stopAllMods, lockLandscape, unlockLandscape, readSave, buildSave, saveNow, applySaveW, worldKey: () => worldKey };
})();
