"use strict";

//==================================================================
// Constants
//==================================================================

let UINT8_MAX = 256 | 0;
let FRAMES_MAX = 64 | 0;
let STACK_MAX = FRAMES_MAX * UINT8_MAX;
let MAX_NUM_CONSTANTS = UINT8_MAX;

//==================================================================
// Helpers
//==================================================================

/** Returns an array of specified size filled with specified value */
function initArray(size, fillValue) {
    let arr = [];

    for (let i = 0; i < size; i++) {
        arr.push(fillValue);
    }

    return arr;
}

//==================================================================
// Tokenizer
//==================================================================

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
        case "?":
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
                this.i < this.source.length &&
                this.source[this.i] === "." &&
                this.i + 1 < this.source.length &&
                this.source[this.i + 1] === "."
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
                        this.scanSinglelineComment();
                        break;
                    } else if (this.source[this.i + 1] === "*") {
                        this.scanMultilineComment();
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
        case "try":
        case "case":
        case "else":
        case "this":
        case "break":
        case "catch":
        case "throw":
        case "while":
        case "return":
        case "switch":
        case "typeof":
        case "continue":
        case "default":
        case "function":
        case "undefined":
        case "instanceof":
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

Tokenizer.prototype.scanSinglelineComment = function () {
    // consume `//`
    this.i += 2;
    this.scanUntil(function (c) {
        return c === "\n";
    });
};

Tokenizer.prototype.scanMultilineComment = function () {
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
    return { type: type, value: value, line: this.line };
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

        // If char after next is EOF or matches `c2`, return.
        if (
            this.i >= this.source.length ||
            this.i + 1 >= this.source.length ||
            pred2(this.source[this.i + 1])
        ) {
            return s;
        }

        s += this.source[this.i++];
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

//==================================================================
// Ast
//==================================================================

/** Abstract Syntax Tree type enum */
let AstType = {
    NUMBER: "NUMBER",
    STRING: "STRING",
    BOOLEAN: "BOOLEAN",
    NULL: "NULL",
    THIS: "THIS",
    IDENTIFIER: "IDENTIFIER",
    ARRAY: "ARRAY",
    OBJECT: "OBJECT",
    FUNCTION_EXPR: "FUNCTION_EXPR",
    CONDITIONAL_EXPR: "CONDITIONAL_EXPR",
    BINARY_EXPR: "BINARY_EXPR",
    UNARY_EXPR: "UNARY_EXPR",
    UPDATE_EXPR: "UPDATE_EXPR",
    NEW_EXPR: "NEW_EXPR",
    COMPUTED_MEMBER_EXPR: "COMPUTED_MEMBER_EXPR",
    STATIC_MEMBER_EXPR: "STATIC_MEMBER_EXPR",
    CALL_EXPR: "CALL_EXPR",
    SPREAD: "SPREAD",
    SEQUENCE_EXPR: "SEQUENCE_EXPR",
    ASSIGNMENT_EXPR: "ASSIGNMENT_EXPR",
    EXPRESSION_STMT: "EXPRESSION_STMT",
    EMPTY_STMT: "EMPTY_STMT",
    BLOCK_STMT: "BLOCK_STMT",
    CONTINUE_STMT: "CONTINUE_STMT",
    BREAK_STMT: "BREAK_STMT",
    RETURN_STMT: "RETURN_STMT",
    IF_STMT: "IF_STMT",
    FOR_STMT: "FOR_STMT",
    WHILE_STMT: "WHILE_STMT",
    SWITCH_STMT: "SWITCH_STMT",
    THROW_STMT: "THROW_STMT",
    TRY_STMT: "TRY_STMT",
    CATCH_CLAUSE: "CATCH_CLAUSE",
    LET_DCLR: "LET_DCLR",
    FUNCTION_DCLR: "FUNCTION_DCLR",
    SCRIPT: "SCRIPT",
};

//==================================================================
// Parser
//==================================================================

function Parser(source) {
    this.tokenizer = new Tokenizer(source);
    this.queue = [];
    this.line = 0;
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunction = false;
}

Parser.prototype.parse = function () {
    let body = [];
    let nextToken = this.peek(0);
    let line = nextToken.line;

    while (nextToken.type !== TokenType.EOF) {
        body.push(this.statementOrDeclaration());
        nextToken = this.peek(0);
    }

    return { type: AstType.SCRIPT, body: body, line: line };
};

//------------------------------------------------------------------
// Parser - statements & declarations
//------------------------------------------------------------------

Parser.prototype.statementOrDeclaration = function () {
    let token = this.peek(0);

    if (token.type === TokenType.PUNCTUATOR) {
        switch (token.value) {
            case "{":
                return this.blockStmt();
            case ";":
                return this.emptyStmt();
            default:
                return this.expressionStmt();
        }
    }

    if (token.type === TokenType.KEYWORD) {
        switch (token.value) {
            case "let":
                return this.letDclr();
            case "function":
                return this.withFunctionCtx(this.functionDclr.bind(this));
            case "if":
            case "for":
            case "while":
            case "switch":
            case "continue":
            case "break":
            case "return":
            case "throw":
            case "try":
                return this.statement();
            default:
                return this.expressionStmt();
        }
    }

    return this.expressionStmt();
};

Parser.prototype.statement = function () {
    let token = this.peek(0);

    if (token.type === TokenType.PUNCTUATOR) {
        switch (token.value) {
            case "{":
                return this.blockStmt();
            case ";":
                return this.emptyStmt();
            default:
                return this.expressionStmt();
        }
    }

    if (token.type === TokenType.KEYWORD) {
        switch (token.value) {
            case "if":
                return this.ifStmt();
            case "for":
                return this.withIterationCtx(this.forStmt.bind(this));
            case "while":
                return this.withIterationCtx(this.whileStmt.bind(this));
            case "switch":
                return this.withSwitchCtx(this.switchStmt.bind(this));
            case "continue":
                return this.continueStmt();
            case "break":
                return this.breakStmt();
            case "return":
                return this.returnStmt();
            case "throw":
                return this.throwStmt();
            case "try":
                return this.tryStmt();
            default:
                return this.expressionStmt();
        }
    }

    return this.expressionStmt();
};

Parser.prototype.tryStmt = function () {
    // consume `try`
    let line = this.advance().line;
    let block = this.blockStmt();
    let handler = this.catchClause();

    return {
        type: AstType.TRY_STMT,
        block: block,
        handler: handler,
        line: line,
    };
};

Parser.prototype.catchClause = function () {
    let line = this.expect(TokenType.KEYWORD, "catch").line;

    this.expect(TokenType.PUNCTUATOR, "(");
    let param = this.identifier();
    this.expect(TokenType.PUNCTUATOR, ")");

    let block = this.blockStmt();

    return {
        type: AstType.CATCH_CLAUSE,
        param: param,
        block: block,
        line: line,
    };
};

Parser.prototype.emptyStmt = function () {
    this.expectSemicolon();
    return { type: AstType.EMPTY_STMT, line: this.line };
};

Parser.prototype.blockStmt = function () {
    // consume `{`
    let line = this.advance().line;

    let body = this.statementList();

    this.expect(TokenType.PUNCTUATOR, "}");

    return { type: AstType.BLOCK_STMT, body: body, line: line };
};

Parser.prototype.ifStmt = function () {
    // consume `if`
    let line = this.advance().line;

    this.expect(TokenType.PUNCTUATOR, "(");
    let test = this.expression();
    this.expect(TokenType.PUNCTUATOR, ")");

    let consequent = this.statement();
    let alternate = null;
    let nextToken = this.peek(0);

    if (nextToken.type === TokenType.KEYWORD && nextToken.value === "else") {
        // consume `else`
        this.advance();
        alternate = this.statement();
    }

    return {
        type: AstType.IF_STMT,
        test: test,
        consequent: consequent,
        alternate: alternate,
        line: line,
    };
};

Parser.prototype.forStmt = function () {
    // consume `for`
    let line = this.advance().line;

    this.expect(TokenType.PUNCTUATOR, "(");
    let init = null;
    let test = null;
    let update = null;

    let nextToken = this.peek(0);

    // parse init
    if (nextToken.type !== TokenType.PUNCTUATOR || nextToken.value !== ";") {
        if (nextToken.type === TokenType.KEYWORD && nextToken.value === "let") {
            init = this.letDclr();
        } else {
            init = this.expression();
            // we only expect semicolon here since letDclr already consumes a semicolon
            this.expect(TokenType.PUNCTUATOR, ";");
        }
    }

    // parse test
    if (nextToken.type !== TokenType.PUNCTUATOR || nextToken.value !== ";") {
        test = this.expression();
    }

    this.expect(TokenType.PUNCTUATOR, ";");

    // parse update
    if (nextToken.type !== TokenType.PUNCTUATOR || nextToken.value !== ";") {
        update = this.expression();
    }

    this.expect(TokenType.PUNCTUATOR, ")");

    let body = this.statement();

    return {
        type: AstType.FOR_STMT,
        init: init,
        test: test,
        update: update,
        body: body,
        line: line,
    };
};

Parser.prototype.whileStmt = function () {
    // consume `while`
    let line = this.advance().line;

    this.expect(TokenType.PUNCTUATOR, "(");
    let test = this.expression();
    this.expect(TokenType.PUNCTUATOR, ")");

    let body = this.statement();

    return { type: AstType.WHILE_STMT, test: test, body: body, line: line };
};

Parser.prototype.switchStmt = function () {
    // consume `switch`
    let line = this.advance().line;

    this.expect(TokenType.PUNCTUATOR, "(");
    let discriminant = this.expression();
    this.expect(TokenType.PUNCTUATOR, ")");

    this.expect(TokenType.PUNCTUATOR, "{");

    let cases = [];
    let defaultUsed = false;

    let nextToken = this.peek(0);
    while (nextToken.type !== TokenType.PUNCTUATOR || nextToken.value !== "}") {
        if (
            nextToken.type === TokenType.KEYWORD &&
            nextToken.value === "case"
        ) {
            // consume `case`
            let line = this.advance().line;
            let test = this.expression();

            this.expect(TokenType.PUNCTUATOR, ":");

            let consequent = [];

            let nextToken = this.peek(0);
            // convoluted way of expressing "if next token isn't `case`, `default` or `}`"
            if (
                !(
                    nextToken.type === TokenType.KEYWORD &&
                    (nextToken.value === "case" ||
                        nextToken.value === "default")
                ) &&
                !(
                    nextToken.type === TokenType.PUNCTUATOR &&
                    nextToken.value === "}"
                )
            ) {
                // consequent = this.statement();
                consequent = this.switchCase();
            }

            cases.push({
                test: test,
                consequent: consequent,
                line: line,
            });
        } else if (
            nextToken.type === TokenType.KEYWORD &&
            nextToken.value === "default"
        ) {
            // consume `default`
            let line = this.advance().line;

            if (defaultUsed) {
                this.panic("Multiple defaults in switch");
            } else {
                defaultUsed = true;
            }

            this.expect(TokenType.PUNCTUATOR, ":");

            cases.push({
                test: null,
                consequent: this.switchCase(),
                line: line,
            });
        } else {
            this.panic(nextToken.value);
        }

        nextToken = this.peek(0);
    }

    this.expect(TokenType.PUNCTUATOR, "}");

    return {
        type: AstType.SWITCH_STMT,
        discriminant: discriminant,
        cases: cases,
        line: line,
    };
};

Parser.prototype.switchCase = function () {
    function predicate(token) {
        return (
            !(
                token.type === TokenType.KEYWORD &&
                (token.value === "case" || token.value === "default")
            ) && !(token.type === TokenType.PUNCTUATOR && token.value === "}")
        );
    }

    let consequent = this.parseWithWhile(
        this.statementOrDeclaration.bind(this),
        predicate
    );

    return consequent;
};

Parser.prototype.continueStmt = function () {
    if (!this.inIteration) {
        this.panic("Illegal continue statement");
    }

    // consume `continue`
    let line = this.advance().line;
    this.expectSemicolon();
    return { type: AstType.CONTINUE_STMT, line: line };
};

Parser.prototype.breakStmt = function () {
    if (!(this.inIteration || this.inSwitch)) {
        this.panic("Illegal break statement");
    }

    // consume `break`
    let line = this.advance().line;
    this.expectSemicolon();
    return { type: AstType.BREAK_STMT, line: line };
};

Parser.prototype.returnStmt = function () {
    if (!this.inFunction) {
        this.panic("Illegal return statement");
    }

    // consume `return`
    let line = this.advance().line;

    let argument = null;
    let nextToken = this.peek(0);

    if (
        !(nextToken.type === TokenType.PUNCTUATOR && nextToken.value === ";") &&
        nextToken.line === this.line
    ) {
        argument = this.assignmentExpr();
    }

    this.expectSemicolon();
    return { type: AstType.RETURN_STMT, argument: argument, line: line };
};

Parser.prototype.throwStmt = function () {
    // consume `throw`
    let line = this.advance().line;

    let nextToken = this.peek(0);
    if (nextToken.line !== this.line) {
        this.panic(nextToken.value);
    }

    let argument = this.expression();

    this.expectSemicolon();

    return { type: AstType.THROW_STMT, argument: argument, line: line };
};

Parser.prototype.functionDclr = function () {
    // consume `function`
    let line = this.advance().line;

    // function expression names are optional
    let id = this.identifier();

    let params = this.parameters();
    let body = this.functionBody();

    return {
        type: AstType.FUNCTION_DCLR,
        id: id,
        params: params,
        body: body,
        line: line,
    };
};

Parser.prototype.letDclr = function () {
    // consume `let`
    let line = this.advance().line;
    let id = this.identifier();
    let init = null;

    let nextToken = this.peek(0);
    if (nextToken.type === TokenType.PUNCTUATOR && nextToken.value === "=") {
        // consume `=`
        this.advance();
        init = this.assignmentExpr();
    }

    this.expectSemicolon();

    return { type: AstType.LET_DCLR, id: id, init: init, line: line };
};

Parser.prototype.expressionStmt = function () {
    let expression = this.expression();
    this.expectSemicolon();
    return {
        type: AstType.EXPRESSION_STMT,
        expression: expression,
        line: expression.line,
    };
};

Parser.prototype.statementList = function () {
    function predicate(token) {
        return token.type !== TokenType.PUNCTUATOR || token.value !== "}";
    }

    return this.parseWithWhile(
        this.statementOrDeclaration.bind(this),
        predicate
    );
};

//------------------------------------------------------------------
// Parser - expressions
//------------------------------------------------------------------

Parser.prototype.expression = function () {
    let expr = this.assignmentExpr();

    let nextToken = this.peek(0);
    if (nextToken.type === TokenType.PUNCTUATOR && nextToken.value === ",") {
        function parseFn() {
            // consume `,`
            this.advance();
            return this.assignmentExpr();
        }

        function predicate(token) {
            return token.type === TokenType.PUNCTUATOR && token.value === ",";
        }

        let exprs = this.parseWithWhile(parseFn.bind(this), predicate);

        exprs.unshift(expr);

        return {
            type: AstType.SEQUENCE_EXPR,
            expressions: exprs,
            line: expr.line,
        };
    } else {
        return expr;
    }
};

Parser.prototype.assignmentExpr = function () {
    let lhs = this.conditionalExpr();

    let nextToken = this.peek(0);

    if (nextToken.type !== TokenType.PUNCTUATOR) {
        return lhs;
    }

    switch (nextToken.value) {
        case "=":
        case "*=":
        case "/=":
        case "%=":
        case "+=":
        case "-=":
        case "&=":
        case "|=":
            if (lhs.assign_type === "invalid") {
                this.panic("Invalid assignment target.");
            }
            let op = this.advance().value;
            let rhs = this.assignmentExpr();
            return {
                type: AstType.ASSIGNMENT_EXPR,
                operator: op,
                left: lhs,
                right: rhs,
                line: lhs.line,
            };
        default:
            return lhs;
    }
};

Parser.prototype.conditionalExpr = function () {
    let expr = this.binaryExpr();

    let nextToken = this.peek(0);

    if (nextToken.type === TokenType.PUNCTUATOR && nextToken.value === "?") {
        // consume `?`
        this.advance();
        let consequent = this.assignmentExpr();
        // consume `:`
        this.expect(TokenType.PUNCTUATOR, ":");
        let alternate = this.assignmentExpr();

        return {
            type: AstType.CONDITIONAL_EXPR,
            test: expr,
            consequent: consequent,
            alternate: alternate,
            line: expr.line,
        };
    } else {
        return expr;
    }
};

/** Parse binary expressions using precedence climbing */
Parser.prototype.binaryExpr = function () {
    let lhs = this.unaryExpr();

    return this.precedenceClimbing(lhs, 1);
};

Parser.prototype.precedenceClimbing = function (lhs, precedence) {
    let nextToken = this.peek(0);

    while (
        this.isBinaryOp(nextToken) &&
        this.precedence(nextToken) >= precedence
    ) {
        let op = this.advance();
        let rhs = this.unaryExpr();
        nextToken = this.peek(0);

        while (
            this.isBinaryOp(nextToken) &&
            this.precedence(nextToken) > this.precedence(op)
        ) {
            rhs = this.precedenceClimbing(rhs, this.precedence(nextToken));
            nextToken = this.peek(0);
        }

        lhs = {
            type: AstType.BINARY_EXPR,
            operator: op.value,
            lhs: lhs,
            rhs: rhs,
            line: lhs.line,
        };
    }

    return lhs;
};

Parser.prototype.isBinaryOp = function (token) {
    if (token.type !== TokenType.PUNCTUATOR) {
        return token.type === TokenType.KEYWORD && token.value === "instanceof";
    }

    switch (token.value) {
        case "||":
        case "&&":
        case "|":
        case "^":
        case "&":
        case "==":
        case "!=":
        case "===":
        case "!==":
        case "<":
        case ">":
        case "<=":
        case ">=":
        case "<<":
        case ">>":
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
            return true;
        default:
            return false;
    }
};

Parser.prototype.precedence = function (token) {
    if (token.type !== TokenType.PUNCTUATOR) {
        if (token.type === TokenType.KEYWORD && token.value === "instanceof") {
            return 7;
        }
        return 0;
    }

    switch (token.value) {
        case "||":
            return 1;
        case "&&":
            return 2;
        case "|":
            return 3;
        case "^":
            return 4;
        case "&":
            return 5;
        case "==":
        case "!=":
        case "===":
        case "!==":
            return 6;
        case "<":
        case ">":
        case "<=":
        case ">=":
            return 7;
        case "<<":
        case ">>":
            return 8;
        case "+":
        case "-":
            return 9;
        case "*":
        case "/":
            return 10;
        case "%":
            return 11;
        default:
            return 0;
    }
};

Parser.prototype.unaryExpr = function () {
    let nextToken = this.peek(0);

    if (this.isUnaryOp(nextToken)) {
        this.advance();

        let argument = this.unaryExpr();

        return {
            type: AstType.UNARY_EXPR,
            operator: nextToken.value,
            argument: argument,
            line: nextToken.line,
        };
    }

    return this.updateExpr();
};

Parser.prototype.isUnaryOp = function (token) {
    if (
        token.type !== TokenType.KEYWORD &&
        token.type !== TokenType.PUNCTUATOR
    ) {
        return false;
    }

    switch (token.value) {
        case "!":
        case "-":
        case "delete":
        case "typeof":
        case "+":
        case "~":
            return true;
        default:
            return false;
    }
};

Parser.prototype.updateExpr = function () {
    let nextToken = this.peek(0);

    if (
        nextToken.type === TokenType.PUNCTUATOR &&
        (nextToken.value === "--" || nextToken.value === "++")
    ) {
        // handle the prefix case (++x, --x)
        this.advance();
        let argument = this.unaryExpr();

        return {
            type: AstType.UPDATE_EXPR,
            operator: nextToken.value,
            argument: argument,
            prefix: true,
            line: nextToken.line,
        };
    } else {
        // handle the postfix case (x++, x--) or non update expressions
        let expr = this.leftHandSideExpr();

        let nextToken = this.peek(0);

        if (
            nextToken.line === this.line &&
            nextToken.type === TokenType.PUNCTUATOR &&
            (nextToken.value === "--" || nextToken.value === "++")
        ) {
            this.advance();
            return {
                type: AstType.UPDATE_EXPR,
                operator: nextToken.value,
                argument: expr,
                prefix: false,
                line: expr.line,
            };
        } else {
            return expr;
        }
    }
};

Parser.prototype.leftHandSideExpr = function () {
    let nextToken = this.peek(0);

    if (nextToken.type === TokenType.KEYWORD && nextToken.value === "new") {
        return this.newExpr();
    } else {
        return this.callExpr();
    }
};

Parser.prototype.newExpr = function () {
    let nextToken = this.advance();

    let callee = this.memberExpr();
    let args = this.callArguments();
    let expr = {
        type: AstType.NEW_EXPR,
        callee: callee,
        arguments: args,
        line: nextToken.line,
    };

    return this.callTail(expr);
};

Parser.prototype.callExpr = function () {
    let expr = this.memberExpr();

    return this.callTail(expr);
};

Parser.prototype.memberExpr = function () {
    let expr = this.primary();

    while (true) {
        let nextToken = this.peek(0);

        if (
            nextToken.type !== TokenType.PUNCTUATOR &&
            nextToken.value === "["
        ) {
            this.advance();
            let property = this.expression();
            this.expect(TokenType.PUNCTUATOR, "]");
            expr = {
                type: AstType.COMPUTED_MEMBER_EXPR,
                object: expr,
                property: property,
                line: expr.line,
            };
        } else if (
            nextToken.type !== TokenType.PUNCTUATOR &&
            nextToken.value === "."
        ) {
            this.advance();
            let property = this.identifier();
            expr = {
                type: AstType.STATIC_MEMBER_EXPR,
                object: expr,
                property: property,
                line: expr.line,
            };
        } else {
            return expr;
        }
    }
};

Parser.prototype.callTail = function (expr) {
    while (true) {
        let nextToken = this.peek(0);

        if (
            nextToken.type === TokenType.PUNCTUATOR &&
            nextToken.value === "["
        ) {
            this.advance();
            let property = this.expression();
            this.expect(TokenType.PUNCTUATOR, "]");
            expr = {
                type: AstType.COMPUTED_MEMBER_EXPR,
                object: expr,
                property: property,
                line: expr.line,
            };
        } else if (
            nextToken.type === TokenType.PUNCTUATOR &&
            nextToken.value === "."
        ) {
            this.advance();
            let property = this.identifier().value;
            expr = {
                type: AstType.STATIC_MEMBER_EXPR,
                object: expr,
                property: property,
                line: expr.line,
            };
        } else if (
            nextToken.type === TokenType.PUNCTUATOR &&
            nextToken.value === "("
        ) {
            let args = this.callArguments();
            expr = {
                type: AstType.CALL_EXPR,
                callee: expr,
                arguments: args,
                line: expr.line,
            };
        } else {
            return expr;
        }
    }
};

Parser.prototype.callArguments = function () {
    // consume `(`
    this.advance();

    function parseFn() {
        let argument = this.assignmentExpr();

        let nextToken = this.peek(0);
        if (
            nextToken.type === TokenType.PUNCTUATOR &&
            nextToken.value === ","
        ) {
            this.advance();
        } else {
            if (nextToken.value !== ")") {
                this.panic("Unexpected token " + nextToken.value);
            }
        }

        return argument;
    }

    function predicate(token) {
        return (
            token.type !== TokenType.PUNCTUATOR ||
            (token.value !== ")" && token.value !== "...")
        );
    }

    let args = this.parseWithWhile(parseFn.bind(this), predicate);

    let nextToken = this.peek(0);
    if (nextToken.type === TokenType.PUNCTUATOR && nextToken.value === "...") {
        // consume `...`
        this.advance();
        let argument = this.assignmentExpr();
        args.push({
            type: AstType.SPREAD,
            argument: argument,
            line: nextToken.line,
        });
    }

    // consume `)`
    this.expect(TokenType.PUNCTUATOR, ")");

    return args;
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
        case TokenType.NULL:
            return this.literal();
        case TokenType.PUNCTUATOR:
            if (token.value === "[") {
                return this.array();
            } else if (token.value === "{") {
                return this.object();
            } else if (token.value === "(") {
                // consume `(`
                this.advance();
                let expr = this.expression();
                this.expect(TokenType.PUNCTUATOR, ")");
                return expr;
            } else {
                this.panic(token.value);
            }
        case TokenType.KEYWORD:
            if (token.value === "function") {
                return this.withFunctionCtx(this.function.bind(this));
            } else if (token.value === "this") {
                let token = this.advance();
                return {
                    type: AstType.THIS,
                    value: token.value,
                    line: token.line,
                };
            } else if (token.value === "undefined") {
                return this.identifier();
            } else {
                this.panic(token.value);
            }
        default:
            this.panic(token.value);
    }
};

Parser.prototype.function = function () {
    // consume `function`
    let line = this.advance().line;

    // function expression names are optional
    let id = null;
    let nextToken = this.peek(0);

    if (nextToken.type === TokenType.IDENTIFIER) {
        id = this.identifier();
    }

    let params = this.parameters();
    let body = this.functionBody();

    return {
        type: AstType.FUNCTION_EXPR,
        id: id,
        params: params,
        body: body,
        line: line,
    };
};

Parser.prototype.parameters = function () {
    this.expect(TokenType.PUNCTUATOR, "(");

    function parseFn() {
        let param = this.identifier();

        let nextToken = this.peek(0);
        if (
            nextToken.type === TokenType.PUNCTUATOR &&
            nextToken.value === ","
        ) {
            this.advance();
        } else {
            if (
                nextToken.type !== TokenType.PUNCTUATOR ||
                nextToken.value !== ")"
            ) {
                this.panic(nextToken.value);
            }
        }

        return param;
    }

    function predicate(token) {
        return token.type !== TokenType.PUNCTUATOR || token.value !== ")";
    }

    let parameters = this.parseWithWhile(parseFn.bind(this), predicate);
    this.expect(TokenType.PUNCTUATOR, ")");

    return parameters;
};

Parser.prototype.functionBody = function () {
    this.expect(TokenType.PUNCTUATOR, "{");

    let body = this.statementList();

    this.expect(TokenType.PUNCTUATOR, "}");

    return body;
};

Parser.prototype.object = function () {
    // consume `{` and get line
    let line = this.advance().line;

    function parseFn() {
        let name = this.propertyName();
        this.expect(TokenType.PUNCTUATOR, ":");
        let value = this.assignmentExpr();

        let nextToken = this.peek(0);

        if (
            nextToken.type === TokenType.PUNCTUATOR &&
            nextToken.value === ","
        ) {
            this.advance();
        } else {
            if (
                nextToken.type !== TokenType.PUNCTUATOR ||
                nextToken.value !== "}"
            ) {
                this.panic(nextToken.value);
            }
        }

        return { name: name, value: value, line: name.line };
    }

    function predicate(token) {
        return token.type !== TokenType.PUNCTUATOR || token.value !== "}";
    }

    let properties = this.parseWithWhile(parseFn.bind(this), predicate);

    // consume `}`
    this.expect(TokenType.PUNCTUATOR, "}");

    return { type: AstType.OBJECT, properties: properties, line: line };
};

Parser.prototype.propertyName = function () {
    let token = this.peek(0);

    switch (token.type) {
        case TokenType.IDENTIFIER:
        case TokenType.STRING:
        case TokenType.NUMBER:
        case TokenType.KEYWORD:
        case TokenType.NULL:
        case TokenType.BOOLEAN:
            this.advance();
            return { value: token.value, line: token.line };
        default:
            this.panic(token.value);
    }
};

Parser.prototype.array = function () {
    // consume `[` and get line
    let line = this.advance().line;

    function parseFn() {
        let element = this.assignmentExpr();
        let nextToken = this.peek(0);

        if (
            nextToken.type === TokenType.PUNCTUATOR &&
            nextToken.value === ","
        ) {
            this.advance();
        } else {
            if (
                nextToken.type !== TokenType.PUNCTUATOR ||
                nextToken.value !== "]"
            ) {
                this.panic(nextToken.value);
            }
        }

        return element;
    }

    function predicate(token) {
        return token.type !== TokenType.PUNCTUATOR || token.value !== "]";
    }

    let elements = this.parseWithWhile(parseFn.bind(this), predicate);

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
        case TokenType.NULL:
            return {
                type: AstType.NULL,
                value: token.value,
                line: token.line,
            };
        default:
            this.panic(token.value);
    }
};

