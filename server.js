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
    const { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
    const existing = await db.getUser(username);
    if (existing) return res.status(400).json({ error: 'Username already taken' });
    
    const userEmail = email ? email.trim().toLowerCase() : '';
    const passwordHash = await bcrypt.hash(password, 10);
    await db.createUser({ 
        username, 
        email: userEmail,
        passwordHash, 
        role: 'player', 
        stats: db.freshStats(), 
        inventory: [], 
        equipment: { weapon: null } 
    });
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUserByEmailOrUsername(username);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.banned) return res.status(403).json({ error: 'You are banned from this server.' });
    
    // Include the role in the token so admin panel works
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, username: user.username, role: user.role });
});

app.post('/api/forgot-password', async (req, res) => {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername) return res.status(400).json({ error: 'Please enter your account username or email address.' });
    
    const user = await db.getUserByEmailOrUsername(emailOrUsername);
    if (!user) return res.status(404).json({ error: 'No account found with that username or email address.' });
    
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 mins
    
    await db.saveUser(user.username, {
        resetToken: code,
        resetTokenExpiry: expiry
    });
    
    let target = user.email || user.username;
    res.json({
        success: true,
        message: `Verification email sent! Your 6-digit reset code is: ${code}`,
        code: code,
        targetUser: user.username,
        email: target
    });
});

app.post('/api/reset-password', async (req, res) => {
    const { emailOrUsername, code, newPassword } = req.body;
    if (!emailOrUsername || !code || !newPassword) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
    }
    if (newPassword.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }
    
    const user = await db.getUserByEmailOrUsername(emailOrUsername);
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    
    if (!user.resetToken || user.resetToken !== code.trim()) {
        return res.status(400).json({ error: 'Invalid verification code.' });
    }
    
    if (!user.resetTokenExpiry || Date.now() > user.resetTokenExpiry) {
        return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.saveUser(user.username, {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpiry: null
    });
    
    res.json({ success: true, message: 'Password reset successful! You can now log in.' });
});

// --- Token Auth Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication token required' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// --- QUESTS CATALOG & DAILY REWARD SYSTEM DATA ---
const QUESTS_CATALOG = [
    {
        id: 'q_first_blood',
        title: 'First Blood in IronRealm',
        category: 'Novice',
        desc: 'Slay 3 monsters in the realm to prove your initial combat prowess.',
        type: 'kill_any',
        goal: 3,
        rewardGold: 250,
        rewardXp: 300,
        rewardItems: [{ itemId: 'wood_sword', qty: 1 }],
        reqLevel: 1
    },
    {
        id: 'q_lumberjack',
        title: 'Timber for the Forge',
        category: 'Gathering',
        desc: 'Harvest 5 Birch Wood logs from Woodlands trees.',
        type: 'gather_wood',
        goal: 5,
        rewardGold: 300,
        rewardXp: 400,
        rewardItems: [{ itemId: 'leather_armor', qty: 1 }],
        reqLevel: 1
    },
    {
        id: 'q_copper_miner',
        title: 'Veins of Copper',
        category: 'Gathering',
        desc: 'Mine 5 Copper Ore nodes from mineral deposits.',
        type: 'gather_ore',
        goal: 5,
        rewardGold: 350,
        rewardXp: 450,
        rewardItems: [{ itemId: 'novice_axe', qty: 1 }],
        reqLevel: 1
    },
    {
        id: 'q_monster_slayer',
        title: 'Realm Extermination',
        category: 'Combat',
        desc: 'Vanquish 10 monsters of any type across the world.',
        type: 'kill_any',
        goal: 10,
        rewardGold: 750,
        rewardXp: 900,
        rewardItems: [{ itemId: 'health_potion', qty: 3 }],
        reqLevel: 2
    },
    {
        id: 'q_apprentice_smith',
        title: 'Blacksmithing Initiate',
        category: 'Crafting',
        desc: 'Craft 1 piece of equipment at the Sanctuary Anvil Forge.',
        type: 'craft_item',
        goal: 1,
        rewardGold: 600,
        rewardXp: 700,
        rewardItems: [{ itemId: 'mana_potion', qty: 3 }],
        reqLevel: 2
    },
    {
        id: 'q_reach_level5',
        title: 'Rising Adventurer',
        category: 'Progression',
        desc: 'Attain Character Level 5.',
        type: 'reach_level',
        goal: 5,
        rewardGold: 2000,
        rewardXp: 1500,
        rewardItems: [{ itemId: 'steel_broadsword', qty: 1 }],
        reqLevel: 1
    },
    {
        id: 'q_miniboss_slayer',
        title: 'Warlord Defeater',
        category: 'Heroic',
        desc: 'Slay a Zone Miniboss (Bandit Warlord, Frost Titan, Crypt Sovereign, or Infernal Warlord).',
        type: 'kill_miniboss',
        goal: 1,
        rewardGold: 4500,
        rewardXp: 5000,
        rewardItems: [{ itemId: 'adept_cursed_staff', qty: 1 }],
        reqLevel: 4
    },
    {
        id: 'q_slay_dragon',
        title: 'Slayer of Ignisrax',
        category: 'Legendary',
        desc: 'Vanquish the World Boss Ignisrax the Abyssal Dragon Lord.',
        type: 'kill_boss',
        goal: 1,
        rewardGold: 18000,
        rewardXp: 25000,
        rewardItems: [{ itemId: 'master_relic_blade', qty: 1 }],
        reqLevel: 8
    },
    {
        id: 'q_reach_level10',
        title: 'Champion of IronRealm',
        category: 'Legendary',
        desc: 'Attain Character Level 10.',
        type: 'reach_level',
        goal: 10,
        rewardGold: 30000,
        rewardXp: 35000,
        rewardItems: [{ itemId: 'celestial_greatsword', qty: 1 }],
        reqLevel: 5
    }
];

const ENDGAME_QUESTS_CATALOG = [
    {
        id: 'q_endgame_slayer_1',
        title: 'Master Slayer: Realm Extermination',
        category: 'Veteran',
        desc: 'Vanquish 25 monsters of any type across high-tier zones.',
        type: 'kill_any',
        goal: 25,
        rewardGold: 15000,
        rewardXp: 20000,
        rewardItems: [{ itemId: 'starfall_crystal', qty: 3 }],
        reqLevel: 10
    },
    {
        id: 'q_endgame_astral_monarch',
        title: 'Conqueror of the Void Emperor',
        category: 'World-Class',
        desc: 'Slay Astraeus the Void Emperor in the Astral Dominion.',
        type: 'kill_boss',
        goal: 1,
        rewardGold: 50000,
        rewardXp: 75000,
        rewardItems: [{ itemId: 'celestial_staff', qty: 1 }],
        reqLevel: 10
    },
    {
        id: 'q_endgame_grandmaster_smith',
        title: 'Grandmaster Forge Artisan',
        category: 'Mastery',
        desc: 'Forge 5 legendary equipment pieces at the Sanctuary Blacksmith.',
        type: 'craft_item',
        goal: 5,
        rewardGold: 35000,
        rewardXp: 40000,
        rewardItems: [{ itemId: 'void_shard', qty: 2 }],
        reqLevel: 10
    },
    {
        id: 'q_endgame_master_resource',
        title: 'Astral & World-Tree Harvester',
        category: 'Mastery',
        desc: 'Harvest 15 Celestial Wood or Astral Ore from high-tier zones.',
        type: 'gather_ore',
        goal: 15,
        rewardGold: 25000,
        rewardXp: 30000,
        rewardItems: [{ itemId: 'celestial_carapace', qty: 1 }],
        reqLevel: 10
    },
    {
        id: 'q_endgame_miniboss_purge',
        title: 'Titan & Sovereign Purge',
        category: 'Veteran',
        desc: 'Defeat 3 Zone Minibosses across the world.',
        type: 'kill_miniboss',
        goal: 3,
        rewardGold: 30000,
        rewardXp: 35000,
        rewardItems: [{ itemId: 'master_archmage_staff', qty: 1 }],
        reqLevel: 10
    }
];

function areAllBaseQuestsClaimed(userQuests) {
    if (!userQuests) return false;
    return QUESTS_CATALOG.every(q => userQuests[q.id] && userQuests[q.id].status === 'claimed');
}

function areAllEndgameQuestsClaimed(userQuests) {
    if (!userQuests) return false;
    return ENDGAME_QUESTS_CATALOG.every(q => userQuests[q.id] && userQuests[q.id].status === 'claimed');
}

function getProceduralWave(userQuests) {
    if (!userQuests) return 1;
    let wave = 1;
    while (true) {
        const id1 = `q_inf_hunt_${wave}`;
        const id2 = `q_inf_gather_${wave}`;
        const id3 = `q_inf_craft_${wave}`;
        
        const c1 = userQuests[id1] && userQuests[id1].status === 'claimed';
        const c2 = userQuests[id2] && userQuests[id2].status === 'claimed';
        const c3 = userQuests[id3] && userQuests[id3].status === 'claimed';
        
        if (c1 && c2 && c3) {
            wave++;
        } else {
            break;
        }
    }
    return wave;
}

function getProceduralQuestDefs(wave) {
    const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
    const roman = romanNumerals[wave] || `Wave ${wave}`;
    
    return [
        {
            id: `q_inf_hunt_${wave}`,
            title: `Infinite Slayer ${roman}`,
            category: 'Infinite Hunt',
            desc: `Slay ${wave * 5} monsters of any type across the realm.`,
            type: 'kill_any',
            goal: wave * 5,
            rewardGold: wave * 3000,
            rewardXp: wave * 4000,
            rewardItems: [
                { itemId: wave % 2 === 0 ? 'starfall_crystal' : 'void_shard', qty: Math.min(8, Math.ceil(wave / 2)) }
            ],
            reqLevel: 10
        },
        {
            id: `q_inf_gather_${wave}`,
            title: `Infinite Harvester ${roman}`,
            category: 'Infinite Gathering',
            desc: `Harvest ${wave * 4} wood logs or mineral ores from any biome.`,
            type: 'gather_ore',
            goal: wave * 4,
            rewardGold: wave * 2500,
            rewardXp: wave * 3500,
            rewardItems: [
                { itemId: wave % 2 === 0 ? 'celestial_wood' : 'dragon_scale', qty: Math.min(8, Math.ceil(wave / 2)) }
            ],
            reqLevel: 10
        },
        {
            id: `q_inf_craft_${wave}`,
            title: `Infinite Forge Artisan ${roman}`,
            category: 'Infinite Crafting',
            desc: `Forge ${Math.max(1, Math.min(5, Math.floor(wave / 2)))} equipment pieces at the anvil.`,
            type: 'craft_item',
            goal: Math.max(1, Math.min(5, Math.floor(wave / 2))),
            rewardGold: wave * 3500,
            rewardXp: wave * 4500,
            rewardItems: [
                { itemId: 'abyssal_core', qty: Math.min(3, Math.ceil(wave / 3)) }
            ],
            reqLevel: 10
        }
    ];
}

