test("binary math operators", () => {
    runCode("assert(1 + 1 === 2)");
    runCode("assert(4 * 0.5 === 2)");
    runCode("assert(2 - 4 / 2 === 0)");
    runCode("assert((1 + 1) * 2 === 4)");
    runCode("assert(10 % 5 === 0)");
    runCode("assert(11 % 5 === 1)");
});

test("binary bitwise shifts", () => {
    runCode("assert(3 >> 1 === 1)");
    runCode("assert(3 >> 2 === 0)");
    runCode("assert(2 << 1 === 4)");
    runCode("assert(2 << 2 === 8)");
});

test("binary bitwise shifts", () => {
    runCode("assert(3 >> 1 === 1)");
    runCode("assert(3 >> 2 === 0)");
    runCode("assert(2 << 1 === 4)");
    runCode("assert(2 << 2 === 8)");
});

test("binary relational operators", () => {
    runCode("assert(3 < 1 === false)");
    runCode("assert(3 > 2.9 === true)");
    runCode("assert(2 <= 1 === false)");
    runCode("assert(2 <= 2 === true)");
    runCode("assert(2 >= 2 === true)");
    runCode("assert(2 > 2 === false)");
});

test("binary equality operators", () => {
    runCode("assert((1 + 1 == 2.0) === true)");
    runCode("assert((1 + 1 === 5) === false)");
    runCode("assert((1 + 1 != 5) === true)");
    runCode(`assert(("hello" + ", world" === "hello, world") === true)`);
});

test("binary bitwise operators", () => {
    runCode("assert((0 & 1) === 0)");
    runCode("assert((0 | 1) === 1)");
    runCode("assert((0 ^ 1) === 1)");
    runCode("assert((1 ^ 1) === 0)");
    runCode("assert((1 & 100) === 0)");
    runCode("assert((1 & 101) !== 0)");
});

test("binary logical operators", () => {
    runCode("assert((5 && false) === false)");
    runCode("assert((0 && 7) === 0)");
    runCode("assert((11 || 7) === 11)");
    runCode("assert((false || 7) === 7)");
    runCode("assert((false && false) === false)");
    runCode("assert((false && true) === false)");
    runCode("assert((7 && 10) === 10)");
});
