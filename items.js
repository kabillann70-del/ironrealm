// items.js - Albion Online Inspired Equipment & Tier Catalog
const ITEMS = {
    // --- RAW CRAFTING MATERIALS ---
    raw_wood: { name: 'Raw Wood', type: 'material', tier: 1, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 4, price: 40 },
    raw_ore: { name: 'Iron Ore', type: 'material', tier: 1, image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 6, price: 60 },
    ogre_bone: { name: 'Ogre Bone', type: 'material', tier: 3, image: 'https://img.freepik.com/premium-vector/pixel-art-bone-icon_735839-2108.jpg', sellValue: 15, price: 150 },
    spider_silk: { name: 'Frost Silk', type: 'material', tier: 3, image: 'https://img.icons8.com/color/96/cobweb.png', sellValue: 20, price: 200 },
    skeleton_skull: { name: 'Ancient Skull', type: 'material', tier: 4, image: 'https://img.icons8.com/color/96/skull.png', sellValue: 35, price: 350 },
    demon_horn: { name: 'Demon Horn', type: 'material', tier: 5, image: 'https://img.icons8.com/color/96/devil-horns.png', sellValue: 60, price: 600 },

    // =========================================================================
    // TIER 2 (NOVICE)
    // =========================================================================
    wood_sword: { name: 'Novice Broadsword', tier: 2, type: 'weapon', weaponType: 'sword', category: 'warrior', dmg: 10, range: 6, sellValue: 40, price: 250, desc: 'T2 Novice blade carved for aspiring warriors.' },
    novice_axe: { name: 'Novice Battleaxe', tier: 2, type: 'weapon', toolType: 'tree', weaponType: 'axe', category: 'warrior', dmg: 8, range: 6, sellValue: 30, price: 200, desc: 'T2 Dual-purpose woodsman axe.' },
    novice_bow: { name: 'Novice Recurve Bow', tier: 2, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 9, range: 15, projectile: 'arrow', sellValue: 45, price: 260, desc: 'T2 Flexible yew bow for hunters.' },
    novice_fire_staff: { name: 'Novice Fire Staff', tier: 2, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 11, range: 14, projectile: 'fireball', sellValue: 50, price: 280, desc: 'T2 Wooden focus staff channeling ember sparks.' },
    novice_robe: { name: 'Novice Scholar Robe', tier: 2, type: 'armor', armorType: 'cloth', category: 'mage', defense: 2, hpBonus: 15, dmgBonus: 2, sellValue: 35, price: 220, desc: 'T2 Light cloth robe with mana focus.' },
    leather_armor: { name: 'Novice Hunter Jacket', tier: 2, type: 'armor', armorType: 'leather', category: 'hunter', defense: 4, hpBonus: 25, sellValue: 45, price: 270, desc: 'T2 Boiled leather armor with mobility.' },
    novice_plate: { name: 'Novice Soldier Armor', tier: 2, type: 'armor', armorType: 'iron', category: 'warrior', defense: 6, hpBonus: 40, sellValue: 55, price: 320, desc: 'T2 Basic cast-iron knight cuirass.' },

    // =========================================================================
    // TIER 3 (JOURNEYMAN)
    // =========================================================================
    journeyman_claymore: { name: 'Journeyman Claymore', tier: 3, type: 'weapon', weaponType: 'broadsword', category: 'warrior', dmg: 16, range: 6, sellValue: 120, price: 850, desc: 'T3 Two-handed steel claymore.' },
    journeyman_warbow: { name: 'Journeyman Warbow', tier: 3, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 15, range: 16, projectile: 'arrow', sellValue: 130, price: 880, desc: 'T3 Reinforced recurve warbow.' },
    journeyman_frost_staff: { name: 'Journeyman Frost Staff', tier: 3, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 18, range: 15, projectile: 'frost_bolt', sellValue: 140, price: 950, desc: 'T3 Staff tipped with chilling frost orbs.' },
    journeyman_hammer: { name: 'Journeyman War Hammer', tier: 3, type: 'weapon', weaponType: 'hammer', category: 'warrior', dmg: 20, range: 6, sellValue: 135, price: 920, desc: 'T3 Heavy iron bludgeon for armor breaking.' },
    journeyman_robe: { name: 'Journeyman Cleric Robe', tier: 3, type: 'armor', armorType: 'cloth', category: 'mage', defense: 4, hpBonus: 35, dmgBonus: 4, sellValue: 110, price: 780, desc: 'T3 Blessed woven silk vestment.' },
    journeyman_leather: { name: 'Journeyman Scout Garb', tier: 3, type: 'armor', armorType: 'leather', category: 'hunter', defense: 8, hpBonus: 50, sellValue: 125, price: 860, desc: 'T3 Supple treated leather vest.' },
    journeyman_plate: { name: 'Journeyman Knight Mail', tier: 3, type: 'armor', armorType: 'iron', category: 'warrior', defense: 12, hpBonus: 75, sellValue: 160, price: 1050, desc: 'T3 Tempered steel chest harness.' },

    // =========================================================================
    // TIER 4 (ADEPT)
    // =========================================================================
    steel_broadsword: { name: 'Adept Broadsword', tier: 4, type: 'weapon', weaponType: 'broadsword', category: 'warrior', dmg: 24, range: 6, sellValue: 350, price: 2400, desc: 'T4 Polished rune-etched steel broadsword.' },
    adept_longbow: { name: 'Adept Longbow', tier: 4, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 22, range: 17, projectile: 'arrow', sellValue: 360, price: 2500, desc: 'T4 High-tension longbow piercing distant foes.' },
    adept_cursed_staff: { name: 'Adept Cursed Staff', tier: 4, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 26, range: 15, projectile: 'arcane_bolt', sellValue: 400, price: 2750, desc: 'T4 Darkwood staff harboring ethereal souls.' },
    adept_dagger: { name: 'Adept Dual Daggers', tier: 4, type: 'weapon', weaponType: 'dagger', category: 'hunter', dmg: 20, range: 5, sellValue: 320, price: 2300, desc: 'T4 Twin keen assassin daggers.' },
    adept_pike: { name: 'Adept Pike', tier: 4, type: 'weapon', weaponType: 'spear', category: 'warrior', dmg: 23, range: 7, sellValue: 350, price: 2450, desc: 'T4 Long reach thrusting lance.' },
    adept_mage_robe: { name: 'Adept Pyromancer Robe', tier: 4, type: 'armor', armorType: 'cloth', category: 'mage', defense: 7, hpBonus: 60, dmgBonus: 7, sellValue: 300, price: 2200, desc: 'T4 Robes infused with spell-weaving gems.' },
    adept_assassin_jacket: { name: 'Adept Assassin Jacket', tier: 4, type: 'armor', armorType: 'leather', category: 'hunter', defense: 12, hpBonus: 85, sellValue: 380, price: 2600, desc: 'T4 Studded stealth tunic with dark clasps.' },
    iron_plate: { name: 'Adept Guardian Plate', tier: 4, type: 'armor', armorType: 'iron', category: 'warrior', defense: 18, hpBonus: 120, sellValue: 480, price: 3200, desc: 'T4 Heavy fortress plate mail with gold crest.' },

    // =========================================================================
    // TIER 5 (EXPERT)
    // =========================================================================
    flame_dagger: { name: 'Expert Flame Dagger', tier: 5, type: 'weapon', weaponType: 'dagger', category: 'hunter', dmg: 30, range: 5, sellValue: 900, price: 6500, desc: 'T5 Obsidian stiletto burning with hellfire.' },
    expert_whispering_bow: { name: 'Expert Whispering Bow', tier: 5, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 32, range: 18, projectile: 'energy_arrow', sellValue: 950, price: 6800, desc: 'T5 Ethereal bow whispered by woodland spirits.' },
    expert_infernal_staff: { name: 'Expert Infernal Staff', tier: 5, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 36, range: 16, projectile: 'fireball', sellValue: 1050, price: 7500, desc: 'T5 Demon-crested staff unleashing magma fury.' },
    battle_hammer: { name: 'Expert Earthbreaker', tier: 5, type: 'weapon', weaponType: 'hammer', category: 'warrior', dmg: 38, range: 6, sellValue: 1000, price: 7200, desc: 'T5 Colossal hammer shattering ground & shields.' },
    crystal_spear: { name: 'Expert Frost Pike', tier: 5, type: 'weapon', weaponType: 'spear', category: 'warrior', dmg: 34, range: 7, sellValue: 960, price: 6900, desc: 'T5 Subzero crystal lance freezing blood.' },
    expert_royal_robe: { name: 'Expert Royal Robe', tier: 5, type: 'armor', armorType: 'cloth', category: 'mage', defense: 10, hpBonus: 95, dmgBonus: 12, sellValue: 850, price: 6200, desc: 'T5 Gilded archmage robe boosting raw sorcery.' },
    expert_stalker_leather: { name: 'Expert Stalker Leather', tier: 5, type: 'armor', armorType: 'leather', category: 'hunter', defense: 18, hpBonus: 130, sellValue: 980, price: 7000, desc: 'T5 Dragon-scale reinforced leather tunic.' },
    demon_carapace: { name: 'Expert Demon Carapace', tier: 5, type: 'armor', armorType: 'demon', category: 'warrior', defense: 25, hpBonus: 180, sellValue: 1200, price: 8500, desc: 'T5 Abyssal bone plate pulsing brimstone heat.' },

    // =========================================================================
    // TIER 6 (MASTER)
    // =========================================================================
    master_relic_blade: { name: 'Master Relic Greatsword', tier: 6, type: 'weapon', weaponType: 'broadsword', category: 'warrior', dmg: 46, range: 6, sellValue: 2400, price: 16500, desc: 'T6 Ancient kingdom relic radiating golden power.' },
    master_bow_of_shadows: { name: 'Master Bow of Shadows', tier: 6, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 44, range: 19, projectile: 'shadow_arrow', sellValue: 2550, price: 17500, desc: 'T6 Dark composite bow firing shadow bolts.' },
    master_archmage_staff: { name: 'Master Archmage Staff', tier: 6, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 50, range: 17, projectile: 'arcane_orb', sellValue: 2800, price: 19000, desc: 'T6 Orbiting celestial gem channeling cosmic blast.' },
    master_abyssal_hammer: { name: 'Master Abyssal Hammer', tier: 6, type: 'weapon', weaponType: 'hammer', category: 'warrior', dmg: 54, range: 6, sellValue: 2700, price: 18500, desc: 'T6 Cataclysmic obsidian war hammer.' },
    master_archmage_vestment: { name: 'Master Archmage Vestment', tier: 6, type: 'armor', armorType: 'cloth', category: 'mage', defense: 14, hpBonus: 140, dmgBonus: 18, sellValue: 2200, price: 15500, desc: 'T6 Celestial woven vestments of grand sorcerers.' },
    master_shadow_jacket: { name: 'Master Shadow Garb', tier: 6, type: 'armor', armorType: 'leather', category: 'hunter', defense: 24, hpBonus: 190, sellValue: 2600, price: 18000, desc: 'T6 Phantom leather coat with umbral wards.' },
    master_judicator_plate: { name: 'Master Judicator Carapace', tier: 6, type: 'armor', armorType: 'demon', category: 'warrior', defense: 35, hpBonus: 260, sellValue: 3200, price: 22500, desc: 'T6 Indestructible titan armor forged in hell.' }
};