Parser.prototype.identifier = function () {
    let token = this.advance();

    return { type: AstType.IDENTIFIER, value: token.value, line: token.line };
};

//------------------------------------------------------------------
// Parser - utils
//------------------------------------------------------------------

Parser.prototype.withIterationCtx = function (parseFn) {
    let lastInIteration = this.inIteration;
    this.inIteration = true;

    let result = parseFn();

    this.inIteration = lastInIteration;

    return result;
};

Parser.prototype.withSwitchCtx = function (parseFn) {
    let lastInSwitch = this.inSwitch;
    this.inSwitch = true;

    let result = parseFn();

    this.inSwitch = lastInSwitch;

    return result;
};

Parser.prototype.withFunctionCtx = function (parseFn) {
    let lastInFunction = this.inFunction;
    this.inFunction = true;

    let result = parseFn();

    this.inFunction = lastInFunction;

    return result;
};

Parser.prototype.expectSemicolon = function () {
    let nextToken = this.peek(0);

    if (nextToken.type === TokenType.PUNCTUATOR && nextToken.value === ";") {
        // consume `;`
        this.advance();
    } else if (nextToken.line === this.line) {
        // if next token is on the same line only perform
        // automatic semicolon insertion if it's `}` or EOF
        if (
            !(
                (nextToken.type === TokenType.PUNCTUATOR &&
                    nextToken.value === "}") ||
                nextToken.type === TokenType.EOF
            )
        ) {
            this.panic(nextToken.value);
        }
    }
    // else perform automatic semicolon insertion
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
        this.queue.push(this.nextToken());
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
        this.panic(nextToken.value + " expected: " + value);
    }

    return nextToken;
};

/** Get next token and update current line */
Parser.prototype.advance = function () {
    let token = this.nextToken();

    this.line = token.line;

    return token;
};

/** Get next token */
Parser.prototype.nextToken = function () {
    if (this.queue.length > 0) {
        return this.queue.shift();
    }

    return this.tokenizer.next();
};

Parser.prototype.panic = function (msg) {
    throw Error(
        "parser panicked on: " + msg + ". Last line parsed: " + this.line
    );
};

//==================================================================
//  Bytecode
//==================================================================

