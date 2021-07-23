test("unary negation", () => {
    runCode("assert(-(1 + 1) === -2)");
    runCode("assert(-(0) === 0)");
    runCode(`
        let x = 5;
        assert(-x === -5);
    `);
});

test("unary not", () => {
    runCode("assert(!false === true)");
    runCode("assert(!!5 === true)");
});
