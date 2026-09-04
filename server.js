require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('./db');
const { ITEMS, ZONES, MONSTER_TYPES, RESOURCE_TYPES, getZoneAt, xpForLevel } = require('./items');

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
    
    // Include the role in the token so admin panel works
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, username: user.username, role: user.role });
});

// Admin route with proper role check
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

function getRandomInZone(zoneKey) {
    if (zoneKey === 'woodlands') {
        return {
            x: (Math.random() - 0.5) * 130,
            z: -30 - Math.random() * 80
        };
    } else if (zoneKey === 'frostpeak') {
        return {
            x: 30 + Math.random() * 95,
            z: (Math.random() - 0.5) * 55
        };
    } else if (zoneKey === 'necropolis') {
        return {
            x: -30 - Math.random() * 95,
            z: (Math.random() - 0.5) * 55
        };
    } else if (zoneKey === 'abyss') {
        return {
            x: -25 - Math.random() * 85,
            z: 30 + Math.random() * 85
        };
    } else if (zoneKey === 'boss_sanctum') {
        return {
            x: 55 + (Math.random() - 0.5) * 55,
            z: 55 + (Math.random() - 0.5) * 55
        };
    } else if (zoneKey === 'celestial_expanse') {
        return {
            x: 50 + Math.random() * 75,
            z: -45 - Math.random() * 75
        };
    }
    return { x: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100 };
}

function spawnResource(type, targetZone) {
    const id = 'res_' + Math.random().toString(36).substr(2, 5);
    const zones = ['woodlands', 'frostpeak', 'necropolis', 'abyss', 'boss_sanctum', 'celestial_expanse'];
    const zoneKey = targetZone || zones[Math.floor(Math.random() * zones.length)];
    const pos = getRandomInZone(zoneKey);
    const zoneDef = ZONES[zoneKey] || ZONES.woodlands;
    const itemDrop = type === 'tree' ? zoneDef.woodDrop : zoneDef.oreDrop;
    const itemDef = ITEMS[itemDrop] || { tier: 2, name: type };

    liveWorld.resources[id] = { 
        id, 
        type, 
        zone: zoneKey,
        tier: itemDef.tier || 2,
        itemDrop: itemDrop,
        name: itemDef.name,
        x: pos.x, 
        z: pos.z, 
        toolReq: RESOURCE_TYPES[type].toolReq 
    };
}

function spawnMonsterInZone(zoneKey, forceType = null) {
    const mobKeysInZone = Object.entries(MONSTER_TYPES)
        .filter(([k, def]) => def.zone === zoneKey && !def.isBoss)
        .map(([k]) => k);
    
    if (mobKeysInZone.length === 0 && !forceType) return;
    const type = forceType || mobKeysInZone[Math.floor(Math.random() * mobKeysInZone.length)];
    const id = 'mob_' + Math.random().toString(36).substr(2, 6);
    const pos = getRandomInZone(zoneKey);
    const def = MONSTER_TYPES[type];
    if (!def) return;

    liveWorld.monsters[id] = { 
        id, 
        type, 
        zone: zoneKey,
        x: pos.x, 
        z: pos.z, 
        hp: def.hp, 
        maxHp: def.hp, 
        isBoss: !!def.isBoss,
        isMiniBoss: !!def.isMiniBoss,
        isWorldClassBoss: !!def.isWorldClassBoss,
        level: def.level,
        atkCd: 0, 
        lastHit: 0 
    };
}

