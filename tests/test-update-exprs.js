test("postfix increment", () => {
    runCode(`
        let x = 0;
        assert(x++ === 0);
        assert(x++ === 1);
        assert(x++ === 2);
        assert(x === 3);
    `);
    runCode(`
        let x = { a: [{ b: { c: 0 } }] };
        assert(x.a[0]["b"].c++ === 0);
        assert(x.a[0]["b"].c++ === 1);
        assert(x.a[0]["b"].c++ === 2);
        assert(x.a[0]["b"].c === 3);
    `);
});

test("postfix decrement", () => {
    runCode(`
        let x = 0;
        assert(x-- === 0);
        assert(x-- === -1);
        assert(x-- === -2);
        assert(x === -3);
    `);
    runCode(`
        let x = { a: [{ b: { c: 0 } }] };
        assert(x.a[0]["b"].c-- === 0);
        assert(x.a[0]["b"].c-- === -1);
        assert(x.a[0]["b"].c-- === -2);
        assert(x.a[0]["b"].c === -3);
    `);
});

test("prefix increment", () => {
    runCode(`
        let x = 0;
        assert(++x === 1);
        assert(++x === 2);
        assert(++x === 3);
        assert(x === 3);
    `);
    runCode(`
        let x = { a: [{ b: { c: 0 } }] };
        assert(++x.a[0]["b"].c === 1);
        assert(++x.a[0]["b"].c === 2);
        assert(++x.a[0]["b"].c === 3);
        assert(x.a[0]["b"].c === 3);
    `);
});

test("prefix decrement", () => {
    runCode(`
        let x = 0;
        assert(--x === -1);
        assert(--x === -2);
        assert(--x === -3);
        assert(x === -3);
    `);
    runCode(`
        let x = { a: [{ b: { c: 0 } }] };
        assert(--x.a[0]["b"].c === -1);
        assert(--x.a[0]["b"].c === -2);
        assert(--x.a[0]["b"].c === -3);
        assert(x.a[0]["b"].c === -3);
    `);
});
