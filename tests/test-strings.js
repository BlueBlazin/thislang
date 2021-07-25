test("string includes", () => {
    runCode(`
        let string = "123456";
        assert(string.includes("2"));
        assert(string.includes("3"));
        assert(string.includes("4"));
        assert(!string.includes("0"));
    `);

    runCode(`
        let string = "123456";
        assert(string.includes("1"));
        assert(!string.includes("1", 3));
        assert(string.includes("5", 3));
        assert(string.includes("456", 3));
    `);
});

test("string padStart", () => {
    runCode(`
        let string = "123";
        assert(string.padStart(5) === "  123");
        assert(string.padStart(6, "0") === "000123");
        assert(string.padStart(2) === "123");
    `);
});

test("string concatenation", () => {
    runCode(`
        let x = "Hello";
        let y = "world";
        assert(x + ", " + y + "!" === "Hello, world!");
    `);
});
