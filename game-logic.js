// GRID & SPEL STATUS VARIABLES
let GRID_WIDTH = Math.floor((window.innerWidth - 340) / CELL_SIZE) * 3;
// Speelveld 2x zo hoog
let GRID_HEIGHT = Math.floor(window.innerHeight / CELL_SIZE) * 6; 
let unlockedRows = Math.floor(GRID_HEIGHT / 2); // Helft van het veld is vrij in het begin

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

// BEREKENINGSLOGICA - MARKT STABILISATIE TOEGEVOEGD
function processItemSale(itemType) {
    let value = ELEMENT_VALUES[itemType] || 0;
    const recipe = RECIPES.find(r => r.id === itemType);

    if (recipe) {
        value = recipe.currentValue;
        // Check of de laatste verkoop langer dan 10 ticks geleden is
        if (!recipe.lastSoldTick || tickCounter - recipe.lastSoldTick >= 10) {
            recipe.currentValue = Math.max(recipe.minPrice, Math.floor(recipe.currentValue * 0.95));
        }
        // Update ALTIJD de verkoop tick, zodat meerdere items achter elkaar de prijs niet instorten
        recipe.lastSoldTick = tickCounter; 
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

// HOOFDTICK LUS
function gameTick() {
    tickCounter++;
    const now = Date.now();

    if (tickCounter % 8 === 0) updateDynamicMarketPrices();

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

    items.forEach(item => {
        if (item.movedThisTick) return;

        const currentKey = `${item.x},${item.y}`;
        const currentCell = grid[currentKey];

        if (currentCell) {
            let moveDirs = [];
            
            // Mixers doen zelf geen transport van items die al IN de cel liggen (die zitten in de inventory)
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

                if (nextX >= 0 && nextX < GRID_WIDTH && nextY >= 0 && nextY < unlockedRows) {
                    if (nextCell && (nextCell.type.startsWith('conveyor') || nextCell.type === 'splitter' || nextCell.type.startsWith('mixer') || nextCell.type === 'inleverpunt')) {
                        
                        const itemsOnNextCell = items.filter(i => i.x === nextX && i.y === nextY);
                        const maxCap = (nextCell.type.startsWith('conveyor') || nextCell.type === 'splitter') ? 3 : 1;
                        
                        if (itemsOnNextCell.length < maxCap) {
                            item.x = nextX;
                            item.y = nextY;
                            item.lastDir = DIRS.findIndex(d => d.dx === dirVec.dx && d.dy === dirVec.dy);
                            item.movedThisTick = true;

                            if (currentCell.type === 'splitter') currentCell.splitToggle = 1 - currentCell.splitToggle;

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

    // 3. Chemische Mixers bereiding - MET VASTE UITGANG
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

                    // KIJKT NU ALLEEN NAAR DE RICHTING VAN DE MIXER (entity.dir)
                    const dirVec = DIRS[entity.dir];
                    const tx = mx + dirVec.dx; 
                    const ty = my + dirVec.dy;
                    const targetCell = grid[`${tx},${ty}`];

                    if (tx >= 0 && tx < GRID_WIDTH && ty >= 0 && ty < unlockedRows) {
                        if (targetCell && (targetCell.type.startsWith('conveyor') || targetCell.type === 'splitter' || targetCell.type === 'inleverpunt' || targetCell.type.startsWith('mixer'))) {
                            const itemsOnTarget = items.filter(i => i.x === tx && i.y === ty);
                            const maxCap = (targetCell.type.startsWith('conveyor') || targetCell.type === 'splitter') ? 3 : 1;
                            if (itemsOnTarget.length < maxCap) {
                                outputTarget = { x: tx, y: ty };
                            }
                        }
                    }

                    if (outputTarget) {
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

// REST VAN JE GAME-LOGIC BLIJFT HETZELFDE (sellEntireFactory, upgradeLevel, etc.)