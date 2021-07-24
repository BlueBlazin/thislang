test("block statements", () => {
    runCode(`{}`);
    runCode(`
        {
            let x = 0;
            let y = 0;
        }
    `);
    runCode(`
        {
            let x = 0;
            let y = 0;
            {
                assert(x === 0);
                let z = 42;
                assert(z === 42);
            }
        }
    `);
});

test("block variable shadowing", () => {
    runCode(`
        {
            let x = 0;
            let y = 1;
            let z = 2;
            {
                assert(y === 1);
                let y = 42;
                assert(y === 42);
            }

            assert(y === 1);
        }
    `);
});
