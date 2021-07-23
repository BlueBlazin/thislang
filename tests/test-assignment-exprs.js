test("assignment", () => {
    runCode(`
        let x = 5;
        assert(x === 5);
    `);
    runCode(`
        let x = [1, 2, 3];
        x[1] = 42;
        assert(x[1] === 42);
    `);
    runCode(`
        let x = { a: 0, b: 1 };
        x.b = 42;
        assert(x.a === 0);
        assert(x.b === 42);
    `);
});

test("assignment operators", () => {
    runCode(`
        let x = 5;
        x += 5;
        assert(x === 10);
    `);
    runCode(`
        let x = 5;
        x -= 5;
        assert(x === 0);
    `);
    runCode(`
        let x = 5;
        x *= 2;
        assert(x === 10);
    `);
    runCode(`
        let x = 5;
        x /= 5;
        assert(x === 1);
    `);
    runCode(`
        let x = 5;
        x %= 3;
        assert(x === 2);
    `);
});
