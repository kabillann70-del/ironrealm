// items.js
const ITEMS = {
    raw_wood: { 
        name: 'Raw Wood', type: 'material', 
        image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png',
        sellValue: 5, price: 10 
    },
    raw_ore: { 
        name: 'Iron Ore', type: 'material', 
        image: 'https://img.icons8.com/color/96/iron-ore.png', 
        sellValue: 8, price: 15 
    },
    ogre_bone: { 
        name: 'Ogre Bone', type: 'material', 
        image: 'https://img.freepik.com/premium-vector/pixel-art-bone-icon_735839-2108.jpg',
        sellValue: 15, price: 30 
    },
    wood_sword: { 
        name: 'Wood Sword', type: 'weapon', weaponType: 'sword', dmg: 15, 
        image: 'https://e1.pngegg.com/pngimages/228/288/png-clipart-minecraft-icon-1-4-wooden-sword-brown-sword-art.png',
        sellValue: 20, price: 50 
    },
    novice_axe: {
        name: 'Novice Axe', type: 'weapon', toolType: 'tree', weaponType: 'axe', dmg: 10,
        image: 'https://opengameart.org/sites/default/files/item_stoneaxe.png',
        sellValue: 15, price: 40
    }
};

const MONSTER_TYPES = {
    wolf: { hp: 50, dmg: 5, speed: 2.2, xp: 30, gold: [5, 12], color: 0x777777 },
    ogre: { hp: 200, dmg: 15, speed: 1.0, xp: 120, gold: [30, 60], color: 0x553300 }
};

const RESOURCE_TYPES = {
    tree: { item: 'raw_wood', toolReq: 'tree', respawn: 15000 },
    rock: { item: 'raw_ore', toolReq: 'rock', respawn: 15000 }
};

function xpForLevel(level) { return level * 100; }

module.exports = { ITEMS, MONSTER_TYPES, RESOURCE_TYPES, xpForLevel };