// prettier-ignore
let Opcodes = {
    POP:               0x00,
    PUSH_CONSTANT:     0x01,
    PUSH_TRUE:         0x02,
    PUSH_FALSE:        0x03,
    PUSH_NULL:         0x04,
    PUSH_THIS:         0x05,
    ADD:               0x06,
    SUB:               0x07,
    MUL:               0x08,
    DIV:               0x09,
    NEW_OBJECT:        0x0A,
    NEW_ARRAY:         0x0B,
    GET_BY_ID:         0x0C,
    SET_BY_ID:         0x0D,
    GET_BY_VALUE:      0x0E,
    SET_BY_VALUE:      0x0F,
    JUMP_IF_FALSE:     0x10,
    JUMP:              0x11,
    PUSH_UNDEFINED:    0x12,
    GET_LOCAL:         0x13,
    GET_FROM_ENV:      0x14,
    DUPLICATE:         0x15,
    CMP_EQ:            0x16,
    JUMP_IF_TRUE:      0x17,
    LOOP:              0x18,
    PUSH_INT:          0x19,
    SET_LOCAL:         0x1A,
    SET_FROM_ENV:      0x1B,
    SWAP_TOP_TWO:      0x1C,
    CMP_LT:            0x1D,  
    CMP_LEQ:           0x1E,
    CMP_GT:            0x1F,
    CMP_GEQ:           0x20,
    CMP_NEQ:           0x21,
    CREATE_FUNCTION:   0x22,
    RETURN:            0x23,
    CALL_FUNCTION:     0x24,
    CALL_METHOD:       0x25,
    CALL_CONSTRUCTOR:  0x26,
    GET_UPVAR:         0x27,
    SET_UPVAR:         0x28,
    CLOSE_UPVAR:       0x29,
    SPREAD:            0x2A,
    OR:                0x2B,
    AND:               0x2C,
    XOR:               0x2D,
    MOD:               0x2E,
    NOT:               0x2F,
    TYPEOF:            0x30,
    NEGATE:            0x31,
    INSTANCEOF:        0x32,
    PUSH_TRY_CATCH:    0x33,
    POP_TRY_CATCH:     0x34,
    THROW:             0x35,
};

//==================================================================
// Runtime
//==================================================================

// prettier-ignore
let JSType = {
    NUMBER:     0x00,
    BOOLEAN:    0x01,
    NULL:       0x02,
    UNDEFINED:  0x03,
    STRING:     0x04,
    OBJECT:     0x05,
};

// prettier-ignore
let JSObjectType = {
    ORDINARY:       0x00,
    ARRAY:          0x01,
    FUNCTION:       0x02,
    NATIVE:         0x03,
    BOUND_FUNCTION: 0x04,
}

function toString(value) {
    switch (value.type) {
        case JSType.NUMBER:
            return String(value.value);
        case JSType.BOOLEAN:
            return value.value ? "true" : "false";
        case JSType.NULL:
            return "null";
        case JSType.UNDEFINED:
            return "undefined";
        case JSType.STRING:
            return value.value;
        case JSType.OBJECT:
            return objectToString(value);
        default:
            // throw Error("Unknown type: " + value);
            return value + "";
    }
}

function objectToString(value) {
    switch (value.objectType) {
        case JSObjectType.ORDINARY:
            return "[object Object]";
        case JSObjectType.ARRAY:
            let elements = [];
            let numElements = value.elements.length;
            for (let i = 0; i < 100; i++) {
                if (i === numElements) {
                    return "[" + elements.join(", ") + "]";
                }
                elements.push(toString(value.elements[i]));
            }
            return "[" + elements.join(", ") + ", ...]";
        case JSObjectType.FUNCTION:
        case JSObjectType.BOUND_FUNCTION:
            return "[" + value.vmFunction.name + ": Function]";
        case JSObjectType.NATIVE:
            return "[native code]";
        default:
            throw Error("Unknown type " + value);
    }
}

//------------------------------------------------------------------
// Runtime - Common ops
//------------------------------------------------------------------

function TLCommonEqual(right, runtime) {
    return this.value === right.value ? runtime.JSTrue : runtime.JSFalse;
}

function TLCommonLt(right, runtime) {
    return this.value < right.value ? runtime.JSTrue : runtime.JSFalse;
}

function TLCommonLeq(right, runtime) {
    return this.value <= right.value ? runtime.JSTrue : runtime.JSFalse;
}

function TLCommonGt(right, runtime) {
    return this.value > right.value ? runtime.JSTrue : runtime.JSFalse;
}

function TLCommonGeq(right, runtime) {
    return this.value >= right.value ? runtime.JSTrue : runtime.JSFalse;
}

function TLCommonNeq(right, runtime) {
    return this.value !== right.value ? runtime.JSTrue : runtime.JSFalse;
}

//------------------------------------------------------------------
// Runtime - Environment
//------------------------------------------------------------------

function Env(outerEnv) {
    this.map = {};
    this.outer = outerEnv;
}

Env.prototype.add = function (key, value) {
    this.map[key] = value;
};

Env.prototype.get = function (key) {
    let env = this;
    while (env !== null) {
        if (env.map.hasOwnProperty(key)) {
            return env.map[key];
        }
        env = env.outer;
    }

    return null;
};

//------------------------------------------------------------------
// Runtime - Shape
//------------------------------------------------------------------

function Shape(key, offset, parent) {
    this.parent = parent;
    this.key = key;
    this.offset = offset;
    this.transitions = {};
    this.shapeTable = {};
    this.cacheIdx = null;
    this.constructorFlag = true;
}

Shape.prototype.transition = function (key) {
    if (
        this.transitions[key] !== undefined &&
        !(key === "constructor" && this.constructorFlag)
    ) {
        return this.transitions[key];
    }

    if (key === "constructor") this.constructorFlag = false;

    let shape = new Shape(
        key,
        this.offset !== null ? this.offset + 1 : 0,
        this
    );

    // clone parent (this) shapeTable
    Object.assign(shape.shapeTable, this.shapeTable);
    // assign self to shapeTable (so its transition contains it)
    shape.shapeTable[key] = shape;

    this.transitions[key] = shape;

    return shape;
};

//------------------------------------------------------------------
// Runtime - JSObject
//------------------------------------------------------------------

function JSObject(shape, proto) {
    this.type = JSType.OBJECT;
    this.objectType = JSObjectType.ORDINARY;
    // property values
    this.indexedValues = [];
    // object shape (structure/hidden class)
    this.shape = shape;
    // prototype
    this.proto = proto;

    // property values
    this.mappedValues = {};
}

JSObject.prototype.addProperty = function (key, value, writable) {
    if (this.indexedValues.length < UINT8_MAX) {
        this.shape = this.shape.transition(key);
        this.indexedValues.push(value);
    } else {
        this.mappedValues[key] = value;
    }
};

JSObject.prototype.equal = function (right, runtime) {
    return this === right ? runtime.JSTrue : runtime.JSFalse;
};

JSObject.prototype.neq = function (right, runtime) {
    return this !== right ? runtime.JSTrue : runtime.JSFalse;
};

//------------------------------------------------------------------
// Runtime - JSNumber
//------------------------------------------------------------------

function JSNumber(shape, proto, value) {
    this.type = JSType.NUMBER;
    this.proto = proto;
    this.value = value;
    this.shape = shape;
    this.mappedValues = {};
}

JSNumber.prototype.addProperty = function (key, value, writable) {
    // can't set properties on numbers
};

JSNumber.prototype.add = function (right, runtime) {
    return runtime.newNumber(this.value + right.value);
};

JSNumber.prototype.sub = function (right, runtime) {
    return runtime.newNumber(this.value - right.value);
};

JSNumber.prototype.mul = function (right, runtime) {
    return runtime.newNumber(this.value * right.value);
};

JSNumber.prototype.div = function (right, runtime) {
    return runtime.newNumber(this.value / right.value);
};

JSNumber.prototype.or = function (right, runtime) {
    return runtime.newNumber(this.value | right.value);
};

JSNumber.prototype.and = function (right, runtime) {
    return runtime.newNumber(this.value & right.value);
};

JSNumber.prototype.mod = function (right, runtime) {
    return runtime.newNumber(this.value % right.value);
};

JSNumber.prototype.xor = function (right, runtime) {
    return runtime.newNumber(this.value ^ right.value);
};

JSNumber.prototype.equal = TLCommonEqual;
JSNumber.prototype.lt = TLCommonLt;
JSNumber.prototype.leq = TLCommonLeq;
JSNumber.prototype.gt = TLCommonGt;
JSNumber.prototype.geq = TLCommonGeq;
JSNumber.prototype.neq = TLCommonNeq;

//------------------------------------------------------------------
// Runtime - JSBoolean
//------------------------------------------------------------------

function JSBoolean(shape, proto, value) {
    this.type = JSType.BOOLEAN;
    this.proto = proto;
    this.value = value;
    this.shape = shape;
    this.mappedValues = {};
}

JSBoolean.prototype.addProperty = function (key, value, writable) {
    // can't set properties on booleans
};

JSBoolean.prototype.add = JSNumber.prototype.add;
JSBoolean.prototype.sub = JSNumber.prototype.sub;
JSBoolean.prototype.mul = JSNumber.prototype.mul;
JSBoolean.prototype.div = JSNumber.prototype.div;
JSBoolean.prototype.or = JSNumber.prototype.or;
JSBoolean.prototype.and = JSNumber.prototype.and;
JSBoolean.prototype.xor = JSNumber.prototype.xor;
JSBoolean.prototype.mod = JSNumber.prototype.mod;

JSBoolean.prototype.equal = TLCommonEqual;
JSBoolean.prototype.lt = TLCommonLt;
JSBoolean.prototype.leq = TLCommonLeq;
JSBoolean.prototype.gt = TLCommonGt;
JSBoolean.prototype.geq = TLCommonGeq;
JSBoolean.prototype.neq = TLCommonNeq;

//------------------------------------------------------------------
// Runtime - JSString
//------------------------------------------------------------------

function JSString(shape, proto, value, stringLength) {
    this.type = JSType.STRING;
    this.proto = proto;
    this.value = value;
    this.shape = shape;
    this.mappedValues = {
        length: stringLength,
    };
}

JSString.prototype.addProperty = function (key, value, writable) {
    // can't set properties on strings
};

JSString.prototype.add = function (right, runtime) {
    return runtime.newString(this.value + right.value);
};

JSString.prototype.equal = function (right, runtime) {
    return this.type === right.type && this.value === right.value
        ? runtime.JSTrue
        : runtime.JSFalse;
};

JSString.prototype.equal = TLCommonEqual;
JSString.prototype.lt = TLCommonLt;
JSString.prototype.leq = TLCommonLeq;
JSString.prototype.gt = TLCommonGt;
JSString.prototype.geq = TLCommonGeq;
JSString.prototype.neq = TLCommonNeq;

//------------------------------------------------------------------
// Runtime - JSArray
//------------------------------------------------------------------

function JSArray(shape, proto, elements) {
    JSObject.call(this, shape, proto);
    this.objectType = JSObjectType.ARRAY;
    this.elements = elements;
}

JSArray.prototype = Object.create(JSObject.prototype);
JSArray.prototype.constructor = JSArray;

//------------------------------------------------------------------
// Runtime - JSFunction
//------------------------------------------------------------------

function JSFunction(shape, proto, objectType, vmFunction) {
    JSObject.call(this, shape, proto);
    this.objectType = objectType;
    this.vmFunction = vmFunction;
    // this.vmOrNativeFunction = this.vmOrNativeFunction;
}

JSFunction.prototype = Object.create(JSObject.prototype);
JSFunction.prototype.constructor = JSFunction;

//------------------------------------------------------------------
// Runtime - JSNull & JSUndefined
//------------------------------------------------------------------

function JSNull() {
    this.type = JSType.NULL;
}

JSNull.prototype.equal = function (right, runtime) {
    return this.type === right.type ? runtime.JSTrue : runtime.JSFalse;
};

JSNull.prototype.neq = function (right, runtime) {
    return this.type !== right.type ? runtime.JSTrue : runtime.JSFalse;
};

function JSUndefined() {
    this.type = JSType.UNDEFINED;
}

JSUndefined.prototype.equal = JSNull.prototype.equal;
JSUndefined.prototype.neq = JSNull.prototype.neq;

//------------------------------------------------------------------
// Runtime - Runtime
//------------------------------------------------------------------

function Runtime() {
    // primitive constants
    this.JSNull = new JSNull();
    this.JSUndefined = new JSUndefined();

    this.emptyObjectShape = new Shape("", null, null);

    //---------------------------------------------
    // Builtin objects
    //---------------------------------------------
    // Object prototype
    this.JSObjectPrototype = new JSObject(this.emptyObjectShape, null);

    // Boolean
    this.JSBooleanPrototype = new JSBoolean(
        this.emptyObjectShape,
        this.JSObjectPrototype,
        false
    );

    this.JSTrue = new JSBoolean(
        this.emptyObjectShape,
        this.JSBooleanPrototype,
        true
    );

    this.JSFalse = new JSBoolean(
        this.emptyObjectShape,
        this.JSBooleanPrototype,
        false
    );

    // Number prototype
    this.JSNumberPrototype = new JSNumber(
        this.emptyObjectShape,
        this.JSObjectPrototype,
        0
    );

    // Array prototype
    this.JSArrayPrototype = new JSArray(
        this.emptyObjectShape,
        this.JSObjectPrototype,
        []
    );

    // String prototype
    this.JSStringPrototype = new JSString(
        this.emptyObjectShape,
        this.JSObjectPrototype,
        ""
    );

    // Function prototype
    this.JSFunctionPrototype = new JSFunction(
        this.emptyObjectShape,
        this.JSObjectPrototype,
        JSObjectType.NATIVE,
        null
    );

    this.JSFunctionPrototype.addProperty(
        "bind",
        this.newNativeFunction("bind", 1, function (vm, args, thisObj) {
            if (thisObj.objectType === JSObjectType.NATIVE) {
                vm.panic(
                    "Thislang does not support `bind` on native functions."
                );
            }
            let fun = thisObj.vmFunction.clone();
            fun.name = "bound " + fun.name;
            fun.boundThis = args[0];
            fun.boundArgs = args.slice(1);

            return vm.runtime.newBoundFunction(fun, thisObj.proto);
        })
    );
}

Runtime.prototype.newBoundFunction = function (boundVmFunction, proto) {
    return new JSFunction(
        this.emptyObjectShape,
        proto,
        JSObjectType.BOUND_FUNCTION,
        boundVmFunction
    );
};

Runtime.prototype.newEmptyObject = function () {
    return new JSObject(this.emptyObjectShape, this.JSObjectPrototype);
};

Runtime.prototype.newNumber = function (value) {
    return new JSNumber(this.emptyObjectShape, this.JSNumberPrototype, value);
};

Runtime.prototype.newString = function (value) {
    let string = new JSString(
        this.emptyObjectShape,
        this.JSStringPrototype,
        value,
        this.newNumber(value.length)
    );

    return string;
};

Runtime.prototype.newFunction = function (vmFunction) {
    let fun = new JSFunction(
        this.emptyObjectShape,
        this.JSFunctionPrototype,
        JSObjectType.FUNCTION,
        vmFunction
    );

    let prototypeObj = this.newEmptyObject();
    prototypeObj.addProperty("constructor", fun);
    fun.addProperty("prototype", prototypeObj);

    return fun;
};

Runtime.prototype.newArray = function (elements) {
    let array = new JSArray(
        this.emptyObjectShape,
        this.JSArrayPrototype,
        elements
    );

    // INVARIANT: "length" must always be at index 0 of indexedValues
    // for JSArrays
    array.addProperty("length", this.newNumber(elements.length), true);

    array.addProperty(
        "push",
        this.newNativeFunction("push", 1, function (vm, args, thisObj) {
            thisObj.elements.push(args[0]);
            thisObj.indexedValues[0] = vm.runtime.newNumber(
                thisObj.indexedValues[0].value + 1
            );
            return thisObj;
        })
    );

    array.addProperty(
        "pop",
        this.newNativeFunction("pop", 0, function (vm, args, thisObj) {
            thisObj.elements.pop();
            thisObj.indexedValues[0] = vm.runtime.newNumber(
                thisObj.indexedValues[0].value - 1
            );
            return thisObj;
        })
    );

    array.addProperty(
        "map",
        this.newNativeFunction("map", 1, function (vm, args, thisObj) {
            let mapFn = args[0];
            let mappedElements = thisObj.elements.map(function (x) {
                // push fn twice (once to make up a slot for `arguments`)
                vm.push(mapFn);
                vm.push(mapFn);
                // push `x` on stack as argument to mapFn
                vm.push(x);
                // call mapFn with 1 as value of numArguments
                vm.callFunction(1);
                // run VM with `singleFunctionRun` flag
                vm.singleFunctionRun = true;
                let value = vm.run();
                vm.singleFunctionRun = false;
                return value;
            });

            return vm.runtime.newArray(mappedElements);
        }),
        false
    );

    array.addProperty(
        "filter",
        this.newNativeFunction("filter", 1, function (vm, args, thisObj) {
            let reduceFn = args[0];
            let reducedElements = thisObj.elements.filter(function (x) {
                // push fn twice (once to make up a slot for `arguments`)
                vm.push(reduceFn);
                vm.push(reduceFn);
                // push `x` on stack as argument to mapFn
                vm.push(x);
                // call mapFn with 1 as value of numArguments
                vm.callFunction(1);
                // run VM with `singleFunctionRun` flag
                vm.singleFunctionRun = true;
                let value = vm.run();
                vm.singleFunctionRun = false;
                return vm.isTruthy(value);
            });

            return vm.runtime.newArray(reducedElements);
        }),
        false
    );

    return array;
};

