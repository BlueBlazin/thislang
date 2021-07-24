test("function declaration", () => {
    runCode(`
        function foo() {
            return 0;
        }

        assert(foo() === 0);
    `);
});

test("nested function declaration", () => {
    runCode(`
        function foo() {
            function bar() {
                return 42;
            }
            return bar();
        }

        assert(foo() === 42);
    `);
});
