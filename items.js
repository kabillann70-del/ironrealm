// items.js - Albion Online Inspired Equipment & Tier Catalog
const ITEMS = {
    // =========================================================================
    // TIERED RAW CRAFTING MATERIALS (WOOD & ORE TIERS)
    // =========================================================================
    // Tier 2 (Woodlands / Sanctuary)
    birch_wood: { name: 'Novice Birch Wood', type: 'material', tier: 2, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 12, price: 80 },
    copper_ore: { name: 'Novice Copper Ore', type: 'material', tier: 2, image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 16, price: 110 },
    // Aliases for initial starter recipes
    raw_wood: { name: 'Novice Birch Wood', type: 'material', tier: 2, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 12, price: 80 },
    raw_ore: { name: 'Novice Copper Ore', type: 'material', tier: 2, image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 16, price: 110 },

    // Tier 3 (Frostpeak Glacier)
    chestnut_wood: { name: 'Journeyman Chestnut Wood', type: 'material', tier: 3, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 35, price: 240 },
    bronze_ore: { name: 'Journeyman Bronze Ore', type: 'material', tier: 3, image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 45, price: 300 },
    spider_silk: { name: 'Frost Spider Silk', type: 'material', tier: 3, image: 'https://img.icons8.com/color/96/cobweb.png', sellValue: 55, price: 380 },
    ogre_bone: { name: 'Ogre Bone', type: 'material', tier: 3, image: 'https://img.freepik.com/premium-vector/pixel-art-bone-icon_735839-2108.jpg', sellValue: 65, price: 440 },

    // Tier 4 (Necropolis of the Damned)
    pine_wood: { name: 'Adept Pine Wood', type: 'material', tier: 4, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 110, price: 750 },
    iron_ore: { name: 'Adept Iron Ore', type: 'material', tier: 4, image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 130, price: 900 },
    skeleton_skull: { name: 'Cursed Skull', type: 'material', tier: 4, image: 'https://img.icons8.com/color/96/skull.png', sellValue: 160, price: 1100 },

    // Tier 5 (The Brimstone Abyss)
    cedar_wood: { name: 'Expert Cedar Wood', type: 'material', tier: 5, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 320, price: 2200 },
    titanium_ore: { name: 'Expert Titanium Ore', type: 'material', tier: 5, image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 380, price: 2600 },
    demon_horn: { name: 'Infernal Demon Horn', type: 'material', tier: 5, image: 'https://img.icons8.com/color/96/devil-horns.png', sellValue: 480, price: 3300 },

    // Tier 6 (The Obsidian Throne)
    bloodoak_wood: { name: 'Master Bloodoak Wood', type: 'material', tier: 6, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 850, price: 6000 },
    runite_ore: { name: 'Master Runite Ore', type: 'material', tier: 6, image: 'https://img.icons8.com/color/96/iron-ore.png', sellValue: 950, price: 7000 },
    dragon_scale: { name: 'Abyssal Dragon Scale', type: 'material', tier: 6, image: 'https://img.icons8.com/color/96/dragon.png', sellValue: 1400, price: 9500 },
    abyssal_core: { name: 'Heart of the Ruin', type: 'material', tier: 6, image: 'https://img.icons8.com/color/96/ruby-gemstone.png', sellValue: 2400, price: 16000 },

    // Tier 7 (The Astral Dominion / World-Class Zone)
    astral_wood: { name: 'Celestial World-Tree Wood', type: 'material', tier: 7, image: 'https://opengameart.org/sites/default/files/wood%20log%20sprite%20sheet_0.png', sellValue: 2600, price: 18000 },
    starfall_crystal: { name: 'Astral Starfall Ore', type: 'material', tier: 7, image: 'https://img.icons8.com/color/96/ruby-gemstone.png', sellValue: 3200, price: 22000 },
    void_shard: { name: 'Void Emperor Shard', type: 'material', tier: 7, image: 'https://img.icons8.com/color/96/crystal.png', sellValue: 5500, price: 38000 },

    // =========================================================================
    // TIER 2 (NOVICE) - Level Rec: 1 - 10
    // =========================================================================
    wood_sword: { name: 'Novice Broadsword', tier: 2, type: 'weapon', weaponType: 'sword', category: 'warrior', dmg: 10, range: 6, sellValue: 90, price: 550, desc: 'T2 Novice blade carved for aspiring warriors.' },
    novice_axe: { name: 'Novice Battleaxe', tier: 2, type: 'weapon', toolType: 'tree', weaponType: 'axe', category: 'warrior', dmg: 8, range: 6, sellValue: 80, price: 480, desc: 'T2 Dual-purpose woodsman axe.' },
    novice_bow: { name: 'Novice Recurve Bow', tier: 2, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 9, range: 15, projectile: 'arrow', sellValue: 95, price: 580, desc: 'T2 Flexible yew bow for hunters.' },
    novice_fire_staff: { name: 'Novice Fire Staff', tier: 2, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 11, range: 14, projectile: 'fireball', sellValue: 110, price: 620, desc: 'T2 Wooden focus staff channeling ember sparks.' },
    novice_robe: { name: 'Novice Scholar Robe', tier: 2, type: 'armor', armorType: 'cloth', category: 'mage', defense: 3, hpBonus: 25, dmgBonus: 3, sellValue: 85, price: 500, desc: 'T2 Light cloth robe with mana focus.' },
    leather_armor: { name: 'Novice Hunter Jacket', tier: 2, type: 'armor', armorType: 'leather', category: 'hunter', defense: 6, hpBonus: 40, sellValue: 105, price: 600, desc: 'T2 Boiled leather armor with mobility.' },
    novice_plate: { name: 'Novice Soldier Armor', tier: 2, type: 'armor', armorType: 'iron', category: 'warrior', defense: 9, hpBonus: 65, sellValue: 130, price: 750, desc: 'T2 Basic cast-iron knight cuirass.' },

    // =========================================================================
    // TIER 3 (JOURNEYMAN) - Level Rec: 11 - 22
    // =========================================================================
    journeyman_claymore: { name: 'Journeyman Claymore', tier: 3, type: 'weapon', weaponType: 'broadsword', category: 'warrior', dmg: 18, range: 6, sellValue: 380, price: 2500, desc: 'T3 Two-handed steel claymore.' },
    journeyman_warbow: { name: 'Journeyman Warbow', tier: 3, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 16, range: 16, projectile: 'arrow', sellValue: 400, price: 2600, desc: 'T3 Reinforced recurve warbow.' },
    journeyman_frost_staff: { name: 'Journeyman Frost Staff', tier: 3, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 20, range: 15, projectile: 'frost_bolt', sellValue: 440, price: 2850, desc: 'T3 Staff tipped with chilling frost orbs.' },
    journeyman_hammer: { name: 'Journeyman War Hammer', tier: 3, type: 'weapon', weaponType: 'hammer', category: 'warrior', dmg: 22, range: 6, sellValue: 420, price: 2700, desc: 'T3 Heavy iron bludgeon for armor breaking.' },
    journeyman_robe: { name: 'Journeyman Cleric Robe', tier: 3, type: 'armor', armorType: 'cloth', category: 'mage', defense: 6, hpBonus: 55, dmgBonus: 6, sellValue: 350, price: 2200, desc: 'T3 Blessed woven silk vestment.' },
    journeyman_leather: { name: 'Journeyman Scout Garb', tier: 3, type: 'armor', armorType: 'leather', category: 'hunter', defense: 12, hpBonus: 80, sellValue: 400, price: 2550, desc: 'T3 Supple treated leather vest.' },
    journeyman_plate: { name: 'Journeyman Knight Mail', tier: 3, type: 'armor', armorType: 'iron', category: 'warrior', defense: 18, hpBonus: 120, sellValue: 500, price: 3200, desc: 'T3 Tempered steel chest harness.' },

    // =========================================================================
    // TIER 4 (ADEPT) - Level Rec: 23 - 35
    // =========================================================================
    steel_broadsword: { name: 'Adept Broadsword', tier: 4, type: 'weapon', weaponType: 'broadsword', category: 'warrior', dmg: 28, range: 6, sellValue: 1200, price: 8500, desc: 'T4 Polished rune-etched steel broadsword.' },
    adept_longbow: { name: 'Adept Longbow', tier: 4, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 26, range: 17, projectile: 'arrow', sellValue: 1300, price: 9200, desc: 'T4 High-tension longbow piercing distant foes.' },
    adept_cursed_staff: { name: 'Adept Cursed Staff', tier: 4, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 32, range: 15, projectile: 'arcane_bolt', sellValue: 1450, price: 10500, desc: 'T4 Darkwood staff harboring ethereal souls.' },
    adept_dagger: { name: 'Adept Dual Daggers', tier: 4, type: 'weapon', weaponType: 'dagger', category: 'hunter', dmg: 25, range: 5, sellValue: 1150, price: 8200, desc: 'T4 Twin keen assassin daggers.' },
    adept_pike: { name: 'Adept Pike', tier: 4, type: 'weapon', weaponType: 'spear', category: 'warrior', dmg: 27, range: 7, sellValue: 1250, price: 8900, desc: 'T4 Long reach thrusting lance.' },
    adept_mage_robe: { name: 'Adept Pyromancer Robe', tier: 4, type: 'armor', armorType: 'cloth', category: 'mage', defense: 10, hpBonus: 95, dmgBonus: 10, sellValue: 1100, price: 7800, desc: 'T4 Robes infused with spell-weaving gems.' },
    adept_assassin_jacket: { name: 'Adept Assassin Jacket', tier: 4, type: 'armor', armorType: 'leather', category: 'hunter', defense: 18, hpBonus: 135, sellValue: 1350, price: 9500, desc: 'T4 Studded stealth tunic with dark clasps.' },
    iron_plate: { name: 'Adept Guardian Plate', tier: 4, type: 'armor', armorType: 'iron', category: 'warrior', defense: 26, hpBonus: 190, sellValue: 1700, price: 12000, desc: 'T4 Heavy fortress plate mail with gold crest.' },

    // =========================================================================
    // TIER 5 (EXPERT) - Level Rec: 36 - 48
    // =========================================================================
    flame_dagger: { name: 'Expert Flame Dagger', tier: 5, type: 'weapon', weaponType: 'dagger', category: 'hunter', dmg: 38, range: 5, sellValue: 4200, price: 28000, desc: 'T5 Obsidian stiletto burning with hellfire.' },
    expert_whispering_bow: { name: 'Expert Whispering Bow', tier: 5, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 40, range: 18, projectile: 'energy_arrow', sellValue: 4500, price: 30000, desc: 'T5 Ethereal bow whispered by woodland spirits.' },
    expert_infernal_staff: { name: 'Expert Infernal Staff', tier: 5, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 46, range: 16, projectile: 'fireball', sellValue: 5000, price: 34000, desc: 'T5 Demon-crested staff unleashing magma fury.' },
    battle_hammer: { name: 'Expert Earthbreaker', tier: 5, type: 'weapon', weaponType: 'hammer', category: 'warrior', dmg: 48, range: 6, sellValue: 4800, price: 32000, desc: 'T5 Colossal hammer shattering ground & shields.' },
    crystal_spear: { name: 'Expert Frost Pike', tier: 5, type: 'weapon', weaponType: 'spear', category: 'warrior', dmg: 44, range: 7, sellValue: 4600, price: 31000, desc: 'T5 Subzero crystal lance freezing blood.' },
    expert_royal_robe: { name: 'Expert Royal Robe', tier: 5, type: 'armor', armorType: 'cloth', category: 'mage', defense: 15, hpBonus: 150, dmgBonus: 16, sellValue: 3800, price: 26000, desc: 'T5 Gilded archmage robe boosting raw sorcery.' },
    expert_stalker_leather: { name: 'Expert Stalker Leather', tier: 5, type: 'armor', armorType: 'leather', category: 'hunter', defense: 26, hpBonus: 210, sellValue: 4400, price: 30000, desc: 'T5 Dragon-scale reinforced leather tunic.' },
    demon_carapace: { name: 'Expert Demon Carapace', tier: 5, type: 'armor', armorType: 'demon', category: 'warrior', defense: 38, hpBonus: 300, sellValue: 5500, price: 38000, desc: 'T5 Abyssal bone plate pulsing brimstone heat.' },

    // =========================================================================
    // TIER 6 (MASTER & WORLD BOSS RELICS) - Level Rec: 50+
    // =========================================================================
    master_relic_blade: { name: 'Master Relic Greatsword', tier: 6, type: 'weapon', weaponType: 'broadsword', category: 'warrior', dmg: 62, range: 6, sellValue: 14000, price: 95000, desc: 'T6 Ancient kingdom relic radiating golden power.' },
    master_bow_of_shadows: { name: 'Master Bow of Shadows', tier: 6, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 58, range: 19, projectile: 'shadow_arrow', sellValue: 15000, price: 102000, desc: 'T6 Dark composite bow firing shadow bolts.' },
    master_archmage_staff: { name: 'Master Archmage Staff', tier: 6, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 68, range: 17, projectile: 'arcane_orb', sellValue: 17000, price: 115000, desc: 'T6 Orbiting celestial gem channeling cosmic blast.' },
    master_abyssal_hammer: { name: 'Master Abyssal Hammer', tier: 6, type: 'weapon', weaponType: 'hammer', category: 'warrior', dmg: 72, range: 6, sellValue: 16000, price: 108000, desc: 'T6 Cataclysmic obsidian war hammer.' },
    master_archmage_vestment: { name: 'Master Archmage Vestment', tier: 6, type: 'armor', armorType: 'cloth', category: 'mage', defense: 22, hpBonus: 220, dmgBonus: 25, sellValue: 13000, price: 88000, desc: 'T6 Celestial woven vestments of grand sorcerers.' },
    master_shadow_jacket: { name: 'Master Shadow Garb', tier: 6, type: 'armor', armorType: 'leather', category: 'hunter', defense: 36, hpBonus: 310, sellValue: 15500, price: 105000, desc: 'T6 Phantom leather coat with umbral wards.' },
    master_judicator_plate: { name: 'Master Judicator Carapace', tier: 6, type: 'armor', armorType: 'demon', category: 'warrior', defense: 52, hpBonus: 440, sellValue: 19000, price: 128000, desc: 'T6 Indestructible titan armor forged in hell.' },

    // =========================================================================
    // TIER 7 (WORLD-CLASS CELESTIAL RELICS) - Level Rec: 65+ [WORLD-CLASS]
    // =========================================================================
    celestial_greatsword: { name: 'Astraeus Void Cleaver', tier: 7, type: 'weapon', weaponType: 'broadsword', category: 'warrior', dmg: 88, range: 7, sellValue: 45000, price: 320000, desc: 'T7 World-Class Greatsword forged from collapsed star cores.' },
    celestial_bow: { name: 'Star-Strider Longbow', tier: 7, type: 'weapon', weaponType: 'bow', category: 'hunter', dmg: 82, range: 21, projectile: 'energy_arrow', sellValue: 48000, price: 340000, desc: 'T7 World-Class bow firing astral supernovas.' },
    celestial_staff: { name: 'Void Emperor Scepter', tier: 7, type: 'weapon', weaponType: 'staff', category: 'mage', dmg: 96, range: 18, projectile: 'arcane_orb', sellValue: 52000, price: 380000, desc: 'T7 World-Class scepter commanding astral black holes.' },
    celestial_carapace: { name: 'Void Emperor Regalia', tier: 7, type: 'armor', armorType: 'demon', category: 'warrior', defense: 75, hpBonus: 650, sellValue: 58000, price: 420000, desc: 'T7 Supreme titan plate resonating with cosmic eternity.' }
};

