test("conditional operator", () => {
    runCode(`assert((true ? 10 : 7) === 10)`);
    runCode(`assert((false ? 10 : 7) === 7)`);
});
