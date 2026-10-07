/* GTA 67 - cevrimici ortak dunya (game.js'ten SONRA yuklenir)
   - Herkes ayni NPC/trafik/arac renklerini, ayni trafik isigini, ayni gun saatini ve havayi gorur
   - Odadaki ilk oyuncu "host" olur: trafik + yayalari o simule eder, digerleri sunucu uzerinden alir
   - Koltuklar sunucuda tutulur: surucu / yan koltuk / arka koltuk, otomatik surus YOK
   - Oyuncular birbirine ates edebilir, can gider */
(() => {
  let NCARS = 36, NPEDS = 45;
  const angN = a => Math.atan2(Math.sin(a), Math.cos(a));
  const myIa = () => (INT ? (String(INT.t || '') + ':' + String(INT.n || '')).slice(0, 24) : '');
  const sid = x => String(x);

  function rebindRoad(c) {
    let best = null, bd = 1e9;
    for (const rd of roads) {
      const z = rd.ax === 'z', along = z ? c.z : c.x, lat = z ? c.x : c.z;
      if (along < rd.a0 || along > rd.a1) continue;
      const d = Math.abs(lat - rd.c);
      if (d < bd) { bd = d; best = rd; }
    }
    if (best && bd < best.w) {
      c.rd = best;
      const fx = Math.sin(c.a), fz = Math.cos(c.a);
      c.dir = ((best.ax === 'z' ? fz : fx) >= 0) ? 1 : -1;
    }
  }

  Object.assign(NET, {
    seats: {}, mySeat: -1, myNid: '', pend: null, t0: 0, cn: 0, W: [], Pd: [], cars: new Map(),
    lastW: 0, lastChk: 0, lastSat: 0, seatT: 0, bad: 0, lastRe: 0, rtt: -1, pt: 0, dsent: 0, by: '',

    /* ---- ortak saat: gun saati, hava, trafik isigi ---- */
    nt() { return (Date.now() + NOFF - NET.t0) / 1000; },
    hour() { return (9 + NET.nt() / 40) % 24; },
    rain() {
      const k = Math.floor(NET.nt() / 150);
      let h = (Math.imul(k + 1, 2654435761) ^ Math.imul(PSEED | 0, 40503)) >>> 0;
      h = (h ^ (h >>> 15)) >>> 0;
      return (h % 100) < 30 ? 1 : 0;
    },

    /* ---- odaya girince herkeste AYNI dunyayi kur ---- */
    initWorld(m) {
      NET.legacy = !(m && m.v >= 2);   // eski sunucu/relay koltuk sistemini bilmez
      NPEDS = m.npc != null ? Math.max(0, Math.min(250, m.npc | 0)) : 45; NCARS = m.car != null ? Math.max(0, Math.min(275, (m.car | 0) - 8)) : 36;
      PSEED = m.seed | 0; NET.t0 = +m.t0 || Date.now(); NOFF = (+m.now || Date.now()) - Date.now();
      if (P.car) exitCar();
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        if (c.drv || c.cop || c.taxi || c.own || c.air) continue;
        if (c.wid != null || (c.ai && c.rd) || (!c.ai && !c.vt && c.kind <= 3)) { scene.remove(c.m); cars.splice(i, 1); }
      }
      for (let i = peds.length - 1; i >= 0; i--) {
        const p = peds[i];
        if (!p.gang && !p.cop) { scene.remove(p.m); peds.splice(i, 1); }
      }
      NET.W = []; NET.Pd = []; NET.cars.clear(); NET.seats = {};
      const mk = (i, f) => {
        RS = rnd(((PSEED | 0) * 7 + i * 131 + 1) | 0); WIDN = i;
        let c; try { c = f(); } finally { RS = null; WIDN = null; }
        c.nid = 'w' + i; NET.cars.set(c.nid, c); NET.W[i] = c; return c;
      };
      mk(0, () => mkCar(0, '#c0392b', -41, -30, 0));
      mk(1, () => mkCar(1, '#2e86de', -49, -60, Math.PI));
      mk(2, () => mkCar(0, '#f1c40f', -20, -41, Math.PI / 2));
      for (let i = 3; i < 8; i++) mk(i, () => {
        const rd = roads[R() * roads.length | 0], t = rd.a0 + 15 + R() * (rd.a1 - rd.a0 - 30);
        return mkCar(R() * 2 | 0, cc[R() * cc.length | 0], rd.ax === 'z' ? rd.c + (rd.w / 2 - 2.2) : t, rd.ax === 'z' ? t : rd.c + (rd.w / 2 - 2.2), rd.ax === 'z' ? 0 : Math.PI / 2);
      });
      for (let i = 8; i < 8 + NCARS; i++) mk(i, () => trafficCar());
      for (let i = 0; i < NPEDS; i++) { PWID = i; try { NET.Pd[i] = addPed(); } finally { PWID = null; } }
      NETHOST = true; NET.setHost(m.h);
      NET.lastW = 0;
    },

    setHost(h) {
      const was = NETHOST;
      NETHOST = sid(h) === sid(MYID);
      if (NETHOST && !was) NET.becomeHost();
    },
    becomeHost() {
      for (const c of NET.W) if (c && !c.drv && !c.dead && c.ai && !NET.driverOf(c.nid)) rebindRoad(c);
    },

    /* ---- koltuklar ---- */
    driverOf(nid) {
      const e = nid && NET.seats[nid]; const d = e && e.a[0];
      return d && sid(d) !== sid(MYID) ? sid(d) : null;
    },
    capOf(c) { return (c.vt === 'bus' || c.kind === 6) ? 12 : (c.kind === 1 || c.kind === 5 || c.air) ? 2 : 4; },
    sit(c) {
      if (NET.pend && performance.now() - NET.pend.t < 1500) return;
      if (NET.legacy) { P.psg = 0; enter(c); return; }
      if (!c.nid) { c.nid = 'p' + MYID + '_' + (++NET.cn); }
      NET.cars.set(c.nid, c);
      const lx = Math.cos(c.a), lz = -Math.sin(c.a);
      const side = ((P.x - c.x) * lx + (P.z - c.z) * lz) > 0 ? -1 : 1;   // arabanin solundan mi sagindan mi bindin
      NET.pend = { c, t: performance.now() };
      onlSend({ t: 'sit', nid: c.nid, side, cap: NET.capOf(c), sp: [c.kind | 0, hex6(c.col), c.mdl || '', c.ci | 0, c.vt || ''] });
    },
    onSat(m) {
      NET.lastSat = NET.seatT = performance.now(); NET.bad = 0; NET.swapT = 0;
      const pend = NET.pend; NET.pend = null;
      if (pend && pend.c.nid === m.nid && !P.car) {
        const c = pend.c; NET.myNid = m.nid; NET.mySeat = m.seat | 0;
        if (NET.mySeat === 0) { P.psg = 0; enter(c); toast('Sürücü koltuğu'); }
        else { P.psg = 1; P.car = c; c.ai = 0; P.mesh.visible = false; P.seat = 0; toast(['', 'Yan koltuk', 'Sol arka koltuk', 'Sağ arka koltuk'][NET.mySeat] || ('Koltuk ' + (NET.mySeat + 1))); }
        return;
      }
      if (P.car && m.nid === NET.myNid) {                // koltuk degistirme cevabi
        const c = P.car, was = NET.mySeat; NET.mySeat = m.seat | 0;
        if (NET.mySeat === 0 && was !== 0) { P.psg = 0; c.drv = 1; c.ai = 0; toast('Sürücü koltuğu'); }
        else if (NET.mySeat !== 0 && was === 0) { c.drv = 0; P.psg = 1; DR.gas = DR.brk = DR.steer = 0; toast('Yolcu koltuğu'); }
        else if (NET.mySeat !== was) toast('Koltuk değişti');
      }
    },
    onNo() { NET.pend = null; toast('Araçta boş koltuk yok'); },
    unsit() { NET.myNid = ''; NET.mySeat = -1; NET.pend = null; onlSend({ t: 'unsit' }); },
    seatName() { return ['SÜRÜCÜ', 'YAN', 'SOL ARKA', 'SAĞ ARKA'][NET.mySeat] || (NET.mySeat >= 0 ? 'KOLTUK ' + (NET.mySeat + 1) : ''); },
    swap() {
      if (!P.car) return;
      const now = performance.now();
      if (NET.legacy) { toast('Bu sunucuda koltuk değiştirme yok (sunucuyu güncelle)'); return; }
      if (NET.swapT && now - NET.swapT < 500) return;
      if (!NET.myNid) { NET.myNid = P.car.nid || ''; if (!NET.myNid) { toast('Koltuk bilgisi yok, arabadan inip tekrar bin'); return; } }
      const e = NET.seats[NET.myNid], c = P.car;
      const n = e ? e.a.length : NET.capOf(c), cur = NET.mySeat >= 0 ? NET.mySeat : 0;
      let to = -1;
      for (let k = 1; k < n; k++) { const i = (cur + k) % n; if (!e || !e.a[i]) { to = i; break; } }
      if (to < 0) { toast('Boş koltuk yok'); return; }
      NET.swapT = now; const t0 = now;
      onlSend({ t: 'swap', seat: to });
      setTimeout(() => { if (NET.swapT === t0 && NET.lastSat < t0 && P.car === c) { NET.swapT = 0; toast('Sunucu koltuk değişimine yanıt vermedi'); } }, 2000);
    },
    onSeats(m) {
      NET.seats = m || {};
      for (const nid in NET.seats) { const c = NET.cars.get(nid); if (c && NET.seats[nid].a[0]) c.ai = 0; }
    },

    /* ---- uzak oyuncunun arabasi (dunya arabasi veya bindigi ozel arac) ---- */
    carFor(nid, x, z, a) {
      let c = NET.cars.get(nid); if (c) return c;
      const e = NET.seats[nid]; if (!e) return null;
      const sp = e.sp || [0, '#ffffff', '', 0, ''];
      c = mkCar(sp[0] | 0, hex6(sp[1]), x, z, a);
      c.ai = 0; c.cop = 0; c.nid = nid; c.spec = 1;
      if (sp[2] && c.mdl !== sp[2] && MD[sp[2]]) {
        try { if (c.mroot) c.m.remove(c.mroot); if (!c.pg.parent) c.m.add(c.pg); c.glb = 0; c.mdl = sp[2]; skin(c); } catch (err) { console.warn(err); }
      }
      if ((sp[3] | 0) && c.glb) paint(c, sp[3] | 0);
      NET.cars.set(nid, c); return c;
    },

    /* ---- her karede ---- */
    tick(dt) {
      const now = performance.now();
      if (P.psg && P.car) { P.x = P.car.x; P.z = P.car.z; P.a = P.car.a; }
      if (NET.pend && now - NET.pend.t > 3000) {
        const pc = NET.pend.c; NET.pend = null;
        if (!P.car && pc && !pc.dead && Math.hypot(pc.x - P.x, pc.z - P.z) < 9) { P.psg = 0; NET.seatT = now; enter(pc); toast('Sunucu geç yanıt verdi - araca yerel bindin'); }
        else toast('Sunucu yanıt vermedi');
      }
      if (NETHOST && now - NET.lastW >= 66) { NET.lastW = now; NET.sendW(); }
      if (now - NET.lastChk > 1000) {
        NET.lastChk = now;
        if (P.car && NET.myNid && !NET.pend && !NET.legacy && now - Math.max(NET.lastSat, NET.seatT) > 4000) {
          const e = NET.seats[NET.myNid], holder = e ? e.a[NET.mySeat] : 0;
          if (holder && sid(holder) === sid(MYID)) NET.bad = 0;
          else if (holder) { if (++NET.bad >= 3) { NET.bad = 0; exitCar(); } }      // koltugu gercekten baskasi almis
          else if (now - NET.lastRe > 3000) {                                         // sunucu bizi bilmiyor (lag): atma, yeniden kaydet
            NET.lastRe = now; NET.bad = 0; const c = P.car;
            onlSend({ t: 'sit', nid: NET.myNid, side: NET.mySeat === 0 ? -1 : 1, cap: NET.capOf(c), sp: [c.kind | 0, hex6(c.col), c.mdl || '', c.ci | 0, c.vt || ''] });
          }
        }
        for (const [nid, c] of NET.cars) {
          if (!cars.includes(c)) { NET.cars.delete(nid); continue; }
          if (c.spec && !c.drv && P.car !== c) {
            if (!NET.seats[nid]) { c.idle = (c.idle || 0) + 1; if (c.idle > 8) { scene.remove(c.m); cars.splice(cars.indexOf(c), 1); NET.cars.delete(nid); } } else c.idle = 0;
          }
        }
      }
    },

    /* ---- host: dunya durumunu gonder ---- */
    sendW() {
      const c = [];
      for (const k of NET.W) {
        if (!k || k.drv || NET.driverOf(k.nid)) continue;
        c.push(k.wid, Math.round(k.x * 10), Math.round(k.z * 10), Math.round(angN(k.a) * 100), Math.round((k.v || 0) * 10), Math.round(k.hp || 0), k.dead ? 1 : 0);
      }
      const p = [];
      for (const q of NET.Pd) {
        if (!q) { p.push(0, 0, 0, 0); continue; }
        p.push(Math.round(q.x * 10), Math.round(q.z * 10), Math.round(angN(q.a) * 100), q.dead ? 1 : 0);
      }
      onlSend({ t: 'w', c, p });
    },
    /* ---- host olmayan: gelen durumu uygula ---- */
    est(o, nx, nz, now) {   // iki paket arasindan hiz tahmini (ileri tahmin icin)
      const dp = (now - (o.tpt || now)) / 1000;
      if (o.tx != null && dp > .02 && dp < .5) { o.pvx = (nx - o.tx) / dp; o.pvz = (nz - o.tz) / dp; if (Math.hypot(o.pvx, o.pvz) > 60) o.pvx = o.pvz = 0; } else { o.pvx = o.pvz = 0; }
      o.tpt = now;
    },
    applyW(m) {
      const c = m.c || [], now = performance.now();
      for (let i = 0; i + 6 < c.length; i += 7) {
        const k = NET.W[c[i]]; if (!k || k.drv || NET.driverOf(k.nid)) continue;
        NET.est(k, c[i + 1] / 10, c[i + 2] / 10, now);
        k.tx = c[i + 1] / 10; k.tz = c[i + 2] / 10; k.ta = c[i + 3] / 100; k.v = c[i + 4] / 10; k.hp = c[i + 5]; if (c[i + 6]) k.tdead = 1; k.tg = 1;
      }
      const p = m.p || [];
      for (let i = 0; i < NET.Pd.length; i++) {
        const q = NET.Pd[i], o = i * 4; if (!q || o + 3 >= p.length) continue;
        NET.est(q, p[o] / 10, p[o + 1] / 10, now);
        q.tx = p[o] / 10; q.tz = p[o + 1] / 10; q.ta = p[o + 2] / 100; q.tdead = p[o + 3] ? 1 : 0; q.tg = 1;
      }
    },

    /* araba: baskasi suruyorsa / host degilsek sunucudan gelene yumusakca git (true = biz simule etmiyoruz) */
    ctl(c, dt) {
      const drv = NET.driverOf(c.nid);
      if (!drv) { if (c.wid == null || NETHOST) return false; if (!c.tg) return true; }
      else c.ai = 0;
      if (c.tx == null) return true;
      if (c.tdead && !c.dead) { c.dead = 1; try { dk(c); } catch (e) {} return true; }
      const el = Math.min(.1, (performance.now() - (c.tpt || 0)) / 1000), ptx = c.tx + (c.pvx || 0) * el, ptz = c.tz + (c.pvz || 0) * el;
      const dx = ptx - c.x, dz = ptz - c.z;
      if (dx * dx + dz * dz > 900) { c.x = c.tx; c.z = c.tz; }
      else { const k = Math.min(1, dt * 16); c.x += dx * k; c.z += dz * k; }
      c.a += angD(c.ta, c.a) * Math.min(1, dt * 16);
      c.roll += (0 - c.roll) * Math.min(1, dt * 6); c.pit += (0 - c.pit) * Math.min(1, dt * 6);
      return true;
    },
    /* yaya: host degilsek gelen konuma git */
    ped(p, dt) {
      if (NETHOST) return false;
      if (!p.tg) return true;
      if (p.tdead) { if (!p.dead) { p.dead = 1; p.t = 0; p.m.rotation.x = -Math.PI / 2; p.m.position.y = .25; } return true; }
      if (p.dead) {
        if (p.kt != null && tt - p.kt < 2) return true;
        p.dead = 0; p.m.rotation.x = 0; p.m.position.y = 0; p.x = p.tx; p.z = p.tz;
      }
      const el = Math.min(.1, (performance.now() - (p.tpt || 0)) / 1000), dx = p.tx + (p.pvx || 0) * el - p.x, dz = p.tz + (p.pvz || 0) * el - p.z, d = Math.hypot(dx, dz);
      if (d > 25) { p.x = p.tx; p.z = p.tz; } else { const k = Math.min(1, dt * 16); p.x += dx * k; p.z += dz * k; }
      p.a += angD(p.ta, p.a) * Math.min(1, dt * 16);
      p.ph += p.sp * dt * 2.2; swingPed(p.m, d > .06 ? Math.sin(p.ph) * .7 : 0);
      p.m.position.set(p.x, 0, p.z); p.m.rotation.y = p.a;
      pedVis(p);
      return true;
    },
    pk(p) { onlSend({ t: 'pk', i: p.wid }); },
    onPk(m) {
      const p = NET.Pd[m.i]; if (!p || p.dead) return;
      if (NETHOST) { p.dead = 1; p.t = 0; p.m.rotation.x = -Math.PI / 2; p.m.position.y = .25; }
      else { p.tdead = 1; p.tg = 1; }
    },

    /* ---- oyuncu <-> oyuncu savas ---- */
    targets() {
      const o = [P], ia = myIa();
      for (const id in RMT) { const r = RMT[id]; if (!r.inCar && (r.ia || '') === ia) o.push({ x: r.x, z: r.z }); }
      return o;
    },
    cands() {
      const o = [], ia = myIa();
      for (const id in RMT) {
        const r = RMT[id];
        if ((r.ia || '') !== ia || (r.hp != null && r.hp <= 0) || (r.nid && r.nid === NET.myNid)) continue;
        o.push({ x: r.x, z: r.z, rp: +id, rcar: r.inCar, hp: r.hp, dead: 0, cop: 0 });
      }
      return o;
    },
    hit(h, d) { onlSend({ t: 'hit', to: h.rp, d: Math.round(d) }); sfx(.1, .08, 1200); },
    shot(a, rng) { onlSend({ t: 'sh', x: +P.x.toFixed(1), z: +P.z.toFixed(1), a: +a.toFixed(2), l: Math.min(rng || 40, 80) }); },
    onHit(m) {
      if (mode !== 'play' || P.god || P.inf) return;
      P.hp -= m.d; NET.by = m.f || ''; shake = Math.max(shake, .35); sfx(.3, .2, 500);
    },
    onShot(m) {
      const dx = Math.sin(m.a), dz = Math.cos(m.a), l = m.l || 40;
      tracer(m.x + dx * .8, 1.3, m.z + dz * .8, m.x + dx * l, m.z + dz * l);
      if (Math.hypot(m.x - P.x, m.z - P.z) < 120) sfx(.25, .15, 2400);
    }
  });

  /* ---- uzak oyuncular: yurume / arabada, ayni mekanda olanlar gorunur ---- */
  updateRemotes = function (list) {
    const seen = {}, now = performance.now();
    for (const q of list) {
      seen[q.i] = 1;
      let r = RMT[q.i];
      if (!r) { r = RMT[q.i] = mkRemote(q); MATES.push(r); }
      if (r.n !== q.n) { r.n = q.n; r.root.remove(r.tag); r.tag = nameTag(q.n); r.root.add(r.tag); }
      r.c = q.col || r.c; NET.est(r, q.x, q.z, now); r.tx = q.x; r.tz = q.z; r.ta = q.a; r.t = now; r.cc = q.cc;
      r.hp = q.hp; r.ia = q.ia || ''; r.fy = q.fy || 0; r.v = q.v || 0; r.nid = q.nid || ''; r.seat = q.seat | 0;
      r.inCar = (q.c === 1 && r.nid) ? 1 : 0;
      if (r.fresh) { r.x = q.x; r.z = q.z; r.a = q.a; r.fresh = 0; }
      if (r.inCar && r.seat === 0) {
        const c = NET.carFor(r.nid, q.x, q.z, q.a);
        if (c) {
          NET.est(c, q.x, q.z, now); c.tx = q.x; c.tz = q.z; c.ta = q.a; c.v = q.v || 0; c.tg = 1;
          if (Array.isArray(q.k)) { c.hp = q.k[2]; if (q.k[3]) c.tdead = 1; }
        }
      }
    }
    for (const id in RMT) if (!seen[id] && now - RMT[id].t > 4000) rmRemote(id);
  };

  updRemotes = function (dt) {
    if (!ONL) return;
    dt = Math.max(dt, .001);
    const ia = myIa();
    for (const id in RMT) {
      const r = RMT[id], same = (r.ia || '') === ia;
      r.root.visible = same;
      if (!same) continue;
      const car = r.inCar ? NET.cars.get(r.nid) : null;
      if (car) {
        r.x = car.x; r.z = car.z; r.a = car.a; r.root.position.set(car.x, 0, car.z);
        r.m.visible = false; r.tag.position.y = 3.2 + (r.seat | 0) * .55;
        r.tag.visible = Math.hypot(r.x - cam.position.x, r.z - cam.position.z) < 90;
        continue;
      }
      const el = Math.min(.1, (performance.now() - (r.tpt || 0)) / 1000), ox = r.x, oz = r.z, dx = r.tx + (r.pvx || 0) * el - r.x, dz = r.tz + (r.pvz || 0) * el - r.z;
      if (Math.hypot(dx, dz) > 40) { r.x = r.tx; r.z = r.tz; } else { const k = Math.min(1, dt * 16); r.x += dx * k; r.z += dz * k; }
      r.a += angD(r.ta, r.a) * Math.min(1, dt * 16);
      r.spd += (Math.hypot(r.x - ox, r.z - oz) / dt - r.spd) * Math.min(1, dt * 8);
      if (!r.m.glb && PRDY && !r.up) { r.up = 1; const nm = rmPerson(r.id); if (nm.glb) { r.root.remove(r.m); r.m = nm; r.root.add(nm); } }
      r.root.position.set(r.x, (r.inCar && r.fy > 0) ? r.fy * 10 : (r.fy || 0), r.z); r.m.visible = true;
      const dead = r.hp != null && r.hp <= 0;
      r.m.rotation.y = r.a; r.m.rotation.x = dead ? -Math.PI / 2 : 0; r.m.position.y = dead ? .3 : 0;
      if (!dead && r.spd > .4) { r.ph += r.spd * dt * 2.2; swingPed(r.m, Math.sin(r.ph) * Math.min(.9, .35 + r.spd * .07)); } else swingPed(r.m, 0);
      r.tag.position.y = 2.4;
      r.tag.visible = Math.hypot(r.x - cam.position.x, r.z - cam.position.z) < 90;
    }
  };

  /* ---- mesaj yonlendirme ---- */
  const _om = onlMsg;
  onlMsg = function (m) {
    switch (m.t) {
      case 'created': case 'joined': _om(m); NET.initWorld(m); return;
      case 's': NET.setHost(m.h); _om(m); return;
      case 'host': NET.setHost(m.h); return;
      case 'seats': NET.onSeats(m.m); return;
      case 'sat': NET.onSat(m); return;
      case 'sitno': NET.onNo(m); return;
      case 'w': if (!NETHOST) NET.applyW(m); return;
      case 'hit': NET.onHit(m); return;
      case 'sh': NET.onShot(m); return;
      case 'pk': NET.onPk(m); return;
      case 'pong': if (NET.pt) { const r = performance.now() - NET.pt; NET.rtt = NET.rtt < 0 ? r : NET.rtt * .6 + r * .4; NET.pt = 0; } return;
      default: _om(m);
    }
  };
  /* taksi / satin alinan arac gibi yerel binmeler de sunucuya kaydedilsin (digerleri seni arabada gorsun) */
  const _en = enter;
  enter = function (c) {
    _en(c);
    NET.seatT = performance.now();
    if (ONL && !NET.myNid && P.car === c) {
      if (!c.nid) c.nid = 'p' + MYID + '_' + (++NET.cn);
      NET.cars.set(c.nid, c); NET.myNid = c.nid; NET.mySeat = 0;
      onlSend({ t: 'sit', nid: c.nid, side: -1, cap: NET.capOf(c), sp: [c.kind | 0, hex6(c.col), c.mdl || '', c.ci | 0, c.vt || ''] });
    }
  };
  const _ol = onlLeave;
  onlLeave = function () {
    if (P.car) { try { exitCar(); } catch (e) {} }
    _ol(); NETHOST = true; NET.myNid = ''; NET.mySeat = -1; NET.seats = {};
  };

  /* ---- konum gonderimi (10 Hz) ---- */
  setInterval(() => {
    if (!ONL) { if (P.psg) { P.psg = 0; if (P.car) { try { exitCar(); } catch (e) {} } } return; }
    const c = P.car; let a = c ? c.a : P.a; a = angN(a);
    onlSend({
      t: 'u', x: +(c ? c.x : P.x).toFixed(2), z: +(c ? c.z : P.z).toFixed(2), a: +a.toFixed(3), c: c ? 1 : 0,
      k: c ? [(c.ci | 0), clamp(c.kind | 0, 0, 3), Math.round(c.hp || 0), c.dead ? 1 : 0, 0, 0] : null,
      cc: c ? hex6(c.col) : '#ffffff', v: c ? +((c.v || 0)).toFixed(1) : 0, hp: Math.round(P.hp), ia: myIa(), fy: +((P.car && P.car.fly) ? Math.min(19, (P.car.alt || 0) / 10) : (P.flr ? (P.fy || 0) : 0)).toFixed(1)
    });
  }, 50);

  /* ---- olunce herkese haber ver ---- */
  setInterval(() => {
    if (!ONL) return;
    if (mode === 'dead' && !NET.dsent) { NET.dsent = 1; onlSend({ t: 'c', m: onlName() + (NET.by ? ', ' + NET.by + ' tarafından vuruldu' : ' öldü') }); NET.by = ''; }
    if (mode === 'play') NET.dsent = 0;
  }, 400);

  /* ---- ping (ms) + FPS gostergesi ---- */
  setInterval(() => { if (ONL) { NET.pt = performance.now(); onlSend({ t: 'ping' }); } else NET.rtt = -1; }, 2000);
  const pfb = document.createElement('div'); pfb.id = 'pfb';
  document.getElementById('hud').appendChild(pfb);
  setInterval(() => {
    if (mode === 'menu') { pfb.style.display = 'none'; return; }
    const fps = PF.fps | 0, ms = NET.rtt, on = ONL && ms >= 0;
    let t = fps + ' FPS' + (on ? ' • ' + Math.round(ms) + ' ms' : '') + (PF.lvl > 0 && S.auto ? ' • ▼' + PF.lvl : '');
    const bad = (on && ms >= 150) || fps < 25, mid = (on && ms >= 80) || fps < 45;
    pfb.style.color = bad ? '#ff5a5a' : mid ? '#ffd23c' : '#7bff5a';
    pfb.textContent = t; pfb.style.display = 'block';
  }, 500);
})();
