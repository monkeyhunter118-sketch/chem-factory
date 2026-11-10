const CELL_SIZE = 50;
// Speelveld 3x groter gemaakt in breedte en hoogte
let GRID_WIDTH = Math.floor((window.innerWidth - 340) / CELL_SIZE) * 3;
let GRID_HEIGHT = Math.floor(window.innerHeight / CELL_SIZE) * 3;
const TICK_RATE = 1600; // ms per tick

// Game State
let money = 1000;
let playerLevel = 1;
let selectedTool = 'cursor';
let toolPrice = 0;
let currentBuildDir = 1; // 0=Up, 1=Right, 2=Down, 3=Left
let activeMixerKey = null;

// Level config
const LEVEL_CONFIG = {
    1: { title: "Basiselementen (H₂O, H₂O₂)", costNext: 1500 },
    2: { title: "Organische Basis (CO₂, NH₃, CH₄, H₂CO₃)", costNext: 8000 },
    3: { title: "Zuren & Gassen (HCl, SO₂, NO₂, HNO₃, H₂SO₄)", costNext: 35000 },
    4: { title: "Industriële Synthese (Glucose, Ethanol, Chloroform)", costNext: 100000 },
    5: { title: "Geavanceerde Biochemie & Explosieven (TNT)", costNext: 250000 }
};

// Chemical Recipes
const RECIPES = [
    // Level 1
    { id: 'H2O', name: 'Water', formula: 'H₂O', req: { 'H': 2, 'O': 1 }, value: 60, lvl: 1, color: '#38ada9' },
    { id: 'H2O2', name: 'Waterstofperoxide', formula: 'H₂O₂', req: { 'H': 2, 'O': 2 }, value: 120, lvl: 1, color: '#74b9ff' },
    
    // Level 2
    { id: 'CO', name: 'Koolmonoxide', formula: 'CO', req: { 'C': 1, 'O': 1 }, value: 90, lvl: 2, color: '#b2bec3' },
    { id: 'CO2', name: 'Koolstofdioxide', formula: 'CO₂', req: { 'C': 1, 'O': 2 }, value: 150, lvl: 2, color: '#78e08f' },
    { id: 'NH3', name: 'Ammoniak', formula: 'NH₃', req: { 'N': 1, 'H': 3 }, value: 220, lvl: 2, color: '#f6b93b' },
    { id: 'CH4', name: 'Methaan', formula: 'CH₄', req: { 'C': 1, 'H': 4 }, value: 350, lvl: 2, color: '#e67e22' },
    { id: 'H2CO3', name: 'Koolzuur', formula: 'H₂CO₃', req: { 'H': 2, 'C': 1, 'O': 3 }, value: 480, lvl: 2, color: '#a29bfe' },

    // Level 3
    { id: 'HCl', name: 'Zoutzuur', formula: 'HCl', req: { 'H': 1, 'Cl': 1 }, value: 180, lvl: 3, color: '#e55039' },
    { id: 'SO2', name: 'Zwaveldioxide', formula: 'SO₂', req: { 'S': 1, 'O': 2 }, value: 280, lvl: 3, color: '#4a69bd' },
    { id: 'NO2', name: 'Stikstofdioxide', formula: 'NO₂', req: { 'N': 1, 'O': 2 }, value: 320, lvl: 3, color: '#fd79a8' },
    { id: 'Cl2', name: 'Chloorgas', formula: 'Cl₂', req: { 'Cl': 2 }, value: 400, lvl: 3, color: '#00b894' },
    { id: 'HNO3', name: 'Salpeterzuur', formula: 'HNO₃', req: { 'H': 1, 'N': 1, 'O': 3 }, value: 1200, lvl: 3, color: '#ff7675' },
    { id: 'H2SO4', name: 'Zwavelzuur', formula: 'H₂SO₄', req: { 'H': 2, 'S': 1, 'O': 4 }, value: 1500, lvl: 3, color: '#b8e994' },

    // Level 4
    { id: 'C2H6O', name: 'Ethanol', formula: 'C₂H₆O', req: { 'C': 2, 'H': 6, 'O': 1 }, value: 2400, lvl: 4, color: '#fdcb6e' },
    { id: 'C2H4O2', name: 'Azijnzuur', formula: 'C₂H₄O₂', req: { 'C': 2, 'H': 4, 'O': 2 }, value: 3100, lvl: 4, color: '#e17055' },
    { id: 'CHCl3', name: 'Chloroform', formula: 'CHCl₃', req: { 'C': 1, 'H': 1, 'Cl': 3 }, value: 5200, lvl: 4, color: '#00cec9' },
    { id: 'CH4N2O', name: 'Ureum', formula: 'CH₄N₂O', req: { 'C': 1, 'H': 4, 'N': 2, 'O': 1 }, value: 6800, lvl: 4, color: '#6c5ce7' },
    { id: 'C6H12O6', name: 'Glucose', formula: 'C₆H₁₂O₆', req: { 'C': 6, 'H': 12, 'O': 6 }, value: 8500, lvl: 4, color: '#f8c291' },

    // Level 5
    { id: 'C3H5N3O9', name: 'Nitroglycerine', formula: 'C₃H₅N₃O₉', req: { 'C': 3, 'H': 5, 'N': 3, 'O': 9 }, value: 18500, lvl: 5, color: '#d63031' },
    { id: 'C7H5N3O6', name: 'TNT', formula: 'C₇H₅N₃O₆', req: { 'C': 7, 'H': 5, 'N': 3, 'O': 6 }, value: 35000, lvl: 5, color: '#ff4757' }
];

