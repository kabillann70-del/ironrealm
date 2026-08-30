require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('./db');
const { ITEMS, MONSTER_TYPES, RESOURCE_TYPES, RECIPES, xpForLevel } = require('./items');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const JWT_SECRET = process.env.JWT_SECRET || 'change_this';
const WORLD_HALF = 55;
const GATHER_TIME = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
function sign(user) { return jwt.sign({ username: user.username, role: user.role }, JWT_SECRET); }
function derivedCombat(p) {
    const w = p.equipment.weapon, a = p.equipment.armor;
    return {
        damage: p.stats.baseDamage + (w ? (w.dmg || 0) : 0),
        defense: a ? (a.def || 0) : 0,
        speed: 4,
        maxHp: p.stats.maxHp
    };
}

// Routes
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (await db.getUser(username)) return res.status(400).json({ error: 'Taken' });
    const passwordHash = await bcrypt.hash(password, 10);
    await db.createUser({ username, passwordHash, stats: db.freshStats() });
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUser(username);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(400).json({ error: 'Invalid' });
    res.json({ token: sign(user), username: user.username });
});

// Live State
const liveWorld = { players: {}, monsters: {}, loot: {}, resources: {} };

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        socket.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { next(new Error('Auth Error')); }
});

io.on('connection', async (socket) => {
    const userRec = await db.getUser(socket.user.username);
    const p = { 
        ...userRec._doc, socketId: socket.id, 
        target: null, isGathering: false, dead: false, atkCd: 0 
    };
    liveWorld.players[p.username] = p;

    socket.emit('inventory', { stats: p.stats, equipment: p.equipment, inventory: p.inventory });

    socket.on('move', (pos) => {
        if (p.dead) return;
        if (p.isGathering) { p.isGathering = false; clearTimeout(p.gatherTimeout); socket.emit('gatheringFinished'); }
        p.target = { x: pos.x, z: pos.z };
    });

    socket.on('startGathering', (nodeId) => {
        const node = liveWorld.resources[nodeId];
        if (!node || p.dead || p.isGathering) return;
        const tool = p.equipment.weapon;
        if (!tool || tool.toolType !== node.toolReq) return socket.emit('notice', `Needs ${node.toolReq} tool`);
        
        p.isGathering = true;
        p.target = null;
        socket.emit('gatheringStart', { duration: GATHER_TIME });
        p.gatherTimeout = setTimeout(() => {
            if (!p.isGathering) return;
            p.inventory.push({ uid: Date.now().toString(), itemId: RESOURCE_TYPES[node.type].item, ...ITEMS[RESOURCE_TYPES[node.type].item] });
            delete liveWorld.resources[nodeId];
            p.isGathering = false;
            socket.emit('gatheringFinished');
            socket.emit('inventory', { stats: p.stats, equipment: p.equipment, inventory: p.inventory });
        }, GATHER_TIME);
    });

    socket.on('disconnect', () => { 
        db.saveUser(p.username, { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        delete liveWorld.players[p.username]; 
    });
});

// Game Loop
setInterval(() => {
    Object.values(liveWorld.players).forEach(p => {
        if (p.dead || !p.target) return;
        const dx = p.target.x - p.stats.pos.x, dz = p.target.z - p.stats.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.2) {
            p.stats.pos.x += (dx / dist) * 0.4;
            p.stats.pos.z += (dz / dist) * 0.4;
        }
    });
    
    // Broadcast
    io.emit('state', { 
        players: Object.values(liveWorld.players).map(p => ({ 
            username: p.username, x: p.stats.pos.x, z: p.stats.pos.z, 
            hp: p.stats.hp, maxHp: p.stats.maxHp, isGathering: p.isGathering 
        })),
        resources: Object.values(liveWorld.resources)
    });
}, 100);

db.connect().then(() => server.listen(process.env.PORT || 3000));