const ITEMS = {
    raw_wood:      { name: 'Raw Wood',     type: 'material', icon: '📦' },
    raw_ore:       { name: 'Iron Ore',     type: 'material', icon: '📦' },
    ogre_bone:     { name: 'Ogre Bone',    type: 'material', icon: '🦴' },
    wood_sword:    { name: 'Wood Sword',   type: 'weapon',   dmg: 5, icon: '⚔️' },
    iron_sword:    { name: 'Iron Sword',   type: 'weapon',   dmg: 12, icon: '⚔️' }
};

const MONSTER_TYPES = {
    wolf:   { hp: 30, dmg: 6, xp: 15, gold: [2, 6], color: 0x8899aa },
    ogre:   { hp: 120, dmg: 18, xp: 60, gold: [10, 25], color: 0xaa5533 }
};

const RESOURCE_TYPES = {
    tree: { item: 'raw_wood', toolReq: 'tree', respawn: 10000, color: 0x228B22 },
    rock: { item: 'raw_ore', toolReq: 'rock', respawn: 15000, color: 0x808080 }
};

module.exports = { ITEMS, MONSTER_TYPES, RESOURCE_TYPES };