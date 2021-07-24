test("array filter", () => {
    runCode(`
        let arr = [1, 2, 3, 4, 5];
        arr = arr.filter(function (x) { return x < 4; });
        assert(arr[0] === 1);
        assert(arr[1] === 2);
        assert(arr[2] === 3);
    `);
});

test("array filter complex callback", () => {
    runCode(`
        let arr = [1, 2, 3, 4, 5, 6];
        let m = 1;

        function foo(x) {
            let n = 1 + m;
            function bar(x) {
                return x % n === 0;
            }

            return bar(x);
        }

        function filterFn(x) {
            return foo(x);
        }

        arr = arr.filter(filterFn);
        assert(arr[0] === 2);
        assert(arr[1] === 4);
        assert(arr[2] === 6);
    `);
});

test("array filter index argument", () => {
    runCode(`
        let arr = [10, 11, 12, 13, 14];
        arr = arr.filter(function (x, i) { return i < 4; });
        assert(arr[0] === 10);
        assert(arr[1] === 11);
        assert(arr[2] === 12);
    `);
});
