test("switch match before let declaration", () => {
    runCode(`
        switch ("foo") {
            case "foo": break;
        }

        let x = 0;
        assert(x === 0);
    `);

    runCode(`
        switch ("foo") {
            case "foo":
            case "bar": break;
            case "baz": break;
        }

        let x = 0;
        assert(x === 0);
    `);

    runCode(`
        switch ("foo") {
            case "bar": break;
        }

        let x = 0;
        assert(x === 0);
    `);

    runCode(`
        switch ("foo") {}

        let x = 0;
        assert(x === 0);
    `);

    runCode(`
        switch ("foo") {
            default: break;
        }

        let x = 0;
        assert(x === 0);
    `);
});

test("spread arg in calls made from functions", () => {
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

test("array.map on function that calls native function", () => {
    runCode(`
        function foo(x) {
            return String(x);
        }

        let x = [7, 8].map(foo);
        assert(x[0] === "7");
        assert(x[0] === "7");
    `);
});
