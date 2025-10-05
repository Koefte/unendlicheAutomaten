
type Rule = {
    a: (n:number) => boolean
    f: (n:number) => number
    A:string
}


document.addEventListener("DOMContentLoaded", () => {
  const textArea = document.getElementById("rules") as HTMLTextAreaElement;
  const button = document.getElementById("lesenBtn") as HTMLButtonElement;

  button.addEventListener("click", () => {
    const text = textArea.value; // Inhalt des Textfeldes
    let rulesRaw : string[] = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const rules: Rule[] = rulesRaw.map(line =>{
        const [lhs, rhs] = line.split("->").map(s => s.trim());
        let [rawCond,rawA] = lhs.split(",")
        const a = new Function("n",`return ${rawCond.trim()}`) as (n:number) => boolean
        const A = rawA.trim()
        console.log(rhs)
        const f = new Function("n",`return ${rhs}`) as (n:number) => number
        return {a,f,A}
    })
    const input = (document.getElementById("input") as HTMLTextAreaElement).value.trim()
    let n:number = 0
    for(let character of input){
        let found = false
        for(let rule of rules){
            if(rule.a(n) && rule.A == character) {
                n = rule.f(n)
                found = true
                break
            }
        }
        if(!found) console.error(`No transition for state ${n} and character ${character}`)

    }

    const output = (document.getElementById("output") as HTMLParagraphElement)
    output.textContent = `Output: ${n}`

    
    
  });
});
