test("single if statement", () => {
    runCode(`
        let x = 0;
        if (true) {
            x = 42;
        }
        assert(x === 42);
    `);
});

test("if-else statement", () => {
    runCode(`
        if (true) {
            assert(true);
        } else {
            assert(false);
        }
    `);

    runCode(`
        if (false) {
            assert(false);
        } else {
            assert(true);
        }
    `);
});

test("if-else-if statements", () => {
    runCode(`
        if (false) {
            assert(false);
        } else if (false) {
            assert(false);
        } else if (false) {
            assert(false);
        } else {
            assert(true);
        }
    `);

    runCode(`
        if (false) {
            assert(false);
        } else if (true) {
            assert(true);
        } else if (false) {
            assert(false);
        } else {
            assert(false);
        }
    `);

    runCode(`
        let x = 0;
        if (false) {
            assert(false);
        } else if (false) {
            assert(true);
        } else if (true) {
            x = 42;
        }
        assert(x === 42);
    `);

    runCode(`
        let x = 0;
        if (false) {
            assert(false);
        } else if (true) {
            if (false) {
                assert(false);
            } else {
                assert(true)
                x = 42;
            }
        } else {
            assert(false);
        }
        assert(x === 42);
    `);
});
