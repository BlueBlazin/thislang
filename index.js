"use strict";

//==================================================================
// Constants
//==================================================================

// flag for debug logging
let DEBUG_VM = true;
let DEBUG_PARSER = false;

let STACK_MAX = 1024;
let MAX_NUM_CONSTANTS = 256;

//==================================================================
// Helpers
//==================================================================

/** Returns an array of specified size filled with specified value */
let initArray = function (size, fillValue) {
    let arr = [];

    for (let i = 0; i < size; i++) {
        arr.push(fillValue);
    }

    return arr;
};

let dbg = function (flag, args) {
    if (flag) {
        console.log(...args);
    }
};

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
        case "case":
        case "else":
        case "this":
        case "break":
        case "while":
        case "return":
        case "switch":
        case "typeof":
        case "continue":
        case "default":
        case "function":
        case "undefined":
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
    BLOCK_STMT: "BLOCK_STMT",
    CONTINUE_STMT: "CONTINUE_STMT",
    BREAK_STMT: "BREAK_STMT",
    RETURN_STMT: "RETURN_STMT",
    IF_STMT: "IF_STMT",
    FOR_STMT: "FOR_STMT",
    WHILE_STMT: "WHILE_STMT",
    SWITCH_STMT: "SWITCH_STMT",
    THROW_STMT: "THROW_STMT",
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
    dbg(DEBUG_PARSER, ["statementOrDeclaration"]);
    let token = this.peek(0);

    if (token.type === TokenType.PUNCTUATOR) {
        switch (token.value) {
            case "{":
                return this.blockStmt();
            default:
                this.panic(token.value);
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
                return this.statement();
            default:
                return this.expressionStmt();
        }
    }

    return this.expressionStmt();
};

Parser.prototype.statement = function () {
    dbg(DEBUG_PARSER, ["statement"]);
    let token = this.peek(0);

    if (token.type === TokenType.PUNCTUATOR) {
        switch (token.value) {
            case "{":
                return this.blockStmt();
            default:
                this.panic(token.value);
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
            default:
                return this.expressionStmt();
        }
    }

    return this.expressionStmt();
};

Parser.prototype.blockStmt = function () {
    dbg(DEBUG_PARSER, ["blockStmt"]);
    // consume `{`
    let line = this.advance().line;

    let body = this.statementList();

    this.expect(TokenType.PUNCTUATOR, "}");

    return { type: AstType.BLOCK_STMT, body: body, line: line };
};

Parser.prototype.ifStmt = function () {
    dbg(DEBUG_PARSER, ["ifStmt"]);
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
    dbg(DEBUG_PARSER, ["forStmt"]);
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
    dbg(DEBUG_PARSER, ["whileStmt"]);
    // consume `while`
    let line = this.advance().line;

    this.expect(TokenType.PUNCTUATOR, "(");
    let test = this.expression();
    this.expect(TokenType.PUNCTUATOR, ")");

    let body = this.statement();

    return { type: AstType.WHILE_STMT, test: test, body: body, line: line };
};

