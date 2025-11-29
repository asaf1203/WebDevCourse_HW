document.addEventListener("DOMContentLoaded", () => {
    pageLoaded();
});

let txt1;
let txt2;
let btnCalc;
let lblRes;
let opSelect;

function pageLoaded() {
    txt1 = document.getElementById("txt1");
    txt2 = document.querySelector("#txt2");     // alternative way to get element by ID
    btnCalc = document.getElementById("btnCalc");
    lblRes = document.getElementById("lblRes");
    opSelect = document.getElementById("operator");

    btnCalc.addEventListener("click", () => {
        calculate();
    });

    // Validate inputs on the fly and mark invalid input fields
    if (txt1) txt1.addEventListener('input', () => validateNumberInput(txt1));
    if (txt2) txt2.addEventListener('input', () => validateNumberInput(txt2));
}

function validateNumberInput(el) {
    if (!el) return false;
    const raw = el.value.trim();
    const num = parseFloat(raw);
    if (raw === '') {
        // Do not mark empty fields as invalid while the user hasn't entered anything
        el.classList.remove('is-invalid');
        el.classList.remove('is-valid');
        return false;
    }
    if (isNaN(num)) {
        el.classList.add('is-invalid');
        el.classList.remove('is-valid');
        return false;
    } else {
        el.classList.remove('is-invalid');
        el.classList.add('is-valid');
        return true;
    }
}

function calculate() {
    const val1 = parseFloat(txt1.value);
    const val2 = parseFloat(txt2.value);
    // mark invalid inputs if necessary (and stop the calculation)
    const valid1 = validateNumberInput(txt1);
    const valid2 = validateNumberInput(txt2);
    // If field is empty at calculate time, mark as invalid so user sees the error
    if (txt1 && txt1.value.trim() === '') txt1.classList.add('is-invalid');
    if (txt2 && txt2.value.trim() === '') txt2.classList.add('is-invalid');
    if (!valid1 || !valid2 || isNaN(val1) || isNaN(val2)) {
        lblRes.innerText = 'Please enter two numbers';
        return;
    }

    const op = opSelect ? opSelect.value : '+';
    let result;
    switch (op) {
        case '+':
            result = val1 + val2;
            break;
        case '-':
            result = val1 - val2;
            break;
        case '*':
            result = val1 * val2;
            break;
        case '/':
            if (val2 === 0) result = 'Error: division by 0';
            else result = val1 / val2;
            break;
        default:
            result = 'Unknown operator';
    }

    lblRes.innerText = result;

    // Also print the full equation into the output textarea (e.g. "4 + 6 = 10")
    const aStr = txt1.value.trim();
    const bStr = txt2.value.trim();
    const equation = `${aStr} ${op} ${bStr} = ${result}`;
    print(equation, true);
}

const btn2 = document.getElementById("btn2");
btn2.addEventListener("click", () => {
    print("btn2 clicked! id: " + btn2.id + ", value: " + btn2.innerText);
});


function print(msg, alsoToOutput = false) {
    // Always log to console for debugging
    console.log(msg);

    // If requested, also write the message into the output textarea (append, preserving history)
    if (alsoToOutput === true) {
        const ta = document.getElementById("output");
        if (ta) {
            // Append with newline so previous calculations remain visible
            if (ta.value && ta.value.length > 0) ta.value += "\n" + msg;
            else ta.value = msg;
        }
    }
}

function demoNative() {
    let out = "=== STEP 1: NATIVE TYPES ===\n";

    // String
    const s = "Hello World";
    out += "\n[String] s = " + s;
    out += "\nLength: " + s.length;
    out += "\nUpper: " + s.toUpperCase();

    // Number
    const n = 42;
    out += "\n\n[Number] n = " + n;

    // Boolean
    const b = true;
    out += "\n\n[Boolean] b = " + b;

    // Date
    const d = new Date();
    out += "\n\n[Date] now = " + d.toISOString();

    // Array
    const arr = [1, 2, 3, 4];
    out += "\n\n[Array] arr = [" + arr.join(", ") + "]";
    out += "\nPush 5 → " + (arr.push(5), arr.join(", "));
    out += "\nMap x2 → " + arr.map(x => x * 2).join(", ");

    // Functions as variables
    const add = function (a, b) { return a + b; };
    out += "\n\n[Function as variable] add(3,4) = " + add(3, 4);

    // Callback
    function calc(a, b, fn) { return fn(a, b); }
    const result = calc(10, 20, (x, y) => x + y);
    out += "\n[Callback] calc(10,20, x+y ) = " + result;

    print(out);
}