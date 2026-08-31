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

// --- Auth ---
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

for(let i=0; i<15; i++) { spawnResource('tree'); spawnResource('rock'); }

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
    const p = { ...userRec._doc, socketId: socket.id, target: null, isGathering: false };
    liveWorld.players[p.username] = p;

    socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });

    socket.on('move', (pos) => {
        p.isGathering = false;
        p.target = { x: pos.x, z: pos.z };
    });

    socket.on('startGathering', (id) => {
        const node = liveWorld.resources[id];
        if (!node || p.isGathering) return;

        const dist = Math.hypot(node.x - p.stats.pos.x, node.z - p.stats.pos.z);
        if (dist > 3.5) {
            return socket.emit('notice', 'Too far to gather!');
        }

        p.isGathering = true;
        p.target = null;
        socket.emit('gatheringStart', { duration: 3000 });

        setTimeout(() => {
            if (!p.isGathering) return;
            p.inventory.push(ITEMS[RESOURCE_TYPES[node.type].item]);
            delete liveWorld.resources[id];
            p.isGathering = false;
            socket.emit('gatheringFinished');
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory });
            setTimeout(() => spawnResource(node.type), 10000);
        }, 3000);
    });

    socket.on('sellItem', (index) => {
        const item = p.inventory[index];
        if (item && item.sellValue) {
            p.stats.gold += item.sellValue;
            p.inventory.splice(index, 1);
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory });
            socket.emit('notice', `Sold ${item.name} for ${item.sellValue} gold`);
        }
    });

    socket.on('disconnect', async () => {
        await db.saveUser(p.username, { stats: p.stats, inventory: p.inventory });
        delete liveWorld.players[p.username];
    });
});

// Game Loop
setInterval(() => {
    Object.values(liveWorld.players).forEach(p => {
        if (!p.target) return;
        const dx = p.target.x - p.stats.pos.x, dz = p.target.z - p.stats.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.3) {
            p.stats.pos.x += (dx/dist)*0.4; p.stats.pos.z += (dz/dist)*0.4;
        } else { p.target = null; }
    });
    io.emit('state', { 
        players: Object.values(liveWorld.players).map(p => ({ 
            username: p.username, x: p.stats.pos.x, z: p.stats.pos.z, 
            hp: p.stats.hp, maxHp: p.stats.maxHp, isGathering: p.isGathering 
        })),
        resources: Object.values(liveWorld.resources)
    });
}, 100);

async function seedAdmin() {
    const name = process.env.ADMIN_USERNAME || 'admin';
    if (!await db.getUser(name)) {
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        await db.createUser({ username: name, passwordHash, role: 'admin', stats: db.freshStats() });
        console.log("✅ Admin account created");
    }
}

db.connect().then(async () => {
    await seedAdmin();
    server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
});