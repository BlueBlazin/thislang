test("for statement", () => {
    runCode(`
        let x = 0;
        for (let i = 0; i < 5; i++) {
            x = i;
        }
        assert(x === 4);
    `);

    runCode(`
        for (let i = 0; i <= 10; i += 2) {
            assert(i % 2 === 0);
        }
    `);
});
