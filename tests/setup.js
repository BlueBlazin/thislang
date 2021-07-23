const passedCount = document.getElementById("passed-count");
const failedCount = document.getElementById("failed-count");
const totalCount = document.getElementById("total-count");

function withAssert(source) {
    return `
        function assert(expr) {
            if (expr !== true) {
                throw "Assertion failure: " + expr + " !== true";
            }
        }

        ${source}
    `;
}

function runCode(source) {
    let parser = new Parser(withAssert(source));
    let ast = parser.parse();

    let runtime = new Runtime();

    let compiler = new Compiler(runtime);
    let fun = compiler.compile(ast);

    let vm = new Vm(fun, runtime);
    vm.run();
}

function newSuccessNode(name) {
    const div = document.createElement("div");
    div.setAttribute("class", "success-container");
    div.innerText = `Passed: ${name}`;
    return div;
}

function newFailureNode(name) {
    const div = document.createElement("div");
    div.setAttribute("class", "failure-container");
    div.innerText = `Failed: ${name}`;
    return div;
}

function test(name, testFunction) {
    const container = document.getElementById("tests-container");

    try {
        testFunction();
        container.append(newSuccessNode(name));
        passedCount.innerText = parseInt(passedCount.innerText) + 1;
    } catch (e) {
        container.append(newFailureNode(name));
        failedCount.innerText = parseInt(failedCount.innerText) + 1;
    }

    totalCount.innerText = parseInt(totalCount.innerText) + 1;
}
