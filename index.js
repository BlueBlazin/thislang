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
    POP:              0x00,
    PUSH_CONSTANT:    0x01,
    PUSH_TRUE:        0x02,
    PUSH_FALSE:       0x03,
    PUSH_NULL:        0x04,
    PUSH_THIS:        0x05,
    ADD:              0x06,
    SUB:              0x07,
    MUL:              0x08,
    DIV:              0x09,
    NEW_OBJECT:       0x0A,
    NEW_ARRAY:        0x0B,
    GET_BY_ID:        0x0C,
    SET_BY_ID:        0x0D,
    GET_BY_VALUE:     0x0E,
    SET_BY_VALUE:     0x0F,
    JUMP_IF_FALSE:    0x10,
    JUMP:             0x11,
    PUSH_UNDEFINED:   0x12,
    GET_LOCAL:        0x13,
    GET_FROM_ENV:     0x14,
    DUPLICATE:        0x15,
    CMP_EQ:           0x16,
    JUMP_IF_TRUE:     0x17,
    LOOP:             0x18,
    PUSH_INT:         0x19,
    SET_LOCAL:        0x1A,
    SET_FROM_ENV:     0x1B,
    SWAP_TOP_TWO:     0x1C,
    CMP_LT:           0x1E,
    CMP_LEQ:          0x1F,
    CMP_GT:           0x20,
    CMP_GEQ:          0x21,
    CMP_NEQ:          0x22,
};

//==================================================================
// Compiler
//==================================================================

/** Bytecode Compiler */
function Compiler() {
    this.function = new VMFunction();
    this.scopeDepth = 0;
    this.locals = [{ name: "", depth: 0, isCaptured: false, ready: true }];
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
            return this.statement(ast);
        case AstType.LET_DCLR:
            return this.letDclr(ast);
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
            return this.whileStmt(ast);
        default:
            this.panic(ast.type);
    }
};

Compiler.prototype.whileStmt = function (ast) {
    // record next position for looping
    let loopStart = this.function.code.length;
    // compile test
    this.expression(ast.test);
    // duplicate and jump if not equal
    // this.emitByte(Opcodes.DUPLICATE);
    let jumpIdx = this.emitJump(Opcodes.JUMP_IF_FALSE);
    // compile body
    this.statement(ast.body);
    // loop back
    this.emitLoop(loopStart);
    // patch jump
    this.patchJump(jumpIdx);
};

Compiler.prototype.statementList = function (statements) {
    for (let i = 0; i < statements.length; i++) {
        this.stmtOrDclr(statements[i]);
    }
};

Compiler.prototype.switchStmt = function (ast) {
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
        default:
            this.panic("in expression");
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
        // duplicate value since it will be popped by the set op
        this.emitByte(Opcodes.DUPLICATE);
        // set variable
        this.setLeftHandSideExpr(ast.argument);
    } else {
        // post inc (a++)

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
    }
    // emit set opcode
    this.setLeftHandSideExpr(ast.left);
};

Compiler.prototype.setLeftHandSideExpr = function (ast) {
    if (ast.type === AstType.IDENTIFIER) {
        this.getOrSetId(ast.value, false);
    } else {
        // TODO: member expr
    }
};

Compiler.prototype.identifier = function (ast) {
    this.getOrSetId(ast.value, true);
};

Compiler.prototype.getOrSetId = function (name, getOp) {
    let idx;

    if ((idx = this.resolveLocal(name))) {
        // statically resolved local variable
        if (getOp) {
            this.emitBytes([Opcodes.GET_LOCAL, idx]);
        } else {
            this.emitBytes([Opcodes.SET_LOCAL, idx]);
        }
    } else {
        // global variable
        idx = this.addConstant(name);

        if (getOp) {
            this.emitBytes([Opcodes.GET_FROM_ENV, idx]);
        } else {
            this.emitBytes([Opcodes.SET_FROM_ENV, idx]);
        }
    }
};

Compiler.prototype.resolveLocal = function (name) {
    let local;
    for (let idx = this.locals.length - 1; idx >= 0; idx--) {
        local = this.locals[idx];

        if (local.name === name) {
            if (!local.ready) {
                this.panic("Cannot access " + name + " before initialization.");
            }

            return idx;
        }
    }
};

