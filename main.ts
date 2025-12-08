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



let inputField: any;
let inputMachine : any;
let submitButton: any;
let speedSlider: any;
let finalStatesInput: any;
let inputText: string = '';
let inputWord: string = '';
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

  let button = createButton("Submit");
  button.position(10, 220);
  button.mousePressed(handleSubmit);
  submitButton = button;
  
  // Speed slider
  speedSlider = createSlider(100, 2000, 500, 100);
  speedSlider.position(10, 310);
  speedSlider.size(200);
  speedSlider.hide();
  
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
  
  // Parse final state predicate
  let finalStateStr = finalStatesInput.value().trim();
  if (finalStateStr) {
    try {
      finalStatePredicate = new Function("n", `return ${finalStateStr}`) as (n: number) => boolean;
      console.log('Final state predicate:', finalStateStr);
    } catch (e) {
      throw new Error(`Invalid final state condition: ${finalStateStr}`);
    }
  } else {
    finalStatePredicate = () => false;
  }
  
  // Build the computation tree
  computationTree = buildComputationTree(currentState, 0, inputWord, rules);
  
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
  finalStatesInput.hide();
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

function displayRule(rule: Rule): string {
  return `(${rule.a.toString().replace("function anonymous(n) { return ", "").slice(0, -1)}, ${rule.A}) -> ${rule.f
    .toString()
    .replace("function anonymous(n) { return ", "")
    .slice(0, -1)}`;
}