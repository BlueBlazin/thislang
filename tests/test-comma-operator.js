test("comma operator", () => {
    runCode(`assert((0) === 0)`);
    runCode(`assert((0, 1) === 1)`);
    runCode(`assert((0, 1, 2, 3, 4, 5) === 5)`);
});
