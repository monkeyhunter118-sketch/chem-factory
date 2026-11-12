const gridContainer = document.getElementById('grid-container');

function initGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.width = `${GRID_WIDTH * CELL_SIZE}px`;
    gridContainer.style.height = `${GRID_HEIGHT * CELL_SIZE}px`;

    for(let x = 0; x < GRID_WIDTH; x++) {
        for(let y = 0; y < GRID_HEIGHT; y++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            // Controleer of de grond gelocked is
            if (y >= unlockedRows) {
                cell.classList.add('locked-ground');
            }
            
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

function handleGridClick(x, y) {
    const key = `${x},${y}`;

    // GROND KOPEN LOGICA
    if (y >= unlockedRows) {
        const costToUnlock = 5000 + ((y - unlockedRows) * 1000); // Kost steeds meer
        if (confirm(`Wil je deze fabriekszone vrijkopen voor €${costToUnlock.toLocaleString('nl-NL')}? (Geeft 2 extra rijen vrij)`)) {
            if (money >= costToUnlock) {
                money -= costToUnlock;
                unlockedRows += 2; // Speel 2 rijen tegelijk vrij
                initGrid(); // Herlaad het grid visueel
                
                // Zorg dat reeds gebouwde entiteiten weer terug in de HTML worden gezet na de initGrid
                for (let k in grid) {
                    const [ex, ey] = k.split(',').map(Number);
                    if (grid[k].obj && grid[k].obj.parentNode) {
                        grid[k].obj.parentNode.removeChild(grid[k].obj);
                    }
                    buildEntityWithDirAndRecipe(ex, ey, grid[k].type, grid[k].dir, grid[k].selectedRecipe);
                }
                
                updateUI();
                showFloatingText(`${x},${y}`, "🔓 Grond Uitgebreid!", "#20bf6b");
            } else {
                alert("Je hebt niet genoeg geld om dit gebied te kopen!");
            }
        }
        return;
    }

    // Blauwdruk Logica ... (Blijft hetzelfde)
    // Delete Logica ... (Blijft hetzelfde)

    // DRAAIEN VAN BANDEN, BRONNEN EN NU OOK MIXERS
    if (grid[key] && (grid[key].type.startsWith('conveyor') || grid[key].type === 'splitter' || grid[key].type.startsWith('source-') || grid[key].type.startsWith('mixer'))) {
        // Alleen draaien als de cursor is geselecteerd, of je datzelfde gebouw vasthoudt
        // We openen het mixer menu nog wel met cursor, maar we kunnen hem draaien door er nogmaals op te klikken als je de 'rotate' knop vast hebt.
        if (selectedTool === grid[key].type || selectedTool === 'rotate' || (selectedTool === 'cursor' && !grid[key].type.startsWith('mixer'))) {
            grid[key].obj.classList.remove(`dir-${grid[key].dir}`);
            grid[key].dir = (grid[key].dir + 1) % 4;
            grid[key].obj.classList.add(`dir-${grid[key].dir}`);
            updateEntityText(grid[key]);
            
            // Als het een mixer was en we draaiden met een tool, breek dan af zodat het modal niet opent
            if (selectedTool === 'rotate') return;
        }
    }

    // Open Mixer Menu
    if (grid[key] && grid[key].type.startsWith('mixer') && selectedTool === 'cursor') {
        openMixerModal(key);
        return;
    }

    if (selectedTool === 'cursor' || selectedTool === 'rotate') return;

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
    } else {
        if (money < toolPrice) { showFloatingText(key, "Niet genoeg geld!", "#ff6b6b"); return; }
    }

    money -= toolPrice;
    updateUI();
    buildEntity(x, y, selectedTool);
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
        
        // Pijltje toegevoegd voor de uitgang van de mixer!
        el.innerHTML = `
            <span class="mixer-badge">${tierLabel}</span>
            <div class="mixer-out-dir" id="mix-dir-${x}-${y}">${DIR_ARROWS[dir]}</div>
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

function updateEntityText(entity) {
    const dir = entity.dir, type = entity.type;
    const [x, y] = entity.obj.id.split('-').slice(1).map(Number);

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
    // Update pijltje van de mixer als je hem draait
    else if (type.startsWith('mixer')) {
        const dirEl = document.getElementById(`mix-dir-${x}-${y}`);
        if (dirEl) dirEl.innerText = DIR_ARROWS[dir];
    }
}