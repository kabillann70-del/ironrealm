require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('./db');
const { ITEMS, MONSTER_TYPES, RESOURCE_TYPES, xpForLevel } = require('./items');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const JWT_SECRET = process.env.JWT_SECRET || 'ironrealm_secret';
const PORT = 3000;

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

app.use((err, req, res, next) => {
    if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
        console.warn('[AI Studio] Database offline — returning mock empty response');
        if (req.method === 'GET') {
            return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
        }
        return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
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
for(let i=0; i<25; i++) spawnMonster();

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (token) {
            try {
                socket.user = jwt.verify(token, JWT_SECRET);
                return next();
            } catch (jwtErr) {
                // Token expired/invalid, fallback below
            }
        }
        // Auto-assign guest user so preview and game load immediately
        const guestName = 'Hero_' + Math.floor(Math.random() * 9000 + 1000);
        let userRec = await db.getUser(guestName);
        if (!userRec) {
            const guestPass = await bcrypt.hash('guestpass123', 10);
            userRec = await db.createUser({
                username: guestName,
                passwordHash: guestPass,
                role: 'player',
                stats: db.freshStats(),
                inventory: [],
                equipment: { weapon: null, armor: null }
            });
        }
        const guestToken = jwt.sign({ username: guestName, role: 'player' }, JWT_SECRET);
        socket.user = { username: guestName, role: 'player' };
        socket.pendingGuestToken = guestToken;
        next();
    } catch (e) {
        console.warn('Socket auth middleware note:', e.message);
        next();
    }
});

function broadcastState() {
    io.emit('state', { 
        players: Object.entries(liveWorld.players).map(([sid, p]) => ({ 
            id: sid, 
            username: p.username, 
            x: p.stats.pos.x, 
            z: p.stats.pos.z, 
            hp: p.stats.hp, 
            maxHp: p.stats.maxHp + ((p.equipment && p.equipment.armor && p.equipment.armor.hpBonus) ? p.equipment.armor.hpBonus : 0), 
            isGathering: p.isGathering, 
            isAttacking: p.isAttacking, 
            dead: p.dead, 
            weaponType: (p.equipment && p.equipment.weapon) ? p.equipment.weapon.weaponType : null,
            armorType: (p.equipment && p.equipment.armor) ? p.equipment.armor.armorType : null,
            gold: p.stats.gold,
            level: p.stats.level || 1,
            xp: p.stats.xp || 0,
            kills: p.stats.kills || 0 
        })),
        resources: Object.values(liveWorld.resources), 
        monsters: Object.values(liveWorld.monsters).map(m => ({ 
            id: m.id, 
            type: m.type, 
            name: MONSTER_TYPES[m.type].name || m.type,
            x: m.x, 
            z: m.z, 
            hp: m.hp, 
            maxHp: m.maxHp, 
            isHit: (Date.now() - m.lastHit < 150) 
        })), 
        loot: Object.values(liveWorld.loot)
    });
}

