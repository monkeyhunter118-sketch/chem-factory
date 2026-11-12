const CELL_SIZE = 50;
const TICK_RATE = 800; // 800ms per tick

// Level Config
const LEVEL_CONFIG = {
    1: { title: "Basiselementen (H₂O, H₂O₂)", costNext: 1500 },
    2: { title: "Organische Basis (CO₂, NH₃, CH₄, H₂CO₃)", costNext: 8000 },
    3: { title: "Zuren & Zouten (HCl, SO₂, NO₂, HNO₃, H₂SO₄, NH₄Cl, NH₄NO₃)", costNext: 35000 },
    4: { title: "Industriële Synthese (Ethanol, Azijnzuur, Glucose, Ethyleen, Benzeen)", costNext: 100000 },
    5: { title: "Geavanceerde Biochemie & Explosieven (TNT, Suiker, Aspirine)", costNext: 250000 }
};

// Receptenverzameling met minPrices en craftTicks
const RECIPES = [
    // --- LEVEL 1 ---
    { id: 'H2O', name: 'Water', formula: 'H₂O', req: { 'H': 2, 'O': 1 }, craftTicks: 1, baseValue: 60, currentValue: 60, minPrice: 35, lvl: 1, color: '#38ada9' },
    { id: 'H2O2', name: 'Waterstofperoxide', formula: 'H₂O₂', req: { 'H': 2, 'O': 2 }, craftTicks: 2, baseValue: 120, currentValue: 120, minPrice: 70, lvl: 1, color: '#74b9ff' },
    
    // --- LEVEL 2 ---
    { id: 'CO', name: 'Koolmonoxide', formula: 'CO', req: { 'C': 1, 'O': 1 }, craftTicks: 2, baseValue: 90, currentValue: 90, minPrice: 50, lvl: 2, color: '#b2bec3' },
    { id: 'CO2', name: 'Koolstofdioxide', formula: 'CO₂', req: { 'C': 1, 'O': 2 }, craftTicks: 2, baseValue: 150, currentValue: 150, minPrice: 85, lvl: 2, color: '#78e08f' },
    { id: 'NH3', name: 'Ammoniak', formula: 'NH₃', req: { 'N': 1, 'H': 3 }, craftTicks: 2, baseValue: 220, currentValue: 220, minPrice: 120, lvl: 2, color: '#f6b93b' },
    { id: 'CH4', name: 'Methaan', formula: 'CH₄', req: { 'C': 1, 'H': 4 }, craftTicks: 3, baseValue: 350, currentValue: 350, minPrice: 190, lvl: 2, color: '#e67e22' },
    { id: 'H2CO3', name: 'Koolzuur', formula: 'H₂CO₃', req: { 'H2O': 1, 'CO2': 1 }, craftTicks: 3, baseValue: 550, currentValue: 550, minPrice: 300, lvl: 2, color: '#a29bfe' },

    // --- LEVEL 3 ---
    { id: 'HCl', name: 'Zoutzuur', formula: 'HCl', req: { 'H': 1, 'Cl': 1 }, craftTicks: 2, baseValue: 180, currentValue: 180, minPrice: 100, lvl: 3, color: '#e55039' },
    { id: 'SO2', name: 'Zwaveldioxide', formula: 'SO₂', req: { 'S': 1, 'O': 2 }, craftTicks: 2, baseValue: 280, currentValue: 280, minPrice: 150, lvl: 3, color: '#4a69bd' },
    { id: 'NO2', name: 'Stikstofdioxide', formula: 'NO₂', req: { 'N': 1, 'O': 2 }, craftTicks: 2, baseValue: 320, currentValue: 320, minPrice: 180, lvl: 3, color: '#fd79a8' },
    { id: 'Cl2', name: 'Chloorgas', formula: 'Cl₂', req: { 'Cl': 2 }, craftTicks: 2, baseValue: 400, currentValue: 400, minPrice: 220, lvl: 3, color: '#00b894' },
    { id: 'NH4Cl', name: 'Salmiak', formula: 'NH₄Cl', req: { 'NH3': 1, 'HCl': 1 }, craftTicks: 3, baseValue: 750, currentValue: 750, minPrice: 400, lvl: 3, color: '#fab1a0' },
    { id: 'HNO3', name: 'Salpeterzuur', formula: 'HNO₃', req: { 'H2O': 1, 'NO2': 2 }, craftTicks: 4, baseValue: 1350, currentValue: 1350, minPrice: 750, lvl: 3, color: '#ff7675' },
    { id: 'H2SO4', name: 'Zwavelzuur', formula: 'H₂SO₄', req: { 'H2O': 1, 'SO2': 1, 'O': 1 }, craftTicks: 4, baseValue: 1650, currentValue: 1650, minPrice: 900, lvl: 3, color: '#b8e994' },
    { id: 'NH4NO3', name: 'Ammoniumnitraat', formula: 'NH₄NO₃', req: { 'NH3': 1, 'HNO3': 1 }, craftTicks: 5, baseValue: 2800, currentValue: 2800, minPrice: 1500, lvl: 3, color: '#ffeaa7' },

    // --- LEVEL 4 ---
    { id: 'C2H6O', name: 'Ethanol', formula: 'C₂H₆O', req: { 'C': 2, 'H': 6, 'O': 1 }, craftTicks: 4, baseValue: 2400, currentValue: 2400, minPrice: 1300, lvl: 4, color: '#fdcb6e' },
    { id: 'C2H4', name: 'Ethyleen', formula: 'C₂H₄', req: { 'C2H6O': 1 }, craftTicks: 3, baseValue: 3200, currentValue: 3200, minPrice: 1800, lvl: 4, color: '#ffeaa7' },
    { id: 'C2H4O2', name: 'Azijnzuur', formula: 'C₂H₄O₂', req: { 'C2H6O': 1, 'O': 2 }, craftTicks: 4, baseValue: 4200, currentValue: 4200, minPrice: 2300, lvl: 4, color: '#e17055' },
    { id: 'CHCl3', name: 'Chloroform', formula: 'CHCl₃', req: { 'CH4': 1, 'Cl2': 2 }, craftTicks: 5, baseValue: 5800, currentValue: 5800, minPrice: 3200, lvl: 4, color: '#00cec9' },
    { id: 'CH4N2O', name: 'Ureum', formula: 'CH₄N₂O', req: { 'NH3': 2, 'CO2': 1 }, craftTicks: 5, baseValue: 7200, currentValue: 7200, minPrice: 4000, lvl: 4, color: '#6c5ce7' },
    { id: 'C6H6', name: 'Benzeen', formula: 'C₆H₆', req: { 'C2H4': 3 }, craftTicks: 6, baseValue: 11500, currentValue: 11500, minPrice: 6500, lvl: 4, color: '#d63031' },
    { id: 'C6H12O6', name: 'Glucose', formula: 'C₆H₁₂O₆', req: { 'CO2': 3, 'H2O': 3 }, craftTicks: 7, baseValue: 14000, currentValue: 14000, minPrice: 8000, lvl: 4, color: '#f8c291' },

    // --- LEVEL 5 ---
    { id: 'C3H5N3O9', name: 'Nitroglycerine', formula: 'C₃H₅N₃O₉', req: { 'C': 3, 'HNO3': 2, 'H2SO4': 1 }, craftTicks: 8, baseValue: 24000, currentValue: 24000, minPrice: 14000, lvl: 5, color: '#d63031' },
    { id: 'C9H8O4', name: 'Aspirine', formula: 'C₉H₈O₄', req: { 'C2H4O2': 1, 'C6H6': 1, 'O': 2 }, craftTicks: 8, baseValue: 31000, currentValue: 31000, minPrice: 18000, lvl: 5, color: '#74b9ff' },
    { id: 'C12H22O11', name: 'Suiker (Sucrose)', formula: 'C₁₂H₂₂O₁₁', req: { 'C6H12O6': 2 }, craftTicks: 8, baseValue: 36000, currentValue: 36000, minPrice: 20000, lvl: 5, color: '#fdcb6e' },
    { id: 'C7H5N3O6', name: 'TNT', formula: 'C₇H₅N₃O₆', req: { 'C6H6': 1, 'HNO3': 2, 'H2SO4': 1 }, craftTicks: 10, baseValue: 48000, currentValue: 48000, minPrice: 27000, lvl: 5, color: '#ff4757' }
];

