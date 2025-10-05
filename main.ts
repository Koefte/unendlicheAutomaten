type Rule = {
  a: (n: number) => boolean;
  f: (n: number) => number;
  A: string;
};

function patchCond(cond: string): string {
  let newCond = cond.replaceAll("=", "==");
  if (cond.trim() === "n") newCond = "n==n";
  return newCond;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSpeed():number{
    const dial = document.getElementById("speedControl") as HTMLInputElement
    console.log(dial.value)
    return 2000 - Number(dial.value)
}

async function animateSimulation(input: string, rules: Rule[]) {
  const vis = document.getElementById("visualization") as HTMLDivElement;
  const svg = document.getElementById("svgArrows") as unknown as SVGSVGElement;
  const circle = document.getElementById("stateCircle") as HTMLDivElement;

  svg.innerHTML = ""; // Clear arrows
  let n = 0;
  circle.textContent = n.toString();
  circle.style.left = "20px";
  circle.style.top = "70px";

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    let found = false;

    for (const rule of rules) {
      if (rule.a(n) && rule.A === ch) {
        const next = rule.f(n);
        found = true;

        // Calculate simple positions
        const startX =  i * 100;
        const endX = startX + 100;
        const y = 100;

        // Draw arrow
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
        arrow.setAttribute("x1", `${startX}`);
        arrow.setAttribute("y1", `${y}`);
        arrow.setAttribute("x2", `${endX}`);
        arrow.setAttribute("y2", `${y}`);
        arrow.setAttribute("stroke", "black");
        arrow.setAttribute("stroke-width", "2");
        arrow.setAttribute("marker-end", "url(#arrowhead)");

        // Add arrowhead marker (if not already added)
        if (!svg.querySelector("marker")) {
          const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
          marker.setAttribute("id", "arrowhead");
          marker.setAttribute("markerWidth", "10");
          marker.setAttribute("markerHeight", "7");
          marker.setAttribute("refX", "10");
          marker.setAttribute("refY", "3.5");
          marker.setAttribute("orient", "auto");
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", "M0,0 L10,3.5 L0,7 Z");
          path.setAttribute("fill", "black");
          marker.appendChild(path);
          defs.appendChild(marker);
          svg.appendChild(defs);
        }

        const labelRule = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelRule.setAttribute("x", `${(startX + endX) / 2}`);
        labelRule.setAttribute("y", `${80}`);
        labelRule.setAttribute("text-anchor", "middle");
        labelRule.classList.add("label");
        labelRule.textContent = rule.f.toString().slice(rule.f.toString().indexOf("{") + 1,rule.f.toString().indexOf("}")).replace("return","");
        svg.appendChild(labelRule);

        const labelCh = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelCh.setAttribute("x", `${(startX + endX) / 2}`);
        labelCh.setAttribute("y", `${120}`);
        labelCh.setAttribute("text-anchor", "middle");
        labelCh.classList.add("label");
        labelCh.textContent = ch
        svg.appendChild(labelCh);



        svg.appendChild(arrow);

        // Animate circle moving to next state
        circle.style.left = `${endX - 30}px`;
        circle.style.top = `${y - 30}px`;
        circle.textContent = next.toString();
        circle.style.background = `hsl(${(next * 60) % 360}, 70%, 50%)`;

        n = next;
        await sleep(getSpeed());
        break;
      }
    }

    if (!found) {
      console.error(`No transition for state ${n} and '${ch}'`);
      break;
    }
  }

  return n;
}

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
    output.textContent = "Simulating...";
    const result = await animateSimulation(input, rules);
    output.textContent = `Output: ${result}`;
  });
});