function getAllAvailableQuestDefs(userQuests) {
    let list = [...QUESTS_CATALOG];
    if (areAllBaseQuestsClaimed(userQuests)) {
        list = list.concat(ENDGAME_QUESTS_CATALOG);
        if (areAllEndgameQuestsClaimed(userQuests)) {
            const wave = getProceduralWave(userQuests);
            list = list.concat(getProceduralQuestDefs(wave));
        }
    }
    return list;
}

const DAILY_REWARDS_SCHEDULE = [
    { day: 1, gold: 500, xp: 250, items: [{ itemId: 'health_potion', qty: 3 }], title: 'Initiate Cache', icon: '🎁' },
    { day: 2, gold: 1200, xp: 600, items: [{ itemId: 'birch_wood', qty: 5 }, { itemId: 'copper_ore', qty: 5 }], title: 'Resource Bundle', icon: '🌲' },
    { day: 3, gold: 2500, xp: 1200, items: [{ itemId: 'mana_potion', qty: 5 }], title: 'Arcane Elixir Reserve', icon: '🧪' },
    { day: 4, gold: 5000, xp: 2500, items: [{ itemId: 'leather_armor', qty: 1 }], title: 'Veteran Leather Gear', icon: '🛡️' },
    { day: 5, gold: 10000, xp: 5000, items: [{ itemId: 'iron_ore', qty: 5 }, { itemId: 'skeleton_skull', qty: 2 }], title: 'Iron Smithing Crate', icon: '⛏️' },
    { day: 6, gold: 20000, xp: 10000, items: [{ itemId: 'steel_broadsword', qty: 1 }], title: 'Steel Broadsword Relic', icon: '⚔️' },
    { day: 7, gold: 50000, xp: 25000, items: [{ itemId: 'starfall_crystal', qty: 2 }, { itemId: 'health_potion', qty: 10 }], title: 'Celestial Dragon Cache', icon: '👑' }
];

function getTodayDateStr() {
    const d = new Date();
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getYesterdayDateStr() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initUserQuests(userRecord) {
    if (!userRecord.quests || typeof userRecord.quests !== 'object') {
        userRecord.quests = {};
    }
    const defs = getAllAvailableQuestDefs(userRecord.quests);
    defs.forEach(q => {
        if (!userRecord.quests[q.id]) {
            userRecord.quests[q.id] = {
                status: 'active',
                progress: 0,
                goal: q.goal
            };
        }
    });
    return userRecord.quests;
}

function initUserDailyReward(userRecord) {
    if (!userRecord.dailyReward || typeof userRecord.dailyReward !== 'object') {
        userRecord.dailyReward = { lastClaimDate: '', streak: 0 };
    }
    return userRecord.dailyReward;
}

function buildQuestsResponse(userQuests) {
    const defs = getAllAvailableQuestDefs(userQuests);
    return defs.map(qDef => {
        const uState = (userQuests && userQuests[qDef.id]) ? userQuests[qDef.id] : { status: 'active', progress: 0, goal: qDef.goal };
        return {
            ...qDef,
            progress: uState.progress !== undefined ? uState.progress : 0,
            status: uState.status || 'active'
        };
    });
}

function updatePlayerQuestProgress(p, eventType, amount = 1) {
    if (!p || !p.username) return;
    p.quests = p.quests || {};

    const defs = getAllAvailableQuestDefs(p.quests);
    defs.forEach(q => {
        if (!p.quests[q.id]) {
            p.quests[q.id] = { status: 'active', progress: 0, goal: q.goal };
        }
    });

    let updated = false;

    defs.forEach(qDef => {
        const qState = p.quests[qDef.id];
        if (!qState || qState.status !== 'active') return;

        let apply = false;
        if (qDef.type === eventType) {
            apply = true;
        } else if (eventType === 'kill_miniboss' && qDef.type === 'kill_any') {
            apply = true;
        } else if (eventType === 'kill_boss' && qDef.type === 'kill_any') {
            apply = true;
        } else if (eventType === 'gather_wood' && qDef.type === 'gather_ore') {
            apply = true;
        }

        if (qDef.type === 'reach_level') {
            qState.progress = p.stats.level || 1;
            updated = true;
        } else if (apply) {
            qState.progress = Math.min(qDef.goal, (qState.progress || 0) + amount);
            updated = true;
        }

        if (qState.progress >= qDef.goal && qState.status === 'active') {
            qState.status = 'completed';
            updated = true;
            const pSocket = io.sockets.sockets.get(p.socketId);
            if (pSocket) {
                pSocket.emit('notice', `📜 QUEST COMPLETED: ${qDef.title}! Open Quest Log [Q] to claim rewards.`);
                pSocket.emit('combatLog', { msg: `Quest Completed: ${qDef.title}`, type: 'lvl_up' });
                pSocket.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z });
            }
        }
    });

    if (updated) {
        const pSocket = io.sockets.sockets.get(p.socketId);
        if (pSocket) {
            pSocket.emit('questsUpdate', buildQuestsResponse(p.quests));
        }
        db.saveUser(p.username, { quests: p.quests });
    }
}

async function claimQuestReward(username, questId) {
    const userRec = await db.getUser(username);
    if (!userRec) return { error: 'User not found' };

    userRec.quests = initUserQuests(userRec);
    const defs = getAllAvailableQuestDefs(userRec.quests);
    const qDef = defs.find(q => q.id === questId) || QUESTS_CATALOG.find(q => q.id === questId) || ENDGAME_QUESTS_CATALOG.find(q => q.id === questId);
    if (!qDef) return { error: 'Quest not found' };

    const qState = userRec.quests[questId];
    if (!qState || qState.status !== 'completed') {
        if (qState && qState.status === 'claimed') return { error: 'Quest reward already claimed' };
        return { error: 'Quest objectives not completed yet' };
    }

    qState.status = 'claimed';

    userRec.stats = userRec.stats || db.freshStats();
    userRec.stats.gold = (userRec.stats.gold || 0) + (qDef.rewardGold || 0);
    userRec.stats.xp = (userRec.stats.xp || 0) + (qDef.rewardXp || 0);

    const reqXp = xpForLevel(userRec.stats.level || 1);
    if (userRec.stats.xp >= reqXp) {
        userRec.stats.xp -= reqXp;
        userRec.stats.level = (userRec.stats.level || 1) + 1;
        userRec.stats.statPoints = (userRec.stats.statPoints || 0) + 5;
        userRec.stats.maxHp += 25;
        userRec.stats.maxMp = (userRec.stats.maxMp || 100) + 20;
        userRec.stats.baseDamage = (userRec.stats.baseDamage || 8) + 4;
    }

    userRec.inventory = userRec.inventory || [];
    if (qDef.rewardItems && Array.isArray(qDef.rewardItems)) {
        qDef.rewardItems.forEach(itemInfo => {
            const itemDef = ITEMS[itemInfo.itemId];
            if (itemDef) {
                const qty = itemInfo.qty || 1;
                for (let i = 0; i < qty; i++) {
                    userRec.inventory.push({
                        ...itemDef,
                        itemId: itemInfo.itemId,
                        uid: 'item_' + Date.now() + Math.random().toString(36).substr(2, 5)
                    });
                }
            }
        });
    }

    await db.saveUser(username, {
        stats: userRec.stats,
        inventory: userRec.inventory,
        quests: userRec.quests
    });

    let liveP = Object.values(liveWorld.players).find(x => x.username === username);
    if (liveP) {
        liveP.stats = JSON.parse(JSON.stringify(userRec.stats));
        liveP.inventory = JSON.parse(JSON.stringify(userRec.inventory));
        liveP.quests = JSON.parse(JSON.stringify(userRec.quests));

        const pSocket = io.sockets.sockets.get(liveP.socketId);
        if (pSocket) {
            pSocket.emit('inventory', { stats: liveP.stats, inventory: liveP.inventory, equipment: liveP.equipment });
            pSocket.emit('questsUpdate', buildQuestsResponse(liveP.quests));
            pSocket.emit('notice', `🎉 Claimed rewards for '${qDef.title}': +${qDef.rewardGold} Gold, +${qDef.rewardXp} XP!`);
            pSocket.emit('vfx', { type: 'levelup', x: liveP.stats.pos.x, z: liveP.stats.pos.z });
        }
    }

    return {
        success: true,
        questId,
        rewardGold: qDef.rewardGold,
        rewardXp: qDef.rewardXp,
        rewardItems: qDef.rewardItems,
        quests: buildQuestsResponse(userRec.quests),
        stats: userRec.stats,
        inventory: userRec.inventory
    };
}