// Raw Element Values
const ELEMENT_VALUES = {
    'H': 2, 'C': 5, 'N': 8, 'O': 3, 'S': 12, 'Cl': 15
};

const ELEMENT_COLORS = {
    'H': '#48dbfb', 'C': '#ffffff', 'N': '#a55eea', 'O': '#ff6b6b', 'S': '#fecb57', 'Cl': '#1dd1a1'
};

// Available Buildings Definition (Inclusief Bocht Links en Bocht Rechts)
const BUILDINGS = [
    { id: 'cursor', name: '🖱️ Muis (Deselecteren / Instellen)', price: 0, lvl: 1 },
    { id: 'rotate', name: '🔄 Bouwrichting [Sneltoets: R]', price: 0, lvl: 1 },
    { id: 'conveyor', name: 'Lopende Band', price: 10, lvl: 1 },
    { id: 'conveyor-curve', name: 'Bocht Rechts ↪️', price: 15, lvl: 1 },
    { id: 'conveyor-curve-left', name: 'Bocht Links ↩️', price: 15, lvl: 1 },
    { id: 'mixer', name: '🧪 Chemische Mixer', price: 300, lvl: 1 },
    { id: 'inleverpunt', name: '🏢 Inleverpunt (Max 3)', price: 100, lvl: 1 },
    
    // Bronnen in periodiek systeem volgorde
    { id: 'source-h', name: '💧 H-Bron (Waterstof)', price: 100, lvl: 1 },
    { id: 'source-c', name: '🪨 C-Bron (Koolstof)', price: 400, lvl: 2 },
    { id: 'source-n', name: '💨 N-Bron (Stikstof)', price: 500, lvl: 2 },
    { id: 'source-o', name: '🔥 O-Bron (Zuurstof)', price: 150, lvl: 1 },
    { id: 'source-s', name: '🟡 S-Bron (Zwavel)', price: 800, lvl: 3 },
    { id: 'source-cl', name: '🧪 Cl-Bron (Chloor)', price: 1000, lvl: 3 },
    
    { id: 'delete', name: '🗑️ Delete [Sneltoets: X]', price: 0, lvl: 1 }
];

// Grid & Entities Store
const grid = {}; 
let items = []; 
let itemIdCounter = 0;

const DIRS = [ {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0} ];
const DIR_ARROWS = ['⬆️', '➡️', '⬇️', '⬅️'];
const CURVE_RIGHT_ARROWS = ['↱', '↴', '↲', '↰'];
const CURVE_LEFT_ARROWS = ['↰', '↱', '↴', '↲'];

const gridContainer = document.getElementById('grid-container');

