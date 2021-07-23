test("simple static and computed member exprs", () => {
    runCode(`
        let x = [1, 2, 3];
        assert(x.length === 3);
        assert(x[0] === 1);
        assert(x[5] === undefined);
    `);

    runCode(`
        let x = { a: 42 };
        assert(x.a === 42);
        assert(x["a"] === 42);
        assert(x.b === undefined);
        assert(x["b"] === undefined);
    `);
});

test("chained member exprs", () => {
    runCode(`
        let x = [1, { a: 42 }];
        assert(x[1].a === 42);
    `);

    runCode(`
        let x = { a: [0, 1, 2] };
        assert(x.a[2] === 2);
        assert(x["a"][2] === 2);
    `);

    runCode(`
        let x = { a: [0, 1, { a: 42 }] };
        assert(x.a[2].a === 42);
        assert(x["a"][2].a === 42);
        assert(x["a"][2]["a"] === 42);
    `);
});

test("complex chained member expr", () => {
    runCode(`
        let x = [1, { a: [0, function () { return "b" }] }];
        let y = { x: [0, [1, 2, { b: 42 }]] }
        assert(y.x[1][2][x[1].a[1]()]);
    `);
});
