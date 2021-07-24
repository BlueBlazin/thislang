test("array slice", () => {
    runCode(`
        let x = [1, 2, 3];
        let y = x.slice();
        assert(y[0] === 1);
        assert(y[1] === 2);
        assert(y[2] === 3);
    `);
});

test("array slice copying", () => {
    runCode(`
        let x = [1, 2, 3];
        let y = x.slice();
        y[0] = 5;
        y[1] = 6;
        y[2] = 7;
        assert(x[0] === 1);
        assert(x[1] === 2);
        assert(x[2] === 3);
    `);
});

test("array slice partial slice", () => {
    runCode(`
        let x = [1, 2, 3, 4, 5];
        let y = x.slice(2);
        assert(y[0] === 3);
        assert(y[1] === 4);
        assert(y[2] === 5);
    `);

    runCode(`
        let x = [1, 2, 3, 4, 5];
        let y = x.slice(1, 3);
        assert(y[0] === 2);
        assert(y[1] === 3);
    `);
});
