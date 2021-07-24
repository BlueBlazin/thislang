test("while statement", () => {
    runCode(`
        let i = 0;
        while (i < 5) {
            i++;
        }
        assert(i === 5);
    `);

    runCode(`
        let i = 0;
        while (true) {
            i++;
            if (i === 5) {
                break;
            }
        }
        assert(i === 5);
    `);
});
