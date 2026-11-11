const CELL_SIZE = 50;
let GRID_WIDTH = Math.floor((window.innerWidth - 340) / CELL_SIZE) * 3;
let GRID_HEIGHT = Math.floor(window.innerHeight / CELL_SIZE) * 3;
const TICK_RATE = 800; // Gehalveerde tickrate (800ms per tick)

// Game State
let money = 1000;
let playerLevel = 1;
let selectedTool = 'cursor';
let toolPrice = 0;
let currentBuildDir = 1;
let activeMixerKey = null;
let currentTab = 'build';
let tickCounter = 0;

// Blauwdruk State
let savedBlueprint = null;
let blueprintCost = 0;
let blueprintStep = 0;
let bpStartX = null;
let bpStartY = null;

// Level config
const LEVEL_CONFIG = {
    1: { title: "Basiselementen (H₂O, H₂O₂)", costNext: 1500 },
    2: { title: "Organische Basis (CO₂, NH₃, CH₄, H₂CO₃)", costNext: 8000 },
    3: { title: "Zuren & Zouten (HCl, SO₂, NO₂, HNO₃, H₂SO₄, NH₄Cl, NH₄NO₃)", costNext: 35000 },
    4: { title: "Industriële Synthese (Ethanol, Azijnzuur, Glucose, Ethyleen, Benzeen)", costNext: 100000 },
    5: { title: "Geavanceerde Biochemie & Explosieven (TNT, Suiker, Aspirine)", costNext: 250000 }
};

// Chemical Recipes (met intermediate benodigdheden zoals H2O, CO2, HNO3 etc.)
const RECIPES = [
    // --- LEVEL 1 ---
    { id: 'H2O', name: 'Water', formula: 'H₂O', req: { 'H': 2, 'O': 1 }, craftTicks: 1, baseValue: 60, currentValue: 60, lvl: 1, color: '#38ada9' },
    { id: 'H2O2', name: 'Waterstofperoxide', formula: 'H₂O₂', req: { 'H': 2, 'O': 2 }, craftTicks: 2, baseValue: 120, currentValue: 120, lvl: 1, color: '#74b9ff' },
    
    // --- LEVEL 2 ---
    { id: 'CO', name: 'Koolmonoxide', formula: 'CO', req: { 'C': 1, 'O': 1 }, craftTicks: 2, baseValue: 90, currentValue: 90, lvl: 2, color: '#b2bec3' },
    { id: 'CO2', name: 'Koolstofdioxide', formula: 'CO₂', req: { 'C': 1, 'O': 2 }, craftTicks: 2, baseValue: 150, currentValue: 150, lvl: 2, color: '#78e08f' },
    { id: 'NH3', name: 'Ammoniak', formula: 'NH₃', req: { 'N': 1, 'H': 3 }, craftTicks: 2, baseValue: 220, currentValue: 220, lvl: 2, color: '#f6b93b' },
    { id: 'CH4', name: 'Methaan', formula: 'CH₄', req: { 'C': 1, 'H': 4 }, craftTicks: 3, baseValue: 350, currentValue: 350, lvl: 2, color: '#e67e22' },
    { id: 'H2CO3', name: 'Koolzuur', formula: 'H₂CO₃', req: { 'H2O': 1, 'CO2': 1 }, craftTicks: 3, baseValue: 550, currentValue: 550, lvl: 2, color: '#a29bfe' }, // Vereist Water & CO2!

    // --- LEVEL 3 ---
    { id: 'HCl', name: 'Zoutzuur', formula: 'HCl', req: { 'H': 1, 'Cl': 1 }, craftTicks: 2, baseValue: 180, currentValue: 180, lvl: 3, color: '#e55039' },
    { id: 'SO2', name: 'Zwaveldioxide', formula: 'SO₂', req: { 'S': 1, 'O': 2 }, craftTicks: 2, baseValue: 280, currentValue: 280, lvl: 3, color: '#4a69bd' },
    { id: 'NO2', name: 'Stikstofdioxide', formula: 'NO₂', req: { 'N': 1, 'O': 2 }, craftTicks: 2, baseValue: 320, currentValue: 320, lvl: 3, color: '#fd79a8' },
    { id: 'Cl2', name: 'Chloorgas', formula: 'Cl₂', req: { 'Cl': 2 }, craftTicks: 2, baseValue: 400, currentValue: 400, lvl: 3, color: '#00b894' },
    { id: 'NH4Cl', name: 'Salmiak', formula: 'NH₄Cl', req: { 'NH3': 1, 'HCl': 1 }, craftTicks: 3, baseValue: 750, currentValue: 750, lvl: 3, color: '#fab1a0' }, // Vereist Ammoniak & Zoutzuur
    { id: 'HNO3', name: 'Salpeterzuur', formula: 'HNO₃', req: { 'H2O': 1, 'NO2': 2 }, craftTicks: 4, baseValue: 1350, currentValue: 1350, lvl: 3, color: '#ff7675' }, // Vereist Water & NO2
    { id: 'H2SO4', name: 'Zwavelzuur', formula: 'H₂SO₄', req: { 'H2O': 1, 'SO2': 1, 'O': 1 }, craftTicks: 4, baseValue: 1650, currentValue: 1650, lvl: 3, color: '#b8e994' }, // Vereist Water & SO2
    { id: 'NH4NO3', name: 'Ammoniumnitraat', formula: 'NH₄NO₃', req: { 'NH3': 1, 'HNO3': 1 }, craftTicks: 5, baseValue: 2800, currentValue: 2800, lvl: 3, color: '#ffeaa7' },

    // --- LEVEL 4 ---
    { id: 'C2H6O', name: 'Ethanol', formula: 'C₂H₆O', req: { 'C': 2, 'H': 6, 'O': 1 }, craftTicks: 4, baseValue: 2400, currentValue: 2400, lvl: 4, color: '#fdcb6e' },
    { id: 'C2H4', name: 'Ethyleen', formula: 'C₂H₄', req: { 'C2H6O': 1 }, craftTicks: 3, baseValue: 3200, currentValue: 3200, lvl: 4, color: '#ffeaa7' }, // Dehydratatie van Ethanol
    { id: 'C2H4O2', name: 'Azijnzuur', formula: 'C₂H₄O₂', req: { 'C2H6O': 1, 'O': 2 }, craftTicks: 4, baseValue: 4200, currentValue: 4200, lvl: 4, color: '#e17055' }, // Ethanol + O2
    { id: 'CHCl3', name: 'Chloroform', formula: 'CHCl₃', req: { 'CH4': 1, 'Cl2': 2 }, craftTicks: 5, baseValue: 5800, currentValue: 5800, lvl: 4, color: '#00cec9' },
    { id: 'CH4N2O', name: 'Ureum', formula: 'CH₄N₂O', req: { 'NH3': 2, 'CO2': 1 }, craftTicks: 5, baseValue: 7200, currentValue: 7200, lvl: 4, color: '#6c5ce7' },
    { id: 'C6H6', name: 'Benzeen', formula: 'C₆H₆', req: { 'C2H4': 3 }, craftTicks: 6, baseValue: 11500, currentValue: 11500, lvl: 4, color: '#d63031' }, // 3x Ethyleen
    { id: 'C6H12O6', name: 'Glucose', formula: 'C₆H₁₂O₆', req: { 'CO2': 3, 'H2O': 3 }, craftTicks: 7, baseValue: 14000, currentValue: 14000, lvl: 4, color: '#f8c291' }, // Fotosynthese

    // --- LEVEL 5 ---
    { id: 'C3H5N3O9', name: 'Nitroglycerine', formula: 'C₃H₅N₃O₉', req: { 'C': 3, 'HNO3': 2, 'H2SO4': 1 }, craftTicks: 8, baseValue: 24000, currentValue: 24000, lvl: 5, color: '#d63031' },
    { id: 'C9H8O4', name: 'Aspirine', formula: 'C₉H₈O₄', req: { 'C2H4O2': 1, 'C6H6': 1, 'O': 2 }, craftTicks: 8, baseValue: 31000, currentValue: 31000, lvl: 5, color: '#74b9ff' },
    { id: 'C12H22O11', name: 'Suiker (Sucrose)', formula: 'C₁₂H₂₂O₁₁', req: { 'C6H12O6': 2 }, craftTicks: 8, baseValue: 36000, currentValue: 36000, lvl: 5, color: '#fdcb6e' },
    { id: 'C7H5N3O6', name: 'TNT', formula: 'C₇H₅N₃O₆', req: { 'C6H6': 1, 'HNO3': 2, 'H2SO4': 1 }, craftTicks: 10, baseValue: 48000, currentValue: 48000, lvl: 5, color: '#ff4757' }
];

