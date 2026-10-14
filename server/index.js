'use strict';
/* QUACK ATTACK! online server.
 *  - serves the game files from ../www
 *  - runs lobbies (create, join by code, public lobby list, ready, start, back to lobby)
 *  - relays game messages: the host sends snapshots to everyone, everyone else sends inputs to the host
 * The server never simulates the game. Run it with:  npm install && npm start   (PORT defaults to 8080) */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const ROOT = path.join(__dirname, '..', 'www');
const PORT = Number(process.env.PORT) || 8080;
const MAX_PLAYERS = 4;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };

// ---------------------------------------------------------------- static files
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---------------------------------------------------------------- lobbies
const rooms = new Map(); // code -> room
let nextId = 1;

function makeCode() {
  let code;
  do { code = ''; for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; } while (rooms.has(code));
  return code;
}
function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function broadcast(room, msg) { for (const m of room.members) send(m.ws, msg); }
function roomOf(ws) { return ws.room ? rooms.get(ws.room) : null; }
function clean(str, max, fallback) { const s = String(str || '').replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, max); return s || fallback; }
function cleanLoadout(lo) {
  const out = {};
  for (const k of ['skin', 'hat', 'halo', 'trail', 'weapon']) out[k] = String((lo && lo[k]) || 'none').replace(/[^a-z_]/g, '').slice(0, 24);
  return out;
}
function memberOf(ws, m) { return { id: ws.id, ws, name: clean(m.name, 12, 'DUCK'), lo: cleanLoadout(m.lo), ready: false }; }
function roomView(room) {
  return {
    code: room.code, name: room.name, pub: room.pub, state: room.state, mode: room.mode, level: room.level,
    members: room.members.map(m => ({ id: m.id, name: m.name, lo: m.lo, ready: m.ready, host: m.id === room.hostId })),
  };
}
function leaveRoom(ws) {
  const room = roomOf(ws);
  if (!room) return;
  ws.room = null;
  const idx = room.members.findIndex(m => m.ws === ws);
  if (idx < 0) return;
  const [gone] = room.members.splice(idx, 1);
  if (gone.id === room.hostId || room.members.length === 0) {
    broadcast(room, { t: 'closed', reason: gone.id === room.hostId ? 'HOST LEFT' : 'LOBBY CLOSED' });
    for (const m of room.members) m.ws.room = null;
    rooms.delete(room.code);
    return;
  }
  broadcast(room, { t: 'left', id: gone.id });
  broadcast(room, { t: 'room', room: roomView(room) });
}
function lobbyList() {
  return [...rooms.values()]
    .filter(r => r.pub && r.state === 'lobby' && r.members.length < MAX_PLAYERS)
    .map(r => ({ code: r.code, name: r.name, count: r.members.length, max: MAX_PLAYERS, host: r.members[0].name }));
}

// ---------------------------------------------------------------- websocket
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1 << 20 });

wss.on('connection', ws => {
  ws.id = 'p' + (nextId++);
  ws.room = null;
  send(ws, { t: 'hello', id: ws.id });

  ws.on('message', raw => {
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    const room = roomOf(ws);
    const isHost = room && room.hostId === ws.id;

    switch (m.t) {
      case 'list':
        send(ws, { t: 'rooms', rooms: lobbyList() });
        break;

      case 'create': {
        leaveRoom(ws);
        let code = makeCode();
        const host = memberOf(ws, m);
        const r = { code, name: host.name + "'S LOBBY", pub: !!m.pub, state: 'lobby', mode: 'endless', level: 1, hostId: ws.id, members: [host] };
        rooms.set(code, r);
        ws.room = code;
        send(ws, { t: 'joined', code });
        broadcast(r, { t: 'room', room: roomView(r) });
        break;
      }

      case 'join': {
        const code = String(m.code || '').toUpperCase().slice(0, 4);
        const r = rooms.get(code);
        if (!r) { send(ws, { t: 'error', msg: 'NO LOBBY WITH CODE ' + code }); break; }
        if (r.state !== 'lobby') { send(ws, { t: 'error', msg: 'THAT GAME HAS ALREADY STARTED' }); break; }
        if (r.members.length >= MAX_PLAYERS) { send(ws, { t: 'error', msg: 'THAT LOBBY IS FULL' }); break; }
        if (room && room.code === code) break;
        leaveRoom(ws);
        r.members.push(memberOf(ws, m));
        ws.room = code;
        send(ws, { t: 'joined', code });
        broadcast(r, { t: 'room', room: roomView(r) });
        break;
      }

      case 'set': { // host changes the mode / level
        if (!isHost || room.state !== 'lobby') break;
        if (m.mode === 'endless' || m.mode === 'story') room.mode = m.mode;
        if (Number.isInteger(m.level) && m.level >= 1 && m.level <= 5) room.level = m.level;
        broadcast(room, { t: 'room', room: roomView(room) });
        break;
      }

      case 'ready': {
        if (!room || room.state !== 'lobby') break;
        const me = room.members.find(x => x.ws === ws);
        if (me) me.ready = !!m.ready;
        broadcast(room, { t: 'room', room: roomView(room) });
        break;
      }

      case 'start': {
        if (!isHost || room.state !== 'lobby') break;
        room.state = 'game';
        const seed = Math.floor(Math.random() * 2147483647) + 1;
        const members = room.members.map(x => ({ id: x.id, name: x.name, lo: x.lo }));
        broadcast(room, { t: 'start', mode: room.mode, level: room.level, seed, members });
        broadcast(room, { t: 'room', room: roomView(room) });
        break;
      }

      case 'back': { // host returns everyone to the lobby after a game
        if (!isHost || room.state !== 'game') break;
        room.state = 'lobby';
        for (const x of room.members) x.ready = false;
        broadcast(room, { t: 'lobby' });
        broadcast(room, { t: 'room', room: roomView(room) });
        break;
      }

      case 'relay': { // game traffic: the server only forwards it
        if (!room || room.state !== 'game') break;
        if (m.to === 'all' && isHost) {
          for (const x of room.members) if (x.id !== ws.id) send(x.ws, { t: 'relayed', from: ws.id, msg: m.msg });
        } else if (m.to === 'host' && !isHost) {
          const host = room.members.find(x => x.id === room.hostId);
          if (host) send(host.ws, { t: 'relayed', from: ws.id, msg: m.msg });
        }
        break;
      }

      case 'leave':
        leaveRoom(ws);
        send(ws, { t: 'left_you' });
        break;
    }
  });

  ws.on('close', () => leaveRoom(ws));
  ws.on('error', () => leaveRoom(ws));
});

server.listen(PORT, () => {
  console.log(`Quack Attack server on http://localhost:${PORT}  (game files from ${ROOT}, websocket at /ws)`);
});