function initGrid() {
    gridContainer.innerHTML = '';
    // Stel de expliciete grotere breedte/hoogte in op de container
    gridContainer.style.width = `${GRID_WIDTH * CELL_SIZE}px`;
    gridContainer.style.height = `${GRID_HEIGHT * CELL_SIZE}px`;

    for(let x = 0; x < GRID_WIDTH; x++) {
        for(let y = 0; y < GRID_HEIGHT; y++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
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
        
        const isSelected = selectedTool === b.id;
        btn.className = `btn-build w-full ${isSelected ? 'selected' : ''}`;
        btn.onclick = () => selectTool(b.id, b.price);
        
        let displayName = b.name;
        if (b.id === 'conveyor') displayName = `${DIR_ARROWS[currentBuildDir]} ${b.name}`;
        if (b.id === 'conveyor-curve') displayName = `${CURVE_RIGHT_ARROWS[currentBuildDir]} ${b.name}`;
        if (b.id === 'conveyor-curve-left') displayName = `${CURVE_LEFT_ARROWS[currentBuildDir]} ${b.name}`;
        if (b.id === 'rotate') displayName = `🔄 Richting (${DIR_ARROWS[currentBuildDir]}) [R]`;

        btn.innerHTML = `
            <span>${displayName}</span>
            <span class="text-xs ${b.price === 0 ? 'text-red-400' : 'text-gray-400'}">${b.price > 0 ? '€' + b.price : ''}</span>
        `;
        btnContainer.appendChild(btn);
    });

    const recipeContainer = document.getElementById('recipe-list');
    recipeContainer.innerHTML = '';

    RECIPES.forEach(r => {
        const unlocked = r.lvl <= playerLevel;
        const reqStr = Object.entries(r.req).map(([el, cnt]) => `${cnt}x ${el}`).join(', ');
        
        const card = document.createElement('div');
        card.className = `p-2 rounded border text-xs flex justify-between items-center ${unlocked ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-900/30 border-gray-800 opacity-40'}`;
        card.innerHTML = `
            <div>
                <div class="font-bold" style="color: ${unlocked ? r.color : '#888'}">${r.formula} - ${r.name}</div>
                <div class="text-[10px] text-gray-400">${unlocked ? 'Nodig: ' + reqStr : 'Vereist Lvl ' + r.lvl}</div>
            </div>
            <div class="font-black ${unlocked ? 'text-green-400' : 'text-gray-500'}">€${r.value.toLocaleString('nl-NL')}</div>
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
    selectedTool = toolId;
    toolPrice = price;

    gridContainer.style.cursor = selectedTool === 'delete' ? 'not-allowed' : 'default';

    updateUI();
}

function handleGridClick(x, y) {
    const key = `${x},${y}`;

    // DELETE MODUS
    if (selectedTool === 'delete') {
        if (grid[key]) {
            const buildingDef = BUILDINGS.find(b => b.id === grid[key].type);
            let refund = 0;
            if (buildingDef && buildingDef.price > 0) {
                refund = Math.floor(buildingDef.price * 0.8);
                money += refund;
            }

            if (grid[key].obj && grid[key].obj.parentNode) {
                grid[key].obj.parentNode.removeChild(grid[key].obj);
            }
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

    // MODAL OPENEN OP MIXER
    if (grid[key] && grid[key].type === 'mixer' && selectedTool === 'cursor') {
        openMixerModal(key);
        return;
    }

    // LOPENDE BAND ROTEREN
    if (grid[key] && (grid[key].type === 'conveyor' || grid[key].type === 'conveyor-curve' || grid[key].type === 'conveyor-curve-left')) {
        if (selectedTool === 'cursor' || selectedTool === grid[key].type) {
            grid[key].obj.classList.remove(`dir-${grid[key].dir}`);
            grid[key].dir = (grid[key].dir + 1) % 4;
            grid[key].obj.classList.add(`dir-${grid[key].dir}`);
            
            if (grid[key].type === 'conveyor') grid[key].obj.innerText = DIR_ARROWS[grid[key].dir];
            if (grid[key].type === 'conveyor-curve') grid[key].obj.innerText = CURVE_RIGHT_ARROWS[grid[key].dir];
            if (grid[key].type === 'conveyor-curve-left') grid[key].obj.innerText = CURVE_LEFT_ARROWS[grid[key].dir];
            return;
        }
    }

    if (selectedTool === 'cursor') return;

    // MAX 3 INLEVERPUNTEN REGEL
    if (selectedTool === 'inleverpunt' && (!grid[key] || grid[key].type !== 'inleverpunt')) {
        const currentInleverpunten = Object.values(grid).filter(cell => cell.type === 'inleverpunt').length;
        if (currentInleverpunten >= 3) {
            showFloatingText(key, "Max 3 Inleverpunten!", "#ff6b6b");
            return;
        }
    }

    // GEBOUW PLAATSEN
    if (grid[key]) {
        if (grid[key].type === selectedTool) return;

        if (money < toolPrice) {
            showFloatingText(key, "Niet genoeg geld!", "#ff6b6b");
            return;
        }

        const buildingDef = BUILDINGS.find(b => b.id === grid[key].type);
        if (buildingDef && buildingDef.price > 0) {
            money += Math.floor(buildingDef.price * 0.8);
        }

        if (grid[key].obj && grid[key].obj.parentNode) {
            grid[key].obj.parentNode.removeChild(grid[key].obj);
        }
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
    const key = `${x},${y}`;
    const el = document.createElement('div');
    el.className = `grid-cell ${type}`;
    el.style.left = `${x * CELL_SIZE}px`;
    el.style.top = `${y * CELL_SIZE}px`;
    
    el.onclick = (e) => {
        e.stopPropagation();
        handleGridClick(x, y);
    };

    let dir = currentBuildDir;

    if (type === 'conveyor') {
        el.innerText = DIR_ARROWS[dir];
        el.classList.add(`dir-${dir}`);
    } else if (type === 'conveyor-curve') {
        el.innerText = CURVE_RIGHT_ARROWS[dir];
        el.classList.add(`dir-${dir}`);
    } else if (type === 'conveyor-curve-left') {
        el.innerText = CURVE_LEFT_ARROWS[dir];
        el.classList.add(`dir-${dir}`);
    } else if (type.startsWith('source-')) {
        const elem = type.replace('source-', '').toUpperCase();
        el.innerText = elem;
    } else if (type === 'mixer') {
        el.innerHTML = `🧪<span class="mixer-label" id="label-${x}-${y}">AUTO</span>`;
    } else if (type === 'inleverpunt') {
        el.innerText = '🏢';
    }

    grid[key] = { 
        type, 
        dir, 
        obj: el, 
        inventory: {},
        selectedRecipe: 'AUTO'
    };
    gridContainer.appendChild(el);
}

// MIXER RECEPT SELECTIE MODAL
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
                <div class="text-[10px] text-gray-400">Nodig: ${reqStr}</div>
            </div>
            <div class="text-right">
                <div class="text-green-400 font-bold">€${r.value.toLocaleString('nl-NL')}</div>
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
    if (type.length > 3) el.style.fontSize = '8px';

    updateVisualPosition(el, x, y, 0);
    gridContainer.appendChild(el);

    items.push({
        id,
        type,
        x,
        y,
        visual: el,
        movedThisTick: false
    });
}

// Berekent positie met lichte verschuiving (slot) voor maximaal 3 items op één cel
function updateVisualPosition(element, x, y, slot = 0) {
    const offsets = [
        { dx: 14, dy: 14 },
        { dx: 5, dy: 5 },
        { dx: 23, dy: 23 }
    ];
    const offset = offsets[slot % 3] || { dx: 14, dy: 14 };
    element.style.left = `${(x * CELL_SIZE) + offset.dx}px`;
    element.style.top = `${(y * CELL_SIZE) + offset.dy}px`;
}

function gameTick() {
    for (const key in grid) {
        const entity = grid[key];
        if (entity.type.startsWith('source-')) {
            const [x, y] = key.split(',').map(Number);
            const elemType = entity.type.replace('source-', '').toUpperCase();
            
            const cellItems = items.filter(i => i.x === x && i.y === y);
            if (cellItems.length < 3) {
                spawnItem(elemType, x, y);
            }
        }
    }

    items.forEach(i => i.movedThisTick = false);

    const itemsToRemove = [];

    items.forEach(item => {
        if (item.movedThisTick) return;

        const currentKey = `${item.x},${item.y}`;
        const currentCell = grid[currentKey];

        if (currentCell) {
            let moveDirs = [];
            
            if (currentCell.type.startsWith('conveyor')) {
                moveDirs = [ DIRS[currentCell.dir] ];
            } else if (currentCell.type.startsWith('source-')) {
                moveDirs = DIRS;
            }

            for (const dirVec of moveDirs) {
                const nextX = item.x + dirVec.dx;
                const nextY = item.y + dirVec.dy;
                const nextKey = `${nextX},${nextY}`;
                const nextCell = grid[nextKey];

                if (nextX >= 0 && nextX < GRID_WIDTH && nextY >= 0 && nextY < GRID_HEIGHT) {
                    if (nextCell && (nextCell.type.startsWith('conveyor') || nextCell.type === 'mixer' || nextCell.type === 'inleverpunt')) {
                        
                        const itemsOnNextCell = items.filter(i => i.x === nextX && i.y === nextY);
                        // Lopende banden kunnen tot 3 items vasthouden
                        const maxCap = nextCell.type.startsWith('conveyor') ? 3 : 1;
                        
                        if (itemsOnNextCell.length < maxCap) {
                            item.x = nextX;
                            item.y = nextY;
                            updateVisualPosition(item.visual, item.x, item.y, itemsOnNextCell.length);
                            item.movedThisTick = true;

                            if (nextCell.type === 'mixer') {
                                nextCell.inventory[item.type] = (nextCell.inventory[item.type] || 0) + 1;
                                itemsToRemove.push(item);
                            } else if (nextCell.type === 'inleverpunt') {
                                let value = ELEMENT_VALUES[item.type] || 0;
                                const rec = RECIPES.find(r => r.id === item.type);
                                if (rec) value = rec.value;

                                money += value;
                                updateUI();
                                showFloatingText(nextKey, `+€${value.toLocaleString('nl-NL')}`, "#20bf6b");
                                itemsToRemove.push(item);
                            }
                            
                            break;
                        }
                    }
                }
            }
        }
    });

    // VERWERK MIXERS
    for (const key in grid) {
        const entity = grid[key];
        if (entity.type === 'mixer') {
            let targetRecipes = [];

            if (entity.selectedRecipe && entity.selectedRecipe !== 'AUTO') {
                const specificRecipe = RECIPES.find(r => r.id === entity.selectedRecipe);
                if (specificRecipe && specificRecipe.lvl <= playerLevel) {
                    targetRecipes = [specificRecipe];
                }
            } else {
                targetRecipes = RECIPES.filter(r => r.lvl <= playerLevel)
                    .sort((a, b) => b.value - a.value);
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
                    const [mx, my] = key.split(',').map(Number);
                    let outputTarget = null;

                    for (const dir of DIRS) {
                        const tx = mx + dir.dx;
                        const ty = my + dir.dy;
                        const targetCell = grid[`${tx},${ty}`];

                        if (targetCell && (targetCell.type.startsWith('conveyor') || targetCell.type === 'inleverpunt' || targetCell.type === 'mixer')) {
                            const itemsOnTarget = items.filter(i => i.x === tx && i.y === ty);
                            const maxCap = targetCell.type.startsWith('conveyor') ? 3 : 1;

                            if (itemsOnTarget.length < maxCap) {
                                outputTarget = { x: tx, y: ty, slot: itemsOnTarget.length };
                                break;
                            }
                        }
                    }

                    if (outputTarget) {
                        for (const [elem, count] of Object.entries(recipe.req)) {
                            entity.inventory[elem] -= count;
                        }
                        
                        const targetCell = grid[`${outputTarget.x},${outputTarget.y}`];
                        
                        if (targetCell.type === 'inleverpunt') {
                            money += recipe.value;
                            updateUI();
                            showFloatingText(`${outputTarget.x},${outputTarget.y}`, `+€${recipe.value.toLocaleString('nl-NL')}`, "#20bf6b");
                        } else if (targetCell.type === 'mixer') {
                            targetCell.inventory[recipe.id] = (targetCell.inventory[recipe.id] || 0) + 1;
                            showFloatingText(`${outputTarget.x},${outputTarget.y}`, `+${recipe.id}`, recipe.color);
                        } else {
                            spawnItem(recipe.id, outputTarget.x, outputTarget.y);
                        }
                        
                        showFloatingText(key, `🧪 ${recipe.formula}`, recipe.color);
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
        if (buildingDef && buildingDef.price > 0) {
            totalRefund += buildingDef.price;
        }
        if (entity.obj && entity.obj.parentNode) {
            entity.obj.parentNode.removeChild(entity.obj);
        }
        delete grid[key];
    }

    items.forEach(i => {
        if (i.visual && i.visual.parentNode) i.visual.parentNode.removeChild(i.visual);
    });
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
    el.style.transition = 'all 1s ease-out';
    el.innerText = text;
    
    gridContainer.appendChild(el);

    setTimeout(() => {
        el.style.top = `${(y * CELL_SIZE) - 30}px`;
        el.style.opacity = '0';
    }, 20);

    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 1050);
}

// SNELTOETSEN (R = Draaien, X = Delete)
document.addEventListener