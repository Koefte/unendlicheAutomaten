type Rule = {
  a: (n: number) => boolean; // Bedingung
  f: (n: number) => number;  // Übergang
  A: string;                 // Eingabesymbol
};

type Tree = {
  n: number;
  children: Tree[];
};

// ----- Hilfsfunktionen -----
function patchCond(cond: string): string {
  let newCond = cond.replaceAll("=", "==");
  if (cond.trim() === "n") newCond = "n==n";
  return newCond;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSpeed(): number {
  const dial = document.getElementById("speedControl") as HTMLInputElement;
  return Math.max(100, 2000 - Number(dial.value));
}

// ----- Canvas Setup -----
const canvas = document.getElementById("automatonCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.style.cursor = "grabbing";
});
canvas.addEventListener("mouseup", () => {
  dragging = false;
  canvas.style.cursor = "grab";
});
canvas.addEventListener("mouseleave", () => (dragging = false));
canvas.addEventListener("mousemove", (e) => {
  if (dragging) {
    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    drawCanvas(true); // neu zeichnen mit aktuellem Offset
  }
});

canvas.addEventListener("wheel",(e) => {
  e.preventDefault();
  const zoom = e.deltaY < 0 ? 1.1 : 0.9;
  scale *= zoom;
  drawCanvas(true);
});

// ----- Baum erstellen -----
function buildTree(input: string, rules: Rule[], n: number = 0, depth: number = 0): Tree {
  if (depth >= input.length) return { n, children: [] };

  const ch = input[depth];
  const children: Tree[] = [];

  for (const rule of rules) {
    if (rule.A === ch && rule.a(n)) {
      const next = rule.f(n);
      children.push(buildTree(input, rules, next, depth + 1));
    }
  }

  return { n, children };
}

function drawTreeInstant(node: Tree, x: number, y: number, levelSpacing: number = 120, siblingSpacing: number = 80) {
  function drawNode(n: Tree, x: number, y: number) {
    const childCount = n.children.length;
    const startX = x - ((childCount - 1) * siblingSpacing) / 2;

    // Knoten zeichnen
    ctx.beginPath();
    ctx.fillStyle = "#4CAF50";
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n.n.toString(), x, y);


    // Kinder zeichnen
    for (let i = 0; i < n.children.length; i++) {
      const child = n.children[i];
      const childX = startX + i * siblingSpacing;
      const childY = y + levelSpacing;

      // Linie
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 25);
      ctx.lineTo(childX, childY - 25);
      ctx.stroke();

    drawNode(child, childX, childY);
    }
  }

  drawNode(node, x, y);
}
// ----- Baum zeichnen -----
async function drawTree(node: Tree, x: number, y: number, levelSpacing: number = 120, siblingSpacing: number = 80) {
  async function drawNode(n: Tree, x: number, y: number) {
    const childCount = n.children.length;
    const startX = x - ((childCount - 1) * siblingSpacing) / 2;

    // Knoten zeichnen
    ctx.beginPath();
    ctx.fillStyle = "#4CAF50";
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n.n.toString(), x, y);

    await sleep(getSpeed());

    // Kinder zeichnen
    for (let i = 0; i < n.children.length; i++) {
      const child = n.children[i];
      const childX = startX + i * siblingSpacing;
      const childY = y + levelSpacing;

      // Linie
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 25);
      ctx.lineTo(childX, childY - 25);
      ctx.stroke();

      await drawNode(child, childX, childY);
    }
  }

  await drawNode(node, x, y);
}

// ----- Gesamtes Canvas zeichnen -----
let currentTree: Tree | null = null;
let drawing = false; // verhindert Überschneidung mehrerer Animationen

async function drawCanvas(instant:boolean) {
  if (drawing) return; // während Animation keine neue starten
  drawing = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentTree) {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if(!instant) await drawTree(currentTree, 400, 50);
    else drawTreeInstant(currentTree,400,60)
    ctx.restore();
  }

  drawing = false;
}

// ----- UI -----
document.addEventListener("DOMContentLoaded", () => {
  const textAreaRules = document.getElementById("rules") as HTMLTextAreaElement;
  const textAreaInput = document.getElementById("input") as HTMLTextAreaElement;
  const button = document.getElementById("lesenBtn") as HTMLButtonElement;
  const output = document.getElementById("output") as HTMLParagraphElement;

  button.addEventListener("click", async () => {
    const ruleLines = textAreaRules.value
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rules: Rule[] = ruleLines.map((line) => {
      const [lhs, rhs] = line.split("->").map((s) => s.trim());
      let [rawCond, rawA] = lhs.split(",");
      rawCond = patchCond(rawCond);
      const a = new Function("n", `return ${rawCond}`) as (n: number) => boolean;
      const A = rawA.trim();
      const f = new Function("n", `return ${rhs}`) as (n: number) => number;
      return { a, f, A };
    });

    const input = textAreaInput.value.trim();
    output.textContent = "Wird simuliert...";
    currentTree = buildTree(input, rules);
    await drawCanvas(false);
    output.textContent = "Simulation fertig!";
  });

  drawCanvas(false);
});
