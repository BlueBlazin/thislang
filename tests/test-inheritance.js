test("prototypal inheritance", () => {
    runCode(`
        function Foo() {
            this.a = 42;
            this.b = 10;
        }

        Foo.prototype.foo = function () {
            assert(true);
        }

        function Bar() {
            Foo.bind(this)();
            this.c = 7;
        }

        Bar.prototype = Object.create(Foo.prototype);
        Bar.prototype.constructor = Bar;

        Bar.prototype.bar = function () {
            this.foo();
            assert(this.a === 42);
            assert(this.b === 10);
            assert(this.c === 7);
        }

        let bar = new Bar();
        bar.bar();
    `);
});
