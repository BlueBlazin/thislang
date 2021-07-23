test("immediate function expressions", () => {
    runCode(`(function () {});`);
    runCode(`(function foo() {});`);
    runCode(`
        (function foo() {
            return 0;
        });
    `);
});

test("function expressions assignment", () => {
    runCode(`let x = function () {};`);
    runCode(`let x = function bar() {};`);
});

test("returning function expressions", () => {
    runCode(`
        function foo() {
            return function() {};
        }

        foo();
    `);
    runCode(`
        function foo() {
            return function bar() {};
        }

        foo();
    `);
});

test("passing function expressions as arg", () => {
    runCode(`
        function foo(fn) {
            fn();
        }

        foo(function () {});
    `);
    runCode(`
        function foo(fn1, fn2) {
            fn1();
            fn2();
        }

        foo(function () { return 0; }, function bar() {});
    `);
});