io.on('connection', async (socket) => {
    let userRec = socket.user ? await db.getUser(socket.user.username) : null;
    if (!userRec) {
        userRec = {
            username: socket.user ? socket.user.username : 'Adventurer',
            role: 'player',
            stats: db.freshStats(),
            inventory: [],
            equipment: { weapon: null, armor: null }
        };
    }
    const p = { username: userRec.username, role: userRec.role, stats: JSON.parse(JSON.stringify(userRec.stats)), inventory: userRec.inventory || [], equipment: userRec.equipment || { weapon: null, armor: null }, socketId: socket.id, target: null, isGathering: false, isAttacking: false, dead: false, atkCd: 0 };
    liveWorld.players[socket.id] = p;
    socket.emit('init', { socketId: socket.id, username: p.username });
    if (socket.pendingGuestToken) {
        socket.emit('authSuccess', { token: socket.pendingGuestToken, username: p.username });
    }
    socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
    broadcastState();

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
                const goldGained = Math.floor(Math.random() * (mobDef.gold ? (mobDef.gold[1] - mobDef.gold[0]) : 20)) + (mobDef.gold ? mobDef.gold[0] : 15);
                p.stats.gold += goldGained;
                const xpGain = mobDef.xp || 30;
                p.stats.xp = (p.stats.xp || 0) + xpGain;
                p.stats.kills = (p.stats.kills || 0) + 1;
                const reqXp = xpForLevel(p.stats.level || 1);
                if (p.stats.xp >= reqXp) {
                    p.stats.xp -= reqXp;
                    p.stats.level = (p.stats.level || 1) + 1;
                    p.stats.maxHp += 20;
                    const armorHp = (p.equipment && p.equipment.armor && p.equipment.armor.hpBonus) ? p.equipment.armor.hpBonus : 0;
                    p.stats.hp = p.stats.maxHp + armorHp;
                    p.stats.baseDamage = (p.stats.baseDamage || 8) + 3;
                    socket.emit('notice', `⚔️ LEVEL UP! You reached Level ${p.stats.level}! (+20 HP, +3 DMG)`);
                    io.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z, level: p.stats.level });
                }
                socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
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
        if (!item) return;
        if ((p.stats.gold || 0) < item.price) {
            return socket.emit('notice', `❌ Not enough gold to buy ${item.name}! (Need ${item.price}g)`);
        }
        p.stats.gold -= item.price;
        p.inventory.push({ ...item, itemId, uid: Date.now().toString() });
        socket.emit('notice', `🛍️ Purchased ${item.name} for ${item.price}g!`);
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });
    const RECIPES = {
        wood_sword: { mats: { raw_wood: 3 }, gold: 10 },
        novice_axe: { mats: { raw_wood: 2, raw_ore: 1 }, gold: 10 },
        steel_broadsword: { mats: { raw_ore: 4, raw_wood: 2 }, gold: 30 },
        flame_dagger: { mats: { demon_horn: 2, raw_ore: 2 }, gold: 35 },
        battle_hammer: { mats: { ogre_bone: 3, raw_ore: 4 }, gold: 50 },
        crystal_spear: { mats: { spider_silk: 3, skeleton_skull: 2 }, gold: 45 },
        leather_armor: { mats: { raw_wood: 4, ogre_bone: 1 }, gold: 20 },
        iron_plate: { mats: { raw_ore: 6 }, gold: 40 },
        demon_carapace: { mats: { demon_horn: 3, skeleton_skull: 2 }, gold: 75 }
    };
    socket.on('craftItem', (itemId) => {
        const recipe = RECIPES[itemId];
        const targetItem = ITEMS[itemId];
        if (!recipe || !targetItem) return;
        if ((p.stats.gold || 0) < recipe.gold) {
            return socket.emit('notice', 'Need more gold to forge this item!');
        }
        const counts = {};
        p.inventory.forEach(it => { counts[it.itemId] = (counts[it.itemId] || 0) + 1; });
        for (const [matId, req] of Object.entries(recipe.mats)) {
            if ((counts[matId] || 0) < req) {
                const matName = ITEMS[matId] ? ITEMS[matId].name : matId;
                return socket.emit('notice', `Missing materials: need ${req}x ${matName}`);
            }
        }
        for (const [matId, req] of Object.entries(recipe.mats)) {
            let toRemove = req;
            for (let i = p.inventory.length - 1; i >= 0 && toRemove > 0; i--) {
                if (p.inventory[i].itemId === matId) {
                    p.inventory.splice(i, 1);
                    toRemove--;
                }
            }
        }
        p.stats.gold -= recipe.gold;
        p.inventory.push({ ...targetItem, itemId, uid: Date.now().toString() });
        socket.emit('notice', `✨ Successfully forged ${targetItem.name}!`);
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });
    socket.on('equipItem', (uid) => {
        const item = p.inventory.find(i => i.uid === uid);
        if (item) {
            if (item.type === 'weapon') {
                p.equipment.weapon = item;
            } else if (item.type === 'armor') {
                p.equipment.armor = item;
                const bonus = item.hpBonus || 0;
                p.stats.hp = Math.min(p.stats.hp + bonus, p.stats.maxHp + bonus);
            }
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
            broadcastState();
        }
    });
    socket.on('unequipItem', (slot) => {
        if (p.equipment && p.equipment[slot]) {
            const unequipped = p.equipment[slot];
            p.equipment[slot] = null;
            if (slot === 'armor' && unequipped.hpBonus) {
                p.stats.hp = Math.min(p.stats.hp, p.stats.maxHp);
            }
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
            broadcastState();
        }
    });
    socket.on('sellItem', (target) => {
        let index = -1;
        if (typeof target === 'number') {
            index = target;
        } else if (typeof target === 'string') {
            index = p.inventory.findIndex(it => it.uid === target);
        }
        if (index >= 0 && index < p.inventory.length) {
            const item = p.inventory[index];
            // If equipped, unequip first
            if (p.equipment && p.equipment.weapon && p.equipment.weapon.uid === item.uid) {
                p.equipment.weapon = null;
            }
            if (p.equipment && p.equipment.armor && p.equipment.armor.uid === item.uid) {
                p.equipment.armor = null;
                p.stats.hp = Math.min(p.stats.hp, p.stats.maxHp);
            }
            const goldEarned = item.sellValue || 5;
            p.stats.gold = (p.stats.gold || 0) + goldEarned;
            p.inventory.splice(index, 1);
            socket.emit('notice', `💰 Sold ${item.name} for +${goldEarned} Gold`);
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
            broadcastState();
        }
    });
    socket.on('sellAll', () => {
        let total = 0; p.inventory = p.inventory.filter(it => { if (it.type === 'material') { total += (it.sellValue || 5); return false; } return true; });
        p.stats.gold += total; socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
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
            else if (Date.now() > m.atkCd) {
                const baseMobDmg = MONSTER_TYPES[m.type].dmg;
                const def = (nearest.equipment && nearest.equipment.armor && nearest.equipment.armor.defense) ? nearest.equipment.armor.defense : 0;
                const netDmg = Math.max(2, baseMobDmg - def);
                nearest.stats.hp -= netDmg;
                m.atkCd = Date.now() + 1500;
                const effectiveMaxHp = nearest.stats.maxHp + ((nearest.equipment && nearest.equipment.armor && nearest.equipment.armor.hpBonus) ? nearest.equipment.armor.hpBonus : 0);
                if (nearest.stats.hp <= 0) { 
                    nearest.dead = true; 
                    nearest.stats.hp = 0; 
                    setTimeout(() => { 
                        nearest.dead = false; 
                        nearest.stats.hp = effectiveMaxHp; 
                        nearest.stats.pos = {x:0,z:0}; 
                    }, 4000); 
                } 
            }
        }
    });
    broadcastState();
}, 100);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Master Server Live on http://0.0.0.0:${PORT}`);
});

db.connect().then(async () => { 
    try {
        const name = process.env.ADMIN_USERNAME || 'admin';
        const existing = await db.getUser(name);
        if (!existing) {
            const pass = process.env.ADMIN_PASSWORD || 'admin123';
            const passwordHash = await bcrypt.hash(pass, 10);
            await db.createUser({ username: name, passwordHash, role: 'admin', stats: db.freshStats(), inventory: [], equipment: {weapon:null} });
        }
        console.log('Admin account verified');
    } catch (e) {
        console.warn('Admin account init note:', e.message);
    }
}).catch(err => {
    console.error('Database connection error in background:', err);
});