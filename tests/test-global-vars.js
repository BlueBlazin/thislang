test("simple global variable access", () => {
    runCode(`
        let x = 42;
        function foo() {
            x + 1;
        }
        foo();
    `);
});

test("global object access", () => {
    runCode(`
        let x = { a: 0 };
        function foo() {
            return x;
        }
        let y = foo();
        y.a = 42;
        assert(x.a === 42);
    `);
});

test("nested global variable access", () => {
    runCode(`
        let x = 42;
        function foo() {
            function bar() {
                assert(x === 42);
                let y = x - 1;
                return y;
            }

            assert(bar() === 41);
            return bar() - 1;
        }
        assert(foo() === 40);
        assert(x === 42);
    `);

    runCode(`
        let x = 42;
        
        function bar() {
            assert(x === 42);
            let y = x - 1;
            return y;
        }

        function foo() {
            assert(bar() === 41);
            return bar() - 1;
        }
        assert(foo() === 40);
        assert(x === 42);
    `);
});