function spawnWorldBoss() {
    // Check if Ignisrax already exists
    const existing = Object.values(liveWorld.monsters).find(m => m.type === 'boss_dragon');
    if (!existing) {
        const id = 'boss_ignisrax';
        const def = MONSTER_TYPES.boss_dragon;
        liveWorld.monsters[id] = {
            id,
            type: 'boss_dragon',
            zone: 'boss_sanctum',
            x: 75,
            z: 75,
            hp: def.hp,
            maxHp: def.hp,
            isBoss: true,
            level: def.level,
            atkCd: 0,
            lastHit: 0
        };
        io.emit('notice', '🔥 [WORLD BOSS] Ignisrax the Abyssal Dragon Lord has descended upon The Obsidian Throne!');
        io.emit('vfx', { type: 'boss_spawn', x: 75, z: 75 });
    }

    // Check if Astraeus (World-Class Boss) already exists
    const existingWorldClass = Object.values(liveWorld.monsters).find(m => m.type === 'void_emperor');
    if (!existingWorldClass) {
        const id = 'boss_astraeus';
        const def = MONSTER_TYPES.void_emperor;
        liveWorld.monsters[id] = {
            id,
            type: 'void_emperor',
            zone: 'celestial_expanse',
            x: 85,
            z: -85,
            hp: def.hp,
            maxHp: def.hp,
            isBoss: true,
            isWorldClassBoss: true,
            level: def.level,
            atkCd: 0,
            lastHit: 0
        };
        io.emit('notice', '✨ [SUPREME WORLD-CLASS BOSS] Astraeus the Void Emperor has manifested in The Astral Dominion!');
        io.emit('vfx', { type: 'boss_spawn', x: 85, z: -85 });
    }
}

// Initial Population Across All 6 Zones
for(let i=0; i<25; i++) spawnResource('tree', 'woodlands'); 
for(let i=0; i<20; i++) spawnResource('rock', 'woodlands');

for(let i=0; i<20; i++) spawnResource('tree', 'frostpeak');
for(let i=0; i<22; i++) spawnResource('rock', 'frostpeak');

for(let i=0; i<20; i++) spawnResource('tree', 'necropolis');
for(let i=0; i<22; i++) spawnResource('rock', 'necropolis');

for(let i=0; i<20; i++) spawnResource('tree', 'abyss');
for(let i=0; i<22; i++) spawnResource('rock', 'abyss');

for(let i=0; i<12; i++) spawnResource('tree', 'boss_sanctum');
for(let i=0; i<15; i++) spawnResource('rock', 'boss_sanctum');

for(let i=0; i<15; i++) spawnResource('tree', 'celestial_expanse');
for(let i=0; i<18; i++) spawnResource('rock', 'celestial_expanse');

// Populate Zone Regular Mobs and Zone Minibosses
for(let i=0; i<8; i++) spawnMonsterInZone('woodlands');
spawnMonsterInZone('woodlands', 'bandit_warlord'); // Woodlands Miniboss

for(let i=0; i<7; i++) spawnMonsterInZone('frostpeak');
spawnMonsterInZone('frostpeak', 'frost_titan'); // Frostpeak Miniboss

for(let i=0; i<7; i++) spawnMonsterInZone('necropolis');
spawnMonsterInZone('necropolis', 'crypt_sovereign'); // Necropolis Miniboss

for(let i=0; i<7; i++) spawnMonsterInZone('abyss');
spawnMonsterInZone('abyss', 'infernal_warlord'); // Abyss Miniboss

for(let i=0; i<6; i++) spawnMonsterInZone('celestial_expanse');
spawnMonsterInZone('celestial_expanse', 'astral_archon'); // Astral Miniboss

