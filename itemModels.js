/**
 * IronRealm 3D Item Models & Visual Registry
 * 
 * Inspired by Albion Online equipment tiers & aesthetics.
 * Procedural 3D models for all weapons (Mage Staves, Recurve Bows, Swords, Greatswords,
 * Battleaxes, War Hammers, Assassin Daggers, Frost Pikes) and armors (Cloth Robes,
 * Leather Jackets, Knight Plates, Demonic Carapaces) across T2 to T6.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(typeof THREE !== 'undefined' ? THREE : null);
  } else {
    root.Item3D = factory(root.THREE);
  }
}(typeof self !== 'undefined' ? self : this, function(THREE) {

  // -------------------------------------------------------------
  // HELPER 3D MODEL BUILDERS
  // -------------------------------------------------------------

  function createBowMesh(T, opt = {}) {
    const group = new T.Group();
    const limbMat = new T.MeshStandardMaterial({
      color: opt.limbColor || 0x78350f,
      roughness: opt.limbRoughness || 0.6,
      metalness: opt.limbMetalness || 0.2
    });
    const gripMat = new T.MeshStandardMaterial({
      color: opt.gripColor || 0x451a03,
      roughness: 0.8
    });
    const stringMat = new T.MeshBasicMaterial({
      color: opt.stringColor || 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    const tipMat = new T.MeshStandardMaterial({
      color: opt.tipColor || 0xd97706,
      metalness: 0.85,
      roughness: 0.25
    });

    // Central Riser Grip
    const riser = new T.Mesh(new T.BoxGeometry(0.09, 0.28, 0.08), gripMat);
    riser.position.y = 0;
    riser.castShadow = true;
    group.add(riser);

    // Upper Limb Segments (Curved Arch)
    const u1 = new T.Mesh(new T.CylinderGeometry(0.035, 0.04, 0.45, 8), limbMat);
    u1.position.set(0.06, 0.32, 0);
    u1.rotation.z = -0.25;
    group.add(u1);

    const u2 = new T.Mesh(new T.CylinderGeometry(0.025, 0.035, 0.45, 8), limbMat);
    u2.position.set(0.18, 0.68, 0);
    u2.rotation.z = -0.55;
    group.add(u2);

    const uTip = new T.Mesh(new T.ConeGeometry(0.045, 0.16, 5), tipMat);
    uTip.position.set(0.29, 0.92, 0);
    uTip.rotation.z = -1.1;
    group.add(uTip);

    // Lower Limb Segments
    const l1 = new T.Mesh(new T.CylinderGeometry(0.04, 0.035, 0.45, 8), limbMat);
    l1.position.set(0.06, -0.32, 0);
    l1.rotation.z = 0.25;
    group.add(l1);

    const l2 = new T.Mesh(new T.CylinderGeometry(0.035, 0.025, 0.45, 8), limbMat);
    l2.position.set(0.18, -0.68, 0);
    l2.rotation.z = 0.55;
    group.add(l2);

    const lTip = new T.Mesh(new T.ConeGeometry(0.045, 0.16, 5), tipMat);
    lTip.position.set(0.29, -0.92, 0);
    lTip.rotation.z = 1.1;
    group.add(lTip);

    // Taut Bowstring
    const stringGeo = new T.CylinderGeometry(0.008, 0.008, 1.85, 4);
    const bowstring = new T.Mesh(stringGeo, stringMat);
    bowstring.position.set(0.28, 0, 0);
    group.add(bowstring);

    // Optional Glowing Nocked Arrow
    if (opt.hasArrow) {
      const arrowMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
      const arrowShaft = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 1.2, 6), limbMat);
      arrowShaft.rotation.z = Math.PI / 2;
      arrowShaft.position.set(0.1, 0, 0);
      group.add(arrowShaft);

      const arrowHead = new T.Mesh(new T.ConeGeometry(0.05, 0.2, 4), arrowMat);
      arrowHead.rotation.z = -Math.PI / 2;
      arrowHead.position.set(-0.55, 0, 0);
      group.add(arrowHead);
    }

    // Optional Ethereal / Runic Gem Ornaments
    if (opt.gemColor) {
      const gemMat = new T.MeshStandardMaterial({
        color: opt.gemColor,
        emissive: opt.gemColor,
        emissiveIntensity: 0.9,
        roughness: 0.1
      });
      const gem = new T.Mesh(new T.OctahedronGeometry(0.07), gemMat);
      gem.position.set(-0.04, 0, 0);
      group.add(gem);
    }

    group.scale.set(1.1, 1.1, 1.1);
    return group;
  }

  function createStaffMesh(T, opt = {}) {
    const group = new T.Group();
    const shaftMat = new T.MeshStandardMaterial({
      color: opt.shaftColor || 0x451a03,
      roughness: 0.75,
      metalness: opt.shaftMetal || 0.1
    });
    const headMat = new T.MeshStandardMaterial({
      color: opt.headColor || 0xd97706,
      metalness: 0.88,
      roughness: 0.2
    });
    const orbMat = new T.MeshStandardMaterial({
      color: opt.orbColor || 0xef4444,
      emissive: opt.emissiveColor || 0xf97316,
      emissiveIntensity: opt.emissiveIntensity || 0.9,
      roughness: 0.1,
      metalness: 0.5
    });

    // Long Staff Shaft
    const shaft = new T.Mesh(new T.CylinderGeometry(0.04, 0.045, 1.9, 8), shaftMat);
    shaft.position.y = 0.8;
    shaft.castShadow = true;
    group.add(shaft);

    // Grip bands
    const grip1 = new T.Mesh(new T.CylinderGeometry(0.048, 0.048, 0.35, 8), headMat);
    grip1.position.y = 0.75;
    group.add(grip1);

    // Metallic Head Crown Bracket
    const socket = new T.Mesh(new T.CylinderGeometry(0.08, 0.05, 0.22, 8), headMat);
    socket.position.y = 1.75;
    group.add(socket);

    // Crown Prongs / Crest
    const prongs = opt.prongCount || 3;
    for (let i = 0; i < prongs; i++) {
      const angle = (i / prongs) * Math.PI * 2;
      const prong = new T.Mesh(new T.ConeGeometry(0.045, 0.35, 4), headMat);
      prong.position.set(Math.cos(angle) * 0.12, 1.95, Math.sin(angle) * 0.12);
      prong.rotation.x = Math.sin(angle) * 0.25;
      prong.rotation.z = -Math.cos(angle) * 0.25;
      group.add(prong);
    }

    // Glowing Spell Focus Orb / Gem
    const orb = new T.Mesh(new T.SphereGeometry(opt.orbRadius || 0.16, 12, 12), orbMat);
    orb.position.y = 1.95;
    group.add(orb);

    // Optional Orbiting Celestial Runic Rings
    if (opt.hasRings) {
      const ringMat = new T.MeshBasicMaterial({
        color: opt.emissiveColor || 0x38bdf8,
        transparent: true,
        opacity: 0.75
      });
      const r1 = new T.Mesh(new T.TorusGeometry(0.26, 0.02, 6, 16), ringMat);
      r1.position.y = 1.95;
      r1.rotation.x = Math.PI / 4;
      group.add(r1);

      const r2 = new T.Mesh(new T.TorusGeometry(0.24, 0.02, 6, 16), ringMat);
      r2.position.y = 1.95;
      r2.rotation.y = Math.PI / 3;
      group.add(r2);
    }

    group.scale.set(1.0, 1.0, 1.0);
    return group;
  }

  // -------------------------------------------------------------
  // ITEM REGISTRY (All items mapped to 3D procedural meshes)
  // -------------------------------------------------------------
  const ITEM_REGISTRY = {
    // --- MATERIALS ---
    raw_wood: {
      id: 'raw_wood',
      name: 'Raw Wood',
      type: 'material',
      tier: 1,
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

        const l1 = makeLog(0.16, 0.95); l1.rotation.z = Math.PI / 2; l1.position.set(0, 0.16, -0.16); group.add(l1);
        const l2 = makeLog(0.16, 0.95); l2.rotation.z = Math.PI / 2; l2.position.set(0, 0.16, 0.16); group.add(l2);
        const l3 = makeLog(0.15, 0.9); l3.rotation.z = Math.PI / 2; l3.position.set(0, 0.42, 0); group.add(l3);

        const rope = new T.Mesh(new T.TorusGeometry(0.32, 0.03, 6, 12), ropeMat);
        rope.rotation.y = Math.PI / 2; rope.position.set(0, 0.26, 0); group.add(rope);

        group.scale.set(1.1, 1.1, 1.1);
        return group;
      }
    },

    raw_ore: {
      id: 'raw_ore',
      name: 'Iron Ore',
      type: 'material',
      tier: 1,
      accentColor: 0x94a3b8,
      desc: 'Dense chunk of raw ironstone sparkling with metallic veins.',
      buildMesh: function(T) {
        const group = new T.Group();
        const rockMat = new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.3 });
        const rock = new T.Mesh(new T.DodecahedronGeometry(0.48, 1), rockMat);
        rock.scale.set(1.2, 0.9, 1.1);
        rock.position.y = 0.35;
        rock.castShadow = true;
        group.add(rock);

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
      tier: 3,
      accentColor: 0xfef08a,
      desc: 'Heavy prehistoric femur bone from a woodland ogre.',
      buildMesh: function(T) {
        const group = new T.Group();
        const boneMat = new T.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65, metalness: 0.1 });
        const notchMat = new T.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 });

        const shaft = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1.0, 8), boneMat);
        shaft.position.y = 0.5; shaft.castShadow = true; group.add(shaft);

        const t1 = new T.Mesh(new T.SphereGeometry(0.15, 8, 8), boneMat); t1.position.set(-0.1, 1.0, 0); group.add(t1);
        const t2 = new T.Mesh(new T.SphereGeometry(0.15, 8, 8), boneMat); t2.position.set(0.1, 1.0, 0); group.add(t2);
        const b1 = new T.Mesh(new T.SphereGeometry(0.14, 8, 8), boneMat); b1.position.set(-0.09, 0.02, 0); group.add(b1);
        const b2 = new T.Mesh(new T.SphereGeometry(0.14, 8, 8), boneMat); b2.position.set(0.09, 0.02, 0); group.add(b2);

        const band = new T.Mesh(new T.CylinderGeometry(0.105, 0.105, 0.18, 8), notchMat);
        band.position.y = 0.52; group.add(band);

        group.rotation.z = 0.35; group.scale.set(1.1, 1.1, 1.1);
        return group;
      }
    },

    spider_silk: {
      id: 'spider_silk',
      name: 'Frost Silk',
      type: 'material',
      tier: 3,
      accentColor: 0x38bdf8,
      desc: 'Gleaming spool of spun silk coated in subzero frost crystals.',
      buildMesh: function(T) {
        const group = new T.Group();
        const coreMat = new T.MeshStandardMaterial({
          color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.4
        });
        const silkMat = new T.MeshStandardMaterial({
          color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.6, roughness: 0.2, transparent: true, opacity: 0.9
        });

        const core = new T.Mesh(new T.OctahedronGeometry(0.42, 1), coreMat);
        core.position.y = 0.45; core.scale.set(0.9, 1.3, 0.9); core.castShadow = true; group.add(core);

        for (let i = 0; i < 4; i++) {
          const ring = new T.Mesh(new T.TorusGeometry(0.38, 0.035, 6, 16), silkMat);
          ring.position.y = 0.45; ring.rotation.x = (i * Math.PI) / 4; ring.rotation.y = (i * Math.PI) / 6;
          group.add(ring);
        }

        group.scale.set(1.2, 1.2, 1.2);
        return group;
      }
    },

    skeleton_skull: {
      id: 'skeleton_skull',
      name: 'Ancient Skull',
      type: 'material',
      tier: 4,
      accentColor: 0x10b981,
      desc: 'Cursed skeleton skull with emerald soul flame in its sockets.',
      buildMesh: function(T) {
        const group = new T.Group();
        const boneMat = new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.75, metalness: 0.1 });
        const darkMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        const eyeMat = new T.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.9 });

        const cranium = new T.Mesh(new T.BoxGeometry(0.65, 0.55, 0.65), boneMat);
        cranium.position.set(0, 0.62, 0); cranium.castShadow = true; group.add(cranium);

        const jaw = new T.Mesh(new T.BoxGeometry(0.48, 0.3, 0.45), boneMat);
        jaw.position.set(0, 0.25, 0.1); jaw.castShadow = true; group.add(jaw);

        const sL = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.08), darkMat); sL.position.set(-0.18, 0.56, 0.32); group.add(sL);
        const sR = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.08), darkMat); sR.position.set(0.18, 0.56, 0.32); group.add(sR);

        const eL = new T.Mesh(new T.SphereGeometry(0.06, 6, 6), eyeMat); eL.position.set(-0.18, 0.56, 0.34); group.add(eL);
        const eR = new T.Mesh(new T.SphereGeometry(0.06, 6, 6), eyeMat); eR.position.set(0.18, 0.56, 0.34); group.add(eR);

        group.scale.set(1.15, 1.15, 1.15);
        return group;
      }
    },

    demon_horn: {
      id: 'demon_horn',
      name: 'Demon Horn',
      type: 'material',
      tier: 5,
      accentColor: 0xef4444,
      desc: 'Twisted obsidian horn pulsing with searing underworld magma.',
      buildMesh: function(T) {
        const group = new T.Group();
        const hornMat = new T.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.6 });
        const lavaMat = new T.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.8 });

        const segs = [
          { rB: 0.24, rT: 0.20, h: 0.32, y: 0.16, rz: 0.08, rx: 0.05 },
          { rB: 0.20, rT: 0.16, h: 0.32, y: 0.44, rz: 0.22, rx: 0.12 },
          { rB: 0.16, rT: 0.11, h: 0.32, y: 0.72, rz: 0.42, rx: 0.22 },
          { rB: 0.11, rT: 0.02, h: 0.35, y: 0.98, rz: 0.70, rx: 0.35 }
        ];

        segs.forEach(s => {
          const m = new T.Mesh(new T.CylinderGeometry(s.rT, s.rB, s.h, 7), hornMat);
          m.position.set(-s.rz * 0.35, s.y, s.rx * 0.25);
          m.rotation.z = s.rz; m.rotation.x = s.rx; m.castShadow = true;
          group.add(m);
        });

        const ring1 = new T.Mesh(new T.TorusGeometry(0.21, 0.03, 6, 12), lavaMat);
        ring1.position.y = 0.28; ring1.rotation.x = Math.PI / 2 + 0.1; group.add(ring1);

        group.scale.set(1.1, 1.1, 1.1);
        return group;
      }
    },

    // =========================================================================
    // TIER 2 (NOVICE) WEAPONS & ARMORS
    // =========================================================================
    wood_sword: {
      id: 'wood_sword',
      name: 'Novice Broadsword',
      type: 'weapon',
      tier: 2,
      accentColor: 0xd97706,
      desc: 'T2 Novice broadsword carved for training adventurers.',
      buildMesh: function(T) {
        const group = new T.Group();
        const bladeMat = new T.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 });
        const hiltMat = new T.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });

        const blade = new T.Mesh(new T.BoxGeometry(0.18, 1.35, 0.06), bladeMat);
        blade.position.y = 0.72; blade.castShadow = true; group.add(blade);

        const tip = new T.Mesh(new T.ConeGeometry(0.128, 0.28, 4), bladeMat);
        tip.rotation.y = Math.PI / 4; tip.position.y = 1.52; tip.castShadow = true; group.add(tip);

        const guard = new T.Mesh(new T.BoxGeometry(0.42, 0.08, 0.12), hiltMat);
        guard.position.y = 0.06; guard.castShadow = true; group.add(guard);

        const grip = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.36, 8), hiltMat);
        grip.position.y = -0.16; group.add(grip);

        const pommel = new T.Mesh(new T.SphereGeometry(0.08, 8, 8), hiltMat);
        pommel.position.y = -0.38; group.add(pommel);

        return group;
      }
    },

    novice_axe: {
      id: 'novice_axe',
      name: 'Novice Battleaxe',
      type: 'weapon',
      tier: 2,
      accentColor: 0x94a3b8,
      desc: 'T2 Woodsman axe capable of harvesting lumber and cleaving beasts.',
      buildMesh: function(T) {
        const group = new T.Group();
        const shaftMat = new T.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
        const headMat = new T.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.25 });
        const edgeMat = new T.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });

        const shaft = new T.Mesh(new T.CylinderGeometry(0.045, 0.05, 1.35, 8), shaftMat);
        shaft.position.y = 0.55; shaft.castShadow = true; group.add(shaft);

        const head = new T.Mesh(new T.BoxGeometry(0.35, 0.38, 0.14), headMat);
        head.position.set(0.12, 1.05, 0); head.castShadow = true; group.add(head);

        const edge = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.06, 8, 1, false, 0, Math.PI), edgeMat);
        edge.rotation.z = -Math.PI / 2; edge.rotation.x = Math.PI / 2;
        edge.position.set(0.35, 1.05, 0); edge.castShadow = true; group.add(edge);

        return group;
      }
    },

    novice_bow: {
      id: 'novice_bow',
      name: 'Novice Recurve Bow',
      type: 'weapon',
      tier: 2,
      accentColor: 0x10b981,
      desc: 'T2 Flexible yew recurve bow with rapid arrow draw.',
      buildMesh: function(T) {
        return createBowMesh(T, {
          limbColor: 0x92400e,
          gripColor: 0x78350f,
          stringColor: 0xffffff,
          tipColor: 0xd97706,
          hasArrow: true
        });
      }
    },

    novice_fire_staff: {
      id: 'novice_fire_staff',
      name: 'Novice Fire Staff',
      type: 'weapon',
      tier: 2,
      accentColor: 0xf97316,
      desc: 'T2 Carved wooden staff channeling sparks of primal pyromancy.',
      buildMesh: function(T) {
        return createStaffMesh(T, {
          shaftColor: 0x78350f,
          headColor: 0xd97706,
          orbColor: 0xf97316,
          emissiveColor: 0xea580c,
          prongCount: 3,
          orbRadius: 0.15
        });
      }
    },

    novice_robe: {
      id: 'novice_robe',
      name: 'Novice Scholar Robe',
      type: 'armor',
      tier: 2,
      accentColor: 0x06b6d4,
      desc: 'T2 Light woven cloth robe tailored with mana focus channels.',
      buildMesh: function(T) {
        const group = new T.Group();
        const clothMat = new T.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.85 });
        const trimMat = new T.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.4, metalness: 0.7 });
        const sashMat = new T.MeshStandardMaterial({ color: 0x047857, roughness: 0.8 });

        const tunic = new T.Mesh(new T.BoxGeometry(0.82, 1.15, 0.52), clothMat);
        tunic.position.y = 0.65; group.add(tunic);

        const mantle = new T.Mesh(new T.BoxGeometry(0.9, 0.28, 0.58), trimMat);
        mantle.position.y = 1.12; group.add(mantle);

        const sash = new T.Mesh(new T.BoxGeometry(0.85, 0.16, 0.55), sashMat);
        sash.position.y = 0.35; group.add(sash);

        return group;
      }
    },

    leather_armor: {
      id: 'leather_armor',
      name: 'Novice Hunter Jacket',
      type: 'armor',
      tier: 2,
      accentColor: 0xd97706,
      desc: 'T2 Tough boiled leather cuirass fitted with bronze rivets.',
      buildMesh: function(T) {
        const group = new T.Group();
        const leatherMat = new T.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
        const darkLeatherMat = new T.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        const brassMat = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.25 });

        const torso = new T.Mesh(new T.BoxGeometry(0.85, 1.05, 0.55), leatherMat);
        torso.position.y = 0.65; torso.castShadow = true; group.add(torso);

        const pL = new T.Mesh(new T.BoxGeometry(0.32, 0.18, 0.58), darkLeatherMat);
        pL.position.set(-0.52, 1.05, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.32, 0.18, 0.58), darkLeatherMat);
        pR.position.set(0.52, 1.05, 0); group.add(pR);

        const belt = new T.Mesh(new T.BoxGeometry(0.9, 0.16, 0.58), darkLeatherMat);
        belt.position.set(0, 0.25, 0); group.add(belt);

        const buckle = new T.Mesh(new T.BoxGeometry(0.18, 0.2, 0.62), brassMat);
        buckle.position.set(0, 0.25, 0); group.add(buckle);

        return group;
      }
    },

    novice_plate: {
      id: 'novice_plate',
      name: 'Novice Soldier Armor',
      type: 'armor',
      tier: 2,
      accentColor: 0x64748b,
      desc: 'T2 Tempered cast-iron knight cuirass for frontline warriors.',
      buildMesh: function(T) {
        const group = new T.Group();
        const ironMat = new T.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
        const trimMat = new T.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });

        const torso = new T.Mesh(new T.BoxGeometry(0.88, 1.1, 0.58), ironMat);
        torso.position.y = 0.68; torso.castShadow = true; group.add(torso);

        const crest = new T.Mesh(new T.BoxGeometry(0.1, 0.75, 0.06), trimMat);
        crest.position.set(0, 0.72, 0.3); group.add(crest);

        const pL = new T.Mesh(new T.BoxGeometry(0.34, 0.22, 0.62), ironMat);
        pL.position.set(-0.54, 1.08, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.34, 0.22, 0.62), ironMat);
        pR.position.set(0.54, 1.08, 0); group.add(pR);

        return group;
      }
    },

    // =========================================================================
    // TIER 3 (JOURNEYMAN) WEAPONS & ARMORS
    // =========================================================================
    journeyman_claymore: {
      id: 'journeyman_claymore',
      name: 'Journeyman Claymore',
      type: 'weapon',
      tier: 3,
      accentColor: 0x38bdf8,
      desc: 'T3 Two-handed steel claymore delivering wide sweeping slashes.',
      buildMesh: function(T) {
        const group = new T.Group();
        const bladeMat = new T.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
        const fullerMat = new T.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.4 });
        const guardMat = new T.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
        const gripMat = new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

        const blade = new T.Mesh(new T.BoxGeometry(0.22, 1.55, 0.05), bladeMat);
        blade.position.y = 0.85; blade.castShadow = true; group.add(blade);

        const fuller = new T.Mesh(new T.BoxGeometry(0.05, 1.1, 0.06), fullerMat);
        fuller.position.y = 0.82; group.add(fuller);

        const tip = new T.Mesh(new T.ConeGeometry(0.155, 0.3, 4), bladeMat);
        tip.rotation.y = Math.PI / 4; tip.position.y = 1.78; group.add(tip);

        const guard = new T.Mesh(new T.BoxGeometry(0.52, 0.08, 0.12), guardMat);
        guard.position.y = 0.06; group.add(guard);

        const grip = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.42, 8), gripMat);
        grip.position.y = -0.18; group.add(grip);

        const pommel = new T.Mesh(new T.OctahedronGeometry(0.09), guardMat);
        pommel.position.y = -0.42; group.add(pommel);

        return group;
      }
    },

    journeyman_warbow: {
      id: 'journeyman_warbow',
      name: 'Journeyman Warbow',
      type: 'weapon',
      tier: 3,
      accentColor: 0x06b6d4,
      desc: 'T3 High-draw composite warbow tipped with steel horn notches.',
      buildMesh: function(T) {
        return createBowMesh(T, {
          limbColor: 0x451a03,
          gripColor: 0x1e293b,
          stringColor: 0x38bdf8,
          tipColor: 0x94a3b8,
          gemColor: 0x06b6d4,
          hasArrow: true
        });
      }
    },

    journeyman_frost_staff: {
      id: 'journeyman_frost_staff',
      name: 'Journeyman Frost Staff',
      type: 'weapon',
      tier: 3,
      accentColor: 0x38bdf8,
      desc: 'T3 Chilled ashwood staff crowned with orbiting subzero frost shards.',
      buildMesh: function(T) {
        return createStaffMesh(T, {
          shaftColor: 0x1e293b,
          headColor: 0x94a3b8,
          orbColor: 0x38bdf8,
          emissiveColor: 0x0284c7,
          prongCount: 4,
          orbRadius: 0.16,
          hasRings: true
        });
      }
    },

    journeyman_hammer: {
      id: 'journeyman_hammer',
      name: 'Journeyman War Hammer',
      type: 'weapon',
      tier: 3,
      accentColor: 0x64748b,
      desc: 'T3 Heavy forged iron warhammer shattering shields and bone.',
      buildMesh: function(T) {
        const group = new T.Group();
        const shaftMat = new T.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.5 });
        const headMat = new T.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
        const spikeMat = new T.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95 });

        const shaft = new T.Mesh(new T.CylinderGeometry(0.045, 0.05, 1.4, 8), shaftMat);
        shaft.position.y = 0.55; group.add(shaft);

        const head = new T.Mesh(new T.BoxGeometry(0.46, 0.4, 0.58), headMat);
        head.position.set(0, 1.1, 0); head.castShadow = true; group.add(head);

        const spike = new T.Mesh(new T.ConeGeometry(0.12, 0.38, 4), spikeMat);
        spike.rotation.x = Math.PI / 2; spike.position.set(0, 1.1, -0.42); group.add(spike);

        return group;
      }
    },

    journeyman_robe: {
      id: 'journeyman_robe',
      name: 'Journeyman Cleric Robe',
      type: 'armor',
      tier: 3,
      accentColor: 0x818cf8,
      desc: 'T3 Woven blessed silk vestment with runic shoulder mantle.',
      buildMesh: function(T) {
        const group = new T.Group();
        const clothMat = new T.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.75 });
        const silverTrim = new T.MeshStandardMaterial({ color: 0xe0e7ff, metalness: 0.9, roughness: 0.2 });

        const torso = new T.Mesh(new T.BoxGeometry(0.84, 1.12, 0.54), clothMat);
        torso.position.y = 0.66; group.add(torso);

        const mantle = new T.Mesh(new T.BoxGeometry(0.92, 0.32, 0.6), silverTrim);
        mantle.position.y = 1.12; group.add(mantle);

        const brooch = new T.Mesh(new T.OctahedronGeometry(0.1), silverTrim);
        broachMat: brooch.position.set(0, 1.1, 0.32); group.add(brooch);

        return group;
      }
    },

    journeyman_leather: {
      id: 'journeyman_leather',
      name: 'Journeyman Scout Garb',
      type: 'armor',
      tier: 3,
      accentColor: 0xca8a04,
      desc: 'T3 Supple treated leather vest with reinforced archery straps.',
      buildMesh: function(T) {
        const group = new T.Group();
        const leatherMat = new T.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
        const darkTrim = new T.MeshStandardMaterial({ color: 0x3f2e18, roughness: 0.9 });

        const torso = new T.Mesh(new T.BoxGeometry(0.86, 1.08, 0.56), leatherMat);
        torso.position.y = 0.66; group.add(torso);

        const pL = new T.Mesh(new T.BoxGeometry(0.34, 0.22, 0.6), darkTrim);
        pL.position.set(-0.54, 1.06, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.34, 0.22, 0.6), darkTrim);
        pR.position.set(0.54, 1.06, 0); group.add(pR);

        return group;
      }
    },

    journeyman_plate: {
      id: 'journeyman_plate',
      name: 'Journeyman Knight Mail',
      type: 'armor',
      tier: 3,
      accentColor: 0x38bdf8,
      desc: 'T3 High-polish tempered steel chest harness with winged gorget.',
      buildMesh: function(T) {
        const group = new T.Group();
        const steelMat = new T.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.2 });
        const blueTrim = new T.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.3 });

        const torso = new T.Mesh(new T.BoxGeometry(0.9, 1.14, 0.6), steelMat);
        torso.position.y = 0.68; group.add(torso);

        const crest = new T.Mesh(new T.BoxGeometry(0.12, 0.8, 0.08), blueTrim);
        crest.position.set(0, 0.75, 0.32); group.add(crest);

        const pL = new T.Mesh(new T.BoxGeometry(0.36, 0.25, 0.64), steelMat);
        pL.position.set(-0.56, 1.1, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.36, 0.25, 0.64), steelMat);
        pR.position.set(0.56, 1.1, 0); group.add(pR);

        return group;
      }
    },

    // =========================================================================
    // TIER 4 (ADEPT) WEAPONS & ARMORS
    // =========================================================================
    steel_broadsword: {
      id: 'steel_broadsword',
      name: 'Adept Broadsword',
      type: 'weapon',
      tier: 4,
      accentColor: 0x38bdf8,
      desc: 'T4 Polished rune-etched steel broadsword with winged gold crossguard.',
      buildMesh: function(T) {
        const group = new T.Group();
        const bladeMat = new T.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.12 });
        const runeMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85 });
        const goldMat = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
        const gripMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

        const blade = new T.Mesh(new T.BoxGeometry(0.24, 1.6, 0.055), bladeMat);
        blade.position.y = 0.88; blade.castShadow = true; group.add(blade);

        const rune = new T.Mesh(new T.BoxGeometry(0.06, 1.25, 0.065), runeMat);
        rune.position.y = 0.84; group.add(rune);

        const tip = new T.Mesh(new T.ConeGeometry(0.17, 0.35, 4), bladeMat);
        tip.rotation.y = Math.PI / 4; tip.position.y = 1.84; group.add(tip);

        const guard = new T.Mesh(new T.BoxGeometry(0.56, 0.1, 0.16), goldMat);
        guard.position.y = 0.07; group.add(guard);

        const grip = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.42, 8), gripMat);
        grip.position.y = -0.18; group.add(grip);

        const pommel = new T.Mesh(new T.OctahedronGeometry(0.11), goldMat);
        pommel.position.y = -0.42; group.add(pommel);

        return group;
      }
    },

    adept_longbow: {
      id: 'adept_longbow',
      name: 'Adept Longbow',
      type: 'weapon',
      tier: 4,
      accentColor: 0xa855f7,
      desc: 'T4 High-tension master crafted longbow with purple runic sight.',
      buildMesh: function(T) {
        return createBowMesh(T, {
          limbColor: 0x1e1b4b,
          gripColor: 0x312e81,
          stringColor: 0xc084fc,
          tipColor: 0xa855f7,
          gemColor: 0xc084fc,
          hasArrow: true
        });
      }
    },

    adept_cursed_staff: {
      id: 'adept_cursed_staff',
      name: 'Adept Cursed Staff',
      type: 'weapon',
      tier: 4,
      accentColor: 0x10b981,
      desc: 'T4 Twisted ebony staff harboring emerald soul fire in an ancient skull socket.',
      buildMesh: function(T) {
        return createStaffMesh(T, {
          shaftColor: 0x09090b,
          headColor: 0x27272a,
          orbColor: 0x10b981,
          emissiveColor: 0x059669,
          prongCount: 4,
          orbRadius: 0.17,
          hasRings: true
        });
      }
    },

    adept_dagger: {
      id: 'adept_dagger',
      name: 'Adept Dual Daggers',
      type: 'weapon',
      tier: 4,
      accentColor: 0x10b981,
      desc: 'T4 Twin keen assassin stilettos coated in deadly venom.',
      buildMesh: function(T) {
        const group = new T.Group();
        const bladeMat = new T.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
        const venomMat = new T.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.8 });
        const goldMat = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85 });

        const blade = new T.Mesh(new T.BoxGeometry(0.11, 0.92, 0.04), bladeMat);
        blade.position.y = 0.5; group.add(blade);

        const edge = new T.Mesh(new T.BoxGeometry(0.04, 0.88, 0.05), venomMat);
        edge.position.set(0.05, 0.5, 0); group.add(edge);

        const tip = new T.Mesh(new T.ConeGeometry(0.08, 0.25, 4), venomMat);
        tip.position.y = 1.05; group.add(tip);

        const guard = new T.Mesh(new T.BoxGeometry(0.32, 0.07, 0.09), goldMat);
        guard.position.y = 0.04; group.add(guard);

        const grip = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.3, 8), bladeMat);
        grip.position.y = -0.14; group.add(grip);

        return group;
      }
    },

    adept_pike: {
      id: 'adept_pike',
      name: 'Adept Pike',
      type: 'weapon',
      tier: 4,
      accentColor: 0x64748b,
      desc: 'T4 Long reach knight spear tipping a razor steel lance.',
      buildMesh: function(T) {
        const group = new T.Group();
        const shaftMat = new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
        const steelMat = new T.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
        const goldTrim = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });

        const shaft = new T.Mesh(new T.CylinderGeometry(0.04, 0.045, 1.9, 8), shaftMat);
        shaft.position.y = 0.8; group.add(shaft);

        const collar = new T.Mesh(new T.CylinderGeometry(0.07, 0.05, 0.22, 8), goldTrim);
        collar.position.y = 1.7; group.add(collar);

        const head = new T.Mesh(new T.ConeGeometry(0.16, 0.65, 4), steelMat);
        head.position.y = 2.1; head.rotation.y = Math.PI / 4; group.add(head);

        return group;
      }
    },

    adept_mage_robe: {
      id: 'adept_mage_robe',
      name: 'Adept Pyromancer Robe',
      type: 'armor',
      tier: 4,
      accentColor: 0xef4444,
      desc: 'T4 Crimson velvet mantle with gold trim boosting raw sorcery.',
      buildMesh: function(T) {
        const group = new T.Group();
        const clothMat = new T.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
        const goldMat = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
        const rubyMat = new T.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.8 });

        const torso = new T.Mesh(new T.BoxGeometry(0.88, 1.15, 0.58), clothMat);
        torso.position.y = 0.68; group.add(torso);

        const cowl = new T.Mesh(new T.BoxGeometry(0.96, 0.35, 0.65), goldMat);
        cowl.position.y = 1.15; group.add(cowl);

        const gem = new T.Mesh(new T.OctahedronGeometry(0.12), rubyMat);
        gem.position.set(0, 1.15, 0.36); group.add(gem);

        return group;
      }
    },

    adept_assassin_jacket: {
      id: 'adept_assassin_jacket',
      name: 'Adept Assassin Jacket',
      type: 'armor',
      tier: 4,
      accentColor: 0x10b981,
      desc: 'T4 Studded stealth tunic with dark clasps and silent leather.',
      buildMesh: function(T) {
        const group = new T.Group();
        const darkMat = new T.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
        const emeraldTrim = new T.MeshStandardMaterial({ color: 0x059669, metalness: 0.8 });

        const torso = new T.Mesh(new T.BoxGeometry(0.88, 1.1, 0.56), darkMat);
        torso.position.y = 0.68; group.add(torso);

        const pL = new T.Mesh(new T.BoxGeometry(0.35, 0.25, 0.62), darkMat);
        pL.position.set(-0.55, 1.1, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.35, 0.25, 0.62), darkMat);
        pR.position.set(0.55, 1.1, 0); group.add(pR);

        const band = new T.Mesh(new T.BoxGeometry(0.92, 0.12, 0.6), emeraldTrim);
        band.position.set(0, 0.4, 0); group.add(band);

        return group;
      }
    },

    iron_plate: {
      id: 'iron_plate',
      name: 'Adept Guardian Plate',
      type: 'armor',
      tier: 4,
      accentColor: 0x94a3b8,
      desc: 'T4 Heavy tempered knight cuirass with mirror-polished steel and gold crest.',
      buildMesh: function(T) {
        const group = new T.Group();
        const plateMat = new T.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.96, roughness: 0.16 });
        const goldTrim = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.25 });

        const torso = new T.Mesh(new T.BoxGeometry(0.9, 1.15, 0.6), plateMat);
        torso.position.y = 0.7; torso.castShadow = true; group.add(torso);

        const crest = new T.Mesh(new T.BoxGeometry(0.12, 0.85, 0.08), goldTrim);
        crest.position.set(0, 0.78, 0.32); group.add(crest);

        const gorget = new T.Mesh(new T.CylinderGeometry(0.35, 0.42, 0.16, 8, 1, false, 0, Math.PI), goldTrim);
        gorget.rotation.x = Math.PI; gorget.position.set(0, 1.25, 0.18); group.add(gorget);

        const pL = new T.Mesh(new T.BoxGeometry(0.36, 0.28, 0.66), plateMat);
        pL.position.set(-0.56, 1.12, 0); pL.rotation.z = -0.15; group.add(pL);

        const pR = new T.Mesh(new T.BoxGeometry(0.36, 0.28, 0.66), plateMat);
        pR.position.set(0.56, 1.12, 0); pR.rotation.z = 0.15; group.add(pR);

        return group;
      }
    },

    // =========================================================================
    // TIER 5 (EXPERT) WEAPONS & ARMORS
    // =========================================================================
    flame_dagger: {
      id: 'flame_dagger',
      name: 'Expert Flame Dagger',
      type: 'weapon',
      tier: 5,
      accentColor: 0xef4444,
      desc: 'T5 Obsidian stiletto radiating volcanic heat and piercing serrations.',
      buildMesh: function(T) {
        const group = new T.Group();
        const obsMat = new T.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.7 });
        const flameMat = new T.MeshStandardMaterial({
          color: 0xef4444, emissive: 0xf97316, emissiveIntensity: 0.95, roughness: 0.2
        });
        const rubyMat = new T.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0xef4444, emissiveIntensity: 0.5 });

        const blade = new T.Mesh(new T.BoxGeometry(0.12, 0.9, 0.04), obsMat);
        blade.position.y = 0.48; blade.castShadow = true; group.add(blade);

        const flameEdge = new T.Mesh(new T.BoxGeometry(0.05, 0.85, 0.05), flameMat);
        flameEdge.position.set(0.05, 0.48, 0); group.add(flameEdge);

        const tip = new T.Mesh(new T.ConeGeometry(0.085, 0.24, 4), flameMat);
        tip.rotation.y = Math.PI / 4; tip.position.y = 1.02; group.add(tip);

        const guard = new T.Mesh(new T.BoxGeometry(0.34, 0.08, 0.1), rubyMat);
        guard.position.y = 0.04; group.add(guard);

        const grip = new T.Mesh(new T.CylinderGeometry(0.038, 0.038, 0.28, 8), obsMat);
        grip.position.y = -0.12; group.add(grip);

        return group;
      }
    },

    expert_whispering_bow: {
      id: 'expert_whispering_bow',
      name: 'Expert Whispering Bow',
      type: 'weapon',
      tier: 5,
      accentColor: 0x10b981,
      desc: 'T5 Ethereal spirit wood bow infused with emerald energy arrows.',
      buildMesh: function(T) {
        return createBowMesh(T, {
          limbColor: 0x064e3b,
          gripColor: 0x022c22,
          stringColor: 0x6ee7b7,
          tipColor: 0x10b981,
          gemColor: 0x34d399,
          hasArrow: true
        });
      }
    },

    expert_infernal_staff: {
      id: 'expert_infernal_staff',
      name: 'Expert Infernal Staff',
      type: 'weapon',
      tier: 5,
      accentColor: 0xef4444,
      desc: 'T5 Demon-crested staff unleashing searing magma fury on foes.',
      buildMesh: function(T) {
        return createStaffMesh(T, {
          shaftColor: 0x18181b,
          headColor: 0xb91c1c,
          orbColor: 0xef4444,
          emissiveColor: 0xdc2626,
          prongCount: 4,
          orbRadius: 0.18,
          hasRings: true
        });
      }
    },

    battle_hammer: {
      id: 'battle_hammer',
      name: 'Expert Earthbreaker',
      type: 'weapon',
      tier: 5,
      accentColor: 0xf59e0b,
      desc: 'T5 Colossal runic hammer designed to shatter heavy armor plates.',
      buildMesh: function(T) {
        const group = new T.Group();
        const ironMat = new T.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.22 });
        const goldTrim = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
        const handleMat = new T.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });

        const shaft = new T.Mesh(new T.CylinderGeometry(0.05, 0.055, 1.5, 8), handleMat);
        shaft.position.y = 0.6; group.add(shaft);

        const head = new T.Mesh(new T.BoxGeometry(0.55, 0.48, 0.65), ironMat);
        head.position.set(0, 1.15, 0); head.castShadow = true; group.add(head);

        const band1 = new T.Mesh(new T.BoxGeometry(0.57, 0.08, 0.67), goldTrim);
        band1.position.set(0, 1.15, 0); group.add(band1);

        const spike = new T.Mesh(new T.ConeGeometry(0.14, 0.45, 4), ironMat);
        spike.rotation.x = Math.PI / 2; spike.position.set(0, 1.15, -0.5); group.add(spike);

        return group;
      }
    },

    crystal_spear: {
      id: 'crystal_spear',
      name: 'Expert Frost Pike',
      type: 'weapon',
      tier: 5,
      accentColor: 0x38bdf8,
      desc: 'T5 Glacial polearm tipping a diamond-honed spearhead of absolute zero ice.',
      buildMesh: function(T) {
        const group = new T.Group();
        const shaftMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
        const iceMat = new T.MeshStandardMaterial({
          color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.12
        });
        const silverMat = new T.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });

        const shaft = new T.Mesh(new T.CylinderGeometry(0.04, 0.045, 2.0, 8), shaftMat);
        shaft.position.y = 0.8; group.add(shaft);

        const collar = new T.Mesh(new T.CylinderGeometry(0.07, 0.05, 0.25, 8), silverMat);
        collar.position.y = 1.7; group.add(collar);

        const spearhead = new T.Mesh(new T.ConeGeometry(0.18, 0.75, 4), iceMat);
        spearhead.position.y = 2.15; spearhead.rotation.y = Math.PI / 4; group.add(spearhead);

        for (let side of [-1, 1]) {
          const barb = new T.Mesh(new T.ConeGeometry(0.08, 0.35, 4), iceMat);
          barb.position.set(side * 0.15, 1.82, 0); barb.rotation.z = -side * 0.65; group.add(barb);
        }

        return group;
      }
    },

    expert_royal_robe: {
      id: 'expert_royal_robe',
      name: 'Expert Royal Robe',
      type: 'armor',
      tier: 5,
      accentColor: 0xa855f7,
      desc: 'T5 Gilded royal archmage vestments boosting supreme sorcery.',
      buildMesh: function(T) {
        const group = new T.Group();
        const velvetMat = new T.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6 });
        const goldMat = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
        const gemMat = new T.MeshStandardMaterial({ color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 0.85 });

        const torso = new T.Mesh(new T.BoxGeometry(0.92, 1.18, 0.6), velvetMat);
        torso.position.y = 0.72; group.add(torso);

        const cape = new T.Mesh(new T.BoxGeometry(1.0, 0.38, 0.68), goldMat);
        cape.position.y = 1.18; group.add(cape);

        const orb = new T.Mesh(new T.SphereGeometry(0.12, 8, 8), gemMat);
        orb.position.set(0, 1.18, 0.38); group.add(orb);

        return group;
      }
    },

    expert_stalker_leather: {
      id: 'expert_stalker_leather',
      name: 'Expert Stalker Leather',
      type: 'armor',
      tier: 5,
      accentColor: 0xca8a04,
      desc: 'T5 Dragon-scale reinforced leather tunic with wolf pelt pauldrons.',
      buildMesh: function(T) {
        const group = new T.Group();
        const leatherMat = new T.MeshStandardMaterial({ color: 0x713f12, roughness: 0.75 });
        const scaleMat = new T.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.7, roughness: 0.3 });

        const torso = new T.Mesh(new T.BoxGeometry(0.92, 1.14, 0.6), leatherMat);
        torso.position.y = 0.7; group.add(torso);

        const pL = new T.Mesh(new T.BoxGeometry(0.38, 0.28, 0.68), scaleMat);
        pL.position.set(-0.58, 1.12, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.38, 0.28, 0.68), scaleMat);
        pR.position.set(0.58, 1.12, 0); group.add(pR);

        return group;
      }
    },

    demon_carapace: {
      id: 'demon_carapace',
      name: 'Expert Demon Carapace',
      type: 'armor',
      tier: 5,
      accentColor: 0xef4444,
      desc: 'T5 Forged from abyssal obsidian and demon bones, radiating brimstone magma.',
      buildMesh: function(T) {
        const group = new T.Group();
        const obsMat = new T.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
        const magmaMat = new T.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 0.8 });

        const torso = new T.Mesh(new T.BoxGeometry(0.95, 1.2, 0.65), obsMat);
        torso.position.y = 0.75; torso.castShadow = true; group.add(torso);

        const core = new T.Mesh(new T.OctahedronGeometry(0.22), magmaMat);
        core.position.set(0, 0.82, 0.35); group.add(core);

        for (let side of [-1, 1]) {
          const pauldron = new T.Mesh(new T.BoxGeometry(0.38, 0.3, 0.7), obsMat);
          pauldron.position.set(side * 0.6, 1.2, 0); pauldron.rotation.z = side * 0.2; group.add(pauldron);

          const spike = new T.Mesh(new T.ConeGeometry(0.12, 0.65, 5), magmaMat);
          spike.position.set(side * 0.65, 1.5, -0.05); spike.rotation.z = -side * 0.45; group.add(spike);
        }

        return group;
      }
    },

    // =========================================================================
    // TIER 6 (MASTER) WEAPONS & ARMORS
    // =========================================================================
    master_relic_blade: {
      id: 'master_relic_blade',
      name: 'Master Relic Greatsword',
      type: 'weapon',
      tier: 6,
      accentColor: 0xf59e0b,
      desc: 'T6 Ancient kingdom relic radiating blazing golden celestial power.',
      buildMesh: function(T) {
        const group = new T.Group();
        const goldMat = new T.MeshStandardMaterial({ color: 0xfcd34d, metalness: 0.98, roughness: 0.1 });
        const holyMat = new T.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.95 });
        const gemMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 });

        const blade = new T.Mesh(new T.BoxGeometry(0.26, 1.8, 0.06), goldMat);
        blade.position.y = 0.95; blade.castShadow = true; group.add(blade);

        const holyCore = new T.Mesh(new T.BoxGeometry(0.08, 1.4, 0.07), holyMat);
        holyCore.position.y = 0.92; group.add(holyCore);

        const tip = new T.Mesh(new T.ConeGeometry(0.18, 0.4, 4), goldMat);
        tip.rotation.y = Math.PI / 4; tip.position.y = 2.05; group.add(tip);

        const guard = new T.Mesh(new T.BoxGeometry(0.65, 0.12, 0.18), goldMat);
        guard.position.y = 0.08; group.add(guard);

        const jewel = new T.Mesh(new T.OctahedronGeometry(0.12), gemMat);
        jewel.position.set(0, 0.08, 0.1); group.add(jewel);

        const grip = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.45, 8), holyMat);
        grip.position.y = -0.2; group.add(grip);

        return group;
      }
    },

    master_bow_of_shadows: {
      id: 'master_bow_of_shadows',
      name: 'Master Bow of Shadows',
      type: 'weapon',
      tier: 6,
      accentColor: 0xa855f7,
      desc: 'T6 Void-forged composite recurve bow firing shadow piercing bolts.',
      buildMesh: function(T) {
        return createBowMesh(T, {
          limbColor: 0x09090b,
          gripColor: 0x18181b,
          stringColor: 0xa855f7,
          tipColor: 0xc084fc,
          gemColor: 0xa855f7,
          hasArrow: true
        });
      }
    },

    master_archmage_staff: {
      id: 'master_archmage_staff',
      name: 'Master Archmage Staff',
      type: 'weapon',
      tier: 6,
      accentColor: 0x38bdf8,
      desc: 'T6 Ornate golden celestial scepter with orbiting cosmic rings.',
      buildMesh: function(T) {
        return createStaffMesh(T, {
          shaftColor: 0x1e1b4b,
          headColor: 0xf59e0b,
          orbColor: 0x38bdf8,
          emissiveColor: 0x0284c7,
          prongCount: 5,
          orbRadius: 0.2,
          hasRings: true
        });
      }
    },

    master_abyssal_hammer: {
      id: 'master_abyssal_hammer',
      name: 'Master Abyssal Hammer',
      type: 'weapon',
      tier: 6,
      accentColor: 0xef4444,
      desc: 'T6 Cataclysmic obsidian war hammer shattering terrain with hellfire.',
      buildMesh: function(T) {
        const group = new T.Group();
        const obsMat = new T.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.25 });
        const fireMat = new T.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.95 });

        const shaft = new T.Mesh(new T.CylinderGeometry(0.055, 0.06, 1.6, 8), obsMat);
        shaft.position.y = 0.65; group.add(shaft);

        const head = new T.Mesh(new T.BoxGeometry(0.65, 0.55, 0.75), obsMat);
        head.position.set(0, 1.25, 0); head.castShadow = true; group.add(head);

        const core = new T.Mesh(new T.BoxGeometry(0.67, 0.15, 0.77), fireMat);
        core.position.set(0, 1.25, 0); group.add(core);

        const spike = new T.Mesh(new T.ConeGeometry(0.18, 0.55, 4), fireMat);
        spike.rotation.x = Math.PI / 2; spike.position.set(0, 1.25, -0.6); group.add(spike);

        return group;
      }
    },

    master_archmage_vestment: {
      id: 'master_archmage_vestment',
      name: 'Master Archmage Vestment',
      type: 'armor',
      tier: 6,
      accentColor: 0x38bdf8,
      desc: 'T6 Luminescent starlight-infused robes with astral gold trim.',
      buildMesh: function(T) {
        const group = new T.Group();
        const silkMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
        const starMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
        const goldMat = new T.MeshStandardMaterial({ color: 0xfcd34d, metalness: 0.95 });

        const torso = new T.Mesh(new T.BoxGeometry(0.95, 1.22, 0.62), silkMat);
        torso.position.y = 0.74; group.add(torso);

        const cape = new T.Mesh(new T.BoxGeometry(1.05, 0.42, 0.7), goldMat);
        cape.position.y = 1.22; group.add(cape);

        const jewel = new T.Mesh(new T.OctahedronGeometry(0.15), starMat);
        jewel.position.set(0, 1.22, 0.4); group.add(jewel);

        return group;
      }
    },

    master_shadow_jacket: {
      id: 'master_shadow_jacket',
      name: 'Master Shadow Garb',
      type: 'armor',
      tier: 6,
      accentColor: 0xa855f7,
      desc: 'T6 Phantom leather coat wrapped in umbral wards and shadow gems.',
      buildMesh: function(T) {
        const group = new T.Group();
        const voidMat = new T.MeshStandardMaterial({ color: 0x09090b, roughness: 0.7 });
        const purpleMat = new T.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.75 });

        const torso = new T.Mesh(new T.BoxGeometry(0.95, 1.18, 0.62), voidMat);
        torso.position.y = 0.72; group.add(torso);

        const pL = new T.Mesh(new T.BoxGeometry(0.4, 0.3, 0.7), voidMat);
        pL.position.set(-0.62, 1.15, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.4, 0.3, 0.7), voidMat);
        pR.position.set(0.62, 1.15, 0); group.add(pR);

        const gem = new T.Mesh(new T.SphereGeometry(0.1, 8, 8), purpleMat);
        gem.position.set(0, 0.85, 0.34); group.add(gem);

        return group;
      }
    },

    master_judicator_plate: {
      id: 'master_judicator_plate',
      name: 'Master Judicator Carapace',
      type: 'armor',
      tier: 6,
      accentColor: 0xf59e0b,
      desc: 'T6 Indestructible titan armor with glowing gold crest and molten plates.',
      buildMesh: function(T) {
        const group = new T.Group();
        const titanMat = new T.MeshStandardMaterial({ color: 0x18181b, metalness: 0.95, roughness: 0.15 });
        const goldMat = new T.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
        const flameMat = new T.MeshStandardMaterial({ color: 0xef4444, emissive: 0xf97316, emissiveIntensity: 0.9 });

        const torso = new T.Mesh(new T.BoxGeometry(1.0, 1.25, 0.7), titanMat);
        torso.position.y = 0.76; group.add(torso);

        const crest = new T.Mesh(new T.BoxGeometry(0.18, 0.9, 0.1), goldMat);
        crest.position.set(0, 0.82, 0.38); group.add(crest);

        const gem = new T.Mesh(new T.OctahedronGeometry(0.15), flameMat);
        gem.position.set(0, 0.82, 0.44); group.add(gem);

        const pL = new T.Mesh(new T.BoxGeometry(0.42, 0.32, 0.75), goldMat);
        pL.position.set(-0.64, 1.2, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.42, 0.32, 0.75), goldMat);
        pR.position.set(0.64, 1.2, 0); group.add(pR);

        return group;
      }
    },

    // --- TIER 7 (CELESTIAL / WORLD-CLASS) ---
    astral_wood: {
      id: 'astral_wood',
      name: 'Celestial World-Tree Wood',
      type: 'material',
      tier: 7,
      accentColor: 0x818cf8,
      desc: 'T7 Luminescent timber infused with stellar nebula energy.',
      buildMesh: function(T) {
        const group = new T.Group();
        const barkMat = new T.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.6 });
        const starlightMat = new T.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x6366f1, emissiveIntensity: 0.9 });
        const log = new T.Mesh(new T.CylinderGeometry(0.2, 0.22, 1.0, 8), barkMat);
        log.rotation.z = Math.PI / 2;
        group.add(log);
        const core = new T.Mesh(new T.TorusGeometry(0.24, 0.04, 6, 12), starlightMat);
        core.rotation.y = Math.PI / 2;
        group.add(core);
        return group;
      }
    },

    starfall_crystal: {
      id: 'starfall_crystal',
      name: 'Astral Starfall Ore',
      type: 'material',
      tier: 7,
      accentColor: 0xc084fc,
      desc: 'T7 Cosmic ore glowing with pulsars and astral stardust.',
      buildMesh: function(T) {
        const group = new T.Group();
        const rockMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
        const crystalMat = new T.MeshStandardMaterial({ color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 1.0, roughness: 0.1 });
        const base = new T.Mesh(new T.DodecahedronGeometry(0.45), rockMat);
        group.add(base);
        const crystal = new T.Mesh(new T.OctahedronGeometry(0.35), crystalMat);
        crystal.position.y = 0.35;
        group.add(crystal);
        return group;
      }
    },

    void_shard: {
      id: 'void_shard',
      name: 'Void Emperor Shard',
      type: 'material',
      tier: 7,
      accentColor: 0xf43f5e,
      desc: 'T7 Singularity remnant torn from the fabric of the Void Emperor.',
      buildMesh: function(T) {
        const group = new T.Group();
        const voidMat = new T.MeshStandardMaterial({ color: 0x020617, roughness: 0.1, metalness: 0.9 });
        const redMat = new T.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.2 });
        const sphere = new T.Mesh(new T.SphereGeometry(0.32, 12, 12), voidMat);
        group.add(sphere);
        const ring = new T.Mesh(new T.RingGeometry(0.38, 0.48, 16), redMat);
        ring.rotation.x = Math.PI / 3;
        group.add(ring);
        return group;
      }
    },

    celestial_greatsword: {
      id: 'celestial_greatsword',
      name: 'Astraeus Void Cleaver',
      type: 'weapon',
      tier: 7,
      weaponType: 'broadsword',
      accentColor: 0x818cf8,
      desc: 'T7 World-Class Greatsword forged from collapsed star cores.',
      buildMesh: function(T) {
        const group = new T.Group();
        const voidMat = new T.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.1 });
        const glowMat = new T.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x6366f1, emissiveIntensity: 1.2 });
        const blade = new T.Mesh(new T.BoxGeometry(0.24, 1.8, 0.08), voidMat);
        blade.position.y = 0.9;
        group.add(blade);
        const edge = new T.Mesh(new T.BoxGeometry(0.08, 1.7, 0.09), glowMat);
        edge.position.y = 0.9;
        group.add(edge);
        const guard = new T.Mesh(new T.BoxGeometry(0.65, 0.1, 0.16), glowMat);
        guard.position.y = 0.05;
        group.add(guard);
        const hilt = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.45, 8), voidMat);
        hilt.position.y = -0.2;
        group.add(hilt);
        return group;
      }
    },

    celestial_bow: {
      id: 'celestial_bow',
      name: 'Star-Strider Longbow',
      type: 'weapon',
      tier: 7,
      weaponType: 'bow',
      accentColor: 0x38bdf8,
      desc: 'T7 World-Class bow firing astral supernovas.',
      buildMesh: function(T) {
        const group = new T.Group();
        const starMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.0 });
        const bowCurve = new T.Mesh(new T.TorusGeometry(0.7, 0.04, 8, 16, Math.PI), starMat);
        bowCurve.rotation.z = -Math.PI / 2;
        group.add(bowCurve);
        return group;
      }
    },

    celestial_staff: {
      id: 'celestial_staff',
      name: 'Void Emperor Scepter',
      type: 'weapon',
      tier: 7,
      weaponType: 'staff',
      accentColor: 0xa855f7,
      desc: 'T7 World-Class scepter commanding astral black holes.',
      buildMesh: function(T) {
        const group = new T.Group();
        const shaftMat = new T.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8 });
        const orbMat = new T.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 1.3 });
        const shaft = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.8, 8), shaftMat);
        shaft.position.y = 0.7;
        group.add(shaft);
        const orb = new T.Mesh(new T.SphereGeometry(0.22, 12, 12), orbMat);
        orb.position.y = 1.7;
        group.add(orb);
        const ring = new T.Mesh(new T.TorusGeometry(0.32, 0.03, 6, 16), orbMat);
        ring.position.y = 1.7;
        ring.rotation.x = Math.PI / 4;
        group.add(ring);
        return group;
      }
    },

    celestial_carapace: {
      id: 'celestial_carapace',
      name: 'Void Emperor Regalia',
      type: 'armor',
      tier: 7,
      accentColor: 0x818cf8,
      desc: 'T7 Supreme titan plate resonating with cosmic eternity.',
      buildMesh: function(T) {
        const group = new T.Group();
        const titanMat = new T.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.1 });
        const starlightMat = new T.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x6366f1, emissiveIntensity: 1.0 });
        const torso = new T.Mesh(new T.BoxGeometry(1.05, 1.3, 0.75), titanMat);
        torso.position.y = 0.76;
        group.add(torso);
        const crest = new T.Mesh(new T.OctahedronGeometry(0.2), starlightMat);
        crest.position.set(0, 0.9, 0.42);
        group.add(crest);
        const pL = new T.Mesh(new T.BoxGeometry(0.45, 0.35, 0.8), starlightMat);
        pL.position.set(-0.68, 1.25, 0); group.add(pL);
        const pR = new T.Mesh(new T.BoxGeometry(0.45, 0.35, 0.8), starlightMat);
        pR.position.set(0.68, 1.25, 0); group.add(pR);
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
    bow: 'novice_bow',
    staff: 'novice_fire_staff',
    leather: 'leather_armor',
    iron: 'iron_plate',
    demon: 'demon_carapace',
    cloth: 'novice_robe'
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

      offscreenScene = new T.Scene();
      offscreenCamera = new T.PerspectiveCamera(38, 1, 0.1, 50);

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

  function generate3DThumbnail(itemId) {
    const reg = resolveItem(itemId);
    if (!reg) return null;
    const resolvedId = reg.id;
    if (thumbnailCache[resolvedId]) return thumbnailCache[resolvedId];
    if (!THREE || typeof document === 'undefined') return null;

    initOffscreenStudio(THREE);
    if (!offscreenRenderer) return null;
    if (!reg.buildMesh) return null;

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

    if (reg.type === 'weapon') {
      pivot.rotation.z = -Math.PI / 4;
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
      return null;
    }
  }

  function preloadAllThumbnails() {
    if (!THREE || typeof document === 'undefined') return;
    const keys = Object.keys(ITEM_REGISTRY);
    let idx = 0;
    function processNextBatch() {
      const start = Date.now();
      while (idx < keys.length && (Date.now() - start) < 8) {
        try {
          generate3DThumbnail(keys[idx]);
        } catch (e) { }
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

  function createWorldLootMesh(itemId) {
    if (!THREE) return null;
    const group = new THREE.Group();
    const reg = resolveItem(itemId);

    let itemModel;
    if (reg && reg.buildMesh) {
      itemModel = reg.buildMesh(THREE);
    } else {
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

    itemModel.scale.multiplyScalar(0.75);
    itemModel.position.y = 0.5;
    group.add(itemModel);
    group.userData.itemModel = itemModel;

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

    group.userData.baseY = 0.5;
    group.userData.rotSpeed = 1.4;

    return group;
  }

  function createItemMesh(itemId) {
    if (!THREE) return null;
    const reg = resolveItem(itemId);
    if (reg && reg.buildMesh) {
      return reg.buildMesh(THREE);
    }
    return null;
  }

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
