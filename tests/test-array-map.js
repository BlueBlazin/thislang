test("array map", () => {
    runCode(`
        let arr = [1, 2, 3];
        arr = arr.map(function (x) { return x + 5; });
        assert(arr[0] === 6);
        assert(arr[1] === 7);
        assert(arr[2] === 8);
    `);
});

test("array map complex callback", () => {
    runCode(`
        let arr = [1, 2, 3];

        let x = 5;
        function bar() {
            return x;
        }

        function mapFn(x) {
            function baz() {
                return bar() + 1;
            }

            return x + baz();
        }

        arr = arr.map(mapFn);
        assert(arr[0] === 7);
        assert(arr[1] === 8);
        assert(arr[2] === 9);
    `);
});

test("array map index argument", () => {
    runCode(`
        let arr = [5, 6, 7];
        arr = arr.map(function (x, i) { return i; });
        assert(arr[0] === 0);
        assert(arr[1] === 1);
        assert(arr[2] === 2);
    `);
});
