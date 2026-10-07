/* GTA 67 v7 (v6.js'ten SONRA yüklenir)
   1) DÜKKAN SOYGUNU: iç mekanda kasiyere silah doğrult + ATEŞ -> kasadan para. Tanık olursa polis çağrılır.
   2) Silahlar GLB (GunPack Vol.1: Uzi, Av tüfeği, Bazuka; AK-47 silahçı duvarında)
   3) Dükkan girişlerine Kenney tente, kafe/lokantaya şemsiye (City Kit Commercial, CC0) */
(() => {
  const tryF = f => { try { return f() } catch (e) { } };
  const rr = (a, b) => a + Math.random() * (b - a);
  let T7 = 0, lastN = performance.now();

  /* ================= modeller ================= */
  const G7 = {};
  const cl = (k, s) => {
    const g = G7[k].clone(true); g.scale.setScalar(s);
    g.traverse(o => { o.userData.ns = 1; if (o.isMesh) { o.castShadow = false; o.receiveShadow = false } });
    return g;
  };
  function loadAll() {
    if (typeof gl === 'undefined' || !gl || !window.MB7) return;
    let left = Object.keys(MB7).length;
    const done = () => { if (--left === 0) { storefronts(); hIdx = -9 } };
    for (const k in MB7) tryF(() => gl.parse(b64(MB7[k]), '', g => { G7[k] = g.scene; done() }, e => { console.warn('GLB7', k, e); done() })) ;
  }

  /* ================= elde silah (GLB) ================= */
  const dark = new T.MeshLambertMaterial({ color: 0x1d1f24 }), grey = new T.MeshLambertMaterial({ color: 0x3a3d44 });
  function pistol() {
    const g = new T.Group();
    const sl = new T.Mesh(new T.BoxGeometry(.045, .07, .2), dark); sl.position.set(0, .09, .02);
    const gr = new T.Mesh(new T.BoxGeometry(.04, .12, .05), grey); gr.position.set(0, .01, -.05); gr.rotation.x = .2;
    g.add(sl, gr); return g;
  }
  const GL = { 1: ['uzi', .38], 2: ['rifle', 1.15], 3: ['rpg', 1.0] };   // WP indeksi -> model, uzunluk
  let hGun = null, hIdx = -9;
  function syncHand() {
    const m = P.mesh; if (!m || !m.elb) return;
    const idx = (P.own && P.own[P.wep]) ? P.wep : -1, holder = m.elb[1];
    if (idx === hIdx && hGun && hGun.parent === holder) return;
    if (idx === hIdx && idx < 0) return;
    if (hGun && hGun.parent) hGun.parent.remove(hGun);
    hGun = null; hIdx = idx; if (idx < 0) return;
    let g, len = .2;
    if (idx === 0) g = pistol();
    else { const q = GL[idx]; if (!q || !G7[q[0]]) { hIdx = -9; return } g = cl(q[0], 1); len = q[1] }
    const w = new T.Group(); w.add(g); w.rotation.x = Math.PI / 2; w.position.set(0, -.46 - .15 * len, 0);
    w.traverse(o => { o.userData.ns = 1 });
    holder.add(w); hGun = w;
  }
  const hands = (m, on) => {
    if (!m || !m.parts) return;
    m.parts[2].rotation.x = m.parts[3].rotation.x = on ? -2.9 : 0;
    if (m.elb) m.elb[0].rotation.x = m.elb[1].rotation.x = on ? -.25 : 0;
  };
  function pose() {
    const m = P.mesh; if (!m || !m.parts || !m.elb || P.car || !hGun) return;
    const aim = ((B.fire || K.Space) && mode === 'play') || (ROB && ROB.st === 'run');
    if (!aim) return;
    m.parts[3].rotation.x = -1.5; m.elb[1].rotation.x = -.15;
    if (hIdx >= 1) { m.parts[2].rotation.x = -1.25; m.elb[0].rotation.x = -.35 }
  }

  /* ================= dükkan girişleri: Kenney tente + şemsiye ================= */
  function storefronts() {
    if (!G7.awningw || typeof PLC === 'undefined') return;
    const AW = { market: 1, ammu: 1, clothes: 1, food: 1, cafe: 1, pharm: 1, mod: 1, emlak: 1 };
    for (const p of PLC) {
      if (!AW[p.t] || p.dx == null || p.sf) continue; p.sf = 1;
      const ox = p.dx - p.x, oz = p.dz - p.z; let nx = 0, nz = 0;
      if (Math.abs(oz) >= Math.abs(ox)) nz = Math.sign(oz) || 1; else nx = Math.sign(ox) || 1;
      const fx = p.dx - nx * 3.6, fz = p.dz - nz * 3.6;
      const g = cl('awningw', 4.6); g.position.set(fx, 3.2, fz); g.rotation.y = Math.atan2(nx, nz); scene.add(g);
      if ((p.t === 'cafe' || p.t === 'food') && G7.parasolA && G7.parasolB) {
        for (const s of [-1, 1]) {
          const u = cl(s < 0 ? 'parasolA' : 'parasolB', 7);
          u.position.set(fx + nx * 4.8 + (-nz) * s * 5.2, .4, fz + nz * 4.8 + nx * s * 5.2); scene.add(u);
        }
      }
    }
  }

  /* ================= SOYGUN ================= */
  const LOOT = { market: [250, 650, .2], food: [180, 420, .15], clothes: [300, 720, .15], cafe: [200, 460, .12], pharm: [350, 800, .2], ammu: [600, 1500, .3] };
  const LINES = ['Tamam tamam, vurma!', 'Al paranı, ateş etme!', 'Lütfen... kasa burada!', 'Yapma, çocuklarım var!'];
  let CLERK = null, CUST = [], REG = null, ROB = null, PEND = null, CALLED = 0, lastMsg = -9;
  const ROBBED = {};

  function wallGuns() {
    const spots = [['uzi', -9, 2.5, 1.9], ['ak47', -6.2, 2.5, 1.5], ['rifle', -7.6, 3.5, 1.3], ['rpg', 6.6, 3.5, 1.4], ['ak47', 6.2, 2.5, 1.5], ['uzi', 9, 2.5, 1.9], ['rifle', 8.6, 3.5, 1.3]];
    for (const [k, x, y, s] of spots) {
      if (!G7[k]) continue;
      const g = cl(k, s); g.rotation.y = Math.PI / 2; g.position.set(R0X + x, y, R0Z - 9.55); ROOM.add(g);
    }
  }
  function setup7(t) {
    CLERK = null; CUST = []; REG = null; ROB = null;
    if (!LOOT[t]) return;
    CLERK = ROOM.children.find(o => o.parts && Math.abs(o.position.x - R0X) < .2 && Math.abs(o.position.z - (R0Z - 6.9)) < .2) || null;
    if (!CLERK) return;
    CLERK.userData = CLERK.userData || {};
    /* kasa */
    const reg = new T.Group(); reg.position.set(R0X + 2.8, 1.2, R0Z - 5.3);
    const mat = c => new T.MeshLambertMaterial({ color: c });
    const body = new T.Mesh(new T.BoxGeometry(.8, .35, .55), mat(0x2a2f38)); body.position.y = .18;
    const scr = new T.Mesh(new T.BoxGeometry(.5, .24, .05), new T.MeshBasicMaterial({ color: 0x57ff8a })); scr.position.set(0, .5, -.2); scr.rotation.x = -.35;
    const drawer = new T.Mesh(new T.BoxGeometry(.7, .1, .45), mat(0x6b7280)); drawer.position.set(0, .1, .02);
    const bills = new T.Mesh(new T.BoxGeometry(.55, .05, .3), mat(0x3fa34d)); bills.position.set(0, .2, .02); bills.visible = false;
    reg.add(body, scr, drawer, bills); ROOM.add(reg); REG = { drawer, bills, open: null };
    /* müşteriler = tanık */
    const n = Math.random() < .45 ? 0 : (Math.random() < .75 ? 1 : 2);
    const tops = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400'], sk = ['#f1c27d', '#c68642', '#8d5524', '#ffdbac'];
    for (let i = 0; i < n; i++) {
      const q = mkPed(tops[Math.random() * 5 | 0], '#2c3e50', sk[Math.random() * 4 | 0], '#2a1c10', '#111');
      q.position.set(R0X + rr(-8, 8), 0, R0Z + rr(-1, 5)); q.rotation.y = Math.PI; q.userData = q.userData || {}; ROOM.add(q); CUST.push(q);
    }
    if (t === 'ammu') wallGuns();
    const key = INT && INT.n;
    if (key && ROBBED[key] != null && T7 - ROBBED[key] < 240) { CLERK.userData.done = 1; CLERK.scale.y = .8 }
  }

  /* --- polis çağırma --- */
  function schedule(why, delay) { const at = T7 + delay; if (!PEND || at < PEND.at) PEND = { at, why } }
  function spawnCopsAt(x, z, n, a, b) {
    let made = 0;
    for (let i = 0; i < 80 && made < n; i++) {
      const r = roads[Math.random() * roads.length | 0], t = r.a0 + 8 + Math.random() * (r.a1 - r.a0 - 16),
        px = r.ax === 'z' ? r.c : t, pz = r.ax === 'z' ? t : r.c, d = Math.hypot(px - x, pz - z);
      if (d > a && d < b && (typeof walk !== 'function' || walk(px, pz))) {
        const c = mkCar(4, '#f4f4f4', px, pz, Math.atan2(x - px, z - pz)); c.ai = 0; made++;
      }
    }
    return made;
  }
  function pendTick() {
    if (!PEND || T7 < PEND.at) return;
    const why = PEND.why; PEND = null;
    heat(65); toast(why + ' Polis yolda!');
    tryF(() => { tone(740, .25, 'square', .06); setTimeout(() => tone(560, .25, 'square', .06), 260) });
    if (INT) CALLED = 1; else spawnCopsAt(P.x, P.z, 2, 40, 90);
  }

  /* --- soygun akışı --- */
  function startRob(d) {
    const key = INT.n, last = ROBBED[key];
    if (last != null && T7 - last < 240) { if (T7 - lastMsg > 2.5) { lastMsg = T7; toast('Kasa az önce boşaltıldı') } return }
    const L = LOOT[INT.t], dur = [5.2, 3.6, 4.2, 2.8][P.wep] || 5;
    ROB = { st: 'run', p: 0, dur, key, loot: Math.round(rr(L[0], L[1]) / 5) * 5, al: Math.random() < L[2] ? rr(.3, .8) : 9, alOn: 0 };
    P.a = Math.atan2(CLERK.position.x - P.x, CLERK.position.z - P.z);
    CLERK.userData.hu = 1; for (const c of CUST) c.userData.hu = 1;
    toast('Kasiyer: ' + LINES[Math.random() * LINES.length | 0]);
    tryF(() => tone(220, .25, 'sawtooth', .06));
    if (CUST.length && CUST.some(() => Math.random() < .85)) schedule('Müşteri polisi aradı!', rr(2.5, 5.5));
  }
  function stopHands() { if (!CLERK) return; CLERK.userData.hu = 0; hands(CLERK, 0); for (const c of CUST) { c.userData.hu = 0; hands(c, 0) } }
  function finishRob() {
    const R = ROB, loot = R.loot; P.money += loot; ROBBED[R.key] = T7;
    if (REG) REG.open = T7;
    toast('SOYGUN BAŞARILI  +$' + loot);
    tryF(() => { tone(660, .15, 'triangle', .08); setTimeout(() => tone(990, .2, 'triangle', .08), 130) });
    let n = 0, cop = 0;
    for (const p of peds) { if (p.dead) continue; const d = Math.hypot(p.x - INT.rx, p.z - INT.rz); if (p.cop) { if (d < 25) cop++ } else if (d < 22) n++ }
    if (cop) schedule('Bir polis memuru seni gördü!', .8);
    else if (n > 0 && Math.random() < 1 - Math.pow(.6, n)) schedule('Dışarıdaki bir tanık polisi aradı!', rr(3, 7));
    ROB = { st: 'done', t: T7 }; CLERK.userData.done = 1;
  }
  function robTick(dt) {
    if (mode !== 'play' || !INT || !CLERK) { if (ROB && !INT) ROB = null; return }
    const q = CLERK.position, dx = q.x - P.x, dz = q.z - P.z, d = Math.hypot(dx, dz);
    if (CLERK.userData.hu) hands(CLERK, 1);
    for (const c of CUST) if (c.userData.hu) { hands(c, 1) }
    if (REG && REG.open != null) {
      const k = Math.min(1, (T7 - REG.open) / .5); REG.drawer.position.z = .02 + k * .4;
      REG.bills.visible = (T7 - REG.open) < 1.2; REG.bills.position.z = .02 + k * .4;
    }
    if (!ROB) {
      if ((B.fire || K.Space) && P.own && P.own[P.wep] && LOOT[INT.t] && d < 8 && !CLERK.userData.done) {
        let da = Math.atan2(dx, dz) - P.a; da = ((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        if (Math.abs(da) < 1.4) startRob(d);
      }
      return;
    }
    if (ROB.st === 'done') { if (T7 - ROB.t > 2) { stopHands(); CLERK.scale.y = .8; ROB = null } return }
    if (d > 10 || P.hp <= 0 || !(P.own && P.own[P.wep])) { stopHands(); ROB = null; toast('Soygun yarıda kaldı'); return }
    P.a = Math.atan2(dx, dz);
    ROB.p += dt / ROB.dur;
    if (!ROB.alOn && ROB.p >= ROB.al) { ROB.alOn = 1; toast('Kasiyer sessiz alarmı çaldı!'); schedule('Sessiz alarm!', 1.5) }
    if (ROB.p >= 1) finishRob();
  }

  /* --- HUD --- */
  const el = document.createElement('div');
  el.id = 'rob7';
  el.style.cssText = 'position:fixed;left:50%;bottom:calc(30% + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:5;pointer-events:none;text-align:center;font:700 20px Rajdhani,sans-serif;color:#fff;text-shadow:0 2px 6px #000;display:none;white-space:nowrap';
  el.innerHTML = '<div id="rob7t"></div><div id="rob7b" style="width:min(60vw,260px);height:12px;margin:6px auto 0;background:#0008;border:2px solid #fff;border-radius:6px;overflow:hidden"><i id="rob7f" style="display:block;height:100%;width:0;background:#ff3b5c"></i></div>';
  document.body.appendChild(el);
  const elT = el.querySelector('#rob7t'), elB = el.querySelector('#rob7b'), elF = el.querySelector('#rob7f');
  function hudTick() {
    let txt = '', bar = -1;
    if (mode === 'play' && INT && CLERK) {
      if (ROB && ROB.st === 'run') { txt = 'SOYGUN  %' + Math.min(100, ROB.p * 100 | 0); bar = ROB.p }
      else if (ROB && ROB.st === 'done') txt = 'Soygun tamam, çık!';
      else if (!CLERK.userData.done && LOOT[INT.t] && P.own && P.own[P.wep] && Math.hypot(CLERK.position.x - P.x, CLERK.position.z - P.z) < 8) txt = 'Silahı kasiyere doğrult + ATEŞ = SOYGUN';
      if (CALLED) txt += (txt ? '\n' : '') + 'POLİS DIŞARIDA BEKLİYOR';
    }
    if (!txt) { if (el.style.display !== 'none') el.style.display = 'none'; return }
    el.style.display = 'block'; elT.textContent = txt; elT.style.whiteSpace = 'pre-line';
    elB.style.display = bar >= 0 ? 'block' : 'none'; if (bar >= 0) elF.style.width = (bar * 100).toFixed(0) + '%';
  }

  /* ================= kancalar ================= */
  const _bR = buildRoom;
  buildRoom = function (t) { _bR.apply(this, arguments); try { setup7(t) } catch (e) { console.warn('v7 room', e) } };
  const _ex7 = exitInt;
  exitInt = function () {
    const d = INT ? { x: INT.rx, z: INT.rz } : null, r = _ex7.apply(this, arguments);
    try {
      ROB = null; CLERK = null; CUST = []; REG = null;
      if (CALLED && d) { CALLED = 0; const n = spawnCopsAt(d.x, d.z, 3, 26, 60); heat(0); toast(n ? 'Polis seni bekliyordu!' : 'Polis yolda!') }
    } catch (e) { console.warn('v7 exit', e) }
    return r;
  };
  const _st7 = step;
  step = function (now) {
    _st7(now);
    try {
      const n = performance.now(), dt = Math.min(.1, (n - lastN) / 1000 || 0); lastN = n; T7 += dt;
      syncHand(); pendTick(); robTick(dt);
      if (INT && CALLED) P.heat = Math.max(P.heat, 61);
      pose(); hudTick();
    } catch (e) { if (!step.w) { step.w = 1; console.warn('v7', e) } }
  };

  loadAll();
  setInterval(() => tryF(storefronts), 4000);
})();
