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

    const recipeContainer = document.getElementById('recipe-list');
    recipeContainer.innerHTML = '';

    RECIPES.forEach(r => {
        const unlocked = r.lvl <= playerLevel;
        const reqStr = Object.entries(r.req).map(([el, cnt]) => `${cnt}x ${el}`).join(', ');
        const priceDiff = r.currentValue - r.baseValue;
        let trendIcon = '➡️', trendColor = 'text-gray-400';
        if (priceDiff > 0) { trendIcon = '📈'; trendColor = 'text-green-400'; }
        if (priceDiff < 0) { trendIcon = '📉'; trendColor = 'text-red-400'; }

        const card = document.createElement('div');
        card.className = `p-2.5 rounded border text-xs flex justify-between items-center transition cursor-pointer ${unlocked ? 'bg-gray-800/80 border-gray-700 hover:border-gray-500' : 'bg-gray-900/30 border-gray-800 opacity-40'}`;
        card.onclick = () => {
            if (unlocked) alert(`🧪 ${r.name} (${r.formula})\nActuele Marktwaarde: €${r.currentValue}\nBasisprijs: €${r.baseValue} | Minimumprijs: €${r.minPrice}\nBereidingstijd: ${(r.craftTicks * (TICK_RATE/1000)).toFixed(1)}s (${r.craftTicks} ticks)\nNodig: ${reqStr}`);
        };

        const icon = ITEM_ICONS[r.id] || '🧪';
        card.innerHTML = `
            <div>
                <div class="font-bold flex items-center gap-1.5" style="color: ${unlocked ? r.color : '#888'}">
                    <span>${icon} ${r.formula} - ${r.name}</span>
                    <span class="text-[10px] text-gray-400 font-normal">(${(r.craftTicks * (TICK_RATE/1000)).toFixed(1)}s)</span>
                </div>
                <div class="text-[10px] text-gray-400">${unlocked ? 'Nodig: ' + reqStr : 'Vereist Lvl ' + r.lvl}</div>
            </div>
            <div class="text-right">
                <div class="font-black ${unlocked ? trendColor : 'text-gray-500'} flex items-center justify-end gap-1">
                    <span>€${r.currentValue.toLocaleString('nl-NL')}</span>
                    <span class="text-[10px]">${trendIcon}</span>
                </div>
                <div class="text-[9px] text-gray-500">Min: €${r.minPrice} | Basis: €${r.baseValue}</div>
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
        if (savedBlueprint) { selectedTool = 'blueprint_place'; updateUI(); return; } 
        else { selectedTool = 'blueprint_create'; blueprintStep = 1; updateUI(); return; }
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
            const minX = Math.min(bpStartX, x), maxX = Math.max(bpStartX, x);
            const minY = Math.min(bpStartY, y), maxY = Math.max(bpStartY, y);

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

    if (grid[key] && grid[key].type.startsWith('mixer') && selectedTool === 'cursor') {
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
        if (money < toolPrice) { showFloatingText(key, "Niet genoeg geld!", "#ff6b6b"); return; }

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
        if (money < toolPrice) { showFloatingText(key, "Niet genoeg geld!", "#ff6b6b"); return; }
    }

    money -= toolPrice;
    updateUI();
    buildEntity(x, y, selectedTool);
}

function buildEntity(x, y, type) {
    buildEntityWithDirAndRecipe(x, y, type, currentBuildDir, 'AUTO');
}

function updateEntityText(entity) {
    const dir = entity.dir, type = entity.type;
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

    const buildingDef = BUILDINGS.find(b => b.id === type);
    const speedMult = buildingDef && buildingDef.speed ? buildingDef.speed : 1.0;

    grid[key] = { 
        type, dir, obj: el, inventory: {}, selectedRecipe: recipe,
        splitToggle: 0, lastSpawnTime: 0, craftingState: null, speedMultiplier: speedMult
    };

    el.classList.add(`dir-${dir}`);
    if (type.startsWith('mixer')) {
        el.classList.add('mixer-base');
        let tierClass = 'mixer-mk1', tierLabel = 'Mk1';
        if (type === 'mixer-mk2') { tierClass = 'mixer-mk2'; tierLabel = 'Mk2'; }
        if (type === 'mixer-mk3') { tierClass = 'mixer-mk3'; tierLabel = 'Mk3'; }
        el.classList.add(tierClass);

        const rec = RECIPES.find(r => r.id === recipe);
        const labelText = recipe === 'AUTO' ? 'AUTO' : (rec ? rec.formula : recipe);
        const labelColor = recipe === 'AUTO' ? '#88eaab' : (rec ? rec.color : '#ffffff');
        el.innerHTML = `
            <span class="mixer-badge">${tierLabel}</span>
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
        const icon = ITEM_ICONS[r.id] || '🧪';

        const btn = document.createElement('button');
        btn.className = `w-full p-2.5 rounded border text-left text-xs transition flex justify-between items-center ${isSelected ? 'bg-amber-600/30 border-amber-500 text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`;
        btn.innerHTML = `
            <div>
                <div class="font-bold" style="color: ${r.color}">${icon} ${r.formula} - ${r.name}</div>
                <div class="text-[10px] text-gray-400">Tijd: ${(r.craftTicks * (TICK_RATE/1000) / entity.speedMultiplier).toFixed(1)}s | Nodig: ${reqStr}</div>
            </div>
            <div class="text-right">
                <div class="text-green-400 font-bold">€${r.currentValue.toLocaleString('nl-NL')}</div>
                <div class="text-[9px] text-gray-400">Min: €${r.minPrice}</div>
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

// EVENT LISTENERS & SPEL INITIALISATIE
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') selectTool('rotate', 0);
    if (e.key.toLowerCase() === 'x') selectTool('delete', 0);
});

gridContainer.addEventListener('contextmenu', (e) => e.preventDefault());

initGrid();
updateUI();
setInterval(gameTick, TICK_RATE);