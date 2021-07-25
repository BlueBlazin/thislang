test("constructors", () => {
    runCode(`
        function Foo() {
            this.x = 0;
            this.y = 1;
        }

        let foo = new Foo();
        assert(foo.x === 0);
        assert(foo.y === 1);
    `);

    runCode(`
        function Foo(x, y) {
            this.x = x;
            this.y = y;
        }

        let foo = new Foo(42, 7);
        assert(foo.x === 42);
        assert(foo.y === 7);
    `);
});

test("constructors with return values", () => {
    runCode(`
        function Foo() {
            return 42;
        }

        assert(Foo() === 42);
        assert(new Foo() !== 42);
    `);
});
