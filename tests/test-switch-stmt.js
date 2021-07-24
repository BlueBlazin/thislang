test("simple switch statement", () => {
    runCode(`
        switch ("hello") {
            case "apple":
                assert(false);
                break;
            case "hello":
                assert(true);
                break;
            case "world":
                assert(false);
                break;
            default:
                assert(false);
        }
    `);
});

test("complex switch statement", () => {
    runCode(`
        switch ("apple") {
            case "apple":
            case "hello":
                assert(true);
                break;
            case "world":
                assert(false);
                break;
        }
    `);
});

test("switch statement with default in the middle", () => {
    runCode(`
        switch ("world") {
            case "apple":
            case "hello":
                assert(false);
                break;
            default:
                assert(false);
                break;
            case "world":
                assert(true);
                break;
        }
    `);
});