const ELEMENT_VALUES = { 'H': 2, 'C': 5, 'N': 8, 'O': 3, 'S': 12, 'Cl': 15 };
const ELEMENT_COLORS = { 'H': '#48dbfb', 'C': '#ffffff', 'N': '#a55eea', 'O': '#ff6b6b', 'S': '#fecb57', 'Cl': '#1dd1a1' };

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

    { id: 'mixer', name: '🧪 Chemische Mixer', price: 300, lvl: 1 },
    { id: 'inleverpunt', name: '🏢 Inleverpunt (Max 3)', price: 100, lvl: 1 },
    
    { id: 'source-h', name: '💧 H-Bron (Waterstof)', price: 100, lvl: 1 },
    { id: 'source-c', name: '🪨 C-Bron (Koolstof)', price: 400, lvl: 2 },
    { id: 'source-n', name: '💨 N-Bron (Stikstof)', price: 500, lvl: 2 },
    { id: 'source-o', name: '🔥 O-Bron (Zuurstof)', price: 150, lvl: 1 },
    { id: 'source-s', name: '🟡 S-Bron (Zwavel)', price: 800, lvl: 3 },
    { id: 'source-cl', name: '🧪 Cl-Bron (Chloor)', price: 1000, lvl: 3 },
    
    { id: 'delete', name: '🗑️ Delete [Sneltoets: X]', price: 0, lvl: 1 }
];

const grid = {}; 
let items = []; 
let itemIdCounter = 0;

const DIRS = [ {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0} ];
const DIR_ARROWS = ['⬆️', '➡️', '⬇️', '⬅️'];
const CURVE_RIGHT_ARROWS = ['↱', '↴', '↲', '↰'];
const CURVE_LEFT_ARROWS = ['↰', '↱', '↴', '↲'];
const T_ARROWS = ['┳', '┫', '┻', '┣'];

const gridContainer = document.getElementById('grid-container');

function initGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.width = `${GRID_WIDTH * CELL_SIZE}px`;
    gridContainer.style.height = `${GRID_HEIGHT * CELL_SIZE}px`;

    for(let x = 0; x < GRID_WIDTH; x++) {
        for(let y = 0; y < GRID_HEIGHT; y++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.id = `cell-${x}-${y}`;
            cell.style.left = `${x * CELL_SIZE}px`;
            cell.style.top = `${y * CELL_SIZE}px`;
            cell.onclick = (e) => {
                e.stopPropagation();
                handleGridClick(x, y);
            };
            gridContainer.appendChild(cell);
        }
    }
}

