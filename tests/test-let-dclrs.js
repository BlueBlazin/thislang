test("let declaration", () => {
    runCode(`
        let x = 5;
        assert(x === 5);
    `);

    runCode(`
        let x = 5;
        let y = 5;
        let z = x + y;
        assert(z === 10);
    `);
});

test("nested functions", () => {
    runCode(`
        function foo() {
            let x = 0;
        
            function bar() {
                return x + 1;
            }
            return bar();
        }
        assert(foo() === 1);
    `);
});