const MONSTER_TYPES = {
    wolf: { name: 'Shadow Wolf', hp: 50, dmg: 6, speed: 2.2, xp: 30, gold: [4, 10], color: 0x52525b, drops: [{ item: 'raw_wood', chance: 0.35 }, { item: 'novice_bow', chance: 0.05 }] },
    spider: { name: 'Frost Spider', hp: 75, dmg: 9, speed: 2.4, xp: 60, gold: [8, 18], color: 0x0284c7, drops: [{ item: 'spider_silk', chance: 0.7 }, { item: 'journeyman_frost_staff', chance: 0.05 }] },
    skeleton: { name: 'Cursed Skeleton', hp: 110, dmg: 12, speed: 1.4, xp: 90, gold: [14, 28], color: 0xd4d4d8, drops: [{ item: 'skeleton_skull', chance: 0.5 }, { item: 'adept_cursed_staff', chance: 0.04 }, { item: 'steel_broadsword', chance: 0.04 }] },
    ogre: { name: 'Mossy Ogre', hp: 180, dmg: 14, speed: 1.0, xp: 120, gold: [25, 45], color: 0x3f2e18, drops: [{ item: 'ogre_bone', chance: 0.6 }, { item: 'journeyman_hammer', chance: 0.06 }, { item: 'wood_sword', chance: 0.08 }] },
    demon: { name: 'Infernal Demon', hp: 160, dmg: 18, speed: 1.6, xp: 160, gold: [45, 85], color: 0xb91c1c, drops: [{ item: 'demon_horn', chance: 0.65 }, { item: 'flame_dagger', chance: 0.06 }, { item: 'expert_infernal_staff', chance: 0.05 }] }
};

const RESOURCE_TYPES = {
    tree: { item: 'raw_wood', toolReq: 'tree', respawn: 10000 },
    rock: { item: 'raw_ore', toolReq: 'rock', respawn: 15000 }
};

function xpForLevel(level) { return level * 100; }

module.exports = { ITEMS, MONSTER_TYPES, RESOURCE_TYPES, xpForLevel };

