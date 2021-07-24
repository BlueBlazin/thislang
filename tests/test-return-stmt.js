test("return statement", () => {
    runCode(`
        function foo() {
            return 42;
        }

        assert(foo() === 42);
    `);

    runCode(`
        function foo(x) {
            return x;
        }

        assert(foo(42) === 42);
    `);

    runCode(`
        function bar(x) {
            return x;
        }

        function foo(x) {
            if (false) {
                return 0;
            }
            return bar(x);
        }

        assert(foo(42) === 42);
    `);
});
