test("Object.create", () => {
    runCode(`
        let x = { a: 42 };
        let y = Object.create(x);
        assert(Object.getPrototypeOf(y) === x);
        assert(y.a === 42);
    `);

    runCode(`
        let x = Object.create(null);
        assert(Object.getPrototypeOf(x) === null);
    `);
});

test("Object.assign", () => {
    runCode(`
        let source = { b: 10, c: 7 };
        let x = Object.assign({ a: 42 }, source);
        assert(x.a === 42);
        assert(x.b === 10);
        assert(x.c === 7);
    `);
});

test("Object.keys", () => {
    runCode(`
        let x = { a: 0, b: 1, c: 2 };
        let keys = Object.keys(x);
        assert(keys[0] === "a");
        assert(keys[1] === "b");
        assert(keys[2] === "c");
    `);
});
