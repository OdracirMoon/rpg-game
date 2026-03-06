// =========================================
// DATOS ESTÁTICOS DEL JUEGO Y CONFIGURACIÓN
// =========================================

export const activeSlot = sessionStorage.getItem('activeSlot') || '1';
export const SAVE_KEY = 'miniRPG_WorldSave_' + activeSlot;

export const GAME_VERSION = '1.0.0';

export const skillsData = {
    'golpe_brutal': { id: 'golpe_brutal', name: 'Golpe Brutal', type: 'special', resource: 'ep', cost: 10, icon: '💥', desc: 'Ataca con el doble de tu fuerza física.', req: null, class: 'Guerrero' },
    'corte_cruzado': { id: 'corte_cruzado', name: 'Corte Cruzado', type: 'special', resource: 'ep', cost: 25, icon: '⚔️', desc: 'Ataque devastador que golpea 3 veces seguidas.', req: 'golpe_brutal', class: 'Guerrero' },
    'grito_guerra': { id: 'grito_guerra', name: 'Grito Guerra', type: 'defensive', resource: 'ep', cost: 15, icon: '🛡️', desc: 'Aumenta enormemente tu defensa por 3 turnos.', req: null, class: 'Guerrero' },
    'piel_hierro': { id: 'piel_hierro', name: 'Piel de Hierro', type: 'defensive', resource: 'ep', cost: 20, icon: '🗿', desc: 'Aumenta tu defensa y cura tus heridas levemente.', req: 'grito_guerra', class: 'Guerrero' },

    'tiro_doble': { id: 'tiro_doble', name: 'Tiro Doble', type: 'special', resource: 'ep', cost: 12, icon: '🏹', desc: 'Dispara dos flechas rápidas.', req: null, class: 'Arquero' },
    'lluvia_flechas': { id: 'lluvia_flechas', name: 'Lluvia de Flechas', type: 'special', resource: 'ep', cost: 25, icon: '🌧️', desc: 'Dispara una ráfaga que impacta 4 veces al enemigo.', req: 'tiro_doble', class: 'Arquero' },
    'flecha_venenosa': { id: 'flecha_venenosa', name: 'Veneno', type: 'defensive', resource: 'ep', cost: 10, icon: '🐍', desc: 'Inyecta veneno que drena vida por 4 turnos.', req: null, class: 'Arquero' },
    'trampa_espinas': { id: 'trampa_espinas', name: 'Trampa Letal', type: 'defensive', resource: 'ep', cost: 18, icon: '🕸️', desc: 'Veneno doblemente fuerte e inmediato.', req: 'flecha_venenosa', class: 'Arquero' },

    'fuego': { id: 'fuego', name: 'Bola de Fuego', type: 'special', resource: 'mp', cost: 12, icon: '🔥', desc: 'Lanza fuego que hace daño mágico moderado.', req: null, class: 'Mago' },
    'meteorito': { id: 'meteorito', name: 'Meteorito', type: 'special', resource: 'mp', cost: 35, icon: '☄️', desc: 'Invoca un meteoro con daño mágico masivo.', req: 'fuego', class: 'Mago' },
    'curar': { id: 'curar', name: 'Curación', type: 'defensive', resource: 'mp', cost: 15, icon: '💚', desc: 'Restaura gran parte de tu salud usando magia.', req: null, class: 'Mago' },
    'drenar_vida': { id: 'drenar_vida', name: 'Drenar Vida', type: 'defensive', resource: 'mp', cost: 25, icon: '🦇', desc: 'Roba vida al enemigo y te cura.', req: 'curar', class: 'Mago' }
};

