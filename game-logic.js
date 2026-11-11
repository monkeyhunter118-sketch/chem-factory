// GRID & SPEL STATUS VARIABLES
let GRID_WIDTH = Math.floor((window.innerWidth - 340) / CELL_SIZE) * 3;
let GRID_HEIGHT = Math.floor(window.innerHeight / CELL_SIZE) * 3;

let money = 1000;
let playerLevel = 1;
let selectedTool = 'cursor';
let toolPrice = 0;
let currentBuildDir = 1;
let activeMixerKey = null;
let currentTab = 'build';
let tickCounter = 0;

// BLAUWDRUK STATUS
let savedBlueprint = null;
let blueprintCost = 0;
let blueprintStep = 0;
let bpStartX = null;
let bpStartY = null;

const grid = {}; 
let items = []; 
let itemIdCounter = 0;

// ITEM TRANSPORTEREN & VISUELE POSITIE BEREKENINGEN
function updateVisualPosition(item, slotIndex = 0) {
    const cell = grid[`${item.x},${item.y}`];
    let dir = item.lastDir !== undefined ? item.lastDir : 1;
    if (cell && cell.dir !== undefined) dir = cell.dir;

    const dirVec = DIRS[dir];
    const slotOffset = (1 - slotIndex) * 11;
    const centerX = (item.x * CELL_SIZE) + 13;
    const centerY = (item.y * CELL_SIZE) + 13;

    const posX = centerX + (dirVec.dx * slotOffset);
    const posY = centerY + (dirVec.dy * slotOffset);

    item.visual.style.left = `${posX}px`;
    item.visual.style.top = `${posY}px`;
}

function spawnItem(type, x, y) {
    const gridContainer = document.getElementById('grid-container');
    const id = itemIdCounter++;
    const el = document.createElement('div');
    el.className = 'item';
    
    const icon = ITEM_ICONS[type] || '🧪';
    const color = ELEMENT_COLORS[type] || RECIPES.find(r => r.id === type)?.color || '#20bf6b';
    el.style.backgroundColor = color;
    el.innerHTML = `<span class="item-icon">${icon}</span><span class="item-text">${type}</span>`;

    const itemObj = { id, type, x, y, visual: el, movedThisTick: false, lastDir: 1 };
    items.push(itemObj);

    updateVisualPosition(itemObj, 0);
    gridContainer.appendChild(el);
}

function triggerAnimation(entityObj, classCss) {
    if (!entityObj || !entityObj.obj) return;
    entityObj.obj.classList.remove(classCss);
    void entityObj.obj.offsetWidth;
    entityObj.obj.classList.add(classCss);
    setTimeout(() => entityObj.obj.classList.remove(classCss), 350);
}

// MARKT- EN BEREKENINGSLOGICA
function processItemSale(itemType) {
    let value = ELEMENT_VALUES[itemType] || 0;
    const recipe = RECIPES.find(r => r.id === itemType);

    if (recipe) {
        value = recipe.currentValue;
        recipe.currentValue = Math.max(recipe.minPrice, Math.floor(recipe.currentValue * 0.95));
    }

    money += value;
    updateUI();
    return value;
}

function updateDynamicMarketPrices() {
    RECIPES.forEach(recipe => {
        if (recipe.lvl <= playerLevel) {
            const maxPrice = Math.floor(recipe.baseValue * 2.0);
            if (recipe.currentValue < maxPrice) {
                recipe.currentValue = Math.min(maxPrice, Math.floor(recipe.currentValue * 1.03) + 1);
            }
        }
    });
    updateUI();
}

// HOOFDTICK LUS FOR ENGINE & MIXERS
function gameTick() {
    tickCounter++;
    const now = Date.now();

    if (tickCounter % 8 === 0) {
        updateDynamicMarketPrices();
    }

    // 1. Bron spawner cooldown (2000ms)
    for (const key in grid) {
        const entity = grid[key];
        if (entity.type.startsWith('source-')) {
            if (now - entity.lastSpawnTime >= 2000) {
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

    // 2. Transport over lopende banden en splitsers
    items.forEach(item => {
        if (item.movedThisTick) return;

        const currentKey = `${item.x},${item.y}`;
        const currentCell = grid[currentKey];

        if (currentCell) {
            let moveDirs = [];
            
            if (currentCell.type.startsWith('source-') || currentCell.type.startsWith('conveyor')) {
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
                    if (nextCell && (nextCell.type.startsWith('conveyor') || nextCell.type === 'splitter' || nextCell.type.startsWith('mixer') || nextCell.type === 'inleverpunt')) {
                        
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

                            if (nextCell.type.startsWith('mixer')) {
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
        cellItems.forEach((item, slotIndex) => updateVisualPosition(item, slotIndex));
    }

    // 3. Chemische Mixers bereiding
    for (const key in grid) {
        const entity = grid[key];
        if (entity.type.startsWith('mixer')) {
            const [mx, my] = key.split(',').map(Number);
            const pbar = document.getElementById(`pbar-${mx}-${my}`);

            if (entity.craftingState) {
                entity.craftingState.progress += entity.speedMultiplier;
                const pct = (entity.craftingState.progress / entity.craftingState.maxProgress) * 100;
                if (pbar) pbar.style.width = `${Math.min(100, pct)}%`;

                if (entity.craftingState.progress >= entity.craftingState.maxProgress) {
                    const recipe = entity.craftingState.recipe;
                    let outputTarget = null;

                    for (const dir of DIRS) {
                        const tx = mx + dir.dx; ty = my + dir.dy;
                        const targetCell = grid[`${tx},${ty}`];

                        if (targetCell && (targetCell.type.startsWith('conveyor') || targetCell.type === 'splitter' || targetCell.type === 'inleverpunt' || targetCell.type.startsWith('mixer'))) {
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
                        } else if (targetCell.type.startsWith('mixer')) {
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
                        entity.craftingState = { recipe: recipe, progress: 0, maxProgress: recipe.craftTicks };
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
            delete grid[key];
        }
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