// p5.js global mode declarations
let DRAW = false;
let rules: Rule[] = [];
let currentState: number = 0;
let inputPosition: number = 0;
let finalStatePredicate: (n: number) => boolean = () => false;

type Rule = {
  a: (n: number) => boolean; // Bedingung
  f: (n: number) => number;  // Übergang
  A: string;                 // Eingabesymbol
};

type Tree = {
  state: number;
  inputPos: number;
  children: Tree[];
  x?: number;
  y?: number;
  size?: number;
};

type Preset = {
  name: string;
  rules: string;
  inputWord: string;
  seed: string;
  finalStates: string;
};



let inputField: any;
let inputMachine : any;
let seedInput: any;
let submitButton: any;
let speedSlider: any;
let finalStatesInput: any;
let savePresetButton: any;
let presetNameInput: any;
let presetSelect: any;
let loadPresetButton: any;
let deletePresetButton: any;
let inputText: string = '';
let inputWord: string = '';
let presets: Preset[] = [];
let computationTree: Tree | null = null;
let nodesToDraw: Tree[] = [];
let currentDrawIndex: number = 0;
let lastDrawTime: number = 0;
let drawSpeed: number = 500;
let zoomLevel: number = 1;
let panX: number = 0;
let panY: number = 0;
let isDragging: boolean = false;
let lastMouseX: number = 0;
let lastMouseY: number = 0;
let growthRateWr: number = 0;

(window as any).setup = function() {
  createCanvas(windowWidth, windowHeight);
  let area = createElement("textarea");
  area.size(400, 200);
  area.position(10, 10);
  area.attribute("placeholder", "Geben Sie die Regeln hier ein, z.B.:\n(n % 2 === 0, 'a') -> n / 2\n(n % 2 === 1, 'b') -> 3 * n + 1");
  area.elt.style.resize = "none";
  inputField = area;
  inputMachine = createInput(""),
  inputMachine.position(10, 250);
  inputMachine.size(200);
  inputMachine.attribute("placeholder", "Eingabewort hier eingeben");

  finalStatesInput = createInput("");
  finalStatesInput.position(10, 280);
  finalStatesInput.size(200);
  finalStatesInput.attribute("placeholder", "Endzustand (z.B. n === 0 oder n < 1 oder n % 2 === 0)");

  seedInput = createInput("0");
  seedInput.position(10, 310);
  seedInput.size(200);
  seedInput.attribute("type", "number");
  seedInput.attribute("placeholder", "Startwert/Seed (z.B. 0)");

  let button = createButton("Submit");
  button.position(10, 220);
  button.mousePressed(handleSubmit);
  submitButton = button;
  
  // Preset management UI
  presetNameInput = createInput("");
  presetNameInput.position(220, 250);
  presetNameInput.size(150);
  presetNameInput.attribute("placeholder", "Preset-Name");
  
  savePresetButton = createButton("Preset speichern");
  savePresetButton.position(220, 220);
  savePresetButton.mousePressed(saveCurrentPreset);
  
  presetSelect = createSelect();
  presetSelect.position(380, 250);
  presetSelect.size(150);
  presetSelect.option("-- Wählen Sie ein Preset --");
  
  loadPresetButton = createButton("Laden");
  loadPresetButton.position(380, 220);
  loadPresetButton.mousePressed(loadSelectedPreset);
  
  deletePresetButton = createButton("Löschen");
  deletePresetButton.position(500, 220);
  deletePresetButton.mousePressed(deleteSelectedPreset);
  
  // Speed slider
  speedSlider = createSlider(100, 2000, 500, 100);
  speedSlider.position(10, 340);
  speedSlider.size(200);
  speedSlider.hide();
  
  // Load presets from storage
  loadPresetsFromStorage();
  
};

(window as any).windowResized = function() {
  resizeCanvas(windowWidth, windowHeight);
  if (computationTree) {
    layoutTree(computationTree, width / 2, 50, width - 100);
  }
};

(window as any).mouseWheel = function(event: any) {
  if (DRAW) {
    // Zoom in/out with mouse wheel
    let zoomFactor = 1.1;
    if (event.delta > 0) {
      zoomLevel /= zoomFactor;
    } else {
      zoomLevel *= zoomFactor;
    }
    // Limit zoom range
    zoomLevel = constrain(zoomLevel, 0.1, 10);
    return false; // Prevent page scrolling
  }
};