function switchTab(tabName) {
    currentTab = tabName;
    const buildTabBtn = document.getElementById('tab-btn-build');
    const recipesTabBtn = document.getElementById('tab-btn-recipes');
    const buildContent = document.getElementById('tab-content-build');
    const recipesContent = document.getElementById('tab-content-recipes');

    if (tabName === 'build') {
        buildTabBtn.className = 'tab-btn active flex-1 py-1.5 text-xs font-bold rounded text-amber-400 bg-gray-800 border border-gray-700 transition';
        recipesTabBtn.className = 'tab-btn flex-1 py-1.5 text-xs font-bold rounded text-gray-400 hover:text-gray-200 transition';
        buildContent.classList.remove('hidden');
        recipesContent.classList.add('hidden');
    } else {
        recipesTabBtn.className = 'tab-btn active flex-1 py-1.5 text-xs font-bold rounded text-amber-400 bg-gray-800 border border-gray-700 transition';
        buildTabBtn.className = 'tab-btn flex-1 py-1.5 text-xs font-bold rounded text-gray-400 hover:text-gray-200 transition';
        recipesContent.classList.remove('hidden');
        buildContent.classList.add('hidden');
    }
}

function updateUI() {
    document.getElementById('money-display').innerText = `€ ${money.toLocaleString('nl-NL')}`;
    document.getElementById('level-badge').innerText = `Lvl ${playerLevel}`;
    document.getElementById('level-title').innerText = LEVEL_CONFIG[playerLevel] ? LEVEL_CONFIG[playerLevel].title : "Prestige Master";

    const nextLvl = playerLevel + 1;
    const upgradeBtn = document.getElementById('btn-upgrade-level');
    const cost = LEVEL_CONFIG[playerLevel] ? LEVEL_CONFIG[playerLevel].costNext : null;
    
    if (cost) {
        upgradeBtn.style.display = 'flex';
        document.getElementById('next-level-num').innerText = nextLvl;
        document.getElementById('next-level-cost').innerText = `€ ${cost.toLocaleString('nl-NL')}`;
    } else {
        upgradeBtn.style.display = 'flex';
        document.getElementById('next-level-num').innerText = `${playerLevel} (Prestige)`;
        document.getElementById('next-level-cost').innerText = `€ 500.000`;
    }

    const btnContainer = document.getElementById('build-buttons');
    btnContainer.innerHTML = '';
    
    BUILDINGS.filter(b => b.lvl <= playerLevel).forEach(b => {
        const btn = document.createElement('button');
        
        let isSelected = selectedTool === b.id;
        if (b.id === 'blueprint' && selectedTool === 'blueprint_place') isSelected = true;

        btn.className = `btn-build w-full ${isSelected ? 'selected' : ''}`;
        btn.onclick = () => selectTool(b.id, b.price);
        
        let displayName = b.name;
        if (b.id === 'conveyor') displayName = `${DIR_ARROWS[currentBuildDir]} ${b.name}`;
        if (b.id === 'conveyor-curve') displayName = `${CURVE_RIGHT_ARROWS[currentBuildDir]} ${b.name}`;
        if (b.id === 'conveyor-curve-left') displayName = `${CURVE_LEFT_ARROWS[currentBuildDir]} ${b.name}`;
        if (b.id === 'conveyor-t') displayName = `${T_ARROWS[currentBuildDir]} ${b.name}`;
        if (b.id === 'splitter') displayName = `🔀 ${b.name} (${DIR_ARROWS[currentBuildDir]})`;
        if (b.id.startsWith('source-')) {
            const elName = b.name.split(' ')[1];
            displayName = `${elName} ${DIR_ARROWS[currentBuildDir]}`;
        }
        if (b.id === 'rotate') displayName = `🔄 Richting (${DIR_ARROWS[currentBuildDir]}) [R]`;

        if (b.id === 'blueprint') {
            displayName = savedBlueprint ? `📋 Plaats Blauwdruk (€${blueprintCost.toLocaleString('nl-NL')})` : `📋 Blauwdruk Maken`;
        }

        btn.innerHTML = `
            <span>${displayName}</span>
            <span class="text-xs ${b.price === 0 ? 'text-red-400' : 'text-gray-400'}">${b.price > 0 ? '€' + b.price : ''}</span>
        `;
        btnContainer.appendChild(btn);
    });

    const bpCard = document.getElementById('blueprint-status-card');
    const bpText = document.getElementById('blueprint-status-text');
    if (savedBlueprint) {
        bpCard.classList.remove('hidden');
        bpText.innerText = `Opgeslagen: ${savedBlueprint.length} gebouwen (€${blueprintCost.toLocaleString('nl-NL')}). Klik op het grid om te plaatsen.`;
    } else {
        bpCard.classList.add('hidden');
    }

    // Render Recepten & Markt Dynamic Prices
    const recipeContainer = document.getElementById('recipe-list');
    recipeContainer.innerHTML = '';

    RECIPES.forEach(r => {
        const unlocked = r.lvl <= playerLevel;
        const reqStr = Object.entries(r.req).map(([el, cnt]) => `${cnt}x ${el}`).join(', ');
        
        const priceDiff = r.currentValue - r.baseValue;
        let trendIcon = '➡️';
        let trendColor = 'text-gray-400';
        if (priceDiff > 0) { trendIcon = '📈'; trendColor = 'text-green-400'; }
        if (priceDiff < 0) { trendIcon = '📉'; trendColor = 'text-red-400'; }

        const card = document.createElement('div');
        card.className = `p-2.5 rounded border text-xs flex justify-between items-center transition cursor-pointer ${unlocked ? 'bg-gray-800/80 border-gray-700 hover:border-gray-500' : 'bg-gray-900/30 border-gray-800 opacity-40'}`;
        card.onclick = () => {
            if (unlocked) {
                alert(`🧪 ${r.name} (${r.formula})\nActuele Marktwaarde: €${r.currentValue} (Basisprijs: €${r.baseValue})\nBereidingstijd: ${(r.craftTicks * (TICK_RATE/1000)).toFixed(1)}s (${r.craftTicks} ticks)\nNodig: ${reqStr}`);
            }
        };

        card.innerHTML = `
            <div>
                <div class="font-bold flex items-center gap-1.5" style="color: ${unlocked ? r.color : '#888'}">
                    <span>${r.formula} - ${r.name}</span>
                    <span class="text-[10px] text-gray-400 font-normal">(${(r.craftTicks * (TICK_RATE/1000)).toFixed(1)}s)</span>
                </div>
                <div class="text-[10px] text-gray-400">${unlocked ? 'Nodig: ' + reqStr : 'Vereist Lvl ' + r.lvl}</div>
            </div>
            <div class="text-right">
                <div class="font-black ${unlocked ? trendColor : 'text-gray-500'} flex items-center justify-end gap-1">
                    <span>€${r.currentValue.toLocaleString('nl-NL')}</span>
                    <span class="text-[10px]">${trendIcon}</span>
                </div>
                <div class="text-[9px] text-gray-500">Basis: €${r.baseValue}</div>
            </div>
        `;
        recipeContainer.appendChild(card);
    });
}