// =========================================================================
// WORLD REGIONS & BIOME BOUNDS (INCLUDING WORLD-CLASS EXPENSE)
// =========================================================================
const ZONES = {
    sanctuary: {
        id: 'sanctuary',
        name: 'Sanctuary of Light',
        icon: '🛡️',
        recLevel: 'Lv. 1 (Safe Hub)',
        minLevel: 1,
        danger: 'Safe Zone',
        color: 0x38bdf8,
        theme: 'safe',
        desc: 'Protected capital with Forge, Traders, and Portal Stones.'
    },
    woodlands: {
        id: 'woodlands',
        name: 'Verdant Woodlands',
        icon: '🌲',
        recLevel: 'Lv. 1 - 10',
        minLevel: 1,
        maxLevel: 10,
        danger: 'Novice Danger',
        color: 0x22c55e,
        theme: 'forest',
        woodDrop: 'birch_wood',
        oreDrop: 'copper_ore',
        desc: 'Dense enchanted woods home to wolves, boars, bandits, and Shadow Lord Garrick.'
    },
    frostpeak: {
        id: 'frostpeak',
        name: 'Frostpeak Glacier',
        icon: '❄️',
        recLevel: 'Lv. 11 - 22',
        minLevel: 11,
        maxLevel: 22,
        danger: 'Moderate Threat',
        color: 0x0284c7,
        theme: 'ice',
        woodDrop: 'chestnut_wood',
        oreDrop: 'bronze_ore',
        desc: 'Subzero peaks infested with frost spiders, ice golems, and Ymir the Glacial Titan.'
    },
    necropolis: {
        id: 'necropolis',
        name: 'Necropolis of the Damned',
        icon: '💀',
        recLevel: 'Lv. 23 - 35',
        minLevel: 23,
        maxLevel: 35,
        danger: 'High Threat',
        color: 0xa855f7,
        theme: 'undead',
        woodDrop: 'pine_wood',
        oreDrop: 'iron_ore',
        desc: 'Cursed crypts guarded by Death Knights, Dread Liches, and Sovereign Malakor.'
    },
    abyss: {
        id: 'abyss',
        name: 'The Brimstone Abyss',
        icon: '🔥',
        recLevel: 'Lv. 36 - 48',
        minLevel: 36,
        maxLevel: 48,
        danger: 'Extreme Threat',
        color: 0xef4444,
        theme: 'demon',
        woodDrop: 'cedar_wood',
        oreDrop: 'titanium_ore',
        desc: 'Molten crags teeming with Hellhounds, Ogres, and Infernal Demons.'
    },
    boss_sanctum: {
        id: 'boss_sanctum',
        name: 'The Obsidian Throne',
        icon: '☠️',
        recLevel: 'Lv. 50+ [WORLD BOSS]',
        minLevel: 50,
        maxLevel: 100,
        danger: 'LETHAL • WORLD BOSS ARENA',
        color: 0xf59e0b,
        theme: 'boss',
        isBossZone: true,
        woodDrop: 'bloodoak_wood',
        oreDrop: 'runite_ore',
        desc: 'Lair of Ignisrax the Abyssal Dragon Lord. Prepare for catastrophic fire.'
    },
    celestial_expanse: {
        id: 'celestial_expanse',
        name: 'The Astral Dominion',
        icon: '✨',
        recLevel: 'Lv. 65+ [WORLD-CLASS ZONE]',
        minLevel: 65,
        maxLevel: 100,
        danger: '✨ SUPREME THREAT • WORLD-CLASS REALM',
        color: 0x818cf8,
        theme: 'astral',
        isWorldClass: true,
        woodDrop: 'astral_wood',
        oreDrop: 'starfall_crystal',
        desc: 'Mythical floating celestial expanse guarded by Astral Archons and Astraeus the Void Emperor.'
    }
};

