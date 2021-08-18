test("array push", () => {
    runCode(`
        let x = [];
        x.push(0);
        x.push(1);
        x.push(2);
        assert(x[0] === 0);
        assert(x[1] === 1);
        assert(x[2] === 2);
    `);
});

test("array push multiple args", () => {
    runCode(`
        let x = [];
        x.push(0, 1, 2);
        assert(x[0] === 0);
        assert(x[1] === 1);
        assert(x[2] === 2);
    `);
});

test("array push zero args", () => {
    runCode(`
        let x = [];
        x.push();
        x.push();
        x.push();
        assert(x.length === 0);
    `);
});

test("array push return value", () => {
    runCode(`
        let x = [];
        assert(x.push(5) === 1);
        assert(x.push(6) === 2);
        assert(x.push(7) === 3);
    `);
});

test("array pop", () => {
    runCode(`
        let x = [5, 6, 7];
        assert(x.pop() === 7);
        assert(x.pop() === 6);
        assert(x.pop() === 5);
    `);
});

test("array shift", () => {
    runCode(`
        let x = [5, 6, 7];
        assert(x.shift() === 5);
        assert(x.shift() === 6);
        assert(x.shift() === 7);
    `);
});

test("array unshift", () => {
    runCode(`
        let x = [5, 6, 7];
        assert(x.unshift(4) === 4);
        assert(x.unshift(3) === 5);
        assert(x.unshift(2, 1, 0) === 8);
    `);

    runCode(`
        let x = [5];
        x.unshift(4);
        assert(x[0] === 4);
        assert(x[1] === 5);
        x.unshift(3);
        assert(x[0] === 3);
        assert(x[1] === 4);
        assert(x[2] === 5);
        x.unshift();
        assert(x.length === 3);
    `);
});

test("array length", () => {
    runCode(`
        let x = [5, 6, 7];
        assert(x.length === 3);
        x.push(8);
        assert(x.length === 4);
        let y = [];
        assert(y.length === 0);
        y.push(1);
        assert(y.length === 1);
        y.unshift(0);
        assert(y.length === 2);
        y.shift();
        assert(y.length === 1);
    `);
});

test("array join", () => {
    runCode(`
        let x = [5, 6, 7];
        assert(x.join("|") === "5|6|7");
        assert(x.join(", ") === "5, 6, 7");
        assert(x.join() === "5,6,7");
    `);
});

test("array at", () => {
    runCode(`
        let x = [5, 6, 7];
        assert(x.at(0) === 5);
        assert(x.at(1) === 6);
        assert(x.at(2) === 7);
        assert(x.at(3) === undefined);
        assert(x.at(-1) === 7);
        assert(x.at(-2) === 6);
        assert(x.at(-3) === 5);
        assert(x.at(-4) === undefined);
    `);
});
