(function () {
    let tokenizeBtn = document.getElementById("tokenize-btn");
    let parseBtn = document.getElementById("parse-btn");
    let compileBtn = document.getElementById("compile-btn");
    let runBtn = document.getElementById("run-btn");

    tokenizeBtn.onclick = function () {
        let source = ace.edit("editor").getValue();
        let tokenizer = new Tokenizer(source);

        let token;
        while (true) {
            token = tokenizer.next();
            console.log(token);
            if (token.type === TokenType.EOF) {
                break;
            }
        }
    };

    parseBtn.onclick = function () {
        let source = ace.edit("editor").getValue();
        let parser = new Parser(source);
        let ast = parser.parse();
        console.log(JSON.stringify(ast, null, "  "));
    };

    compileBtn.onclick = function () {
        let source = ace.edit("editor").getValue();

        let parser = new Parser(source);
        let ast = parser.parse();

        let runtime = new Runtime();

        let compiler = new Compiler(runtime);
        let fun = compiler.compile(ast);

        dis(fun.code, fun.constants, "<script>");
    };

    runBtn.onclick = function () {
        let source = ace.edit("editor").getValue();

        let parser = new Parser(source);
        let ast = parser.parse();

        let runtime = new Runtime();

        let compiler = new Compiler(runtime);
        let fun = compiler.compile(ast);

        let vm = new Vm(fun, runtime);
        vm.run();
    };
})();
