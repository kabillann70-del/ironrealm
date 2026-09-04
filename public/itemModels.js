/**
 * IronRealm 3D Item Models & Visual Registry
 * 
 * Connects the game item catalog to procedural Three.js 3D models,
 * provides in-game world loot rendering with hover/spin animations,
 * and generates high-resolution 3D isometric thumbnails for the slotbar,
 * inventory, equipment, and village blacksmith forge.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(typeof THREE !== 'undefined' ? THREE : null);
  } else {
    root.Item3D = factory(root.THREE);
  }
}(typeof self !== 'undefined' ? self : this, function(THREE) {

  // Catalog linking item IDs to 3D model builders and aesthetic metadata
  const ITEM_REGISTRY = {
    // --- MATERIALS ---
    raw_wood: {
      id: 'raw_wood',
      name: 'Raw Wood',
      type: 'material',
      rarity: 'common',
      accentColor: 0xa16207,
      desc: 'Sturdy timber logs chopped from ancient forest trees.',
      buildMesh: function(T) {
        const group = new T.Group();
        const barkMat = new T.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
        const coreMat = new T.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
        const ropeMat = new T.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

        function makeLog(radius, len) {
          const log = new T.Group();
          const bark = new T.Mesh(new T.CylinderGeometry(radius, radius, len, 8), barkMat);
          bark.castShadow = true;
          log.add(bark);
          // End rings
          const cap1 = new T.Mesh(new T.CircleGeometry(radius * 0.95, 8), coreMat);
          cap1.rotation.x = -Math.PI / 2;
          cap1.position.y = len / 2 + 0.005;
          log.add(cap1);
          const cap2 = new T.Mesh(new T.CircleGeometry(radius * 0.95, 8), coreMat);
          cap2.rotation.x = Math.PI / 2;
          cap2.position.y = -len / 2 - 0.005;
          log.add(cap2);
          return log;
        }

        // Pyramid stack of 3 logs
        const l1 = makeLog(0.16, 0.95);
        l1.rotation.z = Math.PI / 2;
        l1.position.set(0, 0.16, -0.16);
        group.add(l1);

        const l2 = makeLog(0.16, 0.95);
        l2.rotation.z = Math.PI / 2;
        l2.position.set(0, 0.16, 0.16);
        group.add(l2);

        const l3 = makeLog(0.15, 0.9);
        l3.rotation.z = Math.PI / 2;
        l3.position.set(0, 0.42, 0);
        group.add(l3);

        // Rope binding
        const rope = new T.Mesh(new T.TorusGeometry(0.32, 0.03, 6, 12), ropeMat);
        rope.rotation.y = Math.PI / 2;
        rope.position.set(0, 0.26, 0);
        group.add(rope);

        group.scale.set(1.1, 1.1, 1.1);
        return group;
      }
    },

    raw_ore: {
      id: 'raw_ore',
      name: 'Iron Ore',
      type: 'material',
      rarity: 'common',
      accentColor: 0x94a3b8,
      desc: 'Dense chunk of raw ironstone sparkling with metallic veins.',
      buildMesh: function(T) {
        const group = new T.Group();
        // Rocky base
        const rockMat = new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.3 });
        const rock = new T.Mesh(new T.DodecahedronGeometry(0.48, 1), rockMat);
        rock.scale.set(1.2, 0.9, 1.1);
        rock.position.y = 0.35;
        rock.castShadow = true;
        group.add(rock);

        // Glowing metallic crystal spikes
        const crystalMat = new T.MeshStandardMaterial({
          color: 0xe2e8f0,
          emissive: 0x64748b,
          emissiveIntensity: 0.35,
          metalness: 0.95,
          roughness: 0.15
        });

        const spikeOffsets = [
          { x: 0.22, y: 0.65, z: 0.15, rx: 0.2, rz: -0.3, s: 0.35 },
          { x: -0.25, y: 0.6, z: -0.1, rx: -0.3, rz: 0.4, s: 0.4 },
          { x: 0.05, y: 0.72, z: -0.22, rx: -0.2, rz: -0.1, s: 0.45 },
          { x: -0.15, y: 0.5, z: 0.3, rx: 0.4, rz: 0.2, s: 0.3 },
          { x: 0.35, y: 0.45, z: -0.15, rx: 0.1, rz: -0.6, s: 0.32 }
        ];

        spikeOffsets.forEach(sp => {
          const crystal = new T.Mesh(new T.ConeGeometry(0.12, sp.s, 5), crystalMat);
          crystal.position.set(sp.x, sp.y, sp.z);
          crystal.rotation.x = sp.rx;
          crystal.rotation.z = sp.rz;
          crystal.castShadow = true;
          group.add(crystal);
        });

        group.scale.set(1.2, 1.2, 1.2);
        return group;
      }
    },

    ogre_bone: {
      id: 'ogre_bone',
      name: 'Ogre Bone',
      type: 'material',
      rarity: 'uncommon',
      accentColor: 0xfef08a,
      desc: 'Heavy prehistoric femur bone from a woodland ogre.',
      buildMesh: function(T) {
        const group = new T.Group();
        const boneMat = new T.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65, metalness: 0.1 });
        const notchMat = new T.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 });

        // Shaft
        const shaft = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1.0, 8), boneMat);
        shaft.position.y = 0.5;
        shaft.castShadow = true;
        group.add(shaft);

        // Top condyles
        const t1 = new T.Mesh(new T.SphereGeometry(0.15, 8, 8), boneMat);
        t1.position.set(-0.1, 1.0, 0);
        group.add(t1);
        const t2 = new T.Mesh(new T.SphereGeometry(0.15, 8, 8), boneMat);
        t2.position.set(0.1, 1.0, 0);
        group.add(t2);

        // Bottom condyles
        const b1 = new T.Mesh(new T.SphereGeometry(0.14, 8, 8), boneMat);
        b1.position.set(-0.09, 0.02, 0);
        group.add(b1);
        const b2 = new T.Mesh(new T.SphereGeometry(0.14, 8, 8), boneMat);
        b2.position.set(0.09, 0.02, 0);
        group.add(b2);

        // Tribal carving band
        const band = new T.Mesh(new T.CylinderGeometry(0.105, 0.105, 0.18, 8), notchMat);
        band.position.y = 0.52;
        group.add(band);

        group.rotation.z = 0.35;
        group.scale.set(1.1, 1.1, 1.1);
        return group;
      }
    },

    demon_horn: {
      id: 'demon_horn',
      name: 'Demon Horn',
      type: 'material',
      rarity: 'rare',
      accentColor: 0xef4444,
      desc: 'Twisted obsidian horn pulsing with searing underworld heat.',
      buildMesh: function(T) {
        const group = new T.Group();
        const hornMat = new T.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.35,
          metalness: 0.6
        });
        const lavaMat = new T.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 0.8,
          roughness: 0.2
        });

        // Curved segmented horn sections
        const segs = [
          { rB: 0.24, rT: 0.20, h: 0.32, y: 0.16, rz: 0.08, rx: 0.05 },
          { rB: 0.20, rT: 0.16, h: 0.32, y: 0.44, rz: 0.22, rx: 0.12 },
          { rB: 0.16, rT: 0.11, h: 0.32, y: 0.72, rz: 0.42, rx: 0.22 },
          { rB: 0.11, rT: 0.02, h: 0.35, y: 0.98, rz: 0.70, rx: 0.35 }
        ];

        segs.forEach(s => {
          const m = new T.Mesh(new T.CylinderGeometry(s.rT, s.rB, s.h, 7), hornMat);
          m.position.set(-s.rz * 0.35, s.y, s.rx * 0.25);
          m.rotation.z = s.rz;
          m.rotation.x = s.rx;
          m.castShadow = true;
          group.add(m);
        });

        // Glowing infernal lava ridges
        const ring1 = new T.Mesh(new T.TorusGeometry(0.21, 0.03, 6, 12), lavaMat);
        ring1.position.y = 0.28;
        ring1.rotation.x = Math.PI / 2 + 0.1;
        group.add(ring1);

        const ring2 = new T.Mesh(new T.TorusGeometry(0.16, 0.025, 6, 12), lavaMat);
        ring2.position.set(-0.1, 0.58, 0.08);
        ring2.rotation.x = Math.PI / 2 + 0.2;
        ring2.rotation.z = 0.25;
        group.add(ring2);

        // Core fiery ember tip
        const ember = new T.Mesh(new T.SphereGeometry(0.05, 6, 6), lavaMat);
        ember.position.set(-0.35, 1.15, 0.32);
        group.add(ember);

        group.scale.set(1.1, 1.1, 1.1);
        return group;
      }
    },

    spider_silk: {
      id: 'spider_silk',
      name: 'Frost Silk',
      type: 'material',
      rarity: 'uncommon',
      accentColor: 0x38bdf8,
      desc: 'Gleaming spool of spun silk coated in subzero frost crystals.',
      buildMesh: function(T) {
        const group = new T.Group();
        const coreMat = new T.MeshStandardMaterial({
          color: 0x0284c7,
          emissive: 0x0369a1,
          emissiveIntensity: 0.45,
          roughness: 0.25,
          metalness: 0.4
        });
        const silkMat = new T.MeshStandardMaterial({
          color: 0xe0f2fe,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.6,
          roughness: 0.2,
          transparent: true,
          opacity: 0.9
        });

        // Spindle core
        const core = new T.Mesh(new T.OctahedronGeometry(0.42, 1), coreMat);
        core.position.y = 0.45;
        core.scale.set(0.9, 1.3, 0.9);
        core.castShadow = true;
        group.add(core);

        // Crystalline cross filament rings
        for (let i = 0; i < 4; i++) {
          const ring = new T.Mesh(new T.TorusGeometry(0.38, 0.035, 6, 16), silkMat);
          ring.position.y = 0.45;
          ring.rotation.x = (i * Math.PI) / 4;
          ring.rotation.y = (i * Math.PI) / 6;
          group.add(ring);
        }

        // Floating frost shards
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          const shard = new T.Mesh(new T.ConeGeometry(0.08, 0.35, 4), silkMat);
          shard.position.set(Math.cos(angle) * 0.45, 0.45 + (i - 1) * 0.15, Math.sin(angle) * 0.45);
          shard.rotation.z = Math.cos(angle) * 0.5;
          group.add(shard);
        }

        group.scale.set(1.2, 1.2, 1.2);
        return group;
      }
    },

    skeleton_skull: {
      id: 'skeleton_skull',
      name: 'Ancient Skull',
      type: 'material',
      rarity: 'rare',
      accentColor: 0x10b981,
      desc: 'Cursed skeleton skull with emerald flame burning in its eye sockets.',
      buildMesh: function(T) {
        const group = new T.Group();
        const boneMat = new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.75, metalness: 0.1 });
        const darkMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        const eyeMat = new T.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.9,
          roughness: 0.1
        });

        // Cranium dome
        const cranium = new T.Mesh(new T.BoxGeometry(0.65, 0.55, 0.65), boneMat);
        cranium.position.set(0, 0.62, 0);
        cranium.castShadow = true;
        group.add(cranium);

        // Jaw / cheekbones
        const jaw = new T.Mesh(new T.BoxGeometry(0.48, 0.3, 0.45), boneMat);
        jaw.position.set(0, 0.25, 0.1);
        jaw.castShadow = true;
        group.add(jaw);

        // Eye Sockets
        const sL = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.08), darkMat);
        sL.position.set(-0.18, 0.56, 0.32);
        group.add(sL);
        const sR = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.08), darkMat);
        sR.position.set(0.18, 0.56, 0.32);
        group.add(sR);

        // Glowing Emerald Soul Embers in Eyes
        const eL = new T.Mesh(new T.SphereGeometry(0.06, 6, 6), eyeMat);
        eL.position.set(-0.18, 0.56, 0.34);
        group.add(eL);
        const eR = new T.Mesh(new T.SphereGeometry(0.06, 6, 6), eyeMat);
        eR.position.set(0.18, 0.56, 0.34);
        group.add(eR);

        // Nasal cavity
        const nose = new T.Mesh(new T.ConeGeometry(0.06, 0.12, 3), darkMat);
        nose.rotation.x = Math.PI;
        nose.position.set(0, 0.42, 0.33);
        group.add(nose);

        // Teeth row
        const teeth = new T.Mesh(new T.BoxGeometry(0.32, 0.08, 0.06), boneMat);
        teeth.position.set(0, 0.28, 0.33);
        group.add(teeth);

        group.scale.set(1.15, 1.15, 1.15);
        return group;
      }
    },

    // --- WEAPONS ---
    wood_sword: {
      id: 'wood_sword',
      name: 'Wood Sword',
      type: 'weapon',
      rarity: 'common',
      accentColor: 0xd97706,
      desc: 'Hand-carved wooden blade crafted for novice adventurers.',
      buildMesh: function(T) {
        const group = new T.Group();
        const bladeMat = new T.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 });
        const hiltMat = new T.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });

        // Blade with beveled edge
        const blade = new T.Mesh(new T.BoxGeometry(0.18, 1.35, 0.06), bladeMat);
        blade.position.y = 0.72;
        blade.castShadow = true;
        group.add(blade);

        // Pointed blade tip
        const tip = new T.Mesh(new T.ConeGeometry(0.128, 0.28, 4), bladeMat);
        tip.rotation.y = Math.PI / 4;
        tip.position.y = 1.52;
        tip.castShadow = true;
        group.add(tip);

        // Crossguard
        const guard = new T.Mesh(new T.BoxGeometry(0.42, 0.08, 0.12), hiltMat);
        guard.position.y = 0.06;
        guard.castShadow = true;
        group.add(guard);

        // Handle grip
        const grip = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.36, 8), hiltMat);
        grip.position.y = -0.16;
        group.add(grip);

        // Pommel
        const pommel = new T.Mesh(new T.SphereGeometry(0.08, 8, 8), hiltMat);
        pommel.position.y = -0.38;
        group.add(pommel);

        return group;
      }
    },

    novice_axe: {
      id: 'novice_axe',
      name: 'Novice Axe',
      type: 'weapon',
      rarity: 'common',
      accentColor: 0x94a3b8,
      desc: 'Stout woodsman axe capable of harvesting lumber and cleaving beasts.',
      buildMesh: function(T) {
        const group = new T.Group();
        const shaftMat = new T.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
        const headMat = new T.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.25 });
        const edgeMat = new T.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });

        // Shaft
        const shaft = new T.Mesh(new T.CylinderGeometry(0.045, 0.05, 1.35, 8), shaftMat);
        shaft.position.y = 0.55;
        shaft.castShadow = true;
        group.add(shaft);

        // Axe Head Block
        const head = new T.Mesh(new T.BoxGeometry(0.35, 0.38, 0.14), headMat);
        head.position.set(0.12, 1.05, 0);
        head.castShadow = true;
        group.add(head);

        // Curved cutting edge blade
        const edge = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.06, 8, 1, false, 0, Math.PI), edgeMat);
        edge.rotation.z = -Math.PI / 2;
        edge.rotation.x = Math.PI / 2;
        edge.position.set(0.35, 1.05, 0);
        edge.castShadow = true;
        group.add(edge);

        // Hammer back poll
        const poll = new T.Mesh(new T.BoxGeometry(0.16, 0.22, 0.15), headMat);
        poll.position.set(-0.16, 1.05, 0);
        group.add(poll);

        return group;
      }
    },

    steel_broadsword: {
      id: 'steel_broadsword',
      name: 'Steel Broadsword',
      type: 'weapon',
      rarity: 'rare',
      accentColor: 0x38bdf8,
      desc: 'Forged high-carbon steel broadsword etched with glowing runic power.',
      buildMesh: function(T) {
        const group = new T.Group();
        const bladeMat = new T.MeshStandardMaterial({
          color: 0xf8fafc,
          metalness: 0.95,
          roughness: 0.12
        });
        const runeMat = new T.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.85,
          roughness: 0.1
        });
        const goldMat = new T.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.9,
          roughness: 0.2
        });
        const gripMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

        // Main Blade
        const blade = new T.Mesh(new T.BoxGeometry(0.24, 1.6, 0.055), bladeMat);
        blade.position.y = 0.88;
        blade.castShadow = true;
        group.add(blade);

        // Runic fuller groove
        const rune = new T.Mesh(new T.BoxGeometry(0.06, 1.25, 0.065), runeMat);
        rune.position.y = 0.84;
        group.add(rune);

        // Pointed Tip
        const tip = new T.Mesh(new T.ConeGeometry(0.17, 0.35, 4), bladeMat);
        tip.rotation.y = Math.PI / 4;
        tip.position.y = 1.84;
        tip.castShadow = true;
        group.add(tip);

        // Winged Golden Crossguard
        const guard = new T.Mesh(new T.BoxGeometry(0.56, 0.1, 0.16), goldMat);
        guard.position.y = 0.07;
        guard.castShadow = true;
        group.add(guard);

        // Handle Grip
        const grip = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.42, 8), gripMat);
        grip.position.y = -0.18;
        group.add(grip);

        // Golden Gem Pommel
        const pommel = new T.Mesh(new T.OctahedronGeometry(0.11), goldMat);
        pommel.position.y = -0.42;
        group.add(pommel);

        const gem = new T.Mesh(new T.SphereGeometry(0.05, 6, 6), runeMat);
        gem.position.y = -0.42;
        group.add(gem);

        return group;
      }
    },

    flame_dagger: {
      id: 'flame_dagger',
      name: 'Flame Dagger',
      type: 'weapon',
      rarity: 'rare',
      accentColor: 0xef4444,
      desc: 'Obsidian stiletto radiating volcanic heat and piercing serrations.',
      buildMesh: function(T) {
        const group = new T.Group();
        const obsMat = new T.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.7 });
        const flameMat = new T.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xf97316,
          emissiveIntensity: 0.95,
          roughness: 0.2
        });
        const rubyMat = new T.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0xef4444, emissiveIntensity: 0.5 });

        // Blade
        const blade = new T.Mesh(new T.BoxGeometry(0.12, 0.9, 0.04), obsMat);
        blade.position.y = 0.48;
        blade.castShadow = true;
        group.add(blade);

        // Molten Flame Edge
        const flameEdge = new T.Mesh(new T.BoxGeometry(0.05, 0.85, 0.05), flameMat);
        flameEdge.position.set(0.05, 0.48, 0);
        group.add(flameEdge);

        // Piercing Tip
        const tip = new T.Mesh(new T.ConeGeometry(0.085, 0.24, 4), flameMat);
        tip.rotation.y = Math.PI / 4;
        tip.position.y = 1.02;
        tip.castShadow = true;
        group.add(tip);

        // Curved Red Guard
        const guard = new T.Mesh(new T.BoxGeometry(0.34, 0.08, 0.1), rubyMat);
        guard.position.y = 0.04;
        group.add(guard);

        // Grip
        const grip = new T.Mesh(new T.CylinderGeometry(0.038, 0.038, 0.28, 8), obsMat);
        grip.position.y = -0.12;
        group.add(grip);

        // Ruby Pommel
        const pommel = new T.Mesh(new T.OctahedronGeometry(0.08), rubyMat);
        pommel.position.y = -0.28;
        group.add(pommel);

        group.scale.set(1.15, 1.15, 1.15);
        return group;
      }
    },

    battle_hammer: {
      id: 'battle_hammer',
      name: 'War Hammer',
      type: 'weapon',
      rarity: 'epic',
      accentColor: 0x64748b,
      desc: 'Crushing dwarven war hammer designed to shatter heavy armor plates.',
      buildMesh: function(T) {
        const group = new T.Group();
        const ironMat = new T.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.22 });
        const goldTrim = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
        const handleMat = new T.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });

        // Shaft
        const shaft = new T.Mesh(new T.CylinderGeometry(0.05, 0.055, 1.5, 8), handleMat);
        shaft.position.y = 0.6;
        shaft.castShadow = true;
        group.add(shaft);

        // Heavy Head Block
        const head = new T.Mesh(new T.BoxGeometry(0.55, 0.48, 0.65), ironMat);
        head.position.set(0, 1.15, 0);
        head.castShadow = true;
        group.add(head);

        // Gold head bands
        const band1 = new T.Mesh(new T.BoxGeometry(0.57, 0.08, 0.67), goldTrim);
        band1.position.set(0, 1.15, 0);
        group.add(band1);

        // Rear Armor-Piercing Spike
        const spike = new T.Mesh(new T.ConeGeometry(0.14, 0.45, 4), ironMat);
        spike.rotation.x = Math.PI / 2;
        spike.position.set(0, 1.15, -0.5);
        spike.castShadow = true;
        group.add(spike);

        // Top Crown Spike
        const topSpike = new T.Mesh(new T.ConeGeometry(0.1, 0.3, 4), goldTrim);
        topSpike.position.set(0, 1.5, 0);
        group.add(topSpike);

        return group;
      }
    },

    crystal_spear: {
      id: 'crystal_spear',
      name: 'Frost Pike',
      type: 'weapon',
      rarity: 'epic',
      accentColor: 0x38bdf8,
      desc: 'Glacial polearm tipping a diamond-honed spearhead of absolute zero ice.',
      buildMesh: function(T) {
        const group = new T.Group();
        const shaftMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
        const iceMat = new T.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.9,
          metalness: 0.7,
          roughness: 0.12
        });
        const silverMat = new T.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });

        // Long Shaft
        const shaft = new T.Mesh(new T.CylinderGeometry(0.04, 0.045, 2.0, 8), shaftMat);
        shaft.position.y = 0.8;
        shaft.castShadow = true;
        group.add(shaft);

        // Silver Socket Collar
        const collar = new T.Mesh(new T.CylinderGeometry(0.07, 0.05, 0.25, 8), silverMat);
        collar.position.y = 1.7;
        group.add(collar);

        // Faceted Crystal Spearhead
        const spearhead = new T.Mesh(new T.ConeGeometry(0.18, 0.75, 4), iceMat);
        spearhead.position.y = 2.15;
        spearhead.rotation.y = Math.PI / 4;
        spearhead.castShadow = true;
        group.add(spearhead);

        // Twin Side Barbs
        for (let side of [-1, 1]) {
          const barb = new T.Mesh(new T.ConeGeometry(0.08, 0.35, 4), iceMat);
          barb.position.set(side * 0.15, 1.82, 0);
          barb.rotation.z = -side * 0.65;
          group.add(barb);
        }

        group.scale.set(0.9, 0.9, 0.9);
        return group;
      }
    },

    // --- ARMORS ---
    leather_armor: {
      id: 'leather_armor',
      name: 'Leather Tunic',
      type: 'armor',
      rarity: 'common',
      accentColor: 0xd97706,
      desc: 'Tough boiled leather cuirass fitted with bronze rivets and shoulder guards.',
      buildMesh: function(T) {
        const group = new T.Group();
        const leatherMat = new T.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
        const darkLeatherMat = new T.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        const brassMat = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.25 });

        // Torso Cuirass
        const torso = new T.Mesh(new T.BoxGeometry(0.85, 1.05, 0.55), leatherMat);
        torso.position.y = 0.65;
        torso.castShadow = true;
        group.add(torso);

        // Studded Bronze Rivets
        const rivetOffsets = [
          [-0.26, 0.85, 0.29], [0.26, 0.85, 0.29],
          [-0.26, 0.65, 0.29], [0.26, 0.65, 0.29],
          [-0.14, 0.75, 0.29], [0.14, 0.75, 0.29],
          [-0.26, 0.45, 0.29], [0.26, 0.45, 0.29]
        ];
        rivetOffsets.forEach(pos => {
          const rivet = new T.Mesh(new T.SphereGeometry(0.035, 6, 6), brassMat);
          rivet.position.set(pos[0], pos[1], pos[2]);
          group.add(rivet);
        });

        // Shoulder Straps / Pads
        const pL = new T.Mesh(new T.BoxGeometry(0.32, 0.18, 0.58), darkLeatherMat);
        pL.position.set(-0.52, 1.05, 0);
        group.add(pL);

        const pR = new T.Mesh(new T.BoxGeometry(0.32, 0.18, 0.58), darkLeatherMat);
        pR.position.set(0.52, 1.05, 0);
        group.add(pR);

        // Waist Belt
        const belt = new T.Mesh(new T.BoxGeometry(0.9, 0.16, 0.58), darkLeatherMat);
        belt.position.set(0, 0.25, 0);
        group.add(belt);

        const buckle = new T.Mesh(new T.BoxGeometry(0.18, 0.2, 0.62), brassMat);
        buckle.position.set(0, 0.25, 0);
        group.add(buckle);

        return group;
      }
    },

    iron_plate: {
      id: 'iron_plate',
      name: 'Iron Plate Mail',
      type: 'armor',
      rarity: 'rare',
      accentColor: 0x94a3b8,
      desc: 'Heavy tempered knight cuirass with mirror-polished steel and gold crest.',
      buildMesh: function(T) {
        const group = new T.Group();
        const plateMat = new T.MeshStandardMaterial({
          color: 0xcbd5e1,
          metalness: 0.96,
          roughness: 0.16
        });
        const goldTrim = new T.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.9,
          roughness: 0.25
        });

        // Breastplate
        const torso = new T.Mesh(new T.BoxGeometry(0.9, 1.15, 0.6), plateMat);
        torso.position.y = 0.7;
        torso.castShadow = true;
        group.add(torso);

        // Raised Central Crest Ridge
        const crest = new T.Mesh(new T.BoxGeometry(0.12, 0.85, 0.08), goldTrim);
        crest.position.set(0, 0.78, 0.32);
        group.add(crest);

        // Armored Neck Gorget
        const gorget = new T.Mesh(new T.CylinderGeometry(0.35, 0.42, 0.16, 8, 1, false, 0, Math.PI), goldTrim);
        gorget.rotation.x = Math.PI;
        gorget.position.set(0, 1.25, 0.18);
        group.add(gorget);

        // Flanged Pauldrons
        const pL = new T.Mesh(new T.BoxGeometry(0.36, 0.28, 0.66), plateMat);
        pL.position.set(-0.56, 1.12, 0);
        pL.rotation.z = -0.15;
        group.add(pL);

        const pR = new T.Mesh(new T.BoxGeometry(0.36, 0.28, 0.66), plateMat);
        pR.position.set(0.56, 1.12, 0);
        pR.rotation.z = 0.15;
        group.add(pR);

        return group;
      }
    },

    demon_carapace: {
      id: 'demon_carapace',
      name: 'Demon Carapace',
      type: 'armor',
      rarity: 'epic',
      accentColor: 0xef4444,
      desc: 'Forged from abyssal obsidian and demon bones, radiating brimstone magma.',
      buildMesh: function(T) {
        const group = new T.Group();
        const obsMat = new T.MeshStandardMaterial({
          color: 0x18181b,
          metalness: 0.8,
          roughness: 0.3
        });
        const magmaMat = new T.MeshStandardMaterial({
          color: 0xdc2626,
          emissive: 0xef4444,
          emissiveIntensity: 0.8,
          roughness: 0.2
        });

        // Obsidian Breastplate
        const torso = new T.Mesh(new T.BoxGeometry(0.95, 1.2, 0.65), obsMat);
        torso.position.y = 0.75;
        torso.castShadow = true;
        group.add(torso);

        // Molten Chest Core
        const core = new T.Mesh(new T.OctahedronGeometry(0.22), magmaMat);
        core.position.set(0, 0.82, 0.35);
        group.add(core);

        // Magma Vein Ribs
        for (let i = -1; i <= 1; i += 2) {
          const rib1 = new T.Mesh(new T.BoxGeometry(0.24, 0.06, 0.06), magmaMat);
          rib1.position.set(i * 0.22, 0.62, 0.34);
          rib1.rotation.z = i * 0.2;
          group.add(rib1);

          const rib2 = new T.Mesh(new T.BoxGeometry(0.2, 0.05, 0.06), magmaMat);
          rib2.position.set(i * 0.2, 0.46, 0.34);
          rib2.rotation.z = i * 0.2;
          group.add(rib2);
        }

        // Spiked Demon Shoulder Horns
        for (let side of [-1, 1]) {
          const pauldron = new T.Mesh(new T.BoxGeometry(0.38, 0.3, 0.7), obsMat);
          pauldron.position.set(side * 0.6, 1.2, 0);
          pauldron.rotation.z = side * 0.2;
          group.add(pauldron);

          const spike = new T.Mesh(new T.ConeGeometry(0.12, 0.65, 5), magmaMat);
          spike.position.set(side * 0.65, 1.5, -0.05);
          spike.rotation.z = -side * 0.45;
          spike.rotation.x = -0.2;
          group.add(spike);
        }

        return group;
      }
    }
  };

  const ALIASES = {
    sword: 'wood_sword',
    axe: 'novice_axe',
    broadsword: 'steel_broadsword',
    dagger: 'flame_dagger',
    hammer: 'battle_hammer',
    spear: 'crystal_spear',
    leather: 'leather_armor',
    iron: 'iron_plate',
    demon: 'demon_carapace'
  };

  function resolveItem(id) {
    if (!id) return null;
    const realId = ALIASES[id] || id;
    return ITEM_REGISTRY[realId] || null;
  }

  // Thumbnail Cache
  const thumbnailCache = {};
  let offscreenRenderer = null;
  let offscreenScene = null;
  let offscreenCamera = null;

  /**
   * Initializes offscreen 3D studio for rendering crisp isometric 3D item images.
   */
  function initOffscreenStudio(T) {
    if (offscreenRenderer || typeof document === 'undefined') return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 112;
      canvas.height = 112;
      offscreenRenderer = new T.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      });
      offscreenRenderer.setSize(112, 112);
      offscreenRenderer.setPixelRatio(1);
      if (T.sRGBEncoding) offscreenRenderer.outputEncoding = T.sRGBEncoding;

      offscreenScene = new T.Scene();
      offscreenCamera = new T.PerspectiveCamera(38, 1, 0.1, 50);

      // Studio 3-point lighting
      const ambLight = new T.AmbientLight(0xffffff, 0.95);
      offscreenScene.add(ambLight);

      const keyLight = new T.DirectionalLight(0xffffff, 1.35);
      keyLight.position.set(3, 4, 4);
      offscreenScene.add(keyLight);

      const fillLight = new T.DirectionalLight(0x93c5fd, 0.7);
      fillLight.position.set(-3, 1, 2);
      offscreenScene.add(fillLight);

      const rimLight = new T.DirectionalLight(0xfbbf24, 0.55);
      rimLight.position.set(0, -2, -3);
      offscreenScene.add(rimLight);
    } catch (e) {
      console.warn('Item3D offscreen renderer init fallback:', e);
    }
  }

  /**
   * Generates a 3D isometric rendered image (Data URL) for any item.
   */
  function generate3DThumbnail(itemId) {
    const reg = resolveItem(itemId);
    if (!reg) return null;
    const resolvedId = reg.id;
    if (thumbnailCache[resolvedId]) return thumbnailCache[resolvedId];
    if (!THREE || typeof document === 'undefined') return null;

    initOffscreenStudio(THREE);
    if (!offscreenRenderer) return null;

    if (!reg.buildMesh) return null;

    // Clear previous model from offscreen scene
    const toRemove = offscreenScene.children.filter(c => c.name === 'ITEM_PIVOT');
    toRemove.forEach(c => offscreenScene.remove(c));

    const model = reg.buildMesh(THREE);
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);

    const sizeVec = new THREE.Vector3();
    box.getSize(sizeVec);
    const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z, 0.6);

    const pivot = new THREE.Group();
    pivot.name = 'ITEM_PIVOT';
    pivot.add(model);

    // Apply ideal isometric tilt angle
    if (reg.type === 'weapon') {
      pivot.rotation.z = -Math.PI / 4; // 45 deg weapon angle
      pivot.rotation.y = Math.PI / 4;
      pivot.rotation.x = Math.PI / 10;
    } else if (reg.type === 'armor') {
      pivot.rotation.y = Math.PI / 6;
      pivot.rotation.x = Math.PI / 14;
    } else {
      pivot.rotation.y = Math.PI / 4;
      pivot.rotation.x = Math.PI / 6;
    }

    offscreenScene.add(pivot);

    const dist = maxDim * 2.15;
    offscreenCamera.position.set(0, 0, dist);
    offscreenCamera.lookAt(0, 0, 0);

    try {
      offscreenRenderer.render(offscreenScene, offscreenCamera);
      const dataUrl = offscreenRenderer.domElement.toDataURL('image/png');
      thumbnailCache[resolvedId] = dataUrl;
      return dataUrl;
    } catch (renderErr) {
      console.warn(`Render thumb error for ${resolvedId}:`, renderErr);
      return null;
    }
  }

  /**
   * Pre-renders 3D thumbnails smoothly in the background without blocking the UI or main thread.
   */
  function preloadAllThumbnails() {
    if (!THREE || typeof document === 'undefined') return;
    const keys = Object.keys(ITEM_REGISTRY);
    let idx = 0;
    function processNextBatch() {
      const start = Date.now();
      while (idx < keys.length && (Date.now() - start) < 8) {
        try {
          generate3DThumbnail(keys[idx]);
        } catch (e) {
          // ignore
        }
        idx++;
      }
      if (idx < keys.length) {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(processNextBatch);
        } else {
          setTimeout(processNextBatch, 50);
        }
      }
    }
    setTimeout(processNextBatch, 200);
  }

  /**
   * Retrieves the 3D rendered image data URL for an item.
   */
  function getThumbnail(itemId) {
    const reg = resolveItem(itemId);
    const resolvedId = reg ? reg.id : itemId;
    if (thumbnailCache[resolvedId]) return thumbnailCache[resolvedId];
    try {
      return generate3DThumbnail(resolvedId) || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Creates an interactive in-game world 3D mesh for dropped loot items.
   * Includes floating model, ground beacon light ring, and metadata for animation.
   */
  function createWorldLootMesh(itemId) {
    if (!THREE) return null;
    const group = new THREE.Group();
    const reg = resolveItem(itemId);

    // Inner 3D Item Model
    let itemModel;
    if (reg && reg.buildMesh) {
      itemModel = reg.buildMesh(THREE);
    } else {
      // Fallback golden pouch
      const pouchGeo = new THREE.DodecahedronGeometry(0.35);
      const pouchMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
      });
      itemModel = new THREE.Mesh(pouchGeo, pouchMat);
    }

    // Scale appropriately for ground visibility
    itemModel.scale.multiplyScalar(0.75);
    itemModel.position.y = 0.5;
    group.add(itemModel);
    group.userData.itemModel = itemModel;

    // Ground Ethereal Light Ring
    const accent = (reg && reg.accentColor) || 0xfbbf24;
    const ringGeo = new THREE.RingGeometry(0.35, 0.48, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: accent,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);
    group.userData.ring = ring;

    // Hover bobbing metadata
    group.userData.baseY = 0.5;
    group.userData.rotSpeed = 1.4;

    return group;
  }

  /**
   * Creates the 3D model for character equipment (weapons).
   */
  function createItemMesh(itemId) {
    if (!THREE) return null;
    const reg = resolveItem(itemId);
    if (reg && reg.buildMesh) {
      return reg.buildMesh(THREE);
    }
    return null;
  }

  // Public Interface
  return {
    registry: ITEM_REGISTRY,
    createWorldLootMesh,
    createItemMesh,
    generate3DThumbnail,
    getThumbnail,
    preloadAllThumbnails,
    init: function() {
      if (typeof window !== 'undefined' && window.THREE) {
        preloadAllThumbnails();
      }
    }
  };
}));