const ITEM_ICONS = {
    'H': '💧', 'C': '🪨', 'N': '💨', 'O': '🔥', 'S': '🟡', 'Cl': '🧪',
    'H2O': '💧', 'H2O2': '🧪', 'CO': '💨', 'CO2': '💨', 'NH3': '💨', 'CH4': '🔥',
    'H2CO3': '🧪', 'HCl': '🧪', 'SO2': '💨', 'NO2': '💨', 'Cl2': '🧪', 'NH4Cl': '🧂',
    'HNO3': '🧪', 'H2SO4': '🧪', 'NH4NO3': '🧂', 'C2H6O': '🍺', 'C2H4': '🧪',
    'C2H4O2': '🧪', 'CHCl3': '🧪', 'CH4N2O': '🧪', 'C6H6': '🧪', 'C6H12O6': '🍬',
    'C3H5N3O9': '💥', 'C9H8O4': '💊', 'C12H22O11': '🍬', 'C7H5N3O6': '💣'
};

const ELEMENT_VALUES = { 'H': 2, 'C': 5, 'N': 8, 'O': 3, 'S': 12, 'Cl': 15 };
const ELEMENT_COLORS = { 'H': '#48dbfb', 'C': '#ffffff', 'N': '#a55eea', 'O': '#ff6b6b', 'S': '#fecb57', 'Cl': '#1dd1a1' };