Runtime.prototype.newNativeFunction = function (name, arity, nativeFunction) {
    return new JSFunction(
        this.emptyObjectShape,
        this.JSFunctionPrototype,
        JSObjectType.NATIVE,
        new NativeFunction(name, arity, nativeFunction)
    );
};

Runtime.prototype.generateGlobalEnv = function () {
    let env = new Env(null);

    env.add("undefined", this.JSUndefined);

    //--------------------------------------------------
    // console
    //--------------------------------------------------
    let TLConsole = this.newEmptyObject();

    TLConsole.addProperty(
        "log",
        this.newNativeFunction("log", 0, function (vm, args, thisObj) {
            console.log(...args.map(toString));
            return vm.runtime.JSUndefined;
        })
    );

    TLConsole.addProperty(
        "error",
        this.newNativeFunction("error", 0, function (vm, args, thisObj) {
            console.error(...args.map(toString));
            return vm.runtime.JSUndefined;
        })
    );

    env.add("console", TLConsole);

    env.add(
        "print",
        this.newNativeFunction("print", 0, function (vm, args, thisObj) {
            console.log(...args);
            return vm.runtime.JSUndefined;
        })
    );

    //--------------------------------------------------
    // Object
    //--------------------------------------------------
    let TLObject = this.newNativeFunction(
        "Object",
        0,
        function (vm, args, thisObj) {
            if (args.length === 0) {
                return vm.runtime.newEmptyObject();
            } else {
                return args[0];
            }
        }
    );

    TLObject.addProperty("prototype", this.JSObjectPrototype);

    TLObject.addProperty(
        "getPrototypeOf",
        this.newNativeFunction(
            "getPrototypeOf",
            1,
            function (vm, args, thisObj) {
                if (
                    args[0].type === JSType.UNDEFINED ||
                    args[0].type === JSType.NULL
                ) {
                    vm.panic("Cannot convert null or undefined to object.");
                } else {
                    return args[0].proto;
                }
            }
        )
    );

    TLObject.addProperty(
        "is",
        this.newNativeFunction("is", 2, function (vm, args, thisObj) {
            let type1 = args[0].type;
            let type2 = args[1].type;

            if (type1 !== type2) {
                return vm.runtime.JSFalse;
            }

            switch (type1) {
                case JSType.NULL:
                case JSType.UNDEFINED:
                    return vm.runtime.JSTrue;
                case JSType.NUMBER:
                case JSType.BOOLEAN:
                case JSType.STRING:
                    return args[0].value === args[1].value
                        ? vm.runtime.JSTrue
                        : vm.runtime.JSFalse;
                default:
                    return Object.is(args[0], args[1])
                        ? vm.runtime.JSTrue
                        : vm.runtime.JSFalse;
            }
        })
    );

    TLObject.addProperty(
        "create",
        this.newNativeFunction("create", 1, function (vm, args, thisObj) {
            let newObj = vm.runtime.newEmptyObject();
            let proto = args[0];
            if (proto.type !== JSType.OBJECT && proto.type !== JSType.NULL) {
                vm.panic(
                    "Object prototype may only be an Object or null: " +
                        toString(proto)
                );
            }
            newObj.proto = args[0];
            return newObj;
        })
    );

    TLObject.addProperty(
        "assign",
        this.newNativeFunction("assign", 2, function (vm, args, thisObj) {
            if (
                args[0].objectType !== JSObjectType.ORDINARY ||
                args[1].objectType !== JSObjectType.ORDINARY
            ) {
                vm.panic(
                    "Both arguments to Object.assign must be objects in thislang."
                );
            }

            let target = args[0];
            let source = args[1];
            // copy indexed values
            let sourceShapeTable = source.shape.shapeTable;
            let sourceIndexedKeys = Object.keys(sourceShapeTable);
            let key;
            let index;
            for (let i = 0; i < sourceIndexedKeys.length; i++) {
                key = sourceIndexedKeys[i];
                index = sourceShapeTable[key];
                target.addProperty(key, source.indexedValues[index]);
            }
            // copy mapped values
            let sourceMappedKeys = Object.keys(source.mappedValues);
            for (let i = 0; i < sourceMappedKeys.length; i++) {
                key = sourceMappedKeys[i];
                target.mappedValues[key] = source.mappedValues[key];
            }

            return target;
        })
    );

    TLObject.addProperty(
        "keys",
        this.newNativeFunction("keys", 1, function (vm, args, thisObj) {
            let object = args[0];

            if (object.objectType !== JSObjectType.ORDINARY) {
                vm.panic(
                    "Argument to Object.assign must be an object in thislang."
                );
            }

            let keys = Object.keys(object.shape.shapeTable).map(function (k) {
                return vm.runtime.newString(k);
            });

            let mappedKeys = Object.keys(object.mappedValues);
            for (let i = 0; i < mappedKeys.length; i++) {
                keys.push(vm.runtime.newString(mappedKeys[i]));
            }

            return vm.runtime.newArray(keys);
        })
    );

    env.add("Object", TLObject);
    //--------------------------------------------------
    // Number
    //--------------------------------------------------
    let TLNumber = this.newNativeFunction(
        "Number",
        0,
        function (vm, args, thisObj) {
            if (args.length === 0) {
                return vm.runtime.newNumber(0);
            } else {
                return vm.runtime.newNumber(Number(args[0].value));
            }
        }
    );

    env.add("Number", TLNumber);
    //--------------------------------------------------
    // Boolean
    //--------------------------------------------------
    let TLBoolean = this.newNativeFunction(
        "Boolean",
        1,
        function (vm, args, thisObj) {
            return vm.isTruthy(args[0]);
        }
    );

    env.add("Boolean", TLBoolean);
    //--------------------------------------------------
    // Array
    //--------------------------------------------------
    let TLArray = this.newNativeFunction(
        "Array",
        0,
        function (vm, args, thisObj) {
            return vm.runtime.newArray(args);
        }
    );

    TLArray.addProperty(
        "from",
        this.newNativeFunction("from", 1, function (vm, args, thisObj) {
            if (args[0].objectType !== JSObjectType.ARRAY) {
                vm.panic(
                    "Argument to Array.from has to be another array in thislang."
                );
            }
            return vm.runtime.newArray(Array.from(args[0].elements));
        })
    );

    env.add("Array", TLArray);
    //--------------------------------------------------
    // String
    //--------------------------------------------------
    let TLString = this.newNativeFunction(
        "String",
        0,
        function (vm, args, thisObj) {
            if (args.length === 0) {
                return vm.runtime.newString("");
            } else {
                return vm.runtime.newString(toString(args[0]));
            }
        }
    );

    env.add("String", TLString);

    return env;
};

Runtime.prototype.cloneObject = function (object) {
    let clonedObject = this.newEmptyObject();
    clonedObject.indexedValues = Array.from(object.indexedValues);
    clonedObject.shape = object.shape;
    clonedObject.proto = object.proto;
    clonedObject.mappedValues = Object.assign({}, object.mappedValues);

    return clonedObject;
};

//------------------------------------------------------------------
// Runtime - NativeFunction
//------------------------------------------------------------------

function NativeFunction(name, arity, callFn) {
    // function name
    this.name = name;
    // number of parameters
    this.arity = arity;
    // function
    this.callFn = callFn;
    // bound args
    this.boundThis = null;
    this.boundArgs = [];
}

NativeFunction.prototype.clone = function () {
    let clonedFun = new NativeFunction(this.name, this.arity, this.callFn);
    clonedFun.boundThis = this.boundThis;
    clonedFun.boundArgs = Array.from(this.boundArgs);
};

//------------------------------------------------------------------
// Runtime - VMFunction
//------------------------------------------------------------------

function VMFunction(name, arity) {
    // function name
    this.name = name;
    // number of parameters
    this.arity = arity;
    // bytecode associated with this function
    this.code = [];
    // constants associated with this function
    this.constants = [];
    // upvars
    this.upvars = [];
    this.upvarCount = 0;
    // bound args
    this.boundThis = null;
    this.boundArgs = [];
}

VMFunction.prototype.clone = function () {
    let clonedFun = new VMFunction(this.name, this.arity);
    clonedFun.code = Array.from(this.code);
    clonedFun.constants = this.constants;
    clonedFun.upvars = this.upvars;
    clonedFun.upvarCount = this.upvarCount;
    clonedFun.boundThis = this.boundThis;
    clonedFun.boundArgs = Array.from(this.boundArgs);

    return clonedFun;
};

//------------------------------------------------------------------
// Runtime - Inline Cache
//------------------------------------------------------------------

function InlineCache() {
    this.cache = {};
    this.freed = [];
    // start at 1 since 0 is used by compiler to indicate
    // no IC
    this.i = 1;
}

InlineCache.prototype.addShape = function (shape) {
    // TOOD: use freed if available
    // TODO: use array for cache instead
    this.cache[this.i] = shape;
    shape.cacheIdx = this.i;
    return this.i++;
};

InlineCache.prototype.getShape = function (key) {
    return this.cache[key];
};

//==================================================================
// Compiler
//==================================================================

/** Bytecode Compiler */
function Compiler(runtime) {
    this.runtime = runtime;
    this.function = new VMFunction("<script>", 0);
    this.scopeDepth = 0;
    // the first entry has no name since `arguments` is not defined
    // at the top level
    this.locals = [
        { name: "", depth: 0, isCaptured: false, ready: true },
        { name: "this", depth: 0, isCaptured: false, ready: true },
    ];
    this.upvars = [];
    this.localsStack = [];
    this.upvarsStack = [];
    // anonymous function counter
    this.anonCount = 0;
    // breaks stack
    this.breaksStack = [];
    // continue stack
    this.continueStack = [];
}

Compiler.prototype.compile = function (ast) {
    for (let i = 0; i < ast.body.length; i++) {
        this.stmtOrDclr(ast.body[i]);
    }

    return this.function;
};

Compiler.prototype.stmtOrDclr = function (ast) {
    switch (ast.type) {
        case AstType.EXPRESSION_STMT:
        case AstType.IF_STMT:
        case AstType.BLOCK_STMT:
        case AstType.SWITCH_STMT:
        case AstType.WHILE_STMT:
        case AstType.RETURN_STMT:
        case AstType.BREAK_STMT:
        case AstType.EMPTY_STMT:
        case AstType.TRY_STMT:
        case AstType.THROW_STMT:
        case AstType.FOR_STMT:
        case AstType.CONTINUE_STMT:
            return this.statement(ast);
        case AstType.LET_DCLR:
            return this.letDclr(ast);
        case AstType.FUNCTION_DCLR:
            return this.functionDclr(ast);
        default:
            this.panic(ast.type);
    }
};

Compiler.prototype.statement = function (ast) {
    switch (ast.type) {
        case AstType.EXPRESSION_STMT:
            return this.expressionStmt(ast);
        case AstType.IF_STMT:
            return this.ifStmt(ast);
        case AstType.BLOCK_STMT:
            this.beginScope();
            this.blockStmt(ast);
            this.endScope();
            return;
        case AstType.SWITCH_STMT:
            this.beginScope();
            this.switchStmt(ast);
            this.endScope();
            return;
        case AstType.WHILE_STMT:
            this.beginScope();
            this.whileStmt(ast);
            this.endScope();
            return;
        case AstType.RETURN_STMT:
            return this.returnStmt(ast);
        case AstType.BREAK_STMT:
            return this.breakStmt();
        case AstType.EMPTY_STMT:
            break;
        case AstType.TRY_STMT:
            return this.tryStmt(ast);
        case AstType.THROW_STMT:
            return this.throwStmt(ast);
        case AstType.FOR_STMT:
            this.beginScope();
            this.forStmt(ast);
            this.endScope();
            return;
        case AstType.CONTINUE_STMT:
            return this.continueStmt();
        default:
            this.panic(ast.type);
    }
};

Compiler.prototype.continueStmt = function () {
    let jumpIdx = this.emitJump(Opcodes.JUMP);
    // store jumpIdx in the last slot (replacing the placeholder)
    this.continueStack[this.continueStack.length - 1] = jumpIdx;
};

Compiler.prototype.forStmt = function (ast) {
    // start a new breaks stack
    this.breaksStack.push([]);
    // push placeholder on continue stack
    this.continueStack.push(null);
    // compile initializer
    this.stmtOrDclr(ast.init);
    // record next position for looping
    let loopStart = this.function.code.length;
    // compile test
    this.expression(ast.test);
    // jump if not equal
    let jumpIdx = this.emitJump(Opcodes.JUMP_IF_FALSE);
    // compile body
    this.statement(ast.body);
    // patch continue (if any)
    this.patchContinue();
    // compile update
    this.expression(ast.update);
    this.emitByte(Opcodes.POP);
    // loop back
    this.emitLoop(loopStart);
    // patch jump
    this.patchJump(jumpIdx);
    // patch breaks
    this.patchBreaks();
};

Compiler.prototype.throwStmt = function (ast) {
    // compile argument and emit opcode
    this.expression(ast.argument);
    this.emitByte(Opcodes.THROW);
};

Compiler.prototype.tryStmt = function (ast) {
    // push try-catch sentinel
    let catchIdx = this.emitJump(Opcodes.PUSH_TRY_CATCH);
    // compile try block
    this.statement(ast.block);
    // pop sentinel
    this.emitByte(Opcodes.POP_TRY_CATCH);
    // skip catch if no error was thrown
    let jumpIdx = this.emitJump(Opcodes.JUMP);
    // begin catch block scope
    this.beginScope();
    // register catch param
    this.declareLocal(ast.handler.param.value);
    this.markReady();
    // patch catch jump
    this.patchJump(catchIdx);
    // compile catch block
    this.blockStmt(ast.handler.block);
    // end catch block scope
    this.endScope();
    // patch jump
    this.patchJump(jumpIdx);
};

Compiler.prototype.breakStmt = function () {
    let breakIdx = this.emitJump(Opcodes.JUMP);
    this.breaksStack[this.breaksStack.length - 1].push(breakIdx);
};

Compiler.prototype.returnStmt = function (ast) {
    if (ast.argument === null) {
        this.emitByte(Opcodes.PUSH_UNDEFINED);
    } else {
        this.expression(ast.argument);
    }

    this.emitByte(Opcodes.RETURN);
};

Compiler.prototype.functionDclr = function (ast) {
    let name = ast.id.value;
    // compile function
    this.functionExpr(ast);
    // add function to environment
    let index = this.addConstant(name);
    this.emitBytes([Opcodes.SET_FROM_ENV, index]);
    // pop function off the stack
    this.emitByte(Opcodes.POP);
};