function selectTool(toolId, price) {
    if (toolId === 'rotate') {
        currentBuildDir = (currentBuildDir + 1) % 4;
        updateUI();
        return;
    }

    if (toolId === 'blueprint') {
        if (savedBlueprint) {
            selectedTool = 'blueprint_place';
            updateUI();
            return;
        } else {
            selectedTool = 'blueprint_create';
            blueprintStep = 1;
            updateUI();
            return;
        }
    }

    selectedTool = toolId;
    toolPrice = price;

    gridContainer.style.cursor = selectedTool === 'delete' ? 'not-allowed' : 'default';
    updateUI();
}

function handleGridClick(x, y) {
    const key = `${x},${y}`;

    if (selectedTool === 'blueprint_create') {
        if (blueprintStep === 1) {
            bpStartX = x; bpStartY = y; blueprintStep = 2;
            const startEl = document.getElementById(`cell-${x}-${y}`);
            if (startEl) startEl.classList.add('grid-cell-bp-start');
            showFloatingText(key, "Hoek 1 gekozen! Klik nu op 2e hoek", "#60a5fa");
            return;
        } else if (blueprintStep === 2) {
            const minX = Math.min(bpStartX, x); maxX = Math.max(bpStartX, x);
            const minY = Math.min(bpStartY, y); maxY = Math.max(bpStartY, y);

            const startEl = document.getElementById(`cell-${bpStartX}-${bpStartY}`);
            if (startEl) startEl.classList.remove('grid-cell-bp-start');

            savedBlueprint = [];
            let totalBpCost = 0;

            for (let bx = minX; bx <= maxX; bx++) {
                for (let by = minY; by <= maxY; by++) {
                    const bKey = `${bx},${by}`;
                    if (grid[bKey]) {
                        const bDef = BUILDINGS.find(b => b.id === grid[bKey].type);
                        totalBpCost += bDef ? bDef.price : 0;

                        savedBlueprint.push({
                            relX: bx - minX, relY: by - minY,
                            type: grid[bKey].type, dir: grid[bKey].dir,
                            selectedRecipe: grid[bKey].selectedRecipe || 'AUTO'
                        });
                    }
                }
            }

            if (savedBlueprint.length === 0) {
                showFloatingText(key, "Geen gebouwen gekozen!", "#ff6b6b");
                savedBlueprint = null; blueprintStep = 1;
            } else {
                blueprintCost = totalBpCost; blueprintStep = 0;
                selectedTool = 'blueprint_place';
                showFloatingText(key, `📋 Blauwdruk Opgeslagen! (${savedBlueprint.length} gebouwen)`, "#20bf6b");
            }
            updateUI();
            return;
        }
    }

    if (selectedTool === 'blueprint_place') {
        if (!savedBlueprint || savedBlueprint.length === 0) return;
        if (money < blueprintCost) {
            showFloatingText(key, `Niet genoeg geld! (€${blueprintCost.toLocaleString('nl-NL')} nodig)`, "#ff6b6b");
            return;
        }

        const bpInleverpunten = savedBlueprint.filter(b => b.type === 'inleverpunt').length;
        const currentInleverpunten = Object.values(grid).filter(cell => cell.type === 'inleverpunt').length;
        if (currentInleverpunten + bpInleverpunten > 3) {
            showFloatingText(key, "Max 3 Inleverpunten overschreden!", "#ff6b6b");
            return;
        }

        money -= blueprintCost;

        savedBlueprint.forEach(item => {
            const tx = x + item.relX; ty = y + item.relY;
            const tKey = `${tx},${ty}`;

            if (tx >= 0 && tx < GRID_WIDTH && ty >= 0 && ty < GRID_HEIGHT) {
                if (grid[tKey]) {
                    if (grid[tKey].obj && grid[tKey].obj.parentNode) grid[tKey].obj.parentNode.removeChild(grid[tKey].obj);
                    delete grid[tKey];
                }
                buildEntityWithDirAndRecipe(tx, ty, item.type, item.dir, item.selectedRecipe);
            }
        });

        updateUI();
        showFloatingText(key, "📋 Blauwdruk Geplaatst!", "#20bf6b");
        return;
    }

    if (selectedTool === 'delete') {
        if (grid[key]) {
            const buildingDef = BUILDINGS.find(b => b.id === grid[key].type);
            let refund = 0;
            if (buildingDef && buildingDef.price > 0) {
                refund = Math.floor(buildingDef.price * 0.8);
                money += refund;
            }

            if (grid[key].obj && grid[key].obj.parentNode) grid[key].obj.parentNode.removeChild(grid[key].obj);
            delete grid[key];

            const itemsToDelete = items.filter(i => i.x === x && i.y === y);
            itemsToDelete.forEach(item => {
                if (item.visual && item.visual.parentNode) item.visual.parentNode.removeChild(item.visual);
                const idx = items.indexOf(item);
                if (idx > -1) items.splice(idx, 1);
            });

            updateUI();
            showFloatingText(key, refund > 0 ? `+€${refund} 🗑️` : "🗑️ Verwijderd", "#ff4d4d");
        }
        return;
    }

    if (grid[key] && grid[key].type === 'mixer' && selectedTool === 'cursor') {
        openMixerModal(key);
        return;
    }

    if (grid[key] && (grid[key].type.startsWith('conveyor') || grid[key].type === 'splitter' || grid[key].type.startsWith('source-'))) {
        if (selectedTool === 'cursor' || selectedTool === grid[key].type) {
            grid[key].obj.classList.remove(`dir-${grid[key].dir}`);
            grid[key].dir = (grid[key].dir + 1) % 4;
            grid[key].obj.classList.add(`dir-${grid[key].dir}`);

            updateEntityText(grid[key]);
            return;
        }
    }

    if (selectedTool === 'cursor') return;

    if (selectedTool === 'inleverpunt' && (!grid[key] || grid[key].type !== 'inleverpunt')) {
        const currentInleverpunten = Object.values(grid).filter(cell => cell.type === 'inleverpunt').length;
        if (currentInleverpunten >= 3) {
            showFloatingText(key, "Max 3 Inleverpunten!", "#ff6b6b");
            return;
        }
    }

    if (grid[key]) {
        if (grid[key].type === selectedTool) return;
        if (money < toolPrice) {
            showFloatingText(key, "Niet genoeg geld!", "#ff6b6b");
            return;
        }

        const buildingDef = BUILDINGS.find(b => b.id === grid[key].type);
        if (buildingDef && buildingDef.price > 0) money += Math.floor(buildingDef.price * 0.8);

        if (grid[key].obj && grid[key].obj.parentNode) grid[key].obj.parentNode.removeChild(grid[key].obj);
        delete grid[key];

        const itemsToDelete = items.filter(i => i.x === x && i.y === y);
        itemsToDelete.forEach(item => {
            if (item.visual && item.visual.parentNode) item.visual.parentNode.removeChild(item.visual);
            const idx = items.indexOf(item);
            if (idx > -1) items.splice(idx, 1);
        });
    } else {
        if (money < toolPrice) {
            showFloatingText(key, "Niet genoeg geld!", "#ff6b6b");
            return;
        }
    }

    money -= toolPrice;
    updateUI();

    buildEntity(x, y, selectedTool);
}

