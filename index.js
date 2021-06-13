//==================================================
// Constants
//==================================================

// flag for debug logging
let DEBUG = true;

let STACK_MAX = 1024;

//==================================================
//  Bytecode
//==================================================

let Opcodes = {
    POP: 0x00,
    LOG: 0x01,
};

//==================================================
// Helpers
//==================================================

/** Returns an array of specified size filled with specified value */
let initArray = function (size, fillValue) {
    let arr = [];

    for (let i = 0; i < size; i++) {
        arr.push(fillValue);
    }

    return arr;
};

let dbg = function () {
    if (DEBUG) {
        console.log(...arguments);
    }
};

//==================================================
// Tokenizer
//==================================================

/** Token type enum */
let TokenType = {
    EOF: "EOF",
    KEYWORD: "KEYWORD",
    IDENTIFIER: "IDENTIFIER",
    PUNCTUATOR: "PUNCTUATOR",
    STRING: "STRING",
    NUMBER: "NUMBER",
    BOOLEAN: "BOOLEAN",
    NULL: "NULL",
};

function Tokenizer(source) {
    this.i = 0;
    this.line = 0;
    this.source = source;
    this.queue = [];
}

/** Returns the next token, either from the queue if buffered or on the fly. */
Tokenizer.prototype.next = function () {
    if (this.queue.length > 0) {
        return this.queue.shift();
    }

    return this.nextToken() || this.token(TokenType.EOF, null);
};

/** Gets the next token on the fly. */
Tokenizer.prototype.nextToken = function () {
    this.scanWhitespace();

    if (this.i >= this.source.length) {
        return null;
    }

    let c = this.source[this.i];

    if (this.isIdentifierStart(c)) {
        return this.scanIdentifier();
    } else if (this.isNumber(c)) {
        return this.scanNumber();
    } else if (c === '"' || c === "'") {
        return this.scanString();
    } else {
        return this.scanPunctuator();
    }
};

Tokenizer.prototype.scanPunctuator = function () {
    let c = this.consume();

    switch (c) {
        case "{":
        case "}":
        case "(":
        case ")":
        case "[":
        case "]":
        case ";":
        case ",":
        case ":":
        case "~":
            return this.token(TokenType.PUNCTUATOR, c);
        case "+":
            if (this.matches("+")) {
                return this.token(TokenType.PUNCTUATOR, "++");
            } else if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "+=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "+");
            }
        case "-":
            if (this.matches("-")) {
                return this.token(TokenType.PUNCTUATOR, "--");
            } else if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "-=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "-");
            }
        case "&":
            if (this.matches("&")) {
                return this.token(TokenType.PUNCTUATOR, "&&");
            } else if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "&=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "&");
            }
        case "|":
            if (this.matches("|")) {
                return this.token(TokenType.PUNCTUATOR, "||");
            } else if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "|=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "|");
            }
        case "<":
            if (this.matches("<")) {
                return this.token(TokenType.PUNCTUATOR, "<<");
            } else if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "<=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "<");
            }
        case ">":
            if (this.matches(">")) {
                return this.token(TokenType.PUNCTUATOR, ">>");
            } else if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, ">=");
            } else {
                return this.token(TokenType.PUNCTUATOR, ">");
            }
        case "%":
            if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "%=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "%");
            }
        case "^":
            if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "^=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "^");
            }
        case "*":
            if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "*=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "*");
            }
        case "/":
            if (this.matches("=")) {
                return this.token(TokenType.PUNCTUATOR, "/=");
            } else {
                return this.token(TokenType.PUNCTUATOR, "/");
            }
        case ".":
            if (
                this.i + 1 < this.source.length &&
                this.source[this.i + 1] === "." &&
                this.i + 2 < this.source.length &&
                this.source[this.i + 2] === "."
            ) {
                // consume the two `.`s
                this.consume();
                this.consume();
                return this.token(TokenType.PUNCTUATOR, "...");
            } else {
                return this.token(TokenType.PUNCTUATOR, ".");
            }
        case "!":
            if (this.matches("=")) {
                if (this.matches("=")) {
                    return this.token(TokenType.PUNCTUATOR, "!==");
                } else {
                    return this.token(TokenType.PUNCTUATOR, "!=");
                }
            } else {
                return this.token(TokenType.PUNCTUATOR, "!");
            }
        case "=":
            if (this.matches("=")) {
                if (this.matches("=")) {
                    return this.token(TokenType.PUNCTUATOR, "===");
                } else {
                    return this.token(TokenType.PUNCTUATOR, "==");
                }
            } else {
                return this.token(TokenType.PUNCTUATOR, "=");
            }
    }
};

