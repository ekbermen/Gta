/* GTA 67 v8 - lastik izi, arkadaslar, sesli sohbet, Map ID (game.js + online2.js + v6/v7'den SONRA yuklenir) */
(() => {
  const tryF = f => { try { return f(); } catch (e) { return null; } };
  const el = (tag, id, cls, html) => { const e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ============ 1) DRIFT LASTIK IZLERI ============ */
  (() => {
    const N = 520, LIFE = 32;
    const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0b0b0d, transparent: true, opacity: .66, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const im = new THREE.InstancedMesh(g, mat, N);
    im.frustumCulled = false; im.renderOrder = 2; im.userData.ns = 1;
    const d = new THREE.Object3D();
    const birth = new Float32Array(N).fill(-1), PX = new Float32Array(N), PZ = new Float32Array(N), PY = new Float32Array(N), PL = new Float32Array(N);
    d.scale.set(0, 0, 0); d.updateMatrix();
    for (let i = 0; i < N; i++) im.setMatrixAt(i, d.matrix);
    scene.add(im);
    let idx = 0, last = [null, null], smokeT = 0, sndT = 0;
    const put = (i, w) => {
      d.position.set(PX[i], .07, PZ[i]); d.rotation.set(0, PY[i], 0); d.scale.set(w, 1, PL[i]); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
    };
    function add(x1, z1, x2, z2) {
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      const i = idx; idx = (idx + 1) % N;
      PX[i] = (x1 + x2) / 2; PZ[i] = (z1 + z2) / 2; PY[i] = Math.atan2(dx, dz); PL[i] = len + .18;
      birth[i] = performance.now() / 1000; put(i, .36); im.instanceMatrix.needsUpdate = true;
    }
    window.skidTick = (c, on, slip, dt) => {
      const fx = Math.sin(c.a), fz = Math.cos(c.a), rx = Math.cos(c.a), rz = -Math.sin(c.a);
      for (let k = 0; k < 2; k++) {
        const s = k ? 1 : -1, px = c.x - fx * 1.4 + rx * s * .95, pz = c.z - fz * 1.4 + rz * s * .95;
        if (!on) { last[k] = null; continue; }
        const L = last[k];
        if (!L) { last[k] = [px, pz]; continue; }
        const dd = Math.hypot(px - L[0], pz - L[1]);
        if (dd > .45) { if (dd < 6) add(L[0], L[1], px, pz); L[0] = px; L[1] = pz; }
      }
      if (on) {
        if ((smokeT -= dt) <= 0) { smokeT = .07; try { puff(c.x - fx * 1.6, .3, c.z - fz * 1.6, 0xd8d8d8); } catch (e) {} }
        if ((sndT -= dt) <= 0) { sndT = .28; try { sfx(.05, .14, 1500); } catch (e) {} }
      }
    };
    setInterval(() => {
      const now = performance.now() / 1000; let ch = 0;
      for (let i = 0; i < N; i++) {
        if (birth[i] < 0) continue;
        const age = now - birth[i];
        if (age > LIFE) { birth[i] = -1; d.scale.set(0, 0, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); ch = 1; }
        else if (age > LIFE - 6) { put(i, .36 * (LIFE - age) / 6); ch = 1; }
      }
      if (ch) im.instanceMatrix.needsUpdate = true;
    }, 300);
  })();

  /* ============ 2) MAP ID (oda kodu = harita kimligi, herkeste host'unkiyle ayni) ============ */
  let WIRE = null;
  const _om = onlMsg;
  onlMsg = function (m) {
    if (m.t === 'created' || m.t === 'joined') {
      NET.mapId = String(m.mapId || m.seed || ''); WIRE = m;
      _om(m);
      if (NET.mapId) { try { ONL_CODE = NET.mapId; showCode(); chm('Map ID: ' + NET.mapId); toast('Map ID: ' + NET.mapId); } catch (e) {} }
      FRD.hide(); FRD.hi();
      return;
    }
    if (m.t === 's' && m.mp && NET.mapId && WIRE && String(m.mp) !== NET.mapId) {   // sunucudaki Map ID farkliysa host'unkini al ve dunyayi yeniden kur
      NET.mapId = String(m.mp);
      try { NET.initWorld(Object.assign({}, WIRE, { seed: +m.mp, mapId: m.mp, h: m.h })); ONL_CODE = NET.mapId; showCode(); toast('Harita host ile eşitlendi: ' + NET.mapId); } catch (e) { console.warn(e); }
    }
    switch (m.t) {
      case 'hi': FRD.onHi(m); return;
      case 'fr': FRD.onList(m); return;
      case 'fr_res': FRD.onRes(m); return;
      case 'fr_note': try { toast(m.m); } catch (e) {} FRD.poll(); return;
      case 'v': VC.recv(m); return;
    }
    _om(m);
  };

  /* ============ 3) ARKADASLAR ============ */
  const TOK = () => tryF(() => localStorage.getItem('g67tok')) || '';
  const FRD = {
    on: 0, timer: 0, want: 0, data: null,
    say(t, bad) { const e = $('frm'); if (e) { e.textContent = t || ''; e.style.color = bad ? '#ff6b6b' : '#ffd23c'; } },
    hi() { if (typeof USR !== 'undefined' && USR) onlSend({ t: 'hi', u: USR, tok: TOK() }); },
    poll() { if (FRD.on) onlSend({ t: 'fr_list' }); },
    open() {
      if (typeof USR === 'undefined' || !USR) { FRD.want = 1; $('menu').classList.add('hid'); $('am').textContent = 'Arkadaşlar için kayıt ol veya giriş yap'; $('acc').classList.remove('hid'); return; }
      $('menu').classList.add('hid'); $('frs').classList.remove('hid'); FRD.on = 1;
      FRD.say('Sunucuya bağlanılıyor...');
      onlOpen(() => { FRD.say(''); FRD.hi(); FRD.poll(); });
      clearInterval(FRD.timer); FRD.timer = setInterval(() => FRD.poll(), 3000);
    },
    hide() { FRD.on = 0; clearInterval(FRD.timer); const e = $('frs'); if (e) e.classList.add('hid'); },
    back() { FRD.hide(); $('menu').classList.remove('hid'); },
    onHi(m) { if (!m.ok) FRD.say(m.why === 'taken' ? 'Bu kullanıcı adı başka bir cihazda kayıtlı.' : 'Kullanıcı adı geçersiz.', 1); },
    onRes(m) {
      const t = { sent: 'İstek gönderildi: ' + (m.u || ''), added: 'Arkadaş oldunuz: ' + (m.u || ''), nouser: 'Böyle bir kullanıcı yok (önce o oyuna girip hesap açmış olmalı)', already: 'Zaten arkadaşsınız', self: 'Kendini ekleyemezsin' }[m.m] || '';
      FRD.say(t, m.m === 'nouser' || m.m === 'already' || m.m === 'self');
    },
    onList(m) {
      FRD.data = m; const box = $('frl'); if (!box || !FRD.on) return;
      let h = '';
      if (m.req && m.req.length) {
        h += '<h3>İSTEKLER</h3>';
        for (const n of m.req) h += `<div class="fr"><b>${esc(n)}</b><span><button data-a="acc" data-u="${esc(n)}">KABUL</button><button data-a="dec" data-u="${esc(n)}">RED</button></span></div>`;
      }
      h += '<h3>ARKADAŞLAR</h3>';
      if (!m.friends || !m.friends.length) h += '<div class="fr"><i>Henüz arkadaşın yok. Yukarıdan kullanıcı adı yazıp ekle.</i></div>';
      for (const f of (m.friends || [])) {
        const r = f.room;
        h += `<div class="fr"><b><s class="${f.on ? 'on' : ''}"></s>${esc(f.u)}</b><small>${f.on ? (r ? esc(r.name) + ' • ' + r.n + '/' + r.max + (r.pw ? ' 🔒' : '') : 'Çevrimiçi') : 'Çevrimdışı'}</small><span>`
          + (r && r.n < r.max ? `<button data-a="join" data-c="${esc(r.code)}" data-p="${r.pw}">KATIL</button>` : '')
          + `<button data-a="del" data-u="${esc(f.u)}">SİL</button></span></div>`;
      }
      box.innerHTML = h;
    }
  };
  window.FRD = FRD;

  const ov = el('div', 'frs', 'ov hid',
    '<h2>ARKADAŞLAR</h2><div class="frAdd"><input id="fru" placeholder="Kullanıcı adı" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="mb" id="fra">EKLE</button></div><div id="frm"></div><div id="frl"></div><button class="mb" id="frb">GERİ</button>');
  document.body.appendChild(ov);
  const bFr = el('button', 'bFr', 'mb', 'ARKADAŞLAR');
  const bSet = $('bSet'); bSet.parentNode.insertBefore(bFr, bSet);
  bFr.onclick = () => FRD.open();
  $('frb').onclick = () => FRD.back();
  $('fra').onclick = () => { const u = $('fru').value.trim(); if (u.length < 3) return FRD.say('Kullanıcı adı en az 3 karakter', 1); onlOpen(() => { FRD.hi(); onlSend({ t: 'fr_add', to: u }); $('fru').value = ''; }); };
  $('fru').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('fra').onclick(); } });
  $('frl').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a, u = b.dataset.u;
    if (a === 'acc') onlSend({ t: 'fr_acc', from: u });
    else if (a === 'dec') onlSend({ t: 'fr_dec', from: u });
    else if (a === 'del') { if (confirm(u + ' arkadaşlıktan çıkarılsın mı?')) onlSend({ t: 'fr_del', who: u }); }
    else if (a === 'join') {
      let pw = ''; if (b.dataset.p === '1') { pw = prompt('Oda şifresi?') || ''; if (!pw) return; }
      LASTJOIN = b.dataset.c; FRD.say('Katılınıyor...');
      onlOpen(() => onlSend({ t: 'join', code: b.dataset.c, pw, name: onlName() }));
    }
  });
  new MutationObserver(() => { if (FRD.on) { const t = $('rc').textContent; if (t) FRD.say(t, /ulaşılamadı|Bağlanılamadı/.test(t)); } }).observe($('rc'), { childList: true, characterData: true, subtree: true });
  $('aBack').addEventListener('click', () => { FRD.want = 0; });
  setInterval(() => { if (FRD.want && typeof USR !== 'undefined' && USR) { FRD.want = 0; $('rmx').classList.add('hid'); $('acc').classList.add('hid'); FRD.open(); } }, 300);
  $('rBack') && $('rBack').addEventListener('click', () => { FRD.hide(); });

  /* ============ 4) SOHBET: YAZILI / SESLI ============ */
  const MU = { enc(s) { s = Math.max(-1, Math.min(1, s)); const sg = s < 0 ? 0x80 : 0; let x = Math.min(Math.abs(s) * 32767, 32635) + 132, e = 7; for (let m = 0x4000; (x & m) === 0 && e > 0; m >>= 1) e--; return (~(sg | (e << 4) | ((x >> (e + 3)) & 15))) & 255; },
    dec(b) { b = ~b & 255; const e = (b >> 4) & 7; let x = (((b & 15) << 3) + 132) << e; x -= 132; return ((b & 0x80) ? -x : x) / 32768; } };
  const VC = {
    on: 0, mute: 0, ctx: null, stream: null, proc: null, src: null, ob: [], acc: 0, cnt: 0, ph: 0, hang: 0, seq: 0, sp: {}, talk: {}, gain: null, busy: 0,
    ensureCtx() {
      if (!VC.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; VC.ctx = new C(); VC.gain = VC.ctx.createGain(); VC.gain.gain.value = 1.6; VC.gain.connect(VC.ctx.destination); }
      if (VC.ctx.state === 'suspended') VC.ctx.resume().catch(() => {});
      return VC.ctx;
    },
    recv(m) {
      const c = VC.ensureCtx(); if (!c || !m.d) return;
      let bin; try { bin = atob(m.d); } catch (e) { return; }
      const n = bin.length; if (!n) return;
      const buf = c.createBuffer(1, n, 16000), ch = buf.getChannelData(0);
      for (let k = 0; k < n; k++) ch[k] = MU.dec(bin.charCodeAt(k));
      const s = c.createBufferSource(); s.buffer = buf; s.connect(VC.gain);
      const st = VC.sp[m.i] || (VC.sp[m.i] = { next: 0 }), now = c.currentTime;
      if (st.next < now + .03) st.next = now + .14;
      if (st.next > now + 1.4) st.next = now + .14;
      s.start(st.next); st.next += buf.duration;
      VC.talk[m.i] = { n: m.n || 'Oyuncu', t: performance.now() };
    },
    async start() {
      if (VC.on || VC.busy) return; VC.busy = 1;
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Tarayıcı mikrofonu desteklemiyor (https gerekir)');
        const c = VC.ensureCtx(); if (!c) throw new Error('Ses desteklenmiyor');
        VC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        VC.src = c.createMediaStreamSource(VC.stream);
        VC.proc = c.createScriptProcessor(2048, 1, 1);
        const zero = c.createGain(); zero.gain.value = 0;
        VC.src.connect(VC.proc); VC.proc.connect(zero); zero.connect(c.destination);
        const ratio = c.sampleRate / 16000;
        VC.proc.onaudioprocess = e => {
          if (!VC.on || VC.mute || !ONL) { VC.ob.length = 0; return; }
          const inp = e.inputBuffer.getChannelData(0);
          for (let i = 0; i < inp.length; i++) {
            VC.acc += inp[i]; VC.cnt++; VC.ph += 1;
            if (VC.ph >= ratio) { VC.ph -= ratio; VC.ob.push(VC.acc / VC.cnt); VC.acc = 0; VC.cnt = 0; }
          }
          while (VC.ob.length >= 1024) {
            const ch = VC.ob.splice(0, 1024); let sum = 0; for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
            if (Math.sqrt(sum / ch.length) > .012) VC.hang = 7; else if (VC.hang > 0) VC.hang--; else continue;
            let s = ''; const by = new Uint8Array(ch.length); for (let i = 0; i < ch.length; i++) by[i] = MU.enc(ch[i] * 1.4);
            for (let i = 0; i < by.length; i += 4096) s += String.fromCharCode.apply(null, by.subarray(i, i + 4096));
            onlSend({ t: 'v', q: (VC.seq = (VC.seq + 1) & 0xffff), d: btoa(s) });
            VC.me = performance.now();
          }
        };
        VC.on = 1; VC.mute = 0; VC.upd(); try { toast('Sesli sohbet açık'); } catch (e) {}
      } catch (err) {
        VC.stop(); try { toast('Mikrofon açılamadı: ' + (err && err.message || err)); } catch (e) {}
      }
      VC.busy = 0;
    },
    stop() {
      VC.on = 0; VC.ob.length = 0;
      try { VC.proc && (VC.proc.onaudioprocess = null, VC.proc.disconnect()); } catch (e) {}
      try { VC.src && VC.src.disconnect(); } catch (e) {}
      try { VC.stream && VC.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
      VC.proc = VC.src = VC.stream = null; VC.upd();
    },
    upd() {
      const b = $('vcb'); if (!b) return;
      b.style.display = (VC.on && ONL) ? 'block' : 'none';
      b.textContent = VC.mute ? '🎤 SUSTURULDU' : '🎤 KONUŞ';
      b.className = VC.mute ? 'mute' : (VC.me && performance.now() - VC.me < 400 ? 'talk' : '');
      const t = $('vcb2'); if (t) t.textContent = VC.on ? 'SESLİ SOHBET: AÇIK (kapat)' : 'SESLİ SOHBET (mikrofon aç)';
    }
  };
  window.VC = VC;
  const vcb = el('button', 'vcb', '', '🎤'); vcb.style.display = 'none';
  vcb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); VC.mute ^= 1; VC.upd(); });
  document.body.appendChild(vcb);
  const vsp = el('div', 'vsp', ''); document.body.appendChild(vsp);
  setInterval(() => {
    VC.upd(); const now = performance.now(); let h = '';
    for (const i in VC.talk) { if (now - VC.talk[i].t < 700) h += '<div>🔊 ' + esc(VC.talk[i].n) + '</div>'; }
    vsp.innerHTML = h; vsp.style.display = h && ONL ? 'block' : 'none';
    if (!ONL && VC.on) VC.stop();
  }, 200);
  /* sesin calmasi icin tarayici ilk dokunusta ses motorunu uyandirir */
  addEventListener('pointerdown', () => { if (ONL) VC.ensureCtx(); }, { passive: true });

  const chc = el('div', 'chc', 'ov hid', '<h2>SOHBET</h2><button class="mb" id="chcT">YAZILI SOHBET</button><button class="mb" id="vcb2">SESLİ SOHBET</button><button class="mb" id="chcX">KAPAT</button>');
  document.body.appendChild(chc);
  function chcClose() { chc.classList.add('hid'); if (mode === 'chat' && $('cht').classList.contains('hid')) mode = 'play'; }
  function chcOpen() {
    if (mode !== 'play' || !ONL) return;
    mode = 'chat'; J.x = J.y = 0; B.fire = 0; chc.classList.remove('hid'); VC.upd();
  }
  $('chcT').onclick = () => { chc.classList.add('hid'); mode = 'play'; openChat(); };
  $('vcb2').onclick = () => { VC.ensureCtx(); if (VC.on) VC.stop(); else VC.start(); chcClose(); };
  $('chcX').onclick = chcClose;
  const hb = $('hChat'); if (hb) hb.onclick = () => { $('hubp').classList.add('hid'); chcOpen(); };
  addEventListener('keydown', e => { if (e.code === 'KeyT' && mode === 'play' && ONL && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); chcOpen(); } if (e.code === 'KeyV' && VC.on && mode === 'play') { VC.mute ^= 1; VC.upd(); } });
})();