async function claimDailyRewardHelper(username) {
    const userRec = await db.getUser(username);
    if (!userRec) return { error: 'User not found' };

    userRec.dailyReward = initUserDailyReward(userRec);
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();

    if (userRec.dailyReward.lastClaimDate === today) {
        return { error: 'Daily reward already claimed today! Return tomorrow for your next streak reward.' };
    }

    let currentStreak = userRec.dailyReward.streak || 0;
    if (userRec.dailyReward.lastClaimDate === yesterday) {
        currentStreak = (currentStreak % 7) + 1;
    } else {
        currentStreak = 1;
    }

    const rewardDef = DAILY_REWARDS_SCHEDULE.find(r => r.day === currentStreak) || DAILY_REWARDS_SCHEDULE[0];

    userRec.stats = userRec.stats || db.freshStats();
    userRec.stats.gold = (userRec.stats.gold || 0) + (rewardDef.gold || 0);
    userRec.stats.xp = (userRec.stats.xp || 0) + (rewardDef.xp || 0);

    userRec.inventory = userRec.inventory || [];
    if (rewardDef.items && Array.isArray(rewardDef.items)) {
        rewardDef.items.forEach(itemInfo => {
            const itemDef = ITEMS[itemInfo.itemId];
            if (itemDef) {
                const qty = itemInfo.qty || 1;
                for (let i = 0; i < qty; i++) {
                    userRec.inventory.push({
                        ...itemDef,
                        itemId: itemInfo.itemId,
                        uid: 'daily_' + Date.now() + Math.random().toString(36).substr(2, 5)
                    });
                }
            }
        });
    }

    userRec.dailyReward.lastClaimDate = today;
    userRec.dailyReward.streak = currentStreak;

    await db.saveUser(username, {
        stats: userRec.stats,
        inventory: userRec.inventory,
        dailyReward: userRec.dailyReward
    });

    let liveP = Object.values(liveWorld.players).find(x => x.username === username);
    if (liveP) {
        liveP.stats = JSON.parse(JSON.stringify(userRec.stats));
        liveP.inventory = JSON.parse(JSON.stringify(userRec.inventory));
        liveP.dailyReward = JSON.parse(JSON.stringify(userRec.dailyReward));

        const pSocket = io.sockets.sockets.get(liveP.socketId);
        if (pSocket) {
            pSocket.emit('inventory', { stats: liveP.stats, inventory: liveP.inventory, equipment: liveP.equipment });
            pSocket.emit('dailyRewardUpdate', {
                todayDate: today,
                claimedToday: true,
                streak: currentStreak,
                lastClaimDate: today,
                schedule: DAILY_REWARDS_SCHEDULE
            });
            pSocket.emit('notice', `🎁 DAILY REWARD CLAIMED! (Day ${currentStreak}): +${rewardDef.gold} Gold, +${rewardDef.xp} XP!`);
            pSocket.emit('vfx', { type: 'levelup', x: liveP.stats.pos.x, z: liveP.stats.pos.z });
        }
    }

    return {
        success: true,
        streak: currentStreak,
        reward: rewardDef,
        dailyReward: userRec.dailyReward,
        stats: userRec.stats,
        inventory: userRec.inventory
    };
}

