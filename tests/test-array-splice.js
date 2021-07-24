test("array splice", () => {
    runCode(`
        let x = [1, 2, 3, 4, 5];
        x.splice(0);
        assert(x.length === 0);
    `);

    runCode(`
        let x = [1, 2, 3, 4, 5];
        x.splice(2);
        assert(x[0] === 1);
        assert(x[1] === 2);
    `);
});