// Spawn World Bosses
spawnWorldBoss();

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
        players: Object.entries(liveWorld.players).map(([sid, p]) => {
            const currentZone = getZoneAt(p.stats.pos.x, p.stats.pos.z);
            return { 
                id: sid, 
                username: p.username, 
                x: p.stats.pos.x, 
                z: p.stats.pos.z, 
                zone: currentZone.id,
                zoneName: currentZone.name,
                zoneRec: currentZone.recLevel,
                hp: p.stats.hp, 
                maxHp: p.stats.maxHp + ((p.equipment && p.equipment.armor && p.equipment.armor.hpBonus) ? p.equipment.armor.hpBonus : 0), 
                isGathering: p.isGathering, 
                isAttacking: p.isAttacking, 
                dead: p.dead, 
                weaponType: (p.equipment && p.equipment.weapon) ? p.equipment.weapon.weaponType : null,
                weaponId: (p.equipment && p.equipment.weapon) ? (p.equipment.weapon.itemId || p.equipment.weapon.id) : null,
                weaponTier: (p.equipment && p.equipment.weapon) ? (p.equipment.weapon.tier || 2) : null,
                armorType: (p.equipment && p.equipment.armor) ? p.equipment.armor.armorType : null,
                armorId: (p.equipment && p.equipment.armor) ? (p.equipment.armor.itemId || p.equipment.armor.id) : null,
                armorTier: (p.equipment && p.equipment.armor) ? (p.equipment.armor.tier || 2) : null,
                gold: p.stats.gold,
                level: p.stats.level || 1,
                xp: p.stats.xp || 0,
                kills: p.stats.kills || 0 
            };
        }),
        resources: Object.values(liveWorld.resources), 
        monsters: Object.values(liveWorld.monsters).map(m => {
            const def = MONSTER_TYPES[m.type] || { name: m.type, level: 1 };
            return { 
                id: m.id, 
                type: m.type, 
                name: def.name || m.type,
                level: m.level || def.level || 1,
                zone: m.zone || def.zone,
                isBoss: !!m.isBoss,
                isMiniBoss: !!m.isMiniBoss,
                x: m.x, 
                z: m.z, 
                hp: m.hp, 
                maxHp: m.maxHp, 
                isHit: (Date.now() - m.lastHit < 150) 
            };
        }), 
        loot: Object.values(liveWorld.loot)
    });
}