// --- NEW API ENDPOINTS FOR QUESTS & DAILY REWARD ---
app.get('/api/quests', authenticateToken, async (req, res) => {
    try {
        const userRec = await db.getUser(req.user.username);
        if (!userRec) return res.status(404).json({ error: 'User not found' });
        const userQuests = initUserQuests(userRec);
        res.json({ quests: buildQuestsResponse(userQuests) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/quests/claim', authenticateToken, async (req, res) => {
    try {
        const { questId } = req.body;
        if (!questId) return res.status(400).json({ error: 'Missing questId parameter' });
        const result = await claimQuestReward(req.user.username, questId);
        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/daily-reward', authenticateToken, async (req, res) => {
    try {
        const userRec = await db.getUser(req.user.username);
        if (!userRec) return res.status(404).json({ error: 'User not found' });
        const dr = initUserDailyReward(userRec);
        const today = getTodayDateStr();
        const yesterday = getYesterdayDateStr();
        const claimedToday = dr.lastClaimDate === today;
        
        let nextStreak = dr.streak || 0;
        if (!claimedToday) {
            nextStreak = (dr.lastClaimDate === yesterday) ? (nextStreak % 7) + 1 : 1;
        }

        res.json({
            todayDate: today,
            claimedToday,
            streak: dr.streak || 0,
            nextStreak,
            lastClaimDate: dr.lastClaimDate,
            schedule: DAILY_REWARDS_SCHEDULE
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/daily-reward/claim', authenticateToken, async (req, res) => {
    try {
        const result = await claimDailyRewardHelper(req.user.username);
        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
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

app.post('/api/admin/action', async (req, res) => {
    try {
        const header = req.headers.authorization;
        if (!header) return res.status(401).json({ error: 'No token' });
        const token = header.replace('Bearer ', '');
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch(err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Only admins allowed' });

        const { targetUser, action, amount } = req.body;
        if (!targetUser || !action) return res.status(400).json({ error: 'Missing parameters' });

        const userRecord = await db.getUser(targetUser);
        if (!userRecord && action !== 'delete' && action !== 'remove') return res.status(404).json({ error: 'User not found' });

        const amt = parseInt(amount) || 0;
        let pState = liveWorld.players ? Object.values(liveWorld.players).find(p => p.username === targetUser) : null;
        let targetSocket = pState ? io.sockets.sockets.get(pState.socketId) : null;

        switch (action) {
            case 'kick':
                if (targetSocket) {
                    targetSocket.emit('notice', '🛑 You have been kicked by an admin.');
                    targetSocket.disconnect(true);
                }
                if (pState) {
                    delete liveWorld.players[pState.socketId];
                    broadcastState();
                }
                break;
            case 'ban':
                if (userRecord) {
                    userRecord.banned = true;
                }
                if (targetSocket) {
                    targetSocket.emit('notice', '🛑 You have been BANNED by an admin.');
                    targetSocket.disconnect(true);
                }
                if (pState) {
                    delete liveWorld.players[pState.socketId];
                    broadcastState();
                }
                break;
            case 'unban':
                if (userRecord) {
                    userRecord.banned = false;
                }
                break;
            case 'delete':
            case 'remove':
                if (targetSocket) {
                    targetSocket.emit('notice', '🛑 Your character has been removed by an admin.');
                    targetSocket.disconnect(true);
                }
                if (pState) {
                    delete liveWorld.players[pState.socketId];
                    broadcastState();
                }
                await db.deleteUser(targetUser);
                return res.json({ success: true, message: `User ${targetUser} deleted.` });
            case 'addGold':
                if (pState) pState.stats.gold += amt;
                if (userRecord) userRecord.stats.gold = (userRecord.stats.gold || 0) + amt;
                if (targetSocket) targetSocket.emit('notice', `👑 Admin added ${amt} gold!`);
                break;
            case 'resetGold':
                if (pState) pState.stats.gold = 0;
                if (userRecord) userRecord.stats.gold = 0;
                break;
            case 'addXp':
                if (pState) {
                    pState.stats.xp += amt;
                    let reqXp = xpForLevel(pState.stats.level || 1);
                    while (pState.stats.xp >= reqXp) {
                        pState.stats.xp -= reqXp;
                        pState.stats.level = (pState.stats.level || 1) + 1;
                        pState.stats.statPoints = (pState.stats.statPoints || 0) + 5;
                        pState.stats.maxHp += 25;
                        const armorHp = (pState.equipment && pState.equipment.armor && pState.equipment.armor.hpBonus) ? pState.equipment.armor.hpBonus : 0;
                        pState.stats.hp = pState.stats.maxHp + armorHp;
                        pState.stats.baseDamage = (pState.stats.baseDamage || 8) + 4;
                        if (targetSocket) targetSocket.emit('notice', `⚔️ LEVEL UP! You reached Level ${pState.stats.level}!`);
                        reqXp = xpForLevel(pState.stats.level || 1);
                    }
                }
                if (userRecord) {
                    userRecord.stats.xp = pState ? pState.stats.xp : ((userRecord.stats.xp || 0) + amt);
                    userRecord.stats.level = pState ? pState.stats.level : (userRecord.stats.level || 1);
                }
                if (targetSocket) targetSocket.emit('notice', `👑 Admin added ${amt} XP!`);
                break;
            case 'resetXp':
                if (pState) pState.stats.xp = 0;
                if (userRecord) userRecord.stats.xp = 0;
                break;
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }

        if (userRecord) {
            await db.saveUser(targetUser, {
                stats: pState ? pState.stats : userRecord.stats,
                inventory: pState ? pState.inventory : userRecord.inventory,
                equipment: pState ? pState.equipment : userRecord.equipment,
                banned: !!userRecord.banned
            });
        }

        if (targetSocket && pState) {
            targetSocket.emit('inventory', { stats: pState.stats, inventory: pState.inventory, equipment: pState.equipment });
        }

        res.json({ success: true, message: `Action ${action} performed on ${targetUser}` });
    } catch (e) {
        console.error('Admin action error:', e);
        res.status(500).json({ error: e.message });
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

const liveWorld = { 
    players: {}, 
    resources: {}, 
    monsters: {}, 
    loot: {},
    campfires: {},
    obelisks: {
        crimson: { id: 'crimson', name: 'Crimson Obelisk', x: -35, z: 30, owner: null, progress: 0, color: 0x9ca3af },
        abyssal: { id: 'abyssal', name: 'Abyssal Obelisk', x: 0, z: 40, owner: null, progress: 0, color: 0x9ca3af },
        celestial: { id: 'celestial', name: 'Celestial Obelisk', x: 35, z: 35, owner: null, progress: 0, color: 0x9ca3af }
    },
    timeOfDay: 12 // Start at noon
};

// Increment time every 30 seconds
setInterval(() => {
    liveWorld.timeOfDay = (liveWorld.timeOfDay + 1) % 24;
}, 30000);

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
        if (!token) {
            return next(new Error('Authentication required. Only registered accounts can log in.'));
        }
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtErr) {
            return next(new Error('Invalid or expired token. Please log in again.'));
        }
        const userRec = await db.getUser(decoded.username);
        if (!userRec) {
            return next(new Error('Account not found. Please register an account.'));
        }
        if (userRec.banned) {
            return next(new Error('You are banned from this server.'));
        }
        socket.user = decoded;
        next();
    } catch (e) {
        console.warn('Socket auth middleware note:', e.message);
        next(new Error('Authentication error.'));
    }
});

function broadcastState() {
    io.emit('state', { 
        timeOfDay: liveWorld.timeOfDay,
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
                mp: p.stats.mp !== undefined ? p.stats.mp : 100,
                maxMp: p.stats.maxMp || 100,
                isGathering: p.isGathering, 
                isAttacking: p.isAttacking, 
                dead: p.dead, 
                mounted: p.mounted || null,
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
        loot: Object.values(liveWorld.loot),
        campfires: Object.values(liveWorld.campfires || {}),
        obelisks: Object.values(liveWorld.obelisks || {})
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

// =========================================================================
// WEAPON SKILLS CATALOG (Min 3 skills per weapon category)
// =========================================================================
const SKILLS = {
    sword: [
        {
            id: 'whirlwind_cleave',
            name: 'Whirlwind Cleave',
            icon: '🌀',
            manaCost: 30,
            cooldown: 3.0,
            dmgMult: 1.8,
            type: 'aoe_around',
            radius: 6.5,
            vfx: 'whirlwind',
            desc: 'Spin in a 360° circle, striking all nearby enemies for 180% weapon DMG.'
        },
        {
            id: 'valiant_lunge',
            name: 'Valiant Lunge',
            icon: '⚔️',
            manaCost: 45,
            cooldown: 5.0,
            dmgMult: 2.4,
            type: 'dash_strike',
            radius: 5.0,
            vfx: 'sword_lunge',
            desc: 'Dash forward towards target, slashing for 240% weapon DMG and slowing targets.'
        },
        {
            id: 'celestial_swordfall',
            name: 'Celestial Swordfall',
            icon: '🗡️',
            manaCost: 75,
            cooldown: 10.0,
            dmgMult: 3.8,
            type: 'aoe_target',
            radius: 8.0,
            vfx: 'swordfall',
            desc: 'Summon a colossal holy blade dropping from the heavens for 380% AoE DMG.'
        }
    ],
    axe: [
        {
            id: 'execute_chop',
            name: 'Execute Chop',
            icon: '🪓',
            manaCost: 28,
            cooldown: 3.0,
            dmgMult: 2.1,
            type: 'target_single',
            vfx: 'axe_chop',
            desc: 'Heavy overhead axe chop dealing 210% DMG (2x bonus DMG vs foes under 50% HP).'
        },
        {
            id: 'berserker_tornado',
            name: 'Berserker Tornado',
            icon: '🌪️',
            manaCost: 50,
            cooldown: 6.0,
            dmgMult: 2.5,
            type: 'aoe_around',
            radius: 7.0,
            vfx: 'axe_spin',
            desc: 'Fierce rotating axe storm hitting all enemies for 250% DMG and applying Bleed.'
        },
        {
            id: 'earth_shatter',
            name: 'Earth Shatter',
            icon: '🌋',
            manaCost: 80,
            cooldown: 12.0,
            dmgMult: 4.0,
            type: 'fissure_line',
            length: 12.0,
            vfx: 'fissure',
            desc: 'Slam axe into the earth creating a fiery fissure for 400% DMG.'
        }
    ],
    hammer: [
        {
            id: 'armor_crush',
            name: 'Armor Crush',
            icon: '🔨',
            manaCost: 40,
            cooldown: 4.0,
            dmgMult: 1.8,
            type: 'target_single',
            vfx: 'hammer_smash',
            desc: 'Smash target dealing 180% DMG and sundering enemy defense by 35%.'
        },
        {
            id: 'seismic_stomp',
            name: 'Seismic Stomp',
            icon: '💥',
            manaCost: 65,
            cooldown: 7.0,
            dmgMult: 2.4,
            type: 'aoe_around',
            radius: 8.0,
            vfx: 'seismic_ring',
            desc: 'Stomp the ground dealing 240% DMG and stunning all nearby mobs.'
        },
        {
            id: 'titan_cataclysm',
            name: 'Titan Cataclysm',
            icon: '☄️',
            manaCost: 100,
            cooldown: 14.0,
            dmgMult: 4.2,
            type: 'aoe_around',
            radius: 10.0,
            vfx: 'titan_earthquake',
            desc: 'Unleash titan shockwaves dealing 420% total DMG over earthquake pulses.'
        }
    ],
    spear: [
        {
            id: 'triple_thrust',
            name: 'Triple Thrust',
            icon: '🔱',
            manaCost: 40,
            cooldown: 3.0,
            dmgMult: 2.55,
            type: 'target_single',
            vfx: 'spear_thrust',
            desc: 'Rapid 3-stab piercing thrust barrage dealing 255% total damage.'
        },
        {
            id: 'vaulting_impale',
            name: 'Vaulting Impale',
            icon: '⚡',
            manaCost: 60,
            cooldown: 6.0,
            dmgMult: 2.7,
            type: 'dash_strike',
            radius: 6.0,
            vfx: 'spear_vault',
            desc: 'Vault high into the air and impale target area for 270% DMG.'
        },
        {
            id: 'dragon_tempest',
            name: 'Dragon Tempest',
            icon: '🐉',
            manaCost: 95,
            cooldown: 11.0,
            dmgMult: 3.8,
            type: 'aoe_around',
            radius: 8.5,
            vfx: 'dragon_hurricane',
            desc: 'Spin lance at hypersonic speed creating a dragon cyclone pulling targets in.'
        }
    ],
    bow: [
        {
            id: 'arrow_volley',
            name: 'Arrow Volley',
            icon: '🏹',
            manaCost: 30,
            cooldown: 3.0,
            dmgMult: 2.2,
            type: 'cone_shot',
            vfx: 'arrow_cone',
            desc: 'Fire 5 spreading energy arrows in a wide cone dealing 220% total DMG.'
        },
        {
            id: 'rain_of_arrows',
            name: 'Rain of Arrows',
            icon: '🌧️',
            manaCost: 55,
            cooldown: 7.0,
            dmgMult: 3.0,
            type: 'aoe_target',
            radius: 8.0,
            vfx: 'arrow_rain',
            desc: 'Rain arrow barrage on target location for 300% DMG and 60% slow.'
        },
        {
            id: 'astral_sniper',
            name: 'Astral Sniper',
            icon: '🎯',
            manaCost: 80,
            cooldown: 10.0,
            dmgMult: 4.8,
            type: 'line_beam',
            length: 25.0,
            vfx: 'sniper_beam',
            desc: 'Charge a massive laser arrow piercing enemies across a 25-unit line for 480% DMG.'
        }
    ],
    dagger: [
        {
            id: 'poison_slice',
            name: 'Poison Slice',
            icon: '🗡️',
            manaCost: 25,
            cooldown: 2.5,
            dmgMult: 1.9,
            type: 'target_single',
            vfx: 'dagger_slash',
            desc: 'Rapid dual shadow slice dealing 190% DMG and applying poison.'
        },
        {
            id: 'shadow_blink',
            name: 'Shadow Blink',
            icon: '👤',
            manaCost: 42,
            cooldown: 5.0,
            dmgMult: 2.8,
            type: 'teleport_backstab',
            vfx: 'shadow_blink',
            desc: 'Teleport behind target enemy, delivering 280% critical backstab DMG.'
        },
        {
            id: 'fan_of_daggers',
            name: 'Fan of Daggers',
            icon: '✴️',
            manaCost: 70,
            cooldown: 9.0,
            dmgMult: 3.4,
            type: 'aoe_around',
            radius: 7.5,
            vfx: 'fan_daggers',
            desc: 'Throw 12 shadow blades radially dealing 340% DMG to all surrounding enemies.'
        }
    ],
    staff: [
        {
            id: 'fireball_burst',
            name: 'Fireball Burst',
            icon: '🔥',
            manaCost: 35,
            cooldown: 3.0,
            dmgMult: 2.3,
            type: 'aoe_target',
            radius: 5.0,
            vfx: 'fireball_blast',
            desc: 'Hurl an explosive fireball dealing 230% AoE elemental fire DMG.'
        },
        {
            id: 'frost_nova',
            name: 'Frost Nova',
            icon: '🧊',
            manaCost: 58,
            cooldown: 6.0,
            dmgMult: 2.6,
            type: 'aoe_around',
            radius: 9.0,
            vfx: 'frost_nova',
            desc: 'Erupt a freezing ice explosion around caster for 260% DMG and freeze.'
        },
        {
            id: 'meteor_cataclysm',
            name: 'Meteor Cataclysm',
            icon: '☄️',
            manaCost: 90,
            cooldown: 12.0,
            dmgMult: 5.2,
            type: 'aoe_target',
            radius: 9.0,
            vfx: 'meteor_impact',
            desc: 'Call down a colossal flaming meteor dealing 520% destructive AoE DMG.'
        }
    ],
    unarmed: [
        {
            id: 'power_palm',
            name: 'Power Palm',
            icon: '👊',
            manaCost: 22,
            cooldown: 2.0,
            dmgMult: 1.5,
            type: 'target_single',
            vfx: 'palm_strike',
            desc: 'Focus inner qi into a martial fist strike dealing 150% damage.'
        },
        {
            id: 'inner_renewal',
            name: 'Inner Renewal',
            icon: '✨',
            manaCost: 45,
            cooldown: 8.0,
            dmgMult: 0,
            type: 'self_heal',
            vfx: 'inner_heal',
            desc: 'Channel qi to instantly restore 30% Max HP and grant +40 DEF.'
        },
        {
            id: 'dragon_kick',
            name: 'Dragon Kick',
            icon: '🐉',
            manaCost: 65,
            cooldown: 10.0,
            dmgMult: 2.7,
            type: 'dash_strike',
            radius: 6.0,
            vfx: 'dragon_kick',
            desc: 'Flying martial dragon kick dealing 270% DMG and knocking foes back.'
        }
    ]
};
SKILLS.broadsword = SKILLS.sword;

function processMonsterDeath(mob, mobId, p) {
    const mobDef = MONSTER_TYPES[mob.type] || { name: mob.type, xp: 30 };
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
    const xpGain = mobDef.xp || 30;

    let partyMembers = [p];
    if (p.partyId) {
        partyMembers = Object.values(liveWorld.players).filter(x => x.partyId === p.partyId);
    }
    const xpPerMember = Math.max(1, Math.floor(xpGain / partyMembers.length));

    if (mob.type === 'void_emperor') {
        io.emit('notice', `✨👑 [SUPREME COSMIC DEFEAT] Astraeus the Void Emperor was vanquished by ${p.username}! (+${goldGained.toLocaleString()}g, +${xpGain.toLocaleString()} XP)`);
        io.emit('vfx', { type: 'boss_death', x: mob.x, z: mob.z, isWorldClass: true });
        updatePlayerQuestProgress(p, 'kill_boss', 1);
    } else if (mob.type === 'boss_dragon') {
        io.emit('notice', `👑 [LEGENDARY VICTORY] Ignisrax the Dragon Lord was slain by ${p.username}! (+${goldGained.toLocaleString()}g, +${xpGain.toLocaleString()} XP)`);
        io.emit('vfx', { type: 'boss_death', x: mob.x, z: mob.z });
        updatePlayerQuestProgress(p, 'kill_boss', 1);
    } else if (mob.isMiniBoss) {
        io.emit('notice', `⚔️ [MINI-BOSS DEFEATED] ${mobDef.name} was slain by ${p.username}! (+${goldGained.toLocaleString()}g)`);
        updatePlayerQuestProgress(p, 'kill_miniboss', 1);
    } else {
        updatePlayerQuestProgress(p, 'kill_any', 1);
    }

    partyMembers.forEach(member => {
        member.stats.xp = (member.stats.xp || 0) + xpPerMember;
        if (member === p) {
            member.stats.gold += goldGained;
            member.stats.kills = (member.stats.kills || 0) + 1;
        }
        
        const reqXp = xpForLevel(member.stats.level || 1);
        const mSocket = io.sockets.sockets.get(member.socketId);
        
        if (member.stats.xp >= reqXp) {
            member.stats.xp -= reqXp;
            member.stats.level = (member.stats.level || 1) + 1;
            member.stats.statPoints = (member.stats.statPoints || 0) + 5;
            member.stats.maxHp += 25;
            member.stats.maxMp = (member.stats.maxMp || 100) + 20;
            const armorHp = (member.equipment && member.equipment.armor && member.equipment.armor.hpBonus) ? member.equipment.armor.hpBonus : 0;
            member.stats.hp = member.stats.maxHp + armorHp;
            member.stats.mp = member.stats.maxMp;
            member.stats.baseDamage = (member.stats.baseDamage || 8) + 4;
            
            updatePlayerQuestProgress(member, 'reach_level', 1);

            if (mSocket) {
                mSocket.emit('notice', `⚔️ LEVEL UP! You reached Level ${member.stats.level}! (+5 Stat Points, +25 HP, +20 MP, +4 Base DMG)`);
                mSocket.emit('combatLog', { msg: `LEVEL UP! Reached Lv.${member.stats.level}`, type: 'lvl_up' });
            }
            io.emit('vfx', { type: 'levelup', x: member.stats.pos.x, z: member.stats.pos.z, level: member.stats.level });
        }
        if (mSocket) {
            mSocket.emit('inventory', { stats: member.stats, inventory: member.inventory, equipment: member.equipment });
        }
    });

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

io.on('connection', async (socket) => {
    // Prevent duplicate logins / ghost sessions by disconnecting any existing socket for this username
    if (socket.user && socket.user.username) {
        const username = socket.user.username;
        const existingPlayer = Object.values(liveWorld.players).find(p => p.username === username);
        if (existingPlayer) {
            console.log(`[Auth] Existing active session found for ${username}. Cleaning up old socket ${existingPlayer.socketId}`);
            // Save their state first to ensure no progress is lost
            try {
                await db.saveUser(existingPlayer.username, {
                    stats: existingPlayer.stats,
                    inventory: existingPlayer.inventory,
                    equipment: existingPlayer.equipment,
                    quests: existingPlayer.quests,
                    dailyReward: existingPlayer.dailyReward
                });
            } catch (saveErr) {
                console.error('[Auth Error] Failed to save existing player session:', saveErr);
            }
            // Disconnect the old socket connection
            const oldSocket = io.sockets.sockets.get(existingPlayer.socketId);
            if (oldSocket) {
                oldSocket.emit('notice', '🛑 You have logged in from another device or window.');
                oldSocket.disconnect(true);
            }
            // Clean up the old player from liveWorld.players immediately
            delete liveWorld.players[existingPlayer.socketId];
        }
    }

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
    userRec.quests = initUserQuests(userRec);
    userRec.dailyReward = initUserDailyReward(userRec);

    const p = { 
        username: userRec.username, 
        role: userRec.role, 
        stats: JSON.parse(JSON.stringify(userRec.stats)), 
        inventory: userRec.inventory || [], 
        equipment: userRec.equipment || { weapon: null, armor: null }, 
        quests: JSON.parse(JSON.stringify(userRec.quests)),
        dailyReward: JSON.parse(JSON.stringify(userRec.dailyReward)),
        socketId: socket.id, 
        target: null, 
        isGathering: false, 
        isAttacking: false, 
        dead: false, 
        atkCd: 0 
    };
    p.stats.mp = p.stats.mp !== undefined ? p.stats.mp : 100;
    p.stats.maxMp = p.stats.maxMp || 100;
    p.stats.intelligence = p.stats.intelligence || 1;
    liveWorld.players[socket.id] = p;
    socket.emit('init', { socketId: socket.id, username: p.username, role: p.role });
    if (socket.pendingGuestToken) {
        socket.emit('authSuccess', { token: socket.pendingGuestToken, username: p.username });
    }
    socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
    
    // Initial Quest state & Daily Reward state
    socket.emit('questsUpdate', buildQuestsResponse(p.quests));
    
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();
    const claimedToday = p.dailyReward.lastClaimDate === today;
    let nextStreak = p.dailyReward.streak || 0;
    if (!claimedToday) {
        nextStreak = (p.dailyReward.lastClaimDate === yesterday) ? (nextStreak % 7) + 1 : 1;
    }
    socket.emit('dailyRewardUpdate', {
        todayDate: today,
        claimedToday,
        streak: p.dailyReward.streak || 0,
        nextStreak,
        lastClaimDate: p.dailyReward.lastClaimDate,
        schedule: DAILY_REWARDS_SCHEDULE
    });

    if (!claimedToday) {
        socket.emit('notice', '🎁 Daily Reward Available! Open Daily Reward [D] to claim starting items!');
    }

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

    socket.on('getQuests', () => {
        socket.emit('questsUpdate', buildQuestsResponse(p.quests));
    });

    socket.on('claimQuest', async (questId) => {
        if (!questId) return;
        await claimQuestReward(p.username, questId);
    });

    socket.on('getDailyReward', () => {
        const today = getTodayDateStr();
        const yesterday = getYesterdayDateStr();
        const claimedToday = p.dailyReward ? p.dailyReward.lastClaimDate === today : false;
        let nextStreak = p.dailyReward ? p.dailyReward.streak || 0 : 0;
        if (!claimedToday) {
            nextStreak = (p.dailyReward && p.dailyReward.lastClaimDate === yesterday) ? (nextStreak % 7) + 1 : 1;
        }
        socket.emit('dailyRewardUpdate', {
            todayDate: today,
            claimedToday,
            streak: p.dailyReward ? p.dailyReward.streak || 0 : 0,
            nextStreak,
            lastClaimDate: p.dailyReward ? p.dailyReward.lastClaimDate : '',
            schedule: DAILY_REWARDS_SCHEDULE
        });
    });

    socket.on('claimDailyReward', async () => {
        await claimDailyRewardHelper(p.username);
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
            updatePlayerQuestProgress(p, (node.type === 'tree' ? 'gather_wood' : 'gather_ore'), 1);
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
            
            socket.emit('combatLog', { msg: `Hit ${MONSTER_TYPES[mob.type] ? MONSTER_TYPES[mob.type].name : mob.type} for ${totalDmg} dmg`, type: 'dmg_out' });

            const wepType = (p.equipment && p.equipment.weapon) ? p.equipment.weapon.weaponType : 'sword';
            const projType = (p.equipment && p.equipment.weapon && p.equipment.weapon.projectile) ? p.equipment.weapon.projectile : (wepType === 'bow' ? 'arrow' : (wepType === 'staff' ? 'fireball' : null));

            if (projType) {
                io.emit('vfx', { type: 'projectile', fromX: p.stats.pos.x, fromZ: p.stats.pos.z, toX: mob.x, toZ: mob.z, projectile: projType, weaponType: wepType });
            }
            io.emit('vfx', { type: 'damage', x: mob.x, z: mob.z, amount: totalDmg, weaponType: wepType });

            if (mob.hp <= 0) {
                processMonsterDeath(mob, mobId, p);
            }
            setTimeout(() => { p.isAttacking = false; }, 350);
        }
    });

    socket.on('useSkill', (data) => {
        const skillIndex = data && (data.skillIndex || data.slot) ? Number(data.skillIndex || data.slot) : 1;
        if (!p || p.dead) return;

        p.stats.mp = p.stats.mp !== undefined ? p.stats.mp : 100;
        p.stats.maxMp = p.stats.maxMp || 100;
        p.stats.intelligence = p.stats.intelligence || 1;

        const wep = p.equipment && p.equipment.weapon;
        const wepType = wep ? wep.weaponType : 'unarmed';
        const skillList = SKILLS[wepType] || SKILLS['unarmed'];
        const skill = skillList[skillIndex - 1];

        if (!skill) return socket.emit('notice', '❌ Skill not found.');

        if (p.stats.mp < skill.manaCost) {
            return socket.emit('notice', `❌ Not enough Mana! Need ${skill.manaCost} MP (Current: ${Math.floor(p.stats.mp)} MP)`);
        }

        p.skillCds = p.skillCds || {};
        const now = Date.now();
        if (p.skillCds[skillIndex] && now < p.skillCds[skillIndex]) {
            const remainingSec = ((p.skillCds[skillIndex] - now) / 1000).toFixed(1);
            return socket.emit('notice', `⏳ ${skill.name} is on cooldown (${remainingSec}s)`);
        }

        // Deduct MP & set Cooldown
        p.stats.mp = Math.max(0, p.stats.mp - skill.manaCost);
        p.skillCds[skillIndex] = now + (skill.cooldown * 1000);
        socket.emit('skill_cooldown', { slot: skillIndex, duration: skill.cooldown });

        // Calculate base damage & Intelligence multiplier (+5% per INT point)
        const baseWeaponDmg = wep ? wep.dmg : 5;
        const armorDmg = (p.equipment && p.equipment.armor && p.equipment.armor.dmgBonus) ? p.equipment.armor.dmgBonus : 0;
        const totalBaseDmg = p.stats.baseDamage + baseWeaponDmg + armorDmg;
        const intMult = 1 + ((p.stats.intelligence || 1) - 1) * 0.05;
        const finalSkillDmg = Math.floor(totalBaseDmg * (skill.dmgMult || 1) * intMult);

        // Find targeted mob or closest mob
        let targetMob = null;
        if (data.targetMobId && liveWorld.monsters[data.targetMobId]) {
            targetMob = liveWorld.monsters[data.targetMobId];
        } else {
            let closestDist = 12;
            Object.values(liveWorld.monsters).forEach(m => {
                const d = Math.hypot(m.x - p.stats.pos.x, m.z - p.stats.pos.z);
                if (d < closestDist) {
                    closestDist = d;
                    targetMob = m;
                }
            });
        }

        const px = p.stats.pos.x, pz = p.stats.pos.z;
        const clientFacingAngle = (data && data.facingAngle !== undefined) ? Number(data.facingAngle) : null;

        if (skill.type === 'self_heal') {
            const effectiveMaxHp = p.stats.maxHp + ((p.equipment && p.equipment.armor && p.equipment.armor.hpBonus) ? p.equipment.armor.hpBonus : 0);
            const healAmt = Math.floor(effectiveMaxHp * 0.3);
            p.stats.hp = Math.min(effectiveMaxHp, p.stats.hp + healAmt);
            socket.emit('combatLog', { msg: `✨ ${skill.name} restored +${healAmt} HP!`, type: 'lvl_up' });
            io.emit('vfx', { type: 'skill_vfx', skillId: skill.id, skillName: skill.name, vfx: skill.vfx, x: px, z: pz, fromX: px, fromZ: pz, playerId: socket.id });
        } else {
            let hitMobs = [];
            let tx, tz, angle;

            if (targetMob) {
                tx = targetMob.x;
                tz = targetMob.z;
                angle = Math.atan2(tz - pz, tx - px);
            } else if (data && data.targetPos) {
                tx = data.targetPos.x;
                tz = data.targetPos.z;
                angle = Math.atan2(tz - pz, tx - px);
            } else {
                angle = clientFacingAngle !== null ? clientFacingAngle : (p.rot || 0);
                const reach = skill.length || skill.range || 8;
                tx = px + Math.cos(angle) * reach;
                tz = pz + Math.sin(angle) * reach;
            }

            if (skill.type === 'aoe_around') {
                const rad = skill.radius || 7;
                Object.values(liveWorld.monsters).forEach((m) => {
                    if (Math.hypot(m.x - px, m.z - pz) <= rad) hitMobs.push(m);
                });
                io.emit('vfx', { type: 'skill_vfx', skillId: skill.id, skillName: skill.name, vfx: skill.vfx, x: px, z: pz, fromX: px, fromZ: pz, angle: angle, radius: rad, playerId: socket.id });
            } else if (skill.type === 'aoe_target' || skill.type === 'dash_strike') {
                if (skill.type === 'dash_strike') {
                    p.stats.pos.x = tx;
                    p.stats.pos.z = tz;
                }
                const rad = skill.radius || 6;
                Object.values(liveWorld.monsters).forEach((m) => {
                    if (Math.hypot(m.x - tx, m.z - tz) <= rad) hitMobs.push(m);
                });
                io.emit('vfx', { type: 'skill_vfx', skillId: skill.id, skillName: skill.name, vfx: skill.vfx, x: tx, z: tz, fromX: px, fromZ: pz, angle: angle, radius: rad, playerId: socket.id });
            } else if (skill.type === 'fissure_line' || skill.type === 'line_beam') {
                const len = skill.length || 15;
                Object.values(liveWorld.monsters).forEach((m) => {
                    const distToLine = Math.hypot(m.x - px, m.z - pz);
                    if (distToLine <= len) {
                        const mAngle = Math.atan2(m.z - pz, m.x - px);
                        let diff = Math.abs(angle - mAngle);
                        if (diff > Math.PI) diff = 2 * Math.PI - diff;
                        if (diff < 0.45) hitMobs.push(m);
                    }
                });
                io.emit('vfx', { type: 'skill_vfx', skillId: skill.id, skillName: skill.name, vfx: skill.vfx, x: tx, z: tz, fromX: px, fromZ: pz, angle: angle, length: len, playerId: socket.id });
            } else {
                if (targetMob && Math.hypot(targetMob.x - px, targetMob.z - pz) <= (wep ? (wep.range || 6) + 4 : 8)) {
                    hitMobs.push(targetMob);
                }
                io.emit('vfx', { type: 'skill_vfx', skillId: skill.id, skillName: skill.name, vfx: skill.vfx, x: tx, z: tz, fromX: px, fromZ: pz, angle: angle, playerId: socket.id });
            }

            hitMobs.forEach((m) => {
                let dmgToDeal = finalSkillDmg;
                if (skill.id === 'execute_chop' && (m.hp / (MONSTER_TYPES[m.type]?.hp || 100)) < 0.5) {
                    dmgToDeal = Math.floor(dmgToDeal * 1.8);
                }
                m.hp -= dmgToDeal;
                m.lastHit = Date.now();

                socket.emit('combatLog', { msg: `💥 ${skill.name} hit ${MONSTER_TYPES[m.type]?.name || m.type} for ${dmgToDeal} DMG!`, type: 'dmg_out' });
                io.emit('vfx', { type: 'damage', x: m.x, z: m.z, amount: dmgToDeal, weaponType: wepType });

                if (m.hp <= 0) {
                    processMonsterDeath(m, m.id || targetMob?.id, p);
                }
            });
        }

        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('lootItem', (lid) => {
        const item = liveWorld.loot[lid];
        if (!item || Math.hypot(item.x - p.stats.pos.x, item.z - p.stats.pos.z) > 4) return;
        const itemInfo = ITEMS[item.itemId] || { name: 'Unknown Item' };
        p.inventory.push({ ...itemInfo, itemId: item.itemId, uid: Date.now().toString() });
        delete liveWorld.loot[lid]; 
        socket.emit('notice', `🎒 Collected: ${itemInfo.name}!`);
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('summonMount', (mountId) => {
        if (!mountId) {
            p.mounted = null;
            socket.emit('notice', `🐎 Dismounted.`);
            broadcastState();
            return;
        }
        // Verify they actually own the mount
        const hasMount = p.inventory.some(it => it.itemId === mountId) || 
                         (p.equipment && Object.values(p.equipment).some(eq => eq && eq.itemId === mountId));
        if (!hasMount) {
            return socket.emit('notice', `❌ You do not own this mount! Buy one from the blacksmith merchant.`);
        }
        const mountKey = mountId.replace('mount_', '');
        if (p.mounted === mountKey) {
            p.mounted = null;
            socket.emit('notice', `🐎 Dismounted.`);
        } else {
            p.mounted = mountKey;
            socket.emit('notice', `🐎 Summoned: ${ITEMS[mountId]?.name || 'Mount'}!`);
            socket.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z });
        }
        broadcastState();
    });

    socket.on('castSpell', (data) => {
        if (p.dead) return;
        const { spellId } = data;
        if (!spellId) return;

        p.stats.mp = p.stats.mp !== undefined ? p.stats.mp : 100;
        
        let mpCost = 0;
        let spellName = '';
        if (spellId === 'whirlwind') { mpCost = 15; spellName = 'Whirlwind'; }
        else if (spellId === 'frostbolt') { mpCost = 25; spellName = 'Frostbolt'; }
        else if (spellId === 'shadowstep') { mpCost = 20; spellName = 'Shadowstep'; }

        if (p.stats.mp < mpCost) {
            return socket.emit('notice', `❌ Not enough MP to cast ${spellName}!`);
        }

        p.stats.mp -= mpCost;

        if (spellId === 'whirlwind') {
            // Spin and deal AoE damage to monsters within 5 units
            let baseDamage = p.stats.baseDamage || 8;
            if (p.equipment && p.equipment.weapon) {
                baseDamage += p.equipment.weapon.dmg || 0;
            }
            // Socketed Ruby bonus
            if (p.equipment && p.equipment.weapon && p.equipment.weapon.name && p.equipment.weapon.name.includes('[Ruby]')) {
                baseDamage += 15;
            }

            const str = p.stats.strength || 1;
            const finalDmg = Math.floor(baseDamage + str * 1.5);

            // Find hits
            const hits = Object.values(liveWorld.monsters).filter(m => {
                return Math.hypot(m.x - p.stats.pos.x, m.z - p.stats.pos.z) <= 5.5;
            });

            hits.forEach(m => {
                m.hp -= finalDmg;
                m.lastHit = Date.now();
                socket.emit('combatLog', { msg: `💥 Whirlwind hit ${MONSTER_TYPES[m.type]?.name || m.type} for ${finalDmg} DMG!`, type: 'dmg_out' });
                io.emit('vfx', { type: 'damage', x: m.x, z: m.z, amount: finalDmg, weaponType: 'broadsword' });
                if (m.hp <= 0) {
                    processMonsterDeath(m, m.id, p);
                }
            });

            io.emit('vfx', { type: 'slash', x: p.stats.pos.x, z: p.stats.pos.z });
            socket.emit('notice', `⚡ Cast Whirlwind! (-15 MP)`);
        } 
        else if (spellId === 'frostbolt') {
            // Find target or nearest monster within 20 units
            let targetMob = null;
            if (data.targetId && liveWorld.monsters[data.targetId]) {
                targetMob = liveWorld.monsters[data.targetId];
            } else {
                let nearest = null, minDist = 20;
                Object.values(liveWorld.monsters).forEach(m => {
                    const d = Math.hypot(m.x - p.stats.pos.x, m.z - p.stats.pos.z);
                    if (d < minDist) { minDist = d; nearest = m; }
                });
                targetMob = nearest;
            }

            if (!targetMob) {
                p.stats.mp += mpCost; // refund
                return socket.emit('notice', `❌ No target monster found within range for Frostbolt.`);
            }

            const intStat = p.stats.intelligence || 1;
            let baseDmg = p.stats.baseDamage || 8;
            if (p.equipment && p.equipment.weapon) {
                baseDmg += p.equipment.weapon.dmg || 0;
            }
            if (p.equipment && p.equipment.weapon && p.equipment.weapon.name && p.equipment.weapon.name.includes('[Sapphire]')) {
                baseDmg += 10;
            }
            const finalDmg = Math.floor(baseDmg + intStat * 2.2);

            targetMob.hp -= finalDmg;
            targetMob.lastHit = Date.now();
            targetMob.frozenUntil = Date.now() + 2500; // freeze monster for 2.5 seconds

            socket.emit('combatLog', { msg: `❄️ Frostbolt hit ${MONSTER_TYPES[targetMob.type]?.name || targetMob.type} for ${finalDmg} DMG!`, type: 'dmg_out' });
            io.emit('vfx', { type: 'damage', x: targetMob.x, z: targetMob.z, amount: finalDmg, weaponType: 'staff' });
            io.emit('vfx', { type: 'frost', fromX: p.stats.pos.x, fromZ: p.stats.pos.z, toX: targetMob.x, toZ: targetMob.z });

            if (targetMob.hp <= 0) {
                processMonsterDeath(targetMob, targetMob.id, p);
            }
            socket.emit('notice', `❄️ Fired Frostbolt! (-25 MP)`);
        }
        else if (spellId === 'shadowstep') {
            // Dash player forward or toward target, dealing high crit damage if passing through enemies
            const agi = p.stats.agility || 1;
            let baseDmg = p.stats.baseDamage || 8;
            if (p.equipment && p.equipment.weapon) {
                baseDmg += p.equipment.weapon.dmg || 0;
            }
            const finalDmg = Math.floor(baseDmg + agi * 2.6);

            // Compute direction
            let dx = 0, dz = -1;
            if (p.target) {
                const dist = Math.hypot(p.target.x - p.stats.pos.x, p.target.z - p.stats.pos.z);
                if (dist > 0.1) {
                    dx = (p.target.x - p.stats.pos.x) / dist;
                    dz = (p.target.z - p.stats.pos.z) / dist;
                }
            } else {
                dx = Math.sin(Date.now() / 1000);
                dz = Math.cos(Date.now() / 1000);
            }

            const oldX = p.stats.pos.x;
            const oldZ = p.stats.pos.z;

            // Instantly dash forward 12 units
            p.stats.pos.x += dx * 12;
            p.stats.pos.z += dz * 12;

            // Bound checking to prevent going out of bounds
            p.stats.pos.x = Math.max(-100, Math.min(100, p.stats.pos.x));
            p.stats.pos.z = Math.max(-100, Math.min(100, p.stats.pos.z));

            // Deal high crit damage to any monsters between old pos and new pos
            Object.values(liveWorld.monsters).forEach(m => {
                const distToLine = Math.hypot(m.x - (oldX + p.stats.pos.x)/2, m.z - (oldZ + p.stats.pos.z)/2);
                if (distToLine <= 6.5) {
                    m.hp -= finalDmg;
                    m.lastHit = Date.now();
                    socket.emit('combatLog', { msg: `🗡️ Shadowstep pierced ${MONSTER_TYPES[m.type]?.name || m.type} for ${finalDmg} DMG!`, type: 'dmg_out' });
                    io.emit('vfx', { type: 'damage', x: m.x, z: m.z, amount: finalDmg, weaponType: 'dagger' });
                    if (m.hp <= 0) {
                        processMonsterDeath(m, m.id, p);
                    }
                }
            });

            io.emit('vfx', { type: 'dash', fromX: oldX, fromZ: oldZ, toX: p.stats.pos.x, toZ: p.stats.pos.z });
            socket.emit('notice', `⚡ Cast Shadowstep! (-20 MP)`);
        }

        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('startFishing', () => {
        if (p.dead) return;
        // Verify they have a fishing rod equipped or in inventory
        const hasRod = (p.equipment && p.equipment.weapon && p.equipment.weapon.itemId === 'fishing_rod') || p.inventory.some(it => it.itemId === 'fishing_rod');
        if (!hasRod) {
            return socket.emit('notice', `❌ You need a Journeyman Fishing Rod equipped or in your bag to fish! Buy one from the blacksmith.`);
        }

        // Must be in a Fishing Zone
        const inZoneA = Math.hypot(p.stats.pos.x - (-30), p.stats.pos.z - (-35)) <= 7;
        const inZoneB = Math.hypot(p.stats.pos.x - 35, p.stats.pos.z - (-30)) <= 7;
        if (!inZoneA && !inZoneB) {
            return socket.emit('notice', `❌ You must stand inside a shimmering blue water Fishing Zone to cast your line! Check the map.`);
        }

        p.isGathering = true;
        p.fishingState = {
            isFishing: true,
            castTime: Date.now(),
            biteTime: Date.now() + 2000 + Math.random() * 3000,
            notified: false
        };

        socket.emit('notice', `🎣 Cast line into the water... Wait for a bite!`);
        socket.emit('combatLog', { msg: `Casted fishing line... Wait for bite.`, type: 'heal' });
        broadcastState();

        // Check bite in a loop/timeout
        setTimeout(() => {
            if (p.fishingState && p.fishingState.isFishing) {
                p.fishingState.notified = true;
                socket.emit('notice', `❗ BITE! QUICK, PRESS [F] TO REEL IT IN!`);
                io.emit('vfx', { type: 'bite', x: p.stats.pos.x, z: p.stats.pos.z });
            }
        }, p.fishingState.biteTime - Date.now());
    });

    socket.on('reelFishing', () => {
        if (!p.fishingState || !p.fishingState.isFishing) return;
        p.isGathering = false;
        
        const now = Date.now();
        const reactionTime = now - p.fishingState.biteTime;

        if (reactionTime >= 0 && reactionTime <= 1800) {
            // Caught a fish!
            const roll = Math.random();
            let caughtItem = 'raw_trout';
            if (roll > 0.8) caughtItem = 'raw_eel'; // 20% chance of Abyssal Eel

            p.inventory.push({ ...ITEMS[caughtItem], itemId: caughtItem, uid: Date.now().toString() });
            socket.emit('notice', `🎣 SUCCESS! You caught a ${ITEMS[caughtItem].name}!`);
            socket.emit('combatLog', { msg: `Caught: ${ITEMS[caughtItem].name}!`, type: 'lvl_up' });
            io.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z });

            // Update quest progress
            updatePlayerQuestProgress(p, 'fish_caught', 1);
        } else {
            socket.emit('notice', `💨 Ah, the fish got away! You were too slow or reeled too early.`);
        }

        p.fishingState = null;
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('spawnCampfire', () => {
        if (p.dead) return;
        // Requires 2 wood logs
        const woodCount = p.inventory.filter(it => it.itemId === 'birch_wood' || it.itemId === 'chestnut_wood' || it.itemId === 'pine_wood').length;
        if (woodCount < 2) {
            return socket.emit('notice', `❌ You need at least 2 logs of Wood in your inventory to build a cozy Campfire!`);
        }

        // Consume 2 wood logs
        let removed = 0;
        p.inventory = p.inventory.filter(it => {
            if (removed < 2 && (it.itemId === 'birch_wood' || it.itemId === 'chestnut_wood' || it.itemId === 'pine_wood')) {
                removed++;
                return false;
            }
            return true;
        });

        const cid = 'campfire_' + Math.random().toString(36).substr(2, 7);
        liveWorld.campfires[cid] = {
            id: cid,
            x: p.stats.pos.x,
            z: p.stats.pos.z,
            creator: p.username,
            createdAt: Date.now()
        };

        socket.emit('notice', `🔥 Cozy Campfire built successfully! Standing near it heals and lets you cook raw fish.`);
        socket.emit('combatLog', { msg: `Built cozy Campfire! Cook your raw fish here.`, type: 'heal' });
        io.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z });

        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('cookFish', (rawFishId) => {
        if (p.dead) return;
        // Verify they are near a campfire
        const nearCampfire = Object.values(liveWorld.campfires).some(c => {
            return Math.hypot(p.stats.pos.x - c.x, p.stats.pos.z - c.z) <= 5;
        });

        if (!nearCampfire) {
            return socket.emit('notice', `❌ You must stand close to a cozy burning Campfire to cook your raw fish! Press [J] to build one.`);
        }

        // Find the fish item in backpack
        const idx = p.inventory.findIndex(it => it.itemId === rawFishId);
        if (idx === -1) {
            return socket.emit('notice', `❌ You do not have that raw fish in your bag!`);
        }

        const rawFish = p.inventory[idx];
        let cookedId = '';
        if (rawFish.itemId === 'raw_trout') cookedId = 'cooked_trout';
        else if (rawFish.itemId === 'raw_eel') cookedId = 'cooked_eel';

        if (!cookedId) {
            return socket.emit('notice', `❌ That item cannot be cooked!`);
        }

        // Swap raw for cooked
        p.inventory.splice(idx, 1);
        p.inventory.push({ ...ITEMS[cookedId], itemId: cookedId, uid: Date.now().toString() });

        socket.emit('notice', `🍳 Sizzle! Cooked raw fish into a delicious ${ITEMS[cookedId].name}!`);
        io.emit('vfx', { type: 'damage', x: p.stats.pos.x, z: p.stats.pos.z, amount: 'Cooked!', weaponType: 'broadsword' });

        // Update quest progress
        updatePlayerQuestProgress(p, 'fish_cooked', 1);

        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('socketGem', (data) => {
        const { equipSlot, gemUid } = data; // e.g. slot: 'weapon' or 'armor'
        if (!equipSlot || !gemUid) return;

        // Find gem in inventory
        const gemIdx = p.inventory.findIndex(it => it.uid === gemUid);
        if (gemIdx === -1) {
            return socket.emit('notice', `❌ Rune/Gem not found in your backpack!`);
        }
        const gem = p.inventory[gemIdx];
        if (gem.type !== 'rune') {
            return socket.emit('notice', `❌ Selected item is not a valid rune or gem!`);
        }

        // Get equipped slot
        const targetEquip = p.equipment ? p.equipment[equipSlot] : null;
        if (!targetEquip) {
            return socket.emit('notice', `❌ You do not have any ${equipSlot} equipped to socket a gem into!`);
        }

        // Check if item already has a gem socketed
        if (targetEquip.name && (targetEquip.name.includes('[Ruby]') || targetEquip.name.includes('[Sapphire]') || targetEquip.name.includes('[Emerald]'))) {
            return socket.emit('notice', `❌ This equipment already has an active gem socketed!`);
        }

        // Socket it!
        let suffix = '';
        if (gem.itemId === 'gem_ruby') suffix = '[Ruby]';
        else if (gem.itemId === 'gem_sapphire') suffix = '[Sapphire]';
        else if (gem.itemId === 'gem_emerald') suffix = '[Emerald]';

        targetEquip.name = `✨ ${suffix} ${targetEquip.name}`;
        
        // Stat increases!
        if (gem.itemId === 'gem_ruby') {
            if (equipSlot === 'weapon') {
                targetEquip.dmg = (targetEquip.dmg || 1) + 15;
            } else {
                targetEquip.defense = (targetEquip.defense || 1) + 12;
            }
        } else if (gem.itemId === 'gem_sapphire') {
            p.stats.maxMp = (p.stats.maxMp || 100) + 50;
            p.stats.intelligence = (p.stats.intelligence || 1) + 10;
        } else if (gem.itemId === 'gem_emerald') {
            p.stats.agility = (p.stats.agility || 1) + 8;
        }

        // Consume gem
        p.inventory.splice(gemIdx, 1);

        socket.emit('notice', `🔮 Socketed: Attached ${gem.name} into your equipped ${equipSlot}!`);
        socket.emit('combatLog', { msg: `Successfully socketed ${gem.name} into ${equipSlot}!`, type: 'lvl_up' });
        io.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z });

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
        updatePlayerQuestProgress(p, 'craft_item', 1);
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

    socket.on('adminCommand', (data) => {
        if (p.role !== 'admin') return;
        if (data.type === 'addGold') {
            p.stats.gold += (data.amount || 1000);
            socket.emit('notice', `👑 Admin Command: Added ${data.amount || 1000} gold!`);
        } else if (data.type === 'addGear') {
            const itemDef = ITEMS[data.itemId];
            if (itemDef) {
                p.inventory.push({ ...itemDef, itemId: data.itemId, uid: Date.now().toString() + Math.random().toString() });
                socket.emit('notice', `👑 Admin Command: Added gear [${itemDef.name}]!`);
            } else {
                socket.emit('notice', `❌ Admin Command: Item [${data.itemId}] not found.`);
            }
        }
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
        broadcastState();
    });

    socket.on('allocateStat', (statName) => {
        if (!p.stats.statPoints || p.stats.statPoints <= 0) return;
        p.stats.strength = p.stats.strength || 1;
        p.stats.vitality = p.stats.vitality || 1;
        p.stats.agility = p.stats.agility || 1;
        p.stats.defense = p.stats.defense || 1;
        p.stats.intelligence = p.stats.intelligence || 1;

        if (statName === 'strength') {
            p.stats.strength++;
            p.stats.baseDamage += 2;
        } else if (statName === 'vitality') {
            p.stats.vitality++;
            p.stats.maxHp += 15;
            p.stats.hp += 15;
        } else if (statName === 'agility') {
            p.stats.agility++;
        } else if (statName === 'defense') {
            p.stats.defense++;
        } else if (statName === 'intelligence') {
            p.stats.intelligence++;
            p.stats.maxMp = (p.stats.maxMp || 100) + 15;
            p.stats.mp = (p.stats.mp || 100) + 15;
        } else {
            return;
        }
        
        p.stats.statPoints--;
        socket.emit('inventory', { stats: p.stats, inventory: p.inventory, equipment: p.equipment });
    });

    socket.on('partyInvite', (targetName) => {
        const target = Object.values(liveWorld.players).find(x => x.username.toLowerCase() === targetName.toLowerCase());
        if (!target) return socket.emit('notice', `❌ Player '${targetName}' not found.`);
        if (target.username === p.username) return socket.emit('notice', `❌ You cannot invite yourself.`);
        if (target.partyId && target.partyId !== p.partyId) return socket.emit('notice', `❌ ${target.username} is already in a party.`);
        
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) {
            targetSocket.emit('partyInviteReq', { from: p.username });
            socket.emit('notice', `📩 Invited ${target.username} to party.`);
        }
    });

    socket.on('partyAccept', (inviterName) => {
        const inviter = Object.values(liveWorld.players).find(x => x.username === inviterName);
        if (!inviter) return;
        if (!inviter.partyId) inviter.partyId = 'pty_' + Date.now() + Math.random().toString(36).substring(7);
        p.partyId = inviter.partyId;
        
        const members = Object.values(liveWorld.players).filter(x => x.partyId === p.partyId);
        const pData = members.map(m => m.username);
        members.forEach(m => {
            const ms = io.sockets.sockets.get(m.socketId);
            if (ms) ms.emit('partyUpdate', pData);
        });
        socket.emit('notice', `✅ Joined ${inviterName}'s party.`);
    });

    socket.on('partyLeave', () => {
        const oldParty = p.partyId;
        p.partyId = null;
        socket.emit('partyUpdate', []);
        socket.emit('notice', `🚪 You left the party.`);
        
        if (oldParty) {
            const members = Object.values(liveWorld.players).filter(x => x.partyId === oldParty);
            if (members.length === 1) {
                members[0].partyId = null;
                const ms = io.sockets.sockets.get(members[0].socketId);
                if (ms) { ms.emit('partyUpdate', []); ms.emit('notice', `Party disbanded.`); }
            } else if (members.length > 1) {
                const pData = members.map(m => m.username);
                members.forEach(m => {
                    const ms = io.sockets.sockets.get(m.socketId);
                    if (ms) ms.emit('partyUpdate', pData);
                });
            }
        }
    });

    socket.on('disconnect', async () => { 
        const oldParty = p.partyId;
        if (oldParty) {
            const members = Object.values(liveWorld.players).filter(x => x.partyId === oldParty && x.socketId !== socket.id);
            if (members.length === 1) {
                members[0].partyId = null;
                const ms = io.sockets.sockets.get(members[0].socketId);
                if (ms) { ms.emit('partyUpdate', []); ms.emit('notice', `Party disbanded.`); }
            } else if (members.length > 1) {
                const pData = members.map(m => m.username);
                members.forEach(m => {
                    const ms = io.sockets.sockets.get(m.socketId);
                    if (ms) ms.emit('partyUpdate', pData);
                });
            }
        }
        try {
            await db.saveUser(p.username, { 
                stats: p.stats, 
                inventory: p.inventory, 
                equipment: p.equipment,
                quests: p.quests,
                dailyReward: p.dailyReward
            }); 
        } catch (saveErr) {
            console.error(`[Disconnect Save Error] Failed to save progress for ${p.username}:`, saveErr);
        }
        delete liveWorld.players[socket.id]; 
    });
});

setInterval(() => {
    Object.values(liveWorld.players).forEach(p => { 
        if (!p.dead) {
            p.stats.mp = p.stats.mp !== undefined ? p.stats.mp : 100;
            p.stats.maxMp = p.stats.maxMp || 100;
            if (p.stats.mp < p.stats.maxMp) {
                p.stats.mp = Math.min(p.stats.maxMp, p.stats.mp + 0.5);
            }
        }
        if (!p.target || p.dead) return; 
        const dx = p.target.x - p.stats.pos.x, dz = p.target.z - p.stats.pos.z, dist = Math.hypot(dx, dz); 
        if (dist > 0.4) { 
            let speedMult = 1.0;
            if (p.mounted === 'horse') speedMult += 0.4;
            else if (p.mounted === 'wolf') speedMult += 0.6;
            else if (p.mounted === 'drake') speedMult += 0.8;

            // Socketed Emerald speed bonus
            if (p.equipment && p.equipment.armor && p.equipment.armor.name && p.equipment.armor.name.includes('[Emerald]')) {
                speedMult += 0.12;
            }
            if (p.equipment && p.equipment.weapon && p.equipment.weapon.name && p.equipment.weapon.name.includes('[Emerald]')) {
                speedMult += 0.12;
            }

            p.stats.pos.x += (dx/dist) * 0.45 * speedMult; 
            p.stats.pos.z += (dz/dist) * 0.45 * speedMult; 
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
                const equipDef = (nearest.equipment && nearest.equipment.armor && nearest.equipment.armor.defense) ? nearest.equipment.armor.defense : 0;
                const statDef = (nearest.stats.defense ? nearest.stats.defense - 1 : 0) * 2; 
                const def = equipDef + statDef;
                const netDmg = Math.max(3, baseMobDmg - def);
                nearest.stats.hp -= netDmg;
                
                // Get the socket for the player taking damage
                const nearestSocket = io.sockets.sockets.get(nearest.socketId);
                if (nearestSocket) {
                    nearestSocket.emit('combatLog', { msg: `Took ${netDmg} dmg from ${mobDef.name || m.type}`, type: 'dmg_in' });
                }
                
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

    // 5-Second Interval Tasks
    if (!global.tickCount) global.tickCount = 0;
    global.tickCount++;
    if (global.tickCount % 50 === 0) {
        // A. Campfires expiry cleanup
        const now = Date.now();
        Object.entries(liveWorld.campfires || {}).forEach(([id, c]) => {
            if (now - c.createdAt > 60000) {
                delete liveWorld.campfires[id];
            }
        });

        // B. Wilderness Obelisks capture & rewards
        Object.values(liveWorld.obelisks || {}).forEach(ob => {
            // Find players near this obelisk
            const nearbyPlayers = Object.values(liveWorld.players).filter(p => {
                return !p.dead && Math.hypot(p.stats.pos.x - ob.x, p.stats.pos.z - ob.z) <= 6;
            });

            if (nearbyPlayers.length === 1) {
                // Single player capturing / holding
                const p = nearbyPlayers[0];
                if (ob.owner !== p.username) {
                    ob.progress += 20; // 5 ticks to capture (25 seconds)
                    if (ob.progress >= 100) {
                        ob.progress = 100;
                        ob.owner = p.username;
                        ob.color = 0x0ea5e9; // Blue for claimed
                        const pSocket = io.sockets.sockets.get(p.socketId);
                        if (pSocket) {
                            pSocket.emit('notice', `🏰 You have captured the ${ob.name}! (+2g, +20 XP every 5s)`);
                            pSocket.emit('combatLog', { msg: `Captured Obelisk: ${ob.name}`, type: 'lvl_up' });
                        }
                    }
                } else {
                    // Already owned, give passive rewards
                    p.stats.gold += 2;
                    p.stats.xp += 20;
                    
                    // Check if they leveled up
                    const levelUpXp = xpForLevel(p.stats.level || 1);
                    if (p.stats.xp >= levelUpXp) {
                        p.stats.level++;
                        p.stats.xp -= levelUpXp;
                        p.stats.maxHp += 15;
                        p.stats.maxMp += 3; // Reduced from 10
                        p.stats.hp = p.stats.maxHp;
                        p.stats.mp = p.stats.maxMp;
                        p.stats.statPoints += 5;
                        const pSocket = io.sockets.sockets.get(p.socketId);
                        if (pSocket) {
                            pSocket.emit('notice', `⭐ LEVEL UP! You are now Level ${p.stats.level}!`);
                            pSocket.emit('vfx', { type: 'levelup', x: p.stats.pos.x, z: p.stats.pos.z });
                        }
                    }

                    const pSocket = io.sockets.sockets.get(p.socketId);
                    if (pSocket) {
                        pSocket.emit('combatLog', { msg: `🎁 Obelisk Reward: +2 Gold & +20 XP!`, type: 'heal' });
                        pSocket.emit('vfx', { type: 'heal', x: p.stats.pos.x, z: p.stats.pos.z, amount: 20 });
                    }
                }
            } else if (nearbyPlayers.length > 1) {
                // Contested state
                const ownersPresent = nearbyPlayers.filter(p => p.username === ob.owner);
                if (ownersPresent.length === 0) {
                    // Multiple neutral/challengers standing, progress halts or decays
                    ob.progress = Math.max(0, ob.progress - 10);
                }
            } else {
                // No players near, decay progress if not fully owned
                if (!ob.owner && ob.progress > 0) {
                    ob.progress = Math.max(0, ob.progress - 10);
                }
            }
        });
    }

    broadcastState();
}, 100);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Master Server Live on http://0.0.0.0:${PORT}`);
});

db.connect().then(async () => { 
    try {
        const name = process.env.ADMIN_USERNAME || 'admin';
        const pass = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(pass, 10);
        const existing = await db.getUser(name);
        if (!existing) {
            await db.createUser({ username: name, passwordHash, role: 'admin', stats: db.freshStats(), inventory: [], equipment: {weapon:null} });
        } else {
            existing.passwordHash = passwordHash;
            existing.role = 'admin';
            await db.saveUser(name, existing);
        }
        console.log('Admin account verified and synced with environment variables');
    } catch (e) {
        console.warn('Admin account init note:', e.message);
    }
}).catch(err => {
    console.error('Database connection error in background:', err);
});