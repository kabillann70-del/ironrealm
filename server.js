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

const JWT_SECRET = process.env.JWT_SECRET || 'ironrealm_secret_key';
const PORT = process.env.PORT || 3000;
const GATHER_TIME = 3000; 

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Auth Helpers ---
function sign(user) {
    return jwt.sign({ username: user.username, role: user.role }, JWT_SECRET);
}

// --- API Routes ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const existing = await db.getUser(username);
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    await db.createUser({
        username,
        passwordHash,
        stats: db.freshStats(),
        inventory: []
    });
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUser(username);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Wrong password' });

    res.json({ token: sign(user), username: user.username });
});

// --- Admin Data Route ---
app.get('/api/admin/players', async (req, res) => {
    try {
        const header = req.headers.authorization;
        const token = header.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const users = await db.getAllUsers();
        res.json(users);
    } catch (e) {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// --- Live World State ---
const liveWorld = { players: {}, resources: {} };

// Spawn some initial resource nodes
function spawnResource(type, x, z) {
    const id = 'res_' + Math.random().toString(36).substr(2, 9);
    liveWorld.resources[id] = { id, type, x, z, toolReq: RESOURCE_TYPES[type].toolReq };
}

// Create a small forest and mine field
for(let i=0; i<10; i++) {
    spawnResource('tree', (Math.random()-0.5)*40, (Math.random()-0.5)*40);
    spawnResource('rock', (Math.random()-0.5)*40, (Math.random()-0.5)*40);
}

// --- Socket.io Logic ---
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        socket.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', async (socket) => {
    const userRec = await db.getUser(socket.user.username);
    if (!userRec) return socket.disconnect();

    const p = {
        username: userRec.username,
        role: userRec.role,
        stats: userRec.stats,
        inventory: userRec.inventory,
        equipment: userRec.equipment,
        socketId: socket.id,
        target: null,
        isGathering: false,
        dead: false
    };

    liveWorld.players[p.username] = p;
    console.log(`${p.username} joined the realm.`);

    // Send initial inventory
    socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });

    socket.on('move', (pos) => {
        if (p.dead) return;
        // If moving, cancel gathering
        if (p.isGathering) {
            p.isGathering = false;
            clearTimeout(p.gatherTimeout);
            socket.emit('gatheringFinished');
        }
        p.target = { x: pos.x, z: pos.z };
    });

    socket.on('startGathering', (nodeId) => {
        const node = liveWorld.resources[nodeId];
        if (!node || p.dead || p.isGathering) return;

        const dist = Math.hypot(node.x - p.stats.pos.x, node.z - p.stats.pos.z);
        if (dist > 4) return socket.emit('notice', 'Too far!');

        p.isGathering = true;
        p.target = null;
        socket.emit('gatheringStart', { duration: GATHER_TIME });

        p.gatherTimeout = setTimeout(async () => {
            if (!p.isGathering) return;

            const resDef = RESOURCE_TYPES[node.type];
            const newItem = { uid: Date.now().toString(), itemId: resDef.item, ...ITEMS[resDef.item] };
            
            p.inventory.push(newItem);
            p.isGathering = false;
            delete liveWorld.resources[nodeId];

            socket.emit('gatheringFinished');
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
            socket.emit('notice', `Gathered ${newItem.name}`);

            // Respawn node
            setTimeout(() => {
                spawnResource(node.type, (Math.random()-0.5)*50, (Math.random()-0.5)*50);
            }, 10000);

        }, GATHER_TIME);
    });

    socket.on('disconnect', async () => {
        console.log(`${p.username} left.`);
        await db.saveUser(p.username, {
            stats: p.stats,
            inventory: p.inventory,
            equipment: p.equipment
        });
        delete liveWorld.players[p.username];
    });
});

// --- Game Loop (10 FPS) ---
setInterval(() => {
    Object.values(liveWorld.players).forEach(p => {
        if (!p.target || p.dead) return;
        const dx = p.target.x - p.stats.pos.x;
        const dz = p.target.z - p.stats.pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.3) {
            p.stats.pos.x += (dx / dist) * 0.4;
            p.stats.pos.z += (dz / dist) * 0.4;
        } else {
            p.target = null;
        }
    });

    io.emit('state', {
        players: Object.values(liveWorld.players).map(p => ({
            username: p.username,
            x: p.stats.pos.x,
            z: p.stats.pos.z,
            hp: p.stats.hp,
            maxHp: p.stats.maxHp,
            isGathering: p.isGathering,
            dead: p.dead
        })),
        resources: Object.values(liveWorld.resources)
    });
}, 100);

// --- Fixed Startup Logic ---
async function seedAdmin() {
    const adminName = process.env.ADMIN_USERNAME || 'admin';
    const existing = await db.getUser(adminName);
    
    if (!existing) {
        const pass = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(pass, 10);
        
        await db.createUser({
            username: adminName,
            passwordHash,
            role: 'admin',
            stats: db.freshStats(),
            inventory: [],
            equipment: { weapon: null, armor: null, artifact: null }
        });
        console.log(`✅ Admin account created: ${adminName}`);
    } else {
        console.log(`ℹ️ Admin account "${adminName}" already exists.`);
    }
}

db.connect().then(async () => {
    console.log("✅ Connected to MongoDB Atlas");
    await seedAdmin();
    server.listen(PORT, () => {
        console.log(`🚀 IronRealm Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("❌ Failed to connect to MongoDB:", err);
});