Compiler.prototype.whileStmt = function (ast) {
    // start a new breaks stack
    this.breaksStack.push([]);
    // push placeholder on continue stack
    this.continueStack.push(null);
    // record next position for looping
    let loopStart = this.function.code.length;
    // compile test
    this.expression(ast.test);
    // jump if not equal
    let jumpIdx = this.emitJump(Opcodes.JUMP_IF_FALSE);
    // compile body
    this.statement(ast.body);
    // patch continue (if any)
    this.patchContinue();
    // loop back
    this.emitLoop(loopStart);
    // patch jump
    this.patchJump(jumpIdx);
    // patch breaks
    this.patchBreaks();
};

Compiler.prototype.statementList = function (statements) {
    for (let i = 0; i < statements.length; i++) {
        this.stmtOrDclr(statements[i]);
    }
};

Compiler.prototype.switchStmt = function (ast) {
    // start a new breaks stack
    this.breaksStack.push([]);
    // compile the discriminant
    this.expression(ast.discriminant);

    let jumpIdxs = [];

    // compile the case tests
    for (let i = 0; i < ast.cases.length; i++) {
        if (ast.cases[i].test !== null) {
            // duplicate stack top as it will be popped for comparison
            this.emitByte(Opcodes.DUPLICATE);
            // compile test
            this.expression(ast.cases[i].test);
            // compare test
            this.emitByte(Opcodes.CMP_EQ);
            // jump if equal
            jumpIdxs.push(this.emitJump(Opcodes.JUMP_IF_TRUE));
        } else {
            // unconditional jump
            jumpIdxs.push(this.emitJump(Opcodes.JUMP));
        }
    }

    for (let i = 0; i < ast.cases.length; i++) {
        // patch jump
        this.patchJump(jumpIdxs[i]);
        // compile case body
        this.statementList(ast.cases[i].consequent);
    }

    // pop the discriminant
    this.emitByte(Opcodes.POP);
    // patch breaks
    this.patchBreaks();
};

Compiler.prototype.letDclr = function (ast) {
    // add name to current scope
    this.declareLocal(ast.id.value);

    // compile initializer
    if (ast.init !== null) {
        this.expression(ast.init);
    } else {
        this.emitByte(Opcodes.PUSH_UNDEFINED);
    }
    // mark variable ready for access
    this.markReady();
};

/**
 * Declares the local variable. Check if name already exists
 * within current scope and if not, add it to current locals array.
 *
 * Thilang deviates from JS here. Let declarations are not
 * hoisted and don't have a Temporal Dead Zone (TDZ)
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz
 */
Compiler.prototype.declareLocal = function (name) {
    let local;
    // check if name already declared within current scope
    for (let i = this.locals.length - 1; i >= 0; i--) {
        local = this.locals[i];
        // if we've moved too far up, break
        if (local.depth < this.scopeDepth && local.ready) {
            break;
        }

        if (local.name === name) {
            this.panic("Identifier " + name + " has already been declared.");
        }
    }

    // add local variable to current scope
    this.addLocal(name);
};

Compiler.prototype.addLocal = function (name) {
    if (this.locals.length === 256) {
        this.panic("Too many locals.");
    }

    this.locals.push({
        name: name,
        depth: this.scopeDepth,
        isCaptured: false,
        ready: false,
    });
};

/**
 * Mark the local variable as ready to be read from. We do this after
 * compiling the variables initialization to avoid situations like
 * `let x = x` where `x` doesn't exist in an outer scope.
 */
Compiler.prototype.markReady = function () {
    this.locals[this.locals.length - 1].ready = true;
};

Compiler.prototype.blockStmt = function (ast) {
    let body = ast.body;

    for (let i = 0; i < body.length; i++) {
        this.stmtOrDclr(body[i]);
    }
};

Compiler.prototype.ifStmt = function (ast) {
    // compile the test
    this.expression(ast.test);
    // skip ahead if test fails (placeholder)
    let elseIdx = this.emitJump(Opcodes.JUMP_IF_FALSE);
    // compile then
    this.statement(ast.consequent);
    // skip the `else` part if test didn't fail
    let thenIdx = this.emitJump(Opcodes.JUMP);
    // we now know where exactly the `else` jump
    // should take us so we patch it
    this.patchJump(elseIdx);

    if (ast.alternate !== null) {
        // compile else
        this.statement(ast.alternate);
    }
    // we now know where the `then` jump
    // should take us so we patch it
    this.patchJump(thenIdx);
};

Compiler.prototype.patchJump = function (idx) {
    let jump = this.function.code.length - idx - 2;

    this.function.code[idx] = (jump >> 8) & 0xff;
    this.function.code[idx + 1] = jump & 0xff;
};

Compiler.prototype.expressionStmt = function (ast) {
    // compile the expression
    this.expression(ast.expression);
    // pop the last value off the stack as statements should leave
    // the stack clean at the end
    this.emitByte(Opcodes.POP);
};

Compiler.prototype.expression = function (ast) {
    switch (ast.type) {
        case AstType.STRING:
            return this.string(ast);
        case AstType.NUMBER:
            return this.number(ast);
        case AstType.BOOLEAN:
            return this.boolean(ast);
        case AstType.NULL:
            return this.emitByte(Opcodes.PUSH_NULL);
        case AstType.THIS:
            return this.emitByte(Opcodes.PUSH_THIS);
        case AstType.OBJECT:
            return this.object(ast);
        case AstType.ARRAY:
            return this.array(ast);
        case AstType.BINARY_EXPR:
            return this.binary(ast);
        case AstType.STATIC_MEMBER_EXPR:
            return this.staticMemberExpr(ast);
        case AstType.IDENTIFIER:
            return this.identifier(ast);
        case AstType.ASSIGNMENT_EXPR:
            return this.assignmentExpr(ast);
        case AstType.UPDATE_EXPR:
            return this.updateExpr(ast);
        case AstType.FUNCTION_EXPR:
            return this.functionExpr(ast);
        case AstType.CALL_EXPR:
            return this.callExpr(ast);
        case AstType.COMPUTED_MEMBER_EXPR:
            return this.computedMemberExpr(ast);
        case AstType.SEQUENCE_EXPR:
            return this.sequenceExpr(ast);
        case AstType.NEW_EXPR:
            return this.newExpr(ast);
        case AstType.SPREAD:
            return this.spreadExpr(ast);
        case AstType.UNARY_EXPR:
            return this.unaryExpr(ast);
        case AstType.CONDITIONAL_EXPR:
            return this.conditionalExpr(ast);
        default:
            this.panic("in expression");
    }
};

Compiler.prototype.conditionalExpr = function (ast) {
    // compile test
    this.expression(ast.test);
    // emit else jump (jump if test fails)
    let elseIdx = this.emitJump(Opcodes.JUMP_IF_FALSE);
    // compile consequent
    this.expression(ast.consequent);
    // emit jump (skip else branch if test had succeeded)
    let jumpIdx = this.emitJump(Opcodes.JUMP);
    // patch else jump
    this.patchJump(elseIdx);
    // compile alternative
    this.expression(ast.alternate);
    // patch jump
    this.patchJump(jumpIdx);
};

Compiler.prototype.unaryExpr = function (ast) {
    // compile argument
    this.expression(ast.argument);
    // emit opcode
    switch (ast.operator) {
        case "!":
            this.emitByte(Opcodes.NOT);
            break;
        case "typeof":
            this.emitByte(Opcodes.TYPEOF);
            break;
        case "-":
            this.emitByte(Opcodes.NEGATE);
            break;
        default:
            this.panic("Illegal unary operator.");
    }
};

Compiler.prototype.spreadExpr = function (ast) {
    // compile argument
    this.expression(ast.argument);
    // emit opcode
    this.emitByte(Opcodes.SPREAD);
};

Compiler.prototype.newExpr = function (ast) {
    let callee = ast.callee;
    // compile callee
    this.expression(callee);
    // duplication is needed to account for stack slots
    // for storing `arguments` and `this`
    this.emitByte(Opcodes.DUPLICATE);

    let numArgs = ast.arguments.length;

    if (numArgs > UINT8_MAX) {
        this.panic("Too many arguments to function");
    }

    // compile arguments
    for (let i = 0; i < numArgs; i++) {
        this.expression(ast.arguments[i]);
    }

    this.emitBytes([Opcodes.CALL_CONSTRUCTOR, numArgs]);
};

Compiler.prototype.sequenceExpr = function (ast) {
    let expressions = ast.expressions;

    for (let i = 0; i < expressions.length; i++) {
        this.expression(expressions[i]);
        if (i < expressions.length - 1) {
            this.emitByte(Opcodes.POP);
        }
    }
};

Compiler.prototype.computedMemberExpr = function (ast) {
    // compile object
    this.expression(ast.object);
    // compile property value
    this.expression(ast.property);
    // emit opcode
    this.emitByte(Opcodes.GET_BY_VALUE);
};

Compiler.prototype.callExpr = function (ast) {
    let callee = ast.callee;

    switch (callee.type) {
        case AstType.STATIC_MEMBER_EXPR:
            // compile object
            this.expression(callee.object);
            // duplicate object
            this.emitByte(Opcodes.DUPLICATE);
            // emit get opcode
            this.staticMemberProperty(Opcodes.GET_BY_ID, callee.property);
            break;
        case AstType.COMPUTED_MEMBER_EXPR:
            // compile object
            this.expression(callee.object);
            // duplicate object
            this.emitByte(Opcodes.DUPLICATE);
            // compile property value
            this.expression(callee.property);
            // emit opcode
            this.emitByte(Opcodes.GET_BY_VALUE);
            break;
        default:
            // compile callee
            this.expression(callee);
            // duplication is needed to account for an extra stack
            // slot where the `arguments` array will be stored
            this.emitByte(Opcodes.DUPLICATE);
    }

    // compile arguments
    let numArgs = ast.arguments.length;

    if (numArgs > UINT8_MAX) {
        this.panic("Too many arguments to function");
    }

    for (let i = 0; i < numArgs; i++) {
        this.expression(ast.arguments[i]);
    }
    // emit function or method call opcode
    switch (callee.type) {
        case AstType.STATIC_MEMBER_EXPR:
        case AstType.COMPUTED_MEMBER_EXPR:
            this.emitBytes([Opcodes.CALL_METHOD, numArgs]);
            break;
        default:
            this.emitBytes([Opcodes.CALL_FUNCTION, numArgs]);
    }
};

Compiler.prototype.functionExpr = function (ast) {
    function compileFn(ast) {
        this.beginScope();
        // compile parameters
        this.parameters(ast.params);
        // compile function body
        this.block(ast.body);
    }

    let name = ast.id !== null ? ast.id.value : this.nextAnon();

    // compile function
    let vmFun = this.withFunctionCtx(
        name,
        ast.params.length,
        compileFn.bind(this, ast)
    );

    vmFun.upvarCount = this.upvars.length;

    let fun = this.runtime.newFunction(vmFun);
    // emit function creation opcode
    this.emitFunction(fun);

    let upvar;
    for (let i = 0; i < this.upvars.length; i++) {
        upvar = this.upvars[i];
        this.emitByte(upvar.isLocal ? 0x01 : 0x00);
        this.emitByte(upvar.index);
    }

    this.upvars = this.upvarsStack.pop();
};

Compiler.prototype.nextAnon = function () {
    let id = this.anonCount++;
    return "<anonymous " + id + ">";
};

Compiler.prototype.block = function (statements) {
    for (let i = 0; i < statements.length; i++) {
        this.stmtOrDclr(statements[i]);
    }
};

Compiler.prototype.parameters = function (params) {
    for (let i = 0; i < params.length; i++) {
        this.declareLocal(params[i].value);
        this.markReady();
    }
};

Compiler.prototype.updateExpr = function (ast) {
    if (ast.prefix) {
        // push 1
        this.emitBytes([Opcodes.PUSH_INT, 1]);
        // get variable
        this.expression(ast.argument);
        // add/sub one to/from it
        if (ast.operator === "++") {
            this.emitByte(Opcodes.ADD);
        } else {
            this.emitByte(Opcodes.SUB);
        }
        // set variable
        this.setLeftHandSideExpr(ast.argument);
    } else {
        // get variable
        this.expression(ast.argument);
        // duplicate
        this.emitByte(Opcodes.DUPLICATE);
        // push 1
        this.emitBytes([Opcodes.PUSH_INT, 1]);
        // swap so they are in the right order
        this.emitByte(Opcodes.SWAP_TOP_TWO);
        // add/sub one to/from it
        if (ast.operator === "++") {
            this.emitByte(Opcodes.ADD);
        } else {
            this.emitByte(Opcodes.SUB);
        }
        // set variable
        this.setLeftHandSideExpr(ast.argument);
        this.emitByte(Opcodes.POP);
    }
};

Compiler.prototype.assignmentExpr = function (ast) {
    // compile rhs
    this.expression(ast.right);

    // compile lhs and emit opcode if binary operator
    switch (ast.operator) {
        case "+=":
            this.expression(ast.left);
            this.emitByte(Opcodes.ADD);
            break;
        case "-=":
            this.expression(ast.left);
            this.emitByte(Opcodes.SUB);
            break;
        case "*=":
            this.expression(ast.left);
            this.emitByte(Opcodes.MUL);
            break;
        case "/=":
            this.expression(ast.left);
            this.emitByte(Opcodes.DIV);
            break;
        case "%=":
            this.expression(ast.left);
            this.emitByte(Opcodes.MOD);
            break;
    }
    // emit set opcode
    this.setLeftHandSideExpr(ast.left);
};

Compiler.prototype.setLeftHandSideExpr = function (ast) {
    if (ast.type === AstType.IDENTIFIER) {
        this.getOrSetId(ast.value, false);
    } else if (ast.type === AstType.STATIC_MEMBER_EXPR) {
        // compile object
        this.expression(ast.object);
        // add property name to constants
        this.staticMemberProperty(Opcodes.SET_BY_ID, ast.property);
    } else if (ast.type === AstType.COMPUTED_MEMBER_EXPR) {
        // compile object
        this.expression(ast.object);
        // compile property name
        this.expression(ast.property);
        // emit opcode
        this.emitByte(Opcodes.SET_BY_VALUE);
    } else {
        this.panic("Invalid LeftHandSide expression.");
    }
};

Compiler.prototype.identifier = function (ast) {
    this.getOrSetId(ast.value, true);
};

Compiler.prototype.getOrSetId = function (name, getOp) {
    let idx;

    if ((idx = this.resolveLocal(name)) !== null) {
        // statically resolved local variable
        if (getOp) {
            this.emitBytes([Opcodes.GET_LOCAL, idx]);
        } else {
            this.emitBytes([Opcodes.SET_LOCAL, idx]);
        }
    } else if (
        (idx = this.resolveUpvar(
            name,
            this.upvars,
            this.localsStack.length - 1
        )) !== null
    ) {
        // statically resolved upvar
        if (getOp) {
            this.emitBytes([Opcodes.GET_UPVAR, idx]);
        } else {
            this.emitBytes([Opcodes.SET_UPVAR, idx]);
        }
    } else {
        // global variable
        idx = this.addConstant(name);
        // dynamically resolved env variable
        if (getOp) {
            this.emitBytes([Opcodes.GET_FROM_ENV, idx]);
        } else {
            this.emitBytes([Opcodes.SET_FROM_ENV, idx]);
        }
    }
};

Compiler.prototype.resolveUpvar = function (name, upvars, idx) {
    if (idx < 0) {
        return null;
    }

    let locals = this.localsStack[idx];
    let index = this.resolveLocalWith(name, locals);

    if (index !== null) {
        locals[index].isCaptured = true;
        return this.addUpvar(upvars, index, true);
    }

    index = this.resolveUpvar.call(this, name, this.upvarsStack[idx], idx - 1);

    if (index !== null) {
        return this.addUpvar(upvars, index, false);
    }

    return null;
};

Compiler.prototype.addUpvar = function (upvars, index, isLocal) {
    // see if it's already captured
    let upvar;
    for (let i = 0; i < upvars.length; i++) {
        upvar = upvars[i];
        if (upvar.index === index && upvar.isLocal === isLocal) {
            return i;
        }
    }

    upvars.push({ index: index, isLocal: isLocal });
    return upvars.length - 1;
};