export const charactersData = {
    'caballero': { id: 'caballero', name: 'Caballero Vanguardia', role: 'Guerrero', desc: 'Tanque duro de matar. Excelente armadura y regeneración.', stats: { hp: 120, hpReg: 5, mp: 0, ep: 100, ad: 15, ap: 0, armor: 25, mr: 15, ms: 300, crit: 0, lifesteal: 0 }, imgs: { map: 'img/player/guerrero_mapa.png', combat: 'img/player/guerrero_combate.png' } },
    'berserker': { id: 'berserker', name: 'Berserker Sediento', role: 'Guerrero', desc: 'Guerrero ofensivo con Robo de Vida base y mucho Daño.', stats: { hp: 90, hpReg: 2, mp: 0, ep: 80, ad: 22, ap: 0, armor: 10, mr: 10, ms: 315, crit: 0.1, lifesteal: 0.05 }, imgs: { map: 'img/player/guerrero_mapa.png', combat: 'img/player/guerrero_combate.png' } },
    'cazador': { id: 'cazador', name: 'Cazador Ágil', role: 'Arquero', desc: 'Alta velocidad de ataque y movimiento.', stats: { hp: 70, hpReg: 2, mp: 40, ep: 80, ad: 18, ap: 0, armor: 8, mr: 8, ms: 330, crit: 0.15, lifesteal: 0 }, imgs: { map: 'img/player/arquero_mapa.png', combat: 'img/player/arquero_combate.png' } },
    'francotirador': { id: 'francotirador', name: 'Tirador Letal', role: 'Arquero', desc: 'Lento pero letal. Inicia con Letalidad para perforar armaduras.', stats: { hp: 65, hpReg: 1, mp: 60, ep: 50, ad: 25, ap: 0, armor: 5, mr: 5, ms: 290, crit: 0.05, lifesteal: 0 }, imgs: { map: 'img/player/arquero_mapa.png', combat: 'img/player/arquero_combate.png' } },
    'hechicero': { id: 'hechicero', name: 'Hechicero Arcano', role: 'Mago', desc: 'Maestro del daño mágico explosivo.', stats: { hp: 55, hpReg: 1, mp: 150, ep: 0, ad: 5, ap: 30, armor: 4, mr: 12, ms: 300, crit: 0, lifesteal: 0 }, imgs: { map: 'img/player/mago_mapa.png', combat: 'img/player/mago_combate.png' } },
    'brujo': { id: 'brujo', name: 'Brujo de Sangre', role: 'Mago', desc: 'Mago oscuro que recupera vida al hacer daño.', stats: { hp: 75, hpReg: 3, mp: 100, ep: 0, ad: 8, ap: 20, armor: 8, mr: 15, ms: 295, crit: 0, lifesteal: 0 }, imgs: { map: 'img/player/mago_mapa.png', combat: 'img/player/mago_combate.png' } },
    'aldeano': { id: 'aldeano', name: 'Aldeano Ahorrador', role: 'Simple', desc: 'Estadísticas mediocres, pero empieza con 200 de Oro.', stats: { hp: 60, hpReg: 1, mp: 20, ep: 40, ad: 8, ap: 8, armor: 5, mr: 5, ms: 300, crit: 0, lifesteal: 0 }, imgs: { map: 'img/player/simple_mapa.png', combat: 'img/player/simple_combate.png' } }
};

export const MAP_W = 100; 
export const MAP_H = 100;

export const npcsData = [
    { name: 'Alcalde Rufus', img: 'img/npcs/alcalde.png', dialogues: ['¡Por favor, héroe! El mundo está en peligro.'] },
    { name: 'Herrero Balder', img: 'img/npcs/herrero.png', dialogues: ['Las armas no se forjan solas. ¡Ayúdame a limpiar la zona!'] },
    { name: 'Sabia Elara', img: 'img/npcs/sabia.png', dialogues: ['Siento una perturbación en el flujo del maná... Ve a investigar.'] }
];

