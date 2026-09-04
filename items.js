// items.js
const ITEMS = {
    raw_wood: { name: 'Raw Wood', type: 'material', image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 5, price: 10 },
    raw_ore: { name: 'Iron Ore', type: 'material', image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 8, price: 15 },
    ogre_bone: { name: 'Ogre Bone', type: 'material', image: 'https://img.freepik.com/premium-vector/pixel-art-bone-icon_735839-2108.jpg', sellValue: 15, price: 30 },
    demon_horn: { name: 'Demon Horn', type: 'material', image: 'https://img.icons8.com/color/96/devil-horns.png', sellValue: 35, price: 70 },
    spider_silk: { name: 'Frost Silk', type: 'material', image: 'https://img.icons8.com/color/96/cobweb.png', sellValue: 20, price: 40 },
    skeleton_skull: { name: 'Ancient Skull', type: 'material', image: 'https://img.icons8.com/color/96/skull.png', sellValue: 25, price: 50 },

    // Weapons
    wood_sword: { name: 'Wood Sword', type: 'weapon', weaponType: 'sword', dmg: 10, image: 'https://e1.pngegg.com/pngimages/228/288/png-clipart-minecraft-icon-1-4-wooden-sword-brown-sword-art.png', sellValue: 20, price: 50 },
    novice_axe: { name: 'Novice Axe', type: 'weapon', toolType: 'tree', weaponType: 'axe', dmg: 8, image: 'https://opengameart.org/sites/default/files/item_stoneaxe.png', sellValue: 15, price: 40 },
    steel_broadsword: { name: 'Steel Broadsword', type: 'weapon', weaponType: 'broadsword', dmg: 22, image: 'https://img.icons8.com/color/96/sword.png', sellValue: 60, price: 120 },
    flame_dagger: { name: 'Flame Dagger', type: 'weapon', weaponType: 'dagger', dmg: 18, image: 'https://img.icons8.com/color/96/dagger.png', sellValue: 70, price: 140 },
    battle_hammer: { name: 'War Hammer', type: 'weapon', weaponType: 'hammer', dmg: 32, image: 'https://img.icons8.com/color/96/hammer.png', sellValue: 100, price: 210 },
    crystal_spear: { name: 'Frost Pike', type: 'weapon', weaponType: 'spear', dmg: 26, image: 'https://img.icons8.com/color/96/spear.png', sellValue: 90, price: 180 },

    // Armor Suits
    leather_armor: { name: 'Leather Tunic', type: 'armor', armorType: 'leather', defense: 3, hpBonus: 25, image: 'https://img.icons8.com/color/96/vest.png', sellValue: 30, price: 60 },
    iron_plate: { name: 'Iron Plate Mail', type: 'armor', armorType: 'iron', defense: 7, hpBonus: 60, image: 'https://img.icons8.com/color/96/armor.png', sellValue: 75, price: 150 },
    demon_carapace: { name: 'Demon Carapace', type: 'armor', armorType: 'demon', defense: 12, hpBonus: 120, image: 'https://img.icons8.com/color/96/body-armor.png', sellValue: 150, price: 300 }
};

const MONSTER_TYPES = {
    wolf: { name: 'Shadow Wolf', hp: 50, dmg: 6, speed: 2.2, xp: 30, gold: [6, 14], color: 0x52525b, drops: [{ item: 'raw_wood', chance: 0.3 }] },
    ogre: { name: 'Mossy Ogre', hp: 180, dmg: 14, speed: 1.0, xp: 120, gold: [25, 55], color: 0x3f2e18, drops: [{ item: 'ogre_bone', chance: 0.6 }, { item: 'wood_sword', chance: 0.1 }] },
    demon: { name: 'Infernal Demon', hp: 150, dmg: 18, speed: 1.6, xp: 160, gold: [35, 75], color: 0xb91c1c, drops: [{ item: 'demon_horn', chance: 0.65 }, { item: 'flame_dagger', chance: 0.15 }] },
    spider: { name: 'Frost Spider', hp: 75, dmg: 9, speed: 2.4, xp: 60, gold: [12, 28], color: 0x0284c7, drops: [{ item: 'spider_silk', chance: 0.7 }] },
    skeleton: { name: 'Cursed Skeleton', hp: 110, dmg: 12, speed: 1.4, xp: 90, gold: [18, 40], color: 0xd4d4d8, drops: [{ item: 'skeleton_skull', chance: 0.5 }, { item: 'steel_broadsword', chance: 0.1 }] }
};

const RESOURCE_TYPES = {
    tree: { item: 'raw_wood', toolReq: 'tree', respawn: 10000 },
    rock: { item: 'raw_ore', toolReq: 'rock', respawn: 15000 }
};

function xpForLevel(level) { return level * 100; }

module.exports = { ITEMS, MONSTER_TYPES, RESOURCE_TYPES, xpForLevel };
