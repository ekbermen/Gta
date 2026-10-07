/* GTA 67 v6 (game.js ve online2.js'ten SONRA yüklenir)
   1) İlerleme kaydı (tarayıcı + sunucu): para, silah, ev, işletme, banka, polis, satın alınan arabalar
   2) Yaralanınca / ölünce ambulans -> hastane
   3) Polis mesleği (karakol)
   4) Evler: yatak, insansız, 2 katlı evde merdiven; her mekanın içi ve dışı farklı */
(() => {
  const tryF = f => { try { return f() } catch (e) { return undefined } };
  const KEYP = () => 'g67p_' + ((typeof USR !== 'undefined' && USR) || 'misafir');
  let TOK = tryF(() => localStorage.getItem('g67tok'));
  if (!TOK) { TOK = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); tryF(() => localStorage.setItem('g67tok', TOK)); }
  const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 };
  const rng = seed => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } };

  /* ================= 1) İLERLEME KAYDI ================= */
  const ORIG = {};
  for (const n of ['buyCar', 'buyMdl', 'buyAlfa', 'gcar']) {
    const f = window[n]; if (typeof f !== 'function') continue; ORIG[n] = f;
    window[n] = function (...a) {
      const n0 = cars.length, r = f.apply(this, a);
      if (cars.length > n0 && (n !== 'gcar' || !a[1])) cars[cars.length - 1].src = [n, a.slice()];
      return r;
    };
  }
  function carsSave() {
    const o = [];
    for (const c of cars) if (c.src && !c.dead && c.x < 9e4) o.push({ s: c.src, x: +c.x.toFixed(1), z: +c.z.toFixed(1), a: +c.a.toFixed(3), hp: Math.round(c.hp || 100), mx: c.mx || 0 });
    return o;
  }
  function restoreOne(q) {
    const n = q.s[0], a = q.s[1], n0 = cars.length, tt = window.toast; window.toast = () => { };
    try { if (n === 'gcar') mkVeh(a[0], q.x, q.z, q.a); else ORIG[n](...a); } catch (e) { }
    window.toast = tt;
    if (cars.length === n0) return 0;
    const k = cars[cars.length - 1]; k.src = q.s; k.x = q.x; k.z = q.z; k.a = q.a; k.v = 0; k.ai = 0;
    if (q.hp > 0) k.hp = q.hp; if (q.mx > 0) k.mx = q.mx; return 1;
  }
  let CRT = 0;
  function restoreCars(list) {
    for (const c of cars) if (c.src) { c.dead = 1; c.m.visible = false; c.x = c.z = 1e5; c.src = 0; }
    clearInterval(CRT); let q = (list || []).slice(), tries = 0; if (!q.length) return;
    const run = () => { q = q.filter(x => !restoreOne(x)); if (!q.length || ++tries > 40) clearInterval(CRT); };
    run(); if (q.length) CRT = setInterval(run, 1500);
  }
  const snap = () => ({
    v: 1, ts: Date.now(), money: P.money | 0, own: P.own, arm: P.arm | 0, dm: P.dm || 1, home: P.home || 0, pol: P.pol ? 1 : 0,
    bnk: tryF(() => BNK) | 0, biz: tryF(() => Object.assign({}, BIZ)) || {}, cars: carsSave()
  });
  function applySave(d, withCars) {
    if (!d || typeof d !== 'object') return;
    P.money = d.money | 0; if (Array.isArray(d.own)) P.own = d.own; P.arm = d.arm | 0; P.dm = d.dm || 1; P.home = d.home | 0;
    tryF(() => { BNK = d.bnk | 0 });
    tryF(() => { for (const k of Object.keys(BIZ)) delete BIZ[k]; Object.assign(BIZ, d.biz || {}) });
    if (d.pol) { P.pol = 1; } if (withCars !== false) restoreCars(d.cars);
  }
  window.__sv = { snap, applySave };
  let loaded = 0, lastSent = 0;
  const loadT = setInterval(() => {
    if (loaded || typeof USR === 'undefined' || !USR) return; loaded = 1; clearInterval(loadT);
    const d = tryF(() => JSON.parse(localStorage.getItem(KEYP()) || 'null'));
    if (d) { applySave(d); setTimeout(() => toast('Kayıt yüklendi · $' + P.money), 1500); }
    P.__ts = d ? d.ts : 0;
  }, 400);
  const saveNow = () => { if (!loaded) return; const d = snap(); tryF(() => localStorage.setItem(KEYP(), JSON.stringify(d))); P.__ts = d.ts; return d };
  setInterval(() => {
    const d = saveNow(); if (!d) return;
    if (typeof ONL !== 'undefined' && ONL && Date.now() - lastSent > 20000) { lastSent = Date.now(); if (JSON.stringify(d).length > 11000) d.cars = d.cars.slice(0, 8); tryF(() => onlSend({ t: 'sv', tok: TOK, d })); }
  }, 8000);
  addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  addEventListener('pagehide', saveNow);
  // sunucu kaydı: odaya girince iste, yerelden yeniyse uygula
  const _om6 = onlMsg;
  onlMsg = function (m) {
    if (m && m.t === 'svd') {
      if (m.d && m.d.ts > (P.__ts || 0)) { applySave(m.d); toast('Sunucu kaydı yüklendi · $' + P.money); }
      return;
    }
    if (m && (m.t === 'created' || m.t === 'joined')) setTimeout(() => tryF(() => onlSend({ t: 'ld', tok: TOK })), 600);
    return _om6(m);
  };

  /* ================= 2) AMBULANS / HASTANE ================= */
  let AMB = null;
  const hosp = () => { let b = null, bd = 1e9; for (const p of PLC) if (p.t === 'hastane') { const d = Math.hypot(p.dx - P.x, p.dz - P.z); if (d < bd) { bd = d; b = p; } } return b };
  function mkAmbulance(x, z, a) {
    const k = mkCar(2, '#f4f6f8', x, z, a); k.ai = 0; k.amb = 1; k.wild = 1;
    const mk = c => new T.Mesh(gBox, new T.MeshBasicMaterial({ color: c }));
    const l1 = mk(0xff2222), l2 = mk(0x2244ff), cr1 = mk(0xdd1111), cr2 = mk(0xdd1111);
    l1.scale.set(.7, .25, .5); l1.position.set(-.45, 2.35, .3); l2.scale.set(.7, .25, .5); l2.position.set(.45, 2.35, .3);
    cr1.scale.set(2.05, .18, .9); cr1.position.set(0, 1.35, 0); cr2.scale.set(.18, .9, 2.4); cr2.position.set(0, 1.35, 0);
    k.m.add(l1); k.m.add(l2); k.m.add(cr1); k.m.add(cr2); k.l1 = l1; k.l2 = l2; return k;
  }
  function callAmb(dead) {
    if (AMB) return;
    const h = hosp(); if (!h) { if (!dead) toast('Hastane bulunamadı'); return false; }
    const r = Math.random() * 6.28, d0 = 70;
    const k = mkAmbulance(P.x + Math.sin(r) * d0, P.z + Math.cos(r) * d0, 0);
    AMB = { k, ph: 'come', t: 0, dead, h, fade: 0 };
    if (!dead) { mode = 'dead'; J.x = J.y = 0; }
    toast('AMBULANS yola çıktı...'); return true;
  }
  const step = (k, tx, tz, sp, dt) => {
    const dx = tx - k.x, dz = tz - k.z, d = Math.hypot(dx, dz) || 1, m = Math.min(d, sp * dt);
    k.a = Math.atan2(dx, dz); k.x += dx / d * m; k.z += dz / d * m; k.v = sp; k.ai = 0; return d - m;
  };
  setInterval(() => {
    const A = AMB; if (!A) return; const dt = .033, k = A.k; A.t += dt;
    k.l1.visible = (A.t * 6 | 0) % 2 === 0; k.l2.visible = !k.l1.visible;
    if (A.ph === 'come') {
      const d = step(k, P.x, P.z, 30, dt); if (A.t % 1.2 < .05) tryF(() => sfx(.2, .3, 880));
      if (d < 4.5) { A.ph = 'load'; A.t = 0; k.v = 0; toast(A.dead ? 'Sağlık ekibi seni kaldırıyor...' : 'Sağlık ekibi geldi, aracın içine alınıyorsun'); P.mesh.visible = false; }
    } else if (A.ph === 'load') {
      k.v = 0; P.x = k.x; P.z = k.z;
      if (A.t > 1.8) {
        A.ph = 'go'; A.t = 0; P.mesh.visible = false; P.mesh.rotation.x = 0; $('wst').classList.add('hid');
        if (Math.hypot(A.h.dx - k.x, A.h.dz - k.z) > 110) { tf.textContent = 'Ambulans seni hastaneye götürüyor...'; tf.style.opacity = 1; A.fade = 1; setTimeout(() => { const a = Math.random() * 6.28; k.x = A.h.dx + Math.sin(a) * 45; k.z = A.h.dz + Math.cos(a) * 45; A.fade = 2; setTimeout(() => { tf.style.opacity = 0; A.fade = 0; }, 400); }, 2200); }
      }
    } else if (A.ph === 'go') {
      if (A.fade === 1) { P.x = k.x; P.z = k.z; return; }
      const d = step(k, A.h.dx, A.h.dz, 26, dt); P.x = k.x; P.z = k.z;
      if (d < 5) { A.ph = 'in'; A.t = 0; k.v = 0; tf.textContent = 'Hastaneye ulaştın'; tf.style.opacity = 1; }
    } else if (A.ph === 'in' && A.t > 1.2) {
      const h = A.h, fee = Math.min(P.money, 150);
      P.money -= fee; P.hp = A.dead ? 60 : 75; P.heat = 0; stars = 0; P.mesh.visible = true; P.mesh.rotation.x = 0;
      P.x = h.dx; P.z = h.dz; mode = 'play'; $('wst').classList.add('hid');
      k.dead = 1; k.m.visible = false; k.x = k.z = 1e5; try { scene.remove(k.m); const i = cars.indexOf(k); if (i >= 0) cars.splice(i, 1); } catch (e) { }
      AMB = null; enterInt(h); tf.style.opacity = 0;
      setTimeout(() => toast('Tedavi edildin' + (fee ? ' · ücret $' + fee : '') + ' · yatağa uzanıp can yenileyebilirsin'), 600);
    }
  }, 33);
  window.GTA_DIE = function () { return callAmb(true) === true; };
  // yaralıyken AMBULANS düğmesi
  const ab = document.createElement('button');
  ab.textContent = 'AMBULANS ÇAĞIR'; ab.style.cssText = 'position:fixed;left:12px;top:56%;z-index:30;padding:10px 14px;font:700 14px sans-serif;border-radius:10px;border:2px solid #fff;background:#d62828;color:#fff;display:none';
  ab.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (P.hp <= 35 && mode === 'play' && !P.car && !INT) callAmb(false); });
  document.body.appendChild(ab);
  setInterval(() => { ab.style.display = (P.hp <= 35 && P.hp > 0 && mode === 'play' && !P.car && !INT && !AMB) ? 'block' : 'none'; }, 400);

  /* ================= 3) POLİS MESLEĞİ ================= */
  let PAT = null; const arrested = new WeakSet();
  const copDress = () => { try { dress('#1d3a8a', '#0d1b3f'); } catch (e) { } };
  function pickSuspect() {
    const l = peds.filter(p => !p.cop && !p.gang && !p.dead && !arrested.has(p) && Math.hypot(p.x - P.x, p.z - P.z) > 40 && Math.hypot(p.x - P.x, p.z - P.z) < 380);
    return l.length ? l[Math.random() * l.length | 0] : null;
  }
  function nextSuspect() {
    const s = pickSuspect(); if (!s) { PAT = null; TJ = null; tjM.visible = false; return toast('Şu an şüpheli yok'); }
    PAT.s = s; TJ = { k: 'pol', x: s.x, z: s.z, nm: 'Devriye' }; toast('Şüpheli işaretlendi — yakalamak için yaklaş (' + PAT.n + '/8)');
  }
  window.__patTick = () => { };
  setInterval(() => {
    if (!PAT || !PAT.s) return;
    const s = PAT.s; TJ = TJ && TJ.k === 'pol' ? TJ : { k: 'pol', x: s.x, z: s.z }; TJ.x = s.x; TJ.z = s.z;
    const d = Math.hypot(P.x - s.x, P.z - s.z);
    if (d < (P.car ? 7 : 3.4)) {
      arrested.add(s); if (!ONL) { try { s.m.visible = false; s.x = s.z = 1e5; s.dead = 1; } catch (e) { } }
      const pay = 150 + (Math.random() * 150 | 0); P.money += pay; PAT.n++; tone(880, .25, 'triangle', .08);
      toast('Şüpheli gözaltına alındı +$' + pay);
      if (PAT.n >= 8) { P.money += 500; toast('Vardiya bitti: +$500 bonus'); PAT = null; TJ = null; tjM.visible = false; return; }
      nextSuspect();
    }
  }, 250);
  setInterval(() => { if (P.pol && P.heat > 0) { P.heat = 0; } }, 500);
  function togglePol() {
    P.pol = P.pol ? 0 : 1;
    if (P.pol) { copDress(); toast('Polis oldun! Arama seviyen artmaz. Devriye görevi alabilirsin'); }
    else { PAT = null; TJ = null; tjM.visible = false; toast('Mesai bitti'); }
  }
  function patrolStart() {
    if (!P.pol) return toast('Önce polis ol'), false;
    PAT = { n: 0, s: null }; nextSuspect(); return true;
  }
  function patrolCar() {
    if (!P.pol) return toast('Önce polis ol'), false;
    const k = mkCar(3, '#1f3a93', (INT ? INT.rx : P.x) + 7, (INT ? INT.rz : P.z) + 7, 0); try { skin(k); } catch (e) { } k.ai = 0; k.own = 1;
    const l = new T.Mesh(gBox, new T.MeshBasicMaterial({ color: 0xff2222 })); l.scale.set(1.3, .22, .45); l.position.set(0, 1.55, 0); k.m.add(l);
    toast('Devriye aracın kapıda');
  }
  if (SH.karakol) SH.karakol.unshift(['Polis ol / mesaiyi bitir', 0, () => { togglePol(); return false; }], ['Devriye görevi başlat (şüpheli yakala)', 0, () => { patrolStart(); return false; }], ['Devriye aracı al', 0, () => { patrolCar(); return false; }]);

  /* ================= 4) EV İÇLERİ, KATLAR, MERDİVEN ================= */
  const gb = () => (typeof gBox !== 'undefined' ? gBox : new T.BoxGeometry(1, 1, 1));
  const matL = c => new T.MeshLambertMaterial({ color: c });
  const matB = c => new T.MeshBasicMaterial({ color: c });
  function box(par, sx, sy, sz, x, y, z, col, em) {
    const m = new T.Mesh(gb(), em ? matB(col) : matL(col)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); par.add(m); return m;
  }
  const R = (x, z, rot) => { const g = new T.Group(); g.position.set(R0X + x, 0, R0Z + z); g.rotation.y = rot || 0; ROOM.add(g); return g };
  function bedAt(x, z, rot, fl, col) {
    const g = R(x, z, rot); g.position.y = fl || 0;
    box(g, 2.3, .5, 3.5, 0, .25, 0, 0x5a3a22); box(g, 2.1, .32, 3.25, 0, .66, .05, col || 0xe8eef7); box(g, 2.2, 1.4, .25, 0, .95, -1.75, 0x4a2f1c);
    box(g, .85, .22, .55, -.5, .92, -1.25, 0xffffff); box(g, .85, .22, .55, .5, .92, -1.25, 0xffffff); box(g, 2.12, .1, 1.55, 0, .86, .7, col ? 0x3b5b92 : 0x7aa2d6);
    return g;
  }
  function sleepGo() {
    if (typeof ONL !== 'undefined' && ONL) { P.hp = 100; toast('İyi uyudun (can doldu)'); return; }
    tf.textContent = 'Zzz...'; tf.style.opacity = 1;
    setTimeout(() => { try { hour = (hour + 8) % 24; } catch (e) { } P.hp = 100; tf.style.opacity = 0; toast('İyi uyudun · 8 saat geçti'); }, 1800);
  }
  const addAct = (x, z, l, go, r, fl) => PLAYS.push({ x, z, l, go, r: r || 2.3, fl: fl || 0 });
  function sofaAt(x, z, rot) { const g = R(x, z, rot); box(g, 3.6, .5, 1.3, 0, .35, 0, 0x6d4c8c); box(g, 3.6, 1, .35, 0, .95, -.55, 0x5b3d78); box(g, .35, .8, 1.3, -1.8, .6, 0, 0x5b3d78); box(g, .35, .8, 1.3, 1.8, .6, 0, 0x5b3d78); return g; }
  function tvAt(x, z, rot) { const g = R(x, z, rot); box(g, 3.2, .7, .6, 0, .35, 0, 0x2a2a30); box(g, 2.6, 1.5, .12, 0, 1.55, 0, 0x0b0b10); box(g, 2.4, 1.3, .06, 0, 1.55, .08, 0x2f6fb5, 1); return g; }
  function wardrobeAt(x, z, rot, fl) { const g = R(x, z, rot); g.position.y = fl || 0; box(g, 2.6, 3, .9, 0, 1.5, 0, 0x7a5a3a); box(g, .06, 2.6, .05, 0, 1.5, .47, 0x2b1d10); return g; }
  function kitchenAt(x, z, rot) { const g = R(x, z, rot); box(g, 5.2, 1.1, 1.1, 0, .55, 0, 0xcfd5da); box(g, 5.3, .12, 1.2, 0, 1.15, 0, 0x3a3a3f); box(g, 1.1, .12, .7, -1.5, 1.2, 0, 0x777b82); box(g, 1.4, 2.6, 1.0, 3.3, 1.3, 0, 0xe9edf0); return g; }
  function tableAt(x, z) { const g = R(x, z, 0); box(g, 2.6, .12, 1.5, 0, 1.0, 0, 0x8a5a2b); for (const dx of [-1.1, 1.1]) for (const dz of [-.55, .55]) box(g, .14, 1, .14, dx, .5, dz, 0x5a3a1c); for (const dz of [-1.2, 1.2]) for (const dx of [-.7, .7]) box(g, .5, .5, .5, dx, .25, dz, 0x9b7653); return g; }
  function plantAt(x, z, fl) { const g = R(x, z, 0); g.position.y = fl || 0; box(g, .6, .5, .6, 0, .25, 0, 0x8a4b2a); box(g, .9, 1.1, .9, 0, 1.0, 0, 0x2e8b57); return g; }
  function rugAt(x, z, w, d, col, fl) { const g = R(x, z, 0); g.position.y = (fl || 0) + .03; box(g, w, .03, d, 0, 0, 0, col); return g; }
  function lampAt(x, z, fl) { const g = R(x, z, 0); g.position.y = fl || 0; box(g, .12, 1.6, .12, 0, .8, 0, 0x333333); box(g, .6, .5, .6, 0, 1.75, 0, 0xffeeb0, 1); return g; }

  function homeRoom() {
    for (const o of ROOM.children.slice()) if (o.mats || o.parts) ROOM.remove(o);   // içeride insan yok
    DANC.length = 0;
    const two = P.home === 2;
    ROOM.add(Object.assign(new T.PointLight(0xfff0d0, .9, 36, 1.4), { position: new T.Vector3(R0X - 6, 3.6, R0Z + 3) }));
    // ortak: giriş paspası, kapı
    rugAt(0, 7.2, 3.6, 1.6, 0x8a2d2d);
    if (!two) {
      // ŞIK TEK KATLI: yatak odası batıda, salon doğuda
      bedAt(-8.5, -5.2, 0, 0, 0xf2f2f7); box(R(-11.4, -7.5), .9, .6, .9, 0, .3, 0, 0x6b4a2b); box(R(-5.6, -7.5), .9, .6, .9, 0, .3, 0, 0x6b4a2b);
      bedAt(-9, 4.2, Math.PI, 0, 0xcfe3f7);   // ikinci yatak
      wardrobeAt(-12.4, 0, Math.PI / 2); rugAt(-8.5, -1, 5, 3.2, 0x2f4f7a);
      sofaAt(6.5, 3.5, Math.PI); tvAt(6.5, 9.2, Math.PI); rugAt(6.5, 6, 5.4, 3.4, 0x3d5a40);
      kitchenAt(8, -9.2, 0); tableAt(8.5, -3.8); plantAt(-12.2, 9); plantAt(12.2, 9); lampAt(-5, 9); lampAt(12, 0);
      addAct(-8.5, -4, 'Yatağa uzan (uyu, +can)', sleepGo, 2.6); addAct(-9, 3.4, 'Yatağa uzan (uyu, +can)', sleepGo, 2.6);
      addAct(6.5, 5.3, 'TV izle (+can)', once('tv1', 25, () => heal(10)), 2.6); addAct(8.5, -3.8, 'Yemek ye (+can)', once('ml', 30, () => heal(30)), 2.4);
    } else {
      // 2 KATLI EV
      for (const o of ROOM.children.slice()) { const s = o.scale; if (o.isMesh && Math.abs(s.x - 26) < .1 && Math.abs(s.y - .3) < .05 && Math.abs(s.z - 20) < .1 && o.position.y > 4) ROOM.remove(o); }   // eski tavan
      const H = 4.7, wallC = 0xf5efe6;
      for (const [sx, sz, x, z] of [[26, .4, 0, -10], [26, .4, 0, 10], [.4, 20, -13, 0], [.4, 20, 13, 0]]) box(ROOM, sx, 4.9, sz, R0X + x, 4.6 + 2.45, R0Z + z, wallC).position.set(R0X + x, 4.6 + 2.45, R0Z + z);
      box(ROOM, 26, .3, 20, R0X, 9.5, R0Z, wallC);
      box(ROOM, 16.4, .3, 19.6, R0X - 4.9, H, R0Z, 0xb89b72);               // üst kat zemini (batı)
      box(ROOM, 16.4, .06, 19.6, R0X - 4.9, H - .17, R0Z, 0xd9d2c4);       // alt tavan
      // merdiven: kuzey duvar boyunca, x=+10.6 (alt) -> x=+3.6 (üst)
      const N = 12, runX0 = 10.6, runX1 = 3.6;
      for (let i = 0; i < N; i++) { const x = runX0 - (i + .5) * (runX0 - runX1) / N, h = (i + 1) * H / N; box(ROOM, (runX0 - runX1) / N + .02, h, 2.6, R0X + x, h / 2, R0Z - 8.0, i % 2 ? 0xc7a97e : 0xd8bc90); }
      box(ROOM, 7.2, .1, .1, R0X + 7.1, 1.4, R0Z - 6.65, 0x444a52); box(ROOM, .1, 1.2, 19.6 - 13, R0X + 3.4, H + .6, R0Z + 3.2, 0x444a52);   // korkuluk
      // üst kat ışığı
      ROOM.add(Object.assign(new T.PointLight(0xfff0d0, 1.0, 40, 1.4), { position: new T.Vector3(R0X - 5, 8.4, R0Z) }));
      // ALT KAT: salon + mutfak (doğu)
      sofaAt(7, 2.5, Math.PI); tvAt(7, 8.6, Math.PI); rugAt(7, 5, 5.4, 3.4, 0x3d5a40); kitchenAt(-6, -9.2, 0); tableAt(-6, -3.5); plantAt(-12.2, 9); plantAt(12.2, 9); lampAt(-12, 3);
      addAct(7, 4.4, 'TV izle (+can)', once('tv2', 25, () => heal(10)), 2.6); addAct(-6, -3.5, 'Yemek ye (+can)', once('ml2', 30, () => heal(30)), 2.4);
      // ÜST KAT (fl = H)
      bedAt(-9, -5, 0, H, 0xf2f2f7); bedAt(-9, 5, Math.PI, H, 0xcfe3f7); wardrobeAt(-12.4, 0, Math.PI / 2, H);
      rugAt(-5, 0, 4.4, 5, 0x2f4f7a, H); box(R(-1.8, 7.8), 2.2, .12, 1.2, 0, H + 1, 0, 0x8a5a2b); box(R(-1.8, 7.8), 1.0, .7, .1, 0, H + 1.45, -.4, 0x111111); box(R(-1.8, 7.8), 1.0, .6, .06, 0, H + 1.45, -.36, 0x4dd2ff, 1);
      plantAt(-12, 8, H); lampAt(-12, -8.8, H);
      addAct(-9, -3.8, 'Yatağa uzan (uyu, +can)', sleepGo, 2.6, H); addAct(-9, 4, 'Yatağa uzan (uyu, +can)', sleepGo, 2.6, H);
      HOME2 = 1;
    }
  }
  let HOME2 = 0;

  // kat yüksekliği (merdiven)
  setInterval(() => {
    if (!INT || INT.t !== 'home' || !HOME2 || P.home !== 2) { P.flr = 0; P.up = 0; return; }
    const rx = P.x - R0X, rz = P.z - R0Z, inS = rx >= 3.6 && rx <= 10.6 && rz >= -9.4 && rz <= -6.6;
    if (inS) { P.flr = Math.max(0, Math.min(4.7, (10.6 - rx) / 7 * 4.7)); P.up = P.flr > 2.35 ? 1 : 0; }
    else if (P.up) { P.flr = 4.7; if (rx > 3.4) P.x = R0X + 3.4; }
    else { P.flr = 0; }
  }, 33);
  // kata göre etkileşim süzgeci (üst katta çıkış/tezgâh tetiklenmesin)
  const _np = nearPl;
  nearPl = function () {
    const up = (P.flr || 0) > 2.35 ? 4.7 : 0, full = PLAYS.slice(); PLAYS.length = 0;
    for (const s of full) if ((s.fl || 0) === up) PLAYS.push(s);
    let r; try { r = _np(); } finally { PLAYS.length = 0; for (const s of full) PLAYS.push(s); }
    if (r && (P.flr || 0) > .3 && (r.go === exitInt || /alışveriş/.test(r.p || ''))) r = null;
    return r;
  };
  const _ex = exitInt;
  exitInt = function () { P.flr = 0; P.up = 0; HOME2 = 0; return _ex(); };

  /* ---- diğer mekanlar: her tür farklı iç mekân ---- */
  const FUR = {
    hastane(g, b) {
      for (let i = 0; i < 4; i++) { const x = -10 + i * 3.2; b(2, .5, 3.4, x, .45, 3.5, 0xf2f6f8); b(1.8, .22, 2.6, x, .8, 3.5, 0x7fd0e8); b(.12, 1.7, .12, x + 1.2, .85, 2.0, 0xcccccc); b(.5, .5, .1, x + 1.2, 1.9, 2.0, 0xaaddff, 1); b(2, 2.4, .08, x, 1.3, 1.7, 0xdff4ff); }
      b(1.4, 1, 1, 8, .5, 5, 0x9aa4ad); b(.5, 1.2, .5, 9.5, .9, 4.5, 0xdd2222);
    },
    karakol(g, b) {
      for (let i = 0; i < 3; i++) { b(.1, 3, 3.2, 9 + 0, 1.5, -3 + i * 3.4, 0x3a3f47); for (let k = 0; k < 7; k++) b(.06, 2.8, .06, 9 + .0, 1.4, -4.4 + i * 3.4 + k * .46, 0x9aa0a8); }
      b(2.4, .8, 1.2, -9, .4, 4, 0x555b66); b(2.4, .8, 1.2, -5.5, .4, 4, 0x555b66); b(3, 2, .1, -9, 2.6, -9.6, 0xf2f2f2); b(2.6, 1.6, .1, -9, 2.6, -9.55, 0xff4d4d, 1);
    },
    banka(g, b) {
      const m = new T.Mesh(new T.CylinderGeometry(1.8, 1.8, .6, 20), matL(0xaaaaaa)); m.rotation.x = Math.PI / 2; m.position.set(R0X + 9, 1.8, R0Z - 9.4); ROOM.add(m);
      for (const x of [-6, -2, 2, 6]) { b(.1, 1.2, 1.4, x, 1.7, -4.2, 0xbfe3ff); b(1.4, .12, 1, x, 1.15, -4.2, 0x33363d); }
      b(9, .08, 2, 0, .06, 7, 0x8a1f1f);
    },
    otel(g, b) {
      for (let i = 0; i < 3; i++) { b(2.8, 1, 1.2, -9 + i * 4.2, .5, 6, 0xb8864b); b(2.6, .5, 1, -9 + i * 4.2, 1.2, 6, 0xe8d7b0); }
      b(1.6, 1.4, 1, 9, .7, 5, 0x7a5a2a); b(3, .8, .6, 9, 2.6, -9.5, 0xffd24d, 1);
    },
    sinema(g, b) {
      b(14, 6, .3, 0, 2.9, -9.55, 0xf4f4f4); b(14.4, 6.4, .2, 0, 2.9, -9.7, 0x111111);
      for (let r = 0; r < 4; r++) for (let i = -4; i <= 4; i++) { if (Math.abs(i) < 1 && false) continue; b(1.1, .9, .9, i * 1.6, .45 + r * .08, -2 + r * 2.3, r % 2 ? 0x8b1a1a : 0x6a1010); b(1.1, .8, .2, i * 1.6, 1.0 + r * .08, -1.55 + r * 2.3, 0x6a1010); }
    },
    bowling(g, b) {
      for (let l = 0; l < 3; l++) { b(2.2, .06, 14, -7 + l * 7, .05, -2, 0xd8a65c); b(.4, .12, 14, -8.4 + l * 7, .1, -2, 0x222222); for (let i = 0; i < 6; i++) b(.28, .7, .28, -7 + l * 7 + (i % 3 - 1) * .55, .4, -8.3 + (i / 3 | 0) * .5, 0xffffff); }
    },
    berber(g, b) {
      for (let i = 0; i < 3; i++) { b(1.2, .5, 1.2, -9 + i * 3.4, .5, 3, 0x1b1b1f); b(1.2, 1.3, .3, -9 + i * 3.4, 1.15, 3.55, 0x1b1b1f); b(2.2, 2.4, .1, -9 + i * 3.4, 2.4, -9.6, 0xcfefff, 1); }
      b(.5, 2.2, .5, 11, 1.1, -8.5, 0xe8e8e8); b(.52, .5, .52, 11, .8, -8.5, 0xd62828); b(.52, .5, .52, 11, 1.6, -8.5, 0x2850d6);
    },
    kutuphane(g, b) {
      for (let i = 0; i < 4; i++) { b(.6, 4, 12, -10.8 + i * 5.2, 2, 0, 0x5a3b22); for (let k = 0; k < 6; k++) b(.5, .5, 11, -10.8 + i * 5.2 + .02, .6 + k * .65, 0, [0xc0392b, 0x2980b9, 0x27ae60, 0xf1c40f][(i + k) % 4]); }
    },
    muze(g, b) {
      for (let i = 0; i < 5; i++) { b(1.4, 1.1, 1.4, -10 + i * 5, .55, 2 - (i % 2) * 5, 0xd9d3c3); b(.8, 1.8, .8, -10 + i * 5, 2, 2 - (i % 2) * 5, [0xb08d57, 0x8fa3b0, 0xc9a0a0][i % 3]); }
    },
    arcade(g, b) {
      for (let i = 0; i < 6; i++) { const x = -10 + i * 4; b(1.4, 2.4, 1.2, x, 1.2, -8.8, 0x1a1a2a); b(1.1, .9, .1, x, 1.7, -8.15, [0xff2fa8, 0x00d4ff, 0xffd23c][i % 3], 1); b(1.4, 2.4, 1.2, x, 1.2, 4, 0x1a1a2a); b(1.1, .9, .1, x, 1.7, 3.35, [0x00d4ff, 0xff2fa8, 0x7bff5a][i % 3], 1); }
    },
    havuz(g, b) {
      b(14, .1, 9, 0, .02, 1, 0x4dc8ff, 1); b(14.6, .3, .4, 0, .15, -3.4, 0xe8e8e8); b(14.6, .3, .4, 0, .15, 5.4, 0xe8e8e8);
      for (let i = 0; i < 3; i++) b(.1, .8, 1.2, -4 + i * 4, .4, -7.6, 0xe8e8e8);
    },
    firin(g, b) {
      for (let i = 0; i < 3; i++) { b(2.6, 2.2, 1.6, -9 + i * 3.4, 1.1, -8.9, 0x6b4a2b); b(2, .9, .1, -9 + i * 3.4, 1.2, -8.05, 0xff8a3d, 1); }
      for (let i = 0; i < 4; i++) { b(2.2, 1.1, .8, 3 + i * 2.4, .55, 3, 0x8a5a2b); b(1.9, .4, .6, 3 + i * 2.4, 1.3, 3, [0xe8b86d, 0xd9a05b][i % 2]); }
    },
    cicekci(g, b) {
      for (let i = 0; i < 7; i++) { b(.8, .6, .8, -9 + i * 3, .3, -8.4, 0x8a4b2a); b(.9, .9, .9, -9 + i * 3, 1.0, -8.4, [0xff7aa8, 0xffd24d, 0xff5d5d, 0xb04dff][i % 4]); }
      b(5, .08, 3, 6, .04, 3, 0x2e8b57);
    },
    kuyumcu(g, b) {
      for (let i = 0; i < 4; i++) { b(2.4, 1.1, 1.2, -9 + i * 5.5, .55, 2, 0x222222); b(2.4, .9, 1.2, -9 + i * 5.5, 1.5, 2, 0xcfefff, 1); b(.4, .3, .4, -9 + i * 5.5, 2.1, 2, 0xffe14d, 1); }
    },
    telefon(g, b) {
      for (let i = 0; i < 5; i++) { b(1.8, 1.2, .9, -9 + i * 4.4, .6, 4, 0xe9edf0); b(1.2, .1, .6, -9 + i * 4.4, 1.3, 4, 0x222833); }
    },
    dovme(g, b) {
      b(2.6, .7, 1.6, -7, .35, 3, 0x1b1b1f); b(2, .5, 1.2, -7, .8, 3, 0x7a1010); for (let i = 0; i < 6; i++) b(1.4, 1.8, .06, -10 + i * 4, 2.8, -9.7, [0xff5d5d, 0xffd24d, 0x4dd2ff][i % 3], 1);
    },
    itfaiye(g, b) {
      b(5, 3, 8, -6, 1.5, -2, 0xc92a2a); b(3.6, 1.6, .2, -6, 2.3, 2.0, 0xdfeaf2); b(1.2, 1, 1.2, 8, .5, 4, 0x7a7a7a); for (let i = 0; i < 4; i++) b(.18, 3.4, .18, 10 + i * .1, 1.7, -8.8 + i * 1.2, 0xffcc00);
    },
    petshop(g, b) {
      for (let i = 0; i < 5; i++) { b(2, 1.2, 1.5, -9 + i * 4.4, .6, -8.4, 0x9ab0c2); b(1.6, .8, 1.2, -9 + i * 4.4, 1.5, -8.4, 0xdff0ff, 1); } b(4, .2, 3, 6, .1, 3, 0xd8a65c);
    },
    dondurma(g, b) {
      for (let i = 0; i < 4; i++) { b(2.2, 1.2, 1.2, -9 + i * 3.4, .6, -5.9, 0xffffff); b(1.6, .5, .9, -9 + i * 3.4, 1.35, -5.9, [0xffb3d9, 0xffe6a8, 0xb5e3ff, 0xc7f5c4][i]); }
    }
  };
  function varyRoom(t) {
    const rr = rng(hashS(t)), pick = a => a[rr() * a.length | 0];
    const floors = [0x9a9ca4, 0xb59f82, 0x7f8c99, 0xa4b09a, 0xc4b4a0, 0x6d737d, 0x8f7f94], walls = [0xf3e3cf, 0xe3ecf4, 0xf0e6f5, 0xe8f2e6, 0xf6ecd2, 0xdfe6ea];
    const wallC = (typeof RC !== 'undefined' && RC[t]) ? RC[t][0] : 0xdddddd;
    for (const o of ROOM.children) {
      const s = o.scale; if (!o.isMesh) continue;
      if (t !== 'club' && Math.abs(s.x - 26) < .1 && Math.abs(s.y - .2) < .05 && Math.abs(s.z - 20) < .1) o.material = matL(pick(floors));
      else if (!(t in { casino: 1, club: 1, ammu: 1, mod: 1, garage: 1, galeri: 1 }) && Math.abs(s.y - 4.5) < .05 && (Math.abs(s.x - 26) < .1 || Math.abs(s.z - 20) < .1)) o.material = matL(wallC === 0xdfe6e9 || wallC === 0xeeeeee ? pick(walls) : wallC);
    }
    const b = (sx, sy, sz, x, y, z, col, em) => { const m = box(ROOM, sx, sy, sz, R0X + x, y, R0Z + z, col, em); return m; };
    if (FUR[t]) FUR[t](null, b);
    else {   // genel: türe özel rastgele (sabit tohumlu) düzen
      const n = 3 + (rr() * 4 | 0), col = pick([0x8a5a2b, 0x6d6f78, 0x4d7a8a, 0x7a4d8a, 0x8a7a4d]);
      for (let i = 0; i < n; i++) { const x = -10 + i * (20 / n) + rr() * 2; b(1.6 + rr(), 1.2 + rr() * 1.2, 1.2 + rr(), x, .7, rr() < .5 ? -7.6 : 6, col); }
      b(2 + rr() * 3, .1, 2 + rr() * 3, -3 + rr() * 6, .07, 1 + rr() * 3, pick([0xa83232, 0x2e6fa8, 0x3a8a5a]));
    }
  }
  const _bR = buildRoom;
  buildRoom = function (t) {
    _bR(t); HOME2 = 0;
    try { if (t === 'home') homeRoom(); else varyRoom(t); } catch (e) { console.warn('v6 room', e); }
  };

  /* ---- dış cephe: her mekan türüne özel çatı/ön detay ---- */
  const EXT = {
    hastane(g, w, h, d, y) { const m = matB(0xdd1111); const a = new T.Mesh(gb(), m); a.scale.set(6, .6, 1.8); a.position.set(0, y + .4, 0); g.add(a); const c = new T.Mesh(gb(), m); c.scale.set(1.8, .6, 6); c.position.set(0, y + .4, 0); g.add(c); const hp = new T.Mesh(new T.CylinderGeometry(4, 4, .2, 20), matL(0x555a62)); hp.position.set(w * .22, y + .2, d * .22); g.add(hp); },
    karakol(g, w, h, d, y) { const p = new T.Mesh(new T.CylinderGeometry(.12, .12, 8, 6), matL(0xcccccc)); p.position.set(w * .3, y + 4, 0); g.add(p); const f = new T.Mesh(gb(), matB(0x2850d6)); f.scale.set(2.4, 1.4, .1); f.position.set(w * .3 + 1.3, y + 7, 0); g.add(f); for (const s of [-1, 1]) { const l = new T.Mesh(gb(), matB(s < 0 ? 0xff2222 : 0x2244ff)); l.scale.set(1.4, .5, .6); l.position.set(s * 1.2, y + .5, d * .3); g.add(l); } },
    banka(g, w, h, d, y) { const dome = new T.Mesh(new T.SphereGeometry(Math.min(w, d) * .22, 14, 8, 0, 6.3, 0, 1.57), matL(0xd4c27a)); dome.position.set(0, y, 0); g.add(dome); },
    otel(g, w, h, d, y) { const s = new T.Mesh(gb(), matB(0xffd24d)); s.scale.set(w * .5, 3, .6); s.position.set(0, y + 2.4, d * .4); g.add(s); const p = new T.Mesh(gb(), matB(0x4dc8ff)); p.scale.set(w * .35, .3, d * .3); p.position.set(-w * .2, y + .4, -d * .2); g.add(p); },
    sinema(g, w, h, d, y) { const s = new T.Mesh(gb(), matB(0xb04dff)); s.scale.set(w * .7, 5, .5); s.position.set(0, y + 3.5, d * .42); g.add(s); },
    bowling(g, w, h, d, y) { const pin = new T.Mesh(new T.CylinderGeometry(1.1, 1.6, 6, 10), matL(0xffffff)); pin.position.set(0, y + 3.2, 0); g.add(pin); const hd = new T.Mesh(new T.SphereGeometry(1.1, 10, 8), matL(0xffffff)); hd.position.set(0, y + 7, 0); g.add(hd); const st = new T.Mesh(new T.CylinderGeometry(1.15, 1.15, .5, 10), matL(0xdd2222)); st.position.set(0, y + 4.6, 0); g.add(st); },
    berber(g, w, h, d, y) { for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.CylinderGeometry(.9, .9, .7, 10), matL(i % 2 ? 0xd62828 : 0xffffff)); r.position.set(w * .3, y + 1 + i * .7, d * .3); g.add(r); } },
    benzinlik(g, w, h, d, y) { const c = new T.Mesh(gb(), matL(0xffd24d)); c.scale.set(w * .9, .5, 7); c.position.set(0, y - h + 5.2, d * .7); g.add(c); for (const s of [-1, 1]) { const p = new T.Mesh(gb(), matL(0x777777)); p.scale.set(.5, 5, .5); p.position.set(s * w * .4, y - h + 2.7, d * .75); g.add(p); } },
    kutuphane(g, w, h, d, y) { const t = new T.Mesh(new T.CylinderGeometry(0, Math.min(w, d) * .55, 4, 3), matL(0xc49a6c)); t.position.set(0, y + 2, d * .3); t.rotation.y = 0; g.add(t); },
    muze(g, w, h, d, y) { for (let i = -2; i <= 2; i++) { const c = new T.Mesh(new T.CylinderGeometry(.6, .6, h * .8, 8), matL(0xece4cf)); c.position.set(i * w * .18, y - h * .45, d * .5 + 1); g.add(c); } },
    arcade(g, w, h, d, y) { const r = new T.Mesh(new T.TorusGeometry(Math.min(w, d) * .25, .4, 8, 20), matB(0xff4dc8)); r.position.set(0, y + 5, 0); g.add(r); },
    havuz(g, w, h, d, y) { const s = new T.Mesh(new T.TorusGeometry(3, .5, 6, 12, 3.14), matL(0x4dd2ff)); s.position.set(w * .25, y + 3, 0); g.add(s); },
    firin(g, w, h, d, y) { const c = new T.Mesh(gb(), matL(0x8a4b2a)); c.scale.set(2.2, 6, 2.2); c.position.set(w * .3, y + 3, -d * .2); g.add(c); },
    cicekci(g, w, h, d, y) { for (let i = 0; i < 5; i++) { const p = new T.Mesh(gb(), matL([0xff7aa8, 0xffd24d, 0xff5d5d][i % 3])); p.scale.set(1.3, 1.3, 1.3); p.position.set(-w * .35 + i * w * .18, y + .7, d * .35); g.add(p); } },
    kuyumcu(g, w, h, d, y) { const m = new T.Mesh(new T.OctahedronGeometry(2.2), matB(0x9be8ff)); m.position.set(0, y + 3.5, 0); g.add(m); },
    itfaiye(g, w, h, d, y) { const t = new T.Mesh(gb(), matL(0xc92a2a)); t.scale.set(3, 12, 3); t.position.set(w * .35, y + 5, -d * .3); g.add(t); },
    petshop(g, w, h, d, y) { const m = new T.Mesh(new T.ConeGeometry(2.4, 3, 4), matL(0xa8d45a)); m.position.set(0, y + 1.8, 0); g.add(m); },
    dondurma(g, w, h, d, y) { const c = new T.Mesh(new T.ConeGeometry(1.8, 5, 8), matL(0xe8b86d)); c.rotation.x = Math.PI; c.position.set(0, y + 3, 0); g.add(c); const s = new T.Mesh(new T.SphereGeometry(1.9, 10, 8), matL(0xffb3d9)); s.position.set(0, y + 6.2, 0); g.add(s); }
  };
  function decorateExteriors() {
    const done = new Set();
    for (const p of PLC) {
      const g = scene.children.find(o => o.isGroup && Math.abs(o.position.x - p.x) < .02 && Math.abs(o.position.z - p.z) < .02 && o.children.length > 3 && !done.has(o));
      if (!g) continue; done.add(g);
      const bm = g.children[0]; if (!bm || !bm.scale) continue;
      const w = bm.scale.x, h = bm.scale.y, d = bm.scale.z, y = h + .9, rr = rng(hashS(p.t + p.n));
      try {
        if (EXT[p.t]) EXT[p.t](g, w, h, d, y);
        else {   // genel: türe özel antenli/depolu çatı
          const k = (hashS(p.t) % 3);
          if (k === 0) { const m = new T.Mesh(new T.CylinderGeometry(.15, .15, 7, 5), matL(0xcccccc)); m.position.set((rr() - .5) * w * .5, y + 3.5, 0); g.add(m); }
          else if (k === 1) { const m = new T.Mesh(new T.CylinderGeometry(1.8, 1.8, 3, 10), matL(0x8a6a4a)); m.position.set((rr() - .5) * w * .5, y + 1.5, (rr() - .5) * d * .4); g.add(m); }
          else { const m = new T.Mesh(new T.ConeGeometry(Math.min(w, d) * .5, 3.5, 4), matL(0x9a5a3a)); m.position.set(0, y + 1.8, 0); m.rotation.y = .785; g.add(m); }
        }
      } catch (e) { console.warn('ext', p.t, e); }
      g.traverse(o => { o.userData.ns = 1; });
      g.updateMatrixWorld(true); g.traverse(o => { o.matrixAutoUpdate = false; });   // sabit: her karede matris hesaplanmaz (FPS)
    }
  }
  setTimeout(() => { try { decorateExteriors(); } catch (e) { console.warn('ext', e); } }, 1200);
})();