(window as any).mousePressed = function() {
  if (DRAW) {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
};

(window as any).mouseReleased = function() {
  isDragging = false;
};

(window as any).mouseDragged = function() {
  if (DRAW && isDragging) {
    // Update pan position
    panX += mouseX - lastMouseX;
    panY += mouseY - lastMouseY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
};


// p5.js draw function
(window as any).draw = function() {
  if (DRAW && computationTree) {
    background(240);
    
    // Update draw speed from slider
    drawSpeed = speedSlider.value();
    
    // Draw UI elements before transformation
    fill(0);
    textAlign(LEFT, TOP);
    textSize(16);
    text('Speed: ' + drawSpeed + 'ms', 10, 10);
    text('Zoom: ' + zoomLevel.toFixed(2) + 'x', 10, 30);
    text('Pan/Drag: Click and drag', 10, 50);
    text('Zoom: Mouse wheel', 10, 70);
    text('Growth Rate (w_r): ' + growthRateWr.toFixed(4), 10, 90);
    
    // Apply pan and zoom transformations
    push();
    translate(panX, panY);
    scale(zoomLevel);
    
    // Step-by-step drawing
    let currentTime = millis();
    if (currentDrawIndex < nodesToDraw.length && currentTime - lastDrawTime > drawSpeed) {
      currentDrawIndex++;
      lastDrawTime = currentTime;
    }
    
    // Draw only the nodes up to currentDrawIndex
    drawTreePartial(computationTree, currentDrawIndex);
    
    pop();
  }
};


function drawArrow(x1 : number, y1 : number, x2 : number, y2 : number) {
  let arrowSize = 10;
  
  // Draw the line part of the arrow (shaft)
  line(x1, y1, x2, y2);
  
  // Calculate the angle of the arrowhead
  let angle = atan2(y2 - y1, x2 - x1);
  
  // Draw the arrowhead (two triangles)
  push();
  translate(x2, y2);
  rotate(angle);
  triangle(0, 0, -arrowSize, -arrowSize / 2, -arrowSize, arrowSize / 2);
  pop();
}


function getNextStates(rules: Rule[], currentState: number,input: string): number[] {
  let nextStates: number[] = [];
  for (let rule of rules) {
    if (rule.a(currentState) && rule.A == input) {
      let nextState = rule.f(currentState);
      nextStates.push(nextState);
      console.log(`From state ${currentState} with input '${rule.A}' to state ${nextState}`);
    }
  }
  return nextStates;
}

function drawCircle(x: number, y: number, radius: number, label: string, size: number) {
  ellipse(x, y, radius * 2, radius * 2);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(size);
  text(label, x, y);
  fill(255);
}

function calculateGrowthRateWr(inputWord: string, rules: Rule[], seed: number): number {
  // Calculate w_r as defined:
  // For each b ∈ Σ: F_b = δ(A × b) = set of all transition functions for symbol b
  // λ_b(x) = (∏_{f∈F_b} f(x)) / |F_b|
  // w_r = (∏_{b∈Σ} λ_b) / |Σ|
  
  if (rules.length === 0 || inputWord.length === 0) return 0;
  
  // Extract unique input symbols from the word
  let inputSymbols = Array.from(new Set(inputWord.split('')));
  
  // For each symbol b, calculate λ_b(seed)
  let productOfLambdas = 1;
  
  for (let symbol of inputSymbols) {
    // Get F_b: all transition functions for this symbol
    let transitionFunctions: ((n: number) => number)[] = [];
    
    for (let rule of rules) {
      if (rule.A === symbol) {
        transitionFunctions.push(rule.f);
      }
    }
    
    if (transitionFunctions.length === 0) continue;
    
    // Calculate λ_b(seed) = (∏_{f∈F_b} f(seed)) / |F_b|
    let productOfTransitions = 1;
    for (let f of transitionFunctions) {
      let result = f(seed);
      productOfTransitions *= result;
    }
    
    let lambda_b = productOfTransitions / transitionFunctions.length;
    productOfLambdas *= lambda_b;
  }
  
  // w_r = (∏_{b∈Σ} λ_b) / |Σ|
  let w_r = productOfLambdas / inputSymbols.length;
  
  return w_r;
}

function buildComputationTree(state: number, inputPos: number, word: string, rules: Rule[], maxDepth: number = 20, depth: number = 0): Tree {
  // Calculate size: start at 40px and decrease by 10% per level, minimum 10px
  let size = Math.max(10, 40 * Math.pow(0.9, depth));
  let node: Tree = { state, inputPos, children: [], size };
  
  // Base case: reached final state - terminate
  if (finalStatePredicate(state)) {
    return node;
  }
  
  // Base case: reached end of input or max depth
  if (inputPos >= word.length || maxDepth <= 0) {
    return node;
  }
  
  // Get next possible states
  let nextStates = getNextStates(rules, state, word.charAt(inputPos));
  
  // Build children recursively
  for (let nextState of nextStates) {
    let child = buildComputationTree(nextState, inputPos + 1, word, rules, maxDepth - 1, depth + 1);
    node.children.push(child);
  }
  
  return node;
}

function layoutTree(node: Tree, x: number, y: number, width: number) {
  node.x = x;
  node.y = y;
  
  if (node.children.length === 0) {
    return;
  }
  
  let childWidth = width / node.children.length;
  let startX = x - width / 2 + childWidth / 2;
  
  for (let i = 0; i < node.children.length; i++) {
    let childX = startX + i * childWidth;
    let childY = y + 80;
    layoutTree(node.children[i]!, childX, childY, childWidth * 0.8);
  }
}

function flattenTree(node: Tree, result: Tree[] = []): Tree[] {
  result.push(node);
  for (let child of node.children) {
    flattenTree(child, result);
  }
  return result;
}

function drawTreePartial(node: Tree, maxNodes: number, drawnNodes: Set<Tree> = new Set()): void {
  if (drawnNodes.size >= maxNodes || !node.x || !node.y) return;
  
  drawnNodes.add(node);
  
  // Draw connections to children that should be visible
  stroke(0);
  strokeWeight(2);
  for (let child of node.children) {
    if (child.x && child.y && drawnNodes.size < maxNodes) {
      line(node.x, node.y, child.x, child.y);
      
      // Draw arrow at the end
      let angle = atan2(child.y - node.y, child.x - node.x);
      push();
      translate(child.x, child.y);
      rotate(angle);
      fill(0);
      triangle(0, 0, -10, -5, -10, 5);
      pop();
    }
  }
  
  // Draw node
  let nodeSize = node.size || 40;
  
  // Check if this is a final state
  let isFinalState = finalStatePredicate(node.state);
  
  if (isFinalState) {
    // Final states are filled with a different color and have a double circle
    fill(100, 200, 100);
    stroke(0);
    strokeWeight(2);
    ellipse(node.x, node.y, nodeSize, nodeSize);
    stroke(0);
    strokeWeight(2);
    noFill();
    ellipse(node.x, node.y, nodeSize + 8, nodeSize + 8);
  } else {
    fill(200, 220, 255);
    stroke(0);
    strokeWeight(2);
    ellipse(node.x, node.y, nodeSize, nodeSize);
  }
  
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(Math.max(10, nodeSize * 0.4)); // Scale text with node size
  text(node.state.toString(), node.x, node.y);
  
  // Draw children recursively
  for (let child of node.children) {
    if (drawnNodes.size < maxNodes) {
      drawTreePartial(child, maxNodes, drawnNodes);
    }
  }
}

function handleSubmit() {
  inputText = inputField.value();
  console.log('Input submitted:', inputText);
  rules = parseRules(inputText);
  console.log('Parsed rules:');
  rules.forEach((rule, index) => {
    console.log(`Rule ${index + 1}: ${displayRule(rule)}`);
  });
  inputWord = inputMachine.value();
  console.log('Input word:', inputWord);
  
  // Parse seed
  let seedStr = seedInput.value().trim();
  let seed = 0;
  if (seedStr) {
    let parsedSeed = parseInt(seedStr);
    if (isNaN(parsedSeed)) {
      throw new Error(`Invalid seed: ${seedStr}. Please enter a number.`);
    }
    seed = parsedSeed;
  }
  console.log('Seed:', seed);
  
  // Parse final state predicate
  let finalStateStr = finalStatesInput.value().trim();
  if (finalStateStr) {
    try {
      finalStatePredicate = new Function("n", `return ${finalStateStr}`) as (n: number) => boolean;
      console.log('Final state predicate:', finalStateStr);
    } catch (e) {
      console.error('Error parsing final state condition:', e);
      throw new Error(`Invalid final state condition: ${finalStateStr}. Error: ${(e as Error).message}`);
    }
  } else {
    finalStatePredicate = () => false;
  }
  
  // Calculate growth rate w_r
  growthRateWr = calculateGrowthRateWr(inputWord, rules, seed);
  console.log('Growth rate (w_r):', growthRateWr);
  
  // Build the computation tree
  computationTree = buildComputationTree(seed, 0, inputWord, rules);
  
  // Flatten tree for animation
  nodesToDraw = flattenTree(computationTree);
  currentDrawIndex = 0;
  lastDrawTime = millis();
  
  // Calculate tree layout
  layoutTree(computationTree, width / 2, 50, width - 100);
  
  DRAW = true;
  //hide input elements
  inputField.hide();
  inputMachine.hide();
  seedInput.hide();
  finalStatesInput.hide();
  presetNameInput.hide();
  savePresetButton.hide();
  presetSelect.hide();
  loadPresetButton.hide();
  deletePresetButton.hide();
  submitButton.hide();
  speedSlider.show();
}

function parseRules(rulesInput: string): Rule[] {
  let rules: Rule[] = [];
  const ruleLines = rulesInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    rules = ruleLines.map((line) => {
      const [lhs, rhs] = line.split("->").map((s) => s.trim());
      if(lhs === undefined || rhs === undefined) {
        throw new Error(`Invalid rule format: ${line}`);
      }
      let [rawCond, rawA] = lhs.split(",");
      if(rawCond === undefined || rawA === undefined) {
        throw new Error(`Invalid rule LHS format: ${lhs}`);
      }
      const a = new Function("n", `return ${rawCond}`) as (n: number) => boolean;
      const A = rawA.trim();
      const f = new Function("n", `return ${rhs}`) as (n: number) => number;
      return { a, f, A };
    });

    
  return rules;
}

function savePresetsToStorage() {
  localStorage.setItem('automata_presets', JSON.stringify(presets));
  console.log('Presets saved to storage');
}

function loadPresetsFromStorage() {
  let stored = localStorage.getItem('automata_presets');
  if (stored) {
    presets = JSON.parse(stored);
    console.log('Presets loaded from storage:', presets);
    updatePresetSelect();
  }
}

function updatePresetSelect() {
  // Clear existing options
  presetSelect.elt.innerHTML = '<option value="">-- Wählen Sie ein Preset --</option>';
  
  // Add preset options
  for (let preset of presets) {
    let option = document.createElement('option');
    option.value = preset.name;
    option.text = preset.name;
    presetSelect.elt.appendChild(option);
  }
}

function saveCurrentPreset() {
  let presetName = presetNameInput.value().trim();
  if (!presetName) {
    alert('Bitte geben Sie einen Namen für das Preset ein.');
    return;
  }
  
  let newPreset: Preset = {
    name: presetName,
    rules: inputField.value(),
    inputWord: inputMachine.value(),
    seed: seedInput.value(),
    finalStates: finalStatesInput.value()
  };
  
  // Remove existing preset with same name
  presets = presets.filter(p => p.name !== presetName);
  
  // Add new preset
  presets.push(newPreset);
  savePresetsToStorage();
  
  presetNameInput.value('');
  alert(`Preset '${presetName}' gespeichert!`);
}

function loadSelectedPreset() {
  let selectedName = presetSelect.value();
  if (!selectedName) return;
  
  let preset = presets.find(p => p.name === selectedName);
  if (preset) {
    inputField.value(preset.rules);
    inputMachine.value(preset.inputWord);
    seedInput.value(preset.seed);
    finalStatesInput.value(preset.finalStates);
    console.log('Preset geladen:', preset.name);
  }
}

function deleteSelectedPreset() {
  let selectedName = presetSelect.value();
  if (!selectedName) {
    alert('Bitte wählen Sie ein Preset aus.');
    return;
  }
  
  if (confirm(`Möchten Sie das Preset '${selectedName}' löschen?`)) {
    presets = presets.filter(p => p.name !== selectedName);
    savePresetsToStorage();
    presetSelect.value('');
    updatePresetSelect();
    alert(`Preset '${selectedName}' gelöscht!`);
  }
}

function displayRule(rule: Rule): string {
  return `(${rule.a.toString().replace("function anonymous(n) { return ", "").slice(0, -1)}, ${rule.A}) -> ${rule.f
    .toString()
    .replace("function anonymous(n) { return ", "")
    .slice(0, -1)}`;
}