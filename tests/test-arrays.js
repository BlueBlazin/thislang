test("array push", () => {
    runCode(`
        let x = [];
        x.push(0);
        x.push(1);
        x.push(2);
        assert(x[0] === 0);
        assert(x[1] === 1);
        assert(x[2] === 2);
    `);
});

test("array push return value", () => {
    runCode(`
        let x = [];
        assert(x.push(0) === 0);
        assert(x.push(1) === 1);
        assert(x.push(2) === 2);
    `);
});

test("array pop", () => {
    runCode(`
        let x = [5, 6, 7];
        assert(x.pop() === 7);
        assert(x.pop() === 6);
        assert(x.pop() === 5);
    `);
});
