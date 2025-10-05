document.addEventListener("DOMContentLoaded", function () {
    var textArea = document.getElementById("rules");
    var button = document.getElementById("lesenBtn");
    button.addEventListener("click", function () {
        var text = textArea.value; // Inhalt des Textfeldes
        var rulesRaw = text.split("\n").map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });
        var rules = rulesRaw.map(function (line) {
            var _a = line.split("->").map(function (s) { return s.trim(); }), lhs = _a[0], rhs = _a[1];
            var _b = lhs.split(","), rawCond = _b[0], rawA = _b[1];
            var a = new Function("n", "return ".concat(rawCond.trim()));
            var A = rawA.trim();
            console.log(rhs);
            var f = new Function("n", "return ".concat(rhs));
            return { a: a, f: f, A: A };
        });
        var input = document.getElementById("input").value.trim();
        var n = 0;
        for (var _i = 0, input_1 = input; _i < input_1.length; _i++) {
            var character = input_1[_i];
            var found = false;
            for (var _a = 0, rules_1 = rules; _a < rules_1.length; _a++) {
                var rule = rules_1[_a];
                if (rule.a(n) && rule.A == character) {
                    n = rule.f(n);
                    found = true;
                    break;
                }
            }
            if (!found)
                console.error("No transition for state ".concat(n, " and character ").concat(character));
        }
        var output = document.getElementById("output");
        output.textContent = "Output: ".concat(n);
    });
});