function getZoneAt(x, z) {
    // Sanctuary Hub in Center: [-22, 22] x [-22, 22]
    if (Math.abs(x) <= 22 && Math.abs(z) <= 22) return ZONES.sanctuary;
    // World-Class Celestial Dominion in North-East Realm: x > 32 && z < -25
    if (x > 32 && z < -25) return ZONES.celestial_expanse;
    // Boss Sanctum in South-East Corner: x > 35 && z > 35
    if (x > 35 && z > 35) return ZONES.boss_sanctum;
    // North: z < -22 (Woodlands)
    if (z < -22) return ZONES.woodlands;
    // East: x > 22 && z >= -25 && z <= 35
    if (x > 22 && z <= 35) return ZONES.frostpeak;
    // West: x < -22 && z <= 35
    if (x < -22 && z <= 35) return ZONES.necropolis;
    // South / South-West: z > 22
    return ZONES.abyss;
}

// =========================================================================
// MONSTER ROSTER CATEGORIZED BY ZONE (WITH MINIBOSS IN EACH ZONE)
// =========================================================================
const MONSTER_TYPES = {
    // --- ZONE 1: VERDANT WOODLANDS (Lv 1 - 10) ---
    wolf: { 
        name: 'Shadow Wolf', 
        zone: 'woodlands', 
        level: 3, 
        hp: 65, 
        dmg: 7, 
        speed: 2.2, 
        xp: 35, 
        gold: [10, 24], 
        color: 0x52525b, 
        drops: [{ item: 'birch_wood', chance: 0.6 }, { item: 'novice_bow', chance: 0.08 }] 
    },
    boar: { 
        name: 'Dire Boar', 
        zone: 'woodlands', 
        level: 6, 
        hp: 110, 
        dmg: 9, 
        speed: 1.9, 
        xp: 55, 
        gold: [16, 35], 
        color: 0x451a03, 
        drops: [{ item: 'birch_wood', chance: 0.65 }, { item: 'leather_armor', chance: 0.07 }] 
    },
    bandit: { 
        name: 'Forest Bandit', 
        zone: 'woodlands', 
        level: 8, 
        hp: 155, 
        dmg: 12, 
        speed: 1.7, 
        xp: 80, 
        gold: [25, 55], 
        color: 0x15803d, 
        drops: [{ item: 'copper_ore', chance: 0.6 }, { item: 'wood_sword', chance: 0.09 }, { item: 'novice_axe', chance: 0.09 }] 
    },
    bandit_warlord: {
        name: 'Garrick the Shadow King',
        zone: 'woodlands',
        level: 10,
        hp: 1100,
        dmg: 19,
        speed: 1.85,
        isMiniBoss: true,
        xp: 850,
        gold: [350, 750],
        color: 0x166534,
        drops: [
            { item: 'birch_wood', chance: 1.0 },
            { item: 'copper_ore', chance: 1.0 },
            { item: 'wood_sword', chance: 0.35 },
            { item: 'leather_armor', chance: 0.35 }
        ]
    },

    // --- ZONE 2: FROSTPEAK GLACIER (Lv 11 - 22) ---
    spider: { 
        name: 'Frost Spider', 
        zone: 'frostpeak', 
        level: 13, 
        hp: 190, 
        dmg: 16, 
        speed: 2.4, 
        xp: 120, 
        gold: [40, 75], 
        color: 0x0284c7, 
        drops: [{ item: 'spider_silk', chance: 0.8 }, { item: 'chestnut_wood', chance: 0.4 }, { item: 'journeyman_frost_staff', chance: 0.06 }] 
    },
    frost_golem: { 
        name: 'Glacial Golem', 
        zone: 'frostpeak', 
        level: 17, 
        hp: 340, 
        dmg: 22, 
        speed: 1.1, 
        xp: 170, 
        gold: [60, 110], 
        color: 0x38bdf8, 
        drops: [{ item: 'bronze_ore', chance: 0.75 }, { item: 'spider_silk', chance: 0.5 }, { item: 'journeyman_hammer', chance: 0.08 }] 
    },
    ice_wraith: { 
        name: 'Frost Wraith', 
        zone: 'frostpeak', 
        level: 20, 
        hp: 260, 
        dmg: 26, 
        speed: 2.1, 
        xp: 210, 
        gold: [75, 135], 
        color: 0x7dd3fc, 
        drops: [{ item: 'spider_silk', chance: 0.85 }, { item: 'journeyman_robe', chance: 0.08 }, { item: 'journeyman_claymore', chance: 0.06 }] 
    },
    frost_titan: {
        name: 'Ymir the Glacial Titan',
        zone: 'frostpeak',
        level: 22,
        hp: 2200,
        dmg: 35,
        speed: 1.3,
        isMiniBoss: true,
        xp: 1800,
        gold: [800, 1500],
        color: 0x0369a1,
        drops: [
            { item: 'chestnut_wood', chance: 1.0 },
            { item: 'bronze_ore', chance: 1.0 },
            { item: 'spider_silk', chance: 1.0 },
            { item: 'journeyman_frost_staff', chance: 0.3 },
            { item: 'journeyman_plate', chance: 0.3 }
        ]
    },

    // --- ZONE 3: NECROPOLIS OF THE DAMNED (Lv 23 - 35) ---
    skeleton: { 
        name: 'Cursed Skeleton', 
        zone: 'necropolis', 
        level: 25, 
        hp: 360, 
        dmg: 30, 
        speed: 1.5, 
        xp: 270, 
        gold: [95, 175], 
        color: 0xd4d4d8, 
        drops: [{ item: 'skeleton_skull', chance: 0.65 }, { item: 'iron_ore', chance: 0.4 }, { item: 'steel_broadsword', chance: 0.05 }] 
    },
    death_knight: { 
        name: 'Death Knight', 
        zone: 'necropolis', 
        level: 29, 
        hp: 560, 
        dmg: 38, 
        speed: 1.6, 
        xp: 360, 
        gold: [140, 250], 
        color: 0x64748b, 
        drops: [{ item: 'skeleton_skull', chance: 0.75 }, { item: 'pine_wood', chance: 0.45 }, { item: 'iron_plate', chance: 0.06 }] 
    },
    dread_lich: { 
        name: 'Dread Lich', 
        zone: 'necropolis', 
        level: 33, 
        hp: 460, 
        dmg: 44, 
        speed: 1.8, 
        xp: 450, 
        gold: [180, 320], 
        color: 0x9333ea, 
        drops: [{ item: 'skeleton_skull', chance: 0.85 }, { item: 'adept_cursed_staff', chance: 0.07 }, { item: 'adept_mage_robe', chance: 0.07 }] 
    },
    crypt_sovereign: {
        name: 'Malakor the Crypt Sovereign',
        zone: 'necropolis',
        level: 35,
        hp: 3400,
        dmg: 48,
        speed: 1.55,
        isMiniBoss: true,
        xp: 2900,
        gold: [1400, 2600],
        color: 0x581c87,
        drops: [
            { item: 'pine_wood', chance: 1.0 },
            { item: 'iron_ore', chance: 1.0 },
            { item: 'skeleton_skull', chance: 1.0 },
            { item: 'adept_cursed_staff', chance: 0.35 },
            { item: 'iron_plate', chance: 0.35 }
        ]
    },

    // --- ZONE 4: THE BRIMSTONE ABYSS (Lv 36 - 48) ---
    ogre: { 
        name: 'Abyssal Ogre', 
        zone: 'abyss', 
        level: 38, 
        hp: 780, 
        dmg: 48, 
        speed: 1.2, 
        xp: 580, 
        gold: [240, 440], 
        color: 0x3f2e18, 
        drops: [{ item: 'ogre_bone', chance: 0.8 }, { item: 'titanium_ore', chance: 0.45 }, { item: 'battle_hammer', chance: 0.07 }] 
    },
    demon: { 
        name: 'Infernal Demon', 
        zone: 'abyss', 
        level: 43, 
        hp: 720, 
        dmg: 56, 
        speed: 1.8, 
        xp: 720, 
        gold: [310, 560], 
        color: 0xb91c1c, 
        drops: [{ item: 'demon_horn', chance: 0.8 }, { item: 'cedar_wood', chance: 0.45 }, { item: 'flame_dagger', chance: 0.07 }] 
    },
    hellhound: { 
        name: 'Cerberus Hellhound', 
        zone: 'abyss', 
        level: 46, 
        hp: 860, 
        dmg: 62, 
        speed: 2.3, 
        xp: 850, 
        gold: [380, 680], 
        color: 0x7f1d1d, 
        drops: [{ item: 'demon_horn', chance: 0.9 }, { item: 'demon_carapace', chance: 0.07 }, { item: 'expert_stalker_leather', chance: 0.07 }] 
    },
    infernal_warlord: { 
        name: 'Gorgaroth the Warlord', 
        zone: 'abyss', 
        level: 48, 
        hp: 4400, 
        dmg: 66, 
        speed: 1.6, 
        isMiniBoss: true,
        xp: 4200, 
        gold: [1800, 3200], 
        color: 0x450a0a, 
        drops: [
            { item: 'cedar_wood', chance: 1.0 },
            { item: 'titanium_ore', chance: 1.0 },
            { item: 'demon_horn', chance: 1.0 },
            { item: 'demon_carapace', chance: 0.35 },
            { item: 'battle_hammer', chance: 0.35 }
        ] 
    },

    // --- ZONE 5: THE OBSIDIAN THRONE (BOSS ZONE - Lv 50+) ---
    boss_dragon: { 
        name: 'Ignisrax the Abyssal Dragon Lord', 
        zone: 'boss_sanctum', 
        level: 60, 
        hp: 7500, 
        dmg: 88, 
        speed: 1.4, 
        isBoss: true, 
        xp: 9500, 
        gold: [4500, 9500], 
        color: 0xff0033, 
        drops: [
            { item: 'bloodoak_wood', chance: 1.0 },
            { item: 'runite_ore', chance: 1.0 },
            { item: 'dragon_scale', chance: 1.0 },
            { item: 'abyssal_core', chance: 0.95 },
            { item: 'master_relic_blade', chance: 0.28 },
            { item: 'master_judicator_plate', chance: 0.28 },
            { item: 'master_archmage_staff', chance: 0.28 },
            { item: 'master_bow_of_shadows', chance: 0.28 }
        ] 
    },

    // --- ZONE 6: THE ASTRAL DOMINION (WORLD-CLASS ZONE - Lv 65+) ---
    astral_sentinel: {
        name: 'Astral Sentinel',
        zone: 'celestial_expanse',
        level: 65,
        hp: 1350,
        dmg: 74,
        speed: 1.9,
        xp: 1300,
        gold: [600, 1100],
        color: 0x818cf8,
        drops: [
            { item: 'astral_wood', chance: 0.6 },
            { item: 'starfall_crystal', chance: 0.6 },
            { item: 'void_shard', chance: 0.15 }
        ]
    },
    void_reaver: {
        name: 'Void Reaver',
        zone: 'celestial_expanse',
        level: 68,
        hp: 1750,
        dmg: 82,
        speed: 2.2,
        xp: 1650,
        gold: [750, 1350],
        color: 0x4338ca,
        drops: [
            { item: 'astral_wood', chance: 0.7 },
            { item: 'starfall_crystal', chance: 0.7 },
            { item: 'void_shard', chance: 0.2 }
        ]
    },
    astral_archon: {
        name: 'Archon Vaelor the Sun-Eater',
        zone: 'celestial_expanse',
        level: 70,
        hp: 6800,
        dmg: 95,
        speed: 1.7,
        isMiniBoss: true,
        xp: 6500,
        gold: [3200, 6000],
        color: 0x6366f1,
        drops: [
            { item: 'astral_wood', chance: 1.0 },
            { item: 'starfall_crystal', chance: 1.0 },
            { item: 'void_shard', chance: 0.75 },
            { item: 'celestial_greatsword', chance: 0.2 },
            { item: 'celestial_bow', chance: 0.2 }
        ]
    },
    void_emperor: {
        name: 'Astraeus the Void Emperor',
        zone: 'celestial_expanse',
        level: 75,
        hp: 16000,
        dmg: 120,
        speed: 1.5,
        isBoss: true,
        isWorldClassBoss: true,
        xp: 18000,
        gold: [12000, 25000],
        color: 0xa855f7,
        drops: [
            { item: 'void_shard', chance: 1.0 },
            { item: 'astral_wood', chance: 1.0 },
            { item: 'starfall_crystal', chance: 1.0 },
            { item: 'celestial_greatsword', chance: 0.35 },
            { item: 'celestial_staff', chance: 0.35 },
            { item: 'celestial_carapace', chance: 0.35 },
            { item: 'celestial_bow', chance: 0.35 }
        ]
    }
};

const RESOURCE_TYPES = {
    tree: { toolReq: 'tree', respawn: 10000 },
    rock: { toolReq: 'rock', respawn: 15000 }
};

function xpForLevel(level) { 
    return Math.floor(100 * Math.pow(1.35, level - 1)); 
}

module.exports = { ITEMS, ZONES, MONSTER_TYPES, RESOURCE_TYPES, getZoneAt, xpForLevel };