Compiler.prototype.staticMemberExpr = function (ast) {
    // compile lhs of `.`
    this.expression(ast.object);
    // emit opcode
    this.emitByte(Opcodes.GET_BY_ID);
    // emit constant index of property id
    let index = this.addConstant(ast.property);
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
    // compile RHS
    this.expression(ast.rhs);
    // compile LHS
    this.expression(ast.lhs);
    // emit binary opcode
    switch (ast.operator) {
        case "+":
            return this.emitByte(Opcodes.ADD);
        case "-":
            return this.emitByte(Opcodes.SUB);
        case "*":
            return this.emitByte(Opcodes.MUL);
        case "/":
            return this.emitByte(Opcodes.DIV);
        case "<":
            return this.emitByte(Opcodes.CMP_LT);
        case "<=":
            return this.emitByte(Opcodes.CMP_LEQ);
        case ">":
            return this.emitByte(Opcodes.CMP_GT);
        case ">=":
            return this.emitByte(Opcodes.CMP_GEQ);
        case "==":
        case "===":
            return this.emitByte(Opcodes.CMP_EQ);
        case "!=":
        case "!==":
            return this.emitByte(Opcodes.CMP_NEQ);
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
    let value = ast.value;

    if (value < 0xff) {
        this.emitBytes([Opcodes.PUSH_INT, value]);
    } else {
        this.emitPushConstant(value);
    }
};

//------------------------------------------------------------------
// Compiler - utils
//------------------------------------------------------------------

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
                // TODO
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
        String(state.i).padStart(5, "0") + ":    " + name.padEnd(14, " ")
    );
    state.i++;
}

function constInstr(name, code, constants, state) {
    let idx = code[state.i + 1];
    state.disassembly.push(
        String(state.i).padStart(5, "0") +
            ":    " +
            name.padEnd(14, " ") +
            " " +
            constants[idx]
    );
    state.i += 2;
}

function literalInstr(name, code, state) {
    let idx = code[state.i + 1];
    state.disassembly.push(
        String(state.i).padStart(5, "0") +
            ":    " +
            name.padEnd(14, " ") +
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
            name.padEnd(14, " ") +
            " -> " +
            String(idx).padStart(5, "0")
    );
    state.i += 3;
}

function dis(code, constants) {
    let state = { i: 0, disassembly: [] };

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
            default:
                throw Error("Unknown opcode");
        }
    }

    console.log(state.disassembly.join("\n"));
}

//==================================================================
// Runtime
//==================================================================

// prettier-ignore
let JSType = {
    NUMBER:     0x00,
    BOOL:       0x01,
    NULL:       0x02,
    UNDEFINED:  0x03,
    BOOL:       0x04,
    OBJECT:     0x05,
    STRING:     0x06,
};

// prettier-ignore
let JSObjectType = {
    ORDINARY:  0x00,
    ARRAY:     0x01,
    FUNCTION:  0x02,
    NATIVE:    0x03,
}

function Shape(key, offset, parent) {
    this.parent = parent;
    this.key = key;
    this.offset = offset;
    this.transitions = {};
    this.shapeTable = {};
}

Shape.prototype.transition = function (key) {
    if (this.transitions[key] !== undefined) {
        return this.transitions[key];
    }

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

function JSObject(shape) {
    this.type = JSType.OBJECT;
    this.objectType = JSObjectType.ORDINARY;

    this.indexedValues = [];

    this.shape = shape;
}

JSObject.prototype.set = function (key, value) {
    this.shape = this.shape.transition(key);
    this.indexedValues.push(value);
};

function Runtime() {
    // primitive constants
    this.JSNull = { type: JSType.NULL };
    this.JSUndefined = { type: JSType.UNDEFINED };
    this.JSTrue = { type: JSType.BOOL };
    this.JSFalse = { type: JSType.BOOL };

    this.emptyObjectShape = new Shape("", null, null);
}

Runtime.prototype.newEmptyObject = function () {
    return new JSObject(this.emptyObjectShape);
};

//------------------------------------------------------------------
// Runtime - VMFunction
//------------------------------------------------------------------

function VMFunction() {
    // bytecode associated with this function
    this.code = [];
    // constants associated with this function
    this.constants = [];
    // instruction pointer
    this.ip = 0;
    // frame pointer
    this.fp = 0;
    // scope for dynamically resolved variables
    this.scope = {};
}

//------------------------------------------------------------------
// Runtime - Inline Cache
//------------------------------------------------------------------

function InlineCache() {
    this.cache = {};
    this.freed = [];
    this.i = 0;
}

InlineCache.prototype.addShape = function (shape) {
    // TOOD: use freed if available
    this.cache[this.i] = shape;
    shape.cacheIdx = this.i;
    return this.i++;
};

InlineCache.prototype.getShape = function (key) {
    return this.cache[key];
};

//==================================================================
// VM
//==================================================================

function Vm(fun) {
    // current function
    this.fun = fun;
    // stack pointer
    // TODO: hard coding sp to 1 for now but of course this
    // should happen naturally as slot[0] will hold `this`
    this.sp = 1;
    this.stack = initArray(STACK_MAX, 0);
    this.runtime = new Runtime();
    this.inlineCache = new InlineCache();
}

/** Run VM */
Vm.prototype.run = function () {
    // main interpreter loop
    while (this.fun.ip < this.fun.code.length) {
        switch (this.fetch()) {
            case Opcodes.POP:
                console.log("Popping: ", this.pop());
                break;
            case Opcodes.PUSH_CONSTANT:
                this.pushConstant();
                break;
            case Opcodes.PUSH_TRUE:
                this.push(true);
                break;
            case Opcodes.PUSH_FALSE:
                this.push(false);
                break;
            case Opcodes.PUSH_NULL:
                this.push(null);
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
            case Opcodes.GET_BY_ID:
                this.getById();
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
                this.panic("Unimplemented.");
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
                this.panic("Unimplemented.");
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
        }
    }
};

//------------------------------------------------------------------
// VM - instructions
//------------------------------------------------------------------

Vm.prototype.cmpNeq = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    // TODO: do it properly for different types
    this.push(lhs !== rhs);
};

