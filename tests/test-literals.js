test("numbers", () => {
    runCode("3");
    runCode("3.");
    runCode("3.14");
    runCode("0.14");
    runCode(
        "2492342304092397593523053205932750237532795723057320579273572039927590970523"
    );
});

test("null", () => {
    runCode("null");
});

test("undefined", () => {
    runCode("undefined");
});

test("booleans", () => {
    runCode("true");
    runCode("false");
});

test("string literals", () => {
    runCode("'hello'");
    runCode('"world"');
});

test("object literals", () => {
    runCode("({})");
    runCode("({ a: 0 })");
    runCode("({ a: 0, b: null, c: undefined, d: [42], e: { x: 0 } })");
    runCode("({ a: function (x) { return this.a + x; } })");
});

test("array literals", () => {
    runCode("[]");
    runCode("[0, null, undefined, 3.14, { a: 0 }, [1, 2, 3]]");
    runCode(`
        let arr = [0, 1, 2, 3, function () { return 42; }];
        assert(arr[0] === 0);
        assert(arr[1] === 1);
        assert(arr[4]() === 42);
    `);
    runCode("assert([[1, 2], [3, 4]][0][0] === 1)");
});
