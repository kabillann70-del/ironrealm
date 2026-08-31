require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('./db');
const { ITEMS, MONSTER_TYPES, RESOURCE_TYPES } = require('./items');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const JWT_SECRET = process.env.JWT_SECRET || 'ironrealm_secret';
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await db.getUser(username);
    if (existing) return res.status(400).json({ error: 'Taken' });
    const passwordHash = await bcrypt.hash(password, 10);
    await db.createUser({ username, passwordHash, role: 'player', stats: db.freshStats(), inventory: [], equipment: { weapon: null } });
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUser(username);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(400).json({ error: 'Invalid' });
    
    // FIX: Include the role in the token so admin panel works
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, username: user.username, role: user.role });
});

// FIX: Admin route with proper role check
app.get('/api/admin/players', async (req, res) => {
    try {
        const header = req.headers.authorization;
        if (!header) return res.status(401).json({ error: 'No token' });
        
        const token = header.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins allowed' });
        }

        const users = await db.getAllUsers();
        res.json(users);
    } catch (e) {
        res.status(401).json({ error: 'Unauthorized session' });
    }
});

const liveWorld = { players: {}, resources: {}, monsters: {}, loot: {} };

function spawnResource(type) {
    const id = 'res_' + Math.random().toString(36).substr(2, 5);
    liveWorld.resources[id] = { id, type, x: (Math.random()-0.5)*150, z: (Math.random()-0.5)*150, toolReq: RESOURCE_TYPES[type].toolReq };
}
function spawnMonster() {
    const types = Object.keys(MONSTER_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const id = 'mob_' + Math.random().toString(36).substr(2, 5);
    liveWorld.monsters[id] = { id, type, x: (Math.random()-0.5)*120, z: (Math.random()-0.5)*120, hp: MONSTER_TYPES[type].hp, maxHp: MONSTER_TYPES[type].hp, atkCd: 0, lastHit: 0 };
}

for(let i=0; i<40; i++) spawnResource('tree'); 
for(let i=0; i<40; i++) spawnResource('rock');
for(let i=0; i<15; i++) spawnMonster();

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        socket.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { next(new Error('Auth Error')); }
});

function broadcastState() {
    io.emit('state', { 
        players: Object.entries(liveWorld.players).map(([sid, p]) => ({ id: sid, username: p.username, x: p.stats.pos.x, z: p.stats.pos.z, hp: p.stats.hp, maxHp: p.stats.maxHp, isGathering: p.isGathering, isAttacking: p.isAttacking, dead: p.dead, weaponType: (p.equipment && p.equipment.weapon) ? p.equipment.weapon.weaponType : null, gold: p.stats.gold })),
        resources: Object.values(liveWorld.resources), monsters: Object.values(liveWorld.monsters).map(m => ({ id: m.id, type: m.type, x: m.x, z: m.z, hp: m.hp, maxHp: m.maxHp, isHit: (Date.now() - m.lastHit < 150) })), loot: Object.values(liveWorld.loot)
    });
}

