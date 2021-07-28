test("Object.prototype", () => {
    runCode(`
        assert(Object.prototype === Object.getPrototypeOf({ a: 0 }));
    `);
});

test("Array.prototype", () => {
    runCode(`
        assert(Array.prototype === Object.getPrototypeOf([1, 2, true, "3"]));
    `);
});

test("Boolean.prototype", () => {
    runCode(`
        assert(Boolean.prototype === Object.getPrototypeOf(true));
        assert(Boolean.prototype === Object.getPrototypeOf(false));
    `);
});

test("Number.prototype", () => {
    runCode(`
        assert(Number.prototype === Object.getPrototypeOf(3.14));
        assert(Number.prototype === Object.getPrototypeOf(500));
    `);
});

test("String.prototype", () => {
    runCode(`
        assert(String.prototype === Object.getPrototypeOf("hello"));
    `);
});
