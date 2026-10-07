/* GTA 67 v11 (v10.js'ten SONRA)
   1) Ust mesaj alani: toast + sohbet satirlari ekranin ortasi yerine ustte kayar (game.js toast/chm buraya yonlenir)
   2) Gercek ucus: helikopter + ucak (yukseklik tuslari, bina carpismasi, inis/kalkis), havalimani + helipad
   3) Otobus duragi: duraga gel, hedef sec, otobus gelir, bin, hedef durakta in */
(() => {
  const tryF = f => { try { return f(); } catch (e) { console.warn('v11', e); return null; } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const addCss = t => { const s = document.createElement('style'); s.textContent = t; document.head.appendChild(s); };
  addCss(`
#feed{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 42px);z-index:28;width:min(76vw,430px);display:flex;flex-direction:column;gap:3px;pointer-events:none}
#feed .fl{background:#000b;border-left:4px solid #ffd23c;border-radius:6px;padding:3px 9px;color:#fff;font:700 14px/1.2 Rajdhani,sans-serif;text-shadow:0 1px 2px #000;opacity:0;transform:translateY(-6px);transition:opacity .25s,transform .25s;word-break:break-word}
#mqh[style*="display: block"] ~ #feed{top:calc(env(safe-area-inset-top,0px) + 104px)}
#feed .fl.on{opacity:1;transform:none}#feed .fl.c{border-color:#4dd2ff;background:#06121cdd}#feed .fl.off{opacity:0;transform:translateY(-6px)}
#flb{position:absolute;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(170px + env(safe-area-inset-bottom,0px));display:none;flex-direction:column;gap:8px;z-index:27;pointer-events:auto}
#flb button{width:62px;height:56px;border-radius:14px;border:2px solid #fff;background:#0a2a4acc;color:#fff;font:700 13px Rajdhani,sans-serif;touch-action:none;line-height:1.05}#flb button b{display:block;font-size:22px}#flb button.on{background:#27ae60}
#fi{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:27;display:none;background:#000b;border:2px solid #4dd2ff;border-radius:10px;padding:3px 12px;color:#fff;font:700 15px Rajdhani,sans-serif;white-space:nowrap;pointer-events:none}#fi b{color:#4dd2ff}#fi i{font-style:normal;color:#ffd23c}
#busd{z-index:76;gap:8px}#busd .nb{width:min(90vw,440px);background:#12142acc;border:3px solid #4af;border-radius:14px;padding:12px;color:#fff;font:600 16px Rajdhani,sans-serif}
#busd h3{margin:0 0 6px;font:400 22px Bungee,sans-serif;color:#4af}#busd .ls{max-height:48vh;overflow-y:auto;display:flex;flex-direction:column;gap:5px;margin:6px 0}
#busd .ls button{background:#1d2540;border:2px solid #4a6fa0;border-radius:10px;color:#fff;padding:7px 10px;font:700 15px Rajdhani,sans-serif;text-align:left}#busd .ls button small{display:block;color:#9fc4ff;font-size:12px}
#busd .x{width:100%;padding:8px;border-radius:10px;border:2px solid #fff;background:#444;color:#fff;font:700 16px Rajdhani,sans-serif}
#bfade{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .5s;z-index:74;display:flex;align-items:center;justify-content:center;color:#4af;font:700 26px sans-serif;text-align:center}
`);

  /* ================= 1) UST MESAJ ALANI ================= */
  const feed = document.createElement('div'); feed.id = 'feed'; $('hud').appendChild(feed);
  const FEED_MAX = 5;
  window.feedAdd = (t, kind) => {
    t = String(t == null ? '' : t); if (!t) return;
    const now = performance.now(), life = (kind ? 8000 : 4200) + Math.min(3000, t.length * 25);
    const last = feed.lastChild;
    if (last && last.dataset.t === t) { last._till = now + life; last.classList.add('on'); last.classList.remove('off'); return; }
    const d = document.createElement('div'); d.className = 'fl' + (kind ? ' c' : ''); d.dataset.t = t; d.textContent = t; d._till = now + life;
    feed.appendChild(d); requestAnimationFrame(() => d.classList.add('on'));
    while (feed.children.length > FEED_MAX) feed.removeChild(feed.firstChild);
  };
  setInterval(() => {
    const now = performance.now();
    for (const d of Array.from(feed.children)) {
      if (now > d._till && !d._rm) { d._rm = 1; d.classList.add('off'); d.classList.remove('on'); setTimeout(() => d.remove(), 320); }
    }
  }, 250);
  $('msg').style.display = 'none';

  /* ================= 2) UCUS ================= */
  const FL = { up: 0, dn: 0 };
  const flb = document.createElement('div'); flb.id = 'flb';
  flb.innerHTML = '<button id="flu"><b>▲</b>YÜKSEL</button><button id="fld"><b>▼</b>ALÇAL</button>';
  $('hud').appendChild(flb);
  const fi = document.createElement('div'); fi.id = 'fi'; $('hud').appendChild(fi);
  for (const [id, k] of [['flu', 'up'], ['fld', 'dn']]) {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); FL[k] = 1; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (x) {} });
    const off = e => { FL[k] = 0; b.classList.remove('on'); };
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  }

  const GC = new Map(); let gcN = -1;
  function airGrid() {
    if (gcN === blds.length) return; GC.clear(); gcN = blds.length;
    for (const b of blds) for (let i = Math.floor((b.x1 - 6) / 40); i <= Math.floor((b.x2 + 6) / 40); i++) for (let j = Math.floor((b.z1 - 6) / 40); j <= Math.floor((b.z2 + 6) / 40); j++) { const k = i * 4096 + j; let a = GC.get(k); if (!a) GC.set(k, a = []); a.push(b); }
  }
  function airHit(x, z, alt, r) {
    airGrid();
    const a = GC.get(Math.floor(x / 40) * 4096 + Math.floor(z / 40)); if (!a) return null;
    for (const b of a) if (x > b.x1 - r && x < b.x2 + r && z > b.z1 - r && z < b.z2 + r && alt < (b.h || 16) + 3) return b;
    return null;
  }
  function airCrash(c, sev, why) {
    if ((c.crT || 0) > 0) { c.v = Math.min(c.v, 0) * .5; return; }      // arka arkaya hasar yok (0.9 sn)
    c.crT = .9; c.hp -= sev; shake = 1; tryF(() => sfx(.4, .4, 300));
    for (let i = 0; i < 4; i++) tryF(() => puff(c.x + (Math.random() - .5) * 4, 1 + (c.alt || 0) + Math.random() * 2, c.z + (Math.random() - .5) * 4, i & 1 ? 0x333333 : 0xff8844));
    c.v *= -.25;
    if (c.hp <= 0 && !c.dead) {
      c.dead = 1; tryF(() => dk(c)); const al = c.alt || 0; c.alt = 0; c.vy = 0;
      P.hp -= al > 6 ? 130 : 35;
      tryF(() => exitCar()); toast(P.hp <= 0 ? 'Düştün!' : (why || 'Araç parçalandı!'));
    } else toast(why || ('Çarpıştın! Hasar: ' + Math.round(sev)));
  }
  function flyCar(c, dt) {
    c.fly = 1; if (c.alt == null) { c.alt = 0; c.vy = 0; }
    if (c.crT > 0) c.crT -= dt;
    const heli = c.vt === 'heli', g = c.alt <= .15;
    const gs = clamp(Math.max(J.y, 0) + (K.KeyW || K.ArrowUp ? 1 : 0) + DR.gas, 0, 1), bk = clamp(Math.max(-J.y, 0) + (K.KeyS || K.ArrowDown ? 1 : 0) + DR.brk, 0, 1);
    const jx = clamp(J.x + (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0) + DR.steer, -1, 1);
    const up = clamp((FL.up || K.Space ? 1 : 0) - (FL.dn || K.ShiftLeft ? 1 : 0), -1, 1);
    let fp = 0, fr = 0;
    if (heli) {
      c.vy += ((up > 0 ? up * 13 : up * 11) - c.vy) * Math.min(1, 3 * dt); if (g && c.vy < 0) c.vy = 0;
      c.v += gs * (g ? 9 : 20) * dt; c.v -= bk * (g ? 14 : 20) * dt;
      if (!gs && !bk) c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), (g ? 10 : 3.5) * dt);
      c.v = clamp(c.v, -8, g ? 7 : 40);
      c.a -= jx * 1.7 * dt * (g ? clamp(Math.abs(c.v) / 3, .15, 1) : 1);
      fp = clamp(c.v / 40, -.3, 1) * .32; fr = g ? 0 : -jx * .28;
      if (c.rotor) c.rotor.rotation.y += .9;
    } else {
      c.v += gs * 16 * dt; c.v -= bk * (g ? 26 : 8) * dt;
      if (!gs && !bk) c.v -= c.v * (g ? .18 : .035) * dt;
      c.v = clamp(c.v, 0, 82);
      if (g) {
        if (c.v > 26 && up > 0) { c.vy = 6; c.alt = .4; } else c.vy = 0;
        c.a -= jx * 1.1 * dt * clamp(c.v / 8, 0, 1);
      } else {
        const lift = clamp((c.v - 18) / 10, 0, 1);
        const tv = up * 16 * lift - (1 - lift) * 16;
        c.vy += (tv - c.vy) * Math.min(1, 2.2 * dt);
        c.v -= Math.max(c.vy, 0) * .5 * dt; c.v += Math.max(-c.vy, 0) * .25 * dt;
        c.a -= jx * 1.0 * dt * clamp(c.v / 30, .3, 1);
        fr = -jx * .65;
      }
      fp = -clamp(c.vy * .03, -.5, .5);
    }
    // yumusak inis: yere yaklastikca azami inis hizi azalir
    if (c.vy < 0 && c.alt < 40) c.vy = Math.max(c.vy, -(2.2 + c.alt * .5));
    // yukseklik + yere temas
    const ny = c.alt + c.vy * dt;
    if (ny <= 0) {
      if (c.alt > .3 && c.vy < -(heli ? 7 : 9)) { airCrash(c, (-c.vy - (heli ? 7 : 9)) * 7, 'Sert iniş!'); if (c.dead) return; }
      if (c.alt > .3 && !walk(c.x, c.z)) { airCrash(c, 999, 'Suya düştün!'); if (c.dead) return; }
      c.alt = 0; c.vy = 0;
    } else c.alt = Math.min(ny, 190);
    // yatay hareket + carpisma
    const sx = Math.sin(c.a) * c.v * dt, sz = Math.cos(c.a) * c.v * dt, ox = c.x, oz = c.z;
    if (c.alt < 1.2) {
      const ok = mv(c, sx, sz, heli ? 2.6 : 3.4);
      if (!ok && Math.abs(c.v) > 3) { airCrash(c, Math.abs(c.v) * .9, 'Çarptın!'); if (c.dead) return; }
    } else {
      const nx = c.x + sx, nz = c.z + sz, b = airHit(nx, nz, c.alt, heli ? 2.8 : 4.2);
      if (b) { airCrash(c, heli ? 45 + Math.abs(c.v) : (c.v > 30 ? 130 : 60), 'Binaya çarptın!'); if (c.dead) return; }
      else { c.x = nx; c.z = nz; }
    }
    c.vh = c.a; c.pit = 0; c.roll = 0;
    c.fp = (c.fp || 0) + (fp - (c.fp || 0)) * Math.min(1, 5 * dt); c.fr = (c.fr || 0) + (fr - (c.fr || 0)) * Math.min(1, 5 * dt);
    c.pg.rotation.set(c.fp, 0, c.fr);
    P.x = c.x; P.z = c.z; P.a = c.a;
    if (c.hp < 40 && Math.random() < .25) tryF(() => puff(c.x, 1.5 + c.alt, c.z, 0x333333));
  }
  const pc0 = playerCar;
  playerCar = function (c, dt) { if (c && c.air) return flyCar(c, dt); return pc0.apply(this, arguments); };
  const ex0 = exitCar;
  exitCar = function () {
    const c = P.car;
    if (c && c.fly && (c.alt || 0) > 1.2) {
      if (!c.dead && P.hp > 0 && mode === 'play') { toast('Önce yere in! (▼ ALÇAL)'); return; }
      c.alt = 0; c.vy = 0; c.v = 0;
    }
    if (c && c.fly && c.v > 9) { toast('Önce yavaşla'); return; }
    const r = ex0.apply(this, arguments); FL.up = FL.dn = 0; return r;
  };
  let wasFly = null;
  setInterval(() => {
    for (const c of cars) if (c.air && !c.fly) { c.fly = 1; c.alt = c.alt || 0; c.vy = 0; }
    const c = P.car, on = !!(c && c.fly && mode === 'play');
    flb.style.display = on ? 'flex' : 'none'; fi.style.display = on ? 'block' : 'none';
    if (on) {
      fi.innerHTML = '<b>' + (c.vt === 'heli' ? 'HELİKOPTER' : 'UÇAK') + '</b> • YÜKSEKLİK <i>' + Math.round(c.alt) + ' m</i> • HIZ <i>' + Math.round(Math.abs(c.v) * 3.6) + ' km/s</i>';
      if (wasFly !== c) { wasFly = c; toast(c.vt === 'heli' ? 'Helikopter: ▲ ile havalan, gaz = ileri' : 'Uçak: gaz ver, 95 km/s üstünde ▲ ile kalk'); }
    } else wasFly = null;
    for (const k of cars) if (k.fly && k.pg && P.car !== k) { k.pg.rotation.set(0, 0, 0); k.fp = k.fr = 0; }
  }, 120);

  /* ---- havalimani ---- */
  let AIR = null; const AIRC = [];
  function findSite() {
    const LEN = 300, WID = 64, cand = [];
    const ov = (a, b, m) => a.x1 < b.x2 + m && a.x2 > b.x1 - m && a.z1 < b.z2 + m && a.z2 > b.z1 - m;
    const base = lands.filter(l => !l.air);
    const ok = (r, from) => {
      for (const l of base) { if (l === from) { if (ov(r, { x1: l.x1 + 3, x2: l.x2 - 3, z1: l.z1 + 3, z2: l.z2 - 3 }, 0)) return false; } else if (ov(r, l, 16)) return false; }
      for (const q of RIV) if (ov(r, q, 8)) return false; return true;
    };
    for (const l of base) {
      for (let zc = l.z1 + 30; zc <= l.z2 - 30; zc += 30) {
        cand.push({ from: l, O: [l.x2 - 1, zc], du: [1, 0], r: { x1: l.x2 - 1, x2: l.x2 - 1 + LEN, z1: zc - WID / 2, z2: zc + WID / 2 } });
        cand.push({ from: l, O: [l.x1 + 1, zc], du: [-1, 0], r: { x1: l.x1 + 1 - LEN, x2: l.x1 + 1, z1: zc - WID / 2, z2: zc + WID / 2 } });
      }
      for (let xc = l.x1 + 30; xc <= l.x2 - 30; xc += 30) {
        cand.push({ from: l, O: [xc, l.z2 - 1], du: [0, 1], r: { x1: xc - WID / 2, x2: xc + WID / 2, z1: l.z2 - 1, z2: l.z2 - 1 + LEN } });
        cand.push({ from: l, O: [xc, l.z1 + 1], du: [0, -1], r: { x1: xc - WID / 2, x2: xc + WID / 2, z1: l.z1 + 1 - LEN, z2: l.z1 + 1 } });
      }
    }
    cand.sort((a, b) => Math.hypot(a.O[0], a.O[1]) - Math.hypot(b.O[0], b.O[1]));
    for (const c of cand) if (ok(c.r, c.from)) return Object.assign(c, { LEN, WID });
    return null;
  }
  function buildAirport() {
    const S = findSite(); if (!S) { console.warn('v11: havalimani yeri yok'); return; }
    const { LEN, WID } = S, th = Math.atan2(S.du[0], S.du[1]), ct_ = Math.cos(th), st_ = Math.sin(th);
    const L2W = (v, u) => [S.O[0] + ct_ * v + st_ * u, S.O[1] - st_ * v + ct_ * u];
    // yeni kara
    land(S.r.x1, S.r.z1, S.r.x2 - S.r.x1, S.r.z2 - S.r.z1, '#555a62'); lands[lands.length - 1].air = 1;
    tryF(() => { const g = MMc.getContext('2d'); g.fillStyle = '#555a62'; g.fillRect((S.r.x1 - mnx) * MS, (S.r.z1 - mnz) * MS, (S.r.x2 - S.r.x1) * MS, (S.r.z2 - S.r.z1) * MS); });
    // agaclari temizle
    const inR = (x, z, m) => x > S.r.x1 - m && x < S.r.x2 + m && z > S.r.z1 - m && z < S.r.z2 + m;
    tryF(() => { for (const [k, a] of SOL) { const f = a.filter(q => !inR(q[0], q[1], 4)); if (f.length !== a.length) { if (f.length) SOL.set(k, f); else SOL.delete(k); } } });
    tryF(() => scene.traverse(o => { if (o.isInstancedMesh && (o.geometry === gTrunk || o.geometry === gLeaf)) { const m = new THREE.Matrix4(), z = new THREE.Matrix4().makeScale(0, 0, 0); let ch = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); const e = m.elements; if (inR(e[12], e[14], 4)) { o.setMatrixAt(i, z); ch = 1; } } if (ch) o.instanceMatrix.needsUpdate = true; } }));
    // gorsel (yerel eksen: x = yanal, z = pist boyunca)
    const gr = new THREE.Group(); gr.position.set(S.O[0], 0, S.O[1]); gr.rotation.y = th; scene.add(gr);
    const slab = new THREE.Mesh(gBox, new THREE.MeshLambertMaterial({ color: 0x6a6f78 })); slab.scale.set(WID, .3, LEN); slab.position.set(0, .25, LEN / 2); gr.add(slab);
    const rwT = ct(128, 1024, g => { g.fillStyle = '#2b2d33'; g.fillRect(0, 0, 128, 1024); g.fillStyle = '#fff'; g.fillRect(6, 0, 5, 1024); g.fillRect(117, 0, 5, 1024); for (let y = 60; y < 960; y += 80) g.fillRect(61, y, 6, 44); for (const y0 of [14, 920]) for (let x = 14; x < 114; x += 14) g.fillRect(x, y0, 8, 70); });
    rwT.wrapS = rwT.wrapT = THREE.ClampToEdgeWrapping;
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(22, LEN - 20), new THREE.MeshLambertMaterial({ map: rwT })); rw.rotation.x = -Math.PI / 2; rw.position.set(-9, .42, LEN / 2); gr.add(rw);
    const hpT = ct(128, 128, g => { g.fillStyle = '#3a3d44'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#ffd23c'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.font = '700 80px Rajdhani,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', 64, 70); });
    hpT.wrapS = hpT.wrapT = THREE.ClampToEdgeWrapping;
    const hp = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshLambertMaterial({ map: hpT })); hp.rotation.x = -Math.PI / 2; hp.position.set(19, .43, 46); gr.add(hp);
    const hp2 = hp.clone(); hp2.position.set(19, .43, 80); gr.add(hp2);
    const bx = (sx, sy, sz, x, y, z, col) => { const m = new THREE.Mesh(gBox, new THREE.MeshLambertMaterial({ color: col })); m.scale.set(sx, sy, sz); m.position.set(x, y, z); gr.add(m); return m; };
    bx(6, 16, 6, 24, 8.4, 125, 0xcfd3da); bx(8, 3, 8, 24, 17.5, 125, 0x2b7fb8); bx(9, .6, 9, 24, 19.2, 125, 0x555a62);
    bx(34, 9, 16, 22, 4.8, 165, 0xb9bec7); bx(34.4, 1.2, 16.4, 22, 9.8, 165, 0xe74c3c);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: signTex('HAVAALANI', '#4af'), transparent: true })); sg.position.set(22, 6.5, 156.8); sg.rotation.y = Math.PI; gr.add(sg);
    const sg2 = sg.clone(); sg2.position.set(-1, 4.2, 6); sg2.rotation.y = 0; sg2.scale.set(.8, .8, 1); gr.add(sg2);
    addSol(...L2W(24, 125), 4.5); addSol(...L2W(14, 165), 7); addSol(...L2W(22, 165), 9); addSol(...L2W(30, 165), 7);
    // araclar
    const q = L2W(-9, 14);   // pist basi (adadan en uzakta degil, adaya yakin ucta; ucak adadan UZAGA bakar)
    const heading = Math.atan2(S.du[0], S.du[1]);
    const mk = (t, p, a) => { const k = mkVeh(t, p[0], p[1], a); k.fly = 1; k.alt = 0; k.vy = 0; k.keep = 1; k.home = [p[0], p[1], a, t]; AIRC.push(k); return k; };
    mk('plane', q, heading); mk('heli', L2W(19, 46), heading); mk('heli', L2W(19, 80), heading);
    const c = L2W(0, LEN / 2); AIR = { x: S.O[0] + S.du[0] * 40, z: S.O[1] + S.du[1] * 40, cx: c[0], cz: c[1], site: S };
    setTimeout(() => toast('Havalimanı hazır: Telefon > Uçuş uygulamasından GPS\'e koy'), 6000);
  }
  tryF(buildAirport);
  // oda baslarken araba listesi yenilenirse havalimani araclarini geri koy
  setInterval(() => {
    if (!AIR) return;
    for (let i = 0; i < AIRC.length; i++) { const k = AIRC[i]; if (!cars.includes(k) || (k.dead && P.car !== k && Math.hypot(P.x - k.x, P.z - k.z) > 80)) { const h = k.home; if (cars.includes(k)) { scene.remove(k.m); cars.splice(cars.indexOf(k), 1); } const n = mkVeh(h[3], h[0], h[1], h[2]); n.fly = 1; n.alt = 0; n.vy = 0; n.keep = 1; n.home = h; AIRC[i] = n; } }
  }, 4000);

  /* ================= 3) OTOBUS DURAGI ================= */
  const bdlg = document.createElement('div'); bdlg.id = 'busd'; bdlg.className = 'ov hid'; document.body.appendChild(bdlg);
  const bfade = document.createElement('div'); bfade.id = 'bfade'; document.body.appendChild(bfade);
  const BS = { bus: null, from: null, to: null, dir: 1, fare: 0, ph: 0, t: 0, run: 0 };
  const stopName = s => { let best = null, bd = 1e9; for (const p of PLC) { const d = Math.hypot(p.x - s.x, p.z - s.z); if (d < bd) { bd = d; best = p; } } return best && bd < 80 ? best.n + ' yanı' : 'Durak'; };
  const dirOf = s => s.rd.ax === 'z' ? (s.sd < 0 ? 1 : -1) : (s.sd > 0 ? 1 : -1);
  const lanePos = (s, t) => s.rd.ax === 'z' ? [s.rd.c + s.sd * 3, t] : [t, s.rd.c + s.sd * 3];
  const headOf = (s, dir) => s.rd.ax === 'z' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  function closeBus() { bdlg.classList.add('hid'); if (mode === 'bus') mode = 'play'; }
  function busMenu(from) {
    if (mode !== 'play') return;
    if (BS.run) { toast('Zaten bir otobüs çağırdın'); return; }
    mode = 'bus'; J.x = J.y = 0; B.fire = 0;
    const list = STOPS.filter(s => s !== from).map(s => ({ s, d: Math.hypot(s.x - from.x, s.z - from.z), i: STOPS.indexOf(s) + 1 })).sort((a, b) => a.d - b.d);
    bdlg.innerHTML = '<div class="nb"><h3>OTOBÜS DURAĞI</h3><div>Nereye gitmek istiyorsun?</div><div class="ls">' + list.map((o, k) => `<button data-k="${k}">${o.i}. ${esc(stopName(o.s))}<small>${Math.round(o.d)} m • $${Math.round(5 + o.d * .02)}</small></button>`).join('') + '</div><button class="x">VAZGEÇ</button></div>';
    bdlg.classList.remove('hid');
    bdlg.querySelector('.ls').onclick = e => { const b = e.target.closest('button'); if (!b) return; const o = list[+b.dataset.k]; if (o) callBus(from, o.s, o.d); };
    bdlg.querySelector('.x').onclick = closeBus;
  }
  function cancelBus(msg) {
    if (BS.bus) { const i = cars.indexOf(BS.bus); if (i >= 0) { cars.splice(i, 1); scene.remove(BS.bus.m); } }
    BS.bus = null; BS.run = 0; BS.ph = 0; bfade.style.opacity = 0; if (mode === 'bus') mode = 'play'; if (msg) toast(msg);
  }
  function callBus(from, to, dist) {
    const fare = Math.round(5 + dist * .02);
    if (P.money < fare) { toast('Bilet $' + fare + ' — paran yetmiyor'); return; }
    closeBus();
    const dir = dirOf(from), z = from.rd.ax === 'z', tS = z ? from.z : from.x;
    let t0 = tS - dir * 150; t0 = clamp(t0, from.rd.a0 + 6, from.rd.a1 - 6);
    const p = lanePos(from, t0), bus = mkCar(6, ['#2e86de', '#c0392b', '#27ae60', '#f39c12'][Math.random() * 4 | 0], p[0], p[1], headOf(from, dir));
    bus.ai = 0; bus.v = 0; bus.busTaxi = 1;
    Object.assign(BS, { bus, from, to, dir, fare, ph: 0, t: 0, run: 1, last: performance.now() });
    toast('Otobüs geliyor (' + Math.round(Math.abs(tS - t0)) + ' m) — durakta bekle');
  }
  function boardFree(x, z) {
    for (let r = 2.2; r < 8; r += 1.2) for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (walk(px, pz) && !blocked(px, pz, .6)) return [px, pz]; }
    return [x, z];
  }
  function placeBusAt(s) { const dir = dirOf(s), z = s.rd.ax === 'z', t = z ? s.z : s.x, p = lanePos(s, t), b = BS.bus; b.x = p[0]; b.z = p[1]; b.a = headOf(s, dir); b.v = 0; BS.dir = dir; BS.from = s; }
  function arrive() {
    const b = BS.bus; if (!b || !cars.includes(b)) { cancelBus(); bfade.style.opacity = 0; return; }
    const d = Math.hypot(BS.to.x - BS.from.x, BS.to.z - BS.from.z), q = boardFree(BS.to.x, BS.to.z);
    P.x = q[0]; P.z = q[1]; hour = (hour + d / 900) % 24; placeBusAt(BS.to);
    bfade.style.opacity = 0; if (mode === 'bus') mode = 'play'; BS.ph = 5; BS.t = 0;
    toast('Vardık! ' + stopName(BS.to) + ' (' + Math.round(d) + ' m) • −$' + BS.fare);
  }
  function busStep(dt) {
    const b = BS.bus; if (!BS.run || !b) return;
    if (!cars.includes(b)) { cancelBus('Otobüs iptal oldu'); return; }
    if (INT || P.car || mode === 'dead') { cancelBus('Otobüs seferi iptal'); return; }
    const s = BS.from, z = s.rd.ax === 'z', dir = BS.dir, tS = z ? s.z : s.x, tB = z ? b.z : b.x, rem = (tS - tB) * dir;
    const go = v => { b.v += (v - b.v) * Math.min(1, 2.5 * dt); const m = b.v * dt * dir; if (z) b.z += m; else b.x += m; };
    BS.t += dt;
    if (BS.ph === 0) {
      go(rem > 55 ? 16 : Math.max(0, Math.min(16, rem * .55)));
      if (rem < 1.2 && b.v < .9) { b.v = 0; BS.ph = 1; BS.t = 0; toast('Otobüs geldi! Yaklaş ve bin'); tryF(() => tone(520, .15, 'triangle', .07)); }
      else if (BS.t > 40) cancelBus('Otobüs gelemedi');
    } else if (BS.ph === 1) {
      b.v = 0;
      const near = Math.hypot(P.x - s.x, P.z - s.z) < 14;
      if (near && BS.t > 1.2) {
        if (P.money < BS.fare) { toast('Bilet $' + BS.fare + ' — paran yetmiyor'); BS.ph = 4; BS.t = 0; return; }
        P.money -= BS.fare; BS.ph = 2; mode = 'bus'; J.x = J.y = 0;
        bfade.textContent = 'Otobüs yolda · −$' + BS.fare; bfade.style.opacity = 1; setTimeout(arrive, 1500);
      } else if (BS.t > 14) { toast('Otobüsü kaçırdın'); BS.ph = 4; BS.t = 0; }
    } else if (BS.ph === 4 || BS.ph === 6) {                       // kalkis ve silinme
      go(16); if (BS.t > 11) { const i = cars.indexOf(b); if (i >= 0) cars.splice(i, 1); scene.remove(b.m); BS.bus = null; BS.run = 0; BS.ph = 0; }
    } else if (BS.ph === 5) { b.v = 0; if (BS.t > 3) { BS.ph = 6; BS.t = 0; } }
  }
  let lastB = performance.now();
  (function raf() { const n = performance.now(), dt = Math.min(.08, (n - lastB) / 1000); lastB = n; if (BS.run) tryF(() => busStep(dt)); requestAnimationFrame(raf); })();

  const nearPl1 = nearPl;
  nearPl = function () {
    const r = nearPl1.apply(this, arguments); if (r) return r;
    if (mode !== 'play' || INT || P.car || BS.run) return null;
    for (const s of STOPS) if (Math.hypot(P.x - s.x, P.z - s.z) < 3.8) return { p: 'ARAÇ: Otobüs bekle', go: () => busMenu(s) };
    return null;
  };

  /* ---- telefon: Ucus + Otobus ---- */
  const icn = p => '<svg viewBox="0 0 24 24">' + p + '</svg>';
  PH_IC.ucs = icn('<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>');
  PH_IC.otb = icn('<rect x="4" y="3" width="16" height="14" rx="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M4 11h16M7 17v3M17 17v3" stroke="#fff" stroke-width="2"/><circle cx="8" cy="14" r="1.2"/><circle cx="16" cy="14" r="1.2"/>');
  PH_APPS.push(['ucs', 'Uçuş', 'linear-gradient(#4aa8ff,#1b3a8a)', '#2b5fc0'], ['otb', 'Otobüs', 'linear-gradient(#ffb340,#e0651b)', '#e8841f']);
  const gps = (x, z, nm) => { WPT = { x, z }; wpM.visible = true; wpM.position.set(x, 30, z); toast(nm + ' haritada işaretlendi'); };
  PH_VIEW.ucs = c => {
    if (!AIR) { c.innerHTML = '<div class="pcard"><b>Havalimanı</b>Uygun yer bulunamadı.</div>'; return; }
    const d = Math.round(Math.hypot(P.x - AIR.x, P.z - AIR.z));
    c.innerHTML = `<div class="pcard"><b>Havalimanı</b>Mesafe: ${d} m<br>1 uçak ve 2 helikopter bekliyor. Araca yaklaş, ARAÇ tuşuna bas.</div><div class="pcard"><b>Nasıl uçulur?</b>Gaz = hız • ▲ YÜKSEL / ▼ ALÇAL düğmeleri (PC: Boşluk / Shift).<br>Helikopter: ▲ ile havalan, havada durabilir.<br>Uçak: pistte gaz ver, 95 km/s üstünde ▲ ile kalk. İnmek için yavaşla ve ▼.<br>Yere inmeden araçtan inemezsin. Binalara çarpma!</div><button id="ugp" class="pbig b">GPS'E KOY</button>`;
    $('ugp').onclick = () => { closePh(); gps(AIR.x, AIR.z, 'Havalimanı'); };
  };
  PH_VIEW.otb = c => {
    if (!STOPS.length) { c.innerHTML = '<div class="pcard"><b>Otobüs</b>Duraklar yükleniyor...</div>'; return; }
    let best = null, bd = 1e9; for (const s of STOPS) { const d = Math.hypot(P.x - s.x, P.z - s.z); if (d < bd) { bd = d; best = s; } }
    c.innerHTML = `<div class="pcard"><b>Otobüs durakları</b>${STOPS.length} durak var. Durağa gel, ARAÇ tuşuna bas, gideceğin yeri seç: otobüs gelir, bin, hedefte in.</div><div class="pcard"><b>En yakın durak</b>${esc(stopName(best))} • ${Math.round(bd)} m</div><button id="ubp" class="pbig b">DURAĞI GPS'E KOY</button>`;
    $('ubp').onclick = () => { closePh(); gps(best.x, best.z, 'Durak'); };
  };
  tryF(() => window.__v10phone.rebuildGrid());
  window.__v11 = { AIRC, BS, flyCar, findSite, buildAirport, busMenu, callBus, busStep, feedAdd: window.feedAdd, get AIR() { return AIR; } };
  console.log('GTA67 v11 yüklendi');
})();