Parser.prototype.switchStmt = function () {
    dbg(DEBUG_PARSER, ["switchStmt"]);
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
                consequent = this.statement();
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
                consequent: this.statement(),
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

Parser.prototype.continueStmt = function () {
    dbg(DEBUG_PARSER, ["continueStmt"]);
    if (!this.inIteration) {
        this.panic("Illegal continue statement");
    }

    // consume `continue`
    let line = this.advance().line;
    this.expectSemicolon();
    return { type: AstType.CONTINUE_STMT, line: line };
};

Parser.prototype.breakStmt = function () {
    dbg(DEBUG_PARSER, ["breakStmt"]);
    if (!(this.inIteration || this.inSwitch)) {
        this.panic("Illegal break statement");
    }

    // consume `break`
    let line = this.advance().line;
    this.expectSemicolon();
    return { type: AstType.BREAK_STMT, line: line };
};

Parser.prototype.returnStmt = function () {
    dbg(DEBUG_PARSER, ["returnStmt"]);
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
    dbg(DEBUG_PARSER, ["throwStmt"]);
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
    dbg(DEBUG_PARSER, ["functionDclr"]);
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
    dbg(DEBUG_PARSER, ["letDclr"]);
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
    dbg(DEBUG_PARSER, ["expressionStmt"]);
    let expression = this.expression();
    this.expectSemicolon();
    return {
        type: AstType.EXPRESSION_STMT,
        expression: expression,
        line: expression.line,
    };
};

Parser.prototype.statementList = function () {
    dbg(DEBUG_PARSER, ["statementList"]);
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
    dbg(DEBUG_PARSER, ["expression"]);
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
    dbg(DEBUG_PARSER, ["assignmentExpr"]);
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
    dbg(DEBUG_PARSER, ["conditionalExpr"]);
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
    dbg(DEBUG_PARSER, ["binaryExpr"]);
    let lhs = this.unaryExpr();

    return this.precedenceClimbing(lhs, 1);
};

Parser.prototype.precedenceClimbing = function (lhs, precedence) {
    dbg(DEBUG_PARSER, ["precedenceClimbing"]);
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
    dbg(DEBUG_PARSER, ["isBinaryOp"]);
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
    dbg(DEBUG_PARSER, ["precedence"]);
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
    dbg(DEBUG_PARSER, ["unaryExpr"]);
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
    dbg(DEBUG_PARSER, ["isUnaryOp"]);
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
    dbg(DEBUG_PARSER, ["updateExpr"]);
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
    dbg(DEBUG_PARSER, ["leftHandSideExpr"]);
    let nextToken = this.peek(0);

    if (nextToken.type === TokenType.KEYWORD && nextToken.value === "new") {
        return this.newExpr();
    } else {
        return this.callExpr();
    }
};

Parser.prototype.newExpr = function () {
    dbg(DEBUG_PARSER, ["newExpr"]);
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
    dbg(DEBUG_PARSER, ["callExpr"]);
    let expr = this.memberExpr();

    return this.callTail(expr);
};

Parser.prototype.memberExpr = function () {
    dbg(DEBUG_PARSER, ["memberExpr"]);
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
    dbg(DEBUG_PARSER, ["callTail"]);
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
            let property = this.identifier();
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
    dbg(DEBUG_PARSER, ["arguments"]);
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
            if (nextToken.value !== ")" && nextToken.value !== "...") {
                this.panic("Unexpected token " + nextToken.value);
            }
        }

        return argument;
    }

    function predicate(token) {
        return token.value !== ")" && token.value !== "...";
    }

    let args = this.parseWithWhile(parseFn.bind(this), predicate);

    let nextToken = this.peek(0);
    if (nextToken.type === TokenType.PUNCTUATOR && nextToken.value === "...") {
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
    dbg(DEBUG_PARSER, ["primary"]);
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
                this.advance();
                let expr = this.expression();
                this.expect(")");
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
            } else {
                this.panic(token.value);
            }
        default:
            this.panic(token.value);
    }
};

Parser.prototype.function = function () {
    dbg(DEBUG_PARSER, ["function"]);
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
    dbg(DEBUG_PARSER, ["parameters"]);
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
    dbg(DEBUG_PARSER, ["functionBody"]);
    this.expect(TokenType.PUNCTUATOR, "{");

    let body = this.statementList();

    this.expect(TokenType.PUNCTUATOR, "}");

    return body;
};

Parser.prototype.object = function () {
    dbg(DEBUG_PARSER, ["object"]);
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
    dbg(DEBUG_PARSER, ["propertyName"]);
    let token = this.peek(0);

    switch (token.type) {
        case TokenType.IDENTIFIER:
            return this.identifier();
        case TokenType.STRING:
        case TokenType.NUMBER:
            return this.literal();
        default:
            this.panic(token.value);
    }
};

Parser.prototype.array = function () {
    dbg(DEBUG_PARSER, ["array"]);
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
    dbg(DEBUG_PARSER, ["literal"]);
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
    dbg(DEBUG_PARSER, ["identifier"]);
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
        this.advance();
    } else if (nextToken.line === this.line) {
        // only perform automatic semicolon insertion if next token is `}`
        if (
            (nextToken.type === TokenType.PUNCTUATOR &&
                nextToken.value === "}") ||
            nextToken.type === TokenType.EOF
        ) {
            this.advance();
        } else {
            this.panic(nextToken.value);
        }
    } else {
        // perform automatic semicolon insertion
        this.advance();
    }
};

Parser.prototype.parseWithWhile = function (parseFn, predicate) {
    dbg(DEBUG_PARSER, ["parseWithWhile"]);
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
        this.panic(nextToken.value);
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
    POP:             0x00,
    PUSH_CONSTANT:   0x01,
    PUSH_TRUE:       0x02,
    PUSH_FALSE:      0x03,
    PUSH_NULL:       0x04,
    PUSH_THIS:       0x05,
    ADD:             0x06,
    SUB:             0x07,
    MUL:             0x08,
    DIV:             0x09,
};