// NUEVOS ÍTEMS CON ESTADÍSTICAS MOBA
export const mapData = [
    { rarity: 'Común', css: 'rarity-comun', colorClass: 'color-comun', colorHex: '#888', recLevel: '1-3', newEnemies: [{ name: 'Slime', hp: 15, atk: 7, def: 1, mag: 2, gold: 3, xp: 4, img: 'img/enemies/green_slime.png' }, { name: 'Rata', hp: 12, atk: 9, def: 0, mag: 0, gold: 3, xp: 4, img: 'img/enemies/rat.png' }], boss: { name: 'Slime Gigante', hp: 50, atk: 12, def: 3, mag: 4, trait: 'regen', gold: 25, xp: 25, img: 'img/bosses/giant_slime.png' }, 
      shop: { 
        weapons: [
            { name: 'Daga Oxidada', ad: 4, ap: 0, crit: 0.05, lifesteal: 0.02, lethality: 0, magicPen: 0, price: 30, icon: 'iron_dagger.png' },
            { name: 'Rama Mágica', ad: 0, ap: 6, crit: 0, lifesteal: 0, lethality: 0, magicPen: 2, price: 30, icon: 'wood_staff.png' },
            { name: 'Arco de Caza', ad: 3, ap: 0, crit: 0.02, lifesteal: 0, lethality: 2, magicPen: 0, price: 30, icon: 'wood_bow.png' }
        ], 
        armors: [
            { name: 'Harapos de Cuero', armor: 3, mr: 1, hpBonus: 20, mpBonus: 0, price: 40, icon: 'leather_vest.png' },
            { name: 'Túnica de Novicio', armor: 1, mr: 4, hpBonus: 0, mpBonus: 30, price: 40, icon: 'torn_robe.png' },
            { name: 'Capa de Viajero', armor: 2, mr: 2, hpBonus: 10, mpBonus: 10, price: 40, icon: 'hunter_cloak.png' }
        ] 
      } 
    },
    { rarity: 'Poco Común', css: 'rarity-pococomun', colorClass: 'color-pococomun', colorHex: '#4caf50', recLevel: '4-6', newEnemies: [{ name: 'Goblin', hp: 25, atk: 12, def: 2, mag: 0, gold: 6, xp: 8, img: 'img/enemies/goblin.png' }], boss: { name: 'Rey Goblin', hp: 90, atk: 18, def: 4, mag: 5, trait: 'crit', gold: 60, xp: 40, img: 'img/bosses/king_goblin.png' }, 
      shop: { 
        weapons: [
            { name: 'Espada Larga', ad: 10, ap: 0, crit: 0.1, lifesteal: 0.05, lethality: 0, magicPen: 0, price: 90, icon: 'steel_sword.png' },
            { name: 'Orbe de Cristal', ad: 0, ap: 15, crit: 0, lifesteal: 0, lethality: 0, magicPen: 5, price: 90, icon: 'crystal_scepter.png' },
            { name: 'Arco Compuesto', ad: 8, ap: 0, crit: 0.05, lifesteal: 0, lethality: 5, magicPen: 0, price: 90, icon: 'composite_bow.png' }
        ], 
        armors: [
            { name: 'Cota de Malla', armor: 10, mr: 3, hpBonus: 50, mpBonus: 0, price: 120, icon: 'chainmail.png' },
            { name: 'Manto Místico', armor: 3, mr: 12, hpBonus: 10, mpBonus: 60, price: 120, icon: 'mystic_mantle.png' },
            { name: 'Jubón Reforzado', armor: 6, mr: 6, hpBonus: 30, mpBonus: 20, price: 120, icon: 'reinforced_tunic.png' }
        ] 
      } 
    },
    { rarity: 'Raro', css: 'rarity-raro', colorClass: 'color-raro', colorHex: '#2196f3', recLevel: '7-10', newEnemies: [{ name: 'Lobo Oscuro', hp: 40, atk: 18, def: 3, mag: 0, gold: 12, xp: 14, img: 'img/enemies/dark_wolf.png' }], boss: { name: 'Bestia Alfa', hp: 150, atk: 25, def: 6, mag: 8, trait: 'crit', gold: 120, xp: 80, img: 'img/bosses/aplha_beast.png' }, 
      shop: { 
        weapons: [
            { name: 'Mandoble del León', ad: 18, ap: 0, crit: 0.15, lifesteal: 0.08, lethality: 0, magicPen: 0, price: 250, icon: 'long_sword.png' },
            { name: 'Bastón Lunar', ad: 0, ap: 28, crit: 0, lifesteal: 0, lethality: 0, magicPen: 10, price: 250, icon: 'lunar_staff.png' },
            { name: 'Arco Perforante', ad: 14, ap: 0, crit: 0.1, lifesteal: 0, lethality: 12, magicPen: 0, price: 250, icon: 'long_bow.png' }
        ], 
        armors: [
            { name: 'Armadura Placas', armor: 22, mr: 8, hpBonus: 100, mpBonus: 0, price: 400, icon: 'steel_armor.png' },
            { name: 'Túnica Estelar', armor: 6, mr: 25, hpBonus: 30, mpBonus: 120, price: 400, icon: 'stellar_robe.png' },
            { name: 'Armadura Ágil', armor: 14, mr: 14, hpBonus: 60, mpBonus: 40, price: 400, icon: 'light_armor.png' }
        ] 
      } 
    },
    { rarity: 'Épico', css: 'rarity-epico', colorClass: 'color-epico', colorHex: '#9c27b0', recLevel: '11-15', newEnemies: [{ name: 'Caballero Maldito', hp: 65, atk: 25, def: 6, mag: 10, gold: 25, xp: 28, img: 'img/enemies/cursed_knight.png' }], boss: { name: 'Caballero Oscuro', hp: 250, atk: 35, def: 10, mag: 15, trait: 'vampire', gold: 250, xp: 150, img: 'img/bosses/dark_knight.png' }, 
      shop: { 
        weapons: [
            { name: 'Hoja del Vacío', ad: 30, ap: 0, crit: 0.20, lifesteal: 0.12, lethality: 5, magicPen: 0, price: 750, icon: 'dark_greatsword.png' },
            { name: 'Grimorio Maldito', ad: 0, ap: 45, crit: 0, lifesteal: 0, lethality: 0, magicPen: 20, price: 750, icon: 'void_staff.png' },
            { name: 'Arco de Sombras', ad: 24, ap: 0, crit: 0.15, lifesteal: 0.05, lethality: 20, magicPen: 0, price: 750, icon: 'shadow_bow.png' }
        ], 
        armors: [
            { name: 'Coraza Oscura', armor: 40, mr: 15, hpBonus: 200, mpBonus: 0, price: 1200, icon: 'dark_plate.png' },
            { name: 'Túnica Espectral', armor: 12, mr: 45, hpBonus: 50, mpBonus: 250, price: 1200, icon: 'spectral_robe.png' },
            { name: 'Manto de Asesino', armor: 25, mr: 25, hpBonus: 120, mpBonus: 80, price: 1200, icon: 'assassin_mantle.png' }
        ] 
      } 
    },
    { rarity: 'Legendario', css: 'rarity-legendario', colorClass: 'color-legendario', colorHex: '#ff9800', recLevel: '16-20', newEnemies: [{ name: 'Demonio', hp: 100, atk: 35, def: 8, mag: 20, gold: 50, xp: 60, img: 'img/enemies/infernal_demon.png' }], boss: { name: 'Señor Demonio', hp: 450, atk: 50, def: 15, mag: 25, trait: 'vampire', gold: 500, xp: 300, img: 'img/bosses/lord_demon.png' }, 
      shop: { 
        weapons: [
            { name: 'Hacha Infernal', ad: 50, ap: 0, crit: 0.25, lifesteal: 0.15, lethality: 10, magicPen: 0, price: 2200, icon: 'chaos_axe.png' },
            { name: 'Cetro Solar', ad: 0, ap: 75, crit: 0, lifesteal: 0, lethality: 0, magicPen: 35, price: 2200, icon: 'solar_scepter.png' },
            { name: 'Arco de Fuego', ad: 40, ap: 0, crit: 0.20, lifesteal: 0.08, lethality: 30, magicPen: 0, price: 2200, icon: 'fire_bow.png' }
        ], 
        armors: [
            { name: 'Coraza del Caos', armor: 70, mr: 25, hpBonus: 400, mpBonus: 0, price: 3500, icon: 'chaos_plate.png' },
            { name: 'Manto de Fuego', armor: 20, mr: 75, hpBonus: 100, mpBonus: 400, price: 3500, icon: 'infernal_mantle.png' },
            { name: 'Armadura Dragón', armor: 45, mr: 45, hpBonus: 250, mpBonus: 150, price: 3500, icon: 'scaled_armor.png' }
        ] 
      } 
    },
    { rarity: 'Mítico', css: 'rarity-mitico', colorClass: 'color-mitico', colorHex: '#ffeb3b', recLevel: '21+', newEnemies: [{ name: 'Dragón Antiguo', hp: 180, atk: 50, def: 12, mag: 30, gold: 100, xp: 120, img: 'img/enemies/dragon.png' }], boss: { name: 'Dragón Dorado', hp: 800, atk: 70, def: 25, mag: 40, trait: 'regen', gold: 1000, xp: 600, img: 'img/bosses/golden_dragon.png' }, 
      shop: { 
        weapons: [
            { name: 'Lanza Divina', ad: 80, ap: 0, crit: 0.35, lifesteal: 0.20, lethality: 20, magicPen: 0, price: 6500, icon: 'divine_spear.png' },
            { name: 'Báculo del Tiempo', ad: 0, ap: 120, crit: 0, lifesteal: 0, lethality: 0, magicPen: 50, price: 6500, icon: 'time_staff.png' },
            { name: 'Arco Celestial', ad: 65, ap: 0, crit: 0.30, lifesteal: 0.10, lethality: 45, magicPen: 0, price: 6500, icon: 'celestial_bow.png' }
        ], 
        armors: [
            { name: 'Coraza Divina', armor: 100, mr: 40, hpBonus: 800, mpBonus: 0, price: 12000, icon: 'divine_plate.png' },
            { name: 'Túnica Astral', armor: 30, mr: 110, hpBonus: 200, mpBonus: 800, price: 12000, icon: 'astral_robe.png' },
            { name: 'Manto Etéreo', armor: 65, mr: 65, hpBonus: 500, mpBonus: 300, price: 12000, icon: 'ethereal_mantle.png' }
        ] 
      } 
    }
];
             