function buildEntity(x, y, type) {
    buildEntityWithDirAndRecipe(x, y, type, currentBuildDir, 'AUTO');
}

function updateEntityText(entity) {
    const dir = entity.dir;
    const type = entity.type;

    if (type === 'conveyor') entity.obj.innerText = DIR_ARROWS[dir];
    else if (type === 'conveyor-curve') entity.obj.innerText = CURVE_RIGHT_ARROWS[dir];
    else if (type === 'conveyor-curve-left') entity.obj.innerText = CURVE_LEFT_ARROWS[dir];
    else if (type === 'conveyor-t') entity.obj.innerText = T_ARROWS[dir];
    else if (type === 'conveyor-cross') entity.obj.innerText = '╋';
    else if (type === 'splitter') entity.obj.innerText = '🔀';
    else if (type.startsWith('source-')) {
        const elem = type.replace('source-', '').toUpperCase();
        entity.obj.innerHTML = `<div class="source-label">${elem} ${DIR_ARROWS[dir]}</div>`;
    }
}

function buildEntityWithDirAndRecipe(x, y, type, dir, recipe = 'AUTO') {
    const key = `${x},${y}`;
    const el = document.createElement('div');
    el.className = `grid-cell ${type}`;
    el.id = `cell-${x}-${y}`;
    el.style.left = `${x * CELL_SIZE}px`;
    el.style.top = `${y * CELL_SIZE}px`;
    
    el.onclick = (e) => {
        e.stopPropagation();
        handleGridClick(x, y);
    };

    grid[key] = { 
        type, 
        dir, 
        obj: el, 
        inventory: {},
        selectedRecipe: recipe,
        splitToggle: 0,
        lastSpawnTime: 0,
        craftingState: null
    };

    el.classList.add(`dir-${dir}`);
    if (type === 'mixer') {
        const rec = RECIPES.find(r => r.id === recipe);
        const labelText = recipe === 'AUTO' ? 'AUTO' : (rec ? rec.formula : recipe);
        const labelColor = recipe === 'AUTO' ? '#88eaab' : (rec ? rec.color : '#ffffff');
        el.innerHTML = `
            🧪<span class="mixer-label" id="label-${x}-${y}" style="color: ${labelColor}">${labelText}</span>
            <div class="mixer-progress"><div class="mixer-progress-bar" id="pbar-${x}-${y}"></div></div>
        `;
    } else if (type === 'inleverpunt') {
        el.innerText = '🏢';
    } else {
        updateEntityText(grid[key]);
    }

    gridContainer.appendChild(el);
}

function resetBlueprint() {
    savedBlueprint = null; blueprintCost = 0; blueprintStep = 0; selectedTool = 'cursor';
    updateUI();
}

