test("continue statement", () => {
    runCode(`
        let x = 0;
        for (let i = 0; i <= 5; i++) {
            if (i > 3) continue;
            x = i;
        }
        assert(x === 3);
    `);

    runCode(`
        let x = 0;
        let i = 0;
        while (i <= 5) {
            i++;
            if (i > 3) continue;
            x = i;
        }
        assert(x === 3);
    `);
});

test("continue statement in nested for", () => {
    runCode(`
        let x = 0;
        let y = 0;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (j > 3) continue;
                x = j;
                y = i;
            }
        }
        assert(x === 3);
        assert(y === 4);
    `);
});
