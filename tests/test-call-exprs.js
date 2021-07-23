test("function declaration calls", () => {
    runCode(`
        function foo() {
            return 42;
        }
        assert(foo() === 42);
    `);

    runCode(`
        function foo() {
        }
        assert(foo() === undefined);
    `);
});

test("function declaration call with args", () => {
    runCode(`
        function foo(x) {
            return x;
        }
        assert(foo(44 - 2 * 2 + 18 / 9) === 42);
    `);
});

test("function expression calls", () => {
    runCode(`
        assert((function () {
            return 42;
        })() === 42);
    `);

    runCode(`
        let x = function foo() { return 2; }
        assert(x() === 2);
    `);
});

test("function expression call with args", () => {
    runCode(`
        assert((function (x, y) {
            let dummy = 5;
            let dummy2 = 39;
            return x + y;
        })(38, 4) === 42);
    `);
});

test("method calls", () => {
    runCode(`
        let x = { foo: function bar() { return 42; } };
        assert(x.foo() === 42);
    `);
    runCode(`
        let x = { foo: function bar() { return 42; } };
        assert(x["foo"]() === 42);
    `);
});

test("method call with args", () => {
    runCode(`
        let x = { foo: function bar(w, x, y, z) { return z; } };
        assert(x.foo(1, 0, -1, 42) === 42);
    `);
});

test("calls with missing args", () => {
    runCode(`
        function foo(x, y, z) {
            assert(y === undefined);
            assert(z === undefined);
        }

        foo(0);
    `);
});
