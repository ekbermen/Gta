/* GTA 67 - tek dosyalik sunucu: oyunu sunar + /ws uzerinden coklu oyuncu relay.
   Bagimlilik YOK (npm install gerekmez). Calistir: node server.js */
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const MAX_PLAYERS = 4;
const TICK_MS = 50;
const ALLOWED = new Set(['', 'index.html', 'css', 'js', 'assets', 'models', 'data']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.xml': 'application/xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary'
};
const GZ = new Set(['.html', '.js', '.css', '.xml', '.json', '.glb']);
const gzCache = new Map();

/* ---------------- statik dosyalar ---------------- */
function serveStatic(req, res) {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (p === '/' || p === '') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  const top = path.relative(ROOT, file).split(path.sep)[0];
  if (!ALLOWED.has(top)) { res.writeHead(404); return res.end('Not found'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    const etag = '"' + st.size + '-' + Math.floor(st.mtimeMs) + '"';
    const h = {
      'Content-Type': MIME[ext] || 'application/octet-stream', 'ETag': etag,
      'Cache-Control': (ext === '.glb' || ext === '.png' || ext === '.jpg') ? 'public, max-age=86400' : 'no-cache'
    };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    const wantGz = GZ.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (!wantGz) { h['Content-Length'] = st.size; res.writeHead(200, h); return fs.createReadStream(file).pipe(res); }
    h['Content-Encoding'] = 'gzip'; h['Vary'] = 'Accept-Encoding';
    const hit = gzCache.get(file);
    if (hit && hit.etag === etag) { h['Content-Length'] = hit.buf.length; res.writeHead(200, h); return res.end(hit.buf); }
    fs.readFile(file, (e2, data) => {
      if (e2) { res.writeHead(500); return res.end(); }
      zlib.gzip(data, { level: 6 }, (e3, buf) => {
        if (e3) { res.writeHead(500); return res.end(); }
        gzCache.set(file, { etag, buf });
        h['Content-Length'] = buf.length; res.writeHead(200, h); res.end(buf);
      });
    });
  });
}

const server = http.createServer(serveStatic);

/* ---------------- minimal WebSocket (RFC 6455) ---------------- */
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_FRAME = 65536;

function frame(op, payload) {
  const len = payload.length;
  let head;
  if (len < 126) head = Buffer.from([0x80 | op, len]);
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([head, payload]);
}

class Sock {
  constructor(socket, onMsg, onClose) {
    this.s = socket; this.buf = Buffer.alloc(0); this.onMsg = onMsg; this.onClose = onClose;
    this.open = true; this.alive = true; this.frag = null;
    socket.setNoDelay(true);
    socket.on('data', d => this.data(d));
    socket.on('close', () => this.end());
    socket.on('error', () => this.end());
  }
  end() { if (!this.open) return; this.open = false; try { this.s.destroy(); } catch (e) {} this.onClose(); }
  send(str) { if (this.open && this.s.writable) try { this.s.write(frame(1, Buffer.from(str))); } catch (e) {} }
  ping() { if (this.open) try { this.s.write(frame(9, Buffer.alloc(0))); } catch (e) {} }
  close() { if (this.open) { try { this.s.write(frame(8, Buffer.alloc(0))); } catch (e) {} this.end(); } }
  data(d) {
    this.buf = Buffer.concat([this.buf, d]);
    if (this.buf.length > MAX_FRAME * 4) return this.end();
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0, op = b[0] & 0x0f, masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; const big = b.readBigUInt64BE(2); if (big > BigInt(MAX_FRAME)) return this.end(); len = Number(big); off = 10; }
      if (!masked || len > MAX_FRAME) return this.end();
      if (b.length < off + 4 + len) return;
      const mask = b.slice(off, off + 4);
      const pl = Buffer.from(b.slice(off + 4, off + 4 + len));
      for (let i = 0; i < pl.length; i++) pl[i] ^= mask[i & 3];
      this.buf = b.slice(off + 4 + len);
      if (op === 8) return this.close();
      if (op === 9) { try { this.s.write(frame(10, pl)); } catch (e) {} continue; }
      if (op === 10) { this.alive = true; continue; }
      if (op === 1 || op === 2) { this.frag = [pl]; } else if (op === 0 && this.frag) { this.frag.push(pl); } else continue;
      if (fin) { const full = Buffer.concat(this.frag); this.frag = null; if (full.length <= MAX_FRAME) this.onMsg(full.toString('utf8')); }
    }
  }
}