Compiler.prototype.resolveLocalWith = function (name, locals) {
    let local;
    for (let idx = locals.length - 1; idx >= 0; idx--) {
        local = locals[idx];

        if (local.name === name) {
            if (!local.ready) {
                this.panic("Cannot access " + name + " before initialization.");
            }
            return idx;
        }
    }

    return null;
};

Compiler.prototype.resolveLocal = function (name) {
    return this.resolveLocalWith(name, this.locals);
};

Compiler.prototype.staticMemberExpr = function (ast) {
    // compile lhs of `.`
    this.expression(ast.object);
    // emit property
    this.staticMemberProperty(Opcodes.GET_BY_ID, ast.property);
};

Compiler.prototype.staticMemberProperty = function (opcode, property) {
    // emit opcode
    this.emitByte(opcode);
    // emit constant index of property id
    let index = this.addConstant(this.runtime.newString(property));
    this.emitByte(index);
    // ------ Inline cache info ----------
    // TODO: handle 8 bit limit for IC
    // emit shape id
    this.emitByte(0x00);
    // emit value offset
    this.emitByte(0x00);
};

Compiler.prototype.array = function (ast) {
    // iterate over elements and visit
    let elements = ast.elements;
    let numElements = elements.length;

    // iterate in reverse order to cancel out LIFO
    for (let i = numElements - 1; i >= 0; i--) {
        // compile element
        this.expression(elements[i]);
    }

    // add numElements to constant table
    let index = this.addConstant(numElements);
    // emit opcode to create the array
    this.emitBytes([Opcodes.NEW_ARRAY, index]);
};

Compiler.prototype.object = function (ast) {
    // iterate over properties and for each property:
    // 1. visit the value
    // 2. push the property name
    let properties = ast.properties;
    let numProperties = properties.length;

    let property;
    // iterate in reverse order to cancel out LIFO
    for (let i = numProperties - 1; i >= 0; i--) {
        property = properties[i];
        // compile property value
        this.expression(property.value);
        // push name on top of stack
        this.emitPushConstant(String(property.name.value));
    }

    // add numProperties to constant table
    let index = this.addConstant(numProperties);
    // emit opcode to create the object
    this.emitBytes([Opcodes.NEW_OBJECT, index]);
};

Compiler.prototype.binary = function (ast) {
    switch (ast.operator) {
        case "+":
            return this.compileArgsAndEmit(ast, Opcodes.ADD);
        case "-":
            return this.compileArgsAndEmit(ast, Opcodes.SUB);
        case "*":
            return this.compileArgsAndEmit(ast, Opcodes.MUL);
        case "/":
            return this.compileArgsAndEmit(ast, Opcodes.DIV);
        case "<":
            return this.compileArgsAndEmit(ast, Opcodes.CMP_LT);
        case "<=":
            return this.compileArgsAndEmit(ast, Opcodes.CMP_LEQ);
        case ">":
            return this.compileArgsAndEmit(ast, Opcodes.CMP_GT);
        case ">=":
            return this.compileArgsAndEmit(ast, Opcodes.CMP_GEQ);
        case "==":
        case "===":
            return this.compileArgsAndEmit(ast, Opcodes.CMP_EQ);
        case "!=":
        case "!==":
            return this.compileArgsAndEmit(ast, Opcodes.CMP_NEQ);
        case "||":
            return this.logicalOr(ast);
        case "&&":
            return this.logicalAnd(ast);
        case "|":
            return this.compileArgsAndEmit(ast, Opcodes.OR);
        case "&":
            return this.compileArgsAndEmit(ast, Opcodes.AND);
        case "^":
            return this.compileArgsAndEmit(ast, Opcodes.XOR);
        case "%":
            return this.compileArgsAndEmit(ast, Opcodes.MOD);
        case "instanceof":
            return this.compileArgsAndEmit(ast, Opcodes.INSTANCEOF);
        default:
            this.panic("Invalid binary operator " + ast.operator);
    }
};

Compiler.prototype.logicalAnd = function (ast) {
    // compile LHS
    this.expression(ast.lhs);
    // jump to end if false
    this.emitByte(Opcodes.DUPLICATE);
    let jumpIdx = this.emitJump(Opcodes.JUMP_IF_FALSE);
    // pop off LHS and compile RHS
    this.emitByte(Opcodes.POP);
    this.expression(ast.rhs);
    // patch jump
    this.patchJump(jumpIdx);
};

Compiler.prototype.logicalOr = function (ast) {
    // compile LHS
    this.expression(ast.lhs);
    // jump to end if true
    this.emitByte(Opcodes.DUPLICATE);
    let jumpIdx = this.emitJump(Opcodes.JUMP_IF_TRUE);
    // pop off LHS and compile RHS
    this.emitByte(Opcodes.POP);
    this.expression(ast.rhs);
    // patch jump
    this.patchJump(jumpIdx);
};

Compiler.prototype.compileArgsAndEmit = function (ast, opcode) {
    // compile RHS
    this.expression(ast.rhs);
    // compile LHS
    this.expression(ast.lhs);
    // emit opcode
    this.emitByte(opcode);
};

Compiler.prototype.boolean = function (ast) {
    if (ast.value) {
        this.emitByte(Opcodes.PUSH_TRUE);
    } else {
        this.emitByte(Opcodes.PUSH_FALSE);
    }
};

Compiler.prototype.number = function (ast) {
    let value = ast.value;

    if (value < 0xff) {
        this.emitBytes([Opcodes.PUSH_INT, value]);
    } else {
        this.emitPushConstant(this.runtime.newNumber(value));
    }
};

Compiler.prototype.string = function (ast) {
    this.emitPushConstant(this.runtime.newString(ast.value));
};

//------------------------------------------------------------------
// Compiler - utils
//------------------------------------------------------------------

Compiler.prototype.patchContinue = function () {
    let continueIdx;
    if ((continueIdx = this.continueStack.pop()) !== null) {
        this.patchJump(continueIdx);
    }
};

Compiler.prototype.patchBreaks = function () {
    let breaks = this.breaksStack.pop();
    let breakIdx;
    for (let i = 0; i < breaks.length; i++) {
        breakIdx = breaks[i];
        this.patchJump(breakIdx);
    }
};

Compiler.prototype.withFunctionCtx = function (name, arity, compileFn) {
    let scopeDepth = this.scopeDepth;
    let fun = this.function;
    this.localsStack.push(this.locals);
    this.upvarsStack.push(this.upvars);

    this.scopeDepth = 0;
    this.function = new VMFunction(name, arity, fun.env);
    this.locals = [
        { name: "arguments", depth: 0, isCaptured: false, ready: true },
        { name: "this", depth: 0, isCaptured: false, ready: true },
    ];
    this.upvars = [];

    compileFn();

    this.scopeDepth = scopeDepth;
    // this.upvars = this.upvarsStack.pop();
    this.locals = this.localsStack.pop();

    this.emitReturn();

    let newFun = this.function;
    newFun.unvars = this.upvars;
    this.function = fun;

    return newFun;
};

Compiler.prototype.beginScope = function () {
    this.scopeDepth++;
};

Compiler.prototype.endScope = function () {
    this.scopeDepth--;

    let local;
    while (this.locals.length > 0) {
        local = this.locals[this.locals.length - 1];

        if (local.depth > this.scopeDepth && local.ready) {
            if (local.isCaptured) {
                this.emitByte(Opcodes.CLOSE_UPVAR);
            } else {
                this.emitByte(Opcodes.POP);
            }

            this.locals.pop();
        } else {
            break;
        }
    }
};

Compiler.prototype.panic = function (msg) {
    throw Error("compiler panicked on: " + msg);
};

//------------------------------------------------------------------
// Compiler - codegen
//------------------------------------------------------------------

Compiler.prototype.emitReturn = function () {
    this.emitByte(Opcodes.PUSH_UNDEFINED);
    this.emitByte(Opcodes.RETURN);
};

Compiler.prototype.emitFunction = function (fun) {
    let index = this.addConstant(fun);
    this.emitBytes([Opcodes.CREATE_FUNCTION, index]);
};

Compiler.prototype.emitLoop = function (loopStart) {
    this.emitByte(Opcodes.LOOP);

    let offset = this.function.code.length - loopStart + 2;

    this.emitByte((offset >> 8) & 0xff);
    this.emitByte(offset & 0xff);
};

Compiler.prototype.emitJump = function (jumpOpcode) {
    this.emitBytes([jumpOpcode, 0x00, 0x00]);

    return this.function.code.length - 2;
};

Compiler.prototype.emitPushConstant = function (value) {
    // add value to the constant table
    let index = this.addConstant(value);
    // push that value (by retrieving it using the constant idx)
    // onto the stack
    this.emitBytes([Opcodes.PUSH_CONSTANT, index]);
};

/** Adds value to the current function's constants array and returns
 * the index. */
Compiler.prototype.addConstant = function (value) {
    if (this.function.constants.length === MAX_NUM_CONSTANTS) {
        this.panic("Too many constants.");
    }

    this.function.constants.push(value);
    return this.function.constants.length - 1;
};

Compiler.prototype.emitByte = function (byte) {
    this.function.code.push(byte | 0x0);
};

Compiler.prototype.emitBytes = function (bytes) {
    this.function.code.push(...bytes);
};

//==================================================================
// Disassembler
//==================================================================

function simpleInstr(name, state) {
    state.disassembly.push(
        String(state.i).padStart(5, "0") + ":    " + name.padEnd(18, " ")
    );
    state.i++;
}

function constInstr(name, code, constants, state) {
    let idx = code[state.i + 1];
    state.disassembly.push(
        String(state.i).padStart(5, "0") +
            ":    " +
            name.padEnd(18, " ") +
            " " +
            toString(constants[idx])
    );
    state.i += 2;
}

function literalInstr(name, code, state) {
    let idx = code[state.i + 1];
    state.disassembly.push(
        String(state.i).padStart(5, "0") +
            ":    " +
            name.padEnd(18, " ") +
            " " +
            idx
    );
    state.i += 2;
}

function jumpInstr(name, code, state, isLoop) {
    let idx = state.i + 3;
    if (isLoop) {
        idx -= (code[state.i + 1] << 8) | code[state.i + 2];
    } else {
        idx += (code[state.i + 1] << 8) | code[state.i + 2];
    }

    state.disassembly.push(
        String(state.i).padStart(5, "0") +
            ":    " +
            name.padEnd(18, " ") +
            " -> " +
            String(idx).padStart(5, "0")
    );
    state.i += 3;
}

function functionInstr(name, code, constants, state) {
    let idx = code[state.i + 1];
    let fun = constants[idx].vmFunction;

    state.disassembly.push(
        String(state.i).padStart(5, "0") +
            ":    " +
            name.padEnd(18, " ") +
            " " +
            fun.name
    );
    state.i += 2;
    state.i += 2 * fun.upvarCount;

    state.functions.push(fun);
}

function dis(code, constants, name) {
    let state = { i: 0, disassembly: [], functions: [] };

    state.disassembly.push("Code in function " + name + ":");

    while (state.i < code.length) {
        switch (code[state.i]) {
            case Opcodes.POP:
                simpleInstr("POP", state);
                break;
            case Opcodes.PUSH_CONSTANT:
                constInstr("PUSH_CONSTANT", code, constants, state);
                break;
            case Opcodes.PUSH_TRUE:
                simpleInstr("PUSH_TRUE", state);
                break;
            case Opcodes.PUSH_FALSE:
                simpleInstr("PUSH_FALSE", state);
                break;
            case Opcodes.PUSH_NULL:
                simpleInstr("PUSH_NULL", state);
                break;
            case Opcodes.PUSH_THIS:
                simpleInstr("PUSH_THIS", state);
                break;
            case Opcodes.ADD:
                simpleInstr("ADD", state);
                break;
            case Opcodes.SUB:
                simpleInstr("SUB", state);
                break;
            case Opcodes.MUL:
                simpleInstr("MUL", state);
                break;
            case Opcodes.DIV:
                simpleInstr("DIV", state);
                break;
            case Opcodes.NEW_OBJECT:
                constInstr("NEW_OBJECT", code, constants, state);
                break;
            case Opcodes.NEW_ARRAY:
                constInstr("NEW_ARRAY", code, constants, state);
                break;
            case Opcodes.GET_BY_ID:
                constInstr("GET_BY_ID", code, constants, state);
                // skip inline caching details
                state.i += 2;
                break;
            case Opcodes.SET_BY_ID:
                constInstr("SET_BY_ID", code, constants, state);
                // skip inline caching details
                state.i += 2;
                break;
            case Opcodes.GET_BY_VALUE:
                simpleInstr("GET_BY_VALUE", state);
                break;
            case Opcodes.SET_BY_VALUE:
                simpleInstr("SET_BY_VALUE", state);
                break;
            case Opcodes.JUMP_IF_FALSE:
                jumpInstr("JUMP_IF_FALSE", code, state);
                break;
            case Opcodes.JUMP:
                jumpInstr("JUMP", code, state);
                break;
            case Opcodes.PUSH_UNDEFINED:
                simpleInstr("PUSH_UNDEFINED", state);
                break;
            case Opcodes.GET_LOCAL:
                literalInstr("GET_LOCAL", code, state);
                break;
            case Opcodes.GET_FROM_ENV:
                constInstr("GET_FROM_ENV", code, constants, state);
                break;
            case Opcodes.DUPLICATE:
                simpleInstr("DUPLICATE", state);
                break;
            case Opcodes.CMP_EQ:
                simpleInstr("CMP_EQ", state);
                break;
            case Opcodes.JUMP_IF_TRUE:
                jumpInstr("JUMP_IF_TRUE", code, state);
                break;
            case Opcodes.LOOP:
                jumpInstr("LOOP", code, state, true);
                break;
            case Opcodes.PUSH_INT:
                literalInstr("PUSH_INT", code, state);
                break;
            case Opcodes.SET_LOCAL:
                literalInstr("SET_LOCAL", code, state);
                break;
            case Opcodes.SET_FROM_ENV:
                constInstr("SET_FROM_ENV", code, constants, state);
                break;
            case Opcodes.SWAP_TOP_TWO:
                simpleInstr("SWAP_TOP_TWO", state);
                break;
            case Opcodes.CMP_LT:
                simpleInstr("CMP_LT", state);
                break;
            case Opcodes.CMP_LEQ:
                simpleInstr("CMP_LEQ", state);
                break;
            case Opcodes.CMP_GT:
                simpleInstr("CMP_GT", state);
                break;
            case Opcodes.CMP_GEQ:
                simpleInstr("CMP_GEQ", state);
                break;
            case Opcodes.CMP_NEQ:
                simpleInstr("CMP_NEQ", state);
                break;
            case Opcodes.CREATE_FUNCTION:
                functionInstr("CREATE_FUNCTION", code, constants, state);
                break;
            case Opcodes.RETURN:
                simpleInstr("RETURN", state);
                break;
            case Opcodes.CALL_FUNCTION:
                literalInstr("CALL_FUNCTION", code, state);
                break;
            case Opcodes.CALL_METHOD:
                literalInstr("CALL_METHOD", code, state);
                break;
            case Opcodes.CALL_CONSTRUCTOR:
                literalInstr("CALL_CONSTRUCTOR", code, state);
                break;
            case Opcodes.GET_UPVAR:
                literalInstr("GET_UPVAR", code, state);
                break;
            case Opcodes.SET_UPVAR:
                literalInstr("SET_UPVAR", code, state);
                break;
            case Opcodes.CLOSE_UPVAR:
                simpleInstr("CLOSE_UPVAR", state);
                break;
            case Opcodes.SPREAD:
                simpleInstr("SPREAD", state);
                break;
            case Opcodes.OR:
                simpleInstr("OR", state);
                break;
            case Opcodes.AND:
                simpleInstr("AND", state);
                break;
            case Opcodes.XOR:
                simpleInstr("XOR", state);
                break;
            case Opcodes.MOD:
                simpleInstr("MOD", state);
                break;
            case Opcodes.NOT:
                simpleInstr("NOT", state);
                break;
            case Opcodes.TYPEOF:
                simpleInstr("TYPEOF", state);
                break;
            case Opcodes.NEGATE:
                simpleInstr("NEGATE", state);
                break;
            case Opcodes.INSTANCEOF:
                simpleInstr("INSTANCEOF", state);
                break;
            case Opcodes.PUSH_TRY_CATCH:
                jumpInstr("PUSH_TRY_CATCH", code, state);
                break;
            case Opcodes.POP_TRY_CATCH:
                simpleInstr("POP_TRY_CATCH", state);
                break;
            case Opcodes.THROW:
                simpleInstr("THROW", state);
                break;
            default:
                throw Error("Unknown opcode");
        }
    }

    let fun;
    while (state.functions.length > 0) {
        fun = state.functions.pop();
        dis(fun.code, fun.constants, fun.name);
    }

    console.log(state.disassembly.join("\n"));
    console.log("\n");
}

