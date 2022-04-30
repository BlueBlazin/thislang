test("simple closure", () => {
    runCode(`
        function counterFactory() {
            let x = 0;

            return function () {
                return x++;
            };
        }

        let counter = counterFactory();
        assert(counter() === 0);
        assert(counter() === 1);
        assert(counter() === 2);
        assert(counter() === 3);
    `);
});