server.on('upgrade', (req, socket) => {
  const url = (req.url || '').split('?')[0];
  const key = req.headers['sec-websocket-key'];
  if (url !== '/ws' || !key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const acc = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  newClient(socket);
});

/* ---------------- oda mantigi ---------------- */
/* ---- oyuncu ilerleme kaydi (sunucu tarafi): token -> {ts, d} ---- */
const SAVES = new Map(); const SAVE_FILE = path.join(ROOT, 'saves.json');
try { const j = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8')); for (const k of Object.keys(j)) SAVES.set(k, j[k]); } catch (e) {}
let saveTimer = 0;
function persistSaves() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = 0; try { const o = {}; for (const [k, v] of SAVES) o[k] = v; fs.writeFileSync(SAVE_FILE, JSON.stringify(o)); } catch (e) {} }, 3000);
}
const rooms = new Map(); // kod -> {code,name,pw,pub,players:Map,order:[],seed,t0,seats:Map,lastW}
let nextId = 1;

const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const num = (v, lim) => { v = +v; return Number.isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0; };
const hex = s => (typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s)) ? s : '#ffffff';
const colFor = id => ['#ff2fa8', '#00d4ff', '#ffd23c', '#7bff5a'][id % 4];
const hostOf = r => r.order.length ? r.order[0] : 0;

function genCode() {
  for (let i = 0; i < 50; i++) {
    const c = String(Math.floor(1000000 + Math.random() * 9000000));
    if (!rooms.has(c)) return c;
  }
  return null;
}
function sendTo(p, o) { p.sock.send(JSON.stringify(o)); }
function broadcast(room, o, except) { const s = JSON.stringify(o); for (const p of room.players.values()) if (p !== except) p.sock.send(s); }

/* ---- koltuklar: sunucu belirler, herkes ayni gorur ----
   0 = surucu (sol on), 1 = on yolcu (sag on), 2 = sol arka, 3 = sag arka, 4+ = otobus/minibus */
function pickSeat(ent, side) {
  const occupied = ent.a.some(Boolean);
  let order;
  if (!occupied) order = [0];                       // araba bos: surucu ol
  else if (side < 0) order = [0, 1, 2, 3];          // soldan bindi: sol koltuk (surucu), doluysa yan, sonra sol arka
  else order = [1, 0, 3, 2];                        // sagdan bindi: sag on, surucu bossa surucu, sonra sag arka
  for (let i = 4; i < ent.cap; i++) order.push(i);
  if (!occupied) for (let i = 1; i < ent.cap; i++) order.push(i);
  for (const i of order) if (i < ent.cap && !ent.a[i]) return i;
  return -1;
}
function seatsMsg(r) {
  const m = {};
  for (const [nid, e] of r.seats) m[nid] = { a: e.a.map(x => x ? String(x) : 0), sp: e.sp };
  return { t: 'seats', m };
}
function pushSeats(r) { broadcast(r, seatsMsg(r)); }
function unseat(p, quiet) {
  const r = p.room; if (!r || !p.nid) return;
  const e = r.seats.get(p.nid);
  if (e) { if (e.a[p.seat] === p.id) e.a[p.seat] = 0; if (!e.a.some(Boolean)) r.seats.delete(p.nid); }
  p.nid = null; p.seat = -1;
  if (!quiet) pushSeats(r);
}
function setHost(r) { broadcast(r, { t: 'host', h: String(hostOf(r)) }); r.lastW = Date.now(); }

