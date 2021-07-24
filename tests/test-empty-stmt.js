test("empty statement", () => {
    runCode(`;`);
    runCode(`;;;;;`);
    runCode(`let x = 0;;;;`);
    runCode(`
        ;;;;
        let y = 10;
        ;
        ;;;;;;
        ;
        ;;
        ;
    `);
});
