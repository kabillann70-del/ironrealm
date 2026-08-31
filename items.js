// items.js
const ITEMS = {
    raw_wood: { 
        name: 'Raw Wood', 
        type: 'material', 
        image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png',
        sellValue: 5, 
        price: 10 
    },
    raw_ore: { 
        name: 'Iron Ore', 
        type: 'material', 
        image: 'https://img.icons8.com/color/96/iron-ore.png', // Sketchfab links don't work as images, using this high-quality one instead
        sellValue: 8, 
        price: 15 
    },
    ogre_bone: { 
        name: 'Ogre Bone', 
        type: 'material', 
        image: 'https://img.freepik.com/premium-vector/pixel-art-bone-icon_735839-2108.jpg',
        sellValue: 15, 
        price: 30 
    },
    wood_sword: { 
        name: 'Wood Sword', 
        type: 'weapon', 
        dmg: 5, 
        image: 'https://e1.pngegg.com/pngimages/228/288/png-clipart-minecraft-icon-1-4-wooden-sword-brown-sword-art.png',
        sellValue: 20, 
        price: 50 
    },
    novice_axe: {
        name: 'Novice Axe',
        type: 'tool',
        toolType: 'tree',
        image: 'https://opengameart.org/sites/default/files/item_stoneaxe.png',
        sellValue: 15,
        price: 40
    }
};

const MONSTER_TYPES = {
    wolf: { hp: 40, dmg: 5, speed: 2.5, xp: 20, gold: [5, 10], color: 0x777777 },
    ogre: { hp: 150, dmg: 15, speed: 1.2, xp: 100, gold: [20, 50], color: 0x553300 }
};

const RESOURCE_TYPES = {
    tree: { item: 'raw_wood', toolReq: 'tree', respawn: 10000, color: 0x228B22 },
    rock: { item: 'raw_ore', toolReq: 'rock', respawn: 15000, color: 0x808080 }
};

module.exports = { ITEMS, MONSTER_TYPES, RESOURCE_TYPES };