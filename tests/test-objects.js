test("object hasOwnProperty", () => {
    runCode(`
        let x = { a: 0 };
        assert(x.hasOwnProperty("a"));
        assert(!x.hasOwnProperty("b"));
    `);

    runCode(`
        let x = { a: 0 };
        let y = Object.create(x);
        y.b = 42;
        assert(!x.hasOwnProperty("a"));
        assert(x.hasOwnProperty("b"));
    `);
});