const RECIPES = {
    // --- TIER 2 (NOVICE) - Uses Birch Wood & Copper Ore ---
    wood_sword: { mats: { birch_wood: 4 }, gold: 160 },
    novice_axe: { mats: { birch_wood: 3, copper_ore: 2 }, gold: 140 },
    novice_bow: { mats: { birch_wood: 5 }, gold: 170 },
    novice_fire_staff: { mats: { birch_wood: 4, copper_ore: 2 }, gold: 180 },
    novice_robe: { mats: { birch_wood: 4 }, gold: 150 },
    leather_armor: { mats: { birch_wood: 5, copper_ore: 2 }, gold: 180 },
    novice_plate: { mats: { copper_ore: 6 }, gold: 220 },

    // --- TIER 3 (JOURNEYMAN) - Uses Chestnut Wood, Bronze Ore & Frost Spider Silk / Ogre Bone ---
    journeyman_claymore: { mats: { bronze_ore: 6, chestnut_wood: 4 }, gold: 750 },
    journeyman_warbow: { mats: { chestnut_wood: 6, spider_silk: 3 }, gold: 780 },
    journeyman_frost_staff: { mats: { spider_silk: 4, chestnut_wood: 3 }, gold: 850 },
    journeyman_hammer: { mats: { bronze_ore: 6, ogre_bone: 2 }, gold: 800 },
    journeyman_robe: { mats: { spider_silk: 4, chestnut_wood: 2 }, gold: 680 },
    journeyman_leather: { mats: { chestnut_wood: 4, spider_silk: 3 }, gold: 760 },
    journeyman_plate: { mats: { bronze_ore: 8, ogre_bone: 2 }, gold: 950 },

    // --- TIER 4 (ADEPT) - Uses Pine Wood, Iron Ore & Cursed Skull ---
    steel_broadsword: { mats: { iron_ore: 8, skeleton_skull: 3 }, gold: 2600 },
    adept_longbow: { mats: { pine_wood: 6, spider_silk: 4, skeleton_skull: 2 }, gold: 2800 },
    adept_cursed_staff: { mats: { skeleton_skull: 4, pine_wood: 4 }, gold: 3100 },
    adept_dagger: { mats: { iron_ore: 6, skeleton_skull: 3 }, gold: 2500 },
    adept_pike: { mats: { iron_ore: 6, pine_wood: 4 }, gold: 2700 },
    adept_mage_robe: { mats: { pine_wood: 4, skeleton_skull: 3 }, gold: 2400 },
    adept_assassin_jacket: { mats: { pine_wood: 5, skeleton_skull: 3 }, gold: 2850 },
    iron_plate: { mats: { iron_ore: 10, skeleton_skull: 4 }, gold: 3600 },

    // --- TIER 5 (EXPERT) - Uses Cedar Wood, Titanium Ore & Demon Horn ---
    flame_dagger: { mats: { demon_horn: 4, titanium_ore: 6 }, gold: 8400 },
    expert_whispering_bow: { mats: { cedar_wood: 6, demon_horn: 3 }, gold: 9000 },
    expert_infernal_staff: { mats: { demon_horn: 5, cedar_wood: 4 }, gold: 10200 },
    battle_hammer: { mats: { titanium_ore: 8, demon_horn: 4 }, gold: 9600 },
    crystal_spear: { mats: { cedar_wood: 6, titanium_ore: 4, demon_horn: 3 }, gold: 9300 },
    expert_royal_robe: { mats: { cedar_wood: 6, demon_horn: 4 }, gold: 7800 },
    expert_stalker_leather: { mats: { cedar_wood: 5, demon_horn: 4 }, gold: 9000 },
    demon_carapace: { mats: { demon_horn: 6, titanium_ore: 6 }, gold: 11400 },

    // --- TIER 6 (MASTER & BOSS RELICS) - Uses Bloodoak Wood, Runite Ore, Dragon Scales & Heart of Ruin ---
    master_relic_blade: { mats: { runite_ore: 10, dragon_scale: 3, bloodoak_wood: 5 }, gold: 28500 },
    master_bow_of_shadows: { mats: { bloodoak_wood: 8, dragon_scale: 3, runite_ore: 4 }, gold: 30500 },
    master_archmage_staff: { mats: { abyssal_core: 2, dragon_scale: 2, bloodoak_wood: 6 }, gold: 34500 },
    master_abyssal_hammer: { mats: { runite_ore: 10, abyssal_core: 2, bloodoak_wood: 4 }, gold: 32500 },
    master_archmage_vestment: { mats: { bloodoak_wood: 8, dragon_scale: 2, abyssal_core: 1 }, gold: 26500 },
    master_shadow_jacket: { mats: { bloodoak_wood: 7, dragon_scale: 3, runite_ore: 4 }, gold: 31500 },
    master_judicator_plate: { mats: { runite_ore: 12, dragon_scale: 4, abyssal_core: 1 }, gold: 38500 },

    // --- TIER 7 (WORLD-CLASS CELESTIAL RELICS) - Uses Astral Wood, Starfall Crystals & Void Shards ---
    celestial_greatsword: { mats: { starfall_crystal: 10, astral_wood: 6, void_shard: 3 }, gold: 85000 },
    celestial_bow: { mats: { astral_wood: 10, starfall_crystal: 6, void_shard: 3 }, gold: 88000 },
    celestial_staff: { mats: { astral_wood: 8, starfall_crystal: 8, void_shard: 4 }, gold: 95000 },
    celestial_carapace: { mats: { starfall_crystal: 14, void_shard: 5, astral_wood: 4 }, gold: 110000 }
};

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
    const p = { 
        username: userRec.username, 
        role: userRec.role, 
        stats: JSON.parse(JSON.stringify(userRec.stats)), 
        inventory: userRec.inventory || [], 
        equipment: userRec.equipment || { weapon: null, armor: null }, 
        socketId: socket.id, 
        target: null, 
        isGathering: false, 
        isAttacking: false, 
        dead: false, 
        atkCd: 0 
    };
    liveWorld.players[socket.id] = p;
    socket.emit('init', { socketId: socket.id, username: p.username });
    if (socket.pendingGuestToken) {
        socket.emit('authSuccess', { token: socket.pendingGuestToken, username: p.username });
    }
    socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
    broadcastState();

    socket.on('move', (pos) => { 
        if (!p.dead) { 
            p.isGathering = false; 
            p.isAttacking = false; 
            p.target = { x: pos.x, z: pos.z }; 
        } 
    });

    socket.on('jump', () => {
        if (!p.dead) {
            io.emit('vfx', { type: 'jump', playerId: socket.id, x: p.stats.pos.x, z: p.stats.pos.z });
        }
    });

    socket.on('chatMessage', (data) => {
        if (!data || typeof data.text !== 'string') return;
        const cleanText = data.text.trim().slice(0, 160);
        if (!cleanText) return;
        
        const currentZone = getZoneAt(p.stats.pos.x, p.stats.pos.z);
        const channel = data.channel || 'all';
        const msgPayload = {
            id: 'msg_' + Math.random().toString(36).substr(2, 7),
            sender: p.username,
            role: p.role || 'player',
            level: p.stats.level || 1,
            zone: currentZone.name,
            zoneId: currentZone.id,
            channel: channel,
            text: cleanText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Broadcast to all connected players
        io.emit('chatMessage', msgPayload);
        // Also emit 3D overhead chat bubble for this avatar
        io.emit('playerChatBubble', { socketId: socket.id, username: p.username, text: cleanText });
    });

    socket.on('startGathering', (id) => {
        const node = liveWorld.resources[id];
        if (!node || p.isGathering || p.dead) return;
        if (Math.hypot(node.x - p.stats.pos.x, node.z - p.stats.pos.z) > 6) return;
        p.isGathering = true; 
        p.target = null;
        socket.emit('gatheringStart', { duration: 3000 });
        setTimeout(() => {
            if (!p.isGathering) return;
            const itemKey = node.itemDrop || (node.type === 'tree' ? 'birch_wood' : 'copper_ore');
            const itemDef = ITEMS[itemKey] || { name: itemKey, type: 'material', tier: node.tier || 2 };
            p.inventory.push({ ...itemDef, itemId: itemKey, uid: Date.now().toString() });
            const oldZone = node.zone || 'woodlands';
            delete liveWorld.resources[id]; 
            p.isGathering = false;
            socket.emit('gatheringFinished');
            socket.emit('notice', `⛏️ Gathered 1x ${itemDef.name} (Tier ${itemDef.tier || 2})!`);
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
            broadcastState();
            setTimeout(() => { 
                spawnResource(node.type, oldZone); 
                broadcastState(); 
            }, 12000);
        }, 3000);
    });

    socket.on('startAttack', (mobId) => {
        const mob = liveWorld.monsters[mobId];
        if (!mob || p.dead) return;
        const maxRange = (p.equipment && p.equipment.weapon && p.equipment.weapon.range) ? p.equipment.weapon.range : 6;
        if (Math.hypot(mob.x - p.stats.pos.x, mob.z - p.stats.pos.z) > maxRange) return;
        if (Date.now() > p.atkCd) {
            p.isAttacking = true;
            const weaponDmg = (p.equipment && p.equipment.weapon) ? p.equipment.weapon.dmg : 5;
            const armorDmg = (p.equipment && p.equipment.armor && p.equipment.armor.dmgBonus) ? p.equipment.armor.dmgBonus : 0;
            const totalDmg = (p.stats.baseDamage + weaponDmg + armorDmg);
            mob.hp -= totalDmg; 
            mob.lastHit = Date.now(); 
            p.atkCd = Date.now() + 800;

            const wepType = (p.equipment && p.equipment.weapon) ? p.equipment.weapon.weaponType : 'sword';
            const projType = (p.equipment && p.equipment.weapon && p.equipment.weapon.projectile) ? p.equipment.weapon.projectile : (wepType === 'bow' ? 'arrow' : (wepType === 'staff' ? 'fireball' : null));

            if (projType) {
                io.emit('vfx', { type: 'projectile', fromX: p.stats.pos.x, fromZ: p.stats.pos.z, toX: mob.x, toZ: mob.z, projectile: projType, weaponType: wepType });
            }
            io.emit('vfx', { type: 'damage', x: mob.x, z: mob.z, amount: totalDmg, weaponType: wepType });

            if (mob.hp <= 0) {
                const mobDef = MONSTER_TYPES[mob.type];
                const mobZone = mob.zone || (mobDef ? mobDef.zone : 'woodlands');
                
                if (mobDef && mobDef.drops) {
                    mobDef.drops.forEach(drop => { 
                        if (Math.random() < drop.chance) { 
                            const lid = 'loot_' + Math.random().toString(36).substr(2, 5); 
                            liveWorld.loot[lid] = { 
                                id: lid, 
                                itemId: drop.item, 
                                x: mob.x + (Math.random() - 0.5) * 2, 
                                z: mob.z + (Math.random() - 0.5) * 2 
                            }; 
                        } 
                    });
                }

                const goldGained = Math.floor(Math.random() * (mobDef.gold ? (mobDef.gold[1] - mobDef.gold[0]) : 20)) + (mobDef.gold ? mobDef.gold[0] : 15);
                p.stats.gold += goldGained;
                const xpGain = mobDef.xp || 30;
                p.stats.xp = (p.stats.xp || 0) + xpGain;
                p.stats.kills = (p.stats.kills || 0) + 1;

                if (mob.type === 'void_emperor') {
                    io.emit('notice', `✨👑 [SUPREME COSMIC DEFEAT] Astraeus the Void Emperor was vanquished by ${p.username}! (+${goldGained.toLocaleString()}g, +${xpGain.toLocaleString()} XP)`);
                    io.emit('vfx', { type: 'boss_death', x: mob.x, z: mob.z, isWorldClass: true });
                } else if (mob.type === 'boss_dragon') {
                    io.emit('notice', `👑 [LEGENDARY VICTORY] Ignisrax the Dragon Lord was slain by ${p.username}! (+${goldGained.toLocaleString()}g, +${xpGain.toLocaleString()} XP)`);
                    io.emit('vfx', { type: 'boss_death', x: mob.x, z: mob.z });
                } else if (mob.isMiniBoss) {
                    io.emit('notice', `⚔️ [MINI-BOSS DEFEATED] ${mobDef.name} was slain by ${p.username}! (+${goldGained.toLocaleString()}g)`);
                }

                const reqXp = xpForLevel(p.stats.level || 1);
                if (p.stats.xp >= reqXp) {
                    p.stats.xp -= reqXp;
                    p.stats.level = (p.stats.level || 1) + 1;
                    p.stats.maxHp += 25;
                    const armorHp = (p.equipment && p.equipment.armor && p.equipment.armor.hpBonus) ? p.equipment.armor.hpBonus : 0;
                    p.stats.hp = p.stats.maxHp + armorHp;
                    p.stats.baseDamage = (p.stats.baseDamage || 8) + 4;
                    socket.emit('notice', `⚔️ LEVEL UP! You reached Level ${p.stats.level}! (+25 HP, +4 Base DMG)`);
                    io.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z, level: p.stats.level });
                }

                socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
                delete liveWorld.monsters[mobId]; 

                if (mob.type === 'boss_dragon' || mob.type === 'void_emperor') {
                    setTimeout(() => { 
                        spawnWorldBoss(); 
                        broadcastState(); 
                    }, 45000);
                } else if (mob.isMiniBoss) {
                    setTimeout(() => {
                        spawnMonsterInZone(mobZone, mob.type);
                        broadcastState();
                    }, 25000);
                } else {
                    setTimeout(() => { 
                        spawnMonsterInZone(mobZone); 
                        broadcastState(); 
                    }, 6000);
                }
            }
            setTimeout(() => { p.isAttacking = false; }, 350);
        }
    });

    socket.on('lootItem', (lid) => {
        const item = liveWorld.loot[lid];
        if (!item || Math.hypot(item.x - p.stats.pos.x, item.z - p.stats.pos.z) > 4) return;
        p.inventory.push({ ...ITEMS[item.itemId], itemId: item.itemId, uid: Date.now().toString() });
        delete liveWorld.loot[lid]; 
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('buyItem', (itemId) => {
        const item = ITEMS[itemId];
        if (!item) return;
        if ((p.stats.gold || 0) < item.price) {
            return socket.emit('notice', `❌ Not enough gold to buy ${item.name}! (Requires ${item.price.toLocaleString()}g)`);
        }
        p.stats.gold -= item.price;
        p.inventory.push({ ...item, itemId, uid: Date.now().toString() });
        socket.emit('notice', `🛍️ Purchased ${item.name} for ${item.price.toLocaleString()}g!`);
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('craftItem', (itemId) => {
        const recipe = RECIPES[itemId];
        const targetItem = ITEMS[itemId];
        if (!recipe || !targetItem) return;
        if ((p.stats.gold || 0) < recipe.gold) {
            return socket.emit('notice', `❌ Need ${recipe.gold.toLocaleString()}g to forge this item!`);
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
            socket.emit('notice', `💰 Sold ${item.name} for +${goldEarned.toLocaleString()} Gold`);
            socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
            broadcastState();
        }
    });

    socket.on('sellAll', () => {
        let total = 0; 
        p.inventory = p.inventory.filter(it => { 
            if (it.type === 'material') { 
                total += (it.sellValue || 5); 
                return false; 
            } 
            return true; 
        });
        p.stats.gold += total; 
        socket.emit('notice', `💰 Sold all materials for +${total.toLocaleString()} Gold`);
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('clearInventory', () => { 
        p.inventory = []; 
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment }); 
    });

    socket.on('disconnect', async () => { 
        await db.saveUser(p.username, { stats: p.stats, inventory: p.inventory, equipment: p.equipment }); 
        delete liveWorld.players[socket.id]; 
    });
});

setInterval(() => {
    Object.values(liveWorld.players).forEach(p => { 
        if (!p.target || p.dead) return; 
        const dx = p.target.x - p.stats.pos.x, dz = p.target.z - p.stats.pos.z, dist = Math.hypot(dx, dz); 
        if (dist > 0.4) { 
            p.stats.pos.x += (dx/dist)*0.45; 
            p.stats.pos.z += (dz/dist)*0.45; 
        } else { 
            p.target = null; 
        } 
    });

    Object.values(liveWorld.monsters).forEach(m => {
        let nearest = null, minDist = m.isBoss ? 28 : 16;
        Object.values(liveWorld.players).forEach(p => { 
            if (p.dead) return; 
            const d = Math.hypot(p.stats.pos.x - m.x, p.stats.pos.z - m.z); 
            if (d < minDist) { minDist = d; nearest = p; } 
        });
        if (nearest) {
            const dx = nearest.stats.pos.x - m.x, dz = nearest.stats.pos.z - m.z;
            const mobDef = MONSTER_TYPES[m.type] || { dmg: 10, speed: 1.5 };
            const stepSpeed = (mobDef.speed || 1.5) * 0.08;
            if (minDist > (m.isBoss ? 4.5 : 2.2)) { 
                m.x += (dx/minDist) * stepSpeed; 
                m.z += (dz/minDist) * stepSpeed; 
            } else if (Date.now() > m.atkCd) {
                const baseMobDmg = mobDef.dmg || 10;
                const def = (nearest.equipment && nearest.equipment.armor && nearest.equipment.armor.defense) ? nearest.equipment.armor.defense : 0;
                const netDmg = Math.max(3, baseMobDmg - def);
                nearest.stats.hp -= netDmg;
                m.atkCd = Date.now() + (m.isBoss ? 1100 : 1400);

                if (m.isBoss) {
                    io.emit('vfx', { type: 'boss_breath', fromX: m.x, fromZ: m.z, toX: nearest.stats.pos.x, toZ: nearest.stats.pos.z });
                }

                const effectiveMaxHp = nearest.stats.maxHp + ((nearest.equipment && nearest.equipment.armor && nearest.equipment.armor.hpBonus) ? nearest.equipment.armor.hpBonus : 0);
                if (nearest.stats.hp <= 0) { 
                    nearest.dead = true; 
                    nearest.stats.hp = 0; 
                    setTimeout(() => { 
                        nearest.dead = false; 
                        nearest.stats.hp = effectiveMaxHp; 
                        nearest.stats.pos = { x: 0, z: 0 }; 
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