function leaveRoom(p) {
  const r = p.room; if (!r) return;
  const wasHost = hostOf(r) === p.id;
  unseat(p, true);
  r.players.delete(p.id); p.room = null;
  r.order = r.order.filter(i => i !== p.id);
  if (!r.players.size) rooms.delete(r.code);
  else { broadcast(r, { t: 'left', n: p.name, i: String(p.id) }); pushSeats(r); if (wasHost) setHost(r); }
}


/* ---------------- sesli sohbet: ses parcalarini odadakilere aynen ilet ---------------- */
function voice(p, raw, now) {
  const r = p.room; if (!r || r.players.size < 2) return;
  if (now - (p.vwin || 0) > 1000) { p.vwin = now; p.vmsgs = 0; }
  if (++p.vmsgs > 45) return;
  let m; try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m.d !== 'string' || m.d.length > 9000 || !/^[A-Za-z0-9+/=]+$/.test(m.d)) return;
  const s = JSON.stringify({ t: 'v', i: String(p.id), n: p.name, q: m.q | 0, d: m.d });
  for (const q of r.players.values()) if (q !== p) q.sock.send(s);
}

/* ---------------- arkadaslar: kullanici adi ile ekle / kabul / oda'ya katil ---------------- */
const USERS = new Map(); const FR_FILE = path.join(ROOT, 'friends.json');   // kucuk -> {name, tok, fr:[], rq:[]}
try { const j = JSON.parse(fs.readFileSync(FR_FILE, 'utf8')); for (const k of Object.keys(j)) USERS.set(k, j[k]); } catch (e) {}
let frTimer = 0;
function persistUsers() {
  if (frTimer) return;
  frTimer = setTimeout(() => { frTimer = 0; try { const o = {}; for (const [k, v] of USERS) o[k] = v; fs.writeFileSync(FR_FILE, JSON.stringify(o)); } catch (e) {} }, 3000);
}
const ONLINE = new Map();                                // kucuk kullanici adi -> oyuncu
const ukey = s => clean(s, 16).toLowerCase();
function frInfo(key) {
  const u = USERS.get(key); const q = ONLINE.get(key);
  const room = q && q.room ? { code: q.room.code, name: q.room.name, n: q.room.players.size, max: MAX_PLAYERS, pw: q.room.pw ? 1 : 0 } : null;
  return { u: u ? u.name : key, on: q ? 1 : 0, room };
}
function frSend(p) {
  const key = p.uk; if (!key) return;
  const u = USERS.get(key); if (!u) return;
  sendTo(p, { t: 'fr', me: u.name, friends: u.fr.map(frInfo), req: u.rq.map(k => (USERS.get(k) || { name: k }).name) });
}
function frPush(key) { const q = ONLINE.get(key); if (q) frSend(q); }
function frHandle(p, m) {
  switch (m.t) {
    case 'hi': {
      const name = clean(m.u, 16), key = name.toLowerCase(), tok = clean(m.tok, 64);
      if (name.length < 3 || !tok) return sendTo(p, { t: 'hi', ok: 0, why: 'bad' });
      let u = USERS.get(key);
      if (u && u.tok !== tok) return sendTo(p, { t: 'hi', ok: 0, why: 'taken' });
      if (!u) { u = { name, tok, fr: [], rq: [] }; USERS.set(key, u); persistUsers(); }
      if (p.uk && p.uk !== key && ONLINE.get(p.uk) === p) ONLINE.delete(p.uk);
      p.uk = key; ONLINE.set(key, p);
      sendTo(p, { t: 'hi', ok: 1, u: u.name });
      return frSend(p);
    }
    case 'fr_list': return frSend(p);
    case 'fr_add': {
      if (!p.uk) return;
      const to = ukey(m.to), me = USERS.get(p.uk), you = USERS.get(to);
      if (!to) return;
      if (to === p.uk) return sendTo(p, { t: 'fr_res', m: 'self' });
      if (!you) return sendTo(p, { t: 'fr_res', m: 'nouser' });
      if (me.fr.includes(to)) return sendTo(p, { t: 'fr_res', m: 'already' });
      if (me.rq.includes(to)) {                          // o zaten bana istek atmis: direkt arkadas
        me.rq = me.rq.filter(k => k !== to); me.fr.push(to); you.fr.push(p.uk); persistUsers();
        sendTo(p, { t: 'fr_res', m: 'added', u: you.name }); frSend(p); frPush(to);
        const q = ONLINE.get(to); if (q) sendTo(q, { t: 'fr_note', m: me.name + ' ile arkadaş oldunuz' });
        return;
      }
      if (!you.rq.includes(p.uk)) { you.rq.push(p.uk); if (you.rq.length > 50) you.rq.shift(); persistUsers(); }
      sendTo(p, { t: 'fr_res', m: 'sent', u: you.name });
      const q = ONLINE.get(to); if (q) { sendTo(q, { t: 'fr_note', m: me.name + ' sana arkadaşlık isteği gönderdi' }); frSend(q); }
      return;
    }
    case 'fr_acc': {
      if (!p.uk) return;
      const from = ukey(m.from), me = USERS.get(p.uk), you = USERS.get(from);
      if (!you || !me.rq.includes(from)) return frSend(p);
      me.rq = me.rq.filter(k => k !== from);
      if (!me.fr.includes(from)) me.fr.push(from);
      if (!you.fr.includes(p.uk)) you.fr.push(p.uk);
      persistUsers(); frSend(p);
      const q = ONLINE.get(from); if (q) { sendTo(q, { t: 'fr_note', m: me.name + ' isteğini kabul etti' }); frSend(q); }
      return;
    }
    case 'fr_dec': {
      if (!p.uk) return; const me = USERS.get(p.uk);
      me.rq = me.rq.filter(k => k !== ukey(m.from)); persistUsers(); return frSend(p);
    }
    case 'fr_del': {
      if (!p.uk) return; const who = ukey(m.who), me = USERS.get(p.uk), you = USERS.get(who);
      me.fr = me.fr.filter(k => k !== who); if (you) you.fr = you.fr.filter(k => k !== p.uk);
      persistUsers(); frSend(p); frPush(who); return;
    }
  }
}

