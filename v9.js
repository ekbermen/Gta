/* GTA 67 v9 (v8.js'ten SONRA yuklenir)
   1) Akici performans: cozunurluk tabani (pikselleme yok), uzak statik nesne gizleme, kademeli kisma
   2) Arac modeli sadece 100 m icinde yuklu; disinda silinir, GLB'siz hafif arac
   3) Daha akilli trafik (onundeki araca/yayaya gore yavaslar, sikisinca doner) ve yayalar araba gorunce kacar
   4) Taksi: rota gorunur, taksi kendisi surer, ucret sonda kesilir (para yoksa eksiye duser)
   5) Selfie: karakter telefonu eline alir */
(() => {
  const tryF = f => { try { return f(); } catch (e) { return null; } };
  const el = (tag, id, cls, html) => { const e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ================= 1) PERFORMANS ================= */
  const LV = {
    q:    [1, 1, 1, 1, .95, .9, .85, .8, .8],
    sh:   [3, 3, 4, 4, 4, 6, 6, 8, 8],
    car:  [100, 100, 90, 80, 70, 60, 50, 40, 35],
    ped:  [100, 90, 80, 70, 60, 50, 40, 32, 26],
    shd:  [40, 36, 30, 24, 0, 0, 0, 0, 0],
    house:[180, 160, 140, 120, 100, 90, 80, 70, 60],
    vis:  [260, 240, 220, 200, 180, 160, 140, 120, 100],
    stat: [700, 560, 460, 380, 320, 270, 230, 200, 170]
  };
  const oldResize = resize;
  resize = function () {
    const base = [.75, 1, 1.15, 1.3, 1.6][S.gfx] || 1;
    const pr = Math.max(.7, Math.min(devicePixelRatio || 1, base * PF.q));
    ren.setPixelRatio(pr); ren.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    if (comp) { comp.setPixelRatio(Math.max(.5, Math.min(devicePixelRatio || 1, .8) * PF.q)); comp.setSize(innerWidth, innerHeight); }
  };
  removeEventListener('resize', oldResize); addEventListener('resize', resize);
  perfApply = function () {
    const L = PF.lvl;
    PF.q = LV.q[L]; PF.sh = LV.sh[L]; PF.bloom = L < 2 ? 1 : 0; PF.car = LV.car[L]; PF.ped = LV.ped[L];
    PF.shd = LV.shd[L]; PF.house = LV.house[L]; PF.vis = LV.vis[L]; PF.stat = LV.stat[L];
    sun.castShadow = S.gfx > 0 && L < 4; resize();
  };
  PF.maxL = 8; perfApply();

  /* uzak statik nesneleri (binalar, direkler...) mesafeye gore gizle: cizim sayisi (draw call) azalir */
  const ST = { list: [], act: 0, idx: 0, ph: 0, t0: 0 };
  function stSnapshot() {
    const ex = new Set(); for (const c of cars) ex.add(c.m); for (const p of peds) ex.add(p.m); ex.add(P.mesh);
    for (const h of HOUSES) ex.add(h);
    const out = [], b = new THREE.Box3(), sp = new THREE.Sphere();
    for (const o of scene.children) {
      if (ex.has(o) || o.isLight || o.isCamera || !o.visible || o.frustumCulled === false || o.isInstancedMesh) continue;
      if (!(o.isMesh || o.isGroup || o.type === 'Object3D')) continue;
      if (o.isMesh && o.material && o.material.fog === false) continue;
      let bad = 0; o.traverse(c => { if (c.isInstancedMesh || c.isSprite || c.isLine || c.isPoints) bad = 1; }); if (bad) continue;
      if (o.userData && (o.userData.keep || o.userData.sky)) continue;
      b.setFromObject(o); if (b.isEmpty()) continue; b.getBoundingSphere(sp);
      if (!(sp.radius < 110) || sp.center.y > 70 || Math.hypot(sp.center.x, sp.center.z) > 3000) continue;
      out.push({ o, x: sp.center.x, z: sp.center.z, r: sp.radius, px: o.position.x, py: o.position.y, pz: o.position.z, hid: 0 });
    }
    return out;
  }
  function stTick() {
    const n = ST.list.length; if (!n) return;
    const cx = cam.position.x, cz = cam.position.z, lim = PF.stat, cnt = Math.ceil(n / 4);
    for (let k = 0; k < cnt; k++) {
      const e = ST.list[ST.idx]; ST.idx = (ST.idx + 1) % n;
      const d = Math.hypot(e.x - cx, e.z - cz) - e.r;
      if (!e.hid) { if (d > lim + 12 && e.o.visible) { e.o.visible = false; e.hid = 1; } }
      else if (d < lim) { e.o.visible = true; e.hid = 0; }
    }
  }
  function stStep() {
    if (mode !== 'play') return;
    if (ST.ph === 0) { if (!ST.t0) ST.t0 = tt; if (tt - ST.t0 > 3) { ST.list = stSnapshot(); ST.ph = 1; ST.t0 = tt; } }
    else if (ST.ph === 1) {   // 4 sn sonra yeri degisenleri (dinamik olanlar) ele
      if (tt - ST.t0 > 4) {
        ST.list = ST.list.filter(e => e.o.parent === scene && Math.abs(e.o.position.x - e.px) < .01 && Math.abs(e.o.position.y - e.py) < .01 && Math.abs(e.o.position.z - e.pz) < .01);
        ST.ph = 2; ST.act = 1;
      }
    } else if (ST.act) stTick();
  }

  /* ================= 2) ARAC MODELI: 100 m ================= */
  let SKB = 1;
  function unskin(c) {
    if (!c.glb || !c.mroot || c.mroot.parent !== c.m) return;
    c.m.remove(c.mroot);
    c.mroot.traverse(o => { if (o.isMesh && o.material && o.material !== darkM && o.material.dispose) o.material.dispose(); });
    c.mroot = null; c.glb = 0; c.lodF = 1; c.shO = 0;
    if (!c.pg.parent) c.m.add(c.pg); c.pg.visible = true;
    c.pg.traverse(o => { if (o.isMesh) o.castShadow = false; });
  }
  carLod = function (c, dd) {
    if (c.drv || c.cop || c.dead || !c.pg) return;
    const R = PF.car;
    if (c.glb) {
      if (dd > R + 14 && c.hp >= 95 && !c.gb && !c.flat && !c.dent && !c.taxiR) { unskin(c); return; }
      if (c.mroot && c.mroot.parent === c.m) {
        const s = dd < PF.shd ? 1 : 0;
        if (s !== c.shO) { c.shO = s; c.mroot.traverse(o => { if (o.isMesh) o.castShadow = !!s; }); }
      }
    } else if (dd < R && SKB > 0 && (c.skT || 0) < tt) {
      SKB--; c.skT = tt + 2;
      try { skin(c); } catch (e) { }
      if (c.glb) { c.lodF = 0; if (c.pg.parent) c.m.remove(c.pg); }
    }
  };
  function farUnskin() {
    const cx = cam.position.x, cz = cam.position.z;
    for (const c of cars) if (c.glb && !c.m.visible) carLod(c, Math.hypot(c.x - cx, c.z - cz));
  }

  /* ================= 3) AKILLI TRAFIK ================= */
  function aiScan(c) {
    const fx = Math.sin(c.a), fz = Math.cos(c.a), look = 7 + Math.max(0, c.v) * 1.3;
    let gap = 1e9, lv = 0, why = 0;
    for (const q of cars) {
      if (q === c || q.dead || q.fly || q.y > 3) continue;
      const dx = q.x - c.x, dz = q.z - c.z;
      if (dx > look + 6 || dx < -look - 6 || dz > look + 6 || dz < -look - 6) continue;
      const ah = dx * fx + dz * fz; if (ah < .3 || ah > look + 4) continue;
      const sd = Math.abs(dx * fz - dz * fx); if (sd > 2.4) continue;
      const g = ah - 4.3;
      if (g < gap) { gap = g; lv = Math.max(0, q.v * Math.cos(q.a - c.a)); why = 1; }
    }
    if (mode === 'play') for (const t of (ONL ? NET.targets() : [P])) {
      if (t === P && P.car) continue;
      const dx = t.x - c.x, dz = t.z - c.z, ah = dx * fx + dz * fz; if (ah < .3 || ah > look + 3) continue;
      const sd = Math.abs(dx * fz - dz * fx); if (sd > 2.6) continue;
      const g = ah - 2.2; if (g < gap) { gap = g; lv = 0; why = 2; }
    }
    for (const p of peds) {
      if (p.dead || (p.m && !p.m.visible)) continue;
      const dx = p.x - c.x, dz = p.z - c.z; if (dx > look || dx < -look || dz > look || dz < -look) continue;
      const ah = dx * fx + dz * fz; if (ah < .3 || ah > look) continue;
      const sd = Math.abs(dx * fz - dz * fx); if (sd > 2) continue;
      const g = ah - 2.4; if (g < gap) { gap = g; lv = 0; why = 3; }
    }
    c.sg = gap; c.sv = lv; c.sw = why;
  }
  aiCar = function (c, dt) {
    const rd = c.rd; c.cd -= dt;
    const z = rd.ax === 'z', ta = z ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2), tgt = z ? rd.c - 3 * c.dir : rd.c + 3 * c.dir;
    const fx = Math.sin(c.a), fz = Math.cos(c.a);
    let want = c.sp;
    if (mode === 'play' && !(c.ghost > 0)) {
      if (((FR + c.id) % 3) === 0) aiScan(c);
      const gap = c.sg;
      if (gap != null && gap < 1e8) {
        const safe = 1.8 + Math.max(0, c.v) * .5;
        if (gap < safe * 2.6) {
          if (gap <= .6) want = 0; else want = Math.min(want, Math.max(0, c.sv + (gap - safe) * 1.1));
          if (gap < safe) want = Math.min(want, c.sv * .6);
        }
      }
    } else if (c.ghost > 0) c.ghost -= dt;
    if (Math.abs(angD(ta, c.a)) > .45) want = Math.min(want, 7);
    if (c.stop > 0) { c.stop -= dt; want = 0; }
    let red = 0; if (want > 0 && tlStop(c)) { want = 0; red = 1; }
    if (!red && want < .3 && c.v < .6) c.blk = (c.blk || 0) + dt; else c.blk = Math.max(0, (c.blk || 0) - dt * 2);
    if (c.blk > 5 && c.sw === 1) { c.dir *= -1; c.blk = 0; }
    else if (c.blk > 9) { c.ghost = 3; c.blk = 0; }
    if (c.blk > 2.5 && c.sw === 2 && AC && Math.random() < dt * .8) tone(430, .18, 'square', .035);
    c.v += (want - c.v) * Math.min(1, (want < c.v ? 6 : 2.4) * dt);
    c.a += angD(ta, c.a) * Math.min(1, 5 * dt);
    const s0 = z ? c.z : c.x, ox = c.x, oz = c.z;
    c.x += fx * c.v * dt; c.z += fz * c.v * dt;
    if (z) c.x += (tgt - c.x) * Math.min(1, 3 * dt); else c.z += (tgt - c.z) * Math.min(1, 3 * dt);
    if (!walk(c.x, c.z)) { c.x = ox; c.z = oz; }
    const ns = z ? c.z : c.x;
    if (c.dir > 0 ? ns > rd.a1 - 1 : ns < rd.a0 + 1) {
      const nx = roads.find(r => r !== rd && r.ax === rd.ax && Math.abs(r.c - rd.c) < 1 && (c.dir > 0 ? Math.abs(r.a0 - rd.a1) < 2 : Math.abs(r.a1 - rd.a0) < 2));
      if (nx) c.rd = nx; else c.dir *= -1;
    } else if (c.cd <= 0) for (const r2 of roads) {
      if (r2.ax === rd.ax) continue;
      if (Math.abs(s0 - r2.c) < 1.5 && rd.c > r2.a0 && rd.c < r2.a1) { c.cd = 1.4; if (R() < .4) { c.rd = r2; c.dir = R() < .5 ? 1 : -1; } break; }
    }
  };

  /* yayalar hizli gelen arabadan kacar */
  function pedDodge() {
    for (let i = FR % 3; i < peds.length; i += 3) {
      const p = peds[i]; if (p.dead || p.cop) continue;
      if (p.sp0 == null) p.sp0 = p.sp;
      if (p.runT > 0) { p.runT -= .05; if (p.runT <= 0) p.sp = p.sp0; continue; }
      if (p.m && !p.m.visible) continue;
      for (const c of cars) {
        if (c.dead || Math.abs(c.v) < 3.5 || c.fly) continue;
        const rx = p.x - c.x, rz = p.z - c.z; if (rx > 11 || rx < -11 || rz > 11 || rz < -11) continue;
        const fx = Math.sin(c.a), fz = Math.cos(c.a), ah = rx * fx + rz * fz; if (ah < -1 || ah > 10) continue;
        const lat = rx * fz - rz * fx; if (Math.abs(lat) > 3.2) continue;
        const sg = lat >= 0 ? 1 : -1; p.a = Math.atan2(fz * sg, -fx * sg); p.sp = 5.8; p.runT = 1.2; break;
      }
    }
  }

  /* ================= 4) TAKSI YOLCULUGU ================= */
  taxiGo = function (x, z) {
    const k = TAXI && TAXI.car; if (!k) return;
    let bs = null, bd = 1e9;
    for (const r of roads) {
      const px = r.ax === 'z' ? r.c : clamp(x, r.a0 + 8, r.a1 - 8), pz = r.ax === 'z' ? clamp(z, r.a0 + 8, r.a1 - 8) : r.c, d = Math.hypot(px - x, pz - z);
      if (d < bd) { bd = d; bs = [px, pz]; }
    }
    if (!bs || bd > 60) { toast('Oraya yol yok — yola yakın bir yer seç'); return; }
    let pts = null; try { pts = route(k.x, k.z, bs[0], bs[1]); } catch (e) { }
    if (!pts || pts.length < 2) { toast('Rota bulunamadı'); return; }
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const fare = Math.round(8 + len * .22);
    TAXI = null; mode = 'play'; $('fm').classList.add('hid');
    k.taxiR = { pts, i: 1, fare, len, done: 0, st: 0 };
    WPT = { x: bs[0], z: bs[1] }; wpM.visible = true; wpM.position.set(bs[0], 30, bs[1]);
    toast('Taksi yola çıktı · ' + Math.round(len) + ' m · $' + fare);
  };
  function taxiEnd(k) {
    const R = k.taxiR; k.taxiR = null; k.v = 0;
    P.money -= R.fare;
    toast('Vardık! Ücret $' + R.fare + (P.money < 0 ? ' · bakiye −$' + Math.round(-P.money) : ''));
    WPT = null; wpM.visible = false;
    try { exitCar(); } catch (e) { }
    setTimeout(() => { k.dead = 1; k.m.visible = false; k.x = k.z = 1e5; }, 4000);
  }
  function taxiDrive(k, dt) {
    const R = k.taxiR; if (!R) return;
    if (R.i >= R.pts.length) { taxiEnd(k); return; }
    if ((FR & 1) === 0) aiScan(k);
    const tp = R.pts[R.i], pv = R.pts[R.i - 1] || [k.x, k.z];
    let sx = tp[0] - pv[0], sz = tp[1] - pv[1]; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const tx = tp[0] - sz * 3, tz = tp[1] + sx * 3, dx = tx - k.x, dz = tz - k.z, dist = Math.hypot(dx, dz);
    if (dist < 8) { R.i++; return; }
    const ta = Math.atan2(dx, dz), da = angD(ta, k.a);
    k.a += da * Math.min(1, 4.5 * dt);
    let want = Math.abs(da) > .6 ? 8 : Math.abs(da) > .3 ? 15 : 30;
    if (R.i >= R.pts.length - 1) want = Math.min(want, Math.max(5, dist * .7));
    if (k.sg != null && k.sg < 1e8) { const safe = 2 + k.v * .5; if (k.sg < safe * 2.6) want = Math.min(want, Math.max(0, (k.sv || 0) + (k.sg - safe))); }
    k.v += (want - k.v) * Math.min(1, (want < k.v ? 6 : 2) * dt);
    R.st = k.v < 1 ? R.st + dt : 0;
    if (R.st > 6) { R.i = Math.min(R.pts.length, R.i + 1); R.st = 0; k.x = tx; k.z = tz; }
    const nx = k.x + Math.sin(k.a) * k.v * dt, nz = k.z + Math.cos(k.a) * k.v * dt;
    if (walk(nx, nz)) { k.x = nx; k.z = nz; }
    k.pit = 0; k.roll = 0; P.x = k.x; P.z = k.z; P.a = k.a; R.done += k.v * dt;
  }
  const _pc = playerCar;
  playerCar = function (c, dt) { if (c.taxiR) { taxiDrive(c, dt); return; } return _pc.apply(this, arguments); };
  const _ex = exitCar;
  exitCar = function () { if (P.car && P.car.taxiR && P.hp > 0) { toast('Taksi yolda — varınca ineceksin'); return; } return _ex.apply(this, arguments); };

  /* ================= 5) SELFIE ================= */
  const css = el('style'); css.textContent = `
#sf{position:fixed;inset:0;z-index:70;pointer-events:none}
#sf button{pointer-events:auto;border:0;padding:0}
#sfs{position:absolute;right:30px;top:50%;transform:translateY(-50%);width:76px;height:76px;border-radius:50%;background:#fff;box-shadow:0 0 0 5px #fff6,inset 0 0 0 5px #111}
#sfs:active{transform:translateY(-50%) scale(.92)}
#sfx,#sfl{position:absolute;right:18px;width:46px;height:46px;border-radius:50%;background:#000a;border:2px solid #fff!important;display:grid;place-items:center}
#sfx{top:calc(env(safe-area-inset-top,0px) + 12px)}#sfl{top:calc(env(safe-area-inset-top,0px) + 68px)}
#sfx svg,#sfl svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
#sff{position:absolute;inset:0;background:#fff;opacity:0;transition:opacity .35s}`;
  document.head.appendChild(css);
  const sf = el('div', 'sf', 'hid',
    '<button id="sfx" aria-label="Kapat"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
    '<button id="sfl" aria-label="Kamerayı çevir"><svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg></button>' +
    '<button id="sfs" aria-label="Fotoğraf çek"></button><div id="sff"></div>');
  document.body.appendChild(sf);
  let SELF = null, PHM = null;
  function mkPhone() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(.075, .012, .15), new THREE.MeshLambertMaterial({ color: 0x1a1d25 }));
    const back = new THREE.Mesh(new THREE.BoxGeometry(.07, .003, .145), new THREE.MeshLambertMaterial({ color: 0xff5ea8 })); back.position.y = -.0075;
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .004, 10), new THREE.MeshBasicMaterial({ color: 0x050505 })); lens.position.set(.02, -.0105, .055);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(.066, .14), new THREE.MeshBasicMaterial({ color: 0x7fd3ff })); scr.rotation.x = -Math.PI / 2; scr.position.y = .0068;
    g.add(body, back, lens, scr); g.userData.ns = 1;
    const par = (P.mesh.elb && P.mesh.elb[1]) || P.mesh.parts[3]; g.position.set(0, -.34, .0); par.add(g); return g;
  }
  window.startSelfie = function () {
    if (!P.mesh || SELF) return;
    if (P.car || INT || mode !== 'play') { window.SNAP = 1; return; }
    SELF = { front: 1, last: performance.now(), busy: 0 };
    mode = 'phone'; J.x = J.y = 0; B.fire = 0;
    PHM = tryF(mkPhone);
    $('hud').classList.add('hid'); $('ctl').classList.add('hid'); $('sf').classList.remove('hid'); P.mesh.visible = true;
  };
  function endSelfie() {
    if (!SELF) return; SELF = null;
    if (PHM && PHM.parent) PHM.parent.remove(PHM); PHM = null;
    tryF(() => { P.mesh.parts[3].rotation.x = 0; if (P.mesh.elb) P.mesh.elb[1].rotation.x = 0; });
    $('sf').classList.add('hid'); $('hud').classList.remove('hid'); $('ctl').classList.remove('hid');
    $('sff').style.opacity = 0; if (mode === 'phone') mode = 'play';
  }
  $('sfx').onclick = endSelfie;
  $('sfl').onclick = () => { if (SELF) SELF.front = SELF.front ? 0 : 1; };
  $('sfs').onclick = () => {
    if (!SELF || SELF.busy) return; SELF.busy = 1; window.SNAP = 1;
    $('sff').style.opacity = .9; setTimeout(() => { $('sff').style.opacity = 0; }, 140); setTimeout(endSelfie, 1100);
  };
  function selfCam(now) {
    const dt = Math.min(.05, (now - SELF.last) / 1000); SELF.last = now;
    const k = 1 - Math.pow(.0015, dt), f = [Math.sin(P.a), Math.cos(P.a)], r = [f[1], -f[0]], y0 = P.flr ? (P.fy || 0) : 0;
    const fr = SELF.front;
    const tx = fr ? P.x + f[0] * 1.9 + r[0] * .6 : P.x - f[0] * 2.7 + r[0] * .5, tz = fr ? P.z + f[1] * 1.9 + r[1] * .6 : P.z - f[1] * 2.7 + r[1] * .5, ty = y0 + (fr ? 1.75 : 1.95);
    cam.position.x += (tx - cam.position.x) * k; cam.position.y += (ty - cam.position.y) * k; cam.position.z += (tz - cam.position.z) * k;
    cam.lookAt(fr ? P.x : P.x + f[0] * 4, y0 + (fr ? 1.55 : 1.4), fr ? P.z : P.z + f[1] * 4);
    tryF(() => { P.mesh.visible = true; P.mesh.parts[3].rotation.x = -1.5; if (P.mesh.elb) P.mesh.elb[1].rotation.x = -.7; });
  }

  /* ================= kanca noktalari ================= */
  const _step = step;
  step = function (now) {
    SKB = 1;
    _step(now);
    if (scene.fog) {
      const ff = Math.max(420, PF.stat + 60);
      if (scene.fog.far > ff) { scene.fog.far = ff; scene.fog.near = Math.min(scene.fog.near, Math.max(40, PF.stat * .45)); }
    }
    stStep();
    if (SELF) selfCam(now);
  };
  const _uw = updWorld;
  updWorld = function (dt) {
    if (mode === 'play') pedDodge();
    _uw(dt);
    if (FR % 24 === 0) farUnskin();
  };
})();
