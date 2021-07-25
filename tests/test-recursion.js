test("recursion", () => {
    runCode(`
        function foo(n) {
            if (n <= 0) {
                return 0;
            }
            return foo(n - 1);
        }

        assert(foo(5) === 0);
        assert(foo(15) === 0);
        assert(foo(50) === 0);
    `);
});

test("mutual recursion", () => {
    runCode(`
        {
            function foo(n) {
                if (n <= 0) return 0;
    
                if (n % 2 === 0) return bar(n - 1);
                else return foo(n - 1);
            }
    
            function bar(n) {
                if (n <= 0) return 0;
                if (n % 2 === 1) return foo(n - 1);
                else return bar(n - 1);
            }
    
            assert(foo(5) === 0);
            assert(foo(6) === 0);
            assert(bar(5) === 0);
            assert(bar(6) === 0);
        }
    `);
});