io.on('connection', async (socket) => {
    const userRec = await db.getUser(socket.user.username);
    if (!userRec) return socket.disconnect();
    const p = { username: userRec.username, role: userRec.role, stats: JSON.parse(JSON.stringify(userRec.stats)), inventory: userRec.inventory, equipment: userRec.equipment, socketId: socket.id, target: null, isGathering: false, isAttacking: false, dead: false, atkCd: 0 };
    liveWorld.players[socket.id] = p;
    socket.emit('init', { socketId: socket.id });
    socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });

    socket.on('move', (pos) => { if (!p.dead) { p.isGathering = false; p.isAttacking = false; p.target = { x: pos.x, z: pos.z }; } });
    socket.on('startGathering', (id) => {
        const node = liveWorld.resources[id];
        if (!node || p.isGathering || p.dead) return;
        if (Math.hypot(node.x - p.stats.pos.x, node.z - p.stats.pos.z) > 6) return;
        p.isGathering = true; p.target = null;
        socket.emit('gatheringStart', { duration: 3000 });
        setTimeout(() => {
            if (!p.isGathering) return;
            const itemKey = RESOURCE_TYPES[node.type].item;
            p.inventory.push({ ...ITEMS[itemKey], itemId: itemKey, uid: Date.now().toString() });
            delete liveWorld.resources[id]; p.isGathering = false;
            socket.emit('gatheringFinished');
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
            broadcastState();
            setTimeout(() => { spawnResource(node.type); broadcastState(); }, 15000);
        }, 3000);
    });
    socket.on('startAttack', (mobId) => {
        const mob = liveWorld.monsters[mobId];
        if (!mob || p.dead) return;
        if (Math.hypot(mob.x - p.stats.pos.x, mob.z - p.stats.pos.z) > 6) return;
        if (Date.now() > p.atkCd) {
            p.isAttacking = true;
            const weaponDmg = (p.equipment && p.equipment.weapon) ? p.equipment.weapon.dmg : 5;
            const totalDmg = (p.stats.baseDamage + weaponDmg);
            mob.hp -= totalDmg; mob.lastHit = Date.now(); p.atkCd = Date.now() + 800;
            io.emit('vfx', { type: 'damage', x: mob.x, z: mob.z, amount: totalDmg });
            if (mob.hp <= 0) {
                const mobDef = MONSTER_TYPES[mob.type];
                mobDef.drops && mobDef.drops.forEach(drop => { if (Math.random() < drop.chance) { const lid = 'loot_' + Math.random().toString(36).substr(2, 5); liveWorld.loot[lid] = { id: lid, itemId: drop.item, x: mob.x + (Math.random()-0.5), z: mob.z + (Math.random()-0.5) }; } });
                p.stats.gold += Math.floor(Math.random() * 20) + 15;
                delete liveWorld.monsters[mobId]; setTimeout(() => { spawnMonster(); broadcastState(); }, 8000);
            }
            setTimeout(() => { p.isAttacking = false; }, 400);
        }
    });
    socket.on('lootItem', (lid) => {
        const item = liveWorld.loot[lid];
        if (!item || Math.hypot(item.x - p.stats.pos.x, item.z - p.stats.pos.z) > 4) return;
        p.inventory.push({ ...ITEMS[item.itemId], itemId: item.itemId, uid: Date.now().toString() });
        delete liveWorld.loot[lid]; socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });
    socket.on('buyItem', (itemId) => {
        const item = ITEMS[itemId];
        if (!item || p.stats.gold < item.price) return;
        p.stats.gold -= item.price; p.inventory.push({ ...item, itemId, uid: Date.now().toString() });
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
    });
    socket.on('equipItem', (uid) => {
        const item = p.inventory.find(i => i.uid === uid);
        if (item && item.type === 'weapon') { p.equipment.weapon = item; socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment }); }
    });
    socket.on('sellAll', () => {
        let total = 0; p.inventory = p.inventory.filter(it => { if (it.type === 'material') { total += (it.sellValue || 5); return false; } return true; });
        p.stats.gold += total; socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
    });
    socket.on('clearInventory', () => { p.inventory = []; socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment }); });
    socket.on('disconnect', async () => { await db.saveUser(p.username, { stats: p.stats, inventory: p.inventory, equipment: p.equipment }); delete liveWorld.players[socket.id]; });
});

setInterval(() => {
    Object.values(liveWorld.players).forEach(p => { if (!p.target || p.dead) return; const dx = p.target.x - p.stats.pos.x, dz = p.target.z - p.stats.pos.z, dist = Math.hypot(dx, dz); if (dist > 0.4) { p.stats.pos.x += (dx/dist)*0.45; p.stats.pos.z += (dz/dist)*0.45; } else { p.target = null; } });
    Object.values(liveWorld.monsters).forEach(m => {
        let nearest = null, minDist = 15;
        Object.values(liveWorld.players).forEach(p => { if (p.dead) return; const d = Math.hypot(p.stats.pos.x - m.x, p.stats.pos.z - m.z); if (d < minDist) { minDist = d; nearest = p; } });
        if (nearest) {
            const dx = nearest.stats.pos.x - m.x, dz = nearest.stats.pos.z - m.z;
            if (minDist > 2) { m.x += (dx/minDist)*0.18; m.z += (dz/minDist)*0.18; }
            else if (Date.now() > m.atkCd) { nearest.stats.hp -= MONSTER_TYPES[m.type].dmg; m.atkCd = Date.now() + 1500; if (nearest.stats.hp <= 0) { nearest.dead = true; nearest.stats.hp = 0; setTimeout(() => { nearest.dead = false; nearest.stats.hp = nearest.stats.maxHp; nearest.stats.pos = {x:0,z:0}; }, 4000); } }
        }
    });
    broadcastState();
}, 100);

db.connect().then(async () => { 
    const name = process.env.ADMIN_USERNAME || 'admin';
    const existing = await db.getUser(name);
    if (!existing) {
        const pass = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(pass, 10);
        await db.createUser({ username: name, passwordHash, role: 'admin', stats: db.freshStats(), inventory: [], equipment: {weapon:null} });
    }
    server.listen(PORT, () => console.log(`🚀 Master Server Live`)); 
});