//==================================================================
// VM
//==================================================================

function CallFrame(fun, fp, outerEnv, isConstructor) {
    // function
    this.fun = fun;
    // instruction pointer
    this.ip = 0;
    // frame pointer
    this.fp = fp;
    // environment
    this.env = new Env(outerEnv);
    // new call
    this.isConstructor = isConstructor;
    // try stack
    this.tryStack = [];
}

function Vm(fun, runtime) {
    // stack pointer
    this.sp = 0;
    // stack
    this.stack = initArray(STACK_MAX, 0);
    // runtime
    this.runtime = runtime;
    // IC
    this.inlineCache = new InlineCache();
    // call frames
    let baseFrame = new CallFrame(fun, 0, null, false);
    baseFrame.env = runtime.generateGlobalEnv();
    this.frames = [baseFrame];
    // current function
    this.currentFun = fun;
    // current frame
    this.currentFrame = this.frames[0];

    // push `arguments` on stack slot 0
    this.push(runtime.JSUndefined);
    // push `this` on stack slot 1
    this.push(runtime.newEmptyObject());

    // this.openUpvars = {};
    this.openUpvars = [];

    // run for just one function call
    this.singleFunctionRun = false;
}

/** Run VM */
Vm.prototype.run = function () {
    // main interpreter loop
    while (this.currentFrame.ip < this.currentFun.code.length) {
        switch (this.fetch()) {
            case Opcodes.POP:
                this.pop();
                break;
            case Opcodes.PUSH_CONSTANT:
                this.pushConstant();
                break;
            case Opcodes.PUSH_TRUE:
                this.push(this.runtime.JSTrue);
                break;
            case Opcodes.PUSH_FALSE:
                this.push(this.runtime.JSFalse);
                break;
            case Opcodes.PUSH_NULL:
                this.push(this.runtime.JSNull);
                break;
            case Opcodes.PUSH_THIS:
                this.pushThis();
                break;
            case Opcodes.ADD:
                this.add();
                break;
            case Opcodes.SUB:
                this.sub();
                break;
            case Opcodes.MUL:
                this.mul();
                break;
            case Opcodes.DIV:
                this.div();
                break;
            case Opcodes.NEW_OBJECT:
                this.newObject();
                break;
            case Opcodes.NEW_ARRAY:
                this.newArray();
                break;
            case Opcodes.GET_BY_ID:
                this.getById();
                break;
            case Opcodes.SET_BY_ID:
                this.setById();
                break;
            case Opcodes.GET_BY_VALUE:
                this.getByValue();
                break;
            case Opcodes.SET_BY_VALUE:
                this.setByValue();
                break;
            case Opcodes.JUMP_IF_FALSE:
                this.jump(false, false);
                break;
            case Opcodes.JUMP:
                this.jump(null, true);
                break;
            case Opcodes.PUSH_UNDEFINED:
                this.push(this.runtime.JSUndefined);
                break;
            case Opcodes.GET_LOCAL:
                this.getLocal();
                break;
            case Opcodes.GET_FROM_ENV:
                this.getFromEnv();
                break;
            case Opcodes.DUPLICATE:
                this.push(this.peek());
                break;
            case Opcodes.CMP_EQ:
                this.cmpEq();
                break;
            case Opcodes.JUMP_IF_TRUE:
                this.jump(true, false);
                break;
            case Opcodes.LOOP:
                this.loop();
                break;
            case Opcodes.PUSH_INT:
                this.pushInt();
                break;
            case Opcodes.SET_LOCAL:
                this.setLocal();
                break;
            case Opcodes.SET_FROM_ENV:
                this.setFromEnv();
                break;
            case Opcodes.SWAP_TOP_TWO:
                this.swapTopTwo();
                break;
            case Opcodes.CMP_LT:
                this.cmpLt(true);
                break;
            case Opcodes.CMP_LEQ:
                this.cmpLt(false);
                break;
            case Opcodes.CMP_GT:
                this.cmpGt(true);
                break;
            case Opcodes.CMP_GEQ:
                this.cmpGt(false);
                break;
            case Opcodes.CMP_NEQ:
                this.cmpNeq();
                break;
            case Opcodes.CREATE_FUNCTION:
                this.createFunction();
                break;
            case Opcodes.RETURN:
                if (this.singleFunctionRun) {
                    return this.return();
                } else {
                    this.return();
                    break;
                }
            case Opcodes.CALL_FUNCTION:
                this.callFunction(this.fetch());
                break;
            case Opcodes.CALL_METHOD:
                this.callMethod(this.fetch());
                break;
            case Opcodes.CALL_CONSTRUCTOR:
                this.callConstructor(this.fetch());
                break;
            case Opcodes.GET_UPVAR:
                this.getUpvar();
                break;
            case Opcodes.SET_UPVAR:
                this.setUpvar();
                break;
            case Opcodes.CLOSE_UPVAR:
                this.closeUpvar(this.sp - 1);
                break;
            case Opcodes.SPREAD:
                this.spread();
                break;
            case Opcodes.OR:
                this.or();
                break;
            case Opcodes.AND:
                this.and();
                break;
            case Opcodes.XOR:
                this.xor();
                break;
            case Opcodes.MOD:
                this.mod();
                break;
            case Opcodes.NOT:
                this.not();
                break;
            case Opcodes.TYPEOF:
                this.typeOf();
                break;
            case Opcodes.NEGATE:
                this.negate();
                break;
            case Opcodes.INSTANCEOF:
                this.instanceOf();
                break;
            case Opcodes.PUSH_TRY_CATCH:
                this.pushTryCatch();
                break;
            case Opcodes.POP_TRY_CATCH:
                this.popTryCatch();
                break;
            case Opcodes.THROW:
                this.throw();
                break;
        }
    }
};

//------------------------------------------------------------------
// VM - instructions
//------------------------------------------------------------------

Vm.prototype.throw = function () {
    let trace = [];
    // pop throw value
    let value = this.pop();

    while (true) {
        if (this.currentFrame.tryStack.length > 0) {
            let tryMeta = this.currentFrame.tryStack.pop();
            // clean the stack
            this.sp = tryMeta.sp;
            // push error value
            this.push(value);
            // jump to the catch
            this.currentFrame.ip = tryMeta.ip;
            return;
        }

        trace.push(this.currentFun.name);
        if (this.frames.length > 1) {
            this.popFrame();
        } else {
            break;
        }
    }

    this.stackTrace(value, trace);
};

Vm.prototype.popTryCatch = function () {
    this.currentFrame.tryStack.pop();
};

Vm.prototype.pushTryCatch = function () {
    let jump = (this.fetch() << 8) | this.fetch();
    let catchIp = this.currentFrame.ip + jump;

    this.currentFrame.tryStack.push({ ip: catchIp, sp: this.sp });
};

Vm.prototype.instanceOf = function () {
    let object = this.pop();
    let constructor = this.pop();
    if (
        constructor.objectType !== JSObjectType.FUNCTION &&
        constructor.objectType !== JSObjectType.NATIVE &&
        constructor.objectType !== JSObjectType.BOUND_FUNCTION
    ) {
        this.panic("Right-hand side of `instanceof` is not callable.");
    }

    let prototypeObj =
        constructor.indexedValues[
            constructor.shape.shapeTable["prototype"].offset
        ];

    while (object !== null && object !== undefined) {
        if (object === prototypeObj) {
            return this.push(this.runtime.JSTrue);
        }
        object = object.proto;
    }
    this.push(this.runtime.JSFalse);
};

Vm.prototype.negate = function () {
    let number = this.pop();
    // TODO: typecheck
    this.push(this.runtime.newNumber(-number.value));
};

Vm.prototype.typeOf = function () {
    let value = this.pop();
    switch (value.type) {
        case JSType.NUMBER:
            this.push(this.runtime.newString("number"));
            break;
        case JSType.BOOLEAN:
            this.push(this.runtime.newString("boolean"));
            break;
        case JSType.NULL:
            this.push(this.runtime.newString("object"));
            break;
        case JSType.UNDEFINED:
            this.push(this.runtime.newString("undefined"));
            break;
        case JSType.STRING:
            this.push(this.runtime.newString("string"));
            break;
        case JSType.OBJECT:
            switch (value.objectType) {
                case JSObjectType.FUNCTION:
                case JSObjectType.NATIVE:
                case JSObjectType.BOUND_FUNCTION:
                    this.push(this.runtime.newString("function"));
                    break;
                case JSObjectType.ORDINARY:
                case JSObjectType.ARRAY:
                    this.push(this.runtime.newString("object"));
                    break;
            }
            break;
    }
};

Vm.prototype.not = function () {
    let truthValue = this.isTruthy(this.pop());
    this.push(truthValue ? this.runtime.JSFalse : this.runtime.JSTrue);
};

Vm.prototype.mod = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.mod(rhs, this.runtime));
};

Vm.prototype.xor = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.xor(rhs, this.runtime));
};

Vm.prototype.and = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.and(rhs, this.runtime));
};

Vm.prototype.or = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.or(rhs, this.runtime));
};

Vm.prototype.spread = function () {
    let argument = this.pop();
    if (argument.objectType !== JSObjectType.ARRAY) {
        this.panic("Invalid spread argument type.");
    }
    // push values one by one
    let elements = argument.elements;
    for (let i = 0; i < elements.length; i++) {
        this.push(elements[i]);
    }
    // modify call instruction's arg count
    let code = this.currentFun.code;
    let ip = this.currentFrame.ip;
    let newArgCount = code[ip + 1] + elements.length - 1;

    if (newArgCount > UINT8_MAX) {
        this.panic("Too many arguments.");
    }

    code[ip + 1] = newArgCount;
};

Vm.prototype.closeUpvars = function (last) {
    let upvar;
    let location;
    for (let i = this.openUpvars.length - 1; i >= 0; i--) {
        upvar = this.openUpvars[i];
        location = upvar.location;

        if (location < last) {
            break;
        }

        let value = this.stack[location];
        upvar.value = value;
        this.openUpvars.pop();
    }

    this.pop();
};

Vm.prototype.setUpvar = function () {
    let idx = this.fetch();
    let value = this.peek();
    let upvar = this.currentFun.upvars[idx];

    if (upvar.value !== null) {
        upvar.value = value;
    } else {
        this.stack[upvar.location] = value;
    }
};

Vm.prototype.getUpvar = function () {
    let idx = this.fetch();
    let upvar = this.currentFun.upvars[idx];

    if (upvar.value !== null) {
        this.push(upvar.value);
    } else {
        this.push(this.stack[upvar.location]);
    }
};

Vm.prototype.setFromEnv = function () {
    let id = this.fetchConstant();
    let value = this.peek();

    this.currentFrame.env.add(id, value);
};

Vm.prototype.getFromEnv = function () {
    let id = this.fetchConstant();
    let value = this.currentFrame.env.get(id);

    if (value !== null) {
        this.push(value);
    } else {
        this.panic(id + " is not defined");
    }
};

Vm.prototype.callConstructor = function (numArgs) {
    let idx = this.sp - 1 - numArgs;
    // get callee (JSFunction)
    let callee = this.stack[idx];
    // inner function
    let fun = callee.vmFunction;

    if (
        callee.objectType !== JSObjectType.FUNCTION &&
        callee.objectType !== JSObjectType.NATIVE
    ) {
        this.panic("Not a constructor.");
    }

    let argumentsArray = this.setArgumentsArray(fun, idx, numArgs);

    if (callee.objectType === JSObjectType.FUNCTION) {
        let shapeTable = callee.shape.shapeTable;

        let prototypeObject = this.runtime.newEmptyObject();

        prototypeObject.proto =
            callee.indexedValues[shapeTable["prototype"].offset];

        // set `this` to the prototype object
        this.stack[idx] = prototypeObject;
        // run constructor
        this.initFunctionCall(fun, idx - 1, true);
    } else if (callee.objectType === JSObjectType.NATIVE) {
        let result = callee.vmFunction.callFn(this, argumentsArray);
        // manually handle return
        // first set the sp to what would've been the new fp
        this.sp = idx - 1;
        // push the return value on top of stack
        this.push(result);
    } else {
        this.panic("Value not a constructor.");
    }
};

Vm.prototype.callMethod = function (numArgs) {
    let idx = this.sp - 1 - numArgs;
    // get callee (JSFunction)
    let callee = this.stack[idx];
    // inner function
    let fun = callee.vmFunction;

    if (
        callee.objectType !== JSObjectType.FUNCTION &&
        callee.objectType !== JSObjectType.NATIVE &&
        callee.objectType !== JSObjectType.BOUND_FUNCTION
    ) {
        console.log(callee);
        this.panic("Not a method.");
    }
    // get object from which method was called
    let object = this.stack[idx - 1];

    if (callee.objectType === JSObjectType.FUNCTION) {
        // create and set the `arguments` array
        this.setArgumentsArray(fun, idx, numArgs);
        // set `this` to object
        this.stack[idx] = object;
        this.initFunctionCall(fun, idx - 1, false);
    } else if (callee.objectType === JSObjectType.BOUND_FUNCTION) {
        // fix the stack with bound arguments
        this.setBoundArgumentsArray(fun, idx, numArgs);
        // set `this` to the bound `this` value
        this.stack[idx] = fun.boundThis;
        // call function
        this.initFunctionCall(fun, idx - 1, false);
    } else if (callee.objectType === JSObjectType.NATIVE) {
        // create and set the `arguments` array
        let argumentsArray = this.setArgumentsArray(fun, idx, numArgs);
        // call native function
        let result = callee.vmFunction.callFn(this, argumentsArray, object);
        // manually handle return
        // first set the sp to what would've been the new fp
        this.sp = idx - 1;
        // push the return value on top of stack
        this.push(result);
    } else {
        this.panic("Value not callable.");
    }
};

Vm.prototype.callFunction = function (numArgs) {
    let idx = this.sp - 1 - numArgs;
    // get callee (JSFunction)
    let callee = this.stack[idx];
    // inner function
    let fun = callee.vmFunction;

    if (
        callee.objectType !== JSObjectType.FUNCTION &&
        callee.objectType !== JSObjectType.NATIVE &&
        callee.objectType !== JSObjectType.BOUND_FUNCTION
    ) {
        this.panic("Not a function.");
    }

    if (callee.objectType === JSObjectType.FUNCTION) {
        // create and set the `arguments` array
        this.setArgumentsArray(fun, idx, numArgs);
        // set `this` to undefined
        this.stack[idx] = this.runtime.JSUndefined;
        this.initFunctionCall(fun, idx - 1, false);
    } else if (callee.objectType === JSObjectType.BOUND_FUNCTION) {
        // fix the stack with bound arguments
        this.setBoundArgumentsArray(fun, idx, numArgs);
        // set `this` to the bound `this` value
        this.stack[idx] = fun.boundThis;
        // call function
        this.initFunctionCall(fun, idx - 1, false);
    } else if (callee.objectType === JSObjectType.NATIVE) {
        // create and set the `arguments` array
        let argumentsArray = this.setArgumentsArray(fun, idx, numArgs);
        // call native function
        let result = callee.vmFunction.callFn(
            this,
            argumentsArray,
            this.runtime.JSUndefined
        );
        // manually handle return
        // first set the sp to what would've been the new fp
        this.sp = idx - 1;
        // push the return value on top of stack
        this.push(result);
    } else {
        this.panic("Value not callable.");
    }
};

