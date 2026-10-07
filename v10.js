/* GTA 67 v10 (v9.js'ten SONRA yuklenir)
   1) Telefon: Yilan, Google, Hesap makinesi, Notlar, Hava, Banka, Gorevler, Rehber, Saat
   2) Mekan yukseltmesi: her mekan farkli boyutta (kucuk / orta / buyuk), profesyonel ic dekor, tabela
   3) Anna, Charlie, Mark, Job: zorlu gorev veren karakterler
   4) Performans: uzak yayalar tek cizim, DOM yazma filtresi, daha akilli kare suresi yoneticisi
   (3. sahis yukari bakma: game.js icinde, ekrani dikey surukle) */
(() => {
  const tryF = f => { try { return f(); } catch (e) { return null; } };
  const lsGet = (k, d) => tryF(() => { const v = localStorage.getItem(k); return v == null ? d : v; }) ?? d;
  const lsSet = (k, v) => tryF(() => localStorage.setItem(k, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const addCss = t => { const s = document.createElement('style'); s.textContent = t; document.head.appendChild(s); };

  addCss(`
#phs{overflow-y:auto;-webkit-overflow-scrolling:touch}#pgrid{padding-bottom:16px}
.sn{display:flex;flex-direction:column;align-items:center;gap:6px}.snh{display:flex;justify-content:space-between;width:100%;font:700 14px Rajdhani,sans-serif;color:#9dff8a}
#snc{width:100%;max-width:270px;aspect-ratio:1;border-radius:10px;background:#0c1f12;border:2px solid #2b6b3a;touch-action:none}
.snp{display:flex;flex-direction:column;align-items:center;gap:4px}.snp div{display:flex;gap:4px}.snp button{width:46px;height:34px;border:0;border-radius:10px;background:#2b2f3d;color:#fff;font:700 16px Rajdhani,sans-serif}
.gl{display:flex;flex-direction:column;gap:6px}.glg{font:700 30px Arial,sans-serif;text-align:center;letter-spacing:-1px;margin:4px 0}
.gls{display:flex;gap:5px}.gls input{flex:1;min-width:0;border:0;border-radius:18px;padding:7px 11px;background:#fff;color:#111;font:600 14px Rajdhani,sans-serif}.gls button{border:0;border-radius:18px;background:#4285f4;color:#fff;padding:0 12px;font:700 13px Rajdhani,sans-serif}
.gres{background:#1d2030;border-radius:10px;padding:7px 9px;font:600 12px Rajdhani,sans-serif;line-height:1.25;display:flex;gap:7px}.gres img{width:46px;height:46px;object-fit:cover;border-radius:8px;flex:none}.gres b{display:block;color:#8ab4f8;font-size:14px}.gres small{color:#bdc1c6;display:block;font-size:11px;margin-top:2px}
.calc{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.calc button{height:clamp(30px,8.4vh,42px);border:0;border-radius:12px;background:#2b2f3d;color:#fff;font:700 18px Rajdhani,sans-serif}.calc button.op{background:#ff9f0a}.calc button.fn{background:#5a5f70}.calc button.eq{background:#27ae60}
#cd{background:#000;border-radius:10px;padding:8px;text-align:right;font:700 26px Rajdhani,sans-serif;min-height:34px;overflow:hidden}
.nt{width:100%;min-height:200px;box-sizing:border-box;border:0;border-radius:10px;background:#fffbe0;color:#222;padding:8px;font:600 14px Rajdhani,sans-serif;resize:none}
.wx{text-align:center}.wx b{font:400 40px Bungee,sans-serif}.wx .wr{display:flex;justify-content:space-between;background:#1d2030;border-radius:10px;padding:6px 10px;font:700 13px Rajdhani,sans-serif;margin-top:4px}
.mq-b{display:flex;gap:5px}.mq-b button{flex:1}
.stw{font:400 34px Bungee,sans-serif;text-align:center;margin:6px 0}
.pbig.r{background:#e74c3c;color:#fff}.pbig.s{padding:6px;font-size:13px}
#mqh{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 34px);z-index:29;max-width:min(86vw,420px);background:#000b;border:2px solid #ffd23c;border-radius:8px;padding:3px 10px;color:#fff;font:700 14px Rajdhani,sans-serif;text-align:center;display:none;pointer-events:none}#mqh b{color:#ffd23c}#mqh i{font-style:normal;color:#7bff5a}
#npcd{z-index:75;gap:8px}#npcd .nb{width:min(88vw,430px);background:#12142acc;border:3px solid #fff;border-radius:14px;padding:12px;text-align:left;color:#fff;font:600 16px Rajdhani,sans-serif}
#npcd .nh{display:flex;align-items:center;gap:10px;margin-bottom:6px}#npcd .av{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:400 28px Bungee,sans-serif;border:3px solid #fff}
#npcd h3{margin:0;font:400 22px Bungee,sans-serif;color:#ff9a3c}#npcd .rl{font-size:13px;opacity:.8}#npcd .st{color:#ffd23c;letter-spacing:2px}#npcd .rw{color:#7bff5a;font-weight:700}
#npcd .bt{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}#npcd .mb{width:min(40vw,200px);font-size:18px;padding:9px}
`);

  /* ================= 1) TELEFON UYGULAMALARI ================= */
  const svg = (inner) => '<svg viewBox="0 0 24 24">' + inner + '</svg>';
  Object.assign(PH_IC, {
    snk: svg('<path d="M5 17h9a3 3 0 000-6H9a1.5 1.5 0 010-3h9" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><circle cx="19" cy="8" r="1.3"/>'),
    ggl: svg('<text x="12" y="18.2" text-anchor="middle" font-family="Arial" font-weight="700" font-size="19" fill="#4285f4">G</text>'),
    cal: svg('<rect x="4" y="3" width="16" height="18" rx="3" fill="none" stroke="#fff" stroke-width="1.8"/><rect x="7" y="6" width="10" height="3.5" rx="1"/><circle cx="8.5" cy="13" r="1.2"/><circle cx="12" cy="13" r="1.2"/><circle cx="15.5" cy="13" r="1.2"/><circle cx="8.5" cy="17" r="1.2"/><circle cx="12" cy="17" r="1.2"/><circle cx="15.5" cy="17" r="1.2"/>'),
    not: svg('<path d="M6 3h9l4 4v14H6z" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M9 11h7M9 14h7M9 17h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'),
    hav: svg('<circle cx="9" cy="9" r="3.6"/><path d="M9 2.5v2M2.5 9h2M4.4 4.4l1.4 1.4M13.6 4.4l-1.4 1.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M8 20a4 4 0 010-8 5 5 0 019.6 1.3A3.4 3.4 0 0117 20z"/>'),
    bnk: svg('<path d="M12 2.5l9 4.5v2H3V7z"/><path d="M5 11h2.4v7H5zm5.8 0h2.4v7h-2.4zm5.8 0H19v7h-2.4zM3 19.5h18V22H3z"/>'),
    gor: svg('<path d="M5 5h14v15H5z" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M8 10l1.6 1.6L12.5 8.5M8 16l1.6 1.6 2.9-3.1M14.5 11h2.5M14.5 17H17" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    rhb: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0z"/>'),
    clk: svg('<circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 6.5V12l3.6 2.2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>')
  });
  PH_APPS.push(
    ['ggl', 'Google', 'linear-gradient(#ffffff,#d9dde6)', '#e8eaf0'],
    ['snk', 'Yılan', 'linear-gradient(#58d86e,#0f6b2c)', '#1c9c45'],
    ['gor', 'Görevler', 'linear-gradient(#ff9a3c,#e0457b)', '#e8652f'],
    ['rhb', 'Rehber', 'linear-gradient(#9a9aa0,#4a4a52)', '#6a6a72'],
    ['cal', 'Hesap Mak.', 'linear-gradient(#ffa63c,#ff6a00)', '#ff8a1f'],
    ['not', 'Notlar', 'linear-gradient(#ffe36a,#e0a800)', '#f2c400'],
    ['hav', 'Hava', 'linear-gradient(#4aa8ff,#2b4fd6)', '#3a7be8'],
    ['bnk', 'Banka', 'linear-gradient(#2fd3a6,#0a7c66)', '#17a58a'],
    ['clk', 'Saat', 'linear-gradient(#3a3a42,#0d0d10)', '#5a5a64']
  );
  const rebuildGrid = () => {
    $('pgrid').innerHTML = PH_APPS.map(a => `<button class="pap" data-a="${a[0]}"><span class="pic" style="background:${a[2]};--cut:${a[3]}">${PH_IC[a[0]]}</span>${a[1]}</button>`).join('');
  };

  /* ---- Yilan ---- */
  const SN = { t: 0 };
  PH_VIEW.snk = c => {
    clearInterval(SN.t);
    c.innerHTML = '<div class="sn"><div class="snh"><span>Skor: <b id="snS">0</b></span><span id="snB"></span></div><canvas id="snc" width="270" height="270"></canvas><div class="snp"><button data-d="U">▲</button><div><button data-d="L">◀</button><button data-d="D">▼</button><button data-d="R">▶</button></div></div><button id="snN" class="pbig g">YENİ OYUN</button></div>';
    const cv = $('snc'), g = cv.getContext('2d'), N = 15, CS = 18;
    let best = +lsGet('g67snk', 0) | 0; $('snB').textContent = 'Rekor: ' + best;
    let body, dir, nd, food, score, alive, speed;
    const DV = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
    const place = () => { for (let k = 0; k < 300; k++) { const f = [Math.random() * N | 0, Math.random() * N | 0]; if (!body.some(b => b[0] === f[0] && b[1] === f[1])) return f; } return [0, 0]; };
    const draw = () => {
      g.fillStyle = '#0c1f12'; g.fillRect(0, 0, 270, 270);
      g.fillStyle = '#10301b'; for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) & 1) g.fillRect(x * CS, y * CS, CS, CS);
      if (food) { g.fillStyle = '#ff4d5e'; g.beginPath(); g.arc(food[0] * CS + 9, food[1] * CS + 9, 6.5, 0, 7); g.fill(); g.fillStyle = '#7bff5a'; g.fillRect(food[0] * CS + 8, food[1] * CS + 1, 2, 4); }
      body.forEach((b, i) => { g.fillStyle = i ? `hsl(${130 - Math.min(40, i * 2)},70%,${48 - Math.min(14, i)}%)` : '#b6ff8a'; g.beginPath(); g.roundRect ? g.roundRect(b[0] * CS + 1, b[1] * CS + 1, CS - 2, CS - 2, i ? 5 : 7) : g.rect(b[0] * CS + 1, b[1] * CS + 1, CS - 2, CS - 2); g.fill(); });
      if (body.length) { const h = body[0]; g.fillStyle = '#111'; g.fillRect(h[0] * CS + 4, h[1] * CS + 5, 3, 3); g.fillRect(h[0] * CS + 11, h[1] * CS + 5, 3, 3); }
      if (!alive) { g.fillStyle = '#000a'; g.fillRect(0, 0, 270, 270); g.fillStyle = '#fff'; g.font = '700 26px Rajdhani,sans-serif'; g.textAlign = 'center'; g.fillText(score ? 'OYUN BİTTİ' : 'HAZIR', 135, 130); g.font = '600 14px Rajdhani,sans-serif'; g.fillText(score ? 'Skor ' + score : 'Ok / kaydır ile yönlendir', 135, 154); }
    };
    const start = () => {
      body = [[7, 7], [6, 7], [5, 7]]; dir = nd = 'R'; score = 0; alive = true; speed = 150; $('snS').textContent = 0; food = place(); draw();
      clearInterval(SN.t); SN.t = setInterval(tick, speed);
    };
    const over = () => {
      alive = false; clearInterval(SN.t);
      if (score > best) { best = score; lsSet('g67snk', best); $('snB').textContent = 'Rekor: ' + best; }
      const r = Math.min(300, score * 5); if (r > 0) { P.money += r; toast('Yılan ödülü +$' + r); }
      draw();
    };
    function tick() {
      if (!document.body.contains(cv) || $('ph').classList.contains('hid') || phCur !== 'snk') { clearInterval(SN.t); return; }
      const o = DV[nd]; if (!(o[0] + DV[dir][0] === 0 && o[1] + DV[dir][1] === 0)) dir = nd;
      const d = DV[dir], h = [body[0][0] + d[0], body[0][1] + d[1]];
      if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || body.some(b => b[0] === h[0] && b[1] === h[1])) return over();
      body.unshift(h);
      if (food && h[0] === food[0] && h[1] === food[1]) {
        score++; $('snS').textContent = score; food = place();
        const ns = Math.max(70, 150 - score * 4); if (ns !== speed) { speed = ns; clearInterval(SN.t); SN.t = setInterval(tick, speed); }
        tryF(() => tone(520 + score * 12, .06, 'square', .04));
      } else body.pop();
      draw();
    }
    const steer = k => { if (DV[k]) nd = k; };
    c.querySelector('.snp').onclick = e => { const b = e.target.closest('button'); if (b) steer(b.dataset.d); };
    let sx = 0, sy = 0;
    cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    cv.addEventListener('pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) < 18) return; steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); });
    $('snN').onclick = start;
    if (!PH_VIEW.snk.kb) {
      PH_VIEW.snk.kb = 1;
      addEventListener('keydown', e => {
        if (phCur !== 'snk') return;
        const m = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', KeyW: 'U', KeyS: 'D', KeyA: 'L', KeyD: 'R' }[e.code];
        if (m) { steer(m); e.preventDefault(); }
      });
    }
    body = []; food = null; score = 0; alive = false; draw();
  };

  /* ---- Google (Vikipedi destekli arama + gercek Google'a ac) ---- */
  const TIPS = [
    [/taksi/i, 'Taksi: Telefon > Taksi uygulamasından haritadan yer seç, taksi seni götürür. 100\'ü de arayabilirsin.'],
    [/polis|yıldız|yildiz|arama/i, 'Polis: sivillere ya da polise zarar verirsen yıldız kazanırsın. Karakoldan sicilini temizleyebilirsin.'],
    [/para|zengin/i, 'Para: işler (taksi, kurye, fabrika), dükkan soygunu ve Anna, Charlie, Mark, Job görevleri.'],
    [/ev |emlak|ev$/i, 'Ev: Emlak\'tan satın al, "Evim" yerine git. Yatakta uyuyunca canın dolar.'],
    [/map id|harita kimli/i, 'Map ID: 7 haneli harita kimliği. Odada herkes host\'un Map ID\'sini kullanır.'],
    [/ses|mikrofon/i, 'Sesli sohbet: SOHBET > SESLİ SOHBET. V tuşu mikrofonu kapatır/açar.']
  ];
  PH_VIEW.ggl = c => {
    c.innerHTML = '<div class="gl"><div class="glg"><span style="color:#4285f4">G</span><span style="color:#ea4335">o</span><span style="color:#fbbc05">o</span><span style="color:#4285f4">g</span><span style="color:#34a853">l</span><span style="color:#ea4335">e</span></div><div class="gls"><input id="gq" placeholder="Ara..." autocomplete="off" autocapitalize="off"><button id="gb">ARA</button></div><div id="gr"><div class="pcard"><b>İpucu</b>Bir şey yaz: Vikipedi sonuçları burada çıkar. "Google\'da aç" ile gerçek Google tarayıcıda açılır.</div></div></div>';
    const out = $('gr');
    const card = (t, s, img, url) => {
      const d = document.createElement('div'); d.className = 'gres';
      if (img) { const i = document.createElement('img'); i.src = img; i.alt = ''; d.appendChild(i); }
      const w = document.createElement('div'); const b = document.createElement('b'); b.textContent = t; w.appendChild(b); const sm = document.createElement('small'); sm.textContent = s; w.appendChild(sm); d.appendChild(w);
      if (url) d.onclick = () => window.open(url, '_blank', 'noopener');
      return d;
    };
    const run = async () => {
      const q = $('gq').value.trim(); if (!q) return;
      out.innerHTML = ''; const gb = document.createElement('button'); gb.className = 'pbig b s'; gb.textContent = 'Google\'da aç ↗'; gb.onclick = () => window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank', 'noopener'); out.appendChild(gb);
      for (const [re, tx] of TIPS) if (re.test(q)) { const d = document.createElement('div'); d.className = 'pcard'; d.innerHTML = '<b>Oyun ipucu</b>'; d.appendChild(document.createTextNode(tx)); out.appendChild(d); break; }
      const wait = document.createElement('div'); wait.className = 'pcard'; wait.textContent = 'Aranıyor...'; out.appendChild(wait);
      try {
        const u = 'https://tr.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=6&gsrsearch=' + encodeURIComponent(q) + '&prop=extracts|pageimages&exintro=1&explaintext=1&exsentences=2&exlimit=max&piprop=thumbnail&pithumbsize=120';
        const r = await fetch(u), j = await r.json(), pg = Object.values((j.query || {}).pages || {}).sort((a, b) => a.index - b.index);
        wait.remove();
        if (!pg.length) { const d = document.createElement('div'); d.className = 'pcard'; d.textContent = 'Sonuç bulunamadı.'; out.appendChild(d); }
        for (const p of pg) out.appendChild(card(p.title, p.extract || '', p.thumbnail && p.thumbnail.source, 'https://tr.wikipedia.org/?curid=' + p.pageid));
      } catch (e) { wait.textContent = 'İnternete ulaşılamadı. "Google\'da aç" düğmesini dene.'; }
    };
    $('gb').onclick = run; $('gq').onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') run(); };
  };

  /* ---- Hesap makinesi ---- */
  PH_VIEW.cal = c => {
    c.innerHTML = '<div id="cd">0</div><div class="calc">' + ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', '.', '='].map(k => `<button class="${'÷×−+'.includes(k) ? 'op' : k === '=' ? 'eq' : 'C⌫%±'.includes(k) ? 'fn' : ''}">${k}</button>`).join('') + '</div>';
    let cur = '0', acc = null, op = null, fresh = false;
    const show = () => { $('cd').textContent = cur.length > 12 ? (+cur).toPrecision(8) : cur; };
    const fmt = v => String(parseFloat((+v).toPrecision(10)));
    const calc = (a, b, o) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b ? a / b : NaN) : b;
    c.querySelector('.calc').onclick = e => {
      const k = e.target.textContent; if (e.target.tagName !== 'BUTTON') return;
      if (/\d/.test(k)) { cur = (fresh || cur === '0') ? k : cur + k; fresh = false; }
      else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
      else if (k === 'C') { cur = '0'; acc = null; op = null; fresh = false; }
      else if (k === '⌫') cur = cur.length > 1 ? cur.slice(0, -1) : '0';
      else if (k === '±') cur = fmt(-cur);
      else if (k === '%') cur = fmt(cur / 100);
      else if (k === '=') { if (op != null && acc != null) { cur = fmt(calc(acc, +cur, op)); acc = null; op = null; fresh = true; } }
      else { if (op != null && acc != null && !fresh) { cur = fmt(calc(acc, +cur, op)); } acc = +cur; op = k; fresh = true; }
      if (cur === 'NaN') cur = 'Hata'; show();
    };
  };

  /* ---- Notlar ---- */
  PH_VIEW.not = c => {
    c.innerHTML = '<textarea class="nt" id="ntx" placeholder="Not yaz..."></textarea>';
    const t = $('ntx'); t.value = lsGet('g67note', '');
    t.oninput = () => lsSet('g67note', t.value); t.onkeydown = e => e.stopPropagation();
  };

  /* ---- Hava ---- */
  PH_VIEW.hav = c => {
    const tmp = h => Math.round(13 + 9 * Math.sin((h - 9) / 24 * Math.PI * 2));
    const h0 = Math.floor(hour);
    const rows = [1, 2, 3, 4, 5].map(i => { const h = (h0 + i * 2) % 24; return `<div class="wr"><span>${String(h).padStart(2, '0')}:00</span><span>${tmp(h)}°</span><span>${rainOn ? (i < 3 ? 'Yağmurlu' : 'Parçalı') : (i === 4 ? 'Hafif yağış ihtimali' : 'Açık')}</span></div>`; }).join('');
    c.innerHTML = `<div class="wx"><div style="font:700 13px Rajdhani,sans-serif;opacity:.8">GTA 67 Şehri</div><b>${tmp(hour)}°</b><div style="font:700 15px Rajdhani,sans-serif">${rainOn ? 'Yağmurlu' : (hour > 6 && hour < 19 ? 'Güneşli' : 'Açık gece')}</div></div>${rows}`;
  };

  /* ---- Banka ---- */
  PH_VIEW.bnk = c => {
    const draw = () => {
      c.innerHTML = `<div class="pcard"><b>Cüzdan</b>$${P.money | 0}</div><div class="pcard"><b>Banka hesabı (dakikada %1 faiz)</b>$${BNK | 0}</div>
      <div class="mq-b"><button class="pbig g s" data-a="d100">Yatır 100</button><button class="pbig g s" data-a="d500">Yatır 500</button><button class="pbig g s" data-a="dall">Hepsi</button></div>
      <div class="mq-b"><button class="pbig b s" data-a="c100">Çek 100</button><button class="pbig b s" data-a="c500">Çek 500</button><button class="pbig b s" data-a="call">Hepsi</button></div>`;
      c.onclick = e => {
        const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a, n = a.slice(1) === 'all' ? Infinity : +a.slice(1);
        if (a[0] === 'd') { const m = Math.min(n, Math.max(0, P.money | 0)); P.money -= m; BNK += m; }
        else { const m = Math.min(n, BNK | 0); BNK -= m; P.money += m; }
        draw();
      };
    };
    draw();
  };

  /* ---- Saat / kronometre ---- */
  const CK = { t: 0, run: 0, base: 0, at: 0 };
  PH_VIEW.clk = c => {
    clearInterval(CK.t);
    c.innerHTML = `<div class="pcard"><b>Oyun saati</b><span id="ckg">${phTime()}</span></div><div class="stw" id="ckw">00:00.0</div><div class="mq-b"><button id="ck1" class="pbig g">BAŞLAT</button><button id="ck2" class="pbig r">SIFIRLA</button></div>`;
    const upd = () => { if (phCur !== 'clk') { clearInterval(CK.t); return; } const ms = CK.base + (CK.run ? performance.now() - CK.at : 0); $('ckw').textContent = String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0') + '.' + Math.floor(ms / 100) % 10; $('ckg').textContent = phTime(); };
    $('ck1').onclick = () => { if (CK.run) { CK.base += performance.now() - CK.at; CK.run = 0; $('ck1').textContent = 'DEVAM'; } else { CK.at = performance.now(); CK.run = 1; $('ck1').textContent = 'DURDUR'; } };
    $('ck2').onclick = () => { CK.run = 0; CK.base = 0; $('ck1').textContent = 'BAŞLAT'; upd(); };
    CK.t = setInterval(upd, 100); upd();
  };
  rebuildGrid();
  window.__v10phone = { rebuildGrid };

  /* ================= 2) MEKAN YUKSELTMESI ================= */
  /* [yarim genislik, tavan yuksekligi]: kucuk dukkanlar 18 m, orta 26 m, buyuk 40-52 m genisliginde */
  const VSZ = {
    casino: [26, 8], hastane: [26, 7], market: [22, 6], galeri: [22, 6.5], garage: [22, 6], sinema: [22, 7.2], tiyatro: [22, 7.6], bowling: [22, 6.5], muze: [22, 7.2],
    otel: [20, 6.2], banka: [20, 6], club: [20, 6], gym: [20, 6], havuz: [20, 6.5], kutuphane: [20, 6.5], mod: [20, 6], ammu: [18, 5.4], clothes: [18, 5.4], food: [18, 5.4],
    itfaiye: [18, 5.6], karakol: [18, 5.6], arcade: [16, 5], bilardo: [16, 5], hamam: [16, 5], emlak: [15, 5], benzinlik: [13, 4.6], yikama: [13, 4.6], lastikci: [11, 4.2],
    pharm: [11, 4.2], cafe: [11, 4.2], firin: [10, 4], oyuncak: [10, 4], petshop: [10, 4], kitapci: [10, 4], balik: [10, 4],
    berber: [9, 3.8], kuyumcu: [9, 3.8], dondurma: [9, 3.8], cicekci: [9, 3.8], parfum: [9, 3.8], telefon: [9, 3.8], dovme: [9, 3.8]
  };
  const CAT = {
    market: 'retail', clothes: 'retail', ammu: 'retail', pharm: 'retail', oyuncak: 'retail', parfum: 'retail', kitapci: 'retail', telefon: 'retail', petshop: 'retail', cicekci: 'retail', firin: 'retail',
    mod: 'auto', galeri: 'auto', garage: 'auto', lastikci: 'auto', yikama: 'auto', benzinlik: 'auto', food: 'food', cafe: 'food', balik: 'food', dondurma: 'food',
    casino: 'casino', club: 'club', arcade: 'arcade', bilardo: 'arcade', bowling: 'bowl', sinema: 'cinema', tiyatro: 'cinema', hastane: 'med', banka: 'bank', gym: 'gym',
    havuz: 'pool', hamam: 'pool', kutuphane: 'lib', muze: 'museum', otel: 'hotel', emlak: 'office', karakol: 'office', itfaiye: 'office', berber: 'salon', dovme: 'salon', kuyumcu: 'jewel'
  };
  const FK = { casino: 'carpet', sinema: 'carpet2', tiyatro: 'carpet2', club: 'dark', gym: 'rubber', garage: 'conc', mod: 'conc', lastikci: 'conc', yikama: 'conc', benzinlik: 'conc', itfaiye: 'conc', kutuphane: 'wood', food: 'wood', cafe: 'wood', otel: 'wood', balik: 'wood', firin: 'wood', bilardo: 'wood', tiyatro2: 'wood', havuz: 'blue', hamam: 'blue', muze: 'marble', banka: 'marble', hastane: 'tile' };
  const LM = new Map(), FT = new Map();
  const lam = c => { let m = LM.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: c }); LM.set(c, m); } return m; };
  const bas = c => { const k = 'b' + c; let m = LM.get(k); if (!m) { m = new THREE.MeshBasicMaterial({ color: c }); LM.set(k, m); } return m; };
  const dark = (c, f) => { const r = ((c >> 16) & 255) * f, g = ((c >> 8) & 255) * f, b = (c & 255) * f; return (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b); };
  function floorTex(kind) {
    let t = FT.get(kind); if (t) return t;
    t = ct(128, 128, g => {
      const fill = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      if (kind === 'wood') { for (let i = 0; i < 8; i++) { fill(['#9a6b3c', '#8b5e34', '#a8764a', '#93653a'][i % 4], 0, i * 16, 128, 16); fill('#5a3a1c', 0, i * 16, 128, 1.5); fill('#5a3a1c', (i * 37) % 128, i * 16, 1.5, 16); } }
      else if (kind === 'carpet' || kind === 'carpet2') { fill(kind === 'carpet' ? '#5a0f1a' : '#14213d', 0, 0, 128, 128); g.fillStyle = kind === 'carpet' ? '#c9a227' : '#3a4f8a'; for (let x = 0; x < 128; x += 32) for (let y = 0; y < 128; y += 32) { g.beginPath(); g.moveTo(x + 16, y + 6); g.lineTo(x + 26, y + 16); g.lineTo(x + 16, y + 26); g.lineTo(x + 6, y + 16); g.fill(); } }
      else if (kind === 'conc') { fill('#7d8088', 0, 0, 128, 128); for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < .5 ? '#70737a' : '#8b8e95'; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); } fill('#5d6066', 0, 63, 128, 2); fill('#5d6066', 63, 0, 2, 128); }
      else if (kind === 'dark') { fill('#140f1c', 0, 0, 128, 128); g.fillStyle = '#241a33'; for (let x = 0; x < 128; x += 32) for (let y = 0; y < 128; y += 32) if (((x + y) / 32) & 1) g.fillRect(x, y, 32, 32); }
      else if (kind === 'rubber') { fill('#2a2d33', 0, 0, 128, 128); g.fillStyle = '#3a3e46'; for (let x = 4; x < 128; x += 16) for (let y = 4; y < 128; y += 16) g.fillRect(x, y, 3, 3); }
      else if (kind === 'blue') { for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) fill((x + y) & 1 ? '#bfe6f7' : '#8fd0ee', x * 32, y * 32, 32, 32); g.fillStyle = '#ffffffaa'; for (let i = 0; i < 4; i++) { g.fillRect(i * 32, 0, 1.5, 128); g.fillRect(0, i * 32, 128, 1.5); } }
      else if (kind === 'marble') { for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) fill((x + y) & 1 ? '#e9e6df' : '#d7d3c9', x * 64, y * 64, 64, 64); g.strokeStyle = '#b9b4a8'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * 128, 0); g.lineTo(Math.random() * 128, 128); g.stroke(); } fill('#a6a194', 0, 63, 128, 2); fill('#a6a194', 63, 0, 2, 128); }
      else { for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) fill((x + y) & 1 ? '#d9dbe0' : '#c6c9d0', x * 32, y * 32, 32, 32); g.fillStyle = '#9a9ea8'; for (let i = 0; i < 4; i++) { g.fillRect(i * 32, 0, 1, 128); g.fillRect(0, i * 32, 128, 1); } }
    });
    FT.set(kind, t); return t;
  }
  function signTex(text, col, w, h) {
    return ct(w, h, g => {
      const hx = '#' + (col >>> 0).toString(16).padStart(6, '0'), r = 18;
      g.fillStyle = '#10121c'; g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.fill();
      g.strokeStyle = hx; g.lineWidth = 8; g.beginPath(); g.moveTo(r + 4, 4); g.arcTo(w - 4, 4, w - 4, h - 4, r); g.arcTo(w - 4, h - 4, 4, h - 4, r); g.arcTo(4, h - 4, 4, 4, r); g.arcTo(4, 4, w - 4, 4, r); g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = hx; g.shadowBlur = 14;
      let fs = h * .5; g.font = `400 ${fs}px Bungee,Impact,sans-serif`; while (g.measureText(text).width > w - 50 && fs > 14) { fs -= 3; g.font = `400 ${fs}px Bungee,Impact,sans-serif`; }
      g.fillText(text, w / 2, h / 2 + 3);
    });
  }
  function artTex(seed) {
    return ct(64, 80, g => {
      const r = rnd(seed * 977 + 13); g.fillStyle = ['#f4ead2', '#e8e1f0', '#dbeadf'][seed % 3]; g.fillRect(0, 0, 64, 80);
      for (let i = 0; i < 7; i++) { g.fillStyle = `hsl(${r() * 360},65%,${35 + r() * 30}%)`; const w = 8 + r() * 30, h = 8 + r() * 30; g.fillRect(4 + r() * (56 - w), 4 + r() * (72 - h), w, h); }
      g.strokeStyle = '#5a4020'; g.lineWidth = 4; g.strokeRect(2, 2, 60, 76);
    });
  }

  const _buildRoom = buildRoom;
  buildRoom = function (t) {
    _buildRoom(t);
    try { upgradeRoom(t); } catch (e) { console.warn('v10 mekan', e); RHX = 13; RHZ = 10; RHY = 4.6; }
  };

  function upgradeRoom(t) {
    if (t === 'home') { RHX = 13; RHZ = 10; RHY = 4.6; return; }
    const [hw, H] = VSZ[t] || [13, 4.6], cat = CAT[t] || 'misc';
    RHX = hw; RHZ = 10; RHY = H;
    const [wc, cc] = RC[t] || [0xdddddd, 0x886644], acc = (PI[t] && PI[t][2]) || cc, W = hw * 2, D = 20;
    // eski kabuk (zemin, tavan, 4 duvar) imzayla bulunup silinir
    for (const o of ROOM.children.slice()) {
      if (!o.isMesh) continue; const sc = o.scale, nx = Math.abs(sc.x - 26) < .15, nz = Math.abs(sc.z - 20) < .15;
      if ((nx && nz && sc.y < .35) || (nx && Math.abs(sc.z - .4) < .06 && Math.abs(sc.y - 4.5) < .1) || (Math.abs(sc.x - .4) < .06 && nz && Math.abs(sc.y - 4.5) < .1)) ROOM.remove(o);
    }
    if (hw < 12.5) {   // dar mekan: tasan esyalari iceri kaydir, buyukleri sil
      const lim = hw - .35;
      for (const o of ROOM.children.slice()) {
        if (!o.isMesh) continue; const ax = Math.abs(o.position.x - R0X), ex = ax + o.scale.x / 2;
        if (ex > lim && o.position.y < H) { if (o.scale.x > 4.2) ROOM.remove(o); else o.position.x -= Math.sign(o.position.x - R0X) * (ex - lim); }
      }
      for (const q of PLAYS) if (Math.abs(q.x) > hw - 2.4) q.x = Math.sign(q.x) * (hw - 2.4);
    }
    const bx = (sx, sy, sz, x, y, z, col, em) => { const m = new THREE.Mesh(gBox, em ? bas(col) : lam(col)); m.scale.set(sx, sy, sz); m.position.set(R0X + x, y, R0Z + z); ROOM.add(m); return m; };
    const glass = (sx, sy, sz, x, y, z, col, op) => { const m = new THREE.Mesh(gBox, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op || .3, depthWrite: false })); m.scale.set(sx, sy, sz); m.position.set(R0X + x, y, R0Z + z); ROOM.add(m); return m; };
    const plane = (w, h, x, y, z, tex, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); m.position.set(R0X + x, y, R0Z + z); if (ry) m.rotation.y = ry; ROOM.add(m); return m; };
    const plant = (x, z) => { bx(.8, .5, .8, x, .25, z, 0x8a5a2b); bx(1.1, 1.5, 1.1, x, 1.25, z, 0x2e8b57); bx(.7, .8, .7, x, 2.3, z, 0x3aa86a); };
    const fk = FK[t] || (cat === 'club' ? 'dark' : 'tile');
    // --- kabuk: zemin, tavan, duvarlar
    const fl = new THREE.Mesh(gBox, new THREE.MeshLambertMaterial({ map: rep(floorTex(fk), W / 5, D / 5) })); fl.scale.set(W, .2, D); fl.position.set(R0X, -.1, R0Z); ROOM.add(fl);
    bx(W, .3, D, 0, H, 0, dark(wc, 1.08) > 0xffffff ? wc : (cat === 'club' || t === 'casino' ? 0x15101c : 0xf2f2f4));
    bx(W, H - .1, .4, 0, H / 2, -10, wc); bx(W, H - .1, .4, 0, H / 2, 10, wc); bx(.4, H - .1, D, -hw, H / 2, 0, wc); bx(.4, H - .1, D, hw, H / 2, 0, wc);
    // lambri + supurgelik + tac + sari serit
    const wain = dark(cc, .62);
    bx(W - .4, 1.1, .12, 0, .55, -9.75, wain); bx(.12, 1.1, D - .4, -hw + .26, .55, 0, wain); bx(.12, 1.1, D - .4, hw - .26, .55, 0, wain);
    bx(W - .4, .16, .16, 0, .08, -9.7, 0x22252b); bx(.16, .16, D - .4, -hw + .3, .08, 0, 0x22252b); bx(.16, .16, D - .4, hw - .3, .08, 0, 0x22252b);
    bx(W - .4, .08, .1, 0, 1.18, -9.78, acc, 1); bx(.1, .08, D - .4, -hw + .24, 1.18, 0, acc, 1); bx(.1, .08, D - .4, hw - .24, 1.18, 0, acc, 1);
    bx(W - .4, .2, .3, 0, H - .25, -9.7, 0xf4f4f6); bx(.3, .2, D - .4, -hw + .3, H - .25, 0, 0xf4f4f6); bx(.3, .2, D - .4, hw - .3, H - .25, 0, 0xf4f4f6);
    // tavan isiklari
    const lc = cat === 'club' ? 0x9d4dff : cat === 'casino' ? 0xffd27a : 0xfff6dd;
    for (let x = -hw + 5; x <= hw - 4; x += 7) for (const z of [-5.5, 3.5]) bx(2.8, .08, .5, x, H - .2, z, lc, 1);
    // pencereler
    const wz = hw > 12 ? [-6, 0, 6] : [-4, 4];
    for (const s of [-1, 1]) for (const z of wz) { bx(.1, 1.8, 3.4, s * (hw - .21), 2.55, z, 0x2a2d35); bx(.08, 1.6, 3.2, s * (hw - .26), 2.55, z, 0x9bd4ff, 1); }
    for (const s of [-1, 1]) { const px = s * Math.max(4.4, hw * .5); bx(3.4, 1.7, .1, px, 2.5, 9.79, 0x2a2d35); bx(3.2, 1.5, .08, px, 2.5, 9.74, 0x9bd4ff, 1); }
    // tabela + cikis levhasi
    const big = t === 'sinema' || t === 'tiyatro';
    plane(Math.min(11, 5 + hw * .28), Math.min(2.6, 1.3 + hw * .03), 0, big ? H - 1.15 : Math.min(H - 1, 3.55 + (H - 4.6) * .35), -9.74, signTex(((INT && INT.n) || t).toUpperCase(), acc, 512, 128));
    plane(2.4, .6, 0, 3.75, 9.72, ct(256, 64, g => { g.fillStyle = '#0a5a2a'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#fff'; g.font = '700 38px Rajdhani,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ÇIKIŞ ↓', 128, 34); }), Math.PI);
    // saksilar
    plant(-hw + 1.3, -8.7); plant(hw - 1.3, -8.7); if (hw >= 13) { plant(-hw + 1.3, 8); plant(hw - 1.3, 8); }
    if (hw > 14) for (let x = -hw + 8; x < hw - 6; x += 12) if (Math.abs(x) > 4) { bx(.7, H - .4, .7, x, (H - .4) / 2, -1.5, 0xe8e8ea); bx(.9, .3, .9, x, .15, -1.5, 0x555a62); }
    // --- kategoriye gore ek donanim
    const shelf = (x, z, col, rot) => { bx(1.4, 1.9, 5, x, .95, z, 0x6d6f78); for (let k = 0; k < 4; k++) { bx(.9, .5, .9, x + (k % 2 ? .3 : -.3), 2.15, z - 1.6 + k * 1.1, [0xe74c3c, 0xf1c40f, 0x3498db, 0x2ecc71][(k + (col | 0)) % 4]); bx(1.45, .06, 4.8, x, .9 + (k % 2) * .6, z, 0x9aa0aa); } };
    const table = (x, z, col) => { bx(1.9, .1, 1.9, x, .9, z, col || 0xffffff); bx(.2, .9, .2, x, .45, z, 0x555555); for (const [dx, dz] of [[-1.3, 0], [1.3, 0], [0, -1.3], [0, 1.3]]) { bx(.7, .5, .7, x + dx, .3, z + dz, 0x8a5a2b); bx(.7, .6, .12, x + dx, .85, z + dz + (dz ? dz * .3 : 0) + (dx ? 0 : 0), 0x8a5a2b); } };
    const ext = hw > 13;
    if (cat === 'retail') {
      for (let x = -hw + 2.2; x <= hw - 2.2; x += 3.6) if (Math.abs(x) > 6.2) { bx(2.4, 1.6, .8, x, .8, -9.2, 0x6d6f78); for (let k = 0; k < 4; k++) bx(.5, .5, .5, x - .8 + k * .55, 1.85, -9.2, [0xe74c3c, 0xf1c40f, 0x3498db, 0x2ecc71][(k + (x | 0)) & 3]); }
      if (ext) for (let x = 15; x <= hw - 2; x += 4.4) for (const s of [-1, 1]) for (const z of [-4.5, 1.5]) shelf(s * x, z, x);
    } else if (cat === 'food') {
      for (let x = -hw + 3; x <= hw - 3; x += 4.6) if (Math.abs(x - 8) > 3 && Math.abs(x) > 5.4) { table(x, 4.5, 0xf6efe4); if (hw > 12) table(x, -2.2, 0xf6efe4); }
      for (let x = -4; x <= 4; x += 2) { bx(.6, .9, .6, x, .45, -4, 0x333640); bx(.7, .1, .7, x, .95, -4, 0xc0392b); }
    } else if (cat === 'casino') {
      for (const s of [-1, 1]) for (let x = 8; x <= hw - 2; x += 1.7) { bx(1.3, 2.2, 1, s * x, 1.1, -9, 0x1b1d26); bx(1, .8, .1, s * x, 1.6, -8.48, [0xff2fa8, 0x00d4ff, 0xffd23c, 0x7bff5a][(x * 7 | 0) & 3], 1); bx(.9, .4, .6, s * x, 1.1, -8.4, 0x666b78); bx(.6, .6, .6, s * x, .3, -7.6, 0x8a1020); }
      for (const [x, z] of [[-15, 1], [15, 1], [-19, 6], [19, 6], [-11, 6]]) if (Math.abs(x) < hw - 2) { bx(3.2, .1, 3.2, x, .95, z, 0x0f6b3a); bx(3.5, .14, 3.5, x, .85, z, 0x5a2a12); bx(.5, .85, .5, x, .42, z, 0x333333); }
      for (let x = -hw + 6; x <= hw - 5; x += 8) if (Math.abs(x) > 3) { bx(.9, H - .3, .9, x, (H - .3) / 2, 5.6, 0xffd27a); }
      bx(5, .03, 16, 0, .03, 1, 0x8a1020);
    } else if (cat === 'club') {
      for (let x = -hw + 4; x <= hw - 4; x += 4) for (const z of [-2, 4]) if (Math.abs(x) > 8) bx(3, .06, 3, x, .02, z, [0xff2fa8, 0x00d4ff, 0x7b2ff7, 0xffd23c][((x + z) | 0) & 3], 1);
      bx(9, .9, 1.4, 0, .45, -9, 0x1b1d26); bx(4.6, 2, .9, 0, 1.6, -9.2, 0x2a2d3a); bx(4, .1, .1, 0, 2.7, -9.1, 0xff2fa8, 1);
      for (const s of [-1, 1]) { bx(1.4, 3, 1.2, s * (hw - 1.4), 1.5, -8.6, 0x111111); bx(1.4, 3, 1.2, s * (hw - 1.4), 1.5, 8.2, 0x111111); }
      for (let x = -hw + 3; x <= hw - 3; x += 1.1) if (Math.abs(x) < 8) bx(.3, .6, .3, x, 1.3, -6.1, [0x00d4ff, 0xff2fa8, 0x7bff5a][(x * 3 | 0) & 3], 1);
    } else if (cat === 'arcade') {
      if (t === 'arcade') for (const s of [-1, 1]) for (let x = 5; x <= hw - 2; x += 1.8) { bx(1.2, 2.1, 1, s * x, 1.05, -9.1, 0x1b1d26); bx(.9, .7, .1, s * x, 1.5, -8.58, [0xff2fa8, 0x00d4ff, 0xffd23c, 0x7bff5a][(x * 5 | 0) & 3], 1); }
      else for (const [x, z] of [[-11, 3], [-5.5, 6.5], [-11, -3.5]]) { bx(3.4, .9, 1.9, x, .45, z, 0x0f6b3a); bx(3.7, .2, 2.2, x, .9, z, 0x5a2a12); for (const [dx, dz] of [[-1.6, -.9], [1.6, -.9], [-1.6, .9], [1.6, .9]]) bx(.25, .85, .25, x + dx, .42, z + dz, 0x3a2410); bx(.3, .3, .3, x + 1, 1.15, z, 0xffffff); }
    } else if (cat === 'bowl') {
      for (const s of [-1, 1]) for (let x = 8; x <= hw - 2; x += 3.6) { bx(2.2, .12, 12.5, s * x, .06, -3.2, 0xc9a064); bx(.3, .1, 12.5, s * (x - 1.25), .1, -3.2, 0x333640); bx(.3, .1, 12.5, s * (x + 1.25), .1, -3.2, 0x333640); for (let k = 0; k < 10; k++) bx(.28, .6, .28, s * x + ((k % 4) - 1.5) * .45 * (k < 4 ? 1 : k < 7 ? .8 : k < 9 ? .6 : .3), .35, -9 + (k < 4 ? 0 : k < 7 ? .45 : k < 9 ? .9 : 1.35), 0xffffff); bx(2.4, .6, 1, s * x, .35, 3.4, 0x3498db); bx(.5, .5, .5, s * x, 1, 3.4, 0xe74c3c); }
    } else if (cat === 'cinema') {
      bx(Math.min(22, W * .6), H * .5, .2, 0, H * .46, -9.7, 0x0a0a0e); bx(Math.min(21, W * .57), H * .44, .1, 0, H * .46, -9.55, 0xdfe8ff, 1);
      for (let z = 0; z <= 8; z += 2.3) for (let x = -hw + 3; x <= hw - 3; x += 1.2) if (Math.abs(x) > 2.4 && !(Math.abs(x - 8) < 2.6 && Math.abs(z - 4) < 2.6)) { bx(.95, .5, .9, x, .3, z, 0xa01830); bx(.95, .8, .18, x, .85, z + .45, 0xa01830); }
    } else if (cat === 'med') {
      for (const s of [-1, 1]) for (let x = 7; x <= hw - 2; x += 3.7) { bx(1.2, .5, 2.3, s * x, .5, -7.4, 0xf4f6f8); bx(1.2, .16, 1.3, s * x, .82, -6.9, 0x3498db); bx(.8, .18, .5, s * x, .85, -8.3, 0xffffff); bx(1.4, 1.9, .06, s * x, 1.6, -5.9, 0xbfe6f7); }
      for (let x = -hw + 4; x <= hw - 4; x += 2) if (Math.abs(x - 8) > 2.4) { bx(.9, .5, .9, x, .3, 7.5, 0x2980b9); bx(.9, .7, .15, x, .8, 7.95, 0x2980b9); }
      for (const s of [-1, 1]) { bx(1.8, .4, .2, s * 12, H - 1.4, -9.5, 0xe74c3c, 1); bx(.4, 1.8, .2, s * 12, H - 1.4, -9.5, 0xe74c3c, 1); }
    } else if (cat === 'bank') {
      for (const s of [-1, 1]) for (let x = 7; x <= hw - 2; x += 4.2) { glass(3.6, 2, .1, s * x, 1.9, -6.4, 0xaee3ff, .28); bx(3.8, 1, .9, s * x, .5, -6.9, 0x4a3a2a); bx(.9, .6, .7, s * x, 1.3, -7.1, 0x111111); }
      bx(5, 5, .6, -(hw - 4), 2.5, -9.5, 0x7c828c); bx(2.4, 2.4, .2, -(hw - 4), 2.5, -9.1, 0x555b66); bx(.9, .9, .3, -(hw - 4), 2.5, -8.9, 0xffd23c, 1);
      for (let x = -6; x <= 6; x += 3) { bx(.12, 1.1, .12, x, .55, 3.5, 0xffd23c); } bx(12, .08, .08, 0, 1.1, 3.5, 0xc0392b);
    } else if (cat === 'gym') {
      for (let x = -hw + 3; x <= hw - 3; x += 2.6) if (Math.abs(x) > 5 && Math.abs(x - 8) > 2) { bx(1, 1.1, 2.1, x, .55, -7, 0x1b1d26); bx(.8, .35, .1, x, 1.35, -6, 0x00d4ff, 1); bx(.1, 1.2, .1, x - .4, 1.7, -6.1, 0x555a64); }
      for (const [x, z] of [[-10, 3], [-14, 3], [-18, 3]]) if (Math.abs(x) < hw - 1) { bx(.8, .5, 2.2, x, .4, z, 0x1b1d26); bx(2.2, .1, .1, x, 1.25, z - .8, 0xaaaaaa); bx(.35, .6, .35, x - 1, 1.1, z - .8, 0x222222); bx(.35, .6, .35, x + 1, 1.1, z - .8, 0x222222); }
      for (const s of [-1, 1]) bx(.06, 2.2, D - 6, s * (hw - .5), 2.2, 0, 0xcfe8ff);
    } else if (cat === 'pool') {
      if (t === 'havuz') { bx(hw - 5, .3, 11, -(hw / 2 + 2), .15, 1, 0xdfe6ea); bx(hw - 6.4, .32, 9.6, -(hw / 2 + 2), .17, 1, 0x3bb6e8, 1); for (let x = -hw + 4; x < -5; x += 3) { bx(.08, .1, 9.6, x, .35, 1, 0xffffff, 1); } for (const z of [6, 2.5]) bx(1.2, .35, 2.6, 12, .2, z, 0xffffff), bx(1.2, .12, 1.5, 12, .5, z - .5, 0xf1c40f); }
      else { bx(hw - 4, .5, 8, 0, .25, 1.5, 0xe9e6df); for (let x = -hw + 3; x <= hw - 3; x += 4.5) if (Math.abs(x) > 3) bx(1.8, .5, .9, x, .35, 8, 0xd7d3c9); bx(3, 1.4, 3, -hw + 3, .7, -7, 0xc9c2b4); bx(2.6, .3, 2.6, -hw + 3, 1.5, -7, 0xff6b3d, 1); }
    } else if (cat === 'lib') {
      for (let x = -hw + 3; x <= hw - 3; x += 3.6) if (Math.abs(x) > 5.5) for (const z of [-7.5, -3]) { bx(1.2, 3.6, 5, x, 1.8, z, 0x6b4a2a); for (let k = 0; k < 8; k++) bx(.9, .45, 4.5, x, .55 + k * .42, z, ['#8e2f2f', '#2f5d8e', '#2f8e5a', '#8e7c2f'][k & 3].replace('#', '0x') | 0 || 0x884422); }
      for (const [x, z] of [[-9, 5], [-14, 5], [-19, 5]]) if (Math.abs(x) < hw - 1) { bx(3, .12, 1.6, x, .9, z, 0x8a5a2b); bx(.2, .9, .2, x, .45, z, 0x3a2410); bx(.8, .05, .6, x, 1, z, 0xf4ead2); }
    } else if (cat === 'museum') {
      for (let i = 0, x = -hw + 4; x <= hw - 3; x += 5.5, i++) { bx(1.2, 1, 1.2, x, .5, i % 2 ? 4 : -2, 0xefece4); bx(.7, .8, .7, x, 1.4, i % 2 ? 4 : -2, [0xc9a227, 0x9aa5b1, 0xb86b3a][i % 3]); }
      for (let i = 0, x = -hw + 5; x <= hw - 4; x += 6, i++) if (Math.abs(x) > 5.5) plane(2.2, 2.75, x, 2.6, -9.72, artTex(i + 1));
      for (let i = 0, z = -5; z <= 6; z += 5.5, i++) { plane(2.2, 2.75, -hw + .3, 2.6, z, artTex(i + 7), Math.PI / 2); plane(2.2, 2.75, hw - .3, 2.6, z, artTex(i + 13), -Math.PI / 2); }
    } else if (cat === 'hotel') {
      for (const s of [-1, 1]) { bx(3.6, .5, 1.4, s * (hw - 5), .3, 4, 0x8e2f4a); bx(3.6, .8, .3, s * (hw - 5), .8, 4.6, 0x8e2f4a); bx(1, .5, 1.4, s * (hw - 8), .3, 6.5, 0x8e2f4a); }
      for (const s of [-1, 1]) { bx(2.4, 3.6, .3, s * (hw - 3), 1.8, -9.6, 0xb0b6c0); bx(.12, 3.4, .3, s * (hw - 3), 1.8, -9.4, 0x555b66); }
      bx(5, .12, 5, 0, H - .5, 0, 0xffd27a, 1); bx(.2, 1.2, .2, 0, H - 1.1, 0, 0xcaa24a);
    } else if (cat === 'office') {
      for (let x = -hw + 4; x <= hw - 4; x += 5) if (Math.abs(x) > 6.5) { bx(2.4, .1, 1.2, x, .85, 4.5, 0x8a6a45); bx(.9, .6, .1, x, 1.2, 4.2, 0x111111); bx(.8, .45, .8, x, .3, 5.3, 0x333640); }
      for (const s of [-1, 1]) for (let z = -8; z <= -3; z += 1.7) bx(.9, 1.7, .6, s * (hw - 1.2), .85, z, 0x7c828c);
      if (t === 'itfaiye') { bx(5, 1.6, 2.2, -8, .9, 3, 0xd8232a); bx(2, 1, 2, -5.9, 1.2, 3, 0xa81c22); bx(3, .15, .5, -9.5, 1.85, 3, 0xdddddd); for (const dx of [-9.5, -6.5]) for (const dz of [2, 4]) bx(.9, .9, .3, dx, .45, dz, 0x111111); }
      if (t === 'karakol') for (let x = -hw + 3; x <= -hw + 11; x += .5) bx(.07, 3.2, .07, x, 1.7, -3.2, 0x2a2d35);
    } else if (cat === 'auto') {
      for (const s of [-1, 1]) for (let x = 6; x <= hw - 3; x += 7) { bx(.3, 3.4, .3, s * x - .9, 1.7, -4, 0xf1c40f); bx(.3, 3.4, .3, s * x + .9, 1.7, -4, 0xf1c40f); bx(2.6, .3, 3.4, s * x, 1.1, -4, 0x444a54); }
      if (t === 'galeri' || t === 'garage') for (const [x, col] of [[-12, 0xc0392b], [-17, 0x2980b9], [14, 0xf1c40f], [19, 0x111111]]) if (Math.abs(x) < hw - 2) { bx(4.4, .15, 2.6, x, .1, 5, 0x444a54); bx(4, .6, 1.8, x, .6, 5, col); bx(2.2, .55, 1.6, x - .2, 1.15, 5, dark(col, .7)); for (const [dx, dz] of [[-1.3, -.9], [1.3, -.9], [-1.3, .9], [1.3, .9]]) bx(.55, .55, .35, x + dx, .3, 5 + dz, 0x15161a); bx(.1, .3, 1.2, x + 2, .65, 5, 0xfff6dd, 1); }
      for (let i = 0; i < 4; i++) { bx(.9, .35, .9, -hw + 2 + (i % 2) * 1.1, .2 + Math.floor(i / 2) * .35, 8, 0x1b1d26); bx(.7, .9, .7, hw - 1.6, .45, -7 + i * 1.1, 0x2a5aa0); }
    } else if (cat === 'salon') {
      for (let x = -hw + 3; x <= hw - 3; x += 3.2) if (Math.abs(x) > 4.4) { bx(1, .6, 1, x, .5, 1.5, 0x1b1d26); bx(1, 1.1, .2, x, 1.1, 2, 0x1b1d26); bx(1.4, 1.6, .06, x, 2, 4.6, 0xcfe8ff, 1); }
    } else if (cat === 'jewel') {
      for (const s of [-1, 1]) { glass(1.4, 1, 6, s * (hw - 1.4), 1, -2, 0xffffff, .22); bx(1.5, .9, 6.1, s * (hw - 1.4), .45, -2, 0x2a1a10); for (let k = 0; k < 4; k++) bx(.3, .22, .3, s * (hw - 1.4), 1.1, -4.2 + k * 1.4, 0xffd23c); }
    }
  }

  /* ================= 3) ANNA, CHARLIE, MARK, JOB: ZORLU GOREVLER ================= */
  const NPCD = [
    { id: 'anna', name: 'Anna', role: 'Kaçış şoförü', anchor: 'cafe', col: '#ff2fa8', look: ['#c0392b', '#1b1b1d', '#e0ac69', '#3a1a0a', '#1a1a1f', true] },
    { id: 'charlie', name: 'Charlie', role: 'Sokak yarışı organizatörü', anchor: 'club', col: '#00d4ff', look: ['#2980b9', '#ecf0f1', '#f1c27d', '#d4a017', '#1a1a1f', true] },
    { id: 'mark', name: 'Mark', role: 'Silah tacirinin adamı', anchor: 'ammu', col: '#ff5a3c', look: ['#2c3e50', '#34495e', '#c68642', '#1b1208', '#111', false] },
    { id: 'job', name: 'Job', role: 'Nakliye patronu', anchor: 'garage', col: '#ffd23c', look: ['#e67e22', '#2c2c34', '#8d5524', '#111', '#111', false] }
  ];
  const goN = (n, d, txt, extra) => Array.from({ length: n }, (_, i) => Object.assign({ k: 'go', d, car: 1, txt: txt + ' ' + (i + 1) + '/' + n }, extra));
  const MIS = {
    anna: [
      { id: 'a1', title: 'Gece Teslimatı', star: 3, pay: 4000, limit: 210, say: 'Selam! Bir paketi şehrin öbür ucuna götürmem lazım. Paketi alınca polis fark edecek. Arabayı yıpratırsan paket bozulur. Yapabilir misin?', steps: [{ k: 'go', d: [120, 260], car: 1, txt: 'Paketi al (araçla)' }, { k: 'heat', h: 65, txt: 'Polis paketi fark etti!' }, { k: 'go', d: [320, 480], car: 1, hp: 45, txt: 'Paketi teslim et (araç canı %45 üstünde kalsın)' }] },
      { id: 'a2', title: 'Kaçış Şoförü', star: 4, pay: 7000, limit: 280, say: 'İşler büyüdü. Bir soygun ekibini alacaksın, 4 yıldızlık polis kovalayacak. Önce kurtul, sonra güvenli eve götür.', steps: [{ k: 'go', d: [80, 200], car: 1, txt: 'Ekibi araca al' }, { k: 'heat', h: 140, txt: '4 yıldız! Kaç!' }, { k: 'esc', txt: 'Polisten kurtul' }, { k: 'go', d: [220, 360], car: 1, txt: 'Güvenli eve git' }] }
    ],
    charlie: [
      { id: 'c1', title: 'Hedef Araç', star: 3, pay: 4500, limit: 170, say: 'Biri benim yarış arabamı çaldı! Hızla kaçıyor. Bul, çarparak durdur. Hızlı gitmen lazım, yoksa yakalayamazsın.', steps: [{ k: 'ram', d: [110, 190], txt: 'Hırsızın arabasına çarp (hızlı çarp)' }] },
      { id: 'c2', title: 'Gece Yarışı', star: 4, pay: 6500, limit: 125, say: 'Para yarışı: 6 kontrol noktası, 125 saniye. Yolda kimse yok sanma, dikkatli ama hızlı!', steps: goN(6, [90, 170], 'Kontrol noktası') }
    ],
    mark: [
      { id: 'm1', title: 'Çete Temizliği', star: 4, pay: 5500, limit: 220, say: 'Rakip çete mallarıma göz dikti. Bölgelerine git, 8 adamı temizle. Silahlı olacaklar, yelek işine yarar.', steps: [{ k: 'go', d: [140, 300], txt: 'Çete bölgesine git' }, { k: 'kill', n: 8, txt: 'Çeteyi temizle' }] },
      { id: 'm2', title: 'Kuşatma', star: 5, pay: 9500, limit: 280, say: 'Karargahı basacağız. İki dalga gelecek, ikincisi daha kalabalık. Can paketi almadan girme.', steps: [{ k: 'go', d: [160, 320], txt: 'Karargaha git' }, { k: 'kill', n: 6, txt: '1. dalgayı temizle' }, { k: 'kill', n: 9, txt: '2. dalgayı temizle', hp: 85 }] }
    ],
    job: [
      { id: 'j1', title: 'Ağır Yük', star: 3, pay: 5000, limit: 340, say: 'Hasarsız teslimat paraya dönüşür. 3 durak var, araç canı %70 üstünde kalmalı. Polise yakalanma.', steps: [{ k: 'go', d: [100, 200], car: 1, txt: 'Yükü al' }, { k: 'go', d: [300, 450], car: 1, hp: 70, txt: 'Birinci teslimat' }, { k: 'go', d: [300, 450], car: 1, hp: 70, txt: 'İkinci teslimat' }] },
      { id: 'j2', title: 'Son Vurgun', star: 5, pay: 12000, limit: 380, say: 'Büyük iş: depoyu soyacağız. Araçla gir, muhafızları temizle, sonra polisten kaç. Hata kaldırmaz.', steps: [{ k: 'go', d: [120, 240], car: 1, txt: 'Depoya git (araçla)' }, { k: 'heat', h: 95, txt: 'Alarm çaldı! Polis yolda' }, { k: 'go', d: [200, 320], car: 1, txt: 'Hedefe ulaş' }, { k: 'kill', n: 6, txt: 'Muhafızları temizle', hp: 90 }, { k: 'esc', txt: 'Polisten kurtul' }] }
    ]
  };
  let DONE = tryF(() => JSON.parse(lsGet('g67mis', '{}'))) || {};
  const saveDone = () => lsSet('g67mis', JSON.stringify(DONE));
  const nextMis = d => MIS[d.id].find(m => !DONE[m.id]);
  let ACT = null;

  // arayuz
  const mqh = document.createElement('div'); mqh.id = 'mqh'; $('hud').appendChild(mqh);
  const dlg = document.createElement('div'); dlg.id = 'npcd'; dlg.className = 'ov hid'; document.body.appendChild(dlg);
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  // karakterleri yerlestir
  const markTex = (ch, col) => ct(64, 64, g => { g.fillStyle = col; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = '#000'; g.stroke(); g.fillStyle = '#111'; g.font = '700 42px Rajdhani,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 32, 35); });
  const MTX = { ex: null, ok: null };
  function placeNpcs() {
    if (!MTX.ex) { MTX.ex = markTex('!', '#ffd23c'); MTX.ok = markTex('✓', '#7bff5a'); MTX.busy = markTex('…', '#cfd3dc'); }
    for (const d of NPCD) {
      if (d.m) continue;
      const pl = PLC.find(p => p.t === d.anchor && p.dx != null) || PLC.find(p => p.dx != null);
      if (!pl) continue;
      let best = null;
      for (let k = 0; k < 36 && !best; k++) { const a = k / 36 * TAU, r = 6.8 + (k % 4) * 1.1, x = pl.dx + Math.cos(a) * r, z = pl.dz + Math.sin(a) * r; if (walk(x, z) && !blocked(x, z, .9)) best = [x, z]; }
      if (!best) continue;
      const m = mkPed(...d.look); m.position.set(best[0], 0, best[1]); m.userData.dyn = 1; scene.add(m);
      const tg = nameTag(d.name + ' • ' + d.role); tg.position.y = 2.5; m.add(tg);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: MTX.ex, transparent: true, depthTest: false })); sp.scale.set(.9, .9, 1); sp.position.y = 3.25; sp.renderOrder = 11; sp.userData.ns = 1; m.add(sp);
      d.m = m; d.x = best[0]; d.z = best[1]; d.sp = sp;
    }
  }
  function npcTick() {
    for (const d of NPCD) {
      if (!d.m) continue;
      const dx = P.x - d.x, dz = P.z - d.z, dd = Math.hypot(dx, dz);
      d.m.visible = dd < 220;
      if (dd < 14 && !INT) d.m.rotation.y = Math.atan2(dx, dz);
      const nm = nextMis(d), busy = ACT && ACT.npc === d;
      const map = busy ? MTX.busy : (nm ? MTX.ex : MTX.ok);
      if (d.sp.material.map !== map) { d.sp.material.map = map; d.sp.material.needsUpdate = true; }
      d.sp.position.y = 3.25 + Math.sin(performance.now() / 380 + d.x) * .12;
    }
  }

  // konusma penceresi
  function closeDlg() { dlg.classList.add('hid'); if (mode === 'npcd') mode = 'play'; }
  function talk(d) {
    if (mode !== 'play') return;
    mode = 'npcd'; J.x = J.y = 0; B.fire = 0;
    const nm = nextMis(d), av = `<div class="av" style="background:${d.col}">${d.name[0]}</div>`;
    let body;
    if (ACT) body = `<div class="nb"><div class="nh">${av}<div><h3>${d.name}</h3><div class="rl">${esc(d.role)}</div></div></div><p>Zaten bir görevdesin: <b>${esc(ACT.m.title)}</b>. Önce onu bitir ya da bırak.</p><div class="bt"><button class="mb" id="nq1">TAMAM</button><button class="mb" id="nq2">GÖREVİ BIRAK</button></div></div>`;
    else if (!nm) body = `<div class="nb"><div class="nh">${av}<div><h3>${d.name}</h3><div class="rl">${esc(d.role)}</div></div></div><p>Tüm işleri bitirdin, harikasın. Şehirde senin kadar iyisi yok.</p><div class="bt"><button class="mb" id="nq1">SAĞ OL</button></div></div>`;
    else body = `<div class="nb"><div class="nh">${av}<div><h3>${d.name}</h3><div class="rl">${esc(d.role)}</div></div></div><p><b style="color:#ffd23c">${esc(nm.title)}</b> <span class="st">${stars(nm.star)}</span></p><p>${esc(nm.say)}</p><p>Ödül: <span class="rw">$${nm.pay}</span> • Süre: ${mmss(nm.limit)}</p><div class="bt"><button class="mb" id="nq1">KABUL ET</button><button class="mb" id="nq2">BELKİ SONRA</button></div></div>`;
    dlg.innerHTML = body; dlg.classList.remove('hid');
    $('nq1').onclick = () => { closeDlg(); if (!ACT && nm) begin(d, nm); };
    const q2 = $('nq2'); if (q2) q2.onclick = () => { closeDlg(); if (ACT) fail('Görevi bıraktın', 1); };
  }

  const nearPl0 = nearPl;
  nearPl = function () {
    const r = nearPl0.apply(this, arguments); if (r) return r;
    if (mode !== 'play' || INT || P.car) return null;
    for (const d of NPCD) if (d.m && Math.hypot(P.x - d.x, P.z - d.z) < 3.3) return { p: 'ARAÇ: ' + d.name + ' ile konuş', go: () => talk(d) };
    return null;
  };

  // gorev motoru
  function bindRoad(c) {
    let best = null, bd = 1e9;
    for (const rd of roads) { const z = rd.ax === 'z', al = z ? c.z : c.x, lat = z ? c.x : c.z; if (al < rd.a0 || al > rd.a1) continue; const d = Math.abs(lat - rd.c); if (d < bd) { bd = d; best = rd; } }
    if (best) { c.rd = best; c.dir = Math.random() < .5 ? 1 : -1; c.a = best.ax === 'z' ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2); }
  }
  function pickPt(d) {
    const q = spawnPt(d[0], d[1]); if (q) return q;
    for (let i = 0; i < 30; i++) { const a = Math.random() * TAU, r = d[0] + Math.random() * (d[1] - d[0]), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; if (walk(x, z) && !blocked(x, z, 1)) return [x, z]; }
    return [P.x + d[0], P.z];
  }
  function spawnFoes(n, hp) {
    const cx = ACT.last ? ACT.last[0] : P.x, cz = ACT.last ? ACT.last[1] : P.z;
    let made = 0;
    for (let t = 0; t < 120 && made < n; t++) {
      const a = Math.random() * TAU, r = 20 + Math.random() * 16, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (!walk(x, z) || blocked(x, z, .8)) continue;
      const o = addPed(true, x, z); o.foe = 1; o.hp = hp || 60; o.fsp = 3.5 + Math.random() * 1.2; o.fT = 1 + Math.random() * 1.5; o.mis = 1; ACT.foes.push(o); made++;
    }
    if (made < n) for (; made < n; made++) { const o = addPed(true, P.x + 18 + made, P.z + 6); o.foe = 1; o.hp = hp || 60; o.fsp = 3.8; o.fT = 1.5; o.mis = 1; ACT.foes.push(o); }
  }
  function cleanup() {
    if (!ACT) return;
    for (const o of ACT.foes) { const i = peds.indexOf(o); if (i >= 0) { scene.remove(o.m); peds.splice(i, 1); } }
    if (ACT.tcar) { const i = cars.indexOf(ACT.tcar); scene.remove(ACT.tcar.m); if (i >= 0) cars.splice(i, 1); }
    if (TJ && TJ.k === 'npc') { TJ = null; tjM.visible = false; }
    mqh.style.display = 'none';
  }
  function begin(d, m) {
    if (TJ) { toast('Önce yaptığın işi bitir (iş yerinden iptal et)'); return; }
    ACT = { npc: d, m, i: -1, t: 0, foes: [], tcar: null, tgt: null, last: null, hint: 0, escT: 0 };
    toast(m.title + ' başladı! ' + stars(m.star));
    tryF(() => tone(660, .2, 'triangle', .08));
    nextStep();
  }
  function nextStep() {
    const A = ACT; if (!A) return; A.i++;
    if (A.i >= A.m.steps.length) return win();
    const st = A.m.steps[A.i]; A.st = st; A.tgt = null; A.escT = 0; A.hint = 0;
    if (st.k === 'go') { const q = pickPt(st.d); A.tgt = { x: q[0], z: q[1], r: st.r || 11 }; TJ = { k: 'npc', x: q[0], z: q[1], nm: 'Görev' }; tjM.visible = true; toast(st.txt); }
    else if (st.k === 'heat') { heat(st.h); toast(st.txt); nextStep(); }
    else if (st.k === 'esc') { if (TJ && TJ.k === 'npc') { TJ = null; tjM.visible = false; } toast(st.txt); }
    else if (st.k === 'kill') { A.last = A.tgt0 || A.last || [P.x, P.z]; spawnFoes(st.n, st.hp); if (TJ && TJ.k === 'npc') { TJ = null; tjM.visible = false; } toast(st.txt + ' (' + st.n + ' düşman)'); }
    else if (st.k === 'ram') {
      const q = pickPt(st.d), c = trafficCar(); c.x = q[0]; c.z = q[1]; bindRoad(c); c.ai = 1; c.sp = 24; c.v = 20; c.hp = 100; c.dead = 0; c.tgtCar = 1; c.cd = 0; A.tcar = c; A.rcd = 0;
      TJ = { k: 'npc', x: c.x, z: c.z, nm: 'Hedef' }; tjM.visible = true; toast(st.txt);
    }
  }
  function win() {
    const A = ACT, m = A.m, d = A.npc; let pay = m.pay;
    DONE[m.id] = 1; saveDone();
    const all = MIS[d.id].every(x => DONE[x.id]);
    if (all && !DONE['_b' + d.id]) { DONE['_b' + d.id] = 1; pay += 2000; saveDone(); }
    P.money += pay; cleanup(); ACT = null;
    toast('GÖREV TAMAM: ' + m.title + '  +$' + pay + (all ? ' (usta bonusu dahil)' : ''));
    tryF(() => { tone(880, .3, 'triangle', .1); setTimeout(() => tone(1175, .4, 'triangle', .1), 200); });
    waPush2(d, 'Harika iş! $' + pay + ' hesabında. ' + (all ? 'Artık sana "usta" diyeceğim.' : 'Bir sonraki iş için yanıma gel.'));
  }
  function fail(why, silent) {
    const A = ACT; if (!A) return; cleanup(); ACT = null;
    toast(silent ? why : 'GÖREV BAŞARISIZ: ' + why); tryF(() => tone(180, .5, 'sawtooth', .1));
    if (!silent) waPush2(A.npc, 'Olmadı... ' + why + '. İstersen tekrar dene.');
  }
  function waPush2(d, t) { const w = WA.find(x => x.n === d.name); if (w) w.m.push(['in', t]); }
  // WhatsApp kisileri
  const firstMsg = { Anna: 'Selam, ben Anna. Kafe civarındayım. Sana zor ama paralı işlerim var, gel konuşalım.', Charlie: 'Hey! Charlie burada. Kulüp önündeyim. Yarış ve araç işleri için beni bul.', Mark: 'Mark. Silahçının yanındayım. Çetelerle başa çıkabilecek birini arıyorum.', Job: 'Job. Garajın orada bekliyorum. Ağır işler, ağır para.' };
  for (const d of NPCD) if (!WA.some(x => x.n === d.name)) WA.push({ n: d.name, m: [['in', firstMsg[d.name]]] });

  function missionTick() {
    const A = ACT, now = performance.now();
    if (A) {
      if (mode === 'dead') { fail('Öldün'); return; }
      if (mode === 'play') {
        A.t += .1;
        const st = A.st, rem = A.m.limit - A.t;
        if (rem <= 0) { fail('Süre doldu'); return; }
        let info = '';
        if (st.k === 'go' && A.tgt) {
          const dd = Math.hypot(P.x - A.tgt.x, P.z - A.tgt.z);
          if (TJ == null) { TJ = { k: 'npc', x: A.tgt.x, z: A.tgt.z, nm: 'Görev' }; }
          info = Math.round(dd) + ' m';
          if (st.hp && P.car && P.car.hp < st.hp) { fail('Araç çok hasar aldı'); return; }
          if (st.hp && P.car) info += ' • araç %' + Math.max(0, Math.round(P.car.hp));
          if (dd < A.tgt.r) {
            if (st.car && !P.car) { if (now - A.hint > 4000) { A.hint = now; toast('Bu noktaya araçla gelmelisin'); } }
            else { tryF(() => tone(760, .12, 'triangle', .07)); nextStep(); }
          }
        } else if (st.k === 'esc') {
          A.escT += .1; info = 'Yıldız: ' + stars_();
          if (readStars() === 0 && A.escT > 6) nextStep();
        } else if (st.k === 'kill') {
          const alive = A.foes.filter(o => !o.dead && o.hp > 0).length; info = 'Kalan düşman: ' + alive;
          for (const o of A.foes) {
            if (o.dead || o.hp <= 0) continue;
            const dx = P.x - o.x, dz = P.z - o.z, dd = Math.hypot(dx, dz);
            o.fT -= .1;
            if (dd < 36 && o.fT <= 0 && !INT) {
              o.fT = .8 + Math.random() * .9;
              const hitP = P.car ? .4 : .62;
              tryF(() => tracer(o.x, 1.3, o.z, P.x + (Math.random() - .5) * 1.4, P.z + (Math.random() - .5) * 1.4));
              if (Math.random() < hitP && !P.god && !P.inf) { P.hp -= 6.5 * (P.arm ? .5 : 1); shake = Math.max(shake, .3); tryF(() => sfx(.25, .18, 700)); }
              else tryF(() => sfx(.15, .1, 2200));
            }
          }
          if (!alive) nextStep();
        } else if (st.k === 'ram') {
          const c = A.tcar;
          if (!c || c.hp <= 0 || c.dead) { nextStep(); }
          else {
            TJ = TJ || { k: 'npc', x: c.x, z: c.z, nm: 'Hedef' }; TJ.x = c.x; TJ.z = c.z; info = 'Hedef canı %' + Math.round(c.hp) + ' • ' + Math.round(Math.hypot(P.x - c.x, P.z - c.z)) + ' m';
            c.ai = 1; c.sp = 24; if (c.v < 10) c.v = 14;
            if (P.car && A.rcd <= 0) { const dd = Math.hypot(P.car.x - c.x, P.car.z - c.z); if (dd < 4.4 && Math.abs(P.car.v) > 10) { c.hp -= 34; A.rcd = 1; c.v *= .55; toast('Çarpışma! Hedef canı %' + Math.max(0, Math.round(c.hp))); tryF(() => sfx(.3, .25, 500)); if (c.hp <= 0) { c.dead = 1; tryF(() => dk(c)); nextStep(); } } }
            if (A.rcd > 0) A.rcd -= .1;
            if (Math.hypot(P.x - c.x, P.z - c.z) > 420) { fail('Hedefi kaçırdın'); return; }
          }
        }
        if (ACT === A) mqh.innerHTML = '<b>' + esc(A.m.title) + '</b> • ' + esc(A.st.txt || '') + ' • <i>' + mmss(rem) + '</i>' + (info ? '<br>' + info : '');
        mqh.style.display = 'block';
        if (TJ == null && A.st.k === 'go' && A.tgt) { TJ = { k: 'npc', x: A.tgt.x, z: A.tgt.z, nm: 'Görev' }; tjM.visible = true; }
      } else if (mode === 'npcd' || mode === 'phone' || mode === 'shop') mqh.style.display = 'block';
    } else if (mqh.style.display !== 'none') mqh.style.display = 'none';
  }
  const readStars = () => { try { return stars$(); } catch (e) { return 0; } };
  function stars$() { return typeof P.heat === 'number' ? (P.heat <= 0 ? 0 : Math.min(5, Math.ceil(P.heat / 30))) : 0; }
  const stars_ = () => '★'.repeat(readStars()) || '0';

  let npcInit = 0, npcMsgT = 0;
  setInterval(() => {
    if (mode === 'menu') return;
    if (!npcInit && PLC && PLC.length && PLC[0].dx != null) { npcInit = 1; try { placeNpcs(); } catch (e) { console.warn('v10 npc', e); } }
    try { npcTick(); missionTick(); } catch (e) { console.warn('v10 gorev', e); }
    if (npcInit && !npcMsgT && mode === 'play' && !lsGet('g67nmsg', '')) { npcMsgT = 1; lsSet('g67nmsg', '1'); setTimeout(() => toast('WhatsApp: Anna, Charlie, Mark ve Job sana mesaj attı'), 9000); }
  }, 100);

  // telefon: Gorevler + Rehber
  PH_VIEW.gor = c => {
    const draw = () => {
      let h = '';
      if (ACT) h += `<div class="pcard"><b>AKTİF GÖREV</b>${esc(ACT.m.title)} — ${esc((ACT.st && ACT.st.txt) || '')}<br>Kalan: ${mmss(ACT.m.limit - ACT.t)}</div><button class="pbig r s" id="gqx">GÖREVİ BIRAK</button>`;
      for (const d of NPCD) {
        h += `<div class="pcard"><b>${d.name} • ${esc(d.role)}</b>`;
        h += MIS[d.id].map((m, i) => { const st = DONE[m.id] ? '✔ ' : (i === 0 || DONE[MIS[d.id][0].id]) ? '▶ ' : '🔒 '; return `${st}${esc(m.title)} ${stars(m.star)} $${m.pay}`; }).join('<br>');
        h += '</div>';
      }
      c.innerHTML = h;
      const x = $('gqx'); if (x) x.onclick = () => { fail('Görevi bıraktın', 1); draw(); };
    };
    draw();
  };
  PH_VIEW.rhb = c => {
    c.innerHTML = NPCD.map(d => `<div class="pcard"><b>${d.name}</b>${esc(d.role)}<div class="mq-b" style="margin-top:4px"><button class="pbig b s" data-a="m${d.id}">Haritada göster</button><button class="pbig g s" data-a="c${d.id}">Ara</button></div></div>`).join('') + '<div class="pcard"><b>Bagirov Ekber</b>Numara: 67</div>';
    c.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const id = b.dataset.a.slice(1), d = NPCD.find(x => x.id === id); if (!d) return;
      if (b.dataset.a[0] === 'm') { if (d.m) { WPT = { x: d.x, z: d.z }; wpM.visible = true; wpM.position.set(d.x, 30, d.z); toast(d.name + ' haritada işaretlendi'); } else toast('Konum bulunamadı'); }
      else { const nm = nextMis(d); toast(d.name + ': "' + (nm ? 'Yanıma gel, ' + nm.title + ' işi var.' : 'İşler bitti, sağ ol!') + '"'); }
    };
  };

  /* ================= 4) PERFORMANS ================= */
  /* a) Surekli (ince ayarli) cozunurluk: ancak kademeli sistem tukendiginde ve FPS 20 altindaysa devreye girer; hemen geri yukselir */
  PF.dq = 1; let dqOk = 0;
  setInterval(() => {
    if (!S.auto || mode === 'menu') return;
    const f = PF.fps || 60;
    if (PF.lvl >= PF.maxL - 1 && f < 21 && PF.dq > .5) { PF.dq = Math.max(.5, PF.dq - (f < 15 ? .1 : .05)); dqOk = 0; resize(); }
    else if (f >= 44 && PF.dq < 1) { if (++dqOk >= 4) { dqOk = 0; PF.dq = Math.min(1, PF.dq + .05); resize(); } }
    else dqOk = 0;
  }, 700);
  /* b) Telefon / dukkan / harita / sohbet / konusma acikken sahneyi her 3 karede 1 ciz (ekran zaten kapali) */
  const SKIPM = new Set(['phone', 'shop', 'map', 'cnt', 'chat', 'npcd']);
  let rf = 0;
  window.__skipR = () => SKIPM.has(mode) && (++rf % 3) !== 0;
  /* c) Sekme/uygulama arka plana gidince oyun dongusu zaten durur; geri gelince dt sicramasini kes */
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { PF.prev = 0; PF.n = 0; PF.acc = 0; } });
  /* d) Uzak yayalar: gorunmeyen / uzak yayanin matrisi her karede hesaplanmasin */
  const PEDFAR = 120;
  setInterval(() => {
    if (mode === 'menu' || INT) return;
    for (const p of peds) { if (!p.m) continue; const far = (p.x - P.x) * (p.x - P.x) + (p.z - P.z) * (p.z - P.z) > PEDFAR * PEDFAR; if (far !== !!p.m.userData.farOff && !p.mis) { p.m.userData.farOff = far; p.m.visible = !far; } }
  }, 600);
  window.__v10 = { NPCD, MIS, begin, talk, missionTick, npcTick, placeNpcs, act: () => ACT, done: () => DONE, fail, nextMis };
  console.log('GTA67 v10 yüklendi');
})();