function openMixerModal(key) {
    activeMixerKey = key;
    const entity = grid[key];
    if (!entity) return;

    const optionsContainer = document.getElementById('modal-recipe-options');
    optionsContainer.innerHTML = '';

    const autoBtn = document.createElement('button');
    const isAuto = entity.selectedRecipe === 'AUTO';
    autoBtn.className = `w-full p-2.5 rounded border text-left text-xs transition flex justify-between items-center ${isAuto ? 'bg-amber-600/30 border-amber-500 text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`;
    autoBtn.innerHTML = `
        <div>
            <div class="font-bold">🔄 Automatisch</div>
            <div class="text-[10px] text-gray-400">Maakt automatisch de meest waardevolle beschikbare stof.</div>
        </div>
        ${isAuto ? '<span class="text-amber-400 text-sm">✓</span>' : ''}
    `;
    autoBtn.onclick = () => setMixerRecipe('AUTO');
    optionsContainer.appendChild(autoBtn);

    RECIPES.filter(r => r.lvl <= playerLevel).forEach(r => {
        const isSelected = entity.selectedRecipe === r.id;
        const reqStr = Object.entries(r.req).map(([el, cnt]) => `${cnt}x ${el}`).join(', ');

        const btn = document.createElement('button');
        btn.className = `w-full p-2.5 rounded border text-left text-xs transition flex justify-between items-center ${isSelected ? 'bg-amber-600/30 border-amber-500 text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`;
        btn.innerHTML = `
            <div>
                <div class="font-bold" style="color: ${r.color}">${r.formula} - ${r.name}</div>
                <div class="text-[10px] text-gray-400">Tijd: ${(r.craftTicks * (TICK_RATE/1000)).toFixed(1)}s | Nodig: ${reqStr}</div>
            </div>
            <div class="text-right">
                <div class="text-green-400 font-bold">€${r.currentValue.toLocaleString('nl-NL')}</div>
                ${isSelected ? '<span class="text-amber-400 text-xs">✓ Actief</span>' : ''}
            </div>
        `;
        btn.onclick = () => setMixerRecipe(r.id);
        optionsContainer.appendChild(btn);
    });

    document.getElementById('mixer-modal').classList.remove('hidden');
}

function setMixerRecipe(recipeId) {
    if (!activeMixerKey || !grid[activeMixerKey]) return;
    grid[activeMixerKey].selectedRecipe = recipeId;
    grid[activeMixerKey].craftingState = null;

    const [x, y] = activeMixerKey.split(',').map(Number);
    const labelEl = document.getElementById(`label-${x}-${y}`);
    if (labelEl) {
        if (recipeId === 'AUTO') {
            labelEl.innerText = 'AUTO';
            labelEl.style.color = '#88eaab';
        } else {
            const rec = RECIPES.find(r => r.id === recipeId);
            labelEl.innerText = rec ? rec.formula : recipeId;
            labelEl.style.color = rec ? rec.color : '#ffffff';
        }
    }

    closeMixerModal();
    showFloatingText(activeMixerKey, recipeId === 'AUTO' ? '🧪 Recept: Auto' : `🧪 ${recipeId}`, "#20bf6b");
}

function closeMixerModal() {
    document.getElementById('mixer-modal').classList.add('hidden');
    activeMixerKey = null;
}

function spawnItem(type, x, y) {
    const id = itemIdCounter++;
    const el = document.createElement('div');
    el.className = 'item';
    el.innerText = type;
    
    const color = ELEMENT_COLORS[type] || RECIPES.find(r => r.id === type)?.color || '#20bf6b';
    el.style.backgroundColor = color;
    if (type.length > 3) el.style.fontSize = '7px';

    const itemObj = { id, type, x, y, visual: el, movedThisTick: false, lastDir: 1 };
    items.push(itemObj);

    updateVisualPosition(itemObj, 0);
    gridContainer.appendChild(el);
}

function updateVisualPosition(item, slotIndex = 0) {
    const cell = grid[`${item.x},${item.y}`];
    let dir = item.lastDir !== undefined ? item.lastDir : 1;
    if (cell && cell.dir !== undefined) dir = cell.dir;

    const dirVec = DIRS[dir];
    const slotOffset = (1 - slotIndex) * 11;
    const centerX = (item.x * CELL_SIZE) + 15;
    const centerY = (item.y * CELL_SIZE) + 15;

    const posX = centerX + (dirVec.dx * slotOffset);
    const posY = centerY + (dirVec.dy * slotOffset);

    item.visual.style.left = `${posX}px`;
    item.visual.style.top = `${posY}px`;
}

function triggerAnimation(entityObj, classCss) {
    if (!entityObj || !entityObj.obj) return;
    entityObj.obj.classList.remove(classCss);
    void entityObj.obj.offsetWidth;
    entityObj.obj.classList.add(classCss);
    setTimeout(() => entityObj.obj.classList.remove(classCss), 350);
}

// DYNAMISCH MARKT SYSTEEM (Aanpassingen daalt bij verkoop, herstelt ALLEEN VOOR UNLOCKED RECEPTEN)
function processItemSale(itemType) {
    let value = ELEMENT_VALUES[itemType] || 0;
    const recipe = RECIPES.find(r => r.id === itemType);

    if (recipe) {
        value = recipe.currentValue;

        // Prijs daalt door overvloedig aanbod! (tot minimaal 35% van de basiswaarde)
        const minPrice = Math.floor(recipe.baseValue * 0.35);
        recipe.currentValue = Math.max(minPrice, Math.floor(recipe.currentValue * 0.95));
    }

    money += value;
    updateUI();
    return value;
}

