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

test("unary typeof", () => {
    runCode(`assert(typeof null === "object")`);
    runCode(`assert(typeof 3.14 === "number")`);
    runCode(`assert(typeof true === "boolean")`);
    runCode(`assert(typeof undefined === "undefined")`);
    runCode(`assert(typeof "hello" === "string")`);
    runCode(`assert(typeof [1, 2, 3] === "object")`);
    runCode(`assert(typeof { a: 0 } === "object")`);
    runCode(`assert(typeof (function () {}) === "function")`);
});
