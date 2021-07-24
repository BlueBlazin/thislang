test("break statement in while", () => {
    runCode(`
        let i = 0;
        while (i < 5) {
            if (i === 3) {
                break;
            }
            i++;
        }
        assert(i === 3);
    `);
});

test("break statement in for", () => {
    runCode(`
        let x = 0;
        for (let i = 0; i <= 10; i += 2) {
            if (i > 3) break;
            x = i;
        }
        assert(x === 2);
    `);
});

test("break statement in switch", () => {
    runCode(`
        switch (42) {
            case 0:
                assert(false);
                break;
            case 20:
            case 40:
            case 42:
                assert(true);
                break;
            case 43:
                assert(false);
                break;
        }
    `);

    runCode(`
        switch (42) {
            case 0:
                assert(false);
                break;
            case 41:
            case 42:
            case 43:
                assert(true);
                break;
            case 44:
                assert(false);
                break;
            default:
                assert(false);
        }
    `);
});
