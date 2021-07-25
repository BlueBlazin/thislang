test("this on function calls", () => {
    runCode(`
        function foo() {
            assert(this === undefined);
        }

        foo();
    `);

    runCode(`
        let foo = function () {
            assert(this === undefined);
        };

        foo();
    `);

    runCode(`
        let x = { 
            a: 0,
            b: function () {
                assert(this === undefined);
            } 
        };

        let foo = x.b;
        foo();
    `);
});

test("this on method calls", () => {
    runCode(`
        let x = {};
        x.foo = function foo() {
            assert(this === x);
        };

        x.foo();
    `);

    runCode(`
        let x = {};

        function foo() {
            assert(this === x);
        }

        x.foo = foo;
        x.foo();
    `);
});

test("this on bound calls", () => {
    runCode(`
        let x = { a: 0 };

        function foo(a, b) {
            assert(this === x);
        }

        let bar = foo.bind(x, x.a);
        bar(42);
    `);

    runCode(`
        let x = { a: 0 };
        let y = { b: 1 };
        y.foo = function () {
            assert(this === x);
        }

        y.foo.bind(x)();
    `);
});