Tokenizer.prototype.scanString = function () {
    // record the type of quote used to start the string
    let q = this.consume();

    let res = this.scanUntil(function (c) {
        return c === q;
    });

    // consume the end quote
    this.consume();

    return this.token(TokenType.STRING, res);
};

Tokenizer.prototype.scanNumber = function () {
    let res = this.scanWhile(this.isNumber.bind(this));

    if (this.matches(".")) {
        res += ".";
        res += this.scanWhile(this.isNumber.bind(this));
    }

    return this.token(TokenType.NUMBER, Number(res));
};

Tokenizer.prototype.scanIdentifier = function () {
    let ident = this.consume();

    ident += this.scanWhile(this.isIdentifierContinue.bind(this));

    if (this.isKeyword(ident)) {
        return this.token(TokenType.KEYWORD, ident);
    } else if (ident === "true" || ident === "false") {
        return this.token(TokenType.BOOLEAN, ident === "true");
    } else if (ident === "null") {
        return this.token(TokenType.NULL, null);
    } else {
        return this.token(TokenType.IDENTIFIER, ident);
    }
};

/** Scan whitespace, single, and multi-line comments. Comments are ignored. */
Tokenizer.prototype.scanWhitespace = function () {
    while (this.i < this.source.length) {
        switch (this.source[this.i]) {
            case " ":
            case "\t":
            case "\r":
            case "\n":
                this.consume();
                break;
            case "/":
                if (this.i + 1 < this.source.length) {
                    // single and multi-line comments
                    if (this.source[this.i + 1] === "/") {
                        this.scanSinglelineComments();
                        break;
                    } else if (this.source[this.i + 1] === "*") {
                        this.scanMultilineComments();
                        break;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            default:
                return;
        }
    }
};

Tokenizer.prototype.isKeyword = function (ident) {
    switch (ident) {
        case "if":
        case "for":
        case "new":
        case "let":
        case "case":
        case "else":
        case "this":
        case "break":
        case "while":
        case "return":
        case "switch":
        case "typeof":
        case "continue":
        case "function":
            return true;
        default:
            return false;
    }
};

Tokenizer.prototype.isIdentifierStart = function (c) {
    // $ | _ | A..Z | a..z
    return (
        c === "$" ||
        c === "_" ||
        ("a" <= c && c <= "z") ||
        ("A" <= c && c <= "Z")
    );
};

Tokenizer.prototype.isIdentifierContinue = function (c) {
    return this.isIdentifierStart(c) || this.isNumber(c);
};

Tokenizer.prototype.isNumber = function (c) {
    return "0" <= c && c <= "9";
};

Tokenizer.prototype.scanSinglelineComments = function () {
    // consume `//`
    this.i += 2;
    this.scanUntil(function (c) {
        return c === "\n";
    });
};

Tokenizer.prototype.scanMultilineComments = function () {
    // consume `/`, `*`
    this.i += 2;
    this.scanUntil2(
        function (c) {
            return c === "*";
        },
        function (c) {
            return c === "/";
        }
    );
    // consume `*`, `/`
    this.i += 2;
};

/** Peek the next + nth token. peek(0) means peeking the next token. */
Tokenizer.prototype.peek = function (n) {
    // buffer the queue until next + nth token
    while (this.queue.length <= n) {
        this.queue.push(this.nextToken());
    }

    return this.queue[n];
};

Tokenizer.prototype.token = function (type, value) {
    return { type, value, line: this.line };
};

/** Scan and return characters while predicate is true or EOF. */
Tokenizer.prototype.scanWhile = function (predicate) {
    let s = "";

    while (this.i < this.source.length && predicate(this.source[this.i])) {
        s += this.source[this.i++];
    }

    return s;
};

/** Scan and return characters until predicate is true or EOF. */
Tokenizer.prototype.scanUntil = function (predicate) {
    let s = "";

    while (this.i < this.source.length && !predicate(this.source[this.i])) {
        s += this.source[this.i++];
    }

    return s;
};

/** Scan and return characters until both predicate functions return true or EOF. */
Tokenizer.prototype.scanUntil2 = function (pred1, pred2) {
    let s = "";

    while (this.i < this.source.length) {
        s += this.scanUntil(pred1);

        // If next char is EOF or matches `c2`, return.
        if (
            this.i + 1 >= this.source.length ||
            !pred2(this.source[this.i + 1])
        ) {
            return s;
        }
    }
};

/** Consumes the next character. If it's a newline, also increments line number.  */
Tokenizer.prototype.consume = function () {
    if (this.i < this.source.length) {
        let c = this.source[this.i++];

        if (c === "\n") {
            this.line++;
        }

        return c;
    }

    return null;
};

/** Consume next char if it matches `c`. */
Tokenizer.prototype.matches = function (c) {
    if (this.i < this.source.length && this.source[this.i] === c) {
        return this.source[this.i++];
    }

    return null;
};

//==================================================
// Ast
//==================================================

/** Abstract Syntax Tree type enum */
let AstType = {
    NUMBER: "NUMBER",
    STRING: "STRING",
    BOOLEAN: "BOOLEAN",
    THIS: "THIS",
    IDENTIFIER: "IDENTIFIER",
    ARRAY: "ARRAY",
    OBJECT: "OBJECT",
    FUNCTION: "FUNCTION",
};

//==================================================
// Parser
//==================================================

function Parser(source) {
    this.tokenizer = new Tokenizer(source);
    this.queue = [];
}

Parser.prototype.assignmentExpression = function () {
    throw Error("unimplemented");
};

/** Primary Expression */
Parser.prototype.primary = function () {
    let token = this.peek(0);

    switch (token.type) {
        case TokenType.IDENTIFIER:
            return this.identifier();
        case TokenType.NUMBER:
        case TokenType.STRING:
        case TokenType.BOOLEAN:
            return this.literal();
        case TokenType.PUNCTUATOR:
            if (token.value === "[") {
                return this.array();
            } else if (token.value === "{") {
                return this.object();
            } else if (token.value === "(") {
                this.advance();
                let expr = this.expression();
                this.expect(")");
                return expr;
            } else {
                this.panic();
            }
        case TokenType.KEYWORD:
            if (token.value === "function") {
                return this.function();
            } else {
                this.panic();
            }
        default:
            this.panic();
    }
};

Parser.prototype.array = function () {
    // consume `[` and get line
    let line = this.advance().line;

    function parseFn() {
        let element = this.assignmentExpression();
        let token = this.peek();

        if (token.type === TokenType.PUNCTUATOR && token.value === ",") {
            this.advance();
        } else {
            if (token.type !== TokenType.PUNCTUATOR || token.value !== "]") {
                this.panic();
            }
        }

        return element;
    }

    function predicate(token) {
        return token.type !== TokenType.PUNCTUATOR || token.value !== "]";
    }

    let elements = this.parseWithWhile(parseFn, predicate);

    // consume `]`
    this.expect(TokenType.PUNCTUATOR, "]");

    return { type: AstType.ARRAY, elements: elements, line: line };
};

Parser.prototype.literal = function () {
    let token = this.advance();

    switch (token.type) {
        case TokenType.NUMBER:
            return {
                type: AstType.NUMBER,
                value: token.value,
                line: token.line,
            };
        case TokenType.STRING:
            return {
                type: AstType.STRING,
                value: token.value,
                line: token.line,
            };
        case TokenType.BOOLEAN:
            return {
                type: AstType.BOOLEAN,
                value: token.value,
                line: token.line,
            };
        default:
            this.panic();
    }
};

Parser.prototype.identifier = function () {
    let token = this.advance();
    return { type: AstType.IDENTIFIER, value: token.value, line: token.line };
};

Parser.prototype.parseWithWhile = function (parseFn, predicate) {
    let nodes = [];

    while (true) {
        let token = this.peek(0);

        if (!predicate(token)) {
            return nodes;
        }

        nodes.push(parseFn(token));
    }
};

/** Peek next + nth token and return */
Parser.prototype.peek = function (n) {
    while (this.queue.length <= n) {
        this.queue.push(this.advance());
    }

    return this.queue[n];
};

/** Returns next token or panics if its type not equal to `tokenType` and value not equal to `value` */
Parser.prototype.expect = function (tokenType, value) {
    let nextToken = this.advance();

    if (
        nextToken.type !== tokenType ||
        (value !== null && value !== nextToken.value)
    ) {
        this.panic();
    }

    return nextToken;
};

/** Get next token */
Parser.prototype.advance = function () {
    if (this.queue.length > 0) {
        return this.queue.shift();
    }

    return this.tokenizer.next();
};

Parser.prototype.panic = function () {
    throw Error("parser panicked");
};

//==================================================
// Compiler
//==================================================

//==================================================
// VM
//==================================================

function Vm(code) {
    // instruction pointer
    this.ip = 0;
    // stack pointer
    this.sp = 0;
    this.code = code;
    this.stack = initArray(STACK_MAX, 0);
}

/** Run VM */
Vm.prototype.run = function () {
    // main interpreter loop
    while (this.ip < this.code.length) {
        switch (this.fetch()) {
            case Opcodes.POP:
                this.opPop();
                break;
            case Opcodes.LOG:
                this.opLog();
                break;
        }
    }
};

//--------------------------------------------------
// VM - instructions
//--------------------------------------------------

/** Pop value from top of stack and discard it */
Vm.prototype.opPop = function () {
    dbg("Op POP");
    if (this.sp > 0) {
        this.pop();
    } else {
        this.panic();
    }
};

/** Pop top value from stack and log it to console */
Vm.prototype.opLog = function () {
    dbg("Op LOG");
    let value = this.pop();
    console.log(value);
};

//--------------------------------------------------
// VM - utils
//--------------------------------------------------

/** Fetch next opcode */
Vm.prototype.fetch = function () {
    return this.code[this.ip++];
};

/** Panic */
Vm.prototype.panic = function () {
    return;
};

/** Push value on top of stack */
Vm.prototype.push = function (value) {
    if (this.sp < STACK_MAX) {
        this.stack[this.sp++] = value;
        dbg("Stack after push:", this.stack.slice(0, this.sp));
    } else {
        this.panic();
    }
};

/** Pop value from top of stack and return it */
Vm.prototype.pop = function () {
    if (this.sp > 0) {
        let value = this.stack[--this.sp];
        dbg("Stack after POP:", this.stack.slice(0, this.sp));
        return value;
    } else {
        this.panic();
    }
};

//==================================================
// Main
//==================================================

(function () {
    let source = `
        for (let x = 0; x < foobar.length; x++) {
            this.baz(x);
            console.log(true);
        }
    `;

    let tokenizer = new Tokenizer(source);

    while (true) {
        let token = tokenizer.next();
        console.log(token);
        if (token.type === TokenType.EOF) {
            break;
        }
    }
})();