function newClient(socket) {
  const p = { id: nextId++, name: 'Oyuncu', room: null, x: 0, z: 0, a: 0, c: 0, k: null, cc: '#ffffff', v: 0, hp: 100, ia: '', nid: null, seat: -1, sock: null, msgs: 0, win: Date.now() };
  p.sock = new Sock(socket, raw => handle(p, raw), () => { if (p.uk && ONLINE.get(p.uk) === p) ONLINE.delete(p.uk); leaveRoom(p); });
}
function joinRoom(p, r) {
  r.players.set(p.id, p); r.order.push(p.id); p.room = r; p.nid = null; p.seat = -1; p.hp = 100; p.ia = '';
}
const wire = (r, p) => ({ v: 3, id: String(p.id), room: r.name, mapId: r.mapId, npc: r.npc, car: r.car, seed: r.seed, t0: r.t0, now: Date.now(), h: String(hostOf(r)) });

function handle(p, raw) {
  const now = Date.now();
  if (raw.length > 20 && raw.charCodeAt(6) === 118 && raw.indexOf('"t":"v"') === 1) return voice(p, raw, now);   // sesli sohbet: ayri hiz siniri
  // basit hiz siniri: saniyede max 120 mesaj
  if (now - p.win > 1000) { p.win = now; p.msgs = 0; }
  if (++p.msgs > 120) return;
  let m; try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m !== 'object') return;
  switch (m.t) {
    case 'ping': return sendTo(p, { t: 'pong' });
    case 'hi': case 'fr_list': case 'fr_add': case 'fr_acc': case 'fr_dec': case 'fr_del': return frHandle(p, m);
    case 'list': {
      const list = [];
      for (const r of rooms.values()) if (r.pub) list.push({ room: r.name, n: r.players.size, max: MAX_PLAYERS, pw: r.pw ? 1 : 0, code: r.code });
      return sendTo(p, { t: 'rooms', rooms: list.slice(0, 30) });
    }
    case 'create': {
      leaveRoom(p);
      const code = genCode(); if (!code) return sendTo(p, { t: 'err', m: 'full' });
      p.name = clean(m.name, 16) || 'Oyuncu';
      const r = { code, name: clean(m.room, 24) || (p.name + ' odası'), pw: clean(m.pw, 32), pub: m.pub ? 1 : 0, players: new Map(), order: [], mapId: code, npc: Math.max(0, Math.min(250, m.npc == null ? 45 : (+m.npc | 0))), car: Math.max(0, Math.min(275, m.car == null ? 44 : (+m.car | 0))), seed: +code, t0: Date.now(), seats: new Map(), lastW: Date.now() };
      rooms.set(code, r); joinRoom(p, r);
      return sendTo(p, Object.assign({ t: 'created', code }, wire(r, p)));
    }
    case 'join': {
      const r = rooms.get(clean(m.code, 7));
      if (!r) return sendTo(p, { t: 'err', m: 'none' });
      if (r === p.room) return;
      if (r.pw && r.pw !== clean(m.pw, 32)) return sendTo(p, { t: 'err', m: 'bad' });
      if (r.players.size >= MAX_PLAYERS) return sendTo(p, { t: 'err', m: 'full' });
      leaveRoom(p);
      p.name = clean(m.name, 16) || 'Oyuncu';
      joinRoom(p, r);
      sendTo(p, Object.assign({ t: 'joined' }, wire(r, p)));
      sendTo(p, seatsMsg(r));
      return broadcast(r, { t: 'joinedRoom', n: p.name }, p);
    }
    case 'sv': {                        // ilerleme kaydini sakla
      const tok = clean(m.tok, 64); if (!tok || !m.d || typeof m.d !== 'object') return;
      const s = JSON.stringify(m.d); if (s.length > 12000) return;
      const old = SAVES.get(tok); const ts = +m.d.ts || Date.now();
      if (old && old.ts > ts) return;
      SAVES.set(tok, { ts, d: m.d }); if (SAVES.size > 5000) SAVES.delete(SAVES.keys().next().value);
      return persistSaves();
    }
    case 'ld': {                        // kaydi geri ver
      const tok = clean(m.tok, 64); const e = tok && SAVES.get(tok);
      return sendTo(p, { t: 'svd', d: e ? e.d : null });
    }
    case 'leave': return leaveRoom(p);
    case 'u': {
      p.x = num(m.x, 20000); p.z = num(m.z, 20000); p.a = num(m.a, 7); p.c = m.c ? 1 : 0;
      p.k = (p.c && Array.isArray(m.k)) ? m.k.slice(0, 6).map(v => num(v, 1000)) : null;
      p.cc = hex(m.cc); p.v = num(m.v, 200); p.hp = num(m.hp, 1000); p.ia = clean(m.ia, 24); p.fy = num(m.fy, 20); return;
    }
    case 'c': {
      if (!p.room) return;
      const txt = clean(m.m, 120); if (!txt) return;
      return broadcast(p.room, { t: 'c', n: p.name, m: txt }, p);
    }
    case 'sit': {                       // arabaya bin: {nid, side:-1|1, cap, sp:[kind,col,mdl,ci,vt]}
      const r = p.room; if (!r) return sendTo(p, { t: 'sitno', nid: clean(m.nid, 24), why: 'noroom' });
      const nid = clean(m.nid, 24); if (!nid) return sendTo(p, { t: 'sitno', nid: '' });
      if (p.nid === nid) return sendTo(p, { t: 'sat', nid, seat: p.seat });
      unseat(p, true);
      let e = r.seats.get(nid);
      if (!e) {
        const sp = Array.isArray(m.sp) ? m.sp : [];
        e = { cap: Math.max(1, Math.min(16, m.cap | 0 || 4)), a: [], sp: [Math.max(0, Math.min(9, sp[0] | 0)), hex(sp[1]), clean(sp[2], 12).replace(/[^a-z0-9]/gi, ''), Math.max(0, Math.min(40, sp[3] | 0)), clean(sp[4], 8).replace(/[^a-z0-9]/gi, '')] };
        for (let i = 0; i < e.cap; i++) e.a.push(0);
        r.seats.set(nid, e);
      }
      const idx = pickSeat(e, m.side < 0 ? -1 : 1);
      if (idx < 0) { if (!e.a.some(Boolean)) r.seats.delete(nid); sendTo(p, { t: 'sitno', nid }); return pushSeats(r); }
      e.a[idx] = p.id; p.nid = nid; p.seat = idx;
      sendTo(p, { t: 'sat', nid, seat: idx });
      return pushSeats(r);
    }
    case 'swap': {                      // ayni arabada koltuk degistir (otomatik surus YOK)
      const r = p.room; if (!r || !p.nid) return;
      const e = r.seats.get(p.nid); if (!e) return;
      const to = m.seat | 0;
      if (to < 0 || to >= e.cap || e.a[to]) return sendTo(p, { t: 'sitno', nid: p.nid });
      e.a[p.seat] = 0; e.a[to] = p.id; p.seat = to;
      sendTo(p, { t: 'sat', nid: p.nid, seat: to });
      return pushSeats(r);
    }
    case 'unsit': return unseat(p);
    case 'w': {                         // dunya durumu: sadece "host" gonderir, digerlerine aynen iletilir
      const r = p.room; if (!r || hostOf(r) !== p.id) return;
      r.lastW = now;
      return broadcast(r, { t: 'w', c: Array.isArray(m.c) ? m.c.slice(0, 2400) : [], p: Array.isArray(m.p) ? m.p.slice(0, 1200) : [] }, p);
    }
    case 'hit': {                       // oyuncu -> oyuncu hasar
      const r = p.room; if (!r) return;
      const q = r.players.get(+m.to | 0); if (!q || q === p) return;
      return sendTo(q, { t: 'hit', f: p.name, fi: String(p.id), d: Math.max(0, Math.min(100, num(m.d, 100))) });
    }
    case 'sh': {                        // atis efekti
      const r = p.room; if (!r) return;
      return broadcast(r, { t: 'sh', i: String(p.id), x: num(m.x, 20000), z: num(m.z, 20000), a: num(m.a, 7), l: num(m.l, 200) }, p);
    }
    case 'pk': {                        // yaya oldu
      const r = p.room; if (!r) return;
      return broadcast(r, { t: 'pk', i: m.i | 0 }, p);
    }
  }
}