function updateDynamicMarketPrices() {
    RECIPES.forEach(recipe => {
        // BELANGRIJK: Marktstijging (schaarste) vindt PAS PLAATS als de speler de stof HEEFT UNLOCKED!
        if (recipe.lvl <= playerLevel) {
            const maxPrice = Math.floor(recipe.baseValue * 2.0);
            if (recipe.currentValue < maxPrice) {
                recipe.currentValue = Math.min(maxPrice, Math.floor(recipe.currentValue * 1.03) + 1);
            }
        }
    });
    updateUI();
}

function gameTick() {
    tickCounter++;
    const now = Date.now();

    // Elke 8 ticks (~6.4 seconden) herstelt de markt schaarste voor UNLOCKED stoffen
    if (tickCounter % 8 === 0) {
        updateDynamicMarketPrices();
    }

    // 1. BRON PRODUCTIE MET EXACT 1 SECONDE COOLDOWN (1000ms)
    for (const key in grid) {
        const entity = grid[key];
        if (entity.type.startsWith('source-')) {
            if (now - entity.lastSpawnTime >= 1000) {
                const [x, y] = key.split(',').map(Number);
                const elemType = entity.type.replace('source-', '').toUpperCase();
                
                const cellItems = items.filter(i => i.x === x && i.y === y);
                if (cellItems.length < 3) {
                    spawnItem(elemType, x, y);
                    entity.lastSpawnTime = now;
                    triggerAnimation(entity, 'anim-push');
                }
            }
        }
    }

    items.forEach(i => i.movedThisTick = false);
    const itemsToRemove = [];

    // 2. ITEMS TRANSPORTEREN OVER HET GRID
    items.forEach(item => {
        if (item.movedThisTick) return;

        const currentKey = `${item.x},${item.y}`;
        const currentCell = grid[currentKey];

        if (currentCell) {
            let moveDirs = [];
            
            if (currentCell.type.startsWith('source-')) {
                moveDirs = [ DIRS[currentCell.dir] ];
            } else if (currentCell.type.startsWith('conveyor')) {
                moveDirs = [ DIRS[currentCell.dir] ];
            } else if (currentCell.type === 'splitter') {
                const mainDir = currentCell.dir;
                const outDir = (currentCell.splitToggle === 0) ? (mainDir + 3) % 4 : (mainDir + 1) % 4;
                moveDirs = [ DIRS[outDir] ];
            }

            for (const dirVec of moveDirs) {
                const nextX = item.x + dirVec.dx;
                const nextY = item.y + dirVec.dy;
                const nextKey = `${nextX},${nextY}`;
                const nextCell = grid[nextKey];

                if (nextX >= 0 && nextX < GRID_WIDTH && nextY >= 0 && nextY < GRID_HEIGHT) {
                    if (nextCell && (nextCell.type.startsWith('conveyor') || nextCell.type === 'splitter' || nextCell.type === 'mixer' || nextCell.type === 'inleverpunt')) {
                        
                        const itemsOnNextCell = items.filter(i => i.x === nextX && i.y === nextY);
                        const maxCap = (nextCell.type.startsWith('conveyor') || nextCell.type === 'splitter') ? 3 : 1;
                        
                        if (itemsOnNextCell.length < maxCap) {
                            item.x = nextX;
                            item.y = nextY;
                            item.lastDir = DIRS.findIndex(d => d.dx === dirVec.dx && d.dy === dirVec.dy);
                            item.movedThisTick = true;

                            if (currentCell.type === 'splitter') {
                                currentCell.splitToggle = 1 - currentCell.splitToggle;
                            }

                            updateVisualPosition(item, itemsOnNextCell.length);

                            if (nextCell.type === 'mixer') {
                                nextCell.inventory[item.type] = (nextCell.inventory[item.type] || 0) + 1;
                                triggerAnimation(nextCell, 'anim-mix');
                                itemsToRemove.push(item);
                            } else if (nextCell.type === 'inleverpunt') {
                                const saleValue = processItemSale(item.type);
                                triggerAnimation(nextCell, 'anim-sell');
                                showFloatingText(nextKey, `+€${saleValue.toLocaleString('nl-NL')}`, "#20bf6b");
                                itemsToRemove.push(item);
                            }
                            
                            break;
                        }
                    }
                }
            }
        }
    });

    for (const key in grid) {
        const cellItems = items.filter(i => `${i.x},${i.y}` === key);
        cellItems.forEach((item, slotIndex) => {
            updateVisualPosition(item, slotIndex);
        });
    }

    // 3. MIXERS MET GEAVANCEERDE RECEPTEN & INTERMEDIATE PRODUCTIE
    for (const key in grid) {
        const entity = grid[key];
        if (entity.type === 'mixer') {
            const [mx, my] = key.split(',').map(Number);
            const pbar = document.getElementById(`pbar-${mx}-${my}`);

            if (entity.craftingState) {
                entity.craftingState.progress++;
                const pct = (entity.craftingState.progress / entity.craftingState.maxProgress) * 100;
                if (pbar) pbar.style.width = `${pct}%`;

                if (entity.craftingState.progress >= entity.craftingState.maxProgress) {
                    const recipe = entity.craftingState.recipe;
                    let outputTarget = null;

                    for (const dir of DIRS) {
                        const tx = mx + dir.dx; ty = my + dir.dy;
                        const targetCell = grid[`${tx},${ty}`];

                        if (targetCell && (targetCell.type.startsWith('conveyor') || targetCell.type === 'splitter' || targetCell.type === 'inleverpunt' || targetCell.type === 'mixer')) {
                            const itemsOnTarget = items.filter(i => i.x === tx && i.y === ty);
                            const maxCap = (targetCell.type.startsWith('conveyor') || targetCell.type === 'splitter') ? 3 : 1;
                            if (itemsOnTarget.length < maxCap) {
                                outputTarget = { x: tx, y: ty };
                                break;
                            }
                        }
                    }

                    if (outputTarget) {
                        const targetCell = grid[`${outputTarget.x},${outputTarget.y}`];
                        triggerAnimation(entity, 'anim-mix');
                        
                        if (targetCell.type === 'inleverpunt') {
                            const saleValue = processItemSale(recipe.id);
                            triggerAnimation(targetCell, 'anim-sell');
                            showFloatingText(`${outputTarget.x},${outputTarget.y}`, `+€${saleValue.toLocaleString('nl-NL')}`, "#20bf6b");
                        } else if (targetCell.type === 'mixer') {
                            targetCell.inventory[recipe.id] = (targetCell.inventory[recipe.id] || 0) + 1;
                            triggerAnimation(targetCell, 'anim-mix');
                            showFloatingText(`${outputTarget.x},${outputTarget.y}`, `+${recipe.id}`, recipe.color);
                        } else {
                            spawnItem(recipe.id, outputTarget.x, outputTarget.y);
                        }
                        
                        showFloatingText(key, `🧪 ${recipe.formula}`, recipe.color);
                        entity.craftingState = null;
                        if (pbar) pbar.style.width = '0%';
                    }
                }
            } else {
                let targetRecipes = [];
                if (entity.selectedRecipe && entity.selectedRecipe !== 'AUTO') {
                    const specificRecipe = RECIPES.find(r => r.id === entity.selectedRecipe);
                    if (specificRecipe && specificRecipe.lvl <= playerLevel) targetRecipes = [specificRecipe];
                } else {
                    targetRecipes = RECIPES.filter(r => r.lvl <= playerLevel).sort((a, b) => b.currentValue - a.currentValue);
                }

                for (const recipe of targetRecipes) {
                    let canMake = true;
                    for (const [elem, count] of Object.entries(recipe.req)) {
                        if ((entity.inventory[elem] || 0) < count) {
                            canMake = false;
                            break;
                        }
                    }

                    if (canMake) {
                        for (const [elem, count] of Object.entries(recipe.req)) {
                            entity.inventory[elem] -= count;
                        }
                        entity.craftingState = {
                            recipe: recipe,
                            progress: 0,
                            maxProgress: recipe.craftTicks
                        };
                        break;
                    }
                }
            }
        }
    }

    itemsToRemove.forEach(item => {
        if (item.visual && item.visual.parentNode) item.visual.parentNode.removeChild(item.visual);
        const idx = items.indexOf(item);
        if (idx > -1) items.splice(idx, 1);
    });
}

