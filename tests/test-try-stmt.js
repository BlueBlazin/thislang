test("try-catch", () => {
    runCode(`
        try {
            assert(true);
        } catch (e) {
            assert(false);
        }
    `);

    runCode(`
        try {
            throw "error";
            assert(false);
        } catch (e) {
            assert(true);
        }
    `);
});

test("catch error value", () => {
    runCode(`
        function foo() {
            throw 42;
        }

        try {
            foo();
            assert(false);
        } catch (e) {
            assert(e === 42);
        }

        let x = false;
        let y = true;
        let z = false;
        assert(y);
    `);

    runCode(`
        function baz() {
            function ham() {
                throw 42;
            }

            ham();
        }

        function spam() {
            return 42;
        }

        function bar() {
            baz();
        }

        function foo() {
            bar();
            throw 10;
        }

        try {
            foo();
            assert(false);
        } catch (e) {
            assert(e === 42);
        }

        spam();
        assert(true);
    `);
});
