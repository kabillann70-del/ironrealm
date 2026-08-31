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
    const existing = await db.getUser(username);
    if (existing) return res.status(400).json({ error: 'Taken' });
    const passwordHash = await bcrypt.hash(password, 10);
    await db.createUser({ username, passwordHash, stats: db.freshStats() });
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUser(username);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(400).json({ error: 'Invalid' });
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, username: user.username });
});

app.get('/api/admin/players', async (req, res) => {
    const users = await db.getAllUsers();
    res.json(users);
});

// --- World State ---
const liveWorld = { players: {}, resources: {}, monsters: {}, loot: {} };

function spawnResource(type) {
    const id = 'res_' + Math.random().toString(36).substr(2, 5);
    liveWorld.resources[id] = { id, type, x: (Math.random()-0.5)*80, z: (Math.random()-0.5)*80, toolReq: RESOURCE_TYPES[type].toolReq };
}

function spawnMonster() {
    const types = Object.keys(MONSTER_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const id = 'mob_' + Math.random().toString(36).substr(2, 5);
    liveWorld.monsters[id] = {
        id, type, 
        x: (Math.random() - 0.5) * 60, 
        z: (Math.random() - 0.5) * 60,
        hp: MONSTER_TYPES[type].hp,
        maxHp: MONSTER_TYPES[type].hp,
        atkCd: 0
    };
}

// Initial Spawns
for(let i=0; i<15; i++) { spawnResource('tree'); spawnResource('rock'); }
for(let i=0; i<5; i++) { spawnMonster(); }

// --- Sockets ---
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        socket.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { next(new Error('Auth Error')); }
});

io.on('connection', async (socket) => {
    const userRec = await db.getUser(socket.user.username);
    if (!userRec) return socket.disconnect();

    const p = { ...userRec._doc, socketId: socket.id, target: null, isGathering: false, dead: false };
    liveWorld.players[p.username] = p;

    socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });

    socket.on('move', (pos) => {
        if (p.dead) return;
        p.isGathering = false;
        p.target = { x: pos.x, z: pos.z };
    });

    socket.on('startGathering', (id) => {
        const node = liveWorld.resources[id];
        if (!node || p.isGathering || p.dead) return;

        const dist = Math.hypot(node.x - p.stats.pos.x, node.z - p.stats.pos.z);
        if (dist > 3.5) return socket.emit('notice', 'Too far to gather!');

        p.isGathering = true;
        p.target = null;
        socket.emit('gatheringStart', { duration: 3000 });

        setTimeout(() => {
            if (!p.isGathering) return;
            const itemKey = RESOURCE_TYPES[node.type].item;
            const itemData = ITEMS[itemKey];
            
            p.inventory.push({ ...itemData, itemId: itemKey, uid: Date.now().toString() });
            delete liveWorld.resources[id];
            p.isGathering = false;
            
            socket.emit('gatheringFinished');
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory });
            setTimeout(() => spawnResource(node.type), 10000);
        }, 3000);
    });

    // --- Shop: Buy Logic ---
    socket.on('buyItem', (itemId) => {
        const itemData = ITEMS[itemId];
        if (!itemData || p.stats.gold < itemData.price) return socket.emit('notice', 'Not enough gold!');

        p.stats.gold -= itemData.price;
        p.inventory.push({ ...itemData, itemId, uid: Date.now().toString() });
        
        db.saveUser(p.username, { stats: p.stats, inventory: p.inventory });
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory });
        socket.emit('notice', `Bought ${itemData.name}!`);
    });

    // --- Sell Logic ---
    socket.on('sellItem', (index) => {
        let item = p.inventory[index];
        if (!item) return;

        if (!item.sellValue) {
            const catalogItem = Object.values(ITEMS).find(it => it.name === item.name);
            item.sellValue = catalogItem ? catalogItem.sellValue : 2;
        }

        p.stats.gold += item.sellValue;
        p.inventory.splice(index, 1);
        
        db.saveUser(p.username, { stats: p.stats, inventory: p.inventory });
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory });
        socket.emit('notice', `Sold ${item.name} for ${item.sellValue} gold`);
    });

    // --- Emergency Clear Inventory ---
    socket.on('clearInventory', () => {
        p.inventory = [];
        db.saveUser(p.username, { inventory: p.inventory });
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory });
        socket.emit('notice', 'Inventory cleared!');
    });

    socket.on('disconnect', async () => {
        await db.saveUser(p.username, { stats: p.stats, inventory: p.inventory });
        delete liveWorld.players[p.username];
    });
});

// --- Game Loop (Physics & AI) ---
setInterval(() => {
    // 1. Move Players
    Object.values(liveWorld.players).forEach(p => {
        if (!p.target || p.dead) return;
        const dx = p.target.x - p.stats.pos.x, dz = p.target.z - p.stats.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.3) {
            p.stats.pos.x += (dx/dist)*0.4; p.stats.pos.z += (dz/dist)*0.4;
        } else { p.target = null; }
    });

    // 2. Monster AI (Move toward nearest player and attack)
    Object.values(liveWorld.monsters).forEach(m => {
        let nearest = null, minDist = 15;
        Object.values(liveWorld.players).forEach(p => {
            if (p.dead) return;
            const d = Math.hypot(p.stats.pos.x - m.x, p.stats.pos.z - m.z);
            if (d < minDist) { minDist = d; nearest = p; }
        });

        if (nearest) {
            const dx = nearest.stats.pos.x - m.x, dz = nearest.stats.pos.z - m.z;
            if (minDist > 1.5) {
                m.x += (dx/minDist) * 0.15; m.z += (dz/minDist) * 0.15;
            } else {
                // Attack logic
                if (Date.now() > m.atkCd) {
                    const def = MONSTER_TYPES[m.type];
                    nearest.stats.hp -= def.dmg;
                    m.atkCd = Date.now() + 1500;
                    if (nearest.stats.hp <= 0) {
                        nearest.dead = true;
                        nearest.stats.hp = 0;
                        io.to(nearest.socketId).emit('notice', 'You have died!');
                        setTimeout(() => {
                            nearest.dead = false;
                            nearest.stats.hp = nearest.stats.maxHp;
                            nearest.stats.pos = { x: 0, z: 0 };
                        }, 5000);
                    }
                }
            }
        }
    });

    // 3. Broadcast World State
    io.emit('state', { 
        players: Object.values(liveWorld.players).map(p => ({ 
            username: p.username, x: p.stats.pos.x, z: p.stats.pos.z, 
            hp: p.stats.hp, maxHp: p.stats.maxHp, isGathering: p.isGathering, dead: p.dead
        })),
        resources: Object.values(liveWorld.resources),
        monsters: Object.values(liveWorld.monsters)
    });
}, 100);

async function seedAdmin() {
    const name = process.env.ADMIN_USERNAME || 'admin';
    const existing = await db.getUser(name);
    if (!existing) {
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        await db.createUser({ username: name, passwordHash, role: 'admin', stats: db.freshStats() });
        console.log("✅ Admin account created");
    }
}

db.connect().then(async () => {
    await seedAdmin();
    server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
});