// 10 Hz durum yayini: herkese kendisi haric oyuncular
setInterval(() => {
  const now = Date.now();
  for (const r of rooms.values()) {
    if (r.players.size < 2) continue;
    // host 3 sn dunya durumu gondermezse (sekme arka planda) siradaki oyuncu host olur
    if (now - r.lastW > 3000 && r.order.length > 1) { r.order.push(r.order.shift()); setHost(r); }
    const h = String(hostOf(r));
    const all = [];
    for (const q of r.players.values()) all.push({ i: String(q.id), n: q.name, x: q.x, z: q.z, a: q.a, c: q.c, k: q.k, cc: q.cc, col: colFor(q.id), nid: q.nid || '', seat: q.seat, v: q.v, hp: q.hp, ia: q.ia, fy: q.fy || 0 });
    for (const q of r.players.values()) q.sock.send(JSON.stringify({ t: 's', h, mp: r.mapId, p: all.filter(o => o.i !== String(q.id)) }));
  }
}, TICK_MS);

// olu baglantilari temizle
setInterval(() => {
  for (const r of rooms.values()) for (const q of r.players.values()) {
    if (!q.sock.alive) { q.sock.end(); continue; }
    q.sock.alive = false; q.sock.ping();
  }
}, 30000);

server.listen(PORT, () => console.log('GTA 67 sunucu hazir: http://localhost:' + PORT));