// Gebouwenlijst met 3 Tiers Chemische Mixers (met hun eigen specifieke snelheid & stijl)
const BUILDINGS = [
    { id: 'cursor', name: '🖱️ Muis (Deselecteren / Instellen)', price: 0, lvl: 1 },
    { id: 'rotate', name: '🔄 Bouwrichting [Sneltoets: R]', price: 0, lvl: 1 },
    { id: 'blueprint', name: '📋 Blauwdruk Maken / Plaatsen', price: 0, lvl: 1 },
    
    { id: 'conveyor', name: 'Lopende Band', price: 10, lvl: 1 },
    { id: 'conveyor-curve', name: 'Bocht Rechts ↪️', price: 15, lvl: 1 },
    { id: 'conveyor-curve-left', name: 'Bocht Links ↩️', price: 15, lvl: 1 },
    { id: 'conveyor-t', name: 'T-Splitsing ┳', price: 20, lvl: 1 },
    { id: 'conveyor-cross', name: 'Kruispunt ╋', price: 25, lvl: 1 },
    { id: 'splitter', name: 'Splitser 🔀', price: 30, lvl: 1 },

    // 3 Tiers van Mixers:
    { id: 'mixer', name: '🧪 Mixer Mk1 (Standaard - 1x Speed)', price: 300, lvl: 1, speed: 1.0 },
    { id: 'mixer-mk2', name: '🧪 Mixer Mk2 (Geavanceerd - 1.5x Speed)', price: 1200, lvl: 3, speed: 1.5 },
    { id: 'mixer-mk3', name: '🧪 Mixer Mk3 (Industrieel - 2.5x Speed)', price: 4500, lvl: 4, speed: 2.5 },

    { id: 'inleverpunt', name: '🏢 Inleverpunt (Max 3)', price: 100, lvl: 1 },
    
    { id: 'source-h', name: '💧 H-Bron (Waterstof)', price: 100, lvl: 1 },
    { id: 'source-c', name: '🪨 C-Bron (Koolstof)', price: 400, lvl: 2 },
    { id: 'source-n', name: '💨 N-Bron (Stikstof)', price: 500, lvl: 2 },
    { id: 'source-o', name: '🔥 O-Bron (Zuurstof)', price: 150, lvl: 1 },
    { id: 'source-s', name: '🟡 S-Bron (Zwavel)', price: 800, lvl: 3 },
    { id: 'source-cl', name: '🧪 Cl-Bron (Chloor)', price: 1000, lvl: 3 },
    
    { id: 'delete', name: '🗑️ Delete [Sneltoets: X]', price: 0, lvl: 1 }
];

const DIRS = [ {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0} ];
const DIR_ARROWS = ['⬆️', '➡️', '⬇️', '⬅️'];
const CURVE_RIGHT_ARROWS = ['↱', '↴', '↲', '↰'];
const CURVE_LEFT_ARROWS = ['↰', '↱', '↴', '↲'];
const T_ARROWS = ['┳', '┫', '┻', '┣'];