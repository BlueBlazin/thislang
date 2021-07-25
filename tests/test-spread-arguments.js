test("spread arg to array.push", () => {
    runCode(`
        let x = [];
        let y = [1, 2, 3];
        x.push(...y);
        assert(x.length === 3);
        assert(x[0] === 1);
        assert(x[1] === 2);
        assert(x[2] === 3);
    `);
});

test("spread arg in function call", () => {
    runCode(`
        function foo(a, b, c) {
            assert(a === 5);
            assert(b === 6);
            assert(c === 7);
        }

        foo(...[5, 6, 7]);
    `);
});

test("spread arg in method call", () => {
    runCode(`
        let x = {};

        x.foo = function (a, b, c) {
            assert(a === 5);
            assert(b === 6);
            assert(c === 7);
        };

        x.foo(...[5, 6, 7]);
    `);
});

test("spread arg in special arguments array", () => {
    runCode(`
        let arr = [5, 6, 7];

        function foo() {
            assert(arguments[0] === arr[0]);
            assert(arguments[1] === arr[1]);
            assert(arguments[2] === arr[2]);
        };

        foo(...arr);
    `);
});

test("spread arg in calls from functions", () => {
    runCode(`
        function foo(x, y, z) {
            assert(x === 0);
            assert(y === 1);
            assert(z === 2);
        }

        function bar() {
            foo(...[0, 1, 2]);
            foo(...[0, 1, 2]);
            foo(...[0, 1, 2]);
        }

        bar();
        bar();
    `);
});