Vm.prototype.setBoundArgumentsArray = function (fun, idx, numArgs) {
    let allArgs = [];
    // save current arguments on stack
    let argumentsArray = this.stack.slice(this.sp - numArgs, this.sp);
    // modify sp to point to first argument
    this.sp = idx + 1;
    // push bound arguments
    let boundArgs = fun.boundArgs;
    for (let i = 0; i < boundArgs.length; i++) {
        this.push(boundArgs[i]);
        allArgs.push(boundArgs[i]);
    }
    // push provided arguments (saved in argumentsArray)
    for (let i = 0; i < argumentsArray.length; i++) {
        this.push(argumentsArray[i]);
        allArgs.push(argumentsArray[i]);
    }
    // update numArgs
    numArgs += boundArgs.length;
    // pop off extra values (if args provided more than arity)
    let adjustedSp = this.sp - numArgs + fun.arity;
    // push missing args
    while (numArgs < fun.arity) {
        this.push(this.runtime.JSUndefined);
        allArgs.push(this.runtime.JSUndefined);
        numArgs++;
    }
    // manually set sp to where it should be
    this.sp = adjustedSp;
    // set argumentsArray as value at its reserved stack idx
    this.stack[idx - 1] = this.runtime.newArray(argumentsArray);
};

Vm.prototype.setArgumentsArray = function (fun, idx, numArgs) {
    // create an arguments array
    let argumentsArray = this.stack.slice(this.sp - numArgs, this.sp);
    // pop off extra values
    let adjustedSp = this.sp - numArgs + fun.arity;
    // push missing args
    let allArgsArray = Array.from(argumentsArray);
    while (numArgs < fun.arity) {
        this.push(this.runtime.JSUndefined);
        allArgsArray.push(this.runtime.JSUndefined);
        numArgs++;
    }
    // manually set sp to where it should be
    this.sp = adjustedSp;
    // set argumentsArray as value at its reserved stack idx
    this.stack[idx - 1] = this.runtime.newArray(argumentsArray);

    return allArgsArray;
};

Vm.prototype.initFunctionCall = function (fun, newFp, isConstructor) {
    let frame = new CallFrame(fun, newFp, this.currentFrame.env, isConstructor);

    this.frames.push(frame);
    this.currentFun = fun;
    this.currentFrame = frame;
};

Vm.prototype.return = function () {
    let returnValue = this.pop();
    let poppedFrame = this.popFrame();

    if (poppedFrame.isConstructor) {
        // replace returnValue with the special `this` supplied to constructors
        returnValue = this.stack[poppedFrame.fp + 1];
    }

    this.push(returnValue);
    return returnValue;
};

Vm.prototype.createFunction = function () {
    let fun = this.fetchConstant();
    this.push(fun);

    let vmFunction = fun.vmFunction;
    let numUpvars = vmFunction.upvarCount;

    // add upvars
    for (let i = 0; i < numUpvars; i++) {
        let isLocal = this.fetch() !== 0x00;
        let index = this.fetch();

        let upvar;
        if (isLocal) {
            upvar = this.captureUpvar(index);
        } else {
            upvar = this.currentFun.upvars[index];
        }

        vmFunction.upvars.push(upvar);
    }
};

Vm.prototype.captureUpvar = function (index) {
    let location = this.currentFrame.fp + index;

    let upvar;
    let i;
    for (i = this.openUpvars.length - 1; i >= 0; i--) {
        upvar = this.openUpvars[i];
        if (upvar.location < location) {
            break;
        } else if (upvar.location === location) {
            return upvar;
        }
    }

    upvar = { location: location, value: null };

    if (i === 0) {
        this.openUpvars.push(upvar);
    } else {
        this.openUpvars.splice(i, 0, upvar);
    }

    return upvar;
};

Vm.prototype.cmpNeq = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.neq(rhs, this.runtime));
};

Vm.prototype.cmpGt = function (strict) {
    let lhs = this.pop();
    let rhs = this.pop();

    if (strict) {
        this.push(lhs.gt(rhs, this.runtime));
    } else {
        this.push(lhs.geq(rhs, this.runtime));
    }
};

Vm.prototype.cmpLt = function (strict) {
    let lhs = this.pop();
    let rhs = this.pop();

    if (strict) {
        this.push(lhs.lt(rhs, this.runtime));
    } else {
        this.push(lhs.leq(rhs, this.runtime));
    }
};

Vm.prototype.swapTopTwo = function () {
    let a = this.pop();
    let b = this.pop();
    this.push(a);
    this.push(b);
};

Vm.prototype.setLocal = function () {
    let offset = this.fetch();
    this.stack[this.currentFrame.fp + offset] = this.peek();
    // this.stack[this.currentFrame.fp + offset] = this.pop();
};

Vm.prototype.pushInt = function () {
    this.push(this.runtime.newNumber(this.fetch()));
};

Vm.prototype.loop = function () {
    let jump = (this.fetch() << 8) | this.fetch();
    this.currentFrame.ip -= jump;
};

Vm.prototype.cmpEq = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.equal(rhs, this.runtime));
};

Vm.prototype.getLocal = function () {
    let offset = this.fetch();
    let value = this.stack[this.currentFrame.fp + offset];
    this.push(value);
};

Vm.prototype.jump = function (condition, unconditional) {
    let jump = (this.fetch() << 8) | this.fetch();

    if (unconditional || this.isTruthy(this.pop()) === condition) {
        this.currentFrame.ip += jump;
    }
};

Vm.prototype.setByValue = function () {
    // pop id
    let id = this.pop();
    // pop object
    let object = this.pop();
    // pop value
    let value = this.pop();

    if (object.objectType === JSObjectType.ARRAY && id.type === JSType.NUMBER) {
        return this.setArrayElem(object, id.value, value);
    } else if (object.objectType !== undefined) {
        return this.setObjectProp(object, id.value, value);
    }
};

Vm.prototype.setArrayElem = function (object, idx, value) {
    // array length is always offset 0 (invariant)
    let length = object.indexedValues[0].value;

    if (idx < length) {
        object.elements[idx] = value;
        this.push(value);
    } else {
        return setObjectProp(object, idx, value);
    }
};

Vm.prototype.setObjectProp = function (object, id, value) {
    // get shape
    let shape = object.shape;

    if (shape.shapeTable.hasOwnProperty(id)) {
        let offset = shape.shapeTable[id].offset;

        this.getOrSetId(object.indexedValues, offset, true, value);
    } else if (object.mappedValues.hasOwnProperty(id)) {
        this.getOrSetId(object.mappedValues, id, true, value);
    } else {
        // add property on object
        object.addProperty(id, value);
        // push value on top of stack
        this.push(value);
    }
};

Vm.prototype.getByValue = function () {
    // pop id
    let id = this.pop();
    // pop object
    let object = this.pop();
    if (object.objectType === JSObjectType.ARRAY && id.type === JSType.NUMBER) {
        return this.getArrayElem(object, id.value);
    } else if (object.type === JSType.STRING && id.type === JSType.NUMBER) {
        return this.getStringChar(object, id.value);
    } else {
        return this.getObjectProp(object, id.value);
    }
};

Vm.prototype.getStringChar = function (object, idx) {
    // strings always have a length property on
    // mappedValues (invariant)
    let length = object.mappedValues.length.value;

    if (idx < length) {
        this.push(this.runtime.newString(object.value[idx]));
    } else {
        this.push(this.runtime.JSUndefined);
    }
};

Vm.prototype.getArrayElem = function (object, idx) {
    // array length is always offset 0 (invariant)
    let length = object.indexedValues[0].value;

    if (idx < length) {
        this.push(object.elements[idx]);
    } else {
        return this.getObjectProp(object, idx);
    }
};

Vm.prototype.getObjectProp = function (object, id) {
    // get shape
    let shape = object.shape;

    if (shape.shapeTable.hasOwnProperty(id)) {
        let offset = shape.shapeTable[id].offset;

        this.getOrSetId(object.indexedValues, offset, false, null);
    } else if (object.mappedValues.hasOwnProperty(id)) {
        this.getOrSetId(object.mappedValues, id, false, null);
    } else {
        this.getFromProtoChain(object.proto, id);
    }
};

Vm.prototype.setById = function () {
    // pop object on which to set property
    let object = this.pop();

    if (object.objectType !== undefined) {
        // pop value
        let value = this.pop();
        // set property value
        this.cachedSet(object, value);
    } else {
        this.panic("not an object");
    }
};

Vm.prototype.getById = function () {
    // pop object off of the stack
    let object = this.pop();
    // get property value
    this.cachedGet(object);
};

Vm.prototype.cachedSet = function (object, value) {
    // get shape
    let shape = object.shape;
    // fetch id, shape index, and offset
    let id = this.fetchConstant().value;
    let cacheIdx = this.fetch();
    let cacheOffset = this.fetch();

    if (shape.cacheIdx === cacheIdx) {
        this.getOrSetId(object.indexedValues, cacheOffset, true, value);
    } else {
        // slow path
        if (shape.shapeTable.hasOwnProperty(id)) {
            // look up value in the indexedValues array and add to IC
            let offset = shape.shapeTable[id].offset;

            this.modifyCodeForIC(this.inlineCache.addShape(shape), offset);

            this.getOrSetId(object.indexedValues, offset, true, value);
        } else if (object.mappedValues.hasOwnProperty(id)) {
            this.getOrSetId(object.mappedValues, id, true, value);
        } else {
            // add property on object
            object.addProperty(id, value);
            // push value on stack
            this.push(value);
        }
    }
};

Vm.prototype.cachedGet = function (object) {
    // get shape
    let shape = object.shape;
    // fetch id, shape index, and offset
    let id = this.fetchConstant().value;
    let cacheIdx = this.fetch();
    let cacheOffset = this.fetch();

    if (shape.cacheIdx === cacheIdx) {
        this.getOrSetId(object.indexedValues, cacheOffset, false, null);
    } else {
        // slow path
        if (shape.shapeTable.hasOwnProperty(id)) {
            // look up value in the indexedValues array and add to IC
            let offset = shape.shapeTable[id].offset;
            // modify IC
            this.modifyCodeForIC(this.inlineCache.addShape(shape), offset);

            this.getOrSetId(object.indexedValues, offset, false, null);
        } else if (object.mappedValues.hasOwnProperty(id)) {
            // look up mappedValues
            this.getOrSetId(object.mappedValues, id, false, null);
        } else {
            this.getFromProtoChain(object.proto, id);
        }
    }
};

Vm.prototype.getFromProtoChain = function (proto, id) {
    let shape;

    while (proto !== null && proto !== undefined) {
        shape = proto.shape;
        if (shape.shapeTable.hasOwnProperty(id)) {
            this.push(proto.indexedValues[shape.shapeTable[id].offset]);
            return;
        } else if (proto.mappedValues.hasOwnProperty(id)) {
            this.push(proto.mappedValues.hasOwnProperty(id));
            return;
        } else {
            // sup dawg i heard you liked protos - so i set proto to proto on proto
            proto = proto.proto;
        }
    }
    // not found so push undefined
    this.push(this.runtime.JSUndefined);
};

Vm.prototype.getOrSetId = function (data, id, setById, value) {
    if (setById) {
        data[id] = value;
        this.push(value);
    } else {
        this.push(data[id]);
    }
};

Vm.prototype.modifyCodeForIC = function (cacheIdx, cacheOffset) {
    this.currentFun.code[this.currentFrame.ip - 1] = cacheOffset;
    this.currentFun.code[this.currentFrame.ip - 2] = cacheIdx;
};

Vm.prototype.newArray = function () {
    let numElements = this.fetchConstant();
    let elements = [];

    for (let i = 0; i < numElements; i++) {
        elements.push(this.pop());
    }

    this.push(this.runtime.newArray(elements));
};

Vm.prototype.newObject = function () {
    let numProperties = this.fetchConstant();

    let object = this.runtime.newEmptyObject();

    let key, value;
    for (let i = 0; i < numProperties; i++) {
        key = this.pop();
        value = this.pop();
        object.addProperty(key, value);
    }

    this.push(object);
};

Vm.prototype.add = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.add(rhs, this.runtime));
};

Vm.prototype.sub = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.sub(rhs, this.runtime));
};

Vm.prototype.mul = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.mul(rhs, this.runtime));
};

Vm.prototype.div = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs.div(rhs, this.runtime));
};

Vm.prototype.pushThis = function () {
    // `this` is always set at fp + 1 in
    // `callFunction` and `callMethod` (invariant)
    let value = this.stack[this.currentFrame.fp + 1];
    this.push(value);
};

Vm.prototype.pushConstant = function () {
    let value = this.fetchConstant();
    this.push(value);
};

//------------------------------------------------------------------
// VM - utils
//------------------------------------------------------------------

Vm.prototype.popFrame = function () {
    let poppedFrame = this.frames.pop();
    // update currentFrame and currentFun
    let frame = this.frames[this.frames.length - 1];
    this.currentFrame = frame;
    this.currentFun = frame.fun;
    // close popped functions upvars
    this.closeUpvars(poppedFrame.fp);
    // reset sp
    this.sp = poppedFrame.fp;

    return poppedFrame;
};

Vm.prototype.isTruthy = function (value) {
    if (value.type === JSType.STRING) {
        return value.value !== "";
    } else if (value.type === JSType.NUMBER) {
        return value.value !== 0;
    } else if (value.type === JSType.BOOLEAN) {
        return value.value;
    } else {
        return value.type !== JSType.NULL && value.type !== JSType.UNDEFINED;
    }
};

/** Fetch constant */
Vm.prototype.fetchConstant = function () {
    let index = this.fetch();

    if (this.currentFun.constants.length <= index) {
        this.panic("Invalid constant table index.");
    }

    return this.currentFun.constants[index];
};

/** Fetch next opcode */
Vm.prototype.fetch = function () {
    return this.currentFun.code[this.currentFrame.ip++];
};

Vm.prototype.panicTrace = function () {
    while (this.frames.length > 0) {
        console.error("at " + this.frames.pop().fun.name);
    }
};

Vm.prototype.stackTrace = function (value, trace) {
    let lines = [toString(value)];

    for (let i = 0; i < trace.length; i++) {
        lines.push("    at: " + trace[i]);
    }

    throw lines.join("\n");
};

/** Panic */
Vm.prototype.panic = function (msg) {
    this.panicTrace();
    throw Error(msg);
};

Vm.prototype.peek = function () {
    if (this.sp > 0) {
        return this.stack[this.sp - 1];
    } else {
        this.panic("Stackunderflow");
    }
};

/** Push value on top of stack */
Vm.prototype.push = function (value) {
    // console.log("Stack before push: " + this.stack.slice(0, 4));
    if (this.sp < STACK_MAX) {
        this.stack[this.sp++] = value;
    } else {
        this.panic("Stackoverflow");
    }
};

/** Pop value from top of stack and return it */
Vm.prototype.pop = function () {
    // console.log("Stack before pop: " + this.stack.slice(0, 4));
    if (this.sp > 0) {
        let value = this.stack[--this.sp];
        return value;
    } else {
        this.panic("Stackunderflow");
    }
};
