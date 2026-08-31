// items.js
const ITEMS = {
    raw_wood: { 
        name: 'Raw Wood', type: 'material', 
        image: 'https://kenney.nl/content/assets/rpg-base/preview.png', // Placeholder URL
        sellValue: 5, price: 10 
    },
    raw_ore: { 
        name: 'Iron Ore', type: 'material', 
        image: 'https://kenney.nl/content/assets/rpg-base/preview.png',
        sellValue: 8, price: 15 
    },
    wood_sword: { 
        name: 'Wood Sword', type: 'weapon', dmg: 5, 
        image: 'https://kenney.nl/content/assets/rpg-base/preview.png',
        sellValue: 20, price: 50 
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