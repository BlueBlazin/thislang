test("throw statement", () => {
    runCode(`try { throw "error"; } catch (e) {}`);
    runCode(`try { throw undefined; } catch (e) {}`);
    runCode(`try { throw 1 + 2 / 3; } catch (e) {}`);
});