//==================================================================
// Runtime
//==================================================================

function JSFunction(name) {
    this.name = name;
    // -------------------------------------------
    // Internal metadata
    // -------------------------------------------
    // bytecode associated with this function
    this.code = [];
    // constants associated with this function
    this.constants = [];
    // instruction pointer
    this.ip = 0;
    // frame pointer
    this.fp = 0;
}

//==================================================================
// Compiler
//==================================================================

/** Bytecode Compiler */
function Compiler() {
    this.function = new JSFunction("<main>");
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
            return this.expressionStmt(ast);
        default:
            this.panic();
    }
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
        case AstType.NUMBER:
        case AstType.STRING:
            return this.number(ast);
        case AstType.BOOLEAN:
            return this.boolean(ast);
        case AstType.NULL:
            return this.emitByte(Opcodes.PUSH_NULL);
        case AstType.THIS:
            return this.emitByte(Opcodes.PUSH_THIS);
        case AstType.BINARY_EXPR:
            return this.binary(ast);
        default:
            this.panic("in expression");
    }
};

Compiler.prototype.binary = function (ast) {
    // compile LHS
    this.expression(ast.lhs);
    // compile RHS
    this.expression(ast.rhs);
    // push operator
    switch (ast.operator) {
        case "+":
            return this.emitByte(Opcodes.ADD);
        case "-":
            return this.emitByte(Opcodes.SUB);
        case "*":
            return this.emitByte(Opcodes.MUL);
        case "/":
            return this.emitByte(Opcodes.DIV);
        default:
            this.panic("Invalid binary operator " + ast.operator);
    }
};

Compiler.prototype.boolean = function (ast) {
    if (ast.value) {
        this.emitByte(Opcodes.PUSH_TRUE);
    } else {
        this.emitByte(Opcodes.PUSH_FALSE);
    }
};

Compiler.prototype.number = function (ast) {
    // add value to the constant table
    let index = this.addConstant(ast.value);
    // push that value (by retrieving it using the constant idx)
    // onto the stack
    this.emitBytes([Opcodes.PUSH_CONSTANT, index]);
};

//------------------------------------------------------------------
// Compiler - utils
//------------------------------------------------------------------

Compiler.prototype.panic = function (msg) {
    throw Error("compiler panicked on: " + msg);
};

//------------------------------------------------------------------
// Compiler - codegen
//------------------------------------------------------------------

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
        String(state.line).padStart(5, "0") + ":    " + name
    );
    state.i++;
    state.line++;
}

function constInstr(name, code, constants, state) {
    let idx = code[state.i + 1];
    state.disassembly.push(
        String(state.line).padStart(5, "0") +
            ":    " +
            name +
            " " +
            constants[idx]
    );
    state.i += 2;
    state.line++;
}

function dis(code, constants) {
    let state = { i: 0, line: 0, disassembly: [] };

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
        }
    }

    console.log(state.disassembly.join("\n"));
}

//==================================================================
// VM
//==================================================================

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

//------------------------------------------------------------------
// VM - instructions
//------------------------------------------------------------------

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

//------------------------------------------------------------------
// VM - utils
//------------------------------------------------------------------

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

//==================================================================
// Main
//==================================================================

(function () {
    let parseBtn = document.getElementById("parse-btn");
    let compileBtn = document.getElementById("compile-btn");

    parseBtn.onclick = function () {
        let textArea = document.getElementById("source-code");
        let source = textArea.value;
        let parser = new Parser(source);
        let ast = parser.parse();
        console.log("Successfully parsed!");
        console.log(JSON.stringify(ast, null, "  "));
    };

    compileBtn.onclick = function () {
        let textArea = document.getElementById("source-code");
        let source = textArea.value;
        let parser = new Parser(source);
        let ast = parser.parse();
        let compiler = new Compiler();
        let fun = compiler.compile(ast);
        dis(fun.code, fun.constants);
    };

    // let source = `1 + 1`;

    // let tokenizer = new Tokenizer(source);
    // let nextToken;
    // while (true) {
    //     nextToken = tokenizer.next();
    //     console.log(nextToken);
    //     if (nextToken.type === TokenType.EOF) {
    //         break;
    //     }
    // }

    // let parser = new Parser(source);
    // let ast = parser.parse();
    // console.log("Successfully parsed!");
    // console.log(source);
    // console.log(JSON.stringify(ast, null, "  "));
})();
