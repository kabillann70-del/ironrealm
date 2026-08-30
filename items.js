const ITEMS = {
  raw_wood:      { name: 'Raw Wood',     type: 'material', rarity: 'common' },
  raw_ore:       { name: 'Iron Ore',     type: 'material', rarity: 'common' },
  ogre_bone:     { name: 'Ogre Bone',     type: 'material', rarity: 'uncommon' },
  
  novice_axe:    { name: 'Novice Axe',   type: 'tool',     toolType: 'tree', dmg: 2 },
  novice_pick:   { name: 'Novice Pick',  type: 'tool',     toolType: 'rock',  dmg: 2 },

  wood_sword:    { name: 'Wood Sword',      type: 'weapon',   rarity: 'common',    dmg: 5 },
  iron_sword:    { name: 'Iron Sword',      type: 'weapon',   rarity: 'uncommon',  dmg: 12 },
  steel_blade:   { name: 'Steel Blade',     type: 'weapon',   rarity: 'rare',      dmg: 20 },

  leather_armor: { name: 'Leather Armor',   type: 'armor',    rarity: 'common',    def: 4 },
  iron_armor:    { name: 'Iron Armor',      type: 'armor',    rarity: 'uncommon',  def: 10 },
  steel_plate:   { name: 'Steel Plate',     type: 'armor',    rarity: 'rare',      def: 18 }
};

const RECIPES = {
  steel_blade: { ingredients: { iron_sword: 1, ogre_bone: 2 }, gold: 50 },
  steel_plate: { ingredients: { iron_armor: 1, ogre_bone: 2 }, gold: 50 }
};

const MONSTER_TYPES = {
  wolf:   { hp: 30, dmg: 6, speed: 3.2, xp: 15, gold: [2, 6], color: 0x8899aa, dropTable: [{ item: 'wood_sword', chance: 0.1 }] },
  ogre:   { hp: 120, dmg: 18, speed: 1.6, xp: 60, gold: [10, 25], color: 0xaa5533, dropTable: [{ item: 'ogre_bone', chance: 0.3 }] }
};

const RESOURCE_TYPES = {
  tree: { item: 'raw_wood', toolReq: 'tree', respawn: 10000, color: 0x228B22 },
  rock: { item: 'raw_ore', toolReq: 'rock', respawn: 15000, color: 0x808080 }
};

function xpForLevel(level) { return level * 100; }
module.exports = { ITEMS, RECIPES, MONSTER_TYPES, RESOURCE_TYPES, xpForLevel };