function sellEntireFactory() {
    let totalRefund = 0;

    for (const key in grid) {
        const entity = grid[key];
        const buildingDef = BUILDINGS.find(b => b.id === entity.type);
        if (buildingDef && buildingDef.price > 0) totalRefund += buildingDef.price;
        if (entity.obj && entity.obj.parentNode) entity.obj.parentNode.removeChild(entity.obj);
        delete grid[key];
    }

    items.forEach(i => { if (i.visual && i.visual.parentNode) i.visual.parentNode.removeChild(i.visual); });
    items = [];

    money += totalRefund;
    updateUI();

    const centerX = Math.floor((window.innerWidth - 340) / (2 * CELL_SIZE));
    const centerY = Math.floor(window.innerHeight / (2 * CELL_SIZE));
    showFloatingText(`${centerX},${centerY}`, `🏢 FABRIEK VERKOCHT (+€${totalRefund.toLocaleString('nl-NL')})`, "#fbc531");
}

function upgradeLevel() {
    const cost = LEVEL_CONFIG[playerLevel] ? LEVEL_CONFIG[playerLevel].costNext : 500000;

    if (money >= cost) {
        money -= cost;
        playerLevel++;
        
        for (const key in grid) {
            if (grid[key].obj && grid[key].obj.parentNode) grid[key].obj.parentNode.removeChild(grid[key].obj);
        }
        for (const key in grid) delete grid[key];

        items.forEach(i => { if (i.visual && i.visual.parentNode) i.visual.parentNode.removeChild(i.visual); });
        items = [];

        money += 1000;
        updateUI();
        
        const centerX = Math.floor((window.innerWidth - 340) / (2 * CELL_SIZE));
        const centerY = Math.floor(window.innerHeight / (2 * CELL_SIZE));
        showFloatingText(`${centerX},${centerY}`, `🚀 FABRIEK GEÜPGRADED NAAR LVL ${playerLevel}!`, "#fbc531");
    } else {
        alert("Niet genoeg saldo om je fabriek te upgraden!");
    }
}

function showFloatingText(key, text, color) {
    const [x, y] = key.split(',').map(Number);
    const el = document.createElement('div');
    
    el.style.position = 'absolute';
    el.style.left = `${(x * CELL_SIZE) + 10}px`;
    el.style.top = `${y * CELL_SIZE}px`;
    el.style.color = color;
    el.style.fontWeight = '900';
    el.style.fontSize = '14px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '100';
    el.style.textShadow = '0px 2px 4px rgba(0,0,0,0.8)';
    el.style.transition = 'all 0.8s ease-out';
    el.innerText = text;
    
    gridContainer.appendChild(el);

    setTimeout(() => {
        el.style.top = `${(y * CELL_SIZE) - 30}px`;
        el.style.opacity = '0';
    }, 20);

    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
}

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') selectTool('rotate', 0);
    if (e.key.toLowerCase() === 'x') selectTool('delete', 0);
});

gridContainer.addEventListener('contextmenu', (e) => e.preventDefault());

initGrid();
updateUI();
setInterval(gameTick, TICK_RATE);