Vm.prototype.cmpGt = function (strict) {
    let lhs = this.pop();
    let rhs = this.pop();

    // TODO: do it properly for different types
    if (strict) {
        this.push(lhs > rhs);
    } else {
        this.push(lhs >= rhs);
    }
};

Vm.prototype.cmpLt = function (strict) {
    let lhs = this.pop();
    let rhs = this.pop();

    // TODO: do it properly for different types
    if (strict) {
        this.push(lhs < rhs);
    } else {
        this.push(lhs <= rhs);
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
    this.stack[this.fun.fp + offset] = this.peek();
};

Vm.prototype.pushInt = function () {
    // Use JSNumber
    this.push(this.fetch());
};

Vm.prototype.loop = function () {
    let jump = (this.fetch() << 8) | this.fetch();
    this.fun.ip -= jump;
};

Vm.prototype.cmpEq = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    // TODO: do it properly for different types
    this.push(this.equal(lhs, rhs));
};

Vm.prototype.getLocal = function () {
    let offset = this.fetch();
    let value = this.stack[this.fun.fp + offset];
    this.push(value);
};

Vm.prototype.jump = function (condition, unconditional) {
    let jump = (this.fetch() << 8) | this.fetch();

    if (unconditional || this.isTruthy(this.pop()) === condition) {
        this.fun.ip += jump;
    }
};

Vm.prototype.getById = function () {
    // pop object off of the stack
    let object = this.pop();
    let shape = object.shape;
    // pop id, shape index, and offset
    let id = this.fetchConstant();
    let cacheIdx = this.fetch();
    let cacheOffset = this.fetch();

    if (shape.cacheIdx === cacheIdx) {
        // fast path
        this.push(object.indexedValues[cacheOffset]);
    } else {
        // slow path
        if (shape.shapeTable[id] !== undefined) {
            let offset = object.shape.shapeTable[id].offset;

            this.modifyCodeForIC(this.inlineCache.addShape(shape), offset);

            this.push(object.indexedValues[offset]);
        } else {
            // walk the prototype chain of object to search
            // for property
            // TODO: implement prototype search
            this.push(this.runtime.JSUndefined);
        }
    }
};

Vm.prototype.modifyCodeForIC = function (cacheIdx, cacheOffset) {
    this.fun.code[this.fun.ip - 1] = cacheOffset;
    this.fun.code[this.fun.ip - 2] = cacheIdx;
};

Vm.prototype.newObject = function () {
    let numProperties = this.fetchConstant();

    let object = this.runtime.newEmptyObject();

    let key, value;
    for (let i = 0; i < numProperties; i++) {
        key = this.pop();
        value = this.pop();
        // object.shape = object.shape.transition(key);
        // object.indexedValues.push(value);
        object.set(key, value);
    }

    this.push(object);
};

Vm.prototype.add = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs + rhs);
};

Vm.prototype.sub = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs - rhs);
};

Vm.prototype.mul = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs * rhs);
};

Vm.prototype.div = function () {
    let lhs = this.pop();
    let rhs = this.pop();

    this.push(lhs / rhs);
};

Vm.prototype.pushConstant = function () {
    let value = this.fetchConstant();
    this.push(value);
};

//------------------------------------------------------------------
// VM - utils
//------------------------------------------------------------------

Vm.prototype.equal = function (lhs, rhs) {
    // TODO: replace with JSTrue
    return lhs === rhs;
};

Vm.prototype.isTruthy = function (value) {
    // TODO: implement this properly
    return !!value;
};

/** Fetch constant */
Vm.prototype.fetchConstant = function () {
    let index = this.fetch();

    if (this.fun.constants.length <= index) {
        this.panic("Invalid constant table index.");
    }

    return this.fun.constants[index];
};

/** Fetch next opcode */
Vm.prototype.fetch = function () {
    return this.fun.code[this.fun.ip++];
};

/** Panic */
Vm.prototype.panic = function (msg) {
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

//==================================================================
// Main
//==================================================================

(function () {
    let parseBtn = document.getElementById("parse-btn");
    let compileBtn = document.getElementById("compile-btn");
    let runBtn = document.getElementById("run-btn");

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

    runBtn.onclick = function () {
        let textArea = document.getElementById("source-code");
        let source = textArea.value;

        let parser = new Parser(source);
        let ast = parser.parse();

        let compiler = new Compiler();
        let fun = compiler.compile(ast);

        let vm = new Vm(fun);
        vm.run();
    };
})();
